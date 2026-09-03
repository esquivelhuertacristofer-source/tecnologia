'use client';

import type { ActivityProps } from '@/types/activity-contract';
import type { Base } from '@/components/simuladores/datos';
import type { EjecucionSQL, GuionDatos, ResultadoSQL } from '@/components/simuladores/datos/ventana';
import { SalaDatos, type ClaseDatos } from './SalaDatos';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * N9 · «Algoritmos y datos», parada 2 de 3 · `n9-bases-de-datos-iniciales`
 * 3.º de secundaria · 14–15 años (comprobado en `src/data/curriculo.ts`)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * **La primera clase de Tecnia Datos.** La base ya existe (canon, fila 70):
 * el alumno abre `biblioteca.sql`, mira el árbol de tablas y aprende a leer
 * un `SELECT` con `FROM` y `WHERE` — y, por el camino, a leer un error de SQL
 * en vez de temerle.
 *
 * ── Los tres errores que se provocan a propósito ──────────────────────────
 *
 * 1. **Tabla que no existe** (encargo 3): `FROM libro` en vez de `libros`.
 *    Error de la familia `tabla`, con la lista de tablas que sí hay y la
 *    sugerencia «¿Querías decir «libros»?» — `masParecido` puesta a prueba.
 * 2. **Tipo equivocado** (encargo 5): comparar una columna de números
 *    (`prestado_a`) con un texto. El motor lo caza ANTES de tocar una fila
 *    (`motor.ts`, `choqueEstatico`) y dice qué tipo guarda la columna.
 * 3. **La trampa de `NULL`** (encargos 6–7): `WHERE prestado_a = NULL` no es
 *    un error — es una consulta válida que nunca puede ser cierta. Es la
 *    lección central de la clase: `NULL` no es «vacío», es «no se sabe», y
 *    compararlo con `=` siempre da «no se sabe» (`modelo.ts`, decisión 2).
 *    El encargo 6 la comete a propósito y lee el aviso que el motor pone
 *    solo; el 7 la corrige con `IS NULL`.
 *
 * ── Dónde vive `NULL` en el modelo ─────────────────────────────────────────
 *
 * `libros.prestado_a` es la clave foránea a `socios(id)`, y se deja vacía
 * quien el libro sigue en el estante. No es un truco de examen: es el uso más
 * común de `NULL` en una base real — una relación que a veces no aplica— y
 * es la misma columna que la clase 87 (`n10-modela-tus-datos`) construirá
 * desde cero con `REFERENCES`.
 */

const BASE_BIBLIOTECA: Base = {
  tablas: [
    {
      nombre: 'socios',
      columnas: [
        { nombre: 'id', tipo: 'entero', clavePrimaria: true, noNulo: true, referencia: null },
        { nombre: 'nombre', tipo: 'texto', clavePrimaria: false, noNulo: true, referencia: null },
      ],
      filas: [
        [1, 'Marcela Ibáñez'],
        [2, 'Tomás Reyes'],
        [3, 'Paula Contreras'],
      ],
    },
    {
      nombre: 'libros',
      columnas: [
        { nombre: 'id', tipo: 'entero', clavePrimaria: true, noNulo: true, referencia: null },
        { nombre: 'titulo', tipo: 'texto', clavePrimaria: false, noNulo: true, referencia: null },
        { nombre: 'autor', tipo: 'texto', clavePrimaria: false, noNulo: true, referencia: null },
        { nombre: 'paginas', tipo: 'entero', clavePrimaria: false, noNulo: true, referencia: null },
        {
          nombre: 'prestado_a',
          tipo: 'entero',
          clavePrimaria: false,
          noNulo: false,
          referencia: { tabla: 'socios', columna: 'id' },
        },
      ],
      filas: [
        [1, 'Cien años de soledad', 'Gabriel García Márquez', 471, null],
        [2, 'Ficciones', 'Jorge Luis Borges', 203, 2],
        [3, 'Rayuela', 'Julio Cortázar', 635, null],
        [4, 'La casa de los espíritus', 'Isabel Allende', 448, 1],
        [5, 'El túnel', 'Ernesto Sabato', 158, null],
        [6, 'Pedro Páramo', 'Juan Rulfo', 124, 3],
        [7, 'Los detectives salvajes', 'Roberto Bolaño', 609, null],
        [8, 'La ciudad y los perros', 'Mario Vargas Llosa', 421, 2],
      ],
    },
  ],
};

