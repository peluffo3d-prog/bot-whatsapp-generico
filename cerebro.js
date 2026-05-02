// cerebro.js — Lógica genérica (lee todo de config.json)

const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

// ── SUSTITUCIÓN DE VARIABLES ──
// Permite usar {negocio.nombre}, {negocio.instagram}, etc. en los textos del config
function sustituir(texto) {
  if (!texto) return texto;
  return texto
    .replace(/\{negocio\.nombre\}/g,      config.negocio.nombre      || '')
    .replace(/\{negocio\.instagram\}/g,   config.negocio.instagram   || '')
    .replace(/\{negocio\.tienda_url\}/g,  config.negocio.tienda_url  || '')
    .replace(/\{negocio\.ciudad\}/g,      config.negocio.ciudad      || '');
}

// ── HORARIO ──
function estaEnHorario() {
  const { dias, hora_inicio, hora_fin, timezone_offset } = config.horario;
  const ahora = new Date();
  const utcMin = ahora.getUTCHours() * 60 + ahora.getUTCMinutes();
  const localMin = ((utcMin + timezone_offset * 60) % (24 * 60) + 24 * 60) % (24 * 60);
  const hora = Math.floor(localMin / 60);
  const dia = ahora.getUTCDay(); // 0=Dom, 1=Lun ... 6=Sab
  return dias.includes(dia) && hora >= hora_inicio && hora < hora_fin;
}

// ── CLASIFICADOR ──
function clasificar(texto) {
  const normalizar = str =>
    str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const t = normalizar(texto);

  for (const intencion of config.intenciones) {
    for (const palabra of intencion.palabras) {
      if (t.includes(normalizar(palabra))) {
        return intencion;
      }
    }
  }
  return null;
}

// ── RESPONDER ──
function responder(texto, esNuevoContacto = false) {
  const { templates_fijos } = config;

  // Primer mensaje siempre → bienvenida
  if (esNuevoContacto) {
    const respuesta = sustituir(templates_fijos.bienvenida);
    return { respuesta, alertar: false, intencion: 'bienvenida' };
  }

  // Fuera de horario
  if (!estaEnHorario()) {
    const respuesta = sustituir(templates_fijos.fuera_horario);
    return { respuesta, alertar: false, intencion: 'fuera_horario' };
  }

  // Clasificar intención
  const intencion = clasificar(texto);

  if (!intencion) {
    const respuesta = sustituir(templates_fijos.no_entendido);
    return { respuesta, alertar: true, intencion: 'desconocido' };
  }

  return {
    respuesta: sustituir(intencion.respuesta),
    alertar:   intencion.alertar || false,
    intencion: intencion.nombre,
  };
}

module.exports = { responder, estaEnHorario };
