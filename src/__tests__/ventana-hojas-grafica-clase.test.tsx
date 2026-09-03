/**
 * `n5-mi-primera-grafica` · «Una gráfica es una vista, no un dibujo» (temario
 * §45.2, bloques 17 · 18 · 20).
 *
 * Se juega MAL a propósito, que es la regla de la casa: una sola celda
 * marcada, un rango que no existe y un área de impresión escrita al revés
 * tienen que comportarse tal y como se espera de ellos, no sólo aprobar el
 * camino bueno. Y hay un recorrido de la clase entera, de principio a fin,
 * porque es así como `n5-tus-primeras-formulas` encontró los dos encargos que
 * la volvían imposible de terminar.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { CINTA_EXCEL_BASICO } from '@/components/activities/office/tecniaHojas';
import { leerImpresora, reiniciarImpresora } from '@/components/office/motor-hojas/BackstageHojas';
import {
  AREA_DE_IMPRESION,
  GUION_MI_PRIMERA_GRAFICA,
  ID_GRAFICA,
  RANGO_RESUMEN_BUENO,
  RANGO_RESUMEN_CON_TOTAL,
  laBarraSeMueveSola,
  libroParaLaGrafica,
  seArreglaLaSeleccion,
  seHizoLaGraficaConElTotal,
  seImprimioConElAreaBuena,
  seImprimioSinArea,
  tieneEjesYSinLeyenda,
  tieneRotulosDeDato,
  tieneTitulo,
} from '@/components/activities/office/excel/mi-primera-grafica/guion';

beforeAll(() => {
  if (typeof Element.prototype.scrollTo !== 'function') {
    Element.prototype.scrollTo = function scrollTo() {};
  }
});

beforeEach(() => reiniciarImpresora());

/* ── ayudas, calcadas de las de `ventana-hojas-funcion-si.test.tsx` ─────────*/

async function abrir(props: Partial<React.ComponentProps<typeof VentanaHojas>> = {}) {
  const salida = render(<VentanaHojas cinta={CINTA_EXCEL_BASICO} guion={GUION_MI_PRIMERA_GRAFICA} {...props} />);
  await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
  return salida;
}

async function abrirYEmpezar(props: Partial<React.ComponentProps<typeof VentanaHojas>> = {}) {
  const salida = await abrir(props);
  fireEvent.click(screen.getByText('Abrir el libro'));
  await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());
  return salida;
}

const celda = (direccion: string): HTMLElement =>
  document.querySelector(`[data-celda="${direccion}"]`) as HTMLElement;

/** Un botón de la cinta, un campo del panel de gráfico o del Backstage: todos
 *  se marcan con `data-control`. */
const porControl = (control: string): HTMLElement =>
  document.querySelector(`[data-control="${control}"]`) as HTMLElement;

const rejilla = (): HTMLElement => document.querySelector('.hjw-rejilla') as HTMLElement;

const encargo = (): string => document.querySelector('.txtw-encargo h3')?.textContent ?? '';

const grafica = (): HTMLElement | null => document.querySelector('.hjw-grafica');

const opcion = (texto: string): HTMLElement =>
  Array.from(document.querySelectorAll<HTMLElement>('.txtw-opcion')).find((b) => b.textContent === texto) as HTMLElement;

const enBackstage = (selector: string): HTMLElement => document.querySelector(selector) as HTMLElement;

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

function marcarRango(desde: string, hasta: string) {
  fireEvent.mouseDown(celda(desde));
  fireEvent.mouseDown(celda(hasta), { shiftKey: true });
}

function irAPestana(id: string) {
  fireEvent.click(document.querySelector(`[data-pestana="${id}"]`) as HTMLElement);
}

/** Selecciona la gráfica con un clic de cero celdas, igual que en la ventana. */
function pulsarLaGrafica() {
  fireEvent.mouseDown(grafica() as HTMLElement);
  fireEvent.mouseUp(window);
}

function escribirEnCampo(control: string, texto: string) {
  const input = porControl(control) as HTMLInputElement;
  fireEvent.change(input, { target: { value: texto } });
  fireEvent.blur(input);
}

/* ── (1) el libro de partida no adelanta ningún encargo ─────────────────────*/

