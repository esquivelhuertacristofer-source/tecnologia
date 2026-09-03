/**
 * `of-excel-dashboard` · «Un tablero de una sola pantalla» (bloque 58). La
 * última clase de la sala de Excel y el proyecto de cierre de las veintidós
 * anteriores.
 *
 * Se juega MAL a propósito, que es la regla de la casa, y aquí «mal» son las
 * cinco maneras concretas de arruinar un tablero: meter los trescientos
 * renglones en el papel, poner cuatro gráficos que dicen lo mismo, un pastel de
 * una porción por renglón, dejar el `#¡DIV/0!` tapado con un cero —eso tiene que
 * SUSPENDER— y poner lo importante abajo del todo. Y hay un recorrido de la
 * clase entera, de principio a fin, porque en una clase que **borra cosas a
 * propósito** un `comprueba` encadenado se vuelve imposible con una facilidad
 * que no tiene ninguna otra.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { CINTA_EXCEL_AVANZADO } from '@/components/activities/office/tecniaHojas';
import { crearBackstageHojas, leerImpresora, reiniciarImpresora } from '@/components/office/motor-hojas/BackstageHojas';
import {
  AREA_IMPRESION,
  CONTRA_LA_META,
  CRECIMIENTO,
  elErrorQueElCeroTapa,
  GUION_DASHBOARD,
  libroDelTablero,
  SUMA_UNIFORMES,
  seEntregoEnUnaPagina,
  TOTAL_DEL_SEMESTRE,
  VENTAS_DE_ENERO,
  VENTAS_DE_JUNIO,
} from '@/components/activities/office/excel/dashboard/guion';
import PanelTablero from '@/components/activities/office/excel/dashboard/PanelTablero';
import CONTROLES_TABLERO from '@/components/activities/office/excel/dashboard/controles';

beforeAll(() => {
  if (typeof Element.prototype.scrollTo !== 'function') {
    Element.prototype.scrollTo = function scrollTo() {};
  }
});

beforeEach(() => reiniciarImpresora());

const PANEL_FIJO = { titulo: 'Tablero', Cuerpo: PanelTablero };
const Backstage = crearBackstageHojas({ secciones: ['imprimir'] });

async function abrir(props: Partial<React.ComponentProps<typeof VentanaHojas>> = {}) {
  const salida = render(
    <VentanaHojas
      cinta={CINTA_EXCEL_AVANZADO}
      guion={GUION_DASHBOARD}
      panelFijo={PANEL_FIJO}
      controles={CONTROLES_TABLERO}
      backstage={Backstage}
      {...props}
    />,
  );
  await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
  return salida;
}

async function abrirYEmpezar(props: Partial<React.ComponentProps<typeof VentanaHojas>> = {}) {
  const salida = await abrir(props);
  fireEvent.click(screen.getByText('Abrir el libro'));
  await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());
  return salida;
}

/* ── ayudas ────────────────────────────────────────────────────────────────*/

const celda = (d: string): HTMLElement => document.querySelector(`[data-celda="${d}"]`) as HTMLElement;
const din = (d: string): HTMLElement | null => document.querySelector(`[data-dinamica="${d}"]`);
const textoDin = (d: string): string => din(d)?.textContent ?? '';
const boton = (c: string): HTMLElement => document.querySelector(`[data-control="${c}"]`) as HTMLElement;
const rejilla = (): HTMLElement => document.querySelector('.hjw-rejilla') as HTMLElement;
const grafica = (): HTMLElement | null => document.querySelector('.hjw-grafica');
const encargo = (): string => document.querySelector('.txtw-encargo h3')?.textContent ?? '';
const aviso = (): string => document.querySelector('.txtw-aviso')?.textContent ?? '';
const opcion = (t: string): HTMLElement =>
  Array.from(document.querySelectorAll<HTMLElement>('.txtw-opcion')).find((b) => b.textContent === t) as HTMLElement;
const enBackstage = (s: string): HTMLElement => document.querySelector(s) as HTMLElement;

async function celebrar() {
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
}

const irAPestana = (id: string) => fireEvent.click(document.querySelector(`[data-pestana="${id}"]`) as HTMLElement);

