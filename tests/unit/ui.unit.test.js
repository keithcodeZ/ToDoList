/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock state functions to track calls
vi.mock('../../src/state.js', () => ({
  addTodo: vi.fn(),
  toggleTodo: vi.fn(),
  deleteTodo: vi.fn(),
  editTodo: vi.fn(),
  setDeadline: vi.fn(),
  setPriority: vi.fn(),
  updateState: vi.fn(),
  clearCompleted: vi.fn(),
}));

import { renderTodoItem, renderTodoList, renderFilterBar, _resetFilterBarListeners, renderSortControls, _resetSortControlsListeners, renderFooter, _resetFooterListeners } from '../../src/ui.js';
import { toggleTodo, deleteTodo, editTodo, setDeadline, setPriority, updateState, clearCompleted } from '../../src/state.js';

function makeItem(overrides = {}) {
  return {
    id: 'test-id-1',
    title: 'Test Task',
    completed: false,
    priority: 'None',
    deadline: null,
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('renderTodoItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns an <li> with class "todo-item"', () => {
    const li = renderTodoItem(makeItem());
    expect(li.tagName).toBe('LI');
    expect(li.classList.contains('todo-item')).toBe(true);
  });

  it('adds "completed" class when item is completed', () => {
    const li = renderTodoItem(makeItem({ completed: true }));
    expect(li.classList.contains('completed')).toBe(true);
  });

  it('does not add "completed" class when item is not completed', () => {
    const li = renderTodoItem(makeItem({ completed: false }));
    expect(li.classList.contains('completed')).toBe(false);
  });

  it('adds "overdue" class for overdue items', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2);
    const deadlineStr = yesterday.toISOString().split('T')[0];
    const li = renderTodoItem(makeItem({ deadline: deadlineStr, completed: false }));
    expect(li.classList.contains('overdue')).toBe(true);
  });

  it('does not add "overdue" class for completed items even with past deadline', () => {
    const li = renderTodoItem(makeItem({ deadline: '2020-01-01', completed: true }));
    expect(li.classList.contains('overdue')).toBe(false);
  });

  it('contains a checkbox that is checked when completed', () => {
    const li = renderTodoItem(makeItem({ completed: true }));
    const checkbox = li.querySelector('input[type="checkbox"]');
    expect(checkbox).not.toBeNull();
    expect(checkbox.checked).toBe(true);
  });

  it('contains a checkbox that is unchecked when not completed', () => {
    const li = renderTodoItem(makeItem({ completed: false }));
    const checkbox = li.querySelector('input[type="checkbox"]');
    expect(checkbox.checked).toBe(false);
  });

  it('calls toggleTodo on checkbox change', () => {
    const li = renderTodoItem(makeItem({ id: 'abc-123' }));
    const checkbox = li.querySelector('input[type="checkbox"]');
    checkbox.dispatchEvent(new Event('change'));
    expect(toggleTodo).toHaveBeenCalledWith('abc-123');
  });

  it('contains a title span with class "todo-title"', () => {
    const li = renderTodoItem(makeItem({ title: 'My Task' }));
    const titleSpan = li.querySelector('.todo-title');
    expect(titleSpan).not.toBeNull();
    expect(titleSpan.textContent).toBe('My Task');
  });

  it('enters edit mode on double-click of title', () => {
    const li = renderTodoItem(makeItem({ title: 'Original' }));
    const titleSpan = li.querySelector('.todo-title');
    titleSpan.dispatchEvent(new Event('dblclick'));
    const editInput = li.querySelector('.edit-input');
    expect(editInput).not.toBeNull();
    expect(editInput.value).toBe('Original');
  });

  it('calls editTodo on Enter in edit mode', () => {
    const li = renderTodoItem(makeItem({ id: 'edit-id', title: 'Original' }));
    const titleSpan = li.querySelector('.todo-title');
    titleSpan.dispatchEvent(new Event('dblclick'));
    const editInput = li.querySelector('.edit-input');
    editInput.value = 'Updated';
    editInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(editTodo).toHaveBeenCalledWith('edit-id', 'Updated');
  });

  it('discards changes on Escape in edit mode', () => {
    const li = renderTodoItem(makeItem({ id: 'esc-id', title: 'Original' }));
    const titleSpan = li.querySelector('.todo-title');
    titleSpan.dispatchEvent(new Event('dblclick'));
    const editInput = li.querySelector('.edit-input');
    editInput.value = 'Changed';
    editInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    // Title span should be restored
    const restoredSpan = li.querySelector('.todo-title');
    expect(restoredSpan).not.toBeNull();
    expect(restoredSpan.textContent).toBe('Original');
    expect(editTodo).not.toHaveBeenCalled();
  });

  it('displays priority badge with correct class', () => {
    const li = renderTodoItem(makeItem({ priority: 'High' }));
    const badge = li.querySelector('.priority-badge');
    expect(badge).not.toBeNull();
    expect(badge.classList.contains('high')).toBe(true);
    expect(badge.textContent).toBe('High');
  });

  it('hides priority badge for "None" via CSS class', () => {
    const li = renderTodoItem(makeItem({ priority: 'None' }));
    const badge = li.querySelector('.priority-badge');
    expect(badge.classList.contains('none')).toBe(true);
  });

  it('displays formatted deadline when set', () => {
    const li = renderTodoItem(makeItem({ deadline: '2025-12-31' }));
    const deadlineSpan = li.querySelector('.todo-deadline');
    expect(deadlineSpan.textContent).toBe('12/31/2025');
  });

  it('shows empty deadline span when no deadline', () => {
    const li = renderTodoItem(makeItem({ deadline: null }));
    const deadlineSpan = li.querySelector('.todo-deadline');
    expect(deadlineSpan.textContent).toBe('');
  });

  it('contains a date input for changing deadline', () => {
    const li = renderTodoItem(makeItem({ deadline: '2025-06-15' }));
    const dateInput = li.querySelector('input[type="date"]');
    expect(dateInput).not.toBeNull();
    expect(dateInput.value).toBe('2025-06-15');
  });

  it('calls setDeadline on date input change', () => {
    const li = renderTodoItem(makeItem({ id: 'dl-id' }));
    const dateInput = li.querySelector('input[type="date"]');
    dateInput.value = '2025-07-01';
    dateInput.dispatchEvent(new Event('change'));
    expect(setDeadline).toHaveBeenCalledWith('dl-id', '2025-07-01');
  });

  it('calls setDeadline with null when date input is cleared', () => {
    const li = renderTodoItem(makeItem({ id: 'dl-clear', deadline: '2025-06-15' }));
    const dateInput = li.querySelector('input[type="date"]');
    dateInput.value = '';
    dateInput.dispatchEvent(new Event('change'));
    expect(setDeadline).toHaveBeenCalledWith('dl-clear', null);
  });

  it('contains a priority select with correct options', () => {
    const li = renderTodoItem(makeItem({ priority: 'Medium' }));
    const select = li.querySelector('select');
    expect(select).not.toBeNull();
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toEqual(['High', 'Medium', 'Low', 'None']);
    expect(select.value).toBe('Medium');
  });

  it('calls setPriority on select change', () => {
    const li = renderTodoItem(makeItem({ id: 'pri-id' }));
    const select = li.querySelector('select');
    select.value = 'High';
    select.dispatchEvent(new Event('change'));
    expect(setPriority).toHaveBeenCalledWith('pri-id', 'High');
  });

  it('contains a delete button with × text', () => {
    const li = renderTodoItem(makeItem());
    const deleteBtn = li.querySelector('.delete-btn');
    expect(deleteBtn).not.toBeNull();
    expect(deleteBtn.textContent).toBe('\u00d7');
  });

  it('calls deleteTodo on delete button click', () => {
    const li = renderTodoItem(makeItem({ id: 'del-id' }));
    const deleteBtn = li.querySelector('.delete-btn');
    deleteBtn.dispatchEvent(new Event('click'));
    expect(deleteTodo).toHaveBeenCalledWith('del-id');
  });
});


