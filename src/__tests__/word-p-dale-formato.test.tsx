/**
 * `p-dale-formato` (puerto de `n3-dale-formato`) — recorrido de punta a punta.
 *
 * Siete encargos y los DOS desplegables del grupo Fuente, que son los únicos
 * controles de la cinta que no son botones: se aplican por `aplicarDeCombo` y no
 * por `pulsar`, así que tienen su propia rama del desvío en el motor y ningún
 * recorrido la había pisado hasta hoy.
 *
 * El encargo 7 lleva escrito su propio agujero, tapado al jugarlo mal: pedía
 * «que no quede nada a la derecha», y eso se cumple también **centrándolo todo**
 * con Ctrl + A, de modo que la insignia felicitaba por enderezar un párrafo que
 * seguía chueco. Aquí se juega ese atajo para comprobar que ya no cuela.
 */

import { fireEvent } from '@testing-library/react';
import { Lab } from '@/components/activities/office/word/p-dale-formato/Lab';
import {
  boton,
  celebrar,
  cursorEn,
  encargo,
  jugar,
  jugarDesdeLaPortada,
  pulsar,
  seleccionar,
  seleccionarDesdeHasta,
  seleccionarTodo,
  seleccionarTrozo,
  seTermino,
} from './ayuda-word';

const ARIAL = "'Liberation Sans', 'Arial', sans-serif";

/* ── los siete encargos ─────────────────────────────────────────────────────*/

function paso1() {
  seleccionar('El ciclo del agua');
  pulsar('negrita');
}

function paso2() {
  seleccionar('El ciclo del agua');
  fireEvent.change(boton('fuente-tamano'), { target: { value: '20' } });
}

function paso3() {
  seleccionar('El ciclo del agua');
  fireEvent.change(boton('fuente-familia'), { target: { value: ARIAL } });
}

function paso4() {
  cursorEn('El ciclo del agua');
  pulsar('titulo1');
}

function paso5() {
  cursorEn('El ciclo del agua');
  pulsar('centro');
}

function paso6() {
  seleccionarTrozo('El agua de los ríos', 'evaporación');
  pulsar('cursiva');
}

function paso7() {
  cursorEn('Allá arriba hace frío');
  pulsar('izquierda');
}

const PASOS = [paso1, paso2, paso3, paso4, paso5, paso6, paso7];
const hastaEl = (n: number) => jugar(PASOS.slice(0, n));

describe('p-dale-formato', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('el reporte queda arreglado entero y una partida limpia saca 100', async () => {
    const partida = await jugarDesdeLaPortada(Lab);

    await jugar(PASOS);

    expect(seTermino()).toBe(true);
    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
  });

  it('encargo 7 · centrarlo TODO ya no cuela como enderezar el párrafo chueco', async () => {
    await jugarDesdeLaPortada(Lab);
    await hastaEl(6);
    expect(encargo()).toBe('El párrafo chueco');

    // JUGAR MAL · Ctrl + A y Centrar: con el predicado viejo, esto palomeaba el
    // encargo al primer clic sobre un reporte que seguía torcido.
    seleccionarTodo();
    pulsar('centro');
    await celebrar();
    expect(encargo()).toBe('El párrafo chueco');

    /*
     * Y hay salida, que es la otra mitad de lo que este recorrido busca: un
     * encargo que no se cierra sólo es un defecto si además no se puede
     * arreglar. Se endereza el CUERPO —sin el título— y la clase termina.
     *
     * Enderezarlo todo con Ctrl + A también vale, pero cuesta una vuelta: se
     * lleva por delante el centrado del título, el motor lo detecta y devuelve
     * el panel al encargo 5, que es exactamente lo que promete —«si deshaces lo
     * que ya tenías hecho, deja de estar hecho»—.
     */
    seleccionarDesdeHasta('Equipo 3', 'Lo que aprendimos');
    pulsar('izquierda');
    await celebrar();
    expect(seTermino()).toBe(true);
  });

  it('encargo 6 · pintar el párrafo entero inclina todo y no destaca nada', async () => {
    await jugarDesdeLaPortada(Lab);
    await hastaEl(5);
    expect(encargo()).toBe('Sólo una palabra');

    // JUGAR MAL · la cursiva sobre el párrafo completo.
    seleccionar('El agua de los ríos');
    pulsar('cursiva');
    await celebrar();
    expect(encargo()).toBe('Sólo una palabra');

    // Se suelta y se pinta sólo la palabra, como pide el encargo.
    seleccionar('El agua de los ríos');
    pulsar('cursiva');
    paso6();
    await celebrar();
    expect(encargo()).toBe('El párrafo chueco');
  });
});
