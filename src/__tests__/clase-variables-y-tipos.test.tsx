/**
 * N7 · «Variables y tipos» — la clase jugada entera (§69.19).
 *
 * Jugando MAL antes que bien: la credencial escrita a mano que pasa el ejemplo,
 * tres cajas en vez de cuatro, y fallar la pregunta final. Lo que vigila y el
 * test del juez no puede: que el tablero enseñe los datos del ejemplo y no los
 * ocultos, y que la Mesa de tipos hable de la celda que corrió.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { LabVariablesYTipos, PLANTILLA } from '@/components/activities/python/LabVariablesYTipos';

type Celda = 'Cajas' | 'Problema 1' | 'Problema 2' | 'Problema 3';

/** Mete cada programa debajo de las líneas de datos de su celda. */
function enCeldas(programas: Partial<Record<Celda, string>>): string {
  const lineas = PLANTILLA.split('\n');
  for (const [celda, programa] of Object.entries(programas)) {
    const i = lineas.findIndex((l) => l.startsWith(`# %% ${celda}`));
    let j = i + 1;
    while (j < lineas.length && /^\w+\s*=/.test(lineas[j])) j++;
    lineas.splice(j, 0, ...(programa as string).split('\n'));
  }
  return lineas.join('\n');
}

const CAJAS = 'goles = 3\naltura = 1.5\nclub = "Halcones"\ngano = True\nprint(type(club))';
const CREDENCIAL = 'print("Credencial: " + nombre + ", " + str(edad) + " años")';
const PIZZAS = 'print("Cada equipo:", pizzas / equipos, "pizzas")\nprint("Enteras por equipo:", pizzas // equipos)';
const MARCADOR = 'print("Puntos con bono:", int(puntos) + bono)';

function montar() {
  const onComplete = jest.fn();
  render(<LabVariablesYTipos config={{}} onProgress={jest.fn()} onScore={jest.fn()} onComplete={onComplete} />);
  const api = {
    onComplete,
    entrar: () => {
      fireEvent.click(screen.getByTestId('pyc-empezar'));
      fireEvent.click(document.querySelector('[data-vel="rayo"]') as HTMLElement);
      return api;
    },
    area: () => screen.getByTestId('cod-area') as HTMLTextAreaElement,
    escribir: (texto: string) => fireEvent.change(screen.getByTestId('cod-area'), { target: { value: texto } }),
    correr: () => fireEvent.click(screen.getByTestId('cod-ejecutar')),
    enviar: () => fireEvent.click(screen.getByTestId('jz-enviar')),
    veredicto: () => screen.getByTestId('jz-veredicto'),
    encargo: () => screen.getByTestId('cod-encargo').getAttribute('data-paso'),
    logrado: () => screen.queryByTestId('cod-logrado'),
    siguiente: () => fireEvent.click(screen.getByText('Siguiente encargo →')),
    panel: () => screen.getByTestId('cod-panel'),
  };
  return api;
}

describe('jugando mal a propósito', () => {
  it('tres cajas no bastan, y la Mesa de tipos enseña lo que hay', () => {
    const lab = montar().entrar();
    expect(lab.area().value).toBe(PLANTILLA);
    lab.escribir(enCeldas({ Cajas: 'a = 1\nb = 2.5\nc = "hola"' }));
    lab.correr();
    expect(lab.logrado()).toBeNull();
    expect(document.querySelector('[data-testid="jz-fuera"] [data-caja="c"] [data-tipo="str"]')).not.toBeNull();
    /* ▶ corre sólo la celda Cajas: los datos de los problemas no aparecen en la Mesa. */
    expect(document.querySelector('[data-testid="jz-fuera"] [data-caja="nombre"]')).toBeNull();
  });

  it('la credencial escrita a mano pasa el ejemplo y el juez la rechaza sin enseñar los datos ocultos', () => {
    const lab = montar().entrar();
    lab.escribir(enCeldas({ Cajas: CAJAS }));
    lab.correr();
    lab.siguiente();
    lab.correr();
    lab.siguiente();
    lab.escribir(enCeldas({ Cajas: CAJAS, 'Problema 1': 'print("Credencial: " + nombre + edad)' }));
    lab.correr();
    lab.siguiente();
    expect(lab.encargo()).toBe('la-credencial');
    expect(screen.getByTestId('jz-ej-datos').textContent).toContain('nombre = "Ana"');

    lab.escribir(enCeldas({ Cajas: CAJAS, 'Problema 1': 'print("Credencial: Ana, 13 años")' }));
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('no');
    expect(lab.veredicto().textContent).toContain('1 de 4 casos');
    expect(lab.panel().textContent).not.toMatch(/María José|Ximena|Leo/);
    expect(lab.logrado()).toBeNull();
  });
});

describe('el recorrido de punta a punta', () => {
  it('los ocho encargos hasta la insignia', () => {
    const lab = montar().entrar();

    lab.escribir(enCeldas({ Cajas: CAJAS }));
    lab.correr();
    expect(lab.encargo()).toBe('cuatro-cajas');
    expect(lab.logrado()).not.toBeNull();
    lab.siguiente();

    lab.correr();
    expect(lab.logrado()).not.toBeNull();
    lab.siguiente();

    lab.escribir(enCeldas({ Cajas: CAJAS, 'Problema 1': 'print("Credencial: " + nombre + edad)' }));
    lab.correr();
    expect(screen.getByTestId('cod-error')).toBeInTheDocument();
    expect(lab.logrado()).not.toBeNull();
    lab.siguiente();

    lab.escribir(enCeldas({ Cajas: CAJAS, 'Problema 1': CREDENCIAL }));
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('si');
    lab.siguiente();

    lab.escribir(enCeldas({ Cajas: CAJAS, 'Problema 1': CREDENCIAL, 'Problema 2': PIZZAS }));
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('si');
    lab.siguiente();

    expect(lab.encargo()).toBe('no-se-deja');
    lab.escribir(enCeldas({ Cajas: CAJAS, 'Problema 1': CREDENCIAL, 'Problema 2': PIZZAS, 'Problema 3': 'print(int("siete"))' }));
    lab.correr();
    expect(lab.logrado()).not.toBeNull();
    lab.siguiente();

    lab.escribir(enCeldas({ Cajas: CAJAS, 'Problema 1': CREDENCIAL, 'Problema 2': PIZZAS, 'Problema 3': MARCADOR }));
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('si');
    lab.siguiente();

    expect(lab.encargo()).toBe('la-caja-del-texto');
    fireEvent.click(screen.getByText("<class 'int'>: al convertirla, la caja cambió de tipo para siempre."));
    fireEvent.click(screen.getByText("<class 'str'>: int() fabrica un número nuevo para la cuenta, pero la caja puntos sigue guardando el texto."));
    expect(screen.getByText('Insignia · Cada dato en su caja')).toBeInTheDocument();
    expect(lab.onComplete).toHaveBeenCalledTimes(1);
  });
});
