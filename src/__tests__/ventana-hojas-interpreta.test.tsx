/**
 * `n6-interpreta-la-informacion` · «La hoja no la hiciste tú» (temario
 * §45.2, bloques 42 · 40). La séptima clase de Tecnia Hojas.
 *
 * Se juega MAL a propósito (regla de la casa): un número escrito a mano en
 * vez de la fórmula, tapar un `#¡DIV/0!` escribiendo el resultado a mano en
 * vez del dato que faltaba, y un hipervínculo a una hoja que no existe. Y se
 * recorre la clase entera de principio a fin en el último test, con
 * `onTerminado`, para cazar el encargo que se quedó imposible de terminar.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { CINTA_EXCEL_INTERMEDIO_VINCULOS } from '@/components/activities/office/tecniaHojas';
import { GUION_INTERPRETA_LA_INFORMACION } from '@/components/activities/office/excel/interpreta-la-informacion/guion';

beforeAll(() => {
  if (typeof Element.prototype.scrollTo !== 'function') {
    Element.prototype.scrollTo = function scrollTo() {};
  }
});

async function abrir() {
  const salida = render(<VentanaHojas cinta={CINTA_EXCEL_INTERMEDIO_VINCULOS} guion={GUION_INTERPRETA_LA_INFORMACION} />);
  await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
  return salida;
}

async function abrirYEmpezar() {
  const salida = await abrir();
  fireEvent.click(screen.getByText('Abrir el libro'));
  await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());
  return salida;
}

const celda = (direccion: string): HTMLElement =>
  document.querySelector(`[data-celda="${direccion}"]`) as HTMLElement;

const boton = (control: string): HTMLElement =>
  document.querySelector(`[data-control="${control}"]`) as HTMLElement;

const lengueta = (id: string): HTMLElement =>
  document.querySelector(`[data-hoja="${id}"]`) as HTMLElement;

const rejilla = (): HTMLElement => document.querySelector('.hjw-rejilla') as HTMLElement;

const encargo = (): string => document.querySelector('.txtw-encargo h3')?.textContent ?? '';

async function celebrar() {
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
}

function teclear(direccion: string, texto: string) {
  fireEvent.mouseDown(celda(direccion));
  fireEvent.keyDown(rejilla(), { key: texto[0] });
  const editor = document.querySelector('.hjw-editor') as HTMLInputElement;
  fireEvent.change(editor, { target: { value: texto } });
  fireEvent.keyDown(editor, { key: 'Enter' });
}

function irAHoja(id: string) {
  fireEvent.click(lengueta(id));
}

const irAInsertar = () => fireEvent.click(document.querySelector('[data-pestana="insertar"]') as HTMLElement);
const irAFormulas = () => fireEvent.click(document.querySelector('[data-pestana="formulas"]') as HTMLElement);

/** El desplegable de «Hipervínculo»: se abre con el botón y se escribe el destino. */
function escribirEnPanel(control: string, texto: string) {
  fireEvent.click(boton(control));
  const campo = document.querySelector('.hjw-campo-texto') as HTMLInputElement;
  fireEvent.change(campo, { target: { value: texto } });
  fireEvent.click(document.querySelector('.hjw-aplicar') as HTMLElement);
}

const abrirArchivo = () => fireEvent.click(document.querySelector('[data-pestana="archivo"]') as HTMLElement);
const cerrarArchivo = () => fireEvent.click(document.querySelector('[data-hjb="volver"]') as HTMLElement);

describe('VentanaHojas · n6-interpreta-la-informacion se pinta', () => {
  it('la portada anuncia el tema, y el libro abre en el Índice con el enlace roto ya pintado distinto', async () => {
    await abrir();
    expect(screen.getByText('Revisar el libro, ver las fórmulas y navegar con hipervínculos')).not.toBeNull();
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

    expect(celda('A1').textContent).toBe('Cuentas del Club de Ajedrez · ciclo pasado');
    expect(celda('A8').textContent).toBe('→ Ver Borrador');
    expect(celda('A8').className).toContain('es-vinculo-roto');
    // La hoja «Borrador» existe (oculta) pero no se pinta en las lengüetas.
    expect(lengueta('h5')).toBeNull();
    expect(encargo()).toBe('Enciende la tapa');
  });
});

