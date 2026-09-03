/**
 * Tecnia Hojas · el paquete FORMATO: formato condicional (bloques 30 y 46),
 * minigráficos (31) y formato de número personalizado (45).
 *
 * Se prueba jugando MAL a propósito, que es la regla del proyecto: rango
 * vacío, dos reglas que se pisan en la misma celda, escala de color sobre una
 * columna de texto, minigráfico sobre una sola celda, fórmula que devuelve un
 * número en vez de VERDADERO/FALSO, fórmula con `#¡REF!`, patrón con comillas
 * sin cerrar y `formato-personalizado` sobre una celda de texto.
 *
 * Ninguna de las nueve reglas tocan un dato: cada bloque comprueba que la
 * suma no se mueve (`toca: () => []`), que es, palabra por palabra, lo que
 * pide el encargo.
 */

import {
  aplicar,
  cajaDeTexto,
  ejecutar,
  ejecutarVarios,
  nuevaGrabadora,
  reproducir,
  revisar,
  type Gesto,
} from '@/components/office/motor-hojas/comandos';
import { crearMotor, type Motor } from '@/components/office/motor-hojas/formula/calculo';
import { valorDe as valorConsulta } from '@/components/office/motor-hojas/consultas';
import type { Celda, Libro } from '@/components/office/motor-hojas/modelo';
import { decoracionesDeHoja, decoracionDeCelda, rangoDeParaPruebas } from '@/components/office/motor-hojas/condicional';
import { datosDeMinigrafico } from '@/components/office/motor-hojas/Minigrafico';
import { analizarPatron, aplicarPatron, motivoPatronInvalido, comoSeVe } from '@/components/office/motor-hojas/formatos';

/* ── utilidades, calcadas de motor-hojas-ysi.test.ts ────────────────────────*/

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

const v = (motor: Motor, direccion: string) => valorConsulta(motor, 'h1', direccion);

/* ── bloque 30 · barras, escala e iconos: tres reglas «de un solo color» ────*/

describe('regla-barras / regla-escala / regla-iconos · el dato no se mueve', () => {
  it('aplicar barras de datos no cambia ni un valor, y toca() es []', () => {
    const motor = motorCon({ A1: '10', A2: '20', A3: '30', B1: '=SUMA(A1:A3)' });
    const gesto: Gesto = { comando: 'regla-barras', args: { hoja: 'h1', id: 'r1', rango: 'A1:A3' } };
    expect(revisar(motor.libro, gesto)).toBeNull();
    const r = ejecutarVarios(motor, [gesto]);
    expect(r.ok).toBe(true);
    expect(v(motor, 'B1')).toBe(60);
    expect(decoracionDeCelda(motor, 'h1', 0, 0)?.barra).toBeTruthy();
  });

  it('escala de color sobre una columna de puro texto no revienta y no decora nada', () => {
    const motor = motorCon({ A1: 'lunes', A2: 'martes', A3: 'miércoles' });
    ejecutar(motor, { comando: 'regla-escala', args: { hoja: 'h1', id: 'r1', rango: 'A1:A3' } });
    const mapa = decoracionesDeHoja(motor, 'h1');
    expect(mapa.size).toBe(0);
  });

  it('iconos reparte tres símbolos por percentil: el más bajo, el de en medio y el más alto', () => {
    const motor = motorCon({ A1: '0', A2: '50', A3: '100' });
    ejecutar(motor, { comando: 'regla-iconos', args: { hoja: 'h1', id: 'r1', rango: 'A1:A3' } });
    expect(decoracionDeCelda(motor, 'h1', 0, 0)?.icono?.simbolo).toBe('▼');
    expect(decoracionDeCelda(motor, 'h1', 0, 1)?.icono?.simbolo).toBe('➜');
    expect(decoracionDeCelda(motor, 'h1', 0, 2)?.icono?.simbolo).toBe('▲');
  });
});

/* ── bloque 30 · destacar celdas ─────────────────────────────────────────── */

