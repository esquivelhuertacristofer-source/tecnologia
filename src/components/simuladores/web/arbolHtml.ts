/**
 * Tecnia Web · `arbolHtml.ts` — de fichas a árbol, sin quedarse en blanco.
 *
 * Aquí se decide **quién es hijo de quién**, que es lo que el léxico no sabe.
 * Y se decide con la regla que ordena el archivo entero:
 *
 *   **La página se enseña siempre. Lo que está mal se avisa, no se apaga.**
 *
 * Un alumno de secundaria deja etiquetas sin cerrar todo el rato. Un
 * analizador que devuelve la nada porque falta un `</p>` le da la peor
 * información posible: ninguna. Es la misma lección que `leerFichasTolerante`
 * en el editor de Python, y aquí se concreta en cinco reglas:
 *
 * 1. **Sin cerrar** → al llegar al final se cierra sola, y se dice en qué
 *    línea se había abierto.
 * 2. **Cierre sobrante** (`</div>` sin `<div>`) → se ignora y se avisa.
 * 3. **Mal anidada** (`<b><i></b></i>`) → se cierran las dos, en el orden que
 *    de verdad tocaba, y se explica cuál era el orden.
 * 4. **Etiqueta desconocida** (`<seccion>`) → **se vuelve transparente**: sus
 *    hijos pasan a colgar del padre. Así el texto de dentro se sigue viendo, y
 *    el aviso explica qué etiqueta usar.
 * 5. **Etiqueta prohibida** (`<script>`, `<iframe>`) → se tira ella y todo lo
 *    que lleva dentro. Ésta es la única en la que se pierde contenido, y es a
 *    propósito: es el guardián.
 *
 * ── El cierre implícito, que no es un error ────────────────────────────────
 *
 * `</li>`, `</p>`, `</td>` y `</option>` son **opcionales en HTML de verdad**.
 * Marcar como error `<li>uno<li>dos` sería enseñar mentira. Se cierran solas
 * al abrirse la hermana, en silencio; y si llegan abiertas al final del
 * archivo, salen como **aviso** («no es obligatorio, pero se lee mucho mejor»)
 * y no como error.
 */

import { problema, type ProblemaWeb } from './errores';
import { leerFichasHtml, type AtributoFicha } from './lexicoHtml';
import { ATRIBUTOS_GLOBALES, ETIQUETAS, ETIQUETAS_PROHIBIDAS, atributoPermitido, esManejadorDeEvento, esVacia } from './subconjunto';

/* ── El árbol ───────────────────────────────────────────────────────────────*/

export interface NodoTexto {
  tipo: 'texto';
  texto: string;
  linea: number;
}

export interface NodoComentario {
  tipo: 'comentario';
  texto: string;
  linea: number;
}

export interface NodoElemento {
  tipo: 'elemento';
  /** Identidad estable dentro de ESTE árbol: la clave de los estilos y del inspector. */
  n: number;
  etiqueta: string;
  atributos: Readonly<Record<string, string>>;
  hijos: readonly NodoWeb[];
  linea: number;
  col: number;
}

export type NodoWeb = NodoTexto | NodoComentario | NodoElemento;

export interface NodoDocumento {
  tipo: 'documento';
  hijos: readonly NodoWeb[];
}

export interface ArbolHtml {
  origen: string;
  raiz: NodoDocumento;
  /** Lo que se pinta: el `<body>` si lo hay, si no el documento entero. */
  cuerpo: NodoDocumento | NodoElemento;
  problemas: readonly ProblemaWeb[];
  /** Cuántos elementos tiene. Los `n` van de 1 a este número. */
  elementos: number;
  /** El texto del `<title>`, o `null`. */
  titulo: string | null;
  /** Los `href` de los `<link rel="stylesheet">`, en orden. */
  hojasEnlazadas: readonly string[];
  /** Lo que venía dentro de los `<style>`, con la línea en la que empieza cada uno. */
  estilosIncrustados: readonly { texto: string; linea: number }[];
}

/* ── Las entidades ──────────────────────────────────────────────────────────*/

