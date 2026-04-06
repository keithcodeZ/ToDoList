# Requirements Document

## Introduction

A web-based todo list application that allows users to create, manage, and organize tasks. The application provides a clean interface for adding, completing, editing, and deleting todo items, with persistent storage so tasks survive page reloads.

## Glossary

- **App**: The todo list web application
- **Todo_Item**: A single task entry containing a title, completion status, optional deadline, priority level, and unique identifier
- **Priority_Level**: A classification assigned to a Todo_Item indicating its importance; valid values are "High", "Medium", "Low", and "None"
- **Priority_Indicator**: A visual element (such as a colored badge or icon) displayed alongside a Todo_Item to represent its Priority_Level
- **Deadline**: An optional date assigned to a Todo_Item representing when the task is due
- **Overdue_Item**: A Todo_Item whose Deadline is earlier than the current date and whose status is incomplete
- **Todo_List**: The ordered collection of all Todo_Items displayed in the App
- **Input_Field**: The text input element where users type new todo titles
- **Filter**: A UI control that limits which Todo_Items are visible based on completion status

## Requirements

### Requirement 1: Add a Todo Item

**User Story:** As a user, I want to add a new todo item, so that I can track tasks I need to complete.

#### Acceptance Criteria

1. WHEN the user types a title into the Input_Field and presses Enter, THE App SHALL create a new Todo_Item with the entered title, an incomplete status, and a Priority_Level of "None", and add the Todo_Item to the Todo_List.
2. WHEN a new Todo_Item is created, THE App SHALL clear the Input_Field.
3. IF the user submits the Input_Field with an empty or whitespace-only title, THEN THE App SHALL not create a Todo_Item and SHALL keep the Input_Field unchanged.

### Requirement 2: Display Todo Items

**User Story:** As a user, I want to see all my todo items, so that I can review what I need to do.

#### Acceptance Criteria

1. THE App SHALL display all Todo_Items in the Todo_List in the order they were created, with the most recently created Todo_Item appearing last.
2. THE App SHALL display the title, completion status, Priority_Level, and Deadline (if set) of each Todo_Item.
3. WHEN a Todo_Item has a Deadline, THE App SHALL display the Deadline as a formatted date next to the Todo_Item title.
4. WHEN the Todo_List contains zero Todo_Items, THE App SHALL display an empty state message indicating no tasks exist.

### Requirement 3: Complete a Todo Item

**User Story:** As a user, I want to mark a todo item as complete, so that I can track my progress.

#### Acceptance Criteria

1. WHEN the user clicks the completion toggle on a Todo_Item, THE App SHALL change the Todo_Item status from incomplete to complete.
2. WHEN a Todo_Item is marked as complete, THE App SHALL apply a visual distinction (such as strikethrough text) to the Todo_Item title.
3. WHEN the user clicks the completion toggle on a completed Todo_Item, THE App SHALL change the Todo_Item status from complete to incomplete and remove the visual distinction.

### Requirement 4: Delete a Todo Item

**User Story:** As a user, I want to delete a todo item, so that I can remove tasks that are no longer relevant.

#### Acceptance Criteria

1. WHEN the user clicks the delete control on a Todo_Item, THE App SHALL remove the Todo_Item from the Todo_List.
2. WHEN a Todo_Item is deleted, THE App SHALL update the displayed Todo_List immediately without requiring a page reload.

### Requirement 5: Edit a Todo Item

**User Story:** As a user, I want to edit a todo item's title, so that I can correct or update task descriptions.

#### Acceptance Criteria

1. WHEN the user double-clicks on a Todo_Item title, THE App SHALL replace the title display with an editable text input containing the current title.
2. WHEN the user presses Enter or clicks outside the editable input, THE App SHALL save the updated title and return to the display view.
3. IF the user clears the editable input and confirms, THEN THE App SHALL delete the Todo_Item from the Todo_List.
4. WHEN the user presses Escape while editing, THE App SHALL discard changes and return to the display view with the original title.

### Requirement 6: Filter Todo Items

**User Story:** As a user, I want to filter my todo items by status, so that I can focus on incomplete or completed tasks.

#### Acceptance Criteria

1. THE App SHALL provide three Filter options: "All", "Active", and "Completed".
2. WHEN the user selects the "All" Filter, THE App SHALL display all Todo_Items in the Todo_List.
3. WHEN the user selects the "Active" Filter, THE App SHALL display only Todo_Items with an incomplete status.
4. WHEN the user selects the "Completed" Filter, THE App SHALL display only Todo_Items with a complete status.
5. THE App SHALL visually indicate which Filter is currently selected.

### Requirement 7: Display Item Count

**User Story:** As a user, I want to see how many items remain, so that I can gauge my remaining workload.

#### Acceptance Criteria

1. THE App SHALL display the count of incomplete Todo_Items in the Todo_List.
2. WHEN a Todo_Item status changes or a Todo_Item is added or removed, THE App SHALL update the displayed count immediately.

### Requirement 8: Clear Completed Items

**User Story:** As a user, I want to remove all completed items at once, so that I can clean up my list efficiently.

#### Acceptance Criteria

