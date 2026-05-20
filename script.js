const storageKey = "sct-task04-tasks";

const taskForm = document.getElementById("taskForm");
const taskTitle = document.getElementById("taskTitle");
const taskNotes = document.getElementById("taskNotes");
const taskDate = document.getElementById("taskDate");
const taskTime = document.getElementById("taskTime");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const formNote = document.getElementById("formNote");

const taskList = document.getElementById("taskList");
const taskTemplate = document.getElementById("taskTemplate");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

const filterButtons = document.querySelectorAll(".filter-btn");
const countAll = document.getElementById("countAll");
const countActive = document.getElementById("countActive");
const countDone = document.getElementById("countDone");

let tasks = loadTasks();
let activeFilter = "all";
let editingId = null;

updateUi();

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = taskTitle.value.trim();
  if (!title) {
    setFormMessage("Add a task title to continue.");
    return;
  }

  const payload = {
    title,
    notes: taskNotes.value.trim(),
    dueDate: taskDate.value,
    dueTime: taskTime.value,
  };

  if (editingId) {
    tasks = tasks.map((task) =>
      task.id === editingId ? { ...task, ...payload } : task
    );
    setFormMessage("Task updated.");
  } else {
    tasks.unshift({
      id: Date.now(),
      createdAt: Date.now(),
      completed: false,
      ...payload,
    });
    setFormMessage("Task added.");
  }

  saveTasks();
  resetForm();
  updateUi();
});

cancelBtn.addEventListener("click", () => {
  resetForm();
  setFormMessage("Edit canceled.");
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    updateUi();
  });
});

searchInput.addEventListener("input", updateUi);
sortSelect.addEventListener("change", updateUi);

function updateUi() {
  const filtered = filterTasks(tasks);
  renderTasks(filtered);
  updateCounts();
}

function filterTasks(list) {
  const query = searchInput.value.trim().toLowerCase();
  let filtered = list.filter((task) => {
    if (activeFilter === "active" && task.completed) return false;
    if (activeFilter === "completed" && !task.completed) return false;
    return true;
  });

  if (query) {
    filtered = filtered.filter((task) =>
      `${task.title} ${task.notes}`.toLowerCase().includes(query)
    );
  }

  return sortTasks(filtered);
}

function sortTasks(list) {
  const value = sortSelect.value;
  const sorted = [...list];

  if (value === "title") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else if (value === "created") {
    sorted.sort((a, b) => b.createdAt - a.createdAt);
  } else {
    sorted.sort((a, b) => {
      const aDue = getDueTimestamp(a);
      const bDue = getDueTimestamp(b);
      if (aDue && bDue) return aDue - bDue;
      if (aDue) return -1;
      if (bDue) return 1;
      return b.createdAt - a.createdAt;
    });
  }

  return sorted;
}

function renderTasks(list) {
  taskList.innerHTML = "";

  if (list.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No tasks found. Add a task or change the filter.";
    taskList.appendChild(empty);
    return;
  }

  list.forEach((task) => {
    const node = taskTemplate.content.cloneNode(true);
    const card = node.querySelector(".task-card");
    const title = node.querySelector(".task-title");
    const notes = node.querySelector(".task-notes");
    const due = node.querySelector(".meta.due");
    const created = node.querySelector(".meta.created");
    const completeBtn = node.querySelector(".complete-btn");
    const editBtn = node.querySelector(".edit-btn");
    const deleteBtn = node.querySelector(".delete-btn");

    title.textContent = task.title;
    notes.textContent = task.notes || "No notes added.";
    due.textContent = formatDue(task);
    created.textContent = `Created ${formatDate(task.createdAt)}`;

    if (task.completed) {
      card.classList.add("completed");
      completeBtn.textContent = "Completed";
    }

    completeBtn.addEventListener("click", () => toggleComplete(task.id));
    editBtn.addEventListener("click", () => startEdit(task.id));
    deleteBtn.addEventListener("click", () => removeTask(task.id));

    taskList.appendChild(node);
  });
}

function toggleComplete(id) {
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  updateUi();
}

function startEdit(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;
  editingId = id;
  taskTitle.value = task.title;
  taskNotes.value = task.notes;
  taskDate.value = task.dueDate;
  taskTime.value = task.dueTime;
  submitBtn.textContent = "Save changes";
  cancelBtn.style.display = "inline-flex";
  setFormMessage("Editing task. Save changes when ready.");
  taskTitle.focus();
}

function removeTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  updateUi();
}

function resetForm() {
  taskForm.reset();
  editingId = null;
  submitBtn.textContent = "Add task";
  cancelBtn.style.display = "none";
}

function setFormMessage(message) {
  formNote.textContent = message;
}

function updateCounts() {
  const total = tasks.length;
  const done = tasks.filter((task) => task.completed).length;
  countAll.textContent = total;
  countActive.textContent = total - done;
  countDone.textContent = done;
}

function formatDue(task) {
  if (!task.dueDate && !task.dueTime) return "No due date";
  const dateText = task.dueDate ? formatDate(task.dueDate) : "Date TBD";
  const timeText = task.dueTime ? `at ${task.dueTime}` : "";
  return `Due ${dateText} ${timeText}`.trim();
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDueTimestamp(task) {
  if (!task.dueDate) return null;
  const time = task.dueTime || "00:00";
  const dateTime = new Date(`${task.dueDate}T${time}`);
  const timestamp = dateTime.getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function saveTasks() {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function loadTasks() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

resetForm();