/**
 * N6 · «Primeras líneas de Python» — el banco de la clase.
 *
 * Se prueba **jugando mal**, que es la mitad del banco: ejecutar sin escribir
 * nada, borrar el archivo entero, escribir encima de una línea con candado,
 * pulsar ▶ cien veces, terminar sin acertar y fallar la pregunta final. Y una
 * prueba recorre la clase **entera hasta la pantalla de cierre**, porque la
 * lección más cara de este proyecto es que un motor sólo está probado hasta
 * donde llegan las clases que se han jugado de verdad.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { LabPrimerasLineasPython } from '@/components/activities/python/LabPrimerasLineasPython';

/* Las cinco líneas con candado, tal cual las trae la plantilla. */
const CABEZA = [
  '# saludo.py · mi primer programa',
  'print("Hola, soy tu computadora.")',
  'print("Cumplo las líneas de arriba abajo, una por una.")',
  '',
  '# ↓ de aquí para abajo escribes tú',
].join('\n');

/** El archivo con lo que el alumno escribe debajo de la cabecera. */
const archivo = (...mias: string[]) => [CABEZA, ...mias].join('\n');

const MI_PRINT = 'print("Programo yo")';
const MI_NOMBRE = 'nombre = "Sofi"';
const MI_SALUDO = 'print("Mucho gusto,", nombre)';
const MI_IF = ['if len(nombre) > 6:', '    print("Tu nombre es largo.")', 'else:', '    print("Tu nombre es corto.")'];

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  render(
    <LabPrimerasLineasPython config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />,
  );

  const api = {
    onProgress,
    onScore,
    onComplete,
    entrar: () => {
      fireEvent.click(screen.getByTestId('pyc-empezar'));
      /* ⚡ Sin pausas: el alumno tiene los cuatro botones de velocidad y la
       * clase arranca en «Lenta» a propósito. Aquí se pone en el que ejecuta
       * de un tirón para que las pruebas no dependan de relojes. */
      fireEvent.click(document.querySelector('[data-vel="rayo"]') as HTMLElement);
      return api;
    },
    area: () => screen.getByTestId('cod-area') as HTMLTextAreaElement,
    salida: () => screen.getByTestId('cod-salida').textContent ?? '',
    fase: () => screen.getByTestId('cod').getAttribute('data-fase'),
    escribir: (texto: string) => fireEvent.change(screen.getByTestId('cod-area'), { target: { value: texto } }),
    ejecutar: () => fireEvent.click(screen.getByTestId('cod-ejecutar')),
    paso: () => fireEvent.click(screen.getByTestId('cod-paso')),
    parar: () => fireEvent.click(screen.getByTestId('cod-parar')),
    encargo: () => screen.getByTestId('cod-encargo').getAttribute('data-paso'),
    logrado: () => screen.queryByTestId('cod-logrado'),
    siguiente: () => fireEvent.click(screen.getByText('Siguiente encargo →')),
    pieza: (id: string) => document.querySelector(`[data-pieza="${id}"]`) as HTMLButtonElement,
  };
  return api;
}

/**
 * Los siete primeros encargos, jugados bien. Existe para que la prueba de la
 * pregunta final no tenga que repetirlos: son los mismos gestos que hace el
 * recorrido de punta a punta, en el mismo orden.
 */
function llegarAlUltimoEncargo(lab: ReturnType<typeof montar>) {
  lab.ejecutar(); // 1 · dale al ▶
  lab.siguiente();
  lab.paso(); // 2 · míralo ir despacio
  lab.parar(); // …y ⏹ para poder volver a escribir
  lab.siguiente();
  lab.escribir(archivo(MI_PRINT)); // 3 · tu propia línea
  lab.ejecutar();
  lab.siguiente();
  lab.escribir(archivo(MI_PRINT, MI_NOMBRE, MI_SALUDO)); // 4 · una caja con tu nombre
  lab.ejecutar();
  lab.siguiente();
  lab.escribir(archivo(MI_PRINT, 'nombre = Sofi', MI_SALUDO)); // 5 · rómpelo
  lab.ejecutar();
  lab.siguiente();
  lab.escribir(archivo(MI_PRINT, MI_NOMBRE, MI_SALUDO)); // 6 · arréglalo
  lab.ejecutar();
  lab.siguiente();
  lab.escribir(archivo(MI_PRINT, MI_NOMBRE, MI_SALUDO, ...MI_IF)); // 7 · que decida
  lab.ejecutar();
  lab.siguiente();
}

describe('la portada de objetivos, que va antes del editor', () => {
  it('nadie llega al editor sin haber leído tema, objetivo, encargos e insignia', () => {
    const lab = montar();
    /* Entrar a un laboratorio sin saber de qué va está declarado defecto. */
    expect(screen.getByTestId('pyc-portada')).toBeInTheDocument();
    expect(screen.queryByTestId('cod-area')).toBeNull();
    expect(screen.getByText('Tu primer archivo de Python')).toBeInTheDocument();
    const portada = screen.getByTestId('pyc-portada').textContent ?? '';
    expect(portada).toContain('encargos');
    expect(portada).toContain('Al terminar');
    expect(portada).toContain('Lo que vas a hacer');
    expect(screen.getByText('Insignia · Primera línea')).toBeInTheDocument();

    lab.entrar();
    expect(screen.queryByTestId('pyc-portada')).toBeNull();
    expect(lab.area().value).toContain('# saludo.py');
    expect(lab.encargo()).toBe('ejecuta');
  });
});

