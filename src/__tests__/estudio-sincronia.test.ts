/**
 * Estudio de impacto — vaciar la cola contra el servidor.
 *
 * LA PRUEBA QUE DA NOMBRE A ESTE ARCHIVO es la de «una fila mala no se lleva
 * por delante el lote». Un lote va en UNA petición: si la base rechaza una
 * fila, falla la petición entera y las otras 99 se quedan sin escribir. Con el
 * `UNIQUE (alumno, cuestionario, reactivo)` de `estudio_respuestas` eso deja de
 * ser hipotético: un alumno al que se le borró el `localStorage` a media faena
 * vuelve a contestar un reactivo ya guardado y genera exactamente esa fila.
 *
 * Sin el reintento fila a fila, esa única fila destruiría 99 buenas en cada
 * pasada hasta agotar los veinte intentos. En producción habría sido una
 * pérdida de datos silenciosa.
 */

const upsert = jest.fn();

jest.mock('@/lib/supabase-browser', () => ({
  supabase: { from: () => ({ upsert }) },
}));

import { encolar, cuantasPendientes, pendientes, vaciarCola } from '@/lib/estudio/cola';
import type { FilaEnCola } from '@/lib/estudio/cola';
import { sincronizar } from '@/lib/estudio/sincroniza';
import { erroresRecientes, limpiarErroresRecientes } from '@/lib/estudio/errores';

/**
 * Lo que queda por mandar SIN CONTAR las filas de `estudio_errores`.
 * `registrarError` encola su propia fila, así que una cola «vacía» después de
 * un fallo tiene justamente esa: no es un dato perdido, es el registro del
 * fallo camino del servidor.
 */
async function pendientesDeDatos(): Promise<FilaEnCola[]> {
  return (await pendientes()).filter((f) => f.tabla !== 'estudio_errores');
}

const OK = { error: null };
const DUPLICADO = { error: { code: '23505', message: 'duplicate key value' } };
const CAIDO = { error: { code: '503', message: 'service unavailable' } };

beforeEach(async () => {
  localStorage.clear();
  limpiarErroresRecientes();
  await vaciarCola();
  upsert.mockReset();
});

describe('el camino feliz', () => {
  it('manda lo pendiente y lo saca de la cola', async () => {
    upsert.mockResolvedValue(OK);
    await encolar('estudio_respuestas', { reactivo: 'E01' });
    await encolar('estudio_respuestas', { reactivo: 'E02' });

    const r = await sincronizar();
    expect(r.enviadas).toBe(2);
    expect(await cuantasPendientes()).toBe(0);
  });

  it('agrupa por tabla: una petición por tabla, no una por fila', async () => {
    upsert.mockResolvedValue(OK);
    await encolar('estudio_respuestas', { n: 1 });
    await encolar('estudio_respuestas', { n: 2 });
    await encolar('eventos_aprendizaje', { n: 3 });

    await sincronizar();
    expect(upsert).toHaveBeenCalledTimes(2);
  });

  it('cada fila viaja con su evento_id, que es la llave de idempotencia', async () => {
    upsert.mockResolvedValue(OK);
    const id = await encolar('estudio_respuestas', { reactivo: 'E01' });
    await sincronizar();

    const enviado = upsert.mock.calls[0][0] as { evento_id: string }[];
    expect(enviado[0].evento_id).toBe(id);
    expect(upsert.mock.calls[0][1]).toEqual({ onConflict: 'evento_id', ignoreDuplicates: true });
  });
});

describe('una fila mala no se lleva por delante el lote', () => {
  it('reintenta fila a fila y salva las buenas', async () => {
    await encolar('estudio_respuestas', { reactivo: 'E01' });
    await encolar('estudio_respuestas', { reactivo: 'E02' });
    await encolar('estudio_respuestas', { reactivo: 'E03' });

    // Primer intento: el lote entero falla por culpa de una fila.
    // Después, fila a fila: la segunda es la que choca.
    upsert
      .mockResolvedValueOnce(DUPLICADO)   // el lote
      .mockResolvedValueOnce(OK)          // E01 sola
      .mockResolvedValueOnce(DUPLICADO)   // E02 sola
      .mockResolvedValueOnce(OK);         // E03 sola

    const r = await sincronizar();

    // Las tres salen de la cola: dos escritas y una que ya estaba en la base.
    expect(r.enviadas).toBe(3);
    expect(r.fallidas).toBe(0);
    expect(await pendientesDeDatos()).toHaveLength(0);
  });

  it('un duplicado se da por bueno: el dato YA está en la base', async () => {
    await encolar('estudio_respuestas', { reactivo: 'E01' });
    upsert.mockResolvedValue(DUPLICADO);

    await sincronizar();
    // No se reintenta veinte veces algo que nunca va a cambiar.
    expect(await pendientesDeDatos()).toHaveLength(0);
    // Y un duplicado NO ensucia la tabla de errores: es una condición normal.
    expect(erroresRecientes()).toHaveLength(0);
  });
});

describe('cuando el servidor está caído', () => {
  it('las filas se quedan en la cola para el siguiente intento', async () => {
    await encolar('estudio_respuestas', { reactivo: 'E01' });
    upsert.mockResolvedValue(CAIDO);

    const r = await sincronizar();
    expect(r.enviadas).toBe(0);
    expect(r.fallidas).toBe(1);
    const quedan = await pendientesDeDatos();
    expect(quedan).toHaveLength(1);
    expect(quedan[0].intentos).toBe(1);
  });

  it('el fallo se apunta en la tabla de errores, no en la pantalla', async () => {
    await encolar('estudio_respuestas', { reactivo: 'E01' });
    upsert.mockResolvedValue(CAIDO);
    await sincronizar();
    expect(erroresRecientes().some((e) => e.origen === 'sincroniza.lote')).toBe(true);
  });

  it('un fallo al mandar ERRORES no genera más errores: sería un bucle', async () => {
    limpiarErroresRecientes();
    await vaciarCola();
    await encolar('estudio_errores', { origen: 'x', detalle: 'y' });
    upsert.mockResolvedValue(CAIDO);

    await sincronizar();
    expect(erroresRecientes().filter((e) => e.origen === 'sincroniza.lote')).toHaveLength(0);
  });

  it('sincronizar nunca lanza, aunque el cliente reviente', async () => {
    await encolar('estudio_respuestas', { reactivo: 'E01' });
    upsert.mockRejectedValue(new Error('red caída'));
    await expect(sincronizar()).resolves.toBeDefined();
  });
});

describe('sin conexión', () => {
  it('no se intenta mandar nada', async () => {
    const original = Object.getOwnPropertyDescriptor(navigator, 'onLine');
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    try {
      await encolar('estudio_respuestas', { reactivo: 'E01' });
      const r = await sincronizar();
      expect(r.enviadas).toBe(0);
      expect(upsert).not.toHaveBeenCalled();
      expect(await cuantasPendientes()).toBe(1); // no se pierde nada

    } finally {
      if (original) Object.defineProperty(navigator, 'onLine', original);
    }
  });
});
