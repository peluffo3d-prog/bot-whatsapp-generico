// campana_b2b_mundial.js — Outreach B2B Mundial 2026
//
// USO:
//   1. Pará el bot principal: Ctrl+C en la terminal de bot.js
//   2. Completá contactos_b2b.json con los números reales
//   3. node campana_b2b_mundial.js
//   4. Escaneá el QR si te lo pide (misma cuenta de WA)
//   5. Cuando termine, reiniciá bot.js: node bot.js
//
// LÍMITE SEGURO: máx 20 contactos por sesión, delay 45-100s entre envíos
// No usar con listas compradas — solo contactos de negocios reales de zona oeste

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// ── CONFIG ──
const CONTACTOS_FILE = path.join(__dirname, 'contactos_b2b.json');
const LOG_FILE       = path.join(__dirname, 'campana_b2b.log');
const MAX_POR_SESION = 20;      // máx envíos por ejecución
const DELAY_MIN_MS   = 45000;   // 45 segundos mínimo entre mensajes
const DELAY_MAX_MS   = 100000;  // 100 segundos máximo

// ── MENSAJES POR TIPO DE NEGOCIO ──
// Variantes para evitar que WA los detecte como spam
const mensajes = {

  bar: [
    `Hola! 👋 Les escribo de *Pelufo3D*, somos un taller de impresión 3D de Morón.

Con el Mundial arrancando el 11 de junio, estamos haciendo *vasos de fernet con el escudo de la Selección grabado en relieve* y *mini copas* para decorar la barra.

Todo impreso localmente, entrega en zona oeste sin costo.

Si les interesa ver el producto o pedir un lote, encantados de mostrarles. ⚽🇦🇷`,

    `Hola! Somos *Pelufo3D* de Morón, hacemos impresión 3D local.

Se viene el Mundial y tenemos *vasos de fernet* con el escudo de Argentina grabado, listos para llevar la temática al local. PETG food-safe, 350ml, resistente.

Mayorista desde 10 unidades. Si querés ver cómo quedan antes de decidir, te mandamos una foto del producto terminado.

Saludos! 🏆`,
  ],

  kiosco: [
    `Hola! 👋 Les escribe *Pelufo3D*, taller de impresión 3D de Morón.

Para el Mundial 2026 tenemos *cajitas organizadoras para el álbum Panini* ($9.000 c/u) y *mini copas del mundo* ($12.000 c/u). Productos de impulso que se van a vender solos en junio.

Hacemos precio mayorista desde 10 unidades. Entrega en zona oeste sin cargo.

¿Les interesa? ⚽🇦🇷`,

    `Hola! Somos *Pelufo3D* de Morón, hacemos accesorios en 3D.

Con el álbum Panini del Mundial se vienen las figuritas — y nosotros tenemos la *cajita organizadora perfecta* para vender en caja. 10 unidades ya tienen precio especial.

¿Puedo mandarles una foto del producto? 📦`,
  ],

  empresa: [
    `Hola! 👋 Les escribe *Pelufo3D*, taller de impresión 3D en Morón, Buenos Aires.

Estamos ofreciendo *regalos institucionales mundialeros*: mini copas, vasos y mates personalizados con el logo de la empresa. Todo impreso localmente, entrega garantizada antes del 11 de junio.

Desde 50 unidades grabamos el logo sin costo adicional.

Si les interesa ver opciones, con gusto coordinamos. ⚽🇦🇷`,

    `Hola! Somos *Pelufo3D* de Morón. Para el Mundial 2026 hacemos *regalos corporativos personalizados* en impresión 3D — copas, mates y vasos con logo de empresa.

Ideal para regalar a clientes o equipo de trabajo durante el torneo. Entrega en zona oeste sin cargo, resto del país por Andreani.

¿Les cuento más? 🏆`,
  ],

  default: [
    `Hola! 👋 Les escribe *Pelufo3D*, somos un taller de impresión 3D en Morón.

Con el Mundial 2026 a la vuelta, tenemos productos temáticos: *mini copa*, *vaso de fernet* con escudo, *cajita para figuritas* y *mate personalizado*.

Precio mayorista desde 10 unidades, entrega en zona oeste sin costo.

¿Puedo contarles más? ⚽🇦🇷`,
  ],
};

// ── HELPERS ──
function log(msg) {
  const linea = `[${new Date().toISOString()}] ${msg}`;
  console.log(linea);
  fs.appendFileSync(LOG_FILE, linea + '\n');
}

