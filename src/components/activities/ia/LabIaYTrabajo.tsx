'use client';

import { useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { useLabActividad } from '../lib/useLabActividad';
import { VentanaBase } from '../../simuladores/VentanaBase';

/**
 * N9 · «IA y automatización» — «El impacto de la IA en el trabajo», CIERRE
 * de la unidad, parada 3 de 3. Nivel 9 = 3.º de Secundaria, 14–15 años.
 *
 * Mismo papel que `n9-empleos-tecnologicos` en su propia unidad (leído
 * entero antes de escribir esta clase): no enseña un programa nuevo, aplica
 * criterio. El «programa» de hoy es un panel de impacto —Tecnia Radar— con
 * tareas y casos reales, no un simulador de software: por eso corre sobre
 * `VentanaBase` + `useLabActividad` a secas, sin `ArcadeSala` ni un motor
 * inventado que no hace falta aquí.
 *
 * ── Cómo cierra la unidad integrando, sin repetir, las dos paradas ──────────
 *
 * `n9-automatiza-tareas` (parada 1) enseñó una regla SI/ENTONCES fija sobre
 * una bandeja de correo. `n9-ia-copiloto` (parada 2) enseñó a PROBAR una
 * sugerencia de IA generativa antes de aceptarla. Ninguna de las dos vuelve
 * a construirse aquí: el Acto 1 sólo aplica ese criterio ya aprendido para
 * clasificar tareas de trabajos reales, y el Acto 4 (el caso de Iván) hace
 * explícito el reparto entre las tres herramientas —regla, copiloto, tu
 * criterio— sobre un empleo que ninguna de las dos paradas anteriores tocó.
 *
 * ── Qué NO repite de `n9-empleos-tecnologicos` (parada 3 de otra unidad) ────
 *
 * Esa clase clasificaba EMPLEOS tech y separaba habilidades técnicas de
 * transferibles. Ésta no vuelve a esa clasificación: el Acto 3 pregunta qué
 * habilidades importan MÁS o MENOS cuando la IA cambia una tarea dentro de
 * CUALQUIER empleo —no sólo los tech—, y el eje entero de la clase es el
 * IMPACTO (qué cambia, qué se pierde, qué se gana), no el catálogo de
 * puestos. Los casos, personas y empleos de hoy (Ana, el operador de
 * conmutador, Iván) son todos nuevos: ninguno reaparece de la otra unidad.
 *
 * ── El predicado real: sin tabla oculta ─────────────────────────────────
 *
 * Cada tarea, caso o frase declara su propio veredicto correcto como dato
 * (`correcta`), igual que `TAREAS_ANALISTA` o `HABILIDADES` en
 * `LabEmpleosTecnologicos.tsx` — nunca una lista de ids copiada aparte que
 * pudiera desincronizarse del texto que el alumno lee.
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1 · Acto 1 «Qué tareas cambia la IA de verdad» — encargos 1–2
// ═══════════════════════════════════════════════════════════════════════════

interface ItemClasificable {
  id: string;
  texto: string;
  correcta: string;
}

const TAREAS_REALES: ItemClasificable[] = [
  { id: 'facturas', texto: 'Clasificar miles de facturas por categoría de gasto cada mes.', correcta: 'automatiza' },
  { id: 'traduccion-basica', texto: 'Traducir las instrucciones básicas de un producto a otro idioma.', correcta: 'automatiza' },
  {
    id: 'credito',
    texto: 'Decidir si se le aprueba un crédito a alguien con historial dudoso y una situación personal complicada.',
    correcta: 'criterio',
  },
  {
    id: 'borrador-reporte',
    texto: 'Escribir un primer borrador de un reporte, a partir de datos que ya están ordenados en una tabla.',
    correcta: 'automatiza',
  },
  { id: 'noticia-dificil', texto: 'Darle a una familia la noticia de que una cirugía no salió como se esperaba.', correcta: 'criterio' },
  { id: 'conflicto-equipo', texto: 'Resolver un conflicto entre dos compañeros de trabajo que no se ponen de acuerdo.', correcta: 'criterio' },
];

const OPCIONES_TAREAS_REALES: [{ valor: string; etiqueta: string }, { valor: string; etiqueta: string }] = [
  { valor: 'automatiza', etiqueta: '🤖 La IA ya lo automatiza bien' },
  { valor: 'criterio', etiqueta: '🧠 Sigue pidiendo criterio humano' },
];

const MENSAJE_ACIERTO_TAREAS_REALES =
  'Las seis coinciden: clasificar facturas, traducir instrucciones básicas y armar un primer borrador con datos ya ordenados son tareas repetitivas con un patrón claro —eso ya lo hace bien una IA hoy—. Decidir un crédito con una situación complicada, dar una noticia difícil y resolver un conflicto entre personas necesitan algo que ninguna IA tiene: juicio sobre una situación ambigua, con una persona real del otro lado.';

interface OpcionMcq {
  id: string;
  texto: string;
  correcta: boolean;
  explicacion: string;
}

const OPCIONES_PATRON_COMUN: OpcionMcq[] = [
  {
    id: 'a',
    texto:
      'Se repiten con un patrón parecido cada vez, y se puede comprobar si el resultado quedó bien — igual que la regla del correo y el código del robot que ya probaste.',
    correcta: true,
    explicacion:
      'Exacto. Un patrón que se repite y un resultado que se puede comprobar son las dos condiciones que ya viste en las dos paradas anteriores: ahí es donde una IA rinde mejor.',
  },
  {
    id: 'b',
    texto: 'Son tareas sin importancia, que a nadie le interesa mucho.',
    correcta: false,
    explicacion:
      'No: clasificar miles de facturas es importante para cualquier empresa. Que la IA la automatice bien no significa que sea poco importante — significa que tiene un patrón claro.',
  },
  {
    id: 'c',
    texto: 'Son tareas que antes no existían y las inventó la IA.',
    correcta: false,
    explicacion: 'No: las tres existían mucho antes de que hubiera IA. Lo que cambió es quién las hace, no que sean nuevas.',
  },
  {
    id: 'd',
    texto: 'Son tareas que no tienen nada que ver entre ellas.',
    correcta: false,
    explicacion: 'Si te fijas bien, sí comparten algo: las tres se repiten con un patrón parecido y su resultado se puede comprobar.',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 2 · Acto 2 «Reemplaza el empleo (raro) vs. cambia qué hace (común)» — 3–4
// ═══════════════════════════════════════════════════════════════════════════

const CASO_ANA =
  'Hace unos años, Ana pasaba su turno completo cobrando pagos de servicios, haciendo depósitos y contando billetes en la ventanilla del banco. Hoy la mayoría de esos trámites los hace la app del banco o un cajero automático en segundos. Ana sigue trabajando ahí — pero ahora dedica su turno a sentarse con clientes que tienen una duda que la app no resuelve, a explicarles opciones de crédito según su situación particular, y a detectar cuando un movimiento en una cuenta huele a fraude.';

const OPCIONES_CASO_ANA: OpcionMcq[] = [
  {
    id: 'a',
    texto: 'Su empleo de cajera desapareció por completo y ahora hace algo totalmente distinto, sin relación con antes.',
    correcta: false,
    explicacion:
      'No: sigue siendo cajera de banco, y todavía atiende a clientes en el mismo mostrador. Lo que cambió fue QUÉ hace en ese puesto, no el puesto completo.',
  },
  {
    id: 'b',
    texto:
      'Sigue siendo cajera, pero la IA y los cajeros automáticos absorbieron los trámites repetitivos, y ella ahora dedica su tiempo a lo que pide criterio: asesorar y detectar fraude.',
    correcta: true,
    explicacion:
      'Exacto. Éste es el caso más común: el empleo no desaparece, cambia de contenido — la parte repetitiva se va, la parte que pide criterio se queda y crece.',
  },
  {
    id: 'c',
    texto: 'Nada cambió: sigue haciendo exactamente el mismo trabajo que hace diez años.',
    correcta: false,
    explicacion: 'No: si nada hubiera cambiado, los trámites repetitivos seguirían ocupando todo su turno. Sí cambió, sólo que no desapareció el empleo completo.',
  },
];

const CASOS_ANTES_DESPUES: ItemClasificable[] = [
  {
    id: 'traductor',
    texto:
      'Traductor/a: antes traducía cada documento completo desde cero; hoy revisa y corrige la traducción que ya hizo una IA, y decide cómo traducir bromas o dichos que no tienen una traducción directa.',
    correcta: 'cambia',
  },
  {
    id: 'conmutador',
    texto:
      'Operador/a de conmutador telefónico: antes conectaba a mano cada llamada de teléfono en una central; hoy ese trabajo casi no existe, porque las llamadas se conectan solas.',
    correcta: 'reemplaza',
  },
  {
    id: 'editor-fotos',
    texto:
      'Editor/a de fotos de producto: antes retocaba cada foto a mano durante horas; hoy usa una IA para el retoque básico en segundos, y dedica su tiempo a decidir el estilo y la iluminación que mejor vende cada producto.',
    correcta: 'cambia',
  },
  {
    id: 'reparto',
    texto:
      'Repartidor/a: antes decidía a ojo la ruta más rápida; hoy una IA le sugiere la ruta óptima según el tráfico en tiempo real, pero sigue siendo él quien maneja, entrega y resuelve un problema si la dirección está mal.',
    correcta: 'cambia',
  },
];

const OPCIONES_CAMBIA_O_REEMPLAZA: [{ valor: string; etiqueta: string }, { valor: string; etiqueta: string }] = [
  { valor: 'cambia', etiqueta: '🔁 Cambió qué hace, sigue existiendo' },
  { valor: 'reemplaza', etiqueta: '🚫 El empleo casi desapareció por completo' },
];

const MENSAJE_ACIERTO_CASOS =
  'Las cuatro coinciden: traductor, editor de fotos y repartidor SIGUEN existiendo — cambió qué hacen, no que existan. El operador de conmutador es la excepción real: ese trabajo casi desapareció por completo cuando la conexión de llamadas se automatizó. Por eso «reemplaza el empleo completo» es la excepción, no la regla.';

// ═══════════════════════════════════════════════════════════════════════════
// 3 · Acto 3 «Prepárate con criterio, no con pánico ni optimismo ciego» — 5–7
// ═══════════════════════════════════════════════════════════════════════════

const HABILIDADES_IMPACTO: ItemClasificable[] = [
  { id: 'revisar-ia', texto: 'Revisar y comprobar lo que te entrega una IA antes de usarlo, con datos o una prueba real.', correcta: 'importa-mas' },
  { id: 'explicar-claro', texto: 'Explicarle con claridad una decisión difícil a alguien que no es experto en el tema.', correcta: 'importa-mas' },
  { id: 'memorizar-fijo', texto: 'Memorizar al pie de la letra un procedimiento que nunca cambia.', correcta: 'importa-menos' },
  { id: 'adaptarte-rapido', texto: 'Adaptarte rápido cuando cambia la herramienta que usas para hacer tu trabajo.', correcta: 'importa-mas' },
  { id: 'copiar-sin-pensar', texto: 'Copiar datos de un documento a otro a mano, sin pensar si tienen sentido.', correcta: 'importa-menos' },
  {
    id: 'criterio-etico',
    texto: 'Decidir con criterio ético en una situación que ningún manual cubre exactamente.',
    correcta: 'importa-mas',
  },
];

const OPCIONES_IMPORTA: [{ valor: string; etiqueta: string }, { valor: string; etiqueta: string }] = [
  { valor: 'importa-mas', etiqueta: '⬆️ Importa más ahora' },
  { valor: 'importa-menos', etiqueta: '⬇️ Importa menos ahora' },
];

const MENSAJE_ACIERTO_HABILIDADES =
  'Las seis coinciden: revisar antes de aceptar, explicar con claridad, adaptarte rápido y decidir con criterio ético son justo las habilidades que no dependen de un patrón fijo — por eso importan MÁS ahora. Memorizar un procedimiento exacto y copiar datos sin pensar son justo lo que una IA hace mejor y más rápido: importan menos.';

const POSTURAS: ItemClasificable[] = [
  { id: 'postura-panico', texto: '«Para qué me esfuerzo, de todos modos la IA me va a quitar el trabajo.»', correcta: 'no-prepara' },
  { id: 'postura-optimismo', texto: '«La IA jamás podría hacer lo que yo hago, así que no tengo que cambiar nada.»', correcta: 'no-prepara' },
  {
    id: 'postura-probar',
    texto: '«Voy a aprender a usar las herramientas de IA de mi área, probando lo que dan antes de confiar en ellas.»',
    correcta: 'prepara',
  },
  {
    id: 'postura-enfocar',
    texto: '«Me voy a enfocar en la parte de mi trabajo donde tengo que hablar con personas y decidir con criterio, porque ahí es donde más aporto.»',
    correcta: 'prepara',
  },
];

const OPCIONES_PREPARA: [{ valor: string; etiqueta: string }, { valor: string; etiqueta: string }] = [
  { valor: 'prepara', etiqueta: '✅ Te prepara de verdad' },
  { valor: 'no-prepara', etiqueta: '❌ No te prepara (pánico u optimismo ciego)' },
];

const MENSAJE_ACIERTO_POSTURAS =
  'Las cuatro coinciden: las dos primeras suenan distintas —una es miedo, la otra es exceso de confianza— pero ninguna te hace hacer nada distinto mañana. Las otras dos sí cambian lo que haces: probar antes de confiar, y enfocarte en lo que de verdad aporta tu criterio.';

const OPCIONES_MISMA_RAZON: OpcionMcq[] = [
  {
    id: 'a',
    texto:
      'Porque ninguna de las dos depende de lo que TÚ hagas con tu criterio: las dos tratan el resultado como si ya estuviera decidido de antemano, sin que tu manera de trabajar cambie nada.',
    correcta: true,
    explicacion:
      'Exacto. Las dos posturas quitan de en medio lo único que sí puedes controlar: qué haces tú con tu criterio. Por eso están mal por la misma razón, aunque suenen contrarias.',
  },
  {
    id: 'b',
    texto: 'Porque las dos exageran igual de fuerte: ni la IA es tan mala como para no servir nunca, ni tan buena como para hacerlo todo.',
    correcta: false,
    explicacion:
      'Se acerca, pero no es el punto central: el problema no es sólo el tamaño de la exageración, es que las dos ignoran que el resultado depende de lo que tú hagas con tu criterio, no sólo de qué tan buena sea la IA.',
  },
  {
    id: 'c',
    texto: 'Porque la primera la dicen personas mayores y la segunda personas jóvenes.',
    correcta: false,
    explicacion: 'No: la edad de quien lo dice no tiene nada que ver — cualquiera puede caer en cualquiera de las dos posturas.',
  },
  {
    id: 'd',
    texto: 'Porque las dos son ciertas al mismo tiempo, dependiendo del empleo.',
    correcta: false,
    explicacion: 'No: no son «ciertas a la vez» — las dos comparten el mismo error de fondo: asumen un resultado fijo sin contar tu criterio.',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 4 · Acto 4 «El caso de Iván» — cierre que integra las tres paradas — 8–9
// ═══════════════════════════════════════════════════════════════════════════

type DestinoIvan = 'regla' | 'copiloto' | 'criterio';

interface TareaIvan {
  id: string;
  texto: string;
  correcta: DestinoIvan;
  /** Se lee sólo cuando el alumno clasifica esta tarea en el bolsillo equivocado. */
  porque: string;
}

