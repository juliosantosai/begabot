# Contributing to Begabot

Gracias por querer contribuir. Este proyecto está diseñado para ser modular y fácil de extender, así que tu ayuda es muy bienvenida.

## Cómo empezar

1. Bifurca (fork) el repositorio y crea un branch descriptivo desde `main`.
2. Clona tu fork y prepara el entorno:

```bash
git clone https://github.com/<tu-usuario>/begabot.git
cd begabot
cp .env.example .env
npm install
```

3. Ejecuta los tests del servicio que modificas. Por ejemplo:

```bash
cd servicio-autoreply-fb
npm run test:unit
npm run test:integration
```

4. Actualiza la documentación (`README.md`, `docs/`, o el archivo de contrato correspondiente) si introduces nuevas APIs o cambios de comportamiento.
5. Abre un Pull Request, describe los cambios, agrega un checklist si es necesario y referencia issues relacionados.

## Buenas prácticas

- Mantén los commits pequeños y con un mensaje claro: `tipo(scope): descripción`.
- No rompas los contratos existentes sin documentarlo claramente.
- Añade tests cuando agregues funcionalidad nueva o modifiques el comportamiento.
- Si cambias la API de un servicio, actualiza su `CONTRATO-*.md` o la documentación relevante.

## Tests y validación

- `npm test` en la raíz del repositorio ejecuta los tests de los workspaces.
- `npm run test:unit` y `npm run test:integration` están disponibles en los servicios con pruebas separadas.
- Para servicios nuevos, crea un test unitario en `test/*.unit.test.js` y un test de integración en `test/*.integration.test.js`.

## Flujo de PR

- Crea un branch con un nombre claro como `feat/autoreply-fb-memory` o `fix/core-state-update`.
- Ejecuta los tests relevantes.
- Actualiza la documentación si hace falta.
- Crea el PR y añade una descripción concisa del cambio.
- Si es posible, menciona el impacto en el flujo n8n o en la integración entre servicios.
