/**
 * N7 · «Retos guiados» — el banco de la clase de cierre de la unidad.
 *
 * Tres programas completos en un solo archivo. Lo propio de esta clase, que
 * sus cuatro hermanas no tenían: el Reto 3 se escribe primero SIN `break`
 * (encargo 7), se comprueba que un acierto no basta para detener el `while`
 * —el programa sigue preguntando, sin escribir ni una línea (encargo 8)— y
 * sólo entonces se arregla (encargo 9). Más lo de siempre: candados, un total
 * que no da 100 en el Reto 1, y el recorrido entero hasta la insignia.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { LabRetosPython } from '@/components/activities/python/LabRetosPython';

const CABEZA = [
  '# retos.py · tres programas completos, uno detrás de otro',
  'print("Cierras la unidad: tres retos, cada uno un programa completo.")',
  '',
  '# ↓ de aquí para abajo escribes tú',
].join('\n');

const archivo = (...mias: string[]) => [CABEZA, ...mias].join('\n');

const RETO1_DATOS = [
  'print("--- Reto 1: El precio justo ---")',
  'producto = input("¿Qué compras? ")',
  'precio = float(input("Precio unitario: "))',
  'cantidad = int(input("¿Cuántas piezas? "))',
  'total = precio * cantidad',
  'print("Total antes de descuento:", total)',
];

const RETO1_DESCUENTO = [
  'if total >= 100:',
  '    descuento = total * 0.1',
  'elif total >= 50:',
  '    descuento = total * 0.05',
  'else:',
  '    descuento = 0',
  'print("Descuento:", descuento)',
];

const RETO1_CIERRA = [
  'total_final = total - descuento',
  'print(f"Pagas ${total_final} por {cantidad} de {producto}.")',
  'print("--- Fin Reto 1 ---")',
];

const RETO2_CUENTA = [
  'print("--- Reto 2: El conteo de aprobados ---")',
  'calificaciones = [8, 5, 9, 3, 10, 6, 7, 8]',
  'aprobados = 0',
  'suma = 0',
  'for c in calificaciones:',
  '    suma = suma + c',
  '    if c >= 6:',
  '        aprobados = aprobados + 1',
  'print("Aprobados:", aprobados, "de", len(calificaciones))',
];

const RETO2_PROMEDIO = [
  'promedio = suma / len(calificaciones)',
  'if promedio >= 8:',
  '    print(f"Grupo excelente: promedio {promedio}")',
  'elif promedio >= 6:',
  '    print(f"Grupo aprobado: promedio {promedio}")',
  'else:',
  '    print(f"Grupo en riesgo: promedio {promedio}")',
];

const RETO2_CIERRA = ['reprobados = len(calificaciones) - aprobados', 'print("Reprobados:", reprobados)', 'print("--- Fin Reto 2 ---")'];

const RETO3_CANDADO = [
  'print("--- Reto 3: El candado del casillero ---")',
  'codigo_secreto = 47',
  'intentos = 3',
  'while intentos > 0:',
  '    intento = int(input("Código de 2 cifras: "))',
  '    if intento == codigo_secreto:',
  '        print("¡Casillero abierto!")',
  '    else:',
  '        intentos = intentos - 1',
  '        print("Código incorrecto. Intentos restantes:", intentos)',
];

const RETO3_FIX = [
  'print("--- Reto 3: El candado del casillero ---")',
  'codigo_secreto = 47',
  'intentos = 3',
  'abierto = False',
  'while intentos > 0 and abierto == False:',
  '    intento = int(input("Código de 2 cifras: "))',
  '    if intento == codigo_secreto:',
  '        print("¡Casillero abierto!")',
  '        abierto = True',
  '        break',
  '    else:',
  '        intentos = intentos - 1',
  '        print("Código incorrecto. Intentos restantes:", intentos)',
  'if abierto == False:',
  '    print("Se acabaron los intentos. Casillero bloqueado.")',
  'print("--- Fin Reto 3 ---")',
];

/**
 * Las tres respuestas del Reto 1. El archivo es UNO SOLO: cada ejecución
 * vuelve a correr desde la línea 1, así que cualquier encargo del Reto 2 o el
 * Reto 3 tiene que volver a contestar estas tres antes de llegar a lo suyo —
 * el mismo trato que ya tenía `n7-entrada-y-salida` con sus respuestas
 * acumuladas de un encargo al siguiente.
 */
