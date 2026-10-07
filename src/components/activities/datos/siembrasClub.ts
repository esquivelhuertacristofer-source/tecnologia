/**
 * `n10-consultas-sql` · las siembras del club de robótica.
 *
 * **Una sola fuente de verdad.** La base con la que arranca el editor del
 * alumno y la del caso visible del juez salen del MISMO texto SQL
 * (`SIEMBRA_CLUB`): la clase la ejecuta una vez para tener su `Base`, y el juez
 * la ejecuta otra vez para montar el caso. Si fueran dos listas de filas
 * escritas a mano, el día que alguien tocara una el alumno vería un resultado
 * en su pantalla y otro distinto en el veredicto, que es la peor avería que
 * puede tener un juez: la que le hace creer que miente.
 *
 * Los acentos van con su ortografía de verdad: el motor ordena con
 * `localeCompare` en español (`modelo.ts:217`), así que «Andrés» cae entre
 * «Ana» y «Bruno» y no al final del alfabeto, que es lo que haría una
 * comparación byte a byte.
 *
 * ── El orden de las doce filas es parte de la clase. NO LAS ALFABETICES ─────
 *
 * Estaban sembradas en orden alfabético, y eso regalaba el primer encargo:
 * `SELECT nombre, grado FROM integrantes;` —sin `ORDER BY` ninguno— ya las
 * devolvía ordenadas. Comprobado jugándolo en el navegador el 2-sep-2026: el
 * contador saltaba al encargo 2 sin que el alumno hubiera ordenado nada.
 * Tampoco los `id` van en orden alfabético, para que `ORDER BY id` no sea el
 * mismo atajo por otra puerta.
 *
 * ── Las siembras ocultas ────────────────────────────────────────────────────
 *
 * Un caso oculto de SQL **no es la misma tabla con otros números: es otra
 * tabla**. Eso es lo que vuelve imposible aprobar copiando el resultado del
 * ejemplo, y lo que obliga a que la consulta diga de verdad lo que tiene que
 * decir. Las tres siembras cumplen, cada una, las mismas condiciones que la
 * visible —y hay una prueba que lo exige, porque si una deja de cumplirlas su
 * problema se regala sin que nadie se entere—:
 *
 *  · los nombres NO vienen en orden ascendente (si no, el `ORDER BY` sobra);
 *  · los de grado 3 NO vienen en orden descendente entre ellos;
 *  · las primeras filas NO son ya el podio (si no, el `LIMIT` sobra);
 *  · hay al menos un nombre que empieza por A y al menos uno que no;
 *  · hay exactamente un equipo llamado «Los Circuitos», con gente distinta;
 *  · hay al menos un integrante con `equipo_id` en `NULL`.
 */

import { BASE_VACIA, ejecutar, type Base } from '@/components/simuladores/datos';

/** El esquema, igual en las tres siembras. Es de la parada 1 del alumno. */
const ESQUEMA = [
  'CREATE TABLE equipos (',
  '  id INTEGER PRIMARY KEY,',
  '  nombre TEXT NOT NULL,',
  '  categoria TEXT NOT NULL',
  ');',
  'CREATE TABLE integrantes (',
  '  id INTEGER PRIMARY KEY,',
  '  nombre TEXT NOT NULL,',
  '  grado INTEGER NOT NULL,',
  '  equipo_id INTEGER REFERENCES equipos(id)',
  ');',
].join('\n');

/**
 * Ciento cincuenta sesiones de entrenamiento. Existen sólo para que el tope de
 * 100 filas del pie de la rejilla se vea en pantalla de verdad y no se quede en
 * un número del enunciado.
 */
const SESIONES = [
  'CREATE TABLE sesiones (',
  '  id INTEGER PRIMARY KEY,',
  '  fecha DATE NOT NULL',
  ');',
  /* Fechas de verdad, contadas en UTC desde el 12 de enero: el motor valida
   * el calendario y el reparto «mes = i/30, dia = i%30» pedía un 29 de febrero
   * de 2026, que no existe. Lo cazó él, no una revisión. */
  ...Array.from({ length: 150 }, (_, i) => {
    const d = new Date(Date.UTC(2026, 0, 12 + i));
    return `INSERT INTO sesiones (id, fecha) VALUES (${i + 1}, '${d.toISOString().slice(0, 10)}');`;
  }),
].join('\n');

