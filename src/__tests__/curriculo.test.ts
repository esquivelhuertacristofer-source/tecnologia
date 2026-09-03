/**
 * Integridad del currículo (F0.3): estas invariantes protegen a todo lo que
 * se deriva de curriculo.ts (contadores de niveles.ts, registro de
 * actividades, páginas de nivel). Si el cliente cambia el temario, el test
 * obliga a mantener ids únicos y estructura completa.
 */

import {
  CURRICULO,
  EJERCICIOS_OFFICE,
  EJES_FORMATIVOS,
  OFFICE_CURRICULO,
  getSalaOffice,
  resumenSalaOffice,
  type AppOfficeId,
  getNivelCurricular,
  getUnidad,
  resumenNivel,
  todasLasActividades,
} from '@/data/curriculo';
import { NIVELES } from '@/data/niveles';

describe('curriculo.ts — estructura', () => {
  it('tiene exactamente 10 niveles, numerados 1..10 en orden', () => {
    expect(CURRICULO).toHaveLength(10);
    expect(CURRICULO.map(n => n.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('todos los niveles tienen unidades y todas las unidades tienen temas', () => {
    for (const nivel of CURRICULO) {
      expect(nivel.unidades.length).toBeGreaterThan(0);
      for (const unidad of nivel.unidades) {
        expect(unidad.temas.length).toBeGreaterThan(0);
      }
    }
  });

  it('los ids de unidad son únicos y llevan el prefijo de su nivel', () => {
    const ids = CURRICULO.flatMap(n => n.unidades.map(u => u.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const nivel of CURRICULO) {
      for (const unidad of nivel.unidades) {
        expect(unidad.id.startsWith(`n${nivel.n}-`)).toBe(true);
      }
    }
  });

  it('los ids de actividad son únicos en todo el currículo', () => {
    const ids = todasLasActividades().map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('cada unidad usa un eje formativo declarado', () => {
    const ejes = new Set(EJES_FORMATIVOS.map(e => e.id));
    for (const nivel of CURRICULO) {
      for (const unidad of nivel.unidades) {
        expect(ejes.has(unidad.eje)).toBe(true);
      }
    }
  });

  it('las etapas cubren 1–6 primaria, 7–9 secundaria y 10 bachillerato', () => {
    for (const nivel of CURRICULO) {
      const esperada = nivel.n <= 6 ? 'primaria' : nivel.n <= 9 ? 'secundaria' : 'bachillerato';
      expect(nivel.etapa).toBe(esperada);
    }
  });

  it('los niveles 6, 9 y 10 cierran etapa con proyecto integrador', () => {
    for (const n of [6, 9, 10]) {
      expect(resumenNivel(n).tieneIntegradora).toBe(true);
    }
    for (const n of [1, 2, 3, 4, 5, 7, 8]) {
      expect(resumenNivel(n).tieneIntegradora).toBe(false);
    }
  });

  it('la IA aparece desde el nivel 3 (eje datos-ia), no antes', () => {
    expect(resumenNivel(1).tieneIA).toBe(false);
    expect(resumenNivel(2).tieneIA).toBe(false);
    for (let n = 3; n <= 10; n++) {
      expect(resumenNivel(n).tieneIA).toBe(true);
    }
  });
});

describe('curriculo.ts — bloque Office', () => {
  it('incluye Word, Excel, PowerPoint y el complemento M365', () => {
    expect(OFFICE_CURRICULO.map(a => a.id)).toEqual(['word', 'excel', 'powerpoint', 'm365']);
  });

  it('Word, Excel y PowerPoint tienen los tres grados de dominio con temas', () => {
    for (const app of OFFICE_CURRICULO.filter(a => a.id !== 'm365')) {
      expect(app.grados.map(g => g.dominio)).toEqual(['basico', 'intermedio', 'avanzado']);
      for (const grado of app.grados) {
        expect(grado.temas.length).toBeGreaterThan(0);
        expect(grado.nivelesSugeridos.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('curriculo.ts — consultas', () => {
  it('getNivelCurricular y getUnidad resuelven y fallan de forma segura', () => {
    expect(getNivelCurricular(1)?.titulo).toBe('Descubro la tecnología');
    expect(getNivelCurricular(99)).toBeUndefined();
    expect(getUnidad('n1-mi-primera-computadora')?.eje).toBe('sistemas');
    expect(getUnidad('no-existe')).toBeUndefined();
  });

  it('la actividad firma de N1 está declarada y disponible', () => {
    const unidad = getUnidad('n1-mi-primera-computadora');
    const firma = unidad?.actividades.find(a => a.id === 'n1-conoce-las-partes');
    expect(firma).toEqual(
      { id: 'n1-conoce-las-partes', titulo: 'Conoce las partes', estado: 'disponible', icono: '🖥️' },
    );
    expect(resumenNivel(1).actividadesDisponibles).toBe(20);
  });

  it('cada nivel declara su plan completo de ejercicios (≈ uno por sesión)', () => {
    for (const nivel of CURRICULO) {
      const ejercicios = nivel.unidades.flatMap(u => u.actividades);
      const sesiones = nivel.unidades.reduce((s, u) => s + u.temas.length, 0);
      // Toda unidad trae su plan de ejercicios y en conjunto cubren las sesiones.
      for (const unidad of nivel.unidades) {
        expect(unidad.actividades.length).toBeGreaterThan(0);
      }
      expect(ejercicios.length).toBeGreaterThanOrEqual(sesiones);
      for (const ejercicio of ejercicios) {
        expect(ejercicio.id.startsWith(`n${nivel.n}-`)).toBe(true);
      }
    }
  });
});

describe('niveles.ts — contadores derivados del currículo', () => {
  it('cada Nivel refleja unidades/temas/IA del currículo (sin números inventados)', () => {
    for (const nivel of NIVELES) {
      const resumen = resumenNivel(nivel.n);
      expect(nivel.unidades).toBe(resumen.unidades);
      expect(nivel.actividades).toBe(resumen.temas);
      expect(nivel.conIA).toBe(resumen.tieneIA);
    }
  });
});

describe('bloque Office transversal (doc §33) — la sala se deriva, no se guarda', () => {
  const APPS: AppOfficeId[] = ['word', 'excel', 'powerpoint', 'm365'];

  it('los ejercicios exclusivos llevan prefijo of-, ids únicos, y NO viven en ningún nivel', () => {
    const idsDeNivel = new Set(todasLasActividades().map(a => a.id));
    const vistos = new Set<string>();
    for (const ejercicio of EJERCICIOS_OFFICE) {
      expect(ejercicio.id.startsWith('of-')).toBe(true);
      // Un ejercicio exclusivo que también estuviera en un nivel sería contenido
      // duplicado, que es justo lo que la sección evita.
      expect(idsDeNivel.has(ejercicio.id)).toBe(false);
      expect(vistos.has(ejercicio.id)).toBe(false);
      vistos.add(ejercicio.id);
      expect(ejercicio.aprendizaje.length).toBeGreaterThan(40);
    }
  });

  it('toda actividad marcada con office apunta a un programa y un grado que existen', () => {
    for (const actividad of todasLasActividades()) {
      if (!actividad.office) continue;
      const ficha = OFFICE_CURRICULO.find(a => a.id === actividad.office!.app);
      expect(ficha).toBeDefined();
      expect(ficha!.grados.some(g => g.dominio === actividad.office!.grado)).toBe(true);
    }
  });

  it('cada sala reúne sus clases prestadas y sus exclusivas sin perder ni duplicar ninguna', () => {
    const enSalas = new Set<string>();
    let prestadasTotales = 0;
    for (const app of APPS) {
      const sala = getSalaOffice(app);
      expect(sala).toBeDefined();
      for (const grado of sala!) {
        for (const clase of grado.clases) {
          // Ninguna clase puede salir en dos salas ni dos veces en la misma.
          expect(enSalas.has(clase.id)).toBe(false);
          enSalas.add(clase.id);
          // Prestada => trae su chapa de origen; exclusiva => trae su aprendizaje.
          if (clase.origen) {
            prestadasTotales += 1;
            expect(clase.origen.nivel).toBeGreaterThanOrEqual(1);
            expect(getUnidad(clase.origen.unidadId)).toBeDefined();
          } else {
            expect(clase.id.startsWith('of-')).toBe(true);
            expect(clase.aprendizaje).toBeTruthy();
          }
        }
      }
    }
    const marcadas = todasLasActividades().filter(a => a.office).length;
    expect(prestadasTotales).toBe(marcadas);
    expect(enSalas.size).toBe(marcadas + EJERCICIOS_OFFICE.length);
  });

  it('ningún grado de ninguna sala queda vacío — era el defecto que motivó §33', () => {
    for (const app of APPS) {
      for (const grado of getSalaOffice(app)!) {
        expect(grado.clases.length).toBeGreaterThan(0);
      }
    }
  });

  /*
   * ── EL REPARTO, QUE ES LO QUE NADIE MIRABA (§45.3) ────────────────────────
   *
   * Dos defectos reales, la misma semana y en dos salas distintas:
   *
   *   · PowerPoint Avanzado tenía CINCO temas y CUATRO clases, así que «Macros»
   *     se quedó sin dueño. Eso lo caza un conteo, y por eso va el primero.
   *   · Excel Avanzado tenía CUATRO temas y CUATRO clases —el conteo cuadraba—
   *     y aun así «Consolidación y protección» no tenía clase, porque «Tablas y
   *     gráficos dinámicos» se había llevado dos. Eso NO lo caza un conteo.
   *
   * Por eso hay dos pruebas y no una: la primera vale para todas las salas
   * desde hoy, y la segunda entra en vigor por sala **en cuanto una de sus
   * clases declara su tema**. Media sala medida sería peor que ninguna: dejaría
   * el hueco justo donde nadie vuelve a mirar.
   */
  it('ninguna sala promete más temas que clases tiene — el huérfano de §40.2', () => {
    for (const app of OFFICE_CURRICULO) {
      const sala = getSalaOffice(app.id)!;
      for (const tramo of app.grados) {
        const clases = sala.find(g => g.dominio === tramo.dominio)?.clases ?? [];
        expect({
          app: app.id, grado: tramo.dominio, temas: tramo.temas.length, clases: clases.length,
        }).toEqual({
          app: app.id, grado: tramo.dominio, temas: tramo.temas.length,
          clases: expect.any(Number),
        });
        expect(clases.length).toBeGreaterThanOrEqual(tramo.temas.length);
      }
    }
  });

  it('la sala que declara temas los cubre TODOS, y ninguna clase suya se queda sin uno', () => {
    for (const app of OFFICE_CURRICULO) {
      const clases = getSalaOffice(app.id)!.flatMap(g => g.clases);
      const declarados = clases.map(c => c.tema).filter(Boolean) as string[];
      // Una sala sin ninguna declaración todavía no se mide; en cuanto declara
      // una, se mide entera.
      if (declarados.length === 0) continue;

      // 1 · ninguna clase de esa sala puede quedarse sin tema
      expect(clases.filter(c => !c.tema).map(c => c.id)).toEqual([]);
      // 2 · todo tema que la clase nombre tiene que existir en el currículo
      const delCurriculo = new Set(app.grados.flatMap(g => g.temas));
      expect(declarados.filter(t => !delCurriculo.has(t))).toEqual([]);
      // 3 · y todo tema del currículo tiene que tener al menos una clase
      const cubiertos = new Set(declarados);
      expect([...delCurriculo].filter(t => !cubiertos.has(t))).toEqual([]);
    }
  });

  it('el resumen de cada sala cuenta lo mismo que la sala', () => {
    for (const app of APPS) {
      const clases = getSalaOffice(app)!.flatMap(g => g.clases);
      const resumen = resumenSalaOffice(app);
      expect(resumen.total).toBe(clases.length);
      expect(resumen.disponibles).toBe(clases.filter(c => c.estado === 'disponible').length);
    }
  });
});
