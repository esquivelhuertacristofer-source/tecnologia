/**
 * Tecnia Datos · el banco del motor de SQL.
 *
 * Los tres criterios del encargo, medidos y no estimados:
 *
 *   1. **Que consulte de verdad** — 25 consultas de las que salen en una clase,
 *      con su resultado comprobado fila a fila (`CONSULTAS`).
 *   2. **Que los errores enseñen** — 20 consultas mal escritas, cada una con su
 *      mensaje y su pista comprobados (`ERRORES`).
 *   3. **Que aguante** — 10 000 filas con JOIN y GROUP BY por debajo de 50 ms,
 *      con el mínimo de siete tandas, nunca la media: la suite lanza un obrero
 *      por archivo y el reloj de pared mide también lo ocupada que está la
 *      máquina, así que la contención sólo puede sumar.
 */

import {
  aMatriz,
  BASE_VACIA,
  correr,
  crearSesion,
  deshacer,
  ejecutar,
  esquemaDe,
  rehacer,
  textoDeError,
  type Base,
  type ErrorSQL,
  type Resultado,
  type Valor,
} from '@/components/simuladores/datos';

/* ── la base de la clase ────────────────────────────────────────────────────*/

const ESQUEMA = `
CREATE TABLE grupos (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL,
  turno TEXT
);
CREATE TABLE alumnos (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL,
  edad INTEGER,
  nota REAL,
  grupo_id INTEGER REFERENCES grupos(id),
  beca BOOLEAN,
  nacimiento DATE
);
INSERT INTO grupos VALUES (1, '1A', 'matutino'), (2, '1B', 'matutino'), (3, '2A', 'vespertino');
-- Carla y Elena no tienen nota puesta, y Fabio no tiene grupo: eso es a propósito
INSERT INTO alumnos VALUES
  (1, 'Ana',   12, 9.5,  1,    TRUE,  '2014-03-02'),
  (2, 'Beto',  13, 8,    1,    FALSE, '2013-07-19'),
  (3, 'Carla', 12, NULL, 2,    TRUE,  '2014-01-30'),
  (4, 'Diego', 14, 7.5,  2,    FALSE, '2012-11-05'),
  (5, 'Elena', 13, NULL, 3,    NULL,  '2013-05-21'),
  (6, 'Fabio', 12, 6,    NULL, FALSE, '2014-09-14');
`;

function baseDeClase(): Base {
  const r = ejecutar(BASE_VACIA, ESQUEMA);
  if (!r.ok) throw new Error(`la base de las pruebas no se pudo crear:\n${textoDeError(r.error, ESQUEMA)}`);
  return r.base;
}

/** Ejecuta y devuelve el último resultado, o revienta con el error legible. */
function consulta(base: Base, sql: string): Resultado {
  const r = ejecutar(base, sql);
  if (!r.ok) throw new Error(`${sql}\n${textoDeError(r.error, sql)}`);
  return r.resultados[r.resultados.length - 1];
}

function falla(base: Base, sql: string): ErrorSQL {
  const r = ejecutar(base, sql);
  if (r.ok) throw new Error(`esto tenía que fallar y no falló: ${sql}`);
  return r.error;
}

const BASE = baseDeClase();

/* ── criterio 1 · veintidós consultas de clase ──────────────────────────────*/

interface Caso {
  sql: string;
  columnas: string[];
  filas: Valor[][];
}