function delay(min, max) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  const seg = Math.round(ms / 1000);
  console.log(`   ⏱  Esperando ${seg}s antes del próximo envío...`);
  return new Promise(r => setTimeout(r, ms));
}

function elegirMensaje(tipo) {
  const variantes = mensajes[tipo] || mensajes.default;
  return variantes[Math.floor(Math.random() * variantes.length)];
}

function cargarContactos() {
  const raw = fs.readFileSync(CONTACTOS_FILE, 'utf8');
  return JSON.parse(raw);
}

function guardarContactos(lista) {
  fs.writeFileSync(CONTACTOS_FILE, JSON.stringify(lista, null, 2), 'utf8');
}

function contactosPendientes(lista) {
  return lista.filter(c => !c.enviado && c.numero && !c.numero.includes('XXXX'));
}

// ── CLIENTE WA ──
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: path.join(__dirname, '.wwebjs_auth'),
    clientId: 'campana-b2b', // sesión separada de bot.js
  }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on('qr', (qr) => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  📱 Escaneá el QR para conectar');
  console.log('  (misma cuenta de WhatsApp que el bot)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
  console.log('\n✅ WhatsApp conectado — iniciando campaña B2B Mundial 2026');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  log('Campaña B2B iniciada');

  const contactos   = cargarContactos();
  const pendientes  = contactosPendientes(contactos);

  if (pendientes.length === 0) {
    console.log('⚠️  No hay contactos pendientes en contactos_b2b.json');
    console.log('   Completá el archivo con números reales y volvé a correr el script.');
    await client.destroy();
    return;
  }

  const aEnviar = pendientes.slice(0, MAX_POR_SESION);
  console.log(`📋 Contactos pendientes: ${pendientes.length}`);
  console.log(`📤 Enviando en esta sesión: ${aEnviar.length} (límite: ${MAX_POR_SESION})`);
  console.log(`⏱  Tiempo estimado: ~${Math.round(aEnviar.length * ((DELAY_MIN_MS + DELAY_MAX_MS) / 2 / 1000) / 60)} minutos\n`);

  let enviados = 0;
  let errores  = 0;

  for (const contacto of aEnviar) {
    const idx     = contactos.findIndex(c => c.id === contacto.id);
    const chatId  = `${contacto.numero}@c.us`;
    const mensaje = elegirMensaje(contacto.tipo);

    try {
      console.log(`📤 [${enviados + 1}/${aEnviar.length}] Enviando a: ${contacto.nombre} (${contacto.zona})`);

      await client.sendMessage(chatId, mensaje);

      contactos[idx].enviado     = true;
      contactos[idx].fecha_envio = new Date().toISOString();
      guardarContactos(contactos);

      log(`ENVIADO → ${contacto.nombre} | ${contacto.numero} | tipo:${contacto.tipo}`);
      enviados++;

      console.log(`   ✅ Enviado correctamente\n`);

    } catch (err) {
      log(`ERROR → ${contacto.nombre} | ${contacto.numero} | ${err.message}`);
      contactos[idx].resultado = `ERROR: ${err.message}`;
      guardarContactos(contactos);
      errores++;
      console.log(`   ❌ Error: ${err.message}\n`);
    }

    // Delay entre mensajes (no esperar después del último)
    if (aEnviar.indexOf(contacto) < aEnviar.length - 1) {
      await delay(DELAY_MIN_MS, DELAY_MAX_MS);
    }
  }

  // Resumen final
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Campaña finalizada`);
  console.log(`   Enviados:  ${enviados}`);
  console.log(`   Errores:   ${errores}`);
  console.log(`   Restantes: ${pendientes.length - aEnviar.length}`);
  if (pendientes.length - aEnviar.length > 0) {
    console.log(`\n   Para enviar al resto: volvé a correr 'node campana_b2b_mundial.js'`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  log(`Campaña terminada — enviados:${enviados} errores:${errores}`);

  await client.destroy();
  process.exit(0);
});

client.on('disconnected', (reason) => {
  log(`Desconectado: ${reason}`);
  console.log('⚠️  WhatsApp desconectado:', reason);
  process.exit(1);
});

console.log('🤖 Iniciando campaña B2B Mundial 2026...');
console.log('   Cargando WhatsApp Web...\n');
client.initialize();
