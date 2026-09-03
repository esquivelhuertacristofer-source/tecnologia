/**
 * Tecnia Sistema — el armazón «Tecnia Escritorio» del que cuelgan 6
 * actividades (CANON-ARMAZONES.md, «8 · Tecnia Escritorio»).
 *
 *   tiposSistema.ts       el árbol de archivos, la papelera y las ventanas —
 *                         datos puros y funciones puras, nada de React
 *   useSistema.ts         el estado: navegación, operaciones, portapapeles
 *   VentanaExplorador.tsx el explorador de archivos, sin un solo `useState`
 *   Escritorio.tsx        iconos + ventanas + barra de tareas, sin `useState`
 *
 * Cómo se monta una clase (el explorador solo, dentro de `VentanaBase`):
 *
 *   const sis = useSistema({ raiz: MI_ARBOL, capacidadDisco: 64_000_000_000 });
 *   <VentanaBase marca="Tecnia Archivos">
 *     <VentanaExplorador
 *       ruta={sis.ruta} listado={sis.listado} vista={sis.vista} orden={sis.orden}
 *       seleccionId={sis.seleccionId} espacio={sis.espacio}
 *       onEntrar={sis.entrar} onSubir={sis.subir} onIrA={sis.navegarA}
 *       onSeleccionar={sis.seleccionar} onBorrar={sis.borrar} ...
 *     />
 *   </VentanaBase>
 *
 * O el escritorio completo, con el explorador como una de sus ventanas:
 *
 *   <Escritorio
 *     iconos={MIS_ICONOS} ventanas={sis.ventanas}
 *     contenido={{ [idVentana]: <VentanaExplorador ... /> }}
 *     onAbrirIcono={(i) => i.nodoId && sis.abrirNodo(i.nodoId)}
 *     onCerrarVentana={sis.cerrarVentana} onEnfocarVentana={sis.enfocarVentana}
 *   />
 */
export {
  PROGRAMAS_POR_DEFECTO,
  abrirVentana,
  borrar,
  buscar,
  buscarCarpeta,
  buscarNodo,
  calcularEspacio,
  cerrarVentana,
  contarNodos,
  copiar,
  crearCarpeta,
  enfocarVentana,
  esCarpeta,
  esDescendiente,
  existeNombre,
  extensionDe,
  minimizarVentana,
  nombreDisponible,
  nombreValido,
  ordenarHijos,
  padreDe,
  programaDe,
  renombrar,
  restaurar,
  rutaCarpeta,
  tamanoDe,
  vaciarPapelera,
} from './tiposSistema';
export type {
  ArchivoSO,
  CarpetaSO,
  ElementoPapelera,
  EspacioDisco,
  FiltroBusqueda,
  IconoEscritorio,
  MotivoNombreInvalido,
  MotivoRechazo,
  NodoSO,
  OrdenExplorador,
  ResultadoArbol,
  ResultadoBorrar,
  ResultadoRestaurar,
  TipoContenido,
  VentanaSO,
} from './tiposSistema';

export { useSistema } from './useSistema';
export type {
  ElementoPortapapeles,
  OpcionesSistema,
  ResultadoAbrir,
  ResultadoAccion,
  Sistema,
} from './useSistema';

export { VentanaExplorador, formatoBytes } from './VentanaExplorador';
export type { RenombrandoEnCurso, VentanaExploradorProps } from './VentanaExplorador';

export { Escritorio } from './Escritorio';
export type { EscritorioProps } from './Escritorio';
