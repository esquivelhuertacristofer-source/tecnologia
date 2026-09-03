/**
 * `of-excel-validacion` · «Que no se pueda escribir cualquier cosa»
 * (bloques 32 · 39). La última clase exclusiva del grado Intermedio de
 * Tecnia Hojas.
 *
 * Se juega MAL a propósito, que es la regla de la casa: se valida un rango
 * que ya tiene datos que no cumplen (y se comprueba que no los toca), se
 * intenta poner una lista vacía y un mínimo mayor que el máximo, se escribe
 * algo inválido con `bloquea` en sus dos valores —Detener no cede nunca,
 * Advertencia cede a la segunda—, se busca algo que no está y se pide «ir a»
 * un nombre que no existe. Y hay un recorrido de la clase entera, de
 * principio a fin, porque es lo único que caza un encadenamiento que una
 * acción legítima posterior invalida (aquí: el encargo 11 recalcula a
 * propósito la fórmula del encargo 1, así que ningún `comprueba` de más
 * adelante puede depender de que esa fórmula siga dando 2).
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { CINTA_EXCEL_INTERMEDIO } from '@/components/activities/office/tecniaHojas';
import { GUION_VALIDACION } from '@/components/activities/office/excel/validacion/guion';
import PanelValidacion from '@/components/activities/office/excel/validacion/PanelValidacion';

beforeAll(() => {
  if (typeof Element.prototype.scrollTo !== 'function') {
    Element.prototype.scrollTo = function scrollTo() {};
  }
});

const PANEL_FIJO = { titulo: 'Validación', Cuerpo: PanelValidacion };

async function abrir() {
  const salida = render(<VentanaHojas cinta={CINTA_EXCEL_INTERMEDIO} guion={GUION_VALIDACION} panelFijo={PANEL_FIJO} />);
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

function teclear(direccion: string, texto: string) {
  fireEvent.mouseDown(celda(direccion));
  fireEvent.keyDown(rejilla(), { key: texto[0] });
  const editor = document.querySelector('.hjw-editor') as HTMLInputElement;
  fireEvent.change(editor, { target: { value: texto } });
  fireEvent.keyDown(editor, { key: 'Enter' });
}

/** Escribe, se rechaza (se queda en edición) y se cancela sin dejar rastro. */
function intentarYCancelar(direccion: string, texto: string) {
  fireEvent.mouseDown(celda(direccion));
  fireEvent.keyDown(rejilla(), { key: texto[0] });
  const editor = document.querySelector('.hjw-editor') as HTMLInputElement;
  fireEvent.change(editor, { target: { value: texto } });
  fireEvent.keyDown(editor, { key: 'Enter' }); // Detener: rechaza, sigue editando
  fireEvent.keyDown(editor, { key: 'Escape' }); // se cancela sin escribir nada
}

/** Escribe con una regla «Advertencia»: el primer Enter avisa, el segundo confirma. */
function teclearConAdvertencia(direccion: string, texto: string) {
  fireEvent.mouseDown(celda(direccion));
  fireEvent.keyDown(rejilla(), { key: texto[0] });
  const editor = document.querySelector('.hjw-editor') as HTMLInputElement;
  fireEvent.change(editor, { target: { value: texto } });
  fireEvent.keyDown(editor, { key: 'Enter' });
  fireEvent.keyDown(editor, { key: 'Enter' });
}

function marcar(desde: string, hasta?: string) {
  fireEvent.mouseDown(celda(desde));
  if (hasta) fireEvent.mouseDown(celda(hasta), { shiftKey: true });
}

/* ── el panel «Validación»: `PanelValidacion.tsx` ────────────────────────── */

function validarLista(opciones: string, modo: 'detener' | 'advertencia' = 'detener') {
  fireEvent.change(screen.getByLabelText('Tipo de regla'), { target: { value: 'lista' } });
  fireEvent.change(screen.getByLabelText('Opciones, separadas por comas'), { target: { value: opciones } });
  fireEvent.change(screen.getByLabelText('Si no cumple'), { target: { value: modo } });
  fireEvent.click(boton('validar'));
}

