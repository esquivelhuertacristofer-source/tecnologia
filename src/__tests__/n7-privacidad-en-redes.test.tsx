'use client';

/**
 * N7 · «Privacidad en redes» — reescrita el 6-oct-2026 (§69.15).
 *
 * Jugando MAL antes que bien: borrarlo todo, cerrar sólo la escuela, contestar
 * el reto con el nombre del perro, mandarle la captura al amigo, escribirle al
 * adulto sin ella y bloquear antes de capturar. Vigila que cada misión se
 * cierre leyendo el muro, que el panel no tenga botones que actúen sobre él,
 * y que nada reste puntos.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { EntradaPrivacidadEnRedes } from '@/components/activities/n7/situacion/EntradaPrivacidadEnRedes';
import { DELATA_RESPUESTA } from '@/components/activities/n7/situacion/LabPrivacidadEnRedes';

const post = (id: string) => document.querySelector(`[data-post="${id}"]`) as HTMLElement;
const seguir = () => fireEvent.click(screen.getByTestId('priv-seguir'));
const cumplida = () => screen.queryByTestId('priv-mision')?.getAttribute('data-cumplida');
const historial = () => screen.getByTestId('bit-panel').textContent ?? '';
const audiencia = (id: string, v: string) =>
  fireEvent.change(document.querySelector(`[data-post-vis="${id}"]`) as HTMLSelectElement, { target: { value: v } });
const borrar = (id: string) => fireEvent.click(post(id).querySelector('[data-accion="borrar"]') as HTMLElement);
const pestana = (t: string) => fireEvent.click(screen.getByTestId(`muro-pestana-${t}`));
const comentarioNueva21 = () => post('post-logro')?.querySelector('[data-comentario="c-nueva21"]') as HTMLElement | null;

function abrir() {
  const onScore = jest.fn();
  const onComplete = jest.fn();
  render(<EntradaPrivacidadEnRedes config={{}} onProgress={jest.fn()} onScore={onScore} onComplete={onComplete} />);
  fireEvent.click(screen.getByRole('button', { name: /Abre Tecnia Muro/ }));
  return { onScore, onComplete };
}

function mision1Bien() {
  audiencia('post-escuela', 'amigos');
  audiencia('post-calle', 'solo-yo');
}

function comentarReto(texto: string) {
  fireEvent.click(post('reto-rockstar').querySelector('[data-accion="comentar"]') as HTMLElement);
  fireEvent.change(screen.getByTestId('muro-comentar-cuadro'), { target: { value: texto } });
  fireEvent.click(screen.getByTestId('muro-comentar-enviar'));
}

function reportarReto(motivo: string) {
  fireEvent.click(post('reto-rockstar').querySelector('[data-accion="reportar"]') as HTMLElement);
  fireEvent.click(document.querySelector(`[data-motivo="${motivo}"]`) as HTMLElement);
}

function hastaMision3() {
  seguir();
  mision1Bien();
  seguir();
  audiencia('post-mascota', 'amigos');
  reportarReto('datos-personales');
  seguir();
}

function capturar() {
  fireEvent.click(comentarioNueva21()!.querySelector('[data-accion-comentario="capturar"]') as HTMLElement);
}

function bloquear() {
  fireEvent.click(within(comentarioNueva21()!).getByRole('button', { name: 'Abrir perfil de Cuenta_Nueva21' }));
  fireEvent.click(screen.getByTestId('muro-bloquear'));
  fireEvent.click(screen.getByTestId('muro-volver'));
}

function escribir(contacto: string, texto: string, conCaptura: boolean) {
  pestana('mensajes');
  fireEvent.click(document.querySelector(`[data-contacto="${contacto}"]`) as HTMLElement);
  if (conCaptura) fireEvent.click(document.querySelector('[data-evidencia]') as HTMLElement);
  fireEvent.change(screen.getByTestId('muro-mensaje-cuadro'), { target: { value: texto } });
  fireEvent.click(screen.getByTestId('muro-mensaje-enviar'));
  pestana('inicio');
}

describe('n7-privacidad-en-redes · la entrada', () => {
  it('no adelanta la solución: ni cuántas publicaciones delatan ni cuáles', () => {
    render(<EntradaPrivacidadEnRedes config={{}} onProgress={jest.fn()} onScore={jest.fn()} onComplete={jest.fn()} />);
    expect(screen.getByText('Una pista no es todo el dato')).not.toBeNull();
    const texto = document.body.textContent ?? '';
    expect(texto).not.toMatch(/mascota|escuela|llega sola/i);
    expect(texto).not.toMatch(/tres publicaciones/i);
  });
});

describe('n7-privacidad-en-redes · misión 1, tu perfil habla de más', () => {
  it('«Así te ve un desconocido» junta las tres pistas; el panel no tiene botones que actúen sobre el muro', () => {
    abrir();
    seguir();
    pestana('desconocido');
    const pistas = screen.getByTestId('muro-perfil-pistas').textContent ?? '';
    expect(pistas).toMatch(/Benito Juárez/);
    expect(pistas).toMatch(/Rocko/);
    expect(pistas).toMatch(/Los Naranjos/);
    pestana('inicio');
    expect(document.querySelectorAll('[data-testid="muro-visibilidad"]')).toHaveLength(5);
    expect(within(screen.getByTestId('bit-panel')).queryAllByRole('button')).toHaveLength(0);
  });

  it('borrarlo todo no la cumple: el concurso y el cine no delataban nada', () => {
    abrir();
    seguir();
    for (const id of ['post-escuela', 'post-cine', 'post-mascota', 'post-calle', 'post-logro']) borrar(id);
    expect(cumplida()).toBe('no');
    expect(historial()).toMatch(/peligroso/);
  });

  it('cerrar sólo la escuela tampoco; cerrar de más y luego reabrir, sí', () => {
    abrir();
    seguir();
    audiencia('post-escuela', 'amigos');
    expect(cumplida()).toBe('no');
    audiencia('post-calle', 'amigos');
    audiencia('post-logro', 'solo-yo');
    expect(cumplida()).toBe('no');
    expect(historial()).toMatch(/Cerrar de más/);
    audiencia('post-logro', 'publico');
    expect(cumplida()).toBe('si');
    expect(historial()).toMatch(/no borra a quien ya la leyó/);
  });
});

describe('n7-privacidad-en-redes · misión 2, la pregunta de seguridad', () => {
  function aMision2() {
    abrir();
    seguir();
    mision1Bien();
    seguir();
  }

  it('el reto llega ya contestado por el salón', () => {
    aMision2();
    const reto = post('reto-rockstar');
    expect(reto.textContent).toMatch(/PRIMERA MASCOTA/);
    expect(reto.textContent).toMatch(/Firulais Morelos/);
  });

  it('cerrar Rocko no basta mientras el reto siga juntando respuestas: hay que reportarlo por datos personales', () => {
    aMision2();
    audiencia('post-mascota', 'amigos');
    expect(cumplida()).toBe('no');
    reportarReto('spam');
    expect(screen.getByTestId('muro-aviso').textContent).toMatch(/no podemos hacer nada/);
    expect(cumplida()).toBe('no');
    reportarReto('datos-personales');
    expect(post('reto-rockstar')).toBeNull();
    expect(cumplida()).toBe('si');
  });

  it('contestar con el perro y la calle: alguien lo guarda; sólo retirar el reto se lleva el comentario', () => {
    aMision2();
    audiencia('post-mascota', 'solo-yo');
    comentarReto('Rocko Naranjos 🤘');
    expect(post('reto-rockstar').textContent).toMatch(/guardado/);
    expect(historial()).toMatch(/pregunta de seguridad/);
    expect(cumplida()).toBe('no');
    reportarReto('datos-personales');
    expect(cumplida()).toBe('si');
  });

  it('el juez de la respuesta no distingue acentos ni mayúsculas, y deja pasar lo inventado', () => {
    expect(DELATA_RESPUESTA('ROCKO')).toBe(true);
    expect(DELATA_RESPUESTA('los naranjos')).toBe(true);
    expect(DELATA_RESPUESTA('Pizza Luna')).toBe(false);
  });
});

describe('n7-privacidad-en-redes · misión 3, alguien ya lo había visto', () => {
  it('el comentario llega y la copia aparece en la publicación de la calle borrada', () => {
    abrir();
    seguir();
    audiencia('post-escuela', 'amigos');
    borrar('post-calle');
    seguir();
    audiencia('post-mascota', 'amigos');
    reportarReto('datos-personales');
    seguir();
    expect(comentarioNueva21()?.textContent).toMatch(/sola a las 3/);
    expect(within(post('post-calle')).getByTestId('muro-copias').textContent).toMatch(/Cuenta_Nueva21/);
  });

  it('la captura al amigo no vale; al adulto sin captura, tampoco; con captura y bloqueo, sí', () => {
    const { onScore, onComplete } = abrir();
    hastaMision3();
    capturar();
    escribir('iker', 'mira lo que me escribieron', true);
    bloquear();
    expect(cumplida()).toBe('no');
    escribir('mama', 'mamá, alguien me escribió algo raro', false);
    expect(cumplida()).toBe('no');
    escribir('mama', 'te mando la captura', true);
    expect(cumplida()).toBe('si');

    seguir();
    fireEvent.click(screen.getByTestId('priv-terminar'));
    expect(onComplete).toHaveBeenCalled();
    for (const [valor] of onScore.mock.calls) expect(valor).toBe(100);
  });

  it('bloquear antes de capturar esconde el comentario; desbloquear en «Bloqueados» lo devuelve', () => {
    abrir();
    hastaMision3();
    bloquear();
    expect(comentarioNueva21()).toBeNull();
    expect(historial()).toMatch(/tampoco lo puedes capturar/);
    pestana('bloqueados');
    fireEvent.click(screen.getByTestId('muro-desbloquear-nueva21'));
    pestana('inicio');
    capturar();
    bloquear();
    escribir('maestra', 'maestra, le mando esto', true);
    expect(cumplida()).toBe('si');
  });

  it('contestarle a la cuenta no ayuda: le confirma que acertó', () => {
    abrir();
    hastaMision3();
    escribir('nueva21', 'quién eres?', false);
    expect(historial()).toMatch(/le confirma que acertó/);
    expect(cumplida()).toBe('no');
  });
});
