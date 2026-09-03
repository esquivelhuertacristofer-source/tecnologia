/**
 * `of-excel-y-si` · «¿Y si fuera de otra manera?» (bloque 57). La cuarta
 * clase exclusiva del grado Avanzado de Tecnia Hojas.
 *
 * Se juega MAL a propósito, que es la regla de la casa: un objetivo que no
 * es fórmula, una celda que se mueve y en realidad es una fórmula, una celda
 * que no influye en el objetivo, un objetivo que sencillamente no tiene
 * solución, guardar dos escenarios con el mismo nombre, y aplicar un
 * escenario que pisa una fórmula. Y hay un recorrido de la clase entera, de
 * principio a fin, porque es la única forma de cazar un encadenamiento roto
 * entre un `comprueba` y el encargo siguiente que legítimamente cambia el
 * mismo número.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { CINTA_EXCEL_AVANZADO } from '@/components/activities/office/tecniaHojas';
import { GUION_Y_SI } from '@/components/activities/office/excel/y-si/guion';
import PanelYSi from '@/components/activities/office/excel/y-si/PanelYSi';

beforeAll(() => {
  if (typeof Element.prototype.scrollTo !== 'function') {
    Element.prototype.scrollTo = function scrollTo() {};
  }
});

const PANEL_FIJO = { titulo: 'Y si', Cuerpo: PanelYSi };

async function abrir() {
  const salida = render(<VentanaHojas cinta={CINTA_EXCEL_AVANZADO} guion={GUION_Y_SI} panelFijo={PANEL_FIJO} />);
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

const boton = (control: string): HTMLElement => document.querySelector(`[data-control="${control}"]`) as HTMLElement;

const botonEscenario = (control: string, nombre: string): HTMLElement =>
  document.querySelector(`[data-control="${control}"][data-escenario="${nombre}"]`) as HTMLElement;

const rejilla = (): HTMLElement => document.querySelector('.hjw-rejilla') as HTMLElement;

const encargo = (): string => document.querySelector('.txtw-encargo h3')?.textContent ?? '';

const opcion = (texto: string): HTMLElement =>
  Array.from(document.querySelectorAll<HTMLElement>('.txtw-opcion')).find((b) => b.textContent === texto) as HTMLElement;

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

function marcar(desde: string, hasta?: string) {
  fireEvent.mouseDown(celda(desde));
  if (hasta) fireEvent.mouseDown(celda(hasta), { shiftKey: true });
}

/** Selecciona la celda objetivo y pulsa «Buscar objetivo» con los otros dos huecos. */
function buscarObjetivo(objetivo: string, valor: string, cambiando: string) {
  marcar(objetivo);
  fireEvent.change(screen.getByLabelText('Valor deseado'), { target: { value: valor } });
  fireEvent.change(screen.getByLabelText('Celda que cambia'), { target: { value: cambiando } });
  fireEvent.click(boton('buscar-objetivo'));
}

function guardarEscenario(nombre: string) {
  fireEvent.change(screen.getByLabelText('Nombre del escenario'), { target: { value: nombre } });
  fireEvent.click(boton('guardar-escenario'));
}

const aplicarEscenario = (nombre: string) => fireEvent.click(botonEscenario('aplicar-escenario', nombre));
const borrarEscenario = (nombre: string) => fireEvent.click(botonEscenario('borrar-escenario', nombre));

describe('VentanaHojas · of-excel-y-si se pinta', () => {
  it('la portada anuncia el tema, y el libro abre con la diferencia en -3000 y sin escenarios', async () => {
    await abrir();
    expect(screen.getByText('Análisis Y si: buscar objetivo y escenarios')).not.toBeNull();
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

    expect(celda('B4').textContent).toBe('40');
    expect(celda('B5').textContent).toBe('125');
    expect(celda('B11').textContent).toBe('-3000');
    expect(screen.getByText('Todavía no hay ninguno.')).not.toBeNull();
    expect(encargo()).toBe('Al revés, con dos tropiezos en el camino');
  });
});

