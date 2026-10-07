/**
 * N7 · «Bucles» — la clase jugada entera sobre el juez de programas (§69.17).
 *
 * Jugando MAL antes que bien: range(n) que arranca en 0, cinco print a mano,
 * un while que sí termina en el experimento, y fallar la pregunta final.
 * Después, el recorrido de punta a punta.
 *
 * Lo que vigila y el test del juez no puede: que ▶ corra la celda del encargo,
 * que el Cuentapasos hable de ESA ejecución (y avise cuando el editor para un
 * bucle infinito), y que ningún dato oculto se asome al DOM.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { LabBucles, PLANTILLA } from '@/components/activities/python/LabBucles';

const py = (...l: string[]) => l.join('\n');

type Celda = 'Problema 1' | 'Problema 2' | 'Experimento' | 'Problema 3' | 'Problema 4';

function enCeldas(programas: Partial<Record<Celda, string>>): string {
  const lineas = PLANTILLA.split('\n');
  for (const [celda, programa] of Object.entries(programas)) {
    const i = lineas.findIndex((l) => l.startsWith(`# %% ${celda}`));
    lineas.splice(i + 1, 0, ...(programa as string).split('\n'));
  }
  return lineas.join('\n');
}

const VUELTAS = py('n = int(input("¿Cuántas vueltas? "))', 'for i in range(1, n + 1):', '    print("Vuelta", i)', 'print("¡Terminaste!")');
const KM = py('d = int(input("Días: "))', 't = 0', 'for i in range(d):', '    t = t + int(input("Km: "))', 'print("Total:", t, "km")');
const INFINITO = py('x = 3', 'while x > 0:', '    x = x + 0');
const META = py('meta = int(input("Meta: "))', 't = 0', 's = 0', 'while t < meta:', '    t = t + int(input("Salida: "))', '    s = s + 1', 'print("Salidas para llegar:", s)');
const ALCANCIA = py(
  'n = 0',
  't = 0',
  'while True:',
  '    m = int(input("Moneda: "))',
  '    if m == 0:',
  '        break',
  '    n = n + 1',
  '    t = t + m',
  'print(n, "monedas,", t, "pesos")',
);

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  render(<LabBucles config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />);
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
    escribir: (texto: string) => fireEvent.change(screen.getByTestId('cod-area'), { target: { value: texto } }),
    correr: (...respuestas: string[]) => {
      fireEvent.click(screen.getByTestId('cod-ejecutar'));
      for (const r of respuestas) {
        if (!screen.queryByTestId('cod-entrada')) return;
        fireEvent.change(screen.getByTestId('cod-entrada'), { target: { value: r } });
        fireEvent.click(screen.getByTestId('cod-responder'));
      }
    },
    enviar: () => fireEvent.click(screen.getByTestId('jz-enviar')),
    veredicto: () => screen.getByTestId('jz-veredicto'),
    encargo: () => screen.getByTestId('cod-encargo').getAttribute('data-paso'),
    logrado: () => screen.queryByTestId('cod-logrado'),
    siguiente: () => fireEvent.click(screen.getByText('Siguiente encargo →')),
    panel: () => screen.getByTestId('cod-panel'),
  };
  return api;
}

describe('antes de entrar', () => {
  it('la portada habla del entrenamiento y la plantilla trae las cinco celdas', () => {
    const lab = montar();
    expect(screen.getByText('Bucles: repetir lo que dice el dato')).toBeInTheDocument();
    lab.entrar();
    expect(lab.encargo()).toBe('las-vueltas');
    expect(lab.area().value).toBe(PLANTILLA);
  });
});

describe('jugando mal a propósito', () => {
  it('range(n) arranca en 0: rechazado en el ejemplo, sin enseñar los datos ocultos', () => {
    const lab = montar().entrar();
    lab.escribir(enCeldas({ 'Problema 1': py('n = int(input())', 'for i in range(n):', '    print("Vuelta", i)', 'print("¡Terminaste!")') }));
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('no');
    expect(lab.veredicto().textContent).toContain('1 de 4 casos');
    expect(lab.panel().textContent).not.toMatch(/Vuelta 12|Vuelta 11/);
    expect(lab.logrado()).toBeNull();
  });

  it('cinco print a mano pasan el ejemplo y el juez los rechaza en los ocultos', () => {
    const lab = montar().entrar();
    lab.escribir(enCeldas({ 'Problema 1': py('n = int(input())', 'print("Vuelta 1")', 'print("Vuelta 2")', 'print("Vuelta 3")', 'print("¡Terminaste!")') }));
    lab.correr('3');
    expect(lab.salida()).toContain('Vuelta 3');
    lab.enviar();
    expect(lab.veredicto().textContent).toContain('1 de 4 casos');
    expect(lab.veredicto().textContent).toContain('día de descanso');
    expect(lab.logrado()).toBeNull();
  });

  it('en el experimento, un while que sí termina no basta; uno que no cambia, sí, y el Cuentapasos lo dice', () => {
    const lab = montar().entrar();
    lab.escribir(enCeldas({ 'Problema 1': VUELTAS }));
    lab.enviar();
    lab.siguiente();
    lab.escribir(enCeldas({ 'Problema 1': VUELTAS, 'Problema 2': KM }));
    lab.enviar();
    lab.siguiente();
    expect(lab.encargo()).toBe('el-bucle-que-no-para');
    expect(screen.getByTestId('jz-fuera')).toBeInTheDocument();

    lab.escribir(enCeldas({ 'Problema 1': VUELTAS, 'Problema 2': KM, Experimento: py('x = 3', 'while x > 0:', '    x = x - 1') }));
    lab.correr();
    expect(lab.logrado()).toBeNull();

    lab.escribir(enCeldas({ 'Problema 1': VUELTAS, 'Problema 2': KM, Experimento: INFINITO }));
    lab.correr();
    expect(document.querySelector('[data-testid="jz-fuera"] [data-cuentapasos="limite"]')).not.toBeNull();
    expect(lab.logrado()).not.toBeNull();
  });
});

describe('el recorrido de punta a punta', () => {
  it('los seis encargos hasta la insignia, fallando antes la pregunta final', () => {
    const lab = montar().entrar();

    lab.escribir(enCeldas({ 'Problema 1': VUELTAS }));
    lab.correr('2');
    expect(lab.salida()).toContain('Vuelta 2');
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('si');
    lab.siguiente();

    lab.escribir(enCeldas({ 'Problema 1': VUELTAS, 'Problema 2': KM }));
    lab.correr('2', '4', '6');
    expect(lab.salida()).toContain('Total: 10 km');
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('si');
    lab.siguiente();

    lab.escribir(enCeldas({ 'Problema 1': VUELTAS, 'Problema 2': KM, Experimento: INFINITO }));
    lab.correr();
    lab.siguiente();

    expect(lab.encargo()).toBe('la-meta');
    lab.escribir(enCeldas({ 'Problema 1': VUELTAS, 'Problema 2': KM, Experimento: INFINITO, 'Problema 3': META }));
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('si');
    lab.siguiente();

    lab.escribir(enCeldas({ 'Problema 1': VUELTAS, 'Problema 2': KM, Experimento: INFINITO, 'Problema 3': META, 'Problema 4': ALCANCIA }));
    lab.correr('10', '5', '0');
    expect(lab.salida()).toContain('2 monedas, 15 pesos');
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('si');
    expect(screen.getByTestId('jz-solapa-la-meta').getAttribute('data-estado')).toBe('aceptado');
    lab.siguiente();

    expect(lab.encargo()).toBe('el-que-pide-de-mas');
    fireEvent.click(screen.getByText('Porque su contador de salidas empezó en 1 en vez de 0.'));
    fireEvent.click(
      screen.getByText(
        'Porque cuando la suma llega justo a la meta, «menor o igual» todavía es cierta: su bucle da otra vuelta y pregunta otra salida que el caso no trae.',
      ),
    );
    expect(screen.getByText('Insignia · Sobreviviste al bucle infinito')).toBeInTheDocument();
    expect(lab.onComplete).toHaveBeenCalledTimes(1);
  });
});
