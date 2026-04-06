# Implementation Plan: Todo List Website

## Overview

Build a client-side todo list app with HTML, CSS, and vanilla JavaScript following a three-layer architecture (UI → State Management → localStorage). Core logic and persistence are implemented first as pure functions with property tests, then the UI layer is built on top, and finally everything is wired together.

## Tasks

- [x] 1. Set up project structure and core data models
  - Create `index.html`, `style.css`, and JS module files
  - Set up Vitest + fast-check for testing
  - Define `TodoItem` and `AppState` data structures, UUID generation utility, and `isValidTitle()` validation function
  - Define priority color mapping function
  - _Requirements: 1.1, 1.3, 13.1_

- [ ] 2. Implement persistence layer
  - [x] 2.1 Implement `saveTodos()` and `loadTodos()` with localStorage
    - Serialize `TodoItem[]` to JSON and store under `"todo-app-todos"` key
    - Deserialize on load, handle corrupted JSON by falling back to empty array
    - Skip malformed items missing required fields during deserialization
    - Handle `localStorage` read/write failures gracefully
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 2.2 Write property test for persistence round-trip
    - **Property 12: Persistence round-trip**
    - **Validates: Requirements 9.1, 9.2, 9.4**

- [ ] 3. Implement core logic functions
  - [x] 3.1 Implement filtering functions
    - `filterByStatus(todos, filter)` — returns items matching "All", "Active", or "Completed"
    - `filterByPriority(todos, filter)` — returns items matching "All", "High", "Medium", "Low", or "None"
    - `applyFilters(todos, statusFilter, priorityFilter)` — combines both filters
    - _Requirements: 6.2, 6.3, 6.4, 15.2, 15.3, 15.4_

  - [x] 3.2 Implement sorting functions
    - `sortByDeadline(todos)` — earliest deadline first, null deadlines last
    - `sortByPriority(todos)` — High (0) → Medium (1) → Low (2) → None (3)
    - `applySorting(todos, sortSettings)` — applies active sorts; combined sort uses priority as primary, deadline as secondary
    - When no sort is active, maintain creation order (`createdAt` ascending)
    - _Requirements: 2.1, 12.2, 12.3, 16.2, 16.3, 16.4_

  - [x] 3.3 Implement overdue detection and active count
    - `isOverdue(item, today)` — returns true if deadline < today AND completed === false
    - `getActiveCount(todos)` — returns count of items where completed === false
    - _Requirements: 7.1, 11.1, 11.2, 11.3_

  - [x] 3.4 Write property tests for core logic functions
    - **Property 8: Filter correctness**
    - **Validates: Requirements 6.2, 6.3, 6.4, 15.2, 15.3, 15.4**
    - **Property 9: Active item count**
    - **Validates: Requirements 7.1**
    - **Property 13: Overdue detection**
    - **Validates: Requirements 11.1, 11.2, 11.3**
    - **Property 14: Sort by deadline ordering**
    - **Validates: Requirements 12.2**
    - **Property 15: Default creation order**
    - **Validates: Requirements 2.1, 12.3, 16.3**
    - **Property 16: Sort by priority ordering**
    - **Validates: Requirements 16.2**
    - **Property 17: Combined sort ordering**
    - **Validates: Requirements 16.4**
    - **Property 18: Priority color mapping**
    - **Validates: Requirements 14.1, 14.2, 14.3**

