/**
 * TECNIA IMAGINA · el generador de imágenes, sin React (§69.3, 6-oct-2026).
 *
 * La imagen sale de la PETICIÓN, no de un guion: lo que no se pide lo decide
 * el generador, lo que se prohíbe casi nunca aparece pero a veces se cuela, y
 * la misma petición dos veces no da lo mismo porque cada generación lleva una
 * semilla nueva. Determinista por semilla: las pruebas y las capturas se
 * pueden repetir.
 *
 * Pieza compartida: la usa `n6-crea-con-ia` y la podrá usar
 * `n8-genera-con-ia`. No sabe qué es un acierto: eso lo decide la clase con
 * `cumple(imagen, requisitos)`.
 */

export type Tema = 'volcan' | 'cohete' | 'planetas';
export type Estilo = 'plastilina' | 'noche' | 'acuarela';
export type Formato = 'vertical' | 'horizontal';
/** Lo que se cuela en una imagen si no se prohíbe (y a veces aunque se prohíba). */
export type Elemento = 'texto' | 'persona' | 'marca';

export const TEMAS: Record<Tema, { etiqueta: string; glifo: string }> = {
  volcan: { etiqueta: 'Un volcán de bicarbonato', glifo: '🌋' },
  cohete: { etiqueta: 'Un cohete de agua', glifo: '🚀' },
  planetas: { etiqueta: 'Los planetas del sistema solar', glifo: '🪐' },
};
export const ESTILOS: Record<Estilo, { etiqueta: string; fondo: string }> = {
  plastilina: { etiqueta: 'Dibujo de plastilina', fondo: 'radial-gradient(circle at 30% 25%, #fdba74, #ea580c 55%, #7c2d12)' },
  noche: { etiqueta: 'Foto de noche', fondo: 'radial-gradient(circle at 70% 20%, #1e3a8a, #0b1026 60%, #020617)' },
  acuarela: { etiqueta: 'Acuarela', fondo: 'linear-gradient(160deg, #a5f3fc, #c4b5fd 50%, #fbcfe8)' },
};
export const FORMATOS: Record<Formato, { etiqueta: string; proporcion: number }> = {
  vertical: { etiqueta: 'Fondo de un cartel vertical', proporcion: 3 / 4 },
  horizontal: { etiqueta: 'Fondo de una pantalla', proporcion: 16 / 9 },
};
export const ELEMENTOS: Record<Elemento, { prohibicion: string }> = {
  texto: { prohibicion: 'Sin texto dentro' },
  persona: { prohibicion: 'Sin personas' },
  marca: { prohibicion: 'Sin marcas de refrescos' },
};

export interface Peticion {
  tema: Tema | null;
  estilo: Estilo | null;
  formato: Formato | null;
  prohibidos: Elemento[];
}

export const PETICION_VACIA: Peticion = { tema: null, estilo: null, formato: null, prohibidos: [] };

export interface ImagenGenerada {
  id: string;
  tema: Tema;
  estilo: Estilo;
  formato: Formato;
  /** Lo que se coló. Vacío = una imagen limpia. */
  elementos: Elemento[];
  /**
   * Dónde cae el tema y a qué tamaño. No es un requisito de nada: existe para
   * que dos imágenes con las mismas piezas no se vean iguales, como en un
   * generador de verdad. `x`/`y` en % del lienzo, `escala` 0,75–1,15, `giro` en grados.
   */
  encuadre: { x: number; y: number; escala: number; giro: number };
}

export interface Tanda {
  /** Número de generación (1, 2, 3…): forma parte de la semilla. */
  numero: number;
  peticion: Peticion;
  /** La petición en texto, tal como la ve el alumno (y la que se firma). */
  texto: string;
  imagenes: ImagenGenerada[];
}

/** Probabilidades por imagen (§69.3). */
export const P_SIN_PEDIR = 0.4;
export const P_SE_CUELA = 0.15;

const ORDEN_ELEMENTOS: Elemento[] = ['texto', 'persona', 'marca'];

/** La petición en una línea legible, en un orden fijo: dos peticiones iguales se escriben igual. */
export function textoDePeticion(p: Peticion): string {
  const trozos: string[] = [];
  if (p.tema) trozos.push(TEMAS[p.tema].etiqueta);
  if (p.estilo) trozos.push(ESTILOS[p.estilo].etiqueta);
  if (p.formato) trozos.push(FORMATOS[p.formato].etiqueta);
  for (const e of ORDEN_ELEMENTOS) if (p.prohibidos.includes(e)) trozos.push(ELEMENTOS[e].prohibicion);
  return trozos.join(' · ');
}

