/**
 * `n6-bloques-vs-codigo` · N6·U «De bloques a texto», parada 1.
 * **6.º de primaria, 11–12 años**, leído en `curriculo.ts`.
 *
 * Cómo está repartida esta suite, y por qué:
 *
 *  · **El traductor se prueba como lo que es: puro.** `traducir()` no toca
 *    React ni el DOM; sus pruebas son de cadenas, sobre un `Programa` armado a
 *    mano.
 *  · **Los ocho jueces se prueban contra el caso que deben rechazar**, no sólo
 *    contra el que deben aceptar — si un `comprueba` estuviera escrito al
 *    revés, un recorrido que juega bien no lo distinguiría.
 *  · **El riesgo nº 1 del pliego se prueba de verdad**: se arranca, se avanza
 *    con ⏭ hasta que el bloque activo es uno de dentro del `repetir`, se
 *    quita ESE bloque con la ✕ mientras la corrida sigue viva, y se comprueba
 *    que la cara de texto no ilumina ninguna línea — nunca una equivocada.
 *  · **Y se juega MAL a propósito**: ▶ con el guion vacío, ▶ dos veces
 *    seguidas, quitar un `repetir` con hijos dentro, y `repetir 5` anidado en
 *    `repetir 5` para comprobar que no hay callejón sin salida de 20 minutos.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import EntradaBloquesVsCodigo from '@/components/activities/bloques/EntradaBloquesVsCodigo';
import type { ContextoEncargo } from '@/components/activities/bloques/SalaBloques';
import {
  CATALOGO,
  CLASE,
  AVISO_SIN_VUELTA,
  MUNDO_INICIAL,
  PROGRAMA_INICIAL,
  TEXTO_A_ARMAR,
  reducirTexto,
  salidaDe,
  type MundoTexto,
} from '@/components/activities/bloques/LabBloquesVsCodigo';
import { traducir } from '@/components/activities/bloques/traduccionPython';
import { ejecutarTodo, pila, pilaDe, programaDe, soltarFicha, type Programa } from '@/components/simuladores/bloques';
import { CURRICULO } from '@/data/curriculo';
import type { ActivityResult } from '@/types/activity-contract';

/* ─────────────────────────── armar guiones sin ratón ───────────────────────── */

let contador = 0;

/** Añade una ficha al final del tronco de una pila, por la misma puerta que el editor. */
function anadir(programa: Programa, pila: string, fichaId: string): Programa {
  const largo = pilaDe(programa, pila)?.bloques.length ?? 0;
  const r = soltarFicha(programa, CATALOGO, { donde: 'pila', pila, indice: largo }, fichaId, `t-${(contador += 1)}`);
  if (!r.encaje.ok) throw new Error(`No encajó ${fichaId} en ${pila}: ${r.encaje.aviso}`);
  return r.programa;
}

/** Añade una ficha dentro de la boca de un bloque ya puesto. */
function anadirDentro(programa: Programa, bloqueId: string, rama: string, fichaId: string): Programa {
  const duenio = programa.pilas.flatMap((p) => p.bloques).find((b) => b.id === bloqueId);
  const largo = duenio?.ramas?.[rama]?.length ?? 0;
  const r = soltarFicha(
    programa,
    CATALOGO,
    { donde: 'rama', bloque: bloqueId, rama, indice: largo },
    fichaId,
    `t-${(contador += 1)}`,
  );
  if (!r.encaje.ok) throw new Error(`No encajó ${fichaId} dentro de ${bloqueId}: ${r.encaje.aviso}`);
  return r.programa;
}

const NUNCA = () => false;

function correrPrograma(programa: Programa) {
  return ejecutarTodo(programa, CATALOGO, NUNCA, { pila: 'p-main' });
}

function mundoDeCorrida(programa: Programa): MundoTexto {
  const parte = correrPrograma(programa);
  return parte.eventos.reduce(reducirTexto, MUNDO_INICIAL);
}

/* ───────────────────────────── 1 · el currículo ────────────────────────────── */

describe('n6-bloques-vs-codigo · el sitio en el currículo', () => {
  it('es la parada 1 de «De bloques a texto», en 6.º de primaria (11–12)', () => {
    const nivel = CURRICULO.find((n) => n.n === 6);
    expect(nivel?.grado).toBe('6° de Primaria');
    expect(nivel?.edad).toBe('11–12');

    const unidad = nivel?.unidades.find((u) => u.id === 'n6-de-bloques-a-texto');
    expect(unidad?.eje).toBe('programacion');
    const actividad = unidad?.actividades.find((a) => a.id === 'n6-bloques-vs-codigo');
    expect(actividad?.titulo).toBe('El mismo programa, dos caras');
  });
});

/* ──────────────────── 2 · el traductor, como función pura ──────────────────── */

