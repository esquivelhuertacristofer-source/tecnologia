/**
 * TECNIA DISEÑO · las preguntas que una clase le hace al dibujo
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Esto es lo que convierte el editor en una clase. El molde es literal:
 * `office/motor-diapos/consultas.ts`. Puro, sin DOM, comprobable sin navegador
 * — que es lo que permitió que 154 clases de Word corrigieran **leyendo el
 * documento** en vez de vigilando qué botón se pulsó (§36.3).
 *
 * ── LA REGLA DEL ARCHIVO ───────────────────────────────────────────────────
 *
 * **Ninguna función de aquí puede usar un número decimal ni una tolerancia.**
 * Recuento al cerrarlo: **cero decimales, cero épsilons**. Los tres sitios
 * donde a otro motor le habría salido un decimal, y cómo se evitan:
 *
 * 1. «¿Está centrado?» → el centro se cuenta en **medias casillas**
 *    (`2·col + cols`), que es entero siempre. Comparar centros es comparar
 *    enteros.
 * 2. «¿La foto está deformada?» → **multiplicación cruzada**:
 *    `cols · natFilas === filas · natCols`. Nunca se divide, así que nunca
 *    aparece 1,3333.
 * 3. «¿Usó menos de cuatro colores?» → se cuentan los colores **como se ven**
 *    (el `css` resuelto), no los identificadores. Dos botes distintos que
 *    pintan el mismo azul son un color, porque al alumno se le enseña uno.
 *    Es la regla de la casa: dos cosas son iguales si se enseñan iguales.
 *
 * La única pregunta que necesita al navegador es «¿el texto se sale de su
 * caja?», y vive en `verificar.ts` preguntándoselo al propio elemento con un
 * booleano del motor de maquetación, que tampoco lleva tolerancia.
 */

import {
  capaDe,
  cajaEntera,
  centroX2,
  dentroDelLienzo,
  enLaRejilla,
  paginaDe,
  seTapan,
  type Caja,
  type Capa,
  type CapaId,
  type CapaImagen,
  type CapaTexto,
  type Documento,
  type PaginaId,
  type Recurso,
} from './modelo';

/* ── lo que hay ───────────────────────────────────────────────────────────── */

export const capasDe = (doc: Documento, pagina: PaginaId): Capa[] => paginaDe(doc, pagina)?.capas ?? [];

/** Las que de verdad se ven: ni ocultas ni transparentes del todo. */
export const visibles = (doc: Documento, pagina: PaginaId): Capa[] =>
  capasDe(doc, pagina).filter((c) => !c.oculta && c.opacidad > 0);

export const textosDe = (doc: Documento, pagina: PaginaId): CapaTexto[] =>
  capasDe(doc, pagina).filter((c): c is CapaTexto => c.tipo === 'texto');

export const imagenesDe = (doc: Documento, pagina: PaginaId): CapaImagen[] =>
  capasDe(doc, pagina).filter((c): c is CapaImagen => c.tipo === 'imagen');

export const cuantasCapas = (doc: Documento, pagina: PaginaId): number => capasDe(doc, pagina).length;

/* ── sitio ────────────────────────────────────────────────────────────────── */

/** ¿Está centrada de izquierda a derecha? Enteros contra enteros. */
export function estaCentradaH(doc: Documento, pagina: PaginaId, capa: CapaId): boolean {
  const c = capaDe(doc, pagina, capa);
  return !!c && centroX2(c.caja).x === doc.lienzo.cols;
}

/** ¿Y de arriba abajo? */
export function estaCentradaV(doc: Documento, pagina: PaginaId, capa: CapaId): boolean {
  const c = capaDe(doc, pagina, capa);
  return !!c && centroX2(c.caja).y === doc.lienzo.filas;
}

export type Borde = 'izq' | 'der' | 'centro' | 'arriba' | 'abajo' | 'medio';

