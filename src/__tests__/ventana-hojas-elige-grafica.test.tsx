/**
 * `n6-elige-la-grafica` · «Cada gráfica contesta una pregunta distinta»
 * (bloques 37 · 38). La cuarta clase del grado Intermedio de Tecnia Hojas.
 *
 * Se juega MAL a propósito, que es la regla de la casa: una línea sobre
 * categorías sin orden temporal, una dispersión con una sola columna y un
 * eje mínimo por encima de todos los datos tienen que dibujarse sin romperse,
 * no sólo el camino bueno. Y hay un recorrido de la clase entera, de
 * principio a fin, con los trece encargos resueltos exactamente como los
 * pide su instrucción.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import VentanaHojas from '@/components/office/VentanaHojas';
import { CINTA_EXCEL_BASICO } from '@/components/activities/office/tecniaHojas';
import { CONTROLES, gestosDe, type ContextoCinta } from '@/components/office/motor-hojas/cinta';
import { crearMotor } from '@/components/office/motor-hojas/formula/calculo';
import { cajaDeTexto } from '@/components/office/motor-hojas/comandos';
import {
  CONTROLES_ELIGE_GRAFICA,
} from '@/components/activities/office/excel/elige-la-grafica/controles';
import PanelGraficas from '@/components/activities/office/excel/elige-la-grafica/PanelGraficas';
import {
  EJE_MINIMO_DEL_CORTE,
  GUION_ELIGE_LA_GRAFICA,
  HOJA,
  RANGO_T1,
  RANGO_T2,
  RANGO_T3,
  RANGO_T4,
  RANGO_T4_UNA_COLUMNA,
  RANGO_T5,
  RANGO_T7,
  RANGO_T8,
  libroDeLaFeria,
  seHizoBarrasDePuestos,
  seHizoPastelDeResumenSinTotal,
} from '@/components/activities/office/excel/elige-la-grafica/guion';

beforeAll(() => {
  if (typeof Element.prototype.scrollTo !== 'function') {
    Element.prototype.scrollTo = function scrollTo() {};
  }
  /*
   * jsdom no hace layout, y esta hoja llega hasta la fila 147 (`FILA_T8_ULTIMA`):
   * sin esto, `VentanaHojas.tsx` sólo renderiza los primeros ~30 puestos
   * (misma nota que `ventana-hojas-tablas-clase.test.tsx`) y `A136` o `A145`
   * nunca aparecen en el DOM.
   */
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 3600 });
});

const PANEL_FIJO = { titulo: 'Gráficas', Cuerpo: PanelGraficas };

