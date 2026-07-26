const Mensaje = require('../../dominio/mensajes/mensaje');

class ProcesarMensaje {
  constructor({ mensajeRepositorio }) {
    this.mensajeRepositorio = mensajeRepositorio;
  }

  async ejecutar({ jid, texto, isFromClient, source }) {
    const mensaje = new Mensaje({ jid, texto, isFromClient, source });
    return this.mensajeRepositorio.guardar(mensaje);
  }
}

module.exports = ProcesarMensaje;
