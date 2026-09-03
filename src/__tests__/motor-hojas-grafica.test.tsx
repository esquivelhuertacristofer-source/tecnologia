/**
 * Tecnia Hojas · **el motor de gráficas** (§45.5, bloques 17, 18, 37 y 38).
 *
 * Veintiuna pruebas, y ninguna es un ejemplo bonito. Las cuatro que deciden si
 * este motor sirve son éstas, y conviene saber por qué antes de leer el resto:
 *
 * **(1) Insertar una gráfica es un GESTO.** Si no lo fuera, la clase 55 no
 * podría grabarla, y eso no se ve hasta veintidós clases después. La prueba
 * reproduce la macro sobre el libro de partida y exige el mismo libro **dos
 * veces**: un `id` inventado al aplicar la rompe al primer intento.
 *
 * **(2) La gráfica lee del motor.** Se mide el `<rect>` del SVG, no el estado:
 * se cambia `A3` y la barra tiene que cambiar de altura sola. Una gráfica que se
 * guardara sus números pasaría todas las demás pruebas de este archivo y
 * fallaría ésta, que es la única que dice si es una gráfica o una foto.
 *
 * **(3) Los cinco tipos aguantan lo que un alumno hace el primer día.** Un rango
 * de una celda, uno con huecos, uno de puro texto, uno con `#¡DIV/0!` dentro y
 * uno de negativos. Veinticinco combinaciones y **ninguna puede lanzar**: aquí el
 * error es un valor, no una excepción (decisión 2 de `modelo.ts`).
 *
 * **(4) El eje se puede cortar.** Es la capacidad que necesita la clase 38, y se
 * prueba como capacidad y no como defecto: con `minY` puesto, la proporción
 * entre dos barras se dispara sin que ningún dato haya cambiado.
 *
 * Y se juega MAL a propósito, que es la regla de la casa: se pulsa el botón con
 * una sola celda marcada, se inserta dos veces la misma gráfica, se le pide un
 * campo que no existe y se le echa un pastel a números negativos.
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';

import Grafica, { COL_PX, FILA_PX, escalaDe, leerDatos, marcasDeEje } from '@/components/office/motor-hojas/Grafica';
import VentanaHojas, { ALTO_FILA, ANCHO_COL } from '@/components/office/VentanaHojas';
import { CINTA_EXCEL_BASICO } from '@/components/activities/office/tecniaHojas';
import {
  celdasQueToca,
  ejecutar,
  ejecutarVarios,
  escribirEn,
  nuevaGrabadora,
  reproducir,
  revisar,
  type Caja,
  type Gesto,
} from '@/components/office/motor-hojas/comandos';
import { crearMotor, type Motor } from '@/components/office/motor-hojas/formula/calculo';
import { CONTROLES, SIN_CONSTRUIR, estaInerte, gestosDe, razonInerte, type ContextoCinta } from '@/components/office/motor-hojas/cinta';
import { QUE_HACE_EXCEL } from '@/components/office/motor-hojas/guia';
import type { GuionHojas } from '@/components/office/motor-hojas/guion';
import type { Grafica as ObjetoGrafica, Hoja, Libro } from '@/components/office/motor-hojas/modelo';

/* ── utilidades ─────────────────────────────────────────────────────────────*/

const CONTEXTO = { ahora: Date.UTC(2026, 7, 15, 12, 0, 0) };

function libroCon(celdas: Record<string, string>, graficas?: ObjetoGrafica[]): Libro {
  const hoja: Hoja = {
    id: 'h1',
    nombre: 'Hoja1',
    celdas: Object.fromEntries(Object.entries(celdas).map(([d, crudo]) => [d, { crudo }])),
  };
  if (graficas) hoja.graficas = graficas;
  return { activa: 'h1', nombres: {}, hojas: [hoja] };
}

/** Una columna de tres números con su encabezado. El libro de casi todas. */
const LIBRO_BASE = (): Libro => libroCon({ A1: 'Total', A2: '10', A3: '20', A4: '30' });

const graficaDe = (extra: Partial<ObjetoGrafica> = {}): ObjetoGrafica => ({
  id: 'g1',
  tipo: 'columnas',
  datos: 'A1:A4',
  leyenda: true,
  ancla: { col: 3, fila: 0, cols: 8, filas: 15 },
  ...extra,
});

