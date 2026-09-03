/**
 * TECNIA CÓDIGO · el banco de pruebas del armazón.
 *
 * Se prueba en cuatro alturas y en este orden, que es el orden en el que se
 * rompe: el coloreado (puro), la métrica de las dos capas (que es donde vive
 * el riesgo de esta técnica), el teclado (puro) y la ventana entera.
 *
 * Y se prueba **jugando mal**, que es la mitad del banco: ejecutar con el
 * editor vacío, pulsar ▶ dos veces, ⏭ mil veces después del final, parar sin
 * haber arrancado, escribir con el programa en marcha, un `input()` que no se
 * contesta nunca, `while True:` y pegar quinientas líneas de golpe.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { textoDeError } from '@/components/simuladores/codigo';
import {
  colorear,
  cambioPermitido,
  conEnter,
  conTab,
  ecoDeLinea,
  useCodigo,
  VentanaCodigo,
  type GuionCodigo,
  type OpcionesCodigo,
  type PanelCodigoProps,
} from '@/components/simuladores/codigo/ventana';

/* ── el banco ───────────────────────────────────────────────────────────────*/

function Banco(props: OpcionesCodigo & { archivo?: string }) {
  const cod = useCodigo(props);
  return <VentanaCodigo codigo={cod} archivo={props.archivo ?? 'reto.py'} />;
}

function montar(props: OpcionesCodigo & { archivo?: string }) {
  render(<Banco {...props} />);
  return {
    area: () => screen.getByTestId('cod-area') as HTMLTextAreaElement,
    capa: () => screen.getByTestId('cod-capa'),
    salida: () => screen.getByTestId('cod-salida').textContent ?? '',
    ejecutar: () => fireEvent.click(screen.getByTestId('cod-ejecutar')),
    parar: () => fireEvent.click(screen.getByTestId('cod-parar')),
    paso: () => fireEvent.click(screen.getByTestId('cod-paso')),
    escribir: (texto: string) => fireEvent.change(screen.getByTestId('cod-area'), { target: { value: texto } }),
    linea: (n: number) => screen.getByTestId('cod-capa').querySelector(`[data-linea="${n}"]`),
  };
}

/** El texto que la capa de colores dice tener, línea a línea. */
function textoDeLaCapa(capa: HTMLElement): string {
  return Array.from(capa.querySelectorAll('[data-linea]'))
    .map((l) => l.textContent ?? '')
    .join('\n');
}

const CSS = readFileSync(
  join(process.cwd(), 'src/components/simuladores/codigo/ventana/ventanaCodigo.css'),
  'utf8',
);

/* Un programa con todas las trampas del coloreado dentro: acentos, un `#`
 * metido en un texto, un texto con comillas de la otra clase, tabulador, y una
 * palabra que en Python existe y aquí no. */
const TRAMPOSO = [
  '# la tabla del 7  ← comentario de verdad',
  'titulo = "el # no es comentario aquí"',
  "otro = 'comillas simples'",
  'def tabla(n):',
  '\tfor i in range(1, 11):',
  '\t\tprint(f"{n} x {i} = {n * i}")',
  '',
  'canción = 3.5   # número con decimales',
  'import random',
].join('\n');

