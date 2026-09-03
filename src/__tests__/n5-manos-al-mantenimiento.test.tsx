/**
 * `n5-manos-al-mantenimiento` · N5·U1, parada 4 y cierre de unidad (§53.2).
 * **10–11 años**, leído en `curriculo.ts`.
 *
 * Lo que esta suite vigila, en una frase: **que el orden sea de verdad una
 * regla**. Si el aparato dejara abrir el equipo con el cable puesto, o meter la
 * mano dentro sin descargar la estática, la clase no enseñaría nada — así que
 * cada guarda tiene su prueba, y las cuatro se hacen jugando mal a propósito.
 *
 * Y el recorrido completo se juega por la cara sin WebGL, que es la única que
 * jsdom toca: diez pasos, de sacar el cable a volver a enchufarlo, hasta la
 * pantalla de cierre.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import EntradaManosAlMantenimiento from '@/components/activities/lab3d/EntradaManosAlMantenimiento';
import {
  BANCO_MANTENIMIENTO,
  BANCO_MANT_INICIAL,
  ESPERADO_MANT,
  PASOS_MANT,
  pasoPermitido,
} from '@/components/activities/lab3d/bancos';
import {
  dondeEsta,
  evaluar,
  montajeCompleto,
  seAplico,
  soltarEn,
  tomar,
  validarBanco,
} from '@/components/simuladores/laboratorio3d/bancoFisico';
import { CURRICULO } from '@/data/curriculo';
import type { ActivityResult } from '@/types/activity-contract';

const DEF = BANCO_MANTENIMIENTO;

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const utils = render(
    <EntradaManosAlMantenimiento config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />,
  );
  return { ...utils, onProgress, onScore, onComplete };
}

const pulsar = (nombre: string | RegExp) => fireEvent.click(screen.getByRole('button', { name: nombre }));
const bitDice = () => document.querySelector('.bit-globo')?.textContent ?? '';
const marcador = () => document.querySelector('.marcador-led strong')?.textContent ?? '';

function abrirLaboratorio() {
  const api = montar();
  fireEvent.click(screen.getByText('Entra al laboratorio 3D'));
  fireEvent.click(screen.getByTestId('lb3-empezar'));
  return api;
}

const avanzar = async (ms: number) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

/** Saca una pieza de su sitio y la deja en la mesa. Dos gestos, uno detrás de otro. */
function sacarADejar(etiqueta: string) {
  pulsar(`Sacar ${etiqueta} de su sitio`);
  pulsar('Dejar en la mesa lo que llevas en la mano');
}

/** Los tres pasos de seguridad más abrir: el arranque de todo recorrido. */
function abrirElEquipo() {
  sacarADejar('Cable de corriente');
  pulsar('Tocar el chasis para descargar la estática');
  sacarADejar('Tornillo de arriba');
  sacarADejar('Tornillo de abajo');
  pulsar('Abrir la tapa con el pestillo');
}

beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
afterEach(() => jest.useRealTimers());

