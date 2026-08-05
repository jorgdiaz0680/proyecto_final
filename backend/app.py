from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from routes.solicitudes import solicitudes_bp
from routes.auth import auth_bp
from routes.servicios import servicios_bp


def create_app():
    app = Flask(__name__)
    app.config["JWT_SECRET_KEY"] = Config.JWT_SECRET_KEY

    # Flask-CORS configurado para aceptar peticiones únicamente desde
    # el dominio del frontend (según el documento de arquitectura).
    CORS(app, resources={r"/api/*": {"origins": Config.FRONTEND_ORIGIN}})

    JWTManager(app)

    app.register_blueprint(solicitudes_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(servicios_bp)

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"}), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Recurso no encontrado"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Error interno del servidor"}), 500

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
