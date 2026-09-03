import { fireEvent, render, screen } from '@testing-library/react';
import type { ActivityProps, ActivityResult } from '@/types/activity-contract';
import { LabBinarioYUnidades } from '../LabBinarioYUnidades';
import {
  BITS_APAGADOS,
  CHAPAS_BARAJADAS,
  ESCALERA,
  NUMEROS,
  OBJETOS,
  TOTAL_PASOS,
  VALORES_POSICION,
  aBinario,
  aDecimal,
  alternar,
  bytesDelSistema,
  descomposicion,
  escalonDe,
  indiceDe,
  pistaDiferencia,
  textoBinario,
} from '../consolaBits';

/**
 * N7·U1·parada 2 — «Binario y unidades».
 *
 * Dos mitades, y las dos hacen falta. La primera prueba la aritmética **sin
 * montar React**: es toda función pura, así que no necesita DOM (patrón de la
 * casa, `COMO-SE-CONSTRUYE.md` §1). La segunda **recorre la clase de punta a
 * punta hasta la pantalla de cierre**, que es la lección más cara del proyecto
 * —«el motor sólo está probado hasta donde llegan las clases que se han
 * jugado»—, y la juega MAL a propósito: fijar valores equivocados, el doble
 * clic accidental, la misma chapa tres veces, y una partida pésima que aun así
 * tiene que poder terminarse.
 *
 * No hay ni una prueba de arrastre, a propósito: `jsdom` construye un `Event`
 * pelado y pierde `clientX`/`clientY` en silencio (canon §5.1). Por eso la
 * mecánica entera es de clics sobre datos discretos.
 */

describe('consolaBits · la aritmética, sin DOM', () => {
  it('ida y vuelta para los 256 valores de un byte', () => {
    for (let n = 0; n <= 255; n += 1) {
      expect(aDecimal(aBinario(n))).toBe(n);
    }
    // La carga es real, no tres combinaciones: se comprobaron los 256.
    expect(VALORES_POSICION.reduce((a, b) => a + b, 0)).toBe(255);
  });

  it('escribe los cinco números de la clase como los enseña la teoría', () => {
    expect(textoBinario(aBinario(5))).toBe('00000101');
    expect(textoBinario(aBinario(10))).toBe('00001010');
    expect(textoBinario(aBinario(37))).toBe('00100101');
    expect(textoBinario(aBinario(65))).toBe('01000001');
    expect(textoBinario(aBinario(255))).toBe('11111111');
  });

  it('un byte no admite números fuera de 0–255: se recortan al rango', () => {
    expect(aDecimal(aBinario(-7))).toBe(0);
    expect(aDecimal(aBinario(300))).toBe(255);
    expect(aDecimal(aBinario(9.8))).toBe(9);
  });

  it('alternar devuelve EL MISMO objeto cuando el índice cae fuera del byte', () => {
    expect(alternar(BITS_APAGADOS, 8)).toBe(BITS_APAGADOS);
    expect(alternar(BITS_APAGADOS, -1)).toBe(BITS_APAGADOS);
    expect(alternar(BITS_APAGADOS, 1.5)).toBe(BITS_APAGADOS);
    expect(alternar(BITS_APAGADOS, 0)).not.toBe(BITS_APAGADOS);
    expect(aDecimal(alternar(BITS_APAGADOS, 0))).toBe(128);
  });

  it('alternar no muta el byte que recibe', () => {
    const antes = textoBinario(BITS_APAGADOS);
    alternar(BITS_APAGADOS, 3);
    expect(textoBinario(BITS_APAGADOS)).toBe(antes);
  });

  it('la descomposición es la suma que el alumno tiene que ver escrita', () => {
    expect(descomposicion(aBinario(37))).toBe('32 + 4 + 1');
    expect(descomposicion(aBinario(65))).toBe('64 + 1');
    expect(descomposicion(BITS_APAGADOS)).toBe('0');
  });

  it('la pista de error es direccional: dice cuánto falta o cuánto sobra', () => {
    expect(pistaDiferencia(32, 37)).toContain('te faltan 5');
    expect(pistaDiferencia(40, 37)).toContain('te sobran 3');
    expect(pistaDiferencia(37, 37)).toBe('');
  });

  it('la escalera es estrictamente creciente y el bit vale menos que el byte', () => {
    for (let i = 1; i < ESCALERA.length; i += 1) {
      expect(ESCALERA[i].bytes).toBeGreaterThan(ESCALERA[i - 1].bytes);
    }
    expect(ESCALERA[0].bytes).toBe(1 / 8);
  });

  it('la charola trae las seis chapas y NO en orden ascendente', () => {
    expect([...CHAPAS_BARAJADAS].sort()).toEqual([...ESCALERA.map((p) => p.id)].sort());
    const ordenada = ESCALERA.map((p) => p.id);
    expect(CHAPAS_BARAJADAS).not.toEqual(ordenada);
    // Ni la primera chapa de la charola es la respuesta: si lo fuera, el
    // encargo se resolvería pulsando de izquierda a derecha sin pensar.
    expect(CHAPAS_BARAJADAS[0]).not.toBe(ordenada[0]);
  });

  it('cada objeto de la ronda 3 cae en el escalón que la clase enseña', () => {
    expect(escalonDe(OBJETOS[0].bytes).id).toBe('byte');
    expect(escalonDe(OBJETOS[1].bytes).id).toBe('mb');
    expect(escalonDe(OBJETOS[2].bytes).id).toBe('gb');
    expect(escalonDe(OBJETOS[3].bytes).id).toBe('tb');
    // Y ninguno cae en el mismo escalón que otro: cuatro objetos, cuatro pisos.
    const escalones = OBJETOS.map((o) => escalonDe(o.bytes).id);
    expect(new Set(escalones).size).toBe(OBJETOS.length);
  });

  it('el 465 del disco se calcula, no está escrito a mano', () => {
    expect(bytesDelSistema(500)).toBe(465);
    expect(bytesDelSistema(1000)).toBe(931);
    expect(bytesDelSistema(1)).toBe(0);
  });

  it('indiceDe ubica cada peldaño y devuelve −1 para lo que no existe', () => {
    expect(indiceDe('bit')).toBe(0);
    expect(indiceDe('tb')).toBe(ESCALERA.length - 1);
    expect(indiceDe('pb')).toBe(-1);
  });

  it('los encargos suman 16: cinco números, seis chapas, cuatro objetos y el disco', () => {
    expect(TOTAL_PASOS).toBe(16);
    expect(NUMEROS).toHaveLength(5);
    expect(ESCALERA).toHaveLength(6);
    expect(OBJETOS).toHaveLength(4);
  });
});

