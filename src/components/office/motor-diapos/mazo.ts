/**
 * El mazo: la presentación entera, no una diapositiva suelta (§40.4).
 *
 * `modelo.ts` describe UNA diapositiva —su diseño, sus marcadores y sus objetos
 * libres— porque eso era lo que había que despejar el día de la prueba (§39).
 * Una clase necesita además lo que envuelve a esa diapositiva: varias de ellas
 * en un orden, cuál está seleccionada, las notas de cada una y el tema del mazo.
 *
 * Aquí no hay ni una tolerancia, igual que en `consultas.ts`: el orden es un
 * índice, el tema es un identificador y las notas son texto. Todo lo que se le
 * pregunta a un mazo se contesta con enteros, cadenas y booleanos.
 */

import {
  DISENOS,
  DURACION_POR_OMISION,
  FILAS,
  colsDe,
  NOMBRE_ANIMACION,
  cajaEntera,
  casillaDe,
  rolesDe,
  type Animacion,
  type GraficoId,
  type Serie,
  type SmartArtId,
  type Recorte,
  type Casilla,
  type Comentario,
  type Diapositiva,
  type DisenoId,
  type Forma,
  type Formato,
  type Libre,
  type Marcador,
  type Rol,
  type TemaId,
  type TipoAnimacion,
  type TransicionId,
} from './modelo';
import { dentroDelLienzo, marcadorLleno, paresQueSeTapan } from './consultas';

/* ── los temas ────────────────────────────────────────────────────────────── */

/*
 * El *nombre* de los temas vive en `modelo.ts` desde §44.5, porque una
 * diapositiva puede llevar el suyo puesto —la traída de otro archivo que se
 * queda con su cara— y el modelo no puede depender de este archivo, que sí
 * depende de él. Los COLORES se quedan aquí. Se reexporta para que los veinte
 * sitios que lo importan de `mazo` sigan valiendo: quién lo declara es asunto
 * del motor, no de quien lo usa.
 */
export type { TemaId, Forma };

export interface Tema {
  id: TemaId;
  nombre: string;
  fondo: string;
  texto: string;
  titulo: string;
  /**
   * El color con el que nacen las FORMAS (§44.2).
   *
   * Aparte del de los títulos, y no por gusto. Las formas se pintaban con
   * `titulo`, que en los cuatro temas es un color de letra —muy oscuro o muy
   * claro—, y una forma pintada de color-de-letra con su raya un tono más
   * oscura sale casi negra sobre casi negra: la raya no se ve, y el encargo
   * «quítale el contorno» vuelve a no cambiar nada. Un tono medio es lo que
   * hace que las dos cosas se distingan, y es lo que hace PowerPoint, donde el
   * relleno de fábrica es el acento del tema y no el color de los títulos.
   * Medido mirando la captura el 12-ago-2026.
   */
  acento: string;
  /** Lo que hace que el tema sea currículo y no adorno (§40.2, bloque 12). */
  cuandoSeUsa: string;
}

/**
 * Cuatro temas y ni uno más.
 *
 * Dos de ellos son claros y dos oscuros a propósito: la lección del contraste
 * de §27.2 —claro sobre oscuro u oscuro sobre claro— no se puede dar si todos
 * los temas van en la misma dirección.
 */
export const TEMAS: Record<TemaId, Tema> = {
  blanco: {
    id: 'blanco',
    nombre: 'Papel',
    fondo: '#FDFDFB',
    texto: '#1D2B45',
    titulo: '#123A6B',
    acento: '#3B7DD8',
    cuandoSeUsa: 'El de siempre. Letra oscura sobre fondo claro.',
  },
  arena: {
    id: 'arena',
    nombre: 'Arena',
    fondo: '#F3E4C7',
    texto: '#4A3413',
    titulo: '#8A4B12',
    acento: '#C97C2E',
    cuandoSeUsa: 'Cálido y claro. Va bien con fotos de desierto o de campo.',
  },
  noche: {
    id: 'noche',
    nombre: 'Noche',
    fondo: '#12203A',
    texto: '#EAF1FF',
    titulo: '#7FC4FF',
    acento: '#4F9CF9',
    cuandoSeUsa: 'Letra clara sobre fondo oscuro. Se ve muy bien proyectado.',
  },
  bosque: {
    id: 'bosque',
    nombre: 'Bosque',
    fondo: '#13342A',
    texto: '#E6F5EC',
    titulo: '#7FE0AE',
    acento: '#34A97B',
    cuandoSeUsa: 'Oscuro y con verde. Para temas de plantas y animales.',
  },
};

/**
 * **Con qué cara se pinta esta diapositiva** (§44.5).
 *
 * La suya si la trajo puesta —vino de otro archivo y conservó el formato de
 * origen—; si no, la del mazo. Es una sola línea, pero es la línea por la que
 * el encargo 3 se puede contestar mirando: dos diapositivas juntas, una con los
 * colores del año pasado y otra con los tuyos.
 *
 * Existe para que **nadie vuelva a escribir `TEMAS[m.tema]` al dibujar**: ahí
 * estaba la trampa, en que la pregunta parecía tener respuesta sin mirar la
 * diapositiva. Quien pinta pregunta aquí.
 *
 * Recibe **los dos temas y no el mazo ni la diapositiva**, a propósito. Con el
 * mazo por delante, el compilador de React daba por mutable todo lo que sale de
 * él —incluida la diapositiva activa— y se saltaba la memoización de media
 * ventana: nueve errores de `preserve-manual-memoization` de una sola llamada.
 * Una función que sólo compara dos nombres no tiene por qué pedir la casa
 * entera.
 */
export const temaDe = (delArchivo: TemaId, suyo?: TemaId | null): Tema => TEMAS[suyo ?? delArchivo];

/* ── el mazo ──────────────────────────────────────────────────────────────── */

export interface Mazo {
  tema: TemaId;
  diapositivas: Diapositiva[];
  /** Cuál se está viendo en el lienzo. Índice, no referencia. */
  activa: number;
  /**
   * El número de diapositiva en el pie (§42.3, bloque 26 del temario).
   *
   * Vive en el MAZO y no en cada diapositiva, y eso es la lección: se pone una
   * vez y sale en todas. Si viviera en la diapositiva habría que ponerlo siete
   * veces, y el alumno aprendería lo contrario de lo que el botón enseña.
   */
  numeroDiapositiva?: boolean;
  /**
   * **El pie: lo que sale abajo en todas sin escribirlo en ninguna** (§44.3).
   *
   * El nombre de la escuela, la fecha, el nombre del concurso. Vive en el mazo
   * por lo mismo que el número, y es la otra mitad de la misma lección: se pone
   * **una vez**. Un alumno que no conoce este cuadro lo escribe siete veces en
   * siete cuadros de texto, y el día que cambia el nombre lo cambia siete veces
   * —o seis, que es lo que pasa de verdad—.
   */
  pie?: string;
  /**
   * Y la casilla que casi siempre se marca: **que no salga en la portada**.
   *
   * Es de PowerPoint —«No mostrar en la diapositiva de título»— y apaga las dos
   * cosas, el pie y el número, en las diapositivas con acomodo de portada. Una
   * portada con un «1» en la esquina es lo que distingue una presentación hecha
   * con cuidado de una hecha deprisa.
   */
  sinPieEnPortada?: boolean;
  /**
   * **Para qué pantalla está hecha** (§44.3). Sin ella, 16:9, que es como abre
   * PowerPoint y como estaban las dieciocho clases anteriores.
   *
   * Vive en el mazo por el mismo motivo que el número de diapositiva, y es la
   * mitad de la lección: **el tamaño se cambia una vez y afecta a todo**. Una
   * presentación con dos diapositivas de formas distintas no existe.
   */
  forma?: Forma;
  /**
   * **La diapositiva que no se ve, y de la que todas heredan** (§43.4).
   *
   * Es una `Diapositiva` de verdad y no una tabla de estilos, y eso es lo que
   * hace que la vista Patrón funcione sin motor nuevo: se selecciona, se
   * formatea y se dibuja con exactamente el mismo aparato que cualquier otra.
   * En PowerPoint también es una diapositiva; llamarle de otra manera aquí
   * habría sido inventarse un concepto que el lunes no existe.
   *
   * Su contenido son los rótulos —«Estilo de título del patrón»—, que es lo que
   * PowerPoint escribe dentro de los marcadores del molde.
   *
   * Opcional: doce clases construidas no lo tienen y no heredan nada, que es
   * exactamente lo que hacían antes de que existiera.
   */
  patron?: Diapositiva;
  /**
   * Las presentaciones personalizadas: listas con nombre (§43.5).
   *
   * «De estas siete, enséñale la 1, la 5 y la 6, en ese orden». La misma
   * presentación sirve para el jurado, para los papás y para la clase **sin
   * hacer tres archivos**, que es la idea entera y la que le ahorra a un niño
   * la carpeta con `informe-final-v3-BUENO.pptx`.
   *
   * Viven en el mazo y no en la diapositiva porque son del archivo: una lista
   * que nombra a la 1 y a la 6 no puede pertenecer a ninguna de las dos.
   */
  personalizadas?: Personalizada[];
  /**
   * Quién hizo el archivo (§43.6).
   *
   * Vive en el mazo porque es del archivo y no de ninguna diapositiva, igual
   * que en un `.pptx` de verdad. Es lo que el inspector encuentra y lo que
   * sorprende: **el nombre de quien lo hizo viaja con el archivo** aunque nadie
   * lo haya escrito en ninguna diapositiva.
   */
  autor?: string;
  /**
   * Los tramos con nombre en que se parte una presentación larga (§44.1).
   *
   * **Cada sección guarda dónde EMPIEZA y nada más.** Dónde termina no se
   * guarda: termina donde empieza la siguiente, o al final del mazo. Guardar
   * también el final sería tener dos datos que pueden contradecirse, y bastaría
   * mover una diapositiva para que dijeran cosas distintas. Es la misma regla
   * que ya se aplicó a los callejones de §43.5: lo que se deriva no se escribe.
   *
   * Y por eso las secciones se reordenan solas cuando el alumno arrastra una
   * diapositiva en el Clasificador — porque no hay nada que reordenar, sólo
   * índices de arranque que `tramos()` vuelve a leer.
   */
  secciones?: Seccion[];
  /**
   * Los patrones de lo que se IMPRIME (§44.4).
   *
   * Dos, y hermanos del `patron` de §43.4: el de **documentos** manda en las
   * hojas que se reparten y el de **notas**, en las que te quedas tú. En
   * PowerPoint son dos vistas de patrón más, en el mismo sitio del menú, y
   * funcionan igual — se tocan una vez y valen para todas las hojas.
   *
   * No son un `Diapositiva` como el de diapositivas, y eso no es una
   * simplificación: **una hoja impresa no es una diapositiva**. No tiene tema,
   * ni transición, ni animaciones, ni casillas de 12 × 9; tiene cuatro rótulos
   * en las esquinas y un hueco en medio cuyo reparto lo decide el desplegable de
   * imprimir, no el patrón. Darles la forma de `Diapositiva` habría heredado
   * veinte campos que en papel no significan nada.
   */
  patronDocumentos?: PatronImpreso;
  patronNotas?: PatronImpreso;
}

