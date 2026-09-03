/**
 * Tecnia Datos — el armazón del que cuelgan las 4 actividades de bases de
 * datos y SQL (canon, filas 70, 87, 88 y 89).
 *
 *   tiposDatos.ts      los datos y las funciones puras del guion y del panel
 *   coloreadoSQL.ts     de texto a colores, con el léxico del motor de SQL
 *   useDatos.ts        el estado: la sesión, el esquema, el guion
 *   VentanaDatos.tsx   el editor de consultas entero, sin un solo `useState`
 *
 * El motor de SQL vive un directorio más arriba (`../`) y no sabe nada de
 * esto: se puede usar sin React, y esto no se puede usar sin él.
 *
 * El editor de texto —números de línea, Tab, Esc+Tab, la métrica de las dos
 * capas— **no se reescribe aquí**: es `EditorCodigo`, importado tal cual de
 * `codigo/ventana/`. Lo único propio de SQL es de qué color se pinta cada
 * ficha (`coloreadoSQL.ts`) y todo lo que hay en este directorio.
 *
 * Cómo se monta una clase:
 *
 *   const dat = useDatos({ plantilla: 'SELECT * FROM alumnos;', baseInicial: BASE, guion: GUION });
 *   <VentanaBase marca="Tecnia Datos" subtitulo="alumnos.sql">
 *     <VentanaDatos
 *       datos={dat}
 *       archivo="alumnos.sql"
 *       panelFijo={{ titulo: 'Tu diagrama', Cuerpo: MiPanel }}   // ← aquí divergen las clases
 *     />
 *   </VentanaBase>
 */

export { colorearSQL } from './coloreadoSQL';
export {
  MAX_FILAS_TABLA,
  type EjecucionSQL,
  type GuionDatos,
  type HerramientaDatos,
  type LogroDatos,
  type PanelDatosProps,
  type PasoDatos,
  type ResultadoSQL,
  type ResumenDatos,
  type SenalDatos,
} from './tiposDatos';
export { useDatos, type AvisoDatos, type Datos, type EncargoDatos, type OpcionesDatos } from './useDatos';
export { VentanaDatos, type AccionDatos, type VentanaDatosProps } from './VentanaDatos';

/**
 * Tres piezas del editor que se reutilizan de `codigo/ventana/` y no se
 * reescriben (encargo, cabecera): las funciones puras del teclado
 * (`cambioPermitido`, `lineasBajoLlave` las usa `useDatos`; `ecoDeLinea` la
 * usa `VentanaDatos` para el error) no saben nada de Python — operan sobre
 * números de línea y cadenas genéricas— y el propio `EditorCodigo`. Se
 * re-exportan aquí para que quien monte una clase de SQL no tenga que saber
 * que viven en otro directorio.
 */
export { EditorCodigo, type EditorCodigoProps } from '../../codigo/ventana/EditorCodigo';
export { cambioPermitido, ecoDeLinea, lineasBajoLlave } from '../../codigo/ventana/tiposCodigo';
