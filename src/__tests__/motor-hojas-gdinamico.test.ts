/**
 * Tecnia Hojas · el paquete GRÁFICO DINÁMICO (bloques 51 y 52).
 *
 * No hay ninguna clase detrás de esto todavía — es motor y nada más, la misma
 * disciplina que ya dejó escrita `motor-hojas-dinamica.test.ts`. Cinco
 * comandos (`grafico-dinamico`, `segmentacion`, `filtrar-segmentacion`,
 * `linea-tendencia`, `eje-secundario`) y dos funciones puras
 * (`datosDeDinamica`, dentro de `leerDatos`, y `lineaDeTendencia`).
 *
 * Y se juega MAL a propósito, que es la regla de la casa: un gráfico dinámico
 * sobre una dinámica que no existe, una segmentación de un campo que no está
 * en la dinámica, una segmentación que deja la dinámica sin ninguna fila, una
 * tendencia sobre un solo punto, una tendencia sobre puro texto, y un eje
 * secundario con una sola serie.
 *
 * La prueba que importa está en el grupo 6: **actualizar la dinámica tiene
 * que mover el gráfico**, sin que este paquete sepa que existe un botón de
 * actualizar — es lo que separa un gráfico dinámico de una gráfica normal.
 */

import { ejecutarVarios, reproducir, revisar, type Gesto } from '@/components/office/motor-hojas/comandos';
import { crearMotor } from '@/components/office/motor-hojas/formula/calculo';
import { dinamicaDe } from '@/components/office/motor-hojas/dinamica';
import { leerDatos, lineaDeTendencia } from '@/components/office/motor-hojas/Grafica';
import { type Celda, type Hoja, type Libro } from '@/components/office/motor-hojas/modelo';

/* ── utilidades, calcadas de motor-hojas-dinamica.test.ts ───────────────────*/

function hoja(id: string, nombre: string, celdas: Record<string, string | Celda>, extra: Partial<Hoja> = {}): Hoja {
  return {
    id,
    nombre,
    celdas: Object.fromEntries(Object.entries(celdas).map(([d, c]) => [d, typeof c === 'string' ? { crudo: c } : c])),
    ...extra,
  };
}

function libro(hojas: Hoja[], activa: string = hojas[0].id, extra: Partial<Libro> = {}): Libro {
  return { activa, nombres: {}, hojas, ...extra };
}

/**
 * Seis filas de ventas, con hueco a propósito: es de esta prueba y de nadie
 * más, la misma disciplina que `motor-hojas-dinamica.test.ts` con su propio
 * banco de 500.
 *
 *   Región · Mes     · Importe
 *   Norte  · Enero   · 100
 *   Norte  · Febrero · 200
 *   Sur    · Enero   ·  50
 *   Sur    · Febrero · 150
 *   Este   · Enero   ·  10
 *   Este   · Febrero ·  20
 */
function libroDeVentas(): Libro {
  const celdas: Record<string, string> = {
    A1: 'Región',
    B1: 'Mes',
    C1: 'Importe',
    A2: 'Norte',
    B2: 'Enero',
    C2: '100',
    A3: 'Norte',
    B3: 'Febrero',
    C3: '200',
    A4: 'Sur',
    B4: 'Enero',
    C4: '50',
    A5: 'Sur',
    B5: 'Febrero',
    C5: '150',
    A6: 'Este',
    B6: 'Enero',
    C6: '10',
    A7: 'Este',
    B7: 'Febrero',
    C7: '20',
  };
  return libro([hoja('d', 'Datos', celdas), hoja('r', 'Resumen', {})], 'r');
}

const ORIGEN = 'Datos!A1:C7';

/** La dinámica «Región en filas, Importe sumado» — sin campo de columna. */
const GESTOS_SIN_COLUMNA: Gesto[] = [
  { comando: 'crear-dinamica', args: { hoja: 'r', id: 'd1', origen: ORIGEN, ancla: 'A1' } },
  { comando: 'campo-dinamica', args: { hoja: 'r', id: 'd1', campo: 0, zona: 'filas' } },
  { comando: 'campo-dinamica', args: { hoja: 'r', id: 'd1', campo: 2, zona: 'valores', resumen: 'suma' } },
];

/** La misma, con el Mes en columnas — para el caso «con campo de columna». */
const GESTOS_CON_COLUMNA: Gesto[] = [...GESTOS_SIN_COLUMNA, { comando: 'campo-dinamica', args: { hoja: 'r', id: 'd1', campo: 1, zona: 'columnas' } }];

