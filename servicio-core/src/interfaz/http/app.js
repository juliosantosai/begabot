const express = require('express');
const PrismaEmpresaRepositorio = require('../../infraestructura/adaptadores/prismaEmpresaRepositorio');
const RegistrarEmpresa = require('../../aplicacion/casos-uso/registrarEmpresa');

function crearAplicacion({ prisma }) {
  const app = express();
  app.use(express.json());

  const empresaRepositorio = new PrismaEmpresaRepositorio(prisma);
  const registrarEmpresa = new RegistrarEmpresa(empresaRepositorio);

  app.get('/', (_req, res) => {
    res.status(200).json({
      status: 'servicio-core listo para DDD',
      capas: ['dominio', 'aplicacion', 'infraestructura', 'interfaz'],
    });
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'servicio-core healthy' });
  });

  app.post('/ddd/empresas', async (req, res) => {
    try {
      const empresa = await registrarEmpresa.ejecutar(req.body);
      res.status(201).json({ data: empresa });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  return app;
}

module.exports = {
  crearAplicacion,
};
