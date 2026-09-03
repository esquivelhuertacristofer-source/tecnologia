/**
 * `p-mis-primeras-oraciones` (puerto de `n2-mis-primeras-oraciones`) —
 * recorrido de punta a punta.
 *
 * Segundo de primaria: mayúscula al empezar, un espacio entre palabras y punto
 * al terminar. Cinco de los seis encargos se escriben con el teclado y uno solo
 * pasa por la cinta, y ahí está lo que este recorrido tenía que comprobar: el
 * encargo 5 deja el título PINTADO y el 6 manda escribir otra oración, que es la
 * secuencia que el propio guion dice haber medido rompiéndola —el niño teclea
 * sin volver a hacer clic y se lleva el título por delante—. Se juega también
 * ese destrozo, para ver que la clase no premia una hoja sin título.
 */

import { Lab } from '@/components/activities/office/word/p-mis-primeras-oraciones/Lab';
import {
  bloques,
  celebrar,
  cursorAlFinalDe,
  encargo,
  escribir,
  escribirEncima,
  jugar,
  jugarDesdeLaPortada,
  pulsar,
  reemplazarTrozo,
  seleccionar,
  seTermino,
  textoDelDocumento,
} from './ayuda-word';

/* ── los seis encargos ──────────────────────────────────────────────────────*/

const paso1 = () => {
  const opciones = Array.from(document.querySelectorAll<HTMLElement>('.txtw-opcion'));
  // Sin `elegir()`: las cuatro opciones son la misma frase revuelta, así que
  // buscarlas por un trozo de texto encontraría la primera que empiece igual.
  const cual = opciones.find((o) => o.textContent === 'la compu es mi amiga');
  if (!cual) throw new Error('no está la opción buena');
  cual.click();
};

function paso2() {
  cursorAlFinalDe('1.');
  escribir(' la compu es mi amiga');
}

const paso3 = () => reemplazarTrozo('1.', 'la compu', 'La compu');

function paso4() {
  cursorAlFinalDe('1.');
  escribir('.');
}

function paso5() {
  seleccionar('Mis oraciones');
  pulsar('negrita');
}

function paso6() {
  cursorAlFinalDe('2.');
  escribir(' Mi perro se llama Canela.');
}

const PASOS = [paso1, paso2, paso3, paso4, paso5, paso6];
const hastaEl = (n: number) => jugar(PASOS.slice(0, n));

describe('p-mis-primeras-oraciones', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('la clase entera se termina, y una partida limpia saca 100', async () => {
    const partida = await jugarDesdeLaPortada(Lab);

    await jugar(PASOS);

    expect(seTermino()).toBe(true);
    expect(textoDelDocumento()).toContain('La compu es mi amiga.');
    expect(textoDelDocumento()).toContain('Mi perro se llama Canela.');
    // El título sigue en su sitio y en negrita.
    expect(bloques()[0].texto).toBe('Mis oraciones');

    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
  });

  it('encargo 4 · sin mayúscula y sin punto el renglón no es una oración', async () => {
    await jugarDesdeLaPortada(Lab);
    await hastaEl(2);
    expect(encargo()).toBe('La letra grande');

    // JUGAR MAL · el punto antes que la mayúscula: el encargo 3 sigue por hacer.
    cursorAlFinalDe('1.');
    escribir('.');
    await celebrar();
    expect(encargo()).toBe('La letra grande');

    paso3();
    await celebrar();
    expect(encargo()).toBe('El punto final');

    /*
     * Aquí el encargo 4 llega con su predicado YA cumplido —el punto se puso
     * antes de tiempo— y aun así no se cierra solo: el motor corrige cuando pasa
     * una transacción, y entre el final de la celebración y el cambio siguiente
     * no pasa ninguna. No es un callejón, y por eso queda escrito en vez de
     * arreglado: el niño hace lo que le dicen —teclear el punto— y con eso ya
     * hay transacción y el encargo se cierra. Sólo sería un defecto si el
     * encargo no se pudiera tocar, y éste se toca con el teclado.
     */
    cursorAlFinalDe('1.');
    escribir('.');
    await celebrar();
    expect(encargo()).toBe('El título, más fuerte');
  });

  it('encargo 6 · escribir encima del título no cuenta como la segunda oración', async () => {
    // Es el destrozo que el guion dice haber medido: el encargo 5 deja el título
    // pintado y quien teclea sin volver a hacer clic lo borra. Sin el `slice(1)`
    // de `cuantasOraciones`, esa oración contaba y la clase entregaba la
    // insignia con cien puntos sobre una hoja sin título.
    const partida = await jugarDesdeLaPortada(Lab);
    await hastaEl(5);
    expect(encargo()).toBe('Ahora tú solo');

    seleccionar('Mis oraciones');
    escribirEncima('Mi perro se llama Canela.');
    await celebrar();
    expect(encargo()).toBe('Ahora tú solo');
    expect(partida.onComplete).not.toHaveBeenCalled();
  });
});
