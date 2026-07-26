class ConsultarInstanciaEvolutionApi {
  constructor({ instanciaRepositorio }) {
    this.instanciaRepositorio = instanciaRepositorio;
  }

  async ejecutar(sender) {
    const entidad = await this.instanciaRepositorio.buscarPorSender(sender);

    if (!entidad) {
      return null;
    }

    return {
      ...entidad,
      configuracionHttp: {
        method: 'POST',
        url: `${entidad.serverUrl.replace(/\/$/, '')}/message/sendText/${entidad.instancia}`,
        headers: {
          apikey: entidad.apiKey,
          'Content-Type': 'application/json',
        },
        body: {
          number: entidad.sender,
          text: '',
          delay: 1000,
        },
      },
    };
  }
}

module.exports = ConsultarInstanciaEvolutionApi;
