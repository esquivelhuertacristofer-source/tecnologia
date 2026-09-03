import type { Node as NodoPM } from 'prosemirror-model';
import { Plugin, PluginKey, TextSelection, type EditorState, type Transaction } from 'prosemirror-state';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';
import { esquema } from '@/components/office/motor/esquema';

/**
 * `of-word-formularios` · el aparato de la clase: campos rellenables y protección.
 *
 * Aquí vive TODO lo que el motor no trae y esta clase necesita. No se toca ni
 * `esquema.ts` ni `comandos.ts`: se declara aquí, se enchufa a la ventana por
 * `controles`/`accesorios`, y las otras 153 clases del temario siguen igual.
 *
 * ── QUÉ ES UN CAMPO, Y POR QUÉ ASÍ ──────────────────────────────────────────
 * Un control de formulario de Word es un nodo propio del documento. Aquí no se
 * puede: el esquema del motor es de todos y no se toca. Así que un campo es
 * **un trozo de texto con la marca `resaltado` en un gris exacto** —el mismo
 * sombreado gris con el que Word pinta sus campos de formulario— y el TIPO se
 * lee del propio texto, que es también como lo lee el alumno:
 *
 *   · `☐` o `☒`  → casilla de verificación
 *   · algo que termina en `▾` → lista desplegable
 *   · cualquier otra cosa → campo de texto
 *
 * Las tres decisiones que sostienen esto:
 *
 *  1. **La marca sobrevive al tecleo.** Se comprobó en el código de
 *     prosemirror-view: cuando el alumno teclea encima de un trozo seleccionado,
 *     `readDOMChange` acaba en `tr.insertText(...)`, que toma las marcas con
 *     `marksAcross` del documento VIEJO. Aunque el navegador se haya comido el
 *     `<mark>` del DOM, el campo sigue siendo campo. Si dependiera del DOM
 *     pintado, escribir tu nombre destruiría el hueco donde lo escribes.
 *  2. **Ningún botón de la cinta pone `resaltado`.** El grupo Fuente tiene
 *     «Color de letra», no «Resaltar», así que este gris no se lo puede poner el
 *     alumno por accidente y no hay falsos campos.
 *  3. **El campo se lee del documento.** Es la regla del motor: los encargos se
 *     corrigen leyendo el documento y no vigilando botones. Si los campos
 *     vivieran sólo en las decoraciones —que es lo cómodo— `comprueba(doc)` no
 *     los vería y esta clase no se podría corregir.
 *
 * ── QUÉ ES PROTEGER ─────────────────────────────────────────────────────────
 * Un plugin propio con `filterTransaction`: con la protección puesta en
 * «Rellenar formularios», una transacción que cambie el documento sólo pasa si
 * cae DENTRO de un campo y si no hace desaparecer ninguno. Lo demás —el título,
 * los rótulos, la tabla— se queda quieto. Es la lección entera de la clase hecha
 * código: un documento puede pedir datos y defenderse de que le cambien lo que
 * no toca.
 *
 * El plugin se enchufa con `state.reconfigure` la primera vez que el alumno usa
 * una herramienta de esta clase. No se puede antes: la ventana crea el editor
 * por dentro y no lo presta al montar, y el primer camino a los campos siempre
 * pasa por un botón de la cinta.
 */

/* ─────────────────────────── el vocabulario ─────────────────────────── */

/** El gris con el que Word sombrea sus campos de formulario. Es la firma. */
export const TINTA_CAMPO = '#dcdcdc';

/** Lo que trae dentro un campo de texto recién puesto. */
export const TEXTO_MUESTRA = 'Escribe aquí';

export const FLECHA = '▾';
export const CASILLA_VACIA = '☐';
export const CASILLA_MARCADA = '☒';

/** Los tres equipos del taller. En Word se escriben al insertar la lista; aquí
 *  vienen con la clase (ver `pendiente` de la entrega). */
export const OPCIONES_EQUIPO = [
  'Robots que siguen la línea',
  'Brazos mecánicos',
  'Sensores y sonido',
];

export const LISTA_MUESTRA = `Elige tu equipo ${FLECHA}`;

export type ModoProteccion = 'ninguno' | 'formularios' | 'lectura';
export type TipoCampo = 'texto' | 'lista' | 'casilla';

export interface CampoLeido {
  /** Posición absoluta donde empieza el texto del campo. */
  desde: number;
  hasta: number;
  texto: string;
  tipo: TipoCampo;
  /** Sólo para las casillas: si está palomeada. */
  marcada: boolean;
}

