'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { RUTA_N10_CIBERSEGURIDAD } from '../ciberseguridad/rutaCiberseguridadN10';
import { LabCarrerasCiber } from './LabCarrerasCiber';

/**
 * Entrada de `n10-carreras-ciber` — N10·«Ciberseguridad profesional»,
 * parada 3 de 3, **CIERRE de la unidad**. **N10 = Bachillerato, 15–18 años**,
 * tono «Perfil profesional»: sin diminutivos, registro corporativo.
 *
 * La ruta se IMPORTA de `RUTA_N10_CIBERSEGURIDAD` (declarada por la parada 1)
 * y nunca se reescribe aquí.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n10-carreras-ciber/video-explicativo.mp4` y la
 * bandera bajó a `assetsPendientes: false`. OJO si escribes pruebas: con el
 * video puesto, el primer `<button>` del documento ya no es el CTA sino el de
 * la portada, así que no lo busques por posición — búscalo por su texto.
 */

const ACTIVIDAD = 'n10-carreras-ciber';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabCarrerasCiber,
  ruta: RUTA_N10_CIBERSEGURIDAD,
  parada: Math.max(1, RUTA_N10_CIBERSEGURIDAD.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo:
    'Ya viste cómo se defiende una red y cómo se protege una identidad. Ahora vas a conocer cinco carreras reales dentro de la ciberseguridad, separar el mito del oficio real en cada una, y acompañar a alguien que —como tú— tiene que decidir qué camino seguir.',
  arranqueSub:
    'En **Orbitatek Soluciones**, Tadeo terminó su semana de estancia y tiene que decidir qué camino de ciberseguridad estudiar. Vas a clasificar cinco roles reales —Analista SOC, Pentester, Arquitecto/a de seguridad, Oficial de cumplimiento y Especialista en respuesta a incidentes— separando el mito de que **todos programan todo el día** de lo que cada uno hace en realidad, vas a decidir qué candidato encaja en qué rol según lo que de verdad se le da bien, y vas a cerrar la unidad completa conectando la defensa técnica que ya dominaste con la protección de identidad que ya practicaste.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#6366f1' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
    { etiqueta: 'Nivel', valor: 'Profesional', acento: '#a78bfa' },
  ],
  letrero: 'Un camino en ciberseguridad se decide con criterio, no con el nombre más conocido',
  fichas: [
    {
      key: 'roles-reales',
      tag: 'Fase 1',
      numero: 1,
      titulo: 'Cinco roles, no uno solo',
      detalle:
        'Analista SOC, Pentester, Arquitecto/a de seguridad, Oficial de cumplimiento y Especialista en respuesta a incidentes: **no todos programan todo el día**. Vas a clasificar cada rol por lo que de verdad hace, no por el estereotipo.',
      acento: { c: '#6366f1', deep: '#3730a3' },
    },
    {
      key: 'habilidades-tecnicas-transferibles',
      tag: 'Fase 2',
      numero: 2,
      titulo: 'Técnica y transferible, las dos cuentan',
      detalle:
        'Configurar un SIEM y escribir un script piden conocimiento específico. **Explicar un riesgo en una junta directiva o coordinar un incidente entre tres equipos** pide una habilidad que sirve en cualquier profesión — y aquí pesa igual.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'integra-la-unidad',
      tag: 'Fase 3',
      numero: 3,
      titulo: 'Lo que ya sabes, aplicado',
      detalle:
        'La vigilancia de tráfico y el firewall que dominaste en la parada 1, y la protección de identidad que dominaste en la parada 2, **no eran el tema completo**: son las herramientas que distintos roles de ciberseguridad usan todos los días.',
      acento: { c: '#f97316', deep: '#9a3412' },
    },
    {
      key: 'decide-con-criterio',
      tag: 'Fase 4',
      numero: 4,
      titulo: 'Un camino se decide con criterio',
      detalle:
        'Vas a acompañar a Tadeo mientras decide su camino dentro de la ciberseguridad — cruzando lo que de verdad se le da bien con lo que cada rol exige de verdad, el mismo criterio que vas a usar para tu propia decisión.',
      acento: { c: '#34d399', deep: '#047857' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Entra al panel de carreras de Orbitatek',
  ctaDetalle:
    'Se abre el panel de orientación profesional de Orbitatek: clasificas cinco roles reales de ciberseguridad, decides qué candidato encaja en cuál según sus habilidades reales, conectas lo aprendido en las dos paradas anteriores con el trabajo diario de cada rol, y cierras la unidad ayudando a Tadeo a elegir su camino. Equivocarte resta puntos, nunca te deja fuera.',
};

export function EntradaCarrerasCiber(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaCarrerasCiber;
