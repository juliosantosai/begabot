# Módulo: scheduler-service

Propósito:

Motor ligero de tareas programadas para ejecutar jobs periódicos (verificar pausas expiradas, limpiezas, recordatorios).

Archivos clave:

- `server.js`, `Dockerfile`

Cómo ejecutar:

```bash
cd scheduler-service
npm install
npm start
```

Endpoints:
- `GET /health` — healthcheck simple
