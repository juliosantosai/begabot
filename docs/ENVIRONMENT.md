# Variables de Entorno y Configuración

Lista de variables importantes (añadir a un `.env` local y nunca comitear):

- `NODE_ENV` — `production` | `development`
- `PORT` — puerto del servicio (cada servicio puede tener su propio `*_PORT`)
- `DATABASE_URL` — URL de conexión PostgreSQL (servicio-core)
- `REDIS_URL` — URL de Redis
- `GEMINI_API_KEY` — API key de Google GenAI (servicio-agente-ia)

### Comandos de prueba de servicio-core

- `cd servicio-core && npm run test:integration` — ejecuta pruebas de integración contra PostgreSQL real.
- `cd servicio-core && npm run prisma:migrate` — crea/aplica migraciones de Prisma.
- `cd servicio-core && npm run prisma:migrate:reset` — reinicia la base de datos de desarrollo y aplica migraciones.
- `N8N_WEBHOOK_URL` — URL pública del webhook de n8n
- `N8N_TOKEN` — token compartido para validar requests desde n8n
- `EVOLUTION_API_KEY` — token para Evolution API (gateway/dispatcher)

Ejemplo `.env` (raíz para docker-compose):

```
POSTGRES_USER=begabot_user
POSTGRES_PASSWORD=tu_password_seguro_aqui
POSTGRES_DB=begabot_saas
DATABASE_URL=postgresql://begabot_user:tu_password_seguro_aqui@postgres:5432/begabot_saas
REDIS_URL=redis://redis:6379
GEMINI_API_KEY=changeme
N8N_WEBHOOK_URL=https://tu-n8n.example/webhook/begabot-router
N8N_TOKEN=supersecrettoken
```
