class EvolutionApiRepositorio {
  async guardar(_instancia) {
    throw new Error('Debe implementar guardar().');
  }

  async buscarPorSender(_sender) {
    throw new Error('Debe implementar buscarPorSender().');
  }

  async listarTodos() {
    throw new Error('Debe implementar listarTodos().');
  }
}

module.exports = EvolutionApiRepositorio;
