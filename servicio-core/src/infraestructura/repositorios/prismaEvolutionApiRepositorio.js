const EvolutionApiRepositorio = require('../../dominio/puertos/evolutionApiRepositorio');

class PrismaEvolutionApiRepositorio extends EvolutionApiRepositorio {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async guardar(instancia) {
    const existente = await this.prisma.evolutionApiConfig.findFirst({
      where: { ownerJid: instancia.ownerJid },
    });

    if (existente) {
      return this.prisma.evolutionApiConfig.update({
        where: { id: existente.id },
        data: {
          ownerJid: instancia.ownerJid,
          sender: instancia.sender,
          serverUrl: instancia.serverUrl,
          apiKey: instancia.apiKey,
          instancia: instancia.instancia,
          negocioNombre: instancia.negocioNombre,
          activo: instancia.activo,
        },
      });
    }

    return this.prisma.evolutionApiConfig.create({
      data: {
        ownerJid: instancia.ownerJid,
        sender: instancia.sender,
        serverUrl: instancia.serverUrl,
        apiKey: instancia.apiKey,
        instancia: instancia.instancia,
        negocioNombre: instancia.negocioNombre,
        activo: instancia.activo,
      },
    });
  }

  async buscarPorOwnerJid(ownerJid) {
    return this.prisma.evolutionApiConfig.findFirst({
      where: { ownerJid },
    });
  }
}

module.exports = PrismaEvolutionApiRepositorio;
