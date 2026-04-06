/**
 * Core data models and utility functions for the Todo List app.
 */

/** Priority levels and their sort order */
export const PRIORITIES = ['High', 'Medium', 'Low', 'None'];

export const PRIORITY_ORDER = {
  High: 0,
  Medium: 1,
  Low: 2,
  None: 3,
};

/** Priority color mapping */
export const PRIORITY_COLORS = {
  High: 'red',
  Medium: 'orange',
  Low: 'blue',
  None: null,
};

/**
 * Returns the color associated with a priority level.
 * @param {string} priority - "High", "Medium", "Low", or "None"
 * @returns {string|null} Color string or null for "None"
 */
export function getPriorityColor(priority) {
  return PRIORITY_COLORS[priority] ?? null;
}

/**
 * Generate a UUID v4 string.
 * @returns {string}
 */
export function generateId() {
  return crypto.randomUUID();
}

/**
 * Validates that a title is non-empty and not whitespace-only.
 * @param {string} title
 * @returns {boolean}
 */
export function isValidTitle(title) {
  return typeof title === 'string' && title.trim().length > 0;
}

/**
 * Creates a new TodoItem with defaults.
 * @param {string} title
 * @param {string|null} [deadline=null]
 * @param {string} [priority='None']
 * @returns {object} TodoItem
 */
export function createTodoItem(title, deadline = null, priority = 'None') {
  return {
    id: generateId(),
    title: title.trim(),
    completed: false,
    priority,
    deadline,
    createdAt: Date.now(),
  };
}

/**
 * Creates a default AppState.
 * @param {Array} [todos=[]]
 * @returns {object} AppState
 */
export function createAppState(todos = []) {
  return {
    todos,
    statusFilter: 'All',
    priorityFilter: 'All',
    sortByDeadline: false,
    sortByPriority: false,
  };
}
