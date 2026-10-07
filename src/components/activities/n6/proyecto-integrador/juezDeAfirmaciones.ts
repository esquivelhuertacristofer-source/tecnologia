import type { GraficoId } from '@/components/office/motor-diapos/modelo';

/**
 * `n6-proyecto-integrador` · el juez de afirmaciones (§69.5, 6-oct-2026).
 *
 * Lee la frase que el alumno ESCRIBE como título de su diapositiva de datos
 * y la comprueba contra la tabla del salón, con números. Antes la clase
 * comparaba el título con seis frases fijas: escribir era copiar una de seis.
 *
 * No intenta entender cualquier español: entiende los cinco tipos de cosa
 * que se pueden decir con esta tabla (§69.5) y, para todo lo demás, dice qué
 * le falta a la frase. Lo que importa no es la gramática, es el veredicto:
 * sostenida, falsa, fuera de alcance (lo que no se midió) o no entiendo.
 *
 * Puro, sin React: se prueba contra frases sueltas.
 */

export type Categoria = 'papel' | 'plastico' | 'comida' | 'otros';
export type Dia = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes';
export type Veredicto = 'sostenida' | 'falsa' | 'fuera-de-alcance' | 'no-entiendo';

export const CATEGORIAS: Categoria[] = ['papel', 'plastico', 'comida', 'otros'];
export const DIAS: Dia[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

/** La medición del grupo. `mapaSitios.ts` la pinta; una prueba comprueba que dicen lo mismo. */
export const TABLA: Record<Dia, Record<Categoria, number>> = {
  lunes: { papel: 8, plastico: 5, comida: 3, otros: 2 },
  martes: { papel: 9, plastico: 6, comida: 4, otros: 2 },
  miercoles: { papel: 7, plastico: 5, comida: 3, otros: 3 },
  jueves: { papel: 12, plastico: 8, comida: 5, otros: 3 },
  viernes: { papel: 9, plastico: 6, comida: 3, otros: 2 },
};

const NOMBRE_CAT: Record<Categoria, string> = { papel: 'papel', plastico: 'plástico', comida: 'comida', otros: 'otros' };
const NOMBRE_DIA: Record<Dia, string> = { lunes: 'lunes', martes: 'martes', miercoles: 'miércoles', jueves: 'jueves', viernes: 'viernes' };

export type Tema = { clase: 'categoria'; categoria: Categoria } | { clase: 'dia'; dia: Dia; sentido: 'mas' | 'menos' };

export interface Juicio {
  veredicto: Veredicto;
  /** En palabras del alumno, con los números de la tabla. */
  motivo: string;
  /** La gráfica que habla de esta clase de frase. `null` si no hay nada que graficar. */
  tipo: GraficoId | null;
  /** De qué habla la frase: de ahí sale la propuesta del E9. */
  tema: Tema | null;
  /** Identifica la clase de frase y su tema, para comparar dos frases. */
  clave: string;
}

/* ── lectura ─────────────────────────────────────────────────────────────── */

export function pelado(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[¿?¡!.,;:·«»"'()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const PATRON_CAT: Record<Categoria, RegExp> = {
  papel: /\bpapel(es)?\b/,
  plastico: /\bplasticos?\b/,
  comida: /\b(comida|alimentos?)\b/,
  otros: /\b(otros|otras cosas)\b/,
};
const PATRON_DIA: Record<Dia, RegExp> = {
  lunes: /\blunes\b/,
  martes: /\bmartes\b/,
  miercoles: /\bmiercoles\b/,
  jueves: /\bjueves\b/,
  viernes: /\bviernes\b/,
};

/** Lo que aparece en la frase, en el orden en que aparece: el primero es el sujeto. */
function enOrden<T extends string>(n: string, patrones: Record<T, RegExp>): T[] {
  return (Object.keys(patrones) as T[])
    .map((k) => ({ k, i: n.search(patrones[k]) }))
    .filter((x) => x.i >= 0)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.k);
}

/** Lo que la tabla no puede decir, y cómo se le explica al alumno. */
const ALCANCE: { re: RegExp; de: string }[] = [
  { re: /\b(pais|mexico|mundo|ciudad|escuelas|otros salones|todos los salones)\b/, de: 'de otros salones, de otras escuelas ni del país' },
  { re: /\b(anos? pasados?|el otro ano|antes|bajo|subio|aumento|disminuyo|cada vez)\b/, de: 'de otros años ni de cómo cambia con el tiempo' },
  {
    re: /\b(se tirara|se tiraria|va a|van a|si ponemos|si pusieramos|habra|deberia|deberian|deberiamos|hay que|podriamos)\b/,
    de: 'de lo que pasaría o de lo que habría que hacer. Lo que propones va al final, cuando el público pregunte',
  },
  { re: /\b(siempre|nunca|todas las semanas|cada semana)\b/, de: 'de todas las semanas: mediste una' },
];

const FRACCIONES: { re: RegExp; f: number; nombre: string }[] = [
  { re: /\b(la )?mitad\b/, f: 1 / 2, nombre: 'la mitad' },
  { re: /\b(tercera parte|un tercio)\b/, f: 1 / 3, nombre: 'la tercera parte' },
  { re: /\b(cuarta parte|un cuarto)\b/, f: 1 / 4, nombre: 'la cuarta parte' },
  { re: /\bquinta parte\b/, f: 1 / 5, nombre: 'la quinta parte' },
  { re: /\bdecima parte\b/, f: 1 / 10, nombre: 'la décima parte' },
];

/* ── cuentas ─────────────────────────────────────────────────────────────── */

const deCategoria = (c: Categoria, dia?: Dia) => (dia ? TABLA[dia][c] : DIAS.reduce((s, d) => s + TABLA[d][c], 0));
const delDia = (d: Dia, c?: Categoria) => (c ? TABLA[d][c] : CATEGORIAS.reduce((s, k) => s + TABLA[d][k], 0));
export const TOTAL = DIAS.reduce((s, d) => s + delDia(d), 0);

/** Quiénes tienen el valor extremo (puede haber empate). */
function extremos<T>(lista: T[], valor: (x: T) => number, sentido: 'mas' | 'menos'): { ganadores: T[]; v: number } {
  const vs = lista.map(valor);
  const v = sentido === 'mas' ? Math.max(...vs) : Math.min(...vs);
  return { ganadores: lista.filter((_, i) => vs[i] === v), v };
}

interface Lectura {
  ok: boolean;
  motivo: string;
  tipo: GraficoId;
  tema: Tema;
  clave: string;
}

function superlativoDeCategoria(c: Categoria, sentido: 'mas' | 'menos', dia?: Dia): Lectura {
  const { ganadores, v } = extremos(CATEGORIAS, (k) => deCategoria(k, dia), sentido);
  const lista = CATEGORIAS.map((k) => `${NOMBRE_CAT[k]} ${deCategoria(k, dia)}`).join(', ');
  const donde = dia ? `el ${NOMBRE_DIA[dia]}` : 'en la semana';
  const ok = ganadores.length === 1 && ganadores[0] === c;
  let motivo = `${lista}, ${donde}.`;
  if (ganadores.includes(c) && ganadores.length > 1) motivo += ` ${cap(NOMBRE_CAT[c])} empata con ${ganadores.filter((g) => g !== c).map((g) => NOMBRE_CAT[g]).join(' y ')}: tienen ${v}.`;
  return { ok, motivo, tipo: 'barras', tema: { clase: 'categoria', categoria: c }, clave: `cat-${sentido}:${c}${dia ? '@' + dia : ''}` };
}

function compararCategorias(a: Categoria, b: Categoria, sentido: 'mas' | 'menos', dia?: Dia): Lectura {
  const va = deCategoria(a, dia);
  const vb = deCategoria(b, dia);
  const donde = dia ? ` el ${NOMBRE_DIA[dia]}` : ' en la semana';
  return {
    ok: sentido === 'mas' ? va > vb : va < vb,
    motivo: `${NOMBRE_CAT[a]} ${va} contra ${NOMBRE_CAT[b]} ${vb}${donde}.`,
    tipo: 'barras',
    tema: { clase: 'categoria', categoria: a },
    clave: `cat-vs:${a}-${b}`,
  };
}

function superlativoDeDia(d: Dia, sentido: 'mas' | 'menos', c?: Categoria): Lectura {
  const { ganadores, v } = extremos(DIAS, (k) => delDia(k, c), sentido);
  const que = c ? `de ${NOMBRE_CAT[c]}` : 'de basura';
  const lista = DIAS.map((k) => `${NOMBRE_DIA[k]} ${delDia(k, c)}`).join(', ');
  let motivo = `${que} por día: ${lista}.`;
  if (ganadores.includes(d) && ganadores.length > 1) motivo += ` El ${NOMBRE_DIA[d]} empata con ${ganadores.filter((g) => g !== d).map((g) => `el ${NOMBRE_DIA[g]}`).join(' y ')}: tienen ${v}.`;
  return {
    ok: ganadores.length === 1 && ganadores[0] === d,
    motivo,
    tipo: 'lineas',
    tema: { clase: 'dia', dia: d, sentido },
    clave: `dia-${sentido}:${d}${c ? '@' + c : ''}`,
  };
}

function compararDias(a: Dia, b: Dia, sentido: 'mas' | 'menos', c?: Categoria): Lectura {
  const va = delDia(a, c);
  const vb = delDia(b, c);
  const que = c ? ` de ${NOMBRE_CAT[c]}` : '';
  return {
    ok: sentido === 'mas' ? va > vb : va < vb,
    motivo: `el ${NOMBRE_DIA[a]} ${va}${que} contra el ${NOMBRE_DIA[b]} ${vb}.`,
    tipo: 'lineas',
    tema: { clase: 'dia', dia: a, sentido },
    clave: `dia-vs:${a}-${b}`,
  };
}

function parteDelTotal(c: Categoria, n: string): Lectura {
  const v = deCategoria(c);
  const s = v / TOTAL;
  const mayoria = /\bmayoria\b/.test(n);
  const frac = mayoria ? FRACCIONES[0] : FRACCIONES.find((x) => x.re.test(n))!;
  const relacion = mayoria ? 'mas' : /\bmas o menos\b/.test(n) ? 'cerca' : /\bmas de\b/.test(n) ? 'mas' : /\bmenos de\b/.test(n) ? 'menos' : /\bcasi\b/.test(n) ? 'casi' : 'igual';
  const ok =
    relacion === 'mas' ? s > frac.f : relacion === 'menos' ? s < frac.f : relacion === 'casi' ? s >= frac.f - 0.08 && s < frac.f : Math.abs(s - frac.f) <= (relacion === 'cerca' ? 0.08 : 0.03);
  return {
    ok,
    motivo: `${NOMBRE_CAT[c]} es ${v} de ${TOTAL}, y ${frac.nombre} serían unos ${Math.round(frac.f * TOTAL)}.`,
    tipo: 'pastel',
    tema: { clase: 'categoria', categoria: c },
    clave: `parte:${c}`,
  };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function noEntiendo(motivo: string): Juicio {
  return { veredicto: 'no-entiendo', motivo, tipo: null, tema: null, clave: 'no-entiendo' };
}

/* ── el juez ─────────────────────────────────────────────────────────────── */

export function juzgar(texto: string): Juicio {
  const n = pelado(texto);
  if (!n) return noEntiendo('Todavía no escribiste nada.');

  for (const a of ALCANCE) {
    if (a.re.test(n)) {
      return { veredicto: 'fuera-de-alcance', motivo: `Tu tabla es de un salón y una semana: no dice nada ${a.de}.`, tipo: null, tema: null, clave: 'alcance' };
    }
  }

  const cats = enOrden(n, PATRON_CAT);
  const dias = enOrden(n, PATRON_DIA);
  const mas = /\b(mas|mayor)\b/.test(n);
  const menos = /\b(menos|menor)\b/.test(n);
  const fraccion = /\bmayoria\b/.test(n) || FRACCIONES.some((x) => x.re.test(n));
  const sentido: 'mas' | 'menos' | null = mas && !menos ? 'mas' : menos && !mas ? 'menos' : null;

  if (cats.length === 0 && dias.length === 0) {
    return noEntiendo('No sé de qué hablas: nombra una categoría (papel, plástico, comida u otros) o un día de la semana.');
  }

  let l: Lectura | null = null;
  if (fraccion && cats.length === 1 && dias.length === 0) l = parteDelTotal(cats[0], n);
  else if (sentido && cats.length === 2 && dias.length <= 1) l = compararCategorias(cats[0], cats[1], sentido, dias[0]);
  else if (sentido && dias.length === 2 && cats.length <= 1) l = compararDias(dias[0], dias[1], sentido, cats[0]);
  else if (sentido && dias.length === 1 && cats.length <= 1 && !(cats.length === 1 && /\blo que\b/.test(n))) l = superlativoDeDia(dias[0], sentido, cats[0]);
  else if (sentido && cats.length === 1 && dias.length <= 1) l = superlativoDeCategoria(cats[0], sentido, dias[0]);

  if (!l) {
    return noEntiendo(
      mas && menos && !fraccion
        ? 'Dices «más» y «menos» a la vez: quédate con uno.'
        : 'Ya sé de qué hablas, pero no qué dices de eso: ¿es lo que más se tira, menos que otra cosa, la mitad del total…?',
    );
  }

  const ok = /\bno\b/.test(n) ? !l.ok : l.ok;
  return {
    veredicto: ok ? 'sostenida' : 'falsa',
    motivo: `${ok ? 'La tabla lo sostiene' : 'La tabla no lo sostiene'}: ${l.motivo}`,
    tipo: l.tipo,
    tema: l.tema,
    clave: l.clave,
  };
}

/* ── la propuesta del E9: sale del tema de la frase ──────────────────────── */

export function propuestaPara(tema: Tema): string {
  if (tema.clase === 'dia') {
    return tema.sentido === 'mas'
      ? `Recoger la basura los ${NOMBRE_DIA[tema.dia]} con una bolsa extra, porque ese día se junta más`
      : `Preguntar qué se hizo distinto el ${NOMBRE_DIA[tema.dia]}, que se juntó menos`;
  }
  switch (tema.categoria) {
    case 'papel':
      return 'Poner un contenedor especial para el papel, junto al bote';
    case 'plastico':
      return 'Poner un contenedor especial para el plástico, junto al bote';
    case 'comida':
      return 'Separar la comida en un bote aparte';
    default:
      return 'Mirar qué hay en «otros» antes de proponer algo';
  }
}

/** La propuesta correcta y dos de temas distintos, para que elegir sea leer la propia frase. */
export function propuestasDelPublico(tema: Tema): { texto: string; bien: boolean }[] {
  const otros: Tema[] =
    tema.clase === 'dia'
      ? [{ clase: 'categoria', categoria: 'papel' }, { clase: 'categoria', categoria: 'comida' }]
      : [
          { clase: 'dia', dia: 'jueves', sentido: 'mas' },
          { clase: 'categoria', categoria: tema.categoria === 'papel' ? 'comida' : 'papel' },
        ];
  return [{ texto: propuestaPara(tema), bien: true }, ...otros.map((t) => ({ texto: propuestaPara(t), bien: false }))];
}
