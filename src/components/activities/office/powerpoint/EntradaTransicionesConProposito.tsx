'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../n4/estudio/EntradaN4Base';
import { LabTransicionesConProposito } from './LabTransicionesConProposito';

/**
 * Entrada de `n5-transiciones-con-proposito` (doc §42.1).
 *
 * Primera entrada de N5·U2 y primera de la unidad que **no es del alumno**: la
 * presentación que va a arreglar es de Diego. Las cuatro fichas son las cuatro
 * distinciones que la clase entera necesita —entre o dentro, cuántas sobran,
 * enseñar por partes y quién manda el ritmo— y ninguna dice dónde está un
 * botón: lo que se aprende aquí es criterio, y el criterio no tiene domicilio.
 *
 * El molde es el de N4 y se reutiliza tal cual: `EntradaN4Base` no sabe de
 * niveles, sabe de rutas y paradas. Lo que cambia es la ruta.
 */

const RUTA_N5_U2: PasoRuta[] = [
  { id: 'n5-transiciones-con-proposito', titulo: 'Transiciones con propósito' },
  { id: 'n5-audio-e-imagenes', titulo: 'Audio e imágenes' },
  { id: 'n5-la-buena-diapositiva', titulo: 'Las reglas de la buena diapositiva' },
];

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n5-transiciones-con-proposito',
  laboratorio: LabTransicionesConProposito,
  ruta: RUTA_N5_U2,
  parada: 1,
  globo: 'Diego le puso efecto a todo. Vas a quitar casi todos, y a dejar los dos que sirven.',
  arranqueSub:
    'Diego, de 5° A, hizo una presentación sobre los volcanes de México y le puso una transición a cada una de las seis diapositivas, más un título que entra solo. Antes de tocar nada la vas a ver entera a pantalla completa, y vas a sentir lo que siente el salón. Después la arreglas: se quedan las transiciones que avisen de algo —tú decides cuáles— y se va el adorno. Y al final haces lo contrario: animas un corte de volcán por partes, para que el público mire la que estás nombrando en vez de leerse el diagrama entero mientras hablas.',
  stats: [
    { etiqueta: 'Diapositivas', valor: '6', acento: '#22d3ee' },
    { etiqueta: 'Efectos', valor: '7', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Que se mueva lo que ayuda',
  fichas: [
    {
      key: 'entre-o-dentro',
      tag: 'Clave 1',
      numero: 1,
      titulo: 'Entre o dentro',
      detalle:
        'Una transición es lo que pasa ENTRE dos diapositivas. Una animación es lo que se mueve DENTRO de una. Son cosas distintas, se confunden siempre, y las dos tienen la misma regla: si no ayuda a entender, sobra.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'casi-todas-sobran',
      tag: 'Clave 2',
      numero: 2,
      titulo: 'Casi todas sobran',
      detalle:
        'Una transición sirve para una sola cosa: avisar de que empieza una parte nueva. Puesta en todas no avisa de nada, marea, y encima te roba medio segundo cada vez. Se pone donde cambia el tema y en ningún otro sitio.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
    {
      key: 'por-partes',
      tag: 'Clave 3',
      numero: 3,
      titulo: 'Por partes',
      detalle:
        'Ahí está el buen uso: enseñar por partes algo que junto es demasiado. Si el corte del volcán aparece entero, el público se lo lee solo y deja de escucharte; si aparece la cámara cuando hablas de la cámara, mira lo que estás diciendo.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'tu-mandas',
      tag: 'Clave 4',
      numero: 4,
      titulo: 'Tú mandas',
      detalle:
        'Cada animación se dispara al clic o «con la anterior». Al clic mandas tú y cada parte sale cuando la explicas; con la anterior manda la máquina y te deja hablando encima de algo que ya salió. Casi siempre, al clic.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  // Ni el video (la campaña sigue congelada en 8 de 60) ni las cuatro láminas
  // de las fichas están sacados todavía. Declarar `img` sin archivo son cuatro
  // huecos grises y cuatro peticiones fallidas.
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre la de Diego',
  ctaDetalle:
    'Se abre «Volcanes de Diego.pptx» con los siete efectos puestos. Primero la ves entera a pantalla completa —seis diapositivas, seis transiciones—. Después estrenas la pestaña Transiciones para quitar las que sobran, y la de Animaciones para quitarle el adorno a la portada. Y al final animas los cuatro rótulos del corte del volcán en el orden en que sube el magma: la cámara, la chimenea, el cráter y el cono. Si te equivocas de orden, el Panel de animación los sube y los baja. Al terminar la vuelves a abrir y la ves funcionar.',
};

export function EntradaTransicionesConProposito(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaTransicionesConProposito;
