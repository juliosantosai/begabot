# Módulo: servicio-buffer

Propósito:

Gestiona el almacenamiento temporal y la agregación de mensajes (state buffer). Interactúa con Redis según la implementación.

Archivos clave:

- `server.js`, `package.json`, `controllers/messageBufferController.js`, `routes/bufferRoute.js`

Cómo ejecutar en desarrollo:

```bash
cd servicio-buffer
npm install
npm start
```

Pruebas:

- Tests en `servicio-buffer/test/`. Ejecutar `npm test`.

Consideraciones:

- Revisar `servicio-buffer/.env` para variables de Redis/puertos antes de iniciar.
