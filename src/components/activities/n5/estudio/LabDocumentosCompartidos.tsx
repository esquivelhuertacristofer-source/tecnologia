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
// `ArchivoNube` envuelve un `ArchivoSO` de verdad, y el índice de `nube/` no lo
// reexporta (sólo `NodoSO`): viene de donde vive, igual que en `tiposNube.ts`.
import type { ArchivoSO } from '../../../simuladores/sistema';
import './documentosCompartidos.css';

/**
 * N5·«Mi huella digital» · parada 3 y CIERRE de la unidad · «Documentos
 * compartidos». Prestada al bloque Office (`office: { app: 'm365' }`).
 *
 * Nivel 5 = 5.º de Primaria, 10–11 años (verificado en `src/data/curriculo.ts`,
 * no heredado del encargo).
 *
 * SIN 3D, a propósito: lo que abre el alumno es **un programa**. El armazón es
 * `simuladores/nube/` DE VERDAD —`useNube` + `VentanaNube` + `VentanaBase`—, y
 * ésta es la PRIMERA clase que se monta encima de él.
 *
 * ── La idea entera ─────────────────────────────────────────────────────────
 *
 * «Compartir no es enviar una copia: es dar una llave. Y las llaves se pueden
 * retirar.» Todo lo demás se desprende de ahí y **pasa en pantalla** antes de
 * explicarse: hay un solo cartel, así que lo que el otro escribe aparece aquí y
 * lo que el otro borra se borra para todos.
 *
 * ── Las seis acciones se hacen con los controles del PROGRAMA ──────────────
 *
 * Ni un botón inventado flotando encima: compartir es el formulario del
 * programa, bajar un permiso es su selector, guardar es su «💾 Guardar
 * cambios», volver atrás es su «↩ Restaurar», el enlace son sus «Generar» y
 * «Revocar», y recoger la llave es su «Quitar». El panel de la clase **narra y
 * enseña la hoja del cartel**; no duplica la interfaz.
 *
 * Qué props recibe `VentanaNube` se decide por encargo: durante el encargo 1
 * existe el formulario de compartir y no existe el del enlace, etc. Así el
 * alumno no se pierde y el armazón sigue siendo el mismo para todos.
 *
 * ── Lo que se midió del armazón, y que otra clase debe saber ───────────────
 *
 * 1. **`ArchivoNube` no tiene contenido.** El armazón lleva permisos, enlace,
 *    coautoría, conflicto e historial, pero el archivo es un `ArchivoSO`
 *    (nombre, tamaño, fecha) y nada más. La HOJA DEL CARTEL —el documento que
 *    el alumno ve cambiar, que es el corazón de esta clase— la pinta esta
 *    clase, y su contenido es una **función pura de la versión que se está
 *    viendo** (`docDe`): se busca `versionActualId` en el historial y se
 *    traduce su `resumen` a qué bloques existen. Por eso «↩ Restaurar» del
 *    armazón, sin una línea más, devuelve el bloque borrado a la pantalla.
 *
 * 2. **Dos operaciones sobre el MISMO archivo en el MISMO tick se pisan.** Las
 *    que empiezan por `buscar()` —`compartir`, `quitarAcceso`, `abrirEnlace`,
 *    `guardarCambios`, `resolverConflicto`, `restaurarVersion`— leen
 *    `archivosRef.current`, que sólo se actualiza en un efecto, y luego
 *    REEMPLAZAN el archivo entero con lo que calcularon de esa foto vieja. Las
 *    otras (`cambiarPermiso`, `generarEnlace`, `revocarEnlace`,
 *    `entrarAEditar`, `salirDeEditar`) usan `prev` y sí componen. Regla que
 *    sigue esta clase: **una sola operación de las primeras por gesto, y
 *    siempre la primera.** Por eso los tramos que la historia necesita
 *    encadenar (Beto guarda → los dos entran a editar; el conflicto se resuelve
 *    → Beto borra sin querer) están partidos en dos gestos con un «Continuar»
 *    en medio, que además le da al alumno tiempo de leer.
 *
 * 3. **`resolverConflicto` repite en el historial la versión remota**, porque
 *    la vuelve a empujar aunque ya estuviera dentro (`tiposNube.ts`, tanto en
 *    'conservar-ambas' como en 'remota'). Dos filas iguales y dos `key` iguales
 *    en React. El armazón es compartido y está cerrado con sus pruebas, así que
 *    NO se tocó: la clase **de-duplica para pintar** con `sinVersionesRepetidas`
 *    —función pura, y devuelve el mismo objeto por identidad cuando no hay nada
 *    que quitar— y el defecto va anotado en el informe con su causa.
 *
 * ── Los seis encargos ──────────────────────────────────────────────────────
 *
 *   1 · Dale la llave a Beto (permiso de EDITAR: va a escribir)
 *   2 · La llave del tamaño justo para Lupe (VER: sólo quiere copiar la fecha)
 *   3 · Los dos a la vez → conflicto → resolverlo
 *   4 · Beto borra un bloque sin querer → volver atrás con el historial
 *   5 · El enlace anda suelto → entra alguien de otro salón → revocarlo
 *   6 · Recoger las llaves
 *
 * **Los encargos 1 y 2 no bloquean.** La llave equivocada se da de verdad, la
 * consecuencia pasa en pantalla y el encargo sigue abierto hasta que el permiso
 * quede en su sitio, corregido con el mismo selector del programa.
 *
 * **El encargo 6 deshace a propósito los encargos 1 y 2, y ésa es la lección.**
 * La regla de la casa —«un predicado que un encargo posterior deshace está mal
 * escrito»— se cumple TRABANDO en vez de re-evaluando: cada encargo se da por
 * cumplido una sola vez, en el gesto en que ocurre (`faseRef`), y no se vuelve
 * a mirar. Recoger las llaves al final no descumple nada.
 *
 * ── Doble clic ─────────────────────────────────────────────────────────────
 *
 * La fase manda desde un `useRef` y el estado es sólo su espejo para pintar:
 * dos clics en el mismo tick leen el ref YA movido y el segundo se cae solo.
 * Con la fase en `useState` el segundo clic leía el valor viejo y avanzaba dos
 * pasos (o narraba dos veces, o creaba dos conflictos).
 *
 * ── Tono: protección, no susto ─────────────────────────────────────────────
 *
 * Nadie es el malo. Beto rompe el trabajo sin querer y además vuelve a pegar la
 * parte que faltaba; Lupe escribe encima de la fecha porque le tocó una llave
 * más grande de la que pidió; quien entra por el enlace no es nadie peligroso,
 * es que los enlaces se reenvían. Y el alumno no tiene la culpa nunca: cada vez
 * que algo sale mal, se dice cómo se arregla en el mismo aliento.
 */

