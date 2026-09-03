/**
 * `of-word-revisa-y-comenta` · «Revisa y comenta» — recorrido de punta a punta.
 * Ocho encargos, cinco controles propios y un panel de revisión acoplado.
 *
 * Es la clase que más cosas guarda FUERA del documento —el corrector encendido o
 * apagado, el control de cambios, los globos de comentario— y a la vez la que más
 * se corrige leyendo el documento: siete de sus ocho encargos preguntan por
 * marcas del esquema. Esa mezcla es la que la hacía sospechosa.
 *
 * ── LO QUE ENCONTRÓ EL RECORRIDO ────────────────────────────────────────────
 *
 * **Se termina, y la partida limpia saca 100.** La cadena de encargos aguanta
 * porque aceptar y rechazar quitan las marcas EXACTAS de la revisión y no todo el
 * resaltado del rango: si se llevaran el resaltado entero, el comentario del
 * encargo 4 se iría con ellas y el motor devolvería al alumno tres encargos atrás
 * en el último gesto de la clase. Está escrito en `resolverCambio` y aquí queda
 * medido.
 *
 * **Teclear en una prueba no es teclear.** El encargo 6 sólo se cumple si lo que
 * se escribe pasa por `handleTextInput`, que es donde el control de cambios pone
 * el color y el subrayado del autor. Un `insertText` a pelo —lo que hace
 * `escribir()` del mando a distancia— mete el texto en negro y el encargo no se
 * cierra nunca. De ahí el `teclear()` local de este archivo.
 */

import { fireEvent } from '@testing-library/react';
import { Lab } from '@/components/activities/office/word/revisa-y-comenta/Lab';
import {
  boton,
  celebrar,
  cursorAlFinalDe,
  cursorAntesDe,
  cursorEn,
  encargo,
  irAPestana,
  jugar,
  jugarDesdeLaPortada,
  pulsar,
  reemplazarTrozo,
  seleccionar,
  seTermino,
  textoDelDocumento,
  vista,
} from './ayuda-word';

/**
 * Teclear DE VERDAD, pasando por donde pasa una tecla del alumno.
 *
 * `escribir()` del mando a distancia despacha un `insertText`, que es lo que
 * hace falta para casi todo. Aquí no vale: el control de cambios de esta clase
 * se engancha en `handleTextInput` con `setProps`, así que un `insertText`
 * directo se lo salta y el texto entra en negro, sin color de autor y sin
 * subrayado. Éste es el mismo camino que recorre ProseMirror ante una tecla:
 * ofrecer el texto a los manejadores y, si nadie lo quiere, insertarlo.
 */
function teclear(texto: string) {
  const v = vista();
  const { from, to } = v.state.selection;
  // El quinto argumento es la transacción de reserva que ProseMirror le ofrece
  // al manejador por si decide no atender la tecla. Aquí nadie la usa, pero se
  // pasa igual: es la firma real, y llamar de menos sería llamar a otra cosa.
  const atendido = v.someProp('handleTextInput', (f) =>
    f(v, from, to, texto, () => v.state.tr.insertText(texto, from, to)),
  );
  if (!atendido) v.dispatch(v.state.tr.insertText(texto, from, to));
}

/* ── el panel de revisión, que es de la clase y no de la cinta ──────────────*/

/** Un botón del panel, por lo que dice. */
function botonDelPanel(texto: string): HTMLElement | null {
  return (
    Array.from(document.querySelectorAll<HTMLElement>('.rc-panel button')).find(
      (b) => (b.textContent ?? '').trim() === texto,
    ) ?? null
  );
}

/** Pulsa «Cambiar» tantas veces como faltas queden. Es lo que hace el alumno. */
function arreglarLoSubrayado() {
  for (let i = 0; i < 20; i += 1) {
    const cambiar = document.querySelector<HTMLElement>('.rc-falta-ficha .rc-boton');
    if (!cambiar) return;
    fireEvent.click(cambiar);
  }
  throw new Error('el corrector no se queda nunca sin faltas');
}

/** Cuántas palabras sigue subrayando el corrector. */
const faltasEnPantalla = (): number => document.querySelectorAll('.rc-falta-ficha').length;

/** Los globos del panel: el del maestro y los que ponga el alumno. */
const globos = (): number => document.querySelectorAll('.rc-globo').length;

/** Los cambios que el panel enseña sin resolver, con su texto. */
const cambiosPendientes = (): string[] =>
  Array.from(document.querySelectorAll<HTMLElement>('.rc-cambio-texto')).map((c) => (c.textContent ?? '').trim());

/** La ficha del panel que habla de ese trozo, para decidir sobre ÉSE y no otro. */
function fichaDelCambio(trozo: string): HTMLElement {
  const fichas = Array.from(document.querySelectorAll<HTMLElement>('.rc-cambio'));
  const cual = fichas.find((f) => (f.querySelector('.rc-cambio-texto')?.textContent ?? '').includes(trozo));
  if (!cual) throw new Error(`el panel no enseña ningún cambio con «${trozo}»`);
  return cual;
}

/* ── los ocho encargos, como los haría un alumno que atiende ─────────────────*/

function paso1() {
  irAPestana('revisar');
  pulsar('ortografia');
}

const paso2 = () => arreglarLoSubrayado();

