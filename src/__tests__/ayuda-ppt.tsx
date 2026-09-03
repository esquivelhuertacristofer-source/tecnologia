/**
 * El mando a distancia para jugar una clase de PowerPoint (§40, §43, §44).
 *
 * ── POR QUÉ EXISTE ──────────────────────────────────────────────────────────
 *
 * La sala de Excel dejó escrita la lección al cerrarse: **el motor sólo está
 * probado hasta donde llegan las clases que se han jugado**. Sus veintitrés
 * recorridos encontraron NUEVE clases imposibles de terminar con todas las
 * pruebas unitarias en verde. La sala de Word tuvo el suyo el 15-ago-2026 y
 * encontró dos, una de ellas en el camino de SALIR — que es justo por donde no
 * pisa ninguna prueba unitaria.
 *
 * Las diecinueve de PowerPoint no tenían ninguno. `motor-diapos.test.ts`
 * comprueba los predicados de los guiones contra mazos fabricados a mano, que
 * es otra cosa: un predicado puede ser correcto y la clase seguir siendo
 * imposible porque la ventana no deja llegar a ese mazo.
 *
 * Esto es el equivalente de `ayuda-word.tsx` para la ventana de diapositivas.
 *
 * ── LO QUE RESUELVE Y NO SE PUEDE HACER DE OTRA MANERA ──────────────────────
 *
 * **Escribir en un marcador.** No es un `<input>` con `name`: hay que hacer
 * doble clic en la caja del lienzo para que nazca el `<textarea>`, y sólo
 * entonces se puede teclear. `escribirEn()` hace los dos gestos.
 *
 * **Reordenar la tira.** El arrastre de miniaturas pregunta por
 * `getBoundingClientRect`, y en jsdom todo mide cero: soltar donde sea acaba
 * siempre en la última. Por eso `moverMini()` usa **Ctrl + flecha**, que es el
 * otro gesto del programa para lo mismo y el que la ventana ata en
 * `onKeyDown` — un gesto de alumno de verdad, no una puerta de pruebas.
 *
 * **Esperar a la celebración.** El cartel de «¡Eso es!» ocupa el sitio del
 * encargo 1 500 ms. Leer el panel antes de que se vaya devuelve «¡Eso es!» en
 * vez del título del encargo siguiente, y eso parece un botón que no funciona.
 *
 * Los huecos de jsdom (`Range.getClientRects`, `ResizeObserver`,
 * `HTMLCanvasElement.getContext` y compañía) están en `jest.setup.ts`; aquí no
 * hace falta taparlos.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ActivityProps } from '@/types/activity-contract';

/* ── la ventana ─────────────────────────────────────────────────────────────*/

export const hay = (selector: string): boolean => document.querySelector(selector) !== null;

export const boton = (control: string): HTMLElement => {
  const el = document.querySelector(`[data-control="${control}"]`);
  if (!el) throw new Error(`no hay ningún control «${control}» en pantalla`);
  return el as HTMLElement;
};

export const pulsar = (control: string) => fireEvent.click(boton(control));

export const irAPestana = (id: string) => {
  const el = document.querySelector(`[data-pestana="${id}"]`);
  if (!el) throw new Error(`no hay ninguna pestaña «${id}»`);
  fireEvent.click(el as HTMLElement);
};

/** El título del encargo que el panel enseña ahora mismo. */
export const encargo = (): string => document.querySelector('.txtw-encargo h3')?.textContent ?? '';

/** Lo que el panel dice debajo del título: la instrucción del encargo. */
export const instruccion = (): string =>
  document.querySelector('.txtw-encargo p')?.textContent ?? '';

/** Los avisos y errores del panel: el desvío, el «esa no», el «lo deshiciste». */
export const avisos = (): string =>
  Array.from(document.querySelectorAll('.txtw-aviso-titulo, .txtw-error'))
    .map((n) => n.textContent ?? '')
    .join(' · ');

/** Cuántos encargos lleva palomeados el panel. */
export const cuenta = (): string => document.querySelector('.txtw-panel-cuenta')?.textContent ?? '';

