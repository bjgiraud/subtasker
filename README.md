# Subtasker

Hierarchical task management API with **recursive subtasks**, a lightweight frontend, and **LLM-assisted task splitting**.

## Why this project
Subtasker was designed as a practical product prototype: a task management backend with recursive data structures, CRUD routes, and an AI feature that turns one complex task into a short list of actionable subtasks.

## Demo
Add 1 to 3 screenshots in `assets/` and replace this section with something like:

```md
![Main view](assets/subtasker-main.png)
![Kanban view](assets/subtasker-kanban.png)
```

## Features
- Create, read, update, and delete tasks
- Nested subtasks with recursive traversal
- Lightweight task view and Kanban view
- Automatic split into 3 to 7 subtasks through **Ollama**
- Structured data validation with **Pydantic**

## Tech stack
- **Python**
- **FastAPI**
- **Pydantic**
- **Requests**
- HTML / CSS / JavaScript
- **Ollama**

## Architecture
```text
Static frontend -> FastAPI REST API -> in-memory task store
                                      -> recursive task logic
                                      -> local LLM call via Ollama
```

## Main routes
- `GET /tasks` — list all tasks
- `GET /tasks/{task_id}` — retrieve one task
- `POST /tasks` — create a task
- `POST /tasks/{parent_id}/subtasks` — create a subtask
- `PUT /tasks/{task_id}` — update a task
- `DELETE /tasks/{task_id}` — delete a task
- `POST /tasks/{task_id}/split` — generate subtasks with AI
- `GET /` — main page
- `GET /kanban` — Kanban view

## Installation
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Requirements
- [Ollama](https://ollama.com/) installed locally
- a local model available, for example:

```bash
ollama pull gemma3:4b
```

## Run locally
```bash
uvicorn main:app --reload
```

Then open `http://127.0.0.1:8000`

## Project structure
```text
subtasker/
├── main.py
├── static/
│   ├── index.html
│   ├── kanban.html
│   └── *.js
├── tasks.json           # local state, ignored by git
├── assets/              # screenshots for GitHub
├── docs/
├── requirements.txt
└── README.md
```

## What this project demonstrates
- FastAPI REST API design
- recursive data modeling with Pydantic
- integration of a local LLM into a useful workflow
- a full prototype with simple frontend + API backend

## Current limitations
- persistence is mostly in memory
- no authentication
- deliberately lightweight frontend

## Next improvements
- database-backed persistence
- drag-and-drop Kanban
- user accounts and permissions
- task analytics and progress tracking
