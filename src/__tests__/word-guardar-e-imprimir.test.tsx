/**
 * `of-word-guardar-e-imprimir` · «Guardar, imprimir y PDF» — recorrido de punta a
 * punta. Ocho encargos, tres controles propios y dos cuadros de diálogo.
 *
 * Es la clase con más piezas fuera del motor de toda la sala: el escritorio
 * simulado —dónde quedaron los archivos— vive en un almacén de módulo, y dos de
 * los ocho encargos se resuelven DENTRO de un cuadro, sin tocar la cinta. Por eso
 * era la candidata natural a estar rota sin que nadie se enterara: sus predicados
 * no leen el documento, leen ese almacén.
 *
 * ── LO QUE ENCONTRÓ EL RECORRIDO ────────────────────────────────────────────
 *
 * **Se termina, y la partida limpia saca 100.** El descuento a mano de dos puntos
 * que su `Lab.tsx` llevaba escrito —`CLICS_DE_CUADRO`— ya está en 0 desde que el
 * 15-ago-2026 la ventana dejó de cobrar tropiezo por pulsar el control que su
 * propio señalador nombra, que es justo lo que aquel comentario pedía. Medido
 * aquí: cero tropiezos en una pasada impecable, con los tres clics de cuadro
 * dados exactamente donde la clase los manda dar.
 *
 * **El almacén del escritorio es de MÓDULO, y el laboratorio lo reinicia al
 * montar.** Eso hace que dos partidas en el mismo archivo de pruebas no se
 * estorben; lo que sí estorba es `localStorage`, porque el encargo 3 guarda de
 * verdad y la partida siguiente abriría el documento con el nombre del alumno ya
 * escrito —y el encargo 1 dado por hecho antes de empezar—. Se limpia en cada
 * prueba, que es lo que sería una máquina distinta del salón.
 */

import { fireEvent } from '@testing-library/react';
import { Lab } from '@/components/activities/office/word/guardar-e-imprimir/Lab';
import {
  celebrar,
  cursorAlFinalDe,
  elegir,
  encargo,
  escribir,
  jugar,
  jugarDesdeLaPortada,
  pulsar,
  seTermino,
  textoDelDocumento,
} from './ayuda-word';

/* ── el cuadro de diálogo, que no es de la cinta y necesita su propio mando ──*/

const campo = (sel: string): HTMLElement => {
  const el = document.querySelector<HTMLElement>(sel);
  if (!el) throw new Error(`no hay ningún campo «${sel}» en el cuadro`);
  return el;
};

/** Un botón del cuadro de diálogo, por lo que dice. */
function botonDelCuadro(texto: string): HTMLElement {
  const todos = Array.from(document.querySelectorAll<HTMLElement>('.gi-caja button'));
  const cual = todos.find((b) => (b.textContent ?? '').trim() === texto);
  if (!cual) throw new Error(`no hay botón «${texto}» — hay: ${todos.map((b) => b.textContent).join(' | ')}`);
  return cual;
}

/** Una carpeta de la lista de la izquierda. */
function abrirCarpeta(nombre: string) {
  const todas = Array.from(document.querySelectorAll<HTMLElement>('.gi-carpeta'));
  const cual = todas.find((c) => (c.textContent ?? '').includes(nombre));
  if (!cual) throw new Error(`no hay carpeta «${nombre}»`);
  fireEvent.click(cual);
}

/** Lo que la clase apunta bajo el documento cuando algo se guardó o se imprimió. */
const recado = (): string => document.querySelector('.gi-recado')?.textContent ?? '';

/* ── los ocho encargos, como los haría un alumno que atiende ─────────────────*/

/** Encargo 1 · el nombre del alumno al final del aviso. */
function paso1() {
  cursorAlFinalDe('Nombre de quien llenó este aviso:');
  escribir(' Cristofer Esquivel');
}

