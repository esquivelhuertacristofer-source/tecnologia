/**
 * Tecnia Datos · `tiposDatos.ts` — los datos y las funciones puras del armazón.
 *
 * Ni una línea de React, igual que `codigo/ventana/tiposCodigo.ts`: es el
 * archivo que se puede probar sin montar nada. El motor (`../motor.ts`,
 * `../modelo.ts`, `../errores.ts`) ya está cerrado con 23 pruebas y no se
 * toca; esto es sólo el pegamento del guion de clase y del panel, que es lo
 * que un `SELECT` no trae de fábrica.
 *
 * ── Por qué NO hay aquí un editor propio, ni sangría, ni Tab, ni Enter ─────
 *
 * `VentanaDatos` monta `EditorCodigo` (`codigo/ventana/EditorCodigo.tsx`) tal
 * cual: dos capas, números de línea, Tab a la parada de cuatro, Esc+Tab para
 * salir. Ese editor no sabe nada de Python — lo dice su propio comentario de
 * cabecera— y las tres funciones puras que el teclado necesita
 * (`cambioPermitido`, `lineasBajoLlave`, `ecoDeLinea`) tampoco: operan sobre
 * números de línea y cadenas de texto genéricas, no sobre nada de la
 * máquina de Python. Reescribirlas aquí sería exactamente la trampa contra la
 * que avisa el encargo — «si acabas escribiendo tu propio editor, has
 * fallado»— así que se importan de `codigo/ventana/tiposCodigo.ts` y se
 * re-exportan desde `./index.ts` para que quien monte una clase de SQL no
 * tenga que saber que viven allí.
 *
 * Lo único propio de SQL es el coloreado (`coloreadoSQL.ts`, con su propio
 * léxico) y lo que sigue en este archivo: el guion, el panel del esquema y el
 * tope de filas.
 *
 * ── Un guion de varias instrucciones enseña TODOS sus resultados ──────────
 *
 * El motor (`correr`) admite un guion de SQL con `;` entre instrucciones y
 * devuelve un `Resultado` por cada una — es lo que necesita
 * `n10-modela-tus-datos`, que escribe una base entera de un tirón. La
 * decisión de este armazón es **enseñarlos todos, en orden, uno por
 * tarjeta**, no sólo el último: un guion con `CREATE TABLE` + dos `INSERT` +
 * un `SELECT` final tiene cuatro cosas que decir —«tabla creada», «3 filas
 * insertadas», «2 filas insertadas», y la rejilla del `SELECT`— y esconder
 * las tres primeras deja al alumno sin saber si el `INSERT` de en medio
 * falló en silencio. Enseñar sólo el último resultado convertiría un error a
 * mitad de guion en invisible: el motor no revierte lo ya aplicado
 * (`motor.ts`, cabecera), así que las instrucciones de antes del error
 * **quedaron hechas** y el alumno tiene que poder verlas.
 *
 * ── El tope de filas se enseña, no se esconde ──────────────────────────────
 *
 * `MAX_FILAS_TABLA` es el máximo de filas que una tarjeta de resultado pinta
 * en el DOM. Cuando el resultado trae más, la ventana muestra «se muestran
 * las primeras 100 de 10 000» en vez de recortar en silencio — un tope mudo
 * le haría creer al alumno que ésa es la tabla entera.
 */

import type { Ejecucion, Resultado } from '../motor';

export type { Ejecucion as EjecucionSQL, Resultado as ResultadoSQL };

export const MAX_FILAS_TABLA = 100;

/* ── el guion de la clase ────────────────────────────────────────────────*/

/**
 * Dónde mira el alumno en este encargo: una línea del editor, o uno de los
 * controles del armazón (incluido el panel del esquema, que en
 * `n10-modela-tus-datos` es la mitad de la clase).
 */
export interface SenalDatos {
  linea?: number;
  control?: 'ejecutar' | 'deshacer' | 'rehacer' | 'editor' | 'esquema';
}

/**
 * Cómo se da por hecho un encargo. **La corrección la escribe la clase**: el
 * armazón sólo llama al predicado (canon, prueba 3).
 *
 * Dos predicados, dos preguntas distintas: `programa` mira **lo que el
 * alumno escribió** (¿tu `CREATE TABLE` lleva `PRIMARY KEY`? ¿usaste `JOIN`?)
 * y es pura sobre el texto; `ejecucion` mira **lo que devolvió el motor**
 * (¿la consulta trajo 3 filas? ¿la tabla `alumnos` quedó con la columna
 * `grupo_id`?) y necesita el resultado de `correr`.
 */
export type LogroDatos =
  | { tipo: 'programa'; comprueba: (sql: string) => boolean }
  | { tipo: 'ejecucion'; comprueba: (e: Ejecucion, sql: string) => boolean }
  | { tipo: 'eleccion'; opciones: string[]; correcta: number }
  | { tipo: 'confirma'; boton: string };

export interface PasoDatos {
  id: string;
  /** Cabecera corta del encargo. */
  titulo: string;
  /** Qué hay que hacer, en una o dos frases y en segunda persona. */
  instruccion: string;
  /** Aparece sola tras el primer intento fallido. */
  pista: string;
  senal?: SenalDatos;
  logro: LogroDatos;
  /** La frase que se lleva el alumno al acertar. Es la clase, en una línea. */
  aprendido: string;
}

export interface GuionDatos {
  pasos: PasoDatos[];
  /** La frase de «Terminaste», en voz de lo que el alumno ya sabe hacer. */
  cierre?: string;
}

/** Lo que la clase le pasa a su propio panel (`panelFijo`), acoplado junto al del esquema. */
export interface PanelDatosProps {
  /** La última ejecución del guion completo, o `null` si aún no se ha pulsado ▶. */
  ejecucion: Ejecucion | null;
  texto: string;
  /** Lleva el cursor del alumno a una línea del editor y la enfoca. */
  senalarLinea: (linea: number) => void;
}

/** Una herramienta que aporta la clase y el armazón no trae. */
export interface HerramientaDatos {
  id: string;
  etiqueta: string;
  glifo?: string;
  onClick: () => void;
  deshabilitada?: boolean;
  /** La que arrastra la vista: se pinta llena, no de contorno. */
  principal?: boolean;
  /** Se queda hundida. Para las que son interruptor. */
  activa?: boolean;
}

export interface ResumenDatos {
  encargos: number;
  hechos: number;
  tropiezos: number;
  segundos: number;
}
