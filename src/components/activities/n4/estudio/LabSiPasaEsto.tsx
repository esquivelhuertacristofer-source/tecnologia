'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { EstacionBloques3D, type EstadoVitrina, type PoseMuneco } from './piezasN4U3';
import {
  CASILLA_PARED,
  TOTAL_CASILLAS,
  ordenesDentroDeC,
  simular,
  type Efecto,
  type Ejecucion,
  type MundoBloques,
  type NodoOrden,
  type NodoSi,
  type NodoSiNo,
  type Pregunta,
  type Programa,
} from './programaBloques';
import {
  CATALOGO,
  FICHAS_POR_ID,
  TecniaBloques,
  admite,
  type CategoriaBloque,
  type CreaBloque,
  type ZonaDestino,
} from './tecniaBloques';

/**
 * N4·U3 parada 1 · «Si pasa esto…» (documento §25 y §25.1).
 *
 * El taller tiene una sola mesa y dos mitades que se miran: a la izquierda el
 * monitor con `Tecnia Bloques` —el editor de verdad, con su barra de título y
 * sus categorías, no un HUD— y a la derecha la vitrina donde el muñeco hace
 * exactamente lo que dice el programa. Nada se explica dos veces: lo que el
 * alumno arma en el cristal de la izquierda ocurre en el cristal de la derecha,
 * y cuando se equivoca no aparece una cruz roja, aparece un muñeco agachándose
 * a recoger aire.
 *
 * Tres retos que escalan sin cambiar de escenario:
 *   1 · LA MONEDA — el programa ya avanza solo. El alumno mete el bloque `si`,
 *       le pone la pregunta y guarda `recoger` DENTRO de la C. Si la deja fuera,
 *       el muñeco se agacha en casillas vacías y Bit dice por qué.
 *   2 · LA PARED — el `si` ya está puesto con `saltar` dentro; el hueco está
 *       vacío. Cuatro candidatas: una entra y funciona, una entra y falla
 *       (salta encima de la moneda y se estrella), y dos rebotan por forma.
 *   3 · SI NO — dos caminos: recoger arriba, avanzar abajo, tres monedas.
 *
 * El intérprete vive aparte, en `programaBloques.ts`, con su propia batería de
 * pruebas: lo que se ve en la vitrina es una película de los pasos que devuelve
 * `simular`, nunca una animación que finge. El error resta en el puntaje
 * (100 − 6, piso 60) y jamás borra lo ya armado.
 */

/** Las siete líneas de Bit del documento §25.1, palabra por palabra. */
const LINEAS = {
  inicio: 'Hoy tu personaje va a aprender a decidir solo. ¿Le enseñamos?',
  encajo: '¡Encajó! Mira cómo el bloque abraza a la acción.',
  fuera: 'Esa acción quedó fuera de la C: se va a hacer siempre, no solo cuando toque.',
  reto2: 'Una condición se contesta sí o no. ¿Cuál de estas es una pregunta así?',
  salto: '¡Míralo! Se acercó a la pared… y saltó solito.',
  reto3: 'Con «si no» tienes dos caminos: uno para el sí y otro para el no.',
  fin: '¡Ya sabes hacer que un programa decida! Eso es lo que hace un juego, un juego.',
};

/* Lo que Bit contesta cuando una pieza rebota. Un rebote sin explicación es un
   «no» a secas; con explicación es la clase entera: la forma del bloque ES la
   regla, y aquí se dice en voz alta la regla que la forma ya enseñó. */
const REBOTES = {
  ordenEnHueco: 'Eso es una orden, no una pregunta. En el hueco sólo entra algo que se conteste sí o no.',
  reporteroEnHueco: '«¿Cuántos puntos tengo?» no se contesta sí o no: contesta un número. Ahí no cabe.',
  preguntaSuelta: 'Una pregunta no se hace sola: va dentro del hueco del bloque «si».',
  cDentroDeC: 'Los bloques con boca van en el tronco del programa, no dentro de otro.',
};

