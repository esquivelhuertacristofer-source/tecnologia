/**
 * N6 · «Primeras líneas de Python» — el banco de la clase (§69.22).
 *
 * Se prueba **jugando mal**, que es la mitad del banco: borrar el archivo,
 * escribir encima del candado, pulsar ▶ cien veces, copiar el saludo a mano y
 * decidir sin `if` —que pasan el ejemplo y el juez tumba con otros nombres—,
 * dar por arreglado lo que nadie mandó al juez, y fallar la pregunta final. Y
 * una prueba recorre la clase **entera hasta la pantalla de cierre**.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { LabPrimerasLineasPython, PLANTILLA } from '@/components/activities/python/LabPrimerasLineasPython';

type Celda = 'arriba' | 'Problema 1' | 'Problema 2';

/**
 * La plantilla con lo del alumno: `arriba` va debajo de la flecha, y cada
 * problema justo debajo de su caja. `caja1` cambia lo que guarda la caja del
 * Problema 1 (para romperla y arreglarla).
 */
function enCeldas(programas: Partial<Record<Celda, string>>, caja1 = 'nombre = "Sofi"'): string {
  const lineas = PLANTILLA.split('\n');
  const insertar = (despues: number, programa?: string) => {
    if (programa) lineas.splice(despues + 1, 0, ...programa.split('\n'));
  };
  const caja = (celda: string) => {
    const i = lineas.findIndex((l) => l.startsWith(`# %% ${celda}`));
    return lineas.findIndex((l, n) => n > i && /^nombre\s*=/.test(l));
  };
  insertar(caja('Problema 2'), programas['Problema 2']);
  const i1 = caja('Problema 1');
  lineas[i1] = caja1;
  insertar(i1, programas['Problema 1']);
  insertar(lineas.findIndex((l) => l.startsWith('# ↓')), programas.arriba);
  return lineas.join('\n');
}

const MI_PRINT = 'print("Programo yo")';
const SALUDO = 'print("Mucho gusto,", nombre)';
const SI = ['if len(nombre) > 6:', '    print("Tu nombre es largo.")', 'else:', '    print("Tu nombre es corto.")'].join('\n');

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  render(<LabPrimerasLineasPython config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />);

  const api = {
    onProgress,
    onScore,
    onComplete,
    entrar: () => {
      fireEvent.click(screen.getByTestId('pyc-empezar'));
      /* ⚡ Sin pausas: la clase arranca en «Lenta» a propósito; aquí se pone
       * la que ejecuta de un tirón para no depender de relojes. */
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
    /* jsdom pulsa botones escondidos: la quinta puerta cazó «arréglalo» con
     * el botón de enviar dentro de un tablero `hidden`. Aquí se exige que se vea. */
    enviar: () => {
      const boton = screen.getByTestId('jz-enviar');
      expect(boton.closest('[hidden]')).toBeNull();
      fireEvent.click(boton);
    },
    veredicto: () => screen.getByTestId('jz-veredicto'),
    encargo: () => screen.getByTestId('cod-encargo').getAttribute('data-paso'),
    logrado: () => screen.queryByTestId('cod-logrado'),
    siguiente: () => fireEvent.click(screen.getByText('Siguiente encargo →')),
    pieza: (id: string) => document.querySelector(`[data-pieza="${id}"]`) as HTMLButtonElement,
  };
  return api;
}

/** Los tres primeros encargos, jugados bien: ▶, ⏭ y ⏹, y la frase propia. */
function hastaElSaludo(lab: ReturnType<typeof montar>) {
  lab.ejecutar();
  lab.siguiente();
  lab.paso();
  lab.parar();
  lab.siguiente();
  lab.escribir(enCeldas({ arriba: MI_PRINT }));
  lab.ejecutar();
  lab.siguiente();
}

describe('la portada de objetivos, que va antes del editor', () => {
  it('nadie llega al editor sin haber leído tema, objetivo, encargos e insignia', () => {
    const lab = montar();
    expect(screen.getByTestId('pyc-portada')).toBeInTheDocument();
    expect(screen.queryByTestId('cod-area')).toBeNull();
    expect(screen.getByText('Tu primer archivo de Python')).toBeInTheDocument();
    const portada = screen.getByTestId('pyc-portada').textContent ?? '';
    expect(portada).toContain('Lo que vas a hacer');
    expect(portada).toContain('juez');
    expect(screen.getByText('Insignia · Primera línea')).toBeInTheDocument();

    lab.entrar();
    expect(screen.queryByTestId('pyc-portada')).toBeNull();
    expect(lab.area().value).toContain('# %% Problema 1 · El saludo');
    expect(lab.encargo()).toBe('ejecuta');
  });
});

