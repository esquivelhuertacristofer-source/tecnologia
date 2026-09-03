/**
 * `of-word-estilos-e-indice` · «Estilos y tabla de contenido» — recorrido de
 * punta a punta. Ocho encargos, dos controles propios y el panel de Navegación.
 *
 * Es la clase de la sala con más encargos encadenados sobre EL MISMO renglón: el
 * 4 le sube el tamaño, el 6 le pone el estilo y el 7 lo busca en el índice. Ésa
 * es exactamente la forma que tiene una clase imposible de terminar —el motor
 * relee en cada tecla los encargos ya palomeados y retrocede al primero que deje
 * de valer—, así que era la primera candidata a estar rota.
 *
 * ── LO QUE ENCONTRÓ EL RECORRIDO ────────────────────────────────────────────
 *
 * **No lo está, y la cadena aguanta por una razón concreta**: el estilo del
 * encargo 6 se pone con `setBlockType`, que cambia el TIPO del bloque y conserva
 * su contenido con sus marcas, así que la marca de 14 puntos del encargo 4 sigue
 * cubriendo el renglón entero después. Y el encargo 8 renombra el ÚLTIMO título
 * y no el que vigilan el 6 y el 7, que es lo que su propia cabecera dice haber
 * elegido a conciencia. La partida limpia saca 100.
 *
 * **Pero hay una forma de jugarla que sí retrocede, y la encontró esta prueba al
 * escribirse.** Desde que el índice existe, «Lo que aprendimos» está DOS veces en
 * el documento, y la de arriba —la entrada del índice, en la hoja 1— es la que
 * cualquiera encuentra primero. Escribir encima de esa entrada saca ese renglón
 * del tramo del índice, `bloquesOriginales` corre uno, y el renglón «11» que
 * vigilan tres encargos deja de ser el que era: el panel salta de «7 de 8» a
 * «4 de 8» acusando al alumno de haber deshecho algo. La flecha ↶ lo devuelve
 * todo, y eso es lo que mide la tercera prueba. Queda escrito porque el día que
 * alguien toque `spanDelIndice` tiene que saber que esta salida existe.
 *
 * Y lo que se comprueba en la primera prueba, porque es lo que rompería la clase
 * el día que alguien mueva una línea: que después del encargo 8 los cuatro
 * predicados de documento anteriores siguen en pie, o sea que nadie retrocede.
 */

import { fireEvent } from '@testing-library/react';
import { TextSelection } from 'prosemirror-state';
import { Lab } from '@/components/activities/office/word/estilos-e-indice/Lab';
import {
  avisos,
  bloques,
  boton,
  celebrar,
  confirmar,
  cursorEn,
  deshacer,
  elegir,
  encargo,
  escribirEncima,
  irAPestana,
  jugar,
  jugarDesdeLaPortada,
  pulsar,
  seleccionar,
  seleccionarBloque,
  seTermino,
  textoDelDocumento,
  vista,
} from './ayuda-word';

/*
 * `Element.prototype.scrollIntoView` —que el panel de Navegación de esta clase
 * llama en su primer encargo— estuvo tapado aquí a mano unas horas, con la nota
 * de que subiera a `jest.setup.ts` «con sus dos hermanos». Subió el mismo día:
 * lo pedían tres clases desde tres sitios distintos, y ahí está contado. Un
 * hueco del entorno parcheado en el archivo de quien lo encuentra vuelve a
 * aparecer en el archivo siguiente.
 */

/**
 * El renglón del REPORTE que empieza así, no el del índice.
 *
 * Hace falta un buscador propio porque en cuanto el índice existe hay dos
 * renglones que empiezan por las mismas palabras, y el de arriba —el de la
 * hoja 1— es la entrada del índice. `bloqueQueEmpiezaPor` devuelve ése.
 */
function renglonDelReporte(inicio: string) {
  const normal = (s: string) => s.trim().toLowerCase();
  return bloques()
    .filter((b) => !/\.{3,}\s*\d+/.test(b.texto))
    .find((b) => normal(b.texto).startsWith(normal(inicio)));
}

