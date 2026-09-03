/**
 * Contenido de las fases 2 y 3 de "Conoce las partes" (N1·U1) — doc §32.1.
 *
 * TODAS las cadenas de este archivo son canon del DOCUMENTO-MAESTRO-PEDAGOGICO
 * (§32.1). No se parafrasean al pintarlas: la UI las renderiza tal cual, igual
 * que el guion del video es exactamente lo que dicta el TTS. Si una frase debe
 * cambiar, cambia primero en el documento.
 *
 * Regla de feedback del ESTÁNDAR ROBUSTO v2: "Inténtalo de nuevo" está
 * PROHIBIDO. Cada error tiene una respuesta que nombra qué hace la parte que el
 * alumno eligió y qué se necesitaba en su lugar. Hay dos capas:
 *
 *   1. Regla compuesta — se arma con los datos de la parte elegida y del
 *      encargo/avería, así los 6×6 = 36 pares posibles tienen texto propio sin
 *      escribir 36 frases a mano.
 *   2. Escritos a mano — los pares que el documento redacta uno por uno porque
 *      son EL malentendido de la lección (gabinete↔monitor, quién protege a
 *      quién). Éstos ganan sobre la regla.
 */

export type ParteId = 'monitor' | 'teclado' | 'raton' | 'gabinete' | 'impresora' | 'regulador';

/** Orden de lectura de la mesa (el mismo del video y de las fichas de entrada). */
export const PARTES_ORDEN: ParteId[] = ['monitor', 'teclado', 'raton', 'gabinete', 'impresora', 'regulador'];

export interface ParteMesa {
  id: ParteId;
  nombre: string;
  /** Trabajo en una línea; es lo que se rotula en el cierre y en el aria-label. */
  trabajo: string;
  /** "El teclado sirve para ESCRIBIR." — infinitivo, para la regla compuesta. */
  sirvePara: string;
  /** "El teclado ESCRIBE LAS LETRAS." — 3ª persona, para la regla de averías. */
  hace: string;
  /** Emoji de respaldo HTML (sin WebGL) y de la pastilla de nombre. */
  emoji: string;
}

export const PARTES: Record<ParteId, ParteMesa> = {
  monitor: {
    id: 'monitor',
    nombre: 'Monitor',
    trabajo: 'La parte que muestra',
    sirvePara: 'mostrar',
    hace: 'muestra en la pantalla',
    emoji: '🖥️',
  },
  teclado: {
    id: 'teclado',
    nombre: 'Teclado',
    trabajo: 'La parte con la que escribimos',
    sirvePara: 'escribir',
    hace: 'escribe las letras',
    emoji: '⌨️',
  },
  raton: {
    id: 'raton',
    nombre: 'Ratón',
    trabajo: 'La parte que señala',
    sirvePara: 'señalar',
    hace: 'señala en la pantalla',
    emoji: '🖱️',
  },
  gabinete: {
    id: 'gabinete',
    nombre: 'Gabinete',
    trabajo: 'La parte que piensa',
    sirvePara: 'pensar',
    hace: 'piensa por dentro',
    emoji: '🗄️',
  },
  impresora: {
    id: 'impresora',
    nombre: 'Impresora',
    trabajo: 'La parte que copia en papel',
    sirvePara: 'copiar en papel',
    hace: 'copia en papel',
    emoji: '🖨️',
  },
  regulador: {
    id: 'regulador',
    nombre: 'Regulador',
    trabajo: 'La parte que protege',
    sirvePara: 'proteger de la corriente',
    hace: 'protege de la corriente',
    emoji: '🔌',
  },
};

