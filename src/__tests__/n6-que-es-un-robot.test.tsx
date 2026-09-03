/**
 * `n6-que-es-un-robot` · N6 · U «Robótica y STEAM», parada 1 de 3
 * (DISEÑO-N6-que-es-un-robot.md). **11–12 años**, leído en `curriculo.ts`.
 *
 * Repartida como sus hermanas de `laboratorio3d`:
 *  · **Lo que es geometría se prueba como geometría** — los dos bancos, sus
 *    tablas de verdad y el guion de la prueba son funciones puras de
 *    `bancoRobot.ts`, comprobadas sin montar nada.
 *  · **Lo que es la clase se juega**, por el `respaldo` (jsdom no tiene
 *    WebGL): botones «Tomar»/«Sacar» por pieza y uno por hueco, exactamente
 *    lo que el canon pide para que el recorrido completo exista de verdad.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import EntradaQueEsUnRobot from '@/components/activities/lab3d/EntradaQueEsUnRobot';
import {
  BANCO_CHAROLAS,
  BANCO_ROBOT,
  BANCO_ROBOT_INICIAL,
  ESPERADO_CHAROLAS,
  ESPERADO_ROBOT,
  PIEZAS_ROBOT,
  PREGUNTA_SENSOR,
  robotSeDetiene,
} from '@/components/activities/lab3d/bancoRobot';
import {
  ESTADO_VACIO,
  dondeEsta,
  evaluar,
  montajeCompleto,
  resolverSueltaEn,
  soltarEn,
  tomar,
  validarBanco,
} from '@/components/simuladores/laboratorio3d/bancoFisico';
import { CURRICULO } from '@/data/curriculo';
import type { ActivityResult } from '@/types/activity-contract';

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const utils = render(
    <EntradaQueEsUnRobot config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />,
  );
  return { ...utils, onProgress, onScore, onComplete };
}

const entrar = () => fireEvent.click(screen.getByText('Entra al laboratorio 3D'));
const empezar = () => fireEvent.click(screen.getByTestId('lb3-empezar'));
const tomarPieza = (etiqueta: string) =>
  fireEvent.click(screen.getByRole('button', { name: `Tomar la pieza ${etiqueta}` }));
const sacarPieza = (etiqueta: string) =>
  fireEvent.click(screen.getByRole('button', { name: `Sacar la pieza ${etiqueta}` }));
const ponerEn = (etiqueta: string) => fireEvent.click(screen.getByRole('button', { name: `Poner en ${etiqueta}` }));
const bitDice = () => document.querySelector('.bit-globo')?.textContent ?? '';
const marcador = () => document.querySelector('.marcador-led strong')?.textContent ?? '';

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

// La secuencia perfecta, ronda por ronda: siete piezas clasificadas, luego
// montadas donde de verdad sirven.
function jugarRonda1Perfecta() {
  tomarPieza('Sensor de distancia');
  ponerEn('Charola · ENTRA');
  tomarPieza('Sensor de luz');
  ponerEn('Charola · ENTRA');
  tomarPieza('Sensor de línea');
  ponerEn('Charola · ENTRA');
  tomarPieza('Motor de rueda');
  ponerEn('Charola · SALE');
  tomarPieza('Zumbador');
  ponerEn('Charola · SALE');
  tomarPieza('Tarjeta controladora');
  ponerEn('Charola · DECIDE');
  tomarPieza('Pila');
  ponerEn('Bahía de la pila');
  fireEvent.click(screen.getByRole('button', { name: 'Subir el interruptor' }));
}

async function jugarRonda2Perfecta(sitioSensorDistancia: 'Frente del carrito' | 'Techo del carrito' = 'Frente del carrito') {
  await avanzar(900); // transición a la ronda 2
  // El anclaje que NO se usa para el sensor de distancia queda libre para el
  // de luz (cada anclaje de sensor tiene capacidad 1: si los dos apuntaran al
  // mismo hueco, el segundo rebotaría por "lleno" y nunca se montaría).
  const sitioLuz = sitioSensorDistancia === 'Frente del carrito' ? 'Techo del carrito' : 'Frente del carrito';
  tomarPieza('Sensor de distancia');
  ponerEn(sitioSensorDistancia);
  tomarPieza('Sensor de luz');
  ponerEn(sitioLuz);
  tomarPieza('Sensor de línea');
  ponerEn('Panza del carrito');
  tomarPieza('Motor de rueda');
  ponerEn('Rueda');
  tomarPieza('Zumbador');
  ponerEn('Torre');
  tomarPieza('Tarjeta controladora');
  ponerEn('Pecho del carrito');
}

describe('n6-que-es-un-robot · los dos bancos, en aritmética pura', () => {
  it('el nivel es el del currículo, no el del encargo', () => {
    const n6 = CURRICULO.find((n) => n.n === 6);
    const unidad = n6?.unidades.find((u) => u.id === 'n6-robotica-y-steam');
    expect(n6?.edad).toBe('11–12');
    expect(unidad?.actividades.map((a) => a.id)).toContain('n6-que-es-un-robot');
    expect(unidad?.actividades.find((a) => a.id === 'n6-que-es-un-robot')?.estado).toBe('disponible');
  });

  it('ningún banco tiene defectos de autor: ni huecos ambiguos ni piezas sin destino (riesgo nº 2)', () => {
    // La medida explícita del pliego: tolerancias solapadas es el único fallo
    // de `validarBanco` que no se ve leyendo el código.
    expect(validarBanco(BANCO_CHAROLAS)).toEqual([]);
    expect(validarBanco(BANCO_ROBOT)).toEqual([]);
    for (const pieza of PIEZAS_ROBOT) {
      expect(BANCO_CHAROLAS.piezas.some((p) => p.id === pieza)).toBe(true);
      expect(BANCO_ROBOT.piezas.some((p) => p.id === pieza)).toBe(true);
      expect(BANCO_CHAROLAS.anclajes.some((a) => a.id === ESPERADO_CHAROLAS[pieza])).toBe(true);
      expect(BANCO_ROBOT.anclajes.some((a) => a.id === ESPERADO_ROBOT[pieza])).toBe(true);
    }
  });

  it('las tres charolas aceptan TODOS los tipos: la clasificación equivocada tiene que poder hacerse', () => {
    // Meter la pila en una charola es un error real, no uno que impida el
    // aparato: sólo `bahia-pila` es exclusiva de la pila.
    const conPila = tomar(BANCO_CHAROLAS, ESTADO_VACIO, 'pila');
    expect(resolverSueltaEn(BANCO_CHAROLAS, conPila, 'charola-entra')).toMatchObject({ tipo: 'encaja' });
    expect(resolverSueltaEn(BANCO_CHAROLAS, tomar(BANCO_CHAROLAS, ESTADO_VACIO, 'motor'), 'bahia-pila')).toMatchObject({
      tipo: 'rebota',
      motivo: 'forma',
    });
  });

  it('la corrección sobre el pliego: motor y zumbador tienen sitio único, no "acepta actuador" compartido', () => {
    // Medido al construir: el pliego da `rueda`/`torre` con el mismo
    // `acepta: ['actuador']`, pero el encargo 6 exige exclusividad física
    // ("sólo la rueda acepta el motor"). Se corrigió a favor del encargo —
    // ver la nota de cabecera de `bancoRobot.ts`.
    const conMotor = tomar(BANCO_ROBOT, BANCO_ROBOT_INICIAL, 'motor');
    expect(resolverSueltaEn(BANCO_ROBOT, conMotor, 'torre')).toMatchObject({ tipo: 'rebota', motivo: 'forma' });
    expect(resolverSueltaEn(BANCO_ROBOT, conMotor, 'rueda')).toMatchObject({ tipo: 'encaja', anclaje: 'rueda' });

    const conZumbador = tomar(BANCO_ROBOT, BANCO_ROBOT_INICIAL, 'zumbador');
    expect(resolverSueltaEn(BANCO_ROBOT, conZumbador, 'rueda')).toMatchObject({ tipo: 'rebota', motivo: 'forma' });
    expect(resolverSueltaEn(BANCO_ROBOT, conZumbador, 'torre')).toMatchObject({ tipo: 'encaja', anclaje: 'torre' });
  });

  it('el sensor de distancia CABE en frente y en techo, y sólo frente hace que el robot se detenga', () => {
    // La trampa de la clase, la misma forma que los tres jacks de audio de
    // n5-conecta-perifericos: entra en varios, sólo uno sirve.
    const enTecho = soltarEn(BANCO_ROBOT, tomar(BANCO_ROBOT, BANCO_ROBOT_INICIAL, 'sensor-distancia'), 'techo').estado;
    expect(dondeEsta(enTecho, 'sensor-distancia')).toBe('techo');
    expect(robotSeDetiene(enTecho)).toBe(false);

    const enFrente = soltarEn(BANCO_ROBOT, tomar(BANCO_ROBOT, BANCO_ROBOT_INICIAL, 'sensor-distancia'), 'frente').estado;
    expect(robotSeDetiene(enFrente)).toBe(true);
  });

  it('la trampa de `montajeCompleto`: todo en una charola da `true` y aun así está mal clasificado', () => {
    // Exactamente la nota del pliego ("Lo que el armazón NO da", punto 6):
    // la clase nunca puede fiarse de `montajeCompleto` para decidir una ronda.
    let b = ESTADO_VACIO;
    for (const pieza of PIEZAS_ROBOT) {
      b = soltarEn(BANCO_CHAROLAS, tomar(BANCO_CHAROLAS, b, pieza), 'charola-entra').estado;
    }
    expect(montajeCompleto(BANCO_CHAROLAS, b)).toBe(true);
    expect(evaluar(BANCO_CHAROLAS, b, ESPERADO_CHAROLAS).completo).toBe(false);
  });

  it('la pregunta del encargo 9: la respuesta correcta es "meter información", no la forma ni el color', () => {
    expect(PREGUNTA_SENSOR.opciones[PREGUNTA_SENSOR.correcta]).toBe(
      'Que meta información del mundo hacia adentro del robot',
    );
  });
});

describe('n6-que-es-un-robot · la entrada y la portada', () => {
  it('la entrada dice lo de ESTA clase: siete piezas, la tarjeta y la trampa del sensor', () => {
    montar();
    expect(screen.getByText('Sensar, decidir, actuar')).toBeInTheDocument();
    expect(screen.getByText('¿Mete información o hace algo?')).toBeInTheDocument();
    expect(screen.getByText('La tarjeta no mide ni suena')).toBeInTheDocument();
    expect(screen.getByText('Cabe no es lo mismo que sirve')).toBeInTheDocument();
    expect(screen.getByText('La pila no es ni sensor ni actuador')).toBeInTheDocument();
    expect(screen.getByText('Piezas')).toBeInTheDocument();
    expect(screen.getByText('Insignia')).toBeInTheDocument();
    // La ruta nombra a las paradas 2 y 3 (viven en `bloques/`, no se editan
    // aquí), pero esta clase no es de programar: no hay ninguna ficha ni
    // detalle de "bloques" o "sombrero", que es vocabulario de esas paradas.
    expect(screen.getByText('Programa un micro:bit')).toBeInTheDocument();
    expect(screen.queryByText(/bloques|sombrero/i)).toBeNull();
  });

  it('sin video: el CTA es el primer botón y el laboratorio se monta de verdad (trampa 6 del canon)', () => {
    montar();
    // `assetsPendientes: true` deja `entrar()` como el primer <button> del
    // documento, así que llega hasta `window.matchMedia` sin tapar nada.
    entrar();
    expect(screen.getByTestId('lb3-portada')).toBeInTheDocument();
  });

  it('entrar sin saber el objetivo está declarado defecto: primero la portada, y no responde antes de leerla', () => {
    montar();
    entrar();
    const portada = screen.getByTestId('lb3-portada');
    expect(portada).toHaveTextContent('¿Qué es un robot?');
    expect(portada).toHaveTextContent('Al terminar');
    expect(portada).toHaveTextContent('Ojo de robot');

    const antes = bitDice();
    tomarPieza('Sensor de distancia');
    expect(bitDice()).toBe(antes);
    expect(marcador()).toBe('0/9');

    empezar();
    expect(screen.queryByTestId('lb3-portada')).toBeNull();
    tomarPieza('Sensor de distancia');
    expect(bitDice()).toContain('distancia');
  });
});

describe('n6-que-es-un-robot · jugando mal a propósito', () => {
  it('clasificar mal: resta, el aro se marca "mal" y la pieza vuelve sola a su charola', async () => {
    const { onScore } = abrirLaboratorio();
    tomarPieza('Motor de rueda');
    ponerEn('Charola · ENTRA'); // el motor SALE, no ENTRA: mal clasificado
    expect(bitDice()).toContain('mide');
    expect(onScore).toHaveBeenLastCalledWith(94);
    expect(marcador()).toBe('0/9');
    // El error no deja la pieza pegada ni desaparecida: sigue tomable, y tras
    // el aviso vuelve a la mesa (no queda montada en el sitio equivocado).
    await avanzar(1600);
    expect(screen.getByRole('button', { name: 'Tomar la pieza Motor de rueda' })).toBeInTheDocument();
  });

  it('la tarjeta mal clasificada tiene su propia línea, distinta de la genérica', async () => {
    const { onScore } = abrirLaboratorio();
    tomarPieza('Tarjeta controladora');
    ponerEn('Charola · ENTRA');
    expect(bitDice()).toContain('no se entera de nada por su cuenta');
    expect(onScore).toHaveBeenLastCalledWith(94);
    await avanzar(1600);
  });

  it('soltar en el vacío y en un hueco que no acepta: nunca se mueve lo ya montado (pura)', () => {
    expect(resolverSueltaEn(BANCO_CHAROLAS, tomar(BANCO_CHAROLAS, ESTADO_VACIO, 'pila'), 'no-existe')).toEqual({
      tipo: 'nada',
    });
    let b = soltarEn(BANCO_CHAROLAS, tomar(BANCO_CHAROLAS, ESTADO_VACIO, 'pila'), 'bahia-pila').estado;
    const antes = b.ocupacion;
    b = soltarEn(BANCO_CHAROLAS, tomar(BANCO_CHAROLAS, b, 'motor'), 'bahia-pila').estado;
    expect(b.ocupacion['bahia-pila']).toEqual(antes['bahia-pila']);
    expect(dondeEsta(b, 'motor')).toBeNull();
  });

  it('tomar una pieza con otra en la mano: la primera vuelve sola a su origen (pura)', () => {
    let b = tomar(BANCO_CHAROLAS, ESTADO_VACIO, 'sensor-luz');
    expect(b.tomada).toBe('sensor-luz');
    b = tomar(BANCO_CHAROLAS, b, 'sensor-linea');
    expect(b.tomada).toBe('sensor-linea');
    expect(dondeEsta(b, 'sensor-luz')).toBeNull(); // vuelve a su origen, no queda "en la mano" fantasma
  });

  it('pulsar Probar dos veces seguidas mientras la primera corre: no arranca dos cadenas ni suma dos choques', async () => {
    abrirLaboratorio();
    jugarRonda1Perfecta();
    await jugarRonda2Perfecta('Techo del carrito'); // a propósito el sitio que NO detiene al robot
    await avanzar(900); // ronda 3

    const boton = () => screen.getByRole('button', { name: 'Pulsar Probar' });
    fireEvent.click(boton());
    fireEvent.click(boton());
    fireEvent.click(boton());

    await avanzar(2300);
    expect(screen.getByText(/Chocó 1 vez\./)).toBeInTheDocument();
  });

  it('pulsar Probar sin nada montado (todo lo sacaron de vuelta): dice algo útil y no truena', async () => {
    abrirLaboratorio();
    jugarRonda1Perfecta();
    await jugarRonda2Perfecta('Frente del carrito');
    await avanzar(900); // ronda 3, todo bien montado

    // Ahora se desarma TODO lo que se montó en la ronda 2 — el caso límite
    // que "engañaría" a un `montajeCompleto` mal usado, aquí hecho a mano.
    for (const etiqueta of [
      'Sensor de distancia',
      'Sensor de luz',
      'Sensor de línea',
      'Motor de rueda',
      'Zumbador',
      'Tarjeta controladora',
    ]) {
      sacarPieza(etiqueta);
      fireEvent.click(screen.getByRole('button', { name: 'Dejar la pieza donde estaba' }));
    }

    expect(() => fireEvent.click(screen.getByRole('button', { name: 'Pulsar Probar' }))).not.toThrow();
    await avanzar(2300);
    expect(bitDice()).toContain('Chocó');
    expect(bitDice()).toContain('faltan piezas por montar');
  });

  it('desmontar en la ronda 3 lo que se montó en la 2, y volver a probar: se puede arreglar (no hay callejón sin salida)', async () => {
    abrirLaboratorio();
    jugarRonda1Perfecta();
    await jugarRonda2Perfecta('Techo del carrito'); // elección "mala" a propósito
    await avanzar(900);

    fireEvent.click(screen.getByRole('button', { name: 'Pulsar Probar' }));
    await avanzar(2300);
    expect(bitDice()).toContain('Chocó');

    // Se arregla. Los tres anclajes de sensor están ocupados (distancia en
    // techo, luz en frente, línea en panza — capacidad 1 cada uno), así que
    // el intercambio no es un solo movimiento: se saca la distancia, rebota
    // al intentar el frente porque la luz sigue ahí, y eso libera el camino
    // para mover la luz al techo y por fin la distancia al frente. Es
    // exactamente «no hay callejón sin salida»: cabe, aunque no a la primera.
    sacarPieza('Sensor de distancia');
    ponerEn('Frente del carrito'); // rebota (lleno): la luz sigue ahí
    sacarPieza('Sensor de luz');
    ponerEn('Techo del carrito');
    tomarPieza('Sensor de distancia');
    ponerEn('Frente del carrito');
    fireEvent.click(screen.getByRole('button', { name: 'Pulsar Probar' }));
    await avanzar(2300);
    expect(bitDice()).toContain('Lo lograste');

    // Y la pila y el interruptor no dejan la escena congelada.
    sacarPieza('Pila');
    ponerEn('Bahía de la pila');
    // El interruptor ya estaba arriba desde el encargo 3: su rótulo accesible
    // es "Bajar…" cuando está encendido y "Subir…" cuando no.
    fireEvent.click(screen.getByRole('button', { name: 'Bajar el interruptor' }));
    fireEvent.click(screen.getByRole('button', { name: 'Subir el interruptor' }));
    expect(screen.getByRole('button', { name: 'Bajar el interruptor' })).toBeInTheDocument();
    // Y el resto de la escena sigue viva: no quedó nada `interactivo: false`
    // para siempre.
    expect(screen.getByRole('button', { name: 'Sacar la pieza Sensor de luz' })).toBeInTheDocument();
  });

  it('pulsar Salir a mitad de la ronda 2 no truena, y vuelve a la entrada', async () => {
    abrirLaboratorio();
    jugarRonda1Perfecta();
    await avanzar(900);
    tomarPieza('Sensor de distancia');
    ponerEn('Frente del carrito');
    fireEvent.click(screen.getByRole('button', { name: 'Salir' }));
    expect(screen.getByText('Entra al laboratorio 3D')).toBeInTheDocument();
  });
});

describe('n6-que-es-un-robot · recorrido completo', () => {
  it('de la entrada a la pantalla de cierre, jugando bien, cierra en 100 y tres estrellas', async () => {
    const { onComplete, onProgress, onScore } = abrirLaboratorio();

    jugarRonda1Perfecta();
    expect(marcador()).toBe('3/9');

    await jugarRonda2Perfecta('Frente del carrito');
    await avanzar(900); // ronda 3
    expect(marcador()).toBe('6/9');
    expect(bitDice()).toContain('Probar');

    fireEvent.click(screen.getByRole('button', { name: 'Pulsar Probar' }));
    await avanzar(2300);
    expect(bitDice()).toContain('Lo lograste');
    expect(marcador()).toBe('8/9');

    await avanzar(2700); // se abre la pregunta
    fireEvent.click(
      screen.getByRole('button', { name: 'Responder: Que meta información del mundo hacia adentro del robot' }),
    );
    expect(marcador()).toBe('9/9');

    await avanzar(2500);

    const resultado = onComplete.mock.calls[0][0] as ActivityResult;
    expect(resultado.score).toBe(100);
    expect(resultado.errores).toBe(0);
    expect(resultado.stars).toBe(3);
    expect(onProgress).toHaveBeenLastCalledWith(1);
    expect(onScore).toHaveBeenLastCalledWith(100);

    expect(screen.getByText('Insignia · Ojo de robot')).toBeInTheDocument();
    expect(screen.getByText('¡Tu robot ve lo que tiene enfrente!')).toBeInTheDocument();
    expect(screen.getByText('Chocó')).toBeInTheDocument();
    expect(screen.getByText('0 veces')).toBeInTheDocument();
  });

  it('una respuesta equivocada en el encargo 9 resta y deja volver a intentar', async () => {
    const { onScore } = abrirLaboratorio();
    jugarRonda1Perfecta();
    await jugarRonda2Perfecta('Frente del carrito');
    await avanzar(900);
    fireEvent.click(screen.getByRole('button', { name: 'Pulsar Probar' }));
    await avanzar(2300);
    await avanzar(2700);

    fireEvent.click(screen.getByRole('button', { name: 'Responder: Su color y su tamaño' }));
    expect(bitDice()).toContain('no es la forma ni el color');
    expect(onScore).toHaveBeenLastCalledWith(94);

    fireEvent.click(
      screen.getByRole('button', { name: 'Responder: Que meta información del mundo hacia adentro del robot' }),
    );
    await avanzar(2500);
    expect(screen.getByText('¡Tu robot ve lo que tiene enfrente!')).toBeInTheDocument();
  });

  it('terminada, la pantalla final funciona, y «jugar otra vez» devuelve todo a cero', async () => {
    const { onComplete } = abrirLaboratorio();
    jugarRonda1Perfecta();
    await jugarRonda2Perfecta('Frente del carrito');
    await avanzar(900);
    fireEvent.click(screen.getByRole('button', { name: 'Pulsar Probar' }));
    await avanzar(2300);
    await avanzar(2700);
    fireEvent.click(
      screen.getByRole('button', { name: 'Responder: Que meta información del mundo hacia adentro del robot' }),
    );
    await avanzar(2500);

    expect(onComplete).toHaveBeenCalledTimes(1);
    // El lienzo se desmonta entero con la pantalla final: no queda nada de la
    // mecánica que tocar.
    expect(screen.queryByRole('button', { name: /Tomar la pieza/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Pulsar Probar' })).toBeNull();

    // Y el camino de salida funciona también DESDE la pantalla de cierre.
    expect(screen.getByRole('button', { name: 'Volver a la entrada' })).toBeInTheDocument();

    fireEvent.click(screen.getByText('Jugar otra vez'));
    expect(marcador()).toBe('0/9');
    expect(screen.getByRole('button', { name: 'Tomar la pieza Sensor de distancia' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Poner en Charola · ENTRA' })).toBeInTheDocument();
    // No se vuelve a pedir la portada: ya se leyó.
    expect(screen.queryByTestId('lb3-portada')).toBeNull();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
