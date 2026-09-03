/**
 * `of-excel-buscarx` · «Traer un dato de otra tabla» (temario §45.2, bloques
 * 26 · 27 · 28). Primera clase exclusiva de la sala de Excel.
 *
 * `guion.ts` ya estaba escrito y compilando; faltaban `Lab.tsx`, `Entrada.tsx`,
 * el registro y esta prueba. **Jugando la clase entera se cazó un defecto real**
 * (no de diseño, de puesta en producción): dos encargos —«los-dos-rangos» y
 * «el-cuarto-hueco»— señalaban `celda:C4` / `celda:C11` justo cuando el encargo
 * anterior dejaba al alumno en la hoja «Precios». La guarda del desvío
 * (`esDesvio`, `chrome/ganchos.ts`) trata las lengüetas como un control más, así
 * que con esa señal puesta **la lengüeta «Compras» quedaba bloqueada** —«Ése no
 * es el botón de este encargo»— y la clase no se podía terminar. Se corrigió en
 * `guion.ts` señalando `hoja:h4` en los dos, que es justo la regla que el propio
 * archivo ya tenía escrita para este caso (ver su cabecera, «POR QUÉ VARIAS
 * SEÑALES APUNTAN A UNA LENGÜETA Y NO A LA CELDA») y que faltaba aplicar ahí.
 *
 * Se juega MAL a propósito (regla de la casa) además de comprobar que la clase
 * entera se puede terminar de principio a fin.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { CINTA_EXCEL_BASICO } from '@/components/activities/office/tecniaHojas';
import { GUION_BUSCARX } from '@/components/activities/office/excel/buscarx/guion';

beforeAll(() => {
  if (typeof Element.prototype.scrollTo !== 'function') {
    Element.prototype.scrollTo = function scrollTo() {};
  }
});

async function abrir() {
  const salida = render(<VentanaHojas cinta={CINTA_EXCEL_BASICO} guion={GUION_BUSCARX} />);
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

function marcar(desde: string, hasta: string) {
  fireEvent.mouseDown(celda(desde));
  fireEvent.mouseDown(celda(hasta), { shiftKey: true });
}

describe('VentanaHojas · of-excel-buscarx se pinta', () => {
  it('la portada anuncia el tema, y el libro abre en Compras con el precio vacío', async () => {
    await abrir();
    expect(screen.getByText('BUSCARX y las funciones de texto')).not.toBeNull();
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

    expect(celda('A4').textContent).toBe('Cartulinas de colores');
    expect(celda('C4').textContent).toBe('');
  });
});

describe('VentanaHojas · of-excel-buscarx, jugando mal a propósito', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('encargo 1 · una fórmula no cierra el encargo que pide copiarlo a mano', async () => {
    await abrirYEmpezar();
    expect(encargo()).toBe('Cópialo tú');

    // JUGAR MAL · se adelanta con una fórmula, cuando el encargo pide justo lo
    // contrario: copiarlo a mano, para poder comparar dentro de un momento.
    teclear('C4', '=12.5');
    expect(encargo()).toBe('Cópialo tú');

    teclear('C4', '12.5');
    await celebrar();
    expect(encargo()).toBe('Que lo busque ella');
  });

  it('encargo 2 · un botón de la cinta no escribe la fórmula; BUSCARX sí', async () => {
    await abrirYEmpezar();
    teclear('C4', '12.5');
    await celebrar();
    expect(encargo()).toBe('Que lo busque ella');

    fireEvent.click(boton('negrita'));
    expect(document.querySelector('.txtw-aviso')).not.toBeNull();
    expect(celda('C5').textContent).toBe('');

    teclear('C5', '=BUSCARX(A5, Precios!$A$4:$A$17, Precios!$B$4:$B$17)');
    await celebrar();
    expect(celda('C5').textContent).toBe('68');
    expect(encargo()).toBe('La papelería subió los precios');
  });

  it('encargo 4 · un rango más corto no cierra el encargo aunque el número salga bien', async () => {
    await abrirYEmpezar();
    teclear('C4', '12.5');
    await celebrar();
    teclear('C5', '=BUSCARX(A5, Precios!$A$4:$A$17, Precios!$B$4:$B$17)');
    await celebrar();
    fireEvent.click(lengueta('h5'));
    teclear('B4', '14');
    teclear('B5', '75');
    await celebrar();
    expect(encargo()).toBe('Rómpela a propósito: dos rangos desiguales');

    // De vuelta a Compras: si esto se bloquea, es el defecto que se cazó y
    // corrigió en `guion.ts` (ver la cabecera de este archivo).
    fireEvent.click(lengueta('h4'));
    expect(document.querySelector('.txtw-aviso')).toBeNull();

    /*
     * JUGAR MAL · los dos rangos de distinto alto, que es lo que el encargo
     * pide. Sale `#¡VALOR!`, que es lo que el `aprendido` del encargo promete
     * y lo que hace Excel.
     *
     * Esta prueba afirmaba `14` hasta el 14-ago-2026, y estaba **afirmando un
     * defecto**: `BUSCARX` no comparaba los altos, buscaba y luego indexaba, así
     * que Cartulinas —que casa en el primer renglón, donde los dos rangos aún
     * coinciden— contestaba como si la fórmula estuviera bien. La avería era
     * intermitente por construcción: bien casi siempre, y vacío en los últimos
     * renglones. Se arregló en `formula/funciones.ts`.
     *
     * La lección para el que venga: **el texto de la clase era el que tenía
     * razón**. Cuando el letrero y el motor no coinciden, no se da por hecho
     * que el letrero miente.
     */
    teclear('C4', '=BUSCARX(A4, Precios!$A$4:$A$17, Precios!$B$4:$B$16)');
    await waitFor(() => expect(celda('C4').textContent).toBe('#¡VALOR!'));
    expect(encargo()).toBe('Rómpela a propósito: dos rangos desiguales');

    teclear('C4', '=BUSCARX(A4, Precios!$A$4:$A$17, Precios!$B$4:$B$17)');
    await celebrar();
    expect(celda('C4').textContent).toBe('14');
    expect(encargo()).toBe('Los ocho precios, de un arrastre');
  });

  it('encargo 6 · culpar a la fórmula avisa; #N/A es que el dato no está en la lista', async () => {
    await abrirYEmpezar();
    teclear('C4', '12.5');
    await celebrar();
    teclear('C5', '=BUSCARX(A5, Precios!$A$4:$A$17, Precios!$B$4:$B$17)');
    await celebrar();
    fireEvent.click(lengueta('h5'));
    teclear('B4', '14');
    teclear('B5', '75');
    await celebrar();
    fireEvent.click(lengueta('h4'));
    teclear('C4', '=BUSCARX(A4, Precios!$A$4:$A$17, Precios!$B$4:$B$17)');
    await celebrar();
    marcar('C4', 'C11');
    fireEvent.click(boton('rellenar-abajo'));
    await celebrar();
    expect(encargo()).toBe('¿Qué te está diciendo esa celda?');

    // JUGAR MAL · culpar a la fórmula en vez de entender la respuesta.
    fireEvent.click(screen.getByText(/se te fue un paréntesis o un rango/));
    expect(document.querySelector('.txtw-error')).not.toBeNull();
    expect(encargo()).toBe('¿Qué te está diciendo esa celda?');

    fireEvent.click(screen.getByText(/Buscó lo que le pediste en la lista que le dijiste/));
    await celebrar();
    expect(encargo()).toBe('El espacio que no se ve');
  });

  it('la clase entera se termina, cruzando las cuatro hojas sin quedarse trabada', async () => {
    const onTerminado = jest.fn();
    render(<VentanaHojas cinta={CINTA_EXCEL_BASICO} guion={GUION_BUSCARX} onTerminado={onTerminado} />);
    await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
    fireEvent.click(screen.getByText('Abrir el libro'));

    // 1 · va a mirar y vuelve, como dice la instrucción
    fireEvent.click(lengueta('h5'));
    fireEvent.click(lengueta('h4'));
    teclear('C4', '12.5');
    await celebrar();

    // 2
    teclear('C5', '=BUSCARX(A5, Precios!$A$4:$A$17, Precios!$B$4:$B$17)');
    await celebrar();

    // 3
    fireEvent.click(lengueta('h5'));
    teclear('B4', '14');
    teclear('B5', '75');
    await celebrar();

    // 4
    fireEvent.click(lengueta('h4'));
    teclear('C4', '=BUSCARX(A4, Precios!$A$4:$A$17, Precios!$B$4:$B$16)');
    teclear('C4', '=BUSCARX(A4, Precios!$A$4:$A$17, Precios!$B$4:$B$17)');
    await celebrar();

    // 5
    marcar('C4', 'C11');
    fireEvent.click(boton('rellenar-abajo'));
    await celebrar();
    expect(celda('C10').textContent).toBe('#N/A');
    expect(celda('C11').textContent).toBe('#N/A');

    // 6 · eleccion
    fireEvent.click(screen.getByText(/Buscó lo que le pediste en la lista/));
    await celebrar();

    // 7 · el espacio invisible, en la hoja Precios
    fireEvent.click(lengueta('h5'));
    teclear('B20', '=LARGO(Compras!A10)');
    teclear('B21', '=LARGO(A6)');
    teclear('A6', 'Cinta adhesiva');
    await celebrar();

    // 8 · el cuarto hueco, de vuelta en Compras
    fireEvent.click(lengueta('h4'));
    expect(document.querySelector('.txtw-aviso')).toBeNull();
    teclear('C11', '=BUSCARX(A11, Precios!$A$4:$A$17, Precios!$B$4:$B$17, "No está en el catálogo")');
    await celebrar();

    // 9 · a la hoja Lista
    fireEvent.click(lengueta('h6'));
    teclear('B4', '=IZQUIERDA(A4, 10)');
    teclear('C4', '=EXTRAE(A4, 2, 4)');
    await celebrar();

    // 10
    teclear('D4', '=DERECHA(A4, LARGO(A4)-11)');
    marcar('B4', 'D11');
    fireEvent.click(boton('rellenar-abajo'));
    await celebrar();

    // 11
    teclear('F4', '=MAYUSC(D4)');
    teclear('G4', '=MINUSC(E4)');
    marcar('F4', 'G11');
    fireEvent.click(boton('rellenar-abajo'));
    await celebrar();

    // 12
    teclear('D15', '=CONCAT(A15, " ", B15, " ", C15)');
    teclear('E15', '=LARGO(D15)');
    marcar('D15', 'E22');
    fireEvent.click(boton('rellenar-abajo'));
    await celebrar();

    // 13
    teclear('D15', '=UNIRCADENAS(" ", VERDADERO, A15, B15, C15)');
    marcar('D15', 'D22');
    fireEvent.click(boton('rellenar-abajo'));
    await celebrar();

    expect(screen.getByText('Terminaste')).not.toBeNull();
    expect(onTerminado).toHaveBeenCalledTimes(1);
    expect(onTerminado.mock.calls[0][0]).toMatchObject({ pasos: 13, tropiezos: 0 });
  });
});
