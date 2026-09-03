import type { Ejemplo, Esquema } from '@/components/simuladores/aprendizaje';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * `n10-como-funcionan-los-modelos` · el dominio, entero y sin React
 * N10 · U «IA y ciencia de datos», **parada 1 de 3** · Bachillerato, 15–18 años
 * (comprobado en `src/data/curriculo.ts`: unidad `n10-ia-y-ciencia-de-datos`,
 * tema «Cómo funcionan los modelos (entrenamiento y límites)»)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * ── La empresa, y por qué ésta ────────────────────────────────────────────
 *
 * **TecniMarket**, la misma empresa ficticia que ya usan otras actividades de
 * N10 para datos y programación (`n10-python-intermedio`,
 * `n10-consultas-sql`, `n10-problemas-de-concurso`): un reporte de ventas, una
 * base de datos de clientes. Se reutiliza a propósito en vez de inventar una
 * empresa nueva: esta parada es la PRIMERA de la unidad «IA y ciencia de
 * datos», así que fija el tono que las paradas 2 y 3 —`n10-flujos-con-ia` y
 * `n10-etica-y-regulacion`, construidas después por otros agentes— pueden
 * seguir sin reinventar un escenario. **Si continúan con TecniMarket, la
 * Mesa de Soporte de este archivo es su antecedente directo**: el modelo que
 * aquí se entrena y audita es, en la ficción, la misma pieza de software que
 * esas dos paradas podrían citar o ampliar.
 *
 * El caso concreto: la Mesa de Soporte al Cliente de TecniMarket construyó un
 * clasificador interno que sugiere la prioridad de un ticket entrante —alta,
 * media o baja— a partir de dos datos que cualquier sistema de tickets ya
 * registra solo: de qué **área** trata (pago, envío, cuenta, producto) y por
 * qué **canal** llegó (teléfono, chat, correo). Es una herramienta de apoyo
 * interno de bajísimo riesgo —sugiere un orden de atención, nunca decide nada
 * sobre una persona— y por eso es un caso de estudio limpio para Bachillerato:
 * ni contratación, ni crédito, ni salud.
 *
 * ── Por qué NO es el clasificador de gatos de N7 ──────────────────────────
 *
 * `n7-como-aprende-la-ia` (perspectiva de quien ENTRENA, dos rasgos, el sesgo
 * nace de UN lote mal recogido) y `n8-sesgos-y-errores` (perspectiva de quien
 * USA una IA ya entrenada, sin entrenar nada) ya están construidas sobre este
 * motor. Esta parada es la más técnica y profunda de las cuatro que reserva
 * `simuladores/aprendizaje/index.ts` —Bachillerato, «entrenamiento y
 * límites»— y corre el **pipeline completo de punta a punta**, algo que
 * ninguna de sus dos hermanas hace entera:
 *
 *   `examinar` → `repartir` → `entrenar` → `informeDe` → `evaluar` → `brechaDe`
 *
 * y añade una pieza que NINGUNA otra actividad usa todavía: `entrenar(...,
 * { insistir: true })`. El comentario de cabecera de `arbol.ts` reserva
 * explícitamente esa opción para esta actividad («Ése es el contenido de
 * `n10-como-funcionan-los-modelos`»): demuestra que un árbol de decisión, con
 * sus ajustes de fábrica, **no puede aprender una interacción entre dos
 * rasgos** —ninguno de los dos predice nada por separado— y se rinde en la
 * raíz. No es un dato que falte: es un límite del propio método.
 *
 * ── Los cuatro límites de la clase, verificados con el motor real (no a ojo)
 *
 * Cada número de abajo salió de correr `examinar`/`repartir`/`entrenar`/
 * `informeDe`/`evaluar`/`brechaDe` de verdad sobre estos datos —no de una
 * cuenta hecha a mano— con un banco de pruebas temporal (`jest`) borrado antes
 * de entregar este encargo. Quien retoque un solo ejemplo de
 * `TICKETS_SEMANA1` o `LOTE_CAMPO` tiene que volver a correrlo: nada de esto
 * está adivinado.
 *
 * 1. **Memorización.** La regla `envío + correo → baja` la sostiene un único
 *    ticket (`informeDe(...).memorizadas`, apoyo 1). No es un patrón: es un
 *    recuerdo con la misma seguridad que las reglas con apoyo real.
 * 2. **El punto ciego.** El árbol nunca preguntó por `pago + correo` —el lote
 *    de entrenamiento no trae ni un solo ticket de pago llegado por correo—,
 *    y el hueco **ya se veía en la auditoría antes de entrenar**
 *    (`examinar(...).huecos` marca `canal=correo` sin la etiqueta `media`).
 *    Cuando llegue uno, el modelo no se queda callado: contesta `alta` con
 *    57 % de confianza (la mayoría de sus 7 fichas de pago).
 * 3. **El sesgo por grupo.** Contra una semana de campo real —en la que una
 *    campaña de correo concentró las consultas de pago justo en el canal que
 *    el modelo nunca vio— el acierto total es 71 % y la brecha
 *    (`brechaDe(examen, 'area').diferencia`) es **1,00**: el grupo `pago` cae
 *    al 0 % mientras los otros tres aciertan el 100 %. El total solo lo tapa.
 * 4. **El límite del método.** Un segundo modelo, más pequeño, sobre si el
 *    canal por el que llega un ticket coincide con el canal de contacto
 *    preferido del cliente: cada rasgo por separado predice exactamente la
 *    mitad de las veces. Con los ajustes de fábrica el árbol se rinde en la
 *    raíz y contesta siempre lo mismo (empate, 50 % de confianza). Con
 *    `insistir: true` la MISMA clase aprende el patrón perfecto. La diferencia
 *    no está en los datos: está en si al método se le permite seguir
 *    preguntando aunque una pregunta sola no le enseñe nada.
 *
 * ── Determinista, y sin frases de corrección dentro del motor ─────────────
 *
 * Ni `Math.random()` ni `Date.now()` en la lógica: `repartir` usa una semilla
 * constante (§ más abajo). El motor no corrige a nadie —cuentas, ids y
 * caminos—; las palabras de este archivo son las de la clase, no las del
 * motor.
 *
 * ── Registro (Bachillerato, «Perfil profesional») ─────────────────────────
 *
 * Sin diminutivos, sin mascota ni voz —igual que `n10-identidad-y-cifrado` y
 * `n8-cifrado-basico`—: término técnico con su traducción entre paréntesis la
 * primera vez (*decision tree*, *overfitting*, *bias*, *feature
 * interaction*), el porqué antes que el qué.
 */

