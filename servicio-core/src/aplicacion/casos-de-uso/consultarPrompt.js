class ConsultarPrompt {
  constructor({ promptRepositorio }) {
    this.promptRepositorio = promptRepositorio;
  }

  async ejecutar(sender) {
    if (!sender || typeof sender !== 'string') {
      throw new Error('sender es obligatorio y debe ser string');
    }

    const entidad = await this.promptRepositorio.buscarPorSender(sender);

    if (!entidad) {
      throw new Error('No existe prompt para el sender proporcionado');
    }

    return entidad;
  }
}

module.exports = ConsultarPrompt;
