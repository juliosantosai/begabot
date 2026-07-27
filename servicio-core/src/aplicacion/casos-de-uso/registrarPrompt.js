const Prompt = require('../../dominio/prompts/prompt');

class RegistrarPrompt {
  constructor({ promptRepositorio }) {
    this.promptRepositorio = promptRepositorio;
  }

  async ejecutar({ sender, prompt }) {
    const entidad = new Prompt({ sender, prompt });
    const existente = await this.promptRepositorio.buscarPorSender(sender);

    if (existente) {
      return this.promptRepositorio.guardar({
        ...existente,
        prompt: entidad.prompt,
        actualizadoEn: entidad.actualizadoEn,
      });
    }

    return this.promptRepositorio.guardar(entidad.toPlainObject());
  }
}

module.exports = RegistrarPrompt;
