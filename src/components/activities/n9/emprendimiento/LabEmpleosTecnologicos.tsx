'use client';

import { useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '../../../simuladores/VentanaBase';

/**
 * N9 · «Emprendimiento e identidad digital» — «Los nuevos empleos tech»,
 * CIERRE de la unidad, parada 3 de 3. Nivel 9 = 3.º de Secundaria, 14–15 años.
 *
 * Mismo papel que `n8-derechos-y-licencias` en su unidad (leído entero antes
 * de escribir esta clase): no enseña un programa nuevo, aplica criterio. El
 * «programa» de hoy es un panel de orientación —Tecnia Brújula— con casos
 * reales, no un simulador de software: por eso corre sobre `VentanaBase` +
 * `useLabActividad` a secas, el mismo armazón de `LabDerechosYLicencias.tsx`,
 * sin inventar un motor nuevo ni forzar uno que no encaja aquí (no hay
 * páginas que navegar como en `n9-ecommerce-y-marketing`, no hay código que
 * escribir como en `n9-marca-personal`).
 *
 * ── El predicado real: `mejorEmpleoPara()` (documento §46, regla anti-épsilon) ──
 *
 * Nunca hay una tabla oculta «este perfil → este empleo». Cada empleo tech
 * declara sus DOS rasgos clave (de un vocabulario compartido de seis), cada
 * perfil declara sus rasgos reales, y `mejorEmpleoPara()` calcula cuál empleo
 * comparte más rasgos con ese perfil — el mismo patrón que `puedesUsarla()`
 * en la hermana de licencias o `claridadFicha()` en la de e-commerce. Si
 * mañana se agrega un sexto empleo o un perfil nuevo, el mismo cálculo sigue
 * sirviendo sin tocar el veredicto de nadie más.
 *
 * ── Qué NO repite de N8 «Aprendo con la IA II» ──────────────────────────────
 *
 * Esa unidad ya enseñó qué es una alucinación y cómo verificar una respuesta
 * de IA. Aquí no se explica ninguna de las dos cosas otra vez: el Acto 3 sólo
 * APLICA ese criterio ya aprendido a un caso nuevo —qué tareas de un empleo
 * tech automatiza hoy una IA y cuáles siguen pidiendo juicio humano—, tal
 * como pidió la propia encomienda.
 *
 * ── El cierre integra las tres paradas, no las repite ───────────────────────
 *
 * El Acto 4 no es un tercer personaje suelto: Ximena construyó su portafolio
 * con el mismo criterio que Bruno usó en la parada 1, y tropezó con el mismo
 * problema de claridad que Regina resolvió en su tienda de la parada 2. El
 * alumno decide su camino tech combinando exactamente esas dos paradas más el
 * criterio de hoy —sin reescribir a Bruno ni a Regina, que ya tienen su
 * propia historia cerrada en sus propios laboratorios.
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1 · El vocabulario de rasgos y los cinco empleos — el predicado real
// ═══════════════════════════════════════════════════════════════════════════

type Rasgo = 'resuelve-acertijos' | 'diseno-empatia' | 'logica-datos' | 'organiza-personas' | 'explica-escribe' | 'programa';

interface EmpleoTech {
  id: string;
  nombre: string;
  emoji: string;
  descripcion: string;
  /** Los dos rasgos que de verdad definen este empleo — nunca una lista arbitraria. */
  rasgosClave: [Rasgo, Rasgo];
  requiereProgramarComoTarea: boolean;
}

const EMPLEO_UX: EmpleoTech = {
  id: 'ux',
  nombre: 'Diseñador/a de experiencia de usuario (UX)',
  emoji: '🎨',
  descripcion:
    'Investiga cómo usa la gente una app o un sitio, encuentra en qué momento se confunde, y rediseña esa parte para que sea más clara.',
  rasgosClave: ['diseno-empatia', 'explica-escribe'],
  requiereProgramarComoTarea: false,
};

const EMPLEO_ANALISTA: EmpleoTech = {
  id: 'analista-datos',
  nombre: 'Analista de datos',
  emoji: '📊',
  descripcion: 'Revisa números y tablas —ventas, visitas, encuestas— para encontrar un patrón que ayude a tomar una decisión real.',
  rasgosClave: ['logica-datos', 'resuelve-acertijos'],
  requiereProgramarComoTarea: false,
};

