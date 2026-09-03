/**
 * `n7-datos-reales` · «Los datos llegan de fuera, y llegan sucios» (temario
 * §45.2, bloques 43 · 41).
 *
 * Se juega MAL a propósito, que es la regla de la casa: un archivo vacío, una
 * comilla que nunca se cierra, importar encima de datos que ya había sin
 * confirmar, y un botón que no se puede quedar apagado para siempre son los
 * casos que se prueban aparte. El recorrido completo, de principio a fin,
 * es la prueba de que los once encargos se pueden terminar —la razón por la
 * que existe está en `ventana-hojas-grafica-clase.test.tsx`: ahí se encontró
 * la clase con dos encargos imposibles de la que esta regla viene.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { CINTA_EXCEL_INTERMEDIO } from '@/components/activities/office/tecniaHojas';
import { reiniciarImpresora } from '@/components/office/motor-hojas/BackstageHojas';
import {
  ARCHIVOS_PARA_IMPORTAR,
  ARTICULOS_PAPELERIA,
  ENCABEZADO_PEDIDO,
  FILA_ASISTENCIA,
  FILA_CODIGOS,
  FILA_SUMA_CERO,
  FILA_TRAMPA,
  FILA_ULTIMA_PEDIDO,
  GUION_DATOS_REALES,
  PIE_PEDIDO,
  asistenciaBienImportada,
  codigosEstanImportados,
  encabezadoEstaPuesto,
  libroDeDatosReales,
  pedidoEstaImportado,
  pieEstaPuesto,
  seImprimioSinConfigurar,
  seReimprimioConfigurado,
  separadorEquivocadoEstaVisto,
  sumaDeCodigosEsCero,
  titulosEstanPuestos,
  trampaDeLaComaEstaVista,
} from '@/components/activities/office/excel/datos-reales/guion';

beforeAll(() => {
  if (typeof Element.prototype.scrollTo !== 'function') {
    Element.prototype.scrollTo = function scrollTo() {};
  }
});

beforeEach(() => reiniciarImpresora());

/* ── ayudas, calcadas de las de `ventana-hojas-grafica-clase.test.tsx` ──────*/

