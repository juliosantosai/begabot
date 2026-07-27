# BegaBot 3.0

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![Node.js CI](https://img.shields.io/badge/status-Work-in-progress-orange.svg)](#)

BegaBot 3.0 es un monorepo de microservicios Node.js para orquestar mensajes, persistencia y generación de respuestas IA con auditoría y flujo de conversación.

## ¿Por qué BegaBot?

- Arquitectura modular: cada servicio es independiente y especializado.
- Listo para producción: usa Redis, PostgreSQL y Prisma.
- Enfoque en IA y mensajería: buffer de entrada, core de negocio y agente de IA.
- Contratos compartidos: `packages/shared-contracts` facilita integración segura entre servicios.

## Qué incluye

- `servicio-buffer` — buffer de mensajes en Redis y agregación de eventos.
- `servicio-core` — lógica de negocio, persistencia con Prisma/PostgreSQL y estado de conversación.
- `servicio-agente-ia` — proxy de agente IA, generación de respuestas y manejo de prompts.
- `packages/shared-contracts` — modelos y contratos compartidos.

## Requisitos

- Node.js 18.x
- npm 10+
- Docker Engine
- Docker Compose

## Quickstart

1. Clona el repositorio:

```bash
git clone https://github.com/juliosantosai/begabot.git
cd begabot
```

2. Instala dependencias desde la raíz:

```bash
npm install
```

3. Levanta el stack completo con Docker:

```bash
docker compose up -d --build
```

4. Verifica que los servicios estén activos:

```bash
docker compose ps
```

## Comandos útiles

- Instalar dependencias de todo el monorepo:

```bash
npm install
```

- Ejecutar tests en todos los workspaces:

```bash
npm test
```

- Ejecutar `servicio-core` localmente:

```bash
cd servicio-core
npm install
npm test
npm run test:integration
```

- Generar migraciones Prisma para `servicio-core`:

```bash
cd servicio-core
npm run prisma:migrate
```

- Reiniciar la base de datos de desarrollo de `servicio-core`:

```bash
cd servicio-core
npm run prisma:migrate:reset
```

## Arquitectura

1. `servicio-buffer`
   - Recibe mensajes y los normaliza.
   - Usa Redis para buffering y encolado.

2. `servicio-core`
   - Gestiona el estado de conversación y la persistencia.
   - Usa Prisma + PostgreSQL para datos estructurados.
   - Expone endpoints HTTP para mensajes, prompts y estado.

3. `servicio-agente-ia`
   - Genera respuestas IA a partir de prompts y contexto.
   - Actúa como fachada de IA con lógica de cliente y request.

## Entorno y configuración

Las variables principales son:

- `DATABASE_URL` — conexión a PostgreSQL para `servicio-core`
- `REDIS_URL` — conexión a Redis
- `GEMINI_API_KEY` — API key para el servicio IA

Consulta `docs/ENVIRONMENT.md` para valores recomendados y ejemplos de `.env`.

## Uso básico

### Llamada de ejemplo a `servicio-core`

```bash
curl -X GET "http://localhost:3002/core/estado-conversacion?jid=12345&sender=user1"
```

### Llamada de ejemplo a `servicio-agente-ia`

```bash
curl -X POST http://localhost:3003/api/ai/generate-response \
  -H 'Content-Type: application/json' \
  -d '{"sender":"user1","systemPrompt":"Eres un asistente útil.","userConcatenatedMessage":"Hola, necesito ayuda"}'
```

## Documentación adicional

- `docs/ENVIRONMENT.md` — variables de entorno y configuración
- `docs/DEPLOYMENT.md` — despliegue y producción
- `docs/ARQUITECTURA.md` — visión técnica detallada
- `docs/n8n-integration.md` — integración con n8n

## Contribuir

¡Contribuciones bienvenidas!

1. Abre un issue describiendo la mejora o el bug.
2. Crea un branch con `feat/` o `fix/`.
3. Añade tests y actualiza la documentación.
4. Envía un PR contra `main`.

## Licencia

MIT.
