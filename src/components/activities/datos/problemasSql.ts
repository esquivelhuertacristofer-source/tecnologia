/**
 * `n10-consultas-sql` · los siete problemas del club.
 *
 * Viven en su propio archivo por lo mismo que los de `n10-problemas-de-concurso`:
 * **la prueba de Jest los importa y los juzga con consultas de referencia**, y
 * esas consultas no pueden estar en ningún archivo que el navegador descargue.
 * Aquí sólo hay enunciados, contratos de columnas y filas literales.
 *
 * ── Qué cambió respecto de la versión del 2-sep-2026 ────────────────────────
 *
 * La anterior tenía la respuesta en el enunciado, **literalmente**: el primer
 * encargo decía `instruccion: 'SELECT nombre, grado FROM integrantes ORDER BY
 * nombre;'` y su pista era esa misma cadena otra vez. El alumno copiaba. Era la
 * familia F2 de la auditoría del 12-sep-2026 —los 14 laboratorios que dictan la
 * solución— aplicada a SQL.
 *
 * Aquí el enunciado dice **qué tabla hay que devolver** y nunca cómo; el
 * contrato dice qué columnas y en qué orden; y de los 21 casos, **14 son
 * ocultos y corren sobre otra siembra distinta**.
 *
 * ── Las filas esperadas están MEDIDAS, no escritas a ojo ────────────────────
 *
 * Las 21 tablas de abajo salieron de correr las consultas de referencia contra
 * el motor real (12-sep-2026) y pegarlas. Escribirlas a mano habría sido
 * inventarse el orden del alfabeto español: el motor compara con
 * `localeCompare(…, 'es')`, así que «Andrés» va entre «Ana» y «Bruno» y no al
 * final. La prueba de Jest vuelve a correr las de referencia y exige que
 * cuadren, de modo que el día que alguien toque una siembra la prueba lo dice.
 *
 * ── Por qué `ordenImporta` está donde está ──────────────────────────────────
 *
 * `false` de fábrica, porque un `SELECT` sin `ORDER BY` no promete orden, ni
 * aquí ni en Postgres: comparar en orden sería suspender a quien tiene razón.
 * Se pone a `true` sólo en los tres problemas cuyo enunciado **pide** un orden
 * (1, 2 y 4), y entonces ese orden es la respuesta. En el 4 hace además el
 * trabajo fino: sin el desempate por nombre, «los tres de grado más alto»
 * tiene cuatro respuestas posibles en la siembra visible.
 */

import type { ProblemaSql } from '@/components/simuladores/juez';
import { SIEMBRA_CLUB, SIEMBRA_CLUB_CHICO, SIEMBRA_OTRO_CURSO } from './siembrasClub';

/** El caso que el alumno ve: la misma base que tiene abierta en el editor. */
const visible = (esperada: ProblemaSql['casos'][number]['esperada'], ordenImporta?: boolean) => ({
  nombre: 'el club de este año',
  prepara: SIEMBRA_CLUB,
  esperada,
  ordenImporta,
});

const ocultoCurso = (esperada: ProblemaSql['casos'][number]['esperada'], ordenImporta?: boolean) => ({
  nombre: 'el club del año pasado',
  prepara: SIEMBRA_OTRO_CURSO,
  esperada,
  ordenImporta,
  oculto: true,
});

const ocultoChico = (esperada: ProblemaSql['casos'][number]['esperada'], ordenImporta?: boolean) => ({
  nombre: 'un club recién abierto',
  prepara: SIEMBRA_CLUB_CHICO,
  esperada,
  ordenImporta,
  oculto: true,
});

export const S1: ProblemaSql = {
  id: 's1-la-lista',
  titulo: 'Problema 1 · La lista del club',
  enunciado:
    'El club necesita su lista de integrantes para pegarla en la puerta del taller: el nombre de cada uno y el grado ' +
    'que cursa, de la A a la Z por nombre.',
  columnas: 'nombre, grado — en ese orden, y las filas ordenadas por nombre',
  casos: [
    visible(
      [
        ['Ana Torres', 2],
        ['Andrés Villareal', 3],
        ['Bruno Salas', 1],
        ['Camila Ruiz', 2],
        ['Diego Marín', 3],
        ['Elena Cano', 1],
        ['Fernando Ibarra', 2],
        ['Gabriela Nuño', 3],
        ['Héctor Paredes', 1],
        ['Isabel Rocha', 2],
        ['Javier Soto', 3],
        ['Karla Vega', 1],
      ],
      true,
    ),
    ocultoCurso(
      [
        ['Aarón Medina', 3],
        ['Alma Rendon', 1],
        ['Beatriz Lara', 3],
        ['Carmen Ibarra', 2],
        ['Lucía Ponce', 1],
        ['Néstor Calvo', 3],
        ['Óscar Pineda', 2],
        ['Tomás Guerra', 2],
      ],
      true,
    ),
    ocultoChico(
      [
        ['Adela Mota', 3],
        ['Iván Duarte', 3],
        ['Pablo Ceja', 1],
        ['Rubén Solís', 3],
        ['Sofía Bravo', 2],
      ],
      true,
    ),
  ],
  pistas: [
    'Las filas de una tabla no tienen orden propio: salen como quieran salir. Si la lista tiene que ir de la A a la Z, eso hay que pedirlo.',
    'Fíjate en el contrato: son dos columnas y en un orden concreto. Pedir la tabla entera trae cuatro, y una de ellas es el identificador interno, que no le sirve a nadie en la puerta del taller.',
    'La cláusula que ordena va al final de la consulta y nombra la columna por la que se ordena. De la A a la Z es su comportamiento de fábrica: no hace falta decirlo.',
  ],
};

