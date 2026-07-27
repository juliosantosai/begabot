# servicio-buffer

## Propósito

`servicio-buffer` gestiona la agregación temporal de mensajes y su persistencia en Redis. Su responsabilidad principal es conservar la conversación entrante durante una ventana de tiempo corta para permitir procesamiento posterior y extracción de texto humano antes de entregarlo a otros servicios.

## Arquitectura

- Entrada HTTP: `POST /api/buffer`
- Cache temporal: Redis con claves TTL por `remoteJid`
- Lista de mensajes en Redis para reconstruir el texto acumulado
- Temporizadores en memoria para vaciar el buffer al expirar
- Webhook opcional: `BUFFER_WEBHOOK_URL` o `BUFFER_DESTINATION_URL` para notificar resultados finales

### Flujo de datos

1. El servicio recibe un mensaje entrante en `POST /api/buffer`.
2. Extrae `remoteJid` y `messageBody` desde el cuerpo del request.
3. Actualiza la clave de cache `begabot:msg-buffer:<remoteJid>` con texto acumulado y TTL.
4. Añade el texto conversacional extraído a la lista `begabot:msg-list:<remoteJid>`.
5. Reprograma un temporizador en memoria para vaciar el buffer cuando el TTL expire.
6. Al expirar, construye un `textoFinal` a partir de los mensajes almacenados.
7. Si está configurado, publica el resultado final mediante un `POST` al webhook.

## Contrato de API

El contrato completo del servicio buffer está disponible en `CONTRATO-BUFFER.md`.

### POST /api/buffer

Request body esperado:

```json
{
  "jid": "1234567890@whatsapp.net",
  "text": "hola"
}
```

Alternativas compatibles:

- `remoteJid` + `messageBody`
- datos anidados en `body`
- estructuras con `data.conversation`, `data.text`, `data.message`, `data.body`

Response body:

```json
{
  "remoteJid": "1234567890@whatsapp.net",
  "accumulatedText": "hola",
  "windowMs": 5000,
  "isFirst": true
}
```

Errores comunes:

- `400` cuando no se proporcionan `jid`/`remoteJid` y `text`/`messageBody`.

## Variables de entorno

- `PORT` — puerto HTTP del servicio (`3001` por defecto)
- `REDIS_URL` — URL de Redis (`redis://127.0.0.1:6379` por defecto)
- `BUFFER_WEBHOOK_URL` / `BUFFER_DESTINATION_URL` — URL a la que se envía el resultado final del buffer
- `MESSAGE_BUFFER_MS` — duración del buffer en milisegundos (`5000` por defecto)

## Archivos clave

- `server.js`
- `routes/rutaBuffer.js`
- `controllers/controladorBufferMensajes.js`
- `test/messageBufferController.test.js`

## Ejecución en desarrollo

```bash
cd servicio-buffer
npm install
npm start
```

## Pruebas

```bash
cd servicio-buffer
npm test
```

## Notas internas

- El servicio usa Redis para TTL y listas de mensajes.
- Si Redis no está disponible, el servicio entra en modo "fail-open" y devuelve el texto recibido.
- El `textoFinal` se guarda en `begabot:final:<remoteJid>` durante 60 segundos cuando el buffer se vacía.
- Si `BUFFER_WEBHOOK_URL` está configurado, se hace un `POST` con `{ remoteJid, accumulatedText, timestamp }`.