const caja = (c0: number, f0: number, c1: number, f1: number): Caja => ({ c0, f0, c1, f1 });

const ctxDe = (motor: Motor, sel: Caja): ContextoCinta => ({ motor, hoja: 'h1', sel });

/** El alto de una barra, leído del SVG. Se mide el dibujo, nunca el estado. */
const altoDeBarra = (raiz: HTMLElement, marca: string): number =>
  Number(raiz.querySelector(`[data-barra="${marca}"]`)?.getAttribute('height') ?? NaN);

function pintar(g: ObjetoGrafica, libro: Libro) {
  const motor = crearMotor(libro, CONTEXTO);
  const salida = render(<Grafica grafica={g} motor={motor} hoja="h1" />);
  return { ...salida, motor };
}

/* ── (1) los comandos, como datos ───────────────────────────────────────────*/

describe('los cuatro comandos de gráfica son datos', () => {
  test('insertar una gráfica es un gesto, y reproducirlo dos veces da el mismo libro', () => {
    const partida = LIBRO_BASE();
    const macro: Gesto[] = [
      { comando: 'insertarGrafica', args: { hoja: 'h1', id: 'g1', tipo: 'columnas', datos: 'A1:A4' } },
      { comando: 'cambiarGrafica', args: { hoja: 'h1', id: 'g1', campo: 'titulo', valor: 'Ventas' } },
    ];
    const una = reproducir(partida, macro);
    const otra = reproducir(partida, macro);

    // El mismo libro DOS veces: es la prueba del bloque 55, y es la que un `id`
    // fabricado al aplicar —un contador, un reloj— rompe al primer intento.
    expect(otra).toEqual(una);
    expect(una.hojas[0].graficas).toEqual([
      {
        id: 'g1',
        tipo: 'columnas',
        datos: 'A1:A4',
        leyenda: true,
        titulo: 'Ventas',
        // El ancla que nadie pidió sale de los datos y por eso es determinista.
        ancla: { col: 2, fila: 0, cols: 8, filas: 15 },
      },
    ]);
    // Y el libro de partida no se tocó: sigue sin una sola gráfica.
    expect(partida.hojas[0].graficas).toBeUndefined();
  });

  test('cambiarGrafica toca las partes del bloque 18, y rechaza un campo inventado', () => {
    const libro = reproducir(LIBRO_BASE(), [
      { comando: 'insertarGrafica', args: { hoja: 'h1', id: 'g1', tipo: 'columnas', datos: 'A1:A4' } },
    ]);
    const con = (campo: string, valor: string | number): ObjetoGrafica =>
      reproducir(libro, [{ comando: 'cambiarGrafica', args: { hoja: 'h1', id: 'g1', campo, valor } }])
        .hojas[0].graficas![0];

    expect(con('titulo', 'Ventas del mes').titulo).toBe('Ventas del mes');
    expect(con('ejeX', 'Mes').ejeX).toBe('Mes');
    expect(con('ejeY', 'Pesos').ejeY).toBe('Pesos');
    expect(con('leyenda', 0).leyenda).toBe(false);
    expect(con('rotulosDeDato', 1).rotulosDeDato).toBe(true);
    expect(con('tipo', 'circular').tipo).toBe('circular');
    expect(con('minY', 88).minY).toBe(88);
    // Un valor vacío QUITA el corte del eje: no lo pone en cero. Con un 0
    // guardado, una gráfica de negativos se quedaría media fuera del marco.
    expect(con('minY', 88)).toHaveProperty('minY');
    expect(
      reproducir(libro, [
        { comando: 'cambiarGrafica', args: { hoja: 'h1', id: 'g1', campo: 'minY', valor: 88 } },
        { comando: 'cambiarGrafica', args: { hoja: 'h1', id: 'g1', campo: 'minY', valor: '' } },
      ]).hojas[0].graficas![0],
    ).not.toHaveProperty('minY');

    // Un tipo que no existe se rechaza; un campo que no existe, también.
    expect(revisar(libro, { comando: 'cambiarGrafica', args: { hoja: 'h1', id: 'g1', campo: 'color', valor: 'rojo' } }))
      .toMatch(/no es algo que se le pueda cambiar/);
  });

  test('mover conserva el tamaño, borrar la quita, y las dos avisan si no existe', () => {
    const libro = reproducir(LIBRO_BASE(), [
      { comando: 'insertarGrafica', args: { hoja: 'h1', id: 'g1', tipo: 'columnas', datos: 'A1:A4' } },
    ]);

    const movida = reproducir(libro, [{ comando: 'moverGrafica', args: { hoja: 'h1', id: 'g1', col: 5, fila: 7 } }]);
    expect(movida.hojas[0].graficas![0].ancla).toEqual({ col: 5, fila: 7, cols: 8, filas: 15 });

    const borrada = reproducir(libro, [{ comando: 'borrarGrafica', args: { hoja: 'h1', id: 'g1' } }]);
    expect(borrada.hojas[0].graficas).toEqual([]);

    for (const comando of ['moverGrafica', 'cambiarGrafica', 'borrarGrafica']) {
      expect(revisar(borrada, { comando, args: { hoja: 'h1', id: 'g1', campo: 'titulo', valor: 'x' } })).toBe(
        'esa gráfica no existe',
      );
    }
  });

  test('insertar dos veces la misma gráfica avisa, y no deja dos con el mismo nombre', () => {
    const g: Gesto = { comando: 'insertarGrafica', args: { hoja: 'h1', id: 'g1', tipo: 'columnas', datos: 'A1:A4' } };
    const motor = crearMotor(LIBRO_BASE(), CONTEXTO);
    expect(ejecutar(motor, g)).toBeNull();
    const aviso = ejecutar(motor, g);
    expect(aviso).toMatch(/ya está hecha/);
    expect(motor.libro.hojas[0].graficas).toHaveLength(1);

    // Y lo que no es un rango tampoco entra al libro.
    expect(
      revisar(motor.libro, { comando: 'insertarGrafica', args: { hoja: 'h1', id: 'g2', tipo: 'columnas', datos: 'perro' } }),
    ).toMatch(/no es un rango/);
    expect(
      revisar(motor.libro, { comando: 'insertarGrafica', args: { hoja: 'h1', id: 'g2', tipo: 'tarta', datos: 'A1:A4' } }),
    ).toMatch(/no es un tipo de gráfica/);
  });

  test('una gráfica no ensucia ni una celda: los cuatro `toca` son vacíos', () => {
    const libro = reproducir(LIBRO_BASE(), [
      { comando: 'insertarGrafica', args: { hoja: 'h1', id: 'g1', tipo: 'columnas', datos: 'A1:A4' } },
    ]);
    // Ninguna celda lee una gráfica —no existe `=GRAFICA()`—, así que insertarla,
    // moverla, cambiarla o borrarla no obliga a recalcular nada.
    const gestos: Gesto[] = [
      { comando: 'insertarGrafica', args: { hoja: 'h1', id: 'g2', tipo: 'lineas', datos: 'A1:A4' } },
      { comando: 'cambiarGrafica', args: { hoja: 'h1', id: 'g1', campo: 'titulo', valor: 'x' } },
      { comando: 'moverGrafica', args: { hoja: 'h1', id: 'g1', col: 1, fila: 1 } },
      { comando: 'borrarGrafica', args: { hoja: 'h1', id: 'g1' } },
    ];
    for (const g of gestos) expect(celdasQueToca(libro, g)).toEqual([]);
  });
});

