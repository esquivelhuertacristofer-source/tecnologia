/**
 * `n10-etica-y-regulacion` · el dominio, entero y sin React
 * N10 · «IA y ciencia de datos», **parada 3 de 3, CIERRE de la unidad**
 * Bachillerato, 15–18 años (comprobado en `curriculo.ts`: unidad
 * `n10-ia-y-ciencia-de-datos`, tema «Ética profesional y regulación»)
 *
 * ── El caso, y por qué es éste ───────────────────────────────────────────
 *
 * Sigue en **TecniMarket**, Mesa de Soporte al Cliente — la misma empresa y
 * el mismo clasificador de prioridad de tickets que auditó técnicamente
 * `n10-como-funcionan-los-modelos` (parada 1). Ese archivo dejó un hallazgo
 * verificado con el motor real, no inventado aquí: contra una semana de
 * campo real, el clasificador tiene una brecha (bias) de **1,00** por área
 * — el grupo `pago` cae al 0 % de acierto mientras las otras tres áreas
 * (envío, cuenta, producto) dan 100 %, porque una campaña de marketing por
 * correo concentró justo esa semana las consultas de pago en el único canal
 * que el entrenamiento nunca vio.
 *
 * Esta parada no vuelve a entrenar nada ni repite la auditoría técnica: la
 * da por hecha y pregunta lo que viene después, que es un problema de
 * personas, no de código — ¿qué corresponde hacer, profesional y
 * regulatoriamente, ahora que la empresa YA SABE que su sistema falla
 * sistemáticamente contra un grupo? Cuatro principios generales, ciertos en
 * cualquier marco real de gobernanza de IA sin necesitar un artículo de ley
 * inventado:
 *
 *   1. **Transparencia** — informar que existe un sistema automatizado y qué
 *      papel tuvo en una decisión concreta.
 *   2. **Revisión humana** — dar una vía real para que una persona revise, y
 *      si hace falta cambie, una decisión que tomó el sistema.
 *   3. **Corrección de la causa** — arreglar lo que produjo el error, no sólo
 *      su síntoma visible.
 *   4. **Rendición de cuentas** — dejar un registro auditable: qué pasó, por
 *      qué, quién responde.
 *
 * ── El predicado real: `evaluarCaso()` (nunca una tabla de veredictos) ────
 *
 * Mismo patrón anti-épsilon que `mejorRolPara()` en
 * `n10/ciber-carreras/motorCarreras.ts`: cada caso declara sus cuatro rasgos
 * reales (`informa`, `permiteApelar`, `corrigeCausa`, `documenta`) como datos
 * — nunca un campo `veredicto` escrito a mano — y `evaluarCaso()` cuenta
 * cuántos de los cuatro cumple para calcular la categoría. Cumplir sólo
 * algunos no basta: la fórmula es deliberadamente estricta (`4/4` o nada
 * cuenta como responsable) porque ésa es la lección — una respuesta que
 * corrige el modelo pero lo hace en silencio sigue sin ser una respuesta
 * completa.
 *
 * El último encargo del laboratorio (E8, «construye la respuesta») reutiliza
 * exactamente esta misma función sobre los cuatro interruptores que arma el
 * alumno: no hay una segunda regla de verificación para ese paso, es la
 * misma `evaluarCaso()` aplicada a un caso que el alumno construye en vez de
 * leer.
 *
 * ── Registro (Bachillerato, «Perfil profesional») ─────────────────────────
 *
 * Sin diminutivos, sin mascota ni voz — igual que `n10-como-funcionan-los-
 * modelos` y `n10-carreras-ciber`. Principios generales de transparencia,
 * supervisión humana, corrección de sesgos y rendición de cuentas —los
 * mismos en cualquier marco real de gobernanza de IA— sin simular un marco
 * legal de un país concreto ni inventar números de artículo.
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1 · Los cuatro principios — el vocabulario declarado, no una lista suelta
// ═══════════════════════════════════════════════════════════════════════════

export type PrincipioEtica = 'transparencia' | 'revision-humana' | 'correccion-de-causa' | 'rendicion-de-cuentas';

export interface DefinicionPrincipio {
  id: PrincipioEtica;
  nombre: string;
  definicion: string;
}

export const PRINCIPIOS_ETICA: readonly DefinicionPrincipio[] = [
  {
    id: 'transparencia',
    nombre: 'Transparencia',
    definicion: 'Informar que existe un sistema automatizado y qué papel tuvo en una decisión concreta.',
  },
  {
    id: 'revision-humana',
    nombre: 'Revisión humana',
    definicion:
      'Dar una vía real para que una persona revise —y, si hace falta, cambie— una decisión que tomó el sistema.',
  },
  {
    id: 'correccion-de-causa',
    nombre: 'Corrección de la causa',
    definicion: 'Arreglar lo que produjo el error, no sólo su síntoma visible.',
  },
  {
    id: 'rendicion-de-cuentas',
    nombre: 'Rendición de cuentas',
    definicion: 'Dejar un registro auditable: qué pasó, por qué, y quién responde.',
  },
];

/** E2 · cuatro hechos concretos de TecniMarket, cada uno ilustra un principio distinto. */
export interface HechoPrincipio {
  id: string;
  descripcion: string;
  principioCorrecto: PrincipioEtica;
}

