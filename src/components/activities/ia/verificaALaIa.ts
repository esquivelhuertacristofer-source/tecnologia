import type { GuionAsistente, RespuestaGuion } from '@/components/simuladores/asistente';
import type { MapaSitios, PaginaWeb, ResultadoBusqueda } from '@/components/simuladores/navegador';
import { urlDeBusqueda } from '@/components/simuladores/navegador';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * `n7-verifica-a-la-ia` · los datos: guion, mapa de sitios, filas, señales
 * 1.º de secundaria · 12–13 años (comprobado en `src/data/curriculo.ts:697`)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Ver `DISENO-N7-n7-verifica-a-la-ia.md` en la raíz del repo: es el pliego
 * completo, con la razón de cada decisión. Este archivo construye:
 *
 *   · el guion de Tecnia Asistente (dos respuestas troceadas, 4 y 5 partes)
 *   · el mapa de Tecnia Consulta (Archivo, Enciclopedia, un boletín que
 *     copia, y un informe con su página 40)
 *   · las diez filas de la Hoja de verificación (4 del acto 1 + 5 del acto 3)
 *     con sus anclas, sus señales (dato de autor) y su veredicto correcto
 *   · las funciones puras que deciden cuándo se puede juzgar una fila
 *
 * ── Corrección aplicada en construcción (21-ago-2026) ─────────────────────
 *
 * El pliego original traía, en el acto 3, la afirmación «México fue el
 * primer país de América Latina en CONECTARSE a Internet» marcada como
 * contradicha. El coordinador verificó con búsqueda web real, DESPUÉS de
 * escrito el pliego, que esa afirmación es una disputa historiográfica real
 * (isoc.mx, el capítulo mexicano de Internet Society, sostiene que México sí
 * fue el primero; la tesis contraria se apoya en que Chile tuvo una conexión
 * BITNET —una red distinta— antes) — exactamente el tipo de dato mal
 * verificado que esta misma clase enseña a no imprimir.
 *
 * Se sustituyó por una afirmación de la misma familia (mismo superlativo,
 * misma historia) que sí se verificó de forma independiente con dos fuentes
 * que coinciden:
 *
 *   «México fue el primer país de América Latina en REGISTRAR SU DOMINIO
 *   DE PAÍS, el .mx.» → CONTRADICHA: Chile registró el suyo, .cl, en 1987,
 *   dos años antes.
 *
 *   Fuentes (registro de dominios, dato de IANA, no historiografía en
 *   disputa): IANA, ".mx Domain Delegation Data"
 *   (https://www.iana.org/domains/root/db/mx.html, fecha de registro
 *   1989-02-01) y Wikipedia, ".cl" (creado/delegado en 1987). Las dos
 *   coinciden en que Chile registró primero, por casi dos años.
 *
 * El resto de los hechos «ciertos» de esta clase también se verificaron
 * antes de escribirse (con búsqueda web real, el 21-ago-2026), salvo los
 * tres que el coordinador ya había verificado y entregó de antemano: el año
 * 1989, el Tecnológico de Monterrey, y que la conexión fue con una
 * universidad de Estados Unidos, no de Canadá. Por eso ningún dato de este
 * archivo lleva un día del mes: las fuentes reales no coinciden en la fecha
 * exacta (28 de febrero vs. 20 de julio de 1989, según la fuente), así que
 * la clase sólo afirma el año, que sí es un hecho limpio.
 *
 *   · El dominio .mx se registró el 1989-02-01 (IANA,
 *     iana.org/domains/root/db/mx.html).
 *   · El dominio .cl se registró/delegó en 1987 (Wikipedia, «.cl»).
 *   · La conexión de 1989 dio acceso a NSFNet, una red que entonces sumaba
 *     más de treinta mil nodos en el mundo — dos fuentes independientes
 *     coinciden en la cifra: el propio Tecnológico de Monterrey
 *     (conecta.tec.mx, «30 años de Internet en México») y Xataka México
 *     («Historia de cómo México se conectó por primera vez a Internet»).
 *   · INEGI, ENDUTIH 2024: 100.2 millones de personas (83.1% de la
 *     población de 6 años o más) usaban Internet en México en 2024 —
 *     encuesta oficial, corroborada por varias coberturas de prensa del
 *     mismo boletín (Milenio, Forbes México, El Horizonte).
 *
 * ── Qué NO se verificó, y por qué no hace falta ───────────────────────────
 *
 * `q4` («el primer correo se envió un martes») y `q5` («Internet y la Web no
 * son lo mismo») son las dos afirmaciones que «no van en el trabajo» — el
 * pliego mismo no les da contenido de comprobación (su columna «qué pasa si
 * se comprueba» está vacía) porque lo que importa de ellas es que NO valía
 * la pena gastar ahí la consulta, no si son ciertas. Por eso sus búsquedas
 * no tienen página en el mapa: caen en `paginaNoEncontrada`, igual que la
 * ingeniera inventada de la fila 4. `q5` es una distinción de manual
 * (Internet ≠ la Web) y no una afirmación histórica en disputa, así que no
 * necesitaba verificación aparte.
 */

