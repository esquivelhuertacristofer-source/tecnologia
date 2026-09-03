'use client';

import type { Mark, Node as NodoPM } from 'prosemirror-model';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';
import type { EditorState } from 'prosemirror-state';
import { esquema } from '@/components/office/motor/esquema';
import { conLaMismaForma, DICCIONARIO, entradaDe, LETRAS, type EntradaDiccionario } from './diccionario';
import { insertarLamina, laminaElegida, type Lamina } from './imagenes';

/**
 * El corrector de ortografía de `n3-ortografia-e-imagenes`, y el estado de la clase.
 *
 * Todo lo de este archivo es de esta clase y muere con ella: ni un archivo del
 * motor cambia. Las herramientas se enganchan a la vista por `setProps`, que es
 * API pública de `EditorView`, la misma puerta que abrió `revisa-y-comenta`.
 *
 * ── EL SUBRAYADO ES UNA DECORACIÓN, NO UNA MARCA ────────────────────────────
 * La raya roja ondulada no forma parte del documento, igual que en Word: si
 * mandas la hoja a imprimir no sale, se recalcula sola mientras escribes y
 * desaparece en cuanto la palabra queda bien. Eso es exactamente una DECORACIÓN
 * de ProseMirror. Si fuera una marca, el alumno podría «corregir» una falta
 * quitándole el subrayado sin tocar la palabra, y el documento —que es lo que la
 * clase lee para corregir— diría que está bien.
 *
 * ── POR QUÉ EL ESTADO NO ES UN useState ─────────────────────────────────────
 * Lo tienen que leer tres sitios que no comparten árbol de React: los botones de
 * la cinta —que el motor consulta con el estado del editor, fuera de React—, los
 * dos diálogos, y las decoraciones de ProseMirror. Es un objeto vivo con una
 * suscripción de tres líneas, como en `revisa-y-comenta`.
 */

export interface Falta {
  desde: number;
  hasta: number;
  palabra: string;
  entrada: EntradaDiccionario;
  marcas: readonly Mark[];
  /** El renglón donde está, partido para poder pintar la palabra en rojo. */
  antes: string;
  despues: string;
}

/** Recorta un lado del contexto sin cortar palabras a la mitad. */
function recortar(texto: string, lado: 'izq' | 'der', tope = 46): string {
  if (texto.length <= tope) return texto;
  return lado === 'izq' ? `…${texto.slice(-tope).replace(/^\S*\s/, '')}` : `${texto.slice(0, tope).replace(/\s\S*$/, '')}…`;
}

/**
 * Las palabras que el corrector marca ahora mismo, en orden de lectura.
 *
 * Se trabaja nodo de texto a nodo de texto, así que una palabra partida por un
 * cambio de formato en mitad de sus letras no se ve. Es un caso que este
 * documento no tiene y que un niño de nueve años no fabrica sin querer.
 *
 * Las omitidas no salen: «omitir» es la manera que tiene el alumno de decirle al
 * corrector que esa palabra está bien y que deje de marcarla.
 */
export function buscarFaltas(doc: NodoPM, omitidas: Set<string>): Falta[] {
  const salida: Falta[] = [];
  doc.descendants((nodo, pos, padre) => {
    if (!nodo.isText || !nodo.text) return true;
    const renglon = padre?.isTextblock ? padre.textContent : nodo.text;
    const re = new RegExp(LETRAS.source, 'g');
    let m: RegExpExecArray | null = re.exec(nodo.text);
    while (m) {
      const entrada = entradaDe(m[0]);
      if (entrada && !omitidas.has(m[0].toLowerCase())) {
        const enRenglon = renglon.indexOf(m[0]);
        salida.push({
          desde: pos + m.index,
          hasta: pos + m.index + m[0].length,
          palabra: m[0],
          entrada,
          marcas: nodo.marks,
          antes: enRenglon >= 0 ? recortar(renglon.slice(0, enRenglon), 'izq') : '',
          despues: enRenglon >= 0 ? recortar(renglon.slice(enRenglon + m[0].length), 'der') : '',
        });
      }
      m = re.exec(nodo.text);
    }
    return true;
  });
  return salida;
}

/* ─────────────────────────── el estado de la clase ─────────────────────────── */

export class EstadoClase {
  vista: EditorView | null = null;

  /** El diálogo del corrector está abierto. */
  corrector = false;
  /** La galería de imágenes está abierta. */
  galeria = false;

  /** Qué palabra de la lista se está viendo. */
  indice = 0;
  /** La sugerencia marcada en la lista. En Word hay que elegir antes de cambiar. */
  elegida: string | null = null;
  /** Las que el alumno mandó dejar como estaban. */
  omitidas = new Set<string>();
  /** La lámina marcada en la galería, todavía sin insertar. */
  laminaMarcada: Lamina | null = null;

