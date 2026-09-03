/**
 * `of-excel-tablas-y-filtros` · «Una tabla no es un rango con colores»
 * (bloques 33 · 34 · 35 · 36). La primera clase exclusiva del grado
 * Intermedio de Tecnia Hojas.
 *
 * Se juega MAL a propósito, que es la regla de la casa: crear una tabla
 * sobre una celda sola, sobre un rango sin encabezado o encima de otra tabla
 * no crea nada; filtrar hasta que no quede ninguna fila deja sólo el
 * encabezado; ordenar una tabla filtrada se rechaza sin mover una fila. Y
 * hay un recorrido de la clase entera, de principio a fin, porque es lo
 * único que cazó los cuatro encadenamientos rotos que se encontraron
 * construyendo este guion (un `comprueba` que exige un estado que la propia
 * acción pedida deshace un instante después).
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { CINTA_EXCEL_BASICO } from '@/components/activities/office/tecniaHojas';
import {
  CELDA_SUMA_DE_FUERA,
  COL,
  FILA_PRIMERA,
  GRUPO_FILTRADO,
  GUION_TABLAS_Y_FILTROS,
  ID_TABLA,
  NOMBRE_TABLA,
  NUEVO_ALUMNO,
  ORIGEN,
} from '@/components/activities/office/excel/tablas-y-filtros/guion';
import { CONTROLES_TABLAS } from '@/components/activities/office/excel/tablas-y-filtros/controles';
import PanelTablas from '@/components/activities/office/excel/tablas-y-filtros/PanelTablas';

beforeAll(() => {
  if (typeof Element.prototype.scrollTo !== 'function') {
    Element.prototype.scrollTo = function scrollTo() {};
  }
  /*
   * jsdom no hace layout: `clientHeight` es siempre 0, y `VentanaHojas.tsx`
   * cae al mínimo de 520px (`Math.max(rejilla.current?.clientHeight ?? 0,
   * 520)`), que a 22px por fila (`ALTO_FILA`) sólo renderiza ~30 puestos.
   * Esta clase tiene 41 filas de datos más el encabezado: sin este mock,
   * `A43`/`A44` nunca aparecen en el DOM salvo que la ventana esté
   * desplazada, y una sola selección con el ratón no puede cubrir a la vez
   * un extremo desplazado y otro que no lo está. Se ensancha el alto
   * simulado para que la hoja entera quepa de un tirón, como en una pantalla
   * de verdad lo bastante grande.
   */
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 1400 });
});

const PANEL_FIJO = { titulo: 'Tablas', Cuerpo: PanelTablas };

async function abrir() {
  const salida = render(
    <VentanaHojas cinta={CINTA_EXCEL_BASICO} guion={GUION_TABLAS_Y_FILTROS} controles={CONTROLES_TABLAS} panelFijo={PANEL_FIJO} />,
  );
  await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
  return salida;
}

const celda = (direccion: string): HTMLElement => document.querySelector(`[data-celda="${direccion}"]`) as HTMLElement;

const boton = (control: string): HTMLElement => document.querySelector(`[data-control="${control}"]`) as HTMLElement;

const rejilla = (): HTMLElement => document.querySelector('.hjw-rejilla') as HTMLElement;

const encargo = (): string => document.querySelector('.txtw-encargo h3')?.textContent ?? '';

const opcion = (texto: string): HTMLElement =>
  Array.from(document.querySelectorAll<HTMLElement>('.txtw-opcion')).find((b) => b.textContent === texto) as HTMLElement;

/** «Selección actual: <b>A9</b>» del panel «Tablas» — lo que de verdad quedó marcado. */
const seleccionDelPanel = (): string => document.querySelector('.ptb-sel b')?.textContent ?? '';

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

/** Marcar un rectángulo con el ratón, como el alumno: una celda sola si no hay `hasta`. */
function marcar(desde: string, hasta?: string) {
  fireEvent.mouseDown(celda(desde));
  if (hasta) fireEvent.mouseDown(celda(hasta), { shiftKey: true });
}

function irAPestana(id: string) {
  fireEvent.click(document.querySelector(`[data-pestana="${id}"]`) as HTMLElement);
}