const paso2 = () => elegir('todavía no está dentro de ningún archivo');
const paso3 = () => pulsar('gi-guardar');
const paso4 = () => elegir('Guardar como');
const paso5 = () => pulsar('gi-guardar-como');

/** Encargo 6 · las DOS cosas: el nombre y la carpeta. */
function paso6() {
  fireEvent.change(campo('#gi-nombre'), { target: { value: 'Aviso museo del agua' } });
  abrirCarpeta('Escuela');
  fireEvent.click(botonDelCuadro('Guardar'));
}

/** Encargo 7 · el mismo cuadro, cambiando sólo el tipo. */
function paso7() {
  pulsar('gi-guardar-como');
  fireEvent.change(campo('#gi-tipo'), { target: { value: 'pdf' } });
  fireEvent.click(botonDelCuadro('Guardar'));
}

/** Encargo 8 · treinta copias, contadas antes de gastar el papel. */
function paso8() {
  pulsar('gi-imprimir');
  fireEvent.change(campo('#gi-copias'), { target: { value: '30' } });
  fireEvent.click(document.querySelector('.gi-lanzar-boton') as HTMLElement);
}

const PASOS = [paso1, paso2, paso3, paso4, paso5, paso6, paso7, paso8];
const hastaEl = (n: number) => jugar(PASOS.slice(0, n));

describe('of-word-guardar-e-imprimir', () => {
  beforeEach(() => {
    // El encargo 3 guarda DE VERDAD en este equipo. Sin limpiar, la partida
    // siguiente abriría el aviso con el nombre del alumno ya puesto.
    window.localStorage.clear();
    jest.useFakeTimers({ advanceTimers: true });
  });
  afterEach(() => jest.useRealTimers());

  it('la clase entera se termina, y una partida limpia saca 100', async () => {
    const partida = await jugarDesdeLaPortada(Lab);

    await jugar(PASOS);

    expect(seTermino()).toBe(true);
    // El aviso llegó al final con lo que el alumno le puso y sin perder nada.
    expect(textoDelDocumento()).toContain('Cristofer Esquivel');
    expect(textoDelDocumento()).toContain('Museo del Agua');
    // Treinta copias de dos hojas es lo que la clase manda contar en voz alta.
    expect(recado()).toContain('30 copias');

    expect(partida.onComplete).toHaveBeenCalledTimes(1);
    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
  });

  it('encargo 6 · cambiar sólo el nombre deja el archivo donde lo puso la computadora', async () => {
    await jugarDesdeLaPortada(Lab);
    await hastaEl(5);
    expect(encargo()).toBe('Ahora rellénalo');

    // JUGAR MAL · el error del tema: nombre nuevo, carpeta la de siempre.
    fireEvent.change(campo('#gi-nombre'), { target: { value: 'Aviso museo del agua' } });
    fireEvent.click(botonDelCuadro('Guardar'));
    await celebrar();
    expect(encargo()).toBe('Ahora rellénalo');
    // Y el cuadro lo dice en el momento de cometerlo, no después.
    expect(recado()).toContain('Mis documentos');

    // La salida: volver a abrirlo y elegir la carpeta, que es la otra mitad.
    paso5();
    await celebrar();
    paso6();
    await celebrar();
    expect(encargo()).toBe('Una copia que se pueda mandar');
  });

  it('encargo 8 · imprimir con el número que venía puesto no cierra el encargo', async () => {
    await jugarDesdeLaPortada(Lab);
    await hastaEl(7);
    expect(encargo()).toBe('Cuenta el papel antes de gastarlo');

    // JUGAR MAL · abrir Imprimir y darle al botón grande sin mirar las copias.
    pulsar('gi-imprimir');
    fireEvent.click(document.querySelector('.gi-lanzar-boton') as HTMLElement);
    await celebrar();
    expect(encargo()).toBe('Cuenta el papel antes de gastarlo');
    expect(seTermino()).toBe(false);

    paso8();
    await celebrar();
    expect(seTermino()).toBe(true);
  });
});
