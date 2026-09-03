/**
 * Tecnia Web · `tiposWeb.ts` — los datos del estudio, sin una línea de React.
 *
 * Mismo reparto que en `codigo/ventana/`: datos puros → gancho de estado →
 * ventana tonta. Aquí viven los archivos, el guion de la clase y la
 * publicación, que son las tres cosas que una clase le pasa al armazón.
 *
 * ══ EL GUARDIÁN DEL JS, dicho entero y sin adornos ══════════════════════════
 *
 * El canon (§3, «la decisión que hay que tomar al abrirlo») pide decidir qué
 * pasa con el `js` de `n8-javascript-basico` **y escribir por qué**. Decidido:
 *
 *   **El JavaScript del alumno NO se ejecuta. Ni ahora ni con un permiso.**
 *
 * Tres razones, en orden de peso:
 *
 * 1. **Seguridad.** Ejecutar texto escrito por un niño en la misma página que
 *    la plataforma es darle acceso al DOM de la plataforma, a la sesión y a
 *    todo lo demás. Las dos maneras habituales de aislarlo —`<iframe>` y
 *    `eval`— están las dos descartadas por el encargo y por el canon.
 * 2. **Coste.** Ejecutarlo de verdad y bien pide un intérprete de JavaScript
 *    de subconjunto, con su léxico, su sintaxis, su máquina y sus errores por
 *    línea. Es la misma obra que el intérprete de Python de la tanda 1, que
 *    fue «la deuda mayor del plan entero». No cabe dentro de este armazón.
 * 3. **Honestidad.** Un «casi ejecuta» —cuatro instrucciones reconocidas con
 *    expresiones regulares— es peor que no ejecutar: el alumno escribe algo
 *    parecido, no pasa nada, y no hay error que lo explique.
 *
 * **Lo que sí hay, y sirve para dar la clase:**
 *
 * - El archivo `.js` se abre, se colorea y se guarda como cualquier otro.
 * - `<script>` y los atributos `onclick` se bloquean **con su explicación**,
 *   que es media clase de por qué el guion va en su propio archivo.
 * - La vista previa **avisa de los clics** (`onEvento`) y la clase decide qué
 *   pasa devolviendo `efectos`. Así `n8-javascript-basico` puede enseñar «el
 *   botón hace algo» de verdad, con el guion delante, aunque el que ejecuta
 *   sea el armazón y no el navegador.
 *
 * **Y lo que le falta, dicho para que se sepa:** con esto, las filas 49
 * (`n8-javascript-basico`) y 90 (`n10-proyecto-web-real`) quedan servidas a
 * medias. Cuando exista el intérprete, entra por este mismo hueco.
 */

import type { LineaPintada } from '../codigo/ventana/coloreado';
import type { NodoElemento } from './arbolHtml';
import type { PaginaAnalizada, RecursoWeb } from './pagina';

/* ── Los archivos ───────────────────────────────────────────────────────────*/

export type LenguajeArchivo = 'html' | 'css' | 'js';

export interface ArchivoWeb {
  /** «index.html», «estilo.css», «guion.js». Es la identidad del archivo. */
  nombre: string;
  lenguaje: LenguajeArchivo;
  texto: string;
  /** El archivo se ve y no se toca: la clase lo trae escrito. */
  soloLectura?: boolean;
}

export function lenguajeDe(nombre: string): LenguajeArchivo {
  if (nombre.toLowerCase().endsWith('.css')) return 'css';
  if (nombre.toLowerCase().endsWith('.js')) return 'js';
  return 'html';
}

/** Cambia el texto de un archivo **devolviendo la misma lista si no cambió nada.** */
export function conTexto(archivos: readonly ArchivoWeb[], nombre: string, texto: string): readonly ArchivoWeb[] {
  const i = archivos.findIndex((a) => a.nombre === nombre);
  if (i === -1) return archivos;
  if (archivos[i].texto === texto) return archivos;
  const copia = archivos.slice();
  copia[i] = { ...archivos[i], texto };
  return copia;
}

export function archivoDe(archivos: readonly ArchivoWeb[], nombre: string): ArchivoWeb | null {
  return archivos.find((a) => a.nombre === nombre) ?? null;
}

/* ── Las dos vistas ─────────────────────────────────────────────────────────*/

export type Vista = 'escritorio' | 'movil' | 'ambas';