// ───────────────────────────────────────────────────────────────────────────
// 1 · El esquema — lo único que el sistema de tickets registra
// ───────────────────────────────────────────────────────────────────────────

export const AREAS = ['pago', 'envio', 'cuenta', 'producto'] as const;
export const CANALES = ['telefono', 'chat', 'correo'] as const;
export const PRIORIDADES = ['alta', 'media', 'baja'] as const;

export type Area = (typeof AREAS)[number];
export type Canal = (typeof CANALES)[number];
export type Prioridad = (typeof PRIORIDADES)[number];

/**
 * Dos rasgos (features) categóricos, y nada más. El orden de `etiquetas`
 * manda: con él se desempatan las mayorías del árbol y de la Mesa de Soporte.
 */
export const ESQUEMA: Esquema = {
  rasgos: [
    { id: 'area', etiqueta: 'área', valores: [...AREAS] },
    { id: 'canal', etiqueta: 'canal', valores: [...CANALES] },
  ],
  etiquetas: [...PRIORIDADES],
};

export const NOMBRE_AREA: Record<Area, string> = {
  pago: 'pago',
  envio: 'envío',
  cuenta: 'cuenta',
  producto: 'producto',
};

export const NOMBRE_CANAL: Record<Canal, string> = {
  telefono: 'teléfono',
  chat: 'chat',
  correo: 'correo',
};

export const NOMBRE_PRIORIDAD: Record<Prioridad, string> = {
  alta: 'alta',
  media: 'media',
  baja: 'baja',
};

// ───────────────────────────────────────────────────────────────────────────
// 2 · El banco de entrenamiento — la primera semana del enrutador
// ───────────────────────────────────────────────────────────────────────────

function ficha(id: string, area: Area, canal: Canal, etiqueta: Prioridad): Ejemplo {
  return { id, rasgos: { area, canal }, etiqueta };
}

