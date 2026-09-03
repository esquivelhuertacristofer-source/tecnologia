import type { Node as NodoPM } from 'prosemirror-model';
import { leerBloques } from '@/components/office/motor/consultas';

/**
 * `p-la-fila-guia` · los renglones de práctica y el mapa de los dedos.
 *
 * Es el puerto de `n3-la-fila-guia` (§20.3) al motor de Tecnia Textos. La clase
 * vieja era un teclado gigante de madera dentro de una escena 3D y una hoja con
 * casillas; lo que enseñaba se conserva ENTERO y sólo cambia el envase:
 *
 *   · las tres rondas de la clase vieja —la fila guía en orden, palabras cortas
 *     con barra espaciadora, y las letras vecinas de arriba y abajo— siguen
 *     siendo el esqueleto, en el mismo orden;
 *   · el mapa de qué dedo teclea cada letra y los nombres de los dedos están
 *     copiados tal cual, con la barra espaciadora en los pulgares;
 *   · las rayitas de la F y la J siguen siendo el truco que se enseña;
 *   · y no hay cronómetro que castigue: a esta edad la mecanografía se aprende
 *     sin prisa.
 *
 * Lo que cambia: ahora se teclea sobre un documento de verdad, así que aparecen
 * dos teclas que en un teclado de juguete no significaban nada y en un
 * procesador de textos son la mitad del oficio — **Entrar**, que baja de
 * renglón, y **Mayús**, que hace una mayúscula sin dejar todo en mayúsculas—.
 *
 * ── POR QUÉ LOS ENCARGOS SE COMPRUEBAN ASÍ ──────────────────────────────────
 * Un encargo está hecho cuando **existe en el documento un renglón cuyo texto
 * es exactamente el modelo**. No se mira el bloque número tal ni se busca «el
 * renglón que empieza por…»: se pregunta si el trabajo está ahí. Eso lo hace
 * inmune a que el alumno pulse Entrar de más, escriba en otro sitio o borre una
 * línea de la hoja, y sigue la regla del motor de anclar por posición y nunca
 * por un texto que el alumno puede reescribir — aquí ni siquiera hace falta
 * ancla: el texto ES el trabajo.
 *
 * La comparación distingue mayúsculas de minúsculas a propósito. «HOY ES LUNES»
 * no es «Hoy es lunes», y ese renglón está puesto justo para que el alumno se
 * tropiece con Bloq Mayús y aprenda a apagarlo.
 *
 * ── EL LENGUAJE ES DE 3.º DE PRIMARIA ───────────────────────────────────────
 * Ocho y nueve años. Frases cortas, una orden por frase, y el texto exacto que
 * hay que escribir SIEMPRE dicho con todas sus letras: «escribe estas tres
 * palabras» obliga a buscar cuáles son en otro sitio de la pantalla, que es
 * justo lo que un niño de esta edad no hace.
 *
 * Y una regla de puntuación que no es cosmética: **el modelo va SIEMPRE al
 * final de la instrucción y sin punto detrás**. Antes decía «Escribe: casa sal
 * lija. El espacio lo hacen los pulgares», y ese punto es de la frase, no del
 * renglón — pero un niño de ocho años que copia lo que ve escribe «casa sal
 * lija.» y el punto le sobra, porque la corrección compara letra por letra. No
 * es un callejón (el teclado guía dice enseguida «sobra 1 letra») pero es un
 * error que puso la instrucción y no el alumno, y esos no se cobran.
 */

export interface RenglonPractica {
  id: string;
  /** Cabecera corta, la que sale en la lista del panel. */
  titulo: string;
  /** Lo que hay que escribir, letra por letra. */
  modelo: string;
  instruccion: string;
  /**
   * Sale en el panel del maestro tras un tropiezo.
   *
   * En esta clase un tropiezo sólo puede ser UNA cosa —haber pulsado un botón
   * de la cinta, que es lo único que el motor cuenta como intento fallido—,
   * porque ningún encargo se resuelve con la cinta. Así que la pista empieza
   * contestando eso y sigue con la ayuda del renglón: una pista que hable de
   * otra cosa deja al niño sin saber por qué le ha aparecido.
   */
  pista: string;
  /** La frase que se lleva el alumno al acertar. */
  aprendido: string;
}