const PLANTILLA = ['-- biblioteca.sql · la base de la biblioteca del salón', '-- Escribe tus consultas debajo de este comentario.', ''].join('\n');

function ultimo(e: EjecucionSQL): ResultadoSQL | null {
  return e.resultados.at(-1) ?? null;
}

function indiceCol(r: ResultadoSQL, nombre: string): number {
  return r.columnas.findIndex((c) => c.nombre.toLowerCase() === nombre.toLowerCase());
}

const GUION: GuionDatos = {
  pasos: [
    {
      id: 'esquema',
      titulo: 'Mira el esquema antes de escribir nada',
      instruccion:
        'A la derecha está «El esquema»: las tablas que ya existen, con su clave primaria (🔑) y a qué apunta cada columna. Mira la tabla «libros» y contesta: ¿cuál es su clave primaria?',
      pista: 'La clave primaria lleva el candado 🔑 al lado del nombre, en el árbol de tablas.',
      senal: { control: 'esquema' },
      logro: { tipo: 'eleccion', opciones: ['id', 'titulo', 'autor'], correcta: 0 },
      aprendido: 'Cada tabla tiene una clave primaria: la columna que distingue una fila de todas las demás.',
    },
    {
      id: 'select-todo',
      titulo: 'Tu primera consulta',
      instruccion: 'Escribe SELECT * FROM libros; y pulsa ▶ Ejecutar. El «*» pide todas las columnas.',
      pista: 'SELECT * FROM libros;  — no olvides el punto y coma al final.',
      senal: { control: 'ejecutar' },
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => {
          if (!e.ok) return false;
          const r = ultimo(e);
          return !!r && r.clase === 'consulta' && r.columnas.length === 5 && r.filas.length === 8;
        },
      },
      aprendido: 'SELECT * FROM tabla; trae todas las columnas y todas las filas de esa tabla.',
    },
    {
      id: 'error-tabla',
      titulo: 'Rómpelo a propósito',
      instruccion:
        'Cambia libros por libro (sin la «s») y ejecuta. Vas a ver un error de verdad: léelo entero antes de corregirlo.',
      pista: 'SELECT * FROM libro;  — así, mal escrito, a propósito.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => !e.ok && e.error.clase === 'tabla',
      },
      aprendido:
        'Cuando una tabla no existe, el error dice qué tablas SÍ hay y sugiere la más parecida. Léelo: no adivines.',
    },
    {
      id: 'where-numero',
      titulo: 'Corrígelo y filtra',
      instruccion: 'Arréglalo, y de paso quédate sólo con los libros largos: SELECT * FROM libros WHERE paginas > 300;',
      pista: 'SELECT * FROM libros WHERE paginas > 300;',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => {
          if (!e.ok) return false;
          const r = ultimo(e);
          if (!r || r.filas.length === 0) return false;
          const iPag = indiceCol(r, 'paginas');
          return iPag >= 0 && r.filas.every((f) => typeof f[iPag] === 'number' && (f[iPag] as number) > 300);
        },
      },
      aprendido: 'WHERE deja pasar sólo las filas donde la condición es cierta.',
    },
    {
      id: 'error-tipo',
      titulo: 'Otro error a propósito: el tipo',
      instruccion:
        'prestado_a guarda números (apunta al id de un socio), no nombres. Prueba: SELECT titulo FROM libros WHERE prestado_a = \'Marcela Ibáñez\'; y lee lo que contesta el motor.',
      pista: 'SELECT titulo FROM libros WHERE prestado_a = \'Marcela Ibáñez\';',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => !e.ok && e.error.clase === 'tipo',
      },
      aprendido:
        'El motor conoce el tipo de cada columna y avisa ANTES de mirar una sola fila si comparas contra el tipo que no es.',
    },
    {
      id: 'trampa-null',
      titulo: 'La trampa de NULL',
      instruccion:
        'Los libros que están en el estante tienen prestado_a vacío. Prueba a buscarlos así: SELECT titulo FROM libros WHERE prestado_a = NULL; Ejecuta y fíjate en cuántas filas trae — y en el aviso de abajo.',
      pista: 'SELECT titulo FROM libros WHERE prestado_a = NULL;',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => {
          if (!e.ok) return false;
          const r = ultimo(e);
          return !!r && r.filas.length === 0 && r.avisos.length > 0;
        },
      },
      aprendido: '«= NULL» no es cierto NUNCA, ni para las filas que sí están vacías: NULL no es igual ni a sí mismo.',
    },
    {
      id: 'is-null',
      titulo: 'Pregúntale bien',
      instruccion: 'Para preguntar por un vacío existe IS NULL: SELECT titulo FROM libros WHERE prestado_a IS NULL;',
      pista: 'SELECT titulo FROM libros WHERE prestado_a IS NULL;',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => {
          if (!e.ok) return false;
          const r = ultimo(e);
          return !!r && r.filas.length === 4;
        },
      },
      aprendido: 'IS NULL es la única manera de preguntar por un valor que no se sabe.',
    },
    {
      id: 'que-es-null',
      titulo: 'Antes de cerrar',
      instruccion: '¿Qué significa que prestado_a valga NULL en una fila de libros?',
      pista: 'No es un cero ni un texto vacío: es que esa pregunta no tiene respuesta todavía.',
      logro: {
        tipo: 'eleccion',
        opciones: ['Que vale 0', 'Que no se sabe o no aplica todavía', 'Que el libro no existe'],
        correcta: 1,
      },
      aprendido: 'NULL es un valor más, y significa «no se sabe» — nunca «cero» ni «texto vacío».',
    },
  ],
  cierre: 'Ya sabes leer un esquema, escribir SELECT con WHERE, y lo más importante: leer un error en vez de temerle.',
};

