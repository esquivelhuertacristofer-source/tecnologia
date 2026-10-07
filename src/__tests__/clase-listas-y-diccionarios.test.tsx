/**
 * N8 · «Listas y diccionarios» — la clase jugada entera (§69.20).
 *
 * Jugando MAL antes que bien: `mochila[2]` por «la última», que pasa el ejemplo,
 * y fallar la pregunta final. Lo que vigila y el test del juez no puede: que el
 * tablero enseñe la mochila del ejemplo y no las ocultas, y que La Mochila
 * enseñe las casillas con su número y avise del índice que no existe.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { LabListasYDiccionarios, PLANTILLA } from '@/components/activities/n8/python/LabListasYDiccionarios';

type Celda = 'Problema 1' | 'Problema 2' | 'Problema 3' | 'Problema 4' | 'Problema 5';

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

const EXTREMOS = 'print("Primero:", mochila[0])\nprint("Último:", mochila[-1])\nprint("Cosas:", len(mochila))';
const PEDIDO = 'mochila.append(nuevo)\nprint(mochila)\nprint("Ahora son", len(mochila))';
const CUESTA = 'print("Total:", sum(precios), "pesos")\nprint("Más caro:", max(precios))';
const TENEMOS =
  'if buscar in inventario:\n    print(buscar + ":", inventario[buscar], "en el almacén")\nelse:\n    print("No tenemos " + buscar + ".")';
const AGOTADOS =
  'n = 0\nfor producto, cantidad in inventario.items():\n    if cantidad == 0:\n        print("Falta:", producto)\n        n = n + 1\nprint("Agotados:", n)';

function montar() {
  const onComplete = jest.fn();
  render(<LabListasYDiccionarios config={{}} onProgress={jest.fn()} onScore={jest.fn()} onComplete={onComplete} />);
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
    /** La Mochila que se ve: fuera del tablero en la exploración, al pie en los problemas. */
    mochila: () =>
      document.querySelector('[data-testid="jz-fuera"] [data-testid="pyc-mochila"]') ??
      document.querySelector('div:not([hidden]) > [data-testid="jz-panel"] [data-testid="pyc-mochila"]'),
  };
  return api;
}

describe('jugando mal a propósito', () => {
  it('mochila[2] por «la última» pasa el ejemplo y el juez la rechaza sin enseñar las mochilas ocultas', () => {
    const lab = montar().entrar();
    expect(lab.area().value).toBe(PLANTILLA);
    expect(lab.encargo()).toBe('primero-y-ultimo');
    expect(screen.getByTestId('jz-ej-datos').textContent).toContain('mochila = ["cuaderno", "lápiz", "regla"]');

    lab.escribir(enCeldas({ 'Problema 1': EXTREMOS.replace('mochila[-1]', 'mochila[2]') }));
    lab.correr();
    expect(lab.mochila()?.textContent).toContain('mochila[2]');
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('no');
    expect(lab.veredicto().textContent).toContain('1 de 4 casos');
    expect(lab.panel().textContent).not.toMatch(/tijeras|lonche|mapa/);
    expect(lab.logrado()).toBeNull();
  });

  it('La Mochila avisa cuando la casilla no existe', () => {
    const lab = montar().entrar();
    lab.escribir(enCeldas({ 'Problema 1': 'print(mochila[3])' }));
    lab.correr();
    expect(screen.getByTestId('cod-error')).toBeInTheDocument();
    const nota = lab.mochila()?.querySelector('[data-fuera-de-rango]');
    expect(nota?.getAttribute('data-fuera-de-rango')).toBe('si');
    expect(nota?.textContent).toContain('de 0 a 2');
  });
});

describe('el recorrido de punta a punta', () => {
  it('los siete encargos hasta la insignia', () => {
    const lab = montar().entrar();

    lab.escribir(enCeldas({ 'Problema 1': EXTREMOS }));
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('si');
    lab.siguiente();

    expect(lab.encargo()).toBe('la-casilla-que-no-existe');
    lab.escribir(enCeldas({ 'Problema 1': EXTREMOS + '\nprint(mochila[7])' }));
    lab.correr();
    expect(lab.logrado()).not.toBeNull();
    lab.siguiente();

    expect(lab.encargo()).toBe('el-pedido-nuevo');
    lab.escribir(enCeldas({ 'Problema 1': EXTREMOS, 'Problema 2': PEDIDO }));
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('si');
    lab.siguiente();

    lab.escribir(enCeldas({ 'Problema 1': EXTREMOS, 'Problema 2': PEDIDO, 'Problema 3': CUESTA }));
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('si');
    lab.siguiente();

    expect(lab.encargo()).toBe('lo-tenemos');
    lab.escribir(enCeldas({ 'Problema 1': EXTREMOS, 'Problema 2': PEDIDO, 'Problema 3': CUESTA, 'Problema 4': TENEMOS }));
    lab.correr();
    expect(lab.mochila()?.textContent).toContain('por clave');
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('si');
    lab.siguiente();

    lab.escribir(
      enCeldas({ 'Problema 1': EXTREMOS, 'Problema 2': PEDIDO, 'Problema 3': CUESTA, 'Problema 4': TENEMOS, 'Problema 5': AGOTADOS }),
    );
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('si');
    lab.siguiente();

    expect(lab.encargo()).toBe('la-posicion-del-len');
    fireEvent.click(screen.getByText('Porque len sólo funciona con diccionarios.'));
    fireEvent.click(
      screen.getByText(
        'Porque las casillas empiezan en 0: con 3 cosas van de la 0 a la 2, y la 3 —lo que vale len— ya no existe. La última es len menos uno, o -1.',
      ),
    );
    expect(screen.getByText('Insignia · Ordenaste tu mochila')).toBeInTheDocument();
    expect(lab.onComplete).toHaveBeenCalledTimes(1);
  });
});