/**
 * Lo que un patrón de hoja impresa puede decir. Los cuatro marcadores que
 * PowerPoint pone en las esquinas, ni uno más.
 *
 * `undefined` es «no lo has tocado» y `''` no existe: escribir y borrar deja el
 * campo vacío, que se guarda como `null`. Es la misma distinción que el relleno
 * `'ninguno'` de §44.2 — no habérselo puesto y habérselo quitado no son lo
 * mismo, y aquí importa porque un pie borrado a propósito no debe volver.
 */
export interface PatronImpreso {
  encabezado?: string | null;
  pie?: string | null;
  /** El número de página abajo a la derecha. En PowerPoint viene puesto. */
  numero?: boolean;
  /** La fecha arriba a la derecha. En PowerPoint viene puesta. */
  fecha?: boolean;
}

export type CualPatronImpreso = 'documentos' | 'notas';

const CAMPO_DE_PATRON: Record<CualPatronImpreso, 'patronDocumentos' | 'patronNotas'> = {
  documentos: 'patronDocumentos',
  notas: 'patronNotas',
};

export const patronImpreso = (m: Mazo, cual: CualPatronImpreso): PatronImpreso =>
  m[CAMPO_DE_PATRON[cual]] ?? {};

/**
 * Cambia un patrón de hoja impresa **fusionando**, nunca sustituyendo.
 *
 * Misma regla que `formatearEn`: poner el pie no puede borrar el encabezado que
 * el alumno acababa de escribir. El defecto se pagó tres veces en Word y una en
 * las diapositivas; aquí ya nace bien.
 */
export function tocarPatronImpreso(
  m: Mazo,
  cual: CualPatronImpreso,
  cambio: PatronImpreso,
): Mazo {
  const campo = CAMPO_DE_PATRON[cual];
  return { ...m, [campo]: { ...(m[campo] ?? {}), ...cambio } };
}

/** Una selección con nombre. `diapositivas` son índices, y el orden cuenta. */
export interface Personalizada {
  nombre: string;
  diapositivas: number[];
}

/** Un tramo con nombre. `desde` es el índice de la diapositiva donde arranca. */
export interface Seccion {
  nombre: string;
  desde: number;
  /** Plegada en la tira y en el Clasificador. No cambia lo que se presenta. */
  plegada?: boolean;
}

/**
 * El formato con el que se pinta un marcador: **lo suyo manda sobre el patrón**.
 *
 * Ése es el orden entero de la herencia y es toda la lección de §43.4: el patrón
 * pone el color de los doce títulos, y el título que alguien pintó a mano se
 * queda como estaba. No es un defecto, es una **anulación** — le dijiste al
 * programa «ésta la mando yo»—, y explica el misterio de «¿por qué no me cambió
 * una?».
 *
 * Se mezcla propiedad a propiedad y no de golpe: una diapositiva a la que
 * alguien puso negrita sigue heredando el color del patrón. Sustituir el objeto
 * entero habría hecho que tocar una sola cosa desheredara todas las demás.
 */
export function formatoConPatron(m: Mazo, d: Diapositiva, rol: Rol): Formato {
  return { ...(m.patron?.marcadores.find((x) => x.rol === rol)?.formato ?? {}), ...formatoDe(d, { tipo: 'marcador', rol }) };
}

/**
 * Le quita a la diapositiva activa todo lo que puso a mano, y con eso vuelve a
 * heredar. Es el botón que hace visible la lección: hasta que no se pulsa, la
 * anulación parece un defecto del programa.
 */
export function restablecer(m: Mazo): Mazo | null {
  const d = laActiva(m);
  if (!d) return null;
  if (!d.marcadores.some((x) => x.casilla != null || x.formato)) return null;
  return conLaActiva(m, (x) => ({
    ...x,
    marcadores: x.marcadores.map((y) => ({ rol: y.rol, contenido: y.contenido, casilla: null })),
  }));
}

export function mazoVacio(tema: TemaId = 'blanco'): Mazo {
  return { tema, diapositivas: [], activa: 0 };
}

/** Una diapositiva nueva con ese diseño, con sus marcadores vacíos por rol. */
export function diapositivaNueva(diseno: DisenoId): Diapositiva {
  return {
    diseno,
    marcadores: rolesDe(diseno).map((rol) => ({ rol, contenido: null, casilla: null })),
    libres: [],
    notas: '',
  };
}

export const laActiva = (m: Mazo): Diapositiva | null => m.diapositivas[m.activa] ?? null;

/**
 * Cambia la diapositiva activa sin tocar el resto. Devuelve un mazo nuevo.
 *
 * **Y le borra el tiempo medido** (§43.3.0). Por aquí pasa todo lo que cambia
 * el contenido de una diapositiva —escribir, insertar, mover, convertir— y un
 * `intervalo` medido sobre un contenido que ya no está es un número que miente
 * con cara de dato: recortas la diapositiva de catorce viñetas y la hoja te
 * sigue cobrando los 77 segundos que tardaste cuando tenía catorce. Al borrarse
 * queda «sin medir» y el estimado en gris, que es la verdad, y por eso el último
 * encargo de la clase existe: hay que volver a ensayar.
 *
 * `irA` no pasa por aquí y `ponerIntervalo` tampoco, que es lo que hace que
 * presentar no borre lo que el propio ensayo acaba de escribir.
 */
export function conLaActiva(m: Mazo, cambio: (d: Diapositiva) => Diapositiva): Mazo {
  return {
    ...m,
    diapositivas: m.diapositivas.map((d, i) =>
      // Y con la narración igual (§44.6): si cambias la diapositiva, lo que
      // grabaste hablando de ella ya no habla de ella. En PowerPoint pasa lo
      // mismo y sorprende al que no lo sabe.
      i === m.activa ? { ...cambio(d), intervalo: undefined, narrada: undefined } : d,
    ),
  };
}

/** Deja puesto el tiempo que se midió en el ensayo. No toca nada más. */
export function ponerIntervalo(m: Mazo, i: number, segundos: number): Mazo {
  return {
    ...m,
    diapositivas: m.diapositivas.map((d, k) => (k === i ? { ...d, intervalo: segundos } : d)),
  };
}

/* ── grabar la presentación (§44.6) ───────────────────────────────────────── */

/**
 * Deja la diapositiva **narrada y con su tiempo**, que es lo que graba
 * PowerPoint: lo que dijiste y cuánto tardaste.
 *
 * Los dos datos a la vez y en una sola función, porque grabar es un solo gesto.
 * Con dos llamadas separadas existiría el estado imposible «narrada sin tiempo»,
 * y alguien tendría que acordarse de no crearlo nunca.
 *
 * **La grabación PISA el intervalo del ensayo**, sin preguntar y sin comparar:
 * es la tercera cosa práctica que la clase enseña —hablar tarda más que pasar—
 * y se ve sola en la hoja de intervalos en cuanto se mira.
 */
export function grabarEn(m: Mazo, i: number, segundos: number): Mazo {
  return {
    ...m,
    diapositivas: m.diapositivas.map((d, k) =>
      k === i ? { ...d, intervalo: segundos, narrada: true } : d,
    ),
  };
}

/**
 * Quita la voz de TODAS y **deja los tiempos puestos**.
 *
 * Eso último no es un descuido: en PowerPoint «Quitar narración» y «Quitar
 * intervalos» son dos botones distintos, y la diferencia importa el día que
 * presentas tú — quieres que deje de hablar, no que deje de pasar sola. Si esto
 * borrara los intervalos, el alumno perdería el ensayo entero por quitar la voz.
 */
export function quitarNarracion(m: Mazo): Mazo {
  return { ...m, diapositivas: m.diapositivas.map((d) => ({ ...d, narrada: undefined })) };
}

/** Cuántas llevan voz. Es lo que mira el encargo y lo que dice la tira. */
export const cuantasNarradas = (m: Mazo): number =>
  m.diapositivas.filter((d) => d.narrada).length;

export function agregar(m: Mazo, diseno: DisenoId): Mazo {
  const diapositivas = [...m.diapositivas, diapositivaNueva(diseno)];
  return { ...m, diapositivas, activa: diapositivas.length - 1 };
}

export function duplicar(m: Mazo): Mazo {
  const d = laActiva(m);
  if (!d) return m;
  const copia: Diapositiva = {
    ...d,
    marcadores: d.marcadores.map((x) => ({ ...x })),
    libres: d.libres.map((x) => ({ ...x })),
  };
  const diapositivas = [...m.diapositivas];
  diapositivas.splice(m.activa + 1, 0, copia);
  // Los cortes de detrás se corren, como en `traer`: duplicar en medio de un
  // mazo seccionado descolocaba las secciones desde §44.1 y nadie lo había
  // pisado porque ninguna clase hacía las dos cosas a la vez.
  return { ...m, diapositivas, activa: m.activa + 1, secciones: conLosCortesCorridos(m, m.activa, 1) };
}

