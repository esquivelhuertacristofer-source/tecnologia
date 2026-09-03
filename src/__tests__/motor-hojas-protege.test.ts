/**
 * Tecnia Hojas · el paquete PROTEGE (bloques 53 y 54): consolidar y proteger.
 *
 * Se prueba jugando MAL a propósito, que es la regla de la casa: escribir en
 * una hoja protegida, borrar una fila de una protegida, renombrar una hoja
 * con la estructura protegida, escribir en un rango desbloqueado (tiene que
 * DEJAR), proteger una hoja ya protegida, consolidar hojas de distinta
 * forma, consolidar una hoja consigo misma, y deshacer un gesto de
 * protección. Y la prueba que importa: un muestreo de los comandos que YA
 * existían, recorrido para comprobar que ninguno se cuela por debajo de la
 * guarda.
 */

import {
  ejecutar,
  ejecutarVarios,
  nuevaGrabadora,
  reproducir,
  revisar,
  type Gesto,
} from '@/components/office/motor-hojas/comandos';
import { conLibro, crearMotor } from '@/components/office/motor-hojas/formula/calculo';
import { valorDe as valorConsulta } from '@/components/office/motor-hojas/consultas';
import type { Celda, Hoja, Libro } from '@/components/office/motor-hojas/modelo';

/* ── utilidades, calcadas de motor-hojas-ysi.test.ts ────────────────────────*/

function hoja(id: string, nombre: string, celdas: Record<string, string | Celda>, extra: Partial<Hoja> = {}): Hoja {
  return {
    id,
    nombre,
    celdas: Object.fromEntries(Object.entries(celdas).map(([d, c]) => [d, typeof c === 'string' ? { crudo: c } : c])),
    ...extra,
  };
}

function libro(hojas: Hoja[], activa: string = hojas[0].id, extra: Partial<Libro> = {}): Libro {
  return { activa, nombres: {}, hojas, ...extra };
}

function v(motor: ReturnType<typeof crearMotor>, hojaId: string, direccion: string) {
  return valorConsulta(motor, hojaId, direccion);
}

/* ── bloque 54 · proteger una hoja, y el rango que sí se puede tocar ────────*/

describe('proteger-hoja · jugando mal', () => {
  it('escribir en una hoja protegida se bloquea, y dentro de un rango desbloqueado SÍ deja', () => {
    const base = libro([hoja('h1', 'Hoja1', { A1: '1' }, { protegida: { activa: true } })]);
    const motor = crearMotor(base);

    const fuera: Gesto = { comando: 'escribir', args: { hoja: 'h1', celda: 'C1', crudo: '9' } };
    expect(revisar(motor.libro, fuera)).not.toBeNull();
    expect(ejecutar(motor, fuera)).not.toBeNull();
    expect(v(motor, 'h1', 'C1')).toBeNull();

    expect(ejecutar(motor, { comando: 'desbloquear-rango', args: { hoja: 'h1', rango: 'B2:B9' } })).toBeNull();

    const dentro: Gesto = { comando: 'escribir', args: { hoja: 'h1', celda: 'B3', crudo: '7' } };
    expect(revisar(motor.libro, dentro)).toBeNull();
    expect(ejecutar(motor, dentro)).toBeNull();
    expect(v(motor, 'h1', 'B3')).toBe(7);

    // Y lo que sigue fuera del rango desbloqueado sigue bloqueado.
    expect(revisar(motor.libro, fuera)).not.toBeNull();
  });

  it('borrar una fila de una hoja protegida se bloquea (el colateral de "todo" no exime la hoja misma)', () => {
    const base = libro([hoja('h1', 'Hoja1', { A1: '1', A2: '2' }, { protegida: { activa: true } })]);
    const motor = crearMotor(base);
    const gesto: Gesto = { comando: 'borrarFila', args: { hoja: 'h1', fila: 0, cuantas: 1 } };
    expect(revisar(motor.libro, gesto)).not.toBeNull();
    expect(ejecutar(motor, gesto)).not.toBeNull();
    expect(v(motor, 'h1', 'A1')).toBe(1);
  });

  it('proteger una hoja que ya está protegida se rechaza', () => {
    const base = libro([hoja('h1', 'Hoja1', {}, { protegida: { activa: true } })]);
    expect(revisar(base, { comando: 'proteger-hoja', args: { hoja: 'h1' } })).toMatch(/ya está protegida/);
  });

  it('desproteger-hoja: falla si no estaba protegida, y si lo estaba libera la escritura', () => {
    const sinProteger = libro([hoja('h1', 'Hoja1', {})]);
    expect(revisar(sinProteger, { comando: 'desproteger-hoja', args: { hoja: 'h1' } })).toMatch(/no está protegida/);

    const base = libro([hoja('h1', 'Hoja1', { A1: '1' }, { protegida: { activa: true } })]);
    const motor = crearMotor(base);
    expect(ejecutar(motor, { comando: 'desproteger-hoja', args: { hoja: 'h1' } })).toBeNull();
    expect(ejecutar(motor, { comando: 'escribir', args: { hoja: 'h1', celda: 'A1', crudo: '5' } })).toBeNull();
    expect(v(motor, 'h1', 'A1')).toBe(5);
  });

  it('deshacer un gesto de proteger-hoja devuelve la escritura: la protección vive en el Libro, no en un canal aparte', () => {
    const base = libro([hoja('h1', 'Hoja1', { A1: '1' })]);
    const motor = crearMotor(base);
    const antesDeProteger = motor.libro;

    expect(ejecutar(motor, { comando: 'proteger-hoja', args: { hoja: 'h1' } })).toBeNull();
    expect(revisar(motor.libro, { comando: 'escribir', args: { hoja: 'h1', celda: 'A1', crudo: '2' } })).not.toBeNull();

    // «Deshacer» en la ventana es una PILA DE LIBROS que se restaura con
    // `conLibro` (VentanaHojas.tsx: «una pila de libros, porque el libro es
    // inmutable»), sin pasar por `ejecutarVarios`/`revisar`. Se simula aquí
    // con la misma llamada.
    conLibro(motor, antesDeProteger, 'todo');

    expect(motor.libro.hojas.find((h) => h.id === 'h1')?.protegida).toBeUndefined();
    expect(ejecutar(motor, { comando: 'escribir', args: { hoja: 'h1', celda: 'A1', crudo: '2' } })).toBeNull();
    expect(v(motor, 'h1', 'A1')).toBe(2);
  });
});

