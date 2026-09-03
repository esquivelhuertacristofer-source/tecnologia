'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { EstacionBloques3D, type EstadoVitrina, type PoseMuneco } from './piezasN4U3';
import {
  TOTAL_CASILLAS,
  limpiarNombre,
  nodosDe,
  revisarNombre,
  simular,
  ubicarAccion,
  type Accion,
  type Ajustes,
  type Efecto,
  type Ejecucion,
  type MundoBloques,
  type NodoCuerpo,
  type NodoOrden,
  type NodoSi,
  type NodoSiNo,
  type Pregunta,
  type Programa,
} from './programaBloques';
import {
  CATALOGO,
  FICHA_MOSTRAR,
  TecniaBloques,
  admite,
  fichasDeVariable,
  mapaDeFichas,
  type CategoriaBloque,
  type CreaBloque,
  type EstadoNuevaVariable,
  type FichaPaleta,
  type ZonaDestino,
} from './tecniaBloques';

/**
 * N4·U3 parada 2 · «Variables y puntajes» (documento §25.2).
 *
 * La misma mesa de la parada 1 —el editor `Tecnia Bloques` a la izquierda, la
 * vitrina con el muñeco a la derecha— más lo único que le faltaba al juego para
 * ser un juego: un marcador. Cuelga sobre la vitrina, es un tablero split-flap
 * de estación de tren y no hay ni una cifra en la interfaz que no salga de ahí.
 *
 * La cajita NO viene hecha. El alumno abre `+ Nueva variable`, la bautiza en un
 * cuadro de diálogo de programa de verdad y sólo entonces aparecen sus cuatro
 * piezas naranjas en la paleta, ya con su nombre escrito encima. Ese bautizo es
 * media clase: `revisarNombre` rechaza «x», rechaza «variable» y rechaza lo que
 * no cabe en el tablero, y dice por qué en cada caso.
 *
 * Tres retos que se apoyan uno en otro sin cambiar de escenario —cinco monedas
 * en fila, meta cinco—, y cada uno pone en juego una parte distinta de la misma
 * idea:
 *
 *   1 · EMPIEZA EN CERO — el marcador arranca en 3, «lo que quedó de la vez
 *       pasada». Aquí la moneda todavía suma sola: lo que se aprende es DÓNDE
 *       va el `poner en cero`. Arriba, pegado al sombrero, una sola vez. Si se
 *       mete dentro del bucle, el marcador parpadea entre 0 y 1 y no sube nunca,
 *       y eso se ve en el tablero antes de que Bit lo nombre.
 *   2 · QUE SUME — se le quita la ayuda: la moneda ya no suma sola. El `sumar 1`
 *       tiene que ir DENTRO de la C, pegado al recoger. Puesto en el tronco
 *       también llega a cinco… y sigue subiendo hasta diecinueve contando
 *       monedas que nadie recogió. El corte de la película deja ver ese
 *       desbordamiento a propósito.
 *   3 · PREGÚNTALE — un segundo `si` con el hexágono `¿nombre = 5?` y el
 *       `mostrar ¡GANASTE!` dentro. Fuera de la C, el letrero de la cancha se
 *       enciende en la primera vuelta con el marcador en cero.
 *
 * El intérprete es el mismo de la parada 1 (`programaBloques.ts`) con sus
 * `Ajustes`: lo que se ve en la vitrina y en el tablero es la reproducción de
 * los pasos que devuelve `simular`, nunca una animación que finge. Y el juicio
 * no mira sólo el resultado: `ubicarAccion` mira la FORMA del programa, porque
 * en esta parada llegar a cinco por casualidad y contar bien no son lo mismo.
 */

/** Las siete líneas de Bit del documento §25.2, palabra por palabra. */
const LINEAS = {
  inicio: 'Tu juego necesita memoria: algo que cuente los puntos. Eso es una variable.',
  nombre: 'Ponle un nombre que se entienda. «Puntos» está perfecto.',
  cero: '¡Ojo! Si no la pones en cero al empezar, arranca con lo de la vez pasada.',
  subio: 'Mira el marcador… ¡subió! Esa cajita ya está guardando.',
  fuera: 'Esa suma quedó fuera del «si»: está sumando sin que recojas nada.',
  pregunta: 'Y ahora puedes preguntarle: ¿ya llegó a cinco?',
  fin: '¡Marcador funcionando! Ya tienes lo que le faltaba a tu juego.',
};

/**
 * Lo que Bit dice cuando algo no encaja o no está donde debería.
 *
 * Ninguna de estas da la respuesta antes de tiempo. La de soltar en el tronco es
 * una INVITACIÓN a correr el programa y no la explicación del error, al revés
 * que en la parada 1: aquí el fallo tiene dónde verse —el marcador— y la lección
 * de §25.2 es justamente que se vea. Bit lo nombra después, cuando ya pasó.
 */
