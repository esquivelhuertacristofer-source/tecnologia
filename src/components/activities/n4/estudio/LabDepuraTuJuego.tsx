'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { EstacionBloques3D } from './piezasN4U3';
import {
  CajaJuego3D,
  CuadernoSintomas3D,
  LupaCaza3D,
  MandosFlecha3D,
  PalancaProbar3D,
  PlacaCaminaSolo3D,
  type HojaSintomas,
} from './piezasN4U3Caja';
import {
  META_PUNTOS,
  MS_POR_PULSO,
  PASOS_NORMALES,
  mundoInicial,
  paso,
  reglaDosArmada,
  reglaTresArmada,
  type EventoJuego,
  type MundoJuego,
  type Tecla,
} from './motorJuego';
import {
  CATALOGO,
  FICHAS_JUEGO,
  FICHA_MOSTRAR,
  TecniaBloques,
  fichasDeVariable,
  type FichaPaleta,
  type ModoCaza,
  type OpcionArreglo,
  type PanelArreglo,
} from './tecniaBloques';
import {
  ubicarAccion,
  type Accion,
  type NodoOrden,
  type NodoSi,
  type Pregunta,
  type Programa,
} from './programaBloques';

/**
 * N4·U3 parada 4 · «Depura tu juego» (documento §25.4).
 *
 * La única actividad de la unidad en la que el alumno NO escribe un programa:
 * hereda tres juegos ya armados y los tres están rotos. Se arreglan con el
 * método de tres pasos de la teórica —observa, acota, cambia una cosa y vuelve
 * a probar— y el laboratorio está construido para que ese método sea
 * obligatorio, no una recomendación.
 *
 * ── POR QUÉ NO HAY PALETA ───────────────────────────────────────────────────
 * En las paradas 1–3 la mitad izquierda del monitor era el cajón de piezas. Aquí
 * desaparece (prop `caza` de `tecniaBloques.tsx`) porque un cajón abierto invita
 * justo a lo contrario de lo que se enseña: a añadir cosas hasta que funcione.
 * El único gesto disponible es señalar UN bloque y cambiarlo por otro. Con la
 * lupa apagada, tocar un bloque es leerlo —Bit lo explica en voz alta—; con la
 * lupa encendida, tocarlo es acusarlo. Es la misma pieza con dos gestos, y ese
 * doble gesto ES la diferencia entre acotar y adivinar.
 *
 * ── POR QUÉ EL MOTOR NO AVISA DE NADA ───────────────────────────────────────
 * `motorJuego.paso()` obedece el programa roto sin quejarse: si el `sumar 1` está
 * fuera de la C, el marcador se dispara y no salta ninguna alarma. El bug se ve
 * porque el juego se porta mal, no porque un validador lo anuncie (decisión (D)
 * de §25.4-bis). Lo que este archivo tiene son DETECTORES —no validadores—: leen
 * el mundo pulso a pulso y sólo sirven para saber cuándo el alumno ya vio el
 * síntoma, para que Bit pueda nombrarlo en el instante en que ocurre delante de
 * sus ojos.
 *
 * ── EL MUEBLE ───────────────────────────────────────────────────────────────
 * Faldón de izquierda a derecha (px medidos sobre y −1.55, z 0.71): la lupa
 * (93–245), la placa del encargo (262–575), el cuaderno de síntomas (591–811),
 * los dos botones-flecha (837–1016) y la palanca de PROBAR (1031–1164). El
 * tablero de reglas de la parada 3 NO está: ocupa exactamente el hueco del
 * cuaderno, y aquí no hay reglas que construir sino síntomas que anotar.
 *
 * Sólo se ofrecen DOS flechas —derecha y arriba— porque con esas dos se alcanzan
 * las cinco monedas del campo y también al enemigo. Un botón que no hace falta
 * es una pista falsa, y en una actividad de depuración las pistas falsas son
 * exactamente lo que no se vale.
 */

/* ── las fichas, para que el programa heredado se lea igual que siempre ─────── */

function fichaDelCatalogo(id: string): FichaPaleta {
  const ficha = CATALOGO.find((f) => f.id === id);
  if (!ficha) throw new Error(`falta la ficha «${id}» en el catálogo de bloques`);
  return ficha;
}

/**
 * La misma paleta de la parada 3.
 *
 * Aquí NO se dibuja como cajón —el modo caza la esconde— pero sigue haciendo
 * falta: es de donde `TecniaBloques` saca la etiqueta, el color y la lectura de
 * cada bloque ya puesto. Sin ella los juegos heredados se verían como una pila
 * de cajas grises con un «¿?» dentro.
 */