/**
 * Los cortes de sección, corridos cuando entra o sale una diapositiva.
 *
 * Una sección guarda **dónde empieza** y nada más (ver `Mazo.secciones`), así
 * que meter una diapositiva en medio le cambia el sitio a todos los cortes que
 * vengan detrás. Sin esto, traer la portada al principio dejaría cada sección
 * nombrando a las diapositivas de la de al lado — y el Zoom de resumen, que se
 * deriva de ellas, apuntando a donde no es.
 *
 * Los cortes **en el punto exacto** de una inserción sí se corren: lo que entra
 * va detrás de la diapositiva actual, o sea dentro de su sección y no como
 * primera de la siguiente.
 */
function conLosCortesCorridos(m: Mazo, desde: number, cuanto: number): Seccion[] | undefined {
  if (!m.secciones?.length || cuanto === 0) return m.secciones;
  return m.secciones.map((s) => (s.desde > desde ? { ...s, desde: s.desde + cuanto } : s));
}

/**
 * **Traer una diapositiva de otro archivo** (§44.5, MOS 2.1.1).
 *
 * Entra detrás de la que estás viendo y se queda seleccionada, como en
 * PowerPoint: reutilizar no es «añadir al final», es «meterla aquí».
 *
 * ── LA CASILLA QUE ES LA LECCIÓN ────────────────────────────────────────────
 *
 * `conSuCara` es «Conservar el formato de origen». Con ella, la diapositiva se
 * queda con el tema de la casa de donde salió y se ve distinta de sus vecinas;
 * sin ella, toma la del archivo que la recibe. Casi nadie mira esa casilla, y
 * por eso las presentaciones de trabajos en equipo salen con tres caras.
 *
 * **Sin ella se BORRA el tema, no se deja el que traía.** Es el caso que se
 * escribe mal solo: la ajena puede venir ya con su tema puesto —fue traída
 * antes—, y un `spread` se lo copiaría tal cual, así que la casilla apagada no
 * haría nada y la mitad del encargo se quedaría sin poder cumplirse.
 */
export function traer(m: Mazo, ajena: Diapositiva, origen: TemaId, conSuCara: boolean): Mazo {
  const copia: Diapositiva = {
    ...ajena,
    marcadores: ajena.marcadores.map((x) => ({ ...x })),
    libres: ajena.libres.map((x) => ({ ...x })),
    // Escrito SIEMPRE, nunca dejado como venía: si la ajena traía tema propio,
    // omitir esta línea cuando la casilla está apagada se lo dejaría puesto.
    tema: conSuCara ? origen : undefined,
  };
  const diapositivas = [...m.diapositivas];
  const donde = m.diapositivas.length ? m.activa + 1 : 0;
  diapositivas.splice(donde, 0, copia);
  return { ...m, diapositivas, activa: donde, secciones: conLosCortesCorridos(m, m.activa, 1) };
}

/**
 * **Varias de golpe, detrás de la que estás viendo** (§44.5).
 *
 * Es lo que hace «Diapositivas del esquema»: un documento de Word entra entero
 * y en su orden, y la última queda seleccionada — que es lo que hace el
 * programa y lo que deja al alumno mirando lo que acaba de traer.
 *
 * ── POR QUÉ ESTO ES UNA FUNCIÓN Y NO UN `splice` EN EL DIÁLOGO ──────────────
 *
 * Porque escrito a mano ya salió mal. La primera versión insertaba las cuatro
 * diapositivas dentro del cuadro de diálogo y **no corría los cortes de
 * sección**, así que el Zoom de resumen del encargo siguiente armaba el índice
 * con las secciones descolocadas: el botón «Lo que salió» llevaba a una
 * diapositiva del informe. `traer`, `duplicar` y `quitar` sí los corrían; el
 * único sitio donde la inserción estaba escrita fuera de este archivo era el
 * único que se equivocaba. **Una inserción escrita a mano es una inserción que
 * no sabe de secciones.**
 */
export function traerVarias(m: Mazo, nuevas: Diapositiva[]): Mazo {
  if (!nuevas.length) return m;
  const diapositivas = [...m.diapositivas];
  const donde = m.diapositivas.length ? m.activa + 1 : 0;
  diapositivas.splice(donde, 0, ...nuevas);
  return {
    ...m,
    diapositivas,
    activa: donde + nuevas.length - 1,
    secciones: conLosCortesCorridos(m, m.activa, nuevas.length),
  };
}

export function quitar(m: Mazo): Mazo {
  if (m.diapositivas.length <= 1) return m;
  const diapositivas = m.diapositivas.filter((_, i) => i !== m.activa);
  return {
    ...m,
    diapositivas,
    activa: Math.min(m.activa, diapositivas.length - 1),
    secciones: conLosCortesCorridos(m, m.activa, -1),
  };
}

/**
 * Mueve una diapositiva de sitio. Es la mecánica de la fase 3 de §27.1.
 *
 * Reordenar es un `splice` de dos pasos y se hace sobre una copia, nunca sobre
 * el arreglo del estado: mutar aquí deja la tira pintada con el orden nuevo y el
 * modelo con el viejo, que es un defecto que no se ve hasta que se comprueba.
 */
export function mover(m: Mazo, desde: number, hasta: number): Mazo {
  if (desde === hasta || desde < 0 || hasta < 0) return m;
  if (desde >= m.diapositivas.length || hasta >= m.diapositivas.length) return m;
  const diapositivas = [...m.diapositivas];
  const [sacada] = diapositivas.splice(desde, 1);
  diapositivas.splice(hasta, 0, sacada);
  return { ...m, diapositivas, activa: hasta };
}

export function cambiarDiseno(m: Mazo, diseno: DisenoId): Mazo {
  return conLaActiva(m, (d) => {
    /*
     * El contenido sobrevive al cambio de diseño porque los marcadores viven
     * por ROL: los que el diseño nuevo también pide conservan su texto y sueltan
     * su anulación —vuelven a la casilla del diseño—, y los que no, se van.
     * Medido el 10-ago-2026 en la prueba del §39: 0 pérdidas de contenido.
     */
    const quiere = rolesDe(diseno);
    const conservados = d.marcadores
      .filter((x) => quiere.includes(x.rol))
      .map((x) => ({ ...x, casilla: null }));
    const faltan = quiere
      .filter((rol) => !conservados.some((x) => x.rol === rol))
      .map((rol) => ({ rol, contenido: null, casilla: null }));
    return { ...d, diseno, marcadores: [...conservados, ...faltan] };
  });
}

export function escribirEn(m: Mazo, rol: Rol, texto: string): Mazo {
  return conLaActiva(m, (d) => ({
    ...d,
    marcadores: d.marcadores.map((x) => (x.rol === rol ? { ...x, contenido: texto } : x)),
  }));
}

/**
 * Escribir dentro de un objeto suelto de texto — el cuadro de texto (§44.2).
 *
 * `escribirEn` sólo sabía de marcadores porque hasta §44.2 sólo los marcadores
 * llevaban texto que el alumno pudiera cambiar. Un cuadro de texto que se
 * inserta y no se puede escribir es una caja que dice «Escribe aquí» y no deja:
 * el encargo pide justo eso y el aparato no lo tenía. Se corrige donde faltaba
 * —en el mazo—, no en la clase, porque el defecto es del programa.
 */
export function escribirLibre(m: Mazo, id: string, texto: string): Mazo {
  return conLaActiva(m, (d) => ({
    ...d,
    libres: d.libres.map((l) => (l.id === id ? { ...l, contenido: texto } : l)),
  }));
}

export function escribirNotas(m: Mazo, texto: string): Mazo {
  return conLaActiva(m, (d) => ({ ...d, notas: texto }));
}

/**
 * Cambia el formato de una caja **fusionando**, nunca sustituyendo.
 *
 * Poner el título en negrita no puede borrarle el tamaño que el alumno acababa
 * de elegir. Es el defecto que en Word costó tres veces —cada marca de
 * ProseMirror vive por su cuenta justamente por esto— y aquí se evita en la
 * única línea donde se puede evitar.
 */
export function formatearEn(m: Mazo, sitio: Sitio, cambio: Formato): Mazo {
  return conLaActiva(m, (d) =>
    sitio.tipo === 'marcador'
      ? {
          ...d,
          marcadores: d.marcadores.map((x) =>
            x.rol === sitio.rol ? { ...x, formato: { ...x.formato, ...cambio } } : x,
          ),
        }
      : {
          ...d,
          libres: d.libres.map((l) =>
            l.id === sitio.id ? { ...l, formato: { ...l.formato, ...cambio } } : l,
          ),
        },
  );
}

/** Dónde está apuntando el alumno. `null` = no hay nada seleccionado. */
export type Sitio = { tipo: 'marcador'; rol: Rol } | { tipo: 'libre'; id: string };

/** El formato efectivo de una caja: lo que tenga puesto, o nada. */
export function formatoDe(d: Diapositiva, sitio: Sitio): Formato {
  return (
    (sitio.tipo === 'marcador'
      ? d.marcadores.find((x) => x.rol === sitio.rol)?.formato
      : d.libres.find((l) => l.id === sitio.id)?.formato) ?? {}
  );
}

export const cambiarTema = (m: Mazo, tema: TemaId): Mazo => ({ ...m, tema });

/* ── el tamaño de diapositiva (§44.3) ────────────────────────────────── */

/**
 * Cambia la forma de la pantalla, **y no toca nada más**.
 *
 * ── LO QUE NO HACE, QUE ES LA CLASE ─────────────────────────────────────────
 *
 * No recoloca los objetos del alumno. Es lo que PowerPoint llama **Maximizar**
 * —frente a «Asegurar ajuste», que los encoge— y es la opción que enseña:
 * pasar de 16:9 a 4:3 estrecha el lienzo tres columnas, y lo que estaba
 * colocado en las de la derecha **se queda donde estaba y deja de caber**.
 *
 * Los marcadores sí se recolocan, y tampoco hay que escribirlo: su casilla la
 * pone el acomodo, que tiene un juego por forma (`casillasDelDiseno`). Esa
 * asimetría —el molde se ajusta solo, lo que pusiste tú no— es exactamente lo
 * que pasa el lunes, y es la razón de que el consejo sea **cambiar el tamaño
 * antes de maquetar**.
 *
 * Un marcador que el alumno hubiera movido a mano lleva `casilla` propia y se
 * comporta como un objeto suyo, que es lo correcto: en cuanto lo mueves deja de
 * ser del molde.
 */