/* ══════════════════════════════════════════════════════════════════════════
   Los datos. Constantes y funciones puras: nada de esto sabe de React.
   ══════════════════════════════════════════════════════════════════════════ */

const DANI: PersonaNube = { id: 'dani', nombre: 'Dani', avatar: '🎒' };
const BETO: PersonaNube = { id: 'beto', nombre: 'Beto', avatar: '🧢' };
const LUPE: PersonaNube = { id: 'lupe', nombre: 'Lupe', avatar: '🎧' };
/** Quien llega por el enlace reenviado. No es nadie peligroso: es cualquiera. */
const ALGUIEN: PersonaNube = { id: 'alguien', nombre: 'Alguien de otro salón', avatar: '👤' };

const NODO: ArchivoSO = {
  tipo: 'archivo',
  id: 'cartel',
  nombre: 'Cartel del equipo.tec',
  tamano: 2_400_000,
  fecha: '18 sep 2026',
};

/**
 * El `resumen` de cada versión hace doble oficio: es lo que el alumno LEE en el
 * historial y es la llave con la que `docDe` sabe qué bloques tenía el cartel
 * en ese momento. Por eso son constantes y no cadenas sueltas.
 */
const RES_INICIO = 'Dani armó el cartel';
const RES_MATERIALES = 'Beto escribió los materiales';
const RES_CONCLUSION = 'Dani escribió la conclusión';
const RES_BORRON = 'Beto juntó las dos partes y arregló la ortografía';

const V_INICIO: VersionArchivo = {
  id: 'v-inicio',
  autor: DANI,
  fecha: 'Ayer, 6:40 p. m.',
  resumen: RES_INICIO,
};

const CARTEL: ArchivoNube = {
  nodo: NODO,
  estado: 'subido',
  propietario: DANI,
  compartidoCon: [],
  historial: [V_INICIO],
  versionActualId: V_INICIO.id,
  editandoAhora: [],
};

/** Identidad estable: `useNube` lee esta lista UNA vez y `reiniciar()` vuelve a ella. */
const SEMILLA: ArchivoNube[] = [CARTEL];

const CAPACIDAD = 5_000_000_000;

