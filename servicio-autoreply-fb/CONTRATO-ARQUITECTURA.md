# servicio-autoreply-fb

## Propósito

Este módulo actúa como adaptador de webhook para Autoreply.io y gestiona:
- la normalización del payload entrante
- la detección de teléfono en el mensaje
- la persistencia de memoria/historial de conversación en Redis
- la entrega de una respuesta JSON enriquecida con el historial al propio POST

Este adaptador es independiente del workflow interno de n8n. El archivo `n8n/workflows/begabot-orchestrator.json` orquesta los servicios core (`servicio-buffer`, `servicio-core`, `servicio-agente-ia`) y no incluye directamente a `servicio-autoreply-fb`.

## Arquitectura

1. `POST /webhook/autoreply`
   - recibe el payload de Autoreply.io
   - normaliza `sender`, `message`, `ruleId`, `isGroup`, `isTestMessage`
   - detecta teléfonos dentro del texto
   - recupera memoria previa desde Redis usando `sender`
   - actualiza historial de conversación
   - guarda el contexto actualizado en Redis
   - devuelve la respuesta final con `history`

2. `GET /debug/memory?sender=<nombre>`
   - devuelve la memoria completa del sender almacenada en Redis
   - útil para debugging y ver el historial de mensajes acumulado

3. `POST /internal/transform`
   - endpoint de prueba que transforma el payload sin persistir nada
   - útil para validar la normalización de datos

4. Redis
   - clave base: `begabot:autoreply:memory:<sender-slug>`
   - TTL por defecto: 3600 segundos
   - almacena:
     - sender
     - messageCount
     - firstMessage
     - lastMessage
     - lastTimestamp
     - lastPhoneDetected
     - lastIntent
     - history (lista de mensajes)
     - metadata

## Flujo de datos

```mermaid
flowchart LR
  A[Autoreply.io] -->|POST /webhook/autoreply| B(servicio-autoreply-fb)
  B --> C[normalizeAutoreplyPayload]
  B --> D[getConversationMemory(sender)]
  B --> E[mergeConversationContext]
  E --> F[saveConversationMemory(sender, context)]
  B --> G[buildAutoreplyResponse]
  G --> A
  subgraph Redis
    F
  end
```

## Contratos

### Payload externo recibido

```json
{
  "appPackageName": "tkstudio.autoresponderforwa",
  "messengerPackageName": "com.whatsapp",
  "query": {
    "sender": "John Smith",
    "message": "This is an example!",
    "isGroup": false,
    "groupParticipant": "",
    "ruleId": 42,
    "isTestMessage": false
  }
}
```

### Contrato interno de normalización

```json
{
  "source": "autoreply",
  "channel": "whatsapp",
  "externalReference": {
    "appPackageName": "tkstudio.autoresponderforwa",
    "messengerPackageName": "com.whatsapp",
    "ruleId": 42,
    "isTestMessage": false
  },
  "contact": {
    "name": "John Smith",
    "sender": "John Smith"
  },
  "message": {
    "text": "This is an example!",
    "isGroup": false,
    "groupParticipant": ""
  },
  "context": {
    "detectedPhone": null,
    "phoneCandidates": []
  }
}
```

### Contrato de persistencia en Redis

```json
{
  "sender": "John Smith",
  "messageCount": 2,
  "firstMessage": "Hola, quiero cotizar un servicio",
  "lastMessage": "Adicional información: mi teléfono es +54 9 11 1234 5678",
  "lastTimestamp": "2026-07-28T00:02:15.806Z",
  "lastPhoneDetected": "+5491112345678",
  "lastIntent": null,
  "history": [
    {
      "message": "Hola, quiero cotizar un servicio",
      "timestamp": "2026-07-28T00:02:15.792Z",
      "detectedPhone": null,
      "source": null,
      "isGroup": false
    },
    {
      "message": "Adicional información: mi teléfono es +54 9 11 1234 5678",
      "timestamp": "2026-07-28T00:02:15.806Z",
      "detectedPhone": "+5491112345678",
      "source": null,
      "isGroup": false
    }
  ],
  "metadata": {
    "source": "autoreply",
    "isGroup": false
  }
}
```

### Respuesta del POST con historial

```json
{
  "response": "Gracias por contactarnos. Estamos revisando tu solicitud.",
  "sender": "John Smith",
  "titulo": "Solicitud recibida",
  "personalidad": "Asistente comercial",
  "enviarWhatsapp": true,
  "whatsappSender": "+5491112345678",
  "history": [
    {
      "message": "Hola, quiero cotizar un servicio",
      "timestamp": "2026-07-28T00:02:15.792Z",
      "detectedPhone": null,
      "source": null,
      "isGroup": false
    },
    {
      "message": "Adicional información: mi teléfono es +54 9 11 1234 5678",
      "timestamp": "2026-07-28T00:02:15.806Z",
      "detectedPhone": "+5491112345678",
      "source": null,
      "isGroup": false
    }
  ],
  "data": {
    "rawMessage": "Adicional información: mi teléfono es +54 9 11 1234 5678",
    "phoneDetected": true,
    "ruleId": 42,
    "isGroup": false,
    "processedBy": "autoreply-adapter"
  }
}
```

## Endpoints del módulo

- `GET /health`
  - validación de servicio
  - respuesta: `{ "status": "ok" }`

- `POST /webhook/autoreply`
  - recibe payload Autoreply.io
  - guarda contexto e historial en Redis
  - devuelve JSON con `history`

- `GET /debug/memory?sender=<sender>`
  - consulta memoria/historial del sender
  - responde 404 si no existe

- `POST /internal/transform`
  - prueba de normalización de payload

## Recomendaciones

- Mantener `servicio-core` como motor de negocio.
- Usar este módulo sólo como adaptador de entrada.
- Dejar que `servicio-core` y `servicio-agente-ia` consuman la memoria si se necesita mayor inteligencia de conversación.
