/**
 * `of-excel-consolida-y-protege` · «Juntar hojas y cerrar con llave»
 * (bloques 53 · 54). Tercera clase exclusiva del grado Avanzado de Tecnia
 * Hojas.
 *
 * Se juega MAL a propósito (regla de la casa) y se recorre la clase entera de
 * principio a fin: un botón equivocado antes de consolidar, una forma
 * distinta al consolidar, proteger una hoja SIN desbloquear nada antes —la
 * trampa contraintuitiva del bloque 54— y comprobar que, arreglado el orden,
 * escribir dentro de lo desbloqueado sí deja y fuera de lo desbloqueado
 * sigue sin dejar.
 *
 * El resto de la matriz de «jugar mal» —borrar una fila de una hoja
 * protegida, renombrar con la estructura protegida, deshacer un gesto de
 * protección— ya está probada a nivel de motor en
 * `motor-hojas-protege.test.ts`; este archivo prueba la VENTANA: que el
 * guion, la cinta nueva («Revisar») y el panel de texto de «Consolidar»
 * están bien conectados de punta a punta.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { CINTA_EXCEL_AVANZADO } from '@/components/activities/office/tecniaHojas';
import { GUION_CONSOLIDA_Y_PROTEGE } from '@/components/activities/office/excel/consolida-y-protege/guion';

beforeAll(() => {
  if (typeof Element.prototype.scrollTo !== 'function') {
    Element.prototype.scrollTo = function scrollTo() {};
  }
});

async function abrir() {
  const salida = render(<VentanaHojas cinta={CINTA_EXCEL_AVANZADO} guion={GUION_CONSOLIDA_Y_PROTEGE} />);
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

/** Abre el panel de un control de texto libre, escribe y pulsa «Aplicar». */
function escribirEnPanel(control: string, texto: string) {
  fireEvent.click(boton(control));
  const campo = document.querySelector('.hjw-campo-texto') as HTMLInputElement;
  fireEvent.change(campo, { target: { value: texto } });
  fireEvent.click(document.querySelector('.hjw-aplicar') as HTMLElement);
}

/** Consolidar vive en Datos → Herramientas de datos. */
function irADatos() {
  fireEvent.click(document.querySelector('[data-pestana="datos"]') as HTMLElement);
}

/** Los cinco de proteger viven en la pestaña nueva, Revisar. */
function irARevisar() {
  fireEvent.click(document.querySelector('[data-pestana="revisar"]') as HTMLElement);
}

const ORIGEN_MALO = 'Grupo A!B4:B6,Grupo B!B4:B7,Grupo C!B4:B6|suma';
const ORIGEN_BUENO = 'Grupo A!B4:B6,Grupo B!B4:B6,Grupo C!B4:B6|suma';

/** Encargos 1 y 2, ya jugados bien, para llegar rápido a los del bloque 54. */
async function hastaLaFormulaViva() {
  await abrirYEmpezar();
  irADatos();
  fireEvent.mouseDown(celda('B4'));
  escribirEnPanel('consolidar', ORIGEN_MALO);
  escribirEnPanel('consolidar', ORIGEN_BUENO);
  await celebrar();
  fireEvent.click(lengueta('gb'));
  teclear('B5', '1500');
  await celebrar();
}

/** Hasta el encargo 6 («protege-primero»), con las tres elecciones ya bien contestadas y ya en Grupo A. */
async function hastaProtegerPrimero() {
  await hastaLaFormulaViva();
  fireEvent.click(screen.getByText(/el total se corrige solo/));
  await celebrar();
  fireEvent.click(screen.getByText(/no se puede usar como su propio origen/));
  await celebrar();
  fireEvent.click(screen.getByText(/no hay contraseña, y no es para alguien con intención de saltárselo/));
  await celebrar();
  irARevisar();
  fireEvent.click(lengueta('ga'));
}

/** Hasta el encargo 8 («arreglar-el-orden»), con la hoja ya protegida al revés. */
async function hastaElOrdenSeArregla() {
  await hastaProtegerPrimero();
  fireEvent.click(boton('proteger-hoja'));
  await celebrar();
  fireEvent.click(screen.getByText(/todas las celdas nacen bloqueadas/));
  await celebrar();
}

describe('VentanaHojas · of-excel-consolida-y-protege se pinta', () => {
  it('la portada anuncia el tema, y el libro abre en Total con las tres hojas cargadas y sin consolidar', async () => {
    await abrir();
    expect(screen.getByText('Consolidar y proteger: cuando la hoja la va a llenar otra persona')).not.toBeNull();
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

    expect(celda('A4').textContent).toBe('Aguas frescas');
    expect(celda('B4').textContent).toBe('');
    expect(celda('B5').textContent).toBe('');
    expect(celda('B6').textContent).toBe('');
  });
});

