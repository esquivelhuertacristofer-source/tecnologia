'use client';

import type { ActivityProps } from '@/types/activity-contract';
import type { Base } from '@/components/simuladores/datos';
import type { EjecucionSQL, GuionDatos, ResultadoSQL } from '@/components/simuladores/datos/ventana';
import { SalaDatos, type ClaseDatos } from './SalaDatos';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * N10 · «Bases de datos y SQL», parada 2 de 3 · `n10-consultas-sql`
 * Bachillerato · 15–18 años (comprobado en `src/data/curriculo.ts`)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * **Filtros, orden y una unión** (canon, fila 88). El club de robótica de
 * `n10-modela-tus-datos` ya tiene datos de verdad — `consultas.sql` arranca
 * con `equipos` e `integrantes` poblados— y aquí se consultan, no se diseñan.
 *
 * ── Lo que se enseña, y con qué encargo ────────────────────────────────────
 *
 * `ORDER BY`/`DESC` (1–2), `LIKE` (3), `LIMIT` (4), el tope de 100 filas en
 * pantalla (5–6, con una tabla de 150 sesiones sólo para eso), `JOIN … ON`
 * con el error de columna ambigua y `AS` (7–8), y por qué el `JOIN` pierde
 * filas — incluidas las que tienen `NULL` (9).
 *
 * **A propósito, esta clase NO usa `COUNT`/`SUM`/`AVG`/`GROUP BY`/`HAVING`.**
 * `subconjunto.ts` es explícito: esas cinco piezas las pide `n10-conecta-tus-datos`
 * (fila 89, bloqueada), y «si ninguna clase agrupa, sobran». Meterlas aquí
 * habría sido inventar una capacidad que esta fila del canon no pide.
 *
 * ── Los dos errores que se provocan a propósito ───────────────────────────
 *
 * 1. **Columna ambigua** (encargo 7): `integrantes` y `equipos` tienen las
 *    dos una columna `nombre`. Pedirla sin decir de cuál tabla es el error
 *    de JOIN más común que existe.
 * 2. **`NULL` dentro de un `JOIN`** (encargo 8–9): Fernando Ibarra no tiene
 *    equipo todavía (`equipo_id` es `NULL`) y desaparece del resultado. No es
 *    un error del motor: es la clase entera de esta fila del canon — «que el
 *    JOIN pierda las filas que no casan ES la clase» (`subconjunto.ts`).
 */

const EQUIPOS: Base['tablas'][number] = {
  nombre: 'equipos',
  columnas: [
    { nombre: 'id', tipo: 'entero', clavePrimaria: true, noNulo: true, referencia: null },
    { nombre: 'nombre', tipo: 'texto', clavePrimaria: false, noNulo: true, referencia: null },
    { nombre: 'categoria', tipo: 'texto', clavePrimaria: false, noNulo: true, referencia: null },
  ],
  filas: [
    [1, 'Los Circuitos', 'Robótica'],
    [2, 'Pixel Studio', 'Programación'],
    [3, 'Trazo Libre', 'Diseño'],
    [4, 'Voltio', 'Electrónica'],
  ],
};

