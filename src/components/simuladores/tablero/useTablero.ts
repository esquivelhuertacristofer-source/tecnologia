'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  borrarColumna,
  borrarTarjeta,
  cargaPorPersona,
  crearTarjeta,
  editarTarjeta,
  moverTarjeta,
  tarjetasDe,
  tarjetasSinFecha,
  tarjetasSinResponsable,
  type CambioTarjeta,
  type ColumnaTablero,
  type DatosTablero,
  type NuevaTarjeta,
  type PersonaTablero,
  type ResultadoBorrarColumna,
  type ResultadoCrear,
  type ResultadoMover,
  type TarjetaTablero,
} from './tiposTablero';

/**
 * TECNIA TABLERO · LA MÁQUINA
 *
 * Estado del tablero; `VentanaTablero` no tiene ni un `useState`.
 *
 * Todas las reglas viven en `tiposTablero.ts` como funciones puras: este
 * gancho es la envoltura que las aplica al estado y devuelve el mismo
 * `Resultado…` que ellas. Es a propósito — así una clase puede probar la regla
 * sin montar React, y el `moverTarjeta` que corre el botón es literalmente el
 * mismo que corre la prueba.
 *
 * **No hay arrastre.** El encargo lo advierte y tiene razón: jsdom no
 * implementa `PointerEvent` y `getBoundingClientRect` devuelve ceros, así que
 * una prueba de arrastre escrita de la forma natural pasa en verde sin
 * comprobar nada. Mover se hace con los dos botones «◀ ▶» de la propia
 * tarjeta —pegados a ella, no flotando encima— y esos sí se prueban.
 *
 * `columnasVecinas` existe justo para esos dos botones: dice a qué columna
 * lleva cada uno, o `null` si la tarjeta ya está en la punta.
 */

export interface OpcionesTablero {
  /** Las columnas las da la actividad. Se leen UNA vez, al montar. */
  columnas: ColumnaTablero[];
  tarjetas?: TarjetaTablero[];
}

/* El día de hoy NO vive aquí: `estadoFecha` lo recibe por parámetro y
   `VentanaTablero` lo toma como prop. Un gancho que guardara «hoy» invitaría
   a rellenarlo con `Date.now()` en el primer descuido. */

export interface Tablero {
  datos: DatosTablero;
  columnas: ColumnaTablero[];
  tarjetas: TarjetaTablero[];
  seleccionId: string | null;
  seleccionada: TarjetaTablero | null;
  /** Las de una columna, en orden. */
  enColumna: (columnaId: string) => TarjetaTablero[];
  /** A qué columna llevan «◀» y «▶» desde donde está la tarjeta. */
  columnasVecinas: (tarjetaId: string) => { anterior: ColumnaTablero | null; siguiente: ColumnaTablero | null };
  sinResponsable: TarjetaTablero[];
  sinFecha: TarjetaTablero[];
  carga: { persona: PersonaTablero; tarjetas: number }[];

  seleccionar: (id: string | null) => void;
  mover: (tarjetaId: string, columnaId: string) => ResultadoMover;
  /** Mueve una columna a la izquierda (`-1`) o a la derecha (`+1`). */
  moverVecina: (tarjetaId: string, direccion: -1 | 1) => ResultadoMover;
  crear: (nueva: NuevaTarjeta) => ResultadoCrear;
  editar: (tarjetaId: string, cambio: CambioTarjeta) => void;
  borrar: (tarjetaId: string) => void;
  quitarColumna: (columnaId: string, opciones?: { destino?: string }) => ResultadoBorrarColumna;
  reiniciar: (datos?: DatosTablero) => void;
}

