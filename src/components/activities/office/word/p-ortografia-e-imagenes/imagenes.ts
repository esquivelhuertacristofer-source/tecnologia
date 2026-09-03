import type { Node as NodoPM } from 'prosemirror-model';
import { TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { esquema } from '@/components/office/motor/esquema';

/**
 * Las láminas de la galería de imágenes de `n3-ortografia-e-imagenes`.
 *
 * Son las tres del laboratorio viejo —las computadoras del museo, un pastel de
 * cumpleaños y un balón— y sólo una habla de lo mismo que el escrito. Ése es el
 * criterio que enseña la parada: *no sirve cualquier dibujo; la buena imagen
 * habla de lo mismo que el texto*.
 *
 * ── POR QUÉ SON SVG DENTRO DEL ARCHIVO ──────────────────────────────────────
 * Un `data:` URI no puede dar 404 ni depender de que alguien suba un PNG
 * después, que es la deuda que las entradas de la sala arrastran (§36.7). El
 * documento que el alumno guarda en su equipo se lleva la imagen dentro, así que
 * al volver a abrir el laboratorio la imagen sigue ahí.
 *
 * ── LA IMAGEN ENTRA CON SU PIE DE FOTO ──────────────────────────────────────
 * Insertar mete DOS bloques: la imagen y, debajo, un párrafo con el pie. Es lo
 * que hace «Insertar título» en Word, y es lo que permite que los dos últimos
 * encargos —centrar el pie y ponerlo en cursiva— existan sin obligar a un niño
 * de nueve años a teclear un renglón entero antes de poder darle formato.
 */

const svg = (cuerpo: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 624 260">${cuerpo.replace(/\s+/g, ' ').trim()}</svg>`,
  )}`;

/* ── la sala del museo: dos computadoras de las de antes ── */
const COMPUTADORAS = svg(`
  <rect width="624" height="260" fill="#0f2c3b"/>
  <ellipse cx="176" cy="112" rx="170" ry="120" fill="#1d5169" opacity=".62"/>
  <ellipse cx="452" cy="118" rx="150" ry="112" fill="#1d5169" opacity=".5"/>
  <rect y="200" width="624" height="60" fill="#0a1f2a"/>
  <rect y="197" width="624" height="4" fill="#071620"/>

  <rect x="78" y="152" width="200" height="48" rx="3" fill="#cfc9bb"/>
  <rect x="78" y="152" width="200" height="7" fill="#eae4d7"/>
  <rect x="104" y="58" width="130" height="100" rx="9" fill="#e3d9c2"/>
  <rect x="113" y="67" width="112" height="72" rx="6" fill="#12312b"/>
  <rect x="121" y="75" width="72" height="7" rx="2" fill="#4ade80" opacity=".92"/>
  <rect x="121" y="89" width="48" height="7" rx="2" fill="#4ade80" opacity=".66"/>
  <rect x="121" y="103" width="86" height="7" rx="2" fill="#4ade80" opacity=".5"/>
  <rect x="121" y="117" width="34" height="7" rx="2" fill="#4ade80" opacity=".34"/>
  <rect x="113" y="144" width="112" height="8" rx="3" fill="#cabfa2"/>
  <rect x="96" y="162" width="150" height="16" rx="4" fill="#d8cdb2"/>
  <g fill="#b1a48a">
    <rect x="104" y="166" width="11" height="4" rx="1"/><rect x="119" y="166" width="11" height="4" rx="1"/>
    <rect x="134" y="166" width="11" height="4" rx="1"/><rect x="149" y="166" width="11" height="4" rx="1"/>
    <rect x="164" y="166" width="11" height="4" rx="1"/><rect x="179" y="166" width="11" height="4" rx="1"/>
    <rect x="194" y="166" width="11" height="4" rx="1"/><rect x="209" y="166" width="27" height="4" rx="1"/>
  </g>

  <rect x="358" y="160" width="180" height="40" rx="3" fill="#c6c0b2"/>
  <rect x="358" y="160" width="180" height="6" fill="#e0dacd"/>
  <rect x="382" y="86" width="106" height="82" rx="8" fill="#d9cfb8"/>
  <rect x="390" y="94" width="90" height="58" rx="5" fill="#14312c"/>
  <rect x="397" y="101" width="54" height="6" rx="2" fill="#38bdf8" opacity=".85"/>
  <rect x="397" y="113" width="38" height="6" rx="2" fill="#38bdf8" opacity=".6"/>
  <rect x="397" y="125" width="62" height="6" rx="2" fill="#38bdf8" opacity=".42"/>
  <rect x="390" y="156" width="90" height="7" rx="3" fill="#c2b79a"/>
  <rect x="374" y="170" width="122" height="13" rx="4" fill="#cdc2a7"/>

  <rect x="286" y="168" width="58" height="32" rx="3" fill="#f2ede1"/>
  <rect x="294" y="176" width="42" height="4" rx="2" fill="#8d8577"/>
  <rect x="294" y="185" width="30" height="4" rx="2" fill="#a9a094"/>

  <g fill="#a8813f">
    <rect x="46" y="196" width="9" height="64" rx="4"/>
    <rect x="286" y="196" width="9" height="64" rx="4"/>
    <rect x="566" y="196" width="9" height="64" rx="4"/>
  </g>
  <path d="M50 210 q120 40 240 0" fill="none" stroke="#8c1c2b" stroke-width="7" stroke-linecap="round"/>
  <path d="M290 210 q140 42 280 0" fill="none" stroke="#8c1c2b" stroke-width="7" stroke-linecap="round"/>