const CONSULTAS: Caso[] = [
  {
    sql: 'SELECT * FROM grupos',
    columnas: ['id', 'nombre', 'turno'],
    filas: [
      [1, '1A', 'matutino'],
      [2, '1B', 'matutino'],
      [3, '2A', 'vespertino'],
    ],
  },
  {
    sql: 'SELECT nombre, edad FROM alumnos WHERE edad = 12',
    columnas: ['nombre', 'edad'],
    filas: [
      ['Ana', 12],
      ['Carla', 12],
      ['Fabio', 12],
    ],
  },
  {
    sql: 'SELECT nombre FROM alumnos WHERE edad > 12 ORDER BY nombre',
    columnas: ['nombre'],
    filas: [['Beto'], ['Diego'], ['Elena']],
  },
  {
    sql: 'SELECT nombre, nota FROM alumnos ORDER BY nota DESC LIMIT 2',
    columnas: ['nombre', 'nota'],
    filas: [
      ['Ana', 9.5],
      ['Beto', 8],
    ],
  },
  {
    sql: 'SELECT nombre FROM alumnos WHERE nota IS NULL',
    columnas: ['nombre'],
    filas: [['Carla'], ['Elena']],
  },
  {
    /* La trampa: `= NULL` no es cierto NUNCA, ni para las casillas vacías. */
    sql: 'SELECT nombre FROM alumnos WHERE nota = NULL',
    columnas: ['nombre'],
    filas: [],
  },
  {
    sql: "SELECT nombre FROM alumnos WHERE nombre LIKE 'C%'",
    columnas: ['nombre'],
    filas: [['Carla']],
  },
  {
    sql: 'SELECT nombre FROM alumnos WHERE beca = TRUE',
    columnas: ['nombre'],
    filas: [['Ana'], ['Carla']],
  },
  {
    /* Elena tiene 13 pero no tiene nota: «no se sabe» no pasa el filtro. */
    sql: 'SELECT nombre FROM alumnos WHERE edad >= 13 AND nota > 7',
    columnas: ['nombre'],
    filas: [['Beto'], ['Diego']],
  },
  {
    /* Y `NOT` sobre «no se sabe» sigue siendo «no se sabe»: Elena tampoco sale. */
    sql: 'SELECT nombre FROM alumnos WHERE NOT beca = TRUE',
    columnas: ['nombre'],
    filas: [['Beto'], ['Diego'], ['Fabio']],
  },
  {
    /* La unión pierde a Fabio, que no tiene grupo. Eso es la clase. */
    sql: 'SELECT a.nombre, g.nombre AS grupo FROM alumnos a JOIN grupos g ON a.grupo_id = g.id',
    columnas: ['nombre', 'grupo'],
    filas: [
      ['Ana', '1A'],
      ['Beto', '1A'],
      ['Carla', '1B'],
      ['Diego', '1B'],
      ['Elena', '2A'],
    ],
  },
  {
    /* El mismo ON escrito al revés tiene que dar exactamente lo mismo. */
    sql: 'SELECT a.nombre, g.nombre AS grupo FROM alumnos a JOIN grupos g ON g.id = a.grupo_id LIMIT 3',
    columnas: ['nombre', 'grupo'],
    filas: [
      ['Ana', '1A'],
      ['Beto', '1A'],
      ['Carla', '1B'],
    ],
  },
  {
    /* Un ON que no es una igualdad pelada: aquí el motor no puede usar el
     * índice y cae a los bucles anidados. Tiene que dar lo mismo. */
    sql: "SELECT a.nombre FROM alumnos a JOIN grupos g ON a.grupo_id = g.id AND g.turno = 'matutino'",
    columnas: ['nombre'],
    filas: [['Ana'], ['Beto'], ['Carla'], ['Diego']],
  },
  {
    /* Compañeros de grupo: la misma tabla dos veces. Fabio no tiene grupo, y
     * NULL no casa ni consigo mismo, así que no forma pareja con nadie: 4 + 4
     * + 1 = 9, no 10. */
    sql: 'SELECT COUNT(*) AS parejas FROM alumnos a JOIN alumnos b ON a.grupo_id = b.grupo_id',
    columnas: ['parejas'],
    filas: [[9]],
  },
  {
    sql: 'SELECT COUNT(*) AS filas, COUNT(nota) AS notas FROM alumnos',
    columnas: ['filas', 'notas'],
    filas: [[6, 4]],
  },
  {
    sql: 'SELECT AVG(nota) AS media FROM alumnos',
    columnas: ['media'],
    filas: [[7.75]],
  },
  {
    /* Sin ninguna fila: contar da 0 y sumar da NULL, que no es lo mismo. */
    sql: 'SELECT COUNT(*) AS cuantos, SUM(nota) AS suma FROM alumnos WHERE edad = 99',
    columnas: ['cuantos', 'suma'],
    filas: [[0, null]],
  },
  {
    sql: 'SELECT grupo_id, COUNT(*) AS n FROM alumnos GROUP BY grupo_id',
    columnas: ['grupo_id', 'n'],
    filas: [
      [1, 2],
      [2, 2],
      [3, 1],
      [null, 1],
    ],
  },
  {
    sql: 'SELECT grupo_id, AVG(nota) AS media FROM alumnos GROUP BY grupo_id HAVING COUNT(nota) > 1',
    columnas: ['grupo_id', 'media'],
    filas: [[1, 8.75]],
  },
  {
    sql:
      'SELECT g.nombre AS grupo, COUNT(*) AS cuantos FROM alumnos a JOIN grupos g ON a.grupo_id = g.id ' +
      'GROUP BY g.nombre ORDER BY cuantos DESC, grupo',
    columnas: ['grupo', 'cuantos'],
    filas: [
      ['1A', 2],
      ['1B', 2],
      ['2A', 1],
    ],
  },
  {
    sql: 'SELECT MIN(edad) AS menor, MAX(edad) AS mayor FROM alumnos',
    columnas: ['menor', 'mayor'],
    filas: [[12, 14]],
  },
  {
    sql: 'SELECT nombre, nota * 2 AS doble FROM alumnos WHERE nota IS NOT NULL ORDER BY doble DESC LIMIT 3',
    columnas: ['nombre', 'doble'],
    filas: [
      ['Ana', 19],
      ['Beto', 16],
      ['Diego', 15],
    ],
  },
  {
    sql: "SELECT nombre, nacimiento FROM alumnos WHERE nacimiento < '2013-06-01' ORDER BY nacimiento",
    columnas: ['nombre', 'nacimiento'],
    filas: [
      ['Diego', '2012-11-05'],
      ['Elena', '2013-05-21'],
    ],
  },
  {
    sql: 'SELECT nombre FROM alumnos ORDER BY edad, nombre LIMIT 3',
    columnas: ['nombre'],
    filas: [['Ana'], ['Carla'], ['Fabio']],
  },
  {
    sql: 'SELECT turno, COUNT(*) AS n FROM grupos GROUP BY turno',
    columnas: ['turno', 'n'],
    filas: [
      ['matutino', 2],
      ['vespertino', 1],
    ],
  },
];

