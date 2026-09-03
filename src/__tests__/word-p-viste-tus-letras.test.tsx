/**
 * `p-viste-tus-letras` (puerto de `n2-viste-tus-letras`) — recorrido de punta a
 * punta. Siete encargos y **seis botones distintos del grupo Fuente**: tamaño,
 * negrita, cursiva, color, subrayado y A▼. Es la clase que más superficie del
 * motor toca de toda la sala, y por eso va temprano en el recorrido.
 *
 * Su guion deja escritos dos defectos ya pagados que aquí se vuelven a probar
 * con las manos: los encargos se anclan por POSICIÓN y los dos últimos cuentan
 * **desde abajo**, porque contar sólo desde arriba dejaba la clase imposible de
 * terminar en cuanto el niño borraba el título —que es el estado que el encargo
 * 1 acaba de mandarle alcanzar—.
 */

import { fireEvent } from '@testing-library/react';
import { Lab } from '@/components/activities/office/word/p-viste-tus-letras/Lab';
import {
  boton,
  celebrar,
  cursorAlFinalDe,
  elegir,
  encargo,
  jugar,
  jugarDesdeLaPortada,
  pulsar,
  seleccionar,
  seleccionarTrozo,
  seTermino,
  teclaEnter,
} from './ayuda-word';

/* ── los siete encargos ─────────────────────────────────────────────────────*/

function paso1() {
  seleccionar('El perro que sabía contar');
  fireEvent.change(boton('fuente-tamano'), { target: { value: '28' } });
}

function paso2() {
  seleccionar('El perro que sabía contar');
  pulsar('negrita');
}

function paso3() {
  seleccionar('Cuento de Ximena Robles');
  pulsar('cursiva');
}

const paso4 = () => elegir('Rojo');

function paso5() {
  seleccionar('¡Aguas!');
  pulsar('color-rojo');
}

function paso6() {
  seleccionar('Se lee el viernes');
  pulsar('subrayado');
}

function paso7() {
  seleccionar('Escuela Primaria Josefa Ortiz');
  pulsar('menor');
}

const PASOS = [paso1, paso2, paso3, paso4, paso5, paso6, paso7];
const hastaEl = (n: number) => jugar(PASOS.slice(0, n));

describe('p-viste-tus-letras', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('la portada se viste entera y una partida limpia saca 100', async () => {
    const partida = await jugarDesdeLaPortada(Lab);

    await jugar(PASOS);

    expect(seTermino()).toBe(true);
    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
  });

  it('encargo 2 · con media palabra pintada, media palabra se pone gorda y el encargo sigue abierto', async () => {
    await jugarDesdeLaPortada(Lab);
    await hastaEl(1);
    expect(encargo()).toBe('Que se plante: negrita');

    // JUGAR MAL · un doble clic pinta UNA palabra, que es el error del banco.
    seleccionarTrozo('El perro que sabía contar', 'perro');
    pulsar('negrita');
    await celebrar();
    expect(encargo()).toBe('Que se plante: negrita');

    paso2();
    await celebrar();
    expect(encargo()).toBe('La firma, acostada');
  });

  it('los dos últimos encargos cuentan desde ABAJO: un Enter de más no descoloca la portada', async () => {
    /*
     * Los dos encargos del final se anclan contando desde abajo porque contar
     * sólo desde arriba dejaba la clase imposible de terminar —está medido en su
     * guion: el niño borra el primer renglón, el encargo que buscaba «el quinto»
     * se queda sin objetivo y no hay salida—. Aquí se prueba la otra mitad de la
     * misma defensa, la que sí puede pasarle a un niño de siete años sin romper
     * nada: pulsar Entrar de más al final. Los renglones vacíos no cuentan, así
     * que «el último» y «el de encima del último» siguen siendo los mismos.
     */
    await jugarDesdeLaPortada(Lab);
    await hastaEl(5);
    expect(encargo()).toBe('Subraya el día');

    // JUGAR MAL · un par de Entrar al final de la portada.
    cursorAlFinalDe('Escuela Primaria Josefa Ortiz');
    teclaEnter();
    teclaEnter();
    await celebrar();
    expect(encargo()).toBe('Subraya el día');

    paso6();
    await celebrar();
    expect(encargo()).toBe('Y esto, chiquito');

    paso7();
    await celebrar();
    expect(seTermino()).toBe(true);
  });
});