export const cambiarForma = (m: Mazo, forma: Forma): Mazo => ({ ...m, forma });

/**
 * Lo que se sale del lienzo en esta presentación, diapositiva por diapositiva.
 *
 * Devuelve los ids de los objetos libres que no caben. Es lo que el proyector
 * de la clase pinta en rojo y lo que cierra el encargo de recolocar: **la
 * pregunta «ya cabe todo» tiene que contestarla el mazo, no el ojo**.
 */
export function loQueSeSale(m: Mazo, i: number): string[] {
  const d = m.diapositivas[i];
  if (!d) return [];
  return d.libres.filter((l) => !dentroDelLienzo(l.casilla, m.forma)).map((l) => l.id);
}

/** ¿Cabe TODO, en todas? Es el logro del encargo de recolocar. */
export const todoCabe = (m: Mazo): boolean =>
  m.diapositivas.every((_, i) => loQueSeSale(m, i).length === 0);

/** Mete un objeto en la diapositiva activa, encima de todo lo que ya había. */
export function agregarLibre(m: Mazo, libre: Omit<Libre, 'z'>): Mazo {
  return conLaActiva(m, (d) => ({
    ...d,
    libres: [...d.libres, { ...libre, z: d.libres.reduce((z, l) => Math.max(z, l.z), 0) + 1 }],
  }));
}

/* ── organizar: alinear, distribuir, agrupar y orden Z (§42.3) ────────────── */

export type Organizacion =
  | 'alinear-izq'
  | 'alinear-centro-h'
  | 'alinear-der'
  | 'alinear-arriba'
  | 'alinear-centro-v'
  | 'alinear-abajo'
  | 'distribuir-h'
  | 'distribuir-v'
  | 'agrupar'
  | 'desagrupar'
  | 'al-frente'
  | 'al-fondo';

/** Cómo se llama cada una, para qué sirve y desde cuántos objetos tiene sentido. */
export const ORGANIZAR: { id: Organizacion; nombre: string; detalle: string; desde: number }[] = [
  { id: 'alinear-izq', nombre: 'Alinear a la izquierda', detalle: 'Todos empiezan en la misma raya.', desde: 2 },
  { id: 'alinear-centro-h', nombre: 'Centrar uno sobre otro', detalle: 'Todos con el mismo centro, en columna.', desde: 2 },
  { id: 'alinear-der', nombre: 'Alinear a la derecha', detalle: 'Todos terminan en la misma raya.', desde: 2 },
  { id: 'alinear-arriba', nombre: 'Alinear arriba', detalle: 'Todos con el borde de arriba a la misma altura.', desde: 2 },
  { id: 'alinear-centro-v', nombre: 'Centrar a la misma altura', detalle: 'Todos con el centro en la misma línea.', desde: 2 },
  { id: 'alinear-abajo', nombre: 'Alinear abajo', detalle: 'Todos con el borde de abajo a la misma altura.', desde: 2 },
  { id: 'distribuir-h', nombre: 'Distribuir horizontalmente', detalle: 'A la misma distancia unos de otros, de izquierda a derecha.', desde: 3 },
  { id: 'distribuir-v', nombre: 'Distribuir verticalmente', detalle: 'A la misma distancia unos de otros, de arriba abajo.', desde: 3 },
  { id: 'agrupar', nombre: 'Agrupar', detalle: 'Los convierte en uno solo: se mueven juntos y no se descolocan.', desde: 2 },
  { id: 'desagrupar', nombre: 'Desagrupar', detalle: 'Los vuelve a separar.', desde: 1 },
  { id: 'al-frente', nombre: 'Traer al frente', detalle: 'Lo pone encima de todo lo demás.', desde: 1 },
  { id: 'al-fondo', nombre: 'Enviar al fondo', detalle: 'Lo manda detrás de todo lo demás.', desde: 1 },
];

const idsDe = (sitios: Sitio[]): string[] =>
  sitios.filter((s): s is { tipo: 'libre'; id: string } => s.tipo === 'libre').map((s) => s.id);

/**
 * Los elegidos **más sus compañeros de grupo**, para lo que trata al grupo como
 * una pieza (§44.2).
 *
 * Arrastrar una del grupo movía las tres desde el primer día (`moverConSuGrupo`)
 * y en cambio «Enviar al fondo» mandaba sólo la pinchada: el alumno acababa de
 * leer «ahora son una sola pieza», hacía el gesto y se le quedaban dos formas
 * arriba tapando el título. Un grupo que a veces es una pieza y a veces tres es
 * peor que no tener grupos.
 *
 * **No para alinear ni distribuir**, y eso no es una excepción caprichosa:
 * alinear un grupo lo alinea como bloque, no coloca a sus miembros uno encima de
 * otro, y eso es geometría de otra clase. Mientras nadie la necesite, alinear
 * hace lo que dice sobre lo que hay elegido.
 */
function conSusGrupos(d: Diapositiva, ids: string[], que: Organizacion): string[] {
  if (que.startsWith('alinear') || que.startsWith('distribuir') || que === 'agrupar') return ids;
  const grupos = new Set(
    d.libres.filter((l) => ids.includes(l.id) && l.grupo).map((l) => l.grupo as string),
  );
  if (grupos.size === 0) return ids;
  return [
    ...new Set([...ids, ...d.libres.filter((l) => l.grupo && grupos.has(l.grupo)).map((l) => l.id)]),
  ];
}

/**
 * Aplica una organización a los objetos seleccionados.
 *
 * Sólo objetos sueltos: un marcador vive donde el diseño dice, y moverlo con
 * «Alinear» sería quitarle el sitio que el patrón le va a devolver mañana
 * (`of-ppt-patron`). En PowerPoint alinear un marcador sí se puede; aquí la
 * simplificación es honesta y no choca con la herencia del §39.
 *
 * Devuelve `null` cuando no hay nada que hacer, que es lo que `ejecutar`
 * traduce en «el mazo no cambió».
 */
export function organizar(m: Mazo, sitios: Sitio[], que: Organizacion): Mazo | null {
  const d = laActiva(m);
  if (!d) return null;
  const ids = conSusGrupos(d, idsDe(sitios), que);
  const elegidos = d.libres.filter((l) => ids.includes(l.id));
  if (elegidos.length === 0) return null;

  if (que === 'agrupar') {
    if (elegidos.length < 2) return null;
    // El nombre del grupo se DERIVA de quiénes lo forman, ordenados: agrupar dos
    // veces lo mismo da el mismo nombre, así que la operación es idempotente y
    // no deja grupos fantasma.
    const grupo = `g:${[...ids].sort().join('+')}`;
    return conLaActiva(m, (x) => ({
      ...x,
      libres: x.libres.map((l) => (ids.includes(l.id) ? { ...l, grupo } : l)),
    }));
  }
  if (que === 'desagrupar') {
    return conLaActiva(m, (x) => ({
      ...x,
      libres: x.libres.map((l) => (ids.includes(l.id) ? { ...l, grupo: undefined } : l)),
    }));
  }
  if (que === 'al-frente' || que === 'al-fondo') {
    const tope = d.libres.reduce((z, l) => Math.max(z, l.z), 0);
    const suelo = d.libres.reduce((z, l) => Math.min(z, l.z), 0);
    return conLaActiva(m, (x) => ({
      ...x,
      libres: x.libres.map((l) =>
        ids.includes(l.id) ? { ...l, z: que === 'al-frente' ? tope + 1 : suelo - 1 } : l,
      ),
    }));
  }

  if (elegidos.length < 2) return null;
  const cajas = elegidos.map((l) => l.casilla);
  const nuevas = new Map<string, Casilla>();

  if (que.startsWith('alinear')) {
    const izq = Math.min(...cajas.map((c) => c.col));
    const der = Math.max(...cajas.map((c) => c.col + c.cols));
    const arr = Math.min(...cajas.map((c) => c.fila));
    const abj = Math.max(...cajas.map((c) => c.fila + c.filas));
    for (const l of elegidos) {
      const c = l.casilla;
      const col =
        que === 'alinear-izq' ? izq
        : que === 'alinear-der' ? der - c.cols
        : que === 'alinear-centro-h' ? Math.round((izq + der - c.cols) / 2)
        : c.col;
      const fila =
        que === 'alinear-arriba' ? arr
        : que === 'alinear-abajo' ? abj - c.filas
        : que === 'alinear-centro-v' ? Math.round((arr + abj - c.filas) / 2)
        : c.fila;
      nuevas.set(l.id, {
        ...c,
        // El tope es el de ESTA presentación, no el de 16:9: en 4:3 el lienzo
        // acaba en la columna 9 y arrastrar hasta la 12 sacaría la caja de la
        // pantalla sin que nada lo dijera (§44.3).
        col: Math.max(0, Math.min(colsDe(m.forma) - c.cols, col)),
        fila: Math.max(0, Math.min(FILAS - c.filas, fila)),
      });
    }
  } else {
    /*
     * Distribuir: los dos de los extremos no se mueven y el hueco que sobra se
     * reparte entre los de en medio. El cursor acumula el hueco en decimales y
     * sólo se redondea al colocar, que es lo que evita que el error se sume y
     * el último acabe pegado al de al lado.
     */
    const h = que === 'distribuir-h';
    const ini = (c: Casilla) => (h ? c.col : c.fila);
    const largo = (c: Casilla) => (h ? c.cols : c.filas);
    const orden = [...elegidos].sort((a, b) => ini(a.casilla) - ini(b.casilla));
    if (orden.length < 3) return null;
    const ultimo = orden[orden.length - 1].casilla;
    const desde = ini(orden[0].casilla);
    const hasta = ini(ultimo) + largo(ultimo);
    const ocupado = orden.reduce((s, l) => s + largo(l.casilla), 0);
    const hueco = (hasta - desde - ocupado) / (orden.length - 1);
    let cursor = desde;
    orden.forEach((l, i) => {
      const c = l.casilla;
      /*
       * El último se CLAVA en su borde en vez de redondearse. Sin esa
       * excepción, dos redondeos hacia arriba lo empujaban fuera del lienzo —
       * medido con tres tarjetas de tres casillas: acababa en la columna 10 con
       * tres de ancho sobre doce columnas—. Los extremos no se mueven al
       * distribuir; eso es lo que significa distribuir.
       */
      const v = i === 0 ? desde : i === orden.length - 1 ? hasta - largo(c) : Math.round(cursor);
      nuevas.set(l.id, h ? { ...c, col: v } : { ...c, fila: v });
      cursor = v + largo(c) + hueco;
    });
  }

  return conLaActiva(m, (x) => ({
    ...x,
    libres: x.libres.map((l) => (nuevas.has(l.id) ? { ...l, casilla: nuevas.get(l.id)! } : l)),
  }));
}

