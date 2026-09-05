/**
 * Estudio de impacto — participación de la escuela (§12) y telemetría (§5).
 *
 * La regla que más se prueba aquí es la que más silenciosamente se puede
 * romper: **apagada por omisión**. Una escuela que no participa no puede ver
 * un cuestionario ni por accidente, y la única forma de comprobar eso es
 * intentarlo desde todos los estados posibles.
 */

import {
  NO_PARTICIPA,
  estadoDesdeEscuela,
  guardarCache,
  leerCache,
  participacionInmediata,
  ventanaAbierta,
} from '@/lib/estudio/participacion';
import { pendientes, vaciarCola } from '@/lib/estudio/cola';
import {
  registrarDificultad,
  registrarEvento,
  registrarItem,
  TABLA_EVENTOS,
} from '@/lib/estudio/telemetria';
import { registrarAccionDocente, TABLA_BITACORA } from '@/lib/estudio/bitacora';
import { limpiarErroresRecientes } from '@/lib/estudio/errores';
import type { IdentidadEstudio } from '@/lib/estudio/identidad';

const IDENT: IdentidadEstudio = { estudioId: '44444444-4444-4444-8444-444444444444', ancla: 'cuenta' };

beforeEach(async () => {
  localStorage.clear();
  limpiarErroresRecientes();
  await vaciarCola();
});

describe('apagada por omisión', () => {
  it('sin nada configurado, no participa', () => {
    expect(participacionInmediata()).toEqual(NO_PARTICIPA);
    expect(participacionInmediata().participa).toBe(false);
  });

  it('una escuela registrada pero sin encender tampoco participa', () => {
    const estado = estadoDesdeEscuela(
      { id: 'sec-14', participa: false, salida_desde: null, salida_hasta: null },
      '2026-09-05',
    );
    expect(estado.participa).toBe(false);
    expect(estado.salidaAbierta).toBe(false);
  });

  it('una escuela encendida participa, y su salida sigue cerrada sin fechas', () => {
    const estado = estadoDesdeEscuela(
      { id: 'sec-14', participa: true, salida_desde: null, salida_hasta: null },
      '2026-09-05',
    );
    expect(estado.participa).toBe(true);
    expect(estado.salidaAbierta).toBe(false);
  });
});

describe('la ventana del cuestionario de salida', () => {
  const escuela = { salida_desde: '2026-06-10', salida_hasta: '2026-06-20' };

  it('está abierta dentro del rango, incluidos los dos extremos', () => {
    expect(ventanaAbierta(escuela, '2026-06-10')).toBe(true);
    expect(ventanaAbierta(escuela, '2026-06-15')).toBe(true);
    expect(ventanaAbierta(escuela, '2026-06-20')).toBe(true);
  });

  it('está cerrada fuera del rango', () => {
    expect(ventanaAbierta(escuela, '2026-06-09')).toBe(false);
    expect(ventanaAbierta(escuela, '2026-06-21')).toBe(false);
  });

  it('sin fechas, cerrada: una ventana a medio configurar no abre nada', () => {
    expect(ventanaAbierta({ salida_desde: '2026-06-10', salida_hasta: null }, '2026-06-15')).toBe(false);
    expect(ventanaAbierta({ salida_desde: null, salida_hasta: '2026-06-20' }, '2026-06-15')).toBe(false);
    expect(ventanaAbierta({ salida_desde: null, salida_hasta: null }, '2026-06-15')).toBe(false);
  });

  it('una escuela apagada no abre la salida aunque las fechas cuadren', () => {
    const estado = estadoDesdeEscuela(
      { id: 'x', participa: false, salida_desde: '2026-06-10', salida_hasta: '2026-06-20' },
      '2026-06-15',
    );
    expect(estado.salidaAbierta).toBe(false);
  });
});

describe('la caché de participación', () => {
  it('recuerda entre visitas, para que el cuestionario salga sin esperar a la red', () => {
    guardarCache({ participa: true, escuelaId: 'sec-14', salidaAbierta: false, origen: 'servidor' });
    const c = leerCache()!;
    expect(c.participa).toBe(true);
    expect(c.escuelaId).toBe('sec-14');
    expect(c.origen).toBe('cache');
  });

  it('una caché corrupta se ignora y se vuelve al valor seguro', () => {
    localStorage.setItem('tecnia_estudio_participacion', 'no soy json');
    expect(leerCache()).toBeNull();
    expect(participacionInmediata().participa).toBe(false);
  });
});