// ── El recorrido de punta a punta ────────────────────────────────────────

function crearProps() {
  const progreso: number[] = [];
  const puntajes: number[] = [];
  const resultados: ActivityResult[] = [];
  const props: ActivityProps = {
    config: {},
    onProgress: (p) => progreso.push(p),
    onScore: (s) => puntajes.push(s),
    onComplete: (r) => resultados.push(r),
  };
  return { props, progreso, puntajes, resultados };
}

const pulsar = (nombre: string | RegExp) => fireEvent.click(screen.getByRole('button', { name: nombre }));

const interruptor = (valor: number) => `Interruptor de valor ${valor}`;

/** Sube los interruptores que forman `n` partiendo de todo apagado. */
function formar(n: number) {
  aBinario(n).forEach((encendido, i) => {
    if (encendido) pulsar(interruptor(VALORES_POSICION[i]));
  });
}

/** Ronda 1 completa y sin errores; deja la clase en la escalera. */
function jugarNumeros() {
  NUMEROS.forEach((reto, i) => {
    formar(reto.objetivo);
    pulsar(/^Fijar/);
    pulsar(i + 1 < NUMEROS.length ? 'Siguiente número' : 'Pasar a las unidades');
  });
}

function jugarEscalera() {
  ESCALERA.forEach((p) => pulsar(`Colocar ${p.nombre} (${p.abrev})`));
}

function jugarPesos() {
  OBJETOS.forEach((o) => {
    const destino = escalonDe(o.bytes);
    pulsar(`Elegir ${destino.nombre} (${destino.abrev})`);
  });
}

function jugarDisco() {
  pulsar(/1 024 en 1 024/);
}