/* ── (2) la cinta ───────────────────────────────────────────────────────────*/

describe('los tres botones de gráfica', () => {
  test('emiten insertarGrafica con el rango marcado y un id que sale de la selección', () => {
    const motor = crearMotor(LIBRO_BASE(), CONTEXTO);
    const ctx = ctxDe(motor, caja(0, 0, 0, 3));

    expect(gestosDe(ctx, 'grafico-columnas')).toEqual([
      { comando: 'insertarGrafica', args: { hoja: 'h1', id: 'g-h1-A1-A4-columnas', tipo: 'columnas', datos: 'A1:A4' } },
    ]);
    // Dos pulsaciones, el mismo id: no hay contador ni reloj de por medio.
    expect(gestosDe(ctx, 'grafico-columnas')).toEqual(gestosDe(ctx, 'grafico-columnas'));
    // Y cada tipo tiene el suyo, para que comparar columnas con líneas —que es
    // el bloque 37— no choque contra la gráfica que ya existe.
    expect(gestosDe(ctx, 'grafico-lineas')?.[0].args?.id).toBe('g-h1-A1-A4-lineas');
    expect(gestosDe(ctx, 'grafico-circular')?.[0].args?.tipo).toBe('circular');
  });

  test('están construidos, se apagan con una sola celda y dicen por qué', () => {
    const motor = crearMotor(LIBRO_BASE(), CONTEXTO);
    const unaSola = ctxDe(motor, caja(0, 1, 0, 1));
    for (const id of ['grafico-columnas', 'grafico-lineas', 'grafico-circular']) {
      expect(CONTROLES[id]).toBeDefined();
      expect(SIN_CONSTRUIR.has(id)).toBe(false);
      expect(estaInerte(unaSola, id)).toBe(true);
      expect(razonInerte(unaSola, id)).toMatch(/marca antes la columna/i);
      expect(gestosDe(unaSola, id)).toBeNull();
      // La ficha del modo guía lleva dentro la lección del bloque 37: se elige
      // por lo que se quiere decir, no por la que se ve bonita.
      expect(QUE_HACE_EXCEL[id]).toBeDefined();
    }
    expect(QUE_HACE_EXCEL['grafico-columnas']).toMatch(/no por la que se ve bonita/);
  });

  test('pulsar el botón y reproducir lo que grabó dan el MISMO libro', () => {
    const partida = LIBRO_BASE();
    const motor = crearMotor(partida, CONTEXTO);
    const grabadora = nuevaGrabadora();
    grabadora.grabando = true;

    const gestos = gestosDe(ctxDe(motor, caja(0, 0, 0, 3)), 'grafico-columnas');
    expect(gestos).not.toBeNull();
    expect(ejecutarVarios(motor, gestos ?? [], grabadora).ok).toBe(true);

    // Lo que la macro guardó basta para volver a dejar el libro igual: si el
    // botón hubiera tocado el libro por su cuenta, aquí faltaría la gráfica.
    expect(reproducir(partida, grabadora.gestos)).toEqual(motor.libro);
  });
});

