/**
 * `n7-formato-condicional` · «Una regla no cambia el dato, cambia cómo se ve»
 * (temario §45.2, bloques 30 · 31). La cuarta clase del grado Intermedio de
 * Tecnia Hojas.
 *
 * Se juega MAL a propósito, que es la regla de la casa: pintar a mano no
 * cuenta como regla, Destacar con una sola celda marcada no hace nada, y
 * Destacar duplicados sobre un rango vacío no pinta nada tampoco. Y hay un
 * recorrido de la clase entera, de principio a fin, en el último bloque, por
 * lo mismo que ya encontró dos encargos imposibles en `n5-tus-primeras-formulas`.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { CINTA_EXCEL_BASICO } from '@/components/activities/office/tecniaHojas';
import { GUION_FORMATO_CONDICIONAL } from '@/components/activities/office/excel/formato-condicional/guion';
import PanelReglas from '@/components/activities/office/excel/formato-condicional/PanelReglas';

beforeAll(() => {
  if (typeof Element.prototype.scrollTo !== 'function') {
    Element.prototype.scrollTo = function scrollTo() {};
  }
});

const PANEL_FIJO = { titulo: 'Formato condicional', Cuerpo: PanelReglas };

async function abrir() {
  const salida = render(<VentanaHojas cinta={CINTA_EXCEL_BASICO} guion={GUION_FORMATO_CONDICIONAL} panelFijo={PANEL_FIJO} />);
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

/** Marcar un rectángulo con el ratón, como el alumno: una celda sola si no hay `hasta`. */
function marcar(desde: string, hasta?: string) {
  fireEvent.mouseDown(celda(desde));
  if (hasta) fireEvent.mouseDown(celda(hasta), { shiftKey: true });
}

function irAHoja(id: string) {
  fireEvent.click(document.querySelector(`[data-hoja="${id}"]`) as HTMLElement);
}

/* ── el panel de la derecha: `PanelReglas.tsx` ──────────────────────────────*/

function aplicarDestacar(comparacion: string, valor1?: string, valor2?: string) {
  fireEvent.change(screen.getByLabelText('Comparación'), { target: { value: comparacion } });
  if (comparacion !== 'duplicados') {
    const etiqueta = comparacion === 'contiene' ? 'Texto' : 'Número';
    fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor1 ?? '' } });
  }
  if (comparacion === 'entre') {
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: valor2 ?? '' } });
  }
  fireEvent.click(boton('regla-destacar'));
}

function insertarMinigrafico(tipo: string, rango: string) {
  fireEvent.change(screen.getByLabelText('Tipo de minigráfico'), { target: { value: tipo } });
  fireEvent.change(screen.getByLabelText('Rango de datos'), { target: { value: rango } });
  fireEvent.click(boton('minigrafico'));
}

/** La ✕ de la lista «Reglas de esta hoja», por su rótulo: «Escala de color · E4:E12». */
function quitarRegla(rotulo: string) {
  const fila = Array.from(document.querySelectorAll('.pfc-lista li')).find((li) => li.textContent?.includes(rotulo));
  if (!fila) throw new Error(`no se encontró la regla «${rotulo}» en la lista`);
  fireEvent.click(fila.querySelector('button') as HTMLElement);
}

