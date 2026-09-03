/**
 * Tecnia Hojas · la prueba de concepto de la TABLA DINÁMICA (bloques 49 y 50).
 *
 * Tres criterios, y los tres medidos aquí y no estimados:
 *
 *   1. **Que resuma de verdad.** 500 filas de origen, una dinámica de 5×4,
 *      comprobada celda a celda contra una cuenta hecha **por otro camino**: un
 *      doble bucle sobre los datos con los que se generó la hoja, que ni pasa
 *      por el motor de fórmulas ni por el de la dinámica. Y el importe de la
 *      hoja es una FÓRMULA (`=C2*D2`), así que si la dinámica leyera crudos en
 *      vez de valores calculados, las veinte celdas fallarían a la vez.
 *   2. **Que se actualice al pedirlo, y sólo al pedirlo.** Se cambia un dato del
 *      origen y se comprueba que ANTES de actualizar la dinámica sigue enseñando
 *      lo viejo —que es la mitad de la lección— y que después enseña lo nuevo.
 *   3. **Que aguante.** Con `libroGrande`, por debajo de 50 ms.
 *
 * Y se juega MAL a propósito, que es la regla de la casa: origen sin
 * encabezados, origen de una sola fila, el mismo campo en filas y en columnas,
 * resumir con `suma` una columna de texto, escribir dentro de la dinámica, y dos
 * dinámicas que se solapan al pintarse.
 */

import {
  ejecutar,
  ejecutarVarios,
  nuevaGrabadora,
  reproducir,
  revisar,
  type Gesto,
} from '@/components/office/motor-hojas/comandos';
import { crearMotor } from '@/components/office/motor-hojas/formula/calculo';
import { libroGrande } from '@/components/office/motor-hojas/librosDePrueba';
import { mismoNumero } from '@/components/office/motor-hojas/consultas';
import {
  construirDinamica,
  dinamicaDe,
  dinamicaPintadaDe,
  rolPintado,
  valorPintado,
  type Construida,
} from '@/components/office/motor-hojas/dinamica';
import { type Celda, type Hoja, type Libro } from '@/components/office/motor-hojas/modelo';

/* ── utilidades, calcadas de motor-hojas-tablas.test.ts ─────────────────────*/

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

/* ── los 500 renglones de ventas ─────────────────────────────────────────────
 *
 * El dato vive aquí y no en `librosDePrueba.ts` a propósito: es de esta prueba
 * y de nadie más, y `librosDePrueba.ts` lo comparten cuatro sesiones a la vez.
 *
 * `Centro` nunca vendió en abril — el hueco está puesto a mano, porque un cruce
 * de 5×4 con las veinte combinaciones llenas no probaría lo que hay que probar:
 * que **un hueco es vacío y no cero**.
 */
const REGIONES = ['Norte', 'Sur', 'Este', 'Oeste', 'Centro'];
const MESES = ['enero', 'febrero', 'marzo', 'abril'];

interface Venta {
  region: string;
  mes: string;
  precio: number;
  cantidad: number;
}

function ventas(): Venta[] {
  const fuera: Venta[] = [];
  for (let i = 0; i < 500; i += 1) {
    const region = REGIONES[i % 5];
    let mes = MESES[i % 4];
    if (region === 'Centro' && mes === 'abril') mes = 'marzo';
    fuera.push({ region, mes, precio: 10 + (i % 17), cantidad: 1 + (i % 7) });
  }
  return fuera;
}

/** La hoja de datos: encabezados, 500 filas y el importe **como fórmula**. */
function libroDeVentas(datos: Venta[] = ventas()): Libro {
  const celdas: Record<string, string> = {
    A1: 'Región',
    B1: 'Mes',
    C1: 'Precio',
    D1: 'Cantidad',
    E1: 'Importe',
  };
  datos.forEach((v, i) => {
    const f = i + 2;
    celdas[`A${f}`] = v.region;
    celdas[`B${f}`] = v.mes;
    celdas[`C${f}`] = String(v.precio);
    celdas[`D${f}`] = String(v.cantidad);
    celdas[`E${f}`] = `=C${f}*D${f}`;
  });
  return libro([hoja('h1', 'Datos', celdas), hoja('h2', 'Resumen', {})], 'h2');
}

const ORIGEN = 'Datos!A1:E501';

/** Los gestos que montan la dinámica de 5×4: crearla y arrastrar tres campos. */
const GESTOS_5x4: Gesto[] = [
  { comando: 'crear-dinamica', args: { hoja: 'h2', id: 'd1', origen: ORIGEN, ancla: 'A1' } },
  { comando: 'campo-dinamica', args: { hoja: 'h2', id: 'd1', campo: 0, zona: 'filas' } },
  { comando: 'campo-dinamica', args: { hoja: 'h2', id: 'd1', campo: 1, zona: 'columnas' } },
  { comando: 'campo-dinamica', args: { hoja: 'h2', id: 'd1', campo: 4, zona: 'valores', resumen: 'suma' } },
];

