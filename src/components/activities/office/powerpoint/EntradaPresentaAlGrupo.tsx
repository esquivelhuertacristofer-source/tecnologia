'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../n4/estudio/EntradaN4Base';
import { LabPresentaAlGrupo } from './LabPresentaAlGrupo';

/**
 * Entrada de `n4-presenta-al-grupo` (doc §27.3).
 *
 * Las cuatro fichas son las cuatro cosas que separan a quien presenta de quien
 * lee: las notas, el ritmo, la mirada y el cierre. Ninguna dice dónde está un
 * botón — en esta parada casi no hay botones que aprender, y ése es el punto.
 */

const RUTA_N4_U5: PasoRuta[] = [
  { id: 'n4-tus-primeras-diapositivas', titulo: 'Tus primeras diapositivas' },
  { id: 'n4-imagenes-y-texto', titulo: 'Imágenes y texto que se entienden' },
  { id: 'n4-presenta-al-grupo', titulo: 'Presenta frente al grupo' },
];

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n4-presenta-al-grupo',
  laboratorio: LabPresentaAlGrupo,
  ruta: RUTA_N4_U5,
  parada: 3,
  globo: 'Hoy presentas tú. Yo me siento en primera fila y el público… ya llegó.',
  arranqueSub:
    'Tu presentación del desierto está terminada y hoy no vas a tocarla: hoy la vas a dar. Primero preparas lo que NO se ve —tus notas del presentador, que lees tú y el público no—, después ensayas las cuatro a pantalla completa hasta llevar buen ritmo, y al final se abre el telón. El salón está a oscuras, la pantalla enciende la sala y sesenta personas te están mirando desde las butacas. Ahí van cuatro decisiones en vivo, y ninguna de ellas lleva aro: eso lo eliges tú.',
  stats: [
    { etiqueta: 'Diapositivas', valor: '4', acento: '#22d3ee' },
    { etiqueta: 'Decisiones', valor: '4', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'La función',
  fichas: [
    {
      key: 'las-notas',
      tag: 'Clave 1',
      numero: 1,
      titulo: 'Las notas',
      detalle:
        'Son lo que tú lees y el público no ve. Ahí va lo que vas a decir con tus palabras; en la pantalla va sólo la idea corta. Con notas no tienes que memorizar nada ni llenar la diapositiva de texto.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'tu-ritmo',
      tag: 'Clave 2',
      numero: 2,
      titulo: 'Tu ritmo',
      detalle:
        'No se corren las diapositivas a toda velocidad ni se deja una eternidad. Cada una dura lo que tardas en explicarla, y tú decides cuándo avanzar, no ella.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'mira-al-publico',
      tag: 'Clave 3',
      numero: 3,
      titulo: 'Mira al público',
      detalle:
        'Es la más importante. Si te das la vuelta a leer la pantalla, tu voz se va hacia atrás y nadie te oye. La pantalla está para ellos; tú te apoyas en tus notas.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'el-cierre',
      tag: 'Clave 4',
      numero: 4,
      titulo: 'El cierre',
      detalle:
        'Casi nadie lo prepara y cambia todo: terminar diciendo «eso fue todo, ¿tienen alguna pregunta?» y esperar. Presentar no es leer, es contar algo que sabes a gente que te está escuchando.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
  ],
  // El video sigue congelado con la campaña (8 de 60), y las cuatro láminas de
  // estas fichas tampoco están sacadas por krea2: declarar `img` sin el archivo
  // son cuatro huecos grises y cuatro peticiones 400.
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Sal al escenario',
  ctaDetalle:
    'Se abre tu presentación del desierto tal como la dejaste. Primero decides qué va en la pantalla y qué en tus notas, y escribes las tres que faltan —la 2 ya trae las suyas de la clase pasada—. Después abres Presentación → Desde el principio y ensayas las cuatro con un medidor de ritmo que se pone ámbar si vas corriendo o si te eternizas; repetir no te quita puntos. Y entonces se hace de noche en el salón: butacas llenas, tu atril con tus notas encima y la pantalla encendida a tu espalda. Cuatro decisiones. Si te das la vuelta a leer, lo vas a oír.',
};

export function EntradaPresentaAlGrupo(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaPresentaAlGrupo;