/** El número entero que define ese borde para una caja. */
export function bordeDe(caja: Caja, borde: Borde): number {
  switch (borde) {
    case 'izq':
      return caja.col;
    case 'der':
      return caja.col + caja.cols;
    case 'centro':
      return centroX2(caja).x;
    case 'arriba':
      return caja.fila;
    case 'abajo':
      return caja.fila + caja.filas;
    case 'medio':
      return centroX2(caja).y;
  }
}

/**
 * ¿Están alineadas por ese borde? Sin «casi»: o el entero es el mismo o no.
 * Con menos de dos capas la pregunta no significa nada y devuelve `false`,
 * que es más honesto que decir que sí.
 */
export function alineadas(doc: Documento, pagina: PaginaId, ids: readonly CapaId[], borde: Borde): boolean {
  const cajas = ids.map((id) => capaDe(doc, pagina, id)?.caja).filter((c): c is Caja => !!c);
  if (cajas.length < 2 || cajas.length !== ids.length) return false;
  const primero = bordeDe(cajas[0], borde);
  return cajas.every((c) => bordeDe(c, borde) === primero);
}

/** Cuántas casillas quedan libres a cada lado del conjunto de lo dibujado. */
export function margenes(doc: Documento, pagina: PaginaId): {
  izq: number;
  der: number;
  arriba: number;
  abajo: number;
} {
  const cajas = visibles(doc, pagina).map((c) => c.caja);
  if (cajas.length === 0) {
    return { izq: doc.lienzo.cols, der: doc.lienzo.cols, arriba: doc.lienzo.filas, abajo: doc.lienzo.filas };
  }
  return {
    izq: Math.min(...cajas.map((c) => c.col)),
    der: doc.lienzo.cols - Math.max(...cajas.map((c) => c.col + c.cols)),
    arriba: Math.min(...cajas.map((c) => c.fila)),
    abajo: doc.lienzo.filas - Math.max(...cajas.map((c) => c.fila + c.filas)),
  };
}

/** Las que no caben enteras en el lienzo. Debería ser siempre vacío. */
export const fueraDelLienzo = (doc: Documento, pagina: PaginaId): CapaId[] =>
  capasDe(doc, pagina)
    .filter((c) => !dentroDelLienzo(c.caja, doc.lienzo))
    .map((c) => c.id);

/** Las que se salieron de la rejilla. Si esto no es vacío, el modelo se rompió. */
export const sueltas = (doc: Documento, pagina: PaginaId): CapaId[] =>
  capasDe(doc, pagina)
    .filter((c) => !enLaRejilla(c.caja))
    .map((c) => c.id);

/* ── quién tapa a quién ───────────────────────────────────────────────────── */

/**
 * Una zona del lienzo relativa a una capa: «la cara está en las dos casillas de
 * arriba en medio de la foto». Se desplaza con la capa, así que la pregunta
 * sigue valiendo después de moverla.
 *
 * Aviso honesto: **no escala con la capa**. Si el alumno agranda la foto, la
 * zona sigue midiendo lo que medía. Escalarla exigiría dividir, y dividir trae
 * el decimal que este archivo no admite; la alternativa —zonas en fracciones—
 * mentiría en cuanto la división no fuera exacta.
 */
export function zonaDeCapa(doc: Documento, pagina: PaginaId, capa: CapaId, rel: Caja): Caja | null {
  const c = capaDe(doc, pagina, capa);
  if (!c) return null;
  return { col: c.caja.col + rel.col, fila: c.caja.fila + rel.fila, cols: rel.cols, filas: rel.filas };
}

/**
 * Qué se ve encima de esa zona: «¿hay algo tapando la cara?».
 *
 * `desde` es la capa a partir de la cual cuenta —lo que esté por debajo no
 * tapa nada— y normalmente es la propia foto. Lo que se compara son las cajas:
 * el giro es visual y no cambia la huella en la rejilla (ver `modelo.ts`), así
 * que una capa girada tapa si su caja tapa. Es un criterio conservador y está
 * escrito aquí para que nadie lo descubra por su cuenta dentro de una clase.
 */