/** La cuenta hecha por otro camino: un doble bucle sobre los datos generados. */
const total = (datos: Venta[], region: string, mes: string): number =>
  datos
    .filter((v) => (region === '' || v.region === region) && (mes === '' || v.mes === mes))
    .reduce((s, v) => s + v.precio * v.cantidad, 0);

/* ── crear-dinamica · jugando mal ───────────────────────────────────────────*/

describe('crear-dinamica · lo que Excel diría antes de aceptar', () => {
  it('nace vacía y guarda la especificación, no el resultado', () => {
    const motor = crearMotor(libroDeVentas());
    expect(revisar(motor.libro, GESTOS_5x4[0])).toBeNull();
    expect(ejecutar(motor, GESTOS_5x4[0])).toBeNull();
    const din = dinamicaDe(motor.libro, 'h2', 'd1');
    expect(din).toEqual({ id: 'd1', origen: ORIGEN, ancla: 'h2!A1', filas: [], columnas: [], valores: [] });
    // Y ni una celda escrita: la dinámica no pega valores en la hoja.
    expect(Object.keys(motor.libro.hojas[1].celdas)).toHaveLength(0);
  });

  it('rechaza la hoja que no existe, el identificador vacío y el repetido', () => {
    const motor = crearMotor(libroDeVentas());
    expect(revisar(motor.libro, { comando: 'crear-dinamica', args: { hoja: 'hX', id: 'd1', origen: ORIGEN, ancla: 'A1' } })).toMatch(
      /esa hoja no existe/,
    );
    expect(revisar(motor.libro, { comando: 'crear-dinamica', args: { hoja: 'h2', id: '', origen: ORIGEN, ancla: 'A1' } })).toMatch(
      /identificador/,
    );
    ejecutar(motor, GESTOS_5x4[0]);
    expect(revisar(motor.libro, { comando: 'crear-dinamica', args: { hoja: 'h2', id: 'd1', origen: ORIGEN, ancla: 'H1' } })).toMatch(
      /ya hay una tabla dinámica/,
    );
  });

  it('rechaza un origen sin encabezados: sin ellos no hay campos que arrastrar', () => {
    const base = libro([hoja('h1', 'Datos', { A1: 'Región', A2: 'Norte', B2: '10' }), hoja('h2', 'Resumen', {})]);
    const g: Gesto = { comando: 'crear-dinamica', args: { hoja: 'h2', id: 'd1', origen: 'Datos!A1:B2', ancla: 'A1' } };
    expect(revisar(base, g)).toMatch(/le falta el encabezado de la columna B/);
  });

  it('rechaza un origen de una sola fila y un rango que no se lee', () => {
    const base = libro([hoja('h1', 'Datos', { A1: 'Región', B1: 'Importe' }), hoja('h2', 'Resumen', {})]);
    expect(revisar(base, { comando: 'crear-dinamica', args: { hoja: 'h2', id: 'd1', origen: 'Datos!A1:B1', ancla: 'A1' } })).toMatch(
      /sólo la fila de encabezados/,
    );
    expect(revisar(base, { comando: 'crear-dinamica', args: { hoja: 'h2', id: 'd1', origen: 'Datos!ZZZZ', ancla: 'A1' } })).toMatch(
      /no es un rango/,
    );
    expect(revisar(base, { comando: 'crear-dinamica', args: { hoja: 'h2', id: 'd1', origen: 'Nadie!A1:B2', ancla: 'A1' } })).toMatch(
      /no es un rango/,
    );
  });

  it('rechaza pintarse encima de sus propios datos', () => {
    const motor = crearMotor(libroDeVentas());
    // El ancla en la hoja de datos, dentro del origen: se mordería la cola.
    const g: Gesto = { comando: 'crear-dinamica', args: { hoja: 'h1', id: 'd1', origen: ORIGEN, ancla: 'C3' } };
    expect(revisar(motor.libro, g)).toMatch(/encima de sus propios datos/);
    // A la derecha del origen, en la misma hoja, sí se puede.
    expect(revisar(motor.libro, { comando: 'crear-dinamica', args: { hoja: 'h1', id: 'd1', origen: ORIGEN, ancla: 'H3' } })).toBeNull();
  });
});

/* ── campo-dinamica · arrastrar campos ──────────────────────────────────────*/