  /** Un recado del propio corrector o de la galería, donde el alumno mira. */
  recado: string | null = null;

  /**
   * Los tropiezos que ocurren DENTRO de los diálogos.
   *
   * La ventana sólo puede contar los de la cinta —es lo único que pasa por
   * ella—, así que elegir la sugerencia que no era o meter la imagen que no
   * habla del texto saldría gratis en la nota. Se cuentan aquí y el laboratorio
   * los suma a los suyos al calificar.
   */
  tropiezos = 0;

  private oyentes = new Set<() => void>();

  suscribir(oyente: () => void): () => void {
    this.oyentes.add(oyente);
    return () => {
      this.oyentes.delete(oyente);
    };
  }

  avisar(): void {
    for (const oyente of [...this.oyentes]) oyente();
  }

  /**
   * Engancha el corrector a la vista la primera vez que se usa.
   *
   * `setProps` admite cambios parciales, así que aquí entran las decoraciones y
   * el clic sobre una palabra subrayada sin tocar `useEditor.ts`. El despachador
   * se envuelve —no se sustituye— para repintar los diálogos cuando el documento
   * cambie por cualquier vía, incluida la de teclear.
   */
  montar(vista: EditorView): void {
    if (this.vista === vista) return;
    this.vista = vista;
    const original = vista.props.dispatchTransaction;
    vista.setProps({
      decorations: (estado) => this.decoraciones(estado),
      handleClick: (v, pos) => this.alTocar(pos),
      dispatchTransaction: original
        ? (tr) => {
            original.call(vista, tr);
            this.avisar();
          }
        : undefined,
    });
  }

  /** Empuja un repintado de la cinta, de las decoraciones y de los diálogos. */
  refrescar(): void {
    const v = this.vista;
    if (v) v.dispatch(v.state.tr.setMeta('oi-refresco', true));
    this.avisar();
  }

  faltas(): Falta[] {
    return this.vista ? buscarFaltas(this.vista.state.doc, this.omitidas) : [];
  }

  /** La palabra que el diálogo está enseñando. */
  faltaActual(): Falta | null {
    const lista = this.faltas();
    if (lista.length === 0) return null;
    return lista[Math.min(this.indice, lista.length - 1)] ?? null;
  }

  decoraciones(estado: EditorState): DecorationSet {
    if (!this.vista) return DecorationSet.empty;
    const lista = buscarFaltas(estado.doc, this.omitidas);
    const actual = this.corrector ? Math.min(this.indice, lista.length - 1) : -1;
    return DecorationSet.create(
      estado.doc,
      lista.map((f, i) =>
        Decoration.inline(f.desde, f.hasta, { class: i === actual ? 'oi-falta es-actual' : 'oi-falta' }),
      ),
    );
  }

  /**
   * Tocar una palabra subrayada la abre en el corrector.
   *
   * Es el gesto del laboratorio viejo —«toca una palabra subrayada en rojo y
   * mira lo que propone el corrector»— y también el de Word, donde se llega a
   * las sugerencias con el botón derecho encima de la palabra. Devuelve `false`
   * siempre: el clic tiene que seguir colocando el cursor donde se hizo.
   */
  private alTocar(pos: number): boolean {
    const lista = this.faltas();
    const i = lista.findIndex((f) => pos >= f.desde && pos <= f.hasta);
    if (i < 0) return false;
    this.indice = i;
    this.corrector = true;
    this.elegida = null;
    this.recado = null;
    this.avisar();
    return false;
  }

  /* ── el diálogo del corrector ── */

  abrirCorrector(): void {
    this.corrector = true;
    this.galeria = false;
    this.elegida = null;
    this.recado = null;
    const lista = this.faltas();
    if (this.indice >= lista.length) this.indice = 0;
    this.refrescar();
  }

  cerrarCorrector(): void {
    this.corrector = false;
    this.recado = null;
    this.refrescar();
  }

  marcarSugerencia(sugerencia: string): void {
    this.elegida = sugerencia;
    this.recado = null;
    this.avisar();
  }

