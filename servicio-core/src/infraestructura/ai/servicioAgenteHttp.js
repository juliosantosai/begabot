class ServicioAgenteHttp {
  constructor({ url, httpClient } = {}) {
    this.url = (url || process.env.AI_SERVICE_URL || process.env.AGENT_SERVICE_URL || 'http://localhost:3003').replace(/\/$/, '');
    this.httpClient = httpClient || null;
  }

  async generarRespuesta({ jid, mensajeUsuario, historialConversacional, estadoActual }) {
    const body = {
      tenantId: jid,
      prompt: mensajeUsuario?.texto || '',
      systemInstruction: '',
      history: historialConversacional || [],
      context: estadoActual || {},
      userMessage: mensajeUsuario?.texto || ''
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

    const reply = rawResponse?.response || rawResponse?.responseText || parsedObj?.reply || parsedObj?.mensaje_whatsapp || rawText || '';
    const memory_patch = parsedObj?.memory_patch || parsedObj?.nuevo_contexto || parsedObj?.memoryPatch || null;

    return { reply, memory_patch };
  }
}

module.exports = ServicioAgenteHttp;