/* ── el panel «Tablas»: `PanelTablas.tsx` ────────────────────────────────── */

function crearTabla(nombre: string) {
  fireEvent.change(screen.getByLabelText('Nombre de la tabla'), { target: { value: nombre } });
  fireEvent.click(boton('crear-tabla'));
}

function elegirEstilo(id: string) {
  fireEvent.click(document.querySelector(`.ptb-estilo[data-estilo="${id}"]`) as HTMLElement);
}

function aplicarTotales(col: number, resumen: string) {
  fireEvent.change(screen.getByLabelText('Columna de totales'), { target: { value: String(col) } });
  fireEvent.change(screen.getByLabelText('Resumen'), { target: { value: resumen } });
  fireEvent.click(boton('fila-totales'));
}

function filtrarPorValores(col: number, valores: string[]) {
  fireEvent.change(screen.getByLabelText('Columna a filtrar'), { target: { value: String(col) } });
  valores.forEach((v) => fireEvent.click(screen.getByLabelText(v)));
  fireEvent.click(boton('filtrar'));
}

function filtrarComparando(col: number, op: string, contra1: string, contra2?: string) {
  fireEvent.change(screen.getByLabelText('Columna a filtrar'), { target: { value: String(col) } });
  fireEvent.change(screen.getByLabelText('Modo de filtro'), { target: { value: 'cmp' } });
  fireEvent.change(screen.getByLabelText('Comparación'), { target: { value: op } });
  const etiqueta = op === 'contiene' ? 'Texto' : 'Número';
  fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: contra1 } });
  if (op === 'entre') fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: contra2 ?? '' } });
  fireEvent.click(boton('filtrar'));
}

function quitarFiltros() {
  fireEvent.click(boton('quitar-filtros'));
}

function ordenarVarias(col1: number, desc1: boolean, col2?: number, desc2?: boolean) {
  fireEvent.change(screen.getByLabelText('Primer nivel: columna'), { target: { value: String(col1) } });
  fireEvent.change(screen.getByLabelText('Primer nivel: sentido'), { target: { value: desc1 ? '1' : '0' } });
  if (col2 !== undefined) {
    fireEvent.change(screen.getByLabelText('Segundo nivel: columna'), { target: { value: String(col2) } });
    fireEvent.change(screen.getByLabelText('Segundo nivel: sentido'), { target: { value: desc2 ? '1' : '0' } });
  }
  fireEvent.click(boton('ordenar-varias'));
}

function ocultarFilas() {
  fireEvent.click(boton('ocultar-filas'));
}

function mostrarFilas() {
  fireEvent.click(boton('mostrar-filas'));
}

/**
 * Los 13 encargos, de un tirón, sin comprobar nada por el camino. Para las
 * pruebas de después de terminar.
 *
 * LAS CINCO PRUEBAS QUE LLAMAN A ESTO SON DE LAS LENTAS: reproducir la clase
 * entera contra el motor de verdad tarda unos 25 s en esta máquina. Con el tope
 * de 30 s que hubo hasta el 2-sep-2026 corrían a un par de segundos del límite y
 * se caían por tiempo en cuanto la máquina tenía algo más que hacer. **No era
 * una regresión**: se comprobó restaurando el `VentanaHojas.tsx` anterior a la
 * auditoría y falla igual. Era un margen que nunca hubo.
 *
 * El tope global pasó a 90 s por eso, y el porqué está escrito en
 * `jest.config.ts`. Aquí NO se pone una excepción prueba a prueba: un
 * `}, 60_000)` suelto sería un tope más BAJO que el global el día que el global
 * vuelva a subir. Si vuelven a caerse por tiempo, se sube allá y no aquí.
 */