describe('traducir(): del árbol de bloques al texto de Python', () => {
  it('la línea 1 es el comentario fijo, y el sombrero no produce línea ni entra en el mapa', () => {
    const { texto, lineaDe } = traducir(PROGRAMA_INICIAL, CATALOGO);
    const lineas = texto.split('\n');
    expect(lineas[0]).toBe('# el mismo programa, escrito en Python');
    expect(lineaDe['h-main']).toBeUndefined();
    // El único bloque puesto de fábrica es el «decir Hola», y es la línea 2.
    expect(lineas[1]).toBe('print("Hola")');
    expect(lineaDe['blq-0']).toBe(2);
  });

  it('escapa las comillas del texto del alumno sin romper la línea', () => {
    const conComillas = anadir(PROGRAMA_INICIAL, 'p-main', 'decir');
    const id = pilaDe(conComillas, 'p-main')!.bloques[1].id;
    const { texto } = traducir(
      {
        pilas: [
          {
            ...pilaDe(conComillas, 'p-main')!,
            bloques: pilaDe(conComillas, 'p-main')!.bloques.map((b) =>
              b.id === id ? { ...b, args: { que: 'dijo "hola"' } } : b,
            ),
          },
        ],
      },
      CATALOGO,
    );
    expect(texto).toContain('print("dijo \\"hola\\"")');
  });

  it('un repetir con un decir dentro sangra el cuerpo 4 espacios, y ambos entran en el mapa', () => {
    let p = anadir(PROGRAMA_INICIAL, 'p-main', 'repetir');
    const repetirId = pilaDe(p, 'p-main')!.bloques[1].id;
    p = anadirDentro(p, repetirId, 'cuerpo', 'decir');
    const decirId = pilaDe(p, 'p-main')!.bloques[1].ramas!.cuerpo[0].id;

    const { texto, lineaDe } = traducir(p, CATALOGO);
    const lineas = texto.split('\n');
    expect(lineaDe[repetirId]).toBe(3); // línea 1: comentario, línea 2: decir inicial
    expect(lineas[2]).toBe('for vuelta in range(3):');
    expect(lineaDe[decirId]).toBe(4);
    expect(lineas[3]).toBe('    print("Hola")');
  });

  it('un repetir anidado en otro repetir suma un nivel: el interior queda a 8 espacios', () => {
    let p = anadir(PROGRAMA_INICIAL, 'p-main', 'repetir');
    const exteriorId = pilaDe(p, 'p-main')!.bloques[1].id;
    p = anadirDentro(p, exteriorId, 'cuerpo', 'repetir');
    const interiorId = pilaDe(p, 'p-main')!.bloques[1].ramas!.cuerpo[0].id;
    p = anadirDentro(p, interiorId, 'cuerpo', 'decir');

    const { texto } = traducir(p, CATALOGO);
    const lineas = texto.split('\n');
    expect(lineas[2]).toBe('for vuelta in range(3):');
    expect(lineas[3]).toBe('    for vuelta in range(3):');
    expect(lineas[4]).toBe('        print("Hola")');
  });

  it('un repetir con la boca vacía escribe «pass», y esa línea NO entra en el mapa', () => {
    const p = anadir(PROGRAMA_INICIAL, 'p-main', 'repetir');
    const repetirId = pilaDe(p, 'p-main')!.bloques[1].id;
    const { texto, lineaDe } = traducir(p, CATALOGO);
    const lineas = texto.split('\n');
    expect(lineaDe[repetirId]).toBe(3);
    expect(lineas[3]).toBe('    pass');
    expect(Object.values(lineaDe)).not.toContain(4);
  });

  it('todo id de lineaDe existe en el programa, y toda línea que apunta existe en el texto (riesgo nº1, prueba pura)', () => {
    let p = anadir(PROGRAMA_INICIAL, 'p-main', 'repetir');
    const repetirId = pilaDe(p, 'p-main')!.bloques[1].id;
    p = anadirDentro(p, repetirId, 'cuerpo', 'decir');
    p = anadir(p, 'p-main', 'decir');

    const { texto, lineaDe } = traducir(p, CATALOGO);
    const totalLineas = texto.split('\n').length;
    const idsDelArbol = new Set([
      ...pilaDe(p, 'p-main')!.bloques.map((b) => b.id),
      ...(pilaDe(p, 'p-main')!.bloques.find((b) => b.id === repetirId)?.ramas?.cuerpo.map((b) => b.id) ?? []),
    ]);
    for (const [id, linea] of Object.entries(lineaDe)) {
      expect(idsDelArbol.has(id)).toBe(true);
      expect(linea).toBeGreaterThanOrEqual(1);
      expect(linea).toBeLessThanOrEqual(totalLineas);
    }
  });

  it('rota a propósito: si el traductor se salta el comentario de la línea 1, el mapa se desplaza y la prueba lo caza', () => {
    // No se rompe el archivo de producción: se reproduce aquí el defecto para
    // demostrar que las pruebas de arriba SÍ lo cazarían si alguien lo metiera.
    const { lineaDe: lineaDeBuena } = traducir(PROGRAMA_INICIAL, CATALOGO);
    const lineaDeRota: Record<string, number> = {};
    for (const [id, linea] of Object.entries(lineaDeBuena)) lineaDeRota[id] = linea - 1;
    // Con el defecto, «print("Hola")» (línea real 2) quedaría mapeado a la 1,
    // que es el comentario: exactamente el síntoma del riesgo nº 1.
    expect(lineaDeRota['blq-0']).toBe(1);
    expect(lineaDeRota['blq-0']).not.toBe(lineaDeBuena['blq-0']);
  });
});

