/**
 * `of-word-coautoria` · «Escribir entre tres» — recorrido de punta a punta. Ocho
 * encargos, y la última clase de la sala de Word.
 *
 * Es la más expuesta de las cuatro al retroceso del motor por dos razones que se
 * juntan: seis de sus ocho encargos son de tipo `documento` pero se corrigen
 * leyendo un ESTADO que no está en la hoja —paneles vistos, versiones guardadas,
 * comentarios resueltos—, y el último encargo **reemplaza el documento entero**
 * restaurando una versión. Si la versión que se restaura fuera anterior al punto
 * de la lista que pide el encargo 4, el motor retrocedería cuatro encargos con
 * todo bien hecho.
 *
 * Los gestos dentro de la hoja van por `keydown` sobre el DOM del editor y no
 * por `splitBlock` a pelo: aquí el Enter tiene que caer en `splitListItem` —hay
 * que abrir una VIÑETA nueva, no partir un párrafo— y ése es el comando que el
 * motor tiene atado a la tecla.
 *
 * ── LO QUE ENCONTRÓ EL RECORRIDO ────────────────────────────────────────────
 * La clase se termina y ahora una partida limpia saca 100. Hasta el 15-ago-2026
 * sacaba 88 con dos tropiezos y sin un solo error del alumno, y el motivo estaba
 * escrito en la cabecera de su `Lab.tsx`: «Guardar una versión» y «Comparar
 * documentos» son los dos botones a los que apunta el propio señalador, y los dos
 * ABREN el sitio donde se resuelve el encargo en vez de resolverlo al pulsarlos.
 * El motor cobraba ese clic. Se curó en `VentanaTextos` el mismo día; aquí se
 * comprueba que la cura llegó.
 */

import { fireEvent, screen } from '@testing-library/react';
import { TextSelection } from 'prosemirror-state';
import { LabCoautoria } from '@/components/activities/office/word/coautoria/Lab';
import { taller } from '@/components/activities/office/word/coautoria/taller';
import {
  bloques,
  celebrar,
  elegir,
  encargo,
  escribir,
  irAPestana,
  jugar,
  jugarDesdeLaPortada,
  pulsar,
  seTermino,
  textoDelDocumento,
  vista,
} from './ayuda-word';

/* ── los gestos dentro de la hoja ───────────────────────────────────────────*/

const enPantalla = (selector: string): HTMLElement => {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`no hay «${selector}» en pantalla`);
  return el as HTMLElement;
};

/** El cursor al final del último punto de la lista de secciones. */
function cursorAlFinalDeLaLista() {
  const v = vista();
  const lista = bloques().find((b) => b.tipo === 'lista_vinetas');
  if (!lista) throw new Error('el guion ya no tiene la lista de secciones');
  v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, lista.hasta - 3)));
}

/**
 * La tecla Enter de verdad, la que pasa por el `keymap` del motor.
 *
 * `ayuda-word.teclaEnter()` llama a `splitBlock` directamente y aquí eso no
 * sirve: dentro de una viñeta parte el párrafo y deja DOS párrafos en el mismo
 * punto, así que la lista sigue teniendo cuatro puntos y el encargo 4 —que
 * cuenta puntos— no se cerraría nunca. El motor tiene Enter atado a
 * `chainCommands(splitListItem, baseKeymap.Enter)`, y un `keydown` sobre el DOM
 * del editor es el único camino que pasa por ahí.
 */
const teclaDeVerdad = (key: string) => fireEvent.keyDown(vista().dom, { key });

/* ── los ocho encargos ──────────────────────────────────────────────────────*/

const NOMBRE_VERSION = 'Ya está la sección de cartas';

function paso1() {
  irAPestana('revisar');
  pulsar('panel-revisiones');
}

const paso2 = () => pulsar('historial');
const paso3 = () => elegir('Comparar');

/** El punto que falta, escrito como los otros cuatro: sección y quién escribe. */
function paso4() {
  cursorAlFinalDeLaLista();
  teclaDeVerdad('Enter');
  escribir('Cartas de los lectores — Ana. Lo que nos manden las familias.');
}

