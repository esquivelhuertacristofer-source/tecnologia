'use client';

/**
 * N7·«Ciudadanía digital crítica» · «Equilibrio digital» — tercera y última
 * clase de la unidad. No usa `simuladores/muro/`: el programa es "Tecnia
 * Avisos", local a este par de archivos. La mecánica nunca resta puntaje
 * (igual que sus dos hermanas de la unidad): elegir la opción menos
 * conveniente no bloquea el paso, sólo explica la consecuencia y deja el
 * botón que sí avanza disponible para intentarlo de nuevo.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { EntradaEquilibrioDigital } from '@/components/activities/n7/situacion/EntradaEquilibrioDigital';

const pulsar = (nombre: string | RegExp) => fireEvent.click(screen.getByRole('button', { name: nombre }));

function abrirAvisos() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  render(<EntradaEquilibrioDigital config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />);
  pulsar(/Abre Tecnia Avisos/);
  pulsar('Empezar');
  return { onProgress, onScore, onComplete };
}

describe('n7-equilibrio-digital', () => {
  it('la entrada explica el concepto sin moralizar y su CTA abre el primer aviso', () => {
    render(<EntradaEquilibrioDigital config={{}} onProgress={jest.fn()} onScore={jest.fn()} onComplete={jest.fn()} />);
    expect(screen.getByText('Equilibrio no es apagar todo')).not.toBeNull();
    expect(screen.getByText('No toda urgencia es urgencia de verdad')).not.toBeNull();

    pulsar(/Abre Tecnia Avisos/);
    pulsar('Empezar');
    expect(screen.getByText('Grupo Amigos 9°B')).not.toBeNull();
    expect(screen.getByText(/Mira este meme/)).not.toBeNull();
  });

  it('jugando MAL en el aviso de los amigos: abrirlo no bloquea el paso ni baja el puntaje, y el botón bueno sigue ahí', () => {
    const { onScore } = abrirAvisos();

    pulsar('Lo abro tantito');
    expect(screen.getByText(/Cambiar de tarea tiene un costo/)).not.toBeNull();
    // El mismo botón que avanza sigue disponible después de la elección débil.
    pulsar('Sigo con el ejercicio, lo veo en el descanso');
    expect(screen.getByText('Mamá')).not.toBeNull();

    for (const [valor] of onScore.mock.calls) expect(valor).toBe(100);
  });

  it('el aviso de mamá invierte la polaridad: aquí "dejarlo para después" es lo que NO avanza', () => {
    abrirAvisos();
    pulsar('Sigo con el ejercicio, lo veo en el descanso');

    pulsar('Lo dejo para cuando termine, así no pierdo el hilo');
    expect(screen.getByText(/pensó que no habías visto el mensaje/)).not.toBeNull();
    expect(screen.getByText('Mamá')).not.toBeNull(); // sigue en el mismo aviso

    pulsar('Le contesto ya, es un segundo');
    expect(screen.getByText('Reino de Cristal')).not.toBeNull();
  });

  it('la trampa de atención: caer en el "tiempo limitado" no avanza y explica que el reloj nunca se acaba de verdad', () => {
    abrirAvisos();
    pulsar('Sigo con el ejercicio, lo veo en el descanso');
    pulsar('Le contesto ya, es un segundo');

    pulsar('Lo abro, dice que se acaba en dos minutos');
    expect(screen.getByText(/nunca se acaba de verdad/)).not.toBeNull();
    expect(screen.getByText('Reino de Cristal')).not.toBeNull(); // sigue en el mismo aviso

    pulsar('Ese tiempo límite no es real, sigo en lo mío');
    expect(screen.getByText('Avisos activos')).not.toBeNull();
  });

  it('el ajuste de avisos: silenciar a mamá no avanza, dejar algo de más sonando tampoco, y sólo la combinación correcta sí', () => {
    abrirAvisos();
    pulsar('Sigo con el ejercicio, lo veo en el descanso');
    pulsar('Le contesto ya, es un segundo');
    pulsar('Ese tiempo límite no es real, sigo en lo mío');

    // Silenciar a mamá: no avanza.
    pulsar(/^Mamá/);
    pulsar('Guardar y seguir con la tarea');
    expect(screen.getByText(/Silenciaste hasta a mamá/)).not.toBeNull();
    expect(screen.getByText('Avisos activos')).not.toBeNull();

    // La reenciendo, pero dejo amigos y juego sonando: tampoco avanza.
    pulsar(/^Mamá/);
    pulsar('Guardar y seguir con la tarea');
    expect(screen.getByText(/Dejaste sonando algo que sí puede esperar/)).not.toBeNull();
    expect(screen.getByText('Avisos activos')).not.toBeNull();

    // Silencio lo que puede esperar y dejo a mamá sonando: avanza.
    pulsar(/^Grupo Amigos 9°B/);
    pulsar(/^Reino de Cristal/);
    pulsar('Guardar y seguir con la tarea');
    expect(screen.getByText(/no es apagar todo, es elegir qué se queda prendido/)).not.toBeNull();
    expect(screen.getByText('Kevin')).not.toBeNull();
  });

  it('recorrido completo: decide los cinco avisos, termina con 100/3 y la insignia de equilibrio', () => {
    const { onComplete } = abrirAvisos();

    pulsar('Sigo con el ejercicio, lo veo en el descanso');
    pulsar('Le contesto ya, es un segundo');
    pulsar('Ese tiempo límite no es real, sigo en lo mío');
    pulsar(/^Grupo Amigos 9°B/);
    pulsar(/^Reino de Cristal/);
    pulsar('Guardar y seguir con la tarea');
    pulsar('Le contesto mañana, ya toca dormir');

    pulsar('Terminar');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0]).toMatchObject({ score: 100, stars: 3 });
    expect(screen.getByText('Insignia: Sabe elegir cuándo conectarse')).not.toBeNull();
  });
});
