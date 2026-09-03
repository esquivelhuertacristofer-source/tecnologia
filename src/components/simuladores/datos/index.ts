/**
 * Tecnia Datos · la puerta del motor de bases de datos.
 *
 * Lo único que una actividad —o la ventana de consultas, cuando se escriba—
 * necesita importar. Por dentro son seis archivos; por fuera son estas
 * funciones, y **ninguna lanza**: los errores salen como dato, con su línea, su
 * columna, su pista y lo que ese mismo error diría en un motor de verdad.
 *
 * Lo que una clase hace con esto:
 *
 * ```ts
 * const sesion = crearSesion(BASE_VACIA);
 * const r = correr(sesion, editor.value);
 * if (!r.ok) marcaLaLinea(r.error.linea, textoDeError(r.error, editor.value));
 * else {
 *   rejilla(r.resultados.at(-1));            // columnas y filas, en orden estable
 *   avisos(r.resultados.flatMap((x) => x.avisos));   // «un DELETE sin WHERE…»
 * }
 * arbolDeTablas(esquemaDe(sesion.base));     // el panelFijo del armazón
 * botonDeshacer.onclick = () => deshacer(sesion);
 * ```
 *
 * Y lo que **no** hay aquí a propósito: ninguna función que diga si el alumno
 * acertó. La corrección la trae la clase (canon, prueba 3: un armazón que
 * corrige es un motor de plantillas). Lo que este paquete da es el resultado,
 * el esquema y el error, que es con lo que una clase escribe su corrección.
 */

export { masParecido, textoDeError, type ClaseErrorSQL, type ErrorSQL } from './errores';
/**
 * `leerFichasTolerante` sale por la puerta para el **coloreado del editor de
 * consultas** (`VentanaDatos`), igual que `leerFichas` sale para ejecutar: es
 * el mismo léxico, y así el día que el subconjunto cambie sólo cambia un
 * sitio. Ver el comentario de cabecera de `lexico.ts`.
 */
export { analizar as leerFichas, leerFichasTolerante, type Ficha, type TipoFicha } from './lexico';
export {
  BASE_VACIA,
  comparar,
  esquemaDe,
  nombreDeTipo,
  ordenar,
  textoDeValor,
  type Base,
  type Columna,
  type ColumnaDeEsquema,
  type Tabla,
  type TablaDeEsquema,
  type TipoColumna,
  type Valor,
} from './modelo';
export {
  aMatriz,
  aTexto,
  correr,
  crearSesion,
  deshacer,
  ejecutar,
  rehacer,
  type ColumnaResultado,
  type Ejecucion,
  type Resultado,
  type Sesion,
} from './motor';
export { analizarGuion, type Expr, type Sent } from './sintaxis';
export { PALABRAS_CLAVE, PALABRAS_PROHIBIDAS, RESUMENES, TIPOS, TOPES } from './subconjunto';
