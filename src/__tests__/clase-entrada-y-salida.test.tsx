/**
 * N7 · «Entrada y salida» — el banco de la clase.
 *
 * Aquí «jugar mal» tiene una forma propia que las otras dos no tienen: **no
 * contestar**. El programa se queda esperando, y hay que comprobar que ni ▶ ni
 * ⏭ se saltan la pregunta, que no se cuela un `None` en la caja y que el
 * encargo no se da por hecho. Más lo de siempre: candados, confundir los dos
 * errores y fallar la pregunta final. Y el recorrido entero, contestando de
 * verdad en la consola.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { LabEntradaYSalida } from '@/components/activities/python/LabEntradaYSalida';

const CABEZA = [
  '# entrevista.py · el programa te entrevista',
  'print("Hola. Voy a hacerte tres preguntas.")',
  '',
  '# ↓ de aquí para abajo escribes tú',
].join('\n');

const archivo = (...mias: string[]) => [CABEZA, ...mias].join('\n');

const PIDE_NOMBRE = 'nombre = input("¿Cómo te llamas? ")';
const SALUDA = 'print("Encantado, " + nombre + ".")';
const PIDE_EDAD = 'edad = input("¿Cuántos años tienes? ")';
const SUMA_MAL = 'print(edad + 1)';
const SUMA_BIEN = 'print(int(edad) + 1)';
const PIDE_CIUDAD = 'ciudad = input("¿De qué ciudad eres? ")';
const FRASE = 'print(nombre, "tiene", edad, "años y vive en", ciudad)';
const FICHA = 'print(f"FICHA · {nombre} · {edad} años · {ciudad}")';

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  render(<LabEntradaYSalida config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />);

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
    paso: () => fireEvent.click(screen.getByTestId('cod-paso')),
    /** Contestar en la consola, que es lo que hace el alumno de verdad. */
    contestar: (respuesta: string) => {
      fireEvent.change(screen.getByTestId('cod-entrada'), { target: { value: respuesta } });
      fireEvent.click(screen.getByTestId('cod-responder'));
    },
    encargo: () => screen.getByTestId('cod-encargo').getAttribute('data-paso'),
    logrado: () => screen.queryByTestId('cod-logrado'),
    siguiente: () => fireEvent.click(screen.getByText('Siguiente encargo →')),
    buzon: (caja: string) => document.querySelector(`[data-buzon="${caja}"]`),
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

/** Los siete primeros encargos, jugados bien. */
function llegarAlUltimoEncargo(lab: ReturnType<typeof montar>) {
  lab.escribir(archivo(PIDE_NOMBRE));
  correrContestando(lab, 'Sofi');
  lab.siguiente();
  lab.escribir(archivo(PIDE_NOMBRE, SALUDA));
  correrContestando(lab, 'Sofi');
  lab.siguiente();
  lab.escribir(archivo(PIDE_NOMBRE, SALUDA, PIDE_EDAD, SUMA_MAL));
  correrContestando(lab, 'Sofi', '13');
  lab.siguiente();
  lab.escribir(archivo(PIDE_NOMBRE, SALUDA, PIDE_EDAD, SUMA_BIEN));
  correrContestando(lab, 'Sofi', '13');
  lab.siguiente();
  correrContestando(lab, 'Sofi', 'trece');
  lab.siguiente();
  lab.escribir(archivo(PIDE_NOMBRE, SALUDA, PIDE_EDAD, SUMA_BIEN, PIDE_CIUDAD, FRASE));
  correrContestando(lab, 'Sofi', '13', 'Toluca');
  lab.siguiente();
  lab.escribir(archivo(PIDE_NOMBRE, SALUDA, PIDE_EDAD, SUMA_BIEN, PIDE_CIUDAD, FRASE, FICHA));
  correrContestando(lab, 'Sofi', '13', 'Toluca');
  lab.siguiente();
}

