'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { esquemaDe } from '@/components/simuladores/datos';
import type { GuionDatos } from '@/components/simuladores/datos/ventana';
import { SalaDatos, type ClaseDatos } from './SalaDatos';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * N10 · «Bases de datos y SQL», parada 1 de 3 · `n10-modela-tus-datos`
 * Bachillerato · 15–18 años (comprobado en `src/data/curriculo.ts`)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * **Diseñar, no consultar** (canon, fila 87). El alumno arranca de una base
 * vacía y escribe `CREATE TABLE` con tipos, `PRIMARY KEY` y `REFERENCES`, y
 * `INSERT` para poblarla. Es la única de las cuatro clases donde las
 * restricciones tienen que cumplirse DE VERDAD: si la clave foránea no
 * impidiera nada, esta clase no enseñaría nada (`subconjunto.ts`, fila 87).
 *
 * ── Una cosa del motor que hay que decir en voz alta ANTES de escribir esto ─
 *
 * `▶ Ejecutar` corre TODO lo que hay en el editor, de arriba abajo, cada vez
 * que se pulsa — igual que un DB Browser de verdad. Una vez que un
 * `CREATE TABLE` o un `INSERT` se aplicó con éxito, **volver a correrlo revienta**
 * («ya existe una tabla», «ya hay una fila con id = …»): el motor no está mal,
 * está siendo exacto. Por eso el guion pide explícitamente borrar del editor
 * lo que ya se aplicó antes de escribir lo siguiente — es la misma disciplina
 * que un SQL de verdad exige, y se dice en el propio encargo, no se esconde.
 *
 * ── Los tres errores que se provocan a propósito ──────────────────────────
 *
 * 1. **`REFERENCES` a una tabla que no existe todavía** (encargo 1): crear
 *    `integrantes` antes que `equipos`. Enseña que el orden de creación
 *    importa — hay que crear el padre antes que el hijo.
 * 2. **`NOT NULL`** (encargo 4): un `INSERT` que no da `nombre`.
 * 3. **La clave foránea que sí impide algo** (encargo 6): un `equipo_id` que
 *    no existe. Es la lección central de la clase.
 *
 * ── `esquemaDe()` como corrector ────────────────────────────────────────────
 * Los predicados de `ejecucion` no leen el texto que escribió el alumno: leen
 * `esquemaDe(e.base)` — la misma función que alimenta el panel del esquema a
 * la derecha— para comprobar que las tablas, columnas y relaciones quedaron
 * como tienen que quedar. Es exactamente lo que `modelo.ts` documenta que
 * esta clase iba a hacer.
 */

const PLANTILLA = ['-- proyecto.sql · el modelo de datos del club de robótica', ''].join('\n');

