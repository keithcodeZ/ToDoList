import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isValidTitle,
  generateId,
  createTodoItem,
  createAppState,
  getPriorityColor,
  PRIORITY_ORDER,
  PRIORITIES,
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

describe('isValidTitle', () => {
  it('accepts a normal title', () => {
    expect(isValidTitle('Buy groceries')).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(isValidTitle('')).toBe(false);
  });

  it('rejects whitespace-only string', () => {
    expect(isValidTitle('   ')).toBe(false);
    expect(isValidTitle('\t\n')).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(isValidTitle(null)).toBe(false);
    expect(isValidTitle(undefined)).toBe(false);
    expect(isValidTitle(123)).toBe(false);
  });
});

describe('generateId', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('createTodoItem', () => {
  it('creates item with correct defaults', () => {
    const item = createTodoItem('Test task');
    expect(item.title).toBe('Test task');
    expect(item.completed).toBe(false);
    expect(item.priority).toBe('None');
    expect(item.deadline).toBeNull();
    expect(typeof item.id).toBe('string');
    expect(typeof item.createdAt).toBe('number');
  });

  it('trims the title', () => {
    const item = createTodoItem('  hello  ');
    expect(item.title).toBe('hello');
  });

  it('accepts optional deadline and priority', () => {
    const item = createTodoItem('Task', '2025-12-31', 'High');
    expect(item.deadline).toBe('2025-12-31');
    expect(item.priority).toBe('High');
  });
});

describe('createAppState', () => {
  it('creates default state', () => {
    const state = createAppState();
    expect(state.todos).toEqual([]);
    expect(state.statusFilter).toBe('All');
    expect(state.priorityFilter).toBe('All');
    expect(state.sortByDeadline).toBe(false);
    expect(state.sortByPriority).toBe(false);
  });

  it('accepts initial todos', () => {
    const todos = [createTodoItem('A')];
    const state = createAppState(todos);
    expect(state.todos).toHaveLength(1);
  });
});

describe('getPriorityColor', () => {
  it('returns red for High', () => {
    expect(getPriorityColor('High')).toBe('red');
  });

  it('returns orange for Medium', () => {
    expect(getPriorityColor('Medium')).toBe('orange');
  });

  it('returns blue for Low', () => {
    expect(getPriorityColor('Low')).toBe('blue');
  });

  it('returns null for None', () => {
    expect(getPriorityColor('None')).toBeNull();
  });

  it('returns null for unknown priority', () => {
    expect(getPriorityColor('Unknown')).toBeNull();
  });
});

describe('PRIORITY_ORDER', () => {
  it('has correct ordering values', () => {
    expect(PRIORITY_ORDER.High).toBe(0);
    expect(PRIORITY_ORDER.Medium).toBe(1);
    expect(PRIORITY_ORDER.Low).toBe(2);
    expect(PRIORITY_ORDER.None).toBe(3);
  });
});

/**
 * Creates a simple in-memory localStorage mock.
 */
function createLocalStorageMock() {
  const store = {};
  return {
    getItem: vi.fn((key) => (key in store ? store[key] : null)),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i) => Object.keys(store)[i] ?? null),
  };
}

describe('saveTodos', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', mockStorage);
  });

  it('saves todos to localStorage as JSON', () => {
    const todos = [createTodoItem('Task A'), createTodoItem('Task B')];
    saveTodos(todos);
    const stored = JSON.parse(mockStorage.getItem('todo-app-todos'));
    expect(stored).toHaveLength(2);
    expect(stored[0].title).toBe('Task A');
    expect(stored[1].title).toBe('Task B');
  });

  it('handles localStorage write failure gracefully', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockStorage.setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => saveTodos([createTodoItem('Test')])).not.toThrow();
    expect(spy).toHaveBeenCalled();

    vi.restoreAllMocks();
  });
});