/* Lo que Bit dice cuando la corrida no logra el encargo. Cada final del
   intérprete tiene su propio diagnóstico: «no lo lograste» no enseña nada. */
const FALLOS = {
  choque: 'Se estrelló contra la pared. La pregunta que pusiste no era la que avisa de la pared.',
  vacio: LINEAS.fuera,
  vueltas: 'Dio la vuelta entera y no lo logró. Mira qué le falta al programa para decidir.',
};

const PASO_MS = 400;
/** Tope de pasos que se REPRODUCEN. El veredicto se saca de la corrida entera. */
const TOPE_PASOS = 20;
const TOTAL_PASOS = 9;
/** Hitos ya ganados al empezar cada reto: 3 + 1 del primero, 1 + 1 del segundo. */
const PREVIOS = [0, 4, 6];

const POSE_DE: Record<Efecto['tipo'], PoseMuneco> = {
  mira: 'quieto',
  avanza: 'camina',
  salta: 'salto',
  recoge: 'agachado',
  vacio: 'agachado',
  choca: 'choque',
  // Las tres piezas de variable (§25.2) no salen en la paleta de esta parada,
  // pero el mapa es exhaustivo a propósito: así, cuando el intérprete gane un
  // efecto nuevo, el compilador obliga a decidir qué hace el muñeco en vez de
  // dejarlo en `undefined`. Tocar el marcador no lo mueve: se queda quieto.
  pone: 'quieto',
  suma: 'quieto',
  gana: 'quieto',
};

/* ── los tres retos ────────────────────────────────────────────────────────── */

interface Reto {
  titulo: string;
  encargo: string;
  mundo: Omit<MundoBloques, 'puntos'>;
  /** Categoría que se abre sola al empezar el reto. */
  categoria: CategoriaBloque;
  arranque: () => Programa;
  /** Dónde está la pieza que hace falta ahora, para que la columna lata. */
  pide: (programa: Programa) => CategoriaBloque | null;
  exito: (salida: Ejecucion) => boolean;
  logro: string;
}

/** El primer bloque en C del tronco, con el tipo ya estrechado. */
function cDe(programa: Programa): NodoSi | NodoSiNo | null {
  for (const nodo of programa.siempre) {
    if (nodo.tipo === 'si' || nodo.tipo === 'sino') return nodo;
  }
  return null;
}

/** El `si… si no…` del tronco. */
function sinoDe(programa: Programa): NodoSiNo | null {
  for (const nodo of programa.siempre) {
    if (nodo.tipo === 'sino') return nodo;
  }
  return null;
}

