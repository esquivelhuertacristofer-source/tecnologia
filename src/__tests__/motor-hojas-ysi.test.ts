/**
 * Tecnia Hojas · el análisis «Y si»: buscar objetivo y escenarios (§45.2,
 * bloque 57). `ysi.ts` estaba escrito y probado por nadie —cero imports—; esta
 * es la primera vez que se ejecuta.
 *
 * Se prueba jugando MAL a propósito, que es la regla de la casa: una celda
 * objetivo que no es fórmula, una celda que se mueve y no influye en nada, un
 * objetivo que no se puede alcanzar. La que de verdad importa es que **buscar
 * objetivo no ensucie el libro cuando no converge** — el libro tiene que
 * quedar siendo el MISMO objeto, no uno igual.
 */

import {
  resolverPorSecante,
  escenarioDe,
  escenariosDe,
  olvidarUltimaBusqueda,
  type Tanteo,
} from '@/components/office/motor-hojas/ysi';
import { crearMotor, type Motor } from '@/components/office/motor-hojas/formula/calculo';
import {
  ejecutar,
  ejecutarVarios,
  nuevaGrabadora,
  reproducir,
  revisar,
  type Gesto,
} from '@/components/office/motor-hojas/comandos';
import { valorDe as valorConsulta } from '@/components/office/motor-hojas/consultas';
import type { Celda, Libro } from '@/components/office/motor-hojas/modelo';

/* ── utilidades, calcadas de motor-hojas.test.ts ────────────────────────────*/

const CONTEXTO = { ahora: Date.UTC(2026, 7, 13, 12, 0, 0) };

function libroCon(celdas: Record<string, string | Celda>): Libro {
  return {
    activa: 'h1',
    nombres: {},
    hojas: [
      {
        id: 'h1',
        nombre: 'Hoja1',
        celdas: Object.fromEntries(
          Object.entries(celdas).map(([d, c]) => [d, typeof c === 'string' ? { crudo: c } : c]),
        ),
      },
    ],
  };
}

const motorCon = (celdas: Record<string, string | Celda>): Motor => crearMotor(libroCon(celdas), CONTEXTO);

function v(motor: Motor, direccion: string) {
  return valorConsulta(motor, 'h1', direccion);
}

beforeEach(() => olvidarUltimaBusqueda());

/* ── el método numérico, sin hoja alrededor ─────────────────────────────────*/

describe('resolverPorSecante · el método, de papel', () => {
  it('en una relación lineal, converge', () => {
    const probar = (x: number): Tanteo => ({ ok: true, v: x * 3 + 1 });
    const camino = resolverPorSecante(probar, (v) => v === 25, 25, 0);
    expect(camino.x).toBeCloseTo(8);
    expect(camino.tanteos).toBeLessThan(10);
  });

  it('un tanteo que no da número (tipo #¡DIV/0!) se retrocede, y la búsqueda se recupera', () => {
    // El dominio negativo no existe (como una raíz cuadrada): arranca ahí a
    // propósito y comprueba que el método SALE de la zona mala y converge.
    const probar = (x: number): Tanteo => (x < 0 ? { ok: false, motivo: '#¡NUM!' } : { ok: true, v: Math.sqrt(x) });
    const camino = resolverPorSecante(probar, (v) => Math.abs(v - 4) < 1e-9, 4, -5);
    expect(camino.x).not.toBeNull();
    expect(camino.v).toBeCloseTo(4, 6);
    expect(camino.x as number).toBeCloseTo(16, 4);
  });

  it('un objetivo inalcanzable no converge, y dice lo más cerca que llegó', () => {
    // 1/(1+x²) nunca pasa de 1: pedirle 100 es pedir un cuadrado negativo.
    const probar = (x: number): Tanteo => ({ ok: true, v: 1 / (1 + x * x) });
    const camino = resolverPorSecante(probar, (v) => v === 100, 100, 1);
    expect(camino.x).toBeNull();
    expect(camino.mejor).not.toBeNull();
    expect(camino.mejor?.v).toBeLessThanOrEqual(1);
  });

  it('con dos soluciones posibles, encuentra la del lado de donde arranca', () => {
    const cuadrado = (x: number): Tanteo => ({ ok: true, v: x * x });
    const llego = (v: number) => Math.abs(v - 9) < 1e-9;
    expect(resolverPorSecante(cuadrado, llego, 9, 5).x).toBeCloseTo(3);
    expect(resolverPorSecante(cuadrado, llego, 9, -5).x).toBeCloseTo(-3);
  });
});