function teclear(d: string, texto: string) {
  fireEvent.mouseDown(celda(d));
  fireEvent.keyDown(rejilla(), { key: texto[0] });
  const editor = document.querySelector('.hjw-editor') as HTMLInputElement;
  fireEvent.change(editor, { target: { value: texto } });
  fireEvent.keyDown(editor, { key: 'Enter' });
}

function marcar(desde: string, hasta?: string) {
  fireEvent.mouseDown(celda(desde));
  if (hasta) fireEvent.mouseDown(celda(hasta), { shiftKey: true });
}

function escribirEnPanel(control: string, texto: string) {
  fireEvent.click(boton(control));
  const campo = document.querySelector('.hjw-campo-texto') as HTMLInputElement;
  fireEvent.change(campo, { target: { value: texto } });
  fireEvent.click(document.querySelector('.hjw-aplicar') as HTMLElement);
}

/** El desplegable «Formato de número» de Inicio → Número. */
function ponerFormato(nombre: string) {
  fireEvent.click(boton('formato-numero'));
  const objetivo = Array.from(document.querySelectorAll<HTMLElement>('.hjw-tipo')).find(
    (o) => o.querySelector('.hjw-tipo-nombre')?.textContent === nombre,
  );
  if (!objetivo) throw new Error(`no se encontró el formato «${nombre}»`);
  fireEvent.click(objetivo);
}

function pulsarLaGrafica() {
  fireEvent.mouseDown(grafica() as HTMLElement);
  fireEvent.mouseUp(window);
}

function ponerTitulo(texto: string) {
  pulsarLaGrafica();
  const input = boton('grafica-titulo') as HTMLInputElement;
  fireEvent.change(input, { target: { value: texto } });
  fireEvent.blur(input);
}

const CATEGORIA = 2;
const IMPORTE = 6;

const botonCampo = (campo: number, zona: string): HTMLElement =>
  document.querySelector(`[data-control="campo-dinamica"][data-campo="${campo}"][data-zona="${zona}"]`) as HTMLElement;

function crearLaDinamica() {
  marcar('A21');
  fireEvent.change(screen.getByLabelText('Dónde ponerla'), { target: { value: 'A12' } });
  fireEvent.click(boton('crear-dinamica'));
  fireEvent.click(botonCampo(CATEGORIA, 'filas'));
  fireEvent.click(botonCampo(IMPORTE, 'valores'));
}

function imprimirConArea(area?: string) {
  if (!enBackstage('[data-hjb-seccion="imprimir"]')) irAPestana('archivo');
  fireEvent.click(enBackstage('[data-hjb-seccion="imprimir"]'));
  if (area !== undefined) {
    const campo = enBackstage('[data-hjb-area-campo]') as HTMLInputElement;
    fireEvent.change(campo, { target: { value: area } });
    fireEvent.blur(campo);
  }
  fireEvent.click(enBackstage('[data-hjb-imprimir]'));
}

const ELEGIR_LAS_TRES =
  'Tres cosas y sólo tres: cuánto entró y cómo va contra la meta, de dónde vino ese dinero, y si venimos subiendo o bajando';
const ELEGIR_EL_CERO =
  'Que B5 está vacía, así que la división da #¡DIV/0!, y un SI.ERROR lo está tapando con un cero que parece un dato';
const ELEGIR_COMPARADO =
  'No se puede saber. Un número solo no dice nada: dice algo COMPARADO — y aquí faltaron 4 251 para la meta, pero se subió un 15 % contra el semestre pasado';
const ELEGIR_ARRIBA =
  'Los tres números contra su comparación, porque una pantalla se lee de arriba a la izquierda y lo que va abajo se ve menos — y dónde va cada cosa es una decisión tuya, la tomes o no';

/** Hasta el encargo 2 resuelto: el tablero ya limpio de lo que no contesta. */
async function hastaLimpiarElTablero() {
  await abrirYEmpezar();
  fireEvent.click(opcion(ELEGIR_LAS_TRES));
  await celebrar();
  fireEvent.click(boton('borrar-grafico'));
  fireEvent.click(boton('borrar-minigraficos'));
  await celebrar();
}

