/**
 * `n4-real-o-generado` · N4·U6 «Aprendo con la IA», parada 3 «¿Real o generado?».
 *
 * Monta la actividad DE VERDAD (Entrada → CTA → laboratorio), no una copia de
 * sus datos. Lo que se cuida aquí:
 *
 *  · Que la entrada respete la plantilla de oro y que el CTA abra «Tecnia
 *    Muro» sin ningún `<canvas>` de por medio — regla de la casa: sin 3D.
 *  · Que las herramientas se desbloqueen EN ORDEN (imagen → cuenta → cruce)
 *    y nunca antes de tiempo.
 *  · El caso que nadie enseña: una foto real, sin retocar, que miente por su
 *    cuenta (de otro país, de hace años) — y que ninguna pista de imagen la
 *    delata, sólo la cuenta que la publicó.
 *  · Que estar generada no sea sinónimo de falsa: la ilustración del
 *    festival, honesta sobre lo que es, se comparte.
 *  · Que «no estoy segura» sea una respuesta correcta y bien vista, no un
 *    fallo, cuando de verdad no hay con qué decidir.
 *  · Jugar MAL a propósito: juzgar sólo por la imagen, desconfiar a ciegas de
 *    todo lo generado, y compartir sin estar segura.
 *  · El recorrido completo: las diez publicaciones, sin errores, terminan
 *    con `onComplete` en 100 y la insignia correcta.
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import EntradaRealOGenerado from '@/components/activities/n4/estudio/EntradaRealOGenerado';
import type { ActivityResult } from '@/types/activity-contract';

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const utils = render(
    <EntradaRealOGenerado
      config={{}}
      onProgress={onProgress}
      onScore={onScore}
      onComplete={onComplete}
    />,
  );
  return { ...utils, onProgress, onScore, onComplete };
}

/** Entra al laboratorio desde la entrada (assetsPendientes deja el CTA visible de entrada). */
function entrarAlLaboratorio() {
  fireEvent.click(screen.getByText('Abre Tecnia Muro'));
}

/** Elige un veredicto CORRECTO y deja pasar la retroalimentación (avanza a la siguiente). */
async function avanzar(etiquetaBoton: string) {
  fireEvent.click(screen.getByRole('button', { name: etiquetaBoton }));
  await act(async () => {
    jest.advanceTimersByTime(2300);
  });
}

beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
afterEach(() => jest.useRealTimers());

describe('n4-real-o-generado · la entrada', () => {
  it('pinta la plantilla de oro: letrero, las 4 fichas y el CTA hacia Tecnia Muro', () => {
    montar();
    expect(screen.getByText('Antes de abrir el visor')).not.toBeNull();
    expect(screen.getByText('Mira la imagen')).not.toBeNull();
    expect(screen.getByText('Pregunta de dónde salió')).not.toBeNull();
    expect(screen.getByText('Una foto real también miente')).not.toBeNull();
    expect(screen.getByText('Generado no es lo mismo que falso')).not.toBeNull();
    expect(screen.getByText('Abre Tecnia Muro')).not.toBeNull();
  });
});

describe('n4-real-o-generado · el visor no lleva 3D y desbloquea en orden', () => {
  it('el CTA abre "Tecnia Muro" sin ningún <canvas>, en fase 1 y con las otras dos herramientas todavía bloqueadas', () => {
    montar();
    entrarAlLaboratorio();
    expect(document.querySelector('canvas')).toBeNull();
    expect(screen.getByText('Fase 1 · Mira la imagen')).not.toBeNull();
    expect(screen.getByText('Publicación 1 de 10')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Examinar imagen' })).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Ver la cuenta' })).toBeNull();
    expect(screen.queryByRole('button', { name: '¿Alguien más lo cuenta?' })).toBeNull();
  });

  it('examinar la imagen de la primera publicación revela las tres pistas clásicas', () => {
    montar();
    entrarAlLaboratorio();
    fireEvent.click(screen.getByRole('button', { name: 'Examinar imagen' }));
    expect(screen.getByText(/dedo de más/)).not.toBeNull();
    expect(screen.getByText(/piel de las caras se ve perfecta/)).not.toBeNull();
  });

  it('al llegar a la publicación 4 se desbloquea "Ver la cuenta" y avisa que las pistas de imagen caducan', async () => {
    montar();
    entrarAlLaboratorio();
    await avanzar('No compartir'); // 1 · fiesta generada
    await avanzar('Compartir'); // 2 · perro real
    await avanzar('No compartir'); // 3 · café generado
    expect(screen.getByText('Publicación 4 de 10')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Ver la cuenta' })).not.toBeNull();
    expect(screen.getByText(/pistas de imagen caducan/)).not.toBeNull();
  });

  it('al llegar a la publicación 8 se desbloquea "¿Alguien más lo cuenta?"', async () => {
    montar();
    entrarAlLaboratorio();
    await avanzar('No compartir'); // 1
    await avanzar('Compartir'); // 2
    await avanzar('No compartir'); // 3
    await avanzar('No compartir'); // 4
    await avanzar('Compartir'); // 5
    await avanzar('Compartir'); // 6
    await avanzar('No compartir'); // 7
    expect(screen.getByText('Publicación 8 de 10')).not.toBeNull();
    expect(screen.getByRole('button', { name: '¿Alguien más lo cuenta?' })).not.toBeNull();
  });
});

