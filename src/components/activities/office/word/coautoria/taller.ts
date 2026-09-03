'use client';

import type { EditorView } from 'prosemirror-view';
import { documentoDesdeHtml, htmlDelDocumento } from '@/components/office/motor/useEditor';
import { bloquesTope, compararDocumentos, seguirBloque, type Comparacion } from './diff';
import {
  COMENTARIOS_INICIALES,
  DOCUMENTO,
  VERSIONES_INICIALES,
  YO,
  type Comentario,
  type Version,
} from './documento';

/**
 * `of-word-coautoria` · el taller de trabajo entre varios.
 *
 * Aquí vive todo lo que esta clase añade al programa y que el motor no trae: el
 * historial de versiones, la comparación de dos documentos y los comentarios con
 * su estado de resuelto. Es un almacén pequeño con avisos, fuera de React, por
 * dos razones que no son de gusto:
 *
 *  1. **Los controles de la cinta no viven en React.** Un `ControlDeClase` recibe
 *     la vista de ProseMirror y nada más; no tiene manera de tocar un `useState`.
 *     Con el almacén aquí, el botón de la cinta y el panel que pinta la clase
 *     miran el mismo sitio.
 *  2. **El maestro corrige leyendo un ESTADO, no un clic.** Los encargos de esta
 *     clase preguntan «¿hay una versión guardada con nombre?», «¿está resuelto el
 *     comentario de Renata y siguen abiertos los otros dos?», «¿se hizo una
 *     comparación que de verdad enseñara algo?». Si el alumno borra lo que hizo,
 *     el encargo vuelve a estar por hacer — igual que el motor hace con el
 *     documento. Vigilar el botón enseñaría a adivinar el botón.
 *
 * ── EL LATIDO ───────────────────────────────────────────────────────────────
 * El maestro sólo se entera de las cosas cuando pasa una transacción por el
 * editor. Resolver un comentario o guardar una versión no toca el documento, así
 * que después de cada cambio se despacha una transacción **vacía**: no edita
 * nada, pero hace que la cinta se repinte y que el maestro vuelva a preguntar.
 * Y se repite una vez pasado el segundo y medio que dura el «¡Eso es!», porque
 * si no, un encargo que ya está cumplido por el estado anterior se queda
 * esperando a que el alumno toque algo.
 */

export interface EstadoTaller {
  versiones: Version[];
  comentarios: Comentario[];
  panelRevisiones: boolean;
  panelVersiones: boolean;
  /**
   * El panel llegó a estar abierto alguna vez en esta partida.
   *
   * Los encargos 1 y 2 se corrigen con esto y no con «se pulsó tal botón», y la
   * diferencia salió al jugar mal: con el logro atado al clic, pulsar «Panel de
   * revisiones» estando el panel ABIERTO lo cerraba y aun así palomeaba el
   * encargo «lee lo que te dejaron» — se daba por leído lo que se acababa de
   * esconder. Y al revés: abrir el panel con «Nuevo comentario», que también lo
   * abre y también enseña los tres comentarios, no contaba para nada y encima
   * cobraba un tropiezo. Se abrió o no se abrió: eso es un estado, y da igual el
   * camino, como manda el resto del motor.
   *
   * Es monótono a propósito: cerrar el panel no desabre lo que ya se leyó, y el
   * encargo 8 necesita poder cerrarlo sin que la clase retroceda seis encargos.
   */
  vioComentarios: boolean;
  vioVersiones: boolean;
  dialogoComparar: boolean;
  /** El comentario nuevo se está escribiendo. */
  escribiendoComentario: boolean;
  /**
   * Sube cada vez que se pide el nombre de la versión. El panel lo mira para
   * llevar el cursor al cuadro; sin esto, el botón «Guardar» de la cinta no
   * hacía absolutamente nada cuando el panel ya estaba abierto —y el motor
   * cobraba el clic—, que es la peor clase de botón: el que parece vivo, no
   * contesta y encima baja la nota.
   */
  pedirNombre: number;
  /** El resultado que se está mirando a pantalla completa. */
  comparacion: Comparacion | null;
  /**
   * Comparaciones que enseñaron algo: dos lados distintos y con cambios.
   * Comparar un documento consigo mismo no cuenta, y ése es el error que el
   * encargo 6 provoca a propósito.
   */
  comparacionesUtiles: number;
  /** Restauraciones que de verdad cambiaron el documento. */
  restauracionesUtiles: number;
  /** Lo último que hizo el taller, para el recado del panel. */
  recado: string | null;
}

