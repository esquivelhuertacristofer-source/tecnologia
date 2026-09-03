/**
 * TECNIA DATOS · el banco de pruebas del armazón (`VentanaDatos`).
 *
 * El motor de SQL ya tiene sus 23 pruebas propias (`motor-datos.test.ts`) y
 * no se repiten aquí. Esto prueba el ARMAZÓN: el coloreado, y la ventana
 * montada de verdad — y se prueba **jugando mal**, que es la mitad del
 * banco: ejecutar con el editor vacío, ejecutar dos veces seguidas la misma
 * instrucción, una consulta con error de sintaxis, una que no encuentra
 * ninguna fila (que no es lo mismo que un error), una que trae más de cien,
 * una tabla sin columnas, y una fila con un `NULL` en cada celda.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { BASE_VACIA, ejecutar, textoDeError, type Base } from '@/components/simuladores/datos';
import {
  colorearSQL,
  useDatos,
  VentanaDatos,
  type GuionDatos,
  type OpcionesDatos,
} from '@/components/simuladores/datos/ventana';

/* ── la base de las pruebas ───────────────────────────────────────────────── */

const FILAS_NUMEROS = Array.from({ length: 150 }, (_, i) => `(${i + 1})`).join(', ');

const ESQUEMA = `
CREATE TABLE grupos (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL
);
CREATE TABLE alumnos (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL,
  nota REAL,
  grupo_id INTEGER REFERENCES grupos(id)
);
INSERT INTO grupos VALUES (1, '1A');
INSERT INTO alumnos VALUES
  (1, 'Ana', 9.5, 1),
  (2, 'Beto', 8, 1),
  (3, 'Caro', NULL, NULL);
CREATE TABLE numeros (n INTEGER PRIMARY KEY);
INSERT INTO numeros VALUES ${FILAS_NUMEROS};
`;

function baseDeClase(): Base {
  const r = ejecutar(BASE_VACIA, ESQUEMA);
  if (!r.ok) throw new Error(`la base de las pruebas no se pudo crear:\n${textoDeError(r.error, ESQUEMA)}`);
  return r.base;
}

const BASE = baseDeClase();

/* ── el banco ─────────────────────────────────────────────────────────────── */

function Banco(props: OpcionesDatos & { archivo?: string; esquema?: boolean }) {
  const dat = useDatos(props);
  return <VentanaDatos datos={dat} archivo={props.archivo ?? 'consulta.sql'} esquema={props.esquema} />;
}

function montar(props: OpcionesDatos & { archivo?: string; esquema?: boolean }) {
  render(<Banco {...props} />);
  return {
    area: () => screen.getByTestId('cod-area') as HTMLTextAreaElement,
    escribir: (texto: string) => fireEvent.change(screen.getByTestId('cod-area'), { target: { value: texto } }),
    ejecutar: () => fireEvent.click(screen.getByTestId('dat-ejecutar')),
    deshacer: () => fireEvent.click(screen.getByTestId('dat-deshacer')),
    rehacer: () => fireEvent.click(screen.getByTestId('dat-rehacer')),
    reiniciar: () => fireEvent.click(screen.getByTestId('dat-reiniciar')),
  };
}

/* ── el coloreado, que es una función pura del texto ─────────────────────── */

