import type { Node as NodoPM } from 'prosemirror-model';

/**
 * El diccionario del corrector de `n3-ortografia-e-imagenes` (8-9 años).
 *
 * Vive en la carpeta de la clase, no en el motor: no es «el diccionario del
 * español» sino la lista de las faltas que de verdad escribe un niño mexicano de
 * ocho o nueve años. Un corrector de verdad guarda medio millón de palabras y
 * subraya todo lo que NO está en su lista; aquí se hace al revés —subrayar lo
 * que SÍ está en una lista corta de errores conocidos— porque lo que el alumno
 * ve es exactamente lo mismo, la raya roja ondulada con su corrección al lado, y
 * no hace falta traerse un diccionario entero al navegador para dar la clase.
 *
 * ── LAS DOS CLASES DE ENTRADA, Y POR QUÉ LA SEGUNDA ES LA LECCIÓN ────────────
 *
 * `buena` con una palabra   → está mal escrita y ésa es la forma correcta.
 * `buena` en `null`         → la palabra está BIEN y el corrector se equivoca al
 *                             subrayarla: es un NOMBRE que él no conoce.
 *
 * La segunda es el corazón de la parada (§20.2 del documento maestro, línea 3 de
 * Bit): «el corrector propone, pero tú decides». Un corrector no sabe qué es
 * «Bit» —no está en ningún diccionario— y lo marca igual que una falta. Si el
 * alumno le hace caso a ciegas, estropea una palabra que estaba bien. Por eso
 * `bit` está aquí con dos sugerencias tentadoras y ninguna correcta.
 *
 * ── POR QUÉ LAS SUGERENCIAS EQUIVOCADAS TAMBIÉN ESTÁN EN LA LISTA ───────────
 * `bid` y `bito` son las dos sugerencias que el corrector ofrece para «Bit». Si
 * el alumno pica y elige una, el documento queda peor que antes… y el corrector
 * la vuelve a subrayar en el acto, ofreciéndole «Bit». Así el error se puede
 * deshacer por donde se hizo y no hay callejón sin salida: en un ejercicio sin
 * botón de reiniciar, un error irreversible obliga a recargar la página.
 *
 * Regla para quien amplíe esta lista: **sólo entran formas que no existen en
 * español**. Nada de palabras reales usadas donde no van —«tubo» por «tuvo»,
 * «asta» por «hasta»—: un corrector de verdad no las ve, y decir lo contrario le
 * enseñaría al niño a fiarse de una máquina que no puede saberlo.
 */

export interface EntradaDiccionario {
  /** Lo que el corrector propone, en el orden en que lo enseña. */
  sugerencias: string[];
  /** Cómo se escribe bien. `null` si la palabra ya estaba bien escrita. */
  buena: string | null;
}