function inicial(): EstadoTaller {
  return {
    versiones: VERSIONES_INICIALES.map((v) => ({ ...v })),
    comentarios: COMENTARIOS_INICIALES.map((c) => ({ ...c })),
    panelRevisiones: false,
    panelVersiones: false,
    vioComentarios: false,
    vioVersiones: false,
    dialogoComparar: false,
    escribiendoComentario: false,
    pedirNombre: 0,
    comparacion: null,
    comparacionesUtiles: 0,
    restauracionesUtiles: 0,
    recado: null,
  };
}

let estado: EstadoTaller = inicial();
let vista: EditorView | null = null;
let latidos: ReturnType<typeof setTimeout>[] = [];
const oyentes = new Set<() => void>();

/**
 * Cuándo se le vuelve a preguntar al maestro después de un cambio del taller.
 *
 * Uno solo no basta y está medido: al restaurar una versión, el maestro puede
 * tener que dar por cumplidos DOS o TRES encargos seguidos —el del documento,
 * el de la versión guardada, el de la comparación—, y sólo se cierra uno por
 * transacción porque el «¡Eso es!» dura segundo y medio y durante ese rato no se
 * evalúa nada. Con un solo latido el alumno se quedaba mirando un encargo que ya
 * estaba cumplido, sin nada que hacer para que se palomeara.
 */
const LATIDOS = [1700, 3400, 5100];

