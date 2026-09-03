/**
 * El guion de una clase de Tecnia Hojas (§45.7).
 *
 * **No define ni un tipo nuevo de encargo**, igual que no lo hizo el de
 * PowerPoint. `Senal`, `Logro`, `PasoClase` y `PortadaClase` son los del §36,
 * abiertos el 10-ago-2026 en dos parámetros —el documento y la pestaña— justo
 * para esto. Aquí sólo se fijan:
 *
 *     Logro<Libro, PestanaExcel>
 *
 * Que sea la tercera sala que se cuelga del mismo motor de guion sin tocarlo es
 * la prueba de que aquellos dos genéricos estaban bien puestos.
 *
 * ── Por qué el documento es el LIBRO y no el motor ─────────────────────────
 *
 * Es la decisión de este archivo y no es obvia. El predicado de un encargo
 * recibe el **libro**, que es el dato puro e inmutable, y no el `Motor`, que es
 * la caché de valores encima de él. Así:
 *
 * - Un encargo se corrige contra **lo que el alumno escribió**, que es lo que
 *   se puede guardar, comparar con un `toEqual` y volver a comprobar mañana. La
 *   caché es un estado vivo del que no se puede decir «éste es el trabajo».
 * - `comprueba(libro)` es **pura**: mismo libro, misma respuesta, siempre. Con
 *   el motor delante, el mismo libro podría dar dos respuestas según lo que
 *   hubiera recalculado, y un corrector que contesta distinto dos veces es un
 *   corrector que no se puede probar.
 * - Y la mitad de los bloques del temario se preguntan **sin valores**: ¿guarda
 *   una regla o guarda un número (bloque 13)? ¿puso el `$` (bloque 21)? ¿sumó
 *   el rango que había que sumar? Todo eso está en `consultas.ts` leyendo el
 *   libro.
 *
 * Lo que sí necesita valores —«¿el total da 1250.75?»— se pregunta con las
 * funciones de `consultas.ts` que reciben `Motor`, y el guion se lo pasa por
 * `contexto`. **No hace falta un sexto tipo de logro**: llegar al valor desde el
 * libro es construir un motor (una línea, `crearMotor(libro)`); llegar al libro
 * desde un valor no se puede.
 */

import type { PestanaExcel } from '@/components/activities/office/tecniaHojas';
import type { Contexto } from './formula/funciones';
import type { Logro, PasoClase, PortadaClase, Senal } from '../motor/guion';
import type { Libro } from './modelo';

/**
 * **La hora de una clase de Tecnia Hojas, escrita en un solo sitio.**
 *
 * `HOY()` y `AHORA()` reciben el reloj desde fuera (`formula/funciones.ts`) para
 * que una clase que los use se pueda jugar dos veces con el mismo resultado. Eso
 * resuelve el problema de las pruebas y **abre otro**, que es el que arregla esta
 * constante: el motor que enseña la celda lo construye la ventana, y el motor que
 * corrige el encargo lo construye el predicado del guion. Son dos motores, y hasta
 * el 16-ago-2026 cada uno se traía su hora de su casa —la ventana tenía la suya
 * escrita dentro y `n5-tus-primeras-formulas` tiene otra, de dos semanas más
 * tarde, que no coincide—. Mientras ninguna clase usó fechas eso no se notaba;
 * la primera que las usa (`n6-funciones-esenciales`, bloque 29) habría tenido al
 * alumno viendo `46248` en la celda y al corrector esperando `46262`, sin nada
 * en pantalla que explicara por qué el encargo no se cerraba.
 *
 * Así que el reloj es **del contrato**, no de la ventana ni del guion: los dos
 * lados lo importan de aquí y no se pueden separar.
 *
 * *No confundir con `AHORA_POR_DEFECTO` (`formula/calculo.ts`)*, que es otra cosa
 * y por eso vale otro día: aquél es la salida de emergencia de `crearMotor` para
 * quien no pasa contexto —el banco, una prueba de motor suelta—, y **una clase
 * nunca debe caer en él**: un guion que se olvide de pasar este reloj estará
 * corrigiendo contra un día distinto del que ve el alumno.
 */
export const RELOJ_DE_LA_CLASE: Contexto = { ahora: Date.UTC(2026, 7, 14, 9, 0, 0) };

export type SenalHojas = Senal<PestanaExcel>;
export type LogroHojas = Logro<Libro, PestanaExcel>;
export type PasoHojas = PasoClase<Libro, PestanaExcel>;

/**
 * Con qué libro abre la clase.
 *
 * Es una función y no un valor por la misma razón que en las otras dos salas:
 * «Empezar de cero» tiene que poder **volver a fabricarlo**. Si fuera una
 * constante, la segunda partida arrancaría con lo que el alumno dejó en la
 * primera — y aquí duele más que en Word, porque una hoja se toca celda a celda
 * y el destrozo de una partida anterior no se ve hasta que una fórmula da otro
 * número.
 */
export type LibroInicial = () => Libro;

export interface GuionHojas {
  /** Nombre del archivo en la barra de título: «Gastos del salón.xlsx». */
  archivo: string;
  /** El libro con el que arranca el laboratorio. */
  libro: LibroInicial;
  /** La sobrepantalla de objetivos (§36.3.1). Sin ella se entra directo. */
  portada?: PortadaClase;
  pasos: PasoHojas[];
  /** La frase de «Terminaste», en voz de lo que el alumno ya sabe hacer. */
  cierre?: string;
}

export type { PortadaClase };