export const HECHOS_PRINCIPIO: readonly HechoPrincipio[] = [
  {
    id: 'aviso-clientes',
    descripcion: 'TecniMarket publica que el clasificador de tickets sugiere la prioridad de forma automática, y se lo dice a sus clientes.',
    principioCorrecto: 'transparencia',
  },
  {
    id: 'via-revision',
    descripcion: 'Un cliente del área de pago puede pedir que una persona revise la prioridad que el sistema le asignó a su ticket.',
    principioCorrecto: 'revision-humana',
  },
  {
    id: 'reentrena-modelo',
    descripcion: 'El equipo de datos reentrena el modelo con ejemplos reales de pago llegado por correo, cerrando el hueco que causó la brecha.',
    principioCorrecto: 'correccion-de-causa',
  },
  {
    id: 'acta-fecha',
    descripcion: 'El acta del incidente queda escrita con fecha, el número medido y el nombre del equipo responsable.',
    principioCorrecto: 'rendicion-de-cuentas',
  },
];

export const MENSAJE_ACIERTO_PRINCIPIOS =
  'Coinciden los cuatro. Ningún hecho por sí solo basta: avisar sin corregir, corregir sin dejar rastro o dejar rastro sin dar una vía de revisión son, cada uno, sólo una cuarta parte de una respuesta responsable.';
export const MENSAJE_ERROR_PRINCIPIOS =
  'Al menos un hecho no coincide con su principio. Relee las cuatro definiciones: ¿el hecho informa, permite que alguien apele, corrige la causa, o deja constancia?';

// ═══════════════════════════════════════════════════════════════════════════
// 2 · Los seis casos reales — el predicado, nunca un veredicto a mano
// ═══════════════════════════════════════════════════════════════════════════

export type VeredictoEtica = 'responsable' | 'parcial' | 'evasiva';

export interface CasoEtica {
  id: string;
  narrativa: string;
  informa: boolean;
  permiteApelar: boolean;
  corrigeCausa: boolean;
  documenta: boolean;
}

/**
 * Cuenta cuántos de los cuatro rasgos reales cumple un caso y calcula la
 * categoría — el predicado real. Ningún caso trae su veredicto escrito: se
 * calcula aquí, siempre, sobre los cuatro booleanos declarados.
 */
export function evaluarCaso(caso: Pick<CasoEtica, 'informa' | 'permiteApelar' | 'corrigeCausa' | 'documenta'>): VeredictoEtica {
  const cumplidos = [caso.informa, caso.permiteApelar, caso.corrigeCausa, caso.documenta].filter(Boolean).length;
  if (cumplidos === 4) return 'responsable';
  if (cumplidos === 0) return 'evasiva';
  return 'parcial';
}