/** Cuántas piezas lleva la petición (cada prohibición cuenta como una). */
export function piezasDe(p: Peticion): number {
  return (p.tema ? 1 : 0) + (p.estilo ? 1 : 0) + (p.formato ? 1 : 0) + p.prohibidos.length;
}

export function mismaPeticion(a: Peticion, b: Peticion): boolean {
  return textoDePeticion(a) === textoDePeticion(b);
}

/** Genera tres imágenes. `numero` cambia la semilla: la misma petición con otro número da otra tanda. */
export function generar(peticion: Peticion, numero: number): Tanda {
  const texto = textoDePeticion(peticion);
  const azar = semillero(`${texto}#${numero}`);
  const elegir = <T>(lista: readonly T[]) => lista[Math.floor(azar() * lista.length)];
  const temas = Object.keys(TEMAS) as Tema[];
  const estilos = Object.keys(ESTILOS) as Estilo[];
  const formatos = Object.keys(FORMATOS) as Formato[];

  // Lo que no se pide se tiene que VER decidido por la máquina: si el estilo no
  // se pide, las tres salen en estilos distintos; si el formato no se pide, no
  // salen las tres con el mismo (medido el 6-oct-2026: con «volcán» a secas, la
  // primera generación de casi todo el grupo salía en plastilina y vertical, y
  // la lección del encargo 1 no se veía).
  const giroEstilo = Math.floor(azar() * estilos.length);
  const formatosSueltos = [elegir(formatos), elegir(formatos), elegir(formatos)];
  if (formatosSueltos.every((f) => f === formatosSueltos[0])) formatosSueltos[2] = formatos.find((f) => f !== formatosSueltos[0])!;

  const una = (i: number, sinFugas = false): ImagenGenerada => {
    const tema = peticion.tema ?? elegir(temas);
    const estilo = peticion.estilo ?? estilos[(giroEstilo + i) % estilos.length];
    const formato = peticion.formato ?? formatosSueltos[i];
    const elementos = ORDEN_ELEMENTOS.filter((e) => {
      const tirada = azar();
      if (peticion.prohibidos.includes(e)) return !sinFugas && tirada < P_SE_CUELA;
      return tirada < P_SIN_PEDIR;
    });
    const encuadre = {
      x: Math.round(30 + azar() * 40),
      y: Math.round(32 + azar() * 36),
      escala: Math.round((0.75 + azar() * 0.4) * 100) / 100,
      giro: Math.round(-14 + azar() * 28),
    };
    return { id: `g${numero}-${i}`, tema, estilo, formato, elementos, encuadre };
  };

  const imagenes = [una(0), una(1), una(2)];
  // Una petición que lo dice todo deja siempre al menos una imagen buena.
  const completa = peticion.tema && peticion.estilo && peticion.formato;
  if (completa) {
    const buena = imagenes.some((im) => im.elementos.every((e) => !peticion.prohibidos.includes(e)));
    if (!buena) imagenes[0] = una(0, true);
  }
  return { numero, peticion, texto, imagenes };
}

/** Lo que un encargo exige de la imagen. */
export interface Requisitos {
  tema: Tema;
  estilo: Estilo;
  formato: Formato;
  sin: Elemento[];
}

/** Qué le falta a una imagen para cumplir. Vacío = cumple. Frases para el alumno. */
export function queLeFalta(im: ImagenGenerada, r: Requisitos): string[] {
  const faltas: string[] = [];
  if (im.tema !== r.tema) faltas.push(`no es ${TEMAS[r.tema].etiqueta.toLowerCase()}`);
  if (im.estilo !== r.estilo) faltas.push(`no está hecha como ${ESTILOS[r.estilo].etiqueta.toLowerCase()}`);
  if (im.formato !== r.formato) faltas.push(r.formato === 'vertical' ? 'no es vertical' : 'no es horizontal');
  if (r.sin.includes('texto') && im.elementos.includes('texto')) faltas.push('trae letras dentro');
  if (r.sin.includes('persona') && im.elementos.includes('persona')) faltas.push('sale una persona');
  if (r.sin.includes('marca') && im.elementos.includes('marca')) faltas.push('sale una marca de refresco');
  return faltas;
}

export const cumple = (im: ImagenGenerada, r: Requisitos) => queLeFalta(im, r).length === 0;

/** ¿La petición pide todo lo que exigen los requisitos? */
export function peticionCubre(p: Peticion, r: Requisitos): boolean {
  return p.tema === r.tema && p.estilo === r.estilo && p.formato === r.formato && r.sin.every((e) => p.prohibidos.includes(e));
}

/** mulberry32 sobre un hash FNV-1a del texto: estable entre navegadores. */
function semillero(texto: string): () => number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  let a = h || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
