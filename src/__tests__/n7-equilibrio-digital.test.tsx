'use client';

/**
 * N7 · «Equilibrio digital» — reescrita el 6-oct-2026 (§69.16).
 *
 * Jugando MAL antes que bien: silenciar sólo el grupo, apagar Mensajes entera,
 * hacer la tarde con los avisos de fábrica, abrir el cofre, no contestarle a
 * Mamá, y una Hora de dormir de lunes a viernes o que silencia la alarma.
 * Vigila que cada misión se juzgue leyendo el teléfono y que nada reste.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { EntradaEquilibrioDigital } from '@/components/activities/n7/situacion/EntradaEquilibrioDigital';
import {
  AJUSTES_DE_FABRICA,
  DORMIR_DE_FABRICA,
  TARDE_INICIAL,
  avisosQueSuenan,
  correrReloj,
  estadoDeLaTarde,
  faltasDeDormir,
  mision1Cumple,
  type AjustesAvisos,
} from '@/components/activities/n7/situacion/LabEquilibrioDigital';

const id = (t: string) => screen.getByTestId(t);
const tocar = (t: string) => fireEvent.click(id(t));
const cumplida = () => screen.queryByTestId('eq-mision')?.getAttribute('data-cumplida');
const historial = () => id('eq-historial').textContent ?? '';
const inicio = () => {
  if (screen.queryByTestId('tel-inicio')) tocar('tel-inicio');
};

function abrir() {
  const onScore = jest.fn();
  const onComplete = jest.fn();
  render(<EntradaEquilibrioDigital config={{}} onProgress={jest.fn()} onScore={onScore} onComplete={onComplete} />);
  fireEvent.click(screen.getByRole('button', { name: /Abre Tecnia Avisos/ }));
  tocar('eq-seguir');
  return { onScore, onComplete };
}

function canal(app: string, ...canales: string[]) {
  inicio();
  tocar('tel-app-ajustes');
  tocar('ajustes-notificaciones');
  tocar(`notif-app-${app}`);
  for (const c of canales) tocar(`notif-canal-${c}`);
}

function mision1Bien() {
  canal('mensajes', 'grupo');
  canal('juego', 'ofertas', 'energia');
  canal('videos', 'recomendaciones');
}

function resolver(...respuestas: string[]) {
  for (const r of respuestas) {
    fireEvent.change(id('tarea-respuesta'), { target: { value: r } });
    tocar('tarea-enviar');
  }
}

function contestarAMama(texto = 'Ya voy') {
  inicio();
  tocar('tel-app-mensajes');
  tocar('chat-mama');
  fireEvent.change(id('chat-cuadro'), { target: { value: texto } });
  tocar('chat-enviar');
}

function aTarea() {
  inicio();
  tocar('tel-app-tarea');
}

const TODAS = ['20', '45', '161', '5', '48'];

describe('n7-equilibrio-digital · la entrada', () => {
  it('ya no promete cinco avisos ni dicta a quién dejar sonando', () => {
    render(<EntradaEquilibrioDigital config={{}} onProgress={jest.fn()} onScore={jest.fn()} onComplete={jest.fn()} />);
    const texto = document.body.textContent ?? '';
    expect(texto).not.toMatch(/Avisos a decidir/);
    expect(texto).not.toMatch(/como tu familia/);
    expect(texto).not.toMatch(/cofre/i);
  });
});

describe('n7-equilibrio-digital · misión 1, el teléfono te interrumpe de más', () => {
  it('los números de la semana: de fábrica suenan 524; el panel no tiene botones que toquen el teléfono', () => {
    abrir();
    tocar('tel-app-ajustes');
    tocar('ajustes-bienestar');
    expect(id('bienestar').textContent).toMatch(/524 recibidas/);
    expect(within(id('bit-panel')).queryAllByRole('button')).toHaveLength(0);
  });

  it('silenciar sólo el grupo no baja de 70', () => {
    abrir();
    canal('mensajes', 'grupo');
    expect(cumplida()).toBe('no');
    tocar('notif-volver');
    expect(id('notif-total').textContent).toMatch(/310/);
  });

  it('apagar Mensajes entera baja de 70 pero apaga a Mamá: no cumple', () => {
    abrir();
    canal('juego', 'ofertas', 'energia');
    canal('videos', 'recomendaciones');
    canal('mensajes');
    tocar('notif-app-switch-mensajes');
    expect(cumplida()).toBe('no');
    expect(historial()).toMatch(/se fue también Mamá/);
    tocar('notif-app-switch-mensajes');
    tocar('notif-canal-grupo');
    expect(cumplida()).toBe('si');
  });

  it('hay más de una manera de cumplirla', () => {
    const base: AjustesAvisos = JSON.parse(JSON.stringify(AJUSTES_DE_FABRICA));
    const a = { ...base, canales: { ...base.canales, grupo: false, ofertas: false, recomendaciones: false, energia: false } };
    const b = { ...base, canales: { ...base.canales, grupo: false, ofertas: false, recomendaciones: false, kevin: false, invitaciones: false, suscripciones: false } };
    expect(avisosQueSuenan(a)).toBe(65);
    expect(mision1Cumple(a)).toBe(true);
    expect(mision1Cumple(b)).toBe(true);
    expect(mision1Cumple({ ...a, canales: { ...a.canales, mama: false } })).toBe(false);
  });
});

describe('n7-equilibrio-digital · misión 2, la tarde del viernes', () => {
  it('con los avisos de fábrica la tarde no sale: al primer ejercicio ya son las 8:26', () => {
    const t = correrReloj(TARDE_INICIAL, 4, AJUSTES_DE_FABRICA);
    expect(t.reloj).toBe(26);
  });

  it('bien configurado, terminar y contestarle a Mamá cumple; un ejercicio mal no mueve el reloj', () => {
    const { onScore, onComplete } = abrir();
    mision1Bien();
    tocar('eq-seguir');
    aTarea();
    fireEvent.change(id('tarea-respuesta'), { target: { value: '19' } });
    tocar('tarea-enviar');
    expect(id('tarea-revisa')).not.toBeNull();
    expect(id('tel-reloj').textContent).toBe('8:10 pm');
    resolver(...TODAS);
    expect(id('tel-banner').getAttribute('data-canal')).toBe('mama');
    expect(cumplida()).toBe('no');
    contestarAMama();
    expect(cumplida()).toBe('si');

    tocar('eq-seguir');
    // Misión 3 rápida para llegar al final.
    inicio();
    tocar('tel-app-ajustes');
    tocar('ajustes-dormir');
    tocar('dormir-activo');
    fireEvent.change(id('dormir-inicio'), { target: { value: String(22 * 60) } });
    fireEvent.change(id('dormir-fin'), { target: { value: String(6 * 60 + 30) } });
    tocar('dormir-noche-0');
    tocar('dormir-noche-5');
    tocar('dormir-excepcion-mama');
    expect(cumplida()).toBe('si');
    expect(id('dormir-resumen').textContent).toMatch(/habría llegado en silencio/);
    tocar('eq-seguir');
    tocar('eq-terminar');
    expect(onComplete).toHaveBeenCalled();
    for (const [valor] of onScore.mock.calls) expect(valor).toBe(100);
  });

  it('seguir con la tarea mientras Mamá espera: toca la puerta y la tarde se repite con los ajustes intactos', () => {
    abrir();
    mision1Bien();
    tocar('eq-seguir');
    aTarea();
    resolver('20', '45', '161', '5');
    // 8:26: falta uno. Abrir el cofre desde Inicio cuesta 8 minutos y deja pasar a Mamá.
    inicio();
    tocar('tel-app-juego');
    expect(historial()).toMatch(/OTRO cofre/);
    aTarea();
    expect(historial()).toMatch(/Mamá toca la puerta/);
    expect(cumplida()).toBe('no');
    tocar('tarea-repetir');
    expect(id('tel-reloj').textContent).toBe('8:10 pm');
    resolver(...TODAS);
    contestarAMama();
    expect(cumplida()).toBe('si');
  });

  it('terminar sin contestarle a Mamá no cumple; contestarle tarde, tampoco', () => {
    const malas: AjustesAvisos = {
      ...AJUSTES_DE_FABRICA,
      canales: { ...AJUSTES_DE_FABRICA.canales, grupo: false, ofertas: false, energia: false, recomendaciones: false },
    };
    let t = TARDE_INICIAL;
    for (let i = 0; i < 5; i++) t = { ...correrReloj(t, 4, malas), resueltos: i + 1 };
    t = { ...t, terminoA: t.reloj };
    expect(estadoDeLaTarde(t)).toBe('en-curso');
    expect(estadoDeLaTarde({ ...t, mamaContestada: (t.mamaLlego ?? 0) + 6 })).toBe('mama-esperando-de-mas');
    expect(estadoDeLaTarde({ ...t, mamaContestada: t.reloj + 1 })).toBe('lista');
  });
});

describe('n7-equilibrio-digital · misión 3, ya es de noche', () => {
  const bien = { ...DORMIR_DE_FABRICA, activo: true, inicio: 22 * 60, fin: 6 * 60 + 30, noches: [0, 1, 2, 3, 4], excepciones: ['mama' as const] };

  it('la buena no tiene faltas', () => {
    expect(faltasDeDormir(bien)).toEqual([]);
  });

  it('de lunes a viernes (lo de fábrica) no cumple: deja fuera el domingo y mete el viernes', () => {
    expect(faltasDeDormir({ ...bien, noches: [1, 2, 3, 4, 5] })).toContain('no son las noches antes de escuela');
  });

  it('silenciar la alarma, empezar a las 11 o dejar fuera a Mamá no cumplen; dejar pasar a Kevin tampoco', () => {
    expect(faltasDeDormir({ ...bien, silenciarAlarmas: true })).toContain('silencia la alarma');
    expect(faltasDeDormir({ ...bien, inicio: 23 * 60 })).toContain('empieza después de las 10');
    expect(faltasDeDormir({ ...bien, excepciones: [] })).toContain('Mamá no puede llamar');
    expect(faltasDeDormir({ ...bien, excepciones: ['mama', 'kevin'] })).toContain('deja pasar a alguien más');
  });

  it('contestarle a Kevin a las 11 no cumple nada, sólo cuenta lo que pasa', () => {
    abrir();
    mision1Bien();
    tocar('eq-seguir');
    aTarea();
    resolver(...TODAS);
    contestarAMama();
    tocar('eq-seguir');
    expect(id('tel-banner').getAttribute('data-canal')).toBe('kevin');
    tocar('tel-banner-abrir');
    fireEvent.change(id('chat-cuadro'), { target: { value: 'cuál tienes' } });
    tocar('chat-enviar');
    expect(historial()).toMatch(/puede esperar a que hayas dormido/);
    expect(cumplida()).toBe('no');
  });
});
