/**
 * Estudio de impacto — la cola de envío y la aplicación de un cuestionario.
 *
 * NOTA HONESTA SOBRE LA COBERTURA. jsdom no trae IndexedDB, así que estas
 * pruebas ejercitan el CAMINO DE RESPALDO de la cola (`localStorage`), no el
 * de IndexedDB. Los dos comparten la API y las reglas —tope, borrado por
 * confirmación, descarte tras N intentos—, pero el de IndexedDB **no se
 * ejercita aquí**. Quien lo cubre es `estudio-cola-indexeddb.test.ts`, que monta
 * un IndexedDB de mentira antes de cargar el módulo.
 */

import {
  confirmar,
  cuantasPendientes,
  encolar,
  marcarIntento,
  pendientes,
  vaciarCola,
  TOPE_INTENTOS,
} from '@/lib/estudio/cola';
import { iniciar, responder, TABLA_APLICADOS, TABLA_RESPUESTAS } from '@/lib/estudio/cuestionario/aplicacion';
import { borrarAvance, fusionar, guardarAvance, leerAvance } from '@/lib/estudio/cuestionario/almacen';
import { avanceInicial } from '@/lib/estudio/cuestionario/motor';
import { bancoDe } from '@/lib/estudio/cuestionario/bancos';
import { esUuid, identidadLocal, nuevoUuid } from '@/lib/estudio/identidad';
import { truncarIp, tipoDeDispositivo } from '@/lib/estudio/dispositivo';
import { erroresRecientes, limpiarErroresRecientes, registrarError, sinRomper } from '@/lib/estudio/errores';
import type { IdentidadEstudio } from '@/lib/estudio/identidad';

const IDENT: IdentidadEstudio = { estudioId: '22222222-2222-4222-8222-222222222222', ancla: 'cuenta' };

beforeEach(async () => {
  localStorage.clear();
  limpiarErroresRecientes();
  await vaciarCola();
});

describe('identidad de estudio', () => {
  it('genera UUID v4 válidos aunque no haya crypto.randomUUID', () => {
    const original = globalThis.crypto;
    // @ts-expect-error — se quita a propósito para probar el respaldo
    delete globalThis.crypto;
    const id = nuevoUuid();
    expect(esUuid(id)).toBe(true);
    expect(id[14]).toBe('4'); // versión 4
    Object.defineProperty(globalThis, 'crypto', { value: original, configurable: true });
  });

  it('el identificador del navegador se conserva entre visitas', () => {
    const a = identidadLocal();
    const b = identidadLocal();
    expect(a.estudioId).toBe(b.estudioId);
    expect(a.ancla).toBe('navegador');
  });

  it('un identificador corrupto en localStorage se reemplaza, no revienta', () => {
    localStorage.setItem('tecnia_estudio_id', 'no-soy-un-uuid');
    const a = identidadLocal();
    expect(esUuid(a.estudioId)).toBe(true);
  });
});

describe('la cola nunca pierde ni bloquea', () => {
  it('encola y devuelve lo pendiente', async () => {
    await encolar('estudio_respuestas', { reactivo: 'E01' });
    await encolar('estudio_respuestas', { reactivo: 'E02' });
    expect(await cuantasPendientes()).toBe(2);
    const filas = await pendientes();
    expect(filas.map((f) => f.fila.reactivo)).toEqual(['E01', 'E02']);
    expect(filas.every((f) => esUuid(f.eventoId))).toBe(true);
  });

  it('confirmar borra sólo las filas confirmadas', async () => {
    const a = await encolar('t', { n: 1 });
    await encolar('t', { n: 2 });
    await confirmar([a]);
    const quedan = await pendientes();
    expect(quedan).toHaveLength(1);
    expect(quedan[0].fila.n).toBe(2);
  });

  it('una fila que el servidor rechaza siempre acaba descartada, no tapona la cola', async () => {
    const id = await encolar('t', { n: 1 });
    let descartadas: string[] = [];
    for (let i = 0; i < TOPE_INTENTOS; i += 1) descartadas = await marcarIntento([id]);
    expect(descartadas).toContain(id);
    expect(await cuantasPendientes()).toBe(0);
  });

  it('con localStorage roto, encolar no lanza', async () => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('QuotaExceededError'); };
    await expect(encolar('t', { n: 1 })).resolves.toBeDefined();
    Storage.prototype.setItem = set;
  });
});