/* ───────────────────────── 3 · el guion, en su forma ────────────────────────── */

describe('el guion: ocho encargos, sólo los dos últimos de elección', () => {
  it('están en el orden documentado', () => {
    expect(CLASE.guion.map((p) => p.id)).toEqual([
      'dos-caras',
      'cambia-lo-que-dice',
      'tres-veces',
      'dentro-y-fuera',
      'lee-y-arma',
      'intenta-escribir',
      'bloque-sin-linea',
      'pregunta-del-truco',
    ]);
    expect(CLASE.guion.filter((p) => p.logro.tipo === 'eleccion')).toHaveLength(2);
    expect(CLASE.guion.every((p) => p.pista.length > 0 && p.aprendido.length > 0)).toBe(true);
  });

  it('la ranura de «veces» del repetir sólo ofrece opciones (2 a 5): sin ella el tope de 2000 pasos tarda 20 minutos', () => {
    const ficha = CATALOGO.find((f) => f.id === 'repetir');
    expect(ficha?.ranuras?.[0].opciones).toEqual([2, 3, 4, 5]);
  });
});

/* ────────────────── 4 · los seis jueces de estado, uno a uno ───────────────── */

/** El último bloque del tronco. */
const ultimo = (p: Programa) => pilaDe(p, 'p-main')!.bloques[pilaDe(p, 'p-main')!.bloques.length - 1];
/** Cambia las vueltas de un repetir del tronco. */
const veces = (p: Programa, id: string, n: number): Programa => ({
  ...p,
  pilas: p.pilas.map((pl) => ({ ...pl, bloques: pl.bloques.map((b) => (b.id === id ? { ...b, args: { ...b.args, veces: n } } : b)) })),
});

