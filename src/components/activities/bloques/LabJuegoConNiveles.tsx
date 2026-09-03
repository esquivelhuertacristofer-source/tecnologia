'use client';

import type { ActivityProps } from '@/types/activity-contract';
import {
  nuevoBloque,
  pilaDe,
  programaDe,
  type BloquePuesto,
  type CategoriaBloques,
  type EventoBloques,
  type FichaBloque,
  type Programa,
} from '@/components/simuladores/bloques';
import { SalaBloques, type ClaseBloques, type EncargoBloques, type EscenarioProps } from './SalaBloques';
import './juegoConNiveles.css';

/**
 * N5 · U4 «Programación en bloques III» · parada 2 — «Historia o juego con
 * niveles» (curriculo.ts: `n5-juego-con-niveles`, unidad `n5-bloques-3`).
 *
 * **5.º de primaria, 10–11 años**, leído en `curriculo.ts` (línea 483:
 * `n: 5, grado: '5° de Primaria', edad: '10–11'`). Frases cortas y el nombre
 * técnico dicho sin rodeos: a esta edad se puede decir «variable» y «estado».
 *
 * ── QUÉ ENSEÑA, Y QUÉ NO REPITE ───────────────────────────────────────────
 *
 * Viene DESPUÉS de `n5-bloques-propios`, así que el alumno ya sabe definir un
 * bloque propio, llamarlo y enviar un mensaje. Aquí nada de eso se vuelve a
 * enseñar: el mensaje reaparece con **otro oficio** —cambiar de escena— y la
 * pieza nueva es **la memoria del juego**.
 *
 * La lección central: *un juego con niveles no son tres juegos, es UN programa
 * que recuerda en qué punto está.*
 *
 * ── LA VARIABLE, SIN BLOQUES DE VARIABLE ──────────────────────────────────
 *
 * El armazón NO tiene semántica de variable: `Semantica` es una unión cerrada de
 * doce casos y ninguno guarda un dato. Pero `Accion` y `Pregunta` son `string`
 * abiertos y el armazón sólo los EMITE —«el armazón no corrige», dice el canon—,
 * así que la memoria se modela donde le toca, en el mundo de la clase:
 *
 *   · escribirla   → acciones `poner-nivel-1` y `subir-nivel`, que `reducirTorre`
 *                    interpreta;
 *   · leerla       → la acción `pintar-escena`, que dibuja lo que diga `nivel`;
 *   · preguntarla  → los hexágonos, que contesta `responderTorre` mirando el
 *                    mundo.
 *
 * No hace falta tocar el armazón. Queda anotado por si algún día ocho clases
 * piden variables de verdad; una sola no lo justifica.
 *
 * ── DÓNDE ESTÁ EL DESCUBRIMIENTO ──────────────────────────────────────────
 *
 * En el encargo 2, y está construido para que duela: el alumno pone TRES
 * «pintar la pantalla del nivel» seguidas y salen **tres veces la misma
 * pantalla**, porque nadie movió la memoria. La tira de abajo lo enseña con tres
 * chips idénticos. Sólo después —encargo 3— entra «subir de nivel» y las mismas
 * piezas dan tres pantallas distintas. La necesidad del estado se siente antes
 * de que nadie la explique, que es la única manera de que se entienda.
 *
 * ── LOS DOS LÍMITES DEL ARMAZÓN, RESPETADOS ───────────────────────────────
 *
 * 1. **La vía sin arrastre sólo sabe añadir al final**: en `ListaBloques` el
 *    único blanco que es un `<button>` es el de la cola. Por eso ningún encargo
 *    pide meter una pieza EN MEDIO de una pila ya puesta; cuando hay que cambiar
 *    el medio, el encargo dice «quita con la ✕ y ármalo otra vez». Toda la clase
 *    se juega con el dedo o con el teclado.
 * 2. **No hay corridas simultáneas**: el juego es un solo hilo —pintar, subir,
 *    preguntar— y el mensaje ¡FIN! es lo último que pasa. Ningún encargo pide
 *    dos cosas moviéndose a la vez.
 *
 * ── POR QUÉ EL MUNDO SE REINICIA EN CADA ▶ ────────────────────────────────
 *
 * La tira de pantallas es la prueba visual de la lección. Si se acumulara entre
 * corridas, «salieron tres pantallas iguales» dependería de cuántas veces llevas
 * pulsado ▶ y no del programa, y la comparación dejaría de medir nada.
 */