describe('los errores se registran, no se enseñan', () => {
  it('registrarError no lanza y deja rastro', () => {
    expect(() => registrarError('prueba', new Error('algo'))).not.toThrow();
    expect(erroresRecientes()[0]).toMatchObject({ origen: 'prueba', detalle: 'Error: algo' });
  });

  it('sinRomper devuelve null en vez de propagar', async () => {
    const r = await sinRomper('prueba', Promise.reject(new Error('caída')));
    expect(r).toBeNull();
    expect(erroresRecientes()).toHaveLength(1);
  });

  it('el error también va a la cola, para que alguien pueda verlo después', async () => {
    registrarError('prueba', new Error('x'));
    await Promise.resolve();
    const filas = await pendientes();
    expect(filas.some((f) => f.tabla === 'estudio_errores')).toBe(true);
  });
});

describe('aplicar el cuestionario de entrada', () => {
  const banco = bancoDe('entrada');

  it('al iniciar apunta el cuestionario como empezado (no sólo como terminado)', async () => {
    await iniciar(banco, IDENT, new Date('2026-09-05T10:00:00Z'));
    const filas = await pendientes();
    const aplicado = filas.find((f) => f.tabla === TABLA_APLICADOS)!;
    expect(aplicado.fila).toMatchObject({
      alumno: IDENT.estudioId,
      cuestionario: 'entrada',
      completado: false,
      fin: null,
      ancla: 'cuenta',
    });
    expect(aplicado.fila.dispositivo).toBeDefined();
    expect(aplicado.fila.version_app).toBeDefined();
  });

  it('retomar no vuelve a apuntar el inicio ni reinicia el avance', async () => {
    const primero = await iniciar(banco, IDENT);
    await vaciarCola();
    const segundo = await iniciar(banco, IDENT);
    expect(segundo.inicio).toBe(primero.inicio);
    expect(await cuantasPendientes()).toBe(0);
  });

  it('cada respuesta escribe UNA fila con todo lo que pide el encargo', async () => {
    const avance = await iniciar(banco, IDENT);
    await vaciarCola();
    await responder(banco, IDENT, avance, {
      reactivoId: 'E01', respuesta: 1, tiempoMs: 4321, orden: 1,
    }, new Date('2026-09-05T10:01:00Z'));

    const filas = await pendientes();
    const respuesta = filas.filter((f) => f.tabla === TABLA_RESPUESTAS);
    expect(respuesta).toHaveLength(1);
    expect(respuesta[0].fila).toEqual({
      alumno: IDENT.estudioId,
      ancla: 'cuenta',
      cuestionario: 'entrada',
      version_cuestionario: banco.version,
      reactivo: 'E01',
      respuesta: 1,
      correcta: true,
      tiempo_ms: 4321,
      orden: 1,
      ts_cliente: '2026-09-05T10:01:00.000Z',
    });
  });

  it('un doble clic no escribe dos filas', async () => {
    const avance = await iniciar(banco, IDENT);
    await vaciarCola();
    const a = await responder(banco, IDENT, avance, { reactivoId: 'E01', respuesta: 1, tiempoMs: 100, orden: 1 });
    await responder(banco, IDENT, a, { reactivoId: 'E01', respuesta: 2, tiempoMs: 50, orden: 1 });
    const filas = (await pendientes()).filter((f) => f.tabla === TABLA_RESPUESTAS);
    expect(filas).toHaveLength(1);
  });

  it('al contestar el último reactivo se cierra el cuestionario aplicado', async () => {
    let avance = await iniciar(banco, IDENT);
    for (const [i, r] of banco.reactivos.entries()) {
      avance = await responder(banco, IDENT, avance, {
        reactivoId: r.id, respuesta: 0, tiempoMs: 100, orden: i + 1,
      });
    }
    expect(avance.completado).toBe(true);
    const cierre = (await pendientes())
      .filter((f) => f.tabla === TABLA_APLICADOS)
      .find((f) => f.fila.completado === true);
    expect(cierre).toBeDefined();
    expect(cierre!.fila.fin).not.toBeNull();
  });

  it('lo contestado sobrevive a cerrar la pestaña', async () => {
    const avance = await iniciar(banco, IDENT);
    await responder(banco, IDENT, avance, { reactivoId: 'E01', respuesta: 1, tiempoMs: 100, orden: 1 });
    // «Cerrar la pestaña» = perder todo menos localStorage.
    const recuperado = leerAvance('entrada')!;
    expect(recuperado.respuestas).toHaveLength(1);
    expect(recuperado.respuestas[0].reactivoId).toBe('E01');
  });
});

