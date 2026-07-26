const InstanciaEvolutionApi = require('../../dominio/evolution-api/instanciaEvolutionApi');

class RegistrarInstanciaEvolutionApi {
  constructor({ instanciaRepositorio }) {
    this.instanciaRepositorio = instanciaRepositorio;
  }

  async ejecutar({ sender, serverUrl, apiKey, instancia, negocioNombre, activo }) {
    const activoBoolean = typeof activo === 'string' ? activo.toLowerCase() === 'true' : Boolean(activo);
    const entidad = new InstanciaEvolutionApi({
      sender,
      serverUrl,
      apiKey,
      instancia,
      negocioNombre,
      activo: activoBoolean,
    });

    const existente = await this.instanciaRepositorio.buscarPorSender(sender);

    if (existente) {
      return this.instanciaRepositorio.guardar({
        ...existente,
        ...entidad,
        configuracionHttp: entidad.construirConfiguracionHttp(),
      });
    }

    return this.instanciaRepositorio.guardar({
      ...entidad,
      configuracionHttp: entidad.construirConfiguracionHttp(),
    });
  }
}

module.exports = RegistrarInstanciaEvolutionApi;