export const S2: ProblemaSql = {
  id: 's2-los-de-tercero',
  titulo: 'Problema 2 · Los de tercero, al revés',
  enunciado:
    'Los de tercer grado se gradúan este año y hay que leer sus nombres en la ceremonia, empezando por el último del ' +
    'alfabeto y terminando por el primero. Devuelve sólo sus nombres, en ese orden.',
  columnas: 'nombre — una sola columna, de la Z a la A',
  casos: [
    visible([['Javier Soto'], ['Gabriela Nuño'], ['Diego Marín'], ['Andrés Villareal']], true),
    ocultoCurso([['Néstor Calvo'], ['Beatriz Lara'], ['Aarón Medina']], true),
    ocultoChico([['Rubén Solís'], ['Iván Duarte'], ['Adela Mota']], true),
  ],
  pistas: [
    'Son dos cosas a la vez y ninguna sobra: quedarte sólo con unos, y ponerlos en un orden concreto.',
    'Ordenar al revés no se hace cambiando la columna: se le dice a la cláusula de orden que vaya al revés.',
    'La cláusula que filtra va antes que la que ordena, y compara la columna del grado con el número tres. La palabra que invierte el orden se escribe justo detrás del nombre de la columna.',
  ],
};

export const S3: ProblemaSql = {
  id: 's3-empiezan-por-a',
  titulo: 'Problema 3 · Los que empiezan por A',
  enunciado:
    'Para el sorteo de la rifa se saca primero a los integrantes cuyo nombre empieza con la letra A. Devuelve sus ' +
    'nombres. El orden da igual.',
  columnas: 'nombre — una sola columna, en cualquier orden',
  casos: [
    visible([['Ana Torres'], ['Andrés Villareal']]),
    ocultoCurso([['Aarón Medina'], ['Alma Rendon']]),
    ocultoChico([['Adela Mota']]),
  ],
  pistas: [
    'No estás buscando un nombre concreto: estás buscando todos los que se PARECEN a algo. Eso no se pregunta con un igual.',
    'Hay una forma de comparar textos que admite un comodín: «lo que sea, de cualquier largo». Con ella, «empieza por A» se escribe en un solo trozo de texto.',
    /* Decía «ojo con las mayúsculas: los nombres empiezan con A mayúscula», y
     * era FALSO: `patronDeLike` (`modelo.ts:297`) compila el patrón con la
     * bandera `i`, sin distinguir mayúsculas y a propósito, «como SQLite». Lo
     * cazó el señuelo de la prueba, que escribía `LIKE 'a%'` esperando que
     * fallara y fue aceptado — con razón. Lo que este motor sí distingue son
     * los acentos, y eso es lo que vale la pena decirle al alumno. */
    'El comodín de «lo que sea» es el signo de porcentaje, y se pega detrás de la letra dentro de las comillas. Mayúsculas y minúsculas dan igual, aquí y en la mayoría de los motores de verdad; los acentos no: «A» y «Á» son dos letras distintas.',
  ],
};

export const S4: ProblemaSql = {
  id: 's4-el-podio',
  titulo: 'Problema 4 · El podio',
  enunciado:
    'El club presume de sus tres integrantes de grado más alto en el cartel de la entrada: nombre y grado. Si varios ' +
    'empatan en grado, va primero el que vaya antes por nombre. Sólo tres filas, ni una más.',
  columnas: 'nombre, grado — en ese orden, y las filas del podio en su orden',
  casos: [
    visible(
      [
        ['Andrés Villareal', 3],
        ['Diego Marín', 3],
        ['Gabriela Nuño', 3],
      ],
      true,
    ),
    ocultoCurso(
      [
        ['Aarón Medina', 3],
        ['Beatriz Lara', 3],
        ['Néstor Calvo', 3],
      ],
      true,
    ),
    ocultoChico(
      [
        ['Adela Mota', 3],
        ['Iván Duarte', 3],
        ['Rubén Solís', 3],
      ],
      true,
    ),
  ],
  pistas: [
    'Son tres decisiones seguidas: por qué se ordena, qué pasa cuando dos empatan, y cuántas filas salen al final.',
    'El desempate no es un adorno del enunciado: sin él, «los tres de grado más alto» tiene más de una respuesta posible, y el juez no puede aceptar dos respuestas distintas.',
    'La cláusula de orden admite varias columnas separadas por coma: se ordena por la primera y, cuando hay empate, por la siguiente. Y hay una palabra que corta el resultado a las primeras filas; va al final del todo.',
  ],
};