/* ── Lo que la vista previa avisa, y lo que la clase contesta ────────────────*/

export type EventoPagina =
  | { tipo: 'clic'; etiqueta: string; id: string | null; texto: string; n: number }
  | { tipo: 'enlace'; destino: string; interno: boolean };

/**
 * Un cambio que la clase manda pintar encima de la página del alumno.
 *
 * Es el hueco por el que `n8-javascript-basico` enseña que «el botón hace
 * algo» sin ejecutar el guion del alumno. No es un motor de plantillas: el
 * armazón no decide ni uno solo de estos efectos, los pinta.
 */
export interface EfectoWeb {
  /** Un selector del subconjunto: «#mensaje», «.tarjeta», «p». */
  selector: string;
  cambio:
    | { tipo: 'texto'; texto: string }
    | { tipo: 'estilo'; propiedad: string; valor: string }
    | { tipo: 'oculto'; oculto: boolean };
}

/* ── El guion de la clase ───────────────────────────────────────────────────*/

export interface SenalWeb {
  /** El archivo donde mirar, si el encargo es de un archivo en concreto. */
  archivo?: string;
  linea?: number;
  control?: 'editor' | 'vista' | 'movil' | 'inspector' | 'problemas' | 'publicar';
}

/**
 * Cómo se da por hecho un encargo. **La corrección la escribe la clase**: el
 * armazón sólo llama al predicado y no sabe qué pregunta (canon, prueba 3).
 *
 * Son dos predicados distintos porque son dos preguntas distintas y las dos se
 * hacen. `pagina` mira **el resultado** —¿hay un `<h1>`? ¿el fondo quedó
 * azul?— y para eso recibe la página ya analizada, con su árbol y sus estilos.
 * `codigo` mira **lo que el alumno escribió**, tal cual, con sus comentarios y
 * su sangría; hay encargos que sólo se pueden preguntar así («pon un
 * comentario explicando qué hace esta regla»).
 */
export type LogroWeb =
  | { tipo: 'pagina'; comprueba: (pagina: PaginaAnalizada) => boolean }
  | { tipo: 'codigo'; comprueba: (archivos: readonly ArchivoWeb[]) => boolean }
  | { tipo: 'eleccion'; opciones: string[]; correcta: number }
  | { tipo: 'confirma'; boton: string };

export interface PasoWeb {
  id: string;
  titulo: string;
  /** Qué hay que hacer, en una o dos frases y en segunda persona. */
  instruccion: string;
  /** Aparece sola tras el primer intento fallido. */
  pista: string;
  senal?: SenalWeb;
  logro: LogroWeb;
  /** La frase que se lleva el alumno al acertar. Es la clase, en una línea. */
  aprendido: string;
}

export interface GuionWeb {
  pasos: PasoWeb[];
  cierre?: string;
}

/* ── Publicar (filas 20 y 91) ───────────────────────────────────────────────*/

export interface PasoPublicar {
  id: string;
  etiqueta: string;
  /** Qué es eso, en una frase. Lo escribe la clase. */
  detalle: string;
}

export interface Publicacion {
  /** «sofi.tecnia.mx» — de práctica, no existe. */
  dominio: string;
  pasos: readonly PasoPublicar[];
}

/* ── Herramientas, avisos y resumen ─────────────────────────────────────────*/

export interface HerramientaWeb {
  id: string;
  etiqueta: string;
  glifo?: string;
  onClick: () => void;
  deshabilitada?: boolean;
  principal?: boolean;
  activa?: boolean;
}

export interface AvisoWeb {
  /** Sube en cada aviso aunque el texto se repita: si no, React puede no repintar. */
  id: number;
  texto: string;
  tono: 'aviso' | 'candado';
}

export interface ResumenWeb {
  encargos: number;
  hechos: number;
  tropiezos: number;
  segundos: number;
}

/* ── Lo que la ventana enseña, ya masticado ─────────────────────────────────*/

export interface EncargoWeb {
  paso: PasoWeb;
  indice: number;
  total: number;
  hecho: boolean;
  pistaVisible: boolean;
  eleccion: number | null;
}

export interface VistaDeLaPagina {
  /** Cómo se llama esto en la pestaña del navegador simulado. */
  nombre: string;
  ancho: number;
  pagina: PaginaAnalizada;
}

export type { LineaPintada, NodoElemento, PaginaAnalizada, RecursoWeb };
