/**
 * Lógica y contenido de N2·U5 «Escribo y dibujo» (documento §13). Sin JSX ni
 * estado de React: tarjetas de palabra, retos de tamaño/color y escenas de
 * dibujo por puntos. Compartido por las 3 paradas (La máquina de oraciones,
 * El ropero de letras, La prensa de cuentos).
 */

export type Tamano = 'chico' | 'grande';
export type ColorId = 'rojo' | 'azul' | 'verde' | 'amarillo';

export const TAMANOS: Record<Tamano, { nombre: string; escala: number }> = {
  chico: { nombre: 'Chico', escala: 0.62 },
  grande: { nombre: 'Grande', escala: 1.55 },
};

/** Mismos 4 tonos y tal cual los mismos hex que el frasco de pintura de N1 (paleta única de la plataforma). */
export const COLORES: Record<ColorId, { nombre: string; hex: string; hondo: string }> = {
  rojo: { nombre: 'Rojo', hex: '#ff6d7c', hondo: '#d63a52' },
  azul: { nombre: 'Azul', hex: '#32a8ff', hondo: '#1e63c4' },
  amarillo: { nombre: 'Amarillo', hex: '#ffd25a', hondo: '#d99a00' },
  verde: { nombre: 'Verde', hex: '#58e29c', hondo: '#1e8a5a' },
};

/* ═══════════════════════ Parada 1 · La máquina de oraciones ═══════════════════════ */

export interface OracionArrastre {
  id: string;
  /** Orden correcto de las tarjetas de palabra; la máquina agrega mayúscula y punto al terminar. */
  palabras: string[];
}

// Ronda 1 · «Ordena las palabras» — arrastra las tarjetas a la tira, en orden.
export const ORACIONES_PARADA1_R1: OracionArrastre[] = [
  { id: 'o1', palabras: ['bit', 'programa', 'la', 'compu'] },
  { id: 'o2', palabras: ['yo', 'escribo', 'mi', 'nombre'] },
  { id: 'o3', palabras: ['la', 'compu', 'tiene', 'teclas'] },
  { id: 'o4', palabras: ['hoy', 'dibujo', 'un', 'sol'] },
];

export interface RetoEscritura {
  id: string;
  /** Minúsculas y sin acentos: son justo las teclas que existen en TecladoMapa. */
  texto: string;
}

// Ronda 2 · «Escríbela tú» — teclea letra a letra y luego coloca mayúscula y punto.
export const RETOS_PARADA1_R2: RetoEscritura[] = [
  { id: 'r1', texto: 'la compu es mi amiga' },
  { id: 'r2', texto: 'yo escribo con mis manos' },
  { id: 'r3', texto: 'el punto cierra la idea' },
  { id: 'r4', texto: 'bit y yo somos amigos' },
];

/* ═══════════════════════ Parada 2 · El ropero de letras ═══════════════════════ */

export interface RetoTamano {
  id: string;
  palabra: string;
  tamano: Tamano;
}

// Ronda 1 · «Al tamaño que pide Bit» — gira el dial de tamaño.
export const RETOS_PARADA2_R1: RetoTamano[] = [
  { id: 't1', palabra: 'TÍTULO', tamano: 'grande' },
  { id: 't2', palabra: 'secreto', tamano: 'chico' },
  { id: 't3', palabra: 'GRITO', tamano: 'grande' },
  { id: 't4', palabra: 'susurro', tamano: 'chico' },
];

export interface RetoEstilo {
  id: string;
  palabra: string;
  color: ColorId;
  /** A veces Bit combina tamaño y color en el mismo pedido. */
  tamano?: Tamano;
}

// Ronda 2 · «Al color que pide Bit» — cuelga la palabra en el perchero de colores.
export const RETOS_PARADA2_R2: RetoEstilo[] = [
  { id: 'c1', palabra: 'peligro', color: 'rojo', tamano: 'grande' },
  { id: 'c2', palabra: 'cielo', color: 'azul' },
  { id: 'c3', palabra: 'planta', color: 'verde' },
  { id: 'c4', palabra: 'sol', color: 'amarillo', tamano: 'grande' },
];

/* ═══════════════════════ Parada 3 · La prensa de cuentos ═══════════════════════ */

export type FormaDibujo = 'circulo' | 'triangulo' | 'rect';

export interface ZonaDibujo {
  id: string;
  forma: FormaDibujo;
  color: ColorId;
  /** Posición y tamaño en % del mini-lienzo (0-100), no en píxeles. */
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface EscenaDibujo {
  /** Gradiente CSS de fondo del mini-lienzo (cielo, pasto, etc.). */
  fondo: string;
  zonas: ZonaDibujo[];
}

export interface PaginaCuento {
  id: string;
  /** Oración de la página, ya partida en tarjetas de palabra (mismo mecanismo de arrastre que Parada 1). */
  palabras: string[];
  escena: EscenaDibujo;
}

const CIELO_DIA = 'linear-gradient(180deg, #7ec9ff 0%, #b8e3ff 55%, #eaf6ff 100%)';

// Ronda 1 · «Escribe y dibuja tus páginas» — una oración + un dibujo por página.
export const PAGINAS_PARADA3_R1: PaginaCuento[] = [
  {
    id: 'p1',
    palabras: ['un', 'sol', 'grande'],
    escena: {
      fondo: CIELO_DIA,
      zonas: [{ id: 'sol', forma: 'circulo', color: 'amarillo', left: 50, top: 20, width: 34, height: 34 }],
    },
  },
  {
    id: 'p2',
    palabras: ['una', 'casa', 'azul'],
    escena: {
      fondo: CIELO_DIA,
      zonas: [{ id: 'casa', forma: 'rect', color: 'azul', left: 27, top: 58, width: 46, height: 34 }],
    },
  },
];

export interface PortadaCuento {
  /** Orden correcto del título. */
  tituloPalabras: string[];
  /** Tarjetas de más que aparecen entre las opciones (distractores). */
  distractores: string[];
  escena: EscenaDibujo;
}

// Ronda 2 · «Arma tu portada» — título + dibujo de portada (repite el sol y la casa ya coloreados).
export const PORTADA_PARADA3_R2: PortadaCuento = {
  tituloPalabras: ['mi', 'primer', 'cuento'],
  distractores: ['tu'],
  escena: {
    fondo: CIELO_DIA,
    zonas: [
      { id: 'sol', forma: 'circulo', color: 'amarillo', left: 50, top: 14, width: 26, height: 26 },
      { id: 'casa', forma: 'rect', color: 'azul', left: 27, top: 58, width: 46, height: 34 },
    ],
  },
};