async function abrir() {
  const salida = render(
    <VentanaHojas
      cinta={CINTA_EXCEL_BASICO}
      guion={GUION_ELIGE_LA_GRAFICA}
      controles={CONTROLES_ELIGE_GRAFICA}
      panelFijo={PANEL_FIJO}
    />,
  );
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

const porControl = (control: string): HTMLElement => document.querySelector(`[data-control="${control}"]`) as HTMLElement;

const encargo = (): string => document.querySelector('.txtw-encargo h3')?.textContent ?? '';

/** `g-h1-<rango sin dos puntos>-<tipo>` — la misma fórmula que usan `cinta.ts` y `controles.ts`. */
const idDe = (rango: string, tipo: string): string => `g-${HOJA}-${rango.replace(':', '-')}-${tipo}`;

const graficaPorId = (id: string): HTMLElement | null => document.querySelector(`[data-grafica="${id}"]`);

const opcion = (texto: string): HTMLElement =>
  Array.from(document.querySelectorAll<HTMLElement>('.txtw-opcion')).find((b) => b.textContent === texto) as HTMLElement;

async function celebrar() {
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
}

function marcarRango(desde: string, hasta: string) {
  fireEvent.mouseDown(celda(desde));
  fireEvent.mouseDown(celda(hasta), { shiftKey: true });
}

function irAPestana(id: string) {
  fireEvent.click(document.querySelector(`[data-pestana="${id}"]`) as HTMLElement);
}

/** Selecciona una gráfica con un clic de cero celdas, igual que en la ventana. */
function pulsarGrafica(id: string) {
  fireEvent.mouseDown(graficaPorId(id) as HTMLElement);
  fireEvent.mouseUp(window);
}

function escribirEnCampo(control: string, texto: string) {
  const input = porControl(control) as HTMLInputElement;
  fireEvent.change(input, { target: { value: texto } });
  fireEvent.blur(input);
}

const altura = (grafica: HTMLElement, barra: string): number =>
  Number(grafica.querySelector(`[data-barra="${barra}"]`)?.getAttribute('height'));

/* ── (1) el libro de partida ─────────────────────────────────────────────── */

describe('n6-elige-la-grafica · el libro de partida', () => {
  it('no adelanta ningún encargo: ninguna de las ocho tablas tiene todavía una gráfica', () => {
    const libro = libroDeLaFeria();
    expect(seHizoBarrasDePuestos(libro)).toBe(false);
    expect(seHizoPastelDeResumenSinTotal(libro)).toBe(false);
    expect(libro.hojas[0].graficas ?? []).toHaveLength(0);
    expect(libro.hojas[0].celdas.A4.crudo).toBe('Puesto');
    expect(libro.hojas[0].celdas.B9.crudo).toBe('71'); // Pintacaritas, el que más vendió
  });

  it('la portada anuncia el tema, y el libro abre sin ninguna gráfica puesta', async () => {
    await abrir();
    expect(screen.getByText('Elegir la gráfica correcta (y las que mienten)')).not.toBeNull();
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());
    expect(celda('A4').textContent).toBe('Puesto');
    expect(document.querySelectorAll('.hjw-grafica')).toHaveLength(0);
    expect(encargo()).toBe('¿Cuál puesto vendió más?');
  });
});

/* ── (2) el recorrido completo, de principio a fin ───────────────────────── */