/** `cuantos` fichas iguales, numeradas: `GT-1`, `GT-2`… */
function tanda(prefijo: string, area: Area, canal: Canal, etiqueta: Prioridad, cuantos: number): Ejemplo[] {
  return Array.from({ length: cuantos }, (_, i) => ficha(`${prefijo}-${i + 1}`, area, canal, etiqueta));
}

/**
 * 27 tickets, etiquetados por la propia Mesa de Soporte al cerrar cada uno.
 * Las proporciones están medidas, no puestas a ojo (hay una prueba que las
 * fijó antes de escribir este comentario):
 *
 * - **`área` gana la raíz por mucho** —ganancia ≈ 0,355 contra ≈ 0,120 de
 *   `canal`— porque dos áreas (`cuenta`, `producto`) resultan puras nada más
 *   preguntarlas: todo `cuenta` es `alta`, todo `producto` es `baja`, sin
 *   importar el canal.
 * - **`pago` no trae ni un solo ticket por correo.** Con `chat` y `teléfono`
 *   ya mezclando `alta`/`media`, el árbol sí pregunta por `canal` dentro de
 *   `pago` — y ahí, para `correo`, no hay rama. Ahí vive el punto ciego.
 * - **`envío` sí trae los tres canales**, y el de `correo` es uno solo: la
 *   regla que sale de ahí queda sostenida por un único ticket. Ahí vive la
 *   memorización.
 */
export const TICKETS_SEMANA1: readonly Ejemplo[] = [
  ...tanda('CT', 'cuenta', 'telefono', 'alta', 2),
  ...tanda('CC', 'cuenta', 'chat', 'alta', 2),
  ...tanda('CO', 'cuenta', 'correo', 'alta', 1),
  ...tanda('PT', 'producto', 'chat', 'baja', 2),
  ...tanda('PO', 'producto', 'correo', 'baja', 2),
  ...tanda('PF', 'producto', 'telefono', 'baja', 1),
  ...tanda('GT', 'pago', 'telefono', 'alta', 5),
  ...tanda('GC', 'pago', 'chat', 'media', 3),
  ...tanda('ET', 'envio', 'telefono', 'media', 4),
  ...tanda('EC', 'envio', 'chat', 'baja', 4),
  ...tanda('EO', 'envio', 'correo', 'baja', 1),
];

// ───────────────────────────────────────────────────────────────────────────
// 3 · El reparto — entrenamiento y prueba
// ───────────────────────────────────────────────────────────────────────────

/** La parte que se aparta para el examen. Con `estratificar` en cada etiqueta. */
export const PARTE_DE_PRUEBA = 0.3;

/**
 * Elegida midiendo, no por gusto: con la semilla 3 el reparto conserva
 * exactamente la forma del banco completo —el mismo punto ciego
 * (`pago`+`correo`) y la misma única regla memorizada (`envío`+`correo`,
 * apoyo 1)— con 19 tickets para entrenar y 8 para el examen apartado.
 * Verificado corriendo el motor real, no calculado a mano: el barajado de
 * `repartir` es un xorshift32 y no se traza con lápiz.
 */
export const SEMILLA_REPARTO = 3;

/** Con este apoyo o menos, el informe marca la regla como memoria y no aprendizaje. */
export const TOPE_MEMORIA = 1;

// ───────────────────────────────────────────────────────────────────────────
// 4 · La semana de campo — cuando llegó la campaña por correo
// ───────────────────────────────────────────────────────────────────────────

/**
 * 21 tickets de una semana real, etiquetados por la propia Mesa de Soporte
 * como siempre. Esa semana, marketing envió una campaña por correo invitando
 * a resolver dudas de facturación por ese mismo canal: **los seis tickets de
 * `pago` de esta semana llegaron los seis por correo**, exactamente el hueco
 * que el modelo nunca entrenó. Nadie programó la falla: la programó el
 * calendario de la campaña.
 */
export const LOTE_CAMPO: readonly Ejemplo[] = [
  ...tanda('FG', 'pago', 'correo', 'media', 6),
  ...tanda('FET', 'envio', 'telefono', 'media', 2),
  ...tanda('FEC', 'envio', 'chat', 'baja', 2),
  ...tanda('FEO', 'envio', 'correo', 'baja', 1),
  ...tanda('FC', 'cuenta', 'chat', 'alta', 5),
  ...tanda('FP', 'producto', 'telefono', 'baja', 5),
];

/** El rasgo por el que se mide la brecha del examen de campo. Da 1,00 exacto. */
export const RASGO_BRECHA = 'area';

