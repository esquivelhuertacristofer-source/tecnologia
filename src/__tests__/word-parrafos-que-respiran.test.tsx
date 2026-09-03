/**
 * `of-word-parrafos-que-respiran` (doc §33.6, clase 3) — recorrido de punta a
 * punta. Siete encargos, tres preguntas y tres botones del grupo Párrafo.
 *
 * Es la clase con más trampas escritas a propósito de toda la sala: el encargo 4
 * enseña Ctrl + A y el 6 lo castiga —la sangría va al cuerpo y al título no—, y
 * la única salida documentada de ese callejón es la flecha ↶. Aquí se comprueban
 * las dos mitades.
 */

import { Lab } from '@/components/activities/office/word/parrafos-que-respiran/Lab';
import {
  bloques,
  celebrar,
  cursorAntesDe,
  cursorEn,
  deshacer,
  elegir,
  encargo,
  jugar,
  jugarDesdeLaPortada,
  pulsar,
  seleccionarDesdeHasta,
  seleccionarTodo,
  seTermino,
  teclaEnter,
} from './ayuda-word';

/* ── los siete encargos ─────────────────────────────────────────────────────*/

const paso1 = () => elegir('60 pesos');

/** Los dos cortes que pide la instrucción, por delante de sus letras exactas. */
function paso2() {
  cursorAntesDe('El martes 6 de octubre', 'El costo es de 60 pesos');
  teclaEnter();
  cursorAntesDe('El costo es de 60 pesos', 'Ese día hay que llevar');
  teclaEnter();
}

const paso3 = () => elegir('El párrafo entero');

function paso4() {
  seleccionarTodo();
  pulsar('interlineado');
}

/** El cuerpo, sin el título: los cuatro párrafos del aviso. */
function seleccionarElCuerpo() {
  seleccionarDesdeHasta('El martes 6 de octubre', 'Atentamente');
}

function paso5() {
  seleccionarElCuerpo();
  pulsar('justificado');
}

function paso6() {
  seleccionarElCuerpo();
  pulsar('sangria');
}

const paso7 = () => elegir('Aumentar sangría');

const PASOS = [paso1, paso2, paso3, paso4, paso5, paso6, paso7];
const hastaEl = (n: number) => jugar(PASOS.slice(0, n));

describe('of-word-parrafos-que-respiran', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('la clase entera se termina, y una partida limpia saca 100', async () => {
    const partida = await jugarDesdeLaPortada(Lab);

    await jugar(PASOS);

    expect(seTermino()).toBe(true);
    // Al aviso no le cambió ni una palabra: sólo el aire.
    expect(bloques()[0].texto).toBe('Aviso para las familias de 5º B');
    expect(bloques().filter((b) => b.texto.trim().length > 0)).toHaveLength(5);

    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
  });

  it('encargo 2 · partirlo sólo por la mitad deja un muro y no cierra el encargo', async () => {
    await jugarDesdeLaPortada(Lab);
    await hastaEl(1);
    expect(encargo()).toBe('Dale aire');

    cursorAntesDe('El martes 6 de octubre', 'El costo es de 60 pesos');
    teclaEnter();
    await celebrar();
    expect(encargo()).toBe('Dale aire');

    cursorAntesDe('El costo es de 60 pesos', 'Ese día hay que llevar');
    teclaEnter();
    await celebrar();
    expect(encargo()).toBe('Piénsalo antes');
  });

  it('encargo 6 · Ctrl + A agarra también el título, y la flecha ↶ es la salida', async () => {
    await jugarDesdeLaPortada(Lab);
    await hastaEl(5);
    expect(encargo()).toBe('Métele el margen');

    // JUGAR MAL · el atajo que el encargo 4 acaba de enseñar, aquí juega en contra.
    seleccionarTodo();
    pulsar('sangria');
    await celebrar();
    expect(encargo()).toBe('Métele el margen');

    // La salida documentada: la flecha de Deshacer se lleva los cinco de un golpe,
    // y **no** «Disminuir sangría», que el motor deshace por ser el botón que no era.
    deshacer();
    await celebrar();
    expect(encargo()).toBe('Métele el margen');

    paso6();
    await celebrar();
    expect(encargo()).toBe('Mira la cinta');

    // Y el encargo 4 sigue en pie: meterle sangría al cuerpo no cerró el interlineado.
    cursorEn('Atentamente');
    expect(encargo()).toBe('Mira la cinta');
  });
});