describe('campo-dinamica · el panel de campos', () => {
  it('el mismo campo en filas y en columnas se MUEVE, no se duplica', () => {
    const motor = crearMotor(libroDeVentas());
    ejecutarVarios(motor, GESTOS_5x4.slice(0, 2));
    expect(dinamicaDe(motor.libro, 'h2', 'd1')?.filas).toEqual([0]);
    ejecutar(motor, { comando: 'campo-dinamica', args: { hoja: 'h2', id: 'd1', campo: 0, zona: 'columnas' } });
    const din = dinamicaDe(motor.libro, 'h2', 'd1');
    expect(din?.filas).toEqual([]);
    expect(din?.columnas).toEqual([0]);
  });

  it('rechaza un campo que no está en el origen y un resumen inventado', () => {
    const motor = crearMotor(libroDeVentas());
    ejecutar(motor, GESTOS_5x4[0]);
    expect(revisar(motor.libro, { comando: 'campo-dinamica', args: { hoja: 'h2', id: 'd1', campo: 9, zona: 'filas' } })).toMatch(
      /no tiene un campo número 10: tiene 5/,
    );
    expect(
      revisar(motor.libro, { comando: 'campo-dinamica', args: { hoja: 'h2', id: 'd1', campo: 4, zona: 'valores', resumen: 'mediana' } }),
    ).toMatch(/no es un resumen/);
    expect(revisar(motor.libro, { comando: 'campo-dinamica', args: { hoja: 'h2', id: 'd1', campo: 0, zona: 'trasero' } })).toMatch(
      /no es una zona/,
    );
    expect(revisar(motor.libro, { comando: 'campo-dinamica', args: { hoja: 'h2', id: 'dX', campo: 0, zona: 'filas' } })).toMatch(
      /no existe una tabla dinámica/,
    );
  });

  it('«fuera» quita el campo de todas las zonas, y un gesto que no cambia nada deja el mismo libro', () => {
    const motor = crearMotor(libroDeVentas());
    ejecutarVarios(motor, GESTOS_5x4);
    const antes = motor.libro;
    // Repetir el gesto que ya estaba puesto no cambia el libro: si lo cambiara,
    // la dinámica se repintaría sola por la puerta de atrás.
    expect(ejecutarVarios(motor, [GESTOS_5x4[1]]).cambio).toBe(false);
    expect(motor.libro).toBe(antes);
    ejecutar(motor, { comando: 'campo-dinamica', args: { hoja: 'h2', id: 'd1', campo: 0, zona: 'fuera' } });
    const din = dinamicaDe(motor.libro, 'h2', 'd1');
    expect(din?.filas).toEqual([]);
    expect(din?.valores).toEqual([{ col: 4, resumen: 'suma' }]);
  });
});

/* ── criterio 1 · que resuma de verdad ──────────────────────────────────────*/

