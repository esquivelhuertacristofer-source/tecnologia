/**
 * `n5-conecta-perifericos` · N5·U1 «El sistema de cómputo», parada 2 (§53.1).
 * **10–11 años**, leído en `curriculo.ts`.
 *
 * Cómo está repartida esta suite, y por qué:
 *
 *  · **Lo que es geometría se prueba como geometría.** El banco —qué entra
 *    dónde, qué tolerancia tiene cada hueco, qué está bien puesto— son
 *    funciones puras de `bancoFisico.ts` con la tabla de `bancos.ts`, y se
 *    comprueban sin montar nada. jsdom no tiene WebGL: una prueba de arrastre a
 *    través del DOM sería una prueba de nada.
 *  · **Lo que es la clase se juega.** Sin WebGL el armazón monta su `respaldo`,
 *    que no es un mensaje de disculpa sino la clase entera con un botón por
 *    pieza y por hueco (`resolverSueltaEn`, «la puerta del teclado»). Por ahí
 *    se juega MAL a propósito y por ahí va el recorrido completo hasta la
 *    pantalla de cierre — la lección más cara del proyecto es que las pruebas
 *    unitarias verdes no impiden una clase imposible de terminar.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import EntradaConectaPerifericos from '@/components/activities/lab3d/EntradaConectaPerifericos';
import {
  BANCO_PERIFERICOS,
  CABLES,
  ESPERADO_PERIFERICOS,
  cableCorrecto,
  seisConectados,
} from '@/components/activities/lab3d/bancos';
import {
  ESTADO_VACIO,
  dondeEsta,
  evaluar,
  resolverSueltaEn,
  soltarEn,
  tomar,
  validarBanco,
} from '@/components/simuladores/laboratorio3d/bancoFisico';
import { CURRICULO } from '@/data/curriculo';
import type { ActivityResult } from '@/types/activity-contract';

const DEF = BANCO_PERIFERICOS;

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const utils = render(
    <EntradaConectaPerifericos config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />,
  );
  return { ...utils, onProgress, onScore, onComplete };
}

const entrar = () => fireEvent.click(screen.getByText('Entra al laboratorio 3D'));
const empezar = () => fireEvent.click(screen.getByTestId('lb3-empezar'));
const tomarCable = (etiqueta: string) =>
  fireEvent.click(screen.getByRole('button', { name: `Tomar el cable ${etiqueta}` }));
const conectar = (puerto: string) =>
  fireEvent.click(screen.getByRole('button', { name: `Conectar en el puerto ${puerto}` }));
const bitDice = () => document.querySelector('.bit-globo')?.textContent ?? '';
const marcador = () => document.querySelector('.marcador-led strong')?.textContent ?? '';

/** Entra, salta la portada y deja el laboratorio listo para jugar. */
function abrirLaboratorio() {
  const api = montar();
  entrar();
  empezar();
  return api;
}

const avanzar = async (ms: number) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
afterEach(() => jest.useRealTimers());

