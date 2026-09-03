/**
 * TECNIA DISEÑO · el armazón de las 8 actividades de diseño.
 *
 * Se prueba en cuatro alturas y en este orden, porque es el orden en el que se
 * rompe: la rejilla (enteros), la acción como dato, el historial y el arrastre
 * (puros, sin React) y por último la ventana, que es lo único que necesita DOM.
 *
 * Y se prueba JUGANDO MAL, que es lo que caza lo que la verificación buena no
 * ve: arrastrar fuera del lienzo, redimensionar a cero y a negativo, deshacer
 * cien veces con el lienzo vacío, deshacer y actuar después, borrar dos veces
 * lo mismo, girar 3600 grados, meter cien capas y pedir herramientas que la
 * clase no dio.
 */
import { act, createEvent, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { useState } from 'react';
import {
  accion,
  ejecutar,
  etiquetaDe,
  reproducir,
  type Accion,
} from '@/components/simuladores/diseno/comandos';
import {
  documento as docDe,
  deshacer,
  hacer,
  nuevaHistoria,
  pasos,
  rehacer,
  type Historia,
} from '@/components/simuladores/diseno/historia';
import {
  empujar,
  iniciar,
  mangoDeGiro,
  mover as moverGesto,
  soltar,
} from '@/components/simuladores/diseno/arrastre';
import {
  alineadas,
  alcanzables,
  capasDe,
  cuantosColores,
  estaCentradaH,
  estaDeformada,
  hayJerarquia,
  huerfanas,
  ordenDeLectura,
  sinCreditar,
  tapanLaZona,
  zonaDeCapa,
} from '@/components/simuladores/diseno/consultas';
import { estaSano, historiaCuadra, verificar } from '@/components/simuladores/diseno/verificar';
import {
  capaDe,
  centroX2,
  enLaRejilla,
  LIENZOS,
  moverPorPixeles,
  normalizarGiro,
  PALETA_BASE,
  redimensionarPorPixeles,
  type Caja,
  type CapaImagen,
  type CapaTexto,
  type Documento,
} from '@/components/simuladores/diseno/modelo';
import { useDiseno } from '@/components/simuladores/diseno/useDiseno';
import { VentanaDiseno } from '@/components/simuladores/diseno/VentanaDiseno';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import type { HerramientaId } from '@/components/simuladores/diseno/comandos';

/* ── el documento de prueba: un cartel con una foto que tiene cara ────────── */

const LIENZO = LIENZOS.cartel; // 12 × 16 casillas de 44 px

const BANCO = {
  retrato: {
    id: 'retrato',
    nombre: 'Retrato de Sofi',
    autor: 'Marina Rivas',
    licencia: 'atribucion' as const,
    fondo: 'linear-gradient(160deg,#f97316,#7c3aed)',
    glifo: '🧒',
    proporcion: { cols: 3, filas: 4 },
  },
  fondoLibre: {
    id: 'fondoLibre',
    nombre: 'Cielo',
    autor: 'Banco Tecnia',
    licencia: 'libre' as const,
    fondo: 'linear-gradient(#22d3ee,#2563eb)',
  },
};

function docVacio(): Documento {
  return {
    lienzo: LIENZO,
    paleta: PALETA_BASE,
    banco: BANCO,
    paginas: [{ id: 'p1', nombre: 'Cartel', fondo: 'tinta', capas: [] }],
  };
}

const TODAS: readonly HerramientaId[] | 'todas' = 'todas';

/** Aplica una lista sobre un documento vacío y devuelve las dos cosas. */
function jugar(acciones: Accion[], herramientas: readonly HerramientaId[] | 'todas' = TODAS) {
  let h: Historia = nuevaHistoria(docVacio());
  const rechazos: string[] = [];
  for (const a of acciones) {
    const r = hacer(h, a, herramientas);
    if (r.rechazo) rechazos.push(r.rechazo);
    h = r.historia;
  }
  return { historia: h, doc: docDe(h), rechazos };
}

const nuevaForma = (id: string, caja: Caja, relleno = 'cian') =>
  accion('nueva-forma', { pagina: 'p1', id, figura: 'rect', ...caja, relleno });

const nuevoTexto = (id: string, caja: Caja, texto: string, pt = 24) =>
  accion('nuevo-texto', { pagina: 'p1', id, texto, pt, ...caja });

/* ═══════════════════════════════════════════════════════════════════════════
 * 1 · LA REJILLA: enteros o nada
 * ═════════════════════════════════════════════════════════════════════════ */

describe('la rejilla', () => {
  const caja: Caja = { col: 4, fila: 4, cols: 4, filas: 4 };

  test('mover redondea al centro de la casilla y no deja salir del lienzo', () => {
    // Media casilla no mueve; media y pico sí. Redondeo, no truncamiento.
    expect(moverPorPixeles(caja, 21, 0, LIENZO).col).toBe(4);
    expect(moverPorPixeles(caja, 23, 0, LIENZO).col).toBe(5);
    // Jugar mal: arrastrar muy lejos por los cuatro lados.
    expect(moverPorPixeles(caja, 99_999, 99_999, LIENZO)).toEqual({ col: 8, fila: 12, cols: 4, filas: 4 });
    expect(moverPorPixeles(caja, -99_999, -99_999, LIENZO)).toEqual({ col: 0, fila: 0, cols: 4, filas: 4 });
    // Y sigue siendo entera después del maltrato.
    expect(enLaRejilla(moverPorPixeles(caja, 33.7, -12.2, LIENZO))).toBe(true);
  });

  test('redimensionar nunca da tamaño cero ni negativo, y la esquina conserva la proporción', () => {
    // Jugar mal: tirar del borde este hacia la izquierda hasta el infinito.
    expect(redimensionarPorPixeles(caja, 'e', -99_999, 0, LIENZO)).toMatchObject({ cols: 1 });
    expect(redimensionarPorPixeles(caja, 'n', 0, 99_999, LIENZO)).toMatchObject({ filas: 1 });
    expect(redimensionarPorPixeles(caja, 'se', 99_999, 99_999, LIENZO)).toMatchObject({ cols: 8, filas: 12 });
    // Con proporción 3:4, la esquina la respeta; el lado no (y por eso deforma).
    const esquina = redimensionarPorPixeles({ col: 0, fila: 0, cols: 3, filas: 4 }, 'se', 132, 0, LIENZO, 3 / 4);
    expect(esquina.cols * 4).toBe(esquina.filas * 3);
    const lado = redimensionarPorPixeles({ col: 0, fila: 0, cols: 3, filas: 4 }, 'e', 132, 0, LIENZO, 3 / 4);
    expect(lado.cols * 4).not.toBe(lado.filas * 3);
  });

  test('el giro va a saltos de 15° y aguanta 3600 grados', () => {
    expect(normalizarGiro(3600)).toBe(0);
    expect(normalizarGiro(-90)).toBe(270);
    expect(normalizarGiro(37)).toBe(30);
    expect(normalizarGiro(352)).toBe(345); // 23,4 saltos → 23, no la vuelta entera
    expect(normalizarGiro(355)).toBe(0);
    expect(normalizarGiro(Number.NaN)).toBe(0);
    expect(normalizarGiro(Number.POSITIVE_INFINITY)).toBe(0);
  });

  test('el centro se cuenta en medias casillas y siempre es entero', () => {
    const { doc } = jugar([
      nuevaForma('a', { col: 3, fila: 2, cols: 5, filas: 3 }),
      nuevaForma('b', { col: 0, fila: 0, cols: 12, filas: 1 }),
    ]);
    for (const c of capasDe(doc, 'p1')) {
      const centro = centroX2(c.caja);
      expect(Number.isInteger(centro.x) && Number.isInteger(centro.y)).toBe(true);
    }
    expect(centroX2(capaDe(doc, 'p1', 'b')!.caja).x).toBe(LIENZO.cols); // centrada exacta
    expect(estaCentradaH(doc, 'p1', 'a')).toBe(false);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * 2 · LA ACCIÓN COMO DATO
 * ═════════════════════════════════════════════════════════════════════════ */

describe('la acción como dato', () => {
  test('un comando que no existe se rechaza y no toca el documento', () => {
    const d = docVacio();
    const r = ejecutar(d, accion('hazme-un-cartel', { pagina: 'p1' }));
    expect(r.rechazo).toMatch(/no existe el comando/);
    expect(r.doc).toBe(d); // la misma referencia: no se copió ni un objeto
  });

  test('la actividad decide las herramientas, y el motor lo cumple (no sólo el botón)', () => {
    const solo: HerramientaId[] = ['seleccion', 'texto'];
    const { doc, rechazos } = jugar(
      [
        nuevoTexto('t1', { col: 0, fila: 0, cols: 6, filas: 2 }, 'Feria de ciencias'),
        nuevaForma('f1', { col: 0, fila: 4, cols: 4, filas: 4 }), // pide 'forma'
        accion('relleno', { pagina: 'p1', capa: 't1', color: 'rojo' }), // pide 'color'
      ],
      solo,
    );
    expect(capasDe(doc, 'p1').map((c) => c.id)).toEqual(['t1']);
    expect(rechazos).toHaveLength(2);
    expect(rechazos[1]).toMatch(/no está disponible color/i);
  });

  test('reproducir la misma lista dos veces da exactamente el mismo documento', () => {
    const guion = [
      nuevaForma('f1', { col: 1, fila: 1, cols: 4, filas: 4 }),
      nuevoTexto('t1', { col: 0, fila: 8, cols: 6, filas: 2 }, 'Hola'),
      accion('duplicar', { pagina: 'p1', capa: 'f1', id: 'f2' }),
      accion('girar', { pagina: 'p1', capa: 'f2', giro: 45 }),
      accion('orden', { pagina: 'p1', capa: 't1', a: 'atras' }),
    ];
    const uno = reproducir(docVacio(), guion);
    const dos = reproducir(docVacio(), guion);
    expect(uno).toEqual(dos);
    // Y los args son datos: JSON de ida y vuelta sin perder nada.
    expect(JSON.parse(JSON.stringify(guion))).toEqual(guion);
  });

  test('las revisiones dicen que no, y dicen por qué', () => {
    const base = jugar([nuevaForma('f1', { col: 0, fila: 0, cols: 4, filas: 4 })]).doc;
    const casos: [Accion, RegExp][] = [
      [nuevaForma('f1', { col: 0, fila: 0, cols: 2, filas: 2 }), /ya hay una capa con el id/],
      [accion('nueva-forma', { pagina: 'p1', id: 'x', figura: 'nube' }), /no existe la figura/],
      [accion('nuevo-texto', { pagina: 'p1', id: 'x', texto: 'a', pt: 33 }), /no está en la escala/],
      [accion('relleno', { pagina: 'p1', capa: 'f1', color: 'fucsia' }), /no está en la paleta/],
      [accion('nueva-imagen', { pagina: 'p1', id: 'x', recurso: 'gato' }), /no está en el banco/],
      [accion('mover', { pagina: 'p9', capa: 'f1', col: 1, fila: 1 }), /esa pantalla ya no está/],
      [accion('escribir', { pagina: 'p1', capa: 'f1', texto: 'hola' }), /no es de texto/],
      [accion('alinear', { pagina: 'p1', capas: ['f1'], borde: 'izq' }), /al menos dos capas/],
    ];
    for (const [acc, motivo] of casos) {
      const r = ejecutar(base, acc);
      expect(r.rechazo).toMatch(motivo);
      expect(r.doc).toBe(base);
    }
  });

  test('una capa bloqueada no se mueve ni se borra, y borrar dos veces se rechaza', () => {
    const { historia, doc, rechazos } = jugar([
      nuevaForma('f1', { col: 2, fila: 2, cols: 4, filas: 4 }),
      accion('bloquear', { pagina: 'p1', capa: 'f1', valor: true }),
      accion('mover', { pagina: 'p1', capa: 'f1', col: 8, fila: 8 }),
      accion('borrar', { pagina: 'p1', capa: 'f1' }),
      accion('bloquear', { pagina: 'p1', capa: 'f1', valor: false }),
      accion('borrar', { pagina: 'p1', capa: 'f1' }),
      accion('borrar', { pagina: 'p1', capa: 'f1' }), // otra vez, jugando mal
    ]);
    expect(rechazos).toEqual([
      expect.stringMatching(/bloqueada/),
      expect.stringMatching(/bloqueada/),
      expect.stringMatching(/esa capa ya no está/),
    ]);
    expect(capasDe(doc, 'p1')).toHaveLength(0);
    // Lo rechazado no ocupa sitio en el historial: 4 aceptadas de 7 intentos.
    expect(historia.hechas).toHaveLength(4);
  });

  test('el historial se lee en frases, y la de borrar todavía sabe el nombre', () => {
    const { historia } = jugar([
      nuevoTexto('t1', { col: 0, fila: 0, cols: 6, filas: 2 }, 'Feria'),
      accion('renombrar', { pagina: 'p1', capa: 't1', nombre: 'Título' }),
      accion('borrar', { pagina: 'p1', capa: 't1' }),
    ]);
    expect(pasos(historia).map((p) => p.etiqueta)).toEqual([
      'escribir «Feria»',
      'llamar «Título» a «Texto 1»',
      'borrar «Título»',
    ]);
    expect(etiquetaDe(docVacio(), accion('inventado'))).toMatch(/desconocido/);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * 3 · DESHACER Y REHACER
 * ═════════════════════════════════════════════════════════════════════════ */

describe('deshacer y rehacer', () => {
  test('deshacer cien veces con el lienzo vacío no revienta', () => {
    let h = nuevaHistoria(docVacio());
    for (let i = 0; i < 100; i += 1) h = deshacer(h);
    expect(docDe(h)).toEqual(docVacio());
    for (let i = 0; i < 100; i += 1) h = rehacer(h);
    expect(docDe(h)).toEqual(docVacio());
  });

  test('deshacer devuelve el documento anterior y rehacer lo restaura', () => {
    const { historia } = jugar([
      nuevaForma('f1', { col: 1, fila: 1, cols: 4, filas: 4 }),
      accion('mover', { pagina: 'p1', capa: 'f1', col: 6, fila: 9 }),
      accion('girar', { pagina: 'p1', capa: 'f1', giro: 90 }),
    ]);
    const antes = docDe(historia);
    const h1 = deshacer(deshacer(historia));
    expect(capaDe(docDe(h1), 'p1', 'f1')!.caja).toMatchObject({ col: 1, fila: 1 });
    expect(capaDe(docDe(h1), 'p1', 'f1')!.giro).toBe(0);
    expect(docDe(rehacer(rehacer(h1)))).toEqual(antes);
    // Deshacer hasta el principio deja el lienzo como estaba.
    expect(docDe(deshacer(h1))).toEqual(docVacio());
  });

  test('deshacer y actuar después pierde el rehacer', () => {
    const { historia } = jugar([
      nuevaForma('f1', { col: 1, fila: 1, cols: 4, filas: 4 }),
      accion('mover', { pagina: 'p1', capa: 'f1', col: 5, fila: 5 }),
    ]);
    const h1 = deshacer(historia);
    expect(h1.deshechas).toHaveLength(1);
    const h2 = hacer(h1, accion('girar', { pagina: 'p1', capa: 'f1', giro: 15 })).historia;
    expect(h2.deshechas).toHaveLength(0);
    expect(docDe(rehacer(h2))).toEqual(docDe(h2)); // rehacer ya no hace nada
  });

  test('una acción rechazada no ensucia el historial ni borra el rehacer', () => {
    const { historia } = jugar([nuevaForma('f1', { col: 1, fila: 1, cols: 4, filas: 4 })]);
    const h1 = deshacer(historia);
    const r = hacer(h1, accion('mover', { pagina: 'p1', capa: 'fantasma', col: 2, fila: 2 }));
    expect(r.rechazo).toMatch(/esa capa ya no está/);
    expect(r.historia).toBe(h1); // ni una copia
    expect(r.historia.deshechas).toHaveLength(1);
  });

  test('la historia es la verdad: reproducirla desde el principio da el documento de ahora', () => {
    const guion: Accion[] = [
      nuevaForma('f1', { col: 0, fila: 0, cols: 4, filas: 4 }),
      nuevoTexto('t1', { col: 0, fila: 6, cols: 6, filas: 2 }, 'Feria de ciencias'),
      accion('relleno', { pagina: 'p1', capa: 'f1', color: 'magenta' }),
      accion('centrar', { pagina: 'p1', capa: 't1', eje: 'h' }),
      accion('duplicar', { pagina: 'p1', capa: 'f1', id: 'f2' }),
      accion('orden', { pagina: 'p1', capa: 'f2', a: 'atras' }),
      accion('opacidad', { pagina: 'p1', capa: 'f2', valor: 4 }),
    ];
    const { historia } = jugar(guion);
    expect(historiaCuadra(historia)).toBe(true);
    // Y con tope pequeño el paso más viejo se funde: se pierde el deshacer, no el dibujo.
    let corta = nuevaHistoria(docVacio(), 3);
    for (const a of guion) corta = hacer(corta, a).historia;
    expect(corta.hechas).toHaveLength(3);
    expect(docDe(corta)).toEqual(docDe(historia));
    expect(historiaCuadra(corta)).toBe(true);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * 4 · EL ARRASTRE, SIN RATÓN
 * ═════════════════════════════════════════════════════════════════════════ */

describe('el arrastre', () => {
  const caja: Caja = { col: 2, fila: 2, cols: 4, filas: 4 };
  const base = { pagina: 'p1', capa: 'f1', caja, giro: 0, lienzo: LIENZO };

  test('mover tres casillas da una sola acción; soltar sin moverse no da ninguna', () => {
    const g0 = iniciar({ ...base, tipo: 'mover', x: 500, y: 300 });
    const g1 = moverGesto(g0, 500 + 3 * LIENZO.celdaPx, 300, LIENZO);
    expect(g1.caja).toMatchObject({ col: 5, fila: 2 });
    expect(soltar(g1)).toEqual(accion('mover', { pagina: 'p1', capa: 'f1', col: 5, fila: 2 }));
    // Cien movimientos intermedios y un solo paso de deshacer.
    let g = g0;
    for (let i = 0; i < 100; i += 1) g = moverGesto(g, 500 + i, 300 + i, LIENZO);
    expect(soltar(moverGesto(g, 500, 300, LIENZO))).toBeNull();
    // Y con el lienzo al 200 %, el mismo recorrido de pantalla mueve la mitad.
    const zoom = moverGesto(iniciar({ ...base, tipo: 'mover', x: 0, y: 0, escala: 2 }), 4 * LIENZO.celdaPx, 0, LIENZO);
    expect(zoom.caja.col).toBe(4);
    // Sin ratón: las flechas mueven una casilla y contra el borde no mueven nada.
    expect(empujar(caja, 'ArrowRight', LIENZO)).toMatchObject({ col: 3 });
    expect(empujar(caja, 'ArrowUp', LIENZO)).toMatchObject({ fila: 1 });
    expect(empujar({ col: 0, fila: 0, cols: 2, filas: 2 }, 'ArrowLeft', LIENZO)).toBeNull();
    expect(empujar(caja, 'Enter', LIENZO)).toBeNull();
  });

  test('los tiradores tiran de su lado y el mango de giro no necesita medir el DOM', () => {
    const se = moverGesto(
      iniciar({ ...base, tipo: 'tirar', tirador: 'se', x: 0, y: 0 }),
      2 * LIENZO.celdaPx,
      2 * LIENZO.celdaPx,
      LIENZO,
    );
    expect(soltar(se)).toEqual(
      accion('redimensionar', { pagina: 'p1', capa: 'f1', col: 2, fila: 2, cols: 6, filas: 6 }),
    );
    const nw = moverGesto(iniciar({ ...base, tipo: 'tirar', tirador: 'nw', x: 0, y: 0 }), -2 * 44, -2 * 44, LIENZO);
    expect(nw.caja).toEqual({ col: 0, fila: 0, cols: 6, filas: 6 });

    // El giro: el puntero baja SOBRE el mango, así que el origen del lienzo se
    // deduce restando. Llevarlo a la derecha del centro es un cuarto de vuelta.
    const mango = mangoDeGiro(caja, LIENZO);
    const g = iniciar({ ...base, tipo: 'girar', x: 1000 + mango.x, y: 700 + mango.y });
    const centro = { x: 1000 + (2 * caja.col + caja.cols) * 22, y: 700 + (2 * caja.fila + caja.filas) * 22 };
    expect(moverGesto(g, centro.x + 200, centro.y, LIENZO).giro).toBe(90);
    expect(moverGesto(g, centro.x, centro.y + 200, LIENZO).giro).toBe(180);
    expect(soltar(moverGesto(g, centro.x, centro.y - 200, LIENZO))).toBeNull(); // volvió a 0
  });

});

/* ═══════════════════════════════════════════════════════════════════════════
 * 5 · LAS PREGUNTAS QUE HACE UNA CLASE
 * ═════════════════════════════════════════════════════════════════════════ */

describe('las consultas', () => {
  test('centrar es exacto, y cuando la paridad no cuadra ajusta el ancho y lo dice', () => {
    const { doc } = jugar([
      nuevoTexto('par', { col: 0, fila: 0, cols: 6, filas: 2 }, 'Feria'),
      nuevoTexto('impar', { col: 0, fila: 4, cols: 5, filas: 2 }, 'Ciencias'),
      accion('centrar', { pagina: 'p1', capa: 'par', eje: 'h' }),
      accion('centrar', { pagina: 'p1', capa: 'impar', eje: 'h' }),
    ]);
    expect(capaDe(doc, 'p1', 'par')!.caja).toMatchObject({ col: 3, cols: 6 });
    expect(estaCentradaH(doc, 'p1', 'par')).toBe(true);
    // La impar creció a 6 para poder centrarse de verdad, en vez de quedar «casi».
    expect(capaDe(doc, 'p1', 'impar')!.caja).toMatchObject({ col: 3, cols: 6 });
    expect(estaCentradaH(doc, 'p1', 'impar')).toBe(true);
    // Una casilla de diferencia NO es estar centrado.
    const movida = ejecutar(doc, accion('mover', { pagina: 'p1', capa: 'par', col: 4, fila: 0 })).doc;
    expect(estaCentradaH(movida, 'p1', 'par')).toBe(false);
  });

  test('alinear no tiene tolerancia: o el entero es el mismo o no lo es', () => {
    const { doc } = jugar([
      nuevaForma('a', { col: 2, fila: 0, cols: 3, filas: 2 }),
      nuevaForma('b', { col: 3, fila: 4, cols: 3, filas: 2 }),
      nuevaForma('c', { col: 7, fila: 8, cols: 4, filas: 2 }),
    ]);
    expect(alineadas(doc, 'p1', ['a', 'b'], 'izq')).toBe(false); // una casilla es una casilla
    const alineado = ejecutar(doc, accion('alinear', { pagina: 'p1', capas: ['a', 'b', 'c'], borde: 'izq' })).doc;
    expect(alineadas(alineado, 'p1', ['a', 'b', 'c'], 'izq')).toBe(true);
    // Por el centro: 'a' y 'b' llegan (ancho impar como el centro objetivo);
    // 'c' mide 4 y no cabe centrada en un centro impar, así que se queda donde
    // está y la consulta lo DICE, en vez de dejarla «casi» centrada.
    const centrado = ejecutar(doc, accion('alinear', { pagina: 'p1', capas: ['a', 'b', 'c'], borde: 'centro' })).doc;
    expect(alineadas(centrado, 'p1', ['a', 'b'], 'centro')).toBe(true);
    expect(alineadas(centrado, 'p1', ['a', 'c'], 'centro')).toBe(false);
    expect(alineadas(doc, 'p1', ['a'], 'izq')).toBe(false); // una sola no está alineada con nadie
  });

  test('los colores se cuentan como se ven, no como se llaman', () => {
    const doc: Documento = {
      ...docVacio(),
      paleta: { ...PALETA_BASE, cielo: { nombre: 'Cielo', css: PALETA_BASE.cian.css } },
    };
    let h = nuevaHistoria(doc);
    for (const a of [
      nuevaForma('a', { col: 0, fila: 0, cols: 3, filas: 3 }, 'cian'),
      nuevaForma('b', { col: 4, fila: 0, cols: 3, filas: 3 }, 'cielo'),
      nuevaForma('c', { col: 8, fila: 0, cols: 3, filas: 3 }, 'rojo'),
    ]) {
      h = hacer(h, a).historia;
    }
    // cian + cielo pintan lo mismo → un color. Con el fondo, tres en total.
    expect(cuantosColores(docDe(h), 'p1')).toBe(3);
    const oculta = ejecutar(docDe(h), accion('ocultar', { pagina: 'p1', capa: 'c', valor: true })).doc;
    expect(cuantosColores(oculta, 'p1')).toBe(2);
    // Y la paleta tramposa se denuncia en el veredicto, no en la nota del alumno.
    expect(verificar(docDe(h)).tintasIguales).toBe(1);
  });

  test('«¿hay algo tapando la cara?» y enviar atrás lo arregla', () => {
    const { doc } = jugar([
      accion('nueva-imagen', { pagina: 'p1', id: 'foto', recurso: 'retrato', col: 2, fila: 2, cols: 6, filas: 8 }),
      nuevaForma('pegatina', { col: 3, fila: 3, cols: 2, filas: 2 }),
      // Pegado justo al lado de la cara, tocándola por el borde: NO la tapa.
      nuevaForma('pie', { col: 6, fila: 3, cols: 3, filas: 1 }),
    ]);
    const cara = zonaDeCapa(doc, 'p1', 'foto', { col: 1, fila: 1, cols: 3, filas: 2 })!;
    expect(cara).toEqual({ col: 3, fila: 3, cols: 3, filas: 2 });
    expect(tapanLaZona(doc, 'p1', cara, 'foto')).toEqual(['pegatina']);
    const atras = ejecutar(doc, accion('orden', { pagina: 'p1', capa: 'pegatina', a: 'atras' })).doc;
    expect(tapanLaZona(atras, 'p1', cara, 'foto')).toEqual([]);
    // Y la zona viaja con la foto: moverla no invalida la pregunta.
    const movida = ejecutar(doc, accion('mover', { pagina: 'p1', capa: 'foto', col: 0, fila: 0 })).doc;
    expect(zonaDeCapa(movida, 'p1', 'foto', { col: 1, fila: 1, cols: 3, filas: 2 })).toMatchObject({ col: 1, fila: 1 });
  });

  test('deformar se detecta multiplicando en cruz, sin dividir nunca', () => {
    const { doc } = jugar([
      accion('nueva-imagen', { pagina: 'p1', id: 'foto', recurso: 'retrato', col: 0, fila: 0 }),
    ]);
    expect(capaDe(doc, 'p1', 'foto')!.caja).toMatchObject({ cols: 3, filas: 4 }); // proporción natural
    expect(estaDeformada(doc, 'p1', 'foto')).toBe(false);
    const doble = ejecutar(doc, accion('redimensionar', { pagina: 'p1', capa: 'foto', col: 0, fila: 0, cols: 6, filas: 8 })).doc;
    expect(estaDeformada(doble, 'p1', 'foto')).toBe(false); // 6×8 sigue siendo 3:4
    const estirada = ejecutar(doc, accion('redimensionar', { pagina: 'p1', capa: 'foto', col: 0, fila: 0, cols: 6, filas: 4 })).doc;
    expect(estaDeformada(estirada, 'p1', 'foto')).toBe(true);
    /* Y la que un épsilon dejaría pasar: 4×5 es 0,80 contra 0,75, cinco
     * centésimas. Deformada es deformada, y por eso se multiplica en cruz
     * (4·4 = 16 ≠ 15 = 5·3) en vez de comparar dos divisiones con holgura. */
    const casi = ejecutar(doc, accion('redimensionar', { pagina: 'p1', capa: 'foto', col: 0, fila: 0, cols: 4, filas: 5 })).doc;
    expect(estaDeformada(casi, 'p1', 'foto')).toBe(true);
    /* Recortar encoge el MARCO —3×4 pasa a 3×3— y no mueve la foto, así que la
     * caja entera sigue siendo 3:4 y la imagen no está deformada. La primera
     * versión guardaba el recorte sin encoger la caja y esta línea la cazó. */
    const recortada = ejecutar(doc, accion('recortar', { pagina: 'p1', capa: 'foto', abajo: 1 })).doc;
    expect(capaDe(recortada, 'p1', 'foto')!.caja).toMatchObject({ cols: 3, filas: 3 });
    expect(estaDeformada(recortada, 'p1', 'foto')).toBe(false);
    // Y repetir la misma acción no encoge dos veces: los argumentos son absolutos.
    const otraVez = ejecutar(recortada, accion('recortar', { pagina: 'p1', capa: 'foto', abajo: 1 })).doc;
    expect(capaDe(otraVez, 'p1', 'foto')!.caja).toMatchObject({ cols: 3, filas: 3 });
  });

  test('jerarquía, crédito de la foto y orden de lectura', () => {
    const { doc } = jugar([
      nuevoTexto('titulo', { col: 0, fila: 0, cols: 12, filas: 3 }, 'Feria de ciencias', 60),
      nuevoTexto('cuerpo', { col: 0, fila: 4, cols: 12, filas: 3 }, 'Viernes a las cinco', 20),
      accion('nueva-imagen', { pagina: 'p1', id: 'foto', recurso: 'retrato', col: 0, fila: 8 }),
    ]);
    expect(hayJerarquia(doc, 'p1')).toBe(true);
    expect(ordenDeLectura(doc, 'p1')).toEqual(['titulo', 'cuerpo', 'foto']);
    // El pie enorme abajo cumple «es el más grande» y NO es jerarquía.
    const alReves = ejecutar(doc, accion('tamano', { pagina: 'p1', capa: 'cuerpo', pt: 80 })).doc;
    expect(hayJerarquia(alReves, 'p1')).toBe(false);
    // La foto pide atribución y nadie la citó.
    expect(sinCreditar(doc).map((r) => r.id)).toEqual(['retrato']);
    const citada = ejecutar(doc, accion('escribir', { pagina: 'p1', capa: 'cuerpo', texto: 'Foto: Marina Rivas' })).doc;
    expect(sinCreditar(citada)).toEqual([]);
  });

  test('el prototipo: a qué pantallas se llega tocando cosas', () => {
    const { doc } = jugar([
      accion('nueva-pagina', { id: 'p2', nombre: 'Menú' }),
      accion('nueva-pagina', { id: 'p3', nombre: 'Perdida' }),
      nuevaForma('boton', { col: 1, fila: 1, cols: 4, filas: 2 }),
      accion('enlazar', { pagina: 'p1', capa: 'boton', aPagina: 'p2' }),
    ]);
    expect(alcanzables(doc)).toEqual(['p1', 'p2']);
    expect(huerfanas(doc)).toEqual(['p3']);
    expect(ejecutar(doc, accion('enlazar', { pagina: 'p1', capa: 'boton', aPagina: 'p9' })).rechazo).toMatch(
      /no hay ninguna pantalla/,
    );
    const sinEnlace = ejecutar(doc, accion('enlazar', { pagina: 'p1', capa: 'boton', aPagina: '' })).doc;
    expect(huerfanas(sinEnlace)).toEqual(['p2', 'p3']);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * 6 · EL VEREDICTO Y EL AGUANTE
 * ═════════════════════════════════════════════════════════════════════════ */

describe('el veredicto', () => {
  test('cuenta lo que puede salir mal y avisa de lo que no midió', () => {
    const { doc } = jugar([
      nuevoTexto('vacio', { col: 0, fila: 0, cols: 4, filas: 2 }, '   '),
      accion('nueva-imagen', { pagina: 'p1', id: 'foto', recurso: 'retrato', col: 0, fila: 4, cols: 6, filas: 4 }),
    ]);
    const v = verificar(doc);
    expect(v).toMatchObject({ fuera: 0, sueltas: 0, vacias: 1, perdidas: 0, deformadas: 1, rebosan: 0 });
    expect(v.detalle).toContain('sin pantalla: «rebosan» no se midió');
    expect(estaSano(v)).toBe(true);
    // Un documento escrito a mano con basura: se cuenta, no se revienta.
    const roto: Documento = {
      ...doc,
      paginas: [
        {
          ...doc.paginas[0],
          fondo: 'inventado',
          capas: [
            { ...(capaDe(doc, 'p1', 'vacio') as CapaTexto), caja: { col: 10.5, fila: 0, cols: 40, filas: 2 } },
            { ...(capaDe(doc, 'p1', 'foto') as CapaImagen), recurso: 'no-existe' },
          ],
        },
      ],
    };
    const w = verificar(roto);
    expect(w).toMatchObject({ fuera: 1, sueltas: 1, perdidas: 2 });
    expect(estaSano(w)).toBe(false);
  });

  test('cien capas y trescientas acciones: todo sigue entero y deshacer sigue siendo barato', () => {
    let h = nuevaHistoria(docVacio());
    const t0 = Date.now();
    for (let i = 0; i < 100; i += 1) {
      h = hacer(h, nuevaForma(`f${i}`, { col: i % 12, fila: i % 16, cols: 3, filas: 3 })).historia;
    }
    for (let i = 0; i < 200; i += 1) {
      h = hacer(h, accion('mover', { pagina: 'p1', capa: `f${i % 100}`, col: i % 9, fila: i % 13 })).historia;
    }
    for (let i = 0; i < 100; i += 1) h = deshacer(h);
    const ms = Date.now() - t0;
    expect(capasDe(docDe(h), 'p1')).toHaveLength(100);
    expect(verificar(docDe(h))).toMatchObject({ fuera: 0, sueltas: 0, perdidas: 0 });
    expect(historiaCuadra(h)).toBe(true);
    /* Medido: 2 ms. El listón está en 500 no porque se espere gastarlos, sino
     * porque a esa distancia sólo salta si alguien convierte el deshacer en una
     * reproducción de toda la sesión — que es el error que acecha aquí. */
    expect(ms).toBeLessThan(500);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
 * 7 · LA VENTANA
 * ═════════════════════════════════════════════════════════════════════════ */

function Banco({ herramientas = TODAS }: { herramientas?: readonly HerramientaId[] | 'todas' }) {
  const [doc] = useState<Documento>(() =>
    reproducir(docVacio(), [
      nuevoTexto('titulo', { col: 1, fila: 1, cols: 6, filas: 2 }, 'Feria de ciencias', 32),
      nuevaForma('marco', { col: 2, fila: 6, cols: 4, filas: 4 }),
    ]),
  );
  const d = useDiseno({ documento: doc, herramientas });
  /* Dentro de `VentanaBase`, que es quien pone el marco y la barra de título:
   * el editor no dibuja ninguna barra propia, y esta prueba lo comprueba. */
  return (
    <VentanaBase marca="Tecnia Diseño" subtitulo="Cartel de la feria">
      <VentanaDiseno
        documento={d.documento}
        pagina={d.pagina}
        seleccion={d.seleccion}
        herramientas={d.herramientas}
        herramienta={d.herramienta}
        gesto={d.gesto}
        pasos={d.pasos}
        rechazo={d.rechazo}
        onHerramienta={d.elegirHerramienta}
        onSeleccionar={(id, mas) => d.seleccionar(id ? [id] : [], mas)}
        onGestoInicio={d.iniciarGesto}
        onGestoMover={d.moverGesto}
        onGestoSoltar={d.soltarGesto}
        onAccion={d.hacer}
        nuevoId={d.nuevoId}
        onDeshacer={d.deshacer}
        onRehacer={d.rehacer}
        puedeDeshacer={d.puedeDeshacer}
        puedeRehacer={d.puedeRehacer}
        onIrA={d.irA}
      />
    </VentanaBase>
  );
}

const capaEn = (id: string) => document.querySelector(`[data-capa="${id}"]`) as HTMLElement;

/**
 * jsdom no implementa `PointerEvent`, así que `fireEvent.pointerDown(el, {clientX})`
 * construye un `Event` pelado y **pierde las coordenadas** por el camino. Se
 * crea el evento y se le ponen encima, que es lo que el navegador entrega.
 * Anotado aquí y no escondido: es una carencia del entorno de pruebas, no del
 * armazón, y quien lea esto sabrá por qué no se usa el atajo.
 */
function puntero(el: Element, tipo: 'pointerDown' | 'pointerMove' | 'pointerUp', x: number, y: number) {
  const ev = createEvent[tipo](el, { bubbles: true, cancelable: true });
  Object.assign(ev, { clientX: x, clientY: y, pointerId: 1 });
  fireEvent(el, ev);
}

describe('la ventana', () => {
  test('sólo se pinta lo que la actividad dio, y cada capa se puede leer', () => {
    render(<Banco herramientas={['seleccion', 'color', 'texto']} />);
    // La barra de título la pone `VentanaBase`, y sólo hay una.
    expect(document.querySelectorAll('.vtb-barra')).toHaveLength(1);
    expect(document.querySelector('.vtb-barra-marca')!.textContent).toBe('Tecnia Diseño');
    expect(document.querySelector('[data-herramienta="color"]')).not.toBeNull();
    expect(document.querySelector('[data-herramienta="cuentagotas"]')).toBeNull();
    expect(document.querySelector('[data-herramienta="borrar"]')).toBeNull();
    // Sin el mango de giro no hay giro posible desde la interfaz.
    puntero(capaEn('titulo'), 'pointerDown', 100, 100);
    puntero(capaEn('titulo'), 'pointerUp', 100, 100);
    expect(document.querySelector('[data-giro-mango]')).toBeNull();
    expect(capaEn('titulo').getAttribute('aria-label')).toBe('Texto 1');
    expect(capaEn('titulo').getAttribute('data-caja')).toBe('1,1,6,2');
  });

  test('un arrastre de verdad mueve por casillas, y el teclado hace lo mismo sin ratón', () => {
    render(<Banco />);
    const capa = capaEn('marco');
    puntero(capa, 'pointerDown', 400, 400);
    puntero(capa, 'pointerMove', 400 + 3 * LIENZO.celdaPx, 400 + 2 * LIENZO.celdaPx);
    // Mientras se arrastra ya se ve dónde va a caer: el fantasma es la caja.
    expect(capaEn('marco').getAttribute('data-caja')).toBe('5,8,4,4');
    puntero(capa, 'pointerUp', 400 + 3 * LIENZO.celdaPx, 400 + 2 * LIENZO.celdaPx);
    expect(capaEn('marco').getAttribute('data-caja')).toBe('5,8,4,4');
    // Un arrastre entero = un solo paso en el historial.
    expect(document.querySelectorAll('[data-paso]')).toHaveLength(1);
    fireEvent.click(screen.getByText(/Deshacer/));
    expect(capaEn('marco').getAttribute('data-caja')).toBe('2,6,4,4');
    // Y el clic que sólo selecciona no deja paso ninguno.
    puntero(capaEn('marco'), 'pointerDown', 10, 10);
    puntero(capaEn('marco'), 'pointerUp', 10, 10);
    expect(document.querySelectorAll('[data-paso]')).toHaveLength(0);
    // Teclado: una casilla por flecha, y Suprimir borra.
    fireEvent.keyDown(capaEn('marco'), { key: 'ArrowRight' });
    fireEvent.keyDown(capaEn('marco'), { key: 'ArrowDown' });
    expect(capaEn('marco').getAttribute('data-caja')).toBe('3,7,4,4');
    fireEvent.keyDown(capaEn('marco'), { key: 'Delete' });
    expect(capaEn('marco')).toBeNull();
    fireEvent.click(screen.getByText(/Deshacer/));
    expect(capaEn('marco')).not.toBeNull();
  });

  test('la barra de opciones cambia con la herramienta y crea sin tocar el ratón del lienzo', () => {
    render(<Banco />);
    fireEvent.click(document.querySelector('[data-herramienta="forma"]')!);
    fireEvent.click(document.querySelector('[data-figura="estrella"]')!);
    const estrella = document.querySelector('[data-tipo="forma"][data-caja="4,6,4,4"]');
    expect(estrella).not.toBeNull(); // nace centrada en el lienzo, no donde el ratón
    fireEvent.click(document.querySelector('[data-herramienta="color"]')!);
    fireEvent.click(document.querySelector('[data-tinta="magenta"]')!);
    expect(screen.getByTestId('dis-pasos').textContent).toMatch(/Magenta/);
  });

  test('el estado y la ventana no se contradicen tras deshacer', () => {
    const { result } = renderHook(() => useDiseno({ documento: docVacio(), herramientas: ['forma', 'seleccion'] }));
    act(() => {
      result.current.hacer(nuevaForma('f1', { col: 0, fila: 0, cols: 4, filas: 4 }));
    });
    act(() => {
      result.current.seleccionar(['f1']);
    });
    expect(result.current.seleccion).toEqual(['f1']);
    act(() => {
      result.current.deshacer();
    });
    // La capa dejó de existir: la selección se limpia sola, sin nadie vigilando.
    expect(result.current.seleccion).toEqual([]);
    act(() => {
      const ok = result.current.hacer(accion('borrar', { pagina: 'p1', capa: 'f1' }));
      expect(ok).toBe(false);
    });
    expect(result.current.rechazo).toMatch(/no está disponible|ya no está/);
  });
});