const TAREAS_IVAN: TareaIvan[] = [
  {
    id: 'horario',
    texto: 'Responder automáticamente cuando alguien pregunta el horario de atención o el tiempo de envío estándar.',
    correcta: 'regla',
    porque:
      'Es exactamente lo que viste en la parada 1: una pregunta con una sola respuesta fija, siempre igual. Una regla SI/ENTONCES la resuelve sola, sin que nadie la escriba cada vez.',
  },
  {
    id: 'ticket',
    texto: 'Clasificar automáticamente cada ticket nuevo según una palabra clave en el asunto (por ejemplo, «reembolso» o «envío»).',
    correcta: 'regla',
    porque: 'También es un patrón fijo y comprobable: si el asunto contiene esa palabra, va a esa carpeta — el mismo mecanismo de «si esto, entonces aquello» de la parada 1.',
  },
  {
    id: 'borrador-queja',
    texto: 'Redactar un primer borrador de la respuesta a una queja, que Iván va a probar leyéndola como si fuera el cliente antes de enviarla.',
    correcta: 'copiloto',
    porque:
      'Aquí no hay una regla fija: es una sugerencia de una IA generativa que hay que PROBAR antes de aceptar, como hiciste con el código y el párrafo del volante en la parada 2.',
  },
  {
    id: 'escalar',
    texto: 'Decidir si un cliente muy alterado necesita hablar YA con un supervisor humano.',
    correcta: 'criterio',
    porque: 'No hay patrón ni sugerencia que probar: es una decisión de criterio en el momento, con una persona real del otro lado. Eso sigue siendo tuyo.',
  },
  {
    id: 'cargo-raro',
    texto: 'Explicarle a un cliente, en un caso ambiguo, por qué se le cobró un cargo que no reconoce y que ni el sistema tiene claro.',
    correcta: 'criterio',
    porque: 'Es ambiguo incluso para el propio sistema: nadie escribió una regla para esto, y ninguna IA tiene el contexto completo del caso. Necesita tu criterio.',
  },
];