- [x] 4. Checkpoint - Core logic and persistence
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement state management and todo CRUD operations
  - [x] 5.1 Implement app initialization and state management
    - `initApp()` — load todos from localStorage, set default filters/sort, trigger initial render
    - `updateState(mutator)` — apply mutation, persist todos, trigger re-render
    - `render(state)` — orchestrate rendering of all components based on current state
    - _Requirements: 9.2, 9.3_

  - [x] 5.2 Implement add todo
    - Create new TodoItem with entered title, `completed: false`, `priority: "None"`, `deadline: null`, generated UUID, and `createdAt` timestamp
    - Clear input field after successful add
    - Reject empty or whitespace-only titles using `isValidTitle()`
    - _Requirements: 1.1, 1.2, 1.3, 13.1_

  - [x] 5.3 Implement toggle completion, delete, and edit
    - Toggle: flip `completed` boolean, apply/remove visual distinction
    - Delete: remove item from array by ID
    - Edit: double-click enters edit mode, Enter/blur saves new title, Escape discards, empty title on confirm deletes item
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4_

  - [x] 5.4 Implement deadline assignment and priority level changes
    - Set/change deadline via date picker interaction
    - Clear deadline by clearing date picker value (sets to null)
    - Change priority level via selector (persist change)
    - _Requirements: 10.2, 10.3, 10.4, 13.2, 13.3_

  - [x] 5.5 Implement clear completed
    - Remove all items where `completed === true`
    - Show "Clear Completed" button only when completed items exist
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 5.6 Write property tests for CRUD operations
    - **Property 1: New item defaults**
    - **Validates: Requirements 1.1, 13.1**
    - **Property 2: Whitespace title rejection**
    - **Validates: Requirements 1.3**
    - **Property 4: Completion toggle round-trip**
    - **Validates: Requirements 3.1, 3.3**
    - **Property 5: Delete removes item**
    - **Validates: Requirements 4.1**
    - **Property 6: Edit saves new title**
    - **Validates: Requirements 5.2**
    - **Property 7: Edit escape discards changes**
    - **Validates: Requirements 5.4**
    - **Property 10: Clear completed removes only completed**
    - **Validates: Requirements 8.2**
    - **Property 11: Clear completed button visibility**
    - **Validates: Requirements 8.1, 8.3**
    - **Property 19: Deadline assignment**
    - **Validates: Requirements 10.3, 10.4**

- [x] 6. Checkpoint - State management and CRUD
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Build UI layer - HTML structure and CSS styling
  - [x] 7.1 Create HTML structure
    - Semantic `index.html` with input area (text field, date picker, priority selector), todo list container, filter bar, sort controls, and footer
    - _Requirements: 1.1, 6.1, 10.1, 12.1, 15.1, 16.1_

  - [x] 7.2 Create CSS styling
    - Completed items: strikethrough text
    - Overdue items: red text or warning icon
    - Priority indicators: red for High, orange for Medium, blue for Low, hidden for None
    - Active filter/sort highlighting
    - Empty state styling
    - Responsive layout
    - _Requirements: 2.2, 2.3, 3.2, 6.5, 11.1, 14.1, 14.2, 14.3, 15.5_

- [ ] 8. Build UI layer - rendering functions
  - [x] 8.1 Implement `renderTodoInput()`
    - Text input field with Enter key handler
    - Optional date picker for deadline
    - Priority selector dropdown defaulting to "None"
    - _Requirements: 1.1, 10.1_

  - [x] 8.2 Implement `renderTodoItem()`
    - Checkbox for completion toggle
    - Title display with double-click to enter edit mode
    - Priority indicator badge with color coding
    - Formatted deadline display
    - Overdue visual distinction
    - Delete button
    - _Requirements: 2.2, 2.3, 3.2, 5.1, 10.2, 11.1, 14.1_

  - [x] 8.3 Implement `renderTodoList()`
    - Apply current filters and sort settings to todo array
    - Render filtered/sorted TodoItem components
    - Show empty state message when no items match
    - _Requirements: 2.1, 2.4_

  - [x] 8.4 Implement `renderFilterBar()`
    - Status filter buttons: All, Active, Completed
    - Priority filter dropdown: All Priorities, High, Medium, Low, None
    - Visually highlight currently selected options
    - _Requirements: 6.1, 6.5, 15.1, 15.5_

  - [x] 8.5 Implement `renderSortControls()`
    - Toggle button for sort-by-deadline
    - Toggle button for sort-by-priority
    - Visual indication of active sort
    - _Requirements: 12.1, 16.1_

  - [x] 8.6 Implement `renderFooter()`
    - Display count of incomplete items (updates immediately on changes)
    - "Clear Completed" button visible only when completed items exist
    - _Requirements: 7.1, 7.2, 8.1, 8.3_

- [ ] 9. Wire everything together and integrate
  - [x] 9.1 Connect UI to state management
    - Wire all UI component event handlers to state mutation functions
    - Set up event delegation on the todo list container
    - Initialize app from localStorage on page load
    - Handle overdue re-evaluation without page reload
    - _Requirements: 9.2, 9.3, 11.3_

  - [x] 9.2 Write unit tests for edge cases
    - Empty state message displayed when list is empty
    - Editing to empty string deletes the item
    - Loading corrupted localStorage falls back to empty list
    - Priority color mapping returns correct colors
    - _Requirements: 2.4, 5.3, 9.3_

  - [x] 9.3 Write property test for input field cleared after add
    - **Property 3: Input field cleared after add**
    - **Validates: Requirements 1.2**

- [x] 10. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The app uses vanilla JavaScript with no frameworks or build tools
- Vitest + fast-check are used for testing
