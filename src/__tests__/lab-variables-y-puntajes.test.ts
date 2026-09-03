/**
 * El laboratorio de «Variables y puntajes» (N4 · U3 · §25.2).
 *
 * `programa-bloques.test.ts` ya prueba el intérprete. Lo que se prueba aquí es la
 * otra mitad: las decisiones del laboratorio —qué escenario, qué ajustes lleva
 * cada reto, qué se da por bueno, qué trozo de la corrida se reproduce— sobre los
 * RETOS de verdad, importados del componente. Copiar los programas al test los
 * dejaría envejecer por separado y entonces el test verde no querría decir nada.
 *
 * Lo que estas pruebas cuidan, y por qué:
 *
 *  · Que la corrida BIEN armada de cada reto acabe exactamente en cinco. Con
 *    cinco monedas y meta cinco, un marcador que llega por otro camino no llega:
 *    cualquier bloque fuera de sitio deja otro número.
 *  · Que los dos errores que el documento promete SIGAN ocurriendo: el `poner en
 *    cero` dentro del bucle deja el marcador pegado, y el `sumar` en el tronco lo
 *    dispara por encima de la meta.
 *  · Que el recorte del reto 2 deje ver ese desbordamiento. Cortar la película al
 *    llegar a cinco escondería justo el error que hay que cazar, y el alumno
 *    vería una corrida idéntica a la buena.
 *  · Que los hitos de los tres retos sumen los nueve pasos de la barra, ni uno
 *    más ni uno menos: una barra que no cierra en el último acierto se nota.
 */
import {
  META,
  MUNDO,
  PREVIOS,
  RETOS,
  TOPE_PASOS,
  TOTAL_PASOS,
  hitosPrograma,
  recortar,
  zonaDe,
} from '../components/activities/n4/estudio/LabVariablesYPuntajes';
import {
  LARGO_MAXIMO_NOMBRE,
  limpiarNombre,
  revisarNombre,
  simular,
  type Ejecucion,
  type NodoOrden,
  type NodoSi,
  type Programa,
} from '../components/activities/n4/estudio/programaBloques';

const orden = (id: string, accion: NodoOrden['accion']): NodoOrden => ({ tipo: 'orden', id, accion });

const correr = (indice: number, programa: Programa): Ejecucion =>
  simular(programa, MUNDO, RETOS[indice].ajustes);

/** La C que ya viene puesta: la de recoger la moneda. */
const cDeMonedas = (programa: Programa): NodoSi => programa.siempre.find((n) => n.tipo === 'si') as NodoSi;

const maximo = (salida: Ejecucion) => Math.max(...salida.pasos.map((p) => p.puntos));

/* ── el bautizo de la cajita ───────────────────────────────────────────────── */

describe('§25.2 · ponerle nombre a la variable', () => {
  it('acepta un nombre que dice lo que guarda y lo deja limpio de espacios', () => {
    expect(revisarNombre('  monedas  ').ok).toBe(true);
    expect(limpiarNombre('  monedas  ')).toBe('monedas');
    expect(limpiarNombre('mis   puntos')).toBe('mis puntos');
    expect(revisarNombre('puntos').ok).toBe(true);
  });

  it('rechaza la etiqueta vacía: una cajita sin nombre no se puede pedir', () => {
    const revision = revisarNombre('   ');
    expect(revision.ok).toBe(false);
    expect(revision.aviso).toContain('etiqueta');
  });

  it('rechaza los números en la etiqueta, que es de lo que trata la lección', () => {
    const revision = revisarNombre('puntos5');
    expect(revision.ok).toBe(false);
    expect(revision.aviso).toContain('DENTRO');
  });

  it('rechaza «x»: es el nombre que no dice nada del documento', () => {
    expect(revisarNombre('x').ok).toBe(false);
    expect(revisarNombre('equis').ok).toBe(false);
    expect(revisarNombre('variable').ok).toBe(false);
    expect(revisarNombre('cosa').ok).toBe(false);
  });

  it('rechaza el nombre que no cabe de un vistazo en el tablero', () => {
    const largo = 'elnumeroquevoysumando';
    expect(largo.length).toBeGreaterThan(LARGO_MAXIMO_NOMBRE);
    const revision = revisarNombre(largo);
    expect(revision.ok).toBe(false);
    expect(revision.aviso).toContain(String(LARGO_MAXIMO_NOMBRE));
  });
});

/* ── reto 1 · empieza en cero ──────────────────────────────────────────────── */

