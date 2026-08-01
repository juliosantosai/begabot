const express = require('express');
const PrismaMensajeRepositorio = require('../../infraestructura/repositorios/prismaMensajeRepositorio');
const PrismaEvolutionApiRepositorio = require('../../infraestructura/repositorios/prismaEvolutionApiRepositorio');
const PrismaPromptRepositorio = require('../../infraestructura/repositorios/prismaPromptRepositorio');
const PrismaSessionMemoryRepositorio = require('../../infraestructura/repositorios/prismaSessionMemoryRepositorio');
const PrismaTenantSessionMemoryRepositorio = require('../../infraestructura/repositorios/prismaTenantSessionMemoryRepositorio');
const PrismaDynamicRecordRepositorio = require('../../infraestructura/repositorios/prismaDynamicRecordRepositorio');
const PrismaTenantMessageRepositorio = require('../../infraestructura/repositorios/prismaTenantMessageRepositorio');
const ServicioAgenteHttp = require('../../infraestructura/ai/servicioAgenteHttp');
const FetchHttpClient = require('../../infraestructura/http/fetchHttpClient');
const ProcesarMensaje = require('../../aplicacion/casos-de-uso/procesarMensaje');
const ListarMensajesPorJid = require('../../aplicacion/casos-de-uso/listarMensajesPorJid');
const RegistrarPrompt = require('../../aplicacion/casos-de-uso/registrarPrompt');
const ConsultarPrompt = require('../../aplicacion/casos-de-uso/consultarPrompt');
const RegistrarInstanciaEvolutionApi = require('../../aplicacion/casos-de-uso/registrarInstanciaEvolutionApi');
const ConsultarInstanciaEvolutionApi = require('../../aplicacion/casos-de-uso/consultarInstanciaEvolutionApi');
const EnviarMensajeEvolutionApi = require('../../aplicacion/casos-de-uso/enviarMensajeEvolutionApi');
const PrismaEstadoConversacionRepositorio = require('../../infraestructura/repositorios/prismaEstadoConversacionRepositorio');
const EstadoConversacionRepositorioMemoria = require('../../infraestructura/repositorios/estadoConversacionRepositorioMemoria');
const EstadoConversacionCasosDeUso = require('../../dominio/estadoConversacion/estadoConversacionCasosDeUso');
const PrismaTareaRepositorio = require('../../infraestructura/repositorios/prismaTareaRepositorio');
const CrearTarea = require('../../aplicacion/casos-de-uso/crearTarea');
const ConsumirTarea = require('../../aplicacion/casos-de-uso/consumirTarea');
const { withTenantContext, createTenantAwarePrismaClient } = require('../../infraestructura/prisma/tenantContextPrisma');

function esClientePrismaValido(prisma) {
  return prisma && typeof prisma === 'object' && (
    typeof prisma.estadoConversacion === 'object' || typeof prisma.task === 'object'
  );
}