/** El cartel de «Terminaste» del panel. */
export const seTermino = (): boolean => document.querySelector('.txtw-encargo.es-final') !== null;

/** Pulsa el botón de un encargo de «sólo mira y dime que lo viste». */
export const confirmar = (texto?: string | RegExp) => {
  if (texto === undefined) {
    const b = document.querySelector('.txtw-confirmar');
    if (!b) throw new Error('no hay botón de confirmar en el panel');
    fireEvent.click(b as HTMLElement);
    return;
  }
  fireEvent.click(screen.getByText(texto));
};

/** Contesta un encargo de elegir entre opciones. */
export const elegir = (texto: string | RegExp) => {
  const opciones = Array.from(document.querySelectorAll<HTMLElement>('.txtw-opcion'));
  const cual = opciones.find((o) =>
    typeof texto === 'string' ? (o.textContent ?? '').includes(texto) : texto.test(o.textContent ?? ''),
  );
  if (!cual) throw new Error(`no hay opción «${texto}» — hay: ${opciones.map((o) => o.textContent).join(' | ')}`);
  fireEvent.click(cual);
};

/** La opción número `i` de un encargo de elección, cuando el texto es largo. */
export const elegirLa = (i: number) => {
  const opciones = Array.from(document.querySelectorAll<HTMLElement>('.txtw-opcion'));
  if (!opciones[i]) throw new Error(`no hay opción número ${i} — hay ${opciones.length}`);
  fireEvent.click(opciones[i]);
};

/* ── el lienzo ──────────────────────────────────────────────────────────────*/

/**
 * Un evento de puntero **con sus datos dentro**.
 *
 * `fireEvent.pointerDown(el, { shiftKey: true, clientX: 40 })` no sirve en
 * jsdom: no hay constructor de `PointerEvent`, así que Testing Library cae a un
 * `Event` pelado y **se pierden `shiftKey`, `clientX` y `clientY`**. El evento
 * llega, el manejador corre, y todo lo que dependa de esos campos hace como si
 * el alumno no hubiera pulsado Shift ni movido el ratón.
 *
 * Muerde en silencio y con dos caras distintas, las dos vistas jugando
 * `of-ppt-formas-y-cajas`: Shift + clic **sustituía** la selección en vez de
 * añadir —así que «agrupa las tres» se quedaba con una y el botón Agrupar salía
 * apagado, con el encargo imposible de cerrar—, y el arrastre calculaba su
 * delta con `undefined` y metía un `NaN` en la posición de la caja.
 *
 * `MouseEvent` sí lo construye jsdom entero, y React reparte por el NOMBRE del
 * evento, así que un `MouseEvent` de tipo `pointerdown` entra por `onPointerDown`
 * exactamente igual. Va por `fireEvent(el, ev)` para no perder el `act`.
 */
function puntero(
  el: Element,
  tipo: 'pointerdown' | 'pointermove' | 'pointerup',
  datos: { clientX?: number; clientY?: number; shiftKey?: boolean } = {},
) {
  fireEvent(
    el,
    new MouseEvent(tipo, {
      bubbles: true,
      cancelable: true,
      clientX: datos.clientX ?? 0,
      clientY: datos.clientY ?? 0,
      shiftKey: datos.shiftKey ?? false,
    }),
  );
}

/** Un clic en la caja de un marcador: la selecciona, como en el programa. */
export const seleccionarMarcador = (rol: string) => {
  const el = document.querySelector(`[data-marcador="${rol}"]`);
  if (!el) throw new Error(`no hay marcador «${rol}» en el lienzo`);
  puntero(el, 'pointerdown');
};

/** Un clic en un objeto suelto del lienzo (una foto, una forma, un cuadro). */
export const seleccionarLibre = (id: string) => {
  const el = document.querySelector(`[data-libre="${id}"]`);
  if (!el) throw new Error(`no hay objeto suelto «${id}» en el lienzo`);
  puntero(el, 'pointerdown');
};

