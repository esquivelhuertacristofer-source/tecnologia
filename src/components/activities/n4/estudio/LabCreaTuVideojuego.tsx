'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { EstacionBloques3D } from './piezasN4U3';
import { CajaJuego3D, MandosFlecha3D, TableroReglas3D } from './piezasN4U3Caja';
import {
  META_PUNTOS,
  MS_POR_PULSO,
  mundoInicial,
  paso,
  reglaCuatroArmada,
  reglaDosArmada,
  reglaTresArmada,
  reglaUnoArmada,
  revisarFlechas,
  seMovioEnLasCuatro,
  sueltasEnElSiempre,
  type EventoJuego,
  type MundoJuego,
  type Tecla,
} from './motorJuego';
import {
  CATALOGO,
  FICHAS_JUEGO,
  FICHA_MOSTRAR,
  TecniaBloques,
  admite,
  fichasDeVariable,
  mapaDeFichas,
  type CategoriaBloque,
  type FichaPaleta,
  type ZonaDestino,
} from './tecniaBloques';
import type { NodoCuerpo, NodoOrden, NodoSi, Pregunta, Programa } from './programaBloques';

/**
 * N4·U3 parada 3 · «Crea tu videojuego» (documento §25.3).
 *
 * El final de la unidad y la única actividad de la plataforma que no se puede
 * aprobar programando: hay que JUGAR. Cuatro reglas se arman con bloques, y
 * cuando las cuatro están puestas Bit cede el mando y el alumno tiene que llegar
 * a cinco puntos esquivando al enemigo. Si no gana la partida, no hay insignia.
 *
 * ── POR QUÉ ESTA MESA NO SE PARECE A LAS DOS ANTERIORES ─────────────────────
 * En las paradas 1 y 2 el alumno escribía un programa, apretaba ▶ y MIRABA una
 * película: `simular()` calculaba los pasos de principio a fin y la vitrina los
 * reproducía. Aquí no hay película que calcular, porque lo que va a pasar
 * depende de una flecha que todavía no se ha apretado. El mundo late solo, a
 * `MS_POR_PULSO`, y cada latido corre el cuerpo del `por siempre` UNA vez con
 * las teclas de ese instante (`motorJuego.paso`). Por eso la vitrina se cambia
 * por la caja del juego y aparecen los cuatro botones-flecha en el faldón.
 *
 * Y por eso el ▶ y el ⏹ del editor ya no son «corre / no corre» sino «sigue /
 * pausa», como el banderín verde y el octógono rojo de un editor de bloques de
 * verdad: el juego está vivo desde el primer segundo y lo que hacen esos dos
 * botones es congelarlo para poder mirar los bloques con calma.
 *
 * ── LAS CUATRO REGLAS ───────────────────────────────────────────────────────
 *   1 · MOVERSE — Bit deja armada de ejemplo `si ¿flecha derecha? entonces
 *       mover a la derecha` y el alumno construye las OTRAS TRES enteras. No se
 *       cierra por tener la forma bien: se cierra cuando el mundo registra que
 *       el muñeco se movió en las cuatro direcciones. La forma sola no bastaría
 *       —cuatro órdenes sueltas en el tronco también encienden las cuatro
 *       banderas— y el mundo solo tampoco: quien mete `mover a la derecha` en la
 *       C de la flecha de arriba también mueve al muñeco. Hacen falta las dos.
 *   2 · PUNTOS — `sumar 1 a puntos` y `esconder la moneda` dentro de la MISMA C
 *       de `¿tocando la moneda?`. Si falta el esconder, el motor no interviene:
 *       la moneda se queda en el suelo y el marcador se dispara a dieciséis por
 *       segundo. Bit no avisa antes; espera a que se vea y entonces lee la cifra
 *       en voz alta. El error se cobra viéndolo.
 *   3 · ENEMIGO — `volver al inicio` dentro de `¿tocando al enemigo?`. Se cierra
 *       cuando el enemigo te atrapa de verdad al menos una vez. No cuesta
 *       puntos: cuesta camino.
 *   4 · GANAR — `mostrar ¡GANASTE!` y `detener el juego` dentro de `¿puntos =
 *       5?`. El único reto sin una sola ayuda, y el único que se da por bueno
 *       por la FORMA: su prueba es la partida que viene después.
 *
 * ── LA CAJITA VIENE HECHA ───────────────────────────────────────────────────
 * A diferencia de la parada 2, aquí no hay bautizo: `puntos` ya existe y sus
 * piezas están en la paleta desde el principio. Por eso este laboratorio NO le
 * pasa la prop `variable` al editor, y el botón «+ Nueva variable» ni aparece.
 * Bautizar ya se aprendió; repetirlo aquí sería peaje, no clase.
 *
 * Falta a propósito el `poner puntos en cero`: en un juego que late dieciséis
 * veces por segundo, un `poner en cero` dentro del bucle es el mismo error que
 * la parada 2 ya enseñó, y quien lo pusiera aquí no aprendería nada nuevo, sólo
 * se atascaría. Quien pone los puntos a cero al empezar cada prueba es la mesa.
 *
 * ── EL BANCO DE PRUEBAS SE REPONE ───────────────────────────────────────────
 * Al cerrar cada regla el mundo vuelve a empezar: cinco monedas, marcador en
 * cero, muñeco en la salida. No es cosmética. Sin reponer, un alumno que llegase
 * a cinco puntos mientras arma la regla cuatro vería encenderse el ¡GANASTE! en
 * el instante de soltar el último bloque, y se quedaría sin la partida que es el
 * corazón de la parada.
 */

