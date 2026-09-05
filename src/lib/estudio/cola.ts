/**
 * Estudio de impacto — la cola de envío.
 *
 * TODO lo que el estudio quiere guardar pasa por aquí antes de tocar la red:
 * respuestas de cuestionario, eventos de aprendizaje, consentimientos,
 * bitácora del docente y hasta los errores del propio estudio. Se apunta en
 * una cola local y se manda después, por lotes.
 *
 * POR QUÉ UNA COLA Y NO UN `fetch` DIRECTO. Tres razones, y las tres son del
 * encargo:
 *
 *   1. NUNCA BLOQUEAR AL ALUMNO. Escribir en la cola es local y tarda
 *      milisegundos. Si el servidor está caído, el alumno ni se entera: sigue
 *      jugando y lo suyo se manda cuando vuelva la red.
 *   2. FUNCIONAR SIN CONEXIÓN. Muchas escuelas del estudio tienen internet
 *      intermitente —es literalmente uno de los campos de la ficha de plantel
 *      (§8)—. Sin cola, esas escuelas no aportarían datos, que son justo las
 *      escuelas donde más interesa medir.
 *   3. IDEMPOTENCIA. Cada fila lleva un `evento_id` generado en el cliente, así
 *      que reenviar un lote que ya había llegado no duplica nada.
 *
 * DÓNDE SE GUARDA. IndexedDB si existe; si no —jsdom, modo privado, una
 * política del equipo escolar—, `localStorage`; y si tampoco, memoria. Nunca
 * se lanza una excepción hacia arriba: la peor consecuencia posible de un
 * fallo de medición es perder una medición, jamás una pantalla rota.
 */

import { ALMACEN_COLA, BD_COLA, BD_COLA_VERSION } from './config';
import { nuevoUuid } from './identidad';

/** Una escritura pendiente. `tabla` es el destino en Supabase. */
export interface FilaEnCola {
  /** UUID generado en el cliente. Es la llave de idempotencia. */
  eventoId: string;
  tabla: string;
  fila: Record<string, unknown>;
  /** ISO del momento en que se encoló, según el reloj del cliente. */
  ts: string;
  /** Cuántas veces se ha intentado mandar. Sirve para no reintentar por siempre. */
  intentos: number;
}

const TOPE_COLA = 5000;         // ~unas semanas de uso intenso sin conexión
const CLAVE_RESPALDO = 'tecnia_estudio_cola';

let memoria: FilaEnCola[] = [];

function hayIndexedDb(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

function hayLocalStorage(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage !== null;
  } catch {
    return false;
  }
}

// ─── IndexedDB ───────────────────────────────────────────────────────────────

