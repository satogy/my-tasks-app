
const STORAGE_KEY = "my-tasks-app-v1";

const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const dueDateInput = document.querySelector("#task-due-date");
const taskList = document.querySelector("#task-list");
const taskCount = document.querySelector("#task-count");
const emptyMessage = document.querySelector("#empty-message");
const formMessage = document.querySelector("#form-message");
const filterButtons = document.querySelectorAll(".filter-button");

let tasks = loadTasks();
let currentFilter = "all";

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((task) =>
      task &&
      typeof task.id === "string" &&
      typeof task.title === "string" &&
      typeof task.completed === "boolean"
    );
  } catch (error) {
    console.error("タスクの読み込みに失敗しました。", error);
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.error("タスクの保存に失敗しました。", error);
    formMessage.textContent =
      "データを保存できませんでした。ブラウザの設定を確認してください。";
    return false;
  }
}

function renderTasks() {
  taskList.replaceChildren();

  const visibleTasks = tasks.filter((task) => {
    if (currentFilter === "active") {
      return !task.completed;
    }

    if (currentFilter === "completed") {
      return task.completed;
    }

    return true;
  });

  const completedCount = tasks.filter((task) => task.completed).length;
  taskCount.textContent =
    `${tasks.length}件（未完了 ${tasks.length - completedCount}件）`;

  emptyMessage.hidden = visibleTasks.length > 0;

  if (tasks.length === 0) {
    emptyMessage.textContent =
      "タスクはまだありません。最初のタスクを追加しましょう。";
  } else if (visibleTasks.length === 0) {
    emptyMessage.textContent = "この条件に合うタスクはありません。";
  }

  visibleTasks.forEach((task) => {
    const item = document.createElement("li");
    item.className = "task-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `${task.title}を完了にする`);
    checkbox.addEventListener("change", () => {
      const previous = task.completed;
      task.completed = checkbox.checked;

      if (!saveTasks()) {
        task.completed = previous;
      }

      renderTasks();
    });

   
    const taskInfo = document.createElement("div");
    taskInfo.className = "task-info";

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;

    if (task.completed) {
      title.classList.add("completed");
    }

    taskInfo.append(title);

    if (task.dueDate) {
      const dueDate = document.createElement("span");
      dueDate.className = "task-due-date";
      
      dueDate.textContent = `期限：${task.dueDate}`;
      taskInfo.append(dueDate);

      const today = new Date();
      const todayString =
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      if (!task.completed && task.dueDate < todayString) {
        const overdue = document.createElement("span");
        overdue.className = "task-overdue";
        overdue.textContent = "期限切れ";
        taskInfo.append(overdue);
      }

    }
    

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "削除";
    deleteButton.setAttribute("aria-label", `${task.title}を削除`);
    deleteButton.addEventListener("click", () => {
      const previousTasks = tasks;
      tasks = tasks.filter((item) => item.id !== task.id);

      if (!saveTasks()) {
        tasks = previousTasks;
      }

      renderTasks();
    });

    item.append(checkbox, taskInfo, deleteButton);
    taskList.append(item);
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = input.value.trim();

  if (!title) {
    formMessage.textContent = "タスクを入力してください。";
    input.focus();
    return;
  }

  if (title.length > 120) {
    formMessage.textContent = "タスクは120文字以内で入力してください。";
    return;
  }

  const newTask = {
    id: crypto.randomUUID(),
    title,
    completed: false,
    dueDate: dueDateInput.value
  };

  tasks.push(newTask);

  if (!saveTasks()) {
    tasks = tasks.filter((task) => task.id !== newTask.id);
    renderTasks();
    return;
  }

  input.value = "";
  formMessage.textContent = "";
  currentFilter = "all";
  updateFilterButtons();
  renderTasks();
  input.focus();
});

function updateFilterButtons() {
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    updateFilterButtons();
    renderTasks();
  });
});

renderTasks();
updateFilterButtons();
