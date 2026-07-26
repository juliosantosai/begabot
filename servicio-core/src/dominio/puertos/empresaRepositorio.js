class EmpresaRepositorio {
  async guardar(_empresa) {
    throw new Error('El repositorio de empresas debe implementar guardar().');
  }

  async buscarPorSender(_sender) {
    throw new Error('El repositorio de empresas debe implementar buscarPorSender().');
  }
}

module.exports = EmpresaRepositorio;
