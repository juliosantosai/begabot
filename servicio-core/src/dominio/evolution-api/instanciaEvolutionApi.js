const { generateUuid } = require('@begabot/shared');

class InstanciaEvolutionApi {
  constructor({ id = generateUuid(), sender, serverUrl, apiKey, instancia, negocioNombre, activo = true }) {
    if (!sender || typeof sender !== 'string') {
      throw new Error('sender es obligatorio.');
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

    this.id = id;
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
        number: this.sender,
        text: '',
        delay: 1000,
      },
    };
  }
}

module.exports = InstanciaEvolutionApi;
