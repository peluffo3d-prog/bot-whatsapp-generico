// bot.js — Bot WhatsApp genérico
// Ejecutar: node bot.js

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { responder } = require('./cerebro');
const fs = require('fs');
const path = require('path');

// ── CONFIG ──
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const LOG_FILE = path.join(__dirname, 'conversaciones.log');

// ── HELPERS ──
function log(msg) {
  const linea = `[${new Date().toISOString()}] ${msg}`;
  console.log(linea);
  fs.appendFileSync(LOG_FILE, linea + '\n');
}

function delay(min, max) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(r => setTimeout(r, ms));
}

async function notificarAdmin(client, mensaje, remitente) {
  try {
    const adminId = `${config.admin.numero}@c.us`;
    await client.sendMessage(
      adminId,
      `🔔 *Alerta Bot ${config.negocio.nombre}*\n\nMensaje de: ${remitente}\n\n"${mensaje}"\n\n⚠️ Requiere atención manual`
    );
  } catch (e) {
    log(`ERROR notificando admin: ${e.message}`);
  }
}

// ── CLIENTE ──
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '.wwebjs_auth') }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

const contactosNuevos = new Set();

// ── QR ──
client.on('qr', (qr) => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  📱 Escaneá este QR — ${config.negocio.nombre}`);
  console.log('  WhatsApp → Dispositivos vinculados → +');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  qrcode.generate(qr, { small: true });
});

// ── LISTO ──
client.on('ready', () => {
  console.log(`\n✅ Bot ${config.negocio.nombre} conectado y listo`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  log(`Bot iniciado — ${config.negocio.nombre}`);
});

// ── MENSAJES ──
client.on('message', async (msg) => {
  try {
    if (msg.from.endsWith('@g.us')) return;   // ignorar grupos
    if (msg.fromMe) return;                    // ignorar propios
    if (msg.from === 'status@broadcast') return;

    const remitente = msg.from;
    const texto = msg.body?.trim() || '';
    if (!texto) return;

    log(`MENSAJE de ${remitente}: "${texto}"`);

    const esNuevo = !contactosNuevos.has(remitente);
    if (esNuevo) contactosNuevos.add(remitente);

    const { respuesta, alertar, intencion } = responder(texto, esNuevo);

    log(`INTENCION: ${intencion} | ALERTAR: ${alertar}`);

    // Delay humanizado (configurado en config.json)
    await delay(config.delays.min_ms, config.delays.max_ms);

    if (respuesta) {
      await msg.reply(respuesta);
      log(`RESPUESTA enviada (${intencion})`);
    }

    if (alertar) {
      await notificarAdmin(client, texto, remitente);
    }

  } catch (error) {
    log(`ERROR procesando mensaje: ${error.message}`);
  }
});

// ── DESCONEXIÓN ──
client.on('disconnected', (reason) => {
  log(`Bot desconectado: ${reason}`);
  console.log('⚠️  Bot desconectado. Reiniciá con: node bot.js');
});

// ── INICIAR ──
console.log(`🤖 Iniciando bot — ${config.negocio.nombre}`);
console.log('   Cargando WhatsApp Web, un momento...\n');
client.initialize();