describe('n5-mi-primera-grafica · el libro de partida', () => {
  it('no adelanta ningún encargo, y el id de la gráfica cuadra con el rango malo', () => {
    const libro = libroParaLaGrafica();
    expect(seHizoLaGraficaConElTotal(libro)).toBe(false);
    expect(seArreglaLaSeleccion(libro)).toBe(false);
    expect(laBarraSeMueveSola(libro)).toBe(false);
    expect(tieneTitulo(libro)).toBe(false);
    expect(tieneRotulosDeDato(libro)).toBe(false);
    expect(tieneEjesYSinLeyenda(libro)).toBe(false);
    expect(seImprimioSinArea()).toBe(false);
    expect(seImprimioConElAreaBuena()).toBe(false);
    expect(ID_GRAFICA).toBe(`g-h1-${RANGO_RESUMEN_CON_TOTAL.replace(':', '-')}-columnas`);
  });
});

/* ── (2) el recorrido completo, de principio a fin ───────────────────────────
   La prueba que habría cazado, en esta clase, lo que `n5-tus-primeras-
   formulas` encontró en la suya: un encargo que en realidad no se puede
   terminar. Cada paso se resuelve exactamente como lo pide su instrucción. */

describe('n5-mi-primera-grafica · el recorrido completo', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('los diez encargos se pueden terminar de principio a fin, y la ventana avisa que se acabó', async () => {
    const onTerminado = jest.fn();
    await abrirYEmpezar({ onTerminado });
    expect(encargo()).toBe('Hazla mal a propósito');

    // Encargo 1: A15:B22, con el Total dentro.
    marcarRango('A15', 'B22');
    irAPestana('insertar');
    fireEvent.click(porControl('grafico-columnas'));
    await celebrar();
    expect(encargo()).toBe('Arréglala sin borrarla');
    expect(grafica()).not.toBeNull();
    // La séptima barra —el Total, 12160— aplasta a la del camión, la más alta
    // de las seis de verdad (5200): es la barra gigante del bloque 17.
    const alturaTotal = Number(grafica()!.querySelector('[data-barra="0-6"]')?.getAttribute('height'));
    const alturaCamionAntes = Number(grafica()!.querySelector('[data-barra="0-0"]')?.getAttribute('height'));
    expect(alturaTotal).toBeGreaterThan(alturaCamionAntes * 1.8);

    // Encargo 2: se edita el rango de datos, no se borra la gráfica.
    pulsarLaGrafica();
    escribirEnCampo('grafica-datos', RANGO_RESUMEN_BUENO);
    await celebrar();
    expect(encargo()).toBe('Compruébalo: ¿de verdad mira la tabla?');
    expect(grafica()!.querySelectorAll('[data-barra]')).toHaveLength(6);
    expect(grafica()!.querySelector('[data-barra="0-6"]')).toBeNull();

    // Encargo 3: sube el camión a 5500 y la gráfica se entera sola.
    teclear('C4', '5500');
    await celebrar();
    expect(encargo()).toBe('Sin título no se entiende sola');

    // Encargo 4: título.
    pulsarLaGrafica();
    escribirEnCampo('grafica-titulo', 'Gastos de la salida a Teotihuacán');
    await celebrar();
    expect(encargo()).toBe('Más o menos no basta');

    // Encargo 5: rótulos de dato — y ahí se lee el 5500 del encargo 3.
    fireEvent.click(porControl('grafica-rotulos-de-dato'));
    await celebrar();
    expect(encargo()).toBe('Las dos últimas partes');
    const hayRotulo5500 = Array.from(grafica()!.querySelectorAll('text')).some((t) => t.textContent === '5500');
    expect(hayRotulo5500).toBe(true);

    // Encargo 6: los dos ejes, y la leyenda fuera.
    escribirEnCampo('grafica-eje-x', 'Concepto');
    escribirEnCampo('grafica-eje-y', 'Pesos');
    fireEvent.click(porControl('grafica-leyenda'));
    await celebrar();
    expect(encargo()).toBe('Antes de guardar, mira el nombre');

    // Encargo 7: el nombre del libro, en Archivo → Información.
    irAPestana('archivo');
    expect(document.querySelector('.hjb-sub')?.textContent).toContain('Gastos de la salida del salón.xlsx');
    fireEvent.click(enBackstage('[data-hjb="volver"]'));
    fireEvent.click(opcion('Gastos de la salida del salón.xlsx'));
    await celebrar();
    expect(encargo()).toBe('Guardar');

    // Encargo 8: guardar.
    irAPestana('archivo');
    fireEvent.click(enBackstage('[data-hjb-seccion="guardar"]'));
    fireEvent.click(enBackstage('[data-hjb-guardar]'));
    await celebrar();
    expect(encargo()).toBe('Imprímelo tal como está');

    // Encargo 9: imprimir sin área — dos páginas partidas.
    fireEvent.click(enBackstage('[data-hjb-seccion="imprimir"]'));
    fireEvent.click(enBackstage('[data-hjb-imprimir]'));
    await celebrar();
    expect(encargo()).toBe('Sólo lo que importa');
    expect(seImprimioSinArea()).toBe(true);

    // Encargo 10: el área que importa — una sola página.
    escribirEnCampo('grafica-datos', RANGO_RESUMEN_BUENO); // no-op, ya lo estaba
    const areaCampo = enBackstage('[data-hjb-area-campo]') as HTMLInputElement;
    fireEvent.change(areaCampo, { target: { value: AREA_DE_IMPRESION } });
    fireEvent.blur(areaCampo);
    fireEvent.click(enBackstage('[data-hjb-imprimir]'));
    await celebrar();

    expect(seImprimioConElAreaBuena()).toBe(true);
    expect(onTerminado).toHaveBeenCalledTimes(1);
  });
});