/** El nivel de un título, que `bloques()` no trae: se le pregunta al documento. */
function nivelDe(inicio: string): number | undefined {
  const b = renglonDelReporte(inicio);
  if (!b) return undefined;
  return vista().state.doc.child(b.i).attrs.nivel as number | undefined;
}

/* ── el panel de Navegación, que es de la clase y no de la cinta ────────────*/

/** Salta a una sección desde el panel de la izquierda, como el encargo 1 manda. */
function saltarEnNavegacion(texto: string) {
  const entradas = Array.from(document.querySelectorAll<HTMLElement>('.ei-nav-entrada'));
  const cual = entradas.find((e) => (e.textContent ?? '').trim() === texto);
  if (!cual) throw new Error(`la Navegación no lista «${texto}» — hay: ${entradas.map((e) => e.textContent).join(' | ')}`);
  fireEvent.click(cual);
}

/** Los títulos que el panel enseña ahora mismo. Es el instrumento de la clase. */
const enLaNavegacion = (): string[] =>
  Array.from(document.querySelectorAll<HTMLElement>('.ei-nav-entrada')).map((e) => (e.textContent ?? '').trim());

/** Los renglones del índice que la máquina escribió dentro del documento. */
const entradasDelIndice = (): string[] =>
  textoDelDocumento()
    .split('\n')
    .filter((l) => /\.{3,}\s*\d+/.test(l));

/* ── los ocho encargos, como los haría un alumno que atiende ─────────────────*/

function paso1() {
  saltarEnNavegacion('Cómo la regamos');
  cursorEn('Cómo la regamos');
  confirmar('Ya lo vi');
}

const paso2 = () => elegir('Referencias');

/** Encargo 3 · el cursor en el renglón vacío y el índice lo escribe la máquina. */
function paso3() {
  seleccionarBloque(2);
  irAPestana('referencias');
  pulsar('tdc');
}

/** Encargo 4 · el título «a mano»: seleccionar el renglón entero y ponerlo en 14. */
function paso4() {
  irAPestana('inicio');
  seleccionar('La semana de las vacaciones');
  fireEvent.change(boton('fuente-tamano'), { target: { value: '14' } });
}

function paso5() {
  irAPestana('referencias');
  pulsar('actualizar-tdc');
}

/** Encargo 6 · lo que de verdad convierte un renglón en título. */
function paso6() {
  irAPestana('inicio');
  cursorEn('La semana de las vacaciones');
  pulsar('titulo2');
}

const paso7 = () => paso5();

/**
 * Marca el texto del ÚLTIMO título del reporte, el de abajo del todo.
 *
 * No vale `seleccionar('Lo que aprendimos')`, y ahí está media clase: en cuanto
 * el índice existe, el primer renglón del documento que empieza por esas
 * palabras es **la entrada del índice**, que está en la hoja 1 y muy por encima
 * del título de verdad. Ver la tercera prueba: escribir encima de esa entrada es
 * el accidente que el recorrido encontró.
 */
function seleccionarElUltimoTitulo() {
  const titulos = bloques().filter((b) => b.tipo === 'titulo');
  const b = titulos[titulos.length - 1];
  const v = vista();
  v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, b.desde + 1, b.hasta - 1)));
}

/** Encargo 8 · renombrar el último título y mirar las dos listas a la vez. */
function paso8() {
  seleccionarElUltimoTitulo();
  escribirEncima('Lo que nos falta');
  confirmar('Ya lo vi');
}

const PASOS = [paso1, paso2, paso3, paso4, paso5, paso6, paso7, paso8];
const hastaEl = (n: number) => jugar(PASOS.slice(0, n));

