/**
 * TECNIA BLOQUES · el armazón de las 8 actividades de bloques.
 *
 * Se prueba en tres alturas y en este orden, porque es el orden en el que se
 * rompe: el árbol y su regla de encaje (puro), el intérprete paso a paso (puro)
 * y el editor con su gancho (React y DOM).
 *
 * ── LA TRAMPA CLÁSICA DE UN EDITOR DE BLOQUES ─────────────────────────────
 *
 * Que el arrastre sólo se pueda probar con un ratón de verdad, y entonces no se
 * prueba. Aquí «¿cabe esta pieza aquí?» es una función pura sobre un dato
 * (`Sitio`), así que casi todo esto se juega SIN DOM; y las dos pruebas que sí
 * usan el DOM comprueban justamente lo único que el DOM añade: que la zona que
 * se pintó verde es la misma que acepta, y que soltar de verdad llama a la misma
 * función que las otras veintitrés pruebas ya comprobaron.
 *
 * ── Y SE JUEGA MAL, A PROPÓSITO ───────────────────────────────────────────
 *
 * Soltar en el vacío, meter un bloque dentro de sí mismo, ejecutar el guion
 * vacío, darle a ▶ mientras ya corre, un `repetir` sin nada dentro, un `por
 * siempre` vacío, cien bloques encadenados y borrar un bloque a mitad de
 * ejecución. Ninguna de las ocho debe colgar el navegador de un niño.
 *
 * El catálogo de prueba es un ROBOT EN CUADRÍCULA y no el tablero de N4·U3: si
 * el armazón siguiera sabiéndose los verbos de aquella unidad, aquí no
 * arrancaría nada.
 */
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { useState } from 'react';
import {
  arrancar,
  buscarBloque,
  cabeEn,
  contarBloques,
  ejecutarTodo,
  moverBloque,
  nuevoBloque,
  puedeMoverse,
  quitar,
  siguiente,
  soltarFicha,
  type BloquePuesto,
  type FichaBloque,
  type Preguntar,
  type Programa,
  type Sitio,
} from '@/components/simuladores/bloques';
import { useBloques } from '@/components/simuladores/bloques/useBloques';
import {
  VentanaBloques,
  type CategoriaBloques,
} from '@/components/simuladores/bloques/VentanaBloques';

/* ── el catálogo de prueba: un robot en una cuadrícula ─────────────────────── */

const CATALOGO: FichaBloque[] = [
  { id: 'avanza', categoria: 'mov', etiqueta: 'avanza una casilla', semantica: { tipo: 'accion' } },
  { id: 'gira', categoria: 'mov', etiqueta: 'gira a la derecha', semantica: { tipo: 'accion' } },
  { id: 'pinta', categoria: 'mov', etiqueta: 'pinta el suelo', semantica: { tipo: 'accion' } },
  { id: 'si', categoria: 'ctrl', etiqueta: 'si · entonces', semantica: { tipo: 'si' } },
  { id: 'sino', categoria: 'ctrl', etiqueta: 'si · entonces · si no', semantica: { tipo: 'si-sino' } },
  {
    id: 'repetir',
    categoria: 'ctrl',
    etiqueta: 'repetir',
    semantica: { tipo: 'repetir', ranura: 'veces', veces: 2 },
    ranuras: [{ id: 'veces', tipo: 'numero', valor: 3 }],
  },
  { id: 'siempre', categoria: 'ctrl', etiqueta: 'por siempre', semantica: { tipo: 'por-siempre' } },
  { id: 'mientras', categoria: 'ctrl', etiqueta: 'mientras', semantica: { tipo: 'mientras' } },
  { id: 'parar', categoria: 'ctrl', etiqueta: 'parar todo', semantica: { tipo: 'parar' } },
  {
    id: 'llamar',
    categoria: 'ctrl',
    etiqueta: 'baila',
    semantica: { tipo: 'llamar', ranura: 'nombre' },
    ranuras: [{ id: 'nombre', tipo: 'texto', valor: 'baile' }],
  },
  { id: 'muro', categoria: 'sens', etiqueta: '¿hay muro delante?', semantica: { tipo: 'condicion' } },
  { id: 'cuantas', categoria: 'sens', etiqueta: '¿cuántas casillas?', semantica: { tipo: 'valor' } },
  { id: 'bandera', categoria: 'ctrl', etiqueta: 'al empezar', semantica: { tipo: 'sombrero' } },
];

