'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  crearPestana,
  irAdelante,
  irAtras,
  navegarEnPestana,
  paginaDe,
  recargarPestana,
  urlDeBusqueda as urlDeBusquedaPorDefecto,
  type Descarga,
  type EntradaHistorial,
  type EstadoPestana,
  type MapaSitios,
  type Marcador,
  type PaginaWeb,
  type VentanaEmergente,
} from './tiposNavegador';

/**
 * TECNIA NAVEGADOR · LA MÁQUINA
 *
 * Todo el estado del navegador vive aquí; `VentanaNavegador` no tiene ni un
 * `useState`, igual que `useMuro`/`VentanaMuro` y `useAsistente`/
 * `VentanaAsistente`. La actividad lee lo que este gancho devuelve y lo pinta.
 *
 * ── Por qué `mapa` se lee de una `ref` dentro de los callbacks ─────────────
 *
 * Los manejadores (`navegar`, `marcar`, `descargar`…) corren en un evento,
 * no durante el render: si leyeran `opciones.mapa` capturado en el cierre del
 * `useCallback` de su primer render, un mapa que cambiara después quedaría
 * congelado. `mapaRef` se actualiza en un efecto sin dependencias tras CADA
 * render, el mismo patrón que `guionRef` en `useAsistente`. Lo que sí se lee
 * directo de `opciones.mapa` es `paginaActual`, porque eso corre DURANTE el
 * render (es simplemente la prop de este render, no hace falta un ref).
 *
 * ── Por qué `pestanas`+`activaId` viven en UN solo `useState` ──────────────
 *
 * Cerrar la pestaña activa cambia las dos cosas a la vez (qué pestañas quedan
 * y cuál pasa a ser la activa). Si vivieran en dos `useState` separados, un
 * `setPestanas` y un `setActivaId` en el mismo evento podrían aplicarse sobre
 * una foto vieja el uno del otro. Un solo objeto los mantiene consistentes
 * sin que haga falta coordinarlos a mano.
 *
 * ── Las reglas de juego sucio, todas resueltas SIN romper nada ─────────────
 *
 *  · Atrás/adelante con la pila vacía: no-op (`irAtras`/`irAdelante`, puras).
 *  · Navegar con la URL vacía (o sólo espacios): no-op, no ensucia el
 *    historial ni la pila.
 *  · Navegar a una URL que no está en el mapa: se ve un «no encontrado»
 *    (`paginaDe` cae en `paginaNoEncontrada`), pero la pila SÍ avanza — es
 *    justo lo que haría un navegador real.
 *  · Cerrar la última pestaña: no-op. Un navegador nunca se queda sin
 *    ninguna pestaña abierta.
 *  · Recargar cien veces / abrir treinta pestañas: sin límite artificial;
 *    sólo se prueba que no revienta y que los ids siguen siendo únicos.
 */

export interface OpcionesNavegador {
  mapa: MapaSitios;
  /** Con qué URL arranca la primera pestaña. */
  inicio: string;
  /** Cómo se arma la URL de búsqueda a partir de lo escrito. Por omisión, `urlDeBusqueda`. */
  urlDeBusqueda?: (consulta: string) => string;
  /** Etiqueta a guardar junto a cada visita. Por omisión "Ahora": el armazón no calcula tiempo real. */
  momento?: string;
}

interface EstadoPestanas {
  pestanas: EstadoPestana[];
  activaId: string;
}

/** Fuera de la numeración `t1`, `t2`… que reparte `nuevoId`: ver el porqué
 *  donde se usa, en el inicializador de `estado` y en `reiniciar`. */
const ID_PESTANA_INICIAL = 't0';

export interface Navegador {
  pestanas: EstadoPestana[];
  activaId: string;
  pestanaActiva: EstadoPestana;
  /** La página resuelta de la pestaña activa. Nunca `undefined`: cae en «no encontrada». */
  paginaActual: PaginaWeb;
  puedeAtras: boolean;
  puedeAdelante: boolean;
  historial: EntradaHistorial[];
  marcadores: Marcador[];
  descargas: Descarga[];
  emergentes: VentanaEmergente[];

  navegar: (url: string, pestanaId?: string) => void;
  atras: (pestanaId?: string) => void;
  adelante: (pestanaId?: string) => void;
  recargar: (pestanaId?: string) => void;
  nuevaPestana: (url?: string) => string;
  cerrarPestana: (id: string) => void;
  activarPestana: (id: string) => void;
  buscar: (consulta: string, pestanaId?: string) => void;

  marcar: (url: string, titulo?: string) => void;
  desmarcar: (url: string) => void;
  estaMarcada: (url: string) => boolean;