describe('el archivo del alumno y sus candados', () => {
  it('la cabecera no se puede tocar ni borrar, y el editor lo dice en vez de tragárselo', () => {
    const lab = montar().entrar();
    const original = lab.area().value;

    /* Escribir encima de una línea con candado. */
    lab.escribir(archivo().replace('Hola, soy tu computadora.', 'lo que yo quiera'));
    expect(lab.area().value).toBe(original);
    expect(screen.getByTestId('cod-aviso').textContent).toContain('candado');

    /* Y el gesto grande: seleccionar todo y borrar. */
    lab.escribir('');
    expect(lab.area().value).toBe(original);

    /* Meter una línea POR ENCIMA del candado también corre los números de
     * línea, y el guion y los errores hablan por número de línea. */
    lab.escribir(['# otra cosa', original].join('\n'));
    expect(lab.area().value).toBe(original);

    /* Lo de abajo sí se escribe. */
    lab.escribir(archivo(MI_PRINT));
    expect(lab.area().value).toContain(MI_PRINT);
  });

  it('el panel «Las tres piezas» lee el archivo y lleva a la línea de cada una', () => {
    const lab = montar().entrar();
    expect(lab.pieza('escribir').getAttribute('data-hecha')).toBe('no');
    expect(lab.pieza('guardar')).toBeDisabled();

    lab.escribir(archivo(MI_PRINT, MI_NOMBRE, MI_SALUDO, ...MI_IF));
    expect(lab.pieza('escribir').getAttribute('data-hecha')).toBe('si');
    expect(lab.pieza('guardar').getAttribute('data-hecha')).toBe('si');
    expect(lab.pieza('decidir').getAttribute('data-hecha')).toBe('si');

    /* Un panel de la derecha que no lleva a ningún sitio es un adorno: éste
     * pone el cursor en la línea donde vive la pieza. */
    fireEvent.click(lab.pieza('guardar'));
    expect(lab.area()).toHaveFocus();
    expect(lab.area().value.slice(lab.area().selectionStart, lab.area().selectionEnd)).toBe(MI_NOMBRE);
  });
});

describe('jugando mal a propósito', () => {
  it('▶ cien veces cierra el encargo una vez y no ejecuta cien programas encima', () => {
    const lab = montar().entrar();
    for (let i = 0; i < 100; i += 1) lab.ejecutar();
    expect(lab.salida().match(/Hola, soy tu computadora\./g)).toHaveLength(1);
    expect(lab.onProgress.mock.calls.filter(([v]) => v === 1 / 8)).toHaveLength(1);
    expect(lab.logrado()).not.toBeNull();
  });

  it('la pista sale sola cuando el programa termina sin cerrar el encargo', () => {
    const lab = montar().entrar();
    lab.ejecutar();
    lab.siguiente();
    lab.paso();
    lab.parar();
    lab.siguiente();

    /* Encargo 3: se pide un print propio. Ejecutar sin escribirlo no lo cierra
     * y saca la pista sin que haya que pedirla. */
    expect(lab.encargo()).toBe('tu-print');
    lab.ejecutar();
    expect(lab.logrado()).toBeNull();
    expect(screen.getByTestId('cod-pista').textContent).toContain('print("Aquí escribo yo")');
  });

  it('«rómpelo» sólo se da por hecho si el programa se rompe de verdad, de cualquiera de las dos formas', () => {
    const lab = montar().entrar();
    lab.escribir(archivo(MI_PRINT, 'nombre = Sofi', MI_SALUDO));
    lab.ejecutar();
    /* Un nombre de una palabra sin comillas es NameError; uno de dos palabras
     * es SyntaxError. Las dos son «le quité las comillas», y las dos valen. */
    expect(screen.getByTestId('cod-error').textContent).toContain('NameError');

    lab.escribir(archivo(MI_PRINT, 'nombre = Ana Sofia', MI_SALUDO));
    lab.ejecutar();
    expect(screen.getByTestId('cod-error').textContent).toContain('SyntaxError');

    /* Y con el programa entero bien, el encargo de romperlo NO se cierra. */
    lab.escribir(archivo(MI_PRINT, MI_NOMBRE, MI_SALUDO));
    lab.ejecutar();
    expect(screen.queryByTestId('cod-error')).toBeNull();
  });

  it('después de ejecutar el programa entero todavía se puede recorrer paso a paso', () => {
    /* La regresión que costó el arreglo de ⏭ en el armazón: terminado el
     * programa, ⏭ quedaba gris y el único botón vivo era ↺, que borra lo que
     * el alumno escribió. En una clase cuyo encargo 2 es «míralo despacio»,
     * eso es un callejón sin salida. */
    const lab = montar().entrar();
    lab.escribir(archivo(MI_PRINT));
    lab.ejecutar();
    expect(lab.fase()).toBe('terminada');

    expect(screen.getByTestId('cod-paso')).not.toBeDisabled();
    lab.paso();
    expect(lab.fase()).toBe('pausada');
    expect(lab.area().value).toContain(MI_PRINT);
  });

  it('fallar la pregunta final resta puntos, no avanza, y acertar después sí cierra', () => {
    const lab = montar().entrar();
    llegarAlUltimoEncargo(lab);
    expect(lab.encargo()).toBe('quien-decide');

    fireEvent.click(screen.getByText('El botón ▶ que pulsé'));
    expect(lab.logrado()).toBeNull();
    expect(screen.getByTestId('cod-pista')).toBeInTheDocument();
    /* Lo ÚNICO que resta puntos en esta clase: romper el programa no cuesta. */
    expect(lab.onScore).toHaveBeenLastCalledWith(94);

    fireEvent.click(screen.getByText('Lo que vale «nombre» cuando el programa llega al if'));
    expect(lab.onComplete).toHaveBeenCalledTimes(1);
    expect(lab.onComplete.mock.calls[0][0]).toMatchObject({ score: 94, stars: 3 });
  });
});