const CATEGORIAS: CategoriaBloques[] = [
  { id: 'mov', nombre: 'Movimiento', color: '#0ea5c6' },
  { id: 'ctrl', nombre: 'Control', color: '#e8920c' },
  { id: 'sens', nombre: 'Sensores', color: '#16a34a' },
];

let siguienteId = 0;
function bloque(ficha: string, extra: Partial<BloquePuesto> = {}): BloquePuesto {
  siguienteId += 1;
  const base = nuevoBloque(CATALOGO, ficha, `n${siguienteId}`);
  if (!base) throw new Error(`ficha inventada: ${ficha}`);
  return { ...base, ...extra };
}

function guion(...bloques: BloquePuesto[]): Programa {
  return { pilas: [{ id: 'p1', sombrero: null, bloques }] };
}

const NUNCA: Preguntar = () => false;
const SIEMPRE: Preguntar = () => true;

/** El sitio de la cola del guion principal. */
function cola(programa: Programa): Sitio {
  return { donde: 'pila', pila: 'p1', indice: programa.pilas[0].bloques.length };
}

/* ══ 1 · el árbol y la regla de encaje, sin ratón ══════════════════════════ */

describe('el árbol y la regla de encaje', () => {
  it('una orden entra en el guion y una pregunta no, y lo dice en español', () => {
    const p = guion();
    expect(cabeEn(p, CATALOGO, cola(p), 'avanza')).toEqual({ ok: true });

    const rechazo = cabeEn(p, CATALOGO, cola(p), 'muro');
    expect(rechazo.ok).toBe(false);
    if (rechazo.ok) throw new Error('tenía que rebotar');
    expect(rechazo.motivo).toBe('aqui-no-cabe');
    expect(rechazo.aviso).toContain('pregunta');
  });

  it('en el hueco hexagonal sólo entra una pregunta', () => {
    const si = bloque('si');
    const p = guion(si);
    const hueco: Sitio = { donde: 'hueco', bloque: si.id };

    expect(cabeEn(p, CATALOGO, hueco, 'muro')).toEqual({ ok: true });
    expect(cabeEn(p, CATALOGO, hueco, 'avanza').ok).toBe(false);
    // Y un bloque que no pregunta nada ni siquiera tiene hueco.
    expect(cabeEn(p, CATALOGO, { donde: 'hueco', bloque: 'no-existe' }, 'muro').ok).toBe(false);
  });

  it('anida de verdad: un si dentro de un si dentro de un repetir', () => {
    let p = guion(bloque('repetir'));
    const rep = p.pilas[0].bloques[0];

    const uno = soltarFicha(p, CATALOGO, { donde: 'rama', bloque: rep.id, rama: 'cuerpo', indice: 0 }, 'si', 'a');
    expect(uno.encaje.ok).toBe(true);
    p = uno.programa;

    const dos = soltarFicha(p, CATALOGO, { donde: 'rama', bloque: 'a', rama: 'cuerpo', indice: 0 }, 'si', 'b');
    expect(dos.encaje.ok).toBe(true);
    p = dos.programa;

    const tres = soltarFicha(p, CATALOGO, { donde: 'rama', bloque: 'b', rama: 'cuerpo', indice: 0 }, 'avanza', 'c');
    expect(tres.encaje.ok).toBe(true);
    p = tres.programa;

    expect(contarBloques(p)).toBe(4);
    expect(buscarBloque(p, 'c')).not.toBeNull();
    expect(buscarBloque(p, 'b')?.ramas?.cuerpo[0].id).toBe('c');
  });

  it('soltar en el vacío devuelve el guion TAL CUAL', () => {
    const p = guion(bloque('avanza'));
    const inventados: Sitio[] = [
      { donde: 'pila', pila: 'no-existe', indice: 0 },
      { donde: 'rama', bloque: 'no-existe', rama: 'cuerpo', indice: 0 },
      { donde: 'rama', bloque: p.pilas[0].bloques[0].id, rama: 'cuerpo', indice: 0 },
    ];
    for (const sitio of inventados) {
      const r = soltarFicha(p, CATALOGO, sitio, 'avanza', 'x');
      expect(r.encaje.ok).toBe(false);
      if (r.encaje.ok) throw new Error('tenía que rebotar');
      expect(r.encaje.motivo).toBe('sitio-inexistente');
      // Identidad, no sólo igualdad: ni se reconstruyó el árbol.
      expect(r.programa).toBe(p);
    }
  });

  it('un bloque no puede meterse dentro de sí mismo ni dentro de su nieto', () => {
    const nieto = bloque('si');
    const hijo = bloque('si', { ramas: { cuerpo: [nieto] } });
    const abuelo = bloque('repetir', { ramas: { cuerpo: [hijo] } });
    const p = guion(abuelo);

    for (const destino of [abuelo.id, hijo.id, nieto.id]) {
      const r = moverBloque(p, CATALOGO, abuelo.id, {
        donde: 'rama',
        bloque: destino,
        rama: 'cuerpo',
        indice: 0,
      });
      expect(r.encaje.ok).toBe(false);
      if (r.encaje.ok) throw new Error('tenía que rebotar');
      expect(r.encaje.motivo).toBe('dentro-de-si-mismo');
      expect(r.programa).toBe(p);
    }
    // Y lo que sí es legal sigue siéndolo: el nieto sube al guion.
    expect(puedeMoverse(p, CATALOGO, nieto.id, cola(p)).ok).toBe(true);
  });

  it('el reportero no encaja en ningún sitio, que es su lección', () => {
    const si = bloque('si');
    const p = guion(si);
    expect(cabeEn(p, CATALOGO, cola(p), 'cuantas').ok).toBe(false);
    expect(cabeEn(p, CATALOGO, { donde: 'hueco', bloque: si.id }, 'cuantas').ok).toBe(false);
    // Y el sombrero tampoco: va arriba del todo, no dentro del guion.
    expect(cabeEn(p, CATALOGO, cola(p), 'bandera').ok).toBe(false);
  });

  it('quitar saca el bloque de donde esté y no toca a sus hermanos', () => {
    const dentro = bloque('avanza');
    const otro = bloque('gira');
    const si = bloque('si', { condicion: bloque('muro'), ramas: { cuerpo: [dentro, otro] } });
    const p = guion(si, bloque('pinta'));

    const sinDentro = quitar(p, dentro.id);
    expect(buscarBloque(sinDentro, dentro.id)).toBeNull();
    expect(buscarBloque(sinDentro, otro.id)).not.toBeNull();
    expect(sinDentro.pilas[0].bloques).toHaveLength(2);

    const sinPregunta = quitar(p, si.condicion?.id ?? '');
    expect(buscarBloque(sinPregunta, si.id)?.condicion).toBeNull();

    // Un mueble de la actividad no se quita ni se mueve.
    const fijo = bloque('siempre', { fijo: true });
    const conMueble = guion(fijo);
    expect(quitar(conMueble, fijo.id)).toBe(conMueble);
    expect(puedeMoverse(conMueble, CATALOGO, fijo.id, cola(conMueble)).ok).toBe(false);
  });

  it('mover dentro de la misma lista cuenta el índice SIN la pieza que se muda', () => {
    const a = bloque('avanza');
    const b = bloque('gira');
    const c = bloque('pinta');
    const p = guion(a, b, c);

    // El primero al final: tiene que quedar tercero, no segundo.
    const r = moverBloque(p, CATALOGO, a.id, { donde: 'pila', pila: 'p1', indice: 2 });
    expect(r.encaje.ok).toBe(true);
    expect(r.programa.pilas[0].bloques.map((x) => x.id)).toEqual([b.id, c.id, a.id]);
    expect(contarBloques(r.programa)).toBe(3);
  });

  it('cien bloques encadenados se arman y se ejecutan en orden', () => {
    let p = guion();
    for (let i = 0; i < 100; i += 1) {
      const r = soltarFicha(p, CATALOGO, cola(p), i % 2 === 0 ? 'avanza' : 'gira', `k${i}`);
      expect(r.encaje.ok).toBe(true);
      p = r.programa;
    }
    expect(contarBloques(p)).toBe(100);
    const parte = ejecutarTodo(p, CATALOGO, NUNCA);
    expect(parte.acciones).toHaveLength(100);
    expect(parte.acciones[0]).toBe('avanza');
    expect(parte.acciones[99]).toBe('gira');
    expect(parte.fin).toBe('termino');
  });
});