/** La marca que convierte un trozo de texto en campo. */
export function marcaDeCampo() {
  return esquema.marks.resaltado.create({ color: TINTA_CAMPO });
}

function esMarcaDeCampo(marca: { type: { name: string }; attrs: Record<string, unknown> }) {
  return marca.type.name === 'resaltado' && marca.attrs.color === TINTA_CAMPO;
}

function tipoDelTexto(texto: string): { tipo: TipoCampo; marcada: boolean } {
  const t = texto.trim();
  if (t === CASILLA_VACIA || t === CASILLA_MARCADA) {
    return { tipo: 'casilla', marcada: t === CASILLA_MARCADA };
  }
  if (t.endsWith(FLECHA)) return { tipo: 'lista', marcada: false };
  return { tipo: 'texto', marcada: false };
}

/* ─────────────────────────── leer el documento ─────────────────────────── */

/**
 * Todos los campos del documento, en orden.
 *
 * Un campo es un tramo SEGUIDO de texto marcado dentro de un mismo párrafo. Se
 * recorre párrafo a párrafo —y `descendants` entra en las celdas de la tabla,
 * que es donde viven casi todos— porque `leerBloques` del motor sólo ve los
 * bloques de primer nivel y una tabla es UN bloque: desde fuera, los cuatro
 * huecos de la ficha serían invisibles.
 */
export function leerCampos(doc: NodoPM): CampoLeido[] {
  const salida: CampoLeido[] = [];

  doc.descendants((nodo, pos) => {
    if (!nodo.isTextblock) return true;
    let desde = -1;
    let texto = '';

    const cerrar = () => {
      if (desde < 0) return;
      salida.push({ desde, hasta: desde + texto.length, texto, ...tipoDelTexto(texto) });
      desde = -1;
      texto = '';
    };

    nodo.forEach((hijo, offset) => {
      if (hijo.isText && hijo.marks.some(esMarcaDeCampo)) {
        if (desde < 0) desde = pos + 1 + offset;
        texto += hijo.text ?? '';
      } else {
        cerrar();
      }
    });
    cerrar();
    return false;
  });

  return salida;
}

/**
 * El campo que contiene esa posición, o el único de su párrafo o de su celda.
 *
 * La segunda mitad no es una comodidad: el cuadrito de una casilla mide un
 * centímetro y la celda que lo contiene mide media hoja, así que casi todos los
 * clics del alumno caen «al lado». Y hay clics que ni siquiera resuelven a una
 * posición de texto —los que aterrizan en el relleno de la celda—: por eso se
 * sube por los antepasados hasta el párrafo o la celda, y no sólo al padre.
 *
 * Medido: sin la subida hasta la celda, la barra espaciadora sobre una casilla
 * no la palomeaba, se limitaba a colar un espacio invisible dentro del hueco.
 *
 * Nunca se sube hasta el documento entero: si a mitad de la clase sólo hubiera
 * un campo, un clic en el título lo estaría tocando.
 */
export function campoEnPosicion(doc: NodoPM, pos: number): CampoLeido | null {
  const campos = leerCampos(doc);
  const justo = campos.find((c) => pos >= c.desde && pos <= c.hasta);
  if (justo) return justo;

  const $p = doc.resolve(Math.min(Math.max(pos, 0), doc.content.size));
  for (let d = $p.depth; d >= 1; d -= 1) {
    const nodo = $p.node(d);
    const esHueco = nodo.isTextblock || nodo.type.name === 'celda' || nodo.type.name === 'celda_titulo';
    if (!esHueco) continue;
    const dentro = campos.filter((c) => c.desde >= $p.start(d) && c.hasta <= $p.end(d));
    if (dentro.length === 1) return dentro[0];
    if (dentro.length > 1) return null;
  }
  return null;
}

/** La primera tabla del documento: es la ficha. */
function primeraTabla(doc: NodoPM): { nodo: NodoPM; pos: number } | null {
  let hallada: { nodo: NodoPM; pos: number } | null = null;
  doc.descendants((nodo, pos) => {
    if (hallada) return false;
    if (nodo.type.name === 'tabla') {
      hallada = { nodo, pos };
      return false;
    }
    return true;
  });
  return hallada;
}

/**
 * La celda (fila, columna) de la ficha, contando desde 0.
 *
 * Los encargos se anclan AQUÍ y no al texto de la etiqueta. Es la regla que
 * salió cara en §36.8 (C): un niño teclea con algo seleccionado, el texto
 * cambia, y un encargo anclado al texto deja de poderse cumplir para siempre.
 */
