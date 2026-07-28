const LogTarea = require('../../dominio/tareas/logTarea');

class ConsumirProximaTarea {
  constructor({ tareaRepositorio }) {
    this.tareaRepositorio = tareaRepositorio;
  }

  async ejecutar() {
    const pendientes = await this.tareaRepositorio.listarPendientes();
    if (!pendientes || pendientes.length === 0) {
      throw new Error('No hay tareas pendientes');
    }

    const ahora = new Date();
    const tareasListas = pendientes.filter((tarea) => new Date(tarea.fechaEjecucion) <= ahora);

    if (!tareasListas.length) {
      throw new Error('No hay tareas pendientes para ejecutar');
    }

    const tarea = tareasListas[0];

    const log = new LogTarea({
      tareaId: tarea.id,
      sender: tarea.sender,
      jid: tarea.jid,
      texto: tarea.texto,
      fechaEjecucion: tarea.fechaEjecucion,
      estadoFinal: 'completada',
      observacion: null,
    });

    const guardado = await this.tareaRepositorio.guardarLog(log);
    await this.tareaRepositorio.eliminarPorId(tarea.id);

    return guardado;
  }
}

module.exports = ConsumirProximaTarea;
