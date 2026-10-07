/**
 * N9 · «Búsqueda y ordenamiento» — los seis problemas del festival, jugados
 * enteros (§68.2).
 *
 * Jugando MAL antes que bien (`jugar-mal-a-proposito`): enviar el archivo vacío,
 * copiar la respuesta del ejemplo, resolver el burbuja con `sorted()`, recorrer
 * un par de más, pedir las tres pistas. Después, el recorrido entero con las
 * seis funciones acumuladas en el mismo archivo.
 *
 * Lo que vigila y ninguna otra prueba puede:
 *
 * - **Que ningún encargo vuelva a dictar código.** La versión anterior ponía el
 *   programa entero en la instrucción.
 * - **Que un caso oculto no pinte sus datos**, sobre el DOM de verdad.
 * - **Que el encargo se cierra con el veredicto del juez.**
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { LabBusquedaYOrdenamiento } from '@/components/activities/datos/LabBusquedaYOrdenamiento';
import { B1, B2, B3, B4, B5, B6 } from '@/components/activities/datos/problemasBusqueda';
import { limpiarRegistro } from '@/components/simuladores/juez';

const py = (...l: string[]) => l.join('\n');

const SOL = [
  py('def posicion(canciones, titulo):', '    for i in range(len(canciones)):', '        if canciones[i] == titulo:', '            return i', '    return -1'),
  py('def comparaciones(canciones, titulo):', '    n = 0', '    for c in canciones:', '        n = n + 1', '        if c == titulo:', '            return n', '    return n'),
  py('def comparaciones_ordenada(numeros, objetivo):', '    n = 0', '    for x in numeros:', '        n = n + 1', '        if x >= objetivo:', '            return n', '    return n'),
  py('def una_pasada(numeros):', '    l = numeros[:]', '    for i in range(len(l) - 1):', '        if l[i] > l[i + 1]:', '            l[i], l[i + 1] = l[i + 1], l[i]', '    return l'),
  py(
    'def burbuja(numeros):',
    '    l = numeros[:]',
    '    cambios = 0',
    '    for pasada in range(len(l) - 1):',
    '        for i in range(len(l) - 1 - pasada):',
    '            if l[i] > l[i + 1]:',
    '                l[i], l[i + 1] = l[i + 1], l[i]',
    '                cambios = cambios + 1',
    '    return [l, cambios]',
  ),
  py(
    'def pasadas(numeros):',
    '    l = numeros[:]',
    '    n = 0',
    '    hubo = True',
    '    while hubo:',
    '        hubo = False',
    '        n = n + 1',
    '        for i in range(len(l) - 1):',
    '            if l[i] > l[i + 1]:',
    '                l[i], l[i + 1] = l[i + 1], l[i]',
    '                hubo = True',
    '    return n',
  ),
];

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  render(<LabBusquedaYOrdenamiento config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />);
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
    expect(screen.getByText(/cuánto trabajo hace tu programa/i)).toBeInTheDocument();
    expect(screen.getByText(/Mide su propio código/)).toBeInTheDocument();
    expect(screen.queryByTestId('cod-area')).toBeNull();
  });

  it('el primer encargo es el primer problema, y NINGÚN encargo dicta código', () => {
    const lab = montar().entrar();
    expect(lab.encargo()).toBe(B1.id);
    const texto = screen.getByTestId('cod-encargo').textContent ?? '';
    expect(texto).not.toMatch(/\bfor\b|range\(|comparaciones = 0|==/);
  });
});

describe('jugando mal', () => {
  it('enviar el archivo vacío no aprueba y dice que la función no existe', () => {
    const lab = montar().entrar();
    lab.enviar();
    expect(lab.aceptado()).toBe('no');
    expect(screen.getByTestId('jz-veredicto').textContent).toMatch(/no la define con ese nombre/);
    expect(lab.encargo()).toBe(B1.id);
  });

  it('copiar la respuesta del ejemplo pasa un caso y ninguno más', () => {
    const lab = montar().entrar();
    lab.escribir(py('def posicion(canciones, titulo):', '    return 2'));
    lab.enviar();
    expect(lab.aceptado()).toBe('no');
    expect(screen.getByTestId('jz-veredicto').textContent).toMatch(/1 de 5 casos/);
  });

  it('quedarse con la última coincidencia pasa lo visible y un oculto lo tumba, sin enseñar sus datos', () => {
    const lab = montar().entrar();
    lab.escribir(
      py('def posicion(canciones, titulo):', '    lugar = -1', '    for i in range(len(canciones)):', '        if canciones[i] == titulo:', '            lugar = i', '    return lugar'),
    );
    lab.enviar();
    const tablero = screen.getByTestId('jz-veredicto');
    tablero.querySelectorAll('[data-oculto="no"]').forEach((c) => expect(c.getAttribute('data-clase')).toBe('pasa'));
    const cazador = within(tablero).getByText('la pidieron dos veces').closest('li');
    expect(cazador?.getAttribute('data-clase')).toBe('falla');
    for (const li of Array.from(tablero.querySelectorAll('[data-oculto="si"]'))) {
      expect(li.textContent ?? '').not.toMatch(/\d/);
      expect(li.querySelector('.jz-caso-cotejo')).toBeNull();
    }
  });

  it('las tres pistas se piden una a una y la tercera avisa de que cuesta ANTES', () => {
    const lab = montar().entrar();
    lab.pista();
    expect(screen.getByText(B1.pistas[0])).toBeInTheDocument();
    lab.pista();
    expect(screen.getByTestId('jz-pista').textContent).toMatch(/cuesta puntos/);
    lab.pista();
    expect(screen.getByText(B1.pistas[2])).toBeInTheDocument();
    expect(screen.queryByTestId('jz-pista')).toBeNull();
  });
});

describe('la clase, de la portada a la insignia', () => {
  it('seis problemas acumulados en el mismo archivo, sorted() rechazado por el camino, y la pregunta de cierre', () => {
    const lab = montar().entrar();
    const ids = [B1.id, B2.id, B3.id, B4.id, B5.id, B6.id];
    const acumulado: string[] = [];

    ids.forEach((id, i) => {
      if (id === B5.id) {
        /* Jugando mal en mitad del recorrido: el atajo de la función que ya
         * trae Python da la lista pero no el conteo. */
        lab.escribir([...acumulado, py('def burbuja(numeros):', '    return [sorted(numeros), 0]')].join('\n\n'));
        lab.enviar();
        expect(lab.aceptado()).toBe('no');
        expect(lab.encargo()).toBe(B5.id);
      }
      acumulado.push(SOL[i]);
      lab.escribir(acumulado.join('\n\n'));
      lab.enviar();
      expect(lab.aceptado()).toBe('si');
      expect(lab.solapa(id)).toBe('aceptado');
      lab.siguiente();
    });

    expect(lab.encargo()).toBe('lo-que-dicen-tus-numeros');
    fireEvent.click(screen.getByText(/el burbuja está mal escrito/));
    expect(lab.encargo()).toBe('lo-que-dicen-tus-numeros');
    fireEvent.click(screen.getByText(/depende sólo de cuántos datos hay/));

    expect(lab.onComplete).toHaveBeenCalled();
    expect(screen.getByText(/Mediste tu propio código/)).toBeInTheDocument();
  }, 60_000);
});
