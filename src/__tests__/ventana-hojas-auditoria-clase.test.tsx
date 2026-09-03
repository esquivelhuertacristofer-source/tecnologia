/**
 * `of-excel-auditoria` · «Por qué esta celda dice eso» (bloques 47 · 48).
 * Segunda clase exclusiva del grado Avanzado de Tecnia Hojas.
 *
 * Dos grupos de pruebas. El primero es de MOTOR, sin montar ninguna ventana:
 * comprueba que el libro de partida trae el número absurdo (#¡REF! en
 * Ganancia neta), que rastrear precedentes remonta el río hasta la fórmula
 * rota, y las tres formas de «jugar mal» que no dejan flecha que dibujar —una
 * celda sin fórmula, una referencia muerta y un precedente en otra hoja—, más
 * el bloque 48 jugando mal a propósito: tapar con `SI.ERROR(...,0)` pasa el
 * primer encargo pero NO el segundo, que exige el texto que explica.
 *
 * El segundo es de VENTANA: que el guion, `FORMULAS_AVANZADO` (la cinta
 * nueva) y las flechas que dibuja `VentanaHojas.tsx` a partir de
 * `flechasDeAuditoria` están bien conectados de punta a punta, incluido un
 * botón equivocado durante un encargo de rastreo.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { CINTA_EXCEL_AVANZADO } from '@/components/activities/office/tecniaHojas';
import {
  dependientes,
  errorDe,
  errorTapadoPorSiError,
  flechasDeAuditoria,
  precedentes,
  valorDe,
} from '@/components/office/motor-hojas/consultas';
import { crearMotor } from '@/components/office/motor-hojas/formula/calculo';
import { RELOJ_DE_LA_CLASE } from '@/components/office/motor-hojas/guion';
import type { Libro } from '@/components/office/motor-hojas/modelo';
import {
  CO,
  elPrecioRealQuedoBienExplicado,
  GANANCIA_NETA,
  GASTOS_REALES,
  GUION_AUDITORIA,
  INGRESOS_TOTALES,
  laCausaQuedoReparada,
  libroDeLaCooperativa,
  seTapoConCeroSinPensar,
  VE,
} from '@/components/activities/office/excel/auditoria/guion';

/* ── grupo 1 · motor, sin ventana ─────────────────────────────────────────── */

function conCelda(libro: Libro, hoja: string, direccion: string, crudo: string): Libro {
  return {
    ...libro,
    hojas: libro.hojas.map((h) => (h.id === hoja ? { ...h, celdas: { ...h.celdas, [direccion]: { crudo } } } : h)),
  };
}

