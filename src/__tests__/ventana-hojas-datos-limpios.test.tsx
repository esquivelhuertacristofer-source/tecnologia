/**
 * `of-excel-datos-limpios` · «Antes de calcular, limpia» (bloques 44 · 45 ·
 * 46). Primera clase exclusiva del grado Avanzado de Tecnia Hojas.
 *
 * Se juega MAL a propósito (regla de la casa) y se recorre la clase entera de
 * principio a fin: quitar duplicados esperando que junte a las tres «Ana»,
 * relleno rápido con un ejemplo que no le cierra a Carlos, un patrón con
 * comillas sin cerrar, y una regla de fórmula sin el `$` —que pinta en
 * diagonal— y con una fórmula que da un número en vez de VERDADERO/FALSO.
 *
 * Jugando la clase entera se cazó un defecto real de motor, no de esta clase:
 * `regla-formula` (`comandos.ts`) apilaba una regla nueva encima de la
 * anterior en vez de reemplazarla cuando comparten id —y las tres pasadas del
 * encargo 9 comparten id, porque se aplican sobre el mismo rango—. Como
 * `condicional.ts` sólo AÑADE pintura y nunca la quita, la diagonal de la
 * fórmula rota se quedaba pintada debajo de la fila ya corregida y el
 * encargo no se podía cerrar. Se corrigió en `comandos.ts` para que aplicar
 * una regla sobre el mismo id reemplace en vez de apilar.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { CINTA_EXCEL_AVANZADO } from '@/components/activities/office/tecniaHojas';
import { GUION_DATOS_LIMPIOS } from '@/components/activities/office/excel/datos-limpios/guion';

beforeAll(() => {
  if (typeof Element.prototype.scrollTo !== 'function') {
    Element.prototype.scrollTo = function scrollTo() {};
  }
});

async function abrir() {
  const salida = render(<VentanaHojas cinta={CINTA_EXCEL_AVANZADO} guion={GUION_DATOS_LIMPIOS} />);
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

/** Abre el panel de un control de texto libre, escribe y pulsa «Aplicar». */
function escribirEnPanel(control: string, texto: string) {
  fireEvent.click(boton(control));
  const campo = document.querySelector('.hjw-campo-texto') as HTMLInputElement;
  fireEvent.change(campo, { target: { value: texto } });
  fireEvent.click(document.querySelector('.hjw-aplicar') as HTMLElement);
}

/** Quitar duplicados y Relleno rápido viven en Datos → Herramientas de datos. */
function irADatos() {
  fireEvent.click(document.querySelector('[data-pestana="datos"]') as HTMLElement);
}

/** Formato personalizado y Regla con fórmula viven en Inicio. */
function irAInicio() {
  fireEvent.click(document.querySelector('[data-pestana="inicio"]') as HTMLElement);
}

function quitarDuplicadosConfirmando() {
  fireEvent.click(boton('quitar-duplicados'));
  fireEvent.click(boton('quitar-duplicados'));
}

/** Los encargos 1 a 6, ya jugados bien, para llegar rápido a los de los bloques 45 y 46. */
async function hastaElSaldo() {
  await abrirYEmpezar();
  irADatos();
  marcar('A3', 'E13');
  quitarDuplicadosConfirmando();
  await celebrar();
  fireEvent.click(screen.getByText(/una letra en mayúscula ya es/));
  await celebrar();
  teclear('I2', '=CONTAR.SI(A4:A12,"Ana Torres")');
  await celebrar();
  teclear('B4', 'Diego Ramírez');
  marcar('B4', 'B12');
  fireEvent.click(boton('relleno-rapido'));
  await celebrar();
  teclear('A6', 'Ana Torres Ruiz');
  await celebrar();
  teclear('B7', 'Carlos');
  await celebrar();
  irAInicio();
}

describe('VentanaHojas · of-excel-datos-limpios se pinta', () => {
  it('la portada anuncia el tema, y el libro abre con el duplicado y las tres Ana sin juntar', async () => {
    await abrir();
    expect(screen.getByText('Datos limpios: duplicados, relleno rápido y formato personalizado')).not.toBeNull();
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

    expect(celda('A4').textContent).toBe('DIEGO RAMÍREZ');
    expect(celda('A5').textContent).toBe('DIEGO RAMÍREZ');
    expect(celda('A7').textContent).toBe('ANA TORRES');
    expect(celda('A9').textContent).toBe('Ana Torres');
    expect(celda('A11').textContent).toBe('ana torres');
    expect(celda('B4').textContent).toBe('');
  });
});

