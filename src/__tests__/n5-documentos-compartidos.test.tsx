/**
 * N5·«Mi huella digital» · parada 3 y CIERRE · «Documentos compartidos».
 * Clase prestada al bloque Office (`m365`).
 *
 * Monta la actividad DE VERDAD (Entrada → CTA → Tecnia Nube), no una copia de
 * sus datos, y usa el armazón `simuladores/nube/` tal cual: el formulario de
 * compartir, los selectores de permiso, «💾 Guardar cambios», el panel de
 * conflicto, «↩ Restaurar», «Generar/Revocar enlace» y «Quitar» son los del
 * programa. Es la PRIMERA clase montada sobre ese armazón.
 *
 * Nada de temporizadores: cada paso avanza con un clic explícito, igual que sus
 * dos hermanas de unidad.
 *
 * Lo que se cuida aquí (todo salió de jugar MAL a propósito):
 *  · Que la llave equivocada NO bloquee: se reparte de verdad, la consecuencia
 *    se ve en la hoja del cartel y el encargo sigue abierto hasta que el
 *    permiso quede en su sitio.
 *  · Que el borrón de Beto se vea en el documento (el bloque desaparece) y que
 *    «↩ Restaurar» del armazón lo devuelva sin una línea de más.
 *  · Que `resolverConflicto` del armazón repita la versión remota en el
 *    historial y que la clase la de-duplique para pintar (dos `key` iguales).
 *  · Doble clic en TODOS los botones que avanzan: los índices viven en `useRef`
 *    y el segundo clic del mismo tick se cae solo.
 *  · Que el encargo 6 (recoger las llaves) no descumpla los encargos 1 y 2: el
 *    bloque recuperado sigue en la hoja y la clase se termina igual.
 *  · Dos recorridos completos hasta `onComplete`: perfecto (100, 3 estrellas,
 *    0 errores) y con las cuatro equivocaciones (76, se termina igual).
 *  · El camino de salida a media práctica Y desde la pantalla de cierre, que ya
 *    reventó una clase de Word por faltar.
 *
 * Sin matchers de `jest-dom` (`jest.setup.ts` está fuera de `tsconfig` y
 * compilan mal aunque el test pase): el resto del proyecto usa matchers pelados
 * por el mismo motivo.
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { EntradaDocumentosCompartidos } from '@/components/activities/n5/estudio/EntradaDocumentosCompartidos';

const pulsar = (nombre: string | RegExp) => fireEvent.click(screen.getByRole('button', { name: nombre }));

/**
 * DOBLE CLIC, y lo que se midió al plantar el defecto — porque lo primero que
 * se escribió aquí era una prueba verde y hueca:
 *
 *  1. Dos `fireEvent.click` seguidos **no son el mismo tick**: Testing Library
 *     envuelve cada uno en su `act` y React vuelve a pintar en medio. Ni
 *     siquiera los dos `dispatchEvent` dentro de un mismo `act` lo son: `click`
 *     es un evento discreto y React 19 lo vacía al terminar cada despacho. Con
 *     la guarda leyendo `fase` de `useState` en vez de `faseRef`, la prueba
 *     seguía **verde**.
 *  2. Y los botones de la clase que avanzan de acto (los «Continuar») **se
 *     desmontan** con el primer clic, así que el segundo cae sobre un elemento
 *     que ya no está en el documento y nunca llega al listener de React: se
 *     quitó la guarda ENTERA y la prueba seguía verde.
 *
 * O sea que el peligro de verdad no está en esos botones, sino en los del
 * armazón que **siguen ahí después de la acción**: «💾 Guardar cambios» (sigue
 * puesto con el conflicto abierto) y «Generar enlace» (sigue puesto después de
 * generar). Ahí sí se machaca dos veces, y lo que se comprueba es que la
 * consecuencia ocurre **una sola vez** — que es lo observable, no el mecanismo.
 */
