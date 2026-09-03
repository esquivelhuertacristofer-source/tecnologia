/**
 * Tecnia Código — el armazón del que cuelgan 14 actividades de Python, y del
 * que **Tecnia Web hereda el editor** para otras once.
 *
 *   tiposCodigo.ts     los datos y las funciones puras (nada de React)
 *   coloreado.ts       de texto a colores, con el léxico del intérprete
 *   useCodigo.ts       el estado: la máquina, la consola, el guion
 *   EditorCodigo.tsx   las dos capas y el teclado, sin un solo `useState`
 *   VentanaCodigo.tsx  el editor entero, sin un solo `useState`
 *
 * El intérprete vive un directorio más arriba (`../`) y no sabe nada de esto:
 * se puede usar sin React, y esto no se puede usar sin él.
 *
 * Cómo se monta una clase:
 *
 *   const cod = useCodigo({ plantilla: PLANTILLA, guion: GUION, entradas: ['Sofi'] });
 *   <VentanaBase marca="Tecnia Código" subtitulo="retos.py">
 *     <VentanaCodigo
 *       codigo={cod}
 *       archivo="retos.py"
 *       panelFijo={{ titulo: 'La pila', Cuerpo: MiPanel }}   // ← aquí divergen las clases
 *       herramientas={[{ id: 'probar', etiqueta: 'Probar mis retos', onClick: probar }]}
 *     />
 *   </VentanaBase>
 */

export { colorear, type Color, type LineaPintada, type Tramo } from './coloreado';
export { EditorCodigo, type EditorCodigoProps } from './EditorCodigo';
export {
  ALTO_LINEA,
  EJECUCION_VACIA,
  METRICA_EDITOR,
  METRICA_NUMEROS,
  RELLENO_H,
  RELLENO_V,
  SANGRIA,
  VELOCIDADES,
  cambioPermitido,
  conEnter,
  conTab,
  ecoDeLinea,
  lineasBajoLlave,
  velocidadDe,
  type Edicion,
  type Ejecucion,
  type FaseCodigo,
  type GuionCodigo,
  type HerramientaCodigo,
  type LogroCodigo,
  type PanelCodigoProps,
  type PasoCodigo,
  type ResumenCodigo,
  type SenalCodigo,
  type Velocidad,
  type VelocidadId,
} from './tiposCodigo';
export { useCodigo, type Aviso, type Codigo, type Encargo, type OpcionesCodigo } from './useCodigo';
export { VentanaCodigo, type AccionCodigo, type VentanaCodigoProps } from './VentanaCodigo';