describe('el libro de la cooperativa y el grafo de auditoría (bloques 47 y 48)', () => {
  it('Corte!B5 es #¡REF! por contagio de Corte!B4; rastrear precedentes remonta el río, y una referencia muerta no tiene de dónde tirar flecha', () => {
    const motor = crearMotor(libroDeLaCooperativa(), RELOJ_DE_LA_CLASE);
    expect(errorDe(motor, CO, 'B5')).toBe('#¡REF!');
    expect(errorDe(motor, CO, 'B4')).toBe('#¡REF!');
    expect(valorDe(motor, CO, 'B3')).toBe(INGRESOS_TOTALES);

    expect(precedentes(motor, CO, 'B5')).toEqual(['co!B3', 'co!B4']);

    // jugar MAL: Gastos apunta a una hoja que ya no existe — nada que trazar.
    expect(precedentes(motor, CO, 'B4')).toEqual([]);

    // jugar MAL: una celda sin fórmula tampoco tiene precedentes.
    expect(precedentes(motor, VE, 'A4')).toEqual([]);

    // jugar MAL: el precedente de Ingresos vive en otra hoja — no se puede trazar aquí.
    expect(flechasDeAuditoria(motor, CO, 'B3', 'precedentes')).toEqual([
      { celda: 've!D7', col: null, puesto: null },
    ]);
  });

  it('los tres errores se leen como pistas, y rastrear dependientes de Agua contesta «a quién le afecta» con tres flechas exactas', () => {
    const motor = crearMotor(libroDeLaCooperativa(), RELOJ_DE_LA_CLASE);
    expect(errorDe(motor, VE, 'E6')).toBe('#¡DIV/0!');
    expect(errorDe(motor, VE, 'F5')).toBe('#¿NOMBRE?');
    expect(errorDe(motor, CO, 'B5')).toBe('#¡REF!');

    expect(dependientes(motor, VE, 'B6')).toEqual(['ve!B7', 've!D6', 've!E6']);
  });

  it('bloque 48 jugando mal: SI.ERROR(...,0) pasa el «tapar sin pensar», pero NO el arreglo bueno — sólo el texto lo cierra, y lo tapado se sigue pudiendo mirar', () => {
    const base = libroDeLaCooperativa();
    const conCero = conCelda(base, VE, 'E6', '=SI.ERROR(D6/B6,0)');
    expect(seTapoConCeroSinPensar(conCero)).toBe(true);
    // jugar MAL: SI.ERROR devolviendo 0 donde debería devolver texto no cierra el encargo bueno.
    expect(elPrecioRealQuedoBienExplicado(conCero)).toBe(false);

    const conTexto = conCelda(base, VE, 'E6', '=SI.ERROR(D6/B6,"Sin ventas")');
    expect(elPrecioRealQuedoBienExplicado(conTexto)).toBe(true);

    const motor = crearMotor(conCero, RELOJ_DE_LA_CLASE);
    expect(errorDe(motor, VE, 'E6')).toBeNull();
    expect(errorTapadoPorSiError(motor, VE, 'E6')).toBe('#¡DIV/0!');
  });

  it('laCausaQuedoReparada encadena con el DIV/0 ya explicado, y sólo entonces acepta Gastos y Ganancia neta correctos', () => {
    const base = libroDeLaCooperativa();
    const soloGastos = conCelda(conCelda(base, VE, 'E6', '=SI.ERROR(D6/B6,0)'), CO, 'B4', '=Ventas!I5');
    // trampa (a) de la casa: encadenar con un encargo anterior que sigue vigente.
    expect(laCausaQuedoReparada(soloGastos)).toBe(false);

    const todoBien = conCelda(conCelda(base, VE, 'E6', '=SI.ERROR(D6/B6,"Sin ventas")'), CO, 'B4', '=Ventas!I5');
    expect(laCausaQuedoReparada(todoBien)).toBe(true);
    const motor = crearMotor(todoBien, RELOJ_DE_LA_CLASE);
    expect(valorDe(motor, CO, 'B4')).toBe(GASTOS_REALES);
    expect(valorDe(motor, CO, 'B5')).toBe(GANANCIA_NETA);
  });
});

/* ── grupo 2 · la ventana ──────────────────────────────────────────────────── */

beforeAll(() => {
  if (typeof Element.prototype.scrollTo !== 'function') {
    Element.prototype.scrollTo = function scrollTo() {};
  }
});

