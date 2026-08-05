import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import {
  listarServiciosAdmin,
  crearServicio,
  actualizarServicio,
  eliminarServicio,
} from "../api";

const FORM_VACIO = { clave: "", icono: "🛠️", titulo: "", descripcion: "", orden: 0, activo: true };

export default function AdminServicios() {
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [editando, setEditando] = useState(null); // null = cerrado, {} = crear, {...} = editar
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const { data } = await listarServiciosAdmin();
      setServicios(data);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate("/admin/login");
        return;
      }
      setError("No se pudieron cargar los servicios.");
    } finally {
      setCargando(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const abrirCrear = () => {
    setForm(FORM_VACIO);
    setEditando({});
  };

  const abrirEditar = (servicio) => {
    setForm({
      clave: servicio.clave,
      icono: servicio.icono,
      titulo: servicio.titulo,
      descripcion: servicio.descripcion,
      orden: servicio.orden,
      activo: servicio.activo,
    });
    setEditando(servicio);
  };

  const cerrarModal = () => {
    setEditando(null);
    setError(null);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      if (editando?.id) {
        const { data } = await actualizarServicio(editando.id, form);
        setServicios((prev) => prev.map((s) => (s.id === data.id ? data : s)));
      } else {
        const { data } = await crearServicio(form);
        setServicios((prev) => [...prev, data].sort((a, b) => a.orden - b.orden));
      }
      cerrarModal();
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo guardar el servicio.");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (servicio) => {
    if (!window.confirm(`¿Eliminar el servicio "${servicio.titulo}"? Esta acción no se puede deshacer.`)) return;
    setError(null);
    try {
      await eliminarServicio(servicio.id);
      setServicios((prev) => prev.filter((s) => s.id !== servicio.id));
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo eliminar el servicio.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="admin-body">
      <header className="admin-header">
        <div className="header-inner">
          <span className="logo-text">TekCoat<span>Admin</span></span>
          <div className="admin-nav">
            <Link to="/admin" className="btn-secondary small on-navy">← Solicitudes</Link>
            <button className="btn-secondary small on-navy" onClick={handleLogout}>Cerrar sesión</button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <div className="filtros-bar">
          <h2 style={{ color: "var(--navy)", margin: 0 }}>Catálogo de servicios</h2>
          <button className="btn-primary" style={{ marginLeft: "auto" }} onClick={abrirCrear}>
            + Nuevo servicio
          </button>
        </div>

        {error && !editando && <div className="error">{error}</div>}

        <div className="table-wrapper">
          {cargando ? (
            <p style={{ textAlign: "center", padding: 40, color: "#888" }}>Cargando...</p>
          ) : servicios.length === 0 ? (
            <p style={{ textAlign: "center", padding: 40, color: "#888" }}>No hay servicios registrados aún.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Icono</th>
                  <th>Clave</th>
                  <th>Título</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {servicios.map((s) => (
                  <tr key={s.id}>
                    <td>{s.orden}</td>
                    <td style={{ fontSize: "1.3rem" }}>{s.icono}</td>
                    <td><code>{s.clave}</code></td>
                    <td><strong>{s.titulo}</strong></td>
                    <td><small>{s.descripcion}</small></td>
                    <td>
                      <span className={`badge ${s.activo ? "badge-atendida" : "badge-rechazada"}`}>
                        {s.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <button className="btn-sm" onClick={() => abrirEditar(s)}>Editar</button>{" "}
                      <button className="btn-sm btn-sm-red" onClick={() => handleEliminar(s)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {editando !== null && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editando?.id ? `Editar servicio #${editando.id}` : "Nuevo servicio"}</h2>
              <button className="cerrar" onClick={cerrarModal}>×</button>
            </div>

            <form onSubmit={handleGuardar}>
              <div className="modal-body">
                {error && <div className="error">{error}</div>}

                <div className="form-group">
                  <label>Clave (identificador único)</label>
                  <input
                    type="text"
                    value={form.clave}
                    onChange={(e) => setForm({ ...form, clave: e.target.value })}
                    placeholder="ej. pintura_interior"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Icono (emoji)</label>
                  <input
                    type="text"
                    value={form.icono}
                    onChange={(e) => setForm({ ...form, icono: e.target.value })}
                    maxLength={4}
                  />
                </div>

                <div className="form-group">
                  <label>Título</label>
                  <input
                    type="text"
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    rows={3}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Orden</label>
                  <input
                    type="number"
                    value={form.orden}
                    onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={form.activo}
                      onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                    />{" "}
                    Visible en el sitio público
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <div className="acciones">
                  <button type="submit" className="btn-atender" disabled={guardando}>
                    {guardando ? "Guardando..." : "Guardar"}
                  </button>
                  <button type="button" className="btn-secondary small" onClick={cerrarModal}>
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
