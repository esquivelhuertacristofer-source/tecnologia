/**
 * Tecnia Hojas · el paquete VALIDACIÓN (bloques 32, 39, 40 y 42): validación
 * de datos, buscar/reemplazar/ir a, hipervínculos dentro del libro, e
 * inspeccionar el libro.
 *
 * Se prueba jugando MAL a propósito, que es la regla de la casa: validar un
 * rango que ya tiene datos que no cumplen, una lista vacía, un mínimo mayor
 * que el máximo, escribir algo inválido con `bloquea` en los dos valores,
 * buscar algo que no está, reemplazar en una hoja protegida, «ir a» un
 * nombre que no existe, «ir a» una fila escondida por un filtro, y un
 * hipervínculo a una hoja que ya no está.
 */

import {
  ejecutar,
  ejecutarVarios,
  celdasQueToca,
  nuevaGrabadora,
  reproducir,
  revisar,
  vinculoRoto,
  vinculosHaciaHoja,
  type Gesto,
} from '@/components/office/motor-hojas/comandos';
import { crearMotor } from '@/components/office/motor-hojas/formula/calculo';
import {
  coincidencias,
  crudoDe,
  filaVisible,
  inspeccionar,
  resolverIrA,
  valorDe as valorConsulta,
} from '@/components/office/motor-hojas/consultas';
import { estaConstruido, SIN_CONSTRUIR, SOLO_VENTANA } from '@/components/office/motor-hojas/cinta';
import type { Celda, Hoja, Libro } from '@/components/office/motor-hojas/modelo';

/* ── utilidades, calcadas de motor-hojas-protege.test.ts ────────────────────*/

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

/* ── bloque 32 · validar y quitar-validacion ────────────────────────────────*/

describe('validar y quitar-validacion · bloque 32', () => {
  it('guarda la regla en la hoja, no toca ningún valor, y quitar-validacion la quita', () => {
    const base = libro([hoja('h1', 'Hoja1', {})]);
    const motor = crearMotor(base);
    const g: Gesto = { comando: 'validar', args: { hoja: 'h1', rango: 'B2:B9', clase: 'lista', lista: 'Sí,No' } };

    expect(celdasQueToca(motor.libro, g)).toEqual([]); // una regla no ensucia el recálculo
    expect(ejecutar(motor, g)).toBeNull();
    expect(motor.libro.hojas[0].validaciones).toEqual([{ rango: 'B2:B9', clase: 'lista', lista: ['Sí', 'No'], bloquea: true }]);

    expect(ejecutar(motor, { comando: 'quitar-validacion', args: { hoja: 'h1', rango: 'B2:B9' } })).toBeNull();
    expect(motor.libro.hojas[0].validaciones).toBeUndefined();
  });

  it('jugando mal: una lista vacía no se puede validar', () => {
    const base = libro([hoja('h1', 'Hoja1', {})]);
    const g: Gesto = { comando: 'validar', args: { hoja: 'h1', rango: 'B2:B9', clase: 'lista', lista: '' } };
    expect(revisar(base, g)).toMatch(/al menos una opción/);
  });

  it('jugando mal: un mínimo mayor que el máximo no se puede validar', () => {
    const base = libro([hoja('h1', 'Hoja1', {})]);
    const g: Gesto = { comando: 'validar', args: { hoja: 'h1', rango: 'B2:B9', clase: 'numero', min: 100, max: 10 } };
    expect(revisar(base, g)).toMatch(/mínimo no puede ser mayor/);
  });

  it('jugando mal: validar un rango que YA tiene datos que no cumplen no toca lo que ya estaba escrito', () => {
    const base = libro([hoja('h1', 'Hoja1', { B2: 'Efectivo', B3: 'Transporte' })]);
    const motor = crearMotor(base);
    const g: Gesto = { comando: 'validar', args: { hoja: 'h1', rango: 'B2:B4', clase: 'lista', lista: 'Efectivo,Tarjeta' } };
    expect(ejecutar(motor, g)).toBeNull(); // se acepta aunque B3 ya la viole

    // Lo que ya estaba escrito sigue exactamente igual: nadie lo revalidó.
    expect(crudoDe(motor.libro, 'h1', 'B3')).toBe('Transporte');

    // Y queda demostrado que la regla SÍ está viva: volver a escribir el
    // mismo valor malo, ahora que la regla existe, sí se bloquea.
    const reescribir: Gesto = { comando: 'escribir', args: { hoja: 'h1', celda: 'B3', crudo: 'Transporte' } };
    expect(ejecutar(motor, reescribir)).not.toBeNull();
  });
});

/* ── bloque 32 · escribir con la guarda de validación ────────────────────────*/