describe('loadTodos', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', mockStorage);
  });

  it('loads saved todos from localStorage', () => {
    const todos = [createTodoItem('Task A')];
    saveTodos(todos);
    const loaded = loadTodos();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].title).toBe('Task A');
  });

  it('returns empty array when localStorage is empty', () => {
    expect(loadTodos()).toEqual([]);
  });

  it('returns empty array for corrupted JSON', () => {
    mockStorage.setItem('todo-app-todos', '{not valid json!!!');
    expect(loadTodos()).toEqual([]);
  });

  it('returns empty array when stored value is not an array', () => {
    mockStorage.setItem('todo-app-todos', JSON.stringify({ foo: 'bar' }));
    expect(loadTodos()).toEqual([]);
  });

  it('skips malformed items missing required fields', () => {
    const valid = createTodoItem('Valid');
    const malformed = { id: '123', title: 'Missing fields' }; // missing completed, priority, deadline, createdAt
    mockStorage.setItem('todo-app-todos', JSON.stringify([valid, malformed]));
    const loaded = loadTodos();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].title).toBe('Valid');
  });

  it('handles localStorage read failure gracefully', () => {
    mockStorage.getItem.mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(loadTodos()).toEqual([]);
  });
});


describe('filterByStatus', () => {
  const todos = [
    { ...createTodoItem('Active 1'), completed: false },
    { ...createTodoItem('Done 1'), completed: true },
    { ...createTodoItem('Active 2'), completed: false },
  ];

  it('"All" returns all items', () => {
    expect(filterByStatus(todos, 'All')).toEqual(todos);
  });

  it('"Active" returns only incomplete items', () => {
    const result = filterByStatus(todos, 'Active');
    expect(result).toHaveLength(2);
    expect(result.every((t) => !t.completed)).toBe(true);
  });

  it('"Completed" returns only completed items', () => {
    const result = filterByStatus(todos, 'Completed');
    expect(result).toHaveLength(1);
    expect(result.every((t) => t.completed)).toBe(true);
  });

  it('returns empty array when no items match', () => {
    const allActive = [{ ...createTodoItem('A'), completed: false }];
    expect(filterByStatus(allActive, 'Completed')).toEqual([]);
  });
});

describe('filterByPriority', () => {
  const todos = [
    { ...createTodoItem('High task'), priority: 'High' },
    { ...createTodoItem('Low task'), priority: 'Low' },
    { ...createTodoItem('None task'), priority: 'None' },
    { ...createTodoItem('Medium task'), priority: 'Medium' },
  ];

  it('"All" returns all items', () => {
    expect(filterByPriority(todos, 'All')).toEqual(todos);
  });

  it('specific priority returns only matching items', () => {
    expect(filterByPriority(todos, 'High')).toHaveLength(1);
    expect(filterByPriority(todos, 'High')[0].priority).toBe('High');
    expect(filterByPriority(todos, 'Low')).toHaveLength(1);
    expect(filterByPriority(todos, 'Medium')).toHaveLength(1);
    expect(filterByPriority(todos, 'None')).toHaveLength(1);
  });

  it('returns empty array when no items match', () => {
    const noHigh = [{ ...createTodoItem('A'), priority: 'Low' }];
    expect(filterByPriority(noHigh, 'High')).toEqual([]);
  });
});

describe('applyFilters', () => {
  const todos = [
    { ...createTodoItem('Active High'), completed: false, priority: 'High' },
    { ...createTodoItem('Done High'), completed: true, priority: 'High' },
    { ...createTodoItem('Active Low'), completed: false, priority: 'Low' },
    { ...createTodoItem('Done None'), completed: true, priority: 'None' },
  ];

  it('combines status and priority filters', () => {
    const result = applyFilters(todos, 'Active', 'High');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Active High');
  });

  it('"All"/"All" returns everything', () => {
    expect(applyFilters(todos, 'All', 'All')).toEqual(todos);
  });

  it('"Completed"/"All" returns only completed', () => {
    const result = applyFilters(todos, 'Completed', 'All');
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.completed)).toBe(true);
  });

  it('"All"/"None" returns only None priority', () => {
    const result = applyFilters(todos, 'All', 'None');
    expect(result).toHaveLength(1);
    expect(result[0].priority).toBe('None');
  });
});