describe('Tecnia Datos · criterio 1: que consulte de verdad', () => {
  it('las 25 consultas de clase dan exactamente lo que tienen que dar', () => {
    expect(CONSULTAS).toHaveLength(25);
    for (const c of CONSULTAS) {
      const r = consulta(BASE, c.sql);
      expect({ sql: c.sql, columnas: r.columnas.map((x) => x.nombre), filas: r.filas }).toEqual({
        sql: c.sql,
        columnas: c.columnas,
        filas: c.filas,
      });
      expect(r.filasAfectadas).toBe(c.filas.length);
    }
  });

  it('la columna del resultado se lleva su tipo puesto, y lo calculado no tiene', () => {
    const r = consulta(BASE, 'SELECT nombre, edad, nota * 2 AS doble FROM alumnos');
    expect(r.columnas).toEqual([
      { nombre: 'nombre', tipo: 'texto' },
      { nombre: 'edad', tipo: 'entero' },
      { nombre: 'doble', tipo: null },
    ]);
  });

  it('los nombres no distinguen mayúsculas, como en cualquier motor', () => {
    const r = consulta(BASE, 'select NOMBRE from Alumnos where Edad = 14');
    expect(r.filas).toEqual([['Diego']]);
  });
});

/* ── NULL, que es donde un motor miente si se descuida ──────────────────────*/

