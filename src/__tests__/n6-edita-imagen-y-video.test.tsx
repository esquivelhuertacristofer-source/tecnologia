import { createElement } from 'react';
import { act, render, renderHook, screen, fireEvent } from '@testing-library/react';
import {
  accion,
  documento as documentoDe,
  estaSano,
  hacer,
  historiaCuadra,
  nuevaHistoria,
  useDiseno,
  verificar,
  type Accion,
  type Diseno,
  type Documento,
  type Historia,
} from '@/components/simuladores/diseno';
import { GUION, DOC_INICIAL, PAGINA, LabEditaImagenYVideo } from '@/components/activities/diseno/LabEditaImagenYVideo';
import EntradaEditaImagenYVideo from '@/components/activities/diseno/EntradaEditaImagenYVideo';

/**
 * Pruebas de `n6-edita-imagen-y-video` (DISEÑO-N6-edita-imagen-y-video.md).
 * El grueso corre sin DOM, igual que `diseno-clases-n6-n8-n9.test.tsx`; el
 * recorrido de punta a punta corre con DOM de verdad porque es la única
 * forma de comprobar la trampa 2 del pliego (la cascada del guardián
 * `(documento, índice)` en `useGuionDiseno`), que es un efecto de React y no
 * se puede comprobar sólo reproduciendo acciones.
 */

function correr(base: Documento, acciones: Accion[]): Historia {
  let h = nuevaHistoria(base);
  for (const acc of acciones) {
    const r = hacer(h, acc, 'todas');
    if (r.rechazo) throw new Error(`rechazada «${acc.comando}»: ${r.rechazo}`);
    h = r.historia;
  }
  return h;
}

function comoDiseno(h: Historia): Diseno {
  return { documento: documentoDe(h), historia: h, pagina: PAGINA, seleccion: [] } as unknown as Diseno;
}

/* ── Parte 1: el guion, sin DOM, reproduciendo listas de Accion ──────────── */