describe('n6-elige-la-grafica · el recorrido completo', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('los trece encargos se pueden terminar de principio a fin, con las cinco gráficas leyéndose como deben', async () => {
    // Hoja de 150+ filas y ocho gráficas —una con veinte rebanadas—: bajo la
    // carga de la batería completa (38 suites a la vez) el trabajo de jsdom
    // puede pasar de los 30 s por omisión sin que el paso 13 sea lento por sí
    // solo. 60 s deja margen sin esconder una regresión real.
    const onTerminado = jest.fn();
    render(
      <VentanaHojas
        cinta={CINTA_EXCEL_BASICO}
        guion={GUION_ELIGE_LA_GRAFICA}
        controles={CONTROLES_ELIGE_GRAFICA}
        panelFijo={PANEL_FIJO}
        onTerminado={onTerminado}
      />,
    );
    await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());
    irAPestana('insertar'); // se queda activa: todo lo de columnas/líneas/circular vive aquí

    // encargo 1 · barras, por el panel «Gráficas»
    marcarRango('A4', 'B9');
    fireEvent.click(porControl('grafico-barras'));
    await celebrar();
    expect(encargo()).toBe('A propósito: compáralos con una línea');
    const idBarrasPuestos = idDe(RANGO_T1, 'barras');
    expect(graficaPorId(idBarrasPuestos)).not.toBeNull();
    expect(graficaPorId(idBarrasPuestos)!.querySelectorAll('[data-barra]')).toHaveLength(5);

    // encargo 2 · a propósito: línea sobre las mismas categorías, no revienta
    marcarRango('A4', 'B9');
    fireEvent.click(porControl('grafico-lineas'));
    await celebrar();
    expect(encargo()).toBe('Y ahora sí: la evolución de verdad');
    const idLineaPuestos = idDe(RANGO_T1, 'lineas');
    expect(graficaPorId(idLineaPuestos)!.querySelector('[data-linea="0"]')).not.toBeNull();
    expect(graficaPorId(idLineaPuestos)!.querySelectorAll('[data-punto]')).toHaveLength(5);

    // encargo 3 · línea de verdad, sobre la evolución en el tiempo
    marcarRango('A25', 'B31');
    fireEvent.click(porControl('grafico-lineas'));
    await celebrar();
    expect(encargo()).toBe('A propósito: repártelo en un pastel');

    // encargo 4 · a propósito: pastel sobre una evolución, no revienta
    marcarRango('A25', 'B31');
    fireEvent.click(porControl('grafico-circular'));
    await celebrar();
    expect(encargo()).toBe('El presupuesto, repartido de verdad');
    const idPastelSemanas = idDe(RANGO_T2, 'circular');
    expect(graficaPorId(idPastelSemanas)!.querySelectorAll('[data-rebanada]')).toHaveLength(6);

    // encargo 5 · pastel del presupuesto: cuatro rebanadas que suman el total
    marcarRango('A46', 'B50');
    fireEvent.click(porControl('grafico-circular'));
    await celebrar();
    expect(encargo()).toBe('¿Ayuda preparar más a vender más?');

    // encargo 6 · dispersión de horas contra boletos, por el panel «Gráficas»
    marcarRango('A67', 'C72');
    fireEvent.click(porControl('grafico-dispersion'));
    await celebrar();
    expect(encargo()).toBe('Una comparación honesta');
    const idDispersion = idDe(RANGO_T4, 'dispersion');
    const dispersion = graficaPorId(idDispersion)!;
    expect(dispersion.querySelectorAll('[data-punto]')).toHaveLength(5);
    // Sin el aviso de «sólo hay una columna»: las dos columnas se leyeron.
    expect(dispersion.querySelector('[data-rotulo="aviso"]')).toBeNull();

    // encargo 7 · la gráfica A, eje sin cortar: casi empatadas
    marcarRango('A136', 'B138');
    fireEvent.click(porControl('grafico-columnas'));
    await celebrar();
    expect(encargo()).toBe('Construye la misma gráfica, otra vez');
    const idA = idDe(RANGO_T7, 'columnas');
    const graficaA = graficaPorId(idA)!;
    const ratioA = altura(graficaA, '0-1') / altura(graficaA, '0-0'); // Pesca de patitos / Tiro al blanco

    // encargo 8 · la gráfica B, la misma otra vez, en otra tabla
    marcarRango('A145', 'B147');
    fireEvent.click(porControl('grafico-columnas'));
    await celebrar();
    expect(encargo()).toBe('Córtale el eje a la segunda');
    const idB = idDe(RANGO_T8, 'columnas');
    const graficaB = graficaPorId(idB)!;
    const ratioBAntes = altura(graficaB, '0-1') / altura(graficaB, '0-0');
    // Antes de cortar el eje, las dos gráficas cuentan la misma historia.
    expect(Math.abs(ratioBAntes - ratioA)).toBeLessThan(0.05);
    expect(ratioA).toBeLessThan(1.1); // 95/92 ≈ 1.03: casi empatadas

    // encargo 9 · se le corta el eje SÓLO a B
    pulsarGrafica(idB);
    escribirEnCampo('grafica-min-y', String(EJE_MINIMO_DEL_CORTE));
    await celebrar();
    expect(encargo()).toBe('Mira las dos, una al lado de otra');
    const ratioBDespues = altura(graficaB, '0-1') / altura(graficaB, '0-0');
    expect(ratioBDespues).toBeGreaterThan(2); // el mismo 92 contra 95, ahora bien distinto
    // A no se tocó: sigue exactamente como antes de cortar el eje de B.
    expect(altura(graficaA, '0-1') / altura(graficaA, '0-0')).toBeCloseTo(ratioA, 5);

    // encargo 10 · elección: las dos son ciertas, el eje engaña
    fireEvent.click(opcion('Las dos son datos verdaderos, pero el eje cortado de la segunda hace que una diferencia pequeña se vea enorme'));
    await celebrar();
    expect(encargo()).toBe('¿Cortar el eje está prohibido?');

    // encargo 11 · elección: no está prohibido, hay que decirlo
    fireEvent.click(
      opcion('No: a veces está justificado —cuando un cambio pequeño de verdad importa— y lo único obligatorio es decirlo, con una nota o marcando el corte'),
    );
    await celebrar();
    expect(encargo()).toBe('El pastel de veinte porciones');

    // encargo 12 · pastel de veinte, con colores que se repiten
    marcarRango('A89', 'B109');
    fireEvent.click(porControl('grafico-circular'));
    await celebrar();
    expect(encargo()).toBe('Un pastel de cosas que no suman nada');
    const idDisfraces = idDe(RANGO_T5, 'circular');
    const pastelDisfraces = graficaPorId(idDisfraces)!;
    expect(pastelDisfraces.querySelectorAll('[data-rebanada]')).toHaveLength(20);
    // La paleta tiene seis colores: la séptima rebanada repite el color de la primera.
    const colorRebanada0 = pastelDisfraces.querySelector('[data-rebanada="0"]')?.getAttribute('fill');
    const colorRebanada6 = pastelDisfraces.querySelector('[data-rebanada="6"]')?.getAttribute('fill');
    expect(colorRebanada0).toBe(colorRebanada6);

    // encargo 13 · pastel de tres medidas que no suman ningún total real
    marcarRango('A116', 'B119');
    fireEvent.click(porControl('grafico-circular'));
    await celebrar();

    expect(screen.getByText('Terminaste')).not.toBeNull();
    expect(onTerminado).toHaveBeenCalledTimes(1);
    expect(onTerminado.mock.calls[0][0]).toMatchObject({ pasos: GUION_ELIGE_LA_GRAFICA.pasos.length, tropiezos: 0 });
  });
});