const RETOS: Reto[] = [
  {
    titulo: 'Reto 1 · la moneda',
    encargo: 'Haz que recoja la moneda sólo cuando la esté tocando.',
    // Dos monedas y no una: con una sola, el `por siempre` se acaba antes de que
    // se vea dar la vuelta, y la vuelta es la mitad de lo que enseña el bucle.
    mundo: { casilla: 0, rumbo: 0, monedas: [1, 5], paredArriba: false },
    categoria: 'control',
    arranque: () => ({ siempre: [{ tipo: 'orden', id: 'r1-avanzar', accion: 'avanzar' }] }),
    pide: (programa) => {
      const c = cDe(programa);
      if (!c) return 'control';
      if (!c.condicion) return 'sensores';
      if (ordenesDentroDeC(programa).length === 0) return 'movimiento';
      return null;
    },
    exito: (salida) => salida.fin === 'monedas' && salida.vacios === 0,
    logro: '¡Eso es! Sólo se agacha cuando hay moneda. El «si» decidió por él.',
  },
  {
    titulo: 'Reto 2 · la pared',
    encargo: 'Que salte justo antes de chocar con la pared.',
    mundo: { casilla: 0, rumbo: 0, monedas: [1], paredArriba: true },
    categoria: 'sensores',
    arranque: () => ({
      siempre: [
        { tipo: 'orden', id: 'r2-avanzar', accion: 'avanzar' },
        {
          tipo: 'si',
          id: 'r2-si',
          condicion: null,
          cuerpo: [{ tipo: 'orden', id: 'r2-saltar', accion: 'saltar' }],
        },
      ],
    }),
    pide: (programa) => (cDe(programa)?.condicion ? null : 'sensores'),
    exito: (salida) => salida.fin !== 'choque' && salida.paredSuperada,
    logro: LINEAS.salto,
  },
  {
    titulo: 'Reto 3 · si… si no…',
    encargo: 'Si toca la moneda que la recoja; si no, que siga caminando.',
    mundo: { casilla: 0, rumbo: 0, monedas: [1, 4, 6], paredArriba: false },
    categoria: 'movimiento',
    arranque: () => ({
      siempre: [
        {
          tipo: 'sino',
          id: 'r3-sino',
          condicion: { id: 'r3-cond', pregunta: 'tocando-moneda' },
          cuerpo: [],
          sino: [],
        },
      ],
    }),
    pide: (programa) => {
      const s = sinoDe(programa);
      return s && s.cuerpo.length > 0 && s.sino.length > 0 ? null : 'movimiento';
    },
    exito: (salida) => salida.fin === 'monedas' && salida.vacios === 0,
    logro: 'Las tres monedas. Tu programa decidió ocho veces seguidas y acertó todas.',
  },
];

/** Cuántos hitos del reto se leen del propio programa (sin contar la corrida). */
function hitosPrograma(programa: Programa, indice: number): number {
  if (indice === 0) {
    const c = cDe(programa);
    if (!c) return 0;
    return 1 + (c.condicion ? 1 : 0) + (ordenesDentroDeC(programa).length > 0 ? 1 : 0);
  }
  if (indice === 1) return cDe(programa)?.condicion ? 1 : 0;
  const s = sinoDe(programa);
  if (!s) return 0;
  return (s.cuerpo.length > 0 ? 1 : 0) + (s.sino.length > 0 ? 1 : 0);
}

/* ── edición del árbol ─────────────────────────────────────────────────────── */

function ponerCondicion(programa: Programa, nodoId: string, id: string, pregunta: Pregunta): Programa {
  return {
    siempre: programa.siempre.map((nodo) => {
      if (nodo.id !== nodoId) return nodo;
      if (nodo.tipo === 'si') return { ...nodo, condicion: { id, pregunta } };
      if (nodo.tipo === 'sino') return { ...nodo, condicion: { id, pregunta } };
      return nodo;
    }),
  };
}

function ponerOrden(programa: Programa, nodoId: string, rama: 'cuerpo' | 'sino', orden: NodoOrden): Programa {
  return {
    siempre: programa.siempre.map((nodo) => {
      if (nodo.id !== nodoId) return nodo;
      if (nodo.tipo === 'si') return rama === 'cuerpo' ? { ...nodo, cuerpo: [...nodo.cuerpo, orden] } : nodo;
      if (nodo.tipo === 'sino') {
        return rama === 'cuerpo'
          ? { ...nodo, cuerpo: [...nodo.cuerpo, orden] }
          : { ...nodo, sino: [...nodo.sino, orden] };
      }
      return nodo;
    }),
  };
}

function quitarCondicion(programa: Programa, nodoId: string): Programa {
  return {
    siempre: programa.siempre.map((nodo) => {
      if (nodo.id !== nodoId) return nodo;
      if (nodo.tipo === 'si') return { ...nodo, condicion: null };
      if (nodo.tipo === 'sino') return { ...nodo, condicion: null };
      return nodo;
    }),
  };
}