/* ══ 2 · el intérprete ═════════════════════════════════════════════════════ */

describe('el intérprete', () => {
  it('el guion vacío no revienta: lo dice y se acaba', () => {
    const parte = ejecutarTodo(guion(), CATALOGO, NUNCA);
    expect(parte.fin).toBe('vacio');
    expect(parte.aviso).toContain('vacío');
    expect(parte.acciones).toEqual([]);

    // Y también cuando la actividad nombra su pila a mano, que es lo normal:
    // buscar «la primera con bloques» tapaba este caso sin arreglarlo.
    const conNombre = ejecutarTodo(guion(), CATALOGO, NUNCA, { pila: 'p1' });
    expect(conNombre.fin).toBe('vacio');
    expect(conNombre.aviso).toContain('vacío');
  });

  it('cada paso enciende exactamente un bloque, y en el orden del guion', () => {
    const a = bloque('avanza');
    const b = bloque('gira');
    let estado = arrancar(guion(a, b), CATALOGO, {});
    const encendidos: (string | null)[] = [];

    for (let i = 0; i < 4 && !estado.fin; i += 1) {
      const paso = siguiente(estado, NUNCA);
      estado = paso.estado;
      if (!estado.fin) encendidos.push(estado.nodoActivo);
    }
    expect(encendidos).toEqual([a.id, b.id]);
    expect(estado.fin).toBe('termino');
    expect(estado.nodoActivo).toBeNull();
  });

  it('el si entra por la boca que toca, y el si-si-no por la otra', () => {
    const armar = (ficha: string) =>
      guion(
        bloque(ficha, {
          condicion: bloque('muro'),
          ramas: { cuerpo: [bloque('gira')], sino: [bloque('pinta')] },
        }),
      );

    expect(ejecutarTodo(armar('si'), CATALOGO, SIEMPRE).acciones).toEqual(['gira']);
    expect(ejecutarTodo(armar('si'), CATALOGO, NUNCA).acciones).toEqual([]);
    expect(ejecutarTodo(armar('sino'), CATALOGO, SIEMPRE).acciones).toEqual(['gira']);
    expect(ejecutarTodo(armar('sino'), CATALOGO, NUNCA).acciones).toEqual(['pinta']);
  });

  it('un si con el hueco vacío no decide nada, pero se ve que lo intentó', () => {
    const si = bloque('si', { ramas: { cuerpo: [bloque('gira')] } });
    const parte = ejecutarTodo(guion(si), CATALOGO, SIEMPRE);
    expect(parte.acciones).toEqual([]);
    const mira = parte.eventos.find((e) => e.tipo === 'mira');
    expect(mira).toMatchObject({ nodoId: si.id, pregunta: null, respuesta: false });
  });

  it('repetir da las vueltas que dice su ranura, y vacío no cuelga', () => {
    const cuerpo = () => [bloque('avanza')];
    const tres = guion(bloque('repetir', { args: { veces: 3 }, ramas: { cuerpo: cuerpo() } }));
    expect(ejecutarTodo(tres, CATALOGO, NUNCA).acciones).toEqual(['avanza', 'avanza', 'avanza']);

    const cero = guion(bloque('repetir', { args: { veces: 0 }, ramas: { cuerpo: cuerpo() } }));
    expect(ejecutarTodo(cero, CATALOGO, NUNCA).acciones).toEqual([]);

    // Sin nada dentro: no gira para siempre, se acaba.
    const vacio = guion(bloque('repetir', { args: { veces: 5 }, ramas: { cuerpo: [] } }));
    const parte = ejecutarTodo(vacio, CATALOGO, NUNCA);
    expect(parte.fin).toBe('termino');

    // Una ranura con basura cae al valor de la ficha, no a `NaN` vueltas.
    const basura = guion(bloque('repetir', { args: { veces: 'ocho' }, ramas: { cuerpo: cuerpo() } }));
    expect(ejecutarTodo(basura, CATALOGO, NUNCA).acciones).toEqual(['avanza', 'avanza']);
  });

  it('un por siempre vacío NO cuelga el navegador: se corta y lo explica', () => {
    const parte = ejecutarTodo(guion(bloque('siempre', { ramas: { cuerpo: [] } })), CATALOGO, NUNCA, {
      tope: 500,
    });
    expect(parte.fin).toBe('tope');
    expect(parte.aviso).toContain('500 pasos');
    expect(parte.aviso).toContain('bucle');
    expect(parte.pasos).toBeLessThanOrEqual(501);
  });

  it('mientras vuelve a preguntar en cada vuelta y sale cuando cambia la respuesta', () => {
    let quedan = 3;
    const preguntar: Preguntar = () => {
      quedan -= 1;
      return quedan >= 0;
    };
    const bucle = guion(
      bloque('mientras', { condicion: bloque('muro'), ramas: { cuerpo: [bloque('avanza')] } }),
    );
    const parte = ejecutarTodo(bucle, CATALOGO, preguntar);
    expect(parte.acciones).toEqual(['avanza', 'avanza', 'avanza']);
    expect(parte.fin).toBe('termino');
  });

  it('un bloque propio se llama desde dos sitios y vuelve; el que no existe no rompe', () => {
    const programa: Programa = {
      pilas: [
        {
          id: 'p1',
          sombrero: null,
          bloques: [
            bloque('llamar', { args: { nombre: 'baile' } }),
            bloque('avanza'),
            bloque('llamar', { args: { nombre: 'baile' } }),
            bloque('llamar', { args: { nombre: 'no-existe' } }),
          ],
        },
        { id: 'p2', nombre: 'baile', sombrero: null, bloques: [bloque('gira'), bloque('pinta')] },
      ],
    };
    const parte = ejecutarTodo(programa, CATALOGO, NUNCA, { pila: 'p1' });
    expect(parte.acciones).toEqual(['gira', 'pinta', 'avanza', 'gira', 'pinta']);
    const perdida = parte.eventos.find((e) => e.tipo === 'llama' && !e.encontrada);
    expect(perdida).toBeDefined();
    expect(parte.fin).toBe('termino');
  });

  it('un bloque que se llama a sí mismo se corta con un aviso, no con un cuelgue', () => {
    const programa: Programa = {
      pilas: [
        { id: 'p1', sombrero: null, bloques: [bloque('llamar', { args: { nombre: 'baile' } })] },
        {
          id: 'p2',
          nombre: 'baile',
          sombrero: null,
          bloques: [bloque('gira'), bloque('llamar', { args: { nombre: 'baile' } })],
        },
      ],
    };
    const parte = ejecutarTodo(programa, CATALOGO, NUNCA, { pila: 'p1' });
    expect(parte.fin).toBe('tope');
    expect(parte.aviso).toContain('llamando a sí mismo');
  });

  it('parar corta en seco: lo que va detrás no se ejecuta', () => {
    const p = guion(bloque('avanza'), bloque('parar'), bloque('pinta'));
    const parte = ejecutarTodo(p, CATALOGO, NUNCA);
    expect(parte.acciones).toEqual(['avanza']);
    expect(parte.fin).toBe('bloque-parar');
  });
});