async function abrir(props: Partial<React.ComponentProps<typeof VentanaHojas>> = {}) {
  const salida = render(<VentanaHojas cinta={CINTA_EXCEL_INTERMEDIO} guion={GUION_DATOS_REALES} archivosParaImportar={ARCHIVOS_PARA_IMPORTAR} {...props} />);
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

const porControl = (control: string): HTMLElement =>
  document.querySelector(`[data-control="${control}"]`) as HTMLElement;

const rejilla = (): HTMLElement => document.querySelector('.hjw-rejilla') as HTMLElement;

const encargo = (): string => document.querySelector('.txtw-encargo h3')?.textContent ?? '';

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

function ponCampoBackstage(atributo: string, texto: string) {
  const input = document.querySelector(`[${atributo}]`) as HTMLInputElement;
  fireEvent.change(input, { target: { value: texto } });
  fireEvent.blur(input);
}

/* ── ayudas propias del panel «Importar datos» (bloque 43) ──────────────────*/

function abrirImportar() {
  fireEvent.click(porControl('importar-csv'));
}

function elegirArchivo(nombre: string) {
  fireEvent.click(document.querySelector(`[data-hjw-importar-archivo="${nombre}"]`) as HTMLElement);
}

function elegirSeparador(valor: string) {
  fireEvent.change(document.querySelector('[data-hjw-importar-separador]') as HTMLSelectElement, {
    target: { value: valor },
  });
}

function pulsarImportar() {
  fireEvent.click(document.querySelector('[data-hjw-importar-confirmar]') as HTMLElement);
}

const textoDelPanel = (): HTMLTextAreaElement => document.querySelector('[data-hjw-importar-texto]') as HTMLTextAreaElement;
const botonConfirmar = (): HTMLButtonElement | null => document.querySelector('[data-hjw-importar-confirmar]');

/* ── (1) el libro de partida no adelanta ningún encargo ─────────────────────*/

describe('n7-datos-reales · el libro de partida', () => {
  it('no adelanta ningún encargo, y el pedido tiene los 46 artículos de siempre', () => {
    const libro = libroDeDatosReales();
    expect(separadorEquivocadoEstaVisto(libro)).toBe(false);
    expect(asistenciaBienImportada(libro)).toBe(false);
    expect(trampaDeLaComaEstaVista(libro)).toBe(false);
    expect(codigosEstanImportados(libro)).toBe(false);
    expect(sumaDeCodigosEsCero(libro)).toBe(false);
    expect(pedidoEstaImportado(libro)).toBe(false);
    expect(seImprimioSinConfigurar(libro)).toBe(false);
    expect(titulosEstanPuestos(libro)).toBe(false);
    expect(encabezadoEstaPuesto(libro)).toBe(false);
    expect(pieEstaPuesto(libro)).toBe(false);
    expect(seReimprimioConfigurado(libro)).toBe(false);
    expect(ARTICULOS_PAPELERIA.length).toBe(46);
    expect(FILA_ULTIMA_PEDIDO).toBe(47);
  });
});

/* ── (2) el recorrido completo, de principio a fin ───────────────────────────
   Cada uno de los once encargos, resuelto exactamente como lo pide su
   instrucción, con las comprobaciones «reglas de la casa» metidas donde de
   verdad ocurren: el aviso antes de sustituir (encargo 2), el 0 que no avisa
   de nada (encargo 5) y el campo equivocado que no cuenta (encargo 9). */

describe('n7-datos-reales · el recorrido completo', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('los once encargos se pueden terminar de principio a fin, y la ventana avisa que se acabó', async () => {
    const onTerminado = jest.fn();
    await abrirYEmpezar({ onTerminado });
    expect(encargo()).toBe('El separador equivocado, a propósito');

    // Encargo 1: la asistencia, con la coma a propósito. Cae en una sola columna.
    fireEvent.mouseDown(celda('A3'));
    irAPestana('datos');
    abrirImportar();
    elegirArchivo('asistencia.csv');
    elegirSeparador(',');
    pulsarImportar();
    await celebrar();
    expect(encargo()).toBe('Otra vez, bien, en el mismo sitio');
    expect(celda(`A${FILA_ASISTENCIA}`).textContent).toBe('Alumno;Asistió');
    expect(celda(`B${FILA_ASISTENCIA}`).textContent).toBe('');

    // Encargo 2: la misma asistencia, bien, en la MISMA celda — avisa antes
    // de sustituir, y no toca nada hasta que se confirma.
    fireEvent.mouseDown(celda('A3'));
    abrirImportar();
    elegirArchivo('asistencia.csv');
    elegirSeparador(';');
    expect(document.querySelector('[data-hjw-importar-aviso]')).not.toBeNull();
    expect(celda(`A${FILA_ASISTENCIA}`).textContent).toBe('Alumno;Asistió');
    pulsarImportar();
    await celebrar();
    expect(encargo()).toBe('La trampa de la coma');
    expect(celda(`A${FILA_ASISTENCIA}`).textContent).toBe('Alumno');
    expect(celda(`B${FILA_ASISTENCIA}`).textContent).toBe('Asistió');

    // Encargo 3: la trampa de la coma — la fila de las resmas se parte en tres.
    fireEvent.mouseDown(celda('A12'));
    abrirImportar();
    elegirArchivo('precios_papeleria.csv');
    pulsarImportar();
    await celebrar();
    expect(encargo()).toBe('Ceros que no se pueden perder');
    const filaResmas = FILA_TRAMPA + 3;
    expect(celda(`A${filaResmas}`).textContent).toBe('Resmas de hojas (paquete)');
    expect(celda(`B${filaResmas}`).textContent).toBe('1');
    expect(celda(`C${filaResmas}`).textContent).toBe('250');

    // Encargo 4: los códigos con ceros a la izquierda — y el parte lo dice
    // ANTES de aceptar, que es lo que hay que leer.
    fireEvent.mouseDown(celda('A22'));
    abrirImportar();
    elegirArchivo('codigos.csv');
    const frasesPartes = Array.from(document.querySelectorAll('[data-hjw-importar-parte] li')).map((li) => li.textContent ?? '');
    expect(frasesPartes.some((f) => /TEXTO aunque parezca número/.test(f))).toBe(true);
    pulsarImportar();
    await celebrar();
    expect(encargo()).toBe('Súmala, y mira lo que pasa');
    expect(celda(`A${FILA_CODIGOS}`).textContent).toBe('Código');
    expect(celda(`A${FILA_CODIGOS + 1}`).textContent).toBe('007');

    // Encargo 5: =SUMA de la columna de códigos — da 0, sin ningún error.
    teclear(`B${FILA_SUMA_CERO}`, '=SUMA(A23:A25)');
    await celebrar();
    expect(encargo()).toBe('El pedido de verdad');
    expect(celda(`B${FILA_SUMA_CERO}`).textContent).toBe('0');

    // Encargo 6: el pedido real, en la hoja «Pedido».
    fireEvent.click(document.querySelector('[data-hoja="h2"]') as HTMLElement);
    fireEvent.mouseDown(celda('A1'));
    abrirImportar();
    elegirArchivo('pedido_papeleria.csv');
    pulsarImportar();
    await celebrar();
    expect(encargo()).toBe('Imprímelo tal como está');
    expect(celda('A1').textContent).toBe('Artículo');
    expect(celda('B1').textContent).toBe('Precio');
    expect(celda('A2').textContent).toBe(ARTICULOS_PAPELERIA[0].nombre);

    // Encargo 7: se imprime tal cual, sin nada configurado.
    irAPestana('archivo');
    fireEvent.click(enBackstage('[data-hjb-seccion="imprimir"]'));
    fireEvent.click(enBackstage('[data-hjb-imprimir]'));
    await celebrar();
    expect(encargo()).toBe('Que la fila de títulos no se quede en la página 1');

    // Encargo 8: «Filas que se repiten arriba».
    ponCampoBackstage('data-hjb-titulos', '1');
    await celebrar();
    expect(encargo()).toBe('Un papel suelto tiene que saber de quién es');

    // Encargo 9: el encabezado — puesto donde va el pie, primero, no cuenta.
    ponCampoBackstage('data-hjb-encabezado', PIE_PEDIDO);
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(encargo()).toBe('Un papel suelto tiene que saber de quién es');
    ponCampoBackstage('data-hjb-encabezado', ENCABEZADO_PEDIDO);
    await celebrar();
    expect(encargo()).toBe('Y cuándo se hizo');

    // Encargo 10: el pie, con la fecha.
    ponCampoBackstage('data-hjb-pie', PIE_PEDIDO);
    await celebrar();
    expect(encargo()).toBe('Ahora sí: imprímelo otra vez');

    // Encargo 11: se reimprime, ya configurado.
    fireEvent.click(enBackstage('[data-hjb-imprimir]'));
    await celebrar();

    expect(onTerminado).toHaveBeenCalledTimes(1);
  });
});

