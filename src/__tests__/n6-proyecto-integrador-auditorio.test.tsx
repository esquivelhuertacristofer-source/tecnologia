/**
 * `n6-proyecto-integrador` · los predicados del acto 3, probados como
 * funciones puras contra un `Mazo` fabricado a mano.
 *
 * Complementa a `n6-proyecto-integrador.test.tsx`, que recorre la clase de
 * punta a punta hasta donde jsdom deja llegar (E1–E6): el acto 3 vive dentro
 * de `Auditorio` con `acto="funcion"`, que monta un `<Canvas>` de
 * `@react-three/fiber`, y `jest.setup.ts` hace
 * `HTMLCanvasElement.getContext = jest.fn(() => null)` para todo el
 * proyecto — sin contexto WebGL la ficha del atril nunca llega al DOM. Este
 * archivo prueba la MISMA lógica que decide esas tres preguntas, sin montar
 * la escena: exactamente lo que `motor-diapos.test.ts` ya hace con el resto
 * de los guiones de PowerPoint.
 *
 * También prueba, aquí y no en el archivo de punta a punta, la regla del
 * §«el predicado que no se puede escribir mal»: los tres predicados leen el
 * mazo por CONTENIDO, así que sobreviven a que se borre la diapositiva 1
 * (jugar MAL, pliego §«Qué debe verificar», 8).
 */

import type { Mazo } from '@/components/office/motor-diapos/mazo';
import type { Diapositiva, Libre } from '@/components/office/motor-diapos/modelo';
import { decisionParaElPaso } from '@/components/activities/n6/proyecto-integrador/AuditorioDelProyecto';
import {
  afirmacionDe,
  fuentesEnElMazo,
  lasFuentesEstanCompletas,
  laPortadaEstaHecha,
  sostiene,
  tipoDeGraficoDe,
} from '@/components/activities/n6/proyecto-integrador/pruebas';

/* ── fábricas mínimas ─────────────────────────────────────────────────────── */

const portada = (titulo: string | null, subtitulo: string | null): Diapositiva => ({
  diseno: 'portada',
  marcadores: [
    { rol: 'titulo', contenido: titulo, casilla: null },
    { rol: 'subtitulo', contenido: subtitulo, casilla: null },
  ],
  libres: [],
});

const conAfirmacion = (titulo: string | null, grafico?: Libre['variante']): Diapositiva => ({
  diseno: 'titulo-texto',
  marcadores: [
    { rol: 'titulo', contenido: titulo, casilla: null },
    { rol: 'cuerpo', contenido: grafico ? null : 'Papel: 45\nPlástico: 30', casilla: null },
  ],
  libres: grafico
    ? [{ id: 'g1', clase: 'grafico', contenido: 'Gráfico', casilla: { col: 1, fila: 3, cols: 6, filas: 4 }, z: 1, variante: grafico }]
    : [],
});

const fuentes = (libres: Libre[]): Diapositiva => ({
  diseno: 'solo-titulo',
  marcadores: [{ rol: 'titulo', contenido: 'Fuentes', casilla: null }],
  libres,
});

const imagen = (id: string): Libre => ({ id, clase: 'imagen', contenido: id, casilla: { col: 1, fila: 1, cols: 1, filas: 1 }, z: 1 });

const mazo = (diapositivas: Diapositiva[]): Mazo => ({ tema: 'noche', activa: 0, diapositivas });

/* ── E3 · la portada, buscada por contenido ──────────────────────────────── */

describe('laPortadaEstaHecha', () => {
  it('falso mientras falte el título', () => {
    expect(laPortadaEstaHecha(mazo([portada(null, '¿Qué se tira?')]))).toBe(false);
  });

  it('verdadero con título y subtítulo puestos', () => {
    expect(laPortadaEstaHecha(mazo([portada('Mi proyecto', '¿Qué se tira?')]))).toBe(true);
  });

  it('sigue siendo verdadero si la portada YA NO ES la diapositiva 1 (jugar MAL 8: se borró la 1 y se rehizo al final)', () => {
    const m = mazo([conAfirmacion('Lo que más se tira es papel'), fuentes([]), portada('Mi proyecto', '¿Qué se tira?')]);
    expect(laPortadaEstaHecha(m)).toBe(true);
  });
});

/* ── E4/E5 · la afirmación y su gráfica, buscadas por contenido ──────────── */