`);

/* ── un pastel de cumpleaños ── */
const PASTEL = svg(`
  <rect width="624" height="260" fill="#fde8f1"/>
  <circle cx="312" cy="140" r="132" fill="#fbd3e3"/>
  <rect y="206" width="624" height="54" fill="#e7aecb"/>
  <rect y="203" width="624" height="4" fill="#d996b7"/>
  <ellipse cx="312" cy="206" rx="168" ry="18" fill="#cf85a9" opacity=".45"/>
  <rect x="176" y="128" width="272" height="78" rx="10" fill="#fff4f8"/>
  <rect x="176" y="128" width="272" height="26" rx="10" fill="#f887b6"/>
  <rect x="176" y="150" width="272" height="10" fill="#f887b6"/>
  <rect x="206" y="94" width="212" height="42" rx="9" fill="#fff4f8"/>
  <rect x="206" y="94" width="212" height="18" rx="9" fill="#f2609b"/>
  <g fill="#fbcfe8">
    <circle cx="212" cy="176" r="9"/><circle cx="256" cy="186" r="7"/><circle cx="312" cy="178" r="9"/>
    <circle cx="368" cy="187" r="7"/><circle cx="412" cy="176" r="9"/>
  </g>
  <g>
    <rect x="248" y="56" width="10" height="40" rx="4" fill="#60a5fa"/>
    <rect x="307" y="48" width="10" height="48" rx="4" fill="#fbbf24"/>
    <rect x="366" y="56" width="10" height="40" rx="4" fill="#a78bfa"/>
    <path d="M253 56 q10 -14 0 -22 q-10 10 0 22z" fill="#fb923c"/>
    <path d="M312 48 q10 -14 0 -22 q-10 10 0 22z" fill="#fb923c"/>
    <path d="M371 56 q10 -14 0 -22 q-10 10 0 22z" fill="#fb923c"/>
  </g>
`);

/* ── un balón de fútbol ── */
const BALON = svg(`
  <rect width="624" height="260" fill="#bfe4ff"/>
  <circle cx="512" cy="52" r="34" fill="#fde68a"/>
  <rect y="146" width="624" height="114" fill="#54a85a"/>
  <rect y="146" width="624" height="6" fill="#3f8a46"/>
  <g fill="#4a9a50">
    <rect x="0" y="176" width="624" height="10"/>
    <rect x="0" y="212" width="624" height="12"/>
  </g>
  <ellipse cx="312" cy="216" rx="86" ry="14" fill="#2f6d38" opacity=".45"/>
  <circle cx="312" cy="158" r="62" fill="#ffffff" stroke="#c9cfd4" stroke-width="3"/>
  <path d="M312 122 l30 22 -11 35 h-38 l-11 -35z" fill="#1f2933"/>
  <path d="M312 96 l-22 16 -8 -12 18 -12z" fill="#1f2933" opacity=".9"/>
  <path d="M368 140 l-24 6 -6 -20 22 -8z" fill="#1f2933" opacity=".9"/>
  <path d="M256 140 l24 6 6 -20 -22 -8z" fill="#1f2933" opacity=".9"/>
  <path d="M292 210 l8 -24 22 0 8 24z" fill="#1f2933" opacity=".9"/>