const RETO1_OK = ['libreta', '20', '5'];

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  render(<LabRetosPython config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />);

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
    /** Contestar en la consola, que es lo que hace el alumno de verdad. */
    contestar: (respuesta: string) => {
      fireEvent.change(screen.getByTestId('cod-entrada'), { target: { value: respuesta } });
      fireEvent.click(screen.getByTestId('cod-responder'));
    },
    encargo: () => screen.getByTestId('cod-encargo').getAttribute('data-paso'),
    logrado: () => screen.queryByTestId('cod-logrado'),
    siguiente: () => fireEvent.click(screen.getByText('Siguiente encargo →')),
    reto: (numero: number) => document.querySelector(`[data-reto="${numero}"]`),
  };
  return api;
}

/** Ejecuta y contesta, en orden, todo lo que el programa vaya preguntando. */
function correrContestando(lab: ReturnType<typeof montar>, ...respuestas: string[]) {
  lab.ejecutar();
  for (const r of respuestas) {
    if (!screen.queryByTestId('cod-entrada')) return;
    lab.contestar(r);
  }
}

/** Los seis primeros encargos —Reto 1 y Reto 2—, jugados bien. */
function llegarAReto3(lab: ReturnType<typeof montar>) {
  lab.escribir(archivo(...RETO1_DATOS));
  correrContestando(lab, ...RETO1_OK);
  lab.siguiente();
  lab.escribir(archivo(...RETO1_DATOS, ...RETO1_DESCUENTO));
  correrContestando(lab, ...RETO1_OK);
  lab.siguiente();
  lab.escribir(archivo(...RETO1_DATOS, ...RETO1_DESCUENTO, ...RETO1_CIERRA));
  correrContestando(lab, ...RETO1_OK);
  lab.siguiente();
  /* El Reto 2 no agrega ningún input propio, pero el archivo sigue siendo
   * uno solo: hay que volver a contestar las tres preguntas del Reto 1 antes
   * de que la ejecución llegue a esta parte. */
  lab.escribir(archivo(...RETO1_DATOS, ...RETO1_DESCUENTO, ...RETO1_CIERRA, ...RETO2_CUENTA));
  correrContestando(lab, ...RETO1_OK);
  lab.siguiente();
  lab.escribir(archivo(...RETO1_DATOS, ...RETO1_DESCUENTO, ...RETO1_CIERRA, ...RETO2_CUENTA, ...RETO2_PROMEDIO));
  correrContestando(lab, ...RETO1_OK);
  lab.siguiente();
  lab.escribir(archivo(...RETO1_DATOS, ...RETO1_DESCUENTO, ...RETO1_CIERRA, ...RETO2_CUENTA, ...RETO2_PROMEDIO, ...RETO2_CIERRA));
  correrContestando(lab, ...RETO1_OK);
  lab.siguiente();
}

/** Los nueve primeros encargos, jugados bien, hasta la pregunta final. */
function llegarAlUltimoEncargo(lab: ReturnType<typeof montar>) {
  llegarAReto3(lab);
  lab.escribir(
    archivo(...RETO1_DATOS, ...RETO1_DESCUENTO, ...RETO1_CIERRA, ...RETO2_CUENTA, ...RETO2_PROMEDIO, ...RETO2_CIERRA, ...RETO3_CANDADO),
  );
  correrContestando(lab, ...RETO1_OK, '10', '20', '30');
  lab.siguiente();
  /* Encargo 8: acierta a la primera y luego sigue contestando hasta que los
   * intentos se acaban solos —el programa nunca se detuvo por el acierto—.
   * intentos no bajó en el acierto (sigue en 3), así que hacen falta TRES
   * respuestas más para agotarlo: 3 → 2 → 1 → 0. */
  correrContestando(lab, ...RETO1_OK, '47', '1', '2', '3');
  lab.siguiente();
  lab.escribir(
    archivo(...RETO1_DATOS, ...RETO1_DESCUENTO, ...RETO1_CIERRA, ...RETO2_CUENTA, ...RETO2_PROMEDIO, ...RETO2_CIERRA, ...RETO3_FIX),
  );
  correrContestando(lab, ...RETO1_OK, '47');
  lab.siguiente();
}

