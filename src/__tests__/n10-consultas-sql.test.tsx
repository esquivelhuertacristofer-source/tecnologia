/**
 * N10 · «Consultas SQL» — los siete problemas del club, jugados enteros.
 *
 * Jugando MAL antes que bien (`jugar-mal-a-proposito`): enviar el archivo vacío,
 * enviar la consulta **sin `ORDER BY`** —que es exactamente el atajo que esta
 * clase regalaba el 2-sep-2026—, comparar un NULL con un igual, filtrar por el
 * número de equipo en el problema 7, pedir las tres pistas. Y después el
 * recorrido completo hasta la insignia.
 *
 * Lo que esta prueba vigila y ninguna otra puede:
 *
 * - **Que el primer encargo ya no diga la consulta.** La instrucción de la
 *   versión anterior ERA `SELECT nombre, grado FROM integrantes ORDER BY
 *   nombre;`, y su pista la repetía. Si alguien vuelve a meter SQL en un
 *   enunciado, esto cae.
 * - **Que ningún dato de las dos siembras ocultas se pinte en la pantalla.** El
 *   tachado está probado sobre el objeto en `juez-sql-y-consultas.test.ts`; aquí
 *   se comprueba sobre el DOM, que es lo que un alumno con las herramientas de
 *   desarrollo abiertas podría leer.
 * - **Que el encargo se cierra con el veredicto del juez y no con el texto.**
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { LabConsultasSql } from '@/components/activities/datos/LabConsultasSql';
import { S1, S2, S3, S4, S5, S6, S7 } from '@/components/activities/datos/problemasSql';
import { limpiarRegistro } from '@/components/simuladores/juez';

/* ── las consultas de referencia ────────────────────────────────────────────*/

const SOL: Readonly<Record<string, string>> = {
  [S1.id]: 'SELECT nombre, grado FROM integrantes ORDER BY nombre;',
  [S2.id]: 'SELECT nombre FROM integrantes WHERE grado = 3 ORDER BY nombre DESC;',
  [S3.id]: "SELECT nombre FROM integrantes WHERE nombre LIKE 'A%';",
  [S4.id]: 'SELECT nombre, grado FROM integrantes ORDER BY grado DESC, nombre LIMIT 3;',
  [S5.id]:
    'SELECT integrantes.nombre, equipos.nombre AS equipo FROM integrantes JOIN equipos ON integrantes.equipo_id = equipos.id;',
  [S6.id]: 'SELECT nombre FROM integrantes WHERE equipo_id IS NULL;',
  [S7.id]:
    "SELECT integrantes.nombre FROM integrantes JOIN equipos ON integrantes.equipo_id = equipos.id WHERE equipos.nombre = 'Los Circuitos';",
};

/**
 * Nombres y equipos que SÓLO existen en las dos siembras ocultas. Ninguno puede
 * aparecer en la pantalla. «Voltio» y «Los Circuitos» no están en la lista a
 * propósito: el primero también está en la siembra visible y el segundo sale en
 * el enunciado del problema 7.
 */
const SOLO_EN_LAS_OCULTAS = [
  'Lucía Ponce',
  'Aarón Medina',
  'Tomás Guerra',
  'Beatriz Lara',
  'Alma Rendon',
  'Néstor Calvo',
  'Carmen Ibarra',
  'Óscar Pineda',
  'Rubén Solís',
  'Adela Mota',
  'Pablo Ceja',
  'Iván Duarte',
  'Sofía Bravo',
  'Tinta y Bit',
  'Motor Uno',
];

/* ── el mando ───────────────────────────────────────────────────────────────*/

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  render(<LabConsultasSql config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />);

  const api = {
    onProgress,
    onScore,
    onComplete,
    entrar: () => {
      fireEvent.click(screen.getByTestId('sql-empezar'));
      return api;
    },
    escribir: (sql: string) => fireEvent.change(screen.getByTestId('cod-area'), { target: { value: sql } }),
    ejecutar: () => fireEvent.click(screen.getByTestId('dat-ejecutar')),
    enviar: () => fireEvent.click(screen.getByTestId('jz-enviar')),
    aceptado: () => screen.getByTestId('jz-veredicto').getAttribute('data-aceptado'),
    encargo: () => screen.getByTestId('dat-encargo').getAttribute('data-paso'),
    siguiente: () => fireEvent.click(screen.getByText('Siguiente encargo →')),
    solapa: (id: string) => screen.getByTestId(`jz-solapa-${id}`).getAttribute('data-estado'),
    pista: () => fireEvent.click(screen.getByTestId('jz-pista')),
    /** Resolver un problema y pasar al siguiente encargo. */
    resolver: (id: string) => {
      api.escribir(SOL[id]);
      api.enviar();
      expect(api.aceptado()).toBe('si');
      expect(api.solapa(id)).toBe('aceptado');
      api.siguiente();
      return api;
    },
  };
  return api;
}

beforeEach(() => limpiarRegistro());

