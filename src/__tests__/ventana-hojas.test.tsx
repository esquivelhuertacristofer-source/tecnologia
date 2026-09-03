/**
 * Tecnia Hojas · **la ventana pintada** (§45.7, paso 2).
 *
 * Esta prueba existe porque `VentanaHojas.tsx` compiló durante un día entero sin
 * que nadie la hubiera puesto nunca en una pantalla, y de ese día salió una
 * docena larga de defectos que el compilador no podía ver: un editor que le
 * robaba el foco a la barra de fórmulas, un botón construido dos veces y apagado
 * en una, un tipo de encargo sin construir que dejaba la clase parada para
 * siempre, y la selección —que es la mitad de la primera clase de Excel— sin
 * llegar al corrector.
 *
 * Ninguno se cazaba con `tsc`, y todos se cazan montando. Así que
 * lo que se prueba aquí no es el motor —eso está en `motor-hojas.test.ts`, con
 * ochenta y cinco pruebas— sino **lo que sólo se rompe cuando hay DOM**: que la
 * ventana se pinta entera, que se puede escribir en los dos sitios donde se
 * escribe, que la selección cuenta y que un encargo se cierra al cumplirlo.
 *
 * Y se juega MAL a propósito, que es la regla de la casa: se pulsa el botón
 * equivocado, se escribe una fórmula rota y se contesta mal la pregunta.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import VentanaHojas, { ALTO_CAB, ALTO_FILA, ANCHO_CAB, ANCHO_COL } from '@/components/office/VentanaHojas';
import type { GuionHojas } from '@/components/office/motor-hojas/guion';
import { CINTA_EXCEL_BASICO } from '@/components/activities/office/tecniaHojas';
import { aplicar } from '@/components/office/motor-hojas/comandos';
import { crudoEn, dirAColFila } from '@/components/office/motor-hojas/modelo';
import {
  GUION_CELDAS_FILAS_COLUMNAS,
  PROPINA,
  libroDeLaSalida,
} from '@/components/activities/office/excel/celdas-filas-columnas/guion';
import {
  GUION_CAPTURA_Y_ORDENA,
  libroDeLosPagos,
} from '@/components/activities/office/excel/captura-y-ordena/guion';
import {
  GUION_TUS_PRIMERAS_FORMULAS,
  libroDeLosGastos,
} from '@/components/activities/office/excel/tus-primeras-formulas/guion';

/**
 * El mismo libro **sin encargos**, para probar el aparato.
 *
 * Hace falta porque el modo guía funciona: mientras un encargo nombra un botón,
 * **cualquier otro es un desvío y no toca el libro** (§37). Eso es exactamente
 * lo que el cliente compró, y es lo que hay que sortear para probar que
 * «Insertar columnas» inserta una columna — si no, se acaba probando el
 * señalador y creyendo que se probó la cinta. De paso prueba una cosa más: que
 * un guion **sin portada** entra directo y no se queda en una pantalla negra.
 */
const GUION_LIBRE: GuionHojas = {
  archivo: 'Gastos de la salida del salón.xlsx',
  libro: libroDeLaSalida,
  // Un encargo que nunca se cumple y que **no nombra ningún control**: así el
  // panel sigue vivo —los avisos se pintan dentro del encargo de turno, no en la
  // pantalla de «Terminaste»— y ningún botón se cuenta como desvío.
  pasos: [
    {
      id: 'libre',
      titulo: 'Trastea',
      instruccion: 'Aquí no se pide nada.',
      pista: 'Nada.',
      logro: { tipo: 'documento', comprueba: () => false },
      aprendido: 'Nada.',
    },
  ],
};

/*
 * jsdom no trae `scrollTo` en los elementos y el salto del cuadro de nombres lo
 * usa para llevar la vista a la celda. No es un defecto de la ventana: es una
 * pieza del navegador que aquí no existe, y se pone de mentira para poder
 * probar lo que sí es nuestro —que el salto cambia la celda activa—.
 */
beforeAll(() => {
  if (typeof Element.prototype.scrollTo !== 'function') {
    Element.prototype.scrollTo = function scrollTo() {};
  }
});

/*
 * La ventana se cuelga del `<body>` con un portal y el hueco aparece en un
 * `requestAnimationFrame`, así que el primer render devuelve `null` a propósito.
 * Montar y no esperar ese cuadro daría un `container` vacío y la prueba
 * suspendería a la ventana por hacer justo lo que tiene que hacer.
 */
async function abrir() {
  const salida = render(
    <VentanaHojas cinta={CINTA_EXCEL_BASICO} guion={GUION_CELDAS_FILAS_COLUMNAS} minutos={14} />,
  );
  await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
  return salida;
}

/** Entrar de verdad: la portada de objetivos tapa la ventana hasta que se pulsa. */
async function abrirYEmpezar() {
  const salida = await abrir();
  fireEvent.click(screen.getByText('Abrir el libro'));
  await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());
  return salida;
}

/** La misma ventana con el guion libre: sin portada y sin encargos de por medio. */
async function abrirLibre() {
  const salida = render(<VentanaHojas cinta={CINTA_EXCEL_BASICO} guion={GUION_LIBRE} />);
  await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
  expect(document.querySelector('.txtw-portada')).toBeNull();
  return salida;
}

const celda = (direccion: string): HTMLElement =>
  document.querySelector(`[data-celda="${direccion}"]`) as HTMLElement;

const boton = (control: string): HTMLElement =>
  document.querySelector(`[data-control="${control}"]`) as HTMLElement;

const rejilla = (): HTMLElement => document.querySelector('.hjw-rejilla') as HTMLElement;

/** El encargo de turno, tal y como lo lee el alumno en el panel. */
const encargo = (): string => document.querySelector('.txtw-encargo h3')?.textContent ?? '';

/** Avanzar los 900 ms de la celebración. */
async function celebrar() {
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
}

