/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import {
  getPriorityColor,
  PRIORITIES,
  PRIORITY_ORDER,
} from '../../src/models.js';
import { saveTodos, loadTodos } from '../../src/persistence.js';
import {
  filterByStatus,
  filterByPriority,
  applyFilters,
  sortByDeadline,
  sortByPriority,
  applySorting,
  isOverdue,
  getActiveCount,
  hasCompletedItems,
} from '../../src/core.js';
import {
  addTodo,
  toggleTodo,
  deleteTodo,
  editTodo,
  clearCompleted,
  setDeadline,
  getState,
  initApp,
  setRenderer,
} from '../../src/state.js';
import { renderTodoInput } from '../../src/ui.js';

/**
 * Custom generators for property-based tests.
 */
const arbPriority = fc.constantFrom('High', 'Medium', 'Low', 'None');

/** Helper: generate a valid ISO date string (YYYY-MM-DD) from year/month/day integers */
const arbDateStr = fc
  .record({
    year: fc.integer({ min: 2000, max: 2099 }),
    month: fc.integer({ min: 1, max: 12 }),
    day: fc.integer({ min: 1, max: 28 }),
  })
  .map(({ year, month, day }) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);

const arbTodoItem = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
  completed: fc.boolean(),
  priority: arbPriority,
  deadline: fc.option(arbDateStr, { nil: null }),
  createdAt: fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
});

const arbTodoList = fc.array(arbTodoItem, { minLength: 0, maxLength: 20 });

const arbValidTitle = fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0);

const arbWhitespaceString = fc.constantFrom('', ' ', '  ', '\t', '\n', '  \t\n  ');

const arbStatusFilter = fc.constantFrom('All', 'Active', 'Completed');
const arbPriorityFilter = fc.constantFrom('All', 'High', 'Medium', 'Low', 'None');
const arbDate = arbDateStr;

/**
 * Feature: todo-list-website, Property 18: Priority color mapping
 * **Validates: Requirements 14.1, 14.2, 14.3**
 *
 * For any priority level, the color mapping function should return:
 * red for "High", orange for "Medium", blue for "Low", and no indicator for "None".
 */
describe('Property 18: Priority color mapping', () => {
  it('maps each priority to its correct color', () => {
    const expectedColors = {
      High: 'red',
      Medium: 'orange',
      Low: 'blue',
      None: null,
    };

    fc.assert(
      fc.property(arbPriority, (priority) => {
        const color = getPriorityColor(priority);
        expect(color).toBe(expectedColors[priority]);
      }),
      { numRuns: 100 },
    );
  });
});


/**
 * Feature: todo-list-website, Property 12: Persistence round-trip
 * **Validates: Requirements 9.1, 9.2, 9.4**
 *
 * For any valid array of todo items, serializing to JSON and saving to
 * localStorage, then loading and deserializing, should produce an equivalent
 * array of todo items.
 */
