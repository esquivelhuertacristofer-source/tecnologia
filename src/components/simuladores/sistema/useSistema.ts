'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  abrirVentana as abrirVentanaPura,
  buscar,
  buscarCarpeta,
  calcularEspacio,
  cerrarVentana as cerrarVentanaPura,
  copiar as copiarPura,
  crearCarpeta as crearCarpetaPura,
  enfocarVentana as enfocarVentanaPura,
  minimizarVentana as minimizarVentanaPura,
  mover as moverPura,
  ordenarHijos,
  programaDe,
  renombrar as renombrarPura,
  restaurar as restaurarPura,
  rutaCarpeta,
  vaciarPapelera as vaciarPapeleraPura,
  borrar as borrarPura,
  type CarpetaSO,
  type ElementoPapelera,
  type EspacioDisco,
  type FiltroBusqueda,
  type NodoSO,
  type OrdenExplorador,
  type VentanaSO,
} from './tiposSistema';

/**
 * TECNIA SISTEMA · LA MÁQUINA
 *
 * Todo el estado del explorador y del escritorio vive aquí: el árbol, la
 * papelera, la navegación, la vista, el orden, la búsqueda, el portapapeles
 * y las ventanas abiertas. `VentanaExplorador` y `Escritorio` no tienen ni
 * un `useState` — leen lo que este gancho devuelve y lo pintan, igual que
 * `useMuro`/`VentanaMuro` y `useBloques`/`VentanaBloques`.
 *
 * ── Por qué las operaciones leen de una `ref`, no del `state` cerrado ─────
 *
 * Igual que `pubRef` en `useMuro`: cada operación necesita el árbol YA
 * COMITIDO para decidir si es legal, y leerlo del `raiz` capturado en el
 * cierre del `useCallback` arriesgaría un valor viejo si dos acciones caen
 * en el mismo tic. `raizRef`/`papeleraRef` se mantienen al día con un efecto
 * sin dependencias.
 *
 * ── Por qué los ids se generan ANTES de `setRaiz`, no adentro ────────────
 *
 * `nuevoId()` muta un contador con `useRef`. Se llama SIEMPRE desde dentro
 * del manejador de la acción del alumno (una vez por click), nunca dentro
 * del cuerpo de un actualizador funcional de `setState` — así una
 * reejecución del actualizador (algo que React puede hacer) no puede
 * generar ids distintos en pasadas distintas. Mismo patrón que `nuevoId` en
 * `useMuro.ts` y `useAsistente.ts`.
 *
 * ── La carpeta actual puede desaparecer sola ──────────────────────────────
 *
 * Si la carpeta donde el alumno está parado se borra o se mueve por debajo
 * de él (jugando MAL, o porque otra ventana del mismo escritorio la tocó),
 * un efecto detecta que `rutaCarpeta(raiz, carpetaActualId)` ya no existe y
 * vuelve a la raíz — nunca se queda mostrando una carpeta fantasma.
 */

export interface OpcionesSistema {
  /** El árbol inicial. Se lee UNA vez, al montar (igual que `publicaciones`
   *  en `useMuro`); `reiniciar()` vuelve a él. */
  raiz: CarpetaSO;
  /** Bytes totales del disco simulado. */
  capacidadDisco: number;
  /** Sustituye la tabla extensión→programa por omisión. */
  mapaProgramas?: Readonly<Record<string, string>>;
  ventanasIniciales?: VentanaSO[];
  ordenInicial?: OrdenExplorador;
  vistaInicial?: 'lista' | 'iconos';
  /** Fecha ya formateada para las cosas que se crean durante la sesión
   *  (carpetas nuevas, copias). Por omisión "Hoy" — el armazón no calcula
   *  tiempo real, igual que `fecha` en `useMuro.publicar`. */
  fechaActual?: string;
}

export type ResultadoAccion = { ok: boolean; aviso: string };

export interface ElementoPortapapeles {
  id: string;
  modo: 'cortar' | 'copiar';
}

export interface ResultadoAbrir {
  ok: boolean;
  /** El programa que abriría el archivo según su extensión, o `null` si
   *  Tecnia no tiene registrado nada para ella. */
  programa: string | null;
  aviso: string;
}

export interface Sistema {
  /** El árbol vivo. */
  raiz: CarpetaSO;
  papelera: ElementoPapelera[];
  /** La cadena de carpetas de la raíz a la carpeta donde está parado el
   *  alumno, para pintar la ruta ("Mi PC › Tareas › Historia"). */
  ruta: CarpetaSO[];
  carpetaActual: CarpetaSO;
  /** Los hijos de `carpetaActual`, ya ordenados — o los resultados de la
   *  búsqueda activa, si la hay. */
  listado: NodoSO[];
  buscando: boolean;
  terminoBusqueda: string;
  vista: 'lista' | 'iconos';
  orden: OrdenExplorador;
  seleccionId: string | null;
  portapapeles: ElementoPortapapeles | null;
  espacio: EspacioDisco;
  ventanas: VentanaSO[];
  ultimoAviso: string | null;

