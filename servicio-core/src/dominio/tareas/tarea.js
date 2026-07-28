const { randomUUID } = require('crypto');

class Tarea {
  constructor({ id, texto, fechaEjecucion, estado = 'pendiente', creadoEn = new Date(), actualizadoEn = new Date(), payload = {} }) {
    if (!texto || typeof texto !== 'string') {
      throw new Error('texto es obligatorio y debe ser string');
    }
    if (!fechaEjecucion || !(fechaEjecucion instanceof Date)) {
      throw new Error('fechaEjecucion es obligatoria y debe ser Date');
    }

    this.id = id || randomUUID();
    this.texto = texto;
    this.fechaEjecucion = fechaEjecucion;
    this.estado = estado;
    this.creadoEn = creadoEn;
    this.actualizadoEn = actualizadoEn;
    this.payload = payload || {};
  }

  toPlainObject() {
    return {
      id: this.id,
      texto: this.texto,
      fechaEjecucion: this.fechaEjecucion,
      estado: this.estado,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
      payload: this.payload,
    };
  }
}

module.exports = Tarea;
