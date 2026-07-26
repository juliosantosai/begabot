# Módulo: packages/shared-contracts

Propósito:

Biblioteca de utilidades y contratos compartidos entre servicios (normalizadores, constructores de eventos, helpers).

Archivos clave:

- `index.js`, `package.json`, `test/index.test.js`

Cómo usar:

Desde otros paquetes se importa como dependencia local. En desarrollo:

```bash
cd packages/shared-contracts
npm install
npm test
```

Notas:

- Mantener la API estable; los cambios en `shared-contracts` pueden afectar múltiples servicios.
