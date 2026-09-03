/**
 * `n10-portafolio-y-cv` · «Siete segundos» (doc §49.5). N10 · «Capstone y
 * portafolio», montada sobre `VentanaTextos` tal cual.
 *
 * ── ES LA PRIMERA PRUEBA DE ESTE REPO QUE JUEGA UNA CLASE DE WORD ───────────
 *
 * Las diecinueve clases de la sala de Word están cerradas y ninguna tiene un
 * recorrido de punta a punta: hay `motor-textos.test.ts` (el motor) y
 * `tecnia-textos.test.ts` (la cinta), y nada que abra una ventana y termine una
 * clase. Las veintitrés de Excel sí lo tienen, una cada una, y ésa es la
 * diferencia que dejó escrita la sala de Excel al cerrarse: **el motor sólo
 * está probado hasta donde llegan las clases que se han jugado**.
 *
 * Lo que faltaba para poder escribirla es una manera de mover el cursor: en
 * jsdom, `document.createRange()` + `Selection.addRange()` **no llega** al
 * estado de ProseMirror —el `DOMObserver` no se entera—, así que un botón de
 * estilo se aplica siempre sobre la selección de fábrica, que es el principio
 * del documento. La puerta ya estaba abierta y sin usar: `useEditor.ts` publica
 * la vista en `window.__vistaTextos` fuera de producción, con el comentario «la
 * vista, a mano, para diagnosticar con el instrumento del motor y no con una
 * copia que se queda atrás». Desde ahí se puede poner una `TextSelection` de
 * verdad, que es exactamente lo que hace un clic del alumno.
 *
 * Con eso, se juega **mal a propósito** —el estilo sobre el renglón equivocado,
 * la negrita en vez del estilo, tres rótulos de cuatro, borrar sólo medio
 * Pasatiempos, recortar el objetivo hasta que no diga nada— y se recorre la
 * clase entera hasta la pantalla de cierre.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import VentanaTextos from '@/components/office/VentanaTextos';
import { CINTA_BASICO } from '@/components/activities/office/tecniaTextos';
import {
  CORREO_NUEVO,
  GUION_PORTAFOLIO_Y_CV,
  OBJETIVO_CORTO,
} from '@/components/activities/office/word/portafolio-y-cv/guion';

/*
 * Los huecos de jsdom que hacían falta para jugar una clase de Word
 * —`Range.getClientRects`, `Range.getBoundingClientRect` y `Element.scrollTo`—
 * estaban tapados aquí a mano, con la nota de que subirían a `jest.setup.ts` «el
 * día que la sala de Word tenga sus diecinueve recorridos». **Subieron el
 * 15-ago-2026**, con ese recorrido: ahí está la explicación completa.
 */

/* ── el mando a distancia del editor ────────────────────────────────────────*/

const vista = (): EditorView =>
  (window as unknown as { __vistaTextos: EditorView }).__vistaTextos;

/** Los bloques de primer nivel del documento, con su posición de inicio. */
function bloques(): Array<{ i: number; tipo: string; texto: string; desde: number; hasta: number }> {
  const { doc } = vista().state;
  const salida: Array<{ i: number; tipo: string; texto: string; desde: number; hasta: number }> = [];
  doc.forEach((nodo, offset, i) => {
    salida.push({ i, tipo: nodo.type.name, texto: nodo.textContent, desde: offset, hasta: offset + nodo.nodeSize });
  });
  return salida;
}

const bloqueQueEmpiezaPor = (inicio: string) =>
  bloques().find((b) => b.texto.trim().toLowerCase().startsWith(inicio.toLowerCase()));

/** Selecciona el bloque entero, como un triple clic del alumno. */
function seleccionar(inicio: string) {
  const b = bloqueQueEmpiezaPor(inicio);
  if (!b) throw new Error(`no hay ningún bloque que empiece por «${inicio}»`);
  const v = vista();
  v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, b.desde + 1, b.hasta - 1)));
}

/** Selecciona desde el principio de un bloque hasta el final de otro. */
function seleccionarDesdeHasta(primero: string, ultimo: string) {
  const a = bloqueQueEmpiezaPor(primero);
  const z = bloqueQueEmpiezaPor(ultimo);
  if (!a || !z) throw new Error('faltan bloques para seleccionar');
  const v = vista();
  v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, a.desde + 1, z.hasta - 1)));
}