const INTEGRANTES: Base['tablas'][number] = {
  nombre: 'integrantes',
  columnas: [
    { nombre: 'id', tipo: 'entero', clavePrimaria: true, noNulo: true, referencia: null },
    { nombre: 'nombre', tipo: 'texto', clavePrimaria: false, noNulo: true, referencia: null },
    { nombre: 'grado', tipo: 'entero', clavePrimaria: false, noNulo: true, referencia: null },
    {
      nombre: 'equipo_id',
      tipo: 'entero',
      clavePrimaria: false,
      noNulo: false,
      referencia: { tabla: 'equipos', columna: 'id' },
    },
  ],
  /*
   * EL ORDEN DE ESTAS DOCE FILAS ES PARTE DE LA CLASE. NO LAS ALFABETICES.
   *
   * Estaban sembradas en orden alfabético, y eso regalaba el encargo 1: su
   * comprobador pide «doce filas ordenadas por nombre», así que
   * `SELECT nombre, grado FROM integrantes;` —sin ORDER BY ninguno— ya las
   * devolvía ordenadas y lo daba por hecho. Comprobado jugándolo en el
   * navegador el 2-sep-2026: el contador saltaba a ENCARGO 2 sin que el alumno
   * hubiera ordenado nada, justo lo contrario de lo que dice su propia línea
   * `aprendido` («sin él, el orden es sólo el de inserción»).
   *
   * Tampoco los `id` van en orden alfabético ya, para que `ORDER BY id` no sea
   * el mismo atajo por otra puerta. Al cambiarlos se aprovechó para cuadrar la
   * continuidad con la parada 1 (`n10-modela-tus-datos`), donde el alumno
   * escribe con sus manos `VALUES (1, 'Ana Torres', 1)` y
   * `VALUES (2, 'Bruno Salas', 1)`: esos dos ahora son id 1 y 2 también aquí.
   *
   * Lo que cualquier orden nuevo tiene que seguir cumpliendo:
   *   · los nombres NO ascendentes (encargo 1 exige ORDER BY de verdad);
   *   · los cuatro de grado 3 NO en orden descendente (encargo 2);
   *   · las tres primeras filas NO todas de grado 3 (encargo 4, el LIMIT);
   *   · Fernando Ibarra con `equipo_id` NULL (encargos 8 y 9 viven de eso).
   */
  filas: [
    [1, 'Ana Torres', 2, 1],
    [2, 'Bruno Salas', 1, 1],
    [3, 'Karla Vega', 1, 3],
    [4, 'Diego Marín', 3, 4],
    [5, 'Andrés Villareal', 3, 2],
    [6, 'Isabel Rocha', 2, 1],
    [7, 'Fernando Ibarra', 2, null],
    [8, 'Camila Ruiz', 2, 3],
    [9, 'Gabriela Nuño', 3, 3],
    [10, 'Elena Cano', 1, 2],
    [11, 'Héctor Paredes', 1, 4],
    [12, 'Javier Soto', 3, 2],
  ],
};

/**
 * Sólo para el encargo 5–6: una tabla de 150 filas para que el tope de 100
 * del pie de la rejilla (`MAX_FILAS_TABLA`, `ventanaDatos/tiposDatos.ts`) se
 * vea en pantalla de verdad, y no se quede en un número del encargo.
 */
const SESIONES: Base['tablas'][number] = {
  nombre: 'sesiones',
  columnas: [
    { nombre: 'id', tipo: 'entero', clavePrimaria: true, noNulo: true, referencia: null },
    { nombre: 'fecha', tipo: 'fecha', clavePrimaria: false, noNulo: true, referencia: null },
  ],
  filas: Array.from({ length: 150 }, (_, i) => {
    const dia = i + 1;
    const mes = String(Math.floor((dia - 1) / 30) + 1).padStart(2, '0');
    const diaMes = String(((dia - 1) % 30) + 1).padStart(2, '0');
    return [i + 1, `2026-${mes}-${diaMes}`];
  }),
};

const BASE_CONSULTAS: Base = { tablas: [EQUIPOS, INTEGRANTES, SESIONES] };

const PLANTILLA = ['-- consultas.sql · el club de robótica, ya con datos', ''].join('\n');

function ultimo(e: EjecucionSQL): ResultadoSQL | null {
  return e.resultados.at(-1) ?? null;
}

function indiceCol(r: ResultadoSQL, nombre: string): number {
  return r.columnas.findIndex((c) => c.nombre.toLowerCase() === nombre.toLowerCase());
}

function ordenadoPorTexto(valores: string[], desc: boolean): boolean {
  for (let i = 1; i < valores.length; i += 1) {
    const c = valores[i - 1].localeCompare(valores[i], 'es', { numeric: true, sensitivity: 'variant' });
    if (desc ? c < 0 : c > 0) return false;
  }
  return true;
}

