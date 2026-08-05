// ── Actualiza el formulario según el servicio seleccionado ───────────────────
function actualizarFormulario() {
  const servicio = document.getElementById('servicio').value;
  const grupoMetros = document.getElementById('grupo-metros');
  const grupoPisos  = document.getElementById('grupo-pisos');
  const estimBox    = document.getElementById('estimacion-box');

  if (servicio) {
    grupoMetros.style.display = 'block';
    if (servicio === 'pintura_exterior') {
      grupoPisos.style.display = 'block';
    } else {
      grupoPisos.style.display = 'none';
      document.getElementById('pisos').value = 1;
    }
  } else {
    grupoMetros.style.display = 'none';
    grupoPisos.style.display  = 'none';
    estimBox.style.display    = 'none';
  }
  calcularEstimacion();
}

// ── Calcula y muestra la estimación preliminar ───────────────────────────────
function calcularEstimacion() {
  const servicio = document.getElementById('servicio').value;
  const metros   = parseFloat(document.getElementById('metros').value) || 0;
  const pisos    = parseFloat(document.getElementById('pisos').value)  || 1;
  const estimBox = document.getElementById('estimacion-box');
  const estimVal = document.getElementById('estimacion-valor');

  if (!servicio || metros <= 0) {
    estimBox.style.display = 'none';
    return;
  }

  const config = PRECIOS[servicio];
  if (!config) return;

  const areaTotal = metros * (servicio === 'pintura_exterior' ? pisos : 1);
  let minTotal = Math.max(areaTotal * config.min_por_m2, config.minimo_trabajo);
  let maxTotal = Math.max(areaTotal * config.max_por_m2, config.minimo_trabajo);

  const fmt = (n) => 'RD$ ' + Math.round(n).toLocaleString('es-DO');
  estimVal.textContent = `${fmt(minTotal)} – ${fmt(maxTotal)}`;
  estimBox.style.display = 'block';
}

// ── Guarda y envía la solicitud ──────────────────────────────────────────────
function enviarSolicitud() {
  const nombre    = document.getElementById('nombre').value.trim();
  const telefono  = document.getElementById('telefono').value.trim();
  const correo    = document.getElementById('correo').value.trim();
  const direccion = document.getElementById('direccion').value.trim();
  const servicio  = document.getElementById('servicio').value;
  const metros    = document.getElementById('metros').value;
  const descripcion = document.getElementById('descripcion').value.trim();
  const estimacion  = document.getElementById('estimacion-valor').textContent;

  // Validación básica
  if (!nombre || !telefono || !direccion || !servicio || !metros) {
    alert('Por favor completa todos los campos obligatorios (*).');
    return;
  }

  const solicitud = {
    id: Date.now(),
    fecha: new Date().toLocaleString('es-DO'),
    nombre,
    telefono,
    correo,
    direccion,
    servicio: PRECIOS[servicio]?.nombre || servicio,
    metros,
    descripcion,
    estimacion,
    estado: 'pendiente'
  };

  // Guardar en localStorage (simula base de datos)
  const solicitudes = JSON.parse(localStorage.getItem('tekcoat_solicitudes') || '[]');
  solicitudes.push(solicitud);
  localStorage.setItem('tekcoat_solicitudes', JSON.stringify(solicitudes));

  // Mostrar pantalla de éxito
  document.getElementById('form-container').style.display = 'none';
  document.getElementById('form-exito').style.display = 'block';
  document.getElementById('nombre-exito').textContent = nombre;
  document.getElementById('tel-exito').textContent = telefono;

  // Scroll al inicio del form
  document.getElementById('formulario').scrollIntoView({ behavior: 'smooth' });
}

// ── Reinicia el formulario ───────────────────────────────────────────────────
function reiniciarFormulario() {
  document.getElementById('nombre').value    = '';
  document.getElementById('telefono').value  = '';
  document.getElementById('correo').value    = '';
  document.getElementById('direccion').value = '';
  document.getElementById('servicio').value  = '';
  document.getElementById('metros').value    = '';
  document.getElementById('descripcion').value = '';
  document.getElementById('grupo-metros').style.display  = 'none';
  document.getElementById('grupo-pisos').style.display   = 'none';
  document.getElementById('estimacion-box').style.display = 'none';
  document.getElementById('form-container').style.display = 'block';
  document.getElementById('form-exito').style.display     = 'none';
}
