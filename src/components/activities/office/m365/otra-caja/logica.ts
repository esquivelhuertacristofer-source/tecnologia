/**
 * `of-m365-otra-caja` · «El mismo trabajo en otra caja» — lógica pura.
 *
 * Sin React a propósito: son las tres tareas de «Tecnia Nube Suite» reducidas
 * a datos y funciones puras, para que el promedio de la pestaña Hojas sea un
 * cálculo real sobre números reales y no un valor pegado con cinta (regla de
 * la casa: dos números son iguales si la cuenta los da iguales, nunca porque
 * el guion lo dice).
 *
 * Las tres tareas son independientes entre sí y cada una tiene su propia
 * noción de "completa"; `Lab.tsx` sólo lee estos datos y llama a estas
 * funciones, nunca inventa un número por su cuenta.
 */

/* ── Documentos: negrita + tamaño 18 sobre un título ya escrito ──────────── */

export const TITULO_DOCUMENTO = 'Informe de Avance del Proyecto';
export const CUERPO_DOCUMENTO =
  'La primera fase del proyecto quedó lista antes de lo previsto. El equipo terminó la recolección de datos y ahora arranca la etapa de análisis.';

/** El título cumple el encargo cuando tiene los dos atributos a la vez. */
export function documentoCompleto(negrita: boolean, tamano: number): boolean {
  return negrita && tamano === 18;
}

/* ── Hojas: PROMEDIO real sobre B5:D5, con Σ y un distractor de gráfico ──── */

export interface CeldaNota {
  id: string;
  columna: 'B' | 'C' | 'D';
  valor: number;
}

/** Las tres notas de la fila 5 — los únicos números que el promedio suma. */
export const NOTAS_FILA5: CeldaNota[] = [
  { id: 'B5', columna: 'B', valor: 8 },
  { id: 'C5', columna: 'C', valor: 7 },
  { id: 'D5', columna: 'D', valor: 9 },
];

/** Función pura real: nunca se hardcodea el resultado en la interfaz. */
export function promedio(valores: number[]): number {
  if (valores.length === 0) return 0;
  const suma = valores.reduce((total, v) => total + v, 0);
  return suma / valores.length;
}

export const FUNCIONES_DISPONIBLES = ['SUMA', 'PROMEDIO', 'CONTAR'] as const;
export type IdFuncion = (typeof FUNCIONES_DISPONIBLES)[number];
export const FUNCION_CORRECTA: IdFuncion = 'PROMEDIO';

export const RANGOS_DISPONIBLES = ['B4:D4', 'B5:D5', 'B5:E5'] as const;
export type IdRango = (typeof RANGOS_DISPONIBLES)[number];
export const RANGO_CORRECTO: IdRango = 'B5:D5';

/* ── Presentaciones: cambiar de verdad el fondo/acento de la diapositiva ── */

export interface TemaPresentacion {
  id: string;
  nombre: string;
  fondo: string;
  acento: string;
}

export const TITULO_DIAPOSITIVA = 'Exposición del Proyecto';

export const TEMAS_PRESENTACION: TemaPresentacion[] = [
  { id: 'claro-simple', nombre: 'Claro Simple', fondo: 'linear-gradient(160deg, #eef3f8, #cfdcea)', acento: '#2563eb' },
  { id: 'oscuro-teal', nombre: 'Oscuro Teal', fondo: 'linear-gradient(160deg, #062830, #04434f)', acento: '#2dd4bf' },
  { id: 'atardecer-coral', nombre: 'Atardecer Coral', fondo: 'linear-gradient(160deg, #3a1220, #7a2542)', acento: '#fb7185' },
  { id: 'bosque-esmeralda', nombre: 'Bosque Esmeralda', fondo: 'linear-gradient(160deg, #082a1c, #0e4a30)', acento: '#34d399' },
];

/** La diapositiva abre con el primer tema; elegir cualquier otro cuenta como el encargo hecho. */
export const TEMA_INICIAL = TEMAS_PRESENTACION[0].id;

export function temaPorId(id: string): TemaPresentacion {
  return TEMAS_PRESENTACION.find((t) => t.id === id) ?? TEMAS_PRESENTACION[0];
}
