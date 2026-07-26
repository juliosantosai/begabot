const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { crearAplicacion } = require('./src/interfaz/http/app');

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3002;

const app = crearAplicacion({ prisma });

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Core listo para mensajes en puerto ${PORT}`);
  });
}

module.exports = {
  crearAplicacion,
  prisma,
};
