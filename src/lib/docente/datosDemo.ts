/**
 * Hub de profesor — salón de prueba fijo (demo).
 *
 * Dos grupos ficticios, veinte alumnos ficticios, actividades REALES tomadas
 * de `curriculo.ts` (ids que existen de verdad en el temario). Los agregados
 * (actividades completadas, score promedio, minutos totales) se DERIVAN del
 * historial de cada alumno aquí mismo — nunca se escriben dos veces — para
 * que no puedan desincronizarse entre sí, el mismo defecto que ya cacé una
 * vez en el motor de Excel (§46) y otra vez en el motor de recomendaciones
 * de CEN Bachillerato (dato_respaldo con el denominador multiplicado dos
 * veces).
 *
 * Todo es literal, nada se calcula desde `Date.now()`/`new Date()`: es una
 * demo congelada en el tiempo, no una simulación en vivo. El día que exista
 * Supabase, este archivo se sustituye — `queries.ts` es el único que lo
 * importa.
 */

import type { Etapa } from '@/data/niveles';
import type { AlumnoDocente, GrupoDocente } from './tipos';

export interface GrupoRaw {
  id: string;
  nombre: string;
  etapa: Etapa;
  niveles: number[];
}

export const GRUPOS_DEMO: GrupoRaw[] = [
  { id: 'g-3a', nombre: '3° A · Primaria', etapa: 'primaria', niveles: [1, 2, 3] },
  { id: 'g-1b', nombre: '1° B · Secundaria', etapa: 'secundaria', niveles: [7, 8] },
];

interface IntentoRaw {
  actividadId: string;
  score: number;
  minutos: number;
  fecha: string; // ISO yyyy-mm-dd
}

interface AlumnoRaw {
  id: string;
  nombre: string;
  avatar: string;
  grupoId: string;
  nivelActual: number;
  diasSinActividad: number;
  historial: IntentoRaw[];
}

// ─── Grupo 3° A · Primaria (niveles 1–3) ──────────────────────────────────────
//
// `n1-ordena-los-pasos` se repite con score bajo en varios alumnos a propósito:
// es la actividad "difícil" que la recomendación ACTIVIDAD_DIFICIL debe
// encontrar sola, no una que se le diga directamente.

