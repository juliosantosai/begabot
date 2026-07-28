const LogTarea = require('../../dominio/tareas/logTarea');

class ConsumirTarea {
  constructor({ tareaRepositorio }) {
    this.tareaRepositorio = tareaRepositorio;
  }

  async ejecutar(id) {
    const tarea = await this.tareaRepositorio.obtenerPorId(id);
    if (!tarea) {
      throw new Error('No existe tarea con ese id');
    }

    const log = new LogTarea({
      tareaId: tarea.id,
      sender: tarea.sender,
      jid: tarea.jid,
      texto: tarea.texto,
      fechaEjecucion: tarea.fechaEjecucion,
      estadoFinal: 'completada',
    });

    const guardado = await this.tareaRepositorio.guardarLog(log);
    await this.tareaRepositorio.eliminarPorId(id);

    return guardado;
  }
}

module.exports = ConsumirTarea;