/* ── lo que dice Bit ───────────────────────────────────────────────────────── */

/** Las siete líneas del documento §25.3, palabra por palabra. */
const LINEAS = {
  inicio: 'Llegó el día: vas a hacer tu videojuego. Cuatro reglas y a jugar.',
  mueve: '¡Ya se mueve! Pruébalo con las flechas.',
  prueba: 'Prueba cada regla en cuanto la termines. Así sabes cuál falló.',
  punto: '¡Ganaste un punto! Mira el marcador.',
  atrapo: 'Ay, te atrapó. Bueno… ¡para eso está el enemigo!',
  falta: 'Solo falta decirle cómo se gana. ¿Cuántos puntos hacen falta?',
  fin: '¡Es tuyo! Tú lo programaste, tú lo ganaste. Qué orgullo.',
};

/**
 * Lo que se dice al entrar en cada fase.
 *
 * La cuarta es `LINEAS.falta` y la quinta es la cesión del mando del documento:
 * «Ahora juégalo.» Ninguna adelanta la solución; dicen qué falta, no dónde va.
 */
const ENTRADAS = [
  LINEAS.inicio,
  'Ya se mueve. Ahora que valga la pena: haz que las monedas den puntos.',
  'Ese que patrulla en el medio no es adorno. Dile al juego qué pasa si te toca.',
  LINEAS.falta,
  'Ahora juégalo. Cinco monedas, y el enemigo en medio. Suerte.',
];

/**
 * Los avisos de encaje y de colocación.
 *
 * El de la pieza suelta en el tronco no riñe: describe lo que va a pasar y deja
 * que pase. Un `mover a la derecha` colgando del `por siempre` hace que el
 * muñeco corra solo sin que nadie apriete nada, y eso se ve en la caja mucho
 * mejor de lo que se explica.
 */
const AVISOS = {
  suelta: 'Ahí suelto se hace en cada vuelta, apriete quien apriete. Míralo y decide dónde va.',
  preguntaSuelta: 'Una pregunta no se hace sola: va dentro del hueco del bloque «si».',
  ordenEnHueco: 'Eso es una orden, no una pregunta. En el hueco sólo entra algo que se conteste sí o no.',
  reporteroEnHueco: 'El óvalo contesta un número, no un sí o un no. En el hueco no cabe.',
  reporteroSuelto: 'El óvalo no se programa: está para mirar cuánto vale la cajita ahora mismo.',
  cDentroDeC: 'Los bloques con boca van en el tronco del programa, no dentro de otro.',
  primeraVez: 'Primero toca la pieza que quieres poner, y después toca aquí.',
};

/** Cómo se cuenta a dónde se fue el muñeco cuando la pareja está cruzada. */
const RUMBO: Record<Tecla, string> = {
  derecha: 'de lado',
  izquierda: 'de lado',
  arriba: 'para arriba',
  abajo: 'para abajo',
};

/* ── las cuatro reglas y la partida ────────────────────────────────────────── */

/** Los rótulos del tablero de reglas del faldón. Cuatro, como manda §25.3. */
const REGLAS = ['MOVERSE', 'PUNTOS', 'ENEMIGO', 'GANAR'] as const;

/** Lo que pide la placa del encargo en cada fase. La quinta ya no es una regla. */
const ENCARGOS = [
  'Que el muñeco se mueva con las cuatro flechas.',
  'Que cada moneda dé un punto y desaparezca.',
  'Que el enemigo te devuelva a la salida.',
  'Que al llegar a la meta diga ¡GANASTE! y se detenga.',
  'Ahora juégalo: junta las cinco monedas sin que te atrape.',
];

/** La fase en la que ya no se programa: se juega. */
export const FASE_PARTIDA = 4;

export const TOTAL_PASOS = 20;