describe('§49 criterio 1 · 500 filas → una dinámica de 5×4, celda a celda', () => {
  const datos = ventas();
  const motor = crearMotor(libroDeVentas(datos));
  ejecutarVarios(motor, GESTOS_5x4);
  const c = dinamicaPintadaDe(motor, 'h2', 'd1') as Construida;

  it('tiene la forma que tiene que tener y las etiquetas ordenadas alfabéticamente', () => {
    // 1 columna de etiquetas + 4 meses + el total general.
    expect(c.ancho).toBe(6);
    // 2 cabeceras + 5 regiones + el total general.
    expect(c.alto).toBe(8);
    expect(c.region).toEqual({ c0: 0, f0: 0, c1: 5, f1: 7 });
    expect(c.origenFilas).toBe(500);
    expect(c.filas.map((f) => f.texto)).toEqual(['Centro', 'Este', 'Norte', 'Oeste', 'Sur', 'Total general']);
    /*
     * **Los meses salen mal ordenados, y es CORRECTO.** «abril» antes que
     * «enero» es lo que hace Excel con texto suelto ordenado alfabéticamente, y
     * es material de la clase 50: la salida de verdad es agrupar por fecha, no
     * una lista de meses escondida en el motor. Si algún día esta línea empieza
     * a fallar porque los meses salen en orden de calendario, lo que hay que
     * mirar es quién metió esa lista.
     */
    expect(c.columnas.map((x) => x.texto)).toEqual(['abril', 'enero', 'febrero', 'marzo', 'Total general']);
    expect(valorPintado(c, 0, 0)).toBe('Suma de Importe');
    expect(valorPintado(c, 1, 0)).toBe('Etiquetas de columna');
    expect(valorPintado(c, 0, 1)).toBe('Etiquetas de fila');
    expect(rolPintado(c, 0, 2)).toBe('etiqueta');
    expect(rolPintado(c, 1, 2)).toBe('dato');
    expect(rolPintado(c, 5, 2)).toBe('total');
  });

  it('las veinte celdas del cruce, contra una cuenta hecha por otro camino', () => {
    const filas = ['Centro', 'Este', 'Norte', 'Oeste', 'Sur'];
    const columnas = ['abril', 'enero', 'febrero', 'marzo'];
    let comprobadas = 0;
    filas.forEach((region, i) => {
      columnas.forEach((mes, j) => {
        const esperado = total(datos, region, mes);
        // El hueco puesto a mano: Centro no vendió en abril.
        expect(valorPintado(c, 1 + j, 2 + i)).toBe(esperado === 0 ? null : esperado);
        comprobadas += 1;
      });
    });
    expect(comprobadas).toBe(20);
  });

  it('los subtotales de fila, los de columna y el total general', () => {
    const filas = ['Centro', 'Este', 'Norte', 'Oeste', 'Sur'];
    filas.forEach((region, i) => expect(valorPintado(c, 5, 2 + i)).toBe(total(datos, region, '')));
    ['abril', 'enero', 'febrero', 'marzo'].forEach((mes, j) => expect(valorPintado(c, 1 + j, 7)).toBe(total(datos, '', mes)));
    expect(valorPintado(c, 5, 7)).toBe(total(datos, '', ''));
    expect(valorPintado(c, 0, 7)).toBe('Total general');
  });

  it('un hueco es VACÍO, y un cero de verdad es CERO', () => {
    // El cruce que no existe no vale 0: no vale nada (decisión 3 de `modelo.ts`).
    expect(valorPintado(c, 1, 2)).toBeNull();
    /*
     * Y una venta de importe 0 sí enseña 0, que es la otra mitad de la
     * distinción: un cero dice «se vendió por 0 pesos» y un vacío dice «no
     * hubo venta». Si el motor rellenara los huecos con cero, estas dos celdas
     * serían indistinguibles y la clase 15 se quedaría sin ejemplo.
     */
    const otro = crearMotor(
      libro(
        [
          // Sur tiene fila pero no tiene importe: es la tercera cosa distinta,
          // y suma 0 —hay venta, sin cifra— en vez de quedarse vacío.
          hoja('h1', 'Datos', { A1: 'Región', B1: 'Importe', A2: 'Centro', B2: '0', A3: 'Sur' }),
          hoja('h2', 'Resumen', {}),
        ],
        'h2',
      ),
    );
    expect(
      ejecutarVarios(otro, [
        { comando: 'crear-dinamica', args: { hoja: 'h2', id: 'dz', origen: 'Datos!A1:B3', ancla: 'A1' } },
        { comando: 'campo-dinamica', args: { hoja: 'h2', id: 'dz', campo: 0, zona: 'filas' } },
        { comando: 'campo-dinamica', args: { hoja: 'h2', id: 'dz', campo: 1, zona: 'valores', resumen: 'suma' } },
      ]).ok,
    ).toBe(true);
    const z = dinamicaPintadaDe(otro, 'h2', 'dz') as Construida;
    expect(valorPintado(z, 1, 1)).toBe(0); // Centro, que vendió por cero
    expect(valorPintado(z, 1, 2)).toBe(0); // Sur, que vendió sin cifra
    expect(valorPintado(z, 1, 3)).toBe(0); // y el total general
  });

  it('lo que enseña es lo que sale de construirla otra vez desde cero', () => {
    const otra = construirDinamica(motor, dinamicaDe(motor.libro, 'h2', 'd1')!) as Construida;
    expect(otra.celdas).toEqual(c.celdas);
  });
});

/* ── criterio 2 · actualizar es explícito ───────────────────────────────────*/

describe('§49 criterio 2 · antes de actualizar enseña lo viejo', () => {
  it('cambiar el origen no la mueve; Actualizar sí', () => {
    const datos = ventas();
    const motor = crearMotor(libroDeVentas(datos));
    ejecutarVarios(motor, GESTOS_5x4);
    const antes = dinamicaPintadaDe(motor, 'h2', 'd1') as Construida;
    const norteEnero = total(datos, 'Norte', 'enero');
    // Norte · enero está en la fila 2 (índice 2 de las etiquetas) y en la
    // columna de enero (la segunda del cruce).
    expect(valorPintado(antes, 2, 4)).toBe(norteEnero);

    // La fila 2 de la hoja es la primera venta: Norte, enero, precio 10, cant 1.
    expect(ejecutar(motor, { comando: 'escribir', args: { hoja: 'h1', celda: 'C2', crudo: '1010' } })).toBeNull();

    // El motor de fórmulas SÍ se enteró: el importe de esa fila ya es otro.
    expect(motor.valores.get('h1!E2')).toBe(1010 * 1);

    // Y la dinámica NO. Es la mitad de la lección: sigue enseñando lo de antes.
    const durante = dinamicaPintadaDe(motor, 'h2', 'd1') as Construida;
    expect(valorPintado(durante, 2, 4)).toBe(norteEnero);

    // Actualizar no cambia el dato: cambia lo que la hoja enseña. El libro que
    // queda es indistinguible del anterior — no se guardó ni un número.
    const libroAntes = motor.libro;
    expect(ejecutar(motor, { comando: 'actualizar-dinamica', args: { hoja: 'h2', id: 'd1' } })).toBeNull();
    expect(motor.libro).toEqual(libroAntes);
    expect(motor.libro).not.toBe(libroAntes);

    const despues = dinamicaPintadaDe(motor, 'h2', 'd1') as Construida;
    expect(valorPintado(despues, 2, 4)).toBe(norteEnero + 1010 - 10);
    expect(valorPintado(despues, 5, 7)).toBe(total(datos, '', '') + 1000);
  });

  it('cambiar un campo también la repinta: arrastrar es actualizar', () => {
    const datos = ventas();
    const motor = crearMotor(libroDeVentas(datos));
    ejecutarVarios(motor, GESTOS_5x4);
    dinamicaPintadaDe(motor, 'h2', 'd1');
    ejecutar(motor, { comando: 'campo-dinamica', args: { hoja: 'h2', id: 'd1', campo: 4, zona: 'valores', resumen: 'cuenta' } });
    const c = dinamicaPintadaDe(motor, 'h2', 'd1') as Construida;
    expect(valorPintado(c, 0, 0)).toBe('Cuenta de Importe');
    expect(valorPintado(c, 5, 7)).toBe(500);
  });
});