export const DICCIONARIO: Record<string, EntradaDiccionario> = {
  /* La hache que no se oye */
  aser: { sugerencias: ['hacer'], buena: 'hacer' },
  ase: { sugerencias: ['hace'], buena: 'hace' },
  asiendo: { sugerencias: ['haciendo'], buena: 'haciendo' },
  ablar: { sugerencias: ['hablar'], buena: 'hablar' },
  aora: { sugerencias: ['ahora'], buena: 'ahora' },
  abia: { sugerencias: ['había'], buena: 'había' },
  ise: { sugerencias: ['hice'], buena: 'hice' },
  iso: { sugerencias: ['hizo'], buena: 'hizo' },
  aiga: { sugerencias: ['haya'], buena: 'haya' },
  haiga: { sugerencias: ['haya'], buena: 'haya' },
  aver: { sugerencias: ['haber'], buena: 'haber' },

  /* El chat metido en la tarea */
  ke: { sugerencias: ['que'], buena: 'que' },
  q: { sugerencias: ['que'], buena: 'que' },
  xq: { sugerencias: ['porque'], buena: 'porque' },
  porke: { sugerencias: ['porque'], buena: 'porque' },
  kiero: { sugerencias: ['quiero'], buena: 'quiero' },

  /* La b y la v */
  bamos: { sugerencias: ['vamos'], buena: 'vamos' },
  boy: { sugerencias: ['voy'], buena: 'voy' },
  iva: { sugerencias: ['iba'], buena: 'iba' },
  escrivir: { sugerencias: ['escribir'], buena: 'escribir' },

  /* La c, la s y la z */
  dise: { sugerencias: ['dice'], buena: 'dice' },
  desir: { sugerencias: ['decir'], buena: 'decir' },
  nesesita: { sugerencias: ['necesita'], buena: 'necesita' },
  entonses: { sugerencias: ['entonces'], buena: 'entonces' },

  /* La elle y la ye */
  yamar: { sugerencias: ['llamar'], buena: 'llamar' },
  pantaya: { sugerencias: ['pantalla'], buena: 'pantalla' },
  caye: { sugerencias: ['calle'], buena: 'calle' },

  /* De la calle al cuaderno */
  muncho: { sugerencias: ['mucho'], buena: 'mucho' },
  naiden: { sugerencias: ['nadie'], buena: 'nadie' },
  dijistes: { sugerencias: ['dijiste'], buena: 'dijiste' },
  fuistes: { sugerencias: ['fuiste'], buena: 'fuiste' },
  juimos: { sugerencias: ['fuimos'], buena: 'fuimos' },

  /* El acento que se cae */
  tambien: { sugerencias: ['también'], buena: 'también' },
  asi: { sugerencias: ['así'], buena: 'así' },

  /* Las tres del escrito de hoy */
  musso: { sugerencias: ['museo'], buena: 'museo' },
  anteguas: { sugerencias: ['antiguas', 'antigüas'], buena: 'antiguas' },
  antigüas: { sugerencias: ['antiguas'], buena: 'antiguas' },

  /*
   * El nombre que el corrector no conoce. Está bien escrito: aquí no hay nada
   * que cambiar y la respuesta correcta es «Omitir».
   */
  bit: { sugerencias: ['Bid', 'Bito'], buena: null },
  /* Y la vuelta atrás, si el alumno le hizo caso al corrector. */
  bid: { sugerencias: ['Bit'], buena: 'Bit' },
  bito: { sugerencias: ['Bit'], buena: 'Bit' },
};

/** Letras que forman palabra en español. Todo lo demás separa. */
export const LETRAS = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g;

export function entradaDe(palabra: string): EntradaDiccionario | null {
  return DICCIONARIO[palabra.toLowerCase()] ?? null;
}

/**
 * La corrección con la misma forma que traía la palabra.
 *
 * Sin esto, corregir «Ke» al principio de un renglón escribiría «que» en
 * minúscula: el corrector metería una falta nueva al arreglar la vieja, que es
 * lo peor que puede hacer un corrector. Los nombres —«Bit»— van con mayúscula
 * en el diccionario y no se tocan.
 */
export function conLaMismaForma(original: string, correccion: string): string {
  if (!original) return correccion;
  if (correccion[0] === correccion[0].toUpperCase()) return correccion;
  if (original.length > 1 && original === original.toUpperCase()) return correccion.toUpperCase();
  if (original[0] === original[0].toUpperCase()) return correccion[0].toUpperCase() + correccion.slice(1);
  return correccion;
}

/* ─────────────────────────── preguntas al documento ─────────────────────────── */

/**
 * Todas las palabras del documento, en minúsculas.
 *
 * Se recorre bloque a bloque y se junta con espacios, no con `doc.textContent`:
 * ése pega los bloques sin separador y la última palabra de un párrafo se funde
 * con la primera del siguiente. Es el mismo defecto que arregló `contarPalabras`
 * en el motor, y aquí daría falsos negativos al comprobar un encargo.
 */
export function palabrasDelDocumento(doc: NodoPM): string[] {
  const trozos: string[] = [];
  doc.descendants((nodo) => {
    if (!nodo.isTextblock) return true;
    let texto = '';
    nodo.forEach((hijo) => {
      texto += hijo.isText ? hijo.text : ' ';
    });
    trozos.push(texto);
    return false;
  });
  return (trozos.join(' ').toLowerCase().match(LETRAS) ?? []).map((p) => p);
}

/** ¿El documento dice esa palabra entera? No vale que esté dentro de otra. */
export function diceLaPalabra(doc: NodoPM, palabra: string): boolean {
  return palabrasDelDocumento(doc).includes(palabra.toLowerCase());
}

/**
 * ¿No queda ni una palabra mal escrita?
 *
 * Los nombres que el corrector no conoce —«Bit»— no cuentan: están bien
 * escritos. Por eso se pregunta por `buena !== null` y no por «está subrayada».
 */
export function sinFaltas(doc: NodoPM): boolean {
  return !palabrasDelDocumento(doc).some((p) => DICCIONARIO[p]?.buena);
}
