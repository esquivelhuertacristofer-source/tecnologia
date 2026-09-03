/**
 * `p-ortografia-e-imagenes` (puerto de `n3-ortografia-e-imagenes`) — recorrido
 * de punta a punta. Ocho encargos, y la clase con más piezas propias de la sala
 * después de `correspondencia`: un corrector con su diálogo, una galería de
 * imágenes, y dos controles de clase que reusan los ids de la cinta
 * (`ortografia` de Revisar e `imagen` de Insertar).
 *
 * Interesa al recorrido por una razón que ninguna otra clase de Word ofrece:
 * **dos de sus encargos se cierran con un `logro` de tipo `control`**, o sea
 * mirando el clic y no el documento. Ésa es la única rama de `evaluar` que las
 * demás clases de la sala no pisan, y es también la que más fácil se rompe al
 * cambiar el motor, porque no deja rastro que releer.
 */

import { Lab } from '@/components/activities/office/word/p-ortografia-e-imagenes/Lab';
import {
  celebrar,
  cursorAlFinalDe,
  elegir,
  encargo,
  irAPestana,
  jugar,
  jugarDesdeLaPortada,
  pulsar,
  seTermino,
  textoDelDocumento,
  vista,
} from './ayuda-word';
import { indiceDelPie } from '@/components/activities/office/word/p-ortografia-e-imagenes/imagenes';
import { TextSelection } from 'prosemirror-state';

/* ── el mando del corrector y de la galería ─────────────────────────────────*/

/** La palabra que el corrector está enseñando ahora mismo. */
const faltaEnPantalla = (): string =>
  document.querySelector('.oi-frase-mal')?.textContent ?? '';

/** Elige la sugerencia número `i` y pulsa «Cambiar». */
function corregirCon(i: number) {
  pulsar(`oi-sugerencia-${i}`);
  pulsar('oi-cambiar');
}

/* ── el pie de foto, que entra con la imagen ────────────────────────────────*/

function seleccionarElPie() {
  const v = vista();
  const i = indiceDelPie(v.state.doc);
  if (i < 0) throw new Error('todavía no hay pie de foto');
  let desde = 0;
  v.state.doc.forEach((nodo, offset, indice) => {
    if (indice === i) desde = offset;
  });
  const nodo = v.state.doc.child(i);
  v.dispatch(
    v.state.tr.setSelection(TextSelection.create(v.state.doc, desde + 1, desde + nodo.nodeSize - 1)),
  );
}

function cursorEnElPie() {
  const v = vista();
  const i = indiceDelPie(v.state.doc);
  let desde = 0;
  v.state.doc.forEach((nodo, offset, indice) => {
    if (indice === i) desde = offset;
  });
  v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, desde + 1)));
}

/* ── los ocho encargos ──────────────────────────────────────────────────────*/

function paso1() {
  irAPestana('revisar');
  pulsar('ortografia');
}

/** «musso» → «museo». La primera raya roja. */
const paso2 = () => corregirCon(0);

const paso3 = () => elegir('Dejarla como está');

/**
 * El resto de la revisión, hecho por el alumno: «Bit» se omite y las otras dos
 * se cambian. De las dos sugerencias de «anteguas» sólo la primera —«antiguas»—
 * se escribe así de verdad; la segunda está puesta a propósito para que elegirla
 * deje una falta.
 */
function paso4() {
  for (let vuelta = 0; vuelta < 6; vuelta += 1) {
    const palabra = faltaEnPantalla().toLowerCase();
    if (!palabra) break;
    if (palabra === 'bit') pulsar('oi-omitir');
    else corregirCon(0);
  }
}

function paso5() {
  cursorAlFinalDe('La maestra nos pidió esta nota');
  irAPestana('insertar');
  pulsar('imagen');
}

function paso6() {
  pulsar('oi-lamina-computadoras');
  pulsar('oi-insertar');
}

function paso7() {
  cursorEnElPie();
  irAPestana('inicio');
  pulsar('centro');
}

function paso8() {
  seleccionarElPie();
  pulsar('cursiva');
}

const PASOS = [paso1, paso2, paso3, paso4, paso5, paso6, paso7, paso8];
const hastaEl = (n: number) => jugar(PASOS.slice(0, n));

describe('p-ortografia-e-imagenes', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('la nota queda lista para el periódico, y una partida limpia saca 100', async () => {
    const partida = await jugarDesdeLaPortada(Lab);

    await jugar(PASOS);

    expect(seTermino()).toBe(true);
    const texto = textoDelDocumento();
    expect(texto).toContain('museo');
    expect(texto).toContain('antiguas');
    expect(texto).toContain('porque');
    // Y «Bit» sigue escrito como estaba: el corrector propone, el alumno decide.
    expect(texto).toContain('Bit');
    expect(texto).toContain('Las computadoras antiguas de la sala del museo.');

    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
  });

  it('encargo 6 · la imagen bonita que no viene al caso no cierra el encargo', async () => {
    await jugarDesdeLaPortada(Lab);
    await hastaEl(5);
    expect(encargo()).toBe('La imagen que ayuda');

    // JUGAR MAL · el pastel va primero en la galería justo para tender esta trampa.
    pulsar('oi-lamina-pastel');
    pulsar('oi-insertar');
    await celebrar();
    expect(encargo()).toBe('La imagen que ayuda');
    // La galería sigue abierta: salir del error no obliga a borrar la imagen.
    expect(document.querySelector('[data-grupo="galeria"]')).not.toBeNull();

    paso6();
    await celebrar();
    expect(encargo()).toBe('El pie de foto, en su sitio');
    // Y la segunda sustituyó a la primera en su sitio, sin dejar dos.
    expect(textoDelDocumento()).not.toContain('Un pastel de cumpleaños.');
  });

  it('encargo 8 · con el cursor suelto la cursiva no se aplica a nada', async () => {
    await jugarDesdeLaPortada(Lab);
    await hastaEl(7);
    expect(encargo()).toBe('Y en cursiva');

    // JUGAR MAL · el fracaso didáctico de la clase 1, repetido a propósito aquí.
    cursorEnElPie();
    pulsar('cursiva');
    await celebrar();
    expect(encargo()).toBe('Y en cursiva');

    paso8();
    await celebrar();
    expect(seTermino()).toBe(true);
  });
});