/* ── (3) jugando mal a propósito ─────────────────────────────────────────── */

describe('n7-datos-reales · jugando mal a propósito', () => {
  it('sin texto, o sin una sola celda marcada, el botón «Importar» no funciona', async () => {
    await abrirYEmpezar();
    irAPestana('datos');
    fireEvent.mouseDown(celda('A3'));
    abrirImportar();

    // Panel recién abierto: sin texto no hay parte, y el botón está apagado.
    expect(document.querySelector('[data-hjw-importar-parte]')).toBeNull();
    expect(botonConfirmar()?.disabled).toBe(true);

    // Puros espacios tampoco cuenta como archivo.
    fireEvent.change(textoDelPanel(), { target: { value: '   \n   ' } });
    expect(document.querySelector('[data-hjw-importar-parte]')).toBeNull();
    expect(botonConfirmar()?.disabled).toBe(true);

    // Con texto de verdad, pero con varias celdas marcadas —no una sola—,
    // el panel avisa dónde ponerse y sigue sin dejar importar.
    fireEvent.change(textoDelPanel(), { target: { value: 'Nombre,Precio\nRegla,10' } });
    marcarRango('A1', 'B2');
    expect(document.querySelector('.hjw-panel-importar-nota')).not.toBeNull();
    expect(botonConfirmar()?.disabled).toBe(true);
  });

  it('una comilla que nunca se cierra bloquea con un error, no con un botón de importar', async () => {
    await abrirYEmpezar();
    irAPestana('datos');
    fireEvent.mouseDown(celda('A3'));
    abrirImportar();
    fireEvent.change(textoDelPanel(), { target: { value: 'a,"b\nc,d' } });
    expect(document.querySelector('[data-hjw-importar-error]')).not.toBeNull();
    expect(botonConfirmar()).toBeNull();
    expect(celda('A3').textContent).toBe('');
  });

  it('importar sobre datos que ya había avisa, y no sustituye hasta que se confirma', async () => {
    await abrirYEmpezar();
    teclear('A3', 'hola');
    irAPestana('datos');
    fireEvent.mouseDown(celda('A3'));
    abrirImportar();
    elegirArchivo('asistencia.csv');
    elegirSeparador(';');
    expect(document.querySelector('[data-hjw-importar-aviso]')).not.toBeNull();
    expect(celda('A3').textContent).toBe('hola');
    pulsarImportar();
    expect(celda('A3').textContent).toBe('Alumno');
  });

  it('el botón «Desde texto o CSV» nunca se ve apagado, y abre el panel de verdad', async () => {
    await abrirYEmpezar();
    irAPestana('datos');
    expect(porControl('importar-csv').getAttribute('aria-disabled')).toBe('false');
    fireEvent.mouseDown(celda('A1'));
    expect(porControl('importar-csv').getAttribute('aria-disabled')).toBe('false');
    abrirImportar();
    expect(textoDelPanel()).not.toBeNull();
  });
});
