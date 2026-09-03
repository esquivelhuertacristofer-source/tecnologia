/**
 * N7 · «Variables y tipos» — el banco de la clase.
 *
 * Jugando mal: cambiar la línea con candado, cerrar a medias el encargo de la
 * división, confundir los dos errores que la clase provoca a propósito, dejar
 * el programa roto y fallar la pregunta final. Y un recorrido entero, de la
 * portada a la insignia.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { LabVariablesYTipos } from '@/components/activities/python/LabVariablesYTipos';

const CABEZA = [
  '# tipos.py · qué es cada dato',
  '# Cada línea guarda un dato en una caja. Mira la Mesa de tipos, a la derecha.',
  'edad = 13',
  '',
  '# ↓ de aquí para abajo escribes tú',
].join('\n');

const archivo = (...mias: string[]) => [CABEZA, ...mias].join('\n');

const CAJAS = ['estatura = 1.62', 'nombre = "Bit"', 'aprobado = True'];
const TIPOS = 'print(type(edad), type(estatura), type(nombre), type(aprobado))';
const DIVISIONES = ['print(10 / 2)', 'print(10 // 2)'];
const MEZCLA = 'print("Tengo " + edad)';
const PEGAR = 'print("Tengo " + str(edad) + " años")';
const SUMAR = ['respuesta = "7"', 'print(int(respuesta) + 1)'];
const NO_SE_DEJA = 'print(int("trece"))';

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  render(<LabVariablesYTipos config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />);

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
    chapa: (caja: string) =>
      document.querySelector(`[data-caja="${caja}"] .pyc-tipo`)?.textContent ?? null,
  };
  return api;
}

/**
 * Los siete primeros encargos, jugados bien. Deja el programa **roto** en la
 * última línea (`int("trece")`) y el guion en el encargo 8, que es justo el
 * que pide limpiarlo.
 */
function jugarHastaLimpio(lab: ReturnType<typeof montar>) {
  const pasos = [
    [...CAJAS],
    [...CAJAS, TIPOS],
    [...CAJAS, TIPOS, ...DIVISIONES],
    [...CAJAS, TIPOS, ...DIVISIONES, MEZCLA],
    [...CAJAS, TIPOS, ...DIVISIONES, PEGAR],
    [...CAJAS, TIPOS, ...DIVISIONES, PEGAR, ...SUMAR],
    [...CAJAS, TIPOS, ...DIVISIONES, PEGAR, ...SUMAR, NO_SE_DEJA],
  ];
  for (const lineas of pasos) {
    lab.escribir(archivo(...lineas));
    lab.ejecutar();
    lab.siguiente();
  }
}

/** …y el 8, que deja el programa entero corriendo. */
function llegarAlUltimoEncargo(lab: ReturnType<typeof montar>) {
  jugarHastaLimpio(lab);
  lab.escribir(archivo(...CAJAS, TIPOS, ...DIVISIONES, PEGAR, ...SUMAR));
  lab.ejecutar();
  lab.siguiente();
}

describe('antes de entrar', () => {
  it('la portada dice el tema, el objetivo y la insignia, y el editor no está detrás', () => {
    const lab = montar();
    expect(screen.getByText('Variables y tipos de dato')).toBeInTheDocument();
    expect(screen.getByText('Insignia · Cada dato en su caja')).toBeInTheDocument();
    expect(screen.queryByTestId('cod-area')).toBeNull();
    lab.entrar();
    expect(lab.encargo()).toBe('cuatro-cajas');
  });
});

