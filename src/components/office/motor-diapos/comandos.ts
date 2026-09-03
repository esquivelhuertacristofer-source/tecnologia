/**
 * Qué hace de verdad cada botón de la cinta de Tecnia Diapositivas (§40.4).
 *
 * Mismo molde que `motor/comandos.ts` de Tecnia Textos y con la misma promesa:
 * **los tres estados de un botón salen de aquí**, no de una lista escrita a mano
 * en la ventana.
 *
 *   · `existe`     — está construido. Falso ⇒ «aún no disponible».
 *   · `estaInerte` — existe pero aquí no se puede. Un botón de letra sin una
 *                    caja seleccionada es exactamente eso.
 *   · `estaActivo` — hundido: el formato ya está puesto donde está el cursor.
 *
 * Vestir los tres igual le enseñaba al alumno que centrar el título había roto
 * el botón de centrar (§36.8). Aquí eso ya está pagado; no se vuelve a pagar.
 *
 * ── LA DIFERENCIA CON WORD, Y ES LA ÚNICA ───────────────────────────────────
 *
 * En Word un comando es una `Command` de ProseMirror: recibe el estado y aplica
 * una transacción. Aquí un comando recibe **el mazo y dónde está apuntando el
 * alumno** y devuelve **un mazo nuevo**. No hay transacciones porque no hay un
 * editor debajo: el modelo es un objeto plano y la ventana lo sustituye entero.
 *
 * Y por eso deshacer es trivial y no necesita `prosemirror-history`: basta con
 * guardar el mazo de antes. La pila vive en la ventana.
 */

import {
  agregar,
  agregarLibre,
  animacionDe,
  animar,
  cambiarDiseno,
  cambiarTema,
  conLaActiva,
  convertirElCuerpo,
  cuantasNarradas,
  duplicar,
  formatoDe,
  formatearEn,
  laActiva,
  ocultar,
  organizar,
  ponerDestino,
  ponerDuracion,
  ponerTransicion,
  quitar,
  rehacerConForma,
  renglonesDelCuerpo,
  restablecer,
  secciones,
  transicionATodas,
  transicionDe,
  zoomDeResumen,
  type ClaseDibujada,
  type Mazo,
  type Organizacion,
  type Sitio,
} from './mazo';
import {
  FIGURAS,
  FILAS,
  NOMBRE_ACCION,
  NOMBRE_FIGURA,
  admiteRelleno,
  type AccionId,
  type FiguraId,
  type Libre,
  type DisenoId,
  type TipoAnimacion,
  type TransicionId,
} from './modelo';
import type { TemaId } from './mazo';

/** Lo que un comando necesita saber además del mazo. */
export interface Contexto {
  mazo: Mazo;
  /** Qué caja tiene seleccionada, si es que tiene alguna. */
  sitio: Sitio | null;
  /**
   * TODAS las cajas seleccionadas, con `sitio` la primera.
   *
   * Entró con §42.3, que es la primera clase en la que un botón necesita
   * varias: alinear una caja sola no significa nada. Los comandos que sólo
   * saben de una siguen leyendo `sitio` y no se enteraron del cambio.
   */
  sitios?: Sitio[];
  /**
   * El valor que trae el gesto cuando el control es un desplegable: el diseño
   * elegido, el tema elegido, el tamaño en puntos. Los botones no lo usan.
   */
  valor?: string | number;
}

export interface ControlDiapos {
  /** Devuelve el mazo nuevo, o `null` si el gesto no cambió nada. */
  aplicar: (c: Contexto) => Mazo | null;
  /** ¿Se pinta hundido? Por omisión, no. */
  activo?: (c: Contexto) => boolean;
  /** ¿Se pinta apagado porque aquí no se puede? Por omisión, nunca. */
  inerte?: (c: Contexto) => boolean;
  /**
   * Por qué está apagado, **dicho por quien lo apagó** (§44.1).
   *
   * Sin esto, un botón inerte contesta siempre lo mismo —«fíjate en qué tienes
   * seleccionado»—, que es verdad cuando lo apaga la selección y mentira cuando
   * lo apaga una clase por un motivo suyo. Y un mensaje que no explica el
   * motivo real deja al alumno probando otra vez el mismo botón.
   *
   * Es la misma idea que el `title` con el que §43.6 explica por qué no se
   * borra el comentario de otro, subida al motor para que no haya que repetirla
   * clase a clase.
   */
  porQue?: (c: Contexto) => string | undefined;
}

/** Lo que una clase añade al motor. Es la vía por la que las 13 se construyen
 *  en paralelo sin tocar este archivo (§36.4). */
export type ControlesDeClase = Record<string, ControlDiapos>;

/* ── ayudas ───────────────────────────────────────────────────────────────── */

/** Casi todo lo que da formato pide una caja seleccionada. */
const pideSitio = (c: Contexto) => c.sitio == null;

/**
 * La FORMA que hay seleccionada, si lo que hay seleccionado es una forma.
 *
 * Devuelve `null` para un marcador, para una foto y para no haber seleccionado
 * nada — los tres casos en que relleno y contorno no significan nada (§44.2).
 */
const formaDe = (c: Contexto): Libre | null => {
  if (c.sitio?.tipo !== 'libre') return null;
  const id = c.sitio.id;
  const l = laActiva(c.mazo)?.libres.find((x) => x.id === id);
  return l && l.clase === 'forma' ? l : null;
};

/** Un interruptor de formato: pone lo contrario de lo que hay. */
function interruptor(marca: 'negrita' | 'cursiva' | 'subrayado'): ControlDiapos {
  return {
    inerte: pideSitio,
    activo: (c) => {
      const d = laActiva(c.mazo);
      return !!c.sitio && !!d && formatoDe(d, c.sitio)[marca] === true;
    },
    aplicar: (c) => {
      const d = laActiva(c.mazo);
      if (!c.sitio || !d) return null;
      return formatearEn(c.mazo, c.sitio, { [marca]: !formatoDe(d, c.sitio)[marca] });
    },
  };
}