const PALETA: FichaPaleta[] = [
  ...FICHAS_JUEGO.filter((f) => f.categoria === 'movimiento'),
  fichaDelCatalogo('si'),
  ...FICHAS_JUEGO.filter((f) => f.categoria === 'control'),
  ...FICHAS_JUEGO.filter((f) => f.categoria === 'sensores' && f.id.startsWith('flecha')),
  fichaDelCatalogo('toca-moneda'),
  ...FICHAS_JUEGO.filter((f) => f.id === 'toca-enemigo'),
  ...fichasDeVariable('puntos', META_PUNTOS).filter((f) => f.id !== 'var:poner-cero'),
  FICHA_MOSTRAR,
];

/** Cómo se dice cada pregunta cuando Bit lee una regla en voz alta. */
const NOMBRE_PREGUNTA: Partial<Record<Pregunta, string>> = {
  'flecha-derecha': 'aprietas la flecha de la derecha',
  'flecha-arriba': 'aprietas la flecha de arriba',
  'tocando-moneda': 'tocas una moneda',
  'tocando-enemigo': 'tocas al enemigo',
};

/* ── constructores cortos, para que los tres juegos se lean como se ven ────── */

function orden(id: string, accion: Accion, pasos?: number): NodoOrden {
  return pasos === undefined ? { tipo: 'orden', id, accion } : { tipo: 'orden', id, accion, pasos };
}

function si(id: string, pregunta: Pregunta, cuerpo: NodoOrden[]): NodoSi {
  return { tipo: 'si', id, condicion: { id: `${id}-c`, pregunta }, cuerpo };
}

/* ── los tres juegos rotos ─────────────────────────────────────────────────── */

type Etapa = 'probar' | 'acotar' | 'arreglar' | 'comprobar';

/** Lo que los detectores miden pulso a pulso. Se pone a cero en cada prueba. */
interface Medidas {
  /** Pulsos seguidos en los que sumó sin recoger nada. El marcador loco. */
  seguidas: number;
  /** Cuánto ha caminado el muñeco en esta prueba. */
  recorrido: number;
  /** El mayor brinco de un solo pulso. Con `pasos: 100` sale 1.8. */
  saltoMax: number;
  /** Pulsos corridos. Sirve para el empujón de Bit cuando nadie aprieta nada. */
  pulsos: number;
  /** Bit ya dio el empujón de esta prueba. */
  empujo: boolean;
}

interface Lectura {
  antes: MundoJuego;
  mundo: MundoJuego;
  eventos: EventoJuego[];
  sumo: boolean;
  escondio: boolean;
  volvio: boolean;
  m: Medidas;
}

/**
 * Cuánto mide el programa de cada juego, y por qué son tan cortos.
 *
 * Medido en el navegador, no supuesto: el lienzo del monitor da 262 px de alto,
 * de los que 16 se van en el relleno y 27 en el sombrero `▶ al empezar`; la C
 * del «por siempre» gasta 20 arriba y 10 abajo. Quedan **192 px** para los
 * bloques. Un `si` con una orden dentro mide 67, cada orden de más suma 24 y
 * una orden suelta en el tronco mide 24.
 *
 * Ese techo no es una limitación que haya que sortear: es la razón por la que
 * los tres juegos son diminutos, y eso es exactamente lo que pide una actividad
 * de depuración. Un programa que no cabe en la pantalla obliga a hacer scroll, y
 * un bug que hay que buscar desplazando ya no se acota: se rastrea. Aquí el
 * alumno ve el programa entero de un vistazo y el trabajo es pensar, no navegar.
 */
interface JuegoRoto {
  titulo: string;
  /** Lo que se anota en el cuaderno cuando el síntoma ya se vio. */
  sintoma: string;
  /** Lo que Bit dice al abrir el juego. */
  alEntrar: string;
  /** Lo que Bit dice en el instante en que el síntoma ocurre. */
  alVerlo: string;
  /** Empujón si el alumno prueba y no aprieta ninguna flecha. */
  empujon: string;
  /** Lo que Bit dice al acusar al bloque correcto. */
  alCazar: string;
  /** Lo que Bit pide comprobar después del arreglo. */
  alArreglar: string;
  /** Lo que Bit dice al cerrar el juego. */
  alCerrar: string;
  /** Los bloques que SON el bug. Marcar cualquiera de ellos abre la tarjeta. */
  culpables: string[];
  /**
   * Qué botones enseña el mando en este juego: exactamente las flechas que sus
   * reglas entienden, y `null` cuando no entiende ninguna. Un botón que no lleva
   * a ninguna parte sería una pista falsa, y la actividad entera trata de
   * separar lo que falla de lo que no.
   */
  teclas: Tecla[] | null;
  programa: () => Programa;
  pregunta: string;
  opciones: OpcionArreglo[];
  correcta: string;
  arreglar: (programa: Programa) => Programa;
  /** Juez de FORMA: ¿ya está bien escrito? Nunca juzga el motor. */
  arreglado: (programa: Programa) => boolean;
  /** ¿Se está viendo el síntoma ahora mismo? */
  verSintoma: (lectura: Lectura) => boolean;
  /** ¿La segunda prueba salió bien? */
  verBien: (lectura: Lectura) => boolean;
}