describe('of-word-estilos-e-indice', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.useFakeTimers({ advanceTimers: true });
  });
  afterEach(() => jest.useRealTimers());

  it('la clase entera se termina, y una partida limpia saca 100', async () => {
    const partida = await jugarDesdeLaPortada(Lab);

    await jugar(PASOS);

    expect(seTermino()).toBe(true);

    // El renglón que la clase entera persigue acabó siendo un título de verdad,
    // y del nivel que toca: es una parte DENTRO de «Cómo la regamos», no una
    // sección grande, y en eso se le va media lección a la clase.
    expect(renglonDelReporte('La semana de las vacaciones')?.tipo).toBe('titulo');
    expect(nivelDe('La semana de las vacaciones')).toBe(2);
    // …y por eso está en las DOS listas: la del panel y la que escribió la máquina.
    expect(enLaNavegacion()).toContain('La semana de las vacaciones');
    expect(entradasDelIndice().some((l) => l.startsWith('La semana de las vacaciones'))).toBe(true);
    // Y la última prueba de la clase: el índice es una foto vieja del documento.
    expect(enLaNavegacion()).toContain('Lo que nos falta');
    expect(entradasDelIndice().some((l) => l.startsWith('Lo que aprendimos'))).toBe(true);

    expect(partida.onComplete).toHaveBeenCalledTimes(1);
    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
  });

  it('encargo 4 · el tamaño con el cursor suelto no cambia nada, y el índice no se entera del renglón grande', async () => {
    await jugarDesdeLaPortada(Lab);
    await hastaEl(3);
    expect(encargo()).toBe('Hazlo como lo haría cualquiera');

    // JUGAR MAL · elegir 14 sin seleccionar, que es el tropiezo del tema.
    irAPestana('inicio');
    cursorEn('La semana de las vacaciones');
    fireEvent.change(boton('fuente-tamano'), { target: { value: '14' } });
    await celebrar();
    expect(encargo()).toBe('Hazlo como lo haría cualquiera');

    paso4();
    await celebrar();
    expect(encargo()).toBe('Pregúntale al programa');

    // La lección: por muy grande que se vea, para el programa sigue sin ser título.
    expect(enLaNavegacion()).not.toContain('La semana de las vacaciones');
    await jugar([paso5]);
    expect(entradasDelIndice().some((l) => l.startsWith('La semana de las vacaciones'))).toBe(false);
  });

  /**
   * EL HALLAZGO DEL RECORRIDO, y por poco no se ve: la primera versión de esta
   * prueba escribía encima de la entrada del índice **sin querer**, porque
   * «Lo que aprendimos» aparece dos veces en el documento y la de arriba es la
   * del índice. Terminó el encargo 8 y el panel saltó de «7 de 8» a «4 de 8».
   *
   * La causa está en `indice.ts` y es fina: el índice se reconoce como un TRAMO,
   * y el tramo se estira mientras siga habiendo renglones con forma de índice.
   * Reventar la ÚLTIMA entrada la deja fuera del tramo, así que ese renglón pasa
   * a contar como parte del reporte, `bloquesOriginales` corre uno y el renglón
   * «11» —el que vigilan los encargos 4, 6 y 7— deja de ser el que era. El
   * maestro acusa al alumno de haber deshecho algo que nunca deshizo.
   *
   * No es un callejón sin salida y ésa es la mitad que importa: la flecha ↶
   * devuelve la entrada, el tramo vuelve a cerrarse y los tres encargos se
   * repalomean solos en cuanto el documento vuelve a estar como estaba. Se deja
   * medido aquí para que el día que alguien toque `spanDelIndice` se entere de
   * que esta salida existe.
   */
  it('encargo 8 · escribir encima de la entrada del índice devuelve al alumno atrás, y la flecha ↶ es la salida', async () => {
    await jugarDesdeLaPortada(Lab);
    await hastaEl(7);
    expect(encargo()).toBe('Una última prueba');

    // JUGAR MAL · el título se llama igual que su entrada del índice, y la
    // entrada está mucho más arriba: es la que se encuentra primero.
    seleccionar('Lo que aprendimos');
    escribirEncima('Lo que nos falta');
    await celebrar();
    expect(encargo()).toBe('Hazlo como lo haría cualquiera');
    expect(avisos()).toContain('Deshiciste esto');

    // La salida: la flecha de Deshacer. El índice vuelve a estar entero y los
    // encargos se repalomean solos, sin volver a pulsar un botón de la cinta.
    deshacer();
    await celebrar();
    expect(entradasDelIndice().some((l) => l.startsWith('Lo que aprendimos'))).toBe(true);
    expect(encargo()).toBe('Pregúntale al programa');
  });
});