  entrar: (id: string) => boolean;
  subir: () => void;
  navegarA: (carpetaId: string) => boolean;
  seleccionar: (id: string | null) => void;
  cambiarVista: (v: 'lista' | 'iconos') => void;
  ordenarPor: (campo: OrdenExplorador['campo']) => void;
  buscarTexto: (texto: string, filtro?: Omit<FiltroBusqueda, 'texto'>) => void;
  limpiarBusqueda: () => void;

  crearCarpeta: (nombre?: string) => ResultadoAccion;
  renombrar: (id: string, nuevoNombre: string) => ResultadoAccion;
  borrar: (id: string) => ResultadoAccion;
  restaurar: (id: string) => ResultadoAccion;
  vaciarPapelera: () => ResultadoAccion;

  cortar: (id: string) => void;
  copiarAlPortapapeles: (id: string) => void;
  pegarAqui: () => ResultadoAccion;

  /** Carpeta → navega dentro. Archivo → busca su programa por extensión y,
   *  si lo encuentra, abre (o enfoca) una ventana para él. */
  abrirNodo: (id: string) => ResultadoAbrir;

  abrirVentana: (ventana: VentanaSO) => void;
  cerrarVentana: (id: string) => void;
  enfocarVentana: (id: string) => void;
  minimizarVentana: (id: string) => void;

  reiniciar: () => void;
}

const ORDEN_POR_DEFECTO: OrdenExplorador = { campo: 'nombre', direccion: 'asc' };

