'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ErrorPy } from '../errores';
import {
  correr,
  crearMaquina,
  lineaActual,
  pasoDeLinea,
  pilaDeLlamadas,
  responder,
  variables,
  type Maquina,
  type Topes,
} from '../maquina';
import { colorear, type LineaPintada } from './coloreado';
import {
  EJECUCION_VACIA,
  cambioPermitido,
  lineasBajoLlave,
  velocidadDe,
  type Ejecucion,
  type FaseCodigo,
  type GuionCodigo,
  type PasoCodigo,
  type ResumenCodigo,
  type VelocidadId,
} from './tiposCodigo';

/**
 * TECNIA CÓDIGO · LA MÁQUINA DEL EDITOR
 *
 * Todo el estado vive aquí. `VentanaCodigo` no tiene ni un `useState`: recibe
 * lo que este gancho devuelve y lo pinta. Es el patrón de `VentanaHojas` y de
 * `useAsistente`.
 *
 * ── La decisión que ordena el archivo: la máquina va en una referencia, y la
 *    foto se saca al TOCARLA, no al pintar ────────────────────────────────────
 *
 * `Maquina` es un objeto **mutable**: `paso(m)` la cambia por dentro y no
 * devuelve nada. Eso es lo que hace barato el paso a paso —no se copia la
 * memoria del programa en cada instrucción— y a la vez lo que hace que React no
 * se entere de nada. Así que la máquina vive en un `useRef`.
 *
 * Lo que **no** se puede hacer es leer esa referencia mientras se pinta: React
 * lo prohíbe y su regla de lint lo caza. Así que cada vez que se toca la
 * máquina se saca una **foto inmutable** (`Ejecucion`) y esa foto sí es estado.
 * De rebote sale mejor: la ventana recibe siempre un objeto que no cambia bajo
 * sus pies, y comparar dos fotos es comparar dos objetos.
 *
 * ── Lo que este gancho NO hace ─────────────────────────────────────────────
 *
 * No sabe si el alumno acertó. Los encargos traen su predicado escrito por la
 * clase; aquí sólo se llama y se cuenta (canon, prueba 3).
 */

export interface OpcionesCodigo {
  /** El código con el que arranca la clase. */
  plantilla: string;
  /** Lo que responde `input()` cuando lo pida, en orden. Al agotarse, pregunta al alumno. */
  entradas?: string[];
  /** Líneas que el alumno no puede tocar, o `'todo'` si el programa viene dado. */
  soloLectura?: number[] | 'todo';
  guion?: GuionCodigo;
  /** Para bajar el tope de pasos en una clase que enseña el bucle infinito, o en una prueba. */
  topes?: Partial<Topes>;
  velocidad?: VelocidadId;
  onAvance?: (avance: number) => void;
  onTerminado?: (r: ResumenCodigo) => void;
}

export interface Aviso {
  /**
   * Sube en cada aviso **aunque el texto se repita**, y no es un detalle: el
   * `<textarea>` es controlado, y si al rechazar un cambio el estado no se
   * mueve, React puede no repintar y el DOM se queda con lo que el alumno
   * tecleó — o sea, con la línea bajo llave ya rota en pantalla.
   */
  id: number;
  texto: string;
  tono: 'aviso' | 'candado';
}

export interface Encargo {
  paso: PasoCodigo;
  indice: number;
  total: number;
  hecho: boolean;
  /** Se enseña sola tras el primer intento fallido, o cuando la clase la pide. */
  pistaVisible: boolean;
  /** Lo que eligió en un encargo de opciones, o `null`. */
  eleccion: number | null;
}

export interface Codigo {
  // ── el texto ─────────────────────────────────────────────────────────────
  texto: string;
  /** Devuelve `false` si el cambio se rechazó por tocar una línea bajo llave. */
  escribir: (texto: string) => boolean;
  lineas: LineaPintada[];
  bajoLlave: ReadonlySet<number>;
  /** `true` cuando el programa entero viene dado y no se puede escribir. */
  soloLectura: boolean;
  /** `false` mientras hay un programa en marcha: el editor se congela. */
  editable: boolean;
  avisarBloqueo: () => void;

  // ── la ejecución ─────────────────────────────────────────────────────────
  ejecucion: Ejecucion;
  fase: FaseCodigo;
  ejecutar: () => void;
  parar: () => void;
  unPaso: () => void;
  reiniciar: () => void;
  limpiarConsola: () => void;
  velocidad: VelocidadId;
  cambiarVelocidad: (v: VelocidadId) => void;

  // ── la consola ───────────────────────────────────────────────────────────
  borrador: string;
  escribirBorrador: (v: string) => void;
  contestar: () => void;

