/**
 * El diccionario del corrector de `of-word-revisa-y-comenta`.
 *
 * Vive en la carpeta de la clase y no en el motor a propósito: no es «el
 * diccionario del español», es la lista de las faltas que de verdad escribe un
 * niño mexicano de diez a trece años. Un corrector de verdad tiene medio millón
 * de palabras y marca todo lo que NO está en su lista; aquí se hace al revés
 * —marcar lo que SÍ está en una lista corta de errores conocidos— porque el
 * resultado que el alumno ve es el mismo (subrayado rojo ondulado con su
 * corrección al lado) y no hace falta traerse un diccionario entero al
 * navegador para dar la clase.
 *
 * ── LA REGLA QUE ORDENA ESTA LISTA ──────────────────────────────────────────
 * Sólo entran formas que **no existen** en español. «aser», «ke», «nesesita» no
 * son palabras: por eso un corrector las ve. Quedan FUERA a conciencia las
 * palabras reales que se usan donde no van —«tubo» por «tuvo», «aya» por
 * «haya», «asta» por «hasta»—, y eso no es un olvido: es la lección del día. El
 * corrector no puede verlas porque existen las dos, y el encargo 4 de la clase
 * consiste exactamente en encontrar una de ellas leyendo, después de que el
 * programa haya dicho que ya no queda ninguna falta.
 *
 * Por eso `tubo` NO puede añadirse nunca a `DICCIONARIO`. Si alguien lo añade,
 * la clase pierde su encargo más importante.
 */

/** Palabra mal escrita → cómo se escribe. Todo en minúsculas y sin acentos raros. */
export const DICCIONARIO: Record<string, string> = {
  // La hache que no se oye
  aser: 'hacer',
  aserlo: 'hacerlo',
  aciendo: 'haciendo',
  aver: 'haber',
  abia: 'había',
  abian: 'habían',
  abias: 'habías',
  aiga: 'haya',
  haiga: 'haya',
  ablar: 'hablar',
  ablando: 'hablando',
  ablo: 'habló',
  aora: 'ahora',
  aorita: 'ahorita',
  ai: 'ahí',
  ise: 'hice',
  isimos: 'hicimos',
  ijo: 'hijo',

  // El chat metido en la tarea
  ke: 'que',
  k: 'que',
  q: 'que',
  xq: 'porque',
  porke: 'porque',
  kiero: 'quiero',
  kien: 'quién',
  tmb: 'también',

  // La b y la v
  iva: 'iba',
  hiba: 'iba',
  estube: 'estuve',
  estubo: 'estuvo',
  tubieron: 'tuvieron',
  bes: 'vez',
  boi: 'voy',
  voi: 'voy',
  soi: 'soy',
  mui: 'muy',

  // La c, la s y la z
  dise: 'dice',
  disen: 'dicen',
  desia: 'decía',
  desidimos: 'decidimos',
  desidir: 'decidir',
  nesesita: 'necesita',
  nesesitamos: 'necesitamos',
  entonses: 'entonces',
  veses: 'veces',

  // La g y la j
  cojer: 'coger',
  jente: 'gente',
  jugete: 'juguete',

  // De la calle al cuaderno
  muncho: 'mucho',
  naiden: 'nadie',
  pusistes: 'pusiste',
  dijistes: 'dijiste',
  fuistes: 'fuiste',
  veniste: 'viniste',
  dijieron: 'dijeron',
  trajieron: 'trajeron',
  haci: 'así',

  // El acento que se cae
  asi: 'así',
  tambien: 'también',
  tanbien: 'también',
  sabado: 'sábado',
  arbol: 'árbol',
  lapiz: 'lápiz',
  rapido: 'rápido',
  facil: 'fácil',
};

/**
 * Las que el corrector NO puede ver, y por qué.
 *
 * Son parejas de palabras que existen las dos, así que ningún programa puede
 * saber cuál querías. El panel las enseña justo cuando el corrector anuncia que
 * ya no queda ninguna falta, que es el momento exacto en que el alumno está a
 * punto de creerse que el texto ya está bien.
 */
export const CONFUSIONES: { pareja: string; explica: string }[] = [
  { pareja: 'tubo / tuvo', explica: 'un tubo es de agua; «tuvo» es de tener' },
  { pareja: 'aya / halla / haya', explica: 'un aya cuida niños; «halla» es de hallar y «haya» es de haber' },
  { pareja: 'asta / hasta', explica: 'el asta es el palo de la bandera' },
  { pareja: 'vaya / valla', explica: 'una valla es una barda' },
  { pareja: 'echo / hecho', explica: '«hecho» es de hacer y lleva h' },
];

/** Letras que forman palabra en español. Lo demás separa. */
export const LETRAS = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g;

/** ¿Está en el diccionario de faltas? Devuelve la corrección o null. */
export function correccionDe(palabra: string): string | null {
  return DICCIONARIO[palabra.toLowerCase()] ?? null;
}

/**
 * La corrección con la misma capitalización que traía la falta.
 *
 * Sin esto, corregir «Ke» al principio de un renglón escribía «que» en
 * minúscula y el alumno terminaba con un error nuevo puesto por el programa —el
 * peor de los errores posibles en un corrector—.
 */
export function conLaMismaForma(original: string, correccion: string): string {
  if (original.length === 0) return correccion;
  const todoMayusculas = original.length > 1 && original === original.toUpperCase();
  if (todoMayusculas) return correccion.toUpperCase();
  if (original[0] === original[0].toUpperCase()) {
    return correccion[0].toUpperCase() + correccion.slice(1);
  }
  return correccion;
}
