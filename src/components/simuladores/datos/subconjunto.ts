/**
 * Tecnia Datos · `subconjunto.ts` — qué SQL se habla aquí, y qué no.
 *
 * Primera de las siete piezas del motor, y se escribe antes que el analizador
 * por la misma razón que en `codigo/subconjunto.ts`: un subconjunto que se
 * decide sobre la marcha acaba siendo «todo lo que fui necesitando», y eso no
 * es un subconjunto, es una deuda.
 *
 * ── A QUIÉN SIRVE ESTE MOTOR ────────────────────────────────────────────────
 *
 * A cuatro actividades del canon, y a ninguna más. Están copiadas aquí con su
 * fila, porque **las capacidades salen de las filas, no de mi idea de qué es
 * SQL**:
 *
 * | 70 | `n9-bases-de-datos-iniciales` | CÓDIGO | Tablas, registros y la primera consulta; modo SQL. |
 * | 87 | `n10-modela-tus-datos`        | CÓDIGO | Tablas, campos y relaciones; el esquema en el panel fijo. |
 * | 88 | `n10-consultas-sql`           | CÓDIGO | `SELECT`, filtros y una unión; salida en rejilla. |
 * | 89 | `n10-conecta-tus-datos`       | OFFICE | La consulta aterriza en la hoja: `VentanaHojas` con datos de fuera. |
 *
 * Lo que cada fila obliga, dicho una a una para que se pueda auditar:
 *
 * - **70** pide que la base ya exista y que se pueda mirar: `SELECT` con `FROM`
 *   y `WHERE`, y un esquema legible para el árbol de tablas del `panelFijo`.
 * - **87** es *diseñar*, no consultar: `CREATE TABLE` con tipos, `PRIMARY KEY`
 *   y `REFERENCES`, `INSERT` para poblarla, y `esquemaDe()` para el panel. Es
 *   la única de las cuatro que necesita que las restricciones **se cumplan de
 *   verdad**: si la clave foránea no impide nada, la clase de las relaciones no
 *   tiene nada que enseñar.
 * - **88** pide filtros, orden y **una** unión. De ahí salen `WHERE`, `ORDER BY`,
 *   `LIMIT`, `LIKE` y `JOIN ... ON` entre dos tablas.
 * - **89** pide que el resultado salga de aquí y entre en una hoja de cálculo.
 *   De ahí salen dos cosas: que cada columna del resultado lleve **nombre** —y
 *   por eso existe `AS`— y `aMatriz()`, que devuelve los valores crudos, no
 *   texto, para que un número siga siendo un número dentro de la hoja.
 *
 * Los resúmenes —`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`, `GROUP BY`, `HAVING`— los
 * pide el encargo y los sostiene la 89: lo que aterriza en una hoja de cálculo
 * es un resumen, no diez mil filas en crudo. Si al escribir las clases resulta
 * que ninguna agrupa, sobran y hay que quitarlos: están medidos y aislados en
 * `motor.ts`, no repartidos por el resto.
 *
 * ── LA REGLA QUE DECIDE LAS DUDAS ───────────────────────────────────────────
 *
 * **Sólo entra lo que no se puede escribir con lo que ya hay.**
 *
 * `IS NULL` entra porque `= NULL` no lo sustituye (nunca es cierto, y ésa es
 * justamente la clase). `LIKE` entra porque «los que empiezan por A» no se
 * escribe con `=` ni con `<`. `IN` y `BETWEEN` **no** entran, porque son la
 * forma corta de un `OR` y de un `AND` que el alumno tiene que saber escribir
 * antes de que se los abrevien. Con esta regla, cada palabra del subconjunto se
 * defiende sola y nadie tiene que discutir gustos.
 *
 * ── LO QUE SÍ ───────────────────────────────────────────────────────────────
 *
 * **Definición.** `CREATE TABLE` con `INTEGER`, `REAL`, `TEXT`, `DATE` y
 * `BOOLEAN`; `PRIMARY KEY`, `NOT NULL` y `REFERENCES tabla(columna)` en la
 * columna, y también la forma larga `FOREIGN KEY (x) REFERENCES t(y)` al final,
 * porque la mitad de los libros la escriben así.
 *
 * **Datos.** `INSERT INTO ... VALUES (...), (...)` con lista de columnas o sin
 * ella, `UPDATE ... SET ... WHERE`, `DELETE FROM ... WHERE`.
 *
 * **Consulta.** `SELECT` de columnas concretas o `*`, con `AS`; `FROM` con
 * alias; un `JOIN ... ON`; `WHERE`; `GROUP BY`; `HAVING`; `ORDER BY` con varias
 * claves y `ASC`/`DESC`; `LIMIT`.
 *
 * **Expresiones.** `+ - * /`, `= <> != < > <= >=`, `AND`, `OR`, `NOT`,
 * `IS NULL`, `IS NOT NULL`, `LIKE` con `%` y `_`, paréntesis, `NULL`, `TRUE`,
 * `FALSE`, y `COUNT` / `SUM` / `AVG` / `MIN` / `MAX`.
 *
 * **Guiones.** Varias instrucciones separadas por `;`, y comentarios con `--`.
 * `n10-modela-tus-datos` escribe una base entera de una vez; sin guiones esa
 * clase sería veinte botones de ejecutar.
 *
 * ── LO QUE NO, Y POR QUÉ ────────────────────────────────────────────────────
 *
 * Cada palabra de fuera tiene su frase en `PALABRAS_PROHIBIDAS` y el alumno la
 * lee **al escribirla**, en vez de un «syntax error» pelado. Los motivos:
 *
 * - **Subconsultas** (`SELECT` dentro de `SELECT`) — es el salto de dificultad
 *   más grande de todo SQL y ninguna de las cuatro filas lo pide. Además rompe
 *   la promesa de este motor: aquí una consulta se lee de izquierda a derecha y
 *   se explica entera; una subconsulta correlacionada, no.
 * - **`UNION`** — juntar dos resultados que ni siquiera se ven a la vez. Antes
 *   de eso hay que saber mirar uno.
 * - **Vistas, índices y disparadores** — administración de bases de datos. Un
 *   índice, además, aquí no se notaría: la 88 trabaja con tablas de treinta
 *   filas, y decir «esto va más rápido» sin que se note es enseñar magia.
 * - **Transacciones** (`BEGIN`, `COMMIT`, `ROLLBACK`) — el `DELETE` sin `WHERE`
 *   tiene que doler para que la lección exista (decisión 4). Con `ROLLBACK` no
 *   duele nada. Volver atrás es el botón de deshacer, que está **fuera** de la
 *   consulta, como en la vida.
 * - **`ALTER TABLE` y `DROP TABLE`** — cambiar el diseño de una tabla con datos
 *   dentro es un tema de por sí. En `n10-modela-tus-datos` el alumno corrige su
 *   `CREATE TABLE`, deshace y vuelve a ejecutar, que es lo que se hace de
 *   verdad cuando el modelo todavía está en el papel.
 * - **Funciones de ventana** (`OVER`, `PARTITION BY`) — es SQL de analista.
 * - **`DISTINCT`** — `GROUP BY` ya da los valores distintos, y aprender dos
 *   maneras de quitar repetidos el mismo día no deja ninguna de las dos.
 * - **`IN` y `BETWEEN`** — la regla de arriba: son `OR` y `AND` abreviados.
 * - **`LEFT JOIN` y compañía** — la 88 pide «una unión». Que el `JOIN` pierda
 *   las filas que no casan **es** la clase; `LEFT JOIN` es la respuesta a una
 *   pregunta que esa clase todavía no ha hecho. Es el primer candidato a entrar
 *   el día que una fila del canon lo pida, y entra en veinte líneas.
 * - **La coma entre tablas** (`FROM a, b`) — es un producto cartesiano con
 *   cara de unión; el error que da aquí explica eso mismo.
 * - **`CASE`, `COALESCE`, `IFNULL`** — tapar un `NULL` antes de haber entendido
 *   qué es un `NULL` es el mismo error que aprender `try/except` antes de saber
 *   leer un error (`codigo/subconjunto.ts`).
 * - **`AUTOINCREMENT`** — elegir un identificador que no se repita es
 *   exactamente lo que enseña la clave primaria en la 87.
 * - **`UNIQUE`, `DEFAULT`, `CHECK`** — tres restricciones más que ninguna fila
 *   pide, cada una con su error propio que habría que escribir y probar.
 * - **`OFFSET`** — paginar no es de estas clases.
 * - **Comillas dobles para nombres** — en SQL `"Ana"` es un nombre de columna,
 *   no un texto, y ese error se lleva media hora de clase. Aquí se detecta y se
 *   explica en vez de dar «no existe la columna Ana».
 *
 * ── LAS CINCO DESVIACIONES QUE HAY QUE DECIR EN ALTO ────────────────────────
 *
 * Copiar al motor de verdad no es capricho —el alumno se va a sentar delante de
 * uno—, pero hay cinco sitios donde ser fiel enseñaría algo peor. Están aquí,
 * no escondidas en el código:
 *
 * 1. **Sin `ORDER BY`, aquí el orden está garantizado** (el de inserción). Un
 *    motor de verdad no promete nada. Se garantiza porque una clase compara
 *    resultados y dos ejecuciones tienen que dar lo mismo; y como es una
 *    promesa *de más*, nada que funcione aquí falla allá. La clase sigue
 *    teniendo que enseñar `ORDER BY`: se enseña con `ORDER BY`, no con la
 *    suerte.
 * 2. **`5 / 2` da 2.5.** En SQLite y en Postgres da 2 —división entera— y en
 *    MySQL da 2.5. Como los motores de verdad no se ponen de acuerdo, no hay
 *    fidelidad que copiar, y 2.5 es lo que espera quien está aprendiendo.
 * 3. **Dividir entre cero es un error**, no `NULL`. SQLite calla y devuelve
 *    `NULL`, que luego desaparece dentro de un `AVG` y da un promedio que nadie
 *    sabe de dónde salió. Es la misma decisión que tomó el motor de hojas con
 *    «vacío no es cero».
 * 4. **Para renombrar una columna hay que escribir `AS`.** En SQL de verdad
 *    `SELECT nombre apellido FROM t` es válido y significa «llama apellido a la
 *    columna nombre», que es como se esconde una coma olvidada. Aquí eso es un
 *    error que dice «¿falta una coma?».
 * 5. **Seleccionar una columna que no está en el `GROUP BY` es un error.**
 *    SQLite lo permite y devuelve un valor de una fila cualquiera del grupo:
 *    un motor que acierta a ratos es peor que uno que no sabe.
 *
 * Y una que no es desviación sino decisión de casa: **las palabras de SQL van
 * en inglés y los errores en español**. La sala existe para que el alumno se
 * siente después delante de un motor de verdad; un `CREAR TABLA` no le sirve
 * para nada. El mensaje de error sí es nuestro, porque el del motor de verdad
 * es incomprensible — y aun así se le enseña al lado, en `familia`.
 */