export const CASOS_ETICA: readonly CasoEtica[] = [
  {
    id: 'silencio',
    narrativa:
      'Cuando el equipo técnico reporta la brecha de 1,00 en el área de pago, la gerencia decide no informar a nadie fuera del equipo y seguir usando el modelo exactamente igual la semana siguiente.',
    informa: false,
    permiteApelar: false,
    corrigeCausa: false,
    documenta: false,
  },
  {
    id: 'parche-manual',
    narrativa:
      'Sin tocar el modelo, TecniMarket sube manualmente a «alta» todos los tickets de pago durante un mes y anota la decisión en la bitácora interna del equipo — pero no le dice nada a los clientes ni ofrece una forma de apelar.',
    informa: false,
    permiteApelar: false,
    corrigeCausa: false,
    documenta: true,
  },
  {
    id: 'corrige-en-silencio',
    narrativa:
      'El equipo de datos reentrena el modelo con ejemplos reales de pago llegado por correo, cierra el hueco que causaba la brecha y deja constancia técnica del cambio en el repositorio del proyecto — pero nadie le avisa a los clientes de pago que hubo un error, ni se abre un canal para pedir que una persona revise una prioridad ya asignada.',
    informa: false,
    permiteApelar: false,
    corrigeCausa: true,
    documenta: true,
  },
  {
    id: 'avisa-no-corrige',
    narrativa:
      'TecniMarket envía un correo a los clientes de pago explicando que un sistema automatizado sugirió mal la prioridad de sus tickets esa semana, abre una línea para que cualquiera pida que una persona revise su caso, y registra el incidente en el acta trimestral — pero el modelo se queda exactamente igual: nadie corrige el hueco que lo causó.',
    informa: true,
    permiteApelar: true,
    corrigeCausa: false,
    documenta: true,
  },
  {
    id: 'ajuste-de-rutina',
    narrativa:
      'El equipo habilita que un ticket de pago pida revisión humana y ajusta el modelo con nuevos ejemplos hasta cerrar el hueco de raíz, pero decide no comunicarlo hacia afuera ni dejar un acta formal del hallazgo — internamente lo llaman «ajuste de rutina».',
    informa: false,
    permiteApelar: true,
    corrigeCausa: true,
    documenta: false,
  },
  {
    id: 'completa',
    narrativa:
      'TecniMarket avisa por escrito a los clientes de pago afectados, reentrena el modelo con ejemplos reales de pago por correo hasta cerrar el hueco, habilita que cualquier ticket de pago pueda pedir revisión humana de su prioridad, y publica un acta con la fecha, el número medido —brecha 1,00— y el nombre del equipo responsable.',
    informa: true,
    permiteApelar: true,
    corrigeCausa: true,
    documenta: true,
  },
];

export const OPCIONES_VEREDICTO: readonly { id: VeredictoEtica; etiqueta: string }[] = [
  { id: 'responsable', etiqueta: 'Responsable — cumple los cuatro criterios' },
  { id: 'parcial', etiqueta: 'Parcial — cumple algunos, no todos' },
  { id: 'evasiva', etiqueta: 'Evasiva — no cumple ninguno' },
];

export const MENSAJE_ACIERTO_CASOS =
  'Coinciden los seis. Fíjate en que casi ninguno fue «evasiva» a propósito — la mayoría de las respuestas reales caen en «parcial»: corrigen pero callan, o avisan pero no corrigen. Sólo la que cumple los cuatro criterios a la vez cuenta como responsable.';
export const MENSAJE_ERROR_CASOS =
  'Al menos un caso no coincide. Repasa, para cada uno, si de verdad informó, si permitió apelar, si corrigió la causa (no sólo el síntoma) y si dejó constancia — sólo cumplir los cuatro es «responsable».';

// ═══════════════════════════════════════════════════════════════════════════
// 3 · Opción múltiple — reconexión, legal-vs-correcto, y profundidad de cada
//     principio, sin repetir ninguna mecánica de las dos paradas anteriores
// ═══════════════════════════════════════════════════════════════════════════

export interface OpcionEtica {
  id: string;
  texto: string;
  correcta: boolean;
  explicacion: string;
}