const EMPLEO_CIBERSEGURIDAD: EmpleoTech = {
  id: 'ciberseguridad',
  nombre: 'Especialista en ciberseguridad',
  emoji: '🛡️',
  descripcion:
    'Piensa como alguien que quiere entrar sin permiso a un sistema, para encontrar la grieta antes que esa persona. A veces escribe pequeños scripts para automatizar esa búsqueda.',
  rasgosClave: ['resuelve-acertijos', 'programa'],
  requiereProgramarComoTarea: true,
};

const EMPLEO_GESTOR: EmpleoTech = {
  id: 'gestor-producto',
  nombre: 'Gestor/a de producto',
  emoji: '🧭',
  descripcion:
    'Decide qué se construye primero, escucha a quien programa y a quien vende, y mantiene a todo el equipo enfocado en el mismo objetivo.',
  rasgosClave: ['organiza-personas', 'explica-escribe'],
  requiereProgramarComoTarea: false,
};

const EMPLEO_CREADOR: EmpleoTech = {
  id: 'creador-contenido',
  nombre: 'Creador/a de contenido técnico',
  emoji: '✍️',
  descripcion: 'Escribe guías y tutoriales que explican cómo usar un programa, para que alguien nuevo no se quede atorado a la mitad.',
  rasgosClave: ['explica-escribe', 'resuelve-acertijos'],
  requiereProgramarComoTarea: false,
};

const EMPLEOS: EmpleoTech[] = [EMPLEO_UX, EMPLEO_ANALISTA, EMPLEO_CIBERSEGURIDAD, EMPLEO_GESTOR, EMPLEO_CREADOR];

/** Cuenta cuántos rasgos comparte un perfil con cada empleo y devuelve el
 *  que más comparte — el predicado real, nunca un id copiado a mano. */
function mejorEmpleoPara(rasgosPersona: Rasgo[]): EmpleoTech {
  let mejor = EMPLEOS[0];
  let mejorPuntaje = -1;
  for (const empleo of EMPLEOS) {
    const puntaje = empleo.rasgosClave.filter((r) => rasgosPersona.includes(r)).length;
    if (puntaje > mejorPuntaje) {
      mejorPuntaje = puntaje;
      mejor = empleo;
    }
  }
  return mejor;
}

// ═══════════════════════════════════════════════════════════════════════════
// 2 · Acto 1 «Empleos tech más allá de programar» — clasificar + dos perfiles
// ═══════════════════════════════════════════════════════════════════════════

const OPCIONES_PROGRAMAR: [{ valor: string; etiqueta: string }, { valor: string; etiqueta: string }] = [
  { valor: 'si', etiqueta: '💻 Sí, programar es su tarea principal' },
  { valor: 'no', etiqueta: '🙅 No, su tarea principal es otra' },
];

interface PerfilPersona {
  id: string;
  nombre: string;
  historia: string;
  rasgos: Rasgo[];
}

const PERFIL_NAOMI: PerfilPersona = {
  id: 'naomi',
  nombre: 'Naomi',
  historia:
    'A Naomi le encanta armar encuestas para saber si algo se entiende bien. Cuando alguien se traba usando una app en su celular, ella no se queda tranquila hasta encontrar qué palabra o qué botón lo confundió — y hasta explicárselo a quien programó esa parte.',
  rasgos: ['diseno-empatia', 'explica-escribe'],
};

const PERFIL_DIEGO: PerfilPersona = {
  id: 'diego',
  nombre: 'Diego',
  historia:
    'A Diego le fascina encontrar el hueco en las reglas de un juego —el detalle que nadie más notó—. Además programa pequeños scripts para automatizar tareas aburridas de su computadora, sólo por resolver el acertijo de que funcionen.',
  rasgos: ['resuelve-acertijos', 'programa'],
};

const MENSAJE_ACIERTO_EMPLEOS =
  'Las cinco coinciden: sólo ciberseguridad tiene programar como tarea central —a veces con scripts propios para automatizar la búsqueda de grietas—. Las otras cuatro son empleos de tecnología de verdad y su tarea principal es otra: diseñar pensando en la gente, leer patrones en datos, organizar a un equipo o explicar algo difícil con claridad.';