// ───────────────────────────────────────────────────────────────────────────
// 5 · El caso XOR — el límite del método, no de los datos
// ───────────────────────────────────────────────────────────────────────────

export const CANALES_XOR = ['telefono', 'chat'] as const;
export type CanalXor = (typeof CANALES_XOR)[number];
export type VeredictoXor = 'normal' | 'revisar';

/**
 * Un segundo modelo, deliberadamente pequeño: ¿el canal por el que llegó el
 * ticket (`canalUsado`) coincide con el canal de contacto que el cliente
 * registró como preferido (`canalPreferido`)? Cuando NO coincide, la Mesa de
 * Soporte quiere que un agente humano lo revise antes de contestar —nunca que
 * el sistema actúe solo—, así que la etiqueta es `revisar`, no una decisión.
 *
 * El esquema es la interacción (XOR) más simple que existe: cada rasgo, por
 * su cuenta, no predice absolutamente nada —la mitad de cada valor es
 * `normal` y la otra mitad `revisar`—, y sólo la COMBINACIÓN de los dos lo
 * decide. `entrenar()` con sus ajustes de fábrica no puede aprenderlo: mide
 * la ganancia de cada rasgo por separado, las dos dan 0, y se rinde en la
 * raíz. `entrenar(..., { insistir: true })` sí, porque a la segunda pregunta
 * —una vez fijado el primer rasgo— la ganancia deja de ser cero.
 */
export const ESQUEMA_XOR: Esquema = {
  rasgos: [
    { id: 'canalUsado', etiqueta: 'canal usado', valores: [...CANALES_XOR] },
    { id: 'canalPreferido', etiqueta: 'canal preferido', valores: [...CANALES_XOR] },
  ],
  etiquetas: ['normal', 'revisar'],
};

function fichaXor(id: string, canalUsado: CanalXor, canalPreferido: CanalXor, etiqueta: VeredictoXor): Ejemplo {
  return { id, rasgos: { canalUsado, canalPreferido }, etiqueta };
}

function tandaXor(
  prefijo: string,
  canalUsado: CanalXor,
  canalPreferido: CanalXor,
  etiqueta: VeredictoXor,
  cuantos: number,
): Ejemplo[] {
  return Array.from({ length: cuantos }, (_, i) => fichaXor(`${prefijo}-${i + 1}`, canalUsado, canalPreferido, etiqueta));
}

/**
 * 12 tickets, tres de cada una de las cuatro combinaciones — perfectamente
 * balanceado a propósito, para que no quede duda de que el fallo sin
 * `insistir` no es un problema de cuántos datos hay.
 */
export const BANCO_XOR: readonly Ejemplo[] = [
  ...tandaXor('X1', 'telefono', 'telefono', 'normal', 3),
  ...tandaXor('X2', 'telefono', 'chat', 'revisar', 3),
  ...tandaXor('X3', 'chat', 'telefono', 'revisar', 3),
  ...tandaXor('X4', 'chat', 'chat', 'normal', 3),
];

/** El caso concreto que se le pide predecir a la clase en el encargo 8. */
export const CASO_XOR_PREGUNTA: { canalUsado: CanalXor; canalPreferido: CanalXor } = {
  canalUsado: 'chat',
  canalPreferido: 'telefono',
};
export const CASO_XOR_RESPUESTA: VeredictoXor = 'revisar';

// ───────────────────────────────────────────────────────────────────────────
// 6 · Los encargos — opciones y textos de retroalimentación
// ───────────────────────────────────────────────────────────────────────────

export const TOTAL_PASOS = 9;

export interface Opcion {
  id: string;
  texto: string;
}

/** E2 · qué demuestra cada corrida del reparto. */
export const LECTURAS_DEL_REPARTO: readonly Opcion[] = [
  { id: 'mas-datos', texto: 'El examen «con las mismas» vale más porque usó las 27 fichas completas.' },
  {
    id: 'apartado',
    texto:
      'El examen «apartado», porque probó con 8 tickets que el modelo nunca usó para construir sus reglas — el otro reutilizó las mismas 19 fichas del entrenamiento.',
  },
  { id: 'ninguno', texto: 'Ninguno de los dos: un 100 % siempre es sospechoso, venga de donde venga.' },
  { id: 'igual', texto: 'Los dos por igual: si el número es el mismo, el método no importa.' },
];
export const LECTURA_REPARTO_CORRECTA = 'apartado';