/* ── criterio 3 · que aguante ───────────────────────────────────────────────*/

describe('§49 criterio 3 · el libro grande, por debajo de 50 ms', () => {
  it('construye la dinámica de 999 filas cruzadas en menos de 50 ms', () => {
    /*
     * El estadístico es el **mínimo de siete tandas**, por la misma razón que en
     * el criterio 3 del §45.5 y con la misma cita: la suite tiene más de treinta
     * archivos, jest lanza un obrero por archivo y `performance.now()` es un
     * reloj de pared. La contención sólo puede sumar, nunca restar, así que la
     * media y la mediana miden cuán ocupada estaba la máquina y el mínimo mide
     * lo que se quiere saber. El listón sigue en 50.
     *
     * El origen es `libroGrande()` tal cual: su fila 1 hace de encabezados, con
     * lo que quedan 999 filas de datos, 97 etiquetas en el eje de filas y 13 en
     * el de columnas — 1 262 celdas cruzadas más los subtotales — y **la columna
     * que se resume es una fórmula** (`=A1*B1`), así que se está midiendo el
     * camino de verdad, leyendo la caché del motor.
     */
    const motor = crearMotor(libroGrande());
    const gestos: Gesto[] = [
      { comando: 'crear-dinamica', args: { hoja: 'h1', id: 'dg', origen: 'Grande!A1:C1000', ancla: 'H1' } },
      { comando: 'campo-dinamica', args: { hoja: 'h1', id: 'dg', campo: 0, zona: 'filas' } },
      { comando: 'campo-dinamica', args: { hoja: 'h1', id: 'dg', campo: 1, zona: 'columnas' } },
      { comando: 'campo-dinamica', args: { hoja: 'h1', id: 'dg', campo: 2, zona: 'valores', resumen: 'suma' } },
    ];
    expect(ejecutarVarios(motor, gestos).ok).toBe(true);
    const din = dinamicaDe(motor.libro, 'h1', 'dg')!;

    const tanda = (): number => {
      const t0 = performance.now();
      const c = construirDinamica(motor, din) as Construida;
      const ms = performance.now() - t0;
      expect(c.origenFilas).toBe(999);
      return ms;
    };

    tanda(); // calentamiento
    const medidas = Array.from({ length: 7 }, tanda).sort((a, b) => a - b);
    const mejor = medidas[0];
    const c = construirDinamica(motor, din) as Construida;

    // eslint-disable-next-line no-console
    console.log(
      `[§49 criterio 3] dinámica de ${c.filas.length}×${c.columnas.length} sobre 999 filas → mejor de 7: ` +
        `${mejor.toFixed(2)} ms (${medidas.map((m) => m.toFixed(2)).join(' · ')})`,
    );
    expect(mejor).toBeLessThan(50);
  });
});

/* ── el cruce de dos campos anidados · bloque 50 ────────────────────────────*/

