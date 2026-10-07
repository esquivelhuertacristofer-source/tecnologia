/**
 * N7 · «Entrada y salida» — la clase jugada entera sobre el juez de programas
 * (§68.4).
 *
 * Jugando MAL antes que bien (`jugar-mal-a-proposito`): no contestar nunca,
 * contestar en blanco, que el eco de la propia pregunta no cuente como saludo,
 * enviar la celda vacía, la coma que mete un espacio, un dato de más, y fallar
 * la pregunta final. Después, el recorrido de punta a punta contestando en la
 * consola **y** enviando al juez.
 *
 * Lo que vigila y el test del juez no puede:
 *
 * - **▶ corre la celda del encargo**, así que al probar el problema 3 no vuelve
 *   a preguntar lo del 1.
 * - **El panel cambia con el encargo**: tablero en los problemas, ficha abierta
 *   y buzón en la exploración, y el tablero no pierde sus veredictos al
 *   esconderse.
 * - **Ningún dato oculto se asoma al DOM.**
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { LabEntradaYSalida, PLANTILLA } from '@/components/activities/python/LabEntradaYSalida';

const py = (...l: string[]) => l.join('\n');

function enCeldas(programas: Partial<Record<'Calentamiento' | 'Problema 1' | 'Problema 2' | 'Problema 3', string>>): string {
  const lineas = PLANTILLA.split('\n');
  for (const [celda, programa] of Object.entries(programas)) {
    const i = lineas.findIndex((l) => l.startsWith(`# %% ${celda}`));
    lineas.splice(i + 1, 0, ...(programa as string).split('\n'));
  }
  return lineas.join('\n');
}

const SALUDO = py('nombre = input("¿Cómo te llamas? ")', 'print("Hola,", nombre)');
const EDAD_MAL = py('edad = input("¿Cuántos años tienes? ")', 'print(edad + 1)');
const EDAD_BIEN = py('edad = int(input("¿Cuántos años tienes? "))', 'print(f"El año que viene cumples {edad + 1}.")');
const EN_2030 = py('n = input("¿Nombre? ")', 'a = int(input("¿Año? "))', 'print(f"{n}, en 2030 cumples {2030 - a} años.")');
const TIENDITA = py('p = float(input("¿Precio? "))', 'c = int(input("¿Piezas? "))', 'print(f"Pagas {p * c} pesos.")');

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  render(<LabEntradaYSalida config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />);

  const api = {
    onProgress,
    onScore,
    onComplete,
    entrar: () => {
      fireEvent.click(screen.getByTestId('pyc-empezar'));
      fireEvent.click(document.querySelector('[data-vel="rayo"]') as HTMLElement);
      return api;
    },
    area: () => screen.getByTestId('cod-area') as HTMLTextAreaElement,
    salida: () => screen.getByTestId('cod-salida').textContent ?? '',
    fase: () => screen.getByTestId('cod').getAttribute('data-fase'),
    escribir: (texto: string) => fireEvent.change(screen.getByTestId('cod-area'), { target: { value: texto } }),
    ejecutar: () => fireEvent.click(screen.getByTestId('cod-ejecutar')),
    contestar: (respuesta: string) => {
      fireEvent.change(screen.getByTestId('cod-entrada'), { target: { value: respuesta } });
      fireEvent.click(screen.getByTestId('cod-responder'));
    },
    /** Ejecuta y contesta, en orden, lo que el programa vaya preguntando. */
    correr: (...respuestas: string[]) => {
      api.ejecutar();
      for (const r of respuestas) {
        if (!screen.queryByTestId('cod-entrada')) return;
        api.contestar(r);
      }
    },
    enviar: () => fireEvent.click(screen.getByTestId('jz-enviar')),
    veredicto: () => screen.getByTestId('jz-veredicto'),
    encargo: () => screen.getByTestId('cod-encargo').getAttribute('data-paso'),
    logrado: () => screen.queryByTestId('cod-logrado'),
    siguiente: () => fireEvent.click(screen.getByText('Siguiente encargo →')),
    panel: () => screen.getByTestId('cod-panel'),
    tableroVisible: () => !(screen.getByTestId('jz-panel').parentElement as HTMLElement).hidden,
  };
  return api;
}

describe('antes de entrar', () => {
  it('la portada dice el tema, el objetivo y la insignia, y el editor no está detrás', () => {
    const lab = montar();
    expect(screen.getByText('El programa pregunta y contesta')).toBeInTheDocument();
    expect(screen.getByText('Insignia · Pregunta y responde')).toBeInTheDocument();
    expect(screen.queryByTestId('cod-area')).toBeNull();
    lab.entrar();
    expect(lab.encargo()).toBe('que-te-pregunte');
    expect(lab.area().value).toBe(PLANTILLA);
  });
});