describe('VentanaHojas · n6-interpreta-la-informacion, jugando mal a propósito', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('encargo 1 · Mostrar fórmulas revela el número a mano de Camila entre sus vecinas con regla', async () => {
    await abrirYEmpezar();
    irAHoja('h2');
    irAFormulas();
    fireEvent.click(boton('mostrar-formulas'));
    await celebrar();

    expect(celda('D4').textContent).toBe('=B4*C4');
    // Sin el «=» que tienen sus cuatro vecinas: el número quedó a mano.
    expect(celda('D6').textContent).toBe('140');
    expect(encargo()).toBe('Corrige el número de Camila');
  });

  it('encargo 2 · escribir el número correcto a mano no basta; hace falta la fórmula', async () => {
    await abrirYEmpezar();
    irAHoja('h2');
    irAFormulas();
    fireEvent.click(boton('mostrar-formulas'));
    await celebrar();
    expect(encargo()).toBe('Corrige el número de Camila');

    // JUGAR MAL · el número correcto, pero sin «=»: sigue siendo un dato.
    teclear('D6', '150');
    await celebrar();
    expect(encargo()).toBe('Corrige el número de Camila');

    teclear('D6', '=B6*C6');
    await celebrar();
    // Mostrar fórmulas sigue encendida: D6 enseña la regla, no el resultado.
    expect(celda('D6').textContent).toBe('=B6*C6');
    expect(celda('D9').textContent).toBe('=SUMA(D4:D8)');
    expect(encargo()).toBe('Baja la tapa otra vez');
  });

  it('encargo 3 · Mostrar fórmulas se apaga, y D6 se ve exactamente como sus vecinas', async () => {
    await abrirYEmpezar();
    irAHoja('h2');
    irAFormulas();
    fireEvent.click(boton('mostrar-formulas'));
    await celebrar();
    teclear('D6', '=B6*C6');
    await celebrar();
    expect(encargo()).toBe('Baja la tapa otra vez');

    fireEvent.click(boton('mostrar-formulas'));
    await celebrar();
    expect(celda('D4').textContent).toBe('150');
    expect(celda('D6').textContent).toBe('150');
    expect(encargo()).toBe('Pregúntale al libro lo que a ojo no se ve');
  });

  it('encargo 4 · Inspeccionar libro cuenta 2 errores y 1 hoja escondida antes de arreglar nada', async () => {
    await abrirYEmpezar();
    irAHoja('h2');
    irAFormulas();
    fireEvent.click(boton('mostrar-formulas'));
    await celebrar();
    teclear('D6', '=B6*C6');
    await celebrar();
    fireEvent.click(boton('mostrar-formulas'));
    await celebrar();
    expect(encargo()).toBe('Pregúntale al libro lo que a ojo no se ve');

    abrirArchivo();
    fireEvent.click(document.querySelector('[data-hjb-inspeccionar]') as HTMLElement);
    const partes = document.querySelectorAll('[data-hjb-parte] li');
    expect(partes[1].textContent).toContain('2');
    expect(partes[1].textContent).toContain('error');
    expect(partes[2].textContent).toContain('1');
    expect(partes[2].textContent).toContain('escondida');
    cerrarArchivo();
    await celebrar();
    expect(encargo()).toBe('Un #¡REF! cuenta que alguien borró algo');
  });

  it('encargo 5 · el #¡REF! se lee como una historia y no como un cero, y se arregla editando la fórmula', async () => {
    await abrirYEmpezar();
    irAHoja('h2');
    irAFormulas();
    fireEvent.click(boton('mostrar-formulas'));
    await celebrar();
    teclear('D6', '=B6*C6');
    await celebrar();
    fireEvent.click(boton('mostrar-formulas'));
    await celebrar();
    abrirArchivo();
    fireEvent.click(document.querySelector('[data-hjb-inspeccionar]') as HTMLElement);
    cerrarArchivo();
    await celebrar();
    expect(encargo()).toBe('Un #¡REF! cuenta que alguien borró algo');

    irAHoja('h3');
    // El error se ve como error, no como un 0 que alguien pudiera confundir con un dato.
    expect(celda('D5').textContent).toBe('#¡REF!');

    teclear('D5', '=B5-C5');
    await celebrar();
    expect(celda('D5').textContent).toBe('600');
    expect(encargo()).toBe('Un #¡DIV/0! cuenta que falta un dato');
  });

  it('encargo 6 · el #¡DIV/0! no se tapa escribiendo el resultado; se arregla con el dato que faltaba', async () => {
    await abrirYEmpezar();
    irAHoja('h2');
    irAFormulas();
    fireEvent.click(boton('mostrar-formulas'));
    await celebrar();
    teclear('D6', '=B6*C6');
    await celebrar();
    fireEvent.click(boton('mostrar-formulas'));
    await celebrar();
    abrirArchivo();
    fireEvent.click(document.querySelector('[data-hjb-inspeccionar]') as HTMLElement);
    cerrarArchivo();
    await celebrar();
    irAHoja('h3');
    teclear('D5', '=B5-C5');
    await celebrar();
    expect(encargo()).toBe('Un #¡DIV/0! cuenta que falta un dato');

    irAHoja('h4');
    expect(celda('B5').textContent).toBe('#¡DIV/0!');

    // JUGAR MAL · tapar el error escribiendo el resultado a mano en B5, sin
    // tocar el dato que de verdad faltaba (B4). La fórmula deja de ser fórmula.
    teclear('B5', '160');
    await celebrar();
    expect(encargo()).toBe('Un #¡DIV/0! cuenta que falta un dato');

    // Se deja la fórmula como estaba y se rellena el dato que faltaba.
    teclear('B5', '=B3/B4');
    teclear('B4', '5');
    await celebrar();
    expect(celda('B5').textContent).toBe('160');
    expect(encargo()).toBe('El primer salto del índice');
  });

  it('encargos 7 a 9 · el índice se termina con tres hipervínculos, rechazando un destino que no existe', async () => {
    await abrirYEmpezar();
    irAHoja('h2');
    irAFormulas();
    fireEvent.click(boton('mostrar-formulas'));
    await celebrar();
    teclear('D6', '=B6*C6');
    await celebrar();
    fireEvent.click(boton('mostrar-formulas'));
    await celebrar();
    abrirArchivo();
    fireEvent.click(document.querySelector('[data-hjb-inspeccionar]') as HTMLElement);
    cerrarArchivo();
    await celebrar();
    irAHoja('h3');
    teclear('D5', '=B5-C5');
    await celebrar();
    irAHoja('h4');
    teclear('B4', '5');
    await celebrar();
    expect(encargo()).toBe('El primer salto del índice');

    irAHoja('h1');
    fireEvent.mouseDown(celda('A5'));
    irAInsertar();
    // JUGAR MAL · un hipervínculo a una hoja que no existe se rechaza al crearlo.
    escribirEnPanel('hipervinculo', 'h9!A1');
    expect(document.querySelector('.txtw-aviso')).not.toBeNull();
    expect(celda('A5').className).not.toContain('es-vinculo');
    escribirEnPanel('hipervinculo', 'h2!A1');
    await celebrar();
    expect(celda('A5').className).toContain('es-vinculo');
    expect(encargo()).toBe('El segundo salto');

    fireEvent.mouseDown(celda('A6'));
    escribirEnPanel('hipervinculo', 'h3!A1');
    await celebrar();
    expect(encargo()).toBe('El tercer salto');

    fireEvent.mouseDown(celda('A7'));
    escribirEnPanel('hipervinculo', 'h4!A1');
    await celebrar();
    expect(encargo()).toBe('El enlace que no lleva a ningún lado');
  });

  it('encargo 10 · el enlace roto se quita, sin escribir nada', async () => {
    await abrirYEmpezar();
    irAHoja('h2');
    irAFormulas();
    fireEvent.click(boton('mostrar-formulas'));
    await celebrar();
    teclear('D6', '=B6*C6');
    await celebrar();
    fireEvent.click(boton('mostrar-formulas'));
    await celebrar();
    abrirArchivo();
    fireEvent.click(document.querySelector('[data-hjb-inspeccionar]') as HTMLElement);
    cerrarArchivo();
    await celebrar();
    irAHoja('h3');
    teclear('D5', '=B5-C5');
    await celebrar();
    irAHoja('h4');
    teclear('B4', '5');
    await celebrar();
    irAHoja('h1');
    fireEvent.mouseDown(celda('A5'));
    irAInsertar();
    escribirEnPanel('hipervinculo', 'h2!A1');
    await celebrar();
    fireEvent.mouseDown(celda('A6'));
    escribirEnPanel('hipervinculo', 'h3!A1');
    await celebrar();
    fireEvent.mouseDown(celda('A7'));
    escribirEnPanel('hipervinculo', 'h4!A1');
    await celebrar();
    expect(encargo()).toBe('El enlace que no lleva a ningún lado');

    fireEvent.mouseDown(celda('A8'));
    fireEvent.click(boton('quitar-hipervinculo'));
    await celebrar();
    expect(celda('A8').className).not.toContain('es-vinculo');
    expect(celda('A8').textContent).toBe('→ Ver Borrador');
  });

  it('la clase entera se termina de un tirón, sin ningún tropiezo', async () => {
    const onTerminado = jest.fn();
    render(
      <VentanaHojas
        cinta={CINTA_EXCEL_INTERMEDIO_VINCULOS}
        guion={GUION_INTERPRETA_LA_INFORMACION}
        onTerminado={onTerminado}
      />,
    );
    await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

    // 1
    irAHoja('h2');
    irAFormulas();
    fireEvent.click(boton('mostrar-formulas'));
    await celebrar();
    // 2
    teclear('D6', '=B6*C6');
    await celebrar();
    // 3
    fireEvent.click(boton('mostrar-formulas'));
    await celebrar();
    // 4
    abrirArchivo();
    fireEvent.click(document.querySelector('[data-hjb-inspeccionar]') as HTMLElement);
    cerrarArchivo();
    await celebrar();
    // 5
    irAHoja('h3');
    teclear('D5', '=B5-C5');
    await celebrar();
    // 6
    irAHoja('h4');
    teclear('B4', '5');
    await celebrar();
    // 7, 8, 9
    irAHoja('h1');
    fireEvent.mouseDown(celda('A5'));
    irAInsertar();
    escribirEnPanel('hipervinculo', 'h2!A1');
    await celebrar();
    fireEvent.mouseDown(celda('A6'));
    escribirEnPanel('hipervinculo', 'h3!A1');
    await celebrar();
    fireEvent.mouseDown(celda('A7'));
    escribirEnPanel('hipervinculo', 'h4!A1');
    await celebrar();
    // 10
    fireEvent.mouseDown(celda('A8'));
    fireEvent.click(boton('quitar-hipervinculo'));
    await celebrar();

    expect(onTerminado).toHaveBeenCalledTimes(1);
    expect(onTerminado.mock.calls[0][0]).toMatchObject({ pasos: 10, tropiezos: 0 });
  });
});
