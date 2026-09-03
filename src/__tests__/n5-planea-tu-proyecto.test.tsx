import { createElement, StrictMode } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  accion,
  deshacer,
  documento as documentoDe,
  estaSano,
  hacer,
  historiaCuadra,
  nuevaHistoria,
  verificar,
  type Accion,
  type Diseno,
  type Documento,
  type Historia,
} from '@/components/simuladores/diseno';
import {
  costeDelPlan,
  costeMaximo,
  DOC_INICIAL,
  enElPlan,
  enLaCaja,
  GUION,
  imprescindiblesEnPlan,
  llegoAPedirlaGrande,
  PAGINA,
  PIEZAS,
  PRESUPUESTO,
  piezaPorId,
  problemaDeOrden,
  SLOTS_CAJA,
  SLOTS_PLAN,
  TOTAL_IMPRESCINDIBLES,
  type Pieza,
  type Slot,
} from '@/components/activities/diseno/LabPlaneaTuProyecto';
import LabPlaneaTuProyecto from '@/components/activities/diseno/LabPlaneaTuProyecto';
import EntradaPlaneaTuProyecto from '@/components/activities/diseno/EntradaPlaneaTuProyecto';

/**
 * `n5-planea-tu-proyecto` · N5·U4 parada 3 (CIERRE de la unidad).
 *
 * El grueso corre **sin DOM**: el guion se reproduce como una lista de `Accion`
 * sobre el documento inicial —igual que hace el armazón— y se comprueba que
 * cada encargo se cumple exactamente cuando debe, **que no se cumple antes** y
 * que **ningún encargo posterior deshace un predicado anterior**. Nada de
 * coordenadas de puntero, nada de `getBoundingClientRect`: las dos trampas de
 * jsdom que dejan una prueba verde y hueca.
 *
 * Al final hay un recorrido de punta a punta que **sí** monta la clase, la juega
 * entera pulsando los botones del panel y llega a la pantalla de cierre. Es la
 * lección más cara del proyecto: el motor sólo está probado hasta donde llegan
 * las clases que se han jugado.
 */

function P(id: string): Pieza {
  const p = piezaPorId(id);
  if (!p) throw new Error(`no existe la pieza «${id}»`);
  return p;
}

const aPlan = (id: string, slot: number): Accion => mover(id, SLOTS_PLAN[slot]);
const aCaja = (id: string, slot: number): Accion => mover(id, SLOTS_CAJA[slot]);

function mover(id: string, s: Slot): Accion {
  return accion('mover', { pagina: PAGINA, capa: P(id).capa, col: s.col, fila: s.fila });
}

function correr(base: Documento, acciones: readonly Accion[]): Historia {
  let h = nuevaHistoria(base);
  for (const acc of acciones) {
    const r = hacer(h, acc, 'todas');
    if (r.rechazo) throw new Error(`rechazada «${acc.comando}»: ${r.rechazo}`);
    h = r.historia;
  }
  return h;
}

function comoDiseno(h: Historia): Diseno {
  return { documento: documentoDe(h), historia: h, pagina: PAGINA, seleccion: [] } as unknown as Diseno;
}

const doc = (h: Historia): Documento => documentoDe(h);

/* ── 1 · el tablero de partida y las cifras que lo sostienen ─────────────── */

