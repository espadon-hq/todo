document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

if (res.ok) {
  localStorage.setItem("token", data.access_token);
  localStorage.setItem("username", username); // Додаємо збереження імені користувача
  window.location.href = "/"; // Перехід на основну сторінку
}
else {
    showError(data.msg || data.error || "Помилка входу");
  }
});

document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("register-username").value;
  const password = document.getElementById("register-password").value;

  const res = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (res.ok) {
    alert("Успішна реєстрація! Тепер увійдіть.");
  } else {
    showError(data.error || "Помилка реєстрації");
  }
});

function showError(msg) {
  const error = document.getElementById("error-msg");
  error.textContent = msg;
  error.style.display = "block";
}
