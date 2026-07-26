# BegaBot 3.0

Monorepo de microservicios para BegaBot 3.0 — arquitectura modular para procesamiento de mensajería, IA y orquestación mediante n8n.

Contenido principal:

- `gateway-service` — entrada de webhooks y normalización
- `buffer-service` — buffer/aggregador de mensajes (Redis)
- `core-service` — lógica de negocio y Prisma/PostgreSQL
- `ai-agent-service` — integración con Gemini (AI)
- `media-switcher-service` — procesamiento de medios (voz, ubicación)
- `audit-metrics-service` — auditoría de latencia y tokens
- `scheduler-service` — tareas programadas
- `dispatcher-service` — envío de mensajes salientes
- `packages/shared-contracts` — utilidades y contratos compartidos

Quickstart (desarrollo con Docker Compose):

```bash
# Desde la raíz del repo
docker compose up -d --build

# Ver logs
docker compose logs -f gateway-service
```

Run local single service (ejemplo `media-switcher-service`):

```bash
cd media-switcher-service
npm install
npm test
npm start
```

Documentación adicional en `docs/` (deployment, n8n integration, environment variables, tests).

Contribuir:

1. Crea un issue describiendo tu propuesta.
2. Abre un branch `feat/<descripcion>` o `fix/<descripcion>` desde `main`.
3. Añade tests y documentación.
4. Haz PR hacia `main`.

Licencia: MIT (añadir fichero LICENSE si procede).
