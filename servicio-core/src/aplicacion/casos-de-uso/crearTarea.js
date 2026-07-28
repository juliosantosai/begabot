const Tarea = require('../../dominio/tareas/tarea');

class CrearTarea {
  constructor({ tareaRepositorio }) {
    this.tareaRepositorio = tareaRepositorio;
  }

  async ejecutar({ texto, estadoConversacionUuid, delay }) {
    const delayNumber = Number(delay);
    if (Number.isNaN(delayNumber) || delayNumber < 0) {
      throw new Error('delay debe ser un número mayor o igual a 0');
    }

    const fecha = new Date(Date.now() + delayNumber * 1000);
    const tarea = new Tarea({ texto, fechaEjecucion: fecha, estadoConversacionUuid });
    const resultado = await this.tareaRepositorio.crear(tarea);
    return resultado;
  }
}

module.exports = CrearTarea;