/* ── grupo 1 · grafico-dinamico ──────────────────────────────────────────────*/

describe('grafico-dinamico · un gráfico cuyo origen es una dinámica, no un rango', () => {
  it('nace con origenDinamica puesto, datos vacío, y reproducir la macro dos veces da el mismo libro', () => {
    const partida = libroDeVentas();
    const macro: Gesto[] = [...GESTOS_SIN_COLUMNA, { comando: 'grafico-dinamico', args: { hoja: 'r', id: 'g1', dinamica: 'd1', tipo: 'columnas' } }];
    const una = reproducir(partida, macro);
    const otra = reproducir(partida, macro);
    expect(otra).toEqual(una);

    const g = una.hojas.find((h) => h.id === 'r')?.graficas?.[0];
    expect(g).toMatchObject({ id: 'g1', tipo: 'columnas', datos: '', origenDinamica: 'd1', leyenda: true });
    expect(g?.ancla).toBeDefined();
    // Y el libro de partida sigue sin gráficas: la reproducción no lo tocó.
    expect(partida.hojas.find((h) => h.id === 'r')?.graficas).toBeUndefined();
  });

  it('«jugar mal»: rechaza una dinámica que no existe, un tipo inválido y un id repetido', () => {
    const motor = crearMotor(libroDeVentas());
    ejecutarVarios(motor, GESTOS_SIN_COLUMNA);
    expect(
      revisar(motor.libro, { comando: 'grafico-dinamico', args: { hoja: 'r', id: 'g1', dinamica: 'dX', tipo: 'columnas' } }),
    ).toMatch(/no existe una tabla dinámica/);
    expect(
      revisar(motor.libro, { comando: 'grafico-dinamico', args: { hoja: 'r', id: 'g1', dinamica: 'd1', tipo: 'volador' } }),
    ).toMatch(/no es un tipo de gráfica/);
    ejecutarVarios(motor, [{ comando: 'grafico-dinamico', args: { hoja: 'r', id: 'g1', dinamica: 'd1', tipo: 'columnas' } }]);
    expect(
      revisar(motor.libro, { comando: 'grafico-dinamico', args: { hoja: 'r', id: 'g1', dinamica: 'd1', tipo: 'lineas' } }),
    ).toMatch(/ya hay un gráfico/);
  });
});

/* ── grupo 2 · segmentacion ───────────────────────────────────────────────────*/

describe('segmentacion · el panel de botones que filtra un campo de la dinámica', () => {
  it('nace apuntando a la dinámica y al campo, sin ningún filtro puesto', () => {
    const motor = crearMotor(libroDeVentas());
    ejecutarVarios(motor, GESTOS_SIN_COLUMNA);
    expect(ejecutarVarios(motor, [{ comando: 'segmentacion', args: { hoja: 'r', id: 's1', dinamica: 'd1', campo: 0 } }]).ok).toBe(true);
    const seg = motor.libro.hojas.find((h) => h.id === 'r')?.segmentaciones?.[0];
    expect(seg).toMatchObject({ id: 's1', dinamica: 'd1', campo: 0 });
    expect(dinamicaDe(motor.libro, 'r', 'd1')?.filtros).toBeUndefined();
  });

  it('«jugar mal»: rechaza una dinámica que no existe y un campo que no está en la dinámica', () => {
    const motor = crearMotor(libroDeVentas());
    ejecutarVarios(motor, GESTOS_SIN_COLUMNA);
    expect(
      revisar(motor.libro, { comando: 'segmentacion', args: { hoja: 'r', id: 's1', dinamica: 'dX', campo: 0 } }),
    ).toMatch(/no existe una tabla dinámica/);
    // El origen sólo tiene 3 campos (Región, Mes, Importe): el 9 no existe.
    expect(
      revisar(motor.libro, { comando: 'segmentacion', args: { hoja: 'r', id: 's1', dinamica: 'd1', campo: 9 } }),
    ).toMatch(/no tiene un campo número 10: tiene 3/);
  });
});

/* ── grupo 3 · filtrar-segmentacion ──────────────────────────────────────────*/