/** Hasta el encargo 5 resuelto: el error destapado y el dato traído. */
async function hastaElPorcentajeHonesto() {
  await hastaLimpiarElTablero();
  fireEvent.click(opcion(ELEGIR_EL_CERO));
  await celebrar();
  teclear('B8', '=(B6-B5)/B5');
  await celebrar();
  teclear('B5', '17200');
  marcar('B8');
  ponerFormato('Porcentaje');
  await celebrar();
}

/** Hasta el encargo 6 resuelto: y además comparado. */
async function hastaElNumeroHonesto() {
  await hastaElPorcentajeHonesto();
  fireEvent.click(opcion(ELEGIR_COMPARADO));
  await celebrar();
}

/** Los encargos 7 y 8, que son la antesala del de las gráficas. */
async function elResumenYElColor() {
  crearLaDinamica();
  await celebrar();
  irAPestana('inicio');
  marcar('B6', 'B8');
  escribirEnPanel('regla-formula', '=B6<0');
  await celebrar();
}

/* ── se pinta ──────────────────────────────────────────────────────────────*/

describe('VentanaHojas · of-excel-dashboard se pinta', () => {
  it('los números que la clase cuenta salen de las trescientas ventas, no están escritos a mano', () => {
    expect(TOTAL_DEL_SEMESTRE).toBe(19749);
    expect(CONTRA_LA_META).toBe(-4251);
    expect(Number(CRECIMIENTO.toFixed(4))).toBe(0.1482);
    expect(SUMA_UNIFORMES).toBe(10900);
    // El semestre CRECIÓ contra el año pasado y a la vez viene cayendo mes a
    // mes: las dos son verdad, y ésa es la clase.
    expect(VENTAS_DE_ENERO).toBe(9329);
    expect(VENTAS_DE_JUNIO).toBe(1314);
  });

  it('el libro abre con el tablero heredado: el pastel, los tres minigráficos y el cero que miente', async () => {
    await abrir();
    expect(screen.getByText(/qué va arriba, qué va grande y qué sobra/i)).not.toBeNull();
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

    expect(celda('B6').textContent).toContain('19,749');
    expect(celda('B7').textContent).toContain('4,251');
    // El cero mentiroso: no hay ningún símbolo de error a la vista…
    expect(celda('B8').textContent).toBe('0');
    // …y debajo de ese cero bien portado hay un #¡DIV/0!, preguntado al motor y
    // no afirmado por el guion.
    expect(elErrorQueElCeroTapa(libroDelTablero())).toBe('#¡DIV/0!');
    expect(grafica()).not.toBeNull();
    expect(document.querySelectorAll('.hjw-minigrafico')).toHaveLength(3);
    // Las trescientas filas, pegadas debajo del tablero.
    expect(celda('A20').textContent).toBe('Fecha');
    expect(celda('C21').textContent).toBe('Uniformes');
    expect(encargo()).toBe('Antes de tocar nada: ¿qué necesita saber la directora?');
  });
});

/* ── jugando mal a propósito ───────────────────────────────────────────────*/

