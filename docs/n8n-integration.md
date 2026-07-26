# n8n Integration Guide

Este documento muestra ejemplos rápidos de cómo orquestar BegaBot desde n8n utilizando HTTP Request y Webhook nodes.

1) Recibir eventos desde gateway -> reenviar a n8n
- En `gateway-service` configurar `N8N_WEBHOOK_URL`.
- `gateway-service` puede llamar automáticamente a `POST $N8N_WEBHOOK_URL` con el payload entrante.

2) En n8n: flujo básico

- `Webhook` node (url pública) — recibe evento de gateway
- `HTTP Request` node — llamar a `http://<ai-agent-service>:3008/run` con JSON:

```json
{
  "tenantId": "{{ $json.tenantId }}",
  "prompt": "{{ $json.message }}",
  "systemInstruction": "{{ $json.systemInstruction }}"
}
```

- `HTTP Request` node — persistir resultado en `http://<core-service>:3003/api/query` con action `create` en `interactionLog` o `messageHistory`.
- `HTTP Request` node — enviar salida a `http://<dispatcher-service>:3007/dispatch` para materializar respuesta.

3) Autenticación

- Añadir header `X-N8N-Token: <N8N_TOKEN>` en los nodos `HTTP Request` que llaman a los servicios para pasar la validación de `gateway-service`.
