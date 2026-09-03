/**
 * `of-excel-tabla-dinamica` · «Tu primera tabla dinámica» (bloques 49 · 50).
 * La quinta clase exclusiva del grado Avanzado de Tecnia Hojas.
 *
 * Se juega MAL a propósito, que es la regla de la casa: un origen de una sola
 * fila, un origen con una columna sin encabezado, el mismo campo a la vez en
 * filas y en columnas, resumir con suma una columna de texto, escribir dentro
 * de la dinámica, y creerse el número viejo por no haber actualizado. Y hay un
 * recorrido de la clase entera, de principio a fin, porque es la única forma de
 * cazar un encadenamiento roto — y aquí el riesgo es máximo: mover un campo y
 * actualizar cambian TODOS los números de la dinámica.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { CINTA_EXCEL_AVANZADO } from '@/components/activities/office/tecniaHojas';
import {
  CUANTAS_VENTAS,
  CUENTA_BEBIDAS,
  GUION_TABLA_DINAMICA,
  SUMA_UNIFORMES,
  SUMA_UNIFORMES_ENERO,
  TOTAL_CORREGIDO,
  TOTAL_GENERAL,
} from '@/components/activities/office/excel/tabla-dinamica/guion';
import PanelDinamica from '@/components/activities/office/excel/comun/PanelDinamica';
import CONTROLES_DINAMICA from '@/components/activities/office/excel/comun/controlesDinamica';

beforeAll(() => {
  if (typeof Element.prototype.scrollTo !== 'function') {
    Element.prototype.scrollTo = function scrollTo() {};
  }
});

const PANEL_FIJO = { titulo: 'Tabla dinámica', Cuerpo: PanelDinamica };

async function abrir() {
  const salida = render(
    <VentanaHojas
      cinta={CINTA_EXCEL_AVANZADO}
      guion={GUION_TABLA_DINAMICA}
      panelFijo={PANEL_FIJO}
      controles={CONTROLES_DINAMICA}
    />,
  );
  await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
  return salida;
}

async function abrirYEmpezar() {
  const salida = await abrir();
  fireEvent.click(screen.getByText('Abrir el libro'));
  await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());
  return salida;
}

const celda = (direccion: string): HTMLElement => document.querySelector(`[data-celda="${direccion}"]`) as HTMLElement;

/** Lo que la DINÁMICA pinta en esa celda de la hoja. `null` si ahí no pinta nada. */
const din = (direccion: string): HTMLElement | null => document.querySelector(`[data-dinamica="${direccion}"]`);

const texto = (direccion: string): string => din(direccion)?.textContent ?? '';

const rol = (direccion: string): string => din(direccion)?.getAttribute('data-din-rol') ?? '';

const boton = (control: string): HTMLElement => document.querySelector(`[data-control="${control}"]`) as HTMLElement;

const botonCampo = (campo: number, zona: string): HTMLElement =>
  document.querySelector(`[data-control="campo-dinamica"][data-campo="${campo}"][data-zona="${zona}"]`) as HTMLElement;

const rejilla = (): HTMLElement => document.querySelector('.hjw-rejilla') as HTMLElement;

const encargo = (): string => document.querySelector('.txtw-encargo h3')?.textContent ?? '';

const aviso = (): string => document.querySelector('.txtw-aviso')?.textContent ?? '';

const opcion = (texto: string): HTMLElement =>
  Array.from(document.querySelectorAll<HTMLElement>('.txtw-opcion')).find((b) => b.textContent === texto) as HTMLElement;

async function celebrar() {
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
}

function teclear(direccion: string, valor: string) {
  fireEvent.mouseDown(celda(direccion));
  fireEvent.keyDown(rejilla(), { key: valor[0] });
  const editor = document.querySelector('.hjw-editor') as HTMLInputElement;
  fireEvent.change(editor, { target: { value: valor } });
  fireEvent.keyDown(editor, { key: 'Enter' });
}

function marcar(desde: string, hasta?: string) {
  fireEvent.mouseDown(celda(desde));
  if (hasta) fireEvent.mouseDown(celda(hasta), { shiftKey: true });
}

