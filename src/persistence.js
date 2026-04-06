/**
 * Persistence layer: localStorage read/write for todo items.
 */

const STORAGE_KEY = 'todo-app-todos';

const REQUIRED_FIELDS = ['id', 'title', 'completed', 'priority', 'deadline', 'createdAt'];

/**
 * Checks whether an item has all required TodoItem fields.
 * @param {*} item
 * @returns {boolean}
 */
function isValidTodoItem(item) {
  if (item === null || typeof item !== 'object') return false;
  return REQUIRED_FIELDS.every((field) => field in item);
}

/**
 * Saves the todo array to localStorage as JSON.
 * Logs a warning if the write fails.
 * @param {Array} todos
 */
export function saveTodos(todos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (e) {
    console.warn('Failed to save todos to localStorage:', e);
  }
}

/**
 * Loads the todo array from localStorage.
 * Returns an empty array if:
 *  - localStorage read fails
 *  - stored value is not valid JSON
 *  - stored value is not an array
 * Skips individual items that are missing required fields.
 * @returns {Array}
 */
export function loadTodos() {
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    return [];
  }

  if (raw === null) return [];

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  return parsed.filter(isValidTodoItem);
}