describe('el tablero del proyecto, antes de tocar nada', () => {
  it('las diez piezas están en la caja y el plan está vacío', () => {
    expect(enLaCaja(DOC_INICIAL)).toHaveLength(PIEZAS.length);
    expect(enElPlan(DOC_INICIAL)).toHaveLength(0);
    expect(costeDelPlan(DOC_INICIAL)).toBe(0);
  });

  it('terminar sin hacer nada no cumple ni un encargo', () => {
    const d = comoDiseno(nuevaHistoria(DOC_INICIAL));
    expect(GUION.map((p) => p.comprueba(d))).toEqual(GUION.map(() => false));
  });

  it('las cuatro imprescindibles caben y dejan sitio para un extra', () => {
    const base = PIEZAS.filter((p) => p.imprescindible);
    expect(base).toHaveLength(TOTAL_IMPRESCINDIBLES);
    const coste = base.reduce((n, p) => n + p.semanas, 0);
    expect(coste).toBeLessThan(PRESUPUESTO);
    const masBarato = Math.min(...PIEZAS.filter((p) => !p.imprescindible).map((p) => p.semanas));
    expect(coste + masBarato).toBeLessThanOrEqual(PRESUPUESTO);
  });

  it('el encargo 2 pone el contador en rojo SIEMPRE, no según la suerte', () => {
    /* Las tres cosas que se piden en el encargo 2 son las cuatro imprescindibles
     * y tres extras. Aunque el alumno elija los tres extras MÁS BARATOS, la
     * suma se pasa del presupuesto: el descubrimiento está garantizado. */
    const base = PIEZAS.filter((p) => p.imprescindible).reduce((n, p) => n + p.semanas, 0);
    const tresMasBaratos = PIEZAS.filter((p) => !p.imprescindible)
      .map((p) => p.semanas)
      .sort((a, b) => a - b)
      .slice(0, 3)
      .reduce((n, s) => n + s, 0);
    expect(base + tresMasBaratos).toBeGreaterThan(PRESUPUESTO);
  });

  it('cada dependencia del catálogo existe y no hay pieza que se necesite a sí misma', () => {
    for (const p of PIEZAS) {
      if (!p.necesita) continue;
      expect(p.necesita).not.toBe(p.id);
      expect(PIEZAS.some((otra) => otra.id === p.necesita)).toBe(true);
    }
  });

  it('todo extra que quepa junto a las cuatro imprescindibles depende sólo de ellas', () => {
    /* Si no, el encargo 4 podría quedar sin solución: una pieza que necesita a
     * otra que el presupuesto no deja meter. */
    const sobra = PRESUPUESTO - PIEZAS.filter((p) => p.imprescindible).reduce((n, p) => n + p.semanas, 0);
    const posibles = PIEZAS.filter((p) => !p.imprescindible && p.semanas <= sobra);
    expect(posibles.length).toBeGreaterThan(0);
    for (const p of posibles) {
      const antes = PIEZAS.find((o) => o.id === p.necesita);
      expect(antes?.imprescindible).toBe(true);
    }
  });
});

/* ── 2 · el recorrido bueno, paso por paso ──────────────────────────────── */

/**
 * El alumno sube las piezas EN EL ORDEN EN QUE LAS ENCUENTRA en la caja
 * (marcador, personaje, meta, nivel), que es lo que hace todo el mundo. Ese
 * plan es imposible, y el encargo 4 tiene que arreglarlo de verdad.
 */
const RECORRIDO: Accion[] = [
  aPlan('marcador', 0), // 1
  aPlan('personaje', 1), // 2
  aPlan('meta', 2), // 3
  aPlan('nivel', 3), // 4 ← encargo 1
  aPlan('nivel2', 4), // 5
  aPlan('musica', 5), // 6
  aPlan('tienda', 6), // 7 ← encargo 2 (coste 10 de 6)
  aCaja('musica', 3), // 8
  aCaja('tienda', 8), // 9 ← encargo 3 (coste 6)
  aPlan('marcador', 7), // 10
  aPlan('meta', 8), // 11 ← encargo 4
  accion('nueva-pagina', { id: 'p1', nombre: 'Pantalla 2' }), // 12 ← encargo 5
  accion('nueva-forma', { pagina: 'p1', id: 'f1', figura: 'rect', col: 4, fila: 4, cols: 8, filas: 8 }), // 13
  accion('nuevo-texto', { pagina: 'p1', id: 't1', texto: 'Aquí empieza el personaje', col: 2, fila: 14 }), // 14 ← encargo 6
];

const PUNTOS = [4, 7, 9, 11, 12, 14];