describe('LabBinarioYUnidades · el recorrido completo', () => {
  it('una partida perfecta se puede terminar, saca 100 y tres estrellas', () => {
    const { props, progreso, resultados } = crearProps();
    render(<LabBinarioYUnidades {...props} />);

    pulsar('Encender la consola');
    jugarNumeros();
    jugarEscalera();
    jugarPesos();
    jugarDisco();
    pulsar('Terminar');

    expect(resultados).toHaveLength(1);
    expect(resultados[0]).toMatchObject({ score: 100, stars: 3, xp: 100, errores: 0 });
    expect(progreso[progreso.length - 1]).toBe(1);
    // Los 16 encargos avanzaron uno a uno, ninguno de dos en dos.
    expect(progreso.slice(0, TOTAL_PASOS)).toEqual(
      Array.from({ length: TOTAL_PASOS }, (_, i) => (i + 1) / TOTAL_PASOS),
    );
    expect(screen.getByText(/LECTOR DE BITS/)).toBeInTheDocument();
  });

  it('el camino de salida existe y funciona en la pantalla de cierre', () => {
    const { props } = crearProps();
    const alSalir = jest.fn();
    render(<LabBinarioYUnidades {...props} alSalir={alSalir} />);

    pulsar('Encender la consola');
    jugarNumeros();
    jugarEscalera();
    jugarPesos();
    jugarDisco();
    pulsar('Terminar');
    pulsar('Salir');

    expect(alSalir).toHaveBeenCalledTimes(1);
  });

  it('mover interruptores no cuesta puntaje: explorar es como se aprende', () => {
    const { props, puntajes } = crearProps();
    render(<LabBinarioYUnidades {...props} />);
    pulsar('Encender la consola');

    for (let vuelta = 0; vuelta < 4; vuelta += 1) {
      VALORES_POSICION.forEach((v) => pulsar(interruptor(v)));
    }

    expect(puntajes).toHaveLength(0);
    expect(screen.getByTestId('display-decimal')).toHaveTextContent('0');
  });

  it('el display suma en vivo mientras se mueven los interruptores', () => {
    const { props } = crearProps();
    render(<LabBinarioYUnidades {...props} />);
    pulsar('Encender la consola');

    pulsar(interruptor(32));
    pulsar(interruptor(4));
    pulsar(interruptor(1));

    expect(screen.getByTestId('display-decimal')).toHaveTextContent('37');
    expect(screen.getByTestId('display-binario')).toHaveTextContent('00100101');
  });

  it('fijar un valor equivocado resta una vez y deja los interruptores como estaban', () => {
    const { props, puntajes } = crearProps();
    render(<LabBinarioYUnidades {...props} />);
    pulsar('Encender la consola');

    formar(3); // se pide 5
    pulsar(/^Fijar/);

    expect(puntajes).toEqual([94]);
    expect(screen.getByTestId('display-decimal')).toHaveTextContent('3');
    expect(screen.getByText(/te faltan 2/)).toBeInTheDocument();
    // No bloquea: el botón bueno sigue ahí y se corrige (3 − 2 + 4 = 5).
    pulsar(interruptor(2));
    pulsar(interruptor(4));
    pulsar(/^Fijar/);
    expect(screen.getByText(/Correcto: 5 = 4 \+ 1/)).toBeInTheDocument();
  });

  it('el doble clic en Fijar con el MISMO valor equivocado no resta dos veces', () => {
    const { props, puntajes } = crearProps();
    render(<LabBinarioYUnidades {...props} />);
    pulsar('Encender la consola');

    formar(3);
    pulsar(/^Fijar/);
    pulsar(/^Fijar/);
    pulsar(/^Fijar/);

    expect(puntajes).toEqual([94]);
  });

  it('...pero un error DISTINTO sí vuelve a restar', () => {
    const { props, puntajes } = crearProps();
    render(<LabBinarioYUnidades {...props} />);
    pulsar('Encender la consola');

    formar(3);
    pulsar(/^Fijar/);
    pulsar(interruptor(4)); // ahora vale 7
    pulsar(/^Fijar/);

    expect(puntajes).toEqual([94, 88]);
  });

  it('al acertar, Fijar desaparece: el doble clic sobre un acierto es imposible', () => {
    const { props, progreso } = crearProps();
    render(<LabBinarioYUnidades {...props} />);
    pulsar('Encender la consola');

    formar(5);
    pulsar(/^Fijar/);

    expect(screen.queryByRole('button', { name: /^Fijar/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Siguiente número' })).toBeInTheDocument();
    expect(progreso).toEqual([1 / TOTAL_PASOS]);
  });

  it('los interruptores quedan bloqueados mientras el número está confirmado', () => {
    const { props } = crearProps();
    render(<LabBinarioYUnidades {...props} />);
    pulsar('Encender la consola');

    formar(5);
    pulsar(/^Fijar/);
    pulsar(interruptor(128)); // no debe hacer nada

    expect(screen.getByTestId('display-decimal')).toHaveTextContent('5');
  });

  it('el 65 enseña ASCII en el mismo gesto en que se forma', () => {
    const { props } = crearProps();
    render(<LabBinarioYUnidades {...props} />);
    pulsar('Encender la consola');

    NUMEROS.slice(0, 3).forEach((reto) => {
      formar(reto.objetivo);
      pulsar(/^Fijar/);
      pulsar('Siguiente número');
    });
    formar(65);
    pulsar(/^Fijar/);

    expect(screen.getByText(/A mayúscula/)).toBeInTheDocument();
    expect(screen.getByText(/ASCII/)).toBeInTheDocument();
  });

  it('la chapa colocada sale de la charola: no se puede contar dos veces', () => {
    const { props, progreso } = crearProps();
    render(<LabBinarioYUnidades {...props} />);
    pulsar('Encender la consola');
    jugarNumeros();

    pulsar('Colocar bit (b)');

    expect(screen.queryByRole('button', { name: 'Colocar bit (b)' })).not.toBeInTheDocument();
    expect(progreso).toHaveLength(NUMEROS.length + 1);
  });

  it('la misma chapa equivocada tres veces resta una vez y no bloquea a la buena', () => {
    const { props, puntajes } = crearProps();
    render(<LabBinarioYUnidades {...props} />);
    pulsar('Encender la consola');
    jugarNumeros();

    pulsar('Colocar terabyte (TB)');
    pulsar('Colocar terabyte (TB)');
    pulsar('Colocar terabyte (TB)');
    expect(puntajes).toEqual([94]);

    pulsar('Colocar megabyte (MB)'); // otro error, sí cuenta
    expect(puntajes).toEqual([94, 88]);

    pulsar('Colocar bit (b)'); // la buena sigue disponible
    expect(screen.queryByRole('button', { name: 'Colocar bit (b)' })).not.toBeInTheDocument();
  });

  it('elegir un escalón demasiado pequeño dice «sube», y demasiado grande dice «baja»', () => {
    const { props } = crearProps();
    render(<LabBinarioYUnidades {...props} />);
    pulsar('Encender la consola');
    jugarNumeros();
    jugarEscalera();

    // Objeto 1: un mensaje de texto (byte). Un terabyte es pasarse.
    pulsar('Elegir terabyte (TB)');
    expect(screen.getByText(/Baja de escalón/)).toBeInTheDocument();

    pulsar('Elegir byte (B)');
    // Objeto 2: una canción (MB). Un kilobyte se queda corto.
    pulsar('Elegir kilobyte (KB)');
    expect(screen.getByText(/Sube de escalón/)).toBeInTheDocument();
  });

  it('la respuesta plausible del disco (el SO ocupó el espacio) se refuta, no se castiga en seco', () => {
    const { props, puntajes } = crearProps();
    render(<LabBinarioYUnidades {...props} />);
    pulsar('Encender la consola');
    jugarNumeros();
    jugarEscalera();
    jugarPesos();

    pulsar(/El sistema operativo ya ocupó/);
    expect(puntajes).toEqual([94]);
    expect(screen.getByText(/recién sacado de la caja/)).toBeInTheDocument();

    // Y la buena sigue ahí: el error nunca bloquea.
    jugarDisco();
    expect(screen.getByRole('button', { name: 'Terminar' })).toBeInTheDocument();
  });

  it('la escalera construida en la ronda 2 sigue en pie al final: nada la deshace', () => {
    const { props } = crearProps();
    render(<LabBinarioYUnidades {...props} />);
    pulsar('Encender la consola');
    jugarNumeros();
    jugarEscalera();
    jugarPesos();
    jugarDisco();

    ESCALERA.forEach((p) => {
      expect(screen.getByText(p.factor)).toBeInTheDocument();
    });
    expect(screen.getByText(/465 GB/)).toBeInTheDocument();
  });

  it('una partida pésima toca el piso 60 y AUN ASÍ se puede terminar', () => {
    const { props, resultados } = crearProps();
    render(<LabBinarioYUnidades {...props} />);
    pulsar('Encender la consola');

    // Siete valores equivocados distintos sobre el primer número (se pide 5).
    [128, 64, 32, 16, 8, 4, 2].forEach((v) => {
      pulsar(interruptor(v));
      pulsar(/^Fijar/);
      pulsar(interruptor(v));
    });

    jugarNumeros();
    jugarEscalera();
    jugarPesos();
    jugarDisco();
    pulsar('Terminar');

    expect(resultados[0].errores).toBe(7);
    expect(resultados[0].score).toBe(60); // 100 − 42 = 58, con piso 60
    expect(resultados[0].stars).toBe(3);
  });

  it('el tiempo que reporta es el jugado de verdad, no un número inventado', () => {
    const { props, resultados } = crearProps();
    render(<LabBinarioYUnidades {...props} />);
    pulsar('Encender la consola');
    jugarNumeros();
    jugarEscalera();
    jugarPesos();
    jugarDisco();
    pulsar('Terminar');

    const t = resultados[0].tiempoSegundos ?? -1;
    expect(t).toBeGreaterThanOrEqual(0);
    // Los números inventados que documenta el canon serían 320 (pasos·20) o 400.
    expect(t).toBeLessThan(60);
  });
});