1. WHEN completed Todo_Items exist in the Todo_List, THE App SHALL display a "Clear Completed" control.
2. WHEN the user clicks the "Clear Completed" control, THE App SHALL remove all Todo_Items with a complete status from the Todo_List.
3. WHEN no completed Todo_Items exist in the Todo_List, THE App SHALL hide the "Clear Completed" control.

### Requirement 9: Persist Todo Items

**User Story:** As a user, I want my todo items to be saved, so that my tasks are not lost when I close or reload the page.

#### Acceptance Criteria

1. WHEN a Todo_Item is created, updated, completed, or deleted, THE App SHALL persist the current state of the Todo_List to browser local storage.
2. WHEN the App is loaded, THE App SHALL restore the Todo_List from browser local storage.
3. IF no persisted data exists in local storage, THEN THE App SHALL initialize with an empty Todo_List.
4. FOR ALL valid Todo_List states, saving to local storage then loading from local storage SHALL produce an equivalent Todo_List (round-trip property).

### Requirement 10: Set a Deadline on a Todo Item

**User Story:** As a user, I want to set a deadline on a todo item, so that I can track when tasks are due.

#### Acceptance Criteria

1. WHEN the user creates a new Todo_Item, THE App SHALL provide an optional date picker for setting a Deadline.
2. WHEN the user clicks on the Deadline area of an existing Todo_Item, THE App SHALL display a date picker allowing the user to set or change the Deadline.
3. WHEN the user selects a date from the date picker, THE App SHALL assign the selected date as the Deadline of the Todo_Item and persist the change.
4. WHEN the user clears the date picker value, THE App SHALL remove the Deadline from the Todo_Item.

### Requirement 11: Highlight Overdue Items

**User Story:** As a user, I want overdue items to be visually highlighted, so that I can quickly identify tasks that are past their deadline.

#### Acceptance Criteria

1. WHILE a Todo_Item is an Overdue_Item, THE App SHALL apply a visual distinction (such as red text or a warning icon) to the Todo_Item.
2. WHEN a Todo_Item is marked as complete, THE App SHALL remove the overdue visual distinction from the Todo_Item regardless of the Deadline.
3. WHEN the current date changes past a Todo_Item Deadline, THE App SHALL apply the overdue visual distinction without requiring a page reload.

### Requirement 12: Sort Todo Items by Deadline

**User Story:** As a user, I want to sort my todo items by deadline, so that I can prioritize tasks that are due soonest.

#### Acceptance Criteria

1. THE App SHALL provide a sort control that allows the user to sort the Todo_List by Deadline.
2. WHEN the user activates the sort-by-deadline control, THE App SHALL display Todo_Items with the earliest Deadline first, and Todo_Items without a Deadline last.
3. WHEN the user deactivates the sort-by-deadline control, THE App SHALL return to displaying Todo_Items in creation order.

### Requirement 13: Set Priority Level on a Todo Item

**User Story:** As a user, I want to assign a priority level to a todo item, so that I can indicate which tasks are most important.

#### Acceptance Criteria

1. WHEN the user creates a new Todo_Item, THE App SHALL assign a default Priority_Level of "None" to the Todo_Item.
2. THE App SHALL provide a Priority_Level selector on each Todo_Item with the options "High", "Medium", "Low", and "None".
3. WHEN the user selects a Priority_Level from the selector, THE App SHALL update the Todo_Item Priority_Level and persist the change.

### Requirement 14: Display Priority Level

**User Story:** As a user, I want to see the priority level of each todo item, so that I can quickly identify important tasks.

#### Acceptance Criteria

1. THE App SHALL display a Priority_Indicator next to each Todo_Item that has a Priority_Level other than "None".
2. THE App SHALL use distinct visual styles for each Priority_Level: "High" displayed in red, "Medium" displayed in orange, and "Low" displayed in blue.
3. WHEN a Todo_Item has a Priority_Level of "None", THE App SHALL not display a Priority_Indicator for that Todo_Item.

### Requirement 15: Filter Todo Items by Priority

**User Story:** As a user, I want to filter my todo items by priority level, so that I can focus on tasks of a specific importance.

#### Acceptance Criteria

1. THE App SHALL provide a priority Filter control with the options "All Priorities", "High", "Medium", "Low", and "None".
2. WHEN the user selects a priority Filter option, THE App SHALL display only Todo_Items matching the selected Priority_Level.
3. WHEN the user selects the "All Priorities" option, THE App SHALL display Todo_Items of all Priority_Levels.
4. THE App SHALL allow the priority Filter and the status Filter to be applied simultaneously.
5. THE App SHALL visually indicate which priority Filter option is currently selected.

### Requirement 16: Sort Todo Items by Priority

**User Story:** As a user, I want to sort my todo items by priority level, so that I can see the most important tasks first.

#### Acceptance Criteria

1. THE App SHALL provide a sort control that allows the user to sort the Todo_List by Priority_Level.
2. WHEN the user activates the sort-by-priority control, THE App SHALL display Todo_Items ordered by Priority_Level from "High" to "Medium" to "Low" to "None".
3. WHEN the user deactivates the sort-by-priority control, THE App SHALL return to displaying Todo_Items in creation order.
4. WHEN both sort-by-priority and sort-by-deadline are active, THE App SHALL sort primarily by Priority_Level and secondarily by Deadline within each Priority_Level group.