describe('colorearSQL', () => {
  it('la suma de los tramos es la línea original, carácter por carácter, y cada familia sale de su color', () => {
    const TRAMPOSA = [
      '-- un comentario de verdad',
      "SELECT nombre, COUNT(*) AS total  -- cuenta alumnos",
      'FROM alumnos',
      "WHERE nombre = 'D''Angelo'",
      'GROUP BY nombre;',
      'CREATE TABLE t (x INTEGER);',
      'SELECT DISTINCT nombre FROM alumnos;',
      'SELECT edad + 1 FROM alumnos WHERE edad > 12;',
    ].join('\n');

    const lineas = colorearSQL(TRAMPOSA);
    const original = TRAMPOSA.split('\n');
    expect(lineas).toHaveLength(original.length);
    lineas.forEach((linea, i) => {
      expect(linea.tramos.map((t) => t.texto).join('')).toBe(original[i]);
    });

    const tramosDe = (n: number) => lineas[n - 1].tramos;
    const colorDe = (n: number, texto: string) => tramosDe(n).find((t) => t.texto === texto)?.color;

    expect(colorDe(2, 'SELECT')).toBe('palabra');
    expect(colorDe(2, 'FROM')).toBe(undefined); // FROM está en la línea 3, no en la 2
    expect(colorDe(3, 'FROM')).toBe('palabra');
    expect(colorDe(2, 'COUNT')).toBe('nativa');
    expect(colorDe(6, 'INTEGER')).toBe('nativa');
    expect(colorDe(7, 'DISTINCT')).toBe('prohibida');
    expect(colorDe(8, '+')).toBe('operador');
    expect(colorDe(8, '>')).toBe('operador');
    expect(colorDe(8, '12')).toBe('numero');

    // El comentario: desde el `--` hasta el final de la línea, ni un carácter antes.
    const comentario = tramosDe(2).find((t) => t.color === 'comentario');
    expect(comentario?.texto).toBe('-- cuenta alumnos');

    // El texto con la comilla duplicada dentro: la ficha viene decodificada
    // (`D'Angelo`), pero el tramo pintado tiene que ser el trozo CRUDO de la
    // línea, comillas y comilla duplicada incluidas — si no, el editor se
    // desalinea (ver la cabecera de `coloreadoSQL.ts`).
    const cruda4 = original[3];
    const cadenaCruda = /'.*'/.exec(cruda4)![0];
    const cadena = tramosDe(4).find((t) => t.color === 'cadena');
    expect(cadena?.texto).toBe(cadenaCruda);
  });

  it('una comilla sin cerrar (a medio escribir) no pierde ni un carácter, aunque pierda el color', () => {
    expect(colorearSQL('')).toHaveLength(1);
    const A_MEDIAS = "SELECT nombre FROM alumnos WHERE nombre = 'An";
    const lineas = colorearSQL(A_MEDIAS);
    expect(lineas).toHaveLength(1);
    expect(lineas[0].tramos.map((t) => t.texto).join('')).toBe(A_MEDIAS);
  });
});

/* ── la ventana montada ───────────────────────────────────────────────────── */