/* ── buscar objetivo, ya con el libro delante ───────────────────────────────*/

describe('comando buscar-objetivo · el camino feliz', () => {
  it('cambia B1 hasta que B2 (=B1*2) enseña el objetivo', () => {
    const motor = motorCon({ B1: '10', B2: '=B1*2' });
    const gesto: Gesto = { comando: 'buscar-objetivo', args: { hoja: 'h1', objetivo: 'B2', valor: 100, cambiando: 'B1' } };
    expect(revisar(motor.libro, gesto)).toBeNull();
    expect(ejecutar(motor, gesto)).toBeNull();
    expect(motor.libro.hojas[0].celdas.B1.crudo).toBe('50');
    expect(v(motor, 'B2')).toBe(100);
  });

  it('grabada y reproducida sobre el libro de partida da el mismo libro', () => {
    const partida = libroCon({ B1: '10', B2: '=B1*2' });
    const motor = crearMotor(partida, CONTEXTO);
    const grabadora = nuevaGrabadora();
    grabadora.grabando = true;
    const gesto: Gesto = { comando: 'buscar-objetivo', args: { hoja: 'h1', objetivo: 'B2', valor: 100, cambiando: 'B1' } };
    ejecutarVarios(motor, [gesto], grabadora);
    const unaVez = reproducir(partida, grabadora.gestos);
    const otraVez = reproducir(partida, grabadora.gestos);
    expect(unaVez).toEqual(motor.libro);
    expect(unaVez).toEqual(otraVez);
  });
});

describe('comando buscar-objetivo · jugando mal a propósito', () => {
  it('sobre una celda que NO es fórmula, se rechaza y no hay nada que buscar', () => {
    const motor = motorCon({ B1: '10', B2: '100' });
    const gesto: Gesto = { comando: 'buscar-objetivo', args: { hoja: 'h1', objetivo: 'B2', valor: 200, cambiando: 'B1' } };
    expect(revisar(motor.libro, gesto)).toMatch(/no guarda una fórmula/);
    const antes = motor.libro;
    expect(ejecutar(motor, gesto)).not.toBeNull();
    expect(motor.libro).toBe(antes);
  });

  it('cambiando una celda que no influye en el objetivo, se rechaza ANTES de tantear', () => {
    // B2 no lee B1 en absoluto: no hay nada que mover B1 pueda cambiar.
    const motor = motorCon({ B1: '10', B2: '=5*3' });
    const gesto: Gesto = { comando: 'buscar-objetivo', args: { hoja: 'h1', objetivo: 'B2', valor: 100, cambiando: 'B1' } };
    expect(revisar(motor.libro, gesto)).toMatch(/no entra en su cuenta/);
  });

  it('si la celda que se mueve es ella misma una fórmula, se rechaza', () => {
    const motor = motorCon({ B1: '=1+1', B2: '=B1*2' });
    const gesto: Gesto = { comando: 'buscar-objetivo', args: { hoja: 'h1', objetivo: 'B2', valor: 100, cambiando: 'B1' } };
    expect(revisar(motor.libro, gesto)).toMatch(/sólo puede cambiar una celda con un número escrito a mano/);
  });

  it('un objetivo inalcanzable (un cuadrado en negativo) NO CONVERGE, y el libro queda idéntico', () => {
    const motor = motorCon({ B1: '2', B2: '=B1*B1' });
    const gesto: Gesto = {
      comando: 'buscar-objetivo',
      args: { hoja: 'h1', objetivo: 'B2', valor: -10, cambiando: 'B1' },
    };
    expect(revisar(motor.libro, gesto)).toMatch(/no encontró una solución/);
    // La prueba que importa: el libro es el MISMO objeto, no uno que resulte igual.
    const antes = motor.libro;
    expect(ejecutar(motor, gesto)).not.toBeNull();
    expect(motor.libro).toBe(antes);
    expect(motor.libro.hojas[0].celdas.B1.crudo).toBe('2');
  });

  it('con una celda mal escrita o un valor que no es número, se rechaza', () => {
    const motor = motorCon({ B1: '10', B2: '=B1*2' });
    expect(
      revisar(motor.libro, { comando: 'buscar-objetivo', args: { hoja: 'h1', objetivo: '123', valor: 100, cambiando: 'B1' } }),
    ).toMatch(/no es una celda/);
    expect(
      revisar(motor.libro, { comando: 'buscar-objetivo', args: { hoja: 'h1', objetivo: 'B2', valor: NaN, cambiando: 'B1' } }),
    ).toMatch(/número/);
  });
});