/** Escribe encima de lo seleccionado, como teclear con texto marcado. */
function escribirEncima(texto: string) {
  const v = vista();
  const { from, to } = v.state.selection;
  v.dispatch(v.state.tr.insertText(texto, from, to));
}

/** Borra lo seleccionado, como pulsar Supr con texto marcado. */
function borrarSeleccion() {
  const v = vista();
  const { from, to } = v.state.selection;
  v.dispatch(v.state.tr.delete(from - 1, to + 1));
}

/** Reemplaza un trozo suelto de un bloque, sin tocar el resto del renglón. */
function reemplazarTrozo(bloqueInicio: string, trozo: string, nuevo: string) {
  const b = bloqueQueEmpiezaPor(bloqueInicio);
  if (!b) throw new Error(`no hay bloque «${bloqueInicio}»`);
  const dentro = b.texto.indexOf(trozo);
  if (dentro < 0) throw new Error(`«${trozo}» no está en ese bloque`);
  const v = vista();
  const desde = b.desde + 1 + dentro;
  v.dispatch(v.state.tr.insertText(nuevo, desde, desde + trozo.length));
}

/* ── la ventana ─────────────────────────────────────────────────────────────*/

const boton = (control: string): HTMLElement =>
  document.querySelector(`[data-control="${control}"]`) as HTMLElement;

const encargo = (): string => document.querySelector('.txtw-encargo h3')?.textContent ?? '';

/**
 * La celebración de Word dura más que la de Excel.
 *
 * Las veintitrés pruebas de `VentanaHojas` adelantan 1 000 ms y con eso les
 * basta. Aquí no: con 1 000 el cartel de «¡Eso es!» sigue puesto en el sitio
 * del encargo, y la prueba lee ese texto en vez del título del encargo
 * siguiente — que es exactamente el falso negativo con el que empezó este
 * archivo, y que parecía un botón que no funcionaba.
 */
async function celebrar() {
  await act(async () => {
    jest.advanceTimersByTime(2500);
  });
}

async function abrir(onTerminado?: jest.Mock) {
  const salida = render(
    <VentanaTextos cinta={CINTA_BASICO} guion={GUION_PORTAFOLIO_Y_CV} onTerminado={onTerminado} />,
  );
  await waitFor(() => expect(document.querySelector('.txtw')).not.toBeNull());
  return salida;
}

async function abrirYEmpezar(onTerminado?: jest.Mock) {
  const salida = await abrir(onTerminado);
  const empezar = Array.from(document.querySelectorAll('button')).find((b) =>
    (b.textContent ?? '').startsWith('Abrir el documento'),
  );
  fireEvent.click(empezar as HTMLElement);
  await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());
  return salida;
}

/* ── los ocho encargos ──────────────────────────────────────────────────────*/

const paso1 = () => fireEvent.click(screen.getByText('Ya lo miré'));

function paso2() {
  seleccionar('Sofía Aranda');
  fireEvent.click(boton('titulo1'));
}

function paso3() {
  for (const r of ['Objetivo profesional', 'Experiencia', 'Formación', 'Habilidades']) {
    seleccionar(r);
    fireEvent.click(boton('titulo2'));
  }
}

const paso4 = () => reemplazarTrozo('sofi_lachida2007', 'sofi_lachida2007@hotmail.com', CORREO_NUEVO);

function paso5() {
  seleccionar('Apoyé en las pruebas');
  fireEvent.click(boton('vinetas'));
  seleccionar('Capturé el catálogo');
  fireEvent.click(boton('vinetas'));
}

/**
 * El cuerpo del objetivo, **buscado por su sitio y no por su texto**.
 *
 * Es el renglón que va justo debajo del rótulo «Objetivo profesional», diga lo
 * que diga: en cuanto el alumno lo reescribe una vez —y jugando mal se
 * reescribe tres— buscarlo por cómo empezaba deja de encontrarlo. Es la misma
 * regla que `consultas.ts` dejó escrita para el título de un documento
 * (`indiceDelPrimerBloqueConTexto`) y la misma que usa el predicado de este
 * encargo en el guion.
 */