// ─────────────────────────────────────────────────────────────────────────
// 1 · Las fuentes — dato de autor, vive aquí y no en el armazón
// ─────────────────────────────────────────────────────────────────────────

export interface FuenteInfo {
  id: string;
  nombre: string;
  dominio: string;
  /** Si esta fuente copia a otra, el id de esa otra. */
  copiaDe?: string;
}

export const FUENTES: Record<string, FuenteInfo> = {
  archivo: { id: 'archivo', nombre: 'Archivo Tecnia', dominio: 'archivo.tecnia.mx' },
  enciclopedia: { id: 'enciclopedia', nombre: 'Enciclopedia Tecnia', dominio: 'enciclopedia.tecnia.mx' },
  boletin: {
    id: 'boletin',
    nombre: 'Boletín de la Secundaria 30',
    dominio: 'boletin-secundaria30.mx',
    copiaDe: 'archivo',
  },
};

export function fuenteDeUrl(url: string): FuenteInfo | null {
  return Object.values(FUENTES).find((f) => url.startsWith(f.dominio)) ?? null;
}

/**
 * Dos pruebas son independientes si no son de la misma fuente y ninguna
 * copia a la otra. Es literalmente la regla del pliego (§B, «Las tres reglas
 * que hacen que esto no sea pulsar la pestaña correcta»).
 */
export function fuentesIndependientes(
  a: Pick<Prueba, 'fuenteId'>,
  b: Pick<Prueba, 'fuenteId'>,
): boolean {
  if (a.fuenteId === b.fuenteId) return false;
  const copiaA = FUENTES[a.fuenteId]?.copiaDe;
  const copiaB = FUENTES[b.fuenteId]?.copiaDe;
  if (copiaA === b.fuenteId) return false;
  if (copiaB === a.fuenteId) return false;
  return true;
}