/**
 * Shift + clic: añade a la selección sin perder la de antes, como en el
 * programa. Y no empieza un arrastre, que es lo que quiere quien está eligiendo
 * tres cajas para alinearlas.
 */
export const anadirALaSeleccion = (id: string) => {
  const el = document.querySelector(`[data-libre="${id}"]`);
  if (!el) throw new Error(`no hay objeto suelto «${id}» en el lienzo`);
  puntero(el, 'pointerdown', { shiftKey: true });
};

/**
 * Doble clic y teclear: escribir dentro de un marcador, como el alumno.
 *
 * El `<textarea>` no existe hasta el doble clic —es lo que hace `setEditando`—,
 * así que buscarlo antes no encuentra nada y el encargo parece imposible.
 */
export function escribirEn(rol: string, texto: string) {
  const caja = document.querySelector(`[data-marcador="${rol}"]`);
  if (!caja) throw new Error(`no hay marcador «${rol}» en el lienzo`);
  fireEvent.doubleClick(caja as HTMLElement);
  const area = document.querySelector(`textarea[data-texto="${rol}"]`);
  if (!area) throw new Error(`el marcador «${rol}» no abrió su cuadro de escritura`);
  fireEvent.change(area as HTMLTextAreaElement, { target: { value: texto } });
}

/** Lo mismo, en un cuadro de texto suelto del lienzo. */
export function escribirEnLibre(id: string, texto: string) {
  const caja = document.querySelector(`[data-libre="${id}"]`);
  if (!caja) throw new Error(`no hay objeto suelto «${id}» en el lienzo`);
  fireEvent.doubleClick(caja as HTMLElement);
  const area = document.querySelector(`textarea[data-texto="${id}"]`);
  if (!area) throw new Error(`el objeto «${id}» no abrió su cuadro de escritura`);
  fireEvent.change(area as HTMLTextAreaElement, { target: { value: texto } });
}

/**
 * Arrastrar una caja por el lienzo.
 *
 * Se puede hacer sin motor de maquetación, y no por suerte: el arrastre trabaja
 * con **deltas del puntero** (`e.clientX - x0`), no con la posición de la caja,
 * y la escala se deduce del DOM cayendo al zoom cuando no hay ancho medido. Así
 * que darle coordenadas explícitas es exactamente lo que hace un ratón. Hace
 * falta pasar de 2 px para que cuente: un clic sin arrastre no es un gesto.
 *
 * `dx` y `dy` van en píxeles del lienzo. Una columna son 80 y una fila 60.
 */
export function arrastrarCaja(selector: string, dx: number, dy: number) {
  const caja = document.querySelector(selector);
  if (!caja) throw new Error(`no hay ninguna caja «${selector}» en el lienzo`);
  const lienzo = document.querySelector('.dpw-lienzo');
  if (!lienzo) throw new Error('no hay lienzo en pantalla');
  puntero(caja, 'pointerdown', { clientX: 0, clientY: 0 });
  puntero(lienzo, 'pointermove', { clientX: dx, clientY: dy });
  puntero(lienzo, 'pointerup', { clientX: dx, clientY: dy });
}

/** Lo mismo agarrando un tirador: estirar en vez de mover. */
export function arrastrarTirador(selector: string, tirador: string, dx: number, dy: number) {
  const caja = document.querySelector(selector);
  if (!caja) throw new Error(`no hay ninguna caja «${selector}» en el lienzo`);
  const t = caja.querySelector(`[data-tirador="${tirador}"]`);
  if (!t) throw new Error(`la caja «${selector}» no tiene tirador «${tirador}» (¿está seleccionada?)`);
  const lienzo = document.querySelector('.dpw-lienzo');
  if (!lienzo) throw new Error('no hay lienzo en pantalla');
  puntero(t, 'pointerdown', { clientX: 0, clientY: 0 });
  puntero(lienzo, 'pointermove', { clientX: dx, clientY: dy });
  puntero(lienzo, 'pointerup', { clientX: dx, clientY: dy });
}