describe('VentanaDatos', () => {
  it('el esquema se ve ANTES de ejecutar nada: tabla, clave primaria, NOT NULL y la flecha de la clave foránea', () => {
    montar({ plantilla: '', baseInicial: BASE });
    const esquema = screen.getByTestId('dat-esquema');
    expect(esquema.textContent).toContain('alumnos');
    expect(esquema.textContent).toContain('grupos');
    expect(esquema.querySelector('[data-columna="id"]')?.textContent).toContain('🔑');
    expect(esquema.textContent).toContain('NOT NULL');
    expect(esquema.textContent).toContain('→ grupos.id');
  });

  it('una tabla sin columnas en el esquema no revienta la ventana', () => {
    const conVacia: Base = { tablas: [...BASE.tablas, { nombre: 'vacia', columnas: [], filas: [] }] };
    montar({ plantilla: '', baseInicial: conVacia });
    const esquema = screen.getByTestId('dat-esquema');
    expect(esquema.textContent).toContain('vacia');
    expect(esquema.textContent).toContain('(sin columnas)');
  });

  it('ejecutar un SELECT válido pinta la rejilla, con sus encabezados y cuántas filas salieron', () => {
    const m = montar({ plantilla: 'SELECT nombre, nota FROM alumnos ORDER BY nombre;', baseInicial: BASE });
    m.ejecutar();
    const tabla = screen.getByTestId('dat-tabla');
    expect(tabla.querySelectorAll('th')).toHaveLength(2);
    expect(tabla.textContent).toContain('nombre');
    expect(screen.getByTestId('dat-tabla-pie').textContent).toBe('3 filas.');
  });

  it('un NULL en cada celda de la fila se pinta «NULL», nunca una celda vacía', () => {
    const m = montar({ plantilla: "SELECT nota, grupo_id FROM alumnos WHERE nombre = 'Caro';", baseInicial: BASE });
    m.ejecutar();
    const celdas = Array.from(screen.getByTestId('dat-tabla').querySelectorAll('td'));
    expect(celdas).toHaveLength(2);
    for (const celda of celdas) {
      expect(celda.textContent).toBe('NULL');
      expect(celda.className).toContain('es-null');
    }
  });

  it('una consulta que no encuentra ninguna fila lo dice, y no es lo mismo que un error', () => {
    const m = montar({ plantilla: "SELECT * FROM alumnos WHERE nombre = 'Nadie';", baseInicial: BASE });
    m.ejecutar();
    expect(screen.getByTestId('dat-tabla-cero').textContent).toBe('Esta consulta no encontró ninguna fila.');
    expect(screen.queryByTestId('dat-error')).toBeNull();
  });

  it('una consulta con error de sintaxis se enseña con línea, el dedo, la pista y la familia — y desaparece en cuanto se edita', () => {
    const m = montar({ plantilla: 'SELECT * FORM alumnos;', baseInicial: BASE });
    m.ejecutar();
    const error = screen.getByTestId('dat-error');
    expect(error.textContent).toContain('Línea 1');
    expect(error.querySelector('.dat-error-dedo')).not.toBeNull();
    expect(error.textContent).toMatch(/Pista/);
    expect(error.textContent).toMatch(/syntax error/);

    fireEvent.click(screen.getByTestId('dat-error-linea'));
    expect(document.activeElement).toBe(m.area());

    // Tocar el texto: el error deja de retratar lo escrito y se retira.
    m.escribir('SELECT * FROM alumnos;');
    expect(screen.queryByTestId('dat-error')).toBeNull();
  });

  it('ejecutar con el editor vacío avisa y no revienta, sin dejar ninguna tarjeta', () => {
    montar({ plantilla: '', baseInicial: BASE });
    fireEvent.click(screen.getByTestId('dat-ejecutar'));
    expect(screen.getByTestId('dat-aviso').textContent).toMatch(/Escribe una consulta/);
    expect(screen.queryByTestId('dat-tarjeta')).toBeNull();
  });

  it('ejecutar dos veces seguidas la misma CREATE TABLE: la primera crea, la segunda avisa que ya existe', () => {
    const m = montar({ plantilla: 'CREATE TABLE nueva (id INTEGER PRIMARY KEY);', baseInicial: BASE });
    m.ejecutar();
    expect(screen.queryByTestId('dat-error')).toBeNull();
    expect(screen.getByTestId('dat-tarjeta').textContent).toContain('creada');

    m.ejecutar();
    expect(screen.getByTestId('dat-error').textContent).toContain('ya existe');
  });

  it('un guion de varias instrucciones enseña una tarjeta por instrucción, en orden', () => {
    const m = montar({
      plantilla: "CREATE TABLE t (id INTEGER PRIMARY KEY);\nINSERT INTO t VALUES (1);\nINSERT INTO t VALUES (2);\nSELECT * FROM t;",
      baseInicial: BASE_VACIA,
    });
    m.ejecutar();
    const tarjetas = screen.getAllByTestId('dat-tarjeta');
    expect(tarjetas).toHaveLength(4);
    expect(tarjetas[0].textContent).toContain('Instrucción 1 de 4');
    expect(tarjetas[3].textContent).toContain('Instrucción 4 de 4');
  });

  it('una consulta con más de cien filas se recorta a cien, y el pie lo dice sin esconderlo', () => {
    const m = montar({ plantilla: 'SELECT n FROM numeros;', baseInicial: BASE });
    m.ejecutar();
    const filas = screen.getByTestId('dat-tabla').querySelectorAll('tbody tr');
    expect(filas).toHaveLength(100);
    expect(screen.getByTestId('dat-tabla-pie').textContent).toBe('Se muestran las primeras 100 de 150 filas.');
  });

  it('un DELETE sin WHERE avisa, se puede deshacer y volver a rehacer', () => {
    const m = montar({ plantilla: 'DELETE FROM alumnos;', baseInicial: BASE });
    expect(screen.getByTestId('dat-deshacer')).toBeDisabled();

    m.ejecutar();
    expect(screen.getByTestId('dat-avisos').textContent).toMatch(/DELETE sin WHERE/);
    expect(screen.getByTestId('dat-esquema').querySelector('[data-tabla="alumnos"]')?.textContent).toContain('0 fila');
    expect(screen.getByTestId('dat-deshacer')).not.toBeDisabled();
    expect(screen.getByTestId('dat-rehacer')).toBeDisabled();

    m.deshacer();
    expect(screen.getByTestId('dat-esquema').querySelector('[data-tabla="alumnos"]')?.textContent).toContain('3 fila');
    expect(screen.getByTestId('dat-deshacer')).toBeDisabled();
    expect(screen.getByTestId('dat-rehacer')).not.toBeDisabled();

    m.rehacer();
    expect(screen.getByTestId('dat-esquema').querySelector('[data-tabla="alumnos"]')?.textContent).toContain('0 fila');
  });

  it('soloLectura "todo": escribir no cambia el texto, y avisa con candado', () => {
    const m = montar({ plantilla: 'SELECT * FROM alumnos;', baseInicial: BASE, soloLectura: 'todo' });
    m.escribir('borrado');
    expect(m.area().value).toBe('SELECT * FROM alumnos;');
    expect(screen.getByTestId('dat-aviso').textContent).toMatch(/no cambiarla/);
  });

  it('soloLectura de líneas concretas: la línea bloqueada rechaza el cambio, otra línea sí admite escritura', () => {
    const m = montar({
      plantilla: 'SELECT *\nFROM alumnos;',
      baseInicial: BASE,
      soloLectura: [1],
    });
    m.escribir('cambiado\nFROM alumnos;');
    expect(m.area().value).toBe('SELECT *\nFROM alumnos;');
    expect(screen.getByTestId('dat-aviso').textContent).toMatch(/candado/);

    m.escribir('SELECT *\nFROM grupos;');
    expect(m.area().value).toBe('SELECT *\nFROM grupos;');
  });

  it('editar el texto después de ejecutar deja el resultado sin vigencia, pero no lo borra', () => {
    const m = montar({ plantilla: 'SELECT * FROM grupos;', baseInicial: BASE });
    m.ejecutar();
    expect(screen.getByTestId('dat-tarjeta')).toBeTruthy();
    expect(screen.queryByTestId('dat-resultados-viejo')).toBeNull();

    m.escribir('SELECT * FROM grupos; -- cambiado');
    expect(screen.getByTestId('dat-resultados-viejo')).toBeTruthy();
    expect(screen.getByTestId('dat-tarjeta')).toBeTruthy();
  });

  it('reiniciar vuelve al texto de la plantilla y a la base inicial, sin nada que deshacer', () => {
    /* «grupos» no sirve para este montaje: «alumnos» la referencia por
     * clave foránea y borrarla fallaría (con razón). Se usa «alumnos», que
     * no tiene hijas. */
    const m = montar({ plantilla: 'SELECT * FROM alumnos;', baseInicial: BASE });
    m.escribir('DELETE FROM alumnos;');
    m.ejecutar();
    expect(screen.getByTestId('dat-esquema').querySelector('[data-tabla="alumnos"]')?.textContent).toContain('0 fila');

    m.reiniciar();
    expect(m.area().value).toBe('SELECT * FROM alumnos;');
    expect(screen.getByTestId('dat-esquema').querySelector('[data-tabla="alumnos"]')?.textContent).toContain('3 fila');
    expect(screen.getByTestId('dat-deshacer')).toBeDisabled();
  });

  it('un encargo de tipo «ejecucion» se marca hecho solo, al ejecutar la consulta correcta', () => {
    const onAvance = jest.fn();
    const onTerminado = jest.fn();
    const guion: GuionDatos = {
      pasos: [
        {
          id: 'cuenta-grupos',
          titulo: 'Cuenta los grupos',
          instruccion: 'Escribe un SELECT que traiga todos los grupos.',
          pista: 'SELECT * FROM grupos;',
          logro: { tipo: 'ejecucion', comprueba: (e) => e.ok && (e.resultados.at(-1)?.filas.length ?? 0) === 1 },
          aprendido: 'Ya sabes consultar una tabla entera.',
        },
      ],
    };
    const m = montar({ plantilla: '', baseInicial: BASE, guion, onAvance, onTerminado });
    m.escribir('SELECT * FROM grupos;');
    m.ejecutar();
    expect(screen.getByTestId('dat-logrado').textContent).toContain('Ya sabes consultar una tabla entera.');
    expect(onAvance).toHaveBeenCalledWith(1);
    expect(onTerminado).toHaveBeenCalledWith(expect.objectContaining({ encargos: 1, hechos: 1 }));
  });
});
