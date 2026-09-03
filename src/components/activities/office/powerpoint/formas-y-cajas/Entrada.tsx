'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { paradaPPT, rutaPPT } from '../comun/rutas';
import { LabFormasYCajas } from './Lab';

/**
 * Entrada de `of-ppt-formas-y-cajas` (doc §44.2).
 *
 * La ficha 1 es la que decide si la clase se entiende: **marcador o cuadro de
 * texto** parece un detalle de programa y es lo que separa una presentación que
 * se puede cambiar entera de una que hay que rehacer a mano.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-ppt-formas-y-cajas',
  laboratorio: LabFormasYCajas,
  ruta: rutaPPT('intermedio'),
  parada: paradaPPT('intermedio', 'of-ppt-formas-y-cajas'),
  globo: 'Esta diapositiva viene vacía. Lo que va dentro lo dibujas tú.',
  arranqueSub:
    'El laboratorio de ciencias pide un cartel del ciclo del agua, y la diapositiva llega en blanco: sin viñetas, sin cajas, sin nada. Hoy no vas a escribir una lista — vas a dibujar. Un cuadro de texto donde el diseño no puso ninguna caja, formas con su color de dentro y su raya, y una gota en 3D que se gira. Y por el camino los dos problemas que aparecen en cuanto hay dos cosas encima de la misma lámina: quién tapa a quién, y cómo se mueven juntas.',
  stats: [
    { etiqueta: 'Piezas', valor: '5', acento: '#22d3ee' },
    { etiqueta: 'Herramientas', valor: '4', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Lo que dibujas tú',
  fichas: [
    {
      key: 'marcador-o-cuadro',
      tag: 'La diferencia que importa',
      numero: 1,
      titulo: 'Marcador o cuadro de texto',
      detalle:
        'El marcador lo pone el diseño y lo manda el patrón: cambias el molde y obedece. El cuadro de texto lo pones tú donde quieras y el patrón no lo toca. Un cartel hecho todo de cuadros de texto se ve bien hoy y no hay quien lo cambie mañana.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'relleno-y-contorno',
      tag: 'Las formas',
      numero: 2,
      titulo: 'El dentro y la raya, aparte',
      detalle:
        'Cada forma tiene relleno —el color de dentro— y contorno —la raya de fuera—, y se eligen por separado. Por eso puede haber una forma sin relleno, que deja ver lo que hay detrás, o una línea, que sólo tiene raya.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'quien-tapa-a-quien',
      tag: 'Cuando hay dos',
      numero: 3,
      titulo: 'Quién tapa a quién, y qué va junto',
      detalle:
        'Lo último que dibujas queda encima: por eso un cartel se arma de atrás hacia adelante. Y cuando varias piezas son una sola cosa, se agrupan — así se mueven las tres o ninguna, y no se descolocan.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'cuando-3d',
      tag: 'El modelo 3D',
      numero: 4,
      titulo: 'Sirve si la cosa tiene lados',
      detalle:
        'Un objeto que se gira dentro de la diapositiva. No es un adorno: vale la pena cuando lo que explicas se entiende dándole la vuelta —un corazón, un motor, una pieza—. Si se entiende con una foto, la foto pesa menos.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Dibújalo',
  ctaDetalle:
    'Se abre «El agua que usamos.pptx» por la diapositiva 2, que está vacía a propósito. Formas está en Inicio → Dibujo; Cuadro de texto y Modelo 3D, en Insertar. Y en cuanto selecciones una forma verás aparecer a la derecha una pestaña que antes no estaba: «Formato de forma». Sale sola y se va sola, como en PowerPoint.',
};

export function EntradaFormasYCajas(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaFormasYCajas;

export default EntradaFormasYCajas;
