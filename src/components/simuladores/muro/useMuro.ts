'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  publicacionesVisibles,
  type AccionMuro,
  type AutorMuro,
  type ComentarioMuro,
  type ConsecuenciaMuro,
  type CopiaMuro,
  type ImagenMuro,
  type PerfilMuro,
  type PublicacionMuro,
  type Visibilidad,
} from './tiposMuro';

/**
 * TECNIA MURO · LA MÁQUINA
 *
 * Todo el estado del muro vive aquí; `VentanaMuro` no tiene ni un
 * `useState`, igual que `useAsistente`/`VentanaAsistente`. La actividad lee
 * lo que este gancho devuelve y lo pinta.
 *
 * ── Por qué los guardas leen de una `ref` y no del `state` cerrado ─────────
 *
 * Cada acción (`borrar`, `comentar`…) necesita saber el estado YA COMITIDO
 * de la publicación para decidir si es legal (¿ya estaba borrada? ¿existe?).
 * Leerlo del `publicaciones` capturado en el cierre del `useCallback`
 * obligaría a regenerar la función en cada cambio o arriesgar un valor
 * viejo; en vez de eso se lee `pubRef.current`, que un efecto sin
 * dependencias mantiene al día tras cada render — el mismo patrón que
 * `propsRef` en `useLabActividad` y `ocupadoRef` en `useAsistente`.
 *
 * ── Por qué los ids se generan ANTES de `setPublicaciones`, no adentro ─────
 *
 * `nuevoId()` muta un contador. Si esa mutación viviera dentro del cuerpo de
 * un actualizador funcional (`setPublicaciones((prev) => …)`), una
 * reejecución del actualizador (algo que React puede hacer) generaría ids
 * distintos en cada pasada. Aquí el id y el objeto nuevo se arman fuera, y
 * el actualizador que se le pasa a `setPublicaciones` es una función pura
 * del `prev` — exactamente como hace `mandar()` en `useAsistente`.
 *
 * ── Por qué `comentar` rechaza una publicación borrada y `inyectarConsecuencia` no ──
 *
 * `comentar` es el alumno interactuando con lo que VE en el muro; si ya la
 * borró, no hay nada ahí que comentar y se lo dice (`'borrada'`).
 * `inyectarConsecuencia` es la actividad representando a ALGUIEN MÁS que ya
 * había visto la publicación antes de que se borrara — por eso ignora el
 * candado: es justo la consecuencia diferida que este armazón existe para
 * poder representar.
 */

export type ResultadoPublicar = 'publicada' | 'vacia';
export type ResultadoAccion = 'ok' | 'no-existe' | 'borrada';
export type ResultadoComentar = 'ok' | 'no-existe' | 'borrada' | 'vacio';

export interface DatosPublicar {
  texto: string;
  /** Si se omite, publica como `opciones.alumno`. */
  autor?: AutorMuro;
  imagen?: ImagenMuro;
  /** Por omisión "Ahora": el armazón no calcula tiempo real. */
  fecha?: string;
  /** Por omisión `'publico'`. */
  visibilidad?: Visibilidad;
  /** Por omisión las cinco acciones. La actividad recorta lo que no aplique. */
  acciones?: AccionMuro[];
  pistas?: string[];
}

export interface OpcionesMuro {
  /** Con qué arranca el muro. Se lee UNA vez, al montar (igual que el saludo de `useAsistente`). */
  publicaciones?: PublicacionMuro[];
  /** Quién es "yo": el autor por omisión al publicar o comentar sin indicar otro. */
  alumno: AutorMuro;
}

export interface Muro {
  /** El arreglo completo, CON las borradas — la historia nunca se recorta. */
  publicaciones: PublicacionMuro[];
  /** Selector de conveniencia sobre `publicaciones`; ver `publicacionesVisibles`. */
  visibles: (opciones?: { incluirBorradas?: boolean; visibilidad?: Visibilidad[] }) => PublicacionMuro[];
  publicar: (datos: DatosPublicar) => ResultadoPublicar;
  darMeGusta: (id: string) => ResultadoAccion;
  comentar: (id: string, texto: string, autor?: AutorMuro) => ResultadoComentar;
  compartir: (id: string) => ResultadoAccion;
  reportar: (id: string) => ResultadoAccion;
  /** Marca `borrada: true`. Nunca quita el elemento del arreglo. */
  borrar: (id: string) => ResultadoAccion;
  cambiarVisibilidad: (id: string, v: Visibilidad) => ResultadoAccion;
  /** La actividad inyecta un evento "de después": comentario, reenvío o copia. */
  inyectarConsecuencia: (c: ConsecuenciaMuro) => void;
  /** Arma el perfil de un autor a partir de lo que publicó. Nunca `null`: un
   *  autor sin publicaciones da un perfil con `publicaciones: []`. */
  perfilDe: (autor: AutorMuro, opciones?: { bio?: string; visibilidad?: Visibilidad[] }) => PerfilMuro;
  reiniciar: (publicaciones?: PublicacionMuro[]) => void;
}

