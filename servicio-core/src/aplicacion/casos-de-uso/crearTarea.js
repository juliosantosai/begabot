const Tarea = require('../../dominio/tareas/tarea');

class CrearTarea {
  constructor({ tareaRepositorio }) {
    this.tareaRepositorio = tareaRepositorio;
  }

  async ejecutar({ texto, fechaEjecucion, estadoConversacionUuid }) {
    const fecha = fechaEjecucion instanceof Date ? fechaEjecucion : new Date(fechaEjecucion);
    const payload = estadoConversacionUuid ? { estadoConversacionUuid } : {};
    const tarea = new Tarea({ texto, fechaEjecucion: fecha, payload });
    const resultado = await this.tareaRepositorio.crear(tarea);
    return resultado;
  }
}

module.exports = CrearTarea;
