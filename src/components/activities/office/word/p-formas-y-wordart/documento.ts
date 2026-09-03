import type { Node as NodoPM } from 'prosemirror-model';
import { leerBloques } from '@/components/office/motor/consultas';
import { ALT_GLOBO, ALT_ZORRO, esForma, esFoto } from './piezas';

/**
 * El documento de partida y las preguntas que esta clase le hace.
 *
 * ── EL DOCUMENTO ────────────────────────────────────────────────────────────
 * El folleto que un equipo de quinto está armando para la clase de Ciencias
 * Naturales. Está terminado de texto y crudo de forma: no tiene título
 * artístico, no hay ninguna imagen, y el dato que el equipo quiere que se note
 * está escrito igual que todo lo demás. Ése es exactamente el trabajo del día.
 *
 * ── POR QUÉ TODO SE ANCLA POR POSICIÓN ──────────────────────────────────────
 * Ni una comprobación busca la palabra «zorro». La regla está pagada con sangre
 * en §36.8 (C): un encargo anclado al texto literal deja de poderse cumplir en
 * cuanto el alumno reescribe ese renglón, y sin botón de reiniciar la única
 * salida es recargar la página.
 *
 * Pero «el bloque número 3» tampoco vale aquí, porque esta clase METE bloques en
 * mitad del documento: la primera forma que el alumno inserte encima del dato
 * corre todos los índices de golpe. El ancla es por tanto **el cuarto renglón
 * con texto**, contando sólo los bloques que llevan letras y saltándose imágenes
 * y formas. Así se puede insertar y borrar dibujos cuanto se quiera —que es lo
 * único que la clase pide hacer— sin que el ancla se mueva ni un milímetro.
 */

/**
 * El folleto, tal como llega a manos del alumno.
 *
 * Español de México y de una escuela de verdad: el desierto de Sonora, un
 * equipo con número, un grado y un grupo. El dato del zorro va en un renglón
 * corto y solo, porque es el que hay que marcar y tiene que poder marcarse.
 */
export const DOCUMENTO = `
<p>Los animales del desierto</p>
<p>Folleto del equipo 3 · 5.º B · Escuela Primaria Sor Juana Inés de la Cruz</p>
<p>En el desierto de Sonora casi no llueve y de día el sol pega durísimo. Aun así ahí vive un montón de animales, y cada uno se las arregla como puede para aguantar el calor.</p>
<p>El zorro del desierto sale de noche.</p>
<p>De día se esconde bajo la arena, y en cuanto baja el sol sale a cazar. Sus orejas enormes le sirven para oír a lo lejos y también para soltar el calor del cuerpo.</p>
<p>La liebre y el correcaminos hacen algo parecido: se están quietos a la sombra hasta que el sol baja y el suelo se enfría.</p>
`;

/** Los tipos de bloque que llevan letras. Todo lo demás es dibujo o tabla. */
const CON_LETRAS = ['parrafo', 'titulo', 'titular'];

interface Imagen {
  /** Índice del bloque dentro del documento, contando dibujos incluidos. */
  indice: number;
  alt: string;
  ancho: number;
  alto: number;
  ajuste: string;
}

/**
 * Las imágenes del documento con sus atributos.
 *
 * `leerBloques` del motor devuelve el tipo y el texto de cada bloque, pero no
 * los atributos de un nodo atómico —no los necesita ninguna otra clase—. Esto
 * es lo mismo recorriendo el árbol una vez más, y vive aquí y no en
 * `consultas.ts` porque `consultas.ts` es de las 154 clases del temario.
 */
export function imagenesDe(doc: NodoPM): Imagen[] {
  const salida: Imagen[] = [];
  doc.forEach((nodo, _offset, indice) => {
    if (nodo.type.name !== 'imagen') return;
    salida.push({
      indice,
      alt: String(nodo.attrs.alt ?? ''),
      ancho: Number(nodo.attrs.ancho) || 0,
      alto: Number(nodo.attrs.alto) || 0,
      ajuste: String(nodo.attrs.ajuste ?? 'en-linea'),
    });
  });
  return salida;
}

/**
 * El renglón que el equipo quiere destacar: el CUARTO con texto del documento.
 *
 * Devuelve el índice de bloque absoluto —el que hay que comparar con el de una
 * imagen— o −1 si el alumno ha borrado tanto que ya no hay cuarto renglón. En
 * ese caso ningún encargo se da por bueno, que es lo correcto: no queda dónde
 * poner nada.
 */
export function indiceDelDato(doc: NodoPM): number {
  const conLetras = leerBloques(doc).filter(
    (b) => CON_LETRAS.includes(b.tipo) && b.texto.trim().length > 0,
  );
  return conLetras[3]?.indice ?? -1;
}

/**
 * Cuántos RENGLONES CON TEXTO hay entre dos bloques, sin contarlos a ellos.
 *
 * Ésta es la medida de «junto a», y no la resta de índices, por una razón que
 * salió jugando mal: si el alumno prueba primero con el globo de diálogo y luego
 * mete la flecha sin volver a hacer clic en el renglón, la flecha entra encima
 * del globo y queda a dos bloques del dato… con el globo en medio. Contando
 * bloques, eso son dos y falla; contando RENGLONES, son cero, que es lo que se
 * ve en pantalla: la flecha sigue pegada al renglón del zorro. Los dibujos que
 * el alumno amontone no separan nada, porque no separan nada a la vista.
 */
