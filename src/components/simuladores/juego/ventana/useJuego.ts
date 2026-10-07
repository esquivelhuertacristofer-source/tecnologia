'use client';

/**
 * TECNIA JUEGOS · EL ESTADO DE LA VENTANA
 *
 * Lo que la ventana necesita recordar: el nivel que se edita, la herramienta
 * en la mano, el actor elegido (cuyos guiones enseña el editor de bloques de
 * abajo), la partida en curso cuando se juega, y las pruebas con jugadores
 * con su versión del nivel. Todo lo que es juego —tics, físicas, guiones— es
 * del motor; aquí sólo se decide CUÁNDO se llama y se guarda lo que devuelve.
 *
 * ── EL EDITOR DE BLOQUES ES UNO, EL ACTOR ELEGIDO CAMBIA ─────────────────
 *
 * `useBloques` guarda UN programa. Al elegir otro actor se le pasa el guion
 * de ése (`reiniciar(programa)`) y, cada vez que el editor lo cambia, se
 * copia de vuelta al actor del nivel (`ponerGuiones`). Las dos escrituras van
 * en el mismo gesto para que React las agrupe: nunca hay un repintado con el
 * actor nuevo y el guion del viejo.
 *
 * ── EL RELOJ VIVE AQUÍ, NO EN EL MOTOR ───────────────────────────────────
 *
 * 60 tics por segundo con `requestAnimationFrame` y un acumulador: si un
 * cuadro tarda, se corren los tics que falten (hasta 4, para no congelar la
 * pestaña al volver de otra ventana). El motor sólo ve tics.
 *
 * ── LAS TECLAS ────────────────────────────────────────────────────────────
 *
 * Flechas o A/D para caminar; espacio, W o ↑ para saltar. El salto se
 * entrega al motor UN tic —el siguiente al `keydown`—, que es lo que el
 * sombrero «cuando pulsan ESPACIO» significa; mantener la barra no es
 * pulsarla dos veces.
 *
 * ── EDITAR PARA EL JUEGO ──────────────────────────────────────────────────
 *
 * Cualquier edición —una loseta, un actor, una propiedad, un bloque— detiene
 * la partida. Lo contrario sería jugar un nivel que ya no es el que se ve.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBloques, type Bloques, type FichaBloque } from '../../bloques';
import { guionesDe } from '../catalogo';
import { crearPrueba, perfil, vigente, type PerfilId, type Prueba, type ResultadoPrueba } from '../jugadorDePrueba';
import {
  actorEn,
  actorPorId,
  borrarCasilla,
  cambiarPropiedad,
  esSolida,
  nuevoActor,
  ponerActor,
  ponerGuiones,
  ponerLoseta,
  quitarActor,
  type Actor,
  type ClavePropiedad,
  type Loseta,
  type Nivel,
  type TipoActor,
} from '../modelo';
import { nuevaPartida, terminada, tic, type Entradas, type Partida, type Sonido } from '../partida';

export type Modo = 'editar' | 'jugar';

export type Herramienta =
  | { tipo: 'elegir' }
  | { tipo: 'borrar' }
  | { tipo: 'loseta'; loseta: Loseta }
  | { tipo: 'actor'; actor: TipoActor };

export interface PruebaEnCurso {
  perfil: PerfilId;
  progreso: number;
}

export interface OpcionesJuego {
  /** El nivel con el que arranca la clase. Se lee UNA vez. */
  inicial: Nivel;
  /** Las fichas que la clase enseña (subconjunto de `CATALOGO_JUEGO`). */
  fichas: readonly FichaBloque[];
  /** Los tics que corre de una vez el jugador de prueba antes de devolver el control. */
  nodosPorTrozo?: number;
  onSonido?: (sonido: Sonido) => void;
  /** Cada vez que una partida jugada a mano termina (ganada o perdida). */
  onPartidaTerminada?: (partida: Partida) => void;
}

export interface Juego {
  nivel: Nivel;
  modo: Modo;
  herramienta: Herramienta;
  actorElegido: Actor | null;
  /** La partida en curso, o la última que terminó. `null` antes de jugar. */
  partida: Partida | null;
  pruebas: Readonly<Partial<Record<PerfilId, ResultadoPrueba>>>;
  pruebaEnCurso: PruebaEnCurso | null;
  /** El editor de bloques del actor elegido. */
  bloques: Bloques;
  /** Cuántas partidas se han jugado a mano. */
  partidasJugadas: number;