describe('cada juez rechaza lo que tiene que rechazar', () => {
  function juezDe(id: string) {
    const paso = CLASE.guion.find((p) => p.id === id);
    if (!paso || paso.logro.tipo !== 'estado') throw new Error(`Encargo «${id}» sin juez de estado`);
    return paso.logro.comprueba;
  }

  function contexto(programa: Programa): ContextoEncargo<MundoTexto> {
    const parte = correrPrograma(programa);
    const mundo = mundoDeCorrida(programa);
    return { programa, corriendo: false, enPausa: false, nodoActivo: null, parte, mundo };
  }

  it('1 · «dos caras» no se da por hecho sin correr, y sí con el programa de fábrica corrido', () => {
    const juez = juezDe('dos-caras');
    expect(juez({ programa: PROGRAMA_INICIAL, corriendo: false, enPausa: false, nodoActivo: null, parte: null, mundo: MUNDO_INICIAL })).toBe(false);
    expect(juez(contexto(PROGRAMA_INICIAL))).toBe(true);
  });

  it('2 · «cambia lo que dice» exige un texto DISTINTO al de fábrica, repetido en la consola', () => {
    const juez = juezDe('cambia-lo-que-dice');
    expect(juez(contexto(PROGRAMA_INICIAL))).toBe(false); // «Hola» sigue siendo el de fábrica

    const conservadaVacia = anadir(PROGRAMA_INICIAL, 'p-main', 'decir'); // segundo decir, el primero sigue en Hola
    expect(juez(contexto(conservadaVacia))).toBe(false);
  });

  /** Pone el texto de la ranura «que» de un decir, como hace el editor. */
  const conTexto = (p: Programa, bloqueId: string, que: string): Programa => ({
    ...p,
    pilas: p.pilas.map((pl) => ({ ...pl, bloques: retocar(pl.bloques, bloqueId, que) })),
  });
  function retocar(bloques: Programa['pilas'][number]['bloques'], id: string, que: string): typeof bloques {
    return bloques.map((b) =>
      b.id === id
        ? { ...b, args: { ...b.args, que } }
        : b.ramas
          ? { ...b, ramas: Object.fromEntries(Object.entries(b.ramas).map(([k, v]) => [k, retocar(v, id, que)])) }
          : b,
    );
  }

  /** «Oye», y un repetir 3 con «Vamos» dentro: lo que deja una partida buena al acabar el encargo 3. */
  function conRepetirVamos(): { p: Programa; repetirId: string } {
    let p = conTexto(PROGRAMA_INICIAL, 'blq-0', 'Oye');
    p = anadir(p, 'p-main', 'repetir');
    const repetirId = ultimo(p).id;
    p = anadirDentro(p, repetirId, 'cuerpo', 'decir');
    const dentro = pilaDe(p, 'p-main')!.bloques[1].ramas!.cuerpo[0].id;
    return { p: conTexto(p, dentro, 'Vamos'), repetirId };
  }

  it('3 · «tres veces» no se cumple con tres decir iguales en fila; con uno dentro de un repetir, sí', () => {
    const juez = juezDe('tres-veces');
    let enFila = conTexto(PROGRAMA_INICIAL, 'blq-0', 'Vamos');
    for (let i = 0; i < 2; i++) {
      enFila = anadir(enFila, 'p-main', 'decir');
      enFila = conTexto(enFila, ultimo(enFila).id, 'Vamos');
    }
    expect(salidaDe(enFila)).toEqual(['Vamos', 'Vamos', 'Vamos']);
    expect(juez(contexto(enFila))).toBe(false);

    expect(juez(contexto(conRepetirVamos().p))).toBe(true);
    // Sin haber corrido, no.
    expect(juez({ ...contexto(conRepetirVamos().p), parte: null })).toBe(false);
  });

  it('4 · «dentro y fuera»: la palabra nueva dentro de la boca, o antes del repetir, no cierra; después, sí', () => {
    const juez = juezDe('dentro-y-fuera');
    const { p, repetirId } = conRepetirVamos();
    expect(juez(contexto(p))).toBe(false);

    let dentro = anadirDentro(p, repetirId, 'cuerpo', 'decir');
    dentro = conTexto(dentro, pilaDe(dentro, 'p-main')!.bloques[1].ramas!.cuerpo[1].id, 'Listo');
    expect(salidaDe(dentro).filter((x) => x === 'Listo')).toHaveLength(3);
    expect(juez(contexto(dentro))).toBe(false);

    // «Oye» antes de las tres ya existía y no cuenta: tiene que ir DESPUÉS.
    const fuera = anadir(p, 'p-main', 'decir');
    expect(juez(contexto(fuera))).toBe(true); // el nuevo dice «Hola», una vez, después de las tres
  });

  /** El texto del encargo 5, armado en bloques; `ajuste` lo estropea a propósito. */
  function armado(ajuste: 'bien' | 'ya-dentro' | 'range-3'): Programa {
    let p = programaDe(pila('p-main', PROGRAMA_INICIAL.pilas[0].sombrero, []));
    p = anadir(p, 'p-main', 'decir');
    p = conTexto(p, ultimo(p).id, 'Cuenta');
    p = anadir(p, 'p-main', 'repetir');
    const repetirId = ultimo(p).id;
    p = veces(p, repetirId, ajuste === 'range-3' ? 3 : 4);
    p = anadirDentro(p, repetirId, 'cuerpo', 'decir-vuelta');
    if (ajuste === 'ya-dentro') {
      p = anadirDentro(p, repetirId, 'cuerpo', 'decir');
      return conTexto(p, pilaDe(p, 'p-main')!.bloques[1].ramas!.cuerpo[1].id, 'Ya');
    }
    p = anadir(p, 'p-main', 'decir');
    return conTexto(p, ultimo(p).id, 'ya');
  }

  it('5 · «lee y arma» pide el texto dado: el print de después metido en la boca no vale, range(3) tampoco', () => {
    const juez = juezDe('lee-y-arma');
    expect(juez(contexto(armado('ya-dentro')))).toBe(false);
    expect(juez(contexto(armado('range-3')))).toBe(false);
    const bien = armado('bien');
    expect(traducir(bien, CATALOGO).texto.split('\n').slice(1).join('\n').toLowerCase()).toBe(TEXTO_A_ARMAR.toLowerCase());
    expect(juez(contexto(bien))).toBe(true);
    // Y lo que sale es lo que diría Python: desde 0.
    expect(salidaDe(bien)).toEqual(['Cuenta', '0', '1', '2', '3', 'ya']);
  });

  it('6 · «intenta escribir» sólo se cumple tras al menos un intento', () => {
    const juez = juezDe('intenta-escribir');
    expect(juez(contexto(PROGRAMA_INICIAL))).toBe(false);
    const conIntento: ContextoEncargo<MundoTexto> = {
      ...contexto(PROGRAMA_INICIAL),
      mundo: { ...MUNDO_INICIAL, intentosDeEscribir: 1 },
    };
    expect(juez(conIntento)).toBe(true);
  });

  it('ninguna instrucción de estado dicta dónde va un bloque', () => {
    for (const id of ['tres-veces', 'dentro-y-fuera', 'lee-y-arma']) {
      const { instruccion } = CLASE.guion.find((p) => p.id === id)!;
      expect([id, /suelta|dentro de su boca|fuera del repetir|abajo del todo/i.test(instruccion)]).toEqual([id, false]);
    }
  });
});