/** La que ve el alumno en su editor y la del caso visible de cada problema. */
export const SIEMBRA_CLUB = [
  ESQUEMA,
  "INSERT INTO equipos (id, nombre, categoria) VALUES (1, 'Los Circuitos', 'Robótica');",
  "INSERT INTO equipos (id, nombre, categoria) VALUES (2, 'Pixel Studio', 'Programación');",
  "INSERT INTO equipos (id, nombre, categoria) VALUES (3, 'Trazo Libre', 'Diseño');",
  "INSERT INTO equipos (id, nombre, categoria) VALUES (4, 'Voltio', 'Electrónica');",
  "INSERT INTO integrantes (id, nombre, grado, equipo_id) VALUES (1, 'Ana Torres', 2, 1);",
  "INSERT INTO integrantes (id, nombre, grado, equipo_id) VALUES (2, 'Bruno Salas', 1, 1);",
  "INSERT INTO integrantes (id, nombre, grado, equipo_id) VALUES (3, 'Karla Vega', 1, 3);",
  "INSERT INTO integrantes (id, nombre, grado, equipo_id) VALUES (4, 'Diego Marín', 3, 4);",
  "INSERT INTO integrantes (id, nombre, grado, equipo_id) VALUES (5, 'Andrés Villareal', 3, 2);",
  "INSERT INTO integrantes (id, nombre, grado, equipo_id) VALUES (6, 'Isabel Rocha', 2, 1);",
  "INSERT INTO integrantes (id, nombre, grado, equipo_id) VALUES (7, 'Fernando Ibarra', 2, NULL);",
  "INSERT INTO integrantes (id, nombre, grado, equipo_id) VALUES (8, 'Camila Ruiz', 2, 3);",
  "INSERT INTO integrantes (id, nombre, grado, equipo_id) VALUES (9, 'Gabriela Nuño', 3, 3);",
  "INSERT INTO integrantes (id, nombre, grado, equipo_id) VALUES (10, 'Elena Cano', 1, 2);",
  "INSERT INTO integrantes (id, nombre, grado, equipo_id) VALUES (11, 'Héctor Paredes', 1, 4);",
  "INSERT INTO integrantes (id, nombre, grado, equipo_id) VALUES (12, 'Javier Soto', 3, 2);",
  SESIONES,
].join('\n');

/** Oculta 1 · el mismo club, otro curso: nadie repite nombre con la visible. */
export const SIEMBRA_OTRO_CURSO = [
  ESQUEMA,
  "INSERT INTO equipos (id, nombre, categoria) VALUES (1, 'Los Circuitos', 'Robótica');",
  "INSERT INTO equipos (id, nombre, categoria) VALUES (2, 'Tinta y Bit', 'Diseño');",
  "INSERT INTO equipos (id, nombre, categoria) VALUES (3, 'Motor Uno', 'Electrónica');",
  "INSERT INTO integrantes (id, nombre, grado, equipo_id) VALUES (1, 'Lucía Ponce', 1, 2);",
  "INSERT INTO integrantes (id, nombre, grado, equipo_id) VALUES (2, 'Aarón Medina', 3, 1);",
  "INSERT INTO integrantes (id, nombre, grado, equipo_id) VALUES (3, 'Tomás Guerra', 2, 3);",
  "INSERT INTO integrantes (id, nombre, grado, equipo_id) VALUES (4, 'Beatriz Lara', 3, 2);",
  "INSERT INTO integrantes (id, nombre, grado, equipo_id) VALUES (5, 'Alma Rendon', 1, NULL);",
  "INSERT INTO integrantes (id, nombre, grado, equipo_id) VALUES (6, 'Néstor Calvo', 3, 1);",
  "INSERT INTO integrantes (id, nombre, grado, equipo_id) VALUES (7, 'Carmen Ibarra', 2, NULL);",
  "INSERT INTO integrantes (id, nombre, grado, equipo_id) VALUES (8, 'Óscar Pineda', 2, 3);",
].join('\n');

/** Oculta 2 · un club chico, con un equipo vacío y dos empates de grado. */
export const SIEMBRA_CLUB_CHICO = [
  ESQUEMA,
  "INSERT INTO equipos (id, nombre, categoria) VALUES (1, 'Voltio', 'Electrónica');",
  "INSERT INTO equipos (id, nombre, categoria) VALUES (2, 'Los Circuitos', 'Robótica');",
  "INSERT INTO integrantes (id, nombre, grado, equipo_id) VALUES (1, 'Rubén Solís', 3, 1);",
  "INSERT INTO integrantes (id, nombre, grado, equipo_id) VALUES (2, 'Adela Mota', 3, 2);",
  "INSERT INTO integrantes (id, nombre, grado, equipo_id) VALUES (3, 'Pablo Ceja', 1, NULL);",
  "INSERT INTO integrantes (id, nombre, grado, equipo_id) VALUES (4, 'Iván Duarte', 3, 2);",
  "INSERT INTO integrantes (id, nombre, grado, equipo_id) VALUES (5, 'Sofía Bravo', 2, 1);",
].join('\n');

/** Monta una siembra. Lanza si el SQL de la clase está mal: es un fallo nuestro. */
export function baseDeSiembra(sql: string): Base {
  const r = ejecutar(BASE_VACIA, sql);
  if (!r.ok) throw new Error(`la siembra del club no se pudo montar: ${r.error.mensaje} (línea ${r.error.linea})`);
  return r.base;
}

/** La base con la que arranca el editor del alumno. */
export const BASE_CLUB: Base = baseDeSiembra(SIEMBRA_CLUB);