describe('n5-conecta-perifericos · el banco, en aritmética pura', () => {
  it('el nivel y la edad son los del currículo, no los del encargo', () => {
    const n5 = CURRICULO.find((n) => n.n === 5);
    const unidad = n5?.unidades.find((u) => u.id === 'n5-el-sistema-de-computo');
    expect(n5?.edad).toBe('10–11');
    expect(n5?.grado).toBe('5° de Primaria');
    expect(unidad?.actividades.map((a) => a.id)).toContain('n5-conecta-perifericos');
    expect(unidad?.actividades.find((a) => a.id === 'n5-conecta-perifericos')?.estado).toBe('disponible');
  });

  it('el banco no tiene defectos de autor: ningún hueco ambiguo y ningún cable sin destino', () => {
    // Sin esto, dos aros con las tolerancias solapadas dejan al alumno soltando
    // en un punto que cae dentro de los dos: no es dificultad, es lotería.
    expect(validarBanco(DEF)).toEqual([]);
    for (const cable of CABLES) {
      expect(DEF.piezas.some((p) => p.id === cable)).toBe(true);
      expect(DEF.anclajes.some((a) => a.id === ESPERADO_PERIFERICOS[cable])).toBe(true);
    }
  });

  it('la forma manda: el HDMI rebota en el VGA y en el USB, y no monta nada', () => {
    const enMano = tomar(DEF, ESTADO_VACIO, 'monitor');
    expect(resolverSueltaEn(DEF, enMano, 'vga')).toMatchObject({ tipo: 'rebota', motivo: 'forma' });
    expect(resolverSueltaEn(DEF, enMano, 'usb')).toMatchObject({ tipo: 'rebota', motivo: 'forma' });
    expect(resolverSueltaEn(DEF, enMano, 'hdmi')).toMatchObject({ tipo: 'encaja', anclaje: 'hdmi' });

    const rebotado = soltarEn(DEF, enMano, 'vga').estado;
    expect(rebotado.ocupacion).toEqual({});
    expect(rebotado.tomada).toBeNull();
  });

  it('los dos USB son un solo hueco de capacidad 2: da igual cuál en cuál', () => {
    // Castigar al alumno por poner el teclado en «el otro» USB sería castigarlo
    // por tener razón. Las dos repartidas son correctas.
    const usb = DEF.anclajes.find((a) => a.id === 'usb');
    expect(usb?.capacidad).toBe(2);

    let a = soltarEn(DEF, tomar(DEF, ESTADO_VACIO, 'teclado'), 'usb').estado;
    a = soltarEn(DEF, tomar(DEF, a, 'raton'), 'usb').estado;
    expect(a.ocupacion.usb).toEqual(['teclado', 'raton']);
    expect(evaluar(DEF, a, { teclado: 'usb', raton: 'usb' }).equivocadas).toEqual([]);

    let b = soltarEn(DEF, tomar(DEF, ESTADO_VACIO, 'raton'), 'usb').estado;
    b = soltarEn(DEF, tomar(DEF, b, 'teclado'), 'usb').estado;
    expect(evaluar(DEF, b, { teclado: 'usb', raton: 'usb' }).equivocadas).toEqual([]);
  });

  it('el jack ENTRA en los tres agujeros de audio y sólo el verde está bien', () => {
    // La lección central de la clase, y la razón de que el armazón no corrija:
    // «no entra» lo dice el aparato, «está mal» lo dice la tabla.
    for (const hueco of ['audio-verde', 'audio-rosa', 'audio-azul']) {
      expect(resolverSueltaEn(DEF, tomar(DEF, ESTADO_VACIO, 'bocinas'), hueco)).toMatchObject({
        tipo: 'encaja',
        anclaje: hueco,
      });
    }
    expect(cableCorrecto('bocinas', 'audio-verde')).toBe(true);
    expect(cableCorrecto('bocinas', 'audio-rosa')).toBe(false);
    expect(cableCorrecto('bocinas', 'audio-azul')).toBe(false);

    const enElRosa = soltarEn(DEF, tomar(DEF, ESTADO_VACIO, 'bocinas'), 'audio-rosa').estado;
    expect(dondeEsta(enElRosa, 'bocinas')).toBe('audio-rosa');
    expect(seisConectados(enElRosa)).toBe(false);
    expect(evaluar(DEF, enElRosa, ESPERADO_PERIFERICOS).equivocadas).toEqual([
      { pieza: 'bocinas', esta: 'audio-rosa', deberia: 'audio-verde' },
    ]);
  });
});