const CLASE: ClaseDatos = {
  actividadId: 'n9-bases-de-datos-iniciales',
  titulo: 'Bases de datos iniciales',
  archivo: 'biblioteca.sql',
  insignia: { nombre: 'Primera consulta', emoji: '🗄️' },
  minutos: 28,
  portada: {
    situacion: 'La biblioteca del salón lleva su registro de préstamos en una base de datos con dos tablas.',
    tema: 'Bases de datos iniciales',
    objetivo: 'Leer el esquema de una base, y escribir SELECT con FROM y WHERE para consultarla — errores incluidos.',
    vasAHacer: [
      'Leer el árbol de tablas: qué hay y cuál es la clave de cada una.',
      'Escribir tu primer SELECT * FROM.',
      'Romper una consulta a propósito y leer el error.',
      'Descubrir por qué WHERE x = NULL nunca encuentra nada, y qué escribir en su lugar.',
    ],
  },
  plantilla: PLANTILLA,
  baseInicial: BASE_BIBLIOTECA,
  soloLectura: [1, 2],
  guion: GUION,
  bit: {
    inicio: 'Abre biblioteca.sql. A la derecha tienes el esquema: mira qué tablas hay antes de escribir nada.',
    cierre: 'Ocho encargos, tres errores provocados y la trampa de NULL descubierta. Así se aprende SQL de verdad.',
  },
  final: {
    titulo: '¡Tu primera base de datos consultada!',
    detalle:
      'SELECT, FROM, WHERE, y a leer un error en vez de temerle. Sobre todo: NULL no es un cero ni un vacío — es «no se sabe», y por eso «= NULL» nunca encuentra nada.',
  },
};

export function LabBasesDeDatosIniciales(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaDatos {...props} clase={CLASE} />;
}

export default LabBasesDeDatosIniciales;