describe('n6-edita-imagen-y-video · guion (sin DOM)', () => {
  test('el lienzo tal como nace no cumple ningún encargo', () => {
    const d = comoDiseno(nuevaHistoria(DOC_INICIAL));
    expect(GUION[0].comprueba(d)).toBe(false);
  });

  test('camino en orden: 1 y 2 sobre la movida, 3 la cambia, y ningún encargo se regala antes de tiempo', () => {
    const acciones: Accion[] = [
      accion('girar', { pagina: PAGINA, capa: 'foto-portada', giro: 0 }),
      accion('recortar', { pagina: PAGINA, capa: 'foto-portada', izquierda: 3 }),
      accion('nueva-imagen', { pagina: PAGINA, id: 'foto-b', recurso: 'foto-nitida', col: 2, fila: 1, cols: 11, filas: 8 }),
      accion('borrar', { pagina: PAGINA, capa: 'foto-portada' }),
      accion('recortar', { pagina: PAGINA, capa: 'foto-b', izquierda: 3 }),
    ];
    const puntos = [1, 2, 5]; // tras cuántas acciones cierra cada encargo del Acto 1
    for (let paso = 0; paso < 3; paso += 1) {
      const antes = comoDiseno(correr(DOC_INICIAL, acciones.slice(0, puntos[paso] - 1)));
      expect(GUION[paso].comprueba(antes)).toBe(false);
      const despues = comoDiseno(correr(DOC_INICIAL, acciones.slice(0, puntos[paso])));
      expect(GUION[paso].comprueba(despues)).toBe(true);
    }
  });

  test('jugar mal — hacer el encargo 3 ANTES que el 1 y el 2 no deja la clase imposible', () => {
    // El callejón sin salida nº1 del pliego: poner la nítida y borrar la
    // movida antes de tocar nada. La nítida nace con giro 0 (§ hallazgo del
    // informe: `nueva-imagen` no admite un giro de fábrica desde el panel
    // genérico), así que sólo el recorte exige trabajo — pero el encargo 1
    // exige TAMBIÉN `vecesQueUso('girar') >= 1`, así que no se regala solo.
    const cambiarMaterial: Accion[] = [
      accion('nueva-imagen', { pagina: PAGINA, id: 'foto-b', recurso: 'foto-nitida', col: 2, fila: 1, cols: 11, filas: 8 }),
      accion('borrar', { pagina: PAGINA, capa: 'foto-portada' }),
    ];
    let h = correr(DOC_INICIAL, cambiarMaterial);
    let d = comoDiseno(h);
    expect(GUION[0].comprueba(d)).toBe(false); // giro ya es 0, pero vecesQueUso('girar') es 0
    expect(GUION[1].comprueba(d)).toBe(false);
    expect(GUION[2].comprueba(d)).toBe(false); // falta el recorte

    // El alumno gira sin necesidad (accidente típico de "jugar mal") y luego endereza de verdad.
    h = hacer(h, accion('girar', { pagina: PAGINA, capa: 'foto-b', giro: 15 }), 'todas').historia;
    h = hacer(h, accion('girar', { pagina: PAGINA, capa: 'foto-b', giro: 0 }), 'todas').historia;
    d = comoDiseno(h);
    expect(GUION[0].comprueba(d)).toBe(true);
    expect(GUION[1].comprueba(d)).toBe(false); // todavía sin recortar

    h = hacer(h, accion('recortar', { pagina: PAGINA, capa: 'foto-b', izquierda: 3 }), 'todas').historia;
    d = comoDiseno(h);
    // La MISMA acción de recortar cierra 2 y 3 a la vez: ésta es la cascada
    // que el guardián (documento, índice) tiene que permitir en `useGuionDiseno`.
    expect(GUION[1].comprueba(d)).toBe(true);
    expect(GUION[2].comprueba(d)).toBe(true);
  });

  test('Acto 2: los números de fábrica cierran exactos, y ningún encargo deshace a otro', () => {
    const acciones: Accion[] = [
      accion('poner-corte', { pista: 'video', id: 't1', recurso: 'clip-entrada' }),
      accion('poner-corte', { pista: 'video', id: 't2', recurso: 'clip-volcan' }),
      accion('poner-corte', { pista: 'video', id: 't3', recurso: 'clip-aplauso' }),
      accion('recortar-corte', { pista: 'video', corte: 't1', desde: 2 }), // dura se acota sola a 4
      accion('recortar-corte', { pista: 'video', corte: 't2', dura: 4 }), // le sobraba 1
      accion('poner-corte', { pista: 'audio', id: 'ta', recurso: 'musica-feria' }),
      accion('recortar-corte', { pista: 'audio', corte: 'ta', dura: 12 }),
    ];
    const final = correr(DOC_INICIAL, acciones);
    const d = comoDiseno(final);
    expect(GUION[3].comprueba(d)).toBe(true); // poner-clips
    expect(GUION[4].comprueba(d)).toBe(true); // ordenar-clips (ya nacieron en orden)
    expect(GUION[5].comprueba(d)).toBe(true); // cortar-entrada: desde >= 2
    expect(GUION[6].comprueba(d)).toBe(true); // cuadrar-doce: 4+4+4=12
    expect(GUION[7].comprueba(d)).toBe(true); // poner-musica: descuadre === 0
    expect(estaSano(verificar(documentoDe(final)))).toBe(true);
    expect(historiaCuadra(final)).toBe(true);
  });

  test('jugar mal — borrar la única imagen del lienzo no revienta, y con el lienzo vacío ningún encargo cierra', () => {
    const h = correr(DOC_INICIAL, [accion('borrar', { pagina: PAGINA, capa: 'foto-portada' })]);
    const d = comoDiseno(h);
    expect(GUION[0].comprueba(d)).toBe(false);
    expect(GUION[1].comprueba(d)).toBe(false);
    expect(GUION[2].comprueba(d)).toBe(false);
    expect(estaSano(verificar(documentoDe(h)))).toBe(true); // ningún «fuera»/«perdida»: sólo no hay nada que arreglar
    // Se puede volver a poner la nítida desde el banco y seguir la clase.
    const h2 = hacer(h, accion('nueva-imagen', { pagina: PAGINA, id: 'foto-c', recurso: 'foto-nitida', col: 2, fila: 1, cols: 11, filas: 8 }), 'todas').historia;
    expect(documentoDe(h2).paginas[0].capas).toHaveLength(1);
  });
});

/* ── Parte 2: el cabezal (useDiseno), aislado de la clase ─────────────────── */