describe('el coloreado, que es una función pura del texto', () => {
  it('la suma de los tramos es el texto, carácter por carácter, y hay una línea por línea', () => {
    /* La regla que sostiene el editor entero: si la capa de colores dice un
     * carácter de más o de menos, el texto de abajo deja de caer bajo el de
     * arriba de ahí para adelante. */
    for (const linea of colorear(TRAMPOSO)) {
      const original = TRAMPOSO.split('\n')[linea.n - 1];
      expect(linea.tramos.map((t) => t.texto).join('')).toBe(original);
    }
    expect(colorear(TRAMPOSO)).toHaveLength(TRAMPOSO.split('\n').length);
    expect(colorear('')).toHaveLength(1);
    expect(colorear('a\n')).toHaveLength(2);
  });

  it('pinta palabras clave, funciones de fábrica, textos, números y el nombre de un def', () => {
    const buscar = (fuente: string, trozo: string) =>
      colorear(fuente)
        .flatMap((l) => l.tramos)
        .find((t) => t.texto === trozo)?.color;

    expect(buscar('for i in range(3):', 'for')).toBe('palabra');
    expect(buscar('print("hola")', 'print')).toBe('nativa');
    expect(buscar('print("hola")', '"hola"')).toBe('cadena');
    expect(buscar('x = 42', '42')).toBe('numero');
    expect(buscar('def saluda():', 'saluda')).toBe('definicion');
    expect(buscar('total = 0', 'total')).toBe('nombre');
    expect(buscar('# nota', '# nota')).toBe('comentario');
    /* `import` existe en Python y aquí no: se pinta avisando, no como una
     * variable cualquiera. */
    expect(buscar('import random', 'import')).toBe('prohibida');
  });

  it('un programa a medio escribir sigue coloreando lo de arriba y no pierde un carácter', () => {
    /* El caso de cada tecla: la comilla todavía sin cerrar. Con el léxico
     * normal no habría ni una ficha y el editor se apagaría entero. */
    const medias = 'x = 10\nnombre = "Sofi\ny = 2';
    const pintado = colorear(medias);
    expect(pintado.map((l) => l.tramos.map((t) => t.texto).join('')).join('\n')).toBe(medias);
    expect(pintado[0].tramos.find((t) => t.texto === '10')?.color).toBe('numero');
  });

  it('colorear quinientas líneas cuesta menos de 40 ms', () => {
    const largo = Array.from({ length: 500 }, (_, i) => `variable_${i} = ${i} * 2  # línea ${i}`).join('\n');
    const t0 = performance.now();
    const pintado = colorear(largo);
    const ms = performance.now() - t0;
    expect(pintado).toHaveLength(500);

    console.log(`[coloreado] 500 líneas en ${ms.toFixed(2)} ms`);
    expect(ms).toBeLessThan(40);
  });
});

describe('la métrica: que las dos capas caigan una encima de la otra', () => {
  it('el textarea y la capa llevan el MISMO style, y hay una caja y un número por línea', () => {
    const programa = 'a = 1\n\nb = 2\n';
    const { area, capa } = montar({ plantilla: programa });

    const deArriba = area().getAttribute('style');
    const deAbajo = capa().getAttribute('style');
    expect(deArriba).toBeTruthy();
    expect(deArriba).toContain('font-size');
    expect(deArriba).toContain('line-height');
    expect(deArriba).toContain('padding');
    expect(deAbajo).toBe(deArriba);

    /* Con la misma métrica y una caja de alto fijo por línea —también la vacía
     * y la que queda detrás del último salto— la línea n de la capa cae encima
     * de la línea n del cuadro de texto. */
    const cajas = capa().querySelectorAll('[data-linea]');
    expect(cajas).toHaveLength(4);
    expect(document.querySelectorAll('[data-num]')).toHaveLength(4);
    expect(Array.from(cajas).map((c) => c.getAttribute('data-linea'))).toEqual(['1', '2', '3', '4']);
    expect(textoDeLaCapa(capa())).toBe(programa);
  });

  it('el CSS no vuelve a declarar ninguna medida sobre esas dos clases', () => {
    /* La métrica va en línea desde una sola constante. Si alguien la escribe
     * también aquí, hay dos declaraciones que se pueden separar — y en cuanto
     * se separan, el texto de la capa deja de caer bajo el que se teclea. */
    const prohibidas = /(font-family|font-size|line-height|letter-spacing|padding|white-space|tab-size)\s*:/;
    const sinComentarios = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
    const sospechosas = Array.from(sinComentarios.matchAll(/([^{}]+)\{([^{}]*)\}/g))
      .filter(([, selector, cuerpo]) => /\.cod-(capa|area)\b/.test(selector) && prohibidas.test(cuerpo))
      .map(([, selector]) => selector.trim());
    expect(sospechosas).toEqual([]);
  });

});

