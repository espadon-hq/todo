from flask import Flask

import config
from extensions import db, jwt  # окремо ініціалізовані розширення
from routes import register_routes  # імпортуємо тільки функцію реєстрації маршрутів

app = Flask(__name__)
app.config.from_object(config)

db.init_app(app)
jwt.init_app(app)

# реєстрація всіх маршрутів
register_routes(app)

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
