'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  contarBloques,
  moverBloque,
  ponerArg,
  quitar,
  soltarFicha,
  type Carga,
  type Encaje,
  type FichaBloque,
  type Programa,
  type Sitio,
} from './arbolBloques';
import {
  arrancar,
  cortar,
  siguiente,
  type EstadoEjecucion,
  type EventoBloques,
  type InformeCorrida,
  type Preguntar,
} from './interpreteBloques';

/**
 * TECNIA BLOQUES · LA MÁQUINA DEL EDITOR
 *
 * Aquí vive TODO el estado: el guion, la pieza en la mano, la corrida y su
 * reloj. `VentanaBloques` no tiene ni un `useState`; recibe lo que esto devuelve
 * y lo pinta. Es el patrón de `VentanaHojas` y de `useAsistente`.
 *
 * ── EL RELOJ CONTRA LAS PRUEBAS ───────────────────────────────────────────
 *
 * `velocidad` son milisegundos por bloque, y **`velocidad: 0` no programa ni un
 * temporizador**: la corrida avanza sólo cuando alguien llama a `pasoAPaso()`.
 * De ahí salen tres cosas que se querían por separado y resultan ser la misma:
 * el modo paso a paso que piden las clases, el modo accesible sin animación, y
 * unas pruebas que comprueban la ejecución entera sin tocar un reloj falso.
 *
 * ── EDITAR MIENTRAS CORRE ─────────────────────────────────────────────────
 *
 * Se puede, y no rompe nada: `arrancar()` se queda con una FOTO del árbol, así
 * que borrar el bloque que se está ejecutando no deja al intérprete leyendo un
 * hueco. La corrida termina la foto que empezó; el bloque borrado simplemente
 * deja de iluminarse porque ya no está en la pantalla. Ésta es la razón de que
 * el intérprete lleve `programa` dentro de su estado en vez de leerlo de fuera.
 */

export interface OpcionesBloques {
  catalogo: readonly FichaBloque[];
  /** Con qué guion se empieza. Se lee UNA vez, al montar. */
  inicial: Programa;
  /** Milisegundos por bloque. **0 = sin reloj**: sólo avanza `pasoAPaso()`. */
  velocidad?: number;
  tope?: number;
  /** Qué pila arranca con ▶. Por omisión, la primera que tenga bloques. */
  pila?: string;
  /** Cómo contesta el mundo de la actividad a los hexágonos. */
  preguntar?: Preguntar;
  /** Cada bloque ejecutado, en vivo. Aquí es donde la actividad mueve su escenario. */
  onEvento?: (evento: EventoBloques) => void;
  /** Al acabar la corrida, con el parte entero para el juez del reto. */
  onFin?: (parte: InformeCorrida) => void;
}

export type ResultadoCorrer = 'ok' | 'ocupado';

/** Lo último que rebotó, para que la ventana pinte el sitio en rojo y lo diga. */
export interface Rechazo {
  sitio: Sitio;
  aviso: string;
}

export interface Bloques {
  programa: Programa;
  /** La pieza que el alumno lleva en la mano, por toque o por arrastre. */
  elegida: Carga | null;
  nodoActivo: string | null;
  corriendo: boolean;
  enPausa: boolean;
  velocidad: number;
  /** El aviso del intérprete: el tope de pasos, el guion vacío. */
  aviso: string | null;
  rechazo: Rechazo | null;
  /** El parte de la última corrida terminada. Lo que come `Reto.juzgar`. */
  parte: InformeCorrida | null;

  elegir: (carga: Carga | null) => void;
  soltar: (sitio: Sitio, carga?: Carga) => Encaje;
  quitarBloque: (id: string) => void;
  ponerValor: (id: string, ranura: string, valor: string | number) => void;
  reiniciar: (programa?: Programa) => void;

  /**
   * Arranca. `pila` dice cuál: sin ella, la de `OpcionesBloques.pila`.
   *
   * El argumento existe para las actividades por disparador —una placa
   * micro:bit, un constructor de flujos—, donde cada sombrero es un guion
   * distinto y quien decide cuál corre es lo que acaba de pasar en el mundo,
   * no una opción escrita al montar el editor.
   */
  correr: (pila?: string) => ResultadoCorrer;
  pausar: () => void;
  continuar: () => void;
  pasoAPaso: () => void;
  parar: () => void;
  cambiarVelocidad: (ms: number) => void;
}