/**
 * Hitos ya ganados al empezar cada fase.
 *
 * Cada tramo es lo que se puede hacer dentro de la fase más el punto de
 * cerrarla: 3+1 la primera, 3+1 la segunda, 2+1 la tercera, 3+1 la cuarta, y la
 * partida vale los cinco puntos que hay que juntar.
 */
export const PREVIOS = [0, 4, 8, 11, 15];

/* ── la paleta ─────────────────────────────────────────────────────────────── */

function fichaDelCatalogo(id: string): FichaPaleta {
  const ficha = CATALOGO.find((f) => f.id === id);
  if (!ficha) throw new Error(`falta la ficha «${id}» en el catálogo de bloques`);
  return ficha;
}

/**
 * Las dieciséis piezas en juego, en el orden en que se ven.
 *
 * El orden importa: la pantalla pinta cada categoría en el orden del array. La C
 * de `si` va la primera de Control porque es la pieza con la que empieza toda
 * regla, y el `¿puntos = 5?` va el último de Sensores porque es el que cierra.
 *
 * `FICHAS_JUEGO` no trae ni la C ni el `¿tocando la moneda?` —son del catálogo
 * de las paradas 1 y 2, y allí siguen— así que la paleta se compone de las tres
 * fuentes. Sin esas dos prestadas, las reglas uno y dos no se podrían armar.
 */
const PALETA: FichaPaleta[] = [
  ...FICHAS_JUEGO.filter((f) => f.categoria === 'movimiento'),
  fichaDelCatalogo('si'),
  ...FICHAS_JUEGO.filter((f) => f.categoria === 'control'),
  ...FICHAS_JUEGO.filter((f) => f.categoria === 'sensores' && f.id.startsWith('flecha')),
  fichaDelCatalogo('toca-moneda'),
  ...FICHAS_JUEGO.filter((f) => f.id === 'toca-enemigo'),
  // La cajita viene hecha y se llama `puntos`. El `poner en cero` se queda fuera
  // a propósito: ver el docblock de arriba.
  ...fichasDeVariable('puntos', META_PUNTOS).filter((f) => f.id !== 'var:poner-cero'),
  FICHA_MOSTRAR,
];

const PALETA_POR_ID = mapaDeFichas(PALETA);

/* ── el programa que Bit deja armado ───────────────────────────────────────── */

/**
 * La regla uno, a medias.
 *
 * Sin `inicio`: en un videojuego el arranque no decide nada —lo que manda es lo
 * que pasa en cada vuelta— y el editor sólo dibuja esa zona si el programa la
 * trae. Al no traerla, la pieza no se puede soltar donde no serviría de nada, y
 * no hace falta ningún aviso que lo explique.
 */
function arranque(): Programa {
  return {
    siempre: [
      {
        tipo: 'si',
        id: 'ej-si',
        condicion: { id: 'ej-cond', pregunta: 'flecha-derecha' },
        cuerpo: [{ tipo: 'orden', id: 'ej-mov', accion: 'mover-derecha' }],
      },
    ],
  };
}

/* ── edición del árbol ─────────────────────────────────────────────────────── */

/** Los bloques con boca del tronco. */
type NodoC = Exclude<NodoCuerpo, NodoOrden>;

/** El programa de esta parada es sólo su tronco: no hay zona de arranque. */
function conSiempre(siempre: NodoCuerpo[]): Programa {
  return { siempre };
}

function ponerCondicion(programa: Programa, nodoId: string, id: string, pregunta: Pregunta): Programa {
  return conSiempre(
    programa.siempre.map((nodo) => {
      if (nodo.id !== nodoId) return nodo;
      if (nodo.tipo === 'si') return { ...nodo, condicion: { id, pregunta } };
      if (nodo.tipo === 'sino') return { ...nodo, condicion: { id, pregunta } };
      return nodo;
    }),
  );
}

function ponerOrden(programa: Programa, nodoId: string, rama: 'cuerpo' | 'sino', orden: NodoOrden): Programa {
  return conSiempre(
    programa.siempre.map((nodo) => {
      if (nodo.id !== nodoId) return nodo;
      if (nodo.tipo === 'si') return rama === 'cuerpo' ? { ...nodo, cuerpo: [...nodo.cuerpo, orden] } : nodo;
      if (nodo.tipo === 'sino') {
        return rama === 'cuerpo'
          ? { ...nodo, cuerpo: [...nodo.cuerpo, orden] }
          : { ...nodo, sino: [...nodo.sino, orden] };
      }
      return nodo;
    }),
  );
}

function quitarCondicion(programa: Programa, nodoId: string): Programa {
  return conSiempre(
    programa.siempre.map((nodo) => {
      if (nodo.id !== nodoId) return nodo;
      if (nodo.tipo === 'si') return { ...nodo, condicion: null };
      if (nodo.tipo === 'sino') return { ...nodo, condicion: null };
      return nodo;
    }),
  );
}

