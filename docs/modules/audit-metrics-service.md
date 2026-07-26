# Módulo: audit-metrics-service

Propósito:

Recibir y registrar métricas de latencia, tokens y rendimiento de prompts de forma asíncrona.

Archivos clave:

- `server.js`, `controllers/auditController.js`, `Dockerfile`, `test/`

Tests incluidos:

- Unitario: `test/auditController.unit.test.js`
- Integración: `test/audit.integration.test.js`

Cómo ejecutar tests:

```bash
cd audit-metrics-service
npm install
npm test
```