function doblePulsar(elemento: HTMLElement) {
  act(() => {
    elemento.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    elemento.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

const RES_MATERIALES = 'Beto escribió los materiales';
const RES_CONCLUSION = 'Dani escribió la conclusión';

function montarEntrada() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const utils = render(
    <EntradaDocumentosCompartidos config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />,
  );
  return { ...utils, onProgress, onScore, onComplete };
}

/** Entra a Tecnia Nube (`assetsPendientes` deja el CTA visible sin arrancar video). */
function abrirNube() {
  const utils = montarEntrada();
  pulsar(/Abre Tecnia Nube/);
  return utils;
}

function elegir(etiqueta: string, valor: string) {
  fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } });
}

/** El formulario del armazón: a quién y con qué llave. */
function compartirCon(personaId: string, permiso: string) {
  elegir('Con quién compartir', personaId);
  elegir('Con qué permiso', permiso);
  fireEvent.submit(screen.getByTestId('nube-form-compartir'));
}

/** El selector de permiso que el armazón pinta junto a cada persona. */
function cambiarLlaveDe(nombre: string, permiso: string) {
  elegir(`Permiso de ${nombre}`, permiso);
}

/** «↩ Restaurar» de la fila del historial cuyo resumen es éste. */
function restaurarLaDe(resumen: string) {
  const fila = screen.getByText(resumen).closest('li') as HTMLElement;
  fireEvent.click(fila.querySelector('button') as HTMLButtonElement);
}

const hojaTieneInvestigacion = () => screen.queryByTestId('dcp-bloque-investigacion') !== null;

/* ══════════════════════════════════════════════════════════════════════════ */

describe('n5-documentos-compartidos · la entrada', () => {
  it('respeta la plantilla de oro, habla de llaves (no de copias) y el CTA abre Tecnia Nube', () => {
    montarEntrada();
    expect(screen.getByText('Compartir no es mandar una copia')).not.toBeNull();
    expect(screen.getByText('Es una llave, no una copia')).not.toBeNull();
    expect(screen.getByText('La llave tiene tamaños')).not.toBeNull();
    expect(screen.getByText('El historial es la red')).not.toBeNull();
    expect(screen.getByText('Quitar la llave también es tu trabajo')).not.toBeNull();
    expect(screen.getByText('Abre Tecnia Nube')).not.toBeNull();
    // Cierra la unidad: la parada 3 de 3 aparece en la ruta.
    expect(screen.getByText('Documentos compartidos')).not.toBeNull();
  });
});

/*
 * `actividades-contrato.test.tsx` no puede ver esta clase hasta que el
 * coordinador la registre, así que aquí se reproduce lo que ese arnés le va a
 * hacer. Importa por el aviso de COMO-SE-CONSTRUYE.md: con
 * `assetsPendientes: true` no hay cubrepantalla, el PRIMER botón del documento
 * es el CTA y el laboratorio se monta de verdad — que es el camino por el que
 * `n5-conecta-perifericos` descubrió `matchMedia is not a function`.
 */
describe('n5-documentos-compartidos · el contrato de actividad', () => {
  it('monta, reporta progreso y puntaje en rango, y no se completa sola', () => {
    const { container, onProgress, onScore, onComplete } = montarEntrada();
    expect(container.firstChild).not.toBeNull();
    expect(onProgress).toHaveBeenCalled();
    expect(onScore).toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
    for (const [valor] of onProgress.mock.calls) {
      expect(valor).toBeGreaterThanOrEqual(0);
      expect(valor).toBeLessThanOrEqual(1);
    }
    for (const [valor] of onScore.mock.calls) {
      expect(valor).toBeGreaterThanOrEqual(0);
      expect(valor).toBeLessThanOrEqual(100);
    }
  });

  /*
   * El CTA se busca POR SU TEXTO, nunca por ser el primer `<button>` del
   * documento. Su posición depende de algo que esta prueba no controla: con
   * `assetsPendientes` la base salta el cubrepantalla y el CTA queda de
   * primero; el día que se publique `video-explicativo.mp4` el reproductor se
   * pone delante y el primer botón deja de ser el CTA. Le pasó a
   * `n5-mi-identidad-digital` el 2-sep-2026 —prueba en rojo por un cambio
   * correcto— y esta clase iba detrás en la misma tanda.
   */
  it('el CTA abre el laboratorio sin tronar y sin completarlo', () => {
    const { onComplete } = montarEntrada();
    fireEvent.click(screen.getByText(/Abre Tecnia Nube/));
    expect(screen.getByText('Encargo 1 de 6')).not.toBeNull();
    expect(onComplete).not.toHaveBeenCalled();
  });
});