describe('§25.2 reto 1 · el marcador empieza en cero', () => {
  it('el tablero arranca con lo de la vez pasada: por eso hay algo que arreglar', () => {
    expect(RETOS[0].ajustes.puntosIniciales).toBe(3);
    expect(RETOS[0].arranque().inicio).toEqual([]);
  });

  it('con el `poner en cero` arriba, borra el 3 y cierra en cinco', () => {
    const programa = RETOS[0].arranque();
    programa.inicio!.push(orden('cero', 'poner-cero'));
    const salida = correr(0, programa);

    expect(salida.puntos).toBe(META);
    expect(salida.fin).toBe('monedas');
    expect(RETOS[0].exito(salida, programa)).toBe(true);
    expect(recortar(salida, 0).length).toBe(16);
  });

  it('sin el bloque, la partida vieja se suma a la nueva y el marcador miente', () => {
    const programa = RETOS[0].arranque();
    const salida = correr(0, programa);

    expect(salida.puntos).toBe(8);
    expect(RETOS[0].exito(salida, programa)).toBe(false);
  });

  it('metido en la C se vacía en cada vuelta y la cuenta acaba en uno', () => {
    const programa = RETOS[0].arranque();
    const c = cDeMonedas(programa);
    c.cuerpo.push(orden('cero', 'poner-cero'));
    const salida = correr(0, programa);
    const cifras = salida.pasos.map((p) => p.puntos);

    // 3,3,4,0 … : el cero llega DESPUÉS de recoger, así que la primera moneda
    // todavía se apoya en la partida vieja. De ahí en adelante cada vuelta borra
    // lo que acaba de contar y el marcador ya no pasa de uno.
    const primerCero = cifras.indexOf(0);
    expect(primerCero).toBeGreaterThan(0);
    expect(Math.max(...cifras.slice(primerCero))).toBe(1);

    // Termina en 1 y no en 0 porque la última moneda acaba la partida antes de
    // que el bloque alcance a borrarla: una sola moneda contada de las cinco.
    expect(salida.puntos).toBe(1);
    expect(salida.fin).toBe('monedas');
    expect(RETOS[0].exito(salida, programa)).toBe(false);
    // Y el laboratorio sabe señalar dónde quedó: la boca de esa C tiembla.
    expect(zonaDe(programa, 'poner-cero')).toBe(`boca:${c.id}`);
  });
});

/* ── reto 2 · que sume ─────────────────────────────────────────────────────── */

describe('§25.2 reto 2 · la suma va donde se recoge', () => {
  it('la moneda ya no suma sola: sin el bloque nadie cuenta', () => {
    expect(RETOS[1].ajustes.sumaAlRecoger).toBe(false);
    const salida = correr(1, RETOS[1].arranque());
    expect(salida.puntos).toBe(0);
  });

  it('dentro de la C hay una suma por moneda y el marcador cierra en cinco', () => {
    const programa = RETOS[1].arranque();
    cDeMonedas(programa).cuerpo.push(orden('suma', 'sumar'));
    const salida = correr(1, programa);

    expect(salida.puntos).toBe(META);
    expect(RETOS[1].exito(salida, programa)).toBe(true);
    // La corrida buena no termina sola —el muñeco sigue dando vueltas—, así que lo
    // que se reproduce es el trozo que llega a la meta y un poco más.
    expect(salida.pasos.length).toBeGreaterThan(TOPE_PASOS);
    expect(recortar(salida, 1).length).toBe(23);
    expect(recortar(salida, 1).at(-1)!.puntos).toBe(META);
  });

  it('en el tronco suma vueltas en vez de monedas y se dispara', () => {
    const programa = RETOS[1].arranque();
    programa.siempre.push(orden('suma', 'sumar'));
    const salida = correr(1, programa);

    expect(maximo(salida)).toBeGreaterThan(META);
    expect(RETOS[1].exito(salida, programa)).toBe(false);
    expect(zonaDe(programa, 'sumar')).toBe('siempre:');
  });

  it('el recorte deja VER cómo se pasa de cinco: ahí está la lección', () => {
    const programa = RETOS[1].arranque();
    programa.siempre.push(orden('suma', 'sumar'));
    const pasos = recortar(correr(1, programa), 1);

    expect(pasos.some((p) => p.puntos > META)).toBe(true);
    expect(pasos.length).toBeLessThanOrEqual(TOPE_PASOS);
  });

  it('llegar a cinco por casualidad no cuenta: se mira dónde está la pieza', () => {
    const programa = RETOS[1].arranque();
    programa.siempre.push(orden('suma', 'sumar'));
    const salida = correr(1, programa);
    // Pasa por cinco en algún momento —contando vueltas— y aun así no vale.
    expect(salida.pasos.some((p) => p.puntos === META)).toBe(true);
    expect(RETOS[1].exito(salida, programa)).toBe(false);
  });
});

