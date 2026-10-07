'use client';

/**
 * N6 · «Alto al ciberacoso» — reescrita el 6-oct-2026 (§69.1): la clase pasa
 * DENTRO de Tecnia Muro y cada misión se cumple leyendo el estado del muro.
 *
 * Se juega MAL antes que bien: bloquear antes de guardar la prueba, reportar
 * con el motivo equivocado, contestarle a Uriel, escribirle a Mamá sin la
 * captura, darle «me gusta» y compartir la burla. Lo que vigila:
 *   · que ninguna misión se cierre sin el estado completo del muro;
 *   · que el puntaje NUNCA baje (decisión de la clase, como n4-si-algo-me-incomoda);
 *   · que «No es tu culpa» aparezca CINCO veces a la vez en el cierre;
 *   · que los cuatro motivos de reporte vayan con el mismo estilo.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { EntradaAltoAlCiberacoso } from '@/components/activities/n6/ciberseguridad/EntradaAltoAlCiberacoso';

const pulsar = (nombre: string | RegExp) => fireEvent.click(screen.getByRole('button', { name: nombre }));
const comentario = (id: string) => document.querySelector(`[data-comentario="${id}"]`) as HTMLElement | null;
const post = (id: string) => document.querySelector(`[data-post="${id}"]`) as HTMLElement;
const seguir = () => fireEvent.click(screen.getByTestId('acoso-seguir'));
const historial = () => screen.getByTestId('bit-panel').textContent ?? '';
const cumplida = () => screen.queryByTestId('acoso-mision')?.getAttribute('data-cumplida');

function abrirMuro() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  render(<EntradaAltoAlCiberacoso config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />);
  pulsar(/Abre Tecnia Muro/);
  return { onProgress, onScore, onComplete };
}

function capturarUriel() {
  fireEvent.click(within(comentario('c-uriel') as HTMLElement).getByRole('button', { name: /Captura/ }));
}
function reportar(donde: HTMLElement, motivo: string) {
  fireEvent.click(within(donde).getByRole('button', { name: /Reportar/ }));
  fireEvent.click(document.querySelector(`[data-motivo="${motivo}"]`) as HTMLElement);
}
function reportarPublicacion(id: string, motivo: string) {
  fireEvent.click(post(id).querySelector('[data-accion="reportar"]') as HTMLElement);
  fireEvent.click(document.querySelector(`[data-motivo="${motivo}"]`) as HTMLElement);
}
function abrirPerfilDeUriel() {
  fireEvent.click(within(comentario('c-uriel') as HTMLElement).getByRole('button', { name: 'Abrir perfil de Uriel' }));
}
function bloquearDesdePerfil() {
  fireEvent.click(screen.getByTestId('muro-bloquear'));
  fireEvent.click(screen.getByTestId('muro-volver'));
}
function escribir(contacto: string, texto: string, adjuntarCaptura = false) {
  fireEvent.click(screen.getByTestId('muro-pestana-mensajes'));
  fireEvent.click(document.querySelector(`[data-contacto="${contacto}"]`) as HTMLElement);
  if (adjuntarCaptura) fireEvent.click(document.querySelector('[data-evidencia]') as HTMLElement);
  fireEvent.change(screen.getByTestId('muro-mensaje-cuadro'), { target: { value: texto } });
  fireEvent.click(screen.getByTestId('muro-mensaje-enviar'));
}
const volverAlMuro = () => fireEvent.click(screen.getByTestId('muro-pestana-inicio'));

/** El acto 1 bien hecho, en el orden bueno. */
function acto1Bien() {
  seguir();
  capturarUriel();
  reportar(comentario('c-uriel') as HTMLElement, 'acoso');
  abrirPerfilDeUriel();
  bloquearDesdePerfil();
  escribir('mama', 'Uriel me escribió algo feo en mi dibujo', true);
  volverAlMuro();
}

describe('n6-alto-al-ciberacoso · antes de entrar', () => {
  it('la entrada dice las reglas y el comentario cruel no llega hasta «Seguir»', () => {
    abrirMuro();
    expect(screen.getByText(/gato astronauta/)).not.toBeNull();
    expect(screen.queryByText(/ni parece gato/)).toBeNull();
    seguir();
    expect(screen.getByText(/ni parece gato/)).not.toBeNull();
    expect(screen.getByTestId('acoso-mision').textContent).toContain('con pruebas');
  });

  it('la misión dice el resultado y no los pasos: ni «captura», ni «bloquea», ni «reporta»', () => {
    abrirMuro();
    seguir();
    const mision = screen.getByTestId('acoso-mision').textContent ?? '';
    expect(mision).not.toMatch(/captur|bloque|report/i);
    // Ningún botón al lado del muro decide por el alumno: el panel de Bit sólo tiene texto.
    expect(within(screen.getByTestId('bit-panel')).queryAllByRole('button')).toHaveLength(0);
  });
});