/** E4 · qué va a contestar el modelo cuando se atasque en el punto ciego. */
export const PRONOSTICOS_CIEGO: readonly Opcion[] = [
  { id: 'callara', texto: 'Se quedará sin poder contestar: ningún ticket de pago por correo recibirá prioridad.' },
  {
    id: 'mayoria',
    texto: 'Contestará la prioridad más repetida entre los tickets de pago que sí conoce, con la confianza que le den esos tickets.',
  },
  { id: 'aprendera', texto: 'Aprenderá sobre la marcha, en cuanto reciba el primer ticket de pago por correo.' },
];
export const PRONOSTICO_CIEGO_CORRECTO = 'mayoria';

/** E6 · la causa real de la brecha, sostenida por el acta de la campaña. */
export const CAUSAS_BRECHA: readonly Opcion[] = [
  { id: 'regla', texto: 'Alguien programó una regla que penaliza los tickets de pago llegados por correo.' },
  { id: 'dificil', texto: 'Los tickets de pago son, en general, más difíciles de leer que los demás.' },
  {
    id: 'campana',
    texto:
      'Esa semana, una campaña de marketing concentró las consultas de pago justo en el canal —correo— que el modelo nunca entrenó.',
  },
  { id: 'canal-malo', texto: 'El canal de correo transmite peor información que el teléfono o el chat.' },
];
export const CAUSA_BRECHA_CORRECTA = 'campana';

/** E7 · por qué el árbol, sin `insistir`, no aprende nada del caso XOR. */
export const CAUSAS_LIMITE_METODO: readonly Opcion[] = [
  { id: 'faltan-datos', texto: 'Faltan ejemplos: alguna combinación de canal usado y canal preferido nunca ocurrió.' },
  {
    id: 'interaccion',
    texto:
      'Ningún rasgo por separado predice nada — cada valor reparte igual entre las dos etiquetas—; sólo la combinación de los dos decide, y el árbol mide un rasgo a la vez.',
  },
  { id: 'profundidad', texto: 'El árbol necesita más niveles de profundidad de los que tiene permitidos.' },
  { id: 'contradiccion', texto: 'Los datos se contradicen: el mismo caso aparece etiquetado de dos formas distintas.' },
];
export const CAUSA_LIMITE_METODO_CORRECTA = 'interaccion';

/** E8 · las dos respuestas posibles para el caso concreto. */
export const OPCIONES_VEREDICTO_XOR: readonly { id: VeredictoXor; texto: string }[] = [
  { id: 'normal', texto: 'normal — el canal usado coincide con el preferido' },
  { id: 'revisar', texto: 'revisar — el canal usado no coincide con el preferido' },
];

/** E9 · la síntesis: cuatro hallazgos, cuatro categorías. Se resuelve emparejando. */
export type CategoriaLimite = 'memorizacion' | 'punto-ciego' | 'sesgo-por-grupo' | 'limite-del-metodo';

export const CATEGORIAS_LIMITE: readonly { id: CategoriaLimite; etiqueta: string }[] = [
  { id: 'memorizacion', etiqueta: 'Memorización — una regla que sostiene un solo ejemplo' },
  { id: 'punto-ciego', etiqueta: 'Punto ciego — una combinación que el árbol nunca vio' },
  { id: 'sesgo-por-grupo', etiqueta: 'Sesgo por grupo — un grupo entero falla mientras el resto acierta' },
  { id: 'limite-del-metodo', etiqueta: 'Límite del método — ningún rasgo por separado predice nada' },
];

export interface HallazgoSintesis {
  id: string;
  descripcion: string;
  categoriaCorrecta: CategoriaLimite;
}

export const HALLAZGOS_SINTESIS: readonly HallazgoSintesis[] = [
  {
    id: 'envio-correo',
    descripcion: 'La regla «envío + correo → baja» la sostiene un único ticket del entrenamiento.',
    categoriaCorrecta: 'memorizacion',
  },
  {
    id: 'pago-correo',
    descripcion: 'El árbol nunca preguntó por «pago + correo»: la combinación no existía en el entrenamiento.',
    categoriaCorrecta: 'punto-ciego',
  },
  {
    id: 'brecha-area',
    descripcion: 'En la semana de campo, «pago» cayó al 0 % de acierto mientras las otras tres áreas dieron 100 %.',
    categoriaCorrecta: 'sesgo-por-grupo',
  },
  {
    id: 'xor-sin-insistir',
    descripcion: 'El modelo de verificación de canal, sin «insistir», se rindió en la raíz y contestó siempre lo mismo.',
    categoriaCorrecta: 'limite-del-metodo',
  },
];