  elegirHerramienta: (h: Herramienta) => void;
  elegirActor: (id: string | null) => void;
  /** Aplica la herramienta en la casilla. */
  tocarCasilla: (cx: number, cy: number) => void;
  cambiarPropiedad: (id: string, clave: ClavePropiedad, valor: number) => void;
  quitarActor: (id: string) => void;
  /** Sustituye el nivel entero (el botón «volver a La mina»). */
  reponerNivel: (nivel: Nivel) => void;

  jugar: () => void;
  parar: () => void;
  /** Para las pruebas y los mandos en pantalla: una tecla por programa. */
  pulsar: (tecla: 'izquierda' | 'derecha' | 'salto', abajo: boolean) => void;

  /** Lanza las pruebas con jugadores, en orden. Las que ya están vigentes no se repiten. */
  probar: (perfiles?: readonly PerfilId[]) => void;
  /** ¿La prueba de este perfil habla del nivel de ahora? */
  pruebaVigente: (id: PerfilId) => ResultadoPrueba | null;
}

const TICS_POR_SEGUNDO = 60;
const MS_POR_TIC = 1000 / TICS_POR_SEGUNDO;
const TICS_MAX_POR_CUADRO = 4;

let contadorActores = 0;

export function useJuego(opciones: OpcionesJuego): Juego {
  const [nivel, setNivel] = useState<Nivel>(opciones.inicial);
  const nivelRef = useRef(nivel);
  const [modo, setModo] = useState<Modo>('editar');
  const [herramienta, setHerramienta] = useState<Herramienta>({ tipo: 'elegir' });
  const [actorElegidoId, setActorElegidoId] = useState<string | null>(null);
  const [partida, setPartida] = useState<Partida | null>(null);
  const partidaRef = useRef<Partida | null>(null);
  const [pruebas, setPruebas] = useState<Partial<Record<PerfilId, ResultadoPrueba>>>({});
  const [pruebaEnCurso, setPruebaEnCurso] = useState<PruebaEnCurso | null>(null);
  const [partidasJugadas, setPartidasJugadas] = useState(0);

  const onSonidoRef = useRef(opciones.onSonido);
  const onTerminadaRef = useRef(opciones.onPartidaTerminada);
  useEffect(() => {
    onSonidoRef.current = opciones.onSonido;
    onTerminadaRef.current = opciones.onPartidaTerminada;
  });

  const actorElegido = useMemo(
    () => (actorElegidoId ? actorPorId(nivel, actorElegidoId) : null),
    [nivel, actorElegidoId],
  );

  const bloques = useBloques({
    catalogo: opciones.fichas,
    inicial: actorElegido?.guiones ?? { pilas: [] },
    velocidad: 0,
  });

  /* ── el nivel ────────────────────────────────────────────────────────── */

  const pararRef = useRef<() => void>(() => {});

  const aplicarNivel = useCallback((f: (n: Nivel) => Nivel) => {
    const nuevo = f(nivelRef.current);
    if (nuevo === nivelRef.current) return;
    nivelRef.current = nuevo;
    setNivel(nuevo);
    pararRef.current();
  }, []);

  /* El editor cambió el guion: se copia al actor elegido. */
  useEffect(() => {
    if (!actorElegidoId) return;
    const actor = actorPorId(nivelRef.current, actorElegidoId);
    if (!actor || actor.guiones === bloques.programa) return;
    aplicarNivel((n) => ponerGuiones(n, actorElegidoId, bloques.programa));
  }, [bloques.programa, actorElegidoId, aplicarNivel]);

  const elegirActor = useCallback(
    (id: string | null) => {
      const actor = id ? actorPorId(nivelRef.current, id) : null;
      setActorElegidoId(actor ? actor.id : null);
      bloques.reiniciar(actor ? actor.guiones : { pilas: [] });
    },
    [bloques],
  );

  const tocarCasilla = useCallback(
    (cx: number, cy: number) => {
      const n = nivelRef.current;
      const ahi = actorEn(n, cx, cy);
      switch (herramienta.tipo) {
        case 'elegir':
          elegirActor(ahi ? ahi.id : null);
          break;
        case 'borrar':
          if (ahi && ahi.id === actorElegidoId) elegirActor(null);
          aplicarNivel((m) => borrarCasilla(m, cx, cy));
          break;
        case 'loseta':
          if (ahi && herramienta.loseta !== 0) {
            elegirActor(ahi.id);
            break;
          }
          aplicarNivel((m) => ponerLoseta(m, cx, cy, herramienta.loseta));
          break;
        case 'actor': {
          if (esSolida(n, cx, cy)) break;
          const tipo = herramienta.actor;
          contadorActores += 1;
          const id = `${tipo}-${contadorActores}`;
          const nuevo = nuevoActor(tipo, cx, cy, id, guionesDe(tipo, id));
          aplicarNivel((m) => ponerActor(m, nuevo));
          elegirActor(id);
          break;
        }
        default:
          break;
      }
    },
    [herramienta, actorElegidoId, aplicarNivel, elegirActor],
  );

  const cambiarProp = useCallback(
    (id: string, clave: ClavePropiedad, valor: number) => aplicarNivel((n) => cambiarPropiedad(n, id, clave, valor)),
    [aplicarNivel],
  );

  const quitar = useCallback(
    (id: string) => {
      if (id === actorElegidoId) elegirActor(null);
      aplicarNivel((n) => quitarActor(n, id));
    },
    [actorElegidoId, elegirActor, aplicarNivel],
  );

  const reponerNivel = useCallback(
    (n: Nivel) => {
      elegirActor(null);
      aplicarNivel(() => n);
    },
    [elegirActor, aplicarNivel],
  );

  /* ── jugar ───────────────────────────────────────────────────────────── */

  const teclas = useRef<Entradas>({ izquierda: false, derecha: false, salto: false });
  const saltoPendiente = useRef(false);
  const cuadro = useRef<number | null>(null);
  const ultimo = useRef(0);
  const acumulado = useRef(0);

  const parar = useCallback(() => {
    if (cuadro.current !== null) {
      cancelAnimationFrame(cuadro.current);
      cuadro.current = null;
    }
    setModo((m) => (m === 'jugar' ? 'editar' : m));
  }, []);
  pararRef.current = parar;

  const unTic = useCallback(() => {
    const p = partidaRef.current;
    if (!p || terminada(p)) return;
    const entradas: Entradas = { ...teclas.current, salto: saltoPendiente.current };
    saltoPendiente.current = false;
    const q = tic(p, entradas);
    partidaRef.current = q;
    for (const s of q.sonidos) onSonidoRef.current?.(s);
    if (terminada(q)) {
      setPartidasJugadas((v) => v + 1);
      onTerminadaRef.current?.(q);
      pararRef.current();
    }
  }, []);

  const bucle = useCallback(
    (ahora: number) => {
      const p = partidaRef.current;
      if (!p || terminada(p)) {
        cuadro.current = null;
        return;
      }
      acumulado.current += Math.min(250, ahora - ultimo.current);
      ultimo.current = ahora;
      let corridos = 0;
      while (acumulado.current >= MS_POR_TIC && corridos < TICS_MAX_POR_CUADRO) {
        acumulado.current -= MS_POR_TIC;
        corridos += 1;
        unTic();
      }
      if (corridos >= TICS_MAX_POR_CUADRO) acumulado.current = 0;
      setPartida(partidaRef.current);
      if (partidaRef.current && !terminada(partidaRef.current)) cuadro.current = requestAnimationFrame(bucle);
      else cuadro.current = null;
    },
    [unTic],
  );

  const jugar = useCallback(() => {
    if (cuadro.current !== null) cancelAnimationFrame(cuadro.current);
    const p = nuevaPartida(nivelRef.current);
    partidaRef.current = p;
    setPartida(p);
    teclas.current = { izquierda: false, derecha: false, salto: false };
    saltoPendiente.current = false;
    acumulado.current = 0;
    ultimo.current = typeof performance !== 'undefined' ? performance.now() : 0;
    setModo('jugar');
    cuadro.current = requestAnimationFrame(bucle);
  }, [bucle]);

  const pulsar = useCallback((tecla: 'izquierda' | 'derecha' | 'salto', abajo: boolean) => {
    if (tecla === 'salto') {
      if (abajo) saltoPendiente.current = true;
      return;
    }
    teclas.current = { ...teclas.current, [tecla]: abajo };
  }, []);

  useEffect(() => {
    if (modo !== 'jugar') return;
    const de = (e: KeyboardEvent): 'izquierda' | 'derecha' | 'salto' | null => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          return 'izquierda';
        case 'ArrowRight':
        case 'd':
        case 'D':
          return 'derecha';
        case ' ':
        case 'ArrowUp':
        case 'w':
        case 'W':
          return 'salto';
        default:
          return null;
      }
    };
    const abajo = (e: KeyboardEvent) => {
      const t = de(e);
      if (!t) return;
      e.preventDefault();
      if (e.repeat) return;
      pulsar(t, true);
    };
    const arriba = (e: KeyboardEvent) => {
      const t = de(e);
      if (!t) return;
      e.preventDefault();
      pulsar(t, false);
    };
    window.addEventListener('keydown', abajo);
    window.addEventListener('keyup', arriba);
    return () => {
      window.removeEventListener('keydown', abajo);
      window.removeEventListener('keyup', arriba);
    };
  }, [modo, pulsar]);

  useEffect(
    () => () => {
      if (cuadro.current !== null) cancelAnimationFrame(cuadro.current);
    },
    [],
  );

  /* ── probar con jugadores ────────────────────────────────────────────── */

  const colaPruebas = useRef<PerfilId[]>([]);
  const pruebaActual = useRef<{ id: PerfilId; prueba: Prueba } | null>(null);
  const temporizador = useRef<number | null>(null);
  const nodosPorTrozo = opciones.nodosPorTrozo ?? 150;

  const pruebaVigente = useCallback(
    (id: PerfilId): ResultadoPrueba | null => {
      const r = pruebas[id];
      return vigente(r, nivel) ? r : null;
    },
    [pruebas, nivel],
  );

  const siguientePrueba = useCallback(() => {
    const id = colaPruebas.current.shift();
    if (!id) {
      pruebaActual.current = null;
      setPruebaEnCurso(null);
      return;
    }
    const prueba = crearPrueba(nivelRef.current, perfil(id));
    pruebaActual.current = { id, prueba };
    setPruebaEnCurso({ perfil: id, progreso: 0 });
    const paso = () => {
      const actual = pruebaActual.current;
      if (!actual) return;
      const fin = actual.prueba.avanzar(nodosPorTrozo);
      if (fin) {
        const r = actual.prueba.resultado();
        setPruebas((antes) => ({ ...antes, [actual.id]: r }));
        siguientePrueba();
        return;
      }
      setPruebaEnCurso({ perfil: actual.id, progreso: actual.prueba.progreso() });
      temporizador.current = window.setTimeout(paso, 0);
    };
    temporizador.current = window.setTimeout(paso, 0);
  }, [nodosPorTrozo]);

  const probar = useCallback(
    (perfiles: readonly PerfilId[] = ['novato', 'medio', 'experto']) => {
      parar();
      const pendientes = perfiles.filter((id) => !vigente(pruebas[id], nivelRef.current));
      colaPruebas.current = pendientes;
      if (pruebaActual.current) return;
      siguientePrueba();
    },
    [parar, pruebas, siguientePrueba],
  );

  useEffect(
    () => () => {
      if (temporizador.current !== null) window.clearTimeout(temporizador.current);
      pruebaActual.current = null;
      colaPruebas.current = [];
    },
    [],
  );

  return {
    nivel,
    modo,
    herramienta,
    actorElegido,
    partida,
    pruebas,
    pruebaEnCurso,
    bloques,
    partidasJugadas,
    elegirHerramienta: setHerramienta,
    elegirActor,
    tocarCasilla,
    cambiarPropiedad: cambiarProp,
    quitarActor: quitar,
    reponerNivel,
    jugar,
    parar,
    pulsar,
    probar,
    pruebaVigente,
  };
}
