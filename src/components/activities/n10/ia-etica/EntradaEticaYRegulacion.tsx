'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { RUTA_N10_IA_DATOS } from '../ia-modelos/rutaIaDatosN10';
import { LabEticaYRegulacion } from './LabEticaYRegulacion';

/**
 * Entrada de `n10-etica-y-regulacion` — N10 · «IA y ciencia de datos»,
 * parada 3 de 3, **CIERRE de la unidad**. **N10 = Bachillerato, 15–18 años**,
 * tono «Perfil profesional»: sin diminutivos, registro corporativo.
 *
 * La ruta se IMPORTA de `RUTA_N10_IA_DATOS` (declarada por la parada 1 en
 * `ia-modelos/rutaIaDatosN10.ts`) y nunca se reescribe aquí.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n10-etica-y-regulacion/video-explicativo.mp4` y la bandera bajó a
 * `assetsPendientes: false`. OJO si escribes pruebas: con el video puesto, el
 * primer `<button>` del documento ya no es el CTA sino el de la portada, así
 * que no lo busques por posición — búscalo por su texto.
 */

const ACTIVIDAD = 'n10-etica-y-regulacion';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabEticaYRegulacion,
  ruta: RUTA_N10_IA_DATOS,
  parada: Math.max(1, RUTA_N10_IA_DATOS.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo:
    'Ya auditaste el clasificador de tickets de TecniMarket y ya practicaste usar un asistente de IA generativa con criterio. Ahora TecniMarket ya sabe que su modelo falla contra el área de pago: una brecha de 1,00, medida con el motor real. Te toca decidir, y construir, qué responsabilidad profesional corresponde.',
  arranqueSub:
    'La Mesa de Soporte de TecniMarket tiene, sobre la mesa, el hallazgo exacto de la parada 1: el área **«pago»** cayó a 0 % de acierto mientras las otras tres dieron 100 %. Vas a reconectar ese número con lo que corresponde hacer después —transparencia, revisión humana, corrección de la causa y rendición de cuentas—, vas a clasificar seis respuestas reales que una empresa podría dar ante un hallazgo así (algunas lo esconden, algunas lo corrigen a medias, sólo una lo hace completo), vas a distinguir «es legal» de «es correcto», y vas a terminar **construyendo tú mismo** la respuesta responsable con el mismo criterio exacto que usaste para juzgar los seis casos anteriores.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#a78bfa' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
    { etiqueta: 'Nivel', valor: 'Profesional', acento: '#f5a524' },
  ],
  letrero: 'Detectar un sesgo no es el final del trabajo: es el principio de la responsabilidad',
  fichas: [
    {
      key: 'lo-que-ya-mediste',
      tag: 'Principio 1',
      numero: 1,
      titulo: 'Transparencia: informar que el sistema existe',
      detalle:
        'La brecha de 1,00 en «pago» que auditaste con el motor real en la parada 1 no se queda archivada: informar que existe un sistema automatizado y qué papel tuvo en una decisión concreta es el primer paso, no un extra opcional.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'revision-humana',
      tag: 'Principio 2',
      numero: 2,
      titulo: 'Revisión humana: una vía real para apelar',
      detalle:
        'Un árbol de decisión nunca se queda callado: contesta algo, con la confianza que le den los pocos ejemplos que conoce. Por eso una persona tiene que poder revisar —y cambiar— una decisión automatizada, incluso después de corregir el modelo.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'correccion-de-causa',
      tag: 'Principio 3',
      numero: 3,
      titulo: 'Corregir la causa, no sólo el síntoma',
      detalle:
        'Subir a mano la prioridad de los tickets de pago sin tocar el modelo no arregla nada: el hueco que produjo la brecha sigue ahí. Vas a clasificar respuestas reales que confunden tapar el síntoma con corregir la causa.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
    {
      key: 'rendicion-de-cuentas',
      tag: 'Principio 4',
      numero: 4,
      titulo: 'Rendición de cuentas: legal no es lo mismo que correcto',
      detalle:
        'Un aviso genérico en la letra pequeña puede cumplir el mínimo legal y aun así no informar nada concreto. Vas a terminar construyendo, con tus propias manos, la respuesta que sí cumple los cuatro principios a la vez.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Entra al panel de responsabilidad de TecniMarket',
  ctaDetalle:
    'Se abre el panel de responsabilidad profesional: reconectas la brecha de 1,00 de la parada 1, emparejas cuatro principios reales con sus hechos, clasificas seis respuestas posibles de TecniMarket con el mismo predicado en todos los casos, distingues «legal» de «correcto», y cierras la unidad completa construyendo tú mismo la respuesta responsable. Equivocarte resta puntos; las mismas opciones se quedan activas para volver a intentar.',
};

export function EntradaEticaYRegulacion(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaEticaYRegulacion;