const ALUMNOS_3A: AlumnoRaw[] = [
  { id: 'a-mateo', nombre: 'Mateo Cruz Hernández', avatar: '🦖', grupoId: 'g-3a', nivelActual: 2, diasSinActividad: 0, historial: [
    { actividadId: 'n1-conoce-las-partes', score: 95, minutos: 9, fecha: '2026-08-10' },
    { actividadId: 'n1-caza-clics', score: 100, minutos: 6, fecha: '2026-08-12' },
    { actividadId: 'n1-ordena-los-pasos', score: 58, minutos: 14, fecha: '2026-08-15' },
    { actividadId: 'n2-safari-de-dispositivos', score: 88, minutos: 8, fecha: '2026-08-19' },
    { actividadId: 'n2-entrada-o-salida', score: 92, minutos: 7, fecha: '2026-08-21' },
  ] },
  { id: 'a-valentina', nombre: 'Valentina Reyes Ortiz', avatar: '🦋', grupoId: 'g-3a', nivelActual: 3, diasSinActividad: 1, historial: [
    { actividadId: 'n1-conoce-las-partes', score: 100, minutos: 8, fecha: '2026-08-09' },
    { actividadId: 'n1-pinta-con-la-compu', score: 97, minutos: 11, fecha: '2026-08-11' },
    { actividadId: 'n1-guarda-tu-obra', score: 94, minutos: 6, fecha: '2026-08-13' },
    { actividadId: 'n2-mis-primeras-oraciones', score: 91, minutos: 10, fecha: '2026-08-17' },
    { actividadId: 'n3-explora-el-escritorio', score: 89, minutos: 9, fecha: '2026-08-20' },
  ] },
  { id: 'a-emiliano', nombre: 'Emiliano Torres Vega', avatar: '🐙', grupoId: 'g-3a', nivelActual: 1, diasSinActividad: 9, historial: [
    { actividadId: 'n1-conoce-las-partes', score: 62, minutos: 15, fecha: '2026-08-05' },
    { actividadId: 'n1-ordena-los-pasos', score: 41, minutos: 18, fecha: '2026-08-08' },
    { actividadId: 'n1-caza-clics', score: 70, minutos: 12, fecha: '2026-08-12' },
  ] },
  { id: 'a-ximena', nombre: 'Ximena Morales Castro', avatar: '🐼', grupoId: 'g-3a', nivelActual: 2, diasSinActividad: 0, historial: [
    { actividadId: 'n1-conoce-las-partes', score: 88, minutos: 10, fecha: '2026-08-10' },
    { actividadId: 'n1-lluvia-de-letras', score: 79, minutos: 9, fecha: '2026-08-14' },
    { actividadId: 'n1-ordena-los-pasos', score: 55, minutos: 16, fecha: '2026-08-16' },
    { actividadId: 'n2-entrada-o-salida', score: 84, minutos: 8, fecha: '2026-08-21' },
  ] },
  { id: 'a-santiago', nombre: 'Santiago Flores Núñez', avatar: '🦁', grupoId: 'g-3a', nivelActual: 1, diasSinActividad: 3, historial: [
    { actividadId: 'n1-conoce-las-partes', score: 75, minutos: 12, fecha: '2026-08-14' },
    { actividadId: 'n1-teclas-gigantes', score: 81, minutos: 9, fecha: '2026-08-16' },
    { actividadId: 'n1-ordena-los-pasos', score: 47, minutos: 17, fecha: '2026-08-18' },
  ] },
  { id: 'a-renata', nombre: 'Renata Aguilar Soto', avatar: '🦊', grupoId: 'g-3a', nivelActual: 3, diasSinActividad: 0, historial: [
    { actividadId: 'n1-conoce-las-partes', score: 96, minutos: 8, fecha: '2026-08-08' },
    { actividadId: 'n1-mision-final', score: 93, minutos: 13, fecha: '2026-08-10' },
    { actividadId: 'n2-viste-tus-letras', score: 90, minutos: 9, fecha: '2026-08-15' },
    { actividadId: 'n2-cuento-ilustrado', score: 98, minutos: 11, fecha: '2026-08-18' },
    { actividadId: 'n3-que-es-internet', score: 87, minutos: 8, fecha: '2026-08-21' },
  ] },
  { id: 'a-diego', nombre: 'Diego Mendoza Ríos', avatar: '🐢', grupoId: 'g-3a', nivelActual: 1, diasSinActividad: 12, historial: [
    { actividadId: 'n1-conoce-las-partes', score: 68, minutos: 14, fecha: '2026-08-04' },
    { actividadId: 'n1-ordena-los-pasos', score: 39, minutos: 19, fecha: '2026-08-07' },
  ] },
  { id: 'a-camila', nombre: 'Camila Herrera Luna', avatar: '🐧', grupoId: 'g-3a', nivelActual: 2, diasSinActividad: 2, historial: [
    { actividadId: 'n1-conoce-las-partes', score: 90, minutos: 9, fecha: '2026-08-11' },
    { actividadId: 'n1-semaforo-de-pantalla', score: 86, minutos: 7, fecha: '2026-08-13' },
    { actividadId: 'n1-pide-ayuda', score: 100, minutos: 5, fecha: '2026-08-15' },
    { actividadId: 'n2-abre-y-cierra-ventanas', score: 82, minutos: 8, fecha: '2026-08-19' },
  ] },
  { id: 'a-joaquin', nombre: 'Joaquín Vargas Peña', avatar: '🐯', grupoId: 'g-3a', nivelActual: 1, diasSinActividad: 1, historial: [
    { actividadId: 'n1-conoce-las-partes', score: 84, minutos: 10, fecha: '2026-08-15' },
    { actividadId: 'n1-caza-clics', score: 91, minutos: 6, fecha: '2026-08-17' },
    { actividadId: 'n1-ordena-los-pasos', score: 60, minutos: 13, fecha: '2026-08-20' },
  ] },
  { id: 'a-regina', nombre: 'Regina Salazar Cortés', avatar: '🦩', grupoId: 'g-3a', nivelActual: 3, diasSinActividad: 0, historial: [
    { actividadId: 'n1-conoce-las-partes', score: 99, minutos: 7, fecha: '2026-08-07' },
    { actividadId: 'n2-laberinto-de-bloques', score: 95, minutos: 12, fecha: '2026-08-12' },
    { actividadId: 'n2-repite-repite', score: 92, minutos: 10, fecha: '2026-08-16' },
    { actividadId: 'n3-conoce-scratch', score: 97, minutos: 11, fecha: '2026-08-21' },
  ] },
  { id: 'a-leonardo', nombre: 'Leonardo Chávez Rangel', avatar: '🦓', grupoId: 'g-3a', nivelActual: 2, diasSinActividad: 5, historial: [
    { actividadId: 'n1-conoce-las-partes', score: 77, minutos: 11, fecha: '2026-08-09' },
    { actividadId: 'n1-ordena-los-pasos', score: 51, minutos: 15, fecha: '2026-08-13' },
    { actividadId: 'n2-caza-el-error', score: 73, minutos: 10, fecha: '2026-08-16' },
  ] },
];