describe('el teclado', () => {
  it('Tab mete espacios hasta la siguiente parada de cuatro, no cuatro a secas', () => {
    expect(conTab('', 0, 0, false).texto).toBe('    ');
    expect(conTab('ab', 2, 2, false).texto).toBe('ab  ');
    expect(conTab('abcd', 4, 4, false).texto).toBe('abcd    ');
    expect(conTab('ab', 2, 2, false).desde).toBe(4);
  });

  it('con varias líneas seleccionadas sangra el bloque, y Mayús+Tab lo desangra', () => {
    const bloque = 'a = 1\n\nb = 2';
    const sangrado = conTab(bloque, 0, bloque.length, false);
    expect(sangrado.texto).toBe('    a = 1\n\n    b = 2');
    expect(conTab(sangrado.texto, 0, sangrado.texto.length, true).texto).toBe(bloque);
    expect(conTab('        x', 9, 9, true).texto).toBe('    x');
  });

  it('Enter hereda la sangría y mete un nivel más después de dos puntos', () => {
    expect(conEnter('    x = 1', 9, 9).texto).toBe('    x = 1\n    ');
    expect(conEnter('if x > 1:', 9, 9).texto).toBe('if x > 1:\n    ');
    expect(conEnter('    if x:  # nota', 17, 17).texto).toBe('    if x:  # nota\n        ');
  });

  it('Tab sangra dentro del editor, y Esc antes de Tab deja salir el foco', () => {
    const { area } = montar({ plantilla: 'x = 1' });
    area().setSelectionRange(0, 0);
    fireEvent.keyDown(area(), { key: 'Tab' });
    expect(area().value).toBe('    x = 1');

    fireEvent.keyDown(area(), { key: 'Escape' });
    fireEvent.keyDown(area(), { key: 'Tab' });
    /* Sin cambio en el texto: la tecla se la queda el navegador para mover el
     * foco, que es la única salida de aquí para quien no usa ratón. */
    expect(area().value).toBe('    x = 1');
  });
});

describe('las líneas bajo llave', () => {
  it('una línea con candado tiene que seguir diciendo lo mismo y ser la misma línea', () => {
    const llave = new Set([2]);
    expect(cambioPermitido('a\nb\nc', 'a\nb\ncd', llave)).toBe(true);
    expect(cambioPermitido('a\nb\nc', 'a\nB\nc', llave)).toBe(false);
    /* Meter una línea encima correría el candado a otro número, y el guion y
     * los errores hablan por número de línea. */
    expect(cambioPermitido('a\nb\nc', 'a\nnueva\nb\nc', llave)).toBe(false);
    expect(cambioPermitido('a\nb\nc', 'a\nb\nc\nnueva', llave)).toBe(true);
  });

  it('teclear sobre una línea con candado no cambia el editor y saca el aviso', () => {
    const { area, escribir } = montar({ plantilla: 'dado = 7\nresultado = 0', soloLectura: [1] });
    escribir('dado = 999\nresultado = 0');
    expect(area().value).toBe('dado = 7\nresultado = 0');
    expect(screen.getByTestId('cod-aviso').textContent).toContain('candado');
  });

  it('con soloLectura «todo» el editor es de sólo lectura y lo dice al teclear', () => {
    const { area } = montar({ plantilla: 'print("lee esto")', soloLectura: 'todo' });
    expect(area()).toHaveAttribute('readonly');
    fireEvent.keyDown(area(), { key: 'a' });
    expect(screen.getByTestId('cod-aviso').textContent).toContain('leerlo y ejecutarlo');
  });
});