describe('n5-conecta-perifericos · la entrada y la portada', () => {
  it('la entrada dice lo de ESTA clase: seis cables, nueve puertos y la trampa del audio', () => {
    montar();
    expect(screen.getByText('Antes de tocar un cable')).toBeInTheDocument();
    expect(screen.getByText('¿Mete o saca información?')).toBeInTheDocument();
    expect(screen.getByText('Los dos USB son iguales')).toBeInTheDocument();
    expect(screen.getByText('Entra en tres y sólo uno sirve')).toBeInTheDocument();
    expect(screen.getByText('Cables')).toBeInTheDocument();
    expect(screen.getByText('Puertos')).toBeInTheDocument();
    // Y no habla de nada que esta clase no tenga: aquí no se arma un gabinete.
    expect(screen.queryByText(/disipador/i)).toBeNull();
  });

  it('al entrar recibe la página educativa y el simulador A LA VEZ, con fotos reales', () => {
    montar();
    entrar();
    // Las dos hojas, simultáneas: es el encargo literal del cliente.
    expect(document.querySelector('.lab2-pagina')).not.toBeNull();
    expect(document.querySelector('.lab2-sim .lab3d-sala')).not.toBeNull();
    // Fotografías de verdad, no un cuadro de texto gris.
    const fotos = Array.from(document.querySelectorAll('.pagina-edu img'));
    expect(fotos.length).toBeGreaterThanOrEqual(8);
    // Y sus créditos, que con licencias CC BY-SA no son opcionales.
    expect(screen.getByText('De dónde salen las fotos')).toBeInTheDocument();
    expect(screen.getAllByText(/Evan-Amos/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/CC BY-SA/).length).toBeGreaterThanOrEqual(3);
  });

  it('entrar sin saber el objetivo está declarado defecto: primero la portada', () => {
    montar();
    entrar();
    const portada = screen.getByTestId('lb3-portada');
    expect(portada).toHaveTextContent('Conecta los periféricos');
    expect(portada).toHaveTextContent('Al terminar');
    expect(portada).toHaveTextContent('Maestro del panel trasero');
    // Y el laboratorio no responde mientras la portada esté puesta: tomar un
    // cable con ella delante no hace nada, ni siquiera cambia el globo de Bit.
    const antes = bitDice();
    tomarCable('Monitor · HDMI');
    conectar('HDMI');
    expect(bitDice()).toBe(antes);
    expect(marcador()).toBe('0/6');

    empezar();
    expect(screen.queryByTestId('lb3-portada')).toBeNull();
    tomarCable('Monitor · HDMI');
    expect(bitDice()).toContain('HDMI');
  });
});

describe('n5-conecta-perifericos · jugando mal a propósito', () => {
  it('los tres desenlaces malos: forma, hueco ocupado y el vacío que no penaliza', () => {
    const { onScore } = abrirLaboratorio();

    // 1 · La forma. El HDMI no entra en el VGA y lo dice el aparato.
    tomarCable('Monitor · HDMI');
    conectar('VGA');
    expect(bitDice()).toContain('no son pareja');
    expect(onScore).toHaveBeenLastCalledWith(94);
    // El error nunca borra lo ya hecho ni deja la pieza pegada a la mano.
    expect(marcador()).toBe('0/6');
    expect(screen.getByRole('button', { name: 'Tomar el cable Monitor · HDMI' })).toBeInTheDocument();

    // 2 · El hueco que ya tiene lo suyo: la pieza que estaba no se mueve.
    tomarCable('Monitor · HDMI');
    conectar('HDMI');
    expect(marcador()).toBe('1/6');
    tomarCable('Red · RJ-45');
    conectar('HDMI');
    expect(marcador()).toBe('1/6');
    expect(screen.getByRole('button', { name: 'Tomar el cable Red · RJ-45' })).toBeInTheDocument();

    // 3 · Soltar en el vacío no es un error de contenido: en la vida tampoco.
    // Sin hueco cerca no hay nada que juzgar y el puntaje no se toca.
    const antes = onScore.mock.calls.length;
    expect(resolverSueltaEn(DEF, tomar(DEF, ESTADO_VACIO, 'teclado'), 'no-existe')).toEqual({ tipo: 'nada' });
    expect(onScore.mock.calls.length).toBe(antes);
  });

  it('el jack en el agujero rosa: entra de verdad, Bit dice de quién es, y sale solo', async () => {
    const { onScore } = abrirLaboratorio();
    tomarCable('Bocinas · jack 3,5 mm');
    conectar('Audio rosa');
    expect(bitDice()).toContain('micrófono');
    expect(onScore).toHaveBeenLastCalledWith(94);
    // Se queda dentro el tiempo justo de que se vea, y vuelve a la mesa: si se
    // rechazara de plano, la lección de «entra pero no es su sitio» se perdería.
    expect(screen.queryByRole('button', { name: 'Tomar el cable Bocinas · jack 3,5 mm' })).toBeNull();
    await avanzar(1600);
    expect(screen.getByRole('button', { name: 'Tomar el cable Bocinas · jack 3,5 mm' })).toBeInTheDocument();
    expect(marcador()).toBe('0/6');
  });

});

