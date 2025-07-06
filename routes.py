from datetime import datetime

from flask import jsonify, render_template, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from extensions import db
from models import Task, User


def register_routes(app):
    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/login", methods=["GET"])
    def login_page():
        return render_template("login.html")

    @app.route("/login", methods=["POST"])
    def login():
        data = request.get_json()
        user = User.query.filter_by(username=data["username"]).first()
        if user and user.check_password(data["password"]):
            access_token = create_access_token(identity=str(user.id))
            return jsonify(access_token=access_token)
        return jsonify({"msg": "Невірний логін або пароль"}), 401

    @app.route("/register", methods=["POST"])
    def register():
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({"error": "Потрібні імʼя користувача і пароль"}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({"error": "Користувач вже існує"}), 400

        new_user = User(username=username)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "Успішна реєстрація"}), 201

    @app.route("/tasks", methods=["GET"])
    @jwt_required()
    def get_tasks():
        user_id = get_jwt_identity()
        tasks = Task.query.filter_by(user_id=user_id).all()
        return jsonify([task.to_dict() for task in tasks])

    @app.route("/tasks", methods=["POST"])
    @jwt_required()
    def add_task():
        user_id = get_jwt_identity()
        data = request.get_json()

        try:
            due_date = datetime.strptime(data.get("due_date", ""), "%Y-%m-%d").date()
        except (ValueError, TypeError):
            due_date = None

        priority = data.get("priority", "medium")  # Пріоритет, за замовчуванням medium

        new_task = Task(
            title=data["title"],
            description=data.get("description"),
            due_date=due_date,
            status=data.get("status", "active"),
            priority=priority,
            user_id=user_id
        )
        db.session.add(new_task)
        db.session.commit()
        return jsonify({"message": "Задачу додано"}), 201

    @app.route("/tasks/<int:id>", methods=["PUT"])
    @jwt_required()
    def update_task(id):
        user_id = get_jwt_identity()
        task = Task.query.filter_by(id=id, user_id=user_id).first_or_404()
        data = request.get_json()

        task.title = data.get("title", task.title)
        task.description = data.get("description", task.description)

        if "due_date" in data:
            try:
                task.due_date = datetime.strptime(data["due_date"], "%Y-%m-%d").date()
            except (ValueError, TypeError):
                task.due_date = None

        task.status = data.get("status", task.status)
        task.priority = data.get("priority", task.priority)  # Оновлення пріоритету

        db.session.commit()
        return jsonify({"message": "Задачу оновлено"})

    @app.route("/tasks/<int:id>", methods=["DELETE"])
    @jwt_required()
    def delete_task(id):
        user_id = get_jwt_identity()
        task = Task.query.filter_by(id=id, user_id=user_id).first_or_404()
        db.session.delete(task)
        db.session.commit()
        return jsonify({"message": "Задачу видалено"})