const JUEGOS: JuegoRoto[] = [
  {
    titulo: 'El marcador loco',
    sintoma: 'El marcador sube solo, sin tocar ninguna moneda.',
    alEntrar:
      'Este es chiquito: tres reglas y ninguna pieza falta, pero una está mal puesta. Primero pruébalo. No adivines: mira qué hace de raro.',
    alVerlo: '¿Ves? Suma puntos sin tocar nada. ¿Qué regla tiene la culpa?',
    empujon: 'Mira el marcador de la mesa. Sube solo, y tú no has apretado nada.',
    alCazar: '¡Ese era! Estaba fuera del «si», por eso pasaba siempre.',
    alArreglar: 'Ya está dentro del «si». Vuelve a probar: ve por la moneda y mira el marcador.',
    alCerrar: 'Ahora sí: sube de uno en uno y sólo cuando recoges. Juego uno arreglado.',
    culpables: ['j1-suma'],
    // Sólo la derecha: la primera moneda está en la misma fila que la salida, así
    // que con un botón se llega. El segundo sobraría, y aquí nada sobra.
    teclas: ['derecha'],
    programa: () => ({
      siempre: [
        si('j1-si-der', 'flecha-derecha', [orden('j1-mov-der', 'mover-derecha')]),
        si('j1-si-mon', 'tocando-moneda', [orden('j1-esconde', 'esconder-moneda')]),
        // El bug: colgado del `por siempre`, así que corre en cada vuelta.
        orden('j1-suma', 'sumar'),
      ],
    }),
    pregunta: '¿Qué hacemos con el «sumar 1 a puntos»?',
    opciones: [
      {
        id: 'j1-dentro-moneda',
        etiqueta: 'Meterlo dentro del «si ¿tocando la moneda?»',
        pista: 'Sumaría sólo cuando recoges una.',
      },
      {
        id: 'j1-dentro-flecha',
        etiqueta: 'Meterlo dentro del «si ¿flecha derecha?»',
        pista: 'Sumaría cada vez que caminas.',
      },
      {
        id: 'j1-quitar',
        etiqueta: 'Quitarlo del programa',
        pista: 'Ya no sumaría nunca.',
      },
    ],
    correcta: 'j1-dentro-moneda',
    arreglar: (programa) => {
      const suma = programa.siempre.find(
        (n): n is NodoOrden => n.tipo === 'orden' && n.id === 'j1-suma',
      );
      if (!suma) return programa;
      return {
        ...programa,
        siempre: programa.siempre
          .filter((n) => n.id !== 'j1-suma')
          .map((n) => {
            if (n.tipo === 'si' && n.id === 'j1-si-mon') return { ...n, cuerpo: [suma, ...n.cuerpo] };
            return n;
          }),
      };
    },
    arreglado: (programa) => {
      const sitios = ubicarAccion(programa, 'sumar');
      return (
        sitios.length === 1 &&
        sitios[0].zona === 'dentro-de-c' &&
        sitios[0].condicion === 'tocando-moneda'
      );
    },
    // Quince pulsos seguidos sumando sin recoger son novecientos milisegundos: el
    // marcador llega a 15 a la vista y ya no hay quien lo llame casualidad.
    verSintoma: (l) => l.m.seguidas >= 15,
    verBien: (l) => l.sumo && l.escondio,
  },
  {
    titulo: 'El teletransportado',
    sintoma: 'Con la flecha derecha, el muñeco cruza el campo de un salto.',
    alEntrar:
      'Éste todavía no recoge monedas ni suma: sólo camina. Y camina mal. Pruébalo con las dos flechas y compáralas.',
    alVerlo: '¡Ahí está! Eso no es caminar, es teletransportarse. ¿Y con la otra flecha? Compara las dos plaquitas.',
    empujon: 'Aprieta la flecha de la derecha y luego la de arriba. No caminan igual.',
    alCazar: '¡Ese era! Míralo bien: su plaquita dice 100 y la de arriba dice 10.',
    alArreglar: 'Ya dice 10, igual que la otra. Vuelve a probar y camínalo un rato.',
    alCerrar: 'Ahora las dos flechas caminan igual. Juego dos arreglado.',
    culpables: ['j2-mov-der'],
    teclas: ['derecha', 'arriba'],
    programa: () => ({
      siempre: [
        // El bug: la misma pieza que la de abajo, con la plaquita en 100. Las dos
        // llevan número puesto a propósito: si sólo lo llevara la mala, la
        // plaquita sería un bicho raro y se delataría sin necesidad de leerla.
        si('j2-si-der', 'flecha-derecha', [orden('j2-mov-der', 'mover-derecha', 100)]),
        si('j2-si-arr', 'flecha-arriba', [orden('j2-mov-arr', 'mover-arriba', PASOS_NORMALES)]),
      ],
    }),
    pregunta: '¿Cuántos pasos debe dar el «mover a la derecha»?',
    opciones: [
      { id: 'j2-10', etiqueta: '10 pasos', pista: 'Lo mismo que el de arriba.' },
      { id: 'j2-100', etiqueta: '100 pasos', pista: 'Lo que tiene puesto ahora.' },
      { id: 'j2-1', etiqueta: '1 paso', pista: 'Diez veces más lento que el de arriba.' },
    ],
    correcta: 'j2-10',
    arreglar: (programa) => ({
      ...programa,
      siempre: programa.siempre.map((n) => {
        if (n.tipo === 'orden' || n.id !== 'j2-si-der') return n;
        return {
          ...n,
          cuerpo: n.cuerpo.map((o) =>
            o.id === 'j2-mov-der' ? { ...o, pasos: PASOS_NORMALES } : o,
          ),
        };
      }),
    }),
    arreglado: (programa) =>
      programa.siempre.some(
        (n) =>
          n.tipo === 'si' &&
          n.id === 'j2-si-der' &&
          n.cuerpo.some((o) => o.id === 'j2-mov-der' && o.pasos === PASOS_NORMALES),
      ),
    // Un paso normal son 0.18; con la plaquita en 100 el brinco es 1.8. Medio
    // punto de campo separa las dos cosas sin que quepa la duda.
    verSintoma: (l) => l.m.saltoMax > 0.5,
    verBien: (l) => l.m.recorrido >= 2.5 && l.m.saltoMax <= 0.5,
  },
  {
    titulo: 'La moneda enemiga',
    sintoma: 'La moneda me regresa a la salida, una y otra vez.',
    alEntrar:
      'Éste se juega solo: camina sin que aprietes nada, por eso no hay mando. Tira de la palanca y míralo.',
    alVerlo: '¡La moneda me mandó a la salida! Y ahí va otra vez. Eso le tocaba al enemigo: mira bien las dos preguntas.',
    empujon: 'Míralo llegar a la moneda. Fíjate en lo que pasa justo cuando la toca.',
    alCazar: '¡Eso es! Las dos preguntas están cambiadas de sitio.',
    alArreglar: 'Ya cambiamos las preguntas de lugar. Vuelve a probar y déjalo llegar a la moneda.',
    alCerrar: 'La moneda suma y el enemigo castiga. Juego tres arreglado.',
    // Los dos son el bug: da igual por cuál de las dos preguntas se empiece,
    // porque lo que está mal es en qué C está metida cada una.
    culpables: ['j3-si-a', 'j3-si-b'],
    // Sin mando: el muñeco camina solo. Que no haya botones es la primera pista
    // de que aquí no hay nada que apretar, sólo algo que mirar.
    teclas: null,
    programa: () => ({
      siempre: [
        // Suelto en el tronco y NO es el bug: sirve para que el alumno vea que un
        // bloque fuera de la C no está mal por estar fuera —el del juego uno lo
        // estaba por lo que hacía, no por dónde vivía.
        orden('j3-mov', 'mover-derecha'),
        si('j3-si-a', 'tocando-enemigo', [
          orden('j3-suma', 'sumar'),
          orden('j3-esconde', 'esconder-moneda'),
        ]),
        si('j3-si-b', 'tocando-moneda', [orden('j3-vuelve', 'volver-inicio')]),
      ],
    }),
    pregunta: '¿Qué hacemos con estas dos reglas?',
    opciones: [
      {
        id: 'j3-cambiar',
        etiqueta: 'Cambiar las dos preguntas de lugar',
        pista: 'La moneda a la regla que suma; el enemigo a la que te regresa.',
      },
      {
        id: 'j3-otra-orden',
        etiqueta: 'Cambiar «volver al inicio» por «sumar 1 a puntos»',
        pista: 'Las dos reglas sumarían y nada te regresaría.',
      },
      {
        id: 'j3-quitar',
        etiqueta: 'Quitar el «si ¿tocando al enemigo?»',
        pista: 'El enemigo dejaría de hacer nada.',
      },
    ],
    correcta: 'j3-cambiar',
    arreglar: (programa) => {
      const a = programa.siempre.find((n) => n.id === 'j3-si-a');
      const b = programa.siempre.find((n) => n.id === 'j3-si-b');
      if (!a || !b || a.tipo === 'orden' || b.tipo === 'orden') return programa;
      const condA = a.condicion;
      const condB = b.condicion;
      return {
        ...programa,
        siempre: programa.siempre.map((n) => {
          if (n.tipo === 'orden') return n;
          if (n.id === 'j3-si-a') return { ...n, condicion: condB };
          if (n.id === 'j3-si-b') return { ...n, condicion: condA };
          return n;
        }),
      };
    },
    arreglado: (programa) => reglaDosArmada(programa) && reglaTresArmada(programa),
    verSintoma: (l) => l.volvio,
    verBien: (l) => l.sumo && l.escondio,
  },
];