/* ── los escenarios ──────────────────────────────────────────────────────────*/

describe('escenarios · guardar, aplicar y borrar', () => {
  it('guardar y aplicar un escenario deja el libro tal como estaba al guardarlo', () => {
    const motor = motorCon({ B1: '10', B2: '20' });
    ejecutar(motor, { comando: 'guardar-escenario', args: { hoja: 'h1', nombre: 'Optimista', celdas: 'B1,B2' } });
    ejecutar(motor, { comando: 'escribir', args: { hoja: 'h1', celda: 'B1', crudo: '999' } });
    ejecutar(motor, { comando: 'escribir', args: { hoja: 'h1', celda: 'B2', crudo: '888' } });
    expect(v(motor, 'B1')).toBe(999);

    ejecutar(motor, { comando: 'aplicar-escenario', args: { hoja: 'h1', nombre: 'Optimista' } });
    expect(v(motor, 'B1')).toBe(10);
    expect(v(motor, 'B2')).toBe(20);
  });

  it('guardar con un nombre que ya existe avisa antes de reemplazarlo', () => {
    const motor = motorCon({ B1: '10' });
    ejecutar(motor, { comando: 'guardar-escenario', args: { hoja: 'h1', nombre: 'Optimista', celdas: 'B1' } });
    ejecutar(motor, { comando: 'escribir', args: { hoja: 'h1', celda: 'B1', crudo: '50' } });

    const gesto: Gesto = { comando: 'guardar-escenario', args: { hoja: 'h1', nombre: 'Optimista', celdas: 'B1' } };
    expect(revisar(motor.libro, gesto)).toMatch(/ya hay un escenario llamado/);

    ejecutar(motor, { ...gesto, args: { ...gesto.args, confirmado: 1 } });
    expect(escenariosDe(motor.libro)).toHaveLength(1); // reemplazado, no duplicado
    expect(escenarioDe(motor.libro, 'Optimista')?.celdas['h1!B1']).toBe('50');
  });

  it('aplicar un escenario que pisa una fórmula avisa antes de sustituirla', () => {
    const motor = motorCon({ B1: '10', B2: '15' }); // B2 empieza siendo un número
    ejecutar(motor, { comando: 'guardar-escenario', args: { hoja: 'h1', nombre: 'Manual', celdas: 'B2' } });
    ejecutar(motor, { comando: 'escribir', args: { hoja: 'h1', celda: 'B2', crudo: '=B1*2' } }); // ahora es fórmula

    const gesto: Gesto = { comando: 'aplicar-escenario', args: { hoja: 'h1', nombre: 'Manual' } };
    expect(revisar(motor.libro, gesto)).toMatch(/va a sustituir 1 fórmula/);
    const antes = motor.libro;
    expect(ejecutar(motor, gesto)).not.toBeNull();
    expect(motor.libro).toBe(antes);

    ejecutar(motor, { comando: 'aplicar-escenario', args: { hoja: 'h1', nombre: 'Manual', confirmado: 1 } });
    expect(motor.libro.hojas[0].celdas.B2.crudo).toBe('15');
  });

  it('aplicar o borrar un escenario que no existe se rechaza con su nombre', () => {
    const motor = motorCon({ B1: '10' });
    expect(revisar(motor.libro, { comando: 'aplicar-escenario', args: { hoja: 'h1', nombre: 'Nadie' } })).toMatch(
      /no existe un escenario/,
    );
    expect(revisar(motor.libro, { comando: 'borrar-escenario', args: { hoja: 'h1', nombre: 'Nadie' } })).toMatch(
      /no existe un escenario/,
    );
  });

  it('borrar un escenario lo quita de la lista, y ya no se puede volver a aplicar', () => {
    const motor = motorCon({ B1: '10' });
    ejecutar(motor, { comando: 'guardar-escenario', args: { hoja: 'h1', nombre: 'Optimista', celdas: 'B1' } });
    expect(escenarioDe(motor.libro, 'Optimista')).not.toBeNull();

    ejecutar(motor, { comando: 'borrar-escenario', args: { hoja: 'h1', nombre: 'Optimista' } });
    expect(escenarioDe(motor.libro, 'Optimista')).toBeNull();
    expect(revisar(motor.libro, { comando: 'aplicar-escenario', args: { hoja: 'h1', nombre: 'Optimista' } })).toMatch(
      /no existe/,
    );
  });
});