describe('el guion de seis encargos', () => {
  it('cada encargo se cumple en su momento y no antes', () => {
    for (let paso = 0; paso < GUION.length; paso += 1) {
      const antes = comoDiseno(correr(DOC_INICIAL, RECORRIDO.slice(0, PUNTOS[paso] - 1)));
      expect([GUION[paso].id, GUION[paso].comprueba(antes)]).toEqual([GUION[paso].id, false]);
      const despues = comoDiseno(correr(DOC_INICIAL, RECORRIDO.slice(0, PUNTOS[paso])));
      expect([GUION[paso].id, GUION[paso].comprueba(despues)]).toEqual([GUION[paso].id, true]);
    }
  });

  it('NINGÚN encargo posterior deshace un predicado anterior', () => {
    for (let paso = 0; paso < GUION.length; paso += 1) {
      const d = comoDiseno(correr(DOC_INICIAL, RECORRIDO.slice(0, PUNTOS[paso])));
      for (let previo = 0; previo <= paso; previo += 1) {
        expect([GUION[previo].id, GUION[previo].comprueba(d)]).toEqual([GUION[previo].id, true]);
      }
    }
  });

  it('se puede terminar: al final los seis encargos se cumplen a la vez', () => {
    const final = correr(DOC_INICIAL, RECORRIDO);
    const d = comoDiseno(final);
    expect(GUION.every((p) => p.comprueba(d))).toBe(true);
    expect(estaSano(verificar(doc(final)))).toBe(true);
    expect(historiaCuadra(final)).toBe(true);
  });

  it('la idea llegó a costar mucho más de lo que cabe, y el plan final cabe', () => {
    const final = correr(DOC_INICIAL, RECORRIDO);
    expect(costeMaximo(final)).toBe(10);
    expect(costeDelPlan(doc(final))).toBe(PRESUPUESTO);
    expect(costeMaximo(final)).toBeGreaterThan(PRESUPUESTO);
  });

  it('el plan que sale de subir las piezas en el orden de la caja es IMPOSIBLE', () => {
    /* Si esto dejara de ser cierto, el encargo 4 se cumpliría solo y la lección
     * del orden se aprobaría sin haberla aprendido. */
    const h = correr(DOC_INICIAL, RECORRIDO.slice(0, 9));
    const problema = problemaDeOrden(doc(h));
    expect(problema).not.toBeNull();
    expect(problema?.pieza.id).toBe('marcador');
    expect(problema?.necesita.id).toBe('nivel');
    expect(problema?.falta).toBe(false);
  });
});

/* ── 3 · jugando MAL a propósito ────────────────────────────────────────── */