describe('Tecnia Datos · NULL es un valor, no un vacío ni un cero', () => {
  it('«= NULL» no devuelve nada y avisa de que se escribe IS NULL', () => {
    const r = consulta(BASE, 'SELECT nombre FROM alumnos WHERE nota = NULL');
    expect(r.filas).toEqual([]);
    expect(r.avisos.join(' ')).toContain('IS NULL');
    /* Y no es que la columna esté vacía: hay cuatro notas puestas. */
    expect(consulta(BASE, 'SELECT nombre FROM alumnos WHERE nota IS NOT NULL').filas).toHaveLength(4);
  });

  it('COUNT(*) cuenta filas y COUNT(columna) cuenta valores: no son lo mismo', () => {
    const r = consulta(BASE, 'SELECT COUNT(*) AS f, COUNT(nota) AS n, COUNT(beca) AS b FROM alumnos');
    expect(r.filas).toEqual([[6, 4, 5]]);
  });

  it('AVG divide entre las notas que hay, no entre las filas', () => {
    const media = consulta(BASE, 'SELECT AVG(nota) AS m FROM alumnos').filas[0][0];
    expect(media).toBe(7.75); // 31 / 4, no 31 / 6
    /* Si los NULL contaran como cero, la media sería 5.1666…, y toda la clase
     * de estadística de la actividad estaría enseñando un número falso. */
    expect(media).not.toBeCloseTo(31 / 6, 5);
  });

  it('SUM de un grupo sin valores da NULL, y COUNT del mismo grupo da 0', () => {
    const r = consulta(BASE, 'SELECT grupo_id, SUM(nota) AS s, COUNT(*) AS c FROM alumnos WHERE grupo_id = 3 GROUP BY grupo_id');
    expect(r.filas).toEqual([[3, null, 1]]);
  });

  it('la lógica es de tres valores: NULL AND FALSE es FALSE, NULL AND TRUE no', () => {
    /* Elena no tiene nota. Con `AND` de tres valores no sale por ningún lado. */
    expect(consulta(BASE, "SELECT nombre FROM alumnos WHERE nota > 7 OR nombre = 'Elena'").filas).toEqual([
      ['Ana'],
      ['Beto'],
      ['Diego'],
      ['Elena'],
    ]);
    expect(consulta(BASE, 'SELECT nombre FROM alumnos WHERE nota > 100 AND nota IS NULL').filas).toEqual([]);
    expect(consulta(BASE, 'SELECT nombre FROM alumnos WHERE NOT nota > 7').filas).toEqual([['Fabio']]);

    /* Estas dos son las que separan de verdad las tres tablas de la lógica,
     * porque un NOT delante obliga a distinguir «falso» de «no se sabe».
     *
     * Carla no tiene nota: «null AND falso» es FALSO —falso por un lado ya
     * basta, da igual lo que valga el otro— así que el NOT la deja pasar.
     * Elena tampoco tiene nota, pero su «null AND cierto» es NULL, y el NOT de
     * un NULL sigue siendo NULL: Elena NO pasa. Si el AND devolviera falso al
     * ver un NULL, Elena aparecería y la consulta estaría afirmando algo que
     * nadie sabe. */
    expect(consulta(BASE, 'SELECT nombre FROM alumnos WHERE NOT (nota > 7 AND edad > 12)').filas).toEqual([
      ['Ana'],
      ['Carla'],
      ['Fabio'],
    ]);
    expect(consulta(BASE, 'SELECT nombre FROM alumnos WHERE NOT (nota > 7 OR edad > 100)').filas).toEqual([['Fabio']]);
  });

  it('agrupar sí junta todos los NULL en un grupo, aunque NULL no sea igual a NULL', () => {
    const r = consulta(BASE, 'SELECT beca, COUNT(*) AS n FROM alumnos GROUP BY beca');
    expect(r.filas).toEqual([
      [true, 2],
      [false, 3],
      [null, 1],
    ]);
  });

  it('la unión pierde las filas que no casan, y las de clave NULL nunca casan', () => {
    const conGrupo = consulta(BASE, 'SELECT a.nombre FROM alumnos a JOIN grupos g ON a.grupo_id = g.id');
    expect(conGrupo.filas.map((f) => f[0])).not.toContain('Fabio');
    expect(conGrupo.filas).toHaveLength(5);
    /* Y el que se pierde se puede encontrar, que es la otra mitad de la clase. */
    expect(consulta(BASE, 'SELECT nombre FROM alumnos WHERE grupo_id IS NULL').filas).toEqual([['Fabio']]);
  });
});