describe('n5-documentos-compartidos · el programa y la hoja', () => {
  it('abre sin 3D ni cajas de texto, con el cartel sincronizado y los materiales pendientes', () => {
    abrirNube();
    expect(document.querySelector('canvas')).toBeNull();
    expect(document.querySelectorAll('input, textarea').length).toBe(0);
    expect(screen.getByTestId('nube-app')).not.toBeNull();
    expect(screen.getByTestId('dcp-hoja')).not.toBeNull();
    // El mismo y único cartel: en la lista, en el detalle y en la hoja.
    expect(screen.getAllByText('Cartel del equipo.tec').length).toBe(3);
    expect(screen.getByText('(lo va a escribir Beto)')).not.toBeNull();
    expect(hojaTieneInvestigacion()).toBe(true);
    // Nadie tiene llave todavía.
    expect(screen.queryAllByTestId('nube-acceso').length).toBe(0);
  });
});

describe('n5-documentos-compartidos · encargo 1 · la llave que no alcanza', () => {
  it('la llave chica se reparte de verdad, resta, no bloquea, y se arregla con el mismo selector del programa', () => {
    const { onScore } = abrirNube();

    compartirCon('beto', 'ver');
    // Se compartió DE VERDAD: el armazón ya lo lista.
    expect(screen.getByTestId('nube-acceso')).not.toBeNull();
    // El texto lleva negritas (`ConNegritas` lo parte en varios nodos), así que
    // se busca un trozo que viva entero en un solo nodo de texto.
    expect(screen.getByText(/Beto abrió el cartel/)).not.toBeNull();
    // Y el encargo sigue abierto: nada se saltó.
    expect(screen.getByText('Encargo 1 de 6')).not.toBeNull();
    expect((onScore.mock.calls[onScore.mock.calls.length - 1][0] as number)).toBe(94);

    cambiarLlaveDe('Beto', 'editar');
    expect(screen.getByText('Encargo 2 de 6')).not.toBeNull();
    expect(screen.getByText(/llave de este mismo cartel/)).not.toBeNull();
  });

  it('la llave correcta a la primera avanza sin restar', () => {
    const { onScore } = abrirNube();
    compartirCon('beto', 'editar');
    expect(screen.getByText('Encargo 2 de 6')).not.toBeNull();
    for (const [valor] of onScore.mock.calls) expect(valor).toBe(100);
  });
});

describe('n5-documentos-compartidos · encargo 2 · la llave del tamaño justo', () => {
  it('la llave grande a quien sólo iba a mirar rompe la fecha del cartel, y bajarla la arregla', () => {
    abrirNube();
    compartirCon('beto', 'editar');

    // El selector se quedó en «editar» del encargo anterior: ésa es la trampa.
    compartirCon('lupe', 'editar');
    expect(screen.getByTestId('dcp-hoja-fecha').textContent).toBe('viernes 2 de octub');
    expect(screen.getByText(/No es culpa suya/)).not.toBeNull();
    expect(screen.getByText('Encargo 2 de 6')).not.toBeNull();

    cambiarLlaveDe('Lupe', 'ver');
    expect(screen.getByTestId('dcp-hoja-fecha').textContent).toContain('Viernes 2 de octubre');
    expect(screen.getByText('Encargo 3 de 6')).not.toBeNull();
  });

  it('«comentar» no rompe nada pero tampoco cierra el encargo: le sobra llave', () => {
    const { onScore } = abrirNube();
    compartirCon('beto', 'editar');
    compartirCon('lupe', 'comentar');
    expect(screen.getByTestId('dcp-hoja-fecha').textContent).toContain('Viernes 2 de octubre');
    expect(screen.getByText('Encargo 2 de 6')).not.toBeNull();
    // No hubo accidente, así que no se resta.
    for (const [valor] of onScore.mock.calls) expect(valor).toBe(100);
  });
});