/**
 * Girar un modelo 3D por su tirador redondo.
 *
 * El giro no pasa por el lienzo: se apunta con `addEventListener` al propio
 * tirador, así que el `pointermove` y el `pointerup` van ahí. Medio grado por
 * píxel, o sea que para los 25° que pide el guion hacen falta 50 px.
 */
export function girarModelo(selectorTirador: string, dx: number, dy = 0) {
  const t = document.querySelector(selectorTirador);
  if (!t) throw new Error(`no hay tirador de giro «${selectorTirador}»`);
  puntero(t, 'pointerdown', { clientX: 0, clientY: 0 });
  puntero(t, 'pointermove', { clientX: dx, clientY: dy });
  puntero(t, 'pointerup', { clientX: dx, clientY: dy });
}

/** El texto que se ve pintado en un marcador del lienzo. */
export const textoDelLienzo = (rol: string): string =>
  document.querySelector(`[data-caja="${rol}"] [data-texto]`)?.textContent ??
  document.querySelector(`[data-marcador="${rol}"]`)?.textContent ??
  '';

/* ── la tira de miniaturas ──────────────────────────────────────────────────*/

export const minis = (): HTMLElement[] =>
  Array.from(document.querySelectorAll<HTMLElement>('.dpw-tira [data-diapo], .dpw-clas-rejilla [data-diapo]'));

/** Cuántas miniaturas se ven, que no es lo mismo que cuántas hay si hay tramos plegados. */
export const cuantasMinis = (): number => minis().length;

/** Un clic en la miniatura número `i`: se va a esa diapositiva. */
export function irADiapositiva(i: number) {
  const el = document.querySelector(`[data-diapo="${i}"]`);
  if (!el) throw new Error(`no hay miniatura número ${i} en la tira`);
  fireEvent.click(el as HTMLElement);
}

/** Cuál está seleccionada ahora mismo. */
export const laActivaEnPantalla = (): number => {
  const el = document.querySelector('.dpw-mini.es-activa');
  return el ? Number((el as HTMLElement).dataset.diapo) : -1;
};

/**
 * Ctrl + flecha sobre una miniatura: el atajo del programa para reordenar.
 *
 * El arrastre de verdad pregunta por `getBoundingClientRect`, y en jsdom todo
 * mide cero: `indiceBajoElPuntero` acabaría devolviendo siempre la última. Este
 * es el otro camino que la ventana ofrece al alumno, y el que sí se puede
 * jugar sin motor de maquetación.
 */
export function moverMini(i: number, hacia: 'arriba' | 'abajo') {
  const el = document.querySelector(`[data-diapo="${i}"]`);
  if (!el) throw new Error(`no hay miniatura número ${i} en la tira`);
  fireEvent.keyDown(el as HTMLElement, {
    key: hacia === 'arriba' ? 'ArrowUp' : 'ArrowDown',
    ctrlKey: true,
  });
}

/** Mueve la miniatura `desde` hasta el puesto `hasta`, paso a paso. */
export function llevarMini(desde: number, hasta: number) {
  let donde = desde;
  while (donde > hasta) {
    moverMini(donde, 'arriba');
    donde -= 1;
  }
  while (donde < hasta) {
    moverMini(donde, 'abajo');
    donde += 1;
  }
}

/* ── las galerías y los cuadros ─────────────────────────────────────────────*/

/** Abre la galería de diseños y elige uno. Los dos gestos, como el alumno. */
export function elegirDiseno(id: string) {
  pulsar('diseno-diapo');
  const el = document.querySelector(`[data-diseno="${id}"]`);
  if (!el) throw new Error(`no hay diseño «${id}» en la galería`);
  fireEvent.click(el as HTMLElement);
}

/** Abre la galería de temas y elige uno. */
export function elegirTema(id: string) {
  pulsar('tema');
  const el = document.querySelector(`[data-tema="${id}"]`);
  if (!el) throw new Error(`no hay tema «${id}» en la galería`);
  fireEvent.click(el as HTMLElement);
}

/** Un elemento cualquiera de una galería abierta, por su atributo. */
export function elegirEnGaleria(atributo: string, valor: string) {
  const el = document.querySelector(`[${atributo}="${valor}"]`);
  if (!el) throw new Error(`no hay «${atributo}=${valor}» en pantalla`);
  fireEvent.click(el as HTMLElement);
}