describe('la Mesa de tipos, que es el panel de esta clase', () => {
  it('sustituye al panel de variables del armazón y pone la chapa del tipo a cada caja', () => {
    const lab = montar().entrar();
    /* Tener los dos paneles sería la misma lista dos veces, con la de arriba
     * enseñando menos. */
    expect(screen.queryByTestId('cod-variables')).toBeNull();
    expect(screen.getByTestId('cod-panel').textContent).toContain('Mesa de tipos');

    lab.escribir(archivo(...CAJAS));
    lab.ejecutar();
    expect(lab.chapa('edad')).toBe('int');
    expect(lab.chapa('estatura')).toBe('float');
    expect(lab.chapa('nombre')).toBe('str');
    expect(lab.chapa('aprobado')).toBe('bool');
    /* El texto se enseña con sus comillas, que es lo que separa 13 de "13". */
    expect(document.querySelector('[data-caja="nombre"]')?.textContent).toContain("'Bit'");
  });
});

describe('jugando mal a propósito', () => {
  it('el 13 de la cabecera tiene candado: media clase comprueba salidas exactas', () => {
    const lab = montar().entrar();
    lab.escribir(archivo(...CAJAS).replace('edad = 13', 'edad = 999'));
    expect(lab.area().value).toContain('edad = 13');
    expect(screen.getByTestId('cod-aviso').textContent).toContain('candado');
  });

  it('la división a medias no cierra el encargo: hacen falta el 5.0 y el 5', () => {
    const lab = montar().entrar();
    lab.escribir(archivo(...CAJAS));
    lab.ejecutar();
    lab.siguiente();
    lab.escribir(archivo(...CAJAS, TIPOS));
    lab.ejecutar();
    lab.siguiente();
    expect(lab.encargo()).toBe('el-punto');

    lab.escribir(archivo(...CAJAS, TIPOS, 'print(10 / 2)'));
    lab.ejecutar();
    expect(lab.salida()).toContain('5.0');
    expect(lab.logrado()).toBeNull();

    lab.escribir(archivo(...CAJAS, TIPOS, ...DIVISIONES));
    lab.ejecutar();
    expect(lab.logrado()).not.toBeNull();
  });

  it('los dos errores que la clase provoca no se confunden entre sí', () => {
    const lab = montar().entrar();
    lab.escribir(archivo(...CAJAS));
    lab.ejecutar();
    lab.siguiente();
    lab.escribir(archivo(...CAJAS, TIPOS));
    lab.ejecutar();
    lab.siguiente();
    lab.escribir(archivo(...CAJAS, TIPOS, ...DIVISIONES));
    lab.ejecutar();
    lab.siguiente();
    expect(lab.encargo()).toBe('mezcla');

    /* El encargo pide un TypeError; un ValueError no vale, aunque también sea
     * un error rojo con su línea. */
    lab.escribir(archivo(...CAJAS, TIPOS, ...DIVISIONES, NO_SE_DEJA));
    lab.ejecutar();
    expect(screen.getByTestId('cod-error').textContent).toContain('ValueError');
    expect(lab.logrado()).toBeNull();

    lab.escribir(archivo(...CAJAS, TIPOS, ...DIVISIONES, MEZCLA));
    lab.ejecutar();
    expect(screen.getByTestId('cod-error').textContent).toContain('TypeError');
    expect(screen.getByTestId('cod-error').textContent).toContain('str(edad)');
    expect(lab.logrado()).not.toBeNull();
  });

  it('«deja la ficha entera» no se cierra con el programa todavía roto', () => {
    const lab = montar().entrar();
    jugarHastaLimpio(lab);
    expect(lab.encargo()).toBe('limpio');
    /* El programa sigue rompiéndose en la última línea. */
    expect(lab.fase()).toBe('error');
    expect(lab.logrado()).toBeNull();

    lab.escribir(archivo(...CAJAS, TIPOS, ...DIVISIONES, PEGAR, ...SUMAR));
    lab.ejecutar();
    expect(lab.fase()).toBe('terminada');
    expect(lab.logrado()).not.toBeNull();
  });

  it('fallar la pregunta del final resta seis puntos y no la da por buena', () => {
    const lab = montar().entrar();
    llegarAlUltimoEncargo(lab);
    expect(lab.encargo()).toBe('que-tipo-sale');

    fireEvent.click(screen.getByText("<class 'int'>", { selector: 'button' }));
    expect(lab.logrado()).toBeNull();
    expect(lab.onScore).toHaveBeenLastCalledWith(94);
    /* Y romper el programa dos veces, que esta clase pide expresamente, no ha
     * restado nada: 100 − 6 y no 100 − 18. */
    expect(lab.onComplete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("<class 'float'>", { selector: 'button' }));
    expect(lab.onComplete.mock.calls[0][0]).toMatchObject({ score: 94, stars: 3 });
  });
});

