import {
  conCinta,
  conPista,
  corteDe,
  corteEn,
  cortesDe,
  cortesImposibles,
  descuadre,
  duracionDe,
  duracionTotal,
  inicioDe,
  MIN_DUR,
  ordenDeRecursos,
  pistaDe,
  sobranteDe,
  type Corte,
  type Pista,
} from '@/components/simuladores/diseno/cinta';
import { ejecutar, reproducir, accion, type Accion } from '@/components/simuladores/diseno/comandos';
import { LIENZOS, PALETA_BASE, type Documento, type Recurso } from '@/components/simuladores/diseno/modelo';

/**
 * Paso 0 de `n6-edita-imagen-y-video` (DISEÑO §Parte 2). Puro, sin DOM: es lo
 * que se hizo con el evaluador de fórmulas (§46) para que el motor no se
 * probara sólo hasta donde llegaran las clases jugadas.
 */

const BANCO: Record<string, Recurso> = {
  'clip-entrada': {
    id: 'clip-entrada',
    nombre: 'Entrada al patio',
    autor: 'Prof.',
    licencia: 'con-permiso',
    fondo: '#111',
    segundos: 6,
    tipoMedia: 'video',
  },
  'clip-volcan': {
    id: 'clip-volcan',
    nombre: 'El volcán',
    autor: 'Prof.',
    licencia: 'con-permiso',
    fondo: '#222',
    segundos: 5,
    tipoMedia: 'video',
  },
  'clip-aplauso': {
    id: 'clip-aplauso',
    nombre: 'Los aplausos',
    autor: 'Prof.',
    licencia: 'con-permiso',
    fondo: '#333',
    segundos: 4,
    tipoMedia: 'video',
  },
  'musica-feria': {
    id: 'musica-feria',
    nombre: 'Música de la feria',
    autor: 'Prof.',
    licencia: 'con-permiso',
    fondo: '#444',
    segundos: 15,
    tipoMedia: 'audio',
  },
};

function docVacio(): Documento {
  return {
    lienzo: LIENZOS.video,
    paleta: PALETA_BASE,
    banco: BANCO,
    paginas: [{ id: 'p1', nombre: 'Portada', fondo: null, capas: [] }],
    cinta: [
      { id: 'video', tipo: 'video', nombre: 'Video', cortes: [] },
      { id: 'audio', tipo: 'audio', nombre: 'Música', cortes: [] },
    ],
  };
}

/* ── las lecturas sobre una cinta a mano (sin pasar por comandos) ─────────── */

describe('cinta.ts · lecturas puras', () => {
  const pistaVideo: Pista = {
    id: 'video',
    tipo: 'video',
    nombre: 'Video',
    cortes: [
      { id: 'c1', recurso: 'clip-entrada', desde: 2, dura: 4 },
      { id: 'c2', recurso: 'clip-volcan', desde: 0, dura: 4 },
      { id: 'c3', recurso: 'clip-aplauso', desde: 0, dura: 4 },
    ],
  };

  test('inicioDe: la suma de lo que va antes, y -1 si no está', () => {
    expect(inicioDe(pistaVideo, 'c1')).toBe(0);
    expect(inicioDe(pistaVideo, 'c2')).toBe(4);
    expect(inicioDe(pistaVideo, 'c3')).toBe(8);
    expect(inicioDe(pistaVideo, 'fantasma')).toBe(-1);
  });

  test('corteEn: qué corte cubre ese segundo, y null en un hueco o pasado el final', () => {
    expect(corteEn(pistaVideo, 0)?.id).toBe('c1');
    expect(corteEn(pistaVideo, 3)?.id).toBe('c1');
    expect(corteEn(pistaVideo, 4)?.id).toBe('c2');
    expect(corteEn(pistaVideo, 7)?.id).toBe('c2');
    expect(corteEn(pistaVideo, 8)?.id).toBe('c3');
    expect(corteEn(pistaVideo, 11)?.id).toBe('c3');
    expect(corteEn(pistaVideo, 12)).toBeNull();
    expect(corteEn({ ...pistaVideo, cortes: [] }, 0)).toBeNull();
  });
});