/**
 * Los seis renglones.
 *
 * Los tres primeros son las tres rondas de la clase vieja. El 4 cierra la
 * ronda de las vecinas con una palabra de verdad —«cama»— porque un ejercicio
 * de mecanografía siempre termina en palabra, y el 5 y el 6 son lo que el
 * teclado de juguete no podía enseñar: la mayúscula con Mayús, primero con el
 * meñique izquierdo y luego con el derecho.
 */
export const RENGLONES: RenglonPractica[] = [
  {
    id: 'fila-guia-en-orden',
    titulo: 'La fila guía en orden',
    modelo: 'asdfjklñ',
    instruccion:
      'Pon los cuatro dedos de la mano izquierda en A S D F. Los de la derecha, en J K L Ñ. Ahora, en el renglón vacío del final de la hoja, escribe las ocho letras seguidas: asdfjklñ',
    pista:
      'Los botones de arriba no hacen falta aquí: esta clase se hace con el teclado. Busca con el dedo las rayitas de la F y la J y vuelve a colocar las manos.',
    aprendido: 'Los ocho dedos tienen su casa: A S D F y J K L Ñ. Ahí se vuelve siempre.',
  },
  {
    id: 'palabras-cortas',
    titulo: 'Palabras cortas',
    modelo: 'casa sal lija',
    instruccion:
      'Pulsa Entrar para bajar a un renglón nuevo. El espacio lo hacen los pulgares, y los demás dedos no se mueven de su tecla. Escribe: casa sal lija',
    pista:
      'Esto no se arregla con la cinta de arriba: se teclea. El espacio es de los pulgares y los otros dedos se quedan quietos en su casa.',
    aprendido: 'La barra espaciadora es de los pulgares. Las manos ni se mueven.',
  },
  {
    id: 'sube-y-vuelve',
    titulo: 'Sube y vuelve',
    modelo: 'ded frf juj kik',
    instruccion:
      'Pulsa Entrar. Ahora vamos a la fila de arriba: el dedo sale de su tecla, sube, y vuelve enseguida. Escribe: ded frf juj kik',
    pista:
      'La cinta de arriba no hace falta aquí. No muevas la mano entera: sólo el dedo sube, teclea y baja a su tecla de siempre.',
    aprendido: 'A la fila de arriba se sube con un dedo y se vuelve enseguida.',
  },
  {
    id: 'baja-y-vuelve',
    titulo: 'Baja y vuelve',
    modelo: 'dcd jmj cama',
    instruccion:
      'Pulsa Entrar. Ahora hacia abajo, con el mismo truco, y al final una palabra. Escribe: dcd jmj cama',
    pista:
      'Los botones de arriba no sirven para esto. La C la teclea el mismo dedo que la D, y la M el mismo que la J: bajan y vuelven.',
    aprendido: 'Arriba y abajo son un viaje corto: el dedo va y vuelve a la fila guía.',
  },
  {
    id: 'una-mayuscula',
    titulo: 'Una sola mayúscula',
    modelo: 'Hoy es lunes',
    instruccion:
      'Pulsa Entrar. Aquí sólo la H va grande; lo demás, pequeño. La H la teclea la mano derecha, así que aprieta Mayús con el meñique izquierdo y, sin soltarlo, pulsa la H. Escribe: Hoy es lunes',
    pista:
      'Esto no está en la cinta, está en el teclado. Si te sale todo en MAYÚSCULAS es que tienes puesto Bloq Mayús: apágalo con esa misma tecla y usa Mayús sólo para la H.',
    aprendido: 'Mayús con el meñique de la otra mano hace UNA mayúscula. Bloq Mayús las hace todas.',
  },
  {
    id: 'sin-mirar',
    titulo: 'El renglón de honor',
    modelo: 'Escribo sin mirar',
    instruccion:
      'El último. Pulsa Entrar e intenta no bajar la vista al teclado ni una vez. La E la teclea la mano izquierda, así que ahora Mayús es el del meñique derecho. Escribe: Escribo sin mirar',
    pista:
      'La cinta no hace falta. Mira la pantalla, no las teclas: si te pierdes, toca con los dedos las rayitas de la F y la J y vuelve a empezar.',
    aprendido: 'Ya escribes renglones enteros mirando la pantalla. Eso es teclear de verdad.',
  },
];