/**
 * Abrir un desplegable de la cinta y elegir dentro. Los dos gestos.
 *
 * Vale para las galerías del programa (`color`, `fondo`, `relleno`,
 * `contorno`, `organizar`, `duracion`, `vinculo`) y para las que pone la
 * clase, que se pintan con `data-item`.
 */
export function elegirDe(control: string, atributo: string, valor: string) {
  pulsar(control);
  elegirEnGaleria(atributo, valor);
}

/** Una figura, una foto o cualquier cosa de una galería que pone la clase. */
export const elegirItem = (control: string, valor: string) => elegirDe(control, 'data-item', valor);

/** ¿Está abierta alguna galería? */
export const hayGaleria = (): boolean => document.querySelector('.dpw-galeria') !== null;

/* ── los cuadros de diálogo ─────────────────────────────────────────────────*/

/** El cuadro abierto ahora mismo: `seccion`, `pie`, `tamano`, `esquema`… */
export const cuadroAbierto = (): string | null =>
  (document.querySelector('[data-cuadro]') as HTMLElement | null)?.dataset.cuadro ?? null;

export const hayCuadro = (cual: string): boolean =>
  document.querySelector(`[data-cuadro="${cual}"]`) !== null;

/** Escribe en un campo de un cuadro, por su `data-campo`. */
export function escribirEnCampo(campo: string, texto: string) {
  const el = document.querySelector(`[data-campo="${campo}"]`);
  if (!el) throw new Error(`no hay campo «${campo}» en pantalla`);
  fireEvent.change(el as HTMLInputElement, { target: { value: texto } });
}

/** Marca o desmarca una casilla de un cuadro, por su `data-campo`. */
export function marcarCasilla(campo: string, puesta = true) {
  const el = document.querySelector(`[data-campo="${campo}"]`) as HTMLInputElement | null;
  if (!el) throw new Error(`no hay casilla «${campo}» en pantalla`);
  if (el.checked !== puesta) fireEvent.click(el);
}

/** Un botón de un cuadro, por su rótulo: «Crear», «Aceptar», «Cancelar»… */
export function pulsarRotulo(rotulo: string | RegExp) {
  const b = Array.from(document.querySelectorAll<HTMLElement>('button')).find((x) =>
    typeof rotulo === 'string'
      ? (x.textContent ?? '').trim() === rotulo
      : rotulo.test(x.textContent ?? ''),
  );
  if (!b) throw new Error(`no hay ningún botón «${rotulo}» en pantalla`);
  fireEvent.click(b);
}

/** Un elemento cualquiera, por atributo, esté donde esté. */
export function pulsarPorAtributo(atributo: string, valor?: string) {
  const sel = valor === undefined ? `[${atributo}]` : `[${atributo}="${valor}"]`;
  const el = document.querySelector(sel);
  if (!el) throw new Error(`no hay ningún «${sel}» en pantalla`);
  fireEvent.click(el as HTMLElement);
}

/* ── el panel de comentarios ────────────────────────────────────────────────*/

/** Escribe un comentario nuevo y lo publica. Los dos gestos. */
export function comentar(texto: string) {
  const campo = document.querySelector('[data-com-campo]');
  if (!campo) throw new Error('el panel de comentarios no está abierto');
  fireEvent.change(campo as HTMLTextAreaElement, { target: { value: texto } });
  pulsarPorAtributo('data-com-nuevo');
}

export const comentariosEnPantalla = (): number => document.querySelectorAll('[data-com]').length;

/* ── el cajón de notas ──────────────────────────────────────────────────────*/

/**
 * La caja de «Notas del presentador», debajo del lienzo.
 *
 * No lleva doble clic: se escribe directo, que es lo que dice su propio
 * encargo. Es un `<textarea>` con id, no una caja del lienzo.
 */
