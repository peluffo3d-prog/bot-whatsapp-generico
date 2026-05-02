# Bot WhatsApp Genérico

Bot de atención al cliente por WhatsApp, configurable para cualquier negocio. Responde automáticamente según intenciones detectadas en el texto, notifica al admin en casos que requieren atención humana y respeta horarios de atención.

## Características

- Detección de intenciones por palabras clave (sin IA, sin costo)
- Mensaje de bienvenida automático al primer contacto
- Respuesta fuera de horario configurable
- Notificación al admin cuando se necesita intervención humana
- Delay humanizado entre mensajes (configurable)
- Variables dinámicas en los textos (`{negocio.nombre}`, etc.)
- Todo el comportamiento se controla desde un único archivo JSON

## Requisitos

- Node.js 18+
- WhatsApp activo en el teléfono del negocio

## Instalación

```bash
git clone https://github.com/tu-usuario/bot-whatsapp-generico.git
cd bot-whatsapp-generico
npm install
```

## Configuración

1. Copiá el archivo de ejemplo:
   ```bash
   cp config.example.json config.json
   ```

2. Editá `config.json` con los datos del negocio:

   ```json
   {
     "negocio": {
       "nombre": "Tu Negocio",
       "instagram": "@tu_negocio",
       "tienda_url": "https://tu-tienda.com",
       "ciudad": "Buenos Aires"
     },
     "admin": {
       "numero": "549XXXXXXXXXX"
     }
   }
   ```

   > El número de admin usa formato internacional sin `+`: país + código área + número. Ej: `5491112345678`

3. Configurá el horario de atención:
   ```json
   "horario": {
     "dias": [1, 2, 3, 4, 5, 6],
     "hora_inicio": 9,
     "hora_fin": 21,
     "timezone_offset": -3
   }
   ```
   > `dias`: 0=Domingo, 1=Lunes ... 6=Sábado. `timezone_offset`: -3 para Argentina (ART).

4. Personalizá las intenciones en la sección `intenciones` del `config.json`. Cada intención tiene:
   - `nombre`: identificador interno
   - `palabras`: lista de palabras clave que la disparan
   - `respuesta`: texto a enviar (puede usar `{negocio.nombre}`, `{negocio.instagram}`, etc.)
   - `alertar`: `true` si debe notificar al admin además de responder

## Uso

```bash
node bot.js
```

Al iniciar, aparece un código QR en la terminal. Escanearlo desde WhatsApp:
**WhatsApp → Dispositivos vinculados → Vincular un dispositivo**

Una vez conectado, el bot queda activo y responde automáticamente.

## Estructura de archivos

```
├── bot.js               # Lógica de conexión y eventos WhatsApp
├── cerebro.js           # Clasificador de intenciones y generador de respuestas
├── config.json          # Configuración del negocio (NO se sube a git)
├── config.example.json  # Plantilla de configuración
├── package.json
└── negocios/
    ├── template.json    # Plantilla vacía para armar una config desde cero
    └── pelufo3d.json    # Ejemplo de config completa (Pelufo3D Beauty)
```

## Variables disponibles en los textos

| Variable | Se reemplaza por |
|---|---|
| `{negocio.nombre}` | Nombre del negocio |
| `{negocio.instagram}` | Usuario de Instagram |
| `{negocio.tienda_url}` | URL de la tienda |
| `{negocio.ciudad}` | Ciudad |

## Agregar un negocio nuevo

1. Copiá `negocios/template.json` con el nombre del negocio
2. Completá todos los campos
3. Copiá ese archivo como `config.json` en la raíz
4. Corré `node bot.js`

## Logs

Cada mensaje y respuesta se guarda automáticamente en `conversaciones.log` (excluido de git).