async function completarClase() {
  const onTerminado = jest.fn();
  render(
    <VentanaHojas
      cinta={CINTA_EXCEL_BASICO}
      guion={GUION_TABLAS_Y_FILTROS}
      controles={CONTROLES_TABLAS}
      panelFijo={PANEL_FIJO}
      onTerminado={onTerminado}
    />,
  );
  await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
  fireEvent.click(screen.getByText('Abrir el libro'));
  await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

  marcar('B10');
  fireEvent.click(boton('crear-tabla'));
  await celebrar();
  marcar('A3', 'F43');
  fireEvent.click(boton('crear-tabla'));
  await celebrar();
  marcar('A3', 'E43');
  crearTabla(NOMBRE_TABLA);
  await celebrar();

  marcar('A4');
  elegirEstilo('claro-verde');
  await celebrar();

  teclear('A44', NUEVO_ALUMNO.alumno);
  teclear('B44', NUEVO_ALUMNO.grupo);
  teclear('C44', String(NUEVO_ALUMNO.cuota));
  teclear('D44', String(NUEVO_ALUMNO.aporto));
  teclear('E44', '=D44-C44');
  await celebrar();

  marcar('A4');
  aplicarTotales(COL.alumno, 'cuenta');
  marcar('A4');
  aplicarTotales(COL.aporto, 'suma');
  await celebrar();

  marcar('A4');
  filtrarPorValores(COL.grupo, [GRUPO_FILTRADO]);
  await celebrar();

  marcar('D5', 'D9');
  fireEvent.click(boton('borrar-contenido'));
  await celebrar();

  // Ojo: A4 está ESCONDIDA mientras el filtro de 6B sigue puesto — no se
  // puede volver a marcar con el ratón hasta quitarlo. `sel` se queda donde
  // la dejó el último marcado real (D5:D9), que sigue dentro de la tabla.
  quitarFiltros();
  await celebrar();

  marcar('A4');
  filtrarPorValores(COL.grupo, [GRUPO_FILTRADO]);
  // A4 vuelve a estar escondida en cuanto se filtra: mismo motivo de arriba,
  // no se vuelve a marcar hasta quitar el filtro.
  ordenarVarias(COL.alumno, false);
  quitarFiltros();
  fireEvent.click(opcion('Se rechazó: pidió quitar los filtros antes de ordenar'));
  await celebrar();

  marcar('A4');
  ordenarVarias(COL.alumno, false);
  marcar('A4');
  ordenarVarias(COL.grupo, false, COL.alumno, false);
  await celebrar();

  fireEvent.click(opcion('Los alumnos quedarían en orden alfabético de la A a la Z, y el grupo ya no agruparía nada'));
  await celebrar();

  marcar('A4', 'E13');
  ocultarFilas();
  marcar('A3', 'E14');
  mostrarFilas();
  await celebrar();

  fireEvent.click(opcion('No: en cuanto la fila 3 se va de la pantalla, hay que adivinar o subir a comprobar'));
  await celebrar();

  irAPestana('vista');
  marcar('B4');
  fireEvent.click(boton('inmovilizar'));
  await celebrar();

  return onTerminado;
}