export function escribirNota(texto: string) {
  const campo = document.getElementById('dpw-notas-campo');
  if (!campo) throw new Error('no hay caja de notas debajo del lienzo');
  fireEvent.change(campo as HTMLTextAreaElement, { target: { value: texto } });
}

export const notaEnPantalla = (): string =>
  (document.getElementById('dpw-notas-campo') as HTMLTextAreaElement | null)?.value ?? '';

/* ── el Backstage: la pestaña Archivo ───────────────────────────────────────*/

export const enElBackstage = (): boolean => document.querySelector('.bks') !== null;

/** Abre la pestaña naranja de la izquierda. */
export const abrirArchivo = () => irAPestana('archivo');

export function seccionDeArchivo(seccion: 'exportar' | 'imprimir' | 'informacion') {
  const el = document.querySelector(`[data-bks-seccion="${seccion}"]`);
  if (!el) throw new Error(`el Backstage de esta clase no trae la sección «${seccion}»`);
  fireEvent.click(el as HTMLElement);
}

/**
 * «Crear PDF» y compañía. Exportar TARDA segundo y medio a propósito, así que
 * hay que dejar correr el reloj para que el archivo llegue a la bandeja.
 */
export async function exportarComo(formato: 'pdf' | 'video' | 'pptx') {
  const el = document.querySelector(`[data-bks-exportar="${formato}"]`);
  if (!el) throw new Error(`no hay botón de exportar a «${formato}»`);
  fireEvent.click(el as HTMLElement);
  await act(async () => {
    jest.advanceTimersByTime(1600);
  });
}

export const cerrarArchivo = () => {
  const el = document.querySelector('[data-bks="volver"]');
  if (!el) throw new Error('el Backstage no está abierto');
  fireEvent.click(el as HTMLElement);
};

/* ── el escenario, cuando la clase trae uno ─────────────────────────────────*/

export const enEscena = (selector: string): boolean => document.querySelector(selector) !== null;

/**
 * Un botón por su rótulo accesible, dentro de un trozo de pantalla.
 *
 * Hace falta porque el repaso del programa y el escenario de una clase tienen
 * los dos su «Siguiente»: preguntando por toda la pantalla, `getByLabelText`
 * encuentra dos y revienta.
 */
export function pulsarEn(contenedor: string, rotulo: string) {
  const caja = document.querySelector(contenedor);
  if (!caja) throw new Error(`no hay «${contenedor}» en pantalla`);
  const b = Array.from(caja.querySelectorAll<HTMLElement>('button')).find(
    (x) => x.getAttribute('aria-label') === rotulo || (x.textContent ?? '').trim() === rotulo,
  );
  if (!b) throw new Error(`no hay botón «${rotulo}» dentro de «${contenedor}»`);
  fireEvent.click(b);
}

/* ── el reloj de la celebración ─────────────────────────────────────────────*/

/**
 * Deja pasar la celebración.
 *
 * 1 500 ms dura el cartel de «¡Eso es!»; con menos, el panel todavía enseña la
 * celebración y la prueba lee ese texto en vez del título del encargo
 * siguiente. Es el falso negativo con el que empezaron los dos recorridos
 * anteriores, y tiene la cara exacta de un botón que no funciona.
 */
export async function celebrar() {
  await act(async () => {
    jest.advanceTimersByTime(2500);
  });
}

/**
 * Juega una lista de encargos en orden, dejando pasar cada celebración.
 *
 * El encargo NO va envuelto en un `act` propio, y no es un descuido: `fireEvent`
 * ya trae el suyo, y meter otro por fuera retrasa el repintado hasta el final
 * del encargo entero. Un encargo de dos gestos —«abre Insertar y pulsa
 * Tabla»— buscaría entonces un botón que la cinta todavía no pintó.
 */
export async function jugar(pasos: Array<() => void | Promise<void>>) {
  for (const paso of pasos) {
    await paso();
    await celebrar();
  }
}

/* ── el laboratorio entero, como lo monta la plataforma ─────────────────────*/

export interface Partida {
  onProgress: jest.Mock;
  onScore: jest.Mock;
  onComplete: jest.Mock;
  /** La nota final, cuando la clase ya llamó a `onComplete`. */
  nota: () => { score: number; stars: number; errores?: number } | undefined;
  desmontar: () => void;
}

