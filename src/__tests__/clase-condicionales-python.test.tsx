/**
 * N7 · «Condicionales» — el banco de la clase.
 *
 * Jugando mal: tocar la línea con candado, dejar una banda de elif sin
 * corregir, y sobre todo el clímax de la clase — provocar de verdad el único
 * error que este intérprete explica en vez de sólo señalar
 * (`120 <= altura <= 150`, la comparación encadenada) y comprobar que se
 * detecta como `SyntaxError`, no como un error cualquiera, y que arreglarlo
 * con `and` no resta puntos. También la pregunta final sobre un `elif` mal
 * ordenado, que responde mal SIN reventar. Y un recorrido entero, de la
 * portada a la insignia.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { LabCondicionales } from '@/components/activities/python/LabCondicionales';

const CABEZA = [
  '# acceso.py · el programa decide, tú no',
  'print("La Serpiente: la montaña rusa del parque.")',
  '',
  '# ↓ de aquí para abajo escribes tú',
].join('\n');

const archivo = (...mias: string[]) => [CABEZA, ...mias].join('\n');

const SI_ALCANZA = ['altura = 130', 'if altura >= 120:', '    print("Sí llegas a la altura mínima.")', 'else:', '    print("Todavía no llegas.")'];
const TRES_CAMINOS = [
  'if altura < 120:',
  '    print("No puedes subir todavía.")',
  'elif altura < 150:',
  '    print("Subes acompañado de un adulto.")',
  'else:',
  '    print("Subes tú solo.")',
];
const EL_BOLETO = ['boleto = "vip"', 'if boleto == "vip":', '    print("Pase VIP: sin fila.")', 'else:', '    print("Formas fila normal.")'];
const NO_ES_IGUAL = ['if boleto != "vip":', '    print("Formas fila normal.")', 'else:', '    print("Pase VIP: sin fila.")'];
const Y_EL_VIP = ['if altura >= 120 and boleto == "vip":', '    print("Acceso VIP: subes ya.")', 'else:', '    print("Pasas por la fila normal.")'];
const O_EL_CUMPLE = [
  'edad = 8',
  'es_cumpleanos = True',
  'if edad < 5 or es_cumpleanos:',
  '    print("Entrada gratis hoy.")',
  'else:',
  '    print("Entrada normal.")',
];
const ENTRE_DOS_ROTO = ['if 120 <= altura <= 150:', '    print("Estás en el rango de acompañado.")'];
const ENTRE_DOS_OK = ['if altura >= 120 and altura <= 150:', '    print("Estás en el rango de acompañado.")'];

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
    expect(screen.getByText('Condicionales: que tu programa decida')).toBeInTheDocument();
    expect(screen.getByText('Insignia · Tu programa ya decide')).toBeInTheDocument();
    expect(screen.queryByTestId('cod-area')).toBeNull();
    lab.entrar();
    expect(lab.encargo()).toBe('si-alcanza');
  });
});

describe('el Semáforo, el panel de esta clase', () => {
  it('empieza vacío, antes del primer if', () => {
    montar().entrar();
    expect(screen.getByTestId('cod-panel').textContent).toContain('Semáforo');
    expect(screen.getByTestId('cod-panel').textContent).toContain('Todavía no has escrito ningún if');
  });

  it('marca qué camino se tomó, y cuáles no, en la última corrida', () => {
    const lab = montar().entrar();
    lab.escribir(archivo(...SI_ALCANZA, ...TRES_CAMINOS));
    lab.ejecutar();
    const semaforo = screen.getByTestId('pyc-semaforo');
    // altura = 130 cae en la banda de en medio: elif altura < 150.
    const filas = semaforo.querySelectorAll('[data-tomada]');
    const tomadas = Array.from(filas).filter((f) => f.getAttribute('data-tomada') === 'si');
    // Dos ramas tomadas: el if/else del primer encargo (altura >= 120) y el
    // elif de en medio del segundo bloque.
    expect(tomadas.length).toBe(2);
    expect(semaforo.textContent).toContain('elif altura < 150');
  });
});

describe('jugando mal a propósito', () => {
  it('la línea del print de bienvenida tiene candado', () => {
    const lab = montar().entrar();
    lab.escribir(archivo(...SI_ALCANZA).replace('parque.")', 'parque, de verdad.")'));
    expect(lab.area().value).toContain('La Serpiente: la montaña rusa del parque.');
    expect(screen.getByTestId('cod-aviso').textContent).toContain('candado');
  });

  it('escribir el elif en el orden equivocado no cierra el encargo (da la respuesta que no toca)', () => {
    const lab = montar().entrar();
    lab.escribir(archivo(...SI_ALCANZA));
    lab.ejecutar();
    lab.siguiente();
    expect(lab.encargo()).toBe('tres-caminos');

    // Orden al revés: la condición ancha (<150) va antes que la específica
    // (<120). Con altura = 130 el resultado final es el mismo por casualidad,
    // pero el TEXTO fuente no calza con lo que pide el encargo.
    const AL_REVES = [
      'if altura < 150:',
      '    print("Subes acompañado de un adulto.")',
      'elif altura < 120:',
      '    print("No puedes subir todavía.")',
      'else:',
      '    print("Subes tú solo.")',
    ];
    lab.escribir(archivo(...SI_ALCANZA, ...AL_REVES));
    lab.ejecutar();
    expect(lab.fase()).toBe('terminada');
    expect(lab.logrado()).toBeNull();

    lab.escribir(archivo(...SI_ALCANZA, ...TRES_CAMINOS));
    lab.ejecutar();
    expect(lab.logrado()).not.toBeNull();
  });

  it('el clímax: la comparación encadenada se detecta como SyntaxError explicado, y arreglarla con and NO resta puntos', () => {
    const lab = montar().entrar();
    lab.escribir(archivo(...SI_ALCANZA));
    lab.ejecutar();
    lab.siguiente();
    lab.escribir(archivo(...SI_ALCANZA, ...TRES_CAMINOS));
    lab.ejecutar();
    lab.siguiente();
    lab.escribir(archivo(...SI_ALCANZA, ...TRES_CAMINOS, ...EL_BOLETO));
    lab.ejecutar();
    lab.siguiente();
    lab.escribir(archivo(...SI_ALCANZA, ...TRES_CAMINOS, ...EL_BOLETO, ...NO_ES_IGUAL));
    lab.ejecutar();
    lab.siguiente();
    lab.escribir(archivo(...SI_ALCANZA, ...TRES_CAMINOS, ...EL_BOLETO, ...NO_ES_IGUAL, ...Y_EL_VIP));
    lab.ejecutar();
    lab.siguiente();
    lab.escribir(archivo(...SI_ALCANZA, ...TRES_CAMINOS, ...EL_BOLETO, ...NO_ES_IGUAL, ...Y_EL_VIP, ...O_EL_CUMPLE));
    lab.ejecutar();
    lab.siguiente();
    expect(lab.encargo()).toBe('entre-dos');

    lab.escribir(archivo(...SI_ALCANZA, ...TRES_CAMINOS, ...EL_BOLETO, ...NO_ES_IGUAL, ...Y_EL_VIP, ...O_EL_CUMPLE, ...ENTRE_DOS_ROTO));
    lab.ejecutar();
    expect(lab.fase()).toBe('error');
    expect(screen.getByTestId('cod-error').textContent).toContain('SyntaxError');
    expect((screen.getByTestId('cod-error').textContent ?? '').toLowerCase()).toContain('encadenar');
    expect(lab.logrado()).not.toBeNull();
    /* Provocarlo es el temario, no una falta: el marcador no debe bajar. */
    expect(lab.onScore).not.toHaveBeenCalled();

    lab.siguiente();
    expect(lab.encargo()).toBe('arreglalo');
    lab.escribir(archivo(...SI_ALCANZA, ...TRES_CAMINOS, ...EL_BOLETO, ...NO_ES_IGUAL, ...Y_EL_VIP, ...O_EL_CUMPLE, ...ENTRE_DOS_OK));
    lab.ejecutar();
    expect(lab.fase()).toBe('terminada');
    expect(lab.logrado()).not.toBeNull();
  });

  it('fallar la pregunta final resta seis puntos y no la da por buena', () => {
    const lab = montar().entrar();
    const pasos = [
      [...SI_ALCANZA],
      [...SI_ALCANZA, ...TRES_CAMINOS],
      [...SI_ALCANZA, ...TRES_CAMINOS, ...EL_BOLETO],
      [...SI_ALCANZA, ...TRES_CAMINOS, ...EL_BOLETO, ...NO_ES_IGUAL],
      [...SI_ALCANZA, ...TRES_CAMINOS, ...EL_BOLETO, ...NO_ES_IGUAL, ...Y_EL_VIP],
      [...SI_ALCANZA, ...TRES_CAMINOS, ...EL_BOLETO, ...NO_ES_IGUAL, ...Y_EL_VIP, ...O_EL_CUMPLE],
      [...SI_ALCANZA, ...TRES_CAMINOS, ...EL_BOLETO, ...NO_ES_IGUAL, ...Y_EL_VIP, ...O_EL_CUMPLE, ...ENTRE_DOS_ROTO],
      [...SI_ALCANZA, ...TRES_CAMINOS, ...EL_BOLETO, ...NO_ES_IGUAL, ...Y_EL_VIP, ...O_EL_CUMPLE, ...ENTRE_DOS_OK],
    ];
    for (const lineas of pasos) {
      lab.escribir(archivo(...lineas));
      lab.ejecutar();
      lab.siguiente();
    }
    expect(lab.encargo()).toBe('el-orden-importa');

    fireEvent.click(screen.getByText('"no todavía", porque 90 es menor que 120', { selector: 'button' }));
    expect(lab.logrado()).toBeNull();
    expect(lab.onScore).toHaveBeenLastCalledWith(94);
    expect(lab.onComplete).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByText('"acompañado", porque 90 < 150 es la primera condición y ya es cierta', { selector: 'button' }),
    );
    expect(lab.onComplete.mock.calls[0][0]).toMatchObject({ score: 94, stars: 3 });
  });
});

