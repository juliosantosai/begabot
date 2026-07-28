# Pruebas (Tests) en BegaBot 3.0

Esta guía muestra cómo ejecutar los tests unitarios e de integración en el monorepo.

## Ejecución rápida

Desde la raíz del repositorio:

```bash
npm test
```

Eso ejecuta los tests de los workspaces definidos en el monorepo.

## Tests por servicio

Ejecuta los tests del servicio que estés modificando:

```bash
cd servicio-autoreply-fb
npm run test:unit
npm run test:integration
```

## Estándares de pruebas

- Tests unitarios en `test/*.unit.test.js`
- Tests de integración en `test/*.integration.test.js`
- Las pruebas usan `node --test` y funcionan con Node 18+
- Usa `supertest` para validar endpoints HTTP cuando el servicio expone una app Express

## CI y validación

El repositorio incluye una acción de GitHub Actions en `.github/workflows/ci.yml` que ejecuta los tests de los servicios.

Para validar localmente antes de enviar un PR:

1. Ejecuta `npm install` en la raíz.
2. Ejecuta `npm test`.
3. Ejecuta los tests del servicio modificado directamente si es necesario.

## Puertos en pruebas

- `servicio-buffer`: 3001
- `servicio-core`: 3002
- `servicio-agente-ia`: 3003
- `servicio-autoreply-fb`: 3004

Asegúrate de que los puertos estén libres o ajusta `.env` antes de ejecutar tests que inicien servicios locales.
