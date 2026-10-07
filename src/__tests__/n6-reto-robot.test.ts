/**
 * `n6-reto-robot` (§69.10) · un programa, dos mapas. El juez corre el programa
 * en los dos sin pintarlos y pide llegar sin chocar: una secuencia fija no
 * puede, uno que mira antes de moverse sí. Jugando MAL: la secuencia que
 * choca, la que sólo sirve para un mapa, el bucle corto y el «si» vacío.
 */
import { nuevoBloque, pila, programaDe, type BloquePuesto, type Programa } from '@/components/simuladores/bloques';
import {
  CATALOGO,
  GUION,
  MAPAS,
  PILA,
  correrEnMapa,
  llegaEnLosDosMapas,
  mundoEn,
  reducirRobot,
} from '@/components/activities/bloques/LabRetoRobot';

let n = 0;
function b(ficha: string, extra: Partial<BloquePuesto> = {}): BloquePuesto {
  const bloque = nuevoBloque(CATALOGO, ficha, `b${(n += 1)}`);
  if (!bloque) throw new Error(ficha);
  return { ...bloque, ...extra };
}
const programa = (...cuerpo: BloquePuesto[]): Programa => programaDe(pila(PILA, { ...b('al-empezar'), fijo: true }, cuerpo));
const veces = (k: number, ficha: string) => Array.from({ length: k }, () => b(ficha));
const siPared = (dentro: BloquePuesto[], condicion: BloquePuesto | null = b('hay-pared-adelante')) =>
  b('si', { condicion, ramas: { cuerpo: dentro } });
const repetir = (k: number, cuerpo: BloquePuesto[]) => b('repetir', { args: { veces: k }, ramas: { cuerpo } });

describe('n6-reto-robot · los dos mapas', () => {
  it('son de 5×5, cada uno con una salida y una bandera', () => {
    for (const { filas } of Object.values(MAPAS)) {
      expect(filas).toHaveLength(5);
      expect(filas.every((f) => f.length === 5)).toBe(true);
      expect(filas.join('').split('R')).toHaveLength(2);
      expect(filas.join('').split('F')).toHaveLength(2);
    }
  });

  it('chocar no mueve al robot y se cuenta; la bandera lo detiene', () => {
    let m = mundoEn('pasillo');
    for (let i = 0; i < 4; i++) m = reducirRobot(m, { tipo: 'accion', accion: 'avanzar' } as never);
    expect([m.col, m.golpes]).toEqual([3, 1]);
    const enMeta = { ...mundoEn('pasillo'), fila: 4, col: 3, enMeta: true };
    expect(reducirRobot(enMeta, { tipo: 'accion', accion: 'girar-derecha' } as never)).toEqual(enMeta);
  });
});

describe('n6-reto-robot · el juez, jugando mal', () => {
  it('la secuencia que cuenta el Mapa 1 llega ahí y en el Mapa 2 no', () => {
    const p = programa(...veces(3, 'avanzar'), b('girar-derecha'), ...veces(4, 'avanzar'));
    expect(correrEnMapa(p, 'pasillo')).toMatchObject({ enMeta: true, golpes: 0 });
    expect(correrEnMapa(p, 'esquina').enMeta).toBe(false);
    expect(llegaEnLosDosMapas(p)).toBe(false);
  });

  it('«avanzar ×4, girar, avanzar ×4» llega a las dos banderas pero choca en el Mapa 1: no cierra el reto', () => {
    const p = programa(...veces(4, 'avanzar'), b('girar-derecha'), ...veces(4, 'avanzar'));
    expect(correrEnMapa(p, 'pasillo')).toMatchObject({ enMeta: true, golpes: 1 });
    expect(correrEnMapa(p, 'esquina')).toMatchObject({ enMeta: true, golpes: 0 });
    expect(llegaEnLosDosMapas(p)).toBe(false);
  });

  it('«repetir: si hay pared → girar; avanzar» cierra el reto; con pocas vueltas, no llega', () => {
    const mira = (k: number) => programa(repetir(k, [siPared([b('girar-derecha')]), b('avanzar')]));
    expect(llegaEnLosDosMapas(mira(10))).toBe(true);
    expect(llegaEnLosDosMapas(mira(12))).toBe(true); // repetir de más no lo saca de la bandera
    expect(llegaEnLosDosMapas(mira(5))).toBe(false);
  });

  it('el «si» con el hexágono vacío nunca gira, y el robot se estrella', () => {
    const p = programa(repetir(10, [siPared([b('girar-derecha')], null), b('avanzar')]));
    const fin = correrEnMapa(p, 'pasillo');
    expect(fin.enMeta).toBe(false);
    expect(fin.golpes).toBeGreaterThanOrEqual(1);
  });
});

describe('n6-reto-robot · el guion da la meta, no los bloques', () => {
  it('ninguna instrucción dicta cuántas veces poner un bloque ni dónde', () => {
    for (const paso of GUION) {
      expect([paso.id, /\b(DOS|TRES|dos veces|tres veces|debajo de|dentro del si)\b/.test(paso.instruccion)]).toEqual([
        paso.id,
        false,
      ]);
    }
  });
});