/** E1 · reconecta el hallazgo exacto de la parada 1: la brecha de 1,00. */
export const OPCIONES_RECONEXION: readonly OpcionEtica[] = [
  {
    id: 'a',
    texto: 'Nada distinto: el modelo sigue funcionando globalmente al 71 % de acierto, un número razonable.',
    correcta: false,
    explicacion:
      'Ese es exactamente el error que mediste en la parada 1: el 71 % total esconde que un grupo entero —pago— está al 0 %. El acierto general nunca es excusa para ignorar una brecha por grupo.',
  },
  {
    id: 'b',
    texto:
      'Informar del hallazgo, corregir la causa que lo produjo y dar una vía real para que una persona revise un caso afectado — no basta con haberlo medido.',
    correcta: true,
    explicacion:
      'Correcto. Medir la brecha con el motor real fue el trabajo técnico de la parada 1; ahora corresponde el trabajo profesional: transparencia, corrección de la causa, revisión humana y, además, dejar constancia de todo — los cuatro principios de este cierre.',
  },
  {
    id: 'c',
    texto: 'Esperar a la próxima auditoría programada, dentro de un año, para decidir si vale la pena corregirlo.',
    correcta: false,
    explicacion: 'Un hallazgo ya verificado —brecha 1,00, no una sospecha— no se archiva para revisarlo después: se actúa.',
  },
  {
    id: 'd',
    texto: 'Eliminar el área «pago» del sistema de tickets para que ese grupo deje de generar el número que hace ver mal al modelo.',
    correcta: false,
    explicacion:
      'Borrar el dato que revela el problema no corrige nada: sólo esconde la evidencia. Es la versión más evasiva posible de «resolverlo».',
  },
];

/** E4 · «es legal» y «es correcto» no siempre coinciden. */
export const OPCIONES_LEGAL_VS_CORRECTO: readonly OpcionEtica[] = [
  {
    id: 'a',
    texto: 'Sí: si el mínimo legal ya está cubierto, no hay nada más que hacer.',
    correcta: false,
    explicacion:
      'El mínimo legal es un piso, no un techo. Ningún cliente de pago se enteró de nada concreto sobre el error que los afectó esa semana ni tuvo forma de pedir revisión — cumplir la letra no bastó para ser correcto.',
  },
  {
    id: 'b',
    texto:
      'No: cumplir el mínimo legal no es lo mismo que ser transparente o dar una vía de revisión real — «es legal» y «es correcto» no siempre coinciden, y aquí ningún cliente afectado se enteró de nada concreto.',
    correcta: true,
    explicacion:
      'Correcto. Una frase genérica publicada desde antes del incidente cumple el trámite, pero no informa del hallazgo concreto ni abre una vía de revisión — dos de los cuatro principios siguen incumplidos.',
  },
  {
    id: 'c',
    texto: 'No, porque mencionar herramientas automatizadas en los términos y condiciones es ilegal en cualquier país.',
    correcta: false,
    explicacion: 'Eso no es cierto en general, y tampoco es el problema real del caso: el problema es que ese aviso genérico no informó nada concreto sobre ESTE hallazgo.',
  },
  {
    id: 'd',
    texto: 'Sí, porque el error sólo duró una semana y ya se sabe que fue causado por una campaña de marketing.',
    correcta: false,
    explicacion: 'La duración del error o su causa externa no cambian si los clientes afectados fueron informados o pudieron apelar — y en este caso, no.',
  },
];

/** E5 · por qué importa la revisión humana incluso después de corregir el modelo. */
export const OPCIONES_REVISION_HUMANA: readonly OpcionEtica[] = [
  {
    id: 'a',
    texto:
      'Porque ningún modelo corregido hoy garantiza que no exista otro punto ciego mañana, y una persona puede detectar y corregir un caso concreto sin esperar a la próxima auditoría completa.',
    correcta: true,
    explicacion:
      'Correcto. La parada 1 ya lo demostró: un árbol de decisión nunca se queda callado — contesta algo, con la confianza que le den los pocos ejemplos que sí conoce. Corregir un punto ciego no impide que exista otro; la revisión humana es la red que atrapa el siguiente.',
  },
  {
    id: 'b',
    texto: 'No importa: una vez corregida la brecha medida, el modelo ya no puede volver a equivocarse.',
    correcta: false,
    explicacion: 'Corregir la brecha medida no vacuna al modelo contra un punto ciego distinto que todavía nadie ha encontrado.',
  },
  {
    id: 'c',
    texto: 'Importa sólo para cumplir un trámite, no porque vaya a servir de algo en la práctica.',
    correcta: false,
    explicacion: 'Al contrario: es la única vía que atrapa un error concreto en el momento en que ocurre, sin esperar a una auditoría completa.',
  },
  {
    id: 'd',
    texto: 'Importa únicamente si el cliente amenaza con una demanda.',
    correcta: false,
    explicacion: 'Condicionar la revisión a una amenaza legal es, otra vez, confundir el mínimo legal con lo correcto.',
  },
];