describe('VentanaHojas · se pinta', () => {
  it('trae las seis pestañas, la cinta, la barra de fórmulas y la cuadrícula', async () => {
    await abrir();

    // La cinta viva, con sus botones y su domicilio puesto en el DOM.
    expect(document.querySelectorAll('[data-pestana]')).toHaveLength(CINTA_EXCEL_BASICO.length);
    expect(boton('negrita')).not.toBeNull();
    expect(boton('insertar-columna')).not.toBeNull();

    // Las tres partes de la ventana que el bloque 2 nombra y que no son botones.
    expect(document.querySelector('.hjw-nombres input')).not.toBeNull();
    expect(document.querySelector('.hjw-formula')).not.toBeNull();
    expect(document.querySelector('.txtw-estado')).not.toBeNull();

    // Y la hoja, con los datos del libro de partida dentro de sus celdas.
    expect(celda('A4').textContent).toBe('Camión de la escuela a Teotihuacán');
    expect(celda('D5').textContent).toBe('3610');
    expect(document.querySelectorAll('[data-hoja]')).toHaveLength(2);
  });

  it('la portada de objetivos tapa el libro hasta que se pulsa', async () => {
    await abrir();
    expect(document.querySelector('.txtw-portada')).not.toBeNull();
    expect(screen.getByText('La celda, la fila y la columna')).not.toBeNull();
    fireEvent.click(screen.getByText('Abrir el libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());
  });
});

describe('VentanaHojas · escribir en los dos sitios donde se escribe', () => {
  it('tecleando en la celda', async () => {
    await abrirLibre();
    fireEvent.mouseDown(celda('F1'));
    fireEvent.keyDown(rejilla(), { key: '7' });
    const editor = document.querySelector('.hjw-editor') as HTMLInputElement;
    expect(editor).not.toBeNull();
    fireEvent.change(editor, { target: { value: '77' } });
    fireEvent.keyDown(editor, { key: 'Enter' });
    await waitFor(() => expect(celda('F1').textContent).toBe('77'));
  });

  it('y en la barra de fórmulas, SIN que la celda le robe el foco', async () => {
    await abrirLibre();
    fireEvent.mouseDown(celda('F2'));
    const barra = document.querySelector('.hjw-formula') as HTMLInputElement;
    fireEvent.change(barra, { target: { value: '5' } });
    // El defecto era exactamente esto: la celda abría su editor con `autoFocus`
    // y el cursor se iba de la barra a la primera letra.
    expect(document.querySelector('.hjw-editor')).toBeNull();
    fireEvent.change(barra, { target: { value: '50' } });
    fireEvent.keyDown(barra, { key: 'Enter' });
    await waitFor(() => expect(celda('F2').textContent).toBe('50'));
  });

  it('una fórmula que no se entiende NO entra al libro y se dice por qué', async () => {
    await abrirLibre();
    fireEvent.mouseDown(celda('F3'));
    fireEvent.keyDown(rejilla(), { key: '=' });
    const editor = document.querySelector('.hjw-editor') as HTMLInputElement;
    fireEvent.change(editor, { target: { value: '=SUMA(' } });
    fireEvent.keyDown(editor, { key: 'Enter' });

    await screen.findByText('Así no se puede guardar todavía.');
    expect(celda('F3').textContent).toBe('');
    // Y la celda sigue en edición con lo escrito: no se le tira el trabajo.
    expect((document.querySelector('.hjw-editor') as HTMLInputElement).value).toBe('=SUMA(');
  });
});

describe('VentanaHojas · la barra de estado cuenta lo que hay marcado', () => {
  it('seis importes marcados dan recuento 6 y suma 12020', async () => {
    await abrirLibre();
    fireEvent.mouseDown(celda('D4'));
    fireEvent.mouseDown(celda('D9'), { shiftKey: true });
    const estado = document.querySelector('.hjw-cuenta')?.textContent ?? '';
    expect(estado).toContain('6');
    expect(estado).toContain('12020');
  });
});

describe('VentanaHojas · el guion se juega, bien y mal', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('la selección cierra el primer encargo, y el botón equivocado no ensucia la hoja', async () => {
    await abrirYEmpezar();
    expect(encargo()).toBe('Cada casilla tiene nombre');

    // JUGAR MAL · el encargo pide una celda y se pulsa un botón de formato. Ni
    // el libro se toca ni el encargo avanza: lo que sale es dónde estaba el bueno.
    fireEvent.click(boton('negrita'));
    expect(document.querySelector('.txtw-aviso')).not.toBeNull();
    expect(encargo()).toBe('Cada casilla tiene nombre');

    // JUGAR MAL · la celda de al lado tampoco es.
    fireEvent.mouseDown(celda('A5'));
    expect(encargo()).toBe('Cada casilla tiene nombre');

    fireEvent.mouseDown(celda('A4'));
    await celebrar();
    expect(encargo()).toBe('Lo que no cabe');
  });

  it('ni la hoja nueva ni las lengüetas se escapan del desvío', async () => {
    await abrirYEmpezar();
    // JUGAR MAL · el `+` de hoja nueva y la lengüeta de la otra hoja cambian el
    // libro por su cuenta, sin pasar por la cinta. Durante un encargo que pide
    // otra cosa, tampoco ellos pueden tocarlo.
    fireEvent.click(document.querySelector('.hjw-hoja-mas') as HTMLElement);
    expect(document.querySelectorAll('[data-hoja]')).toHaveLength(2);
    fireEvent.click(document.querySelector('[data-hoja="h2"]') as HTMLElement);
    expect(celda('A4').textContent).toBe('Camión de la escuela a Teotihuacán');
    expect(encargo()).toBe('Cada casilla tiene nombre');
  });

  it('una pregunta contestada mal avisa; contestada bien, avanza', async () => {
    await abrirYEmpezar();
    fireEvent.mouseDown(celda('A4'));
    await celebrar();

    // JUGAR MAL · la primera opción es la trampa: «se guardó a medias».
    fireEvent.click(screen.getByText(/Se guardó a medias/));
    expect(document.querySelector('.txtw-error')).not.toBeNull();
    expect(encargo()).toBe('Lo que no cabe');

    fireEvent.click(screen.getByText(/Está entero/));
    await celebrar();
    expect(encargo()).toBe('De aquí hasta allá');
  });

  it('el cuadro de nombres lleva de un salto y cierra su encargo', async () => {
    await abrirYEmpezar();
    fireEvent.mouseDown(celda('A4'));
    await celebrar();
    fireEvent.click(screen.getByText(/Está entero/));
    await celebrar();
    fireEvent.mouseDown(celda('D4'));
    fireEvent.mouseDown(celda('D9'), { shiftKey: true });
    await celebrar();
    expect(encargo()).toBe('El cuadro de nombres, al revés');

    const nombres = document.querySelector('.hjw-nombres input') as HTMLInputElement;
    // JUGAR MAL · algo que no es una celda.
    fireEvent.keyDown(nombres, { key: 'Enter', target: { value: 'la de abajo' } });
    expect(encargo()).toBe('El cuadro de nombres, al revés');

    fireEvent.keyDown(nombres, { key: 'Enter', target: { value: 'a20' } });
    await celebrar();
    expect(encargo()).toBe('Al final de la lista');
  });

  it('Ctrl+flecha se planta en el último dato de la lista', async () => {
    await abrirLibre();
    fireEvent.mouseDown(celda('A4'));
    fireEvent.keyDown(rejilla(), { key: 'ArrowDown', ctrlKey: true });
    const nombres = document.querySelector('.hjw-nombres input') as HTMLInputElement;
    expect(nombres.value).toBe('A9');

    // Y otra vez salta el hueco hasta el siguiente dato, como en Excel.
    fireEvent.keyDown(rejilla(), { key: 'ArrowDown', ctrlKey: true });
    expect((document.querySelector('.hjw-nombres input') as HTMLInputElement).value).toBe('A11');
  });
});

/**
 * ── LA CLASE ENTERA, DE PRINCIPIO A FIN ────────────────────────────────────
 *
 * Once encargos jugados en fila, que es la única manera de saber que la clase
 * **se puede terminar**. Un encargo suelto puede estar bien y la clase seguir
 * siendo injugable si el sexto deja la hoja en un estado en el que el séptimo ya
 * no se puede cumplir — y eso no lo ve nadie leyendo los predicados, porque cada
 * uno por separado es correcto.
 */
describe('VentanaHojas · la clase se termina', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('los once encargos, en fila y sin un solo tropiezo', async () => {
    const onTerminado = jest.fn();
    render(
      <VentanaHojas
        cinta={CINTA_EXCEL_BASICO}
        guion={GUION_CELDAS_FILAS_COLUMNAS}
        onTerminado={onTerminado}
      />,
    );
    await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
    fireEvent.click(screen.getByText('Abrir el libro'));

    // 1 · el domicilio
    fireEvent.mouseDown(celda('A4'));
    await celebrar();

    // 2 · lo que no cabe
    fireEvent.click(screen.getByText(/Está entero/));
    await celebrar();

    // 3 · el rectángulo
    fireEvent.mouseDown(celda('D4'));
    fireEvent.mouseDown(celda('D9'), { shiftKey: true });
    await celebrar();

    // 4 · de un salto
    fireEvent.keyDown(document.querySelector('.hjw-nombres input') as HTMLInputElement, {
      key: 'Enter',
      target: { value: 'A20' },
    });
    await celebrar();

    // 5 · hasta el final de la lista
    fireEvent.mouseDown(celda('A4'));
    fireEvent.keyDown(rejilla(), { key: 'ArrowDown', ctrlKey: true });
    await celebrar();

    // 6 · la fila que faltaba
    fireEvent.click(boton('insertar-fila'));
    await celebrar();
    expect(celda('A10').textContent).toBe(PROPINA);

    // 7 · llenar el renglón nuevo
    fireEvent.mouseDown(celda('A9'));
    fireEvent.keyDown(rejilla(), { key: 'E' });
    let editor = document.querySelector('.hjw-editor') as HTMLInputElement;
    fireEvent.change(editor, { target: { value: 'Estacionamiento del camión' } });
    fireEvent.keyDown(editor, { key: 'Enter' });
    fireEvent.mouseDown(celda('D9'));
    fireEvent.keyDown(rejilla(), { key: '1' });
    editor = document.querySelector('.hjw-editor') as HTMLInputElement;
    fireEvent.change(editor, { target: { value: '180' } });
    fireEvent.keyDown(editor, { key: 'Enter' });
    await celebrar();

    // 8 · la fila que sobraba
    fireEvent.click(document.querySelector('[data-fila="10"]') as HTMLElement);
    fireEvent.click(boton('borrar-fila'));
    await celebrar();

    // 9 · la columna nueva
    fireEvent.mouseDown(celda('D3'));
    fireEvent.click(boton('insertar-columna'));
    await celebrar();
    expect(celda('E3').textContent).toBe('Lo pagado');

    // 10 · las rayas no son la hoja
    fireEvent.click(document.querySelector('[data-pestana="vista"]') as HTMLElement);
    fireEvent.click(boton('ver-cuadricula'));
    await celebrar();

    // 11 · la otra hoja
    fireEvent.click(document.querySelector('[data-hoja="h2"]') as HTMLElement);
    await celebrar();

    expect(screen.getByText('Terminaste')).not.toBeNull();
    expect(onTerminado).toHaveBeenCalledTimes(1);
    expect(onTerminado.mock.calls[0][0]).toMatchObject({ pasos: 11, tropiezos: 0 });
  });
});

