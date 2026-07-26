# Directrices para usar Copilot en este repositorio

Objetivo:

Proveer reglas y expectativas para usar GitHub Copilot o asistentes similares al escribir código en este proyecto.

Reglas generales:

- Priorizar claridad y consistencia sobre atajos. Sigue el estilo existente en cada paquete.
- Escribe y ejecuta tests para cambios significativos antes de subir PRs.
- No aceptar sugerencias que introduzcan dependencias innecesarias o rompan compatibilidad con Node 18+.

Buenas prácticas para prompts:

- Indica el archivo y la función objetivo en el prompt.
- Especifica restricciones (estilo, tamaño, dependencia permitida).
- Pide ejemplos de tests unitarios junto con la implementación.

Revisión humana:

- Toda sugerencia de Copilot debe ser revisada por un mantenedor.
- Verifica seguridad, manejo de errores y cobertura de tests.

Formato de commits y PRs:

- Usa mensajes breves y descriptivos: `feat(service): añadir X` o `fix(module): corregir Y`.
- Incluye referencia a los tests añadidos y cómo reproducir localmente.
