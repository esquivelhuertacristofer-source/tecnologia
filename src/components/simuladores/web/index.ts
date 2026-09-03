/**
 * TECNIA WEB — el armazón del que cuelgan 11 actividades (CANON-ARMAZONES.md,
 * «3 · Tecnia Web»): el editor con vista previa en vivo. Es CodePen; es VS
 * Code con Live Server.
 *
 *   subconjunto.ts     qué HTML y qué CSS existen aquí, y por qué
 *   errores.ts         los problemas como datos, con línea y pista
 *   cursor.ts          el dedo sobre el texto que sabe en qué línea va
 *   lexicoHtml.ts      de texto a fichas, tolerando lo mal escrito
 *   arbolHtml.ts       de fichas a árbol, sin quedarse en blanco
 *   analizarCss.ts     valores → declaraciones → reglas
 *   cascada.ts         qué estilo le toca a cada elemento, y de dónde salió
 *   pagina.ts          el proyecto entero: enlaces, imágenes y las dos vistas
 *   consulta.ts        cómo le pregunta una clase a la página
 *   coloreadoWeb.ts    HTML, CSS y JS para el editor de Tecnia Código
 *   tiposWeb.ts        archivos, guion, publicación — y el guardián del js
 *   useEstudioWeb.ts   el estado
 *   VistaPagina.tsx    la vista previa, pintada nodo a nodo con React
 *   EstudioWeb.tsx     el estudio entero, sin un solo `useState`
 *
 * **El editor de código NO está aquí**: se hereda tal cual de
 * `simuladores/codigo/ventana/EditorCodigo.tsx`, que se escribió sin nada de
 * Python dentro precisamente para esto.
 *
 * Cómo se monta una clase:
 *
 *   const estudio = useEstudioWeb({
 *     archivos: [
 *       { nombre: 'index.html', lenguaje: 'html', texto: PLANTILLA },
 *       { nombre: 'estilo.css', lenguaje: 'css', texto: '' },
 *     ],
 *     guion: GUION,
 *     recursos: [{ nombre: 'gato.jpg', url: '/practicas/gato.jpg' }],
 *   });
 *   <VentanaBase marca="Tecnia Web" subtitulo="Mi primera página">
 *     <EstudioWeb estudio={estudio} proyecto="Mi primera página" inspector />
 *   </VentanaBase>
 *
 * Y así pregunta un encargo, que es lo que ningún `<iframe>` deja hacer:
 *
 *   logro: { tipo: 'pagina', comprueba: (p) => {
 *     const img = primero(p, 'img');
 *     return img !== null && (atributo(img, 'alt') ?? '').trim().length > 3;
 *   }}
 */

export { analizarCss, leerSelector, validarValor, type CondicionMedia, type Declaracion, type HojaEstilos, type Regla, type Selector } from './analizarCss';
export {
  analizarHtml,
  decodificarEntidades,
  elementosVisibles,
  recorrerElementos,
  textoDe,
  textoVisible,
  type ArbolHtml,
  type NodoComentario,
  type NodoDocumento,
  type NodoElemento,
  type NodoTexto,
  type NodoWeb,
} from './arbolHtml';
export { aplicaMedia, coincide, estiloReact, estiloVacio, resolverEstilos, type Cascada, type EstiloResuelto } from './cascada';
export { colorearWeb, type LenguajeWeb } from './coloreadoWeb';
export {
  atributo,
  buscar,
  caja,
  cuantos,
  enOrden,
  estructura,
  estilo,
  estiloAlPasarElRaton,
  estiloDe,
  existe,
  primero,
  propiedadesEscritas,
  texto,
  type CajaResuelta,
} from './consulta';
export { problema, textoDeProblema, type ClaseProblema, type ProblemaWeb, type Severidad } from './errores';
export { analizarPagina, type OpcionesPagina, type PaginaAnalizada, type RecursoWeb } from './pagina';
export {
  ANCHO_ESCRITORIO,
  ANCHO_MOVIL,
  ATRIBUTOS_GLOBALES,
  COLORES_CON_NOMBRE,
  ETIQUETAS,
  ETIQUETAS_PROHIBIDAS,
  PROPIEDADES,
  PROPIEDADES_PROHIBIDAS,
  atributoPermitido,
  esCrudo,
  esHeredada,
  esManejadorDeEvento,
  esVacia,
  type DefEtiqueta,
  type DefPropiedad,
  type FamiliaEtiqueta,
} from './subconjunto';
export {
  archivoDe,
  conTexto,
  lenguajeDe,
  type ArchivoWeb,
  type AvisoWeb,
  type EfectoWeb,
  type EncargoWeb,
  type EventoPagina,
  type GuionWeb,
  type HerramientaWeb,
  type LenguajeArchivo,
  type LogroWeb,
  type PasoPublicar,
  type PasoWeb,
  type Publicacion,
  type ResumenWeb,
  type SenalWeb,
  type Vista,
  type VistaDeLaPagina,
} from './tiposWeb';
export { useEstudioWeb, type Estudio, type OpcionesEstudio } from './useEstudioWeb';
export { VistaPagina, type VistaPaginaProps } from './VistaPagina';
export { EstudioWeb, type EstudioWebProps } from './EstudioWeb';