export function celdaDeLaFicha(
  doc: NodoPM,
  fila: number,
  columna: number,
): { nodo: NodoPM; desde: number; hasta: number } | null {
  const tabla = primeraTabla(doc);
  if (!tabla || fila >= tabla.nodo.childCount) return null;

  let posFila = tabla.pos + 1;
  for (let i = 0; i < fila; i += 1) posFila += tabla.nodo.child(i).nodeSize;
  const nodoFila = tabla.nodo.child(fila);
  if (columna >= nodoFila.childCount) return null;

  let posCelda = posFila + 1;
  for (let j = 0; j < columna; j += 1) posCelda += nodoFila.child(j).nodeSize;
  const nodo = nodoFila.child(columna);
  return { nodo, desde: posCelda, hasta: posCelda + nodo.nodeSize };
}

/**
 * TODOS los campos que hay dentro de esa celda de la ficha.
 *
 * En plural, y eso se midió jugando mal el 10-ago-2026. Una celda puede acabar
 * con **dos** huecos: el encargo 3 dice «después pruébala», y hay quien vuelve a
 * pulsar el botón de la cinta en vez de pulsar el cuadrito de la hoja, así que
 * el aparato le mete una segunda casilla al lado de la primera. El encargo ya
 * estaba dado por bueno —había una casilla— y la ficha se quedaba con «☐ ☐».
 *
 * Con la ficha protegida, un hueco de más ya no se puede borrar: la protección
 * impide que desaparezca ningún campo. Así que si el último encargo mirara sólo
 * el PRIMER hueco de la celda, el alumno que palomeara el segundo vería su ☒ en
 * pantalla y el encargo sin cerrarse, sin nada que le dijera por qué. Mirando la
 * celda entera, el error sigue viéndose —hay dos cuadritos donde debería haber
 * uno— pero no encierra a nadie.
 */
export function camposDeLaCelda(doc: NodoPM, fila: number, columna: number): CampoLeido[] {
  const celda = celdaDeLaFicha(doc, fila, columna);
  if (!celda) return [];
  return leerCampos(doc).filter((c) => c.desde >= celda.desde && c.hasta <= celda.hasta);
}

/** El primer campo de esa celda, si lo hay. */
export function campoDeLaCelda(doc: NodoPM, fila: number, columna: number): CampoLeido | null {
  return camposDeLaCelda(doc, fila, columna)[0] ?? null;
}

/* ─────────────────────────── el aparato ─────────────────────────── */

const PERMITIDO = 'of-word-formularios/permitido';

/**
 * El estado que no vive en el documento: si la ficha está protegida y cómo.
 *
 * En Word esto viaja DENTRO del .docx —es una propiedad del documento, no de la
 * sesión—, así que preguntarle «¿estás protegido?» es preguntarle al documento
 * y no vigilar un botón. Vive en una instancia única de módulo porque el guion
 * es una constante y necesita poder preguntarlo desde `comprueba`; el
 * laboratorio la reinicia al montar, que es lo que hace que volver a entrar
 * empiece limpio.
 */
class Aparato {
  modo: ModoProteccion = 'ninguno';

  /** La vista viva. La guarda el primer control que se pulsa. */
  vista: EditorView | null = null;

  /** Ganchos que el laboratorio engancha para pintar sus paneles. */
  alAbrirPanel: (() => void) | null = null;
  alPedirLista: ((info: { campo: CampoLeido; x: number; y: number }) => void) | null = null;
  alCambiarModo: (() => void) | null = null;

  private clave = new PluginKey('of-word-formularios');

  reiniciar() {
    this.modo = 'ninguno';
    this.vista = null;
  }

  /**
   * Trae el panel de Restringir edición. **Abre, y no alterna**, y eso se midió
   * jugando mal.
   *
   * Alternaba, como el botón de Word. Pero el encargo 4 —«¿en qué pestaña se
   * protege?»— invita al alumno a ir a Revisar y a pulsar lo que encuentre, y si
   * lo pulsa el panel se abre; después el encargo 5 le dice «pulsa Restringir
   * edición», lo pulsa otra vez… y el panel se CIERRA. El encargo se daba por
   * hecho igual, y el 6 —«en el panel, marca…»— aparecía sin panel ninguno:
   * medido, «5 de 8» con la pantalla vacía. Un botón que la clase manda pulsar no
   * puede dejar al alumno sin la herramienta que los tres encargos siguientes
   * necesitan. Se cierra con la X del propio panel, que es lo que dice la pista
   * del último encargo.
   */
  abrirPanel() {
    this.alAbrirPanel?.();
  }

