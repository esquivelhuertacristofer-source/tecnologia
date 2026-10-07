/**
 * N9 · «Proyectos de datos con Python» — los seis problemas del reporte del
 * grupo, jugados enteros (§68.3).
 *
 * Jugando MAL antes que bien (`jugar-mal-a-proposito`): enviar el archivo
 * vacío, el `if` que confunde el cero con un dato que falta, la suma que se
 * tropieza con `None`, un `print` de depuración olvidado y las tres pistas.
 * Después, el recorrido entero con las seis funciones acumuladas en el mismo
 * archivo, **debajo de la plantilla**, que es donde las escribe el alumno.
 *
 * Lo que vigila y ninguna otra prueba puede:
 *
 * - **Que ningún encargo vuelva a dictar código.** La versión anterior ponía el
 *   programa entero en la instrucción y exigía el texto de cada `print`.
 * - **Que un caso oculto no pinte sus datos**, sobre el DOM de verdad.
 * - **Que la plantilla no estorbe**: sus registros y lo que el alumno imprima
 *   con ellos no tumban ningún caso.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { LabDatosConPython, PLANTILLA } from '@/components/activities/datos/LabDatosConPython';
import { D1, D2, D3, D4, D5, D6 } from '@/components/activities/datos/problemasDatos';
import { limpiarRegistro } from '@/components/simuladores/juez';

const py = (...l: string[]) => l.join('\n');

const SOL = [
  py('def con_calificacion(registros):', '    n = 0', '    for r in registros:', '        if r["calificacion"] != None:', '            n = n + 1', '    return n'),
  py(
    'def promedio(registros):',
    '    suma = 0',
    '    n = 0',
    '    for r in registros:',
    '        if r["calificacion"] != None:',
    '            suma = suma + r["calificacion"]',
    '            n = n + 1',
    '    if n == 0:',
    '        return None',
    '    return round(suma / n, 1)',
  ),
  py(
    'def reprobados(registros, minima):',
    '    nombres = []',
    '    for r in registros:',
    '        if r["calificacion"] != None and r["calificacion"] < minima:',
    '            nombres.append(r["nombre"])',
    '    return nombres',
  ),
  py(
    'def mejor(registros):',
    '    nombre = "nadie"',
    '    alta = None',
    '    for r in registros:',
    '        c = r["calificacion"]',
    '        if c != None:',
    '            if alta == None or c > alta:',
    '                alta = c',
    '                nombre = r["nombre"]',
    '    return nombre',
  ),
  py(
    'def por_nivel(registros):',
    '    bajos = 0',
    '    medios = 0',
    '    altos = 0',
    '    for r in registros:',
    '        c = r["calificacion"]',
    '        if c != None:',
    '            if c < 6:',
    '                bajos = bajos + 1',
    '            elif c < 9:',
    '                medios = medios + 1',
    '            else:',
    '                altos = altos + 1',
    '    return [bajos, medios, altos]',
  ),
  py(
    'def conclusion(registros, minima):',
    '    n = con_calificacion(registros)',
    '    if n == 0:',
    '        return "sin datos"',
    '    if len(reprobados(registros, minima)) > n / 2:',
    '        return "reforzar"',
    '    return "va bien"',
  ),
];

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  render(<LabDatosConPython config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />);
  const api = {
    onComplete,
    entrar: () => {
      fireEvent.click(screen.getByTestId('pyc-empezar'));
      return api;
    },
    escribir: (texto: string) => fireEvent.change(screen.getByTestId('cod-area'), { target: { value: texto } }),
    enviar: () => fireEvent.click(screen.getByTestId('jz-enviar')),
    aceptado: () => screen.getByTestId('jz-veredicto').getAttribute('data-aceptado'),
    encargo: () => screen.getByTestId('cod-encargo').getAttribute('data-paso'),
    siguiente: () => fireEvent.click(screen.getByText('Siguiente encargo →')),
    solapa: (id: string) => screen.getByTestId(`jz-solapa-${id}`).getAttribute('data-estado'),
    pista: () => fireEvent.click(screen.getByTestId('jz-pista')),
  };
  return api;
}

beforeEach(() => limpiarRegistro());

describe('antes de entrar', () => {
  it('la portada dice de qué va y el editor no está detrás', () => {
    montar();
    expect(screen.getByText(/un dato que falta no es un cero/i)).toBeInTheDocument();
    expect(screen.getAllByText(/El Analista de Datos/).length).toBeGreaterThan(0);
    expect(screen.queryByTestId('cod-area')).toBeNull();
  });

  it('el primer encargo es el primer problema, NINGÚN encargo dicta código, y la plantilla trae los registros sin candado', () => {
    const lab = montar().entrar();
    expect(lab.encargo()).toBe(D1.id);
    const texto = screen.getByTestId('cod-encargo').textContent ?? '';
    expect(texto).not.toMatch(/\bfor\b|validos|\.append|!=|==|print\(/);
    expect((screen.getByTestId('cod-area') as HTMLTextAreaElement).value).toBe(PLANTILLA);
    fireEvent.change(screen.getByTestId('cod-area'), { target: { value: '# lo borré todo' } });
    expect((screen.getByTestId('cod-area') as HTMLTextAreaElement).value).toBe('# lo borré todo');
  });
});

describe('jugando mal', () => {
  it('enviar el archivo tal cual no aprueba y dice que la función no existe', () => {
    const lab = montar().entrar();
    lab.enviar();
    expect(lab.aceptado()).toBe('no');
    expect(screen.getByTestId('jz-veredicto').textContent).toMatch(/no la define con ese nombre/);
    expect(lab.encargo()).toBe(D1.id);
  });

  it('confundir el cero con un dato que falta pasa lo visible y «alguien sacó cero» lo tumba, sin enseñar sus datos', () => {
    const lab = montar().entrar();
    lab.escribir(
      py(PLANTILLA, 'def con_calificacion(registros):', '    n = 0', '    for r in registros:', '        if r["calificacion"]:', '            n = n + 1', '    return n'),
    );
    lab.enviar();
    expect(lab.aceptado()).toBe('no');
    const tablero = screen.getByTestId('jz-veredicto');
    tablero.querySelectorAll('[data-oculto="no"]').forEach((c) => expect(c.getAttribute('data-clase')).toBe('pasa'));
    const cazador = within(tablero).getByText('alguien sacó cero').closest('li');
    expect(cazador?.getAttribute('data-clase')).toBe('falla');
    for (const li of Array.from(tablero.querySelectorAll('[data-oculto="si"]'))) {
      expect(li.textContent ?? '').not.toMatch(/\d/);
      expect(li.querySelector('.jz-caso-cotejo')).toBeNull();
    }
  });

  it('un print de depuración con los registros de la plantilla no tumba ningún caso', () => {
    const lab = montar().entrar();
    lab.escribir(py(PLANTILLA, SOL[0], '', 'print("cuántos:", con_calificacion(calificaciones))'));
    lab.enviar();
    expect(lab.aceptado()).toBe('si');
  });

  it('las tres pistas se piden una a una y la tercera avisa de que cuesta ANTES', () => {
    const lab = montar().entrar();
    lab.pista();
    expect(screen.getByText(D1.pistas[0])).toBeInTheDocument();
    lab.pista();
    expect(screen.getByTestId('jz-pista').textContent).toMatch(/cuesta puntos/);
    lab.pista();
    expect(screen.getByText(D1.pistas[2])).toBeInTheDocument();
    expect(screen.queryByTestId('jz-pista')).toBeNull();
  });
});

describe('la clase, de la portada a la insignia', () => {
  it('seis problemas acumulados bajo la plantilla, la suma de None rechazada por el camino, y la pregunta de cierre', () => {
    const lab = montar().entrar();
    const ids = [D1.id, D2.id, D3.id, D4.id, D5.id, D6.id];
    const acumulado: string[] = [PLANTILLA];

    ids.forEach((id, i) => {
      if (id === D2.id) {
        /* Jugando mal en mitad del recorrido: sumar a todos, también a quien
         * no ha entregado. Los ejemplos visibles pasan; el grupo real no. */
        lab.escribir(
          [
            ...acumulado,
            py('def promedio(registros):', '    suma = 0', '    for r in registros:', '        suma = suma + r["calificacion"]', '    return round(suma / len(registros), 1)'),
          ].join('\n\n'),
        );
        lab.enviar();
        expect(lab.aceptado()).toBe('no');
        expect(lab.encargo()).toBe(D2.id);
        const tropiezo = within(screen.getByTestId('jz-veredicto')).getByText('alguien no entregó').closest('li');
        expect(tropiezo?.getAttribute('data-clase')).toBe('error');
      }
      acumulado.push(SOL[i]);
      lab.escribir(acumulado.join('\n\n'));
      lab.enviar();
      expect(lab.aceptado()).toBe('si');
      expect(lab.solapa(id)).toBe('aceptado');
      lab.siguiente();
    });

    expect(lab.encargo()).toBe('lo-que-dice-el-cero');
    fireEvent.click(screen.getByText(/conviene quitar los ceros/));
    expect(lab.encargo()).toBe('lo-que-dice-el-cero');
    fireEvent.click(screen.getByText(/un dato que falta no es un cero: si la app/));

    expect(lab.onComplete).toHaveBeenCalled();
    expect(screen.getAllByText(/El Analista de Datos/).length).toBeGreaterThan(0);
  }, 60_000);
});