describe('el recorrido de punta a punta, como un alumno', () => {
  it('los ocho encargos, en orden, hasta la pantalla de cierre con su insignia', () => {
    const lab = montar().entrar();

    // 1 · dale al ▶
    expect(lab.encargo()).toBe('ejecuta');
    lab.ejecutar();
    expect(lab.logrado()).not.toBeNull();
    lab.siguiente();

    // 2 · míralo ir despacio, y ⏹ para poder volver a escribir
    expect(lab.encargo()).toBe('paso-a-paso');
    lab.paso();
    expect(lab.fase()).toBe('pausada');
    expect(lab.logrado()).not.toBeNull();
    lab.parar();
    lab.siguiente();

    // 3 · tu propia línea
    expect(lab.encargo()).toBe('tu-print');
    lab.escribir(archivo(MI_PRINT));
    lab.ejecutar();
    expect(lab.salida()).toContain('Programo yo');
    lab.siguiente();

    // 4 · una caja con tu nombre
    expect(lab.encargo()).toBe('variable');
    lab.escribir(archivo(MI_PRINT, MI_NOMBRE, MI_SALUDO));
    lab.ejecutar();
    expect(lab.salida()).toContain('Mucho gusto, Sofi');
    expect(document.querySelector('[data-var="nombre"]')?.textContent).toContain('Sofi');
    lab.siguiente();

    // 5 · rómpelo a propósito
    expect(lab.encargo()).toBe('rompelo');
    lab.escribir(archivo(MI_PRINT, 'nombre = Sofi', MI_SALUDO));
    lab.ejecutar();
    expect(lab.fase()).toBe('error');
    expect(screen.getByTestId('cod-error').textContent).toContain('Línea 7');
    lab.siguiente();

    // 6 · arréglalo
    expect(lab.encargo()).toBe('arreglalo');
    lab.escribir(archivo(MI_PRINT, MI_NOMBRE, MI_SALUDO));
    lab.ejecutar();
    expect(lab.fase()).toBe('terminada');
    lab.siguiente();

    // 7 · que el programa decida
    expect(lab.encargo()).toBe('decide');
    lab.escribir(archivo(MI_PRINT, MI_NOMBRE, MI_SALUDO, ...MI_IF));
    lab.ejecutar();
    expect(lab.salida()).toContain('Tu nombre es corto.');
    lab.siguiente();

    // 8 · quién decide
    expect(lab.encargo()).toBe('quien-decide');
    fireEvent.click(screen.getByText('Lo que vale «nombre» cuando el programa llega al if'));

    // …y la pantalla de cierre
    expect(screen.getByText('¡Tu primer archivo .py!')).toBeInTheDocument();
    expect(screen.getByText('Insignia · Primera línea')).toBeInTheDocument();
    /* El contador de programas rotos se enseña sin signo negativo: aquí
     * romperlo es el oficio, y esta clase lo pide dos veces. */
    expect(screen.getByText('Se rompió')).toBeInTheDocument();
    expect(lab.onProgress).toHaveBeenLastCalledWith(1);
    expect(lab.onComplete).toHaveBeenCalledTimes(1);
    expect(lab.onComplete.mock.calls[0][0]).toMatchObject({ score: 100, stars: 3 });

    /* Y «Jugar otra vez» devuelve el guion al primer encargo, no a la mitad. */
    fireEvent.click(screen.getByText('Jugar otra vez'));
    expect(screen.getByTestId('pyc-portada')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('pyc-empezar'));
    expect(lab.encargo()).toBe('ejecuta');
    expect(lab.area().value).toBe(archivo() + '\n');
  });
});