describe('el archivo del alumno y sus candados', () => {
  it('la cabecera no se puede tocar ni borrar, y el editor lo dice en vez de tragárselo', () => {
    const lab = montar().entrar();
    const original = lab.area().value;

    lab.escribir(original.replace('Hola, soy tu computadora.', 'lo que yo quiera'));
    expect(lab.area().value).toBe(original);
    expect(screen.getByTestId('cod-aviso').textContent).toContain('candado');

    lab.escribir('');
    expect(lab.area().value).toBe(original);

    lab.escribir(['# otra cosa', original].join('\n'));
    expect(lab.area().value).toBe(original);

    lab.escribir(enCeldas({ arriba: MI_PRINT }));
    expect(lab.area().value).toContain(MI_PRINT);
  });

  it('las tres piezas se encienden con lo que corre y con el juez, no con lo que está escrito', () => {
    const lab = montar().entrar();
    expect(lab.pieza('escribir').getAttribute('data-hecha')).toBe('no');

    /* Escribir el `if` y el saludo enteros ya no enciende nada: antes bastaba
     * con que el texto casara con una expresión regular. */
    lab.escribir(enCeldas({ 'Problema 1': SALUDO, 'Problema 2': SI }));
    expect(lab.pieza('guardar').getAttribute('data-hecha')).toBe('no');
    expect(lab.pieza('decidir').getAttribute('data-hecha')).toBe('no');

    /* Una frase que no corre tampoco: le falta el paréntesis de cierre. */
    lab.escribir(enCeldas({ arriba: 'print("Programo yo"' }));
    expect(lab.pieza('escribir').getAttribute('data-hecha')).toBe('no');
    lab.escribir(enCeldas({ arriba: MI_PRINT }));
    expect(lab.pieza('escribir').getAttribute('data-hecha')).toBe('si');

    /* Tocar la pieza lleva el cursor a su celda. */
    fireEvent.click(lab.pieza('guardar'));
    expect(lab.area()).toHaveFocus();
    expect(lab.area().value.slice(lab.area().selectionStart, lab.area().selectionEnd)).toBe('# %% Problema 1 · El saludo');
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

  it('la frase propia no se cumple sin escribirla, y la pista enseña el molde sin dictar la línea', () => {
    const lab = montar().entrar();
    lab.ejecutar();
    lab.siguiente();
    lab.paso();
    lab.parar();
    lab.siguiente();
    expect(lab.encargo()).toBe('tu-print');
    lab.ejecutar();
    expect(lab.logrado()).toBeNull();
    const pista = screen.getByTestId('cod-pista').textContent ?? '';
    expect(pista).toContain('molde');
    expect(pista).not.toMatch(/print\s*\(/);
  });

  it('el saludo escrito a mano pasa a Sofi y el juez lo tumba con otros nombres, sin enseñarlos', () => {
    const lab = montar().entrar();
    hastaElSaludo(lab);
    expect(lab.encargo()).toBe('el-saludo');
    lab.escribir(enCeldas({ arriba: MI_PRINT, 'Problema 1': 'print("Mucho gusto, Sofi")' }));
    lab.ejecutar();
    expect(lab.salida()).toContain('Mucho gusto, Sofi');
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('no');
    expect(lab.veredicto().textContent).toContain('1 de 4 casos');
    expect(lab.veredicto().textContent).not.toMatch(/María José|Maximiliano|Ana\b/);
    expect(lab.logrado()).toBeNull();
  });

  it('«rómpelo» vale de las dos formas, y «arréglalo» no se cierra hasta que el juez vuelve a aceptar', () => {
    const lab = montar().entrar();
    hastaElSaludo(lab);
    lab.escribir(enCeldas({ arriba: MI_PRINT, 'Problema 1': SALUDO }));
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('si');
    lab.siguiente();

    expect(lab.encargo()).toBe('rompelo');
    /* Un nombre de una palabra sin comillas es NameError; de dos, SyntaxError. */
    lab.escribir(enCeldas({ arriba: MI_PRINT, 'Problema 1': SALUDO }, 'nombre = Ana Sofia'));
    lab.ejecutar();
    expect(screen.getByTestId('cod-error').textContent).toContain('SyntaxError');
    expect(lab.logrado()).not.toBeNull();
    lab.siguiente();

    expect(lab.encargo()).toBe('arreglalo');
    /* Quitar la caja roja con otro saludo a mano NO es arreglarlo. */
    lab.escribir(enCeldas({ arriba: MI_PRINT, 'Problema 1': 'print("Mucho gusto, Sofi")' }));
    lab.ejecutar();
    expect(screen.queryByTestId('cod-error')).toBeNull();
    expect(lab.logrado()).toBeNull();
    lab.enviar();
    expect(lab.logrado()).toBeNull();

    lab.escribir(enCeldas({ arriba: MI_PRINT, 'Problema 1': SALUDO }));
    lab.enviar();
    expect(lab.logrado()).not.toBeNull();
  });

  it('la frase sin if contesta igual a todos y cae en los largos', () => {
    const lab = montar().entrar();
    hastaElSaludo(lab);
    lab.escribir(enCeldas({ arriba: MI_PRINT, 'Problema 1': SALUDO }));
    lab.enviar();
    lab.siguiente();
    lab.escribir(enCeldas({ arriba: MI_PRINT, 'Problema 1': SALUDO }, 'nombre = Sofi'));
    lab.ejecutar();
    lab.siguiente();
    lab.escribir(enCeldas({ arriba: MI_PRINT, 'Problema 1': SALUDO }));
    lab.enviar();
    lab.siguiente();

    expect(lab.encargo()).toBe('largo-o-corto');
    lab.escribir(enCeldas({ arriba: MI_PRINT, 'Problema 1': SALUDO, 'Problema 2': 'print("Tu nombre es corto.")' }));
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('no');
    expect(lab.veredicto().textContent).toContain('2 de 4 casos');
    expect(lab.logrado()).toBeNull();
  });

  it('después de ejecutar el programa entero todavía se puede recorrer paso a paso', () => {
    const lab = montar().entrar();
    lab.escribir(enCeldas({ arriba: MI_PRINT }));
    lab.ejecutar();
    expect(lab.fase()).toBe('terminada');
    expect(screen.getByTestId('cod-paso')).not.toBeDisabled();
    lab.paso();
    expect(lab.fase()).toBe('pausada');
    expect(lab.area().value).toContain(MI_PRINT);
  });
});

describe('el recorrido de punta a punta, como un alumno', () => {
  it('los ocho encargos, con un tropiezo en la pregunta final, hasta la insignia', () => {
    const lab = montar().entrar();

    // 1–3 · ▶, ⏭ y la frase propia
    expect(lab.encargo()).toBe('ejecuta');
    lab.ejecutar();
    expect(lab.logrado()).not.toBeNull();
    lab.siguiente();
    expect(lab.encargo()).toBe('paso-a-paso');
    lab.paso();
    expect(lab.logrado()).not.toBeNull();
    lab.parar();
    lab.siguiente();
    expect(lab.encargo()).toBe('tu-print');
    lab.escribir(enCeldas({ arriba: MI_PRINT }));
    lab.ejecutar();
    expect(lab.salida()).toContain('Programo yo');
    expect(lab.logrado()).not.toBeNull();
    lab.siguiente();

    // 4 · el saludo, con su nombre en la caja
    expect(lab.encargo()).toBe('el-saludo');
    lab.escribir(enCeldas({ arriba: MI_PRINT, 'Problema 1': SALUDO }, 'nombre = "Valentina"'));
    lab.ejecutar();
    expect(lab.salida()).toContain('Mucho gusto, Valentina');
    expect(lab.salida()).not.toContain('Programo yo'); // ▶ corre sólo la celda
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('si');
    expect(lab.pieza('guardar').getAttribute('data-hecha')).toBe('si');
    lab.siguiente();

    // 5 · rómpelo: el error dice la línea de la caja
    expect(lab.encargo()).toBe('rompelo');
    lab.escribir(enCeldas({ arriba: MI_PRINT, 'Problema 1': SALUDO }, 'nombre = Valentina'));
    lab.ejecutar();
    expect(lab.fase()).toBe('error');
    expect(screen.getByTestId('cod-error').textContent).toContain('Línea 11');
    lab.siguiente();

    // 6 · arréglalo
    expect(lab.encargo()).toBe('arreglalo');
    lab.escribir(enCeldas({ arriba: MI_PRINT, 'Problema 1': SALUDO }, 'nombre = "Valentina"'));
    lab.enviar();
    expect(lab.logrado()).not.toBeNull();
    lab.siguiente();

    // 7 · ¿largo o corto?
    expect(lab.encargo()).toBe('largo-o-corto');
    lab.escribir(enCeldas({ arriba: MI_PRINT, 'Problema 1': SALUDO, 'Problema 2': SI }, 'nombre = "Valentina"'));
    lab.ejecutar();
    expect(lab.salida()).toContain('Tu nombre es corto.');
    lab.enviar();
    expect(lab.veredicto().getAttribute('data-aceptado')).toBe('si');
    expect(lab.pieza('decidir').getAttribute('data-hecha')).toBe('si');
    lab.siguiente();

    // 8 · quién decidió, primero mal: es lo único que resta
    expect(lab.encargo()).toBe('quien-decide');
    fireEvent.click(screen.getByText('El juez cambió mi if por otro para cada nombre.'));
    expect(lab.logrado()).toBeNull();
    expect(lab.onScore).toHaveBeenLastCalledWith(94);
    fireEvent.click(screen.getByText(/^Lo que valía «nombre» cuando el programa llegó al if/));

    expect(screen.getByText('¡Tu primer archivo .py!')).toBeInTheDocument();
    expect(screen.getByText('Insignia · Primera línea')).toBeInTheDocument();
    expect(lab.onProgress).toHaveBeenLastCalledWith(1);
    expect(lab.onComplete).toHaveBeenCalledTimes(1);
    expect(lab.onComplete.mock.calls[0][0]).toMatchObject({ score: 94, stars: 3 });

    /* «Jugar otra vez» devuelve el guion al primer encargo y el archivo a la plantilla. */
    fireEvent.click(screen.getByText('Jugar otra vez'));
    fireEvent.click(screen.getByTestId('pyc-empezar'));
    expect(lab.encargo()).toBe('ejecuta');
    expect(lab.area().value).toBe(PLANTILLA);
  });
});
