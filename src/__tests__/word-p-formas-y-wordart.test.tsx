/**
 * `p-formas-y-wordart` (puerto de `n3-formas-y-wordart`) — recorrido de punta a
 * punta. NUEVE encargos, los más de la sala junto con `n4-varias-paginas`, y la
 * única clase de Word donde el alumno **selecciona un objeto** y le da formato:
 * el ajuste del texto y el tamaño actúan sobre una `NodeSelection`, no sobre
 * letras.
 *
 * Eso la pone en el sitio exacto donde el motor tiene su tercer estado —el
 * botón que se ve, se lee y no responde—: los cuatro controles de Formato son
 * `inerte` mientras no haya imagen seleccionada. El motor promete que un botón
 * apagado **no cobra un tropiezo ni delata el encargo**, y ésta es la clase que
 * lo prueba con las manos.
 */

import { NodeSelection } from 'prosemirror-state';
import { Lab } from '@/components/activities/office/word/p-formas-y-wordart/Lab';
import {
  fotoConTextoAlrededor,
  fotoEnSuTamano,
  fotoJuntoAlDato,
  formaQueMarcaElDato,
} from '@/components/activities/office/word/p-formas-y-wordart/documento';
import { ALT_ZORRO } from '@/components/activities/office/word/p-formas-y-wordart/piezas';
import {
  bloques,
  celebrar,
  cursorEn,
  elegir,
  encargo,
  irAPestana,
  jugar,
  jugarDesdeLaPortada,
  pulsar,
  seTermino,
  vista,
} from './ayuda-word';

const RENGLON_DEL_ZORRO = 'El zorro del desierto sale de noche';

/** Un clic encima de la foto: la selecciona con su marco azul y sus tiradores. */
function seleccionarLaFoto() {
  const v = vista();
  let pos = -1;
  v.state.doc.forEach((nodo, offset) => {
    if (pos < 0 && nodo.type.name === 'imagen' && nodo.attrs.alt === ALT_ZORRO) pos = offset;
  });
  if (pos < 0) throw new Error('todavía no hay foto del zorro en la hoja');
  v.dispatch(v.state.tr.setSelection(NodeSelection.create(v.state.doc, pos)));
}

/* ── los nueve encargos ─────────────────────────────────────────────────────*/

function paso1() {
  cursorEn('Los animales del desierto');
  irAPestana('insertar');
  pulsar('wordart');
}

function paso2() {
  irAPestana('vista');
  pulsar('una-pagina');
}

const paso3 = () => elegir('El globo');

function paso4() {
  cursorEn(RENGLON_DEL_ZORRO);
  irAPestana('insertar');
  pulsar('forma-flecha');
}

const paso5 = () => elegir('El zorro del desierto');

function paso6() {
  cursorEn(RENGLON_DEL_ZORRO);
  irAPestana('insertar');
  pulsar('foto-zorro');
}

function paso7() {
  seleccionarLaFoto();
  irAPestana('disposicion');
  pulsar('ajuste-cuadrado');
}

function paso8() {
  seleccionarLaFoto();
  irAPestana('disposicion');
  pulsar('tamano-mas');
}

const paso9 = paso2;

const PASOS = [paso1, paso2, paso3, paso4, paso5, paso6, paso7, paso8, paso9];
const hastaEl = (n: number) => jugar(PASOS.slice(0, n));

describe('p-formas-y-wordart', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('el folleto queda ilustrado entero y una partida limpia saca 100', async () => {
    const partida = await jugarDesdeLaPortada(Lab);

    await jugar(PASOS);

    expect(seTermino()).toBe(true);
    const doc = vista().state.doc;
    expect(bloques()[0].tipo).toBe('titular');
    expect(formaQueMarcaElDato(doc)).toBe(true);
    expect(fotoJuntoAlDato(doc)).not.toBeNull();
    expect(fotoConTextoAlrededor(doc)).toBe(true);
    expect(fotoEnSuTamano(doc)).toBe(true);

    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
  });

  it('encargo 7 · sin foto seleccionada los botones de Formato están apagados y no cobran', async () => {
    const partida = await jugarDesdeLaPortada(Lab);
    await hastaEl(6);
    expect(encargo()).toBe('Que el texto la rodee');

    // JUGAR MAL · pulsar el botón bueno sin haber seleccionado la foto. Es
    // exactamente lo que dice la pista del encargo, y el motor promete que un
    // botón apagado no castiga: «poner el dedo en un botón muerto le resolvía
    // el encargo al alumno sin que hubiera buscado nada, y encima le bajaba la
    // nota por hacerlo».
    cursorEn(RENGLON_DEL_ZORRO);
    irAPestana('disposicion');
    pulsar('ajuste-cuadrado');
    await celebrar();
    expect(encargo()).toBe('Que el texto la rodee');
    expect(fotoConTextoAlrededor(vista().state.doc)).toBe(false);

    await jugar(PASOS.slice(6));
    expect(seTermino()).toBe(true);
    // Y la nota sigue siendo perfecta: el botón apagado no cobró nada.
    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
  });

  it('encargo 8 · «Más ancha» deforma al zorro, y ése es el único que no se perdona', async () => {
    await jugarDesdeLaPortada(Lab);
    await hastaEl(7);
    expect(encargo()).toBe('Del tamaño justo, y sin deformar');

    // JUGAR MAL · la trampa del día: el botón de al lado estira sólo a lo ancho.
    seleccionarLaFoto();
    irAPestana('disposicion');
    pulsar('tamano-ancho');
    await celebrar();
    expect(encargo()).toBe('Del tamaño justo, y sin deformar');
    expect(fotoEnSuTamano(vista().state.doc)).toBe(false);
  });
});
