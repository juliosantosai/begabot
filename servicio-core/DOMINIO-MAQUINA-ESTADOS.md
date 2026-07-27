# Dominio: Máquina de estados para `servicio-core`

## Propósito

Definir el dominio de la máquina de estados con los campos mínimos solicitados: `uuid`, `jid`, `sender`, `bloqueado`, `contexto` y `numero`.

## Entidad principal: EstadoConversacion

### Atributos

- `uuid` (string)
  - Identificador único de la máquina de estado.
  - Se genera al crear el registro.

- `jid` (string)
  - Identificador del cliente.
  - Puede existir el mismo `jid` para distintos `sender`.

- `sender` (string)
  - Identificador del canal/empresa destinataria.
  - `jid` + `sender` forman el contexto único de la conversación.

- `bloqueado` (booleano)
  - Indica si la conversación está bloqueada.
  - Sólo puede ser `true` o `false`.

- `contexto` (objeto / string)
  - Información de contexto asociada al par `jid` + `sender`.

- `numero` (entero)
  - Contador secuencial de lecturas.
  - Se incrementa automáticamente cada vez que se consulta el estado.

## Contrato

### GET /core/estado-conversacion

- Recibe `jid` y `sender` como query params.
- Si no existe un registro para el par `jid` + `sender`, crea uno nuevo con:
  - `uuid` generado
  - `bloqueado: false`
  - `contexto: {}`
  - `numero: 1`
- Si ya existe, incrementa el campo `numero` en 1 y devuelve el registro actualizado.

#### Ejemplo de request

`GET /core/estado-conversacion?jid=595981133313@s.whatsapp.net&sender=empresa123`

#### Respuesta

```json
{
  "uuid": "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
  "jid": "595981133313@s.whatsapp.net",
  "sender": "empresa123",
  "bloqueado": false,
  "contexto": {},
  "numero": 1
}
```

### GET /core/estado-conversacion/sin-incrementar

- Recibe `jid` y `sender` como query params.
- Si no existe un registro para el par `jid` + `sender`, crea uno nuevo con:
  - `uuid` generado
  - `bloqueado: false`
  - `contexto: {}`
  - `numero: 1`
- Si ya existe, devuelve el registro actual sin incrementar `numero`.

#### Ejemplo de request

`GET /core/estado-conversacion/sin-incrementar?jid=595981133313@s.whatsapp.net&sender=empresa123`

#### Respuesta

```json
{
  "uuid": "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
  "jid": "595981133313@s.whatsapp.net",
  "sender": "empresa123",
  "bloqueado": false,
  "contexto": {},
  "numero": 4
}
```

### POST /core/estado-conversacion/:uuid/bloqueo

- Actualiza el estado de bloqueo en un registro identificado por `uuid`.
- `uuid` se envía como parámetro de ruta.
- No es necesario enviar body JSON para bloquear o desbloquear.
- Usa query params:
  - `bloqueado=true` para bloquear.
  - `bloqueado=false` para desbloquear.
  - `reset=true` para desbloquear y reiniciar `numero` a `1`.
  - Si el estado ya existe y se identifica por `uuid`, no es necesario enviar `jid` ni `sender`.
  - `jid` y `sender` se pueden enviar como query params solo cuando el estado no existe y debe crearse.

#### Ejemplos de request

`POST /core/estado-conversacion/:uuid/bloqueo?bloqueado=true`

`POST /core/estado-conversacion/:uuid/bloqueo?bloqueado=false`

`POST /core/estado-conversacion/:uuid/bloqueo?reset=true&jid=595981133313@s.whatsapp.net&sender=empresa123`

- Si el registro existe:
  - `bloqueado=true` lo bloquea.
  - `bloqueado=false` lo desbloquea.
  - `reset=true` lo desbloquea, pone `numero` en `1` y vacía `contexto` a `{}`.
- Si el registro no existe y se proveen `jid` y `sender`, crea el registro con el `uuid` de la ruta.
- Respuesta:

```json
{
  "uuid": "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
  "jid": "595981133313@s.whatsapp.net",
  "sender": "empresa123",
  "bloqueado": true,
  "contexto": {},
  "numero": 1
}
```

### POST /core/estado-conversacion/:uuid/contexto

- Actualiza el campo `contexto` de un registro identificado por `uuid`.
- `uuid` se envía como parámetro de ruta.
- Request body:

```json
{
  "jid": "595981133313@s.whatsapp.net",
  "sender": "empresa123",
  "contexto": {
    "ultimoMensaje": "Nueva petición"
  }
}
```

- Si el registro existe, actualiza `contexto`.
- Si el registro no existe, crea uno nuevo con el `uuid` de la ruta siempre que se provean `jid` y `sender`.
- Respuesta:

```json
{
  "uuid": "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
  "jid": "595981133313@s.whatsapp.net",
  "sender": "empresa123",
  "bloqueado": false,
  "contexto": {
    "ultimoMensaje": "Nueva petición"
  },
  "numero": 1
}
```

## Reglas clave

- El registro contiene: `uuid`, `jid`, `sender`, `bloqueado`, `contexto` y `numero`.
- `jid` y `sender` juntos forman la identidad única de la conversación.
- El campo `numero` sólo se incrementa en el endpoint de lectura `GET`.
- El campo `bloqueado` es booleano y puede ser actualizado con su propio endpoint.
- El campo `contexto` se actualiza con su propio endpoint.
- Si no existe un registro para el par `jid` + `sender`, se crea uno nuevo.
