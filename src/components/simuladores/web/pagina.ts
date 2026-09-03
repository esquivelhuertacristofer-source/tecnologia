/**
 * Tecnia Web · `pagina.ts` — juntar el HTML, sus estilos y su vista.
 *
 * El HTML sabe de etiquetas y el CSS de reglas, pero ninguno de los dos sabe
 * **qué archivo enlaza a cuál**, y ahí viven tres de los errores que más
 * tiempo le roban a un principiante:
 *
 *   1. escribió el CSS y no puso el `<link>` — «no me hace nada el estilo»;
 *   2. puso el `<link>` con el nombre mal — «estilos.css» contra «estilo.css»;
 *   3. la imagen no aparece porque el archivo no está.
 *
 * Los tres se detectan aquí y sólo aquí, porque hace falta ver el proyecto
 * entero. Y los tres se dicen con el arreglo escrito: «el proyecto tiene
 * «estilo.css», sin la ese».
 *
 * ── El ancho es un parámetro, y por eso hay dos vistas ─────────────────────
 *
 * `analizarPagina` recibe el ancho. La misma página analizada a 1024 y a 390
 * son dos resultados distintos en cuanto haya una `@media`, y la vista doble
 * de `n8-css-responsivo` es exactamente eso: **dos llamadas**, no una vista
 * que se encoge. Nada mide la pantalla.
 */

import { analizarCss, type HojaEstilos } from './analizarCss';
import { analizarHtml, elementosVisibles, recorrerElementos, textoVisible, type ArbolHtml } from './arbolHtml';
import { resolverEstilos, type Cascada } from './cascada';
import { problema, type ProblemaWeb } from './errores';
import { ANCHO_ESCRITORIO } from './subconjunto';

/** Una imagen disponible en la práctica. Las trae la clase; no hay red. */
export interface RecursoWeb {
  /** Como se escribe en el `src`: «gato.jpg». */
  nombre: string;
  /** De dónde sale de verdad: una ruta de `/public`, o un `data:` de la clase. */
  url: string;
  /** Para el listado de «imágenes que puedes usar». */
  descripcion?: string;
}

export interface OpcionesPagina {
  html: string;
  /** El nombre del archivo, para los mensajes: «index.html». */
  archivo?: string;
  /** Los archivos de estilo del proyecto. */
  hojas?: readonly { nombre: string; texto: string }[];
  /** Declarado, nunca medido. */
  ancho?: number;
  recursos?: readonly RecursoWeb[];
  /** Los nombres de las páginas del proyecto, para saber si un enlace lleva a alguna. */
  paginas?: readonly string[];
}

export interface PaginaAnalizada {
  archivo: string;
  arbol: ArbolHtml;
  /** Sólo las que la página enlaza de verdad, en el orden en que las enlaza. */
  hojas: readonly HojaEstilos[];
  cascada: Cascada;
  /** Todos: los del HTML, los del CSS, los de la cascada y los del proyecto. */
  problemas: readonly ProblemaWeb[];
  errores: number;
  avisos: number;
  ancho: number;
  titulo: string | null;
}

const ARCHIVO_DEL_PROYECTO = /\.(html?|css|js|jpe?g|png|gif|webp|svg|avif)$/i;

/**
 * ¿Esto sale de la práctica o es un archivo de aquí?
 *
 * Primero se mira si es un archivo —por la extensión—, y sólo después si
 * parece un dominio. Al revés, `estilo.css` salía «externo» porque lleva un
 * punto, y con él se iba el aviso más útil de todos: el del `<link>` mal
 * escrito. Lo cazó la prueba del proyecto.
 */
