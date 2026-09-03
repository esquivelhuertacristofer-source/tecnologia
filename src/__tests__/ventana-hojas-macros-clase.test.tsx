/**
 * `of-excel-macros` · «Graba tu primera macro» (bloques 55 · 56). La clase por
 * la que se tomó la decisión fundacional de todo el motor de Tecnia Hojas: «un
 * comando es un dato» (§45.6).
 *
 * Se juega MAL a propósito, que es la regla de la casa: se graba una macro
 * vacía y se rechaza, se graba dos veces sobre el mismo nombre —la primera
 * avisa, la segunda confirma y sobrescribe—, se ejecuta una macro mientras se
 * graba otra —rechazado, sin contaminar la que está en curso—, y se borra una
 * macro asignada a un botón —el botón se queda apuntando a un nombre que ya
 * no existe, y el panel lo enseña roto—. Y hay un recorrido de la clase
 * entera, de principio a fin, porque es lo único que caza un encadenamiento
 * que una acción legítima posterior invalida.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { CINTA_EXCEL_AVANZADO } from '@/components/activities/office/tecniaHojas';
import { GUION_MACROS } from '@/components/activities/office/excel/macros/guion';
import PanelMacros from '@/components/activities/office/excel/macros/PanelMacros';

beforeAll(() => {
  if (typeof Element.prototype.scrollTo !== 'function') {
    Element.prototype.scrollTo = function scrollTo() {};
  }
});

const PANEL_FIJO = { titulo: 'Macros', Cuerpo: PanelMacros };

async function abrir() {
  const salida = render(<VentanaHojas cinta={CINTA_EXCEL_AVANZADO} guion={GUION_MACROS} panelFijo={PANEL_FIJO} />);
  await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
  return salida;
}

async function abrirYEmpezar() {
  const salida = await abrir();
  fireEvent.click(screen.getByText('Abrir el libro'));
  await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());
  return salida;
}

const celda = (direccion: string): HTMLElement => document.querySelector(`[data-celda="${direccion}"]`) as HTMLElement;

const boton = (control: string): HTMLElement => document.querySelector(`[data-control="${control}"]`) as HTMLElement;

const rejilla = (): HTMLElement => document.querySelector('.hjw-rejilla') as HTMLElement;

const encargo = (): string => document.querySelector('.txtw-encargo h3')?.textContent ?? '';

const opcion = (texto: string): HTMLElement =>
  Array.from(document.querySelectorAll<HTMLElement>('.txtw-opcion')).find((b) => b.textContent === texto) as HTMLElement;

async function celebrar() {
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
}

function marcar(desde: string, hasta?: string) {
  fireEvent.mouseDown(celda(desde));
  if (hasta) fireEvent.mouseDown(celda(hasta), { shiftKey: true });
}

function teclear(direccion: string, texto: string) {
  fireEvent.mouseDown(celda(direccion));
  fireEvent.keyDown(rejilla(), { key: texto[0] });
  const editor = document.querySelector('.hjw-editor') as HTMLInputElement;
  fireEvent.change(editor, { target: { value: texto } });
  fireEvent.keyDown(editor, { key: 'Enter' });
}

function pintar(hex: string) {
  fireEvent.click(boton('color-relleno'));
  fireEvent.click(document.querySelector(`.hjw-color[data-color="${hex}"]`) as HTMLElement);
}

/* ── el panel «Macros»: `PanelMacros.tsx` ────────────────────────────────── */

function grabar(nombre: string) {
  fireEvent.change(screen.getByLabelText('Nombre de la macro'), { target: { value: nombre } });
  fireEvent.click(boton('grabar-macro'));
}

function detener() {
  fireEvent.click(boton('parar-macro'));
}

function ejecutar() {
  fireEvent.click(boton('ejecutar-macro'));
}

function asignar(nombreBoton: string, macro: string) {
  fireEvent.change(screen.getByLabelText('Nombre del botón'), { target: { value: nombreBoton } });
  fireEvent.change(screen.getByLabelText('Macro a asignar'), { target: { value: macro } });
  fireEvent.click(boton('asignar-macro'));
}

