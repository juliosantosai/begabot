class EvolutionApiRepositorio {
  async guardar(_instancia) {
    throw new Error('Debe implementar guardar().');
  }

  async buscarPorOwnerJid(_ownerJid) {
    throw new Error('Debe implementar buscarPorOwnerJid().');
  }
}

module.exports = EvolutionApiRepositorio;