describe('jugando mal a propósito', () => {
  it('subir sólo extras no cumple el encargo 1, por muchos que sean', () => {
    const h = correr(DOC_INICIAL, [aPlan('jefe', 0), aPlan('dosjug', 1), aPlan('mapa', 2)]);
    expect(enElPlan(doc(h))).toHaveLength(3);
    expect(GUION[0].comprueba(comoDiseno(h))).toBe(false);
  });

  it('quitar una imprescindible para que quepa NO cumple el encargo 3', () => {
    const h = correr(DOC_INICIAL, [
      ...RECORRIDO.slice(0, 7),
      aCaja('musica', 3),
      aCaja('tienda', 8),
      aCaja('nivel2', 7),
      aCaja('marcador', 0), // se lleva por delante una de las cuatro
    ]);
    expect(costeDelPlan(doc(h))).toBeLessThanOrEqual(PRESUPUESTO);
    expect(imprescindiblesEnPlan(doc(h))).toBe(TOTAL_IMPRESCINDIBLES - 1);
    expect(GUION[2].comprueba(comoDiseno(h))).toBe(false);
  });

  it('el encargo 2 sobrevive al recorte que lo deshace en el tablero', () => {
    const h = correr(DOC_INICIAL, RECORRIDO.slice(0, 9));
    expect(enElPlan(doc(h)).filter((x) => !x.pieza.imprescindible)).toHaveLength(1);
    expect(llegoAPedirlaGrande(h)).toBe(true);
    expect(GUION[1].comprueba(comoDiseno(h))).toBe(true);
  });

  it('deshacer devuelve el plan a donde estaba y el encargo vuelve a estar sin hacer', () => {
    const h = correr(DOC_INICIAL, RECORRIDO.slice(0, 4));
    expect(GUION[0].comprueba(comoDiseno(h))).toBe(true);
    const atras = deshacer(h);
    expect(costeDelPlan(doc(atras))).toBe(3);
    expect(GUION[0].comprueba(comoDiseno(atras))).toBe(false);
  });

  it('la misma acción dos veces (doble clic) deja el tablero exactamente igual', () => {
    const una = correr(DOC_INICIAL, [aPlan('personaje', 0)]);
    const dos = correr(DOC_INICIAL, [aPlan('personaje', 0), aPlan('personaje', 0)]);
    expect(enElPlan(doc(dos))).toHaveLength(enElPlan(doc(una)).length);
    expect(costeDelPlan(doc(dos))).toBe(costeDelPlan(doc(una)));
  });

  it('la banda se decide por la fila, también si la tarjeta se arrastra fuera de una casilla', () => {
    const arriba = correr(DOC_INICIAL, [mover('personaje', { i: 0, col: 3, fila: 12 })]);
    expect(enElPlan(doc(arriba)).map((x) => x.pieza.id)).toEqual(['personaje']);
    const abajo = correr(DOC_INICIAL, [mover('personaje', { i: 0, col: 3, fila: 13 })]);
    expect(enElPlan(doc(abajo))).toHaveLength(0);
  });

  it('una pieza cuya dependencia no está en el plan también se señala', () => {
    // El jefe final necesita un segundo nivel, y aquí el segundo nivel no está.
    const h = correr(DOC_INICIAL, [aPlan('jefe', 0)]);
    const problema = problemaDeOrden(doc(h));
    expect(problema?.pieza.id).toBe('jefe');
    expect(problema?.falta).toBe(true);
  });

  it('las bandas y los rótulos están bloqueados: no se pueden mover ni borrar', () => {
    const h = nuevaHistoria(DOC_INICIAL);
    const r = hacer(h, accion('mover', { pagina: PAGINA, capa: 'banda-plan', col: 0, fila: 20 }), 'todas');
    expect(r.rechazo).not.toBeNull();
    expect(costeDelPlan(doc(r.historia))).toBe(0);
  });
});

/* ── 4 · el recorrido de punta a punta, con la clase montada ────────────── */

function propsDeActividad() {
  return {
    config: {},
    savedState: undefined,
    onSaveState: jest.fn(),
    onProgress: jest.fn(),
    onScore: jest.fn(),
    onComplete: jest.fn(),
  };
}

function pulsa(selector: string) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`no está en pantalla: ${selector}`);
  fireEvent.click(el);
}

const elige = (id: string) => pulsa(`[data-capa-fila="${P(id).capa}"]`);

function mandoDelPanel(testid: string) {
  const boton = screen.getByTestId(testid);
  if ((boton as HTMLButtonElement).disabled) throw new Error(`el mando «${testid}» está apagado`);
  fireEvent.click(boton);
}

const meter = (id: string) => {
  elige(id);
  mandoDelPanel('plt-meter');
};
const sacar = (id: string) => {
  elige(id);
  mandoDelPanel('plt-sacar');
};
const alFinal = (id: string) => {
  elige(id);
  mandoDelPanel('plt-al-final');
};

describe('la entrada abre el laboratorio', () => {
  it('CTA → portada de objetivos → tablero', async () => {
    render(createElement(EntradaPlaneaTuProyecto, propsDeActividad()));
    fireEvent.click(screen.getByText('Abre el tablero del proyecto'));
    fireEvent.click(await screen.findByTestId('psn-empezar'));
    expect(await screen.findByTestId('dis-ventana')).toBeInTheDocument();
    expect(screen.getByTestId('plt-coste')).toHaveTextContent('0');
  });
});

