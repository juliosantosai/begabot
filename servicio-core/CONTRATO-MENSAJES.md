# Contrato del dominio de mensajes

## Endpoint para crear un mensaje

### POST /core/mensajes

### Request body
```json
{
  "jid": "5491112345678",
  "texto": "Hola desde el cliente",
  "isFromClient": true,
  "source": "whatsapp"
}
```

### Campos
- jid: string obligatorio. Identifica al contacto.
- texto: string obligatorio. Contenido del mensaje.
- isFromClient: boolean obligatorio. Indica si el mensaje proviene del cliente o de nosotros.
- source: string obligatorio. Identifica el dispositivo o canal que emitió el mensaje.

### Response exitosa
```json
{
  "data": {
    "jid": "5491112345678",
    "texto": "Hola desde el cliente",
    "isFromClient": true,
    "source": "whatsapp",
    "creadoEn": "2026-07-26T00:00:00.000Z"
  }
}
```

## Endpoint para leer mensajes por JID

### GET /core/mensajes/:jid

### Response exitosa
```json
{
  "data": [
    {
      "jid": "5491112345678",
      "texto": "Hola desde el cliente",
      "isFromClient": true,
      "source": "whatsapp",
      "creadoEn": "2026-07-26T00:00:00.000Z"
    }
  ]
}
```

## Notas
- El dominio solo acepta mensajes con estos campos.
- La lectura devuelve todos los mensajes asociados a un mismo JID.
- El valor de isFromClient permite distinguir si fue el cliente o el sistema quien escribió.
