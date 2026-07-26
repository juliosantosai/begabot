class InstanciaEvolutionApi {
  constructor({ ownerJid, sender, serverUrl, apiKey, instancia, negocioNombre, activo = true }) {
    if (!ownerJid || typeof ownerJid !== 'string') {
      throw new Error('ownerJid es obligatorio.');
    }

    if (!serverUrl || typeof serverUrl !== 'string') {
      throw new Error('serverUrl es obligatorio.');
    }

    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('apiKey es obligatorio.');
    }

    if (!instancia || typeof instancia !== 'string') {
      throw new Error('instancia es obligatorio.');
    }

    this.ownerJid = ownerJid;
    this.sender = sender;
    this.serverUrl = serverUrl;
    this.apiKey = apiKey;
    this.instancia = instancia;
    this.negocioNombre = negocioNombre || 'Sin nombre';
    this.activo = activo;
  }

  construirConfiguracionHttp() {
    return {
      method: 'POST',
      url: `${this.serverUrl.replace(/\/$/, '')}/message/sendText/${this.instancia}`,
      headers: {
        apikey: this.apiKey,
        'Content-Type': 'application/json',
      },
      body: {
        number: this.ownerJid,
        text: '',
        delay: 1000,
      },
    };
  }
}

module.exports = InstanciaEvolutionApi;
