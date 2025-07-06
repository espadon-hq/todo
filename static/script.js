const API_URL = "/tasks";

let currentFilter = 'all';
let editingTaskId = null;

// Ініціалізація Bootstrap-модального вікна
const editModalEl = document.getElementById('edit-modal');
const bootstrapModal = new bootstrap.Modal(editModalEl);

// Кнопка закриття модалки (шукаємо по класу)
const closeModalBtn = editModalEl.querySelector(".btn-close");
if (closeModalBtn) {
  closeModalBtn.onclick = () => {
    bootstrapModal.hide();
  };
}

// Закриття модалки при кліку поза нею
window.onclick = (event) => {
  if (event.target === editModalEl) {
    bootstrapModal.hide();
  }
};

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function setFilter(filter) {
  currentFilter = filter;
  loadTasks();

  // Активна кнопка фільтру
  document.querySelectorAll("#filters button").forEach(btn => {
    btn.classList.toggle("active", btn.textContent.toLowerCase() === filter);
  });
}
setFilter('all');

document.getElementById("task-form").addEventListener("submit", async function (e) {
  e.preventDefault();
  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const due_date = document.getElementById("due_date").value;
  const priority = document.getElementById("priority").value;

  const headers = getAuthHeaders();
  if (!headers) {
    alert('Будь ласка, увійдіть в систему');
    window.location.href = '/login';
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ title, description, due_date, priority })
    });

    if (!res.ok) {
      const error = await res.json();
      alert(`Помилка: ${error.msg || error.error || res.statusText}`);
      return;
    }

    this.reset();
    loadTasks();
  } catch (err) {
    alert("Помилка мережі або сервера");
    console.error(err);
  }
});