describe('VentanaHojas · of-excel-tablas-y-filtros se pinta', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('la portada anuncia el tema, y el libro abre con los cuarenta alumnos sin tabla', async () => {
    await abrir();
    expect(screen.getByText('Convertir un rango en tabla, filtrar sin borrar e inmovilizar la fila de títulos')).not.toBeNull();
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

    expect(celda('A3').textContent).toBe('Alumno');
    expect(celda('A4').textContent).toBe('Andrea Salinas');
    expect(celda('A43').textContent).toBe('Omar Gallardo');
    expect(celda('A44').textContent ?? '').toBe('');
    expect(document.querySelector(`[data-tabla-marco="${ID_TABLA}"]`)).toBeNull();
    expect(encargo()).toBe('Un rango no sabe que es una lista');
  });

  it('el recorrido completo: los 13 encargos cierran con 0 tropiezos, con las dos cuentas y el peligro comprobados por el camino', async () => {
    const onTerminado = jest.fn();
    render(
      <VentanaHojas
        cinta={CINTA_EXCEL_BASICO}
        guion={GUION_TABLAS_Y_FILTROS}
        controles={CONTROLES_TABLAS}
        panelFijo={PANEL_FIJO}
        onTerminado={onTerminado}
      />,
    );
    await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());

    // encargo 1 · jugar mal: una celda sola, y un rango sin encabezado (F3 está vacía)
    marcar('B10');
    fireEvent.click(boton('crear-tabla'));
    await celebrar();
    expect(document.querySelector(`[data-tabla-marco="${ID_TABLA}"]`)).toBeNull();
    expect(encargo()).toBe('Un rango no sabe que es una lista');

    marcar('A3', 'F43');
    fireEvent.click(boton('crear-tabla'));
    await celebrar();
    expect(encargo()).toBe('Un rango no sabe que es una lista');

    marcar('A3', 'E43');
    crearTabla(NOMBRE_TABLA);
    await celebrar();
    expect(document.querySelector(`[data-tabla-marco="${ID_TABLA}"]`)).not.toBeNull();
    expect(encargo()).toBe('Cambia el color sin tocar un dato');

    // encargo 2 · estilo
    marcar('A4');
    elegirEstilo('claro-verde');
    await celebrar();
    expect(encargo()).toBe('Escribe justo debajo, y mira');

    // encargo 3 · crece sola
    teclear('A44', NUEVO_ALUMNO.alumno);
    teclear('B44', NUEVO_ALUMNO.grupo);
    teclear('C44', String(NUEVO_ALUMNO.cuota));
    teclear('D44', String(NUEVO_ALUMNO.aporto));
    teclear('E44', '=D44-C44');
    await celebrar();
    expect(celda('E44').textContent).toBe('0');
    expect(encargo()).toBe('Un resumen que se actualiza solo');

    // encargo 4 · fila de totales, con su marco y su fila visible en el DOM
    marcar('A4');
    aplicarTotales(COL.alumno, 'cuenta');
    marcar('A4');
    aplicarTotales(COL.aporto, 'suma');
    await celebrar();
    expect(encargo()).toBe('Filtrar no borra: las dos cuentas, una al lado de otra');
    expect(document.querySelector(`[data-tabla-totales="${ID_TABLA}"]`)).not.toBeNull();
    const totalAlumno = document.querySelector(`[data-tabla-total="${ID_TABLA}-${COL.alumno}"]`);
    expect(totalAlumno?.textContent).toBe(String(ORIGEN.length + 1)); // 41

    // encargo 5 · filtrar y comparar: las dos cuentas, y las filas escondidas no están en el DOM
    const sumaDeFueraAntes = celda(CELDA_SUMA_DE_FUERA).textContent;
    marcar('A4');
    filtrarPorValores(COL.grupo, [GRUPO_FILTRADO]);
    await celebrar();
    expect(encargo()).toBe('Cuidado con lo que no ves');
    expect(celda('A6')).toBeNull(); // 6A, escondida por el filtro: no está en el DOM
    const totalAportoFiltrado = document.querySelector(`[data-tabla-total="${ID_TABLA}-${COL.aporto}"]`);
    expect(celda(CELDA_SUMA_DE_FUERA).textContent).toBe(sumaDeFueraAntes); // SUMA no se entera del filtro
    expect(totalAportoFiltrado?.textContent).not.toBe(sumaDeFueraAntes); // la fila de totales sí

    // encargo 6 · el peligro: D5 y D9 se ven, y las dos quedan vacías
    marcar('D5', 'D9');
    fireEvent.click(boton('borrar-contenido'));
    await celebrar();
    expect(celda('D5').textContent ?? '').toBe('');
    expect(celda('D9').textContent ?? '').toBe('');
    expect(encargo()).toBe('Quita el filtro y mira el daño');

    // encargo 7 · quitar filtros revela el daño en las filas que estaban escondidas.
    // A4 sigue escondida por el filtro de 6B: no se puede volver a marcar con
    // el ratón hasta quitarlo. `sel` se queda en D5:D9 (encargo 6), que sigue
    // dentro de la tabla para lo que le importa a `tablaBajoSel`.
    quitarFiltros();
    await celebrar();
    expect(celda('D6').textContent ?? '').toBe('');
    expect(celda('D7').textContent ?? '').toBe('');
    expect(celda('D8').textContent ?? '').toBe('');
    expect(encargo()).toBe('Rómpela otra vez: ordenar con un filtro puesto');

    // encargo 8 · ordenar filtrada se rechaza de verdad, y no reordena nada
    const filaAntesDelIntento = celda('A5').textContent;
    marcar('A4');
    filtrarPorValores(COL.grupo, [GRUPO_FILTRADO]);
    // A4 queda escondida en cuanto se filtra: no se vuelve a marcar hasta
    // quitar el filtro (mismo motivo que en el encargo 7).
    ordenarVarias(COL.alumno, false);
    expect(document.querySelector('.txtw-aviso-hace')?.textContent ?? '').toMatch(/quita los filtros antes de ordenar/i);
    expect(celda('A5').textContent).toBe(filaAntesDelIntento); // no se movió ni una fila
    quitarFiltros();
    fireEvent.click(opcion('Se rechazó: pidió quitar los filtros antes de ordenar'));
    await celebrar();
    expect(encargo()).toBe('Ordenar por varias, y el orden de las columnas importa');

    // encargo 9 · mal (sólo alumno, los grupos quedan revueltos), y luego bien
    marcar('A4');
    ordenarVarias(COL.alumno, false);
    await celebrar();
    expect(encargo()).toBe('Ordenar por varias, y el orden de las columnas importa'); // sólo por alumno no basta
    marcar('A4');
    ordenarVarias(COL.grupo, false, COL.alumno, false);
    await celebrar();
    expect(celda('B4').textContent).toBe('5A'); // el primer grupo, alfabético, tras ordenar bien
    expect(encargo()).toBe('Antes de seguir: ¿por qué ese orden y no el otro?');

    // encargo 10 · elección
    fireEvent.click(opcion('Los alumnos quedarían en orden alfabético de la A a la Z, y el grupo ya no agruparía nada'));
    await celebrar();
    expect(encargo()).toBe('Esconder a mano, sin ningún filtro');

    // encargo 11 · ocultar y mostrar, con rango de celdas (no cabecera de fila)
    marcar('A4', 'E13');
    ocultarFilas();
    await celebrar();
    expect(celda('A4')).toBeNull(); // escondida: ya no está en el DOM
    expect(encargo()).toBe('Esconder a mano, sin ningún filtro'); // todavía falta volver a mostrarlas
    marcar('A3', 'E14');
    mostrarFilas();
    await celebrar();
    expect(celda('A4').textContent ?? '').not.toBe('');
    expect(encargo()).toBe('Baja las cuarenta y una filas');

    // encargo 12 · elección
    fireEvent.click(opcion('No: en cuanto la fila 3 se va de la pantalla, hay que adivinar o subir a comprobar'));
    await celebrar();
    expect(encargo()).toBe('Clava lo que no se debe mover');

    // encargo 13 · inmovilizar de verdad, en Vista → Mostrar
    irAPestana('vista');
    marcar('B4');
    fireEvent.click(boton('inmovilizar'));
    await celebrar();

    expect(screen.getByText('Terminaste')).not.toBeNull();
    expect(onTerminado).toHaveBeenCalledTimes(1);
    expect(onTerminado.mock.calls[0][0]).toMatchObject({ pasos: GUION_TABLAS_Y_FILTROS.pasos.length, tropiezos: 0 });
  });

  it('tras terminar: crear una tabla sobre una celda sola, sobre un rango sin encabezado o encima de la que ya existe no crea nada', async () => {
    await completarClase();
    marcar('H10');
    fireEvent.click(boton('crear-tabla'));
    await celebrar();
    expect(document.querySelectorAll(`[data-tabla-marco]`).length).toBe(1);

    // Justo encima de la tabla que ya existe: se solapan, y eso está prohibido.
    marcar('C20', 'E30');
    crearTabla('Otra');
    await celebrar();
    expect(document.querySelectorAll(`[data-tabla-marco]`).length).toBe(1);
    expect(document.querySelector(`[data-tabla-marco="${ID_TABLA}"]`)).not.toBeNull();
  });

  it('tras terminar: filtrar hasta que no quede ninguna fila deja sólo el encabezado, y quitar filtros repone las cuarenta y una', async () => {
    await completarClase();
    marcar('A4');
    filtrarComparando(COL.aporto, 'mayor', '1000'); // ningún alumno aportó más de 1000
    await celebrar();
    expect(celda('A3').textContent).toContain('Alumno'); // el encabezado nunca se esconde (lleva el triángulo del filtro delante)
    expect(celda('A4')).toBeNull();
    expect(celda('A44')).toBeNull();

    // Ninguna fila de datos se puede volver a marcar con el ratón mientras
    // están todas escondidas: `sel` se queda donde la dejó el marcado de
    // antes de filtrar, que sigue sirviendo para encontrar la tabla.
    quitarFiltros();
    await celebrar();
    expect(celda('A4').textContent).not.toBe('');
    expect(celda('A44').textContent).not.toBe('');
  });

  it('tras terminar: ordenar una tabla filtrada no reordena nada, e Inmovilizar alterna con el mismo botón', async () => {
    await completarClase();
    const primeraFilaAntes = celda('A4').textContent;
    marcar('A4');
    filtrarPorValores(COL.grupo, ['6B']);
    await celebrar();
    // A4 queda escondida en cuanto se filtra (no es 6B): ni el intento de
    // ordenar ni el de quitar el filtro vuelven a marcarla con el ratón.
    // La clase ya terminó (pantalla «Terminaste»): el aviso de la cinta no
    // se pinta ahí, así que la prueba de que se rechazó no es un texto en
    // pantalla — es que las filas SIGUEN en el mismo orden que antes del
    // intento, comprobado dos líneas más abajo.
    ordenarVarias(COL.alumno, true);
    await celebrar();
    quitarFiltros();
    await celebrar();
    expect(celda('A4').textContent).toBe(primeraFilaAntes); // sigue en el mismo orden de antes del intento

    // `inmovilizar` quedó puesto al terminar la clase (encargo 13): el mismo botón lo quita.
    expect(boton('inmovilizar').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(boton('inmovilizar'));
    await celebrar();
    expect(boton('inmovilizar').getAttribute('aria-pressed')).toBe('false');
  });

  it('el clic en una fila visible de una tabla filtrada marca la celda real que se ve, no la que tocaría sin filtro', async () => {
    await completarClase();
    // `completarClase` ya dejó la tabla ordenada por Grupo y Alumno (encargo
    // 9). Calculado —no adivinado— con los mismos datos que usa la clase:
    // dónde queda, en esa lista de cuarenta y una, el TERCER alumno de 6B.
    const comoLaHoja = (a: string, b: string): number => {
      const x = a.toLowerCase();
      const y = b.toLowerCase();
      return x === y ? 0 : x < y ? -1 : 1;
    };
    const conFila = [...ORIGEN, NUEVO_ALUMNO];
    const ordenado = conFila
      .slice()
      .sort((a, b) => comoLaHoja(a.grupo, b.grupo) || comoLaHoja(a.alumno, b.alumno));
    const de6B = ordenado.filter((a) => a.grupo === GRUPO_FILTRADO);
    const tercero = de6B[2];
    const filaTercero = FILA_PRIMERA + ordenado.indexOf(tercero);
    const direccionTercero = `A${filaTercero}`;
    // Un miembro de 6A o 5B, en la fila justo anterior al bloque de 6B: tiene
    // que quedar escondido por el filtro.
    const filaAntesDe6B = FILA_PRIMERA + ordenado.indexOf(de6B[0]) - 1;

    marcar('A4');
    filtrarPorValores(COL.grupo, [GRUPO_FILTRADO]);
    await celebrar();

    expect(celda(`A${filaAntesDe6B}`)).toBeNull(); // el grupo de antes, escondido por el filtro
    expect(celda(direccionTercero)).not.toBeNull();

    // Si el clic calculara la celda a partir del PUESTO en pantalla en vez
    // de la dirección real, marcaría una fila escondida por error.
    marcar(direccionTercero);
    expect(seleccionDelPanel()).toBe(direccionTercero);
    expect(celda(direccionTercero).textContent).toBe(tercero.alumno);
  });
});