function seleccionarElCuerpoDelObjetivo() {
  const todos = bloques();
  const i = todos.findIndex((b) => b.texto.trim().toLowerCase().startsWith('objetivo profesional'));
  const cuerpo = todos[i + 1];
  if (i < 0 || !cuerpo) throw new Error('no encuentro el cuerpo del objetivo');
  const v = vista();
  v.dispatch(
    v.state.tr.setSelection(TextSelection.create(v.state.doc, cuerpo.desde + 1, cuerpo.hasta - 1)),
  );
}

function paso6() {
  seleccionarElCuerpoDelObjetivo();
  escribirEncima(OBJETIVO_CORTO);
}

function paso7() {
  seleccionarDesdeHasta('Pasatiempos', 'Me gusta ver series');
  borrarSeleccion();
}

const paso8 = () => fireEvent.click(screen.getByText(/40 errores documentados y un buscador/));

const PASOS = [paso1, paso2, paso3, paso4, paso5, paso6, paso7, paso8];

async function jugar(desde: number, hasta: number) {
  for (let i = desde; i <= hasta; i += 1) {
    PASOS[i - 1]();
    await celebrar();
  }
}

const hastaEl = (n: number) => jugar(1, n);

/* ── se pinta ───────────────────────────────────────────────────────────────*/

describe('VentanaTextos · n10-portafolio-y-cv se pinta', () => {
  it('la portada anuncia el tema y el documento abre entero en Normal', async () => {
    await abrir();
    expect(screen.getByText('El currículum, leído por alguien que tiene prisa')).not.toBeNull();
    const empezar = Array.from(document.querySelectorAll('button')).find((b) =>
      (b.textContent ?? '').startsWith('Abrir el documento'),
    );
    fireEvent.click(empezar as HTMLElement);
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

    // Ni un título, ni una viñeta: la pared gris de los siete segundos.
    expect(bloques().filter((b) => b.tipo === 'titulo')).toHaveLength(0);
    expect(bloques().filter((b) => b.tipo === 'lista_vinetas')).toHaveLength(0);
    expect(bloqueQueEmpiezaPor('Sofía Aranda')?.tipo).toBe('parrafo');
    expect(bloqueQueEmpiezaPor('sofi_lachida2007')).toBeDefined();
    expect(bloqueQueEmpiezaPor('Pasatiempos')).toBeDefined();
  });
});

/* ── jugando mal ────────────────────────────────────────────────────────────*/

