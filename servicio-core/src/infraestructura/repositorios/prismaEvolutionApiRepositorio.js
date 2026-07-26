const EvolutionApiRepositorio = require('../../dominio/puertos/evolutionApiRepositorio');

class PrismaEvolutionApiRepositorio extends EvolutionApiRepositorio {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async guardar(instancia) {
    const existente = await this.prisma.evolutionApiConfig.findFirst({
      where: { sender: instancia.sender },
    });

    if (existente) {
      return this.prisma.evolutionApiConfig.update({
        where: { id: existente.id },
        data: {
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
        id: instancia.id,
        sender: instancia.sender,
        serverUrl: instancia.serverUrl,
        apiKey: instancia.apiKey,
        instancia: instancia.instancia,
        negocioNombre: instancia.negocioNombre,
        activo: instancia.activo,
      },
    });
  }

  async buscarPorSender(sender) {
    return this.prisma.evolutionApiConfig.findFirst({
      where: { sender },
    });
  }
}

module.exports = PrismaEvolutionApiRepositorio;