/* ── (3) el dibujo lee del motor ────────────────────────────────────────────*/

describe('la gráfica lee del motor y no se guarda nada', () => {
  test('cambiar A3 cambia la altura de la barra, sin tocar la gráfica', () => {
    const motor = crearMotor(LIBRO_BASE(), CONTEXTO);
    const g = graficaDe();
    const { container, rerender } = render(<Grafica grafica={g} motor={motor} hoja="h1" />);
    const antes = altoDeBarra(container, '0-1');
    expect(antes).toBeGreaterThan(0);

    // Se escribe en la celda por el camino de siempre. La gráfica no se toca.
    expect(ejecutar(motor, escribirEn('h1', 'A3', '60'))).toBeNull();
    rerender(<Grafica grafica={g} motor={motor} hoja="h1" />);

    const despues = altoDeBarra(container, '0-1');
    expect(despues).toBeGreaterThan(antes);
    // Y la que era la más alta (30) ya no lo es: la escala entera se rehízo.
    expect(despues).toBeGreaterThan(altoDeBarra(container, '0-2'));
  });

  test('borrar la fila de la que come no deja el dibujo con datos viejos', () => {
    const motor = crearMotor(LIBRO_BASE(), CONTEXTO);
    const g = graficaDe();
    const { container, rerender } = render(<Grafica grafica={g} motor={motor} hoja="h1" />);
    const segundaAntes = altoDeBarra(container, '0-1'); // el 20
    const terceraAntes = altoDeBarra(container, '0-2'); // el 30

    // Se borra la fila 3 (el 20). Suben las de abajo: A3 pasa a valer 30.
    expect(ejecutar(motor, { comando: 'borrarFila', args: { hoja: 'h1', fila: 2, cuantas: 1 } })).toBeNull();
    rerender(<Grafica grafica={g} motor={motor} hoja="h1" />);

    // La segunda barra ya no mide lo que medía: mide lo que mide el dato que
    // ahora está ahí. Un dibujo con datos guardados dentro no se habría enterado.
    expect(altoDeBarra(container, '0-1')).not.toBeCloseTo(segundaAntes, 5);
    expect(altoDeBarra(container, '0-1')).toBeCloseTo(terceraAntes, 5);
    // Y la tercera desapareció, porque ahí ya no hay nada. Un hueco no es un cero.
    expect(container.querySelector('[data-barra="0-2"]')).toBeNull();
  });

  test('el eje cortado (minY) dispara la proporción entre dos barras — la clase 38', () => {
    const libro = libroCon({ A1: 'Total', A2: '90', A3: '95', A4: '100' });

    const entera = pintar(graficaDe(), libro);
    const primeraHonesta = altoDeBarra(entera.container, '0-0');
    const proporcionHonesta = primeraHonesta / altoDeBarra(entera.container, '0-2');
    entera.unmount();

    const cortada = pintar(graficaDe({ minY: 88 }), libro);
    const primeraCortada = altoDeBarra(cortada.container, '0-0');
    const proporcionCortada = primeraCortada / altoDeBarra(cortada.container, '0-2');
    cortada.unmount();

    // Los tres números son los mismos. Lo único que cambió es dónde empieza el
    // eje, y con eso 90 frente a 100 pasa de «casi lo mismo» a «la sexta parte».
    expect(proporcionHonesta).toBeCloseTo(0.9, 2);
    expect(proporcionCortada).toBeLessThan(0.25);
    expect(primeraCortada).toBeLessThan(primeraHonesta);
  });
});

