/**
 * Tecnia Hojas · el paquete TABLAS (bloques 33, 34, 35 y 36): tablas, filtros,
 * orden por varias columnas, inmovilizar, y ocultar/mostrar filas.
 *
 * Se prueba jugando MAL a propósito, que es la regla de la casa: crear una
 * tabla sobre una sola celda, sobre un rango sin encabezados o sobre un rango
 * que ya es tabla; filtrar hasta que no quede ninguna fila; filtrar y luego
 * escribir en una fila escondida; ordenar con la tabla filtrada; inmovilizar
 * un número de filas que no tiene sentido; ocultar todas las filas. Y la
 * prueba que importa: con un filtro puesto, la celda que hay bajo un puesto
 * de pantalla es la que se VE, no la que estaría ahí sin filtrar.
 */

import { ejecutar, ejecutarVarios, nuevaGrabadora, reproducir, revisar, type Gesto } from '@/components/office/motor-hojas/comandos';
import { crearMotor } from '@/components/office/motor-hojas/formula/calculo';
import { filaVisible, tablaDe, totalDeColumna, valorDe as valorConsulta } from '@/components/office/motor-hojas/consultas';
import { celdaEn, dir, filaEnPuesto, hojaDe, puestoDeFila, type Celda, type Hoja, type Libro } from '@/components/office/motor-hojas/modelo';

/* ── utilidades, calcadas de motor-hojas-protege.test.ts ────────────────────*/

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

/* ── crear-tabla · bloque 33, jugando mal ────────────────────────────────────*/

describe('crear-tabla · jugando mal', () => {
  it('crea una tabla con nombre, rango y estilo por defecto', () => {
    const base = libro([
      hoja('h1', 'Hoja1', { A1: 'Producto', B1: 'Ventas', A2: 'Manzana', B2: '10', A3: 'Pera', B3: '20' }),
    ]);
    const motor = crearMotor(base);
    const g: Gesto = { comando: 'crear-tabla', args: { hoja: 'h1', id: 't1', nombre: 'Tabla1', rango: 'A1:B3' } };
    expect(revisar(motor.libro, g)).toBeNull();
    expect(ejecutar(motor, g)).toBeNull();
    const t = tablaDe(motor.libro, 'h1', 't1');
    expect(t?.nombre).toBe('Tabla1');
    expect(t?.rango).toBe('A1:B3');
    expect(t?.estilo).toBe('claro-1');
  });

  it('rechaza un rango de una sola celda: no hay dónde meter una fila de datos', () => {
    const base = libro([hoja('h1', 'Hoja1', { A1: 'Solo' })]);
    const g: Gesto = { comando: 'crear-tabla', args: { hoja: 'h1', id: 't1', rango: 'A1' } };
    expect(revisar(base, g)).toMatch(/encabezados/);
  });

  it('rechaza un encabezado con un hueco', () => {
    const base = libro([hoja('h1', 'Hoja1', { A1: 'Producto', A2: 'Manzana', B2: '10' })]);
    const g: Gesto = { comando: 'crear-tabla', args: { hoja: 'h1', id: 't1', rango: 'A1:B2' } };
    expect(revisar(base, g)).toMatch(/encabezado/);
  });

  it('rechaza superponerse con una tabla que ya existe', () => {
    const base = libro([
      hoja('h1', 'Hoja1', { A1: 'Producto', A2: 'Manzana' }, { tablas: [{ id: 't0', nombre: 'Tabla0', rango: 'A1:A2', estilo: 'claro-1' }] }),
    ]);
    const g: Gesto = { comando: 'crear-tabla', args: { hoja: 'h1', id: 't1', rango: 'A1:A2' } };
    expect(revisar(base, g)).toMatch(/superpon/);
  });

  it('rechaza un identificador o un nombre repetidos', () => {
    const base = libro([
      hoja('h1', 'Hoja1', { A1: 'Producto', A2: 'Manzana', B1: 'X', B2: 'Y' }, { tablas: [{ id: 't1', nombre: 'Tabla1', rango: 'A1:A2', estilo: 'claro-1' }] }),
    ]);
    expect(revisar(base, { comando: 'crear-tabla', args: { hoja: 'h1', id: 't1', nombre: 'Otra', rango: 'B1:B2' } })).toMatch(/identificador/);
    expect(revisar(base, { comando: 'crear-tabla', args: { hoja: 'h1', id: 't2', nombre: 'Tabla1', rango: 'B1:B2' } })).toMatch(/Tabla1/);
  });

  it('crece sola cuando se escribe justo debajo, y NO crece si se escribe en otra columna', () => {
    const base = libro([
      hoja('h1', 'Hoja1', { A1: 'Producto', B1: 'Ventas', A2: 'Manzana', B2: '10' }, { tablas: [{ id: 't1', nombre: 'Tabla1', rango: 'A1:B2', estilo: 'claro-1' }] }),
    ]);
    const motor = crearMotor(base);
    expect(ejecutar(motor, { comando: 'escribir', args: { hoja: 'h1', celda: 'A3', crudo: 'Pera' } })).toBeNull();
    expect(tablaDe(motor.libro, 'h1', 't1')?.rango).toBe('A1:B3');
    // Escribir en una columna que no es de la tabla, en la fila de justo
    // debajo de su nuevo final, no la hace crecer.
    expect(ejecutar(motor, { comando: 'escribir', args: { hoja: 'h1', celda: 'D4', crudo: 'x' } })).toBeNull();
    expect(tablaDe(motor.libro, 'h1', 't1')?.rango).toBe('A1:B3');
  });
});