/* ── la portada ─────────────────────────────────────────────────────────────*/

describe('antes de entrar', () => {
  it('la portada dice de qué va, y ni el editor ni el juez están detrás', () => {
    montar();
    expect(screen.getByText(/datos que no has visto/i)).toBeInTheDocument();
    expect(screen.getByText(/Consultora de datos/)).toBeInTheDocument();
    expect(screen.queryByTestId('cod-area')).toBeNull();
    expect(screen.queryByTestId('jz-panel')).toBeNull();
  });

  it('el primer encargo es el primer problema, y NINGÚN enunciado lleva la consulta', () => {
    const lab = montar().entrar();
    expect(lab.encargo()).toBe(S1.id);
    const encargo = screen.getByTestId('dat-encargo').textContent ?? '';
    /* La versión anterior ponía aquí, literalmente, la respuesta. */
    expect(encargo).not.toMatch(/SELECT|ORDER BY|FROM integrantes/i);
  });

  it('la base del editor es la del club, sin alfabetizar', () => {
    const lab = montar().entrar();
    const esquema = screen.getByTestId('dat-esquema').textContent ?? '';
    expect(esquema).toMatch(/integrantes/);
    expect(esquema).toMatch(/equipos/);
    expect(esquema).toMatch(/sesiones/);
    /* Y el ejemplo del juez es de esa misma base: Ana Torres está, y ninguna
     * de las dos siembras ocultas se asoma. */
    const panel = screen.getByTestId('jz-panel').textContent ?? '';
    expect(panel).toMatch(/Ana Torres/);
    for (const n of SOLO_EN_LAS_OCULTAS) expect(panel).not.toMatch(n);
    void lab;
  });
});

/* ── jugando mal ────────────────────────────────────────────────────────────*/

describe('jugando mal', () => {
  it('enviar el archivo vacío no aprueba y el encargo no se mueve', () => {
    const lab = montar().entrar();
    lab.enviar();
    expect(lab.aceptado()).toBe('no');
    expect(lab.encargo()).toBe(S1.id);
  });

  it('SIN «ORDER BY» el problema 1 se RECHAZA — es el atajo que la clase regalaba', () => {
    const lab = montar().entrar();
    lab.escribir('SELECT nombre, grado FROM integrantes;');
    lab.enviar();
    expect(lab.aceptado()).toBe('no');
    expect(lab.encargo()).toBe(S1.id);
    /* Y el veredicto dice en qué fila se fue: no «mal», sino qué esperaba. */
    expect(screen.getByTestId('jz-veredicto').textContent).toMatch(/fila 1|línea 1|Ana Torres/);
  });

  it('pedir la tabla entera tampoco: el contrato son dos columnas', () => {
    const lab = montar().entrar();
    lab.escribir('SELECT * FROM integrantes ORDER BY nombre;');
    lab.enviar();
    expect(lab.aceptado()).toBe('no');
    expect(screen.getByTestId('jz-veredicto').textContent).toMatch(/columnas/i);
  });

  it('el cotejo se acota a ocho líneas y dice cuántas quedan', () => {
    /* Doce filas contra doce daban un veredicto de 911 px en una columna de
     * 544 (medido en Chromium el 12-sep-2026). Lo que explica el fallo es la
     * `explicacion`, que va encima; el cotejo es contexto. */
    const lab = montar().entrar();
    lab.escribir('SELECT nombre, grado FROM integrantes ORDER BY grado;');
    lab.enviar();
    const visible = screen.getByTestId('jz-veredicto').querySelector('[data-oculto="no"]');
    const columnas = Array.from(visible?.querySelectorAll('.jz-caso-cotejo > span') ?? []);
    expect(columnas).toHaveLength(2);
    for (const c of columnas) {
      expect(c.querySelectorAll('code').length).toBeLessThanOrEqual(8);
      expect(c.querySelector('.jz-cotejo-mas')?.textContent).toBe('y 4 más');
    }
  });

  it('los datos de un caso oculto NO se pintan en la pantalla', () => {
    const lab = montar().entrar();
    lab.escribir('SELECT nombre, grado FROM integrantes;');
    lab.enviar();
    const tablero = screen.getByTestId('jz-veredicto');
    const ocultos = Array.from(tablero.querySelectorAll('[data-oculto="si"]'));
    expect(ocultos.length).toBeGreaterThan(0);
    for (const li of ocultos) expect(li.querySelector('.jz-caso-cotejo')).toBeNull();
    const panel = screen.getByTestId('jz-panel').textContent ?? '';
    for (const n of SOLO_EN_LAS_OCULTAS) expect(panel).not.toMatch(n);
  });

  it('las tres pistas se piden una a una y la tercera avisa de que cuesta ANTES', () => {
    const lab = montar().entrar();
    const boton = () => screen.getByTestId('jz-pista');
    expect(boton().textContent).toBe('Pedir la pista 1');
    lab.pista();
    expect(screen.getByText(S1.pistas[0])).toBeInTheDocument();
    lab.pista();
    expect(boton().textContent).toMatch(/cuesta puntos/);
    lab.pista();
    expect(screen.getByText(S1.pistas[2])).toBeInTheDocument();
    expect(screen.queryByTestId('jz-pista')).toBeNull();
  });

  it('una consulta que no corre es un veredicto explicado, no una caída', () => {
    const lab = montar().entrar();
    lab.escribir('SELECT nombre, grado FROM integrantes ORDEN POR nombre;');
    lab.enviar();
    expect(lab.aceptado()).toBe('no');
    const primero = screen.getByTestId('jz-veredicto').querySelector('.jz-caso');
    expect(primero?.getAttribute('data-clase')).toBe('error');
  });
});

