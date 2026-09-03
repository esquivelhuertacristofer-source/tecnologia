'use client';

import { createElement, useCallback, useMemo, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { estiloReact, type EstiloResuelto } from './cascada';
import { buscar } from './consulta';
import { ETIQUETAS } from './subconjunto';
import type { NodoDocumento, NodoElemento, NodoWeb } from './arbolHtml';
import type { PaginaAnalizada, RecursoWeb } from './pagina';
import type { EfectoWeb, EventoPagina } from './tiposWeb';

/**
 * TECNIA WEB · LA VISTA PREVIA
 *
 * ══ LA DECISIÓN MÁS IMPORTANTE DEL ARMAZÓN, Y POR QUÉ ES ÉSTA ══════════════
 *
 * La página del alumno se **analiza a un árbol propio y se pinta con React,
 * nodo a nodo, con lista blanca de etiquetas y de atributos**. Ni
 * `dangerouslySetInnerHTML` ni `<iframe>`.
 *
 * Las tres razones, en orden:
 *
 * 1. **Seguridad.** Esto es una plataforma para niños y el HTML del alumno es
 *    entrada no fiable. `dangerouslySetInnerHTML` mete lo que sea en el DOM de
 *    la plataforma; un `<iframe>` con `srcdoc` lo aísla peor de lo que parece
 *    y encima abre la puerta a que un día alguien cargue algo de fuera. El
 *    armazón de navegador rechazó hoy el mismo camino por lo mismo.
 * 2. **Se tiene que poder preguntar.** La actividad necesita saber «¿puso un
 *    título?», «¿la imagen tiene texto alternativo?», «¿el botón es un
 *    `<button>` de verdad?». Con un árbol de datos eso es `existe(p, 'h1')`.
 *    Con marcado inyectado hay que rebuscar en el DOM a ciegas, y con un
 *    `<iframe>` ni eso.
 * 3. **Los errores son material de clase.** Analizar es lo único que permite
 *    decir *dónde* está el fallo: la línea, la columna y la pista. Un
 *    `<iframe>` se traga la etiqueta sin cerrar en silencio, que es
 *    exactamente lo que un alumno NO necesita.
 *
 * ══ Lo que se ve es lo que se resolvió ═════════════════════════════════════
 *
 * Ni una cadena escrita por el alumno llega al navegador como código: los
 * estilos llegan como **objeto** (`style={…}`), con cada valor ya validado
 * contra la tabla del subconjunto, y las etiquetas y los atributos que no
 * están en la lista blanca no se pintan.
 *
 * Tres detalles que evitan que la página del alumno se mezcle con la
 * plataforma:
 *   · los `id` y las `class` se pintan con prefijo (`wpv-id-`, `wpv-c-`), así
 *     que un `class="flex"` del alumno no engancha con el CSS de la
 *     plataforma y un `id` repetido no colisiona con el de la aplicación;
 *   · `<html>` y `<body>` se pintan como cajas, no como esas etiquetas, que
 *     dentro de otra página son marcado inválido;
 *   · las imágenes salen de `recursos` —lo que la clase puso a mano—, así que
 *     **no hay una sola petición de red**.
 */

export interface VistaPaginaProps {
  pagina: PaginaAnalizada;
  /** Las imágenes de la práctica. Sin esto, una imagen sale como hueco con su nombre. */
  recursos?: readonly RecursoWeb[];
  /** Lo que la clase manda pintar encima (el hueco del guion; ver `tiposWeb.ts`). */
  efectos?: readonly EfectoWeb[];
  onEvento?: (evento: EventoPagina) => void;
  /** El nodo señalado por el inspector. */
  seleccion?: number | null;
  onSeleccionar?: (n: number) => void;
  /** Se pinta con este ancho declarado. */
  ancho?: number;
  className?: string;
}

/** Lo que un efecto de la clase cambia en un nodo. */
interface Encima {
  texto?: string;
  estilo?: Record<string, string>;
  oculto?: boolean;
}

function encimaDe(pagina: PaginaAnalizada, efectos: readonly EfectoWeb[] | undefined): Map<number, Encima> {
  const mapa = new Map<number, Encima>();
  if (!efectos || efectos.length === 0) return mapa;
  for (const efecto of efectos) {
    for (const nodo of buscar(pagina, efecto.selector)) {
      const actual = mapa.get(nodo.n) ?? {};
      if (efecto.cambio.tipo === 'texto') actual.texto = efecto.cambio.texto;
      else if (efecto.cambio.tipo === 'oculto') actual.oculto = efecto.cambio.oculto;
      else actual.estilo = { ...actual.estilo, [efecto.cambio.propiedad]: efecto.cambio.valor };
      mapa.set(nodo.n, actual);
    }
  }
  return mapa;
}

export function VistaPagina({ pagina, recursos, efectos, onEvento, seleccion = null, onSeleccionar, ancho, className }: VistaPaginaProps) {
  /* El ratón encima es estado del navegador simulado, no de la página: por eso
   * vive aquí y no en el análisis. `:hover` se resuelve en la cascada y aquí
   * sólo se elige cuál de los dos juegos de propiedades se pinta. */
  const [encimaDelRaton, setEncimaDelRaton] = useState<number | null>(null);
  const cambios = useMemo(() => encimaDe(pagina, efectos), [pagina, efectos]);

  const alTocar = useCallback(
    (ev: MouseEvent, nodo: NodoElemento) => {
      ev.preventDefault();
      ev.stopPropagation();
      onSeleccionar?.(nodo.n);
      if (nodo.etiqueta === 'a') {
        const destino = nodo.atributos.href ?? '';
        onEvento?.({ tipo: 'enlace', destino, interno: destino !== '' && !/^(https?:)?\/\//i.test(destino) });
        return;
      }
      onEvento?.({
        tipo: 'clic',
        etiqueta: nodo.etiqueta,
        id: nodo.atributos.id ?? null,
        texto: textoLlano(nodo),
        n: nodo.n,
      });
    },
    [onEvento, onSeleccionar],
  );

  const pintar = (nodo: NodoWeb): ReactNode => {
    if (nodo.tipo === 'comentario') return null;
    if (nodo.tipo === 'texto') return nodo.texto === '' ? null : nodo.texto;

    const def = ETIQUETAS[nodo.etiqueta];
    if (def === undefined || def.cabecera === true) return null;
    const cambio = cambios.get(nodo.n);
    if (cambio?.oculto === true) return null;

    const resuelto: EstiloResuelto | undefined = pagina.cascada.porNodo.get(nodo.n);
    const base = encimaDelRaton === nodo.n && resuelto?.hover ? resuelto.hover : (resuelto?.propiedades ?? {});
    const estilo: CSSProperties = estiloReact(cambio?.estilo ? { ...base, ...cambio.estilo } : base);

    /* La clase se arma a mano y no con un `array.join`: son 300 elementos en
     * cada tecla, y lo normal —una etiqueta sin `class`— sale sin partir ni
     * unir nada. Medido: ver «[criterio 3] pintar» en la prueba. */
    let clase = 'wpv-n';
    if (seleccion === nodo.n) clase += ' es-elegido';
    const suyas = nodo.atributos.class;
    if (suyas !== undefined) {
      for (const c of suyas.trim().split(/\s+/)) if (c !== '') clase += ` wpv-c-${c}`;
    }
    const clases = clase;

    const props: Record<string, unknown> = {
      key: nodo.n,
      className: clase,
      style: estilo,
      /* `data-n` y nada más: la etiqueta ya la dice `tagName`, y cada atributo
       * de más son 300 escrituras en el DOM por tecla. La única excepción son
       * las dos que se pintan como caja (`html` y `body`), que sí necesitan
       * decir qué eran. */
      'data-n': nodo.n,
    };
    if (nodo.etiqueta === 'html' || nodo.etiqueta === 'body') props['data-etiqueta'] = nodo.etiqueta;
    /* Sin nadie escuchando no se cuelga un manejador por elemento: una vista
     * previa de sólo mirar no tiene por qué pagar 300 cierres. */
    if (onSeleccionar || onEvento) props.onClick = (ev: MouseEvent) => alTocar(ev, nodo);
    if (resuelto?.hover) {
      props.onMouseOver = (ev: MouseEvent) => {
        ev.stopPropagation();
        setEncimaDelRaton(nodo.n);
      };
      props.onMouseOut = () => setEncimaDelRaton(null);
    }
    if (nodo.atributos.id) props.id = `wpv-id-${nodo.atributos.id}`;
    if (nodo.atributos.title) props.title = nodo.atributos.title;
    if (nodo.atributos.lang) props.lang = nodo.atributos.lang;

    /* `<html>` y `<body>` dentro de otra página son marcado inválido: se
     * pintan como cajas y se marcan con `data-etiqueta` para que una prueba
     * (y el inspector) sepan qué eran. */
    const etiquetaReal = nodo.etiqueta === 'html' || nodo.etiqueta === 'body' ? 'div' : nodo.etiqueta;

    switch (nodo.etiqueta) {
      case 'img': {
        const nombre = nodo.atributos.src ?? '';
        const recurso = recursos?.find((r) => r.nombre === nombre);
        const alt = nodo.atributos.alt ?? '';
        if (nodo.atributos.width) props.width = nodo.atributos.width;
        if (nodo.atributos.height) props.height = nodo.atributos.height;
        if (!recurso) {
          return createElement(
            'span',
            { ...props, className: `${clases} wpv-img-rota`, role: 'img', 'aria-label': alt === '' ? `imagen que falta: ${nombre}` : alt },
            `🖼 ${nombre === '' ? 'sin src' : nombre}`,
          );
        }
        props.src = recurso.url;
        props.alt = alt;
        /* La vista previa NO pasa por el optimizador de imágenes: lo que se
         * pinta es la página de un alumno, y `next/image` pide tamaños y
         * dominios declarados que aquí no existen. Sale por `createElement` y
         * no como `<img />`, así que la regla que lo prohíbe ni se entera —
         * pero el motivo queda escrito, que es lo que importa. */
        return createElement('img', props);
      }
      case 'a': {
        props.href = nodo.atributos.href ?? undefined;
        if (nodo.atributos.target) props.target = nodo.atributos.target;
        if (nodo.atributos.rel) props.rel = nodo.atributos.rel;
        break;
      }
      case 'input': {
        props.type = nodo.atributos.type ?? 'text';
        if (nodo.atributos.name) props.name = nodo.atributos.name;
        if (nodo.atributos.placeholder) props.placeholder = nodo.atributos.placeholder;
        if (nodo.atributos.value !== undefined) props.defaultValue = nodo.atributos.value;
        if (nodo.atributos.checked !== undefined) props.defaultChecked = true;
        if (nodo.atributos.required !== undefined) props.required = true;
        if (nodo.atributos.disabled !== undefined) props.disabled = true;
        break;
      }
      case 'label': {
        if (nodo.atributos.for) props.htmlFor = `wpv-id-${nodo.atributos.for}`;
        break;
      }
      case 'button': {
        /* Siempre `button`: un `submit` de verdad recargaría la plataforma. */
        props.type = 'button';
        break;
      }
      case 'form': {
        props.onSubmit = (ev: MouseEvent) => ev.preventDefault();
        break;
      }
      case 'th':
      case 'td': {
        if (nodo.atributos.colspan) props.colSpan = Number(nodo.atributos.colspan) || undefined;
        if (nodo.atributos.rowspan) props.rowSpan = Number(nodo.atributos.rowspan) || undefined;
        if (nodo.atributos.scope) props.scope = nodo.atributos.scope;
        break;
      }
      case 'ol': {
        if (nodo.atributos.start) props.start = Number(nodo.atributos.start) || undefined;
        break;
      }
      case 'option': {
        if (nodo.atributos.value !== undefined) props.value = nodo.atributos.value;
        break;
      }
      case 'textarea': {
        props.defaultValue = textoLlano(nodo);
        if (nodo.atributos.placeholder) props.placeholder = nodo.atributos.placeholder;
        if (nodo.atributos.rows) props.rows = Number(nodo.atributos.rows) || undefined;
        return createElement('textarea', props);
      }
      default:
        break;
    }

    if (def.vacia === true) return createElement(etiquetaReal, props);
    if (cambio?.texto !== undefined) return createElement(etiquetaReal, props, cambio.texto);

    const hijos: ReactNode[] = [];
    for (const h of nodo.hijos) {
      const pintado = pintar(h);
      if (pintado !== null) hijos.push(pintado);
    }
    return createElement(etiquetaReal, props, ...hijos);
  };

  const raiz: NodoDocumento | NodoElemento = pagina.arbol.cuerpo;
  const hijos: ReactNode[] = [];
  for (const h of raiz.hijos) {
    const pintado = pintar(h);
    if (pintado !== null) hijos.push(pintado);
  }

  /*
   * «Vacía» es lo que NO PINTA NADA, no lo que no tiene hijos.
   *
   * Un `<body>` con un comentario y dos saltos de línea —la plantilla exacta
   * de cualquier clase de «llena tú el cuerpo», que es la 19, la 35 y la 50—
   * dejaba hijos: el comentario se va, pero los saltos de línea son nodos de
   * texto y llegaban aquí como cadenas en blanco. Resultado: el analizador
   * avisaba «esta página todavía no tiene nada dentro» y el lienzo, que es
   * donde el alumno está mirando, no decía nada. Lo cazó la parada 2 de N6
   * (§51.2). Los espacios entre elementos en línea siguen pintándose: lo que
   * se mira es si TODO lo que queda es blanco.
   */
  const enBlanco = hijos.every((h) => typeof h === 'string' && h.trim() === '');

  return (
    <div className={`wpv${className ? ` ${className}` : ''}`} data-testid="wpv" style={ancho === undefined ? undefined : { width: `${ancho}px` }}>
      <div className="wpv-lienzo" data-testid="wpv-lienzo">
        {enBlanco ? <p className="wpv-vacia">Tu página todavía no tiene nada dentro. Escribe algo en el editor y aparecerá aquí.</p> : hijos}
      </div>
    </div>
  );
}

function textoLlano(nodo: NodoWeb): string {
  if (nodo.tipo === 'texto') return nodo.texto;
  if (nodo.tipo === 'comentario') return '';
  let salida = '';
  for (const h of nodo.hijos) salida += textoLlano(h);
  return salida.replace(/\s+/g, ' ').trim();
}

export default VistaPagina;