/** Cuatro hitos por juego: probado, acotado, arreglado y comprobado. */
const HITO: Record<Etapa, number> = { probar: 0, acotar: 1, arreglar: 2, comprobar: 3 };
const TOTAL_PASOS = JUEGOS.length * 4;

/** El paso del método que enciende el cuaderno. `comprobar` vuelve a PRUEBA. */
const PASO_CUADERNO: Record<Etapa, number> = { probar: 0, acotar: 1, arreglar: 2, comprobar: 0 };

const ENCARGO_ETAPA: Record<Etapa, string> = {
  probar: 'Tira de la palanca PROBAR y mira qué hace de raro.',
  acotar: 'Enciende la lupa y señala el bloque que tiene la culpa.',
  arreglar: 'Elige por qué lo cambiamos.',
  comprobar: 'Vuelve a probar: comprueba que ya quedó bien.',
};

const LINEAS = {
  inicio: 'Tengo tres juegos… y los tres están fallando. ¿Me ayudas a cazar los bugs?',
  antesDeProbar: 'Primero pruébalo. No adivines: mira qué hace de raro.',
  unaSolaCosa: 'Cambia una sola cosa y vuelve a probar. Si cambias tres, no sabes cuál era.',
  noEsFracaso: 'Un error no es un fracaso: es una pista.',
  fin: '¡Tres bugs cazados! Ya piensas como programador de verdad.',
  lupaEncendida: 'Paré el juego: a un bicho en movimiento no se le caza. Ahora toca el bloque que crees que tiene la culpa.',
  primeroPrueba: 'Todavía no lo has visto fallar. Tira de la palanca primero.',
  yaCazado: 'Ese ya lo revisamos. Sigamos con lo que falta.',
};