function abrir(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(BD_COLA, BD_COLA_VERSION);
      req.onupgradeneeded = () => {
        const bd = req.result;
        if (!bd.objectStoreNames.contains(ALMACEN_COLA)) {
          bd.createObjectStore(ALMACEN_COLA, { keyPath: 'eventoId' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      // Una base bloqueada por otra pestaña no puede colgar la promesa para
      // siempre: sin este corte, un `await` de aquí congelaría al que llama.
      setTimeout(() => resolve(null), 2000);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Varias operaciones en UNA sola transacción.
 *
 * `confirmar` borra hasta 100 filas de golpe tras cada sincronía. Hacerlo con
 * `conAlmacen` una por una abría cien conexiones a IndexedDB seguidas, y en el
 * equipo de una escuela eso se nota. Aquí se abre una vez y se hace todo
 * dentro.
 */
function enUnaTransaccion(
  trabajo: (almacen: IDBObjectStore) => IDBRequest[],
): Promise<boolean> {
  return abrir().then(
    (bd) =>
      new Promise<boolean>((resolve) => {
        if (!bd) return resolve(false);
        try {
          const tx = bd.transaction(ALMACEN_COLA, 'readwrite');
          trabajo(tx.objectStore(ALMACEN_COLA));
          tx.oncomplete = () => { bd.close(); resolve(true); };
          tx.onerror = () => { bd.close(); resolve(false); };
          tx.onabort = () => { bd.close(); resolve(false); };
        } catch {
          resolve(false);
        }
      }),
  );
}

function conAlmacen<T>(
  modo: IDBTransactionMode,
  trabajo: (almacen: IDBObjectStore) => IDBRequest,
  porDefecto: T,
): Promise<T> {
  return abrir().then(
    (bd) =>
      new Promise<T>((resolve) => {
        if (!bd) return resolve(porDefecto);
        try {
          const tx = bd.transaction(ALMACEN_COLA, modo);
          const req = trabajo(tx.objectStore(ALMACEN_COLA));
          req.onsuccess = () => resolve((req.result as T) ?? porDefecto);
          req.onerror = () => resolve(porDefecto);
          tx.oncomplete = () => bd.close();
        } catch {
          resolve(porDefecto);
        }
      }),
  );
}

// ─── Respaldo en localStorage ────────────────────────────────────────────────

function leerRespaldo(): FilaEnCola[] {
  if (!hayLocalStorage()) return memoria;
  try {
    const crudo = localStorage.getItem(CLAVE_RESPALDO);
    return crudo ? (JSON.parse(crudo) as FilaEnCola[]) : [];
  } catch {
    return [];
  }
}

function escribirRespaldo(filas: FilaEnCola[]): void {
  if (!hayLocalStorage()) {
    memoria = filas;
    return;
  }
  try {
    localStorage.setItem(CLAVE_RESPALDO, JSON.stringify(filas));
  } catch {
    // Almacenamiento lleno: se conserva lo más reciente en memoria y se sigue.
    memoria = filas;
  }
}

// ─── API ─────────────────────────────────────────────────────────────────────

/**
 * Encola una escritura. Devuelve el `eventoId` con el que viajará, para que
 * quien llama pueda relacionarlo si lo necesita. Nunca lanza.
 */
export async function encolar(
  tabla: string,
  fila: Record<string, unknown>,
  eventoId = nuevoUuid(),
): Promise<string> {
  const item: FilaEnCola = { eventoId, tabla, fila, ts: new Date().toISOString(), intentos: 0 };
  try {
    if (hayIndexedDb()) {
      await conAlmacen('readwrite', (a) => a.put(item), undefined);
      return eventoId;
    }
    const filas = leerRespaldo();
    filas.push(item);
    escribirRespaldo(filas.slice(-TOPE_COLA));
  } catch {
    // Ni IndexedDB ni localStorage: memoria, y si se pierde, se pierde.
    memoria = [...memoria, item].slice(-TOPE_COLA);
  }
  return eventoId;
}

/** Las filas pendientes, hasta `limite`. */
export async function pendientes(limite = 200): Promise<FilaEnCola[]> {
  try {
    if (hayIndexedDb()) {
      const todo = await conAlmacen<FilaEnCola[]>('readonly', (a) => a.getAll(), []);
      return todo.slice(0, limite);
    }
    return leerRespaldo().slice(0, limite);
  } catch {
    return memoria.slice(0, limite);
  }
}

/** Cuántas quedan por mandar. Se enseña en el panel de administración. */
export async function cuantasPendientes(): Promise<number> {
  try {
    if (hayIndexedDb()) {
      return await conAlmacen<number>('readonly', (a) => a.count(), 0);
    }
    return leerRespaldo().length;
  } catch {
    return memoria.length;
  }
}

/** Borra las filas ya confirmadas por el servidor. */
export async function confirmar(eventoIds: string[]): Promise<void> {
  if (eventoIds.length === 0) return;
  const set = new Set(eventoIds);
  try {
    if (hayIndexedDb()) {
      await enUnaTransaccion((a) => eventoIds.map((id) => a.delete(id)));
      return;
    }
    escribirRespaldo(leerRespaldo().filter((f) => !set.has(f.eventoId)));
  } catch {
    memoria = memoria.filter((f) => !set.has(f.eventoId));
  }
}

/**
 * Anota un intento fallido. A partir de `TOPE_INTENTOS` la fila se descarta:
 * una fila que lleva veinte intentos no es un problema de red, es una fila que
 * el servidor rechaza, y guardarla para siempre tapona la cola de las demás.
 * El descarte se apunta en la tabla de errores desde `sincroniza.ts`.
 */
export const TOPE_INTENTOS = 20;

export async function marcarIntento(eventoIds: string[]): Promise<string[]> {
  const descartadas: string[] = [];
  const set = new Set(eventoIds);
  const subir = (f: FilaEnCola): FilaEnCola => ({ ...f, intentos: f.intentos + 1 });

  try {
    if (hayIndexedDb()) {
      const todo = await conAlmacen<FilaEnCola[]>('readonly', (a) => a.getAll(), []);
      const tocadas = todo.filter((f) => set.has(f.eventoId)).map(subir);
      for (const f of tocadas) if (f.intentos >= TOPE_INTENTOS) descartadas.push(f.eventoId);
      await enUnaTransaccion((a) =>
        tocadas.map((f) => (f.intentos >= TOPE_INTENTOS ? a.delete(f.eventoId) : a.put(f))),
      );
      return descartadas;
    }
    const filas = leerRespaldo().map((f) => (set.has(f.eventoId) ? subir(f) : f));
    for (const f of filas) if (f.intentos >= TOPE_INTENTOS) descartadas.push(f.eventoId);
    escribirRespaldo(filas.filter((f) => f.intentos < TOPE_INTENTOS));
  } catch {
    memoria = memoria.map((f) => (set.has(f.eventoId) ? subir(f) : f));
  }
  return descartadas;
}

/** Sólo para las pruebas: deja la cola como recién instalada. */
export async function vaciarCola(): Promise<void> {
  memoria = [];
  try {
    if (hayIndexedDb()) {
      await conAlmacen('readwrite', (a) => a.clear(), undefined);
      return;
    }
    escribirRespaldo([]);
  } catch { /* nada que vaciar */ }
}