describe('n5-documentos-compartidos · encargo 3 · los dos a la vez', () => {
  it('los materiales de Beto aparecen solos, se ve quién está dentro, y guardar choca', () => {
    abrirNube();
    compartirCon('beto', 'editar');
    compartirCon('lupe', 'ver');

    expect(screen.queryByTestId('dcp-hoja-editores')).toBeNull();
    pulsar(/Beto se metió a escribir/);

    // El armazón lleva la coautoría y la clase la enseña en la hoja.
    expect(screen.getByTestId('dcp-hoja-editores').textContent).toContain('Beto');
    expect(screen.getByText(/Una cubeta, una regla/)).not.toBeNull();

    fireEvent.click(screen.getByTestId('nube-guardar'));
    expect(screen.getByTestId('nube-conflicto')).not.toBeNull();
    expect(screen.getByText(/se paró a preguntarte/)).not.toBeNull();
  });

  it('«conservar las dos» no resta y no deja versiones repetidas en el historial', () => {
    const { onScore } = abrirNube();
    compartirCon('beto', 'editar');
    compartirCon('lupe', 'ver');
    pulsar(/Beto se metió a escribir/);
    fireEvent.click(screen.getByTestId('nube-guardar'));

    pulsar(/Conservar las dos/);
    expect(screen.getByText(/No se perdió nada de nadie/)).not.toBeNull();
    for (const [valor] of onScore.mock.calls) expect(valor).toBe(100);

    // `resolverConflicto` del armazón vuelve a empujar la versión remota, que ya
    // estaba dentro; la clase la de-duplica para pintar. Tres versiones, no cuatro.
    const filas = screen.getAllByTestId('nube-version');
    expect(filas.length).toBe(3);
    const ids = filas.map((f) => f.getAttribute('data-version'));
    expect(new Set(ids).size).toBe(3);
  });

  it('quedarse con una sola resta, pero también resuelve y deja seguir', () => {
    const { onScore } = abrirNube();
    compartirCon('beto', 'editar');
    compartirCon('lupe', 'ver');
    pulsar(/Beto se metió a escribir/);
    fireEvent.click(screen.getByTestId('nube-guardar'));

    fireEvent.click(screen.getAllByRole('button', { name: 'Usar esta' })[0]);
    expect(screen.getByText(/no tira el trabajo de nadie/)).not.toBeNull();
    expect((onScore.mock.calls[onScore.mock.calls.length - 1][0] as number)).toBe(94);
    expect(screen.getByRole('button', { name: /Beto sigue trabajando/ })).not.toBeNull();
  });
});

