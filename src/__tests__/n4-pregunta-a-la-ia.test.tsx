/**
 * `n4-pregunta-a-la-ia` · «Tecnia Asistente», N4 · «Aprendo con la IA».
 *
 * Se juega MAL a propósito: preguntar en una palabra (ronda 4), pedir que
 * hagan la tarea entera (ronda 6), creerse la respuesta que suena segura y
 * está inventada (ronda 5 — la lección más importante de las tres unidades),
 * y dar un dato personal (ronda 7, que tiene que avisar). El último test
 * recorre el laboratorio entero, de la primera pregunta al cierre.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { LabPreguntaALaIA } from '@/components/activities/n4/estudio/LabPreguntaALaIA';

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const alSalir = jest.fn();
  const utils = render(
    <LabPreguntaALaIA
      config={{}}
      onProgress={onProgress}
      onScore={onScore}
      onComplete={onComplete}
      alSalir={alSalir}
    />,
  );
  return { ...utils, onProgress, onScore, onComplete, alSalir };
}

const getChip = (id: string): HTMLElement =>
  document.querySelector(`[data-chip="${id}"]`) as HTMLElement;
const getOpcion = (id: string): HTMLElement =>
  document.querySelector(`[data-opcion="${id}"]`) as HTMLElement;

/** Las ocho rondas en orden: sus chips y cuál opción de reflexión es la correcta. */
const SECUENCIA: { chips: string[]; correcta: string }[] = [
  { chips: ['vaga', 'especifica'], correcta: 'b' },
  { chips: ['resumen', 'redes', 'examen'], correcta: 'b' },
  { chips: ['para-mi', 'hermanito', 'abuela'], correcta: 'b' },
  { chips: ['palabra', 'renglones', 'todo'], correcta: 'b' },
  { chips: ['color', 'salones'], correcta: 'b' },
  { chips: ['explicame', 'escribeme'], correcta: 'b' },
  { chips: ['tema', 'direccion', 'fecha', 'nombre-escuela'], correcta: 'b' },
  { chips: ['cartel-corta', 'cartel-larga', 'expo-corta', 'expo-larga'], correcta: 'a' },
];

/** Revela todos los chips de la ronda `indice` y acierta la reflexión, sin avanzar. */
function resolverRonda(indice: number) {
  const { chips, correcta } = SECUENCIA[indice];
  chips.forEach((id) => fireEvent.click(getChip(id)));
  fireEvent.click(getOpcion(correcta));
}

/** Juega bien las rondas 0..objetivo-1 y avanza, dejando montado el índice `objetivo`. */
function avanzarHasta(objetivo: number) {
  for (let i = 0; i < objetivo; i++) {
    resolverRonda(i);
    fireEvent.click(screen.getByTestId('pia-siguiente'));
  }
}

