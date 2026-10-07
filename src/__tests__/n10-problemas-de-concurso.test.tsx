/**
 * N10 · «Problemas tipo concurso» — el torneo con juez, jugado entero.
 *
 * Jugando MAL antes que bien, que es la regla de la casa (`jugar-mal-a-proposito`):
 * enviar sin escribir nada, enviar la respuesta del ejemplo copiada, enviar el
 * error del `>` por `>=`, pedir las tres pistas, intentar el encargo final con
 * un caso que no separa nada y con la propia solución rota. Y después el
 * recorrido completo hasta la insignia.
 *
 * Lo que esta prueba vigila y ninguna otra puede:
 *
 * - **Que los datos de los casos ocultos no aparezcan en el DOM.** El tachado
 *   está probado sobre el objeto en `juez-y-concurso.test.ts`; aquí se
 *   comprueba sobre lo que de verdad se pinta, que es lo que un alumno con las
 *   herramientas de desarrollo abiertas podría leer.
 * - **Que el panel del encargo final no exista hasta ganar el torneo**, porque
 *   enseña justo el error del problema 1.
 * - **Que el encargo se cierra con el veredicto y no con el texto.**
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { LabProblemasDeConcurso } from '@/components/activities/n10/problemas-de-concurso/LabProblemasDeConcurso';
import { P1, P2, P3, P4, P5, P6 } from '@/components/activities/n10/problemas-de-concurso/problemas';
import { limpiarRegistro } from '@/components/simuladores/juez';

const py = (...l: string[]) => l.join('\n');

const SOL_P1 = py('def avanzan(puntajes):', '    n = 0', '    for p in puntajes:', '        if p >= 70:', '            n = n + 1', '    return n');
const SOL_P2 = py(
  'def mejor(tiempos):',
  '    if len(tiempos) == 0:',
  '        return -1',
  '    m = tiempos[0]',
  '    for t in tiempos:',
  '        if t < m:',
  '            m = t',
  '    return m',
);
const SOL_P3 = py(
  'def al_reves(ids):',
  '    salida = []',
  '    for i in range(len(ids) - 1, -1, -1):',
  '        salida.append(ids[i])',
  '    return salida',
);
const SOL_P4 = py(
  'def suma_digitos(folio):',
  '    n = folio',
  '    s = 0',
  '    while n > 0:',
  '        s = s + n % 10',
  '        n = n // 10',
  '    return s',
);
const SOL_P5 = py(
  'def es_primo(n):',
  '    if n < 2:',
  '        return False',
  '    i = 2',
  '    while i * i <= n:',
  '        if n % i == 0:',
  '            return False',
  '        i = i + 1',
  '    return True',
);
const SOL_P6 = py(
  'def campeon(nombres, puntos):',
  '    mejor = 0',
  '    for i in range(len(puntos)):',
  '        if puntos[i] > puntos[mejor]:',
  '            mejor = i',
  '    return nombres[mejor]',
);
const SOL_P1_ROTA = py(
  'def avanzan(puntajes):',
  '    n = 0',
  '    for p in puntajes:',
  '        if p > 70:',
  '            n = n + 1',
  '    return n',
);
const CASO_QUE_SEPARA = py('def caso():', '    return [70]');
const CASO_QUE_NO_SEPARA = py('def caso():', '    return [90, 91]');

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  render(<LabProblemasDeConcurso config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />);

  const api = {
    onProgress,
    onScore,
    onComplete,
    entrar: () => {
      fireEvent.click(screen.getByTestId('pyc-empezar'));
      return api;
    },
    escribir: (texto: string) => fireEvent.change(screen.getByTestId('cod-area'), { target: { value: texto } }),
    enviar: () => fireEvent.click(screen.getByTestId('jz-enviar')),
    veredicto: () => screen.queryByTestId('jz-veredicto'),
    aceptado: () => screen.getByTestId('jz-veredicto').getAttribute('data-aceptado'),
    encargo: () => screen.getByTestId('cod-encargo').getAttribute('data-paso'),
    siguiente: () => fireEvent.click(screen.getByText('Siguiente encargo →')),
    solapa: (id: string) => screen.getByTestId(`jz-solapa-${id}`).getAttribute('data-estado'),
    pista: () => fireEvent.click(screen.getByTestId('jz-pista')),
    /** Resolver un problema y pasar al siguiente encargo. */
    resolver: (texto: string) => {
      api.escribir(texto);
      api.enviar();
      api.siguiente();
      return api;
    },
  };
  return api;
}

