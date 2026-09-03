/**
 * TECNIA NAVEGADOR · los datos, sin React.
 *
 * El armazón del que cuelgan 6 actividades (CANON-ARMAZONES.md, «9 · Tecnia
 * Navegador»): un navegador de verdad —pestañas, barra de direcciones con su
 * candado, atrás/adelante, historial, marcadores, descargas y ventanas
 * emergentes— y el buscador **como una pestaña más**, no como un programa
 * aparte: la lista de resultados es sólo otra `PaginaWeb` en el mapa, con
 * `cuerpo.tipo === 'resultados'`. Eso ya lo hacía así `LabCompruebaLaRespuesta`
 * (su `TabId = 'resultados'` reusa el mismo tipo `Fuente` que las páginas de
 * contenido) — este archivo generaliza esa idea, no la inventa.
 *
 * No es un motor de plantillas: no sabe qué es un acierto, no pinta
 * preguntas, no corrige nada. Sólo simula EL PROGRAMA. La actividad decide
 * qué URL visitar, qué botón importa y qué hacer con cada clic —vía las
 * `acciones` de una ficha, o navegando a otra URL del mapa que ella escribió.
 *
 * ── La decisión que ordena este archivo: la página es un dato ──────────────
 *
 * `PaginaWeb.cuerpo` es una unión de estructuras (párrafos, resultados de
 * búsqueda, una ficha de datos, o «vacío»), nunca una cadena de HTML ni un
 * `ReactNode` libre. Si la actividad pudiera pasar marcado suelto y el
 * armazón lo inyectara, eso sería un agujero de seguridad en una plataforma
 * para niños y además ninguna prueba podría comprobar qué hay adentro sin
 * parsear DOM a ciegas. Con datos estructurados, una prueba lee
 * `pagina.cuerpo.parrafos[0]` directo.
 *
 * ── Qué cambié de la propuesta del canon (§9) ───────────────────────────────
 *
 * 1. Quité el campo `id`: `PaginaWeb` no necesita una identidad aparte de
 *    `url`, y tener las dos abre la puerta a que se desincronicen (un `id`
 *    que apunta a una `url` distinta de la que de verdad quedó en el mapa).
 *    `url` ES la clave del mapa y la identidad de la página.
 * 2. Quité `{ tipo: 'libre'; contenido: ReactNode }`. El canon lo proponía
 *    como escape para lo que no cupiera en las otras formas, pero ninguna de
 *    las 6 actividades reales lo necesita —todas son artículo, resultados de
 *    búsqueda, o una ficha de datos (producto, vacante, perfil de carrera,
 *    examen)— y dejar un `ReactNode` es la misma trampa que las cadenas de
 *    HTML: nada que una prueba pueda leer como dato. En su lugar añadí
 *    `{ tipo: 'ficha' }`, estructurado.
 * 3. Añadí `protocolo?: 'http' | 'https'` COMO CAMPO EXPLÍCITO en vez de
 *    inferirlo del texto de `url`. Las URLs que ya usa
 *    `LabCompruebaLaRespuesta` no llevan esquema
 *    (`'acuario-nacional.mx/fichas/pulpo'`); si el candado se dedujera de si
 *    la cadena empieza con `'https://'`, CUALQUIER página existente saldría
 *    insegura por accidente de formato, no por intención de la actividad. El
 *    candado tiene que ser un dato puesto a propósito, no una lectura de texto.
 * 4. Añadí `enlaces?: EnlacePagina[]` (no estaba en el borrador del canon):
 *    el encargo pide que el mapa incluya «enlaces a otras URLs» y ninguna de
 *    las 6 necesita hipervínculos DENTRO de un párrafo — con una lista de
 *    enlaces relacionados al pie de la página alcanza y se queda como dato
 *    plano, no como marcado.
 * 5. Añadí `datos?: Record<string, unknown>` en `ResultadoBusqueda`: el mismo
 *    escape opaco que ya usa `RespuestaGuion.datos` en Tecnia Asistente — el
 *    armazón lo transporta y no lo mira. Lo necesita `n8-derechos-y-licencias`
 *    para colgar la licencia de cada imagen sin que el navegador tenga que
 *    saber qué es una licencia Creative Commons.
 * 6. `estadoSeguridad` da TRES estados, no un booleano: `n8-cifrado-basico`
 *    no sólo enseña http-vs-https, también un candado con certificado
 *    inválido (`'advertencia'`), que es distinto de no tener candado en
 *    absoluto (`'insegura'`).
 *
 * ── La pila de atrás/adelante, aparte y pura ────────────────────────────────
 *
 * `navegarEnPestana` / `irAtras` / `irAdelante` no tocan React: son funciones
 * puras sobre `EstadoPestana`, para poder probar las dos reglas del encargo
 * SIN montar un componente ni un hook:
 *
 *   1. Navegar a un sitio nuevo borra la pila de «adelante».
 *   2. «Atrás» con la pila vacía no hace nada (no revienta, no da la vuelta).
 *
 * Es el defecto clásico de todo navegador de juguete, y aquí se prueba en el
 * nivel más barato posible: llamando a la función, sin `act()` ni `render`.
 */