describe('n4-real-o-generado · el error no borra lo logrado, sólo explica y resta', () => {
  it('elegir "Compartir" en la primera (generada) no avanza, explica por qué y baja el puntaje', () => {
    const { onScore } = montar();
    entrarAlLaboratorio();
    fireEvent.click(screen.getByRole('button', { name: 'Compartir' }));
    expect(screen.getByText(/pistas clásicas de estar generada/)).not.toBeNull();
    expect(screen.getByText('Publicación 1 de 10')).not.toBeNull();
    expect(onScore).toHaveBeenCalledWith(94);
  });

  it('elegir "No compartir" en la primera (correcta) avanza a la publicación 2 tras la retroalimentación', async () => {
    montar();
    entrarAlLaboratorio();
    fireEvent.click(screen.getByRole('button', { name: 'No compartir' }));
    expect(screen.getByText(/tres pistas clásicas juntas/)).not.toBeNull();
    await act(async () => {
      jest.advanceTimersByTime(2300);
    });
    expect(screen.getByText('Publicación 2 de 10')).not.toBeNull();
    expect(screen.getByText(/Mi perro Toby/)).not.toBeNull();
  });
});

describe('n4-real-o-generado · jugar mal a propósito', () => {
  it('marcar "No compartir" a ciegas falla en la publicación 2, una foto real sin ninguna pista', async () => {
    montar();
    entrarAlLaboratorio();
    await avanzar('No compartir'); // 1 · correcto
    fireEvent.click(screen.getByRole('button', { name: 'No compartir' })); // 2 · incorrecto
    expect(screen.getByText(/no todo lo que ves necesita desconfianza/)).not.toBeNull();
    expect(screen.getByText('Publicación 2 de 10')).not.toBeNull();
  });

  it('en la publicación 4, confiar sólo en que la imagen no tiene pistas ("Compartir") es un error: la cuenta, de hace 4 días, es la que delata la mentira', async () => {
    montar();
    entrarAlLaboratorio();
    await avanzar('No compartir'); // 1
    await avanzar('Compartir'); // 2
    await avanzar('No compartir'); // 3
    fireEvent.click(screen.getByRole('button', { name: 'Compartir' })); // 4 · incorrecto
    expect(screen.getByText(/foto real también puede contar una mentira/)).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Ver la cuenta' }));
    expect(screen.getByText('hace 4 días')).not.toBeNull();
  });

  it('desconfiar de la ilustración del festival sólo por estar generada ("No compartir") es un error: el texto ya avisa que es una ilustración', async () => {
    montar();
    entrarAlLaboratorio();
    await avanzar('No compartir'); // 1
    await avanzar('Compartir'); // 2
    await avanzar('No compartir'); // 3
    await avanzar('No compartir'); // 4
    await avanzar('Compartir'); // 5
    fireEvent.click(screen.getByRole('button', { name: 'No compartir' })); // 6 · incorrecto
    expect(screen.getByText(/Que una imagen esté generada no la hace mentirosa/)).not.toBeNull();
  });

  it('en la publicación 8, genuinamente ambigua, compartir sin estar segura es un error: "No estoy segura" es la respuesta correcta', async () => {
    montar();
    entrarAlLaboratorio();
    await avanzar('No compartir'); // 1
    await avanzar('Compartir'); // 2
    await avanzar('No compartir'); // 3
    await avanzar('No compartir'); // 4
    await avanzar('Compartir'); // 5
    await avanzar('Compartir'); // 6
    await avanzar('No compartir'); // 7
    fireEvent.click(screen.getByRole('button', { name: 'Compartir' })); // 8 · incorrecto
    expect(screen.getByText(/no hay con qué asegurar nada todavía/)).not.toBeNull();
    expect(screen.getByText('Publicación 8 de 10')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'No estoy segura' })); // 8 · correcto
    expect(screen.getByText(/es la respuesta correcta/)).not.toBeNull();
  });
});

describe('n4-real-o-generado · el recorrido completo', () => {
  it('decidiendo siempre bien, las diez publicaciones cierran con onComplete en 100, 3 estrellas y la insignia de Investigador de pantalla', async () => {
    const { onComplete } = montar();
    entrarAlLaboratorio();

    const secuencia = [
      'No compartir', // 1 · fiesta generada
      'Compartir', // 2 · perro real
      'No compartir', // 3 · café generado
      'No compartir', // 4 · foto real, contexto mentiroso
      'Compartir', // 5 · corte de agua confirmado
      'Compartir', // 6 · ilustración honesta del festival
      'No compartir', // 7 · planta milagrosa
      'No estoy segura', // 8 · testigo anónimo, ambiguo de verdad
      'Compartir', // 9 · árbol caído, corroborado
      'No compartir', // 10 · rescate heroico generado
    ];

    for (const boton of secuencia) {
      fireEvent.click(screen.getByRole('button', { name: boton }));
      await act(async () => {
        jest.advanceTimersByTime(2300);
      });
    }

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    const resultado = onComplete.mock.calls[0][0] as ActivityResult;
    expect(resultado.score).toBe(100);
    expect(resultado.errores).toBe(0);
    expect(resultado.stars).toBe(3);
    expect(screen.getByText('Insignia · Investigador de pantalla')).not.toBeNull();
    expect(screen.getByText('¡Ya sabes mirar más allá de la imagen!')).not.toBeNull();
  });
});
