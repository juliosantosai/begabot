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
    const comandoLimpio = (comando || '').toString().trim().toLowerCase();

    switch (comandoLimpio) {
      case '.':
      case 'bloquear':
        contexto.isBlocked = true;
        contexto.botPausedByHuman = false;
        contexto.pauseExpiresAt = null;
        datosActualizacion = { contextJson: contexto };
        break;
      case ',':
      case 'desbloquear':
        contexto.isBlocked = false;
        contexto.botPausedByHuman = false;
        contexto.pauseExpiresAt = null;
        datosActualizacion = { contextJson: contexto };
        break;
      case '@':
      case 'actualizar':
      case 'reiniciar':
      case 'resetear':
        contexto.isBlocked = false;
        contexto.botPausedByHuman = false;
        contexto.pauseExpiresAt = null;
        datosActualizacion = {
          interactionCount: 0,
          contextJson: contexto,
        };
        break;
      case 'humano':
        contexto.isBlocked = false;
        contexto.botPausedByHuman = true;
        contexto.pauseExpiresAt = null;
        datosActualizacion = { contextJson: contexto };
        break;
      default:
        throw new Error('Comando no válido. Use ".", ",", "@", "bloquear", "desbloquear", "actualizar", "reiniciar", "resetear" o "humano"');
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

/**
 * Función pura para evaluar reglas de sesión sin acceso a BD.
 * Útil para tests unitarios y escenarios desacoplados.
 * @param {Object} session - objeto de sesión (puede contener interactionCount, pausedUntil, maxInteractions, isBlocked)
 * @param {string} incomingText - texto entrante del usuario
 */
function evaluarEstadoSesionPuro(session = {}, incomingText = '') {
  const now = new Date();
  const text = incomingText && incomingText.toString().trim();

  if (!text) {
    return {
      action: 'PROCEED',
      replyMessage: null,
      updateData: { interactionCount: (session?.interactionCount || 0) + 1 },
    };
  }

  const normalized = text.toLowerCase();

  if (normalized === 'bloquear') {
    return {
      action: 'BLOCK',
      replyMessage: 'Bot bloqueado permanentemente para este usuario.',
      updateData: { isBlocked: true, interactionCount: session?.interactionCount || 0 },
    };
  }

  if (normalized === 'desbloquear') {
    return {
      action: 'UNBLOCK',
      replyMessage: 'Bot desbloqueado y activo nuevamente.',
      updateData: { isBlocked: false, interactionCount: session?.interactionCount || 0 },
    };
  }

  if (normalized === 'humano') {
    return {
      action: 'HUMAN_PAUSED',
      replyMessage: 'La atención pasó a modo humano.',
      updateData: {
        botPausedByHuman: true,
        pauseExpiresAt: null,
        interactionCount: session?.interactionCount || 0,
      },
    };
  }

  if (normalized === 'actualizar') {
    return {
      action: 'UPDATE',
      replyMessage: 'Sesión actualizada.',
      updateData: { interactionCount: session?.interactionCount || 0 },
    };
  }

  if (session?.pausedUntil) {
    const pauseDate = new Date(session.pausedUntil);
    if (pauseDate > now) {
      return {
        action: 'SKIPPED_PAUSED',
        replyMessage: null,
        updateData: {},
      };
    }
  }

  const currentCount = (session?.interactionCount || 0) + 1;

  return {
    action: 'PROCEED',
    replyMessage: null,
    updateData: { interactionCount: currentCount },
  };
}

module.exports.evaluarEstadoSesionPuro = evaluarEstadoSesionPuro;
module.exports.evaluateSessionState = evaluarEstadoSesionPuro;