/* ── estilo-tabla y fila-totales · bloque 33 ─────────────────────────────────*/

describe('estilo-tabla y fila-totales', () => {
  it('estilo-tabla cambia el estilo, y rechaza una tabla que no existe', () => {
    const base = libro([hoja('h1', 'Hoja1', { A1: 'Producto', A2: 'Manzana' }, { tablas: [{ id: 't1', nombre: 'Tabla1', rango: 'A1:A2', estilo: 'claro-1' }] })]);
    const motor = crearMotor(base);
    expect(ejecutar(motor, { comando: 'estilo-tabla', args: { hoja: 'h1', id: 't1', estilo: 'oscuro-3' } })).toBeNull();
    expect(tablaDe(motor.libro, 'h1', 't1')?.estilo).toBe('oscuro-3');
    expect(revisar(motor.libro, { comando: 'estilo-tabla', args: { hoja: 'h1', id: 'no-existe', estilo: 'x' } })).not.toBeNull();
  });

  it('fila-totales calcula suma, promedio, cuenta, max y min — y «ninguno» la quita', () => {
    const base = libro([
      hoja(
        'h1',
        'Hoja1',
        { A1: 'Producto', B1: 'Ventas', A2: 'Manzana', B2: '10', A3: 'Pera', B3: '20', A4: 'Uva', B4: '30' },
        { tablas: [{ id: 't1', nombre: 'Tabla1', rango: 'A1:B4', estilo: 'claro-1' }] },
      ),
    ]);
    const motor = crearMotor(base);
    const totalDe = (col: number) => totalDeColumna(motor, 'h1', tablaDe(motor.libro, 'h1', 't1')!, col);

    expect(ejecutar(motor, { comando: 'fila-totales', args: { hoja: 'h1', id: 't1', columna: 1, resumen: 'suma' } })).toBeNull();
    expect(totalDe(1)).toBe(60);
    expect(ejecutar(motor, { comando: 'fila-totales', args: { hoja: 'h1', id: 't1', columna: 1, resumen: 'promedio' } })).toBeNull();
    expect(totalDe(1)).toBe(20);
    expect(ejecutar(motor, { comando: 'fila-totales', args: { hoja: 'h1', id: 't1', columna: 1, resumen: 'max' } })).toBeNull();
    expect(totalDe(1)).toBe(30);
    expect(ejecutar(motor, { comando: 'fila-totales', args: { hoja: 'h1', id: 't1', columna: 1, resumen: 'min' } })).toBeNull();
    expect(totalDe(1)).toBe(10);
    // «cuenta» sobre una columna de TEXTO: cuenta celdas no vacías, no números.
    expect(ejecutar(motor, { comando: 'fila-totales', args: { hoja: 'h1', id: 't1', columna: 0, resumen: 'cuenta' } })).toBeNull();
    expect(totalDe(0)).toBe(3);
    expect(ejecutar(motor, { comando: 'fila-totales', args: { hoja: 'h1', id: 't1', columna: 1, resumen: 'ninguno' } })).toBeNull();
    expect(tablaDe(motor.libro, 'h1', 't1')?.filaDeTotales).toEqual({ 0: 'cuenta' });
  });
});

