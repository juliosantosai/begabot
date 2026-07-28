class LogTarea {
  constructor({ id, tareaId, sender, jid, texto, fechaEjecucion, fechaRegistro = new Date(), estadoFinal = 'completada', observacion = null }) {
    if (!tareaId || typeof tareaId !== 'string') {
      throw new Error('tareaId es obligatorio y debe ser string');
    }
    this.id = id || null;
    this.tareaId = tareaId;
    this.sender = sender;
    this.jid = jid;
    this.texto = texto;
    this.fechaEjecucion = fechaEjecucion;
    this.fechaRegistro = fechaRegistro;
    this.estadoFinal = estadoFinal;
    this.observacion = observacion;
  }

  toPlainObject() {
    return {
      id: this.id,
      tareaId: this.tareaId,
      sender: this.sender,
      jid: this.jid,
      texto: this.texto,
      fechaEjecucion: this.fechaEjecucion,
      fechaRegistro: this.fechaRegistro,
      estadoFinal: this.estadoFinal,
      observacion: this.observacion,
    };
  }
}

module.exports = LogTarea;
