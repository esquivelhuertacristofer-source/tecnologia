/**
 * TECNIA BLOQUES · EL INTÉRPRETE
 *
 * Recorre el árbol UN bloque cada vez. Puro: ni React, ni DOM, ni relojes. Quien
 * pone el reloj es `useBloques`; quien pinta el bloque encendido es la ventana.
 *
 * ── LA DECISIÓN QUE NO SE PUEDE AÑADIR DESPUÉS ────────────────────────────
 *
 * El intérprete viejo (`n4/estudio/programaBloques.ts`) calculaba la película
 * ENTERA antes de mover a nadie y devolvía una lista de fotogramas; cada
 * laboratorio la reproducía con su propio temporizador. Funciona, y por eso
 * duró cuatro clases, pero tiene tres consecuencias que se pagan en cuanto hay
 * ocho actividades: no se puede pausar en un bloque y seguir (no hay «dentro»,
 * sólo un índice de una lista ya escrita), no se puede leer el mundo del alumno
 * a mitad de la corrida —el teclado, el ratón, un sensor— y un programa que no
 * termina no se puede ni empezar a mirar, porque el cálculo previo se cuelga
 * antes de pintar el primer fotograma.
 *
 * Aquí la unidad es el PASO: `siguiente()` avanza exactamente un bloque, avisa
 * de lo que hizo y devuelve un estado nuevo con `nodoActivo` puesto. Pausar es
 * dejar de llamarlo; continuar es volver a llamarlo; ir paso a paso es llamarlo
 * a mano. Ninguna de las tres necesita nada más, y las tres eran imposibles
 * antes.
 *
 * ── EL TOPE ───────────────────────────────────────────────────────────────
 *
 * `por siempre` sin nada dentro, `repetir 999999`, un bloque propio que se llama
 * a sí mismo: las tres cuelgan el navegador de un niño de once años. El tope
 * cuenta TODO el trabajo del intérprete —incluido volver al principio de un
 * bucle— y no sólo las órdenes, que es lo que hace que el `por siempre` vacío
 * también se corte. Cuando salta, la ejecución termina con `fin: 'tope'` y un
 * aviso escrito en español para el alumno, no un `console.warn` para nosotros.
 */

import {
  buscarBloque,
  contarBloques,
  fichaDe,
  verboDe,
  type Args,
  type BloquePuesto,
  type FichaBloque,
  type Programa,
} from './arbolBloques';

/** Pasos de intérprete antes de dar por colgado el programa. */
export const TOPE_PASOS = 2000;

/** Llamadas anidadas antes de dar por desbocado un bloque propio. */
export const TOPE_LLAMADAS = 60;

export type FinEjecucion = 'termino' | 'bloque-parar' | 'tope' | 'vacio' | 'cortado';

export type EventoBloques =
  | { tipo: 'accion'; nodoId: string; ficha: string; accion: string; args: Args }
  | { tipo: 'mira'; nodoId: string; ficha: string; pregunta: string | null; respuesta: boolean }
  | { tipo: 'entra'; nodoId: string; ficha: string; vueltas: number | null }
  | { tipo: 'llama'; nodoId: string; ficha: string; nombre: string; encontrada: boolean }
  | { tipo: 'fin'; motivo: FinEjecucion; aviso: string | null };

type TipoBucle = 'ninguno' | 'repetir' | 'mientras' | 'hasta' | 'siempre';

interface Marco {
  lista: BloquePuesto[];
  i: number;
  /** El bloque en C que abrió este marco. Hace falta para volver a preguntarle. */
  duenio: BloquePuesto | null;
  bucle: TipoBucle;
  quedan: number;
  /** Este marco es una llamada a otra pila: al cerrarlo se devuelve la profundidad. */
  llamada: boolean;
}

export interface EstadoEjecucion {
  readonly programa: Programa;
  readonly catalogo: readonly FichaBloque[];
  readonly marcos: readonly Marco[];
  /** El bloque que se ilumina AHORA. `null` antes del primer paso y al terminar. */
  readonly nodoActivo: string | null;
  readonly pasos: number;
  readonly llamadas: number;
  readonly tope: number;
  readonly fin: FinEjecucion | null;
  /** El porqué, en español y para el alumno. Sólo cuando el final es malo. */
  readonly aviso: string | null;
}