/* ── (3) jugando mal a propósito ─────────────────────────────────────────── */

/**
 * Los encargos 1-5, resueltos bien, tal cual los pide el guion — para dejar
 * activo el encargo 6 («¿Ayuda preparar más a vender más?», señal
 * `grafico-dispersion`). Hace falta porque `esDesvio` (`chrome/ganchos.ts`)
 * rechaza cualquier control que no sea el que la señal del paso ACTIVO
 * espera —«equivocarse de botón avisa y no toca el libro» (§37)—, así que un
 * «juega mal» con `grafico-dispersion` en el primer paso (que espera
 * `grafico-barras`) no llegaría a tocar el libro y `graficaPorId` saldría
 * `null` antes de poder comprobar nada.
 */
async function avanzarHastaLaDispersion() {
  irAPestana('insertar');
  marcarRango('A4', 'B9');
  fireEvent.click(porControl('grafico-barras'));
  await celebrar();
  marcarRango('A4', 'B9');
  fireEvent.click(porControl('grafico-lineas'));
  await celebrar();
  marcarRango('A25', 'B31');
  fireEvent.click(porControl('grafico-lineas'));
  await celebrar();
  marcarRango('A25', 'B31');
  fireEvent.click(porControl('grafico-circular'));
  await celebrar();
  marcarRango('A46', 'B50');
  fireEvent.click(porControl('grafico-circular'));
  await celebrar();
}

/** Lo anterior, y además los encargos 6-8, para dejar hechas A y B (bloque 38). */
async function avanzarHastaLasDosGraficasGemelas() {
  await avanzarHastaLaDispersion();
  marcarRango('A67', 'C72');
  fireEvent.click(porControl('grafico-dispersion'));
  await celebrar();
  marcarRango('A136', 'B138');
  fireEvent.click(porControl('grafico-columnas'));
  await celebrar();
  marcarRango('A145', 'B147');
  fireEvent.click(porControl('grafico-columnas'));
  await celebrar();
}