describe('jugando mal a propósito', () => {
  it('no contestar deja el programa esperando; contestar en blanco no cuenta; el eco de la pregunta no es un saludo', () => {
    const lab = montar().entrar();
    lab.escribir(enCeldas({ Calentamiento: 'nombre = input("¿Cómo te llamas? ")' }));
    lab.ejecutar();
    expect(lab.fase()).toBe('esperando');
    lab.ejecutar();
    expect(lab.fase()).toBe('esperando');
    expect(lab.logrado()).toBeNull();

    /* Contestó y el programa terminó, pero no saludó: en la consola «Sofi»
     * sólo sale en el eco de su propia pregunta. */
    lab.contestar('Sofi');
    expect(lab.fase()).toBe('terminada');
    expect(lab.salida()).toContain('Sofi');
    expect(lab.logrado()).toBeNull();

    lab.escribir(enCeldas({ Calentamiento: SALUDO }));
    lab.correr('   ');
    expect(lab.logrado()).toBeNull();

    lab.correr('Sofi');
    expect(lab.logrado()).not.toBeNull();
  });

  it('convertir a la primera no se salta el encargo de romperlo: pide sumar sin convertir', () => {
    const lab = montar().entrar();
    lab.escribir(enCeldas({ Calentamiento: SALUDO }));
    lab.correr('Sofi');
    lab.siguiente();
    expect(lab.encargo()).toBe('lo-que-llega-es-texto');

    lab.escribir(enCeldas({ Calentamiento: SALUDO, 'Problema 1': EDAD_BIEN }));
    lab.correr('13');
    expect(lab.logrado()).toBeNull();

    lab.escribir(enCeldas({ Calentamiento: SALUDO, 'Problema 1': EDAD_MAL }));
    lab.correr('13');
    expect(screen.getByTestId('cod-error').textContent).toContain('TypeError');
    expect(lab.logrado()).not.toBeNull();
  });

  it('▶ corre sólo la celda del encargo: en el problema 1 no pregunta el nombre del calentamiento', () => {
    const lab = montar().entrar();
    lab.escribir(enCeldas({ Calentamiento: SALUDO, 'Problema 1': EDAD_MAL }));
    lab.correr('Sofi');
    lab.siguiente();
    lab.ejecutar();
    expect(lab.salida()).toContain('¿Cuántos años tienes?');
    expect(lab.salida()).not.toContain('¿Cómo te llamas?');
  });

  it('en el problema 1: la celda vacía, la coma que mete un espacio y un dato de más, rechazados y explicados', () => {
    const lab = montar().entrar();
    lab.escribir(enCeldas({ Calentamiento: SALUDO }));
    lab.correr('Sofi');
    lab.siguiente();
    lab.escribir(enCeldas({ Calentamiento: SALUDO, 'Problema 1': EDAD_MAL }));
    lab.correr('13');
    lab.siguiente();
    expect(lab.encargo()).toBe('el-anio-que-viene');
    expect(lab.tableroVisible()).toBe(true);

    /* Con el programa que se rompe. */
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('no');
    expect(lab.veredicto().textContent).toContain('0 de 4 casos');

    lab.escribir(enCeldas({ Calentamiento: SALUDO, 'Problema 1': py('e = input()', 'print("El año que viene cumples", int(e) + 1, ".")') }));
    lab.enviar();
    expect(lab.veredicto().textContent).toContain('«El año que viene cumples 14 .» y tenía que decir «El año que viene cumples 14.»');

    lab.escribir(enCeldas({ Calentamiento: SALUDO, 'Problema 1': py('e = int(input())', 'x = input()', 'print(f"El año que viene cumples {e + 1}.")') }));
    lab.enviar();
    expect(lab.veredicto().textContent).toContain('tu programa pidió un 2.º dato');
    expect(lab.logrado()).toBeNull();

    /* Ningún dato de los ocultos en la pantalla: ni sus edades ni sus frases. */
    const texto = lab.panel().textContent ?? '';
    expect(texto).not.toMatch(/cumples 10\.|cumples 101\.|cumples 1\./);
  });

  it('fallar la pregunta del final resta seis puntos', () => {
    const lab = montar().entrar();
    llegarAlCierre(lab);
    fireEvent.click(screen.getByText('Python se equivocó al multiplicar un número con decimales.'));
    expect(lab.logrado()).toBeNull();
    expect(lab.onScore).toHaveBeenLastCalledWith(94);
    fireEvent.click(screen.getByText('El precio llegó como texto y nunca lo convirtió: multiplicar un texto por 3 lo repite tres veces.'));
    expect(lab.onComplete.mock.calls[0][0]).toMatchObject({ score: 94, stars: 3 });
  });
});