/* ── (3) jugando mal a propósito ─────────────────────────────────────────── */

describe('n5-mi-primera-grafica · jugando mal a propósito', () => {
  it('una sola celda marcada: «Gráfico de columnas» no hace nada', async () => {
    await abrirYEmpezar();
    fireEvent.mouseDown(celda('A15'));
    irAPestana('insertar');
    fireEvent.click(porControl('grafico-columnas'));
    expect(grafica()).toBeNull();
  });

  it('una columna de puro texto: la gráfica sale con un aviso, no con barras inventadas', async () => {
    await abrirYEmpezar();
    // A15:A21 es la columna «Concepto» del resumen: puro texto, ni un número.
    marcarRango('A15', 'A21');
    irAPestana('insertar');
    fireEvent.click(porControl('grafico-columnas'));
    expect(grafica()).not.toBeNull();
    expect(grafica()!.querySelectorAll('[data-barra]')).toHaveLength(0);
    const avisos = Array.from(grafica()!.querySelectorAll('[data-rotulo="aviso"]'));
    expect(avisos.length).toBeGreaterThan(0);
    expect(avisos[0].textContent ?? '').toMatch(/gráfica dibuja números, no palabras/);
  });

  it('un rango que no existe en «Rango de datos» deja la gráfica como estaba', async () => {
    await abrirYEmpezar();
    marcarRango('A15', 'B21');
    irAPestana('insertar');
    fireEvent.click(porControl('grafico-columnas'));
    expect(grafica()!.querySelectorAll('[data-barra]')).toHaveLength(6);

    pulsarLaGrafica();
    escribirEnCampo('grafica-datos', 'esto no es un rango');
    expect(grafica()!.querySelectorAll('[data-barra]')).toHaveLength(6);
  });

  it('el área de impresión escrita al revés imprime lo mismo que al derecho', async () => {
    await abrirYEmpezar();
    irAPestana('archivo');
    fireEvent.click(enBackstage('[data-hjb-seccion="imprimir"]'));
    const areaCampo = enBackstage('[data-hjb-area-campo]') as HTMLInputElement;
    // De abajo a la derecha hacia arriba a la izquierda, tal como avisa el
    // encargo 10 que también funcionaría.
    fireEvent.change(areaCampo, { target: { value: 'B22:A14' } });
    fireEvent.blur(areaCampo);
    fireEvent.click(enBackstage('[data-hjb-imprimir]'));
    expect(seImprimioConElAreaBuena()).toBe(true);
  });

  it('guardar deja aviso de guardado y no manda nada a la impresora', async () => {
    await abrirYEmpezar();
    irAPestana('archivo');
    fireEvent.click(enBackstage('[data-hjb-seccion="guardar"]'));
    fireEvent.click(enBackstage('[data-hjb-guardar]'));
    expect(document.querySelector('[data-hjb-guardado]')).not.toBeNull();
    expect(leerImpresora()).toHaveLength(0);
  });
});

/* ── (4) el defecto que se encontró al construir el panel ───────────────── */

describe('n5-mi-primera-grafica · el panel se esconde solo', () => {
  it('marcar una celda esconde el panel «Diseño de gráfico», como en Excel', async () => {
    await abrirYEmpezar();
    marcarRango('A15', 'B21');
    irAPestana('insertar');
    fireEvent.click(porControl('grafico-columnas'));
    pulsarLaGrafica();
    expect(document.querySelector('.hjw-panel-grafica')).not.toBeNull();

    fireEvent.mouseDown(celda('A1'));
    expect(document.querySelector('.hjw-panel-grafica')).toBeNull();
  });
});