/* ── lo que Bit lee de un bloque, sacado de la propia ficha ────────────────── */

function lecturaDeOrden(nodo: NodoOrden): string {
  const ficha = PALETA.find((f) => f.crea?.tipo === 'orden' && f.crea.accion === nodo.accion);
  const base = ficha?.lectura ?? 'Este bloque da una orden al muñeco.';
  return nodo.pasos === undefined ? base : `${base} Su plaquita dice ${nodo.pasos} pasos.`;
}

/**
 * Qué hace el bloque que el alumno acaba de tocar, dicho por Bit.
 *
 * Se compone del programa en vivo y no de una tabla de textos a mano: así una
 * pieza dice siempre la verdad sobre dónde está AHORA, que es justo lo que
 * cambia cuando el arreglo se aplica.
 */
function describir(programa: Programa, nodoId: string): string {
  for (const nodo of programa.siempre) {
    if (nodo.tipo === 'orden') {
      if (nodo.id === nodoId) {
        return `${lecturaDeOrden(nodo)} Y está suelto en el «por siempre»: eso pasa en cada vuelta, siempre.`;
      }
      continue;
    }
    const dice = nodo.condicion ? NOMBRE_PREGUNTA[nodo.condicion.pregunta] ?? 'algo' : 'nada';
    if (nodo.id === nodoId) {
      return `Este «si» sólo deja pasar lo de adentro cuando ${dice}.`;
    }
    for (const hijo of nodo.cuerpo) {
      if (hijo.id === nodoId) {
        return `${lecturaDeOrden(hijo)} Está dentro del «si» de cuando ${dice}, así que sólo ocurre entonces.`;
      }
    }
  }
  return 'Ese bloque no tiene nada que decir.';
}

function formatTiempo(segundos: number): string {
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;
}

function medidasEnCero(): Medidas {
  return { seguidas: 0, recorrido: 0, saltoMax: 0, pulsos: 0, empujo: false };
}

/* ── el laboratorio ────────────────────────────────────────────────────────── */

