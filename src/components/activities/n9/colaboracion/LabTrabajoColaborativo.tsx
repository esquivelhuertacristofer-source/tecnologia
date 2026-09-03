'use client';

import { useRef, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { ConNegritas } from '@/components/ui/ConNegritas';
import { useLabActividad } from '../../lib/useLabActividad';
import { reproducirTono } from '../../n1/mision/audio';
import { VentanaBase } from '../../../simuladores/VentanaBase';
import {
  useNube,
  VentanaNube,
  type ArchivoNube,
  type EleccionConflicto,
  type PermisoNube,
  type PersonaNube,
  type VersionArchivo,
} from '../../../simuladores/nube';
// Igual que en `n5-documentos-compartidos`: `ArchivoNube` envuelve un
// `ArchivoSO` de verdad, y el índice de `nube/` no lo reexporta.
import type { ArchivoSO } from '../../../simuladores/sistema';
import './trabajoColaborativo.css';

/**
 * N9 · «Nube y colaboración profesional» · parada 1 de 2 · «Trabajo
 * colaborativo en la nube». Prestada al bloque Office (`office: { app:
 * 'm365', grado: 'intermedio' }`, ya declarado en `curriculo.ts`).
 *
 * Nivel 9 = 3.º de Secundaria, 14–15 años (verificado en `src/data/
 * curriculo.ts`). Antecede a `n9-gestiona-tu-proyecto` en la ruta: el mismo
 * equipo —Iker, Melissa y Diego, construyendo la app de turnos de la
 * papelería— aparece en las dos clases. Ahí gestionan el TABLERO de tareas,
 * tres semanas adentro del proyecto; aquí, ANTES de escribir una sola línea
 * de código, escriben juntos la PROPUESTA: el documento que le van a
 * enseñar a su profesor. Documentos, no tareas — ésa es la frontera con la
 * hermana, y no se cruza.
 *
 * SIN 3D, a propósito, mismo criterio que `n5-documentos-compartidos`: lo
 * que abre el alumno es un programa, y el armazón es `simuladores/nube/` DE
 * VERDAD —`useNube` + `VentanaNube` + `VentanaBase`—, reutilizado tal cual,
 * sin tocar una línea.
 *
 * ── Qué confirmé leyendo el armazón, y qué NO existe ────────────────────
 *
 * `simuladores/nube/tiposNube.ts` y `useNube.ts` SÍ dan, de verdad:
 *   · tres niveles de permiso —ver / comentar / editar— como ETIQUETAS que
 *     la clase decide cuándo son correctas; el armazón no impone ninguna
 *     restricción mecánica por sí solo (no hay «con ver no puedes guardar»
 *     dentro del motor: eso lo hace narrar la clase, igual que en N5).
 *   · coautoría en vivo real: `entrarAEditar` / `salirDeEditar`, con
 *     `editandoAhora` visible en la ventana ANTES de que nadie guarde nada
 *     — se puede, literalmente, «revisar quién anda dentro antes de
 *     entrar».
 *   · un conflicto real por `basadaEnVersionId` obsoleto, con tres formas
 *     de resolverlo (`local` / `remota` / `conservar-ambas`), y
 *     `conservar-ambas` que JAMÁS funde el contenido de las dos: deja dos
 *     versiones separadas en el historial y la vista actual muestra sólo
 *     una. El armazón no mezcla texto — eso lo confirma `resolverConflicto`
 *     en `tiposNube.ts`, y esta clase lo dice en voz alta en vez de fingir
 *     que si se fusiona.
 *   · enlace público con su propio permiso, quién ya entró y que revocar
 *     nunca borra eso.
 *   · `cambiarPermiso`, para SUBIR o BAJAR una llave ya dada sin quitarla
 *     del todo — capacidad que `n5-documentos-compartidos` nunca usó para
 *     bajar (sólo para corregir un error en el momento), y que aquí es el
 *     mecanismo central del cierre.
 *
 * Lo que el armazón NO da, y por lo que esta clase NO inventa nada encima:
 *   · no hay hilos de comentarios de verdad —ninguna nota queda escrita en
 *     ningún lado—; «comentar» es sólo la ETIQUETA de permiso. Por eso esta
 *     clase enseña CUÁNDO esa llave es la correcta (a través de a quién se
 *     la das y por qué), nunca simula un cuadro de comentarios que no
 *     existe.
 *   · no hay @menciones ni notificaciones push; no se simulan.
 *   · no hay secciones dentro del documento que el armazón sepa repartir
 *     por persona — `ArchivoNube` es UN documento, no un mapa de quién
 *     escribe qué párrafo. «No pisarse» se enseña con la única señal real
 *     que si existe —`editandoAhora`, ver quién anda dentro AHORA MISMO—,
 *     no con una asignación de secciones que el motor no modela.
 *
 * ── Cómo profundiza sobre `n5-documentos-compartidos` sin repetirla ─────
 *
 * N5 ya cerró: dar la llave del tamaño justo (ver/editar), un choque y
 * resolverlo, recuperar un bloque borrado con el historial, un enlace que
 * se revoca, y recoger las llaves al final. Esta clase da por sabido todo
 * eso y NO lo repite (no hay una restauración de historial aquí: ya está
 * enseñada). Lo nuevo:
 *
 *   1. **`comentar` como respuesta correcta**, no como opción de relleno.
 *      Sofía, de otro equipo, revisa la propuesta sin pertenecer al
 *      equipo: la llave correcta no es `ver` (no podría dejar nada) ni
 *      `editar` (reescribiría directo algo que no es suyo). El cierre
 *      vuelve a esa distinción con el profesor Nava (`ver`, sólo entra al
 *      final) para que las tres llaves queden contrastadas una junto a
 *      otra.
 *   2. **Revisar antes de entrar**, con los botones REALES del armazón que
 *      N5 nunca usó como acción del alumno (`onEntrarAEditar`,
 *      `onSalirDeEditar` — en N5 sólo se llamaban programáticamente para
 *      los personajes). Aquí el alumno mismo mira «Editando ahora» y hace
 *      clic en «✏️ Entrar a editar». La lección madura un paso más: revisar
 *      ayuda, pero no es infalible —Diego entra sin revisar mientras el
 *      alumno sigue dentro, y el choque pasa de todos modos—, así que
 *      coordinarse Y saber resolver un choque son las dos mitades de la
 *      misma destreza, no una en vez de la otra.
 *   3. **El riesgo del enlace, en la escala real de un chat de equipo**: no
 *      es «alguien del salón de al lado» sino cualquiera del chat general
 *      del grado, que puede tener cien y pico de personas. Mismo mecanismo
 *      del armazón que N5, otra escala de consecuencia.
 *   4. **El cierre por ciclo de vida del permiso**: bajar una llave que ya
 *      cumplió su función (`cambiarPermiso` de `editar` a `comentar`) en
 *      vez de quitarla del todo. N5 cerraba recogiendo TODAS las llaves
 *      porque el cartel ya se había entregado; aquí el documento sigue
 *      vivo —va a pasar a code review y a la maestra— así que la lección
 *      es distinta: no todo permiso que ya sirvió se retira, algunos se
 *      AJUSTAN. Por eso esta clase no repite «recoger las llaves»
 *      (`quitarAcceso` no se usa ni una vez): sería la misma lección de N5
 *      con otro nombre.
 *
 * ── El orden de las operaciones del armazón, mismo cuidado que N5 ───────
 *
 * Regla verificada en `useNube.ts` y documentada en la cabecera de
 * `LabDocumentosCompartidos.tsx`: las operaciones que empiezan por
 * `buscar()` (`compartir`, `guardarCambios`, `resolverConflicto`,
 * `abrirEnlace`) leen `archivosRef.current`, que sólo se pone al día en un
 * efecto — y luego REEMPLAZAN el archivo entero con lo que calcularon de
 * esa foto. Las que usan `prev` (`cambiarPermiso`, `generarEnlace`,
 * `revocarEnlace`, `entrarAEditar`, `salirDeEditar`) sí componen. Donde un
 * mismo gesto necesita las dos (el beat de Diego: guarda Y entra a editar;
 * el cierre del choque: resuelve Y los dos salen), la operación de
 * `buscar()` va SIEMPRE primero — si no, borra silenciosamente lo que la
 * otra acababa de escribir.
 *
 * ── Doble clic ────────────────────────────────────────────────────────
 *
 * Misma solución que N5: la fase manda desde un `useRef`
 * (`faseRef`) y el estado sólo la espeja para pintar.
 *
 * ── Tono: registro de 14–15 años ─────────────────────────────────────────
 *
 * Término técnico con su traducción la primera vez que aparece (p. ej.
 * «coautoría en tiempo real» / *co-authoring*), sin diminutivos, y las
 * consecuencias se explican por lo que SIGNIFICAN en un equipo de trabajo
 * real, no por si «está bien o mal». Nadie es el malo: Diego no revisa por
 * apuro, no por descuido punible, y quien abre el enlace en el chat del
 * grado no es nadie peligroso — es que los enlaces circulan.
 */

/* ══════════════════════════════════════════════════════════════════════════
   Los datos. Constantes y funciones puras: nada de esto sabe de React.
   ══════════════════════════════════════════════════════════════════════════ */

const IKER: PersonaNube = { id: 'iker', nombre: 'Iker', avatar: '🧢' };
const MELISSA: PersonaNube = { id: 'melissa', nombre: 'Melissa', avatar: '🎬' };
const DIEGO: PersonaNube = { id: 'diego', nombre: 'Diego', avatar: '📝' };
/** Revisora del equipo de Rulfo — de fuera del equipo, no coescribe. */
const SOFIA: PersonaNube = { id: 'sofia', nombre: 'Sofía (equipo Rulfo)', avatar: '🔍' };
/** Sólo entra al final, a ver la versión que ya se entrega. */
const PROFESOR: PersonaNube = { id: 'profesor', nombre: 'Profesor Nava', avatar: '🧑‍🏫' };
/** Quien abre el enlace reenviado en el chat del grado. No es nadie peligroso. */
const ALGUIEN: PersonaNube = { id: 'alguien', nombre: 'Alguien del chat del grado', avatar: '👤' };

const NODO: ArchivoSO = {
  tipo: 'archivo',
  id: 'propuesta',
  nombre: 'Propuesta del proyecto: Turnos sin fila.tec',
  tamano: 1_800_000,
  fecha: 'Ayer, 4:05 p. m.',
};

/**
 * El `resumen` de cada versión hace doble oficio, igual que en N5: es lo
 * que el alumno lee en el historial y la llave con la que `docDe` sabe qué
 * bloques tenía la propuesta en ese momento.
 */
const RES_INICIO = 'Iker armó la propuesta';
const RES_PUBLICO = 'Melissa escribió el público objetivo';
const RES_CRONOGRAMA = 'Iker escribió el cronograma';
const RES_CONCLUSION = 'Diego escribió la conclusión';

const V_INICIO: VersionArchivo = {
  id: 'v-inicio',
  autor: IKER,
  fecha: 'Ayer, 4:05 p. m.',
  resumen: RES_INICIO,
};

const PROPUESTA: ArchivoNube = {
  nodo: NODO,
  estado: 'subido',
  propietario: IKER,
  // Diego ya tenía acceso desde que se armó el equipo — el onboarding de
  // esta clase es el de Melissa, que se suma para escribir esta parte.
  compartidoCon: [{ persona: DIEGO, permiso: 'editar' }],
  historial: [V_INICIO],
  versionActualId: V_INICIO.id,
  editandoAhora: [],
};

/** Identidad estable: `useNube` la lee UNA vez y `reiniciar()` vuelve a ella. */
const SEMILLA: ArchivoNube[] = [PROPUESTA];

const CAPACIDAD = 5_000_000_000;

/** Qué bloques de la propuesta existen en una versión dada. */
interface EstadoDoc {
  objetivo: boolean;
  publico: boolean;
  cronograma: boolean;
  conclusion: boolean;
  /** El objetivo garabateado por quien entró por el enlace, si el permiso era de escribir. */
  objetivoDanado: boolean;
}

const DOC_POR_RESUMEN: Record<string, Omit<EstadoDoc, 'objetivoDanado'>> = {
  [RES_INICIO]: { objetivo: true, publico: false, cronograma: false, conclusion: false },
  [RES_PUBLICO]: { objetivo: true, publico: true, cronograma: false, conclusion: false },
  // Salió de la MISMA versión que la de Diego, antes de que él guardara: por
  // eso NO trae la conclusión. Eso es exactamente lo que es un conflicto.
  [RES_CRONOGRAMA]: { objetivo: true, publico: true, cronograma: true, conclusion: false },
  [RES_CONCLUSION]: { objetivo: true, publico: true, cronograma: false, conclusion: true },
};

const DOC_BASE = DOC_POR_RESUMEN[RES_INICIO];

/** Qué se ve de la propuesta ahora mismo. Función pura de la versión que se muestra. */
function docDe(archivo: ArchivoNube, objetivoDanado: boolean): EstadoDoc {
  const version = archivo.historial.find((v) => v.id === archivo.versionActualId);
  const clave = version?.resumen;
  const base = (clave ? DOC_POR_RESUMEN[clave] : undefined) ?? DOC_BASE;
  return { ...base, objetivoDanado };
}

/**
 * `resolverConflicto` del armazón vuelve a empujar al historial la versión
 * remota, que ya estaba dentro (mismo hallazgo que documenta la cabecera de
 * `LabDocumentosCompartidos.tsx`). Se quita la repetida SÓLO para pintar,
 * sin tocar el armazón compartido. Identidad si no hay nada que quitar.
 */
function sinVersionesRepetidas(archivo: ArchivoNube): ArchivoNube {
  const vistos = new Set<string>();
  const limpio = archivo.historial.filter((v) => {
    if (vistos.has(v.id)) return false;
    vistos.add(v.id);
    return true;
  });
  if (limpio.length === archivo.historial.length) return archivo;
  return { ...archivo, historial: limpio };
}

interface EncargoDef {
  id: string;
  titulo: string;
  pide: string;
}

const ENCARGOS: EncargoDef[] = [
  {
    id: 'coescribir',
    titulo: 'Comparte para coescribir',
    pide: 'Melissa va a escribir el **público objetivo** contigo, al mismo tiempo. Dale la llave de **editar**.',
  },
  {
    id: 'mirada-externa',
    titulo: 'La mirada de otro equipo',
    pide: 'Sofía, del equipo de Rulfo, va a revisar la propuesta antes de que la entreguen y dejar sus notas — sin tocar una palabra del texto, porque no es de tu equipo. Dale la llave de **comentar**.',
  },
  {
    id: 'revisar-antes',
    titulo: 'Revisa quién anda dentro antes de escribir',
    pide: 'Vas a escribir el **cronograma**. Antes de nada, fíjate en «Editando ahora»: si está vacío, entra tú mismo con **✏️ Entrar a editar**.',
  },
  {
    id: 'choque-real',
    titulo: 'Cuando alguien no revisa primero',
    pide: 'Guarda tu cronograma con **💾 Guardar cambios** — y fíjate qué pasó mientras escribías.',
  },
  {
    id: 'enlace-grado',
    titulo: 'El enlace para la revisión de grado',
    pide: 'La maestra quiere que todo el grado pueda leer la propuesta antes de la sesión de retroalimentación. Genera un enlace, y piensa bien el permiso: esto no lo va a abrir un salón, lo va a abrir un chat entero.',
  },
  {
    id: 'revocar',
    titulo: 'Revócalo',
    pide: 'Se acabó la sesión de retroalimentación del grado. **Revoca el enlace.**',
  },
  {
    id: 'solo-ver',
    titulo: 'Comparte el resultado con quien sólo necesita verlo',
    pide: 'El profesor Nava no va a escribir nada: sólo necesita **ver** la versión final antes de que la entreguen. Dale esa llave, ni una más grande.',
  },
  {
    id: 'cerrar-fase',
    titulo: 'Cierra la fase de escritura',
    pide: 'Melissa ya terminó su parte y la propuesta está por entregarse. Bájale el permiso de **editar** a **comentar** — ya no hace falta que siga reescribiendo, pero puede seguir dejando notas si algo se le ocurre.',
  },
];

const TOTAL_PASOS = ENCARGOS.length; // 8

type Fase = 'e1' | 'p-melissa' | 'e2' | 'e3' | 'p-diego' | 'e4' | 'e5' | 'p-visita' | 'e6' | 'e7' | 'e8' | 'cierre';

/** Qué encargo está en juego en cada fase (8 = ya no queda ninguno). */
const ENCARGO_DE_FASE: Record<Fase, number> = {
  e1: 0,
  'p-melissa': 0,
  e2: 1,
  e3: 2,
  'p-diego': 3,
  e4: 3,
  e5: 4,
  'p-visita': 4,
  e6: 5,
  e7: 6,
  e8: 7,
  cierre: 8,
};

const L_INICIO =
  'Iker, Melissa y Diego van a construir una app para pedir turno en la papelería del receso. Antes de escribir una sola línea de código, escribieron esto: la propuesta que le van a enseñar a su profesor. Es un documento compartido en la nube, y ahora te toca a ti llevarlo hasta que quede listo para entregar.';

/* ══════════════════════════════════════════════════════════════════════════
   El laboratorio.
   ══════════════════════════════════════════════════════════════════════════ */

export function LabTrabajoColaborativo(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const labActividad = useLabActividad(props, TOTAL_PASOS, {});
  const nube = useNube({ archivos: SEMILLA, capacidad: CAPACIDAD });

  // La fase manda desde el ref; el estado sólo pinta (mismo defecto de doble
  // clic que documenta la cabecera de N5, misma solución).
  const faseRef = useRef<Fase>('e1');
  const [fase, setFase] = useState<Fase>('e1');

  const [historial, setHistorial] = useState<string[]>([L_INICIO]);

  // El formulario de compartir del armazón, reusado en e1 / e2 / e7.
  const [formPersona, setFormPersona] = useState('');
  // Arranca en la llave más chica a propósito, igual que N5: la primera vez
  // que el alumno comparte, si no piensa el permiso, se queda corto.
  const [formPermiso, setFormPermiso] = useState<PermisoNube>('ver');
  // El enlace arranca ya en el permiso correcto: el riesgo sólo se activa si
  // el alumno lo cambia — explorar la llave grande es su decisión, no una trampa fija.
  const [permisoEnlace, setPermisoEnlace] = useState<PermisoNube>('ver');

  const [objetivoDanado, setObjetivoDanado] = useState(false);

  // Para el resumen del cierre.
  const [sinPisarse, setSinPisarse] = useState(false);
  const [permisosAlaMedida, setPermisosAlaMedida] = useState(true);

  /** La versión de la que Iker partió al entrar a escribir — antes del guardado de Diego. */
  const baseCronogramaRef = useRef<string | null>(V_INICIO.id);
  const guardadoIkerRef = useRef(false);

  const archivo = nube.archivos[0];
  const doc = docDe(archivo, objetivoDanado);
  const accesos = archivo.compartidoCon;

  const decir = (linea: string) => setHistorial((prev) => [...prev, linea]);
  const irA = (siguiente: Fase) => {
    faseRef.current = siguiente;
    setFase(siguiente);
  };

  /* ── Encargo 1 · comparte para coescribir ─────────────────────────────── */

  const compartirAhora = () => {
    const f = faseRef.current;
    const objetivo = f === 'e1' ? MELISSA : f === 'e2' ? SOFIA : f === 'e7' ? PROFESOR : null;
    if (!objetivo || formPersona !== objetivo.id) return;

    const r = nube.compartir(NODO.id, objetivo, formPermiso);
    setFormPersona('');
    if (!r.ok) return;

    const correcto: PermisoNube = f === 'e1' ? 'editar' : f === 'e2' ? 'comentar' : 'ver';
    if (formPermiso === correcto) {
      reproducirTono('correct');
      cumplirCompartir(f, objetivo);
      return;
    }

    reproducirTono('select');
    labActividad.restar();
    setPermisosAlaMedida(false);
    decir(mensajePermisoIncorrecto(f, objetivo, formPermiso));
  };

  const mensajePermisoIncorrecto = (f: Fase, objetivo: PersonaNube, permiso: PermisoNube): string => {
    if (f === 'e1') {
      return permiso === 'ver'
        ? 'Melissa abrió la propuesta… y no puede escribir nada, sólo mirarla. Con **ver** se mira; para escribir junto a ti hace falta **editar**. Cámbiaselo en su selector.'
        : 'Con **comentar** Melissa puede dejar notas al margen, pero el texto no se mueve, y ella va a escribir el público objetivo de verdad. Súbele la llave a **editar**.';
    }
    if (f === 'e2') {
      return permiso === 'ver'
        ? 'Con **ver**, Sofía puede leer la propuesta completa pero no dejar ni una nota. Para revisar de verdad necesita **comentar**.'
        : 'Con **editar**, Sofía podría reescribir el documento directo — y no es de tu equipo: sus ideas son sugerencias, no cambios. Bájasela a **comentar**.';
    }
    return permiso === 'editar'
      ? 'El profesor Nava no va a escribir nada: darle **editar** es demasiado, y hasta podría cambiar sin querer lo que ya van a entregar. Bájasela a **ver**.'
      : '**Comentar** es para quien revisa a mitad del camino, como Sofía. El profesor entra al final, sólo a ver la versión que ya se entrega: con **ver** le alcanza.';
  };

  const cumplirCompartir = (f: Fase, objetivo: PersonaNube) => {
    labActividad.avanzar();
    if (f === 'e1') {
      decir(
        `${objetivo.nombre} no recibió una copia: recibió la llave de este mismo documento. Es **coautoría en tiempo real** (*co-authoring*, lo mismo que ya usas en Google Docs o en Word): los dos pueden estar aquí a la vez, y lo que ella escriba aparece en tu pantalla.`,
      );
      irA('p-melissa');
      return;
    }
    if (f === 'e2') {
      decir(
        'Con **comentar**, Sofía puede leer todo y dejar sus notas, pero no le va a mover una sola letra al texto — la decisión de qué cambiar sigue siendo del equipo. Es la llave correcta para alguien de fuera que va a opinar, no a escribir.',
      );
      irA('e3');
      return;
    }
    // f === 'e7'
    decir(
      'Listo: el profesor Nava puede entrar a ver la versión que le van a entregar, y nada más. No necesita más que eso, y darle más sería un riesgo que a él ni le hace falta correr.',
    );
    irA('e8');
  };

  const cambiarPermisoAcceso = (nodoId: string, personaId: string, permiso: PermisoNube) => {
    nube.cambiarPermiso(nodoId, personaId, permiso);
    const f = faseRef.current;

    if (f === 'e1' && personaId === MELISSA.id && permiso === 'editar') {
      reproducirTono('correct');
      cumplirCompartir('e1', MELISSA);
      return;
    }
    if (f === 'e2' && personaId === SOFIA.id && permiso === 'comentar') {
      reproducirTono('correct');
      cumplirCompartir('e2', SOFIA);
      return;
    }
    if (f === 'e7' && personaId === PROFESOR.id && permiso === 'ver') {
      reproducirTono('correct');
      cumplirCompartir('e7', PROFESOR);
      return;
    }

    // Encargo 8 · cerrar la fase de escritura: bajar a Melissa de editar a comentar.
    if (f === 'e8' && personaId === MELISSA.id) {
      if (permiso === 'comentar') {
        reproducirTono('correct');
        labActividad.avanzar();
        decir(
          'Melissa ya no puede reescribir el documento — pero si algo se le ocurre antes de entregar, todavía puede dejarlo dicho. Bajar la llave, no quitarla del todo: el documento sigue vivo.',
        );
        irA('cierre');
        return;
      }
      if (permiso === 'ver') {
        decir(
          'Con **ver**, Melissa ya ni puede dejar una nota de última hora si nota algo raro antes de entregar. Todavía puede hacer falta un comentario: la llave que cierra bien esta fase es **comentar**, no ver.',
        );
      }
    }
  };

  /* ── El beat de Melissa: entra, escribe y guarda — fuera de cámara ───── */

  const seguirAMelissa = () => {
    if (faseRef.current !== 'p-melissa') return;
    irA('e2');
    reproducirTono('select');
    nube.guardarCambios(NODO.id, {
      autor: MELISSA,
      fecha: 'Hoy, 9:20 a. m.',
      resumen: RES_PUBLICO,
      basadaEnVersionId: archivo.versionActualId,
    });
    decir(
      'Ahí está el público objetivo de Melissa, aparecido solo en tu pantalla. Ya guardó y ya se salió — el documento no se queda marcado como si alguien siguiera dentro cuando ya nadie está escribiendo.',
    );
  };

  /* ── Encargo 3 · revisa quién anda dentro antes de escribir ──────────── */

  const entrarYRevisar = () => {
    if (faseRef.current !== 'e3') return;
    if (archivo.editandoAhora.length > 0) return; // por si acaso: no debería pasar en este punto del guion
    baseCronogramaRef.current = archivo.versionActualId;
    nube.entrarAEditar(NODO.id, IKER);
    reproducirTono('correct');
    labActividad.avanzar();
    decir(
      '«Editando ahora» estaba vacío: nadie más andaba dentro, así que entraste tú. Esa comprobación — mirar antes de escribir — es la mitad de no pisarse con un compañero.',
    );
    irA('p-diego');
  };

  /* ── El beat de Diego: entra SIN revisar, y guarda de una vez ─────────── */

  const seguirADiego = () => {
    if (faseRef.current !== 'p-diego') return;
    irA('e4');
    reproducirTono('select');
    // Orden obligatorio (ver cabecera): `guardarCambios` lee `buscar()` y
    // va SIEMPRE primero; `entrarAEditar` compone sobre `prev` y va después.
    nube.guardarCambios(NODO.id, {
      autor: DIEGO,
      fecha: 'Hoy, 9:24 a. m.',
      resumen: RES_CONCLUSION,
      basadaEnVersionId: archivo.versionActualId,
    });
    nube.entrarAEditar(NODO.id, DIEGO);
    decir(
      'Diego entró sin fijarse en «Editando ahora» — tenía prisa por dejar lista la conclusión antes de la clase siguiente — y guardó su parte de una vez. Tú sigues adentro, todavía escribiendo el cronograma.',
    );
  };

  /* ── Encargo 4 · cuando alguien no revisa primero ─────────────────────── */

  const guardarComoIker = () => {
    if (faseRef.current !== 'e4') return;
    if (guardadoIkerRef.current) return;
    guardadoIkerRef.current = true;
    reproducirTono('select');
    nube.guardarCambios(NODO.id, {
      autor: IKER,
      fecha: 'Hoy, 9:26 a. m.',
      resumen: RES_CRONOGRAMA,
      basadaEnVersionId: baseCronogramaRef.current,
    });
    decir(
      'Chocaron. Tú revisaste antes de entrar y aun así pasó: Diego guardó mientras tú seguías escribiendo, y tu base ya quedó vieja. Revisar ayuda — no es infalible. Para esto está el conflicto: el documento se paró a preguntarte en vez de perder el trabajo de cualquiera de los dos.',
    );
  };

  const resolver = (nodoId: string, eleccion: EleccionConflicto) => {
    if (faseRef.current !== 'e4') return;
    const r = nube.resolverConflicto(nodoId, eleccion);
    if (!r.ok) return;

    if (eleccion === 'conservar-ambas') {
      reproducirTono('correct');
      setSinPisarse(true);
      decir(
        'Se quedaron las dos: tu cronograma arriba, y la conclusión de Diego guardada abajo, en el historial. **El programa no las junta por ti** — no existe un botón que fusione el texto de los dos; alguien del equipo tiene que juntarlas a mano, fuera de este documento. Pero lo importante ya pasó: no se perdió el trabajo de nadie.',
      );
    } else {
      labActividad.restar();
      decir(
        'Se quedó una sola versión, y la otra no llegó a guardarse — el trabajo de quien perdió el choque hay que volver a escribirlo. No pasa nada grave, pero fíjate: **conservar las dos** es la única opción que no le cuesta nada a nadie.',
      );
    }

    // Orden obligatorio: `resolverConflicto` lee `buscar()` y va primero; los
    // dos `salirDeEditar` componen sobre `prev` y van después.
    nube.salirDeEditar(nodoId, IKER.id);
    nube.salirDeEditar(nodoId, DIEGO.id);
    decir('Los dos salen del documento: ya guardaron lo suyo, y avisar que terminaste es parte de trabajar en equipo.');

    labActividad.avanzar();
    irA('e5');
  };

  /* ── Encargo 5 y 6 · el enlace del grado ──────────────────────────────── */

  const generarEnlace = () => {
    if (faseRef.current !== 'e5') return;
    reproducirTono('select');
    nube.generarEnlace(NODO.id, permisoEnlace);
    decir(
      'Ya está el enlace. Ojo con la escala: esto no se lo vas a dar a un salón, se lo vas a soltar en el chat general del grado — y un chat así lo puede reenviar cualquiera, a cualquiera, en segundos.',
    );
    irA('p-visita');
  };

  const seguirALaVisita = () => {
    if (faseRef.current !== 'p-visita') return;
    irA('e6');
    const permisoReal = archivo.enlace?.permiso ?? permisoEnlace;
    nube.abrirEnlace(NODO.id, ALGUIEN);
    decir(
      'La maestra ya lo revisó desde el chat. Pero mira quién más entró: alguien que ni conoces, de otro grupo del mismo grado. No hizo nada malo a propósito — es lo que hacen los enlaces cuando se comparten en un grupo grande.',
    );
    if (permisoReal === 'editar') {
      labActividad.restar();
      setObjetivoDanado(true);
      setPermisosAlaMedida(false);
      decir(
        'Y como el enlace era de **editar**, alguien le garabateó el objetivo por diversión. Se arregla en un segundo, pero mira lo fácil que fue: en un documento de trabajo real, un enlace público casi nunca debería ser de escribir.',
      );
    } else {
      decir('Menos mal que el enlace era de **ver**: pudo leerlo y ya. No tocó ni una letra.');
    }
    decir('Revócalo: de aquí en adelante ese enlace ya no abre para nadie más.');
  };

  const revocar = () => {
    if (faseRef.current !== 'e6') return;
    reproducirTono('correct');
    nube.revocarEnlace(NODO.id);
    if (objetivoDanado) setObjetivoDanado(false);
    labActividad.avanzar();
    decir(
      'Listo. Y fíjate que el programa sigue diciendo «Ya lo abrieron»: revocar apaga lo que viene, no borra lo que ya pasó. El chat del grado ya lo vio — eso ya no se puede deshacer, sólo evitar que siga pasando.',
    );
    irA('e7');
  };

  const terminar = () => {
    labActividad.terminar(labActividad.pasos * 25);
  };

  const reiniciar = () => {
    faseRef.current = 'e1';
    baseCronogramaRef.current = V_INICIO.id;
    guardadoIkerRef.current = false;
    setFase('e1');
    setHistorial([L_INICIO]);
    setFormPersona('');
    setFormPermiso('ver');
    setPermisoEnlace('ver');
    setObjetivoDanado(false);
    setSinPisarse(false);
    setPermisosAlaMedida(true);
    nube.reiniciar();
    labActividad.reiniciar();
  };

  /* ── lo que se pinta ────────────────────────────────────────────────── */

  if (labActividad.terminado) {
    return (
      <VentanaBase marca="Tecnia Nube" subtitulo="Propuesta del proyecto">
        <div className="tcn-final">
          <span className="tcn-final-insignia" aria-hidden="true">🔐</span>
          <p className="tcn-final-nombre">Insignia · Arquitecto de permisos</p>
          <h2 className="tcn-final-titulo">
            Compartir bien no es dar de más ni de menos: es leer qué necesita cada quien
          </h2>
          <p className="tcn-final-detalle">
            <ConNegritas texto="Diste la llave de **editar** a quien iba a escribir contigo, la de **comentar** a quien sólo iba a dejar notas desde fuera del equipo, entraste a escribir revisando quién andaba dentro, resolviste un choque real sin perder el trabajo de nadie, controlaste un enlace que se fue de paseo por el chat del grado, y cerraste el documento dejando a cada quien con la llave que su papel necesitaba — ni una de más." />
          </p>

          <dl className="tcn-final-resumen">
            <div>
              <dt>Sin pisarse</dt>
              <dd>{sinPisarse ? 'Nada se perdió' : 'Resuelto'}</dd>
            </div>
            <div>
              <dt>Permisos</dt>
              <dd>{permisosAlaMedida ? 'A la medida' : 'Ajustados'}</dd>
            </div>
            <div>
              <dt>Puntaje</dt>
              <dd>{labActividad.puntaje()}</dd>
            </div>
          </dl>

          <p className="tcn-final-cierre">
            <ConNegritas texto="Y la idea que se lleva todo esto: la **coautoría en tiempo real** no reemplaza coordinarse — la hace posible. El programa te avisa cuando alguien más anda dentro; que lo mires antes de escribir, es cosa tuya." />
          </p>

          <div className="tcn-final-botones">
            <button type="button" className="tcn-boton-final es-primario" onClick={reiniciar}>
              Jugar otra vez
            </button>
            {alSalir && (
              <button type="button" className="tcn-boton-final es-fantasma" onClick={alSalir}>
                Salir
              </button>
            )}
          </div>
        </div>
      </VentanaBase>
    );
  }

  const idxEncargo = ENCARGO_DE_FASE[fase];
  const encargo = ENCARGOS[idxEncargo];

  const enCompartir = fase === 'e1' || fase === 'e2' || fase === 'e7';
  const objetivoActual = fase === 'e1' ? MELISSA : fase === 'e2' ? SOFIA : fase === 'e7' ? PROFESOR : null;
  const yaTieneAcceso = objetivoActual ? accesos.some((a) => a.persona.id === objetivoActual.id) : false;
  const candidatos = objetivoActual && !yaTieneAcceso ? [objetivoActual] : [];

  const puedeCambiarPermiso = fase === 'e1' || fase === 'e2' || fase === 'e7' || fase === 'e8';

  return (
    <VentanaBase marca="Tecnia Nube" subtitulo="Propuesta del proyecto">
      <div className="tcn">
        <header className="tcn-topbar">
          <span className="tcn-topbar-fase">
            {idxEncargo >= ENCARGOS.length ? 'Listo' : `Encargo ${idxEncargo + 1} de ${ENCARGOS.length}`}
          </span>
          <span className="tcn-topbar-titulo">{encargo ? encargo.titulo : 'Propuesta entregada'}</span>
          {alSalir && (
            <button type="button" className="tcn-topbar-salir" onClick={alSalir}>
              Salir
            </button>
          )}
        </header>

        <div className="tcn-cuerpo">
          <div className="tcn-columna-nube">
            <VentanaNube
              archivos={[sinVersionesRepetidas(archivo)]}
              seleccionId={NODO.id}
              conexion={nube.conexion}
              espacio={nube.espacio}
              aviso={nube.ultimoAviso}
              compartirForm={
                enCompartir
                  ? {
                      candidatos,
                      personaId: formPersona,
                      onCambiarPersona: setFormPersona,
                      permiso: formPermiso,
                      onCambiarPermiso: setFormPermiso,
                      onCompartir: compartirAhora,
                    }
                  : null
              }
              onCambiarPermisoAcceso={puedeCambiarPermiso ? cambiarPermisoAcceso : undefined}
              enlaceForm={
                fase === 'e5' || fase === 'p-visita' || fase === 'e6'
                  ? {
                      permiso: permisoEnlace,
                      onCambiarPermiso: setPermisoEnlace,
                      onGenerar: generarEnlace,
                      onRevocar: revocar,
                    }
                  : null
              }
              onEntrarAEditar={fase === 'e3' ? entrarYRevisar : undefined}
              onGuardarCambios={fase === 'e4' ? guardarComoIker : undefined}
              onResolverConflicto={fase === 'e4' ? resolver : undefined}
            />
          </div>

          <div className="tcn-panel">
            <HojaDeLaPropuesta doc={doc} editando={archivo.editandoAhora} />

            <div className="tcn-bit">
              <span className="tcn-bit-avatar" aria-hidden="true">🤖</span>
              <div className="tcn-bit-lineas" aria-live="polite">
                {historial.map((linea, i) => (
                  <p key={i} className={i === historial.length - 1 ? 'tcn-bit-linea es-ultima' : 'tcn-bit-linea'}>
                    <ConNegritas texto={linea} />
                  </p>
                ))}
              </div>
            </div>

            {encargo && (
              <section className="tcn-encargo" aria-label="Encargo actual">
                <p className="tcn-encargo-kicker">
                  Encargo {idxEncargo + 1} · {encargo.titulo}
                </p>
                <p className="tcn-encargo-pide">
                  <ConNegritas texto={encargo.pide} />
                </p>
              </section>
            )}

            {fase === 'p-melissa' && <BotonSeguir onClick={seguirAMelissa} texto="Melissa se metió a escribir →" />}
            {fase === 'p-diego' && <BotonSeguir onClick={seguirADiego} texto="Diego sigue trabajando →" />}
            {fase === 'p-visita' && <BotonSeguir onClick={seguirALaVisita} texto="Compartiste el enlace en el chat del grado →" />}

            {fase === 'cierre' && (
              <section className="tcn-encargo es-cierre">
                <p className="tcn-encargo-kicker">La propuesta ya está lista</p>
                <p className="tcn-encargo-pide">
                  <ConNegritas texto="Ocho encargos, un solo documento, y **cada colaborador con la llave de su papel.** Eso es trabajar en equipo en la nube." />
                </p>
                <button type="button" className="tcn-boton es-principal" onClick={terminar}>
                  Terminar
                </button>
              </section>
            )}

            <ol className="tcn-tablero" aria-label="Tus encargos">
              {ENCARGOS.map((e, i) => (
                <li
                  key={e.id}
                  className={i < idxEncargo ? 'tcn-tablero-item es-hecho' : i === idxEncargo ? 'tcn-tablero-item es-activo' : 'tcn-tablero-item'}
                >
                  <span className="tcn-tablero-marca" aria-hidden="true">{i < idxEncargo ? '✔' : i + 1}</span>
                  {e.titulo}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </VentanaBase>
  );
}

/** El botón de continuar entre actos. Integrado en el panel, nunca flotando. */
function BotonSeguir({ onClick, texto }: { onClick: () => void; texto: string }) {
  return (
    <button type="button" className="tcn-boton es-principal" onClick={onClick}>
      {texto}
    </button>
  );
}

/**
 * La hoja de la propuesta: el documento de verdad, que el armazón no tiene
 * (`ArchivoNube` no lleva contenido, sólo nombre/tamaño/fecha del `ArchivoSO`
 * que envuelve). Sin estado: recibe todo por parámetro.
 */
function HojaDeLaPropuesta({ doc, editando }: { doc: EstadoDoc; editando: PersonaNube[] }) {
  const otros = editando.filter((p) => p.id !== IKER.id);
  return (
    <div className="tcn-hoja" data-testid="tcn-hoja">
      <div className="tcn-hoja-cinta">
        <span className="tcn-hoja-nombre">{NODO.nombre}</span>
        {otros.length > 0 && (
          <span className="tcn-hoja-editores" data-testid="tcn-hoja-editores">
            {otros.map((p) => (
              <span key={p.id} className="tcn-hoja-editor">
                {p.avatar} {p.nombre} está escribiendo
              </span>
            ))}
          </span>
        )}
      </div>

      <h3 className="tcn-hoja-titulo" data-testid="tcn-hoja-titulo">
        Turnos sin fila
      </h3>
      <p className="tcn-hoja-sub">Propuesta de proyecto · Iker, Melissa y Diego</p>

      <section className="tcn-hoja-bloque" data-testid="tcn-bloque-objetivo">
        <h4>Objetivo</h4>
        <p className={doc.objetivoDanado ? 'es-danado' : undefined} data-testid="tcn-objetivo-texto">
          {doc.objetivoDanado
            ? 'Que cualqUEr alumno pueda pedir SU turno jsjsjs'
            : 'Que cualquier alumno pueda pedir su turno en la papelería desde el celular, sin hacer fila física durante el receso.'}
        </p>
      </section>

      <section className="tcn-hoja-bloque" data-testid="tcn-bloque-publico">
        <h4>Público objetivo</h4>
        {doc.publico ? (
          <p>Los cerca de 900 alumnos de la escuela, sobre todo quienes sólo tienen 15 minutos de receso y hoy pierden la mitad en la fila.</p>
        ) : (
          <p className="tcn-hoja-pendiente">(lo va a escribir Melissa)</p>
        )}
      </section>

      <section className="tcn-hoja-bloque" data-testid="tcn-bloque-cronograma">
        <h4>Cronograma</h4>
        {doc.cronograma ? (
          <p>Semana 1–2: bocetos y pantallas. Semana 3–4: conectar la base de datos y probar con un grupo piloto. Semana 5: entrega.</p>
        ) : (
          <p className="tcn-hoja-pendiente">(lo vas a escribir tú)</p>
        )}
      </section>

      {doc.conclusion && (
        <section className="tcn-hoja-bloque es-pie" data-testid="tcn-bloque-conclusion">
          <h4>Conclusión</h4>
          <p>Con este sistema el receso rinde más: se hace fila una vez, desde el celular, y no dos — una para pedir el turno y otra para que abran la caja.</p>
        </section>
      )}
    </div>
  );
}

export default LabTrabajoColaborativo;