/** El pie con el número: se pone una vez y sale en todas. */
export const ponerNumeroDeDiapositiva = (m: Mazo, puesto: boolean): Mazo => ({
  ...m,
  numeroDiapositiva: puesto,
});

/** Todo lo del cuadro de «Encabezado y pie» de una vez (§44.3): es un solo
 *  gesto en el programa —se acepta el cuadro— y tiene que serlo aquí. */
export const ponerElPie = (
  m: Mazo,
  v: { numero: boolean; pie: string; sinPieEnPortada: boolean },
): Mazo => ({
  ...m,
  numeroDiapositiva: v.numero,
  pie: v.pie.trim() || undefined,
  sinPieEnPortada: v.sinPieEnPortada,
});

/**
 * Qué sale abajo en esa diapositiva: el número, el pie, los dos o nada.
 *
 * **Una sola función para las dos superficies** —el lienzo y la lámina— y para
 * las dos cosas que la casilla apaga a la vez. Repartir la regla entre quien
 * pinta el número y quien pinta el texto es cómo se acaba con una portada sin
 * pie y con número.
 */
export function pieDe(m: Mazo, i: number): { numero: number | null; texto: string | null } {
  const d = m.diapositivas[i];
  const esPortada = d?.diseno === 'portada';
  if (!d || (m.sinPieEnPortada && esPortada)) return { numero: null, texto: null };
  return { numero: m.numeroDiapositiva ? i + 1 : null, texto: m.pie ?? null };
}

/* ── convertir una lista en un dibujo (§43.2) ─────────────────────────────── */

/** Los renglones del cuerpo, sin los vacíos. Es de lo que se convierte. */
export function renglonesDelCuerpo(d: Diapositiva): string[] {
  const c = d.marcadores.find((x) => x.rol === 'cuerpo');
  return c?.contenido ? c.contenido.split('\n').map((s) => s.trim()).filter(Boolean) : [];
}

/**
 * Saca el número que hay al final de un renglón.
 *
 * «Papel: 12 kilos» → `{ nombre: 'Papel', valor: 12 }`. Si no hay número, el
 * renglón entero es el nombre y el valor es 1: un gráfico con todas las barras
 * iguales se ve raro **a propósito**, porque significa que ese texto no eran
 * datos y el alumno eligió mal la forma. Inventarle números sería taparlo.
 */
function comoDato(renglon: string): Serie {
  const m = renglon.match(/^(.*?)[\s:·-]*(\d+(?:[.,]\d+)?)\s*\S*$/);
  if (!m) return { nombre: renglon, valor: 1 };
  const nombre = m[1].replace(/[\s:·-]+$/, '').trim();
  return { nombre: nombre || renglon, valor: Number(m[2].replace(',', '.')) };
}

/** Las celdas de un renglón. El separador visible es `·`, como en la lista. */
const comoFila = (renglon: string): string[] =>
  renglon.split('·').map((s) => s.trim()).filter((s, i, a) => s.length > 0 || i < a.length - 1);

/**
 * Convierte el CUERPO de la diapositiva activa en un SmartArt, un gráfico o una
 * tabla, y deja el marcador vacío.
 *
 * ── LO QUE ESTE GESTO ES, Y LO QUE NO ───────────────────────────────────────
 *
 * Para el SmartArt es literal: en PowerPoint se selecciona el marcador con las
 * viñetas y se pulsa **Convertir a SmartArt**, y las viñetas se meten dentro
 * del diagrama. Es el gesto que hace que SmartArt no sea un dibujo aparte sino
 * una forma que se le da a una lista.
 *
 * Para el gráfico y la tabla es una **simplificación declarada**: en el
 * programa de verdad se inserta el objeto vacío y se escribe dentro —en una
 * hojita de datos el gráfico, celda por celda la tabla—. Aquí la lista de la
 * diapositiva hace de datos de partida, y se hace así porque la lección de
 * §43.2 es **elegir la forma que le corresponde al dato**, no teclear doce
 * celdas. Queda escrito para que nadie lo lea como una copia fiel: `of-excel-*`
 * enseña la hoja de datos, y ése es su sitio.
 *
 * Devuelve `null` si no hay cuerpo con texto, que es lo que `ejecutar` traduce
 * en «el mazo no cambió» y lo que apaga el botón.
 */
export type ClaseDibujada = 'smartart' | 'grafico' | 'tabla';

/** Los datos del objeto según su clase. Todo sale de la misma lista. */
function conLosDatos(clase: ClaseDibujada, variante: string | undefined, origen: string[]) {
  if (clase === 'smartart') {
    return { variante: (variante ?? 'proceso') as SmartArtId, pasos: origen, series: undefined, filas: undefined };
  }
  if (clase === 'grafico') {
    return {
      variante: (variante ?? 'barras') as GraficoId,
      series: origen.map(comoDato),
      pasos: undefined,
      filas: undefined,
    };
  }
  return { variante: undefined, filas: origen.map(comoFila), pasos: undefined, series: undefined };
}

const NOMBRE_CLASE: Record<ClaseDibujada, string> = {
  smartart: 'diagrama',
  grafico: 'gráfico',
  tabla: 'tabla',
};

export function convertirElCuerpo(
  m: Mazo,
  clase: ClaseDibujada,
  variante?: string,
): Mazo | null {
  const d = laActiva(m);
  if (!d) return null;
  const origen = renglonesDelCuerpo(d);
  if (origen.length === 0) return null;
  const casilla = casillaDe(d, 'cuerpo');
  if (!casilla) return null;

  const base: Libre = {
    id: `${clase}-${d.libres.length + 1}`,
    clase,
    contenido: NOMBRE_CLASE[clase],
    casilla,
    z: d.libres.reduce((z, l) => Math.max(z, l.z), 0) + 1,
    origen,
    ...conLosDatos(clase, variante, origen),
  };

  return conLaActiva(m, (x) => ({
    ...x,
    // El marcador NO se borra: se vacía. Sigue siendo el marcador de cuerpo del
    // diseño, con su rol y su sitio, y por eso el patrón podrá moverlo mañana
    // (§39). Borrarlo habría sido perder el ancla, que es la lección de §36.8 C.
    marcadores: x.marcadores.map((y) => (y.rol === 'cuerpo' ? { ...y, contenido: null } : y)),
    libres: [...x.libres, base],
  }));
}

/**
 * ¿El cuerpo de esta diapositiva le **cedió** su texto a un dibujo?
 *
 * Se deriva de `origen`, que es donde `convertirElCuerpo` guarda las viñetas de
 * las que salió el objeto; no hace falta una bandera nueva ni tocar el modelo.
 *
 * Existe porque un marcador vacío miente dos veces cuando el texto se le fue a
 * un diagrama: el borde punteado dice «falta esto» y la pista dice «doble clic
 * para escribir», y ninguna de las dos es verdad —el texto está ahí mismo,
 * dentro del dibujo—. Jugando se veía «Doble clic para escribir» escrito por
 * encima de la tabla, en medio de la diapositiva.
 */
export const cuerpoCedido = (d: Diapositiva): boolean =>
  d.libres.some((l) => l.origen !== undefined);

/**
 * Le da otra forma a un objeto que ya está puesto, **desde su lista de origen**.
 *
 * Vale para cambiar de proceso a ciclo y también para cambiar de diagrama a
 * gráfico, que es lo que salva al alumno que eligió mal: conserva el id, la
 * casilla y el orden Z —o sea, sigue siendo el mismo objeto en el mismo sitio—
 * y sólo cambia lo que se dibuja.
 */
export function rehacerConForma(
  m: Mazo,
  id: string,
  clase: ClaseDibujada,
  variante?: string,
): Mazo | null {
  const d = laActiva(m);
  const l = d?.libres.find((x) => x.id === id);
  if (!l) return null;
  const origen = l.origen ?? l.pasos ?? l.filas?.map((f) => f.join(' · ')) ?? [];
  if (origen.length === 0) return null;
  return conLaActiva(m, (x) => ({
    ...x,
    libres: x.libres.map((y) =>
      y.id === id ? { ...y, clase, contenido: NOMBRE_CLASE[clase], origen, ...conLosDatos(clase, variante, origen) } : y,
    ),
  }));
}

/** Cambia un dato de un gráfico. Lo usa el panel de datos de la clase. */
export function ponerSerie(m: Mazo, id: string, i: number, cambio: Partial<Serie>): Mazo {
  return conLaActiva(m, (x) => ({
    ...x,
    libres: x.libres.map((l) =>
      l.id === id && l.series
        ? { ...l, series: l.series.map((s, k) => (k === i ? { ...s, ...cambio } : s)) }
        : l,
    ),
  }));
}

/**
 * Quita un objeto suelto de la diapositiva activa.
 *
 * Faltaba, y no se notó hasta la clase 5: **no había forma de borrar nada que
 * el alumno hubiera metido**. Las cuatro clases anteriores sólo pedían añadir,
 * así que el agujero no se veía; en cuanto un encargo pidió «que no haya más
 * que un sonido», quien insertaba el equivocado quedaba encerrado con él para
 * siempre. Salió jugando mal a propósito, que es exactamente para lo que sirve.
 *
 * El marcador NO se borra: un marcador es del diseño y se vacía, no se quita.
 */
