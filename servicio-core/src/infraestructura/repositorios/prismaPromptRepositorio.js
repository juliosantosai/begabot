const PromptRepositorio = require('../../dominio/puertos/promptRepositorio');

class PrismaPromptRepositorio extends PromptRepositorio {
  constructor(prisma) {
    super();
    this.prisma = prisma;
  }

  async guardar(prompt) {
    const existente = await this.prisma.prompt.findFirst({
      where: { sender: prompt.sender },
    });

    if (existente) {
      return this.prisma.prompt.update({
        where: { id: existente.id },
        data: {
          prompt: prompt.prompt,
          actualizadoEn: prompt.actualizadoEn,
        },
      });
    }

    return this.prisma.prompt.create({
      data: {
        id: prompt.id,
        sender: prompt.sender,
        prompt: prompt.prompt,
        creadoEn: prompt.creadoEn,
        actualizadoEn: prompt.actualizadoEn,
      },
    });
  }

  async buscarPorSender(sender) {
    return this.prisma.prompt.findFirst({
      where: { sender },
    });
  }
}

module.exports = PrismaPromptRepositorio;