  // ── señalar ──────────────────────────────────────────────────────────────
  /** Lleva el cursor a una línea. Sube el sello para que el editor sepa que es nuevo. */
  senalarLinea: (linea: number) => void;
  foco: { linea: number; sello: number } | null;
  aviso: Aviso | null;
  descartarAviso: () => void;

  // ── el guion ─────────────────────────────────────────────────────────────
  encargo: Encargo | null;
  hechos: number;
  elegir: (opcion: number) => void;
  confirmar: () => void;
  siguienteEncargo: () => void;
  mostrarPista: () => void;
  terminado: boolean;
}

/** `lista` es una máquina recién nacida: todavía no ha dado un paso, pero anda. */
function enMarcha(m: Maquina): boolean {
  return m.estado === 'lista' || m.estado === 'corriendo';
}

/**
 * La foto de la máquina. Pura: mismos argumentos, misma foto.
 *
 * `corriendo` y `detenida` los pone quien la saca porque **no están en la
 * máquina**: la máquina no sabe de relojes ni de alumnos que pulsan ⏹.
 */
function foto(m: Maquina | null, corriendo: boolean, detenida: boolean): Ejecucion {
  if (!m) return EJECUCION_VACIA;

  let fase: FaseCodigo;
  if (m.estado === 'error') fase = 'error';
  else if (m.estado === 'terminada') fase = 'terminada';
  else if (m.estado === 'esperando') fase = 'esperando';
  else if (detenida) fase = 'detenida';
  else if (corriendo) fase = 'corriendo';
  else fase = 'pausada';

  const linea = enMarcha(m) || m.estado === 'esperando' ? lineaActual(m) : 0;
  return {
    fase,
    estadoMaquina: m.estado,
    salida: [...m.salida],
    variables: variables(m),
    pilaDeLlamadas: pilaDeLlamadas(m),
    error: m.error,
    linea,
    lineaSenalada: m.error ? m.error.linea : linea,
    pasos: m.pasos,
    pregunta: m.estado === 'esperando' ? m.pregunta : null,
  };
}

/** El programa ni siquiera arrancó: está mal escrito. No hay máquina que retratar. */
function fotoDelArranqueFallido(error: ErrorPy): Ejecucion {
  return { ...EJECUCION_VACIA, fase: 'error', error, lineaSenalada: error.linea };
}