/* ── (4) lo que un alumno hace el primer día ────────────────────────────────*/

describe('ninguno de los cinco tipos revienta', () => {
  const LIBRO_SUCIO = (): Libro =>
    libroCon({
      A1: '5', // una sola celda
      C1: '3',
      C3: '8', // con huecos: C2, C4 y C5 vacías
      D1: 'perro',
      D2: 'gato',
      D3: 'loro',
      D4: 'pez', // puro texto
      E1: '4',
      E2: '=1/0', // un #¡DIV/0! dentro
      E3: '9',
      F1: '-5',
      F2: '-10',
      F3: '-2',
      F4: '-8', // todos negativos
    });

  test('con una celda, con huecos, con texto, con #¡DIV/0! y con negativos', () => {
    const motor = crearMotor(LIBRO_SUCIO(), CONTEXTO);
    const tipos: ObjetoGrafica['tipo'][] = ['columnas', 'barras', 'lineas', 'circular', 'dispersion'];
    const rangos = ['A1', 'C1:C5', 'D1:D4', 'E1:E3', 'F1:F4'];

    for (const tipo of tipos) {
      for (const datos of rangos) {
        const g = graficaDe({ tipo, datos, id: `${tipo}-${datos}` });
        // Veinticinco pintadas y ni una excepción. Aquí el error es un valor.
        const montar = () => render(<Grafica grafica={g} motor={motor} hoja="h1" />);
        expect(montar).not.toThrow();
        montar().unmount();
      }
    }
  });

  test('un pastel de números negativos no lanza: los deja fuera y lo dice', () => {
    const { container, unmount } = pintar(
      graficaDe({ tipo: 'circular', datos: 'F1:F4' }),
      LIBRO_SUCIO(),
    );
    // Ni una rebanada, porque no hay nada que repartir…
    expect(container.querySelectorAll('[data-rebanada]')).toHaveLength(0);
    // …y la gráfica lo dice en voz alta, que es lo contrario del eje cortado:
    // aquello es una mentira que la clase enseña a destapar, y esto es un dato
    // que no cabe en este dibujo.
    expect(screen.getByText(/pedazo negativo no existe/)).toBeTruthy();
    unmount();
  });

  test('un pastel reparte sólo la primera serie, y avisa de que hay más', () => {
    const libro = libroCon({
      A1: 'Cosa',
      B1: 'Ahora',
      C1: 'Antes',
      A2: 'Papel',
      B2: '30',
      C2: '10',
      A3: 'Vidrio',
      B3: '50',
      C3: '20',
      A4: 'Metal',
      B4: '20',
      C4: '70',
    });
    const { container, unmount } = pintar(graficaDe({ tipo: 'circular', datos: 'A1:C4' }), libro);
    expect(container.querySelectorAll('[data-rebanada]')).toHaveLength(3);
    expect(screen.getByText(/una sola serie/)).toBeTruthy();
    unmount();
  });
});

/* ── (5) las partes de una gráfica · bloque 18 ──────────────────────────────*/