describe('sortByDeadline', () => {
  it('sorts items with deadlines earliest first', () => {
    const todos = [
      { ...createTodoItem('Late'), deadline: '2025-12-31', createdAt: 1 },
      { ...createTodoItem('Early'), deadline: '2025-01-01', createdAt: 2 },
      { ...createTodoItem('Mid'), deadline: '2025-06-15', createdAt: 3 },
    ];
    const sorted = sortByDeadline(todos);
    expect(sorted[0].deadline).toBe('2025-01-01');
    expect(sorted[1].deadline).toBe('2025-06-15');
    expect(sorted[2].deadline).toBe('2025-12-31');
  });

  it('places null deadlines last', () => {
    const todos = [
      { ...createTodoItem('No deadline'), deadline: null, createdAt: 1 },
      { ...createTodoItem('Has deadline'), deadline: '2025-03-01', createdAt: 2 },
    ];
    const sorted = sortByDeadline(todos);
    expect(sorted[0].deadline).toBe('2025-03-01');
    expect(sorted[1].deadline).toBeNull();
  });

  it('does not mutate the input array', () => {
    const todos = [
      { ...createTodoItem('B'), deadline: '2025-12-01', createdAt: 1 },
      { ...createTodoItem('A'), deadline: '2025-01-01', createdAt: 2 },
    ];
    const original = [...todos];
    sortByDeadline(todos);
    expect(todos).toEqual(original);
  });
});

describe('sortByPriority', () => {
  it('sorts High → Medium → Low → None', () => {
    const todos = [
      { ...createTodoItem('None'), priority: 'None', createdAt: 1 },
      { ...createTodoItem('High'), priority: 'High', createdAt: 2 },
      { ...createTodoItem('Low'), priority: 'Low', createdAt: 3 },
      { ...createTodoItem('Medium'), priority: 'Medium', createdAt: 4 },
    ];
    const sorted = sortByPriority(todos);
    expect(sorted.map((t) => t.priority)).toEqual(['High', 'Medium', 'Low', 'None']);
  });

  it('does not mutate the input array', () => {
    const todos = [
      { ...createTodoItem('Low'), priority: 'Low', createdAt: 1 },
      { ...createTodoItem('High'), priority: 'High', createdAt: 2 },
    ];
    const original = [...todos];
    sortByPriority(todos);
    expect(todos).toEqual(original);
  });
});

describe('applySorting', () => {
  const todos = [
    { ...createTodoItem('C'), priority: 'Low', deadline: '2025-06-01', createdAt: 3 },
    { ...createTodoItem('A'), priority: 'High', deadline: '2025-12-01', createdAt: 1 },
    { ...createTodoItem('B'), priority: 'High', deadline: '2025-01-01', createdAt: 2 },
  ];

  it('returns creation order when no sort is active', () => {
    const sorted = applySorting(todos, { sortByDeadline: false, sortByPriority: false });
    expect(sorted.map((t) => t.createdAt)).toEqual([1, 2, 3]);
  });

  it('sorts by deadline only when sortByDeadline is active', () => {
    const sorted = applySorting(todos, { sortByDeadline: true, sortByPriority: false });
    expect(sorted.map((t) => t.deadline)).toEqual(['2025-01-01', '2025-06-01', '2025-12-01']);
  });

  it('sorts by priority only when sortByPriority is active', () => {
    const sorted = applySorting(todos, { sortByDeadline: false, sortByPriority: true });
    expect(sorted[0].priority).toBe('High');
    expect(sorted[1].priority).toBe('High');
    expect(sorted[2].priority).toBe('Low');
  });

  it('combined sort: priority primary, deadline secondary', () => {
    const sorted = applySorting(todos, { sortByDeadline: true, sortByPriority: true });
    // Both High items first, sorted by deadline within
    expect(sorted[0].priority).toBe('High');
    expect(sorted[0].deadline).toBe('2025-01-01');
    expect(sorted[1].priority).toBe('High');
    expect(sorted[1].deadline).toBe('2025-12-01');
    expect(sorted[2].priority).toBe('Low');
  });

  it('does not mutate the input array', () => {
    const original = [...todos];
    applySorting(todos, { sortByDeadline: true, sortByPriority: true });
    expect(todos).toEqual(original);
  });
});