/** Juega bien los seis primeros encargos. */
function llegarAlCierre(lab: ReturnType<typeof montar>) {
  lab.escribir(enCeldas({ Calentamiento: SALUDO }));
  lab.correr('Sofi');
  lab.siguiente();
  lab.escribir(enCeldas({ Calentamiento: SALUDO, 'Problema 1': EDAD_MAL }));
  lab.correr('13');
  lab.siguiente();
  lab.escribir(enCeldas({ Calentamiento: SALUDO, 'Problema 1': EDAD_BIEN }));
  lab.enviar();
  lab.siguiente();
  lab.correr('trece');
  lab.siguiente();
  lab.escribir(enCeldas({ Calentamiento: SALUDO, 'Problema 1': EDAD_BIEN, 'Problema 2': EN_2030 }));
  lab.enviar();
  lab.siguiente();
  lab.escribir(enCeldas({ Calentamiento: SALUDO, 'Problema 1': EDAD_BIEN, 'Problema 2': EN_2030, 'Problema 3': TIENDITA }));
  lab.enviar();
  lab.siguiente();
}

describe('el recorrido de punta a punta, como un alumno', () => {
  it('los siete encargos, contestando en la consola y enviando al juez, hasta la pantalla de cierre', () => {
    const lab = montar().entrar();

    // 1 · que te pregunte — ficha del manual abierta y buzón, sin tablero
    expect(lab.encargo()).toBe('que-te-pregunte');
    expect(lab.tableroVisible()).toBe(false);
    const manual = within(screen.getByTestId('jz-fuera')).getByTestId('jz-manual') as HTMLDetailsElement;
    expect(manual.open).toBe(true);
    expect(manual.textContent).toContain('mascota');
    expect(lab.panel().textContent).toContain('Todavía no le has pedido nada');
    lab.escribir(enCeldas({ Calentamiento: SALUDO }));
    lab.correr('Sofi');
    expect(lab.salida()).toContain('Hola, Sofi');
    expect(lab.logrado()).not.toBeNull();
    lab.siguiente();

    // 2 · lo que llega es texto — el buzón enseña las comillas
    expect(lab.encargo()).toBe('lo-que-llega-es-texto');
    lab.escribir(enCeldas({ Calentamiento: SALUDO, 'Problema 1': EDAD_MAL }));
    lab.correr('13');
    expect(document.querySelector('[data-buzon="edad"]')?.textContent).toContain("'13'");
    expect(document.querySelector('[data-buzon="edad"] .pyc-tipo')?.textContent).toBe('str');
    lab.siguiente();

    // 3 · problema 1 — tablero con su ficha plegada
    expect(lab.encargo()).toBe('el-anio-que-viene');
    expect(lab.tableroVisible()).toBe(true);
    const plegada = within(screen.getByTestId('jz-panel')).getByTestId('jz-manual') as HTMLDetailsElement;
    expect(plegada.open).toBe(false);
    expect(lab.panel().textContent).toContain('Tu programa lee, en este orden');
    lab.escribir(enCeldas({ Calentamiento: SALUDO, 'Problema 1': EDAD_BIEN }));
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('si');
    expect(lab.logrado()).not.toBeNull();
    lab.siguiente();

    // 4 · el dato que no vale — sin tocar el código; el buzón vuelve
    expect(lab.encargo()).toBe('el-dato-que-no-vale');
    expect(lab.tableroVisible()).toBe(false);
    lab.correr('trece');
    expect(screen.getByTestId('cod-error').textContent).toContain('ValueError');
    lab.siguiente();

    // 5 · problema 2 — el tablero conservó el 1 aceptado y enseña el 2
    expect(lab.encargo()).toBe('en-2030');
    expect(lab.tableroVisible()).toBe(true);
    expect(screen.getByTestId('jz-solapa-el-anio-que-viene').getAttribute('data-estado')).toBe('aceptado');
    expect(screen.getByTestId('jz-solapa-en-2030').getAttribute('aria-current')).toBe('true');
    lab.escribir(enCeldas({ Calentamiento: SALUDO, 'Problema 1': EDAD_BIEN, 'Problema 2': EN_2030 }));
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('si');
    lab.siguiente();

    // 6 · problema 3 — ▶ no vuelve a preguntar lo de los otros
    expect(lab.encargo()).toBe('la-tiendita');
    lab.escribir(enCeldas({ Calentamiento: SALUDO, 'Problema 1': EDAD_BIEN, 'Problema 2': EN_2030, 'Problema 3': TIENDITA }));
    lab.correr('12.5', '3');
    expect(lab.salida()).toContain('Pagas 37.5 pesos.');
    expect(lab.salida()).not.toContain('¿Año?');
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('si');
    lab.siguiente();

    // 7 · para cerrar
    expect(lab.encargo()).toBe('para-cerrar');
    fireEvent.click(screen.getByText('El precio llegó como texto y nunca lo convirtió: multiplicar un texto por 3 lo repite tres veces.'));

    expect(screen.getByText('Insignia · Pregunta y responde')).toBeInTheDocument();
    expect(lab.onProgress).toHaveBeenLastCalledWith(1);
    expect(lab.onComplete).toHaveBeenCalledTimes(1);
    expect(lab.onComplete.mock.calls[0][0]).toMatchObject({ score: 100, stars: 3 });
  });
});