function validarNumero(min: string, max: string, modo: 'detener' | 'advertencia' = 'detener') {
  fireEvent.change(screen.getByLabelText('Tipo de regla'), { target: { value: 'numero' } });
  fireEvent.change(screen.getByLabelText('Mínimo'), { target: { value: min } });
  fireEvent.change(screen.getByLabelText('Máximo'), { target: { value: max } });
  fireEvent.change(screen.getByLabelText('Si no cumple'), { target: { value: modo } });
  fireEvent.click(boton('validar'));
}

function quitarValidacionPanel() {
  fireEvent.click(boton('quitar-validacion'));
}

function abrirListaValidacion(direccion: string) {
  fireEvent.mouseDown(document.querySelector(`[data-flecha-validacion="${direccion}"]`) as HTMLElement);
}

function elegirDeLaLista(texto: string) {
  const opciones = Array.from(document.querySelectorAll<HTMLElement>('.hjw-lista-validacion-opcion'));
  fireEvent.click(opciones.find((b) => b.textContent === texto) as HTMLElement);
}

function buscarPanel(texto: string) {
  fireEvent.change(screen.getByLabelText('Buscar texto'), { target: { value: texto } });
  fireEvent.click(boton('buscar-panel'));
}

function irAPanel(texto: string) {
  fireEvent.change(screen.getByLabelText('Ir a'), { target: { value: texto } });
  fireEvent.click(boton('ir-a'));
}

function reemplazarPanel(buscar: string, reemplazo: string) {
  fireEvent.change(screen.getByLabelText('Buscar (reemplazar)'), { target: { value: buscar } });
  fireEvent.change(screen.getByLabelText('Reemplazar por'), { target: { value: reemplazo } });
  fireEvent.click(boton('reemplazar'));
}

describe('VentanaHojas · of-excel-validacion se pinta', () => {
  it('la portada anuncia el tema, y el libro abre con la columna de categoría ya sucia', async () => {
    await abrir();
    expect(screen.getByText('Validación de datos, y buscar, reemplazar e ir a')).not.toBeNull();
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

    expect(celda('A4').textContent).toBe('Familia Gómez');
    expect(celda('B4').textContent).toBe('Bebidas');
    expect(celda('B6').textContent).toBe('bebidas');
    expect(celda('F2').textContent ?? '').toBe('');
    expect(document.querySelector('[data-flecha-validacion="B14"]')).toBeNull(); // sin regla todavía
    expect(encargo()).toBe('Diez familias, y una cuenta que no cuadra');
  });
});