describe('antes de entrar', () => {
  it('la portada dice el tema, el objetivo y la insignia, y el editor no está detrás', () => {
    const lab = montar();
    expect(screen.getByText('Retos guiados: tres programas completos')).toBeInTheDocument();
    expect(screen.getByText('Insignia · Resolviste los tres retos')).toBeInTheDocument();
    expect(screen.queryByTestId('cod-area')).toBeNull();
    lab.entrar();
    expect(lab.encargo()).toBe('reto1-datos-y-total');
  });
});

describe('El Repaso, el panel de esta clase', () => {
  it('empieza vacío, antes del primer banner', () => {
    montar().entrar();
    expect(screen.getByTestId('cod-panel').textContent).toContain('Todavía no has empezado ningún reto');
  });

  it('aparece al escribir el primer banner, y marca resuelto sólo tras el banner de cierre de ESE reto', () => {
    const lab = montar().entrar();
    lab.escribir(archivo(...RETO1_DATOS));
    correrContestando(lab, 'libreta', '20', '5');

    const repaso = screen.getByTestId('pyc-repaso');
    expect(repaso.textContent).toContain('El precio justo');
    expect(lab.reto(1)?.getAttribute('data-resuelto')).toBe('no');
    expect(lab.reto(2)?.getAttribute('data-resuelto')).toBe('no');

    lab.escribir(archivo(...RETO1_DATOS, ...RETO1_DESCUENTO, ...RETO1_CIERRA));
    correrContestando(lab, 'libreta', '20', '5');
    expect(lab.reto(1)?.getAttribute('data-resuelto')).toBe('si');
  });
});