/* ── filtrar y quitar-filtros · bloque 34, jugando mal ───────────────────────*/

describe('filtrar · jugando mal', () => {
  it('deriva `visibles` de la lista de valores, y la fila de totales se comporta como SUBTOTALES (no como SUMA)', () => {
    const base = libro([
      hoja(
        'h1',
        'Hoja1',
        {
          A1: 'Producto',
          B1: 'Ventas',
          A2: 'Manzana',
          B2: '10',
          A3: 'Pera',
          B3: '20',
          A4: 'Uva',
          B4: '30',
          D1: '=SUMA(B2:B4)',
        },
        { tablas: [{ id: 't1', nombre: 'Tabla1', rango: 'A1:B4', estilo: 'claro-1', filaDeTotales: { 1: 'suma' } }] },
      ),
    ]);
    const motor = crearMotor(base);
    expect(valorConsulta(motor, 'h1', 'D1')).toBe(60);
    expect(totalDeColumna(motor, 'h1', tablaDe(motor.libro, 'h1', 't1')!, 1)).toBe(60);

    expect(ejecutar(motor, { comando: 'filtrar', args: { hoja: 'h1', id: 't1', columna: 0, valores: 'Manzana,Uva' } })).toBeNull();
    expect(hojaDe(motor.libro, 'h1')?.visibles).toEqual([0, 1, 3]); // Pera (fila 2) se esconde

    // El contraste que el bloque existe para enseñar: la fórmula normal SIGUE
    // sumando las tres, y el total de la tabla SÓLO cuenta las dos visibles.
    expect(valorConsulta(motor, 'h1', 'D1')).toBe(60);
    expect(totalDeColumna(motor, 'h1', tablaDe(motor.libro, 'h1', 't1')!, 1)).toBe(40);
  });

  it('filtra por comparación numérica, y filtrar hasta que no quede ninguna fila de datos no rompe nada', () => {
    const base = libro([
      hoja(
        'h1',
        'Hoja1',
        { A1: 'Producto', B1: 'Ventas', A2: 'Manzana', B2: '10', A3: 'Pera', B3: '20', A4: 'Uva', B4: '30' },
        { tablas: [{ id: 't1', nombre: 'Tabla1', rango: 'A1:B4', estilo: 'claro-1', filaDeTotales: { 1: 'suma' } }] },
      ),
    ]);
    const motor = crearMotor(base);
    expect(ejecutar(motor, { comando: 'filtrar', args: { hoja: 'h1', id: 't1', columna: 1, op: 'mayor', contra: '15' } })).toBeNull();
    expect(hojaDe(motor.libro, 'h1')?.visibles).toEqual([0, 2, 3]); // Pera y Uva, no Manzana

    expect(ejecutar(motor, { comando: 'filtrar', args: { hoja: 'h1', id: 't1', columna: 1, op: 'mayor', contra: '999' } })).toBeNull();
    expect(hojaDe(motor.libro, 'h1')?.visibles).toEqual([0]); // sólo el encabezado: la hoja se ve vacía, no rota
    expect(totalDeColumna(motor, 'h1', tablaDe(motor.libro, 'h1', 't1')!, 1)).toBe(0);
  });

  it('escribir en una fila escondida por un filtro SÍ se guarda, aunque la fila siga sin verse', () => {
    const base = libro([
      hoja('h1', 'Hoja1', { A1: 'Producto', B1: 'Ventas', A2: 'Manzana', B2: '10', A3: 'Pera', B3: '20' }, {
        tablas: [{ id: 't1', nombre: 'Tabla1', rango: 'A1:B3', estilo: 'claro-1' }],
      }),
    ]);
    const motor = crearMotor(base);
    expect(ejecutar(motor, { comando: 'filtrar', args: { hoja: 'h1', id: 't1', columna: 0, valores: 'Pera' } })).toBeNull();
    expect(filaVisible(motor.libro, 'h1', 1)).toBe(false); // Manzana (fila índice 1) escondida

    expect(ejecutar(motor, { comando: 'escribir', args: { hoja: 'h1', celda: 'B2', crudo: '99' } })).toBeNull();
    expect(valorConsulta(motor, 'h1', 'B2')).toBe(99);
    expect(filaVisible(motor.libro, 'h1', 1)).toBe(false); // sigue sin verse
  });

  it('quitar-filtros devuelve la hoja a ver todas las filas, y rechaza una tabla que no existe', () => {
    const base = libro([
      hoja('h1', 'Hoja1', { A1: 'Producto', A2: 'Manzana', A3: 'Pera' }, { tablas: [{ id: 't1', nombre: 'Tabla1', rango: 'A1:A3', estilo: 'claro-1' }] }),
    ]);
    const motor = crearMotor(base);
    ejecutar(motor, { comando: 'filtrar', args: { hoja: 'h1', id: 't1', columna: 0, valores: 'Pera' } });
    expect(hojaDe(motor.libro, 'h1')?.visibles).toBeDefined();
    expect(ejecutar(motor, { comando: 'quitar-filtros', args: { hoja: 'h1', id: 't1' } })).toBeNull();
    expect(hojaDe(motor.libro, 'h1')?.visibles).toBeUndefined();
    expect(revisar(motor.libro, { comando: 'quitar-filtros', args: { hoja: 'h1', id: 'no-existe' } })).not.toBeNull();
  });
});