describe('cinta.ts · lecturas que necesitan el documento (banco)', () => {
  function conCortes(): Documento {
    let d = docVacio();
    const acciones: Accion[] = [
      accion('poner-corte', { pista: 'video', id: 'c1', recurso: 'clip-entrada' }),
      accion('poner-corte', { pista: 'video', id: 'c2', recurso: 'clip-volcan' }),
      accion('poner-corte', { pista: 'video', id: 'c3', recurso: 'clip-aplauso' }),
      accion('poner-corte', { pista: 'audio', id: 'ca', recurso: 'musica-feria' }),
    ];
    for (const a of acciones) d = ejecutar(d, a).doc;
    return d;
  }

  test('pistaDe / corteDe / cortesDe', () => {
    const d = conCortes();
    expect(pistaDe(d, 'video')?.cortes).toHaveLength(3);
    expect(pistaDe(d, 'fantasma')).toBeNull();
    expect(corteDe(d, 'video', 'c2')?.recurso).toBe('clip-volcan');
    expect(corteDe(d, 'video', 'fantasma')).toBeNull();
    expect(cortesDe(d, 'video')).toHaveLength(3);
    expect(cortesDe(d, 'fantasma')).toEqual([]);
  });

  test('duracionDe suma los enteros, duracionTotal es el máximo de las pistas', () => {
    const d = conCortes();
    expect(duracionDe(d, 'video')).toBe(15); // 6+5+4, nadie ha recortado todavía
    expect(duracionDe(d, 'audio')).toBe(15);
    expect(duracionTotal(d)).toBe(15);
  });

  test('ordenDeRecursos: los ids de recurso en el orden de la pista', () => {
    const d = conCortes();
    expect(ordenDeRecursos(d, 'video')).toEqual(['clip-entrada', 'clip-volcan', 'clip-aplauso']);
  });

  test('sobranteDe: cuánto del original quedó fuera', () => {
    let d = conCortes();
    d = ejecutar(d, accion('recortar-corte', { pista: 'video', corte: 'c1', desde: 2, dura: 4 })).doc;
    expect(sobranteDe(d, 'video', 'c1')).toBe(2); // recurso.segundos(6) - dura(4) = 2
    expect(sobranteDe(d, 'video', 'fantasma')).toBe(0);
  });

  test('descuadre: audio menos video, 0 = cuadra, con signo', () => {
    const d = conCortes();
    // video: 6+5+4=15, audio: 15 → cuadra ya de fábrica en este documento de prueba.
    expect(descuadre(d)).toBe(0);
    const dCorta = ejecutar(d, accion('recortar-corte', { pista: 'video', corte: 'c2', dura: 4 })).doc; // video: 14
    expect(descuadre(dCorta)).toBe(1); // 15 - 14
  });

  test('descuadre sin ninguna cinta es 0, no revienta', () => {
    const d: Documento = { ...docVacio(), cinta: undefined };
    expect(descuadre(d)).toBe(0);
    expect(duracionTotal(d)).toBe(0);
    expect(cortesDe(d, 'video')).toEqual([]);
  });

  test('cortesImposibles: vacío en un documento sano', () => {
    expect(cortesImposibles(conCortes())).toEqual([]);
  });

  test('cortesImposibles: caza un corte que se pasa del original y uno sin recurso', () => {
    const sano = conCortes();
    // Se cuela un corte que pide más de lo que el original tiene (fabricado a mano,
    // como pasaría si un comando futuro no acotara bien).
    const roto: Documento = {
      ...sano,
      cinta: (sano.cinta ?? []).map((p) =>
        p.id === 'video' ? { ...p, cortes: [...p.cortes, { id: 'imposible', recurso: 'clip-aplauso', desde: 0, dura: 99 }] } : p,
      ),
    };
    expect(cortesImposibles(roto)).toEqual(['imposible']);

    const huerfano: Documento = {
      ...sano,
      cinta: (sano.cinta ?? []).map((p) =>
        p.id === 'audio' ? { ...p, cortes: [...p.cortes, { id: 'sin-recurso', recurso: 'no-existe', desde: 0, dura: 2 }] } : p,
      ),
    };
    expect(cortesImposibles(huerfano)).toEqual(['sin-recurso']);
  });
});

/* ── escrituras: conCinta / conPista devuelven el MISMO objeto si no hay cambio ── */