const GUION: GuionDatos = {
  pasos: [
    {
      id: 'orden-alfabetico',
      titulo: 'Ordena el resultado',
      instruccion: 'SELECT nombre, grado FROM integrantes ORDER BY nombre;',
      pista: 'SELECT nombre, grado FROM integrantes ORDER BY nombre;',
      senal: { control: 'ejecutar' },
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => {
          if (!e.ok) return false;
          const r = ultimo(e);
          if (!r || r.filas.length !== 12) return false;
          const i = indiceCol(r, 'nombre');
          return i >= 0 && ordenadoPorTexto(r.filas.map((f) => String(f[i])), false);
        },
      },
      aprendido: 'ORDER BY ordena el resultado; sin él, el orden es sólo el de inserción.',
    },
    {
      id: 'grado-desc',
      titulo: 'Filtra y ordena al revés',
      instruccion: 'Sólo el grado 3, del más nuevo alfabéticamente al primero: SELECT nombre FROM integrantes WHERE grado = 3 ORDER BY nombre DESC;',
      pista: 'SELECT nombre FROM integrantes WHERE grado = 3 ORDER BY nombre DESC;',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => {
          if (!e.ok) return false;
          const r = ultimo(e);
          if (!r || r.filas.length !== 4) return false;
          const i = indiceCol(r, 'nombre');
          return i >= 0 && ordenadoPorTexto(r.filas.map((f) => String(f[i])), true);
        },
      },
      aprendido: 'WHERE sigue filtrando ANTES de ordenar; DESC invierte el sentido.',
    },
    {
      id: 'like',
      titulo: 'Busca por patrón',
      instruccion: "Los que EMPIEZAN por A: SELECT nombre FROM integrantes WHERE nombre LIKE 'A%';",
      pista: "SELECT nombre FROM integrantes WHERE nombre LIKE 'A%';",
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => !!e.ok && (ultimo(e)?.filas.length ?? -1) === 2,
      },
      aprendido: '% significa «lo que sea, incluso nada»: LIKE \'A%\' son los que empiezan por A.',
    },
    {
      id: 'limit',
      titulo: 'Corta el resultado',
      instruccion: 'Los tres de grado más alto: SELECT nombre, grado FROM integrantes ORDER BY grado DESC LIMIT 3;',
      pista: 'SELECT nombre, grado FROM integrantes ORDER BY grado DESC LIMIT 3;',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => {
          if (!e.ok) return false;
          const r = ultimo(e);
          if (!r || r.filas.length !== 3) return false;
          const i = indiceCol(r, 'grado');
          return i >= 0 && r.filas.every((f) => f[i] === 3);
        },
      },
      aprendido: 'LIMIT corta el resultado a las primeras N filas, DESPUÉS de ordenar.',
    },
    {
      id: 'muchas-filas',
      titulo: 'Una tabla grande de verdad',
      instruccion:
        'El club lleva un registro de cada sesión de entrenamiento desde que empezó. Ejecuta SELECT * FROM sesiones; y mira el pie de la tabla, no sólo las filas.',
      pista: 'SELECT * FROM sesiones;',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => !!e.ok && (ultimo(e)?.filas.length ?? 0) === 150,
      },
      aprendido: 'El resultado trae las 150 filas; la pantalla sólo DIBUJA 100 para no colgar el navegador.',
    },
    {
      id: 'cuantas-de-verdad',
      titulo: 'Lee el pie de la tabla',
      instruccion: '¿Cuántas sesiones hay en total, aunque la tabla sólo pinte 100 filas?',
      pista: 'El pie dice «se muestran las primeras 100 de …». Ese segundo número es el total de verdad.',
      logro: { tipo: 'eleccion', opciones: ['100', '150', 'No se puede saber sin contarlas a mano'], correcta: 1 },
      aprendido: 'Los datos están completos aunque la pantalla recorte el dibujo — y siempre lo dice.',
    },
    {
      id: 'columna-ambigua',
      titulo: 'Un error a propósito: la unión',
      instruccion:
        'Junta integrantes con su equipo: SELECT nombre, equipos.nombre FROM integrantes JOIN equipos ON integrantes.equipo_id = equipos.id;',
      pista: 'SELECT nombre, equipos.nombre FROM integrantes JOIN equipos ON integrantes.equipo_id = equipos.id;',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => !e.ok && e.error.clase === 'columna' && e.error.familia.includes('ambiguous'),
      },
      aprendido: 'nombre existe en las DOS tablas: sin decir de cuál, el motor no puede adivinar.',
    },
    {
      id: 'con-alias',
      titulo: 'Corrígelo diciendo de cuál tabla',
      instruccion:
        'SELECT integrantes.nombre, equipos.nombre AS equipo FROM integrantes JOIN equipos ON integrantes.equipo_id = equipos.id ORDER BY integrantes.nombre;',
      pista:
        'SELECT integrantes.nombre, equipos.nombre AS equipo FROM integrantes JOIN equipos ON integrantes.equipo_id = equipos.id ORDER BY integrantes.nombre;',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => !!e.ok && (ultimo(e)?.filas.length ?? -1) === 11,
      },
      aprendido: 'tabla.columna dice de cuál es; AS le pone el nombre que tú quieras al resultado.',
    },
    {
      id: 'por-que-falta',
      titulo: 'Antes de cerrar',
      instruccion: 'La consulta anterior trae 11 nombres, pero integrantes tiene 12 filas. Fernando Ibarra no está. ¿Por qué?',
      pista: 'Mira su equipo_id en el esquema, a la derecha.',
      logro: {
        tipo: 'eleccion',
        opciones: ['Se borró sin querer', 'Su equipo_id es NULL, y NULL nunca es igual a nada — ni en un JOIN', 'El JOIN tiene un error'],
        correcta: 1,
      },
      aprendido: 'Que el JOIN pierda las filas que no casan es la clase entera: NULL no casa con nada, ni siquiera con otro NULL.',
    },
  ],
  cierre: 'Filtraste, ordenaste, buscaste por patrón, cortaste el resultado y uniste dos tablas — y viste por qué un JOIN pierde filas.',
};