/** Palabras que el analizador no puede confundir con un nombre de tabla. */
export const PALABRAS_CLAVE: ReadonlySet<string> = new Set([
  'CREATE',
  'TABLE',
  'PRIMARY',
  'KEY',
  'FOREIGN',
  'REFERENCES',
  'NOT',
  'NULL',
  'INSERT',
  'INTO',
  'VALUES',
  'UPDATE',
  'SET',
  'DELETE',
  'SELECT',
  'FROM',
  'JOIN',
  'INNER',
  'ON',
  'WHERE',
  'GROUP',
  'BY',
  'HAVING',
  'ORDER',
  'ASC',
  'DESC',
  'LIMIT',
  'AS',
  'AND',
  'OR',
  'IS',
  'LIKE',
  'TRUE',
  'FALSE',
]);

/** Los cinco tipos, con los nombres que se escriben en el `CREATE TABLE`. */
export const TIPOS: Readonly<Record<string, 'entero' | 'real' | 'texto' | 'fecha' | 'booleano'>> = {
  INTEGER: 'entero',
  INT: 'entero',
  REAL: 'real',
  TEXT: 'texto',
  DATE: 'fecha',
  BOOLEAN: 'booleano',
  BOOL: 'booleano',
};

/**
 * Las cinco funciones de resumen. Lista cerrada: un nombre seguido de paréntesis
 * que no esté aquí es «esa función no existe», con las que sí existen al lado.
 */