/* ───────────────────────────── el mundo: el juego ─────────────────────────── */

export type Escena = 'titulo' | 'perdida' | 'bosque' | 'rio' | 'torre' | 'final';

export interface MundoTorre {
  /** LA MEMORIA DEL JUEGO. 0 = todavía no se puso; 1..3 son los niveles. */
  nivel: number;
  /** Lo que ve el jugador ahora mismo. */
  escena: Escena;
  /** Las pantallas que se pintaron, en orden. Es la tira de abajo. */
  bitacora: Escena[];
  /** Se llegó a la pantalla de FIN. */
  gano: boolean;
}

export const TOTAL_NIVELES = 3;

/** Las tres pantallas de nivel, en orden. Lo que tiene que salir bien hecho. */
export const NIVELES: readonly Escena[] = ['bosque', 'rio', 'torre'];

export const MUNDO_INICIAL: MundoTorre = {
  nivel: 0,
  escena: 'titulo',
  bitacora: [],
  gano: false,
};

/**
 * Cuántas pantallas se guardan en la tira.
 *
 * Se quedan las PRIMERAS, no las últimas: los jueces de los encargos leen el
 * principio de la tira («las tres primeras pantallas son bosque, río y torre»),
 * y un «repetir hasta» sin «subir de nivel» dentro pinta cientos de veces la
 * misma antes de que salte el tope. Guardando las últimas, ese alumno perdería
 * justo la parte que se juzga.
 */
const TOPE_TIRA = 16;

const ESCENA_DE_NIVEL: Record<number, Escena> = { 1: 'bosque', 2: 'rio', 3: 'torre' };

function apuntar(m: MundoTorre, escena: Escena): Escena[] {
  return m.bitacora.length >= TOPE_TIRA ? m.bitacora : [...m.bitacora, escena];
}

/** Puro: sólo lee el evento y el mundo. Ni reloj, ni DOM, ni azar. */
export function reducirTorre(m: MundoTorre, e: EventoBloques): MundoTorre {
  if (e.tipo !== 'accion') return m;

  if (e.accion === 'poner-nivel-1') return { ...m, nivel: 1 };
  if (e.accion === 'subir-nivel') return { ...m, nivel: m.nivel + 1 };

  if (e.accion === 'pintar-escena') {
    // El bloque no sabe qué pintar: mira la memoria. Ésta es la clase entera.
    const escena = ESCENA_DE_NIVEL[m.nivel] ?? 'perdida';
    return { ...m, escena, bitacora: apuntar(m, escena) };
  }

  if (e.accion === 'pintar-final') {
    return { ...m, escena: 'final', gano: true, bitacora: apuntar(m, 'final') };
  }

  return m;
}

/** Cómo contesta el juego a los hexágonos. Puro, y sólo mira la memoria. */
export function responderTorre(pregunta: string, m: MundoTorre): boolean {
  if (pregunta === 'sin-niveles') return m.nivel > TOTAL_NIVELES;
  if (pregunta === 'en-el-primero') return m.nivel === 1;
  return false;
}

/* ── lectores del programa y del mundo, para juzgar los encargos ───────────── */

export const PILA_TRONCO = 'p-torre';
export const PILA_FINAL = 'p-fin';

/** Los ids de ficha del TRONCO de una pila, en orden. Sin bajar a las bocas. */
function fichasDe(programa: Programa, pilaId: string): string[] {
  return (pilaDe(programa, pilaId)?.bloques ?? []).map((b) => b.ficha);
}

function bloquesDelTronco(programa: Programa): BloquePuesto[] {
  return pilaDe(programa, PILA_TRONCO)?.bloques ?? [];
}