/** La hora de ahora, dicha como la diría un compañero. */
function ahora(): string {
  const d = new Date();
  return `hoy, ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Despacha una transacción vacía para que el maestro vuelva a mirar, ahora y en
 * los tres latidos de `LATIDOS`.
 *
 * La transacción no edita nada —ni un paso, `docChanged` en falso, no repagina—
 * pero repinta la cinta y hace que el maestro vuelva a preguntar por el encargo.
 * Es el precio de que la corrección viva en el motor y estas tres herramientas
 * en la clase.
 */
function despertarAlMaestro() {
  if (!vista) return;
  vista.dispatch(vista.state.tr);
  latidos.forEach(clearTimeout);
  latidos = LATIDOS.map((ms) =>
    setTimeout(() => {
      if (vista?.dom.isConnected) vista.dispatch(vista.state.tr);
    }, ms),
  );
}

function fijar(parche: Partial<EstadoTaller>, avisarAlEditor = true) {
  estado = { ...estado, ...parche };
  oyentes.forEach((f) => f());
  if (avisarAlEditor) despertarAlMaestro();
}

/** El documento de una versión, o el de ahora. */
function documentoDe(id: string) {
  if (id === 'ahora') return vista ? vista.state.doc : null;
  const v = estado.versiones.find((x) => x.id === id);
  return v ? documentoDesdeHtml(v.html) : null;
}

function nombreDe(id: string) {
  if (id === 'ahora') return 'Documento de ahora';
  return estado.versiones.find((x) => x.id === id)?.nombre ?? '—';
}

/**
 * Los bloques del documento tal como estaban cuando se escribieron los tres
 * comentarios de partida. Es la referencia contra la que se siguen sus anclas.
 *
 * Se calcula la primera vez que hace falta y no al cargar el módulo: leer HTML
 * necesita un `document`, y este archivo también se evalúa en el servidor.
 */
let baseDeSalida: string[] | null = null;
function baseInicial(): string[] {
  if (!baseDeSalida) baseDeSalida = bloquesTope(documentoDesdeHtml(DOCUMENTO));
  return baseDeSalida;
}

export const taller = {
  leer: () => estado,

  suscribir(f: () => void) {
    oyentes.add(f);
    return () => {
      oyentes.delete(f);
    };
  },

  /**
   * La clase empieza limpia.
   *
   * El almacén vive fuera de React, así que sobrevive a montar y desmontar el
   * laboratorio —y el modo estricto de React monta dos veces a propósito—. Sin
   * esto, salir y volver a entrar dejaría las versiones del alumno anterior.
   */
  reiniciar() {
    latidos.forEach(clearTimeout);
    latidos = [];
    // También se suelta la vista: la de la partida anterior está destruida, y
    // guardar una versión leyendo un editor muerto sería peor que no guardarla.
    // La siguiente pulsación de la cinta vuelve a conectar la buena.
    vista = null;
    estado = inicial();
    oyentes.forEach((f) => f());
  },

  /** La vista llega por el primer control de la cinta que se pulse. */
  conectar(v: EditorView) {
    vista = v;
  },
  vista: () => vista,

  /**
   * A qué bloque del documento de AHORA apunta un comentario.
   *
   * El ancla guardada es el número de bloque de cuando se escribió el
   * comentario; aquí se le sigue la pista hasta donde haya ido a parar. Sin
   * esto, un solo Enter al principio del documento movía los tres comentarios un
   * sitio y las tarjetas citaban el renglón de al lado —medido—. Devuelve −1 si
   * ese trozo ya no está en el documento.
   */
  anclaAhora(c: Comentario): number {
    if (!vista) return c.ancla;
    return seguirBloque(c.base ?? baseInicial(), bloquesTope(vista.state.doc), c.ancla);
  },

  /* ── paneles ─────────────────────────────────────────────────────────── */

  alternarRevisiones() {
    const abre = !estado.panelRevisiones;
    fijar({ panelRevisiones: abre, vioComentarios: estado.vioComentarios || abre, recado: null });
  },
  alternarVersiones() {
    const abre = !estado.panelVersiones;
    fijar({ panelVersiones: abre, vioVersiones: estado.vioVersiones || abre, recado: null });
  },
  /**
   * El botón «Guardar» de la cinta. Abre el panel, lleva el cursor al cuadro del
   * nombre y dice qué escribir: no guarda nada por su cuenta, porque el encargo
   * comprueba que la versión tenga un nombre que signifique algo y ponérselo es
   * justo lo que se está enseñando.
   */
  abrirVersionesParaGuardar() {
    fijar({
      panelVersiones: true,
      vioVersiones: true,
      pedirNombre: estado.pedirNombre + 1,
      recado:
        'Escribe ahí arriba qué estás guardando y pulsa «Guardar versión». El nombre es lo único que te va a decir, dentro de una semana, a cuál volver.',
    });
  },
  abrirComparar() {
    fijar({ dialogoComparar: true, recado: null });
  },
  cerrarComparar() {
    fijar({ dialogoComparar: false });
  },
  cerrarComparacion() {
    fijar({ comparacion: null });
  },
  /**
   * Abre o cierra el redactor de un comentario nuevo.
   *
   * Al abrirlo hay que poner el panel: el redactor vive dentro. Al CANCELARLO no
   * se toca el panel — antes lo abría también al cancelar, así que el alumno que
   * pulsaba «Comentario» sin querer y le daba a «Cancelar» se quedaba con un
   * panel abierto que él no había abierto.
   */
  escribirComentario(si: boolean) {
    fijar(
      si
        ? { panelRevisiones: true, vioComentarios: true, escribiendoComentario: true, recado: null }
        : { escribiendoComentario: false },
    );
  },

  /* ── versiones ───────────────────────────────────────────────────────── */

  /** Guarda el documento de ahora como un hito con nombre. */
  guardarVersion(nombre: string): boolean {
    if (!vista || nombre.trim().length < 3) return false;
    const v: Version = {
      id: `v-mia-${estado.versiones.length}-${Date.now()}`,
      nombre: nombre.trim(),
      autor: YO,
      cuando: ahora(),
      mia: true,
      html: htmlDelDocumento(vista.state.doc),
    };
    fijar({
      versiones: [...estado.versiones, v],
      panelVersiones: true,
      recado: `Guardaste «${v.nombre}». Puedes seguir escribiendo: esa foto ya no se mueve.`,
    });
    return true;
  },

  /**
   * Vuelve a una versión: el documento entero pasa a ser el de esa foto.
   *
   * Se anota si de verdad cambió algo. Restaurar una versión idéntica a lo que
   * ya hay no se nota en la pantalla y no enseña nada, y por eso el encargo 8
   * pide escribir algo antes: para que se vea desaparecer.
   *
   * El reemplazo va por una transacción normal del editor y **eso hay que
   * dejarlo así**: significa que restaurar SE DESHACE con Ctrl+Z. No es un
   * detalle de gusto. El panel flota encima de la hoja —una clase no puede
   * añadirle una columna a la rejilla de la ventana—, así que un clic destinado
   * al margen derecho del papel puede aterrizar en una fila de versión; medido a
   * 1024×768. Con el deshacer intacto eso es un susto: 894 caracteres → 565 →
   * 894 otra vez. Sin él sería perder el trabajo.
   */
  restaurar(id: string): boolean {
    if (!vista) return false;
    const v = estado.versiones.find((x) => x.id === id);
    if (!v) return false;
    const doc = documentoDesdeHtml(v.html);
    const cambia = htmlDelDocumento(vista.state.doc) !== htmlDelDocumento(doc);
    // El estado se fija ANTES de tocar el documento: la transacción que lo
    // reemplaza es la que hace preguntar al maestro, y tiene que preguntar con
    // la restauración ya anotada.
    fijar(
      {
        restauracionesUtiles: estado.restauracionesUtiles + (cambia ? 1 : 0),
        recado: cambia
          ? `El documento volvió a «${v.nombre}». Lo que escribiste después ya no está.`
          : `Restauraste «${v.nombre}», pero el documento ya estaba igual, así que no se nota nada.`,
      },
      false,
    );
    vista.dispatch(vista.state.tr.replaceWith(0, vista.state.doc.content.size, doc.content));
    vista.focus();
    // Y los latidos, que aquí son imprescindibles: restaurar puede dejar dos o
    // tres encargos cumplidos de golpe y el maestro sólo cierra uno por
    // transacción.
    despertarAlMaestro();
    return cambia;
  },

  /* ── comentarios ─────────────────────────────────────────────────────── */

  resolver(id: string, resuelto: boolean) {
    fijar({
      comentarios: estado.comentarios.map((c) => (c.id === id ? { ...c, resuelto } : c)),
      recado: null,
    });
  },

  /** Un comentario nuevo, anclado al bloque donde está el cursor. */
  comentar(texto: string): boolean {
    if (!vista || texto.trim().length < 2) return false;
    const { $from } = vista.state.selection;
    const ancla = $from.depth > 0 ? $from.index(0) : 0;
    const c: Comentario = {
      id: `c-mio-${estado.comentarios.length}-${Date.now()}`,
      autor: YO,
      inicial: 'A',
      cuando: ahora(),
      texto: texto.trim(),
      ancla,
      // Su referencia es el documento de ESTE momento y no el de partida: el
      // ancla que se acaba de tomar cuenta los bloques que hay ahora.
      base: bloquesTope(vista.state.doc),
      resuelto: false,
      mio: true,
    };
    fijar({ comentarios: [...estado.comentarios, c], escribiendoComentario: false, recado: null });
    return true;
  },

  /* ── comparar ────────────────────────────────────────────────────────── */

  /**
   * Compara dos documentos y deja el resultado a la vista.
   *
   * Devuelve el recado de por qué no se pudo, y el caso que importa es el
   * primero: **los dos lados son el mismo documento**. Es el error típico del
   * tema y la clase lo provoca a propósito dejando los dos desplegables en
   * «Documento de ahora».
   */
  comparar(izquierdaId: string, derechaId: string): string | null {
    // El aviso se DEVUELVE en vez de guardarse: lo enseña el propio diálogo, que
    // es quien lo provocó. En el almacén se pisaría con el recado del panel de
    // versiones y se leería en el sitio equivocado.
    if (izquierdaId === derechaId) {
      return 'Los dos lados son el mismo documento. Escoge en la izquierda una versión guardada y deja a la derecha el documento de ahora.';
    }
    const a = documentoDe(izquierdaId);
    const b = documentoDe(derechaId);
    if (!a || !b) return 'No encuentro uno de los dos documentos.';
    const c = compararDocumentos(a, b, {
      izquierdaId,
      derechaId,
      izquierdaNombre: nombreDe(izquierdaId),
      derechaNombre: nombreDe(derechaId),
    });
    // Dos versiones idénticas tampoco enseñan nada: el diálogo se queda abierto
    // con su aviso para que el alumno escoja otra, en vez de mandarlo a una
    // pantalla de comparación donde no hay ni una marca que mirar.
    if (c.resumen.cambios === 0) {
      return 'Esas dos versiones son idénticas: no hay ni un renglón distinto. Prueba con otra.';
    }
    fijar({
      comparacion: c,
      dialogoComparar: false,
      comparacionesUtiles: estado.comparacionesUtiles + 1,
      recado: null,
    });
    return null;
  },
};

export type { Comentario, Version };
