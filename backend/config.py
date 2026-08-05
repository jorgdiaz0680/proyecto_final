import os
from dotenv import load_dotenv

load_dotenv()
print("URL:", os.environ.get("SUPABASE_URL"))
print("KEY:", os.environ.get("SUPABASE_SERVICE_KEY")[:20])

class Config:
    """Configuración central del backend Flask.

    Todas las variables sensibles se leen desde el entorno (.env),
    nunca se hardcodean en el código fuente.
    """

    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "cambia-esta-clave-en-produccion")
    JWT_ACCESS_TOKEN_EXPIRES_MIN = int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRES_MIN", "60"))

    # Dominio del frontend permitido por CORS (según el documento,
    # Flask-CORS solo debe aceptar peticiones desde este origen en producción)
    FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")