/**
 * Gira el modelo 3D `id`. El giro se guarda **en la diapositiva** (§44.2).
 *
 * La vertical se acota a ±80°: pasado ahí el objeto se ve por arriba, la escena
 * pierde el suelo y el alumno no sabe volver. PowerPoint hace lo mismo con su
 * tirador, y es la diferencia entre girar un objeto y perder la cámara.
 */
export function girar(m: Mazo, id: string, giro: { x: number; y: number }): Mazo {
  return conLaActiva(m, (d) => ({
    ...d,
    libres: d.libres.map((l) =>
      l.id === id ? { ...l, giro: { x: Math.max(-80, Math.min(80, giro.x)), y: giro.y } } : l,
    ),
  }));
}

/**
 * El objeto que acaba de nacer, comparando el antes con el después (§44.2).
 *
 * Sirve para lo que hace cualquier programa: **lo que insertas queda
 * seleccionado**. Se destapó con el modelo 3D, cuyo encargo dice «agarra el
 * tirador redondo que le sale arriba» — y el tirador va con la selección, así
 * que no salía ninguno hasta que el alumno pinchaba el modelo. La instrucción
 * describía algo que no estaba en la pantalla.
 *
 * Se DERIVA comparando los dos mazos en vez de escribir la lista de comandos
 * que insertan cosas: el día que entre el sexto, acierta solo. Y sólo dentro de
 * la misma diapositiva: duplicar una lámina entera no «inserta un objeto».
 */
export function reciennacido(antes: Mazo, despues: Mazo): string | null {
  if (antes.activa !== despues.activa) return null;
  const viejos = new Set((laActiva(antes)?.libres ?? []).map((l) => l.id));
  return (laActiva(despues)?.libres ?? []).find((l) => !viejos.has(l.id))?.id ?? null;
}

export function quitarLibre(m: Mazo, id: string): Mazo {
  return conLaActiva(m, (d) => ({ ...d, libres: d.libres.filter((l) => l.id !== id) }));
}

/* ── los vínculos y el mapa que sale de ellos (§43.5) ─────────────────────── */

/**
 * Le pone —o le quita— destino a un objeto suelto de la diapositiva activa.
 *
 * `null` lo quita, y hace falta que se pueda: un vínculo mal puesto sin manera
 * de deshacerlo es la misma clase de callejón que costó §42.1 y §43.2, y aquí
 * sería especialmente ridículo, en la clase que trata justamente de eso.
 */
export function ponerDestino(m: Mazo, id: string, destino: number | 'atras' | null): Mazo {
  return conLaActiva(m, (d) => ({
    ...d,
    libres: d.libres.map((l) =>
      l.id === id ? { ...l, destino: destino === null ? undefined : destino } : l,
    ),
  }));
}

/** A dónde lleva cada objeto de esta diapositiva. Sin vínculos, lista vacía. */
export const destinosDe = (d: Diapositiva): (number | 'atras')[] =>
  d.libres.map((l) => l.destino).filter((x): x is number | 'atras' => x !== undefined);

/**
 * **Los callejones**: las diapositivas a las que se puede entrar saltando y de
 * las que no se puede salir saltando.
 *
 * Es la definición exacta de un callejón y por eso se puede derivar en vez de
 * escribirse a mano: entra un vínculo, no sale ninguno. Lo bueno de decirlo así
 * es lo que NO marca — la última diapositiva de una presentación normal no
 * tiene salida y no es ningún callejón, porque nadie salta a ella; se llega
 * andando y se sigue andando.
 *
 * `'atras'` cuenta como salida, y con motivo: volver por donde viniste es la
 * salida más honrada que hay.
 */
export function callejones(m: Mazo): number[] {
  const entran = new Set(
    m.diapositivas.flatMap((d) => destinosDe(d)).filter((x): x is number => typeof x === 'number'),
  );
  return m.diapositivas
    .map((d, i) => (entran.has(i) && destinosDe(d).length === 0 ? i : -1))
    .filter((i) => i >= 0);
}

/**
 * Cómo se llama una diapositiva cuando hay que nombrarla en una lista.
 *
 * Su título, y si no tiene, su número. **Por título y no por número** es la
 * decisión de la galería de destinos: «va a la 4» no dice a dónde vas, y elegir
 * a ciegas es lo que hace que un menú salga mal a la primera.
 */
export function nombreDeDiapositiva(m: Mazo, i: number): string {
  const t = m.diapositivas[i]?.marcadores.find((x) => x.rol === 'titulo')?.contenido;
  return t?.split('\n')[0]?.trim() || `Diapositiva ${i + 1}`;
}

/** Guarda una lista con nombre. Si ya había una así, la sustituye. */
export function crearPersonalizada(m: Mazo, nombre: string, diapositivas: number[]): Mazo | null {
  if (!nombre.trim() || diapositivas.length === 0) return null;
  const otras = (m.personalizadas ?? []).filter((p) => p.nombre !== nombre.trim());
  return { ...m, personalizadas: [...otras, { nombre: nombre.trim(), diapositivas }] };
}

/* ── los comentarios y lo que el archivo lleva dentro (§43.6) ─────────────── */

/** Las notas pegadas a una diapositiva. Sin ninguna, lista vacía. */
export const comentariosDe = (d: Diapositiva): Comentario[] => d.comentarios ?? [];

/** Las que quedan por atender. Es el número que importa de una revisión. */
export const pendientesEnElMazo = (m: Mazo): number =>
  m.diapositivas.reduce((n, d) => n + comentariosDe(d).filter((c) => !c.resuelto).length, 0);

export const cuantosComentarios = (m: Mazo): number =>
  m.diapositivas.reduce((n, d) => n + comentariosDe(d).length, 0);

/** Cuántas diapositivas llevan notas del orador escritas. */
export const conNotas = (m: Mazo): number =>
  m.diapositivas.filter((d) => (d.notas ?? '').trim().length > 0).length;

/** Las que están en el archivo y no se presentan. */
export const lasOcultas = (m: Mazo): number[] =>
  m.diapositivas.map((d, i) => (d.oculta ? i : -1)).filter((i) => i >= 0);

/**
 * La siguiente que SE PRESENTA a partir de `desde`, en la dirección que se
 * pida. Devuelve un índice fuera del mazo cuando ya no queda ninguna.
 *
 * Vive aquí y no dentro de la ventana porque se necesita en tres sitios
 * —avanzar, retroceder y «desde el principio»— y tres bucles escritos a mano
 * son tres sitios donde uno puede quedarse sin arreglar. Y porque así se puede
 * probar: es lo único de «oculta» que se puede comprobar sin abrir un
 * navegador.
 *
 * `paso` es +1 o −1. Con `desde` ya visible, se devuelve tal cual: la pregunta
 * es «¿cuál es la primera visible desde aquí?», no «¿cuál es la de después?».
 */
export function primeraVisible(m: Mazo, desde: number, paso: 1 | -1 = 1): number {
  let i = desde;
  while (i >= 0 && i < m.diapositivas.length && m.diapositivas[i].oculta) i += paso;
  return i;
}

/* ── ocultar y las secciones (§44.1) ──────────────────────────────────────── */

/**
 * Deja la diapositiva `i` dentro del archivo pero fuera de la presentación.
 *
 * El dato `oculta` existía desde §43.6, donde el inspector lo **encontraba**;
 * lo que faltaba era el mando que lo pone. Se escribe aquí y no en la ventana
 * porque es un cambio del documento, y todo lo que cambia el documento pasa por
 * el mazo — es lo que deja que un logro de tipo `documento` lo compruebe.
 */
export function ocultar(m: Mazo, i: number, oculta: boolean): Mazo {
  const d = m.diapositivas[i];
  if (!d || Boolean(d.oculta) === oculta) return m;
  return {
    ...m,
    diapositivas: m.diapositivas.map((x, k) => (k === i ? { ...x, oculta } : x)),
  };
}

export const secciones = (m: Mazo): Seccion[] =>
  [...(m.secciones ?? [])].sort((a, b) => a.desde - b.desde);

/**
 * El mazo repartido en tramos, **derivado**: cada sección con las diapositivas
 * que le tocan hasta que empiece la siguiente.
 *
 * Cuando hay secciones pero la primera no arranca en 0, las diapositivas
 * sueltas de delante salen en un tramo sin nombre — que es lo que hace
 * PowerPoint y no un apaño: si el alumno secciona a partir de la tercera, las
 * dos primeras siguen existiendo y tienen que verse.
 */
export function tramos(m: Mazo): { seccion: Seccion | null; indices: number[] }[] {
  const ss = secciones(m);
  const todos = m.diapositivas.map((_, i) => i);
  if (!ss.length) return [{ seccion: null, indices: todos }];

  const cortes = [...ss];
  const salida: { seccion: Seccion | null; indices: number[] }[] = [];
  if (cortes[0].desde > 0) salida.push({ seccion: null, indices: todos.slice(0, cortes[0].desde) });
  cortes.forEach((s, k) => {
    const hasta = cortes[k + 1]?.desde ?? m.diapositivas.length;
    salida.push({ seccion: s, indices: todos.slice(s.desde, hasta) });
  });
  return salida;
}

/** A qué sección pertenece la diapositiva `i`, si a alguna. */
export const seccionDe = (m: Mazo, i: number): Seccion | null =>
  tramos(m).find((t) => t.indices.includes(i))?.seccion ?? null;

/**
 * Abre una sección que empieza en `desde`. Devuelve `null` si no hay nada que
 * hacer —nombre vacío, índice fuera, o ya hay una que arranca justo ahí—, que
 * es lo que `ejecutar` traduce en «el mazo no cambió».
 */
export function crearSeccion(m: Mazo, nombre: string, desde: number): Mazo | null {
  const limpio = nombre.trim();
  if (!limpio) return null;
  if (desde < 0 || desde >= m.diapositivas.length) return null;
  if (secciones(m).some((s) => s.desde === desde)) return null;
  return { ...m, secciones: [...secciones(m), { nombre: limpio, desde }] };
}

