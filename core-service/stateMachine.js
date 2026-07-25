const { PrismaClient } = require('@prisma/client');

let prismaPorDefecto = null;
const MAX_INTERACTIONS = 8;

function obtenerPrismaPorDefecto() {
  if (!prismaPorDefecto) {
    prismaPorDefecto = new PrismaClient();
  }

  return prismaPorDefecto;
}

function crearMaquinaEstados(prisma = obtenerPrismaPorDefecto()) {
  async function evaluarEstadoSesion(empresaId, remoteJid) {
    const empresaExiste = await prisma.company.findUnique({
      where: { id: empresaId },
    });

    if (!empresaExiste) {
      return {
        allowed: false,
        reason: 'company_not_found',
        message: 'La empresa asociada a esta sesión no existe.',
      };
    }

    let sesion = await prisma.conversationSession.findUnique({
    where: {
      companyId_remoteJid: { companyId: empresaId, remoteJid },
    },
  });

  if (!sesion) {
      sesion = await prisma.conversationSession.create({
        data: {
          companyId: empresaId,
          remoteJid,
          interactionCount: 0,
          contextJson: {
            isBlocked: false,
            botPausedByHuman: false,
            pauseExpiresAt: null,
          },
        },
      });
    }

    let contexto = sesion.contextJson || {};

    if (contexto.botPausedByHuman && contexto.pauseExpiresAt) {
      const ahora = new Date();
      const tiempoExpiracion = new Date(contexto.pauseExpiresAt);

      if (ahora < tiempoExpiracion) {
        return {
          allowed: false,
          reason: 'paused_by_human_active',
          message: 'El bot está pausado por intervención humana.',
        };
      }

      contexto.botPausedByHuman = false;
      contexto.pauseExpiresAt = null;
      sesion = await prisma.conversationSession.update({
        where: { id: sesion.id },
        data: { contextJson: contexto },
      });
    }

    if (contexto.isBlocked === true) {
      return {
        allowed: false,
        reason: 'jid_blocked',
        message: 'Este contacto está bloqueado por el administrador.',
      };
    }

    if (sesion.interactionCount >= MAX_INTERACTIONS) {
      return {
        allowed: false,
        reason: 'max_interactions_reached',
        message: 'Se alcanzó el límite máximo de interacciones permitidas.',
      };
    }

    return {
      allowed: true,
      sesion,
      interactionCount: sesion.interactionCount,
    };
  }

  async function procesarComandoOperador(empresaId, remoteJid, comando) {
    let sesion = await prisma.conversationSession.findUnique({
    where: {
      companyId_remoteJid: { companyId: empresaId, remoteJid },
    },
  });

  if (!sesion) {
      sesion = await prisma.conversationSession.create({
        data: {
          companyId: empresaId,
          remoteJid,
          interactionCount: 0,
          contextJson: { isBlocked: false, botPausedByHuman: false },
        },
      });
    }

    let contexto = sesion.contextJson || {};
    let datosActualizacion = {};
    const comandoLimpio = comando.trim();

    switch (comandoLimpio) {
      case '.':
        contexto.isBlocked = true;
        datosActualizacion = { contextJson: contexto };
        break;
      case ',':
        contexto.isBlocked = false;
        contexto.botPausedByHuman = false;
        contexto.pauseExpiresAt = null;
        datosActualizacion = { contextJson: contexto };
        break;
      case '@':
        contexto.isBlocked = false;
        contexto.botPausedByHuman = false;
        contexto.pauseExpiresAt = null;
        datosActualizacion = {
          interactionCount: 0,
          contextJson: contexto,
        };
        break;
      default:
        throw new Error('Comando no válido. Use ".", "," o "@"');
    }

    return prisma.conversationSession.update({
      where: { id: sesion.id },
      data: datosActualizacion,
    });
  }

  async function pausarBotPorMinutos(empresaId, remoteJid, minutos) {
  const fechaExpiracion = new Date(Date.now() + minutos * 60000).toISOString();

    let sesion = await prisma.conversationSession.findUnique({
      where: {
        companyId_remoteJid: { companyId: empresaId, remoteJid },
      },
    });

    if (!sesion) {
      sesion = await prisma.conversationSession.create({
        data: {
          companyId: empresaId,
          remoteJid,
          interactionCount: 0,
          contextJson: {},
        },
      });
    }

    let contexto = sesion.contextJson || {};
    contexto.botPausedByHuman = true;
    contexto.pauseExpiresAt = fechaExpiracion;

    return prisma.conversationSession.update({
      where: { id: sesion.id },
      data: { contextJson: contexto },
    });
  }

  return {
    evaluarEstadoSesion,
    procesarComandoOperador,
    pausarBotPorMinutos,
    MAX_INTERACTIONS,
  };
}

const maquinaEstados = crearMaquinaEstados();

module.exports = {
  crearMaquinaEstados,
  evaluarEstadoSesion: maquinaEstados.evaluarEstadoSesion,
  procesarComandoOperador: maquinaEstados.procesarComandoOperador,
  pausarBotPorMinutos: maquinaEstados.pausarBotPorMinutos,
  MAX_INTERACTIONS,
};
