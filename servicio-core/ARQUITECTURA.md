# Arquitectura del módulo core

## Objetivo
Este módulo concentra el dominio de mensajes del sistema.

## Estructura propuesta

- dominio/
  - mensajes/: define la entidad de mensaje y las reglas de negocio mínimas.
  - puertos/: define los contratos que deben implementar los repositorios.
- aplicacion/
  - casos-de-uso/: contiene los casos de uso para procesar mensajes y listarlos por JID.
- infraestructura/
  - repositorios/: implementa la persistencia con Prisma.
- interfaz/
  - http/: expone los endpoints del módulo.

## Responsabilidades

- El dominio decide qué forma tiene un mensaje válido.
- La aplicación orquesta la ejecución de los casos de uso.
- La infraestructura se encarga de guardar y recuperar mensajes.
- La interfaz expone los endpoints HTTP.

## Flujo principal
1. El sistema recibe un mensaje con JID, texto, isFromClient y source.
2. El caso de uso ProcesarMensaje valida y crea la entidad de dominio.
3. El repositorio persiste el mensaje.
4. El endpoint permite consultar todos los mensajes asociados a un JID.