export interface PasoBloques {
  estado: EstadoEjecucion;
  /** Lo que acaba de pasar. `null` sólo si la ejecución ya estaba terminada. */
  evento: EventoBloques | null;
}

/** Contesta un hexágono. La actividad es la dueña del mundo; el armazón pregunta. */
export type Preguntar = (pregunta: string, bloque: BloquePuesto) => boolean;

export interface OpcionesEjecucion {
  /** Qué pila arranca. Por omisión, la primera que tenga algún bloque. */
  pila?: string;
  tope?: number;
}

function avisoTope(tope: number): string {
  return (
    `El programa lleva ${tope} pasos y no termina. Seguramente hay un bucle que nunca acaba: ` +
    'mira el «por siempre» o el «repetir» y comprueba que dentro pasa algo que lo cierre.'
  );
}

const AVISO_RECURSION =
  'Un bloque se está llamando a sí mismo sin parar. Antes de volver a llamarlo tiene que ' +
  'haber algo que corte la cadena.';

const AVISO_VACIO = 'El guion está vacío: arrastra al menos un bloque antes de darle a ▶.';

/* ── arrancar ──────────────────────────────────────────────────────────────── */

export function arrancar(
  programa: Programa,
  catalogo: readonly FichaBloque[],
  opciones: OpcionesEjecucion = {},
): EstadoEjecucion {
  const tope = Math.max(1, opciones.tope ?? TOPE_PASOS);
  const elegida = opciones.pila
    ? programa.pilas.find((p) => p.id === opciones.pila)
    : programa.pilas.find((p) => p.bloques.length > 0);

  const base = {
    programa,
    catalogo,
    nodoActivo: null,
    pasos: 0,
    llamadas: 0,
    tope,
  } as const;

  if (!elegida || elegida.bloques.length === 0) {
    return { ...base, marcos: [], fin: 'vacio', aviso: AVISO_VACIO };
  }
  return {
    ...base,
    marcos: [{ lista: elegida.bloques, i: 0, duenio: null, bucle: 'ninguno', quedan: 0, llamada: false }],
    fin: null,
    aviso: null,
  };
}

/** Corta la ejecución porque el alumno pulsó ⏹. */
export function cortar(estado: EstadoEjecucion): EstadoEjecucion {
  if (estado.fin) return estado;
  return { ...estado, marcos: [], nodoActivo: null, fin: 'cortado', aviso: null };
}

/* ── un paso ───────────────────────────────────────────────────────────────── */

function vecesDe(bloque: BloquePuesto, ranura: string | undefined, pordefecto: number): number {
  const bruto = bloque.args?.[ranura ?? 'veces'];
  const n = typeof bruto === 'number' ? bruto : Number(bruto);
  if (!Number.isFinite(n) || n < 0) return pordefecto;
  return Math.trunc(n);
}

function nombreLlamada(bloque: BloquePuesto, ranura: string | undefined): string {
  const bruto = bloque.args?.[ranura ?? 'nombre'];
  return bruto === undefined ? '' : String(bruto);
}

/**
 * Avanza exactamente un bloque.
 *
 * El bucle de dentro no ejecuta más de un bloque: da vueltas sólo mientras hace
 * la contabilidad del árbol (cerrar un marco, volver al principio de un
 * `repetir`), y CADA vuelta gasta un paso del tope. Ésa es la línea que impide
 * que un `por siempre` vacío se quede girando aquí dentro sin devolver nunca el
 * control al navegador.
 */
