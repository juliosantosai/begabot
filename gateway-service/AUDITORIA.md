# Auditoría General del Pipeline de Webhooks

## 1. Arquitectura de deduplicación Redis

- Se eliminó el buffer en memoria local y se reemplazó por Redis como única fuente de control de idempotencia.
- El controller `controllers/duplicateFilterController.js` utiliza ahora `SET key value PX <ms> NX` para el bloqueo atómico.
- La duración del bloqueo se configura con la variable de entorno `MESSAGE_BUFFER_MS`.
- Esto permite:
  - escalabilidad horizontal en múltiples réplicas/containers
  - consistencia distribuida
  - TTL automático sin limpieza manual

## 2. Comportamiento actual de la aplicación

- `controllers/webhookController.js` resuelve el payload real entrante con `resolveIncomingPayload`.
- El payload puede venir envuelto dentro de `body.body` o dentro de un array, lo cual se normaliza correctamente.
- El filtro de duplicados devuelve:
  - `EVENT_RECEIVED_NORMALIZED_AND_CHECKED` cuando el mensaje es nuevo
  - `DUPLICATE_IGNORED` cuando Redis ya tenía registrado el mensaje

## 3. Manejo de error Redis

- Si Redis no está disponible, el endpoint no bloquea a la operación.
- El sistema falla en modo `fail-open` con:
  - `isDuplicate: false`
  - `warning: 'Redis no disponible'`
- Esto protege la experiencia del usuario final ante latencias o caídas temporales de Redis.

## 4. Pruebas reforzadas

- Se agregó prueba de integración real en `test/duplicateFilter.test.js`:
  - valida `SET NX PX` en Redis
  - comprueba que el primer mensaje pasa
  - que el segundo mensaje es duplicado
  - y que después del TTL vuelve a aceptarse
- Se mantienen pruebas de validación de payload y API key en `test/webhookController.test.js`.

## 5. Recomendaciones de despliegue

- Asegurar que `REDIS_URL` apunte a un Redis compartido para todas las instancias.
- Definir `MESSAGE_BUFFER_MS` según el ciclo esperado de reintentos y la ventana de deduplicación deseada.
- Monitorear Redis para posibles cuellos de botella si el volumen de mensajes es muy alto.

## 6. Pasos siguientes posibles

- Agregar una prueba de latencia de Redis simulada para validar `fail-open` en el pipeline.
- Implementar métricas de deduplicación y tiempo de respuesta de Redis.
- Si se requiere, migrar a Redis Streams para un buffer distribuido adicional.