/* ── el orden de evaluación, y el orden de las filas ────────────────────────*/

describe('Tecnia Datos · WHERE filtra antes de agrupar, y el orden es estable', () => {
  it('WHERE se aplica a las filas y HAVING a los grupos ya hechos', () => {
    const antes = consulta(BASE, 'SELECT grupo_id, COUNT(*) AS n FROM alumnos WHERE nota IS NOT NULL GROUP BY grupo_id');
    expect(antes.filas).toEqual([
      [1, 2],
      [2, 1],
      [null, 1],
    ]);
    const despues = consulta(BASE, 'SELECT grupo_id, COUNT(*) AS n FROM alumnos GROUP BY grupo_id HAVING COUNT(*) > 1');
    expect(despues.filas).toEqual([
      [1, 2],
      [2, 2],
    ]);
  });

  it('sin ORDER BY, dos ejecuciones dan lo mismo: el orden de inserción', () => {
    const a = consulta(BASE, 'SELECT id FROM alumnos');
    const b = consulta(BASE, 'SELECT id FROM alumnos');
    expect(a.filas).toEqual([[1], [2], [3], [4], [5], [6]]);
    expect(b.filas).toEqual(a.filas);
  });

  it('ORDER BY es estable: los empates salen en el orden en que estaban', () => {
    const r = consulta(BASE, 'SELECT nombre FROM alumnos ORDER BY edad');
    expect(r.filas).toEqual([['Ana'], ['Carla'], ['Fabio'], ['Beto'], ['Elena'], ['Diego']]);
  });
});

/* ── definir y cambiar los datos ────────────────────────────────────────────*/

describe('Tecnia Datos · CREATE, INSERT, UPDATE y DELETE', () => {
  it('el esquema queda descrito para el árbol de tablas del panel', () => {
    const esquema = esquemaDe(BASE);
    expect(esquema.map((t) => t.nombre)).toEqual(['grupos', 'alumnos']);
    expect(esquema[1].filas).toBe(6);
    expect(esquema[1].columnas[0]).toEqual({
      nombre: 'id',
      tipo: 'entero',
      clavePrimaria: true,
      noNulo: true, // una clave primaria nunca puede quedar vacía
      referencia: null,
    });
    expect(esquema[1].columnas[4].referencia).toEqual({ tabla: 'grupos', columna: 'id' });
  });

  it('la forma larga de la clave foránea vale igual que la corta', () => {
    const r = ejecutar(
      BASE,
      'CREATE TABLE notas (id INTEGER PRIMARY KEY, alumno_id INTEGER, FOREIGN KEY (alumno_id) REFERENCES alumnos(id))',
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(esquemaDe(r.base)[2].columnas[1].referencia).toEqual({ tabla: 'alumnos', columna: 'id' });
  });

  it('un INSERT y un UPDATE dejan la base nueva sin tocar la de antes', () => {
    const r = ejecutar(BASE, "INSERT INTO alumnos VALUES (7, 'Gina', 13, 10, 3, TRUE, '2013-02-02')");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.resultados[0].filasAfectadas).toBe(1);
    expect(consulta(r.base, 'SELECT COUNT(*) AS n FROM alumnos').filas).toEqual([[7]]);
    expect(consulta(BASE, 'SELECT COUNT(*) AS n FROM alumnos').filas).toEqual([[6]]); // la de antes, intacta

    const u = ejecutar(r.base, 'UPDATE alumnos SET nota = 9, edad = edad + 1 WHERE id = 7');
    expect(u.ok).toBe(true);
    if (!u.ok) return;
    expect(u.resultados[0].filasAfectadas).toBe(1);
    expect(consulta(u.base, 'SELECT nota, edad FROM alumnos WHERE id = 7').filas).toEqual([[9, 14]]);
  });

  it('un DELETE sin WHERE borra la tabla entera, avisa, y se puede deshacer', () => {
    const sesion = crearSesion(BASE);
    const r = correr(sesion, 'DELETE FROM alumnos');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.resultados[0].filasAfectadas).toBe(6);
    expect(r.resultados[0].avisos[0]).toContain('borra la tabla entera');
    expect(r.resultados[0].avisos[0]).toContain('La tabla sigue existiendo, vacía');
    expect(consulta(sesion.base, 'SELECT COUNT(*) AS n FROM alumnos').filas).toEqual([[0]]);

    expect(deshacer(sesion)).toBe(true);
    expect(consulta(sesion.base, 'SELECT COUNT(*) AS n FROM alumnos').filas).toEqual([[6]]);
    expect(rehacer(sesion)).toBe(true);
    expect(consulta(sesion.base, 'SELECT COUNT(*) AS n FROM alumnos').filas).toEqual([[0]]);
    expect(deshacer(sesion)).toBe(true);
    expect(deshacer(sesion)).toBe(false); // ya no hay más atrás
  });

  it('en un guion, lo que se ejecutó antes del error se queda hecho', () => {
    const guion = ["INSERT INTO grupos VALUES (4, '2B', 'vespertino');", 'SELECT * FROM grupitos;'].join('\n');
    const r = ejecutar(BASE, guion);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.linea).toBe(2);
    expect(consulta(r.base, 'SELECT COUNT(*) AS n FROM grupos').filas).toEqual([[4]]);
  });
});

