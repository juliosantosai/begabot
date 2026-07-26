# Contrato de Evolution API

## Registrar configuración

### POST /core/evolution-api/configuracion

### Request body
```json
{
  "ownerJid": "5491112345678",
  "sender": "5491112345678",
  "serverUrl": "https://mi-servidor.com",
  "apiKey": "mi-api-key",
  "instancia": "mi-instancia",
  "negocioNombre": "Mi negocio",
  "activo": true
}
```

### Campos
- ownerJid: string obligatorio. Identifica al propietario o empresa.
- sender: string opcional. Número o remitente asociado.
- serverUrl: string obligatorio. URL base del servidor Evolution API.
- apiKey: string obligatorio. API key para autenticación.
- instancia: string obligatorio. Nombre de la instancia.
- negocioNombre: string opcional. Nombre del negocio.
- activo: boolean opcional. Indica si la configuración está activa.

### Response exitosa
```json
{
  "data": {
    "ownerJid": "5491112345678",
    "sender": "5491112345678",
    "serverUrl": "https://mi-servidor.com",
    "apiKey": "mi-api-key",
    "instancia": "mi-instancia",
    "negocioNombre": "Mi negocio",
    "activo": true
  }
}
```

## Consultar configuración

### GET /core/evolution-api/configuracion/:ownerJid

### Response exitosa
```json
{
  "data": {
    "ownerJid": "5491112345678",
    "sender": "5491112345678",
    "serverUrl": "https://mi-servidor.com",
    "apiKey": "mi-api-key",
    "instancia": "mi-instancia",
    "negocioNombre": "Mi negocio",
    "activo": true,
    "configuracionHttp": {
      "method": "POST",
      "url": "https://mi-servidor.com/message/sendText/mi-instancia",
      "headers": {
        "apikey": "mi-api-key",
        "Content-Type": "application/json"
      },
      "body": {
        "number": "5491112345678",
        "text": "",
        "delay": 1000
      }
    }
  }
}
```

## Comportamiento
- Si la configuración para el ownerJid ya existe, se actualiza.
- Si no existe, se crea.
- La respuesta incluye una configuración HTTP lista para construir el request a Evolution API.