export function tapanLaZona(doc: Documento, pagina: PaginaId, zona: Caja, desde?: CapaId): CapaId[] {
  const capas = capasDe(doc, pagina);
  const i = desde ? capas.findIndex((c) => c.id === desde) : -1;
  return capas
    .slice(i + 1)
    .filter((c) => !c.oculta && c.opacidad > 0 && c.id !== desde && seTapan(c.caja, zona))
    .map((c) => c.id);
}

/** Quién está por encima de esa capa y la pisa. */
export function tapadaPor(doc: Documento, pagina: PaginaId, capa: CapaId): CapaId[] {
  const c = capaDe(doc, pagina, capa);
  return c ? tapanLaZona(doc, pagina, c.caja, capa) : [];
}

/** Todos los pares que se pisan, en orden. Para el veredicto. */
export function paresQueSeTapan(doc: Documento, pagina: PaginaId): [CapaId, CapaId][] {
  const capas = visibles(doc, pagina);
  const pares: [CapaId, CapaId][] = [];
  for (let i = 0; i < capas.length; i += 1) {
    for (let j = i + 1; j < capas.length; j += 1) {
      if (seTapan(capas[i].caja, capas[j].caja)) pares.push([capas[i].id, capas[j].id]);
    }
  }
  return pares;
}

/* ── color ────────────────────────────────────────────────────────────────── */

/**
 * Los colores que se VEN en esa pantalla, resueltos a lo que pinta el
 * navegador. Cuenta el fondo si lo hay, y no cuenta lo oculto.
 */
export function coloresUsados(doc: Documento, pagina: PaginaId): Set<string> {
  const vistos = new Set<string>();
  const meter = (id: string | null | undefined) => {
    if (!id) return;
    const css = doc.paleta[id]?.css;
    if (css) vistos.add(css);
  };
  meter(paginaDe(doc, pagina)?.fondo);
  for (const c of visibles(doc, pagina)) {
    if (c.tipo === 'forma') {
      meter(c.relleno);
      meter(c.borde);
    }
    if (c.tipo === 'texto') meter(c.color);
  }
  return vistos;
}

export const cuantosColores = (doc: Documento, pagina: PaginaId): number => coloresUsados(doc, pagina).size;

/**
 * Dos tintas distintas que pintan lo mismo. No es un error del alumno: es un
 * error de la paleta que le pasó la clase, y por eso lo cuenta `verificar()`.
 */
export function tintasRepetidas(doc: Documento): string[] {
  const porCss = new Map<string, string[]>();
  for (const [id, t] of Object.entries(doc.paleta)) {
    porCss.set(t.css, [...(porCss.get(t.css) ?? []), id]);
  }
  return [...porCss.values()].filter((ids) => ids.length > 1).map((ids) => ids.join('='));
}

/* ── texto y jerarquía ────────────────────────────────────────────────────── */

export const textosVacios = (doc: Documento, pagina: PaginaId): CapaId[] =>
  textosDe(doc, pagina)
    .filter((c) => c.texto.trim() === '')
    .map((c) => c.id);

export function palabrasEn(doc: Documento, pagina: PaginaId, capa: CapaId): number {
  const c = capaDe(doc, pagina, capa);
  if (!c || c.tipo !== 'texto') return 0;
  return c.texto.trim().split(/\s+/).filter(Boolean).length;
}

/** Los textos ordenados de mayor a menor. Empate = mismo tamaño, sin desempate. */
export const porTamano = (doc: Documento, pagina: PaginaId): CapaTexto[] =>
  [...textosDe(doc, pagina)].sort((a, b) => b.pt - a.pt);

/**
 * ¿Hay jerarquía? Las dos condiciones que enseña un cartel:
 * el texto más grande es **estrictamente** más grande que todos los demás, y
 * además está **por encima** de todos ellos. Con una sola no basta: un pie de
 * foto enorme abajo cumple la primera y es justo el error que se corrige.
 */