describe('el recorrido de punta a punta, como un alumno', () => {
  it('los nueve encargos, en orden, hasta la pantalla de cierre con su insignia', () => {
    const lab = montar().entrar();

    // 1 · cuatro cajas, cuatro tipos
    expect(lab.encargo()).toBe('cuatro-cajas');
    lab.escribir(archivo(...CAJAS));
    lab.ejecutar();
    expect(lab.chapa('aprobado')).toBe('bool');
    lab.siguiente();

    // 2 · pregúntale a Python
    expect(lab.encargo()).toBe('preguntale');
    lab.escribir(archivo(...CAJAS, TIPOS));
    lab.ejecutar();
    expect(lab.salida()).toContain("<class 'int'>");
    lab.siguiente();

    // 3 · el punto que lo cambia todo
    expect(lab.encargo()).toBe('el-punto');
    lab.escribir(archivo(...CAJAS, TIPOS, ...DIVISIONES));
    lab.ejecutar();
    expect(lab.salida()).toContain('5.0');
    lab.siguiente();

    // 4 · mézclalos a propósito
    expect(lab.encargo()).toBe('mezcla');
    lab.escribir(archivo(...CAJAS, TIPOS, ...DIVISIONES, MEZCLA));
    lab.ejecutar();
    expect(lab.fase()).toBe('error');
    lab.siguiente();

    // 5 · decídelo tú: pegar
    expect(lab.encargo()).toBe('pegar');
    lab.escribir(archivo(...CAJAS, TIPOS, ...DIVISIONES, PEGAR));
    lab.ejecutar();
    expect(lab.salida()).toContain('Tengo 13 años');
    lab.siguiente();

    // 6 · decídelo tú: sumar
    expect(lab.encargo()).toBe('sumar');
    lab.escribir(archivo(...CAJAS, TIPOS, ...DIVISIONES, PEGAR, ...SUMAR));
    lab.ejecutar();
    /* La trampa de la clase: sale 8 y «respuesta» sigue siendo texto. */
    expect(lab.chapa('respuesta')).toBe('str');
    lab.siguiente();

    // 7 · el que no se deja convertir
    expect(lab.encargo()).toBe('no-se-deja');
    lab.escribir(archivo(...CAJAS, TIPOS, ...DIVISIONES, PEGAR, ...SUMAR, NO_SE_DEJA));
    lab.ejecutar();
    expect(screen.getByTestId('cod-error').textContent).toContain('ValueError');
    lab.siguiente();

    // 8 · deja la ficha entera
    expect(lab.encargo()).toBe('limpio');
    lab.escribir(archivo(...CAJAS, TIPOS, ...DIVISIONES, PEGAR, ...SUMAR));
    lab.ejecutar();
    expect(lab.fase()).toBe('terminada');
    lab.siguiente();

    // 9 · qué tipo sale
    expect(lab.encargo()).toBe('que-tipo-sale');
    fireEvent.click(screen.getByText("<class 'float'>", { selector: 'button' }));

    expect(screen.getByText('Cada dato en su caja')).toBeInTheDocument();
    expect(screen.getByText('Insignia · Cada dato en su caja')).toBeInTheDocument();
    expect(lab.onProgress).toHaveBeenLastCalledWith(1);
    expect(lab.onComplete).toHaveBeenCalledTimes(1);
    expect(lab.onComplete.mock.calls[0][0]).toMatchObject({ score: 100, stars: 3 });
  });
});