// ─── Grupo 1° B · Secundaria (niveles 7–8) ────────────────────────────────────
//
// `n7-bucles-python` juega el mismo papel que `n1-ordena-los-pasos` arriba:
// score bajo repetido en varios alumnos, sin que nadie lo marque a mano.

const ALUMNOS_1B: AlumnoRaw[] = [
  { id: 'a-fernanda', nombre: 'Fernanda Domínguez Ibarra', avatar: '🦉', grupoId: 'g-1b', nivelActual: 7, diasSinActividad: 0, historial: [
    { actividadId: 'n7-binario-y-unidades', score: 94, minutos: 16, fecha: '2026-08-11' },
    { actividadId: 'n7-variables-y-tipos', score: 90, minutos: 18, fecha: '2026-08-14' },
    { actividadId: 'n7-condicionales-python', score: 88, minutos: 20, fecha: '2026-08-17' },
    { actividadId: 'n7-bucles-python', score: 76, minutos: 22, fecha: '2026-08-20' },
  ] },
  { id: 'a-sebastian', nombre: 'Sebastián Guerrero Paz', avatar: '🐺', grupoId: 'g-1b', nivelActual: 7, diasSinActividad: 14, historial: [
    { actividadId: 'n7-binario-y-unidades', score: 55, minutos: 24, fecha: '2026-08-04' },
    { actividadId: 'n7-bucles-python', score: 38, minutos: 27, fecha: '2026-08-07' },
  ] },
  { id: 'a-isabella', nombre: 'Isabella Navarro Campos', avatar: '🦚', grupoId: 'g-1b', nivelActual: 8, diasSinActividad: 0, historial: [
    { actividadId: 'n7-binario-y-unidades', score: 97, minutos: 15, fecha: '2026-08-10' },
    { actividadId: 'n7-html-estructura', score: 93, minutos: 19, fecha: '2026-08-13' },
    { actividadId: 'n7-css-estilo', score: 95, minutos: 17, fecha: '2026-08-16' },
    { actividadId: 'n7-tu-sitio-personal', score: 91, minutos: 25, fecha: '2026-08-19' },
    { actividadId: 'n8-javascript-basico', score: 89, minutos: 21, fecha: '2026-08-21' },
  ] },
  { id: 'a-bruno', nombre: 'Bruno Espinoza Delgado', avatar: '🐻', grupoId: 'g-1b', nivelActual: 7, diasSinActividad: 4, historial: [
    { actividadId: 'n7-binario-y-unidades', score: 80, minutos: 17, fecha: '2026-08-13' },
    { actividadId: 'n7-condicionales-python', score: 74, minutos: 21, fecha: '2026-08-15' },
    { actividadId: 'n7-bucles-python', score: 49, minutos: 26, fecha: '2026-08-18' },
  ] },
  { id: 'a-daniela', nombre: 'Daniela Cabrera Fuentes', avatar: '🦢', grupoId: 'g-1b', nivelActual: 7, diasSinActividad: 1, historial: [
    { actividadId: 'n7-binario-y-unidades', score: 91, minutos: 16, fecha: '2026-08-12' },
    { actividadId: 'n7-privacidad-en-redes', score: 96, minutos: 14, fecha: '2026-08-15' },
    { actividadId: 'n7-riesgos-y-marco-legal', score: 94, minutos: 18, fecha: '2026-08-18' },
    { actividadId: 'n7-equilibrio-digital', score: 92, minutos: 13, fecha: '2026-08-21' },
  ] },
  { id: 'a-emilio', nombre: 'Emilio Rojas Sandoval', avatar: '🦝', grupoId: 'g-1b', nivelActual: 7, diasSinActividad: 8, historial: [
    { actividadId: 'n7-binario-y-unidades', score: 63, minutos: 20, fecha: '2026-08-06' },
    { actividadId: 'n7-bucles-python', score: 44, minutos: 25, fecha: '2026-08-10' },
    { actividadId: 'n7-retos-python', score: 52, minutos: 23, fecha: '2026-08-13' },
  ] },
  { id: 'a-paulina', nombre: 'Paulina Moreno Guzmán', avatar: '🦔', grupoId: 'g-1b', nivelActual: 8, diasSinActividad: 0, historial: [
    { actividadId: 'n7-binario-y-unidades', score: 99, minutos: 14, fecha: '2026-08-09' },
    { actividadId: 'n7-como-aprende-la-ia', score: 96, minutos: 15, fecha: '2026-08-12' },
    { actividadId: 'n7-buenos-prompts', score: 98, minutos: 12, fecha: '2026-08-16' },
    { actividadId: 'n7-verifica-a-la-ia', score: 94, minutos: 16, fecha: '2026-08-19' },
    { actividadId: 'n8-limpieza-de-datos', score: 90, minutos: 19, fecha: '2026-08-21' },
  ] },
  { id: 'a-alejandro', nombre: 'Alejandro Villareal Ponce', avatar: '🐗', grupoId: 'g-1b', nivelActual: 7, diasSinActividad: 2, historial: [
    { actividadId: 'n7-binario-y-unidades', score: 85, minutos: 17, fecha: '2026-08-14' },
    { actividadId: 'n7-variables-y-tipos', score: 82, minutos: 19, fecha: '2026-08-17' },
    { actividadId: 'n7-bucles-python', score: 57, minutos: 24, fecha: '2026-08-20' },
  ] },
  { id: 'a-mariana', nombre: 'Mariana Contreras Beltrán', avatar: '🦦', grupoId: 'g-1b', nivelActual: 7, diasSinActividad: 0, historial: [
    { actividadId: 'n7-binario-y-unidades', score: 89, minutos: 15, fecha: '2026-08-15' },
    { actividadId: 'n7-sistemas-operativos', score: 87, minutos: 18, fecha: '2026-08-18' },
    { actividadId: 'n7-diagnostica-y-soluciona', score: 83, minutos: 20, fecha: '2026-08-21' },
  ] },
];