describe('renderTodoList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up DOM elements needed by renderTodoList
    document.body.innerHTML = `
      <ul id="todo-list"></ul>
      <p id="empty-state" style="display:none;">No tasks yet.</p>
    `;
  });

  function makeState(overrides = {}) {
    return {
      todos: [],
      statusFilter: 'All',
      priorityFilter: 'All',
      sortByDeadline: false,
      sortByPriority: false,
      ...overrides,
    };
  }

  it('shows empty state when no todos exist', () => {
    renderTodoList(makeState({ todos: [] }));
    const emptyState = document.getElementById('empty-state');
    const todoList = document.getElementById('todo-list');
    expect(emptyState.style.display).toBe('');
    expect(todoList.style.display).toBe('none');
  });

  it('hides empty state and shows list when todos exist', () => {
    const state = makeState({
      todos: [makeItem({ id: 'a', title: 'Task A', createdAt: 1 })],
    });
    renderTodoList(state);
    const emptyState = document.getElementById('empty-state');
    const todoList = document.getElementById('todo-list');
    expect(emptyState.style.display).toBe('none');
    expect(todoList.style.display).toBe('');
  });

  it('renders correct number of list items', () => {
    const state = makeState({
      todos: [
        makeItem({ id: 'a', title: 'Task A', createdAt: 1 }),
        makeItem({ id: 'b', title: 'Task B', createdAt: 2 }),
        makeItem({ id: 'c', title: 'Task C', createdAt: 3 }),
      ],
    });
    renderTodoList(state);
    const items = document.querySelectorAll('#todo-list .todo-item');
    expect(items.length).toBe(3);
  });

  it('applies status filter — Active shows only incomplete items', () => {
    const state = makeState({
      todos: [
        makeItem({ id: 'a', title: 'Active', completed: false, createdAt: 1 }),
        makeItem({ id: 'b', title: 'Done', completed: true, createdAt: 2 }),
      ],
      statusFilter: 'Active',
    });
    renderTodoList(state);
    const items = document.querySelectorAll('#todo-list .todo-item');
    expect(items.length).toBe(1);
    expect(items[0].querySelector('.todo-title').textContent).toBe('Active');
  });

  it('applies priority filter', () => {
    const state = makeState({
      todos: [
        makeItem({ id: 'a', title: 'High Task', priority: 'High', createdAt: 1 }),
        makeItem({ id: 'b', title: 'Low Task', priority: 'Low', createdAt: 2 }),
      ],
      priorityFilter: 'High',
    });
    renderTodoList(state);
    const items = document.querySelectorAll('#todo-list .todo-item');
    expect(items.length).toBe(1);
    expect(items[0].querySelector('.todo-title').textContent).toBe('High Task');
  });

  it('shows empty state when filters exclude all items', () => {
    const state = makeState({
      todos: [
        makeItem({ id: 'a', title: 'Done', completed: true, createdAt: 1 }),
      ],
      statusFilter: 'Active',
    });
    renderTodoList(state);
    const emptyState = document.getElementById('empty-state');
    const todoList = document.getElementById('todo-list');
    expect(emptyState.style.display).toBe('');
    expect(todoList.style.display).toBe('none');
  });

  it('clears previous items on re-render', () => {
    const state1 = makeState({
      todos: [
        makeItem({ id: 'a', title: 'Task A', createdAt: 1 }),
        makeItem({ id: 'b', title: 'Task B', createdAt: 2 }),
      ],
    });
    renderTodoList(state1);
    expect(document.querySelectorAll('#todo-list .todo-item').length).toBe(2);

    const state2 = makeState({
      todos: [makeItem({ id: 'c', title: 'Task C', createdAt: 3 })],
    });
    renderTodoList(state2);
    expect(document.querySelectorAll('#todo-list .todo-item').length).toBe(1);
  });

  it('applies sorting by priority', () => {
    const state = makeState({
      todos: [
        makeItem({ id: 'a', title: 'Low', priority: 'Low', createdAt: 1 }),
        makeItem({ id: 'b', title: 'High', priority: 'High', createdAt: 2 }),
      ],
      sortByPriority: true,
    });
    renderTodoList(state);
    const items = document.querySelectorAll('#todo-list .todo-item');
    expect(items[0].querySelector('.todo-title').textContent).toBe('High');
    expect(items[1].querySelector('.todo-title').textContent).toBe('Low');
  });
});