/** E6 · rendición de cuentas — dos actas, sólo una documenta de verdad. */
export const ACTA_VAGA =
  'Esta semana el sistema tuvo un problema técnico menor en el área de pago. Ya se revisó.';
export const ACTA_COMPLETA =
  'El [fecha] se detectó una brecha de 1,00 en el área «pago» del clasificador de tickets: 0 % de acierto contra 100 % en las otras tres áreas, durante la semana de una campaña de correo que concentró ese tráfico en un canal que el modelo nunca había visto en su entrenamiento. Responsable: equipo de datos de la Mesa de Soporte. Acción tomada: reentrenamiento con nuevos ejemplos y habilitación de revisión humana.';

export const OPCIONES_RENDICION_CUENTAS: readonly OpcionEtica[] = [
  {
    id: 'a',
    texto: 'El acta vaga: es más corta y no alarma a nadie que la lea.',
    correcta: false,
    explicacion: 'Que no alarme a nadie es justo el problema: no dice qué pasó, por qué, ni quién responde — no se puede auditar nada con eso.',
  },
  {
    id: 'b',
    texto: 'El acta completa: trae el número medido, la causa real, el responsable y la acción tomada — cualquiera puede auditarla después.',
    correcta: true,
    explicacion:
      'Correcto. Rendir cuentas no es escribir que «ya se revisó»: es dejar el número exacto (1,00), la causa concreta (la campaña de correo) y quién responde, de forma que una persona ajena pueda comprobarlo después sin tener que preguntar.',
  },
  {
    id: 'c',
    texto: 'Ninguna: lo importante es corregir el modelo, no escribir nada al respecto.',
    correcta: false,
    explicacion: 'Corregir sin documentar es exactamente el caso «ajuste de rutina» que acabas de clasificar como respuesta parcial, no responsable.',
  },
  {
    id: 'd',
    texto: 'Las dos por igual: mientras exista un acta, no importa qué tan detallada sea.',
    correcta: false,
    explicacion: 'Un acta que no se puede auditar —sin número, sin causa, sin responsable— no cumple la función de rendir cuentas, aunque exista.',
  },
];

/** E7 · reconecta la parada 2 (`n10-flujos-con-ia`) por nombre, sin repetirla. */
export const OPCIONES_FLUJO_IA: readonly OpcionEtica[] = [
  {
    id: 'a',
    texto: 'El formato del documento: los márgenes y el tipo de letra.',
    correcta: false,
    explicacion: 'Eso sí se puede delegar sin riesgo: no cambia si el contenido es cierto.',
  },
  {
    id: 'b',
    texto:
      'Que el número exacto de la brecha (1,00), la causa real (la campaña de correo) y el responsable declarado sean ciertos y verificables — un asistente generativo puede simplificar o inventar un dato sin que se note a simple vista.',
    correcta: true,
    explicacion:
      'Correcto: la misma verificación humana que practicaste delegando y comprobando en la parada anterior de esta unidad. Un borrador redactado por un asistente puede sonar perfectamente bien y aun así tener el número equivocado o la causa simplificada — verificar el hecho es lo único que un asistente no puede garantizar por sí solo.',
  },
  {
    id: 'c',
    texto: 'Nada: si el asistente lo redactó, ya no hace falta revisarlo.',
    correcta: false,
    explicacion: 'Delegar la redacción no delega la responsabilidad de que lo redactado sea cierto.',
  },
  {
    id: 'd',
    texto: 'Sólo la ortografía, porque el contenido técnico ya viene garantizado por el propio sistema.',
    correcta: false,
    explicacion: 'Ningún asistente generativo garantiza por sí solo que un dato técnico citado sea correcto — por eso se verifica, no se asume.',
  },
];

