from supabase import create_client, Client
from config import Config

_supabase_client: Client | None = None


def get_supabase() -> Client:
    """Devuelve una instancia única (singleton) del cliente de Supabase.

    Usa la service_role key: SOLO el backend Flask debe tener esta
    clave (nunca se expone al frontend), tal como indica la
    arquitectura del documento: "El frontend nunca interactúa con
    Supabase directamente".
    """
    global _supabase_client
    if _supabase_client is None:
        if not Config.SUPABASE_URL or not Config.SUPABASE_SERVICE_KEY:
            raise RuntimeError(
                "Faltan SUPABASE_URL y/o SUPABASE_SERVICE_KEY en el archivo .env"
            )
        _supabase_client = create_client(Config.SUPABASE_URL, Config.SUPABASE_SERVICE_KEY)
    return _supabase_client