/**
 * La fila de `.pmc-macro` de una macro por su nombre. Hace falta escoparlo:
 * el nombre aparece TRES veces en el DOM una vez que hay al menos una macro
 * —el `<strong>` de la cabecera, la `<option>` del selector «Macro a
 * asignar», y a veces dentro de una instrucción en negrita («**Ver los
 * pasos**» del guion, que el renderizador convierte en un `<b>` de verdad)—
 * así que un `screen.getByText(nombre)` a secas revienta con «found multiple
 * elements». Un `<strong>` dentro de `.pmc-macro-cab` sólo lo pinta esta fila.
 */
function filaMacro(nombre: string): HTMLElement {
  return Array.from(document.querySelectorAll<HTMLElement>('.pmc-macro')).find(
    (li) => li.querySelector('.pmc-macro-cab strong')?.textContent === nombre,
  ) as HTMLElement;
}

/** «Ver los pasos» de la fila de esa macro — nunca el texto suelto de la instrucción. */
function verPasosDe(nombre: string) {
  const fila = filaMacro(nombre);
  const botonVer = Array.from(fila.querySelectorAll('button')).find((b) => b.textContent === 'Ver los pasos') as HTMLElement;
  fireEvent.click(botonVer);
}

/** Los ocho pasos del reporte, con el error de color adentro, tal cual el encargo 2. */
function grabarFormatoSemanal() {
  grabar('FormatoSemanal');
  marcar('A3', 'B3');
  fireEvent.click(boton('negrita'));
  pintar('#c00000'); // el error a propósito
  pintar('#ffc000'); // la corrección
  marcar('B4', 'B8');
  fireEvent.click(boton('moneda'));
  teclear('B9', '=SUMA(B4:B8)');
  marcar('A9', 'B9');
  fireEvent.click(boton('negrita'));
  detener();
}

describe('VentanaHojas · of-excel-macros se pinta', () => {
  it('la portada anuncia el tema, y el libro abre con los cinco conceptos sin ninguna pinta', async () => {
    await abrir();
    expect(screen.getByText('Macros: grabar, ejecutar y asignar a un botón')).not.toBeNull();
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

    expect(celda('A4').textContent).toBe('Papel');
    expect(celda('B4').textContent).toBe('250');
    expect(celda('A9').textContent).toBe('Total');
    expect(celda('B9').textContent ?? '').toBe('');
    expect(screen.getByText('Todavía no has grabado ninguna.')).not.toBeNull();
    expect(encargo()).toBe('Antes de darle a Grabar');
  });
});