/** E9 · cierre — la idea que conecta las tres paradas de la unidad. */
export const OPCIONES_CIERRE_UNIDAD: readonly OpcionEtica[] = [
  {
    id: 'a',
    texto:
      'Un modelo se audita técnicamente (parada 1), se usa con criterio humano cuando genera o sugiere algo (parada 2), y cuando falla, corregirlo con transparencia y rendición de cuentas es responsabilidad de quienes lo operan, no del algoritmo (parada 3).',
    correcta: true,
    explicacion:
      'Correcto: las tres paradas son un mismo ciclo. Auditar sin actuar después no sirve; actuar sin haber auditado con el motor real tampoco. La responsabilidad profesional cierra el ciclo que la técnica abrió.',
  },
  {
    id: 'b',
    texto: 'La tecnología de IA es neutral, así que la responsabilidad siempre es de quien programó el modelo originalmente, nunca de quien lo usa después.',
    correcta: false,
    explicacion: 'La brecha de TecniMarket no la causó quien escribió el código del árbol de decisión: la causó una campaña de marketing ajena al modelo. La responsabilidad de detectarla y corregirla es de quien lo opera, no sólo de quien lo construyó.',
  },
  {
    id: 'c',
    texto: 'Una vez que un modelo pasa la auditoría técnica de la parada 1, ya no hace falta revisar nada más en el futuro.',
    correcta: false,
    explicacion: 'La parada 1 mostró un punto ciego que nadie había probado todavía; la revisión humana de esta parada existe justo porque una auditoría no cubre todo el futuro.',
  },
  {
    id: 'd',
    texto: 'La ética profesional sólo aplica a las decisiones que toma directamente una persona, nunca a las que sugiere un sistema automatizado.',
    correcta: false,
    explicacion: 'Es al revés: cuando un sistema automatizado influye en una decisión real —como la prioridad de un ticket—, la responsabilidad profesional de quien lo opera aplica exactamente igual.',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 4 · E8 · construir la respuesta — los mismos cuatro interruptores, el
//     mismo predicado `evaluarCaso()`, ahora aplicado a lo que arma el alumno
// ═══════════════════════════════════════════════════════════════════════════

export interface InterruptorRespuesta {
  clave: 'informa' | 'permiteApelar' | 'corrigeCausa' | 'documenta';
  etiqueta: string;
}

export const INTERRUPTORES_RESPUESTA: readonly InterruptorRespuesta[] = [
  { clave: 'informa', etiqueta: 'Informar a los clientes de pago que hubo un sistema automatizado y qué salió mal' },
  { clave: 'permiteApelar', etiqueta: 'Habilitar que cualquier ticket de pago pueda pedir revisión humana' },
  { clave: 'corrigeCausa', etiqueta: 'Reentrenar el modelo con ejemplos reales de pago llegado por correo, cerrando el hueco' },
  { clave: 'documenta', etiqueta: 'Dejar un acta con fecha, el número medido —brecha 1,00— y el equipo responsable' },
];

export const RESPUESTA_INICIAL: Pick<CasoEtica, 'informa' | 'permiteApelar' | 'corrigeCausa' | 'documenta'> = {
  informa: false,
  permiteApelar: false,
  corrigeCausa: false,
  documenta: false,
};

export const MENSAJE_ACIERTO_CONSTRUCCION =
  'Los cuatro activados construyen, exactamente, la respuesta responsable: la misma que clasificaste como «completa» hace unos encargos. No es casualidad — es la misma función, `evaluarCaso()`, aplicada ahora a lo que tú armaste en vez de a un caso ya escrito.';
export const MENSAJE_ERROR_CONSTRUCCION =
  'Con los interruptores activados ahora mismo, esta respuesta no calificaría como responsable. Vuelve a los seis casos que acabas de clasificar: ¿cuál de ellos cumplía los cuatro criterios a la vez?';

// ═══════════════════════════════════════════════════════════════════════════
// 5 · Constantes de la clase
// ═══════════════════════════════════════════════════════════════════════════

export const TOTAL_PASOS = 9;

/** El hallazgo exacto de la parada 1, citado aquí una sola vez y reutilizado
 *  en el texto de la clase — nunca recalculado, porque esta parada no
 *  vuelve a correr el motor de `simuladores/aprendizaje/`. */
export const BRECHA_REFERENCIA = 1.0;
export const AREA_REFERENCIA = 'pago';