/** El cuadro de nombres, que es como el encargo 1 llega al último renglón. */
function irA(direccion: string) {
  const cuadro = screen.getByLabelText('Cuadro de nombres');
  fireEvent.change(cuadro, { target: { value: direccion } });
  fireEvent.keyDown(cuadro, { key: 'Enter' });
}

function crearDinamica(donde = 'I2') {
  fireEvent.change(screen.getByLabelText('Dónde ponerla'), { target: { value: donde } });
  fireEvent.click(boton('crear-dinamica'));
}

const CATEGORIA = 2;
const PRODUCTO = 3;
const MES = 1;
const IMPORTE = 6;

const aZona = (campo: number, zona: string) => fireEvent.click(botonCampo(campo, zona));

const resumir = (nombre: string, resumen: string) =>
  fireEvent.change(screen.getByLabelText(`Resumir ${nombre}`), { target: { value: resumen } });

function agrupar(campo: number, dentroDe: number) {
  fireEvent.change(screen.getByLabelText('Campo que se agrupa'), { target: { value: String(campo) } });
  fireEvent.change(screen.getByLabelText('Dentro de qué campo'), { target: { value: String(dentroDe) } });
  fireEvent.click(boton('agrupar-dinamica'));
}

/** Hasta el encargo 3 resuelto: la dinámica creada y con su primer resumen. */
async function hastaElPrimerResumen() {
  await abrirYEmpezar();
  irA('A301');
  await celebrar();
  marcar('A1');
  crearDinamica();
  await celebrar();
  aZona(CATEGORIA, 'filas');
  aZona(IMPORTE, 'valores');
  await celebrar();
}

/** Hasta el encargo 9 resuelto: producto anidado dentro de categoría. */
async function hastaElAnidado() {
  await hastaElPrimerResumen();
  resumir('Importe', 'cuenta');
  await celebrar();
  resumir('Importe', 'promedio');
  await celebrar();
  fireEvent.click(
    opcion(
      'Ninguno es «el bueno»: cada resumen contesta una pregunta distinta, y hay que decir cuál preguntaste antes de dar el número',
    ),
  );
  await celebrar();
  resumir('Importe', 'suma');
  aZona(MES, 'columnas');
  await celebrar();
  aZona(MES, 'filas');
  await celebrar();
  aZona(MES, 'fuera');
  agrupar(PRODUCTO, CATEGORIA);
  await celebrar();
}

describe('VentanaHojas · of-excel-tabla-dinamica se pinta', () => {
  /*
   * Los números que el guion dice en voz alta —«Uniformes 10 900», «Bebidas 120
   * ventas», «total general 19 749»— salen de los datos generados, no están
   * escritos a mano en el texto por casualidad. Esta prueba ata las dos cosas:
   * si mañana alguien toca el catálogo, se rompe aquí y no en la boca de un
   * maestro que le cuenta al alumno un total que su pantalla no enseña.
   */
  it('los números que la clase cuenta son los que salen de las trescientas ventas', () => {
    expect(CUANTAS_VENTAS).toBe(300);
    expect(TOTAL_GENERAL).toBe(19749);
    expect(SUMA_UNIFORMES).toBe(10900);
    expect(CUENTA_BEBIDAS).toBe(120);
    expect(SUMA_UNIFORMES_ENERO).toBe(7350);
    expect(TOTAL_CORREGIDO).toBe(25599);
  });

  it('la portada anuncia el tema, el libro abre con trescientas ventas y todavía no hay ninguna dinámica', async () => {
    await abrir();
    expect(screen.getByText('Tablas dinámicas: cruzar, resumir, anidar y actualizar')).not.toBeNull();
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

    expect(celda('C1').textContent).toBe('Categoría');
    expect(celda('C2').textContent).toBe('Uniformes');
    expect(celda('E2').textContent).toBe('1');
    expect(celda('G2').textContent).toBe('150'); // =E2*F2, calculado
    expect(document.querySelector('[data-dinamica]')).toBeNull();
    expect(boton('crear-dinamica')).not.toBeNull();
    expect(encargo()).toBe('Trescientas ventas, y una pregunta que no se contesta mirando');
  });
});

