/**
 * N7 · «Bucles» — el banco de la clase.
 *
 * Jugando mal: tocar la línea con candado, dejar el rango de range() sin
 * corregir, y sobre todo el clímax de la clase — provocar el bucle infinito
 * de verdad y comprobar que el editor se detiene solo, sin colgar la prueba,
 * y que eso NO resta puntos (igual que romper el programa en las dos clases
 * hermanas). También que `break` no se confunde con «romper el programa»: el
 * programa sigue en `fase: 'terminada'`, no en `'error'`. Y un recorrido
 * entero, de la portada a la insignia.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { LabBucles } from '@/components/activities/python/LabBucles';

const CABEZA = [
  '# bucles.py · repetir sin escribirlo dos veces',
  'print("Vamos a repetir instrucciones sin copiarlas y pegarlas.")',
  '',
  '# ↓ de aquí para abajo escribes tú',
].join('\n');

const archivo = (...mias: string[]) => [CABEZA, ...mias].join('\n');

const PARA_5 = ['for i in range(5):', '    print(i)'];
const PARA_1_6 = ['for i in range(1, 6):', '    print(i)'];
const TABLA_7 = ['for i in range(1, 11):', '    print(i, "x 7 =", i * 7)'];
const ACUMULADOR = ['total = 0', 'for i in range(1, 11):', '    total = total + i', 'print(total)'];
const CUENTA_OK = [
  'contador = 5',
  'while contador > 0:',
  '    print(contador)',
  '    contador = contador - 1',
  'print("¡Despegue!")',
];
const CUENTA_ROTA = ['contador = 5', 'while contador > 0:', '    print(contador)', 'print("¡Despegue!")'];
const BREAK_BLOQUE = [
  'numeros = [4, 8, 15, 16, 23, 42]',
  'for n in numeros:',
  '    if n > 20:',
  '        print("Encontré uno mayor que 20:", n)',
  '        break',
];

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
    fase: () => screen.getByTestId('cod').getAttribute('data-fase'),
    escribir: (texto: string) => fireEvent.change(screen.getByTestId('cod-area'), { target: { value: texto } }),
    ejecutar: () => fireEvent.click(screen.getByTestId('cod-ejecutar')),
    encargo: () => screen.getByTestId('cod-encargo').getAttribute('data-paso'),
    logrado: () => screen.queryByTestId('cod-logrado'),
    siguiente: () => fireEvent.click(screen.getByText('Siguiente encargo →')),
  };
  return api;
}

describe('antes de entrar', () => {
  it('la portada dice el tema, el objetivo y la insignia, y el editor no está detrás', () => {
    const lab = montar();
    expect(screen.getByText('Bucles: repetir sin copiar y pegar')).toBeInTheDocument();
    expect(screen.getByText('Insignia · Sobreviviste al bucle infinito')).toBeInTheDocument();
    expect(screen.queryByTestId('cod-area')).toBeNull();
    lab.entrar();
    expect(lab.encargo()).toBe('cinco-vueltas');
  });
});

describe('el Cuentapasos, el panel de esta clase', () => {
  it('convive con el panel de variables del armazón, sin sustituirlo', () => {
    montar().entrar();
    expect(screen.getByTestId('cod-panel').textContent).toContain('Cuentapasos');
    expect(screen.getByTestId('cod-panel').textContent).toContain('Ejecuta el programa');
    /* A diferencia de la Mesa de tipos, aquí el panel de variables del armazón
     * sigue en pantalla: ver crecer «total» o «contador» caja por caja
     * importa tanto como ver crecer el número de pasos. */
    expect(screen.queryByTestId('cod-variables')).not.toBeNull();
  });

  it('muestra el número de pasos en cuanto el programa corre', () => {
    const lab = montar().entrar();
    lab.escribir(archivo(...PARA_5));
    lab.ejecutar();
    expect(screen.getByTestId('pyc-cuentapasos').textContent).toContain('pasos');
  });
});

