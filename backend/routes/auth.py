from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from datetime import timedelta

from supabase_client import get_supabase
from config import Config

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _hacer_login(email, password, rol_esperado):
    """Inicia sesión contra Supabase Auth y verifica que la cuenta
    tenga el rol esperado ('admin' o 'cliente'), guardado en
    user_metadata al momento del signup.

    Retorna (usuario, respuesta_error). Si respuesta_error no es None,
    ya es un tuple (dict, status) listo para devolver con jsonify.
    """
    supabase = get_supabase()
    try:
        auth_response = supabase.auth.sign_in_with_password(
            {"email": email, "password": password}
        )
    except Exception:
        return None, ({"error": "Credenciales inválidas"}, 401)

    if not auth_response or not auth_response.user:
        return None, ({"error": "Credenciales inválidas"}, 401)

    metadata = auth_response.user.user_metadata or {}
    rol = metadata.get("role", "cliente")
    if rol != rol_esperado:
        return None, ({"error": "Esta cuenta no tiene acceso a este panel"}, 403)

    return auth_response.user, None


def _obtener_perfil_cliente(usuario_id, supabase):
    """Busca el perfil (nombre, teléfono) del cliente en la tabla
    `clientes`. Devuelve None si no existe (por ejemplo, cuentas admin).
    """
    try:
        respuesta = (
            supabase.table("clientes").select("*").eq("id", usuario_id).execute()
        )
    except Exception:
        return None
    return respuesta.data[0] if respuesta.data else None


def _hacer_signup(email, password, confirmar, rol):
    if not email or not password or not confirmar:
        return None, ({"error": "Todos los campos son requeridos"}, 400)

    if len(password) < 6:
        return None, ({"error": "La contraseña debe tener al menos 6 caracteres"}, 400)

    if password != confirmar:
        return None, ({"error": "Las contraseñas no coinciden"}, 400)

    supabase = get_supabase()
    try:
        auth_response = supabase.auth.sign_up(
            {"email": email, "password": password, "options": {"data": {"role": rol}}}
        )
    except Exception as e:
        msg = str(e)
        if "already registered" in msg.lower():
            return None, ({"error": "Este correo ya está registrado"}, 409)
        return None, ({"error": "Error al crear la cuenta"}, 500)

    if not auth_response or not auth_response.user:
        return None, ({"error": "No se pudo crear la cuenta"}, 500)

    return auth_response.user, None


# ── Admin ─────────────────────────────────────────────────────────────────

@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "email y password son requeridos"}), 400

    usuario, error = _hacer_login(email, password, "admin")
    if error:
        body, status = error
        return jsonify(body), status

    access_token = create_access_token(
        identity=usuario.id,
        additional_claims={"email": email, "role": "admin"},
        expires_delta=timedelta(minutes=Config.JWT_ACCESS_TOKEN_EXPIRES_MIN),
    )

    return jsonify({
        "access_token": access_token,
        "user": {"id": usuario.id, "email": email},
    }), 200


@auth_bp.post("/signup")
def signup():
    """POST /api/auth/signup

    Registra un nuevo usuario administrador en Supabase Auth.
    """
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()
    confirmar = data.get("confirmar_password", "").strip()

    usuario, error = _hacer_signup(email, password, confirmar, "admin")
    if error:
        body, status = error
        return jsonify(body), status

    return jsonify({
        "message": "Cuenta creada exitosamente. Revisa tu correo para confirmar tu cuenta.",
        "user": {"id": usuario.id, "email": email},
    }), 201


# ── Cliente (portal público de clientes) ────────────────────────────────

@auth_bp.post("/cliente/login")
def cliente_login():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "email y password son requeridos"}), 400

    usuario, error = _hacer_login(email, password, "cliente")
    if error:
        body, status = error
        return jsonify(body), status

    access_token = create_access_token(
        identity=usuario.id,
        additional_claims={"email": email, "role": "cliente"},
        expires_delta=timedelta(minutes=Config.JWT_ACCESS_TOKEN_EXPIRES_MIN),
    )

    supabase = get_supabase()
    perfil = _obtener_perfil_cliente(usuario.id, supabase)

    return jsonify({
        "access_token": access_token,
        "user": {
            "id": usuario.id,
            "email": email,
            "nombre": perfil["nombre"] if perfil else None,
            "telefono": perfil["telefono"] if perfil else None,
        },
    }), 200


@auth_bp.post("/cliente/signup")
def cliente_signup():
    """POST /api/auth/cliente/signup

    Registra una cuenta de cliente Y su perfil (nombre, teléfono) en
    la tabla `clientes`. Con esta cuenta el cliente puede ver el
    historial de sus solicitudes y editar/cancelar las que estén
    pendientes.
    """
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()
    confirmar = data.get("confirmar_password", "").strip()
    nombre = data.get("nombre", "").strip()
    telefono = data.get("telefono", "").strip()

    if not nombre or not telefono:
        return jsonify({"error": "Nombre y teléfono son requeridos"}), 400

    usuario, error = _hacer_signup(email, password, confirmar, "cliente")
    if error:
        body, status = error
        return jsonify(body), status

    supabase = get_supabase()
    try:
        supabase.table("clientes").insert({
            "id": usuario.id,
            "nombre": nombre,
            "telefono": telefono,
            "correo": email,
        }).execute()
    except Exception as e:
        # La cuenta de Auth ya se creó; si el perfil falla, lo reportamos
        # mas no dejamos al cliente sin poder reintentar el signup (el
        # correo ya quedó registrado en Supabase Auth).
        return jsonify({
            "error": f"Cuenta creada pero no se pudo guardar el perfil: {str(e)}"
        }), 502

    return jsonify({
        "message": "Cuenta creada exitosamente. Revisa tu correo para confirmar tu cuenta.",
        "user": {"id": usuario.id, "email": email, "nombre": nombre, "telefono": telefono},
    }), 201