const AVISOS = {
  sinCajita: 'Primero necesitas la cajita. Toca «+ Nueva variable» y ponle nombre.',
  tronco: 'Ahí dentro se hace en cada vuelta, pase lo que pase. Córrelo y mira el marcador.',
  arranque: 'Eso va a pasar una sola vez, al empezar. Córrelo y mira qué marca el tablero.',
  preguntaSuelta: 'Una pregunta no se hace sola: va dentro del hueco del bloque «si».',
  reporteroEnHueco: 'El óvalo contesta un número, no un sí o un no. En el hueco no cabe.',
  ordenEnHueco: 'Eso es una orden, no una pregunta. En el hueco sólo entra algo que se conteste sí o no.',
  cDentroDeC: 'Los bloques con boca van en el tronco del programa, no dentro de otro.',
  primeraVez: 'Primero toca la pieza que quieres poner, y después toca aquí.',
};

/** Lo que se dice al entrar en cada reto. El 2 y el 3 avisan de lo que cambió. */
const ENTRADAS = [
  LINEAS.inicio,
  'Ahora la moneda ya no suma sola. Si nadie cuenta, el marcador se queda quieto.',
  LINEAS.pregunta,
];

export const META = 5;

/** Cinco monedas en fila: el muñeco las recoge una tras otra y la cuenta cierra justo en la meta. */
const MONEDAS = [1, 2, 3, 4, 5];

export const MUNDO: Omit<MundoBloques, 'puntos'> = {
  casilla: 0,
  rumbo: 0,
  monedas: MONEDAS,
  paredArriba: false,
};

/**
 * 300 ms y no los 400 de la parada 1: la corrida buena del reto 3 mide 27 pasos
 * —cinco vueltas de cinco bloques más el arranque y el aviso— y a 400 serían
 * once segundos de mirar sin tocar nada.
 */
export const PASO_MS = 300;

/** Tope de pasos que se REPRODUCEN. El veredicto sale de la corrida entera. */
export const TOPE_PASOS = 30;
export const TOTAL_PASOS = 9;

/** Hitos ya ganados al empezar cada reto: 2 + 1 del primero, 1 + 1 del segundo. */
export const PREVIOS = [0, 3, 5];

/**
 * Qué hace el muñeco con cada efecto. Las tres piezas de variable no lo mueven:
 * tocar el marcador no es moverse, así que se queda quieto y lo que cambia es el
 * tablero de arriba.
 */
const POSE_DE: Record<Efecto['tipo'], PoseMuneco> = {
  mira: 'quieto',
  avanza: 'camina',
  salta: 'salto',
  recoge: 'agachado',
  vacio: 'agachado',
  choca: 'choque',
  pone: 'quieto',
  suma: 'quieto',
  gana: 'quieto',
};

/* ── los tres retos ────────────────────────────────────────────────────────── */

export interface Reto {
  titulo: string;
  encargo: string;
  ajustes: Ajustes;
  /** Categoría que se abre sola al empezar el reto. */
  categoria: CategoriaBloque;
  /** El `mostrar ¡GANASTE!` sólo se reparte cuando hay algo que anunciar. */
  conMostrar: boolean;
  arranque: () => Programa;
  /** Dónde está la pieza que hace falta ahora, para que la columna lata. */
  pide: (programa: Programa, hayCajita: boolean) => CategoriaBloque | null;
  exito: (salida: Ejecucion, programa: Programa) => boolean;
  logro: string;
}

function orden(id: string, accion: Accion): NodoOrden {
  return { tipo: 'orden', id, accion };
}

function siConMoneda(id: string, condId: string, cuerpo: NodoOrden[]): NodoSi {
  return { tipo: 'si', id, condicion: { id: condId, pregunta: 'tocando-moneda' }, cuerpo };
}

/** Los bloques en C del tronco, en el orden en que están puestos. */
function cesDe(programa: Programa): (NodoSi | NodoSiNo)[] {
  const salida: (NodoSi | NodoSiNo)[] = [];
  for (const nodo of programa.siempre) {
    if (nodo.tipo === 'si' || nodo.tipo === 'sino') salida.push(nodo);
  }
  return salida;
}

/**
 * La C del aviso: la segunda del tronco.
 *
 * La primera ya viene puesta y es la de recoger monedas; la que el alumno añade
 * en el reto 3 es la que pregunta por el marcador. Se distinguen por posición y
 * no por su pregunta porque al principio no tiene ninguna: hay que poder señalar
 * el hueco vacío para pedirle que lo llene.
 */
function cDelAviso(programa: Programa): NodoSi | NodoSiNo | null {
  return cesDe(programa)[1] ?? null;
}