describe('n5-documentos-compartidos · encargo 4 · lo que se borra se borra para todos', () => {
  it('el bloque desaparece de la hoja y «↩ Restaurar» del armazón lo devuelve', () => {
    abrirNube();
    compartirCon('beto', 'editar');
    compartirCon('lupe', 'ver');
    pulsar(/Beto se metió a escribir/);
    fireEvent.click(screen.getByTestId('nube-guardar'));
    pulsar(/Conservar las dos/);

    expect(hojaTieneInvestigacion()).toBe(true);
    pulsar(/Beto sigue trabajando/);

    // El borrón se VE en el documento, no sólo se cuenta.
    expect(hojaTieneInvestigacion()).toBe(false);
    expect(screen.getByTestId('dcp-hueco-investigacion')).not.toBeNull();
    expect(screen.getByText(/ya no está para nadie/)).not.toBeNull();

    restaurarLaDe(RES_CONCLUSION);
    expect(hojaTieneInvestigacion()).toBe(true);
    expect(screen.getByText(/Volver atrás nunca quita nada/)).not.toBeNull();
    expect(screen.getByText('Encargo 5 de 6')).not.toBeNull();
  });

  it('volver hasta la primera versión también recupera el bloque, y lo dice sin regañar ni restar', () => {
    const { onScore } = abrirNube();
    compartirCon('beto', 'editar');
    compartirCon('lupe', 'ver');
    pulsar(/Beto se metió a escribir/);
    fireEvent.click(screen.getByTestId('nube-guardar'));
    pulsar(/Conservar las dos/);
    pulsar(/Beto sigue trabajando/);

    restaurarLaDe('Dani armó el cartel');
    expect(hojaTieneInvestigacion()).toBe(true);
    expect(screen.getByText(/la que menos trabajo tira/)).not.toBeNull();
    expect(screen.getByText('Encargo 5 de 6')).not.toBeNull();
    for (const [valor] of onScore.mock.calls) expect(valor).toBe(100);
  });
});

/* ── un recorrido reutilizable hasta el encargo 5 ──────────────────────── */

function hastaElEnlace(conflicto: 'ambas' | 'una' = 'ambas') {
  compartirCon('beto', 'editar');
  compartirCon('lupe', 'ver');
  pulsar(/Beto se metió a escribir/);
  fireEvent.click(screen.getByTestId('nube-guardar'));
  if (conflicto === 'ambas') pulsar(/Conservar las dos/);
  else fireEvent.click(screen.getAllByRole('button', { name: 'Usar esta' })[0]);
  pulsar(/Beto sigue trabajando/);
  restaurarLaDe(conflicto === 'ambas' ? RES_CONCLUSION : RES_MATERIALES);
}

