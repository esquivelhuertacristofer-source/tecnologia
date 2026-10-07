/**
 * N7 · «Condicionales» — la clase jugada entera sobre el juez de programas (§68.5).
 *
 * Jugando MAL antes que bien: la frontera con mayor que a secas, el elif al
 * revés que acierta con los ejemplos, comparar con un solo =, y fallar la
 * pregunta final. Después, el recorrido de punta a punta.
 *
 * Lo que vigila y el test del juez no puede: que ▶ corra la celda del encargo,
 * que el Semáforo marque la rama tomada de ESA celda debajo del tablero, y que
 * ningún dato oculto se asome al DOM.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { LabCondicionales, PLANTILLA } from '@/components/activities/python/LabCondicionales';

const py = (...l: string[]) => l.join('\n');

type Celda = 'Problema 1' | 'Problema 2' | 'Problema 3' | 'Problema 4';

function enCeldas(programas: Partial<Record<Celda, string>>): string {
  const lineas = PLANTILLA.split('\n');
  for (const [celda, programa] of Object.entries(programas)) {
    const i = lineas.findIndex((l) => l.startsWith(`# %% ${celda}`));
    lineas.splice(i + 1, 0, ...(programa as string).split('\n'));
  }
  return lineas.join('\n');
}

const ALCANZAS = py('a = int(input("Altura: "))', 'if a >= 120:', '    print("Puedes subir.")', 'else:', '    print("Todavía no.")');
const TRES = py(
  'a = int(input("Altura: "))',
  'if a < 120:',
  '    print("No puedes subir.")',
  'elif a < 150:',
  '    print("Subes con un adulto.")',
  'else:',
  '    print("Subes solo.")',
);
const VIP = py(
  'a = int(input("Altura: "))',
  'b = input("Boleto: ")',
  'if a < 120:',
  '    print("No puedes subir.")',
  'elif b == "vip":',
  '    print("Acceso VIP: subes ya.")',
  'else:',
  '    print("Fila normal.")',
);
const GRATIS = py('e = int(input("Edad: "))', 'c = input("¿Cumpleaños? ")', 'if e < 5 or c == "si":', '    print("Entrada gratis.")', 'else:', '    print("Pagas entrada.")');

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  render(<LabCondicionales config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />);
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
  it('la portada habla de La Serpiente y la plantilla trae las cuatro celdas', () => {
    const lab = montar();
    expect(screen.getByText('Condicionales: que tu programa decida')).toBeInTheDocument();
    lab.entrar();
    expect(lab.encargo()).toBe('alcanzas');
    expect(lab.area().value).toBe(PLANTILLA);
  });
});

describe('jugando mal a propósito', () => {
  it('mayor que a secas: rechazado por el caso justo en la marca, sin enseñar sus datos', () => {
    const lab = montar().entrar();
    lab.escribir(enCeldas({ 'Problema 1': py('a = int(input())', 'if a > 120:', '    print("Puedes subir.")', 'else:', '    print("Todavía no.")') }));
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('no');
    expect(lab.veredicto().textContent).toContain('4 de 5 casos');
    expect(lab.veredicto().textContent).toContain('justo en la marca');
    expect(lab.panel().textContent).not.toMatch(/\b119\b|\b200\b/);
    expect(lab.logrado()).toBeNull();
  });

  it('el elif al revés: el Semáforo marca la rama equivocada con 100 y el juez lo rechaza', () => {
    const lab = montar().entrar();
    lab.escribir(enCeldas({ 'Problema 1': ALCANZAS }));
    lab.enviar();
    lab.siguiente();
    expect(lab.encargo()).toBe('tres-caminos');

    const alReves = py(
      'a = int(input())',
      'if a < 150:',
      '    print("Subes con un adulto.")',
      'elif a < 120:',
      '    print("No puedes subir.")',
      'else:',
      '    print("Subes solo.")',
    );
    lab.escribir(enCeldas({ 'Problema 1': ALCANZAS, 'Problema 2': alReves }));
    lab.correr('100');
    /* ▶ corre la celda del Problema 2: no pregunta dos veces. */
    expect(lab.salida()).toContain('Subes con un adulto.');
    const tomadas = [...document.querySelectorAll('[data-testid="pyc-semaforo"] [data-tomada="si"]')].map((b) => b.textContent);
    expect(tomadas).toHaveLength(1);
    expect(tomadas[0]).toContain('if a < 150');

    lab.enviar();
    expect(lab.veredicto().textContent).toContain('5 de 6 casos');
    expect(lab.logrado()).toBeNull();
  });

  it('comparar con un solo = es el encargo de exploración y el editor lo explica', () => {
    const lab = montar().entrar();
    lab.escribir(enCeldas({ 'Problema 1': ALCANZAS }));
    lab.enviar();
    lab.siguiente();
    lab.escribir(enCeldas({ 'Problema 1': ALCANZAS, 'Problema 2': TRES }));
    lab.enviar();
    lab.siguiente();
    expect(lab.encargo()).toBe('un-igual-o-dos');
    expect(screen.getByTestId('jz-fuera')).toBeInTheDocument();
    lab.escribir(enCeldas({ 'Problema 1': ALCANZAS, 'Problema 2': TRES, 'Problema 3': py('b = input()', 'if b = "vip":', '    print("VIP")') }));
    lab.correr('vip');
    expect(screen.getByTestId('cod-error').textContent).toContain('==');
    expect(lab.logrado()).not.toBeNull();
  });
});

describe('el recorrido de punta a punta', () => {
  it('los seis encargos hasta la insignia, fallando antes la pregunta final', () => {
    const lab = montar().entrar();

    lab.escribir(enCeldas({ 'Problema 1': ALCANZAS }));
    lab.correr('120');
    expect(lab.salida()).toContain('Puedes subir.');
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('si');
    lab.siguiente();

    lab.escribir(enCeldas({ 'Problema 1': ALCANZAS, 'Problema 2': TRES }));
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('si');
    lab.siguiente();

    lab.escribir(enCeldas({ 'Problema 1': ALCANZAS, 'Problema 2': TRES, 'Problema 3': py('b = input()', 'if b = "vip":', '    print("x")') }));
    lab.correr();
    lab.siguiente();

    expect(lab.encargo()).toBe('pase-vip');
    lab.escribir(enCeldas({ 'Problema 1': ALCANZAS, 'Problema 2': TRES, 'Problema 3': VIP }));
    lab.correr('110', 'vip');
    expect(lab.salida()).toContain('No puedes subir.');
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('si');
    expect(screen.getByTestId('jz-solapa-tres-caminos').getAttribute('data-estado')).toBe('aceptado');
    lab.siguiente();

    lab.escribir(enCeldas({ 'Problema 1': ALCANZAS, 'Problema 2': TRES, 'Problema 3': VIP, 'Problema 4': GRATIS }));
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('si');
    lab.siguiente();

    expect(lab.encargo()).toBe('el-orden-importa');
    fireEvent.click(screen.getByText('Porque el juez sólo acepta las condiciones escritas de menor a mayor.'));
    expect(lab.onScore).toHaveBeenLastCalledWith(94);
    fireEvent.click(
      screen.getByText(
        'Porque Python revisa de arriba abajo: a alguien de 100 le toca primero «menor que 150», que ya es cierta, y nunca llega a preguntar por 120.',
      ),
    );
    expect(screen.getByText('Insignia · Tu programa ya decide')).toBeInTheDocument();
    expect(lab.onComplete).toHaveBeenCalledTimes(1);
    expect(lab.onComplete.mock.calls[0][0]).toMatchObject({ score: 94 });
  });
});