/** Los modelos, para reconocer de un vistazo un renglón que ya está hecho. */
export const MODELOS = RENGLONES.map((r) => r.modelo);

/** Las líneas con las que nace la hoja. */
export const LINEAS_DE_LA_HOJA = [
  'Práctica de mecanografía',
  'Escuela Primaria «Vicente Guerrero» · 3.º B · Taller de computación',
  'Manos en la fila guía: meñique, anular, medio e índice de la izquierda en A S D F, y los cuatro de la derecha en J K L Ñ. Los pulgares, descansando en la barra espaciadora.',
  'Escribe cada renglón aquí abajo, uno por encargo, y pulsa Entrar al terminar cada uno.',
];

/** El documento con el que abre la clase: la hoja de práctica del taller. */
export const DOCUMENTO = `
<h1>${LINEAS_DE_LA_HOJA[0]}</h1>
<p>${LINEAS_DE_LA_HOJA[1]}</p>
<p>${LINEAS_DE_LA_HOJA[2]}</p>
<p>${LINEAS_DE_LA_HOJA[3]}</p>
<p></p>
`;

/** ¿Está ese renglón escrito en el documento, exacto? */
export function escrito(doc: NodoPM, modelo: string): boolean {
  return leerBloques(doc).some((b) => b.texto.trim() === modelo);
}

/**
 * Hasta qué bloque llega la hoja del taller. Los de abajo son del alumno.
 *
 * Aquí estaba el defecto más caro que tenía la clase, y es el (C) de §36.8 con
 * otro traje: el aviso «te sobran N letras, bórralas» es un consejo excelente
 * sobre el renglón propio y un destrozo sobre el encabezado. Se reconocía la
 * línea de la hoja **por su texto** —«¿empieza igual que una de las cuatro?»—,
 * así que bastaba con teclear dentro de las primeras letras del título para que
 * dejara de reconocerse: el maestro decía «sobran 26 letras, bórralas con
 * Retroceso» y el niño obediente se llevaba por delante el título de la hoja.
 * Medido: dos teclas dentro de «Práctica» y el recado pedía veintiséis borrados.
 *
 * Se ancla por POSICIÓN, que es la regla del proyecto: la hoja son los bloques
 * de arriba, y da igual cómo queden escritos. Se busca el ÚLTIMO de los cuatro
 * primeros bloques que siga siendo una línea de la hoja, no el primero que deje
 * de serlo: si el estropicio está en el título, los tres de abajo siguen
 * delatando dónde acaba el encabezado.
 */
export function zonaDeLaHoja(doc: NodoPM): number {
  const bloques = leerBloques(doc);
  let zona = 0;
  for (let i = 0; i < Math.min(bloques.length, LINEAS_DE_LA_HOJA.length); i += 1) {
    if (LINEAS_DE_LA_HOJA.includes(bloques[i].texto.trim())) zona = i + 1;
  }
  return zona;
}

/* ─────────────────────────── el teclado ─────────────────────────── */

