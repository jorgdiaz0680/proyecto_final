from functools import wraps

from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt


def role_required(role: str):
    """Devuelve un decorador que exige un JWT válido Y que el claim
    'role' coincida con el rol indicado ('admin' o 'cliente').

    Se usa en vez de @jwt_required() a secas para que una cuenta de
    cliente no pueda usar su token contra endpoints de admin, ni
    viceversa.
    """

    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            if claims.get("role") != role:
                return jsonify({"error": "No autorizado para este recurso"}), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator


admin_required = role_required("admin")
cliente_required = role_required("cliente")