describe('fusionar el avance local con el del servidor', () => {
  const banco = bancoDe('entrada');
  const base = () => avanceInicial(banco, IDENT.estudioId, '2026-09-05T10:00:00.000Z');

  it('sin local, gana el remoto', () => {
    const remoto = base();
    expect(fusionar(null, remoto)).toBe(remoto);
  });

  it('si el remoto está completado, se respeta: el alumno ya lo contestó en otro equipo', () => {
    const remoto = { ...base(), completado: true };
    const local = base();
    expect(fusionar(local, remoto)!.completado).toBe(true);
  });

  it('junta las respuestas de los dos sin duplicar', () => {
    const local = { ...base(), respuestas: [{ reactivoId: 'E01', respuesta: 1, correcta: true, tiempoMs: 10, orden: 1, ts: 'x' }] };
    const remoto = { ...base(), respuestas: [{ reactivoId: 'E02', respuesta: 0, correcta: false, tiempoMs: 20, orden: 2, ts: 'y' }] };
    const r = fusionar(local, remoto)!;
    expect(r.respuestas.map((x) => x.reactivoId)).toEqual(['E01', 'E02']);
  });
});

describe('almacén de avance', () => {
  it('un avance corrupto se ignora en vez de reventar la pantalla', () => {
    localStorage.setItem('tecnia_estudio_avance_entrada', '{no es json');
    expect(leerAvance('entrada')).toBeNull();
    expect(erroresRecientes().some((e) => e.origen === 'avance.leer')).toBe(true);
  });

  it('borrarAvance deja el cuestionario como no aplicado', () => {
    guardarAvance('entrada', avanceInicial(bancoDe('entrada'), IDENT.estudioId, 'x'));
    borrarAvance('entrada');
    expect(leerAvance('entrada')).toBeNull();
  });
});

describe('dispositivo e IP', () => {
  it('clasifica el equipo sin guardar el user-agent completo', () => {
    expect(tipoDeDispositivo('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('escritorio');
    expect(tipoDeDispositivo('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile')).toBe('movil');
    expect(tipoDeDispositivo('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)')).toBe('tablet');
    expect(tipoDeDispositivo('Mozilla/5.0 (Linux; Android 13; SM-X200)')).toBe('tablet');
    expect(tipoDeDispositivo('')).toBe('desconocido');
  });

  it('trunca la IPv4 poniendo a cero el último octeto', () => {
    expect(truncarIp('187.190.44.231')).toBe('187.190.44.0');
    expect(truncarIp('10.0.0.1')).toBe('10.0.0.0');
  });

  it('trunca la IPv6 a los cuatro primeros grupos', () => {
    expect(truncarIp('2806:2f0:5000:abcd:1234:5678:9abc:def0')).toBe('2806:2f0:5000:abcd::');
  });

  it('una IP ausente o inválida no inventa un valor', () => {
    expect(truncarIp(null)).toBeNull();
    expect(truncarIp('999.1.1.1')).toBeNull();
    expect(truncarIp('cualquier cosa')).toBeNull();
  });
});
