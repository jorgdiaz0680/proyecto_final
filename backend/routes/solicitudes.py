from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    verify_jwt_in_request,
    get_jwt,
    get_jwt_identity,
)

from supabase_client import get_supabase
from auth_utils import admin_required, cliente_required

solicitudes_bp = Blueprint("solicitudes", __name__, url_prefix="/api/solicitudes")

# El correo es opcional en el formulario de TekCoat (el contacto
# principal es teléfono/WhatsApp); dirección sí es obligatoria.
CAMPOS_REQUERIDOS = ["nombre", "telefono", "direccion", "servicio", "metros"]

# Campos que un cliente puede editar en su propia solicitud, siempre
# que esté en estado 'pendiente'.
CAMPOS_EDITABLES_CLIENTE = ["direccion", "servicio", "metros", "pisos", "descripcion"]


def _validar_payload(data: dict):
    faltantes = [c for c in CAMPOS_REQUERIDOS if not data.get(c)]
    if faltantes:
        return f"Campos requeridos faltantes: {', '.join(faltantes)}"
    try:
        metros = float(data["metros"])
        if metros <= 0:
            return "El campo 'metros' debe ser mayor que 0"
    except (TypeError, ValueError):
        return "El campo 'metros' debe ser numérico"
    return None


def _cliente_id_si_autenticado():
    """Si la petición trae un JWT válido de cliente, devuelve su id.
    Si no hay token o es inválido, la solicitud sigue siendo pública
    (cliente_id = None) — el endpoint de creación nunca exige login.
    """
    try:
        verify_jwt_in_request(optional=True)
    except Exception:
        return None
    claims = get_jwt()
    if claims and claims.get("role") == "cliente":
        return get_jwt_identity()
    return None


@solicitudes_bp.post("")
def crear_solicitud():
    """POST /api/solicitudes

    Recibe una nueva solicitud desde el formulario público y la guarda
    en Supabase. El precio ya no se estima automáticamente por m²:
    el CEO (José Castillo) lo define manualmente luego de realizar el
    levantamiento / inspección del proyecto. No requiere autenticación,
    pero si el cliente tiene sesión iniciada en el portal, la
    solicitud queda asociada a su cuenta automáticamente.
    """
    data = request.get_json(silent=True) or {}

    error = _validar_payload(data)
    if error:
        return jsonify({"error": error}), 400

    pisos = float(data.get("pisos") or 1)

    nuevo_registro = {
        "nombre": data["nombre"],
        "telefono": data["telefono"],
        "correo": data.get("correo", ""),
        "direccion": data.get("direccion", ""),
        "servicio": data["servicio"],
        "metros": float(data["metros"]),
        "pisos": pisos,
        "descripcion": data.get("descripcion", ""),
        "estado": "pendiente",
        "cliente_id": _cliente_id_si_autenticado(),
    }

    supabase = get_supabase()
    try:
        respuesta = supabase.table("solicitudes").insert(nuevo_registro).execute()
    except Exception as e:
        return jsonify({"error": f"Error al guardar en Supabase: {str(e)}"}), 502

    registro_creado = respuesta.data[0] if respuesta.data else nuevo_registro

    return jsonify(registro_creado), 201


# ── Panel admin ──────────────────────────────────────────────────────────

@solicitudes_bp.get("")
@admin_required
def listar_solicitudes():
    """GET /api/solicitudes

    Retorna la lista de todas las solicitudes almacenadas.
    Requiere JWT de administrador.
    Soporta filtro opcional por estado: /api/solicitudes?estado=pendiente
    """
    estado = request.args.get("estado")

    supabase = get_supabase()
    query = supabase.table("solicitudes").select("*").order("created_at", desc=True)

    if estado:
        query = query.eq("estado", estado)

    try:
        respuesta = query.execute()
    except Exception as e:
        return jsonify({"error": f"Error al consultar Supabase: {str(e)}"}), 502

    return jsonify(respuesta.data), 200


@solicitudes_bp.patch("/<int:solicitud_id>")
@admin_required
def actualizar_estado(solicitud_id):
    """PATCH /api/solicitudes/:id

    Actualiza el estado de una solicitud (pendiente → atendida / rechazada).
    Requiere JWT de administrador.
    """
    data = request.get_json(silent=True) or {}
    nuevo_estado = data.get("estado")

    estados_validos = {"pendiente", "atendida", "rechazada", "cancelada"}
    if nuevo_estado not in estados_validos:
        return jsonify({
            "error": f"'estado' debe ser uno de: {', '.join(estados_validos)}"
        }), 400

    supabase = get_supabase()
    try:
        respuesta = (
            supabase.table("solicitudes")
            .update({"estado": nuevo_estado})
            .eq("id", solicitud_id)
            .execute()
        )
    except Exception as e:
        return jsonify({"error": f"Error al actualizar en Supabase: {str(e)}"}), 502

    if not respuesta.data:
        return jsonify({"error": "Solicitud no encontrada"}), 404

    return jsonify(respuesta.data[0]), 200


