/**
 * Tecnia Hojas · el paquete AUDITORÍA + MACROS (bloques 47, 48, 55 y 56), para
 * `of-excel-auditoria` y `of-excel-macros`. No construye ninguna clase: es el
 * motor que las dos van a necesitar.
 *
 * El grafo de precedentes/dependientes ya vivía en `formula/calculo.ts`
 * (`Motor.precedentes`/`Motor.dependientes`) y ya estaba expuesto en
 * `consultas.ts` (`precedentes()`/`dependientes()`) — este archivo prueba lo
 * que ya había, y añade `flechasDeAuditoria` (las flechas, traducidas a algo
 * que la rejilla puede pintar, respetando `puestoDeFila`) y
 * `errorTapadoPorSiError` (bloque 48: qué error taparía un `SI.ERROR`).
 *
 * Las macros (bloques 55 y 56) son cinco comandos nuevos sobre la
 * `Grabadora` y `Libro.macros` que ya estaban a medio camino: los comandos
 * ya eran datos, `ejecutarVarios` ya recibía la grabadora. Lo que faltaba
 * era guardar la lista grabada con un nombre, ejecutarla, borrarla y
 * asignarla a un botón.
 *
 * Se prueba jugando MAL a propósito, que es la regla de la casa: rastrear
 * una celda sin fórmulas, rastrear una celda en un ciclo circular, grabar
 * una macro vacía, grabar dos con el mismo nombre, ejecutar una macro sobre
 * una hoja que ya no existe, ejecutar una que escribe en una hoja protegida,
 * borrar una macro asignada a un botón, y ejecutar una macro mientras se
 * está grabando otra. Y la prueba que importa: una macro grabada, guardada
 * y reproducida sobre el libro de partida da el MISMO libro, celda a celda.
 */

