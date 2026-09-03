'use client';

import { useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { useLabActividad } from '../lib/useLabActividad';
import { VentanaBase } from '../../simuladores/VentanaBase';

/**
 * N9·U «Desarrollo de aplicaciones», parada 3 de 3 · «Pruébala con usuarios»
 * (documento §54.3, currículo: `n9-pruebas-con-usuarios`). CIERRE de la
 * unidad: mismo papel que `n8-derechos-y-licencias` tiene al final de
 * «Producción multimedia y videojuegos» — no enseña un programa nuevo,
 * aplica criterio sobre un caso. **N9 = 3.º de Secundaria = 14–15 años**,
 * verificado en `curriculo.ts`.
 *
 * ── Por qué esto NO usa el armazón `simuladores/diseno` de sus dos hermanas ──
 *
 * Se leyó `comandos.ts` y `modelo.ts` enteros antes de decidir. El armazón
 * simula un editor gráfico: capas, páginas, enlaces entre pantallas. No
 * existe ahí ningún concepto de sesión de usuario, tiempo de tarea,
 * abandono, retroalimentación repetida ni severidad — no hay nada que
 * adaptar, sólo algo distinto que construir. **Probar con usuarios** es una
 * disciplina de OBSERVACIÓN (mirar qué hizo alguien real) que empieza
 * justo donde termina el editor: `n9-construye-low-code` verificó que el
 * mapa de pantallas no tuviera huecos —`huerfanas`, `enlacesRotos`— y ésa es
 * una revisión ESTRUCTURAL. Un botón puede estar perfectamente enlazado y
 * seguir siendo invisible para una persona real; eso el editor nunca lo va
 * a saber, y es exactamente el hallazgo del encargo 9.
 *
 * Se sigue el precedente de `LabDerechosYLicencias.tsx` (n8, el mismo papel
 * de cierre): un panel propio sobre `VentanaBase`, sin editor de por medio,
 * con predicados reales sobre datos —nunca una tabla de «este caso vale
 * esto»— y sin la portada de objetivos que sí llevan las clases de editor:
 * la propia página de entrada (`EntradaN4Base`, video + fichas + ruta) ya
 * cumple esa función antes de que se abra este panel.
 *
 * ── La app bajo prueba es «Mis tareas», la misma de la parada 2 ──
 *
 * Inicio, Lista, Detalle — el alumno no vuelve a construirla, la prueba tal
 * como quedó: con su botón «Volver» perfectamente enlazado y, aun así, con
 * un problema real de usabilidad que sólo aparece cuando alguien de verdad
 * intenta usarlo.
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1 · Acto 1 «Lo que hizo, no lo que dijo» — diagnosticar sesiones reales
// ═══════════════════════════════════════════════════════════════════════════

type Diagnostico = 'exito' | 'exito-con-dificultad' | 'no-completo';

interface SesionPrueba {
  id: string;
  usuario: string;
  edad: number;
  tarea: string;
  segundos: number;
  completada: boolean;
  vecesTocoElementoEquivocado: number;
  comentario: string;
}

/** Umbrales del predicado: tardar de más O tocar dos veces algo que no era
 *  el camino cuentan como dificultad real, aunque la tarea SÍ se completara. */
const UMBRAL_SEGUNDOS_DIFICULTAD = 40;
const UMBRAL_TOQUES_DIFICULTAD = 2;

/** El predicado real: lee sólo comportamiento (tiempo, toques, si terminó),
 *  nunca el campo `comentario` — ésa es la lección del Acto 1. */
function diagnosticar(s: SesionPrueba): Diagnostico {
  if (!s.completada) return 'no-completo';
  if (s.vecesTocoElementoEquivocado >= UMBRAL_TOQUES_DIFICULTAD || s.segundos >= UMBRAL_SEGUNDOS_DIFICULTAD) {
    return 'exito-con-dificultad';
  }
  return 'exito';
}

const TAREA_RONDA_1 = 'Encontrar la tarea «Entregar el proyecto de Ciencias» y marcarla como lista.';

const SESIONES_ACTO1: SesionPrueba[] = [
  {
    id: 'marcos',
    usuario: 'Marcos',
    edad: 14,
    tarea: TAREA_RONDA_1,
    segundos: 9,
    completada: true,
    vecesTocoElementoEquivocado: 0,
    comentario: 'Fácil, todo estaba donde lo esperaba.',
  },
  {
    id: 'renata',
    usuario: 'Renata',
    edad: 15,
    tarea: TAREA_RONDA_1,
    segundos: 51,
    completada: true,
    vecesTocoElementoEquivocado: 2,
    comentario: 'Estuvo bien, nomás me distraje un rato.',
  },
  {
    id: 'ivan',
    usuario: 'Iván',
    edad: 14,
    tarea: TAREA_RONDA_1,
    segundos: 88,
    completada: false,
    vecesTocoElementoEquivocado: 3,
    comentario: 'Se me hizo confuso, mejor lo dejo por hoy.',
  },
  {
    id: 'diana',
    usuario: 'Diana',
    edad: 15,
    tarea: TAREA_RONDA_1,
    segundos: 11,
    completada: true,
    vecesTocoElementoEquivocado: 0,
    comentario: 'Rapidísimo, aunque no me gustó el color del botón de arriba.',
  },
];

const OPCIONES_DIAGNOSTICO: { id: Diagnostico; etiqueta: string }[] = [
  { id: 'exito', etiqueta: '🟢 Completó sin problema' },
  { id: 'exito-con-dificultad', etiqueta: '🟡 Lo logró, pero con dificultad' },
  { id: 'no-completo', etiqueta: '🔴 No completó la tarea' },
];

const RENATA = SESIONES_ACTO1.find((s) => s.id === 'renata')!;

interface OpcionMcq {
  id: string;
  texto: string;
  correcta: boolean;
  explicacion: string;
}

const OPCIONES_RENATA: OpcionMcq[] = [
  {
    id: 'a',
    texto: 'Que la app está perfecta, porque eso fue lo que ella dijo al final.',
    correcta: false,
    explicacion: 'Un comentario amable al final no borra lo que pasó durante la sesión: 2 toques equivocados y más del doble del tiempo de Marcos.',
  },
  {
    id: 'b',
    texto: `Que hubo una dificultad real —tardó ${RENATA.segundos} segundos y tocó ${RENATA.vecesTocoElementoEquivocado} veces algo que no era el camino—, aunque ella lo haya minimizado al hablar.`,
    correcta: true,
    explicacion: 'La gente casi siempre suaviza su opinión en voz alta, por pena o por no quedar mal. Lo que hizo con las manos —tardanza, toques equivocados— es el dato que se anota en el reporte.',
  },
  {
    id: 'c',
    texto: 'Nada: si el usuario completó la tarea, no importa cuánto haya tardado ni qué haya tocado de más.',
    correcta: false,
    explicacion: '«Completó» no es lo mismo que «no tuvo problemas». Renata completó, y aun así hubo una dificultad real que un reporte de usabilidad debe registrar.',
  },
  {
    id: 'd',
    texto: 'Que hay que preguntarle a Renata qué color de botón prefiere.',
    correcta: false,
    explicacion: 'Eso no fue lo que pasó en su sesión —esa opinión sobre el color es de Diana, en otra sesión—. Anotar la sesión equivocada arruina el reporte.',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 2 · Acto 2 «Patrón, no opinión» — criterio cuantificable sobre 5 usuarios
// ═══════════════════════════════════════════════════════════════════════════

interface Retroalimentacion {
  id: string;
  texto: string;
  usuariosQueLoMencionaron: number;
  bloqueaLaTarea: boolean;
}

const TOTAL_USUARIOS_RONDA = 5;
/** Más de la mitad de 5: el número que separa «alguien lo dijo» de «un patrón». */
const UMBRAL_PATRON = 3;

/** El predicado real: bloquear la tarea amerita el cambio aunque sea UNA
 *  sola persona; sin bloqueo, hace falta que lo repita un patrón. */
function ameritaCambio(fb: Retroalimentacion): boolean {
  return fb.bloqueaLaTarea || fb.usuariosQueLoMencionaron >= UMBRAL_PATRON;
}

type VeredictoRetro = 'amerita' | 'opinion';

const RETROALIMENTACIONES: Retroalimentacion[] = [
  { id: 'boton-feo', texto: '«El botón morado se ve feo.»', usuariosQueLoMencionaron: 1, bloqueaLaTarea: false },
  { id: 'boton-agregar', texto: '«Me costó encontrar el botón para agregar una tarea nueva.»', usuariosQueLoMencionaron: 3, bloqueaLaTarea: false },
  { id: 'titulo-chico', texto: '«El texto del título se ve chico para leer.»', usuariosQueLoMencionaron: 2, bloqueaLaTarea: false },
  { id: 'atorado-detalle', texto: '«Me quedé atorado en Detalle, no encontré cómo volver.»', usuariosQueLoMencionaron: 1, bloqueaLaTarea: true },
];

const OPCIONES_VEREDICTO_RETRO: { id: VeredictoRetro; etiqueta: string }[] = [
  { id: 'amerita', etiqueta: '✅ Amerita un cambio' },
  { id: 'opinion', etiqueta: '🚫 Es una opinión aislada' },
];

const OPCIONES_BLOQUEO_VS_FRECUENCIA: OpcionMcq[] = [
  {
    id: 'a',
    texto: 'Porque una amerita por severidad —bloquea la tarea, así sea a una sola persona— y la otra es una preferencia estética sin ese peso: la cantidad de gente que opina no es el único criterio, qué tan grave es también cuenta.',
    correcta: true,
    explicacion: 'Exacto. «Amerita cambio» tiene DOS puertas de entrada, no una: bloquear a cualquiera, o repetirse en un patrón. El color de un botón nunca bloquea nada, así que necesita el patrón; quedarse atorado sí bloquea, así que basta con una persona.',
  },
  {
    id: 'b',
    texto: 'Porque a la gente le importa más navegar que los colores.',
    correcta: false,
    explicacion: 'Eso es una suposición sobre gustos, no el criterio que usaste. El criterio real es si bloquea la tarea o si lo repite un patrón — nada que ver con qué le «importa más» a la gente.',
  },
  {
    id: 'c',
    texto: 'Porque siempre hay que hacerle caso al primer comentario que llega.',
    correcta: false,
    explicacion: 'El orden en que llega un comentario no es un criterio: si lo fuera, «el botón se ve feo» habría amerita un cambio por haber llegado primero.',
  },
  {
    id: 'd',
    texto: 'Porque el color de un botón no se puede cambiar en una app real.',
    correcta: false,
    explicacion: 'Sí se puede cambiar — de hecho es de lo más fácil de cambiar en cualquier app. El motivo no es técnico, es de criterio: una opinión aislada y estética no basta.',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 3 · Acto 3 «Severidad por frecuencia» — priorizar arreglos
// ═══════════════════════════════════════════════════════════════════════════

type Gravedad = 'bloquea' | 'molesta' | 'cosmetico';

interface Problema {
  id: string;
  descripcion: string;
  frecuencia: number; // de los 5 usuarios de la ronda
  gravedad: Gravedad;
}

const PESO_GRAVEDAD: Record<Gravedad, number> = { bloquea: 3, molesta: 2, cosmetico: 1 };

/** El puntaje real: severidad POR frecuencia, no una lista arbitraria ni la
 *  gravedad sola ni la frecuencia sola. */
const urgencia = (p: Problema): number => PESO_GRAVEDAD[p.gravedad] * p.frecuencia;

const PROBLEMAS: Problema[] = [
  { id: 'atorado-detalle', descripcion: 'Quedarse atorado en Detalle sin encontrar cómo volver a Inicio.', frecuencia: 1, gravedad: 'bloquea' },
  { id: 'boton-agregar', descripcion: 'Cuesta encontrar el botón para agregar una tarea nueva.', frecuencia: 3, gravedad: 'molesta' },
  { id: 'titulo-chico', descripcion: 'El texto del título se ve chico para leer.', frecuencia: 2, gravedad: 'cosmetico' },
  { id: 'check-invisible', descripcion: 'El botón para marcar una tarea como lista no se distingue de un simple adorno.', frecuencia: 4, gravedad: 'molesta' },
];

/** Calculado del propio catálogo —nunca tecleado a mano—: de mayor a menor
 *  urgencia real. Sin empates entre los cuatro, comprobado a propósito. */
const ORDEN_CORRECTO: string[] = [...PROBLEMAS].sort((a, b) => urgencia(b) - urgencia(a)).map((p) => p.id);

const ETIQUETA_GRAVEDAD: Record<Gravedad, string> = {
  bloquea: '🔴 Bloquea la tarea',
  molesta: '🟡 Molesta, pero se puede rodear',
  cosmetico: '🟢 Detalle estético',
};

// ═══════════════════════════════════════════════════════════════════════════
// 4 · Acto 4 «El cierre: ¿publicar?» — boceto → construcción → prueba
// ═══════════════════════════════════════════════════════════════════════════

interface EstadoProblema extends Problema {
  resuelto: boolean;
}

/** Sólo se arreglaron los dos más urgentes (encargo 6 lo demostró): el
 *  ícono invisible y el botón de agregar. El atasco y el texto chico
 *  quedaron pendientes por falta de tiempo — la situación real de
 *  cualquier ronda de arreglos, que nunca cierra el 100 % de los hallazgos. */
const RESUELTOS_RONDA: Record<string, boolean> = {
  'check-invisible': true,
  'boton-agregar': true,
  'atorado-detalle': false,
  'titulo-chico': false,
};

const ESTADO_FINAL: EstadoProblema[] = PROBLEMAS.map((p) => ({ ...p, resuelto: RESUELTOS_RONDA[p.id] ?? false }));

/** El predicado real de la decisión de publicar: ningún problema que
 *  BLOQUEA la tarea puede quedar sin resolver. Un detalle estético
 *  pendiente no detiene el lanzamiento. */
function quedaBloqueanteSinResolver(estados: EstadoProblema[]): boolean {
  return estados.some((p) => p.gravedad === 'bloquea' && !p.resuelto);
}

const LISTO_PARA_PUBLICAR = !quedaBloqueanteSinResolver(ESTADO_FINAL);

const SESION_CONFIRMACION: SesionPrueba = {
  id: 'sofia',
  usuario: 'Sofía',
  edad: 14,
  tarea: 'Abrir una tarea y regresar a la pantalla principal.',
  segundos: 82,
  completada: false,
  vecesTocoElementoEquivocado: 4,
  comentario: 'No sé cómo se regresa, no vi ningún botón para eso.',
};

const OPCIONES_PUBLICAR: OpcionMcq[] = [
  {
    id: 'publicar',
    texto: 'Publicar la app ya: se arregló lo más urgente y eso basta.',
    correcta: LISTO_PARA_PUBLICAR,
    explicacion: LISTO_PARA_PUBLICAR
      ? 'Correcto: ningún problema que bloquea la tarea sigue sin resolver, así que un detalle pendiente no detiene el lanzamiento.'
      : 'El atasco en Detalle BLOQUEA la tarea —Sofía lo acaba de confirmar de nuevo— y sigue sin resolverse. Eso sí detiene un lanzamiento, aunque ya se hayan arreglado otras dos cosas.',
  },
  {
    id: 'otra-ronda',
    texto: 'Otra ronda de arreglos: falta resolver el atasco en Detalle antes de publicar.',
    correcta: !LISTO_PARA_PUBLICAR,
    explicacion: !LISTO_PARA_PUBLICAR
      ? 'Correcto: el atasco en Detalle bloquea la tarea y sigue sin resolverse —Sofía lo acaba de confirmar—, así que la app todavía no está lista. El texto chico puede esperar; ese atasco no.'
      : 'Los dos problemas que bloqueaban la tarea ya están resueltos. Mandar otra ronda por un detalle estético pendiente sería frenar el lanzamiento sin necesidad.',
  },
];

const OPCIONES_CIERRE_FINAL: OpcionMcq[] = [
  {
    id: 'a',
    texto: 'Porque el editor de la parada 2 sólo revisa que el enlace exista y lleve a alguna pantalla — no puede saber si una persona real nota el botón, entiende su ícono, o lo confunde con algo más. Eso sólo lo dice probar con usuarios de verdad.',
    correcta: true,
    explicacion: 'Exacto. «Sin huérfanas, sin enlaces rotos» es una revisión ESTRUCTURAL: el camino existe en el mapa. Que alguien lo ENCUENTRE es una pregunta distinta, y sólo la contesta ver a una persona real intentarlo.',
  },
  {
    id: 'b',
    texto: 'Porque Sofía no leyó las instrucciones con cuidado.',
    correcta: false,
    explicacion: 'Culpar a quien prueba es exactamente lo que una prueba con usuarios evita: si una persona real no encuentra el botón, el problema es del botón, no de la persona.',
  },
  {
    id: 'c',
    texto: 'Porque el editor de la parada 2 tiene un error y no revisó bien el enlace.',
    correcta: false,
    explicacion: 'El enlace SÍ estaba bien —tú mismo lo comprobaste en la parada 2, sin huérfanas ni enlaces rotos—. El editor no se equivocó: simplemente no revisa lo que no le corresponde revisar.',
  },
  {
    id: 'd',
    texto: 'Porque cada usuario prueba la app de forma distinta y no se puede confiar en ninguno.',
    correcta: false,
    explicacion: 'Todo lo contrario: cuatro de cinco personas SÍ encontraron sus caminos sin problema. Confiar en el patrón es exactamente lo que hiciste en el Acto 2 — la lección no es «no confíes en nadie», es «mira el patrón».',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 5 · El laboratorio — 9 encargos, un solo índice lineal
// ═══════════════════════════════════════════════════════════════════════════

const TOTAL = 9;

const INSTRUCCIONES: string[] = [
  'Cuatro usuarios probaron «Mis tareas». Lee cada sesión y decide qué pasó de verdad — no lo que dijeron, lo que hicieron.',
  'Responde: ¿qué deberías anotar en tu reporte sobre la sesión de Renata?',
  'Cuatro comentarios de los cinco usuarios que probaron la app. Clasifica cuáles ameritan un cambio real.',
  'Responde: ¿por qué un comentario de una sola persona a veces sí amerita un cambio, y otras veces no?',
  'Cuatro problemas encontrados, cada uno con su gravedad y cuántos usuarios lo sufrieron. ¿Cuál arreglas primero?',
  'Ordena los cuatro problemas del más urgente al menos urgente.',
  'Después de la ronda de arreglos, una nueva usuaria prueba la app. ¿Sigue atorada en el mismo problema?',
  '¿Publicas la app ya, o mandas otra ronda de arreglos?',
  'Última pregunta: ¿por qué el editor de la parada 2 nunca detectó este problema?',
];

const NOMBRES_ACTO = ['Lo que hizo, no lo que dijo', 'Patrón, no opinión', 'Severidad por frecuencia', 'El cierre: ¿publicar?'] as const;
/** Índice del primer paso de cada acto; el último valor es el total. */
const LIMITES_ACTO = [0, 2, 4, 6, TOTAL];

function indiceActo(paso: number): number {
  return LIMITES_ACTO.findIndex((limite, i) => i < LIMITES_ACTO.length - 1 && paso < LIMITES_ACTO[i + 1]);
}

export function LabPruebasConUsuarios(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const lab = useLabActividad(props, TOTAL, {});

  const [pasoActual, setPasoActual] = useState(0);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [bloqueado, setBloqueado] = useState(false);

  // Acto 1 · diagnosticar sesiones + reflexión
  const [diagnosticosActo1, setDiagnosticosActo1] = useState<Record<string, Diagnostico | undefined>>({});
  const [reflexionRenataId, setReflexionRenataId] = useState<string | null>(null);

  // Acto 2 · patrón vs opinión + reflexión
  const [veredictosActo2, setVeredictosActo2] = useState<Record<string, VeredictoRetro | undefined>>({});
  const [reflexionBloqueoId, setReflexionBloqueoId] = useState<string | null>(null);

  // Acto 3 · priorizar
  const [primerElegidoId, setPrimerElegidoId] = useState<string | null>(null);
  const [ordenElegido, setOrdenElegido] = useState<string[]>([]);

  // Acto 4 · confirmación, publicar, cierre
  const [diagnosticoConfirmacion, setDiagnosticoConfirmacion] = useState<Diagnostico | undefined>(undefined);
  const [decisionPublicarId, setDecisionPublicarId] = useState<string | null>(null);
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
  const elegirDiagnosticoActo1 = (id: string, diag: Diagnostico) => {
    if (bloqueado) return;
    setDiagnosticosActo1((prev) => ({ ...prev, [id]: diag }));
  };

  const comprobarActo1 = () => {
    if (bloqueado) return;
    const todosCorrectos = SESIONES_ACTO1.every((s) => diagnosticosActo1[s.id] === diagnosticar(s));
    if (todosCorrectos) {
      marcarAcierto(
        'Los cuatro coinciden: Marcos y Diana completaron sin problema; Renata sí completó, pero tardó de más y tocó dos veces algo que no era el camino —dificultad real, aunque lo haya minimizado al hablar—; e Iván nunca llegó a marcar la tarea.',
      );
    } else {
      marcarError('Todavía no coinciden las cuatro. Fíjate en el comportamiento —tiempo, toques equivocados, si terminó— y no en lo que cada quien dijo al final.');
    }
  };

  const elegirReflexionRenata = (op: OpcionMcq) => {
    if (bloqueado) return;
    setReflexionRenataId(op.id);
    if (op.correcta) marcarAcierto(op.explicacion);
    else marcarError(op.explicacion);
  };

  // ── Acto 2 ────────────────────────────────────────────────────────────
  const elegirVeredictoActo2 = (id: string, v: VeredictoRetro) => {
    if (bloqueado) return;
    setVeredictosActo2((prev) => ({ ...prev, [id]: v }));
  };

  const comprobarActo2 = () => {
    if (bloqueado) return;
    const todosCorrectos = RETROALIMENTACIONES.every(
      (r) => veredictosActo2[r.id] === (ameritaCambio(r) ? 'amerita' : 'opinion'),
    );
    if (todosCorrectos) {
      marcarAcierto(
        `Los cuatro coinciden: «se ve feo» y «el título chico» son opiniones de menos de ${UMBRAL_PATRON} de los ${TOTAL_USUARIOS_RONDA} usuarios y no bloquean nada; «cuesta encontrar el botón de agregar» lo repitieron ${RETROALIMENTACIONES.find((r) => r.id === 'boton-agregar')!.usuariosQueLoMencionaron} personas —un patrón—; y «me quedé atorado» amerita cambio aunque sea una sola, porque BLOQUEA la tarea.`,
      );
    } else {
      marcarError(`Todavía no. Revisa cada uno: ¿bloquea la tarea a alguien, o lo repiten al menos ${UMBRAL_PATRON} de los ${TOTAL_USUARIOS_RONDA} usuarios?`);
    }
  };

  const elegirReflexionBloqueo = (op: OpcionMcq) => {
    if (bloqueado) return;
    setReflexionBloqueoId(op.id);
    if (op.correcta) marcarAcierto(op.explicacion);
    else marcarError(op.explicacion);
  };

  // ── Acto 3 ────────────────────────────────────────────────────────────
  const elegirPrimero = (id: string) => {
    if (bloqueado) return;
    setPrimerElegidoId(id);
  };

  const comprobarPrimero = () => {
    if (bloqueado || !primerElegidoId) return;
    if (primerElegidoId === ORDEN_CORRECTO[0]) {
      marcarAcierto(
        `Correcto. La urgencia es gravedad POR frecuencia: «${PROBLEMAS.find((p) => p.id === primerElegidoId)!.descripcion}» pesa ${urgencia(PROBLEMAS.find((p) => p.id === primerElegidoId)!)} —molesta a 4 de 5 usuarios—, más que el atasco que bloquea pero sólo le pasó a 1.`,
      );
    } else {
      marcarError('Todavía no. No mires sólo la gravedad ni sólo cuánta gente lo sufre: multiplica las dos cosas para cada problema y compara los cuatro resultados.');
    }
  };

  const elegirEnOrden = (id: string) => {
    if (bloqueado || ordenElegido.includes(id) || ordenElegido.length >= PROBLEMAS.length) return;
    setOrdenElegido((prev) => [...prev, id]);
  };

  const reiniciarOrden = () => {
    if (bloqueado) return;
    setOrdenElegido([]);
  };

  const comprobarOrden = () => {
    if (bloqueado || ordenElegido.length !== PROBLEMAS.length) return;
    const correcto = ordenElegido.every((id, i) => id === ORDEN_CORRECTO[i]);
    if (correcto) {
      marcarAcierto(
        `Ese es el orden real: ${ORDEN_CORRECTO.map((id) => `«${PROBLEMAS.find((p) => p.id === id)!.descripcion}» (${urgencia(PROBLEMAS.find((p) => p.id === id)!)})`).join(' → ')}.`,
      );
    } else {
      marcarError('Ese orden no coincide con gravedad × frecuencia. Reinicia y vuelve a calcular cada puntaje antes de tocar.');
    }
  };

  // ── Acto 4 ────────────────────────────────────────────────────────────
  const elegirDiagnosticoConfirmacion = (diag: Diagnostico) => {
    if (bloqueado) return;
    setDiagnosticoConfirmacion(diag);
  };

  const comprobarConfirmacion = () => {
    if (bloqueado || !diagnosticoConfirmacion) return;
    if (diagnosticoConfirmacion === diagnosticar(SESION_CONFIRMACION)) {
      marcarAcierto(
        'Sofía se quedó atorada 82 segundos y tocó cuatro veces algo que no era el camino: el atasco en Detalle SIGUE ahí. El botón «Volver» nunca dejó de estar enlazado —eso ya lo comprobó el editor en la parada 2—, y aun así una persona real no lo encuentra.',
      );
    } else {
      marcarError('Vuelve a mirar el comportamiento de Sofía, no lo que dijo. ¿Completó la tarea?');
    }
  };

  const elegirDecisionPublicar = (op: OpcionMcq) => {
    if (bloqueado) return;
    setDecisionPublicarId(op.id);
    if (op.correcta) marcarAcierto(op.explicacion);
    else marcarError(op.explicacion);
  };

  const elegirReflexionCierre = (op: OpcionMcq) => {
    if (bloqueado) return;
    setReflexionCierreId(op.id);
    if (op.correcta) marcarAcierto(op.explicacion);
    else marcarError(op.explicacion);
  };

  if (lab.terminado) {
    return (
      <VentanaBase marca="Tecnia Pruebas" subtitulo="Panel de pruebas con usuarios · Mis tareas">
        <div className="p-6 sm:p-10 text-center">
          <p className="text-5xl mb-4" aria-hidden="true">
            🧪
          </p>
          <h2 className="text-2xl font-extrabold text-white mb-2">Insignia: Detective de usabilidad</h2>
          <p className="text-slate-300 max-w-xl mx-auto">
            Diagnosticaste sesiones reales por comportamiento y no por lo que dijeron, distinguiste un patrón de una
            opinión aislada con un criterio cuantificable, priorizaste arreglos por severidad y frecuencia, y
            cerraste la unidad decidiendo —con criterio real, no adivinando— que «Mis tareas» todavía necesita otra
            ronda antes de publicarse. Bocetaste, construiste, y ahora sabes probar.
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
  const todosDiagnosticosElegidos = SESIONES_ACTO1.every((s) => diagnosticosActo1[s.id]);
  const todosVeredictosElegidos = RETROALIMENTACIONES.every((r) => veredictosActo2[r.id]);

  return (
    <VentanaBase marca="Tecnia Pruebas" subtitulo="Panel de pruebas con usuarios · Mis tareas">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 p-4 sm:p-6">
        {/* ── Pantalla principal ── */}
        <div className="flex flex-col gap-4 min-w-0">
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

          <div className="bg-[#0b1220] border border-violet-500/30 rounded-2xl p-5 sm:p-6 flex flex-col gap-4" data-testid="pantalla-pruebas">
            {/* Encargo 1 · diagnosticar cuatro sesiones */}
            {pasoActual === 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-slate-300">
                  Tarea de la ronda: <strong className="text-white">{TAREA_RONDA_1}</strong>
                </p>
                <ul className="flex flex-col gap-2" data-testid="lista-sesiones">
                  {SESIONES_ACTO1.map((s) => (
                    <li key={s.id} className="flex flex-col gap-2 bg-slate-800 rounded-xl px-4 py-3">
                      <span className="text-sm text-white">
                        <strong>{s.usuario}</strong>, {s.edad} años · {s.segundos} s · {s.vecesTocoElementoEquivocado} toques
                        equivocados · {s.completada ? 'terminó' : 'no terminó'}
                      </span>
                      <span className="text-xs text-slate-400 italic">«{s.comentario}»</span>
                      <div className="flex flex-wrap gap-2">
                        {OPCIONES_DIAGNOSTICO.map((op) => (
                          <button
                            key={op.id}
                            type="button"
                            data-testid="diagnostico-opcion"
                            disabled={bloqueado}
                            onClick={() => elegirDiagnosticoActo1(s.id, op.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 ${
                              diagnosticosActo1[s.id] === op.id ? 'bg-violet-500 text-white' : 'bg-slate-700 text-slate-200'
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
                    data-testid="comprobar-acto1"
                    disabled={!todosDiagnosticosElegidos}
                    onClick={comprobarActo1}
                    className="px-5 py-3 rounded-xl bg-violet-500 text-white font-bold disabled:opacity-50 self-start"
                  >
                    Comprobar
                  </button>
                )}
              </div>
            )}

            {/* Encargo 2 · reflexión sobre Renata */}
            {pasoActual === 1 && (
              <McqBloque
                pregunta={`Renata tardó ${RENATA.segundos} segundos y tocó ${RENATA.vecesTocoElementoEquivocado} veces un ícono que no la llevaba a ningún lado, pero al final dijo «${RENATA.comentario}». ¿Qué deberías anotar en tu reporte?`}
                opciones={OPCIONES_RENATA}
                elegidoId={reflexionRenataId}
                bloqueado={bloqueado}
                onElegir={elegirReflexionRenata}
              />
            )}

            {/* Encargo 3 · patrón vs opinión */}
            {pasoActual === 2 && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-slate-300">
                  Regla: una retroalimentación amerita un cambio si bloquea la tarea a cualquier usuario, o si la
                  mencionan al menos {UMBRAL_PATRON} de los {TOTAL_USUARIOS_RONDA} usuarios que probaron la app.
                </p>
                <ul className="flex flex-col gap-2" data-testid="lista-retroalimentaciones">
                  {RETROALIMENTACIONES.map((r) => (
                    <li key={r.id} className="flex flex-col gap-2 bg-slate-800 rounded-xl px-4 py-3">
                      <span className="text-sm text-white">{r.texto}</span>
                      <span className="text-xs text-slate-400">
                        {r.usuariosQueLoMencionaron} de {TOTAL_USUARIOS_RONDA} usuarios lo dijeron
                        {r.bloqueaLaTarea ? ' · bloquea la tarea' : ''}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {OPCIONES_VEREDICTO_RETRO.map((op) => (
                          <button
                            key={op.id}
                            type="button"
                            data-testid="veredicto-retro-opcion"
                            disabled={bloqueado}
                            onClick={() => elegirVeredictoActo2(r.id, op.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 ${
                              veredictosActo2[r.id] === op.id ? 'bg-violet-500 text-white' : 'bg-slate-700 text-slate-200'
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
                    data-testid="comprobar-acto2"
                    disabled={!todosVeredictosElegidos}
                    onClick={comprobarActo2}
                    className="px-5 py-3 rounded-xl bg-violet-500 text-white font-bold disabled:opacity-50 self-start"
                  >
                    Comprobar
                  </button>
                )}
              </div>
            )}

            {/* Encargo 4 · reflexión bloqueo vs frecuencia */}
            {pasoActual === 3 && (
              <McqBloque
                pregunta="¿Por qué «me quedé atorado, no encontré cómo volver» amerita un cambio aunque sólo lo haya dicho una persona, mientras que «el botón se ve feo» no amerita nada aunque también lo haya dicho una sola persona?"
                opciones={OPCIONES_BLOQUEO_VS_FRECUENCIA}
                elegidoId={reflexionBloqueoId}
                bloqueado={bloqueado}
                onElegir={elegirReflexionBloqueo}
              />
            )}

            {/* Encargo 5 · elegir el primero */}
            {pasoActual === 4 && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-slate-300">¿Cuál de estos cuatro problemas arreglas PRIMERO?</p>
                <ul className="flex flex-col gap-2" data-testid="lista-problemas-primero">
                  {PROBLEMAS.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        data-testid="problema-opcion"
                        disabled={bloqueado}
                        onClick={() => elegirPrimero(p.id)}
                        className={`w-full text-left flex flex-col gap-1 rounded-xl px-4 py-3 disabled:opacity-50 ${
                          primerElegidoId === p.id ? 'bg-violet-500 text-white' : 'bg-slate-800 text-slate-200'
                        }`}
                      >
                        <span className="text-sm">{p.descripcion}</span>
                        <span className="text-xs opacity-80">
                          {ETIQUETA_GRAVEDAD[p.gravedad]} · {p.frecuencia}/{TOTAL_USUARIOS_RONDA} usuarios
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                {!bloqueado && (
                  <button
                    type="button"
                    data-testid="comprobar-primero"
                    disabled={!primerElegidoId}
                    onClick={comprobarPrimero}
                    className="px-5 py-3 rounded-xl bg-violet-500 text-white font-bold disabled:opacity-50 self-start"
                  >
                    Comprobar
                  </button>
                )}
              </div>
            )}

            {/* Encargo 6 · ordenar los cuatro */}
            {pasoActual === 5 && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-slate-300">Toca los cuatro problemas en orden, del más urgente al menos urgente.</p>
                {ordenElegido.length > 0 && (
                  <ol className="flex flex-col gap-1 text-sm text-violet-300" data-testid="orden-elegido">
                    {ordenElegido.map((id, i) => (
                      <li key={id}>
                        {i + 1}. {PROBLEMAS.find((p) => p.id === id)!.descripcion}
                      </li>
                    ))}
                  </ol>
                )}
                <ul className="flex flex-col gap-2" data-testid="lista-problemas-orden">
                  {PROBLEMAS.filter((p) => !ordenElegido.includes(p.id)).map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        data-testid="problema-orden-opcion"
                        disabled={bloqueado}
                        onClick={() => elegirEnOrden(p.id)}
                        className="w-full text-left flex flex-col gap-1 rounded-xl px-4 py-3 bg-slate-800 text-slate-200 disabled:opacity-50"
                      >
                        <span className="text-sm">{p.descripcion}</span>
                        <span className="text-xs opacity-80">
                          {ETIQUETA_GRAVEDAD[p.gravedad]} · {p.frecuencia}/{TOTAL_USUARIOS_RONDA} usuarios
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  {!bloqueado && ordenElegido.length > 0 && (
                    <button type="button" data-testid="reiniciar-orden" onClick={reiniciarOrden} className="px-4 py-2 rounded-xl bg-slate-700 text-slate-200 text-sm font-bold">
                      Reiniciar orden
                    </button>
                  )}
                  {!bloqueado && (
                    <button
                      type="button"
                      data-testid="comprobar-orden"
                      disabled={ordenElegido.length !== PROBLEMAS.length}
                      onClick={comprobarOrden}
                      className="px-5 py-3 rounded-xl bg-violet-500 text-white font-bold disabled:opacity-50"
                    >
                      Comprobar
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Encargo 7 · sesión de confirmación tras los arreglos */}
            {pasoActual === 6 && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-slate-300">
                  Se arreglaron los dos problemas más urgentes. Una nueva usuaria prueba «Mis tareas» para revisar si el
                  atasco de Detalle sigue ahí.
                </p>
                <div className="flex flex-col gap-2 bg-slate-800 rounded-xl px-4 py-3">
                  <span className="text-sm text-white">
                    <strong>{SESION_CONFIRMACION.usuario}</strong>, {SESION_CONFIRMACION.edad} años · tarea: {SESION_CONFIRMACION.tarea}
                  </span>
                  <span className="text-sm text-white">
                    {SESION_CONFIRMACION.segundos} s · {SESION_CONFIRMACION.vecesTocoElementoEquivocado} toques equivocados ·{' '}
                    {SESION_CONFIRMACION.completada ? 'terminó' : 'no terminó'}
                  </span>
                  <span className="text-xs text-slate-400 italic">«{SESION_CONFIRMACION.comentario}»</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {OPCIONES_DIAGNOSTICO.map((op) => (
                    <button
                      key={op.id}
                      type="button"
                      data-testid="diagnostico-confirmacion-opcion"
                      disabled={bloqueado}
                      onClick={() => elegirDiagnosticoConfirmacion(op.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 ${
                        diagnosticoConfirmacion === op.id ? 'bg-violet-500 text-white' : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {op.etiqueta}
                    </button>
                  ))}
                </div>
                {!bloqueado && (
                  <button
                    type="button"
                    data-testid="comprobar-confirmacion"
                    disabled={!diagnosticoConfirmacion}
                    onClick={comprobarConfirmacion}
                    className="px-5 py-3 rounded-xl bg-violet-500 text-white font-bold disabled:opacity-50 self-start"
                  >
                    Comprobar
                  </button>
                )}
              </div>
            )}

            {/* Encargo 8 · publicar o otra ronda */}
            {pasoActual === 7 && (
              <McqBloque
                pregunta="Se resolvieron el ícono invisible y el botón de agregar; el texto chico y el atasco en Detalle siguen pendientes. Regla: se puede publicar si ningún problema que bloquea la tarea sigue sin resolver — un detalle estético pendiente no lo impide. ¿Qué decides?"
                opciones={OPCIONES_PUBLICAR}
                elegidoId={decisionPublicarId}
                bloqueado={bloqueado}
                onElegir={elegirDecisionPublicar}
              />
            )}

            {/* Encargo 9 · reflexión de cierre */}
            {pasoActual === 8 && (
              <McqBloque
                pregunta="El botón Volver de Detalle SIEMPRE estuvo bien enlazado — tú mismo lo comprobaste en la parada 2, y el editor nunca marcó un enlace roto. Entonces, ¿por qué Sofía no lo encontró?"
                opciones={OPCIONES_CIERRE_FINAL}
                elegidoId={reflexionCierreId}
                bloqueado={bloqueado}
                onElegir={elegirReflexionCierre}
              />
            )}
          </div>
        </div>

        {/* ── Panel de control lateral ── */}
        <div className="bg-[#0b1220] border border-violet-500/30 rounded-2xl p-5 flex flex-col gap-4 h-fit" data-testid="mis-panel">
          <p className="text-sm text-slate-300">
            Encargo <strong className="text-white">{pasoActual + 1}</strong> / {TOTAL}
          </p>
          <p className="text-xs uppercase tracking-wider font-bold text-violet-400">{NOMBRES_ACTO[acto]}</p>

          {!mensaje && <p className="text-sm text-slate-400">{INSTRUCCIONES[pasoActual]}</p>}

          {mensaje && (
            <div className="flex flex-col gap-2" data-testid="explicacion">
              <p className={`text-sm font-bold ${mensaje.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                {mensaje.ok ? '¡Correcto!' : 'Todavía no.'}
              </p>
              <p className="text-sm text-slate-200 leading-relaxed">{mensaje.texto}</p>
            </div>
          )}

          {mensaje?.ok && pasoActual !== TOTAL - 1 && (
            <button
              type="button"
              data-testid="siguiente"
              onClick={siguiente}
              className="mt-2 px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold"
            >
              Siguiente
            </button>
          )}

          {mensaje?.ok && pasoActual === TOTAL - 1 && (
            <button
              type="button"
              data-testid="terminar"
              onClick={terminar}
              className="mt-2 px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold"
            >
              Recibir la insignia
            </button>
          )}
        </div>
      </div>
    </VentanaBase>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 6 · Widget local
// ═══════════════════════════════════════════════════════════════════════════

/** Bloque de opción múltiple, reusado por las cinco reflexiones y la
 *  decisión de publicar. */
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
      <p className="text-sm text-slate-200 leading-relaxed">{pregunta}</p>
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

export default LabPruebasConUsuarios;