/** Qué bloques del cartel existen en una versión dada. */
interface EstadoDoc {
  investigacion: boolean;
  materiales: boolean;
  conclusion: boolean;
}

const DOC_POR_RESUMEN: Record<string, EstadoDoc> = {
  [RES_INICIO]: { investigacion: true, materiales: false, conclusion: false },
  [RES_MATERIALES]: { investigacion: true, materiales: true, conclusion: false },
  // La versión de Dani salió de la de antes de que Beto guardara: por eso NO
  // trae los materiales. Eso es exactamente lo que es un conflicto.
  [RES_CONCLUSION]: { investigacion: true, materiales: false, conclusion: true },
  // Beto junta las dos mitades (venga de donde venga el conflicto) y se lleva
  // «Qué investigamos» sin darse cuenta.
  [RES_BORRON]: { investigacion: false, materiales: true, conclusion: true },
};

const DOC_BASE = DOC_POR_RESUMEN[RES_INICIO];

/** Qué se ve del cartel ahora mismo. Función pura de la versión que se muestra. */
export function docDe(archivo: ArchivoNube): EstadoDoc {
  const version = archivo.historial.find((v) => v.id === archivo.versionActualId);
  const clave = version?.resumen;
  return (clave ? DOC_POR_RESUMEN[clave] : undefined) ?? DOC_BASE;
}

/**
 * `resolverConflicto` del armazón vuelve a empujar al historial la versión
 * remota, que ya estaba dentro (ver cabecera, hallazgo 3). Aquí se quitan las
 * repetidas SÓLO para pintar. Devuelve el MISMO objeto por identidad cuando no
 * hay nada que quitar, como manda la casa.
 */
export function sinVersionesRepetidas(archivo: ArchivoNube): ArchivoNube {
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
    id: 'llave',
    titulo: 'Dale la llave a Beto',
    pide: 'Beto va a escribir la lista de **materiales**. Compártele el cartel con la llave que necesita para eso.',
  },
  {
    id: 'medida',
    titulo: 'La llave del tamaño justo',
    pide: 'Lupe es de otro equipo y te escribió: «¿me dejas **verlo** tantito para copiar la fecha?». Dale la llave que pidió, ni más grande ni más chica.',
  },
  {
    id: 'a-la-vez',
    titulo: 'Los dos a la vez',
    pide: 'Beto está dentro ahorita mismo. Escribe tú la conclusión con **💾 Guardar cambios** y mira qué pasa.',
  },
  {
    id: 'historial',
    titulo: 'Vuelve a poner lo que faltaba',
    pide: 'Falta un bloque del cartel. Baja al **historial** y restaura una versión que todavía lo tenga.',
  },
  {
    id: 'enlace',
    titulo: 'El enlace anda suelto',
    pide: 'La maestra quiere ver el cartel: **genera un enlace** y decide con qué permiso.',
  },
  {
    id: 'recoger',
    titulo: 'Recoge las llaves',
    pide: 'Se acabó la feria y el cartel ya se entregó. **Quítale el acceso** a quien ya no lo necesita.',
  },
];

const TOTAL_PASOS = ENCARGOS.length; // 6

type Fase =
  | 'e1'
  | 'e2'
  | 'p-coautoria'
  | 'e3'
  | 'p-borron'
  | 'e4'
  | 'e5a'
  | 'p-visita'
  | 'e5b'
  | 'e6'
  | 'cierre';

/** Qué encargo está en juego en cada fase (6 = ya no queda ninguno). */
const ENCARGO_DE_FASE: Record<Fase, number> = {
  e1: 0,
  e2: 1,
  'p-coautoria': 2,
  e3: 2,
  'p-borron': 3,
  e4: 3,
  e5a: 4,
  'p-visita': 4,
  e5b: 4,
  e6: 5,
  cierre: 6,
};

const L_INICIO =
  'Éste es el cartel de tu equipo para la Feria de Ciencias. Lo hiciste tú y está en tu nube. Falta la parte de los materiales, y ésa la va a escribir Beto.';

/* ══════════════════════════════════════════════════════════════════════════
   El laboratorio.
   ══════════════════════════════════════════════════════════════════════════ */