const CLASE: ClaseDatos = {
  actividadId: 'n10-consultas-sql',
  titulo: 'Consultas SQL',
  archivo: 'consultas.sql',
  insignia: { nombre: 'Consultora de datos', emoji: '🔍' },
  minutos: 34,
  portada: {
    situacion: 'El club de robótica ya tiene su base de datos con integrantes de verdad. Hoy le preguntas cosas.',
    tema: 'Consultas SQL',
    objetivo: 'Filtrar, ordenar, buscar por patrón, cortar el resultado y unir dos tablas con JOIN — entendiendo por qué un JOIN pierde filas.',
    vasAHacer: [
      'Ordenar y filtrar con WHERE, ORDER BY y DESC.',
      'Buscar por patrón con LIKE, y cortar con LIMIT.',
      'Consultar una tabla de 150 filas y aprender a leer el pie de la tabla.',
      'Unir dos tablas con JOIN, provocar un error de columna ambigua, y descubrir por qué NULL desaparece del resultado.',
    ],
  },
  plantilla: PLANTILLA,
  baseInicial: BASE_CONSULTAS,
  soloLectura: [1],
  guion: GUION,
  bit: {
    inicio: 'consultas.sql ya tiene datos: equipos, integrantes y el registro de sesiones. Hoy sólo preguntas.',
    cierre: 'ORDER BY, LIKE, LIMIT, JOIN y la razón exacta por la que Fernando Ibarra no aparece en la lista.',
  },
  final: {
    titulo: '¡Puedes consultar una base de verdad!',
    detalle:
      'WHERE, ORDER BY, LIKE, LIMIT, y un JOIN con su AS. Y la lección que se lleva cualquiera que use SQL en serio: un JOIN sólo trae lo que casa, y NULL no casa con nada.',
  },
};

export function LabConsultasSql(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaDatos {...props} clase={CLASE} />;
}

export default LabConsultasSql;
