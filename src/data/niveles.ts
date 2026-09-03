/**
 * Temario Tecnia v2 — capa de presentación de los 10 niveles + bloque Office.
 * Los datos curriculares reales (unidades, temas, actividades) viven en
 * `curriculo.ts`; aquí solo hay copy para landing/hub y contadores DERIVADOS.
 */

import { resumenNivel } from './curriculo';
import type { AppOfficeId } from './curriculo';
import {
  leerPerfilLocal,
  guardarPerfilLocal,
  leerXPLocal,
  sumarXPLocal,
  leerProgresoActividadLocal,
  guardarProgresoActividadLocal,
} from '@/lib/progreso/local';
import type { PerfilAlumno, ProgresoActividad } from '@/lib/progreso/repo';

export type Etapa = 'primaria' | 'secundaria' | 'bachillerato';

export interface Nivel {
  n: number;                 // 1-10
  etapa: Etapa;
  grado: string;             // "1° de Primaria"
  titulo: string;
  descripcion: string;
  ejes: string[];            // temas destacados del nivel
  icono: string;             // emoji representativo
  unidades: number;          // derivado: unidades del currículo
  actividades: number;       // derivado: temas del currículo (≈ una actividad por tema)
  conIA: boolean;            // derivado: el nivel tiene unidades del eje datos-ia
  disponible: boolean;       // el nivel se puede explorar (hoy: los 10; su plan ya está declarado)
}

/** Copy de presentación por nivel; los contadores se completan desde el currículo. */
type NivelBase = Omit<Nivel, 'unidades' | 'actividades' | 'conIA'>;

function conDatosCurriculares(base: NivelBase): Nivel {
  const resumen = resumenNivel(base.n);
  return {
    ...base,
    unidades: resumen.unidades,
    actividades: resumen.temas,
    conIA: resumen.tieneIA,
  };
}

export const ETAPA_META: Record<Etapa, { label: string; color: string; colorSoft: string; rango: string }> = {
  primaria:     { label: 'Primaria',     color: '#0E8A6D', colorSoft: 'rgba(14,138,109,0.12)',  rango: 'Niveles 1–6' },
  secundaria:   { label: 'Secundaria',   color: '#2563B0', colorSoft: 'rgba(37,99,176,0.12)',   rango: 'Niveles 7–9' },
  bachillerato: { label: 'Bachillerato', color: '#6B4FBB', colorSoft: 'rgba(107,79,187,0.12)',  rango: 'Nivel 10' },
};

export const NIVELES: Nivel[] = ([
  {
    n: 1, etapa: 'primaria', grado: '1° de Primaria',
    titulo: 'Descubro la tecnología',
    descripcion: 'Primer contacto con la computadora: sus partes, el mouse, el teclado y las reglas para cuidar el equipo y cuidarse en pantalla.',
    ejes: ['Partes de la computadora', 'Mouse y teclado', 'Hábitos digitales'],
    icono: '🖥️', disponible: true,
  },
  {
    n: 2, etapa: 'primaria', grado: '2° de Primaria',
    titulo: 'Exploro mi equipo',
    descripcion: 'Archivos, carpetas y ventanas: el alumno aprende a moverse solo por el sistema, guardar su trabajo y dibujar y escribir en la computadora.',
    ejes: ['Archivos y carpetas', 'Paint y escritura', 'Escritorio y ventanas'],
    icono: '📁', disponible: true,
  },
  {
    n: 3, etapa: 'primaria', grado: '3° de Primaria',
    titulo: 'De las máquinas a las apps',
    descripcion: 'Cómo funcionan las máquinas que nos rodean, qué es internet y primer encuentro guiado con la inteligencia artificial como ayudante.',
    ejes: ['Internet seguro', 'Primeros pasos con IA', 'Hardware y software'],
    icono: '🌐', disponible: true,
  },
  {
    n: 4, etapa: 'primaria', grado: '4° de Primaria',
    titulo: 'Creadores digitales',
    descripcion: 'Programación por bloques, animaciones e historias interactivas: el alumno pasa de usar tecnología a crear con ella.',
    ejes: ['Programación en bloques', 'Animaciones', 'Diseño digital'],
    icono: '🎨', disponible: true,
  },
  {
    n: 5, etapa: 'primaria', grado: '5° de Primaria',
    titulo: 'Datos y proyectos',
    descripcion: 'Recolectar, ordenar y presentar información: hojas de cálculo, gráficas y un primer proyecto tecnológico por equipos.',
    ejes: ['Datos y gráficas', 'Proyectos en equipo', 'IA para investigar'],
    icono: '📊', disponible: true,
  },
  {
    n: 6, etapa: 'primaria', grado: '6° de Primaria',
    titulo: 'Integro y comparto',
    descripcion: 'Cierre de primaria: videojuego sencillo por bloques, introducción a la robótica y una presentación final que integra todo lo aprendido.',
    ejes: ['Mi primer videojuego', 'Robótica básica', 'Proyecto integrador'],
    icono: '🕹️', disponible: true,
  },
  {
    n: 7, etapa: 'secundaria', grado: '1° de Secundaria',
    titulo: 'Bajo el cofre',
    descripcion: 'Qué hay dentro de la máquina: sistemas operativos, redes, seguridad digital y primeras líneas de código en un lenguaje real.',
    ejes: ['Sistemas y redes', 'Ciberseguridad', 'Primer código en Python'],
    icono: '⚙️', disponible: true,
  },
  {
    n: 8, etapa: 'secundaria', grado: '2° de Secundaria',
    titulo: 'Construyo soluciones',
    descripcion: 'Programación aplicada: apps, sensores e IoT. El alumno detecta problemas reales de su entorno y prototipa soluciones tecnológicas.',
    ejes: ['Apps y prototipos', 'IoT y sensores', 'IA aplicada'],
    icono: '🛠️', disponible: true,
  },
  {
    n: 9, etapa: 'secundaria', grado: '3° de Secundaria',
    titulo: 'Del prototipo al producto',
    descripcion: 'Desarrollo web, diseño de videojuegos y robótica avanzada, con un proyecto de salida que se presenta ante la comunidad escolar.',
    ejes: ['Desarrollo web', 'Videojuegos', 'Robótica avanzada'],
    icono: '🚀', disponible: true,
  },
  {
    n: 10, etapa: 'bachillerato', grado: 'Bachillerato',
    titulo: 'Perfil profesional',
    descripcion: 'Orientación a carreras tecnológicas: ciencia de datos, IA generativa con criterio profesional, portafolio personal y proyecto de impacto.',
    ejes: ['Ciencia de datos', 'IA generativa', 'Portafolio profesional'],
    icono: '🎓', disponible: true,
  },
] satisfies NivelBase[]).map(conDatosCurriculares);

