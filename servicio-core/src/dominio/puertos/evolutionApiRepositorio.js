class EvolutionApiRepositorio {
  async guardar(_instancia) {
    throw new Error('Debe implementar guardar().');
  }

  async buscarPorSender(_sender) {
    throw new Error('Debe implementar buscarPorSender().');
  }
}

module.exports = EvolutionApiRepositorio;