/** Qué dedo teclea cada letra (0–7 de izquierda a derecha, 8 = pulgares). */
export const DEDO: Record<string, number> = {
  q: 0,
  a: 0,
  z: 0,
  w: 1,
  s: 1,
  x: 1,
  e: 2,
  d: 2,
  c: 2,
  r: 3,
  t: 3,
  f: 3,
  g: 3,
  v: 3,
  b: 3,
  y: 4,
  u: 4,
  h: 4,
  j: 4,
  n: 4,
  m: 4,
  i: 5,
  k: 5,
  o: 6,
  l: 6,
  p: 7,
  'ñ': 7,
  ' ': 8,
  // Las dos que trae el documento de verdad. Las dos son del meñique derecho.
  '⏎': 7,
  '⌫': 7,
};

export const NOMBRE_DEDO = [
  'meñique izquierdo',
  'anular izquierdo',
  'medio izquierdo',
  'índice izquierdo',
  'índice derecho',
  'medio derecho',
  'anular derecho',
  'meñique derecho',
  'pulgar',
];

/** Las filas del teclado, tal como estaban en el mueble de la clase vieja. */
export const FILAS: { id: 'arriba' | 'guia' | 'abajo'; nombre: string; teclas: string[] }[] = [
  { id: 'arriba', nombre: 'fila de arriba', teclas: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'] },
  { id: 'guia', nombre: 'fila guía', teclas: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'] },
  { id: 'abajo', nombre: 'fila de abajo', teclas: ['z', 'x', 'c', 'v', 'b', 'n', 'm'] },
];

/** Cómo se lee una tecla en voz alta. */
export function etiquetaTecla(t: string): string {
  if (t === ' ') return 'la barra espaciadora';
  if (t === '⏎') return 'la tecla Entrar';
  if (t === '⌫') return 'la tecla Retroceso';
  if (t !== t.toLowerCase()) return `la letra ${t} en mayúscula`;
  return `la letra ${t.toUpperCase()}`;
}

/**
 * El meñique que aprieta Mayús: siempre el de la mano CONTRARIA a la que
 * teclea la letra. Es la regla entera de las mayúsculas y cabe en una línea.
 */
export function mayusculaDe(letra: string): 'izquierda' | 'derecha' | null {
  if (letra === letra.toLowerCase()) return null;
  const dedo = DEDO[letra.toLowerCase()];
  if (dedo === undefined) return null;
  return dedo >= 4 ? 'izquierda' : 'derecha';
}

/** Cuántas letras del principio coinciden con el modelo. */
export function letrasBuenas(escritoAsi: string, modelo: string): number {
  let n = 0;
  while (n < escritoAsi.length && n < modelo.length && escritoAsi[n] === modelo[n]) n += 1;
  return n;
}

/**
 * El apuro de las mayúsculas: lo escrito dice lo mismo y sólo falla el tamaño
 * de las letras.
 *
 * Se compara contra el TROZO del modelo que lleva escrito y no contra el modelo
 * entero, y ahí hay dos cosas ganadas. La primera es pedagógica: antes el niño
 * tecleaba «HOY ES LUNES» completo y sólo al poner la última letra se enteraba
 * de que era Bloq Mayús; ahora se lo dice en la segunda letra, que es cuando
 * todavía se acuerda de lo que acaba de hacer. La segunda es la nota: cada
 * letra escrita en mayúscula contaba como un error distinto —doce errores por
 * un solo despiste, veintitrés puntos por caer en la trampa que la clase pone a
 * propósito—, y con esto el apuro se reconoce y se cobra UNA vez.
 */
export type ApuroMayusculas = 'bloq-mayus' | 'falta-mayuscula' | null;

export function apuroDeMayusculas(escritoAsi: string, modelo: string): ApuroMayusculas {
  if (escritoAsi.length === 0 || escritoAsi.length > modelo.length) return null;
  const trozo = modelo.slice(0, escritoAsi.length);
  if (escritoAsi === trozo) return null;
  if (escritoAsi.toLowerCase() !== trozo.toLowerCase()) return null;
  const sobranMayusculas = Array.from(escritoAsi).some(
    (c, i) => c !== trozo[i] && c !== c.toLowerCase(),
  );
  return sobranMayusculas ? 'bloq-mayus' : 'falta-mayuscula';
}
