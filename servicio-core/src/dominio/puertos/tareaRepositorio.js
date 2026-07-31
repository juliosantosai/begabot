class TareaRepositorio {
  async crear(_tarea) {
    throw new Error('Debe implementar crear()');
  }

  async obtenerPorId(_id) {
    throw new Error('Debe implementar obtenerPorId()');
  }

  async obtenerPorEstadoConversacionUuid(_estadoConversacionUuid) {
    throw new Error('Debe implementar obtenerPorEstadoConversacionUuid()');
  }

  async listarPendientes() {
    throw new Error('Debe implementar listarPendientes()');
  }

  async listarFuturas() {
    throw new Error('Debe implementar listarFuturas()');
  }

  async borrarTodos() {
    throw new Error('Debe implementar borrarTodos()');
  }

  async eliminarPorId(_id) {
    throw new Error('Debe implementar eliminarPorId()');
  }

  async guardarLog(_log) {
    throw new Error('Debe implementar guardarLog()');
  }
}

module.exports = TareaRepositorio;