describe('afirmacionDe / tipoDeGraficoDe / sostiene', () => {
  it('sin ninguna afirmación reconocible, todo da null/false y no revienta', () => {
    const m = mazo([portada(null, null), conAfirmacion(null)]);
    expect(afirmacionDe(m)).toBeNull();
    expect(tipoDeGraficoDe(m)).toBeNull();
    expect(sostiene(afirmacionDe(m), tipoDeGraficoDe(m))).toBe(false);
  });

  it('jugar MAL 6: una gráfica insertada ANTES de escribir la afirmación no hace reventar el predicado', () => {
    // El cuerpo tenía un texto que no es ninguna de las seis, y aun así se convirtió.
    const m = mazo([portada(null, null), conAfirmacion(null, 'barras')]);
    expect(sostiene(afirmacionDe(m), tipoDeGraficoDe(m))).toBe(false);
  });

  it('afirmación sostenida + su gráfica correcta → sostiene() da verdadero', () => {
    const m = mazo([portada('T', 'P'), conAfirmacion('Lo que más se tira es papel', 'barras')]);
    expect(afirmacionDe(m)?.id).toBe('mas-papel');
    expect(sostiene(afirmacionDe(m), tipoDeGraficoDe(m))).toBe(true);
  });

  it('afirmación sostenida + gráfica que no le habla → falso', () => {
    const m = mazo([portada('T', 'P'), conAfirmacion('El jueves fue el día de más basura', 'pastel')]);
    expect(sostiene(afirmacionDe(m), tipoDeGraficoDe(m))).toBe(false);
  });

  it('afirmación que la tabla NO sostiene → falso aunque la gráfica «coincida»', () => {
    const m = mazo([portada('T', 'P'), conAfirmacion('Si ponemos otro bote se tirará menos', 'barras')]);
    expect(afirmacionDe(m)?.sostenida).toBe(false);
    expect(sostiene(afirmacionDe(m), tipoDeGraficoDe(m))).toBe(false);
  });

  it('sigue leyendo bien aunque la diapositiva de la afirmación ya no sea la 2 (se borró la portada)', () => {
    const conPortadaBorrada = mazo([conAfirmacion('La comida es menos de la cuarta parte del total', 'pastel'), fuentes([])]);
    expect(afirmacionDe(conPortadaBorrada)?.id).toBe('comida-cuarta');
    expect(sostiene(afirmacionDe(conPortadaBorrada), tipoDeGraficoDe(conPortadaBorrada))).toBe(true);
  });
});

/* ── E6 · las fuentes, buscadas en TODO el mazo ──────────────────────────── */

describe('fuentesEnElMazo / lasFuentesEstanCompletas', () => {
  it('falso si sólo hay un artículo firmado y falta la medición', () => {
    const m = mazo([fuentes([imagen('articulo-a')])]);
    expect(lasFuentesEstanCompletas(m)).toBe(false);
  });

  it('verdadero con la medición y un artículo firmado, sin importar en qué diapositiva estén', () => {
    const m = mazo([portada('T', 'P'), fuentes([imagen('medicion')]), fuentes([imagen('articulo-b')])]);
    expect(lasFuentesEstanCompletas(m)).toBe(true);
  });

  it('jugar MAL 2: el anuncio pegado además de las dos buenas no bloquea ni resta el E6', () => {
    const m = mazo([fuentes([imagen('medicion'), imagen('articulo-a'), imagen('anuncio')])]);
    const f = fuentesEnElMazo(m);
    expect(f).toEqual({ medicion: true, articuloFirmado: true, anuncio: true });
    expect(lasFuentesEstanCompletas(m)).toBe(true);
  });
});

/* ── el acto 3 · qué decisión trae cada paso ─────────────────────────────── */

describe('decisionParaElPaso', () => {
  const conAfirmacionEnElMazo = (id: string) => {
    const textos: Record<string, string> = {
      'mas-papel': 'Lo que más se tira es papel',
      'jueves-mas': 'El jueves fue el día de más basura',
      'comida-cuarta': 'La comida es menos de la cuarta parte del total',
    };
    return mazo([portada('T', 'P'), conAfirmacion(textos[id])]);
  };

  it('ningún paso de los otros actos abre una decisión', () => {
    expect(decisionParaElPaso('la-portada', mazo([]))).toBeNull();
    expect(decisionParaElPaso(null, mazo([]))).toBeNull();
  });

  it('E7 lee lo que hay realmente en la diapositiva de fuentes (lo del E6), no un guion fijo', () => {
    // Camino limpio: sólo la medición y el artículo — sin trampa que ofrecer.
    const limpio = mazo([fuentes([imagen('medicion'), imagen('articulo-a')])]);
    const dLimpio = decisionParaElPaso('de-donde-sacaste-ese-numero', limpio);
    expect(dLimpio?.gesto).toBe('defender-fuente');
    expect(dLimpio?.opciones.map((o) => o.bien ?? false)).toEqual([true, true]);

    // Camino con el anuncio también pegado (jugar MAL 2): la trampa REAPARECE
    // aquí, como dice el pliego — y sigue siendo contestable.
    const conAnuncio = mazo([fuentes([imagen('medicion'), imagen('articulo-a'), imagen('anuncio')])]);
    const dConAnuncio = decisionParaElPaso('de-donde-sacaste-ese-numero', conAnuncio);
    expect(dConAnuncio?.opciones.map((o) => o.bien ?? false)).toEqual([true, true, false]);
  });

  it('E8 · la corona: sólo «eso no lo medimos» es correcta', () => {
    const d = decisionParaElPaso('y-en-las-otras-escuelas', mazo([]));
    expect(d?.opciones.map((o) => o.bien ?? false)).toEqual([false, false, true]);
  });

  it('E9 · la propuesta correcta depende de la afirmación que el alumno escribió en el E4', () => {
    const conPapel = decisionParaElPaso('que-proponen', conAfirmacionEnElMazo('mas-papel'));
    expect(conPapel?.opciones.find((o) => o.bien)?.texto).toMatch(/papel/);

    const conJueves = decisionParaElPaso('que-proponen', conAfirmacionEnElMazo('jueves-mas'));
    expect(conJueves?.opciones.find((o) => o.bien)?.texto).toMatch(/jueves/);

    // Sin ninguna afirmación reconocible en el mazo, ninguna propuesta es «la buena».
    const sinAfirmacion = decisionParaElPaso('que-proponen', mazo([portada('T', 'P')]));
    expect(sinAfirmacion?.opciones.every((o) => !o.bien)).toBe(true);
  });
});