/** Las alineaciones, que son excluyentes entre sí. */
function alinear(a: 'izquierda' | 'centro' | 'derecha'): ControlDiapos {
  return {
    inerte: pideSitio,
    activo: (c) => {
      const d = laActiva(c.mazo);
      if (!c.sitio || !d) return false;
      // Sin nada puesto manda la izquierda, así que ese botón nace hundido —
      // igual que en el programa de verdad, y por eso no se puede tratar como
      // «no hay alineación».
      return (formatoDe(d, c.sitio).alineacion ?? 'izquierda') === a;
    },
    aplicar: (c) => (c.sitio ? formatearEn(c.mazo, c.sitio, { alineacion: a }) : null),
  };
}

/** Las dos listas, que también son excluyentes. */
function lista(cual: 'vinetas' | 'numeros'): ControlDiapos {
  const otra = cual === 'vinetas' ? 'numeros' : 'vinetas';
  return {
    inerte: (c) => pideSitio(c) || c.sitio?.tipo !== 'marcador',
    activo: (c) => {
      const d = laActiva(c.mazo);
      return !!c.sitio && !!d && formatoDe(d, c.sitio)[cual] === true;
    },
    aplicar: (c) => {
      const d = laActiva(c.mazo);
      if (!c.sitio || !d) return null;
      const puesta = formatoDe(d, c.sitio)[cual] === true;
      return formatearEn(c.mazo, c.sitio, { [cual]: !puesta, [otra]: false });
    },
  };
}

/** Un botón de la pestaña Transiciones. Los tres funcionan igual. */
function transicion(t: TransicionId): ControlDiapos {
  const sinDiapos = (c: Contexto) => c.mazo.diapositivas.length === 0;
  return {
    inerte: sinDiapos,
    // Hundido cuando ya está puesta. «Ninguna» nace hundida en toda diapositiva
    // recién creada, igual que «izquierda» en el grupo Párrafo: no es que no
    // haya transición, es que la transición es ninguna.
    activo: (c) => {
      const d = laActiva(c.mazo);
      return !!d && transicionDe(d) === t;
    },
    aplicar: (c) => (laActiva(c.mazo) ? ponerTransicion(c.mazo, t) : null),
  };
}

/**
 * Un botón de la pestaña Animaciones.
 *
 * Pide una caja seleccionada, como todo lo que da formato: animar es una
 * propiedad de un objeto, no de la diapositiva. Y se hunde cuando esa caja ya
 * lleva esa animación, que es lo que hace que volver a pulsarlo sea claramente
 * «quitarla» y no «ponerla otra vez».
 */
function animacion(tipo: TipoAnimacion): ControlDiapos {
  return {
    inerte: pideSitio,
    activo: (c) => {
      const d = laActiva(c.mazo);
      return !!c.sitio && !!d && animacionDe(d, c.sitio)?.tipo === tipo;
    },
    aplicar: (c) => (c.sitio && laActiva(c.mazo) ? animar(c.mazo, c.sitio, tipo) : null),
  };
}

/** Los escalones de tamaño, para agrandar y reducir con un solo botón. */
const ESCALONES = [12, 16, 18, 20, 24, 28, 32, 40, 44, 54, 60];

function escalon(direccion: 1 | -1, base: (c: Contexto) => number): ControlDiapos {
  return {
    inerte: pideSitio,
    aplicar: (c) => {
      const d = laActiva(c.mazo);
      if (!c.sitio || !d) return null;
      const actual = formatoDe(d, c.sitio).pt ?? base(c);
      const i = ESCALONES.findIndex((p) => p >= actual);
      const desde = i < 0 ? ESCALONES.length - 1 : i;
      const nuevo = ESCALONES[Math.max(0, Math.min(ESCALONES.length - 1, desde + direccion))];
      return nuevo === actual ? null : formatearEn(c.mazo, c.sitio, { pt: nuevo });
    },
  };
}

/* ── los comandos que trae el motor ───────────────────────────────────────── */

/**
 * El diseño con el que nace una diapositiva nueva.
 *
 * `titulo-texto` y no `portada`: la portada es una sola y va la primera, así que
 * hacerla la de por omisión obligaría a cambiarla en las tres siguientes. En
 * PowerPoint de verdad pasa lo mismo — el botón grande de Nueva diapositiva
 * repite el diseño de trabajo, no el de título.
 */
export const DISENO_POR_OMISION: DisenoId = 'titulo-texto';

/** ¿Hay una lista que convertir en dibujo? Es lo que enciende SmartArt (§43.2). */
const hayLista = (c: Contexto): boolean => {
  const d = laActiva(c.mazo);
  return !!d && renglonesDelCuerpo(d).length > 0;
};

/** El video que esté seleccionado, si lo hay. Es lo que enciende Reproducción. */
const videoElegido = (c: Contexto): Libre | undefined => {
  const s = c.sitio;
  if (s?.tipo !== 'libre') return undefined;
  const l = laActiva(c.mazo)?.libres.find((x) => x.id === s.id);
  return l?.clase === 'video' ? l : undefined;
};

/** El objeto dibujado que esté seleccionado, si lo hay. */
const dibujadoElegido = (c: Contexto): Libre | undefined => {
  const s = c.sitio;
  if (s?.tipo !== 'libre') return undefined;
  const l = laActiva(c.mazo)?.libres.find((x) => x.id === s.id);
  return l && (l.clase === 'smartart' || l.clase === 'grafico' || l.clase === 'tabla') ? l : undefined;
};

/**
 * SmartArt, Gráfico y Tabla son **el mismo botón tres veces**, y por eso se
 * escriben una sola vez.
 *
 * Con una lista en el cuerpo, convierten. Con un objeto ya dibujado
 * seleccionado, **le cambian la forma desde su lista de origen** — que es lo
 * que hay que hacer cuando uno elige mal, y sin esto era un callejón: convertir
 * vacía el marcador, así que el botón se apagaba y no había manera de volver
 * atrás salvo reiniciar la clase. Se vio razonando cómo se juega mal §43.2,
 * antes de construirla, y es la misma forma del defecto de §42.1.
 */