/* ── bloque 54 · proteger la ESTRUCTURA del libro ───────────────────────────*/

describe('proteger-libro · la estructura, no las celdas', () => {
  it('con la estructura protegida, renombrar una hoja se bloquea', () => {
    const base = libro([hoja('h1', 'Hoja1', {})], 'h1', { estructuraProtegida: true });
    const motor = crearMotor(base);
    const gesto: Gesto = { comando: 'renombrarHoja', args: { hoja: 'h1', nombre: 'Nueva' } };
    expect(revisar(motor.libro, gesto)).not.toBeNull();
    expect(ejecutar(motor, gesto)).not.toBeNull();
    expect(motor.libro.hojas[0].nombre).toBe('Hoja1');
  });

  it('con la estructura protegida, crear una hoja nueva se bloquea', () => {
    const base = libro([hoja('h1', 'Hoja1', {})], 'h1', { estructuraProtegida: true });
    const motor = crearMotor(base);
    const gesto: Gesto = { comando: 'nuevaHoja', args: { id: 'h2', nombre: 'Hoja2' } };
    expect(revisar(motor.libro, gesto)).not.toBeNull();
    expect(ejecutar(motor, gesto)).not.toBeNull();
    expect(motor.libro.hojas.length).toBe(1);
  });

  it('con la estructura protegida, mover una hoja de lugar se bloquea', () => {
    const base = libro([hoja('h1', 'Hoja1', {}), hoja('h2', 'Hoja2', {})], 'h1', { estructuraProtegida: true });
    const motor = crearMotor(base);
    const gesto: Gesto = { comando: 'moverHoja', args: { hoja: 'h1', posicion: 1 } };
    expect(revisar(motor.libro, gesto)).not.toBeNull();
    expect(ejecutar(motor, gesto)).not.toBeNull();
    expect(motor.libro.hojas.map((h) => h.id)).toEqual(['h1', 'h2']);
  });

  it('proteger la estructura NO bloquea escribir en las celdas: son dos protecciones distintas', () => {
    const base = libro([hoja('h1', 'Hoja1', {})], 'h1', { estructuraProtegida: true });
    const motor = crearMotor(base);
    const gesto: Gesto = { comando: 'escribir', args: { hoja: 'h1', celda: 'A1', crudo: '5' } };
    expect(revisar(motor.libro, gesto)).toBeNull();
    expect(ejecutar(motor, gesto)).toBeNull();
    expect(v(motor, 'h1', 'A1')).toBe(5);
  });

  it('proteger-libro y desproteger-libro rechazan repetirse', () => {
    const protegido = libro([hoja('h1', 'Hoja1', {})], 'h1', { estructuraProtegida: true });
    expect(revisar(protegido, { comando: 'proteger-libro' })).toMatch(/ya está protegida/);
    const sinProteger = libro([hoja('h1', 'Hoja1', {})]);
    expect(revisar(sinProteger, { comando: 'desproteger-libro' })).toMatch(/no está protegida/);
  });
});