export function siguiente(estado: EstadoEjecucion, preguntar: Preguntar): PasoBloques {
  if (estado.fin) return { estado, evento: null };

  const marcos: Marco[] = estado.marcos.map((m) => ({ ...m }));
  let pasos = estado.pasos;
  let llamadas = estado.llamadas;

  const terminar = (motivo: FinEjecucion, aviso: string | null): PasoBloques => ({
    estado: { ...estado, marcos: [], nodoActivo: null, pasos, llamadas, fin: motivo, aviso },
    evento: { tipo: 'fin', motivo, aviso },
  });

  const seguir = (nodoActivo: string, evento: EventoBloques): PasoBloques => ({
    estado: { ...estado, marcos, nodoActivo, pasos, llamadas },
    evento,
  });

  /** La respuesta del hexágono encajado. Sin hexágono, un `si` no decide nada. */
  const responder = (bloque: BloquePuesto): { pregunta: string | null; respuesta: boolean } => {
    const cond = bloque.condicion;
    if (!cond) return { pregunta: null, respuesta: false };
    const ficha = fichaDe(estado.catalogo, cond.ficha);
    if (!ficha) return { pregunta: null, respuesta: false };
    const pregunta = verboDe(ficha);
    return { pregunta, respuesta: Boolean(preguntar(pregunta, cond)) };
  };

  for (;;) {
    pasos += 1;
    if (pasos > estado.tope) return terminar('tope', avisoTope(estado.tope));

    const marco = marcos[marcos.length - 1];
    if (!marco) return terminar('termino', null);

    /* ── se acabó la lista de este marco: cerrar, o dar otra vuelta ───────── */
    if (marco.i >= marco.lista.length) {
      if (marco.bucle === 'siempre') {
        marco.i = 0;
        continue;
      }
      if (marco.bucle === 'repetir') {
        marco.quedan -= 1;
        if (marco.quedan > 0) {
          marco.i = 0;
          continue;
        }
        marcos.pop();
        continue;
      }
      if ((marco.bucle === 'mientras' || marco.bucle === 'hasta') && marco.duenio) {
        const duenio = marco.duenio;
        const { pregunta, respuesta } = responder(duenio);
        const sigue = marco.bucle === 'mientras' ? respuesta : !respuesta;
        if (sigue) marco.i = 0;
        else marcos.pop();
        return seguir(duenio.id, {
          tipo: 'mira',
          nodoId: duenio.id,
          ficha: duenio.ficha,
          pregunta,
          respuesta,
        });
      }
      if (marco.llamada) llamadas = Math.max(0, llamadas - 1);
      marcos.pop();
      continue;
    }

    /* ── el bloque que toca ───────────────────────────────────────────────── */
    const bloque = marco.lista[marco.i];
    marco.i += 1;

    const ficha = fichaDe(estado.catalogo, bloque.ficha);
    // Una ficha que ya no está en la paleta —la actividad cambió de reto sin
    // limpiar el guion— no puede tumbar la ejecución: se salta y se sigue.
    if (!ficha) continue;

    const sem = ficha.semantica;
    const ramaDe = (nombre: string) => bloque.ramas?.[nombre] ?? [];

    if (sem.tipo === 'accion') {
      return seguir(bloque.id, {
        tipo: 'accion',
        nodoId: bloque.id,
        ficha: bloque.ficha,
        accion: verboDe(ficha),
        args: bloque.args ?? {},
      });
    }

    if (sem.tipo === 'parar') {
      return terminar('bloque-parar', null);
    }

    if (sem.tipo === 'si' || sem.tipo === 'si-sino') {
      const { pregunta, respuesta } = responder(bloque);
      const rama = respuesta ? 'cuerpo' : sem.tipo === 'si-sino' ? 'sino' : null;
      if (rama) {
        marcos.push({
          lista: ramaDe(rama),
          i: 0,
          duenio: bloque,
          bucle: 'ninguno',
          quedan: 0,
          llamada: false,
        });
      }
      return seguir(bloque.id, {
        tipo: 'mira',
        nodoId: bloque.id,
        ficha: bloque.ficha,
        pregunta,
        respuesta,
      });
    }

    if (sem.tipo === 'mientras' || sem.tipo === 'hasta') {
      const { pregunta, respuesta } = responder(bloque);
      const entra = sem.tipo === 'mientras' ? respuesta : !respuesta;
      if (entra) {
        marcos.push({
          lista: ramaDe('cuerpo'),
          i: 0,
          duenio: bloque,
          bucle: sem.tipo,
          quedan: 0,
          llamada: false,
        });
      }
      return seguir(bloque.id, {
        tipo: 'mira',
        nodoId: bloque.id,
        ficha: bloque.ficha,
        pregunta,
        respuesta,
      });
    }

    if (sem.tipo === 'repetir') {
      const veces = vecesDe(bloque, sem.ranura, sem.veces ?? 1);
      if (veces > 0) {
        marcos.push({
          lista: ramaDe('cuerpo'),
          i: 0,
          duenio: bloque,
          bucle: 'repetir',
          quedan: veces,
          llamada: false,
        });
      }
      return seguir(bloque.id, {
        tipo: 'entra',
        nodoId: bloque.id,
        ficha: bloque.ficha,
        vueltas: veces,
      });
    }

    if (sem.tipo === 'por-siempre') {
      marcos.push({
        lista: ramaDe('cuerpo'),
        i: 0,
        duenio: bloque,
        bucle: 'siempre',
        quedan: 0,
        llamada: false,
      });
      return seguir(bloque.id, {
        tipo: 'entra',
        nodoId: bloque.id,
        ficha: bloque.ficha,
        vueltas: null,
      });
    }

    if (sem.tipo === 'llamar') {
      const nombre = nombreLlamada(bloque, sem.ranura);
      const destino = estado.programa.pilas.find((p) => p.nombre === nombre);
      if (destino) {
        llamadas += 1;
        if (llamadas > TOPE_LLAMADAS) return terminar('tope', AVISO_RECURSION);
        marcos.push({
          lista: destino.bloques,
          i: 0,
          duenio: bloque,
          bucle: 'ninguno',
          quedan: 0,
          llamada: true,
        });
      }
      return seguir(bloque.id, {
        tipo: 'llama',
        nodoId: bloque.id,
        ficha: bloque.ficha,
        nombre,
        encontrada: Boolean(destino),
      });
    }

    // Sombrero, condición suelta o reportero dentro de un guion: no significan
    // nada ejecutándose. `cabeEn` no deja ponerlos ahí, pero un programa de
    // arranque escrito a mano por la actividad sí puede traerlos.
  }
}