describe('escribir con validación · bloquea true/false', () => {
  function motorConValidacion(clase: 'lista' | 'numero', extra: Record<string, string | number>) {
    const base = libro([hoja('h1', 'Hoja1', {})]);
    const motor = crearMotor(base);
    ejecutar(motor, { comando: 'validar', args: { hoja: 'h1', rango: 'B2:B2', clase, ...extra } });
    return motor;
  }

  it('jugando mal: bloquea:true no deja escribir un valor fuera de la lista', () => {
    const motor = motorConValidacion('lista', { lista: 'Efectivo,Tarjeta' });
    const g: Gesto = { comando: 'escribir', args: { hoja: 'h1', celda: 'B2', crudo: 'Cheque' } };
    expect(ejecutar(motor, g)).not.toBeNull();
    expect(v(motor, 'h1', 'B2')).toBeNull();
  });

  it('bloquea:true deja pasar un valor de la lista, sin distinguir mayúsculas', () => {
    const motor = motorConValidacion('lista', { lista: 'Efectivo,Tarjeta' });
    expect(ejecutar(motor, { comando: 'escribir', args: { hoja: 'h1', celda: 'B2', crudo: 'efectivo' } })).toBeNull();
    expect(v(motor, 'h1', 'B2')).toBe('efectivo');
  });

  it('jugando mal: bloquea:false avisa la primera vez y deja pasar con "confirmado"', () => {
    const motor = motorConValidacion('lista', { lista: 'Efectivo,Tarjeta', bloquea: 0 });
    const sinConfirmar: Gesto = { comando: 'escribir', args: { hoja: 'h1', celda: 'B2', crudo: 'Cheque' } };
    expect(ejecutar(motor, sinConfirmar)).not.toBeNull();
    expect(v(motor, 'h1', 'B2')).toBeNull();

    const confirmado: Gesto = { comando: 'escribir', args: { hoja: 'h1', celda: 'B2', crudo: 'Cheque', confirmado: 1 } };
    expect(ejecutar(motor, confirmado)).toBeNull();
    expect(v(motor, 'h1', 'B2')).toBe('Cheque');
  });

  it('borrar una celda nunca dispara la validación ("omitir blancos")', () => {
    const motor = motorConValidacion('lista', { lista: 'Efectivo,Tarjeta' });
    expect(ejecutar(motor, { comando: 'escribir', args: { hoja: 'h1', celda: 'B2', crudo: '' } })).toBeNull();
  });

  it('una fórmula nunca se revisa contra la validación de datos', () => {
    const motor = motorConValidacion('numero', { max: 5, bloquea: 1 });
    const g: Gesto = { comando: 'escribir', args: { hoja: 'h1', celda: 'B2', crudo: '=100' } };
    expect(ejecutar(motor, g)).toBeNull();
    expect(v(motor, 'h1', 'B2')).toBe(100);
  });

  it('la validación de número respeta el mínimo y el máximo', () => {
    const motor = motorConValidacion('numero', { min: 0, max: 100 });
    expect(ejecutar(motor, { comando: 'escribir', args: { hoja: 'h1', celda: 'B2', crudo: '150' } })).not.toBeNull();
    expect(ejecutar(motor, { comando: 'escribir', args: { hoja: 'h1', celda: 'B2', crudo: '50' } })).toBeNull();
    expect(v(motor, 'h1', 'B2')).toBe(50);
  });
});

/* ── bloque 39 · buscar y reemplazar ─────────────────────────────────────────*/