describe('VentanaHojas · of-excel-tabla-dinamica, jugando mal a propósito', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('encargos 1 y 2 · un origen de una sola fila y otro sin encabezado se rechazan con sus palabras; desde A1 sale entera', async () => {
    await abrirYEmpezar();
    irA('A301');
    await celebrar();
    expect(encargo()).toBe('Crea la tabla dinámica');

    // JUGAR MAL · sólo la fila de encabezados: no hay nada que resumir.
    marcar('A1', 'G1');
    crearDinamica();
    expect(aviso()).toContain('sólo la fila de encabezados');
    expect(document.querySelector('[data-dinamica]')).toBeNull();

    // JUGAR MAL · una columna de más, que no tiene encabezado.
    marcar('A1', 'H10');
    crearDinamica();
    expect(aviso()).toContain('encabezado de la columna H');
    expect(document.querySelector('[data-dinamica]')).toBeNull();

    // Bien: parado dentro de la lista se toma entera, con sus encabezados.
    marcar('A1');
    crearDinamica();
    await celebrar();

    expect(texto('I2')).toBe('Etiquetas de fila');
    expect(texto('I3')).toBe('Total general');
    expect(encargo()).toBe('La respuesta, en cinco renglones');
  });

  it('encargo 3 · trescientas ventas caben en cinco renglones, y el total general se ve distinto de los datos', async () => {
    await hastaElPrimerResumen();

    expect(texto('I2')).toBe('Etiquetas de fila');
    expect(texto('J2')).toBe('Suma de Importe');
    expect(texto('I3')).toBe('Bebidas');
    expect(texto('J3')).toBe('2870');
    expect(texto('I4')).toBe('Papelería');
    expect(texto('I6')).toBe('Uniformes');
    expect(texto('J6')).toBe('10900');
    expect(texto('I7')).toBe('Total general');
    expect(texto('J7')).toBe('19749');
    // Un dato y una cuenta de un grupo no se pintan igual.
    expect(rol('J3')).toBe('dato');
    expect(rol('J7')).toBe('total');
    expect(din('J8')).toBeNull(); // la dinámica acaba ahí
    expect(encargo()).toBe('La misma tabla, otra pregunta: ¿cuántas veces?');
  });

  it('encargos 4 y 5 · el mismo cruce contesta otra cosa con cuenta y con promedio', async () => {
    await hastaElPrimerResumen();

    resumir('Importe', 'cuenta');
    await celebrar();
    expect(texto('J2')).toBe('Cuenta de Importe');
    expect(texto('J3')).toBe('120'); // Bebidas, la que más veces se vende
    expect(texto('J6')).toBe('30'); // Uniformes, la que más dinero deja
    expect(texto('J7')).toBe('300');
    expect(encargo()).toBe('Y una tercera: ¿cuánto deja una venta?');

    resumir('Importe', 'promedio');
    await celebrar();
    expect(texto('J2')).toBe('Promedio de Importe');
    expect(texto('J6')).toBe('363.333333333333');
    expect(encargo()).toBe('Tres historias, ¿cuál es la verdadera?');
  });

  it('JUGAR MAL · resumir con suma una columna de texto da cero, y quitarla deja la dinámica como estaba', async () => {
    await hastaElPrimerResumen();

    // «Producto» es texto: sumarlo no falla, da 0 — como en Excel.
    aZona(PRODUCTO, 'valores');
    expect(texto('J2')).toBe('Suma de Importe');
    expect(texto('K2')).toBe('Suma de Producto');
    expect(texto('K3')).toBe('0');
    expect(texto('K7')).toBe('0');

    aZona(PRODUCTO, 'fuera');
    expect(din('K2')).toBeNull();
    expect(texto('J7')).toBe('19749');
  });

  it('encargo 7 · el cruce por mes sale en orden alfabético, y donde no hubo ventas no hay un cero', async () => {
    await hastaElPrimerResumen();
    resumir('Importe', 'cuenta');
    await celebrar();
    resumir('Importe', 'promedio');
    await celebrar();
    fireEvent.click(
      opcion(
        'Ninguno es «el bueno»: cada resumen contesta una pregunta distinta, y hay que decir cuál preguntaste antes de dar el número',
      ),
    );
    await celebrar();

    resumir('Importe', 'suma');
    aZona(MES, 'columnas');
    await celebrar();

    // Los meses son TEXTO: abril antes que enero, y junio antes que marzo.
    expect(texto('J3')).toBe('abril');
    expect(texto('K3')).toBe('enero');
    expect(texto('L3')).toBe('febrero');
    expect(texto('M3')).toBe('junio');
    expect(texto('N3')).toBe('marzo');
    expect(texto('O3')).toBe('mayo');
    expect(texto('P3')).toBe('Total general');
    // Uniformes sólo se vendieron en enero y febrero: lo demás está VACÍO.
    expect(texto('I7')).toBe('Uniformes');
    expect(texto('K7')).toBe('7350');
    expect(texto('J7')).toBe('');
    expect(texto('N7')).toBe('');
    expect(texto('P7')).toBe('10900');
    expect(encargo()).toBe('Prueba a ponerlo en los dos sitios');
  });

  it('encargos 8 y 9 · el mismo campo no cabe en los dos ejes, y anidar sangra los productos bajo su categoría', async () => {
    await hastaElAnidado();

    // El mes se MOVIÓ a filas (encargo 8) y después salió de la dinámica (9).
    expect(texto('I3')).toBe('Bebidas');
    expect(texto('I4')).toBe('Agua');
    expect(texto('I12')).toBe('Uniformes');
    expect(texto('I13')).toBe('Playera');
    expect(texto('J13')).toBe('5400');
    expect(texto('I15')).toBe('Total general');
    expect(texto('J15')).toBe('19749');
    // La sangría la pone quien pinta, no el motor: un nivel para el producto.
    expect(celda('I12').style.paddingLeft).toBe('');
    expect(celda('I13').style.paddingLeft).toBe('18px');
    // El subtotal de la categoría no se pinta como un dato suelto.
    expect(rol('J12')).toBe('total');
    expect(rol('J13')).toBe('dato');
    expect(encargo()).toBe('Llega una corrección');
  });

  /*
   * El encargo 9 pide DOS botones y su señal es una lista separada por comas.
   * Hasta el 17-ago-2026 eso dejaba al encargo con aro y sin ficha —el selector
   * buscaba un `data-control` con la coma dentro, que no existe—, o sea sin la
   * frase que explica para qué sirve el botón. El arreglo está en
   * `primeroDeLaSenal` (`VentanaHojas.tsx`) y esta prueba lo sujeta.
   */
  it('un encargo que pide dos botones enseña la ficha del primero, con su para-qué-sirve', async () => {
    await hastaElPrimerResumen();
    resumir('Importe', 'cuenta');
    await celebrar();
    resumir('Importe', 'promedio');
    await celebrar();
    fireEvent.click(
      opcion(
        'Ninguno es «el bueno»: cada resumen contesta una pregunta distinta, y hay que decir cuál preguntaste antes de dar el número',
      ),
    );
    await celebrar();
    resumir('Importe', 'suma');
    aZona(MES, 'columnas');
    await celebrar();
    aZona(MES, 'filas');
    await celebrar();

    expect(encargo()).toBe('Anidar: cada categoría, abierta en sus productos');
    expect(document.querySelector('.txtw-ficha-nombre')?.textContent).toContain('Arrastrar un campo');
    expect(document.querySelector('.txtw-ficha-hace')?.textContent).toContain('Filas y columnas son excluyentes');
  });

  it('encargos 10 y 11 · el origen cambia y la dinámica sigue enseñando lo viejo hasta que se actualiza', async () => {
    await hastaElAnidado();

    teclear('E2', '40');
    await celebrar();

    // La fórmula de la hoja sí se enteró al instante…
    expect(celda('G2').textContent).toBe('6000');
    // …y la dinámica no: sigue con el resumen de la última vez.
    expect(texto('J13')).toBe('5400');
    expect(texto('J12')).toBe('10900');
    expect(texto('J15')).toBe('19749');
    expect(encargo()).toBe('La dinámica no se entera sola');

    fireEvent.click(boton('actualizar-dinamica'));
    await celebrar();

    expect(texto('J13')).toBe('11250');
    expect(texto('J12')).toBe('16750');
    expect(texto('J15')).toBe('25599');
    expect(encargo()).toBe('Corrige un número a mano, a ver qué pasa');
  });

  it('encargo 12 · escribir dentro de la dinámica se rechaza con esas palabras, y el número no se mueve', async () => {
    await hastaElAnidado();
    teclear('E2', '40');
    await celebrar();
    fireEvent.click(boton('actualizar-dinamica'));
    await celebrar();

    // JUGAR MAL · corregir a mano el subtotal de Bebidas.
    teclear('J3', '9999');
    expect(aviso()).toContain('de sólo lectura');
    // La celda se queda en edición con lo escrito, que es lo que hace esta
    // ventana con todo lo que rechaza: nadie pierde su renglón por un aviso.
    const editor = document.querySelector('.hjw-editor') as HTMLInputElement;
    expect(editor.value).toBe('9999');
    fireEvent.keyDown(editor, { key: 'Escape' });
    expect(texto('J3')).toBe('2870');
    expect(encargo()).toBe('Corrige un número a mano, a ver qué pasa');
  });

  it('la clase entera se termina, de principio a fin, con 0 tropiezos', async () => {
    const onTerminado = jest.fn();
    render(
      <VentanaHojas
        cinta={CINTA_EXCEL_AVANZADO}
        guion={GUION_TABLA_DINAMICA}
        panelFijo={PANEL_FIJO}
        controles={CONTROLES_DINAMICA}
        onTerminado={onTerminado}
      />,
    );
    await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

    // 1
    irA('A301');
    await celebrar();
    // 2
    marcar('A1');
    crearDinamica();
    await celebrar();
    // 3
    aZona(CATEGORIA, 'filas');
    aZona(IMPORTE, 'valores');
    await celebrar();
    // 4
    resumir('Importe', 'cuenta');
    await celebrar();
    // 5
    resumir('Importe', 'promedio');
    await celebrar();
    // 6
    fireEvent.click(
      opcion(
        'Ninguno es «el bueno»: cada resumen contesta una pregunta distinta, y hay que decir cuál preguntaste antes de dar el número',
      ),
    );
    await celebrar();
    // 7
    resumir('Importe', 'suma');
    aZona(MES, 'columnas');
    await celebrar();
    // 8
    aZona(MES, 'filas');
    await celebrar();
    // 9
    aZona(MES, 'fuera');
    agrupar(PRODUCTO, CATEGORIA);
    await celebrar();
    // 10
    teclear('E2', '40');
    await celebrar();
    // 11
    fireEvent.click(boton('actualizar-dinamica'));
    await celebrar();
    // 12
    teclear('J3', '9999');
    fireEvent.click(
      opcion(
        'Porque ahí no hay ninguna celda que escribir: lo que se ve es el cruce, que se vuelve a pintar entero cada vez — el dato de verdad está en la lista de la izquierda',
      ),
    );
    await celebrar();
    // 13
    fireEvent.click(
      opcion(
        'Que descubrió sola qué categorías, qué meses y qué productos había, y que cambiar la pregunta —suma, cuenta, promedio, cruzar por mes, anidar por producto— cuesta un clic en vez de reescribir todas las fórmulas',
      ),
    );
    await celebrar();

    expect(screen.getByText('Terminaste')).not.toBeNull();
    expect(onTerminado).toHaveBeenCalledTimes(1);
    expect(onTerminado.mock.calls[0][0]).toMatchObject({ pasos: 13, tropiezos: 0 });
  });
});