describe('n4-pregunta-a-la-ia — Tecnia Asistente', () => {
  it('abre en la primera pregunta sin completarse sola, con progreso y puntaje en rango', () => {
    const { onProgress, onScore, onComplete } = montar();
    expect(screen.getByTestId('pia-progreso').textContent).toBe('Pregunta 1 de 8');
    expect(onComplete).not.toHaveBeenCalled();
    expect(onProgress).toHaveBeenCalled();
    expect(onScore).toHaveBeenCalled();
    for (const [valor] of onProgress.mock.calls) {
      expect(valor).toBeGreaterThanOrEqual(0);
      expect(valor).toBeLessThanOrEqual(1);
    }
    for (const [valor] of onScore.mock.calls) {
      expect(valor).toBeGreaterThanOrEqual(0);
      expect(valor).toBeLessThanOrEqual(100);
    }
  });

  it('ronda 1: revela las dos respuestas antes de la reflexión, y jugar mal no desbloquea «Siguiente»', () => {
    montar();
    fireEvent.click(getChip('vaga'));
    fireEvent.click(getChip('especifica'));
    expect(screen.getByTestId('pia-hilo').textContent).toContain('Empezó en 1910');
    expect(screen.queryByText('¿Cuál de las dos podrías usar de verdad en tu tarea?')).not.toBeNull();

    // Jugar mal: creer que la pregunta corta es la que sirve.
    fireEvent.click(getOpcion('a'));
    expect(screen.queryByTestId('pia-siguiente')).toBeNull();
    expect(screen.queryByText(/pegar tal cual en tu tarea/i)).not.toBeNull();
  });

  it('ronda 1: acertar la reflexión desbloquea «Siguiente pregunta» y avanza a la ronda 2', () => {
    montar();
    fireEvent.click(getChip('vaga'));
    fireEvent.click(getChip('especifica'));
    fireEvent.click(getOpcion('b'));
    expect(screen.getByTestId('pia-siguiente').textContent).toBe('Siguiente pregunta');
    fireEvent.click(screen.getByTestId('pia-siguiente'));
    expect(screen.getByTestId('pia-progreso').textContent).toBe('Pregunta 2 de 8');
  });

  it('ronda 4: pedir «una palabra» es jugar mal a propósito — el asistente casi no dice nada', () => {
    montar();
    avanzarHasta(3);
    fireEvent.click(getChip('palabra'));
    fireEvent.click(getChip('renglones'));
    fireEvent.click(getChip('todo'));
    expect(screen.getByTestId('pia-hilo').textContent).toContain('Asteroide.');

    fireEvent.click(getOpcion('a')); // cree que la de una palabra alcanza
    expect(screen.queryByTestId('pia-siguiente')).toBeNull();
    fireEvent.click(getOpcion('b'));
    expect(screen.queryByTestId('pia-siguiente')).not.toBeNull();
  });

  it('ronda 5 (la más importante): la respuesta inventada no lleva ningún aviso al revelarse', () => {
    montar();
    avanzarHasta(4);
    fireEvent.click(getChip('color'));
    fireEvent.click(getChip('salones'));
    // Sin aviso, sin dudar: se ve exactamente igual que cualquier otra respuesta.
    expect(screen.queryAllByTestId('pia-aviso')).toHaveLength(0);
    expect(screen.getByTestId('pia-hilo').textContent).toContain('dieciocho salones');

    // Jugar mal: creerse la respuesta porque sonó segura.
    fireEvent.click(getOpcion('a'));
    expect(screen.queryByTestId('pia-revelacion')).toBeNull();

    fireEvent.click(getOpcion('b'));
    expect(screen.queryByTestId('pia-revelacion')).not.toBeNull();
  });

  it('ronda 6: pedir que le hagan la tarea completa es jugar mal — no deja al alumno explicarla', () => {
    montar();
    avanzarHasta(5);
    fireEvent.click(getChip('explicame'));
    fireEvent.click(getChip('escribeme'));

    fireEvent.click(getOpcion('a')); // cree que "hazme la tarea" lo deja listo
    expect(screen.queryByTestId('pia-siguiente')).toBeNull();
    fireEvent.click(getOpcion('b'));
    expect(screen.queryByTestId('pia-siguiente')).not.toBeNull();
  });

  it('ronda 7: dar un dato personal dispara el aviso de Bit en vez de una respuesta', () => {
    montar();
    avanzarHasta(6);
    fireEvent.click(getChip('direccion'));
    const avisos = screen.getAllByTestId('pia-aviso');
    expect(avisos.some((a) => a.textContent?.includes('dirección exacta'))).toBe(true);

    fireEvent.click(getChip('nombre-escuela'));
    expect(screen.getAllByTestId('pia-aviso').length).toBeGreaterThanOrEqual(2);

    fireEvent.click(getChip('tema'));
    fireEvent.click(getChip('fecha'));
    fireEvent.click(getOpcion('b'));
    expect(screen.queryByTestId('pia-siguiente')).not.toBeNull();
  });

  it('el botón Salir llama a alSalir', () => {
    const { alSalir } = montar();
    fireEvent.click(screen.getByLabelText('Salir del laboratorio'));
    expect(alSalir).toHaveBeenCalledTimes(1);
  });

  it('recorrido completo: las ocho preguntas hasta el cierre, y Terminar entrega el resultado', () => {
    const { onComplete, onProgress, onScore } = montar();
    for (let i = 0; i < 8; i++) {
      resolverRonda(i);
      fireEvent.click(screen.getByTestId('pia-siguiente'));
    }
    expect(screen.queryByText('Insignia de Detective de la IA')).not.toBeNull();

    fireEvent.click(screen.getByTestId('pia-terminar'));
    expect(onComplete).toHaveBeenCalledTimes(1);
    const resultado = onComplete.mock.calls[0][0];
    expect(resultado.score).toBe(100);
    expect(resultado.stars).toBe(3);
    expect(resultado.errores).toBe(0);

    for (const [valor] of onProgress.mock.calls) {
      expect(valor).toBeGreaterThanOrEqual(0);
      expect(valor).toBeLessThanOrEqual(1);
    }
    for (const [valor] of onScore.mock.calls) {
      expect(valor).toBeGreaterThanOrEqual(0);
      expect(valor).toBeLessThanOrEqual(100);
    }
    expect(onProgress.mock.calls[onProgress.mock.calls.length - 1][0]).toBe(1);
  });
});
