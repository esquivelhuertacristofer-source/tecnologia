/**
 * `n6-carteles-e-infografias` (§69.14) · la infografía de la encuesta, jugando
 * MAL. Cada jugada parte de la partida buena y estropea UNA cosa: la barra mal
 * calculada, la que sube una casilla, la más gorda, las etiquetas cambiadas,
 * cuatro colores para cuatro barras, un quinto color y un texto que le gana al
 * título. Sin DOM: el documento se arma con las mismas acciones del editor.
 */
import {
  accion,
  documento as documentoDe,
  hacer,
  nuevaHistoria,
  type Accion,
  type Diseno,
  type Documento,
} from '@/components/simuladores/diseno';
import {
  DOC_INICIAL,
  GUION,
  PAGINA,
  cadaBarraConSuEtiqueta,
  destacaLaRespuesta,
  diceLaFuente,
  mismaBaseYAncho,
  sonProporcionales,
} from '@/components/activities/diseno/LabCartelesEInfografias';

const P = PAGINA;
const titulo = [
  accion('nuevo-texto', { pagina: P, id: 't1', texto: '¿Cómo llegamos a la escuela?', col: 0, fila: 0, cols: 8, filas: 2 }),
  accion('tamano', { pagina: P, capa: 't1', pt: 44 }),
  accion('centrar', { pagina: P, capa: 't1', eje: 'h' }),
];
const barra = (id: string, col: number, filas: number, extra: Record<string, number> = {}) =>
  accion('nueva-forma', { pagina: P, id, figura: 'rect', col, fila: 11 - filas, cols: 2, filas, ...extra });
const etiqueta = (id: string, texto: string, col: number) =>
  accion('nuevo-texto', { pagina: P, id, texto, col, fila: 11, cols: 3, filas: 2, pt: 16 });

function partida(cambios: { barras?: Accion[]; etiquetas?: Accion[]; despues?: Accion[] } = {}): Documento {
  const acciones: Accion[] = [
    ...titulo,
    ...(cambios.barras ?? [barra('b1', 1, 6), barra('b2', 4, 4), barra('b3', 7, 3), barra('b4', 10, 2)]),
    ...(cambios.etiquetas ?? [
      etiqueta('l1', 'Caminando 12', 0),
      etiqueta('l2', 'Autobús 8', 3),
      etiqueta('l3', 'Coche 6', 6),
      etiqueta('l4', 'Bici 4', 9),
    ]),
    accion('relleno', { pagina: P, capa: 'b1', color: 'naranja' }),
    accion('nuevo-texto', { pagina: P, id: 'f', texto: 'Fuente: encuesta del 6.º B', col: 0, fila: 14, cols: 12, filas: 2, pt: 12 }),
    accion('fondo', { pagina: P, color: 'tinta' }),
    ...(cambios.despues ?? []),
  ];
  let h = nuevaHistoria(DOC_INICIAL);
  for (const a of acciones) {
    const r = hacer(h, a, 'todas');
    if (r.rechazo) throw new Error(`rechazada «${a.comando}»: ${r.rechazo}`);
    h = r.historia;
  }
  return documentoDe(h);
}

const ultimo = GUION[GUION.length - 1];
const cierraElUltimo = (doc: Documento) =>
  ultimo.comprueba({ documento: doc, pagina: P, seleccion: [] } as unknown as Diseno);

describe('n6-carteles-e-infografias · la partida buena', () => {
  it('cumple las cinco reglas de la infografía y el cierre', () => {
    const doc = partida();
    expect([sonProporcionales(doc), mismaBaseYAncho(doc), cadaBarraConSuEtiqueta(doc), destacaLaRespuesta(doc), diceLaFuente(doc)]).toEqual([
      true,
      true,
      true,
      true,
      true,
    ]);
    expect(cierraElUltimo(doc)).toBe(true);
  });
});

describe('n6-carteles-e-infografias · jugando mal', () => {
  it('una barra mal calculada (6, 4, 4, 2) no es proporcional; otra escala (12, 8, 6, 4) sí', () => {
    expect(sonProporcionales(partida({ barras: [barra('b1', 1, 6), barra('b2', 4, 4), barra('b3', 7, 4), barra('b4', 10, 2)] }))).toBe(false);
    expect(
      sonProporcionales(partida({ barras: [barra('b1', 1, 11, { fila: 0 }), barra('b2', 4, 8), barra('b3', 7, 6), barra('b4', 10, 4)] })),
    ).toBe(false); // 11 no es 12: la escala tiene que ser la misma en las cuatro
    const otraEscala = partida({
      barras: [
        accion('nueva-forma', { pagina: P, id: 'b1', figura: 'rect', col: 1, fila: 0, cols: 2, filas: 12 }),
        accion('nueva-forma', { pagina: P, id: 'b2', figura: 'rect', col: 4, fila: 4, cols: 2, filas: 8 }),
        accion('nueva-forma', { pagina: P, id: 'b3', figura: 'rect', col: 7, fila: 6, cols: 2, filas: 6 }),
        accion('nueva-forma', { pagina: P, id: 'b4', figura: 'rect', col: 10, fila: 8, cols: 2, filas: 4 }),
      ],
    });
    expect(sonProporcionales(otraEscala)).toBe(true);
  });

  it('una barra subida una casilla, o más gorda, no está en el mismo suelo', () => {
    expect(mismaBaseYAncho(partida({ barras: [barra('b1', 1, 6), barra('b2', 4, 4), barra('b3', 7, 3), barra('b4', 10, 2, { fila: 8 })] }))).toBe(false);
    expect(mismaBaseYAncho(partida({ barras: [barra('b1', 1, 6), barra('b2', 4, 4, { cols: 3 }), barra('b3', 7, 3), barra('b4', 10, 2)] }))).toBe(false);
  });

  it('las etiquetas con los números cambiados entre dos barras no valen, ni una sin nombre', () => {
    const cambiadas = partida({
      etiquetas: [etiqueta('l1', 'Caminando 12', 0), etiqueta('l2', 'Autobús 6', 3), etiqueta('l3', 'Coche 8', 6), etiqueta('l4', 'Bici 4', 9)],
    });
    expect(cadaBarraConSuEtiqueta(cambiadas)).toBe(false);
    const sinNombre = partida({
      etiquetas: [etiqueta('l1', '12', 0), etiqueta('l2', 'Autobús 8', 3), etiqueta('l3', 'Coche 6', 6), etiqueta('l4', 'Bici 4', 9)],
    });
    expect(cadaBarraConSuEtiqueta(sinNombre)).toBe(false);
  });

  it('cuatro barras de cuatro colores no destacan nada', () => {
    const doc = partida({
      despues: [
        accion('relleno', { pagina: P, capa: 'b2', color: 'verde' }),
        accion('relleno', { pagina: P, capa: 'b3', color: 'violeta' }),
      ],
    });
    expect(destacaLaRespuesta(doc)).toBe(false);
  });

  it('un quinto color, o una etiqueta más grande que el título, no cierran el cartel', () => {
    expect(cierraElUltimo(partida({ despues: [accion('relleno', { pagina: P, capa: 't1', color: 'amarillo' })] }))).toBe(false);
    expect(cierraElUltimo(partida({ despues: [accion('tamano', { pagina: P, capa: 'l2', pt: 60 })] }))).toBe(false);
  });

  it('las instrucciones no dictan la secuencia de botones', () => {
    for (const p of GUION) expect([p.id, /→|pulsa «/i.test(p.instruccion)]).toEqual([p.id, false]);
  });
});