describe('el cabezal de la cinta (useDiseno)', () => {
  const DOC_CON_CINTA: Documento = {
    ...DOC_INICIAL,
    cinta: [
      { id: 'video', tipo: 'video', nombre: 'Video', cortes: [{ id: 'c1', recurso: 'clip-entrada', desde: 0, dura: 3 }] },
      { id: 'audio', tipo: 'audio', nombre: 'Música', cortes: [] },
    ],
  };

  test('reproducir cien veces crea UN solo intervalo, el segundo avanza y se para sola al final', () => {
    jest.useFakeTimers();
    const setIntervalSpy = jest.spyOn(window, 'setInterval');
    const { result, unmount } = renderHook(() => useDiseno({ documento: DOC_CON_CINTA, herramientas: 'todas' }));
    act(() => {
      for (let i = 0; i < 100; i += 1) result.current.reproducir();
    });
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    act(() => jest.advanceTimersByTime(1000));
    expect(result.current.segundo).toBe(1);
    act(() => jest.advanceTimersByTime(2000));
    expect(result.current.segundo).toBe(3); // duracionTotal === 3
    expect(result.current.reproduciendo).toBe(false); // se paró sola, nadie llamó a pausar()
    act(() => jest.advanceTimersByTime(5000)); // más tics no lo pasan de 3
    expect(result.current.segundo).toBe(3);
    unmount();
    jest.useRealTimers();
  });

  test('salir a media reproducción limpia el intervalo (no revienta ni sigue corriendo)', () => {
    jest.useFakeTimers();
    const clearIntervalSpy = jest.spyOn(window, 'clearInterval');
    const { result, unmount } = renderHook(() => useDiseno({ documento: DOC_CON_CINTA, herramientas: 'todas' }));
    act(() => result.current.reproducir());
    act(() => jest.advanceTimersByTime(1000));
    expect(result.current.segundo).toBe(1);
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
    jest.useRealTimers();
  });

  test('irASegundo se acota entre 0 y la duración total', () => {
    const { result } = renderHook(() => useDiseno({ documento: DOC_CON_CINTA, herramientas: 'todas' }));
    act(() => result.current.irASegundo(999));
    expect(result.current.segundo).toBe(3);
    act(() => result.current.irASegundo(-50));
    expect(result.current.segundo).toBe(0);
  });
});

/* ── Parte 3: el recorrido de punta a punta, con DOM de verdad ────────────── */

function propsDeLab() {
  return {
    config: {},
    savedState: undefined,
    onSaveState: jest.fn(),
    onProgress: jest.fn(),
    onScore: jest.fn(),
    onComplete: jest.fn(),
    alSalir: jest.fn(),
  };
}

const click = (selector: string) => {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`no se encontró ${selector}`);
  fireEvent.click(el);
};

const seleccionarCapa = (id: string) => click(`[data-capa-fila="${id}"]`);
const seleccionarHerramienta = (h: string) => click(`[data-herramienta="${h}"]`);