describe('VentanaHojas · of-excel-validacion, jugando mal a propósito', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('encargo 1 · escribir el número a mano no cuenta; la fórmula sí, y da 2 en vez de 4', async () => {
    await abrirYEmpezar();
    // JUGAR MAL · un número escrito a mano, no la fórmula que pide el encargo.
    teclear('F2', '4');
    expect(encargo()).toBe('Diez familias, y una cuenta que no cuadra');

    teclear('F2', '=CONTAR.SI(B4:B13,"Bebidas")');
    await celebrar();
    expect(celda('F2').textContent).toBe('2');
    expect(encargo()).toBe('¿Por qué no dio cuatro?');
  });

  it('encargo 2 · la opción equivocada no avanza; sólo la que explica el espacio y la palabra a medias', async () => {
    await abrirYEmpezar();
    teclear('F2', '=CONTAR.SI(B4:B13,"Bebidas")');
    await celebrar();

    // JUGAR MAL · culpar a CONTAR.SI de no distinguir mayúsculas.
    fireEvent.click(opcion('Porque CONTAR.SI no distingue mayúsculas de minúsculas'));
    expect(document.querySelector('.txtw-error')).not.toBeNull();
    expect(encargo()).toBe('¿Por qué no dio cuatro?');

    fireEvent.click(
      opcion(
        'Porque dos de las cuatro no dicen exactamente «Bebidas»: una lleva un espacio de más y otra está escrita a medias',
      ),
    );
    await celebrar();
    expect(encargo()).toBe('Una lista que no deja escribir cualquier cosa');
  });

  it('encargos 3 y 4 · la lista valida B4:B30 con lo viejo dentro, y lo viejo se queda sin marcar', async () => {
    await abrirYEmpezar();
    teclear('F2', '=CONTAR.SI(B4:B13,"Bebidas")');
    await celebrar();
    fireEvent.click(
      opcion(
        'Porque dos de las cuatro no dicen exactamente «Bebidas»: una lleva un espacio de más y otra está escrita a medias',
      ),
    );
    await celebrar();

    marcar('B4', 'B30');
    validarLista('Bebidas, Postres, Antojitos, Guisados');
    await celebrar();
    expect(encargo()).toBe('Lo que ya estaba escrito, ¿se marcó?');
    // Lo viejo se queda EXACTAMENTE igual: ni un color, ni un borrado. El
    // «▾» sí aparece —toda celda de B4:B30 lo trae en cuanto hay una
    // validación de lista puesta encima—, pero el TEXTO escrito no cambió.
    expect(celda('B11').textContent).toBe('Bebida▾');

    // JUGAR MAL · creer que sí se marcó con un color de error.
    fireEvent.click(opcion('La marcó con un color de error, aunque no se puede corregir sola'));
    expect(document.querySelector('.txtw-error')).not.toBeNull();

    fireEvent.click(
      opcion('No hizo nada con ella: la validación sólo vigila lo que se escriba de ahora en adelante, no lo que ya estaba'),
    );
    await celebrar();
    expect(encargo()).toBe('Rómpela a propósito: una categoría que no existe');
  });

  it('encargos 5 y 6 · Detener rechaza de verdad, sin segunda vez; con la flecha sí se puede elegir', async () => {
    await abrirYEmpezar();
    teclear('F2', '=CONTAR.SI(B4:B13,"Bebidas")');
    await celebrar();
    fireEvent.click(
      opcion(
        'Porque dos de las cuatro no dicen exactamente «Bebidas»: una lleva un espacio de más y otra está escrita a medias',
      ),
    );
    await celebrar();
    marcar('B4', 'B30');
    validarLista('Bebidas, Postres, Antojitos, Guisados');
    await celebrar();
    fireEvent.click(
      opcion('No hizo nada con ella: la validación sólo vigila lo que se escriba de ahora en adelante, no lo que ya estaba'),
    );
    await celebrar();

    // JUGAR MAL · intentar escribir una categoría que no está en la lista.
    intentarYCancelar('B14', 'Refrescos');
    // No entró nada —el «▾» es el único contenido: B14 está dentro de
    // B4:B30, así que trae la flecha aunque siga vacía.
    expect(celda('B14').textContent ?? '').toBe('▾');
    expect(encargo()).toBe('Rómpela a propósito: una categoría que no existe');

    fireEvent.click(opcion('Excel lo dejó escribir, pero pintó la celda de rojo'));
    expect(document.querySelector('.txtw-error')).not.toBeNull();

    fireEvent.click(opcion('Excel no dejó escribir eso: pidió elegir una de la lista, y no hubo forma de saltárselo'));
    await celebrar();
    expect(encargo()).toBe('Elige de la flecha');

    expect(document.querySelector('[data-flecha-validacion="B14"]')).not.toBeNull();
    abrirListaValidacion('B14');
    elegirDeLaLista('Postres');
    await celebrar();
    expect(celda('B14').textContent).toBe('Postres▾');
    expect(encargo()).toBe('Un número raro puede ser real: sólo avisa');
  });

  it('encargos 7 y 8 · la Advertencia de piezas avisa una vez, y a la segunda deja pasar 500', async () => {
    await abrirYEmpezar();
    teclear('F2', '=CONTAR.SI(B4:B13,"Bebidas")');
    await celebrar();
    fireEvent.click(
      opcion(
        'Porque dos de las cuatro no dicen exactamente «Bebidas»: una lleva un espacio de más y otra está escrita a medias',
      ),
    );
    await celebrar();
    marcar('B4', 'B30');
    validarLista('Bebidas, Postres, Antojitos, Guisados');
    await celebrar();
    fireEvent.click(
      opcion('No hizo nada con ella: la validación sólo vigila lo que se escriba de ahora en adelante, no lo que ya estaba'),
    );
    await celebrar();
    intentarYCancelar('B14', 'Refrescos');
    fireEvent.click(opcion('Excel no dejó escribir eso: pidió elegir una de la lista, y no hubo forma de saltárselo'));
    await celebrar();
    abrirListaValidacion('B14');
    elegirDeLaLista('Postres');
    await celebrar();

    // JUGAR MAL · una regla que no dice mínimo ni máximo.
    fireEvent.change(screen.getByLabelText('Tipo de regla'), { target: { value: 'numero' } });
    fireEvent.click(boton('validar'));
    expect(encargo()).toBe('Un número raro puede ser real: sólo avisa');

    marcar('C4', 'C30');
    validarNumero('1', '30', 'advertencia');
    await celebrar();
    expect(encargo()).toBe('Rómpela otra vez: quinientas piezas');

    // JUGAR MAL · un solo Enter no basta con Advertencia: sigue editando.
    fireEvent.mouseDown(celda('C14'));
    fireEvent.keyDown(rejilla(), { key: '5' });
    const editor = document.querySelector('.hjw-editor') as HTMLInputElement;
    fireEvent.change(editor, { target: { value: '500' } });
    fireEvent.keyDown(editor, { key: 'Enter' });
    expect(celda('C14').textContent ?? '').toBe('');
    expect(document.querySelector('.txtw-aviso')).not.toBeNull();

    fireEvent.keyDown(editor, { key: 'Enter' }); // la segunda vez sí confirma
    await celebrar();
    expect(celda('C14').textContent).toBe('500');
    expect(encargo()).toBe('El comité decide que ya no hace falta vigilar las piezas');
  });

  it('encargo 11 · reemplazar ancho avisa de la fórmula y no la toca; el angosto sí cambia la categoría', async () => {
    await abrirYEmpezar();
    teclear('F2', '=CONTAR.SI(B4:B13,"Bebidas")');
    await celebrar();
    fireEvent.click(
      opcion(
        'Porque dos de las cuatro no dicen exactamente «Bebidas»: una lleva un espacio de más y otra está escrita a medias',
      ),
    );
    await celebrar();
    marcar('B4', 'B30');
    validarLista('Bebidas, Postres, Antojitos, Guisados');
    await celebrar();
    fireEvent.click(
      opcion('No hizo nada con ella: la validación sólo vigila lo que se escriba de ahora en adelante, no lo que ya estaba'),
    );
    await celebrar();
    intentarYCancelar('B14', 'Refrescos');
    fireEvent.click(opcion('Excel no dejó escribir eso: pidió elegir una de la lista, y no hubo forma de saltárselo'));
    await celebrar();
    abrirListaValidacion('B14');
    elegirDeLaLista('Postres');
    await celebrar();
    marcar('C4', 'C30');
    validarNumero('1', '30', 'advertencia');
    await celebrar();
    teclearConAdvertencia('C14', '500');
    await celebrar();
    marcar('C4', 'C30');
    quitarValidacionPanel();
    await celebrar();
    fireEvent.click(
      opcion('En B14 no había manera de forzarlo —era Detener—; en C14 sí, con una segunda pulsación —era Advertencia'),
    );
    await celebrar();
    expect(encargo()).toBe('Reemplazar es peligroso: lee el aviso antes de confirmar');

    // JUGAR MAL · marcar de más y casi romper la fórmula del encargo 1.
    //
    // `reemplazar` vive en `SE_CONFIRMA`: la primera pulsación pasa por la
    // «pregunta» (VentanaHojas.tsx) y no por el rechazo llano, así que el
    // aviso de verdad —cuántas fórmulas toca— sale en `.txtw-aviso-titulo`;
    // `.txtw-aviso-hace` ahí lleva el texto fijo de «deshaz con Ctrl+Z».
    // A1:F13 y no A3:F13: F2 —la comprobación— vive en la fila 2, ARRIBA de
    // la tabla (que empieza su encabezado en la fila 3), así que hay que
    // marcar desde la fila 1 para que la fórmula quede dentro del rango.
    marcar('A1', 'F13');
    reemplazarPanel('Bebidas', 'Refrescos');
    expect(document.querySelector('.txtw-aviso-titulo')?.textContent ?? '').toMatch(/fórmula/i);
    expect(celda('F2').textContent).toBe('2'); // nada se tocó todavía

    marcar('B4', 'B13');
    reemplazarPanel('Bebidas', 'Refrescos'); // primera vez en este rango: sólo avisa
    // B4:B30 sigue con la validación de lista puesta desde el encargo 3: el «▾» va incluido.
    expect(celda('B4').textContent).toBe('Bebidas▾');
    reemplazarPanel('Bebidas', 'Refrescos'); // segunda vez, mismo rango y mismo texto: confirma
    await celebrar();

    expect(celda('B4').textContent).toBe('Refrescos▾');
    expect(celda('B6').textContent).toBe('Refrescos▾');
    expect(celda('F2').textContent).toBe('0'); // se recalculó solo: ya no hay ningún «Bebidas»
    expect(encargo()).toBe('Buscar «100»: el valor y la fórmula no son lo mismo');
  });

  it('encargos 12 y 13 · buscar por valor encuentra la fórmula, por fórmula no; «Ir a» con un nombre que no existe avisa', async () => {
    await abrirYEmpezar();

    // encargo 12, mirando sólo lo que hace falta: dos búsquedas de «100».
    buscarPanel('100');
    expect(screen.getByText(/2 coincidencia\(s\)/)).not.toBeNull();
    fireEvent.click(screen.getByLabelText('Buscar en fórmulas'));
    buscarPanel('100');
    expect(screen.getByText(/1 coincidencia\(s\)/)).not.toBeNull();

    // encargo 13: un nombre que no existe, y uno que ya venía puesto en el libro.
    irAPanel('Presupuesto');
    expect(screen.getByText(/no es ninguna celda/)).not.toBeNull();
    irAPanel('Categorias');
    expect(screen.getByText(/Aportaciones!B4:B13/)).not.toBeNull();
  });

  it('jugar mal en el panel: lista vacía, mínimo mayor que el máximo, y buscar algo que no está', async () => {
    await abrirYEmpezar();
    marcar('B4', 'B30');

    // JUGAR MAL · una lista sin ninguna opción: `aplicarValidacion` ni
    // siquiera intenta el gesto, así que esto es seguro en el encargo 1.
    validarLista('');
    expect(document.querySelector('[data-flecha-validacion="B14"]')).toBeNull(); // no se aplicó nada

    /*
     * El mínimo mayor que el máximo SÍ manda un gesto de verdad
     * (`validar`), y `pulsar()` pasa todo gesto por la guarda del desvío
     * ANTES de tocar el libro (§37): pulsarlo en el encargo 1 —donde la
     * señal pide `celda:F2`— no prueba el motor, prueba el desvío. Hay que
     * llegar al encargo 7, donde `validar` SÍ es lo que se espera, para que
     * el aviso que aparezca sea el del motor de verdad.
     */
    teclear('F2', '=CONTAR.SI(B4:B13,"Bebidas")');
    await celebrar();
    fireEvent.click(
      opcion(
        'Porque dos de las cuatro no dicen exactamente «Bebidas»: una lleva un espacio de más y otra está escrita a medias',
      ),
    );
    await celebrar();
    marcar('B4', 'B30');
    validarLista('Bebidas, Postres, Antojitos, Guisados');
    await celebrar();
    fireEvent.click(
      opcion('No hizo nada con ella: la validación sólo vigila lo que se escriba de ahora en adelante, no lo que ya estaba'),
    );
    await celebrar();
    intentarYCancelar('B14', 'Refrescos');
    fireEvent.click(opcion('Excel no dejó escribir eso: pidió elegir una de la lista, y no hubo forma de saltárselo'));
    await celebrar();
    abrirListaValidacion('B14');
    elegirDeLaLista('Postres');
    await celebrar();
    expect(encargo()).toBe('Un número raro puede ser real: sólo avisa');

    // JUGAR MAL · un mínimo mayor que el máximo, ahora en el encargo que sí lo espera.
    marcar('C4', 'C30');
    validarNumero('30', '1');
    expect(document.querySelector('.txtw-aviso')).not.toBeNull();
    expect(document.querySelector('.txtw-aviso-hace')?.textContent ?? '').toMatch(/mínimo no puede ser mayor/i);
    // No se aplicó nada: sigue pidiendo el mismo encargo.
    expect(encargo()).toBe('Un número raro puede ser real: sólo avisa');

    // Buscar algo que no está en ninguna celda.
    buscarPanel('Presupuesto anual');
    expect(screen.getByText('No se encontró nada.')).not.toBeNull();
  });

  it('el recorrido completo: los trece encargos cierran con 0 tropiezos', async () => {
    const onTerminado = jest.fn();
    render(<VentanaHojas cinta={CINTA_EXCEL_INTERMEDIO} guion={GUION_VALIDACION} panelFijo={PANEL_FIJO} onTerminado={onTerminado} />);
    await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

    // 1
    teclear('F2', '=CONTAR.SI(B4:B13,"Bebidas")');
    await celebrar();
    // 2
    fireEvent.click(
      opcion(
        'Porque dos de las cuatro no dicen exactamente «Bebidas»: una lleva un espacio de más y otra está escrita a medias',
      ),
    );
    await celebrar();
    // 3
    marcar('B4', 'B30');
    validarLista('Bebidas, Postres, Antojitos, Guisados');
    await celebrar();
    // 4
    fireEvent.click(
      opcion('No hizo nada con ella: la validación sólo vigila lo que se escriba de ahora en adelante, no lo que ya estaba'),
    );
    await celebrar();
    // 5
    intentarYCancelar('B14', 'Refrescos');
    fireEvent.click(opcion('Excel no dejó escribir eso: pidió elegir una de la lista, y no hubo forma de saltárselo'));
    await celebrar();
    // 6
    abrirListaValidacion('B14');
    elegirDeLaLista('Postres');
    await celebrar();
    // 7
    marcar('C4', 'C30');
    validarNumero('1', '30', 'advertencia');
    await celebrar();
    // 8
    teclearConAdvertencia('C14', '500');
    await celebrar();
    // 9
    marcar('C4', 'C30');
    quitarValidacionPanel();
    await celebrar();
    // 10
    fireEvent.click(
      opcion('En B14 no había manera de forzarlo —era Detener—; en C14 sí, con una segunda pulsación —era Advertencia'),
    );
    await celebrar();
    // 11
    marcar('A1', 'F13');
    reemplazarPanel('Bebidas', 'Refrescos');
    marcar('B4', 'B13');
    reemplazarPanel('Bebidas', 'Refrescos');
    reemplazarPanel('Bebidas', 'Refrescos');
    await celebrar();
    // 12
    buscarPanel('100');
    fireEvent.click(screen.getByLabelText('Buscar en fórmulas'));
    buscarPanel('100');
    fireEvent.click(
      opcion(
        'Mirando el valor salen dos —I2 e I3, porque las dos ENSEÑAN 100—; mirando la fórmula sale sólo una —I2—, porque «100» no está escrito dentro del texto =C6*10',
      ),
    );
    await celebrar();
    // 13
    irAPanel('Presupuesto');
    irAPanel('Categorias');
    fireEvent.click(
      opcion('«Presupuesto» no llevó a ningún lado —no existe—; «Categorias» sí, directo a la columna B4:B13'),
    );
    await celebrar();

    expect(screen.getByText('Terminaste')).not.toBeNull();
    expect(onTerminado).toHaveBeenCalledTimes(1);
    expect(onTerminado.mock.calls[0][0]).toMatchObject({ pasos: GUION_VALIDACION.pasos.length, tropiezos: 0 });
  });
});
