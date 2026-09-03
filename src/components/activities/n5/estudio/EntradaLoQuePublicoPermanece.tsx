'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN5Base, ConfigEntradaN5, RUTA_N5_MI_HUELLA_DIGITAL } from './EntradaN5Base';
import { LabLoQuePublicoPermanece } from './LabLoQuePublicoPermanece';

/**
 * Entrada de N5·«Mi huella digital», parada 1 «Lo que publico permanece»
 * (currículo, unidad `n5-mi-huella-digital`). Nivel 5 = 5.º de Primaria,
 * 10–11 años: un año mayores que las paradas de N4·Estudio, así que el tono
 * sube un peldaño —hablan de "mi perfil" y "mi huella", no sólo de "lo que
 * veo en el muro"— pero sigue siendo el mismo programa: Bit, sin regaños.
 *
 * SIN 3D a propósito (regla de la casa): el laboratorio es «Tecnia Muro»,
 * pero esta vez es TU PROPIO muro —no el visor de publicaciones ajenas de
 * `n4-real-o-generado`—: publicas, y después intentas borrar.
 */

const CONFIG: ConfigEntradaN5 = {
  actividadId: 'n5-lo-que-publico-permanece',
  laboratorio: LabLoQuePublicoPermanece,
  ruta: RUTA_N5_MI_HUELLA_DIGITAL,
  parada: 1,
  globo:
    'Te presto Tecnia Muro, pero esta vez es TU perfil. Vas a publicar diez cosas… y luego vamos a intentar borrarlas.',
  arranqueSub:
    'Publicas diez veces a lo largo de una semana. Algunas se pueden borrar sin problema. Con otras, ya es tarde. Vas a descubrir la diferencia con tus propias manos.',
  stats: [
    { etiqueta: 'Publicaciones', valor: '10', acento: '#22d3ee' },
    { etiqueta: 'Huella buena', valor: '4', acento: '#34d399' },
    { etiqueta: 'Insignia', valor: '1', acento: '#fbbf24' },
  ],
  letrero: 'Antes de publicar nada',
  fichas: [
    {
      key: 'copia-tuya',
      tag: 'Lo que sí puedes',
      numero: 1,
      titulo: 'Borrar quita TU copia',
      detalle:
        'Cuando borras algo, desaparece de tu perfil. **Pero si alguien ya le tomó captura, lo compartió o lo guardó, esa copia sigue viva** — y ya no depende de ti.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'el-tiempo-importa',
      tag: 'La regla que sí sirve',
      numero: 2,
      titulo: 'El tiempo importa muchísimo',
      detalle:
        'Algo borrado a los diez segundos casi siempre se salva. **A los tres días, casi nunca.** Vas a probar las dos y a ver la diferencia tú misma.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'privado-no-tanto',
      tag: 'La sorpresa',
      numero: 3,
      titulo: 'Lo "privado" no lo es tanto',
      detalle:
        'Un grupo de veinte amigos son veinte personas con teléfono y con dedos. **No hace falta que nadie sea mala persona** para que algo salga de ahí.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'pregunta-antes',
      tag: 'La única que funciona',
      numero: 4,
      titulo: 'La pregunta que va ANTES',
      detalle:
        '¿Me molestaría que esto lo viera mi mamá, mi maestra o alguien dentro de cinco años? **Si la respuesta es sí, no se publica.** Es la única herramienta que actúa a tiempo.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Muro',
  ctaDetalle:
    'Publica diez cosas, deja pasar el tiempo, y después intenta borrarlas. Vas a ver qué se puede deshacer… **y qué ya no.** No todo es para preocuparse: también vas a construir una huella de la que sentirte orgullosa.',
  assetsPendientes: false,
};

export function EntradaLoQuePublicoPermanece(props: ActivityProps) {
  return <EntradaN5Base {...props} entrada={CONFIG} />;
}

export default EntradaLoQuePublicoPermanece;