function darForma(clase: ClaseDibujada): ControlDiapos {
  return {
    aplicar: (c) => {
      if (!c.valor) return null;
      const puesto = dibujadoElegido(c);
      return puesto
        ? rehacerConForma(c.mazo, puesto.id, clase, String(c.valor))
        : convertirElCuerpo(c.mazo, clase, String(c.valor));
    },
    activo: (c) => dibujadoElegido(c)?.clase === clase,
    inerte: (c) => !dibujadoElegido(c) && !hayLista(c),
  };
}

export const COMANDOS: ControlesDeClase = {
  /* ── Inicio → Diapositivas ── */
  nueva: { aplicar: (c) => agregar(c.mazo, DISENO_POR_OMISION) },
  'diseno-diapo': {
    // El valor lo pone la galería que se abre al pulsarlo. Sin valor no hay
    // gesto: abrir el desplegable todavía no cambia nada, igual que en Word.
    aplicar: (c) => (c.valor ? cambiarDiseno(c.mazo, c.valor as DisenoId) : null),
    inerte: (c) => c.mazo.diapositivas.length === 0,
  },
  duplicar: {
    aplicar: (c) => duplicar(c.mazo),
    inerte: (c) => c.mazo.diapositivas.length === 0,
  },
  quitar: {
    aplicar: (c) => quitar(c.mazo),
    // Una presentación con una sola diapositiva no puede quedarse sin ninguna:
    // el botón se apaga en vez de callarse, que es la lección de §36.8.
    inerte: (c) => c.mazo.diapositivas.length <= 1,
  },
  /*
   * «Sección» (§44.1). Abre un cuadro y no cambia nada por sí solo, igual que
   * `personalizada`: el nombre lo escribe el alumno y el mazo cambia al
   * aceptar, por `crearSeccion`.
   *
   * Se apaga si la diapositiva de delante ya arranca una sección, porque dos
   * secciones que empiezan en el mismo sitio son una sola con dos nombres.
   */
  seccion: {
    aplicar: () => null,
    inerte: (c) =>
      c.mazo.diapositivas.length === 0 ||
      secciones(c.mazo).some((s) => s.desde === c.mazo.activa),
  },

  /* ── Insertar → Texto → Cuadro de texto (§44.2) ── */
  /*
   * Un cuadro de texto es un `Libre` de clase `'texto'`, y esa clase estaba
   * DECLARADA en el modelo desde §39 sin que la usara ninguna clase. Lo que lo
   * hace distinto de un marcador es lo único que la clase enseña: **el patrón
   * no lo toca**, porque el patrón manda sobre marcadores y un cuadro de texto
   * no lo es. Eso no hay que programarlo — `formatoConPatron` sólo mira
   * marcadores—, pero sí hay que poder comprobarlo, y por eso el objeto existe.
   */
  cuadro: {
    aplicar: (c) => {
      const d = laActiva(c.mazo);
      if (!d) return null;
      return agregarLibre(c.mazo, {
        id: `texto-${d.libres.length + 1}`,
        clase: 'texto',
        contenido: 'Escribe aquí',
        casilla: { col: 1, fila: 1, cols: 4, filas: 1 },
      });
    },
    inerte: (c) => c.mazo.diapositivas.length === 0,
  },

  /* ── Insertar → Ilustraciones → Modelo 3D (§44.2, MOS 4.4) ── */
  modelo3d: {
    aplicar: (c) => {
      const d = laActiva(c.mazo);
      if (!d) return null;
      if (d.libres.some((l) => l.clase === 'modelo3d')) return null;
      return agregarLibre(c.mazo, {
        id: 'modelo-gota',
        clase: 'modelo3d',
        contenido: 'gota',
        casilla: { col: 8, fila: 3, cols: 3, filas: 4 },
        giro: { x: 0, y: 0 },
      });
    },
    // Uno por diapositiva: dos modelos 3D en una lámina de secundaria es una
    // demostración de que se puede, no una diapositiva.
    inerte: (c) =>
      c.mazo.diapositivas.length === 0 ||
      Boolean(laActiva(c.mazo)?.libres.some((l) => l.clase === 'modelo3d')),
  },

  /* ── Formato de forma → relleno y contorno (§44.2) ── */
  /*
   * Los dos son desplegables de color y pasan por aquí como `color`: reciben su
   * valor de la galería, y `'ninguno'` es un valor más. Se apagan sin una forma
   * seleccionada, y **`relleno` se apaga también sobre una línea**, porque una
   * línea no tiene dentro. Eso se deriva de la figura (`admiteRelleno`) y no se
   * escribe aquí: si mañana entra una figura nueva, el botón acierta solo.
   */
  relleno: {
    aplicar: (c) =>
      c.sitio && c.valor ? formatearEn(c.mazo, c.sitio, { relleno: String(c.valor) }) : null,
    inerte: (c) => {
      const f = formaDe(c);
      return !f || !f.figura || !admiteRelleno(f.figura);
    },
    /*
     * Apagado sobre una línea, y **diciendo por qué**. Sin esto contestaba la
     * frase de siempre —«fíjate en qué tienes seleccionado»— con una forma
     * perfectamente seleccionada delante: el alumno miraba, veía su línea
     * elegida y el programa le llevaba la contraria. Y la razón verdadera no es
     * un detalle de manejo: es la lección del encargo 4.
     */
    porQue: (c) => {
      const f = formaDe(c);
      if (!f || !f.figura || admiteRelleno(f.figura)) return undefined;
      return `Una ${NOMBRE_FIGURA[f.figura].toLocaleLowerCase('es')} no tiene dentro: sólo tiene raya. Por eso el relleno se apaga y el contorno no.`;
    },
  },
  contorno: {
    aplicar: (c) =>
      c.sitio && c.valor ? formatearEn(c.mazo, c.sitio, { contorno: String(c.valor) }) : null,
    inerte: (c) => !formaDe(c),
  },

  /* ── Inicio → Fuente ── */
  negrita: interruptor('negrita'),
  cursiva: interruptor('cursiva'),
  subrayado: interruptor('subrayado'),
  mayor: escalon(1, () => 24),
  menor: escalon(-1, () => 24),
  color: {
    inerte: pideSitio,
    aplicar: (c) => (c.sitio && c.valor ? formatearEn(c.mazo, c.sitio, { color: String(c.valor) }) : null),
  },
  // Los dos desplegables del grupo Fuente. No son botones y la cinta no los
  // lista: los inyecta la ventana, igual que en Word. Pero pasan por aquí y por
  // el mismo desvío, que es lo que a Word le faltaba —cambiar el tamaño de la
  // letra en un encargo que pedía otra cosa ensuciaba el documento en silencio
  // por ser un `select` y no un botón (§37.5)—.
  'fuente-tamano': {
    inerte: pideSitio,
    aplicar: (c) => (c.sitio && c.valor ? formatearEn(c.mazo, c.sitio, { pt: Number(c.valor) }) : null),
  },
  'fuente-familia': {
    inerte: pideSitio,
    aplicar: (c) => (c.sitio && c.valor ? formatearEn(c.mazo, c.sitio, { fuente: String(c.valor) }) : null),
  },

  /* ── Inicio → Párrafo ── */
  vinetas: lista('vinetas'),
  numeros: lista('numeros'),
  izquierda: alinear('izquierda'),
  centro: alinear('centro'),
  derecha: alinear('derecha'),

  /* ── Diseño → Temas y Personalizar ── */
  tema: {
    aplicar: (c) => (c.valor ? cambiarTema(c.mazo, c.valor as TemaId) : null),
    activo: () => false,
  },
  /*
   * Tamaño de diapositiva (§44.3). Devuelve `null` y abre un cuadro, como
   * «Sección» y como «Quitar la narración», y por el motivo más serio de los
   * tres: **es el único botón que recoloca lo que el alumno ya había puesto**.
   * Un cambio así no puede pasar por pulsar sin querer, y el aviso de lo que va
   * a pasar es la mitad de la lección —la otra mitad es verlo pasar—.
   *
   * Se apaga sin diapositivas: cambiarle la forma a un archivo vacío no cambia
   * nada que se pueda ver, y un botón que «funciona» sin efecto enseña peor que
   * uno apagado.
   */
  'tamano-diapo': {
    aplicar: () => null,
    inerte: (c) => c.mazo.diapositivas.length === 0,
  },

  fondo: {
    // Sólo esta diapositiva, no el mazo: es lo que hace enseñable el contraste
    // sin obligar a cambiarle la cara a las cuatro.
    aplicar: (c) =>
      c.valor ? conLaActiva(c.mazo, (d) => ({ ...d, fondo: String(c.valor) })) : null,
    inerte: (c) => c.mazo.diapositivas.length === 0,
  },

  /* ── Insertar → Imágenes ── */
  imagen: {
    /*
     * La imagen la elige el alumno de una galería que pone LA CLASE, no el
     * motor. El motor no sabe qué fotos existen —eso es contenido— y por eso
     * `Libre.fuente` guarda una cadena y nada más: hoy un dibujo hecho aquí
     * mismo, mañana la ruta de la lámina que saque krea2, y la mecánica no se
     * entera del cambio.
     */
    aplicar: (c) => {
      if (!c.valor) return null;
      const [id, fuente] = String(c.valor).split('|');
      const d = laActiva(c.mazo);
      if (!d || d.libres.some((l) => l.id === id)) return null;
      return agregarLibre(c.mazo, {
        id,
        clase: 'imagen',
        contenido: id,
        fuente,
        // Media diapositiva, abajo y centrada: entra sin tapar el título y
        // dejando algo que redimensionar, que es el encargo siguiente.
        casilla: { col: 3, fila: 3, cols: 6, filas: 4 },
      });
    },
    inerte: (c) => c.mazo.diapositivas.length === 0,
  },

  /* ── Inicio → Dibujo → Organizar (§42.3) ── */
  organizar: {
    /*
     * Un desplegable con doce opciones, como el del programa. No son doce
     * botones en la cinta por lo mismo que en PowerPoint tampoco lo son: se
     * usan de tarde en tarde y ocuparían el grupo entero.
     */
    aplicar: (c) =>
      c.valor ? organizar(c.mazo, c.sitios ?? (c.sitio ? [c.sitio] : []), c.valor as Organizacion) : null,
    // Con una sola caja todavía se puede traer al frente o desagrupar, así que
    // el botón se apaga sólo cuando no hay NINGUNA: apagarlo con una sería
    // esconder la mitad del menú.
    inerte: (c) => (c.sitios ?? (c.sitio ? [c.sitio] : [])).length === 0,
  },

  /* ── Insertar → Ilustraciones y Tablas (§43.2) ── */

  /*
   * Los tres se comportan igual y por eso se escriben igual: abren su
   * desplegable, y con el valor elegido **convierten la lista de la
   * diapositiva** en el objeto. Se apagan cuando no hay lista que convertir,
   * que es lo correcto y además enseña: un diagrama no se saca de la nada, se
   * saca de algo que ya escribiste.
   */
  smartart: darForma('smartart'),
  'gráfico': darForma('grafico'),
  tabla: darForma('tabla'),

  /* ── Insertar → Texto → Número de diapositiva (§42.3) ── */
  /*
   * «Encabezado y pie» (§42.3, reescrito en §44.3).
   *
   * Nació como interruptor del número —un clic, sale el número— y eso era una
   * media verdad cómoda: en PowerPoint ese botón **abre un cuadro** con tres
   * cosas —número, texto del pie y la casilla de la portada— y no hay manera de
   * poner el nombre de la escuela abajo sin pasar por él. §44.3 lo necesita
   * entero, así que ahora devuelve `null` y abre el cuadro como sus hermanos.
   *
   * El botón **sigue pintándose hundido** cuando hay algo puesto: es lo único
   * del interruptor viejo que era cierto —dice de un vistazo si esta
   * presentación lleva pie— y perderlo habría sido pagar la mejora con
   * información.
   */
  pie: {
    aplicar: () => null,
    activo: (c) => c.mazo.numeroDiapositiva === true || Boolean(c.mazo.pie),
    inerte: (c) => c.mazo.diapositivas.length === 0,
  },

  /* ── Insertar → Multimedia (§42.2) ── */
  audio: {
    /*
     * El sonido no es un archivo: es un identificador que `sonidos.ts` sabe
     * sintetizar. `Libre.sonido` guarda una cadena por el mismo motivo que
     * `Libre.fuente` guardaba una ruta — el motor no sabe qué sonidos existen,
     * eso es contenido.
     */
    aplicar: (c) => {
      if (!c.valor) return null;
      const id = String(c.valor);
      const d = laActiva(c.mazo);
      if (!d || d.libres.some((l) => l.id === `audio-${id}`)) return null;
      return agregarLibre(c.mazo, {
        id: `audio-${id}`,
        clase: 'audio',
        contenido: id,
        sonido: id,
        // Abajo a la izquierda y de una casilla: el altavoz de PowerPoint es un
        // icono, no una caja. Puesto en medio taparía la diapositiva y el
        // alumno lo movería antes de oírlo.
        casilla: { col: 0, fila: FILAS - 1, cols: 1, filas: 1 },
      });
    },
    inerte: (c) => c.mazo.diapositivas.length === 0,
  },

  /* ── Insertar → Multimedia → Video (§43.3) ── */
  video: {
    /*
     * Un video aquí es **una duración con carátula**, y eso no es una rebaja:
     * es exactamente lo que la clase necesita de él. Lo que §43.3 enseña es que
     * un video es tiempo tuyo que se va, y para enseñarlo hace falta que su
     * duración sea de verdad y cuente en la hoja de intervalos — no que se vean
     * las imágenes. Reproducir un archivo de verdad no añadiría ni una idea a la
     * clase y añadiría un megabyte por segundo.
     *
     * Entra **al clic no**, o sea arrancando solo, y es a propósito: el encargo
     * de esta clase es cambiarlo, y un ajuste que ya viene puesto no se aprende.
     */
    aplicar: (c) => {
      if (!c.valor) return null;
      const [id, seg] = String(c.valor).split('|');
      const d = laActiva(c.mazo);
      if (!d || d.libres.some((l) => l.id === id)) return null;
      return agregarLibre(c.mazo, {
        id,
        clase: 'video',
        contenido: id,
        segundos: Number(seg) || 0,
        alClic: false,
        // Debajo del primer renglón del cuerpo y con aire abajo. Centrado del
        // todo —que es lo que hace PowerPoint— tapaba justo el texto de la
        // diapositiva y parecía un fallo de pintado, no una decisión.
        casilla: { col: 2, fila: 4, cols: 8, filas: 4 },
      });
    },
    inerte: (c) => c.mazo.diapositivas.length === 0,
  },

  /* ── Reproducción, la pestaña contextual del video (§43.3) ── */
  'al-clic': {
    /*
     * Vive en «Reproducción» y no en Insertar porque en el programa de verdad
     * vive ahí, y una guía que dijera «Insertar → Al hacer clic» enseñaría un
     * domicilio falso (§36.12). Es un interruptor de dos posiciones, así que
     * pulsarlo con el video ya al clic lo devuelve a automático: un botón que
     * sólo sabe encender no es un interruptor, es una trampa.
     */
    aplicar: (c) => {
      const v = videoElegido(c);
      if (!v) return null;
      return conLaActiva(c.mazo, (d) => ({
        ...d,
        libres: d.libres.map((l) => (l.id === v.id ? { ...l, alClic: !l.alClic } : l)),
      }));
    },
    activo: (c) => videoElegido(c)?.alClic === true,
    inerte: (c) => !videoElegido(c),
  },

  /* ── Formato de imagen, la pestaña contextual (§42.2) ── */
  recortar: {
    // Recortar es un MODO, no un cambio: enciende los tiradores de recorte y la
    // ventana se encarga. Igual que `panel-animacion`, por eso devuelve null.
    aplicar: () => null,
    inerte: (c) => c.sitio?.tipo !== 'libre',
  },
  'texto-alt': {
    aplicar: () => null,
    inerte: (c) => c.sitio?.tipo !== 'libre',
  },

  /* ── Transiciones → Transición e Intervalos (§42.1) ── */
  'transicion-ninguna': transicion('ninguna'),
  'transicion-desvanecer': transicion('desvanecer'),
  'transicion-empujar': transicion('empujar'),
  duracion: {
    // Desplegable: sin valor sólo abre la lista, igual que el tamaño de letra.
    aplicar: (c) => (c.valor ? ponerDuracion(c.mazo, Number(c.valor)) : null),
    inerte: (c) => c.mazo.diapositivas.length === 0,
  },
  'aplicar-todo': {
    aplicar: (c) => (laActiva(c.mazo) ? transicionATodas(c.mazo) : null),
    inerte: (c) => c.mazo.diapositivas.length <= 1,
  },

  /* ── Animaciones → Animación y Animación avanzada (§42.1) ── */
  'anim-aparecer': animacion('aparecer'),
  'anim-enfasis': animacion('enfasis'),
  'anim-salir': animacion('salir'),
  'panel-animacion': {
    /*
     * Abrir un panel no cambia el documento, igual que proyectar: `aplicar`
     * devuelve `null` y quien lo abre es la ventana, que es la única que tiene
     * paneles. Está en la tabla porque **es un control del programa** — sin él,
     * la cinta lo pintaría «todavía no disponible» y la guía se quedaría sin
     * qué decir de un botón que la clase sí usa.
     */
    aplicar: () => null,
    inerte: (c) => c.mazo.diapositivas.length === 0,
  },

  /* ── Presentación → Iniciar presentación ── */
  'desde-principio': {
    /*
     * Proyectar no cambia el documento, y por eso `aplicar` devuelve `null`:
     * `ejecutar` entonces entrega el mazo intacto, que es literalmente la
     * verdad. Está en la tabla porque **es un control del programa** —si no
     * estuviera, la ventana lo pintaría «todavía no disponible» y la ficha de
     * la guía no tendría qué decir de él—, y quien lo pone en marcha es la
     * ventana, que es la única que sabe qué hay al otro lado: el repaso a
     * pantalla completa, o el auditorio de la clase 3.
     */
    aplicar: () => null,
    inerte: (c) => c.mazo.diapositivas.length === 0,
  },

  /*
   * Vista Moderador (§43.1). Mismo caso que el de arriba —no cambia el
   * documento— y por eso la pareja se lee de un vistazo: los dos abren la
   * presentación y lo que cambia está al otro lado, no aquí. La ventana le
   * cuenta al escenario CON CUÁL se abrió (`abiertaCon`), y el escenario de la
   * clase pinta una pantalla o dos. Que la diferencia viva en el escenario y no
   * en el comando es lo correcto: para el público no hay ninguna diferencia, y
   * el mazo es lo que el público ve.
   */
  'vista-moderador': {
    aplicar: () => null,
    inerte: (c) => c.mazo.diapositivas.length === 0,
  },

  /*
   * Ocultar diapositiva (§44.1). Vive aquí, en `Presentación → Configurar`,
   * porque es donde vive en PowerPoint, y la razón de que esté ahí y no en
   * `Inicio` con Duplicar y Quitar es exactamente la lección de la clase:
   * **ocultar no toca el archivo, toca la presentación**.
   *
   * Es un interruptor y por eso se pinta hundido cuando la de delante ya está
   * oculta — volver a pulsarlo la devuelve. La última visible no se puede
   * ocultar: una presentación sin nada que presentar no es un estado que
   * PowerPoint deje alcanzar, y dejar al alumno ahí sería el callejón de §42.1
   * otra vez.
   */
  ocultar: {
    aplicar: (c) => ocultar(c.mazo, c.mazo.activa, !c.mazo.diapositivas[c.mazo.activa]?.oculta),
    activo: (c) => Boolean(c.mazo.diapositivas[c.mazo.activa]?.oculta),
    inerte: (c) => {
      const d = c.mazo.diapositivas[c.mazo.activa];
      if (!d) return true;
      const visibles = c.mazo.diapositivas.filter((x) => !x.oculta).length;
      return !d.oculta && visibles <= 1;
    },
  },

  /*
   * Ensayar intervalos (§43.3). El tercero de la misma familia, y entró tarde:
   * el botón llevaba desde §43.1 puesto en la cinta del Intermedio SIN comando,
   * o sea pintado en gris y con el rótulo «aún no disponible». Compilaba, pasaba
   * las 767 pruebas y hasta tenía su ficha de guía escrita; lo cazó jugarlo, con
   * el señalador del encargo apuntando a un botón apagado.
   *
   * Devuelve `null` como sus dos hermanos —ensayar no cambia el documento
   * MIENTRAS ensayas—, y lo que sí lo cambia, apuntar los tiempos al terminar,
   * lo hace la ventana, que es la única que tiene el cronómetro.
   */
  ensayar: {
    aplicar: () => null,
    inerte: (c) => c.mazo.diapositivas.length === 0,
  },

  /*
   * Grabar la presentación (§44.6). El cuarto de la familia, y por el mismo
   * motivo que los tres de arriba: lo que hace es **abrir el modo presentación
   * con el cronómetro en marcha**, y quien tiene el cronómetro es la ventana.
   * Lo que sí cambia el mazo —los tiempos y la marca de narrada, diapositiva a
   * diapositiva— lo escribe ella al pasar de una a la siguiente.
   *
   * Se apaga en un archivo vacío, como sus hermanos: no hay nada que narrar.
   */
  grabar: {
    aplicar: () => null,
    inerte: (c) => c.mazo.diapositivas.length === 0,
  },

  /*
   * Quitar la narración (§44.6), y el motivo de que esté aquí y no un archivo
   * más allá: **es un botón que deshace trabajo**, así que no puede hacerlo al
   * pulsarlo. Devuelve `null` y abre la advertencia; quien borra las voces es
   * el cuadro, y sólo si el alumno dice que sí. Misma decisión que tomó §43.6
   * con el comentario de otro y por la misma razón — la diferencia es que allí
   * lo que se protege es el trabajo de alguien más y aquí el suyo propio, que
   * acaba de costarle diez minutos de hablarle a la pantalla.
   *
   * Se apaga cuando no hay ni una voz que quitar, y entonces lo DICE: sin
   * `porQue`, un botón gris contesta «fíjate en qué tienes seleccionado», que
   * aquí no tiene nada que ver y manda al alumno a mirar donde no es.
   */
  'quitar-narracion': {
    aplicar: () => null,
    inerte: (c) => cuantasNarradas(c.mazo) === 0,
    porQue: (c) =>
      cuantasNarradas(c.mazo) === 0
        ? 'No hay ninguna voz que quitar todavía: esto se enciende cuando alguna diapositiva está grabada.'
        : undefined,
  },

  /* ── Revisar → Comentarios (§43.6) ── */
  comentario: {
    /*
     * Abre el panel de comentarios, igual que `panel-animacion` abre el suyo:
     * `aplicar` devuelve `null` porque abrir un panel no cambia el documento, y
     * quien lo abre es la ventana. Lo que sí lo cambia —pegar la nota— pasa por
     * el panel, que es donde se escribe el texto.
     *
     * Se apaga sin diapositivas: un comentario va pegado a una, y en un archivo
     * vacío no hay dónde pegarlo.
     */
    aplicar: () => null,
    inerte: (c) => c.mazo.diapositivas.length === 0,
  },

  /* ── Insertar → Vínculos (§43.5) ── */
  vinculo: {
    /*
     * El valor viene de la galería de destinos, que la pone la VENTANA y no la
     * clase: la lista de diapositivas por su título se deriva del mazo, así que
     * escribirla en un `galerias` sería escribir a mano lo que ya está.
     *
     * Tres formas de valor y ninguna más: un número, `atras` y `ninguno`.
     * «Ninguno» tiene que existir — un vínculo mal puesto sin manera de
     * quitarlo es un callejón, y sería el peor sitio para tener uno.
     */
    aplicar: (c) => {
      const s = c.sitio;
      if (s?.tipo !== 'libre' || c.valor === undefined) return null;
      const v = String(c.valor);
      return ponerDestino(c.mazo, s.id, v === 'ninguno' ? null : v === 'atras' ? 'atras' : Number(v));
    },
    // Un vínculo es de un OBJETO, no de la diapositiva: sin nada seleccionado el
    // botón se apaga, igual que los de formato.
    inerte: (c) => c.sitio?.tipo !== 'libre',
  },

  /* ── Inicio → Dibujo → Formas → Botones de acción (§43.5) ── */
  formas: {
    /*
     * **El domicilio manda sobre el documento.** El §43.5 escrito decía
     * «Insertar → Ilustraciones → Formas», y en la cinta construida Formas vive
     * en `Inicio → Dibujo` desde §42.3. En PowerPoint de verdad está en los dos
     * sitios, pero aquí un control no puede salir dos veces —lo vigila una
     * prueba desde §40— y de las dos casas la que ya existe es ésta. Se corrige
     * el documento, no la cinta: mover el botón habría dejado mintiendo la ficha
     * de guía de una clase ya construida.
     *
     * Un botón de acción **nace con su destino puesto**, que es lo que lo
     * distingue de una forma a la que luego le pones un vínculo. `siguiente` se
     * calcula al insertarlo y no al pulsarlo: es lo que hace PowerPoint, y es lo
     * que permite que el mapa de la clase lo dibuje sin ejecutar nada.
     */
    aplicar: (c) => {
      if (!c.valor) return null;
      const d = laActiva(c.mazo);
      if (!d) return null;

      /*
       * La MISMA galería sirve figuras y botones de acción, como en PowerPoint,
       * donde «Formas» es una sola lista con los botones de acción en la última
       * fila. Se distingue por el valor y no por dos botones distintos: dos
       * botones habrían sido dos domicilios para lo que en el programa tiene
       * uno (§44.2).
       */
      if (FIGURAS.some((f) => f.id === c.valor)) {
        const fig = String(c.valor) as FiguraId;
        /*
         * Nace en el centro y de buen tamaño, no en una esquina: una forma que
         * aparece diminuta en un rincón parece un fallo y no una herramienta.
         *
         * Y **escalonada**, por cada figura que ya haya. En PowerPoint la forma
         * nace donde la dibujas; aquí no se dibuja arrastrando, así que sin el
         * escalón la segunda cae EXACTAMENTE encima de la primera y el alumno
         * cree que no pasó nada. Medido jugando el encargo de agrupar: tres
         * figuras apiladas en el mismo sitio se ven como una.
         *
         * Dos columnas de salto y una fila, no una y una: con una columna —80 px
         * sobre una forma de 320— la de encima seguía tapando el centro de la de
         * debajo, y lo que hay que poder hacer con la de debajo es agarrarla.
         */
        const yaHay = d.libres.filter((l) => l.clase === 'forma' && l.figura).length;
        const salto = yaHay % 3;
        return agregarLibre(c.mazo, {
          id: `forma-${fig}-${d.libres.length + 1}`,
          clase: 'forma',
          figura: fig,
          contenido: '',
          casilla: { col: 4 + salto * 2, fila: 3 + salto, cols: 4, filas: fig === 'linea' ? 1 : 3 },
        });
      }

      const que = String(c.valor) as AccionId;
      const id = `accion-${que}`;
      if (d.libres.some((l) => l.id === id)) return null;
      const destino =
        que === 'inicio' ? 0 : que === 'atras' ? ('atras' as const) : Math.min(c.mazo.activa + 1, c.mazo.diapositivas.length - 1);
      return agregarLibre(c.mazo, {
        id,
        clase: 'forma',
        contenido: NOMBRE_ACCION[que],
        accion: que,
        destino,
        // Abajo a la izquierda y de una casilla, que es donde PowerPoint pone la
        // fila de botones de acción y donde no tapa nada de lo que se lee.
        casilla: { col: 0, fila: FILAS - 1, cols: 2, filas: 1 },
      });
    },
    inerte: (c) => c.mazo.diapositivas.length === 0,
  },

  /* ── Presentación → Iniciar → Presentación personalizada (§43.5) ── */
  personalizada: {
    /*
     * Abre un cuadro, como en el programa: `aplicar` devuelve `null` y quien lo
     * abre es la ventana. Lo que sí cambia el mazo —guardar la lista— pasa por
     * `crearPersonalizada` cuando el cuadro se acepta.
     *
     * Se apaga con menos de dos diapositivas: elegir un subconjunto de una sola
     * no es elegir nada.
     */
    aplicar: () => null,
    inerte: (c) => c.mazo.diapositivas.length < 2,
  },

  /* ── Vista → Patrones, y la vuelta (§43.4) ── */

  /*
   * Los dos son de la misma familia que los tres de arriba: **cambian la
   * ventana, no el documento**. Entrar al patrón no modifica ni una diapositiva
   * —lo que se modifica es lo que se hace dentro—, y por eso `aplicar` devuelve
   * `null` y quien abre y cierra la vista es la ventana.
   *
   * `patron` se apaga si el mazo no lo tiene: doce clases construidas no lo
   * tienen, y abrirles una vista de algo que no existe sería enseñar una
   * pantalla en blanco con nombre de herramienta.
   */
  patron: {
    aplicar: () => null,
    inerte: (c) => !c.mazo.patron,
  },
  /*
   * Las tres vistas del mazo. Ninguna cambia el documento —una vista es una
   * manera de mirar— y por eso las tres devuelven `null` y quien cambia de cara
   * es la ventana.
   *
   * Las dos de abajo entraron el 12-ago-2026 con §44.1, y **entraron tarde**:
   * la barra de vistas de la barra de estado se construyó primero y estos dos
   * ids se quedaron sin comando. Compilaba, pasaba las 776 pruebas y en
   * pantalla los dos botones contestaban «ese botón todavía no está en esta
   * clase», porque un id que no está en esta tabla no existe para el programa.
   * Lo cazó jugarlo, igual que en §43.3 con Ensayar — mismo defecto, segunda
   * vez. Un botón se construye en dos sitios y sólo uno de los dos avisa.
   */
  'vista-normal': {
    aplicar: () => null,
    inerte: (c) => c.mazo.diapositivas.length === 0,
  },
  'vista-clasificador': {
    aplicar: () => null,
    // Con una sola diapositiva no hay nada que clasificar, y una rejilla de un
    // cuadro enseñaría que la vista no sirve para nada.
    inerte: (c) => c.mazo.diapositivas.length < 2,
  },
  'vista-lectura': {
    aplicar: () => null,
    inerte: (c) => c.mazo.diapositivas.length === 0,
  },
  /*
   * `vista-notas` es **el tercer botón fantasma** de esta cinta, y el que más
   * tiempo llevaba: está en la pestaña Vista desde que se escribió el grado
   * Avanzado, con su icono en `iconos.ts` y su ficha en `guia.ts` —o sea,
   * construido en tres de los cuatro sitios— y sin comando. Un alumno que lo
   * pulsara en cualquiera de las trece clases anteriores recibía «ese botón
   * todavía no está en esta clase» sobre un botón que la cinta pinta encendido.
   *
   * Tres veces el mismo defecto (§43.3 Ensayar · §44.1 las vistas · éste) es una
   * medida que falta: **la cinta y la tabla de comandos no se comprueban la una
   * a la otra**. Lo apuntado en §44.4.6.
   */
  'vista-notas': {
    aplicar: () => null,
    inerte: (c) => c.mazo.diapositivas.length === 0,
  },

  /* ── Vista → Patrones → los dos de papel (§44.4) ── */
  /*
   * Como `patron`: no cambian el documento por sí solos —abren una vista— y por
   * eso devuelven `null`. Se apagan sin diapositivas por la misma razón que el
   * resto: el molde de unas hojas que no existen no manda sobre nada.
   */
  'patron-documentos': {
    aplicar: () => null,
    inerte: (c) => c.mazo.diapositivas.length === 0,
  },
  'patron-notas': {
    aplicar: () => null,
    inerte: (c) => c.mazo.diapositivas.length === 0,
  },

  /* ── traer lo que ya existe (§44.5) ── */

  /*
   * Los dos que abren algo no aplican nada, como los patrones de §44.4: quien
   * enseña el panel y el diálogo es la ventana, y quien pone dentro el archivo
   * de origen y el documento de Word es la clase. Aquí sólo viven para tener
   * ficha, domicilio y estado — que es lo que el modo guía necesita para poder
   * señalarlos.
   */
  reutilizar: { aplicar: () => null },
  'esquema-word': { aplicar: () => null },

  'zoom-resumen': {
    aplicar: (c) => zoomDeResumen(c.mazo),
    /*
     * Apagado sin secciones, y con su motivo escrito: es **la mitad de la
     * lección**. El botón automático depende de que el trabajo previo esté
     * hecho, y un alumno que lo pulsa antes de seccionar tiene que enterarse de
     * eso y no de que «algo falló».
     */
    inerte: (c) => !secciones(c.mazo).length,
    porQue: () =>
      'El resumen se hace con las secciones, y esta presentación todavía no tiene ninguna. Primero pártela en secciones y luego vuelve.',
  },

  /* ── Inicio → Diapositivas → Restablecer (§43.4) ── */
  restablecer: {
    /*
     * Devuelve `null` cuando no hay nada que quitar, y eso lo apaga: un botón
     * que se puede pulsar sobre una diapositiva que ya hereda le diría al
     * alumno que hizo algo cuando no hizo nada.
     */
    aplicar: (c) => restablecer(c.mazo),
    inerte: (c) => {
      const d = laActiva(c.mazo);
      return !d || !d.marcadores.some((m) => m.casilla != null || m.formato);
    },
  },
};