describe('n5-documentos-compartidos · encargo 5 · el enlace anda suelto', () => {
  it('el enlace de «ver» deja entrar a alguien de otro salón sin que toque nada, y revocar no borra que ya entró', () => {
    const { onScore } = abrirNube();
    hastaElEnlace();

    fireEvent.click(screen.getByTestId('nube-enlace-generar'));
    expect(screen.getByText(/a quien tenga el enlace/)).not.toBeNull();

    pulsar(/Le pasaste el enlace a la maestra/);
    expect(screen.getByTestId('nube-enlace-vistos').textContent).toContain('Alguien de otro salón');
    expect(screen.getByText(/No tocó ni una letra/)).not.toBeNull();
    expect(screen.getByTestId('dcp-hoja-titulo').textContent).toBe('El agua que no se ve');

    fireEvent.click(screen.getByTestId('nube-enlace-revocar'));
    // La lección: revocar apaga lo que viene, no borra lo que ya pasó.
    expect(screen.getByTestId('nube-enlace-vistos').textContent).toContain('Alguien de otro salón');
    expect(screen.getByText(/no borra lo que ya pasó/)).not.toBeNull();
    expect(screen.getByText('Encargo 6 de 6')).not.toBeNull();
    for (const [valor] of onScore.mock.calls) expect(valor).toBe(100);
  });

  it('el enlace de «editar» deja que le garabateen el título; revocarlo lo arregla y resta una vez', () => {
    const { onScore } = abrirNube();
    hastaElEnlace();

    elegir('Permiso del enlace', 'editar');
    fireEvent.click(screen.getByTestId('nube-enlace-generar'));
    pulsar(/Le pasaste el enlace a la maestra/);

    expect(screen.getByTestId('dcp-hoja-titulo').textContent).toBe('EL AgUa qUe nO se Vee jjjj');
    expect(screen.getByText(/casi siempre quiere ser de/)).not.toBeNull();
    expect((onScore.mock.calls[onScore.mock.calls.length - 1][0] as number)).toBe(94);

    fireEvent.click(screen.getByTestId('nube-enlace-revocar'));
    expect(screen.getByTestId('dcp-hoja-titulo').textContent).toBe('El agua que no se ve');
  });

  it('«Revocar» está apagado mientras no hay enlace: no se puede revocar lo que no existe', () => {
    abrirNube();
    hastaElEnlace();
    expect((screen.getByTestId('nube-enlace-revocar') as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('n5-documentos-compartidos · jugar MAL a propósito', () => {
  it('doble clic en los botones que avanzan: el segundo del mismo tick se cae solo', () => {
    const { onProgress } = abrirNube();
    compartirCon('beto', 'editar');
    compartirCon('lupe', 'ver');

    doblePulsar(screen.getByRole('button', { name: /Beto se metió a escribir/ }));
    expect(screen.getByText('Encargo 3 de 6')).not.toBeNull();
    // Una sola versión de Beto en el historial, no dos.
    expect(screen.getAllByText(RES_MATERIALES).length).toBe(1);

    // «💾 Guardar cambios» SIGUE puesto con el conflicto abierto: aquí sí se
    // machaca. Un conflicto, y la explicación dicha UNA sola vez.
    doblePulsar(screen.getByTestId('nube-guardar'));
    expect(screen.getAllByTestId('nube-conflicto').length).toBe(1);
    expect(screen.getAllByText(/se paró a preguntarte/).length).toBe(1);

    pulsar(/Conservar las dos/);
    pulsar(/Beto sigue trabajando/);
    restaurarLaDe(RES_CONCLUSION);

    // «Generar enlace» también sigue puesto después de generar.
    doblePulsar(screen.getByTestId('nube-enlace-generar'));
    expect(screen.getAllByText(/a quien tenga el enlace/).length).toBe(1);

    // El progreso nunca pasó de 1 ni retrocedió por los clics de más.
    const avances = onProgress.mock.calls.map(([v]) => v as number);
    expect(Math.max(...avances)).toBeLessThanOrEqual(1);
    expect(avances.filter((v) => v === 2 / 6).length).toBe(1);
  });

  it('el encargo 6 recoge las llaves SIN descumplir los encargos 1 y 2: el bloque recuperado sigue ahí', () => {
    abrirNube();
    hastaElEnlace();
    fireEvent.click(screen.getByTestId('nube-enlace-generar'));
    pulsar(/Le pasaste el enlace a la maestra/);
    fireEvent.click(screen.getByTestId('nube-enlace-revocar'));

    expect(screen.getAllByTestId('nube-acceso').length).toBe(2);
    pulsar('Quitar acceso a Beto');
    // Beto seguía dentro: el armazón lo dice y la clase no regaña a nadie.
    expect(screen.getByText(/avísale antes de recoger su llave/)).not.toBeNull();
    expect(screen.getByText('Encargo 6 de 6')).not.toBeNull();

    pulsar('Quitar acceso a Lupe');
    expect(screen.queryAllByTestId('nube-acceso').length).toBe(0);
    expect(screen.getByText(/Dar la llave y quitarla son la misma responsabilidad/)).not.toBeNull();
    // Lo del encargo 4 sigue en pie después del 6.
    expect(hojaTieneInvestigacion()).toBe(true);
  });

  it('el camino de salida funciona a media práctica', () => {
    abrirNube();
    compartirCon('beto', 'editar');
    pulsar('Salir');
    expect(screen.getByText('Compartir no es mandar una copia')).not.toBeNull();
  });
});

describe('n5-documentos-compartidos · recorridos completos', () => {
  it('partida perfecta: 100 puntos, 3 estrellas, 0 errores y progreso final 1', () => {
    const { onProgress, onScore, onComplete } = abrirNube();

    hastaElEnlace();
    fireEvent.click(screen.getByTestId('nube-enlace-generar'));
    pulsar(/Le pasaste el enlace a la maestra/);
    fireEvent.click(screen.getByTestId('nube-enlace-revocar'));
    pulsar('Quitar acceso a Beto');
    pulsar('Quitar acceso a Lupe');

    pulsar('Terminar');

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0]).toMatchObject({ score: 100, stars: 3, xp: 100, errores: 0 });
    expect(onProgress.mock.calls[onProgress.mock.calls.length - 1][0]).toBe(1);
    for (const [valor] of onScore.mock.calls) {
      expect(valor).toBeGreaterThanOrEqual(60);
      expect(valor).toBeLessThanOrEqual(100);
    }

    expect(screen.getByText('Insignia · Guardián de las llaves')).not.toBeNull();
    expect(screen.getByText('Compartir no es mandar una copia: es dar una llave')).not.toBeNull();
    expect(screen.getByText('Sin perder nada')).not.toBeNull();
  });

  it('jugando MAL de punta a punta: las cuatro equivocaciones y se termina igual, sin regañar', () => {
    const { onComplete } = abrirNube();

    compartirCon('beto', 'ver'); // (1) llave chica a quien va a escribir
    cambiarLlaveDe('Beto', 'editar');
    compartirCon('lupe', 'editar'); // (2) llave grande a quien sólo iba a mirar
    cambiarLlaveDe('Lupe', 'ver');

    pulsar(/Beto se metió a escribir/);
    fireEvent.click(screen.getByTestId('nube-guardar'));
    fireEvent.click(screen.getAllByRole('button', { name: 'Usar esta' })[0]); // (3) tira trabajo
    pulsar(/Beto sigue trabajando/);
    restaurarLaDe(RES_MATERIALES);

    elegir('Permiso del enlace', 'editar'); // (4) enlace público de escribir
    fireEvent.click(screen.getByTestId('nube-enlace-generar'));
    pulsar(/Le pasaste el enlace a la maestra/);
    fireEvent.click(screen.getByTestId('nube-enlace-revocar'));

    pulsar('Quitar acceso a Beto');
    pulsar('Quitar acceso a Lupe');
    pulsar('Terminar');

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0]).toMatchObject({ score: 76, stars: 3, errores: 4 });
    expect(screen.getByText('Insignia · Guardián de las llaves')).not.toBeNull();
    expect(screen.getByText('Se ajustaron')).not.toBeNull();
    expect(screen.getByText('Resuelto')).not.toBeNull();
  });

  it('el camino de salida desde la pantalla de cierre devuelve a la portada de objetivos', () => {
    abrirNube();
    hastaElEnlace();
    fireEvent.click(screen.getByTestId('nube-enlace-generar'));
    pulsar(/Le pasaste el enlace a la maestra/);
    fireEvent.click(screen.getByTestId('nube-enlace-revocar'));
    pulsar('Quitar acceso a Beto');
    pulsar('Quitar acceso a Lupe');
    pulsar('Terminar');

    pulsar('Salir');
    expect(screen.getByText('Compartir no es mandar una copia')).not.toBeNull();
  });

  it('«Jugar otra vez» deja el cartel como al principio: sin llaves, sin enlace y con los materiales pendientes', () => {
    abrirNube();
    hastaElEnlace();
    fireEvent.click(screen.getByTestId('nube-enlace-generar'));
    pulsar(/Le pasaste el enlace a la maestra/);
    fireEvent.click(screen.getByTestId('nube-enlace-revocar'));
    pulsar('Quitar acceso a Beto');
    pulsar('Quitar acceso a Lupe');
    pulsar('Terminar');

    pulsar('Jugar otra vez');
    expect(screen.getByText('Encargo 1 de 6')).not.toBeNull();
    expect(screen.queryAllByTestId('nube-acceso').length).toBe(0);
    expect(screen.getByText('(lo va a escribir Beto)')).not.toBeNull();
    expect(screen.getAllByTestId('nube-version').length).toBe(1);
  });
});