// ─── Bloque Office transversal ────────────────────────────────────────────────

export interface ModuloOffice {
  /**
   * Mismo id que en `OFFICE_CURRICULO`, y tipado como tal a propósito: esta
   * lista es la capa de presentación de aquella, y con `string` se podía añadir
   * aquí una tarjeta de un programa que el currículo no conoce —o escribir mal
   * el id— y sólo se habría notado en runtime, con la sala dando 404.
   */
  id: AppOfficeId;
  nombre: string;
  tagline: string;          // qué es, en una palabra ("Documentos")
  letra: string | null;     // letra del mosaico de la app; null = logo Microsoft (4 cuadros)
  color: string;            // color de marca del programa
  colorDeep: string;        // tono profundo del mismo color (degradado del encabezado)
  descripcion: string;
  grados: { rango: string; nivel: 'Básico' | 'Intermedio' | 'Avanzado' }[];
  desde: string;            // grado donde se desbloquea
}

export const MODULOS_OFFICE: ModuloOffice[] = [
  {
    id: 'word', nombre: 'Word', tagline: 'Documentos', letra: 'W',
    color: '#185ABD', colorDeep: '#103F91',
    descripcion: 'De escribir tu nombre a reportes con formato profesional.',
    grados: [
      { rango: '3°–5° Primaria', nivel: 'Básico' },
      { rango: '6° Prim – 2° Sec', nivel: 'Intermedio' },
      { rango: '3° Sec – Bachillerato', nivel: 'Avanzado' },
    ],
    desde: '3° de Primaria',
  },
  {
    id: 'excel', nombre: 'Excel', tagline: 'Hojas de cálculo', letra: 'X',
    color: '#107C41', colorDeep: '#0B5228',
    descripcion: 'Tablas, fórmulas, gráficas y análisis de datos.',
    grados: [
      { rango: '3°–5° Primaria', nivel: 'Básico' },
      { rango: '6° Prim – 2° Sec', nivel: 'Intermedio' },
      { rango: '3° Sec – Bachillerato', nivel: 'Avanzado' },
    ],
    desde: '3° de Primaria',
  },
  {
    id: 'powerpoint', nombre: 'PowerPoint', tagline: 'Presentaciones', letra: 'P',
    color: '#C43E1C', colorDeep: '#8C2B0E',
    descripcion: 'Diapositivas, animaciones y cómo exponer con impacto.',
    grados: [
      { rango: '3°–5° Primaria', nivel: 'Básico' },
      { rango: '6° Prim – 2° Sec', nivel: 'Intermedio' },
      { rango: '3° Sec – Bachillerato', nivel: 'Avanzado' },
    ],
    desde: '3° de Primaria',
  },
  {
    id: 'm365', nombre: 'Microsoft 365', tagline: 'Nube y colaboración', letra: null,
    color: '#0078D4', colorDeep: '#004E8C',
    descripcion: 'Outlook, OneDrive, Teams y Copilot con criterio.',
    grados: [
      { rango: '6° Prim – 3° Sec', nivel: 'Intermedio' },
      { rango: 'Bachillerato', nivel: 'Avanzado' },
    ],
    desde: '6° de Primaria',
  },
];

// ─── Perfil demo (la maqueta corre sin backend) ───────────────────────────────
//
// La persistencia real vive en el repositorio de progreso (F0.6):
// src/lib/progreso. Estas funciones síncronas delegan ahí y se conservan
// solo para las páginas de la maqueta; el código nuevo debe usar
// `progresoRepo` de '@/lib/progreso'.

export type PerfilDemo = PerfilAlumno;
export type { ProgresoActividad };

export const PERFIL_DEMO: PerfilDemo = {
  nombre: 'Sofía Ramírez',
  grado: '1° de Primaria',
  grupo: 'Grupo A',
  avatar: '🦊',
  nivelActual: 1,
};

export function getPerfilDemo(): PerfilDemo {
  return leerPerfilLocal(PERFIL_DEMO);
}

export function savePerfilDemo(perfil: Partial<PerfilDemo>) {
  guardarPerfilLocal(PERFIL_DEMO, perfil);
}

export function getXP(): number {
  return leerXPLocal();
}

export function addXP(amount: number): number {
  return sumarXPLocal(amount);
}

export function getProgresoActividad(id: string): ProgresoActividad | null {
  return leerProgresoActividadLocal(id);
}

export function saveProgresoActividad(id: string, progreso: ProgresoActividad) {
  guardarProgresoActividadLocal(id, progreso);
}