describe('buscar y reemplazar · bloque 39', () => {
  it('buscar el VALOR encuentra una fórmula que lo enseña; buscar en FÓRMULAS no, aunque enseñe lo mismo', () => {
    const base = libro([hoja('h1', 'Hoja1', { A1: '100', B1: '=A1*10' })]);
    const motor = crearMotor(base);
    expect(v(motor, 'h1', 'B1')).toBe(1000);

    expect(coincidencias(motor, 'h1', '1000', false)).toEqual(['h1!B1']);
    expect(coincidencias(motor, 'h1', '1000', true)).toEqual([]); // «=A1*10» no lleva «1000» escrito
  });

  it('jugando mal: buscar algo que no está en ningún sitio', () => {
    const base = libro([hoja('h1', 'Hoja1', { A1: 'hola' })]);
    const motor = crearMotor(base);
    expect(coincidencias(motor, 'h1', 'adiós')).toEqual([]);
  });

  it('reemplazar avisa cuántas celdas —y cuántas fórmulas— va a tocar antes de tocarlas', () => {
    const base = libro([hoja('h1', 'Hoja1', { A1: '=B1*10', B1: '10', C1: '10' })]);
    const motor = crearMotor(base);
    const g: Gesto = { comando: 'reemplazar', args: { hoja: 'h1', rango: 'A1:C1', buscar: '10', reemplazo: '20' } };

    expect(revisar(motor.libro, g)).toMatch(/vas a cambiar 3 celda\(s\), y 1 son fórmulas/);
    expect(ejecutar(motor, g)).not.toBeNull(); // sin confirmar, no se aplica nada
    expect(crudoDe(motor.libro, 'h1', 'A1')).toBe('=B1*10');

    const confirmado: Gesto = { ...g, args: { ...g.args, confirmado: 1 } };
    expect(ejecutar(motor, confirmado)).toBeNull();
    expect(crudoDe(motor.libro, 'h1', 'A1')).toBe('=B1*20');
    expect(crudoDe(motor.libro, 'h1', 'B1')).toBe('20');
  });

  it('jugando mal: reemplazar algo que no aparece se rechaza', () => {
    const base = libro([hoja('h1', 'Hoja1', { A1: 'hola' })]);
    const g: Gesto = { comando: 'reemplazar', args: { hoja: 'h1', rango: 'A1:A1', buscar: 'adiós', reemplazo: 'x' } };
    expect(revisar(base, g)).toMatch(/no se encontró/);
  });

  it('jugando mal: reemplazar en una hoja protegida se bloquea, aunque ya se haya confirmado el recuento', () => {
    const base = libro([hoja('h1', 'Hoja1', { A1: 'abc' }, { protegida: { activa: true } })]);
    const motor = crearMotor(base);
    const g: Gesto = {
      comando: 'reemplazar',
      args: { hoja: 'h1', rango: 'A1:A1', buscar: 'abc', reemplazo: 'xyz', confirmado: 1 },
    };
    expect(ejecutar(motor, g)).not.toBeNull();
    expect(crudoDe(motor.libro, 'h1', 'A1')).toBe('abc');
  });
});

/* ── bloque 39 · ir a ─────────────────────────────────────────────────────── */

describe('ir a · una dirección o un rango con nombre', () => {
  it('resuelve una dirección simple, un domicilio de otra hoja y un rango con nombre', () => {
    const base = libro(
      [hoja('h1', 'Datos', {}), hoja('h2', 'Resumen', {})],
      'h1',
      { nombres: { Ventas: 'Datos!B2:B9' } },
    );
    expect(resolverIrA(base, 'h1', 'B5')).toEqual({ hoja: 'h1', caja: { c0: 1, f0: 4, c1: 1, f1: 4 } });
    expect(resolverIrA(base, 'h1', 'Resumen!C3')).toEqual({ hoja: 'h2', caja: { c0: 2, f0: 2, c1: 2, f1: 2 } });
    expect(resolverIrA(base, 'h2', 'ventas')).toEqual({ hoja: 'h1', caja: { c0: 1, f0: 1, c1: 1, f1: 8 } });
  });

  it('jugando mal: «ir a» un nombre que no existe (y no es una dirección) da null', () => {
    const base = libro([hoja('h1', 'Datos', {})]);
    expect(resolverIrA(base, 'h1', 'NoExiste')).toBeNull();
  });

  it('jugando mal: «ir a» una fila escondida por un filtro devuelve la fila REAL, no la reindexa', () => {
    // La fila 2 (índice 2, «A3») está escondida: no aparece en `visibles`.
    const base = libro([hoja('h1', 'Datos', {}, { visibles: [0, 1, 3, 4] })]);
    expect(filaVisible(base, 'h1', 2)).toBe(false);
    expect(resolverIrA(base, 'h1', 'A3')).toEqual({ hoja: 'h1', caja: { c0: 0, f0: 2, c1: 0, f1: 2 } });
  });
});

/* ── bloque 40 · hipervínculos dentro del libro ─────────────────────────────*/