function quitarNodo(programa: Programa, nodoId: string): Programa {
  return {
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

/** Lo que Bit lee de un bloque ya puesto: la misma frase que su ficha. */
function lecturaDe(programa: Programa, nodoId: string): string | null {
  for (const nodo of programa.siempre) {
    const dentro: NodoOrden[] =
      nodo.tipo === 'si' ? nodo.cuerpo : nodo.tipo === 'sino' ? [...nodo.cuerpo, ...nodo.sino] : [];
    for (const orden of [...(nodo.tipo === 'orden' ? [nodo] : []), ...dentro]) {
      if (orden.id !== nodoId) continue;
      const ficha = CATALOGO.find((f) => f.crea?.tipo === 'orden' && f.crea.accion === orden.accion);
      return ficha?.lectura ?? null;
    }
    if (nodo.id === nodoId && nodo.tipo !== 'orden') {
      const ficha = CATALOGO.find((f) => f.crea?.tipo === (nodo.tipo === 'si' ? 'si' : 'sino'));
      return ficha?.lectura ?? null;
    }
  }
  return null;
}

/** Los pasos que se ven. La corrida entera puede ser mucho más larga. */
function recortar(salida: Ejecucion, indice: number): Ejecucion['pasos'] {
  if (indice === 1) {
    // El reto 2 acertado no termina nunca: da vueltas saltando la pared una y
    // otra vez. Se corta tres pasos después del salto, que es lo que hay que
    // ver; dejarlo correr hasta el tope de órdenes serían veinte segundos de
    // muñeco caminando y la lección ya pasó.
    const i = salida.pasos.findIndex((p) => p.efecto.tipo === 'salta' && p.efecto.desde === CASILLA_PARED);
    if (i >= 0) return salida.pasos.slice(0, i + 3);
  }
  return salida.pasos.slice(0, TOPE_PASOS);
}

function vitrinaDe(mundo: Omit<MundoBloques, 'puntos'>): EstadoVitrina {
  return {
    casilla: mundo.casilla,
    rumbo: mundo.rumbo,
    pose: 'quieto',
    monedas: [...mundo.monedas],
    paredArriba: mundo.paredArriba,
    corriendo: false,
    celebra: false,
  };
}

/* ── el laboratorio ────────────────────────────────────────────────────────── */

export function LabSiPasaEsto(props: ActivityProps & { alSalir?: () => void }) {
  const [reto, setReto] = useState(0);
  const [programa, setPrograma] = useState<Programa>(() => RETOS[0].arranque());
  const [categoria, setCategoria] = useState<CategoriaBloque>(RETOS[0].categoria);
  const [elegida, setElegida] = useState<string | null>(null);
  const [rebote, setRebote] = useState<string | null>(null);
  const [activo, setActivo] = useState<string | null>(null);
  const [respuesta, setRespuesta] = useState<boolean | null>(null);
  const [corriendo, setCorriendo] = useState(false);
  const [puntos, setPuntos] = useState(0);
  const [vitrina, setVitrina] = useState<EstadoVitrina>(() => vitrinaDe(RETOS[0].mundo));
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0, nodos: 0, encajo: false });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, reto, programa, elegida, corriendo });
  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, reto, programa, elegida, corriendo };
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

  const avanzarProgreso = (nuevo: Programa, indice: number, extra: number) => {
    const hechos = PREVIOS[indice] + hitosPrograma(nuevo, indice) + extra;
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

  /* ── armar el programa ─────────────────────────────────────────────────── */

  const rebotar = (zona: ZonaDestino, crea: CreaBloque) => {
    restar();
    setRebote(`${zona.clase}:${zona.nodoId}`);
    timers.despues(() => setRebote(null), 360);
    if (zona.clase === 'hueco') {
      hablar(crea === null ? REBOTES.reporteroEnHueco : REBOTES.ordenEnHueco);
      return;
    }
    if (crea === null) {
      hablar(REBOTES.reporteroEnHueco);
      return;
    }
    if (crea.tipo === 'condicion') {
      hablar(REBOTES.preguntaSuelta);
      return;
    }
    hablar(REBOTES.cDentroDeC);
  };

  const soltar = (zona: ZonaDestino, fichaId: string) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.corriendo) return;
    const ficha = FICHAS_POR_ID.get(fichaId);
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
      nuevo = { siempre: [...anterior.siempre, nodo] };
      reproducirTono('connect');
    } else if (crea.tipo === 'orden') {
      const orden: NodoOrden = { tipo: 'orden', id, accion: crea.accion };
      if (zona.clase === 'siempre') {
        nuevo = { siempre: [...anterior.siempre, orden] };
        reproducirTono('select');
        // La orden en el tronco no es ilegal: es el error que el documento
        // quiere que se pueda cometer. Se deja puesta y Bit dice qué significa.
        hablar(LINEAS.fuera);
      } else {
        nuevo = ponerOrden(anterior, zona.nodoId, zona.clase === 'sino' ? 'sino' : 'cuerpo', orden);
        reproducirTono('connect');
        if (!sim.current.encajo) {
          sim.current.encajo = true;
          hablar(LINEAS.encajo);
        }
      }
    }

    setPrograma(nuevo);
    setElegida(null);
    avanzarProgreso(nuevo, vivo.current.reto, 0);
  };

  const tocar = (zona: ZonaDestino) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.corriendo) return;
    const elegidaViva = vivo.current.elegida;
    if (!elegidaViva) {
      hablar('Primero toca la pieza que quieres poner, y después toca aquí.');
      return;
    }
    soltar(zona, elegidaViva);
  };

  const elegir = (fichaId: string) => {
    if (vivo.current.terminado) return;
    const ficha = FICHAS_POR_ID.get(fichaId);
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
    avanzarProgreso(nuevo, vivo.current.reto, 0);
  };

  const leer = (nodoId: string) => {
    const texto = lecturaDe(vivo.current.programa, nodoId);
    if (texto) hablar(texto);
  };

  /* ── correr el programa ────────────────────────────────────────────────── */

  const cargar = (indice: number) => {
    const r = RETOS[indice];
    sim.current.encajo = indice === 0 ? sim.current.encajo : true;
    setReto(indice);
    setPrograma(r.arranque());
    setCategoria(r.categoria);
    setElegida(null);
    setActivo(null);
    setRespuesta(null);
    setPuntos(0);
    setVitrina(vitrinaDe(r.mundo));
    hablar(indice === 1 ? LINEAS.reto2 : LINEAS.reto3);
  };

  const juzgar = (salida: Ejecucion, indice: number) => {
    const r = RETOS[indice];
    sim.current.ocupado = false;
    setCorriendo(false);
    setActivo(null);
    setRespuesta(null);

    if (!r.exito(salida)) {
      restar();
      hablar(salida.fin === 'choque' ? FALLOS.choque : salida.vacios > 0 ? FALLOS.vacio : FALLOS.vueltas);
      setAviso('Míralo otra vez: ¿en qué casilla se atora?');
      timers.despues(() => {
        setAviso(null);
        setVitrina(vitrinaDe(RETOS[indice].mundo));
        setPuntos(0);
      }, 1600);
      return;
    }

    reproducirTono('complete');
    hablar(r.logro);
    avanzarProgreso(vivo.current.programa, indice, 1);
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
    const salida = simular(vivo.current.programa, r.mundo);
    const pasos = recortar(salida, indice);

    sim.current.ocupado = true;
    reproducirTono('power');
    setElegida(null);
    setCorriendo(true);
    setPuntos(0);
    setVitrina({ ...vitrinaDe(r.mundo), corriendo: true });

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
          paredArriba: r.mundo.paredArriba,
          corriendo: true,
          celebra: paso.efecto.tipo === 'recoge',
        });
        if (paso.efecto.tipo === 'recoge') reproducirTono('correct');
        if (paso.efecto.tipo === 'choca') reproducirTono('error');
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
    setPuntos(0);
    setVitrina(vitrinaDe(RETOS[vivo.current.reto].mundo));
  };

  const repetir = () => {
    timers.limpiar();
    sim.current = { ocupado: false, errores: 0, inicio: Date.now(), nodos: 0, encajo: false };
    setReto(0);
    setPrograma(RETOS[0].arranque());
    setCategoria(RETOS[0].categoria);
    setElegida(null);
    setRebote(null);
    setActivo(null);
    setRespuesta(null);
    setCorriendo(false);
    setPuntos(0);
    setVitrina(vitrinaDe(RETOS[0].mundo));
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
  const monedasTotal = retoVivo.mundo.monedas.length;
  const recogidas = monedasTotal - vitrina.monedas.length;
  const paso = terminado ? TOTAL_PASOS : PREVIOS[reto] + hitosPrograma(programa, reto);

  const marcador = (
    <div className="bloques3d-marcador">
      <div className="bloques3d-marcador-caja">
        <span className="bloques3d-marcador-rot">RETO</span>
        <span className="bloques3d-marcador-num">
          <span key={reto} className="bloques3d-marcador-cifra">
            {reto + 1}
          </span>
          <i>/{RETOS.length}</i>
        </span>
      </div>
      <div className="bloques3d-marcador-caja">
        <span className="bloques3d-marcador-rot">MONEDAS</span>
        <span className="bloques3d-marcador-num">
          <span key={recogidas} className="bloques3d-marcador-cifra">
            {recogidas}
          </span>
          <i>/{monedasTotal}</i>
        </span>
      </div>
    </div>
  );

  const encargo = (
    <div className="bloques3d-encargo">
      <span className="bloques3d-encargo-num">{reto + 1}</span>
      <span className="bloques3d-encargo-texto">{retoVivo.encargo}</span>
    </div>
  );

  const editor = (
    <TecniaBloques
      reto={retoVivo.titulo}
      fichas={CATALOGO}
      categoria={categoria}
      categoriaPedida={corriendo || terminado ? null : retoVivo.pide(programa)}
      programa={programa}
      activo={activo}
      respuesta={respuesta}
      corriendo={corriendo}
      elegida={elegida}
      rebote={rebote}
      puntos={puntos}
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
      marcador={marcador}
      encargo={encargo}
    />
  );

  /* El respaldo sin WebGL monta el MISMO editor —es DOM puro, no necesita 3D— y
     cuenta con palabras lo que la vitrina enseña con el muñeco. Así el alumno
     sin aceleración no recibe una versión recortada: recibe la misma actividad
     con la vitrina narrada. */
  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">{retoVivo.encargo}</p>
      {editor}
      <p className="escena3d-respaldo-titulo">
        {`Casilla ${vitrina.casilla + 1} de ${TOTAL_CASILLAS} · quedan ${vitrina.monedas.length} monedas${
          vitrina.paredArriba ? ` · hay una pared después de la casilla ${CASILLA_PARED + 1}` : ''
        }`}
      </p>
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="Si pasa esto…"
      pasoEtiqueta="Paso"
      pasoActual={paso}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Monedas"
      marcadorValor={`${recogidas}/${monedasTotal}`}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      activa={!terminado}
      sinMostrador
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={<p className="gabinete-nota">El Laboratorio de Juegos · el programa decide · la vitrina obedece</p>}
      final={
        terminado
          ? {
              insigniaNombre: 'Maestro del si',
              insigniaEmoji: '🚦',
              titulo: '¡Tu programa ya decide solo!',
              detalle:
                'Metiste la acción dentro de la C, elegiste la pregunta que avisa de la pared y armaste los dos caminos del «si no». Eso que hiciste —mirar, preguntar y decidir— es lo que hace que un juego sea un juego y no una película.',
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

export default LabSiPasaEsto;