describe('VentanaHojas · of-excel-datos-limpios, jugando mal a propósito', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('encargo 1 · un botón equivocado avisa; quitar duplicados borra de verdad y hace falta confirmarlo', async () => {
    await abrirYEmpezar();
    expect(encargo()).toBe('Nueve o diez, según cómo mires');

    // JUGAR MAL · un botón que no es Quitar duplicados.
    fireEvent.click(boton('negrita'));
    expect(document.querySelector('.txtw-aviso')).not.toBeNull();
    expect(encargo()).toBe('Nueve o diez, según cómo mires');

    irADatos();
    marcar('A3', 'E13');
    fireEvent.click(boton('quitar-duplicados'));
    // Primera pulsación: sólo avisa, no borra todavía.
    expect(celda('A13').textContent).toBe('Pedro Navarro');
    fireEvent.click(boton('quitar-duplicados'));
    await celebrar();

    expect(celda('A5').textContent).toBe('María Sánchez'); // se compactó
    expect(celda('A13').textContent).toBe(''); // la última fila se vació de verdad
    expect(encargo()).toBe('¿Por qué no se unieron?');
  });

  it('encargo 2 · la opción equivocada no explica nada; sólo la correcta, y las tres Ana siguen ahí', async () => {
    await abrirYEmpezar();
    irADatos();
    marcar('A3', 'E13');
    quitarDuplicadosConfirmando();
    await celebrar();
    expect(encargo()).toBe('¿Por qué no se unieron?');

    // JUGAR MAL · culpar a la herramienta de mirar sólo la primera columna.
    fireEvent.click(screen.getByText(/sólo compara la primera columna/));
    expect(document.querySelector('.txtw-error')).not.toBeNull();
    expect(encargo()).toBe('¿Por qué no se unieron?');

    fireEvent.click(screen.getByText(/una letra en mayúscula ya es, para la hoja, un texto distinto/));
    await celebrar();
    expect(encargo()).toBe('Compruébalo tú mismo');
    // Las tres siguen ahí: nadie las juntó.
    expect(celda('A6').textContent).toBe('ANA TORRES');
    expect(celda('A8').textContent).toBe('Ana Torres');
    expect(celda('A10').textContent).toBe('ana torres');
  });

  it('encargo 3 · CONTAR.SI descubre que Ana Torres sigue apareciendo tres veces', async () => {
    await abrirYEmpezar();
    irADatos();
    marcar('A3', 'E13');
    quitarDuplicadosConfirmando();
    await celebrar();
    fireEvent.click(screen.getByText(/una letra en mayúscula ya es/));
    await celebrar();

    teclear('I2', '=CONTAR.SI(A4:A12,"Ana Torres")');
    await celebrar();
    expect(celda('I2').textContent).toBe('3');
    expect(encargo()).toBe('Limpia los nombres sin teclearlos uno por uno');
  });

  it('encargo 4 · relleno rápido limpia siete nombres y deja a Carlos vacío, sin avisar', async () => {
    await abrirYEmpezar();
    irADatos();
    marcar('A3', 'E13');
    quitarDuplicadosConfirmando();
    await celebrar();
    fireEvent.click(screen.getByText(/una letra en mayúscula ya es/));
    await celebrar();
    teclear('I2', '=CONTAR.SI(A4:A12,"Ana Torres")');
    await celebrar();

    teclear('B4', 'Diego Ramírez');
    marcar('B4', 'B12');
    fireEvent.click(boton('relleno-rapido'));
    await celebrar();

    expect(celda('B5').textContent).toBe('María Sánchez');
    expect(celda('B6').textContent).toBe('Ana Torres');
    expect(celda('B7').textContent).toBe(''); // Carlos: una sola palabra, no le cierra el patrón
    expect(celda('B8').textContent).toBe('Ana Torres');
    expect(celda('B10').textContent).toBe('Ana Torres');
    expect(encargo()).toBe('Escribe texto, no una regla');
  });

  it('encargo 5 y 6 · el relleno escribió texto —no se entera del original— y Carlos se termina a mano', async () => {
    await abrirYEmpezar();
    irADatos();
    marcar('A3', 'E13');
    quitarDuplicadosConfirmando();
    await celebrar();
    fireEvent.click(screen.getByText(/una letra en mayúscula ya es/));
    await celebrar();
    teclear('I2', '=CONTAR.SI(A4:A12,"Ana Torres")');
    await celebrar();
    teclear('B4', 'Diego Ramírez');
    marcar('B4', 'B12');
    fireEvent.click(boton('relleno-rapido'));
    await celebrar();

    // JUGAR MAL · dar el encargo por hecho sin cambiar A6 todavía.
    expect(encargo()).toBe('Escribe texto, no una regla');

    teclear('A6', 'Ana Torres Ruiz');
    await celebrar();
    expect(celda('B6').textContent).toBe('Ana Torres'); // se quedó vieja
    expect(encargo()).toBe('Termina a mano lo que la máquina no supo');

    teclear('B7', 'Carlos');
    await celebrar();
    expect(encargo()).toBe('Que el que debe se note');
  });

  it('encargo 8 · un patrón con comillas sin cerrar se rechaza; cerrado, viste el aporte sin tocar el número', async () => {
    await hastaElSaldo();
    marcar('F4', 'F12');
    escribirEnPanel('formato-personalizado', '#,##0;[Rojo](#,##0)');
    await celebrar();
    expect(encargo()).toBe('Rómpelo con una comilla, y ciérrala');

    marcar('E4', 'E12');
    // JUGAR MAL · la comilla que nunca se cierra.
    escribirEnPanel('formato-personalizado', '"$#,##0');
    expect(document.querySelector('.txtw-aviso')).not.toBeNull();
    expect(encargo()).toBe('Rómpelo con una comilla, y ciérrala');

    escribirEnPanel('formato-personalizado', '"$"#,##0');
    await celebrar();
    expect(encargo()).toBe('Rómpela a propósito: sin el $');
  });

  it('encargo 9 · sin el $ no pinta filas enteras; un número en vez de verdadero/falso se rechaza', async () => {
    await hastaElSaldo();
    marcar('F4', 'F12');
    escribirEnPanel('formato-personalizado', '#,##0;[Rojo](#,##0)');
    await celebrar();
    marcar('E4', 'E12');
    escribirEnPanel('formato-personalizado', '"$"#,##0');
    await celebrar();
    expect(encargo()).toBe('Rómpela a propósito: sin el $');

    marcar('A4', 'F12');
    // JUGAR MAL · sin el $, no se puede cerrar el encargo.
    escribirEnPanel('regla-formula', '=F4<0');
    expect(encargo()).toBe('Rómpela a propósito: sin el $');

    // JUGAR MAL · una fórmula que da un número, no VERDADERO/FALSO.
    escribirEnPanel('regla-formula', '=F4');
    expect(document.querySelector('.txtw-aviso')).not.toBeNull();
    expect(encargo()).toBe('Rómpela a propósito: sin el $');

    escribirEnPanel('regla-formula', '=$F4<0');
    await celebrar();
    expect(encargo()).toBe('El $ otra vez, y para qué sirve aquí');
  });

  it('la clase entera se termina, de principio a fin', async () => {
    const onTerminado = jest.fn();
    render(<VentanaHojas cinta={CINTA_EXCEL_AVANZADO} guion={GUION_DATOS_LIMPIOS} onTerminado={onTerminado} />);
    await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
    fireEvent.click(screen.getByText('Abrir el libro'));

    // 1
    irADatos();
    marcar('A3', 'E13');
    quitarDuplicadosConfirmando();
    await celebrar();

    // 2
    fireEvent.click(screen.getByText(/una letra en mayúscula ya es/));
    await celebrar();

    // 3
    teclear('I2', '=CONTAR.SI(A4:A12,"Ana Torres")');
    await celebrar();

    // 4
    teclear('B4', 'Diego Ramírez');
    marcar('B4', 'B12');
    fireEvent.click(boton('relleno-rapido'));
    await celebrar();

    // 5
    teclear('A6', 'Ana Torres Ruiz');
    await celebrar();

    // 6
    teclear('B7', 'Carlos');
    await celebrar();

    irAInicio();

    // 7
    marcar('F4', 'F12');
    escribirEnPanel('formato-personalizado', '#,##0;[Rojo](#,##0)');
    await celebrar();

    // 8
    marcar('E4', 'E12');
    escribirEnPanel('formato-personalizado', '"$"#,##0');
    await celebrar();

    // 9
    marcar('A4', 'F12');
    escribirEnPanel('regla-formula', '=$F4<0');
    await celebrar();

    // 10 · eleccion
    fireEvent.click(screen.getByText(/Fija la columna F para que no se mueva/));
    await celebrar();

    expect(screen.getByText('Terminaste')).not.toBeNull();
    expect(onTerminado).toHaveBeenCalledTimes(1);
    expect(onTerminado.mock.calls[0][0]).toMatchObject({ pasos: 10, tropiezos: 0 });
  });
});