async function loadTasks() {
  const headers = getAuthHeaders();
  if (!headers) {
    alert('Будь ласка, увійдіть в систему');
    window.location.href = '/login';
    return;
  }

  try {
    const res = await fetch(API_URL, { headers });

    if (!res.ok) {
      if (res.status === 401) {
        alert('Токен невалідний або сесія завершилась. Будь ласка, увійдіть знову.');
        window.location.href = '/login';
        return;
      }
      const error = await res.json();
      alert(`Помилка: ${error.msg || res.statusText}`);
      return;
    }

    let tasks = await res.json();

    // Фільтрація за статусом
    if (currentFilter === 'active') {
      tasks = tasks.filter(task => task.status === 'active');
    } else if (currentFilter === 'done') {
      tasks = tasks.filter(task => task.status === 'done');
    }

    // Сортування за дедлайном
    tasks.sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date) - new Date(b.due_date);
    });

    const list = document.getElementById("task-list");
    list.innerHTML = "";

    tasks.forEach(task => {
      const li = document.createElement("li");
      li.className = "list-group-item d-flex flex-column";

      // Верхній рядок: чекбокс, назва задачі, пріоритет
      const topRow = document.createElement("div");
      topRow.className = "d-flex align-items-center justify-content-between";

      // Чекбокс
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "form-check-input me-2";
      checkbox.checked = (task.status === "done");

      checkbox.onchange = async () => {
        const newStatus = checkbox.checked ? "done" : "active";

        const headers = getAuthHeaders();
        if (!headers) {
          alert('Будь ласка, увійдіть в систему');
          window.location.href = '/login';
          return;
        }

        try {
          const res = await fetch(`${API_URL}/${task.id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ status: newStatus })
          });

          if (!res.ok) {
            const error = await res.json();
            alert(`Помилка оновлення: ${error.msg || res.statusText}`);
          } else {
            loadTasks();
          }
        } catch (err) {
          alert("Помилка мережі або сервера");
          console.error(err);
        }
      };

      // Текст задачі (назва)
      const taskTitle = document.createElement("span");
      taskTitle.textContent = task.title;
      taskTitle.style.cursor = "pointer";

      if (task.status === "done") {
        taskTitle.classList.add("text-decoration-line-through", "text-muted");
      }

      if (task.due_date) {
        const today = new Date();
        const dueDate = new Date(task.due_date);
        if (dueDate < today && task.status !== "done") {
          taskTitle.classList.add("text-danger", "fw-bold");
        }
      }

      // Пріоритет - бейджик
      const priorityBadge = document.createElement("span");
      priorityBadge.textContent = task.priority === "high" ? "🔴 Високий" :
                                  task.priority === "medium" ? "🟠 Середній" :
                                  "🟢 Низький";
      priorityBadge.className = "badge ms-2 " +
        (task.priority === "high" ? "bg-danger" :
         task.priority === "medium" ? "bg-warning text-dark" : "bg-success");

      // Додаємо чекбокс, назву і пріоритет у верхній рядок
      const leftGroup = document.createElement("div");
      leftGroup.className = "d-flex align-items-center";
      leftGroup.appendChild(checkbox);
      leftGroup.appendChild(taskTitle);
      leftGroup.appendChild(priorityBadge);

      topRow.appendChild(leftGroup);

      // Кнопка видалення
      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-sm btn-danger";
      delBtn.textContent = "🗑";
      delBtn.onclick = async () => {
        const headers = getAuthHeaders();
        if (!headers) {
          alert('Будь ласка, увійдіть в систему');
          window.location.href = '/login';
          return;
        }

        try {
          const res = await fetch(`${API_URL}/${task.id}`, {
            method: "DELETE",
            headers
          });

          if (!res.ok) {
            const error = await res.json();
            alert(`Помилка видалення: ${error.msg || res.statusText}`);
          } else {
            loadTasks();
          }
        } catch (err) {
          alert("Помилка мережі або сервера");
          console.error(err);
        }
      };
      topRow.appendChild(delBtn);

      // Нижній рядок: опис задачі і дата дедлайну (якщо є)
      const descRow = document.createElement("div");
      descRow.className = "mt-1 ms-4 text-muted fst-italic";

      let descText = "";
      if (task.description) {
        descText += task.description;
      }
      if (task.due_date) {
        descText += (descText ? " | " : "") + `Дата: ${formatDate(task.due_date)}`;
      }
      descRow.textContent = descText;

      // Клік на назву — відкриває модалку редагування
      taskTitle.onclick = () => {
        editingTaskId = task.id;
        document.getElementById("edit-title").value = task.title;
        document.getElementById("edit-description").value = task.description || "";
        document.getElementById("edit-due_date").value = task.due_date || "";
        document.getElementById("edit-priority").value = task.priority || "medium";
        bootstrapModal.show();
      };

      li.appendChild(topRow);
      li.appendChild(descRow);
      list.appendChild(li);
    });
  } catch (err) {
    alert("Помилка мережі або сервера");
    console.error(err);
  }
}

// Обробник форми редагування задачі
const editForm = document.getElementById("edit-form");
editForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const updatedTask = {
    title: document.getElementById("edit-title").value.trim(),
    description: document.getElementById("edit-description").value.trim(),
    due_date: document.getElementById("edit-due_date").value,
    priority: document.getElementById("edit-priority").value
  };

  const headers = getAuthHeaders();
  if (!headers) {
    alert('Будь ласка, увійдіть в систему');
    window.location.href = '/login';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/${editingTaskId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updatedTask)
    });

    if (!res.ok) {
      const error = await res.json();
      alert(`Помилка оновлення: ${error.msg || res.statusText}`);
      return;
    }

    bootstrapModal.hide();
    loadTasks();
  } catch (err) {
    alert("Помилка мережі або сервера");
    console.error(err);
  }
});

// Кнопка очистити виконані задачі
document.getElementById("clear-done").addEventListener("click", async () => {
  const headers = getAuthHeaders();
  if (!headers) {
    alert('Будь ласка, увійдіть в систему');
    window.location.href = '/login';
    return;
  }

  try {
    const res = await fetch(API_URL, { headers });
    if (!res.ok) {
      const error = await res.json();
      alert(`Помилка: ${error.msg || res.statusText}`);
      return;
    }
    const tasks = await res.json();

    const doneTasks = tasks.filter(task => task.status === "done");

    for (const task of doneTasks) {
      await fetch(`${API_URL}/${task.id}`, {
        method: "DELETE",
        headers
      });
    }

    loadTasks();
  } catch (err) {
    alert("Помилка мережі або сервера");
    console.error(err);
  }
});

// Якщо немає токена — редірект на логін
if (!localStorage.getItem('token')) {
  window.location.href = "/login";
}

// Показуємо ім'я користувача
function showUser() {
  const username = localStorage.getItem("username");
  const userDisplay = document.getElementById("user-display");
  if (username) {
    userDisplay.textContent = `Привіт, ${username}!`;
  } else {
    userDisplay.textContent = "";
  }
}

// Вихід із акаунту
document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  window.location.href = "/login";
});

// Змінити акаунт (фактично вихід і перехід на логін)
document.getElementById("change-account-btn").addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  window.location.href = "/login";
});

// Викликаємо при завантаженні сторінки
showUser();

// Завантажуємо задачі при завантаженні сторінки
loadTasks();
