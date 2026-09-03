/**
 * Cumplimiento registro Office ↔ temario (doc §33.2 y §36).
 *
 * Los ejercicios exclusivos de sala tienen su propio registro porque no
 * pertenecen a ningún nivel, así que necesitan su propia prueba de integridad:
 * la del registro general no los ve, y sin ésta una clase podría anunciarse
 * como jugable en la vitrina y llevar a una pantalla de «no disponible».
 */

import {
  REGISTRO_OFFICE,
  getOfficeRegistrada,
  idsOfficeRegistrados,
} from '@/components/activities/office/registroOffice';
import { CARGADORES_OFFICE, cargarOffice } from '@/components/activities/office/cargadoresOffice';
import { EJERCICIOS_OFFICE, OFFICE_CURRICULO } from '@/data/curriculo';
import { REGISTRO_ACTIVIDADES } from '@/components/activities/registry';

describe('registro de Office ↔ EJERCICIOS_OFFICE', () => {
  it('cada entrada usa su id como clave', () => {
    for (const [clave, entrada] of Object.entries(REGISTRO_OFFICE)) {
      expect(entrada.meta.id).toBe(clave);
    }
  });

  it('todo ejercicio exclusivo «disponible» está en el registro', () => {
    const disponibles = EJERCICIOS_OFFICE.filter((e) => e.estado === 'disponible');
    expect(disponibles.length).toBeGreaterThan(0);
    for (const ejercicio of disponibles) {
      expect(getOfficeRegistrada(ejercicio.id)).toBeDefined();
    }
  });

  it('toda entrada del registro está declarada como disponible en el temario', () => {
    for (const id of idsOfficeRegistrados()) {
      const enTemario = EJERCICIOS_OFFICE.find((e) => e.id === id);
      expect(enTemario).toBeDefined();
      expect(enTemario!.estado).toBe('disponible');
    }
  });

  it('los metadatos coinciden con el temario (programa, grado, título)', () => {
    for (const id of idsOfficeRegistrados()) {
      const { meta } = REGISTRO_OFFICE[id];
      const enTemario = EJERCICIOS_OFFICE.find((e) => e.id === id)!;
      expect(meta.app).toBe(enTemario.app);
      expect(meta.grado).toBe(enTemario.grado);
      expect(meta.titulo).toBe(enTemario.titulo);
      expect(meta.duracionMin).toBeGreaterThan(0);
      expect(meta.descripcion.length).toBeGreaterThan(0);
      expect(OFFICE_CURRICULO.some((a) => a.id === meta.app)).toBe(true);
    }
  });

  it('ningún id vive en los dos registros a la vez', () => {
    // Dos registros con el mismo id serían dos URL para una sola clase y dos
    // progresos que se pisan.
    for (const id of idsOfficeRegistrados()) {
      expect(REGISTRO_ACTIVIDADES[id]).toBeUndefined();
    }
  });

  it('todos los ids exclusivos llevan el prefijo `of-`', () => {
    for (const id of idsOfficeRegistrados()) expect(id.startsWith('of-')).toBe(true);
  });

  it('cada clase registrada tiene su cargador, y ninguno sobra', () => {
    expect(Object.keys(CARGADORES_OFFICE).sort()).toEqual(idsOfficeRegistrados().sort());
  });

  it('el cargador resuelve un componente React para cada clase registrada', async () => {
    for (const id of idsOfficeRegistrados()) {
      const componente = await cargarOffice(id);
      expect(typeof componente).toBe('function');
    }
  });
});
