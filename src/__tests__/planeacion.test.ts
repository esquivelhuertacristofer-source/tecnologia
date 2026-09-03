/**
 * Planeación didáctica — invariantes (3-sep-2026).
 *
 * La capa de planeación son 20 000 líneas de contenido escritas a mano y, hasta
 * hoy, sin una sola prueba: nada impedía que un plan quedara huérfano (escrito
 * para un id que no existe), duplicado, con la respuesta correcta apuntando
 * fuera de sus opciones, o que una clase nueva del registro se publicara sin
 * plan y el planeador le pintara la tarjeta de «sin planeación».
 *
 * Estas pruebas cubren las tres cosas que el navegador NO puede vigilar solo:
 *   1. cobertura exacta — un plan por actividad, ni de más ni de menos, en los
 *      DOS registros (los diez niveles y el bloque Office);
 *   2. forma completa — ningún campo vacío, ninguna respuesta correcta fuera de
 *      rango, ninguna opción repetida dentro de una pregunta;
 *   3. que `getPlanDeClase` de verdad resuelva las 235, con el encabezado que
 *      le toca a cada familia («Nivel N · grado · unidad» o «Bloque Office ·
 *      app · grado»). Ese punto es el que se rompió durante meses sin que nadie
 *      lo notara: los planes de Office no podían resolverse.
 */

import { PLANES_DE_CLASE } from '@/lib/planeacion/contenido';
import {
  getPlanDeClase,
  getUnidadesConPlaneacion,
  getActividadesDeUnidad,
} from '@/lib/planeacion/queries';
import { REGISTRO_ACTIVIDADES } from '@/components/activities/registry';
import { REGISTRO_OFFICE } from '@/components/activities/office/registroOffice';

const IDS_NIVEL = Object.keys(REGISTRO_ACTIVIDADES);
const IDS_OFFICE = Object.keys(REGISTRO_OFFICE);
const PLANES = Object.entries(PLANES_DE_CLASE);

describe('planeación — cobertura', () => {
  it('hay un plan por cada actividad de los dos registros y ninguno de más', () => {
    const esperados = [...IDS_NIVEL, ...IDS_OFFICE].sort();
    expect(Object.keys(PLANES_DE_CLASE).sort()).toEqual(esperados);
  });

  it('son 235: 197 de nivel y 38 de Office', () => {
    expect(IDS_NIVEL).toHaveLength(197);
    expect(IDS_OFFICE).toHaveLength(38);
    expect(PLANES).toHaveLength(235);
  });

  it('la clave del mapa y el `actividadId` de dentro dicen lo mismo', () => {
    for (const [clave, plan] of PLANES) expect(plan.actividadId).toBe(clave);
  });
});

describe('planeación — forma de cada plan', () => {
  it.each(PLANES)('%s tiene todos sus campos escritos', (clave, plan) => {
    expect(plan.objetivo.trim().length).toBeGreaterThan(60);
    expect(plan.teoriaIntro.trim().length).toBeGreaterThan(60);
    expect(plan.rubrica.trim().length).toBeGreaterThan(40);
    for (const m of plan.materiales) expect(m.trim()).not.toBe('');

    // Fases: la sesión completa que envuelve la actividad digital.
    expect(plan.fases.length).toBeGreaterThanOrEqual(3);
    expect(plan.fases.length).toBeLessThanOrEqual(5);
    for (const fase of plan.fases) {
      expect(fase.titulo.trim()).not.toBe('');
      expect(fase.descripcion.trim().length).toBeGreaterThan(40);
      expect(fase.actividadSugerida.trim()).not.toBe('');
      expect(fase.duracionMin).toBeGreaterThan(0);
    }
    // Una sesión de clase de verdad: ni un plan de 5 minutos ni uno de dos horas.
    const suma = plan.fases.reduce((a, f) => a + f.duracionMin, 0);
    expect(suma).toBeGreaterThanOrEqual(15);
    expect(suma).toBeLessThanOrEqual(60);

    expect(plan.teoriaSecciones.length).toBeGreaterThanOrEqual(2);
    for (const s of plan.teoriaSecciones) {
      expect(s.subtitulo.trim()).not.toBe('');
      expect(s.contenido.trim().length).toBeGreaterThan(80);
    }

    expect(plan.evaluacion.length).toBeGreaterThanOrEqual(2);
    for (const q of plan.evaluacion) {
      expect(q.pregunta.trim()).not.toBe('');
      expect(q.opciones.length).toBeGreaterThanOrEqual(3);
      for (const o of q.opciones) expect(o.trim()).not.toBe('');
      // Una opción repetida convierte la pregunta en una trampa sin respuesta.
      expect(new Set(q.opciones).size).toBe(q.opciones.length);
      // La correcta tiene que existir: `correctaIdx` fuera de rango pinta
      // las cuatro opciones en gris y el profesor se queda sin respuesta.
      expect(q.correctaIdx).toBeGreaterThanOrEqual(0);
      expect(q.correctaIdx).toBeLessThan(q.opciones.length);
    }

    expect(plan.tips.length).toBeGreaterThanOrEqual(3);
    for (const t of plan.tips) expect(t.trim().length).toBeGreaterThan(20);
  });
});

