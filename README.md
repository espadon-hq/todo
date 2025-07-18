# 📝 To-Do Менеджер

Вебзастосунок для створення, керування та фільтрації задач. Підтримує реєстрацію користувачів, вхід, пріоритети задач, дедлайни та редагування.

## 🚀 Можливості

- ✅ Реєстрація та вхід користувачів
- 👤 Авторизація через JWT токен
- 📝 Додавання задач із:
  - назвою
  - описом
  - датою завершення (дедлайном)
  - пріоритетом (низький, середній, високий)
- ✏️ Редагування задач
- 📌 Відображення задач за статусом: усі / активні / виконані
- 🗑 Видалення задач та очистка виконаних
- 📅 Візуальна підсвітка прострочених задач

## 🧪 Стек технологій

- Frontend: **HTML + CSS (Bootstrap 5)**, JavaScript
- Backend: **Python Flask**
- Аутентифікація: **JWT**
- Збереження: **SQLite** (або будь-яка інша через SQLAlchemy)

## ⚙️ Запуск локально

### Клонування проєкту

```bash
git clone https://github.com/твій-користувач/todo.git
cd todo
```

### Установка залежностей

```bash
pip install -r requirements.txt
```

### Запуск сервера

```bash
python app.py
```

### Відкриття в браузері

```
http://localhost:5000