describe('jugando mal a propósito', () => {
  it('las cuatro líneas del encabezado tienen candado y borrar el archivo entero no borra nada', () => {
    const lab = montar().entrar();
    const original = lab.area().value;
    lab.escribir('');
    expect(lab.area().value).toBe(original);
    expect(screen.getByTestId('cod-aviso').textContent).toContain('candado');
  });

  it('en el Reto 1, un total distinto de 100 no cierra el encargo aunque el programa no se rompa', () => {
    const lab = montar().entrar();
    lab.escribir(archivo(...RETO1_DATOS));
    correrContestando(lab, 'libreta', '10', '3');
    expect(lab.fase()).toBe('terminada');
    expect(lab.logrado()).toBeNull();
  });

  it('en el Reto 3 (encargo 7), acertar el código a la primera no lo cierra: el programa sigue preguntando', () => {
    const lab = montar().entrar();
    llegarAReto3(lab);
    expect(lab.encargo()).toBe('reto3-mientras-te-queden-intentos');

    lab.escribir(
      archivo(...RETO1_DATOS, ...RETO1_DESCUENTO, ...RETO1_CIERRA, ...RETO2_CUENTA, ...RETO2_PROMEDIO, ...RETO2_CIERRA, ...RETO3_CANDADO),
    );
    correrContestando(lab, ...RETO1_OK, '47');
    expect(lab.salida()).toContain('¡Casillero abierto!');
    /* Sin break, intentos nunca baja en el camino del acierto: el while sigue
     * siendo cierto y el programa vuelve a preguntar en vez de terminar. */
    expect(lab.fase()).toBe('esperando');
    expect(lab.logrado()).toBeNull();
  });

  it('el encargo 8 no se da por hecho si te quedas sólo en el acierto: hay que ver que sigue gastando intentos', () => {
    const lab = montar().entrar();
    llegarAReto3(lab);
    lab.escribir(
      archivo(...RETO1_DATOS, ...RETO1_DESCUENTO, ...RETO1_CIERRA, ...RETO2_CUENTA, ...RETO2_PROMEDIO, ...RETO2_CIERRA, ...RETO3_CANDADO),
    );
    correrContestando(lab, ...RETO1_OK, '10', '20', '30');
    lab.siguiente();
    expect(lab.encargo()).toBe('reto3-un-acierto-no-basta');

    /* Contestar bien y quedarse ahí no basta: la fase sigue esperando y el
     * encargo no se da por hecho. */
    correrContestando(lab, ...RETO1_OK, '47');
    expect(lab.fase()).toBe('esperando');
    expect(lab.logrado()).toBeNull();

    /* Sólo cuando los intentos se agotan solos —el programa nunca se detuvo
     * por el acierto— el encargo se cierra. */
    correrContestando(lab, '1', '2', '3');
    expect(lab.fase()).toBe('terminada');
    expect(lab.logrado()).not.toBeNull();
  });

  it('fallar la pregunta final resta seis puntos y no la da por buena', () => {
    const lab = montar().entrar();
    llegarAlUltimoEncargo(lab);
    expect(lab.encargo()).toBe('el-cierre-de-la-unidad');

    fireEvent.click(
      screen.getByText('El for del Reto 2 no puede acumular dos variables distintas al mismo tiempo.', { selector: 'button' }),
    );
    expect(lab.logrado()).toBeNull();
    expect(lab.onScore).toHaveBeenLastCalledWith(94);

    fireEvent.click(
      screen.getByText(
        'El elif del Reto 1 hace falta porque el precio final puede terminar en más de dos resultados, no sólo dos.',
        { selector: 'button' },
      ),
    );
    expect(lab.onComplete.mock.calls[0][0]).toMatchObject({ score: 94, stars: 3 });
  });
});

