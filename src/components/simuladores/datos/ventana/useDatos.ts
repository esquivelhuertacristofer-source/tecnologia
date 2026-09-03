'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cambioPermitido, lineasBajoLlave } from '../../codigo/ventana/tiposCodigo';
import { BASE_VACIA, esquemaDe, type Base, type TablaDeEsquema } from '../modelo';
import {
  correr as correrSQL,
  crearSesion,
  deshacer as deshacerSesion,
  rehacer as rehacerSesion,
  type Sesion,
} from '../motor';
import { colorearSQL } from './coloreadoSQL';
import type { LineaPintada } from '../../codigo/ventana/coloreado';
import {
  type EjecucionSQL,
  type GuionDatos,
  type PasoDatos,
  type ResumenDatos,
} from './tiposDatos';

/**
 * TECNIA DATOS · LA MÁQUINA DEL EDITOR DE CONSULTAS
 *
 * Todo el estado vive aquí. `VentanaDatos` no tiene ni un `useState`: recibe
 * lo que este gancho devuelve y lo pinta. Es el mismo trato que
 * `useCodigo`/`VentanaCodigo` y `useAsistente`/`VentanaAsistente`.
 *
 * ── La sesión va en una referencia, la foto se saca al TOCARLA ─────────────
 *
 * `Sesion` (`../motor.ts`) es del mismo tipo de objeto que `Maquina` en
 * `codigo/maquina.ts`: `correr`, `deshacer` y `rehacer` la CAMBIAN por dentro
 * (empujan o sacan de `pila`/`deshechas`, reasignan `base`) y no devuelven una
 * copia. Eso es lo que hace barato deshacer un `DELETE` sin `WHERE` sobre una
 * tabla de diez mil filas: lo que se guarda en la pila es un array de
 * punteros a bases que ya existían, no una copia de los datos. Así que la
 * sesión vive en un `useRef`, y cada vez que se la toca se saca una foto
 * (`retratarSesion`) que sí es estado. A diferencia de `Ejecucion` en
 * `codigo/`, aquí la foto no necesita copiar nada a mano: `Base` es inmutable
 * por decisión del motor (`modelo.ts`, decisión 1) — cada instrucción
 * devuelve una base NUEVA — así que guardar la referencia tal cual en
 * `useState` ya es una foto fija.
 *
 * ── Lo que este gancho NO hace ──────────────────────────────────────────────
 *
 * No sabe si el alumno acertó. Los encargos traen su predicado escrito por la
 * clase; aquí sólo se llama y se cuenta (canon, prueba 3).
 */

export interface OpcionesDatos {
  /** El SQL con el que arranca la clase. */
  plantilla: string;
  /** Con qué tablas arranca la sesión. Vacía si la clase empieza desde cero (n10-modela-tus-datos). */
  baseInicial?: Base;
  /** Líneas que el alumno no puede tocar, o `'todo'` si la consulta viene dada. */
  soloLectura?: number[] | 'todo';
  guion?: GuionDatos;
  onAvance?: (avance: number) => void;
  onTerminado?: (r: ResumenDatos) => void;
}

export interface AvisoDatos {
  /** Sube en cada aviso aunque el texto se repita: ver `codigo/useCodigo.ts` para el motivo. */
  id: number;
  texto: string;
  tono: 'aviso' | 'candado';
}

export interface EncargoDatos {
  paso: PasoDatos;
  indice: number;
  total: number;
  hecho: boolean;
  pistaVisible: boolean;
  eleccion: number | null;
}

export interface Datos {
  // ── el texto ─────────────────────────────────────────────────────────────
  texto: string;
  /** Devuelve `false` si el cambio se rechazó por tocar una línea bajo llave. */
  escribir: (texto: string) => boolean;
  lineas: LineaPintada[];
  bajoLlave: ReadonlySet<number>;
  /** `true` cuando la consulta entera viene dada y no se puede escribir. */
  soloLectura: boolean;
  editable: boolean;
  avisarBloqueo: () => void;

  // ── la base y el esquema ─────────────────────────────────────────────────
  base: Base;
  esquema: TablaDeEsquema[];
  puedeDeshacer: boolean;
  puedeRehacer: boolean;
  deshacer: () => void;
  rehacer: () => void;