const ENTIDADES: Readonly<Record<string, string>> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  copy: '©', reg: '®', hellip: '…', mdash: '—', ndash: '–', middot: '·',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú',
  ntilde: 'ñ', Ntilde: 'Ñ', uuml: 'ü', iexcl: '¡', iquest: '¿', euro: '€',
};

/**
 * Decodifica lo que conoce y **deja tal cual lo que no**.
 *
 * Un `&` suelto en «Tomás & Jerry» es lo más normal del mundo en un texto
 * escrito por un alumno, y tratarlo como error sería llenar la lista de ruido.
 */
export function decodificarEntidades(texto: string): string {
  if (texto.indexOf('&') === -1) return texto;
  return texto.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (todo, cuerpo: string) => {
    if (cuerpo[0] === '#') {
      const n = cuerpo[1] === 'x' || cuerpo[1] === 'X' ? parseInt(cuerpo.slice(2), 16) : parseInt(cuerpo.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : todo;
    }
    return ENTIDADES[cuerpo] ?? todo;
  });
}

/* ── La construcción ────────────────────────────────────────────────────────*/

/** Las que se cierran solas al abrirse la hermana. Es HTML de verdad, no tolerancia. */
const CIERRE_IMPLICITO: Readonly<Record<string, readonly string[]>> = {
  li: ['li'],
  p: ['p'],
  tr: ['tr', 'td', 'th'],
  td: ['td', 'th'],
  th: ['td', 'th'],
  option: ['option'],
  dd: ['dd', 'dt'],
};

/** Las que HTML permite dejar sin cerrar: al final salen como aviso, no como error. */
const CIERRE_OPCIONAL = new Set(['li', 'p', 'td', 'th', 'tr', 'option', 'thead', 'tbody', 'tfoot', 'html', 'head', 'body']);

interface Marco {
  nombre: string;
  linea: number;
  col: number;
  atributos: Record<string, string>;
  hijos: NodoWeb[];
  /** `transparente`: sus hijos suben al padre. `descartado`: se tira todo. */
  modo: 'normal' | 'transparente' | 'descartado';
  n: number;
}