/* ── criterio 2 · veinte consultas mal escritas ─────────────────────────────*/

interface CasoMalo {
  sql: string;
  clase: ErrorSQL['clase'];
  mensaje: string;
  pista?: string;
  linea?: number;
}

const ERRORES: CasoMalo[] = [
  {
    sql: 'SELECT * FROM alumnas',
    clase: 'tabla',
    mensaje: 'no existe ninguna tabla llamada «alumnas»',
    pista: '¿Querías decir «alumnos»?',
  },
  {
    sql: 'SELECT nombe FROM alumnos',
    clase: 'columna',
    mensaje: 'no existe ninguna columna llamada «nombe»',
    pista: 'las que hay son id, nombre, edad, nota, grupo_id, beca, nacimiento. ¿Querías decir «nombre»?',
  },
  {
    sql: 'SELECT nombre',
    clase: 'sintaxis',
    mensaje: 'falta decir de qué tabla salen los datos',
    pista: 'SELECT nombre FROM alumnos',
  },
  {
    sql: 'SELECT nombre, FROM alumnos',
    clase: 'sintaxis',
    mensaje: 'sobra una coma antes de FROM',
  },
  {
    sql: "SELECT nombre FROM alumnos WHERE nombre = 'Ana",
    clase: 'sintaxis',
    mensaje: 'falta cerrar la comilla',
  },
  {
    sql: 'SELECT nombre, COUNT(*) FROM alumnos GROUP BY edad',
    clase: 'agrupacion',
    mensaje: '«nombre» no está en el GROUP BY',
    pista: 'o añades «nombre» al GROUP BY, o la resumes',
  },
  {
    sql: "INSERT INTO alumnos VALUES (7, 'Gina', 'doce', 9, 1, TRUE, '2013-02-02')",
    clase: 'tipo',
    mensaje: '«edad» guarda números enteros y «\'doce\'» es texto',
    pista: 'los números se escriben sin comillas',
  },
  {
    sql: 'DELETE FROM grupos WHERE id = 1',
    clase: 'restriccion',
    mensaje: 'no se puede borrar la fila con id = 1: la está usando «alumnos»',
    pista: '2 filas de «alumnos» apuntan ahí con «grupo_id»',
  },
  {
    sql: 'SELECT nombre FROM alumnos WHERE COUNT(*) > 2',
    clase: 'agrupacion',
    mensaje: 'un resumen no puede ir en el WHERE',
    pista: 'HAVING',
  },
  {
    sql: 'SELECT DISTINCT edad FROM alumnos',
    clase: 'sintaxis',
    mensaje: 'aquí no se puede usar «DISTINCT»',
    pista: 'GROUP BY ciudad',
  },
  {
    sql: 'SELECT nombre apellido FROM alumnos',
    clase: 'sintaxis',
    mensaje: 'falta una coma entre «nombre» y «apellido»',
    pista: 'escribe AS',
  },
  {
    sql: "SELECT * FROM alumnos WHERE edad > 'doce'",
    clase: 'tipo',
    mensaje: '«edad» guarda números enteros y «\'doce\'» es texto',
  },
  {
    sql: "INSERT INTO alumnos VALUES (1, 'Gina', 13, 9, 1, TRUE, '2013-02-02')",
    clase: 'restriccion',
    mensaje: 'ya hay una fila con id = 1',
    pista: 'no se puede repetir',
  },
  {
    sql: "INSERT INTO alumnos VALUES (7, 'Gina', 13, 9, 9, TRUE, '2013-02-02')",
    clase: 'restriccion',
    mensaje: '«grupo_id» = 9 no existe en «grupos»',
    pista: 'en «grupos.id» hay: 1, 2, 3',
  },
  {
    sql: 'SELECT a.nombre FROM alumnos a JOIN grupos g ON a.nombre = g.id',
    clase: 'tipo',
    mensaje: '«nombre» guarda texto y «id» guarda números enteros',
  },
  {
    sql: 'SELECT nombre FROM alumnos, grupos',
    clase: 'sintaxis',
    mensaje: 'aquí dos tablas no se juntan con una coma',
    pista: 'JOIN grupos ON',
  },
  {
    sql: 'SELECT * FROM alumnos WHERE edad IN (12, 13)',
    clase: 'sintaxis',
    mensaje: 'aquí no se puede usar «IN»',
    pista: 'edad = 12 OR edad = 13',
  },
  {
    sql: 'UPDATE alumnos SET nota = nota / 0',
    clase: 'valor',
    mensaje: 'no se puede dividir entre cero',
  },
  {
    sql: 'SELECT "Ana" FROM alumnos',
    clase: 'sintaxis',
    mensaje: 'en SQL las comillas dobles no son texto',
    pista: "un texto va entre comillas simples: 'Ana'",
  },
  {
    sql: 'CREATE TABLE cursos (id INTEGER PRIMARY KEY, nombre VARCHAR(30))',
    clase: 'sintaxis',
    mensaje: 'aquí no se puede usar «VARCHAR»',
    pista: 'el texto aquí se llama TEXT',
  },
];

