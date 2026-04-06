/**
 * State management: central AppState, updateState, initApp, render orchestration.
 */

import { createAppState, createTodoItem, isValidTitle } from './models.js';
import { loadTodos, saveTodos } from './persistence.js';

/** @type {import('./models.js').AppState} */
let state = createAppState();

/**
 * Returns the current application state.
 * @returns {object} AppState
 */
export function getState() {
  return state;
}

/** @type {((state: object) => void) | null} */
let renderer = null;

/**
 * Registers a renderer callback to break the circular dependency
 * between state.js and ui.js.
 * @param {function} fn - A function that receives AppState and renders the UI
 */
export function setRenderer(fn) {
  renderer = fn;
}

/**
 * Render orchestration — calls the registered renderer with current state.
 * @param {object} appState - The current AppState
 */
export function render(appState) {
  if (renderer) {
    renderer(appState);
  }
}

/**
 * Applies a mutation to the state, persists todos, and triggers a re-render.
 * @param {function} mutator - A function that receives the state and mutates it
 */
export function updateState(mutator) {
  mutator(state);
  saveTodos(state.todos);
  render(state);
}

/**
 * Adds a new todo item to the list.
 * @param {string} title - The todo title
 * @param {string|null} [deadline=null] - Optional deadline date string
 * @param {string} [priority='None'] - Priority level
 * @returns {boolean} true if the item was added, false if the title was invalid
 */
export function addTodo(title, deadline = null, priority = 'None') {
  if (!isValidTitle(title)) return false;
  const item = createTodoItem(title, deadline, priority);
  updateState((s) => {
    s.todos.push(item);
  });
  return true;
}

/**
 * Toggles the completed status of a todo item.
 * @param {string} id - The ID of the todo item to toggle
 */
export function toggleTodo(id) {
  updateState((s) => {
    const item = s.todos.find((t) => t.id === id);
    if (item) {
      item.completed = !item.completed;
    }
  });
}

/**
 * Deletes a todo item by ID.
 * @param {string} id - The ID of the todo item to delete
 */
export function deleteTodo(id) {
  updateState((s) => {
    s.todos = s.todos.filter((t) => t.id !== id);
  });
}

/**
 * Edits a todo item's title. If the new title is empty/whitespace, deletes the item.
 * @param {string} id - The ID of the todo item to edit
 * @param {string} newTitle - The new title for the todo item
 */
export function editTodo(id, newTitle) {
  if (!isValidTitle(newTitle)) {
    deleteTodo(id);
    return;
  }
  updateState((s) => {
    const item = s.todos.find((t) => t.id === id);
    if (item) {
      item.title = newTitle.trim();
    }
  });
}

/**
 * Sets or clears the deadline of a todo item.
 * @param {string} id - The ID of the todo item
 * @param {string|null} deadline - The deadline date string, or null to clear
 */
export function setDeadline(id, deadline) {
  updateState((s) => {
    const item = s.todos.find((t) => t.id === id);
    if (item) {
      item.deadline = deadline;
    }
  });
}

/**
 * Sets the priority level of a todo item.
 * @param {string} id - The ID of the todo item
 * @param {string} priority - The priority level ("High", "Medium", "Low", or "None")
 */
export function setPriority(id, priority) {
  updateState((s) => {
    const item = s.todos.find((t) => t.id === id);
    if (item) {
      item.priority = priority;
    }
  });
}

/**
 * Removes all completed items from the todo list.
 */
export function clearCompleted() {
  updateState((s) => {
    s.todos = s.todos.filter((t) => !t.completed);
  });
}

/**
 * Initializes the application: loads todos from localStorage,
 * creates default AppState, and triggers the initial render.
 */
export function initApp() {
  const todos = loadTodos();
  state = createAppState(todos);
  render(state);
}