describe('isOverdue', () => {
  const today = new Date('2025-06-15');

  it('returns true for incomplete item with deadline before today', () => {
    const item = { ...createTodoItem('Task'), completed: false, deadline: '2025-06-14' };
    expect(isOverdue(item, today)).toBe(true);
  });

  it('returns false for incomplete item with deadline equal to today', () => {
    const item = { ...createTodoItem('Task'), completed: false, deadline: '2025-06-15' };
    expect(isOverdue(item, today)).toBe(false);
  });

  it('returns false for incomplete item with deadline after today', () => {
    const item = { ...createTodoItem('Task'), completed: false, deadline: '2025-12-01' };
    expect(isOverdue(item, today)).toBe(false);
  });

  it('returns false for completed item even if deadline is past', () => {
    const item = { ...createTodoItem('Task'), completed: true, deadline: '2025-01-01' };
    expect(isOverdue(item, today)).toBe(false);
  });

  it('returns false when deadline is null', () => {
    const item = { ...createTodoItem('Task'), completed: false, deadline: null };
    expect(isOverdue(item, today)).toBe(false);
  });
});

describe('getActiveCount', () => {
  it('returns count of incomplete items', () => {
    const todos = [
      { ...createTodoItem('A'), completed: false },
      { ...createTodoItem('B'), completed: true },
      { ...createTodoItem('C'), completed: false },
    ];
    expect(getActiveCount(todos)).toBe(2);
  });

  it('returns 0 for empty list', () => {
    expect(getActiveCount([])).toBe(0);
  });

  it('returns 0 when all items are completed', () => {
    const todos = [
      { ...createTodoItem('A'), completed: true },
      { ...createTodoItem('B'), completed: true },
    ];
    expect(getActiveCount(todos)).toBe(0);
  });

  it('returns total count when no items are completed', () => {
    const todos = [
      { ...createTodoItem('A'), completed: false },
      { ...createTodoItem('B'), completed: false },
    ];
    expect(getActiveCount(todos)).toBe(2);
  });
});


import { initApp, updateState, getState, render, addTodo, toggleTodo, deleteTodo, editTodo, setDeadline, setPriority, clearCompleted } from '../../src/state.js';

describe('initApp', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', mockStorage);
  });

  it('initializes with empty list when no persisted data exists', () => {
    initApp();
    const state = getState();
    expect(state.todos).toEqual([]);
    expect(state.statusFilter).toBe('All');
    expect(state.priorityFilter).toBe('All');
    expect(state.sortByDeadline).toBe(false);
    expect(state.sortByPriority).toBe(false);
  });

  it('restores todos from localStorage', () => {
    const todos = [createTodoItem('Persisted task')];
    mockStorage.setItem('todo-app-todos', JSON.stringify(todos));
    initApp();
    const state = getState();
    expect(state.todos).toHaveLength(1);
    expect(state.todos[0].title).toBe('Persisted task');
  });

  it('resets filters and sort to defaults on load', () => {
    initApp();
    const state = getState();
    expect(state.statusFilter).toBe('All');
    expect(state.priorityFilter).toBe('All');
    expect(state.sortByDeadline).toBe(false);
    expect(state.sortByPriority).toBe(false);
  });
});

