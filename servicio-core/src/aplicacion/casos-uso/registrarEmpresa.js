const Empresa = require('../../dominio/empresa');

class RegistrarEmpresa {
  constructor(empresaRepositorio) {
    this.empresaRepositorio = empresaRepositorio;
  }

  async ejecutar({ name, sender }) {
    const empresa = Empresa.crear({ name, sender });
    return this.empresaRepositorio.guardar(empresa);
  }
}

module.exports = RegistrarEmpresa;