describe('el recorrido de punta a punta, como un alumno', () => {
  it('los diez encargos, en orden, hasta la pantalla de cierre con su insignia', () => {
    const lab = montar().entrar();

    // 1 · Reto 1 — pide y calcula
    expect(lab.encargo()).toBe('reto1-datos-y-total');
    lab.escribir(archivo(...RETO1_DATOS));
    correrContestando(lab, 'libreta', '20', '5');
    expect(lab.salida()).toContain('Total antes de descuento: 100.0');
    lab.siguiente();

    // 2 · Reto 1 — el descuento
    expect(lab.encargo()).toBe('reto1-el-descuento');
    lab.escribir(archivo(...RETO1_DATOS, ...RETO1_DESCUENTO));
    correrContestando(lab, 'libreta', '20', '5');
    expect(lab.salida()).toContain('Descuento: 10.0');
    lab.siguiente();

    // 3 · Reto 1 — cierra el recibo
    expect(lab.encargo()).toBe('reto1-cierra-el-recibo');
    lab.escribir(archivo(...RETO1_DATOS, ...RETO1_DESCUENTO, ...RETO1_CIERRA));
    correrContestando(lab, 'libreta', '20', '5');
    expect(lab.salida()).toContain('Pagas $90.0 por 5 de libreta.');
    expect(lab.salida()).toContain('--- Fin Reto 1 ---');
    lab.siguiente();

    // 4 · Reto 2 — cuenta y suma
    // El archivo es UNO SOLO: aunque el Reto 2 no pide ningún dato nuevo, la
    // ejecución vuelve a empezar en la línea 1 y hay que recontestar el Reto 1.
    expect(lab.encargo()).toBe('reto2-cuenta-y-suma');
    lab.escribir(archivo(...RETO1_DATOS, ...RETO1_DESCUENTO, ...RETO1_CIERRA, ...RETO2_CUENTA));
    correrContestando(lab, ...RETO1_OK);
    expect(lab.salida()).toContain('Aprobados: 6 de 8');
    lab.siguiente();

    // 5 · Reto 2 — el promedio
    expect(lab.encargo()).toBe('reto2-el-promedio');
    lab.escribir(archivo(...RETO1_DATOS, ...RETO1_DESCUENTO, ...RETO1_CIERRA, ...RETO2_CUENTA, ...RETO2_PROMEDIO));
    correrContestando(lab, ...RETO1_OK);
    expect(lab.salida()).toContain('Grupo aprobado: promedio 7.0');
    lab.siguiente();

    // 6 · Reto 2 — cierra sin otro for
    expect(lab.encargo()).toBe('reto2-reprobados-y-cierra');
    lab.escribir(archivo(...RETO1_DATOS, ...RETO1_DESCUENTO, ...RETO1_CIERRA, ...RETO2_CUENTA, ...RETO2_PROMEDIO, ...RETO2_CIERRA));
    correrContestando(lab, ...RETO1_OK);
    expect(lab.salida()).toContain('Reprobados: 2');
    expect(lab.salida()).toContain('--- Fin Reto 2 ---');
    lab.siguiente();

    // 7 · Reto 3 — el candado que cuenta tus intentos
    expect(lab.encargo()).toBe('reto3-mientras-te-queden-intentos');
    lab.escribir(
      archivo(...RETO1_DATOS, ...RETO1_DESCUENTO, ...RETO1_CIERRA, ...RETO2_CUENTA, ...RETO2_PROMEDIO, ...RETO2_CIERRA, ...RETO3_CANDADO),
    );
    correrContestando(lab, ...RETO1_OK, '10', '20', '30');
    expect(lab.fase()).toBe('terminada');
    expect(lab.salida()).toContain('Intentos restantes: 0');
    lab.siguiente();

    // 8 · Reto 3 — un acierto no bastó
    expect(lab.encargo()).toBe('reto3-un-acierto-no-basta');
    /* Acierta a la primera y luego sigue contestando hasta que los tres
     * intentos se acaban solos: intentos nunca bajó en el camino del acierto,
     * así que hacen falta tres respuestas más (3 → 2 → 1 → 0). */
    correrContestando(lab, ...RETO1_OK, '47', '1', '2', '3');
    expect(lab.fase()).toBe('terminada');
    expect(lab.salida()).toContain('¡Casillero abierto!');
    expect(lab.salida()).toContain('Código incorrecto. Intentos restantes: 0');
    lab.siguiente();

    // 9 · Reto 3 — el break que faltaba
    expect(lab.encargo()).toBe('reto3-el-break-que-faltaba');
    lab.escribir(
      archivo(...RETO1_DATOS, ...RETO1_DESCUENTO, ...RETO1_CIERRA, ...RETO2_CUENTA, ...RETO2_PROMEDIO, ...RETO2_CIERRA, ...RETO3_FIX),
    );
    correrContestando(lab, ...RETO1_OK, '47');
    expect(lab.fase()).toBe('terminada');
    expect(lab.salida()).toContain('¡Casillero abierto!');
    expect(lab.salida()).not.toContain('Se acabaron los intentos. Casillero bloqueado.');
    expect(lab.salida()).toContain('--- Fin Reto 3 ---');
    lab.siguiente();

    // 10 · cierras la unidad
    expect(lab.encargo()).toBe('el-cierre-de-la-unidad');
    fireEvent.click(
      screen.getByText(
        'El elif del Reto 1 hace falta porque el precio final puede terminar en más de dos resultados, no sólo dos.',
        { selector: 'button' },
      ),
    );

    expect(screen.getByText('Resolviste los tres retos')).toBeInTheDocument();
    expect(screen.getByText('Insignia · Resolviste los tres retos')).toBeInTheDocument();
    expect(lab.onProgress).toHaveBeenLastCalledWith(1);
    expect(lab.onComplete).toHaveBeenCalledTimes(1);
    expect(lab.onComplete.mock.calls[0][0]).toMatchObject({ score: 100, stars: 3 });
  });
});