describe('telemetría: el formato estándar', () => {
  it('un evento lleva exactamente los campos del estándar', async () => {
    registrarEvento(IDENT, { actividadId: 'n1-arma-tu-computadora', tipo: 'inicio' });
    await Promise.resolve();

    const fila = (await pendientes()).find((f) => f.tabla === TABLA_EVENTOS)!;
    expect(Object.keys(fila.fila).sort()).toEqual([
      'actividad_id', 'alumno', 'ancla', 'intentos', 'item_id',
      'resultado', 'tiempo_ms', 'tipo', 'ts_cliente', 'version_app',
    ]);
    expect(fila.fila.alumno).toBe(IDENT.estudioId);
    expect(fila.fila.actividad_id).toBe('n1-arma-tu-computadora');
  });

  it('el evento_id es un UUID generado en el cliente (idempotencia)', async () => {
    registrarEvento(IDENT, { actividadId: 'a', tipo: 'inicio' });
    await Promise.resolve();
    const fila = (await pendientes())[0];
    expect(fila.eventoId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('resultado usa -1 / 0 / 1 y nada más', async () => {
    registrarItem(IDENT, 'a', { itemId: 'i1', acierto: true });
    registrarItem(IDENT, 'a', { itemId: 'i2', acierto: false });
    registrarItem(IDENT, 'a', { itemId: 'i3', acierto: null });
    await Promise.resolve();

    const rs = (await pendientes()).map((f) => f.fila.resultado);
    expect(rs).toEqual([1, 0, -1]);
  });

  it('un tiempo negativo se acota a cero', async () => {
    registrarEvento(IDENT, { actividadId: 'a', tipo: 'fin', tiempoMs: -500 });
    await Promise.resolve();
    expect((await pendientes())[0].fila.tiempo_ms).toBe(0);
  });

  it('sin tiempo, va null y no un cero que parecería instantáneo', async () => {
    registrarEvento(IDENT, { actividadId: 'a', tipo: 'inicio' });
    await Promise.resolve();
    expect((await pendientes())[0].fila.tiempo_ms).toBeNull();
  });
});

describe('auto-reporte de dificultad (§9)', () => {
  it('guarda la etiqueta en texto y su equivalencia numérica', async () => {
    registrarDificultad(IDENT, 'n2-guarda-tu-dibujo', 'dificil');
    await Promise.resolve();
    const fila = (await pendientes())[0].fila;
    expect(fila.tipo).toBe('dificultad_percibida');
    expect(fila.item_id).toBe('dificil');   // legible sin tabla de equivalencias
    expect(fila.resultado).toBe(-1);        // y en el formato estándar
  });

  it('fácil, normal y difícil son 1, 0 y -1', async () => {
    registrarDificultad(IDENT, 'a', 'facil');
    registrarDificultad(IDENT, 'b', 'normal');
    registrarDificultad(IDENT, 'c', 'dificil');
    await Promise.resolve();
    expect((await pendientes()).map((f) => f.fila.resultado)).toEqual([1, 0, -1]);
  });
});

describe('bitácora docente (§10)', () => {
  it('apunta la acción sin guardar nombre ni correo', async () => {
    registrarAccionDocente('vista_panel_grupo', '/hub/docente/alumnos');
    await new Promise((r) => setTimeout(r, 30));

    const fila = (await pendientes()).find((f) => f.tabla === TABLA_BITACORA);
    expect(fila).toBeDefined();
    expect(Object.keys(fila!.fila).sort()).toEqual(['accion', 'detalle', 'docente', 'ts_cliente']);
    expect(String(fila!.fila.docente)).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('recorta el detalle para que no acabe media pantalla en la tabla', async () => {
    registrarAccionDocente('accion_sobre_alumno', 'x'.repeat(500));
    await new Promise((r) => setTimeout(r, 30));
    const fila = (await pendientes()).find((f) => f.tabla === TABLA_BITACORA)!;
    expect(String(fila.fila.detalle)).toHaveLength(200);
  });
});