/* ── la corrida entera, de una vez ─────────────────────────────────────────── */

export interface InformeCorrida {
  programa: Programa;
  eventos: EventoBloques[];
  /** Sólo los verbos de las órdenes, en orden. Es lo que juzgan casi todos los retos. */
  acciones: string[];
  fin: FinEjecucion;
  aviso: string | null;
  pasos: number;
  bloques: number;
}

/**
 * Corre hasta el final y devuelve el parte. Es lo que usan las pruebas y lo que
 * usa el juez del reto; el alumno ve la corrida paso a paso con `siguiente`.
 */
export function ejecutarTodo(
  programa: Programa,
  catalogo: readonly FichaBloque[],
  preguntar: Preguntar,
  opciones: OpcionesEjecucion = {},
): InformeCorrida {
  let estado = arrancar(programa, catalogo, opciones);
  const eventos: EventoBloques[] = [];

  if (estado.fin) {
    eventos.push({ tipo: 'fin', motivo: estado.fin, aviso: estado.aviso });
  }
  while (!estado.fin) {
    const paso = siguiente(estado, preguntar);
    estado = paso.estado;
    if (paso.evento) eventos.push(paso.evento);
  }

  return {
    programa,
    eventos,
    acciones: eventos.flatMap((e) => (e.tipo === 'accion' ? [e.accion] : [])),
    fin: estado.fin ?? 'termino',
    aviso: estado.aviso,
    pasos: estado.pasos,
    bloques: contarBloques(programa),
  };
}

/** El bloque que se está ejecutando, ya resuelto. Para el ayudante y las pruebas. */
export function bloqueActivo(estado: EstadoEjecucion): BloquePuesto | null {
  return estado.nodoActivo ? buscarBloque(estado.programa, estado.nodoActivo) : null;
}
