const express = require('express');
const PrismaMensajeRepositorio = require('../../infraestructura/repositorios/prismaMensajeRepositorio');
const PrismaEvolutionApiRepositorio = require('../../infraestructura/repositorios/prismaEvolutionApiRepositorio');
const PrismaPromptRepositorio = require('../../infraestructura/repositorios/prismaPromptRepositorio');
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

function esClientePrismaValido(prisma) {
  return prisma && typeof prisma === 'object' && (
    typeof prisma.estadoConversacion === 'object' || typeof prisma.task === 'object'
  );
}

function crearAplicacion({ prisma, estadoConversacionRepositorio, evolutionApiRepositorio }) {
  const app = express();
  app.use(express.json());

  const mensajeRepositorio = new PrismaMensajeRepositorio(prisma);
  const evolutionApiRepositorioInstance = evolutionApiRepositorio || new PrismaEvolutionApiRepositorio(prisma);
  const promptRepositorio = new PrismaPromptRepositorio(prisma);
  const httpClient = new FetchHttpClient();
  const estadoRepositorio = estadoConversacionRepositorio
    || (esClientePrismaValido(prisma) ? new PrismaEstadoConversacionRepositorio(prisma) : new EstadoConversacionRepositorioMemoria());
  const estadoConversacionCasosDeUso = new EstadoConversacionCasosDeUso({ estadoConversacionRepositorio: estadoRepositorio });

  const procesarMensaje = new ProcesarMensaje({ mensajeRepositorio });
  const listarMensajesPorJid = new ListarMensajesPorJid({ mensajeRepositorio });
  const registrarPrompt = new RegistrarPrompt({ promptRepositorio });
  const consultarPrompt = new ConsultarPrompt({ promptRepositorio });
  const registrarInstanciaEvolutionApi = new RegistrarInstanciaEvolutionApi({ instanciaRepositorio: evolutionApiRepositorioInstance });
  const consultarInstanciaEvolutionApi = new ConsultarInstanciaEvolutionApi({ instanciaRepositorio: evolutionApiRepositorioInstance });
  const enviarMensajeEvolutionApi = new EnviarMensajeEvolutionApi({ evolutionApiRepositorio: evolutionApiRepositorioInstance, httpClient });
  const tareaRepositorio = esClientePrismaValido(prisma) ? new PrismaTareaRepositorio(prisma) : null;
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
      const { texto, fechaEjecucion, estadoConversacionUuid } = req.body;
      if (!tareaRepositorio) return res.status(500).json({ error: 'Repositorio de tareas no disponible' });
      const resultado = await crearTarea.ejecutar({ texto, fechaEjecucion, estadoConversacionUuid });
      res.status(201).json({ data: resultado });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Consume next pending task automatically
  app.post('/core/tareas/consumir', async (_req, res) => {
    try {
      if (!tareaRepositorio) return res.status(500).json({ error: 'Repositorio de tareas no disponible' });
      const resultado = await consumirProximaTarea.ejecutar();
      res.status(200).json({ data: resultado });
    } catch (error) {
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
        sender: tarea.sender,
        jid: tarea.jid,
        texto: tarea.texto,
        fechaEjecucion: tarea.fechaEjecucion,
        estado: tarea.estado,
        segundosRestantes: Math.max(0, Math.floor((new Date(tarea.fechaEjecucion).getTime() - ahora) / 1000)),
      }));
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
