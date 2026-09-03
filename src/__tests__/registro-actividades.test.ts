/**
 * Cumplimiento registro ↔ currículo (F0.4): el registro central y
 * curriculo.ts no pueden desincronizarse. Si se construye una actividad
 * nueva, debe declararse en ambos lados con los mismos datos.
 */

import {
  REGISTRO_ACTIVIDADES,
  getActividadRegistrada,
  idsRegistrados,
} from '@/components/activities/registry';
import { CARGADORES, cargarActividad } from '@/components/activities/cargadores';
import { CURRICULO, getUnidad, todasLasActividades } from '@/data/curriculo';

describe('registro de actividades ↔ currículo', () => {
  it('cada entrada del registro usa su id como clave', () => {
    for (const [clave, entrada] of Object.entries(REGISTRO_ACTIVIDADES)) {
      expect(entrada.meta.id).toBe(clave);
    }
  });

  it('toda actividad "disponible" del currículo está en el registro', () => {
    const disponibles = todasLasActividades().filter(a => a.estado === 'disponible');
    expect(disponibles.length).toBeGreaterThan(0);
    for (const actividad of disponibles) {
      expect(getActividadRegistrada(actividad.id)).toBeDefined();
    }
  });

  it('toda entrada del registro está declarada como disponible en su unidad', () => {
    for (const id of idsRegistrados()) {
      const { meta } = REGISTRO_ACTIVIDADES[id];
      const unidad = getUnidad(meta.unidadId);
      expect(unidad).toBeDefined();
      const enUnidad = unidad!.actividades.find(a => a.id === id);
      expect(enUnidad?.estado).toBe('disponible');
      expect(enUnidad?.titulo).toBe(meta.titulo);
    }
  });

  it('los metadatos coinciden con el currículo (nivel, unidad, eje)', () => {
    for (const id of idsRegistrados()) {
      const { meta } = REGISTRO_ACTIVIDADES[id];
      const nivel = CURRICULO.find(n => n.n === meta.nivel);
      expect(nivel).toBeDefined();
      const unidad = nivel!.unidades.find(u => u.id === meta.unidadId);
      expect(unidad).toBeDefined();
      expect(meta.eje).toBe(unidad!.eje);
      expect(meta.duracionMin).toBeGreaterThan(0);
      expect(meta.descripcion.length).toBeGreaterThan(0);
    }
  });

  /*
   * Los cargadores viven aparte desde el 3-sep-2026 (`cargadores.ts`), para que
   * el código de las actividades no entre en el paquete del servidor. El precio
   * de esa separación es que ahora hay DOS listas que se pueden desincronizar:
   * una actividad con metadatos y sin cargador se quedaría cargando para
   * siempre. Esto lo impide.
   */
  it('cada actividad registrada tiene su cargador, y ninguno sobra', () => {
    expect(Object.keys(CARGADORES).sort()).toEqual(idsRegistrados().sort());
  });

  it('el cargador resuelve un componente React para cada actividad registrada', async () => {
    for (const id of idsRegistrados()) {
      const componente = await cargarActividad(id);
      expect(typeof componente).toBe('function');
    }
  });

  it('un id que no existe no revienta: devuelve null', async () => {
    await expect(cargarActividad('no-existe')).resolves.toBeNull();
  });
});