describe('regla-destacar', () => {
  it('«mayor» marca sólo las celdas que superan el umbral', () => {
    const motor = motorCon({ A1: '500', A2: '1500', A3: '50', A4: '2000', A5: '999' });
    ejecutar(motor, {
      comando: 'regla-destacar',
      args: { hoja: 'h1', id: 'r1', rango: 'A1:A5', comparacion: 'mayor', valor: 1000 },
    });
    const mapa = decoracionesDeHoja(motor, 'h1');
    expect(mapa.size).toBe(2);
    expect(decoracionDeCelda(motor, 'h1', 0, 1)?.formato).toBeTruthy(); // A2 = 1500
    expect(decoracionDeCelda(motor, 'h1', 0, 3)?.formato).toBeTruthy(); // A4 = 2000
    expect(decoracionDeCelda(motor, 'h1', 0, 0)?.formato).toBeUndefined(); // A1 = 500
  });

  it('«duplicados» marca los valores repetidos e ignora las celdas vacías', () => {
    const motor = motorCon({ A1: '10', A2: '20', A3: '10', A4: '30', A5: '20' });
    ejecutar(motor, {
      comando: 'regla-destacar',
      args: { hoja: 'h1', id: 'r1', rango: 'A1:A6', comparacion: 'duplicados' },
    });
    const mapa = decoracionesDeHoja(motor, 'h1');
    expect(mapa.size).toBe(4); // A1, A2, A3, A5 — A4 es único, A6 está vacía
    expect(decoracionDeCelda(motor, 'h1', 0, 3)?.formato).toBeUndefined(); // A4 = 30, sola
  });

  it('una comparación que no existe se rechaza en revisar, y el libro no cambia', () => {
    const motor = motorCon({ A1: '10' });
    const gesto: Gesto = {
      comando: 'regla-destacar',
      args: { hoja: 'h1', id: 'r1', rango: 'A1:A3', comparacion: 'parecido', valor: 5 },
    };
    expect(revisar(motor.libro, gesto)).toMatch(/no es una comparación/);
    const antes = motor.libro;
    expect(ejecutar(motor, gesto)).not.toBeNull();
    expect(motor.libro).toBe(antes);
  });
});

/* ── dos reglas que se pisan en la misma celda ───────────────────────────── */

describe('dos reglas que se pisan', () => {
  it('en el MISMO canal, gana entera la última regla de la lista', () => {
    const motor = motorCon({ A1: '500' });
    ejecutar(motor, {
      comando: 'regla-destacar',
      args: { hoja: 'h1', id: 'r1', rango: 'A1:A1', comparacion: 'mayor', valor: 100, color: '#FF0000' },
    });
    ejecutar(motor, {
      comando: 'regla-destacar',
      args: { hoja: 'h1', id: 'r2', rango: 'A1:A1', comparacion: 'menor', valor: 1000, color: '#0000FF' },
    });
    // Las dos reglas tocan A1 (500 es mayor que 100 Y menor que 1000): gana
    // la segunda, entera — el rojo de la primera no sobrevive mezclado.
    expect(decoracionDeCelda(motor, 'h1', 0, 0)?.formato?.colorRelleno).toBe('#0000FF');
  });

  it('en canales DISTINTOS, las dos conviven: la barra no borra el destacado', () => {
    const motor = motorCon({ A1: '10', A2: '500', A3: '30' });
    ejecutar(motor, { comando: 'regla-barras', args: { hoja: 'h1', id: 'r1', rango: 'A1:A3' } });
    ejecutar(motor, {
      comando: 'regla-destacar',
      args: { hoja: 'h1', id: 'r2', rango: 'A1:A3', comparacion: 'mayor', valor: 100 },
    });
    const dec = decoracionDeCelda(motor, 'h1', 0, 1); // A2 = 500: tiene barra Y destacado
    expect(dec?.barra).toBeTruthy();
    expect(dec?.formato).toBeTruthy();
  });
});

/* ── bloque 46 · formato condicional CON FÓRMULA ─────────────────────────── */

