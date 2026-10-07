/**
 * N7 · «Retos guiados» — la clase jugada entera sobre el juez de programas (§69.18).
 *
 * Jugando MAL antes que bien: el descuento sin el 20 % que pasa los ejemplos,
 * el promedio sin revisar el grupo vacío, y fallar la pregunta final. Después,
 * el recorrido de punta a punta.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { LabRetosPython, PLANTILLA } from '@/components/activities/python/LabRetosPython';

const py = (...l: string[]) => l.join('\n');

type Celda = 'Reto 1' | 'Reto 2' | 'Reto 3';

function enCeldas(programas: Partial<Record<Celda, string>>): string {
  const lineas = PLANTILLA.split('\n');
  for (const [celda, programa] of Object.entries(programas)) {
    const i = lineas.findIndex((l) => l.startsWith(`# %% ${celda}`));
    lineas.splice(i + 1, 0, ...(programa as string).split('\n'));
  }
  return lineas.join('\n');
}

const PRECIO = py('p = float(input("Precio: "))', 'n = int(input("Piezas: "))', 't = p * n', 'if t >= 500:', '    t = t * 0.8', 'elif t >= 100:', '    t = t * 0.9', 'print("Pagas", t, "pesos.")');
const GRUPO = py(
  'n = int(input("Alumnos: "))',
  'if n == 0:',
  '    print("Sin calificaciones.")',
  'else:',
  '    s = 0',
  '    a = 0',
  '    for i in range(n):',
  '        c = int(input("Calificación: "))',
  '        s = s + c',
  '        if c >= 6:',
  '            a = a + 1',
  '    print("Aprobados:", a)',
  '    print("Promedio:", s / n)',
);
const CANDADO = py(
  'intentos = 3',
  'abierto = False',
  'while intentos > 0:',
  '    c = int(input("Código: "))',
  '    if c == 47:',
  '        abierto = True',
  '        break',
  '    print("Incorrecto.")',
  '    intentos = intentos - 1',
  'if abierto:',
  '    print("¡Casillero abierto!")',
  'else:',
  '    print("Casillero bloqueado.")',
);

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  render(<LabRetosPython config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />);
  const api = {
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
  it('la portada es el cierre de la unidad y la plantilla trae las tres celdas', () => {
    const lab = montar();
    expect(screen.getByText('Retos: juntar todo lo de la unidad')).toBeInTheDocument();
    lab.entrar();
    expect(lab.encargo()).toBe('el-precio-justo');
    expect(lab.area().value).toBe(PLANTILLA);
  });
});

describe('jugando mal a propósito', () => {
  it('el descuento sin el 20 % pasa los dos ejemplos y el juez lo rechaza sin enseñar los datos ocultos', () => {
    const lab = montar().entrar();
    lab.escribir(enCeldas({ 'Reto 1': py('p = float(input())', 'n = int(input())', 't = p * n', 'if t >= 100:', '    t = t * 0.9', 'print("Pagas", t, "pesos.")') }));
    lab.correr('20', '5');
    expect(lab.salida()).toContain('Pagas 90.0 pesos.');
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('no');
    expect(lab.veredicto().textContent).toContain('4 de 6 casos');
    expect(lab.panel().textContent).not.toMatch(/62\.5|400\.0/);
    expect(lab.logrado()).toBeNull();
  });

  it('el promedio sin revisar el grupo vacío cae sólo en ese oculto', () => {
    const lab = montar().entrar();
    lab.escribir(enCeldas({ 'Reto 1': PRECIO }));
    lab.enviar();
    lab.siguiente();
    expect(lab.encargo()).toBe('aprobados-y-promedio');
    const sinRevisar = py('n = int(input())', 's = 0', 'a = 0', 'for i in range(n):', '    c = int(input())', '    s = s + c', '    if c >= 6:', '        a = a + 1', 'print("Aprobados:", a)', 'print("Promedio:", s / n)');
    lab.escribir(enCeldas({ 'Reto 1': PRECIO, 'Reto 2': sinRevisar }));
    lab.enviar();
    expect(lab.veredicto().textContent).toContain('4 de 5 casos');
    expect(lab.veredicto().textContent).toContain('grupo vacío');
    expect(lab.logrado()).toBeNull();
  });
});

describe('el recorrido de punta a punta', () => {
  it('los cuatro encargos hasta la insignia, fallando antes la pregunta final', () => {
    const lab = montar().entrar();
    lab.escribir(enCeldas({ 'Reto 1': PRECIO }));
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('si');
    lab.siguiente();

    lab.escribir(enCeldas({ 'Reto 1': PRECIO, 'Reto 2': GRUPO }));
    lab.correr('2', '10', '7');
    expect(lab.salida()).toContain('Promedio: 8.5');
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('si');
    lab.siguiente();

    lab.escribir(enCeldas({ 'Reto 1': PRECIO, 'Reto 2': GRUPO, 'Reto 3': CANDADO }));
    lab.correr('47');
    expect(lab.salida()).toContain('¡Casillero abierto!');
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('si');
    lab.siguiente();

    expect(lab.encargo()).toBe('el-grupo-vacio');
    expect(screen.getByTestId('pyc-caja')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Porque el juez no sabe teclear un 0.'));
    fireEvent.click(
      screen.getByText('Porque con cero alumnos su programa divide la suma entre 0, y dividir entre cero no tiene resultado: Python se detiene con un error.'),
    );
    expect(screen.getByText('Insignia · Resolviste los tres retos')).toBeInTheDocument();
    expect(lab.onComplete).toHaveBeenCalledTimes(1);
  });
});
