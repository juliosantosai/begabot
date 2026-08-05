function normalizarMemoryPatch(valor) {
  if (!valor) return null;
  if (typeof valor === 'string') {
    const matches = [...valor.matchAll(/\[(.*?)\s*:\s*(.*?)\]/g)];
    if (!matches.length) return valor;

    return matches.reduce((acc, [, key, value]) => {
      const clave = String(key || '').trim().toLowerCase().replace(/\s+/g, '_');
      if (clave) acc[clave] = String(value || '').trim();
      return acc;
    }, {});
  }

  if (typeof valor === 'object' && !Array.isArray(valor)) {
    return valor;
  }

  return null;
}

class ServicioAgenteHttp {
  constructor({ url, httpClient } = {}) {
    this.url = (url || process.env.AI_SERVICE_URL || process.env.AGENT_SERVICE_URL || 'http://localhost:3003').replace(/\/$/, '');
    this.httpClient = httpClient || null;
  }

  async generarRespuesta({ jid, mensajeUsuario, historialConversacional, estadoActual, sender }) {
    const textoUsuario = mensajeUsuario?.texto || '';
    const conversationState = estadoActual?.conversation_state || estadoActual?.state || estadoActual?.etapa || null;
    const conversationSummary = estadoActual?.conversation_summary || null;

    const body = {
      tenantId: sender || jid,
      sender: sender || jid,
      jid: jid || sender || null,
      prompt: textoUsuario,
      systemInstruction: '',
      history: historialConversacional || [],
      conversationState,
      conversationSummary,
    };

    const endpoint = `${this.url}/run`;

    let rawResponse;
    if (this.httpClient && typeof this.httpClient.enviar === 'function') {
      const resp = await this.httpClient.enviar({ url: endpoint, method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      rawResponse = resp.data;
      try {
        rawResponse = JSON.parse(rawResponse);
      } catch (_) {
        // keep as string
      }
    } else {
      const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      try {
        rawResponse = await r.json();
      } catch (_) {
        rawResponse = await r.text();
      }
    }

    // Normalize possible shapes
    const parsedResponse = rawResponse?.parsedResponse || rawResponse?.output?.parsedResponse || null;
    const rawText = rawResponse?.responseText || rawResponse?.response || (typeof rawResponse === 'string' ? rawResponse : null) || rawResponse?.output?.response;

    let parsedObj = null;
    if (parsedResponse && typeof parsedResponse === 'object') parsedObj = parsedResponse;
    else if (rawText && typeof rawText === 'string') {
      try { parsedObj = JSON.parse(rawText.replace(/(\r|\n)+/g, ' ').trim()); } catch (_) { parsedObj = null; }
    }

    const reply = rawResponse?.reply
      || rawResponse?.mensaje_whatsapp
      || parsedObj?.response
      || parsedObj?.reply
      || parsedObj?.mensaje_whatsapp
      || rawResponse?.response
      || rawResponse?.responseText
      || rawText
      || '';

    const memory_patch = normalizarMemoryPatch(
      rawResponse?.memory_patch
      || rawResponse?.nuevo_contexto
      || rawResponse?.memoryPatch
      || parsedObj?.memory_patch
      || parsedObj?.nuevo_contexto
      || parsedObj?.memoryPatch
      || null
    );
    const warmingResponse = rawResponse?.warming_response
      || rawResponse?.mensaje_calentamiento
      || parsedObj?.warming_response
      || parsedObj?.mensaje_calentamiento
      || reply
      || null;
    const taskPayload = rawResponse?.task_payload
      || rawResponse?.tarea
      || parsedObj?.task_payload
      || parsedObj?.tarea
      || null;

    return { reply, memory_patch, warmingResponse, taskPayload };
  }
}

module.exports = ServicioAgenteHttp;
