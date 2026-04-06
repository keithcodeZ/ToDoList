# Todo List App

A client-side todo list application built with HTML, CSS, and vanilla JavaScript. No frameworks, no build tools — just clean, simple code that runs directly in the browser.

## About This Project

This is my first vibe coded project! I created it during our Agentic AI Training session with our Senior Director for Development. The entire app was built using [Kiro](https://kiro.dev) — from spec to implementation — following a spec-driven development workflow.

## Features

- Create, edit, and delete todo items
- Mark tasks as complete with visual strikethrough
- Set deadlines with overdue highlighting
- Assign priority levels (High, Medium, Low) with color-coded badges
- Filter by status (All, Active, Completed) and priority
- Sort by deadline or priority (or both)
- Persistent storage via localStorage
- Responsive design

## Tech Stack

- HTML, CSS, vanilla JavaScript (ES modules)
- Vitest + fast-check for unit and property-based testing
- 175 tests (102 unit + 54 UI + 19 property-based)

## Getting Started

```bash
npm install
```

Open `index.html` in your browser to use the app.

## Running Tests

```bash
npm test
```

## How It Was Built

This project was developed using Kiro's spec-driven workflow:

1. **Requirements** — defined user stories and acceptance criteria
2. **Design** — created architecture, data models, and 19 correctness properties
3. **Implementation** — built incrementally with property-based testing at every step

The entire process — from idea to working app with full test coverage — was done through vibe coding with Kiro.

You can find the full spec documents in [`.kiro/specs/todo-list-website/`](.kiro/specs/todo-list-website/):

- [`requirements.md`](.kiro/specs/todo-list-website/requirements.md) — user stories and acceptance criteria
- [`design.md`](.kiro/specs/todo-list-website/design.md) — architecture, data models, and correctness properties
- [`tasks.md`](.kiro/specs/todo-list-website/tasks.md) — implementation plan and task breakdown