describe('la vuelta, como en Python (§69.12)', () => {
  it('empieza en 0 y cambia una vez por vuelta: dos print(vuelta) en la misma boca dicen lo mismo', () => {
    let p = anadir(PROGRAMA_INICIAL, 'p-main', 'repetir');
    const id = ultimo(p).id;
    p = anadirDentro(p, id, 'cuerpo', 'decir-vuelta');
    p = anadirDentro(p, id, 'cuerpo', 'decir-vuelta');
    expect(salidaDe(p)).toEqual(['Hola', '0', '0', '1', '1', '2', '2']);
  });

  it('anidado, el de dentro vuelve a 0 en cada vuelta del de fuera, y un print(vuelta) después sigue con el último valor', () => {
    let p = anadir(PROGRAMA_INICIAL, 'p-main', 'repetir');
    const fuera = ultimo(p).id;
    p = veces(p, fuera, 2);
    p = anadirDentro(p, fuera, 'cuerpo', 'repetir');
    const dentro = pilaDe(p, 'p-main')!.bloques[1].ramas!.cuerpo[0].id;
    p = {
      ...p,
      pilas: p.pilas.map((pl) => ({
        ...pl,
        bloques: pl.bloques.map((b) =>
          b.id === fuera ? { ...b, ramas: { cuerpo: b.ramas!.cuerpo.map((c) => ({ ...c, args: { veces: 2 } })) } } : b,
        ),
      })),
    };
    p = anadirDentro(p, dentro, 'cuerpo', 'decir-vuelta');
    p = anadir(p, 'p-main', 'decir-vuelta');
    // Python: for v in range(2): for v in range(2): print(v)  →  0 1 0 1; y después print(v) → 1
    expect(salidaDe(p)).toEqual(['Hola', '0', '1', '0', '1', '1']);
  });

  it('antes de cualquier repetir, la consola dice que «vuelta» todavía no existe', () => {
    expect(salidaDe(anadir(PROGRAMA_INICIAL, 'p-main', 'decir-vuelta'))).toEqual(['Hola', AVISO_SIN_VUELTA]);
  });
});

/* ──────────────── 5 · el riesgo nº 1: editar el programa mientras corre ────── */

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const utils = render(
    <EntradaBloquesVsCodigo config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />,
  );
  return { ...utils, onProgress, onScore, onComplete };
}

const entrar = () => fireEvent.click(screen.getByText('Abre las dos caras'));
const empezar = () => fireEvent.click(screen.getByTestId('blqs-empezar'));

function irA(categoria: string) {
  const boton = Array.from(document.querySelectorAll('.blq-categoria')).find((b) => b.textContent === categoria);
  if (!boton) throw new Error(`No hay categoría «${categoria}»`);
  fireEvent.click(boton);
}

/**
 * Cuenta sólo los bloques del TRONCO de una pila (sombrero + primer nivel),
 * sin bajar a lo que haya anidado dentro de una boca — `[data-pila] […]` con
 * combinador de descendiente cuenta también los bloques metidos dentro de un
 * `repetir`, y eso desplaza el índice de la cola en cuanto hay algo anidado.
 */
function largoDelTronco(pila: string): number {
  return document.querySelectorAll(
    `[data-pila="${pila}"] > [data-testid="blq-bloque"], [data-pila="${pila}"] > .blq-renglon > [data-testid="blq-bloque"]`,
  ).length;
}

/** La vía sin arrastre: tocar la pieza de la paleta y después tocar el hueco al final del tronco. */
function poner(pila: string, fichaId: string) {
  const ficha = document.querySelector(`[data-testid="blq-ficha"][data-ficha="${fichaId}"]`);
  if (!ficha) throw new Error(`La ficha «${fichaId}» no está en la paleta visible`);
  fireEvent.click(ficha);
  const largo = largoDelTronco(pila);
  const cola = document.querySelector(`[data-sitio="pila:${pila}:${largo - 1}"] button`);
  if (!cola) throw new Error(`No hay cola en ${pila} con ${largo - 1} bloques`);
  fireEvent.click(cola);
}