/**
 * **El Zoom de resumen**: la diapositiva-índice, hecha sola (§44.5, MOS 2.1.4).
 *
 * PowerPoint mira las secciones, coge **la primera de cada una** y arma una
 * diapositiva con miniaturas en las que se puede pulsar. Aquí igual, y el «coge
 * la primera» no es un detalle de implementación: es lo que hace que el índice
 * salga bien o salga mal, y por eso el encargo lo cobra — un mazo sin secciones
 * no tiene resumen que hacer.
 *
 * ── SE DERIVA ENTERA, Y POR ESO ENSEÑA ──────────────────────────────────────
 *
 * Cada botón es un objeto suelto con `destino` puesto, que es exactamente el
 * vínculo que §43.5 armó **a mano** para el quiosco. Ésa es la comparación que
 * la clase quiere: a mano se controla todo y se tarda; automático es un clic y
 * depende de que las secciones estén bien puestas. Con un dibujo especial e
 * inmutable —una imagen de índice— no habría comparación posible.
 *
 * Devuelve `null` cuando no hay secciones: sin tramos con nombre no hay nada
 * que resumir, y **decir que no se puede es más honesto que armar un índice de
 * una sola entrada** que no lleva a ninguna parte.
 */
export function zoomDeResumen(m: Mazo): Mazo | null {
  const conNombre = tramos(m).filter((t) => t.seccion && t.indices.length);
  if (!conNombre.length) return null;

  /*
   * Cuatro por fila y hasta ocho: es lo que cabe en 12 × 9 casillas con un
   * tamaño en el que la miniatura se sigue reconociendo. Más allá, PowerPoint
   * también las apelotona; aquí se prefiere que el índice quepa a que estén
   * todas, y las secciones de una presentación de niño no pasan de cuatro.
   */
  const cuantos = Math.min(conNombre.length, 8);
  const porFila = Math.min(cuantos, 4);

  /*
   * **El índice entra el primero, así que empuja a todas.** Los destinos de los
   * botones y los cortes de sección se corren con este mismo número y en la
   * misma función, para que no puedan separarse: la primera versión corría los
   * cortes y no los destinos, y el resumen apuntaba una diapositiva antes de
   * donde debía —el botón «El final» llevaba a la última de la sección
   * anterior—. Lo cazó la prueba antes de que lo viera nadie.
   */
  const CORRIMIENTO = 1;

  const libres: Libre[] = conNombre.slice(0, cuantos).map((t, k) => {
    const fila = Math.floor(k / porFila);
    const col = k % porFila;
    const ancho = Math.floor(10 / porFila);
    return {
      id: `zoom-${t.seccion!.desde}`,
      clase: 'zoom' as const,
      contenido: t.seccion!.nombre,
      casilla: {
        col: 1 + col * ancho,
        fila: 3 + fila * 3,
        cols: ancho,
        filas: 3,
      },
      z: k + 1,
      destino: t.indices[0] + CORRIMIENTO,
    };
  });

  /*
   * «Solo título» y no «Título y texto»: con el segundo, el cuerpo vacío pinta
   * su caja de puntitos —«Doble clic para escribir»— justo debajo de las
   * miniaturas. Una diapositiva que hace el programa no puede salir con un
   * hueco pidiendo que la escribas.
   */
  const indice: Diapositiva = {
    diseno: 'solo-titulo',
    marcadores: [{ rol: 'titulo', contenido: 'Resumen', casilla: null }],
    libres,
  };

  // Al principio, que es donde sirve un índice. Y con los cortes corridos, o el
  // índice recién puesto se comería la primera sección.
  return {
    ...m,
    diapositivas: [indice, ...m.diapositivas],
    activa: 0,
    secciones: m.secciones?.map((s) => ({ ...s, desde: s.desde + CORRIMIENTO })),
  };
}

/** Pliega o despliega un tramo. Es de vista, pero se guarda con el archivo. */
export function plegarSeccion(m: Mazo, desde: number, plegada: boolean): Mazo {
  const ss = secciones(m);
  if (!ss.some((s) => s.desde === desde)) return m;
  return { ...m, secciones: ss.map((s) => (s.desde === desde ? { ...s, plegada } : s)) };
}

/** Pega una nota en la diapositiva `i`. La fecha ya viene escrita. */
export function comentar(m: Mazo, i: number, c: Comentario): Mazo {
  return {
    ...m,
    diapositivas: m.diapositivas.map((d, k) =>
      k === i ? { ...d, comentarios: [...comentariosDe(d), c] } : d,
    ),
  };
}

/**
 * Marca una nota como atendida. **No la borra**, y ésa es la diferencia entre
 * resolver y quitar: resolver deja constancia de que se hizo; quitar hace como
 * si nunca hubiera pasado.
 */
export function resolverComentario(m: Mazo, id: string): Mazo {
  return {
    ...m,
    diapositivas: m.diapositivas.map((d) => ({
      ...d,
      comentarios: comentariosDe(d).map((c) => (c.id === id ? { ...c, resuelto: true } : c)),
    })),
  };
}

export function borrarComentario(m: Mazo, id: string): Mazo {
  return {
    ...m,
    diapositivas: m.diapositivas.map((d) => ({
      ...d,
      comentarios: comentariosDe(d).filter((c) => c.id !== id),
    })),
  };
}

/** Quita del archivo las diapositivas ocultas. La activa se acota si hace falta. */
export function quitarOcultas(m: Mazo): Mazo {
  const diapositivas = m.diapositivas.filter((d) => !d.oculta);
  if (diapositivas.length === m.diapositivas.length) return m;
  return { ...m, diapositivas, activa: Math.min(m.activa, diapositivas.length - 1) };
}

export const quitarAutor = (m: Mazo): Mazo => ({ ...m, autor: undefined });

export const quitarTodasLasNotas = (m: Mazo): Mazo => ({
  ...m,
  diapositivas: m.diapositivas.map((d) => ({ ...d, notas: '' })),
});

export const quitarTodosLosComentarios = (m: Mazo): Mazo => ({
  ...m,
  diapositivas: m.diapositivas.map((d) => ({ ...d, comentarios: [] })),
});

/** La descripción de una imagen para quien no la ve (§42.2). */
export function ponerAlt(m: Mazo, id: string, alt: string): Mazo {
  return conLaActiva(m, (d) => ({
    ...d,
    libres: d.libres.map((l) => (l.id === id ? { ...l, alt } : l)),
  }));
}

/** Aplica un recorte ya calculado. Marco y recorte cambian juntos, siempre. */
export function aplicarRecorte(m: Mazo, id: string, casilla: Casilla, recorte: Recorte): Mazo {
  return conLaActiva(m, (d) => ({
    ...d,
    libres: d.libres.map((l) => (l.id === id ? { ...l, casilla, recorte } : l)),
  }));
}

/** La caja que tendría la imagen sin recortar, en casillas. */
export const cajaSinRecortar = cajaEntera;

/** Recoloca una caja. Recibe la casilla ya redondeada; aquí no se calcula nada. */
export function recolocar(m: Mazo, sitio: Sitio, casilla: Casilla): Mazo {
  return conLaActiva(m, (d) =>
    sitio.tipo === 'marcador'
      ? {
          ...d,
          // El marcador NO se convierte en caja libre al moverlo: conserva su rol
          // y su sitio en la lista, y sólo estrena una anulación (§39).
          marcadores: d.marcadores.map((x) => (x.rol === sitio.rol ? { ...x, casilla } : x)),
        }
      : moverConSuGrupo(d, sitio.id, casilla, m.forma),
  );
}

/**
 * Recoloca un objeto y **arrastra a su grupo con él**.
 *
 * El delta se calcula aquí, comparando la casilla que llega con la que había:
 * quien llama ya hizo la cuenta de píxeles a casillas y no tiene por qué saber
 * que este objeto viaja acompañado. Los compañeros se acotan al lienzo uno a
 * uno, así que un grupo empujado contra el borde se apelmaza en vez de salirse
 * — que es feo, pero es reversible; salirse no lo es.
 */
function moverConSuGrupo(
  d: Diapositiva,
  id: string,
  casilla: Casilla,
  forma?: Forma,
): Diapositiva {
  const yo = d.libres.find((l) => l.id === id);
  if (!yo) return d;
  if (!yo.grupo) {
    return { ...d, libres: d.libres.map((l) => (l.id === id ? { ...l, casilla } : l)) };
  }
  const dc = casilla.col - yo.casilla.col;
  const df = casilla.fila - yo.casilla.fila;
  return {
    ...d,
    libres: d.libres.map((l) => {
      if (l.id === id) return { ...l, casilla };
      if (l.grupo !== yo.grupo) return l;
      return {
        ...l,
        casilla: {
          ...l.casilla,
          col: Math.max(0, Math.min(colsDe(forma) - l.casilla.cols, l.casilla.col + dc)),
          fila: Math.max(0, Math.min(FILAS - l.casilla.filas, l.casilla.fila + df)),
        },
      };
    }),
  };
}

/** Ir a otra diapositiva. Es lo que hace pulsar una miniatura de la tira. */
export const irA = (m: Mazo, i: number): Mazo =>
  i < 0 || i >= m.diapositivas.length ? m : { ...m, activa: i };

/* ── lo que se mueve: transiciones y animaciones (§42.1) ──────────────────── */

export const transicionDe = (d: Diapositiva): TransicionId => d.transicion ?? 'ninguna';
export const duracionDe = (d: Diapositiva): number => d.duracion ?? DURACION_POR_OMISION;

/** La transición de la diapositiva `i`, se esté donde se esté. */
export function transicionEn(m: Mazo, i: number): TransicionId {
  const d = m.diapositivas[i];
  return d ? transicionDe(d) : 'ninguna';
}

/** Cuántas diapositivas del mazo llevan transición. Es el semáforo de la fase 2. */
export const conTransicion = (m: Mazo): number[] =>
  m.diapositivas.map((_, i) => i).filter((i) => transicionEn(m, i) !== 'ninguna');

export const ponerTransicion = (m: Mazo, t: TransicionId): Mazo =>
  conLaActiva(m, (d) => ({ ...d, transicion: t }));

