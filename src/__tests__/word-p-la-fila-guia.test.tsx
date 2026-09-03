/**
 * `p-la-fila-guia` · «La fila guía» (puerto de `n3-la-fila-guia`, §20.3) —
 * recorrido de punta a punta.
 *
 * Es la única clase de la sala donde NINGÚN encargo se resuelve con la cinta:
 * los seis se teclean, y el señalador vive en el teclado guía del fondo y no en
 * los botones de arriba. Por eso interesa doblemente al recorrido: si el motor
 * cobrara por curiosear —o si la nota contara mal las letras de más— aquí se
 * vería antes que en ninguna otra.
 *
 * La nota de esta clase NO es la de la sala: baja 4 por tropiezo y 1 por letra
 * de más, con suelo en 60, y las estrellas se dan en 80 y 65. Una partida
 * impecable tiene que salir 100 igual.
 */

import { Lab } from '@/components/activities/office/word/p-la-fila-guia/Lab';
import { RENGLONES } from '@/components/activities/office/word/p-la-fila-guia/renglones';
import {
  bloques,
  celebrar,
  cursorAlFinalDe,
  encargo,
  escribir,
  jugar,
  jugarDesdeLaPortada,
  pulsar,
  seTermino,
  teclaEnter,
  textoDelDocumento,
  vista,
} from './ayuda-word';
import { TextSelection } from 'prosemirror-state';

/** El cursor al final del último renglón de la hoja, que es donde se escribe. */
function cursorAlFinalDeLaHoja() {
  const v = vista();
  const ultimo = bloques()[bloques().length - 1];
  v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, ultimo.hasta - 1)));
}

/**
 * Un encargo: bajar de renglón y teclear el modelo, letra por letra.
 *
 * El primero no baja —la hoja ya trae su renglón vacío al final—, y los otros
 * cinco empiezan con Entrar, que es lo que dice cada instrucción.
 */
function escribirElRenglon(i: number) {
  return () => {
    cursorAlFinalDeLaHoja();
    if (i > 0) teclaEnter();
    escribir(RENGLONES[i].modelo);
  };
}

const PASOS = RENGLONES.map((_, i) => escribirElRenglon(i));
const hastaEl = (n: number) => jugar(PASOS.slice(0, n));

describe('p-la-fila-guia', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('los seis renglones se escriben y la clase se termina con 100', async () => {
    const partida = await jugarDesdeLaPortada(Lab);

    await jugar(PASOS);

    expect(seTermino()).toBe(true);
    for (const r of RENGLONES) expect(textoDelDocumento()).toContain(r.modelo);
    // La hoja del taller sigue entera: el alumno escribió debajo, no encima.
    expect(bloques()[0].texto).toBe('Práctica de mecanografía');

    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
  });

  it('encargo 5 · «HOY ES LUNES» no vale, y arreglarlo cierra el encargo', async () => {
    await jugarDesdeLaPortada(Lab);
    await hastaEl(4);
    expect(encargo()).toBe('Una sola mayúscula');

    // JUGAR MAL · Bloq Mayús puesto, que es el tropiezo que la clase provoca.
    cursorAlFinalDeLaHoja();
    teclaEnter();
    escribir('HOY ES LUNES');
    await celebrar();
    expect(encargo()).toBe('Una sola mayúscula');

    // Se borra el renglón malo y se escribe bien, como haría el alumno.
    const v = vista();
    const malo = bloques().find((b) => b.texto.trim() === 'HOY ES LUNES')!;
    v.dispatch(v.state.tr.delete(malo.desde + 1, malo.hasta - 1));
    cursorAlFinalDeLaHoja();
    escribir('Hoy es lunes');
    await celebrar();
    expect(encargo()).toBe('El renglón de honor');
  });

  it('curiosear la cinta cuesta la nota, pero no ensucia la hoja ni cierra encargos', async () => {
    const partida = await jugarDesdeLaPortada(Lab);
    await hastaEl(1);

    // Ningún encargo de esta clase se resuelve pulsando: la negrita es desvío,
    // el motor la deshace y el documento queda como estaba.
    cursorAlFinalDe('Práctica de mecanografía');
    pulsar('negrita');
    await celebrar();
    expect(encargo()).toBe('Palabras cortas');
    expect(bloques()[0].texto).toBe('Práctica de mecanografía');

    await jugar(PASOS.slice(1));
    expect(seTermino()).toBe(true);
    // Un solo tropiezo: 100 − 4. Sigue siendo de tres estrellas (el listón es 80).
    expect(partida.nota()).toMatchObject({ score: 96, stars: 3 });
  });
});