/* ── los dos problemas con trampa ───────────────────────────────────────────*/

describe('las dos trampas', () => {
  /** Llegar a un problema dejando los anteriores resueltos. */
  function hasta(id: string) {
    const lab = montar().entrar();
    for (const p of [S1, S2, S3, S4, S5, S6, S7]) {
      if (p.id === id) break;
      lab.resolver(p.id);
    }
    expect(lab.encargo()).toBe(id);
    return lab;
  }

  it('la columna ambigua del problema 5 sale sola, y el motor lo explica', () => {
    const lab = hasta(S5.id);
    lab.escribir('SELECT nombre, nombre FROM integrantes JOIN equipos ON integrantes.equipo_id = equipos.id;');
    lab.enviar();
    expect(lab.aceptado()).toBe('no');
    const caso = screen.getByTestId('jz-veredicto').querySelector('.jz-caso');
    expect(caso?.getAttribute('data-clase')).toBe('error');
    expect(caso?.textContent ?? '').toMatch(/ambigua|no sé de cuál|dos tablas/i);
  });

  it('«= NULL» en el problema 6 no devuelve nada, y el veredicto lo dice sin jerga', () => {
    const lab = hasta(S6.id);
    lab.escribir('SELECT nombre FROM integrantes WHERE equipo_id = NULL;');
    lab.enviar();
    expect(lab.aceptado()).toBe('no');
    expect(screen.getByTestId('jz-veredicto').textContent).toMatch(/no devolvió ninguna fila/);
  });

  it('filtrar por el NÚMERO de equipo pasa el caso visible y lo tumba uno oculto', () => {
    const lab = hasta(S7.id);
    lab.escribir(
      'SELECT integrantes.nombre FROM integrantes JOIN equipos ON integrantes.equipo_id = equipos.id WHERE equipos.id = 1;',
    );
    lab.enviar();
    expect(lab.aceptado()).toBe('no');
    const tablero = screen.getByTestId('jz-veredicto');
    /* El visible, en verde: sin casos ocultos esto habría aprobado. */
    const visibles = tablero.querySelectorAll('[data-oculto="no"]');
    expect(visibles).toHaveLength(1);
    expect(visibles[0].getAttribute('data-clase')).toBe('pasa');
    /* Y alguno de los ocultos, en rojo. */
    expect(Array.from(tablero.querySelectorAll('[data-oculto="si"]')).some((li) => li.getAttribute('data-clase') !== 'pasa')).toBe(
      true,
    );
    expect(lab.encargo()).toBe(S7.id);
  });

  it('el problema 5 se acepta con once filas de doce integrantes', () => {
    const lab = hasta(S5.id);
    lab.escribir(SOL[S5.id]);
    lab.enviar();
    expect(lab.aceptado()).toBe('si');
    /* Y el enunciado del 6 es el que recoge al que faltaba. */
    lab.siguiente();
    expect(within(screen.getByTestId('dat-encargo')).getByText(/desapareció gente/)).toBeInTheDocument();
  });
});

/* ── el recorrido entero ────────────────────────────────────────────────────*/

describe('la clase, de la portada a la insignia', () => {
  it('siete problemas, la tabla de 150 filas y la pregunta de cierre', () => {
    const lab = montar().entrar();

    for (const p of [S1, S2, S3, S4, S5, S6, S7]) lab.resolver(p.id);

    /* La tabla grande: se cierra con el ▶, no con el juez. */
    expect(lab.encargo()).toBe('muchas-filas');
    lab.escribir('SELECT * FROM sesiones;');
    lab.ejecutar();
    expect(screen.getByTestId('dat-tabla-pie').textContent).toMatch(/100.*150/);
    lab.siguiente();

    /* La única pregunta de opción de toda la clase, y va al final. */
    expect(lab.encargo()).toBe('cuantas-de-verdad');
    fireEvent.click(screen.getByText(/100: la consulta devolvió 100 filas/));
    expect(lab.encargo()).toBe('cuantas-de-verdad');
    fireEvent.click(screen.getByText(/150: el resultado está completo/));

    expect(lab.onComplete).toHaveBeenCalled();
    expect(screen.getByText(/Puedes consultar una base de verdad/)).toBeInTheDocument();
  }, 60_000);
});