export const RETOS: Reto[] = [
  {
    titulo: 'Reto 1 · empieza en cero',
    encargo: 'Haz un marcador que empiece en cero.',
    // El marcador arranca en 3 —«lo que quedó de la vez pasada»— y la moneda
    // todavía suma sola. Es a propósito: «se queda pegado en 0» necesita algo que
    // suba para poder quedarse pegado, y aquí lo que se aprende es DÓNDE va el
    // bloque, no todavía quién cuenta. El reto 2 le quita justo esa ayuda.
    ajustes: { puntosIniciales: 3, sumaAlRecoger: true, metaPuntos: META, finAlQuedarseSinMonedas: true },
    categoria: 'variables',
    conMostrar: false,
    arranque: () => ({
      // Vacío y no `undefined`: la zona de arranque sólo se dibuja si existe, y
      // sin ella el reto no se puede ni plantear.
      inicio: [],
      siempre: [orden('r1-avanzar', 'avanzar'), siConMoneda('r1-si', 'r1-cond', [orden('r1-recoger', 'recoger')])],
    }),
    pide: (programa, hayCajita) => {
      if (!hayCajita) return 'variables';
      return ubicarAccion(programa, 'poner-cero').length > 0 ? null : 'variables';
    },
    // Dos comprobaciones que se apoyan la una en la otra: la forma —la pieza
    // arriba y en ningún otro sitio— y el resultado. Que la corrida buena caiga
    // justo en la meta no es casualidad amable: son cinco monedas y meta cinco,
    // así que cualquier otro sitio para el bloque deja el marcador en otro número.
    exito: (salida, programa) => {
      const puestas = ubicarAccion(programa, 'poner-cero');
      return puestas.length > 0 && puestas.every((u) => u.zona === 'inicio') && salida.puntos === META;
    },
    logro: '¡Cero limpio! Empezó de nuevo y contó las cinco. Eso es arrancar la partida.',
  },
  {
    titulo: 'Reto 2 · que sume',
    encargo: 'Que sume un punto cada vez que recoja una moneda.',
    ajustes: { puntosIniciales: 0, sumaAlRecoger: false, metaPuntos: META, finAlQuedarseSinMonedas: false },
    categoria: 'variables',
    conMostrar: false,
    arranque: () => ({
      inicio: [orden('r2-cero', 'poner-cero')],
      siempre: [orden('r2-avanzar', 'avanzar'), siConMoneda('r2-si', 'r2-cond', [orden('r2-recoger', 'recoger')])],
    }),
    pide: (programa, hayCajita) => {
      if (!hayCajita) return 'variables';
      return ubicarAccion(programa, 'sumar').some((u) => u.zona === 'dentro-de-c') ? null : 'variables';
    },
    // Aquí la forma es imprescindible: un `sumar 1` en el tronco también pasa por
    // cinco, sólo que contando vueltas en vez de monedas. Sin mirar dónde está la
    // pieza, el laboratorio daría por bueno el error que §25.2 quiere cazar.
    exito: (salida, programa) => {
      const sumas = ubicarAccion(programa, 'sumar');
      return (
        sumas.length > 0 &&
        sumas.every((u) => u.zona === 'dentro-de-c' && u.condicion === 'tocando-moneda') &&
        salida.puntos === META
      );
    },
    logro: '¡Cinco monedas, cinco puntos! La suma va pegada al recoger, así que cuenta lo que de verdad pasó.',
  },
  {
    titulo: 'Reto 3 · pregúntale',
    encargo: 'Que aparezca ¡GANASTE! cuando llegue a cinco.',
    ajustes: { puntosIniciales: 0, sumaAlRecoger: false, metaPuntos: META, finAlQuedarseSinMonedas: false },
    categoria: 'control',
    conMostrar: true,
    arranque: () => ({
      inicio: [orden('r3-cero', 'poner-cero')],
      siempre: [
        orden('r3-avanzar', 'avanzar'),
        siConMoneda('r3-si', 'r3-cond', [orden('r3-recoger', 'recoger'), orden('r3-sumar', 'sumar')]),
      ],
    }),
    pide: (programa) => {
      const c = cDelAviso(programa);
      if (!c) return 'control';
      if (!c.condicion) return 'sensores';
      return ubicarAccion(programa, 'mostrar').some((u) => u.zona === 'dentro-de-c') ? null : 'variables';
    },
    // El letrero se enciende diga lo que diga el marcador: es el intérprete
    // siendo fiel a los bloques. Que valga sólo cuando la cuenta llegó a la meta
    // lo decide aquí el laboratorio.
    exito: (salida) => salida.fin === 'gana' && salida.puntos === META,
    logro: '¡GANASTE encendido en el momento justo! Tu programa mira su propia cuenta y decide.',
  },
];

/** Cuántos hitos del reto se leen del propio programa (sin contar la corrida). */
export function hitosPrograma(programa: Programa, indice: number, hayCajita: boolean): number {
  if (indice === 0) {
    const arriba = ubicarAccion(programa, 'poner-cero').some((u) => u.zona === 'inicio');
    return (hayCajita ? 1 : 0) + (arriba ? 1 : 0);
  }
  if (indice === 1) {
    return ubicarAccion(programa, 'sumar').some((u) => u.zona === 'dentro-de-c') ? 1 : 0;
  }
  const c = cDelAviso(programa);
  if (!c) return 0;
  const dentro = ubicarAccion(programa, 'mostrar').some((u) => u.zona === 'dentro-de-c');
  return 1 + (c.condicion ? 1 : 0) + (dentro ? 1 : 0);
}

/**
 * La zona donde quedó colgada una acción, en el formato que entiende el editor
 * para temblar. Es cómo se señala el bloque culpable sin inventar una API nueva:
 * el mismo rebote que rechaza una pieza sirve para apuntar a la que sobra.
 */
