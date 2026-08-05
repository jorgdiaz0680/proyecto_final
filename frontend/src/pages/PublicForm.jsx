import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { crearSolicitud, listarServiciosPublico } from "../api";
import { useClienteAuth } from "../ClienteAuthContext.jsx";
import { OPCIONES_SERVICIO } from "../servicios.js";

const FORM_INICIAL = {
  nombre: "",
  telefono: "",
  correo: "",
  direccion: "",
  servicio: "",
  metros: "",
  pisos: 1,
  descripcion: "",
};

export default function PublicForm() {
  const [form, setForm] = useState(FORM_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [servicios, setServicios] = useState([]);
  const { isAuthenticated: clienteAutenticado, cliente } = useClienteAuth();

  useEffect(() => {
    listarServiciosPublico()
      .then(({ data }) => setServicios(data))
      .catch(() => setServicios([])); // si falla, la sección simplemente no se muestra
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "servicio" && value !== "pintura_exterior") {
        next.pisos = 1;
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.nombre || !form.telefono || !form.direccion || !form.servicio || !form.metros) {
      setError("Por favor completa todos los campos obligatorios (*).");
      return;
    }

    setEnviando(true);
    try {
      const { data } = await crearSolicitud({
        ...form,
        metros: Number(form.metros),
        pisos: Number(form.pisos) || 1,
      });
      setExito({ nombre: form.nombre, telefono: form.telefono, data });
      setForm(FORM_INICIAL);
    } catch (err) {
      setError(err.response?.data?.error || "Ocurrió un error al enviar la solicitud.");
    } finally {
      setEnviando(false);
    }
  };

  const scrollTo = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const mostrarPisos = form.servicio === "pintura_exterior";

  return (
    <>
      {/* HEADER */}
      <header className="header">
        <div className="header-inner">
          <div className="logo-area">
            <span className="logo-text">TekCoat<span>Construct</span></span>
            <span className="logo-sub">Construcción &amp; Acabados</span>
          </div>
          <nav className="header-nav">
            <a href="#formulario" onClick={scrollTo("formulario")}>Solicitar Cotización</a>
            <a href="#servicios" onClick={scrollTo("servicios")}>Servicios</a>
            <a href="#contacto" onClick={scrollTo("contacto")}>Contacto</a>
            {clienteAutenticado ? (
              <Link to="/portal">Mi cuenta{cliente?.email ? ` (${cliente.email})` : ""}</Link>
            ) : (
              <Link to="/portal/login">Iniciar sesión</Link>
            )}
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <h1>Obtén tu cotización<br /><span>en minutos</span></h1>
          <p>Sin llamadas, sin esperas. Completa el formulario y recibe una estimación preliminar al instante.</p>
          <a href="#formulario" className="btn-primary" onClick={scrollTo("formulario")}>Solicitar ahora</a>
        </div>
      </section>

      {/* SERVICIOS */}
      <section className="servicios" id="servicios">
        <div className="container">
          <h2 className="section-title">Nuestros Servicios</h2>
          <div className="servicios-grid">
            {servicios.map((s) => (
              <div className="servicio-card" key={s.id}>
                <div className="servicio-icon">{s.icono}</div>
                <h3>{s.titulo}</h3>
                <p>{s.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORMULARIO */}
      <section className="formulario-section" id="formulario">
        <div className="container">
          <h2 className="section-title">Solicitar Cotización</h2>
          <p className="section-sub">Completa los datos y recibe una estimación preliminar de inmediato.</p>

          <div className="form-wrapper">
            {exito ? (
              <div className="exito-box">
                <div className="exito-icon">✅</div>
                <h2>¡Solicitud enviada!</h2>
                <p>Gracias, <strong>{exito.nombre}</strong>. Hemos recibido tu solicitud de cotización.</p>
                <p>Nuestro equipo revisará los detalles y te contactará al <strong>{exito.telefono}</strong> a la brevedad.</p>
                {!clienteAutenticado && (
                  <p style={{ marginTop: 4, fontSize: "0.85rem", color: "var(--gray)" }}>
                    ¿Quieres darle seguimiento? <Link to="/portal/signup" style={{ color: "var(--navy)", fontWeight: 600 }}>Crea una cuenta</Link> para ver el historial de tus solicitudes.
                  </p>
                )}
                <button className="btn-secondary" onClick={() => setExito(null)}>Enviar otra solicitud</button>
              </div>
            ) : (
              <form className="form-grid" onSubmit={handleSubmit}>
                <div className="form-group full">
                  <h3 className="form-section-label">📋 Tus datos de contacto</h3>
                </div>
                <div className="form-group">
                  <label>Nombre completo *</label>
                  <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej. María González" required />
                </div>
                <div className="form-group">
                  <label>Teléfono / WhatsApp *</label>
                  <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Ej. 809-555-0000" required />
                </div>
                <div className="form-group full">
                  <label>Correo electrónico</label>
                  <input type="email" name="correo" value={form.correo} onChange={handleChange} placeholder="Ej. maria@email.com" />
                </div>
                <div className="form-group full">
                  <label>Dirección / Sector del proyecto *</label>
                  <input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Ej. Los Prados, Santo Domingo" required />
                </div>

                <div className="form-group full">
                  <h3 className="form-section-label">🔧 Detalles del trabajo</h3>
                </div>
                <div className="form-group full">
                  <label>Tipo de servicio *</label>
                  <select name="servicio" value={form.servicio} onChange={handleChange} required>
                    <option value="">-- Selecciona un servicio --</option>
                    {OPCIONES_SERVICIO.map((o) => (
                      <option key={o.valor} value={o.valor}>{o.etiqueta}</option>
                    ))}
                  </select>
                </div>

                {form.servicio && (
                  <div className="form-group">
                    <label>Área aproximada (m²) *</label>
                    <input type="number" name="metros" min="1" value={form.metros} onChange={handleChange} placeholder="Ej. 50" required />
                  </div>
                )}
                {mostrarPisos && (
                  <div className="form-group">
                    <label>Número de pisos / niveles</label>
                    <input type="number" name="pisos" min="1" value={form.pisos} onChange={handleChange} placeholder="Ej. 2" />
                  </div>
                )}

                <div className="form-group full">
                  <label>Descripción adicional del trabajo</label>
                  <textarea
                    name="descripcion"
                    rows={4}
                    value={form.descripcion}
                    onChange={handleChange}
                    placeholder="Describe cualquier detalle importante: tipo de superficie, condición actual, preferencias de color, acceso al área, etc."
                  />
                </div>

                {form.servicio && (
                  <div className="form-group full">
                    <div className="estimacion-card">
                      <h3>📐 Cotización personalizada</h3>
                      <p className="estimacion-nota">
                        El precio de tu proyecto se define luego de una inspección / levantamiento
                        en sitio realizado por nuestro equipo. Al enviar tu solicitud, te contactaremos
                        para coordinar la visita y confirmarte el costo final.
                      </p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="form-group full"><div className="error">{error}</div></div>
                )}

                <div className="form-group full center-btn">
                  <button type="submit" className="btn-primary" disabled={enviando}>
                    {enviando ? "Enviando..." : "Enviar solicitud"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section className="contacto" id="contacto">
        <div className="container">
          <h2 className="section-title light">Contáctanos directamente</h2>
          <div className="contacto-grid">
            <div className="contacto-item">
              <span>📱</span>
              <p>WhatsApp / Llamadas</p>
              <a href="https://wa.me/18093307287" target="_blank" rel="noreferrer">809-330-7287</a>
            </div>
            <div className="contacto-item">
              <span>📸</span>
              <p>Instagram</p>
              <a href="https://instagram.com/tekcoatconstruct" target="_blank" rel="noreferrer">@tekcoatconstruct</a>
            </div>
            <div className="contacto-item">
              <span>✉️</span>
              <p>Correo</p>
              <a href="mailto:tekcoatconstruct@gmail.com">tekcoatconstruct@gmail.com</a>
            </div>
            <div className="contacto-item">
              <span>📍</span>
              <p>Ubicación</p>
              <span>Av. 27 de Febrero, Plaza Dominica, Suite 1B-3, El Millón, Santo Domingo, R.D.</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>© 2026 TekCoat Construct, S.R.L. — Todos los derechos reservados.</p>
      </footer>
    </>
  );
}
