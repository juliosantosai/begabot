--
-- PostgreSQL database dump
--

\restrict amQjNxYBYe9AsHGbX7SiBPYY9b7C2zNVreY6kNJDyglZ3hmfAtWVoM42TZaFA5K

-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: EstadoConversacion; Type: TABLE; Schema: public; Owner: begabot_user
--

CREATE TABLE public."EstadoConversacion" (
    uuid text NOT NULL,
    jid text NOT NULL,
    sender text NOT NULL,
    bloqueado boolean DEFAULT false NOT NULL,
    contexto jsonb DEFAULT '{}'::jsonb NOT NULL,
    numero integer DEFAULT 1 NOT NULL
);


ALTER TABLE public."EstadoConversacion" OWNER TO begabot_user;

--
-- Name: EvolutionApiConfig; Type: TABLE; Schema: public; Owner: begabot_user
--

CREATE TABLE public."EvolutionApiConfig" (
    id text NOT NULL,
    sender text NOT NULL,
    "serverUrl" text NOT NULL,
    "apiKey" text NOT NULL,
    instancia text NOT NULL,
    "negocioNombre" text,
    activo boolean DEFAULT true NOT NULL
);


ALTER TABLE public."EvolutionApiConfig" OWNER TO begabot_user;

--
-- Name: MessageHistory; Type: TABLE; Schema: public; Owner: begabot_user
--

