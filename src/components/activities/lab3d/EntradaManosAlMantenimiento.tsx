'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, RUTA_N5U1, type ConfigEntradaN4 } from '../n4/estudio/EntradaN4Base';
import { LabManosAlMantenimiento } from './LabManosAlMantenimiento';

/**
 * Entrada de `n5-manos-al-mantenimiento` — N5·U1 «El sistema de cómputo»,
 * **parada 4 de 4** y cierre de la unidad (documento §53.2).
 *
 * **Cada cadena de este archivo está escrita para esta clase.** No se hereda
 * ninguna de la parada 2 aunque compartan equipo y armazón: allí se conectan
 * cables por fuera y aquí se abre el equipo por dentro, y una entrada que
 * repitiera los textos de la otra estaría mintiendo.
 *
 * Edad de referencia del tono: **10–11 años** (N5, 5.º de Primaria), leída en
 * `curriculo.ts`, no en el encargo.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n5-manos-al-mantenimiento',
  laboratorio: LabManosAlMantenimiento,
  ruta: RUTA_N5U1,
  parada: 4,
  globo:
    'El equipo del salón se apaga solo a los diez minutos, y no está roto: lleva dos años sin abrirse. Hoy lo abres tú, como se abre de verdad, y sin dejar un solo tornillo fuera.',
  arranqueSub:
    'Vas a hacer mantenimiento **de verdad**: fuera la corriente, descarga la estática, los dos tornillos, la tapa, el aire comprimido y la RAM. Y todo otra vez al revés, en orden.',
  stats: [
    { etiqueta: 'Pasos', valor: '10', acento: '#f5a524' },
    { etiqueta: 'Reglas de seguridad', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Antes de abrir nada',
  fichas: [
    {
      key: 'corriente-fuera',
      tag: 'Regla 1',
      numero: 1,
      titulo: 'Apagar no es suficiente',
      detalle:
        'Mientras el cable esté puesto, dentro del equipo sigue habiendo corriente. Lo primero de todo es **desconectarlo**, no apagarlo.',
      acento: { c: '#f5a524', deep: '#b45309' },
    },
    {
      key: 'estatica',
      tag: 'Regla 2',
      numero: 2,
      titulo: 'La electricidad que no sientes',
      detalle:
        'Tu cuerpo lleva carga estática y no la notas. Tocar el **metal del chasis** antes de tocar una pieza la descarga, y eso salva chips.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'polvo',
      tag: 'Lo que de verdad falla',
      numero: 5,
      titulo: 'El polvo tapa el aire',
      detalle:
        'Se pega a las aspas del ventilador y a las láminas del disipador. Sin aire, el procesador se calienta y el equipo **se apaga solo** para no dañarse.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'tornillos',
      tag: 'Regla 3',
      numero: 9,
      titulo: 'No se cierra dejando tornillos',
      detalle:
        'Un equipo cerrado a medias vibra, se vuelve a llenar de polvo y se recalienta. Los dos tornillos **vuelven a su agujero** antes de reconectar.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Entra al laboratorio 3D',
  ctaDetalle:
    'Desconecta, descarga la estática, quita los dos tornillos, abre, sopla el polvo del ventilador y del disipador, reasienta la RAM y **cierra sin dejar un solo tornillo fuera**.',
  assetsPendientes: false,
};

export function EntradaManosAlMantenimiento(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaManosAlMantenimiento;