/** Los seis cables en su puerto: el camino bueno, de principio a fin. */
const RECORRIDO: [string, string][] = [
  ['Teclado · USB', 'USB (dos puertos)'],
  ['Ratón · USB', 'USB (dos puertos)'],
  ['Monitor · HDMI', 'HDMI'],
  ['Bocinas · jack 3,5 mm', 'Audio verde'],
  ['Red · RJ-45', 'Red'],
  ['Corriente', 'Toma de corriente'],
];

describe('n5-conecta-perifericos · recorrido completo', () => {
  it('de la entrada a la pantalla de cierre, jugando bien, cierra en 100 y sin errores', async () => {
    const { onComplete, onProgress, onScore } = abrirLaboratorio();

    RECORRIDO.forEach(([cable, puerto], i) => {
      tomarCable(cable);
      conectar(puerto);
      expect(marcador()).toBe(`${i + 1}/6`);
    });

    // Los seis puestos: la clase pasa sola a la ronda del encendido.
    await avanzar(1000);
    expect(bitDice()).toContain('palanca del regulador');
    expect(marcador()).toBe('0/1');

    fireEvent.click(screen.getByRole('button', { name: /Subir la palanca/ }));
    await avanzar(3000);

    const resultado = onComplete.mock.calls[0][0] as ActivityResult;
    expect(resultado.score).toBe(100);
    expect(resultado.errores).toBe(0);
    expect(resultado.stars).toBe(3);
    expect(onProgress).toHaveBeenLastCalledWith(1);
    expect(onScore).toHaveBeenLastCalledWith(100);

    // Y la pantalla de cierre existe de verdad, con su insignia y su resumen.
    expect(screen.getByText('Insignia · Maestro del panel trasero')).toBeInTheDocument();
    expect(screen.getByText('¡Equipo conectado y encendido!')).toBeInTheDocument();
    expect(screen.getByText('6/6')).toBeInTheDocument();
  });

  it('terminada, no queda nada que tocar, y «jugar otra vez» devuelve el banco a cero', async () => {
    const { onComplete } = abrirLaboratorio();
    for (const [cable, puerto] of RECORRIDO) {
      tomarCable(cable);
      conectar(puerto);
    }
    await avanzar(1000);
    fireEvent.click(screen.getByRole('button', { name: /Subir la palanca/ }));
    await avanzar(3000);

    // La pantalla final desmonta el lienzo entero: seguir tocando es imposible
    // porque no hay nada que tocar, y `onComplete` sólo suena una vez.
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: /Subir la palanca/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Tomar el cable/ })).toBeNull();

    fireEvent.click(screen.getByText('Jugar otra vez'));
    expect(marcador()).toBe('0/6');
    expect(screen.getByRole('button', { name: 'Tomar el cable Teclado · USB' })).toBeInTheDocument();
    // Y no se vuelve a pedir la portada: ya se leyó.
    expect(screen.queryByTestId('lb3-portada')).toBeNull();
  });
});