export function useSistema(opciones: OpcionesSistema): Sistema {
  const raizInicialRef = useRef(opciones.raiz);
  // Toda la configuración de arranque se lee UNA sola vez, al montar — igual
  // que `alumnoRef` en `useMuro` — para que `reiniciar()` pueda volver a ella
  // sin depender de que `opciones` siga siendo el mismo objeto en renders
  // futuros (y sin necesitar un `eslint-disable` de `exhaustive-deps`).
  const configInicialRef = useRef({
    vista: opciones.vistaInicial ?? ('lista' as const),
    orden: opciones.ordenInicial ?? ORDEN_POR_DEFECTO,
    ventanas: opciones.ventanasIniciales ?? [],
  });
  const fecha = opciones.fechaActual ?? 'Hoy';
  const mapaProgramas = opciones.mapaProgramas;

  const [raiz, setRaiz] = useState<CarpetaSO>(() => opciones.raiz);
  const raizRef = useRef(raiz);
  useEffect(() => {
    raizRef.current = raiz;
  });

  const [papelera, setPapelera] = useState<ElementoPapelera[]>([]);
  const papeleraRef = useRef(papelera);
  useEffect(() => {
    papeleraRef.current = papelera;
  });

  const [carpetaActualId, setCarpetaActualId] = useState(() => opciones.raiz.id);
  const [seleccionId, setSeleccionId] = useState<string | null>(null);
  const [vista, setVista] = useState<'lista' | 'iconos'>(opciones.vistaInicial ?? 'lista');
  const [orden, setOrden] = useState<OrdenExplorador>(opciones.ordenInicial ?? ORDEN_POR_DEFECTO);
  const [filtroBusqueda, setFiltroBusqueda] = useState<FiltroBusqueda | null>(null);
  const [portapapeles, setPortapapeles] = useState<ElementoPortapapeles | null>(null);
  const [ventanas, setVentanas] = useState<VentanaSO[]>(opciones.ventanasIniciales ?? []);
  const [ultimoAviso, setUltimoAviso] = useState<string | null>(null);

  const contador = useRef(0);
  const nuevoId = useCallback(() => {
    contador.current += 1;
    return `n${contador.current}`;
  }, []);

  /*
   * Si la carpeta donde estaba parado el alumno desapareció (se borró, se
   * movió), `rutaCarpeta` deja de encontrarla y `ruta` cae a `[raiz]`: la
   * pantalla vuelve sola al disco principal en vez de quedarse mostrando una
   * carpeta fantasma. A propósito esto es un valor DERIVADO en el render, no
   * un efecto que llame `setCarpetaActualId`: `carpetaActualId` puede seguir
   * apuntando a un id que ya no existe (no pasa nada, es sólo un cursor) y
   * toda operación de este gancho lee `carpetaActual.id`, que siempre es un
   * sitio real.
   */
  const ruta = useMemo(() => rutaCarpeta(raiz, carpetaActualId) ?? [raiz], [raiz, carpetaActualId]);
  const carpetaActual = ruta[ruta.length - 1] ?? raiz;

  const listadoCarpeta = useMemo(() => ordenarHijos(carpetaActual.hijos, orden), [carpetaActual, orden]);
  const resultadosBusqueda = useMemo(
    () => (filtroBusqueda ? ordenarHijos(buscar(raiz, filtroBusqueda), orden) : null),
    [raiz, filtroBusqueda, orden],
  );
  const listado = resultadosBusqueda ?? listadoCarpeta;

  const espacio = useMemo(
    () => calcularEspacio(raiz, papelera, opciones.capacidadDisco),
    [raiz, papelera, opciones.capacidadDisco],
  );

  // ── navegación ───────────────────────────────────────────────────────────

  const navegarA = useCallback((carpetaId: string): boolean => {
    const existe = buscarCarpeta(raizRef.current, carpetaId);
    if (!existe) return false;
    setCarpetaActualId(carpetaId);
    setSeleccionId(null);
    setFiltroBusqueda(null);
    return true;
  }, []);

  const entrar = navegarA;

  const subir = useCallback(() => {
    if (ruta.length <= 1) return; // ya en la raíz (o la carpeta actual se esfumó): no-operación
    navegarA(ruta[ruta.length - 2].id);
  }, [ruta, navegarA]);

  const seleccionar = useCallback((id: string | null) => setSeleccionId(id), []);
  const cambiarVista = useCallback((v: 'lista' | 'iconos') => setVista(v), []);

  const ordenarPor = useCallback((campo: OrdenExplorador['campo']) => {
    setOrden((prev) => (prev.campo === campo ? { ...prev, direccion: prev.direccion === 'asc' ? 'desc' : 'asc' } : { campo, direccion: 'asc' }));
  }, []);

  const buscarTexto = useCallback((texto: string, filtro?: Omit<FiltroBusqueda, 'texto'>) => {
    const limpio = texto.trim();
    if (limpio === '' && !filtro) {
      setFiltroBusqueda(null);
      return;
    }
    setFiltroBusqueda({ texto: limpio || undefined, ...filtro });
  }, []);

  const limpiarBusqueda = useCallback(() => setFiltroBusqueda(null), []);

  // ── operaciones sobre el árbol ──────────────────────────────────────────

  const crearCarpeta = useCallback(
    (nombre?: string): ResultadoAccion => {
      const r = crearCarpetaPura(raizRef.current, carpetaActual.id, nombre ?? 'Nueva carpeta', nuevoId(), fecha);
      setUltimoAviso(r.aviso);
      if (r.ok) setRaiz(r.raiz);
      return { ok: r.ok, aviso: r.aviso };
    },
    [carpetaActual, fecha, nuevoId],
  );

  const renombrar = useCallback((id: string, nuevoNombre: string): ResultadoAccion => {
    const r = renombrarPura(raizRef.current, id, nuevoNombre);
    setUltimoAviso(r.aviso);
    if (r.ok) setRaiz(r.raiz);
    return { ok: r.ok, aviso: r.aviso };
  }, []);

  const borrar = useCallback(
    (id: string): ResultadoAccion => {
      const r = borrarPura(raizRef.current, papeleraRef.current, id, fecha);
      setUltimoAviso(r.aviso);
      if (r.ok) {
        setRaiz(r.raiz);
        setPapelera(r.papelera);
        if (seleccionId === id) setSeleccionId(null);
      }
      return { ok: r.ok, aviso: r.aviso };
    },
    [fecha, seleccionId],
  );

  const restaurar = useCallback((id: string): ResultadoAccion => {
    const r = restaurarPura(raizRef.current, papeleraRef.current, id);
    setUltimoAviso(r.aviso);
    if (r.ok) {
      setRaiz(r.raiz);
      setPapelera(r.papelera);
    }
    return { ok: r.ok, aviso: r.aviso };
  }, []);

  const vaciarPapelera = useCallback((): ResultadoAccion => {
    const vacia = papeleraRef.current.length === 0;
    setPapelera(vaciarPapeleraPura);
    const aviso = vacia ? 'La papelera ya estaba vacía.' : 'Se vació la papelera. Lo que había ahí no se puede recuperar.';
    setUltimoAviso(aviso);
    return { ok: true, aviso };
  }, []);

  // ── portapapeles: cortar / copiar / pegar ───────────────────────────────

  const cortar = useCallback((id: string) => setPortapapeles({ id, modo: 'cortar' }), []);
  const copiarAlPortapapeles = useCallback((id: string) => setPortapapeles({ id, modo: 'copiar' }), []);

  const pegarAqui = useCallback((): ResultadoAccion => {
    const actual = portapapeles;
    if (!actual) {
      const aviso = 'No hay nada que pegar: primero corta o copia algo.';
      setUltimoAviso(aviso);
      return { ok: false, aviso };
    }
    if (actual.modo === 'copiar') {
      const r = copiarPura(raizRef.current, actual.id, carpetaActual.id, nuevoId, fecha);
      setUltimoAviso(r.aviso);
      if (r.ok) setRaiz(r.raiz);
      return { ok: r.ok, aviso: r.aviso };
    }
    const r = moverPura(raizRef.current, actual.id, carpetaActual.id);
    setUltimoAviso(r.aviso);
    if (r.ok) {
      setRaiz(r.raiz);
      setPortapapeles(null); // cortar se gasta al pegar con éxito
    }
    return { ok: r.ok, aviso: r.aviso };
  }, [portapapeles, carpetaActual, fecha, nuevoId]);

  // ── abrir ────────────────────────────────────────────────────────────────

  const abrirNodo = useCallback(
    (id: string): ResultadoAbrir => {
      const esCarpetaDestino = buscarCarpeta(raizRef.current, id);
      if (esCarpetaDestino) {
        navegarA(id);
        return { ok: true, programa: null, aviso: `Entraste a «${esCarpetaDestino.nombre}».` };
      }
      let nombreArchivo: string | null = null;
      const buscarNombre = (c: CarpetaSO): void => {
        for (const h of c.hijos) {
          if (h.id === id) nombreArchivo = h.nombre;
          else if (h.tipo === 'carpeta') buscarNombre(h);
        }
      };
      buscarNombre(raizRef.current);
      if (!nombreArchivo) {
        const aviso = 'Eso ya no está aquí.';
        setUltimoAviso(aviso);
        return { ok: false, programa: null, aviso };
      }
      const programa = programaDe(nombreArchivo, mapaProgramas);
      if (!programa) {
        const aviso = `Tecnia no reconoce qué programa abre «${nombreArchivo}».`;
        setUltimoAviso(aviso);
        return { ok: false, programa: null, aviso };
      }
      setVentanas((prev) => abrirVentanaPura(prev, { id: `archivo-${id}`, titulo: nombreArchivo as string, programa }));
      const aviso = `Se abrió «${nombreArchivo}» con ${programa}.`;
      setUltimoAviso(aviso);
      return { ok: true, programa, aviso };
    },
    [navegarA, mapaProgramas],
  );

  // ── ventanas ─────────────────────────────────────────────────────────────

  const abrirVentanaAccion = useCallback((v: VentanaSO) => setVentanas((prev) => abrirVentanaPura(prev, v)), []);
  const cerrarVentanaAccion = useCallback((id: string) => setVentanas((prev) => cerrarVentanaPura(prev, id)), []);
  const enfocarVentanaAccion = useCallback((id: string) => setVentanas((prev) => enfocarVentanaPura(prev, id)), []);
  const minimizarVentanaAccion = useCallback((id: string) => setVentanas((prev) => minimizarVentanaPura(prev, id)), []);

  const reiniciar = useCallback(() => {
    contador.current = 0;
    setRaiz(raizInicialRef.current);
    setPapelera([]);
    setCarpetaActualId(raizInicialRef.current.id);
    setSeleccionId(null);
    setVista(configInicialRef.current.vista);
    setOrden(configInicialRef.current.orden);
    setFiltroBusqueda(null);
    setPortapapeles(null);
    setVentanas(configInicialRef.current.ventanas);
    setUltimoAviso(null);
  }, []);

  return {
    raiz,
    papelera,
    ruta,
    carpetaActual,
    listado,
    buscando: filtroBusqueda !== null,
    terminoBusqueda: filtroBusqueda?.texto ?? '',
    vista,
    orden,
    seleccionId,
    portapapeles,
    espacio,
    ventanas,
    ultimoAviso,

    entrar,
    subir,
    navegarA,
    seleccionar,
    cambiarVista,
    ordenarPor,
    buscarTexto,
    limpiarBusqueda,

    crearCarpeta,
    renombrar,
    borrar,
    restaurar,
    vaciarPapelera,

    cortar,
    copiarAlPortapapeles,
    pegarAqui,

    abrirNodo,

    abrirVentana: abrirVentanaAccion,
    cerrarVentana: cerrarVentanaAccion,
    enfocarVentana: enfocarVentanaAccion,
    minimizarVentana: minimizarVentanaAccion,

    reiniciar,
  };
}