describe('filtrar-segmentacion · pulsar un botón filtra la dinámica Y el gráfico a la vez', () => {
  function motorConSegmentacionYGrafico() {
    const motor = crearMotor(libroDeVentas());
    ejecutarVarios(motor, [
      ...GESTOS_SIN_COLUMNA,
      { comando: 'segmentacion', args: { hoja: 'r', id: 's1', dinamica: 'd1', campo: 0 } },
      { comando: 'grafico-dinamico', args: { hoja: 'r', id: 'g1', dinamica: 'd1', tipo: 'columnas' } },
    ]);
    return motor;
  }

  it('escribe en Dinamica.filtros y eso mueve a la vez la dinámica y el gráfico', () => {
    const motor = motorConSegmentacionYGrafico();
    // Sin filtro: las tres regiones.
    expect(leerDatos(motor, 'r', motor.libro.hojas[1].graficas![0]).categorias).toEqual(['Este', 'Norte', 'Sur']);

    expect(ejecutarVarios(motor, [{ comando: 'filtrar-segmentacion', args: { hoja: 'r', id: 's1', valores: 'Norte|Sur' } }]).ok).toBe(true);
    expect(dinamicaDe(motor.libro, 'r', 'd1')?.filtros).toEqual({ 0: ['Norte', 'Sur'] });

    const datos = leerDatos(motor, 'r', motor.libro.hojas[1].graficas![0]);
    expect(datos.categorias).toEqual(['Norte', 'Sur']);
    expect(datos.series[0].puntos).toEqual([300, 200]);

    // Vacío quita el filtro entero, como soltar todos los botones en Excel.
    ejecutarVarios(motor, [{ comando: 'filtrar-segmentacion', args: { hoja: 'r', id: 's1', valores: '' } }]);
    expect(dinamicaDe(motor.libro, 'r', 'd1')?.filtros).toBeUndefined();
  });

  it('rechaza una segmentación que no existe', () => {
    const motor = motorConSegmentacionYGrafico();
    expect(
      revisar(motor.libro, { comando: 'filtrar-segmentacion', args: { hoja: 'r', id: 'sX', valores: 'Norte' } }),
    ).toMatch(/no existe una segmentación/);
  });

  it('«jugar mal»: una selección que deja la dinámica sin ninguna fila se ACEPTA, y el gráfico no revienta', () => {
    const motor = motorConSegmentacionYGrafico();
    // «Marte» no es una región de nadie: cero filas pasan el filtro.
    expect(revisar(motor.libro, { comando: 'filtrar-segmentacion', args: { hoja: 'r', id: 's1', valores: 'Marte' } })).toBeNull();
    ejecutarVarios(motor, [{ comando: 'filtrar-segmentacion', args: { hoja: 'r', id: 's1', valores: 'Marte' } }]);
    const din = dinamicaDe(motor.libro, 'r', 'd1');
    expect(din).not.toBeNull();
    const datos = leerDatos(motor, 'r', motor.libro.hojas[1].graficas![0]);
    // Sin filas que crucen no hay categorías, y sin categorías no hay puntos —
    // pero tampoco hay una excepción, que es lo único que importa aquí.
    expect(datos.categorias).toEqual([]);
    expect(() => leerDatos(motor, 'r', motor.libro.hojas[1].graficas![0])).not.toThrow();
  });
});

/* ── grupo 4 · linea-tendencia ────────────────────────────────────────────────*/

describe('linea-tendencia · el comando', () => {
  function motorConGrafico() {
    const motor = crearMotor(libroDeVentas());
    ejecutarVarios(motor, [...GESTOS_SIN_COLUMNA, { comando: 'grafico-dinamico', args: { hoja: 'r', id: 'g1', dinamica: 'd1', tipo: 'columnas' } }]);
    return motor;
  }

  it('pone tendenciaSerie, y vacío la quita', () => {
    const motor = motorConGrafico();
    ejecutarVarios(motor, [{ comando: 'linea-tendencia', args: { hoja: 'r', id: 'g1', serie: 0 } }]);
    expect(motor.libro.hojas[1].graficas![0].tendenciaSerie).toBe(0);
    ejecutarVarios(motor, [{ comando: 'linea-tendencia', args: { hoja: 'r', id: 'g1', serie: '' } }]);
    expect(motor.libro.hojas[1].graficas![0].tendenciaSerie).toBeUndefined();
  });

  it('rechaza un gráfico que no existe y un índice de serie que no es un entero no negativo', () => {
    const motor = motorConGrafico();
    expect(revisar(motor.libro, { comando: 'linea-tendencia', args: { hoja: 'r', id: 'gX', serie: 0 } })).toMatch(/no existe/);
    expect(revisar(motor.libro, { comando: 'linea-tendencia', args: { hoja: 'r', id: 'g1', serie: -1 } })).toMatch(/no es un índice/);
    expect(revisar(motor.libro, { comando: 'linea-tendencia', args: { hoja: 'r', id: 'g1', serie: 1.5 } })).toMatch(/no es un índice/);
    expect(revisar(motor.libro, { comando: 'linea-tendencia', args: { hoja: 'r', id: 'g1', serie: '' } })).toBeNull();
  });
});

