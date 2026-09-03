'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  abrirEnlace as abrirEnlacePura,
  calcularEspacioNube,
  cambiarPermiso as cambiarPermisoPura,
  compartirCon as compartirConPura,
  completarSubida as completarSubidaPura,
  entrarAEditar as entrarAEditarPura,
  espacioLlenoParaSubir,
  generarEnlace as generarEnlacePura,
  guardarCambios as guardarCambiosPura,
  iniciarSubida as iniciarSubidaPura,
  quitarAcceso as quitarAccesoPura,
  resolverConflicto as resolverConflictoPura,
  restaurarVersion as restaurarVersionPura,
  revocarEnlace as revocarEnlacePura,
  salirDeEditar as salirDeEditarPura,
  tamanoDe,
  type ArchivoNube,
  type EleccionConflicto,
  type EspacioNube,
  type EstadoConexion,
  type PermisoNube,
  type PersonaNube,
} from './tiposNube';

/**
 * TECNIA NUBE · LA MÁQUINA
 *
 * Todo el estado vive aquí; `VentanaNube` no tiene ni un `useState`, igual
 * que `useMuro`/`VentanaMuro` y `useSistema`/`VentanaExplorador`.
 *
 * ── Por qué las operaciones leen de una `ref`, no del `state` cerrado ─────
 *
 * Mismo patrón que `pubRef` en `useMuro.ts` y `raizRef` en `useSistema.ts`:
 * cada acción necesita el estado YA COMITIDO del archivo (¿sigue existiendo?
 * ¿en qué versión va?) para decidir si es legal, y el valor capturado en el
 * cierre del `useCallback` podría estar viejo.
 *
 * ── La cola de subida pendiente, y qué pasa al volver la conexión ────────
 *
 * `colaPendiente` guarda los ids de archivo que intentaron subir (o se
 * guardaron) mientras `conexion === 'sin-conexion'`. `recuperarConexion` no
 * adivina: recorre la cola, pone esos archivos en `'subiendo'` — la clase
 * decide cuándo llamar `completarSubida` para cada uno, con su propio
 * temporizador, tal como hace `LabNubeOLocal` con `useTemporizadores` — y
 * vacía la cola. Nada se pierde y nada se sube solo antes de tiempo.
 */

export interface OpcionesNube {
  /** Los archivos con los que arranca la sesión. Se lee UNA vez, al montar
   *  (igual que `publicaciones` en `useMuro`); `reiniciar()` vuelve a ellos. */
  archivos: ArchivoNube[];
  /** Bytes contratados del plan de nube. */
  capacidad: number;
  conexionInicial?: EstadoConexion;
}

export type ResultadoAccionNube = { ok: boolean; aviso: string };

export interface Nube {
  archivos: ArchivoNube[];
  seleccionId: string | null;
  conexion: EstadoConexion;
  /** Ids de archivo esperando a que vuelva la conexión. */
  colaPendiente: string[];
  espacio: EspacioNube;
  ultimoAviso: string | null;

  seleccionar: (nodoId: string | null) => void;

  compartir: (nodoId: string, persona: PersonaNube, permiso: PermisoNube) => ResultadoAccionNube;
  cambiarPermiso: (nodoId: string, personaId: string, permiso: PermisoNube) => void;
  quitarAcceso: (nodoId: string, personaId: string) => ResultadoAccionNube;

  generarEnlace: (nodoId: string, permiso: PermisoNube) => void;
  revocarEnlace: (nodoId: string) => void;
  abrirEnlace: (nodoId: string, persona: PersonaNube) => ResultadoAccionNube;

  entrarAEditar: (nodoId: string, persona: PersonaNube) => void;
  salirDeEditar: (nodoId: string, personaId: string) => void;
  guardarCambios: (
    nodoId: string,
    version: { autor: PersonaNube; fecha: string; resumen?: string; basadaEnVersionId: string | null },
  ) => ResultadoAccionNube;
  resolverConflicto: (nodoId: string, eleccion: EleccionConflicto) => ResultadoAccionNube;
  restaurarVersion: (nodoId: string, versionId: string) => ResultadoAccionNube;

  /** Empieza a subir. Si no hay conexión, encola en vez de transicionar —
   *  jugar MAL: subir sin conexión. Si no cabe en el espacio contratado,
   *  rechaza — jugar MAL: llenar el espacio y seguir subiendo. */
  subir: (nodoId: string) => ResultadoAccionNube;
  /** La clase la llama cuando su propio temporizador de "subiendo…" termina. */
  completarSubida: (nodoId: string) => void;

  perderConexion: () => void;
  /** Reintenta todo lo que quedó en `colaPendiente`. */
  recuperarConexion: () => void;

  reiniciar: () => void;
}

