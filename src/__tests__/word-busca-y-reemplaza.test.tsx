/**
 * `of-word-busca-y-reemplaza` · «Busca y reemplaza» — recorrido de punta a punta.
 * Ocho encargos, dos controles propios y el cuadro «Buscar y reemplazar».
 *
 * Es la única clase de la sala cuyo documento se rompe A PROPÓSITO y se vuelve a
 * arreglar: el encargo 3 manda destrozarlo con un «Reemplazar todos» a ciegas y
 * el 5 manda devolverlo con la flecha ↶. Eso es exactamente lo que el motor
 * castiga —`primerDeshecho` retrocede al primer encargo de documento que deje de
 * cumplirse—, así que era la más expuesta de las cuatro.
 *
 * ── LO QUE ENCONTRÓ EL RECORRIDO ────────────────────────────────────────────
 *
 * **Se termina, y la partida limpia saca 100.** Aguanta por el pestillo que
 * `guion.ts` describe: los dos encargos que la clase manda revertir no preguntan
 * «¿está roto ahora?» sino «¿llegó a estar roto?». Se lee del documento —nunca de
 * un botón— y se recuerda, así que deshacer no los despaloma. Aquí queda medido
 * lo que ese comentario sólo afirmaba: al terminar la clase, los cuatro
 * predicados de documento siguen en pie y el panel no retrocede ni una vez.
 *
 * **Cero tropiezos, y no por suerte.** De los cinco gestos de acción, sólo uno
 * pasa por la cinta —el botón «Buscar» del encargo 1—. Los otros cuatro viven
 * dentro del cuadro, que es un accesorio y no un control de la cinta, así que no
 * pasan por la cuenta de tropiezos de la ventana. Es la decisión que `guion.ts`
 * dejó escrita —«ningún encargo manda pulsar un botón de la cinta que no sea el
 * suyo»— y es lo que sostiene el 100.
 *
 * **Y una excepción al SALIR, que sólo se ve jugando la clase entera.** Montar
 * la clase y desmontarla reventaba con «Cannot read properties of null (reading
 * 'matchesNode')»: la limpieza del efecto de las marcas amarillas le ordenaba
 * algo al editor de ProseMirror cuando el editor ya estaba destruido. No es un
 * caso de laboratorio —el último encargo se juega con el cuadro abierto, así que
 * todo alumno que termine y pulse «Salir del laboratorio» pasaba por ahí— y no
 * lo atrapa nadie, porque una excepción en la limpieza de un efecto sube hasta
 * el error global. Arreglado en `PanelBuscar.tsx`, con el porqué escrito allí.
 * Las tres pruebas de este archivo lo cazan sin pedirlo: el desmontaje
 * automático de la biblioteca de pruebas es exactamente el gesto de salir.
 */

import { fireEvent } from '@testing-library/react';
import { Lab } from '@/components/activities/office/word/busca-y-reemplaza/Lab';
import {
  celebrar,
  confirmar,
  deshacer,
  elegir,
  encargo,
  jugar,
  jugarDesdeLaPortada,
  pulsar,
  seTermino,
  textoDelDocumento,
} from './ayuda-word';

/* ── el cuadro de diálogo, que es de la clase y no de la cinta ──────────────*/

const enElCuadro = (control: string): HTMLElement => {
  const el = document.querySelector<HTMLElement>(`.bur-caja [data-control="${control}"]`);
  if (!el) throw new Error(`el cuadro no tiene ningún «${control}» ahora mismo`);
  return el;
};

const escribirEn = (control: string, texto: string) =>
  fireEvent.change(enElCuadro(control), { target: { value: texto } });

/** Marca una de las dos casillas que «Más >>» esconde. */
const marcarCasilla = (control: string) =>
  fireEvent.click(enElCuadro(control).querySelector('input') as HTMLElement);

/** Lo que el cuadro contesta debajo de los botones. Es lo que el encargo 4 lee. */
const recadoDelCuadro = (): string => document.querySelector('.bur-recado')?.textContent ?? '';

/** Cuántas veces sale una palabra entera en la hoja. */
const cuantas = (patron: RegExp): number => (textoDelDocumento().match(patron) ?? []).length;

/* ── los ocho encargos, como los haría un alumno que atiende ─────────────────*/

const paso1 = () => pulsar('buscar');

/** Encargo 2 · escribir «sol» y mirar lo que se pinta de amarillo. */
function paso2() {
  escribirEn('bur-termino', 'sol');
  elegir('Doce: el nombre Sol');
}