export function LabDepuraTuJuego(props: ActivityProps & { alSalir?: () => void }) {
  const [indice, setIndice] = useState(0);
  const [etapa, setEtapa] = useState<Etapa>('probar');
  const [programa, setPrograma] = useState<Programa>(() => JUEGOS[0].programa());
  const [corriendo, setCorriendo] = useState(false);
  const [lupa, setLupa] = useState(false);
  const [marcado, setMarcado] = useState<string | null>(null);
  const [descartados, setDescartados] = useState<string[]>([]);
  const [cazado, setCazado] = useState<string | null>(null);
  const [puntos, setPuntos] = useState(0);
  const [visto, setVisto] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const mundoRef = useRef<MundoJuego>(mundoInicial());
  const teclasRef = useRef<Record<Tecla, boolean>>({
    derecha: false,
    izquierda: false,
    arriba: false,
    abajo: false,
  });
  const med = useRef<Medidas>(medidasEnCero());
  const sim = useRef({ errores: 0, inicio: 0 });

  // La misma disciplina de la parada 3: el latido es un solo intervalo con el
  // array de dependencias vacío, y todo lo que necesita saber lo lee de este
  // espejo, que se refresca en cada render.
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, etapa, indice, programa, corriendo });
  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, etapa, indice, programa, corriendo };
  });

  useEffect(() => {
    sim.current.inicio = Date.now();
  }, []);

  // `useBit` pinta su línea inicial a los 450 ms, así que un `hablar()` en el
  // montaje se pisaría solo: se dice y medio segundo después la inicial lo borra.
  // La presentación de la parada la da la inicial; la del juego uno entra cuando
  // aquélla ya se oyó, con la misma espera que usa el salto entre juegos.
  useEffect(() => {
    timers.despues(() => hablar(JUEGOS[0].alEntrar), 5200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hechos = terminado ? TOTAL_PASOS : indice * 4 + HITO[etapa];
  useEffect(() => {
    propsRef.current.onProgress(Math.min(1, hechos / TOTAL_PASOS));
  }, [hechos]);

  /* ── contabilidad ────────────────────────────────────────────────────────── */

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

  const restar = () => {
    reproducirTono('error');
    sim.current.errores += 1;
    propsRef.current.onScore(puntaje());
  };

  const avisar = (texto: string) => {
    setAviso(texto);
    timers.despues(() => setAviso(null), 3200);
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
    setTerminado(true);
    setCorriendo(false);
  };

  /* ── el mundo: reponerlo entre prueba y prueba ───────────────────────────── */

  const reponerMundo = () => {
    mundoRef.current = mundoInicial();
    teclasRef.current = { derecha: false, izquierda: false, arriba: false, abajo: false };
    med.current = medidasEnCero();
    setPuntos(0);
  };

  /* ── la palanca y la lupa ────────────────────────────────────────────────── */

  const probar = () => {
    if (terminado) return;
    if (corriendo) {
      reproducirTono('select');
      setCorriendo(false);
      return;
    }
    // Cada prueba empieza de cero: si el campo quedara a medias, lo que se mida
    // en esta prueba llevaría dentro lo que pasó en la anterior y el alumno no
    // podría saber si el cambio sirvió.
    reponerMundo();
    setLupa(false);
    reproducirTono('select');
    setCorriendo(true);
  };

  const alternarLupa = () => {
    if (terminado) return;
    if (lupa) {
      setLupa(false);
      return;
    }
    reproducirTono('select');
    setLupa(true);
    if (corriendo) {
      setCorriendo(false);
      hablar(LINEAS.lupaEncendida);
    }
  };

  /* ── acotar: acusar un bloque ────────────────────────────────────────────── */

  const marcar = (nodoId: string) => {
    if (terminado || etapa === 'arreglar') return;
    const juego = JUEGOS[indice];
    if (etapa === 'probar') {
      hablar(LINEAS.primeroPrueba);
      avisar('Primero pruébalo');
      return;
    }
    if (etapa === 'comprobar') {
      hablar(LINEAS.yaCazado);
      return;
    }
    if (juego.culpables.includes(nodoId)) {
      reproducirTono('complete');
      setMarcado(nodoId);
      setEtapa('arreglar');
      hablar(juego.alCazar);
      return;
    }
    // Un inocente ya explicado no vuelve a costar: el alumno lo está releyendo,
    // no equivocándose otra vez.
    if (descartados.includes(nodoId)) {
      hablar(describir(programa, nodoId));
      return;
    }
    restar();
    setDescartados((previos) => [...previos, nodoId]);
    hablar(`${describir(programa, nodoId)} ¿Eso tiene que ver con lo que viste?`);
    avisar('Ese no era. Sigue buscando.');
  };

  /* ── arreglar: la tarjeta de reemplazo ───────────────────────────────────── */

  const elegirArreglo = (opcionId: string) => {
    if (terminado) return;
    const juego = JUEGOS[indice];
    if (opcionId !== juego.correcta) {
      restar();
      const opcion = juego.opciones.find((o) => o.id === opcionId);
      hablar(`${opcion?.pista ?? ''} ${LINEAS.noEsFracaso}`.trim());
      avisar('Con eso no se arregla');
      return;
    }
    const nuevo = juego.arreglar(programa);
    if (!juego.arreglado(nuevo)) {
      // Red de seguridad: si el arreglo no dejó el programa con la forma que el
      // juez pide, no se acepta en silencio. Nunca debería pasar, y por eso se
      // nota en vez de esconderse.
      avisar('Ese arreglo no cuajó');
      return;
    }
    reproducirTono('complete');
    setPrograma(nuevo);
    setCazado(marcado);
    setMarcado(null);
    setLupa(false);
    setEtapa('comprobar');
    setVisto(false);
    reponerMundo();
    hablar(`${juego.alArreglar} ${LINEAS.unaSolaCosa}`);
  };

  const cancelarArreglo = () => {
    setEtapa('acotar');
    setMarcado(null);
  };

  /* ── leer un bloque con la lupa apagada ──────────────────────────────────── */

  const leer = (nodoId: string) => {
    reproducirTono('select');
    hablar(describir(programa, nodoId));
  };

  const leerPuntos = () => {
    reproducirTono('select');
    hablar(`La cajita puntos vale ${mundoRef.current.puntos} en este momento.`);
  };

  /* ── el mando de flechas ─────────────────────────────────────────────────── */

  const apretar = (tecla: Tecla) => {
    teclasRef.current[tecla] = true;
  };

  const soltarTecla = (tecla: Tecla) => {
    teclasRef.current[tecla] = false;
  };

  useEffect(() => {
    // Sólo las flechas que el mueble ofrece en el juego que está abierto: un
    // atajo de teclado que el mando no tiene sería una interfaz escondida.
    const MAPA: Record<string, Tecla> = { ArrowRight: 'derecha', ArrowUp: 'arriba' };
    const ofrecidas = () => JUEGOS[vivo.current.indice].teclas ?? [];
    const abajo = (evento: KeyboardEvent) => {
      const tecla = MAPA[evento.key];
      if (!tecla || !ofrecidas().includes(tecla)) return;
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
  }, []);

  /* ── el latido ───────────────────────────────────────────────────────────── */

  const pasarDeJuego = () => {
    const siguiente = vivo.current.indice + 1;
    if (siguiente >= JUEGOS.length) {
      terminar();
      return;
    }
    setIndice(siguiente);
    setPrograma(JUEGOS[siguiente].programa());
    setEtapa('probar');
    setDescartados([]);
    setCazado(null);
    setMarcado(null);
    setLupa(false);
    setVisto(false);
    setCorriendo(false);
    reponerMundo();
    timers.despues(() => hablar(JUEGOS[siguiente].alEntrar), 2600);
  };

  const mirar = (antes: MundoJuego, mundo: MundoJuego, eventos: EventoJuego[]) => {
    const v = vivo.current;
    const juego = JUEGOS[v.indice];
    const m = med.current;

    const sumo = eventos.some((e) => e.tipo === 'suma');
    const escondio = eventos.some((e) => e.tipo === 'esconde');
    const volvio = eventos.some((e) => e.tipo === 'vuelve');
    const salto = Math.hypot(mundo.jugador.x - antes.jugador.x, mundo.jugador.y - antes.jugador.y);

    m.pulsos += 1;
    m.recorrido += salto;
    m.saltoMax = Math.max(m.saltoMax, salto);
    m.seguidas = sumo && !escondio ? m.seguidas + 1 : 0;

    if (sumo || escondio) setPuntos(mundo.puntos);
    if (escondio) reproducirTono('select');
    if (volvio) reproducirTono('error');

    const lectura: Lectura = { antes, mundo, eventos, sumo, escondio, volvio, m };

    if (v.etapa === 'probar') {
      if (juego.verSintoma(lectura)) {
        setVisto(true);
        setEtapa('acotar');
        hablar(juego.alVerlo);
        avisar(juego.sintoma);
        return;
      }
      // Cinco segundos corriendo sin que pase nada suele querer decir que el
      // alumno no ha apretado ninguna flecha todavía.
      if (!m.empujo && m.pulsos > 5000 / MS_POR_PULSO) {
        m.empujo = true;
        hablar(juego.empujon);
      }
      return;
    }

    if (v.etapa === 'comprobar' && juego.verBien(lectura)) {
      reproducirTono('complete');
      hablar(juego.alCerrar);
      setCorriendo(false);
      pasarDeJuego();
    }
  };

  useEffect(() => {
    const id = window.setInterval(() => {
      const v = vivo.current;
      if (v.terminado || !v.corriendo) return;
      const teclas = (Object.keys(teclasRef.current) as Tecla[]).filter((t) => teclasRef.current[t]);
      const antes = mundoRef.current;
      const salida = paso(antes, v.programa, teclas);
      mundoRef.current = salida.mundo;
      mirar(antes, salida.mundo, salida.eventos);
    }, MS_POR_PULSO);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── volver a empezar ────────────────────────────────────────────────────── */

  const repetir = () => {
    sim.current = { errores: 0, inicio: Date.now() };
    setIndice(0);
    setPrograma(JUEGOS[0].programa());
    setEtapa('probar');
    setDescartados([]);
    setCazado(null);
    setMarcado(null);
    setLupa(false);
    setVisto(false);
    setCorriendo(false);
    setTerminado(false);
    setTiempoFinal(0);
    setErroresFinal(0);
    reponerMundo();
    propsRef.current.onProgress(0);
    hablar(JUEGOS[0].alEntrar);
  };

  /* ── el montaje ──────────────────────────────────────────────────────────── */

  const juego = JUEGOS[indice];

  const caza: ModoCaza = {
    activa: lupa && !terminado,
    marcado,
    descartados,
    cazado,
    onMarcar: marcar,
  };

  const arreglo: PanelArreglo = {
    abierto: etapa === 'arreglar' && !terminado,
    titulo: `Bug de «${juego.titulo}»`,
    pregunta: juego.pregunta,
    opciones: juego.opciones,
    onElegir: elegirArreglo,
    onCancelar: cancelarArreglo,
  };

  const hoja: HojaSintomas = {
    juego: indice + 1,
    total: JUEGOS.length,
    titulo: juego.titulo,
    sintoma:
      etapa === 'comprobar'
        ? 'Arreglado. Vuelve a probar para comprobarlo.'
        : visto
          ? juego.sintoma
          : null,
    paso: PASO_CUADERNO[etapa],
    hechos: terminado ? JUEGOS.length : indice,
  };

  const encargo = (
    <div className="bloques3d-encargo">
      <span className="bloques3d-encargo-num">{indice + 1}</span>
      <span className="bloques3d-encargo-texto">
        {terminado ? 'Los tres juegos quedaron arreglados.' : ENCARGO_ETAPA[etapa]}
      </span>
    </div>
  );

  const editor = (
    <TecniaBloques
      reto={`Juego roto ${indice + 1}: ${juego.titulo}`}
      fichas={PALETA}
      categoria="control"
      categoriaPedida={null}
      programa={programa}
      activo={null}
      respuesta={null}
      corriendo={corriendo}
      elegida={null}
      rebote={null}
      puntos={puntos}
      archivo={`juego roto ${indice + 1}`}
      caza={caza}
      arreglo={arreglo}
      onCategoria={() => {}}
      onElegir={() => {}}
      onSoltar={() => {}}
      onTocar={() => {}}
      onQuitar={() => {}}
      onLeer={leer}
      onCorrer={() => {}}
      onParar={() => {}}
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
            ganada={terminado}
            reduceMotion={reduceMotion}
          />
          {juego.teclas ? (
            <MandosFlecha3D
              teclasRef={teclasRef}
              onApretar={apretar}
              onSoltar={soltarTecla}
              reduceMotion={reduceMotion}
              teclas={juego.teclas}
            />
          ) : (
            <PlacaCaminaSolo3D />
          )}
          <LupaCaza3D activa={lupa} onAlternar={alternarLupa} reduceMotion={reduceMotion} />
          <PalancaProbar3D
            corriendo={corriendo}
            onProbar={probar}
            reduceMotion={reduceMotion}
            llama={!terminado && (etapa === 'probar' || etapa === 'comprobar')}
          />
          <CuadernoSintomas3D hoja={hoja} />
        </>
      }
      puntos={{
        nombre: 'puntos',
        valor: puntos,
        meta: META_PUNTOS,
        corriendo: corriendo && !terminado,
        onLeer: leerPuntos,
        reduceMotion,
      }}
      encargo={encargo}
    />
  );

  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">
        {`Juego ${indice + 1} de ${JUEGOS.length} · ${juego.titulo}`}
      </p>
      <p className="escena3d-respaldo-titulo">{ENCARGO_ETAPA[etapa]}</p>
      {editor}
      <p className="escena3d-respaldo-titulo">
        {hoja.sintoma ?? 'Todavía no lo has visto fallar.'}
      </p>
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="Depura tu juego"
      pasoEtiqueta="Paso"
      pasoActual={Math.min(TOTAL_PASOS, hechos)}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="bugs"
      marcadorValor={`${terminado ? JUEGOS.length : indice}/${JUEGOS.length}`}
      bit={linea}
      paleta={{ acento: '#8B5CF6', acento2: '#4ADE80' }}
      activa={!terminado}
      sinMostrador
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={
        <p className="gabinete-nota">
          El Laboratorio de Juegos · tres juegos rotos · observa, acota y vuelve a probar
        </p>
      }
      final={
        terminado
          ? {
              insigniaNombre: 'Cazador de bugs',
              insigniaEmoji: '🔍',
              titulo: '¡Tres bugs cazados!',
              detalle:
                'Un bloque fuera del «si», un número mal puesto y dos preguntas cambiadas de lugar. Los encontraste probando, acotando y cambiando una cosa a la vez: así se depura de verdad.',
              resumen: [
                { etiqueta: 'Bugs', valor: `${JUEGOS.length}` },
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