export const RESUMENES: readonly string[] = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];

/**
 * Las que existen en SQL y aquí no. La frase se le enseña al alumno tal cual.
 *
 * Sin esta tabla, `SELECT DISTINCT ciudad FROM x` diría «no existe la columna
 * DISTINCT», que es verdad y no sirve para nada.
 */
export const PALABRAS_PROHIBIDAS: Readonly<Record<string, string>> = {
  DISTINCT: 'para ver los valores sin repetir, agrúpalos: SELECT ciudad FROM alumnos GROUP BY ciudad',
  IN: '«IN» es la forma corta de varios OR; aquí se escribe entero: edad = 12 OR edad = 13',
  BETWEEN: '«BETWEEN» es la forma corta de dos condiciones; aquí se escribe entera: edad >= 12 AND edad <= 15',
  UNION: 'aquí no se pegan dos consultas: ejecuta una, mira su resultado, y luego la otra',
  LEFT: 'aquí sólo hay JOIN: junta las filas que casan por los dos lados, y las que no casan se pierden',
  RIGHT: 'aquí sólo hay JOIN: junta las filas que casan por los dos lados, y las que no casan se pierden',
  FULL: 'aquí sólo hay JOIN: junta las filas que casan por los dos lados, y las que no casan se pierden',
  OUTER: 'aquí sólo hay JOIN: junta las filas que casan por los dos lados, y las que no casan se pierden',
  CROSS: 'aquí no se cruzan dos tablas sin condición: un JOIN siempre lleva su ON',
  EXISTS: 'aquí no se meten consultas dentro de otras',
  CASE: 'aquí no hay condiciones dentro de la consulta: filtra con WHERE y saca dos consultas si hacen falta dos',
  COALESCE: 'aquí un NULL no se tapa: se pregunta por él con IS NULL y se decide qué hacer',
  IFNULL: 'aquí un NULL no se tapa: se pregunta por él con IS NULL y se decide qué hacer',
  VIEW: 'las vistas son de un curso de bases de datos; aquí se escribe la consulta cada vez',
  INDEX: 'los índices son de un curso de bases de datos, y con tablas de esta clase no se notarían',
  TRIGGER: 'los disparadores son de un curso de bases de datos',
  BEGIN: 'aquí no hay transacciones: cada instrucción se aplica al terminar, y para volver atrás está el botón de deshacer',
  COMMIT: 'aquí no hay transacciones: cada instrucción se aplica al terminar, y para volver atrás está el botón de deshacer',
  ROLLBACK: 'aquí no hay transacciones: para volver atrás está el botón de deshacer, no la consulta',
  ALTER: 'para cambiar el diseño de una tabla, deshaz y corrige tu CREATE TABLE',
  DROP: 'para quitar una tabla, deshaz: aquí no se borra una tabla escribiendo una instrucción',
  OVER: 'las funciones de ventana son SQL de analista; aquí se resume con GROUP BY',
  PARTITION: 'las funciones de ventana son SQL de analista; aquí se resume con GROUP BY',
  AUTOINCREMENT: 'aquí las claves las pones tú: elegir un número que no se repita es lo que enseña la clave primaria',
  UNIQUE: 'las únicas restricciones que hay aquí son PRIMARY KEY, NOT NULL y REFERENCES',
  DEFAULT: 'las únicas restricciones que hay aquí son PRIMARY KEY, NOT NULL y REFERENCES',
  CHECK: 'las únicas restricciones que hay aquí son PRIMARY KEY, NOT NULL y REFERENCES',
  OFFSET: 'aquí LIMIT sólo corta las primeras filas',
  VARCHAR: 'el texto aquí se llama TEXT, y no lleva tamaño entre paréntesis',
  CHAR: 'el texto aquí se llama TEXT, y no lleva tamaño entre paréntesis',
  STRING: 'el texto aquí se llama TEXT',
  FLOAT: 'los números con decimales aquí se llaman REAL',
  DOUBLE: 'los números con decimales aquí se llaman REAL',
  DECIMAL: 'los números con decimales aquí se llaman REAL',
  NUMERIC: 'los números con decimales aquí se llaman REAL',
  DATETIME: 'aquí las fechas se llaman DATE y se escriben AAAA-MM-DD',
  TIMESTAMP: 'aquí las fechas se llaman DATE y se escriben AAAA-MM-DD',
};

/**
 * Los cuatro topes que impiden que el navegador se cuelgue.
 *
 * Son cuatro porque hay cuatro maneras distintas de colgar una pestaña con SQL,
 * y el número de filas sólo tapa una.
 *
 * - `FILAS` — lo que cabe en una tabla. Diez mil es el tamaño del criterio 3.
 * - `PRODUCTO` — un `JOIN` de mil por mil son un millón de filas de salida y
 *   ninguna clase quiere verlas. Se corta y se avisa; no se cuelga.
 * - `SENTENCIAS` — un guion pegado de internet con diez mil instrucciones.
 * - `TEXTO` — el aviso del §46, que en este proyecto ya se cumplió dos veces:
 *   lo caro no es el algoritmo, son las cadenas de texto.
 */
export const TOPES = {
  FILAS: 100_000,
  PRODUCTO: 500_000,
  SENTENCIAS: 2_000,
  TEXTO: 1_000_000,
} as const;
