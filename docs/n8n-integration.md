# n8n Integration Guide

Este documento muestra ejemplos rápidos de cómo orquestar BegaBot desde n8n utilizando HTTP Request y Webhook nodes.

Nota: `servicio-autoreply-fb` es un adaptador externo independiente para Autoreply.io / Facebook y no está incluido directamente en el workflow interno de n8n. Este documento describe principalmente cómo integrar los servicios core (`servicio-buffer`, `servicio-core`, `servicio-agente-ia`) vía n8n.

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

4) Ubicación del workflow de orquestación

- Archivo en este repositorio: `n8n/workflows/begabot-orchestrator.json`.
- Este workflow contiene la orquestación principal que recibe webhooks del buffer y coordina llamadas a `servicio-core` y `servicio-agente-ia`.

5) Importar el workflow en n8n

- Importación manual (UI): En la interfaz de n8n -> Workflows -> Import -> subir `n8n/workflows/begabot-orchestrator.json` o pegar el JSON.
- Importación automática en contenedor (opcional): monta `./n8n/workflows` en `/data/workflows` y ejecuta la importación al arrancar:

```yaml
# fragmento para docker-compose (servicio n8n)
services:
  n8n:
    image: n8nio/n8n:latest
    volumes:
      - ./n8n/workflows:/data/workflows
    command: /bin/sh -c "n8n import:workflow --input=/data/workflows/begabot-orchestrator.json || true && n8n start"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=changeme
```

6) Notas de seguridad

- Protege la UI de n8n con autenticación y no expongas el endpoint de importación públicamente.
- Mantén `N8N_TOKEN` en el `.env` y úsalo en los headers `X-N8N-Token`.