describe('antes de entrar', () => {
  it('la portada dice el tema, el objetivo y la insignia, y el editor no está detrás', () => {
    const lab = montar();
    expect(screen.getByText('El programa pregunta y contesta')).toBeInTheDocument();
    expect(screen.getByText('Insignia · Pregunta y responde')).toBeInTheDocument();
    expect(screen.queryByTestId('cod-area')).toBeNull();
    lab.entrar();
    expect(lab.encargo()).toBe('pregunta');
  });
});

describe('el buzón, que es el panel de esta clase', () => {
  it('aparece al escribir el input, y al contestar enseña la respuesta CON comillas y su tipo', () => {
    const lab = montar().entrar();
    expect(screen.getByTestId('cod-panel').textContent).toContain('Todavía no le has pedido nada');

    /* La fila nace al escribir la línea, antes de ejecutar nada. */
    lab.escribir(archivo(PIDE_NOMBRE, SALUDA, PIDE_EDAD, SUMA_BIEN));
    expect(lab.buzon('nombre')?.textContent).toContain('sin contestar');
    expect(lab.buzon('edad')?.textContent).toContain('¿Cuántos años tienes?');

    correrContestando(lab, 'Sofi', '13');
    /* Las comillas son el argumento entero de la clase: escribió 13 y llegó
     * el texto '13'. */
    expect(lab.buzon('edad')?.textContent).toContain("'13'");
    expect(document.querySelector('[data-buzon="edad"] .pyc-tipo')?.textContent).toBe('str');

    /* Y la fila lleva a su línea del editor, como la del panel de N6. */
    fireEvent.click(lab.buzon('edad') as HTMLElement);
    expect(lab.area()).toHaveFocus();
  });
});

describe('jugando mal a propósito', () => {
  it('la cabecera tiene candado y borrar el archivo entero no borra nada', () => {
    const lab = montar().entrar();
    const original = lab.area().value;
    lab.escribir('');
    expect(lab.area().value).toBe(original);
    expect(screen.getByTestId('cod-aviso').textContent).toContain('candado');
  });

  it('no contestar nunca deja el programa esperando, sin None en la caja y sin cerrar el encargo', () => {
    const lab = montar().entrar();
    lab.escribir(archivo(PIDE_NOMBRE));
    lab.ejecutar();
    expect(lab.fase()).toBe('esperando');

    /* Ni ▶ ni ⏭ se saltan la pregunta. */
    lab.ejecutar();
    lab.paso();
    expect(lab.fase()).toBe('esperando');
    expect(lab.salida()).not.toContain('None');
    expect(screen.getByTestId('cod-aviso').textContent).toContain('Contesta abajo');
    expect(lab.logrado()).toBeNull();

    /* Y contestar con espacios en blanco tampoco vale como contestar. */
    lab.contestar('   ');
    expect(lab.fase()).toBe('terminada');
    expect(lab.logrado()).toBeNull();

    lab.ejecutar();
    lab.contestar('Sofi');
    expect(lab.logrado()).not.toBeNull();
  });

  it('los dos errores de la clase son distintos: uno lo causa el código y el otro el dato', () => {
    const lab = montar().entrar();
    lab.escribir(archivo(PIDE_NOMBRE, SALUDA, PIDE_EDAD, SUMA_MAL));

    /* Con el código mal escrito: TypeError, contestes lo que contestes. */
    correrContestando(lab, 'Sofi', '13');
    expect(screen.getByTestId('cod-error').textContent).toContain('TypeError');

    /* Con el código bien y el dato mal: ValueError. El programa es el mismo. */
    lab.escribir(archivo(PIDE_NOMBRE, SALUDA, PIDE_EDAD, SUMA_BIEN));
    correrContestando(lab, 'Sofi', 'trece');
    expect(screen.getByTestId('cod-error').textContent).toContain('ValueError');
    expect(screen.getByTestId('cod-error').textContent).toContain('trece');
  });

  it('fallar la pregunta del final resta seis puntos; romper el programa tres veces, cero', () => {
    const lab = montar().entrar();
    llegarAlUltimoEncargo(lab);
    expect(lab.encargo()).toBe('que-trae-input');

    fireEvent.click(screen.getByText('El tipo que escriban: int si escriben un número'));
    expect(lab.logrado()).toBeNull();
    expect(lab.onScore).toHaveBeenLastCalledWith(94);

    fireEvent.click(screen.getByText('Siempre str, aunque escriban un número'));
    expect(lab.onComplete.mock.calls[0][0]).toMatchObject({ score: 94, stars: 3 });
  });
});

