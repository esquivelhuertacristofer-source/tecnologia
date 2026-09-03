/**
 * `of-word-correspondencia` · «Un molde y una lista» — recorrido de punta a punta.
 *
 * Es la clase con MÁS encargos de toda la sala —diez— y la única cuyo séptimo
 * encargo **reescribe el documento entero**: combinar cambia una carta por ocho.
 * Eso la pone en el sitio exacto donde el motor retrocede: `primerDeshecho`
 * vuelve al primer encargo de tipo `documento` que deje de cumplirse, y aquí hay
 * cuatro de ésos —los dos campos y las dos vistas previas— vivos por debajo de
 * un encargo que tira el documento a la basura y pone otro en su lugar.
 *
 * ── LO QUE ENCONTRÓ EL RECORRIDO: NADA, Y ESO ES EL RESULTADO ───────────────
 *
 * La clase se termina entera y una partida limpia saca 100 sin tocarle una línea.
 * Las dos lentes de `estado.ts` aguantan el zarandeo: con las ocho cartas en
 * pantalla no queda ni un campo a la vista y aun así los encargos 3 y 4 siguen
 * palomeados, porque se leen contra `documentoReal`, que se acuerda de la carta
 * cuando delante hay una copia. Y el clic tonto que en agosto retrocedía siete
 * encargos —el ojo en vez de la lista, en el tramo final— hoy sólo cuesta el
 * tropiezo que le toca: la tercera prueba lo comprueba y sigue jugando hasta el
 * final desde ahí, que es lo único que demuestra que la salida existe.
 */

import { fireEvent, screen } from '@testing-library/react';
import { Lab } from '@/components/activities/office/word/correspondencia/Lab';
import {
  avisos,
  bloques,
  celebrar,
  cursorEn,
  elegir,
  encargo,
  irAPestana,
  jugar,
  jugarDesdeLaPortada,
  pulsar,
  seleccionarTrozo,
  seTermino,
  textoDelDocumento,
} from './ayuda-word';

/* ── los diez encargos, como los haría un alumno que atiende ─────────────────*/

const aceptarElCuadro = () => fireEvent.click(screen.getByText('Aceptar'));

function paso1() {
  irAPestana('correspondencia');
  pulsar('cor-destinatarios');
  // Se mira la lista y se cierra el cuadro: la clase sigue en la cinta.
  aceptarElCuadro();
}

const paso2 = () => elegir('Escribir campos');

/** La raya entera del saludo, seleccionada como con doble clic. */
function paso3() {
  seleccionarTrozo('Hola,', '______');
  pulsar('cor-campo-nombre');
}

function paso4() {
  seleccionarTrozo('Como vas en', '______');
  pulsar('cor-campo-grupo');
}

const paso5 = () => pulsar('cor-vista-previa');
const paso6 = () => pulsar('cor-siguiente');
const paso7 = () => pulsar('cor-combinar');
const paso8 = () => pulsar('cor-destinatarios');

/** El alumno número nueve, escrito en el cuadro y aceptado. */
function paso9() {
  fireEvent.click(screen.getByText('Nuevo destinatario'));
  fireEvent.change(screen.getByLabelText('Nombre del destinatario 9'), {
    target: { value: 'Bruno Salgado Rivas' },
  });
  fireEvent.change(screen.getByLabelText('Grado del destinatario 9'), { target: { value: '6' } });
  fireEvent.change(screen.getByLabelText('Grupo del destinatario 9'), { target: { value: 'A' } });
  aceptarElCuadro();
}

const paso10 = () => pulsar('cor-combinar');

const PASOS = [paso1, paso2, paso3, paso4, paso5, paso6, paso7, paso8, paso9, paso10];
const hastaEl = (n: number) => jugar(PASOS.slice(0, n));

describe('of-word-correspondencia', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('la clase entera se termina, y una partida limpia saca 100', async () => {
    const partida = await jugarDesdeLaPortada(Lab);

    await jugar(PASOS);

    expect(seTermino()).toBe(true);
    // Nueve cartas en la hoja, nueve membretes, y el alumno nuevo entre ellas.
    expect(bloques().filter((b) => b.tipo === 'titulo')).toHaveLength(9);
    expect(textoDelDocumento()).toContain('Bruno Salgado Rivas');
    // Y ni un hueco: las cartas están rellenas, no son el molde repetido.
    expect(textoDelDocumento()).not.toContain('«Nombre»');

    expect(partida.onComplete).toHaveBeenCalledTimes(1);
    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
  });

  it('encargo 3 · el campo se mete donde está el cursor, y con la raya a medias no vale', async () => {
    await jugarDesdeLaPortada(Lab);
    await hastaEl(2);
    expect(encargo()).toBe('Mete el hueco del nombre');

    // JUGAR MAL · pulsar el botón sin haber hecho clic dentro de la carta: el
    // cursor está en el membrete y ahí se va el campo. Es la mitad de la lección.
    pulsar('cor-campo-nombre');
    await celebrar();
    expect(encargo()).toBe('Mete el hueco del nombre');
    pulsar('deshacer');
    await celebrar();

    // JUGAR MAL · un solo clic en la raya la parte por la mitad y quedan rayitas
    // a los dos lados. La pista lo avisa palabra por palabra; el encargo también.
    cursorEn('Hola,', 9);
    pulsar('cor-campo-nombre');
    await celebrar();
    expect(encargo()).toBe('Mete el hueco del nombre');
    pulsar('deshacer');
    await celebrar();

    paso3();
    await celebrar();
    expect(encargo()).toBe('Y el del grupo');
  });

  it('combinar no deshace los encargos de antes, y el clic tonto del ojo no retrocede la clase', async () => {
    const partida = await jugarDesdeLaPortada(Lab);
    await hastaEl(7);
    // Con las ocho cartas en pantalla no queda ni un campo a la vista: si los
    // encargos 3 y 4 se leyeran de la hoja, el motor habría retrocedido a ellos.
    expect(encargo()).toBe('Llegó alguien nuevo');
    expect(textoDelDocumento()).not.toContain('«Nombre»');

    // JUGAR MAL · el clic tonto de este tramo: el ojo en vez de la lista. Es
    // desvío, así que el motor lo deshace y avisa —y esa memoria a medias (el
    // resultado olvidado, el documento intacto) es la que retrocedía siete
    // encargos de golpe con el documento delante sin haber cambiado.
    pulsar('cor-vista-previa');
    await celebrar();
    expect(textoDelDocumento()).not.toContain('«Nombre»');
    expect(encargo()).toBe('Llegó alguien nuevo');
    expect(avisos()).toContain('Volver a la carta con sus campos');

    // Y desde ahí la clase se sigue terminando entera.
    await jugar(PASOS.slice(7));
    expect(seTermino()).toBe(true);
    expect(bloques().filter((b) => b.tipo === 'titulo')).toHaveLength(9);
    expect(partida.nota()).toMatchObject({ score: 94, stars: 3, errores: 1 });
  });
});