describe('n6-alto-al-ciberacoso · jugando MAL', () => {
  it('bloquear antes de guardar la prueba: el comentario desaparece y ya no hay captura que tomar', () => {
    abrirMuro();
    seguir();
    abrirPerfilDeUriel();
    bloquearDesdePerfil();
    expect(comentario('c-uriel')).toBeNull();
    expect(historial()).toMatch(/no guardaste la prueba/);
    // Desbloquear un momento desde su perfil devuelve el comentario.
    fireEvent.click(screen.getByTestId('muro-pestana-mensajes'));
    volverAlMuro();
    expect(comentario('c-uriel')).toBeNull();
  });

  it('el reporte con otro motivo lo rechaza la plataforma, y los cuatro motivos van con el mismo estilo', () => {
    abrirMuro();
    seguir();
    fireEvent.click(within(comentario('c-uriel') as HTMLElement).getByRole('button', { name: /Reportar/ }));
    const motivos = [...document.querySelectorAll('[data-motivo]')];
    expect(motivos).toHaveLength(4);
    expect(new Set(motivos.map((m) => m.className)).size).toBe(1);
    fireEvent.click(document.querySelector('[data-motivo="no-me-gusta"]') as HTMLElement);
    expect(screen.getByTestId('muro-aviso').textContent).toMatch(/no podemos hacer nada/);
    // Se puede volver a reportar.
    expect(within(comentario('c-uriel') as HTMLElement).getByRole('button', { name: /Reportar otra vez/ })).toBeInTheDocument();
  });

  it('contestarle a Uriel lo empeora; a Mamá sin la captura le falta ver qué pasó; nada de eso cierra la misión ni baja el puntaje', () => {
    const { onScore } = abrirMuro();
    seguir();
    fireEvent.click(within(post('dibujo-gato')).getByRole('button', { name: /Comentar/ }));
    fireEvent.change(screen.getByTestId('muro-comentar-cuadro'), { target: { value: 'tú eres el feo' } });
    fireEvent.click(screen.getByTestId('muro-comentar-enviar'));
    expect(screen.getByText(/ya te enojaste/)).toBeInTheDocument();

    escribir('mama', 'Uriel me molestó');
    expect(screen.getByTestId('muro-mensajes').textContent).toMatch(/¿Me enseñas qué te escribió\?/);
    expect(cumplida()).toBe('no');

    for (const [valor] of onScore.mock.calls) expect(valor).toBe(100);
  });

  it('con tres de las cuatro cosas hechas, la misión sigue abierta (se lee el muro, no un botón)', () => {
    abrirMuro();
    seguir();
    capturarUriel();
    reportar(comentario('c-uriel') as HTMLElement, 'acoso');
    abrirPerfilDeUriel();
    bloquearDesdePerfil();
    escribir('valentina', 'mira lo que me puso Uriel', true);
    expect(screen.getByTestId('muro-mensajes').textContent).toMatch(/¿Ya le contaste a un adulto\?/);
    expect(cumplida()).toBe('no');
    expect(screen.queryByTestId('acoso-seguir')).toBeNull();
  });
});

describe('n6-alto-al-ciberacoso · de punta a punta', () => {
  it('el camino torcido también llega: bloquea primero, desbloquea, guarda, reporta mal y bien, y al final ayuda a Lía tras equivocarse', () => {
    const { onScore, onComplete } = abrirMuro();
    seguir();

    abrirPerfilDeUriel();
    fireEvent.click(screen.getByTestId('muro-bloquear')); // bloquea sin prueba
    fireEvent.click(screen.getByTestId('muro-bloquear')); // desbloquea desde el mismo perfil
    fireEvent.click(screen.getByTestId('muro-volver'));
    expect(comentario('c-uriel')).not.toBeNull();

    capturarUriel();
    reportar(comentario('c-uriel') as HTMLElement, 'spam');
    reportar(comentario('c-uriel') as HTMLElement, 'acoso');
    abrirPerfilDeUriel();
    bloquearDesdePerfil();
    escribir('profe', 'Profe, Uriel me está molestando en el muro', true);
    expect(cumplida()).toBe('si');
    volverAlMuro();
    seguir();

    // Acto 2: me gusta y compartir, y luego enmendarlo.
    const meme = post('meme-lia');
    fireEvent.click(within(meme).getByRole('button', { name: /Me gusta/ }));
    expect(screen.getByText(/¿verdad que sí da risa\?/)).toBeInTheDocument();
    fireEvent.click(within(meme).getByRole('button', { name: /Compartir/ }));
    expect(historial()).toMatch(/Compartir no se deshace/);
    reportarPublicacion('meme-lia', 'acoso');
    escribir('lia', 'Estoy contigo, no les hagas caso');
    expect(cumplida()).toBe('no'); // el «me gusta» sigue puesto
    volverAlMuro();
    fireEvent.click(within(post('meme-lia')).getByRole('button', { name: /Me gusta/ }));
    expect(cumplida()).toBe('si');
    seguir();

    fireEvent.click(screen.getByTestId('acoso-terminar'));
    expect(screen.getByText('Insignia: Sabe defenderse sin pelear')).toBeInTheDocument();
    for (const [valor] of onScore.mock.calls) expect(valor).toBe(100);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('el camino bueno: «No es tu culpa» cinco veces a la vez en el cierre, sin ninguna repetida', () => {
    const { onComplete } = abrirMuro();
    acto1Bien();
    expect(cumplida()).toBe('si');
    seguir();
    reportarPublicacion('meme-lia', 'acoso');
    escribir('lia', 'No estás sola, ya lo reporté');
    volverAlMuro();
    seguir();

    const veces = (historial().match(/No es tu culpa/g) ?? []).length;
    expect(veces).toBe(5);
    fireEvent.click(screen.getByTestId('acoso-terminar'));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0]).toMatchObject({ score: 100 });
  });
});
