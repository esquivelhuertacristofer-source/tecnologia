'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../../n4/estudio/EntradaN4Base';
import { Lab } from './Lab';

/**
 * Entrada de `of-word-parrafos-que-respiran` — «Párrafos que respiran».
 *
 * Plantilla de oro sin tocarla: video, tres datos, letrero, fichas de color
 * pleno, CTA gigante y ruta. Que la base viva en `n4/estudio` es sólo historia
 * —nació allí—: la ruta viaja en la configuración, así que aquí es la del grado
 * Básico de la sala de Word y la parada es la 2.
 *
 * Las cuatro fichas van en el orden en que la clase las necesita y ninguna dice
 * dónde está el botón. La primera nombra el problema —un muro de letras—, la
 * segunda da la herramienta que no está en la cinta —el Enter—, la tercera es el
 * corazón —el formato de párrafo actúa sobre el párrafo entero, no sobre lo que
 * seleccionaste— y la cuarta junta las dos que se ven menos, la alineación y la
 * sangría. Un alumno que se quede sólo con la tercera ya no vuelve a pelearse
 * con el interlineado.
 */

/** Las tres clases exclusivas del grado Básico de la sala de Word. */
const RUTA_WORD_BASICO: PasoRuta[] = [
  { id: 'of-word-la-cinta', titulo: 'La cinta por dentro' },
  { id: 'of-word-parrafos-que-respiran', titulo: 'Párrafos que respiran' },
  { id: 'of-word-guardar-e-imprimir', titulo: 'Guardar, imprimir y PDF' },
];

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-word-parrafos-que-respiran',
  laboratorio: Lab,
  ruta: RUTA_WORD_BASICO,
  parada: 2,
  globo: 'Un aviso que nadie lee no sirve de nada. Hoy vas a arreglar uno sin cambiarle ni una palabra.',
  arranqueSub:
    'En el laboratorio te espera un aviso de escuela de los que mandan a casa: está bien escrito, no le falta ningún dato y aun así nadie lo leería, porque viene todo pegado en un solo bloque. Tu trabajo no es reescribirlo: es darle aire. Vas a partirlo en párrafos, a separar sus renglones, a emparejarle los bordes y a meter el cuerpo hacia dentro con la sangría. Siete encargos, y al final el aviso va a decir exactamente lo mismo que ahora.',
  stats: [
    { etiqueta: 'Encargos', valor: '7', acento: '#f5a524' },
    { etiqueta: 'Herramientas', valor: '4', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Por qué un texto se lee o no se lee',
  fichas: [
    {
      key: 'muro',
      tag: 'El problema',
      numero: 1,
      titulo: 'Un muro de letras',
      detalle:
        'Un texto sin separaciones no se lee: se salta. Y no es culpa de quien lo lee. Los ojos necesitan sitios donde descansar y donde volver a arrancar, y si no los hay se pierden de renglón. El aviso mejor escrito del mundo, puesto todo junto, no lo lee nadie.',
      img: 'ficha-muro.webp',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'parrafos',
      tag: 'Los párrafos',
      numero: 2,
      titulo: 'Una idea, un párrafo',
      detalle:
        'La primera herramienta del día no está en la cinta: es la tecla Enter. Cada vez que empiezas a hablar de otra cosa —de la hora, del dinero, de lo que hay que llevar— eso es un párrafo nuevo. Separarlos es lo que convierte un bloque en algo que se puede recorrer.',
      img: 'ficha-parrafos.webp',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'interlineado',
      tag: 'El interlineado',
      numero: 3,
      titulo: 'Manda el cursor, no la palabra',
      detalle:
        'El interlineado es el espacio entre un renglón y el siguiente. Y aquí está la trampa que confunde a todo el mundo: se aplica al PÁRRAFO donde tienes el cursor, no a la palabra que seleccionaste. Si quieres cambiarlo todo, primero hay que seleccionarlo todo.',
      img: 'ficha-interlineado.webp',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'bordes',
      tag: 'Bordes y margen',
      numero: 4,
      titulo: 'Alineación y sangría',
      detalle:
        'La alineación decide por dónde quedan parejos los renglones: pegados a la izquierda, centrados, a la derecha, o justificados —rectos por los dos lados—. La sangría mete el párrafo hacia dentro y lo separa del borde, para que se vea de un golpe dónde empieza y dónde acaba. Las dos son del párrafo entero.',
      img: 'ficha-bordes.webp',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
  ],
  // El video y las láminas dependen de la campaña de videos, congelada en 8 de
  // 60 por decisión de Cristofer. La entrada lo dice en pantalla en vez de
  // cargar seis 404; el laboratorio no depende de ellos.
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Textos',
  ctaDetalle:
    'La ventana se convierte en el programa entero y a la derecha aparece tu maestro con el primer encargo, que es sólo leer. Después vas a partir el aviso con el Enter, a abrirle el interlineado a todo de una sola vez, a emparejar los bordes y a ponerle sangría a los párrafos… y al título no. No vas a andar buscando botones: un aro naranja te marca el que toca desde el primer segundo y escribe su nombre debajo, y el maestro te dice para qué sirve antes de que lo pulses. Si aun así no lo ves, pulsa «Enséñamelo». Y si te equivocas de botón, te dice cuál tocaste y deshace el cambio, para que tu documento no se ensucie.',
};

export function Entrada(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default Entrada;
