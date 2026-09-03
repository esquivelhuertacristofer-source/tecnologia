'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, ConfigEntradaN4, RUTA_N4U7 } from './EntradaN4Base';
import { LabRealOGenerado } from './LabRealOGenerado';

/**
 * Entrada de N4·U7 «Aprendo con la IA», parada 3 «Real o generado: primeras
 * pistas» (currículo, unidad `n4-aprendo-con-la-ia`). Nivel 4 = 4° de
 * Primaria, 9–10 años: el tono y los ejemplos son de esa edad, no de
 * secundaria — un animal increíble, un récord, un lugar, un personaje.
 *
 * SIN 3D a propósito (regla de la casa): el laboratorio es «Tecnia Muro», un
 * visor de publicaciones —como el de una red social— dentro de la propia
 * plataforma. Ni mueble, ni escena, ni mesa: se abre la app y ya.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n4-real-o-generado',
  laboratorio: LabRealOGenerado,
  ruta: RUTA_N4U7,
  parada: 3,
  globo:
    'Te presto Tecnia Muro, mi visor de publicaciones. Tú decides cuáles compartes… y cuáles no.',
  arranqueSub:
    'Diez publicaciones te esperan: animales, récords, lugares y personajes. Algunas mienten sin estar retocadas. Otras están hechas por computadora y no le mienten a nadie. Tú decides.',
  stats: [
    { etiqueta: 'Publicaciones', valor: '10', acento: '#22d3ee' },
    { etiqueta: 'Herramientas', valor: '3', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Antes de abrir el visor',
  fichas: [
    {
      key: 'pistas-imagen',
      tag: 'Sirven hoy',
      numero: 1,
      titulo: 'Mira la imagen',
      detalle:
        'Manos con dedos de más, letras que no se leen, fondos repetidos, orejas raras, piel demasiado perfecta. **Esas pistas funcionan hoy… pero caducan.**',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'no-caduca',
      tag: 'La que no caduca',
      numero: 2,
      titulo: 'Pregunta de dónde salió',
      detalle:
        'Quién lo publicó, desde cuándo tiene esa cuenta, y si alguien más lo cuenta. **Eso no caduca nunca, y es el corazón de esta clase.**',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'foto-real-miente',
      tag: 'El caso que nadie enseña',
      numero: 3,
      titulo: 'Una foto real también miente',
      detalle:
        'Sin retocar ni generar nada: **una foto real de otro país y de hace años, publicada como si fuera de aquí y de ahora mismo.**',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'generado-no-es-falso',
      tag: 'Y al revés',
      numero: 4,
      titulo: 'Generado no es lo mismo que falso',
      detalle:
        'Una ilustración hecha por computadora no engaña a nadie si te dicen que es una ilustración. **Lo que importa es si te lo cuentan tal como es.**',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Muro',
  ctaDetalle:
    'Recorre las diez publicaciones del visor, usa las herramientas que se van desbloqueando y decide, una por una: compartir, no compartir, o decir que no estás segura. **No saber también puede ser la respuesta correcta.**',
  assetsPendientes: false,
};

export function EntradaRealOGenerado(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaRealOGenerado;