describe('VentanaHojas · of-excel-macros, jugando bien y jugando mal', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('encargos 1 a 4 · se graba con un error a propósito, se lee la macro y se predice el resultado', async () => {
    await abrirYEmpezar();
    fireEvent.click(
      opcion(
        'Qué vas a hacer y en qué orden, porque TODO lo que hagas mientras esté grabando se apunta —lo bueno y lo que corrijas—, sea o no lo que querías',
      ),
    );
    await celebrar();
    expect(encargo()).toBe('Grábala, con un error incluido a propósito');

    grabarFormatoSemanal();
    await celebrar();

    // La hoja quedó bien vestida: los importes en moneda, y el Total —sin
    // moneda, sólo negrita, tal como pide el encargo— con su fórmula viva.
    expect(celda('B4').textContent).toBe('$250.00');
    expect(celda('B9').textContent).toBe('800');
    expect(encargo()).toBe('Ábrela y léela');

    // El defecto H arreglado en `comandos.ts`: la etiqueta ya distingue un
    // color de otro, así que el rojo y el amarillo se leen como DOS pasos
    // distintos, no como «Formato general» repetido dos veces.
    verPasosDe('FormatoSemanal');
    const pasos = Array.from(document.querySelectorAll('.pmc-pasos li')).map((li) => li.textContent ?? '');
    expect(pasos.some((t) => t.includes('#c00000'))).toBe(true);
    expect(pasos.some((t) => t.includes('#ffc000'))).toBe(true);

    fireEvent.click(
      opcion('Las dos: el color equivocado Y la corrección, una detrás de la otra, en el orden en que pasaron de verdad'),
    );
    await celebrar();
    expect(encargo()).toBe('Antes de probarla: una predicción');

    fireEvent.click(opcion('Nada visible: vuelve a poner exactamente lo mismo que ya hay, porque repite las mismas celdas de siempre'));
    await celebrar();
    expect(encargo()).toBe('Llegan dos conceptos más, tarde');
  });

  it('encargos 5 y 6 · la macro se come el importe de Pintura, y se entiende por qué', async () => {
    await abrirYEmpezar();
    fireEvent.click(
      opcion(
        'Qué vas a hacer y en qué orden, porque TODO lo que hagas mientras esté grabando se apunta —lo bueno y lo que corrijas—, sea o no lo que querías',
      ),
    );
    await celebrar();
    grabarFormatoSemanal();
    await celebrar();
    fireEvent.click(
      opcion('Las dos: el color equivocado Y la corrección, una detrás de la otra, en el orden en que pasaron de verdad'),
    );
    await celebrar();
    fireEvent.click(opcion('Nada visible: vuelve a poner exactamente lo mismo que ya hay, porque repite las mismas celdas de siempre'));
    await celebrar();

    // JUGAR BIEN, con la trampa incluida · insertar, capturar, y ejecutar.
    marcar('A9', 'A10');
    fireEvent.click(boton('insertar-fila'));
    teclear('A9', 'Pintura');
    teclear('B9', '150');
    teclear('A10', 'Papel crepé');
    teclear('B10', '95');
    ejecutar();
    await celebrar();

    // Pintura se comió el Total de la semana pasada (800), en negrita.
    expect(celda('B9').textContent).toBe('800');
    // Papel crepé, fuera de alcance: sigue con su número crudo, sin vestir.
    expect(celda('B10').textContent).toBe('95');
    // El Total de verdad, corrido a la fila 11, sigue diciendo 800 —sin las
    // dos compras nuevas— porque la macro nunca llegó hasta ahí.
    expect(celda('A11').textContent).toBe('Total');
    expect(celda('B11').textContent).toBe('800');
    expect(encargo()).toBe('¿Por qué se comió justo esa celda?');

    fireEvent.click(
      opcion(
        'Porque la macro grabó direcciones fijas —B4:B8, B9—, igual que un `$`, y esas direcciones no se enteran de que la hoja cambió de forma después de grabarlas',
      ),
    );
    await celebrar();
    expect(encargo()).toBe('Una macro corta, para el título');
  });

  it('encargos 7 y 8 · una segunda macro corta, y la importante queda asignada a un botón', async () => {
    await abrirYEmpezar();
    fireEvent.click(
      opcion(
        'Qué vas a hacer y en qué orden, porque TODO lo que hagas mientras esté grabando se apunta —lo bueno y lo que corrijas—, sea o no lo que querías',
      ),
    );
    await celebrar();
    grabarFormatoSemanal();
    await celebrar();
    fireEvent.click(
      opcion('Las dos: el color equivocado Y la corrección, una detrás de la otra, en el orden en que pasaron de verdad'),
    );
    await celebrar();
    fireEvent.click(opcion('Nada visible: vuelve a poner exactamente lo mismo que ya hay, porque repite las mismas celdas de siempre'));
    await celebrar();
    marcar('A9', 'A10');
    fireEvent.click(boton('insertar-fila'));
    teclear('A9', 'Pintura');
    teclear('B9', '150');
    teclear('A10', 'Papel crepé');
    teclear('B10', '95');
    ejecutar();
    await celebrar();
    fireEvent.click(
      opcion(
        'Porque la macro grabó direcciones fijas —B4:B8, B9—, igual que un `$`, y esas direcciones no se enteran de que la hoja cambió de forma después de grabarlas',
      ),
    );
    await celebrar();

    grabar('TituloFuerte');
    marcar('A1');
    fireEvent.click(boton('negrita'));
    detener();
    await celebrar();
    expect(encargo()).toBe('Ponle un botón a la que de verdad usas cada semana');

    asignar('BotonFormato', 'FormatoSemanal');
    await celebrar();
    expect(screen.getByText('BotonFormato', { exact: false })).not.toBeNull();
    expect(encargo()).toBe('Bloque 56 — Un archivo que trae órdenes');
  });

  it('jugar mal · una macro vacía se rechaza, y grabar dos veces sobre el mismo nombre pide confirmar', async () => {
    await abrirYEmpezar();
    // Encargo 1 es de elección: hay que resolverlo antes de que el panel deje
    // de contar cualquier clic de la cinta como un desvío.
    fireEvent.click(
      opcion(
        'Qué vas a hacer y en qué orden, porque TODO lo que hagas mientras esté grabando se apunta —lo bueno y lo que corrijas—, sea o no lo que querías',
      ),
    );
    await celebrar();

    // JUGAR MAL · parar sin haber grabado ni una acción: se rechaza, y la
    // grabadora —que no se enteró del rechazo— sigue encendida bajo «Vacia».
    grabar('Vacia');
    detener();
    // `parar-macro` no está en `SE_CONFIRMA`: el rechazo sale por el camino
    // genérico de `ejecutarGestos` — título fijo, y el motivo de verdad en
    // `.txtw-aviso-hace` (al revés que la «pregunta» de dos pulsaciones).
    expect(document.querySelector('.txtw-aviso-hace')?.textContent ?? '').toMatch(/vacía/i);
    expect(screen.getByText('Todavía no has grabado ninguna.')).not.toBeNull();

    // Sigue grabando: una acción de verdad y detener ahora sí la guarda.
    marcar('A1');
    fireEvent.click(boton('cursiva'));
    detener();
    await celebrar();
    expect(filaMacro('Vacia')).not.toBeUndefined();

    // JUGAR MAL · grabar dos veces sobre el mismo nombre: la primera avisa y NO
    // arranca la grabadora —se rechaza entera, igual que cualquier otra
    // pregunta de `SE_CONFIRMA`—, así que hace falta una SEGUNDA pulsación de
    // Grabar, con `confirmado`, para que la grabación de verdad empiece.
    grabar('Vacia');
    expect(document.querySelector('.txtw-aviso-titulo')?.textContent ?? '').toMatch(/ya existe/i);

    // La segunda pulsación (mismo nombre en el campo): confirma y arranca.
    grabar('Vacia');
    marcar('A2');
    fireEvent.click(boton('cursiva'));
    detener();
    await celebrar();

    verPasosDe('Vacia');
    const pasos = Array.from(document.querySelectorAll('.pmc-pasos li')).map((li) => li.textContent ?? '');
    expect(pasos).toHaveLength(1);
    expect(pasos[0]).toMatch(/A2/);
  });

  it('jugar mal · ejecutar una macro mientras se graba otra se rechaza, y borrar una asignada deja el botón roto', async () => {
    await abrirYEmpezar();
    fireEvent.click(
      opcion(
        'Qué vas a hacer y en qué orden, porque TODO lo que hagas mientras esté grabando se apunta —lo bueno y lo que corrijas—, sea o no lo que querías',
      ),
    );
    await celebrar();

    // Una macro guardada de verdad, para poder intentar ejecutarla después.
    grabar('Guardada');
    marcar('A1');
    fireEvent.click(boton('cursiva'));
    detener();
    await celebrar();

    // JUGAR MAL · ejecutar «Guardada» mientras «EnCurso» está grabando.
    grabar('EnCurso');
    fireEvent.click(
      Array.from(document.querySelectorAll<HTMLElement>('[data-control="ejecutar-macro"]')).find(
        (b) => b.closest('.pmc-macro')?.querySelector('strong')?.textContent === 'Guardada',
      ) as HTMLElement,
    );
    expect(document.querySelector('.txtw-aviso-hace')?.textContent ?? '').toMatch(/mientras grabas/i);
    // El intento bloqueado no contaminó la grabación en curso: se cierra con
    // una acción de verdad, para dejar la grabadora limpia y no encendida.
    marcar('A2');
    fireEvent.click(boton('subrayado'));
    detener();
    await celebrar();

    // Asigna «Guardada» a un botón, y luego bórrala.
    asignar('B1', 'Guardada');
    await celebrar();
    fireEvent.click(
      Array.from(document.querySelectorAll<HTMLElement>('[data-control="borrar-macro"]')).find(
        (b) => b.closest('.pmc-macro')?.querySelector('strong')?.textContent === 'Guardada',
      ) as HTMLElement,
    );
    await celebrar();

    // El botón se queda apuntando a un nombre que ya no existe, y se ve roto.
    expect(screen.getByText(/ya no existe/)).not.toBeNull();
  });

  it('el recorrido completo: los once encargos cierran con 0 tropiezos', async () => {
    const onTerminado = jest.fn();
    render(<VentanaHojas cinta={CINTA_EXCEL_AVANZADO} guion={GUION_MACROS} panelFijo={PANEL_FIJO} onTerminado={onTerminado} />);
    await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

    // 1
    fireEvent.click(
      opcion(
        'Qué vas a hacer y en qué orden, porque TODO lo que hagas mientras esté grabando se apunta —lo bueno y lo que corrijas—, sea o no lo que querías',
      ),
    );
    await celebrar();
    // 2
    grabarFormatoSemanal();
    await celebrar();
    // 3
    fireEvent.click(
      opcion('Las dos: el color equivocado Y la corrección, una detrás de la otra, en el orden en que pasaron de verdad'),
    );
    await celebrar();
    // 4
    fireEvent.click(opcion('Nada visible: vuelve a poner exactamente lo mismo que ya hay, porque repite las mismas celdas de siempre'));
    await celebrar();
    // 5
    marcar('A9', 'A10');
    fireEvent.click(boton('insertar-fila'));
    teclear('A9', 'Pintura');
    teclear('B9', '150');
    teclear('A10', 'Papel crepé');
    teclear('B10', '95');
    ejecutar();
    await celebrar();
    // 6
    fireEvent.click(
      opcion(
        'Porque la macro grabó direcciones fijas —B4:B8, B9—, igual que un `$`, y esas direcciones no se enteran de que la hoja cambió de forma después de grabarlas',
      ),
    );
    await celebrar();
    // 7
    grabar('TituloFuerte');
    marcar('A1');
    fireEvent.click(boton('negrita'));
    detener();
    await celebrar();
    // 8
    asignar('BotonFormato', 'FormatoSemanal');
    await celebrar();
    // 9
    fireEvent.click(
      opcion(
        'Porque un .xlsx sólo promete datos y fórmulas; un archivo que trae ÓRDENES —instrucciones que se van a ejecutar— tiene que decirlo desde el nombre: .xlsm',
      ),
    );
    await celebrar();
    // 10
    fireEvent.click(
      opcion(
        'Excel avisa que no puede guardar el proyecto de macros en ese formato, y si aceptas guardarlo así, las dos macros se pierden',
      ),
    );
    await celebrar();
    // 11
    fireEvent.click(
      opcion(
        'Le estás diciendo a Excel: deja que este archivo EJECUTE lo que trae dentro, aunque no sepas qué es — por eso no se hace con un archivo de quien no conoces',
      ),
    );
    await celebrar();

    expect(screen.getByText('Terminaste')).not.toBeNull();
    expect(onTerminado).toHaveBeenCalledTimes(1);
    expect(onTerminado.mock.calls[0][0]).toMatchObject({ pasos: GUION_MACROS.pasos.length, tropiezos: 0 });
  });
});