describe('ejecutar de verdad', () => {
  it('▶ imprime en la consola y deja las variables en el panel', () => {
    const { ejecutar, salida } = montar({
      plantilla: 'nombre = "Sofi"\nedad = 14\nprint("Hola", nombre)',
      velocidad: 'rayo',
    });
    ejecutar();
    expect(salida()).toContain('Hola Sofi');
    const panel = screen.getByTestId('cod-variables').textContent ?? '';
    expect(panel).toContain('nombre');
    expect(panel).toContain('edad');
    expect(panel).toContain('14');
  });

  it('input() para el programa, la consola pregunta y al contestar sigue', () => {
    const { ejecutar, paso, salida } = montar({
      plantilla: 'n = input("¿Cómo te llamas? ")\nprint("Hola " + n)',
      velocidad: 'rayo',
    });
    ejecutar();
    expect(screen.getByTestId('cod-pregunta')).toBeInTheDocument();
    expect(salida()).toContain('¿Cómo te llamas?');
    expect(salida()).not.toContain('Hola');

    /* Y si no se contesta nunca: se queda esperando y nada más. Ni ▶ ni ⏭ se
     * la saltan, y ninguno de los dos mete un `None` en la variable. */
    ejecutar();
    paso();
    expect(screen.getByTestId('cod').getAttribute('data-fase')).toBe('esperando');
    expect(salida()).not.toContain('None');
    expect(screen.getByTestId('cod-aviso').textContent).toContain('Contesta abajo');

    fireEvent.change(screen.getByTestId('cod-entrada'), { target: { value: 'Sofi' } });
    fireEvent.click(screen.getByTestId('cod-responder'));
    expect(salida()).toContain('¿Cómo te llamas? Sofi');
    expect(salida()).toContain('Hola Sofi');
    expect(screen.queryByTestId('cod-pregunta')).toBeNull();
  });

  it('con las entradas ya preparadas por la clase, no pregunta nada y el programa corre entero', () => {
    const { ejecutar, salida } = montar({
      plantilla: 'a = int(input("dime un número: "))\nprint(a * 2)',
      entradas: ['21'],
      velocidad: 'rayo',
    });
    ejecutar();
    expect(screen.queryByTestId('cod-pregunta')).toBeNull();
    expect(salida()).toContain('42');
    expect(screen.getByTestId('cod').getAttribute('data-fase')).toBe('terminada');
  });

  it('el primer ⏭ enciende la línea 1 sin ejecutarla; los siguientes avanzan', () => {
    const { paso, salida, linea } = montar({ plantilla: 'a = 2\nb = 3\nprint(a + b)' });
    paso();
    expect(salida()).not.toContain('5');
    expect(linea(1)?.className).toContain('es-curso');
    expect(document.querySelector('[data-var="a"]')).toBeNull();

    paso();
    expect(linea(2)?.className).toContain('es-curso');
    expect(document.querySelector('[data-var="a"]')?.textContent).toContain('2');
    paso();
    paso();
    expect(salida()).toContain('5');
  });

  it('dentro de una función se ven sus variables locales y la pila de llamadas', () => {
    /* Es lo que hace que el ámbito local deje de ser una explicación: se ve. */
    const { ejecutar } = montar({
      plantilla: ['def doble(n):', '    resultado = n * 2', '    return resultado', '', 'print(doble(4))'].join('\n'),
      velocidad: 'rayo',
    });
    for (let i = 0; i < 4; i += 1) fireEvent.click(screen.getByTestId('cod-paso'));
    expect(document.querySelector('[data-var="n"]')?.getAttribute('data-ambito')).toBe('local');
    expect(screen.getByTestId('cod-pila').textContent).toContain('doble');
    ejecutar();
    expect(screen.getByTestId('cod-salida').textContent).toContain('8');
  });
});

describe('lo que aporta la clase, que es donde divergen las catorce', () => {
  it('el panel fijo, las herramientas y una salida propia entran sin tocar el armazón', () => {
    function MiPanel({ ejecucion, texto, senalarLinea }: PanelCodigoProps) {
      return (
        <button type="button" data-testid="mi-panel" onClick={() => senalarLinea(2)}>
          {`${texto.split('\n').length} líneas · ${ejecucion.salida.length} escritas`}
        </button>
      );
    }
    const tocadas: string[] = [];

    function Clase() {
      const cod = useCodigo({ plantilla: 'print("uno")\nprint("dos")', velocidad: 'rayo' });
      return (
        <VentanaCodigo
          codigo={cod}
          archivo="mio.py"
          panelFijo={{ titulo: 'Mi tabla', Cuerpo: MiPanel }}
          herramientas={[{ id: 'probar', etiqueta: 'Probar mis retos', onClick: () => tocadas.push('probar') }]}
          salida={(e) => <p data-testid="mi-salida">{e.salida.length} líneas escritas</p>}
        />
      );
    }
    render(<Clase />);

    expect(screen.getByTestId('cod-panel').textContent).toContain('Mi tabla');
    expect(screen.getByTestId('mi-panel').textContent).toBe('2 líneas · 0 escritas');

    fireEvent.click(screen.getByTestId('cod-ejecutar'));
    expect(screen.getByTestId('mi-panel').textContent).toBe('2 líneas · 2 escritas');
    /* La salida propia de la clase NO tapa la consola: `print` sigue
     * escribiendo y los errores siguen saliendo por ahí. */
    expect(screen.getByTestId('mi-salida').textContent).toBe('2 líneas escritas');
    expect(screen.getByTestId('cod-salida').textContent).toContain('dos');

    fireEvent.click(screen.getByText('Probar mis retos'));
    expect(tocadas).toEqual(['probar']);

    /* Y el panel puede llevar el cursor del alumno a una línea del editor. */
    fireEvent.click(screen.getByTestId('mi-panel'));
    expect(screen.getByTestId('cod-area')).toHaveFocus();
    expect((screen.getByTestId('cod-area') as HTMLTextAreaElement).selectionStart).toBe(13);
  });
});