describe('VentanaHojas · insertar y borrar desde la cinta', () => {
  it('insertar una fila empuja hacia abajo lo que había', async () => {
    await abrirLibre();
    fireEvent.mouseDown(celda('A9'));
    expect(celda('A9').textContent).toBe(PROPINA);
    fireEvent.click(boton('insertar-fila'));
    await waitFor(() => expect(celda('A10').textContent).toBe(PROPINA));
    expect(celda('A9').textContent).toBe('');
  });

  it('insertar una columna empuja hacia la derecha lo que había', async () => {
    await abrirLibre();
    fireEvent.mouseDown(celda('D3'));
    fireEvent.click(boton('insertar-columna'));
    await waitFor(() => expect(celda('E3').textContent).toBe('Lo pagado'));
    expect(celda('D3').textContent).toBe('');
    expect(celda('C3').textContent).toBe('Precio');
  });

  it('deshacer devuelve la hoja a como estaba', async () => {
    await abrirLibre();
    fireEvent.mouseDown(celda('A9'));
    fireEvent.click(boton('insertar-fila'));
    await waitFor(() => expect(celda('A10').textContent).toBe(PROPINA));
    fireEvent.click(boton('deshacer'));
    await waitFor(() => expect(celda('A9').textContent).toBe(PROPINA));
  });
});

