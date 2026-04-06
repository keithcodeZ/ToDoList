/**
 * Core logic functions: filtering, sorting, overdue detection.
 */

import { PRIORITY_ORDER } from './models.js';

/**
 * Filters todos by completion status.
 * @param {Array} todos - Array of TodoItem objects
 * @param {"All"|"Active"|"Completed"} filter - Status filter
 * @returns {Array} Filtered array of TodoItem objects
 */
export function filterByStatus(todos, filter) {
  if (filter === 'Active') return todos.filter((t) => !t.completed);
  if (filter === 'Completed') return todos.filter((t) => t.completed);
  return todos;
}

/**
 * Filters todos by priority level.
 * @param {Array} todos - Array of TodoItem objects
 * @param {"All"|"High"|"Medium"|"Low"|"None"} filter - Priority filter
 * @returns {Array} Filtered array of TodoItem objects
 */
export function filterByPriority(todos, filter) {
  if (filter === 'All') return todos;
  return todos.filter((t) => t.priority === filter);
}

/**
 * Applies both status and priority filters (intersection).
 * @param {Array} todos - Array of TodoItem objects
 * @param {"All"|"Active"|"Completed"} statusFilter
 * @param {"All"|"High"|"Medium"|"Low"|"None"} priorityFilter
 * @returns {Array} Filtered array of TodoItem objects
 */
export function applyFilters(todos, statusFilter, priorityFilter) {
  return filterByPriority(filterByStatus(todos, statusFilter), priorityFilter);
}

/**
 * Sorts todos by deadline — earliest first, null deadlines last.
 * Returns a new array.
 * @param {Array} todos
 * @returns {Array}
 */
export function sortByDeadline(todos) {
  return [...todos].sort((a, b) => {
    if (a.deadline === null && b.deadline === null) return 0;
    if (a.deadline === null) return 1;
    if (b.deadline === null) return -1;
    return a.deadline < b.deadline ? -1 : a.deadline > b.deadline ? 1 : 0;
  });
}

/**
 * Sorts todos by priority — High (0) → Medium (1) → Low (2) → None (3).
 * Returns a new array.
 * @param {Array} todos
 * @returns {Array}
 */
export function sortByPriority(todos) {
  return [...todos].sort((a, b) => {
    return (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3);
  });
}

/**
 * Applies active sort settings to the todo list.
 * Combined: primary sort by priority, secondary by deadline.
 * No sort active: creation order (createdAt ascending).
 * Returns a new array.
 * @param {Array} todos
 * @param {{ sortByDeadline: boolean, sortByPriority: boolean }} sortSettings
 * @returns {Array}
 */
export function applySorting(todos, sortSettings) {
  if (sortSettings.sortByPriority && sortSettings.sortByDeadline) {
    return [...todos].sort((a, b) => {
      const pA = PRIORITY_ORDER[a.priority] ?? 3;
      const pB = PRIORITY_ORDER[b.priority] ?? 3;
      if (pA !== pB) return pA - pB;
      if (a.deadline === null && b.deadline === null) return 0;
      if (a.deadline === null) return 1;
      if (b.deadline === null) return -1;
      return a.deadline < b.deadline ? -1 : a.deadline > b.deadline ? 1 : 0;
    });
  }
  if (sortSettings.sortByPriority) {
    return sortByPriority(todos);
  }
  if (sortSettings.sortByDeadline) {
    return sortByDeadline(todos);
  }
  // No sort active — maintain creation order
  return [...todos].sort((a, b) => a.createdAt - b.createdAt);
}

/**
 * Checks whether a todo item is overdue.
 * An item is overdue if it has a deadline earlier than today AND is not completed.
 * Completed items are never overdue.
 * @param {object} item - A TodoItem
 * @param {Date} today - The current date to compare against
 * @returns {boolean}
 */
export function isOverdue(item, today) {
  if (item.completed || item.deadline === null) return false;
  const todayStr = today.toISOString().split('T')[0];
  return item.deadline < todayStr;
}

/**
 * Returns the count of active (incomplete) items.
 * @param {Array} todos - Array of TodoItem objects
 * @returns {number}
 */
export function getActiveCount(todos) {
  return todos.filter((t) => !t.completed).length;
}

/**
 * Returns true if any item in the list has completed === true.
 * Used to determine visibility of the "Clear Completed" button.
 * @param {Array} todos - Array of TodoItem objects
 * @returns {boolean}
 */
export function hasCompletedItems(todos) {
  return todos.some((t) => t.completed);
}