describe('VentanaTextos · n10-portafolio-y-cv, jugando mal a propósito', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('encargo 2 · la negrita no es un título, y el estilo sobre el renglón equivocado tampoco', async () => {
    await abrirYEmpezar();
    await hastaEl(1);
    expect(encargo()).toBe('Lo primero que se ve tiene que ser el nombre');

    // JUGAR MAL · agrandar el nombre a mano, que es lo que hace todo el mundo.
    seleccionar('Sofía Aranda');
    fireEvent.click(boton('mayor'));
    await celebrar();
    expect(encargo()).toBe('Lo primero que se ve tiene que ser el nombre');
    // Y el desvío ni siquiera ensució el documento (§37): sigue siendo párrafo.
    expect(bloqueQueEmpiezaPor('Sofía Aranda')?.tipo).toBe('parrafo');

    // JUGAR MAL · el estilo correcto, sobre el renglón de al lado.
    seleccionar('sofi_lachida2007');
    fireEvent.click(boton('titulo1'));
    await celebrar();
    expect(encargo()).toBe('Lo primero que se ve tiene que ser el nombre');

    paso2();
    await celebrar();
    expect(bloqueQueEmpiezaPor('Sofía Aranda')?.tipo).toBe('titulo');
    expect(encargo()).toBe('Las cuatro secciones que se quedan');
  });

  it('encargo 3 · con tres de los cuatro rótulos no se cierra', async () => {
    await abrirYEmpezar();
    await hastaEl(2);

    for (const r of ['Objetivo profesional', 'Experiencia', 'Formación']) {
      seleccionar(r);
      fireEvent.click(boton('titulo2'));
    }
    await celebrar();
    expect(encargo()).toBe('Las cuatro secciones que se quedan');

    seleccionar('Habilidades');
    fireEvent.click(boton('titulo2'));
    await celebrar();
    expect(encargo()).toBe('El correo que se hizo a los trece años');
  });

  it('encargo 5 · una sola viñeta no basta; con las dos, los logros salen del párrafo', async () => {
    await abrirYEmpezar();
    await hastaEl(4);
    expect(encargo()).toBe('Saca los dos logros del párrafo');

    seleccionar('Apoyé en las pruebas');
    fireEvent.click(boton('vinetas'));
    await celebrar();
    expect(encargo()).toBe('Saca los dos logros del párrafo');

    seleccionar('Capturé el catálogo');
    fireEvent.click(boton('vinetas'));
    await celebrar();
    expect(bloques().filter((b) => b.tipo === 'lista_vinetas').length).toBeGreaterThanOrEqual(2);
    expect(encargo()).toBe('Once renglones que no dicen nada');
  });

  it('encargo 6 · recortarlo hasta que no diga nada tampoco vale', async () => {
    await abrirYEmpezar();
    await hastaEl(5);

    // JUGAR MAL · corto, sí, pero ya no dice a qué aspira.
    seleccionarElCuerpoDelObjetivo();
    escribirEncima('Quiero trabajar.');
    await celebrar();
    expect(encargo()).toBe('Once renglones que no dicen nada');

    // JUGAR MAL · corto y con destino, pero se dejó la sinergia dentro.
    seleccionarElCuerpoDelObjetivo();
    escribirEncima('Busco mi primer empleo, siempre buscando la sinergia con el equipo.');
    await celebrar();
    expect(encargo()).toBe('Once renglones que no dicen nada');

    paso6();
    await celebrar();
    expect(encargo()).toBe('Lo más difícil: borrar algo que está bien');
  });

  it('encargo 7 · borrar sólo el rótulo deja el párrafo huérfano y no cierra el encargo', async () => {
    await abrirYEmpezar();
    await hastaEl(6);

    // JUGAR MAL · borrar la mitad de la sección.
    seleccionar('Pasatiempos');
    borrarSeleccion();
    await celebrar();
    expect(encargo()).toBe('Lo más difícil: borrar algo que está bien');
    expect(bloqueQueEmpiezaPor('Me gusta ver series')).toBeDefined();

    seleccionar('Me gusta ver series');
    borrarSeleccion();
    await celebrar();
    expect(encargo()).toBe('Otra vez siete segundos: ¿qué se te queda ahora?');
  });

  it('encargo 8 · las dos frases que no se leen en siete segundos no pasan', async () => {
    await abrirYEmpezar();
    await hastaEl(7);

    fireEvent.click(screen.getByText(/responsable, proactiva/));
    expect(encargo()).toBe('Otra vez siete segundos: ¿qué se te queda ahora?');
    fireEvent.click(screen.getByText(/Que sabe Python, HTML y CSS/));
    expect(encargo()).toBe('Otra vez siete segundos: ¿qué se te queda ahora?');
  });

  it('pulsar veinte veces un botón que nadie pidió no ensucia el documento', async () => {
    await abrirYEmpezar();
    await hastaEl(1);
    seleccionar('Sofía Aranda');
    for (let i = 0; i < 20; i += 1) fireEvent.click(boton('subrayado'));
    await celebrar();
    expect(encargo()).toBe('Lo primero que se ve tiene que ser el nombre');
    expect(bloqueQueEmpiezaPor('Sofía Aranda')?.tipo).toBe('parrafo');
  });
});

/* ── el recorrido completo ──────────────────────────────────────────────────*/

describe('VentanaTextos · n10-portafolio-y-cv de punta a punta', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('la clase entera se termina, y al final no hay ni un dato nuevo', async () => {
    const onTerminado = jest.fn();
    await abrirYEmpezar(onTerminado);

    await jugar(1, 8);

    // Lo que había al empezar y sigue estando: los datos no cambiaron.
    expect(bloqueQueEmpiezaPor('Prácticas profesionales')).toBeDefined();
    expect(bloqueQueEmpiezaPor('Bachillerato técnico')).toBeDefined();
    // Y lo que se fue.
    expect(bloqueQueEmpiezaPor('Pasatiempos')).toBeUndefined();

    expect(screen.getByText('Terminaste')).not.toBeNull();
    expect(onTerminado).toHaveBeenCalledTimes(1);
    expect(onTerminado.mock.calls[0][0]).toMatchObject({ pasos: 8, tropiezos: 0 });
  });
});