describe('VentanaHojas · of-excel-dashboard, jugando mal a propósito', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('encargo 2 · borrar sólo el pastel deja el tablero a medio limpiar y no cierra', async () => {
    await abrirYEmpezar();
    fireEvent.click(opcion(ELEGIR_LAS_TRES));
    await celebrar();
    expect(encargo()).toBe('Lo más difícil de todo: borrar cosas que funcionan');

    // JUGAR MAL · el pastel fuera y los tres minigráficos dentro.
    fireEvent.click(boton('borrar-grafico'));
    await celebrar();
    expect(grafica()).toBeNull();
    expect(encargo()).toBe('Lo más difícil de todo: borrar cosas que funcionan');

    fireEvent.click(boton('borrar-minigraficos'));
    await celebrar();
    expect(document.querySelectorAll('.hjw-minigrafico')).toHaveLength(0);
    expect(encargo()).toBe('Ahora mira B8, y desconfía');
  });

  it('encargo 4 · volver a tapar el #¡DIV/0! con un cero SUSPENDE; la fórmula desnuda lo saca a la luz', async () => {
    await hastaLimpiarElTablero();
    fireEvent.click(opcion(ELEGIR_EL_CERO));
    await celebrar();
    expect(encargo()).toBe('Destápalo antes de arreglarlo');

    // JUGAR MAL · el tablero se ve limpio y sigue mintiendo: no cierra.
    teclear('B8', '=SI.ERROR((B6-B5)/B5,0)');
    await celebrar();
    expect(celda('B8').textContent).toBe('0');
    expect(encargo()).toBe('Destápalo antes de arreglarlo');

    // JUGAR MAL · tapar con un texto tampoco vale: sigue siendo tapar.
    teclear('B8', '=SI.ERROR((B6-B5)/B5,"—")');
    await celebrar();
    expect(encargo()).toBe('Destápalo antes de arreglarlo');

    teclear('B8', '=(B6-B5)/B5');
    await celebrar();
    expect(celda('B8').textContent).toBe('#¡DIV/0!');
    expect(encargo()).toBe('Y ahora sí: trae el dato que nadie fue a buscar');
  });

  it('encargo 5 · con el dato puesto el error se va, pero sin el formato el encargo no cierra', async () => {
    await hastaLimpiarElTablero();
    fireEvent.click(opcion(ELEGIR_EL_CERO));
    await celebrar();
    teclear('B8', '=(B6-B5)/B5');
    await celebrar();

    // JUGAR MAL · el dato sí, el formato no: 0.148… en una pantalla de junta.
    teclear('B5', '17200');
    await celebrar();
    expect(celda('B8').textContent).toContain('0.148');
    expect(encargo()).toBe('Y ahora sí: trae el dato que nadie fue a buscar');

    marcar('B8');
    ponerFormato('Porcentaje');
    await celebrar();
    // La celda sigue guardando 0.1482075…, sólo que se enseña redondeada: el
    // formato no cambia el dato (bloque 6).
    expect(celda('B8').textContent).toBe('15%');
    expect(encargo()).toBe('Un momento: ¿19 749 es bueno o es malo?');
  });

  it('encargo 7 · la dinámica resume las trescientas filas de abajo en cuatro renglones', async () => {
    await hastaElNumeroHonesto();
    expect(encargo()).toBe('La segunda pregunta: ¿de dónde vino ese dinero?');

    crearLaDinamica();
    await celebrar();

    expect(textoDin('A12')).toBe('Etiquetas de fila');
    expect(textoDin('B12')).toBe('Suma de Importe');
    expect(textoDin('A13')).toBe('Bebidas');
    expect(textoDin('A16')).toBe('Uniformes');
    expect(textoDin('B16')).toBe('10900');
    expect(textoDin('A17')).toBe('Total general');
    expect(textoDin('B17')).toBe('19749');
    // Se pinta entre la banda y el detalle, sin tocar ninguno de los dos.
    expect(din('B18')).toBeNull();
    expect(celda('A20').textContent).toBe('Fecha');
    expect(encargo()).toBe('Que el número malo se vea sin leerlo');
  });

  it('encargo 8 · destacar todo es no destacar; y la regla que sobra se puede quitar', async () => {
    await hastaElNumeroHonesto();
    crearLaDinamica();
    await celebrar();
    irAPestana('inicio');

    // JUGAR MAL · pintar de más, y sobre OTRO rango: no cierra, y volver a
    // aplicar la buena tampoco la reemplaza —id distinto, rango distinto—.
    marcar('B4', 'B8');
    escribirEnPanel('regla-formula', '=B4>0');
    await celebrar();
    expect(encargo()).toBe('Que el número malo se vea sin leerlo');

    marcar('B6', 'B8');
    escribirEnPanel('regla-formula', '=B6<0');
    await celebrar();
    expect(encargo()).toBe('Que el número malo se vea sin leerlo');

    // Y aquí está la salida: la ✕ de la regla que sobra, en el panel.
    fireEvent.click(
      document.querySelector('[data-control="borrar-reglas"][data-regla="r-tab-B4-B8-formula"]') as HTMLElement,
    );
    await celebrar();
    expect(encargo()).toBe('La tercera pregunta: ¿venimos subiendo o bajando?');
  });

  /*
   * El pastel de muchas porciones y los cuatro gráficos que dicen lo mismo se
   * arman durante el encargo 6, que es una ELECCIÓN: sin `senal.control` no hay
   * botón esperado, así que la guarda del desvío no corta nada y el alumno
   * puede llenar la hoja de dibujos, que es exactamente lo que pasa en la vida
   * real. Durante el encargo 9, en cambio, `senal: grafico-lineas` hace que
   * pulsar «Gráfico circular» avise y **no toque el libro** — así que la prueba
   * que importa es que el desastre ya hecho se pueda deshacer.
   */
  it('encargo 9 · un pastel de la lista cruda y cuatro gráficos que dicen lo mismo suspenden; una línea con título pasa', async () => {
    await hastaElPorcentajeHonesto();
    irAPestana('insertar');
    // JUGAR MAL · un pastel con una porción por renglón de la lista cruda.
    marcar('A20', 'G30');
    fireEvent.click(boton('grafico-circular'));
    // JUGAR MAL · y encima dos gráficos más de los mismos seis números.
    marcar('D4', 'E10');
    fireEvent.click(boton('grafico-columnas'));
    fireEvent.click(boton('grafico-circular'));
    expect(document.querySelectorAll('.hjw-grafica')).toHaveLength(3);

    fireEvent.click(opcion(ELEGIR_COMPARADO));
    await celebrar();
    await elResumenYElColor();
    expect(encargo()).toBe('La tercera pregunta: ¿venimos subiendo o bajando?');

    irAPestana('insertar');
    marcar('D4', 'E10');
    fireEvent.click(boton('grafico-lineas'));
    await celebrar();
    // Cuatro gráficos, uno de ellos el bueno, y el encargo NO se cierra.
    expect(document.querySelectorAll('.hjw-grafica')).toHaveLength(4);
    expect(encargo()).toBe('La tercera pregunta: ¿venimos subiendo o bajando?');

    // Se arregla eligiendo UNA: las otras tres, fuera por su ✕.
    for (let i = 0; i < 3; i += 1) {
      const sobra = Array.from(document.querySelectorAll<HTMLElement>('[data-control="borrar-grafico"]')).find(
        (b) => b.getAttribute('data-grafica') !== 'g-tab-D4-E10-lineas',
      ) as HTMLElement;
      fireEvent.click(sobra);
    }
    await celebrar();
    expect(document.querySelectorAll('.hjw-grafica')).toHaveLength(1);
    // Todavía sin título: una gráfica sin título no se entiende sola.
    expect(encargo()).toBe('La tercera pregunta: ¿venimos subiendo o bajando?');

    ponerTitulo('De enero a junio: vamos cayendo');
    await celebrar();
    expect(encargo()).toBe('Si sólo mirara media pantalla, ¿qué tiene que haber visto?');
  });

  it('encargo 12 · proteger sin desbloquear antes deja la meta bajo llave y el encargo abierto', async () => {
    await hastaElNumeroHonesto();
    await elResumenYElColor();
    irAPestana('insertar');
    marcar('D4', 'E10');
    fireEvent.click(boton('grafico-lineas'));
    ponerTitulo('De enero a junio: vamos cayendo');
    await celebrar();
    fireEvent.click(opcion(ELEGIR_ARRIBA));
    await celebrar();
    irAPestana('vista');
    marcar('A19');
    fireEvent.click(boton('inmovilizar'));
    await celebrar();
    expect(encargo()).toBe('Con llave, para que un despiste no lo tire');

    // JUGAR MAL · el orden del bloque 54, al revés: proteger primero.
    irAPestana('revisar');
    fireEvent.click(boton('proteger-hoja'));
    await celebrar();
    expect(encargo()).toBe('Con llave, para que un despiste no lo tire');
    teclear('B4', '26000');
    expect(aviso()).toContain('protegida');

    fireEvent.click(boton('desproteger-hoja'));
    marcar('B4', 'B5');
    fireEvent.click(boton('desbloquear-rango'));
    fireEvent.click(boton('proteger-hoja'));
    await celebrar();
    expect(encargo()).toBe('Y en papel, una sola hoja');
  });

  it('encargo 13 · imprimir los trescientos renglones saca dieciséis páginas y no cierra; con el área, una', async () => {
    // Se entra por el último encargo sin recorrer la clase: lo que se prueba
    // aquí es la impresora, y la bandeja no sabe de encargos.
    await abrirYEmpezar();

    // JUGAR MAL · meter las trescientas filas en el papel.
    imprimirConArea();
    expect(leerImpresora()[0].paginas).toBeGreaterThan(10);
    expect(seEntregoEnUnaPagina()).toBe(false);

    imprimirConArea(AREA_IMPRESION);
    expect(leerImpresora()[0].paginas).toBe(1);
    expect(seEntregoEnUnaPagina()).toBe(true);
  });

  it('encargo 10 · poner lo importante abajo del todo se marca como error y no avanza', async () => {
    await hastaElNumeroHonesto();
    await elResumenYElColor();
    irAPestana('insertar');
    marcar('D4', 'E10');
    fireEvent.click(boton('grafico-lineas'));
    ponerTitulo('De enero a junio: vamos cayendo');
    await celebrar();
    expect(encargo()).toBe('Si sólo mirara media pantalla, ¿qué tiene que haber visto?');

    // JUGAR MAL · «da igual el orden, si todo cabe se ve todo por igual».
    fireEvent.click(opcion('Da igual el orden: si todo cabe en una pantalla, se ve todo por igual'));
    expect(document.querySelector('.txtw-error')).not.toBeNull();
    expect(encargo()).toBe('Si sólo mirara media pantalla, ¿qué tiene que haber visto?');

    fireEvent.click(opcion(ELEGIR_ARRIBA));
    await celebrar();
    expect(encargo()).toBe('Que la banda no se vaya cuando alguien baje');
  });
});

