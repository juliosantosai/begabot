# Development Setup

Pasos para iniciar el entorno de desarrollo local.

1. Instalar Node.js 18+ y npm
2. Instalar Docker y Docker Compose

Instalar dependencias por servicio (ejemplo):

```bash
cd core-service && npm install
cd ../gateway-service && npm install
```

Ejecutar tests (por servicio):

```bash
cd core-service && npm test
cd ../media-switcher-service && npm test
```

Ejecutar un solo servicio durante el desarrollo:

```bash
cd gateway-service
npm install
npm run dev
```

Notas:
- Evitar correr múltiples servicios que usen los mismos puertos localmente sin ajustar `PORT` en `.env`.
