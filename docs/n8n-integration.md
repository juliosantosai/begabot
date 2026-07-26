# n8n Integration Guide

Este documento muestra ejemplos rápidos de cómo orquestar BegaBot desde n8n utilizando HTTP Request y Webhook nodes.

1) Recibir eventos y reenviar a n8n
- Configurar `N8N_WEBHOOK_URL` en el servicio que actúe como origen de eventos.
- El servicio puede llamar automáticamente a `POST $N8N_WEBHOOK_URL` con el payload entrante.

2) En n8n: flujo básico

- `Webhook` node (url pública) — recibe evento de gateway
- `HTTP Request` node — llamar a `http://<servicio-agente-ia>:3003/run` con JSON:

```json
{
  "tenantId": "{{ $json.tenantId }}",
  "prompt": "{{ $json.message }}",
  "systemInstruction": "{{ $json.systemInstruction }}"
}
```

- `HTTP Request` node — persistir resultado en `http://<servicio-core>:3002/api/query` con action `create` en `interactionLog` o `messageHistory`.

3) Autenticación

- Añadir header `X-N8N-Token: <N8N_TOKEN>` en los nodos `HTTP Request` que llaman a los servicios para pasar la validación.