/* ── el recorrido entero ───────────────────────────────────────────────────*/

describe('VentanaHojas · of-excel-dashboard, de principio a fin', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('la clase entera se termina, con 0 tropiezos', async () => {
    const onTerminado = jest.fn();
    await abrirYEmpezar({ onTerminado });

    // 1
    fireEvent.click(opcion(ELEGIR_LAS_TRES));
    await celebrar();
    // 2
    fireEvent.click(boton('borrar-grafico'));
    fireEvent.click(boton('borrar-minigraficos'));
    await celebrar();
    // 3
    fireEvent.click(opcion(ELEGIR_EL_CERO));
    await celebrar();
    // 4
    teclear('B8', '=(B6-B5)/B5');
    await celebrar();
    // 5
    teclear('B5', '17200');
    marcar('B8');
    ponerFormato('Porcentaje');
    await celebrar();
    // 6
    fireEvent.click(opcion(ELEGIR_COMPARADO));
    await celebrar();
    // 7
    crearLaDinamica();
    await celebrar();
    // 8
    marcar('B6', 'B8');
    escribirEnPanel('regla-formula', '=B6<0');
    await celebrar();
    // 9
    irAPestana('insertar');
    marcar('D4', 'E10');
    fireEvent.click(boton('grafico-lineas'));
    ponerTitulo('De enero a junio: vamos cayendo');
    await celebrar();
    // 10
    fireEvent.click(opcion(ELEGIR_ARRIBA));
    await celebrar();
    // 11
    irAPestana('vista');
    marcar('A19');
    fireEvent.click(boton('inmovilizar'));
    await celebrar();
    // 12
    irAPestana('revisar');
    marcar('B4', 'B5');
    fireEvent.click(boton('desbloquear-rango'));
    fireEvent.click(boton('proteger-hoja'));
    await celebrar();
    // 13
    imprimirConArea(AREA_IMPRESION);
    await celebrar();

    expect(screen.getByText('Terminaste')).not.toBeNull();
    expect(onTerminado).toHaveBeenCalledTimes(1);
    expect(onTerminado.mock.calls[0][0]).toMatchObject({ pasos: 13, tropiezos: 0 });
  });
});