const MENSAJE_ACIERTO_NAOMI =
  'Coincide: a Naomi le importa cómo se siente alguien usando algo —diseñar con empatía— y no se detiene hasta poder explicarlo con claridad. Exactamente lo que hace un/a diseñador/a UX: investigar dónde está la confusión y explicar cómo resolverla.';

const MENSAJE_ACIERTO_DIEGO =
  'Coincide: a Diego le fascina encontrar el hueco que nadie más notó, y programa para resolver ese acertijo. Exactamente el trabajo de ciberseguridad: encontrar la grieta antes que quien quiere aprovecharla, con scripts propios si hace falta.';

const MENSAJE_ERROR_PERFIL = 'Todavía no. Relee la historia: ¿qué se le da bien de verdad, más allá de qué tan familiar te suene el nombre del empleo?';

// ═══════════════════════════════════════════════════════════════════════════
// 3 · Acto 2 «Habilidades técnicas y transferibles»
// ═══════════════════════════════════════════════════════════════════════════

interface Habilidad {
  id: string;
  texto: string;
  esTecnicaEspecifica: boolean;
}

const HABILIDADES: Habilidad[] = [
  { id: 'python', texto: 'Programar en Python', esTecnicaEspecifica: true },
  { id: 'escucha', texto: 'Escuchar a un usuario y entender qué le frustra de una app', esTecnicaEspecifica: false },
  { id: 'excel', texto: 'Usar fórmulas avanzadas de Excel para analizar una tabla de datos', esTecnicaEspecifica: true },
  { id: 'explica-simple', texto: 'Explicar un problema técnico a alguien que no sabe nada del tema', esTecnicaEspecifica: false },
  { id: 'firewall', texto: 'Configurar las reglas de un firewall', esTecnicaEspecifica: true },
  { id: 'organiza-equipo', texto: 'Organizar las tareas de un equipo para cumplir una fecha límite', esTecnicaEspecifica: false },
];

const OPCIONES_HABILIDAD: [{ valor: string; etiqueta: string }, { valor: string; etiqueta: string }] = [
  { valor: 'tecnica', etiqueta: '🔧 Técnica específica' },
  { valor: 'transferible', etiqueta: '🌐 Transferible' },
];

interface OpcionMcq {
  id: string;
  texto: string;
  correcta: boolean;
  explicacion: string;
}

const HISTORIA_FERNANDA =
  'Fernanda no sabe programar. Aun así, en su primer mes como gestora de producto en una startup, su equipo de desarrollo dejó de perder tiempo discutiendo qué hacer primero: ella escucha a quien vende, escucha a quien programa, y decide con claridad el orden. La contrataron por eso.';