function quitarNodo(programa: Programa, nodoId: string): Programa {
  return conSiempre(
    programa.siempre
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
  );
}

/** Lo que Bit lee de un bloque ya puesto: la misma frase que trae su ficha. */
function lecturaDe(programa: Programa, nodoId: string): string | null {
  for (const nodo of programa.siempre) {
    if (nodo.tipo === 'orden') {
      if (nodo.id !== nodoId) continue;
      const ficha = PALETA.find((f) => f.crea?.tipo === 'orden' && f.crea.accion === nodo.accion);
      return ficha?.lectura ?? null;
    }
    for (const orden of cuerpoDe(nodo)) {
      if (orden.id !== nodoId) continue;
      const ficha = PALETA.find((f) => f.crea?.tipo === 'orden' && f.crea.accion === orden.accion);
      return ficha?.lectura ?? null;
    }
    if (nodo.id === nodoId) {
      const ficha = PALETA.find((f) => f.crea?.tipo === (nodo.tipo === 'si' ? 'si' : 'sino'));
      return ficha?.lectura ?? null;
    }
    if (nodo.condicion && `cond:${nodo.id}` === nodoId) {
      const pregunta = nodo.condicion.pregunta;
      const ficha = PALETA.find((f) => f.crea?.tipo === 'condicion' && f.crea.pregunta === pregunta);
      return ficha?.lectura ?? null;
    }
  }
  return null;
}

/* ── leer la forma del programa ────────────────────────────────────────────── */

function cuerpoDe(nodo: NodoC): NodoOrden[] {
  return nodo.tipo === 'sino' ? [...nodo.cuerpo, ...nodo.sino] : nodo.cuerpo;
}

function cesDe(programa: Programa): NodoC[] {
  return programa.siempre.filter((nodo): nodo is NodoC => nodo.tipo !== 'orden');
}

function buscaC(programa: Programa, pregunta: Pregunta): NodoC | null {
  return cesDe(programa).find((c) => c.condicion?.pregunta === pregunta) ?? null;
}

const PREGUNTAS_FLECHA: Pregunta[] = ['flecha-derecha', 'flecha-izquierda', 'flecha-arriba', 'flecha-abajo'];

/** Cuánto lleva hecho de una C concreta: la C, más cada orden que le toca. */
function hitosDeC(programa: Programa, pregunta: Pregunta, acciones: NodoOrden['accion'][]): number {
  const c = buscaC(programa, pregunta);
  if (!c) return 0;
  const cuerpo = cuerpoDe(c);
  return 1 + acciones.filter((a) => cuerpo.some((h) => h.accion === a)).length;
}

/**
 * Los hitos de la fase en curso, leídos del propio programa.
 *
 * La primera resta uno porque la C de ejemplo la puso Bit: contarla sería
 * regalarle al alumno un paso que no dio.
 */
export function hitosFase(programa: Programa, fase: number, puntos: number): number {
  if (fase === 0) {
    const buenas = revisarFlechas(programa).filter((p) => p.ok).length;
    return Math.max(0, Math.min(3, buenas - 1));
  }
  if (fase === 1) return hitosDeC(programa, 'tocando-moneda', ['sumar', 'esconder-moneda']);
  if (fase === 2) return hitosDeC(programa, 'tocando-enemigo', ['volver-inicio']);
  if (fase === 3) return hitosDeC(programa, 'puntos-igual-meta', ['mostrar', 'detener-juego']);
  return Math.min(META_PUNTOS, puntos);
}

/**
 * Qué columna de la paleta late, para que la pieza que falta se pueda encontrar.
 *
 * Señala la CATEGORÍA, nunca la pieza: decir «Control» es decir dónde buscar;
 * encender la ficha exacta sería resolverlo. Y sigue el orden natural de armar
 * una regla —primero la C, luego su pregunta, luego lo que abraza— porque es el
 * orden en el que se atasca quien se atasca.
 */
export function pideCategoria(programa: Programa, fase: number): CategoriaBloque | null {
  if (fase >= FASE_PARTIDA) return null;

  const ces = cesDe(programa);
  const huerfana = ces.find((c) => !c.condicion);

  if (fase === 0) {
    if (huerfana) return 'sensores';
    const sinMovimiento = ces.find(
      (c) => c.condicion && PREGUNTAS_FLECHA.includes(c.condicion.pregunta) && cuerpoDe(c).length === 0,
    );
    if (sinMovimiento) return 'movimiento';
    return revisarFlechas(programa).filter((p) => p.ok).length < 4 ? 'control' : null;
  }

  const pregunta: Pregunta =
    fase === 1 ? 'tocando-moneda' : fase === 2 ? 'tocando-enemigo' : 'puntos-igual-meta';
  const c = buscaC(programa, pregunta);
  if (!c) return huerfana ? 'sensores' : 'control';

  const cuerpo = cuerpoDe(c);
  const tiene = (a: NodoOrden['accion']) => cuerpo.some((h) => h.accion === a);
  if (fase === 1) {
    if (!tiene('sumar')) return 'variables';
    if (!tiene('esconder-moneda')) return 'movimiento';
    return null;
  }
  if (fase === 2) return tiene('volver-inicio') ? null : 'movimiento';
  if (!tiene('mostrar')) return 'variables';
  if (!tiene('detener-juego')) return 'control';
  return null;
}