/* ── grupo 5 · eje-secundario ─────────────────────────────────────────────────*/

describe('eje-secundario · el comando', () => {
  function motorConGrafico() {
    const motor = crearMotor(libroDeVentas());
    ejecutarVarios(motor, [...GESTOS_SIN_COLUMNA, { comando: 'grafico-dinamico', args: { hoja: 'r', id: 'g1', dinamica: 'd1', tipo: 'columnas' } }]);
    return motor;
  }

  it('agrega y quita una serie del segundo eje, y pone y quita su corte', () => {
    const motor = motorConGrafico();
    ejecutarVarios(motor, [{ comando: 'eje-secundario', args: { hoja: 'r', id: 'g1', serie: 0, activo: 1 } }]);
    expect(motor.libro.hojas[1].graficas![0].ejeSecundario).toEqual([0]);
    ejecutarVarios(motor, [{ comando: 'eje-secundario', args: { hoja: 'r', id: 'g1', serie: 0, activo: 0 } }]);
    expect(motor.libro.hojas[1].graficas![0].ejeSecundario).toBeUndefined();

    ejecutarVarios(motor, [{ comando: 'eje-secundario', args: { hoja: 'r', id: 'g1', minY: 50 } }]);
    expect(motor.libro.hojas[1].graficas![0].minYSecundario).toBe(50);
    ejecutarVarios(motor, [{ comando: 'eje-secundario', args: { hoja: 'r', id: 'g1', minY: '' } }]);
    expect(motor.libro.hojas[1].graficas![0].minYSecundario).toBeUndefined();
  });

  it('rechaza un gráfico que no existe, un gesto sin serie ni minY, y un minY que no es un número', () => {
    const motor = motorConGrafico();
    expect(revisar(motor.libro, { comando: 'eje-secundario', args: { hoja: 'r', id: 'gX', serie: 0, activo: 1 } })).toMatch(/no existe/);
    expect(revisar(motor.libro, { comando: 'eje-secundario', args: { hoja: 'r', id: 'g1' } })).toMatch(/di qué serie/);
    expect(revisar(motor.libro, { comando: 'eje-secundario', args: { hoja: 'r', id: 'g1', minY: 'mucho' } })).toMatch(/no es un número/);
  });

  it('«jugar mal»: un eje secundario con una sola serie se ACEPTA — no hay motor en `revisar` para contarlas', () => {
    const motor = motorConGrafico();
    expect(revisar(motor.libro, { comando: 'eje-secundario', args: { hoja: 'r', id: 'g1', serie: 0, activo: 1 } })).toBeNull();
    expect(ejecutarVarios(motor, [{ comando: 'eje-secundario', args: { hoja: 'r', id: 'g1', serie: 0, activo: 1 } }]).ok).toBe(true);
    // La única serie de esta gráfica se fue entera al segundo eje: se lee sin
    // reventar, que es lo único que hay que comprobar aquí.
    expect(() => leerDatos(motor, 'r', motor.libro.hojas[1].graficas![0])).not.toThrow();
  });
});

/* ── grupo 6 · de la dinámica a los datos de la gráfica (bloque 51) ─────────*/

