const { randomUUID } = require('crypto');

class Tarea {
  constructor({ id, texto, fechaEjecucion, estadoConversacionUuid = null, estado = 'pendiente', creadoEn = new Date(), actualizadoEn = new Date() }) {
    if (!texto || typeof texto !== 'string') {
      throw new Error('texto es obligatorio y debe ser string');
    }
    if (!fechaEjecucion || !(fechaEjecucion instanceof Date)) {
      throw new Error('fechaEjecucion es obligatoria y debe ser Date');
    }

    this.id = id || randomUUID();
    this.texto = texto;
    this.fechaEjecucion = fechaEjecucion;
    this.estadoConversacionUuid = estadoConversacionUuid || null;
    this.estado = estado;
    this.creadoEn = creadoEn;
    this.actualizadoEn = actualizadoEn;
  }

  toPlainObject() {
    return {
      id: this.id,
      texto: this.texto,
      fechaEjecucion: this.fechaEjecucion,
      estadoConversacionUuid: this.estadoConversacionUuid,
      estado: this.estado,
      creadoEn: this.creadoEn,
      actualizadoEn: this.actualizadoEn,
    };
  }
}

module.exports = Tarea;