/* ══ 3 · el gancho: estado, reloj y jugar mal ══════════════════════════════ */

function usarBloques(inicial: Programa, extra: Partial<Parameters<typeof useBloques>[0]> = {}) {
  const acciones: string[] = [];
  const vista = renderHook(() =>
    useBloques({
      catalogo: CATALOGO,
      inicial,
      velocidad: 0,
      preguntar: NUNCA,
      onEvento: (e) => {
        if (e.tipo === 'accion') acciones.push(e.accion);
      },
      ...extra,
    }),
  );
  return { vista, acciones };
}

describe('el gancho del editor', () => {
  it('darle a ▶ mientras ya corre no arranca una segunda corrida', () => {
    const dos: Programa = {
      pilas: [
        { id: 'p1', sombrero: null, bloques: [bloque('avanza'), bloque('gira')] },
        { id: 'p2', sombrero: null, bloques: [bloque('pinta')] },
      ],
    };
    const { vista, acciones } = usarBloques(dos, { pila: 'p1' });

    act(() => {
      expect(vista.result.current.correr()).toBe('ok');
    });
    act(() => {
      vista.result.current.pasoAPaso();
    });
    expect(acciones).toEqual(['avanza']);

    act(() => {
      expect(vista.result.current.correr()).toBe('ocupado');
      expect(vista.result.current.correr()).toBe('ocupado');
    });
    act(() => {
      vista.result.current.pasoAPaso();
    });
    // Si el segundo ▶ hubiera arrancado otra corrida, aquí habría dos `avanza`.
    expect(acciones).toEqual(['avanza', 'gira']);

    // Y una vez libre, ▶ sabe arrancar OTRO guion: es lo que necesitan las
    // actividades por disparador, donde cada sombrero es una pila distinta.
    act(() => {
      vista.result.current.pasoAPaso();
    });
    act(() => {
      expect(vista.result.current.correr('p2')).toBe('ok');
      vista.result.current.pasoAPaso();
    });
    expect(acciones).toEqual(['avanza', 'gira', 'pinta']);
  });

  it('borrar un bloque a mitad de ejecución no rompe la corrida', () => {
    const a = bloque('avanza');
    const b = bloque('gira');
    const { vista, acciones } = usarBloques(guion(a, b, bloque('pinta')));

    act(() => {
      vista.result.current.correr();
      vista.result.current.pasoAPaso();
    });
    act(() => {
      vista.result.current.quitarBloque(b.id);
    });
    act(() => {
      vista.result.current.pasoAPaso();
      vista.result.current.pasoAPaso();
      vista.result.current.pasoAPaso();
    });

    // La corrida termina la foto que empezó, y el guion se queda sin el bloque.
    expect(acciones).toEqual(['avanza', 'gira', 'pinta']);
    expect(buscarBloque(vista.result.current.programa, b.id)).toBeNull();
    expect(vista.result.current.corriendo).toBe(false);
  });

  it('con velocidad 0 no se programa ni un temporizador; ⏹ corta la corrida', () => {
    jest.useFakeTimers();
    try {
      const { vista, acciones } = usarBloques(guion(bloque('avanza'), bloque('gira')));
      act(() => {
        vista.result.current.correr();
      });
      expect(jest.getTimerCount()).toBe(0);
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(acciones).toEqual([]);

      act(() => {
        vista.result.current.parar();
      });
      expect(vista.result.current.corriendo).toBe(false);
      expect(vista.result.current.parte?.fin).toBe('cortado');
    } finally {
      jest.useRealTimers();
    }
  });

  it('con reloj, pausar deja de avanzar y continuar sigue donde estaba', () => {
    jest.useFakeTimers();
    try {
      const { vista, acciones } = usarBloques(
        guion(bloque('avanza'), bloque('gira'), bloque('pinta')),
        { velocidad: 100 },
      );
      act(() => {
        vista.result.current.correr();
      });
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(acciones).toEqual(['avanza']);

      act(() => {
        vista.result.current.pausar();
      });
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(acciones).toEqual(['avanza']);

      act(() => {
        vista.result.current.continuar();
      });
      act(() => {
        // Dos tics para las dos órdenes que faltan y uno más para cerrar el
        // guion: el último paso no ejecuta nada, sólo se encuentra el final.
        jest.advanceTimersByTime(400);
      });
      expect(acciones).toEqual(['avanza', 'gira', 'pinta']);
      expect(vista.result.current.corriendo).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });
});

/* ══ 4 · la ventana: lo único que el DOM añade ═════════════════════════════ */

function Banco({ inicial }: { inicial: Programa }) {
  const [categoria, setCategoria] = useState('mov');
  const bl = useBloques({ catalogo: CATALOGO, inicial, velocidad: 0, preguntar: NUNCA });
  return (
    <VentanaBloques
      catalogo={CATALOGO}
      categorias={CATEGORIAS}
      categoria={categoria}
      onCategoria={setCategoria}
      programa={bl.programa}
      elegida={bl.elegida}
      nodoActivo={bl.nodoActivo}
      corriendo={bl.corriendo}
      enPausa={bl.enPausa}
      rechazo={bl.rechazo}
      aviso={bl.aviso}
      escenario={<p>mi cuadrícula</p>}
      onElegir={bl.elegir}
      onSoltar={bl.soltar}
      onQuitar={bl.quitarBloque}
      onCorrer={bl.correr}
      onPaso={bl.pasoAPaso}
      onParar={bl.parar}
    />
  );
}

function zona(clave: string): HTMLElement {
  const encontrada = screen.getAllByTestId('blq-zona').find((z) => z.dataset.sitio === clave);
  if (!encontrada) throw new Error(`no hay zona ${clave}`);
  return encontrada;
}

function soltarEn(el: HTMLElement, texto: string) {
  fireEvent.drop(el, { dataTransfer: { getData: () => texto } });
}

describe('la ventana', () => {
  it('la zona que se pinta verde es la que acepta, y la que no, rebota y lo explica', () => {
    render(<Banco inicial={guion()} />);
    // El escenario es de la actividad y la ventana sólo le hace sitio.
    expect(screen.getByTestId('blq-escenario')).toHaveTextContent('mi cuadrícula');

    // Con una orden en la mano, la cola del guion se ilumina.
    fireEvent.click(screen.getByText('avanza una casilla'));
    expect(zona('pila:p1:0').dataset.diana).toBe('si');
    soltarEn(zona('pila:p1:0'), 'ficha:avanza');
    expect(screen.getAllByTestId('blq-bloque')).toHaveLength(1);

    // Con una pregunta en la mano, esa misma zona NO se ilumina...
    fireEvent.click(screen.getByRole('button', { name: 'Sensores' }));
    fireEvent.click(screen.getByText('¿hay muro delante?'));
    expect(zona('pila:p1:1').dataset.diana).toBeUndefined();

    // ...y soltarla ahí rebota, con el porqué escrito para el alumno.
    soltarEn(zona('pila:p1:1'), 'ficha:muro');
    expect(screen.getAllByTestId('blq-bloque')).toHaveLength(1);
    expect(screen.getByTestId('blq-aviso')).toHaveTextContent('no es una orden');
    expect(zona('pila:p1:1').dataset.rebote).toBe('si');
  });

  it('sin arrastre: tocar la pieza y tocar el hueco; y el bloque que corre se ilumina', () => {
    const si = bloque('si', { ramas: { cuerpo: [] } });
    render(<Banco inicial={guion(si, bloque('avanza'))} />);

    // La segunda vía de encaje, la que funciona con dedo y con teclado.
    fireEvent.click(screen.getByRole('button', { name: 'Sensores' }));
    fireEvent.click(screen.getByText('¿hay muro delante?'));
    fireEvent.click(screen.getByRole('button', { name: 'la pregunta' }));
    expect(screen.getByText('¿hay muro delante?', { selector: '.blq-texto' })).toBeInTheDocument();

    // Un paso: se ilumina el `si` y nadie más.
    fireEvent.click(screen.getByRole('button', { name: 'Un bloque' }));
    const encendidos = screen.getAllByTestId('blq-bloque').filter((b) => b.dataset.activo === 'si');
    expect(encendidos).toHaveLength(1);
    expect(encendidos[0].dataset.bloque).toBe(si.id);

    // Y la ✕ devuelve el bloque a la paleta.
    fireEvent.click(screen.getByRole('button', { name: 'Quitar avanza una casilla' }));
    expect(screen.queryByText('avanza una casilla', { selector: '.blq-texto' })).toBeNull();
  });
});
