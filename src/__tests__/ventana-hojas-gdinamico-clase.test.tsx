/**
 * `of-excel-grafico-dinamico` · «Enséñaselo a alguien que no va a leer una
 * tabla» (bloques 51 · 52). La sexta clase exclusiva del grado Avanzado de
 * Tecnia Hojas.
 *
 * El motor —`grafico-dinamico`, `segmentacion`, `filtrar-segmentacion`,
 * `linea-tendencia`, `eje-secundario` y `datosDeDinamica`/`lineaDeTendencia`—
 * ya está probado en `motor-hojas-gdinamico.test.ts`, con sus «jugar mal»:
 * dinámica que no existe, campo fuera del origen, filtro que deja cero filas,
 * tendencia de un punto, tendencia de puro texto, eje secundario con una sola
 * serie. Este archivo prueba la CLASE: que el panel monta `PanelDinamica` sin
 * tocarlo y añade sus cuatro secciones al lado, que el filtro de la
 * segmentación SE VE (`.es-activo`), que el «n» de la tendencia se lee en el
 * panel y baja de 6 a 4 cuando se recorta la selección, y que la clase entera
 * se puede terminar de principio a fin sin un tropiezo.
 *
 * «Jugar mal» propio de esta clase —no del motor—: encender y apagar un botón
 * de mes de la segmentación dentro del mismo encargo, y comprobar que «Quitar
 * corte» nace deshabilitado porque todavía no hay nada que quitar.
 */

import { fireEvent, render, screen, waitFor, within, act } from '@testing-library/react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { CINTA_EXCEL_AVANZADO } from '@/components/activities/office/tecniaHojas';
import { GUION_GRAFICO_DINAMICO } from '@/components/activities/office/excel/grafico-dinamico/guion';
import PanelGraficoDinamico from '@/components/activities/office/excel/grafico-dinamico/Panel';
import CONTROLES_DINAMICA from '@/components/activities/office/excel/comun/controlesDinamica';
import CONTROLES_GRAFICO_DINAMICO from '@/components/activities/office/excel/grafico-dinamico/controles';

beforeAll(() => {
  if (typeof Element.prototype.scrollTo !== 'function') {
    Element.prototype.scrollTo = function scrollTo() {};
  }
});

const PANEL_FIJO = { titulo: 'Gráfico dinámico', Cuerpo: PanelGraficoDinamico };
const CONTROLES = { ...CONTROLES_DINAMICA, ...CONTROLES_GRAFICO_DINAMICO };

function ventana(onTerminado?: jest.Mock) {
  return (
    <VentanaHojas
      cinta={CINTA_EXCEL_AVANZADO}
      guion={GUION_GRAFICO_DINAMICO}
      panelFijo={PANEL_FIJO}
      controles={CONTROLES}
      onTerminado={onTerminado}
    />
  );
}