export function hayJerarquia(doc: Documento, pagina: PaginaId): boolean {
  const t = porTamano(doc, pagina);
  if (t.length < 2) return false;
  const [mayor, ...resto] = t;
  return resto.every((c) => c.pt < mayor.pt) && resto.every((c) => c.caja.fila >= mayor.caja.fila + mayor.caja.filas);
}

/** Lo dibujado, de arriba abajo y de izquierda a derecha. El orden de lectura. */
export const ordenDeLectura = (doc: Documento, pagina: PaginaId): CapaId[] =>
  [...visibles(doc, pagina)]
    .sort((a, b) => a.caja.fila - b.caja.fila || a.caja.col - b.caja.col)
    .map((c) => c.id);

/* ── imágenes y licencias ─────────────────────────────────────────────────── */

export function recursosUsados(doc: Documento): Recurso[] {
  const ids = new Set<string>();
  for (const p of doc.paginas) for (const c of p.capas) if (c.tipo === 'imagen') ids.add(c.recurso);
  return [...ids].map((id) => doc.banco[id]).filter((r): r is Recurso => !!r);
}

/**
 * Imágenes que piden crédito y no lo tienen. «Tiene crédito» = el nombre del
 * autor aparece en algún texto del documento. Comparación de cadenas sin
 * acentos ni mayúsculas — que no es una tolerancia numérica: es cómo se
 * compara texto en todo el proyecto.
 */
export function sinCreditar(doc: Documento): Recurso[] {
  const escrito = doc.paginas
    .flatMap((p) => p.capas)
    .filter((c): c is CapaTexto => c.tipo === 'texto')
    .map((c) => normal(c.texto))
    .join(' · ');
  return recursosUsados(doc).filter((r) => r.licencia === 'atribucion' && !escrito.includes(normal(r.autor)));
}

const normal = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/**
 * ¿La foto está deformada? **Multiplicación cruzada, nunca división.**
 * `cols · natFilas === filas · natCols`. Sin recurso o sin proporción natural,
 * no hay nada que deformar y devuelve `false`.
 */
export function estaDeformada(doc: Documento, pagina: PaginaId, capa: CapaId): boolean {
  const c = capaDe(doc, pagina, capa);
  if (!c || c.tipo !== 'imagen') return false;
  const nat = doc.banco[c.recurso]?.proporcion;
  if (!nat) return false;
  const entera = cajaEntera(c);
  return entera.cols * nat.filas !== entera.filas * nat.cols;
}

export const deformadas = (doc: Documento, pagina: PaginaId): CapaId[] =>
  imagenesDe(doc, pagina)
    .filter((c) => estaDeformada(doc, pagina, c.id))
    .map((c) => c.id);

/* ── prototipo: pantallas y enlaces ───────────────────────────────────────── */

/** A qué pantallas se puede llegar tocando cosas, empezando por la primera. */
export function alcanzables(doc: Documento): PaginaId[] {
  const primera = doc.paginas[0];
  if (!primera) return [];
  const vistas = new Set<PaginaId>([primera.id]);
  const cola = [primera.id];
  while (cola.length) {
    const actual = cola.shift() as PaginaId;
    for (const c of capasDe(doc, actual)) {
      if (c.enlaceA && !vistas.has(c.enlaceA) && paginaDe(doc, c.enlaceA)) {
        vistas.add(c.enlaceA);
        cola.push(c.enlaceA);
      }
    }
  }
  return [...vistas];
}

/** Las pantallas a las que no lleva ningún botón. El defecto de un prototipo. */
export function huerfanas(doc: Documento): PaginaId[] {
  const llegables = new Set(alcanzables(doc));
  return doc.paginas.filter((p) => !llegables.has(p.id)).map((p) => p.id);
}

/** Enlaces que apuntan a una pantalla que ya no existe. */
export function enlacesRotos(doc: Documento): CapaId[] {
  return doc.paginas
    .flatMap((p) => p.capas)
    .filter((c) => c.enlaceA !== undefined && !paginaDe(doc, c.enlaceA))
    .map((c) => c.id);
}