/* ── la prueba que importa: que la protección no se salte por ningún lado ──*/

describe('la guarda de protección, en el gate central', () => {
  it('recorre un muestreo de comandos YA EXISTENTES —con toca() concreto, [] y "todo"— y ninguno escribe en la hoja protegida', () => {
    const base = libro([
      hoja(
        'h1',
        'Hoja1',
        {
          A1: '1',
          A2: '1',
          A3: '1',
          B1: '2',
          B2: '2',
          C1: '3',
          D1: '1',
          E1: 'x',
          E2: 'y',
          G1: 'x',
          G2: 'y',
        },
        { protegida: { activa: true } },
      ),
    ]);
    const motor = crearMotor(base);

    // Ocho comandos que ya existían antes de este paquete, cada uno con una
    // forma distinta de tocar el libro: `escribir` (una celda concreta),
    // `borrar` y `pegar` (una lista concreta), `formato` (`toca: []` a
    // propósito), `combinarCeldas` (celdas + `combinadas`), `quitar-
    // duplicados` e `importar-csv` (reescriben un bloque entero).
    const gestos: Gesto[] = [
      { comando: 'escribir', args: { hoja: 'h1', celda: 'A1', crudo: '99' } },
      { comando: 'borrar', args: { hoja: 'h1', rango: 'A2:A3' } },
      { comando: 'formato', args: { hoja: 'h1', rango: 'C1', negrita: 1 } },
      { comando: 'rellenarAbajo', args: { hoja: 'h1', rango: 'D1:D2' } },
      { comando: 'pegar', args: { hoja: 'h1', origen: 'E1:E2', destino: 'F1:F2' } },
      { comando: 'combinarCeldas', args: { hoja: 'h1', rango: 'G1:G2', confirmado: 1 } },
      { comando: 'quitar-duplicados', args: { hoja: 'h1', rango: 'B1:B2', encabezado: 0, confirmado: 1 } },
      { comando: 'importar-csv', args: { hoja: 'h1', celda: 'J1', texto: '9,9' } },
    ];

    let colados = 0;
    for (const g of gestos) {
      const aviso = revisar(motor.libro, g);
      if (!aviso) colados += 1;
      expect(aviso).not.toBeNull();
      expect(ejecutar(motor, g)).not.toBeNull();
    }
    expect(colados).toBe(0);
    // Y el libro no se movió ni una vez en las ocho vueltas.
    expect(motor.libro).toBe(base);
  });
});

/* ── bloque 53 · consolidar ──────────────────────────────────────────────── */