function paso5() {
  pulsar('guardar-version');
  fireEvent.change(enPantalla('#coa-nombre-version'), { target: { value: NOMBRE_VERSION } });
  fireEvent.click(enPantalla('[data-accion="guardar-version"]'));
}

function paso6() {
  pulsar('comparar');
  fireEvent.change(enPantalla('#coa-izq'), { target: { value: 'v-lunes' } });
  fireEvent.click(enPantalla('[data-accion="comparar"]'));
}

/** El único de los tres que de verdad está hecho. */
const paso7 = () => fireEvent.click(enPantalla('[data-com="c-secciones"] [data-accion="resolver"]'));

/** Un renglón de prueba y la vuelta atrás desde el historial. */
function paso8() {
  const v = vista();
  v.dispatch(v.state.tr.setSelection(TextSelection.atEnd(v.state.doc)));
  escribir(' Y esto lo escribí para probar la red.');
  fireEvent.click(enPantalla('[data-version^="v-mia"] [data-accion="restaurar"]'));
}

const PASOS = [paso1, paso2, paso3, paso4, paso5, paso6, paso7, paso8];
const hastaEl = (n: number) => jugar(PASOS.slice(0, n));

describe('of-word-coautoria', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('la clase entera se termina, y una partida limpia saca 100', async () => {
    const partida = await jugarDesdeLaPortada(LabCoautoria);

    await jugar(PASOS);

    expect(seTermino()).toBe(true);
    // La sección que faltaba está en el guion, el renglón de prueba ya no, y de
    // los tres comentarios sólo hay uno resuelto.
    expect(textoDelDocumento()).toContain('Cartas de los lectores');
    expect(textoDelDocumento()).not.toContain('para probar la red');
    expect(taller.leer().comentarios.filter((c) => c.resuelto)).toHaveLength(1);

    expect(partida.onComplete).toHaveBeenCalledTimes(1);
    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
  });

  it('encargo 6 · comparar un documento consigo mismo no enseña nada y no cuenta', async () => {
    await jugarDesdeLaPortada(LabCoautoria);
    await hastaEl(5);
    expect(encargo()).toBe('Mira qué cambió');

    // JUGAR MAL · el error que la clase provoca a propósito: el diálogo abre con
    // los dos lados en «Documento de ahora» y hay quien pulsa Comparar sin mirar.
    pulsar('comparar');
    fireEvent.click(enPantalla('[data-accion="comparar"]'));
    await celebrar();
    expect(encargo()).toBe('Mira qué cambió');
    expect(screen.getByText(/los dos lados son el mismo documento/i)).toBeInTheDocument();

    fireEvent.change(enPantalla('#coa-izq'), { target: { value: 'v-lunes' } });
    fireEvent.click(enPantalla('[data-accion="comparar"]'));
    await celebrar();
    expect(encargo()).toBe('Resuelve sólo el que ya está');
  });

  it('encargo 7 · resolver el comentario que no era no cierra el encargo, y se reabre', async () => {
    await jugarDesdeLaPortada(LabCoautoria);
    await hastaEl(6);
    expect(encargo()).toBe('Resuelve sólo el que ya está');

    // JUGAR MAL · resolver el de las fechas, que se decide en una junta que no ha
    // pasado. Es la decisión que el encargo existe para enseñar.
    fireEvent.click(enPantalla('[data-com="c-fechas"] [data-accion="resolver"]'));
    await celebrar();
    expect(encargo()).toBe('Resuelve sólo el que ya está');

    fireEvent.click(enPantalla('[data-com="c-fechas"] [data-accion="reabrir"]'));
    await celebrar();
    paso7();
    await celebrar();
    expect(encargo()).toBe('Prueba la red');

    // Y volver a abrir el que sí estaba despaloma su propio encargo: el motor
    // retrocede porque el estado dejó de cumplirse, no porque se pulsara nada.
    fireEvent.click(enPantalla('[data-com="c-secciones"] [data-accion="reabrir"]'));
    await celebrar();
    expect(encargo()).toBe('Resuelve sólo el que ya está');
  });
});