describe('hipervínculos dentro del libro · bloque 40', () => {
  it('hipervinculo guarda el vínculo y no toca ningún valor; quitar-hipervinculo lo quita', () => {
    const base = libro([hoja('h1', 'Hoja1', {}), hoja('h2', 'Hoja2', {})]);
    const motor = crearMotor(base);
    const g: Gesto = { comando: 'hipervinculo', args: { hoja: 'h1', celda: 'B2', destino: 'h2!A1', texto: 'Ver detalle' } };

    expect(celdasQueToca(motor.libro, g)).toEqual([]);
    expect(ejecutar(motor, g)).toBeNull();
    expect(motor.libro.hojas[0].vinculos).toEqual({ 'h1!B2': { destino: 'h2!A1', texto: 'Ver detalle' } });

    expect(ejecutar(motor, { comando: 'quitar-hipervinculo', args: { hoja: 'h1', celda: 'B2' } })).toBeNull();
    expect(motor.libro.hojas[0].vinculos).toBeUndefined();
  });

  it('jugando mal: un destino mal escrito, o a una hoja que no existe, se rechaza', () => {
    const base = libro([hoja('h1', 'Hoja1', {})]);
    const malEscrito: Gesto = { comando: 'hipervinculo', args: { hoja: 'h1', celda: 'B2', destino: 'no-es-una-clave' } };
    expect(revisar(base, malEscrito)).toMatch(/no es un destino válido/);

    const sinHoja: Gesto = { comando: 'hipervinculo', args: { hoja: 'h1', celda: 'B2', destino: 'h9!A1' } };
    expect(revisar(base, sinHoja)).toMatch(/no existe/);
  });

  it('jugando mal: un vínculo a una hoja que ya no está se detecta roto, y se puede saber quién apuntaba a ella antes de borrarla', () => {
    const conH2 = libro([hoja('h1', 'Hoja1', {}, { vinculos: { 'h1!B2': { destino: 'h2!A1' } } }), hoja('h2', 'Hoja2', {})]);
    const vinculo = conH2.hojas[0].vinculos!['h1!B2'];
    expect(vinculoRoto(conH2, vinculo)).toBe(false);
    expect(vinculosHaciaHoja(conH2, 'h2')).toEqual([{ origen: 'h1!B2', vinculo }]);

    // El mismo libro, DESPUÉS de que «h2» se borrara: no hay comando que lo
    // haga todavía (§40, ningún encargo lo pide), así que se simula el
    // estado que quedaría — «se ve roto, no falla en silencio».
    const sinH2 = libro([conH2.hojas[0]]);
    expect(vinculoRoto(sinH2, vinculo)).toBe(true);
  });
});

/* ── bloque 42 · inspeccionar el libro ───────────────────────────────────────*/

describe('inspeccionar · un parte del libro', () => {
  it('cuenta fórmulas, errores, celdas vacías de un rango y hojas escondidas', () => {
    const base = libro([
      hoja('h1', 'Datos', { A1: '1', A3: '=1/0', B1: '=A1+1' }),
      hoja('h2', 'Notas', {}, { oculta: true }),
    ]);
    const motor = crearMotor(base);

    const parte = inspeccionar(motor, 'h1', 'A1:A3');
    expect(parte.formulas).toBe(2); // A3 y B1, de TODA la hoja h1
    expect(parte.errores).toBe(1); // A3 enseña #¡DIV/0!
    expect(parte.vaciasEnRango).toBe(1); // sólo A2, dentro de A1:A3
    expect(parte.hojasEscondidas).toBe(1); // h2

    expect(inspeccionar(motor, 'h1').vaciasEnRango).toBeNull(); // sin rango, no se finge un 0
  });
});

/* ── la cinta: lo que había que sacar de PENDIENTES ──────────────────────────*/

describe('cinta.ts · buscar y mostrar-formulas ya no están apagados', () => {
  it('salieron de SIN_CONSTRUIR, están construidos, y son SOLO_VENTANA junto con ir-a e inspeccionar', () => {
    for (const id of ['buscar', 'mostrar-formulas']) {
      expect(SIN_CONSTRUIR.has(id)).toBe(false);
      expect(estaConstruido(id)).toBe(true);
    }
    for (const id of ['buscar', 'mostrar-formulas', 'ir-a', 'inspeccionar']) {
      expect(SOLO_VENTANA.has(id)).toBe(true);
    }
  });
});

/* ── la macro: un comando es un dato, y se puede reproducir ─────────────────*/

describe('validar e hipervinculo se graban en la macro, como cualquier otro gesto', () => {
  it('reproducir la macro sobre el libro de partida da el mismo libro que se obtuvo al pulsar', () => {
    const base = libro([hoja('h1', 'Hoja1', {}), hoja('h2', 'Hoja2', {})]);
    const motor = crearMotor(base);
    const grabadora = nuevaGrabadora();
    grabadora.grabando = true;

    ejecutarVarios(
      motor,
      [
        { comando: 'validar', args: { hoja: 'h1', rango: 'B2:B4', clase: 'lista', lista: 'Sí,No' } },
        { comando: 'hipervinculo', args: { hoja: 'h1', celda: 'C1', destino: 'h2!A1' } },
      ],
      grabadora,
    );

    const final = motor.libro;
    expect(reproducir(base, grabadora.gestos)).toEqual(final);
  });
});
