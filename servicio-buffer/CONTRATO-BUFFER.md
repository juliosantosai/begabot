# Contrato de servicio-buffer

## Endpoint principal

### POST /api/buffer

### Request body
```json
{
  "jid": "1234567890@whatsapp.net",
  "text": "hola",
  "sender": "sender-id-123@whatsapp.net"
}
```

### Campos
- `jid`: string obligatorio. Identificador remoto del remitente.
- `text`: string obligatorio. Contenido del mensaje a agregar.
- `sender`: string obligatorio. Identificador del remitente que construye el prompt y debe devolverse en la respuesta.
- `remoteJid`: alias opcional de `jid`.
- `messageBody`: alias opcional de `text`.
- `body`: puede usarse para enviar estructuras anidadas.

### Nota
- `sender` es una entidad independiente de `jid` y no debe ser reemplazado por él.

### Ejemplos compatibles

```json
{
  "remoteJid": "1234567890@whatsapp.net",
  "messageBody": "hola"
}
```

```json
{
  "body": {
    "data": {
      "conversation": "hola"
    }
  }
}
```

### Response exitosa
```json
{
  "sender": "1234567890@whatsapp.net",
  "remoteJid": "1234567890@whatsapp.net",
  "accumulatedText": "hola",
  "windowMs": 5000,
  "isFirst": true
}
```

### Errores
- `400` si faltan `jid`/`remoteJid` o `text`/`messageBody`.

### Comportamiento
- Si el mensaje es el primero para un `remoteJid`, `isFirst` será `true`.
- El servicio acumula texto en Redis bajo la clave `begabot:msg-buffer:<remoteJid>`.
- También mantiene una lista de mensajes en `begabot:msg-list:<remoteJid>`.
- El buffer expira tras `MESSAGE_BUFFER_MS` ms y genera un `textoFinal`.
- Si está configurado, publica el resultado final a `BUFFER_WEBHOOK_URL`.