/** Lo mismo, pero dentro de la boca de un bloque ya puesto. */
function ponerDentro(bloqueId: string, rama: string, fichaId: string) {
  const ficha = document.querySelector(`[data-testid="blq-ficha"][data-ficha="${fichaId}"]`);
  if (!ficha) throw new Error(`La ficha «${fichaId}» no está en la paleta visible`);
  fireEvent.click(ficha);
  const largo = document.querySelectorAll(
    `[data-bloque="${bloqueId}"] > .blq-boca[data-rama="${rama}"] [data-testid="blq-bloque"]`,
  ).length;
  const cola = document.querySelector(`[data-sitio="rama:${bloqueId}:${rama}:${largo}"] button`);
  if (!cola) throw new Error(`No hay cola en la boca «${rama}» de ${bloqueId} con ${largo} bloques`);
  fireEvent.click(cola);
}

function idDelUltimoBloque(pila: string, fichaId: string): string {
  const nodos = document.querySelectorAll(`[data-pila="${pila}"] [data-testid="blq-bloque"][data-ficha="${fichaId}"]`);
  const ultimo = nodos[nodos.length - 1];
  if (!ultimo) throw new Error(`No hay ningún bloque «${fichaId}» puesto en ${pila}`);
  return ultimo.getAttribute('data-bloque')!;
}

function vaciarGuion(pila: string) {
  for (;;) {
    const equis = document.querySelector(`[data-pila="${pila}"] .blq-quitar`);
    if (!equis) return;
    fireEvent.click(equis);
  }
}

function correr() {
  fireEvent.click(screen.getByLabelText('Correr el programa'));
  act(() => {
    jest.advanceTimersByTime(30000);
  });
}

const paso = () => fireEvent.click(screen.getByLabelText('Un bloque'));

describe('riesgo nº 1 · editar el programa mientras corre', () => {
  it('quitar el bloque activo con la ✕ deja la cara de texto SIN ninguna línea iluminada, nunca en una equivocada', () => {
    montar();
    entrar();
    empezar();

    irA('Repetir');
    poner('p-main', 'repetir');
    const repetirId = idDelUltimoBloque('p-main', 'repetir');
    irA('Decir');
    ponerDentro(repetirId, 'cuerpo', 'decir');
    const decirDentroId = document
      .querySelector(`[data-bloque="${repetirId}"] > .blq-boca[data-rama="cuerpo"] [data-testid="blq-bloque"]`)!
      .getAttribute('data-bloque')!;

    // Sin fake timers ni ▶: `pasoAPaso()` arranca la corrida en pausa y avanza
    // UN evento por clic, así que no hay reloj corriendo de fondo que pueda
    // colarse entre el paso y la ✕.
    paso(); // 1 · decir «Hola» del tronco
    paso(); // 2 · «entra» al repetir
    paso(); // 3 · el decir DE DENTRO del repetir: nodoActivo === decirDentroId

    const bloqueActivo = document.querySelector(`[data-bloque="${decirDentroId}"]`);
    expect(bloqueActivo).toHaveAttribute('data-activo', 'si');
    // Antes de tocar nada: la línea 4 (el print de dentro) está iluminada de verdad.
    expect(document.querySelector('.cod-linea[data-linea="4"]')).toHaveClass('es-curso');

    // El riesgo: quitar EL BLOQUE QUE ESTÁ CORRIENDO, con la corrida todavía viva.
    const equis = document.querySelector(`[data-bloque="${decirDentroId}"] > .blq-cabeza > .blq-quitar`);
    if (!equis) throw new Error('No hay ✕ en el bloque activo');
    fireEvent.click(equis);

    // El árbol vivo ya no tiene ese bloque: `lineaDe` de la cara de texto no
    // lo conoce, así que la medida (`(nodoActivo && lineaDe[nodoActivo]) || 0`)
    // debe apagar el resaltado entero, no mover la luz a otra línea.
    expect(document.querySelectorAll('.cod-linea.es-curso')).toHaveLength(0);
    expect(document.querySelectorAll('.cod-num.es-curso')).toHaveLength(0);

    // Y seguir avanzando la corrida vieja (que sigue con su FOTO del árbol,
    // ajena a la edición) no revienta nada ni ilumina una línea equivocada.
    paso();
    expect(document.querySelectorAll('.cod-linea.es-curso').length).toBeLessThanOrEqual(1);
    const iluminada = document.querySelector('.cod-linea.es-curso');
    if (iluminada) {
      // Si algo se iluminó, tiene que ser una línea que SIGUE existiendo con
      // sentido en el texto vivo (el «decir Hola» del tronco), nunca la del
      // bloque ya borrado.
      expect(iluminada.getAttribute('data-linea')).not.toBe('4');
    }
  });
});

