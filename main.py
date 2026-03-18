from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import uuid4, UUID
from datetime import datetime, date

app = FastAPI(title="Subtasker API")

# ------------------------
# Models
# ------------------------

class TaskInput(BaseModel):
    title: str
    description: Optional[str] = ""
    start_date: Optional[date] = None
    deadline: Optional[date] = None
    priority: str = "medium"

class TaskModel(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    title: str
    description: Optional[str] = ""
    status: str = "todo"
    priority: str = "medium"
    start_date: Optional[date] = None
    deadline: Optional[date] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    subtasks: List["TaskModel"] = []

    class Config:
        from_attributes = True

TaskModel.model_rebuild()

# ------------------------
# In-memory store
# ------------------------

tasks: List[TaskModel] = []

# ------------------------
# Recursive helpers
# ------------------------

def find_task(task_list: List[TaskModel], task_id: UUID) -> Optional[TaskModel]:
    for task in task_list:
        if task.id == task_id:
            return task
        found = find_task(task.subtasks, task_id)
        if found:
            return found
    return None

def delete_task(task_list: List[TaskModel], task_id: UUID) -> bool:
    for i, task in enumerate(task_list):
        if task.id == task_id:
            del task_list[i]
            return True
        if delete_task(task.subtasks, task_id):
            return True
    return False

# ------------------------
# API
# ------------------------

@app.get("/tasks", response_model=List[TaskModel])
def get_all_tasks():
    return tasks

@app.get("/tasks/{task_id}", response_model=TaskModel)
def get_task(task_id: UUID):
    task = find_task(tasks, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@app.post("/tasks", response_model=TaskModel)
def create_task(task: TaskInput):
    new_task = TaskModel(
        title=task.title,
        description=task.description,
        start_date=task.start_date,
        deadline=task.deadline,
        priority=task.priority,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    tasks.append(new_task)
    return new_task

@app.post("/tasks/{parent_id}/subtasks", response_model=TaskModel)
def add_subtask(parent_id: UUID, subtask: TaskInput):
    parent = find_task(tasks, parent_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent task not found")
    new_subtask = TaskModel(
        title=subtask.title,
        description=subtask.description or f"{subtask.title} pour {parent.description or parent.title}",
        start_date=subtask.start_date,
        deadline=subtask.deadline,
        priority=subtask.priority,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    parent.subtasks.append(new_subtask)
    parent.updated_at = datetime.utcnow()
    return new_subtask

@app.put("/tasks/{task_id}", response_model=TaskModel)
def update_task(task_id: UUID, updated: TaskInput):
    task = find_task(tasks, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.title = updated.title
    task.description = updated.description
    task.start_date = updated.start_date
    task.deadline = updated.deadline
    task.priority = updated.priority
    task.updated_at = datetime.utcnow()
    return task

@app.delete("/tasks/{task_id}")
def delete_task_by_id(task_id: UUID):
    if not delete_task(tasks, task_id):
        raise HTTPException(status_code=404, detail="Task not found")
    return {"detail": "Task deleted successfully"}

# ------------------------
# Static files
# ------------------------

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=FileResponse)
def root():
    return "static/index.html"

@app.get("/kanban", response_class=FileResponse)
def kanban_view():
    return "static/kanban.html"



import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "gemma3:4b"


@app.post("/tasks/{task_id}/split")
def split_task(task_id: UUID):
    task = find_task(tasks, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not task.description:
        # If no description is provided, fall back to the task title
        task.description = task.title

    prompt = f"""You are an expert project-planning assistant.
Read the task description below and propose a clear, coherent list of 3 to 7 actionable subtasks.

Wrap each subtask title between vertical bars like this: "|Subtask title|".

Description:
{task.description}

Reply only with subtask titles wrapped in vertical bars. Do not add explanations, numbering, or markdown tables.
"""

    try:
        response = requests.post(OLLAMA_URL, json={
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False
        })

        data = response.json()
        content = data.get("response", "")

        # Parse subtask titles wrapped in |
        import re
        titles = re.findall(r"\|(.+?)\|", content)

        for title in titles:
            subtask = TaskModel(
                title=title.strip(),
                description=f"{title.strip()} for {task.description or task.title}",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            task.subtasks.append(subtask)

        task.updated_at = datetime.utcnow()
        return {"added_subtasks": titles}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# run
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)