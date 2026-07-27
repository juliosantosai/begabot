# Contrato de prompts del core

## Concepto

El dominio de prompts del core gestiona el prompt asociado a un `sender`.

- `sender` es la clave única que identifica al remitente.
- `prompt` es el texto o configuración de prompt que se guarda para ese sender.

## Endpoints

### GET /core/prompts/:sender

Obtiene el prompt asociado a un sender.

#### Response exitosa
```json
{
  "data": {
    "sender": "empresa123",
    "prompt": "Eres un asistente de ventas que responde en español de forma cordial.",
    "creadoEn": "2026-07-27T00:00:00.000Z",
    "actualizadoEn": "2026-07-27T00:00:00.000Z"
  }
}
```

### POST /core/prompts/:sender

Crea o actualiza el prompt para un sender.

#### Request body
```json
{
  "prompt": "Eres un asistente de ventas que responde en español de forma cordial." 
}
```

#### Campos
- `prompt`: string obligatorio. Contenido del prompt.

#### Response exitosa
```json
{
  "data": {
    "sender": "empresa123",
    "prompt": "Eres un asistente de ventas que responde en español de forma cordial.",
    "creadoEn": "2026-07-27T00:00:00.000Z",
    "actualizadoEn": "2026-07-27T00:00:00.000Z"
  }
}
```

## Notas

- El dominio debe permitir solo un prompt por `sender`.
- El endpoint `GET` devuelve el prompt actual para el sender solicitado.
- El endpoint `POST` debe crear el prompt si no existe o actualizarlo si ya existe.
- No se requiere tocar la implementación aún; esto es solo la definición del contrato.