const OPCIONES_DESTINO_IVAN: { valor: DestinoIvan; etiqueta: string }[] = [
  { valor: 'regla', etiqueta: '⚙️ Una regla SI/ENTONCES la resuelve sola' },
  { valor: 'copiloto', etiqueta: '🧑‍✈️ Un copiloto de IA ayuda, probando antes' },
  { valor: 'criterio', etiqueta: '🧠 Esto sigue siendo tuyo, con tu criterio' },
];

const MENSAJE_ACIERTO_IVAN =
  'Las cinco tareas de Iván usan las tres herramientas de toda la unidad: una regla fija para lo que se repite igual siempre, un copiloto que se prueba antes de aceptar para lo que tiene lógica pero no una única respuesta correcta, y tu criterio para lo que depende del contexto de una persona real. Elegir cuál le toca a cada tarea —no usar sólo una de las tres para todo— es exactamente el trabajo de hoy.';

const OPCIONES_REFLEXION_FINAL: OpcionMcq[] = [
  {
    id: 'a',
    texto:
      'Identificar qué parte de cualquier trabajo es un patrón repetitivo, qué parte es una sugerencia que hay que probar, y qué parte necesita tu criterio — y volverte bueno/a en esa última parte, porque es la que no se automatiza.',
    correcta: true,
    explicacion: 'Exacto: es el mismo reparto que acabas de hacer con las tareas de Iván, aplicado a cualquier trabajo, no sólo al de atención al cliente.',
  },
  {
    id: 'b',
    texto: 'Aprender a programar lo antes posible, porque es la única habilidad que va a seguir sirviendo.',
    correcta: false,
    explicacion: 'No: en esta misma unidad viste trabajo con IA que no es programar —redactar, decidir, explicar— y que sigue pidiendo criterio humano.',
  },
  {
    id: 'c',
    texto: 'Evitar cualquier trabajo donde exista una IA involucrada.',
    correcta: false,
    explicacion: 'Eso descartaría casi cualquier empleo del futuro cercano: la IA ya está en la mayoría. Lo que importa es qué parte del trabajo haces tú dentro de eso.',
  },
  {
    id: 'd',
    texto: 'Confiar en que, si la IA hace bien una tarea, entonces también va a tomar bien la decisión completa.',
    correcta: false,
    explicacion:
      'No: con el promedio del robot y el párrafo del volante (parada 2) viste que hacer bien una tarea no es lo mismo que decidir bien — eso lo sigues comprobando tú.',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 5 · El laboratorio — 9 encargos, un solo índice lineal
// ═══════════════════════════════════════════════════════════════════════════

const TOTAL = 9;

const NOMBRES_ACTO = ['Qué cambia la IA de verdad', 'Reemplaza vs. cambia', 'Prepárate con criterio', 'El cierre'] as const;
/** Índice del primer paso de cada acto; el último valor es el total. */
const LIMITES_ACTO = [0, 2, 4, 7, TOTAL];

function indiceActo(paso: number): number {
  return LIMITES_ACTO.findIndex((limite, i) => i < LIMITES_ACTO.length - 1 && paso < LIMITES_ACTO[i + 1]);
}

const INSTRUCCIONES: string[] = [
  'Seis tareas de trabajos reales. Para cada una, decide: ¿la IA ya la automatiza bien, o sigue pidiendo criterio humano?',
  '¿Qué tienen en común las tres tareas que la IA sí automatiza bien?',
  'El caso de Ana, cajera de banco. Lee qué cambió en su empleo con la llegada de la IA y los cajeros automáticos.',
  'Cuatro empleos reales, antes y después de la IA. Para cada uno, decide: ¿cambió qué hace, o el empleo casi desapareció por completo?',
  'Seis habilidades. Para cada una, decide: ¿importa más ahora que la IA cambia el trabajo, o importa menos?',
  'Cuatro frases sobre cómo prepararse. Para cada una, decide: ¿te prepara de verdad, o es pánico u optimismo ciego disfrazado de opinión?',
  '¿Por qué «la IA nunca me va a reemplazar» y «la IA me va a reemplazar a mí» están mal por la MISMA razón?',
  'Iván trabaja en atención al cliente de una tienda en línea. Para cada tarea de su día, decide a quién le toca: una regla, un copiloto de IA, o tu criterio.',
  'Última pregunta, con todo lo que viste en la unidad completa.',
];

export function LabIaYTrabajo(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const lab = useLabActividad(props, TOTAL, {});

  const [pasoActual, setPasoActual] = useState(0);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [bloqueado, setBloqueado] = useState(false);

  // Acto 1
  const [veredictosTareasReales, setVeredictosTareasReales] = useState<Record<string, string | undefined>>({});
  const [patronComunId, setPatronComunId] = useState<string | null>(null);

  // Acto 2
  const [casoAnaId, setCasoAnaId] = useState<string | null>(null);
  const [veredictosCasos, setVeredictosCasos] = useState<Record<string, string | undefined>>({});

  // Acto 3
  const [veredictosHabilidades, setVeredictosHabilidades] = useState<Record<string, string | undefined>>({});
  const [veredictosPosturas, setVeredictosPosturas] = useState<Record<string, string | undefined>>({});
  const [mismaRazonId, setMismaRazonId] = useState<string | null>(null);

  // Acto 4
  const [clasificacionesIvan, setClasificacionesIvan] = useState<Partial<Record<string, DestinoIvan>>>({});
  const [tareaIvanError, setTareaIvanError] = useState<string | null>(null);
  const [reflexionFinalId, setReflexionFinalId] = useState<string | null>(null);

  const marcarAcierto = (texto: string) => {
    lab.avanzar();
    setMensaje({ ok: true, texto });
    setBloqueado(true);
  };

  const marcarError = (texto: string) => {
    lab.restar();
    setMensaje({ ok: false, texto });
  };

  const siguiente = () => {
    setMensaje(null);
    setBloqueado(false);
    setPasoActual((p) => p + 1);
  };

  const terminar = () => lab.terminar(Math.round((Date.now() - lab.sim.current.inicio) / 1000));

  // ── Acto 1 ────────────────────────────────────────────────────────────
  const comprobarTareasReales = () => {
    if (bloqueado) return;
    const todasCorrectas = TAREAS_REALES.every((t) => veredictosTareasReales[t.id] === t.correcta);
    if (todasCorrectas) marcarAcierto(MENSAJE_ACIERTO_TAREAS_REALES);
    else marcarError('Todavía no coinciden las seis. Pregúntate de cada tarea: ¿se repite siempre igual y su resultado se puede comprobar, o cambia según la situación y hay una persona del otro lado?');
  };

  const elegirPatronComun = (op: OpcionMcq) => {
    if (bloqueado) return;
    setPatronComunId(op.id);
    if (op.correcta) marcarAcierto(op.explicacion);
    else marcarError(op.explicacion);
  };

  // ── Acto 2 ────────────────────────────────────────────────────────────
  const elegirCasoAna = (op: OpcionMcq) => {
    if (bloqueado) return;
    setCasoAnaId(op.id);
    if (op.correcta) marcarAcierto(op.explicacion);
    else marcarError(op.explicacion);
  };

  const comprobarCasos = () => {
    if (bloqueado) return;
    const todosCorrectos = CASOS_ANTES_DESPUES.every((c) => veredictosCasos[c.id] === c.correcta);
    if (todosCorrectos) marcarAcierto(MENSAJE_ACIERTO_CASOS);
    else marcarError('Todavía no coinciden los cuatro. Pregúntate de cada empleo: ¿la persona sigue trabajando ahí, aunque haga otra cosa, o el puesto casi no existe ya?');
  };

  // ── Acto 3 ────────────────────────────────────────────────────────────
  const comprobarHabilidades = () => {
    if (bloqueado) return;
    const todasCorrectas = HABILIDADES_IMPACTO.every((h) => veredictosHabilidades[h.id] === h.correcta);
    if (todasCorrectas) marcarAcierto(MENSAJE_ACIERTO_HABILIDADES);
    else marcarError('Todavía no coinciden las seis. Pregúntate de cada habilidad: ¿depende de un patrón fijo que una IA repite igual de bien, o depende del criterio de quien la usa?');
  };

  const comprobarPosturas = () => {
    if (bloqueado) return;
    const todasCorrectas = POSTURAS.every((p) => veredictosPosturas[p.id] === p.correcta);
    if (todasCorrectas) marcarAcierto(MENSAJE_ACIERTO_POSTURAS);
    else marcarError('Todavía no coinciden las cuatro. Pregúntate de cada frase: ¿la persona que la dice va a hacer algo distinto mañana, o sólo está describiendo un sentimiento?');
  };

  const elegirMismaRazon = (op: OpcionMcq) => {
    if (bloqueado) return;
    setMismaRazonId(op.id);
    if (op.correcta) marcarAcierto(op.explicacion);
    else marcarError(op.explicacion);
  };

  // ── Acto 4 ────────────────────────────────────────────────────────────
  const elegirTareaIvan = (tareaId: string, destino: DestinoIvan) => {
    if (bloqueado) return;
    if (clasificacionesIvan[tareaId]) return;
    const tarea = TAREAS_IVAN.find((t) => t.id === tareaId);
    if (!tarea) return;
    if (destino !== tarea.correcta) {
      lab.restar();
      setTareaIvanError(tareaId);
      return;
    }
    setTareaIvanError(null);
    const siguienteMapa = { ...clasificacionesIvan, [tareaId]: destino };
    setClasificacionesIvan(siguienteMapa);
    if (Object.keys(siguienteMapa).length === TAREAS_IVAN.length) {
      marcarAcierto(MENSAJE_ACIERTO_IVAN);
    }
  };

  const elegirReflexionFinal = (op: OpcionMcq) => {
    if (bloqueado) return;
    setReflexionFinalId(op.id);
    if (op.correcta) marcarAcierto(op.explicacion);
    else marcarError(op.explicacion);
  };

  if (lab.terminado) {
    return (
      <VentanaBase marca="Tecnia Radar" subtitulo="Panel de impacto · IA y trabajo">
        <div className="p-6 sm:p-10 text-center">
          <p className="text-5xl mb-4" aria-hidden="true">
            🌍
          </p>
          <h2 className="text-2xl font-extrabold text-white mb-2">Insignia: Criterio ante la IA</h2>
          <p className="text-slate-300 max-w-xl mx-auto">
            Clasificaste tareas reales entre las que la IA ya automatiza bien y las que siguen pidiendo criterio humano,
            comparaste empleos reales antes y después de la IA para ver que reemplazar el empleo completo es la excepción,
            separaste el criterio real del pánico y del optimismo ciego, y cerraste repartiendo un día real de trabajo entre
            una regla, un copiloto probado y tu propio criterio.
          </p>
          {alSalir && (
            <button type="button" onClick={alSalir} className="mt-6 px-6 py-3 rounded-xl bg-sky-500 text-white font-bold">
              Salir
            </button>
          )}
        </div>
      </VentanaBase>
    );
  }

  const acto = indiceActo(pasoActual);
  const todasTareasElegidas = TAREAS_REALES.every((t) => veredictosTareasReales[t.id]);
  const todosCasosElegidos = CASOS_ANTES_DESPUES.every((c) => veredictosCasos[c.id]);
  const todasHabilidadesElegidas = HABILIDADES_IMPACTO.every((h) => veredictosHabilidades[h.id]);
  const todasPosturasElegidas = POSTURAS.every((p) => veredictosPosturas[p.id]);

  return (
    <VentanaBase marca="Tecnia Radar" subtitulo="Panel de impacto · IA y trabajo">
      <div className="p-4 sm:p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-slate-400">
            Encargo <strong className="text-white">{pasoActual + 1}</strong> de {TOTAL}
          </p>
          <div className="flex gap-2 text-xs font-bold uppercase tracking-wider flex-wrap">
            {NOMBRES_ACTO.map((nombre, i) => {
              const activa = acto === i;
              const hecha = pasoActual >= LIMITES_ACTO[i + 1];
              return (
                <span
                  key={nombre}
                  className={`px-3 py-1.5 rounded-full ${
                    activa ? 'bg-sky-500 text-white' : hecha ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {hecha ? '✓ ' : ''}
                  {nombre}
                </span>
              );
            })}
          </div>
        </div>

        <div className="max-w-2xl mx-auto w-full flex flex-col gap-4 bg-[#0b1220] border border-sky-500/30 rounded-2xl p-6">
          {/* Encargo 1 · clasificar seis tareas reales */}
          {pasoActual === 0 && (
            <>
              <p className="text-sm text-slate-300">{INSTRUCCIONES[0]}</p>
              <ClasificacionDosOpciones
                items={TAREAS_REALES.map((t) => ({ id: t.id, etiqueta: t.texto }))}
                opciones={OPCIONES_TAREAS_REALES}
                seleccion={veredictosTareasReales}
                bloqueado={bloqueado}
                onElegir={(id, v) => setVeredictosTareasReales((prev) => ({ ...prev, [id]: v }))}
                onComprobar={comprobarTareasReales}
                puedeComprobar={todasTareasElegidas}
              />
            </>
          )}

          {/* Encargo 2 · qué tienen en común las tareas automatizables */}
          {pasoActual === 1 && (
            <McqBloque pregunta={INSTRUCCIONES[1]} opciones={OPCIONES_PATRON_COMUN} elegidoId={patronComunId} bloqueado={bloqueado} onElegir={elegirPatronComun} />
          )}

          {/* Encargo 3 · caso de Ana, cajera de banco */}
          {pasoActual === 2 && (
            <>
              <p className="text-sm text-slate-300 leading-relaxed">{CASO_ANA}</p>
              <McqBloque pregunta="¿Qué pasó de verdad con el empleo de Ana?" opciones={OPCIONES_CASO_ANA} elegidoId={casoAnaId} bloqueado={bloqueado} onElegir={elegirCasoAna} />
            </>
          )}

          {/* Encargo 4 · cuatro casos antes/después */}
          {pasoActual === 3 && (
            <>
              <p className="text-sm text-slate-300">{INSTRUCCIONES[3]}</p>
              <ClasificacionDosOpciones
                items={CASOS_ANTES_DESPUES.map((c) => ({ id: c.id, etiqueta: c.texto }))}
                opciones={OPCIONES_CAMBIA_O_REEMPLAZA}
                seleccion={veredictosCasos}
                bloqueado={bloqueado}
                onElegir={(id, v) => setVeredictosCasos((prev) => ({ ...prev, [id]: v }))}
                onComprobar={comprobarCasos}
                puedeComprobar={todosCasosElegidos}
              />
            </>
          )}

          {/* Encargo 5 · qué habilidades importan más o menos ahora */}
          {pasoActual === 4 && (
            <>
              <p className="text-sm text-slate-300">{INSTRUCCIONES[4]}</p>
              <ClasificacionDosOpciones
                items={HABILIDADES_IMPACTO.map((h) => ({ id: h.id, etiqueta: h.texto }))}
                opciones={OPCIONES_IMPORTA}
                seleccion={veredictosHabilidades}
                bloqueado={bloqueado}
                onElegir={(id, v) => setVeredictosHabilidades((prev) => ({ ...prev, [id]: v }))}
                onComprobar={comprobarHabilidades}
                puedeComprobar={todasHabilidadesElegidas}
              />
            </>
          )}

          {/* Encargo 6 · pánico, optimismo ciego o criterio real */}
          {pasoActual === 5 && (
            <>
              <p className="text-sm text-slate-300">{INSTRUCCIONES[5]}</p>
              <ClasificacionDosOpciones
                items={POSTURAS.map((p) => ({ id: p.id, etiqueta: p.texto }))}
                opciones={OPCIONES_PREPARA}
                seleccion={veredictosPosturas}
                bloqueado={bloqueado}
                onElegir={(id, v) => setVeredictosPosturas((prev) => ({ ...prev, [id]: v }))}
                onComprobar={comprobarPosturas}
                puedeComprobar={todasPosturasElegidas}
              />
            </>
          )}

          {/* Encargo 7 · por qué las dos posturas están mal por la misma razón */}
          {pasoActual === 6 && (
            <McqBloque pregunta={INSTRUCCIONES[6]} opciones={OPCIONES_MISMA_RAZON} elegidoId={mismaRazonId} bloqueado={bloqueado} onElegir={elegirMismaRazon} />
          )}

          {/* Encargo 8 · el caso de Iván, cierre que integra las tres paradas */}
          {pasoActual === 7 && (
            <>
              <p className="text-sm text-slate-300">{INSTRUCCIONES[7]}</p>
              <TareasIvanWidget
                tareas={TAREAS_IVAN}
                opciones={OPCIONES_DESTINO_IVAN}
                clasificaciones={clasificacionesIvan}
                tareaConError={tareaIvanError}
                onClasificar={elegirTareaIvan}
              />
            </>
          )}

          {/* Encargo 9 · reflexión final */}
          {pasoActual === 8 && (
            <McqBloque pregunta={INSTRUCCIONES[8]} opciones={OPCIONES_REFLEXION_FINAL} elegidoId={reflexionFinalId} bloqueado={bloqueado} onElegir={elegirReflexionFinal} />
          )}

          <MensajeYAvance mensaje={mensaje} esUltimo={pasoActual === TOTAL - 1} onSiguiente={siguiente} onTerminar={terminar} />
        </div>
      </div>
    </VentanaBase>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 6 · Widgets locales
// ═══════════════════════════════════════════════════════════════════════════

/** Mensaje de acierto/error + botón «Siguiente»/«Terminar» — mismo patrón que
 *  `n9-empleos-tecnologicos` y las dos paradas hermanas de esta unidad. */
function MensajeYAvance({
  mensaje,
  esUltimo,
  onSiguiente,
  onTerminar,
}: {
  mensaje: { ok: boolean; texto: string } | null;
  esUltimo: boolean;
  onSiguiente: () => void;
  onTerminar: () => void;
}) {
  if (!mensaje) return null;
  return (
    <div className="flex flex-col gap-2" data-testid="explicacion">
      <p className={`text-sm font-bold ${mensaje.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{mensaje.ok ? '¡Correcto!' : 'Todavía no.'}</p>
      <p className="text-sm text-slate-200 leading-relaxed">{mensaje.texto}</p>
      {mensaje.ok && (
        <button
          type="button"
          data-testid={esUltimo ? 'terminar' : 'siguiente'}
          onClick={esUltimo ? onTerminar : onSiguiente}
          className="mt-1 px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold self-start"
        >
          {esUltimo ? 'Recibir la insignia' : 'Siguiente'}
        </button>
      )}
    </div>
  );
}

/** Lista de N ítems, cada uno con dos opciones de clasificación — reusada por
 *  los cuatro encargos de clasificar en grupo (tareas reales, casos
 *  antes/después, habilidades, posturas). Mismo patrón que
 *  `ClasificacionDosOpciones` en `LabEmpleosTecnologicos.tsx`. */
function ClasificacionDosOpciones({
  items,
  opciones,
  seleccion,
  bloqueado,
  onElegir,
  onComprobar,
  puedeComprobar,
}: {
  items: { id: string; etiqueta: string }[];
  opciones: [{ valor: string; etiqueta: string }, { valor: string; etiqueta: string }];
  seleccion: Record<string, string | undefined>;
  bloqueado: boolean;
  onElegir: (id: string, valor: string) => void;
  onComprobar: () => void;
  puedeComprobar: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2" data-testid="lista-clasificacion">
        {items.map((it) => (
          <li key={it.id} className="flex flex-col gap-2 bg-slate-800 rounded-xl px-4 py-3">
            <span className="text-sm text-white">{it.etiqueta}</span>
            <div className="flex flex-wrap gap-2">
              {opciones.map((op) => (
                <button
                  key={op.valor}
                  type="button"
                  data-testid="clasificacion-opcion"
                  disabled={bloqueado}
                  onClick={() => onElegir(it.id, op.valor)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 ${
                    seleccion[it.id] === op.valor ? 'bg-sky-500 text-white' : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {op.etiqueta}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {!bloqueado && (
        <button
          type="button"
          data-testid="comprobar-clasificacion"
          disabled={!puedeComprobar}
          onClick={onComprobar}
          className="px-5 py-3 rounded-xl bg-sky-500 text-white font-bold disabled:opacity-50 self-start"
        >
          Comprobar
        </button>
      )}
    </div>
  );
}

/** Bloque de opción múltiple, reusado por las cuatro reflexiones (patrón
 *  común, caso de Ana, misma razón, reflexión final). */
function McqBloque({
  pregunta,
  opciones,
  elegidoId,
  bloqueado,
  onElegir,
}: {
  pregunta: string;
  opciones: OpcionMcq[];
  elegidoId: string | null;
  bloqueado: boolean;
  onElegir: (opcion: OpcionMcq) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-lg text-white font-semibold leading-relaxed">{pregunta}</p>
      <div className="flex flex-col gap-2" data-testid="opciones-mcq">
        {opciones.map((op) => (
          <button
            key={op.id}
            type="button"
            data-testid="opcion-mcq"
            disabled={bloqueado}
            onClick={() => onElegir(op)}
            className={`px-4 py-3 rounded-xl text-left text-sm disabled:opacity-50 ${
              elegidoId === op.id
                ? op.correcta
                  ? 'bg-emerald-500/20 border border-emerald-400 text-white'
                  : 'bg-rose-500/20 border border-rose-400 text-white'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {op.texto}
          </button>
        ))}
      </div>
    </div>
  );
}

/** El caso de Iván: cada tarea se clasifica por separado, con feedback
 *  inmediato y su propio «por qué» cuando se elige el bolsillo equivocado —
 *  mismo patrón que el cierre de `LabIaCopiloto.tsx` (`TAREAS_CIERRE`), pero
 *  con tres bolsillos (regla / copiloto / criterio) en vez de dos. */
function TareasIvanWidget({
  tareas,
  opciones,
  clasificaciones,
  tareaConError,
  onClasificar,
}: {
  tareas: TareaIvan[];
  opciones: { valor: DestinoIvan; etiqueta: string }[];
  clasificaciones: Partial<Record<string, DestinoIvan>>;
  tareaConError: string | null;
  onClasificar: (id: string, destino: DestinoIvan) => void;
}) {
  return (
    <div className="flex flex-col gap-3" data-testid="tareas-ivan">
      {tareas.map((t) => {
        const elegida = clasificaciones[t.id];
        return (
          <div key={t.id} className={`flex flex-col gap-2 rounded-xl px-4 py-3 ${elegida ? 'bg-emerald-500/10' : 'bg-slate-800'}`} data-testid={`tarea-ivan-${t.id}`}>
            <p className="text-sm text-white">{t.texto}</p>
            <div className="flex flex-wrap gap-2">
              {opciones.map((op) => (
                <button
                  key={op.valor}
                  type="button"
                  data-testid={`tarea-ivan-${t.id}-${op.valor}`}
                  disabled={Boolean(elegida)}
                  onClick={() => onClasificar(t.id, op.valor)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 ${
                    elegida === op.valor ? 'bg-sky-500 text-white' : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {op.etiqueta}
                </button>
              ))}
            </div>
            {tareaConError === t.id && !elegida && <p className="text-xs text-rose-300 leading-relaxed">{t.porque}</p>}
          </div>
        );
      })}
    </div>
  );
}

export default LabIaYTrabajo;