export function analizarHtmlSinCache(fuente: string, origen = 'index.html'): ArbolHtml {
  const { fichas, problemas: problemasLexico } = leerFichasHtml(fuente, origen);
  const problemas: ProblemaWeb[] = [...problemasLexico];
  const pila: Marco[] = [{ nombre: '', linea: 0, col: 0, atributos: {}, hijos: [], modo: 'normal', n: 0 }];
  const hojasEnlazadas: string[] = [];
  const estilosIncrustados: { texto: string; linea: number }[] = [];
  /* En un objeto y no en dos `let`: se asignan desde dentro de `cerrarMarco`,
   * y una variable suelta que sólo se asigna dentro de una función anidada es
   * justo la que TypeScript deja de estrechar bien. */
  const hallazgos: { titulo: string | null; cuerpo: NodoElemento | null } = { titulo: null, cuerpo: null };
  let contador = 0;

  const tope = (): Marco => pila[pila.length - 1];

  const cerrarMarco = (): void => {
    const marco = pila.pop();
    if (!marco) return;
    const padre = tope();
    if (marco.modo === 'descartado') return;
    if (marco.modo === 'transparente') {
      for (const h of marco.hijos) padre.hijos.push(h);
      return;
    }
    const nodo: NodoElemento = {
      tipo: 'elemento',
      n: marco.n,
      etiqueta: marco.nombre,
      atributos: marco.atributos,
      hijos: marco.hijos,
      linea: marco.linea,
      col: marco.col,
    };
    if (marco.nombre === 'body' && hallazgos.cuerpo === null) hallazgos.cuerpo = nodo;
    if (marco.nombre === 'title' && hallazgos.titulo === null) {
      const t = marco.hijos.find((h) => h.tipo === 'texto');
      hallazgos.titulo = t && t.tipo === 'texto' ? t.texto.trim() : '';
    }
    if (marco.nombre === 'style') {
      const t = marco.hijos.find((h) => h.tipo === 'texto');
      if (t && t.tipo === 'texto') estilosIncrustados.push({ texto: t.texto, linea: t.linea });
    }
    padre.hijos.push(nodo);
  };

  const revisarAtributos = (nombre: string, lista: AtributoFicha[], linea: number): Record<string, string> => {
    const salida: Record<string, string> = {};
    for (const a of lista) {
      if (Object.prototype.hasOwnProperty.call(salida, a.nombre)) {
        problemas.push(
          problema('atributo-desconocido', 'aviso', `«${a.nombre}» está dos veces en la misma etiqueta`, {
            origen,
            linea: a.linea,
            columna: a.col,
            pista: 'el navegador se queda con el primero y no mira el segundo',
          }),
        );
        continue;
      }
      if (esManejadorDeEvento(a.nombre)) {
        problemas.push(
          problema('atributo-prohibido', 'error', `«${a.nombre}» pone código dentro de la etiqueta, y eso aquí no se hace`, {
            origen,
            linea: a.linea,
            columna: a.col,
            pista: 'lo que pasa al hacer clic se escribe en el archivo de guion, no dentro del HTML',
          }),
        );
        continue;
      }
      if (!atributoPermitido(nombre, a.nombre)) {
        const propios = ETIQUETAS[nombre]?.atributos ?? [];
        const validos = [...propios, ...ATRIBUTOS_GLOBALES].slice(0, 6).join('», «');
        problemas.push(
          problema('atributo-desconocido', 'error', `«${a.nombre}» no es un atributo de «${nombre}»`, {
            origen,
            linea: a.linea,
            columna: a.col,
            pista: validos === '' ? null : `en «${nombre}» valen «${validos}»`,
          }),
        );
        continue;
      }
      const valor = decodificarEntidades(a.valor ?? '');
      if ((a.nombre === 'href' || a.nombre === 'src') && /^\s*(javascript|data|vbscript):/i.test(valor)) {
        problemas.push(
          problema('atributo-prohibido', 'error', `una dirección que empieza por «${valor.split(':')[0].trim()}:» no se abre aquí`, {
            origen,
            linea: a.linea,
            columna: a.col,
            pista: 'los enlaces llevan a una página («acerca.html») o a un sitio («tecnia.mx»)',
          }),
        );
        continue;
      }
      salida[a.nombre] = valor;
    }

    if (nombre === 'img' && salida.alt === undefined) {
      problemas.push(
        problema('sin-alt', 'aviso', 'esta imagen no tiene texto alternativo', {
          origen,
          linea,
          pista: 'el «alt» es lo que lee en voz alta el lector de pantalla: alt="un gato dormido en una silla"',
        }),
      );
    }
    if (nombre === 'a' && salida.href === undefined) {
      problemas.push(
        problema('atributo-desconocido', 'aviso', 'este enlace no lleva a ninguna parte', {
          origen,
          linea,
          pista: 'un enlace necesita «href»: <a href="acerca.html">Acerca de mí</a>',
        }),
      );
    }
    return salida;
  };

  for (const f of fichas) {
    if (f.tipo === 'doctype') continue;

    if (f.tipo === 'texto') {
      if (tope().modo === 'descartado') continue;
      tope().hijos.push({ tipo: 'texto', texto: decodificarEntidades(f.texto), linea: f.linea });
      continue;
    }

    if (f.tipo === 'comentario') {
      if (tope().modo === 'descartado') continue;
      tope().hijos.push({ tipo: 'comentario', texto: f.texto, linea: f.linea });
      continue;
    }

    if (f.tipo === 'apertura') {
      const prohibida = ETIQUETAS_PROHIBIDAS[f.nombre];
      if (prohibida !== undefined) {
        problemas.push(
          problema('etiqueta-prohibida', 'error', `«${f.nombre}» no se puede usar: ${prohibida}`, {
            origen,
            linea: f.linea,
            columna: f.col,
            pista: f.nombre === 'script' ? 'aquí el guion vive en su propio archivo, y esta práctica no lo ejecuta' : null,
          }),
        );
        if (!f.autocierre && f.nombre !== 'base') {
          pila.push({ nombre: f.nombre, linea: f.linea, col: f.col, atributos: {}, hijos: [], modo: 'descartado', n: 0 });
        }
        continue;
      }

      const conocida = ETIQUETAS[f.nombre] !== undefined;
      if (!conocida) {
        problemas.push(
          problema('etiqueta-desconocida', 'error', `«${f.nombre}» no es una etiqueta de HTML`, {
            origen,
            linea: f.linea,
            columna: f.col,
            pista: 'las etiquetas de HTML están en inglés: sección se dice «section», y encabezado «header»',
          }),
        );
        if (!f.autocierre) {
          pila.push({ nombre: f.nombre, linea: f.linea, col: f.col, atributos: {}, hijos: [], modo: 'transparente', n: 0 });
        }
        continue;
      }

      const hermanas = CIERRE_IMPLICITO[f.nombre];
      if (hermanas && hermanas.includes(tope().nombre)) cerrarMarco();

      const vacia = esVacia(f.nombre);
      if (!vacia && f.autocierre) {
        problemas.push(
          problema('sin-cerrar', 'aviso', `«<${f.nombre} />» no cierra nada: «${f.nombre}» lleva contenido dentro`, {
            origen,
            linea: f.linea,
            columna: f.col,
            pista: `la barra al final sólo vale en las que van solas, como <img> o <br>; ésta se cierra con </${f.nombre}>`,
          }),
        );
      }

      contador += 1;
      const atributos = revisarAtributos(f.nombre, f.atributos, f.linea);
      if (f.nombre === 'link' && (atributos.rel ?? '').toLowerCase() === 'stylesheet' && atributos.href) {
        hojasEnlazadas.push(atributos.href);
      }

      if (vacia) {
        if (tope().modo !== 'descartado') {
          tope().hijos.push({
            tipo: 'elemento',
            n: contador,
            etiqueta: f.nombre,
            atributos,
            hijos: [],
            linea: f.linea,
            col: f.col,
          });
        }
        continue;
      }
      pila.push({
        nombre: f.nombre,
        linea: f.linea,
        col: f.col,
        atributos,
        hijos: [],
        modo: tope().modo === 'descartado' ? 'descartado' : 'normal',
        n: contador,
      });
      continue;
    }

    /* f.tipo === 'cierre' */
    let profundidad = -1;
    for (let k = pila.length - 1; k >= 1; k -= 1) {
      if (pila[k].nombre === f.nombre) {
        profundidad = k;
        break;
      }
    }
    if (profundidad === -1) {
      if (esVacia(f.nombre)) {
        problemas.push(
          problema('cierre-sobrante', 'aviso', `«${f.nombre}» no se cierra: va sola`, {
            origen,
            linea: f.linea,
            columna: f.col,
            pista: `escribe sólo <${f.nombre}>`,
          }),
        );
      } else {
        problemas.push(
          problema('cierre-sobrante', 'error', `hay un «</${f.nombre}>» que no cierra nada`, {
            origen,
            linea: f.linea,
            columna: f.col,
            pista: `no hay ningún «<${f.nombre}>» abierto por encima de aquí`,
          }),
        );
      }
      continue;
    }
    /* Cerrar `</ul>` con un `<li>` abierto NO es anidar mal: el cierre de `li`
     * es opcional en HTML, y quejarse aquí sería enseñar mentira. Sólo se
     * denuncia cuando lo que queda abierto en medio lleva cierre obligatorio. */
    const todasOpcionales = pila.slice(profundidad + 1).every((m) => CIERRE_OPCIONAL.has(m.nombre));
    if (profundidad !== pila.length - 1 && !todasOpcionales) {
      const dentro = tope().nombre;
      problemas.push(
        problema('mal-anidada', 'error', `cerraste «${f.nombre}» pero lo último que abriste fue «${dentro}»`, {
          origen,
          linea: f.linea,
          columna: f.col,
          pista: `las etiquetas se cierran al revés de como se abren: primero </${dentro}> y luego </${f.nombre}>`,
        }),
      );
    }
    while (pila.length - 1 >= profundidad) cerrarMarco();
  }

  while (pila.length > 1) {
    const m = tope();
    const opcional = CIERRE_OPCIONAL.has(m.nombre);
    if (m.modo === 'normal') {
      problemas.push(
        problema(
          'sin-cerrar',
          opcional ? 'aviso' : 'error',
          opcional
            ? `«${m.nombre}» se quedó sin cerrar (no es obligatorio, pero el código se lee mucho mejor cerrándola)`
            : `«${m.nombre}» se abrió y no se cerró`,
          {
            origen,
            linea: m.linea,
            columna: m.col,
            pista: `falta un «</${m.nombre}>»`,
          },
        ),
      );
    }
    cerrarMarco();
  }

  const raiz: NodoDocumento = { tipo: 'documento', hijos: pila[0].hijos };
  return {
    origen,
    raiz,
    cuerpo: hallazgos.cuerpo ?? raiz,
    problemas,
    elementos: contador,
    titulo: hallazgos.titulo,
    hojasEnlazadas,
    estilosIncrustados,
  };
}

