/**
 * `n5-nube-o-local` · N5·U1 «El sistema de cómputo», parada 3.
 *
 * Monta la actividad DE VERDAD (Entrada → CTA → laboratorio), no una copia de
 * sus datos. Lo que se cuida aquí:
 *
 *  · Que la entrada respete la plantilla de oro y que el CTA abra «Tecnia
 *    Archivos» sin ningún `<canvas>` de por medio — la regla de la casa es
 *    "nada de metáfora física, ni nubes de algodón": el laboratorio es un
 *    explorador de dos sitios, y se verifica que los archivos aparezcan como
 *    chips en el panel del sitio elegido, nunca como un dibujo de nube.
 *  · Que quede clavada la frase del encargo: la nube es el disco de otra
 *    computadora, no un lugar en el aire.
 *  · Jugar MAL a propósito: guardar la tarea de mañana sólo en la nube y que
 *    se vaya el internet (el indicador de conexión cambia solo), y subir el
 *    diario privado a la nube — las dos decisiones que el documento pide
 *    cazar explícitamente.
 *  · Que el recorrido completo —los nueve archivos, decidiendo siempre
 *    bien— cierre con `onComplete` en 100 y sin errores, y que el error
 *    nunca baje el puntaje del piso de 60.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import EntradaNubeOLocal from '@/components/activities/n5/estudio/EntradaNubeOLocal';
import type { ActivityResult } from '@/types/activity-contract';

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const utils = render(
    <EntradaNubeOLocal config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />,
  );
  return { ...utils, onProgress, onScore, onComplete };
}

/** Entra al laboratorio desde la entrada (assetsPendientes deja el CTA listo de entrada, sin video que tapar). */
function entrarAlLaboratorio() {
  fireEvent.click(screen.getByText('Abre Tecnia Archivos'));
}

async function encender() {
  fireEvent.click(screen.getByText('⏻ Encender'));
  await act(async () => {
    jest.advanceTimersByTime(1200);
  });
}

/** Decide el sitio de los nueve archivos, en orden, con el texto exacto del botón. */
async function guardarTodos(secuencia: string[]) {
  for (const boton of secuencia) {
    fireEvent.click(screen.getByText(boton));
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
  }
}

/** Revela el suceso activo y pasa al siguiente (o cierra la mesa si es el último). */
function revelarYSeguir() {
  fireEvent.click(screen.getByText('🔍 Ver qué pasó'));
  const siguiente = screen.queryByText('Siguiente ▶') ?? screen.getByText('🏁 Ver el resumen');
  fireEvent.click(siguiente);
}

const LOCAL = '💻 Sólo en Esta computadora';
const NUBE = '☁️ Sólo en Mi nube';

const bitDice = () => document.querySelector('.bit-globo')?.textContent ?? '';

beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
afterEach(() => jest.useRealTimers());

describe('n5-nube-o-local · la entrada', () => {
  it('pinta la plantilla de oro: letrero, las 4 fichas y el CTA hacia Tecnia Archivos', () => {
    montar();
    expect(screen.getByText('Antes de decidir')).not.toBeNull();
    expect(screen.getByText('La nube es el disco de otra persona')).not.toBeNull();
    expect(screen.getByText('Local es rápido; la nube sobrevive')).not.toBeNull();
    expect(screen.getByText('Guardado en un solo sitio no es guardado')).not.toBeNull();
    expect(screen.getByText('Hay cosas que no se suben')).not.toBeNull();
    expect(screen.getByText('Abre Tecnia Archivos')).not.toBeNull();
  });
});