describe('renderFilterBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetFilterBarListeners();
    document.body.innerHTML = `
      <div class="status-filters">
        <button class="filter-btn active" data-filter="All">All</button>
        <button class="filter-btn" data-filter="Active">Active</button>
        <button class="filter-btn" data-filter="Completed">Completed</button>
      </div>
      <select id="priority-filter">
        <option value="All" selected>All Priorities</option>
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
        <option value="None">None</option>
      </select>
    `;
  });

  function makeState(overrides = {}) {
    return {
      todos: [],
      statusFilter: 'All',
      priorityFilter: 'All',
      sortByDeadline: false,
      sortByPriority: false,
      ...overrides,
    };
  }

  it('highlights the "All" status filter button by default', () => {
    renderFilterBar(makeState());
    const allBtn = document.querySelector('[data-filter="All"]');
    expect(allBtn.classList.contains('active')).toBe(true);
  });

  it('highlights the "Active" button when statusFilter is Active', () => {
    renderFilterBar(makeState({ statusFilter: 'Active' }));
    const allBtn = document.querySelector('[data-filter="All"]');
    const activeBtn = document.querySelector('[data-filter="Active"]');
    expect(allBtn.classList.contains('active')).toBe(false);
    expect(activeBtn.classList.contains('active')).toBe(true);
  });

  it('highlights the "Completed" button when statusFilter is Completed', () => {
    renderFilterBar(makeState({ statusFilter: 'Completed' }));
    const completedBtn = document.querySelector('[data-filter="Completed"]');
    expect(completedBtn.classList.contains('active')).toBe(true);
    const allBtn = document.querySelector('[data-filter="All"]');
    const activeBtn = document.querySelector('[data-filter="Active"]');
    expect(allBtn.classList.contains('active')).toBe(false);
    expect(activeBtn.classList.contains('active')).toBe(false);
  });

  it('sets priority filter dropdown to match state', () => {
    renderFilterBar(makeState({ priorityFilter: 'High' }));
    const select = document.getElementById('priority-filter');
    expect(select.value).toBe('High');
  });

  it('calls updateState with statusFilter when a status button is clicked', () => {
    renderFilterBar(makeState());
    const activeBtn = document.querySelector('[data-filter="Active"]');
    activeBtn.click();
    expect(updateState).toHaveBeenCalledTimes(1);
    // Verify the mutator sets statusFilter correctly
    const mutator = updateState.mock.calls[0][0];
    const fakeState = { statusFilter: 'All' };
    mutator(fakeState);
    expect(fakeState.statusFilter).toBe('Active');
  });

  it('calls updateState with priorityFilter when dropdown changes', () => {
    renderFilterBar(makeState());
    const select = document.getElementById('priority-filter');
    select.value = 'Medium';
    select.dispatchEvent(new Event('change'));
    expect(updateState).toHaveBeenCalledTimes(1);
    const mutator = updateState.mock.calls[0][0];
    const fakeState = { priorityFilter: 'All' };
    mutator(fakeState);
    expect(fakeState.priorityFilter).toBe('Medium');
  });

  it('does not attach duplicate listeners on subsequent calls', () => {
    const state = makeState();
    renderFilterBar(state);
    renderFilterBar(state);
    renderFilterBar(state);
    const activeBtn = document.querySelector('[data-filter="Active"]');
    activeBtn.click();
    // Should only be called once despite 3 renders
    expect(updateState).toHaveBeenCalledTimes(1);
  });
});