/** Encargo 3 · el destrozo, que en esta clase es el trabajo. */
function paso3() {
  fireEvent.click(enElCuadro('bur-pestana-reemplazar'));
  escribirEn('bur-termino', 'sol');
  escribirEn('bur-reemplazo', 'luna');
  fireEvent.click(enElCuadro('bur-todos'));
}

const paso4 = () => elegir('Hizo 12 cambios, y «solamente» quedó escrito «lunaamente»');

const paso5 = () => deshacer();

/** Encargo 6 · lo que «Más >>» escondía. */
function paso6() {
  fireEvent.click(enElCuadro('bur-mas'));
  elegir('Sólo palabras completas');
}

/** Encargo 7 · el mismo reemplazo, ahora con las dos casillas puestas. */
function paso7() {
  marcarCasilla('bur-palabras');
  marcarCasilla('bur-mayusculas');
  escribirEn('bur-termino', 'Sol');
  escribirEn('bur-reemplazo', 'Luna');
  fireEvent.click(enElCuadro('bur-todos'));
}

/** Encargo 8 · saltar a la hoja 2 sin arrastrar la barra. */
function paso8() {
  fireEvent.click(enElCuadro('bur-pestana-ir'));
  escribirEn('bur-pagina', '2');
  fireEvent.click(enElCuadro('bur-ir'));
  confirmar('Ya lo vi');
}

const PASOS = [paso1, paso2, paso3, paso4, paso5, paso6, paso7, paso8];
const hastaEl = (n: number) => jugar(PASOS.slice(0, n));

describe('of-word-busca-y-reemplaza', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.useFakeTimers({ advanceTimers: true });
  });
  afterEach(() => jest.useRealTimers());

  it('la clase entera se termina, y una partida limpia saca 100', async () => {
    const partida = await jugarDesdeLaPortada(Lab);

    await jugar(PASOS);

    expect(seTermino()).toBe(true);

    // Ocho cambios y no doce: el personaje se llama Luna, el sol del narrador
    // sigue siendo el astro y «solamente» quedó entero las dos veces.
    expect(cuantas(/\bLuna\b/g)).toBe(8);
    expect(cuantas(/\bsol\b/g)).toBe(2);
    expect(cuantas(/solamente/g)).toBe(2);
    expect(textoDelDocumento()).not.toContain('lunaamente');
    expect(textoDelDocumento()).not.toMatch(/\bSol\b/);

    expect(partida.onComplete).toHaveBeenCalledTimes(1);
    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
  });

  it('encargos 3 y 5 · el destrozo y su vuelta atrás, medidos en la hoja', async () => {
    await jugarDesdeLaPortada(Lab);
    await hastaEl(2);
    expect(encargo()).toBe('Cámbialo todo de un jalón');

    paso3();
    await celebrar();
    // Doce cambios donde el alumno quería ocho, y dos palabras rotas por dentro.
    expect(recadoDelCuadro()).toContain('12 reemplazos');
    expect(cuantas(/lunaamente/g)).toBe(2);
    expect(encargo()).toBe('Lee lo que acabas de hacer');

    await jugar([paso4]);
    // UN solo deshacer devuelve los doce: es la propiedad que hace manejable la
    // herramienta, y es lo que el encargo 5 manda comprobar con los ojos.
    paso5();
    await celebrar();
    expect(textoDelDocumento()).not.toContain('lunaamente');
    expect(cuantas(/\bSol\b/g)).toBe(8);
    expect(encargo()).toBe('¿Qué lo habría evitado?');
  });

  it('encargo 7 · con una sola casilla el reemplazo sigue mal, y el encargo no se cierra', async () => {
    await jugarDesdeLaPortada(Lab);
    await hastaEl(6);
    expect(encargo()).toBe('Ahora sí, hazlo bien');

    // JUGAR MAL · sólo «Sólo palabras completas»: ya no rompe «solamente», pero
    // sin coincidir mayúsculas se lleva por delante los dos soles del narrador.
    marcarCasilla('bur-palabras');
    escribirEn('bur-termino', 'sol');
    escribirEn('bur-reemplazo', 'Luna');
    fireEvent.click(enElCuadro('bur-todos'));
    await celebrar();
    expect(textoDelDocumento()).not.toContain('lunaamente');
    expect(cuantas(/\bLuna\b/g)).toBe(10);
    expect(encargo()).toBe('Ahora sí, hazlo bien');

    // La salida que la pista escribe: deshacer y volver con las DOS marcadas.
    deshacer();
    await celebrar();
    paso7();
    await celebrar();
    expect(encargo()).toBe('Salta sin arrastrar');
    expect(cuantas(/\bLuna\b/g)).toBe(8);
  });
});