/* ── las tres preguntas que la ventana le hace a un botón ─────────────────── */

const buscar = (id: string, clase?: ControlesDeClase): ControlDiapos | undefined =>
  clase?.[id] ?? COMANDOS[id];

/** ¿Está construido? Falso ⇒ el botón dice «aún no disponible» y no castiga. */
export const existe = (id: string, clase?: ControlesDeClase): boolean => !!buscar(id, clase);

/** ¿Existe pero aquí no se puede? */
export function estaInerte(ctx: Contexto, id: string, clase?: ControlesDeClase): boolean {
  const c = buscar(id, clase);
  if (!c) return true;
  return c.inerte?.(ctx) ?? false;
}

/** El motivo que da quien lo apagó, si es que da alguno. */
export function razonInerte(
  ctx: Contexto,
  id: string,
  clase?: ControlesDeClase,
): string | undefined {
  return buscar(id, clase)?.porQue?.(ctx);
}

/** ¿Se pinta hundido? */
export function estaActivo(ctx: Contexto, id: string, clase?: ControlesDeClase): boolean {
  return buscar(id, clase)?.activo?.(ctx) ?? false;
}

/** Ejecuta y devuelve el mazo nuevo, o el mismo si no pasó nada. */
export function ejecutar(ctx: Contexto, id: string, clase?: ControlesDeClase): Mazo {
  return buscar(id, clase)?.aplicar(ctx) ?? ctx.mazo;
}

/** Los que se quedan hundidos, para que el lector de pantalla lo anuncie. */
export const ES_INTERRUPTOR = new Set([
  'negrita',
  'cursiva',
  'subrayado',
  'vinetas',
  'numeros',
  'izquierda',
  'centro',
  'derecha',
  'transicion-ninguna',
  'transicion-desvanecer',
  'transicion-empujar',
  'anim-aparecer',
  'anim-enfasis',
  'anim-salir',
]);