export function zonaDe(programa: Programa, accion: Accion): string | null {
  for (const nodo of programa.inicio ?? []) {
    if (nodo.accion === accion) return 'inicio:';
  }
  for (const nodo of programa.siempre) {
    if (nodo.tipo === 'orden') {
      if (nodo.accion === accion) return 'siempre:';
      continue;
    }
    if (nodo.cuerpo.some((o) => o.accion === accion)) return `boca:${nodo.id}`;
    if (nodo.tipo === 'sino' && nodo.sino.some((o) => o.accion === accion)) return `sino:${nodo.id}`;
  }
  return null;
}

/* ── edición del árbol ─────────────────────────────────────────────────────── */

/* Todas conservan `inicio`: es una zona más del programa y perderla al editar
   borraría el reto 1 entero en cuanto el alumno tocara cualquier otra cosa. */

function conSiempre(programa: Programa, siempre: NodoCuerpo[]): Programa {
  return { inicio: programa.inicio, siempre };
}

function ponerEnInicio(programa: Programa, nodo: NodoOrden): Programa {
  return { inicio: [...(programa.inicio ?? []), nodo], siempre: programa.siempre };
}

function ponerCondicion(programa: Programa, nodoId: string, id: string, pregunta: Pregunta): Programa {
  return conSiempre(
    programa,
    programa.siempre.map((nodo) => {
      if (nodo.id !== nodoId) return nodo;
      if (nodo.tipo === 'si') return { ...nodo, condicion: { id, pregunta } };
      if (nodo.tipo === 'sino') return { ...nodo, condicion: { id, pregunta } };
      return nodo;
    })
  );
}

function ponerOrden(programa: Programa, nodoId: string, rama: 'cuerpo' | 'sino', nuevo: NodoOrden): Programa {
  return conSiempre(
    programa,
    programa.siempre.map((nodo) => {
      if (nodo.id !== nodoId) return nodo;
      if (nodo.tipo === 'si') return rama === 'cuerpo' ? { ...nodo, cuerpo: [...nodo.cuerpo, nuevo] } : nodo;
      if (nodo.tipo === 'sino') {
        return rama === 'cuerpo'
          ? { ...nodo, cuerpo: [...nodo.cuerpo, nuevo] }
          : { ...nodo, sino: [...nodo.sino, nuevo] };
      }
      return nodo;
    })
  );
}

function quitarCondicion(programa: Programa, nodoId: string): Programa {
  return conSiempre(
    programa,
    programa.siempre.map((nodo) => {
      if (nodo.id !== nodoId) return nodo;
      if (nodo.tipo === 'si') return { ...nodo, condicion: null };
      if (nodo.tipo === 'sino') return { ...nodo, condicion: null };
      return nodo;
    })
  );
}

function quitarNodo(programa: Programa, nodoId: string): Programa {
  return {
    inicio: programa.inicio?.filter((nodo) => nodo.id !== nodoId),
    siempre: programa.siempre
      .filter((nodo) => nodo.id !== nodoId)
      .map((nodo) => {
        if (nodo.tipo === 'si') return { ...nodo, cuerpo: nodo.cuerpo.filter((o) => o.id !== nodoId) };
        if (nodo.tipo === 'sino') {
          return {
            ...nodo,
            cuerpo: nodo.cuerpo.filter((o) => o.id !== nodoId),
            sino: nodo.sino.filter((o) => o.id !== nodoId),
          };
        }
        return nodo;
      }),
  };
}

/**
 * Lo que Bit lee de un bloque ya puesto: la misma frase que su ficha.
 *
 * Busca en las fichas VIVAS y no en el `CATALOGO` del módulo, porque las cuatro
 * piezas naranjas las acaba de fabricar el alumno con el nombre que él eligió y
 * ahí no están.
 */
function lecturaDe(programa: Programa, nodoId: string, fichas: FichaPaleta[]): string | null {
  for (const nodo of nodosDe(programa)) {
    if (nodo.id !== nodoId) continue;
    if (nodo.tipo === 'orden') {
      const ficha = fichas.find((f) => f.crea?.tipo === 'orden' && f.crea.accion === nodo.accion);
      return ficha?.lectura ?? null;
    }
    const ficha = fichas.find((f) => f.crea?.tipo === (nodo.tipo === 'si' ? 'si' : 'sino'));
    return ficha?.lectura ?? null;
  }
  return null;
}

/**
 * Los pasos que se ven. La corrida entera puede ser mucho más larga: el reto 2
 * acertado no termina nunca —da vueltas al tablero hasta gastar el cupo— y el
 * error de sumar en el tronco tampoco.
 */