  // ── la ejecución ─────────────────────────────────────────────────────────
  /** El resultado de la última vez que se pulsó ▶. `null` si todavía no se ha pulsado. */
  ejecucion: EjecucionSQL | null;
  /** `false` en cuanto el texto cambia después de esa ejecución: ya no retrata lo que hay escrito. */
  resultadoVigente: boolean;
  ejecutar: () => void;
  reiniciar: () => void;

  // ── señalar ──────────────────────────────────────────────────────────────
  senalarLinea: (linea: number) => void;
  foco: { linea: number; sello: number } | null;
  aviso: AvisoDatos | null;
  descartarAviso: () => void;

  // ── el guion ─────────────────────────────────────────────────────────────
  encargo: EncargoDatos | null;
  hechos: number;
  elegir: (opcion: number) => void;
  confirmar: () => void;
  siguienteEncargo: () => void;
  mostrarPista: () => void;
  terminado: boolean;
}

const normalizar = (t: string): string => t.replace(/\r\n?/g, '\n');

export function useDatos(opciones: OpcionesDatos): Datos {
  const { plantilla, guion } = opciones;

  const sesionRef = useRef<Sesion>(crearSesion(opciones.baseInicial ?? BASE_VACIA));

  const [texto, setTexto] = useState(() => normalizar(plantilla));
  /* El mismo valor con el que se creó `sesionRef` un momento antes — sin leer
   * la referencia, que el linter de reglas de React prohíbe durante el
   * render (aunque aquí sea seguro, por ser un inicializador perezoso). */
  const [base, setBase] = useState<Base>(() => opciones.baseInicial ?? BASE_VACIA);
  const [puedeDeshacer, setPuedeDeshacer] = useState(false);
  const [puedeRehacer, setPuedeRehacer] = useState(false);
  const [ejecucion, setEjecucion] = useState<EjecucionSQL | null>(null);
  const [resultadoVigente, setResultadoVigente] = useState(false);
  const [aviso, setAviso] = useState<AvisoDatos | null>(null);
  const [foco, setFoco] = useState<{ linea: number; sello: number } | null>(null);

  const avisoRef = useRef(0);
  const selloRef = useRef(0);
  const tropiezosRef = useRef(0);
  const inicioRef = useRef(0);
  useEffect(() => {
    inicioRef.current = Date.now();
  }, []);

  const opcionesRef = useRef(opciones);
  useEffect(() => {
    opcionesRef.current = opciones;
  });

  const bajoLlave = useMemo(() => lineasBajoLlave(opciones.soloLectura), [opciones.soloLectura]);
  const soloLectura = opciones.soloLectura === 'todo';
  const editable = !soloLectura;

  const avisar = useCallback((texto: string, tono: AvisoDatos['tono'] = 'aviso') => {
    avisoRef.current += 1;
    setAviso({ id: avisoRef.current, texto, tono });
  }, []);

  const avisarBloqueo = useCallback(() => {
    if (soloLectura) {
      avisar('Esta consulta viene escrita: aquí toca leerla y ejecutarla, no cambiarla 🔒', 'candado');
      return;
    }
    avisar('Esa línea viene puesta por la clase y no se puede cambiar: tiene candado 🔒', 'candado');
  }, [soloLectura, avisar]);

  /** Foto de la sesión: se llama justo después de `correr`, `deshacer` o `rehacer`. */
  const retratarSesion = useCallback(() => {
    setBase(sesionRef.current.base);
    setPuedeDeshacer(sesionRef.current.pila.length > 0);
    setPuedeRehacer(sesionRef.current.deshechas.length > 0);
  }, []);

  // ── El texto ─────────────────────────────────────────────────────────────

  const escribir = useCallback(
    (crudo: string) => {
      const nuevo = normalizar(crudo);
      if (nuevo === texto) return true;
      if (!editable) {
        avisarBloqueo();
        return false;
      }
      if (!cambioPermitido(texto, nuevo, bajoLlave)) {
        avisarBloqueo();
        return false;
      }
      setTexto(nuevo);
      /* En cuanto se toca la consulta, el error y la tabla de la ejecución
       * anterior dejan de retratar lo que hay escrito: seguir señalando su
       * línea sería apuntar a un texto que ya no existe. Los resultados no se
       * borran —`VentanaDatos` los sigue enseñando con un aviso de que son de
       * antes del cambio—, que es exactamente lo que decidió `useCodigo` con
       * la salida de la consola. */
      setResultadoVigente(false);
      return true;
    },
    [texto, editable, bajoLlave, avisarBloqueo],
  );

  const lineas = useMemo(() => colorearSQL(texto), [texto]);

  // ── La sesión: ejecutar, deshacer, rehacer ──────────────────────────────

  const ejecutar = useCallback(() => {
    if (texto.trim() === '') {
      avisar('Escribe una consulta antes de pulsar ▶ Ejecutar.');
      return;
    }
    const r = correrSQL(sesionRef.current, texto);
    setEjecucion(r);
    setResultadoVigente(true);
    retratarSesion();
    if (!r.ok) tropiezosRef.current += 1;
  }, [texto, avisar, retratarSesion]);

  const deshacer = useCallback(() => {
    if (!deshacerSesion(sesionRef.current)) return;
    retratarSesion();
  }, [retratarSesion]);

  const rehacer = useCallback(() => {
    if (!rehacerSesion(sesionRef.current)) return;
    retratarSesion();
  }, [retratarSesion]);

  const reiniciar = useCallback(() => {
    sesionRef.current = crearSesion(opcionesRef.current.baseInicial ?? BASE_VACIA);
    retratarSesion();
    setTexto(normalizar(opcionesRef.current.plantilla));
    setEjecucion(null);
    setResultadoVigente(false);
    setAviso(null);
  }, [retratarSesion]);

  const senalarLinea = useCallback((linea: number) => {
    selloRef.current += 1;
    setFoco({ linea, sello: selloRef.current });
  }, []);

  const descartarAviso = useCallback(() => setAviso(null), []);

  const esquema = useMemo(() => esquemaDe(base), [base]);

  // ── El guion ─────────────────────────────────────────────────────────────

  const pasos = useMemo(() => guion?.pasos ?? [], [guion]);
  const [indice, setIndice] = useState(0);
  const [hechosIds, setHechosIds] = useState<string[]>([]);
  const [pistaPedida, setPistaPedida] = useState(false);
  const [eleccion, setEleccion] = useState<number | null>(null);

  const pasoActual = pasos[indice] ?? null;
  const hecho = pasoActual ? hechosIds.includes(pasoActual.id) : false;

  const marcarHecho = useCallback((id: string) => {
    setHechosIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  /**
   * Avisar del avance va en un EFECTO, no dentro del `setHechosIds`.
   *
   * Es el mismo defecto que se curó en `useCodigo` el 15-ago-2026 y que este
   * armazón había heredado al copiarle el guion, palabra por palabra:
   *
   * 1. Una función de actualización corre **durante el pintado**, así que la
   *    clase no podía mover estado ahí dentro — y lo primero que hace una clase
   *    con `onAvance` es llamar a `useLabActividad.avanzar()`, que mueve estado
   *    y llama a `onProgress` del anfitrión.
   * 2. Peor: en modo estricto —el que Next trae de fábrica— React **invoca dos
   *    veces** el actualizador a propósito, para cazar justo esto. `onAvance`
   *    salía dos veces por encargo y `onTerminado` dos al cerrar: la barra de
   *    progreso avanzaba el doble y la actividad se completaba dos veces.
   *
   * Con el aviso aquí sale **después** de pintar y una sola vez: el contador de
   * avisados es un `ref`, así que el segundo pase del modo estricto no repite
   * nada. Lo observable no cambia: mismo `onAvance` con la misma fracción, y
   * `onTerminado` una vez al completar el último encargo.
   */
  const avisadosRef = useRef(0);
  useEffect(() => {
    const hechos = hechosIds.length;
    if (hechos === 0 || hechos === avisadosRef.current) return;
    avisadosRef.current = hechos;
    const total = pasos.length;
    opcionesRef.current.onAvance?.(total === 0 ? 1 : hechos / total);
    if (total > 0 && hechos >= total) {
      opcionesRef.current.onTerminado?.({
        encargos: total,
        hechos,
        tropiezos: tropiezosRef.current,
        segundos: inicioRef.current === 0 ? 0 : Math.round((Date.now() - inicioRef.current) / 1000),
      });
    }
  }, [hechosIds, pasos.length]);

  /**
   * Preguntarle a la clase si el encargo está hecho. Igual que en
   * `useCodigo`: el predicado lo escribe la clase y **puede reventar**, así
   * que se atrapa, cuenta como «todavía no» y se dice en voz alta.
   */
  const preguntar = useCallback(
    (paso: PasoDatos): boolean => {
      try {
        if (paso.logro.tipo === 'programa') return paso.logro.comprueba(texto);
        if (paso.logro.tipo === 'ejecucion') return ejecucion ? paso.logro.comprueba(ejecucion, texto) : false;
      } catch {
        avisar(`El encargo «${paso.titulo}» no se pudo comprobar: revisa su «comprueba» en el guion.`);
      }
      return false;
    },
    [texto, ejecucion, avisar],
  );

  /*
   * Los encargos que se leen de la consulta o del resultado se comprueban
   * solos. Los de elegir y confirmar tienen su botón.
   *
   * El `eslint-disable` es el mismo que lleva `useCodigo`, y por la misma
   * carve-out que la propia regla escribe: **el sistema externo es la sesión de
   * SQL**. La base vive en un `sesionRef` mutable que no avisa a React de nada;
   * lo único que React ve es la foto que se saca al tocarla. Que un encargo
   * pase a estar hecho es exactamente «estado de React que sigue al estado de
   * un sistema de fuera», y no se puede derivar al pintar: el encargo hecho
   * **se queda hecho** aunque después el alumno reescriba la consulta.
   *
   * Antes del 15-ago-2026 esta línea no saltaba porque `marcarHecho` llevaba
   * dentro más cosas que el `setState` —los avisos de `onAvance` y
   * `onTerminado`, que era justo el defecto—- y el analizador no la veía como
   * un `setState` pelado. Que ahora salte es señal de que aquello se limpió.
   */
  useEffect(() => {
    if (!pasoActual || hecho) return;
    if (pasoActual.logro.tipo !== 'programa' && pasoActual.logro.tipo !== 'ejecucion') return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (preguntar(pasoActual)) marcarHecho(pasoActual.id);
  }, [pasoActual, hecho, preguntar, marcarHecho]);

  const pistaVisible = pistaPedida || (!hecho && resultadoVigente && ejecucion !== null);

  const elegir = useCallback(
    (opcion: number) => {
      if (!pasoActual || pasoActual.logro.tipo !== 'eleccion') return;
      setEleccion(opcion);
      if (opcion === pasoActual.logro.correcta) marcarHecho(pasoActual.id);
      else {
        tropiezosRef.current += 1;
        setPistaPedida(true);
      }
    },
    [pasoActual, marcarHecho],
  );

  const confirmar = useCallback(() => {
    if (!pasoActual || pasoActual.logro.tipo !== 'confirma') return;
    marcarHecho(pasoActual.id);
  }, [pasoActual, marcarHecho]);

  const siguienteEncargo = useCallback(() => {
    setIndice((i) => Math.min(i + 1, Math.max(0, pasos.length - 1)));
    setPistaPedida(false);
    setEleccion(null);
  }, [pasos.length]);

  const mostrarPista = useCallback(() => setPistaPedida(true), []);

  const encargo: EncargoDatos | null = pasoActual
    ? { paso: pasoActual, indice, total: pasos.length, hecho, pistaVisible, eleccion }
    : null;

  return {
    texto,
    escribir,
    lineas,
    bajoLlave,
    soloLectura,
    editable,
    avisarBloqueo,

    base,
    esquema,
    puedeDeshacer,
    puedeRehacer,
    deshacer,
    rehacer,

    ejecucion,
    resultadoVigente,
    ejecutar,
    reiniciar,

    senalarLinea,
    foco,
    aviso,
    descartarAviso,

    encargo,
    hechos: hechosIds.length,
    elegir,
    confirmar,
    siguienteEncargo,
    mostrarPista,
    terminado: pasos.length > 0 && hechosIds.length >= pasos.length,
  };
}
