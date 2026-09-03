/**
 * `p-tablas-y-columnas` (puerto de `n4-tablas-y-columnas`, §26.1) — recorrido de
 * punta a punta.
 *
 * Es la única clase de Word que mete al alumno DENTRO de una tabla: escribe en
 * celdas, pone negrita sobre una fila entera y luego reparte en columnas un
 * párrafo que está fuera. Eso la vuelve el mejor sitio de la sala para probar
 * dos cosas que ningún recorrido había pisado: que `leerBloques` y compañía
 * siguen encontrando el trabajo cuando está a dos niveles de profundidad, y que
 * un control de clase con estado en un plugin —el reparto en columnas, que NO
 * viaja en el historial— se corrige leyendo el estado vivo y no el clic.
 */

import { TextSelection } from 'prosemirror-state';
import { Lab } from '@/components/activities/office/word/p-tablas-y-columnas/Lab';
import { columnasDelParrafoLargo } from '@/components/activities/office/word/p-tablas-y-columnas/controles';
import {
  bloques,
  celebrar,
  cursorAlFinalDe,
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

/* ── el mando de la tabla, que el mando general no trae ─────────────────────*/

/** La tabla del folleto, con su posición de primer nivel. */
function laTabla() {
  const b = bloques().find((x) => x.tipo === 'tabla');
  if (!b) throw new Error('todavía no hay tabla en el documento');
  return { ...b, nodo: vista().state.doc.child(b.i) };
}

/** Dónde empieza el texto de la celda (fila, columna). */
function dentroDeLaCelda(fila: number, columna: number): number {
  const t = laTabla();
  let pos = t.desde + 1;
  for (let f = 0; f < fila; f += 1) pos += t.nodo.child(f).nodeSize;
  const nodoFila = t.nodo.child(fila);
  let p = pos + 1;
  for (let c = 0; c < columna; c += 1) p += nodoFila.child(c).nodeSize;
  // celda → párrafo → dentro del párrafo
  return p + 2;
}

function escribirEnCelda(fila: number, columna: number, texto: string) {
  const v = vista();
  const donde = dentroDeLaCelda(fila, columna);
  v.dispatch(v.state.tr.insertText(texto, donde, donde));
}

/** Arrastrar el ratón por encima de los tres nombres de una fila. */
function seleccionarLaFila(fila: number) {
  const v = vista();
  const t = laTabla();
  const nodoFila = t.nodo.child(fila);
  const desde = dentroDeLaCelda(fila, 0);
  const hasta = dentroDeLaCelda(fila, nodoFila.childCount - 1) + nodoFila.child(nodoFila.childCount - 1).textContent.length;
  v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, desde, hasta)));
}

/* ── los siete encargos ─────────────────────────────────────────────────────*/

function paso1() {
  cursorAlFinalDe('Así viven dos de los animales');
  irAPestana('insertar');
  pulsar('tabla');
}

const paso2 = () => elegir('Bonito');

function paso3() {
  escribirEnCelda(0, 0, 'Animal');
  escribirEnCelda(0, 1, 'Come');
  escribirEnCelda(0, 2, 'Sale');
}

function paso4() {
  seleccionarLaFila(0);
  irAPestana('inicio');
  pulsar('negrita');
}

function paso5() {
  escribirEnCelda(1, 0, 'Zorro del desierto');
  escribirEnCelda(1, 1, 'insectos');
  escribirEnCelda(1, 2, 'de noche');
  escribirEnCelda(2, 0, 'Camello');
  escribirEnCelda(2, 1, 'plantas secas');
  escribirEnCelda(2, 2, 'de día');
}

function paso6() {
  cursorEn('En el desierto casi nunca llueve');
  irAPestana('disposicion');
  pulsar('columnas-2');
}

const paso7 = () => elegir('Un cuento de dos páginas');

const PASOS = [paso1, paso2, paso3, paso4, paso5, paso6, paso7];
const hastaEl = (n: number) => jugar(PASOS.slice(0, n));

describe('p-tablas-y-columnas', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('el folleto queda armado entero y una partida limpia saca 100', async () => {
    const partida = await jugarDesdeLaPortada(Lab);

    await jugar(PASOS);

    expect(seTermino()).toBe(true);
    expect(laTabla().texto).toContain('Camello');
    expect(columnasDelParrafoLargo()).toBe(2);

    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
  });

  it('encargo 5 · un dato en la columna que no es deja el encargo abierto', async () => {
    await jugarDesdeLaPortada(Lab);
    await hastaEl(4);
    expect(encargo()).toBe('Cada dato en su columna');

    // JUGAR MAL · «de noche» dice cuándo sale, no qué come.
    escribirEnCelda(1, 0, 'Zorro del desierto');
    escribirEnCelda(1, 1, 'de noche');
    escribirEnCelda(1, 2, 'insectos');
    await celebrar();
    expect(encargo()).toBe('Cada dato en su columna');
  });

  it('encargo 6 · dentro de la tabla el botón está apagado, y no cuenta como error', async () => {
    /*
     * Es la pista de este encargo puesta a prueba: «si el botón se ve apagado,
     * tienes el cursor dentro de la tabla, y una tabla no se parte». El motor
     * promete además que un botón que el programa pinta apagado **no castiga**
     * —«poner el dedo en un botón muerto no puede bajarte la nota»—, y ésta es
     * la única clase de Word con un control de clase que se apaga solo.
     */
    const partida = await jugarDesdeLaPortada(Lab);
    await hastaEl(5);
    expect(encargo()).toBe('Ponlo en dos columnas');

    const v = vista();
    v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, dentroDeLaCelda(1, 0))));
    irAPestana('disposicion');
    pulsar('columnas-2');
    await celebrar();
    expect(encargo()).toBe('Ponlo en dos columnas');
    expect(columnasDelParrafoLargo()).toBe(1);

    paso6();
    await celebrar();
    expect(encargo()).toBe('¿Y esto va en dos?');

    await jugar([paso7]);
    expect(seTermino()).toBe(true);
    // El botón apagado no cobró nada: la partida sigue siendo perfecta.
    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
  });
});