describe('cinta.ts · conCinta / conPista, identidad', () => {
  test('conCinta no toca el documento si `f` devuelve la misma cinta', () => {
    const d = docVacio();
    const igual = conCinta(d, (c) => c);
    expect(igual).toBe(d); // por identidad, no por valor: la regla de la casa
  });

  test('conPista no toca el documento si la pista no existe', () => {
    const d = docVacio();
    const igual = conPista(d, 'fantasma', (p) => ({ ...p, silenciada: true }));
    expect(igual).toBe(d);
  });

  test('conPista sí produce un documento nuevo cuando la pista existe', () => {
    const d = docVacio();
    const nuevo = conPista(d, 'video', (p) => ({ ...p, silenciada: true }));
    expect(nuevo).not.toBe(d);
    expect(pistaDe(nuevo, 'video')?.silenciada).toBe(true);
    expect(pistaDe(d, 'video')?.silenciada).toBeFalsy(); // el original no se mutó
  });
});

/* ── los cinco comandos, aplicados con `ejecutar` (el embudo del armazón) ── */

describe('los cinco comandos de la cinta', () => {
  test('poner-corte: por omisión desde 0 y dura = recurso.segundos, id único en TODA la cinta', () => {
    let d = docVacio();
    const r1 = ejecutar(d, accion('poner-corte', { pista: 'video', id: 'c1', recurso: 'clip-entrada' }));
    expect(r1.rechazo).toBeNull();
    d = r1.doc;
    expect(corteDe(d, 'video', 'c1')).toEqual({ id: 'c1', recurso: 'clip-entrada', desde: 0, dura: 6 });

    // El mismo id, aunque sea en la OTRA pista, se rechaza: único en toda la cinta.
    const r2 = ejecutar(d, accion('poner-corte', { pista: 'audio', id: 'c1', recurso: 'musica-feria' }));
    expect(r2.rechazo).not.toBeNull();
  });

  test('poner-corte rechaza un recurso sin segundos, uno que no está en el banco, y una pista que no está', () => {
    const d = docVacio();
    const conColor = { ...d, banco: { ...d.banco, quieta: { id: 'quieta', nombre: 'Foto', autor: 'a', licencia: 'libre' as const, fondo: '#fff' } } };
    expect(ejecutar(conColor, accion('poner-corte', { pista: 'video', id: 'c1', recurso: 'quieta' })).rechazo).not.toBeNull();
    expect(ejecutar(d, accion('poner-corte', { pista: 'video', id: 'c1', recurso: 'no-existe' })).rechazo).not.toBeNull();
    expect(ejecutar(d, accion('poner-corte', { pista: 'fantasma', id: 'c1', recurso: 'clip-entrada' })).rechazo).not.toBeNull();
  });

  test('poner-corte rechaza cuando el tipo de la pista no casa con el del recurso (jugar mal)', () => {
    const d = docVacio();
    const musicaEnVideo = ejecutar(d, accion('poner-corte', { pista: 'video', id: 'c1', recurso: 'musica-feria' }));
    expect(musicaEnVideo.rechazo).not.toBeNull();
    const clipEnAudio = ejecutar(d, accion('poner-corte', { pista: 'audio', id: 'c1', recurso: 'clip-entrada' }));
    expect(clipEnAudio.rechazo).not.toBeNull();
  });

  test('recortar-corte: argumentos ABSOLUTOS — repetir la misma llamada no vuelve a recortar', () => {
    let d = docVacio();
    d = ejecutar(d, accion('poner-corte', { pista: 'video', id: 'c1', recurso: 'clip-entrada' })).doc; // 6 s
    d = ejecutar(d, accion('recortar-corte', { pista: 'video', corte: 'c1', desde: 2, dura: 4 })).doc;
    expect(corteDe(d, 'video', 'c1')).toEqual({ id: 'c1', recurso: 'clip-entrada', desde: 2, dura: 4 });
    // Repetir la MISMA acción no debe encoger una segunda vez.
    d = ejecutar(d, accion('recortar-corte', { pista: 'video', corte: 'c1', desde: 2, dura: 4 })).doc;
    expect(corteDe(d, 'video', 'c1')).toEqual({ id: 'c1', recurso: 'clip-entrada', desde: 2, dura: 4 });
  });

  test('recortar-corte: lo que no venga conserva su valor actual', () => {
    let d = docVacio();
    d = ejecutar(d, accion('poner-corte', { pista: 'video', id: 'c1', recurso: 'clip-entrada' })).doc; // desde 0, dura 6
    d = ejecutar(d, accion('recortar-corte', { pista: 'video', corte: 'c1', desde: 2 })).doc; // sólo `desde`
    expect(corteDe(d, 'video', 'c1')).toEqual({ id: 'c1', recurso: 'clip-entrada', desde: 2, dura: 4 }); // dura se acota al hueco que queda
  });

  test('recortar-corte: jugar mal — recortar la música hasta 1 segundo y volver a subirla', () => {
    let d = docVacio();
    d = ejecutar(d, accion('poner-corte', { pista: 'audio', id: 'ca', recurso: 'musica-feria' })).doc; // 15 s
    d = ejecutar(d, accion('recortar-corte', { pista: 'audio', corte: 'ca', dura: 1 })).doc;
    expect(corteDe(d, 'audio', 'ca')?.dura).toBe(1);
    d = ejecutar(d, accion('recortar-corte', { pista: 'audio', corte: 'ca', dura: 12 })).doc; // sube, no sólo baja
    expect(corteDe(d, 'audio', 'ca')?.dura).toBe(12);
  });

  test('recortar-corte: nunca baja de MIN_DUR ni se pasa del original, recortar veinte veces seguidas para en el mínimo', () => {
    let d = docVacio();
    d = ejecutar(d, accion('poner-corte', { pista: 'video', id: 'c1', recurso: 'clip-aplauso' })).doc; // 4 s
    for (let i = 0; i < 20; i += 1) {
      d = ejecutar(d, accion('recortar-corte', { pista: 'video', corte: 'c1', dura: (corteDe(d, 'video', 'c1')?.dura ?? 1) - 1 })).doc;
    }
    expect(corteDe(d, 'video', 'c1')?.dura).toBe(MIN_DUR);
    d = ejecutar(d, accion('recortar-corte', { pista: 'video', corte: 'c1', dura: 999 })).doc;
    expect(corteDe(d, 'video', 'c1')?.dura).toBeLessThanOrEqual(4);
  });

  test('mover-corte: cambia de sitio en la lista, acotado a los límites', () => {
    let d = docVacio();
    d = ejecutar(d, accion('poner-corte', { pista: 'video', id: 'c1', recurso: 'clip-entrada' })).doc;
    d = ejecutar(d, accion('poner-corte', { pista: 'video', id: 'c2', recurso: 'clip-volcan' })).doc;
    d = ejecutar(d, accion('poner-corte', { pista: 'video', id: 'c3', recurso: 'clip-aplauso' })).doc;
    expect(ordenDeRecursos(d, 'video')).toEqual(['clip-entrada', 'clip-volcan', 'clip-aplauso']);
    d = ejecutar(d, accion('mover-corte', { pista: 'video', corte: 'c1', a: 2 })).doc;
    expect(ordenDeRecursos(d, 'video')).toEqual(['clip-volcan', 'clip-aplauso', 'clip-entrada']);
    // Jugar mal: destino fuera de rango, se acota.
    d = ejecutar(d, accion('mover-corte', { pista: 'video', corte: 'c1', a: 999 })).doc;
    expect(ordenDeRecursos(d, 'video')).toEqual(['clip-volcan', 'clip-aplauso', 'clip-entrada']);
  });

  test('quitar-corte: lo saca de la lista; poner el mismo clip dos veces da dos ids distintos', () => {
    let d = docVacio();
    d = ejecutar(d, accion('poner-corte', { pista: 'video', id: 'c1', recurso: 'clip-entrada' })).doc;
    d = ejecutar(d, accion('poner-corte', { pista: 'video', id: 'c2', recurso: 'clip-entrada' })).doc; // repetido, es legítimo
    expect(cortesDe(d, 'video')).toHaveLength(2);
    expect(cortesDe(d, 'video')[0].id).not.toBe(cortesDe(d, 'video')[1].id);
    d = ejecutar(d, accion('quitar-corte', { pista: 'video', corte: 'c1' })).doc;
    expect(cortesDe(d, 'video')).toHaveLength(1);
    expect(cortesDe(d, 'video')[0].id).toBe('c2');
    // Quitar el que está bajo el cabezal: corteEn debe devolver null, no un fantasma.
    const pista = pistaDe(d, 'video')!;
    d = ejecutar(d, accion('quitar-corte', { pista: 'video', corte: 'c2' })).doc;
    expect(corteEn(pistaDe(d, 'video')!, 0)).toBeNull();
    void pista;
  });

  test('silenciar marca la pista, no toca los cortes', () => {
    let d = docVacio();
    d = ejecutar(d, accion('poner-corte', { pista: 'audio', id: 'ca', recurso: 'musica-feria' })).doc;
    d = ejecutar(d, accion('silenciar', { pista: 'audio', valor: true })).doc;
    expect(pistaDe(d, 'audio')?.silenciada).toBe(true);
    expect(cortesDe(d, 'audio')).toHaveLength(1);
    d = ejecutar(d, accion('silenciar', { pista: 'audio', valor: false })).doc;
    expect(pistaDe(d, 'audio')?.silenciada).toBe(false);
  });

  test('un comando de la cinta sin la herramienta `cinta` se rechaza (el cuentagotas de la clase de composición)', () => {
    const d = docVacio();
    const r = ejecutar(d, accion('poner-corte', { pista: 'video', id: 'c1', recurso: 'clip-entrada' }), ['seleccion', 'imagen']);
    expect(r.rechazo).not.toBeNull();
  });
});