export function useNube(opciones: OpcionesNube): Nube {
  const inicialRef = useRef(opciones.archivos);
  const capacidad = opciones.capacidad;
  const conexionInicial = opciones.conexionInicial ?? 'en-linea';

  const [archivos, setArchivos] = useState<ArchivoNube[]>(() => opciones.archivos);
  const archivosRef = useRef(archivos);
  useEffect(() => {
    archivosRef.current = archivos;
  });

  const [seleccionId, setSeleccionId] = useState<string | null>(null);
  const [conexion, setConexion] = useState<EstadoConexion>(conexionInicial);
  const conexionRef = useRef(conexion);
  useEffect(() => {
    conexionRef.current = conexion;
  });

  const [colaPendiente, setColaPendiente] = useState<string[]>([]);
  const colaRef = useRef(colaPendiente);
  useEffect(() => {
    colaRef.current = colaPendiente;
  });

  const [ultimoAviso, setUltimoAviso] = useState<string | null>(null);

  const contador = useRef(0);
  const nuevoId = useCallback((prefijo: string) => {
    contador.current += 1;
    return `${prefijo}${contador.current}`;
  }, []);

  const espacio = useMemo(() => calcularEspacioNube(archivos, capacidad), [archivos, capacidad]);

  const buscar = useCallback((nodoId: string) => archivosRef.current.find((a) => a.nodo.id === nodoId) ?? null, []);

  const seleccionar = useCallback((nodoId: string | null) => setSeleccionId(nodoId), []);

  /* ── compartir ──────────────────────────────────────────────────────── */

  const compartir = useCallback((nodoId: string, persona: PersonaNube, permiso: PermisoNube): ResultadoAccionNube => {
    const archivo = buscar(nodoId);
    if (!archivo) return { ok: false, aviso: 'Ese archivo ya no está aquí.' };
    const r = compartirConPura(archivo, persona, permiso);
    setUltimoAviso(r.aviso);
    if (r.ok) setArchivos((prev) => prev.map((a) => (a.nodo.id === nodoId ? r.archivo : a)));
    return { ok: r.ok, aviso: r.aviso };
  }, [buscar]);

  const cambiarPermiso = useCallback((nodoId: string, personaId: string, permiso: PermisoNube) => {
    setArchivos((prev) => prev.map((a) => (a.nodo.id === nodoId ? cambiarPermisoPura(a, personaId, permiso) : a)));
  }, []);

  const quitarAcceso = useCallback((nodoId: string, personaId: string): ResultadoAccionNube => {
    const archivo = buscar(nodoId);
    if (!archivo) return { ok: false, aviso: 'Ese archivo ya no está aquí.' };
    const r = quitarAccesoPura(archivo, personaId);
    setUltimoAviso(r.aviso);
    setArchivos((prev) => prev.map((a) => (a.nodo.id === nodoId ? r.archivo : a)));
    return { ok: true, aviso: r.aviso };
  }, [buscar]);

  /* ── enlace público ─────────────────────────────────────────────────── */

  const generarEnlace = useCallback((nodoId: string, permiso: PermisoNube) => {
    setArchivos((prev) => prev.map((a) => (a.nodo.id === nodoId ? generarEnlacePura(a, permiso) : a)));
    setUltimoAviso('Se generó un enlace público.');
  }, []);

  const revocarEnlace = useCallback((nodoId: string) => {
    setArchivos((prev) => prev.map((a) => (a.nodo.id === nodoId ? revocarEnlacePura(a) : a)));
    setUltimoAviso('Se revocó el enlace. Quien ya había entrado, ya lo vio.');
  }, []);

  const abrirEnlace = useCallback((nodoId: string, persona: PersonaNube): ResultadoAccionNube => {
    const archivo = buscar(nodoId);
    if (!archivo) return { ok: false, aviso: 'Ese archivo ya no está aquí.' };
    const r = abrirEnlacePura(archivo, persona);
    setUltimoAviso(r.aviso);
    setArchivos((prev) => prev.map((a) => (a.nodo.id === nodoId ? r.archivo : a)));
    return { ok: r.ok, aviso: r.aviso };
  }, [buscar]);

  /* ── coautoría ──────────────────────────────────────────────────────── */

  const entrarAEditar = useCallback((nodoId: string, persona: PersonaNube) => {
    setArchivos((prev) => prev.map((a) => (a.nodo.id === nodoId ? entrarAEditarPura(a, persona) : a)));
  }, []);

  const salirDeEditar = useCallback((nodoId: string, personaId: string) => {
    setArchivos((prev) => prev.map((a) => (a.nodo.id === nodoId ? salirDeEditarPura(a, personaId) : a)));
  }, []);

  const guardarCambios = useCallback(
    (
      nodoId: string,
      version: { autor: PersonaNube; fecha: string; resumen?: string; basadaEnVersionId: string | null },
    ): ResultadoAccionNube => {
      const archivo = buscar(nodoId);
      if (!archivo) return { ok: false, aviso: 'Ese archivo ya no está aquí.' };
      const r = guardarCambiosPura(archivo, { ...version, id: nuevoId('v') }, conexionRef.current);
      setUltimoAviso(r.aviso);
      if (!r.ok) return { ok: false, aviso: r.aviso };
      setArchivos((prev) => prev.map((a) => (a.nodo.id === nodoId ? r.archivo : a)));
      if (conexionRef.current === 'sin-conexion' && r.archivo.estado === 'solo-local') {
        setColaPendiente((prev) => (prev.includes(nodoId) ? prev : [...prev, nodoId]));
      }
      return { ok: true, aviso: r.aviso };
    },
    [buscar, nuevoId],
  );

  const resolverConflicto = useCallback((nodoId: string, eleccion: EleccionConflicto): ResultadoAccionNube => {
    const archivo = buscar(nodoId);
    if (!archivo) return { ok: false, aviso: 'Ese archivo ya no está aquí.' };
    const r = resolverConflictoPura(archivo, eleccion);
    setUltimoAviso(r.aviso);
    if (r.ok) setArchivos((prev) => prev.map((a) => (a.nodo.id === nodoId ? r.archivo : a)));
    return { ok: r.ok, aviso: r.aviso };
  }, [buscar]);

  const restaurarVersion = useCallback((nodoId: string, versionId: string): ResultadoAccionNube => {
    const archivo = buscar(nodoId);
    if (!archivo) return { ok: false, aviso: 'Ese archivo ya no está aquí.' };
    const r = restaurarVersionPura(archivo, versionId);
    setUltimoAviso(r.aviso);
    if (r.ok) setArchivos((prev) => prev.map((a) => (a.nodo.id === nodoId ? r.archivo : a)));
    return { ok: r.ok, aviso: r.aviso };
  }, [buscar]);

  /* ── subir, y la conexión ───────────────────────────────────────────── */

  const subir = useCallback(
    (nodoId: string): ResultadoAccionNube => {
      const archivo = buscar(nodoId);
      if (!archivo) return { ok: false, aviso: 'Ese archivo ya no está aquí.' };

      if (conexionRef.current === 'sin-conexion') {
        setColaPendiente((prev) => (prev.includes(nodoId) ? prev : [...prev, nodoId]));
        const aviso = 'Sin conexión: esto se subirá solo en cuanto vuelva internet.';
        setUltimoAviso(aviso);
        return { ok: false, aviso };
      }

      if (espacioLlenoParaSubir(espacio, tamanoDe(archivo.nodo))) {
        const aviso = 'No hay espacio: la nube está llena. Borra algo o amplía tu plan antes de subir más.';
        setUltimoAviso(aviso);
        return { ok: false, aviso };
      }

      setArchivos((prev) => prev.map((a) => (a.nodo.id === nodoId ? iniciarSubidaPura(a) : a)));
      setUltimoAviso('Subiendo…');
      return { ok: true, aviso: 'Subiendo…' };
    },
    [buscar, espacio],
  );

  const completarSubida = useCallback((nodoId: string) => {
    setArchivos((prev) => prev.map((a) => (a.nodo.id === nodoId ? completarSubidaPura(a) : a)));
  }, []);

  const perderConexion = useCallback(() => {
    setConexion('sin-conexion');
    setUltimoAviso('Se perdió la conexión. Lo que ya tenías sigue disponible; lo nuevo esperará.');
  }, []);

  const recuperarConexion = useCallback(() => {
    setConexion('en-linea');
    const cola = colaRef.current;
    if (cola.length === 0) {
      setUltimoAviso('Volvió la conexión.');
      return;
    }
    setArchivos((prev) => prev.map((a) => (cola.includes(a.nodo.id) ? iniciarSubidaPura(a) : a)));
    setUltimoAviso(`Volvió la conexión: subiendo ${cola.length} archivo${cola.length === 1 ? '' : 's'} pendiente${cola.length === 1 ? '' : 's'}.`);
    setColaPendiente([]);
  }, []);

  const reiniciar = useCallback(() => {
    contador.current = 0;
    setArchivos(inicialRef.current);
    setSeleccionId(null);
    setConexion(conexionInicial);
    setColaPendiente([]);
    setUltimoAviso(null);
  }, [conexionInicial]);

  return {
    archivos,
    seleccionId,
    conexion,
    colaPendiente,
    espacio,
    ultimoAviso,

    seleccionar,

    compartir,
    cambiarPermiso,
    quitarAcceso,

    generarEnlace,
    revocarEnlace,
    abrirEnlace,

    entrarAEditar,
    salirDeEditar,
    guardarCambios,
    resolverConflicto,
    restaurarVersion,

    subir,
    completarSubida,

    perderConexion,
    recuperarConexion,

    reiniciar,
  };
}
