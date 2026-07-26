const InstanciaEvolutionApi = require('../../dominio/evolution-api/instanciaEvolutionApi');

class RegistrarInstanciaEvolutionApi {
  constructor({ instanciaRepositorio }) {
    this.instanciaRepositorio = instanciaRepositorio;
  }

  async ejecutar({ ownerJid, sender, serverUrl, apiKey, instancia, negocioNombre, activo }) {
    const entidad = new InstanciaEvolutionApi({
      ownerJid,
      sender,
      serverUrl,
      apiKey,
      instancia,
      negocioNombre,
      activo,
    });

    const existente = await this.instanciaRepositorio.buscarPorOwnerJid(ownerJid);

    if (existente) {
      return this.instanciaRepositorio.guardar({ ...existente, ...entidad, configuracionHttp: entidad.construirConfiguracionHttp() });
    }

    return this.instanciaRepositorio.guardar({
      ...entidad,
      configuracionHttp: entidad.construirConfiguracionHttp(),
    });
  }
}

module.exports = RegistrarInstanciaEvolutionApi;
