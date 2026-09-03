/**
 * El mando a distancia para jugar una clase de Word (§36, §47).
 *
 * ── POR QUÉ EXISTE ──────────────────────────────────────────────────────────
 *
 * La sala de Excel dejó escrita la lección al cerrarse: **el motor sólo está
 * probado hasta donde llegan las clases que se han jugado**. Sus veintitrés
 * clases tienen cada una su recorrido de punta a punta, y ese recorrido encontró
 * NUEVE que se habían vuelto imposibles de terminar con todas sus pruebas
 * unitarias en verde. Las diecinueve de Word no tenían ninguno: se cerraron una
 * a una en agosto y desde entonces el motor cambió debajo de ellas.
 *
 * `ventana-textos-portafolio-y-cv.test.tsx` fue el primero (14-ago-2026) y dejó
 * resuelto lo difícil; esto es su técnica, sacada a un archivo aparte para que
 * las otras diecinueve no la copien y peguen veinte veces.
 *
 * ── LO QUE RESUELVE Y NO SE PUEDE HACER DE OTRA MANERA ──────────────────────
 *
 * **Mover el cursor.** En jsdom, `document.createRange()` + `Selection.addRange()`
 * **no llega** al estado de ProseMirror —el `DOMObserver` no se entera—, así que
 * un botón de estilo se aplicaría siempre sobre la selección de fábrica, que es
 * el principio del documento. `useEditor.ts` publica la vista en
 * `window.__vistaTextos` fuera de producción; desde ahí se pone una
 * `TextSelection` de verdad, que es exactamente lo que hace un clic del alumno.
 *
 * **Esperar a la celebración.** El cartel de «¡Eso es!» ocupa el sitio del
 * encargo 1 500 ms. Leer el panel antes de que se vaya devuelve «¡Eso es!» en
 * vez del título del encargo siguiente, y eso parece un botón que no funciona.
 *
 * Los huecos de jsdom (`Range.getClientRects` y compañía) están en
 * `jest.setup.ts` desde el 15-ago-2026; aquí ya no hace falta taparlos.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { selectAll, splitBlock } from 'prosemirror-commands';
import { TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { ActivityProps } from '@/types/activity-contract';

/* ── el editor por dentro ───────────────────────────────────────────────────*/

export const vista = (): EditorView =>
  (window as unknown as { __vistaTextos: EditorView }).__vistaTextos;

export interface BloqueVisto {
  i: number;
  tipo: string;
  texto: string;
  desde: number;
  hasta: number;
}

/** Los bloques de primer nivel del documento, con su posición de inicio. */
export function bloques(): BloqueVisto[] {
  const { doc } = vista().state;
  const salida: BloqueVisto[] = [];
  doc.forEach((nodo, offset, i) => {
    salida.push({ i, tipo: nodo.type.name, texto: nodo.textContent, desde: offset, hasta: offset + nodo.nodeSize });
  });
  return salida;
}

const normal = (s: string) => s.trim().toLowerCase();

export const bloqueQueEmpiezaPor = (inicio: string): BloqueVisto | undefined =>
  bloques().find((b) => normal(b.texto).startsWith(normal(inicio)));

export const bloqueQueContiene = (trozo: string): BloqueVisto | undefined =>
  bloques().find((b) => normal(b.texto).includes(normal(trozo)));

/** El texto entero del documento, para buscar sin saber en qué bloque cayó. */
export const textoDelDocumento = (): string => bloques().map((b) => b.texto).join('\n');

/** Selecciona el bloque entero, como un triple clic del alumno. */
export function seleccionar(inicio: string) {
  const b = bloqueQueEmpiezaPor(inicio) ?? bloqueQueContiene(inicio);
  if (!b) throw new Error(`no hay ningún bloque que empiece por «${inicio}»`);
  const v = vista();
  v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, b.desde + 1, b.hasta - 1)));
}

/** Selecciona el bloque número `i`, cuando no se le puede nombrar por su texto. */
export function seleccionarBloque(i: number) {
  const b = bloques()[i];
  if (!b) throw new Error(`no hay bloque número ${i}`);
  const v = vista();
  v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, b.desde + 1, b.hasta - 1)));
}

/** Selecciona desde el principio de un bloque hasta el final de otro. */
export function seleccionarDesdeHasta(primero: string, ultimo: string) {
  const a = bloqueQueEmpiezaPor(primero);
  const z = bloqueQueEmpiezaPor(ultimo);
  if (!a || !z) throw new Error(`faltan bloques para seleccionar «${primero}»…«${ultimo}»`);
  const v = vista();
  v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, a.desde + 1, z.hasta - 1)));
}

/** Un clic dentro del bloque, sin arrastrar: el cursor, sin selección. */
export function cursorEn(inicio: string, desplazamiento = 0) {
  const b = bloqueQueEmpiezaPor(inicio) ?? bloqueQueContiene(inicio);
  if (!b) throw new Error(`no hay ningún bloque que empiece por «${inicio}»`);
  const v = vista();
  const donde = Math.min(b.desde + 1 + desplazamiento, b.hasta - 1);
  v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, donde)));
}