export function recortar(salida: Ejecucion, indice: number): Ejecucion['pasos'] {
  if (indice === 1) {
    // El marcador desbocado se tiene que VER pasarse de la meta: es el error que
    // §25.2 pide cazar y cortar en cinco lo escondería justo antes de delatarse.
    const pasado = salida.pasos.findIndex((p) => p.puntos > META);
    if (pasado >= 0) return salida.pasos.slice(0, pasado + 2);
    const meta = salida.pasos.findIndex((p) => p.efecto.tipo === 'suma' && p.efecto.valor === META);
    if (meta >= 0) return salida.pasos.slice(0, meta + 3);
  }
  if (indice === 2) {
    const gana = salida.pasos.findIndex((p) => p.efecto.tipo === 'gana');
    if (gana >= 0) return salida.pasos.slice(0, gana + 1);
  }
  return salida.pasos.slice(0, TOPE_PASOS);
}

function vitrinaDe(): EstadoVitrina {
  return {
    casilla: MUNDO.casilla,
    rumbo: MUNDO.rumbo,
    pose: 'quieto',
    monedas: [...MUNDO.monedas],
    paredArriba: MUNDO.paredArriba,
    corriendo: false,
    celebra: false,
  };
}

/* ── el laboratorio ────────────────────────────────────────────────────────── */