describe('jugando mal a propósito', () => {
  it('la línea del print de bienvenida tiene candado', () => {
    const lab = montar().entrar();
    lab.escribir(archivo(...PARA_5).replace('pegarlas.")', 'pegarlas otra vez.")'));
    expect(lab.area().value).toContain('Vamos a repetir instrucciones sin copiarlas y pegarlas.');
    expect(screen.getByTestId('cod-aviso').textContent).toContain('candado');
  });

  it('dejar range(5) sin corregir no cierra el segundo encargo', () => {
    const lab = montar().entrar();
    lab.escribir(archivo(...PARA_5));
    lab.ejecutar();
    lab.siguiente();
    expect(lab.encargo()).toBe('desde-donde-hasta-donde');

    /* No tocó el rango: sigue siendo range(5), que ya no vale para este
     * encargo aunque el programa corra sin error. */
    lab.escribir(archivo(...PARA_5));
    lab.ejecutar();
    expect(lab.fase()).toBe('terminada');
    expect(lab.logrado()).toBeNull();

    lab.escribir(archivo(...PARA_1_6));
    lab.ejecutar();
    expect(lab.logrado()).not.toBeNull();
  });

  it('el clímax: provocar el bucle infinito de verdad, y que NO reste puntos', () => {
    const lab = montar().entrar();
    lab.escribir(archivo(...PARA_5));
    lab.ejecutar();
    lab.siguiente();
    lab.escribir(archivo(...PARA_1_6));
    lab.ejecutar();
    lab.siguiente();
    lab.escribir(archivo(...PARA_1_6, ...TABLA_7));
    lab.ejecutar();
    lab.siguiente();
    lab.escribir(archivo(...PARA_1_6, ...TABLA_7, ...ACUMULADOR));
    lab.ejecutar();
    lab.siguiente();
    lab.escribir(archivo(...PARA_1_6, ...TABLA_7, ...ACUMULADOR, ...CUENTA_OK));
    lab.ejecutar();
    lab.siguiente();
    expect(lab.encargo()).toBe('bucle-infinito');

    lab.escribir(archivo(...PARA_1_6, ...TABLA_7, ...ACUMULADOR, ...CUENTA_ROTA));
    lab.ejecutar();
    expect(lab.fase()).toBe('error');
    expect(screen.getByTestId('cod-error').textContent).toContain('LimiteError');
    expect(screen.getByTestId('pyc-cuentapasos').textContent).toContain('se detuvo solo');
    expect(lab.logrado()).not.toBeNull();
    /* Provocarlo es el temario, no una falta: el marcador no debe bajar. */
    expect(lab.onScore).not.toHaveBeenCalled();

    lab.siguiente();
    expect(lab.encargo()).toBe('arreglalo');
    lab.escribir(archivo(...PARA_1_6, ...TABLA_7, ...ACUMULADOR, ...CUENTA_OK));
    lab.ejecutar();
    expect(lab.fase()).toBe('terminada');
    expect(lab.logrado()).not.toBeNull();
  });

  it('break no es lo mismo que romper el programa: termina, no truena', () => {
    const lab = montar().entrar();
    lab.escribir(archivo(...PARA_1_6, ...TABLA_7, ...ACUMULADOR, ...CUENTA_OK, ...BREAK_BLOQUE));
    lab.ejecutar();
    expect(lab.fase()).toBe('terminada');
    expect(lab.salida()).toContain('Encontré uno mayor que 20: 23');
    /* break cortó en el 23, el primero mayor que 20: nunca llegó a revisar el
     * 42 de la lista (el «42» de la tabla del 7 sí puede seguir en pantalla). */
    expect(lab.salida()).not.toContain('Encontré uno mayor que 20: 42');
    expect(screen.queryByTestId('cod-error')).toBeNull();
  });

  it('fallar la pregunta final resta seis puntos y no la da por buena', () => {
    const lab = montar().entrar();
    const pasos = [
      [...PARA_5],
      [...PARA_1_6],
      [...PARA_1_6, ...TABLA_7],
      [...PARA_1_6, ...TABLA_7, ...ACUMULADOR],
      [...PARA_1_6, ...TABLA_7, ...ACUMULADOR, ...CUENTA_OK],
      [...PARA_1_6, ...TABLA_7, ...ACUMULADOR, ...CUENTA_ROTA],
      [...PARA_1_6, ...TABLA_7, ...ACUMULADOR, ...CUENTA_OK],
      [...PARA_1_6, ...TABLA_7, ...ACUMULADOR, ...CUENTA_OK, ...BREAK_BLOQUE],
    ];
    for (const lineas of pasos) {
      lab.escribir(archivo(...lineas));
      lab.ejecutar();
      lab.siguiente();
    }
    expect(lab.encargo()).toBe('nunca-termina');

    fireEvent.click(screen.getByText('Un for que recorre range(10)', { selector: 'button' }));
    expect(lab.logrado()).toBeNull();
    expect(lab.onScore).toHaveBeenLastCalledWith(94);
    expect(lab.onComplete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Un while cuya condición nunca cambia de valor', { selector: 'button' }));
    expect(lab.onComplete.mock.calls[0][0]).toMatchObject({ score: 94, stars: 3 });
  });
});

describe('el recorrido de punta a punta, como un alumno', () => {
  it('los nueve encargos, en orden, hasta la pantalla de cierre con su insignia', () => {
    const lab = montar().entrar();

    // 1 · el bucle que no se cansa
    expect(lab.encargo()).toBe('cinco-vueltas');
    lab.escribir(archivo(...PARA_5));
    lab.ejecutar();
    expect(lab.salida()).toContain('4');
    lab.siguiente();

    // 2 · dónde empieza y dónde para
    expect(lab.encargo()).toBe('desde-donde-hasta-donde');
    lab.escribir(archivo(...PARA_1_6));
    lab.ejecutar();
    expect(lab.salida()).toContain('5');
    lab.siguiente();

    // 3 · la tabla del 7
    expect(lab.encargo()).toBe('tabla-del-7');
    lab.escribir(archivo(...PARA_1_6, ...TABLA_7));
    lab.ejecutar();
    expect(lab.salida()).toContain('7 x 7 = 49');
    lab.siguiente();

    // 4 · el acumulador
    expect(lab.encargo()).toBe('el-acumulador');
    lab.escribir(archivo(...PARA_1_6, ...TABLA_7, ...ACUMULADOR));
    lab.ejecutar();
    expect(lab.salida()).toContain('55');
    lab.siguiente();

    // 5 · cuenta regresiva
    expect(lab.encargo()).toBe('cuenta-regresiva');
    lab.escribir(archivo(...PARA_1_6, ...TABLA_7, ...ACUMULADOR, ...CUENTA_OK));
    lab.ejecutar();
    expect(lab.salida()).toContain('¡Despegue!');
    lab.siguiente();

    // 6 · provócalo: el bucle infinito
    expect(lab.encargo()).toBe('bucle-infinito');
    lab.escribir(archivo(...PARA_1_6, ...TABLA_7, ...ACUMULADOR, ...CUENTA_ROTA));
    lab.ejecutar();
    expect(lab.fase()).toBe('error');
    lab.siguiente();

    // 7 · arréglalo
    expect(lab.encargo()).toBe('arreglalo');
    lab.escribir(archivo(...PARA_1_6, ...TABLA_7, ...ACUMULADOR, ...CUENTA_OK));
    lab.ejecutar();
    expect(lab.fase()).toBe('terminada');
    lab.siguiente();

    // 8 · sal del bucle antes de tiempo
    expect(lab.encargo()).toBe('sal-a-tiempo');
    lab.escribir(archivo(...PARA_1_6, ...TABLA_7, ...ACUMULADOR, ...CUENTA_OK, ...BREAK_BLOQUE));
    lab.ejecutar();
    expect(lab.salida()).toContain('Encontré uno mayor que 20: 23');
    lab.siguiente();

    // 9 · el que nunca termina solo
    expect(lab.encargo()).toBe('nunca-termina');
    fireEvent.click(screen.getByText('Un while cuya condición nunca cambia de valor', { selector: 'button' }));

    expect(screen.getByText('Sobreviviste al bucle infinito')).toBeInTheDocument();
    expect(screen.getByText('Insignia · Sobreviviste al bucle infinito')).toBeInTheDocument();
    expect(lab.onProgress).toHaveBeenLastCalledWith(1);
    expect(lab.onComplete).toHaveBeenCalledTimes(1);
    expect(lab.onComplete.mock.calls[0][0]).toMatchObject({ score: 100, stars: 3 });
  });
});