/* ── ordenar-varias · bloque 35, jugando mal ─────────────────────────────────*/

describe('ordenar-varias · jugando mal', () => {
  it('ordena por varias columnas EN PRIORIDAD', () => {
    const base = libro([
      hoja(
        'h1',
        'Hoja1',
        { A1: 'Region', B1: 'Producto', C1: 'Ventas', A2: 'Sur', B2: 'Pera', C2: '20', A3: 'Norte', B3: 'Uva', C3: '30', A4: 'Norte', B4: 'Manzana', C4: '10' },
        { tablas: [{ id: 't1', nombre: 'Tabla1', rango: 'A1:C4', estilo: 'claro-1' }] },
      ),
    ]);
    const motor = crearMotor(base);
    // Primero Region ascendente, luego Producto ascendente.
    expect(ejecutar(motor, { comando: 'ordenar-varias', args: { hoja: 'h1', id: 't1', orden: '0-0,1-0' } })).toBeNull();
    expect(valorConsulta(motor, 'h1', 'A2')).toBe('Norte');
    expect(valorConsulta(motor, 'h1', 'B2')).toBe('Manzana');
    expect(valorConsulta(motor, 'h1', 'A3')).toBe('Norte');
    expect(valorConsulta(motor, 'h1', 'B3')).toBe('Uva');
    expect(valorConsulta(motor, 'h1', 'A4')).toBe('Sur');
    expect(valorConsulta(motor, 'h1', 'B4')).toBe('Pera');
  });

  it('se lleva la fila entera, crudo Y FORMATO (el defecto conocido de `gestosDeOrden`, arreglado aquí)', () => {
    const base = libro([
      hoja(
        'h1',
        'Hoja1',
        {
          A1: 'Producto',
          B1: 'Ventas',
          A2: { crudo: 'Pera', formato: { tipo: 'general', colorRelleno: '#ffff00' } },
          B2: '20',
          A3: 'Manzana',
          B3: '10',
        },
        { tablas: [{ id: 't1', nombre: 'Tabla1', rango: 'A1:B3', estilo: 'claro-1' }] },
      ),
    ]);
    const motor = crearMotor(base);
    expect(ejecutar(motor, { comando: 'ordenar-varias', args: { hoja: 'h1', id: 't1', orden: '0-0' } })).toBeNull();
    expect(valorConsulta(motor, 'h1', 'A2')).toBe('Manzana');
    expect(valorConsulta(motor, 'h1', 'A3')).toBe('Pera');
    // Pera se movió a la fila 3 y se llevó su amarillo puesto.
    expect(celdaEn(motor.libro, 'h1', 0, 2)?.formato?.colorRelleno).toBe('#ffff00');
    expect(celdaEn(motor.libro, 'h1', 0, 1)?.formato?.colorRelleno).toBeUndefined();
  });

  it('desplaza las referencias relativas de las fórmulas que se mueven', () => {
    const base = libro([
      hoja(
        'h1',
        'Hoja1',
        { A1: 'Producto', B1: 'Precio', C1: 'Total', A2: 'Pera', B2: '20', C2: '=B2*2', A3: 'Manzana', B3: '10', C3: '=B3*2' },
        { tablas: [{ id: 't1', nombre: 'Tabla1', rango: 'A1:C3', estilo: 'claro-1' }] },
      ),
    ]);
    const motor = crearMotor(base);
    expect(ejecutar(motor, { comando: 'ordenar-varias', args: { hoja: 'h1', id: 't1', orden: '0-0' } })).toBeNull();
    expect(valorConsulta(motor, 'h1', 'A2')).toBe('Manzana');
    expect(valorConsulta(motor, 'h1', 'C2')).toBe(20); // =B2*2, con B2 = 10
    expect(valorConsulta(motor, 'h1', 'A3')).toBe('Pera');
    expect(valorConsulta(motor, 'h1', 'C3')).toBe(40); // =B3*2, con B3 = 20
  });

  it('rechaza ordenar una tabla filtrada, y rechaza una columna que no es de la tabla', () => {
    const base = libro([
      hoja('h1', 'Hoja1', { A1: 'Producto', B1: 'Ventas', A2: 'Pera', B2: '20', A3: 'Manzana', B3: '10' }, {
        tablas: [{ id: 't1', nombre: 'Tabla1', rango: 'A1:B3', estilo: 'claro-1', filtros: { 0: { valores: ['Pera'] } } }],
      }),
    ]);
    const g: Gesto = { comando: 'ordenar-varias', args: { hoja: 'h1', id: 't1', orden: '0-0' } };
    expect(revisar(base, g)).toMatch(/filtro/);
    const motor = crearMotor(base);
    expect(ejecutar(motor, g)).not.toBeNull();
    expect(valorConsulta(motor, 'h1', 'A2')).toBe('Pera'); // no se tocó nada

    expect(revisar(base, { comando: 'ordenar-varias', args: { hoja: 'h1', id: 't1', orden: '9-0' } })).not.toBeNull();
  });
});

