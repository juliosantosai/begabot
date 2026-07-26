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

/**
 * Función pura para evaluar reglas de sesión sin acceso a BD.
 * Útil para tests unitarios y escenarios desacoplados.
 * @param {Object} session - objeto de sesión (puede contener interactionCount, pausedUntil, maxInteractions, isBlocked)
 * @param {string} incomingText - texto entrante del usuario
 */
function evaluateSessionState(session = {}, incomingText = '') {
  const now = new Date();

  // 1. Verificación de Bloqueo Permanente (.)
  if (incomingText && incomingText.toString().trim() === '.') {
    return {
      action: 'BLOCK',
      replyMessage: 'Bot bloqueado permanentemente para este usuario.',
      updateData: { isBlocked: true },
    };
  }

  // 2. Verificación de Reinicio de Sesión (@)
  if (incomingText && incomingText.toString().trim().startsWith('@')) {
    return {
      action: 'RESET',
      replyMessage: 'Interacciones reiniciadas. El bot está activo nuevamente.',
      updateData: { interactionCount: 0, isBlocked: false, pausedUntil: null },
    };
  }

  // 3. Verificación de Pausa Temporal por Minutos (Silencio de operador humano)
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

  // 4. Control de Límite de Ciclos (Máximo por defecto 8)
  const maxInteractions = session?.maxInteractions || MAX_INTERACTIONS || 8;
  const currentCount = (session?.interactionCount || 0) + 1;

  if (currentCount > maxInteractions) {
    return {
      action: 'LIMIT_REACHED',
      replyMessage: 'Se ha alcanzado el límite máximo de interacciones de este ciclo. Un asesor humano continuará la atención.',
      updateData: { interactionCount: currentCount, isBlocked: true },
    };
  }

  // Flujo normal
  return {
    action: 'PROCEED',
    replyMessage: null,
    updateData: { interactionCount: currentCount },
  };
}

module.exports.evaluateSessionState = evaluateSessionState;