describe('planeación — resolución contra el currículo', () => {
  it('las 235 se resuelven, con el título y los minutos del registro', () => {
    for (const [clave] of PLANES) {
      const resuelto = getPlanDeClase(clave);
      expect(resuelto).not.toBeNull();
      const registrada = clave.startsWith('of-') ? REGISTRO_OFFICE[clave] : REGISTRO_ACTIVIDADES[clave];
      expect(resuelto!.titulo).toBe(registrada.meta.titulo);
      expect(resuelto!.duracionMin).toBe(registrada.meta.duracionMin);
      expect(resuelto!.unidadTitulo.trim()).not.toBe('');
    }
  });

  it('cada familia lleva su encabezado: «Nivel N» o «Bloque Office»', () => {
    for (const [clave] of PLANES) {
      const { encabezado } = getPlanDeClase(clave)!;
      if (clave.startsWith('of-')) {
        // «Bloque Office · Word · grado básico»
        expect(encabezado).toMatch(/^Bloque Office · .+ · grado (básico|intermedio|avanzado)$/);
      } else {
        // «Nivel 7 · 1.º de Secundaria · Programación en texto I (Python)»
        expect(encabezado).toMatch(/^Nivel (10|[1-9]) · .+ · .+$/);
      }
    }
  });

  it('una actividad que no existe no devuelve un plan a medias', () => {
    expect(getPlanDeClase('no-existe')).toBeNull();
    expect(getPlanDeClase('of-no-existe')).toBeNull();
  });
});

describe('planeación — lo que ve el planeador', () => {
  const unidades = getUnidadesConPlaneacion();

  it('lista las 62 unidades de nivel y las 4 salas de Office', () => {
    expect(unidades.filter((u) => u.etiqueta === 'Bloque Office')).toHaveLength(4);
    expect(unidades.filter((u) => u.etiqueta !== 'Bloque Office')).toHaveLength(62);
  });

  it('ninguna unidad tiene clases sin plan, y las cuentas suman 235', () => {
    for (const u of unidades) expect(u.conPlan).toBe(u.total);
    expect(unidades.reduce((a, u) => a + u.total, 0)).toBe(235);
  });

  it('la columna de clases de cada unidad coincide con su contador', () => {
    for (const u of unidades) {
      const actividades = getActividadesDeUnidad(u.id);
      expect(actividades).toHaveLength(u.total);
      for (const a of actividades) {
        expect(a.tienePlan).toBe(true);
        expect(a.duracionMin).toBeGreaterThan(0);
        expect(a.titulo.trim()).not.toBe('');
      }
    }
  });

  it('un id de unidad inventado devuelve una lista vacía, no revienta', () => {
    expect(getActividadesDeUnidad('n99-inexistente')).toEqual([]);
    expect(getActividadesDeUnidad('office:inexistente')).toEqual([]);
  });
});