/** El cursor al final del bloque, que es donde se sigue escribiendo. */
export function cursorAlFinalDe(inicio: string) {
  const b = bloqueQueEmpiezaPor(inicio) ?? bloqueQueContiene(inicio);
  if (!b) throw new Error(`no hay ningún bloque que empiece por «${inicio}»`);
  const v = vista();
  v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, b.hasta - 1)));
}

/** El cursor pegado justo delante de un trozo de texto, como un clic fino. */
export function cursorAntesDe(bloqueInicio: string, trozo: string) {
  const b = bloqueQueEmpiezaPor(bloqueInicio) ?? bloqueQueContiene(bloqueInicio);
  if (!b) throw new Error(`no hay bloque «${bloqueInicio}»`);
  const dentro = b.texto.indexOf(trozo);
  if (dentro < 0) throw new Error(`«${trozo}» no está en ese bloque`);
  const v = vista();
  v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, b.desde + 1 + dentro)));
}

/**
 * La tecla Enter, que parte el párrafo por donde esté el cursor.
 *
 * Va por `splitBlock`, el mismo comando que el `baseKeymap` del motor tiene
 * atado a Enter: en jsdom un `keyDown` no llega al `handleKeyDown` de
 * ProseMirror, así que teclear a mano no partiría nada y el encargo parecería
 * imposible cuando no lo es.
 */
export function teclaEnter() {
  const v = vista();
  splitBlock(v.state, v.dispatch);
}

/** Ctrl + A: el documento entero seleccionado. */
export function seleccionarTodo() {
  const v = vista();
  selectAll(v.state, v.dispatch);
}

/** Deshacer, la flecha ↶ de la barra de arriba. */
export const deshacer = () => fireEvent.click(boton('deshacer'));

/** Escribe encima de lo seleccionado, como teclear con texto marcado. */
export function escribirEncima(texto: string) {
  const v = vista();
  const { from, to } = v.state.selection;
  v.dispatch(v.state.tr.insertText(texto, from, to));
}

/** Teclea donde esté el cursor. */
export function escribir(texto: string) {
  const v = vista();
  const { from, to } = v.state.selection;
  v.dispatch(v.state.tr.insertText(texto, from, to));
}

/** Borra los bloques seleccionados enteros, como pulsar Supr con texto marcado. */
export function borrarSeleccion() {
  const v = vista();
  const { from, to } = v.state.selection;
  v.dispatch(v.state.tr.delete(from - 1, to + 1));
}

/** Borra sólo lo marcado, sin llevarse los bordes del bloque. */
export function borrarLoMarcado() {
  const v = vista();
  const { from, to } = v.state.selection;
  v.dispatch(v.state.tr.delete(from, to));
}

/** Reemplaza un trozo suelto de un bloque, sin tocar el resto del renglón. */
export function reemplazarTrozo(bloqueInicio: string, trozo: string, nuevo: string) {
  const b = bloqueQueEmpiezaPor(bloqueInicio) ?? bloqueQueContiene(bloqueInicio);
  if (!b) throw new Error(`no hay bloque «${bloqueInicio}»`);
  const dentro = b.texto.indexOf(trozo);
  if (dentro < 0) throw new Error(`«${trozo}» no está en ese bloque`);
  const v = vista();
  const desde = b.desde + 1 + dentro;
  v.dispatch(v.state.tr.insertText(nuevo, desde, desde + trozo.length));
}

/** Marca un trozo suelto de un bloque, como arrastrar sobre una palabra. */
export function seleccionarTrozo(bloqueInicio: string, trozo: string) {
  const b = bloqueQueEmpiezaPor(bloqueInicio) ?? bloqueQueContiene(bloqueInicio);
  if (!b) throw new Error(`no hay bloque «${bloqueInicio}»`);
  const dentro = b.texto.indexOf(trozo);
  if (dentro < 0) throw new Error(`«${trozo}» no está en ese bloque`);
  const v = vista();
  const desde = b.desde + 1 + dentro;
  v.dispatch(v.state.tr.setSelection(TextSelection.create(v.state.doc, desde, desde + trozo.length)));
}

/* ── la ventana ─────────────────────────────────────────────────────────────*/

export const boton = (control: string): HTMLElement => {
  const el = document.querySelector(`[data-control="${control}"]`);
  if (!el) throw new Error(`no hay ningún control «${control}» en pantalla`);
  return el as HTMLElement;
};

export const pulsar = (control: string) => fireEvent.click(boton(control));

export const irAPestana = (id: string) =>
  fireEvent.click(document.querySelector(`[data-pestana="${id}"]`) as HTMLElement);

/** El título del encargo que el panel enseña ahora mismo. */
export const encargo = (): string => document.querySelector('.txtw-encargo h3')?.textContent ?? '';

