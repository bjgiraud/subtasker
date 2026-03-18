// The main task id is read from the query string
const mainTaskId = new URLSearchParams(window.location.search).get("task");

async function loadKanban() {
  const res = await fetch(`/tasks/${mainTaskId}`);
  const task = await res.json();

  const columns = {
    todo: document.getElementById("todo"),
    "in progress": document.getElementById("in-progress"),
    done: document.getElementById("done"),
  };

  // Reset the columns
  Object.values(columns).forEach(col => {
    col.innerHTML = `<h3>${col.querySelector("h3").innerText}</h3>`;
  });

  function renderSubtasks(subtasks) {
    subtasks.forEach(sub => {
      const card = document.createElement("div");
      card.className = "card";
      card.textContent = sub.title;

      const col = columns[sub.status] || columns.todo;
      col.appendChild(card);

      if (sub.subtasks && sub.subtasks.length > 0) {
        renderSubtasks(sub.subtasks); // recurse when needed
      }
    });
  }

  renderSubtasks(task.subtasks);
}

loadKanban();
