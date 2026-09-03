/**
 * `n4-virus-y-antivirus` · N4·U6 «Seguridad digital», parada 1.
 *
 * Monta la actividad DE VERDAD (Entrada → CTA → laboratorio), no una copia de
 * sus datos. Lo que se cuida aquí:
 *
 *  · Que la entrada respete la plantilla de oro y que el CTA abra «Tecnia
 *    Antivirus» sin ningún `<canvas>` de por medio — la regla de esta unidad
 *    es "nada de 3D forzado", y aquí se verifica en vez de darse por hecho.
 *  · Que "Analizar" revele el veredicto exacto del documento: una amenaza que
 *    el antivirus SÍ atrapa y, sobre todo, el programa que declara "limpio"
 *    sin estarlo — el corazón pedagógico de la actividad.
 *  · Jugar MAL a propósito: un acierto de casualidad en el primer programa no
 *    sirve de método (el mismo botón falla en el siguiente), fiarse de la
 *    chapa verde del programa trampa es un error explicado, y un botón
 *    equivocado repetido nunca deja avanzar sin acertar — sólo resta hasta
 *    el piso de 60.
 *  · Que la mesa completa —los 10 programas, decidiendo siempre bien—
 *    termine con `onComplete` en 100 y sin errores.
 *
 * Nota de consultas: una vez que un programa está "activo", su nombre (y su
 * chapa del antivirus) aparecen a la vez en la fila de la lista Y en la
 * cabecera del panel — por eso las comprobaciones sobre el programa activo
 * leen `.av-panel-nombre` por selector en vez de `getByText`, que lanzaría
 * "elemento múltiple". Lo mismo con la línea de Bit (`.bit-globo`): su texto
 * queda contenido dentro de contenedores ancestros, así que se lee por
 * selector y se compara con `toContain`, nunca con un regex de `getByText`.
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import EntradaVirusYAntivirus from '@/components/activities/n4/estudio/EntradaVirusYAntivirus';
import type { ActivityResult } from '@/types/activity-contract';

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const utils = render(
    <EntradaVirusYAntivirus config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />,
  );
  return { ...utils, onProgress, onScore, onComplete };
}

/** Entra al laboratorio desde la entrada (assetsPendientes deja el CTA listo de entrada, sin video que tapar). */
function entrarAlLaboratorio() {
  fireEvent.click(screen.getByText('Abre Tecnia Antivirus'));
}

async function encenderYAnalizar() {
  fireEvent.click(screen.getByText('⏻ Encender'));
  await act(async () => {
    jest.advanceTimersByTime(1200);
  });
  fireEvent.click(screen.getByText('🔍 Analizar con el antivirus'));
  await act(async () => {
    jest.advanceTimersByTime(3000);
  });
}

const panelNombre = () => document.querySelector('.av-panel-nombre')?.textContent ?? '';
const bitDice = () => document.querySelector('.bit-globo')?.textContent ?? '';

beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
afterEach(() => jest.useRealTimers());

describe('n4-virus-y-antivirus · la entrada', () => {
  it('pinta la plantilla de oro: letrero, las 4 fichas y el CTA hacia Tecnia Antivirus', () => {
    montar();
    expect(screen.getByText('La mesa de triaje')).not.toBeNull();
    expect(screen.getByText('Un programa, no un bicho')).not.toBeNull();
    expect(screen.getByText('Lo que pide contra lo que hace')).not.toBeNull();
    expect(screen.getByText('Sólo conoce lo que ya conoce')).not.toBeNull();
    expect(screen.getByText('Ante la duda, un adulto')).not.toBeNull();
    expect(screen.getByText('Abre Tecnia Antivirus')).not.toBeNull();
  });
});

describe('n4-virus-y-antivirus · sin 3D forzado', () => {
  it('el CTA abre "Tecnia Antivirus" apagado, con su botón de encender y sin ningún <canvas>', () => {
    montar();
    entrarAlLaboratorio();
    expect(document.querySelector('.av-marco')).not.toBeNull();
    expect(screen.getByText('⏻ Encender')).not.toBeNull();
    expect(document.querySelector('canvas')).toBeNull();
  });
});

describe('n4-virus-y-antivirus · el antivirus reconoce lo que ya conoce (y por eso no basta)', () => {
  it('tras analizar, marca la amenaza real como "amenaza" y a Fondos Galaxia como "limpio" (mal)', async () => {
    montar();
    entrarAlLaboratorio();
    await encenderYAnalizar();

    const filaDescarga = screen.getByText('Descarga Turbo Gratis').closest('.av-fila') as HTMLElement;
    expect(filaDescarga.textContent).toContain('Amenaza conocida');

    const filaFondos = screen.getByText('Fondos Galaxia').closest('.av-fila') as HTMLElement;
    expect(filaFondos.textContent).toContain('Conocido: limpio');

    // Un desconocido de verdad no lleva ni chapa verde ni roja.
    const filaLinterna = screen.getByText('Linterna Brillante').closest('.av-fila') as HTMLElement;
    expect(filaLinterna.textContent).toContain('Sin firma conocida');
  });
});

