# Módulo: buffer-service

Propósito:

Gestiona el almacenamiento temporal y la agregación de mensajes (state buffer). Interactúa con Redis según la implementación.

Archivos clave:

- `server.js`, `package.json`, `controllers/messageBufferController.js`, `routes/bufferRoute.js`

Cómo ejecutar en desarrollo:

```bash
cd buffer-service
npm install
npm start
```

Pruebas:

- Tests en `buffer-service/test/`. Ejecutar `npm test`.

Consideraciones:

- Revisar `buffer-service/.env` para variables de Redis/puertos antes de iniciar.