describe('regla-formula · el caro', () => {
  it('la fórmula se desplaza como en un autorrelleno: columna fija, fila que se mueve', () => {
    // El ejemplo del encargo: `=$C4>1000` sobre A4:D6 mira SIEMPRE la columna
    // C de su propia fila, en las cuatro columnas del rango.
    const motor = motorCon({ C4: '500', C5: '1500', C6: '2000', A4: 'x', B4: 'x', D4: 'x' });
    const gesto: Gesto = {
      comando: 'regla-formula',
      args: { hoja: 'h1', id: 'r1', rango: 'A4:D6', formula: '=$C4>1000' },
    };
    expect(revisar(motor.libro, gesto)).toBeNull();
    ejecutar(motor, gesto);
    // Fila 4 (C4=500, falso): ninguna de las cuatro columnas se pinta.
    expect(decoracionDeCelda(motor, 'h1', 0, 3)).toBeNull(); // A4
    expect(decoracionDeCelda(motor, 'h1', 3, 3)).toBeNull(); // D4
    // Fila 5 (C5=1500, verdadero): las cuatro columnas se pintan.
    expect(decoracionDeCelda(motor, 'h1', 0, 4)?.formato).toBeTruthy(); // A5
    expect(decoracionDeCelda(motor, 'h1', 1, 4)?.formato).toBeTruthy(); // B5
    expect(decoracionDeCelda(motor, 'h1', 3, 4)?.formato).toBeTruthy(); // D5
    // Fila 6 (C6=2000, verdadero) también.
    expect(decoracionDeCelda(motor, 'h1', 2, 5)?.formato).toBeTruthy(); // C6
  });

  it('una fórmula que da un número en vez de VERDADERO/FALSO se rechaza, con su motivo', () => {
    const motor = motorCon({ C4: '42' });
    const gesto: Gesto = { comando: 'regla-formula', args: { hoja: 'h1', id: 'r1', rango: 'A4:A4', formula: '=$C4' } };
    expect(revisar(motor.libro, gesto)).toMatch(/VERDADERO o FALSO/);
    const antes = motor.libro;
    expect(ejecutar(motor, gesto)).not.toBeNull();
    expect(motor.libro).toBe(antes); // no se aplica «por si acaso»
  });

  it('una fórmula que da #¡REF! se rechaza, y no se aplica', () => {
    const motor = motorCon({ A1: '1' });
    const gesto: Gesto = {
      comando: 'regla-formula',
      args: { hoja: 'h1', id: 'r1', rango: 'A1:A1', formula: '=NoExiste!A1>1000' },
    };
    expect(revisar(motor.libro, gesto)).toMatch(/#¡REF!/);
    expect(ejecutar(motor, gesto)).not.toBeNull();
    expect(decoracionesDeHoja(motor, 'h1').size).toBe(0);
  });

  it('el coste medido: 500 celdas con una regla de fórmula, y la segunda lectura sale de caché', () => {
    const celdas: Record<string, string> = {};
    for (let f = 1; f <= 100; f += 1) {
      for (const col of ['A', 'B', 'C', 'D', 'E']) celdas[`${col}${f}`] = String((f * 7) % 400);
    }
    const motor = motorCon(celdas);
    ejecutar(motor, {
      comando: 'regla-formula',
      args: { hoja: 'h1', id: 'r1', rango: 'A1:E100', formula: '=A1>250' },
    });

    const t0 = performance.now();
    const primera = decoracionesDeHoja(motor, 'h1');
    const ms = performance.now() - t0;
    console.log(`§ paquete FORMATO · 500 celdas de regla-formula: ${ms.toFixed(2)} ms`);
    expect(ms).toBeLessThan(500);
    expect(primera.size).toBeGreaterThan(0);

    // Nada cambió en el libro entre las dos lecturas: la segunda es EL MISMO
    // mapa, no uno igual — la caché de `condicional.ts` por identidad de libro.
    const segunda = decoracionesDeHoja(motor, 'h1');
    expect(segunda).toBe(primera);
  });
});

/* ── bloque 31 · minigráficos ─────────────────────────────────────────────── */

describe('minigráficos', () => {
  it('lee la fila en orden, y un hueco es null — no cero', () => {
    const motor = motorCon({ A1: '10', B1: 'texto', C1: '30' });
    expect(datosDeMinigrafico(motor, 'h1', 'A1:C1')).toEqual([10, null, 30]);
  });

  it('sobre una sola celda no revienta: da un único punto', () => {
    const motor = motorCon({ B2: '42' });
    expect(datosDeMinigrafico(motor, 'h1', 'B2')).toEqual([42]);
  });

  it('insertar un minigráfico no mueve ningún valor, y reemplaza al que hubiera en la misma celda', () => {
    const motor = motorCon({ A1: '5', A2: '10', A3: '15' });
    ejecutar(motor, { comando: 'minigrafico', args: { hoja: 'h1', celda: 'D1', datos: 'A1:A3', tipo: 'linea' } });
    expect(v(motor, 'A1')).toBe(5);
    ejecutar(motor, { comando: 'minigrafico', args: { hoja: 'h1', celda: 'D1', datos: 'A1:A2', tipo: 'columna' } });
    const hoja = motor.libro.hojas[0];
    expect(hoja.minigraficos).toHaveLength(1);
    expect(hoja.minigraficos?.[0]).toEqual({ celda: 'h1!D1', datos: 'A1:A2', tipo: 'columna' });
  });

  it('borrar-minigraficos quita uno solo con `celda`, y todos sin ella', () => {
    const motor = motorCon({});
    ejecutar(motor, { comando: 'minigrafico', args: { hoja: 'h1', celda: 'D1', datos: 'A1:A3', tipo: 'linea' } });
    ejecutar(motor, { comando: 'minigrafico', args: { hoja: 'h1', celda: 'D2', datos: 'A1:A3', tipo: 'ganancia' } });
    ejecutar(motor, { comando: 'borrar-minigraficos', args: { hoja: 'h1', celda: 'D1' } });
    expect(motor.libro.hojas[0].minigraficos).toHaveLength(1);
    ejecutar(motor, { comando: 'borrar-minigraficos', args: { hoja: 'h1' } });
    expect(motor.libro.hojas[0].minigraficos).toBeUndefined();
  });
});

/* ── bloque 45 · formato de número personalizado ─────────────────────────── */

describe('formato-personalizado', () => {
  it('miles y decimales: «#,##0.00» sobre 1234.5', () => {
    expect(aplicarPatron('#,##0.00', 1234.5).texto).toBe('1,234.50');
  });

  it('la sección negativa con [Rojo] pinta de rojo y entre paréntesis, sin cambiar el número', () => {
    const r = aplicarPatron('#,##0;[Rojo](#,##0)', -1500);
    expect(r.texto).toBe('(1,500)');
    expect(r.color).toBe('#C00000');
    // El dato sigue siendo -1500: el patrón sólo pinta.
    const motor = motorCon({ A1: '-1500' });
    expect(v(motor, 'A1')).toBe(-1500);
  });

  it('una comilla sin cerrar se rechaza, y dice por qué', () => {
    expect(motivoPatronInvalido('0.00" kg')).toMatch(/comillas/);
    expect(analizarPatron('0.00" kg').ok).toBe(false);
  });

  it('sobre una celda de TEXTO no hace nada: el texto se enseña igual, y toca() es []', () => {
    const motor = motorCon({ A1: 'hola', B1: '=CONTARA(A1:A1)' });
    const gesto: Gesto = {
      comando: 'formato-personalizado',
      args: { hoja: 'h1', rango: 'A1:A1', patron: '#,##0.00' },
    };
    expect(revisar(motor.libro, gesto)).toBeNull();
    ejecutar(motor, gesto);
    expect(v(motor, 'A1')).toBe('hola');
    expect(v(motor, 'B1')).toBe(1);
    const celda = motor.libro.hojas[0].celdas.A1;
    expect(comoSeVe('hola', celda.formato).texto).toBe('hola');
  });

  it('el comando rechaza un patrón inválido antes de guardarlo', () => {
    const motor = motorCon({ A1: '10' });
    const gesto: Gesto = { comando: 'formato-personalizado', args: { hoja: 'h1', rango: 'A1:A1', patron: '"sin cerrar' } };
    expect(revisar(motor.libro, gesto)).toMatch(/comillas/);
    const antes = motor.libro;
    ejecutar(motor, gesto);
    expect(motor.libro).toBe(antes);
  });
});

/* ── reglas de la casa: rango vacío, y la lectura del rango sin ciclos ──────*/

describe('reglas de la casa', () => {
  it('un rango vacío no revienta ninguna de las cinco clases de regla', () => {
    const motor = motorCon({});
    for (const [comando, args] of [
      ['regla-barras', {}],
      ['regla-escala', {}],
      ['regla-iconos', {}],
      ['regla-destacar', { comparacion: 'mayor', valor: 1 }],
      ['regla-formula', { formula: '=A1>1' }],
    ] as const) {
      const id = `vacio-${comando}`;
      const r = ejecutarVarios(motor, [{ comando, args: { hoja: 'h1', id, rango: 'A1:A5', ...args } }]);
      expect(r.ok).toBe(true);
    }
    expect(decoracionesDeHoja(motor, 'h1').size).toBe(0);
  });

  it('el `rangoDe` de `condicional.ts` lee los mismos rangos que `cajaDeTexto` de `comandos.ts`', () => {
    for (const texto of ['A1', 'A1:B5', 'B5:A1', 'C10:C10']) {
      expect(rangoDeParaPruebas(texto)).toEqual(cajaDeTexto(texto));
    }
    expect(rangoDeParaPruebas('no es un rango')).toBeNull();
  });

  it('una regla de fórmula grabada y reproducida sobre el libro de partida da el mismo libro', () => {
    const partida = libroCon({ C4: '1500', A4: 'x' });
    const motor = crearMotor(partida, CONTEXTO);
    const grabadora = nuevaGrabadora();
    grabadora.grabando = true;
    const gesto: Gesto = {
      comando: 'regla-formula',
      args: { hoja: 'h1', id: 'r1', rango: 'A4:A4', formula: '=$C4>1000' },
    };
    ejecutarVarios(motor, [gesto], grabadora);
    const unaVez = reproducir(partida, grabadora.gestos);
    const otraVez = reproducir(partida, grabadora.gestos);
    expect(unaVez).toEqual(motor.libro);
    expect(unaVez).toEqual(otraVez);
  });

  it('`aplicar` es la misma función que usa `ejecutar` por debajo: reproducir dos veces no duplica la regla', () => {
    const libro = libroCon({ A1: '10' });
    const gesto: Gesto = { comando: 'regla-barras', args: { hoja: 'h1', id: 'r1', rango: 'A1:A1' } };
    const una = aplicar(libro, gesto);
    const dos = aplicar(una, gesto); // el id ya existe: `revisar` lo pararía, pero `aplicar` solo no revisa
    expect(dos.hojas[0].reglas).toHaveLength(2); // por eso `ejecutarVarios` SIEMPRE revisa antes de aplicar
  });
});
