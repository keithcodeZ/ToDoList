/**
 * UI rendering functions.
 */

import { addTodo, toggleTodo, deleteTodo, editTodo, setDeadline, setPriority, updateState, clearCompleted } from './state.js';
import { isOverdue, applyFilters, applySorting, getActiveCount, hasCompletedItems } from './core.js';
import { getPriorityColor, PRIORITIES } from './models.js';

/**
 * Sets up the Enter key handler on the todo input field.
 * Gets references to #todo-input, #deadline-input, and #priority-input,
 * and wires up the keydown listener to add a new todo on Enter.
 */
export function renderTodoInput() {
  const todoInput = document.getElementById('todo-input');
  const deadlineInput = document.getElementById('deadline-input');
  const priorityInput = document.getElementById('priority-input');

  todoInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const title = todoInput.value;
      const deadline = deadlineInput.value || null;
      const priority = priorityInput.value;

      const added = addTodo(title, deadline, priority);
      if (added) {
        todoInput.value = '';
        deadlineInput.value = '';
        priorityInput.value = 'None';
      }
    }
  });
}


/**
 * Formats a deadline date string (YYYY-MM-DD) into a human-readable format.
 * @param {string} deadline - ISO date string
 * @returns {string} Formatted date
 */
function formatDeadline(deadline) {
  const [year, month, day] = deadline.split('-');
  return `${month}/${day}/${year}`;
}

/**
 * Creates and returns an <li> element for a single todo item.
 * @param {object} item - A TodoItem object
 * @returns {HTMLLIElement}
 */
export function renderTodoItem(item) {
  const li = document.createElement('li');
  li.classList.add('todo-item');
  if (item.completed) li.classList.add('completed');
  if (isOverdue(item, new Date())) li.classList.add('overdue');

  // Checkbox
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = item.completed;
  checkbox.setAttribute('aria-label', `Mark "${item.title}" as ${item.completed ? 'incomplete' : 'complete'}`);
  checkbox.addEventListener('change', () => toggleTodo(item.id));

  // Title span
  const titleSpan = document.createElement('span');
  titleSpan.classList.add('todo-title');
  titleSpan.textContent = item.title;
  titleSpan.addEventListener('dblclick', () => {
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.classList.add('edit-input');
    editInput.value = item.title;
    li.replaceChild(editInput, titleSpan);
    editInput.focus();

    const commitEdit = () => {
      editTodo(item.id, editInput.value);
    };

    editInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        editInput.removeEventListener('blur', commitEdit);
        commitEdit();
      } else if (e.key === 'Escape') {
        editInput.removeEventListener('blur', commitEdit);
        li.replaceChild(titleSpan, editInput);
      }
    });

    editInput.addEventListener('blur', commitEdit);
  });

  // Priority badge
  const priorityBadge = document.createElement('span');
  priorityBadge.classList.add('priority-badge', item.priority.toLowerCase());
  priorityBadge.textContent = item.priority;

  // Deadline display
  const deadlineSpan = document.createElement('span');
  deadlineSpan.classList.add('todo-deadline');
  if (item.deadline) {
    deadlineSpan.textContent = formatDeadline(item.deadline);
  }

  // Date input for changing deadline
  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.value = item.deadline || '';
  dateInput.setAttribute('aria-label', `Set deadline for "${item.title}"`);
  dateInput.addEventListener('change', () => {
    setDeadline(item.id, dateInput.value || null);
  });

  // Priority select
  const prioritySelect = document.createElement('select');
  prioritySelect.setAttribute('aria-label', `Set priority for "${item.title}"`);
  PRIORITIES.forEach((p) => {
    const option = document.createElement('option');
    option.value = p;
    option.textContent = p;
    if (p === item.priority) option.selected = true;
    prioritySelect.appendChild(option);
  });
  prioritySelect.addEventListener('change', () => {
    setPriority(item.id, prioritySelect.value);
  });

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.classList.add('delete-btn');
  deleteBtn.textContent = '\u00d7';
  deleteBtn.setAttribute('aria-label', `Delete "${item.title}"`);
  deleteBtn.addEventListener('click', () => deleteTodo(item.id));

  li.appendChild(checkbox);
  li.appendChild(titleSpan);
  li.appendChild(priorityBadge);
  li.appendChild(deadlineSpan);
  li.appendChild(dateInput);
  li.appendChild(prioritySelect);
  li.appendChild(deleteBtn);

  return li;
}


/**
 * Renders the todo list by applying current filters and sort settings,
 * then rendering each item. Shows empty state when no items match.
 * @param {object} state - The current AppState
 */