describe('renderSortControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetSortControlsListeners();
    document.body.innerHTML = `
      <button id="sort-deadline" class="sort-btn" aria-pressed="false">Sort by Deadline</button>
      <button id="sort-priority" class="sort-btn" aria-pressed="false">Sort by Priority</button>
    `;
  });

  function makeState(overrides = {}) {
    return {
      todos: [],
      statusFilter: 'All',
      priorityFilter: 'All',
      sortByDeadline: false,
      sortByPriority: false,
      ...overrides,
    };
  }

  it('adds "active" class and sets aria-pressed="true" when sortByDeadline is true', () => {
    renderSortControls(makeState({ sortByDeadline: true }));
    const btn = document.getElementById('sort-deadline');
    expect(btn.classList.contains('active')).toBe(true);
    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });

  it('removes "active" class and sets aria-pressed="false" when sortByDeadline is false', () => {
    renderSortControls(makeState({ sortByDeadline: false }));
    const btn = document.getElementById('sort-deadline');
    expect(btn.classList.contains('active')).toBe(false);
    expect(btn.getAttribute('aria-pressed')).toBe('false');
  });

  it('adds "active" class and sets aria-pressed="true" when sortByPriority is true', () => {
    renderSortControls(makeState({ sortByPriority: true }));
    const btn = document.getElementById('sort-priority');
    expect(btn.classList.contains('active')).toBe(true);
    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });

  it('removes "active" class and sets aria-pressed="false" when sortByPriority is false', () => {
    renderSortControls(makeState({ sortByPriority: false }));
    const btn = document.getElementById('sort-priority');
    expect(btn.classList.contains('active')).toBe(false);
    expect(btn.getAttribute('aria-pressed')).toBe('false');
  });

  it('calls updateState to toggle sortByDeadline on click', () => {
    renderSortControls(makeState());
    const btn = document.getElementById('sort-deadline');
    btn.click();
    expect(updateState).toHaveBeenCalledTimes(1);
    const mutator = updateState.mock.calls[0][0];
    const fakeState = { sortByDeadline: false };
    mutator(fakeState);
    expect(fakeState.sortByDeadline).toBe(true);
  });

  it('calls updateState to toggle sortByPriority on click', () => {
    renderSortControls(makeState());
    const btn = document.getElementById('sort-priority');
    btn.click();
    expect(updateState).toHaveBeenCalledTimes(1);
    const mutator = updateState.mock.calls[0][0];
    const fakeState = { sortByPriority: false };
    mutator(fakeState);
    expect(fakeState.sortByPriority).toBe(true);
  });

  it('does not attach duplicate listeners on subsequent calls', () => {
    const state = makeState();
    renderSortControls(state);
    renderSortControls(state);
    renderSortControls(state);
    const btn = document.getElementById('sort-deadline');
    btn.click();
    expect(updateState).toHaveBeenCalledTimes(1);
  });

  it('updates visual state correctly when both sorts are active', () => {
    renderSortControls(makeState({ sortByDeadline: true, sortByPriority: true }));
    const deadlineBtn = document.getElementById('sort-deadline');
    const priorityBtn = document.getElementById('sort-priority');
    expect(deadlineBtn.classList.contains('active')).toBe(true);
    expect(priorityBtn.classList.contains('active')).toBe(true);
    expect(deadlineBtn.getAttribute('aria-pressed')).toBe('true');
    expect(priorityBtn.getAttribute('aria-pressed')).toBe('true');
  });
});