/** Encargo 3 · la falta que el corrector no puede ver, porque «tubo» existe. */
const paso3 = () => reemplazarTrozo('Las lechugas se vendieron', 'tubo', 'tuvo');

/** Encargo 4 · preguntar sin tocarle una letra al texto de otra persona. */
function paso4() {
  seleccionar('El grupo de quinto');
  pulsar('comentario');
  const cuadro = document.querySelector<HTMLTextAreaElement>('.rc-globo-cuadro');
  if (!cuadro) throw new Error('el globo del comentario no se abrió');
  fireEvent.change(cuadro, { target: { value: '¿Qué les contestaron? Sin eso el párrafo queda a medias.' } });
  fireEvent.click(botonDelPanel('Comentar') as HTMLElement);
}

const paso5 = () => pulsar('control-cambios');

/** Encargo 6 · dos palabras escritas con el control puesto: salen de tu color. */
function paso6() {
  cursorAlFinalDe('Nota de Ana Sofía Cruz');
  teclear(' Revisó: Cristofer');
}

/** Encargo 7 · aceptar lo que ayuda: la frase que dice dónde está el huerto. */
function paso7() {
  cursorAntesDe('El lunes cortamos', ', el que está detrás');
  pulsar('aceptar');
}

/** Encargo 8 · rechazar lo que hace falta: el renglón que pide ayuda para regar. */
function paso8() {
  cursorEn('Si quieres ayudar a regar');
  pulsar('rechazar');
}

const PASOS = [paso1, paso2, paso3, paso4, paso5, paso6, paso7, paso8];
const hastaEl = (n: number) => jugar(PASOS.slice(0, n));

describe('of-word-revisa-y-comenta', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.useFakeTimers({ advanceTimers: true });
  });
  afterEach(() => jest.useRealTimers());

  it('la clase entera se termina, y una partida limpia saca 100', async () => {
    const partida = await jugarDesdeLaPortada(Lab);

    await jugar(PASOS);

    expect(seTermino()).toBe(true);

    // La nota quedó como pedía cada encargo, y sin perder nada por el camino.
    expect(faltasEnPantalla()).toBe(0);
    expect(textoDelDocumento()).toContain('lo tuvo que guardar');
    expect(textoDelDocumento()).not.toContain('lo tubo que guardar');
    // El comentario del encargo 4 sigue ahí después de aceptar y rechazar: las
    // dos operaciones quitan las marcas exactas de la revisión y no el resaltado
    // entero, que es lo que impide que el último gesto tire el encargo 4.
    expect(globos()).toBe(2);
    // No queda ni una propuesta del maestro sin resolver, y la del alumno sigue
    // marcada: el encargo 8 dice literalmente «el tuyo, el verde, déjalo».
    expect(cambiosPendientes()).toEqual(['« Revisó: Cristofer»']);
    // Lo que se acepta se queda; lo que se rechaza, también, porque era un borrado.
    expect(textoDelDocumento()).toContain('detrás de la cancha');
    expect(textoDelDocumento()).toContain('apúntate en la lista');

    expect(partida.onComplete).toHaveBeenCalledTimes(1);
    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
  });

  it('encargo 5 · volver a pulsar el control de cambios lo APAGA, y el encargo se vuelve a abrir', async () => {
    await jugarDesdeLaPortada(Lab);
    await hastaEl(5);
    expect(encargo()).toBe('Que se vea que fuiste tú');
    expect(boton('control-cambios').className).toContain('es-activo');

    // JUGAR MAL · el alumno que no se fía y lo pulsa «por si acaso»: lo apaga, y
    // el encargo 5 vuelve a estar por hacer. Es el efecto que `guionPara` busca:
    // un interruptor no se aprende pulsándolo, se aprende dejándolo puesto.
    pulsar('control-cambios');
    await celebrar();
    expect(encargo()).toBe('Enciende el control de cambios');
    expect(boton('control-cambios').className).not.toContain('es-activo');

    // Encenderlo otra vez lo devuelve al sitio donde estaba.
    paso5();
    await celebrar();
    expect(encargo()).toBe('Que se vea que fuiste tú');
  });

  it('encargo 7 · rechazar desde el panel lo que había que aceptar borra la frase, y el propio panel la devuelve', async () => {
    await jugarDesdeLaPortada(Lab);
    await hastaEl(6);
    expect(encargo()).toBe('Acepta lo que ayuda');

    // JUGAR MAL · el botón «Rechazar» del panel, que NO pasa por el desvío de la
    // ventana —no es un control de la cinta— y por eso se lleva la frase entera.
    const rechazar = Array.from(
      fichaDelCambio('detrás de la cancha').querySelectorAll<HTMLElement>('.rc-boton'),
    ).find((b) => (b.textContent ?? '').trim() === 'Rechazar');
    fireEvent.click(rechazar as HTMLElement);
    await celebrar();
    expect(textoDelDocumento()).not.toContain('detrás de la cancha');
    expect(encargo()).toBe('Acepta lo que ayuda');

    // La salida está en el propio panel: dice qué acaba de hacer y la devuelve.
    // Sin este recado, el encargo 7 quedaba imposible para siempre.
    fireEvent.click(document.querySelector('.rc-hecho-deshacer') as HTMLElement);
    await celebrar();
    expect(textoDelDocumento()).toContain('detrás de la cancha');

    paso7();
    await celebrar();
    expect(encargo()).toBe('Rechaza lo que hace falta');
  });
});
