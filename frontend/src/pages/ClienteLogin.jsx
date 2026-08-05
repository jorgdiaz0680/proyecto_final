import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useClienteAuth } from "../ClienteAuthContext.jsx";

export default function ClienteLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const { login } = useClienteAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await login(email, password);
      navigate("/portal");
    } catch (err) {
      setError(err.response?.data?.error || "Credenciales inválidas");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-box">
        <img src="/logo-tekcoat.png" alt="TekCoat Construct" className="login-logo" />
        <h1 className="login-title">TekCoat<span> Construct</span></h1>
        <p className="subtitulo">Mi cuenta — Historial de solicitudes</p>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={cargando}>
            {cargando ? "Ingresando..." : "Entrar"}
          </button>
        </form>
        <p style={{ marginTop: 20, fontSize: "0.85rem" }}>
          ¿No tienes cuenta?{" "}
          <Link to="/portal/signup">Crear cuenta</Link>
        </p>
        <p style={{ marginTop: 8, fontSize: "0.85rem" }}>
          <Link to="/" style={{ color: "rgba(255,255,255,0.4)" }}>← Volver al sitio</Link>
        </p>
      </div>
    </div>
  );
}
