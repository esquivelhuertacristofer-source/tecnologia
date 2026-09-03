/**
 * `n4-documento-de-varias-paginas` · «Documentos de varias páginas» (doc §26.3)
 * — recorrido de punta a punta. NUEVE encargos, los más de la sala junto con
 * `correspondencia`, y la única clase de Word cuyo estado vive FUERA del
 * documento de ProseMirror: el encabezado, el pie y el número son un estado de
 * módulo, como en Word viven en la sección y no en el cuerpo.
 *
 * Es también la clase donde se descubrió el bucle que este recorrido persigue:
 * su guion lo deja escrito —«un encargo que pida CREAR renglones vacíos seguido
 * de otro que pida BORRARLOS deja la clase en un bucle: al borrarlos, el panel
 * retrocede al encargo de crearlos. Medido: 1 de 7 otra vez y sin salida»—. Se
 * arregló poniendo el salto ANTES de borrar los enters, y la prueba de que sigue
 * arreglado es que los nueve encargos se cierran seguidos sin retroceder.
 */

import { fireEvent } from '@testing-library/react';
import { TextSelection } from 'prosemirror-state';
import { Lab } from '@/components/activities/office/word/n4-varias-paginas/Lab';
import {
  indiceDelApartado,
  saltoAntesDe,
  vaciosAntesDe,
} from '@/components/activities/office/word/n4-varias-paginas/estado';
import {
  bloques,
  celebrar,
  confirmar,
  elegir,
  encargo,
  irAPestana,
  jugar,
  jugarDesdeLaPortada,
  pulsar,
  seTermino,
  teclaEnter,
  vista,
} from './ayuda-word';

/** El apartado que tiene que empezar en hoja nueva: el tercer Título 2. */
const APARTADO = 2;

/** El cursor pegadito antes de la L de «Los cactus», que es el clic del encargo. */
function cursorAntesDelApartado() {
  const v = vista();
  const i = indiceDelApartado(v.state.doc, APARTADO);
  const desde = bloques()[i].desde;
  v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, desde + 1)));
}

/**
 * Retroceso sobre un renglón vacío.
 *
 * Se borra el nodo entero en vez de simular la tecla porque el resultado es el
 * mismo —el guion lo dice: «el último Retroceso une el renglón vacío con el
 * bloque de arriba», y el documento está armado con un párrafo delante para que
 * no deje nada detrás— y porque en jsdom un `keyDown` no llega al `handleKeyDown`
 * de ProseMirror.
 */
function borrarUnRenglonVacio(): boolean {
  const v = vista();
  const i = indiceDelApartado(v.state.doc, APARTADO);
  const todos = bloques();
  for (let k = i - 1; k >= 0; k -= 1) {
    const b = todos[k];
    if (b.tipo === 'parrafo' && b.texto.trim() === '') {
      v.dispatch(v.state.tr.delete(b.desde, b.hasta));
      return true;
    }
    if (b.tipo !== 'imagen') break;
  }
  return false;
}

const franja = (): HTMLElement =>
  document.querySelector('[aria-label="Encabezado de la hoja 1"]') as HTMLElement;

/* ── los nueve encargos ─────────────────────────────────────────────────────*/

const paso1 = () => elegir('De 3 hojas');

/** «Hazlo como lo hace todo el mundo»: cuatro enters delante del apartado. */
function paso2() {
  for (let i = 0; i < 4; i += 1) {
    cursorAntesDelApartado();
    teclaEnter();
  }
}

function paso3() {
  cursorAntesDelApartado();
  irAPestana('insertar');
  pulsar('salto');
}

function paso4() {
  while (borrarUnRenglonVacio());
}

function paso5() {
  irAPestana('insertar');
  pulsar('encabezado');
}

function paso6() {
  const caja = franja();
  caja.textContent = 'El desierto mexicano — 5° B';
  fireEvent.input(caja);
}

const paso7 = () => confirmar('Ya lo vi en las tres hojas');

function paso8() {
  irAPestana('insertar');
  pulsar('numero');
}

const paso9 = () => elegir('Se acomodan solos');

const PASOS = [paso1, paso2, paso3, paso4, paso5, paso6, paso7, paso8, paso9];
const hastaEl = (n: number) => jugar(PASOS.slice(0, n));

describe('n4-documento-de-varias-paginas', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('la clase entera se termina, y una partida limpia saca 100', async () => {
    const partida = await jugarDesdeLaPortada(Lab);

    await jugar(PASOS);

    expect(seTermino()).toBe(true);
    // El apartado empieza en hoja nueva por un salto, no por renglones vacíos.
    const doc = vista().state.doc;
    const i = indiceDelApartado(doc, APARTADO);
    expect(saltoAntesDe(doc, i)).toBe(true);
    expect(vaciosAntesDe(doc, i)).toBe(0);

    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
  });

  it('borrar los renglones vacíos NO devuelve el panel al encargo de crearlos', async () => {
    // Es el bucle que dejó escrito el guion de esta clase y el patrón que hay
    // que vigilar en toda la sala: un predicado que un encargo posterior deshace
    // está mal escrito. Aquí el encargo 2 se da por hecho también con el salto
    // puesto, así que borrar los enters no lo despaloma.
    await jugarDesdeLaPortada(Lab);
    await hastaEl(3);
    expect(encargo()).toBe('Quítale los renglones vacíos');

    paso4();
    await celebrar();
    expect(encargo()).toBe('Abre la franja de arriba');
  });

  it('el encabezado se lee del estado: borrarlo devuelve el encargo a por hacer', async () => {
    await jugarDesdeLaPortada(Lab);
    await hastaEl(6);
    expect(encargo()).toBe('Baja y compruébalo');

    // JUGAR MAL · vaciar la franja después de haberla escrito.
    const caja = franja();
    caja.textContent = '';
    fireEvent.input(caja);
    await celebrar();
    expect(encargo()).toBe('Escríbelo una sola vez');

    paso6();
    await celebrar();
    expect(encargo()).toBe('Baja y compruébalo');
  });
});