describe('§50 · dos campos en filas, anidados', () => {
  const datos = ventas();
  const motor = crearMotor(libroDeVentas(datos));
  ejecutarVarios(motor, [
    ...GESTOS_5x4,
    { comando: 'campo-dinamica', args: { hoja: 'h2', id: 'd1', campo: 1, zona: 'filas' } },
  ]);

  it('el mes se va de columnas a filas y se anida dentro de la región', () => {
    const din = dinamicaDe(motor.libro, 'h2', 'd1');
    expect(din?.filas).toEqual([0, 1]);
    expect(din?.columnas).toEqual([]);
    const c = dinamicaPintadaDe(motor, 'h2', 'd1') as Construida;
    /*
     * En preorden, que es la forma compacta de Excel: el padre con su subtotal
     * y debajo sus hijos. Centro sólo tiene tres meses porque nunca vendió en
     * abril — el árbol se construye con lo que hay, no con lo que podría haber.
     */
    expect(c.filas.slice(0, 5).map((f) => `${f.profundidad}·${f.texto}`)).toEqual([
      '1·Centro',
      '2·enero',
      '2·febrero',
      '2·marzo',
      '1·Este',
    ]);
    // 5 regiones + 4 meses en cuatro de ellas + 3 en Centro + el total general.
    expect(c.filas).toHaveLength(5 + 19 + 1);
    expect(c.filas[0].resume).toBe(true);
    expect(c.filas[1].resume).toBe(false);
  });

  it('cada nivel suma lo suyo: el subtotal de la región es la suma de sus meses', () => {
    const c = dinamicaPintadaDe(motor, 'h2', 'd1') as Construida;
    // Centro (fila 0 del eje) y sus tres meses (filas 1, 2 y 3).
    const centro = valorPintado(c, 1, c.cabeceras) as number;
    const suyos = [1, 2, 3].map((i) => valorPintado(c, 1, c.cabeceras + i) as number);
    expect(centro).toBe(total(datos, 'Centro', ''));
    expect(suyos.reduce((a, b) => a + b, 0)).toBe(centro);
    expect(valorPintado(c, 1, c.cabeceras + c.filas.length - 1)).toBe(total(datos, '', ''));
    expect(rolPintado(c, 1, c.cabeceras)).toBe('total'); // el subtotal de Centro
    expect(rolPintado(c, 1, c.cabeceras + 1)).toBe('dato'); // enero, dentro de Centro
  });

  it('agrupar-dinamica le da la vuelta al anidamiento sin tocar el total general', () => {
    const c = dinamicaPintadaDe(motor, 'h2', 'd1') as Construida;
    const granTotal = valorPintado(c, 1, c.cabeceras + c.filas.length - 1);
    expect(ejecutar(motor, { comando: 'agrupar-dinamica', args: { hoja: 'h2', id: 'd1', campo: 0, dentroDe: 1 } })).toBeNull();
    expect(dinamicaDe(motor.libro, 'h2', 'd1')?.filas).toEqual([1, 0]);
    const vuelta = dinamicaPintadaDe(motor, 'h2', 'd1') as Construida;
    expect(vuelta.filas.slice(0, 3).map((f) => `${f.profundidad}·${f.texto}`)).toEqual(['1·abril', '2·Este', '2·Norte']);
    // La misma tabla contada al revés: el total general no se mueve.
    expect(valorPintado(vuelta, 1, vuelta.cabeceras + vuelta.filas.length - 1)).toBe(granTotal);
    expect(valorPintado(vuelta, 1, vuelta.cabeceras)).toBe(total(datos, '', 'abril'));
  });

  it('agrupar-dinamica rechaza lo que no tiene sentido', () => {
    expect(revisar(motor.libro, { comando: 'agrupar-dinamica', args: { hoja: 'h2', id: 'd1', campo: 0, dentroDe: 0 } })).toMatch(
      /dentro de sí mismo/,
    );
    expect(revisar(motor.libro, { comando: 'agrupar-dinamica', args: { hoja: 'h2', id: 'd1', campo: 0, dentroDe: 3 } })).toMatch(
      /no está en filas ni en columnas/,
    );
    expect(revisar(motor.libro, { comando: 'agrupar-dinamica', args: { hoja: 'h2', id: 'd1', campo: 3 } })).toMatch(
      /arrástralo antes/,
    );
  });
});

/* ── la región es de sólo lectura ───────────────────────────────────────────*/

describe('§49 · la región de la dinámica es de sólo lectura', () => {
  it('escribir o pintar dentro se rechaza; fuera y en el origen, adelante', () => {
    const motor = crearMotor(libroDeVentas());
    ejecutarVarios(motor, GESTOS_5x4);
    const c = dinamicaPintadaDe(motor, 'h2', 'd1') as Construida;
    expect(c.region).toEqual({ c0: 0, f0: 0, c1: 5, f1: 7 });

    const dentro: Gesto = { comando: 'escribir', args: { hoja: 'h2', celda: 'C4', crudo: '999' } };
    expect(revisar(motor.libro, dentro)).toMatch(/es de sólo lectura/);
    const r = ejecutarVarios(motor, [dentro]);
    expect(r.ok).toBe(false);
    expect(r.cambio).toBe(false);
    expect(motor.libro.hojas[1].celdas.C4).toBeUndefined();

    /*
     * Pintarla tampoco. `formato` contesta `toca: []` —pintar no ensucia ningún
     * valor— y aun así escribe en `hoja.celdas`: es el agujero que costó caro en
     * el §47.6, y por eso esta guarda aplica el gesto y compara en vez de fiarse
     * de lo que el comando dice que toca.
     */
    expect(revisar(motor.libro, { comando: 'formato', args: { hoja: 'h2', rango: 'B3:C5', tipo: 'moneda' } })).toMatch(
      /sólo lectura/,
    );

    // Justo al lado, fuera del rectángulo, se puede escribir y pintar igual que
    // siempre — y en el origen, que es lo que la frase del aviso le pide.
    expect(ejecutar(motor, { comando: 'escribir', args: { hoja: 'h2', celda: 'G4', crudo: 'nota' } })).toBeNull();
    expect(ejecutar(motor, { comando: 'formato', args: { hoja: 'h2', rango: 'H3', tipo: 'moneda' } })).toBeNull();
    expect(ejecutar(motor, { comando: 'escribir', args: { hoja: 'h1', celda: 'C3', crudo: '99' } })).toBeNull();
  });

  it('dos dinámicas no se pueden pintar una encima de la otra', () => {
    const motor = crearMotor(libroDeVentas());
    // Las dos nacen vacías, ocupando dos renglones cada una: no se estorban.
    expect(
      ejecutarVarios(motor, [
        { comando: 'crear-dinamica', args: { hoja: 'h2', id: 'd1', origen: ORIGEN, ancla: 'A1' } },
        { comando: 'crear-dinamica', args: { hoja: 'h2', id: 'd2', origen: ORIGEN, ancla: 'A5' } },
      ]).ok,
    ).toBe(true);
    // Pero en cuanto la de arriba crece cinco regiones, se metería dentro de la
    // de abajo. Es el aviso que da Excel al actualizar, dicho antes de aceptar.
    expect(revisar(motor.libro, { comando: 'campo-dinamica', args: { hoja: 'h2', id: 'd1', campo: 0, zona: 'filas' } })).toMatch(
      /encima de «d2»/,
    );
    // La de abajo crece hacia abajo y no molesta a nadie.
    expect(revisar(motor.libro, { comando: 'campo-dinamica', args: { hoja: 'h2', id: 'd2', campo: 0, zona: 'filas' } })).toBeNull();
  });
});