describe('VentanaHojas · la guía señala y explica lo que no es un botón', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('el cuadro de nombres lleva aro Y ficha, como cualquier botón', async () => {
    await abrirYEmpezar();
    fireEvent.mouseDown(celda('A4'));
    await celebrar();
    fireEvent.click(screen.getByText(/Está entero/));
    await celebrar();
    fireEvent.mouseDown(celda('D4'));
    fireEvent.mouseDown(celda('D9'), { shiftKey: true });
    await celebrar();

    // El encargo del cuadro de nombres, que no vive en la cinta.
    expect(document.querySelector('.txtw-halo')).not.toBeNull();
    const ficha = document.querySelector('.txtw-ficha')?.textContent ?? '';
    expect(ficha).toContain('Cuadro de nombres');
    // Y la frase de `QUE_HACE_EXCEL`, que antes estaba escrita y no se enseñaba.
    expect(ficha).toContain('en qué celda estás parado');
  });

  it('la portada se puede volver a abrir sin reiniciar la práctica', async () => {
    await abrirYEmpezar();
    fireEvent.mouseDown(celda('A4'));
    await celebrar();
    expect(encargo()).toBe('Lo que no cabe');

    fireEvent.click(screen.getByLabelText('Ver de nuevo los objetivos de la práctica'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).not.toBeNull());
    // Y al reabrirla dice «Volver», no «Abrir»: ya se había entrado.
    fireEvent.click(screen.getByText('Volver al libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());
    expect(encargo()).toBe('Lo que no cabe');
  });
});

describe('VentanaHojas · los botones apagados explican, y los encendidos responden', () => {
  it('«Ancho de columna» está apagado y dice qué mirar mientras tanto', async () => {
    await abrirLibre();
    fireEvent.click(boton('ancho-columna'));
    const aviso = document.querySelector('.txtw-aviso')?.textContent ?? '';
    expect(aviso).toContain('todas las columnas miden lo mismo');
    // Y no ha tocado el libro.
    expect(celda('A4').textContent).toBe('Camión de la escuela a Teotihuacán');
  });

  it('«Líneas de cuadrícula» apaga las líneas de verdad', async () => {
    await abrirLibre();
    fireEvent.click(document.querySelector('[data-pestana="vista"]') as HTMLElement);
    expect(rejilla().className).not.toContain('sin-cuadricula');
    fireEvent.click(boton('ver-cuadricula'));
    await waitFor(() => expect(rejilla().className).toContain('sin-cuadricula'));
    fireEvent.click(boton('ver-cuadricula'));
    await waitFor(() => expect(rejilla().className).not.toContain('sin-cuadricula'));
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   `n5-captura-y-ordena` · la clase 2 (bloques 5 · 8 · 11 · 16 · 19)

   Lo que estrena esta clase no es motor —el §46 lo dejó pagado— sino **ventana**:
   el cuadrito de relleno, el portapapeles, el renombrado y el arrastre de las
   lengüetas, y la paleta de color. Nada de eso se puede probar sin DOM, y todo
   se prueba aquí jugando bien una vez y mal muchas.
   ═══════════════════════════════════════════════════════════════════════════ */

/** El mismo libro de la clase 2 pero sin encargos, para probar el aparato. */
const LIBRE_PAGOS: GuionHojas = {
  archivo: 'Gastos de la salida del salón.xlsx',
  libro: libroDeLosPagos,
  pasos: [
    {
      id: 'libre',
      titulo: 'Trastea',
      instruccion: 'Aquí no se pide nada.',
      pista: 'Nada.',
      logro: { tipo: 'documento', comprueba: () => false },
      aprendido: 'Nada.',
    },
  ],
};

async function abrirPagos() {
  const salida = render(<VentanaHojas cinta={CINTA_EXCEL_BASICO} guion={LIBRE_PAGOS} />);
  await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
  return salida;
}

/**
 * Dónde cae el ratón para señalar una celda.
 *
 * En jsdom un elemento no tiene caja, así que `getBoundingClientRect` da ceros:
 * la ventana toma de ahí el origen de la rejilla y el resto es la misma división
 * entera que en un navegador de verdad. O sea que estas coordenadas son las que
 * tendría un ratón real sobre una ventana pegada a la esquina.
 */
const puntoDe = (col: number, fila: number) => ({
  clientX: ANCHO_CAB + col * ANCHO_COL + 10,
  clientY: ALTO_CAB + fila * ALTO_FILA + 5,
});

/** Agarrar el cuadrito verde y arrastrarlo hasta una celda. */
function arrastrarTirador(col: number, fila: number, ctrlKey = false) {
  const tirador = document.querySelector('.hjw-tirador') as HTMLElement;
  expect(tirador).not.toBeNull();
  fireEvent.mouseDown(tirador);
  fireEvent.mouseMove(window, puntoDe(col, fila));
  fireEvent.mouseUp(window, { ...puntoDe(col, fila), ctrlKey });
}

/** Marcar un rectángulo con el ratón, como el alumno. */
function marcar(desde: string, hasta?: string) {
  fireEvent.mouseDown(celda(desde));
  if (hasta) fireEvent.mouseDown(celda(hasta), { shiftKey: true });
}

/** Teclear un dato dentro de una celda y confirmarlo con Entrar. */
function teclear(direccion: string, texto: string) {
  fireEvent.mouseDown(celda(direccion));
  fireEvent.keyDown(rejilla(), { key: texto[0] });
  const editor = document.querySelector('.hjw-editor') as HTMLInputElement;
  fireEvent.change(editor, { target: { value: texto } });
  fireEvent.keyDown(editor, { key: 'Enter' });
}

const lenguetas = (): HTMLElement[] =>
  Array.from(document.querySelectorAll('[data-hoja]')) as HTMLElement[];

const lengueta = (id: string): HTMLElement =>
  document.querySelector(`[data-hoja="${id}"]`) as HTMLElement;

describe('VentanaHojas · el cuadrito de relleno (bloque 8)', () => {
  it('arrastrarlo CONTINÚA la serie: dos folios dan diez más', async () => {
    await abrirPagos();
    // Los folios de esta hoja llegan tecleados en la F, así que se prueba ahí.
    marcar('F4', 'F5');
    arrastrarTirador(5, 14);
    await waitFor(() => expect(celda('F15').textContent).toBe('112'));
    expect(celda('F6').textContent).toBe('103');
    // Y lo marcado queda estirado, como en Excel: se sigue viendo qué se llenó.
    expect(celda('F10').className).toContain('es-dentro');
  });

  it('con una sola semilla COPIA, y con Ctrl copia aunque hubiera serie', async () => {
    await abrirPagos();
    // Una sola: la cuota, que es la misma para todos.
    marcar('B4');
    arrastrarTirador(1, 14);
    await waitFor(() => expect(celda('B15').textContent).toBe('320'));
    expect(celda('B9').textContent).toBe('320');

    // Dos semillas que SÍ harían serie, arrastradas con Ctrl: se copia y no se
    // cuenta nada.
    marcar('F4', 'F5');
    arrastrarTirador(5, 8, true);
    await waitFor(() => expect(celda('F9').textContent).toBe('101'));
    expect(celda('F6').textContent).toBe('101');
  });

  it('arrastrado hacia la derecha rellena hacia la derecha, aunque la caja sea alta', async () => {
    await abrirPagos();
    // Dos filas de semilla estiradas de lado: la forma de la caja resultante
    // dice «abajo» y el alumno arrastró a la derecha. Sin la dirección puesta a
    // mano, este arrastre no hacía nada de nada.
    marcar('F4', 'F5');
    arrastrarTirador(7, 4);
    await waitFor(() => expect(celda('G4').textContent).toBe('101'));
    expect(celda('H5').textContent).toBe('102');
  });

  it('lo que hace el arrastre es un GESTO, así que queda grabado en una macro', async () => {
    await abrirPagos();
    marcar('F4', 'F5');
    arrastrarTirador(5, 14);
    await waitFor(() => expect(celda('F15').textContent).toBe('112'));

    /*
     * La prueba del §45.6, en la ventana: **el arrastre y el gesto dan el mismo
     * libro**. Si el tirador tocara el libro por su cuenta —que es lo cómodo,
     * porque tiene el motor a mano— la pantalla quedaría idéntica y la macro
     * saldría vacía, y eso no se ve hasta la clase 55.
     */
    const porGesto = aplicar(libroDeLosPagos(), {
      comando: 'rellenarSerie',
      args: { hoja: 'h3', rango: 'F4:F15', direccion: 'abajo' },
    });
    for (let f = 4; f <= 15; f += 1) {
      const p = dirAColFila(`F${f}`) as { col: number; fila: number };
      expect(celda(`F${f}`).textContent).toBe(crudoEn(porGesto, 'h3', p.col, p.fila));
    }
  });

  it('JUGAR MAL · arrastrarlo cuando el encargo pedía otra cosa avisa y no ensucia', async () => {
    render(<VentanaHojas cinta={CINTA_EXCEL_BASICO} guion={GUION_CAPTURA_Y_ORDENA} />);
    await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
    fireEvent.click(screen.getByText('Abrir el libro'));
    expect(encargo()).toBe('Apunta a la que falta');

    marcar('F4', 'F5');
    arrastrarTirador(5, 14);

    // Ni una celda escrita, ni un encargo saltado: es la guarda del §37, que el
    // arrastre no se salta por ser un arrastre (defecto 5 del §47.6).
    expect(document.querySelector('.txtw-aviso')).not.toBeNull();
    expect(celda('F6').textContent).toBe('');
    expect(encargo()).toBe('Apunta a la que falta');
  });
});

describe('VentanaHojas · el portapapeles (bloque 11)', () => {
  it('copiar y pegar en UNA celda suelta el rango entero', async () => {
    await abrirPagos();
    marcar('A4', 'A6');
    fireEvent.click(boton('copiar'));
    // Y lo copiado se ve marcado: sin eso, el portapapeles es invisible.
    expect(document.querySelector('.hjw-marca')).not.toBeNull();

    marcar('H10');
    fireEvent.click(boton('pegar'));
    await waitFor(() => expect(celda('H10').textContent).toBe('Rodrigo Bautista'));
    expect(celda('H12').textContent).toBe('Emiliano Cruz');
    // Copiar no se lleva nada de su sitio.
    expect(celda('A4').textContent).toBe('Rodrigo Bautista');
  });

  it('cortar y pegar MUDA: llega al destino y se va del origen', async () => {
    await abrirPagos();
    marcar('F4', 'F5');
    fireEvent.click(boton('cortar'));
    // Todavía no se ha movido nada: cortar sólo marca.
    expect(celda('F4').textContent).toBe('101');
    expect(document.querySelector('.hjw-marca.es-corte')).not.toBeNull();

    marcar('D4');
    fireEvent.click(boton('pegar'));
    await waitFor(() => expect(celda('D4').textContent).toBe('101'));
    expect(celda('D5').textContent).toBe('102');
    expect(celda('F4').textContent).toBe('');
    expect(celda('F5').textContent).toBe('');
    // Y el portapapeles se vació: lo cortado se suelta una sola vez.
    expect(document.querySelector('.hjw-marca')).toBeNull();
  });

  it('JUGAR MAL · arrepentirse del corte y cortar otra cosa vuelve a marcar, no muda', async () => {
    await abrirPagos();
    marcar('F4', 'F5');
    fireEvent.click(boton('cortar'));
    // Se arrepiente y marca otra cosa. Si la segunda pulsación mudara —que es la
    // segunda puerta que `cinta.ts` deja abierta— aquí se habrían movido dos
    // celdas que nadie pidió mover.
    marcar('A4');
    fireEvent.click(boton('cortar'));
    expect(celda('F4').textContent).toBe('101');
    expect(celda('A4').textContent).toBe('Rodrigo Bautista');

    // Y lo que se muda al pegar es lo ÚLTIMO que se cortó.
    marcar('H1');
    fireEvent.click(boton('pegar'));
    await waitFor(() => expect(celda('H1').textContent).toBe('Rodrigo Bautista'));
    expect(celda('A4').textContent).toBe('');
    expect(celda('F4').textContent).toBe('101');
  });

  it('JUGAR MAL · pegar lo cortado encima de lo cortado se apaga y lo dice', async () => {
    await abrirPagos();
    marcar('F4', 'F5');
    fireEvent.click(boton('cortar'));
    // El destino toca el origen: el `borrar` de después se llevaría lo pegado.
    marcar('F5', 'F6');
    fireEvent.click(boton('pegar'));
    expect(document.querySelector('.txtw-aviso')?.textContent ?? '').toContain('se encima');
    expect(celda('F4').textContent).toBe('101');
    expect(celda('F5').textContent).toBe('102');
  });

  it('pegar valores congela el total y pegar formato no toca lo escrito', async () => {
    await abrirPagos();
    marcar('C17');
    fireEvent.click(boton('copiar'));
    marcar('C19');
    fireEvent.click(boton('pegar-valores'));
    await waitFor(() => expect(celda('C19').textContent).toBe('2560'));

    // Si ahora paga alguien más, el de arriba se entera y el congelado no.
    teclear('C6', '320');
    await waitFor(() => expect(celda('C17').textContent).toBe('2880'));
    expect(celda('C19').textContent).toBe('2560');

    // Y la brocha del pegado especial: llega la pinta, se queda el texto.
    marcar('C3');
    fireEvent.click(boton('copiar'));
    marcar('D3');
    fireEvent.click(boton('pegar-formato'));
    await waitFor(() => expect(celda('D3').style.fontWeight).toBe('700'));
    expect(celda('D3').textContent).toBe('Folio');
  });

  it('JUGAR MAL · copiar en una hoja y pegar en otra se corta con un aviso', async () => {
    await abrirPagos();
    marcar('A4');
    fireEvent.click(boton('copiar'));

    fireEvent.click(lengueta('h1'));
    await waitFor(() => expect(celda('A4').textContent).toBe('Camión de la escuela a Teotihuacán'));
    marcar('F1');
    fireEvent.click(boton('pegar'));

    const aviso = document.querySelector('.txtw-aviso')?.textContent ?? '';
    expect(aviso).toContain('Hoja3');
    // Lo que NO puede pasar: pegar la celda de ESTA hoja que está en ese mismo
    // domicilio y no decir nada.
    expect(celda('F1').textContent).toBe('');
  });

  it('Ctrl+C y Ctrl+V hacen lo mismo que los botones, y pasan por sus guardas', async () => {
    await abrirPagos();
    marcar('A4');
    fireEvent.keyDown(rejilla(), { key: 'c', ctrlKey: true });
    marcar('H1');
    fireEvent.keyDown(rejilla(), { key: 'v', ctrlKey: true });
    await waitFor(() => expect(celda('H1').textContent).toBe('Rodrigo Bautista'));
  });
});

/* ── §47 · el formato de la celda, en pantalla (bloques 9 y 10) ─────────────
 *
 * Estas tres viven aquí y no en `motor-hojas.test.ts` por la razón de la
 * cabecera: el motor ya prueba que la brocha copia la pinta y que combinar tira
 * contenido, y ninguna de esas dos pruebas habría visto lo que sí se rompe con
 * DOM delante —una brocha que se carga y no se descarga, un aviso que no llega a
 * la pantalla, o una celda combinada que empuja a la columna de al lado—.
 *
 * Y la primera versión de la de combinar estaba mal escrita: probaba con `A1:C1`,
 * donde sólo hay título y las otras dos están vacías, así que **no había nada que
 * perder y el aviso no salía**. La prueba habría dado por bueno un cuadro de
 * diálogo que nunca se enseñó. Se hace en la fila 3, que son tres encabezados
 * escritos.
 */
describe('VentanaHojas · el formato de la celda (bloques 9 y 10)', () => {
  it('la brocha suelta la pinta, no el contenido, y se descarga al soltarla', async () => {
    await abrirLibre();
    fireEvent.mouseDown(celda('A1'));
    fireEvent.click(boton('subrayado'));
    fireEvent.click(boton('color-relleno'));
    // La paleta la abre el propio botón, y es la que le da el dato: sin esta
    // pulsación el control se queda inerte, que es lo que dice `cinta.ts`.
    const amarillo = document.querySelector('.hjw-desplegable [data-color="#ffc000"]') as HTMLElement;
    expect(amarillo).not.toBeNull();
    fireEvent.click(amarillo);
    await waitFor(() => expect(celda('A1').style.background).toBe('rgb(255, 192, 0)'));

    const textoA5 = celda('A5').textContent;
    fireEvent.click(boton('copiar-formato'));
    // El puntero cambia: es la única señal de que el programa está esperando
    // dónde soltarla.
    expect(document.querySelector('.hjw-rejilla.es-brocha')).not.toBeNull();

    fireEvent.mouseDown(celda('A5'));
    await waitFor(() => expect(celda('A5').style.textDecoration).toBe('underline'));
    expect(celda('A5').style.background).toBe('rgb(255, 192, 0)');
    // Lo que NO llegó: el contenido. Ni el de origen se movió.
    expect(celda('A5').textContent).toBe(textoA5);
    expect(celda('A1').textContent).toBe('Gastos de la salida del salón · 5.º B');

    // Y se descargó. Sin esto, la brocha repintaría cada celda que se pulse
    // durante el resto de la clase.
    expect(document.querySelector('.hjw-rejilla.es-brocha')).toBeNull();
    fireEvent.mouseDown(celda('A6'));
    await waitFor(() => expect(celda('A6').style.textDecoration).toBe(''));

    // La otra mitad, y la que separa una brocha de un «añade esto encima»: A7 no
    // tiene nada puesto, así que su brocha DESPINTA la negrita de A3.
    expect(celda('A3').style.fontWeight).toBe('700');
    fireEvent.mouseDown(celda('A7'));
    fireEvent.click(boton('copiar-formato'));
    fireEvent.mouseDown(celda('A3'));
    await waitFor(() => expect(celda('A3').style.fontWeight).toBe(''));
  });

  it('combinar avisa antes de tirar contenido, y el mismo botón separa', async () => {
    await abrirLibre();
    fireEvent.mouseDown(celda('A3'));
    fireEvent.mouseDown(celda('C3'), { shiftKey: true });

    fireEvent.click(boton('combinar-centrar'));
    // Primer tiempo: la frase de Excel en pantalla y el libro **sin tocar**.
    expect(document.body.textContent).toContain('superior izquierda');
    expect(celda('A3').style.width).toBe('88px');
    expect(celda('B3').textContent).toBe('Cuántos');

    fireEvent.click(boton('combinar-centrar'));
    await waitFor(() => expect(celda('A3').style.width).toBe('264px'));
    expect(celda('B3').style.width).toBe('0px');
    expect(celda('B3').textContent).toBe('');
    // Y la columna D sigue donde estaba: la fila suma exactamente lo mismo que
    // antes de combinar, que es lo que mantiene viva la división entera del §39.
    expect(celda('D3').style.width).toBe('88px');

    fireEvent.click(boton('combinar-centrar'));
    await waitFor(() => expect(celda('A3').style.width).toBe('88px'));
    // Separar no resucita lo que se tiró.
    expect(celda('B3').textContent).toBe('');
  });

  it('el texto ajustado y los bordes se pintan en la celda', async () => {
    await abrirLibre();
    fireEvent.mouseDown(celda('A4'));
    fireEvent.click(boton('ajustar-texto'));
    // El alto no se mueve —es constante (§39)— y lo que cambia es cómo se parte
    // el texto dentro de él. La clase lo dice y la ficha de guía también.
    await waitFor(() => expect(celda('A4').className).toContain('es-ajustado'));
    expect(celda('A4').style.height).toBe('22px');

    fireEvent.click(boton('bordes'));
    const todos = document.querySelector('.hjw-desplegable .hjw-borde') as HTMLElement;
    fireEvent.click(todos);
    await waitFor(() => expect(celda('A4').style.borderTopColor).toBe('rgb(58, 58, 58)'));
    expect(celda('A4').style.borderRightColor).toBe('rgb(58, 58, 58)');
  });
});

describe('VentanaHojas · las hojas del libro (bloque 16)', () => {
  it('doble clic en la lengüeta la renombra, y un nombre repetido se rechaza', async () => {
    await abrirPagos();
    fireEvent.doubleClick(lengueta('h3'));
    let campo = document.querySelector('.hjw-hoja-nombre') as HTMLInputElement;
    expect(campo).not.toBeNull();

    // JUGAR MAL · ponerle el nombre de otra hoja del libro. Dos hojas «Salida»
    // dejarían a `=Salida!D8` leyendo la que no es, sin dar ningún error.
    fireEvent.change(campo, { target: { value: 'Salida' } });
    fireEvent.keyDown(campo, { key: 'Enter' });
    await waitFor(() =>
      expect(document.querySelector('.txtw-aviso')?.textContent ?? '').toContain('hay una hoja con ese nombre'),
    );
    expect(lengueta('h3').textContent).toBe('Hoja3');

    fireEvent.doubleClick(lengueta('h3'));
    campo = document.querySelector('.hjw-hoja-nombre') as HTMLInputElement;
    fireEvent.change(campo, { target: { value: 'Pagos' } });
    fireEvent.keyDown(campo, { key: 'Enter' });
    await waitFor(() => expect(lengueta('h3').textContent).toBe('Pagos'));
  });

  it('arrastrar una lengüeta encima de otra la cambia de sitio', async () => {
    await abrirPagos();
    expect(lenguetas().map((t) => t.dataset.hoja)).toEqual(['h1', 'h2', 'h3']);
    fireEvent.mouseDown(lengueta('h3'));
    fireEvent.mouseUp(lengueta('h2'));
    await waitFor(() => expect(lenguetas().map((t) => t.dataset.hoja)).toEqual(['h1', 'h3', 'h2']));
    // Y los datos siguen enteros: mover una hoja no toca ni una celda.
    expect(celda('A4').textContent).toBe('Rodrigo Bautista');
  });

  it('el botón de color abre su paleta y pinta la lengüeta', async () => {
    await abrirPagos();
    expect(document.querySelector('.hjw-paleta')).toBeNull();
    // El botón NO se pinta apagado aunque la cinta lo declare inerte sin color:
    // el que abre la paleta es él (defecto 6 del §47.6, otra vez).
    expect(boton('color-hoja').className).not.toContain('es-pendiente');

    fireEvent.click(boton('color-hoja'));
    await waitFor(() => expect(document.querySelector('.hjw-paleta')).not.toBeNull());
    fireEvent.click(document.querySelector('[data-color="#107c41"]') as HTMLElement);
    await waitFor(() => expect(lengueta('h3').style.borderBottomColor).not.toBe(''));
    expect(document.querySelector('.hjw-paleta')).toBeNull();
  });
});

describe('VentanaHojas · la clase 2, jugando mal a propósito', () => {
  it('ordenar con una sola celda marcada se apaga en vez de no hacer nada', async () => {
    await abrirPagos();
    marcar('A4');
    fireEvent.click(boton('ordenar-az'));
    expect(document.querySelector('.txtw-aviso')?.textContent ?? '').toContain('varias filas');
    expect(celda('A4').textContent).toBe('Rodrigo Bautista');
  });

  it('marcar de abajo hacia arriba también cuenta en la barra de estado', async () => {
    await abrirPagos();
    // Ocho apuntes de 320 entre C4 y C14, marcados al revés. Este bucle no daba
    // ni una vuelta y la ventana se quedaba muda hacia arriba.
    marcar('C14', 'C4');
    const estado = document.querySelector('.hjw-cuenta')?.textContent ?? '';
    expect(estado).toContain('8');
    expect(estado).toContain('2560');
  });

  it('deshacer a media clase retrocede la mudanza, y rehacer la devuelve', async () => {
    await abrirPagos();
    marcar('F4', 'F5');
    fireEvent.click(boton('cortar'));
    marcar('D4');
    fireEvent.click(boton('pegar'));
    await waitFor(() => expect(celda('D4').textContent).toBe('101'));

    // Los dos gestos de una mudanza entraron en una sola pulsación, así que un
    // solo deshacer los devuelve los dos.
    fireEvent.click(boton('deshacer'));
    await waitFor(() => expect(celda('F4').textContent).toBe('101'));
    expect(celda('D4').textContent).toBe('');

    fireEvent.click(boton('rehacer'));
    await waitFor(() => expect(celda('D4').textContent).toBe('101'));
    expect(celda('F4').textContent).toBe('');
  });
});

/**
 * ── LA CLASE 2 ENTERA, DE PRINCIPIO A FIN ──────────────────────────────────
 *
 * Doce encargos en fila. Es lo único que dice que la clase **se puede
 * terminar**: aquí el sexto llena una columna entera, el octavo congela un total
 * que depende de lo que hizo el primero y el duodécimo reescribe cuarenta y ocho
 * celdas, así que un encargo que dejara la hoja medio movida no se vería
 * leyendo los predicados —cada uno por separado es correcto— y se ve aquí.
 */
describe('VentanaHojas · la clase 2 se termina', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('los doce encargos, en fila y sin un solo tropiezo', async () => {
    const onTerminado = jest.fn();
    render(
      <VentanaHojas
        cinta={CINTA_EXCEL_BASICO}
        guion={GUION_CAPTURA_Y_ORDENA}
        onTerminado={onTerminado}
      />,
    );
    await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
    fireEvent.click(screen.getByText('Abrir el libro'));

    // 1 · capturar el renglón que faltaba
    teclear('A15', 'Ximena Robles');
    teclear('C15', '320');
    await celebrar();
    expect(celda('C17').textContent).toBe('2880');

    // 2 · borrar el apunte que no iba, con Suprimir
    marcar('C9');
    fireEvent.keyDown(rejilla(), { key: 'Delete' });
    await celebrar();
    expect(celda('C17').textContent).toBe('2560');

    // 3 · y recuperarlo con deshacer
    fireEvent.click(boton('deshacer'));
    await celebrar();
    expect(celda('C9').textContent).toBe('320');

    // 4 · mudar los folios de la F a la D
    marcar('F4', 'F5');
    fireEvent.click(boton('cortar'));
    marcar('D4');
    fireEvent.click(boton('pegar'));
    await celebrar();
    expect(celda('F4').textContent).toBe('');

    // 5 · continuar la serie de folios con el cuadrito
    marcar('D4', 'D5');
    arrastrarTirador(3, 14);
    await celebrar();
    expect(celda('D15').textContent).toBe('112');

    // 6 · y copiar la cuota con el mismo cuadrito
    marcar('B4');
    arrastrarTirador(1, 14);
    await celebrar();
    expect(celda('B15').textContent).toBe('320');

    // 7 · pegar sólo el formato en el encabezado desigual
    marcar('C3');
    fireEvent.click(boton('copiar'));
    marcar('D3');
    fireEvent.click(boton('pegar-formato'));
    await celebrar();

    // 8 · congelar el corte del viernes
    marcar('C17');
    fireEvent.click(boton('copiar'));
    marcar('C19');
    fireEvent.click(boton('pegar-valores'));
    await celebrar();
    expect(celda('C19').textContent).toBe('2880');

    // 9 · ponerle nombre a la hoja
    fireEvent.doubleClick(lengueta('h3'));
    const campo = document.querySelector('.hjw-hoja-nombre') as HTMLInputElement;
    fireEvent.change(campo, { target: { value: 'Pagos' } });
    fireEvent.keyDown(campo, { key: 'Enter' });
    await celebrar();

    // 10 · y ponerla en su sitio
    fireEvent.mouseDown(lengueta('h3'));
    fireEvent.mouseUp(lengueta('h2'));
    await celebrar();
    expect(lenguetas().map((t) => t.dataset.hoja)).toEqual(['h1', 'h3', 'h2']);

    // 11 · pintarle la lengüeta
    fireEvent.click(boton('color-hoja'));
    fireEvent.click(document.querySelector('[data-color="#0f6cbd"]') as HTMLElement);
    await celebrar();

    /*
     * 12 · JUGAR MAL primero, y aquí es donde muerde: ordenar **sólo la columna
     * de los nombres**. Es el desastre del bloque 19 y no lo caza ningún aviso
     * —el botón es el correcto y la selección es legítima—, así que lo único que
     * puede salvar al alumno es que el predicado mire las parejas. Los nombres
     * se acomodan, el folio y el pago se quedan quietos, y el encargo sigue por
     * hacer. Ojo: **esto no cuenta un tropiezo**, porque no es un desvío.
     */
    marcar('A4', 'A15');
    fireEvent.click(boton('ordenar-az'));
    await celebrar();
    expect(celda('A4').textContent).toBe('Ana Karen Solís');
    // El folio 101 era de Rodrigo y se quedó donde estaba: cada quien con lo de otro.
    expect(celda('D4').textContent).toBe('101');
    expect(encargo()).toBe('Ordena la lista');

    fireEvent.click(boton('deshacer'));
    expect(celda('A4').textContent).toBe('Rodrigo Bautista');

    // Y ahora bien: la tabla entera, las cuatro columnas.
    marcar('A4', 'D15');
    fireEvent.click(boton('ordenar-az'));
    await celebrar();
    expect(celda('A4').textContent).toBe('Ana Karen Solís');
    expect(celda('A15').textContent).toBe('Ximena Robles');
    // Y cada quien con su folio: la fila viajó entera.
    expect(celda('D4').textContent).toBe('102');

    expect(screen.getByText('Terminaste')).not.toBeNull();
    expect(onTerminado).toHaveBeenCalledTimes(1);
    expect(onTerminado.mock.calls[0][0]).toMatchObject({ pasos: 12, tropiezos: 0 });
  });

  it('salir a los objetivos a media clase y volver no pierde nada', async () => {
    render(<VentanaHojas cinta={CINTA_EXCEL_BASICO} guion={GUION_CAPTURA_Y_ORDENA} />);
    await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
    fireEvent.click(screen.getByText('Abrir el libro'));
    teclear('A15', 'Ximena Robles');
    teclear('C15', '320');
    await celebrar();
    expect(encargo()).toBe('Ese apunte no iba');

    fireEvent.click(screen.getByLabelText('Ver de nuevo los objetivos de la práctica'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).not.toBeNull());
    fireEvent.click(screen.getByText('Volver al libro'));
    await waitFor(() => expect(document.querySelector('.txtw-portada')).toBeNull());
    expect(encargo()).toBe('Ese apunte no iba');
    expect(celda('A15').textContent).toBe('Ximena Robles');
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   `n5-tus-primeras-formulas` · la clase 4 (bloques 13 · 14 · 15)

   La primera clase con `=`, y lo que estrena tampoco es motor —el §46 dejó el
   evaluador pagado y probado con 69 pruebas— sino **ventana**: escribir una
   fórmula por los dos sitios donde se escribe, que la barra enseñe la regla
   mientras la celda enseña el resultado, que un botón de la Biblioteca de
   funciones adivine un rango y lo escriba, y que un error se pinte como lo que
   es —un valor— en vez de reventar el repintado.

   Se juega mal a propósito por donde se juega mal de verdad el primer día:
   sin el `=`, con un paréntesis sin cerrar, con una función inventada, y
   dividiendo entre una celda que no tiene nada.
   ═══════════════════════════════════════════════════════════════════════════ */

/** El libro de la clase 4 sin encargos, para probar el aparato. */
const LIBRE_GASTOS: GuionHojas = {
  archivo: 'Gastos de la salida del salón.xlsx',
  libro: libroDeLosGastos,
  pasos: [
    {
      id: 'libre',
      titulo: 'Trastea',
      instruccion: 'Aquí no se pide nada.',
      pista: 'Nada.',
      logro: { tipo: 'documento', comprueba: () => false },
      aprendido: 'Nada.',
    },
  ],
};

async function abrirGastos() {
  const salida = render(<VentanaHojas cinta={CINTA_EXCEL_BASICO} guion={LIBRE_GASTOS} />);
  await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
  return salida;
}

/** Lo que la barra de fórmulas enseña de la celda activa: el crudo, no el valor. */
const enLaBarra = (): string => (document.querySelector('.hjw-formula') as HTMLInputElement).value;

/** Ir a una pestaña de la cinta, que es gratis y nunca es un desvío. */
const irA = (pestana: string) =>
  fireEvent.click(document.querySelector(`[data-pestana="${pestana}"]`) as HTMLElement);

describe('VentanaHojas · escribir una fórmula (bloque 13)', () => {
  it('la celda enseña el resultado y la barra de fórmulas guarda la regla', async () => {
    await abrirGastos();
    teclear('D4', '=B4*C4');
    await waitFor(() => expect(celda('D4').textContent).toBe('4800'));

    // Las dos vistas del mismo dato, que es el bloque 13 entero.
    marcar('D4');
    expect(enLaBarra()).toBe('=B4*C4');
    marcar('D5');
    expect(enLaBarra()).toBe('3610');
  });

  it('JUGAR MAL · sin el `=` no hay cuenta: se guarda la palabra', async () => {
    await abrirGastos();
    teclear('F1', 'B4*C4');
    await waitFor(() => expect(celda('F1').textContent).toBe('B4*C4'));
    // Y se fue a la izquierda, que es el chivato de la clase 1: eso es texto.
    expect(celda('F1').style.justifyContent).toBe('flex-start');
  });

  it('JUGAR MAL · un paréntesis sin cerrar no entra al libro, y se dice', async () => {
    await abrirGastos();
    fireEvent.mouseDown(celda('F2'));
    fireEvent.keyDown(rejilla(), { key: '=' });
    const editor = document.querySelector('.hjw-editor') as HTMLInputElement;
    fireEvent.change(editor, { target: { value: '=MAX(D4:D9' } });
    fireEvent.keyDown(editor, { key: 'Enter' });

    await screen.findByText('Así no se puede guardar todavía.');
    expect(celda('F2').textContent).toBe('');
    expect((document.querySelector('.hjw-editor') as HTMLInputElement).value).toBe('=MAX(D4:D9');
  });

  it('JUGAR MAL · una función que no existe SÍ entra, y enseña #¿NOMBRE?', async () => {
    await abrirGastos();
    // Es la fidelidad del §46.8 y no es lo mismo que lo de arriba: Excel rechaza
    // una fórmula que no ENTIENDE y acepta una función que no CONOCE.
    teclear('F3', '=SUMOTA(D4:D9)');
    await waitFor(() => expect(celda('F3').textContent).toBe('#¿NOMBRE?'));
    marcar('F3');
    expect(enLaBarra()).toBe('=SUMOTA(D4:D9)');
  });

  it('un número escrito a mano no se entera de nada; una regla sí', async () => {
    await abrirGastos();
    // El encargo 1 de la clase, que es la demostración entera: sube el precio y
    // «Lo pagado» —tecleado con calculadora— se queda mintiendo.
    teclear('C4', '5200');
    await waitFor(() => expect(celda('C4').textContent).toBe('5200'));
    expect(celda('D4').textContent).toBe('4800');

    teclear('D4', '=B4*C4');
    await waitFor(() => expect(celda('D4').textContent).toBe('5200'));

    // Y ahora el mismo gesto de antes, con el resultado contrario.
    teclear('C4', '4900');
    await waitFor(() => expect(celda('D4').textContent).toBe('4900'));
  });

  it('«Rellenar hacia abajo» deja seis reglas, y cada una mira SU renglón', async () => {
    await abrirGastos();
    teclear('D4', '=B4*C4');
    marcar('D4', 'D9');
    fireEvent.click(boton('rellenar-abajo'));

    await waitFor(() => expect(celda('D7').textContent).toBe('2470'));
    marcar('D7');
    expect(enLaBarra()).toBe('=B7*C7');
    marcar('D9');
    expect(enLaBarra()).toBe('=B9*C9');
  });
});

describe('VentanaHojas · Autosuma y las funciones (bloque 14)', () => {
  it('Autosuma acierta en el total y se equivoca una fila más abajo', async () => {
    await abrirGastos();
    marcar('D10');
    fireEvent.click(boton('autosuma'));
    await waitFor(() => expect(celda('D10').textContent).toBe('12000'));
    marcar('D10');
    expect(enLaBarra()).toBe('=SUMA(D4:D9)');

    /*
     * Y el mismo botón, una fila más abajo, se lleva el total por delante: sube
     * por la columna hasta topar con el encabezado y no sabe que D10 no es un
     * gasto. El «gasto más caro» sale igualito que «todo lo que costó», que es
     * la mentira que el encargo 6 manda cazar.
     */
    irA('formulas');
    marcar('D11');
    fireEvent.click(boton('fn-max'));
    await waitFor(() => expect(celda('D11').textContent).toBe('12000'));
    marcar('D11');
    expect(enLaBarra()).toBe('=MAX(D4:D10)');

    // Corregido a mano, contesta lo que se le preguntaba: el camión.
    teclear('D11', '=MAX(D4:D9)');
    await waitFor(() => expect(celda('D11').textContent).toBe('4800'));
  });

  it('cambiar un precio mueve el importe, el total y el mínimo a la vez', async () => {
    await abrirGastos();
    teclear('D4', '=B4*C4');
    marcar('D4', 'D9');
    fireEvent.click(boton('rellenar-abajo'));
    marcar('D10');
    fireEvent.click(boton('autosuma'));
    teclear('D12', '=MIN(D4:D9)');
    await waitFor(() => expect(celda('D12').textContent).toBe('180'));

    // Un tecleo, tres celdas movidas y ninguna tocada.
    teclear('C8', '0');
    await waitFor(() => expect(celda('D8').textContent).toBe('0'));
    expect(celda('D10').textContent).toBe('11760');
    expect(celda('D12').textContent).toBe('0');
  });
});

describe('VentanaHojas · vacío, cero y error (bloque 15)', () => {
  it('PROMEDIO reparte entre los números que encuentra, no entre las celdas', async () => {
    await abrirGastos();
    teclear('B25', '=PROMEDIO(B20:B24)');
    teclear('B26', '=CONTAR(B20:B24)');
    teclear('B27', '=CONTARA(B20:B24)');

    // Cinco celdas: dos cantidades, una vacía, un cero y una frase.
    await waitFor(() => expect(celda('B25').textContent).toBe('3400'));
    expect(celda('B26').textContent).toBe('3');
    expect(celda('B27').textContent).toBe('4');
  });

  it('un cero escrito a mano mueve tres números; borrarlo los devuelve', async () => {
    await abrirGastos();
    teclear('B25', '=PROMEDIO(B20:B24)');
    teclear('B26', '=CONTAR(B20:B24)');
    teclear('B27', '=CONTARA(B20:B24)');
    await waitFor(() => expect(celda('B25').textContent).toBe('3400'));

    teclear('B22', '0');
    await waitFor(() => expect(celda('B25').textContent).toBe('2550'));
    expect(celda('B26').textContent).toBe('4');
    expect(celda('B27').textContent).toBe('5');

    marcar('B22');
    fireEvent.keyDown(rejilla(), { key: 'Delete' });
    await waitFor(() => expect(celda('B25').textContent).toBe('3400'));
    expect(celda('B26').textContent).toBe('3');
    expect(celda('B27').textContent).toBe('4');
  });

  it('JUGAR MAL · dividir entre una celda vacía enseña #¡DIV/0!, y el dato lo cura', async () => {
    await abrirGastos();
    marcar('D10');
    fireEvent.click(boton('autosuma'));
    await waitFor(() => expect(celda('D10').textContent).toBe('12000'));

    teclear('D16', '=D10/B14');
    // Un error es un VALOR y se pinta como tal: ni revienta el repintado ni
    // borra la fórmula, que sigue entera en la barra.
    await waitFor(() => expect(celda('D16').textContent).toBe('#¡DIV/0!'));
    marcar('D16');
    expect(enLaBarra()).toBe('=D10/B14');
    expect(celda('D16').className).toContain('es-error');

    teclear('B14', '40');
    await waitFor(() => expect(celda('D16').textContent).toBe('300'));
  });
});

/**
 * ── LA CLASE 4 ENTERA, DE PRINCIPIO A FIN ──────────────────────────────────
 *
 * Trece encargos en fila, y aquí la cadena es más larga que en las dos clases
 * anteriores: el quinto suma lo que hizo el cuarto, el sexto se corrige contra
 * lo que escribió el quinto, el octavo mueve tres celdas que pusieron el
 * cuarto, el quinto y el séptimo, y el noveno divide el total del octavo. Un
 * encargo que dejara la hoja medio hecha no se vería leyendo los predicados
 * —cada uno por separado es correcto— y se ve aquí.
 */
describe('VentanaHojas · la clase 4 se termina', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('los trece encargos, en fila y sin un solo tropiezo', async () => {
    const onTerminado = jest.fn();
    render(
      <VentanaHojas
        cinta={CINTA_EXCEL_BASICO}
        guion={GUION_TUS_PRIMERAS_FORMULAS}
        onTerminado={onTerminado}
      />,
    );
    await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
    fireEvent.click(screen.getByText('Abrir el libro'));

    // 1 · sube el precio y la hoja miente
    teclear('C4', '5200');
    await celebrar();
    expect(celda('D4').textContent).toBe('4800');

    // 2 · la primera fórmula
    teclear('D4', '=B4*C4');
    await celebrar();
    expect(celda('D4').textContent).toBe('5200');

    // 3 · la pregunta de qué guarda la celda
    fireEvent.click(screen.getByText(/y lo que enseña es el resultado/));
    await celebrar();

    // 4 · las otras cinco, de un botón
    marcar('D4', 'D9');
    fireEvent.click(boton('rellenar-abajo'));
    await celebrar();
    expect(celda('D7').textContent).toBe('2470');

    // 5 · el total, con Autosuma
    marcar('D10');
    fireEvent.click(boton('autosuma'));
    await celebrar();
    expect(celda('D10').textContent).toBe('12400');

    // 6 · MAX adivina mal el rango y se le corrige
    irA('formulas');
    marcar('D11');
    fireEvent.click(boton('fn-max'));
    expect(celda('D11').textContent).toBe('12400');
    expect(encargo()).toBe('El gasto más caro, y lo que Autosuma adivinó mal');
    teclear('D11', '=MAX(D4:D9)');
    await celebrar();
    expect(celda('D11').textContent).toBe('5200');

    // 7 · el más barato, a mano
    teclear('D12', '=MIN(D4:D9)');
    await celebrar();
    expect(celda('D12').textContent).toBe('180');

    // 8 · el botiquín gratis mueve tres celdas
    teclear('C8', '0');
    await celebrar();
    expect(celda('D10').textContent).toBe('12160');
    expect(celda('D12').textContent).toBe('0');

    // 9 · repartir entre nadie, y el dato que llega
    teclear('D16', '=D10/B14');
    expect(celda('D16').textContent).toBe('#¡DIV/0!');
    teclear('B14', '38');
    await celebrar();
    // La cuota que la tesorera cobró en la clase 2, salida de una división.
    expect(celda('D16').textContent).toBe('320');

    // 10 · el promedio de la kermés
    teclear('B25', '=PROMEDIO(B20:B24)');
    await celebrar();
    expect(celda('B25').textContent).toBe('3400');

    // 11 · las dos cuentas sobre el mismo rango
    teclear('B26', '=CONTAR(B20:B24)');
    teclear('B27', '=CONTARA(B20:B24)');
    await celebrar();
    expect(celda('B26').textContent).toBe('3');
    expect(celda('B27').textContent).toBe('4');

    // 12 · el cero de más
    teclear('B22', '0');
    await celebrar();
    expect(celda('B25').textContent).toBe('2550');

    // 13 · y vacío otra vez
    marcar('B22');
    fireEvent.keyDown(rejilla(), { key: 'Delete' });
    await celebrar();
    expect(celda('B25').textContent).toBe('3400');

    expect(screen.getByText('Terminaste')).not.toBeNull();
    expect(onTerminado).toHaveBeenCalledTimes(1);
    expect(onTerminado.mock.calls[0][0]).toMatchObject({ pasos: 13, tropiezos: 0 });
  });

  it('JUGAR MAL · escribir el número a mano no cierra el encargo de la fórmula', async () => {
    render(<VentanaHojas cinta={CINTA_EXCEL_BASICO} guion={GUION_TUS_PRIMERAS_FORMULAS} />);
    await waitFor(() => expect(document.querySelector('.hjw')).not.toBeNull());
    fireEvent.click(screen.getByText('Abrir el libro'));

    // JUGAR MAL · el encargo 1 pide un dato y se pulsa un botón de la cinta.
    fireEvent.click(boton('negrita'));
    expect(document.querySelector('.txtw-aviso')).not.toBeNull();
    expect(encargo()).toBe('La hoja acaba de mentir');

    teclear('C4', '5200');
    await celebrar();
    expect(encargo()).toBe('Tu primera fórmula');

    /*
     * JUGAR MAL · el atajo que se le ocurre a medio salón: teclear el resultado.
     * Las dos primeras preguntas del predicado las pasa —hay algo escrito y
     * enseña 5200— y la tercera no: se le cambia el precio a una copia del libro
     * y la celda no se mueve. Con `=5200` pasa lo mismo, y por eso se prueban
     * los dos.
     */
    teclear('D4', '5200');
    expect(encargo()).toBe('Tu primera fórmula');
    teclear('D4', '=5200');
    expect(celda('D4').textContent).toBe('5200');
    expect(encargo()).toBe('Tu primera fórmula');

    teclear('D4', '=B4*C4');
    await celebrar();
    expect(encargo()).toBe('¿Qué guarda D4?');
  });
});

/*
 * `BackstageHojas.tsx` (§45.2, bloque 20) estaba escrito y nadie lo montaba:
 * cero clases lo pasaban como `backstage`. Ahora es el valor de fábrica de
 * `VentanaHojas`, así que estas pruebas no montan nada aparte — abren la
 * ventana de siempre y pulsan Archivo.
 */
describe('VentanaHojas · el Backstage (bloque 20)', () => {
  it('Archivo entra por defecto: ninguna clase tiene que montar su propio Backstage', async () => {
    await abrirLibre();
    expect(document.querySelector('.hjb')).toBeNull();
    irA('archivo');
    expect(document.querySelector('.hjb')).not.toBeNull();
    expect(document.querySelector('.hjb-titulo')?.textContent).toBe('Información');
    expect(document.querySelectorAll('.hjb-ficha')).toHaveLength(4);
  });

  it('lo que Archivo cambia en el libro pasa por el camino de siempre: se puede deshacer', async () => {
    await abrirLibre();
    irA('archivo');
    fireEvent.click(document.querySelector('[data-hjb-seccion="imprimir"]') as HTMLElement);

    const vertical = () => document.querySelector('[data-hjb-orientacion="vertical"]') as HTMLInputElement;
    const horizontal = () => document.querySelector('[data-hjb-orientacion="horizontal"]') as HTMLInputElement;
    expect(vertical().checked).toBe(true);

    fireEvent.click(horizontal());
    expect(horizontal().checked).toBe(true);

    // Si el cambio pasó por `ejecutarGestos` —y no por un `conLibro` a espaldas
    // de la ventana—, quedó en la pila de deshacer como cualquier botón de la
    // cinta. Se cierra Archivo, se deshace desde el chrome, y se vuelve a mirar.
    fireEvent.click(document.querySelector('[data-hjb="volver"]') as HTMLElement);
    expect(document.querySelector('.hjb')).toBeNull();
    fireEvent.click(boton('deshacer'));

    irA('archivo');
    fireEvent.click(document.querySelector('[data-hjb-seccion="imprimir"]') as HTMLElement);
    expect(vertical().checked).toBe(true);
  });

  it('Escape cierra, como en el programa', async () => {
    await abrirLibre();
    irA('archivo');
    expect(document.querySelector('.hjb')).not.toBeNull();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(document.querySelector('.hjb')).toBeNull();
  });
});