async function abrir() {
  const salida = render(ventana());
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

const din = (direccion: string): HTMLElement | null => document.querySelector(`[data-dinamica="${direccion}"]`);

const texto = (direccion: string): string => din(direccion)?.textContent ?? '';

const boton = (control: string): HTMLElement => document.querySelector(`[data-control="${control}"]`) as HTMLElement;

const botonCampo = (campo: number, zona: string): HTMLElement =>
  document.querySelector(`[data-control="campo-dinamica"][data-campo="${campo}"][data-zona="${zona}"]`) as HTMLElement;

const mesBoton = (mes: string): HTMLElement => document.querySelector(`[data-mes="${mes}"]`) as HTMLElement;

const rejilla = (): HTMLElement => document.querySelector('.hjw-rejilla') as HTMLElement;

const encargo = (): string => document.querySelector('.txtw-encargo h3')?.textContent ?? '';

const opcion = (texto: string): HTMLElement =>
  Array.from(document.querySelectorAll<HTMLElement>('.txtw-opcion')).find((b) => b.textContent === texto) as HTMLElement;

/** Una sección del panel de la clase, por el texto de su `<h4>`. */
function seccionPanel(titulo: string): HTMLElement {
  return Array.from(document.querySelectorAll<HTMLElement>('.pdn-seccion')).find(
    (s) => s.querySelector('h4')?.textContent === titulo,
  ) as HTMLElement;
}

/** La fila de una serie dentro de una sección del panel, por su título y el nombre de la serie. */
function filaDeSerie(seccionTitulo: string, nombreSerie: string): HTMLElement {
  return Array.from(seccionPanel(seccionTitulo).querySelectorAll<HTMLElement>('.pgd-series > li')).find((li) =>
    li.textContent?.includes(nombreSerie),
  ) as HTMLElement;
}

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

const CATEGORIA = 2;
const MES = 1;
const CANTIDAD = 4;

/* ── la cadena de encargos, cada helper construido sobre el anterior ───────── */

async function hastaElGraficoInsertado() {
  await abrirYEmpezar();
  fireEvent.click(boton('grafico-dinamico'));
  await celebrar();
}

async function hastaActualizado() {
  await hastaElGraficoInsertado();
  teclear('E2', '40');
  await celebrar();
  fireEvent.click(boton('actualizar-dinamica'));
  await celebrar();
}

async function hastaSegmentacionInsertada() {
  await hastaActualizado();
  fireEvent.click(boton('segmentacion'));
  await celebrar();
}

/** Enero y febrero encendidos — con un error a mitad de camino que se apaga otra vez. */
async function hastaFiltroEneroFebrero() {
  await hastaSegmentacionInsertada();
  fireEvent.click(mesBoton('enero'));
  fireEvent.click(mesBoton('marzo')); // jugar mal: se enciende el que no toca…
  fireEvent.click(mesBoton('marzo')); // …y se apaga otra vez.
  fireEvent.click(mesBoton('febrero'));
  await celebrar();
}

async function hastaMesEnFilas() {
  await hastaFiltroEneroFebrero();
  fireEvent.click(boton('quitar-filtro-segmentacion'));
  fireEvent.click(botonCampo(CATEGORIA, 'fuera'));
  fireEvent.click(botonCampo(MES, 'filas'));
  await celebrar();
}

async function hastaLaTendencia() {
  await hastaMesEnFilas();
  fireEvent.click(screen.getByRole('button', { name: 'Trazar tendencia' }));
  await celebrar();
}

async function hastaCuatroMesesYEleccion() {
  await hastaLaTendencia();
  fireEvent.click(mesBoton('enero'));
  fireEvent.click(mesBoton('febrero'));
  fireEvent.click(mesBoton('marzo'));
  fireEvent.click(mesBoton('abril'));
  await celebrar();
  fireEvent.click(
    opcion(
      'No hay una respuesta del programa: cuatro puntos son una tendencia tan legítima como cuarenta para el motor, y decidir si son suficientes es trabajo de quien lee el gráfico, no del programa',
    ),
  );
  await celebrar();
}

async function hastaDosValores() {
  await hastaCuatroMesesYEleccion();
  fireEvent.click(boton('quitar-filtro-segmentacion'));
  fireEvent.click(botonCampo(CANTIDAD, 'valores'));
  await celebrar();
}

describe('VentanaHojas · of-excel-grafico-dinamico se pinta', () => {
  it('la portada anuncia el tema, y el libro abre con la dinámica ya hecha y sin ningún gráfico', async () => {
    await abrir();
    expect(screen.getByText('Gráficos dinámicos, segmentación, línea de tendencia y eje secundario')).not.toBeNull();
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

    expect(texto('I2')).toBe('Etiquetas de fila');
    expect(texto('J2')).toBe('Suma de Importe');
    expect(texto('I3')).toBe('Bebidas');
    expect(texto('J6')).toBe('10900'); // Uniformes, antes de corregir E2
    expect(texto('J7')).toBe('19749');
    expect(document.querySelector('[data-grafica]')).toBeNull();
    expect(boton('grafico-dinamico')).not.toBeNull();
    expect(encargo()).toBe('Un gráfico que no lee celdas');
  });
});

describe('VentanaHojas · of-excel-grafico-dinamico, jugando mal a propósito', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('encargo 1 · el gráfico dinámico se inserta y se dibuja de verdad, sobre la dinámica', async () => {
    await hastaElGraficoInsertado();
    expect(document.querySelector('[data-grafica="g1"]')).not.toBeNull();
    expect(document.querySelector('.hjw-grafica-svg')).not.toBeNull();
    expect(encargo()).toBe('Cambia el origen, mira el gráfico');
  });

  it('encargos 2 y 3 · el origen cambia y el gráfico no se mueve hasta que se actualiza la dinámica', async () => {
    await hastaElGraficoInsertado();
    teclear('E2', '40');
    await celebrar();
    // La fórmula de la hoja sí se enteró al instante…
    expect(celda('G2').textContent).toBe('6000');
    // …y la dinámica —y el gráfico que lee de ella— siguen con lo viejo.
    expect(texto('J6')).toBe('10900');
    expect(encargo()).toBe('Actualiza — y el gráfico salta solo');

    fireEvent.click(boton('actualizar-dinamica'));
    await celebrar();
    expect(texto('J6')).toBe('16750');
    expect(texto('J7')).toBe('25599');
    expect(encargo()).toBe('Un mando en vez de un menú');
  });

  it('encargo 4 · la segmentación nace con sus seis meses, ninguno pulsado', async () => {
    await hastaSegmentacionInsertada();
    expect(mesBoton('enero')).not.toBeNull();
    expect(mesBoton('junio')).not.toBeNull();
    expect(mesBoton('enero').className).not.toContain('es-activo');
    expect(encargo()).toBe('Pulsa el mando');
  });

  it('encargo 5 · el filtro SE VE en los botones, filtra la dinámica y el gráfico a la vez, y un error se apaga solo', async () => {
    await hastaFiltroEneroFebrero();
    // El botón que se encendió por error (marzo) volvió a apagarse.
    expect(mesBoton('marzo').className).not.toContain('es-activo');
    expect(mesBoton('enero').className).toContain('es-activo');
    expect(mesBoton('febrero').className).toContain('es-activo');
    // Los uniformes sólo se vendieron en enero y febrero: filtrar a esos dos
    // meses no les quita ni una venta, y el total general sí baja.
    expect(texto('J6')).toBe('16750');
    expect(Number(texto('J7'))).toBeLessThan(25599);
    expect(encargo()).toBe('Vuelve a los seis meses, y cambia la pregunta');
  });

  it('encargo 6 · sin filtro y con Mes en Filas, las seis etiquetas salen en orden alfabético', async () => {
    await hastaMesEnFilas();
    expect(texto('I3')).toBe('abril');
    expect(texto('I9')).toBe('Total general');
    expect(texto('J9')).toBe('25599'); // sin filtro, el total vuelve a ser el de siempre
    expect(encargo()).toBe('Traza la línea de tendencia');
  });

  it('encargo 7 · la tendencia se traza sobre Importe, y el panel dice sobre cuántos puntos', async () => {
    await hastaLaTendencia();
    const fila = filaDeSerie('Línea de tendencia', 'Suma de Importe');
    expect(within(fila).getByText(/Trazada sobre/).textContent).toContain('6');
    expect(within(fila).getByText('Quitar tendencia')).not.toBeNull();
    expect(encargo()).toBe('La misma recta, con cuatro puntos');
  });

  it('encargos 8 y 9 · la misma recta con cuatro puntos sigue pareciendo segura, y la elección correcta cierra el encargo', async () => {
    await hastaCuatroMesesYEleccion();
    expect(encargo()).toBe('Dos números que no se parecen en nada');
  });

  it('encargo 10 · Cantidad entra a Valores y aparece la sección del eje secundario, con dos series', async () => {
    await hastaDosValores();
    const seccion = Array.from(document.querySelectorAll<HTMLElement>('.pdn-seccion')).find(
      (s) => s.querySelector('h4')?.textContent === 'Eje secundario',
    );
    expect(seccion).not.toBeUndefined();
    expect(seccion?.querySelectorAll('.pgd-series > li').length).toBe(2);
    expect(encargo()).toBe('Manda las piezas al segundo eje');
  });

  it('«Quitar corte» nace deshabilitado, y encargos 11 a 13 montan y deshacen la mentira del eje secundario', async () => {
    await hastaDosValores();

    const ejeSecundario = () => seccionPanel('Eje secundario');

    // JUGAR MAL: todavía no hay ningún corte que quitar.
    expect(within(ejeSecundario()).getByRole('button', { name: 'Quitar corte' }).hasAttribute('disabled')).toBe(true);

    fireEvent.click(within(filaDeSerie('Eje secundario', 'Suma de Cantidad')).getByText('Mandar al segundo eje'));
    await celebrar();
    expect(encargo()).toBe('Haz que las dos curvas parezcan ir juntas');

    fireEvent.change(screen.getByLabelText('Cortar el segundo eje en'), { target: { value: '200' } });
    fireEvent.click(within(ejeSecundario()).getByRole('button', { name: 'Cortar' }));
    await celebrar();
    expect(encargo()).toBe('Deshazla');
    expect(within(ejeSecundario()).getByRole('button', { name: 'Quitar corte' }).hasAttribute('disabled')).toBe(false);

    fireEvent.click(within(ejeSecundario()).getByRole('button', { name: 'Quitar corte' }));
    await celebrar();
    expect(screen.getByText('Terminaste')).not.toBeNull();
  });

  it('la clase entera se termina, de principio a fin, con 0 tropiezos', async () => {
    const onTerminado = jest.fn();
    render(ventana(onTerminado));
    await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

    // 1
    fireEvent.click(boton('grafico-dinamico'));
    await celebrar();
    // 2
    teclear('E2', '40');
    await celebrar();
    // 3
    fireEvent.click(boton('actualizar-dinamica'));
    await celebrar();
    // 4
    fireEvent.click(boton('segmentacion'));
    await celebrar();
    // 5
    fireEvent.click(mesBoton('enero'));
    fireEvent.click(mesBoton('febrero'));
    await celebrar();
    // 6
    fireEvent.click(boton('quitar-filtro-segmentacion'));
    fireEvent.click(botonCampo(CATEGORIA, 'fuera'));
    fireEvent.click(botonCampo(MES, 'filas'));
    await celebrar();
    // 7
    fireEvent.click(screen.getByRole('button', { name: 'Trazar tendencia' }));
    await celebrar();
    // 8
    fireEvent.click(mesBoton('enero'));
    fireEvent.click(mesBoton('febrero'));
    fireEvent.click(mesBoton('marzo'));
    fireEvent.click(mesBoton('abril'));
    await celebrar();
    // 9
    fireEvent.click(
      opcion(
        'No hay una respuesta del programa: cuatro puntos son una tendencia tan legítima como cuarenta para el motor, y decidir si son suficientes es trabajo de quien lee el gráfico, no del programa',
      ),
    );
    await celebrar();
    // 10
    fireEvent.click(boton('quitar-filtro-segmentacion'));
    fireEvent.click(botonCampo(CANTIDAD, 'valores'));
    await celebrar();
    // 11
    fireEvent.click(within(filaDeSerie('Eje secundario', 'Suma de Cantidad')).getByText('Mandar al segundo eje'));
    await celebrar();
    // 12
    fireEvent.change(screen.getByLabelText('Cortar el segundo eje en'), { target: { value: '200' } });
    fireEvent.click(within(seccionPanel('Eje secundario')).getByRole('button', { name: 'Cortar' }));
    await celebrar();
    // 13
    fireEvent.click(within(seccionPanel('Eje secundario')).getByRole('button', { name: 'Quitar corte' }));
    await celebrar();

    expect(screen.getByText('Terminaste')).not.toBeNull();
    expect(onTerminado).toHaveBeenCalledTimes(1);
    expect(onTerminado.mock.calls[0][0]).toMatchObject({ pasos: 13, tropiezos: 0 });
  });
});
