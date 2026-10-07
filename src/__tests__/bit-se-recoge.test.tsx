/**
 * El globo de Bit se recoge (ArcadeSala · useGloboDeBit, 12-sep-2026).
 *
 * Medido con Chromium en las 80 actividades de N7–N10: en 39 el globo tapaba
 * algo que el alumno usa —la consola de Tecnia Código, el editor de Tecnia Web,
 * botones de respuesta— y no se iba nunca. Esta prueba vigila el contrato de la
 * cura, no la geometría (jsdom no mide; la geometría la vigila la sonda de
 * Chromium): se ve al hablar, se recoge por tiempo o al ponerse a trabajar,
 * vuelve con cada línea nueva y **el texto no sale del DOM**.
 */

import { act, fireEvent, render } from '@testing-library/react';
import { ArcadeSala, tiempoDeLectura } from '@/components/activities/n1/arcade/ArcadeSala';

jest.mock('next/image', () => ({ __esModule: true, default: () => null }));

function Sala({ bit }: { bit: string | null }) {
  return (
    <ArcadeSala titulo="Prueba" pasoEtiqueta="Paso" pasoActual={1} pasosTotal={3} marcadorEtiqueta="Puntos" marcadorValor="0" bit={bit}>
      <textarea data-testid="campo" />
      <button type="button">Algo</button>
    </ArcadeSala>
  );
}

const puesto = () => document.querySelector('.bit-puesto');
const recogido = () => puesto()?.getAttribute('data-recogido') === 'si';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('el tiempo de lectura crece con el texto y tiene suelo y techo', () => {
  expect(tiempoDeLectura('Hola')).toBe(7000);
  expect(tiempoDeLectura(Array(20).fill('palabra').join(' '))).toBe(12000);
  expect(tiempoDeLectura(Array(200).fill('palabra').join(' '))).toBe(18000);
});

test('se ve al hablar y se recoge solo cuando pasa el tiempo de lectura, sin salir del DOM', () => {
  const linea = 'Escribe tu primera función y envíala al juez cuando creas que está lista.';
  render(<Sala bit={linea} />);
  expect(recogido()).toBe(false);
  act(() => jest.advanceTimersByTime(tiempoDeLectura(linea) - 100));
  expect(recogido()).toBe(false);
  act(() => jest.advanceTimersByTime(200));
  expect(recogido()).toBe(true);
  expect(document.querySelector('.bit-globo')?.textContent).toContain(linea);
});

test('se recoge en cuanto el alumno entra en un campo o teclea', () => {
  render(<Sala bit="Una línea larga que tapa la consola." />);
  const campo = document.querySelector('[data-testid="campo"]') as HTMLTextAreaElement;
  fireEvent.focusIn(campo);
  expect(recogido()).toBe(true);
});

test('una tecla fuera de un campo también lo recoge', () => {
  render(<Sala bit="Otra línea." />);
  fireEvent.keyDown(document.querySelector('button') as HTMLButtonElement, { key: 'a' });
  expect(recogido()).toBe(true);
});

test('una línea nueva vuelve a abrir el globo', () => {
  const { rerender } = render(<Sala bit="Primera." />);
  fireEvent.focusIn(document.querySelector('[data-testid="campo"]') as HTMLTextAreaElement);
  expect(recogido()).toBe(true);
  rerender(<Sala bit="Segunda, y esta es noticia." />);
  expect(recogido()).toBe(false);
});

test('el retrato no es un botón: no puede atrapar los clics de lo que tiene debajo', () => {
  render(<Sala bit="Hola." />);
  expect(document.querySelector('.bit-retrato')?.tagName).toBe('SPAN');
  expect(document.querySelector('.bit-puesto button')).toBeNull();
});