/* ── inmovilizar, ocultar y mostrar filas · bloque 36, jugando mal ──────────*/

describe('inmovilizar, ocultar y mostrar filas · jugando mal', () => {
  it('inmovilizar fija filas y columnas; 0 y 0 lo quita; un número negativo se rechaza', () => {
    const base = libro([hoja('h1', 'Hoja1', { A1: 'x' })]);
    const motor = crearMotor(base);
    expect(ejecutar(motor, { comando: 'inmovilizar', args: { hoja: 'h1', filas: 1, cols: 2 } })).toBeNull();
    expect(hojaDe(motor.libro, 'h1')?.inmovilizado).toEqual({ filas: 1, cols: 2 });
    expect(ejecutar(motor, { comando: 'inmovilizar', args: { hoja: 'h1', filas: 0, cols: 0 } })).toBeNull();
    expect(hojaDe(motor.libro, 'h1')?.inmovilizado).toBeUndefined();
    expect(revisar(motor.libro, { comando: 'inmovilizar', args: { hoja: 'h1', filas: -1, cols: 0 } })).not.toBeNull();
  });

  it('ocultar un tramo lo esconde, y mostrarlo de vuelta lo hace visible otra vez', () => {
    const base = libro([hoja('h1', 'Hoja1', { A1: '1', A2: '2', A3: '3', A4: '4' })]);
    const motor = crearMotor(base);
    expect(ejecutar(motor, { comando: 'ocultar-filas', args: { hoja: 'h1', desde: 1, hasta: 2 } })).toBeNull();
    expect(hojaDe(motor.libro, 'h1')?.visibles).toEqual([0, 3]);
    expect(puestoDeFila(hojaDe(motor.libro, 'h1')!, 1)).toBe(-1);
    expect(ejecutar(motor, { comando: 'mostrar-filas', args: { hoja: 'h1', desde: 1, hasta: 2 } })).toBeNull();
    // No hace falta que `visibles` vuelva a `undefined` —puede quedarse con
    // un array explícito que dice lo mismo, ver la reserva en `comandos.ts`—,
    // pero las cuatro filas tienen que volver a tener puesto.
    const hojaViva = hojaDe(motor.libro, 'h1')!;
    expect([0, 1, 2, 3].map((f) => puestoDeFila(hojaViva, f)).every((p) => p >= 0)).toBe(true);
  });

  it('ocultar TODAS las filas conocidas de la hoja es legal y no rompe nada', () => {
    const base = libro([hoja('h1', 'Hoja1', { A1: '1', A2: '2' })]);
    const motor = crearMotor(base);
    expect(ejecutar(motor, { comando: 'ocultar-filas', args: { hoja: 'h1', desde: 0, hasta: 1 } })).toBeNull();
    expect(hojaDe(motor.libro, 'h1')?.visibles).toEqual([]);
  });
});