const ACCIONES_POR_DEFECTO: AccionMuro[] = ['me-gusta', 'comentar', 'compartir', 'reportar', 'borrar'];

export function useMuro(opciones: OpcionesMuro): Muro {
  /*
   * `publicaciones` inicial se lee de `opciones` DIRECTO en el inicializador
   * perezoso de `useState` — no de un ref: leer `.current` de un ref dentro
   * del cuerpo de un componente (aunque sea para darle el valor a otro hook)
   * es exactamente lo que `react-hooks/refs` prohíbe. `inicialRef` guarda el
   * mismo arreglo aparte, sólo para que `reiniciar()` pueda volver a él.
   */
  const inicialRef = useRef(opciones.publicaciones ?? []);
  const alumnoRef = useRef(opciones.alumno);
  useEffect(() => {
    alumnoRef.current = opciones.alumno;
  });

  const [publicaciones, setPublicaciones] = useState<PublicacionMuro[]>(() => opciones.publicaciones ?? []);
  const pubRef = useRef(publicaciones);
  useEffect(() => {
    pubRef.current = publicaciones;
  });

  const contador = useRef(0);
  const nuevoId = useCallback((prefijo: string) => {
    contador.current += 1;
    return `${prefijo}${contador.current}`;
  }, []);

  const visibles = useCallback(
    (opts?: { incluirBorradas?: boolean; visibilidad?: Visibilidad[] }) => publicacionesVisibles(publicaciones, opts),
    [publicaciones],
  );

  const publicar = useCallback(
    (datos: DatosPublicar): ResultadoPublicar => {
      const limpio = datos.texto.trim();
      if (limpio === '') return 'vacia';
      const nueva: PublicacionMuro = {
        id: nuevoId('p'),
        autor: datos.autor ?? alumnoRef.current,
        texto: limpio,
        imagen: datos.imagen,
        fecha: datos.fecha ?? 'Ahora',
        visibilidad: datos.visibilidad ?? 'publico',
        meGusta: 0,
        meGustaDelAlumno: false,
        comentarios: [],
        compartidos: 0,
        acciones: datos.acciones ?? ACCIONES_POR_DEFECTO,
        copiasSobrevivientes: [],
        pistas: datos.pistas,
      };
      setPublicaciones((prev) => [nueva, ...prev]);
      return 'publicada';
    },
    [nuevoId],
  );

  const darMeGusta = useCallback((id: string): ResultadoAccion => {
    const actual = pubRef.current.find((p) => p.id === id);
    if (!actual) return 'no-existe';
    if (actual.borrada) return 'borrada';
    setPublicaciones((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const activo = !p.meGustaDelAlumno;
        return { ...p, meGustaDelAlumno: activo, meGusta: p.meGusta + (activo ? 1 : -1) };
      }),
    );
    return 'ok';
  }, []);

  const comentar = useCallback(
    (id: string, texto: string, autor?: AutorMuro): ResultadoComentar => {
      const actual = pubRef.current.find((p) => p.id === id);
      if (!actual) return 'no-existe';
      if (actual.borrada) return 'borrada';
      const limpio = texto.trim();
      if (limpio === '') return 'vacio';
      const nuevo: ComentarioMuro = { id: nuevoId('c'), autor: autor ?? alumnoRef.current, texto: limpio, fecha: 'Ahora' };
      setPublicaciones((prev) => prev.map((p) => (p.id === id ? { ...p, comentarios: [...p.comentarios, nuevo] } : p)));
      return 'ok';
    },
    [nuevoId],
  );

  const compartir = useCallback((id: string): ResultadoAccion => {
    const actual = pubRef.current.find((p) => p.id === id);
    if (!actual) return 'no-existe';
    if (actual.borrada) return 'borrada';
    setPublicaciones((prev) => prev.map((p) => (p.id === id ? { ...p, compartidos: p.compartidos + 1 } : p)));
    return 'ok';
  }, []);

  const reportar = useCallback((id: string): ResultadoAccion => {
    const actual = pubRef.current.find((p) => p.id === id);
    if (!actual) return 'no-existe';
    if (actual.borrada) return 'borrada';
    setPublicaciones((prev) => prev.map((p) => (p.id === id ? { ...p, reportada: true } : p)));
    return 'ok';
  }, []);

  const borrar = useCallback((id: string): ResultadoAccion => {
    const actual = pubRef.current.find((p) => p.id === id);
    if (!actual) return 'no-existe';
    if (actual.borrada) return 'borrada'; // ya estaba: idempotente, no toca copiasSobrevivientes
    setPublicaciones((prev) => prev.map((p) => (p.id === id ? { ...p, borrada: true } : p)));
    return 'ok';
  }, []);

  const cambiarVisibilidad = useCallback((id: string, v: Visibilidad): ResultadoAccion => {
    const actual = pubRef.current.find((p) => p.id === id);
    if (!actual) return 'no-existe';
    if (actual.borrada) return 'borrada';
    setPublicaciones((prev) => prev.map((p) => (p.id === id ? { ...p, visibilidad: v } : p)));
    return 'ok';
  }, []);

  const inyectarConsecuencia = useCallback(
    (c: ConsecuenciaMuro) => {
      if (c.tipo === 'comentario') {
        const nuevo: ComentarioMuro = {
          id: c.comentario.id ?? nuevoId('c'),
          autor: c.comentario.autor,
          texto: c.comentario.texto,
          fecha: c.comentario.fecha,
        };
        setPublicaciones((prev) =>
          prev.map((p) => (p.id === c.publicacionId ? { ...p, comentarios: [...p.comentarios, nuevo] } : p)),
        );
        return;
      }
      if (c.tipo === 'compartido') {
        const cantidad = c.cantidad ?? 1;
        setPublicaciones((prev) =>
          prev.map((p) => (p.id === c.publicacionId ? { ...p, compartidos: p.compartidos + cantidad } : p)),
        );
        return;
      }
      const nuevaCopia: CopiaMuro = { id: c.copia.id ?? nuevoId('k'), texto: c.copia.texto };
      setPublicaciones((prev) =>
        prev.map((p) =>
          p.id === c.publicacionId ? { ...p, copiasSobrevivientes: [...p.copiasSobrevivientes, nuevaCopia] } : p,
        ),
      );
    },
    [nuevoId],
  );

  const perfilDe = useCallback(
    (autor: AutorMuro, opts?: { bio?: string; visibilidad?: Visibilidad[] }): PerfilMuro => {
      const permitidas = opts?.visibilidad;
      // Lee `publicaciones` (el estado reactivo), NO `pubRef.current`: a
      // diferencia de los guardas de las acciones (que corren en un
      // manejador de evento, DESPUÉS de que el efecto sin dependencias ya
      // sincronizó el ref del commit anterior), `perfilDe` existe para
      // lecturas derivadas dentro del render (p. ej. un `useMemo` que
      // recalcula el perfil en el MISMO render donde `borrar`/
      // `cambiarVisibilidad` acaban de cambiar el estado). Leer el ref ahí
      // devuelve el valor de un commit atrás — un turno de retraso que sólo
      // aparece jugando la clase de verdad, no en una prueba que envuelve
      // cada cambio en `act()`. Encontrado el 15-ago-2026 por
      // `n7-privacidad-en-redes`, la primera clase en usar `perfilDe` desde
      // un render reactivo. Mismo patrón que `visibles`, que ya leía
      // `publicaciones` directo por esta misma razón.
      const propias = publicaciones.filter(
        (p) => p.autor.id === autor.id && !p.borrada && (!permitidas || permitidas.includes(p.visibilidad)),
      );
      const pistas = propias.flatMap((p) => p.pistas ?? []);
      return { autor, bio: opts?.bio, publicaciones: propias, pistas };
    },
    [publicaciones],
  );

  const reiniciar = useCallback((nuevas?: PublicacionMuro[]) => {
    contador.current = 0;
    setPublicaciones(nuevas ?? inicialRef.current);
  }, []);

  return {
    publicaciones,
    visibles,
    publicar,
    darMeGusta,
    comentar,
    compartir,
    reportar,
    borrar,
    cambiarVisibilidad,
    inyectarConsecuencia,
    perfilDe,
    reiniciar,
  };
}