describe('los errores, que son material de clase', () => {
  it('un error de sintaxis se enseña con su línea, su pista y su nombre en inglés', () => {
    const { ejecutar, linea } = montar({ plantilla: 'x = 1\nif x > 0\n    print("sí")', velocidad: 'rayo' });
    ejecutar();
    const caja = screen.getByTestId('cod-error');
    expect(caja.textContent).toContain('Línea 2');
    expect(caja.textContent).toContain('SyntaxError');
    expect(caja.textContent).toContain('Pista');
    expect(linea(2)?.className).toContain('es-error');
  });

  it('el eco de la línea culpable no ha derivado del que escribe el intérprete', () => {
    const fuente = 'total = 10\ncantidad = 0\nmedia = total / cantidad';
    const { ejecutar } = montar({ plantilla: fuente, velocidad: 'rayo' });
    ejecutar();
    expect(screen.getByTestId('cod-error').textContent).toContain('dividir entre cero');

    /* Las dos cadenas que pinta la caja del error tienen que aparecer tal cual
     * dentro de lo que devuelve `textoDeError`. Si una de las dos deriva, esto
     * se cae: es lo que ata las dos versiones sin duplicar la cuenta de los
     * tabuladores. */
    const eco = ecoDeLinea('a = 1\n\tmedia = 10 / 0', 2, 10);
    const plano = textoDeError(
      { clase: 'division', mensaje: 'x', linea: 2, columna: 10, pista: null, familia: 'ZeroDivisionError' },
      'a = 1\n\tmedia = 10 / 0',
    );
    expect(plano).toContain(eco?.codigo);
    expect(plano).toContain(eco?.dedo);
  });

  it('tocar el editor borra el error viejo pero deja la salida en la consola', () => {
    const { ejecutar, escribir, salida } = montar({
      plantilla: 'print("voy bien")\nprint(1 / 0)',
      velocidad: 'rayo',
    });
    ejecutar();
    expect(screen.getByTestId('cod-error')).toBeInTheDocument();
    escribir('print("voy bien")\nprint(1 / 2)');
    /* Un error que señala la línea 7 de un programa al que le acabas de meter
     * dos líneas manda a mirar donde no es. */
    expect(screen.queryByTestId('cod-error')).toBeNull();
    expect(salida()).toContain('voy bien');
  });
});

