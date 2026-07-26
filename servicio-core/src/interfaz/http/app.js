const express = require('express');
const PrismaMensajeRepositorio = require('../../infraestructura/repositorios/prismaMensajeRepositorio');
const PrismaEvolutionApiRepositorio = require('../../infraestructura/repositorios/prismaEvolutionApiRepositorio');
const FetchHttpClient = require('../../infraestructura/http/fetchHttpClient');
const ProcesarMensaje = require('../../aplicacion/casos-de-uso/procesarMensaje');
const ListarMensajesPorJid = require('../../aplicacion/casos-de-uso/listarMensajesPorJid');
const RegistrarInstanciaEvolutionApi = require('../../aplicacion/casos-de-uso/registrarInstanciaEvolutionApi');
const ConsultarInstanciaEvolutionApi = require('../../aplicacion/casos-de-uso/consultarInstanciaEvolutionApi');
const EnviarMensajeEvolutionApi = require('../../aplicacion/casos-de-uso/enviarMensajeEvolutionApi');

function crearAplicacion({ prisma }) {
  const app = express();
  app.use(express.json());

  const mensajeRepositorio = new PrismaMensajeRepositorio(prisma);
  const evolutionApiRepositorio = new PrismaEvolutionApiRepositorio(prisma);
  const httpClient = new FetchHttpClient();

  const procesarMensaje = new ProcesarMensaje({ mensajeRepositorio });
  const listarMensajesPorJid = new ListarMensajesPorJid({ mensajeRepositorio });
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

  return app;
}

module.exports = {
  crearAplicacion,
};