describe('VentanaHojas · of-excel-consolida-y-protege, jugando mal a propósito', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('encargo 1 · un botón equivocado avisa; una forma distinta avisa; corregida, consolida con SUMA', async () => {
    await abrirYEmpezar();
    expect(encargo()).toBe('Júntalas, con una trampa incluida');

    // JUGAR MAL · un botón que no es Consolidar.
    fireEvent.click(boton('negrita'));
    expect(document.querySelector('.txtw-aviso')).not.toBeNull();
    expect(encargo()).toBe('Júntalas, con una trampa incluida');

    irADatos();
    fireEvent.mouseDown(celda('B4'));
    // JUGAR MAL · Grupo B con una fila de más: la forma no cuadra.
    escribirEnPanel('consolidar', ORIGEN_MALO);
    expect(document.querySelector('.txtw-aviso')).not.toBeNull();
    expect(celda('B4').textContent).toBe('');
    expect(encargo()).toBe('Júntalas, con una trampa incluida');

    escribirEnPanel('consolidar', ORIGEN_BUENO);
    await celebrar();

    expect(celda('B4').textContent).toBe('2170');
    expect(celda('B5').textContent).toBe('3280');
    expect(celda('B6').textContent).toBe('1330');
    expect(encargo()).toBe('Cambia un dato de origen y no toques el total');
  });

  it('encargo 2 · cambiar un dato en Grupo B mueve el total solo, sin volver a consolidar', async () => {
    await abrirYEmpezar();
    irADatos();
    fireEvent.mouseDown(celda('B4'));
    escribirEnPanel('consolidar', ORIGEN_BUENO);
    await celebrar();

    fireEvent.click(lengueta('gb'));
    teclear('B5', '1500');
    await celebrar();

    fireEvent.click(lengueta('t'));
    expect(celda('B5').textContent).toBe('3800');
    expect(encargo()).toBe('Antes de seguir: ¿por qué una fórmula?');
  });

  it('encargos 3 y 4 · las opciones equivocadas no explican nada; sólo las correctas avanzan', async () => {
    await hastaLaFormulaViva();
    expect(encargo()).toBe('Antes de seguir: ¿por qué una fórmula?');

    // JUGAR MAL · culpar a la velocidad del programa.
    fireEvent.click(screen.getByText(/habría tardado más/));
    expect(document.querySelector('.txtw-error')).not.toBeNull();
    expect(encargo()).toBe('Antes de seguir: ¿por qué una fórmula?');

    fireEvent.click(screen.getByText(/el total se corrige solo/));
    await celebrar();
    expect(encargo()).toBe('Una trampa que no vas a probar, pero sí a entender');

    fireEvent.click(screen.getByText(/no se puede usar como su propio origen/));
    await celebrar();
    expect(encargo()).toBe('Antes de proteger: ¿qué te promete?');
  });

  it('encargos 5 a 7 · proteger sin desbloquear nada te deja fuera de tu propia celda', async () => {
    await hastaProtegerPrimero();
    expect(encargo()).toBe('Hazlo como lo hace casi todo el mundo la primera vez');

    fireEvent.click(boton('proteger-hoja'));
    await celebrar();
    expect(encargo()).toBe('Te acabas de dejar fuera de tu propia hoja');

    fireEvent.click(screen.getByText(/bloquea las celdas de la columna A/));
    expect(document.querySelector('.txtw-error')).not.toBeNull();

    fireEvent.click(screen.getByText(/hace valer ese candado en TODAS/));
    await celebrar();
    expect(encargo()).toBe('Ahora sí, en el orden que funciona');
  });

  it('encargos 8 y 9 · varios botones en una sola señal; dentro de lo desbloqueado deja, fuera no', async () => {
    await hastaElOrdenSeArregla();
    expect(encargo()).toBe('Ahora sí, en el orden que funciona');

    fireEvent.click(boton('desproteger-hoja'));
    fireEvent.mouseDown(celda('B4'));
    fireEvent.mouseDown(celda('B6'), { shiftKey: true });
    fireEvent.click(boton('desbloquear-rango'));
    fireEvent.click(boton('proteger-hoja'));
    await celebrar();
    expect(encargo()).toBe('Compruébalo: aquí sí tiene que dejar');

    // JUGAR MAL · A5 nunca se desbloqueó: sigue protegida.
    teclear('A5', 'Otro nombre');
    expect(document.querySelector('.txtw-aviso')).not.toBeNull();
    // Rechazada, la celda se queda EN EDICIÓN con lo escrito (a propósito: ver
    // `confirmarCelda`), así que su `data-celda` envuelve al editor y no al
    // texto viejo todavía. Escape cancela la edición sin tocar el libro.
    fireEvent.keyDown(document.querySelector('.hjw-editor') as HTMLElement, { key: 'Escape' });
    expect(celda('A5').textContent).toBe('Tacos');

    teclear('B5', '1450');
    await celebrar();
    expect(celda('B5').textContent).toBe('1450');
    expect(encargo()).toBe('Proteger también impide borrar filas enteras');
  });

  it('encargos 10 a 12 · la estructura se protege aparte, y el aviso dice qué hacer', async () => {
    await hastaElOrdenSeArregla();
    fireEvent.click(boton('desproteger-hoja'));
    fireEvent.mouseDown(celda('B4'));
    fireEvent.mouseDown(celda('B6'), { shiftKey: true });
    fireEvent.click(boton('desbloquear-rango'));
    fireEvent.click(boton('proteger-hoja'));
    await celebrar();
    teclear('B5', '1450');
    await celebrar();
    expect(encargo()).toBe('Proteger también impide borrar filas enteras');

    fireEvent.click(screen.getByText(/Eliminar filas no es lo mismo que escribir en una celda/));
    expect(document.querySelector('.txtw-error')).not.toBeNull();
    fireEvent.click(screen.getByText(/también impide insertar y borrar filas o columnas enteras/));
    await celebrar();
    expect(encargo()).toBe('La otra mitad del candado');

    fireEvent.click(boton('proteger-libro'));
    await celebrar();
    expect(encargo()).toBe('Lo último: cómo tiene que hablar un aviso');

    fireEvent.click(screen.getByText(/Nada más: sólo dice que no se puede/));
    expect(document.querySelector('.txtw-error')).not.toBeNull();
    fireEvent.click(screen.getByText(/Dice exactamente qué botón pulsar/));
    await celebrar();

    expect(screen.getByText('Terminaste')).not.toBeNull();
  });

  it('la clase entera se termina, de principio a fin', async () => {
    const onTerminado = jest.fn();
    render(<VentanaHojas cinta={CINTA_EXCEL_AVANZADO} guion={GUION_CONSOLIDA_Y_PROTEGE} onTerminado={onTerminado} />);
    await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
    fireEvent.click(screen.getByText('Abrir el libro'));

    // 1
    irADatos();
    fireEvent.mouseDown(celda('B4'));
    escribirEnPanel('consolidar', ORIGEN_BUENO);
    await celebrar();

    // 2
    fireEvent.click(lengueta('gb'));
    teclear('B5', '1500');
    await celebrar();

    // 3
    fireEvent.click(screen.getByText(/el total se corrige solo/));
    await celebrar();

    // 4
    fireEvent.click(screen.getByText(/no se puede usar como su propio origen/));
    await celebrar();

    // 5
    fireEvent.click(screen.getByText(/no hay contraseña, y no es para alguien con intención de saltárselo/));
    await celebrar();

    // 6
    irARevisar();
    fireEvent.click(lengueta('ga'));
    fireEvent.click(boton('proteger-hoja'));
    await celebrar();

    // 7
    fireEvent.click(screen.getByText(/hace valer ese candado en TODAS/));
    await celebrar();

    // 8
    fireEvent.click(boton('desproteger-hoja'));
    fireEvent.mouseDown(celda('B4'));
    fireEvent.mouseDown(celda('B6'), { shiftKey: true });
    fireEvent.click(boton('desbloquear-rango'));
    fireEvent.click(boton('proteger-hoja'));
    await celebrar();

    // 9
    teclear('B5', '1450');
    await celebrar();

    // 10
    fireEvent.click(screen.getByText(/también impide insertar y borrar filas o columnas enteras/));
    await celebrar();

    // 11
    fireEvent.click(boton('proteger-libro'));
    await celebrar();

    // 12
    fireEvent.click(screen.getByText(/Dice exactamente qué botón pulsar/));
    await celebrar();

    expect(screen.getByText('Terminaste')).not.toBeNull();
    expect(onTerminado).toHaveBeenCalledTimes(1);
    expect(onTerminado.mock.calls[0][0]).toMatchObject({ pasos: 12, tropiezos: 0 });
  });
});