  descargar: (nombre: string, opciones?: { sospechosa?: boolean }) => void;
  abrirEmergente: (url: string) => string;
  cerrarEmergente: (id: string) => void;

  reiniciar: () => void;
}

export function useNavegador(opciones: OpcionesNavegador): Navegador {
  const mapaRef = useRef(opciones.mapa);
  const inicialRef = useRef(opciones.inicio);
  const momentoRef = useRef(opciones.momento ?? 'Ahora');
  const urlBusquedaRef = useRef(opciones.urlDeBusqueda ?? urlDeBusquedaPorDefecto);
  useEffect(() => {
    mapaRef.current = opciones.mapa;
    momentoRef.current = opciones.momento ?? 'Ahora';
    urlBusquedaRef.current = opciones.urlDeBusqueda ?? urlDeBusquedaPorDefecto;
  });

  const contador = useRef(0);
  const nuevoId = useCallback((prefijo: string) => {
    contador.current += 1;
    return `${prefijo}${contador.current}`;
  }, []);

  /*
   * `ID_PESTANA_INICIAL` vive en un espacio de ids aparte del contador de
   * `nuevoId` (que arranca en `'t1'`), a propósito: antes la primera pestaña
   * también se llamaba `'t1'` a mano, y el PRIMER `nuevaPestana()` generaba
   * otra vez `'t1'` — dos pestañas con el mismo id. Lo cazó
   * `simulador-navegador.test.tsx`: cerrar esa pestaña «nueva» borraba las
   * DOS (mismo id) y `cerrarPestana` tronaba eligiendo una pestaña activa
   * entre cero: `quedan[quedan.length - 1]` era `undefined`. No se arregla
   * generando el id inicial con `nuevoId()` porque eso leería la `ref` del
   * contador DURANTE el render (el inicializador de `useState` corre ahí) —
   * lo prohíbe la regla `react-hooks/refs`. Un id reservado, fuera de la
   * numeración de `nuevoId`, evita la colisión sin leer ninguna `ref`.
   */
  const [estado, setEstado] = useState<EstadoPestanas>(() => {
    const p = crearPestana(ID_PESTANA_INICIAL, opciones.inicio);
    return { pestanas: [p], activaId: p.id };
  });
  const estadoRef = useRef(estado);
  useEffect(() => {
    estadoRef.current = estado;
  });

  const [historial, setHistorial] = useState<EntradaHistorial[]>([]);
  const [marcadores, setMarcadores] = useState<Marcador[]>([]);
  const [descargas, setDescargas] = useState<Descarga[]>([]);
  const [emergentes, setEmergentes] = useState<VentanaEmergente[]>([]);

  /* Las `ref` se leen ANTES del actualizador, nunca dentro. Un actualizador
   * corre durante el pintado y React lo invoca dos veces en modo estricto: leer
   * una `ref` ahí es justo lo que prohíbe `react-hooks/refs`, y el linter no lo
   * ve porque no mira dentro de la función que se le pasa a `setState`. */
  const registrarVisita = useCallback((url: string) => {
    const pagina = paginaDe(mapaRef.current, url);
    const momento = momentoRef.current;
    setHistorial((prev) => [...prev, { url, titulo: pagina.titulo, momento }]);
  }, []);

  // ── Navegar, atrás, adelante, recargar ────────────────────────────────────

  const navegar = useCallback(
    (url: string, pestanaId?: string) => {
      const limpio = url.trim();
      if (limpio === '') return; // jugar MAL: URL vacía no navega a ningún lado
      setEstado((prev) => ({
        ...prev,
        pestanas: prev.pestanas.map((p) => (p.id === (pestanaId ?? prev.activaId) ? navegarEnPestana(p, limpio) : p)),
      }));
      registrarVisita(limpio);
    },
    [registrarVisita],
  );

  const atras = useCallback((pestanaId?: string) => {
    setEstado((prev) => ({
      ...prev,
      pestanas: prev.pestanas.map((p) => (p.id === (pestanaId ?? prev.activaId) ? irAtras(p) : p)),
    }));
  }, []);

  const adelante = useCallback((pestanaId?: string) => {
    setEstado((prev) => ({
      ...prev,
      pestanas: prev.pestanas.map((p) => (p.id === (pestanaId ?? prev.activaId) ? irAdelante(p) : p)),
    }));
  }, []);

  const recargar = useCallback((pestanaId?: string) => {
    setEstado((prev) => ({
      ...prev,
      pestanas: prev.pestanas.map((p) => (p.id === (pestanaId ?? prev.activaId) ? recargarPestana(p) : p)),
    }));
  }, []);

  // ── Pestañas ────────────────────────────────────────────────────────────

  const nuevaPestana = useCallback(
    (url?: string) => {
      const id = nuevoId('t');
      const p = crearPestana(id, url ?? inicialRef.current);
      setEstado((prev) => ({ pestanas: [...prev.pestanas, p], activaId: id }));
      registrarVisita(p.url);
      return id;
    },
    [nuevoId, registrarVisita],
  );

  const cerrarPestana = useCallback((id: string) => {
    setEstado((prev) => {
      if (prev.pestanas.length <= 1) return prev; // jugar MAL: nunca te quedas sin pestañas
      const quedan = prev.pestanas.filter((p) => p.id !== id);
      if (quedan.length === prev.pestanas.length) return prev; // id que no existe
      const activaId = prev.activaId === id ? quedan[quedan.length - 1].id : prev.activaId;
      return { pestanas: quedan, activaId };
    });
  }, []);

  const activarPestana = useCallback((id: string) => {
    setEstado((prev) => (prev.activaId === id || !prev.pestanas.some((p) => p.id === id) ? prev : { ...prev, activaId: id }));
  }, []);

  // ── Buscar ──────────────────────────────────────────────────────────────

  const buscar = useCallback(
    (consulta: string, pestanaId?: string) => {
      const limpio = consulta.trim();
      if (limpio === '') return;
      navegar(urlBusquedaRef.current(limpio), pestanaId);
    },
    [navegar],
  );

  // ── Marcadores ──────────────────────────────────────────────────────────

  const marcar = useCallback((url: string, titulo?: string) => {
    const pagina = paginaDe(mapaRef.current, url);
    setMarcadores((prev) => {
      if (prev.some((m) => m.url === url)) return prev; // idempotente
      return [...prev, { url, titulo: titulo ?? pagina.titulo }];
    });
  }, []);

  const desmarcar = useCallback((url: string) => {
    setMarcadores((prev) => prev.filter((m) => m.url !== url));
  }, []);

  const estaMarcada = useCallback((url: string) => marcadores.some((m) => m.url === url), [marcadores]);

  // ── Descargas y emergentes ─────────────────────────────────────────────

  const descargar = useCallback(
    (nombre: string, opts?: { sospechosa?: boolean }) => {
      const activa = estadoRef.current.pestanas.find((p) => p.id === estadoRef.current.activaId);
      const urlOrigen = activa?.url ?? inicialRef.current;
      /* El id se pide FUERA del actualizador. `nuevoId` sube un contador que
       * vive en una `ref`, o sea que **escribe** durante el pintado; en modo
       * estricto el actualizador corre dos veces y el contador saltaba de dos
       * en dos, repartiendo `d2` donde tocaba `d1`. Mismo id observable fuera
       * del modo estricto: aquí no cambia nada de lo que se ve. */
      const id = nuevoId('d');
      const momento = momentoRef.current;
      setDescargas((prev) => [...prev, { id, nombre, urlOrigen, momento, sospechosa: opts?.sospechosa }]);
    },
    [nuevoId],
  );

  const abrirEmergente = useCallback(
    (url: string) => {
      const activa = estadoRef.current.pestanas.find((p) => p.id === estadoRef.current.activaId);
      const urlOrigen = activa?.url ?? inicialRef.current;
      const id = nuevoId('e');
      const pagina = paginaDe(mapaRef.current, url);
      setEmergentes((prev) => [...prev, { id, urlOrigen, pagina }]);
      return id;
    },
    [nuevoId],
  );

  const cerrarEmergente = useCallback((id: string) => {
    setEmergentes((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ── Reiniciar ───────────────────────────────────────────────────────────

  const reiniciar = useCallback(() => {
    contador.current = 0;
    const p = crearPestana(ID_PESTANA_INICIAL, inicialRef.current);
    setEstado({ pestanas: [p], activaId: p.id });
    setHistorial([]);
    setMarcadores([]);
    setDescargas([]);
    setEmergentes([]);
  }, []);

  // ── Derivados ───────────────────────────────────────────────────────────

  const pestanaActiva = estado.pestanas.find((p) => p.id === estado.activaId) ?? estado.pestanas[0];
  const paginaActual = paginaDe(opciones.mapa, pestanaActiva.url);

  return {
    pestanas: estado.pestanas,
    activaId: estado.activaId,
    pestanaActiva,
    paginaActual,
    puedeAtras: pestanaActiva.atras.length > 0,
    puedeAdelante: pestanaActiva.adelante.length > 0,
    historial,
    marcadores,
    descargas,
    emergentes,
    navegar,
    atras,
    adelante,
    recargar,
    nuevaPestana,
    cerrarPestana,
    activarPestana,
    buscar,
    marcar,
    desmarcar,
    estaMarcada,
    descargar,
    abrirEmergente,
    cerrarEmergente,
    reiniciar,
  };
}