export function useCodigo(opciones: OpcionesCodigo): Codigo {
  const { plantilla, guion } = opciones;

  /* Los saltos de línea se normalizan SIEMPRE y en la puerta: el léxico cuenta
   * las líneas sobre `\n`, y si el alumno pega algo con `\r\n` el editor
   * contaría una cosa y el intérprete otra — o sea, el error saldría señalado
   * en la línea equivocada, que es justo lo que este armazón existe para no
   * hacer. */
  const normalizar = useCallback((t: string) => t.replace(/\r\n?/g, '\n'), []);

  const [texto, setTexto] = useState(() => normalizar(plantilla));
  const [ejecucion, setEjecucion] = useState<Ejecucion>(EJECUCION_VACIA);
  const [corriendo, setCorriendo] = useState(false);
  const [velocidad, setVelocidad] = useState<VelocidadId>(opciones.velocidad ?? 'normal');
  const [borrador, setBorrador] = useState('');
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [foco, setFoco] = useState<{ linea: number; sello: number } | null>(null);

  const maqRef = useRef<Maquina | null>(null);
  /** ⏹: la máquina sigue viva para poder mirarla, pero ya no es de nadie. */
  const detenidaRef = useRef(false);
  const avisoRef = useRef(0);
  const selloRef = useRef(0);
  const sesionRef = useRef(0);
  const juzgadaRef = useRef(-1);
  const tropiezosRef = useRef(0);
  /** ¿Venía corriendo sola cuando `input()` la paró? Entonces al contestar sigue sola. */
  const seguiaRef = useRef(false);
  /* El reloj se pone al montar y no al pintar: leer la hora durante el render
   * es impuro y React lo prohíbe con razón — dos renders darían dos horas. */
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

  /**
   * Sacar la foto, y de paso apuntar el tropiezo.
   *
   * **Un tropiezo es un programa que se rompió**, contado una vez por
   * ejecución y no una por repintado —de ahí el sello de sesión—. Las opciones
   * mal elegidas de un encargo también cuentan, y se apuntan donde se eligen.
   * No cuenta como tropiezo tardar, ni pararlo, ni ejecutarlo diez veces
   * mientras se prueba: eso es programar.
   */
  const retratar = useCallback((enMarchaSola: boolean) => {
    const nueva = foto(maqRef.current, enMarchaSola, detenidaRef.current);
    if (nueva.fase === 'error' && juzgadaRef.current !== sesionRef.current) {
      juzgadaRef.current = sesionRef.current;
      tropiezosRef.current += 1;
    }
    setEjecucion(nueva);
  }, []);

  const avisar = useCallback((texto: string, tono: Aviso['tono'] = 'aviso') => {
    avisoRef.current += 1;
    setAviso({ id: avisoRef.current, texto, tono });
  }, []);

  // ── El texto ─────────────────────────────────────────────────────────────

  const avisarBloqueo = useCallback(() => {
    if (soloLectura) {
      avisar('Este programa viene escrito: aquí toca leerlo y ejecutarlo, no cambiarlo 🔒', 'candado');
      return;
    }
    avisar('El programa está en marcha. Pulsa ⏹ Parar y podrás escribir.', 'aviso');
  }, [soloLectura, avisar]);

  /**
   * Cuándo se puede escribir.
   *
   * Se deriva de la fase. Congelar el editor mientras el programa anda no es
   * una manía: si el texto cambia a media ejecución, la línea resaltada y los
   * números de línea del error señalan a un programa que ya no existe, y
   * entonces todo el paso a paso miente.
   */
  const editable =
    !soloLectura &&
    (ejecucion.fase === 'libre' ||
      ejecucion.fase === 'terminada' ||
      ejecucion.fase === 'error' ||
      ejecucion.fase === 'detenida');

  const escribir = useCallback(
    (crudo: string) => {
      const nuevo = normalizar(crudo);
      if (nuevo === texto) return true;
      /* El `<textarea>` congelado ya es `readOnly`, así que por teclado esto no
       * pasa. Pero `escribir` es puerta pública —una clase puede llamarla, y
       * una prueba también— y sin esta línea el texto se cambiaba a media
       * ejecución por debajo del programa que está corriendo. Lo cazó jugar
       * mal: `fireEvent.change` sobre un cuadro de sólo lectura sí dispara. */
      if (!editable) {
        avisarBloqueo();
        return false;
      }
      if (!cambioPermitido(texto, nuevo, bajoLlave)) {
        avisar('Esa línea viene puesta por la clase y no se puede cambiar: tiene candado 🔒', 'candado');
        return false;
      }
      setTexto(nuevo);
      /* En cuanto se toca el programa, **el error viejo se va**. Un error
       * señalando la línea 7 de un programa al que le acabas de meter dos
       * líneas manda a mirar donde no es, que es el defecto que este armazón
       * existe para no cometer. Lo que sí se queda es la salida: «imprimió
       * esto y luego se rompió» es media clase. */
      setEjecucion((prev) =>
        prev.error ? { ...prev, fase: 'libre', error: null, linea: 0, lineaSenalada: 0 } : prev,
      );
      return true;
    },
    [texto, editable, bajoLlave, avisar, avisarBloqueo, normalizar],
  );

  const lineas = useMemo(() => colorear(texto), [texto]);

  // ── La ejecución ─────────────────────────────────────────────────────────

  const nacer = useCallback((): Maquina | null => {
    const arranque = crearMaquina(texto, {
      entradas: opcionesRef.current.entradas ? [...opcionesRef.current.entradas] : [],
      topes: opcionesRef.current.topes,
    });
    sesionRef.current += 1;
    detenidaRef.current = false;
    if (!arranque.ok) {
      maqRef.current = null;
      juzgadaRef.current = sesionRef.current;
      tropiezosRef.current += 1;
      setCorriendo(false);
      setEjecucion(fotoDelArranqueFallido(arranque.error));
      return null;
    }
    maqRef.current = arranque.maq;
    return arranque.maq;
  }, [texto]);

  const empujar = useCallback(
    (m: Maquina) => {
      const v = velocidadDe(velocidad);
      if (v.ms === 0) {
        correr(m);
        return;
      }
      if (v.porSentencia) {
        for (let i = 0; i < v.cuanto && enMarcha(m); i += 1) pasoDeLinea(m);
        return;
      }
      correr(m, v.cuanto);
    },
    [velocidad],
  );

  const ejecutar = useCallback(() => {
    /* Pulsar ▶ dos veces no hace nada la segunda: ni arranca otra máquina ni
     * dobla la velocidad. */
    if (corriendo) return;
    const viva = maqRef.current;
    if (viva && viva.estado === 'esperando') {
      avisar('Tu programa está preguntando algo. Contesta abajo, en la consola.', 'aviso');
      return;
    }
    const sigue = viva !== null && enMarcha(viva) && !detenidaRef.current;
    const m = sigue ? viva : nacer();
    if (!m) return;
    seguiaRef.current = true;
    if (velocidadDe(velocidad).ms === 0) {
      empujar(m);
      retratar(false);
      return;
    }
    setCorriendo(true);
    retratar(true);
  }, [corriendo, nacer, empujar, velocidad, retratar, avisar]);

  const unPaso = useCallback(() => {
    const viva = maqRef.current;
    /* Esto va ANTES de tocar nada, y lo cazó jugar mal: pulsar ⏭ mientras
     * `input()` espera no es un paso, es un botón que no toca — pero si de
     * paso apagaba el «venía corriendo sola», al contestar el programa se
     * quedaba en pausa sin que nadie lo hubiera pausado. */
    if (viva && viva.estado === 'esperando') {
      avisar('Tu programa está preguntando algo. Contesta abajo, en la consola.', 'aviso');
      return;
    }
    setCorriendo(false);
    seguiaRef.current = false;
    if (!viva || !enMarcha(viva) || detenidaRef.current) {
      /* El primer ⏭ sólo prepara la máquina y enciende la primera línea. Se ve
       * lo que va a pasar ANTES de que pase, que es de lo que va el paso a
       * paso; el segundo ⏭ ya la ejecuta. */
      if (nacer()) retratar(false);
      return;
    }
    pasoDeLinea(viva);
    retratar(false);
  }, [nacer, retratar, avisar]);

  const parar = useCallback(() => {
    setCorriendo(false);
    seguiaRef.current = false;
    /* Parar sin nada en marcha no hace nada y no avisa de nada: es el botón que
     * más se pulsa por si acaso. */
    if (!maqRef.current) return;
    detenidaRef.current = true;
    retratar(false);
  }, [retratar]);

  const reiniciar = useCallback(() => {
    setCorriendo(false);
    detenidaRef.current = false;
    maqRef.current = null;
    seguiaRef.current = false;
    juzgadaRef.current = -1;
    setEjecucion(EJECUCION_VACIA);
    setTexto(normalizar(opcionesRef.current.plantilla));
    setBorrador('');
    setAviso(null);
  }, [normalizar]);

  const limpiarConsola = useCallback(() => {
    const m = maqRef.current;
    if (m) m.salida = [];
    setEjecucion((prev) => (prev.salida.length === 0 ? prev : { ...prev, salida: [] }));
  }, []);

  const cambiarVelocidad = useCallback((v: VelocidadId) => setVelocidad(v), []);

  /* El reloj de la ejecución automática. Con `rayo` no llega a existir: ese
   * programa se ejecuta entero dentro de `ejecutar`, sin temporizadores — que
   * es lo que permite probar todo esto sin relojes falsos. */
  useEffect(() => {
    if (!corriendo) return;
    /* Con `rayo` el intervalo se crea a 0 ms: el primer tic —ya fuera del
     * render— ejecuta el programa entero de un tirón y se apaga solo. Hacerlo
     * aquí mismo sería un `setState` síncrono dentro de un efecto, que es
     * cascada de renders y React lo desaconseja. */
    const reloj = setInterval(() => {
      const viva = maqRef.current;
      if (!viva || !enMarcha(viva)) {
        setCorriendo(false);
        retratar(false);
        return;
      }
      empujar(viva);
      const sigue = enMarcha(viva);
      if (!sigue) setCorriendo(false);
      retratar(sigue);
    }, velocidadDe(velocidad).ms);
    return () => clearInterval(reloj);
  }, [corriendo, velocidad, empujar, retratar]);

  // ── La consola ───────────────────────────────────────────────────────────

  const contestar = useCallback(() => {
    const m = maqRef.current;
    if (!m || m.estado !== 'esperando') return;
    responder(m, borrador);
    setBorrador('');
    if (!seguiaRef.current) {
      retratar(false);
      return;
    }
    if (velocidadDe(velocidad).ms > 0) {
      setCorriendo(true);
      retratar(true);
      return;
    }
    empujar(m);
    retratar(false);
  }, [borrador, velocidad, empujar, retratar]);

  const senalarLinea = useCallback((linea: number) => {
    selloRef.current += 1;
    setFoco({ linea, sello: selloRef.current });
  }, []);

  const descartarAviso = useCallback(() => setAviso(null), []);

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
   * **Defecto encontrado al montar la primera clase encima (15-ago-2026).**
   * `onAvance` y `onTerminado` se llamaban desde dentro de la función que
   * actualiza el estado, y eso son dos averías, no una:
   *
   * 1. Una función de actualización se ejecuta **durante el pintado**, así que
   *    la clase no podía hacer nada de estado ahí dentro — y lo primero que
   *    hace una clase con `onAvance` es llamar a `useLabActividad.avanzar()`,
   *    que mueve estado y llama a `onProgress` del anfitrión. React lo avisa
   *    por consola («Cannot update a component while rendering a different
   *    component») y con razón.
   * 2. Peor: en modo estricto —que es el que trae Next de fábrica y con el que
   *    corre el `next dev` de este proyecto— React **invoca dos veces** esas
   *    funciones a propósito, para cazar justo esto. `onAvance` salía dos veces
   *    por encargo y `onTerminado` dos veces al cerrar: la barra de progreso
   *    avanzaba el doble y la actividad se completaba dos veces.
   *
   * Con el aviso aquí, se manda **después** de pintar y una sola vez: el
   * contador de avisados es un `ref`, así que el segundo pase del modo estricto
   * no repite nada. Lo observable para quien ya lo usaba no cambia: mismo
   * `onAvance` con la misma fracción, y `onTerminado` una vez al completar el
   * último encargo.
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
   * Preguntarle a la clase si el encargo está hecho.
   *
   * El predicado lo escribe la clase, así que **puede reventar**: un
   * `e.salida[3].split(...)` sobre una salida de dos líneas. Si eso tumbara el
   * árbol de React, el alumno se quedaría con la pantalla en blanco por un
   * error del guion. Se atrapa, cuenta como «todavía no» y **se dice en voz
   * alta**, que es lo que necesita quien está escribiendo la clase.
   */
  const preguntar = useCallback(
    (paso: PasoCodigo): boolean => {
      try {
        if (paso.logro.tipo === 'programa') return paso.logro.comprueba(texto);
        if (paso.logro.tipo === 'ejecucion') return paso.logro.comprueba(ejecucion, texto);
      } catch {
        avisar(`El encargo «${paso.titulo}» no se pudo comprobar: revisa su «comprueba» en el guion.`, 'aviso');
      }
      return false;
    },
    [texto, ejecucion, avisar],
  );

  /*
   * Los encargos que se leen del programa o de la salida se comprueban solos.
   * Los de elegir y confirmar tienen su botón.
   *
   * El `eslint-disable` es el mismo patrón que ya usan `ArcadeSala3D`,
   * `Ordenador3D` y `BancoFisico3D`, y aquí está justificado por la carve-out
   * que la propia regla escribe: **el sistema externo es el intérprete**. La
   * máquina de Python vive en un `useRef` mutable y no avisa a React de nada;
   * lo único que React ve es la foto (`ejecucion`) que se saca al tocarla. Que
   * un encargo pase a estar hecho es exactamente «estado de React que sigue al
   * estado de un sistema de fuera», y no hay forma de derivarlo al pintar: el
   * encargo hecho **se queda hecho** aunque después el alumno cambie el
   * programa y el predicado deje de cumplirse.
   *
   * Antes del 15-ago-2026 esta línea no saltaba porque `marcarHecho` llevaba
   * dentro más cosas que el `setState` —los avisos de `onAvance` y
   * `onTerminado`, que era justo el defecto— y el analizador no la veía como
   * un `setState` pelado. Que ahora salte es señal de que aquello se limpió.
   */
  useEffect(() => {
    if (!pasoActual || hecho) return;
    if (pasoActual.logro.tipo !== 'programa' && pasoActual.logro.tipo !== 'ejecucion') return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (preguntar(pasoActual)) marcarHecho(pasoActual.id);
  }, [pasoActual, hecho, preguntar, marcarHecho]);

  /**
   * La pista, **derivada y no guardada**.
   *
   * «Aparece sola tras el primer intento fallido» es exactamente esto: el
   * programa acabó —bien o con un tropiezo— y el encargo sigue sin cerrarse.
   * Calcularlo en vez de guardarlo tiene dos ventajas que se notan: se apaga
   * sola al volver a ejecutar (la fase deja de ser «terminada») y no hay
   * ningún efecto encendiendo estado detrás de otro estado, que es de donde
   * salen las cascadas de repintado.
   */
  const pistaVisible =
    pistaPedida || (!hecho && (ejecucion.fase === 'terminada' || ejecucion.fase === 'error'));

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

  const encargo: Encargo | null = pasoActual
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

    ejecucion,
    fase: ejecucion.fase,
    ejecutar,
    parar,
    unPaso,
    reiniciar,
    limpiarConsola,
    velocidad,
    cambiarVelocidad,

    borrador,
    escribirBorrador: setBorrador,
    contestar,

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
