'use client';

import { useMemo, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '../../../simuladores/VentanaBase';

/**
 * N8 · «Producción multimedia y videojuegos» — «Derechos de autor y
 * licencias» (documento §54). CIERRE de la unidad, parada 4 de 4: mismo
 * papel que `n8-habitos-de-proteccion` tiene al final de «Redes y
 * ciberseguridad» — no enseña un programa nuevo, aplica criterio sobre un
 * caso. El «programa» de hoy es «Tecnia Créditos»: un banco de recursos con
 * su procedencia real, no un simulador de software.
 *
 * ── Por qué esto NO repite lo que ya vivió el alumno en `n8-imagen-con-capas` ──
 *
 * Esa clase cierra dando crédito a UNA imagen (`sinCreditar` sólo exige que
 * el nombre de la autora aparezca en el cartel). Aquí el alumno:
 *   1. Clasifica CUATRO procedencias distintas (propia, protegida, con
 *      condición, dominio público) — la hermana nunca distingue estos casos.
 *   2. Decide si un USO concreto respeta una licencia (Atribución, No
 *      comercial, Sin obras derivadas) — la hermana no tiene licencias con
 *      condiciones que puedan violarse de más de una forma.
 *   3. Escribe una atribución que debe llevar autor Y licencia (dos
 *      condiciones reales sobre el texto) — la hermana sólo exige el nombre.
 *   4. Cierra decidiendo el conjunto COMPLETO de atribuciones de un proyecto
 *      con varios recursos a la vez, no una imagen sola.
 *
 * ── La regla anti-épsilon aplicada a licencias (documento §46) ──
 *
 * `usoRespetaLicencia()` es un predicado real sobre CUALQUIER combinación de
 * recurso + uso propuesto: nunca hay una tabla oculta de «este id con este
 * id da tal resultado». Si mañana se agrega un recurso o un uso nuevo, el
 * mismo cálculo sigue funcionando sin tocar el veredicto de nadie más.
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1 · El banco de recursos y el predicado real de licencias
// ═══════════════════════════════════════════════════════════════════════════

type Categoria = 'propia' | 'dominio-publico' | 'protegida' | 'cc';
type VeredictoUso = 'libre' | 'con-condicion' | 'no-permitida';

interface RecursoMultimedia {
  id: string;
  nombre: string;
  icono: string;
  autor: string;
  fuente: string;
  categoria: Categoria;
  licenciaTexto: string;
  requiereAtribucion: boolean;
  permiteUsoComercial: boolean;
  permiteModificar: boolean;
}

/** Tres cubetas, calculadas de la categoría — nunca una etiqueta puesta a
 *  mano por recurso. */
function puedesUsarla(r: RecursoMultimedia): VeredictoUso {
  if (r.categoria === 'protegida') return 'no-permitida';
  if (r.categoria === 'cc') return 'con-condicion';
  return 'libre'; // 'propia' | 'dominio-publico'
}

interface UsoPropuesto {
  id: string;
  descripcion: string;
  esComercial: boolean;
  modifica: boolean;
  daCredito: boolean;
}

/** El predicado real: compara las CONDICIONES del uso contra las que exige
 *  la licencia del recurso. Una obra propia o de dominio público no tiene
 *  ninguna condición; una protegida no admite ninguna sin permiso; una CC
 *  revisa exactamente las tres condiciones que puso su autor. */
function usoRespetaLicencia(r: RecursoMultimedia, uso: UsoPropuesto): boolean {
  if (r.categoria === 'protegida') return false;
  if (r.categoria === 'propia' || r.categoria === 'dominio-publico') return true;
  if (r.requiereAtribucion && !uso.daCredito) return false;
  if (!r.permiteUsoComercial && uso.esComercial) return false;
  if (!r.permiteModificar && uso.modifica) return false;
  return true;
}

function todosLosUsosCorrectos(
  usos: UsoPropuesto[],
  recurso: RecursoMultimedia,
  seleccion: Record<string, boolean | undefined>,
): boolean {
  return usos.every((u) => seleccion[u.id] === usoRespetaLicencia(recurso, u));
}

// ═══════════════════════════════════════════════════════════════════════════
// 2 · Acto 1 «Dominio público o con derechos» — cuatro procedencias reales
// ═══════════════════════════════════════════════════════════════════════════

const RECURSO_FOTO_PROPIA: RecursoMultimedia = {
  id: 'foto-propia',
  nombre: 'Una foto que tomaste tú mismo con tu celular',
  icono: '📷',
  autor: 'Tú',
  fuente: 'Tu celular',
  categoria: 'propia',
  licenciaTexto: 'Es tuya: tú tienes los derechos de autor',
  requiereAtribucion: false,
  permiteUsoComercial: true,
  permiteModificar: true,
};

const RECURSO_CANCION_POPULAR: RecursoMultimedia = {
  id: 'cancion-popular',
  nombre: 'La canción más escuchada esta semana en la radio',
  icono: '🎵',
  autor: 'Un sello discográfico',
  fuente: 'Plataformas de streaming',
  categoria: 'protegida',
  licenciaTexto: 'Todos los derechos reservados',
  requiereAtribucion: false,
  permiteUsoComercial: false,
  permiteModificar: false,
};

const RECURSO_ILUSTRACION_ANA: RecursoMultimedia = {
  id: 'ilustracion-ana',
  nombre: 'Una ilustración de un robot, publicada con licencia Creative Commons',
  icono: '🎨',
  autor: 'Ana Cabrera',
  fuente: 'bancoimagenes.tecnia',
  categoria: 'cc',
  licenciaTexto: 'CC BY 4.0 (Atribución)',
  requiereAtribucion: true,
  permiteUsoComercial: true,
  permiteModificar: true,
};

const RECURSO_PINTURA_ANTIGUA: RecursoMultimedia = {
  id: 'pintura-antigua',
  nombre: 'Una pintura hecha hace 200 años',
  icono: '🖼️',
  autor: 'Autor sin identificar (obra antigua)',
  fuente: 'Museo digital abierto',
  categoria: 'dominio-publico',
  licenciaTexto: 'Dominio público',
  requiereAtribucion: false,
  permiteUsoComercial: true,
  permiteModificar: true,
};

const RECURSOS_ACTO1: RecursoMultimedia[] = [
  RECURSO_FOTO_PROPIA,
  RECURSO_CANCION_POPULAR,
  RECURSO_ILUSTRACION_ANA,
  RECURSO_PINTURA_ANTIGUA,
];

const OPCIONES_VEREDICTO: { id: VeredictoUso; etiqueta: string }[] = [
  { id: 'libre', etiqueta: '🟢 Uso libre' },
  { id: 'con-condicion', etiqueta: '🟡 Con una condición' },
  { id: 'no-permitida', etiqueta: '🔴 Protegida, necesito permiso' },
];

// ═══════════════════════════════════════════════════════════════════════════
// 3 · Acto 2 «Licencias Creative Commons» — tres tipos, tres encargos
// ═══════════════════════════════════════════════════════════════════════════

const EFECTO_DIEGO: RecursoMultimedia = {
  id: 'efecto-diego',
  nombre: 'Efecto de sonido de una explosión',
  icono: '💥',
  autor: 'Diego Nuñez',
  fuente: 'bancosonidos.tecnia',
  categoria: 'cc',
  licenciaTexto: 'CC BY-NC 4.0 (Atribución - No comercial)',
  requiereAtribucion: true,
  permiteUsoComercial: false,
  permiteModificar: true,
};

const MUSICA_RENATA: RecursoMultimedia = {
  id: 'musica-renata',
  nombre: 'Música de fondo para videojuegos',
  icono: '🎼',
  autor: 'Renata Ibarra',
  fuente: 'bancosonidos.tecnia',
  categoria: 'cc',
  licenciaTexto: 'CC BY-ND 4.0 (Atribución - Sin obras derivadas)',
  requiereAtribucion: true,
  permiteUsoComercial: true,
  permiteModificar: false,
};

/** Atribución (CC BY): permite modificar y vender, pero SIEMPRE con crédito. */
const USOS_ATRIBUCION: UsoPropuesto[] = [
  { id: 'ua1', descripcion: 'La usas en el póster de tu videojuego y escribes junto a ella: «Ilustración: Ana Cabrera (CC BY)».', esComercial: false, modifica: false, daCredito: true },
  { id: 'ua2', descripcion: 'La subes a tu portafolio en línea sin mencionar a la autora en ningún lado.', esComercial: false, modifica: false, daCredito: false },
  { id: 'ua3', descripcion: 'La recortas, le cambias el color al robot y la usas en la portada de tu juego, citando igual a Ana Cabrera.', esComercial: false, modifica: true, daCredito: true },
];

/** No comercial (NC): el crédito no basta si el uso es comercial. */
const USOS_NO_COMERCIAL: UsoPropuesto[] = [
  { id: 'un1', descripcion: 'Lo usas en el tráiler que subes GRATIS a la plataforma de la escuela, citando a Diego Nuñez.', esComercial: false, modifica: false, daCredito: true },
  { id: 'un2', descripcion: 'Lo usas en el tráiler de un juego que vas a VENDER en una tienda de apps, citando igual a Diego Nuñez.', esComercial: true, modifica: false, daCredito: true },
  { id: 'un3', descripcion: 'Lo subes a tu canal de YouTube con los anuncios activados (canal monetizado), citando a Diego Nuñez.', esComercial: true, modifica: false, daCredito: true },
];

/** Sin obras derivadas (ND): el crédito no basta si además la modificas. */
const USOS_SIN_DERIVADOS: UsoPropuesto[] = [
  { id: 'ud1', descripcion: 'La usas tal cual, sin cortar ni cambiar nada, citando a Renata Ibarra.', esComercial: false, modifica: false, daCredito: true },
  { id: 'ud2', descripcion: 'Le cambias el tempo y le agregas eco para tu videojuego, citando igual a Renata Ibarra.', esComercial: false, modifica: true, daCredito: true },
  { id: 'ud3', descripcion: 'La recortas para que dure sólo 10 segundos y la pones de fondo sin decir de quién es.', esComercial: false, modifica: true, daCredito: false },
];

// ═══════════════════════════════════════════════════════════════════════════
// 4 · Acto 3 «Dar crédito correctamente» — MCQ del formato + texto real
// ═══════════════════════════════════════════════════════════════════════════

interface OpcionMcq {
  id: string;
  texto: string;
  correcta: boolean;
  explicacion: string;
}

const OPCIONES_ATRIBUCION_COMPLETA: OpcionMcq[] = [
  { id: 'a', texto: '«Imagen de internet»', correcta: false, explicacion: 'No dice de quién es, de dónde salió ni con qué licencia — no es una atribución, es no decir nada.' },
  { id: 'b', texto: '«Ana Cabrera hizo esto»', correcta: false, explicacion: 'Dice el autor, pero le falta el título de la obra, la fuente y la licencia — está incompleta.' },
  { id: 'c', texto: '«Ilustración “Robot explorador” de Ana Cabrera, tomada de bancoimagenes.tecnia, licencia CC BY 4.0»', correcta: true, explicacion: 'Ésta sí lleva las cuatro cosas: qué es, quién la hizo, de dónde salió y con qué licencia se puede usar.' },
  { id: 'd', texto: '«CC BY 4.0»', correcta: false, explicacion: 'Sólo dice la licencia — falta decir de quién es la obra y de dónde salió.' },
];

const TITULO_ANA = 'Robot explorador';
const TITULO_DIEGO = 'Explosión';
const TITULO_VALERIA = 'Estación Espacial Neón';

const ALIASES_CC_BY = ['cc by', 'atribución', 'creative commons'];
const ALIASES_CC_BY_NC = ['cc by-nc', 'cc by nc', 'no comercial', 'atribución-no comercial'];

const RECURSO_VALERIA: RecursoMultimedia = {
  id: 'ilustracion-valeria',
  nombre: `Ilustración «${TITULO_VALERIA}»`,
  icono: '🚀',
  autor: 'Valeria Sotelo',
  fuente: 'bancoimagenes.tecnia',
  categoria: 'cc',
  licenciaTexto: 'CC BY 4.0 (Atribución)',
  requiereAtribucion: true,
  permiteUsoComercial: true,
  permiteModificar: true,
};

interface EvaluacionAtribucion {
  tieneAutor: boolean;
  tieneTitulo: boolean;
  tieneFuente: boolean;
  tieneLicencia: boolean;
  /** El mínimo real para dar crédito de verdad: quién y bajo qué licencia.
   *  Título y fuente se muestran en el checklist pero no bloquean el avance
   *  — igual de exigente que pedir sólo el nombre en la hermana, y un paso
   *  más profundo: aquí hace falta además decir la licencia. */
  completa: boolean;
}

function evaluarAtribucionDe(
  textoCrudo: string,
  r: RecursoMultimedia,
  titulo: string,
  aliasesLicencia: string[],
  /*
   * AÑADIDO 1-sep-2026 (auditoría). Los nombres de estas licencias se contienen
   * unos a otros: «cc by» es subcadena literal de «cc by-nc», y «atribución» lo
   * es de «atribución-no comercial». En el encargo de cierre el alumno atribuye
   * DOS recursos con licencias distintas —Ana con CC BY, Diego con CC BY-NC— en
   * un solo cuadro de texto, y la comprobación miraba el texto ENTERO. Resultado
   * real: quien escribía la licencia de Diego y NO la de Ana aprobaba igual,
   * porque el «cc by» que buscaba Ana estaba dentro del «cc by-nc» de Diego. Se
   * arregla borrando primero las menciones de la licencia confundible —de la más
   * larga a la más corta, para que «atribución-no comercial» se vaya entera
   * antes de que «no comercial» la parta y deje un «atribución» suelto—.
   */
  aliasesQueNoCuentan: string[] = [],
): EvaluacionAtribucion {
  const t = textoCrudo.toLowerCase();
  const tieneAutor = t.includes(r.autor.toLowerCase());
  const tieneTitulo = t.includes(titulo.toLowerCase());
  const tieneFuente = t.includes(r.fuente.toLowerCase());
  const sinConfusion = [...aliasesQueNoCuentan]
    .sort((a, b) => b.length - a.length)
    .reduce((acc, a) => acc.split(a.toLowerCase()).join(' '), t);
  const tieneLicencia = aliasesLicencia.some((a) => sinConfusion.includes(a.toLowerCase()));
  return { tieneAutor, tieneTitulo, tieneFuente, tieneLicencia, completa: tieneAutor && tieneLicencia };
}

// ═══════════════════════════════════════════════════════════════════════════
// 5 · Acto 4 «El caso de cierre» — un proyecto con varios recursos a la vez
// ═══════════════════════════════════════════════════════════════════════════

const RECURSO_CAPTURA_PROPIA: RecursoMultimedia = {
  id: 'captura-propia',
  nombre: 'La captura de pantalla que tú mismo tomaste de tu videojuego',
  icono: '📸',
  autor: 'Tú',
  fuente: 'Tu propio videojuego',
  categoria: 'propia',
  licenciaTexto: 'Es tuya',
  requiereAtribucion: false,
  permiteUsoComercial: true,
  permiteModificar: true,
};

const RECURSO_SINFONIA_DP: RecursoMultimedia = {
  id: 'sinfonia-dp',
  nombre: 'Un fragmento de una sinfonía compuesta hace 250 años',
  icono: '🎻',
  autor: 'Autor clásico (obra antigua)',
  fuente: 'Archivo musical abierto',
  categoria: 'dominio-publico',
  licenciaTexto: 'Dominio público',
  requiereAtribucion: false,
  permiteUsoComercial: true,
  permiteModificar: true,
};

/** El tráiler de cierre reutiliza a Ana Cabrera y Diego Nuñez, ya conocidos
 *  de los actos 1 y 2 — el alumno reconoce sus licencias, no las memoriza
 *  de nuevo. */
const RECURSOS_PROYECTO: RecursoMultimedia[] = [
  RECURSO_CAPTURA_PROPIA,
  RECURSO_SINFONIA_DP,
  RECURSO_ILUSTRACION_ANA,
  EFECTO_DIEGO,
];

/** Calculado del propio banco (todo lo que es 'cc'), nunca una lista de ids
 *  escrita a mano aparte. */
const IDS_NECESITAN_ATRIBUCION = new Set(RECURSOS_PROYECTO.filter((r) => r.categoria === 'cc').map((r) => r.id));

function seleccionDeAtribucionesCorrecta(seleccion: Record<string, boolean>): boolean {
  return RECURSOS_PROYECTO.every((r) => Boolean(seleccion[r.id]) === IDS_NECESITAN_ATRIBUCION.has(r.id));
}

function evaluarAtribucionProyecto(texto: string): { ana: EvaluacionAtribucion; diego: EvaluacionAtribucion; completa: boolean } {
  const ana = evaluarAtribucionDe(texto, RECURSO_ILUSTRACION_ANA, TITULO_ANA, ALIASES_CC_BY, ALIASES_CC_BY_NC);
  const diego = evaluarAtribucionDe(texto, EFECTO_DIEGO, TITULO_DIEGO, ALIASES_CC_BY_NC);
  return { ana, diego, completa: ana.completa && diego.completa };
}

const OPCIONES_CIERRE: OpcionMcq[] = [
  {
    id: 'a',
    texto: 'Porque una obra es tuya (tú la hiciste) o ya es de todos (dominio público) — nadie tiene que dar permiso. Una imagen con licencia Creative Commons sigue siendo de alguien, que puso como condición que se le reconozca.',
    correcta: true,
    explicacion: 'Exacto. La atribución no es un trámite al azar: es la condición que la propia autora o autor puso para dejarte usar su obra. Cuando la obra es tuya o de dominio público, esa condición no existe.',
  },
  { id: 'b', texto: 'Porque las fotos y la música siempre necesitan crédito, y las pinturas nunca', correcta: false, explicacion: 'No depende del tipo de archivo (foto, música, pintura): depende de quién tiene los derechos y qué licencia puso.' },
  { id: 'c', texto: 'Porque el dominio público significa que nadie hizo esa obra', correcta: false, explicacion: 'Alguien sí la hizo — el dominio público es lo que pasa DESPUÉS: cuando pasa tanto tiempo que los derechos de autor ya vencieron.' },
  { id: 'd', texto: 'Porque dar crédito sólo hace falta si alguien pregunta quién hizo la obra', correcta: false, explicacion: 'No: la atribución se pone siempre que la licencia la pide, aunque nadie pregunte nada.' },
];

// ═══════════════════════════════════════════════════════════════════════════
// 6 · El laboratorio — 9 encargos, un solo índice lineal
// ═══════════════════════════════════════════════════════════════════════════

const TOTAL = 9;

const INSTRUCCIONES: string[] = [
  'Clasifica los cuatro recursos: ¿son de uso libre, tienen una condición, o están protegidas?',
  'Decide si cada uso respeta la licencia de Atribución (CC BY).',
  'Decide si cada uso respeta la licencia No comercial (CC BY-NC).',
  'Decide si cada uso respeta la licencia Sin obras derivadas (CC BY-ND).',
  'Elige cuál de estas cuatro SÍ es una atribución completa.',
  'Escribe tú mismo una atribución completa para esta ilustración.',
  'Marca qué recursos del proyecto necesitan atribución.',
  'Escribe el bloque de atribuciones completo para los dos recursos que lo piden.',
  'Elige la respuesta correcta para cerrar.',
];

const NOMBRES_ACTO = ['Dominio público o con derechos', 'Licencias Creative Commons', 'Dar crédito correctamente', 'El caso de cierre'] as const;
/** Índice del primer paso de cada acto; el último valor es el total. */
const LIMITES_ACTO = [0, 1, 4, 6, TOTAL];

function indiceActo(paso: number): number {
  return LIMITES_ACTO.findIndex((limite, i) => i < LIMITES_ACTO.length - 1 && paso < LIMITES_ACTO[i + 1]);
}

export function LabDerechosYLicencias(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const lab = useLabActividad(props, TOTAL, {});

  const [pasoActual, setPasoActual] = useState(0);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [bloqueado, setBloqueado] = useState(false);

  // Acto 1 · clasificar procedencias
  const [veredictosActo1, setVeredictosActo1] = useState<Record<string, VeredictoUso | undefined>>({});

  // Acto 2 · tres licencias, tres encargos de usos propuestos
  const [usosAna, setUsosAna] = useState<Record<string, boolean | undefined>>({});
  const [usosDiego, setUsosDiego] = useState<Record<string, boolean | undefined>>({});
  const [usosRenata, setUsosRenata] = useState<Record<string, boolean | undefined>>({});

  // Acto 3 · dar crédito
  const [reflexionAtribucionId, setReflexionAtribucionId] = useState<string | null>(null);
  const [textoValeria, setTextoValeria] = useState('');
  const evalValeria = useMemo(() => evaluarAtribucionDe(textoValeria, RECURSO_VALERIA, TITULO_VALERIA, ALIASES_CC_BY), [textoValeria]);

  // Acto 4 · el cierre
  const [seleccionProyecto, setSeleccionProyecto] = useState<Record<string, boolean>>({});
  const [textoProyecto, setTextoProyecto] = useState('');
  const evalProyecto = useMemo(() => evaluarAtribucionProyecto(textoProyecto), [textoProyecto]);
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
  const elegirVeredictoActo1 = (id: string, veredicto: VeredictoUso) => {
    if (bloqueado) return;
    setVeredictosActo1((prev) => ({ ...prev, [id]: veredicto }));
  };

  const comprobarActo1 = () => {
    if (bloqueado) return;
    const todasCorrectas = RECURSOS_ACTO1.every((r) => veredictosActo1[r.id] === puedesUsarla(r));
    if (todasCorrectas) {
      marcarAcierto(
        'Las cuatro coinciden: tu propia foto y la pintura de hace 200 años son de uso libre (una es tuya, la otra ya es de todos); la canción de la radio está protegida —todos los derechos reservados—; y la ilustración de Ana Cabrera se puede usar, pero con una condición: dar crédito.',
      );
    } else {
      marcarError('Todavía no coinciden las cuatro. Revisa: ¿quién tiene los derechos de cada una, y qué dice su licencia?');
    }
  };

  // ── Acto 2 ────────────────────────────────────────────────────────────
  const comprobarUsoAna = () => {
    if (bloqueado) return;
    if (todosLosUsosCorrectos(USOS_ATRIBUCION, RECURSO_ILUSTRACION_ANA, usosAna)) {
      marcarAcierto(
        'Los tres coinciden con la licencia CC BY (Atribución): se puede usar y hasta modificar, pero SIEMPRE dando crédito. Por eso el póster con crédito y la versión recoloreada CON crédito respetan la licencia, y el portafolio sin mencionar a Ana Cabrera no.',
      );
    } else {
      marcarError('Todavía no. La licencia de Ana Cabrera es CC BY: permite modificar, pero pide UNA cosa siempre — dar crédito. Revisa cuál de los tres usos no lo hace.');
    }
  };

  const comprobarUsoDiego = () => {
    if (bloqueado) return;
    if (todosLosUsosCorrectos(USOS_NO_COMERCIAL, EFECTO_DIEGO, usosDiego)) {
      marcarAcierto(
        'Los tres coinciden con CC BY-NC (No comercial): dar crédito no basta si el uso ES comercial. Un tráiler gratis con crédito respeta la licencia; venderlo o monetizarlo con anuncios, no — aunque cites igual a Diego Nuñez.',
      );
    } else {
      marcarError('Todavía no. «No comercial» significa que ganar dinero con el resultado —venderlo o monetizarlo— rompe la licencia, aunque hayas dado crédito.');
    }
  };

  const comprobarUsoRenata = () => {
    if (bloqueado) return;
    if (todosLosUsosCorrectos(USOS_SIN_DERIVADOS, MUSICA_RENATA, usosRenata)) {
      marcarAcierto(
        'Los tres coinciden con CC BY-ND (Sin obras derivadas): se puede usar tal cual, dando crédito, pero no se puede modificar — ni cambiarle el tempo, ni recortarla — aunque también cites a la autora.',
      );
    } else {
      marcarError('Todavía no. «Sin obras derivadas» significa que cambiar la obra —aunque sea un poco— rompe la licencia, incluso si das crédito.');
    }
  };

  // ── Acto 3 ────────────────────────────────────────────────────────────
  const elegirReflexionAtribucion = (op: OpcionMcq) => {
    if (bloqueado) return;
    setReflexionAtribucionId(op.id);
    if (op.correcta) marcarAcierto(op.explicacion);
    else marcarError(op.explicacion);
  };

  const intentarGuardarValeria = () => {
    if (bloqueado) return;
    if (evalValeria.completa) {
      marcarAcierto('Con el nombre de la autora y la licencia, cualquiera que vea tu proyecto sabe de quién es la obra y qué puede hacer con ella. Eso es dar crédito de verdad.');
    } else {
      const faltan: string[] = [];
      if (!evalValeria.tieneAutor) faltan.push('el nombre de la autora (Valeria Sotelo)');
      if (!evalValeria.tieneLicencia) faltan.push('el tipo de licencia (CC BY / Atribución)');
      marcarError(`Todavía falta: ${faltan.join(' y ')}.`);
    }
  };

  // ── Acto 4 ────────────────────────────────────────────────────────────
  const alternarSeleccionProyecto = (id: string) => {
    if (bloqueado) return;
    setSeleccionProyecto((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const comprobarSeleccionProyecto = () => {
    if (bloqueado) return;
    if (seleccionDeAtribucionesCorrecta(seleccionProyecto)) {
      marcarAcierto(
        'Correcto: tu propia captura y la sinfonía de dominio público no piden nada. La ilustración de Ana Cabrera y el efecto de Diego Nuñez sí — las dos tienen licencia Creative Commons con condición de atribución.',
      );
    } else {
      marcarError('Todavía no. Revisa recurso por recurso: ¿tú la hiciste, ya es de todos, o alguien puso una licencia con condición?');
    }
  };

  const intentarGuardarProyecto = () => {
    if (bloqueado) return;
    if (evalProyecto.completa) {
      marcarAcierto(
        'Las dos atribuciones están completas: quien vea tu proyecto sabe que la ilustración es de Ana Cabrera (CC BY) y el efecto de sonido es de Diego Nuñez (CC BY-NC) — el conjunto entero que necesitaba tu tráiler.',
      );
    } else {
      const faltan: string[] = [];
      if (!evalProyecto.ana.completa) faltan.push('la ilustración de Ana Cabrera (nombre + licencia CC BY)');
      if (!evalProyecto.diego.completa) faltan.push('el efecto de sonido de Diego Nuñez (nombre + licencia CC BY-NC)');
      marcarError(`Todavía falta la atribución de: ${faltan.join(' y ')}.`);
    }
  };

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
      <VentanaBase marca="Tecnia Créditos" subtitulo="Banco de recursos · revisor de licencias">
        <div className="p-6 sm:p-10 text-center">
          <p className="text-5xl mb-4" aria-hidden="true">
            📜
          </p>
          <h2 className="text-2xl font-extrabold text-white mb-2">Insignia: Créditos en regla</h2>
          <p className="text-slate-300 max-w-xl mx-auto">
            Clasificaste procedencias distintas —propia, protegida, con condición, dominio público—, decidiste si usos
            concretos respetaban tres licencias Creative Commons distintas, escribiste atribuciones que llevan nombre
            Y licencia, y cerraste decidiendo el conjunto completo de créditos que necesitaba un proyecto con varios
            recursos a la vez. Eso es usar contenido ajeno con criterio, no adivinando.
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
  const todasVeredictosActo1Elegidas = RECURSOS_ACTO1.every((r) => veredictosActo1[r.id]);
  const todosUsosAnaElegidos = USOS_ATRIBUCION.every((u) => usosAna[u.id] !== undefined);
  const todosUsosDiegoElegidos = USOS_NO_COMERCIAL.every((u) => usosDiego[u.id] !== undefined);
  const todosUsosRenataElegidos = USOS_SIN_DERIVADOS.every((u) => usosRenata[u.id] !== undefined);

  return (
    <VentanaBase marca="Tecnia Créditos" subtitulo="Banco de recursos · revisor de licencias">
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

          <div className="bg-[#0b1220] border border-violet-500/30 rounded-2xl p-5 sm:p-6 flex flex-col gap-4" data-testid="pantalla-creditos">
            {/* Encargo 1 · clasificar cuatro procedencias */}
            {pasoActual === 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-slate-300">Cuatro recursos con procedencias distintas. Clasifica cada uno.</p>
                <ul className="flex flex-col gap-2" data-testid="lista-recursos-acto1">
                  {RECURSOS_ACTO1.map((r) => (
                    <li key={r.id} className="flex flex-col gap-2 bg-slate-800 rounded-xl px-4 py-3">
                      <span className="text-sm text-white">
                        <span aria-hidden="true">{r.icono}</span> {r.nombre}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {OPCIONES_VEREDICTO.map((op) => (
                          <button
                            key={op.id}
                            type="button"
                            data-testid="veredicto-opcion"
                            disabled={bloqueado}
                            onClick={() => elegirVeredictoActo1(r.id, op.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 ${
                              veredictosActo1[r.id] === op.id ? 'bg-violet-500 text-white' : 'bg-slate-700 text-slate-200'
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
                    disabled={!todasVeredictosActo1Elegidas}
                    onClick={comprobarActo1}
                    className="px-5 py-3 rounded-xl bg-violet-500 text-white font-bold disabled:opacity-50 self-start"
                  >
                    Comprobar
                  </button>
                )}
              </div>
            )}

            {/* Encargo 2 · Atribución (CC BY) */}
            {pasoActual === 1 && (
              <UsosLicencia
                recurso={RECURSO_ILUSTRACION_ANA}
                usos={USOS_ATRIBUCION}
                seleccion={usosAna}
                bloqueado={bloqueado}
                onElegir={(id, v) => !bloqueado && setUsosAna((prev) => ({ ...prev, [id]: v }))}
                onComprobar={comprobarUsoAna}
                puedeComprobar={todosUsosAnaElegidos}
              />
            )}

            {/* Encargo 3 · No comercial (CC BY-NC) */}
            {pasoActual === 2 && (
              <UsosLicencia
                recurso={EFECTO_DIEGO}
                usos={USOS_NO_COMERCIAL}
                seleccion={usosDiego}
                bloqueado={bloqueado}
                onElegir={(id, v) => !bloqueado && setUsosDiego((prev) => ({ ...prev, [id]: v }))}
                onComprobar={comprobarUsoDiego}
                puedeComprobar={todosUsosDiegoElegidos}
              />
            )}

            {/* Encargo 4 · Sin obras derivadas (CC BY-ND) */}
            {pasoActual === 3 && (
              <UsosLicencia
                recurso={MUSICA_RENATA}
                usos={USOS_SIN_DERIVADOS}
                seleccion={usosRenata}
                bloqueado={bloqueado}
                onElegir={(id, v) => !bloqueado && setUsosRenata((prev) => ({ ...prev, [id]: v }))}
                onComprobar={comprobarUsoRenata}
                puedeComprobar={todosUsosRenataElegidos}
              />
            )}

            {/* Encargo 5 · reconoce una atribución completa */}
            {pasoActual === 4 && (
              <McqBloque
                pregunta="¿Cuál de estas cuatro SÍ es una atribución completa?"
                opciones={OPCIONES_ATRIBUCION_COMPLETA}
                elegidoId={reflexionAtribucionId}
                bloqueado={bloqueado}
                onElegir={elegirReflexionAtribucion}
              />
            )}

            {/* Encargo 6 · escribe tú mismo la atribución */}
            {pasoActual === 5 && (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-slate-300">
                  Vas a usar esta ilustración: <strong className="text-white">{RECURSO_VALERIA.nombre}</strong>, de{' '}
                  <strong className="text-white">{RECURSO_VALERIA.autor}</strong>, tomada de {RECURSO_VALERIA.fuente}, con licencia{' '}
                  {RECURSO_VALERIA.licenciaTexto}. Escribe la atribución completa.
                </p>
                <textarea
                  data-testid="input-atribucion-valeria"
                  value={textoValeria}
                  disabled={bloqueado}
                  onChange={(e) => setTextoValeria(e.target.value)}
                  placeholder="Ilustración… de… tomada de… licencia…"
                  rows={3}
                  className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white disabled:opacity-50 resize-none"
                />
                <ChecklistAtribucion evaluacion={evalValeria} />
                {!bloqueado && (
                  <button
                    type="button"
                    data-testid="guardar-atribucion-valeria"
                    onClick={intentarGuardarValeria}
                    className="px-4 py-3 rounded-xl bg-violet-500 text-white font-bold self-start"
                  >
                    Guardar atribución
                  </button>
                )}
              </div>
            )}

            {/* Encargo 7 · qué recursos del proyecto necesitan atribución */}
            {pasoActual === 6 && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-slate-300">
                  Vas a armar el tráiler de tu videojuego con estos cuatro recursos. Marca los que necesitan atribución.
                </p>
                <ul className="flex flex-col gap-2" data-testid="lista-recursos-proyecto">
                  {RECURSOS_PROYECTO.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 bg-slate-800 rounded-xl px-4 py-3">
                      <span className="text-sm text-white flex-1">
                        <span aria-hidden="true">{r.icono}</span> {r.nombre}
                        <span className="block text-xs text-slate-400">{r.licenciaTexto}</span>
                      </span>
                      <button
                        type="button"
                        data-testid="toggle-necesita-atribucion"
                        disabled={bloqueado}
                        onClick={() => alternarSeleccionProyecto(r.id)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-50 ${
                          seleccionProyecto[r.id] ? 'bg-violet-500 text-white' : 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        {seleccionProyecto[r.id] ? '✓ Necesita atribución' : 'No necesita'}
                      </button>
                    </li>
                  ))}
                </ul>
                {!bloqueado && (
                  <button
                    type="button"
                    data-testid="comprobar-seleccion-proyecto"
                    onClick={comprobarSeleccionProyecto}
                    className="px-5 py-3 rounded-xl bg-violet-500 text-white font-bold self-start"
                  >
                    Comprobar
                  </button>
                )}
              </div>
            )}

            {/* Encargo 8 · escribe el bloque completo de atribuciones del proyecto */}
            {pasoActual === 7 && (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-slate-300">
                  Escribe, en un solo bloque, la atribución de los DOS recursos que la necesitan: la ilustración de{' '}
                  <strong className="text-white">Ana Cabrera</strong> (CC BY) y el efecto de sonido de{' '}
                  <strong className="text-white">Diego Nuñez</strong> (CC BY-NC).
                </p>
                <textarea
                  data-testid="input-atribucion-proyecto"
                  value={textoProyecto}
                  disabled={bloqueado}
                  onChange={(e) => setTextoProyecto(e.target.value)}
                  placeholder="Ilustración… de Ana Cabrera, licencia CC BY. Efecto de sonido… de Diego Nuñez, licencia CC BY-NC."
                  rows={4}
                  className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white disabled:opacity-50 resize-none"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-400 mb-1">Ana Cabrera</p>
                    <ChecklistAtribucion evaluacion={evalProyecto.ana} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 mb-1">Diego Nuñez</p>
                    <ChecklistAtribucion evaluacion={evalProyecto.diego} />
                  </div>
                </div>
                {!bloqueado && (
                  <button
                    type="button"
                    data-testid="guardar-atribucion-proyecto"
                    onClick={intentarGuardarProyecto}
                    className="px-4 py-3 rounded-xl bg-violet-500 text-white font-bold self-start"
                  >
                    Guardar atribuciones
                  </button>
                )}
              </div>
            )}

            {/* Encargo 9 · reflexión de cierre */}
            {pasoActual === 8 && (
              <McqBloque
                pregunta="¿Por qué tu propia captura y la sinfonía de hace 250 años NO necesitan atribución, pero la ilustración y el efecto de sonido sí?"
                opciones={OPCIONES_CIERRE}
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
// 7 · Widgets locales
// ═══════════════════════════════════════════════════════════════════════════

/** Un recurso con licencia CC y una lista de usos propuestos, cada uno
 *  clasificado independientemente contra `usoRespetaLicencia`. Reusado por
 *  los tres encargos del Acto 2 — sólo cambian el recurso y los usos. */
function UsosLicencia({
  recurso,
  usos,
  seleccion,
  bloqueado,
  onElegir,
  onComprobar,
  puedeComprobar,
}: {
  recurso: RecursoMultimedia;
  usos: UsoPropuesto[];
  seleccion: Record<string, boolean | undefined>;
  bloqueado: boolean;
  onElegir: (id: string, respeta: boolean) => void;
  onComprobar: () => void;
  puedeComprobar: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-slate-800 rounded-xl px-4 py-3">
        <p className="text-sm text-white">
          <span aria-hidden="true">{recurso.icono}</span> {recurso.nombre}
        </p>
        <p className="text-xs text-slate-400">
          Autor: {recurso.autor} · Licencia: <strong className="text-violet-300">{recurso.licenciaTexto}</strong>
        </p>
      </div>
      <p className="text-sm text-slate-300">¿Cada uso de abajo respeta esta licencia?</p>
      <ul className="flex flex-col gap-2" data-testid="lista-usos">
        {usos.map((u) => (
          <li key={u.id} className="flex flex-col gap-2 bg-slate-800 rounded-xl px-4 py-3">
            <span className="text-sm text-slate-200">{u.descripcion}</span>
            <div className="flex gap-2">
              <button
                type="button"
                data-testid="uso-respeta"
                disabled={bloqueado}
                onClick={() => onElegir(u.id, true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 ${
                  seleccion[u.id] === true ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-200'
                }`}
              >
                ✅ Respeta la licencia
              </button>
              <button
                type="button"
                data-testid="uso-no-respeta"
                disabled={bloqueado}
                onClick={() => onElegir(u.id, false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 ${
                  seleccion[u.id] === false ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-200'
                }`}
              >
                🚫 No la respeta
              </button>
            </div>
          </li>
        ))}
      </ul>
      {!bloqueado && (
        <button
          type="button"
          data-testid="comprobar-usos"
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

/** Checklist de los cuatro datos de una atribución, leído directo del
 *  resultado real — igual que `MedidorFuerza` en la hermana de ciberseguridad,
 *  nada se pinta a mano según lo que el alumno haya escrito. */
function ChecklistAtribucion({ evaluacion }: { evaluacion: EvaluacionAtribucion }) {
  const criterios: { etiqueta: string; ok: boolean }[] = [
    { etiqueta: 'Autor', ok: evaluacion.tieneAutor },
    { etiqueta: 'Título', ok: evaluacion.tieneTitulo },
    { etiqueta: 'Fuente', ok: evaluacion.tieneFuente },
    { etiqueta: 'Licencia', ok: evaluacion.tieneLicencia },
  ];
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-400" data-testid="checklist-atribucion">
      {criterios.map((c) => (
        <li key={c.etiqueta} className={c.ok ? 'text-emerald-400' : ''}>
          {c.ok ? '✓' : '✗'} {c.etiqueta}
        </li>
      ))}
    </ul>
  );
}

/** Bloque de opción múltiple, reusado por las dos reflexiones. */
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

export default LabDerechosYLicencias;
