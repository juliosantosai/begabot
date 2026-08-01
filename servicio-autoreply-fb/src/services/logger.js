function createLogger(scope) {
  return {
    info(message, meta = {}) {
      console.log(JSON.stringify({ level: 'info', scope, message, ...meta, timestamp: new Date().toISOString() }));
    },
    error(message, meta = {}) {
      console.error(JSON.stringify({ level: 'error', scope, message, ...meta, timestamp: new Date().toISOString() }));
    },
  };
}

module.exports = { createLogger };