/** Basta con que EXISTA un par independiente: no hace falta contar el máximo. */
export function hayParIndependiente(pruebas: readonly Prueba[]): boolean {
  for (let i = 0; i < pruebas.length; i++) {
    for (let j = i + 1; j < pruebas.length; j++) {
      if (fuentesIndependientes(pruebas[i], pruebas[j])) return true;
    }
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────
// 2 · La Hoja de verificación — tipos
// ─────────────────────────────────────────────────────────────────────────

export type Veredicto = 'confirmada' | 'contradicha' | 'sin-respaldo';

export interface Chip {
  id: string;
  etiqueta: string;
  /** Lo que precarga en la barra de direcciones de Tecnia Consulta. */
  consulta: string;
}

export interface Prueba {
  url: string;
  fuenteId: string;
  autor: string | null;
  fecha: string | null;
  texto: string;
  /** A qué anclas responde este párrafo — dato de autor, no juicio del alumno. */
  hablaDe: string[];
  /** Es el resultado vacío del buscador («no encontramos nada»), no un párrafo. */
  esVacio?: boolean;
}

export interface Fila {
  /** Igual al id de la `ParteRespuesta` que representa esta fila en el chat. */
  id: string;
  anclas: Chip[];
  /** Señales de alerta que trae la frase — dato de autor, no juicio. Ids de 1 a 6. */
  senales: number[];
  /**
   * El veredicto que la Hoja acepta como correcto. `null` = no hay un único
   * correcto (es el caso de `q3`: la cifra del asistente no está fechada, y
   * eso no es lo mismo que sea falsa — cualquier veredicto que la prueba
   * sostenga se acepta sin resta).
   */
  correcto: Veredicto | null;
  /** Sólo se usa en el acto 3: si esta afirmación va en el trabajo de la ficha. */
  vaEnElTrabajo?: boolean;
}

/**
 * Añade una prueba sin duplicarla: adjuntar el mismo párrafo dos veces cuenta
 * como UNA sola (jugar mal, punto 3 del pliego). Devuelve el MISMO arreglo
 * por identidad cuando no hay cambio, para que `toBe` lo compruebe.
 */
export function agregarPrueba(pruebas: readonly Prueba[], nueva: Prueba): readonly Prueba[] {
  if (pruebas.some((p) => p.url === nueva.url && p.texto === nueva.texto)) return pruebas;
  return [...pruebas, nueva];
}

/** Las pruebas de una fila que de verdad hablan de la ancla elegida. */
export function pruebasRelevantes(pruebas: readonly Prueba[], ancla: string | null): Prueba[] {
  if (!ancla) return [];
  return pruebas.filter((p) => p.hablaDe.includes(ancla));
}

/** Habilita `Contradicha` y `Sin respaldo`: basta UNA prueba que hable del ancla. */
export function puedeJuzgar(pruebas: readonly Prueba[], ancla: string | null): boolean {
  return pruebasRelevantes(pruebas, ancla).length > 0;
}

/** Habilita `Confirmada`: hacen falta DOS pruebas relevantes e independientes. */
export function puedeConfirmar(pruebas: readonly Prueba[], ancla: string | null): boolean {
  return hayParIndependiente(pruebasRelevantes(pruebas, ancla));
}

/**
 * La guarda automática de la honradez pedagógica de esta clase (pliego,
 * jugar mal #14 y prueba #7). Simula al alumno que juega «señal = falsa,
 * sin señal = cierta» y cuenta en cuántas filas esa estrategia acierta el
 * CUBO (cierta / no-cierta), no el botón exacto. Tiene que dar 2 de 4 sobre
 * `FILAS_ACTO1` — si algún día da 4 de 4, la clase se volvió la lección
 * falsa que el pliego entero existe para evitar.
 */
export function filasQueConfundenSenalConVerdad(filas: readonly Fila[]): number {
  return filas.filter((f) => (f.senales.length > 0) === (f.correcto !== 'confirmada')).length;
}

// ─────────────────────────────────────────────────────────────────────────
// 3 · El mapa de sitios de Tecnia Consulta
// ─────────────────────────────────────────────────────────────────────────

export const NOMBRE_INVENTADO = 'Renata Solórzano';

const URL_ARCHIVO_ENLACE = 'archivo.tecnia.mx/primer-enlace';
const URL_ENCICLOPEDIA_INTERNET = 'enciclopedia.tecnia.mx/internet-en-mexico';
const URL_ARCHIVO_DOMINIO = 'archivo.tecnia.mx/dominio-mx';
const URL_BOLETIN_DOMINIO = 'boletin-secundaria30.mx/internet-en-los-90';
export const URL_INFORME = 'archivo.tecnia.mx/informe-decada';
export const URL_INFORME_P40 = 'archivo.tecnia.mx/informe-decada/pagina-40';
const URL_ENCICLOPEDIA_DOMINIOS = 'enciclopedia.tecnia.mx/dominios-de-pais';
const URL_ENCICLOPEDIA_USUARIOS = 'enciclopedia.tecnia.mx/usuarios-de-internet';
export const URL_INICIO = 'archivo.tecnia.mx';

export const CONSULTA_INFORME = 'informe sobre la primera década de la red en méxico';

/** Metadatos de párrafo, FUERA del armazón (que sólo sabe de `parrafos: string[]`). */
const META_PARRAFOS: Record<string, { hablaDe: string[]; fuenteId: string }[]> = {};

interface ParrafoDef {
  texto: string;
  hablaDe: string[];
}

function articulo(
  url: string,
  pestana: string,
  titulo: string,
  autor: string | null,
  fecha: string | null,
  fuenteId: string,
  parrafos: ParrafoDef[],
  enlaces?: { etiqueta: string; url: string }[],
): PaginaWeb {
  META_PARRAFOS[url] = parrafos.map((p) => ({ hablaDe: p.hablaDe, fuenteId }));
  return {
    url,
    pestana,
    titulo,
    autor,
    fecha,
    cuerpo: { tipo: 'articulo', parrafos: parrafos.map((p) => p.texto) },
    enlaces,
  };
}

function resultados(consulta: string, items: Omit<ResultadoBusqueda, 'id'>[]): PaginaWeb {
  const url = urlDeBusqueda(consulta);
  return {
    url,
    pestana: 'Resultados',
    titulo: `Buscador Tecnia · «${consulta}»`,
    autor: null,
    fecha: null,
    cuerpo: {
      tipo: 'resultados',
      consulta,
      resultados: items.map((it, i) => ({ id: `r${i}`, ...it })),
    },
  };
}

const TEXTO_DOMINIO_MX = 'El dominio .mx se registró en 1989, el mismo año del primer enlace.';

const PAGINA_ARCHIVO_ENLACE = articulo(
  URL_ARCHIVO_ENLACE,
  'Archivo · Primer enlace',
  'Archivo Tecnia · El primer enlace de México',
  'Archivo Tecnia',
  'Actualizado en 2026',
  'archivo',
  [
    {
      texto: 'En 1989, el Tecnológico de Monterrey logró el primer enlace de México a una red de cómputo internacional.',
      hablaDe: ['f1-1989', 'f1-monterrey', 'f1-primerenlace'],
    },
    {
      texto: 'La conexión se hizo con una universidad de Estados Unidos, no de Canadá.',
      hablaDe: ['f2-pais'],
    },
  ],
);

const PAGINA_ENCICLOPEDIA_INTERNET = articulo(
  URL_ENCICLOPEDIA_INTERNET,
  'Enciclopedia · Internet en México',
  'Enciclopedia Tecnia · Internet en México',
  'Enciclopedia Tecnia',
  'Revisado en 2026',
  'enciclopedia',
  [
    {
      texto:
        'El primer enlace de México a una red internacional de cómputo se logró en 1989, desde el campus de Monterrey del Tecnológico de Monterrey.',
      hablaDe: ['f1-1989', 'f1-monterrey', 'f1-primerenlace'],
    },
    {
      texto: 'México se conectó con una universidad de Estados Unidos. Nunca hubo, en ese primer enlace, una conexión con Canadá.',
      hablaDe: ['f2-pais'],
    },
    {
      texto: 'El registro del dominio .mx ocurrió el mismo año, 1989.',
      hablaDe: ['f3-dominio'],
    },
    {
      texto:
        'Esa primera conexión dio acceso a NSFNet, una red que para entonces sumaba más de treinta mil computadoras en el mundo.',
      hablaDe: ['q1-nodos'],
    },
  ],
);

const PAGINA_ARCHIVO_DOMINIO = articulo(
  URL_ARCHIVO_DOMINIO,
  'Archivo · Dominio .mx',
  'Archivo Tecnia · El dominio .mx',
  'Archivo Tecnia',
  'Actualizado en 2026',
  'archivo',
  [{ texto: TEXTO_DOMINIO_MX, hablaDe: ['f3-dominio'] }],
);

/* Copia palabra por palabra el párrafo del Archivo: es lo que hay que notar,
   no algo que la interfaz señale (el boletín trae autor y fecha, no tiene
   pinta de blog sin firma — la única pista es que el párrafo es idéntico). */
const PAGINA_BOLETIN_DOMINIO = articulo(
  URL_BOLETIN_DOMINIO,
  'Boletín · Internet en los 90',
  'Boletín de la Secundaria 30 · Internet en los años noventa',
  'Comité de Cómputo · 2.º C',
  'Marzo de 2026',
  'boletin',
  [{ texto: TEXTO_DOMINIO_MX, hablaDe: ['f3-dominio'] }],
);

const PAGINA_INFORME = articulo(
  URL_INFORME,
  'Informe · Portada',
  'Informe sobre la primera década de la Red en México',
  'Archivo Tecnia',
  '2026',
  'archivo',
  [{ texto: 'Este informe reúne diez años de la Red en México, de 1989 a 1999, en cuarenta y dos páginas.', hablaDe: [] }],
  [{ etiqueta: 'Página 40 · El alcance de la conexión', url: URL_INFORME_P40 }],
);

const PAGINA_INFORME_P40 = articulo(
  URL_INFORME_P40,
  'Informe · Página 40',
  'Informe sobre la primera década de la Red en México · Página 40',
  'Archivo Tecnia',
  '2026',
  'archivo',
  [
    {
      texto:
        'La conexión de 1989 dio acceso a NSFNet, una red que en ese momento sumaba más de treinta mil computadoras en el mundo.',
      hablaDe: ['q1-nodos'],
    },
    {
      texto: `En el índice de nombres de quienes participaron en el proyecto no aparece ninguna persona llamada ${NOMBRE_INVENTADO}.`,
      hablaDe: ['f4-nombre'],
    },
  ],
);

const PAGINA_ENCICLOPEDIA_DOMINIOS = articulo(
  URL_ENCICLOPEDIA_DOMINIOS,
  'Enciclopedia · Dominios de país',
  'Enciclopedia Tecnia · Dominios de país en América Latina',
  'Enciclopedia Tecnia',
  'Revisado en 2026',
  'enciclopedia',
  [
    {
      texto:
        'México no fue el primer país de América Latina en registrar su dominio de país: Chile registró el suyo, .cl, en 1987, dos años antes que México.',
      hablaDe: ['q2-primero'],
    },
  ],
);

const PAGINA_ENCICLOPEDIA_USUARIOS = articulo(
  URL_ENCICLOPEDIA_USUARIOS,
  'Enciclopedia · Usuarios de Internet',
  'Enciclopedia Tecnia · Usuarios de Internet en México',
  'Enciclopedia Tecnia',
  'Revisado en 2026',
  'enciclopedia',
  [
    {
      texto:
        'Según la Encuesta Nacional sobre Disponibilidad y Uso de las Tecnologías de la Información en los Hogares (ENDUTIH) del INEGI, en 2024 el 83.1% de la población de México usaba Internet: 100.2 millones de personas de seis años o más.',
      hablaDe: ['q3-cifra'],
    },
  ],
);

const PAGINA_INICIO: PaginaWeb = {
  url: URL_INICIO,
  pestana: 'Archivo Tecnia',
  titulo: 'Archivo Tecnia',
  autor: 'Archivo Tecnia',
  fecha: '2026',
  cuerpo: {
    tipo: 'vacio',
    mensaje: 'Escribe algo en la barra de direcciones, o elige un chip de la Hoja de verificación para empezar a buscar.',
  },
};

const CONSULTA_QUE_RESULTADOS: Record<string, Omit<ResultadoBusqueda, 'id'>[]> = {
  'primer enlace de internet en méxico 1989': [
    { titulo: 'Archivo Tecnia · El primer enlace', url: URL_ARCHIVO_ENLACE, descripcion: 'La historia de la conexión de 1989.' },
    { titulo: 'Enciclopedia Tecnia · Internet en México', url: URL_ENCICLOPEDIA_INTERNET, descripcion: 'Artículo de referencia.' },
  ],
  'universidad de monterrey primer enlace internet': [
    { titulo: 'Archivo Tecnia · El primer enlace', url: URL_ARCHIVO_ENLACE, descripcion: 'La historia de la conexión de 1989.' },
    { titulo: 'Enciclopedia Tecnia · Internet en México', url: URL_ENCICLOPEDIA_INTERNET, descripcion: 'Artículo de referencia.' },
  ],
  'primer enlace de internet en méxico': [
    { titulo: 'Archivo Tecnia · El primer enlace', url: URL_ARCHIVO_ENLACE, descripcion: 'La historia de la conexión de 1989.' },
    { titulo: 'Enciclopedia Tecnia · Internet en México', url: URL_ENCICLOPEDIA_INTERNET, descripcion: 'Artículo de referencia.' },
  ],
  'con qué país se conectó méxico en 1989': [
    { titulo: 'Archivo Tecnia · El primer enlace', url: URL_ARCHIVO_ENLACE, descripcion: 'La historia de la conexión de 1989.' },
    { titulo: 'Enciclopedia Tecnia · Internet en México', url: URL_ENCICLOPEDIA_INTERNET, descripcion: 'Artículo de referencia.' },
  ],
  'cuándo se registró el dominio .mx': [
    { titulo: 'Archivo Tecnia · El dominio .mx', url: URL_ARCHIVO_DOMINIO, descripcion: 'Ficha del registro del dominio.' },
    { titulo: 'Boletín de la Secundaria 30 · Internet en los 90', url: URL_BOLETIN_DOMINIO, descripcion: 'Boletín escolar, marzo de 2026.' },
    { titulo: 'Enciclopedia Tecnia · Internet en México', url: URL_ENCICLOPEDIA_INTERNET, descripcion: 'Artículo de referencia.' },
  ],
  'nsfnet treinta mil computadoras méxico 1989': [
    { titulo: 'Archivo Tecnia · Informe de la primera década', url: URL_INFORME, descripcion: 'Diez años de la Red en México.' },
    { titulo: 'Enciclopedia Tecnia · Internet en México', url: URL_ENCICLOPEDIA_INTERNET, descripcion: 'Artículo de referencia.' },
  ],
  'primer país de américa latina en registrar su dominio de internet': [
    {
      titulo: 'Enciclopedia Tecnia · Dominios de país en América Latina',
      url: URL_ENCICLOPEDIA_DOMINIOS,
      descripcion: 'Comparación de fechas de registro por país.',
    },
  ],
  'cuántas personas usan internet en méxico': [
    { titulo: 'Enciclopedia Tecnia · Usuarios de Internet en México', url: URL_ENCICLOPEDIA_USUARIOS, descripcion: 'Cifras oficiales, con su año.' },
  ],
  [CONSULTA_INFORME]: [
    { titulo: 'Archivo Tecnia · Informe de la primera década', url: URL_INFORME, descripcion: 'Diez años de la Red en México, en 42 páginas.' },
  ],
};

const PAGINAS_RESULTADOS = Object.entries(CONSULTA_QUE_RESULTADOS).map(([consulta, items]) => resultados(consulta, items));

export const MAPA_SITIOS: MapaSitios = Object.fromEntries(
  [
    PAGINA_INICIO,
    PAGINA_ARCHIVO_ENLACE,
    PAGINA_ENCICLOPEDIA_INTERNET,
    PAGINA_ARCHIVO_DOMINIO,
    PAGINA_BOLETIN_DOMINIO,
    PAGINA_INFORME,
    PAGINA_INFORME_P40,
    PAGINA_ENCICLOPEDIA_DOMINIOS,
    PAGINA_ENCICLOPEDIA_USUARIOS,
    ...PAGINAS_RESULTADOS,
  ].map((p) => [p.url, p]),
);

/** Una prueba a partir de un párrafo de una página ya abierta. `null` si el índice no existe. */
export function pruebaDeParrafo(pagina: PaginaWeb, indice: number): Prueba | null {
  if (pagina.cuerpo.tipo !== 'articulo') return null;
  const texto = pagina.cuerpo.parrafos[indice];
  if (texto === undefined) return null;
  const meta = META_PARRAFOS[pagina.url]?.[indice];
  const fuente = fuenteDeUrl(pagina.url);
  return {
    url: pagina.url,
    fuenteId: fuente?.id ?? pagina.url,
    autor: pagina.autor,
    fecha: pagina.fecha,
    texto,
    hablaDe: meta?.hablaDe ?? [],
  };
}

/**
 * «No encontramos nada» como prueba (pliego, regla 3 de la Hoja): el
 * `hablaDe` no sale de un dato guardado —una página vacía no tiene
 * párrafos— sino del ancla que la fila tenía activa cuando se adjuntó, tal
 * como pide el predicado del encargo 4: «por construcción del mapa de la
 * clase».
 */
export function pruebaDeVacio(pagina: PaginaWeb, anclaActual: string | null): Prueba | null {
  if (pagina.cuerpo.tipo !== 'vacio') return null;
  return {
    url: pagina.url,
    fuenteId: 'buscador',
    autor: null,
    fecha: null,
    texto: pagina.cuerpo.mensaje,
    hablaDe: anclaActual ? [anclaActual] : [],
    esVacio: true,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// 4 · Las filas de la Hoja
// ─────────────────────────────────────────────────────────────────────────

export const FILAS_ACTO1: Fila[] = [
  {
    id: 'f1',
    anclas: [
      { id: 'f1-1989', etiqueta: '1989', consulta: 'primer enlace de internet en méxico 1989' },
      { id: 'f1-monterrey', etiqueta: 'una universidad de Monterrey', consulta: 'universidad de monterrey primer enlace internet' },
      { id: 'f1-primerenlace', etiqueta: 'el primer enlace', consulta: 'primer enlace de internet en méxico' },
    ],
    senales: [1],
    correcto: 'confirmada',
  },
  {
    id: 'f2',
    anclas: [{ id: 'f2-pais', etiqueta: 'el país conectado', consulta: 'con qué país se conectó méxico en 1989' }],
    senales: [],
    correcto: 'contradicha',
  },
  {
    id: 'f3',
    anclas: [{ id: 'f3-dominio', etiqueta: 'el dominio .mx', consulta: 'cuándo se registró el dominio .mx' }],
    senales: [],
    correcto: 'confirmada',
  },
  {
    id: 'f4',
    anclas: [{ id: 'f4-nombre', etiqueta: 'el nombre de la ingeniera', consulta: `ingeniera ${NOMBRE_INVENTADO} internet méxico 1989` }],
    senales: [2],
    correcto: 'sin-respaldo',
  },
];

export const FILAS_ACTO3: Fila[] = [
  {
    id: 'q1',
    anclas: [{ id: 'q1-nodos', etiqueta: 'treinta mil computadoras', consulta: 'nsfnet treinta mil computadoras méxico 1989' }],
    senales: [3],
    correcto: 'confirmada',
    vaEnElTrabajo: true,
  },
  {
    id: 'q2',
    anclas: [{ id: 'q2-primero', etiqueta: 'el primer país en registrar su dominio', consulta: 'primer país de américa latina en registrar su dominio de internet' }],
    senales: [4],
    correcto: 'contradicha',
    vaEnElTrabajo: true,
  },
  {
    id: 'q3',
    anclas: [{ id: 'q3-cifra', etiqueta: 'cien millones de personas', consulta: 'cuántas personas usan internet en méxico' }],
    senales: [3],
    correcto: null,
    vaEnElTrabajo: true,
  },
  {
    id: 'q4',
    anclas: [{ id: 'q4-martes', etiqueta: 'el día de la semana', consulta: 'primer correo electrónico méxico qué día se envió' }],
    senales: [1],
    correcto: null,
    vaEnElTrabajo: false,
  },
  {
    id: 'q5',
    anclas: [{ id: 'q5-web', etiqueta: 'Internet y la Web', consulta: 'diferencia entre internet y la web' }],
    senales: [],
    correcto: null,
    vaEnElTrabajo: false,
  },
];

export const TODAS_LAS_FILAS: Fila[] = [...FILAS_ACTO1, ...FILAS_ACTO3];

export function filaPorId(id: string): Fila | undefined {
  return TODAS_LAS_FILAS.find((f) => f.id === id);
}

// ─────────────────────────────────────────────────────────────────────────
// 5 · Las señales — el catálogo de chapas
// ─────────────────────────────────────────────────────────────────────────

export const ETIQUETA_SENAL: Record<number, string> = {
  1: 'Dato exactísimo',
  2: 'Nombre propio',
  3: 'Cifra redonda',
  4: 'Un “el primero”',
  5: 'Cita sin abrir',
  6: 'Sin pistas',
};

export const EXPLICA_SENAL: Record<number, string> = {
  1: 'Esto se puede comprobar en un minuto. Hazlo.',
  2: 'Búscalo. Si no aparece nadie, ya sabes qué poner.',
  3: 'Busca la cifra de verdad y el año en que se midió.',
  4: 'Ojo: basta un contraejemplo para tumbarlo.',
  5: 'Ábrela. No basta con que exista.',
  6: 'Esto no significa que esté bien. Significa que no tienes pistas.',
};

// ─────────────────────────────────────────────────────────────────────────
// 6 · El guion de Tecnia Asistente
// ─────────────────────────────────────────────────────────────────────────

export const RESPUESTA_ACTO_1_2: RespuestaGuion = {
  id: 'r-hallazgo',
  partes: [
    { id: 'f1', texto: 'El primer enlace de Internet de México se hizo en 1989, desde una universidad de Monterrey.' },
    { id: 'f2', texto: 'Ese primer enlace conectaba a México con una universidad de Canadá.' },
    { id: 'f3', texto: 'El dominio .mx se registró ese mismo año.' },
    { id: 'f4', texto: `Lo consiguió un equipo dirigido por la ingeniera ${NOMBRE_INVENTADO}.` },
  ],
};

export const RESPUESTA_ACTO_3: RespuestaGuion = {
  id: 'r-cierre',
  partes: [
    { id: 'q1', texto: 'Gracias a esa conexión, México quedó enlazado a una red de más de treinta mil computadoras en el mundo.' },
    { id: 'q2', texto: 'México fue el primer país de América Latina en registrar su dominio de país, el .mx.' },
    { id: 'q3', texto: 'Hoy hay unos cien millones de personas conectadas a Internet en México.' },
    { id: 'q4', texto: 'El primer correo electrónico que se mandó en México se envió un martes.' },
    { id: 'q5', texto: 'Internet y la Web no son lo mismo.' },
  ],
};

/** Las dos fichas del compositor, en sus dos apariciones (ver `LabVerificaALaIa`). */
export const FICHA_PREGUNTAR_1 = 'preguntar-otra-vez-1';
export const FICHA_PREGUNTAR_2 = 'preguntar-otra-vez-2';
export const FICHA_PEDIR_CIERRE = 'pedir-cierre';

export const GUION_CLASE: GuionAsistente = {
  respuestas: [RESPUESTA_ACTO_1_2, RESPUESTA_ACTO_3],
  reglas: [
    { tipo: 'ficha', ficha: FICHA_PEDIR_CIERRE, responde: 'r-cierre' },
    { tipo: 'ficha', ficha: FICHA_PREGUNTAR_1, responde: 'r-hallazgo' },
    { tipo: 'ficha', ficha: FICHA_PREGUNTAR_2, responde: 'r-cierre' },
  ],
  porDefecto: RESPUESTA_ACTO_1_2,
};

// ─────────────────────────────────────────────────────────────────────────
// 7 · Acto 2 — la cita que existe y no dice eso
// ─────────────────────────────────────────────────────────────────────────

export const CITA_TEXTO =
  'Si quieres citarlo, todo esto viene en el Informe sobre la primera década de la Red en México, del Archivo Tecnia, página 40.';

export type OpcionCita = 'no-existe' | 'existe-no-dice' | 'lo-confirma';

export const OPCIONES_CITA: { id: OpcionCita; etiqueta: string; ok: boolean; ayuda: string }[] = [
  { id: 'no-existe', etiqueta: 'El informe no existe: se lo inventó.', ok: false, ayuda: 'Existe, lo acabas de abrir. El invento fue otro.' },
  { id: 'existe-no-dice', etiqueta: 'El informe existe, pero no dice eso.', ok: true, ayuda: '' },
  { id: 'lo-confirma', etiqueta: 'El informe lo confirma.', ok: false, ayuda: 'Vuelve a la página 40 y léela entera. No está.' },
];

// ─────────────────────────────────────────────────────────────────────────
// 8 · El encargo de cierre
// ─────────────────────────────────────────────────────────────────────────

export type OpcionCierre = 'como-si-lo-supiera' | 'decir-de-donde-salio' | 'preguntar-otra-vez';

export const OPCIONES_CIERRE: { id: OpcionCierre; etiqueta: string; ok: boolean; ayuda: string }[] = [
  {
    id: 'como-si-lo-supiera',
    etiqueta: 'Las escribo igual: si lo dijo el asistente, por algo será.',
    ok: false,
    ayuda: 'Eso es justo lo que hoy comprobaste que no basta.',
  },
  {
    id: 'decir-de-donde-salio',
    etiqueta: 'Las quito, o las escribo diciendo de dónde salieron y que no las comprobé.',
    ok: true,
    ayuda: '',
  },
  {
    id: 'preguntar-otra-vez',
    etiqueta: 'Le pregunto otra vez al asistente para asegurarme.',
    ok: false,
    ayuda: 'Te va a decir lo mismo, esté bien o mal. Preguntar dos veces no es comprobar.',
  },
];

export const TOTAL_ENCARGOS = 8;
