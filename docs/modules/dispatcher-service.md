# Módulo: dispatcher-service

Propósito:

Motor de acciones responsable de materializar salidas: envío de mensajes a Evolution API/WhatsApp, manejo de presencia/typing y notificaciones masivas.

Archivos clave:

- `server.js`, `controllers/dispatcherController.js`, `Dockerfile`

Cómo ejecutar:

```bash
cd dispatcher-service
npm install
npm start
```

Endpoints:
- `POST /dispatch` — despachar mensaje (payload: `remoteJid`, `messageText`, `instanceUrl`, `apiKey`)
- `GET /health` — healthcheck