describe('VentanaHojas · of-excel-y-si, jugando mal a propósito', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('encargo 1 · objetivo sin fórmula y celda que mueve con fórmula avisan; corregido, la aportación llega a 200', async () => {
    await abrirYEmpezar();

    // JUGAR MAL · B5 no guarda ninguna fórmula.
    buscarObjetivo('B5', '200', 'B4');
    expect(document.querySelector('.txtw-aviso')).not.toBeNull();
    expect(celda('B5').textContent).toBe('125');
    expect(encargo()).toBe('Al revés, con dos tropiezos en el camino');

    // JUGAR MAL · B9 (Total recaudado) es una fórmula: no se puede mover.
    buscarObjetivo('B11', '0', 'B9');
    expect(document.querySelector('.txtw-aviso')).not.toBeNull();
    expect(celda('B11').textContent).toBe('-3000');
    expect(encargo()).toBe('Al revés, con dos tropiezos en el camino');

    buscarObjetivo('B11', '0', 'B5');
    await celebrar();

    expect(celda('B5').textContent).toBe('200');
    expect(celda('B11').textContent).toBe('0');
    expect(encargo()).toBe('¿En qué se diferencia esto de las demás clases?');
  });

  it('encargos 2 y 3 · la elección explica el «hacia atrás», y 35 alumnos se escribe hacia adelante', async () => {
    await abrirYEmpezar();
    buscarObjetivo('B11', '0', 'B5');
    await celebrar();
    expect(encargo()).toBe('¿En qué se diferencia esto de las demás clases?');

    // JUGAR MAL · la opción que no explica nada.
    fireEvent.click(opcion('Nada: sigue siendo escribir un dato y ver un resultado, sólo que con un botón nuevo'));
    expect(document.querySelector('.txtw-error')).not.toBeNull();

    fireEvent.click(opcion('Le dijiste a la hoja el RESULTADO que querías, y ella encontró el DATO que lo produce: la hoja se usó al revés'));
    await celebrar();
    expect(encargo()).toBe('¿Y si sólo confirman treinta y cinco?');

    teclear('B4', '35');
    await celebrar();
    expect(celda('B11').textContent).toBe('-700');
    expect(encargo()).toBe('El error número uno: una celda que no influye');
  });

  it('encargo 4 · el fondo del club no influye en la diferencia; corregido, la aportación sube a 220', async () => {
    await abrirYEmpezar();
    buscarObjetivo('B11', '0', 'B5');
    await celebrar();
    fireEvent.click(opcion('Le dijiste a la hoja el RESULTADO que querías, y ella encontró el DATO que lo produce: la hoja se usó al revés'));
    await celebrar();
    teclear('B4', '35');
    await celebrar();

    // JUGAR MAL · B15 (Fondo de ahorro del club) no entra en la cuenta de B11.
    buscarObjetivo('B11', '0', 'B15');
    expect(document.querySelector('.txtw-aviso')).not.toBeNull();
    expect(celda('B15').textContent).toBe('800');
    expect(encargo()).toBe('El error número uno: una celda que no influye');

    buscarObjetivo('B11', '0', 'B5');
    await celebrar();
    expect(celda('B5').textContent).toBe('220');
    expect(celda('B11').textContent).toBe('0');
    expect(encargo()).toBe('Guárdalo con nombre, antes de que se te olvide');
  });

  /** Hasta el encargo 7 («el-camion-sube»), con los dos escenarios de 35 y 40 ya guardados. */
  async function hastaLosDosEscenarios() {
    await abrirYEmpezar();
    buscarObjetivo('B11', '0', 'B5');
    await celebrar();
    fireEvent.click(opcion('Le dijiste a la hoja el RESULTADO que querías, y ella encontró el DATO que lo produce: la hoja se usó al revés'));
    await celebrar();
    teclear('B4', '35');
    await celebrar();
    buscarObjetivo('B11', '0', 'B5');
    await celebrar();

    marcar('B4', 'B5');
    guardarEscenario('35 alumnos');
    await celebrar();

    teclear('B4', '40');
    buscarObjetivo('B11', '0', 'B5');
    marcar('B4', 'B5');
    guardarEscenario('40 alumnos');
    await celebrar();
  }

  it('encargos 5 y 6 · se guardan dos escenarios con nombre, sin que ninguno borre al otro', async () => {
    await hastaLosDosEscenarios();
    expect(screen.getByText('35 alumnos')).not.toBeNull();
    expect(screen.getByText('40 alumnos')).not.toBeNull();
    expect(celda('B4').textContent).toBe('40');
    expect(celda('B5').textContent).toBe('200');
    expect(encargo()).toBe('El camión sube, y una pregunta imposible por el camino');
  });

  it('encargo 7 · el camión sube; un objetivo imposible no toca el libro, y el de verdad da 217.5', async () => {
    await hastaLosDosEscenarios();
    teclear('B6', '6300');
    await celebrar();

    // JUGAR MAL · el costo por alumno (B12) nunca baja de 60: es imposible.
    buscarObjetivo('B12', '50', 'B4');
    expect(document.querySelector('.txtw-aviso')).not.toBeNull();
    expect(celda('B4').textContent).toBe('40'); // el libro no se tocó
    expect(encargo()).toBe('El camión sube, y una pregunta imposible por el camino');

    buscarObjetivo('B11', '0', 'B5');
    await celebrar();
    expect(celda('B5').textContent).toBe('217.5');
    expect(celda('B11').textContent).toBe('0');
    expect(encargo()).toBe('El mismo nombre, dos veces');
  });

  /** Hasta el encargo 8 resuelto: «40 alumnos» ya reemplazado con 217.5. */
  async function hastaElReemplazo() {
    await hastaLosDosEscenarios();
    teclear('B6', '6300');
    buscarObjetivo('B11', '0', 'B5');
    await celebrar();

    marcar('B4', 'B5');
    guardarEscenario('40 alumnos');
    expect(document.querySelector('.txtw-aviso')).not.toBeNull();
    guardarEscenario('40 alumnos');
    await celebrar();
  }

  it('encargo 8 · guardar con un nombre que ya existe avisa, y reemplaza sin duplicar la lista', async () => {
    await hastaElReemplazo();
    expect(document.querySelectorAll('.pys-escenario').length).toBe(2);
    expect(encargo()).toBe('Compara sin volver a teclear nada');
  });

  it('encargos 9 y 10 · aplicar compara sin teclear, y pisa una fórmula que se acababa de escribir', async () => {
    await hastaElReemplazo();

    aplicarEscenario('35 alumnos');
    await celebrar();
    expect(celda('B4').textContent).toBe('35');
    expect(celda('B5').textContent).toBe('220');
    expect(encargo()).toBe('El peligro: una fórmula que se pierde');

    teclear('B5', '=B10/B4');
    await celebrar();
    expect(celda('B5').textContent).toBe('240'); // =B10/B4 con B4=35 y el camión ya subido: 8400/35

    // JUGAR MAL, pero es lo que pide el encargo: aplicar «40 alumnos» pisa la fórmula recién escrita.
    aplicarEscenario('40 alumnos');
    expect(document.querySelector('.txtw-aviso')).not.toBeNull();
    aplicarEscenario('40 alumnos');
    await celebrar();

    expect(celda('B4').textContent).toBe('40');
    expect(celda('B5').textContent).toBe('217.5');
    expect(encargo()).toBe('Lo que ya no hace falta');
  });

  it('la clase entera se termina, de principio a fin, con 0 tropiezos', async () => {
    const onTerminado = jest.fn();
    render(<VentanaHojas cinta={CINTA_EXCEL_AVANZADO} guion={GUION_Y_SI} panelFijo={PANEL_FIJO} onTerminado={onTerminado} />);
    await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

    // 1
    buscarObjetivo('B11', '0', 'B5');
    await celebrar();
    // 2
    fireEvent.click(opcion('Le dijiste a la hoja el RESULTADO que querías, y ella encontró el DATO que lo produce: la hoja se usó al revés'));
    await celebrar();
    // 3
    teclear('B4', '35');
    await celebrar();
    // 4
    buscarObjetivo('B11', '0', 'B5');
    await celebrar();
    // 5
    marcar('B4', 'B5');
    guardarEscenario('35 alumnos');
    await celebrar();
    // 6
    teclear('B4', '40');
    buscarObjetivo('B11', '0', 'B5');
    marcar('B4', 'B5');
    guardarEscenario('40 alumnos');
    await celebrar();
    // 7
    teclear('B6', '6300');
    buscarObjetivo('B11', '0', 'B5');
    await celebrar();
    // 8
    marcar('B4', 'B5');
    guardarEscenario('40 alumnos');
    guardarEscenario('40 alumnos');
    await celebrar();
    // 9
    aplicarEscenario('35 alumnos');
    await celebrar();
    // 10
    teclear('B5', '=B10/B4');
    aplicarEscenario('40 alumnos');
    aplicarEscenario('40 alumnos');
    await celebrar();
    // 11
    borrarEscenario('35 alumnos');
    await celebrar();
    // 12
    fireEvent.click(
      opcion('Que con un solo clic la HOJA vuelve a ese estado exacto y recalcula todo — un papel sólo tiene los números escritos, no los aplica ni los recalcula'),
    );
    await celebrar();

    expect(screen.getByText('Terminaste')).not.toBeNull();
    expect(onTerminado).toHaveBeenCalledTimes(1);
    expect(onTerminado.mock.calls[0][0]).toMatchObject({ pasos: 12, tropiezos: 0 });
  });
});
