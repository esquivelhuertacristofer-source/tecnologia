/**
 * N4 · U «Aprendo con la IA» · «Comprueba la respuesta».
 *
 * Estas pruebas juegan la actividad con el DOM en la mano, incluyendo un
 * RECORRIDO COMPLETO de principio a fin (única forma de cazar que la clase se
 * haya quedado imposible de terminar) y las cuatro formas de jugar MAL a
 * propósito que pide el encargo: dar la respuesta entera por buena (la
 * mecánica lo impide de raíz: no existe un botón «aceptar todo»), preguntarle
 * otra vez al asistente, fiarse de un blog que copia a otra página, y aceptar
 * una fuente inventada.
 */

import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { EntradaCompruebaLaRespuesta } from '@/components/activities/n4/estudio/EntradaCompruebaLaRespuesta';
import { LabCompruebaLaRespuesta } from '@/components/activities/n4/estudio/LabCompruebaLaRespuesta';

const pulsar = (nombre: RegExp) => fireEvent.click(screen.getByRole('button', { name: nombre }));
const correr = (ms: number) => act(() => void jest.advanceTimersByTime(ms));
const ultimo = (mock: jest.Mock) => mock.mock.calls[mock.mock.calls.length - 1][0];

function montarLab() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const utils = render(
    <LabCompruebaLaRespuesta config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />,
  );
  return { ...utils, onProgress, onScore, onComplete };
}

/** Abre el programa y entra a la fase «comprobar» con la primera afirmación. */
function abrirYComprobar() {
  const utils = montarLab();
  pulsar(/Abrir Tecnia Asistente/);
  pulsar(/Comprobar afirmación por afirmación/);
  return utils;
}

/** Confirma la afirmación actual como cierta usando Acuario Nacional (fuente válida). */
function confirmarConAcuario() {
  pulsar(/Acuario Nacional/);
  pulsar(/Es cierto/);
  correr(1200);
}

/** Recorre las tres primeras (ciertas) y caza la cuarta (falsa) con Estación Tecnia. */
function llegarACorrigiendo() {
  const utils = abrirYComprobar();
  confirmarConAcuario(); // 1. corazones
  confirmarConAcuario(); // 2. brazos
  confirmarConAcuario(); // 3. camuflaje
  pulsar(/Estación Tecnia/);
  pulsar(/Es falso/);
  correr(1400);
  return utils;
}

/** Corrige bien la afirmación falsa y termina la última (cierta), hasta la fase «fuente». */
function llegarAFuente() {
  const utils = llegarACorrigiendo();
  pulsar(/Entre 1 y 5 años, según la especie/);
  correr(1200); // -> afirmación 5 (sangre)
  confirmarConAcuario(); // -> fase «fuente»
  return utils;
}