export const S5: ProblemaSql = {
  id: 's5-quien-con-quien',
  titulo: 'Problema 5 · Quién está en qué equipo',
  enunciado:
    'La tabla de integrantes guarda el equipo como un número, y ese número no le dice nada a nadie. Devuelve el ' +
    'nombre de cada integrante junto al nombre de su equipo. El orden da igual.',
  columnas: 'el nombre del integrante y el nombre de su equipo, en ese orden',
  casos: [
    visible([
      ['Ana Torres', 'Los Circuitos'],
      ['Bruno Salas', 'Los Circuitos'],
      ['Karla Vega', 'Trazo Libre'],
      ['Diego Marín', 'Voltio'],
      ['Andrés Villareal', 'Pixel Studio'],
      ['Isabel Rocha', 'Los Circuitos'],
      ['Camila Ruiz', 'Trazo Libre'],
      ['Gabriela Nuño', 'Trazo Libre'],
      ['Elena Cano', 'Pixel Studio'],
      ['Héctor Paredes', 'Voltio'],
      ['Javier Soto', 'Pixel Studio'],
    ]),
    ocultoCurso([
      ['Lucía Ponce', 'Tinta y Bit'],
      ['Aarón Medina', 'Los Circuitos'],
      ['Tomás Guerra', 'Motor Uno'],
      ['Beatriz Lara', 'Tinta y Bit'],
      ['Néstor Calvo', 'Los Circuitos'],
      ['Óscar Pineda', 'Motor Uno'],
    ]),
    ocultoChico([
      ['Rubén Solís', 'Voltio'],
      ['Adela Mota', 'Los Circuitos'],
      ['Iván Duarte', 'Los Circuitos'],
      ['Sofía Bravo', 'Voltio'],
    ]),
  ],
  pistas: [
    'Los datos que necesitas están repartidos en dos tablas, y hay una columna que las cose: el número de equipo que guarda cada integrante es el identificador de una fila de equipos.',
    'Cuidado con una cosa que vas a ver: las dos tablas tienen una columna que se llama «nombre». Si la pides a secas, el motor no sabe de cuál hablas y te lo dirá con esas palabras. Se resuelve diciendo de qué tabla es cada una.',
    'La cláusula que junta dos tablas lleva siempre su condición detrás, y esa condición es la igualdad entre la columna que apunta y la columna a la que apunta. Fíjate también en cuántas filas te devuelve: puede que salgan menos integrantes de los que hay.',
  ],
};

export const S6: ProblemaSql = {
  id: 's6-sin-equipo',
  titulo: 'Problema 6 · El que se quedó fuera',
  enunciado:
    'En el problema anterior desapareció gente: los que todavía no tienen equipo. La coordinadora quiere hablar con ' +
    'ellos. Devuelve el nombre de los integrantes que no tienen ningún equipo asignado.',
  columnas: 'nombre — una sola columna, en cualquier orden',
  casos: [
    visible([['Fernando Ibarra']]),
    ocultoCurso([['Alma Rendon'], ['Carmen Ibarra']]),
    ocultoChico([['Pablo Ceja']]),
  ],
  pistas: [
    'La casilla del equipo de esa gente no está vacía como un texto vacío: está en NULL, que es «aquí no hay dato». No es lo mismo.',
    'A un NULL no se le puede preguntar si es igual a algo. Da igual a qué lo compares: la respuesta nunca es ni sí ni no. Por eso hay que preguntarle de otra manera.',
    'Hay dos palabras, seguidas, que preguntan justo eso: si una casilla está en NULL. Se escriben detrás del nombre de la columna, sin ningún igual de por medio.',
  ],
};

export const S7: ProblemaSql = {
  id: 's7-la-plantilla',
  titulo: 'Problema 7 · La plantilla de Los Circuitos',
  enunciado:
    'El equipo «Los Circuitos» va a una competencia y hay que entregar su plantilla. Devuelve el nombre de sus ' +
    'integrantes. El orden da igual. Ojo: el número de equipo cambia de un año a otro, el nombre no.',
  columnas: 'nombre — una sola columna, en cualquier orden',
  casos: [
    visible([['Ana Torres'], ['Bruno Salas'], ['Isabel Rocha']]),
    ocultoCurso([['Aarón Medina'], ['Néstor Calvo']]),
    ocultoChico([['Adela Mota'], ['Iván Duarte']]),
  ],
  pistas: [
    'La última frase del enunciado es un aviso: filtrar por el número de equipo funciona con los datos que tienes delante y falla con cualquier otro club.',
    'Vas a necesitar las dos tablas otra vez, y encima un filtro. El filtro no va sobre la tabla de integrantes: va sobre la de equipos.',
    'Se juntan las dos tablas igual que en el problema 5, y detrás se añade la cláusula que filtra, comparando el nombre del equipo con el texto entre comillas. En el resultado sólo tiene que quedar la columna del nombre del integrante.',
  ],
};

export const PROBLEMAS_SQL: readonly ProblemaSql[] = [S1, S2, S3, S4, S5, S6, S7];
