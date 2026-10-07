/**
 * `n6-proyecto-integrador` · el juez de afirmaciones (§69.5): la frase la
 * escribe el alumno y la tabla la juzga, con números. Jugando MAL: frases
 * falsas, del país, de otro año, sin tema, con empate y con «no».
 */
import { DIAS, juzgar, propuestasDelPublico, TABLA, TOTAL, CATEGORIAS } from '@/components/activities/n6/proyecto-integrador/juezDeAfirmaciones';
import { DATOS_ESCUELA } from '@/components/activities/n6/proyecto-integrador/mapaSitios';
import { AFIRMACIONES } from '@/components/activities/n6/proyecto-integrador/pruebas';

const v = (t: string) => juzgar(t).veredicto;

describe('el juez de afirmaciones', () => {
  it('la tabla del juez es la misma que ve el alumno en la página de la escuela', () => {
    const NOMBRE: Record<string, string> = { Lunes: 'lunes', Martes: 'martes', Miércoles: 'miercoles', Jueves: 'jueves', Viernes: 'viernes' };
    for (const fila of DATOS_ESCUELA) {
      const numeros = (fila.valor.match(/\d+/g) ?? []).map(Number);
      if (NOMBRE[fila.etiqueta]) {
        expect(numeros).toEqual(CATEGORIAS.map((c) => TABLA[NOMBRE[fila.etiqueta] as (typeof DIAS)[number]][c]));
      } else {
        expect(numeros).toEqual(CATEGORIAS.map((c) => DIAS.reduce((s, d) => s + TABLA[d][c], 0)));
      }
    }
    expect(TOTAL).toBe(105);
  });

  it('las seis frases del panel viejo dan el mismo veredicto que antes, y la misma gráfica', () => {
    for (const a of AFIRMACIONES) {
      const j = juzgar(a.texto);
      expect([a.texto, j.veredicto === 'sostenida']).toEqual([a.texto, a.sostenida]);
      if (a.sostenida) expect([a.texto, j.tipo]).toEqual([a.texto, a.tipoCorrecto]);
      else expect([a.texto, j.veredicto]).toEqual([a.texto, 'fuera-de-alcance']);
    }
  });

  it('entiende frases propias de los cinco tipos, y cada una lleva su gráfica', () => {
    expect(juzgar('El papel es lo que más tiramos')).toMatchObject({ veredicto: 'sostenida', tipo: 'barras' });
    expect(juzgar('Se tira más plástico que comida')).toMatchObject({ veredicto: 'sostenida', tipo: 'barras' });
    expect(juzgar('El jueves se tiró más papel')).toMatchObject({ veredicto: 'sostenida', tipo: 'lineas' });
    expect(juzgar('El martes se juntó más basura que el lunes')).toMatchObject({ veredicto: 'sostenida', tipo: 'lineas' });
    expect(juzgar('Casi la mitad de lo que tiramos es papel')).toMatchObject({ veredicto: 'sostenida', tipo: 'pastel' });
    expect(juzgar('Lo que menos se tira son otros')).toMatchObject({ veredicto: 'sostenida', tipo: 'barras' });
  });

  it('jugar mal: una frase falsa no cierra, y el motivo trae los números', () => {
    const j = juzgar('Se tira más comida que plástico');
    expect(j.veredicto).toBe('falsa');
    expect(j.motivo).toMatch(/comida 18 contra plástico 30/);
    expect(v('El plástico es más de la mitad')).toBe('falsa');
    expect(v('El viernes fue el día de más basura')).toBe('falsa');
  });

  it('jugar mal: lo que no se midió es «fuera de alcance», no «falsa»', () => {
    expect(v('En México se tira más papel')).toBe('fuera-de-alcance');
    expect(v('El año pasado se tiraba más plástico')).toBe('fuera-de-alcance');
    expect(v('Si ponemos otro bote se tirará menos papel')).toBe('fuera-de-alcance');
    expect(v('Siempre se tira más papel')).toBe('fuera-de-alcance');
    expect(juzgar('Hay que tirar menos papel').motivo).toMatch(/propones va al final/);
  });

  it('jugar mal: sin tema o sin decir nada de él, «no entiendo», y dice qué falta', () => {
    expect(juzgar('La basura es mala')).toMatchObject({ veredicto: 'no-entiendo' });
    expect(juzgar('La basura es mala').motivo).toMatch(/nombra una categoría/);
    expect(juzgar('El papel').motivo).toMatch(/no qué dices de eso/);
    expect(juzgar('')).toMatchObject({ veredicto: 'no-entiendo' });
  });

  it('jugar mal: un empate no sostiene «el día de menos», y el juez dice con quién empata', () => {
    const j = juzgar('El lunes fue el día de menos basura');
    expect(j.veredicto).toBe('falsa');
    expect(j.motivo).toMatch(/empata con el miércoles: tienen 18/);
  });

  it('un «no» delante invierte la frase', () => {
    expect(v('Lo que más se tira no es la comida')).toBe('sostenida');
    expect(v('Lo que más se tira no es el papel')).toBe('falsa');
  });

  it('la propuesta del público sigue al tema de la frase, entre dos de temas distintos', () => {
    const delPapel = propuestasDelPublico(juzgar('Lo que más se tira es papel').tema!);
    expect(delPapel.filter((p) => p.bien).map((p) => p.texto)).toEqual(['Poner un contenedor especial para el papel, junto al bote']);
    expect(new Set(delPapel.map((p) => p.texto)).size).toBe(3);
    const delJueves = propuestasDelPublico(juzgar('El jueves fue el día de más basura').tema!);
    expect(delJueves.find((p) => p.bien)!.texto).toMatch(/los jueves con una bolsa extra/);
  });
});