/* ── La memoria, para que dos análisis del mismo texto sean el MISMO objeto ──*/

const CACHE = new Map<string, ArbolHtml>();
const TOPE_CACHE = 24;

/**
 * Analiza, y si ya se analizó ese mismo texto **devuelve el mismo objeto**.
 *
 * No es sólo velocidad —que también, porque el editor reanaliza en cada
 * tecla—: es la regla 3 del encargo, que se comprueba con `toBe`. Con
 * identidad estable, `useMemo` y `React.memo` dejan de repintar la vista
 * previa cuando el alumno tocó el CSS y no el HTML.
 */
export function analizarHtml(fuente: string, origen = 'index.html'): ArbolHtml {
  const clave = `${origen} ${fuente}`;
  const guardado = CACHE.get(clave);
  if (guardado) return guardado;
  const arbol = analizarHtmlSinCache(fuente, origen);
  if (CACHE.size >= TOPE_CACHE) {
    const primera = CACHE.keys().next();
    if (!primera.done) CACHE.delete(primera.value);
  }
  CACHE.set(clave, arbol);
  return arbol;
}

/* ── Utilidades sobre el árbol ──────────────────────────────────────────────*/

/** Todo el texto que hay dentro, con los espacios de más colapsados. */
export function textoDe(nodo: NodoWeb | NodoDocumento): string {
  if (nodo.tipo === 'comentario') return '';
  if (nodo.tipo === 'texto') return nodo.texto;
  let salida = '';
  for (const h of nodo.hijos) salida += textoDe(h);
  return salida;
}