function textosEntre(doc: NodoPM, a: number, b: number): number {
  const desde = Math.min(a, b);
  const hasta = Math.max(a, b);
  return leerBloques(doc).filter(
    (x) =>
      x.indice > desde &&
      x.indice < hasta &&
      CON_LETRAS.includes(x.tipo) &&
      x.texto.trim().length > 0,
  ).length;
}

/**
 * ¿Hay una forma marcando el renglón del dato, y es una que sirva?
 *
 * «Marcando» quiere decir pegada a él, sin ningún otro renglón en medio. Y el
 * globo de diálogo no cuenta aunque esté en su sitio —es el error que el encargo
 * provoca a propósito—. La comprobación es tolerante con lo que sobre: si el
 * alumno probó primero con el globo y lo dejó ahí, poner al lado una flecha
 * basta para dar el encargo por hecho. Exigir que el documento quede limpio
 * obligaría a un niño de diez años a saber borrar un objeto seleccionado antes
 * de haberlo aprendido, y eso es un callejón sin salida disfrazado de rigor.
 *
 * Desde el 10-ago-2026 esa tolerancia casi nunca hace falta y sigue estando bien
 * puesta: como el encargo señala la flecha, sacar el globo de la galería es un
 * desvío y el motor lo deshace antes de que toque la hoja (§37.3, pieza 4).
 * Medido: pulsar el globo deja el documento IDÉNTICO. La tolerancia cubre lo
 * que quede de otras vías —un rehacer, un futuro encargo sin señal— y no cuesta
 * nada mantenerla.
 */
export function formaQueMarcaElDato(doc: NodoPM): boolean {
  const dato = indiceDelDato(doc);
  if (dato < 0) return false;
  return imagenesDe(doc).some(
    (im) => esForma(im.alt) && im.alt !== ALT_GLOBO && textosEntre(doc, im.indice, dato) === 0,
  );
}

/** ¿Se puso el globo de diálogo? Sirve para afinar la pista, no para corregir. */
export function hayGlobo(doc: NodoPM): boolean {
  return imagenesDe(doc).some((im) => im.alt === ALT_GLOBO);
}

/**
 * La foto del zorro, si está donde tiene que estar.
 *
 * «Junto a su renglón» aquí es un renglón de margen: el alumno puede haber hecho
 * clic en el renglón del dato o en el que lo explica —que también habla del
 * zorro— y las dos son la respuesta buena. Al final del folleto quedan dos o más
 * renglones en medio, que es justo el fracaso que el encargo provoca: «al final
 * del todo queda lejísimos de lo que explica», decía el laboratorio viejo, y
 * sigue siendo verdad.
 */
export function fotoJuntoAlDato(doc: NodoPM): Imagen | null {
  const dato = indiceDelDato(doc);
  if (dato < 0) return null;
  return (
    imagenesDe(doc).find((im) => im.alt === ALT_ZORRO && textosEntre(doc, im.indice, dato) <= 1) ??
    null
  );
}

/** ¿Hay alguna foto puesta, esté donde esté? Para la pista del encargo 4. */
export function hayFoto(doc: NodoPM): boolean {
  return imagenesDe(doc).some((im) => esFoto(im.alt));
}

/**
 * La proporción con la que nace la foto: 200 × 140. Agrandarla entera la
 * conserva; estirarla sólo a lo ancho la rompe, y eso es lo que hay que ver.
 */
const PROPORCION = 200 / 140;
/** Margen de la proporción. Los redondeos de cada paso desvían medio por ciento. */
const TOLERANCIA = 0.06;
/**
 * A partir de aquí la foto ya manda en la página: casi la mitad del ancho útil,
 * que son 624 puntos. Nace en 200 y un solo «Más grande» la deja en 300, así que
 * el encargo se cierra con una pulsación —la que hay que ACERTAR— y no con una
 * rampa que le costaría al alumno un tropiezo por hacerlo bien.
 */
export const ANCHO_PEDIDO = 290;

/** ¿La foto está deformada? Es lo único que el encargo 6 no perdona. */
export function fotoDeformada(doc: NodoPM): boolean {
  const foto = fotoJuntoAlDato(doc);
  if (!foto || foto.alto <= 0) return false;
  return Math.abs(foto.ancho / foto.alto - PROPORCION) > PROPORCION * TOLERANCIA;
}

/** ¿La foto está grande y sin deformar? */
export function fotoEnSuTamano(doc: NodoPM): boolean {
  const foto = fotoJuntoAlDato(doc);
  if (!foto) return false;
  return foto.ancho >= ANCHO_PEDIDO && !fotoDeformada(doc);
}

/** ¿El texto rodea a la foto? */
export function fotoConTextoAlrededor(doc: NodoPM): boolean {
  return fotoJuntoAlDato(doc)?.ajuste === 'cuadrado';
}
