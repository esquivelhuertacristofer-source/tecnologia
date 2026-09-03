'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { RUTA_N10_CAPSTONE_Y_PORTAFOLIO } from './rutaCapstoneYPortafolioN10';
import { LabCarrerasCertificaciones } from './LabCarrerasCertificaciones';

/**
 * Entrada de `n10-carreras-y-certificaciones` — N10 · «Proyecto capstone y
 * portafolio», parada 3 de 3, **CIERRE de la unidad** y de la orientación
 * profesional de toda la plataforma. **N10 = Bachillerato, 15–18 años**,
 * tono «Perfil profesional»: sin diminutivos, registro corporativo.
 *
 * La ruta se DERIVA de `curriculo.ts` vía `RUTA_N10_CAPSTONE_Y_PORTAFOLIO`
 * (`getUnidad('n10-capstone-y-portafolio')`), porque esta unidad —a
 * diferencia de `n10-ciberseguridad-profesional`— no tiene un archivo de
 * ruta escrito a mano: su parada 2 vive fuera de `n10/`, en
 * `office/word/portafolio-y-cv/`.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n10-carreras-y-certificaciones/video-explicativo.mp4` y la bandera bajó a
 * `assetsPendientes: false`. OJO si escribes pruebas: con el video puesto, el
 * primer `<button>` del documento ya no es el CTA sino el de la portada, así
 * que no lo busques por posición — búscalo por su texto.
 */

const ACTIVIDAD = 'n10-carreras-y-certificaciones';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabCarrerasCertificaciones,
  ruta: RUTA_N10_CAPSTONE_Y_PORTAFOLIO,
  parada: Math.max(1, RUTA_N10_CAPSTONE_Y_PORTAFOLIO.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo:
    'Ya arreglaste el currículum de Sofía para que sobreviviera siete segundos de lectura, y estás a punto de emprender tu propio proyecto capstone. Antes de eso, vas a conocer cinco familias reales de carreras tecnológicas, aprender a leer una certificación por lo que de verdad certifica, y acompañar a tres personas —como tú— que tienen que decidir su propio camino.',
  arranqueSub:
    'En el **Panel de orientación profesional de Tecnia Rumbo**, vas a clasificar cinco familias reales de carreras tecnológicas —Desarrollo de software, Datos e IA, Ciberseguridad, Diseño UX/UI y Redes e infraestructura en la nube— separando el mito de que **todas exigen programar todo el día** de lo que cada una hace en realidad. Vas a aprender qué certifica de verdad una certificación profesional y qué nunca garantiza, y vas a decidir —cruzando rasgos reales con situación real, nunca adivinando— la familia de carrera y el siguiente paso de tres estudiantes de Bachillerato, justo antes de emprender tu propio proyecto capstone.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#6366f1' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
    { etiqueta: 'Nivel', valor: 'Profesional', acento: '#a78bfa' },
  ],
  letrero: 'Un camino profesional se decide con criterio, no con el nombre más conocido',
  fichas: [
    {
      key: 'cinco-familias',
      tag: 'Fase 1',
      numero: 1,
      titulo: 'Cinco familias, no una sola',
      detalle:
        'Desarrollo de software, Datos e IA, Ciberseguridad, Diseño UX/UI y Redes e infraestructura en la nube: **no todas exigen programar todo el día**. Vas a clasificar cada familia por lo que de verdad hace, no por el estereotipo.',
      acento: { c: '#6366f1', deep: '#3730a3' },
    },
    {
      key: 'leer-certificacion',
      tag: 'Fase 2',
      numero: 2,
      titulo: 'Leer una certificación de verdad',
      detalle:
        'Una certificación certifica **un conocimiento puntual, en un examen concreto** — nunca años de experiencia real, ni que sirva igual en cualquier otra plataforma. Vas a aprender a leerla con ese criterio.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'dos-decisiones',
      tag: 'Fase 3',
      numero: 3,
      titulo: 'Dos decisiones, no una',
      detalle:
        'Con Fernanda, Joaquín y Renata vas a cruzar dos cosas distintas: **qué familia de carrera** encaja con lo que se les da bien, y **qué siguiente paso** —certificación, bootcamp o universidad— encaja con su situación real.',
      acento: { c: '#f97316', deep: '#9a3412' },
    },
    {
      key: 'tu-propio-criterio',
      tag: 'Fase 4',
      numero: 4,
      titulo: 'Lo que ya construiste, aplicado',
      detalle:
        'Las consultas SQL que ya escribiste y el currículum que ya arreglaste **no eran temas sueltos**: son evidencia real del mismo criterio que necesitas para decidir tu propio camino, justo antes de tu proyecto capstone.',
      acento: { c: '#34d399', deep: '#047857' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Entra al panel de Tecnia Rumbo',
  ctaDetalle:
    'Se abre el panel de orientación profesional de Tecnia Rumbo: clasificas cinco familias reales de carreras tecnológicas, aprendes a leer una certificación por lo que de verdad certifica, decides la familia de carrera y el siguiente paso de tres estudiantes según sus rasgos y su situación real, y cierras conectando ese criterio con tu propio currículum y tu propio proyecto capstone. Equivocarte resta puntos, nunca te deja fuera.',
};

export function EntradaCarrerasCertificaciones(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaCarrerasCertificaciones;
