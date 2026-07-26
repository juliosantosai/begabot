# Pruebas (Tests) en BegaBot 3.0

Instrucciones para ejecutar las pruebas unitarias e de integración de los servicios nuevos y del core.

Ejecutar todos los tests en un servicio concreto:

```bash
# Desde la raíz del repositorio
cd servicio-core && npm install && npm test
```

Detalles:
- Cada servicio nuevo incluye tests unitarios (`test/*.unit.test.js`) y tests de integración (`test/*.integration.test.js`).
- Los tests usan `node --test` (Node 18+) y no requieren dependencias externas para ejecución básica.
- Las pruebas de integración arrancan el servidor del servicio en el puerto configurado (3001-3004). Asegúrate de que los puertos estén libres.

Recomendación para CI:

- Ejecutar `npm ci` en cada servicio y luego `npm test`.
- Para evitar colisiones de puertos, ejecutar los tests en paralelo con cuidado o usar variables de entorno para puertos temporales.
