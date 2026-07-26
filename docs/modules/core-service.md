# Módulo: servicio-core

Propósito:

Contiene la lógica de negocio central, orquestación entre servicios y utilidades de migración/prisma.

Archivos clave:

- `index.js`, `core-engine.js`, `stateMachine.js`, `prisma/schema.prisma`

Cómo ejecutar en desarrollo:

```bash
cd servicio-core
npm install
npm start
```

Pruebas:

- Tests en `servicio-core/tests/`. Ejecutar `npm test`.

Consideraciones:

- Verificar migraciones en `servicio-core/prisma/migrations/` si se modifica el esquema.