async function abrir() {
  const salida = render(<VentanaHojas cinta={CINTA_EXCEL_AVANZADO} guion={GUION_AUDITORIA} />);
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
const lengueta = (id: string): HTMLElement => document.querySelector(`[data-hoja="${id}"]`) as HTMLElement;
const rejilla = (): HTMLElement => document.querySelector('.hjw-rejilla') as HTMLElement;
const encargo = (): string => document.querySelector('.txtw-encargo h3')?.textContent ?? '';
const flechas = (): number => document.querySelectorAll('[data-flecha-celda]').length;
const chipsOtraHoja = (): number => document.querySelectorAll('[data-flecha-otra-hoja]').length;

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

/** Rastrear precedentes/dependientes vive en Fórmulas → Auditoría de fórmulas. */
function irAFormulas() {
  fireEvent.click(document.querySelector('[data-pestana="formulas"]') as HTMLElement);
}

describe('VentanaHojas · of-excel-auditoria, jugando mal a propósito', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('la portada anuncia el tema, el libro abre en Corte con el número absurdo, y sólo la opción correcta avanza el encargo 1', async () => {
    await abrir();
    expect(screen.getByText('Auditoría de fórmulas: por qué esta celda dice eso')).not.toBeNull();
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

    expect(celda('B5').textContent).toBe('#¡REF!');
    expect(encargo()).toBe('El número que no tiene sentido');

    // JUGAR MAL · una opción que confunde REF con un dato que falta.
    fireEvent.click(screen.getByText(/faltó escribir un número/));
    expect(document.querySelector('.txtw-error')).not.toBeNull();
    expect(encargo()).toBe('El número que no tiene sentido');

    fireEvent.click(screen.getByText(/apuntaba ya no existe/));
    await celebrar();
    expect(encargo()).toBe('Remonta el río: ¿de qué depende B5?');
  });

  it('encargos 2 a 5: dos flechas hacia Ingresos/Gastos, un rótulo de «otra hoja» al rastrear Ingresos, y nada al rastrear Gastos rotos o una celda sin fórmula', async () => {
    await abrirYEmpezar();
    fireEvent.click(screen.getByText(/apuntaba ya no existe/));
    await celebrar();

    irAFormulas();
    fireEvent.mouseDown(celda('B5'));
    // JUGAR MAL · un botón de la misma pestaña que no es Rastrear precedentes.
    fireEvent.click(boton('mostrar-formulas'));
    expect(document.querySelector('.txtw-aviso')).not.toBeNull();
    expect(encargo()).toBe('Remonta el río: ¿de qué depende B5?');
    expect(flechas()).toBe(0);

    fireEvent.click(boton('rastrear-precedentes'));
    expect(flechas()).toBe(2);
    expect(chipsOtraHoja()).toBe(0);
    await celebrar();
    expect(encargo()).toBe('Sigue el rastro también por el lado que sí funciona');

    fireEvent.mouseDown(celda('B3'));
    fireEvent.click(boton('rastrear-precedentes'));
    expect(flechas()).toBe(0);
    expect(chipsOtraHoja()).toBe(1);
    await celebrar();
    expect(encargo()).toBe('Ahora sí: el lado que está roto');

    fireEvent.mouseDown(celda('B4'));
    fireEvent.click(boton('rastrear-precedentes'));
    expect(flechas()).toBe(0);
    expect(chipsOtraHoja()).toBe(0);
    await celebrar();
    expect(encargo()).toBe('Un tercer «no pasa nada», por un motivo distinto');

    fireEvent.click(lengueta('ve'));
    fireEvent.mouseDown(celda('A4'));
    fireEvent.click(boton('rastrear-precedentes'));
    expect(flechas()).toBe(0);
    expect(chipsOtraHoja()).toBe(0);
    await celebrar();
    expect(encargo()).toBe('El segundo error de la hoja');
  });

  it('encargos 6 a 8: leer #¡DIV/0! y #¿NOMBRE?, y rastrear dependientes de Agua dibuja tres flechas exactas', async () => {
    await abrirYEmpezar();
    fireEvent.click(screen.getByText(/apuntaba ya no existe/));
    await celebrar();
    irAFormulas();
    fireEvent.mouseDown(celda('B5'));
    fireEvent.click(boton('rastrear-precedentes'));
    await celebrar();
    fireEvent.mouseDown(celda('B3'));
    fireEvent.click(boton('rastrear-precedentes'));
    await celebrar();
    fireEvent.mouseDown(celda('B4'));
    fireEvent.click(boton('rastrear-precedentes'));
    await celebrar();
    fireEvent.click(lengueta('ve'));
    fireEvent.mouseDown(celda('A4'));
    fireEvent.click(boton('rastrear-precedentes'));
    await celebrar();

    expect(encargo()).toBe('El segundo error de la hoja');
    expect(celda('E6').textContent).toBe('#¡DIV/0!');
    fireEvent.click(screen.getByText(/vendió 0 unidades/));
    await celebrar();
    expect(encargo()).toBe('El tercer error de la hoja');
    expect(celda('F5').textContent).toBe('#¿NOMBRE?');
    fireEvent.click(screen.getByText(/nombre de la tasa de IVA/));
    await celebrar();
    expect(encargo()).toBe('La otra pregunta: si cambio esto, ¿a quién le afecta?');

    fireEvent.mouseDown(celda('B6'));
    fireEvent.click(boton('rastrear-dependientes'));
    expect(flechas()).toBe(3);
    await celebrar();
    expect(encargo()).toBe('Haz lo que casi todo el mundo hace primero');
  });

  it('encargos 9 a 12, jugando mal a propósito: tapar con 0 se ve bonito y mal, sólo el texto que explica cierra el encargo, y reparar Gastos apaga el número absurdo', async () => {
    await abrirYEmpezar();
    fireEvent.click(screen.getByText(/apuntaba ya no existe/));
    await celebrar();
    irAFormulas();
    fireEvent.mouseDown(celda('B5'));
    fireEvent.click(boton('rastrear-precedentes'));
    await celebrar();
    fireEvent.mouseDown(celda('B3'));
    fireEvent.click(boton('rastrear-precedentes'));
    await celebrar();
    fireEvent.mouseDown(celda('B4'));
    fireEvent.click(boton('rastrear-precedentes'));
    await celebrar();
    fireEvent.click(lengueta('ve'));
    fireEvent.mouseDown(celda('A4'));
    fireEvent.click(boton('rastrear-precedentes'));
    await celebrar();
    fireEvent.click(screen.getByText(/vendió 0 unidades/));
    await celebrar();
    fireEvent.click(screen.getByText(/nombre de la tasa de IVA/));
    await celebrar();
    fireEvent.mouseDown(celda('B6'));
    fireEvent.click(boton('rastrear-dependientes'));
    await celebrar();
    expect(encargo()).toBe('Haz lo que casi todo el mundo hace primero');

    // JUGAR MAL A PROPÓSITO · tapar con un cero, tal y como pide el encargo.
    teclear('E6', '=SI.ERROR(D6/B6,0)');
    await celebrar();
    expect(celda('E6').textContent).toBe('0');
    expect(encargo()).toBe('Antes de seguir: ¿qué perdiste?');

    // JUGAR MAL · confundir «lo mismo» con «se ven idénticas».
    fireEvent.click(screen.getByText(/significan lo mismo/));
    expect(document.querySelector('.txtw-error')).not.toBeNull();
    fireEvent.click(screen.getByText(/se ven idénticas ahora/));
    await celebrar();
    expect(encargo()).toBe('Ahora sí: mirar, entender, y recién entonces tapar');

    teclear('E6', '=SI.ERROR(D6/B6,"Sin ventas")');
    await celebrar();
    expect(celda('E6').textContent).toBe('Sin ventas');
    expect(encargo()).toBe('Cierra el rastro: repara Gastos, no lo tapes');

    fireEvent.click(lengueta('co'));
    teclear('B4', '=Ventas!I5');
    await celebrar();

    expect(celda('B4').textContent).toBe('380');
    expect(celda('B5').textContent).toBe('20');
    expect(screen.getByText('Terminaste')).not.toBeNull();
  });

  it('la clase entera se termina de principio a fin, con onTerminado(pasos: 12, tropiezos: 0)', async () => {
    const onTerminado = jest.fn();
    render(<VentanaHojas cinta={CINTA_EXCEL_AVANZADO} guion={GUION_AUDITORIA} onTerminado={onTerminado} />);
    await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
    fireEvent.click(screen.getByText('Abrir el libro'));

    // 1
    fireEvent.click(screen.getByText(/apuntaba ya no existe/));
    await celebrar();
    // 2
    irAFormulas();
    fireEvent.mouseDown(celda('B5'));
    fireEvent.click(boton('rastrear-precedentes'));
    await celebrar();
    // 3
    fireEvent.mouseDown(celda('B3'));
    fireEvent.click(boton('rastrear-precedentes'));
    await celebrar();
    // 4
    fireEvent.mouseDown(celda('B4'));
    fireEvent.click(boton('rastrear-precedentes'));
    await celebrar();
    // 5
    fireEvent.click(lengueta('ve'));
    fireEvent.mouseDown(celda('A4'));
    fireEvent.click(boton('rastrear-precedentes'));
    await celebrar();
    // 6
    fireEvent.click(screen.getByText(/vendió 0 unidades/));
    await celebrar();
    // 7
    fireEvent.click(screen.getByText(/nombre de la tasa de IVA/));
    await celebrar();
    // 8
    fireEvent.mouseDown(celda('B6'));
    fireEvent.click(boton('rastrear-dependientes'));
    await celebrar();
    // 9
    teclear('E6', '=SI.ERROR(D6/B6,0)');
    await celebrar();
    // 10
    fireEvent.click(screen.getByText(/se ven idénticas ahora/));
    await celebrar();
    // 11
    teclear('E6', '=SI.ERROR(D6/B6,"Sin ventas")');
    await celebrar();
    // 12
    fireEvent.click(lengueta('co'));
    teclear('B4', '=Ventas!I5');
    await celebrar();

    expect(screen.getByText('Terminaste')).not.toBeNull();
    expect(onTerminado).toHaveBeenCalledTimes(1);
    expect(onTerminado.mock.calls[0][0]).toMatchObject({ pasos: 12, tropiezos: 0 });
  });
});
