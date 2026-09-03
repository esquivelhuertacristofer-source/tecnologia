/**
 * Contrato de `Tecnia Textos`, el procesador ultra-LITE del bloque Office
 * (doc §34). Las once clases de Word de §33.6 se van a construir encima de este
 * aparato leyendo `CINTA_*` para saber qué grupo iluminar y qué control esperar,
 * así que estas invariantes no son cosmética: si un id de control se duplica o
 * un grupo pierde su rótulo, la clase deja de poder corregir.
 */

import {
  CINTA_AVANZADO,
  CINTA_BASICO,
  CINTA_INTERMEDIO,
  ZOOMS,
  type Pestana,
} from '@/components/activities/office/tecniaTextos';

const CINTAS: [string, Pestana[]][] = [
  ['básico', CINTA_BASICO],
  ['intermedio', CINTA_INTERMEDIO],
  ['avanzado', CINTA_AVANZADO],
];

describe('Tecnia Textos — la cinta de opciones (doc §34.2)', () => {
  it('la cinta CRECE con el grado y cada grado contiene entero al anterior', () => {
    // §34.2 (A): ver aparecer una pestaña nueva al subir de grado es la
    // progresión del curso hecha visible. Si un grado dejara de contener al
    // anterior, un alumno perdería una herramienta al avanzar.
    expect(CINTA_BASICO).toHaveLength(2);
    expect(CINTA_INTERMEDIO).toHaveLength(5);
    expect(CINTA_AVANZADO).toHaveLength(7);

    const ids = (c: Pestana[]) => c.map((p) => p.id);
    expect(ids(CINTA_INTERMEDIO).slice(0, 2)).toEqual(ids(CINTA_BASICO));
    expect(ids(CINTA_AVANZADO).slice(0, 5)).toEqual(ids(CINTA_INTERMEDIO));
  });

  it.each(CINTAS)('en la cinta de %s no se repite ninguna pestaña', (_grado, cinta) => {
    const ids = cinta.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(CINTAS)('en la cinta de %s todo grupo tiene rótulo y al menos un control', (_grado, cinta) => {
    // §34.2 (B): sin el rótulo del grupo, `of-word-la-cinta` no se puede dar.
    for (const pestana of cinta) {
      expect(pestana.grupos.length).toBeGreaterThan(0);
      for (const grupo of pestana.grupos) {
        expect(grupo.nombre.trim()).not.toBe('');
        expect(grupo.controles.length).toBeGreaterThan(0);
      }
    }
  });

  it.each(CINTAS)('en la cinta de %s no se repite ningún id de grupo', (_grado, cinta) => {
    const ids = cinta.flatMap((p) => p.grupos.map((g) => g.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(CINTAS)('en la cinta de %s no se repite ningún id de control', (_grado, cinta) => {
    // El id viaja a la clase en `onControl(grupo, control)` y se pinta como
    // `es-<id>` en el CSS. Un duplicado haría que dos botones distintos se
    // vieran igual y que la clase no supiera cuál se tocó.
    const ids = cinta.flatMap((p) => p.grupos.flatMap((g) => g.controles.map((c) => c.id)));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(CINTAS)('en la cinta de %s todo control tiene etiqueta y glifo', (_grado, cinta) => {
    // La etiqueta es el `aria-label` y el `title`: es lo único que distingue a
    // los cuatro botones de alineación, que comparten glifo a propósito.
    for (const pestana of cinta) {
      for (const grupo of pestana.grupos) {
        for (const control of grupo.controles) {
          expect(control.etiqueta.trim()).not.toBe('');
          expect(control.glifo.trim()).not.toBe('');
        }
      }
    }
  });

  it('el grado básico trae los cuatro grupos de Inicio en el orden de Word', () => {
    const inicio = CINTA_BASICO.find((p) => p.id === 'inicio');
    expect(inicio?.grupos.map((g) => g.id)).toEqual(['portapapeles', 'fuente', 'parrafo', 'estilos']);
  });

  it('las cuatro alineaciones viven juntas en el grupo Párrafo', () => {
    const parrafo = CINTA_BASICO.find((p) => p.id === 'inicio')?.grupos.find((g) => g.id === 'parrafo');
    const ids = parrafo?.controles.map((c) => c.id) ?? [];
    for (const alineacion of ['izquierda', 'centro', 'derecha', 'justificado']) {
      expect(ids).toContain(alineacion);
    }
  });
});

describe('Tecnia Textos — el zoom de la barra de estado (doc §34.2 D)', () => {
  it('incluye el 45 %, que es la prueba de «míralo de lejos», y el 100 %', () => {
    expect(ZOOMS).toContain(45);
    expect(ZOOMS).toContain(100);
  });

  it('va de menor a mayor, que es como se lee un deslizador', () => {
    expect([...ZOOMS]).toEqual([...ZOOMS].sort((a, b) => a - b));
  });
});