/** "Monitor. La parte que muestra" — mismo aria-label en 3D y en el respaldo. */
export function etiquetaParte(id: ParteId): string {
  const p = PARTES[id];
  return `${p.nombre}. ${p.trabajo}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// FASE 2 · APLICA — "El trabajo de cada parte" (6 encargos)
// ─────────────────────────────────────────────────────────────────────────────

export interface Encargo {
  id: string;
  /** Texto del encargo tal cual lo dice el documento. */
  texto: string;
  /** Trozo del texto que va resaltado en la placa (es el verbo que decide). */
  resalte: string;
  correcta: ParteId;
  /** Completa "…hace falta la parte que ___" y también la pista "la que ___". */
  necesita: string;
  /** Pares redactados a mano en §32.1; ganan sobre la regla compuesta. */
  especificos?: Partial<Record<ParteId, string>>;
}

export const ENCARGOS: Encargo[] = [
  {
    id: 'e1',
    texto: 'Quiero ver el video que grabó mi maestra.',
    resalte: 'ver',
    correcta: 'monitor',
    necesita: 'muestra',
    especificos: {
      gabinete:
        'El gabinete piensa, pero por fuera no se ve nada. Busca la ventana por donde la computadora nos habla.',
    },
  },
  {
    id: 'e2',
    texto: 'Quiero escribir mi nombre completo.',
    resalte: 'escribir',
    correcta: 'teclado',
    necesita: 'escribe letra por letra',
  },
  {
    id: 'e3',
    texto: 'Quiero señalar el juego y abrirlo con dos clics.',
    resalte: 'señalar',
    correcta: 'raton',
    necesita: 'señala en la pantalla',
  },
  {
    id: 'e4',
    texto: 'Quiero llevarme mi dibujo a casa, en papel.',
    resalte: 'llevarme',
    correcta: 'impresora',
    necesita: 'copia en papel',
  },
  {
    id: 'e5',
    texto: 'Se fue la luz un instante y la compu no se dañó. ¿Quién la protegió?',
    resalte: 'no se dañó',
    correcta: 'regulador',
    necesita: 'protege de la corriente',
    especificos: {
      gabinete:
        'El gabinete es lo que se estaba protegiendo, no el que protege. Mira al pie de la mesa, del lado del gabinete: ahí llegan todos los cables.',
    },
  },
  {
    id: 'e6',
    texto: '¿Y quién piensa todo lo que hacen las demás?',
    resalte: 'piensa',
    correcta: 'gabinete',
    necesita: 'piensa',
    especificos: {
      monitor: 'El monitor muestra lo que otro pensó. ¿Y quién crees que lo pensó?',
    },
  },
];

/**
 * Regla compuesta de la fase 2, textual del documento:
 * «El teclado sirve para escribir. Aquí hace falta la parte que muestra.»
 */
export function feedbackEncargo(encargo: Encargo, elegida: ParteId): string {
  const aMano = encargo.especificos?.[elegida];
  if (aMano) return aMano;
  return `El ${PARTES[elegida].nombre.toLowerCase()} sirve para ${PARTES[elegida].sirvePara}. Aquí hace falta la parte que ${encargo.necesita}.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// FASE 3 · DIAGNOSTICA — "El escritorio con fallas" (4 averías)
// ─────────────────────────────────────────────────────────────────────────────

/** Qué se apaga o se rompe VISIBLEMENTE en la mesa mientras corre la avería. */
export type SintomaVisible = 'pantalla-negra' | 'teclas-muertas' | 'hoja-rayada' | 'sin-energia';

export interface Averia {
  id: string;
  /** Síntoma tal cual lo cuenta el alumno imaginario (canon §32.1). */
  texto: string;
  resalte: string;
  correcta: ParteId;
  sintoma: SintomaVisible;
  /** Completa "busca la parte que ___" y la pista "la que ___". */
  necesita: string;
  /** Lo que el síntoma YA descarta; cierra la regla compuesta de averías. */
  clave: string;
  especificos?: Partial<Record<ParteId, string>>;
}

export const AVERIAS: Averia[] = [
  {
    id: 'a1',
    texto: 'Oigo el ventilador y hay luces prendidas, pero la pantalla está totalmente negra.',
    resalte: 'totalmente negra',
    correcta: 'monitor',
    sintoma: 'pantalla-negra',
    necesita: 'muestra',
    clave: 'hay luces y ventilador, pero la pantalla no muestra nada.',
    especificos: {
      gabinete:
        'El gabinete sí está trabajando: por eso oyes su ventilador. La falla está en la parte que muestra.',
    },
  },
  {
    id: 'a2',
    texto: 'Muevo la flechita sin problema, pero no aparece ninguna letra cuando escribo.',
    resalte: 'ninguna letra',
    correcta: 'teclado',
    sintoma: 'teclas-muertas',
    necesita: 'escribe las letras',
    clave: 'la flechita sí se mueve; lo que falla son las letras.',
    especificos: {
      raton: 'El ratón sí funciona: la flechita se mueve. Piensa en la parte con la que escribimos letras.',
    },
  },
  {
    id: 'a3',
    texto: 'Todo prende bien, pero mi dibujo sale en la hoja con rayas blancas.',
    resalte: 'rayas blancas',
    correcta: 'impresora',
    sintoma: 'hoja-rayada',
    necesita: 'copia en papel',
    clave: 'todo prende; el problema aparece en el papel.',
  },
  {
    id: 'a4',
    texto: 'No prende absolutamente nada: ni pantalla, ni luces, ni ventilador.',
    resalte: 'absolutamente nada',
    correcta: 'regulador',
    sintoma: 'sin-energia',
    necesita: 'reparte la corriente',
    clave: 'no hay energía en ninguna parte.',
    especificos: {
      monitor:
        'Si solo fuera el monitor, el gabinete todavía haría ruido. Aquí nada tiene energía: busca la parte que reparte la corriente.',
      gabinete: 'El gabinete no reparte la corriente, la recibe. ¿Quién se la da?',
    },
  },
];

/**
 * Regla compuesta de la fase 3: nombra el trabajo de la parte elegida y le
 * devuelve al alumno el dato del síntoma que la descarta.
 * «El ratón señala en la pantalla. Aquí la flechita sí se mueve; lo que falla
 *  son las letras.»
 */
export function feedbackAveria(averia: Averia, elegida: ParteId): string {
  const aMano = averia.especificos?.[elegida];
  if (aMano) return aMano;
  return `El ${PARTES[elegida].nombre.toLowerCase()} ${PARTES[elegida].hace}. Aquí ${averia.clave}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Líneas de Bit (canon §32.1, las seis, sin cambiar una coma)
// ─────────────────────────────────────────────────────────────────────────────

export const LINEAS = {
  entrarAplica: 'Ya sabes cómo se llama cada parte. Ahora lo difícil: ¿cuál hace este trabajo?',
  aciertoAplica: 'Exacto. Y fíjate que lo elegiste por lo que hace, no por su nombre.',
  baseDelError: 'Esa parte hace otro trabajo. Vuelve a leer el encargo.',
  entrarDiagnostica: 'Muy bien. Ahora eres el técnico: algo no está funcionando y tú tienes que decir qué parte es.',
  aciertoDiagnostica: 'Correcto. Y lo importante es cómo lo supiste, no la respuesta.',
  cierre:
    'Ya conoces las partes, sabes qué hace cada una y puedes encontrar la que falla. Eso es ser un explorador tecnológico.',
} as const;

/** Puntaje global de la actividad (§32.1): 100 − errores × 4, piso 60. */
export function puntajeMesa(errores: number): number {
  return Math.max(60, Math.min(100, 100 - errores * 4));
}