/** Descubre que el libro que recomendó el asistente no existe y llega hasta la fase «decidir». */
function llegarADecidir() {
  const utils = llegarAFuente();
  pulsar(/Buscar «mentes de ocho brazos elena puig»/);
  pulsar(/Esa fuente no existe/);
  correr(1600);
  return utils;
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('n4-comprueba-la-respuesta', () => {
  it('la entrada presenta las cuatro fichas y su CTA abre el laboratorio cerrado', () => {
    render(
      <EntradaCompruebaLaRespuesta config={{}} onProgress={jest.fn()} onScore={jest.fn()} onComplete={jest.fn()} />,
    );

    expect(screen.getByText('No es todo o nada')).toBeInTheDocument();
    expect(screen.getByText('En otro sitio, no con él')).toBeInTheDocument();
    expect(screen.getByText('Copiada no es otra fuente')).toBeInTheDocument();
    expect(screen.getByText('Una fuente que suena perfecta')).toBeInTheDocument();

    pulsar(/Abre Tecnia Asistente/);
    expect(screen.getByRole('button', { name: /Abrir Tecnia Asistente/ })).toBeInTheDocument();
  });

  it('abre Tecnia Asistente y muestra la respuesta ya troceada en cinco afirmaciones, sin la cita todavía', () => {
    montarLab();
    pulsar(/Abrir Tecnia Asistente/);

    expect(screen.getByText(/tres corazones/)).toBeInTheDocument();
    expect(screen.getByText(/ocho brazos cubiertos de ventosas/)).toBeInTheDocument();
    expect(screen.getByText(/cambiar de color y de textura/)).toBeInTheDocument();
    expect(screen.getByText(/casi inmortales/)).toBeInTheDocument();
    expect(screen.getByText(/sangre es azul/)).toBeInTheDocument();
    // La cita del libro inventado llega después, no de entrada.
    expect(screen.queryByText(/Mentes de Ocho Brazos/)).toBeNull();
  });

  it('preguntarle otra vez al asistente siempre resta y nunca desbloquea el veredicto', () => {
    const { onScore } = abrirYComprobar();

    expect(screen.getByRole('button', { name: /Es cierto/ })).toBeDisabled();
    pulsar(/Pregúntale otra vez al asistente/);
    expect(ultimo(onScore)).toBe(94);
    expect(screen.getByText(/te lo repitió igual, sin comprobar nada/)).toBeInTheDocument();
    // Preguntar otra vez no abrió ninguna fuente: el veredicto sigue bloqueado.
    expect(screen.getByRole('button', { name: /Es cierto/ })).toBeDisabled();
  });

  it('un blog sin autor que copia a otra página no cuenta como segunda fuente', () => {
    const { container, onScore } = abrirYComprobar();

    pulsar(/Blog: Curiosidades/);
    expect(screen.getByText(/Sin autor · Sin fecha/)).toBeInTheDocument();

    pulsar(/Es cierto/);
    expect(ultimo(onScore)).toBe(94);
    expect(screen.getByText(/copia lo mismo que ya viste en otra página/)).toBeInTheDocument();
    // Sigue en la misma afirmación: ninguna quedó marcada como resuelta.
    expect(container.querySelectorAll('.car-afirmacion-marca')).toHaveLength(0);
  });

  it('confirmar con una fuente independiente sí avanza a la siguiente afirmación', () => {
    const { container, onProgress } = abrirYComprobar();

    confirmarConAcuario();

    expect(container.querySelectorAll('.car-afirmacion-marca')).toHaveLength(1);
    expect(screen.getByText('Revisadas')).toBeInTheDocument();
    expect(screen.getByText('1/5')).toBeInTheDocument();
    for (const [valor] of onProgress.mock.calls) {
      expect(valor).toBeGreaterThanOrEqual(0);
      expect(valor).toBeLessThanOrEqual(1);
    }
  });

  it('cazar la afirmación falsa exige corregir cuánto vive de verdad un pulpo, y penaliza la opción incorrecta', () => {
    const { container, onScore } = llegarACorrigiendo();

    // Bit repite la misma pregunta en su globo; se busca en el título de la
    // página del navegador para no toparse con las dos coincidencias.
    expect(container.querySelector('.car-pagina-titulo')?.textContent).toMatch(/¿Cuánto vive de verdad un pulpo/);
    // Nada falló todavía en este recorrido, así que `onScore` ni se ha llamado:
    // sólo lo llama `restar()`. El punto de partida implícito es 100.
    expect(onScore).not.toHaveBeenCalled();

    pulsar(/Entre 50 y 80 años/);
    expect(ultimo(onScore)).toBe(94);
    expect(screen.getByText(/Vuelve a leer la fuente/)).toBeInTheDocument();

    pulsar(/Entre 1 y 5 años, según la especie/);
    correr(1200);
    expect(screen.getByText('Revisadas')).toBeInTheDocument();
    expect(screen.getByText('4/5')).toBeInTheDocument();
  });

  it('el libro que el asistente recomienda no existe, y «seguro existe» también se rechaza', () => {
    const { container, onScore } = llegarAFuente();

    expect(screen.getByText(/Mentes de Ocho Brazos/)).toBeInTheDocument();
    pulsar(/Buscar «mentes de ocho brazos elena puig»/);
    expect(screen.getByText(/No encontramos ninguna página/)).toBeInTheDocument();

    pulsar(/Seguro existe, no la encontré bien/);
    expect(ultimo(onScore)).toBe(94);

    pulsar(/Esa fuente no existe/);
    correr(1600);
    expect(container.querySelector('.car-decidir-pregunta')?.textContent).toMatch(/sólo alcanzas a comprobar dos/);
  });

  it('en la fase de decidir, comprobarlo todo y no comprobar nada también se rechazan', () => {
    const { container, onScore } = llegarADecidir();

    pulsar(/Reviso las cinco, aunque se me haga tarde para entregar/);
    expect(ultimo(onScore)).toBe(94);
    pulsar(/No reviso nada: si lo dijo el asistente, ya vale/);
    expect(ultimo(onScore)).toBe(88);

    pulsar(/Reviso lo que voy a decir en voz alta o a poner en mi tarea/);
    correr(1400);
    expect(container.querySelector('.car-decidir-pregunta')?.textContent).toMatch(/lo más importante que había que comprobar/);
  });

  it('recorrido completo jugado perfecto: termina con puntaje 100, tres estrellas y sin errores', () => {
    const onComplete = jest.fn();
    const onScore = jest.fn();
    render(
      <EntradaCompruebaLaRespuesta config={{}} onProgress={jest.fn()} onScore={onScore} onComplete={onComplete} />,
    );
    pulsar(/Abre Tecnia Asistente/);
    pulsar(/Abrir Tecnia Asistente/);
    pulsar(/Comprobar afirmación por afirmación/);

    confirmarConAcuario();
    confirmarConAcuario();
    confirmarConAcuario();
    pulsar(/Estación Tecnia/);
    pulsar(/Es falso/);
    correr(1400);
    pulsar(/Entre 1 y 5 años, según la especie/);
    correr(1200);
    confirmarConAcuario();

    pulsar(/Buscar «mentes de ocho brazos elena puig»/);
    pulsar(/Esa fuente no existe/);
    correr(1600);

    pulsar(/Reviso lo que voy a decir en voz alta o a poner en mi tarea/);
    correr(1400);
    pulsar(/Que los pulpos no son inmortales, y que el libro que recomendó no existe/);
    correr(1400);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ score: 100, stars: 3, xp: 100, errores: 0 }),
    );
    expect(ultimo(onScore)).toBe(100);
    expect(screen.getByText('¡La tarea de Sofi quedó a salvo!')).toBeInTheDocument();
  });
});
