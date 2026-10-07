/**
 * `n6-programa-un-microbit` (§69.11) · qué sombrero corre lo descubre el
 * alumno. El juez corre sin pantalla la pila del botón que pide el encargo,
 * así que una cara feliz que salió del sombrero equivocado no cierra nada.
 * Jugando MAL: la cara bajo B, la pila bien armada sin pulsar, y los dos
 * órdenes del encargo 5.
 */
import { nuevoBloque, pila, programaDe, type BloquePuesto, type Programa } from '@/components/simuladores/bloques';
import {
  CATALOGO,
  GUION,
  MUNDO_INICIAL,
  pantallaTras,
  reinicioDejaLaEstrella,
  type IconoMicrobit,
  type MundoMicrobit,
} from '@/components/activities/bloques/LabProgramaUnMicrobit';

let n = 0;
function b(ficha: string, args?: Record<string, string>): BloquePuesto {
  const bloque = nuevoBloque(CATALOGO, ficha, `b${(n += 1)}`);
  if (!bloque) throw new Error(ficha);
  return args ? { ...bloque, args } : bloque;
}
const icono = (i: IconoMicrobit) => b('mostrar-icono', { icono: i });
const sombrero = (ficha: string) => ({ ...b(ficha), fijo: true });

function placa(cuerpos: { inicio?: BloquePuesto[]; a?: BloquePuesto[]; b?: BloquePuesto[] }): Programa {
  return programaDe(
    pila('p-inicio', sombrero('al-empezar'), cuerpos.inicio ?? []),
    pila('p-a', sombrero('al-presionar-a'), cuerpos.a ?? []),
    pila('p-b', sombrero('al-presionar-b'), cuerpos.b ?? []),
  );
}

/** Lo que vería el encargo justo después de pulsar el botón de `pilaId` con `programa` en el editor. */
function trasPulsar(programa: Programa, pilaId: string | null, extra: Partial<MundoMicrobit> = {}) {
  const pantalla = pilaId ? pantallaTras(programa, pilaId, { ...MUNDO_INICIAL, ...extra }) : (extra.pantalla ?? null);
  return {
    programa,
    corriendo: false,
    enPausa: false,
    nodoActivo: null,
    parte: pilaId ? ({ programa, fin: 'ok' } as never) : null,
    mundo: { ...MUNDO_INICIAL, ...extra, pantalla, ultimaPila: pilaId },
  };
}

const encargo = (id: string) => {
  const e = GUION.find((g) => g.id === id);
  if (!e || e.logro.tipo !== 'estado') throw new Error(id);
  return e.logro.comprueba;
};

describe('n6-programa-un-microbit · el juez sin pantalla', () => {
  it('corre sólo la pila que se le pide', () => {
    const p = placa({ a: [icono('feliz')], b: [icono('triste')] });
    expect(pantallaTras(p, 'p-a')).toBe('feliz');
    expect(pantallaTras(p, 'p-b')).toBe('triste');
    expect(pantallaTras(p, 'p-inicio')).toBeNull();
  });
});

describe('n6-programa-un-microbit · encargos 1 y 2, jugando mal', () => {
  const uno = encargo('icono-a');
  const dos = encargo('icono-b');

  it('la cara feliz bajo «al presionar B» no cierra el encargo 1, aunque esté en pantalla', () => {
    const p = placa({ b: [icono('feliz')] });
    expect(uno(trasPulsar(p, 'p-b'))).toBe(false);
    // Pulsar A después, con A vacío, deja la cara en pantalla pero tampoco cuenta.
    expect(uno(trasPulsar(p, 'p-a', { pantalla: 'feliz' }))).toBe(false);
  });

  it('la cara feliz bajo «al empezar» tampoco', () => {
    expect(uno(trasPulsar(placa({ inicio: [icono('feliz')] }), 'p-inicio'))).toBe(false);
  });

  it('armar bien la pila de A sin pulsar A no lo cierra', () => {
    expect(uno(trasPulsar(placa({ a: [icono('feliz')] }), null))).toBe(false);
  });

  it('pulsar A antes de armarla y no volver a pulsarla tampoco', () => {
    const vacia = placa({});
    const armada = placa({ a: [icono('feliz')] });
    const ctx = { ...trasPulsar(vacia, 'p-a'), programa: armada, mundo: { ...MUNDO_INICIAL, pantalla: 'feliz' as const, ultimaPila: 'p-a' } };
    expect(uno(ctx)).toBe(false);
  });

  it('la cara feliz bajo A, y pulsar A, sí', () => {
    expect(uno(trasPulsar(placa({ a: [icono('feliz')] }), 'p-a'))).toBe(true);
  });

  it('el encargo 2 pide la triste en B sin romper la feliz de A', () => {
    expect(dos(trasPulsar(placa({ a: [icono('feliz')], b: [icono('triste')] }), 'p-b'))).toBe(true);
    expect(dos(trasPulsar(placa({ b: [icono('triste')] }), 'p-b'))).toBe(false);
    expect(dos(trasPulsar(placa({ a: [icono('triste')], b: [icono('feliz')] }), 'p-a'))).toBe(false);
  });
});

describe('n6-programa-un-microbit · encargo 5, jugando mal', () => {
  const cinco = encargo('arregla-orden');

  it('quitar «apagar pantalla» no cierra, aunque quede la estrella', () => {
    const p = placa({ inicio: [icono('estrella')] });
    expect(reinicioDejaLaEstrella(p)).toBe(false);
    expect(cinco(trasPulsar(p, 'p-inicio'))).toBe(false);
  });

  it('«estrella» y luego «apagar» tampoco', () => {
    expect(cinco(trasPulsar(placa({ inicio: [icono('estrella'), b('apagar-pantalla')] }), 'p-inicio'))).toBe(false);
  });

  it('«apagar» y luego «estrella», sí', () => {
    expect(cinco(trasPulsar(placa({ inicio: [b('apagar-pantalla'), icono('estrella')] }), 'p-inicio'))).toBe(true);
  });

  it('el orden bueno sin reiniciar la placa no cierra', () => {
    expect(cinco(trasPulsar(placa({ inicio: [b('apagar-pantalla'), icono('estrella')] }), null, { pantalla: 'estrella' }))).toBe(false);
  });
});

describe('n6-programa-un-microbit · las instrucciones no dictan', () => {
  it('ni el encargo 1 ni el 2 dicen bajo qué sombrero va el bloque', () => {
    for (const id of ['icono-a', 'icono-b']) {
      const { instruccion } = GUION.find((g) => g.id === id)!;
      expect(instruccion).not.toMatch(/bajo (el sombrero )?«al presionar/i);
    }
  });

  it('el encargo 5 no dicta el orden', () => {
    expect(GUION.find((g) => g.id === 'arregla-orden')!.instruccion).not.toMatch(/primero/i);
  });

  it('ninguna instrucción trae markdown: la sala pinta texto plano', () => {
    for (const g of GUION) expect(`${g.instruccion} ${g.pista}`).not.toMatch(/\*\*/);
  });
});