export function LabDocumentosCompartidos(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const labActividad = useLabActividad(props, TOTAL_PASOS, {});
  const nube = useNube({ archivos: SEMILLA, capacidad: CAPACIDAD });

  // La fase manda desde el ref; el estado sólo pinta (ver cabecera, «Doble clic»).
  const faseRef = useRef<Fase>('e1');
  const [fase, setFase] = useState<Fase>('e1');

  const [historial, setHistorial] = useState<string[]>([L_INICIO]);

  // El formulario de compartir del armazón.
  const [formPersona, setFormPersona] = useState('');
  // Arranca en la llave más chica a propósito: para Beto hay que subirla.
  const [formPermiso, setFormPermiso] = useState<PermisoNube>('ver');
  const [permisoEnlace, setPermisoEnlace] = useState<PermisoNube>('ver');

  // Los estropicios que no son de versión: se ven en la hoja y se arreglan.
  const [fechaRota, setFechaRota] = useState(false);
  const [tituloRoto, setTituloRoto] = useState(false);

  // Para el resumen del cierre.
  const [sinPerderTrabajo, setSinPerderTrabajo] = useState(false);
  const [llaveJusta, setLlaveJusta] = useState(true);

  /** La versión de la que Dani partió: la de ANTES de que Beto guardara. */
  const baseDaniRef = useRef<string | null>(V_INICIO.id);
  const guardadoRef = useRef(false);

  const archivo = nube.archivos[0];
  const doc = docDe(archivo);
  const accesos = archivo.compartidoCon;

  const decir = (linea: string) => setHistorial((prev) => [...prev, linea]);
  const irA = (siguiente: Fase) => {
    faseRef.current = siguiente;
    setFase(siguiente);
  };

  /* ── Encargo 1 · dale la llave a Beto ───────────────────────────────── */

  const cumplirE1 = () => {
    reproducirTono('correct');
    labActividad.avanzar();
    decir(
      'Fíjate bien: no le mandaste una copia. Le diste una **llave de este mismo cartel**. Hay un solo cartel, y si Beto escribe, escribe aquí.',
    );
    irA('e2');
  };

  const cumplirE2 = () => {
    reproducirTono('correct');
    labActividad.avanzar();
    decir(
      'Con **ver**, Lupe mira todo el cartel y no puede tocar ni una letra. Es la llave más chica que sirve, y ésa es la buena.',
    );
    irA('p-coautoria');
  };

  const compartirAhora = () => {
    const f = faseRef.current;
    if (f !== 'e1' && f !== 'e2') return;
    const objetivo = f === 'e1' ? BETO : LUPE;
    if (formPersona !== objetivo.id) return;

    const r = nube.compartir(NODO.id, objetivo, formPermiso);
    setFormPersona('');
    if (!r.ok) return;
    reproducirTono('select');

    if (f === 'e1') {
      if (formPermiso === 'editar') {
        cumplirE1();
        return;
      }
      labActividad.restar();
      setLlaveJusta(false);
      decir(
        formPermiso === 'ver'
          ? 'Beto abrió el cartel… y no puede escribir nada, sólo mirarlo. Con **ver** se mira; para escribir hace falta **editar**. Cámbiaselo aquí mismo, en su selector.'
          : 'Con **comentar** Beto puede dejar notas al margen, pero el texto no se mueve, y él tiene que escribir los materiales. Súbele la llave a **editar**.',
      );
      return;
    }

    if (formPermiso === 'ver') {
      cumplirE2();
      return;
    }
    if (formPermiso === 'comentar') {
      decir(
        'Con **comentar** Lupe no cambia el cartel: deja notas al margen. No rompe nada, pero le sobra: ella sólo pidió mirar. Déjaselo en **ver**.',
      );
      return;
    }
    labActividad.restar();
    setLlaveJusta(false);
    setFechaRota(true);
    decir(
      'Mira la fecha del cartel. Lupe la quería copiar y sin querer la escribió encima. **No es culpa suya**: le tocó una llave de escribir cuando sólo pedía una de mirar. Bájasela a **ver** y ya.',
    );
  };

  const cambiarPermisoAcceso = (nodoId: string, personaId: string, permiso: PermisoNube) => {
    nube.cambiarPermiso(nodoId, personaId, permiso);
    const f = faseRef.current;
    if (f === 'e1' && personaId === BETO.id && permiso === 'editar') {
      cumplirE1();
      return;
    }
    if (f === 'e2' && personaId === LUPE.id && permiso === 'ver') {
      if (fechaRota) {
        setFechaRota(false);
        decir('Ya está: Lupe volvió a escribir la fecha, ahora con calma, y con esa llave ya no puede tocar nada más.');
      }
      cumplirE2();
      return;
    }
    // Jugar MAL: tocarle el permiso a quien no toca. Se aplica de verdad —es
    // su archivo— pero se avisa de la consecuencia, sin regañar.
    if (f === 'e1' && personaId === BETO.id) {
      decir('Ésa tampoco le deja escribir los materiales. La que necesita para escribir es **editar**.');
      return;
    }
    if (f === 'e2' && personaId === BETO.id && permiso !== 'editar') {
      decir('Ojo, que Beto todavía anda con los materiales: con esa llave ya no puede escribirlos. Se la vuelves a subir cuando quieras.');
    }
  };

  /* ── Encargo 3 · los dos a la vez ───────────────────────────────────── */

  const seguirACoautoria = () => {
    if (faseRef.current !== 'p-coautoria') return;
    irA('e3');
    reproducirTono('select');
    // Ojo al orden: primero la operación que lee el ref (`guardarCambios`) y
    // después las que componen sobre `prev`. Al revés se pisan (cabecera, 2).
    baseDaniRef.current = archivo.versionActualId;
    nube.guardarCambios(NODO.id, {
      autor: BETO,
      fecha: 'Hoy, 5:12 p. m.',
      resumen: RES_MATERIALES,
      basadaEnVersionId: archivo.versionActualId,
    });
    nube.entrarAEditar(NODO.id, BETO);
    nube.entrarAEditar(NODO.id, DANI);
    decir(
      'Ahí están los materiales de Beto, aparecidos solos en tu pantalla. Y ahí está él, dentro del cartel ahorita mismo: los dos pueden estar aquí a la vez, y eso está muy bien.',
    );
  };

  const guardarComoDani = () => {
    if (faseRef.current !== 'e3') return;
    if (guardadoRef.current) return;
    guardadoRef.current = true;
    reproducirTono('select');
    nube.guardarCambios(NODO.id, {
      autor: DANI,
      fecha: 'Hoy, 5:14 p. m.',
      resumen: RES_CONCLUSION,
      basadaEnVersionId: baseDaniRef.current,
    });
    decir(
      'Chocaron. Beto guardó mientras tú escribías y los dos salieron de la misma versión. El cartel no eligió solo: se paró a preguntarte. A eso se le llama **conflicto**.',
    );
  };

  const resolver = (nodoId: string, eleccion: EleccionConflicto) => {
    if (faseRef.current !== 'e3') return;
    const r = nube.resolverConflicto(nodoId, eleccion);
    if (!r.ok) return;
    if (eleccion === 'conservar-ambas') {
      reproducirTono('correct');
      setSinPerderTrabajo(true);
      decir(
        'Se quedaron las dos: arriba la tuya y la de Beto guardada abajo, en el historial. **No se perdió nada de nadie.**',
      );
    } else {
      labActividad.restar();
      decir(
        'Se quedó una sola y la otra no llegó a guardarse. No pasa nada, se puede volver a escribir — pero fíjate que **conservar las dos** no tira el trabajo de nadie.',
      );
    }
    labActividad.avanzar();
    irA('p-borron');
  };

  /* ── Encargo 4 · el borrón, y el historial ──────────────────────────── */

  const seguirAlBorron = () => {
    if (faseRef.current !== 'p-borron') return;
    irA('e4');
    reproducirTono('select');
    nube.guardarCambios(NODO.id, {
      autor: BETO,
      fecha: 'Hoy, 5:20 p. m.',
      resumen: RES_BORRON,
      basadaEnVersionId: archivo.versionActualId,
    });
    decir(
      'Beto juntó las dos partes y le arregló la ortografía. Buen compañero. Pero mira el cartel: se llevó el bloque de **«Qué investigamos»** sin darse cuenta.',
    );
    decir(
      'Y no hay otro cartel esperando en tu computadora: **es el mismo**, y ese bloque ya no está para nadie. Aquí no se enoja nadie — esto se arregla en dos segundos con el historial.',
    );
  };

  const restaurar = (nodoId: string, versionId: string) => {
    if (faseRef.current !== 'e4') return;
    const version = archivo.historial.find((v) => v.id === versionId);
    const r = nube.restaurarVersion(nodoId, versionId);
    if (!r.ok) return;
    const recuperado = (version?.resumen ? DOC_POR_RESUMEN[version.resumen] : undefined) ?? DOC_BASE;
    if (!recuperado.investigacion) {
      decir('Ésa es justo la del borrón. Busca una de más abajo, de antes de que el bloque desapareciera.');
      return;
    }
    reproducirTono('correct');
    labActividad.avanzar();
    decir(
      recuperado.materiales || recuperado.conclusion
        ? 'Volvió el bloque. Y fíjate bien: no se borró ninguna de las otras versiones. **Volver atrás nunca quita nada.**'
        : 'Volvió el bloque, sí: volviste hasta la primera versión de todas, así que también se fueron los materiales y la conclusión. No se perdieron —siguen en el historial—, pero la de **más arriba** que todavía tenga el bloque es la que menos trabajo tira.',
    );
    irA('e5a');
  };

  /* ── Encargo 5 · el enlace ──────────────────────────────────────────── */

  const generarEnlace = () => {
    if (faseRef.current !== 'e5a') return;
    reproducirTono('select');
    nube.generarEnlace(NODO.id, permisoEnlace);
    decir(
      'Ya está el enlace. Ojo con esto: un enlace no se lo das a una persona, se lo das **a quien tenga el enlace**. Y los enlaces se reenvían.',
    );
    irA('p-visita');
  };

  const seguirALaVisita = () => {
    if (faseRef.current !== 'p-visita') return;
    irA('e5b');
    const permisoReal = archivo.enlace?.permiso ?? permisoEnlace;
    nube.abrirEnlace(NODO.id, ALGUIEN);
    decir(
      'La maestra lo abrió y ya lo revisó. Pero mira quién más entró: alguien de otro salón. Nadie hizo nada malo — el enlace pasó de un chat a otro, que es lo que hacen los enlaces.',
    );
    if (permisoReal === 'editar') {
      labActividad.restar();
      setTituloRoto(true);
      decir(
        'Y como el enlace era de **escribir**, le garabateó el título jugando. Lo arreglas en un segundo, pero mira lo fácil que fue. Un enlace público casi siempre quiere ser de **ver**.',
      );
    } else {
      decir('Menos mal que el enlace era de **ver**: pudo mirarlo y ya. No tocó ni una letra.');
    }
    decir('Revócalo: de aquí en adelante ese enlace ya no abre.');
  };

  const revocar = () => {
    if (faseRef.current !== 'e5b') return;
    reproducirTono('correct');
    nube.revocarEnlace(NODO.id);
    if (tituloRoto) setTituloRoto(false);
    labActividad.avanzar();
    decir(
      'Listo. Y ahora mira lo que sigue diciendo el programa ahí abajo: **«Ya lo abrieron»**. Revocar apaga lo que viene, no borra lo que ya pasó. Igualito que cuando publicas algo.',
    );
    irA('e6');
  };

  /* ── Encargo 6 · recoger las llaves ─────────────────────────────────── */

  const quitar = (nodoId: string, personaId: string) => {
    if (faseRef.current !== 'e6') return;
    const estabaDentro = archivo.editandoAhora.some((p) => p.id === personaId);
    const r = nube.quitarAcceso(nodoId, personaId);
    if (!r.ok) return;
    reproducirTono('select');
    if (estabaDentro) {
      decir(
        'Beto seguía dentro, así que lo que estaba escribiendo en ese momento no se guardó. El cartel ya se entregó, no pasa nada — pero la próxima vez, si alguien está dentro, avísale antes de recoger su llave.',
      );
    }
    const quedan = archivo.compartidoCon.filter((a) => a.persona.id !== personaId);
    if (quedan.length > 0) return;
    reproducirTono('correct');
    labActividad.avanzar();
    decir(
      'Recogidas las dos. **Dar la llave y quitarla son la misma responsabilidad**, y las dos son tuyas. Ahora ya sabes hacer las dos.',
    );
    irA('cierre');
  };

  const terminar = () => {
    labActividad.terminar(labActividad.pasos * 25);
  };

  const reiniciar = () => {
    faseRef.current = 'e1';
    baseDaniRef.current = V_INICIO.id;
    guardadoRef.current = false;
    setFase('e1');
    setHistorial([L_INICIO]);
    setFormPersona('');
    setFormPermiso('ver');
    setPermisoEnlace('ver');
    setFechaRota(false);
    setTituloRoto(false);
    setSinPerderTrabajo(false);
    setLlaveJusta(true);
    nube.reiniciar();
    labActividad.reiniciar();
  };

  /* ── lo que se pinta ────────────────────────────────────────────────── */

  if (labActividad.terminado) {
    return (
      <VentanaBase marca="Tecnia Nube" subtitulo="Documentos compartidos">
        <div className="dcp-final">
          <span className="dcp-final-insignia" aria-hidden="true">🔗</span>
          <p className="dcp-final-nombre">Insignia · Guardián de las llaves</p>
          <h2 className="dcp-final-titulo">Compartir no es mandar una copia: es dar una llave</h2>
          <p className="dcp-final-detalle">
            <ConNegritas texto="Y tú ya sabes **darlas, medirlas y recogerlas.** Diste la llave de escribir a quien iba a escribir y la de mirar a quien iba a mirar; te chocaste con alguien dentro del mismo cartel y lo resolviste; recuperaste un bloque borrado sin perder nada; y apagaste un enlace que se había ido de paseo." />
          </p>

          <dl className="dcp-final-resumen">
            <div>
              <dt>Llaves del tamaño justo</dt>
              <dd>{llaveJusta ? 'Las dos' : 'Se ajustaron'}</dd>
            </div>
            <div>
              <dt>El conflicto</dt>
              <dd>{sinPerderTrabajo ? 'Sin perder nada' : 'Resuelto'}</dd>
            </div>
            <div>
              <dt>Puntaje</dt>
              <dd>{labActividad.puntaje()}</dd>
            </div>
          </dl>

          <p className="dcp-final-cierre">
            <ConNegritas texto="Y la que más se olvida: **revocar apaga lo que viene, no borra lo que ya pasó.** Por eso la llave se piensa antes de darla — y se recoge cuando el trabajo termina." />
          </p>

          <div className="dcp-final-botones">
            <button type="button" className="dcp-boton-final es-primario" onClick={reiniciar}>
              Jugar otra vez
            </button>
            {alSalir && (
              <button type="button" className="dcp-boton-final es-fantasma" onClick={alSalir}>
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

  const enCompartir = fase === 'e1' || fase === 'e2';
  const objetivo = fase === 'e1' ? BETO : fase === 'e2' ? LUPE : null;
  const yaTieneAcceso = objetivo ? accesos.some((a) => a.persona.id === objetivo.id) : false;
  const candidatos = objetivo && !yaTieneAcceso ? [objetivo] : [];

  const puedeQuitar = fase === 'e6';
  const puedeCambiarPermiso = fase === 'e1' || fase === 'e2';

  return (
    <VentanaBase marca="Tecnia Nube" subtitulo="Documentos compartidos">
      <div className="dcp">
        <header className="dcp-topbar">
          <span className="dcp-topbar-fase">
            {idxEncargo >= ENCARGOS.length ? 'Listo' : `Encargo ${idxEncargo + 1} de ${ENCARGOS.length}`}
          </span>
          <span className="dcp-topbar-titulo">{encargo ? encargo.titulo : 'Cartel entregado'}</span>
          {alSalir && (
            <button type="button" className="dcp-topbar-salir" onClick={alSalir}>
              Salir
            </button>
          )}
        </header>

        <div className="dcp-cuerpo">
          <div className="dcp-columna-nube">
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
              onQuitarAcceso={puedeQuitar ? quitar : undefined}
              enlaceForm={
                fase === 'e5a' || fase === 'p-visita' || fase === 'e5b'
                  ? {
                      permiso: permisoEnlace,
                      onCambiarPermiso: setPermisoEnlace,
                      onGenerar: generarEnlace,
                      onRevocar: revocar,
                    }
                  : null
              }
              onGuardarCambios={fase === 'e3' ? guardarComoDani : undefined}
              onResolverConflicto={fase === 'e3' ? resolver : undefined}
              onRestaurarVersion={fase === 'e4' ? restaurar : undefined}
            />
          </div>

          <div className="dcp-panel">
            <HojaDelCartel
              doc={doc}
              fechaRota={fechaRota}
              tituloRoto={tituloRoto}
              editando={archivo.editandoAhora}
            />

            <div className="dcp-bit">
              <span className="dcp-bit-avatar" aria-hidden="true">🤖</span>
              <div className="dcp-bit-lineas" aria-live="polite">
                {historial.map((linea, i) => (
                  <p key={i} className={i === historial.length - 1 ? 'dcp-bit-linea es-ultima' : 'dcp-bit-linea'}>
                    <ConNegritas texto={linea} />
                  </p>
                ))}
              </div>
            </div>

            {encargo && (
              <section className="dcp-encargo" aria-label="Encargo actual">
                <p className="dcp-encargo-kicker">
                  Encargo {idxEncargo + 1} · {encargo.titulo}
                </p>
                <p className="dcp-encargo-pide">
                  <ConNegritas texto={encargo.pide} />
                </p>
              </section>
            )}

            {fase === 'p-coautoria' && (
              <BotonSeguir onClick={seguirACoautoria} texto="Beto se metió a escribir →" />
            )}
            {fase === 'p-borron' && <BotonSeguir onClick={seguirAlBorron} texto="Beto sigue trabajando →" />}
            {fase === 'p-visita' && <BotonSeguir onClick={seguirALaVisita} texto="Le pasaste el enlace a la maestra →" />}

            {fase === 'cierre' && (
              <section className="dcp-encargo es-cierre">
                <p className="dcp-encargo-kicker">El cartel ya se entregó</p>
                <p className="dcp-encargo-pide">
                  <ConNegritas texto="Seis encargos, un solo cartel y **ni una copia por ningún lado.** Eso es trabajar juntos en la nube." />
                </p>
                <button type="button" className="dcp-boton es-principal" onClick={terminar}>
                  Terminar
                </button>
              </section>
            )}

            <ol className="dcp-tablero" aria-label="Tus encargos">
              {ENCARGOS.map((e, i) => (
                <li
                  key={e.id}
                  className={i < idxEncargo ? 'dcp-tablero-item es-hecho' : i === idxEncargo ? 'dcp-tablero-item es-activo' : 'dcp-tablero-item'}
                >
                  <span className="dcp-tablero-marca" aria-hidden="true">{i < idxEncargo ? '✔' : i + 1}</span>
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
    <button type="button" className="dcp-boton es-principal" onClick={onClick}>
      {texto}
    </button>
  );
}

/**
 * La hoja del cartel: el documento de verdad, que el armazón no tiene (ver
 * cabecera, hallazgo 1). Sin estado: recibe todo por parámetro.
 */
function HojaDelCartel({
  doc,
  fechaRota,
  tituloRoto,
  editando,
}: {
  doc: EstadoDoc;
  fechaRota: boolean;
  tituloRoto: boolean;
  editando: PersonaNube[];
}) {
  const otros = editando.filter((p) => p.id !== DANI.id);
  return (
    <div className="dcp-hoja" data-testid="dcp-hoja">
      <div className="dcp-hoja-cinta">
        <span className="dcp-hoja-nombre">{NODO.nombre}</span>
        {otros.length > 0 && (
          <span className="dcp-hoja-editores" data-testid="dcp-hoja-editores">
            {otros.map((p) => (
              <span key={p.id} className="dcp-hoja-editor">
                {p.avatar} {p.nombre} está escribiendo
              </span>
            ))}
          </span>
        )}
      </div>

      <h3 className={tituloRoto ? 'dcp-hoja-titulo es-roto' : 'dcp-hoja-titulo'} data-testid="dcp-hoja-titulo">
        {tituloRoto ? 'EL AgUa qUe nO se Vee jjjj' : 'El agua que no se ve'}
      </h3>

      {doc.investigacion ? (
        <section className="dcp-hoja-bloque" data-testid="dcp-bloque-investigacion">
          <h4>Qué investigamos</h4>
          <p>Cuánta agua se va por una llave que gotea en un día entero, medida con una cubeta y una regla.</p>
        </section>
      ) : (
        <p className="dcp-hoja-hueco" data-testid="dcp-hueco-investigacion">
          Aquí iba «Qué investigamos», y ya no está.
        </p>
      )}

      <section className="dcp-hoja-bloque" data-testid="dcp-bloque-materiales">
        <h4>Materiales</h4>
        {doc.materiales ? (
          <p>Una cubeta, una regla, un gotero, cinta de medir y la libreta de registro.</p>
        ) : (
          <p className="dcp-hoja-pendiente">(lo va a escribir Beto)</p>
        )}
      </section>

      {doc.conclusion && (
        <section className="dcp-hoja-bloque" data-testid="dcp-bloque-conclusion">
          <h4>Conclusión</h4>
          <p>Una sola llave que gotea tira más de una cubeta llena al día. Cerrarla bien es lo más barato que hay.</p>
        </section>
      )}

      <section className="dcp-hoja-bloque es-pie">
        <h4>Fecha y lugar</h4>
        <p className={fechaRota ? 'es-roto' : undefined} data-testid="dcp-hoja-fecha">
          {fechaRota ? 'viernes 2 de octub' : 'Viernes 2 de octubre · Patio de la escuela'}
        </p>
      </section>
    </div>
  );
}

export default LabDocumentosCompartidos;
