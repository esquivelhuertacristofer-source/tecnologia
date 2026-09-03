/**
 * `of-word-la-cinta` · «La cinta por dentro» (doc §36.4) — recorrido de punta a
 * punta. Es la clase MÁS ANTIGUA de la sala (9-ago-2026) y la primera que se
 * escribió sobre el motor, así que es la que más veces ha cambiado debajo.
 *
 * Se juega con `LabLaCinta`, no con `VentanaTextos` a pelo: el laboratorio es
 * quien trae la cinta de su grado y **su fórmula de calificar**, y una partida
 * perfecta que saca 88 sólo se ve desde ahí.
 */

import { fireEvent } from '@testing-library/react';
import { LabLaCinta } from '@/components/activities/office/word/LabLaCinta';
import {
  bloques,
  boton,
  celebrar,
  confirmar,
  cursorEn,
  elegir,
  encargo,
  irAPestana,
  jugar,
  jugarDesdeLaPortada,
  pulsar,
  seleccionar,
  seTermino,
} from './ayuda-word';

/* ── los siete encargos, como los haría un alumno que atiende ────────────────*/

const paso1 = () => irAPestana('insertar');
const paso2 = () => irAPestana('inicio');
const paso3 = () => elegir('Fuente');

function paso4() {
  seleccionar('Kermés de la escuela');
  fireEvent.change(boton('fuente-tamano'), { target: { value: '20' } });
}

function paso5() {
  cursorEn('Kermés de la escuela');
  pulsar('centro');
}

function paso6() {
  cursorEn('Los precios de cada puesto');
  irAPestana('insertar');
  pulsar('tabla');
}

function paso7() {
  cursorEn('Kermés de la escuela');
  confirmar('Ya lo vi');
}

const PASOS = [paso1, paso2, paso3, paso4, paso5, paso6, paso7];
const hastaEl = (n: number) => jugar(PASOS.slice(0, n));

describe('of-word-la-cinta', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('la clase entera se termina, y una partida limpia saca 100', async () => {
    const partida = await jugarDesdeLaPortada(LabLaCinta);

    await jugar(PASOS);

    expect(seTermino()).toBe(true);
    // El cartel quedó como pedía el encargo: título grande y centrado, y tabla.
    expect(bloques()[0].texto).toContain('Kermés');
    expect(bloques().some((b) => b.tipo === 'tabla')).toBe(true);

    expect(partida.onComplete).toHaveBeenCalledTimes(1);
    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
  });

  it('jugando mal: el tamaño sin seleccionar no cambia nada y el botón que no es avisa', async () => {
    const partida = await jugarDesdeLaPortada(LabLaCinta);
    await hastaEl(3);
    expect(encargo()).toBe('Ahora hazlo');

    // JUGAR MAL · elegir 20 pt con el cursor suelto, que es el tropiezo que la
    // clase está construida para provocar y para el que tiene la pista escrita.
    cursorEn('Kermés de la escuela');
    fireEvent.change(boton('fuente-tamano'), { target: { value: '20' } });
    await celebrar();
    expect(encargo()).toBe('Ahora hazlo');

    paso4();
    await celebrar();
    expect(encargo()).toBe('El título, al centro');

    // JUGAR MAL · centrar con el cursor en otro renglón.
    cursorEn('Habrá juegos');
    pulsar('centro');
    await celebrar();
    expect(encargo()).toBe('El título, al centro');

    paso5();
    await celebrar();
    expect(encargo()).toBe('Lo que no está en Inicio');
    expect(partida.onComplete).not.toHaveBeenCalled();
  });
});