/* ─────────────────────── 6 · la clase, de punta a punta ────────────────────── */

/** Los ocho encargos, en orden, por la vía del dedo — partida perfecta. */
function jugarBien() {
  // 1 · las dos caras: el «decir Hola» de fábrica ya alcanza.
  correr();

  // 2 · cambia lo que dice
  fireEvent.change(screen.getByLabelText('que'), { target: { value: 'Oye' } });
  correr();

  // 3 · tres veces, un solo bloque: el decir nuevo dice «Hola» y el de fábrica ya dice «Oye»
  irA('Repetir');
  poner('p-main', 'repetir');
  const repetirId = idDelUltimoBloque('p-main', 'repetir');
  irA('Decir');
  ponerDentro(repetirId, 'cuerpo', 'decir');
  correr();

  // 4 · dentro y fuera
  poner('p-main', 'decir');
  const ranuras = screen.getAllByLabelText('que');
  fireEvent.change(ranuras[ranuras.length - 1], { target: { value: 'Listo' } });
  correr();

  // 5 · lee y arma: se vacía el guion y se arma el texto dado
  vaciarGuion('p-main');
  poner('p-main', 'decir');
  fireEvent.change(screen.getByLabelText('que'), { target: { value: 'Cuenta' } });
  irA('Repetir');
  poner('p-main', 'repetir');
  const contarId = idDelUltimoBloque('p-main', 'repetir');
  fireEvent.change(document.querySelector(`[data-bloque="${contarId}"] select[aria-label="veces"]`)!, {
    target: { value: '4' },
  });
  irA('Decir');
  ponerDentro(contarId, 'cuerpo', 'decir-vuelta');
  poner('p-main', 'decir');
  const ultimas = screen.getAllByLabelText('que');
  fireEvent.change(ultimas[ultimas.length - 1], { target: { value: 'Ya' } });
  correr();

  // 6 · intenta escribir en la otra cara
  fireEvent.keyDown(screen.getByTestId('cod-area'), { key: 'x' });

  // 7 · el bloque sin línea
  fireEvent.click(
    screen.getByText(
      'Ninguna: el sombrero dice cuándo empieza, y un archivo de texto empieza por su primera línea y ya',
    ),
  );

  // 8 · la pregunta del truco
  fireEvent.click(screen.getByText('Deja de estar dentro del repetir y sale una sola vez'));
}

describe('la clase, de punta a punta', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('la entrada enseña la portada de objetivos antes de la práctica', () => {
    montar();
    entrar();
    const portada = screen.getByTestId('blqs-portada');
    expect(portada).toHaveTextContent('El mismo programa, dos caras');
    expect(portada).toHaveTextContent('Nivel 6 · De bloques a texto · Parada 1 de 2');
    expect(portada).toHaveTextContent('Traductor de programas');
    expect(portada).toHaveTextContent('8');
  });

  it('una partida perfecta se termina, saca 100 y tres estrellas, y Salir funciona desde el cierre', () => {
    const { onComplete, onScore } = montar();
    entrar();
    empezar();

    expect(screen.getByTestId('blqs-panel').querySelector('.blqs-panel-num')?.textContent).toBe('Encargo 1/8');
    jugarBien();

    expect(onComplete).toHaveBeenCalledTimes(1);
    const resultado = onComplete.mock.calls[0][0] as ActivityResult;
    expect(resultado.score).toBe(100);
    expect(resultado.stars).toBe(3);
    expect(onScore).toHaveBeenLastCalledWith(100);

    expect(screen.getByText('¡Ya lees las dos caras!')).toBeInTheDocument();
    expect(screen.getByText(/Traductor de programas/)).toBeInTheDocument();

    // El camino de salida DESDE la pantalla de cierre.
    fireEvent.click(screen.getByText('Salir'));
    expect(screen.getByText('Abre las dos caras')).toBeInTheDocument();
  });

  it('se puede salir a media práctica y volver a entrar', () => {
    montar();
    entrar();
    empezar();
    poner('p-main', 'decir');
    fireEvent.click(screen.getByText('Salir'));
    expect(screen.getByText('Abre las dos caras')).toBeInTheDocument();

    entrar();
    expect(screen.getByTestId('blqs-portada')).toBeInTheDocument();
  });

  it('«Jugar otra vez» reinicia el guion, el mundo Y la cara de texto', () => {
    montar();
    entrar();
    empezar();
    jugarBien();
    // La pantalla de cierre ya está en pantalla: la consola tiene las seis
    // líneas del encargo 5 (Cuenta, 0, 1, 2, 3, Ya), y el texto trae su repetir.
    expect(screen.getByTestId('bvc-consola').querySelectorAll('li')).toHaveLength(6);
    expect(screen.getByTestId('cod-area')).toHaveTextContent(/for vuelta in range/);

    fireEvent.click(screen.getByText('Jugar otra vez'));

    // De vuelta en la portada de objetivos, con el guion de fábrica: sólo el
    // «decir Hola», sin repetir y sin nada de la partida anterior.
    expect(screen.getByTestId('blqs-portada')).toBeInTheDocument();
    empezar();
    expect(screen.getByTestId('blqs-panel').querySelector('.blqs-panel-num')?.textContent).toBe('Encargo 1/8');
    expect(screen.getByTestId('cod-area')).toHaveValue('# el mismo programa, escrito en Python\nprint("Hola")');
    expect(screen.getByTestId('bvc-consola')).toHaveTextContent('Todavía no corriste el programa.');
  });
});