/* ── puestoDeFila / filaEnPuesto · modelo.ts ─────────────────────────────────*/

describe('puestoDeFila y filaEnPuesto', () => {
  it('sin `visibles`, el puesto de una fila es ella misma', () => {
    const h: Hoja = { id: 'h1', nombre: 'Hoja1', celdas: {} };
    expect(puestoDeFila(h, 5)).toBe(5);
    expect(filaEnPuesto(h, 5)).toBe(5);
  });

  it('con `visibles`, traduce en los dos sentidos y da -1 para lo que no tiene puesto', () => {
    const h: Hoja = { id: 'h1', nombre: 'Hoja1', celdas: {}, visibles: [0, 2, 4] };
    expect(filaEnPuesto(h, 0)).toBe(0);
    expect(filaEnPuesto(h, 1)).toBe(2);
    expect(filaEnPuesto(h, 2)).toBe(4);
    expect(filaEnPuesto(h, 3)).toBe(-1); // fin de la lista filtrada
    expect(puestoDeFila(h, 2)).toBe(1);
    expect(puestoDeFila(h, 3)).toBe(-1); // escondida
  });

  it('LA PRUEBA QUE IMPORTA: con un filtro puesto, lo que hay bajo un puesto de pantalla es lo que se VE, no lo que habría sin filtrar', () => {
    const base = libro([
      hoja(
        'h1',
        'Hoja1',
        { A1: 'Producto', B1: 'Ventas', A2: 'Manzana', B2: '10', A3: 'Pera', B3: '20', A4: 'Uva', B4: '30' },
        { tablas: [{ id: 't1', nombre: 'Tabla1', rango: 'A1:B4', estilo: 'claro-1' }] },
      ),
    ]);
    const motor = crearMotor(base);
    // Esconde Pera (fila índice 2): sólo quedan el encabezado, Manzana y Uva.
    ejecutar(motor, { comando: 'filtrar', args: { hoja: 'h1', id: 't1', columna: 0, valores: 'Manzana,Uva' } });
    const hojaViva = hojaDe(motor.libro, 'h1')!;
    // Sin filtrar, el tercer renglón (puesto 2) sería la fila 2 (Pera). Con el
    // filtro puesto tiene que resolver a la fila 3 (Uva) — es el defecto que
    // la decisión de `puestoDeFila`/`filaEnPuesto` existe para evitar.
    const filaBajoElPuesto = filaEnPuesto(hojaViva, 2);
    expect(filaBajoElPuesto).toBe(3);
    expect(filaBajoElPuesto).not.toBe(2);
    expect(valorConsulta(motor, 'h1', dir(0, filaBajoElPuesto))).toBe('Uva');
  });
});

/* ── reproducibilidad de macro · §45.6 ───────────────────────────────────────*/

describe('reproducibilidad de macro', () => {
  it('crear tabla + ordenar + filtrar, grabado y reproducido sobre el libro de partida, da el MISMO libro', () => {
    const base = libro([
      hoja('h1', 'Hoja1', { A1: 'Producto', B1: 'Ventas', A2: 'Pera', B2: '20', A3: 'Manzana', B3: '10', A4: 'Uva', B4: '30' }),
    ]);
    const motor = crearMotor(base);
    const grabadora = nuevaGrabadora();
    grabadora.grabando = true;

    const gestos: Gesto[] = [
      { comando: 'crear-tabla', args: { hoja: 'h1', id: 't1', nombre: 'Tabla1', rango: 'A1:B4' } },
      { comando: 'ordenar-varias', args: { hoja: 'h1', id: 't1', orden: '0-0' } },
      { comando: 'filtrar', args: { hoja: 'h1', id: 't1', columna: 1, op: 'mayor', contra: '15' } },
    ];
    for (const g of gestos) {
      expect(ejecutarVarios(motor, [g], grabadora).ok).toBe(true);
    }

    const reproducido = reproducir(base, grabadora.gestos);
    expect(reproducido).toEqual(motor.libro);
  });
});
