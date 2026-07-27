class PromptRepositorio {
  async buscarPorSender(_sender) {
    throw new Error('Debe implementar buscarPorSender().');
  }

  async guardar(_prompt) {
    throw new Error('Debe implementar guardar().');
  }
}

module.exports = PromptRepositorio;