/* ── reto 3 · pregúntale ───────────────────────────────────────────────────── */

/** El segundo `si` del tronco: el que mira el marcador y enciende el letrero. */
function conAviso(programa: Programa, dondeVaMostrar: 'dentro' | 'tronco'): Programa {
  const aviso: NodoSi = {
    tipo: 'si',
    id: 'aviso',
    condicion: { id: 'aviso-c', pregunta: 'puntos-igual-meta' },
    cuerpo: dondeVaMostrar === 'dentro' ? [orden('mostrar', 'mostrar')] : [],
  };
  programa.siempre.push(aviso);
  if (dondeVaMostrar === 'tronco') programa.siempre.push(orden('mostrar', 'mostrar'));
  return programa;
}

describe('§25.2 reto 3 · el programa mira su propia cuenta', () => {
  it('con el ¡GANASTE! dentro del segundo `si`, el letrero se enciende en cinco', () => {
    const programa = conAviso(RETOS[2].arranque(), 'dentro');
    const salida = correr(2, programa);

    expect(salida.fin).toBe('gana');
    expect(salida.puntos).toBe(META);
    expect(RETOS[2].exito(salida, programa)).toBe(true);

    const pasos = recortar(salida, 2);
    expect(pasos.at(-1)!.efecto.tipo).toBe('gana');
    expect(pasos.length).toBe(27);
    expect(pasos.length).toBeLessThanOrEqual(TOPE_PASOS);
  });

  it('con el ¡GANASTE! fuera, el letrero se enciende en la primera vuelta', () => {
    const programa = conAviso(RETOS[2].arranque(), 'tronco');
    const salida = correr(2, programa);

    expect(salida.fin).toBe('gana');
    expect(salida.puntos).toBeLessThan(META);
    expect(RETOS[2].exito(salida, programa)).toBe(false);
    expect(zonaDe(programa, 'mostrar')).toBe('siempre:');
  });

  it('sin el segundo `si` nadie mira el marcador y la corrida se agota', () => {
    const programa = RETOS[2].arranque();
    const salida = correr(2, programa);
    expect(salida.fin).not.toBe('gana');
    expect(RETOS[2].exito(salida, programa)).toBe(false);
  });
});

/* ── la barra de progreso ──────────────────────────────────────────────────── */

describe('§25.2 · los hitos cierran la barra', () => {
  it('cada reto entrega exactamente los pasos que el siguiente da por hechos', () => {
    const uno = RETOS[0].arranque();
    uno.inicio!.push(orden('cero', 'poner-cero'));
    expect(PREVIOS[0] + hitosPrograma(uno, 0, true) + 1).toBe(PREVIOS[1]);

    const dos = RETOS[1].arranque();
    cDeMonedas(dos).cuerpo.push(orden('suma', 'sumar'));
    expect(PREVIOS[1] + hitosPrograma(dos, 1, true) + 1).toBe(PREVIOS[2]);

    const tres = conAviso(RETOS[2].arranque(), 'dentro');
    expect(PREVIOS[2] + hitosPrograma(tres, 2, true) + 1).toBe(TOTAL_PASOS);
  });

  it('la barra no avanza sola: sin cajita y sin bloques, el primer reto está en cero', () => {
    expect(hitosPrograma(RETOS[0].arranque(), 0, false)).toBe(0);
    expect(hitosPrograma(RETOS[0].arranque(), 0, true)).toBe(1);
  });

  it('el reto 3 se arma por partes y cada parte cuenta', () => {
    const soloC = RETOS[2].arranque();
    soloC.siempre.push({ tipo: 'si', id: 'aviso', condicion: null, cuerpo: [] });
    expect(hitosPrograma(soloC, 2, true)).toBe(1);
    expect(hitosPrograma(conAviso(RETOS[2].arranque(), 'tronco'), 2, true)).toBe(2);
    expect(hitosPrograma(conAviso(RETOS[2].arranque(), 'dentro'), 2, true)).toBe(3);
  });
});