describe('n6-elige-la-grafica · jugando mal a propósito', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('dispersión con una sola columna: avisa que el orden hace de eje X, y no revienta', async () => {
    await abrirYEmpezar();
    await avanzarHastaLaDispersion();
    expect(encargo()).toBe('¿Ayuda preparar más a vender más?');

    marcarRango('C67', 'C72');
    fireEvent.click(porControl('grafico-dispersion')); // el botón que sí espera este paso, con el rango malo
    const id = idDe(RANGO_T4_UNA_COLUMNA, 'dispersion');
    const grafica = graficaPorId(id);
    expect(grafica).not.toBeNull();
    expect(grafica!.querySelectorAll('[data-punto]')).toHaveLength(5);
    const aviso = grafica!.querySelector('[data-rotulo="aviso"]')?.textContent ?? '';
    expect(aviso).toMatch(/sólo hay una, así que abajo va el orden/);
  });

  it('un eje mínimo por encima de todos los datos no revienta: el dibujo se aplana y se sostiene', async () => {
    await abrirYEmpezar();
    await avanzarHastaLasDosGraficasGemelas();
    expect(encargo()).toBe('Córtale el eje a la segunda');

    const idA = idDe(RANGO_T7, 'columnas');
    // El campo «Eje mínimo (Y)» no pasa por la guarda del desvío —es un panel
    // de campos, como `grafica-titulo` y sus vecinos (`VentanaHojas.tsx`)—,
    // así que se puede tocar aunque el paso activo señale otra gráfica.
    pulsarGrafica(idA);
    // 92 y 95 son los datos; 200 queda por encima de los dos.
    escribirEnCampo('grafica-min-y', '200');
    const grafica = graficaPorId(idA)!;
    expect(grafica.querySelectorAll('[data-barra]')).toHaveLength(2);
    // Las dos barras quedan pegadas al mismo borde: ninguna altura es negativa ni NaN.
    expect(altura(grafica, '0-0')).toBeGreaterThanOrEqual(0);
    expect(altura(grafica, '0-1')).toBeGreaterThanOrEqual(0);
    expect(Number.isNaN(altura(grafica, '0-0'))).toBe(false);
  });

  it('el campo «Eje mínimo (Y)» no se cruza entre dos gráficas distintas', async () => {
    await abrirYEmpezar();
    await avanzarHastaLasDosGraficasGemelas();

    const idA = idDe(RANGO_T7, 'columnas');
    const idB = idDe(RANGO_T8, 'columnas');

    pulsarGrafica(idA);
    escribirEnCampo('grafica-min-y', '80');
    pulsarGrafica(idB);
    escribirEnCampo('grafica-min-y', '90');

    // Reabrir A y comprobar que conservó SU propio valor, no el de B.
    pulsarGrafica(idA);
    expect((porControl('grafica-min-y') as HTMLInputElement).value).toBe('80');
    pulsarGrafica(idB);
    expect((porControl('grafica-min-y') as HTMLInputElement).value).toBe('90');
  });
});

/* ── (4) los dos botones nuevos no tocan la cinta compartida ────────────── */

describe('n6-elige-la-grafica · barras y dispersión entran por el panel de la clase', () => {
  it('«grafico-barras» y «grafico-dispersion» no existen en la tabla compartida de `motor-hojas/cinta.ts`', () => {
    expect(CONTROLES['grafico-barras']).toBeUndefined();
    expect(CONTROLES['grafico-dispersion']).toBeUndefined();
    expect(CONTROLES_ELIGE_GRAFICA['grafico-barras']).toBeDefined();
    expect(CONTROLES_ELIGE_GRAFICA['grafico-dispersion']).toBeDefined();
  });

  it('los dos se apagan con una sola celda marcada, y responden con `deLaClase` sobre un rango', () => {
    const libro = libroDeLaFeria();
    const motor = crearMotor(libro, { ahora: Date.UTC(2026, 7, 21, 9, 0, 0) });
    const unaCelda: ContextoCinta = { motor, hoja: HOJA, sel: { c0: 0, f0: 3, c1: 0, f1: 3 } };
    expect(gestosDe(unaCelda, 'grafico-barras', CONTROLES_ELIGE_GRAFICA)).toBeNull();

    const caja = cajaDeTexto(RANGO_T3)!;
    const rango: ContextoCinta = { motor, hoja: HOJA, sel: caja };
    const gestos = gestosDe(rango, 'grafico-dispersion', CONTROLES_ELIGE_GRAFICA);
    expect(gestos).not.toBeNull();
    expect(gestos![0]).toMatchObject({ comando: 'insertarGrafica', args: { tipo: 'dispersion', datos: RANGO_T3 } });
  });
});