describe('updateState', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', mockStorage);
    initApp();
  });

  it('applies mutation to state', () => {
    updateState((s) => {
      s.todos.push(createTodoItem('New task'));
    });
    const state = getState();
    expect(state.todos).toHaveLength(1);
    expect(state.todos[0].title).toBe('New task');
  });

  it('persists todos to localStorage after mutation', () => {
    updateState((s) => {
      s.todos.push(createTodoItem('Saved task'));
    });
    const stored = JSON.parse(mockStorage.getItem('todo-app-todos'));
    expect(stored).toHaveLength(1);
    expect(stored[0].title).toBe('Saved task');
  });

  it('updates filter state', () => {
    updateState((s) => {
      s.statusFilter = 'Active';
    });
    expect(getState().statusFilter).toBe('Active');
  });

  it('updates sort state', () => {
    updateState((s) => {
      s.sortByDeadline = true;
    });
    expect(getState().sortByDeadline).toBe(true);
  });
});

describe('render', () => {
  it('is callable without errors', () => {
    const state = createAppState([]);
    expect(() => render(state)).not.toThrow();
  });
});

describe('addTodo', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', mockStorage);
    initApp();
  });

  it('adds a todo with correct defaults and returns true', () => {
    const result = addTodo('Buy groceries');
    expect(result).toBe(true);
    const state = getState();
    expect(state.todos).toHaveLength(1);
    expect(state.todos[0].title).toBe('Buy groceries');
    expect(state.todos[0].completed).toBe(false);
    expect(state.todos[0].priority).toBe('None');
    expect(state.todos[0].deadline).toBeNull();
    expect(typeof state.todos[0].id).toBe('string');
    expect(typeof state.todos[0].createdAt).toBe('number');
  });

  it('rejects empty title and returns false', () => {
    const result = addTodo('');
    expect(result).toBe(false);
    expect(getState().todos).toHaveLength(0);
  });

  it('rejects whitespace-only title and returns false', () => {
    const result = addTodo('   ');
    expect(result).toBe(false);
    expect(getState().todos).toHaveLength(0);
  });

  it('accepts optional deadline and priority', () => {
    addTodo('Task', '2025-12-31', 'High');
    const item = getState().todos[0];
    expect(item.deadline).toBe('2025-12-31');
    expect(item.priority).toBe('High');
  });

  it('persists the new todo to localStorage', () => {
    addTodo('Persisted');
    const stored = JSON.parse(mockStorage.getItem('todo-app-todos'));
    expect(stored).toHaveLength(1);
    expect(stored[0].title).toBe('Persisted');
  });
});


describe('toggleTodo', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', mockStorage);
    initApp();
  });

  it('flips completed from false to true', () => {
    addTodo('Task');
    const id = getState().todos[0].id;
    toggleTodo(id);
    expect(getState().todos[0].completed).toBe(true);
  });

  it('flips completed from true back to false', () => {
    addTodo('Task');
    const id = getState().todos[0].id;
    toggleTodo(id);
    toggleTodo(id);
    expect(getState().todos[0].completed).toBe(false);
  });

  it('does nothing for a non-existent id', () => {
    addTodo('Task');
    toggleTodo('non-existent-id');
    expect(getState().todos[0].completed).toBe(false);
  });

  it('persists the toggled state', () => {
    addTodo('Task');
    const id = getState().todos[0].id;
    toggleTodo(id);
    const stored = JSON.parse(mockStorage.getItem('todo-app-todos'));
    expect(stored[0].completed).toBe(true);
  });
});

