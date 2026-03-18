document.addEventListener("DOMContentLoaded", () => {
  const taskContainer = document.getElementById("task-container");
  const detailsContainer = document.getElementById("task-details");
  const expandedTaskIds = new Set();

  async function loadTasks() {
    const res = await fetch("/tasks");
    const tasks = await res.json();
    taskContainer.innerHTML = "";
    tasks.forEach(task => renderTaskItem(task, taskContainer));
  }

  function renderTaskItem(task, container, level = 0) {
    const wrapper = document.createElement("div");
    wrapper.style.marginLeft = `${level * 20}px`;
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";

    const header = document.createElement("div");
    header.className = "task-item";
    header.style.flex = "1";
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.gap = "8px";

    const toggle = document.createElement("span");
    toggle.className = "toggle-btn";
    toggle.style.cursor = "pointer";
    toggle.textContent = task.subtasks.length > 0
      ? (expandedTaskIds.has(task.id) ? "▼" : "▶")
      : "•";

    toggle.onclick = (e) => {
      e.stopPropagation();
      if (expandedTaskIds.has(task.id)) {
        expandedTaskIds.delete(task.id);
      } else {
        expandedTaskIds.add(task.id);
      }
      loadTasks();
    };

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;
    title.style.cursor = "pointer";
    title.onclick = () => showTaskDetails(task.id);

    header.appendChild(toggle);
    header.appendChild(title);
    wrapper.appendChild(header);
    container.appendChild(wrapper);

    if (task.subtasks.length > 0 && expandedTaskIds.has(task.id)) {
      task.subtasks.forEach(sub => renderTaskItem(sub, container, level + 1));
    }
  }

  async function showTaskDetails(taskId) {
    const res = await fetch(`/tasks/${taskId}`);
    const task = await res.json();

    detailsContainer.innerHTML = `
      <h3>📝 Edit task</h3>
      <form id="edit-task-form">
        <input type="text" id="edit-title" value="${task.title}" required>
        <textarea id="edit-description">${task.description}</textarea>
        <input type="date" id="edit-start-date" value="${task.start_date || ''}">
        <input type="date" id="edit-deadline" value="${task.deadline || ''}">
        <select id="edit-priority">
          <option value="low" ${task.priority === "low" ? "selected" : ""}>Low</option>
          <option value="medium" ${task.priority === "medium" ? "selected" : ""}>Medium</option>
          <option value="high" ${task.priority === "high" ? "selected" : ""}>High</option>
        </select>
        <button type="submit">💾 Save</button>
      </form>

      <button id="delete-task-btn" style="background-color:#e74c3c; color:white; border:none; padding:8px; margin-top:10px; border-radius:5px; cursor:pointer;">
        🗑️ Delete this task
      </button>
      
      <button id="split-task-btn" style="background-color:#f39c12; color:white; border:none; padding:8px; margin-top:10px; border-radius:5px; cursor:pointer;">
        ✂️ Split into subtasks (AI)
      </button>

      <h4>➕ Add a subtask</h4>
      <form id="subtask-form">
        <input type="text" id="subtask-title" placeholder="Title" required>
        <textarea id="subtask-description" placeholder="Description"></textarea>
        <input type="date" id="subtask-start-date">
        <input type="date" id="subtask-deadline">
        <select id="subtask-priority">
          <option value="low">Low</option>
          <option value="medium" selected>Medium</option>
          <option value="high">High</option>
        </select>
        <button type="submit">Add</button>
      </form>

      <h4>Subtasks</h4>
      <div id="subtasks-container"></div>
    `;

    document.getElementById("split-task-btn").onclick = async () => {
      const confirmSplit = confirm("Analyze the description and automatically create subtasks?");
      if (!confirmSplit) return;

      const res = await fetch(`/tasks/${taskId}/split`, { method: "POST" });
      const result = await res.json();

      if (result.added_subtasks?.length > 0) {
        alert("Subtasks added:\n" + result.added_subtasks.join("\n"));
        loadTasks();
        showTaskDetails(taskId);
      } else {
        alert("No subtasks detected.");
      }
    };

    document.getElementById("edit-task-form").onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        title: document.getElementById("edit-title").value,
        description: document.getElementById("edit-description").value,
        start_date: document.getElementById("edit-start-date").value || null,
        deadline: document.getElementById("edit-deadline").value || null,
        priority: document.getElementById("edit-priority").value,
      };
      await fetch(`/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      loadTasks();
      showTaskDetails(taskId);
    };

    document.getElementById("delete-task-btn").onclick = async () => {
      const confirmDelete = confirm("Are you sure you want to delete this task?");
      if (!confirmDelete) return;

      await fetch(`/tasks/${taskId}`, { method: "DELETE" });
      detailsContainer.innerHTML = `<p>🗑️ Task deleted.</p>`;
      loadTasks();
    };

    document.getElementById("subtask-form").onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        title: document.getElementById("subtask-title").value,
        description: document.getElementById("subtask-description").value,
        start_date: document.getElementById("subtask-start-date").value || null,
        deadline: document.getElementById("subtask-deadline").value || null,
        priority: document.getElementById("subtask-priority").value,
      };
      await fetch(`/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      loadTasks();
      showTaskDetails(taskId);
    };

    renderSubtasks(task.subtasks, document.getElementById("subtasks-container"));
  }

  function renderSubtasks(subtasks, container, level = 1) {
    container.innerHTML = "";
    subtasks.forEach(sub => {
      const div = document.createElement("div");
      div.className = "task-item";
      div.style.marginLeft = `${level * 20}px`;
      div.textContent = sub.title;
      div.onclick = () => showTaskDetails(sub.id);
      container.appendChild(div);

      if (sub.subtasks && sub.subtasks.length > 0) {
        const subContainer = document.createElement("div");
        subContainer.className = "subtask-container";
        container.appendChild(subContainer);
        renderSubtasks(sub.subtasks, subContainer, level + 1);
      }
    });
  }

  document.getElementById("new-root-task-btn").onclick = () => {
    showNewRootTaskForm();
  };

  function showNewRootTaskForm() {
    detailsContainer.innerHTML = `
      <h3>➕ Create a new top-level task</h3>
      <form id="create-task-form">
        <input type="text" id="new-title" placeholder="Title" required>
        <textarea id="new-description" placeholder="Description"></textarea>
        <input type="date" id="new-start-date">
        <input type="date" id="new-deadline">
        <select id="new-priority">
          <option value="low">Low</option>
          <option value="medium" selected>Medium</option>
          <option value="high">High</option>
        </select>
        <button type="submit">Create</button>
      </form>
    `;

    document.getElementById("create-task-form").onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        title: document.getElementById("new-title").value,
        description: document.getElementById("new-description").value,
        start_date: document.getElementById("new-start-date").value || null,
        deadline: document.getElementById("new-deadline").value || null,
        priority: document.getElementById("new-priority").value,
      };

      await fetch("/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      loadTasks();
      detailsContainer.innerHTML = `<p>✅ Task created successfully</p>`;
    };
  }

  loadTasks();
});