export function useTablero(opciones: OpcionesTablero): Tablero {
  const inicialRef = useRef<DatosTablero>({
    columnas: opciones.columnas,
    tarjetas: opciones.tarjetas ?? [],
  });

  const [datos, setDatos] = useState<DatosTablero>(() => ({
    columnas: opciones.columnas,
    tarjetas: opciones.tarjetas ?? [],
  }));
  const [seleccionId, setSeleccionId] = useState<string | null>(null);

  const datosRef = useRef(datos);
  useEffect(() => {
    datosRef.current = datos;
  });

  const enColumna = useCallback((columnaId: string) => tarjetasDe(datos, columnaId), [datos]);

  const columnasVecinas = useCallback(
    (tarjetaId: string) => {
      const tarjeta = datos.tarjetas.find((t) => t.id === tarjetaId);
      if (!tarjeta) return { anterior: null, siguiente: null };
      const i = datos.columnas.findIndex((c) => c.id === tarjeta.columnaId);
      if (i < 0) return { anterior: null, siguiente: null };
      return {
        anterior: datos.columnas[i - 1] ?? null,
        siguiente: datos.columnas[i + 1] ?? null,
      };
    },
    [datos],
  );

  const mover = useCallback((tarjetaId: string, columnaId: string): ResultadoMover => {
    const resultado = moverTarjeta(datosRef.current, tarjetaId, columnaId);
    if (resultado.ok) setDatos(resultado.datos);
    return resultado;
  }, []);

  const moverVecina = useCallback((tarjetaId: string, direccion: -1 | 1): ResultadoMover => {
    const actuales = datosRef.current;
    const tarjeta = actuales.tarjetas.find((t) => t.id === tarjetaId);
    if (!tarjeta) {
      return { ok: false, motivo: 'tarjeta-no-existe', aviso: 'Esa tarjeta ya no está en el tablero.', datos: actuales };
    }
    const i = actuales.columnas.findIndex((c) => c.id === tarjeta.columnaId);
    const destino = actuales.columnas[i + direccion];
    if (!destino) {
      return {
        ok: false,
        motivo: 'columna-no-existe',
        aviso: direccion === -1 ? 'Ya está en la primera columna.' : 'Ya está en la última columna.',
        datos: actuales,
      };
    }
    const resultado = moverTarjeta(actuales, tarjetaId, destino.id);
    if (resultado.ok) setDatos(resultado.datos);
    return resultado;
  }, []);

  const crear = useCallback((nueva: NuevaTarjeta): ResultadoCrear => {
    const resultado = crearTarjeta(datosRef.current, nueva);
    if (resultado.ok) setDatos(resultado.datos);
    return resultado;
  }, []);

  const editar = useCallback((tarjetaId: string, cambio: CambioTarjeta) => {
    setDatos((prev) => editarTarjeta(prev, tarjetaId, cambio));
  }, []);

  const borrar = useCallback((tarjetaId: string) => {
    setDatos((prev) => borrarTarjeta(prev, tarjetaId));
    setSeleccionId((sel) => (sel === tarjetaId ? null : sel));
  }, []);

  const quitarColumna = useCallback((columnaId: string, opts?: { destino?: string }): ResultadoBorrarColumna => {
    const resultado = borrarColumna(datosRef.current, columnaId, opts);
    if (resultado.ok) setDatos(resultado.datos);
    return resultado;
  }, []);

  const reiniciar = useCallback((nuevos?: DatosTablero) => {
    setDatos(nuevos ?? inicialRef.current);
    setSeleccionId(null);
  }, []);

  const seleccionada = seleccionId === null ? null : (datos.tarjetas.find((t) => t.id === seleccionId) ?? null);

  const derivados = useMemo(
    () => ({
      sinResponsable: tarjetasSinResponsable(datos),
      sinFecha: tarjetasSinFecha(datos),
      carga: cargaPorPersona(datos),
    }),
    [datos],
  );

  return {
    datos,
    columnas: datos.columnas,
    tarjetas: datos.tarjetas,
    seleccionId,
    seleccionada,
    enColumna,
    columnasVecinas,
    ...derivados,
    seleccionar: setSeleccionId,
    mover,
    moverVecina,
    crear,
    editar,
    borrar,
    quitarColumna,
    reiniciar,
  };
}