describe('n5-manos-al-mantenimiento · el banco y el orden, en aritmética pura', () => {
  it('el nivel y la edad son los del currículo, y el equipo empieza MONTADO', () => {
    const n5 = CURRICULO.find((n) => n.n === 5);
    const unidad = n5?.unidades.find((u) => u.id === 'n5-el-sistema-de-computo');
    expect(n5?.edad).toBe('10–11');
    expect(unidad?.actividades.find((a) => a.id === 'n5-manos-al-mantenimiento')?.estado).toBe('disponible');

    // Al revés que `n7-dentro-del-gabinete`: aquí no se arma, se desarma y se
    // vuelve a dejar como estaba. La primera destreza es desmontar en orden.
    expect(validarBanco(DEF)).toEqual([]);
    expect(montajeCompleto(DEF, BANCO_MANT_INICIAL)).toBe(true);
    expect(evaluar(DEF, BANCO_MANT_INICIAL, ESPERADO_MANT).equivocadas).toEqual([]);
    expect(dondeEsta(BANCO_MANT_INICIAL, 'ram')).toBe('ranura-ram');
    expect(dondeEsta(BANCO_MANT_INICIAL, 'corriente')).toBe('toma-corriente');
  });

  it('la tabla de requisitos: la seguridad es estricta y el interior es libre', () => {
    expect(PASOS_MANT).toHaveLength(10);
    // Abrir exige los tres pasos de seguridad, y ninguno se puede saltar.
    expect(pasoPermitido('abrir', [])).toBe(false);
    expect(pasoPermitido('abrir', ['corriente-fuera'])).toBe(false);
    expect(pasoPermitido('abrir', ['corriente-fuera', 'estatica'])).toBe(false);
    expect(pasoPermitido('abrir', ['corriente-fuera', 'estatica', 'tornillos-fuera'])).toBe(true);

    // Dentro da igual el orden: soplar el disipador antes que el ventilador no
    // es un error en ningún taller, y no se inventa una regla que no existe.
    expect(pasoPermitido('disipador', ['abrir'])).toBe(true);
    expect(pasoPermitido('ventilador', ['abrir'])).toBe(true);
    expect(pasoPermitido('ram', ['abrir'])).toBe(true);
    // Pero cerrar sí exige las tres.
    expect(pasoPermitido('cerrar', ['ventilador', 'disipador'])).toBe(false);
    expect(pasoPermitido('cerrar', ['ventilador', 'disipador', 'ram'])).toBe(true);
    expect(pasoPermitido('corriente-puesta', ['cerrar'])).toBe(false);
  });

  it('coger una pieza montada la desmonta: es literalmente «reasienta la RAM»', () => {
    const enMano = tomar(DEF, BANCO_MANT_INICIAL, 'ram');
    expect(enMano.tomada).toBe('ram');
    expect(dondeEsta(enMano, 'ram')).toBeNull();
    const devuelta = soltarEn(DEF, enMano, 'ranura-ram').estado;
    expect(dondeEsta(devuelta, 'ram')).toBe('ranura-ram');
    // Y no entra en cualquier hueco: la ranura de RAM no admite un tornillo.
    expect(soltarEn(DEF, tomar(DEF, devuelta, 'tornillo1'), 'ranura-ram').suelta).toMatchObject({
      tipo: 'rebota',
      motivo: 'forma',
    });
  });

  it('la lata de aire es herramienta: se aplica, no ocupa sitio y no cuenta dos veces', () => {
    const uno = soltarEn(DEF, tomar(DEF, BANCO_MANT_INICIAL, 'aire'), 'ventilador');
    expect(uno.suelta).toMatchObject({ tipo: 'aplica', anclaje: 'ventilador' });
    expect(seAplico(uno.estado, 'ventilador', 'aire')).toBe(true);
    expect(dondeEsta(uno.estado, 'aire')).toBeNull();
    const dos = soltarEn(DEF, tomar(DEF, uno.estado, 'aire'), 'ventilador');
    expect(dos.estado.aplicaciones.ventilador).toEqual(['aire']);
  });
});

describe('n5-manos-al-mantenimiento · la entrada y la portada', () => {
  it('la entrada dice lo de ESTA clase: diez pasos, tres reglas y el polvo', () => {
    montar();
    expect(screen.getByText('Antes de abrir nada')).toBeInTheDocument();
    expect(screen.getByText('Apagar no es suficiente')).toBeInTheDocument();
    expect(screen.getByText('La electricidad que no sientes')).toBeInTheDocument();
    expect(screen.getByText('El polvo tapa el aire')).toBeInTheDocument();
    expect(screen.getByText('No se cierra dejando tornillos')).toBeInTheDocument();
    // Y no promete nada de la parada 2: aquí no se conecta ningún periférico.
    expect(screen.queryByText(/panel trasero/i)).toBeNull();
  });

  it('la portada de objetivos aparece antes de tocar nada', () => {
    montar();
    fireEvent.click(screen.getByText('Entra al laboratorio 3D'));
    const portada = screen.getByTestId('lb3-portada');
    expect(portada).toHaveTextContent('Manos al mantenimiento');
    expect(portada).toHaveTextContent('Manos de mantenimiento');
    expect(portada).toHaveTextContent('10');
    // Con la portada puesta, el equipo no responde.
    const antes = bitDice();
    pulsar('Tocar el chasis para descargar la estática');
    expect(bitDice()).toBe(antes);
    expect(marcador()).toBe('0/10');
  });
});

