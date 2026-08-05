# Módulo: servicio-agente-ia

## Propósito

El módulo `servicio-agente-ia` es un microservicio que expone una capa HTTP para generar respuestas con un modelo de IA (Google Gemini). Su responsabilidad es: recibir prompts, enviar la solicitud a Gemini, formatear la respuesta y devolver un objeto estructurado para el flujo conversacional.

## Arquitectura

### Componentes principales

- `ai-gemini-agent.js`
  - Define la aplicación Express.
  - Expone los endpoints de IA.
  - Crea el cliente `GoogleGenAI` usando `GEMINI_API_KEY`.
  - Orquesta la llamada al modelo y el logging hacia `servicio-core`.

- `server.js`
  - Arranca la aplicación en el puerto definido por `PORT`.

- `package.json`
  - Dependencias: `@google/genai`, `axios`, `dotenv`, `express`.
  - DevDependencies: `jest`, `supertest`.

- `Dockerfile`
  - Imagen base: `node:18-alpine`.
  - Instala dependencias de producción.
  - Expone el puerto `3003`.

- `tests/`
  - Unit y integration tests con mocks de `@google/genai` y `axios`.

### Flujo de petición

1. Llegan datos al endpoint HTTP.
2. Express valida campos obligatorios.
3. Se construye la petición a Gemini a través de `clienteIa.models.generateContent()`.
4. Se formatea la respuesta del modelo.
5. En el caso de `/api/ai/generate-response`, se intenta enviar un evento de logging a `servicio-core`.
6. Se responde al cliente con JSON estructurado.

## Variables de entorno

- `PORT`
  - Puerto de escucha. Default: `3003`.

- `GEMINI_API_KEY`
  - API key obligatoria para el cliente `GoogleGenAI`.
  - El servicio falla al iniciar si no está configurada.

- `CORE_SERVICE_URL`
  - URL base de `servicio-core` para enviar auditoría de interacción.
  - Default: `http://localhost:3002`.

- `DEFAULT_AI_MODEL`
  - Modelo por defecto para el endpoint `/run`.
  - Default: `models/gemini-3.1-flash-lite`.

## Contrato de API

### GET /api/ai/

- Response: 200
- Body:
```json
{
  "status": "servicio-agente-ia online"
}
```

### GET /health

- Response: 200
- Body:
```json
{
  "status": "servicio-agente-ia healthy",
  "timestamp": "2026-07-27T00:00:00.000Z"
}
```

### POST /api/ai/generate-response

- Request body esperado:
```json
{
  "systemPrompt": "Eres un asistente útil",
  "userContext": "El usuario es un cliente premium que necesita respuestas cortas",
  "userConcatenatedMessage": "Hola, necesito ayuda",
  "aiModel": "models/gemini-3.1-flash-lite",
  "temperature": 0.7
}
```

- Campos esperados:
  - `systemPrompt` obligatorio
  - `userConcatenatedMessage` obligatorio
  - `userContext` opcional
  - `aiModel` opcional
  - `temperature` opcional

- Nota: ya no se aceptan alias legacy como `system_instruction`, `basePrompt`, `promptBase`, `userMessage` o `context`.

- Validaciones mínimas:
  - `systemPrompt` obligatorio
  - `userConcatenatedMessage` obligatorio
  - `userContext` opcional, si existe se incluye en el prompt enviado a IA

- Response success 200:
```json
{
  "status": "success",
  "output": {
    "response": "Texto generado por IA",
    "metrics": {
      "latenciaMs": 120,
      "tokens": {
        "prompt": 10,
        "completion": 20,
        "total": 30
      }
    }
  }
}
```

- Response error 400:
```json
{
  "error": "Faltan parámetros obligatorios (userConcatenatedMessage, systemPrompt)"
}
```

- Response error 500:
```json
{
  "error": "Error interno procesando la inteligencia artificial",
  "details": "mensaje de error"
}
```

### POST /api/ai/generate-from-prompts

- Request body esperado:
```json
{
  "basePrompt": "Resume esta idea en una frase.",
  "systemPrompt": "Eres un asistente conciso.",
  "model": "models/gemini-3.1-flash-lite",
  "temperature": 0.7
}
```

- Validación mínima:
  - `basePrompt` obligatorio
  - `systemPrompt` obligatorio

- Response success 200:
```json
{
  "status": "success",
  "output": {
    "response": "Texto generado por IA",
    "model": "models/gemini-3.1-flash-lite"
  }
}
```

- Response error 400:
```json
{
  "error": "Se requieren basePrompt y systemPrompt"
}
```

### POST /run

- Request body esperado:
```json
{
  "tenantId": "tenant-123",
  "prompt": "Escribe una respuesta breve.",
  "systemInstruction": "Eres amistoso.",
  "history": [],
  "model": "models/gemini-3.1-flash-lite",
  "temperature": 0.7
}
```

- Validación mínima:
  - `prompt` obligatorio
  - `systemInstruction` obligatorio

- Response success 200:
```json
{
  "status": "success",
  "tenantId": "tenant-123",
  "output": {
    "response": "Texto generado por IA",
    "metrics": {
      "latenciaMs": 120
    }
  }
}
```

- Response error 400:
```json
{
  "error": "Se requieren prompt y systemInstruction"
}
```

- Response error 500:
```json
{
  "error": "Error interno en AI service"
}
```

## Integración con servicio-core

- El endpoint `/api/ai/generate-response` manda auditoría a `CORE_SERVICE_URL/api/log-interaction`.
- El módulo asume que `servicio-core` expone ese endpoint para registrar la interacción.
- Si falla el logging, el servicio de IA continúa y responde correctamente.

## Revisión de integridad

- El código actual utiliza `dotenv` para variables de entorno.
- No hay validación de `GEMINI_API_KEY`; si falta, el cliente Gemini fallará en tiempo de ejecución.
- El contrato del endpoint `/api/ai/generate-response` soporta múltiples alias de campos para flexibilidad.
- El módulo está correctamente separado: `ai-gemini-agent.js` define la aplicación y `server.js` la arranca.
- Los tests existentes cubren:
  - validación de parámetros faltantes
  - respuesta en `generate-from-prompts`
  - generación y logging en `generate-response`

## Recomendaciones para robustez

- Validar explícitamente `GEMINI_API_KEY` al iniciar.
- El servicio debe fallar al arrancar si falta `GEMINI_API_KEY`.
- Documentar el contracto de `CORE_SERVICE_URL/api/log-interaction` si se usa desde aquí.
- Considerar un endpoint `/health` más detallado que incluya estado de la conexión a Gemini.