function crearAplicacion({ prisma, estadoConversacionRepositorio, evolutionApiRepositorio, tareaRepositorio: tareaRepositorioParam } = {}) {
  const app = express();
  app.use(express.json());

  const tenantAwarePrisma = createTenantAwarePrismaClient(prisma);
  app.use('/core/tenants/:tenantId', (req, res, next) => {
    const routeTenantId = req.params?.tenantId;
    const headerTenantId = req.headers['x-tenant-id'] || req.headers['x-tenantid'];
    const bodyTenantId = req.body?.tenantId;
    const tenantId = routeTenantId || headerTenantId || bodyTenantId;

    if (headerTenantId && routeTenantId && headerTenantId !== routeTenantId) {
      return res.status(400).json({ error: 'tenantId mismatch' });
    }

    return withTenantContext(tenantId, () => next());
  });

  const mensajeRepositorio = new PrismaMensajeRepositorio(prisma);
  const evolutionApiRepositorioInstance = evolutionApiRepositorio || new PrismaEvolutionApiRepositorio(prisma);
  const promptRepositorio = new PrismaPromptRepositorio(prisma);
  const httpClient = new FetchHttpClient();
  const estadoRepositorio = estadoConversacionRepositorio
    || (esClientePrismaValido(prisma) ? new PrismaEstadoConversacionRepositorio(prisma) : new EstadoConversacionRepositorioMemoria());
  const estadoConversacionCasosDeUso = new EstadoConversacionCasosDeUso({ estadoConversacionRepositorio: estadoRepositorio });

  const sessionMemoryRepositorio = esClientePrismaValido(prisma) ? new PrismaSessionMemoryRepositorio(prisma) : null;
  const tenantSessionMemoryRepositorio = prisma ? new PrismaTenantSessionMemoryRepositorio(tenantAwarePrisma) : null;
  const dynamicRecordRepositorio = prisma ? new PrismaDynamicRecordRepositorio(tenantAwarePrisma) : null;
  const tenantMessageRepositorio = prisma ? new PrismaTenantMessageRepositorio(tenantAwarePrisma) : null;
  const agenteIa = new ServicioAgenteHttp({ url: process.env.AI_SERVICE_URL || process.env.AGENT_SERVICE_URL || 'http://localhost:3003', httpClient });

  const procesarMensaje = new ProcesarMensaje({ mensajeRepositorio, sessionMemoryRepositorio, agenteIa });
  const listarMensajesPorJid = new ListarMensajesPorJid({ mensajeRepositorio });
  const registrarPrompt = new RegistrarPrompt({ promptRepositorio });
  const consultarPrompt = new ConsultarPrompt({ promptRepositorio });
  const registrarInstanciaEvolutionApi = new RegistrarInstanciaEvolutionApi({ instanciaRepositorio: evolutionApiRepositorioInstance });
  const consultarInstanciaEvolutionApi = new ConsultarInstanciaEvolutionApi({ instanciaRepositorio: evolutionApiRepositorioInstance });
  const enviarMensajeEvolutionApi = new EnviarMensajeEvolutionApi({ evolutionApiRepositorio: evolutionApiRepositorioInstance, httpClient });
  const tareaRepositorio = tareaRepositorioParam || (esClientePrismaValido(prisma) ? new PrismaTareaRepositorio(prisma) : null);
  const crearTarea = new CrearTarea({ tareaRepositorio });
  const consumirTarea = new ConsumirTarea({ tareaRepositorio });
  const consumirProximaTarea = new (require('../../aplicacion/casos-de-uso/consumirProximaTarea'))({ tareaRepositorio });

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'servicio-core healthy' });
  });

  app.post('/core/mensajes', async (req, res) => {
    try {
      const resultado = await procesarMensaje.ejecutar(req.body);
      res.status(201).json({ data: resultado });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/core/mensajes/:jid', async (req, res) => {
    try {
      const mensajes = await listarMensajesPorJid.ejecutar(req.params.jid);
      res.status(200).json({ data: mensajes });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Endpoint 1: Consultar historial y memoria por jid
  app.get('/core/sesiones/:jid', async (req, res) => {
    try {
      const { jid } = req.params;
      if (!jid) return res.status(400).json({ error: 'jid es obligatorio' });

      const mensajes = await listarMensajesPorJid.ejecutar(jid);
      const memoria = this && this.sessionMemoryRepositorio ? null : null; // no-op to keep linter quiet
      let session = null;
      try {
        session = await sessionMemoryRepositorio?.obtenerPorJid?.(jid);
      } catch (e) {
        // ignore
      }

      const memory_patch = session?.state_data || {};
      const mensajes_recientes = (mensajes || []).map((m) => ({ role: m.role || m.sender, content: m.content || m.texto, created_at: m.createdAt || m.creadoEn }));

      return res.status(200).json({ jid, memory_patch, mensajes_recientes });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.post('/core/evolution-api/configuracion', async (req, res) => {
    try {
      const resultado = await registrarInstanciaEvolutionApi.ejecutar(req.body);
      res.status(201).json({ data: resultado });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/core/evolution-api/configuracion/:sender', async (req, res) => {
    try {
      const resultado = await consultarInstanciaEvolutionApi.ejecutar(req.params.sender);
      res.status(200).json({ data: resultado });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/core/evolution-api/configuraciones', async (_req, res) => {
    try {
      const instancias = await evolutionApiRepositorioInstance.listarTodos();
      const data = instancias.map((entidad) => ({
        ...entidad,
        configuracionHttp: {
          method: 'POST',
          url: `${entidad.serverUrl.replace(/\/$/, '')}/message/sendText/${entidad.instancia}`,
          headers: {
            apikey: entidad.apiKey,
            'Content-Type': 'application/json',
          },
          body: {
            number: entidad.sender,
            text: '',
            delay: 1000,
          },
        },
      }));
      res.status(200).json({ data });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/core/evolution-api/enviar', async (req, res) => {
    try {
      const resultado = await enviarMensajeEvolutionApi.ejecutar(req.body);
      res.status(200).json({ data: resultado });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Endpoint 2: Consultar catálogo / búsqueda de productos (simple)
  const productosMock = [
    { id: 1, nombre: 'Cámara Pro 4K', precio: 299.99, stock: 15 },
    { id: 2, nombre: 'Cámara Lite 1080p', precio: 149.99, stock: 32 },
  ];

  app.get('/core/productos', async (req, res) => {
    try {
      const q = (req.query.q || '').toLowerCase();
      const productos = q ? productosMock.filter((p) => p.nombre.toLowerCase().includes(q)) : productosMock;
      res.status(200).json({ productos });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/core/productos/buscar', async (req, res) => {
    try {
      const q = (req.query.q || '').toLowerCase();
      const productos = q ? productosMock.filter((p) => p.nombre.toLowerCase().includes(q)) : [];
      res.status(200).json({ productos });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Tenant endpoints: GET configuration and session
  app.get('/core/tenants/:tenantId/sesiones/:jid', async (req, res) => {
    try {
      const { tenantId, jid } = req.params;
      if (!tenantId || !jid) return res.status(400).json({ error: 'tenantId y jid son obligatorios' });

      // required fields from tenant config (if available)
      let required_fields = [];
      if (tenantAwarePrisma && tenantAwarePrisma.tenantConfig) {
        const cfg = await tenantAwarePrisma.tenantConfig.findUnique({ where: { tenantId } });
        if (cfg && cfg.fields) required_fields = cfg.fields;
      }

      // get memory
      const session = tenantSessionMemoryRepositorio ? await tenantSessionMemoryRepositorio.obtenerPorTenantYJid(tenantId, jid) : null;
      const memory_patch = session?.memoryPatch || {};

      // recent messages
      const mensajes = tenantMessageRepositorio ? await tenantMessageRepositorio.listarRecientes(tenantId, jid, 10) : [];
      const mensajes_recientes = (mensajes || []).map((m) => ({ role: m.role, content: m.content, createdAt: m.createdAt }));

      return res.status(200).json({ tenant_id: tenantId, jid, required_fields, memory_patch, mensajes_recientes });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  // Tenant endpoints: Persistencia
  app.post('/core/tenants/:tenantId/sesiones/persistencia', async (req, res) => {
    const { tenantId } = req.params;
    const { jid, mensaje_usuario, respuesta_ia, memory_patch, dynamic_record } = req.body || {};

    if (!tenantId || !jid) {
      return res.status(400).json({ error: 'tenantId y jid son obligatorios' });
    }

    try {
      const tenantConfig = tenantAwarePrisma && tenantAwarePrisma.tenantConfig ? await tenantAwarePrisma.tenantConfig.findUnique({ where: { tenantId } }) : null;
      const allowedFields = tenantConfig && Array.isArray(tenantConfig.fields) ? tenantConfig.fields : [];

      let filteredData = {};
      let recordIdentifier = jid;
      const hasAllowlist = Array.isArray(allowedFields) && allowedFields.length > 0;

      if (dynamic_record && dynamic_record.data && typeof dynamic_record.data === 'object' && !Array.isArray(dynamic_record.data)) {
        for (const [key, value] of Object.entries(dynamic_record.data)) {
          if (hasAllowlist && allowedFields.includes(key)) {
            filteredData[key] = value;
          }
        }

        if (filteredData.cedula) {
          recordIdentifier = String(filteredData.cedula);
        }
      }

      const resultado = await tenantAwarePrisma.$transaction(async (tx) => {
        const txPrisma = createTenantAwarePrismaClient(tx);

        if (mensaje_usuario) {
          await txPrisma.messageTenant.create({
            data: { tenantId, jid, role: 'user', content: mensaje_usuario },
          });
        }

        if (respuesta_ia) {
          await txPrisma.messageTenant.create({
            data: { tenantId, jid, role: 'assistant', content: respuesta_ia },
          });
        }

        let updatedMemory = {};
        if (memory_patch && typeof memory_patch === 'object' && !Array.isArray(memory_patch)) {
          const existingSession = await txPrisma.sessionMemoryTenant.findUnique({
            where: { tenantId_jid: { tenantId, jid } },
          });
          const currentPatch = existingSession?.memoryPatch || {};
          updatedMemory = { ...currentPatch, ...memory_patch };

          await txPrisma.sessionMemoryTenant.upsert({
            where: { tenantId_jid: { tenantId, jid } },
            update: { memoryPatch: updatedMemory },
            create: { tenantId, jid, memoryPatch: updatedMemory },
          });
        }

        let savedRecord = null;
        const entityName = dynamic_record?.entityName || dynamic_record?.entity_name;
        if (dynamic_record && entityName && Object.keys(filteredData).length > 0) {
          savedRecord = await txPrisma.dynamicRecord.upsert({
            where: {
              tenantId_entityName_recordIdentifier: {
                tenantId,
                entityName,
                recordIdentifier,
              },
            },
            update: { data: filteredData },
            create: {
              tenantId,
              entityName,
              recordIdentifier,
              data: filteredData,
            },
          });
        }

        return { updatedMemory, savedRecord };
      });

      return res.status(201).json({
        status: 'success',
        persisted: true,
        session_memory: resultado.updatedMemory,
        dynamic_record: resultado.savedRecord,
      });
    } catch (error) {
      console.error('Error en persistencia multi-tenant:', error);
      return res.status(500).json({ error: 'Error interno al persistir la sesión' });
    }
  });

  app.get('/core/prompts/:sender', async (req, res) => {
    try {
      const resultado = await consultarPrompt.ejecutar(req.params.sender);
      res.status(200).json({ data: resultado });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/core/prompts/:sender', async (req, res) => {
    try {
      const { prompt } = req.body;
      const resultado = await registrarPrompt.ejecutar({ sender: req.params.sender, prompt });
      res.status(201).json({ data: resultado });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/core/estado-conversacion', async (req, res) => {
    try {
      const { jid, sender } = req.query;
      if (!jid || !sender) {
        return res.status(400).json({ error: 'jid y sender son obligatorios' });
      }
      const estado = await estadoConversacionCasosDeUso.obtenerEstado(jid, sender);
      return res.status(200).json(estado);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.get('/core/estado-conversacion/sin-incrementar', async (req, res) => {
    try {
      const { jid, sender } = req.query;
      if (!jid || !sender) {
        return res.status(400).json({ error: 'jid y sender son obligatorios' });
      }
      const estado = await estadoConversacionCasosDeUso.obtenerEstadoSinIncrementar(jid, sender);
      return res.status(200).json(estado);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.get('/core/estado-conversacion/todos', async (_req, res) => {
    try {
      const estados = await estadoRepositorio.listarTodos();
      return res.status(200).json({ data: estados.map((estado) => estado.toPlainObject ? estado.toPlainObject() : estado) });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.get('/core/estado-conversacion/:uuid', async (req, res) => {
    try {
      const { uuid } = req.params;
      if (!uuid) {
        return res.status(400).json({ error: 'uuid es obligatorio' });
      }
      const estado = await estadoRepositorio.obtenerPorUuid(uuid);
      if (!estado) {
        return res.status(404).json({ error: 'No existe estado de conversación con ese uuid' });
      }
      return res.status(200).json(estado.toPlainObject ? estado.toPlainObject() : estado);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.post('/core/estado-conversacion/:uuid/bloqueo', async (req, res) => {
    try {
      const { uuid } = req.params;
      const { jid, sender, bloqueado: bloqueadoQuery, reset } = req.query;
      if (!uuid) {
        return res.status(400).json({ error: 'uuid es obligatorio' });
      }

      const shouldReset = String(reset).toLowerCase() === 'true';
      let bloqueado = true;
      if (shouldReset) {
        bloqueado = false;
      } else if (bloqueadoQuery !== undefined) {
        bloqueado = String(bloqueadoQuery).toLowerCase() === 'true';
      }

      const estado = await estadoConversacionCasosDeUso.actualizarBloqueoPorUuid(
        uuid,
        bloqueado,
        { jid, sender },
        shouldReset,
      );
      return res.status(200).json(estado);
    } catch (error) {
      const statusCode = error.message.includes('No existe estado y faltan jid/sender para crear uno nuevo') ? 404 : 500;
      return res.status(statusCode).json({ error: error.message });
    }
  });

  app.post('/core/estado-conversacion/:uuid/contexto', async (req, res) => {
    try {
      const { uuid } = req.params;
      const { contexto, jid, sender } = req.body;
      if (!uuid) {
        return res.status(400).json({ error: 'uuid es obligatorio' });
      }
      if (contexto === undefined) {
        return res.status(400).json({ error: 'contexto es obligatorio' });
      }
      const estado = await estadoConversacionCasosDeUso.actualizarContextoPorUuid(uuid, contexto, { jid, sender });
      return res.status(200).json(estado);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.post('/core/tareas', async (req, res) => {
    try {
      const { uuid, texto, delay } = req.body;
      if (!tareaRepositorio) return res.status(500).json({ error: 'Repositorio de tareas no disponible' });
      if (!texto && texto !== null) {
        return res.status(400).json({ error: 'texto es obligatorio y puede ser null' });
      }
      if (delay === undefined || delay === null) {
        return res.status(400).json({ error: 'delay es obligatorio' });
      }
      const resultado = await crearTarea.ejecutar({ texto, estadoConversacionUuid: uuid, delay });
      res.status(201).json({ data: resultado });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/core/tareas/borrar-todos', async (req, res) => {
    try {
      if (!tareaRepositorio) return res.status(500).json({ error: 'Repositorio de tareas no disponible' });
      const webhookSecret = process.env.WEBHOOK_SECRET;
      if (webhookSecret && req.headers['x-webhook-secret'] !== webhookSecret) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const resultado = await tareaRepositorio.borrarTodos();
      return res.status(200).json({ data: resultado });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  // Consume next pending task automatically
  app.post('/core/tareas/consumir', async (_req, res) => {
    try {
      if (!tareaRepositorio) return res.status(500).json({ error: 'Repositorio de tareas no disponible' });
      const resultado = await consumirProximaTarea.ejecutar();
      const tareaRespuesta = (resultado && resultado.tarea) ? resultado.tarea : resultado;
      const logRespuesta = (resultado && resultado.log) ? resultado.log : null;
      res.status(200).json({ data: { tareaPendiente: true, tarea: tareaRespuesta, log: logRespuesta } });
    } catch (error) {
      if (error.message === 'No hay tareas pendientes' || error.message === 'No hay tareas pendientes para ejecutar') {
        return res.status(200).json({ data: { tareaPendiente: false, tarea: null } });
      }
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/core/tareas/pendientes', async (_req, res) => {
    try {
      if (!tareaRepositorio) return res.status(500).json({ error: 'Repositorio de tareas no disponible' });
      const pendientes = await tareaRepositorio.listarPendientes();
      const ahora = Date.now();
      const data = pendientes.map((tarea) => ({
        id: tarea.id,
        uuid: tarea.id,
        texto: tarea.texto,
        estadoConversacionUuid: tarea.estadoConversacionUuid,
        fechaEjecucion: tarea.fechaEjecucion,
        estado: tarea.estado,
        segundosRestantes: Math.max(0, Math.floor((new Date(tarea.fechaEjecucion).getTime() - ahora) / 1000)),
      }));
      res.status(200).json({ data });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/core/tareas/futuro', async (_req, res) => {
    try {
      if (!tareaRepositorio) return res.status(500).json({ error: 'Repositorio de tareas no disponible' });
      const futuras = await tareaRepositorio.listarFuturas();
      const ahora = Date.now();
      const data = futuras.map((tarea) => {
        const diffMs = Math.max(0, new Date(tarea.fechaEjecucion).getTime() - ahora);
        let segundos = Math.floor(diffMs / 1000);
        const dias = Math.floor(segundos / 86400);
        segundos -= dias * 86400;
        const horas = Math.floor(segundos / 3600);
        segundos -= horas * 3600;
        const minutos = Math.floor(segundos / 60);
        segundos -= minutos * 60;
        const tiempoHasta = { dias, horas, minutos, segundos };
        const tiempoHastaStr = `${dias}d ${horas}h ${minutos}m ${segundos}s`;

        return {
          id: tarea.id,
          uuid: tarea.id,
          texto: tarea.texto,
          estadoConversacionUuid: tarea.estadoConversacionUuid,
          fechaEjecucion: tarea.fechaEjecucion,
          estado: tarea.estado,
          tiempoHasta,
          tiempoHastaStr,
        };
      });
      res.status(200).json({ data });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  return app;
}

module.exports = {
  crearAplicacion,
};
