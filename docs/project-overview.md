# Project overview

## Goal
Provide a task management API that supports recursive subtasks and can automatically split a complex task into smaller actionable steps.

## Core functionality
- CRUD operations for tasks
- recursive subtask trees
- simple frontend + Kanban view
- AI-assisted task decomposition with a local LLM

## Main flow
1. A task is created through the UI or API.
2. The task can contain nested subtasks.
3. The `/split` route sends the task description to a local LLM.
4. Returned subtask titles are parsed and appended to the tree.

## Why it matters
This project demonstrates API design, recursive data handling, and a practical use of AI inside a workflow tool.
