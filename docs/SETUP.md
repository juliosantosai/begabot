# Development Setup

Pasos para iniciar el entorno de desarrollo local.

## Requisitos

- Node.js 18+
- npm 10+
- Docker
- Docker Compose

## Instalación inicial

1. Clona el repositorio:

```bash
git clone https://github.com/juliosantosai/begabot.git
cd begabot
```

2. Crea un archivo de entorno local:

```bash
cp .env.example .env
```

3. Instala dependencias desde la raíz del monorepo:

```bash
npm install
```

## Levantar el stack completo

```bash
docker compose up -d --build
```

Verifica que los servicios estén activos con:

```bash
docker compose ps
```

## Ejecutar un servicio individual

```bash
npm --workspace servicio-buffer run dev
npm --workspace servicio-autoreply-fb run start
```

## Ejecutar tests por servicio

```bash
cd servicio-autoreply-fb
npm run test:unit
npm run test:routes
npm run test:integration
```

## Notas

- Ajusta los puertos en `.env` si necesitas ejecutar varios servicios en paralelo.
- `servicio-autoreply-fb` puede usarse como servicio autónomo o integrarse con el workflow n8n.
