/**
 * Repositorio de progreso (F0.6): la implementación localStorage debe
 * cumplir el contrato ProgresoRepo y las funciones legadas de
 * data/niveles.ts deben leer/escribir exactamente los mismos datos
 * (misma clave, misma semántica).
 */

import { progresoRepo } from '@/lib/progreso';
import { LocalProgresoRepo } from '@/lib/progreso/local';
import type { PerfilAlumno } from '@/lib/progreso/repo';
import {
  PERFIL_DEMO,
  getPerfilDemo,
  savePerfilDemo,
  getXP,
  getProgresoActividad,
} from '@/data/niveles';

const PERFIL_PRUEBA: PerfilAlumno = {
  nombre: 'Alumno Prueba',
  grado: '1° de Primaria',
  grupo: 'Grupo T',
  avatar: '🤖',
  nivelActual: 1,
};

describe('LocalProgresoRepo', () => {
  const repo = new LocalProgresoRepo(PERFIL_PRUEBA);

  beforeEach(() => localStorage.clear());

  it('sin nada guardado regresa el perfil por defecto', async () => {
    await expect(repo.getPerfil()).resolves.toEqual(PERFIL_PRUEBA);
  });

  it('savePerfil fusiona lo parcial con lo guardado', async () => {
    await repo.savePerfil({ nombre: 'Sofía' });
    await repo.savePerfil({ grupo: 'Grupo B' });
    const perfil = await repo.getPerfil();
    expect(perfil.nombre).toBe('Sofía');
    expect(perfil.grupo).toBe('Grupo B');
    expect(perfil.avatar).toBe(PERFIL_PRUEBA.avatar);
  });

  it('clearPerfil borra el perfil guardado pero conserva XP y progreso', async () => {
    await repo.savePerfil({ nombre: 'Sofía' });
    await repo.addXP(30);
    await repo.clearPerfil();
    await expect(repo.getPerfil()).resolves.toEqual(PERFIL_PRUEBA);
    await expect(repo.getXP()).resolves.toBe(30);
  });

  it('con JSON corrupto regresa el perfil por defecto en lugar de tronar', async () => {
    localStorage.setItem('tecnia_perfil', '{no-es-json');
    await expect(repo.getPerfil()).resolves.toEqual(PERFIL_PRUEBA);
  });

  it('XP inicia en 0 y se acumula', async () => {
    await expect(repo.getXP()).resolves.toBe(0);
    await expect(repo.addXP(15)).resolves.toBe(15);
    await expect(repo.addXP(10)).resolves.toBe(25);
    await expect(repo.getXP()).resolves.toBe(25);
  });

  it('saveProgresoActividad conserva el mejor score', async () => {
    const id = 'n1-arma-tu-computadora';
    await repo.saveProgresoActividad(id, { score: 90, stars: 3, completado: true });
    await repo.saveProgresoActividad(id, { score: 70, stars: 1, completado: true });
    await expect(repo.getProgresoActividad(id)).resolves.toEqual({ score: 90, stars: 3, completado: true });

    await repo.saveProgresoActividad(id, { score: 95, stars: 3, completado: true });
    await expect(repo.getProgresoActividad(id)).resolves.toMatchObject({ score: 95 });
  });

  it('el estado de actividad hace roundtrip y se puede limpiar', async () => {
    const id = 'n1-arma-tu-computadora';
    const estado = { fase: 'arma', exploradas: ['monitor'], colocadas: {}, errores: 1, erroresQuiz: 0, quizIdx: 0 };

    await expect(repo.getEstadoActividad(id)).resolves.toBeNull();
    await repo.saveEstadoActividad(id, estado);
    await expect(repo.getEstadoActividad(id)).resolves.toEqual(estado);
    await repo.clearEstadoActividad(id);
    await expect(repo.getEstadoActividad(id)).resolves.toBeNull();
  });

  it('usa la misma clave de estado que la página del nivel 1', async () => {
    await repo.saveEstadoActividad('n1-arma-tu-computadora', { fase: 'explora' });
    expect(localStorage.getItem('tecnia_state_n1-arma-tu-computadora')).not.toBeNull();
  });
});

describe('funciones legadas de data/niveles.ts ↔ repositorio', () => {
  beforeEach(() => localStorage.clear());

  it('savePerfilDemo se lee igual desde el repositorio singleton', async () => {
    savePerfilDemo({ nombre: 'Valentina' });
    const perfil = await progresoRepo.getPerfil();
    expect(perfil.nombre).toBe('Valentina');
    expect(getPerfilDemo().nombre).toBe('Valentina');
    expect(perfil.grado).toBe(PERFIL_DEMO.grado);
  });

  it('addXP del repositorio es visible para getXP legado', async () => {
    await progresoRepo.addXP(20);
    expect(getXP()).toBe(20);
  });

  it('saveProgresoActividad del repositorio es visible para la función legada', async () => {
    await progresoRepo.saveProgresoActividad('n1-arma-tu-computadora', { score: 80, stars: 2, completado: true });
    expect(getProgresoActividad('n1-arma-tu-computadora')).toEqual({ score: 80, stars: 2, completado: true });
  });
});