/* El tablero es de módulo: sin esto, una prueba le dejaría a la siguiente los
 * problemas aprobados. (Es la misma razón por la que el panel lo limpia al
 * montarse.) */
beforeEach(() => limpiarRegistro());

/* ── la portada ─────────────────────────────────────────────────────────────*/

describe('antes de entrar', () => {
  it('la portada dice de qué va el torneo y el editor no está detrás', () => {
    montar();
    expect(screen.getByText(/tu programa contra datos que no elegiste t/i)).toBeInTheDocument();
    expect(screen.getByText(/Finalista del torneo/)).toBeInTheDocument();
    expect(screen.queryByTestId('cod-area')).toBeNull();
    expect(screen.queryByTestId('jz-panel')).toBeNull();
  });

  it('el primer encargo es el primer problema, y el enunciado NO dice qué teclear', () => {
    const lab = montar().entrar();
    expect(lab.encargo()).toBe(P1.id);
    const encargo = screen.getByTestId('cod-encargo').textContent ?? '';
    expect(encargo).not.toMatch(/avanzan = |for p in|if p >=/);
  });
});

/* ── jugando mal ────────────────────────────────────────────────────────────*/

describe('jugando mal', () => {
  it('enviar sin escribir nada no aprueba y dice que la función no existe', () => {
    const lab = montar().entrar();
    lab.enviar();
    expect(lab.aceptado()).toBe('no');
    expect(screen.getByTestId('jz-veredicto').textContent).toMatch(/no la define con ese nombre/);
    expect(lab.encargo()).toBe(P1.id);
  });

  it('copiar la respuesta del ejemplo pasa un caso y ninguno más', () => {
    const lab = montar().entrar();
    lab.escribir(py('def avanzan(puntajes):', '    return 4'));
    lab.enviar();
    expect(lab.aceptado()).toBe('no');
    expect(screen.getByTestId('jz-veredicto').textContent).toMatch(/1 de 4 casos/);
    expect(lab.encargo()).toBe(P1.id);
  });

  it('el error del > por >= pasa TODO lo visible y lo tumba un caso oculto', () => {
    const lab = montar().entrar();
    lab.escribir(SOL_P1_ROTA);
    lab.enviar();
    expect(lab.aceptado()).toBe('no');

    const tablero = screen.getByTestId('jz-veredicto');
    /* Los dos visibles, en verde. */
    const visibles = tablero.querySelectorAll('[data-oculto="no"]');
    expect(visibles).toHaveLength(2);
    visibles.forEach((c) => expect(c.getAttribute('data-clase')).toBe('pasa'));
    /* Y el oculto que lo caza, en rojo. */
    const cazador = within(tablero).getByText('justo en el corte').closest('li');
    expect(cazador?.getAttribute('data-clase')).toBe('falla');
  });

  it('un caso oculto NO enseña sus datos en la pantalla', () => {
    const lab = montar().entrar();
    lab.escribir(SOL_P1_ROTA);
    lab.enviar();
    const tablero = screen.getByTestId('jz-veredicto');
    for (const li of Array.from(tablero.querySelectorAll('[data-oculto="si"]'))) {
      /* Ni la lista del caso, ni su respuesta, ni ningún número suelto. */
      expect(li.textContent ?? '').not.toMatch(/\d/);
      expect(li.querySelector('.jz-caso-cotejo')).toBeNull();
    }
    /* Y el panel entero tampoco: 69, 70 y 71 son del caso oculto. */
    expect(screen.getByTestId('jz-panel').textContent ?? '').not.toMatch(/\b69\b|\b71\b/);
  });

  it('las tres pistas se piden una a una y la tercera avisa de que cuesta ANTES', () => {
    const lab = montar().entrar();
    const boton = () => screen.getByTestId('jz-pista');
    expect(boton().textContent).toBe('Pedir la pista 1');
    lab.pista();
    expect(screen.getByText(P1.pistas[0])).toBeInTheDocument();
    expect(boton().textContent).toBe('Pedir la pista 2');
    lab.pista();
    expect(boton().textContent).toMatch(/cuesta puntos/);
    lab.pista();
    expect(screen.getByText(P1.pistas[2])).toBeInTheDocument();
    expect(screen.queryByTestId('jz-pista')).toBeNull();
  });

  it('un bucle infinito da «no termina», no cuelga la prueba y no es un error', () => {
    const lab = montar().entrar();
    lab.escribir(py('def avanzan(puntajes):', '    while True:', '        n = 1'));
    lab.enviar();
    const primero = screen.getByTestId('jz-veredicto').querySelector('.jz-caso');
    expect(primero?.getAttribute('data-clase')).toBe('no-termina');
  });

  it('el panel del encargo final no existe hasta ganar el torneo', () => {
    const lab = montar().entrar();
    expect(screen.queryByTestId('pdc-roto')).toBeNull();
    lab.resolver(SOL_P1);
    expect(screen.queryByTestId('pdc-roto')).toBeNull();
  });
});