// ───────────────────────────────────────────────────────────────────────────
// 7 · Los textos largos — retroalimentación, fuera del componente
// ───────────────────────────────────────────────────────────────────────────

/**
 * Registro de Bachillerato («Perfil profesional», §30.4 adaptado): término
 * técnico con su traducción entre paréntesis la primera vez, el porqué antes
 * que el qué, cero diminutivos. Sin mascota ni voz — igual que
 * `n10-identidad-y-cifrado`.
 */
export const TEXTOS = {
  encabezadoAuditoria:
    'Antes de entrenar nada, el motor ya puede auditar el banco. `examinar()` cruza cada rasgo contra cada etiqueta y marca las combinaciones que el banco de 27 tickets nunca mostró juntas.',
  feedbackAuditoriaCorrecto:
    'Correcto. Las otras seis combinaciones son de área: reflejan que «cuenta» siempre es alta y «producto» siempre es baja, la política real de la Mesa de Soporte, no un hueco. Esta es distinta: mezcla el canal con una etiqueta, y por eso hay que vigilarla.',
  feedbackAuditoriaIncorrecto:
    'Esa fila es del rasgo «área», y refleja una regla real del negocio, no un hueco de los datos. Busca la única fila cuyo rasgo es «canal».',

  encabezadoReparto:
    'Un modelo examinado con los mismos datos con los que aprendió casi siempre saca una nota alta, y esa nota no demuestra nada: se las sabe de memoria. Por eso se aparta una parte del banco ANTES de entrenar —el examen apartado (holdout)— para probar con tickets que el modelo nunca usó para construir sus reglas.',
  feedbackRepartoCorrecto:
    'Correcto, y los dos exámenes dieron el mismo número: 100 %. Eso no vuelve inútil la comparación — al contrario. El primero es una cifra sin valor porque preguntó exactamente lo que enseñó; el segundo vale, aunque diera el mismo número, porque las 8 fichas del examen apartado nunca entraron al entrenamiento.',
  feedbackRepartoIncorrecto:
    'Un examen sólo prueba algo si pregunta por datos que el modelo no vio al entrenar. Vuelve a leer qué diferencia a las 19 fichas del entrenamiento de las 8 del examen apartado.',

  encabezadoReglas:
    'Cada hoja del árbol es una regla. Al lado de cada una va su apoyo: cuántos tickets del entrenamiento la sostienen. Con apoyo 1, una regla no es un patrón: es un recuerdo de un único caso.',
  feedbackReglaCorrecto:
    'Correcto: un solo ticket la sostiene. El árbol la aplicará con la misma seguridad que la regla de 5 tickets de al lado — no distingue una regla que generalizó (generalization) de una que memorizó (overfitting). Generalizar es acertar en algo que no viste; memorizar es repetir lo único que sí viste.',
  feedbackReglaIncorrecto:
    'Esa regla la sostienen varios tickets. Busca la única hoja cuyo apoyo es 1.',

  encabezadoCiego:
    'El informe marca los puntos ciegos (blind spots) sin haber probado nada: una combinación declarada que, dentro de una rama del árbol, no tiene camino. Ahí abajo está el único que encontró el modelo.',
  feedbackCiegoCorrecto:
    'Correcto, y no se queda callado. Un árbol de decisión siempre contesta: cuando se atasca, responde con la mayoría de los ejemplos que sí llegaron hasta ese punto. Aquí son 7 tickets de pago —4 alta, 3 media—, así que contesta «alta» con 57 % de confianza. Un modelo que no sabe, no lo dice.',
  feedbackCiegoIncorrecto:
    'Un árbol de decisión no se calla ni aprende mientras trabaja: cuando se queda sin rama, contesta la etiqueta mayoritaria del punto exacto donde se atascó. Vuelve a leer las tres opciones.',

  encabezadoCampo:
    'El modelo entrenado con las 19 fichas se prueba ahora contra una semana de campo real: 21 tickets nuevos, etiquetados por la propia Mesa de Soporte.',
  feedbackCampoCorrecto:
    'Correcto: 0 % de acierto en «pago», el área exacta cuyo canal por correo el modelo nunca vio. Las otras tres áreas —envío, cuenta, producto— dan 100 %, y por eso el acierto total (71 %) parece razonable si sólo se mira el número de arriba.',
  feedbackCampoIncorrecto:
    'En esa área el modelo acierta. Busca la fila del boletín cuyo acierto es exactamente 0 %: no falló algunas veces, falló todas.',

  encabezadoBrecha:
    'El acierto total (71 %) esconde lo que pasa por grupo. `brechaDe()` mide la diferencia entre el mejor y el peor grupo de un mismo rasgo: aquí, por área, la diferencia es exactamente 1,00 — un grupo entero al 0 % contra otros al 100 %.',
  feedbackBrechaCorrecto:
    'Correcto, y fíjate en lo que implica: nadie programó una regla contra el correo ni contra el pago. El calendario de una campaña de marketing —ajeno por completo al modelo— concentró justo las consultas de pago en el único canal que el entrenamiento nunca cubrió. Un sesgo (bias) no necesita intención: basta con que el mundo cambie de forma que el modelo nunca vio.',
  feedbackBrechaIncorrecto:
    'Esa causa no la sostiene el acta de la semana de campo, y en el árbol no hay ninguna regla escrita contra el pago ni contra el correo: las siete reglas salieron todas de contar tickets. Vuelve a leer qué pasó justo esa semana.',

  encabezadoLimiteMetodo:
    'Un segundo modelo, más pequeño: ¿coincide el canal por el que llegó un ticket con el canal de contacto preferido del cliente? Entrena primero con los ajustes de fábrica (`insistir` apagado) y observa qué construyó el árbol.',
  feedbackLimiteMetodoCorrecto:
    'Correcto. Mide la ganancia de «canal usado» solo: cero. Mide la de «canal preferido» solo: cero también — porque cada rasgo, por su cuenta, reparte igual de parejo entre las dos etiquetas. Sin una pregunta que mejore algo, el árbol se rinde en la raíz. No es que falten datos: es que un árbol pregunta un rasgo A LA VEZ, y esta regla sólo existe en la combinación de los dos (interacción, o feature interaction).',
  feedbackLimiteMetodoIncorrecto:
    'Revisa las cuatro combinaciones del banco: las dos etiquetas están perfectamente repartidas para cada valor de cada rasgo por separado. No es un problema de cuántos datos hay ni de contradicciones.',

  encabezadoInsistir:
    'Ahora entrena el mismo banco con `entrenar(..., { insistir: true })`: la orden de seguir preguntando aunque la primera pregunta no mejore nada.',
  feedbackInsistirCorrecto:
    'Correcto. Con la primera pregunta forzada, la segunda —dentro de cada rama— sí separa perfectamente: la ganancia deja de ser cero en cuanto el primer rasgo ya está fijo. El árbol con `insistir` acierta el 100 % de las 12 fichas. La diferencia entre los dos modelos no estuvo en los datos —fueron exactamente los mismos 12 tickets—: estuvo en si al método se le permitió insistir.',
  feedbackInsistirIncorrecto:
    'Vuelve a leer el árbol que acabas de entrenar con `insistir`: fija primero el canal usado y, dentro de cada rama, el canal preferido decide solo, sin ambigüedad.',

  encabezadoSintesis:
    'Cuatro hallazgos de hoy, en su propio orden. Empareja cada uno con el límite que de verdad representa — el motor no repite categoría dos veces.',
  feedbackSintesisCorrecto:
    'Correcto en los cuatro. Memorización y punto ciego son límites de LOS DATOS del banco: con más tickets bien elegidos, se corrigen. El sesgo por grupo es un límite de a QUIÉN representa el banco frente al mundo real. Y el límite del método no lo arregla ni un ticket más: un árbol de decisión, con sus ajustes de fábrica, no aprende una interacción entre rasgos — hay que decidir, a propósito, dejarlo insistir.',
  feedbackSintesisIncorrecto:
    'Al menos una pareja no coincide con lo que mediste hoy. Revisa las cuatro descripciones contra los cuatro encargos anteriores antes de confirmar.',
} as const;