describe('Tecnia Datos · criterio 2: que los errores enseñen', () => {
  it('las 20 consultas mal escritas dicen qué pasa, dónde y qué suele causarlo', () => {
    expect(ERRORES).toHaveLength(20);
    for (const c of ERRORES) {
      const e = falla(BASE, c.sql);
      expect({ sql: c.sql, clase: e.clase }).toEqual({ sql: c.sql, clase: c.clase });
      expect(`${c.sql} → ${e.mensaje}`).toContain(c.mensaje);
      if (c.pista) expect(`${c.sql} → ${e.pista}`).toContain(c.pista);
      /* Las cuatro cosas obligatorias de `errores.ts`, en todos: */
      expect(e.linea).toBeGreaterThan(0);
      expect(e.columna).not.toBeNull();
      expect(e.pista).not.toBeNull();
      expect(e.familia.length).toBeGreaterThan(0);
    }
  });

  it('el error se lee entero, con la línea, el dedo, la pista y el nombre de verdad', () => {
    const sql = ['SELECT nombre, edad', 'FROM alumnas', 'WHERE edad > 12'].join('\n');
    const e = falla(BASE, sql);
    expect(textoDeError(e, sql)).toBe(
      [
        'Línea 2 · no existe ninguna tabla llamada «alumnas»',
        '    FROM alumnas',
        '         ^',
        '    Pista: en esta base hay 2: grupos, alumnos. ¿Querías decir «alumnos»?',
        '    (un motor de verdad dice aquí: no such table: alumnas)',
      ].join('\n'),
    );
  });

  it('las otras maneras de escribir mal un dato también se explican', () => {
    const fecha = falla(BASE, "INSERT INTO alumnos VALUES (7, 'Gina', 13, 9, 1, TRUE, '03/05/2013')");
    expect(fecha.mensaje).toContain('no es una fecha');
    expect(fecha.pista).toContain('año-mes-día');

    const decimal = falla(BASE, "INSERT INTO alumnos VALUES (7, 'Gina', 12.5, 9, 1, TRUE, '2013-02-02')");
    expect(decimal.mensaje).toContain('tiene decimales');
    expect(decimal.pista).toContain('REAL');

    const vacia = falla(BASE, "INSERT INTO alumnos VALUES (7, NULL, 13, 9, 1, TRUE, '2013-02-02')");
    expect(vacia.mensaje).toContain('«nombre» no puede quedar vacía');

    const cuantos = falla(BASE, "INSERT INTO alumnos VALUES (7, 'Gina')");
    expect(cuantos.mensaje).toContain('tiene 7 columnas y has dado 2 valores');

    const subconsulta = falla(BASE, 'SELECT nombre FROM alumnos WHERE edad > (SELECT AVG(edad) FROM alumnos)');
    expect(subconsulta.mensaje).toContain('no se pueden meter consultas dentro de otras');

    const booleana = falla(BASE, 'SELECT nombre FROM alumnos WHERE beca = 1');
    expect(booleana.pista).toContain('beca = TRUE');
  });
});

