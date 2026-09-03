/**
 * Tecnia Nube — el armazón «el servicio de almacenamiento y trabajo en la
 * nube» (CANON-ARMAZONES.md, «10 · Tecnia Nube»).
 *
 *   tiposNube.ts   los datos y las funciones puras (nada de React); envuelve
 *                  `ArchivoSO` de `simuladores/sistema/` — es el mismo árbol
 *   useNube.ts     el estado: compartir, enlace público, coautoría,
 *                  conflicto, subir/bajar y qué pasa sin conexión
 *   VentanaNube.tsx la ventana: lista + detalle, sin un solo `useState`
 *
 * Cómo se monta una clase:
 *
 *   const nube = useNube({ archivos: SEMILLA, capacidad: 5_000_000_000 });
 *   <VentanaBase marca="Tecnia Nube">
 *     <VentanaNube
 *       archivos={nube.archivos} seleccionId={nube.seleccionId}
 *       onSeleccionar={nube.seleccionar} conexion={nube.conexion}
 *       colaPendiente={nube.colaPendiente} espacio={nube.espacio}
 *       onQuitarAcceso={nube.quitarAcceso} ...
 *     />
 *   </VentanaBase>
 */
export {
  abrirEnlace,
  calcularEspacioNube,
  cambiarPermiso,
  compartirCon,
  completarSubida,
  entrarAEditar,
  esCarpeta,
  espacioLlenoParaSubir,
  generarEnlace,
  guardarCambios,
  iniciarSubida,
  quitarAcceso,
  resolverConflicto,
  restaurarVersion,
  revocarEnlace,
  salirDeEditar,
  tamanoDe,
  type AccesoNube,
  type ArchivoNube,
  type ConflictoArchivo,
  type EleccionConflicto,
  type EnlacePublico,
  type EspacioNube,
  type EstadoConexion,
  type EstadoSync,
  type MotivoRechazoCompartir,
  type MotivoRechazoGuardar,
  type MotivoRechazoResolver,
  type MotivoRechazoRestaurar,
  type NodoSO,
  type NuevaVersion,
  type PermisoNube,
  type PersonaNube,
  type ResultadoAbrirEnlace,
  type ResultadoCompartir,
  type ResultadoGuardar,
  type ResultadoQuitarAcceso,
  type ResultadoResolver,
  type ResultadoRestaurarNube,
  type VersionArchivo,
} from './tiposNube';

export { useNube } from './useNube';
export type { Nube, OpcionesNube, ResultadoAccionNube } from './useNube';

export { VentanaNube } from './VentanaNube';
export type { FormularioCompartir, FormularioEnlace, VentanaNubeProps } from './VentanaNube';