describe('deleteTodo', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', mockStorage);
    initApp();
  });

  it('removes the item from the list', () => {
    addTodo('Task A');
    addTodo('Task B');
    const id = getState().todos[0].id;
    deleteTodo(id);
    expect(getState().todos).toHaveLength(1);
    expect(getState().todos[0].title).toBe('Task B');
  });

  it('does nothing for a non-existent id', () => {
    addTodo('Task');
    deleteTodo('non-existent-id');
    expect(getState().todos).toHaveLength(1);
  });

  it('persists after deletion', () => {
    addTodo('Task');
    const id = getState().todos[0].id;
    deleteTodo(id);
    const stored = JSON.parse(mockStorage.getItem('todo-app-todos'));
    expect(stored).toHaveLength(0);
  });
});

describe('editTodo', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', mockStorage);
    initApp();
  });

  it('updates the title with a valid new title', () => {
    addTodo('Original');
    const id = getState().todos[0].id;
    editTodo(id, 'Updated');
    expect(getState().todos[0].title).toBe('Updated');
  });

  it('trims the new title', () => {
    addTodo('Original');
    const id = getState().todos[0].id;
    editTodo(id, '  Trimmed  ');
    expect(getState().todos[0].title).toBe('Trimmed');
  });

  it('deletes the item when new title is empty', () => {
    addTodo('Original');
    const id = getState().todos[0].id;
    editTodo(id, '');
    expect(getState().todos).toHaveLength(0);
  });

  it('deletes the item when new title is whitespace-only', () => {
    addTodo('Original');
    const id = getState().todos[0].id;
    editTodo(id, '   ');
    expect(getState().todos).toHaveLength(0);
  });

  it('preserves other fields when editing title', () => {
    addTodo('Original', '2025-12-31', 'High');
    const id = getState().todos[0].id;
    const originalItem = { ...getState().todos[0] };
    editTodo(id, 'New Title');
    const updated = getState().todos[0];
    expect(updated.id).toBe(originalItem.id);
    expect(updated.completed).toBe(originalItem.completed);
    expect(updated.priority).toBe(originalItem.priority);
    expect(updated.deadline).toBe(originalItem.deadline);
    expect(updated.createdAt).toBe(originalItem.createdAt);
  });

  it('persists the edited title', () => {
    addTodo('Original');
    const id = getState().todos[0].id;
    editTodo(id, 'Edited');
    const stored = JSON.parse(mockStorage.getItem('todo-app-todos'));
    expect(stored[0].title).toBe('Edited');
  });
});


describe('setDeadline', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', mockStorage);
    initApp();
  });

  it('sets a deadline on a todo item', () => {
    addTodo('Task');
    const id = getState().todos[0].id;
    setDeadline(id, '2025-12-31');
    expect(getState().todos[0].deadline).toBe('2025-12-31');
  });

  it('changes an existing deadline', () => {
    addTodo('Task', '2025-06-01');
    const id = getState().todos[0].id;
    setDeadline(id, '2025-12-31');
    expect(getState().todos[0].deadline).toBe('2025-12-31');
  });

  it('clears a deadline by setting to null', () => {
    addTodo('Task', '2025-12-31');
    const id = getState().todos[0].id;
    setDeadline(id, null);
    expect(getState().todos[0].deadline).toBeNull();
  });

  it('does nothing for a non-existent id', () => {
    addTodo('Task');
    setDeadline('non-existent-id', '2025-12-31');
    expect(getState().todos[0].deadline).toBeNull();
  });

  it('persists the deadline change', () => {
    addTodo('Task');
    const id = getState().todos[0].id;
    setDeadline(id, '2025-12-31');
    const stored = JSON.parse(mockStorage.getItem('todo-app-todos'));
    expect(stored[0].deadline).toBe('2025-12-31');
  });

  it('preserves other fields when setting deadline', () => {
    addTodo('Task', null, 'High');
    const id = getState().todos[0].id;
    const original = { ...getState().todos[0] };
    setDeadline(id, '2025-12-31');
    const updated = getState().todos[0];
    expect(updated.id).toBe(original.id);
    expect(updated.title).toBe(original.title);
    expect(updated.completed).toBe(original.completed);
    expect(updated.priority).toBe(original.priority);
    expect(updated.createdAt).toBe(original.createdAt);
  });
});