  /**
   * «Cambiar»: escribe la sugerencia elegida en el sitio de la palabra.
   *
   * Conserva las marcas de la palabra vieja —si estaba en negrita, la nueva
   * también—, respeta mayúsculas y minúsculas, y si el alumno eligió una
   * sugerencia que tampoco es buena lo dice sin regañar: el corrector vuelve a
   * subrayar la palabra en el acto y la lista sigue teniéndola.
   */
  cambiar(): boolean {
    const v = this.vista;
    const falta = this.faltaActual();
    if (!v || !falta) return false;
    // Sin sugerencia marcada no hay nada que escribir, y callarse sería dejar al
    // alumno pulsando un botón que no contesta.
    if (!this.elegida) {
      this.recado = 'Antes de cambiar, elige en la lista cómo se escribe bien.';
      this.avisar();
      return false;
    }
    const texto = conLaMismaForma(falta.palabra, this.elegida);
    const bien = falta.entrada.buena !== null && this.elegida === falta.entrada.buena;
    if (!bien) this.tropiezos += 1;
    v.dispatch(v.state.tr.replaceWith(falta.desde, falta.hasta, esquema.text(texto, [...falta.marcas])).scrollIntoView());
    this.elegida = null;
    this.recado = bien
      ? null
      : falta.entrada.buena === null
        ? `«${falta.palabra}» estaba bien escrita: es un nombre, y los nombres no vienen en el diccionario. Vuelve a dejarla como estaba.`
        : `«${texto}» tampoco se escribe así. Lee la palabra despacio y prueba otra vez.`;
    this.avisar();
    return true;
  }

  /**
   * «Omitir»: dejar la palabra como está.
   *
   * En Word se llama «Omitir todas» y quiere decir «esta palabra está bien, deja
   * de marcármela». Es la respuesta correcta cuando el corrector se equivoca, y
   * por eso el botón está siempre a la vista y con el mismo tamaño que
   * «Cambiar»: si la salida honrada fuera más pequeña o estuviera escondida, la
   * clase estaría empujando a hacerle caso a la máquina.
   */
  omitir(): void {
    const falta = this.faltaActual();
    if (!falta) return;
    // Sólo se cuenta como tropiezo omitir algo que de verdad estaba mal escrito.
    if (falta.entrada.buena !== null) this.tropiezos += 1;
    this.omitidas.add(falta.palabra.toLowerCase());
    this.elegida = null;
    /*
     * Aquí NO se pone recado, aunque la palabra estuviera mal escrita. El aviso
     * de las omitidas es un cuadro fijo del diálogo —lo pinta `omitidasMalEscritas`
     * y trae el botón para volver atrás— así que un recado suelto decía lo mismo
     * dos veces, en dos cuadros amarillos pegados uno encima del otro. Visto en
     * la captura: a los nueve años, dos avisos idénticos no se leen el doble, se
     * leen la mitad.
     */
    this.recado = null;
    this.refrescar();
  }

  /** Las que mandó dejar como estaban… y sí estaban mal escritas. */
  omitidasMalEscritas(): string[] {
    return [...this.omitidas].filter((p) => DICCIONARIO[p]?.buena);
  }

  /**
   * «Volver a revisar»: el corrector se olvida de lo que le mandaron omitir.
   *
   * Existe en Word con ese mismo nombre y aquí, además, cierra un callejón sin
   * salida. Omitir una palabra que SÍ estaba mal escrita la saca de la lista
   * para siempre: el documento sigue con la falta —y el encargo, que lee el
   * documento, sigue sin cumplirse— pero el diálogo ya no la enseña y no hay
   * forma de corregirla salvo tecleándola a mano. Con este botón se vuelve
   * atrás, que es lo que hace falta a los nueve años.
   */
  volverARevisar(): void {
    this.omitidas.clear();
    this.indice = 0;
    this.elegida = null;
    this.recado = null;
    this.refrescar();
  }

  /* ── la galería de imágenes ── */

  abrirGaleria(): void {
    this.galeria = true;
    this.corrector = false;
    this.laminaMarcada = null;
    this.recado = null;
    this.refrescar();
  }

  cerrarGaleria(): void {
    this.galeria = false;
    this.recado = null;
    this.refrescar();
  }

  marcarLamina(lamina: Lamina): void {
    this.laminaMarcada = lamina;
    this.recado = null;
    this.avisar();
  }

  /**
   * «Insertar»: mete la lámina marcada en el documento.
   *
   * Si no habla de lo mismo que el escrito, la galería NO se cierra: se queda
   * abierta con el recado, que es donde el alumno está mirando. La imagen entra
   * igual —tiene que verla puesta para juzgarla— y la siguiente que elija la
   * sustituye.
   */
  insertar(): boolean {
    const v = this.vista;
    const lamina = this.laminaMarcada;
    if (!v) return false;
    if (!lamina) {
      this.recado = 'Primero elige una de las tres imágenes.';
      this.avisar();
      return false;
    }
    insertarLamina(v, lamina);
    if (lamina.sirve) {
      this.galeria = false;
      this.recado = null;
    } else {
      this.tropiezos += 1;
      this.recado = 'Esa imagen no habla de lo mismo que tu escrito. Léelo otra vez: ¿de qué trata? Elige otra.';
    }
    this.laminaMarcada = null;
    this.avisar();
    return true;
  }

  /** ¿Qué lámina hay puesta ahora en la hoja? Lo pregunta la galería. */
  laminaPuesta(): Lamina | null {
    return this.vista ? laminaElegida(this.vista.state.doc) : null;
  }
}