/**
 * Monta el laboratorio de una clase como lo monta el anfitrión de actividad.
 *
 * Se juega el `Lab` y no `VentanaDiapositivas` a propósito: el `Lab` es quien
 * trae la cinta de su grado, su escenario, sus accesorios y —sobre todo— **su
 * fórmula de calificar**. Una partida perfecta que saca 88 es un defecto, y con
 * la ventana a pelo no se ve.
 */
export function montar(
  Lab: React.ComponentType<ActivityProps & { alSalir?: () => void }>,
  extra: Record<string, unknown> = {},
): Partida {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const { unmount } = render(
    <Lab config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} {...extra} />,
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

/** Cierra la portada de objetivos, que es como el alumno entra a la presentación. */
export async function abrirLaPresentacion() {
  const empezar = Array.from(document.querySelectorAll('button')).find((b) =>
    /^Abrir la presentación/.test(b.textContent ?? ''),
  );
  if (!empezar) throw new Error('no encuentro el botón de la portada');
  fireEvent.click(empezar);
  await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());
}

/** Monta la clase, espera la ventana y entra a la presentación. En una línea. */
export async function jugarDesdeLaPortada(
  Lab: React.ComponentType<ActivityProps & { alSalir?: () => void }>,
  extra: Record<string, unknown> = {},
): Promise<Partida> {
  const partida = montar(Lab, extra);
  await esperarLaVentana();
  await abrirLaPresentacion();
  return partida;
}

/* ── el repaso a pantalla completa ──────────────────────────────────────────*/

export const enElRepaso = (): boolean => document.querySelector('.dpw-repaso') !== null;

/** La flecha ▶ del repaso: la siguiente diapositiva, o el siguiente revelado. */
export const avanzarRepaso = () =>
  fireEvent.click(screen.getByLabelText('Siguiente'));

export const retrocederRepaso = () =>
  fireEvent.click(screen.getByLabelText('Anterior'));

/**
 * Pulsar un vínculo **presentando**, que es la única forma de que salte.
 *
 * En el lienzo de trabajo pulsarlo selecciona la caja, como en el programa; sólo
 * la lámina del repaso pinta `es-saltable`. Se busca dentro del repaso a
 * propósito: la misma caja existe también en el lienzo de atrás con su
 * `data-destino` puesto, y preguntando por toda la pantalla se pulsaría la que
 * no salta.
 */
export function saltarPorElVinculo(destino: number | 'atras') {
  const el = document.querySelector(`.dpw-repaso [data-destino="${destino}"], .dpt [data-destino="${destino}"]`);
  if (!el) throw new Error(`no hay ningún vínculo a «${destino}» en la presentación`);
  fireEvent.click(el as HTMLElement);
}

/** «Salir del repaso», que es también «Cancelar el ensayo» y «Terminar la grabación». */
export function salirDelRepaso() {
  const b = document.querySelector('.dpw-repaso-barra .es-salir');
  if (!b) throw new Error('no hay botón de salir del repaso');
  fireEvent.click(b as HTMLElement);
}

/* ── el camino de salida ────────────────────────────────────────────────────*/

/** La ✕ de la barra de título: salir a media clase. */
export function salirPorLaCruz() {
  const x = document.querySelector('.txtw-cerrar');
  if (!x) throw new Error('no hay botón de salir en la barra de título');
  fireEvent.click(x as HTMLElement);
}

/** El botón grande de «Salir del laboratorio» de la pantalla de insignia. */
export function salirPorLaInsignia() {
  const b = Array.from(document.querySelectorAll<HTMLElement>('.txtw-final-boton')).find((x) =>
    /Salir del laboratorio/.test(x.textContent ?? ''),
  );
  if (!b) throw new Error('no hay botón de salir en la pantalla de insignia');
  fireEvent.click(b);
}

/** ¿Está puesta la pantalla de insignia? */
export const hayInsignia = (): boolean => document.querySelector('.txtw-final') !== null;
