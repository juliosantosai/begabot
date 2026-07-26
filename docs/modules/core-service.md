# Módulo: core-service

Propósito:

Contiene la lógica de negocio central, orquestación entre servicios y utilidades de migración/prisma.

Archivos clave:

- `index.js`, `core-engine.js`, `stateMachine.js`, `prisma/schema.prisma`

Cómo ejecutar en desarrollo:

```bash
cd core-service
npm install
npm start
```

Pruebas:

- Tests en `core-service/tests/`. Ejecutar `npm test`.

Consideraciones:

- Verificar migraciones en `core-service/prisma/migrations/` si se modifica el esquema.
