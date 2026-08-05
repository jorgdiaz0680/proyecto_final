import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../api";

export default function AdminSignup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setCargando(true);
    try {
      await signup(email, password, confirmar);
      setExito(true);
    } catch (err) {
      setError(err.response?.data?.error || "Error al crear la cuenta");
    } finally {
      setCargando(false);
    }
  };

  if (exito) {
    return (
      <div className="login-screen">
        <div className="login-box">
          <img src="/logo-tekcoat.png" alt="TekCoat Construct" className="login-logo" />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>✅</div>
            <h2 style={{ color: "var(--white)", marginBottom: 8 }}>¡Cuenta creada!</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", marginBottom: 24 }}>
              Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.
            </p>
            <button className="btn-primary" onClick={() => navigate("/admin/login")}>
              Ir al login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <div className="login-box">
        <img src="/logo-tekcoat.png" alt="TekCoat Construct" className="login-logo" />
        <h1 className="login-title">TekCoat<span> Admin</span></h1>
        <p className="subtitulo">Crear cuenta de administrador</p>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ejemplo.com"
              required
            />
          </div>
          <div className="form-row">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>
          <div className="form-row">
            <label>Confirmar contraseña</label>
            <input
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="Repite la contraseña"
              required
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={cargando}>
            {cargando ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>
        <p style={{ marginTop: 20, fontSize: "0.85rem" }}>
          ¿Ya tienes cuenta?{" "}
          <Link to="/admin/login">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