  /**
   * ¿La ficha ya tiene sus cuatro huecos? Es decir: ¿ya toca protegerla?
   *
   * Lo pregunta el panel para saber si puede señalar dentro de sí mismo (§37).
   * El señalador del motor sólo sabe apuntar a la cinta, así que el encargo 6
   * —que se resuelve entero dentro del panel— se quedaba sin nada que remarcar.
   * El panel se lo pinta él, pero **sólo cuando de verdad toca**: un alumno que
   * se equivoca de botón en el encargo 1 abre este panel sin querer, y un aro
   * naranja sobre su casilla le estaría señalando el encargo 6 cuatro encargos
   * antes de tiempo, que es peor que no señalar nada.
   *
   * Se cuentan los huecos y no los encargos porque el aparato no conoce el
   * guion: tres puestos por el alumno más el que la ficha traía de ejemplo.
   */
  huecosPuestos(): boolean {
    const doc = this.vista?.state.doc;
    return doc ? leerCampos(doc).length >= 4 : false;
  }

  /**
   * Enchufa el plugin de la clase al editor que ya está montado.
   *
   * Va **el primero de la lista**, y eso se midió: ProseMirror pregunta a los
   * plugins en orden y se queda con el primero que dice «yo me encargo». Detrás
   * de los atajos del motor, Enter sobre una lista desplegable nunca llegaba a
   * este plugin —se lo comía `splitBlock`, que parte el párrafo— y el hueco no
   * se abría con el teclado. Delante, el plugin atiende Enter y la barra
   * espaciadora sobre los huecos que no se escriben y deja pasar todo lo demás.
   */
  instalar(vista: EditorView) {
    this.vista = vista;
    if (this.clave.get(vista.state)) return;
    const plugin = this.crearPlugin();
    vista.updateState(vista.state.reconfigure({ plugins: [plugin, ...vista.state.plugins] }));
  }

  private crearPlugin() {
    return new Plugin({
      key: this.clave,
      filterTransaction: (tr, estado) => this.permite(tr, estado),
      props: {
        decorations: (estado) => this.decorar(estado),
        handleClick: (vista, pos) => this.alClic(vista, pos),
        /*
         * Los dos clics rápidos son EL gesto de un niño de once años, y hasta
         * ahora no hacían nada: ProseMirror, cuando dos pulsaciones caen a menos
         * de 500 ms y a menos de diez píxeles una de otra, deja de llamar a
         * `handleClick` y llama a `handleDoubleClick` —y a `handleTripleClick` a
         * la tercera—. Medido jugando mal: la casilla se quedaba en ☒ por más
         * clics que se le dieran, justo cuando el encargo 3 le pide al alumno
         * que compruebe que «otro clic la vuelve a dejar en blanco»; y en la
         * lista, el segundo clic cerraba el desplegable que el primero había
         * abierto. Con los tres manejadores enchufados al mismo sitio, cada
         * pulsación vale lo mismo, que es lo que promete la instrucción.
         */
        handleDoubleClick: (vista, pos) => this.alClic(vista, pos),
        handleTripleClick: (vista, pos) => this.alClic(vista, pos),
        handleKeyDown: (vista, evento) => this.alTeclear(vista, evento),
      },
    });
  }

  /* ── protección ── */