`);

export interface Lamina {
  id: string;
  /** Como se llama en la galería. */
  nombre: string;
  /** El texto alterno de la imagen. Es también su documento de identidad. */
  alt: string;
  /** El renglón que entra debajo de la imagen. */
  pie: string;
  /** ¿Habla de lo mismo que el escrito? Sólo una. */
  sirve: boolean;
  src: string;
}

export const LAMINAS: Lamina[] = [
  {
    id: 'pastel',
    nombre: 'Pastel de cumpleaños',
    alt: 'Un pastel de cumpleaños con tres velas',
    pie: 'Un pastel de cumpleaños.',
    sirve: false,
    src: PASTEL,
  },
  {
    id: 'computadoras',
    nombre: 'Computadoras antiguas',
    alt: 'Dos computadoras antiguas en una sala de museo',
    pie: 'Las computadoras antiguas de la sala del museo.',
    sirve: true,
    src: COMPUTADORAS,
  },
  {
    id: 'balon',
    nombre: 'Balón de fútbol',
    alt: 'Un balón de fútbol en el pasto',
    pie: 'Un balón de fútbol.',
    sirve: false,
    src: BALON,
  },
];

export const LAMINA_BUENA = LAMINAS.find((l) => l.sirve) as Lamina;

const PIES = new Set(LAMINAS.map((l) => l.pie));

/*
 * El ancho de la caja de texto y el alto que le toca por la proporción del
 * dibujo. Si no coinciden, el `object-fit: cover` del motor recorta la lámina
 * por arriba y por abajo: con 244 se le comían ocho píxeles de la sala.
 */
const ANCHO = 624;
const ALTO = 260;

/** Los bloques de primer nivel con sus posiciones, que es lo que hace falta para cortar. */
function bloquesDe(doc: NodoPM) {
  const salida: { nodo: NodoPM; desde: number; hasta: number }[] = [];
  let pos = 0;
  doc.forEach((nodo) => {
    salida.push({ nodo, desde: pos, hasta: pos + nodo.nodeSize });
    pos += nodo.nodeSize;
  });
  return salida;
}

/**
 * La lámina que hay ahora en el documento, con su pie si sigue siendo el suyo.
 *
 * Un renglón VACÍO debajo de la imagen también cuenta como suyo, y sale de
 * jugar mal: si el alumno selecciona el pie de foto y lo borra, el bloque se
 * queda ahí sin una sola letra, y la cursiva del último encargo no tiene sobre
 * qué ponerse —una marca que no cubre ningún carácter no cubre el bloque—. Sin
 * esto, volver a meter la imagen dejaba el renglón vacío colgando debajo del
 * nuevo pie y el documento con un hueco tonto; con esto, la galería es la
 * salida del error y deja la hoja como estaba.
 */
export function laminaDelDocumento(doc: NodoPM): { desde: number; hasta: number; alt: string } | null {
  const bloques = bloquesDe(doc);
  const i = bloques.findIndex((b) => b.nodo.type.name === 'imagen');
  if (i < 0) return null;
  const siguiente = bloques[i + 1];
  const textoDelPie = siguiente?.nodo.textContent.trim() ?? '';
  // El vacío sólo cuenta si es un párrafo: una tabla recién metida también
  // estaría vacía y sustituir la imagen no puede llevársela por delante.
  const conPie = siguiente?.nodo.type.name === 'parrafo' && (PIES.has(textoDelPie) || textoDelPie === '');
  return {
    desde: bloques[i].desde,
    hasta: conPie ? siguiente.hasta : bloques[i].hasta,
    alt: String(bloques[i].nodo.attrs.alt ?? ''),
  };
}

/** Qué lámina eligió el alumno, si eligió alguna. */
export function laminaElegida(doc: NodoPM): Lamina | null {
  const puesta = laminaDelDocumento(doc);
  return puesta ? (LAMINAS.find((l) => l.alt === puesta.alt) ?? null) : null;
}

/** El índice del bloque del pie de foto: el de después de la imagen. −1 si no hay. */
export function indiceDelPie(doc: NodoPM): number {
  const bloques = bloquesDe(doc);
  const i = bloques.findIndex((b) => b.nodo.type.name === 'imagen');
  return i >= 0 && i + 1 < bloques.length ? i + 1 : -1;
}

/**
 * Mete la lámina en el documento, con su pie debajo.
 *
 * Si ya había una, **la sustituye en su sitio** en vez de meter la segunda
 * detrás. No es lo que hace Word, y es a propósito: elegir la imagen equivocada
 * es el error que este encargo provoca a conciencia, y salir de él tendría que
 * pasar por seleccionar un bloque atómico y borrarlo —que a los nueve años es
 * pedir demasiado para un error que la clase misma le tendió—. La galería lo
 * dice en pantalla antes de hacerlo.
 *
 * Si no había ninguna, entra DESPUÉS del bloque donde está el cursor, como la
 * tabla del motor: insertar no puede destruir lo que el alumno seleccionó.
 */
export function insertarLamina(vista: EditorView, lamina: Lamina): boolean {
  const { imagen, parrafo } = esquema.nodes;
  const nodos = [
    imagen.create({ src: lamina.src, alt: lamina.alt, ancho: ANCHO, alto: ALTO }),
    parrafo.create(null, esquema.text(lamina.pie)),
  ];
  const estado = vista.state;
  const puesta = laminaDelDocumento(estado.doc);
  const tr = estado.tr;
  let donde: number;
  if (puesta) {
    donde = puesta.desde;
    tr.replaceWith(puesta.desde, puesta.hasta, nodos);
  } else {
    const $to = estado.selection.$to;
    donde = $to.depth > 0 ? $to.after(1) : $to.pos;
    tr.insert(donde, nodos);
  }
  // El cursor queda dentro del pie de foto: es el renglón sobre el que van los
  // dos encargos siguientes y así el alumno ve dónde está antes de darle formato.
  const dentroDelPie = donde + nodos[0].nodeSize + 1;
  tr.setSelection(TextSelection.near(tr.doc.resolve(Math.min(dentroDelPie, tr.doc.content.size))));
  vista.dispatch(tr.scrollIntoView());
  return true;
}