// ───────────────────────────────────────────────────────────────────────────
// 1 · La página
// ───────────────────────────────────────────────────────────────────────────

export type Protocolo = 'http' | 'https';

export interface Certificado {
  emisor: string;
  valido: boolean;
}

/** Un resultado del buscador. Puede ser un anuncio disfrazado de resultado —
 *  distinguirlos es, literalmente, una de las 6 clases. */
export interface ResultadoBusqueda {
  id: string;
  titulo: string;
  url: string;
  descripcion: string;
  esAnuncio?: boolean;
  /** Lo que la clase quiera colgar (licencia, precio, lo que sea) y el
   *  armazón no entiende: lo transporta y no lo mira. */
  datos?: Record<string, unknown>;
}

export interface DatoFicha {
  etiqueta: string;
  valor: string;
}

/** Un botón de acción dentro de una ficha (p. ej. «Aplicar», «Añadir al
 *  carrito»). El armazón sólo lo pinta y avisa el clic: qué hace es cosa de
 *  la actividad, vía `onAccionFicha`. No es un motor de plantillas. */
export interface AccionFicha {
  id: string;
  etiqueta: string;
  /** Ya se hizo (p. ej. «ya aplicaste»): se pinta distinto y no se deshace aquí. */
  hecha?: boolean;
  deshabilitada?: boolean;
}

export type CuerpoPagina =
  | { tipo: 'articulo'; parrafos: string[] }
  | { tipo: 'resultados'; consulta: string; resultados: ResultadoBusqueda[] }
  | { tipo: 'ficha'; datos: DatoFicha[]; precio?: string; acciones?: AccionFicha[] }
  | { tipo: 'vacio'; mensaje: string };

export interface EnlacePagina {
  etiqueta: string;
  url: string;
}

/** Una alerta que trae la propia página (p. ej. «este sitio pide tu contraseña
 *  por correo, eso nunca lo hace un banco de verdad»). La actividad decide si
 *  la enseña o la esconde; el armazón sólo la transporta. */
export interface SenalPagina {
  id: string;
  tono: 'buena' | 'alerta';
  texto: string;
  explica: string;
}

export interface PaginaWeb {
  /** La URL es la identidad de la página y la clave del mapa. */
  url: string;
  /** Etiqueta corta para la pestaña, p. ej. "Acuario Nacional". */
  pestana: string;
  titulo: string;
  autor: string | null;
  fecha: string | null;
  /** Por omisión `'https'`: hay que pedir `'http'` a propósito para enseñar el riesgo. */
  protocolo?: Protocolo;
  /** El candado es un dato de la página, no un adorno de la ventana. */
  certificado?: Certificado;
  cuerpo: CuerpoPagina;
  enlaces?: EnlacePagina[];
  senales?: SenalPagina[];
}

/** URL → página. Navegar es moverse por este mapa; lo escribe la actividad. */
export type MapaSitios = Record<string, PaginaWeb>;

// ───────────────────────────────────────────────────────────────────────────
// 2 · Funciones puras sobre una página
// ───────────────────────────────────────────────────────────────────────────

export function protocoloDe(pagina: PaginaWeb): Protocolo {
  return pagina.protocolo ?? 'https';
}

export type EstadoSeguridad = 'segura' | 'advertencia' | 'insegura';

/**
 * `'segura'`      https con certificado válido (o sin dato de certificado:
 *                 no todas las páginas necesitan hablar de esto).
 * `'advertencia'` https pero con un certificado que la actividad marcó inválido.
 * `'insegura'`    http, sin importar el certificado.
 */