export function renderTodoList(state) {
  const todoListEl = document.getElementById('todo-list');
  const emptyStateEl = document.getElementById('empty-state');

  const filtered = applyFilters(state.todos, state.statusFilter, state.priorityFilter);
  const sorted = applySorting(filtered, {
    sortByDeadline: state.sortByDeadline,
    sortByPriority: state.sortByPriority,
  });

  todoListEl.innerHTML = '';

  if (sorted.length === 0) {
    emptyStateEl.style.display = '';
    todoListEl.style.display = 'none';
  } else {
    emptyStateEl.style.display = 'none';
    todoListEl.style.display = '';
    sorted.forEach((item) => {
      todoListEl.appendChild(renderTodoItem(item));
    });
  }
}


let sortControlsListenersAttached = false;

/**
 * Resets the sort controls listener flag. For testing only.
 */
export function _resetSortControlsListeners() {
  sortControlsListenersAttached = false;
}

/**
 * Renders the sort controls: updates active class and aria-pressed on
 * #sort-deadline and #sort-priority buttons based on state. Sets up
 * click handlers on first call to toggle sort settings via updateState.
 * @param {object} state - The current AppState
 */
export function renderSortControls(state) {
  const sortDeadlineBtn = document.getElementById('sort-deadline');
  const sortPriorityBtn = document.getElementById('sort-priority');

  // Update active class and aria-pressed for deadline sort
  if (sortDeadlineBtn) {
    if (state.sortByDeadline) {
      sortDeadlineBtn.classList.add('active');
      sortDeadlineBtn.setAttribute('aria-pressed', 'true');
    } else {
      sortDeadlineBtn.classList.remove('active');
      sortDeadlineBtn.setAttribute('aria-pressed', 'false');
    }
  }

  // Update active class and aria-pressed for priority sort
  if (sortPriorityBtn) {
    if (state.sortByPriority) {
      sortPriorityBtn.classList.add('active');
      sortPriorityBtn.setAttribute('aria-pressed', 'true');
    } else {
      sortPriorityBtn.classList.remove('active');
      sortPriorityBtn.setAttribute('aria-pressed', 'false');
    }
  }

  // Attach event listeners only once
  if (!sortControlsListenersAttached) {
    sortControlsListenersAttached = true;

    if (sortDeadlineBtn) {
      sortDeadlineBtn.addEventListener('click', () => {
        updateState((s) => {
          s.sortByDeadline = !s.sortByDeadline;
        });
      });
    }

    if (sortPriorityBtn) {
      sortPriorityBtn.addEventListener('click', () => {
        updateState((s) => {
          s.sortByPriority = !s.sortByPriority;
        });
      });
    }
  }
}

let filterBarListenersAttached = false;

/**
 * Resets the filter bar listener flag. For testing only.
 */
export function _resetFilterBarListeners() {
  filterBarListenersAttached = false;
}

/**
 * Renders the filter bar: updates active status filter button highlighting
 * and priority filter dropdown selection. Sets up event listeners on first call.
 * @param {object} state - The current AppState
 */
export function renderFilterBar(state) {
  const statusButtons = document.querySelectorAll('.status-filters .filter-btn');
  const priorityFilter = document.getElementById('priority-filter');

  // Update active class on status filter buttons
  statusButtons.forEach((btn) => {
    if (btn.getAttribute('data-filter') === state.statusFilter) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update priority filter dropdown selection
  if (priorityFilter) {
    priorityFilter.value = state.priorityFilter;
  }

  // Attach event listeners only once
  if (!filterBarListenersAttached) {
    filterBarListenersAttached = true;

    statusButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        updateState((s) => {
          s.statusFilter = filter;
        });
      });
    });

    if (priorityFilter) {
      priorityFilter.addEventListener('change', () => {
        updateState((s) => {
          s.priorityFilter = priorityFilter.value;
        });
      });
    }
  }
}


let footerListenersAttached = false;

/**
 * Resets the footer listener flag. For testing only.
 */
export function _resetFooterListeners() {
  footerListenersAttached = false;
}

/**
 * Renders the footer: updates the active item count and shows/hides
 * the "Clear Completed" button based on whether completed items exist.
 * Sets up the click handler on #clear-completed only once.
 * @param {object} state - The current AppState
 */
export function renderFooter(state) {
  const itemCountEl = document.getElementById('item-count');
  const clearCompletedBtn = document.getElementById('clear-completed');

  // Update active item count
  if (itemCountEl) {
    const count = getActiveCount(state.todos);
    itemCountEl.textContent = count === 1 ? '1 item left' : `${count} items left`;
  }

  // Show/hide Clear Completed button
  if (clearCompletedBtn) {
    clearCompletedBtn.style.display = hasCompletedItems(state.todos) ? '' : 'none';
  }

  // Attach click handler only once
  if (!footerListenersAttached) {
    footerListenersAttached = true;

    if (clearCompletedBtn) {
      clearCompletedBtn.addEventListener('click', () => {
        clearCompleted();
      });
    }
  }
}