  /**
   * ¿Pasa esta transacción?
   *
   * Con «Rellenar formularios» pasa si cada tramo que toca cae dentro de un
   * campo Y si al final siguen existiendo los mismos campos. La segunda mitad no
   * es adorno: seleccionar el hueco entero y borrarlo se lleva la marca por
   * delante, y el hueco desaparecería para siempre sin que nadie pudiera
   * volver a ponerlo con la ficha protegida.
   */
  private permite(tr: Transaction, estado: EditorState): boolean {
    if (this.modo === 'ninguno') return true;
    // Mover el cursor, seleccionar y repaginar no cambian el documento.
    if (!tr.docChanged) return true;
    /*
     * «Sin cambios (sólo lectura)» va ANTES del salvoconducto del aparato, y no
     * es un detalle de orden: al revés, la casilla de verificación se seguía
     * palomeando con el documento en sólo lectura —lo escribe el propio aparato
     * y llevaba el permiso puesto—, así que la ficha se dejaba contestar a
     * medias justo en el modo que promete que no se puede tocar nada. Medido
     * jugando mal: ☐ pasaba a ☒ con `modo: lectura`.
     */
    if (this.modo === 'lectura') return false;
    // Lo que hace el propio aparato: marcar la casilla, elegir de la lista.
    if (tr.getMeta(PERMITIDO)) return true;

    const antes = leerCampos(estado.doc);
    if (antes.length === 0) return false;

    let doc = estado.doc;
    for (const paso of tr.steps) {
      let cabe = true;
      /*
       * Sólo los huecos de TEXTO se escriben a mano. Los de lista y los de
       * casilla los escribe el aparato —y entran por el salvoconducto de
       * arriba—, exactamente como en Word: en un campo desplegable no se teclea,
       * se elige. Sin esta línea, tres retrocesos dentro de la lista se comían
       * la flechita y el hueco dejaba de ser una lista para siempre; medido
       * jugando mal, «Elige tu equipo ▾» acabó en «Elige tu equip».
       */
      const campos = leerCampos(doc).filter((c) => c.tipo === 'texto');
      paso.getMap().forEach((desde, hasta) => {
        if (!campos.some((c) => desde >= c.desde && hasta <= c.hasta)) cabe = false;
      });
      if (!cabe) return false;
      const resultado = paso.apply(doc);
      if (!resultado.doc) return false;
      doc = resultado.doc;
    }

    return leerCampos(tr.doc).length === antes.length;
  }

  /** Aplica o suspende la protección. Despacha para que la ventana se entere. */
  proteger(modo: ModoProteccion) {
    this.modo = modo;
    const v = this.vista;
    if (v) v.dispatch(v.state.tr.setMeta(PERMITIDO, true).setMeta('addToHistory', false));
    this.alCambiarModo?.();
  }

  /* ── pintado ── */

  private decorar(estado: EditorState): DecorationSet {
    const campos = leerCampos(estado.doc);
    if (campos.length === 0) return DecorationSet.empty;
    const vivo = this.modo === 'formularios' ? ' es-vivo' : '';
    return DecorationSet.create(
      estado.doc,
      campos.map((c) => Decoration.inline(c.desde, c.hasta, { class: `frmw-campo es-${c.tipo}${vivo}` })),
    );
  }

  /* ── el ratón dentro del documento ── */

  private alClic(vista: EditorView, pos: number): boolean {
    this.vista = vista;
    // En sólo lectura el ratón sirve para leer y seleccionar, no para contestar:
    // abrir el desplegable de una lista que después no va a poder escribir nada
    // sería prometer algo que el propio modo prohíbe.
    if (this.modo === 'lectura') return false;
    const campo = campoEnPosicion(vista.state.doc, pos);
    if (!campo) return false;

    /*
     * El cursor se muda al hueco que se acaba de pulsar.
     *
     * Hace falta decirlo a mano: `handleClick` corre antes de que ProseMirror
     * lea del DOM dónde quedó el cursor, y en la casilla y en la lista el
     * manejador se queda con el clic, así que el cursor se quedaba donde
     * estuviera antes. Medido: clic en la lista, Escape para cerrar el
     * desplegable, barra espaciadora… y lo que se palomeaba era la casilla de
     * la fila de abajo, que era donde el cursor seguía viviendo.
     */
    const { from, to } = vista.state.selection;
    const fuera = from < campo.desde || to > campo.hasta;
    if (fuera && campo.tipo !== 'texto') {
      vista.dispatch(vista.state.tr.setSelection(TextSelection.create(vista.state.doc, campo.hasta)));
    }

    if (campo.tipo === 'casilla') {
      this.escribirEnCampo(vista, campo, campo.marcada ? CASILLA_VACIA : CASILLA_MARCADA);
      return true;
    }

    if (campo.tipo === 'lista') {
      this.abrirLista(vista, campo);
      return true;
    }

    // Un campo de texto recién puesto se selecciona entero al primer clic, como
    // hace Word con sus controles: así el alumno teclea encima y ya, sin tener
    // que arrastrar por encima de «Escribe aquí» para borrarlo.
    if (campo.texto.trim() === TEXTO_MUESTRA) {
      vista.dispatch(vista.state.tr.setSelection(TextSelection.create(vista.state.doc, campo.desde, campo.hasta)));
      vista.focus();
      return true;
    }
    return false;
  }

