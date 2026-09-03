'use client';

/**
 * N7·«Ciudadanía digital crítica» · «Privacidad en redes» — tercera y última
 * de las tres clases construidas sobre `simuladores/muro/`. Usa `perfilDe()`
 * con `visibilidad: ['publico']`: las pistas de una publicación desaparecen
 * del perfil auditado en cuanto deja de ser pública o se borra — pero la
 * consecuencia de haberla dejado pública SEMANAS llega un turno después de
 * borrarla (clic en «Seguir»), nunca automática, y no desaparece.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { EntradaPrivacidadEnRedes } from '@/components/activities/n7/situacion/EntradaPrivacidadEnRedes';

const pulsar = (nombre: string | RegExp) => fireEvent.click(screen.getByRole('button', { name: nombre }));

function abrirMuro() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  render(<EntradaPrivacidadEnRedes config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />);
  pulsar(/Abre Tecnia Muro/);
  return { onProgress, onScore, onComplete };
}

describe('n7-privacidad-en-redes', () => {
  it('la entrada explica qué es una pista y su CTA abre el perfil público con las tres pistas de riesgo', () => {
    render(<EntradaPrivacidadEnRedes config={{}} onProgress={jest.fn()} onScore={jest.fn()} onComplete={jest.fn()} />);
    expect(screen.getByText('Una pista no es todo el dato')).not.toBeNull();
    expect(screen.getByText('Auditar tarde sigue sirviendo')).not.toBeNull();

    pulsar(/Abre Tecnia Muro/);
    const pistas = screen.getByTestId('muro-perfil-pistas');
    expect(pistas.textContent).toMatch(/Secundaria Benito Juárez/);
    expect(pistas.textContent).toMatch(/Rocko/);
    expect(pistas.textContent).toMatch(/parque Los Naranjos/);
  });

  it('jugando MAL: dejar una publicación pública no bloquea el paso ni baja el puntaje, y se puede corregir después', () => {
    const { onScore } = abrirMuro();
    pulsar('Empezar auditoría');

    pulsar('La dejo pública');
    expect(screen.getByText(/sigue sumando una pista/)).not.toBeNull();
    expect(screen.getByTestId('muro-perfil-pistas').textContent).toMatch(/Secundaria Benito Juárez/);

    pulsar('Cambiar a Sólo amigos');
    expect(screen.queryByTestId('muro-perfil-pistas')?.textContent ?? '').not.toMatch(/Secundaria Benito Juárez/);
    for (const [valor] of onScore.mock.calls) expect(valor).toBe(100);
  });

  it('borrar la publicación de la mascota la saca del perfil auditado de inmediato', () => {
    abrirMuro();
    pulsar('Empezar auditoría');
    pulsar('Cambiar a Sólo amigos');

    expect(screen.getByTestId('muro-perfil-pistas').textContent).toMatch(/Rocko/);
    pulsar('Borrar publicación');
    expect(screen.queryByTestId('muro-perfil-pistas')?.textContent ?? '').not.toMatch(/Rocko/);
  });

  it('la publicación de la calle: borrar la saca del perfil YA, pero un turno después "Seguir" revela que ya la habían visto', () => {
    abrirMuro();
    pulsar('Empezar auditoría');
    pulsar('Cambiar a Sólo amigos');
    pulsar('Borrar publicación');

    expect(screen.getByTestId('muro-perfil-pistas').textContent).toMatch(/parque Los Naranjos/);
    pulsar('La dejo pública');
    pulsar('Borrar publicación');

    // Recién borrada: ya no aparece en el perfil auditado — la herramienta sí funciona.
    expect(screen.queryByTestId('muro-perfil-pistas')).toBeNull();
    // Pero la consecuencia todavía no se dijo: no llega antes de pulsar "Seguir".
    expect(screen.queryByText(/ya la había visto hace semanas/)).toBeNull();

    pulsar('Seguir');
    expect(screen.getByText(/ya la había visto hace semanas/)).not.toBeNull();
    expect(screen.getByText(/no se deshace/)).not.toBeNull();
  });

  it('recorrido completo: audita las tres, termina con 100/3 y la insignia de auditoría', () => {
    const { onComplete } = abrirMuro();
    pulsar('Empezar auditoría');
    pulsar('La dejo pública');
    pulsar('Cambiar a Sólo amigos');
    pulsar('La dejo pública');
    pulsar('Borrar publicación');
    pulsar('La dejo pública');
    pulsar('Borrar publicación');
    pulsar('Seguir');

    pulsar('Terminar');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0]).toMatchObject({ score: 100, stars: 3 });
    expect(screen.getByText('Insignia: Sabe auditar su perfil')).not.toBeNull();
  });
});