const GUION: GuionDatos = {
  pasos: [
    {
      id: 'orden-importa',
      titulo: 'Un error a propósito: el orden',
      instruccion:
        'Vas a diseñar la base del club de robótica: equipos, e integrantes que pertenecen a un equipo. Empieza mal, a propósito — escribe SOLO esto y ejecuta:\nCREATE TABLE integrantes (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL, equipo_id INTEGER REFERENCES equipos(id));',
      pista: 'CREATE TABLE integrantes (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL, equipo_id INTEGER REFERENCES equipos(id));',
      senal: { control: 'ejecutar' },
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => !e.ok && e.error.clase === 'tabla' && e.error.mensaje.toLowerCase().includes('equipos'),
      },
      aprendido: 'REFERENCES sólo puede apuntar a una tabla que YA existe: el orden en que creas tus tablas importa.',
    },
    {
      id: 'orden-correcto',
      titulo: 'Las dos tablas, en el orden correcto',
      instruccion:
        'Borra esa línea. Escribe tus dos tablas juntas, primero la que no depende de nadie:\nCREATE TABLE equipos (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL);\nCREATE TABLE integrantes (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL, equipo_id INTEGER REFERENCES equipos(id));',
      pista:
        'CREATE TABLE equipos (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL);\nCREATE TABLE integrantes (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL, equipo_id INTEGER REFERENCES equipos(id));',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => {
          if (!e.ok) return false;
          const t = esquemaDe(e.base);
          const equipos = t.find((x) => x.nombre.toLowerCase() === 'equipos');
          const integrantes = t.find((x) => x.nombre.toLowerCase() === 'integrantes');
          const fk = integrantes?.columnas.find((c) => c.nombre.toLowerCase() === 'equipo_id');
          return !!equipos && !!integrantes && !!fk?.referencia && fk.referencia.tabla.toLowerCase() === 'equipos';
        },
      },
      aprendido: 'Dos tablas relacionadas: integrantes.equipo_id APUNTA a equipos.id — la flecha del esquema lo dibuja.',
    },
    {
      id: 'llena-equipos',
      titulo: 'Puebla la primera tabla',
      instruccion:
        'Tus dos CREATE TABLE ya se aplicaron — míralas en el esquema, a la derecha. Bórralas del editor (si las vuelves a correr, el motor va a decir, con razón, que ya existen) y escribe:\nINSERT INTO equipos (id, nombre) VALUES (1, \'Los Circuitos\'), (2, \'Pixel Studio\');',
      pista: "INSERT INTO equipos (id, nombre) VALUES (1, 'Los Circuitos'), (2, 'Pixel Studio');",
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => {
          if (!e.ok) return false;
          const equipos = esquemaDe(e.base).find((x) => x.nombre.toLowerCase() === 'equipos');
          return equipos?.filas === 2;
        },
      },
      aprendido: 'INSERT con varias tuplas separadas por comas mete varias filas de una sola vez.',
    },
    {
      id: 'falta-nombre',
      titulo: 'Otro error a propósito: NOT NULL',
      instruccion:
        'Bórralo (ya se guardó) y da de alta al primer integrante SIN su nombre, a propósito:\nINSERT INTO integrantes (id, equipo_id) VALUES (1, 1);',
      pista: 'INSERT INTO integrantes (id, equipo_id) VALUES (1, 1);',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => !e.ok && e.error.clase === 'restriccion' && e.error.mensaje.toLowerCase().includes('nombre'),
      },
      aprendido: 'NOT NULL no perdona: una columna marcada así no puede quedar vacía, ni una sola vez.',
    },
    {
      id: 'con-nombre',
      titulo: 'Corrígelo',
      instruccion: 'Arregla esa misma línea, ahora con su nombre:\nINSERT INTO integrantes (id, nombre, equipo_id) VALUES (1, \'Ana Torres\', 1);',
      pista: "INSERT INTO integrantes (id, nombre, equipo_id) VALUES (1, 'Ana Torres', 1);",
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => {
          if (!e.ok) return false;
          const integrantes = esquemaDe(e.base).find((x) => x.nombre.toLowerCase() === 'integrantes');
          return integrantes?.filas === 1;
        },
      },
      aprendido: 'Con su nombre puesto, la fila cumple la restricción y se guarda.',
    },
    {
      id: 'equipo-inexistente',
      titulo: 'El tercer error a propósito: la clave foránea',
      instruccion:
        'Bórralo (ya se guardó: mira que integrantes ya tiene 1 fila) e intenta anotar a alguien en un equipo que no existe:\nINSERT INTO integrantes (id, nombre, equipo_id) VALUES (2, \'Bruno Salas\', 99);',
      pista: "INSERT INTO integrantes (id, nombre, equipo_id) VALUES (2, 'Bruno Salas', 99);",
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => !e.ok && e.error.clase === 'restriccion' && e.error.familia.includes('FOREIGN KEY'),
      },
      aprendido: 'La clave foránea se cumple de verdad: no deja que una fila apunte a un equipo que no existe.',
    },
    {
      id: 'equipo-real',
      titulo: 'Corrígelo con un equipo real',
      instruccion: 'Arregla el equipo_id por uno que sí existe:\nINSERT INTO integrantes (id, nombre, equipo_id) VALUES (2, \'Bruno Salas\', 1);',
      pista: "INSERT INTO integrantes (id, nombre, equipo_id) VALUES (2, 'Bruno Salas', 1);",
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => {
          if (!e.ok) return false;
          const integrantes = esquemaDe(e.base).find((x) => x.nombre.toLowerCase() === 'integrantes');
          return integrantes?.filas === 2;
        },
      },
      aprendido: 'Ahora sí: dos integrantes, cada uno en un equipo que existe de verdad.',
    },
    {
      id: 'que-lo-impide',
      titulo: 'Antes de cerrar',
      instruccion: '¿Qué fue exactamente lo que impidió que Bruno quedara en un equipo que no existe?',
      pista: 'No fue la clave primaria, ni el NOT NULL: fue la restricción que apunta de una tabla a otra.',
      logro: {
        tipo: 'eleccion',
        opciones: ['La clave primaria (PRIMARY KEY)', 'NOT NULL', 'La clave foránea (REFERENCES)'],
        correcta: 2,
      },
      aprendido: 'Eso es una clave foránea: no deja que una fila apunte a algo que no está.',
    },
  ],
  cierre: 'Diseñaste dos tablas relacionadas y comprobaste que la relación se cumple de verdad, no de adorno.',
};

const CLASE: ClaseDatos = {
  actividadId: 'n10-modela-tus-datos',
  titulo: 'Modela tus datos',
  archivo: 'proyecto.sql',
  insignia: { nombre: 'Arquitecta de datos', emoji: '🏗️' },
  minutos: 32,
  portada: {
    situacion: 'El club de robótica necesita una base de datos propia: equipos, e integrantes que pertenecen a un equipo.',
    tema: 'Modela tus datos',
    objetivo: 'Diseñar dos tablas relacionadas con CREATE TABLE, PRIMARY KEY y REFERENCES, y comprobar que la relación se cumple de verdad.',
    vasAHacer: [
      'Provocar un error de orden: una tabla que apunta a otra que no existe todavía.',
      'Crear las dos tablas en el orden correcto.',
      'Poblarlas con INSERT, y toparte con NOT NULL a propósito.',
      'Intentar romper la relación con una clave foránea que no existe, y ver que no se deja.',
    ],
  },
  plantilla: PLANTILLA,
  soloLectura: [1],
  guion: GUION,
  bit: {
    inicio: 'proyecto.sql está vacío: hoy lo diseñas tú, tabla por tabla.',
    cierre: 'Dos tablas relacionadas, tres errores provocados, y una clave foránea que de verdad impide algo.',
  },
  final: {
    titulo: '¡Tu primer modelo de datos!',
    detalle:
      'CREATE TABLE con tipos, PRIMARY KEY y REFERENCES; INSERT que respeta NOT NULL y la clave foránea. Y algo que no se te olvida: correr dos veces el mismo CREATE TABLE revienta, y está bien que reviente.',
  },
};

export function LabModelaTusDatos(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaDatos {...props} clase={CLASE} />;
}

export default LabModelaTusDatos;