function formatTiempo(segundos: number): string {
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;
}

/* ── el laboratorio ────────────────────────────────────────────────────────── */

export function LabCreaTuVideojuego(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState(0);
  const [programa, setPrograma] = useState<Programa>(arranque);
  const [categoria, setCategoria] = useState<CategoriaBloque>('control');
  const [elegida, setElegida] = useState<string | null>(null);
  const [rebote, setRebote] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  /** El ▶ y el ⏹ del editor: pausa del mundo, no arranque de una simulación. */
  const [corriendo, setCorriendo] = useState(true);
  const [puntos, setPuntos] = useState(0);
  const [letrero, setLetrero] = useState(false);
  const [gano, setGano] = useState(false);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  /**
   * El mundo vive en una ref y NO en el estado.
   *
   * Late dieciséis veces por segundo y lo dibuja three, no el DOM: meterlo en
   * `useState` sería pedirle a React dieciséis renders por segundo del editor
   * entero para animar algo que React no pinta. Las piezas 3D leen `.current`
   * dentro de su `useFrame`. A React sólo suben los cambios que sí se ven en la
   * interfaz: el marcador, el letrero y el cambio de fase.
   */
  const mundoRef = useRef<MundoJuego>(mundoInicial());
  const teclasRef = useRef<Record<Tecla, boolean>>({
    derecha: false,
    izquierda: false,
    arriba: false,
    abajo: false,
  });

  const sim = useRef({
    errores: 0,
    inicio: 0,
    nodos: 0,
    /** Pulsos seguidos sumando sin esconder: el marcador desbocado de §25.3. */
    seguidas: 0,
    ultimoTono: 0,
    vioPunto: false,
    dijoMueve: false,
    dijoPrueba: false,
    dijoDesbocado: false,
    dijoSuelta: false,
    avisadas: new Set<Tecla>(),
  });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, fase, programa, elegida, corriendo });
  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, fase, programa, elegida, corriendo };
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

  const avisar = (texto: string) => {
    setAviso(texto);
    timers.despues(() => setAviso(null), 3200);
  };

  const avanzarProgreso = (nuevo: Programa, indice: number, marcador: number) => {
    const hechos = PREVIOS[indice] + hitosFase(nuevo, indice, marcador);
    propsRef.current.onProgress(Math.min(1, hechos / TOTAL_PASOS));
  };

  const terminar = () => {
    const tiempoSegundos = Math.max(1, Math.round((Date.now() - sim.current.inicio) / 1000));
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
    setGano(true);
    setTerminado(true);
  };

  /* ── el banco de pruebas ───────────────────────────────────────────────────
     Reponer entre reglas no es cosmética: sin esto, quien junta cinco monedas
     mientras arma la regla cuatro ve el ¡GANASTE! al soltar el último bloque y
     se queda sin la partida, que es lo que esta parada viene a pedir. */

  const reponerMundo = () => {
    mundoRef.current = mundoInicial();
    sim.current.seguidas = 0;
    sim.current.vioPunto = false;
    sim.current.dijoDesbocado = false;
    setPuntos(0);
    setLetrero(false);
  };

  const pasarA = (siguiente: number) => {
    vivo.current.fase = siguiente;
    setFase(siguiente);
    setCategoria(pideCategoria(vivo.current.programa, siguiente) ?? 'control');
    reponerMundo();
    propsRef.current.onProgress(Math.min(1, PREVIOS[siguiente] / TOTAL_PASOS));
    timers.despues(() => hablar(ENTRADAS[siguiente]), 2200);
    if (!sim.current.dijoPrueba) {
      sim.current.dijoPrueba = true;
      timers.despues(() => hablar(LINEAS.prueba), 4600);
    }
  };

  /* ── el latido ─────────────────────────────────────────────────────────────
     Un solo intervalo para toda la actividad. Ni se recrea al cambiar de fase
     ni depende de nada: lee todo de `vivo.current`, que se refresca en cada
     render. Recrearlo daría un mundo que se salta un pulso cada vez que el
     alumno toca una pieza. */

  const atender = (eventos: EventoJuego[], mundo: MundoJuego) => {
    let sonoAlgo = false;

    for (const evento of eventos) {
      if (evento.tipo === 'esconde') {
        reproducirTono('select');
        sonoAlgo = true;
      }
      if (evento.tipo === 'atrapa') {
        reproducirTono('close');
        sonoAlgo = true;
      }
      if (evento.tipo === 'letrero') setLetrero(true);
    }

    const sumo = eventos.some((e) => e.tipo === 'suma');
    const escondio = eventos.some((e) => e.tipo === 'esconde');
    if (sumo) {
      setPuntos(mundo.puntos);
      // A dieciséis pulsos por segundo, un marcador desbocado sonaría dieciséis
      // veces por segundo. El tono se racionaliza; el número, no: ése tiene que
      // dispararse a la vista de todos, que para eso está.
      if (!sonoAlgo && Date.now() - sim.current.ultimoTono > 180) {
        sim.current.ultimoTono = Date.now();
        reproducirTono('select');
      }
    }
    if (sumo && escondio) sim.current.vioPunto = true;

    sim.current.seguidas = sumo && !escondio ? sim.current.seguidas + 1 : 0;
    if (sim.current.seguidas >= 12 && !sim.current.dijoDesbocado) {
      sim.current.dijoDesbocado = true;
      hablar(`Una moneda y el tablero va en ${mundo.puntos}. La moneda sigue ahí abajo.`);
    }
  };

  const revisarCierre = (mundo: MundoJuego, actual: Programa) => {
    const v = vivo.current;
    if (v.terminado) return;

    if (v.fase === 0) {
      if (!reglaUnoArmada(actual)) return;
      if (!sim.current.dijoMueve) {
        sim.current.dijoMueve = true;
        hablar(LINEAS.mueve);
      }
      if (seMovioEnLasCuatro(mundo)) {
        reproducirTono('complete');
        pasarA(1);
      }
      return;
    }
    if (v.fase === 1) {
      if (reglaDosArmada(actual) && sim.current.vioPunto) {
        reproducirTono('complete');
        hablar(LINEAS.punto);
        pasarA(2);
      }
      return;
    }
    if (v.fase === 2) {
      if (reglaTresArmada(actual) && mundo.capturas >= 1) {
        reproducirTono('complete');
        hablar(LINEAS.atrapo);
        pasarA(3);
      }
      return;
    }
    if (v.fase === 3) {
      // La única regla que se da por buena por la forma. Su prueba es la
      // partida: si está mal armada, el juego no se detiene nunca y no hay
      // insignia. Comprobarla aquí con el mundo obligaría a llegar a cinco
      // puntos dos veces, y la primera sería sin haber cedido el mando.
      if (reglaCuatroArmada(actual)) {
        reproducirTono('complete');
        pasarA(FASE_PARTIDA);
      }
      return;
    }
    if (mundo.detenido && mundo.letrero) terminar();
  };

  useEffect(() => {
    const id = window.setInterval(() => {
      const v = vivo.current;
      if (v.terminado || !v.corriendo) return;
      const teclas = (Object.keys(teclasRef.current) as Tecla[]).filter((t) => teclasRef.current[t]);
      const salida = paso(mundoRef.current, v.programa, teclas);
      mundoRef.current = salida.mundo;
      if (salida.eventos.length > 0) atender(salida.eventos, salida.mundo);
      if (v.fase === FASE_PARTIDA) avanzarProgreso(v.programa, FASE_PARTIDA, salida.mundo.puntos);
      revisarCierre(salida.mundo, v.programa);
    }, MS_POR_PULSO);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * El mismo juicio, con el juego en pausa.
   *
   * Sin esto, quien aprieta ⏹ para colocar el último bloque con calma se queda
   * mirando una regla terminada que no se cierra nunca, porque el latido —que es
   * quien juzga— no está corriendo.
   */
  useEffect(() => {
    revisarCierre(mundoRef.current, programa);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programa]);

  /* ── las flechas ───────────────────────────────────────────────────────────
     El teclado y los cuatro botones del faldón hacen exactamente lo mismo y
     escriben en la misma ref, como pide §25.3. */

  const apretar = (tecla: Tecla) => {
    teclasRef.current[tecla] = true;
    const v = vivo.current;
    if (v.fase !== 0 || v.terminado) return;
    // El error que el mundo no puede cazar: la C de la flecha de arriba con el
    // movimiento de al lado mueve al muñeco igual. Sólo mirando la forma se
    // puede decir la frase del documento.
    const pareja = revisarFlechas(v.programa).find((p) => p.tecla === tecla);
    if (!pareja || pareja.ok || !pareja.puesto || sim.current.avisadas.has(tecla)) return;
    sim.current.avisadas.add(tecla);
    restar();
    hablar(`Apretaste ${tecla} y se fue ${RUMBO[pareja.puesto]}. Mira qué pieza pusiste dentro de esa C.`);
  };

  const soltarTecla = (tecla: Tecla) => {
    teclasRef.current[tecla] = false;
  };

  useEffect(() => {
    const MAPA: Record<string, Tecla> = {
      ArrowRight: 'derecha',
      ArrowLeft: 'izquierda',
      ArrowUp: 'arriba',
      ArrowDown: 'abajo',
    };
    const abajo = (evento: KeyboardEvent) => {
      const tecla = MAPA[evento.key];
      if (!tecla) return;
      // Sin esto, las flechas pasean la página mientras el niño juega.
      evento.preventDefault();
      if (!evento.repeat) apretar(tecla);
    };
    const arriba = (evento: KeyboardEvent) => {
      const tecla = MAPA[evento.key];
      if (!tecla) return;
      evento.preventDefault();
      soltarTecla(tecla);
    };
    window.addEventListener('keydown', abajo);
    window.addEventListener('keyup', arriba);
    return () => {
      window.removeEventListener('keydown', abajo);
      window.removeEventListener('keyup', arriba);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── el editor de bloques ──────────────────────────────────────────────── */

  const elegir = (fichaId: string) => {
    if (vivo.current.terminado) return;
    const ficha = PALETA_POR_ID.get(fichaId);
    if (!ficha) return;
    reproducirTono('select');
    setElegida(fichaId);
    hablar(ficha.lectura);
  };

  const soltar = (zona: ZonaDestino, fichaId: string) => {
    const v = vivo.current;
    if (v.terminado) return;
    const crea = PALETA_POR_ID.get(fichaId)?.crea ?? null;

    if (!admite(zona.clase, crea)) {
      restar();
      temblar(`${zona.clase}:${zona.nodoId}`);
      setElegida(null);
      if (!crea) {
        avisar(zona.clase === 'hueco' ? AVISOS.reporteroEnHueco : AVISOS.reporteroSuelto);
      } else if (zona.clase === 'hueco') {
        avisar(crea.tipo === 'orden' ? AVISOS.ordenEnHueco : AVISOS.cDentroDeC);
      } else if (crea.tipo === 'condicion') {
        avisar(AVISOS.preguntaSuelta);
      } else {
        avisar(AVISOS.cDentroDeC);
      }
      return;
    }
    if (!crea) return;

    sim.current.nodos += 1;
    const id = `p${sim.current.nodos}`;
    let nuevo = v.programa;

    if (zona.clase === 'hueco' && crea.tipo === 'condicion') {
      nuevo = ponerCondicion(v.programa, zona.nodoId, id, crea.pregunta);
    } else if (crea.tipo === 'si') {
      const nodo: NodoSi = { tipo: 'si', id, condicion: null, cuerpo: [] };
      nuevo = conSiempre([...v.programa.siempre, nodo]);
    } else if (crea.tipo === 'sino') {
      nuevo = conSiempre([...v.programa.siempre, { tipo: 'sino', id, condicion: null, cuerpo: [], sino: [] }]);
    } else if (crea.tipo === 'orden') {
      const orden: NodoOrden = { tipo: 'orden', id, accion: crea.accion };
      if (zona.clase === 'siempre') {
        nuevo = conSiempre([...v.programa.siempre, orden]);
      } else {
        nuevo = ponerOrden(v.programa, zona.nodoId, zona.clase === 'sino' ? 'sino' : 'cuerpo', orden);
      }
    }

    reproducirTono('select');
    setPrograma(nuevo);
    setElegida(null);
    // Una pieza suelta en el tronco es legal y a veces es lo que se quiere. Bit
    // no la corrige: cuenta qué va a pasar y deja que se vea en la caja.
    if (sueltasEnElSiempre(nuevo).length > sueltasEnElSiempre(v.programa).length && !sim.current.dijoSuelta) {
      sim.current.dijoSuelta = true;
      hablar(AVISOS.suelta);
    }
    setCategoria(pideCategoria(nuevo, v.fase) ?? categoria);
    avanzarProgreso(nuevo, v.fase, mundoRef.current.puntos);
  };

  const tocar = (zona: ZonaDestino) => {
    const v = vivo.current;
    if (v.terminado) return;
    if (!v.elegida) {
      hablar(AVISOS.primeraVez);
      return;
    }
    soltar(zona, v.elegida);
  };

  const quitar = (nodoId: string) => {
    const v = vivo.current;
    if (v.terminado) return;
    reproducirTono('close');
    const nuevo = nodoId.startsWith('cond:')
      ? quitarCondicion(v.programa, nodoId.slice(5))
      : quitarNodo(v.programa, nodoId);
    setPrograma(nuevo);
    setCategoria(pideCategoria(nuevo, v.fase) ?? categoria);
    avanzarProgreso(nuevo, v.fase, mundoRef.current.puntos);
  };

  const leer = (nodoId: string) => {
    const texto = lecturaDe(vivo.current.programa, nodoId);
    if (texto) hablar(texto);
  };

  const correr = () => {
    reproducirTono('select');
    setCorriendo(true);
    hablar('El juego sigue corriendo.');
  };

  const parar = () => {
    reproducirTono('close');
    setCorriendo(false);
    hablar('Juego en pausa. Los bloques se pueden mover con calma.');
  };

  const leerVariable = () => {
    hablar(`La cajita puntos guarda ${mundoRef.current.puntos} ahora mismo.`);
  };

  const repetir = () => {
    timers.limpiar();
    sim.current = {
      errores: 0,
      inicio: Date.now(),
      nodos: 0,
      seguidas: 0,
      ultimoTono: 0,
      vioPunto: false,
      dijoMueve: false,
      dijoPrueba: false,
      dijoDesbocado: false,
      dijoSuelta: false,
      avisadas: new Set<Tecla>(),
    };
    teclasRef.current = { derecha: false, izquierda: false, arriba: false, abajo: false };
    reponerMundo();
    setPrograma(arranque());
    setFase(0);
    vivo.current.fase = 0;
    setCategoria('control');
    setElegida(null);
    setRebote(null);
    setAviso(null);
    setCorriendo(true);
    setGano(false);
    setTerminado(false);
    propsRef.current.onProgress(0);
    hablar(LINEAS.inicio);
  };

  /* ── la mesa ───────────────────────────────────────────────────────────── */

  const hechos = PREVIOS[fase] + hitosFase(programa, fase, puntos);

  const encargo = (
    <div className="bloques3d-encargo">
      <span className="bloques3d-encargo-num">{fase + 1}</span>
      <span className="bloques3d-encargo-texto">{ENCARGOS[fase]}</span>
    </div>
  );

  const editor = (
    <TecniaBloques
      reto={fase < FASE_PARTIDA ? `Regla ${fase + 1} · ${REGLAS[fase].toLowerCase()}` : 'La partida'}
      fichas={PALETA}
      categoria={categoria}
      categoriaPedida={terminado ? null : pideCategoria(programa, fase)}
      programa={programa}
      // Nada de resaltar el bloque en curso: a dieciséis pulsos por segundo el
      // lienzo entero se pondría a parpadear y no se podría ni leer.
      activo={null}
      respuesta={null}
      corriendo={corriendo}
      elegida={elegida}
      rebote={rebote}
      puntos={puntos}
      archivo="mi videojuego"
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
      pantalla={editor}
      caja={
        <>
          <CajaJuego3D
            mundoRef={mundoRef}
            corriendo={corriendo && !terminado}
            ganada={letrero || gano}
            reduceMotion={reduceMotion}
          />
          <MandosFlecha3D
            teclasRef={teclasRef}
            onApretar={apretar}
            onSoltar={soltarTecla}
            reduceMotion={reduceMotion}
          />
          <TableroReglas3D
            reglas={REGLAS.map((titulo, i) => ({ titulo, hecha: i < fase }))}
            actual={fase}
          />
        </>
      }
      puntos={{
        nombre: 'puntos',
        valor: puntos,
        meta: META_PUNTOS,
        corriendo: corriendo && !terminado,
        onLeer: leerVariable,
        reduceMotion,
      }}
      encargo={encargo}
    />
  );

  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">{ENCARGOS[fase]}</p>
      {editor}
      <p className="escena3d-respaldo-titulo">
        {`puntos ${puntos} de ${META_PUNTOS} · reglas hechas ${Math.min(fase, REGLAS.length)} de ${REGLAS.length}`}
      </p>
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="Crea tu videojuego"
      pasoEtiqueta="Paso"
      pasoActual={Math.min(TOTAL_PASOS, terminado ? TOTAL_PASOS : hechos)}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="puntos"
      marcadorValor={`${puntos}/${META_PUNTOS}`}
      bit={linea}
      paleta={{ acento: '#FB923C', acento2: '#22D3EE' }}
      activa={!terminado}
      sinMostrador
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={
        <p className="gabinete-nota">
          El Laboratorio de Juegos · cuatro reglas · y la partida la juegas tú
        </p>
      }
      final={
        terminado
          ? {
              insigniaNombre: 'Creador de juegos',
              insigniaEmoji: '🎮',
              titulo: '¡Es tuyo!',
              detalle:
                'Cuatro reglas puestas por ti y una partida ganada de verdad. Eso ya no es un ejercicio: es un videojuego.',
              resumen: [
                { etiqueta: 'Reglas', valor: `${REGLAS.length}` },
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