describe('n5-manos-al-mantenimiento · jugando mal a propósito', () => {
  it('abrir con el cable puesto: se niega, lo explica y resta', () => {
    const { onScore } = abrirLaboratorio();
    pulsar('Abrir la tapa con el pestillo');
    expect(bitDice()).toContain('no se toca nada');
    expect(onScore).toHaveBeenLastCalledWith(94);
    expect(marcador()).toBe('0/10');
    // Y la tapa sigue cerrada de verdad: el botón no cambió de oficio.
    expect(screen.getByRole('button', { name: 'Abrir la tapa con el pestillo' })).toBeInTheDocument();
  });

  it('meter la mano dentro sin descargar la estática: se niega y lo explica', () => {
    const { onScore } = abrirLaboratorio();
    sacarADejar('Cable de corriente');
    expect(marcador()).toBe('1/10');
    pulsar('Sacar Módulo de RAM de su sitio');
    expect(bitDice()).toContain('estática');
    expect(onScore).toHaveBeenLastCalledWith(94);
    // La RAM no se movió.
    expect(screen.getByRole('button', { name: 'Sacar Módulo de RAM de su sitio' })).toBeInTheDocument();
  });

  it('cerrar con el interior a medias, y atornillar con la tapa abierta: los dos se explican', () => {
    abrirLaboratorio();
    abrirElEquipo();
    expect(marcador()).toBe('4/10');

    // Cerrar sin haber soplado ni reasentado nada.
    pulsar('Cerrar la tapa con el pestillo');
    expect(bitDice()).toContain('Dentro falta algo');
    expect(marcador()).toBe('4/10');

    // Y devolver un tornillo con la tapa todavía abierta.
    pulsar('Tomar Tornillo de arriba de la mesa');
    pulsar('Usar en Tornillo de arriba');
    expect(bitDice()).toContain('Ciérrala primero');
    expect(marcador()).toBe('4/10');
  });

  it('la corriente antes de tiempo y una pieza en el hueco que no es: ninguna cuela', () => {
    abrirLaboratorio();
    abrirElEquipo();

    // Reconectar antes de cerrar y atornillar: Bit lo para.
    pulsar('Tomar Cable de corriente de la mesa');
    expect(bitDice()).toContain('con los dos tornillos puestos');

    // Y la RAM no entra en el ventilador: eso lo dice el aparato, no la clase.
    pulsar('Sacar Módulo de RAM de su sitio');
    pulsar('Usar en Ventilador');
    expect(bitDice()).toContain('Ahí no va');
    expect(marcador()).toBe('4/10');
  });
});

describe('n5-manos-al-mantenimiento · recorrido completo', () => {
  it('los diez pasos, de sacar el cable a volver a enchufarlo, hasta la pantalla de cierre', async () => {
    const { onComplete, onProgress } = abrirLaboratorio();

    sacarADejar('Cable de corriente');
    expect(marcador()).toBe('1/10');

    pulsar('Tocar el chasis para descargar la estática');
    expect(marcador()).toBe('2/10');

    sacarADejar('Tornillo de arriba');
    expect(marcador()).toBe('2/10'); // uno solo no cuenta: el paso son los dos
    sacarADejar('Tornillo de abajo');
    expect(marcador()).toBe('3/10');

    pulsar('Abrir la tapa con el pestillo');
    expect(marcador()).toBe('4/10');
    expect(bitDice()).toContain('polvo');

    pulsar('Tomar Aire comprimido de la mesa');
    pulsar('Usar en Ventilador');
    expect(marcador()).toBe('5/10');
    pulsar('Tomar Aire comprimido de la mesa');
    pulsar('Usar en Disipador');
    expect(marcador()).toBe('6/10');

    pulsar('Sacar Módulo de RAM de su sitio');
    pulsar('Usar en Ranura de RAM');
    expect(marcador()).toBe('7/10');

    await avanzar(1200);
    pulsar('Cerrar la tapa con el pestillo');
    expect(marcador()).toBe('8/10');

    pulsar('Tomar Tornillo de arriba de la mesa');
    pulsar('Usar en Tornillo de arriba');
    expect(marcador()).toBe('8/10');
    pulsar('Tomar Tornillo de abajo de la mesa');
    pulsar('Usar en Tornillo de abajo');
    expect(marcador()).toBe('9/10');

    pulsar('Tomar Cable de corriente de la mesa');
    pulsar('Usar en Toma del regulador');
    expect(marcador()).toBe('10/10');

    await avanzar(1500);

    const resultado = onComplete.mock.calls[0][0] as ActivityResult;
    expect(resultado.score).toBe(100);
    expect(resultado.errores).toBe(0);
    expect(onProgress).toHaveBeenLastCalledWith(1);
    expect(screen.getByText('Insignia · Manos de mantenimiento')).toBeInTheDocument();
    expect(screen.getByText('¡Mantenimiento terminado!')).toBeInTheDocument();
    expect(screen.getByText('2/2')).toBeInTheDocument();

    // Terminada, el lienzo se desmonta: no queda nada que tocar.
    expect(screen.queryByRole('button', { name: /Abrir la tapa/ })).toBeNull();
  });
});