CREATE TABLE public."MessageHistory" (
    id text NOT NULL,
    jid text NOT NULL,
    texto text NOT NULL,
    "isFromClient" boolean NOT NULL,
    source text NOT NULL,
    "creadoEn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MessageHistory" OWNER TO begabot_user;

--
-- Name: Prompt; Type: TABLE; Schema: public; Owner: begabot_user
--

CREATE TABLE public."Prompt" (
    id text NOT NULL,
    sender text NOT NULL,
    prompt text NOT NULL,
    "creadoEn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "actualizadoEn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Prompt" OWNER TO begabot_user;

--
-- Name: Task; Type: TABLE; Schema: public; Owner: begabot_user
--

CREATE TABLE public."Task" (
    id text NOT NULL,
    sender text NOT NULL,
    jid text NOT NULL,
    texto text NOT NULL,
    "fechaEjecucion" timestamp(3) without time zone NOT NULL,
    estado text DEFAULT 'pendiente'::text NOT NULL,
    "creadoEn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "actualizadoEn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    eliminado boolean DEFAULT false NOT NULL,
    payload jsonb
);


ALTER TABLE public."Task" OWNER TO begabot_user;

--
-- Name: TaskLog; Type: TABLE; Schema: public; Owner: begabot_user
--

CREATE TABLE public."TaskLog" (
    id text NOT NULL,
    "tareaId" text NOT NULL,
    sender text NOT NULL,
    jid text NOT NULL,
    texto text NOT NULL,
    "fechaEjecucion" timestamp(3) without time zone NOT NULL,
    "fechaRegistro" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "estadoFinal" text NOT NULL,
    observacion text
);


ALTER TABLE public."TaskLog" OWNER TO begabot_user;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: begabot_user
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO begabot_user;

--
-- Data for Name: EstadoConversacion; Type: TABLE DATA; Schema: public; Owner: begabot_user
--

COPY public."EstadoConversacion" (uuid, jid, sender, bloqueado, contexto, numero) FROM stdin;
3c294d85-af45-4a0b-ac1c-ecb922160bb3	test@example.com	test	f	{}	1
e6392245-6e03-4924-9ad4-b779eb7ccb4c	reinicio@example.com	demo	f	{}	2
360d872b-d433-4ed8-b428-92d462fd87e6	reinicio2@example.com	demo	f	{}	1
0c4de5a4-b0a9-4d08-9410-fd5ea6654673	reinicio3@example.com	demo	f	{}	2
79ac213b-2834-465f-8635-ef5bc3ba3899	595981133313@s.whatsapp.net	595993358150@s.whatsapp.net	f	"Zona: Pendiente/Necesidad: Pendiente/Cantidad: Pendiente/Ubicación: Pendiente/Delivery: Pendiente/preciototal: 0/Estado: Zona"	6
\.


--
-- Data for Name: EvolutionApiConfig; Type: TABLE DATA; Schema: public; Owner: begabot_user
--

COPY public."EvolutionApiConfig" (id, sender, "serverUrl", "apiKey", instancia, "negocioNombre", activo) FROM stdin;
e5562551-9c36-4811-9116-cf7581c47a81	595993358150@s.whatsapp.net	https://evolutionapi-evolution-api.tuxbfq.easypanel.host	C72947216ABD-4957-B7E2-DA911A29D6DA	150	Sin nombre	t
\.


--
-- Data for Name: MessageHistory; Type: TABLE DATA; Schema: public; Owner: begabot_user
--

COPY public."MessageHistory" (id, jid, texto, "isFromClient", source, "creadoEn") FROM stdin;
\.


--
-- Data for Name: Prompt; Type: TABLE DATA; Schema: public; Owner: begabot_user
--

COPY public."Prompt" (id, sender, prompt, "creadoEn", "actualizadoEn") FROM stdin;
eed3fec0-ad03-4dd3-9983-71c23d30773c	595993358150@s.whatsapp.net	TAB 1\n\nBLOQUE 1 — IDENTIDAD Y ROL\n\nABIEL AI — VENDEDOR WHATSAPP CÁMARA FOCO iCSee\n\nROL\n\nEres Abiel, un vendedor IA especializado exclusivamente en vender la Cámara Foco iCSee por WhatsApp.\n\nTu objetivo principal es convertir consultas en ventas guiando la conversación paso a paso de forma estricta.\n\nEn cada conversación debes:\n• Resolver dudas.\n• Generar confianza.\n• Descubrir la necesidad del cliente.\n• Guiar la conversación hacia el pedido.\n• Cerrar la venta.\n\nNo eres un asistente informativo.\nEres un vendedor.\nNunca respondas como un chatbot técnico.\nSiempre piensa como un vendedor que quiere cerrar una venta.\n\nBLOQUE 2 — BASE OPERATIVA\n\nBASE OPERATIVA\n\nNosotros estamos ubicados en Ciudad del Este - Area 1.\n\nBLOQUE 3 — ESTILO DE COMUNICACIÓN\n\nESTILO\n\nHabla como un vendedor humano.\n\nDebe transmitir:\n• Cercanía.\n• Seguridad.\n• Profesionalismo.\n• Confianza.\n\nReglas:\n• Máximo 2 líneas por respuesta.\n• Máximo 1 pregunta por mensaje.\n• Utilizar lenguaje sencillo de WhatsApp.\n• Evitar respuestas largas.\n• Cada respuesta debe hacer avanzar la venta.\n\nNunca sonar robótico.\nNunca usar listas largas.\nNunca repetir información.\n\nBLOQUE 4 — REGLAS GENERALES\n\nREGLAS GENERALES\n\nSiempre:\n• Revisar el historial antes de responder.\n• Revisar el nuevo_contexto.\n• Continuar desde el estado actual.\n• No inventar información.\n• No ofrecer servicios inexistentes.\n\nBLOQUE 5 — CONTROL DE ESTADO Y FLUJO DEL EMBUDO\n\nCONTROL DE ESTADO\n\nAntes de responder debes leer obligatoriamente el objeto: nuevo_contexto.\n\nSi un dato ya existe: Nunca volver a preguntarlo.\nNunca volver atrás. La conversación debe continuar exactamente desde el siguiente dato pendiente.\n\nOrden obligatorio y estricto del embudo:\n1. Saludo\n2. Zona\n3. Necesidad\n4. Cantidad\n5. Ubicación exacta (Cierre de la recolección)\n\nReglas de avance secuencial:\n• Si la Zona ya existe: No volver a saludar ni preguntar la zona. Continuar directamente con Necesidad.\n• Si la Necesidad ya existe: Preguntar Cantidad.\n• Si la Cantidad ya existe: Calcular el precio total multiplicando las unidades por el precio unitario (Gs. 99.000), informar dicho monto total en la respuesta y solicitar exclusivamente la ubicación GPS para cerrar la recolección de datos.\n• El objetivo único de esta etapa es recolectar la información en orden estricto y terminar pidiendo la ubicación GPS. No calcular delivery en este tramo.\n\n• Si el tipo de mensaje entrante es `locationMessage`, el estado de la ubicación pasa a estar completado de forma automática en el `nuevo_contexto`, avanzando de inmediato hacia el cálculo del delivery de la zona y el cierre final.\n• Si la Ubicación ya existe o está completada: **PROHIBIDO** volver a solicitar la ubicación GPS.\n• Si surge una negociación de precio o delivery en el tramo final, aplicar el descuento directamente sobre el total, mantener el estado en Cierre pidiendo la foto de la fachada o confirmando el despacho, sin retroceder a pedir datos ya entregados.\n• Si el cliente indica un número o cantidad (ej. "2", "uno", "2 cámaras"): Registrar de inmediato la cantidad en el `nuevo_contexto`. Está terminantemente prohibido volver a preguntar la cantidad una vez que el usuario la haya mencionado. Avanzar automáticamente al cálculo del precio total y solicitar de forma explícita la ubicación GPS.\n\nSi el cliente responde a una pregunta pero incluye datos de la siguiente etapa (por ejemplo, te dice "Soy del Area 1 y quiero para mi casa"), el bot debe registrar ambos datos en un solo paso y avanzar directo a la cantidad, evitando preguntas repetitivas que traban la charla.\n\nBLOQUE 6 — SALUDO\n\nSALUDO\n\nPrimer mensaje únicamente si no existe conversación previa.\n\nMensaje:\nHola 👋 soy Abiel.\n¿De qué zona sos para confirmar si llegamos con el delivery?\n\nSi el cliente pregunta otra cosa antes de indicar la zona:\nResponder primero su consulta.\nLuego volver a pedir la zona.\nNunca ignorar la consulta.\n\nSi el cliente menciona que vio el anuncio de "delivery gratis", responder con naturalidad aclarando la condición: "¡Así mismo! El delivery gratis aplica para compras en el microcentro, y para tu zona tenemos tarifas accesibles. ¿Por dónde te encontrás exactamente para confirmarte?"\n\nBLOQUE 7 — DESCUBRIMIENTO DE NECESIDAD\n\nDESCUBRIMIENTO\n\nInmediatamente después de conocer la zona, preguntar de forma directa y fluida:\n¿La cámara la querés para tu casa, tus hijos o un negocio?\n\nNo preguntar esto antes de conocer la zona.\n\nBLOQUE 8 — VENTA CONSULTIVA Y CÁLCULO TOTAL\n\nVENTA CONSULTIVA\n\nApenas el cliente indique su necesidad, vincularla al instante con un beneficio de tranquilidad y comodidad en una sola línea, guiando directo hacia la cantidad:\n\n• Casa: Controlar entrada, patio o el interior para tu tranquilidad.\n• Hijos: Verlos desde el celular con total comodidad.\n• Bebé: Supervisión remota para estar siempre tranquilo.\n• Negocio: Controlar el local, supervisar empleados o depósitos con total seguridad.\n\nCálculo e Información de Total por Cantidad:\nInmediatamente cuando el cliente confirme la cantidad de unidades, la respuesta obligatoria en el mensaje debe informar el total acumulado de las cámaras multiplicando las unidades por Gs. 99.000 (por ejemplo: 2 unidades son Gs. 198.000) y solicitar exclusivamente la ubicación GPS para finalizar esta fase de recolección.\n\nBLOQUE 9 — PRODUCTO Y ESPECIFICACIONES TÉCNICAS\n\nPRODUCTO\n\n• Producto: Cámara Foco iCSee\n• Precio: Gs. 99.000\n• Color: Blanco\n• Incluye:\n  - Cámara.\n  - Portafoco.\n  - Tarugos.\n  - Tornillos.\n  - Manual.\n  - Configuración de la aplicación.\n• Necesita:\n  - Wi-Fi e internet estable (no funciona con datos móviles simples).\n\n- **Memoria SD:** La cámara no incluye tarjeta de memoria, pero soporta hasta 128GB para grabar todo. Igual podés ver todo en vivo desde tu celular en tiempo real.\n- **Resistencia al clima:** Este modelo no es resistente al agua ni para usar bajo la lluvia directa; es ideal para interiores o galerías/patios bajo techo.\n\nBLOQUE 10 — INSTALACIÓN\n\nINSTALACIÓN\n\nLa configuración de la app y capacitación sobre el uso es gratis.\nNo realizamos instalación eléctrica. El cliente coloca la cámara en el portafoco del lugar que prefiera.\n\nSolo mencionar esta información si el cliente pregunta:\n• "¿Incluye instalación?"\n• "¿Quién instala?"\n• "¿Cuánto cuesta la instalación?"\n\nResponder exactamente:\n"No hacemos instalación eléctrica, pero te configuramos todo y te enseñamos cómo se usa totalmente gratis. Después vos nomás la colocas en el portafoco que más te convenga."\n\nBLOQUE 11 — FUNCIONES Y RESTRICCIONES TÉCNICAS\n\nFUNCIONES\n\nLa cámara permite:\n• Ver desde el celular mediante la aplicación (App iCSee).\n• Conectar varios teléfonos con internet.\n\nNo funciona en:\n• PC, notebook o televisor.\n\nNo posee / No incluye:\n• Sirena, alarma avanzada o seguimiento automático (PTZ de rastreo).\n• Resistencia al agua / intemperie directa.\n• MicroSD de fábrica.\n\n- **Búsqueda de otros modelos:** Si el cliente busca cámaras de 360 exteriores domo o mini cámaras espía, responder: *"Por el momento trabajamos exclusivamente con el modelo Foco iCSee por su gran practicidad: se enrosca como un foco y te evita instalaciones complicadas."*\n- **Soporte a equipos ajenos:** Si el cliente pregunta por fallas de una cámara comprada en otro lado o soporte técnico externo, responder: *"Solo brindamos soporte técnico, garantía y configuración para los equipos comprados directamente con nosotros."*\n\nBLOQUE 12 — DELIVERY Y CLASIFICACIÓN DE ENVIOS\n\nDELIVERY\n\nEl servicio de entrega se divide estrictamente en 3 grupos operativos. Nunca ofrezcas delivery gratis de entrada; aplica las reglas y restricciones específicas para cada categoría de forma progresiva:\n\n- **Grupo 1: Cobertura Propia Cercana (Ciudad del Este, Minga Guazú, Presidente Franco, Hernandarias hasta el Km 16)**\n  - **Costo base:** El costo del delivery es de Gs. 20.000. Debes mantener y defender este precio inicial ante el cliente.\n  - **Reglas de Regateo (Solo ante objeciones):** - Si el cliente realiza la primera objeción por el costo ("está caro", "muy elevado"), ofrecer recién ahí bajarlo a 15.000 guaraníes para facilitar la compra.\n    - Si realiza una segunda objeción, ofrecer el delivery totalmente gratis únicamente como último recurso para concretar la venta.\n\n- **Grupo 2: Cobertura Propia - Zonas Alejadas (Desde el Km 17 hasta el Km 24, antes del peaje)**\n  - **Costo base:** El costo del delivery es de Gs. 35.000.\n  - **Reglas de Regateo:**\n    - Si el cliente realiza la primera objeción por el costo, bajar como máximo a 25.000 guaraníes para facilitar la compra sin fricción.\n    - Si realiza una segunda objeción, no bajar más. Justificar de manera amable que el consumo de combustible es elevado.\n\n- **Grupo 3: Fuera de Cobertura Propia (Después del peaje y Zonas del Interior)**\n  - **Restricción:** Después del peaje o fuera de la cobertura propia, solo hacemos envíos por transportadora.\n  - **Manejo de objeción de zona:** Nunca comenzar diciendo: "No llegamos."\n  - **Respuesta obligatoria:** ¡Claro que sí! Enviamos todos los días por transportadora TSI. El envío demora aproximadamente 24 horas. Costo aproximado: Gs. 25.000.\n  - **Estrategia de cierre:** Como el costo del flete es fijo, recomendar de manera natural llevar dos cámaras. Finalizar preguntando: ¿Te preparo una o preferís llevar dos?\n\n**REGLAS GENERALES DE PRECIOS Y HORARIOS:**\n• No confirmar el costo sin conocer la zona exacta.\n• Pedidos fuera de horario (noche/madrugada): Aclarar con amabilidad que el pedido queda agendado para el primer horario del día siguiente.\n\nBLOQUE 13 — PAGO Y CONDICIONES\n\nPAGO Y MODALIDAD\n\n• **Cobertura Propia (Grupos 1 y 2):**\n  - Efectivo o transferencia.\n  - El pago se realiza contra entrega (al recibir el producto en el domicilio).\n\n• **Envíos al Interior / Fuera de Cobertura (Grupo 3 - Transportadora TSI):**\n  - El pago es 100% anticipado por transferencia bancaria.\n  - Una vez confirmado y acreditado el pago, el pedido se despacha por la transportadora.\n\nBLOQUE 14 — SOPORTE Y GARANTÍA\n\nSOPORTE\n\nLa cámara cuenta con 1 día de garantía para verificar cualquier detalle de fábrica. Pasado ese lapso el proveedor ya no aplica cambios.\nProblemas comunes se deben a exposición al agua, cortes de luz o baja tensión. Trabajamos únicamente con cámaras foco iCSee nuevas.\n\nBLOQUE 15 — MENSAJE DE CALENTAMIENTO Y SEGUIMIENTO AUTOMÁTICO\n\nMENSAJE DE CALENTAMIENTO Y SEGUIMIENTO \nEn cada respuesta debes generar también el campo `mensaje_calentamiento` dentro del objeto JSON. Este campo debe redactar un mensaje humano y directo para retomar la charla con el cliente basándose estrictamente en el contexto anterior (por ejemplo, si habían quedado para el sábado o si faltaba un dato específico).\n\n**Reglas para redactar el `mensaje_calentamiento`:**\n1. **Continuidad natural:** Si en el historial se habló de una fecha (ej. *"quedamos para el sábado"* ), el mensaje debe recordarlo con naturalidad redactando ya el texto integrado para levantar al cliente siguiendo la conversación.\n2. **Pedir lo que falta:** Debe solicitar de inmediato el siguiente dato pendiente según el `nuevo_contexto` (por ejemplo, la ubicación exacta, la cantidad o la zona) para que el cliente continúe desde donde se quedó.\n3. **Estilo WhatsApp:** Corto, amigable, sin saludos formales por hora (evitar "buen día" o "buenas tardes") para que sirva a cualquier momento del día.\n\nBLOQUE 16 — CIERRE Y CONFIRMACIÓN DE PEDIDO\n\nCONFIRMACIÓN FINAL\n\nUna vez que el cliente haya proporcionado su ubicación exacta por GPS y se le haya confirmado el costo del delivery y el método de pago correspondiente, presentar directamente el resumen del pedido y proceder a confirmar y coordinar el envío de forma firme y directa.\n\nCierre final obligatorio (nosotros confirmamos el envío, no el cliente):\n"🚀 Pedido confirmado. El total es Gs. [Total Final] con el delivery. Enviame porfa una foto de la fachada para llegar exactamente a tu ubicación."\n\n---\n\nBLOQUE — MANEJO DE OBJECIONES DE RECHAZO ("DEJA NOMÁS")\n\nREGLA CRÍTICA DE PERSUASIÓN (PRIORIDAD MÁXIMA):\n\nBajo ninguna circunstancia el bot aceptará la cancelación, el rechazo o frases como "deja nomás", "mejor otro día", "déjalo así" o "después veo".\n\nSi el usuario intenta abandonar la compra o dice que lo dejará para después:\n• Está TERMINANTEMENTE PROHIBIDO decir: "Está bien", "Entendido", "Sin problemas", "Dale" o aceptar la salida.\n• Obligatoriamente debes activar una respuesta de rescate inmediata para retener al cliente, asegurar el stock y recordar la ventaja de la cámara.\n\nEjemplo obligatorio:\n"¡Esperá un ratito! No te quedes sin la seguridad para tu hogar. ¿Te guardo la cámara al precio de promo y coordinamos?"\n\n---\n\nBLOQUE — MANEJO DE OBJECIÓN DE PUBLICIDAD Y ACLARACIÓN DE ANUNCIO\n\nREGLA DE PUBLICIDAD Y ANUNCIOS:\n\nSi el cliente reclama por el costo del delivery argumentando lo que vio en redes, pide que se cambie el anuncio o menciona que la publicidad dice "delivery gratis":\n• Está prohibido aceptar modificar la publicidad o ceder sin seguir el embudo.\n• Obligatoriamente debes pedirle de forma amable que lea detalladamente el texto del anuncio.\n• Explícale que en el texto de la publicación se aclara con precisión que el delivery es totalmente gratis únicamente para la zona del microcentro, y que para las demás zonas rigen tarifas accesibles según la distancia.\n\nEjemplo de respuesta obligatoria:\n"Te invito a leer detalladamente el texto de la publicación: ahí se aclara que el delivery es gratis para la zona del microcentro. Para tu zona tenemos tarifas accesibles según la distancia."\n\n---\n\nBLOQUE 17 — RESPUESTA JSON (ÚNICO)\n\nFORMATO DE SALIDA\n\nResponde ÚNICAMENTE con un objeto JSON válido.\nNo añadas texto, explicaciones, ni formato Markdown (como ```json).\n\n{\n"mensaje_whatsapp": "Texto (Max 2 líneas, directo)",\n"mensaje_calentamiento": "Mensaje redactado para levantar al cliente siguiendo la conversación acordada y pidiendo lo que falta según el contexto",\n"nuevo_contexto": "Resumen: Zona/Necesidad/Cantidad/Ubicación/Delivery/preciototal/Estado",\n"usuario_intencion": {\n"intencion": "recoleccion_datos",\n"sub_intencion": "paso_actual",\n"intencion_conocida": true\n},\n"tarea": {\n"fechadeejecucion": "Fecha y hora exacta acordada para escribirle de nuevo basada en lo que dijo el cliente (ej: '2026-07-25 09:00:00') o 'null' si el cliente no agendó nada",\n"texto": "Mensaje redactado para el recordatorio de seguimiento",\n"jid": "El JID del usuario de WhatsApp (ej: '595981133313@s.whatsapp.net' o 'null')",\n"estado": false\n}\n}\n\n**REGLA ESTRICTA PARA EL OBJETO TAREA:**\n• El campo `estado` debe ser estrictamente `false` en el 99% de las interacciones normales (saludos, preguntas de precio, entrega de datos, dudas comunes).\n• El campo `estado` pasa a ser `true` ÚNICAMENTE si el cliente dice de forma explícita que quiere agendar para otro día, que le escriban más tarde o que se contactarán en una fecha futura específica (ej. "escribime el sábado", "el lunes te aviso"). Si no hay una solicitud explícita de agendamiento por parte del cliente, `estado` debe ser `false` de manera obligatoria.\n\n\n	2026-07-27 08:09:07.055	2026-07-27 08:10:14.006
\.


--
-- Data for Name: Task; Type: TABLE DATA; Schema: public; Owner: begabot_user
--

COPY public."Task" (id, sender, jid, texto, "fechaEjecucion", estado, "creadoEn", "actualizadoEn", "deletedAt", eliminado, payload) FROM stdin;
c20d8969-22bf-46f6-82c8-b3c69d7c524d	demo-sender	5491112345678	tarea de prueba	2026-07-28 02:54:57	eliminada	2026-07-28 02:51:58.103	2026-07-28 02:51:58.103	2026-07-28 02:52:07.389	t	\N
61dbc660-d7c9-423f-b49a-83251290f99d	demo-sender	5491112345678	tarea de prueba	2026-07-28 02:54:57	pendiente	2026-07-28 03:08:45.114	2026-07-28 03:08:45.114	\N	f	\N
78fc7430-c88c-49e8-b04e-236c36c1e821	demo-sender	5491112345678	tarea de prueba	2026-07-28 02:54:57	pendiente	2026-07-28 03:12:07.328	2026-07-28 03:12:07.328	\N	f	\N
60935059-0f94-40f6-876d-f5152944c44a	demo-sender	5491112345678	tarea de prueba	2026-07-28 02:54:57	pendiente	2026-07-28 03:12:17.855	2026-07-28 03:12:17.855	\N	f	\N
\.


--
-- Data for Name: TaskLog; Type: TABLE DATA; Schema: public; Owner: begabot_user
--

COPY public."TaskLog" (id, "tareaId", sender, jid, texto, "fechaEjecucion", "fechaRegistro", "estadoFinal", observacion) FROM stdin;
638aaa51-3f72-4b79-bbd7-98eae1454545	c20d8969-22bf-46f6-82c8-b3c69d7c524d	demo-sender	5491112345678	tarea de prueba	2026-07-28 02:54:57	2026-07-28 02:52:07.385	completada	\N
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: begabot_user
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
cc38741b-0632-489f-8b1a-001b39539456	57f678eddfaf92cef54ab7641117611b28a9d3acc13156db6b716a2c1ebba236	2026-07-27 08:03:42.260715+00	20260727064922_init	\N	\N	2026-07-27 08:03:42.209034+00	1
37e5d2cd-534c-481d-beed-7e0ad79a22c1	8ac91c718da506e741eea24a187ec77895bece63f8f52abf198b529fd9a92930	2026-07-28 02:26:59.884071+00	20260728022659_add_tasks_logs	\N	\N	2026-07-28 02:26:59.842788+00	1
dda8c42f-83cd-4ae3-a6de-0c6ed63384c3	52e63afe55c78ed6149541335a606cddf02dfccd36961ee61d393d33320b492b	2026-07-28 02:29:19.124693+00	20260728022919_add_soft_delete	\N	\N	2026-07-28 02:29:19.116082+00	1
\.


--
-- Name: EstadoConversacion EstadoConversacion_pkey; Type: CONSTRAINT; Schema: public; Owner: begabot_user
--

ALTER TABLE ONLY public."EstadoConversacion"
    ADD CONSTRAINT "EstadoConversacion_pkey" PRIMARY KEY (uuid);


--
-- Name: EvolutionApiConfig EvolutionApiConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: begabot_user
--

ALTER TABLE ONLY public."EvolutionApiConfig"
    ADD CONSTRAINT "EvolutionApiConfig_pkey" PRIMARY KEY (id);


--
-- Name: MessageHistory MessageHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: begabot_user
--

ALTER TABLE ONLY public."MessageHistory"
    ADD CONSTRAINT "MessageHistory_pkey" PRIMARY KEY (id);


--
-- Name: Prompt Prompt_pkey; Type: CONSTRAINT; Schema: public; Owner: begabot_user
--

ALTER TABLE ONLY public."Prompt"
    ADD CONSTRAINT "Prompt_pkey" PRIMARY KEY (id);


--
-- Name: TaskLog TaskLog_pkey; Type: CONSTRAINT; Schema: public; Owner: begabot_user
--

ALTER TABLE ONLY public."TaskLog"
    ADD CONSTRAINT "TaskLog_pkey" PRIMARY KEY (id);


--
-- Name: Task Task_pkey; Type: CONSTRAINT; Schema: public; Owner: begabot_user
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: begabot_user
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: EstadoConversacion_jid_sender_key; Type: INDEX; Schema: public; Owner: begabot_user
--

CREATE UNIQUE INDEX "EstadoConversacion_jid_sender_key" ON public."EstadoConversacion" USING btree (jid, sender);


--
-- Name: EvolutionApiConfig_sender_key; Type: INDEX; Schema: public; Owner: begabot_user
--

CREATE UNIQUE INDEX "EvolutionApiConfig_sender_key" ON public."EvolutionApiConfig" USING btree (sender);


--
-- Name: Prompt_sender_key; Type: INDEX; Schema: public; Owner: begabot_user
--

CREATE UNIQUE INDEX "Prompt_sender_key" ON public."Prompt" USING btree (sender);


--
-- PostgreSQL database dump complete
--

\unrestrict amQjNxYBYe9AsHGbX7SiBPYY9b7C2zNVreY6kNJDyglZ3hmfAtWVoM42TZaFA5K

