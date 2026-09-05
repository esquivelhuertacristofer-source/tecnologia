/**
 * Estudio de impacto — la cola sobre IndexedDB.
 *
 * POR QUÉ EXISTE ESTE ARCHIVO. jsdom no trae IndexedDB, así que el resto de las
 * pruebas de la cola ejercitan el camino de respaldo (`localStorage`) y **el
 * camino principal —el que van a usar todos los alumnos reales, porque todos
 * los navegadores modernos traen IndexedDB— se quedaba sin ejecutar ni una sola
 * vez.** Un módulo escrito y revisado pero jamás ejecutado no es código
 * probado: es una intención.
 *
 * `fake-indexeddb` es una implementación completa de la especificación, no un
 * doble de mentira, así que lo que se prueba aquí es el comportamiento de
 * verdad: transacciones, el evento `upgradeneeded`, el modelo de peticiones con
 * `onsuccess`/`onerror` y el `keyPath`.
 *
 * Lo que sigue SIN probarse, y conviene saberlo: el comportamiento con la base
 * bloqueada por otra pestaña (el `setTimeout` de rescate de `abrir()`) y las
 * cuotas de disco reales del navegador.
 */

/*
 * `structuredClone` A MANO, Y NO ES UN CAPRICHO. `fake-indexeddb` lo usa para
 * copiar cada valor que se guarda —IndexedDB guarda copias, no referencias— y
 * `jest-environment-jsdom` no lo expone como global aunque Node lo tenga. Sin
 * esto, el primer `put` revienta con «structuredClone is not defined» y este
 * archivo entero se cae. Se descubrió al escribirlo: es la razón por la que el
 * camino de IndexedDB llevaba sin ejecutarse ni una vez.
 *
 * Se usa el serializador de V8, que es un clon estructurado de verdad, en vez
 * de un `JSON.parse(JSON.stringify(...))` que aplastaría fechas y undefined.
 *
 * Va ANTES del import de `fake-indexeddb/auto` a propósito.
 */
import { deserialize, serialize } from 'node:v8';

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = ((v: unknown) => deserialize(serialize(v))) as typeof structuredClone;
}

import 'fake-indexeddb/auto';

import {
  confirmar,
  cuantasPendientes,
  encolar,
  marcarIntento,
  pendientes,
  vaciarCola,
  TOPE_INTENTOS,
} from '@/lib/estudio/cola';

beforeEach(async () => {
  localStorage.clear();
  await vaciarCola();
});

describe('la cola usa IndexedDB cuando existe', () => {
  it('IndexedDB está disponible en esta prueba (si no, no se prueba nada)', () => {
    // Sin esta comprobación, todo el archivo pasaría en verde ejercitando el
    // camino de `localStorage` y nadie se enteraría. Es la trampa clásica.
    expect(typeof indexedDB).not.toBe('undefined');
    expect(indexedDB).not.toBeNull();
  });

  it('guarda y devuelve lo pendiente', async () => {
    await encolar('estudio_respuestas', { reactivo: 'E01' });
    await encolar('estudio_respuestas', { reactivo: 'E02' });

    expect(await cuantasPendientes()).toBe(2);
    const filas = await pendientes();
    expect(filas.map((f) => f.fila.reactivo).sort()).toEqual(['E01', 'E02']);
  });

  it('NO escribe en localStorage cuando hay IndexedDB', async () => {
    await encolar('estudio_respuestas', { reactivo: 'E01' });
    // Si esto tuviera algo, es que se estaría usando el camino de respaldo y
    // esta prueba no estaría comprobando lo que dice comprobar.
    expect(localStorage.getItem('tecnia_estudio_cola')).toBeNull();
  });

  it('el mismo evento_id no crea dos filas: el keyPath lo impide', async () => {
    const id = await encolar('t', { n: 1 });
    await encolar('t', { n: 2 }, id);
    expect(await cuantasPendientes()).toBe(1);
  });
});

describe('confirmar', () => {
  it('borra sólo las confirmadas, y las cien de un lote en una transacción', async () => {
    const ids: string[] = [];
    for (let i = 0; i < 100; i += 1) ids.push(await encolar('t', { n: i }));
    const sobra = await encolar('t', { n: 999 });

    await confirmar(ids);

    const quedan = await pendientes();
    expect(quedan).toHaveLength(1);
    expect(quedan[0].eventoId).toBe(sobra);
  });

  it('confirmar una lista vacía no hace nada ni revienta', async () => {
    await encolar('t', { n: 1 });
    await confirmar([]);
    expect(await cuantasPendientes()).toBe(1);
  });
});

describe('marcarIntento', () => {
  it('sube el contador de las filas indicadas y no toca las demás', async () => {
    const a = await encolar('t', { n: 1 });
    await encolar('t', { n: 2 });

    await marcarIntento([a]);

    const filas = await pendientes();
    expect(filas.find((f) => f.eventoId === a)!.intentos).toBe(1);
    expect(filas.find((f) => f.eventoId !== a)!.intentos).toBe(0);
  });

  it('descarta la fila que el servidor rechaza siempre, para que no tapone', async () => {
    const id = await encolar('t', { n: 1 });
    await encolar('t', { n: 2 });

    let descartadas: string[] = [];
    for (let i = 0; i < TOPE_INTENTOS; i += 1) descartadas = await marcarIntento([id]);

    expect(descartadas).toContain(id);
    const quedan = await pendientes();
    expect(quedan).toHaveLength(1);
    expect(quedan[0].eventoId).not.toBe(id);
  });
});

describe('vaciarCola', () => {
  it('deja la cola como recién instalada', async () => {
    await encolar('t', { n: 1 });
    await encolar('t', { n: 2 });
    await vaciarCola();
    expect(await cuantasPendientes()).toBe(0);
  });
});

describe('el límite de pendientes', () => {
  it('`pendientes(n)` devuelve como mucho n filas', async () => {
    for (let i = 0; i < 10; i += 1) await encolar('t', { n: i });
    expect(await pendientes(4)).toHaveLength(4);
    expect(await cuantasPendientes()).toBe(10); // el conteo no se recorta
  });
});
