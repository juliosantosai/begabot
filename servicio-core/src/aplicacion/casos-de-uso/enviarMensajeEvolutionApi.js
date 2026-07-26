class EnviarMensajeEvolutionApi {
  constructor({ evolutionApiRepositorio, httpClient }) {
    this.evolutionApiRepositorio = evolutionApiRepositorio;
    this.httpClient = httpClient;
  }

  async ejecutar({ ownerJid, texto, destino }) {
    const configuracion = await this.evolutionApiRepositorio.buscarPorOwnerJid(ownerJid);

    if (!configuracion) {
      throw new Error('No existe configuración de Evolution API para este ownerJid.');
    }

    const request = {
      method: 'POST',
      url: `${configuracion.serverUrl.replace(/\/$/, '')}/message/sendText/${configuracion.instancia}`,
      headers: {
        apikey: configuracion.apiKey,
        'Content-Type': 'application/json',
      },
      body: {
        number: destino,
        text: texto,
        delay: 1000,
      },
    };

    return this.httpClient.enviar(request);
  }
}

module.exports = EnviarMensajeEvolutionApi;
