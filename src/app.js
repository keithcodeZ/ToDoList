/**
 * App entry point: wires UI rendering to state management and initializes the app.
 */

import { initApp, getState, render, setRenderer } from './state.js';
import { renderTodoInput, renderTodoList, renderFilterBar, renderSortControls, renderFooter } from './ui.js';

// Register the renderer callback to break the circular dependency.
// state.js calls this on every state change instead of importing ui.js directly.
setRenderer((state) => {
  renderTodoList(state);
  renderFilterBar(state);
  renderSortControls(state);
  renderFooter(state);
});

document.addEventListener('DOMContentLoaded', () => {
  // Set up input event handlers (Enter key to add todo)
  renderTodoInput();

  // Load state from localStorage and trigger initial render
  initApp();

  // Re-evaluate overdue items every 60 seconds without page reload
  setInterval(() => {
    render(getState());
  }, 60000);
});