const OPCIONES_FERNANDA: OpcionMcq[] = [
  {
    id: 'a',
    texto: 'Porque las empresas de tecnología ya casi no necesitan a nadie que programe',
    correcta: false,
    explicacion: 'No: programar sigue siendo esencial en tecnología. Lo que cambia es que no TODOS los empleos tech son ése.',
  },
  {
    id: 'b',
    texto:
      'Porque su empleo depende de habilidades transferibles —organizar personas, comunicarse con claridad— que un equipo de desarrollo necesita tanto como el código',
    correcta: true,
    explicacion:
      'Exacto. Un equipo que programa muy bien pero no sabe qué construir primero, o no logra explicarle al resto por qué, pierde tiempo y dinero igual. Esa organización y esa claridad son el trabajo real de Fernanda.',
  },
  {
    id: 'c',
    texto: 'Porque en secreto sí aprendió a programar y nadie lo sabe',
    correcta: false,
    explicacion: 'No hay ningún dato en su historia que diga eso — es inventar información que no está.',
  },
  {
    id: 'd',
    texto: 'Porque gestionar un producto no es un empleo real de tecnología',
    correcta: false,
    explicacion: 'Sí lo es: decidir qué se construye primero es una decisión técnica y de negocio a la vez, y sin ella un equipo se pierde.',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 4 · Acto 3 «La IA y estos empleos» — sin repetir N8 «Aprendo con la IA II»
// ═══════════════════════════════════════════════════════════════════════════

interface TareaEmpleo {
  id: string;
  texto: string;
  seAutomatizaHoy: boolean;
}

const TAREAS_ANALISTA: TareaEmpleo[] = [
  { id: 'limpiar', texto: 'Juntar y limpiar miles de filas de una tabla revuelta', seAutomatizaHoy: true },
  { id: 'graficar', texto: 'Generar una gráfica a partir de datos ya limpios', seAutomatizaHoy: true },
  { id: 'pregunta', texto: 'Decidir qué pregunta del negocio vale la pena investigar con esos datos', seAutomatizaHoy: false },
  {
    id: 'explica-decision',
    texto: 'Explicarle a la dirección por qué una caída de ventas específica importa y qué hacer al respecto',
    seAutomatizaHoy: false,
  },
];

const OPCIONES_TAREA: [{ valor: string; etiqueta: string }, { valor: string; etiqueta: string }] = [
  { valor: 'automatiza', etiqueta: '🤖 Ya la automatiza una IA' },
  { valor: 'criterio', etiqueta: '🧠 Sigue pidiendo criterio humano' },
];

const MENSAJE_ACIERTO_TAREAS =
  'Las cuatro coinciden: limpiar una tabla revuelta y generar una gráfica ya las hace una IA en segundos. Decidir qué pregunta del negocio vale la pena investigar, y explicar por qué una caída de ventas importa, siguen pidiendo a alguien que conozca el contexto real y se responsabilice de la decisión.';

const OPCIONES_REFLEXION_IA: OpcionMcq[] = [
  {
    id: 'a',
    texto: 'Porque la IA nunca puede procesar números tan rápido como una persona',
    correcta: false,
    explicacion: 'Es justo al revés: limpiar y graficar datos es exactamente lo que una IA hace más rápido que una persona.',
  },
  {
    id: 'b',
    texto:
      'Porque decidir qué pregunta vale la pena investigar depende del contexto real de la empresa, y alguien tiene que responsabilizarse del resultado — el mismo criterio que ya usaste para verificar una respuesta de IA en N8: es un punto de partida, no la decisión final',
    correcta: true,
    explicacion:
      'Exacto. Limpiar una tabla es un procedimiento; decidir qué importa investigar y responder por esa decisión es criterio — y ese criterio sigue siendo tuyo, con IA o sin ella.',
  },
  {
    id: 'c',
    texto: 'Porque a la IA no le interesan los negocios',
    correcta: false,
    explicacion: 'La IA no "tiene interés" en nada — el problema no es de interés, es de quién asume la responsabilidad de la decisión.',
  },
  {
    id: 'd',
    texto: 'Porque las tablas de datos son secretas y una IA no puede leerlas',
    correcta: false,
    explicacion: 'No: una IA puede leer una tabla de datos perfectamente. El límite no está en leerla, está en decidir qué pregunta importa.',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 5 · Acto 4 «El camino de Ximena» — cierre que integra las tres paradas
// ═══════════════════════════════════════════════════════════════════════════

const PERFIL_XIMENA: PerfilPersona = {
  id: 'ximena',
  nombre: 'Ximena',
  historia:
    'Ximena armó su portafolio con el mismo criterio que viste con Bruno: en cada proyecto no puso sólo una captura bonita —escribió al lado qué confundía a la gente antes de que ella lo rediseñara—. Y cuando ayudó a su prima a vender llaveros en línea, como hiciste con la tienda de Regina, lo que más le costó no fue tomar las fotos: fue reescribir la descripción del producto hasta que cualquiera la entendiera sin preguntar.',
  rasgos: ['diseno-empatia', 'explica-escribe'],
};

const MENSAJE_ACIERTO_XIMENA =
  'Coincide con el mismo empleo que Naomi, por una razón distinta: a Ximena se le da bien encontrar qué confunde a alguien —como en su portafolio— y reescribirlo hasta que se entienda solo —como en la tienda de su prima—. Ese es el corazón de UX: diseñar pensando en quien usa la cosa, y saber explicarlo.';

const OPCIONES_REFLEXION_CIERRE: OpcionMcq[] = [
  {
    id: 'a',
    texto:
      'Porque si sólo te fijas en lo que te gusta hoy, podrías estar preparándote para hacer justo la parte de ese empleo que una IA va a hacer mejor y más barato en unos años — conviene apostarle también a la parte de cualquier empleo tech que sigue pidiendo decidir, explicar y responsabilizarte de un resultado',
    correcta: true,
    explicacion: 'Exacto. Elegir un camino tech con criterio es cruzar dos cosas: qué se te da bien de verdad, y qué parte de ese trabajo va a seguir necesitando a una persona.',
  },
  {
    id: 'b',
    texto: 'Porque la IA va a reemplazar todos los empleos tech el próximo año',
    correcta: false,
    explicacion: 'Eso es una exageración: la IA cambia tareas dentro de un empleo, no borra la profesión completa de un día para otro.',
  },
  {
    id: 'c',
    texto: 'Porque a las empresas todavía no les importa la inteligencia artificial',
    correcta: false,
    explicacion: 'Es lo contrario: cada vez más empresas ya la usan — por eso importa pensar qué parte de un empleo sigue pidiendo criterio humano.',
  },
  {
    id: 'd',
    texto: 'Porque elegir un empleo tech no tiene nada que ver con la inteligencia artificial',
    correcta: false,
    explicacion: 'Sí tiene que ver: es justo lo que viste en el Acto 3 — algunas tareas de cada empleo ya las automatiza, otras no.',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 6 · El laboratorio — 9 encargos, un solo índice lineal
// ═══════════════════════════════════════════════════════════════════════════

const TOTAL = 9;

const NOMBRES_ACTO = ['Empleos tech más allá de programar', 'Habilidades técnicas y transferibles', 'La IA y estos empleos', 'El camino de Ximena'] as const;
/** Índice del primer paso de cada acto; el último valor es el total. */
const LIMITES_ACTO = [0, 3, 5, 7, TOTAL];

function indiceActo(paso: number): number {
  return LIMITES_ACTO.findIndex((limite, i) => i < LIMITES_ACTO.length - 1 && paso < LIMITES_ACTO[i + 1]);
}

const INSTRUCCIONES: string[] = [
  'Cinco empleos tech reales. Para cada uno, decide: ¿programar es su tarea principal, o es otra cosa?',
  'Lee la historia de Naomi. ¿A qué empleo tech encaja mejor lo que se le da bien de verdad?',
  'Lee la historia de Diego. ¿A qué empleo tech encaja mejor lo que se le da bien de verdad?',
  'Seis habilidades. Clasifica cada una: ¿es técnica específica de un puesto, o transferible a cualquier trabajo?',
  'Fernanda no sabe programar y trabaja en tecnología. ¿Por qué sí puede hacerlo?',
  'Cuatro tareas de un/a analista de datos. ¿Cuáles ya automatiza una IA, y cuáles siguen pidiendo criterio humano?',
  '¿Por qué decidir qué pregunta investigar sigue pidiendo criterio humano, aunque la IA ya limpie y grafique los datos sola?',
  'Lee la historia de Ximena —su portafolio como el de Bruno, su tienda como la de Regina—. ¿A qué camino tech le conviene prepararse?',
  'Además de lo que se te da bien, ¿por qué también importa pensar en qué va a seguir necesitando criterio humano dentro de ese empleo?',
];

export function LabEmpleosTecnologicos(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const lab = useLabActividad(props, TOTAL, {});

  const [pasoActual, setPasoActual] = useState(0);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [bloqueado, setBloqueado] = useState(false);

  // Acto 1
  const [veredictosEmpleos, setVeredictosEmpleos] = useState<Record<string, string | undefined>>({});
  const [perfilNaomiId, setPerfilNaomiId] = useState<string | null>(null);
  const [perfilDiegoId, setPerfilDiegoId] = useState<string | null>(null);

  // Acto 2
  const [veredictosHabilidades, setVeredictosHabilidades] = useState<Record<string, string | undefined>>({});
  const [reflexionFernandaId, setReflexionFernandaId] = useState<string | null>(null);

  // Acto 3
  const [veredictosTareas, setVeredictosTareas] = useState<Record<string, string | undefined>>({});
  const [reflexionIaId, setReflexionIaId] = useState<string | null>(null);

  // Acto 4
  const [perfilXimenaId, setPerfilXimenaId] = useState<string | null>(null);
  const [reflexionCierreId, setReflexionCierreId] = useState<string | null>(null);

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
  const comprobarEmpleos = () => {
    if (bloqueado) return;
    const todosCorrectos = EMPLEOS.every((e) => veredictosEmpleos[e.id] === (e.requiereProgramarComoTarea ? 'si' : 'no'));
    if (todosCorrectos) marcarAcierto(MENSAJE_ACIERTO_EMPLEOS);
    else marcarError('Todavía no coinciden los cinco. Revisa la descripción de cada empleo: ¿su tarea principal es escribir código, o es otra cosa?');
  };

  const comprobarPerfil = (perfil: PerfilPersona, seleccionId: string | null, mensajeAcierto: string) => {
    if (bloqueado || !seleccionId) return;
    const correctoId = mejorEmpleoPara(perfil.rasgos).id;
    if (seleccionId === correctoId) marcarAcierto(mensajeAcierto);
    else marcarError(MENSAJE_ERROR_PERFIL);
  };

  // ── Acto 2 ────────────────────────────────────────────────────────────
  const comprobarHabilidades = () => {
    if (bloqueado) return;
    const todasCorrectas = HABILIDADES.every(
      (h) => veredictosHabilidades[h.id] === (h.esTecnicaEspecifica ? 'tecnica' : 'transferible'),
    );
    if (todasCorrectas) {
      marcarAcierto(
        'Las seis coinciden: programar en Python, usar fórmulas avanzadas de Excel y configurar un firewall son técnicas específicas de un puesto. Escuchar a un usuario, explicar algo técnico en simple y organizar un equipo son transferibles: sirven en cualquier empleo, tech o no.',
      );
    } else {
      marcarError('Todavía no coinciden las seis. Pregúntate de cada una: ¿esto se aprende sólo para ESTE puesto, o sirve en cualquier trabajo donde haya personas?');
    }
  };

  const elegirReflexionFernanda = (op: OpcionMcq) => {
    if (bloqueado) return;
    setReflexionFernandaId(op.id);
    if (op.correcta) marcarAcierto(op.explicacion);
    else marcarError(op.explicacion);
  };

  // ── Acto 3 ────────────────────────────────────────────────────────────
  const comprobarTareas = () => {
    if (bloqueado) return;
    const todasCorrectas = TAREAS_ANALISTA.every((t) => veredictosTareas[t.id] === (t.seAutomatizaHoy ? 'automatiza' : 'criterio'));
    if (todasCorrectas) marcarAcierto(MENSAJE_ACIERTO_TAREAS);
    else marcarError('Todavía no coinciden las cuatro. Pregúntate de cada tarea: ¿es un procedimiento que se repite igual siempre, o hace falta decidir algo nuevo cada vez?');
  };

  const elegirReflexionIa = (op: OpcionMcq) => {
    if (bloqueado) return;
    setReflexionIaId(op.id);
    if (op.correcta) marcarAcierto(op.explicacion);
    else marcarError(op.explicacion);
  };

  // ── Acto 4 ────────────────────────────────────────────────────────────
  const elegirReflexionCierre = (op: OpcionMcq) => {
    if (bloqueado) return;
    setReflexionCierreId(op.id);
    if (op.correcta) {
      lab.avanzar();
      setMensaje({ ok: true, texto: op.explicacion });
      setBloqueado(true);
    } else {
      marcarError(op.explicacion);
    }
  };

  if (lab.terminado) {
    return (
      <VentanaBase marca="Tecnia Brújula" subtitulo="Panel de orientación · empleos tech">
        <div className="p-6 sm:p-10 text-center">
          <p className="text-5xl mb-4" aria-hidden="true">
            🎯
          </p>
          <h2 className="text-2xl font-extrabold text-white mb-2">Insignia: Camino con criterio</h2>
          <p className="text-slate-300 max-w-xl mx-auto">
            Clasificaste cinco empleos tech reales más allá de «programador», relacionaste dos perfiles con el empleo que de verdad
            les queda, separaste habilidades técnicas de transferibles con el caso de alguien que no programa y sí trabaja en
            tecnología, decidiste qué tareas automatiza hoy una IA y cuáles siguen pidiendo criterio humano, y cerraste
            combinando marca personal, negocio y criterio para decidir el camino de un caso nuevo.
          </p>
          {alSalir && (
            <button type="button" onClick={alSalir} className="mt-6 px-6 py-3 rounded-xl bg-violet-500 text-white font-bold">
              Salir
            </button>
          )}
        </div>
      </VentanaBase>
    );
  }

  const acto = indiceActo(pasoActual);
  const todosEmpleosElegidos = EMPLEOS.every((e) => veredictosEmpleos[e.id]);
  const todasHabilidadesElegidas = HABILIDADES.every((h) => veredictosHabilidades[h.id]);
  const todasTareasElegidas = TAREAS_ANALISTA.every((t) => veredictosTareas[t.id]);

  return (
    <VentanaBase marca="Tecnia Brújula" subtitulo="Panel de orientación · empleos tech">
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
                    activa ? 'bg-violet-500 text-white' : hecha ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {hecha ? '✓ ' : ''}
                  {nombre}
                </span>
              );
            })}
          </div>
        </div>

        <div className="max-w-2xl mx-auto w-full flex flex-col gap-4 bg-[#0b1220] border border-violet-500/30 rounded-2xl p-6">
          {/* Encargo 1 · clasificar los cinco empleos */}
          {pasoActual === 0 && (
            <>
              <p className="text-sm text-slate-300">{INSTRUCCIONES[0]}</p>
              <ClasificacionDosOpciones
                items={EMPLEOS.map((e) => ({ id: e.id, etiqueta: `${e.emoji} ${e.nombre}`, sub: e.descripcion }))}
                opciones={OPCIONES_PROGRAMAR}
                seleccion={veredictosEmpleos}
                bloqueado={bloqueado}
                onElegir={(id, v) => setVeredictosEmpleos((prev) => ({ ...prev, [id]: v }))}
                onComprobar={comprobarEmpleos}
                puedeComprobar={todosEmpleosElegidos}
              />
            </>
          )}

          {/* Encargo 2 · perfil de Naomi */}
          {pasoActual === 1 && (
            <SeleccionEmpleo
              perfil={PERFIL_NAOMI}
              seleccionId={perfilNaomiId}
              bloqueado={bloqueado}
              onSeleccionar={setPerfilNaomiId}
              onComprobar={() => comprobarPerfil(PERFIL_NAOMI, perfilNaomiId, MENSAJE_ACIERTO_NAOMI)}
            />
          )}

          {/* Encargo 3 · perfil de Diego */}
          {pasoActual === 2 && (
            <SeleccionEmpleo
              perfil={PERFIL_DIEGO}
              seleccionId={perfilDiegoId}
              bloqueado={bloqueado}
              onSeleccionar={setPerfilDiegoId}
              onComprobar={() => comprobarPerfil(PERFIL_DIEGO, perfilDiegoId, MENSAJE_ACIERTO_DIEGO)}
            />
          )}

          {/* Encargo 4 · clasificar seis habilidades */}
          {pasoActual === 3 && (
            <>
              <p className="text-sm text-slate-300">{INSTRUCCIONES[3]}</p>
              <ClasificacionDosOpciones
                items={HABILIDADES.map((h) => ({ id: h.id, etiqueta: h.texto }))}
                opciones={OPCIONES_HABILIDAD}
                seleccion={veredictosHabilidades}
                bloqueado={bloqueado}
                onElegir={(id, v) => setVeredictosHabilidades((prev) => ({ ...prev, [id]: v }))}
                onComprobar={comprobarHabilidades}
                puedeComprobar={todasHabilidadesElegidas}
              />
            </>
          )}

          {/* Encargo 5 · caso de Fernanda */}
          {pasoActual === 4 && (
            <>
              <p className="text-sm text-slate-300">{HISTORIA_FERNANDA}</p>
              <McqBloque pregunta={INSTRUCCIONES[4]} opciones={OPCIONES_FERNANDA} elegidoId={reflexionFernandaId} bloqueado={bloqueado} onElegir={elegirReflexionFernanda} />
            </>
          )}

          {/* Encargo 6 · tareas del analista de datos */}
          {pasoActual === 5 && (
            <>
              <p className="text-sm text-slate-300">{INSTRUCCIONES[5]}</p>
              <ClasificacionDosOpciones
                items={TAREAS_ANALISTA.map((t) => ({ id: t.id, etiqueta: t.texto }))}
                opciones={OPCIONES_TAREA}
                seleccion={veredictosTareas}
                bloqueado={bloqueado}
                onElegir={(id, v) => setVeredictosTareas((prev) => ({ ...prev, [id]: v }))}
                onComprobar={comprobarTareas}
                puedeComprobar={todasTareasElegidas}
              />
            </>
          )}

          {/* Encargo 7 · reflexión sobre criterio humano y IA */}
          {pasoActual === 6 && (
            <McqBloque pregunta={INSTRUCCIONES[6]} opciones={OPCIONES_REFLEXION_IA} elegidoId={reflexionIaId} bloqueado={bloqueado} onElegir={elegirReflexionIa} />
          )}

          {/* Encargo 8 · el camino de Ximena, cierre que integra las tres paradas */}
          {pasoActual === 7 && (
            <SeleccionEmpleo
              perfil={PERFIL_XIMENA}
              seleccionId={perfilXimenaId}
              bloqueado={bloqueado}
              onSeleccionar={setPerfilXimenaId}
              onComprobar={() => comprobarPerfil(PERFIL_XIMENA, perfilXimenaId, MENSAJE_ACIERTO_XIMENA)}
            />
          )}

          {/* Encargo 9 · reflexión final */}
          {pasoActual === 8 && (
            <McqBloque pregunta={INSTRUCCIONES[8]} opciones={OPCIONES_REFLEXION_CIERRE} elegidoId={reflexionCierreId} bloqueado={bloqueado} onElegir={elegirReflexionCierre} />
          )}

          <MensajeYAvance mensaje={mensaje} esUltimo={pasoActual === TOTAL - 1} onSiguiente={siguiente} onTerminar={terminar} />
        </div>
      </div>
    </VentanaBase>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 7 · Widgets locales
// ═══════════════════════════════════════════════════════════════════════════

/** Mensaje de acierto/error + botón «Siguiente»/«Terminar» — mismo patrón que
 *  las dos hermanas de la unidad. */
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
 *  los tres encargos de clasificar (empleos, habilidades, tareas): el mismo
 *  patrón que `ListaClasificacion` en la hermana de e-commerce. */
function ClasificacionDosOpciones({
  items,
  opciones,
  seleccion,
  bloqueado,
  onElegir,
  onComprobar,
  puedeComprobar,
}: {
  items: { id: string; etiqueta: string; sub?: string }[];
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
            {it.sub && <span className="text-xs text-slate-400">{it.sub}</span>}
            <div className="flex flex-wrap gap-2">
              {opciones.map((op) => (
                <button
                  key={op.valor}
                  type="button"
                  data-testid="clasificacion-opcion"
                  disabled={bloqueado}
                  onClick={() => onElegir(it.id, op.valor)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 ${
                    seleccion[it.id] === op.valor ? 'bg-violet-500 text-white' : 'bg-slate-700 text-slate-200'
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
          className="px-5 py-3 rounded-xl bg-violet-500 text-white font-bold disabled:opacity-50 self-start"
        >
          Comprobar
        </button>
      )}
    </div>
  );
}

/** Historia de un perfil + los cinco empleos como opciones de selección
 *  única — reusada por los tres encargos de «¿a qué empleo encaja este
 *  perfil?» (Naomi, Diego y el cierre con Ximena). El veredicto correcto lo
 *  calcula `mejorEmpleoPara()`, nunca un id fijado a mano por perfil. */
function SeleccionEmpleo({
  perfil,
  seleccionId,
  bloqueado,
  onSeleccionar,
  onComprobar,
}: {
  perfil: PerfilPersona;
  seleccionId: string | null;
  bloqueado: boolean;
  onSeleccionar: (id: string) => void;
  onComprobar: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-300 leading-relaxed">{perfil.historia}</p>
      <ul className="flex flex-col gap-2" data-testid="lista-empleos-perfil">
        {EMPLEOS.map((e) => (
          <li key={e.id}>
            <button
              type="button"
              data-testid="empleo-opcion"
              disabled={bloqueado}
              onClick={() => onSeleccionar(e.id)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm disabled:opacity-50 ${
                seleccionId === e.id ? 'bg-violet-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <span className="font-bold">
                {e.emoji} {e.nombre}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {!bloqueado && (
        <button
          type="button"
          data-testid="comprobar-perfil"
          disabled={!seleccionId}
          onClick={onComprobar}
          className="px-5 py-3 rounded-xl bg-violet-500 text-white font-bold disabled:opacity-50 self-start"
        >
          Comprobar
        </button>
      )}
    </div>
  );
}

/** Bloque de opción múltiple, reusado por las cuatro reflexiones. */
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

export default LabEmpleosTecnologicos;
