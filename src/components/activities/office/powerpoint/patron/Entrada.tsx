'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { paradaPPT, rutaPPT } from '../comun/rutas';
import { LabPatron } from './Lab';

/**
 * Entrada de `of-ppt-patron` (doc §43.4).
 *
 * La cuarta ficha no habla de PowerPoint a propósito: es la que convierte esta
 * clase en tres clases, y si no se dice en la entrada el alumno la juega
 * pensando que aprendió un truco de un programa.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-ppt-patron',
  laboratorio: LabPatron,
  ruta: rutaPPT('avanzado'),
  parada: paradaPPT('avanzado', 'of-ppt-patron'),
  globo: 'Doce títulos que no se leen. Los vas a arreglar tocando uno.',
  arranqueSub:
    'Tienes doce diapositivas y el título de todas está en un azul que no se ve con el proyector del salón. Cambiarlo doce veces son doce oportunidades de equivocarte, y te vas a equivocar en dos. Detrás de toda presentación hay una diapositiva que no se ve —el patrón— que dice de qué color y de qué tamaño es cada cosa, y de la que todas las demás heredan. Hoy la vas a abrir, la vas a tocar una sola vez, y vas a descubrir por qué una de las doce no obedece.',
  stats: [
    { etiqueta: 'Diapositivas', valor: '12', acento: '#22d3ee' },
    { etiqueta: 'Cambios', valor: '1', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'La diapositiva que no se ve',
  fichas: [
    {
      key: 'la-que-no-se-ve',
      tag: 'Lo que hay debajo',
      numero: 1,
      titulo: 'La que no se ve',
      detalle:
        'El patrón es una diapositiva que no se presenta y no se imprime. Sólo dice de qué color es el título, de qué tamaño, dónde va y qué letra tiene todo. Vive en Vista → Patrones.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'una-vez',
      tag: 'Lo que gana',
      numero: 2,
      titulo: 'Una vez, doce veces',
      detalle:
        'Cada diapositiva hereda lo que dice el patrón. Cambias el patrón una vez y cambian las doce a la vez, sin tocarlas. Con cuarenta, igual.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'la-que-no',
      tag: 'El misterio',
      numero: 3,
      titulo: 'Y la que no cambió',
      detalle:
        'Lo que tú tocaste a mano en una diapositiva ya no hereda. Se llama anulación y no es un defecto: es que le dijiste al programa «ésta la mando yo». Explica el «¿por qué no me cambia una?» que le pasa a todo el mundo.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'tres-programas',
      tag: 'Lo que de verdad aprendes',
      numero: 4,
      titulo: 'Lo mismo en Word y en la web',
      detalle:
        'Esta idea no es de PowerPoint. Es exactamente la de los estilos de Word y exactamente la de una clase de CSS en una página. Un sitio donde se decide, muchos sitios que obedecen. Quien la entiende una vez, la entiende en tres programas.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Tócalo una vez',
  ctaDetalle:
    'Se abre «Informe anual.pptx» con el panel «Quién hereda» a la derecha, que te dice de las doce cuál obedece al patrón y cuál no. Al entrar al patrón la ventana cambia de cara —la tira enseña una sola diapositiva y abajo sale una franja morada avisándote de dónde estás—; para volver, Vista → Normal. Y no busques un botón mágico en el panel: Restablecer está en la cinta, que es donde vive en el programa de verdad.',
};

export function EntradaPatron(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaPatron;

export default EntradaPatron;
