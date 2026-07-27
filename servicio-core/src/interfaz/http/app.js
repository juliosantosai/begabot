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
const EstadoConversacionRepositorioMemoria = require('../../infraestructura/repositorios/estadoConversacionRepositorioMemoria');
const EstadoConversacionCasosDeUso = require('../../dominio/estadoConversacion/estadoConversacionCasosDeUso');

function crearAplicacion({ prisma }) {
  const app = express();
  app.use(express.json());

  const mensajeRepositorio = new PrismaMensajeRepositorio(prisma);
  const evolutionApiRepositorio = new PrismaEvolutionApiRepositorio(prisma);
  const promptRepositorio = new PrismaPromptRepositorio(prisma);
  const httpClient = new FetchHttpClient();
  const estadoConversacionRepositorio = new EstadoConversacionRepositorioMemoria();
  const estadoConversacionCasosDeUso = new EstadoConversacionCasosDeUso({ estadoConversacionRepositorio });

  const procesarMensaje = new ProcesarMensaje({ mensajeRepositorio });
  const listarMensajesPorJid = new ListarMensajesPorJid({ mensajeRepositorio });
  const registrarPrompt = new RegistrarPrompt({ promptRepositorio });
  const consultarPrompt = new ConsultarPrompt({ promptRepositorio });
  const registrarInstanciaEvolutionApi = new RegistrarInstanciaEvolutionApi({ instanciaRepositorio: evolutionApiRepositorio });
  const consultarInstanciaEvolutionApi = new ConsultarInstanciaEvolutionApi({ instanciaRepositorio: evolutionApiRepositorio });
  const enviarMensajeEvolutionApi = new EnviarMensajeEvolutionApi({ evolutionApiRepositorio, httpClient });

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

  return app;
}

module.exports = {
  crearAplicacion,
};