/* ── los resúmenes, los filtros y las rarezas ───────────────────────────────*/

describe('§49 · resumir, filtrar y jugar mal', () => {
  const datos = ventas();

  it('resumir con SUMA una columna de texto da 0 donde hay filas, y vacío donde no', () => {
    const motor = crearMotor(libroDeVentas(datos));
    ejecutarVarios(motor, [
      GESTOS_5x4[0],
      GESTOS_5x4[1],
      GESTOS_5x4[2],
      // El campo 1 es «Mes», que es texto de arriba abajo.
      { comando: 'campo-dinamica', args: { hoja: 'h2', id: 'd1', campo: 1, zona: 'valores', resumen: 'suma' } },
    ]);
    const c = dinamicaPintadaDe(motor, 'h2', 'd1') as Construida;
    expect(valorPintado(c, 0, 0)).toBe('Suma de Mes');
    // Centro · abril no existe: sigue vacío. Centro · enero existe: suma 0.
    expect(valorPintado(c, 1, 2)).toBeNull();
    expect(valorPintado(c, 2, 2)).toBe(0);
  });

  it('cuenta, promedio, máximo y mínimo', () => {
    const motor = crearMotor(libroDeVentas(datos));
    const conResumen = (resumen: string): Construida => {
      ejecutar(motor, { comando: 'campo-dinamica', args: { hoja: 'h2', id: 'd1', campo: 4, zona: 'valores', resumen } });
      return dinamicaPintadaDe(motor, 'h2', 'd1') as Construida;
    };
    ejecutarVarios(motor, GESTOS_5x4);
    const importes = datos.filter((v) => v.region === 'Norte').map((v) => v.precio * v.cantidad);
    expect(valorPintado(conResumen('cuenta'), 5, 4)).toBe(importes.length);
    expect(mismoNumero(valorPintado(conResumen('promedio'), 5, 4) as number, importes.reduce((a, b) => a + b, 0) / importes.length)).toBe(
      true,
    );
    expect(valorPintado(conResumen('max'), 5, 4)).toBe(Math.max(...importes));
    expect(valorPintado(conResumen('min'), 5, 4)).toBe(Math.min(...importes));
    // «ninguno» quita el campo de valores: queda el esqueleto sin números.
    const sin = conResumen('ninguno');
    expect(sin.ancho).toBe(1);
    expect(valorPintado(sin, 0, 0)).toBe('Etiquetas de fila');
  });

  it('el filtro de un campo deja fuera lo que no está en la lista', () => {
    const motor = crearMotor(libroDeVentas(datos));
    ejecutarVarios(motor, [
      ...GESTOS_5x4,
      { comando: 'campo-dinamica', args: { hoja: 'h2', id: 'd1', campo: 0, zona: 'filtro', valores: 'Norte|Sur' } },
    ]);
    expect(dinamicaDe(motor.libro, 'h2', 'd1')?.filtros).toEqual({ 0: ['Norte', 'Sur'] });
    const c = dinamicaPintadaDe(motor, 'h2', 'd1') as Construida;
    expect(c.filas.map((f) => f.texto)).toEqual(['Norte', 'Sur', 'Total general']);
    expect(valorPintado(c, 5, c.cabeceras + 2)).toBe(total(datos, 'Norte', '') + total(datos, 'Sur', ''));
    // Y quitarlo lo devuelve todo.
    ejecutar(motor, { comando: 'campo-dinamica', args: { hoja: 'h2', id: 'd1', campo: 0, zona: 'filtro', valores: '' } });
    expect(dinamicaDe(motor.libro, 'h2', 'd1')?.filtros).toBeUndefined();
    expect((dinamicaPintadaDe(motor, 'h2', 'd1') as Construida).filas).toHaveLength(6);
  });

  it('sin campos de columna, la única columna es el valor y ya es el total', () => {
    const motor = crearMotor(libroDeVentas(datos));
    ejecutarVarios(motor, [GESTOS_5x4[0], GESTOS_5x4[1], GESTOS_5x4[3]]);
    const c = dinamicaPintadaDe(motor, 'h2', 'd1') as Construida;
    expect(c.ancho).toBe(2);
    expect(c.cabeceras).toBe(1);
    expect(valorPintado(c, 1, 0)).toBe('Suma de Importe');
    expect(valorPintado(c, 1, 1)).toBe(total(datos, 'Centro', ''));
    expect(valorPintado(c, 1, 6)).toBe(total(datos, '', ''));
  });

  it('una celda vacía en un campo de filas se agrupa en «(en blanco)», que no es un hueco', () => {
    const motor = crearMotor(libroDeVentas(datos));
    ejecutarVarios(motor, [GESTOS_5x4[0], GESTOS_5x4[1], GESTOS_5x4[3]]);
    ejecutarVarios(motor, [
      { comando: 'borrar', args: { hoja: 'h1', rango: 'A2' } },
      { comando: 'actualizar-dinamica', args: { hoja: 'h2', id: 'd1' } },
    ]);
    const c = dinamicaPintadaDe(motor, 'h2', 'd1') as Construida;
    expect(c.filas.map((f) => f.texto)).toContain('(en blanco)');
    expect(valorPintado(c, 1, 1)).toBe(10 * 1); // la venta huérfana, no un vacío
  });

  it('las filas escondidas del origen SÍ cuentan: una dinámica no es SUBTOTALES', () => {
    const motor = crearMotor(libroDeVentas(datos));
    ejecutarVarios(motor, [GESTOS_5x4[0], GESTOS_5x4[1], GESTOS_5x4[3]]);
    const antes = valorPintado(dinamicaPintadaDe(motor, 'h2', 'd1') as Construida, 1, 6);
    ejecutarVarios(motor, [
      { comando: 'ocultar-filas', args: { hoja: 'h1', desde: 1, hasta: 100 } },
      { comando: 'actualizar-dinamica', args: { hoja: 'h2', id: 'd1' } },
    ]);
    expect(valorPintado(dinamicaPintadaDe(motor, 'h2', 'd1') as Construida, 1, 6)).toBe(antes);
  });

  it('el origen puede vivir en otra hoja, con espacio en el nombre', () => {
    const base = libro([
      hoja('h1', 'Grupo A', { A1: 'Quién', B1: 'Cuánto', A2: 'Ana', B2: '10', A3: 'Ana', B3: '5', A4: 'Beto', B4: '3' }),
      hoja('h2', 'Resumen', {}),
    ]);
    const motor = crearMotor(base);
    const r = ejecutarVarios(motor, [
      { comando: 'crear-dinamica', args: { hoja: 'h2', id: 'd1', origen: "'Grupo A'!A1:B4", ancla: 'A1' } },
      { comando: 'campo-dinamica', args: { hoja: 'h2', id: 'd1', campo: 0, zona: 'filas' } },
      { comando: 'campo-dinamica', args: { hoja: 'h2', id: 'd1', campo: 1, zona: 'valores', resumen: 'suma' } },
    ]);
    expect(r.ok).toBe(true);
    const c = dinamicaPintadaDe(motor, 'h2', 'd1') as Construida;
    expect(c.filas.map((f) => f.texto)).toEqual(['Ana', 'Beto', 'Total general']);
    expect(valorPintado(c, 1, 1)).toBe(15);
    expect(valorPintado(c, 1, 3)).toBe(18);
  });

  it('los cuatro comandos son datos: la macro reproducida da el mismo libro', () => {
    const base = libroDeVentas(datos);
    const motor = crearMotor(base);
    const grabadora = nuevaGrabadora();
    grabadora.grabando = true;
    ejecutarVarios(motor, GESTOS_5x4, grabadora);
    ejecutarVarios(motor, [{ comando: 'agrupar-dinamica', args: { hoja: 'h2', id: 'd1', campo: 1, dentroDe: 0 } }], grabadora);
    ejecutarVarios(motor, [{ comando: 'actualizar-dinamica', args: { hoja: 'h2', id: 'd1' } }], grabadora);
    expect(grabadora.gestos).toHaveLength(6);
    expect(reproducir(base, grabadora.gestos)).toEqual(motor.libro);
  });
});