describe('setPriority', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', mockStorage);
    initApp();
  });

  it('sets priority on a todo item', () => {
    addTodo('Task');
    const id = getState().todos[0].id;
    setPriority(id, 'High');
    expect(getState().todos[0].priority).toBe('High');
  });

  it('changes an existing priority', () => {
    addTodo('Task', null, 'High');
    const id = getState().todos[0].id;
    setPriority(id, 'Low');
    expect(getState().todos[0].priority).toBe('Low');
  });

  it('sets priority back to None', () => {
    addTodo('Task', null, 'Medium');
    const id = getState().todos[0].id;
    setPriority(id, 'None');
    expect(getState().todos[0].priority).toBe('None');
  });

  it('does nothing for a non-existent id', () => {
    addTodo('Task');
    setPriority('non-existent-id', 'High');
    expect(getState().todos[0].priority).toBe('None');
  });

  it('persists the priority change', () => {
    addTodo('Task');
    const id = getState().todos[0].id;
    setPriority(id, 'Medium');
    const stored = JSON.parse(mockStorage.getItem('todo-app-todos'));
    expect(stored[0].priority).toBe('Medium');
  });

  it('preserves other fields when setting priority', () => {
    addTodo('Task', '2025-12-31');
    const id = getState().todos[0].id;
    const original = { ...getState().todos[0] };
    setPriority(id, 'High');
    const updated = getState().todos[0];
    expect(updated.id).toBe(original.id);
    expect(updated.title).toBe(original.title);
    expect(updated.completed).toBe(original.completed);
    expect(updated.deadline).toBe(original.deadline);
    expect(updated.createdAt).toBe(original.createdAt);
  });
});


describe('hasCompletedItems', () => {
  it('returns false for empty list', () => {
    expect(hasCompletedItems([])).toBe(false);
  });

  it('returns false when no items are completed', () => {
    const todos = [
      { ...createTodoItem('A'), completed: false },
      { ...createTodoItem('B'), completed: false },
    ];
    expect(hasCompletedItems(todos)).toBe(false);
  });

  it('returns true when at least one item is completed', () => {
    const todos = [
      { ...createTodoItem('A'), completed: false },
      { ...createTodoItem('B'), completed: true },
    ];
    expect(hasCompletedItems(todos)).toBe(true);
  });

  it('returns true when all items are completed', () => {
    const todos = [
      { ...createTodoItem('A'), completed: true },
      { ...createTodoItem('B'), completed: true },
    ];
    expect(hasCompletedItems(todos)).toBe(true);
  });
});

describe('clearCompleted', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', mockStorage);
    initApp();
  });

  it('removes all completed items', () => {
    addTodo('Active task');
    addTodo('Done task');
    const doneId = getState().todos[1].id;
    toggleTodo(doneId);
    clearCompleted();
    expect(getState().todos).toHaveLength(1);
    expect(getState().todos[0].title).toBe('Active task');
  });

  it('keeps all items when none are completed', () => {
    addTodo('Task A');
    addTodo('Task B');
    clearCompleted();
    expect(getState().todos).toHaveLength(2);
  });

  it('removes all items when all are completed', () => {
    addTodo('Task A');
    addTodo('Task B');
    toggleTodo(getState().todos[0].id);
    toggleTodo(getState().todos[1].id);
    clearCompleted();
    expect(getState().todos).toHaveLength(0);
  });

  it('does nothing on empty list', () => {
    clearCompleted();
    expect(getState().todos).toHaveLength(0);
  });

  it('persists after clearing completed', () => {
    addTodo('Keep');
    addTodo('Remove');
    toggleTodo(getState().todos[1].id);
    clearCompleted();
    const stored = JSON.parse(mockStorage.getItem('todo-app-todos'));
    expect(stored).toHaveLength(1);
    expect(stored[0].title).toBe('Keep');
  });
});