export const ponerDuracion = (m: Mazo, seg: number): Mazo =>
  conLaActiva(m, (d) => ({ ...d, duracion: seg }));

/**
 * «Aplicar a todo»: la transición de la activa se copia al mazo entero.
 *
 * Es el botón que crea el problema de la clase —la presentación de Diego nace
 * así— y a la vez el que lo resuelve, porque «Ninguna → Aplicar a todo» las
 * quita todas de un golpe. Que el mismo botón sirva para las dos cosas es la
 * lección: la herramienta no es buena ni mala, lo que se juzga es el uso.
 */
export function transicionATodas(m: Mazo): Mazo {
  const d = laActiva(m);
  if (!d) return m;
  const t = transicionDe(d);
  const dur = duracionDe(d);
  return { ...m, diapositivas: m.diapositivas.map((x) => ({ ...x, transicion: t, duracion: dur })) };
}

/* ── las animaciones de una diapositiva ───────────────────────────────────── */

/** Una animación con su dueño, que es lo que el panel necesita para pintarse. */
export interface AnimacionEnLista {
  sitio: Sitio;
  /** Cómo se llama el objeto en el panel: «Título», «cámara»… */
  nombre: string;
  anim: Animacion;
}

const nombreDelMarcador: Record<string, string> = {
  titulo: 'Título',
  subtitulo: 'Subtítulo',
  cuerpo: 'Texto',
  'cuerpo-2': 'Segundo texto',
  imagen: 'Imagen',
};

/** El primer trozo del contenido, para que el panel nombre lo que anima. */
const resumen = (texto: string | null | undefined, respaldo: string): string => {
  const limpio = (texto ?? '').replace(/\s+/g, ' ').trim();
  if (!limpio) return respaldo;
  return limpio.length > 22 ? `${limpio.slice(0, 21)}…` : limpio;
};

/**
 * Todo lo que se mueve en esa diapositiva, **en su orden**.
 *
 * Ordenado aquí y no en quien la pinte: el panel, la lista del encargo y el
 * modo presentación tienen que estar de acuerdo en qué va primero, y si cada
 * uno ordenara por su cuenta acabarían discrepando el día que empaten dos.
 * Empate resuelto por nombre, que es estable.
 */
export function animaciones(d: Diapositiva): AnimacionEnLista[] {
  const lista: AnimacionEnLista[] = [];
  for (const mrc of d.marcadores) {
    if (!mrc.animacion) continue;
    lista.push({
      sitio: { tipo: 'marcador', rol: mrc.rol },
      nombre: resumen(mrc.contenido, nombreDelMarcador[mrc.rol] ?? mrc.rol),
      anim: mrc.animacion,
    });
  }
  for (const l of d.libres) {
    if (!l.animacion) continue;
    lista.push({ sitio: { tipo: 'libre', id: l.id }, nombre: resumen(l.contenido, l.id), anim: l.animacion });
  }
  return lista.sort((a, b) => a.anim.orden - b.anim.orden || a.nombre.localeCompare(b.nombre));
}

/** Cuántos clics hacen falta para revelarla entera. Cero = no se mueve nada. */
export const pasosDeAnimacion = (d: Diapositiva): number => animaciones(d).length;

/**
 * En qué paso ARRANCA la diapositiva al llegar a ella.
 *
 * Cero, salvo que las primeras animaciones sean «con la anterior»: ésas no
 * esperan a nadie porque no hay anterior a la que esperar, así que ya están
 * puestas cuando el público la ve. Es lo que hace PowerPoint y es la mitad
 * visible de la lección del disparo (§42.1): poner «con la anterior» arriba
 * del todo equivale a no animar nada.
 */
export function pasoInicial(d: Diapositiva): number {
  const lista = animaciones(d);
  let n = 0;
  while (n < lista.length && lista[n].anim.disparo === 'con-anterior') n += 1;
  return n;
}

/**
 * Qué se revela con UN clic. Arrastra consigo a las que van «con la anterior».
 *
 * Que un clic pueda revelar tres cosas es exactamente lo que el alumno tiene
 * que sentir para entender la diferencia entre los dos disparos: si cada
 * animación pidiera siempre su clic, «con la anterior» sería una palabra sin
 * consecuencia.
 */
export function siguientePaso(d: Diapositiva, revelados: number): number {
  const lista = animaciones(d);
  let n = Math.min(revelados + 1, lista.length);
  while (n < lista.length && lista[n].anim.disparo === 'con-anterior') n += 1;
  return n;
}

/** La animación de una caja concreta, si la tiene. */
export function animacionDe(d: Diapositiva, sitio: Sitio): Animacion | undefined {
  return sitio.tipo === 'marcador'
    ? d.marcadores.find((x) => x.rol === sitio.rol)?.animacion
    : d.libres.find((l) => l.id === sitio.id)?.animacion;
}

const mismoSitio = (a: Sitio, b: Sitio): boolean =>
  a.tipo === 'marcador' && b.tipo === 'marcador'
    ? a.rol === b.rol
    : a.tipo === 'libre' && b.tipo === 'libre'
      ? a.id === b.id
      : false;

/** Escribe (o borra) la animación de una caja, sin tocar nada más. */
function conAnimacion(d: Diapositiva, sitio: Sitio, anim: Animacion | undefined): Diapositiva {
  const pon = <T extends Marcador | Libre>(x: T): T => ({ ...x, animacion: anim });
  return sitio.tipo === 'marcador'
    ? { ...d, marcadores: d.marcadores.map((x) => (x.rol === sitio.rol ? pon(x) : x)) }
    : { ...d, libres: d.libres.map((l) => (l.id === sitio.id ? pon(l) : l)) };
}

/**
 * Renumera 1, 2, 3… respetando el orden actual.
 *
 * Se llama después de cada quitar y cada mover. Sin esto la lista queda con
 * huecos —un 1 y un 3— y el panel se vuelve un acertijo justo en la clase que
 * pide leer el orden.
 */
function renumerar(d: Diapositiva): Diapositiva {
  let n = 0;
  let salida = d;
  for (const x of animaciones(d)) {
    n += 1;
    salida = conAnimacion(salida, x.sitio, { ...x.anim, orden: n });
  }
  return salida;
}

/**
 * Anima una caja, o le quita la animación si ya tenía ESA misma.
 *
 * Interruptor y no acumulador, como los tres botones de la cinta. En PowerPoint
 * se quita eligiendo «Ninguna» de la galería; aquí, donde la galería son tres
 * botones, volver a pulsar el que ya está hundido es el gesto que el alumno
 * intenta primero — y castigarlo por probar sería enseñarle a no probar.
 */
export function animar(m: Mazo, sitio: Sitio, tipo: TipoAnimacion): Mazo {
  return conLaActiva(m, (d) => {
    const ya = animacionDe(d, sitio);
    if (ya?.tipo === tipo) return renumerar(conAnimacion(d, sitio, undefined));
    const orden = ya?.orden ?? pasosDeAnimacion(d) + 1;
    return renumerar(conAnimacion(d, sitio, { tipo, orden, disparo: ya?.disparo ?? 'clic' }));
  });
}

export function quitarAnimacion(m: Mazo, sitio: Sitio): Mazo {
  return conLaActiva(m, (d) => renumerar(conAnimacion(d, sitio, undefined)));
}

export function ponerDisparo(m: Mazo, sitio: Sitio, disparo: 'clic' | 'con-anterior'): Mazo {
  return conLaActiva(m, (d) => {
    const ya = animacionDe(d, sitio);
    return ya ? conAnimacion(d, sitio, { ...ya, disparo }) : d;
  });
}

/**
 * Sube o baja una animación en la lista. `−1` la adelanta, `+1` la atrasa.
 *
 * Se intercambian los órdenes de las dos vecinas y se renumera. Hacerlo con
 * `splice` sobre la lista ordenada sería más corto y más frágil: la lista es
 * una vista, y el modelo son los números que viven en cada caja.
 */
export function moverAnimacion(m: Mazo, sitio: Sitio, delta: -1 | 1): Mazo {
  return conLaActiva(m, (d) => {
    const lista = animaciones(d);
    const i = lista.findIndex((x) => mismoSitio(x.sitio, sitio));
    const j = i + delta;
    if (i < 0 || j < 0 || j >= lista.length) return d;
    let salida = conAnimacion(d, lista[i].sitio, { ...lista[i].anim, orden: lista[j].anim.orden });
    salida = conAnimacion(salida, lista[j].sitio, { ...lista[j].anim, orden: lista[i].anim.orden });
    return renumerar(salida);
  });
}

/** Los nombres, para el panel y para los avisos. Se leen del modelo. */
export { NOMBRE_ANIMACION };

/* ── las preguntas que una clase le hace al mazo ──────────────────────────── */

export const cuantasDiapositivas = (m: Mazo): number => m.diapositivas.length;

export const disenoDe = (m: Mazo, i: number): DisenoId | null => m.diapositivas[i]?.diseno ?? null;

/** El orden de los diseños, que es como se comprueba la fase del orden. */
export const ordenDeDisenos = (m: Mazo): DisenoId[] => m.diapositivas.map((d) => d.diseno);

/** El texto de un marcador en la diapositiva `i`, sin importar cuál esté activa. */
export function textoEn(m: Mazo, i: number, rol: Rol): string | null {
  return m.diapositivas[i]?.marcadores.find((x) => x.rol === rol)?.contenido ?? null;
}

export function notasEn(m: Mazo, i: number): string {
  return m.diapositivas[i]?.notas ?? '';
}

/** Cuántas diapositivas tienen todos los marcadores de su diseño llenos. */
export function completas(m: Mazo): number {
  return m.diapositivas.filter((d) => rolesDe(d.diseno).every((rol) => marcadorLleno(d, rol))).length;
}

/** Cuántos pares se tapan en todo el mazo. Es el semáforo del cierre de §27.2. */
export function tapadosEnElMazo(m: Mazo): number {
  return m.diapositivas.reduce((n, d) => n + paresQueSeTapan(d).length, 0);
}

/** Para el rótulo de la tira: «Portada», «Título y texto»… */
export const nombreDelDiseno = (d: DisenoId): string => DISENOS[d].nombre;