const SIEMPRE_NO: Preguntar = () => false;

export function useBloques(opciones: OpcionesBloques): Bloques {
  const [programa, setPrograma] = useState<Programa>(opciones.inicial);
  const [elegida, setElegida] = useState<Carga | null>(null);
  const [rechazo, setRechazo] = useState<Rechazo | null>(null);
  const [ejecucion, setEjecucion] = useState<EstadoEjecucion | null>(null);
  const [enPausa, setEnPausa] = useState(false);
  const [velocidad, setVelocidad] = useState(Math.max(0, opciones.velocidad ?? 0));
  const [parte, setParte] = useState<InformeCorrida | null>(null);

  /*
   * El guion se guarda DOS veces a propósito: el estado es lo que se pinta y la
   * referencia es lo que leen los manejadores. Sin la referencia, soltar una
   * pieza y darle a ▶ en el mismo gesto arrancaría el guion de antes de soltar.
   */
  const programaRef = useRef(programa);
  const ejecRef = useRef<EstadoEjecucion | null>(null);
  const eventosRef = useRef<EventoBloques[]>([]);
  const contador = useRef(0);

  const catalogoRef = useRef(opciones.catalogo);
  const preguntarRef = useRef<Preguntar>(opciones.preguntar ?? SIEMPRE_NO);
  const onEventoRef = useRef(opciones.onEvento);
  const onFinRef = useRef(opciones.onFin);
  const arranqueRef = useRef({ pila: opciones.pila, tope: opciones.tope });
  useEffect(() => {
    catalogoRef.current = opciones.catalogo;
    preguntarRef.current = opciones.preguntar ?? SIEMPRE_NO;
    onEventoRef.current = opciones.onEvento;
    onFinRef.current = opciones.onFin;
    arranqueRef.current = { pila: opciones.pila, tope: opciones.tope };
  });

  const aplicar = useCallback((nuevo: Programa) => {
    programaRef.current = nuevo;
    setPrograma(nuevo);
  }, []);

  const cerrar = useCallback((estado: EstadoEjecucion) => {
    const informe: InformeCorrida = {
      programa: estado.programa,
      eventos: eventosRef.current.slice(),
      acciones: eventosRef.current.flatMap((e) => (e.tipo === 'accion' ? [e.accion] : [])),
      fin: estado.fin ?? 'termino',
      aviso: estado.aviso,
      pasos: estado.pasos,
      bloques: contarBloques(estado.programa),
    };
    setParte(informe);
    onFinRef.current?.(informe);
  }, []);

  /*
   * Un paso. Los avisos salen FUERA del `setState`: React puede repetir el
   * cuerpo de un actualizador, y un escenario que recibe dos veces la misma
   * orden mueve al muñeco el doble.
   */
  const avanzar = useCallback(() => {
    const actual = ejecRef.current;
    if (!actual || actual.fin) return;
    const paso = siguiente(actual, preguntarRef.current);
    ejecRef.current = paso.estado;
    setEjecucion(paso.estado);
    if (paso.evento) {
      eventosRef.current.push(paso.evento);
      onEventoRef.current?.(paso.evento);
    }
    if (paso.estado.fin) cerrar(paso.estado);
  }, [cerrar]);

  const corriendo = ejecucion !== null && ejecucion.fin === null;

  /* El reloj. Con `velocidad` 0 este efecto no llega a crear nada. */
  useEffect(() => {
    if (!corriendo || enPausa || velocidad <= 0) return;
    const t = setInterval(avanzar, velocidad);
    return () => clearInterval(t);
  }, [corriendo, enPausa, velocidad, avanzar]);

  const correr = useCallback((pila?: string): ResultadoCorrer => {
    // Dos ▶ seguidos no arrancan dos corridas: la segunda rebota. Se mira la
    // referencia y no el estado porque los dos clics pueden caer en el mismo
    // tic, antes de que React haya repintado.
    if (ejecRef.current && !ejecRef.current.fin) return 'ocupado';
    eventosRef.current = [];
    setParte(null);
    setEnPausa(false);
    const inicio = arrancar(programaRef.current, catalogoRef.current, {
      ...arranqueRef.current,
      ...(pila === undefined ? {} : { pila }),
    });
    ejecRef.current = inicio;
    setEjecucion(inicio);
    // Un guion vacío ya nace terminado, con su aviso puesto: se cierra aquí
    // mismo para que la actividad se entere igual que de cualquier otro final.
    if (inicio.fin) {
      const evento: EventoBloques = { tipo: 'fin', motivo: inicio.fin, aviso: inicio.aviso };
      eventosRef.current.push(evento);
      onEventoRef.current?.(evento);
      cerrar(inicio);
    }
    return 'ok';
  }, [cerrar]);

  const parar = useCallback(() => {
    const actual = ejecRef.current;
    if (!actual || actual.fin) return;
    const cortada = cortar(actual);
    ejecRef.current = cortada;
    setEjecucion(cortada);
    setEnPausa(false);
    const evento: EventoBloques = { tipo: 'fin', motivo: 'cortado', aviso: null };
    eventosRef.current.push(evento);
    onEventoRef.current?.(evento);
    cerrar(cortada);
  }, [cerrar]);

  const pausar = useCallback(() => setEnPausa(true), []);
  const continuar = useCallback(() => setEnPausa(false), []);

  /* Un bloque a mano. Si no hay corrida, arranca una y la deja en pausa. */
  const pasoAPaso = useCallback(() => {
    if (!ejecRef.current || ejecRef.current.fin) {
      if (correr() === 'ocupado') return;
      setEnPausa(true);
    }
    avanzar();
  }, [avanzar, correr]);

  const cambiarVelocidad = useCallback((ms: number) => setVelocidad(Math.max(0, ms)), []);

  /* ── edición ─────────────────────────────────────────────────────────────── */

  const elegir = useCallback((carga: Carga | null) => {
    setRechazo(null);
    setElegida(carga);
  }, []);

  const soltar = useCallback(
    (sitio: Sitio, carga?: Carga): Encaje => {
      const cual = carga ?? elegida;
      if (!cual) {
        // Tocar un hueco con las manos vacías no es un error del alumno: es la
        // mitad de la segunda vía de encaje, la de tableta. Se le dice cuál es
        // la otra mitad.
        const aviso = 'Primero toca una pieza de la paleta y después el hueco.';
        setRechazo({ sitio, aviso });
        return { ok: false, motivo: 'ficha-desconocida', aviso };
      }

      const resultado =
        cual.tipo === 'ficha'
          ? soltarFicha(
              programaRef.current,
              catalogoRef.current,
              sitio,
              cual.id,
              `blq-${(contador.current += 1)}`,
            )
          : moverBloque(programaRef.current, catalogoRef.current, cual.id, sitio);

      if (!resultado.encaje.ok) {
        setRechazo({ sitio, aviso: resultado.encaje.aviso });
        return resultado.encaje;
      }
      setRechazo(null);
      setElegida(null);
      aplicar(resultado.programa);
      return resultado.encaje;
    },
    [elegida, aplicar],
  );

  const quitarBloque = useCallback(
    (id: string) => {
      setRechazo(null);
      aplicar(quitar(programaRef.current, id));
    },
    [aplicar],
  );

  const ponerValor = useCallback(
    (id: string, ranura: string, valor: string | number) => {
      aplicar(ponerArg(programaRef.current, id, ranura, valor));
    },
    [aplicar],
  );

  const reiniciar = useCallback(
    (nuevo?: Programa) => {
      ejecRef.current = null;
      eventosRef.current = [];
      setEjecucion(null);
      setEnPausa(false);
      setParte(null);
      setElegida(null);
      setRechazo(null);
      if (nuevo) aplicar(nuevo);
    },
    [aplicar],
  );

  return {
    programa,
    elegida,
    nodoActivo: corriendo ? (ejecucion?.nodoActivo ?? null) : null,
    corriendo,
    enPausa,
    velocidad,
    aviso: ejecucion?.aviso ?? null,
    rechazo,
    parte,
    elegir,
    soltar,
    quitarBloque,
    ponerValor,
    reiniciar,
    correr,
    pausar,
    continuar,
    pasoAPaso,
    parar,
    cambiarVelocidad,
  };
}