describe('las partes que se ponen y se quitan', () => {
  test('título, ejes, leyenda y rótulos de dato aparecen sólo si se piden', () => {
    const desnuda = pintar(graficaDe({ leyenda: false }), LIBRO_BASE());
    expect(desnuda.container.querySelector('[data-rotulo="titulo"]')).toBeNull();
    expect(desnuda.container.querySelector('[data-rotulo="ejeX"]')).toBeNull();
    expect(desnuda.container.querySelector('[data-rotulo="ejeY"]')).toBeNull();
    expect(desnuda.container.querySelector('[data-leyenda]')).toBeNull();
    desnuda.unmount();

    const vestida = pintar(
      graficaDe({ titulo: 'Ventas', ejeX: 'Mes', ejeY: 'Pesos', rotulosDeDato: true }),
      LIBRO_BASE(),
    );
    expect(vestida.container.querySelector('[data-rotulo="titulo"]')?.textContent).toBe('Ventas');
    expect(vestida.container.querySelector('[data-rotulo="ejeX"]')?.textContent).toBe('Mes');
    expect(vestida.container.querySelector('[data-rotulo="ejeY"]')?.textContent).toBe('Pesos');
    expect(vestida.container.querySelector('[data-leyenda]')).not.toBeNull();
    // El rótulo de dato es el número escrito encima de la barra.
    expect(screen.getAllByText('20').length).toBeGreaterThan(0);
    vestida.unmount();
  });

  test('la primera fila de rótulos y la primera columna de nombres se adivinan solas', () => {
    const libro = libroCon({
      A1: 'Mes',
      B1: 'Ingresos',
      C1: 'Gastos',
      A2: 'Enero',
      B2: '100',
      C2: '40',
      A3: 'Febrero',
      B3: '120',
      C3: '55',
    });
    const motor = crearMotor(libro, CONTEXTO);
    const leido = leerDatos(motor, 'h1', graficaDe({ datos: 'A1:C3' }));

    expect(leido.categorias).toEqual(['Enero', 'Febrero']);
    expect(leido.series).toEqual([
      { nombre: 'Ingresos', puntos: [100, 120] },
      { nombre: 'Gastos', puntos: [40, 55] },
    ]);

    // Y puesto a mano, manda: sin encabezado, «Mes» y «Ingresos» pasan a ser
    // datos —que no son números, así que son huecos— y las series se quedan sin
    // nombre propio. Es la salida para la tabla cuyo encabezado es un año.
    const crudo = leerDatos(motor, 'h1', graficaDe({ datos: 'A1:C3', rotulosEnPrimeraFila: false }));
    expect(crudo.categorias).toEqual(['Mes', 'Enero', 'Febrero']);
    expect(crudo.series[0]).toEqual({ nombre: 'Serie 1', puntos: [null, 100, 120] });
  });

  test('un hueco corta la línea en vez de inventar el dato que falta', () => {
    const libro = libroCon({ A1: 'Total', A2: '5', A4: '8', A5: '3' });
    const { container, unmount } = pintar(graficaDe({ tipo: 'lineas', datos: 'A1:A5' }), libro);
    const d = container.querySelector('[data-linea="0"]')?.getAttribute('d') ?? '';
    // Dos tramos: uno para el punto suelto y otro para los dos de después. Con
    // un solo `M` la línea habría pasado por encima del mes que nadie midió.
    expect((d.match(/M/g) ?? []).length).toBe(2);
    expect(container.querySelectorAll('[data-punto]')).toHaveLength(3);
    unmount();
  });

  test('la dispersión enfrenta dos columnas, y avisa cuando sólo le dan una', () => {
    const libro = libroCon({ A1: '1', B1: '10', A2: '2', B2: '30', A3: '4', B3: '20' });
    const dos = pintar(graficaDe({ tipo: 'dispersion', datos: 'A1:B3' }), libro);
    expect(dos.container.querySelectorAll('[data-punto]')).toHaveLength(3);
    expect(dos.container.querySelector('[data-rotulo="aviso"]')).toBeNull();
    dos.unmount();

    const una = pintar(graficaDe({ tipo: 'dispersion', datos: 'A1:A3' }), libro);
    expect(screen.getByText(/enfrenta dos columnas/)).toBeTruthy();
    una.unmount();
  });
});

