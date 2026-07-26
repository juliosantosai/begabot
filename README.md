# BegaBot 3.0

BegaBot 3.0 es un monorepo de microservicios Node.js diseñado para recibir webhooks, procesar mensajes, orquestar IA y entregar respuestas con auditoría y programación.

## Servicios incluidos

- `servicio-buffer` — buffer y agregador de mensajes usando Redis.
- `servicio-core` — lógica de negocio y persistencia con Prisma/PostgreSQL.
- `servicio-agente-ia` — integración con Gemini AI y generación de respuestas.
- `packages/shared-contracts` — contratos y utilidades compartidas entre servicios.

## Requisitos

- Node.js 18.x
- npm 10+ (con soporte de workspaces)
- Docker Engine
- Docker Compose

## Quickstart

1. Clonar el repositorio:

```bash
git clone https://github.com/juliosantosai/begabot.git
cd "begabot 3.0"
```

2. Instalar dependencias desde la raíz (npm workspaces):

```bash
npm install
```

3. Ejecutar tests de workspace:

```bash
npm test
```

4. Levantar el stack con Docker Compose:

```bash
docker compose up -d --build
```

5. Ver logs de un servicio:

```bash
docker compose logs -f servicio-buffer
```

## Ejecutar servicios individualmente

Ejemplo para `servicio-buffer`:

```bash
cd servicio-buffer
npm install
npm test
npm start
```

## Notas de monorepo

- El proyecto usa `npm` workspaces desde la raíz.
- El directorio `packages/shared-contracts` contiene modelos y contratos que deben ser reutilizados en los microservicios.
- Las dependencias de cada servicio deben instalarse desde la raíz cuando se trabaja con workspace.

## Documentación adicional

Ver `docs/` para guías de despliegue, integración con n8n, variables de entorno, pruebas y contribución.

## Contribuir

1. Crear un issue para la propuesta.
2. Abrir un branch `feat/<descripcion>` o `fix/<descripcion>` desde `main`.
3. Añadir tests y documentación.
4. Enviar PR hacia `main`.

## Licencia

MIT.
