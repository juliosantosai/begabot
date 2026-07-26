const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { MAX_INTERACTIONS: MAX_INTERACCIONES_MAQUINA } = require('./maquinaEstados');

const prisma = new PrismaClient();

const PORT = process.env.PORT || 3002;
const MAX_INTERACTIONS = MAX_INTERACCIONES_MAQUINA;

function crearAplicacion(prismaCliente = prisma) {
  const maquinaEstados = require('./maquinaEstados').crearMaquinaEstados(prismaCliente);
  const aplicacionLocal = express();
  aplicacionLocal.use(express.json());

  async function registrarMensaje({ empresaId, remitenteJid, direccion, cuerpoMensaje }) {
    return prismaCliente.messageHistory.create({
      data: {
        companyId: empresaId,
        remoteJid: remitenteJid,
        direction: direccion,
        messageBody: cuerpoMensaje,
      },
    });
  }

  aplicacionLocal.post('/api/procesar-mensaje', async (peticion, respuesta) => {
    try {
      const { sender, remoteJid, jid, messageBody, command, commando, comando } = peticion.body;
      const jidFinal = (remoteJid || jid || '').toString().trim();
      const messageBodyFinal = (messageBody || command || commando || comando || '').toString().trim();

      if (!jidFinal || !messageBodyFinal) {
        return respuesta.status(400).json({
          error: 'Faltan parámetros obligatorios (remoteJid/jid, messageBody/command)',
        });
      }

      let empresa = await prismaCliente.company.findFirst({
        where: {
          sender: jidFinal,
        },
      });

      if (!empresa) {
        empresa = await prismaCliente.company.create({
          data: {
            name: `Prueba-${jidFinal}`,
            sender: jidFinal,
            status: 'active_trial',
          },
        });
      }

      let sesion = await prismaCliente.conversationSession.findUnique({
        where: {
          companyId_remoteJid: {
            companyId: empresa.id,
            remoteJid: jidFinal,
          },
        },
      });

      if (!sesion) {
        sesion = await prismaCliente.conversationSession.create({
          data: {
            companyId: empresa.id,
            remoteJid: jidFinal,
            interactionCount: 0,
            contextJson: {
              isBlocked: false,
              botPausedByHuman: false,
              pauseExpiresAt: null,
            },
          },
        });
      }

      const sesionActualizada = await prismaCliente.conversationSession.update({
        where: { id: sesion.id },
        data: {
          interactionCount: { increment: 1 },
          contextJson: {
            ...(sesion.contextJson || {}),
            status: 'inicio',
            variables: {},
          },
        },
      });

      // Manejo de comandos especiales antes de evaluar la sesión
      const textoLimpio = (messageBodyFinal || '').toString().trim();
      const comandoNormalizado = textoLimpio.toLowerCase();

      const comandosAdmin = ['.', '@', ',', 'bloquear', 'desbloquear', 'actualizar', 'reiniciar', 'resetear', 'humano'];
      if (comandosAdmin.includes(comandoNormalizado)) {
        try {
          await maquinaEstados.procesarComandoOperador(empresa.id, jidFinal, textoLimpio);

          const replies = {
            '.': 'Bot bloqueado permanentemente para este usuario.',
            '@': 'Interacciones reiniciadas. El bot está activo nuevamente.',
            ',': 'Bot desbloqueado y reactivado.',
            'bloquear': 'Bot bloqueado permanentemente para este usuario.',
            'desbloquear': 'Bot desbloqueado y reactivado.',
            'actualizar': 'Interacciones reiniciadas. El bot está activo nuevamente.',
            'reiniciar': 'Interacciones reiniciadas. El bot está activo nuevamente.',
            'resetear': 'Interacciones reiniciadas. El bot está activo nuevamente.',
            'humano': 'Atención cambiada a modo humano.',
          };

          return respuesta.status(200).json({ status: 'success', reply: replies[comandoNormalizado] });
        } catch (cmdError) {
          console.error('Error procesando comando operador:', cmdError);
          return respuesta.status(500).json({ error: 'Error procesando comando operador' });
        }
      }

      return respuesta.status(200).json({
        status: 'success',
        interactionCount: sesionActualizada.interactionCount,
        contextJson: sesionActualizada.contextJson,
        messageBody: messageBodyFinal,
      });
    } catch (error) {
      console.error('Error en el microservicio de procesamiento:', error);
      return respuesta.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  aplicacionLocal.post('/api/registrar-saliente', async (peticion, respuesta) => {
    try {
      const { companyId, remoteJid, messageBody } = peticion.body;

      if (!companyId || !remoteJid || !messageBody) {
        return respuesta.status(400).json({ error: 'Faltan parámetros obligatorios (companyId, remoteJid, messageBody)' });
      }

      const registro = await registrarMensaje({
        empresaId: companyId,
        remitenteJid: remoteJid,
        direccion: 'outbound',
        cuerpoMensaje: messageBody,
      });

      return respuesta.status(200).json({ status: 'success', data: registro });
    } catch (error) {
      console.error('Error registrando mensaje saliente:', error);
      return respuesta.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  aplicacionLocal.post('/api/session-status', async (peticion, respuesta) => {
    try {
      const { sender, remoteJid } = peticion.body;

      if (!remoteJid) {
        return respuesta.status(400).json({ error: 'Falta el parámetro remoteJid' });
      }

      let empresa = null;
      if (sender) {
        empresa = await prismaCliente.company.findUnique({ where: { sender } });
      }

      if (!empresa) {
        empresa = await prismaCliente.company.findFirst({
          where: {
            OR: [{ sender }, { name: { contains: remoteJid } }],
          },
        });
      }

      if (!empresa) {
        empresa = await prismaCliente.company.create({
          data: {
            name: `Prueba-${remoteJid}`,
            sender: sender || remoteJid,
            status: 'active_trial',
          },
        });

        const configuracionBot = await prismaCliente.botConfig.create({
          data: {
            companyId: empresa.id,
            customSystemPrompt: 'Eres un asistente útil de prueba para un cliente nuevo.',
            aiModel: 'gpt-4o-mini',
            temperature: 0.7,
          },
        });

        empresa = await prismaCliente.company.update({
          where: { id: empresa.id },
          data: { botConfigId: configuracionBot.id },
          include: { botConfig: true },
        });
      }

      if (empresa.status !== 'active_trial' && empresa.status !== 'active') {
        return respuesta.status(404).json({ error: 'Compañía inactiva o suspendida.' });
      }

      let existingSession = await prismaCliente.conversationSession.findUnique({
        where: {
          companyId_remoteJid: { companyId: empresa.id, remoteJid },
        },
      });

      let updatedSession;
      let sessionCreated = false;

      if (!existingSession) {
        sessionCreated = true;
        updatedSession = await prismaCliente.conversationSession.create({
          data: {
            companyId: empresa.id,
            remoteJid,
            interactionCount: 1,
            contextJson: {
              isBlocked: false,
              botPausedByHuman: false,
              pauseExpiresAt: null,
            },
          },
        });
      } else {
        updatedSession = await prismaCliente.conversationSession.update({
          where: { id: existingSession.id },
          data: { interactionCount: { increment: 1 } },
        });
      }

      const estadoSesion = await maquinaEstados.evaluarEstadoSesion(empresa.id, remoteJid);

      return respuesta.status(200).json({
        status: 'success',
        companyId: empresa.id,
        companyName: empresa.name,
        remoteJid,
        allowed: estadoSesion.allowed,
        reason: estadoSesion.reason,
        message: estadoSesion.message,
        interactionCount: updatedSession.interactionCount,
        contextJson: updatedSession.contextJson || {},
        sessionCreated,
      });
    } catch (error) {
      console.error('Error consultando estado de sesión:', error);
      return respuesta.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  // Endpoint genérico de consulta/operación para n8n: { action, entity, where, data }
  aplicacionLocal.get('/', (_peticion, respuesta) => {
    return respuesta.status(200).json({ status: 'servicio-core online' });
  });

  aplicacionLocal.get('/health', (_peticion, respuesta) => {
    return respuesta.status(200).json({ status: 'servicio-core healthy' });
  });

  aplicacionLocal.post('/api/query', async (peticion, respuesta) => {
    try {
      const { action, entity, where, data, options } = peticion.body;

      if (!action || !entity) {
        return respuesta.status(400).json({ error: 'Se requieren action y entity' });
      }

      // Lista blanca de entidades expuestas
      const allowed = ['company', 'conversationSession', 'messageHistory', 'interactionLog', 'botConfig', 'promptPerformanceLog'];
      if (!allowed.includes(entity)) {
        return respuesta.status(403).json({ error: 'Entidad no permitida' });
      }

      let result;
      switch (action) {
        case 'findUnique':
          result = await prismaCliente[entity].findUnique({ where });
          break;
        case 'findMany':
          result = await prismaCliente[entity].findMany({ where, ...(options || {}) });
          break;
        case 'create':
          result = await prismaCliente[entity].create({ data });
          break;
        case 'update':
          result = await prismaCliente[entity].update({ where, data });
          break;
        case 'delete':
          result = await prismaCliente[entity].delete({ where });
          break;
        default:
          return respuesta.status(400).json({ error: 'Action no soportada' });
      }

      return respuesta.status(200).json({ status: 'success', data: result });
    } catch (error) {
      console.error('Error en /api/query:', error);
      return respuesta.status(500).json({ error: 'Error interno en query endpoint' });
    }
  });

  aplicacionLocal.post('/api/log-interaction', async (peticion, respuesta) => {
    try {
      const { sender, remoteJid, userQuery, aiResponse, intent, modelUsed, promptTokens, completionTokens, latencyMs } = peticion.body;

      if (!sender || !remoteJid || !userQuery || !aiResponse) {
        return respuesta.status(400).json({ error: 'Faltan parámetros obligatorios (sender, remoteJid, userQuery, aiResponse)' });
      }

      const empresa = await prismaCliente.company.findUnique({ where: { sender } });

      if (!empresa) {
        return respuesta.status(404).json({ error: 'Compañía no encontrada' });
      }

      await prismaCliente.messageHistory.create({
        data: {
          companyId: empresa.id,
          remoteJid,
          direction: 'outbound',
          messageBody: aiResponse,
        },
      });

      await prismaCliente.interactionLog.create({
        data: {
          companyId: empresa.id,
          remoteJid,
          intent,
          userQuery,
          aiResponse,
        },
      });

      if (modelUsed && latencyMs !== undefined) {
        await prismaCliente.promptPerformanceLog.create({
          data: {
            companyId: empresa.id,
            botConfigId: empresa.botConfigId,
            modelUsed,
            promptTokens: promptTokens || 0,
            completionTokens: completionTokens || 0,
            totalTokens: (promptTokens || 0) + (completionTokens || 0),
            latencyMs,
            status: 'success',
          },
        });
      }

      return respuesta.status(200).json({ status: 'success', message: 'Interacción y métricas registradas correctamente' });
    } catch (error) {
      console.error('Error al registrar interacción:', error);
      return respuesta.status(500).json({ error: 'Error interno' });
    }
  });

  aplicacionLocal.post('/api/empresa-por-jid', async (peticion, respuesta) => {
    try {
      const { remoteJid, sender } = peticion.body;

      if (!remoteJid) {
        return respuesta.status(400).json({ error: 'Falta el parámetro remoteJid' });
      }

      let empresa = await prismaCliente.company.findFirst({
        where: {
          OR: [{ sender }, { name: { contains: remoteJid } }],
        },
        include: { botConfig: true },
      });

      if (!empresa) {
        const nombreEmpresa = `Prueba-${remoteJid}`;

        empresa = await prismaCliente.company.create({
          data: {
            name: nombreEmpresa,
            sender: sender || remoteJid,
            status: 'active_trial',
          },
        });

        const configuracionBot = await prismaCliente.botConfig.create({
          data: {
            companyId: empresa.id,
            customSystemPrompt: 'Eres un asistente útil de prueba para un cliente nuevo.',
            aiModel: 'gpt-4o-mini',
            temperature: 0.7,
          },
        });

        empresa = await prismaCliente.company.update({
          where: { id: empresa.id },
          data: { botConfigId: configuracionBot.id },
          include: { botConfig: true },
        });
      }

      return respuesta.status(200).json({
        status: 'success',
        data: {
          companyId: empresa.id,
          companyName: empresa.name,
          status: empresa.status,
          botConfig: empresa.botConfig,
        },
      });
    } catch (error) {
      console.error('Error resolviendo empresa por JID:', error);
      return respuesta.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  aplicacionLocal.post('/api/companies', async (peticion, respuesta) => {
    try {
      const { name, sender, status = 'active_trial', templateName, systemPrompt, aiModel = 'gpt-4o-mini' } = peticion.body;

      if (!name || !sender) {
        return respuesta.status(400).json({ error: 'Faltan los campos name y sender' });
      }

      let configuracionBot = null;

      if (templateName || systemPrompt) {
        configuracionBot = await prismaCliente.botConfig.upsert({
          where: { templateName: templateName || 'default' },
          update: {
            systemPrompt: systemPrompt || 'Eres un asistente útil.',
            aiModel,
          },
          create: {
            templateName: templateName || 'default',
            systemPrompt: systemPrompt || 'Eres un asistente útil.',
            aiModel,
          },
        });
      }

      const empresaCreada = await prismaCliente.company.upsert({
        where: { sender },
        update: {
          name,
          status,
          ...(configuracionBot ? { botConfigId: configuracionBot.id } : {}),
        },
        create: {
          name,
          sender,
          status,
          botConfigId: configuracionBot?.id,
        },
        include: { botConfig: true },
      });

      return respuesta.status(201).json({ status: 'success', data: empresaCreada });
    } catch (error) {
      console.error('Error creando empresa:', error);
      return respuesta.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  aplicacionLocal.put('/api/companies/:id/config', async (peticion, respuesta) => {
    try {
      const { id } = peticion.params;
      const { templateName, systemPrompt, aiModel = 'gpt-4o-mini' } = peticion.body;

      if (!templateName || !systemPrompt) {
        return respuesta.status(400).json({ error: 'Se requieren templateName y systemPrompt' });
      }

      const empresaExistente = await prismaCliente.company.findUnique({
        where: { id },
      });

      if (!empresaExistente) {
        return respuesta.status(404).json({ error: 'Empresa no encontrada' });
      }

      const configuracionBot = await prismaCliente.botConfig.upsert({
        where: { templateName },
        update: {
          systemPrompt,
          aiModel,
        },
        create: {
          templateName,
          systemPrompt,
          aiModel,
        },
      });

      const empresaActualizada = await prismaCliente.company.update({
        where: { id },
        data: {
          botConfigId: configuracionBot.id,
        },
        include: { botConfig: true },
      });

      return respuesta.status(200).json({ status: 'success', data: empresaActualizada });
    } catch (error) {
      console.error('Error actualizando configuración de empresa:', error);
      return respuesta.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  aplicacionLocal.get('/api/companies/:companyId/history', async (peticion, respuesta) => {
    try {
      const { companyId } = peticion.params;
      const { remoteJid } = peticion.query;

      const historial = await prismaCliente.messageHistory.findMany({
        where: {
          companyId,
          ...(remoteJid ? { remoteJid } : {}),
        },
        orderBy: { createdAt: 'asc' },
      });

      return respuesta.status(200).json({ status: 'success', data: historial });
    } catch (error) {
      console.error('Error consultando historial:', error);
      return respuesta.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  aplicacionLocal.get('/api/companies/:companyId/stats', async (peticion, respuesta) => {
    try {
      const { companyId } = peticion.params;

      const [totalMensajes, sesionesActivas, sesionesTotales] = await Promise.all([
        prismaCliente.messageHistory.count({ where: { companyId } }),
        prismaCliente.conversationSession.count({
          where: {
            companyId,
            interactionCount: { gt: 0 },
          },
        }),
        prismaCliente.conversationSession.count({ where: { companyId } }),
      ]);

      return respuesta.status(200).json({
        status: 'success',
        data: {
          totalMensajes,
          sesionesActivas,
          sesionesTotales,
          interaccionesUsadas: totalMensajes,
        },
      });
    } catch (error) {
      console.error('Error consultando estadísticas:', error);
      return respuesta.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  aplicacionLocal.get('/api/companies/:sender/audit', async (peticion, respuesta) => {
    try {
      const { sender } = peticion.params;

      const empresa = await prismaCliente.company.findUnique({
        where: { sender },
        include: {
          messages: { take: 50, orderBy: { createdAt: 'desc' } },
          interactionLogs: { take: 50, orderBy: { createdAt: 'desc' } },
          promptPerformanceLogs: { take: 50, orderBy: { createdAt: 'desc' } },
        },
      });

      if (!empresa) {
        return respuesta.status(404).json({ error: 'Compañía no encontrada' });
      }

      return respuesta.status(200).json({
        status: 'success',
        companyName: empresa.name,
        recentMessages: empresa.messages,
        recentIntents: empresa.interactionLogs,
        performanceMetrics: empresa.promptPerformanceLogs,
      });
    } catch (error) {
      console.error('Error al consultar auditoría:', error);
      return respuesta.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  aplicacionLocal.get('/health', (_peticion, _respuesta) => {
    _respuesta.status(200).json({ status: 'ok' });
  });

  return aplicacionLocal;
}

const app = crearAplicacion();

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Microservicio de Base de Datos y Core corriendo en el puerto ${PORT}`);
  });
}

module.exports = {
  crearAplicacion,
  MAX_INTERACTIONS,
};