describe('jugando mal a propósito', () => {
  it('el editor vacío no rompe nada, y pulsar ▶ tres veces no ejecuta tres veces', () => {
    const vacio = montar({ plantilla: '', velocidad: 'rayo' });
    vacio.ejecutar();
    expect(screen.queryByTestId('cod-error')).toBeNull();
    expect(vacio.salida()).toContain('Aquí sale lo que tu programa escriba');
    expect(screen.getByTestId('cod').getAttribute('data-fase')).toBe('terminada');

    vacio.escribir('print("una vez")');
    vacio.ejecutar();
    vacio.ejecutar();
    vacio.ejecutar();
    expect(vacio.salida().match(/una vez/g)).toHaveLength(1);
  });

  it('⏭ mil veces no cuelga, no acumula salida, y después del final vuelve a empezar', () => {
    /* Antes ⏭ se apagaba al terminar el programa, y entonces el único botón
     * vivo era ↺ — que borra lo que el alumno escribió—. O sea: ejecutar el
     * programa y luego querer verlo despacio era un callejón sin salida, justo
     * en el motor cuyo paso a paso es la mitad de su valor. Ahora ⏭ después
     * del final **empieza otra vez**, en pausa y con la línea 1 encendida. */
    const { paso, salida } = montar({ plantilla: 'print("fin")' });
    act(() => {
      for (let i = 0; i < 1000; i += 1) fireEvent.click(screen.getByTestId('cod-paso'));
    });
    /* Mil clics sobre un programa de una línea son quinientas vueltas enteras,
     * y la consola sigue enseñando una sola: cada vuelta arranca de cero. */
    expect(salida().match(/fin/g)).toHaveLength(1);
    expect(screen.getByTestId('cod-paso')).not.toBeDisabled();

    paso();
    expect(screen.getByTestId('cod').getAttribute('data-fase')).toBe('pausada');
    expect(salida()).not.toContain('fin');
    paso();
    expect(salida().match(/fin/g)).toHaveLength(1);
  });

  it('con el reloj en marcha el bucle avanza, no se puede escribir, y ⏹ lo corta', () => {
    jest.useFakeTimers();
    try {
      const { parar, ejecutar, escribir, area } = montar({
        plantilla: 'a = 0\nwhile True:\n    a = a + 1',
        velocidad: 'normal',
      });
      /* Parar sin haber arrancado es el botón que más se pulsa por si acaso: no
       * avisa de nada y deja el editor como estaba. */
      parar();
      expect(screen.queryByTestId('cod-error')).toBeNull();
      expect(area()).not.toHaveAttribute('readonly');

      ejecutar();
      expect(area()).toHaveAttribute('readonly');

      /* El bucle infinito corre a ratos y la pestaña sigue viva: cada tic del
       * reloj adelanta un puñado de sentencias y repinta. */
      act(() => {
        jest.advanceTimersByTime(200);
      });
      const vueltas = Number(document.querySelector('[data-var="a"] .cod-var-valor')?.textContent);
      expect(vueltas).toBeGreaterThan(0);

      fireEvent.keyDown(area(), { key: 'x' });
      escribir('otra cosa');
      expect(area().value).toContain('while True:');
      expect(screen.getByTestId('cod-aviso').textContent).toContain('⏹');

      parar();
      act(() => {
        jest.advanceTimersByTime(500);
      });
      const paradas = Number(document.querySelector('[data-var="a"] .cod-var-valor')?.textContent);
      expect(paradas).toBe(vueltas);
      expect(area()).not.toHaveAttribute('readonly');
      expect(screen.getByTestId('cod').getAttribute('data-fase')).toBe('detenida');
    } finally {
      jest.useRealTimers();
    }
  });

  it('«while True» se corta con el tope y lo cuenta como bucle infinito', () => {
    const { ejecutar } = montar({
      plantilla: 'x = 0\nwhile True:\n    x = x + 1',
      velocidad: 'rayo',
      topes: { PASOS: 5000 },
    });
    ejecutar();
    const caja = screen.getByTestId('cod-error').textContent ?? '';
    expect(caja).toContain('bucle infinito');
    expect(caja).toContain('«while»');
  });

  it('pegar quinientas líneas deja el editor cuadrado, y los saltos de Windows se normalizan', () => {
    const { escribir, area, capa } = montar({ plantilla: 'x = 1', velocidad: 'rayo' });
    const pegote = Array.from({ length: 500 }, (_, i) => `print(${i})`).join('\n');
    escribir(pegote);
    expect(capa().querySelectorAll('[data-linea]')).toHaveLength(500);
    expect(textoDeLaCapa(capa())).toBe(pegote);
    expect(document.querySelectorAll('[data-num]')).toHaveLength(500);

    /* Y lo que se pega de Windows llega con `\r\n`. Sin normalizarlo, el
     * editor cuenta una cosa y el intérprete otra: el error saldría señalado
     * en la línea equivocada, que es lo que este armazón existe para no hacer. */
    escribir('a = 1\r\nb = 2\r\nc = 0\r\nprint(a / c)');
    expect(area().value).toBe('a = 1\nb = 2\nc = 0\nprint(a / c)');
    expect(capa().querySelectorAll('[data-linea]')).toHaveLength(4);
    fireEvent.click(screen.getByTestId('cod-ejecutar'));
    expect(screen.getByTestId('cod-error').textContent).toContain('Línea 4');
  });
});