/* ── el recorrido entero ────────────────────────────────────────────────────*/

describe('el torneo, de la portada a la insignia', () => {
  it('seis problemas, el caso que rompe y la reflexión final', () => {
    const lab = montar().entrar();

    /* Los seis, uno encima de otro en el mismo archivo: así es como lo hará un
     * alumno, y así se comprueba que resolver el 2 no rompe el 1. */
    const acumulado: string[] = [];
    const paso = (sol: string, id: string) => {
      acumulado.push(sol);
      lab.escribir(acumulado.join('\n\n'));
      lab.enviar();
      expect(lab.aceptado()).toBe('si');
      expect(lab.solapa(id)).toBe('aceptado');
      lab.siguiente();
    };

    paso(SOL_P1, P1.id);
    paso(SOL_P2, P2.id);
    paso(SOL_P3, P3.id);
    paso(SOL_P4, P4.id);
    paso(SOL_P5, P5.id);
    paso(SOL_P6, P6.id);

    /* Ganado el torneo, aparece el encargo final. */
    expect(lab.encargo()).toBe('el-caso-que-rompe');
    const roto = screen.getByTestId('pdc-roto');
    expect(roto.textContent).toMatch(/no contesten lo mismo/);

    /* Un caso que no separa nada: el panel lo dice y el encargo no se cierra. */
    lab.escribir([...acumulado, CASO_QUE_NO_SEPARA].join('\n\n'));
    fireEvent.click(screen.getByTestId('pdc-probar'));
    expect(screen.getByTestId('pdc-veredicto-roto').getAttribute('data-separa')).toBe('no');
    expect(lab.encargo()).toBe('el-caso-que-rompe');

    /* Romper la propia solución para «separarlas» tampoco vale. */
    lab.escribir(
      [SOL_P1_ROTA, SOL_P2, SOL_P3, SOL_P4, SOL_P5, SOL_P6, py('def caso():', '    return [70]')].join('\n\n'),
    );
    fireEvent.click(screen.getByTestId('pdc-probar'));
    expect(screen.getByTestId('pdc-veredicto-roto').getAttribute('data-separa')).toBe('no');
    expect(screen.getByTestId('pdc-veredicto-roto').textContent).toMatch(/ya no pasa el problema 1/);
    expect(lab.encargo()).toBe('el-caso-que-rompe');

    /* Y el caso que sí separa. */
    lab.escribir([...acumulado, CASO_QUE_SEPARA].join('\n\n'));
    fireEvent.click(screen.getByTestId('pdc-probar'));
    expect(screen.getByTestId('pdc-veredicto-roto').getAttribute('data-separa')).toBe('si');
    lab.siguiente();

    /* La única pregunta de opción de toda la clase, y va al final. */
    expect(lab.encargo()).toBe('por-que-ocultos');
    fireEvent.click(screen.getByText(/más difícil y dure más tiempo/));
    expect(lab.encargo()).toBe('por-que-ocultos');
    fireEvent.click(screen.getByText(/no se pueda aprobar escribiendo la respuesta del ejemplo/));

    expect(lab.onComplete).toHaveBeenCalled();
    expect(screen.getByText(/Torneo cerrado/)).toBeInTheDocument();
  }, 60_000);
});