  /**
   * El teclado hace lo mismo que el ratón en los huecos que no se escriben.
   *
   * Sin esto la clase no se puede terminar sin ratón: la casilla se palomea con
   * un clic y la lista se abre con otro, y no había ninguna tecla que hiciera ni
   * una cosa ni la otra. Enter y la barra espaciadora son las que hace un
   * control de formulario en cualquier programa.
   */
  private alTeclear(vista: EditorView, evento: KeyboardEvent): boolean {
    if (evento.key !== 'Enter' && evento.key !== ' ') return false;
    if (this.modo === 'lectura') return false;
    const campo = campoEnPosicion(vista.state.doc, vista.state.selection.from);
    if (!campo || campo.tipo === 'texto') return false;
    if (campo.tipo === 'casilla') {
      this.escribirEnCampo(vista, campo, campo.marcada ? CASILLA_VACIA : CASILLA_MARCADA);
    } else {
      this.abrirLista(vista, campo);
    }
    return true;
  }

  private abrirLista(vista: EditorView, campo: CampoLeido) {
    const caja = vista.coordsAtPos(campo.desde);
    this.alPedirLista?.({ campo, x: caja.left, y: caja.bottom });
  }

  /* ── escribir dentro de un campo ── */

  /**
   * Escribe dentro de un hueco y **deja el cursor dentro**.
   *
   * Lo segundo no es cosmético. Sin fijar la selección a mano, ProseMirror la
   * mapea a donde puede al sustituir el tramo entero y acababa fuera de la
   * tabla: la casilla ya no se volvía a palomear con la barra espaciadora
   * —porque el cursor no estaba en ningún campo— y el tabulador, en vez de
   * saltar a la celda siguiente, se salía del documento y se llevaba el foco al
   * panel del maestro.
   */
  escribirEnCampo(vista: EditorView, campo: CampoLeido, texto: string) {
    const tr = vista.state.tr.replaceWith(campo.desde, campo.hasta, esquema.text(texto, [marcaDeCampo()]));
    tr.setSelection(TextSelection.create(tr.doc, campo.desde + texto.length));
    tr.setMeta(PERMITIDO, true);
    vista.dispatch(tr);
    vista.focus();
  }

  /**
   * Mete un campo donde está el cursor.
   *
   * Nunca se come lo seleccionado: si hay algo elegido, el campo entra DESPUÉS.
   * Es §36.8 (A) otra vez —insertar no puede destruir lo que el alumno acaba de
   * hacer— y aquí importa el doble, porque el encargo anterior pudo dejarle un
   * campo entero seleccionado.
   *
   * **Y nunca se pega a un campo que ya existe.** Un campo es un tramo SEGUIDO
   * de texto marcado, así que dos campos pegados son UN campo, y el nuevo se
   * traga al viejo: medido jugando mal, el alumno acababa el encargo 1, no hacía
   * clic para el 2 —el cursor se le había quedado justo detrás del hueco recién
   * puesto— y pulsaba «Lista desplegable»; los dos se fundían en
   * «Escribe aquíElige tu equipo ▾», la celda de «Nombre completo» pasaba a ser
   * una lista, el encargo 1 se despalomaba solo y el maestro le echaba la culpa
   * a un deshacer que nadie había hecho. Ahora el hueco nuevo entra detrás del
   * viejo y separado por un espacio sin marcar, que es lo que los mantiene como
   * dos huecos distintos: el error sigue viéndose —hay un desplegable donde no
   * toca, y con deshacer se quita—, pero ya no destruye lo anterior y la pista
   * del encargo es la que sale.
   */
  insertar(vista: EditorView, texto: string): boolean {
    const { state } = vista;
    const { $to, empty } = state.selection;
    if (!$to.parent.isTextblock) return false;
    let donde = empty ? state.selection.from : $to.pos;

    const pegadoA = leerCampos(state.doc).find((c) => donde >= c.desde && donde <= c.hasta);
    const trozos = pegadoA
      ? [esquema.text(' '), esquema.text(texto, [marcaDeCampo()])]
      : [esquema.text(texto, [marcaDeCampo()])];
    if (pegadoA) donde = pegadoA.hasta;

    const largo = trozos.reduce((n, t) => n + t.nodeSize, 0);
    const tr = state.tr.insert(donde, trozos);
    tr.setSelection(TextSelection.create(tr.doc, donde + largo));
    vista.dispatch(tr.scrollIntoView());
    vista.focus();
    return true;
  }
}

export const formulario = new Aparato();
