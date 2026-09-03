/**
 * Tecnia Código · la puerta del intérprete.
 *
 * Lo único que una actividad —o el armazón `VentanaCodigo` cuando se escriba—
 * necesita importar. Por dentro son siete archivos; por fuera son estas
 * funciones, y **ninguna lanza**: los errores salen como dato, con su línea y
 * su pista, porque escribir mal es la mitad de la clase.
 *
 * Lo que el armazón hará con esto, para que se vea que da:
 *
 * ```ts
 * const arranque = crearMaquina(texto, { entradas: ['Sofi', '14'] });
 * if (!arranque.ok) marcaLaLinea(arranque.error.linea, textoDeError(arranque.error, texto));
 * else {
 *   correr(arranque.maq, 20_000);          // ▶ a ratos, sin congelar la pestaña
 *   pasoDeLinea(arranque.maq);             // ⏭ el botón de paso a paso
 *   panelDeVariables(variables(arranque.maq));
 *   if (arranque.maq.estado === 'esperando') pregunta(arranque.maq.pregunta);
 * }
 * ```
 *
 * Y lo que **no** hay que buscar aquí porque no existe a propósito: ninguna
 * función que diga si el alumno acertó. La corrección la trae la clase (canon,
 * prueba 3: un armazón que corrige es un motor de plantillas). Lo que este
 * paquete da es `salida`, `variables` y `error`, que es con lo que una clase
 * escribe su propia corrección.
 */

export { type ClaseError, type ErrorPy, textoDeError } from './errores';
export {
  correr,
  crearMaquina,
  ejecutar,
  lineaActual,
  paso,
  pasoDeLinea,
  pilaDeLlamadas,
  responder,
  revisar,
  variables,
  type Arranque,
  type Estado,
  type Maquina,
  type Opciones,
  type Topes,
  type Vistazo,
} from './maquina';
/**
 * `leerFichas` sale por la puerta para el **coloreado del editor**, que es el
 * gasto que el canon señaló como el equivalente aquí de las cadenas de texto del
 * §46: pintar el editor en cada tecla. Con esto, colorear es una función pura
 * del texto —cada ficha trae su tipo, su línea y su columna— y no hace falta
 * ningún analizador aparte que se desincronice del de verdad.
 */
export { leerFichas, leerFichasTolerante, type Ficha, type TipoFicha } from './lexico';
export { analizar, type Expr, type Sent } from './sintaxis';
export { METODOS_CADENA, METODOS_DICC, METODOS_LISTA, NATIVAS, PALABRAS_CLAVE, TOPES } from './subconjunto';
export { aTexto, nombreDeTipo, repr, type Valor } from './valores';
