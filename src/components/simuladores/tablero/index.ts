/**
 * Tecnia Tablero — el tablero de tareas por columnas de la plataforma.
 *
 *   tiposTablero.ts   los datos y las funciones puras (nada de React)
 *   useTablero.ts     el estado: mover, crear, editar, borrar, quitar columna
 *   VentanaTablero.tsx la ventana, sin un solo `useState`
 *
 * Sale de partir «10 · Tecnia Nube» del canon: un tablero de tareas no se
 * parece por dentro a un servicio de archivos compartidos.
 *
 * Mover una tarjeta es `moverTarjeta`, una función pura; NO hay arrastre (ver
 * la decisión 1 en `tiposTablero.ts`).
 *
 * Cómo se monta una clase:
 *
 *   const tablero = useTablero({ columnas: COLUMNAS, tarjetas: SEMILLA });
 *   <VentanaBase marca="Tecnia Tablero" subtitulo="Proyecto de ciencias">
 *     <VentanaTablero
 *       datos={tablero.datos} hoy="2026-08-15"
 *       seleccionId={tablero.seleccionId}
 *       onMover={(id, col) => { const r = tablero.mover(id, col); ... }}
 *       onTarjeta={tablero.seleccionar}
 *     />
 *   </VentanaBase>
 */
export {
  borrarColumna,
  borrarTarjeta,
  cargaPorPersona,
  columnaDe,
  crearTarjeta,
  editarTarjeta,
  estadoFecha,
  moverTarjeta,
  tarjetaDe,
  tarjetasDe,
  tarjetasSinFecha,
  tarjetasSinResponsable,
  type CambioTarjeta,
  type ColumnaTablero,
  type DatosTablero,
  type EstadoFecha,
  type EtiquetaTablero,
  type MotivoBorrarColumna,
  type MotivoCrear,
  type MotivoMover,
  type NuevaTarjeta,
  type PersonaTablero,
  type ResultadoBorrarColumna,
  type ResultadoCrear,
  type ResultadoMover,
  type TarjetaTablero,
} from './tiposTablero';

export { useTablero } from './useTablero';
export type { OpcionesTablero, Tablero } from './useTablero';

export { VentanaTablero } from './VentanaTablero';
export type { VentanaTableroProps } from './VentanaTablero';
