# Módulo: gateway-service

Propósito:

Entrada principal HTTP/webhook. Valida y normaliza payloads antes de distribuir a otros servicios.

Archivos clave:

- `server.js`, `controllers/payloadNormalizerController.js`, `routes/webhookRoutes.js`, `lib/redisClient.js`

Cómo ejecutar en desarrollo:

```bash
cd gateway-service
npm install
npm start
```

Pruebas:

- Tests en `gateway-service/test/`. Ejecutar `npm test`.

Consideraciones:

- Revisar `gateway-service/Dockerfile` y `docker-compose.yml` para despliegue.
