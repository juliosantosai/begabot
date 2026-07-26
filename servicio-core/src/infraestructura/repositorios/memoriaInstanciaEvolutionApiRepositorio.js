class MemoriaInstanciaEvolutionApiRepositorio {
  constructor() {
    this.registros = new Map();
  }

  async guardar(instancia) {
    this.registros.set(instancia.ownerJid, instancia);
    return instancia;
  }

  async buscarPorOwnerJid(ownerJid) {
    return this.registros.get(ownerJid) || null;
  }
}

module.exports = MemoriaInstanciaEvolutionApiRepositorio;