function mismaLista(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

/**
 * Las pantallas de NIVEL que se pintaron, quitando la de FIN.
 *
 * Se filtra a propósito: los encargos 3, 4, 5 y 7 hablan del recorrido por los
 * niveles, y si midieran la tira entera, un alumno que se adelantara a poner el
 * mensaje ¡FIN! se quedaría atrapado en un encargo anterior. *Un encargo que
 * sólo se puede cumplir si nadie exploró antes de tiempo está mal escrito.*
 */
function pantallasDeNivel(m: MundoTorre): Escena[] {
  return m.bitacora.filter((e) => e !== 'final');
}

/** ¿El recorrido de los tres niveles salió bien, en orden? */
function recorrioLosTres(m: MundoTorre): boolean {
  return mismaLista(pantallasDeNivel(m).slice(0, TOTAL_NIVELES), NIVELES);
}

/** El «repetir hasta» del tronco con SU pregunta encajada, o `null`. */
function repetirHastaCon(programa: Programa, condicion: string): BloquePuesto | null {
  return (
    bloquesDelTronco(programa).find(
      (b) => b.ficha === 'repetir-hasta' && b.condicion?.ficha === condicion,
    ) ?? null
  );
}

/* ─────────────────────────────── el catálogo ──────────────────────────────── */

export const NOMBRE_MENSAJE_FIN = '¡FIN!';

export const CATALOGO_TORRE: FichaBloque[] = [
  /* Los dos sombreros. Categoría `inicio`, que NO está en `CATEGORIAS`: así
   * nunca aparecen en la paleta y el alumno no puede armar un guion nuevo. */
  { id: 'al-empezar', categoria: 'inicio', etiqueta: 'al empezar', semantica: { tipo: 'sombrero' } },
  {
    id: 'al-recibir-fin',
    categoria: 'inicio',
    etiqueta: 'al recibir «¡FIN!»',
    ovalo: NOMBRE_MENSAJE_FIN,
    semantica: { tipo: 'sombrero' },
  },

  /* ── Memoria: las dos piezas que escriben el estado ───────────────────────── */
  {
    id: 'poner-nivel-1',
    categoria: 'memoria',
    etiqueta: 'poner nivel a 1',
    semantica: { tipo: 'accion' },
    verbo: 'poner-nivel-1',
    lectura: 'Guarda un 1 en la memoria del juego: empiezas por el nivel 1.',
    texto: 'nivel = 1',
  },
  {
    id: 'subir-nivel',
    categoria: 'memoria',
    etiqueta: 'subir de nivel',
    semantica: { tipo: 'accion' },
    verbo: 'subir-nivel',
    lectura: 'Le suma uno a la memoria: pasas al nivel siguiente.',
    texto: 'nivel = nivel + 1',
  },

  /* ── Pantalla: la pieza que LEE el estado, y la del final ─────────────────── */
  {
    id: 'pintar-escena',
    categoria: 'pantalla',
    etiqueta: 'pintar la pantalla del nivel',
    semantica: { tipo: 'accion' },
    verbo: 'pintar-escena',
    lectura: 'Mira el número guardado en nivel y dibuja esa pantalla.',
    texto: 'pintar_pantalla(nivel)',
  },
  {
    id: 'pintar-final',
    categoria: 'pantalla',
    etiqueta: 'pintar la pantalla de FIN',
    semantica: { tipo: 'accion' },
    verbo: 'pintar-final',
    lectura: 'Dibuja la pantalla de final del juego.',
    texto: 'pintar_final()',
  },

  /* ── Control: contar tres veces, o preguntar ──────────────────────────────── */
  {
    /*
     * Sin ranura a propósito. Que el 3 esté CLAVADO en la etiqueta es lo que
     * hace posible el encargo 5: «el tres está escrito a mano; si mañana la
     * torre tuviera cinco pisos habría que cambiarlo». Con una casilla editable
     * el alumno pondría un 5 y la lección se evaporaría.
     */
    id: 'repetir-3',
    categoria: 'control',
    etiqueta: 'repetir 3 veces',
    semantica: { tipo: 'repetir', veces: TOTAL_NIVELES },
    lectura: 'Hace tres veces lo que tenga dentro. El tres está escrito a mano.',
    texto: 'for i in range(3):',
  },
  {
    id: 'repetir-hasta',
    categoria: 'control',
    etiqueta: 'repetir hasta',
    semantica: { tipo: 'hasta' },
    lectura: 'Da vueltas mientras la respuesta de la pregunta sea «no».',
    texto: 'while not (…):',
  },

  /* ── Preguntas: los hexágonos que miran la memoria ────────────────────────── */
  {
    id: 'sin-niveles',
    categoria: 'preguntas',
    etiqueta: '¿ya no quedan niveles?',
    semantica: { tipo: 'condicion' },
    verbo: 'sin-niveles',
    lectura: 'Contesta «sí» cuando la memoria pasó del último nivel.',
    texto: 'nivel > 3',
  },
  {
    /*
     * El señuelo con valor pedagógico. Encajada en el «repetir hasta» con el
     * nivel en 1 contesta «sí» de entrada, así que el bucle no da ni una vuelta
     * y no se pinta nada: un fallo honesto que se ve y se entiende, no un
     * cuelgue.
     */
    id: 'en-el-primero',
    categoria: 'preguntas',
    etiqueta: '¿vas en el nivel 1?',
    semantica: { tipo: 'condicion' },
    verbo: 'en-el-primero',
    lectura: 'Contesta «sí» sólo si la memoria guarda un 1.',
    texto: 'nivel == 1',
  },

  /* ── Mensajes: el cambio de escena ────────────────────────────────────────── */
  {
    id: 'enviar-fin',
    categoria: 'mensajes',
    etiqueta: 'enviar el mensaje',
    semantica: { tipo: 'llamar', ranura: 'mensaje' },
    ranuras: [{ id: 'mensaje', tipo: 'texto', valor: NOMBRE_MENSAJE_FIN, opciones: [NOMBRE_MENSAJE_FIN] }],
    lectura: 'Despierta al guion que empieza con «al recibir ¡FIN!».',
    texto: 'enviar("¡FIN!")',
  },
];

const CATEGORIAS: CategoriaBloques[] = [
  { id: 'memoria', nombre: 'Memoria', color: '#f59e0b' },
  { id: 'pantalla', nombre: 'Pantalla', color: '#38bdf8' },
  { id: 'control', nombre: 'Control', color: '#a78bfa' },
  { id: 'preguntas', nombre: 'Preguntas', color: '#f472b6' },
  { id: 'mensajes', nombre: 'Mensajes', color: '#34d399' },
];

function sombreroFijo(fichaId: string, id: string): BloquePuesto {
  const b = nuevoBloque(CATALOGO_TORRE, fichaId, id);
  if (!b) throw new Error(`Ficha desconocida: ${fichaId}`);
  return { ...b, fijo: true };
}

/**
 * Los dos guiones del lienzo. El tronco es el único que corre con ▶; el de la
 * pantalla final tiene `nombre`, y por ese nombre lo despierta «enviar».
 */
export const PROGRAMA_INICIAL: Programa = programaDe(
  { id: PILA_TRONCO, sombrero: sombreroFijo('al-empezar', 'h-torre'), bloques: [] },
  {
    id: PILA_FINAL,
    sombrero: sombreroFijo('al-recibir-fin', 'h-fin'),
    nombre: NOMBRE_MENSAJE_FIN,
    bloques: [],
  },
);

/* ─────────────────────────────── el guion ─────────────────────────────────── */

/**
 * LOS OCHO ENCARGOS, Y POR QUÉ ESTÁN EN ESTE ORDEN.
 *
 * El arco es: *equivócate, míralo, arréglalo, y ahora hazlo bien de verdad.*
 *
 *   1-2  el juego sin memoria: tres pantallas y salen las tres iguales;
 *   3    la memoria: las mismas piezas, tres pantallas distintas;
 *   4    un solo programa: dos piezas dentro de un bucle hacen los tres niveles;
 *   5    la condición: el juego pregunta por su memoria en vez de contar hasta 3;
 *   6-7  el final: un guion que espera, y el mensaje que cambia de escena;
 *   8    decirlo con palabras.
 *
 * Los encargos 3, 4 y 5 piden **quitar y rearmar** en vez de insertar en medio.
 * No es pereza: la vía sin arrastre sólo sabe añadir al final, y un encargo que
 * pidiera meter «subir de nivel» ENTRE dos «pintar» ya puestos sería imposible
 * con el dedo y con el teclado.
 */
const GUION: readonly EncargoBloques<MundoTorre>[] = [
  {
    id: 'primer-nivel',
    titulo: 'Enciende el primer nivel',
    instruccion:
      'Mira la pantalla: dice «Nivel ?». El juego todavía no sabe dónde está. Pon en el guion «poner nivel a 1» y debajo «pintar la pantalla del nivel». Pulsa ▶.',
    pista:
      '«poner nivel a 1» está en la categoría Memoria y «pintar la pantalla del nivel» en Pantalla. Toca la pieza y después toca el hueco del guion.',
    logro: {
      /*
       * La PRIMERA pantalla pintada, no la tira entera: quien se adelante y
       * arme más cosas cumple igual en vez de quedarse atrapado con el programa
       * bien hecho, que es la peor manera de perder a un alumno.
       */
      tipo: 'estado',
      comprueba: (ctx) => ctx.mundo.bitacora[0] === 'bosque',
    },
    aprendido:
      'Guardaste un 1 y apareció el bosque. El bloque de pintar no sabe solo qué dibujar: mira el número guardado en nivel.',
  },
  {
    id: 'tres-iguales',
    titulo: 'Tres pantallas, y salen las tres iguales',
    instruccion:
      'El juego tiene tres niveles. Añade dos «pintar la pantalla del nivel» más —tres en total, sin nada en medio— y pulsa ▶. Mira bien la tira de abajo antes de seguir.',
    pista:
      'Sólo hacen falta esos dos bloques más. Si ya pusiste «subir de nivel», quítalo con la ✕: eso viene en el encargo siguiente.',
    logro: {
      /*
       * Se juzga la OBSERVACIÓN —tres pantallas idénticas—, no una lista exacta
       * de fichas: así vale igual si el alumno puso el «poner nivel a 1» dos
       * veces o en otro orden, y el `aprendido` nunca miente.
       */
      tipo: 'estado',
      comprueba: (ctx) => {
        const p = pantallasDeNivel(ctx.mundo);
        return (
          p.length >= 3 &&
          p[0] === p[1] &&
          p[1] === p[2] &&
          fichasDe(ctx.programa, PILA_TRONCO).filter((f) => f === 'pintar-escena').length >= 3
        );
      },
    },
    aprendido:
      'Tres pantallas y salieron las tres iguales. Nadie cambió la memoria, así que el juego no se movió de sitio.',
  },
  {
    id: 'con-memoria',
    titulo: 'Dale memoria: sube de nivel',
    instruccion:
      'Vacía el guion de arriba con la ✕ y ármalo otra vez, ahora poniendo «subir de nivel» DESPUÉS de cada pantalla: poner nivel a 1, pintar, subir, pintar, subir, pintar. Pulsa ▶.',
    pista:
      '«subir de nivel» está en Memoria y le suma uno al número. Las piezas se añaden por el hueco de abajo, así que se arma de arriba abajo.',
    logro: {
      tipo: 'estado',
      comprueba: (ctx) => recorrioLosTres(ctx.mundo),
    },
    aprendido:
      'Ahora sí: bosque, río y torre. Las piezas son las mismas que antes; lo único que cambió es el número que el juego guarda.',
  },
  {
    id: 'un-solo-programa',
    titulo: 'Un solo programa, no tres juegos',
    instruccion:
      'Fíjate: «pintar» y «subir» se repiten tal cual. Deja sólo «poner nivel a 1» —quita las otras cinco con la ✕— y pon «repetir 3 veces» con «pintar la pantalla del nivel» y «subir de nivel» DENTRO. Pulsa ▶: tienen que salir las mismas tres pantallas.',
    pista:
      '«repetir 3 veces» está en Control. Tiene una boca: las dos piezas van dentro de la boca, no debajo del bloque.',
    logro: {
      tipo: 'estado',
      comprueba: (ctx) => {
        const tronco = fichasDe(ctx.programa, PILA_TRONCO);
        // Ningún «pintar» suelto en el tronco: el trabajo lo tiene que hacer el bucle.
        return (
          tronco.includes('repetir-3') && !tronco.includes('pintar-escena') && recorrioLosTres(ctx.mundo)
        );
      },
    },
    aprendido:
      'Dos piezas y tres niveles. Un juego con niveles no son tres juegos: es UN programa que se acuerda de en qué punto está.',
  },
  {
    id: 'que-pregunte',
    titulo: 'Que el juego pregunte, no que cuente',
    instruccion:
      'El «3» está escrito a mano: si mañana la torre tuviera cinco pisos habría que cambiarlo. Quita «repetir 3 veces» con la ✕ y pon «repetir hasta»; encájale la pregunta «¿ya no quedan niveles?» y mete dentro otra vez «pintar la pantalla del nivel» y «subir de nivel». Pulsa ▶.',
    pista:
      'La pregunta va en el hueco con forma de hexágono del «repetir hasta»: toca el hexágono en Preguntas y después toca el hueco que dice «la pregunta».',
    logro: {
      tipo: 'estado',
      comprueba: (ctx) =>
        repetirHastaCon(ctx.programa, 'sin-niveles') !== null && recorrioLosTres(ctx.mundo),
    },
    aprendido:
      'Ahora el juego no cuenta: pregunta por su memoria. Eso es una condición, y decide cuándo se cambia de nivel y cuándo se acaba.',
  },
  {
    id: 'pantalla-final',
    titulo: 'La pantalla de FIN',
    instruccion:
      'Todo juego necesita un final. A un lado hay un segundo guion, el que empieza con «al recibir «¡FIN!»». Pon dentro «pintar la pantalla de FIN». Fíjate: ese guion no cuelga de «al empezar».',
    pista:
      '«pintar la pantalla de FIN» está en Pantalla, y va DENTRO del guion de «al recibir», no en el de arriba.',
    logro: {
      /*
       * Sólo estructura, sin pedir corrida. Pedir «pulsa ▶ y comprueba que el
       * final NO sale» sonaba mejor y era una trampa: al alumno que se hubiera
       * adelantado a poner el «enviar» el final ya le saldría, y el encargo se
       * volvería imposible.
       */
      tipo: 'estado',
      comprueba: (ctx) => fichasDe(ctx.programa, PILA_FINAL).includes('pintar-final'),
    },
    aprendido:
      'Ese guion es la pantalla final del juego, y está esperando. No arranca con ▶: espera a que alguien le envíe el mensaje ¡FIN!.',
  },
  {
    id: 'cierra-el-juego',
    titulo: 'Manda el mensaje y cierra el juego',
    instruccion:
      'Al final del guion de arriba, debajo del «repetir hasta», pon «enviar el mensaje ¡FIN!» y pulsa ▶. Recorre los tres niveles y llega a la pantalla final.',
    pista:
      '«enviar el mensaje» está en Mensajes y va al final del guion de arriba, después del bucle. Si lo pones antes, el final sale primero y el juego no termina donde debe.',
    logro: {
      /*
       * `escena === 'final'` es la ÚLTIMA pantalla pintada, así que esto
       * comprueba el orden sin mirar posiciones en el guion: quien ponga el
       * mensaje antes del bucle acaba en la torre, no en el final.
       */
      tipo: 'estado',
      comprueba: (ctx) => ctx.mundo.escena === 'final' && recorrioLosTres(ctx.mundo),
    },
    aprendido:
      'Recorriste tres niveles y llegaste a la pantalla final. El mensaje no pintó nada por su cuenta: cambió de escena.',
  },
  {
    id: 'por-que',
    titulo: '¿Por qué el mismo bloque pintó tres pantallas distintas?',
    instruccion:
      'Usaste UN solo bloque «pintar la pantalla del nivel» y salieron el bosque, el río y la torre. ¿Por qué?',
    pista: 'Piensa en el número grande del marcador. ¿Era el mismo las tres veces?',
    logro: {
      tipo: 'eleccion',
      opciones: [
        'Porque el bloque de pintar sabe contar hasta tres',
        'Porque el juego guarda en qué nivel va y el bloque lo consulta',
        'Porque cada nivel es un juego distinto',
      ],
      correcta: 1,
    },
    aprendido:
      'Exacto: el bloque no sabe nada, la memoria sí. Guardar dónde vas, preguntar por ello y tener un final: con eso se construye cualquier juego por niveles.',
  },
];

/* ─────────────────────────────── el escenario ─────────────────────────────── */

const ARTE: Record<Escena, string> = {
  titulo: '🎮',
  perdida: '❓',
  bosque: '🌲',
  rio: '🌊',
  torre: '🗼',
  final: '🏆',
};

const NOMBRE_ESCENA: Record<Escena, string> = {
  titulo: 'LA TORRE DE NOVA',
  perdida: 'Nivel ?',
  bosque: 'Nivel 1 · Bosque de chispas',
  rio: 'Nivel 2 · Río de datos',
  torre: 'Nivel 3 · Torre del faro',
  final: '¡FIN!',
};

const CON_NOVA: readonly Escena[] = ['bosque', 'rio', 'torre', 'final'];

function Torre({ mundo }: EscenarioProps<MundoTorre>) {
  const sinMemoria = mundo.nivel === 0;
  return (
    <div className="jn-escenario" data-testid="jn-escenario" data-escena={mundo.escena}>
      <div className="jn-tele">
        <div className="jn-pantalla" data-testid="jn-pantalla" data-escena={mundo.escena}>
          <span className="jn-arte" aria-hidden="true">
            {ARTE[mundo.escena]}
          </span>
          {CON_NOVA.includes(mundo.escena) && (
            <span className="jn-nova" aria-hidden="true">
              🤖
            </span>
          )}
        </div>
        <p className="jn-nombre" data-testid="jn-nombre">
          {NOMBRE_ESCENA[mundo.escena]}
        </p>
      </div>

      <div className="jn-memoria" data-testid="jn-memoria" data-vacia={sinMemoria ? 'si' : undefined}>
        <span className="jn-memoria-etiqueta">memoria del juego</span>
        <span className="jn-memoria-caja">
          <span className="jn-memoria-nombre">nivel</span>
          <strong className="jn-memoria-valor" data-testid="jn-nivel">
            {sinMemoria ? '?' : mundo.nivel}
          </strong>
        </span>
      </div>

      <div className="jn-tira" data-testid="jn-tira" aria-label="Pantallas que se pintaron">
        {mundo.bitacora.length === 0 ? (
          <span className="jn-tira-vacia">Todavía no se pintó ninguna pantalla</span>
        ) : (
          mundo.bitacora.map((e, i) => (
            <span key={`${e}-${i}`} className="jn-chip" data-escena={e}>
              {ARTE[e]}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────── la clase ─────────────────────────────────── */

export const CLASE_JUEGO_CON_NIVELES: ClaseBloques<MundoTorre> = {
  actividadId: 'n5-juego-con-niveles',
  titulo: 'Historia o juego con niveles',
  marca: 'Tecnia Bloques · La Torre de Nova',
  insignia: { nombre: 'Arquitecta de niveles', emoji: '🗼' },
  minutos: 26,
  portada: {
    situacion: 'Nivel 5 · Programación en bloques III · Parada 2 de 3',
    tema: 'Historia o juego con niveles',
    objetivo:
      'Vas a salir de aquí sabiendo construir un juego de varios niveles con UN solo programa: una memoria que dice dónde vas, una pregunta que decide cuándo se cambia, y un final.',
    vasAHacer: [
      'Encender el primer nivel del juego y ver de dónde saca la pantalla.',
      'Pintar tres pantallas sin memoria… y descubrir que salen las tres iguales.',
      'Darle memoria al juego y recorrer el bosque, el río y la torre.',
      'Hacer los tres niveles con dos piezas dentro de un bucle.',
      'Cambiar el «3» por una pregunta y cerrar el juego con un mensaje.',
    ],
  },
  catalogo: CATALOGO_TORRE,
  categorias: CATEGORIAS,
  categoriaInicial: 'memoria',
  programaInicial: PROGRAMA_INICIAL,
  pilaInicial: PILA_TRONCO,
  velocidad: 420,
  mundoInicial: MUNDO_INICIAL,
  preguntar: (pregunta, bloque, mundo) => responderTorre(pregunta, mundo),
  reducir: reducirTorre,
  reiniciarMundoAlCorrer: () => ({ ...MUNDO_INICIAL }),
  guion: GUION,
  Escenario: Torre,
  bit: {
    inicio:
      'Ésta es la Torre de Nova, un juego de tres niveles. Tú no vas a jugarlo: lo vas a construir. Mira la pantalla, ahora mismo dice «Nivel ?».',
    cierre:
      'Nova llegó a la cima. Y tu juego tiene lo que tiene todo juego de verdad: memoria, una condición y un final.',
  },
  final: {
    titulo: '¡Nova llegó a la cima!',
    detalle:
      'Tres niveles, una pantalla de final y un solo programa que se acordaba de dónde iba. Así se construye un juego por niveles.',
  },
};

export function LabJuegoConNiveles(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaBloques {...props} clase={CLASE_JUEGO_CON_NIVELES} />;
}

export default LabJuegoConNiveles;