/* ── criterio 3 · que aguante ───────────────────────────────────────────────*/

describe('Tecnia Datos · criterio 3: diez mil filas', () => {
  it('un JOIN con GROUP BY sobre 10 000 filas baja de 50 ms', () => {
    const filas: string[] = [];
    for (let i = 1; i <= 10_000; i += 1) {
      filas.push(`(${i}, 'Alumno ${i}', ${12 + (i % 5)}, ${(i % 10) + 1}, ${(i % 50) + 1}, TRUE, '2014-01-01')`);
    }
    const grupos: string[] = [];
    for (let g = 1; g <= 50; g += 1) grupos.push(`(${g}, 'G${g}', 'matutino')`);

    const semilla = ejecutar(
      BASE,
      `DELETE FROM alumnos; DELETE FROM grupos; INSERT INTO grupos VALUES ${grupos.join(',')}; ` +
        `INSERT INTO alumnos VALUES ${filas.join(',')};`,
    );
    expect(semilla.ok).toBe(true);
    if (!semilla.ok) return;
    const grande = semilla.base;
    expect(consulta(grande, 'SELECT COUNT(*) AS n FROM alumnos').filas).toEqual([[10_000]]);

    const sql =
      'SELECT g.nombre AS grupo, COUNT(*) AS cuantos, AVG(a.nota) AS media ' +
      'FROM alumnos a JOIN grupos g ON a.grupo_id = g.id GROUP BY g.nombre ORDER BY cuantos DESC, grupo';

    const tanda = (): number => {
      const t0 = performance.now();
      const r = ejecutar(grande, sql);
      const ms = performance.now() - t0;
      if (!r.ok) throw new Error(textoDeError(r.error, sql));
      expect(r.resultados[0].filas).toHaveLength(50);
      return ms;
    };

    tanda(); // calentar
    const medidas = Array.from({ length: 7 }, tanda).sort((a, b) => a - b);
    const mejor = medidas[0];
    // eslint-disable-next-line no-console
    console.log(
      `[criterio 3] 10 000 filas · JOIN + GROUP BY → mejor de 7: ${mejor.toFixed(2)} ms ` +
        `(${medidas.map((x) => x.toFixed(1)).join(' · ')})`,
    );
    expect(mejor).toBeLessThan(50);
  });
});

/* ── la fila 89 del canon: el resultado se va a la hoja ─────────────────────*/

describe('Tecnia Datos · lo que se lleva a otra ventana', () => {
  it('aMatriz da encabezados y valores crudos, no texto', () => {
    const r = consulta(BASE, 'SELECT g.nombre AS grupo, COUNT(*) AS cuantos FROM alumnos a JOIN grupos g ON a.grupo_id = g.id GROUP BY g.nombre');
    expect(aMatriz(r)).toEqual([
      ['grupo', 'cuantos'],
      ['1A', 2],
      ['1B', 2],
      ['2A', 1],
    ]);
    /* Un número tiene que llegar a la hoja como número o no se puede sumar. */
    expect(typeof aMatriz(r)[1][1]).toBe('number');
  });
});