describe('leerDatos sobre un origenDinamica · lo que Grafica.tsx va a dibujar', () => {
  it('sin campo de columna: una categoría por región, una serie, y el total general excluido', () => {
    const motor = crearMotor(libroDeVentas());
    ejecutarVarios(motor, [...GESTOS_SIN_COLUMNA, { comando: 'grafico-dinamico', args: { hoja: 'r', id: 'g1', dinamica: 'd1', tipo: 'columnas' } }]);
    const datos = leerDatos(motor, 'r', motor.libro.hojas[1].graficas![0]);
    expect(datos.categorias).toEqual(['Este', 'Norte', 'Sur']);
    expect(datos.series).toEqual([{ nombre: 'Suma de Importe', puntos: [30, 300, 200] }]);
  });

  it('con campo de columna: el grupo «Total general» se excluye de las series, y el nombre es el del mes', () => {
    const motor = crearMotor(libroDeVentas());
    ejecutarVarios(motor, [...GESTOS_CON_COLUMNA, { comando: 'grafico-dinamico', args: { hoja: 'r', id: 'g1', dinamica: 'd1', tipo: 'columnas' } }]);
    const datos = leerDatos(motor, 'r', motor.libro.hojas[1].graficas![0]);
    expect(datos.categorias).toEqual(['Este', 'Norte', 'Sur']);
    expect(datos.series.map((s) => s.nombre)).toEqual(['Enero', 'Febrero']);
    expect(datos.series[0].puntos).toEqual([10, 100, 50]);
    expect(datos.series[1].puntos).toEqual([20, 200, 150]);
  });

  it('«jugar mal»: un gráfico dinámico sobre una dinámica que ya no está no lanza, y sale vacío', () => {
    const motor = crearMotor(libroDeVentas());
    ejecutarVarios(motor, [...GESTOS_SIN_COLUMNA, { comando: 'grafico-dinamico', args: { hoja: 'r', id: 'g1', dinamica: 'd1', tipo: 'columnas' } }]);
    const grafico = { ...motor.libro.hojas[1].graficas![0], origenDinamica: 'no-existe' };
    let datos;
    expect(() => (datos = leerDatos(motor, 'r', grafico))).not.toThrow();
    expect(datos!.caja).toBeNull();
    expect(datos!.series).toEqual([]);
  });

  it('la prueba que importa: actualizar la dinámica mueve el gráfico — y sólo al actualizar', () => {
    const motor = crearMotor(libroDeVentas());
    ejecutarVarios(motor, [...GESTOS_SIN_COLUMNA, { comando: 'grafico-dinamico', args: { hoja: 'r', id: 'g1', dinamica: 'd1', tipo: 'columnas' } }]);
    const grafico = () => motor.libro.hojas[1].graficas![0];

    expect(leerDatos(motor, 'r', grafico()).series[0].puntos).toEqual([30, 300, 200]);

    // Se cambia un dato del origen: Norte de enero pasa de 100 a 900.
    ejecutarVarios(motor, [{ comando: 'escribir', args: { hoja: 'd', celda: 'C2', crudo: '900' } }]);
    // ANTES de actualizar, el gráfico sigue enseñando lo viejo — la mitad de
    // la lección de `dinamica.ts`.
    expect(leerDatos(motor, 'r', grafico()).series[0].puntos).toEqual([30, 300, 200]);

    ejecutarVarios(motor, [{ comando: 'actualizar-dinamica', args: { hoja: 'r', id: 'd1' } }]);
    // DESPUÉS de actualizar, se movió solo: Norte pasa de 300 a 1100.
    expect(leerDatos(motor, 'r', grafico()).series[0].puntos).toEqual([30, 1100, 200]);
  });
});

/* ── grupo 7 · lineaDeTendencia (bloque 52) ──────────────────────────────────*/

describe('lineaDeTendencia · mínimos cuadrados, y qué hace con pocos puntos', () => {
  it('una recta exacta: y = 2x + 1, sin ruido', () => {
    const xs = [0, 1, 2, 3, 4];
    const ys = [1, 3, 5, 7, 9];
    const t = lineaDeTendencia(xs, ys);
    expect(t.n).toBe(5);
    expect(t.pendiente).toBeCloseTo(2);
    expect(t.interseccion).toBeCloseTo(1);
  });

  it('«jugar mal»: cuatro puntos exponen n = 4, y no un rechazo — la lectura es de la clase, no del motor', () => {
    const t = lineaDeTendencia([0, 1, 2, 3], [10, 12, 11, 15]);
    expect(t.n).toBe(4);
    expect(t.pendiente).not.toBeNull();
  });

  it('«jugar mal»: un solo punto numérico no se puede trazar, pero n queda disponible', () => {
    const t = lineaDeTendencia([0, 1, 2], [null, 5, null]);
    expect(t.n).toBe(1);
    expect(t.pendiente).toBeNull();
    expect(t.interseccion).toBeNull();
  });

  it('«jugar mal»: una serie de puro texto —todo huecos— da n = 0 y no lanza', () => {
    const t = lineaDeTendencia([0, 1, 2], [null, null, null]);
    expect(t.n).toBe(0);
    expect(t.pendiente).toBeNull();
  });

  it('todas las X iguales: el denominador es exactamente cero, y no revienta', () => {
    const t = lineaDeTendencia([5, 5, 5], [1, 2, 3]);
    expect(t.n).toBe(3);
    expect(t.pendiente).toBeNull();
    expect(t.interseccion).toBeNull();
  });
});