describe('el guion de la clase, que es quien corrige', () => {
  const GUION: GuionCodigo = {
    pasos: [
      {
        id: 'saluda',
        titulo: 'Saluda con print',
        instruccion: 'Escribe un print que salude.',
        pista: 'Se escribe print("Hola").',
        senal: { linea: 1 },
        logro: { tipo: 'ejecucion', comprueba: (e) => e.salida.some((l) => l.includes('Hola')) },
        aprendido: 'Ya sabes hacer que el programa hable.',
      },
      {
        id: 'cual',
        titulo: '¿Quién escribe en la consola?',
        instruccion: 'Elige la respuesta correcta.',
        pista: 'La que escribe es print.',
        logro: { tipo: 'eleccion', opciones: ['input', 'print'], correcta: 1 },
        aprendido: 'print escribe; input pregunta.',
      },
    ],
  };

  it('cierra el encargo con el predicado de la clase, avisa del avance y del final', () => {
    const avances: number[] = [];
    const terminados: number[] = [];
    const { ejecutar } = montar({
      plantilla: 'print("Hola")',
      velocidad: 'rayo',
      guion: GUION,
      onAvance: (a) => avances.push(a),
      onTerminado: (r) => terminados.push(r.encargos),
    });
    expect(screen.getByTestId('cod-encargo').getAttribute('data-paso')).toBe('saluda');
    ejecutar();
    expect(screen.getByTestId('cod-logrado').textContent).toContain('Ya sabes hacer que el programa hable');
    expect(avances).toEqual([0.5]);

    fireEvent.click(screen.getByText('Siguiente encargo →'));
    fireEvent.click(screen.getByText('input', { selector: 'button' }));
    expect(screen.getByTestId('cod-pista').textContent).toContain('La que escribe es print');
    fireEvent.click(screen.getByText('print', { selector: 'button' }));
    expect(avances).toEqual([0.5, 1]);
    expect(terminados).toEqual([2]);
  });

  it('el encargo señala el control del que habla, y el aro se apaga al conseguirlo', () => {
    /* `SenalCodigo.control` prometía «el botón se ilumina» y no lo pintaba
     * nadie: la ventana sólo leía `senal.linea`. Un campo del tipo que el que
     * pinta ignora es peor que no tenerlo, porque quien escribe la clase lo
     * rellena creyendo que sirve. */
    const conSenal: GuionCodigo = {
      pasos: [
        {
          ...GUION.pasos[0],
          senal: { control: 'ejecutar', linea: 1 },
        },
        GUION.pasos[1],
      ],
    };
    const { ejecutar } = montar({ plantilla: 'print("Hola")', velocidad: 'rayo', guion: conSenal });
    expect(screen.getByTestId('cod').getAttribute('data-senal')).toBe('ejecutar');
    /* Y la línea se sigue señalando a la vez: son dos señales, no una. */
    expect(screen.getByTestId('cod-capa').querySelector('[data-linea="1"]')?.className).toContain('es-senalada');

    ejecutar();
    expect(screen.getByTestId('cod').getAttribute('data-senal')).toBe('');
  });

  it('la pista sale sola cuando el programa acaba sin cerrar el encargo', () => {
    const { ejecutar, escribir } = montar({ plantilla: 'print("adiós")', velocidad: 'rayo', guion: GUION });
    expect(screen.queryByTestId('cod-pista')).toBeNull();
    ejecutar();
    expect(screen.getByTestId('cod-pista').textContent).toContain('print("Hola")');
    escribir('print("Hola")');
    fireEvent.click(screen.getByTestId('cod-ejecutar'));
    expect(screen.queryByTestId('cod-pista')).toBeNull();
  });

  it('un predicado de la clase que revienta no tumba la pantalla', () => {
    const roto: GuionCodigo = {
      pasos: [
        {
          id: 'roto',
          titulo: 'Encargo con un fallo en su comprueba',
          instruccion: 'Da igual lo que hagas.',
          pista: '—',
          logro: {
            tipo: 'ejecucion',
            comprueba: (e) => e.salida[3].includes('lo que sea'),
          },
          aprendido: '—',
        },
      ],
    };
    const { ejecutar } = montar({ plantilla: 'print("una")', velocidad: 'rayo', guion: roto });
    ejecutar();
    expect(screen.getByTestId('cod-encargo')).toBeInTheDocument();
    expect(screen.getByTestId('cod-aviso').textContent).toContain('no se pudo comprobar');
  });
});
