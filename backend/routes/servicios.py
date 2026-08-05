from flask import Blueprint, request, jsonify

from supabase_client import get_supabase
from auth_utils import admin_required

servicios_bp = Blueprint("servicios", __name__, url_prefix="/api/servicios")

CAMPOS_REQUERIDOS = ["clave", "titulo", "descripcion"]


def _validar_payload(data: dict, parcial: bool = False):
    """Valida el body de creación/edición de un servicio.

    Si parcial=True (PATCH/PUT de edición), solo valida los campos
    que efectivamente vengan en el body, no exige todos.
    """
    if not parcial:
        faltantes = [c for c in CAMPOS_REQUERIDOS if not data.get(c)]
        if faltantes:
            return f"Campos requeridos faltantes: {', '.join(faltantes)}"

    if "orden" in data:
        try:
            int(data["orden"])
        except (TypeError, ValueError):
            return "El campo 'orden' debe ser numérico"

    if "activo" in data and not isinstance(data["activo"], bool):
        return "El campo 'activo' debe ser verdadero/falso"

    return None


# ── Lectura pública (landing page) ──────────────────────────────────────

@servicios_bp.get("")
def listar_servicios_publico():
    """GET /api/servicios

    Lista únicamente los servicios activos, ordenados para mostrar en
    la sección "Nuestros Servicios" del sitio público. No requiere
    autenticación.
    """
    supabase = get_supabase()
    try:
        respuesta = (
            supabase.table("servicios_catalogo")
            .select("*")
            .eq("activo", True)
            .order("orden")
            .execute()
        )
    except Exception as e:
        return jsonify({"error": f"Error al consultar Supabase: {str(e)}"}), 502

    return jsonify(respuesta.data), 200


# ── CRUD administrativo ──────────────────────────────────────────────────

@servicios_bp.get("/admin")
@admin_required
def listar_servicios_admin():
    """GET /api/servicios/admin

    Lista TODOS los servicios (activos e inactivos). Requiere JWT admin.
    """
    supabase = get_supabase()
    try:
        respuesta = (
            supabase.table("servicios_catalogo").select("*").order("orden").execute()
        )
    except Exception as e:
        return jsonify({"error": f"Error al consultar Supabase: {str(e)}"}), 502

    return jsonify(respuesta.data), 200


@servicios_bp.post("")
@admin_required
def crear_servicio():
    """POST /api/servicios

    Crea un nuevo servicio en el catálogo. Requiere JWT admin.
    """
    data = request.get_json(silent=True) or {}

    error = _validar_payload(data)
    if error:
        return jsonify({"error": error}), 400

    nuevo_registro = {
        "clave": data["clave"].strip().lower().replace(" ", "_"),
        "icono": data.get("icono") or "🛠️",
        "titulo": data["titulo"],
        "descripcion": data["descripcion"],
        "orden": int(data.get("orden") or 0),
        "activo": bool(data.get("activo", True)),
    }

    supabase = get_supabase()
    try:
        respuesta = supabase.table("servicios_catalogo").insert(nuevo_registro).execute()
    except Exception as e:
        msg = str(e)
        if "duplicate key" in msg.lower() or "unique" in msg.lower():
            return jsonify({"error": "Ya existe un servicio con esa clave"}), 409
        return jsonify({"error": f"Error al guardar en Supabase: {msg}"}), 502

    registro_creado = respuesta.data[0] if respuesta.data else nuevo_registro
    return jsonify(registro_creado), 201


@servicios_bp.put("/<int:servicio_id>")
@admin_required
def actualizar_servicio(servicio_id):
    """PUT /api/servicios/:id

    Edita un servicio existente (título, descripción, icono, orden,
    activo/inactivo). Requiere JWT admin.
    """
    data = request.get_json(silent=True) or {}

    error = _validar_payload(data, parcial=True)
    if error:
        return jsonify({"error": error}), 400

    campos_permitidos = ["clave", "icono", "titulo", "descripcion", "orden", "activo"]
    actualizacion = {k: data[k] for k in campos_permitidos if k in data}
    if not actualizacion:
        return jsonify({"error": "No enviaste ningún campo para actualizar"}), 400

    if "clave" in actualizacion:
        actualizacion["clave"] = actualizacion["clave"].strip().lower().replace(" ", "_")

    supabase = get_supabase()
    try:
        respuesta = (
            supabase.table("servicios_catalogo")
            .update(actualizacion)
            .eq("id", servicio_id)
            .execute()
        )
    except Exception as e:
        return jsonify({"error": f"Error al actualizar en Supabase: {str(e)}"}), 502

    if not respuesta.data:
        return jsonify({"error": "Servicio no encontrado"}), 404

    return jsonify(respuesta.data[0]), 200


@servicios_bp.delete("/<int:servicio_id>")
@admin_required
def eliminar_servicio(servicio_id):
    """DELETE /api/servicios/:id

    Elimina definitivamente un servicio del catálogo. Requiere JWT admin.
    """
    supabase = get_supabase()
    try:
        respuesta = (
            supabase.table("servicios_catalogo")
            .delete()
            .eq("id", servicio_id)
            .execute()
        )
    except Exception as e:
        return jsonify({"error": f"Error al eliminar en Supabase: {str(e)}"}), 502

    if not respuesta.data:
        return jsonify({"error": "Servicio no encontrado"}), 404

    return jsonify({"mensaje": "Servicio eliminado", "servicio": respuesta.data[0]}), 200