const ALUMNOS_RAW: AlumnoRaw[] = [...ALUMNOS_3A, ...ALUMNOS_1B];

// ─── Derivación (una sola vez, aquí) ──────────────────────────────────────────

function round(n: number): number {
  return Math.round(n);
}

export const ALUMNOS_DEMO: AlumnoDocente[] = ALUMNOS_RAW.map((a) => {
  const n = a.historial.length;
  const scoreTotal = a.historial.reduce((s, i) => s + i.score, 0);
  const scorePromedio = n > 0 ? round(scoreTotal / n) : null;
  const tiempoTotalMinutos = a.historial.reduce((s, i) => s + i.minutos, 0);
  const ultimaActividadFecha = n > 0
    ? [...a.historial].sort((x, y) => (x.fecha < y.fecha ? 1 : -1))[0]!.fecha
    : null;
  return {
    id: a.id,
    nombre: a.nombre,
    avatar: a.avatar,
    grupoId: a.grupoId,
    nivelActual: a.nivelActual,
    actividadesCompletadas: n,
    scorePromedio,
    scoreTotal,
    tiempoTotalMinutos,
    ultimaActividadFecha,
    diasSinActividad: a.diasSinActividad,
  };
});

export const HISTORIAL_POR_ALUMNO: Record<string, IntentoRaw[]> = Object.fromEntries(
  ALUMNOS_RAW.map((a) => [a.id, a.historial]),
);

export const GRUPOS_DEMO_CON_TOTAL: GrupoDocente[] = GRUPOS_DEMO.map((g) => ({
  ...g,
  totalAlumnos: ALUMNOS_DEMO.filter((a) => a.grupoId === g.id).length,
}));

export type { IntentoRaw };
export type { AlumnoRaw };