describe('recorrido de punta a punta: el camino en orden', () => {
  test('se puede terminar, la partida perfecta saca 100 y 3 estrellas, y el camino de salida funciona', () => {
    const props = propsDeLab();
    render(createElement(LabEditaImagenYVideo, props));
    click('[data-testid="psn-empezar"]');

    // El camino de salida a MEDIA práctica: el botón «Salir» de la cabecera.
    expect(document.querySelector('.letrero-salida')).not.toBeNull();
    fireEvent.click(document.querySelector('.letrero-salida')!);
    expect(props.alSalir).toHaveBeenCalledTimes(1);

    // ── Acto 1 · la foto de portada ──
    seleccionarCapa('foto-portada');
    seleccionarHerramienta('giro');
    click('[data-giro="mas15"]'); // 345 -> 0: encargo 1
    expect(screen.getByTestId('dsg-tarjeta').getAttribute('data-paso')).toBe('encuadrar');

    seleccionarHerramienta('recorte');
    click('[data-recorte="izquierda-mas"]');
    click('[data-recorte="izquierda-mas"]');
    click('[data-recorte="izquierda-mas"]'); // izquierda: 3, encargo 2
    expect(screen.getByTestId('dsg-tarjeta').getAttribute('data-paso')).toBe('cambiar-material');

    seleccionarHerramienta('imagen');
    click('[data-recurso="foto-nitida"]'); // nace como "i1"
    seleccionarHerramienta('borrar');
    click('[data-accion="borrar"]'); // borra foto-portada, que era la seleccionada

    seleccionarCapa('i1');
    seleccionarHerramienta('recorte');
    click('[data-recorte="izquierda-mas"]');
    click('[data-recorte="izquierda-mas"]');
    click('[data-recorte="izquierda-mas"]'); // izquierda: 3, encargo 3 — ya no hay giro que rehacer (giro nace en 0)
    expect(screen.getByTestId('dsg-tarjeta').getAttribute('data-paso')).toBe('poner-clips');

    // La cinta se abrió sola al entrar al Acto 2, y sin cortes el monitor no
    // pinta nada (riesgo nº 2 del pliego: que sea un diagrama, no un video).
    expect(screen.getByTestId('lnt-cinta')).toBeInTheDocument();
    expect(document.querySelector('[data-monitor]')).toBeNull();

    // ── Acto 2 · el montaje: se ponen los tres clips EN DESORDEN a propósito,
    //    para exigir de verdad el paso «ordenar-clips» con mover-corte. ──
    seleccionarHerramienta('cinta');
    click('[data-clip="clip-aplauso"]'); // t2
    click('[data-clip="clip-entrada"]'); // t3
    click('[data-clip="clip-volcan"]'); // t4, encargo 4 (tres clips)
    // Con el orden equivocado, no hereda gratis el encargo 5.
    expect(screen.getByTestId('dsg-tarjeta').getAttribute('data-paso')).toBe('ordenar-clips');

    // El monitor: en el segundo 0 se ve el PRIMER corte de la pista de video
    // (el aplauso, porque todavía está en desorden) — el lienzo enseña de
    // verdad lo que toca en el cabezal, no un diagrama de bloques.
    expect(document.querySelector('[data-monitor]')?.getAttribute('data-monitor')).toBe('t2');
    // Los tres suman 4+6+5=15 s todavía (nada recortado): en el 15 ya no hay nada.
    click('[data-segundo="15"]');
    expect(document.querySelector('[data-monitor]')).toBeNull();
    click('[data-segundo="0"]'); // vuelve al principio para seguir el guion

    click('[data-corte="t2"]'); // selecciona el aplauso, que está primero
    click('[data-accion="mover-adelante"]'); // sitio 0 -> 1
    click('[data-accion="mover-adelante"]'); // sitio 1 -> 2: entrada, volcán, aplauso
    expect(screen.getByTestId('dsg-tarjeta').getAttribute('data-paso')).toBe('cortar-entrada');

    click('[data-corte="t3"]'); // la entrada
    click('[data-accion="empezar-despues"]');
    click('[data-accion="empezar-despues"]'); // desde: 2, encargo 6
    expect(screen.getByTestId('dsg-tarjeta').getAttribute('data-paso')).toBe('cuadrar-doce');

    click('[data-corte="t4"]'); // el volcán
    click('[data-accion="menos-1s"]'); // dura: 4, total 12, encargo 7
    expect(screen.getByTestId('dsg-tarjeta').getAttribute('data-paso')).toBe('poner-musica');

    seleccionarHerramienta('cinta');
    click('[data-clip="musica-feria"]'); // t5, 15 s en la pista de audio
    click('[data-corte="t5"]');
    click('[data-accion="menos-1s"]');
    click('[data-accion="menos-1s"]');
    click('[data-accion="menos-1s"]'); // dura: 12, descuadre 0, encargo 8

    // ── el cierre ──
    expect(screen.getByText('¡Tu video está montado!')).toBeInTheDocument();
    expect(screen.getByText(/Montador de video/)).toBeInTheDocument();
    expect(props.onComplete).toHaveBeenCalledTimes(1);
    const resultado = props.onComplete.mock.calls[0][0];
    expect(resultado.score).toBe(100);
    expect(resultado.stars).toBe(3);
    expect(typeof resultado.tiempoSegundos).toBe('number');

    // «Segundos de video» y «Cortes hechos» del resumen de cierre.
    const resumen = document.querySelector('.final-resumen') as HTMLElement;
    expect(resumen.textContent).toMatch(/Segundos de video12/);
    // 2 (empezar-despues) + 1 (menos-1s volcán) + 3 (menos-1s música) = 6 recortes de corte.
    expect(resumen.textContent).toMatch(/Cortes hechos6/);

    // El camino de salida DESDE la pantalla de cierre.
    click('.boton-arcade--fantasma');
    expect(props.alSalir).toHaveBeenCalledTimes(2);
  });
});

