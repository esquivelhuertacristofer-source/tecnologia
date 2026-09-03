'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { paradaPPT, rutaPPT } from '../comun/rutas';
import { LabInteractiva } from './Lab';

/**
 * Entrada de `of-ppt-interactiva` (doc §43.5).
 *
 * La ficha 4 es la que hace que la clase valga fuera de PowerPoint: «si se
 * pueden ir, tienen que poder volver» es la regla de cualquier menú, y sin
 * decirla en la entrada el alumno juega creyendo que aprendió un truco.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-ppt-interactiva',
  laboratorio: LabInteractiva,
  ruta: rutaPPT('avanzado'),
  parada: paradaPPT('avanzado', 'of-ppt-interactiva'),
  globo: 'El quiosco del museo. Quien lo mire decide por dónde va.',
  arranqueSub:
    'Todo lo que has hecho hasta hoy va hacia adelante: uno, dos, tres. Pero hay presentaciones que no se ven así — un quiosco en la feria de ciencias, donde cada quien toca lo que le interesa. Hoy vas a armar uno: un menú con tres botones y tres secciones. Y vas a descubrir, en carne propia, el error número uno de todos los menús del mundo: dejar entrar a alguien a un sitio del que no puede salir.',
  stats: [
    { etiqueta: 'Secciones', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Botones', valor: '6', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Si se pueden ir, tienen que poder volver',
  fichas: [
    {
      key: 'un-menu',
      tag: 'Lo que casi nadie sabe',
      numero: 1,
      titulo: 'Un vínculo que no va a internet',
      detalle:
        'Un vínculo puede llevar a una página, sí. Pero también a otra diapositiva de la misma presentación, y eso es lo que convierte una diapositiva cualquiera en un menú.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'ida-y-vuelta',
      tag: 'El error de todos',
      numero: 2,
      titulo: 'El callejón',
      detalle:
        'Entraron a Volcanes y ahora no pueden salir: llegaron saltando y no hay ningún botón que los devuelva. Un menú sin regreso no es un menú, es una trampa.',
      acento: { c: '#f87171', deep: '#991b1b' },
    },
    {
      key: 'tres-publicos',
      tag: 'Lo que te ahorra',
      numero: 3,
      titulo: 'Tres públicos, un archivo',
      detalle:
        'Una presentación personalizada es una lista con nombre: «de estas siete, la 1, la 5 y la 6». La misma presentación sirve para el jurado, para los papás y para la clase sin hacer tres archivos.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'cualquier-menu',
      tag: 'Lo que de verdad aprendes',
      numero: 4,
      titulo: 'La regla de cualquier menú',
      detalle:
        'Si el público se puede ir por su cuenta, tiene que poder volver. No es de PowerPoint: es de cualquier página web, de cualquier aplicación y de cualquier menú que hagas en tu vida.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Arma el quiosco',
  ctaDetalle:
    'Se abre «Quiosco del museo.pptx» con el menú ya dibujado y sus tres botones muertos, y a la derecha el mapa del quiosco: te dice a dónde lleva cada diapositiva y marca en rojo las que son un callejón. El mapa no trae botón de arreglar a propósito — dice qué pasa; arreglarlo es tuyo. Y ojo: en el lienzo de trabajo los vínculos no saltan. Sólo saltan presentando, igual que en el programa de verdad.',
};

export function EntradaInteractiva(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaInteractiva;

export default EntradaInteractiva;