import {
  ejecutarVarios,
  escribirEn,
  etiquetaDe,
  nuevaGrabadora,
  reproducir,
} from '@/components/office/motor-hojas/comandos';
import { conLibro, crearMotor } from '@/components/office/motor-hojas/formula/calculo';
import {
  dependientes,
  errorDe,
  errorTapadoPorSiError,
  flechasDeAuditoria,
  libroTieneMacros,
  precedentes,
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

/* ── bloque 47 · rastrear precedentes y dependientes ─────────────────────────*/

describe('bloque 47 · el grafo, ya expuesto en consultas.ts', () => {
  it('SUMA(A1:A9) depende de las nueve celdas del rango, y A1 lista a B1 como dependiente', () => {
    const celdas: Record<string, string> = { B1: '=SUMA(A1:A9)' };
    for (let f = 0; f < 9; f += 1) celdas[`A${f + 1}`] = String(f + 1);
    const motor = crearMotor(libro([hoja('h1', 'Hoja1', celdas)]));
    const pre = precedentes(motor, 'h1', 'B1');
    expect(pre).toHaveLength(9);
    expect(pre).toContain('h1!A1');
    expect(pre).toContain('h1!A9');
    expect(dependientes(motor, 'h1', 'A1')).toEqual(['h1!B1']);
  });

  it('jugar mal: rastrear una celda sin fórmulas da la lista vacía en los dos sentidos', () => {
    const motor = crearMotor(libro([hoja('h1', 'Hoja1', { A1: '5' })]));
    expect(precedentes(motor, 'h1', 'A1')).toEqual([]);
    expect(dependientes(motor, 'h1', 'A1')).toEqual([]);
  });

  it('jugar mal: rastrear una celda dentro de un ciclo circular sigue dando sus precedentes — el grafo no filtra el ciclo', () => {
    const motor = crearMotor(libro([hoja('h1', 'Hoja1', { A1: '=B1', B1: '=A1' })]));
    expect(motor.circulares.length).toBeGreaterThan(0);
    expect(precedentes(motor, 'h1', 'A1')).toEqual(['h1!B1']);
    expect(precedentes(motor, 'h1', 'B1')).toEqual(['h1!A1']);
    expect(v(motor, 'h1', 'A1')).toBe(0); // circular: vale 0, no un error inventado
  });

  it('flechasDeAuditoria: en la misma hoja y visible, trae el col y el puesto en pantalla', () => {
    const motor = crearMotor(libro([hoja('h1', 'Hoja1', { A1: '3', B1: '=A1+1' })]));
    expect(flechasDeAuditoria(motor, 'h1', 'B1', 'precedentes')).toEqual([{ celda: 'h1!A1', col: 0, puesto: 0 }]);
  });

  it('flechasDeAuditoria: una referencia a otra hoja no se puede trazar en ESTA rejilla', () => {
    const motor = crearMotor(libro([hoja('h1', 'Hoja1', { A1: '=Hoja2!A1' }), hoja('h2', 'Hoja2', { A1: '9' })]));
    expect(flechasDeAuditoria(motor, 'h1', 'A1', 'precedentes')).toEqual([{ celda: 'h2!A1', col: null, puesto: null }]);
  });

  it('flechasDeAuditoria: una fila escondida por un filtro no tiene puesto', () => {
    const base = libro([hoja('h1', 'Hoja1', { A1: '1', A2: '2', B2: '=A2+1' }, { visibles: [0] })]);
    const motor = crearMotor(base);
    expect(flechasDeAuditoria(motor, 'h1', 'B2', 'precedentes')).toEqual([{ celda: 'h1!A2', col: 0, puesto: null }]);
  });
});

/* ── bloque 48 · los errores como pistas, y SI.ERROR ─────────────────────────*/

describe('bloque 48 · leer los errores antes de taparlos', () => {
  it('los errores se leen como pistas: #¡REF! (se borró algo), #¿NOMBRE? (palabra mal escrita), #¡DIV/0! (falta un dato)', () => {
    const motor = crearMotor(
      libro([hoja('h1', 'Hoja1', { A1: '10', B1: '=A1/0', C1: '=NoExisteHoja!A1', D1: '=UnNombreQueNoEsta' })]),
    );
    expect(errorDe(motor, 'h1', 'B1')).toBe('#¡DIV/0!');
    expect(errorDe(motor, 'h1', 'C1')).toBe('#¡REF!');
    expect(errorDe(motor, 'h1', 'D1')).toBe('#¿NOMBRE?');
  });

  it('errorTapadoPorSiError revela el error que SI.ERROR tapó, sin cambiar lo que la celda enseña', () => {
    const motor = crearMotor(
      libro([hoja('h1', 'Hoja1', { A1: '10', B1: '0', C1: '=SI.ERROR(A1/B1,"n/d")', D1: '=A1/B1' })]),
    );
    expect(v(motor, 'h1', 'C1')).toBe('n/d'); // tapado: la celda no enseña el error
    expect(errorDe(motor, 'h1', 'C1')).toBeNull();
    expect(errorTapadoPorSiError(motor, 'h1', 'C1')).toBe('#¡DIV/0!'); // pero se puede mirar
    expect(errorDe(motor, 'h1', 'D1')).toBe('#¡DIV/0!'); // la misma cuenta, sin tapar
  });

  it('errorTapadoPorSiError da null sin SI.ERROR, y también cuando SI.ERROR no tenía nada que tapar', () => {
    const motor = crearMotor(
      libro([hoja('h1', 'Hoja1', { A1: '10', B1: '2', C1: '=A1/B1', D1: '=SI.ERROR(A1/B1,"n/d")' })]),
    );
    expect(errorTapadoPorSiError(motor, 'h1', 'C1')).toBeNull(); // no usa SI.ERROR
    expect(errorTapadoPorSiError(motor, 'h1', 'D1')).toBeNull(); // usa SI.ERROR, pero no había error
    expect(v(motor, 'h1', 'D1')).toBe(5);
  });
});

/* ── bloques 55 y 56 · grabar, guardar, ejecutar y borrar macros ─────────────*/

describe('bloques 55 y 56 · la grabadora, guardada bajo un nombre', () => {
  it('grabar-macro enciende la grabadora con el nombre puesto, y no se apunta a sí misma en la lista', () => {
    const motor = crearMotor(libro([hoja('h1', 'Hoja1', { A1: '1' })]));
    const grabadora = nuevaGrabadora();
    const r = ejecutarVarios(motor, [{ comando: 'grabar-macro', args: { nombre: 'M1' } }], grabadora);
    expect(r.ok).toBe(true);
    expect(grabadora.grabando).toBe(true);
    expect(grabadora.nombre).toBe('M1');
    expect(grabadora.gestos).toEqual([]);
  });

  it('lo que pasa mientras se graba se acumula en la grabadora, en orden', () => {
    const motor = crearMotor(libro([hoja('h1', 'Hoja1', {})]));
    const grabadora = nuevaGrabadora();
    ejecutarVarios(motor, [{ comando: 'grabar-macro', args: { nombre: 'M1' } }], grabadora);
    ejecutarVarios(motor, [escribirEn('h1', 'A1', '5')], grabadora);
    ejecutarVarios(motor, [escribirEn('h1', 'A2', '=A1*2')], grabadora);
    expect(grabadora.gestos).toEqual([escribirEn('h1', 'A1', '5'), escribirEn('h1', 'A2', '=A1*2')]);
  });

  it('parar-macro guarda la macro bajo su nombre y resetea la grabadora, sin apuntarse a sí misma', () => {
    const motor = crearMotor(libro([hoja('h1', 'Hoja1', {})]));
    const grabadora = nuevaGrabadora();
    ejecutarVarios(motor, [{ comando: 'grabar-macro', args: { nombre: 'M1' } }], grabadora);
    ejecutarVarios(motor, [escribirEn('h1', 'A1', '5')], grabadora);
    const r = ejecutarVarios(motor, [{ comando: 'parar-macro' }], grabadora);
    expect(r.ok).toBe(true);
    expect(motor.libro.macros?.M1).toEqual([escribirEn('h1', 'A1', '5')]);
    expect(grabadora.grabando).toBe(false);
    expect(grabadora.nombre).toBe('');
    expect(grabadora.gestos).toEqual([]);
  });

  it('la lista grabada se lee en español con etiquetaDe: lo que el alumno ve', () => {
    const motor = crearMotor(libro([hoja('h1', 'Hoja1', {})]));
    const grabadora = nuevaGrabadora();
    ejecutarVarios(motor, [{ comando: 'grabar-macro', args: { nombre: 'M1' } }], grabadora);
    ejecutarVarios(motor, [escribirEn('h1', 'A1', '5')], grabadora);
    ejecutarVarios(motor, [{ comando: 'parar-macro' }], grabadora);
    expect((motor.libro.macros?.M1 ?? []).map(etiquetaDe)).toEqual(['Escribir «5» en A1']);
  });

  it('LA PRUEBA QUE IMPORTA: una macro grabada, guardada y reproducida sobre el libro de partida da el mismo libro, celda a celda', () => {
    const partida = libro([hoja('h1', 'Hoja1', { A1: '2', A2: '3' })]);
    const motor = crearMotor(partida);
    const grabadora = nuevaGrabadora();
    ejecutarVarios(motor, [{ comando: 'grabar-macro', args: { nombre: 'M1' } }], grabadora);
    ejecutarVarios(motor, [escribirEn('h1', 'B1', '=A1+A2'), escribirEn('h1', 'B2', '=B1*2')], grabadora);
    ejecutarVarios(motor, [{ comando: 'parar-macro' }], grabadora);

    const macro = motor.libro.macros!.M1;
    const reproducido = reproducir(partida, macro);
    expect(reproducido.hojas).toEqual(motor.libro.hojas);
  });

  it('ejecutar-macro reproduce la macro sobre el libro actual, con recálculo real', () => {
    const motor = crearMotor(libro([hoja('h1', 'Hoja1', { A1: '2' })]));
    const grabadora = nuevaGrabadora();
    ejecutarVarios(motor, [{ comando: 'grabar-macro', args: { nombre: 'Doblar' } }], grabadora);
    ejecutarVarios(motor, [escribirEn('h1', 'B1', '=A1*2')], grabadora);
    ejecutarVarios(motor, [{ comando: 'parar-macro' }], grabadora);

    const r = ejecutarVarios(motor, [{ comando: 'ejecutar-macro', args: { nombre: 'Doblar' } }]);
    expect(r.ok).toBe(true);
    expect(v(motor, 'h1', 'B1')).toBe(4);
  });

  it('borrar-macro la quita del libro, y ejecutarla después avisa limpio en vez de fallar', () => {
    const motor = crearMotor(libro([hoja('h1', 'Hoja1', {})]));
    const grabadora = nuevaGrabadora();
    ejecutarVarios(motor, [{ comando: 'grabar-macro', args: { nombre: 'M1' } }], grabadora);
    ejecutarVarios(motor, [escribirEn('h1', 'A1', '1')], grabadora);
    ejecutarVarios(motor, [{ comando: 'parar-macro' }], grabadora);

    const r = ejecutarVarios(motor, [{ comando: 'borrar-macro', args: { nombre: 'M1' } }]);
    expect(r.ok).toBe(true);
    expect(motor.libro.macros).toBeUndefined();

    const r2 = ejecutarVarios(motor, [{ comando: 'ejecutar-macro', args: { nombre: 'M1' } }]);
    expect(r2.ok).toBe(false);
    expect(r2.aviso).toMatch(/no existe/);
  });

  it('asignar-macro guarda qué macro dispara cada botón, y rechaza asignar una que no existe', () => {
    const motor = crearMotor(libro([hoja('h1', 'Hoja1', {})]));
    const grabadora = nuevaGrabadora();
    ejecutarVarios(motor, [{ comando: 'grabar-macro', args: { nombre: 'M1' } }], grabadora);
    ejecutarVarios(motor, [escribirEn('h1', 'A1', '1')], grabadora);
    ejecutarVarios(motor, [{ comando: 'parar-macro' }], grabadora);

    const r = ejecutarVarios(motor, [{ comando: 'asignar-macro', args: { boton: 'boton1', macro: 'M1' } }]);
    expect(r.ok).toBe(true);
    expect(motor.libro.botones).toEqual({ boton1: 'M1' });

    const r2 = ejecutarVarios(motor, [{ comando: 'asignar-macro', args: { boton: 'boton2', macro: 'Fantasma' } }]);
    expect(r2.ok).toBe(false);
  });

  it('bloque 56: un libro con macros se distingue de uno sin ellas — la señal que un aviso de «habilitar macros» necesitaría', () => {
    const sinMacros = libro([hoja('h1', 'Hoja1', {})]);
    expect(libroTieneMacros(sinMacros)).toBe(false);

    const motor = crearMotor(sinMacros);
    const grabadora = nuevaGrabadora();
    ejecutarVarios(motor, [{ comando: 'grabar-macro', args: { nombre: 'M1' } }], grabadora);
    ejecutarVarios(motor, [escribirEn('h1', 'A1', '1')], grabadora);
    ejecutarVarios(motor, [{ comando: 'parar-macro' }], grabadora);
    expect(libroTieneMacros(motor.libro)).toBe(true);
  });
});

describe('bloques 55 y 56 · jugando MAL a propósito', () => {
  it('grabar una macro vacía se rechaza, y libro.macros no se toca (la grabadora sigue encendida)', () => {
    const motor = crearMotor(libro([hoja('h1', 'Hoja1', {})]));
    const grabadora = nuevaGrabadora();
    ejecutarVarios(motor, [{ comando: 'grabar-macro', args: { nombre: 'Vacia' } }], grabadora);
    const r = ejecutarVarios(motor, [{ comando: 'parar-macro' }], grabadora);
    expect(r.ok).toBe(false);
    expect(r.aviso).toMatch(/vacía/);
    expect(motor.libro.macros).toBeUndefined();
    expect(grabadora.grabando).toBe(true);
  });

  it('grabar dos con el mismo nombre avisa antes de sobrescribir, y con confirmado sí sobrescribe', () => {
    const motor = crearMotor(libro([hoja('h1', 'Hoja1', {})]));
    const g1 = nuevaGrabadora();
    ejecutarVarios(motor, [{ comando: 'grabar-macro', args: { nombre: 'M1' } }], g1);
    ejecutarVarios(motor, [escribirEn('h1', 'A1', '1')], g1);
    ejecutarVarios(motor, [{ comando: 'parar-macro' }], g1);
    expect(motor.libro.macros!.M1).toEqual([escribirEn('h1', 'A1', '1')]);

    const g2 = nuevaGrabadora();
    const sinConfirmar = ejecutarVarios(motor, [{ comando: 'grabar-macro', args: { nombre: 'M1' } }], g2);
    expect(sinConfirmar.ok).toBe(false);
    expect(sinConfirmar.aviso).toMatch(/ya existe/);
    expect(g2.grabando).toBe(false);

    const confirmado = ejecutarVarios(motor, [{ comando: 'grabar-macro', args: { nombre: 'M1', confirmado: 1 } }], g2);
    expect(confirmado.ok).toBe(true);
    ejecutarVarios(motor, [escribirEn('h1', 'A1', '9')], g2);
    ejecutarVarios(motor, [{ comando: 'parar-macro' }], g2);
    expect(motor.libro.macros!.M1).toEqual([escribirEn('h1', 'A1', '9')]);
  });

  it('grabar-macro mientras ya se está grabando otra se rechaza, y la primera sigue grabando intacta', () => {
    const motor = crearMotor(libro([hoja('h1', 'Hoja1', {})]));
    const grabadora = nuevaGrabadora();
    ejecutarVarios(motor, [{ comando: 'grabar-macro', args: { nombre: 'Primera' } }], grabadora);
    const r = ejecutarVarios(motor, [{ comando: 'grabar-macro', args: { nombre: 'Segunda' } }], grabadora);
    expect(r.ok).toBe(false);
    expect(r.aviso).toMatch(/ya estás grabando/);
    expect(grabadora.nombre).toBe('Primera');
    expect(grabadora.grabando).toBe(true);
  });

  it('parar-macro sin estar grabando se rechaza', () => {
    const motor = crearMotor(libro([hoja('h1', 'Hoja1', {})]));
    const r = ejecutarVarios(motor, [{ comando: 'parar-macro' }], nuevaGrabadora());
    expect(r.ok).toBe(false);
    expect(r.aviso).toMatch(/no estás grabando/);
  });

  it('ejecutar una macro mientras se está grabando otra se rechaza, sin contaminar la grabación en curso', () => {
    const motor = crearMotor(libro([hoja('h1', 'Hoja1', { A1: '1' })]));
    const gGuardar = nuevaGrabadora();
    ejecutarVarios(motor, [{ comando: 'grabar-macro', args: { nombre: 'Guardada' } }], gGuardar);
    ejecutarVarios(motor, [escribirEn('h1', 'A2', '2')], gGuardar);
    ejecutarVarios(motor, [{ comando: 'parar-macro' }], gGuardar);

    const gActiva = nuevaGrabadora();
    ejecutarVarios(motor, [{ comando: 'grabar-macro', args: { nombre: 'EnCurso' } }], gActiva);
    ejecutarVarios(motor, [escribirEn('h1', 'A3', '3')], gActiva);

    const libroAntes = motor.libro;
    const r = ejecutarVarios(motor, [{ comando: 'ejecutar-macro', args: { nombre: 'Guardada' } }], gActiva);
    expect(r.ok).toBe(false);
    expect(r.aviso).toMatch(/mientras grabas/);
    expect(r.cambio).toBe(false);
    expect(motor.libro).toBe(libroAntes); // el intento bloqueado no tocó el libro
    expect(gActiva.grabando).toBe(true);
    expect(gActiva.gestos).toEqual([escribirEn('h1', 'A3', '3')]); // no se contaminó
  });

  it('ejecutar una macro cuya hoja de destino ya no existe no rompe nada: se rechaza entera, con aviso', () => {
    const motor = crearMotor(libro([hoja('h1', 'Hoja1', {}), hoja('h2', 'Hoja2', {})]));
    const grabadora = nuevaGrabadora();
    ejecutarVarios(motor, [{ comando: 'grabar-macro', args: { nombre: 'EscribeEnH2' } }], grabadora);
    ejecutarVarios(motor, [escribirEn('h2', 'A1', '5')], grabadora);
    ejecutarVarios(motor, [{ comando: 'parar-macro' }], grabadora);

    // La hoja h2 desaparece del libro (un archivo que perdió una hoja).
    conLibro(motor, { ...motor.libro, hojas: motor.libro.hojas.filter((h) => h.id !== 'h2') }, 'todo');

    const r = ejecutarVarios(motor, [{ comando: 'ejecutar-macro', args: { nombre: 'EscribeEnH2' } }]);
    expect(r.ok).toBe(false);
    expect(r.aviso).toMatch(/no existe/);
  });

  it('ejecutar una macro que escribe en una hoja protegida se rechaza entera — todo o nada, ni el primer gesto se cuela', () => {
    const motor = crearMotor(libro([hoja('h1', 'Hoja1', { A1: '1' })]));
    const grabadora = nuevaGrabadora();
    ejecutarVarios(motor, [{ comando: 'grabar-macro', args: { nombre: 'M1' } }], grabadora);
    ejecutarVarios(motor, [escribirEn('h1', 'B1', '2'), escribirEn('h1', 'B2', '3')], grabadora);
    ejecutarVarios(motor, [{ comando: 'parar-macro' }], grabadora);

    conLibro(
      motor,
      { ...motor.libro, hojas: motor.libro.hojas.map((h) => (h.id === 'h1' ? { ...h, protegida: { activa: true } } : h)) },
      'todo',
    );

    const libroAntes = motor.libro;
    const r = ejecutarVarios(motor, [{ comando: 'ejecutar-macro', args: { nombre: 'M1' } }]);
    expect(r.ok).toBe(false);
    expect(r.aviso).toMatch(/protegida/);
    expect(r.cambio).toBe(false);
    expect(motor.libro).toBe(libroAntes); // todo o nada: ni el primer gesto se cuela
  });

  it('borrar una macro asignada a un botón se deja — el botón se queda apuntando a un nombre que ya no existe, y se ve roto al usarlo', () => {
    const motor = crearMotor(libro([hoja('h1', 'Hoja1', {})]));
    const grabadora = nuevaGrabadora();
    ejecutarVarios(motor, [{ comando: 'grabar-macro', args: { nombre: 'M1' } }], grabadora);
    ejecutarVarios(motor, [escribirEn('h1', 'A1', '1')], grabadora);
    ejecutarVarios(motor, [{ comando: 'parar-macro' }], grabadora);
    ejecutarVarios(motor, [{ comando: 'asignar-macro', args: { boton: 'boton1', macro: 'M1' } }]);

    const r = ejecutarVarios(motor, [{ comando: 'borrar-macro', args: { nombre: 'M1' } }]);
    expect(r.ok).toBe(true);
    expect(motor.libro.botones).toEqual({ boton1: 'M1' }); // el botón no se limpia solo

    const r2 = ejecutarVarios(motor, [{ comando: 'ejecutar-macro', args: { nombre: motor.libro.botones!.boton1 } }]);
    expect(r2.ok).toBe(false);
    expect(r2.aviso).toMatch(/no existe/);
  });
});

/* ── contrato de la cinta: dónde caen los ids nuevos ─────────────────────────*/

describe('cinta.ts · dónde caen los siete ids nuevos', () => {
  it('rastrear-precedentes y rastrear-dependientes son SOLO_VENTANA: no tocan el libro', () => {
    expect(SOLO_VENTANA.has('rastrear-precedentes')).toBe(true);
    expect(SOLO_VENTANA.has('rastrear-dependientes')).toBe(true);
  });

  it('los cinco comandos de macro son motor ya cableado, no PENDIENTES', () => {
    for (const id of ['grabar-macro', 'parar-macro', 'ejecutar-macro', 'borrar-macro', 'asignar-macro']) {
      expect(SIN_CONSTRUIR.has(id)).toBe(false);
      expect(estaConstruido(id)).toBe(true);
    }
  });
});