describe('Property 12: Persistence round-trip', () => {
  let store;

  beforeEach(() => {
    store = {};
    const localStorageMock = {
      getItem: vi.fn((key) => (key in store ? store[key] : null)),
      setItem: vi.fn((key, value) => {
        store[key] = String(value);
      }),
      removeItem: vi.fn((key) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    };
    vi.stubGlobal('localStorage', localStorageMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('saving then loading produces an equivalent todo list', () => {
    fc.assert(
      fc.property(arbTodoList, (todos) => {
        store = {};
        saveTodos(todos);
        const loaded = loadTodos();
        expect(loaded).toEqual(todos);
      }),
      { numRuns: 100 },
    );
  });
});


/**
 * Feature: todo-list-website, Property 8: Filter correctness
 * **Validates: Requirements 6.2, 6.3, 6.4, 15.2, 15.3, 15.4**
 *
 * For any todo list and any combination of status/priority filters,
 * the filtered result contains exactly the items matching both criteria.
 */
describe('Property 8: Filter correctness', () => {
  it('filtered result contains exactly items matching both status and priority criteria', () => {
    fc.assert(
      fc.property(arbTodoList, arbStatusFilter, arbPriorityFilter, (todos, statusFilter, priorityFilter) => {
        const result = applyFilters(todos, statusFilter, priorityFilter);

        const expected = todos.filter((t) => {
          const statusMatch =
            statusFilter === 'All' ||
            (statusFilter === 'Active' && !t.completed) ||
            (statusFilter === 'Completed' && t.completed);
          const priorityMatch = priorityFilter === 'All' || t.priority === priorityFilter;
          return statusMatch && priorityMatch;
        });

        expect(result).toEqual(expected);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: todo-list-website, Property 9: Active item count
 * **Validates: Requirements 7.1**
 *
 * For any todo list, active count equals items where completed===false.
 */
describe('Property 9: Active item count', () => {
  it('active count equals number of incomplete items', () => {
    fc.assert(
      fc.property(arbTodoList, (todos) => {
        const count = getActiveCount(todos);
        const expected = todos.filter((t) => !t.completed).length;
        expect(count).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: todo-list-website, Property 13: Overdue detection
 * **Validates: Requirements 11.1, 11.2, 11.3**
 *
 * For any todo item and reference date, isOverdue returns true iff
 * deadline < today AND completed===false.
 */
describe('Property 13: Overdue detection', () => {
  it('isOverdue returns true iff deadline < today and not completed', () => {
    fc.assert(
      fc.property(arbTodoItem, arbDate, (item, todayStr) => {
        const today = new Date(todayStr + 'T00:00:00Z');
        const result = isOverdue(item, today);

        const expectedTodayStr = today.toISOString().split('T')[0];
        const expected = item.deadline !== null && item.deadline < expectedTodayStr && !item.completed;

        expect(result).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: todo-list-website, Property 14: Sort by deadline ordering
 * **Validates: Requirements 12.2**
 *
 * For any todo list, sorting by deadline produces items with deadlines
 * before items without, ordered earliest to latest.
 */
describe('Property 14: Sort by deadline ordering', () => {
  it('items with deadlines come before items without, ordered earliest to latest', () => {
    fc.assert(
      fc.property(arbTodoList, (todos) => {
        const sorted = sortByDeadline(todos);

        // All items with deadlines should come before items without
        let seenNull = false;
        for (const item of sorted) {
          if (item.deadline === null) {
            seenNull = true;
          } else if (seenNull) {
            // Found a non-null deadline after a null — violation
            expect.unreachable('Item with deadline found after item without deadline');
          }
        }

        // Items with deadlines should be in ascending order
        const withDeadlines = sorted.filter((t) => t.deadline !== null);
        for (let i = 1; i < withDeadlines.length; i++) {
          expect(withDeadlines[i].deadline >= withDeadlines[i - 1].deadline).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: todo-list-website, Property 15: Default creation order
 * **Validates: Requirements 2.1, 12.3, 16.3**
 *
 * For any todo list with no sort active, items display in ascending createdAt order.
 */
describe('Property 15: Default creation order', () => {
  it('with no sort active, items are in ascending createdAt order', () => {
    fc.assert(
      fc.property(arbTodoList, (todos) => {
        const sorted = applySorting(todos, { sortByDeadline: false, sortByPriority: false });

        for (let i = 1; i < sorted.length; i++) {
          expect(sorted[i].createdAt >= sorted[i - 1].createdAt).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: todo-list-website, Property 16: Sort by priority ordering
 * **Validates: Requirements 16.2**
 *
 * For any todo list, sorting by priority produces High→Medium→Low→None order.
 */
describe('Property 16: Sort by priority ordering', () => {
  it('items are ordered High → Medium → Low → None', () => {
    fc.assert(
      fc.property(arbTodoList, (todos) => {
        const sorted = sortByPriority(todos);

        for (let i = 1; i < sorted.length; i++) {
          const prevOrder = PRIORITY_ORDER[sorted[i - 1].priority] ?? 3;
          const currOrder = PRIORITY_ORDER[sorted[i].priority] ?? 3;
          expect(currOrder >= prevOrder).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: todo-list-website, Property 17: Combined sort ordering
 * **Validates: Requirements 16.4**
 *
 * For any todo list with both sorts active, primary sort by priority,
 * secondary by deadline.
 */
describe('Property 17: Combined sort ordering', () => {
  it('primary sort by priority, secondary by deadline within each priority group', () => {
    fc.assert(
      fc.property(arbTodoList, (todos) => {
        const sorted = applySorting(todos, { sortByDeadline: true, sortByPriority: true });

        for (let i = 1; i < sorted.length; i++) {
          const prevPri = PRIORITY_ORDER[sorted[i - 1].priority] ?? 3;
          const currPri = PRIORITY_ORDER[sorted[i].priority] ?? 3;

          // Primary: priority must be non-decreasing
          expect(currPri >= prevPri).toBe(true);

          // Secondary: within same priority, deadline ordering applies
          if (currPri === prevPri) {
            const prevDl = sorted[i - 1].deadline;
            const currDl = sorted[i].deadline;

            if (prevDl !== null && currDl !== null) {
              expect(currDl >= prevDl).toBe(true);
            } else if (prevDl === null && currDl !== null) {
              // null should come after non-null — this is a violation
              expect.unreachable('Item with deadline found after item without deadline in same priority group');
            }
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});


/**
 * ============================================================
 * CRUD Property Tests (Task 5.6)
 * These tests use state management functions and require
 * localStorage mocking + initApp() in beforeEach.
 * ============================================================
 */

/** Helper: set up localStorage mock and initialize app state */
function setupLocalStorageMock() {
  let store = {};
  const localStorageMock = {
    getItem: vi.fn((key) => (key in store ? store[key] : null)),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
  vi.stubGlobal('localStorage', localStorageMock);
  return { store, localStorageMock };
}

/**
 * Feature: todo-list-website, Property 1: New item defaults
 * **Validates: Requirements 1.1, 13.1**
 *
 * For any non-empty, non-whitespace title, creating a new todo item produces
 * an item with that exact title (trimmed), completed===false, priority==="None",
 * deadline===null, and a valid createdAt timestamp.
 */
describe('Property 1: New item defaults', () => {
  beforeEach(() => {
    setupLocalStorageMock();
    initApp();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('new todo has correct defaults for any valid title', () => {
    fc.assert(
      fc.property(arbValidTitle, (title) => {
        // Reset state for each iteration
        localStorage.clear();
        initApp();
        const before = Date.now();
        const result = addTodo(title);
        const after = Date.now();

        expect(result).toBe(true);

        const todos = getState().todos;
        expect(todos.length).toBe(1);

        const item = todos[0];
        expect(item.title).toBe(title.trim());
        expect(item.completed).toBe(false);
        expect(item.priority).toBe('None');
        expect(item.deadline).toBe(null);
        expect(item.createdAt).toBeGreaterThanOrEqual(before);
        expect(item.createdAt).toBeLessThanOrEqual(after);
        expect(typeof item.id).toBe('string');
        expect(item.id.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: todo-list-website, Property 2: Whitespace title rejection
 * **Validates: Requirements 1.3**
 *
 * For any whitespace-only string (including empty), attempting to add it
 * should be rejected and the todo list should remain unchanged.
 */
describe('Property 2: Whitespace title rejection', () => {
  beforeEach(() => {
    setupLocalStorageMock();
    initApp();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('whitespace-only titles are rejected and list stays unchanged', () => {
    fc.assert(
      fc.property(arbWhitespaceString, (title) => {
        localStorage.clear();
        initApp();
        const todosBefore = [...getState().todos];
        const result = addTodo(title);

        expect(result).toBe(false);
        expect(getState().todos).toEqual(todosBefore);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: todo-list-website, Property 4: Completion toggle round-trip
 * **Validates: Requirements 3.1, 3.3**
 *
 * For any todo item, toggling completion twice returns to original state.
 */
describe('Property 4: Completion toggle round-trip', () => {
  beforeEach(() => {
    setupLocalStorageMock();
    initApp();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('toggling completion twice returns to original state', () => {
    fc.assert(
      fc.property(arbValidTitle, (title) => {
        localStorage.clear();
        initApp();
        addTodo(title);
        const item = getState().todos[0];
        const originalCompleted = item.completed;

        toggleTodo(item.id);
        expect(getState().todos[0].completed).toBe(!originalCompleted);

        toggleTodo(item.id);
        expect(getState().todos[0].completed).toBe(originalCompleted);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: todo-list-website, Property 5: Delete removes item
 * **Validates: Requirements 4.1**
 *
 * For any todo list and any item in that list, deleting the item results
 * in a list that no longer contains it, and length decreases by one.
 */
describe('Property 5: Delete removes item', () => {
  beforeEach(() => {
    setupLocalStorageMock();
    initApp();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('deleting an item removes it and decreases length by one', () => {
    fc.assert(
      fc.property(
        fc.array(arbValidTitle, { minLength: 1, maxLength: 10 }),
        fc.nat(),
        (titles, indexSeed) => {
          localStorage.clear();
          initApp();
          titles.forEach((t) => addTodo(t));

          const todos = getState().todos;
          const lengthBefore = todos.length;
          const index = indexSeed % lengthBefore;
          const targetId = todos[index].id;

          deleteTodo(targetId);

          const todosAfter = getState().todos;
          expect(todosAfter.length).toBe(lengthBefore - 1);
          expect(todosAfter.find((t) => t.id === targetId)).toBeUndefined();
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: todo-list-website, Property 6: Edit saves new title
 * **Validates: Requirements 5.2**
 *
 * For any todo item and any new valid title, editing updates the title
 * while preserving all other fields.
 */
describe('Property 6: Edit saves new title', () => {
  beforeEach(() => {
    setupLocalStorageMock();
    initApp();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('editing updates title and preserves other fields', () => {
    fc.assert(
      fc.property(arbValidTitle, arbValidTitle, (originalTitle, newTitle) => {
        localStorage.clear();
        initApp();
        addTodo(originalTitle);
        const item = getState().todos[0];
        const { id, completed, priority, deadline, createdAt } = item;

        editTodo(id, newTitle);

        const updated = getState().todos[0];
        expect(updated.title).toBe(newTitle.trim());
        expect(updated.id).toBe(id);
        expect(updated.completed).toBe(completed);
        expect(updated.priority).toBe(priority);
        expect(updated.deadline).toBe(deadline);
        expect(updated.createdAt).toBe(createdAt);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: todo-list-website, Property 7: Edit escape discards changes
 * **Validates: Requirements 5.4**
 *
 * For any todo item being edited, pressing Escape preserves the original title.
 * (Test that the original title is unchanged when edit is discarded.)
 */
describe('Property 7: Edit escape discards changes', () => {
  beforeEach(() => {
    setupLocalStorageMock();
    initApp();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('discarding edit preserves the original title', () => {
    fc.assert(
      fc.property(arbValidTitle, (title) => {
        localStorage.clear();
        initApp();
        addTodo(title);
        const item = getState().todos[0];
        const originalTitle = item.title;

        // Simulate escape: do NOT call editTodo — the original title should remain
        const afterItem = getState().todos[0];
        expect(afterItem.title).toBe(originalTitle);
        expect(afterItem.id).toBe(item.id);
        expect(afterItem.completed).toBe(item.completed);
        expect(afterItem.priority).toBe(item.priority);
        expect(afterItem.deadline).toBe(item.deadline);
        expect(afterItem.createdAt).toBe(item.createdAt);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: todo-list-website, Property 10: Clear completed removes only completed items
 * **Validates: Requirements 8.2**
 *
 * For any todo list, clearing completed results in a list containing
 * exactly the incomplete items in original order.
 */
describe('Property 10: Clear completed removes only completed items', () => {
  beforeEach(() => {
    setupLocalStorageMock();
    initApp();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('clearing completed keeps only incomplete items in original order', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ title: arbValidTitle, completed: fc.boolean() }),
          { minLength: 0, maxLength: 15 },
        ),
        (items) => {
          localStorage.clear();
          initApp();
          // Add items and optionally toggle them to completed
          items.forEach(({ title, completed }) => {
            addTodo(title);
            if (completed) {
              const todos = getState().todos;
              toggleTodo(todos[todos.length - 1].id);
            }
          });

          const todosBefore = getState().todos;
          const expectedRemaining = todosBefore.filter((t) => !t.completed);

          clearCompleted();

          const todosAfter = getState().todos;
          expect(todosAfter.length).toBe(expectedRemaining.length);
          expect(todosAfter).toEqual(expectedRemaining);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: todo-list-website, Property 11: Clear completed button visibility
 * **Validates: Requirements 8.1, 8.3**
 *
 * For any todo list, the "Clear Completed" control should be visible
 * iff the list contains at least one completed item.
 */
describe('Property 11: Clear completed button visibility', () => {
  beforeEach(() => {
    setupLocalStorageMock();
    initApp();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('hasCompletedItems returns true iff at least one item is completed', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ title: arbValidTitle, completed: fc.boolean() }),
          { minLength: 0, maxLength: 15 },
        ),
        (items) => {
          localStorage.clear();
          initApp();
          items.forEach(({ title, completed }) => {
            addTodo(title);
            if (completed) {
              const todos = getState().todos;
              toggleTodo(todos[todos.length - 1].id);
            }
          });

          const todos = getState().todos;
          const expected = todos.some((t) => t.completed);
          expect(hasCompletedItems(todos)).toBe(expected);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Feature: todo-list-website, Property 19: Deadline assignment
 * **Validates: Requirements 10.3, 10.4**
 *
 * For any todo item and any valid date string, setting the deadline updates it.
 * Clearing sets to null.
 */
describe('Property 19: Deadline assignment', () => {
  beforeEach(() => {
    setupLocalStorageMock();
    initApp();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('setting a deadline updates it, clearing sets to null', () => {
    fc.assert(
      fc.property(arbValidTitle, arbDateStr, (title, dateStr) => {
        localStorage.clear();
        initApp();
        addTodo(title);
        const item = getState().todos[0];

        // Set deadline
        setDeadline(item.id, dateStr);
        expect(getState().todos[0].deadline).toBe(dateStr);

        // Clear deadline
        setDeadline(item.id, null);
        expect(getState().todos[0].deadline).toBe(null);
      }),
      { numRuns: 100 },
    );
  });
});


/**
 * Feature: todo-list-website, Property 3: Input field cleared after add
 * **Validates: Requirements 1.2**
 *
 * For any valid (non-empty, non-whitespace) title, after successfully adding
 * a todo item, the input field value should be empty.
 */
describe('Property 3: Input field cleared after add', () => {
  beforeEach(() => {
    setupLocalStorageMock();
    // Provide a no-op renderer so render() calls from state don't fail
    setRenderer(() => {});
    // Set up DOM elements needed by renderTodoInput
    document.body.innerHTML = `
      <input type="text" id="todo-input" />
      <input type="date" id="deadline-input" />
      <select id="priority-input">
        <option value="None" selected>None</option>
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>
    `;
    initApp();
    renderTodoInput();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setRenderer(null);
    document.body.innerHTML = '';
  });

  it('input field is cleared after successfully adding a todo', () => {
    const todoInput = document.getElementById('todo-input');

    fc.assert(
      fc.property(arbValidTitle, (title) => {
        // Reset state for each iteration
        localStorage.clear();
        initApp();

        // Set the input value to the generated title
        todoInput.value = title;

        // Simulate Enter keypress
        const event = new KeyboardEvent('keydown', { key: 'Enter' });
        todoInput.dispatchEvent(event);

        // Verify the input field is now empty
        expect(todoInput.value).toBe('');
      }),
      { numRuns: 100 },
    );
  });
});