export function LabVariablesYPuntajes(props: ActivityProps & { alSalir?: () => void }) {
  const [reto, setReto] = useState(0);
  const [programa, setPrograma] = useState<Programa>(() => RETOS[0].arranque());
  const [categoria, setCategoria] = useState<CategoriaBloque>(RETOS[0].categoria);
  const [elegida, setElegida] = useState<string | null>(null);
  const [rebote, setRebote] = useState<string | null>(null);
  const [activo, setActivo] = useState<string | null>(null);
  const [respuesta, setRespuesta] = useState<boolean | null>(null);
  const [corriendo, setCorriendo] = useState(false);
  const [puntos, setPuntos] = useState(RETOS[0].ajustes.puntosIniciales);
  const [gano, setGano] = useState(false);
  const [vitrina, setVitrina] = useState<EstadoVitrina>(vitrinaDe);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  /** La cajita del alumno: su nombre y el diálogo que lo pide. */
  const [nombre, setNombre] = useState<string | null>(null);
  const [dialogo, setDialogo] = useState<EstadoNuevaVariable>({ abierto: false, borrador: '', aviso: null });

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  /**
   * Las fichas en juego. Se rehacen cuando el alumno bautiza su cajita porque su
   * etiqueta lleva el nombre que él escribió: `sumar 1 a monedas` se lee solo y
   * `sumar 1 a x` no. La `¿cuántos puntos tengo?` genérica de §25.1 se cae de
   * esta parada: el óvalo del alumno hace lo mismo con mejor nombre, y tener las
   * dos sería enseñar que da igual cómo se llamen las cosas.
   */
  const fichas = useMemo<FichaPaleta[]>(() => {
    const base = CATALOGO.filter((f) => f.id !== 'puntos');
    const propias = nombre ? fichasDeVariable(nombre, META) : [];
    return [...base, ...propias, ...(RETOS[reto].conMostrar ? [FICHA_MOSTRAR] : [])];
  }, [nombre, reto]);
  const porId = useMemo(() => mapaDeFichas(fichas), [fichas]);

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0, nodos: 0, vioSuma: false });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, reto, programa, elegida, corriendo, nombre, porId, fichas });
  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, reto, programa, elegida, corriendo, nombre, porId, fichas };
  });
  useEffect(() => {
    sim.current.inicio = Date.now();
  }, []);

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

  const restar = () => {
    reproducirTono('error');
    sim.current.errores += 1;
    propsRef.current.onScore(puntaje());
  };

  const temblar = (zona: string) => {
    setRebote(zona);
    timers.despues(() => setRebote(null), 360);
  };

  const avanzarProgreso = (nuevo: Programa, indice: number, cajita: boolean, extra: number) => {
    const hechos = PREVIOS[indice] + hitosPrograma(nuevo, indice, cajita) + extra;
    propsRef.current.onProgress(Math.min(1, hechos / TOTAL_PASOS));
  };

  const terminar = (tiempoSegundos: number) => {
    reproducirTono('complete');
    hablar(LINEAS.fin);
    const score = puntaje();
    propsRef.current.onProgress(1);
    propsRef.current.onScore(score);
    propsRef.current.onComplete({
      score,
      stars: 3,
      xp: score,
      errores: sim.current.errores,
      tiempoSegundos,
    });
    setTiempoFinal(tiempoSegundos);
    setErroresFinal(sim.current.errores);
    setTerminado(true);
  };

  /* ── el bautizo de la cajita ───────────────────────────────────────────────
     El diálogo enseña, no examina: un nombre rechazado no resta puntaje. Lo que
     el alumno se lleva es la frase que explica por qué ese nombre no sirve, y
     cobrarle por leerla convertiría la lección en una trampa. */

  const abrirDialogo = () => {
    if (vivo.current.terminado || vivo.current.corriendo || vivo.current.nombre) return;
    reproducirTono('select');
    setDialogo({ abierto: true, borrador: '', aviso: null });
    // La recomendación va ANTES de escribir. Decirla después sería corregir.
    hablar(LINEAS.nombre);
  };

  const escribirNombre = (texto: string) => {
    setDialogo((d) => ({ ...d, borrador: texto, aviso: null }));
  };

  const cancelarDialogo = () => {
    reproducirTono('close');
    setDialogo({ abierto: false, borrador: '', aviso: null });
  };

  const crearVariable = () => {
    const revision = revisarNombre(dialogo.borrador);
    if (!revision.ok) {
      reproducirTono('error');
      setDialogo((d) => ({ ...d, aviso: revision.aviso }));
      if (revision.aviso) hablar(revision.aviso);
      return;
    }
    const limpio = limpiarNombre(dialogo.borrador);
    reproducirTono('connect');
    setNombre(limpio);
    setDialogo({ abierto: false, borrador: '', aviso: null });
    setCategoria('variables');
    hablar(`Ya está: la cajita se llama ${limpio}, y sus piezas te esperan en la paleta.`);
    avanzarProgreso(vivo.current.programa, vivo.current.reto, true, 0);
  };

  const leerVariable = () => {
    const nombreVivo = vivo.current.nombre;
    if (!nombreVivo) return;
    reproducirTono('select');
    hablar(`${nombreVivo} vale ${puntos} ahora mismo.`);
  };

  /* ── armar el programa ─────────────────────────────────────────────────── */

  const rebotar = (zona: ZonaDestino, crea: CreaBloque) => {
    restar();
    temblar(`${zona.clase}:${zona.nodoId}`);
    if (zona.clase === 'hueco') {
      hablar(crea === null ? AVISOS.reporteroEnHueco : AVISOS.ordenEnHueco);
      return;
    }
    if (crea === null) {
      hablar(AVISOS.reporteroEnHueco);
      return;
    }
    if (crea.tipo === 'condicion') {
      hablar(AVISOS.preguntaSuelta);
      return;
    }
    hablar(AVISOS.cDentroDeC);
  };

  const soltar = (zona: ZonaDestino, fichaId: string) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.corriendo) return;
    const ficha = vivo.current.porId.get(fichaId);
    if (!ficha) return;
    const crea = ficha.crea;
    if (!admite(zona.clase, crea) || !crea) {
      rebotar(zona, crea);
      return;
    }

    const anterior = vivo.current.programa;
    sim.current.nodos += 1;
    const id = `p${sim.current.nodos}`;
    let nuevo = anterior;

    if (zona.clase === 'hueco' && crea.tipo === 'condicion') {
      nuevo = ponerCondicion(anterior, zona.nodoId, id, crea.pregunta);
      reproducirTono('connect');
    } else if (crea.tipo === 'si' || crea.tipo === 'sino') {
      const nodo: NodoSi | NodoSiNo =
        crea.tipo === 'si'
          ? { tipo: 'si', id, condicion: null, cuerpo: [] }
          : { tipo: 'sino', id, condicion: null, cuerpo: [], sino: [] };
      nuevo = conSiempre(anterior, [...anterior.siempre, nodo]);
      reproducirTono('connect');
    } else if (crea.tipo === 'orden') {
      const nodo = orden(id, crea.accion);
      if (zona.clase === 'inicio') {
        nuevo = ponerEnInicio(anterior, nodo);
        reproducirTono('connect');
        // Ni bien ni mal por sí solo: `poner en cero` arriba es la respuesta del
        // reto 1 y `sumar 1` arriba es el error que hay que poder cometer.
        if (crea.accion !== 'poner-cero') hablar(AVISOS.arranque);
      } else if (zona.clase === 'siempre') {
        nuevo = conSiempre(anterior, [...anterior.siempre, nodo]);
        reproducirTono('select');
        hablar(AVISOS.tronco);
      } else {
        nuevo = ponerOrden(anterior, zona.nodoId, zona.clase === 'sino' ? 'sino' : 'cuerpo', nodo);
        reproducirTono('connect');
      }
    }

    setPrograma(nuevo);
    setElegida(null);
    avanzarProgreso(nuevo, vivo.current.reto, vivo.current.nombre !== null, 0);
  };

  const tocar = (zona: ZonaDestino) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.corriendo) return;
    const elegidaViva = vivo.current.elegida;
    if (!elegidaViva) {
      hablar(vivo.current.nombre ? AVISOS.primeraVez : AVISOS.sinCajita);
      return;
    }
    soltar(zona, elegidaViva);
  };

  const elegir = (fichaId: string) => {
    if (vivo.current.terminado) return;
    const ficha = vivo.current.porId.get(fichaId);
    if (!ficha) return;
    reproducirTono('select');
    setElegida(fichaId);
    hablar(ficha.lectura);
  };

  const quitar = (nodoId: string) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.corriendo) return;
    reproducirTono('close');
    const anterior = vivo.current.programa;
    const nuevo = nodoId.startsWith('cond:')
      ? quitarCondicion(anterior, nodoId.slice(5))
      : quitarNodo(anterior, nodoId);
    setPrograma(nuevo);
    avanzarProgreso(nuevo, vivo.current.reto, vivo.current.nombre !== null, 0);
  };

  const leer = (nodoId: string) => {
    const texto = lecturaDe(vivo.current.programa, nodoId, vivo.current.fichas);
    if (texto) hablar(texto);
  };

  /* ── correr el programa ────────────────────────────────────────────────── */

  const descansar = (indice: number) => {
    setVitrina(vitrinaDe());
    setPuntos(RETOS[indice].ajustes.puntosIniciales);
    setGano(false);
  };

  const cargar = (indice: number) => {
    const r = RETOS[indice];
    setReto(indice);
    setPrograma(r.arranque());
    setCategoria(r.categoria);
    setElegida(null);
    setActivo(null);
    setRespuesta(null);
    descansar(indice);
    hablar(ENTRADAS[indice]);
  };

  /** El diagnóstico de por qué no salió, distinto en cada reto. «No lo lograste» no enseña nada. */
  const diagnosticar = (salida: Ejecucion, indice: number) => {
    const actual = vivo.current.programa;

    if (indice === 0) {
      const puestas = ubicarAccion(actual, 'poner-cero');
      if (puestas.length === 0) {
        hablar(LINEAS.cero);
        return;
      }
      const zona = zonaDe(actual, 'poner-cero');
      if (zona) temblar(zona);
      hablar('Ahí dentro se vacía en cada vuelta: por eso el marcador no pasa de uno. Va arriba, al empezar.');
      return;
    }

    if (indice === 1) {
      const sumas = ubicarAccion(actual, 'sumar');
      if (sumas.length === 0) {
        hablar('Nadie está contando: la moneda ya no suma sola. Busca en Variables la pieza que suma.');
        return;
      }
      if (sumas.some((u) => u.zona !== 'dentro-de-c')) {
        const zona = zonaDe(actual, 'sumar');
        if (zona) temblar(zona);
        hablar(LINEAS.fuera);
        return;
      }
      hablar('La suma está dentro de un «si» que pregunta otra cosa. Tiene que ir donde recoge la moneda.');
      return;
    }

    if (salida.fin === 'gana') {
      const zona = zonaDe(actual, 'mostrar');
      if (zona) temblar(zona);
      hablar(`El letrero se encendió con el marcador en ${salida.puntos}. Avisó antes de que la cuenta llegara.`);
      return;
    }
    const c = cDelAviso(actual);
    if (!c) {
      hablar('Nadie está mirando el marcador. Hace falta otro «si» que le pregunte a tu cajita.');
      return;
    }
    hablar('El «si» está puesto, pero el ¡GANASTE! no está dentro de su boca: nunca llega a encenderse.');
  };

  const juzgar = (salida: Ejecucion, indice: number) => {
    const r = RETOS[indice];
    sim.current.ocupado = false;
    setCorriendo(false);
    setActivo(null);
    setRespuesta(null);

    if (!r.exito(salida, vivo.current.programa)) {
      restar();
      diagnosticar(salida, indice);
      setAviso('Míralo otra vez: ¿qué marca el tablero?');
      timers.despues(() => {
        setAviso(null);
        descansar(indice);
      }, 1600);
      return;
    }

    reproducirTono('complete');
    hablar(r.logro);
    avanzarProgreso(vivo.current.programa, indice, vivo.current.nombre !== null, 1);
    setVitrina((v) => ({ ...v, corriendo: false, celebra: true, pose: 'quieto' }));

    if (indice === RETOS.length - 1) {
      timers.despues(() => terminar(Math.round((Date.now() - sim.current.inicio) / 1000)), 1400);
      return;
    }
    setAviso(RETOS[indice + 1].titulo);
    timers.despues(() => {
      setAviso(null);
      cargar(indice + 1);
    }, 1800);
  };

  const correr = () => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.corriendo) return;
    const indice = vivo.current.reto;
    const r = RETOS[indice];
    const salida = simular(vivo.current.programa, MUNDO, r.ajustes);
    const pasos = recortar(salida, indice);

    sim.current.ocupado = true;
    reproducirTono('power');
    setElegida(null);
    setCorriendo(true);
    setGano(false);
    setPuntos(r.ajustes.puntosIniciales);
    setVitrina({ ...vitrinaDe(), corriendo: true });

    pasos.forEach((paso, i) => {
      timers.despues(() => {
        setActivo(paso.nodoId);
        setRespuesta(paso.efecto.tipo === 'mira' ? paso.efecto.respuesta : null);
        setPuntos(paso.puntos);
        setVitrina({
          casilla: paso.casilla,
          rumbo: paso.rumbo,
          pose: POSE_DE[paso.efecto.tipo],
          monedas: paso.monedas,
          paredArriba: MUNDO.paredArriba,
          corriendo: true,
          celebra: paso.efecto.tipo === 'recoge',
        });
        if (paso.efecto.tipo === 'recoge') reproducirTono('correct');
        if (paso.efecto.tipo === 'pone') reproducirTono('close');
        if (paso.efecto.tipo === 'suma') {
          reproducirTono('select');
          // La primera vez que una cifra sube por orden del alumno. Después ya no
          // hace falta decirlo: el tablero lo dice mejor.
          if (!sim.current.vioSuma) {
            sim.current.vioSuma = true;
            hablar(LINEAS.subio);
          }
        }
        if (paso.efecto.tipo === 'gana') {
          reproducirTono('complete');
          setGano(true);
        }
      }, PASO_MS * (i + 1));
    });

    timers.despues(() => juzgar(salida, indice), PASO_MS * (pasos.length + 1) + 260);
  };

  const parar = () => {
    if (!vivo.current.corriendo) return;
    timers.limpiar();
    sim.current.ocupado = false;
    reproducirTono('close');
    setCorriendo(false);
    setActivo(null);
    setRespuesta(null);
    descansar(vivo.current.reto);
  };

  const repetir = () => {
    timers.limpiar();
    sim.current = { ocupado: false, errores: 0, inicio: Date.now(), nodos: 0, vioSuma: false };
    setReto(0);
    setPrograma(RETOS[0].arranque());
    setCategoria(RETOS[0].categoria);
    setElegida(null);
    setRebote(null);
    setActivo(null);
    setRespuesta(null);
    setCorriendo(false);
    setNombre(null);
    setDialogo({ abierto: false, borrador: '', aviso: null });
    descansar(0);
    setAviso(null);
    setTerminado(false);
    setTiempoFinal(0);
    setErroresFinal(0);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const formatTiempo = (segundos: number) => {
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  /* ── lo que ve la sala ─────────────────────────────────────────────────── */

  const retoVivo = RETOS[reto];
  const paso = terminado ? TOTAL_PASOS : PREVIOS[reto] + hitosPrograma(programa, reto, nombre !== null);

  const encargo = (
    <div className="bloques3d-encargo">
      <span className="bloques3d-encargo-num">{reto + 1}</span>
      <span className="bloques3d-encargo-texto">{retoVivo.encargo}</span>
    </div>
  );

  const editor = (
    <TecniaBloques
      reto={retoVivo.titulo}
      fichas={fichas}
      categoria={categoria}
      categoriaPedida={corriendo || terminado ? null : retoVivo.pide(programa, nombre !== null)}
      programa={programa}
      activo={activo}
      respuesta={respuesta}
      corriendo={corriendo}
      elegida={elegida}
      rebote={rebote}
      puntos={puntos}
      variable={{
        estado: dialogo,
        nombre,
        onAbrir: abrirDialogo,
        onEscribir: escribirNombre,
        onCancelar: cancelarDialogo,
        onCrear: crearVariable,
      }}
      onCategoria={setCategoria}
      onElegir={elegir}
      onSoltar={soltar}
      onTocar={tocar}
      onQuitar={quitar}
      onLeer={leer}
      onCorrer={correr}
      onParar={parar}
    />
  );

  const escena = (
    <EstacionBloques3D
      reduceMotion={reduceMotion}
      encendido
      vitrina={vitrina}
      pantalla={editor}
      puntos={{
        nombre,
        // Sin cajita no hay nada que marcar: el tablero se queda a oscuras, con
        // las hojas caídas, hasta que el alumno la crea.
        valor: nombre ? puntos : null,
        meta: META,
        corriendo,
        onLeer: leerVariable,
        reduceMotion,
      }}
      letrero={{ encendido: gano }}
      encargo={encargo}
    />
  );

  /* El respaldo sin WebGL monta el MISMO editor —es DOM puro— y cuenta con
     palabras lo que la vitrina y el tablero enseñan con luces. */
  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">{retoVivo.encargo}</p>
      {editor}
      <p className="escena3d-respaldo-titulo">
        {`Casilla ${vitrina.casilla + 1} de ${TOTAL_CASILLAS} · quedan ${vitrina.monedas.length} monedas · ${
          nombre ? `${nombre} marca ${puntos} de ${META}` : 'todavía no hay ninguna cajita'
        }${gano ? ' · ¡GANASTE! encendido' : ''}`}
      </p>
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="Variables y puntajes"
      pasoEtiqueta="Paso"
      pasoActual={paso}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta={nombre ?? 'Marcador'}
      marcadorValor={nombre ? `${puntos}/${META}` : '—'}
      bit={linea}
      paleta={{ acento: '#FB923C', acento2: '#22D3EE' }}
      activa={!terminado}
      sinMostrador
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={<p className="gabinete-nota">El Laboratorio de Juegos · la cajita recuerda · el tablero lo enseña</p>}
      final={
        terminado
          ? {
              insigniaNombre: 'Contador de puntos',
              insigniaEmoji: '🧮',
              titulo: '¡Tu juego ya lleva la cuenta!',
              detalle:
                'Hiciste una cajita con nombre, la pusiste en cero al empezar, metiste la suma justo donde se recoge la moneda y le enseñaste a tu programa a preguntarle si ya llegó. Eso —guardar un número y decidir con él— es lo que separa un juego de una animación.',
              resumen: [
                { etiqueta: 'Retos', valor: `${RETOS.length}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
                { etiqueta: 'Errores', valor: `${erroresFinal}` },
              ],
              alRepetir: repetir,
            }
          : null
      }
    >
      {aviso && <AvisoRonda3D texto={aviso} clave={aviso} />}
    </ArcadeSala3D>
  );
}

export default LabVariablesYPuntajes;