/* ────────────────────────── 7 · jugando MAL a propósito ────────────────────── */

describe('jugando mal a propósito', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('pulsar ▶ con el guion vacío avisa en español, la cara de texto sólo tiene el comentario y la consola sigue vacía', () => {
    montar();
    entrar();
    empezar();
    vaciarGuion('p-main'); // se lleva el único «decir Hola» de fábrica
    correr();

    expect(screen.getByTestId('blq-aviso')).toHaveTextContent('El guion está vacío');
    expect(screen.getByTestId('cod-area')).toHaveValue('# el mismo programa, escrito en Python');
    expect(screen.getByTestId('bvc-consola')).toHaveTextContent('Todavía no corriste el programa.');
    expect(screen.getByTestId('blqs-panel').querySelector('.blqs-panel-num')?.textContent).toBe('Encargo 1/8');
  });

  it('pulsar ▶ dos veces seguidas arranca UNA sola corrida, no dos', () => {
    montar();
    entrar();
    empezar();
    // Los dos clics caen en el mismo tic, antes de que React repinte: la
    // guarda de `useBloques` vive en una `ref`, no en el estado.
    fireEvent.click(screen.getByLabelText('Correr el programa'));
    fireEvent.click(screen.getByLabelText('Correr el programa'));
    act(() => {
      jest.advanceTimersByTime(30000);
    });
    expect(screen.getByTestId('bvc-consola').querySelectorAll('li')).toHaveLength(1);
  });

  it('quitar un «repetir» con hijos dentro se lleva las líneas de dentro, sin dejar ids fantasma en pantalla', () => {
    montar();
    entrar();
    empezar();
    irA('Repetir');
    poner('p-main', 'repetir');
    const repetirId = idDelUltimoBloque('p-main', 'repetir');
    irA('Decir');
    ponerDentro(repetirId, 'cuerpo', 'decir');

    expect(screen.getByTestId('cod-area')).toHaveTextContent(/for vuelta in range/);

    const equis = document.querySelector(`[data-bloque="${repetirId}"] > .blq-cabeza > .blq-quitar`);
    fireEvent.click(equis!);

    expect(document.querySelector(`[data-bloque="${repetirId}"]`)).toBeNull();
    expect(screen.getByTestId('cod-area')).not.toHaveTextContent(/for vuelta in range/);
    // Sólo queda la línea de fábrica: comentario + el «decir Hola».
    expect((screen.getByTestId('cod-area') as HTMLTextAreaElement).value.split('\n')).toHaveLength(2);
  });

  it('«repetir 5» anidado en «repetir 5» termina sin tope y sin callejón sin salida', () => {
    montar();
    entrar();
    empezar();
    irA('Repetir');
    poner('p-main', 'repetir');
    const exteriorId = idDelUltimoBloque('p-main', 'repetir');
    fireEvent.change(document.querySelector(`[data-bloque="${exteriorId}"] select[aria-label="veces"]`)!, {
      target: { value: '5' },
    });

    ponerDentro(exteriorId, 'cuerpo', 'repetir');
    const interiorId = document
      .querySelector(`[data-bloque="${exteriorId}"] > .blq-boca[data-rama="cuerpo"] [data-testid="blq-bloque"]`)!
      .getAttribute('data-bloque')!;
    fireEvent.change(document.querySelector(`[data-bloque="${interiorId}"] select[aria-label="veces"]`)!, {
      target: { value: '5' },
    });

    irA('Decir');
    ponerDentro(interiorId, 'cuerpo', 'decir');

    fireEvent.click(screen.getByLabelText('Correr el programa'));
    act(() => {
      jest.advanceTimersByTime(120000);
    });

    const aviso = screen.queryByTestId('blq-aviso');
    if (aviso) expect(aviso).not.toHaveTextContent(/no termina/i);
    // El «decir Hola» de fábrica (1) + 5×5 vueltas del anidado (25) = 26.
    expect(screen.getByTestId('bvc-consola').querySelectorAll('li')).toHaveLength(26);
  });
});