describe('VentanaHojas · n7-formato-condicional se pinta', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('la portada anuncia el tema, y el libro abre con la fila 12 vacía y el total en 12606', async () => {
    await abrir();
    expect(screen.getByText('Formato condicional y minigráficos')).not.toBeNull();
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

    expect(celda('A4').textContent).toBe('Camión de la escuela a Teotihuacán');
    expect(celda('E4').textContent).toBe('4800');
    expect(celda('A12').textContent ?? '').toBe('');
    expect(celda('E13').textContent).toBe('12606');
    expect(encargo()).toBe('Píntala tú: el gasto más caro de hoy');
  });

  it('encargo 1 · pintar a mano no es una regla, y el color se queda quieto ante un dato nuevo (encargo 2)', async () => {
    await abrirYEmpezar();
    marcar('E4');
    fireEvent.click(boton('color-relleno'));
    fireEvent.click(document.querySelector('.hjw-color[data-color="#ffc000"]') as HTMLElement);
    await celebrar();
    expect(encargo()).toBe('Un gasto todavía más caro');

    teclear('A12', 'Renta de bocinas y templete');
    teclear('B12', 'Material');
    teclear('C12', '1');
    teclear('D12', '6000');
    teclear('E12', '=C12*D12');
    await celebrar();
    expect(celda('E12').textContent).toBe('6000');
    expect(celda('E13').textContent).toBe('18606');
    expect(encargo()).toBe('Ahora sí: una regla de verdad');
  });

  it('encargo 3 · con una sola celda marcada, Destacar no hace nada; con E4:E12 sí se pintan solos', async () => {
    await abrirYEmpezar();
    marcar('E4');
    fireEvent.click(boton('color-relleno'));
    fireEvent.click(document.querySelector('.hjw-color[data-color="#ffc000"]') as HTMLElement);
    await celebrar();
    teclear('A12', 'Renta de bocinas y templete');
    teclear('B12', 'Material');
    teclear('C12', '1');
    teclear('D12', '6000');
    teclear('E12', '=C12*D12');
    await celebrar();
    expect(encargo()).toBe('Ahora sí: una regla de verdad');

    // JUGAR MAL · una sola celda marcada: Destacar no puede aplicarse.
    marcar('E4');
    aplicarDestacar('mayor', '1000');
    await celebrar();
    expect(encargo()).toBe('Ahora sí: una regla de verdad');

    marcar('E4', 'E12');
    aplicarDestacar('mayor', '1000');
    await celebrar();
    expect(encargo()).toBe('¿Y el total?');
  });

  it('encargo 4 · el total no se movió al aplicar la regla (elección)', async () => {
    await abrirYEmpezar();
    marcar('E4');
    fireEvent.click(boton('color-relleno'));
    fireEvent.click(document.querySelector('.hjw-color[data-color="#ffc000"]') as HTMLElement);
    await celebrar();
    teclear('A12', 'Renta de bocinas y templete');
    teclear('B12', 'Material');
    teclear('C12', '1');
    teclear('D12', '6000');
    teclear('E12', '=C12*D12');
    await celebrar();
    marcar('E4', 'E12');
    aplicarDestacar('mayor', '1000');
    await celebrar();
    expect(celda('E13').textContent).toBe('18606');
    expect(encargo()).toBe('¿Y el total?');

    fireEvent.click(opcion('Sí, bajó o subió un poco'));
    await celebrar();
    expect(encargo()).toBe('¿Y el total?');

    fireEvent.click(opcion('No, sigue exactamente igual que antes de aplicar la regla'));
    await celebrar();
    expect(celda('E13').textContent).toBe('18606');
    expect(encargo()).toBe('Sube un precio, y mira quién se pinta solo');
  });

  it('encargo 5 · subes el precio de la guía y la regla se entera sola, sin tocar el panel', async () => {
    await abrirYEmpezar();
    marcar('E4');
    fireEvent.click(boton('color-relleno'));
    fireEvent.click(document.querySelector('.hjw-color[data-color="#ffc000"]') as HTMLElement);
    await celebrar();
    teclear('A12', 'Renta de bocinas y templete');
    teclear('B12', 'Material');
    teclear('C12', '1');
    teclear('D12', '6000');
    teclear('E12', '=C12*D12');
    await celebrar();
    marcar('E4', 'E12');
    aplicarDestacar('mayor', '1000');
    await celebrar();
    fireEvent.click(opcion('No, sigue exactamente igual que antes de aplicar la regla'));
    await celebrar();
    expect(encargo()).toBe('Sube un precio, y mira quién se pinta solo');

    teclear('D7', '1500');
    await celebrar();
    expect(celda('E7').textContent).toBe('1500');
    expect(encargo()).toBe('Clasifica en tres cajones: iconos');
  });

  it('encargos 6 y 7 · iconos clasifican en cajones, y las barras —encima— sí miden cuánto', async () => {
    await abrirYEmpezar();
    marcar('E4');
    fireEvent.click(boton('color-relleno'));
    fireEvent.click(document.querySelector('.hjw-color[data-color="#ffc000"]') as HTMLElement);
    await celebrar();
    teclear('A12', 'Renta de bocinas y templete');
    teclear('B12', 'Material');
    teclear('C12', '1');
    teclear('D12', '6000');
    teclear('E12', '=C12*D12');
    await celebrar();
    marcar('E4', 'E12');
    aplicarDestacar('mayor', '1000');
    await celebrar();
    fireEvent.click(opcion('No, sigue exactamente igual que antes de aplicar la regla'));
    await celebrar();
    teclear('D7', '1500');
    await celebrar();
    expect(encargo()).toBe('Clasifica en tres cajones: iconos');

    marcar('E4', 'E12');
    fireEvent.click(boton('regla-iconos'));
    await celebrar();
    expect(encargo()).toBe('Y ahora sí: cuánto más grande');

    // Los iconos siguen puestos: no se borran para dejar sitio a las barras.
    marcar('E4', 'E12');
    fireEvent.click(boton('regla-barras'));
    await celebrar();
    expect(encargo()).toBe('Una tercera pregunta, encima de las otras dos');
  });

  it('encargo 8 · la escala de color, puesta al final, tapa el rosa del destacar', async () => {
    await abrirYEmpezar();
    marcar('E4');
    fireEvent.click(boton('color-relleno'));
    fireEvent.click(document.querySelector('.hjw-color[data-color="#ffc000"]') as HTMLElement);
    await celebrar();
    teclear('A12', 'Renta de bocinas y templete');
    teclear('B12', 'Material');
    teclear('C12', '1');
    teclear('D12', '6000');
    teclear('E12', '=C12*D12');
    await celebrar();
    marcar('E4', 'E12');
    aplicarDestacar('mayor', '1000');
    await celebrar();
    fireEvent.click(opcion('No, sigue exactamente igual que antes de aplicar la regla'));
    await celebrar();
    teclear('D7', '1500');
    await celebrar();
    marcar('E4', 'E12');
    fireEvent.click(boton('regla-iconos'));
    await celebrar();
    marcar('E4', 'E12');
    fireEvent.click(boton('regla-barras'));
    await celebrar();
    expect(encargo()).toBe('Una tercera pregunta, encima de las otras dos');

    // JUGAR MAL · escala sobre la columna de texto: no hay ningún número que
    // colorear, así que el encargo —que pide E4:E12— no puede darse por hecho.
    marcar('A4', 'A12');
    fireEvent.click(boton('regla-escala'));
    await celebrar();
    expect(encargo()).toBe('Una tercera pregunta, encima de las otras dos');

    marcar('E4', 'E12');
    fireEvent.click(boton('regla-escala'));
    await celebrar();
    expect(encargo()).toBe('Cambia de hoja: ¿quién se apuntó dos veces?');
    expect(screen.getByText(/Escala de color · E4:E12/)).not.toBeNull();
  });

  it('encargo 9 · sobre un rango vacío Destacar duplicados no pinta nada; con A4:A13 caza a las dos Camila Rosas', async () => {
    await abrirYEmpezar();
    marcar('E4');
    fireEvent.click(boton('color-relleno'));
    fireEvent.click(document.querySelector('.hjw-color[data-color="#ffc000"]') as HTMLElement);
    await celebrar();
    teclear('A12', 'Renta de bocinas y templete');
    teclear('B12', 'Material');
    teclear('C12', '1');
    teclear('D12', '6000');
    teclear('E12', '=C12*D12');
    await celebrar();
    marcar('E4', 'E12');
    aplicarDestacar('mayor', '1000');
    await celebrar();
    fireEvent.click(opcion('No, sigue exactamente igual que antes de aplicar la regla'));
    await celebrar();
    teclear('D7', '1500');
    await celebrar();
    marcar('E4', 'E12');
    fireEvent.click(boton('regla-iconos'));
    await celebrar();
    marcar('E4', 'E12');
    fireEvent.click(boton('regla-barras'));
    await celebrar();
    marcar('E4', 'E12');
    fireEvent.click(boton('regla-escala'));
    await celebrar();
    expect(encargo()).toBe('Cambia de hoja: ¿quién se apuntó dos veces?');

    irAHoja('h2');
    expect(celda('A6').textContent).toBe('Camila Rosas');
    expect(celda('A11').textContent).toBe('Camila Rosas');

    // JUGAR MAL · un rango vacío de esta misma hoja: no hay nada que comparar.
    marcar('C4', 'C13');
    aplicarDestacar('duplicados');
    await celebrar();
    expect(encargo()).toBe('Cambia de hoja: ¿quién se apuntó dos veces?');

    marcar('A4', 'A13');
    aplicarDestacar('duplicados');
    await celebrar();
    expect(encargo()).toBe('Una fila entera, dentro de una celda');
  });

  it('encargos 10, 11 y 12 · un minigráfico resume la fila, y el número de abajo sigue intacto', async () => {
    await abrirYEmpezar();
    marcar('E4');
    fireEvent.click(boton('color-relleno'));
    fireEvent.click(document.querySelector('.hjw-color[data-color="#ffc000"]') as HTMLElement);
    await celebrar();
    teclear('A12', 'Renta de bocinas y templete');
    teclear('B12', 'Material');
    teclear('C12', '1');
    teclear('D12', '6000');
    teclear('E12', '=C12*D12');
    await celebrar();
    marcar('E4', 'E12');
    aplicarDestacar('mayor', '1000');
    await celebrar();
    fireEvent.click(opcion('No, sigue exactamente igual que antes de aplicar la regla'));
    await celebrar();
    teclear('D7', '1500');
    await celebrar();
    marcar('E4', 'E12');
    fireEvent.click(boton('regla-iconos'));
    await celebrar();
    marcar('E4', 'E12');
    fireEvent.click(boton('regla-barras'));
    await celebrar();
    marcar('E4', 'E12');
    fireEvent.click(boton('regla-escala'));
    await celebrar();
    irAHoja('h2');
    marcar('A4', 'A13');
    aplicarDestacar('duplicados');
    await celebrar();
    expect(encargo()).toBe('Una fila entera, dentro de una celda');

    irAHoja('h3');
    marcar('F4');
    insertarMinigrafico('linea', 'B4:E4');
    await celebrar();
    expect(encargo()).toBe('El mismo resumen, otra forma');

    marcar('F6');
    insertarMinigrafico('columna', 'B6:E6');
    await celebrar();
    expect(encargo()).toBe('Debajo del dibujo, ¿sigue el dato?');

    // El minigráfico tapó F4 y F6, pero los números de las semanas siguen ahí.
    expect(celda('B4').textContent).toBe('800');
    expect(celda('E4').textContent).toBe('2300');

    fireEvent.click(opcion('Sí, el minigráfico necesita borrar los números para poder dibujar'));
    await celebrar();
    expect(encargo()).toBe('Debajo del dibujo, ¿sigue el dato?');

    fireEvent.click(opcion('No, los números de las semanas siguen intactos: sólo cambió lo que se ve en F4 y F6'));
    await celebrar();
    expect(encargo()).toBe('Demasiadas reglas no dicen nada: destápalo');
  });

  it('el recorrido completo: encargo 13 quita sólo la regla que sobra, y la clase termina', async () => {
    const onTerminado = jest.fn();
    render(
      <VentanaHojas
        cinta={CINTA_EXCEL_BASICO}
        guion={GUION_FORMATO_CONDICIONAL}
        panelFijo={PANEL_FIJO}
        onTerminado={onTerminado}
      />,
    );
    await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

    marcar('E4');
    fireEvent.click(boton('color-relleno'));
    fireEvent.click(document.querySelector('.hjw-color[data-color="#ffc000"]') as HTMLElement);
    await celebrar();
    teclear('A12', 'Renta de bocinas y templete');
    teclear('B12', 'Material');
    teclear('C12', '1');
    teclear('D12', '6000');
    teclear('E12', '=C12*D12');
    await celebrar();
    marcar('E4', 'E12');
    aplicarDestacar('mayor', '1000');
    await celebrar();
    fireEvent.click(opcion('No, sigue exactamente igual que antes de aplicar la regla'));
    await celebrar();
    teclear('D7', '1500');
    await celebrar();
    marcar('E4', 'E12');
    fireEvent.click(boton('regla-iconos'));
    await celebrar();
    marcar('E4', 'E12');
    fireEvent.click(boton('regla-barras'));
    await celebrar();
    marcar('E4', 'E12');
    fireEvent.click(boton('regla-escala'));
    await celebrar();
    irAHoja('h2');
    marcar('A4', 'A13');
    aplicarDestacar('duplicados');
    await celebrar();
    irAHoja('h3');
    marcar('F4');
    insertarMinigrafico('linea', 'B4:E4');
    await celebrar();
    marcar('F6');
    insertarMinigrafico('columna', 'B6:E6');
    await celebrar();
    fireEvent.click(opcion('No, los números de las semanas siguen intactos: sólo cambió lo que se ve en F4 y F6'));
    await celebrar();
    expect(encargo()).toBe('Demasiadas reglas no dicen nada: destápalo');

    irAHoja('h1');
    // JUGAR MAL · quitar la regla que NO sobra no cierra el encargo.
    quitarRegla('Barras de datos · E4:E12');
    await celebrar();
    expect(encargo()).toBe('Demasiadas reglas no dicen nada: destápalo');

    // Se repone: sin ella el encargo final —que exige las cuatro reglas menos
    // la escala— no se puede volver a cumplir.
    marcar('E4', 'E12');
    fireEvent.click(boton('regla-barras'));
    await celebrar();
    expect(encargo()).toBe('Demasiadas reglas no dicen nada: destápalo');

    quitarRegla('Escala de color · E4:E12');
    await celebrar();
    expect(screen.getByText('Terminaste')).not.toBeNull();
    expect(onTerminado).toHaveBeenCalledTimes(1);
    expect(onTerminado.mock.calls[0][0]).toMatchObject({ pasos: GUION_FORMATO_CONDICIONAL.pasos.length, tropiezos: 0 });
  });
});
