import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useClienteAuth } from "../ClienteAuthContext.jsx";
import { misSolicitudes, editarMiSolicitud, cancelarMiSolicitud } from "../api";
import { NOMBRE_SERVICIO, OPCIONES_SERVICIO, linkWhatsapp } from "../servicios.js";

function FormularioEdicion({ solicitud, onCancelarEdicion, onGuardado }) {
  const [form, setForm] = useState({
    direccion: solicitud.direccion || "",
    servicio: solicitud.servicio,
    metros: solicitud.metros,
    pisos: solicitud.pisos || 1,
    descripcion: solicitud.descripcion || "",
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const mostrarPisos = form.servicio === "pintura_exterior";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const { data } = await editarMiSolicitud(solicitud.id, {
        ...form,
        metros: Number(form.metros),
        pisos: Number(form.pisos) || 1,
      });
      onGuardado(data);
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo guardar el cambio.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit} style={{ marginTop: 16 }}>
      <div className="form-group full">
        <label>Dirección / Sector del proyecto</label>
        <input name="direccion" value={form.direccion} onChange={handleChange} required />
      </div>
      <div className="form-group full">
        <label>Tipo de servicio</label>
        <select name="servicio" value={form.servicio} onChange={handleChange} required>
          {OPCIONES_SERVICIO.map((o) => (
            <option key={o.valor} value={o.valor}>{o.etiqueta}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Área aproximada (m²)</label>
        <input type="number" name="metros" min="1" value={form.metros} onChange={handleChange} required />
      </div>
      {mostrarPisos && (
        <div className="form-group">
          <label>Número de pisos / niveles</label>
          <input type="number" name="pisos" min="1" value={form.pisos} onChange={handleChange} />
        </div>
      )}
      <div className="form-group full">
        <label>Descripción adicional</label>
        <textarea name="descripcion" rows={3} value={form.descripcion} onChange={handleChange} />
      </div>
      {error && <div className="form-group full"><div className="error">{error}</div></div>}
      <div className="form-group full" style={{ display: "flex", gap: 10 }}>
        <button type="submit" className="btn-primary" disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancelarEdicion} disabled={guardando}>
          Cancelar edición
        </button>
      </div>
    </form>
  );
}

export default function ClientePortal() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [cancelandoId, setCancelandoId] = useState(null);
  const { cliente, logout } = useClienteAuth();
  const navigate = useNavigate();

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const { data } = await misSolicitudes();
      setSolicitudes(data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate("/portal/login");
        return;
      }
      setError("No se pudieron cargar tus solicitudes.");
    } finally {
      setCargando(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleGuardado = (actualizada) => {
    setSolicitudes((prev) => prev.map((s) => (s.id === actualizada.id ? actualizada : s)));
    setEditandoId(null);
  };

  const handleCancelar = async (id) => {
    if (!window.confirm("¿Seguro que deseas cancelar esta solicitud?")) return;
    setCancelandoId(id);
    try {
      const { data } = await cancelarMiSolicitud(id);
      setSolicitudes((prev) => prev.map((s) => (s.id === id ? data : s)));
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo cancelar la solicitud.");
    } finally {
      setCancelandoId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="admin-body">
      <header className="admin-header">
        <div className="header-inner">
          <span className="logo-text">TekCoat<span>Construct</span></span>
          <div className="admin-nav">
            {cliente?.nombre && <span>Hola, {cliente.nombre}</span>}
            <Link to="/" className="btn-secondary small on-navy">Ir al sitio</Link>
            <button className="btn-secondary small on-navy" onClick={handleLogout}>Cerrar sesión</button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <h2 className="section-title" style={{ textAlign: "left" }}>Mis solicitudes</h2>
        <p className="section-sub" style={{ textAlign: "left", marginBottom: 24 }}>
          Aquí puedes ver el historial de tus solicitudes de cotización, y editar o cancelar
          las que aún estén pendientes.
        </p>

        {error && <div className="error">{error}</div>}

        {cargando ? (
          <p style={{ textAlign: "center", padding: 40, color: "#888" }}>Cargando...</p>
        ) : solicitudes.length === 0 ? (
          <div className="table-wrapper" style={{ padding: 40, textAlign: "center" }}>
            <p style={{ color: "#888", marginBottom: 16 }}>Aún no tienes solicitudes.</p>
            <Link to="/#formulario" className="btn-primary">Solicitar una cotización</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {solicitudes.map((s) => (
              <div key={s.id} className="table-wrapper" style={{ padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <strong>Solicitud #{s.id}</strong> — {NOMBRE_SERVICIO[s.servicio] || s.servicio}
                    <br />
                    <small style={{ color: "var(--gray)" }}>
                      {new Date(s.created_at).toLocaleDateString("es-DO")} · {s.direccion}
                    </small>
                  </div>
                  <span className={`badge badge-${s.estado}`}>{s.estado}</span>
                </div>

                <div style={{ marginTop: 10, fontSize: "0.92rem" }}>
                  <p>Área: {s.metros} m² {s.pisos > 1 ? `× ${s.pisos} pisos` : ""}</p>
                  <p>
                    Precio: {s.estimacion != null
                      ? `RD$ ${s.estimacion}`
                      : "Pendiente de inspección / cotización"}
                  </p>
                  {s.descripcion && <p style={{ color: "var(--gray)" }}>{s.descripcion}</p>}
                  <p>
                    <a href={linkWhatsapp(s.telefono)} target="_blank" rel="noreferrer">📱 {s.telefono}</a>
                  </p>
                </div>

                {s.estado === "pendiente" && editandoId !== s.id && (
                  <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                    <button className="btn-secondary small" onClick={() => setEditandoId(s.id)}>
                      ✏ Editar
                    </button>
                    <button
                      className="btn-secondary small"
                      onClick={() => handleCancelar(s.id)}
                      disabled={cancelandoId === s.id}
                    >
                      {cancelandoId === s.id ? "Cancelando..." : "✗ Cancelar solicitud"}
                    </button>
                  </div>
                )}

                {s.estado === "pendiente" && editandoId === s.id && (
                  <FormularioEdicion
                    solicitud={s}
                    onCancelarEdicion={() => setEditandoId(null)}
                    onGuardado={handleGuardado}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
