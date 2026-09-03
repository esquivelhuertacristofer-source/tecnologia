'use client';

/**
 * N6·«Ciberseguridad» · «Privacidad en redes y juegos» — primera de las tres
 * clases construidas sobre `simuladores/muro/`. La consecuencia (el
 * comentario de un desconocido) llega un turno DESPUÉS del clic en «Seguir»,
 * nunca al publicar ni con un temporizador — por eso el recorrido pasa por
 * cada fase explícitamente en vez de asumir que algo "ya pasó".
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { EntradaPrivacidadEnJuegos } from '@/components/activities/n6/ciberseguridad/EntradaPrivacidadEnJuegos';

const pulsar = (nombre: string | RegExp) => fireEvent.click(screen.getByRole('button', { name: nombre }));

function abrirMuro() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  render(<EntradaPrivacidadEnJuegos config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />);
  pulsar(/Abre Tecnia Muro/);
  return { onProgress, onScore, onComplete };
}

describe('n6-privacidad-en-juegos', () => {
  it('la entrada dice los tres niveles de audiencia y su CTA abre Tecnia Muro con la publicación pública ya puesta', () => {
    render(<EntradaPrivacidadEnJuegos config={{}} onProgress={jest.fn()} onScore={jest.fn()} onComplete={jest.fn()} />);

    expect(screen.getByText('🌐 Público: cualquiera')).not.toBeNull();
    expect(screen.getByText('👥 Sólo amigos: tu círculo real')).not.toBeNull();
    expect(screen.getByText('🔒 Sólo yo: tu diario')).not.toBeNull();
    expect(screen.getByText('Elige la audiencia ANTES de publicar')).not.toBeNull();

    pulsar(/Abre Tecnia Muro/);
    expect(screen.getByText(/Juego en línea todos los días de 6 a 8/)).not.toBeNull();
    // Nadie comentó todavía: la consecuencia no llega antes de pulsar "Seguir".
    expect(screen.queryByText(/Jugador_Nocturno/)).toBeNull();
  });

  it('la consecuencia del desconocido llega un turno después, no al entrar', () => {
    abrirMuro();
    pulsar('Seguir');
    expect(screen.getByText(/Justo a esa hora nadie más anda por la casa/)).not.toBeNull();
    expect(screen.getByText(/Jugador_Nocturno no es tu amigo/)).not.toBeNull();
  });

  it('jugando MAL: dejar la publicación pública no bloquea ni baja el puntaje, y la decisión sigue abierta', () => {
    const { onScore } = abrirMuro();
    pulsar('Seguir');

    pulsar('Lo dejo público, no es para tanto');
    expect(screen.getByText(/sigue abierta/)).not.toBeNull();
    // El botón bueno sigue disponible: no se perdió la oportunidad de corregir.
    expect(screen.getByRole('button', { name: 'Cambio la publicación a Sólo amigos' })).not.toBeNull();

    pulsar('Lo dejo público, no es para tanto');
    for (const [valor] of onScore.mock.calls) expect(valor).toBe(100);
  });

  it('cambiar a Sólo amigos no borra lo que el desconocido ya vio: se dice con esas palabras', () => {
    abrirMuro();
    pulsar('Seguir');
    pulsar('Cambio la publicación a Sólo amigos');
    expect(screen.getByText(/no borra a quien ya la vio/)).not.toBeNull();
  });

  it('recorrido completo publicando en Público de nuevo: llega otro comentario del desconocido y sí se puede terminar con 100/3', () => {
    const { onComplete } = abrirMuro();
    pulsar('Seguir');
    pulsar('Cambio la publicación a Sólo amigos');

    pulsar('Publicar como 🌐 Público');
    expect(screen.getByText(/Subí de nivel en mi juego favorito/)).not.toBeNull();
    pulsar('Seguir');
    expect(screen.getByText(/Ya casi me sé tu horario/)).not.toBeNull();

    pulsar('Terminar');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0]).toMatchObject({ score: 100, stars: 3 });
    expect(screen.getByText('Insignia: Elige quién te ve')).not.toBeNull();
  });

  it('recorrido completo eligiendo Sólo yo la segunda vez: nadie ajeno comenta', () => {
    const { onComplete } = abrirMuro();
    pulsar('Seguir');
    pulsar('Cambio la publicación a Sólo amigos');
    pulsar('Publicar como 🔒 Sólo yo');
    pulsar('Seguir');
    expect(screen.getByText(/Nadie que no fuera tu círculo se enteró/)).not.toBeNull();
    pulsar('Terminar');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0]).toMatchObject({ score: 100, stars: 3 });
  });
});