/** Lo que el panel dice debajo del título: la instrucción, o el aviso. */
export const avisos = (): string =>
  Array.from(document.querySelectorAll('.txtw-aviso-titulo, .txtw-error'))
    .map((n) => n.textContent ?? '')
    .join(' · ');

/** Cuántos encargos lleva palomeados el panel. */
export const cuenta = (): string => document.querySelector('.txtw-panel-cuenta')?.textContent ?? '';

/** Pulsa el botón de un encargo de «sólo mira y dime que lo viste». */
export const confirmar = (texto: string | RegExp) => fireEvent.click(screen.getByText(texto));

/** Contesta un encargo de elegir entre opciones. */
export const elegir = (texto: string | RegExp) => {
  const opciones = Array.from(document.querySelectorAll<HTMLElement>('.txtw-opcion'));
  const cual = opciones.find((o) =>
    typeof texto === 'string' ? (o.textContent ?? '').includes(texto) : texto.test(o.textContent ?? ''),
  );
  if (!cual) throw new Error(`no hay opción «${texto}» — hay: ${opciones.map((o) => o.textContent).join(' | ')}`);
  fireEvent.click(cual);
};

/**
 * Deja pasar la celebración.
 *
 * Las veintitrés pruebas de `VentanaHojas` adelantan 1 000 ms y con eso les
 * basta. Aquí no: con 1 000 el cartel de «¡Eso es!» sigue puesto en el sitio del
 * encargo y la prueba lee ese texto en vez del título del encargo siguiente —el
 * falso negativo con el que empezó el primer recorrido de Word, y que parecía un
 * botón que no funcionaba—.
 */
export async function celebrar() {
  await act(async () => {
    jest.advanceTimersByTime(2500);
  });
}

/* ── el laboratorio entero, como lo monta la plataforma ─────────────────────*/

export interface Partida {
  onProgress: jest.Mock;
  onScore: jest.Mock;
  onComplete: jest.Mock;
  /** La nota final, cuando la clase ya llamó a `onComplete`. */
  nota: () => { score: number; stars: number; errores?: number } | undefined;
}

/**
 * Monta el laboratorio de una clase como lo monta el anfitrión de actividad.
 *
 * Se juega el `Lab` y no `VentanaTextos` a propósito: el `Lab` es quien trae la
 * cinta de su grado, sus controles propios, sus accesorios y —sobre todo— **su
 * fórmula de calificar**. Una partida perfecta que saca 88 es un defecto, y con
 * `VentanaTextos` a pelo no se ve.
 */
export function montar(
  Lab: React.ComponentType<ActivityProps & { alSalir?: () => void }>,
  extra: Record<string, unknown> = {},
): Partida & { desmontar: () => void } {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const { unmount } = render(
    <Lab
      config={{}}
      onProgress={onProgress}
      onScore={onScore}
      onComplete={onComplete}
      {...extra}
    />,
  );
  return {
    onProgress,
    onScore,
    onComplete,
    nota: () => onComplete.mock.calls[0]?.[0],
    desmontar: unmount,
  };
}

/** Espera a que la ventana exista dentro de su portal del `<body>`. */
export async function esperarLaVentana() {
  await waitFor(() => expect(document.querySelector('.txtw')).not.toBeNull());
}

/** Cierra la portada de objetivos, que es como el alumno entra al documento. */
export async function abrirElDocumento(rotulo: RegExp = /^Abrir (el documento|la presentación)/) {
  const empezar = Array.from(document.querySelectorAll('button')).find((b) => rotulo.test(b.textContent ?? ''));
  if (!empezar) throw new Error('no encuentro el botón de la portada');
  fireEvent.click(empezar);
  await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());
}

/** Monta la clase, espera la ventana y entra al documento. En una línea. */
export async function jugarDesdeLaPortada(
  Lab: React.ComponentType<ActivityProps & { alSalir?: () => void }>,
  extra: Record<string, unknown> = {},
) {
  const partida = montar(Lab, extra);
  await esperarLaVentana();
  await abrirElDocumento();
  return partida;
}

/**
 * Juega una lista de encargos en orden, dejando pasar cada celebración.
 *
 * El encargo NO va envuelto en un `act` propio, y no es un descuido: `fireEvent`
 * ya trae el suyo, y meter otro por fuera **retrasa el repintado hasta el final
 * del encargo entero**. Un encargo de dos gestos —«abre Insertar y pulsa
 * Tabla»— buscaba entonces un botón que la cinta todavía no había pintado, y
 * fallaba con «no hay ningún control tabla en pantalla»: un falso negativo con
 * la cara exacta de una clase rota.
 */
export async function jugar(pasos: Array<() => void | Promise<void>>) {
  for (const paso of pasos) {
    await paso();
    await celebrar();
  }
}

/** El cartel de «Terminaste» del panel. */
export const seTermino = (): boolean =>
  document.querySelector('.txtw-encargo.es-final') !== null;