describe('n5-nube-o-local · sin metáfora física y sin 3D', () => {
  it('el CTA abre "Tecnia Archivos" apagado, con su botón de encender y sin ningún <canvas>', () => {
    montar();
    entrarAlLaboratorio();
    expect(document.querySelector('.ex-marco')).not.toBeNull();
    expect(screen.getByText('⏻ Encender')).not.toBeNull();
    expect(document.querySelector('canvas')).toBeNull();
  });

  it('guardar un archivo lo hace aparecer como chip en el panel del sitio elegido', async () => {
    montar();
    entrarAlLaboratorio();
    await encender();
    fireEvent.click(screen.getByText(LOCAL));
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    const panelLocal = document.querySelectorAll('.ex-sitio')[0] as HTMLElement;
    expect(panelLocal.textContent).toContain('Tarea de Matemáticas');
  });
});

describe('n5-nube-o-local · la frase que hay que dejar clavada', () => {
  it('Bit dice que la nube es el disco de otra computadora, no un lugar en el aire', async () => {
    montar();
    entrarAlLaboratorio();
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    expect(bitDice()).toContain('disco de otra computadora');
  });
});

describe('n5-nube-o-local · jugar mal a propósito', () => {
  it('si la tarea de mañana sólo vive en la nube, cuando se va el internet no se puede abrir', async () => {
    montar();
    entrarAlLaboratorio();
    await encender();
    await guardarTodos([NUBE, LOCAL, LOCAL, LOCAL, LOCAL, LOCAL, LOCAL, LOCAL, LOCAL]);

    // El indicador de conexión ya cambió solo, apenas empieza la fase de sucesos.
    expect(screen.getByText('🚫 Sin conexión')).not.toBeNull();

    fireEvent.click(screen.getByText('🔍 Ver qué pasó'));
    expect(document.querySelector('.ex-resultado-badge')?.textContent).toBe('✘ Salió mal');
    expect(document.querySelector('.ex-resultado-texto')?.textContent).toContain('tu nube no existe para ti');
  });

  it('subir el diario privado a la nube se castiga: hay archivos que no se suben', async () => {
    montar();
    entrarAlLaboratorio();
    await encender();
    await guardarTodos([LOCAL, LOCAL, LOCAL, LOCAL, LOCAL, NUBE, LOCAL, LOCAL, LOCAL]);

    // Avanza los primeros cinco sucesos para llegar al del diario (índice 5).
    for (let i = 0; i < 5; i++) revelarYSeguir();

    fireEvent.click(screen.getByText('🔍 Ver qué pasó'));
    expect(document.querySelector('.ex-resultado-badge')?.textContent).toBe('✘ Salió mal');
    expect(document.querySelector('.ex-resultado-texto')?.textContent).toContain('Un diario no se sube');
  });
});

describe('n5-nube-o-local · el recorrido completo', () => {
  it('decidiendo siempre bien, los nueve archivos cierran con onComplete en 100 y sin errores', async () => {
    const { onComplete } = montar();
    entrarAlLaboratorio();
    await encender();
    await guardarTodos([LOCAL, NUBE, NUBE, NUBE, NUBE, LOCAL, NUBE, LOCAL, NUBE]);

    for (let i = 0; i < 9; i++) revelarYSeguir();

    expect(onComplete).toHaveBeenCalledTimes(1);
    const resultado = onComplete.mock.calls[0][0] as ActivityResult;
    expect(resultado.score).toBe(100);
    expect(resultado.errores).toBe(0);
    expect(resultado.stars).toBe(3);
    expect(screen.getByText('¡Explorador completo!')).not.toBeNull();
  });

  it('ninguna decisión sirve siempre: el puntaje nunca baja del piso de 60', async () => {
    const { onComplete } = montar();
    entrarAlLaboratorio();
    await encender();
    await guardarTodos([NUBE, LOCAL, LOCAL, LOCAL, LOCAL, NUBE, LOCAL, LOCAL, LOCAL]);

    for (let i = 0; i < 9; i++) revelarYSeguir();

    expect(onComplete).toHaveBeenCalledTimes(1);
    const resultado = onComplete.mock.calls[0][0] as ActivityResult;
    expect(resultado.errores).toBe(8);
    expect(resultado.score).toBe(60);
  });
});
