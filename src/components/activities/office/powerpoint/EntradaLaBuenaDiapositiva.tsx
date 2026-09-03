'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../n4/estudio/EntradaN4Base';
import { LabLaBuenaDiapositiva } from './LabLaBuenaDiapositiva';

/**
 * Entrada de `n5-la-buena-diapositiva` (doc §42.3).
 *
 * Las cuatro fichas son las cuatro que de verdad se juegan en la clase, y la
 * última es la que la cierra: **hay dos reglas que ningún programa puede
 * marcar por ti**. Un alumno que salga de aquí creyendo que «no tiene errores»
 * significa «está bien» no ha aprendido a revisar; ha aprendido a obedecer a
 * una lista.
 */

const RUTA_N5_U2: PasoRuta[] = [
  { id: 'n5-transiciones-con-proposito', titulo: 'Transiciones con propósito' },
  { id: 'n5-audio-e-imagenes', titulo: 'Audio e imágenes' },
  { id: 'n5-la-buena-diapositiva', titulo: 'Las reglas de la buena diapositiva' },
];

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n5-la-buena-diapositiva',
  laboratorio: LabLaBuenaDiapositiva,
  ruta: RUTA_N5_U2,
  parada: 3,
  globo: 'Diego la volvió a romper la noche antes de entregar. Tú vas a ser quien la revise.',
  arranqueSub:
    'Ésta no es una clase de construir: es la de REVISAR. A la derecha del lienzo tienes una ficha con siete reglas, y ya trae marcado lo que un programa puede leer solo: si hay demasiadas palabras, si la letra es chica, si el color se despega del fondo. Lo primero que vas a hacer es mirar, con las manos quietas, y encontrar los tres defectos que tiene la presentación de Diego. Después los arreglas: una diapositiva que cuenta dos cosas y hay que partir en dos, tres tarjetas puestas a ojo que hay que alinear y repartir, y un cierre con la letra clara sobre fondo claro que no se lee desde la tercera fila.',
  stats: [
    { etiqueta: 'Reglas', valor: '7', acento: '#22d3ee' },
    { etiqueta: 'Arreglos', valor: '4', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'La lista de antes de entregar',
  fichas: [
    {
      key: 'primero-mirar',
      tag: 'Clave 1',
      numero: 1,
      titulo: 'Primero mirar, luego tocar',
      detalle:
        'Arreglar y revisar a la vez es como se pasa por alto la mitad. Recorre las siete diapositivas con la ficha abierta y apunta qué le pasa a cada una ANTES de mover nada. Es lo que hace un profesional y no tarda ni dos minutos.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'una-idea',
      tag: 'Clave 2',
      numero: 2,
      titulo: 'Dos ideas son dos diapositivas',
      detalle:
        'Se ve en el título antes que en el cuerpo: si para decirlo necesitas la palabra «y», ahí hay dos. Partir en dos no es tirar nada — las viñetas se reparten, y de paso tienes el doble de tiempo para explicarlas.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'a-ojo-nunca-sale',
      tag: 'Clave 3',
      numero: 3,
      titulo: 'A ojo nunca sale',
      detalle:
        'Tres tarjetas con el contenido perfecto se ven como un error si cada una empieza a una altura distinta. Alinear y distribuir son dos clics: seleccionas las tres con Shift y el programa las pone a la misma raya y a la misma distancia.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'dos-no-se-marcan-solas',
      tag: 'Clave 4',
      numero: 4,
      titulo: 'Dos casillas se quedan vacías',
      detalle:
        'De las siete reglas, cinco las marca sola la ficha. «Una sola idea» y «la imagen apoya» no: ningún programa puede juzgarlas por ti. Que la lista se quede a medias es la clase — pasar la revisión automática no es estar bien.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Revísala tú',
  ctaDetalle:
    'Se abre «Volcanes de Diego · entrega.pptx» tal como la dejó la noche antes de entregar, y a la derecha del lienzo aparece la ficha de revisión con las siete reglas. Pulsa cada diapositiva en la lista y mira su semáforo: las que fallan algo salen en ámbar con el número de fallos. Estrenas Inicio → Dibujo → Organizar y el Shift para seleccionar tres cosas a la vez. Al final, repásalas a pantalla completa y hazte la prueba de los tres segundos.',
};

export function EntradaLaBuenaDiapositiva(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaLaBuenaDiapositiva;
