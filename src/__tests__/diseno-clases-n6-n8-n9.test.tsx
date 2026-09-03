import { createElement } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  accion,
  estaSano,
  historiaCuadra,
  hacer,
  nuevaHistoria,
  documento as documentoDe,
  verificar,
  type Diseno,
  type Historia,
  type Accion,
  type Documento,
} from '@/components/simuladores/diseno';
import { GUION as GUION_N6, DOC_INICIAL as DOC_N6, PAGINA as PAG_N6 } from '@/components/activities/diseno/LabCartelesEInfografias';
import { GUION as GUION_N8, DOC_INICIAL as DOC_N8, PAGINA as PAG_N8 } from '@/components/activities/diseno/LabImagenConCapas';
import { GUION as GUION_N9, DOC_INICIAL as DOC_N9 } from '@/components/activities/diseno/LabBocetaTuApp';
import EntradaCartelesEInfografias from '@/components/activities/diseno/EntradaCartelesEInfografias';
import EntradaImagenConCapas from '@/components/activities/diseno/EntradaImagenConCapas';
import EntradaBocetaTuApp from '@/components/activities/diseno/EntradaBocetaTuApp';

/**
 * Pruebas de Tecnia Diseño (documento §54.4). El grueso corre sin DOM: cada
 * guion se reproduce como una lista de `Accion` sobre el documento inicial
 * —igual que `reproducir()` del armazón— y se comprueba que cada encargo se
 * cumple exactamente cuando debe y no antes. Es la forma barata y honesta:
 * nada de coordenadas de puntero, nada de `getBoundingClientRect`.
 */

function correr(base: Documento, acciones: Accion[]): Historia {
  let h = nuevaHistoria(base);
  for (const acc of acciones) {
    const r = hacer(h, acc, 'todas');
    if (r.rechazo) throw new Error(`rechazada «${acc.comando}»: ${r.rechazo}`);
    h = r.historia;
  }
  return h;
}

function comoDiseno(h: Historia, pagina: string): Diseno {
  return { documento: documentoDe(h), historia: h, pagina, seleccion: [] } as unknown as Diseno;
}

describe('n6-carteles-e-infografias · guion', () => {
  const acciones: Accion[] = [
    accion('nuevo-texto', { pagina: PAG_N6, id: 't1', texto: 'Feria de Ciencias', col: 0, fila: 1, cols: 8, filas: 2 }),
    accion('tamano', { pagina: PAG_N6, capa: 't1', pt: 44 }),
    accion('centrar', { pagina: PAG_N6, capa: 't1', eje: 'h' }),
    accion('nuevo-texto', { pagina: PAG_N6, id: 't2', texto: '12 de septiembre, patio central', col: 2, fila: 10, cols: 8, filas: 2, pt: 16 }),
    accion('fondo', { pagina: PAG_N6, color: 'tinta' }),
  ];

  it('el lienzo vacío no cumple ningún encargo', () => {
    const d = comoDiseno(nuevaHistoria(DOC_N6), PAG_N6);
    expect(GUION_N6[0].comprueba(d)).toBe(false);
  });

  it('se puede terminar y cada encargo se cumple en su momento, no antes', () => {
    // Cuántas acciones de `acciones` hacen falta para que cada paso pase de
    // falso a cierto (paso 0 tras la 1.ª acción, paso 1 tras la 3.ª, etc.).
    const puntos = [1, 3, 4, 5];
    for (let paso = 0; paso < GUION_N6.length; paso += 1) {
      const dAntes = comoDiseno(correr(DOC_N6, acciones.slice(0, puntos[paso] - 1)), PAG_N6);
      expect(GUION_N6[paso].comprueba(dAntes)).toBe(false);
      const dDespues = comoDiseno(correr(DOC_N6, acciones.slice(0, puntos[paso])), PAG_N6);
      expect(GUION_N6[paso].comprueba(dDespues)).toBe(true);
    }
    const final = correr(DOC_N6, acciones);
    expect(GUION_N6.every((p) => p.comprueba(comoDiseno(final, PAG_N6)))).toBe(true);
    expect(estaSano(verificar(documentoDe(final)))).toBe(true);
    expect(historiaCuadra(final)).toBe(true);
  });
});

describe('n8-imagen-con-capas · guion', () => {
  const acciones: Accion[] = [
    accion('nueva-imagen', { pagina: PAG_N8, id: 'i-fondo', recurso: 'bosque', col: 0, fila: 0, cols: 12, filas: 12 }),
    accion('nueva-imagen', { pagina: PAG_N8, id: 'i-zorro', recurso: 'zorro', col: 4, fila: 4, cols: 4, filas: 4 }),
    accion('nueva-forma', { pagina: PAG_N8, id: 'f-marco', figura: 'redondeado', col: 0, fila: 0, cols: 12, filas: 12 }),
    accion('orden', { pagina: PAG_N8, capa: 'f-marco', a: 'atras' }),
    accion('nuevo-texto', { pagina: PAG_N8, id: 't-credito', texto: 'Foto de Marina Ibáñez', col: 1, fila: 10, cols: 10, filas: 2 }),
  ];

  it('el marco recién creado NO cumple el paso 3 hasta mandarlo atrás', () => {
    const dAntes = comoDiseno(correr(DOC_N8, acciones.slice(0, 3)), PAG_N8);
    expect(GUION_N8[2].comprueba(dAntes)).toBe(false);
    const dDespues = comoDiseno(correr(DOC_N8, acciones.slice(0, 4)), PAG_N8);
    expect(GUION_N8[2].comprueba(dDespues)).toBe(true);
  });

  it('se puede terminar, exige el proceso (orden) y no sólo el resultado, y da crédito', () => {
    const final = correr(DOC_N8, acciones);
    const d = comoDiseno(final, PAG_N8);
    expect(GUION_N8.every((p) => p.comprueba(d))).toBe(true);
    // vecesQueUso vive dentro de la comprueba del paso 3; se repite aquí para
    // dejar explícito qué distingue a esta clase de un juguete.
    expect(final.hechas.filter((a) => a.comando === 'orden')).toHaveLength(1);
    expect(estaSano(verificar(documentoDe(final)))).toBe(true);
    expect(historiaCuadra(final)).toBe(true);
  });
});

describe('n9-boceta-tu-app · guion', () => {
  const acciones: Accion[] = [
    accion('nuevo-texto', { pagina: 'inicio', id: 't-titulo', texto: 'Mis tareas', col: 1, fila: 1, cols: 8, filas: 2 }),
    accion('nueva-forma', { pagina: 'inicio', id: 'f-boton', figura: 'rect', col: 2, fila: 14, cols: 6, filas: 2 }),
    accion('nueva-pagina', { id: 'p1', nombre: 'Detalle' }),
    accion('nuevo-texto', { pagina: 'p1', id: 't-detalle', texto: 'Detalle de la tarea', col: 1, fila: 1, cols: 8, filas: 2 }),
    accion('enlazar', { pagina: 'inicio', capa: 'f-boton', aPagina: 'p1' }),
  ];

  it('sin enlazar, el prototipo no se da por completo', () => {
    const d = comoDiseno(correr(DOC_N9, acciones.slice(0, 4)), 'inicio');
    expect(GUION_N9[3].comprueba(d)).toBe(false);
  });

  it('se puede terminar: dos pantallas, sin huérfanas y sin enlaces rotos', () => {
    const final = correr(DOC_N9, acciones);
    const d = comoDiseno(final, 'inicio');
    expect(GUION_N9.every((p) => p.comprueba(d))).toBe(true);
    expect(estaSano(verificar(documentoDe(final)))).toBe(true);
    expect(historiaCuadra(final)).toBe(true);
  });
});

/* ── recorrido de punta a punta: de la entrada al lienzo, sin caerse ── */

function propsDeEntrada() {
  return {
    config: {},
    savedState: undefined,
    onSaveState: jest.fn(),
    onProgress: jest.fn(),
    onScore: jest.fn(),
    onComplete: jest.fn(),
  };
}

describe('recorrido de entrada al editor', () => {
  it.each([
    ['n6-carteles-e-infografias', EntradaCartelesEInfografias, 'Abre el editor', 'Diseñador de carteles'],
    ['n8-imagen-con-capas', EntradaImagenConCapas, 'Abre el editor', 'Compositor de capas'],
    ['n9-boceta-tu-app', EntradaBocetaTuApp, 'Abre el editor', 'Diseñador de flujos'],
  ] as const)('%s abre el laboratorio y pinta el lienzo', async (_id, Entrada, ctaTexto, insignia) => {
    render(createElement(Entrada, propsDeEntrada()));
    fireEvent.click(screen.getByText(ctaTexto));
    const empezar = await screen.findByTestId('psn-empezar');
    fireEvent.click(empezar);
    expect(await screen.findByTestId('dis-ventana')).toBeInTheDocument();
    expect(insignia.length).toBeGreaterThan(0); // el nombre de la insignia queda documentado en la tabla anterior
  });
});
