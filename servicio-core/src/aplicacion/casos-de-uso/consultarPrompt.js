class ConsultarPrompt {
  constructor({ promptRepositorio }) {
    this.promptRepositorio = promptRepositorio;
  }

  // ejecutar(sender, tenantId?)
  async ejecutar(sender, tenantId) {
    if (!sender || typeof sender !== 'string') {
      throw new Error('sender es obligatorio y debe ser string');
    }

    let entidad = null;
    if (tenantId && typeof this.promptRepositorio.buscarPorSenderYTenant === 'function') {
      entidad = await this.promptRepositorio.buscarPorSenderYTenant(sender, tenantId);
    } else {
      entidad = await this.promptRepositorio.buscarPorSender(sender);
    }

    if (!entidad) {
      throw new Error('No existe prompt para el sender proporcionado');
    }

    return entidad;
  }
}

module.exports = ConsultarPrompt;
