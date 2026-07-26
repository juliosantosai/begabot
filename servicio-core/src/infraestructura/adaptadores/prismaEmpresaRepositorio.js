const EmpresaRepositorio = require('../../dominio/puertos/empresaRepositorio');

class PrismaEmpresaRepositorio extends EmpresaRepositorio {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async guardar(empresa) {
    const empresaCreada = await this.prisma.company.create({
      data: {
        name: empresa.name,
        sender: empresa.sender,
        status: empresa.status,
      },
    });

    return {
      id: empresaCreada.id,
      name: empresaCreada.name,
      sender: empresaCreada.sender,
      status: empresaCreada.status,
    };
  }

  async buscarPorSender(sender) {
    const empresa = await this.prisma.company.findUnique({
      where: { sender },
    });

    if (!empresa) {
      return null;
    }

    return {
      id: empresa.id,
      name: empresa.name,
      sender: empresa.sender,
      status: empresa.status,
    };
  }
}

module.exports = PrismaEmpresaRepositorio;