/* ── (6) la escala, sin épsilons ────────────────────────────────────────────*/

describe('la escala y sus marcas', () => {
  test('el eje empieza en cero, baja si hay negativos, y minY manda sobre los dos', () => {
    expect(escalaDe([10, 20, 30])).toEqual({ min: 0, max: 30 });
    expect(escalaDe([-5, 20])).toEqual({ min: -5, max: 20 });
    expect(escalaDe([90, 100], 88)).toEqual({ min: 88, max: 100 });
    // Todos iguales no es una división por cero: es un dibujo plano.
    expect(escalaDe([7, 7, 7]).max).toBeGreaterThan(escalaDe([7, 7, 7]).min);
    // Y sin un solo número, tampoco revienta.
    expect(escalaDe([])).toEqual({ min: 0, max: 1 });
  });

  test('las marcas caen en números que se pueden decir en voz alta, sin colas de decimales', () => {
    expect(marcasDeEje(0, 1)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
    // Cuatro marcas y no seis: el escalón sube al 10 antes que caer en un 6, que
    // es un número que nadie dice en voz alta. Se pide un eje legible, no un eje
    // con exactamente cinco rayas.
    expect(marcasDeEje(0, 30)).toEqual([0, 10, 20, 30]);
    expect(marcasDeEje(-10, 10)).toEqual([-10, -5, 0, 5, 10]);
    // Ni un 0.30000000000000004: el bucle va sobre escalones enteros y
    // multiplica, en vez de ir sumando el paso.
    for (const v of marcasDeEje(0, 1)) expect(String(v)).not.toMatch(/000000|999999/);
    // Un eje imposible no cuelga la pestaña: contesta algo y se calla.
    expect(marcasDeEje(5, 5)).toEqual([5]);
  });
});

/* ── (7) la ventana ─────────────────────────────────────────────────────────*/

describe('la gráfica dentro de la ventana', () => {
  beforeAll(() => {
    if (typeof Element.prototype.scrollTo !== 'function') {
      Element.prototype.scrollTo = function scrollTo() {};
    }
  });

  const GUION_LIBRE: GuionHojas = {
    archivo: 'Mi primera gráfica.xlsx',
    libro: () =>
      libroCon({ A1: 'Total', A2: '10', A3: '20', A4: '30' }, [
        { id: 'g1', tipo: 'columnas', datos: 'A1:A4', leyenda: true, ancla: { col: 3, fila: 1, cols: 6, filas: 10 } },
      ]),
    pasos: [
      {
        id: 'libre',
        titulo: 'Trastea',
        instruccion: 'Aquí no se pide nada.',
        pista: 'Nada.',
        logro: { tipo: 'documento', comprueba: () => false },
        aprendido: 'Nada.',
      },
    ],
  };

  test('se pinta en su ancla, se selecciona al pulsarla, y su sitio es una multiplicación', async () => {
    render(<VentanaHojas cinta={CINTA_EXCEL_BASICO} guion={GUION_LIBRE} />);
    await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());

    const dibujo = document.querySelector('[data-grafica="g1"]') as HTMLElement;
    expect(dibujo).not.toBeNull();
    // Celdas por ancho de celda, sin medir nada del DOM (§39).
    expect(dibujo.style.width).toBe(`${6 * ANCHO_COL}px`);
    expect(dibujo.style.height).toBe(`${10 * ALTO_FILA}px`);
    // Y dentro está el dibujo de verdad, con sus tres barras.
    expect(dibujo.querySelectorAll('[data-barra]')).toHaveLength(3);

    expect(dibujo.className).not.toMatch(/es-activa/);
    fireEvent.mouseDown(dibujo);
    expect(dibujo.className).toMatch(/es-activa/);
    fireEvent.mouseUp(window);
  });

  test('el lienzo de la gráfica mide lo mismo que la rejilla de la ventana', () => {
    // Las dos parejas de constantes están escritas en dos archivos porque la
    // ventana importa la gráfica y traerlas de vuelta cerraría un círculo. Que
    // estén en dos sitios se mide aquí: un aviso en un comentario no es una
    // medida, y el día que la rejilla cambie de tamaño esto falla el mismo día.
    expect(COL_PX).toBe(ANCHO_COL);
    expect(FILA_PX).toBe(ALTO_FILA);
  });
});
