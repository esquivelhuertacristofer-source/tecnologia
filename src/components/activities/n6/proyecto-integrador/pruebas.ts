import type { Marcador, MapaSitios } from '@/components/simuladores/navegador';
import type { Mazo } from '@/components/office/motor-diapos/mazo';
import { textoEn } from '@/components/office/motor-diapos/mazo';
import type { GraficoId } from '@/components/office/motor-diapos/modelo';
import { ID_DE_URL, URL_ANUNCIO, URL_ESCUELA } from './mapaSitios';

/**
 * `n6-proyecto-integrador` · el hilo que cose el acto 1 con el acto 2.
 *
 * **Es literalmente lo que hace que la clase integre** (DISEÑO, «Aparato
 * nuevo»): `desdeMarcadores` es la única pieza de este proyecto que no existe
 * en ningún armazón. Pura, sin React, para que una prueba la llame sin montar
 * nada.
 */

export type TipoPrueba = 'articulo' | 'anuncio' | 'medicion';

export interface Prueba {
  id: string;
  titulo: string;
  fuente: string;
  autor: string | null;
  fecha: string | null;
  tipo: TipoPrueba;
}

/** Lo que el alumno marcó con la estrella en el acto 1, convertido en pruebas. */
export function desdeMarcadores(marcadores: Marcador[], mapa: MapaSitios): Prueba[] {
  return marcadores.map((m): Prueba => {
    const pagina = mapa[m.url];
    const tipo: TipoPrueba = m.url === URL_ESCUELA ? 'medicion' : m.url === URL_ANUNCIO ? 'anuncio' : 'articulo';
    return {
      id: ID_DE_URL[m.url] ?? m.url,
      titulo: m.titulo,
      fuente: pagina?.pestana ?? m.titulo,
      autor: pagina?.autor ?? null,
      fecha: pagina?.fecha ?? null,
      tipo,
    };
  });
}

/* ── las seis afirmaciones (E4) ───────────────────────────────────────────── */

export interface Afirmacion {
  id: string;
  texto: string;
  /** ¿La sostiene la tabla del grupo? Sólo tres de las seis. */
  sostenida: boolean;
  /** Sólo las sostenidas tienen una gráfica que les habla. */
  tipoCorrecto?: GraficoId;
  /** Sólo las sostenidas tienen una propuesta que se deduce de ellas (E9). */
  propuesta?: string;
}

export const AFIRMACIONES: Afirmacion[] = [
  {
    id: 'mas-papel',
    texto: 'Lo que más se tira es papel',
    sostenida: true,
    tipoCorrecto: 'barras',
    propuesta: 'Poner un contenedor especial para el papel, junto al bote',
  },
  {
    id: 'jueves-mas',
    texto: 'El jueves fue el día de más basura',
    sostenida: true,
    tipoCorrecto: 'lineas',
    propuesta: 'Recoger la basura los jueves con una bolsa extra, porque ese día se junta más',
  },
  {
    id: 'comida-cuarta',
    texto: 'La comida es menos de la cuarta parte del total',
    sostenida: true,
    tipoCorrecto: 'pastel',
    propuesta: 'Separar la comida en un bote aparte: de las cuatro, es la que menos pesa',
  },
  { id: 'pais-plastico', texto: 'En las escuelas del país se tira sobre todo plástico', sostenida: false },
  { id: 'papel-bajo', texto: 'El papel bajó respecto al año pasado', sostenida: false },
  { id: 'otro-bote', texto: 'Si ponemos otro bote se tirará menos', sostenida: false },
];

export const AFIRMACIONES_SOSTENIDAS = AFIRMACIONES.filter((a) => a.sostenida);

const pelado = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[¿?¡!.,;:·]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

/**
 * En qué diapositiva está la afirmación — buscada por CONTENIDO, no por
 * índice. «Borrar la diapositiva 1 en mitad del acto 2» (pliego, jugar MAL 8)
 * corre todos los índices; un `mazo.diapositivas[1]` a mano se habría roto ahí.
 */
function indiceDeLaAfirmacion(mazo: Mazo): number {
  return mazo.diapositivas.findIndex((_, i) => {
    const t = textoEn(mazo, i, 'titulo');
    if (!t) return false;
    const p = pelado(t);
    return AFIRMACIONES.some((a) => pelado(a.texto) === p);
  });
}

/** La afirmación que el alumno escribió como título de SU diapositiva, o null. */
export function afirmacionDe(mazo: Mazo): Afirmacion | null {
  const i = indiceDeLaAfirmacion(mazo);
  if (i === -1) return null;
  const t = pelado(textoEn(mazo, i, 'titulo') ?? '');
  return AFIRMACIONES.find((a) => pelado(a.texto) === t) ?? null;
}

/** El tipo de gráfico dibujado en ESA MISMA diapositiva, o null. */
export function tipoDeGraficoDe(mazo: Mazo): GraficoId | null {
  const i = indiceDeLaAfirmacion(mazo);
  if (i === -1) return null;
  const l = mazo.diapositivas[i]?.libres.find((x) => x.clase === 'grafico');
  return l && l.clase === 'grafico' ? ((l.variante as GraficoId) ?? null) : null;
}

/**
 * El predicado que demuestra que la clase integra (E5): la misma gráfica está
 * bien o mal según lo que el alumno escribió en el E4.
 */
export function sostiene(afirmacion: Afirmacion | null, tipo: GraficoId | null): boolean {
  return Boolean(afirmacion && afirmacion.sostenida && tipo !== null && tipo === afirmacion.tipoCorrecto);
}

/* ── la portada (E3) — «existe», no «la primera» ──────────────────────────── */

export function laPortadaEstaHecha(m: Mazo): boolean {
  return m.diapositivas.some((d) => {
    if (d.diseno !== 'portada') return false;
    const titulo = d.marcadores.find((x) => x.rol === 'titulo')?.contenido;
    const subtitulo = d.marcadores.find((x) => x.rol === 'subtitulo')?.contenido;
    return Boolean(titulo && titulo.trim() && subtitulo && subtitulo.trim());
  });
}

/* ── las fuentes (E6) — busca en TODO el mazo, no en «la cuarta» ──────────── */

export interface FuentesEnElMazo {
  medicion: boolean;
  articuloFirmado: boolean;
  anuncio: boolean;
}

export function fuentesEnElMazo(m: Mazo): FuentesEnElMazo {
  const imagenes = m.diapositivas.flatMap((d) => d.libres.filter((l) => l.clase === 'imagen'));
  return {
    medicion: imagenes.some((l) => l.contenido === 'medicion'),
    articuloFirmado: imagenes.some((l) => l.contenido === 'articulo-a' || l.contenido === 'articulo-b'),
    anuncio: imagenes.some((l) => l.contenido === 'anuncio'),
  };
}

export function lasFuentesEstanCompletas(m: Mazo): boolean {
  const f = fuentesEnElMazo(m);
  return f.medicion && f.articuloFirmado;
}
