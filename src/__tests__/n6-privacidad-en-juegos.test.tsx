'use client';

/**
 * N6 · «Privacidad en redes y juegos» — reescrita el 6-oct-2026 (§69.2).
 *
 * Jugando MAL antes que bien: esconderlo todo, contestarle al desconocido,
 * reportarlo con otro motivo, publicar el torneo en público y cambiarlo
 * después. Vigila que cada misión se cierre leyendo el muro, que la audiencia
 * se cambie en el selector del muro, y que nada reste puntos.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { EntradaPrivacidadEnJuegos } from '@/components/activities/n6/ciberseguridad/EntradaPrivacidadEnJuegos';

const post = (id: string) => document.querySelector(`[data-post="${id}"]`) as HTMLElement;
const seguir = () => fireEvent.click(screen.getByTestId('priv-seguir'));
const cumplida = () => screen.queryByTestId('priv-mision')?.getAttribute('data-cumplida');
const historial = () => screen.getByTestId('bit-panel').textContent ?? '';
const audiencia = (id: string, v: string) =>
  fireEvent.change(document.querySelector(`[data-post-vis="${id}"]`) as HTMLSelectElement, { target: { value: v } });
const pestana = (t: string) => fireEvent.click(screen.getByTestId(`muro-pestana-${t}`));

function abrir() {
  const onScore = jest.fn();
  const onComplete = jest.fn();
  render(<EntradaPrivacidadEnJuegos config={{}} onProgress={jest.fn()} onScore={onScore} onComplete={onComplete} />);
  fireEvent.click(screen.getByRole('button', { name: /Abre Tecnia Muro/ }));
  return { onScore, onComplete };
}

function escribir(contacto: string, texto: string) {
  pestana('mensajes');
  fireEvent.click(document.querySelector(`[data-contacto="${contacto}"]`) as HTMLElement);
  fireEvent.change(screen.getByTestId('muro-mensaje-cuadro'), { target: { value: texto } });
  fireEvent.click(screen.getByTestId('muro-mensaje-enviar'));
}

function reportarComentarioDe(postId: string, motivo: string) {
  const li = post(postId).querySelector('[data-comentario^="c-nocturno"]') as HTMLElement;
  fireEvent.click(within(li).getByRole('button', { name: /Reportar/ }));
  fireEvent.click(document.querySelector(`[data-motivo="${motivo}"]`) as HTMLElement);
}

function bloquearNocturno(postId: string) {
  const li = post(postId).querySelector('[data-comentario^="c-nocturno"]') as HTMLElement;
  fireEvent.click(within(li).getByRole('button', { name: 'Abrir perfil de Jugador_Nocturno' }));
  fireEvent.click(screen.getByTestId('muro-bloquear'));
  fireEvent.click(screen.getByTestId('muro-volver'));
}

function publicarTorneo(vis: string) {
  fireEvent.change(screen.getByTestId('muro-compositor-visibilidad'), { target: { value: vis } });
  fireEvent.change(screen.getByTestId('muro-compositor-cuadro'), { target: { value: 'Mañana juego mi torneo, vengan' } });
  fireEvent.click(screen.getByTestId('muro-compositor-enviar'));
}

describe('n6-privacidad-en-juegos · misión 1, tu perfil habla de más', () => {
  it('«Así te ve un desconocido» enseña las pistas; la audiencia se cambia en el selector del muro', () => {
    abrir();
    seguir();
    pestana('desconocido');
    const pistas = screen.getByTestId('muro-perfil-pistas').textContent ?? '';
    expect(pistas).toMatch(/6 a 8/);
    expect(pistas).toMatch(/Secundaria 14/);
    pestana('inicio');
    expect(document.querySelectorAll('[data-testid="muro-visibilidad"]')).toHaveLength(3);
    expect(within(screen.getByTestId('bit-panel')).queryAllByRole('button')).toHaveLength(0);
  });

  it('esconderlo todo no cierra la misión: el dragón no decía nada peligroso', () => {
    abrir();
    seguir();
    audiencia('horario-online', 'amigos');
    audiencia('primer-dia', 'solo-yo');
    audiencia('dragon', 'amigos');
    expect(cumplida()).toBe('no');
    expect(historial()).toMatch(/Cerrar de más/);
    audiencia('dragon', 'publico');
    expect(cumplida()).toBe('si');
    pestana('desconocido');
    expect(screen.queryByTestId('muro-perfil-pistas')).toBeNull();
  });

  it('borrar el horario también vale, y la misión 2 sigue teniendo qué reportar', () => {
    abrir();
    seguir();
    fireEvent.click(post('horario-online').querySelector('[data-accion="borrar"]') as HTMLElement);
    audiencia('primer-dia', 'amigos');
    expect(cumplida()).toBe('si');
    seguir();
    reportarComentarioDe('dragon', 'datos-personales');
    expect(screen.getByTestId('muro-aviso').textContent).toMatch(/datos personales/);
  });
});

describe('n6-privacidad-en-juegos · misión 2, el desconocido amable', () => {
  it('contestarle con la escuela hace que pida más; reportarlo con otro motivo no sirve; sin un adulto no se cierra', () => {
    const { onScore } = abrir();
    seguir();
    audiencia('horario-online', 'amigos');
    audiencia('primer-dia', 'amigos');
    seguir();

    escribir('nocturno', 'voy en la Secundaria 14');
    expect(screen.getByTestId('muro-mensajes').textContent).toMatch(/¿y vives cerca/);
    pestana('inicio');
    reportarComentarioDe('dragon', 'spam');
    expect(screen.getByTestId('muro-aviso').textContent).toMatch(/no podemos hacer nada/);
    reportarComentarioDe('dragon', 'datos-personales');
    bloquearNocturno('dragon');
    expect(post('dragon').querySelector('[data-comentario^="c-nocturno"]')).toBeNull();
    expect(cumplida()).toBe('no');
    escribir('leo', 'me escribió un raro');
    expect(cumplida()).toBe('no');
    escribir('mama', 'Un desconocido me pidió mi escuela');
    expect(cumplida()).toBe('si');
    for (const [v] of onScore.mock.calls) expect(v).toBe(100);
  });

  it('el motivo «Me pide datos personales» está entre las opciones, todas con el mismo estilo', () => {
    abrir();
    seguir();
    audiencia('horario-online', 'amigos');
    audiencia('primer-dia', 'amigos');
    seguir();
    const li = post('dragon').querySelector('[data-comentario^="c-nocturno"]') as HTMLElement;
    fireEvent.click(within(li).getByRole('button', { name: /Reportar/ }));
    const motivos = [...document.querySelectorAll('[data-motivo]')];
    expect(motivos.map((m) => m.getAttribute('data-motivo')).sort()).toEqual(['acoso', 'datos-personales', 'no-me-gusta', 'spam']);
    expect(new Set(motivos.map((m) => m.className)).size).toBe(1);
  });
});

describe('n6-privacidad-en-juegos · misión 3 y de punta a punta', () => {
  it('publicar en público y cambiarlo después no cierra: hay que borrarlo y publicarlo bien', () => {
    const { onComplete, onScore } = abrir();
    seguir();
    audiencia('horario-online', 'amigos');
    audiencia('primer-dia', 'amigos');
    seguir();
    reportarComentarioDe('dragon', 'datos-personales');
    bloquearNocturno('dragon');
    escribir('tio', 'Tío, un desconocido me pidió mi WhatsApp');
    pestana('inicio');
    seguir();

    publicarTorneo('publico');
    expect(screen.getByText(/¿en qué parque\?/)).toBeInTheDocument();
    audiencia('torneo-1', 'amigos');
    expect(historial()).toMatch(/no se des-ve/);
    expect(cumplida()).toBe('no');
    fireEvent.click(post('torneo-1').querySelector('[data-accion="borrar"]') as HTMLElement);
    publicarTorneo('solo-yo');
    expect(cumplida()).toBe('no');
    publicarTorneo('amigos');
    expect(cumplida()).toBe('si');
    seguir();
    fireEvent.click(screen.getByTestId('priv-terminar'));
    expect(screen.getByText('Insignia: Elige quién te ve')).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
    for (const [v] of onScore.mock.calls) expect(v).toBe(100);
  });
});