describe('consolidar · el caso real: Grupo A, Grupo B, Grupo C y un Total', () => {
  it('escribe FÓRMULAS que apuntan a las hojas de origen, no números: cambiar el origen recalcula sola la consolidación', () => {
    const base = libro(
      [
        hoja('ga', 'Grupo A', { B2: '10', B3: '20', B4: '30' }),
        hoja('gb', 'Grupo B', { B2: '1', B3: '2', B4: '3' }),
        hoja('gc', 'Grupo C', { B2: '100', B3: '200', B4: '300' }),
        hoja('t', 'Total', {}),
      ],
      't',
    );
    const motor = crearMotor(base);
    const gesto: Gesto = {
      comando: 'consolidar',
      args: { hoja: 't', origenes: 'Grupo A!B2:B4,Grupo B!B2:B4,Grupo C!B2:B4', destino: 'B2', operacion: 'suma' },
    };
    expect(revisar(motor.libro, gesto)).toBeNull();
    expect(ejecutar(motor, gesto)).toBeNull();

    const total = motor.libro.hojas.find((h) => h.id === 't')!;
    expect(total.celdas.B2.crudo.startsWith('=')).toBe(true);
    expect(v(motor, 't', 'B2')).toBe(111);
    expect(v(motor, 't', 'B3')).toBe(222);
    expect(v(motor, 't', 'B4')).toBe(333);

    // Cambia UN origen y el total se actualiza SOLO, sin volver a consolidar.
    expect(ejecutar(motor, { comando: 'escribir', args: { hoja: 'ga', celda: 'B2', crudo: '50' } })).toBeNull();
    expect(v(motor, 't', 'B2')).toBe(151);
  });

  it('el nombre de hoja con espacio sale entre comillas simples en la fórmula (regresión del defecto de textoDeRef)', () => {
    const base = libro([hoja('ga', 'Grupo A', { B2: '1' }), hoja('t', 'Total', {})], 't');
    const motor = crearMotor(base);
    const gesto: Gesto = {
      comando: 'consolidar',
      args: { hoja: 't', origenes: 'Grupo A!B2:B2', destino: 'C1', operacion: 'suma' },
    };
    expect(ejecutar(motor, gesto)).toBeNull();
    const crudo = motor.libro.hojas.find((h) => h.id === 't')!.celdas.C1.crudo;
    expect(crudo).toBe("=SUMA('Grupo A'!B2)");
    expect(v(motor, 't', 'C1')).toBe(1);
  });

  it('las cinco operaciones —suma, promedio, contar, máx y mín— dan el resultado correcto', () => {
    const base = libro(
      [hoja('o1', 'O1', { B2: '4' }), hoja('o2', 'O2', { B2: '8' }), hoja('o3', 'O3', { B2: '12' }), hoja('r', 'Res', {})],
      'r',
    );
    const motor = crearMotor(base);
    const origenes = 'O1!B2:B2,O2!B2:B2,O3!B2:B2';
    const casos: Array<[string, string, number]> = [
      ['suma', 'B2', 24],
      ['promedio', 'B3', 8],
      ['max', 'B4', 12],
      ['min', 'B5', 4],
      ['contar', 'B6', 3],
    ];
    for (const [operacion, destino, esperado] of casos) {
      const gesto: Gesto = { comando: 'consolidar', args: { hoja: 'r', origenes, destino, operacion } };
      expect(ejecutar(motor, gesto)).toBeNull();
      expect(v(motor, 'r', destino)).toBe(esperado);
    }
  });

  it('jugando mal: consolidar hojas de distinta forma se rechaza sin escribir nada', () => {
    const base = libro(
      [
        hoja('ga', 'Grupo A', { B2: '1', B3: '2', B4: '3' }),
        hoja('gb', 'Grupo B', { B2: '1', B3: '2' }),
        hoja('t', 'Total', {}),
      ],
      't',
    );
    const motor = crearMotor(base);
    const gesto: Gesto = {
      comando: 'consolidar',
      args: { hoja: 't', origenes: 'Grupo A!B2:B4,Grupo B!B2:B3', destino: 'B2', operacion: 'suma' },
    };
    const aviso = revisar(motor.libro, gesto);
    expect(aviso).toMatch(/misma forma/);
    expect(ejecutar(motor, gesto)).not.toBeNull();
    expect(motor.libro.hojas.find((h) => h.id === 't')!.celdas.B2).toBeUndefined();
  });

  it('jugando mal: consolidar una hoja usándose a sí misma como origen se rechaza', () => {
    const base = libro([hoja('ga', 'Grupo A', { B2: '1', B3: '2' }), hoja('gb', 'Grupo B', { B2: '1', B3: '2' })], 'ga');
    const gesto: Gesto = {
      comando: 'consolidar',
      args: { hoja: 'ga', origenes: 'Grupo A!B2:B3,Grupo B!B2:B3', destino: 'C2', operacion: 'suma' },
    };
    expect(revisar(base, gesto)).toMatch(/sí misma/);
  });

  it('grabada y reproducida sobre el libro de partida da el mismo libro', () => {
    const partida = libro([hoja('ga', 'Grupo A', { B2: '5' }), hoja('gb', 'Grupo B', { B2: '7' }), hoja('t', 'Total', {})], 't');
    const motor = crearMotor(partida);
    const grabadora = nuevaGrabadora();
    grabadora.grabando = true;
    const gesto: Gesto = {
      comando: 'consolidar',
      args: { hoja: 't', origenes: 'Grupo A!B2:B2,Grupo B!B2:B2', destino: 'D1', operacion: 'suma' },
    };
    ejecutarVarios(motor, [gesto], grabadora);
    const unaVez = reproducir(partida, grabadora.gestos);
    const otraVez = reproducir(partida, grabadora.gestos);
    expect(unaVez).toEqual(motor.libro);
    expect(unaVez).toEqual(otraVez);
  });
});