@solicitudes_bp.delete("/<int:solicitud_id>")
@admin_required
def eliminar_solicitud(solicitud_id):
    """DELETE /api/solicitudes/:id

    Elimina definitivamente una solicitud. Requiere JWT de administrador.
    Solo se permite borrar solicitudes que ya salieron del flujo activo
    (atendida, rechazada o cancelada) — una solicitud 'pendiente' debe
    resolverse primero (marcarla atendida/rechazada) antes de poder
    eliminarse, para evitar borrar accidentalmente trabajo en curso.
    """
    supabase = get_supabase()

    actual = (
        supabase.table("solicitudes").select("estado").eq("id", solicitud_id).execute()
    )
    if not actual.data:
        return jsonify({"error": "Solicitud no encontrada"}), 404

    if actual.data[0]["estado"] == "pendiente":
        return jsonify({
            "error": "No se puede eliminar una solicitud pendiente. Márcala como atendida, rechazada o cancelada primero."
        }), 400

    try:
        respuesta = (
            supabase.table("solicitudes").delete().eq("id", solicitud_id).execute()
        )
    except Exception as e:
        return jsonify({"error": f"Error al eliminar en Supabase: {str(e)}"}), 502

    return jsonify({"mensaje": "Solicitud eliminada", "solicitud": respuesta.data[0]}), 200


# ── Portal de clientes ───────────────────────────────────────────────────

@solicitudes_bp.get("/mias")
@cliente_required
def mis_solicitudes():
    """GET /api/solicitudes/mias

    Historial de solicitudes del cliente autenticado.
    """
    cliente_id = get_jwt_identity()
    supabase = get_supabase()
    try:
        respuesta = (
            supabase.table("solicitudes")
            .select("*")
            .eq("cliente_id", cliente_id)
            .order("created_at", desc=True)
            .execute()
        )
    except Exception as e:
        return jsonify({"error": f"Error al consultar Supabase: {str(e)}"}), 502

    return jsonify(respuesta.data), 200


def _obtener_solicitud_propia(solicitud_id, cliente_id, supabase):
    respuesta = (
        supabase.table("solicitudes").select("*").eq("id", solicitud_id).execute()
    )
    if not respuesta.data:
        return None
    solicitud = respuesta.data[0]
    if solicitud.get("cliente_id") != cliente_id:
        return None
    return solicitud


@solicitudes_bp.patch("/mias/<int:solicitud_id>")
@cliente_required
def editar_mi_solicitud(solicitud_id):
    """PATCH /api/solicitudes/mias/:id

    Permite al cliente editar su propia solicitud mientras esté
    'pendiente'.
    """
    cliente_id = get_jwt_identity()
    supabase = get_supabase()

    solicitud = _obtener_solicitud_propia(solicitud_id, cliente_id, supabase)
    if not solicitud:
        return jsonify({"error": "Solicitud no encontrada"}), 404
    if solicitud["estado"] != "pendiente":
        return jsonify({"error": "Solo se pueden editar solicitudes pendientes"}), 400

    data = request.get_json(silent=True) or {}
    actualizacion = {k: data[k] for k in CAMPOS_EDITABLES_CLIENTE if k in data}
    if not actualizacion:
        return jsonify({"error": "No enviaste ningún campo para actualizar"}), 400

    try:
        metros = float(actualizacion.get("metros", solicitud["metros"]))
        pisos = float(actualizacion.get("pisos", solicitud["pisos"]))
        if metros <= 0:
            return jsonify({"error": "El campo 'metros' debe ser mayor que 0"}), 400
    except (TypeError, ValueError):
        return jsonify({"error": "'metros' y 'pisos' deben ser numéricos"}), 400

    actualizacion["metros"] = metros
    actualizacion["pisos"] = pisos

    try:
        respuesta = (
            supabase.table("solicitudes")
            .update(actualizacion)
            .eq("id", solicitud_id)
            .execute()
        )
    except Exception as e:
        return jsonify({"error": f"Error al actualizar en Supabase: {str(e)}"}), 502

    if not respuesta.data:
        return jsonify({"error": "Solicitud no encontrada"}), 404

    return jsonify(respuesta.data[0]), 200


@solicitudes_bp.patch("/mias/<int:solicitud_id>/cancelar")
@cliente_required
def cancelar_mi_solicitud(solicitud_id):
    """PATCH /api/solicitudes/mias/:id/cancelar

    Permite al cliente cancelar su propia solicitud mientras esté
    'pendiente'.
    """
    cliente_id = get_jwt_identity()
    supabase = get_supabase()

    solicitud = _obtener_solicitud_propia(solicitud_id, cliente_id, supabase)
    if not solicitud:
        return jsonify({"error": "Solicitud no encontrada"}), 404
    if solicitud["estado"] != "pendiente":
        return jsonify({"error": "Solo se pueden cancelar solicitudes pendientes"}), 400

    try:
        respuesta = (
            supabase.table("solicitudes")
            .update({"estado": "cancelada"})
            .eq("id", solicitud_id)
            .execute()
        )
    except Exception as e:
        return jsonify({"error": f"Error al actualizar en Supabase: {str(e)}"}), 502

    return jsonify(respuesta.data[0]), 200
