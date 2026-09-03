/**
 * `p-cuento-ilustrado` (puerto de la prensa de cuentos, §13.3) — recorrido de
 * punta a punta.
 *
 * Seis encargos de segundo de primaria, y el último es el que más interesa al
 * recorrido: su comprobante lleva escrito un defecto medido en el banco —«con el
 * cursor en el renglón vacío del final, **un solo Backspace** lo pega al de
 * arriba, el último renglón escrito pasa a ser uno que ya venía con su punto, y
 * la clase se terminaba con 100 puntos y tres estrellas sin que el niño hubiera
 * escrito una letra»—. Aquí se juega ese Backspace para ver que ya no regala
 * nada.
 */

import { fireEvent } from '@testing-library/react';
import { TextSelection } from 'prosemirror-state';
import { Lab } from '@/components/activities/office/word/p-cuento-ilustrado/Lab';
import { DIBUJO_DEL_CUENTO } from '@/components/activities/office/word/p-cuento-ilustrado/dibujos';
import {
  bloques,
  celebrar,
  cursorAlFinalDe,
  cursorEn,
  elegir,
  encargo,
  escribir,
  irAPestana,
  jugar,
  jugarDesdeLaPortada,
  pulsar,
  seleccionar,
  seTermino,
  teclaEnter,
  vista,
} from './ayuda-word';

const PRIMER_RENGLON = 'En mi salón hicimos un tren';

/** Elige un dibujo del cajón por su nombre y lo mete. */
function meterElDibujo(nombre: string) {
  const pieza = Array.from(document.querySelectorAll<HTMLElement>('.cuentoi-pieza')).find((p) =>
    (p.textContent ?? '').includes(nombre),
  );
  if (!pieza) throw new Error(`no hay ningún dibujo «${nombre}» en el cajón`);
  fireEvent.click(pieza);
  // «Insertar» a secas encuentra dos: el botón del cajón y la pestaña de la
  // cinta que sigue detrás. Se pide el del cajón por su clase.
  const insertar = Array.from(document.querySelectorAll<HTMLElement>('.cuentoi-boton')).find(
    (b) => (b.textContent ?? '').trim() === 'Insertar',
  );
  if (!insertar) throw new Error('el cajón no tiene botón de Insertar');
  fireEvent.click(insertar);
}

/** El cursor en el renglón vacío del final, que es donde va el final del cuento. */
function cursorEnElRenglonVacio() {
  const v = vista();
  const ultimo = bloques()[bloques().length - 1];
  v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, ultimo.desde + 1)));
}

/* ── los seis encargos ──────────────────────────────────────────────────────*/

function paso1() {
  cursorEn('El tren de cartón');
  pulsar('titulo1');
}

function paso2() {
  seleccionar('El tren de cartón');
  pulsar('color');
}

const paso3 = () => elegir('Junto al renglón que habla de lo mismo');

function paso4() {
  cursorAlFinalDe(PRIMER_RENGLON);
  irAPestana('insertar');
  pulsar('imagen');
}

const paso5 = () => meterElDibujo(DIBUJO_DEL_CUENTO.nombre);

function paso6() {
  cursorEnElRenglonVacio();
  escribir('Ahora el tren duerme en el salón.');
}

const PASOS = [paso1, paso2, paso3, paso4, paso5, paso6];
const hastaEl = (n: number) => jugar(PASOS.slice(0, n));

describe('p-cuento-ilustrado', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('el cuento queda ilustrado y terminado, y una partida limpia saca 100', async () => {
    const partida = await jugarDesdeLaPortada(Lab);

    await jugar(PASOS);

    expect(seTermino()).toBe(true);
    expect(bloques()[0].tipo).toBe('titulo');
    expect(bloques().some((b) => b.tipo === 'imagen')).toBe(true);
    expect(bloques()[bloques().length - 1].texto).toContain('Ahora el tren duerme');

    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
  });

  it('encargo 5 · el dibujo que no cuenta lo mismo no cierra el encargo', async () => {
    await jugarDesdeLaPortada(Lab);
    await hastaEl(4);
    expect(encargo()).toBe('El que cuenta lo mismo');

    // JUGAR MAL · la nube va primera en el cajón y no cuenta nada del cuento.
    meterElDibujo('Una nube');
    await celebrar();
    expect(encargo()).toBe('El que cuenta lo mismo');

    /*
     * El cajón SE CIERRA al meter un dibujo, así que salir del error pasa por
     * volver a abrirlo — y ésa es exactamente la razón por la que este encargo
     * lleva `senal: { control: 'imagen' }` aunque no se resuelva en la cinta:
     * su guion lo deja escrito, «en cuanto el cajón se cierra vuelven a aparecer
     * el señalador y la ficha sobre Imagen, que es el botón con el que se
     * arregla». El recorrido confirma que ese camino existe y que el dibujo
     * nuevo sustituye al anterior en vez de sumarse.
     */
    paso4();
    paso5();
    await celebrar();
    expect(encargo()).toBe('Escribe el final');
    expect(bloques().filter((b) => b.tipo === 'imagen')).toHaveLength(1);
  });

  it('encargo 6 · borrar el renglón vacío ya no regala la clase entera', async () => {
    /*
     * El defecto que su comprobante deja escrito: un solo Retroceso en el
     * renglón vacío del final hacía que el último renglón escrito fuera «El
     * lunes lo sacamos al patio…», que ya venía con punto y ocho palabras, y la
     * insignia salía sin que el niño escribiera una letra. Se tapó contando los
     * renglones que quedan DETRÁS del dibujo.
     */
    await jugarDesdeLaPortada(Lab);
    await hastaEl(5);
    expect(encargo()).toBe('Escribe el final');

    // JUGAR MAL · el Retroceso que se llevaba el renglón vacío.
    const v = vista();
    const ultimo = bloques()[bloques().length - 1];
    v.dispatch(v.state.tr.delete(ultimo.desde, ultimo.hasta));
    await celebrar();
    expect(encargo()).toBe('Escribe el final');

    /*
     * Y hay salida, que es la otra mitad del encargo: el final tiene que ser un
     * renglón NUEVO detrás del cuento. Alargar el último que ya estaba no vale
     * —la cuenta de renglones tras el dibujo no sube— y eso es justo lo que
     * cierra el atajo del Retroceso.
     */
    cursorAlFinalDe('El lunes lo sacamos al patio');
    teclaEnter();
    escribir('Ahora el tren duerme en el salón.');
    await celebrar();
    expect(seTermino()).toBe(true);
  });
});