describe('el recorrido de punta a punta, como un alumno', () => {
  it('los nueve encargos, en orden, hasta la pantalla de cierre con su insignia', () => {
    const lab = montar().entrar();

    // 1 · si alcanza, sube
    expect(lab.encargo()).toBe('si-alcanza');
    lab.escribir(archivo(...SI_ALCANZA));
    lab.ejecutar();
    expect(lab.salida()).toContain('Sí llegas a la altura mínima.');
    lab.siguiente();

    // 2 · más de dos caminos
    expect(lab.encargo()).toBe('tres-caminos');
    lab.escribir(archivo(...SI_ALCANZA, ...TRES_CAMINOS));
    lab.ejecutar();
    expect(lab.salida()).toContain('Subes acompañado de un adulto.');
    lab.siguiente();

    // 3 · ¿son iguales?
    expect(lab.encargo()).toBe('el-boleto');
    lab.escribir(archivo(...SI_ALCANZA, ...TRES_CAMINOS, ...EL_BOLETO));
    lab.ejecutar();
    expect(lab.salida()).toContain('Pase VIP: sin fila.');
    lab.siguiente();

    // 4 · la pregunta al revés
    expect(lab.encargo()).toBe('no-es-igual');
    lab.escribir(archivo(...SI_ALCANZA, ...TRES_CAMINOS, ...EL_BOLETO, ...NO_ES_IGUAL));
    lab.ejecutar();
    expect(lab.fase()).toBe('terminada');
    lab.siguiente();

    // 5 · las dos cosas a la vez
    expect(lab.encargo()).toBe('y-el-vip');
    lab.escribir(archivo(...SI_ALCANZA, ...TRES_CAMINOS, ...EL_BOLETO, ...NO_ES_IGUAL, ...Y_EL_VIP));
    lab.ejecutar();
    expect(lab.salida()).toContain('Acceso VIP: subes ya.');
    lab.siguiente();

    // 6 · con que una alcance
    expect(lab.encargo()).toBe('o-el-cumple');
    lab.escribir(archivo(...SI_ALCANZA, ...TRES_CAMINOS, ...EL_BOLETO, ...NO_ES_IGUAL, ...Y_EL_VIP, ...O_EL_CUMPLE));
    lab.ejecutar();
    expect(lab.salida()).toContain('Entrada gratis hoy.');
    lab.siguiente();

    // 7 · provócalo: la forma que Python no deja escribir
    expect(lab.encargo()).toBe('entre-dos');
    lab.escribir(archivo(...SI_ALCANZA, ...TRES_CAMINOS, ...EL_BOLETO, ...NO_ES_IGUAL, ...Y_EL_VIP, ...O_EL_CUMPLE, ...ENTRE_DOS_ROTO));
    lab.ejecutar();
    expect(lab.fase()).toBe('error');
    lab.siguiente();

    // 8 · arréglalo
    expect(lab.encargo()).toBe('arreglalo');
    lab.escribir(archivo(...SI_ALCANZA, ...TRES_CAMINOS, ...EL_BOLETO, ...NO_ES_IGUAL, ...Y_EL_VIP, ...O_EL_CUMPLE, ...ENTRE_DOS_OK));
    lab.ejecutar();
    expect(lab.fase()).toBe('terminada');
    lab.siguiente();

    // 9 · el elif que responde mal sin avisar
    expect(lab.encargo()).toBe('el-orden-importa');
    fireEvent.click(
      screen.getByText('"acompañado", porque 90 < 150 es la primera condición y ya es cierta', { selector: 'button' }),
    );

    expect(screen.getByText('Tu programa ya decide')).toBeInTheDocument();
    expect(screen.getByText('Insignia · Tu programa ya decide')).toBeInTheDocument();
    expect(lab.onProgress).toHaveBeenLastCalledWith(1);
    expect(lab.onComplete).toHaveBeenCalledTimes(1);
    expect(lab.onComplete.mock.calls[0][0]).toMatchObject({ score: 100, stars: 3 });
  });
});