describe('renderFooter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetFooterListeners();
    document.body.innerHTML = `
      <span id="item-count">0 items left</span>
      <button id="clear-completed" style="display:none;">Clear Completed</button>
    `;
  });

  function makeState(overrides = {}) {
    return {
      todos: [],
      statusFilter: 'All',
      priorityFilter: 'All',
      sortByDeadline: false,
      sortByPriority: false,
      ...overrides,
    };
  }

  it('displays "0 items left" when there are no todos', () => {
    renderFooter(makeState({ todos: [] }));
    const countEl = document.getElementById('item-count');
    expect(countEl.textContent).toBe('0 items left');
  });

  it('displays "1 item left" for a single incomplete item', () => {
    renderFooter(makeState({
      todos: [makeItem({ completed: false })],
    }));
    const countEl = document.getElementById('item-count');
    expect(countEl.textContent).toBe('1 item left');
  });

  it('displays correct count for multiple incomplete items', () => {
    renderFooter(makeState({
      todos: [
        makeItem({ id: 'a', completed: false }),
        makeItem({ id: 'b', completed: true }),
        makeItem({ id: 'c', completed: false }),
      ],
    }));
    const countEl = document.getElementById('item-count');
    expect(countEl.textContent).toBe('2 items left');
  });

  it('hides "Clear Completed" button when no completed items exist', () => {
    renderFooter(makeState({
      todos: [makeItem({ completed: false })],
    }));
    const btn = document.getElementById('clear-completed');
    expect(btn.style.display).toBe('none');
  });

  it('shows "Clear Completed" button when completed items exist', () => {
    renderFooter(makeState({
      todos: [makeItem({ completed: true })],
    }));
    const btn = document.getElementById('clear-completed');
    expect(btn.style.display).toBe('');
  });

  it('calls clearCompleted when "Clear Completed" button is clicked', () => {
    renderFooter(makeState({
      todos: [makeItem({ completed: true })],
    }));
    const btn = document.getElementById('clear-completed');
    btn.click();
    expect(clearCompleted).toHaveBeenCalledTimes(1);
  });

  it('does not attach duplicate listeners on subsequent calls', () => {
    const state = makeState({ todos: [makeItem({ completed: true })] });
    renderFooter(state);
    renderFooter(state);
    renderFooter(state);
    const btn = document.getElementById('clear-completed');
    btn.click();
    expect(clearCompleted).toHaveBeenCalledTimes(1);
  });

  it('updates count immediately when state changes', () => {
    renderFooter(makeState({
      todos: [
        makeItem({ id: 'a', completed: false }),
        makeItem({ id: 'b', completed: false }),
      ],
    }));
    expect(document.getElementById('item-count').textContent).toBe('2 items left');

    renderFooter(makeState({
      todos: [makeItem({ id: 'a', completed: false })],
    }));
    expect(document.getElementById('item-count').textContent).toBe('1 item left');
  });
});