/** El texto como se lee en la página: sin espacios de sobra ni saltos de línea. */
export function textoVisible(nodo: NodoWeb | NodoDocumento): string {
  return textoDe(nodo).replace(/\s+/g, ' ').trim();
}

/** Recorre los elementos en el orden en que se escribieron, incluido el de arriba. */
export function recorrerElementos(nodo: NodoWeb | NodoDocumento, visita: (e: NodoElemento) => void): void {
  if (nodo.tipo === 'texto' || nodo.tipo === 'comentario') return;
  if (nodo.tipo === 'elemento') visita(nodo);
  for (const h of nodo.hijos) recorrerElementos(h, visita);
}

/**
 * Los elementos que se VEN, de dentro hacia fuera y sin el de arriba.
 *
 * La diferencia con `recorrerElementos` es lo que se deja fuera: la cabecera
 * entera (`head`, `title`, `meta`, `link`, `style`) y el propio nodo de
 * partida. Es lo que hace falta para dos preguntas que se hacen mucho: «¿qué
 * hay en la página, en orden?» y «¿está vacía?». Contar el `<body>` como
 * contenido dejaba una página vacía pareciendo llena — y eso estaba escrito
 * aquí hasta que la prueba de la página vacía lo cazó.
 */
export function elementosVisibles(nodo: NodoWeb | NodoDocumento): NodoElemento[] {
  const salida: NodoElemento[] = [];
  const bajar = (n: NodoWeb | NodoDocumento): void => {
    if (n.tipo === 'texto' || n.tipo === 'comentario') return;
    for (const h of n.hijos) {
      if (h.tipo !== 'elemento') continue;
      if (ETIQUETAS[h.etiqueta]?.cabecera === true) continue;
      salida.push(h);
      bajar(h);
    }
  };
  bajar(nodo);
  return salida;
}