function esExterno(destino: string): boolean {
  if (/^(https?:)?\/\//i.test(destino) || /^(mailto|tel):/i.test(destino)) return true;
  if (ARCHIVO_DEL_PROYECTO.test(destino)) return false;
  return destino.includes('.') || destino.includes('/');
}

/** «estilos.css» contra «estilo.css»: se parecen si comparten el 80 % de las letras. */
function elMasParecido(nombre: string, candidatos: readonly string[]): string | null {
  const bajo = nombre.toLowerCase();
  let mejor: string | null = null;
  let mejorPuntos = 0;
  for (const c of candidatos) {
    const otro = c.toLowerCase();
    let comunes = 0;
    const usadas = new Array<boolean>(otro.length).fill(false);
    for (const letra of bajo) {
      const donde = otro.split('').findIndex((l, i) => !usadas[i] && l === letra);
      if (donde >= 0) {
        usadas[donde] = true;
        comunes += 1;
      }
    }
    const puntos = (2 * comunes) / (bajo.length + otro.length);
    if (puntos > mejorPuntos) {
      mejorPuntos = puntos;
      mejor = c;
    }
  }
  return mejorPuntos >= 0.6 ? mejor : null;
}

function revisarProyecto(arbol: ArbolHtml, op: Required<Pick<OpcionesPagina, 'hojas' | 'recursos' | 'paginas'>>, archivo: string): ProblemaWeb[] {
  const salida: ProblemaWeb[] = [];
  const nombresHojas = op.hojas.map((h) => h.nombre);

  if (arbol.hojasEnlazadas.length === 0 && arbol.estilosIncrustados.length === 0 && op.hojas.length > 0) {
    salida.push(
      problema('sin-enlace-css', 'aviso', 'esta página no enlaza ninguna hoja de estilo', {
        origen: archivo,
        linea: 0,
        pista: `dentro de <head> va: <link rel="stylesheet" href="${nombresHojas[0]}">`,
      }),
    );
  }

  recorrerElementos(arbol.raiz, (e) => {
    if (e.etiqueta === 'link' && (e.atributos.rel ?? '').toLowerCase() === 'stylesheet') {
      const destino = e.atributos.href ?? '';
      if (destino !== '' && !nombresHojas.includes(destino) && !esExterno(destino)) {
        const parecido = elMasParecido(destino, nombresHojas);
        salida.push(
          problema('sin-enlace-css', 'error', `no hay ningún archivo que se llame «${destino}»`, {
            origen: archivo,
            linea: e.linea,
            columna: e.col,
            pista: parecido !== null ? `el del proyecto se llama «${parecido}»` : nombresHojas.length > 0 ? `el proyecto tiene «${nombresHojas.join('», «')}»` : 'todavía no hay ningún archivo de estilo en el proyecto',
          }),
        );
      }
    }

    if (e.etiqueta === 'img') {
      const src = e.atributos.src;
      if (src !== undefined && src !== '' && !esExterno(src) && !op.recursos.some((r) => r.nombre === src)) {
        const parecido = elMasParecido(src, op.recursos.map((r) => r.nombre));
        salida.push(
          problema('imagen-que-no-existe', 'aviso', `no hay ninguna imagen que se llame «${src}»`, {
            origen: archivo,
            linea: e.linea,
            columna: e.col,
            pista:
              parecido !== null
                ? `la que hay se llama «${parecido}»`
                : op.recursos.length > 0
                  ? `las imágenes de esta práctica son «${op.recursos.map((r) => r.nombre).join('», «')}»`
                  : 'en esta práctica no hay imágenes para usar',
          }),
        );
      }
    }

    if (e.etiqueta === 'a') {
      const destino = e.atributos.href;
      if (destino !== undefined && destino !== '' && !esExterno(destino) && !destino.startsWith('#') && op.paginas.length > 0 && !op.paginas.includes(destino)) {
        const parecido = elMasParecido(destino, op.paginas);
        salida.push(
          problema('pagina-que-no-existe', 'aviso', `«${destino}» no es ninguna de las páginas del proyecto`, {
            origen: archivo,
            linea: e.linea,
            columna: e.col,
            pista: parecido !== null ? `¿querías decir «${parecido}»?` : `las páginas del proyecto son «${op.paginas.join('», «')}»`,
          }),
        );
      }
    }
  });

  if (elementosVisibles(arbol.cuerpo).length === 0 && textoVisible(arbol.cuerpo) === '') {
    salida.push(
      problema('pagina-vacia', 'aviso', 'esta página todavía no tiene nada dentro', {
        origen: archivo,
        linea: 0,
        pista: 'prueba con un título: <h1>Hola</h1>',
      }),
    );
  }

  return salida;
}

const CACHE = new Map<string, PaginaAnalizada>();
const TOPE_CACHE = 12;

/**
 * Analiza la página entera. Mismo proyecto y mismo ancho, **mismo objeto**.
 *
 * La identidad importa de verdad aquí: el editor reanaliza en cada tecla, y
 * sin esto la vista previa se repintaría entera al tocar el CSS aunque el
 * árbol de HTML no hubiera cambiado ni un nodo.
 */
export function analizarPagina(op: OpcionesPagina): PaginaAnalizada {
  const archivo = op.archivo ?? 'index.html';
  const hojas = op.hojas ?? [];
  const recursos = op.recursos ?? [];
  const paginas = op.paginas ?? [];
  const ancho = op.ancho ?? ANCHO_ESCRITORIO;

  const clave = `${ancho} ${archivo} ${op.html} ${hojas.map((h) => `${h.nombre}${h.texto}`).join('')} ${recursos.map((r) => r.nombre).join(',')} ${paginas.join(',')}`;
  const guardada = CACHE.get(clave);
  if (guardada) return guardada;

  const arbol = analizarHtml(op.html, archivo);

  /* Sólo cuentan las hojas que la página enlaza, y en ese orden: si el alumno
   * quita el `<link>`, el estilo tiene que dejar de verse. Ésa es la lección. */
  const usadas: HojaEstilos[] = [];
  for (const href of arbol.hojasEnlazadas) {
    const hoja = hojas.find((h) => h.nombre === href);
    if (hoja) usadas.push(analizarCss(hoja.texto, hoja.nombre));
  }
  for (const incrustado of arbol.estilosIncrustados) {
    usadas.push(analizarCss(incrustado.texto, archivo, incrustado.linea));
  }

  const cascada = resolverEstilos(arbol, usadas, ancho);

  const problemas: ProblemaWeb[] = [...arbol.problemas];
  for (const h of usadas) for (const p of h.problemas) problemas.push(p);
  for (const p of cascada.problemas) problemas.push(p);
  for (const p of revisarProyecto(arbol, { hojas, recursos, paginas }, archivo)) problemas.push(p);

  let errores = 0;
  let avisos = 0;
  for (const p of problemas) {
    if (p.severidad === 'error') errores += 1;
    else avisos += 1;
  }

  const pagina: PaginaAnalizada = {
    archivo,
    arbol,
    hojas: usadas,
    cascada,
    problemas,
    errores,
    avisos,
    ancho,
    titulo: arbol.titulo,
  };
  if (CACHE.size >= TOPE_CACHE) {
    const primera = CACHE.keys().next();
    if (!primera.done) CACHE.delete(primera.value);
  }
  CACHE.set(clave, pagina);
  return pagina;
}