/* ── la invariante: reproducir() da el mismo documento que ir aplicando ──── */

describe('reproducir() también reproduce acciones de la cinta', () => {
  test('la lista completa del acto 2, reproducida desde el principio, da el documento final', () => {
    const base = docVacio();
    const acciones: Accion[] = [
      accion('poner-corte', { pista: 'video', id: 'c1', recurso: 'clip-entrada' }),
      accion('poner-corte', { pista: 'video', id: 'c2', recurso: 'clip-volcan' }),
      accion('poner-corte', { pista: 'video', id: 'c3', recurso: 'clip-aplauso' }),
      accion('recortar-corte', { pista: 'video', corte: 'c1', desde: 2, dura: 4 }),
      accion('recortar-corte', { pista: 'video', corte: 'c2', dura: 4 }),
      accion('poner-corte', { pista: 'audio', id: 'ca', recurso: 'musica-feria' }),
      accion('recortar-corte', { pista: 'audio', corte: 'ca', dura: 12 }),
    ];
    let paso = base;
    for (const a of acciones) paso = ejecutar(paso, a).doc;
    const deUnTiron = reproducir(base, acciones);
    expect(deUnTiron).toEqual(paso);
    expect(duracionDe(deUnTiron, 'video')).toBe(12);
    expect(descuadre(deUnTiron)).toBe(0);
    expect(cortesImposibles(deUnTiron)).toEqual([]);
  });

  test('deshacer hasta el principio con la cinta llena y rehacer entero da el mismo documento', () => {
    const base = docVacio();
    const acciones: Accion[] = [
      accion('poner-corte', { pista: 'video', id: 'c1', recurso: 'clip-entrada' }),
      accion('poner-corte', { pista: 'video', id: 'c2', recurso: 'clip-volcan' }),
      accion('recortar-corte', { pista: 'video', corte: 'c1', dura: 3 }),
    ];
    const final = reproducir(base, acciones);
    // Deshacer a mano (reproducir prefijos cada vez más cortos) y comprobar
    // que rehacer (reproducir la lista entera otra vez) vuelve al mismo sitio.
    const prefijo2 = reproducir(base, acciones.slice(0, 2));
    const prefijo1 = reproducir(base, acciones.slice(0, 1));
    const prefijo0 = reproducir(base, acciones.slice(0, 0));
    expect(prefijo0).toEqual(base);
    expect(cortesDe(prefijo1, 'video')).toHaveLength(1);
    expect(cortesDe(prefijo2, 'video')).toHaveLength(2);
    const rehecho = reproducir(base, acciones);
    expect(rehecho).toEqual(final);
  });
});

/** Un `Corte` y una `Pista` bien tipados, para que el archivo no dependa
 *  únicamente de la inferencia de `ejecutar`. */
const _tipos: { c: Corte; p: Pista } = {
  c: { id: 'x', recurso: 'y', desde: 0, dura: 1 },
  p: { id: 'video', tipo: 'video', nombre: 'Video', cortes: [] },
};
void _tipos;