export function estadoSeguridad(pagina: PaginaWeb): EstadoSeguridad {
  if (protocoloDe(pagina) === 'http') return 'insegura';
  if (pagina.certificado && !pagina.certificado.valido) return 'advertencia';
  return 'segura';
}

/** La página que se ve al navegar a una URL que la actividad nunca puso en
 *  el mapa — jugar MAL. No revienta: contesta como un navegador de verdad,
 *  con un «no se encontró nada». */
export function paginaNoEncontrada(url: string): PaginaWeb {
  return {
    url,
    pestana: 'No encontrada',
    titulo: 'Esta página no existe',
    autor: null,
    fecha: null,
    cuerpo: { tipo: 'vacio', mensaje: `No encontramos ninguna página en «${url}».` },
  };
}

export function paginaDe(mapa: MapaSitios, url: string): PaginaWeb {
  return mapa[url] ?? paginaNoEncontrada(url);
}

/** La URL por omisión que arma el buscador a partir de lo escrito. Una
 *  actividad puede sustituirla (`OpcionesNavegador.urlDeBusqueda`) si quiere
 *  otro dominio, pero el patrón —y el dominio inventado— ya lo fijó
 *  `LabCompruebaLaRespuesta` (`buscador.tecnia.mx/buscar?q=...`). */
export function urlDeBusqueda(consulta: string): string {
  return `buscador.tecnia.mx/buscar?q=${encodeURIComponent(consulta.trim())}`;
}

// ───────────────────────────────────────────────────────────────────────────
// 3 · La pila de atrás/adelante — pura, sin React
// ───────────────────────────────────────────────────────────────────────────

export interface EstadoPestana {
  id: string;
  url: string;
  atras: string[];
  adelante: string[];
  recargas: number;
}

export function crearPestana(id: string, url: string): EstadoPestana {
  return { id, url, atras: [], adelante: [], recargas: 0 };
}

/** Regla 1: navegar a un sitio nuevo borra la pila de «adelante». */
export function navegarEnPestana(pestana: EstadoPestana, url: string): EstadoPestana {
  return { ...pestana, url, atras: [...pestana.atras, pestana.url], adelante: [] };
}

/** Regla 2: atrás con la pila vacía no hace nada. */
export function irAtras(pestana: EstadoPestana): EstadoPestana {
  if (pestana.atras.length === 0) return pestana;
  const previa = pestana.atras[pestana.atras.length - 1];
  return {
    ...pestana,
    url: previa,
    atras: pestana.atras.slice(0, -1),
    adelante: [pestana.url, ...pestana.adelante],
  };
}

/** Simétrica a `irAtras`: adelante con la pila vacía tampoco hace nada. */
export function irAdelante(pestana: EstadoPestana): EstadoPestana {
  if (pestana.adelante.length === 0) return pestana;
  const [siguiente, ...resto] = pestana.adelante;
  return { ...pestana, url: siguiente, atras: [...pestana.atras, pestana.url], adelante: resto };
}

/** Recargar no toca la pila: sólo cuenta cuántas veces pasó, para que una
 *  clase (o una prueba) pueda comprobar que cien recargas no corrompen nada. */
export function recargarPestana(pestana: EstadoPestana): EstadoPestana {
  return { ...pestana, recargas: pestana.recargas + 1 };
}

// ───────────────────────────────────────────────────────────────────────────
// 4 · Historial, marcadores, descargas y ventanas emergentes
// ───────────────────────────────────────────────────────────────────────────

/** Lo que queda registrado al visitar una página — la clase de huella digital
 *  necesita poder ENSEÑAR esto, no sólo tenerlo. */
export interface EntradaHistorial {
  url: string;
  titulo: string;
  /** Etiqueta ya formateada; el armazón no calcula tiempo real. */
  momento: string;
}

export interface Marcador {
  url: string;
  titulo: string;
}

export interface Descarga {
  id: string;
  nombre: string;
  /** Desde qué página se disparó. */
  urlOrigen: string;
  momento: string;
  /** La actividad la marca para enseñar a distinguir un archivo normal de uno sospechoso. */
  sospechosa?: boolean;
}

/** Una ventana emergente: otra página, abierta encima, que se puede cerrar
 *  sin navegar la pestaña de abajo. Aquí viven los engaños de «instalar algo
 *  sin querer». */
export interface VentanaEmergente {
  id: string;
  urlOrigen: string;
  pagina: PaginaWeb;
}