describe('en <StrictMode>, que es el que trae Next de fábrica', () => {
  it('un encargo resuelto avisa UNA vez, no dos', () => {
    /* React en modo estricto invoca dos veces el cuerpo de cada efecto en el
     * primer montaje. Si el guardián del guion no fuera la pareja
     * (documento, índice), el encargo 1 avanzaría dos veces y el alumno vería
     * el progreso al doble. Es el defecto que se barrió el 15-ago-2026. */
    const props = propsDeActividad();
    render(createElement(StrictMode, null, createElement(LabPlaneaTuProyecto, props)));
    fireEvent.click(screen.getByTestId('psn-empezar'));
    expect(props.onProgress).not.toHaveBeenCalled();

    meter('marcador');
    meter('personaje');
    meter('meta');
    meter('nivel');

    expect(props.onProgress).toHaveBeenCalledTimes(1);
    expect(props.onProgress).toHaveBeenCalledWith(1 / GUION.length);
  });
});

describe('recorrido completo, jugado con los mandos del panel', () => {
  it('se llega a la pantalla de cierre y una partida entera vale 100 y 3 estrellas', () => {
    const props = propsDeActividad();
    const alSalir = jest.fn();
    render(createElement(LabPlaneaTuProyecto, { ...props, alSalir }));
    fireEvent.click(screen.getByTestId('psn-empezar'));

    // Encargo 1 — las cuatro sin las que no hay juego, en el orden de la caja.
    meter('marcador');
    meter('personaje');
    meter('meta');
    meter('nivel');
    expect(screen.getByTestId('plt-coste')).toHaveTextContent('4');

    // Encargo 2 — pedirlo todo. El contador se pone rojo.
    meter('nivel2');
    meter('musica');
    meter('tienda');
    expect(screen.getByTestId('plt-coste')).toHaveTextContent('10');
    expect(screen.getByTestId('plt-presupuesto')).toHaveAttribute('data-cabe', 'no');

    // Encargo 3 — recortar hasta que quepa.
    sacar('musica');
    sacar('tienda');
    expect(screen.getByTestId('plt-coste')).toHaveTextContent('6');
    expect(screen.getByTestId('plt-presupuesto')).toHaveAttribute('data-cabe', 'si');

    // El camino de salida funciona a media práctica.
    fireEvent.click(screen.getByText('Salir'));
    expect(alSalir).toHaveBeenCalledTimes(1);

    // Encargo 4 — ordenar. Dos piezas al final y el plan se puede hacer.
    alFinal('marcador');
    alFinal('meta');
    expect(screen.getByTestId('plt-orden').textContent).toContain('1.º Personaje que se mueve');

    // Encargo 5 — la hoja de bocetos.
    pulsa('[data-accion="nueva-pagina"]');
    const pestanas = document.querySelectorAll('[data-pagina-tab]');
    expect(pestanas).toHaveLength(2);
    fireEvent.click(pestanas[1]);

    // Encargo 6 — bocetar: una forma y un letrero.
    pulsa('[data-herramienta="forma"]');
    pulsa('[data-figura="rect"]');
    pulsa('[data-herramienta="texto"]');
    pulsa('[data-accion="nuevo-texto"]');

    // La pantalla de cierre, con sus cifras.
    expect(screen.getByText('¡Tu plan cabe!')).toBeInTheDocument();
    expect(screen.getByText('10 semanas')).toBeInTheDocument();
    expect(screen.getByText(`6 de ${PRESUPUESTO}`)).toBeInTheDocument();

    expect(props.onComplete).toHaveBeenCalledTimes(1);
    expect(props.onComplete).toHaveBeenCalledWith(expect.objectContaining({ score: 100, stars: 3 }));
    expect(props.onProgress).toHaveBeenLastCalledWith(1);

    // Y el camino de salida también existe desde el cierre.
    fireEvent.click(screen.getByText('Volver a la entrada'));
    expect(alSalir).toHaveBeenCalledTimes(2);
  });
});