describe('recorrido de punta a punta: jugar mal el Acto 1 (encargo 3 antes que 1 y 2)', () => {
  test('la clase se termina igual, con la cascada cerrando dos encargos de un solo clic', () => {
    const props = propsDeLab();
    render(createElement(LabEditaImagenYVideo, props));
    click('[data-testid="psn-empezar"]');

    seleccionarHerramienta('imagen');
    click('[data-recurso="foto-nitida"]'); // i1, nace derecha (giro 0) y sin recortar
    seleccionarCapa('foto-portada');
    seleccionarHerramienta('borrar');
    click('[data-accion="borrar"]'); // se queda sólo la nítida

    // Ni el 1 ni el 2 ni el 3 se regalan: falta `vecesQueUso('girar')` y el recorte.
    expect(screen.getByTestId('dsg-tarjeta').getAttribute('data-paso')).toBe('enderezar');

    seleccionarCapa('i1');
    seleccionarHerramienta('giro');
    click('[data-giro="mas15"]'); // se pasa (jugar mal): 0 -> 15
    click('[data-giro="menos15"]'); // corrige: 15 -> 0, y ya usó «girar» dos veces
    expect(screen.getByTestId('dsg-tarjeta').getAttribute('data-paso')).toBe('encuadrar');

    seleccionarHerramienta('recorte');
    click('[data-recorte="izquierda-mas"]');
    click('[data-recorte="izquierda-mas"]');
    click('[data-recorte="izquierda-mas"]');
    // La MISMA acción cierra «encuadrar» Y «cambiar-material» de un tirón:
    // la cascada del guardián (documento, índice) en acción real.
    expect(screen.getByTestId('dsg-tarjeta').getAttribute('data-paso')).toBe('poner-clips');

    // `i1` ya gastó el primer id de `nuevoId`: los tres clips nacen t2, t3, t4.
    seleccionarHerramienta('cinta');
    click('[data-clip="clip-entrada"]'); // t2
    click('[data-clip="clip-volcan"]'); // t3
    click('[data-clip="clip-aplauso"]'); // t4, ya en orden: encargos 4 y 5 en cascada
    expect(screen.getByTestId('dsg-tarjeta').getAttribute('data-paso')).toBe('cortar-entrada');

    click('[data-corte="t2"]'); // la entrada
    click('[data-accion="empezar-despues"]');
    click('[data-accion="empezar-despues"]'); // desde: 2
    expect(screen.getByTestId('dsg-tarjeta').getAttribute('data-paso')).toBe('cuadrar-doce');

    click('[data-corte="t3"]'); // el volcán
    click('[data-accion="menos-1s"]'); // dura: 4, total 12
    expect(screen.getByTestId('dsg-tarjeta').getAttribute('data-paso')).toBe('poner-musica');

    seleccionarHerramienta('cinta');
    click('[data-clip="musica-feria"]');
    click('[data-corte="t5"]');
    click('[data-accion="menos-1s"]');
    click('[data-accion="menos-1s"]');
    click('[data-accion="menos-1s"]');

    expect(screen.getByText('¡Tu video está montado!')).toBeInTheDocument();
    const resultado = props.onComplete.mock.calls[0][0];
    expect(resultado.score).toBe(100);
    expect(resultado.stars).toBe(3);
  });
});

describe('recorrido de entrada al editor', () => {
  test('n6-edita-imagen-y-video abre el laboratorio y pinta el lienzo', async () => {
    const props = propsDeLab();
    render(createElement(EntradaEditaImagenYVideo, props));
    // `assetsPendientes: true` quita el cubrepantalla: el CTA es el primer botón.
    fireEvent.click(screen.getByText('Abre el editor'));
    const empezar = await screen.findByTestId('psn-empezar');
    fireEvent.click(empezar);
    expect(await screen.findByTestId('dis-ventana')).toBeInTheDocument();
  });
});
