'use client';

/**
 * N6·«Ciberseguridad» · «Alto al ciberacoso» — la más delicada de las tres
 * clases construidas sobre `simuladores/muro/`. Igual que
 * `n4-si-algo-me-incomoda`, «No es tu culpa» tiene que aparecer CINCO veces
 * con esas letras exactas y el puntaje NUNCA baja, ni siquiera jugando mal
 * a propósito (contestar feo, quedarse callada). El comentario cruel llega
 * un turno después del clic en «Seguir», nunca al publicar.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { EntradaAltoAlCiberacoso } from '@/components/activities/n6/ciberseguridad/EntradaAltoAlCiberacoso';

const pulsar = (nombre: string | RegExp) => fireEvent.click(screen.getByRole('button', { name: nombre }));

function abrirMuro() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  render(<EntradaAltoAlCiberacoso config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />);
  pulsar(/Abre Tecnia Muro/);
  return { onProgress, onScore, onComplete };
}

describe('n6-alto-al-ciberacoso', () => {
  it('la entrada dice las cuatro reglas, incluida "No es tu culpa", antes de entrar', () => {
    render(<EntradaAltoAlCiberacoso config={{}} onProgress={jest.fn()} onScore={jest.fn()} onComplete={jest.fn()} />);
    expect(screen.getByText('No es tu culpa')).not.toBeNull();
    expect(screen.getByText('Pelear no ayuda')).not.toBeNull();
    expect(screen.getByText('Reportar no es exagerar')).not.toBeNull();
    expect(screen.getByText('Qué hacer si pasa')).not.toBeNull();

    pulsar(/Abre Tecnia Muro/);
    expect(screen.getByText(/gato astronauta/)).not.toBeNull();
    // El comentario cruel no llega antes de pulsar "Seguir".
    expect(screen.queryByText(/Uriel/)).toBeNull();
  });

  it('el comentario cruel llega un turno después de "Seguir", nunca al publicar', () => {
    abrirMuro();
    pulsar('Seguir');
    expect(screen.getByText(/ni parece gato/)).not.toBeNull();
    expect(screen.getByText(/No es tu culpa/)).not.toBeNull();
  });

  it('jugando MAL dos veces (contestar feo, quedarse callada) antes de acertar: el puntaje nunca baja y la decisión sigue abierta', () => {
    const { onScore } = abrirMuro();
    pulsar('Seguir');

    pulsar('Le contesto igual de feo');
    expect(screen.getByText(/Pelear no arregla nada/)).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Reporto el comentario' })).not.toBeNull();

    pulsar('Me quedo callada, no hago nada');
    expect(screen.getByText(/No tienes que aguantarlo en silencio/)).not.toBeNull();

    for (const [valor] of onScore.mock.calls) expect(valor).toBe(100);
  });

  it('recorrido completo: reportar, bloquear, y "No es tu culpa" aparece cinco veces a la vez en el cierre', () => {
    const { onComplete } = abrirMuro();
    pulsar('Seguir');
    pulsar('Le contesto igual de feo');
    pulsar('Me quedo callada, no hago nada');

    pulsar('Reporto el comentario');
    expect(screen.getByText(/Reportar no es exagerar/)).not.toBeNull();

    pulsar('Bloquear a Uriel');
    expect(screen.getByTestId('uriel-bloqueado')).not.toBeNull();
    // La amiga que apoya es la consecuencia diferida de bloquear, no un aviso inmediato.
    expect(screen.getByText(/gato astronauta está increíble/)).not.toBeNull();

    // Las cinco, con esas letras exactas, conviven en el historial que no se borra.
    expect(screen.getAllByText(/no es tu culpa/i).length).toBe(5);

    pulsar('Terminar');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0]).toMatchObject({ score: 100, stars: 3 });
    expect(screen.getByText('Insignia: Sabe defenderse sin pelear')).not.toBeNull();
    // El cierre no habla de XP crudo, insignia y frase, nada más.
    expect(screen.queryByText(/\bXP\b/)).toBeNull();
  });
});