describe('n4-virus-y-antivirus · jugar mal a propósito', () => {
  it('un acierto de casualidad en el primer programa no sirve de método: el mismo botón falla en el siguiente y no avanza', async () => {
    montar();
    entrarAlLaboratorio();
    await encenderYAnalizar();

    // Calculadora Escolar sí se deja: acierto que podría ser casualidad.
    fireEvent.click(screen.getByText('✅ Dejarlo'));
    await act(async () => {
      jest.advanceTimersByTime(2400);
    });
    expect(panelNombre()).toBe('Linterna Brillante');

    // Repetir el mismo botón a ciegas en Linterna Brillante (hay que
    // quitarla) es ahora un error: no avanza y sigue en el mismo programa.
    fireEvent.click(screen.getByText('✅ Dejarlo'));
    expect(panelNombre()).toBe('Linterna Brillante');
  });

  it('fiarse de la chapa "limpio" de Fondos Galaxia es un error explicado, no aceptado', async () => {
    montar();
    entrarAlLaboratorio();
    await encenderYAnalizar();

    const avanzarCorrecto = async (boton: string) => {
      fireEvent.click(screen.getByText(boton));
      await act(async () => {
        jest.advanceTimersByTime(2400);
      });
    };
    // Calculadora → Dejarlo, Linterna → Quitarlo, Editor de Fotos → Dejarlo,
    // Descarga Turbo → Quitarlo, y ya estamos frente a Fondos Galaxia.
    await avanzarCorrecto('✅ Dejarlo');
    await avanzarCorrecto('🗑️ Quitarlo');
    await avanzarCorrecto('✅ Dejarlo');
    await avanzarCorrecto('🗑️ Quitarlo');
    expect(panelNombre()).toBe('Fondos Galaxia');

    fireEvent.click(screen.getByText('✅ Dejarlo'));
    expect(bitDice()).toContain('El antivirus lo marca "limpio"');
    // Y no avanzó: sigue frente al mismo programa trampa.
    expect(panelNombre()).toBe('Fondos Galaxia');
  });

  it('un botón equivocado repetido en el mismo programa sólo resta hasta el piso de 60, y nunca deja avanzar sin acertar', async () => {
    const { onScore } = montar();
    entrarAlLaboratorio();
    await encenderYAnalizar();

    // Programa activo: Calculadora Escolar (correcto = "Dejarlo"). "Quitarlo"
    // repetido es siempre el error equivocado, y nunca perdona la mesa.
    for (let i = 0; i < 10; i++) {
      fireEvent.click(screen.getByText('🗑️ Quitarlo'));
    }
    expect(panelNombre()).toBe('Calculadora Escolar');
    const puntajes = onScore.mock.calls.map((llamada) => llamada[0] as number);
    expect(Math.min(...puntajes)).toBe(60);
    expect(puntajes.every((p) => p >= 60)).toBe(true);
  });
});

describe('n4-virus-y-antivirus · las tres pestañas', () => {
  it('cada pestaña muestra un contenido distinto para el programa activo', async () => {
    montar();
    entrarAlLaboratorio();
    await encenderYAnalizar();

    expect(screen.getByText('«Resuelve operaciones y fracciones para tu tarea.»')).not.toBeNull();
    fireEvent.click(screen.getByText('Permisos que pide'));
    expect(screen.getByText('Ninguno')).not.toBeNull();
    fireEvent.click(screen.getByText('Qué hace de verdad'));
    expect(
      screen.getByText('Sólo calcula lo que tecleas. No pide nada y no manda nada a ningún lado.'),
    ).not.toBeNull();
  });
});

describe('n4-virus-y-antivirus · la mesa completa', () => {
  it('decidiendo siempre bien, los 10 programas cierran con onComplete en 100 y sin errores', async () => {
    const { onComplete } = montar();
    entrarAlLaboratorio();
    await encenderYAnalizar();

    const secuencia = [
      '✅ Dejarlo', // Calculadora Escolar
      '🗑️ Quitarlo', // Linterna Brillante
      '✅ Dejarlo', // Editor de Fotos Sofi
      '🗑️ Quitarlo', // Descarga Turbo Gratis
      '🗑️ Quitarlo', // Fondos Galaxia (la trampa)
      '🧑‍🏫 Revisar con un adulto', // Juego de Memoria
      '✅ Dejarlo', // Traductor Rápido
      '🗑️ Quitarlo', // Carreras Turbo 3D
      '🧑‍🏫 Revisar con un adulto', // Chat con mis Amigos
      '✅ Dejarlo', // Reloj y Clima
    ];

    for (const boton of secuencia) {
      fireEvent.click(screen.getByText(boton));
      await act(async () => {
        jest.advanceTimersByTime(2700);
      });
    }

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    const resultado = onComplete.mock.calls[0][0] as ActivityResult;
    expect(resultado.score).toBe(100);
    expect(resultado.errores).toBe(0);
    expect(resultado.stars).toBe(3);
    expect(screen.getByText('¡Mesa de triaje completa!')).not.toBeNull();
  });
});