describe('el recorrido de punta a punta, como un alumno', () => {
  it('los ocho encargos, contestando en la consola, hasta la pantalla de cierre', () => {
    const lab = montar().entrar();

    // 1 · que te pregunte
    expect(lab.encargo()).toBe('pregunta');
    lab.escribir(archivo(PIDE_NOMBRE));
    lab.ejecutar();
    expect(lab.salida()).toContain('¿Cómo te llamas?');
    lab.contestar('Sofi');
    expect(lab.fase()).toBe('terminada');
    lab.siguiente();

    // 2 · que te conteste
    expect(lab.encargo()).toBe('contesta');
    lab.escribir(archivo(PIDE_NOMBRE, SALUDA));
    correrContestando(lab, 'Sofi');
    expect(lab.salida()).toContain('Encantado, Sofi.');
    lab.siguiente();

    // 3 · lo que llega es texto
    expect(lab.encargo()).toBe('llega-texto');
    lab.escribir(archivo(PIDE_NOMBRE, SALUDA, PIDE_EDAD, SUMA_MAL));
    correrContestando(lab, 'Sofi', '13');
    expect(lab.fase()).toBe('error');
    expect(screen.getByTestId('cod-error').textContent).toContain('no se puede sumar un texto y un número');
    lab.siguiente();

    // 4 · conviértelo
    expect(lab.encargo()).toBe('conviertelo');
    lab.escribir(archivo(PIDE_NOMBRE, SALUDA, PIDE_EDAD, SUMA_BIEN));
    correrContestando(lab, 'Sofi', '13');
    expect(lab.salida()).toContain('14');
    lab.siguiente();

    // 5 · contesta mal a propósito (sin tocar una línea)
    expect(lab.encargo()).toBe('contesta-mal');
    correrContestando(lab, 'Sofi', 'trece');
    expect(lab.fase()).toBe('error');
    lab.siguiente();

    // 6 · tres datos en una línea
    expect(lab.encargo()).toBe('tres-datos');
    lab.escribir(archivo(PIDE_NOMBRE, SALUDA, PIDE_EDAD, SUMA_BIEN, PIDE_CIUDAD, FRASE));
    correrContestando(lab, 'Sofi', '13', 'Toluca');
    expect(lab.salida()).toContain('Sofi tiene 13 años y vive en Toluca');
    lab.siguiente();

    // 7 · la ficha
    expect(lab.encargo()).toBe('la-ficha');
    lab.escribir(archivo(PIDE_NOMBRE, SALUDA, PIDE_EDAD, SUMA_BIEN, PIDE_CIUDAD, FRASE, FICHA));
    correrContestando(lab, 'Sofi', '13', 'Toluca');
    expect(lab.salida()).toContain('FICHA · Sofi · 13 años · Toluca');
    lab.siguiente();

    // 8 · de qué tipo es lo que trae input
    expect(lab.encargo()).toBe('que-trae-input');
    fireEvent.click(screen.getByText('Siempre str, aunque escriban un número'));

    expect(screen.getByText('Pregunta y responde')).toBeInTheDocument();
    expect(screen.getByText('Insignia · Pregunta y responde')).toBeInTheDocument();
    expect(lab.onProgress).toHaveBeenLastCalledWith(1);
    expect(lab.onComplete).toHaveBeenCalledTimes(1);
    expect(lab.onComplete.mock.calls[0][0]).toMatchObject({ score: 100, stars: 3 });
  });
});
