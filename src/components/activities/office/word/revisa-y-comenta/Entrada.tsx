'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../../n4/estudio/EntradaN4Base';
import { Lab } from './Lab';

/**
 * Entrada de `of-word-revisa-y-comenta` — «Revisa y comenta».
 *
 * Plantilla de oro sin tocarla: video, tres datos, letrero, fichas de color
 * pleno, CTA gigante y ruta. Que la base viva en `n4/estudio` es sólo historia
 * —nació allí—: la ruta viaja en la configuración, así que aquí es la del grado
 * Intermedio de la sala de Word y la parada es la 2.
 *
 * Las cuatro fichas van en el orden en que la clase las necesita y ninguna dice
 * dónde está el botón. La primera plantea el problema —el texto es de otra
 * persona—, la segunda es la que más vale y la que nadie enseña —el corrector no
 * puede ver las faltas que son palabras de verdad—, la tercera separa comentar
 * de corregir, y la cuarta explica por qué un cambio marcado es una propuesta.
 * Un alumno que se quede sólo con la segunda ya no vuelve a entregar un trabajo
 * fiándose del subrayado rojo.
 */

/** Las tres clases exclusivas del grado Intermedio de la sala de Word. */
const RUTA_WORD_INTERMEDIO: PasoRuta[] = [
  { id: 'of-word-estilos-e-indice', titulo: 'Estilos y tabla de contenido' },
  { id: 'of-word-revisa-y-comenta', titulo: 'Revisa y comenta' },
  { id: 'of-word-busca-y-reemplaza', titulo: 'Busca y reemplaza' },
];

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-word-revisa-y-comenta',
  laboratorio: Lab,
  ruta: RUTA_WORD_INTERMEDIO,
  parada: 2,
  globo: 'Hoy el texto no es tuyo. Vas a poder mejorarlo sin pisarlo.',
  arranqueSub:
    'En el laboratorio te espera la nota que Ana Sofía escribió para el periódico de la escuela, sobre la primera cosecha del huerto. No es tuya: sale el viernes con su nombre. Tiene faltas de ortografía, tiene una frase que no se entiende, y el maestro ya pasó por ahí y dejó dos cambios marcados esperando a que alguien diga que sí o que no. Ocho encargos para dejarla lista sin borrarle nada a nadie.',
  stats: [
    { etiqueta: 'Encargos', valor: '8', acento: '#f5a524' },
    { etiqueta: 'Herramientas', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Cómo se trabaja un texto entre varios',
  fichas: [
    {
      key: 'no-es-tuyo',
      tag: 'El problema',
      numero: 1,
      titulo: 'El texto es de otra persona',
      detalle:
        'Cuando revisas algo que escribió alguien más, borrar y escribir encima es lo peor que puedes hacer: el otro abre su archivo y ya no reconoce lo suyo, y ni siquiera sabe qué le tocaste. Word entero tiene una pestaña —Revisar— dedicada a este problema y a nada más.',
      img: 'ficha-no-es-tuyo.png',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'corrector',
      tag: 'El corrector',
      numero: 2,
      titulo: 'La raya roja no lo sabe todo',
      detalle:
        'El corrector compara cada palabra con una lista gigante y subraya las que no existen: «aser», «ke», «nesesita». Pero no entiende lo que quisiste decir. «Tubo» y «tuvo» existen las dos, y «aya», «halla» y «haya» también, así que ésas pasan limpias. Que no haya rayas rojas no quiere decir que esté bien escrito.',
      img: 'ficha-corrector.png',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'comentarios',
      tag: 'Los comentarios',
      numero: 3,
      titulo: 'Preguntar sin tocar',
      detalle:
        'A veces no sabes si algo está mal: sólo no lo entiendes. Para eso está el comentario. Seleccionas el trozo, escribes tu duda al margen y el texto se queda exactamente igual. Es la diferencia entre «te corrijo» y «te pregunto», y en un equipo esa diferencia lo es todo.',
      img: 'ficha-comentarios.png',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'control-de-cambios',
      tag: 'El control de cambios',
      numero: 4,
      titulo: 'Todo cambio es una propuesta',
      detalle:
        'Con el control de cambios encendido, lo que escribes sale de tu color y subrayado, y lo que borras se queda tachado en vez de desaparecer. Nada se pierde y todo lleva nombre. Después, quien recibe el documento acepta lo que le convence y rechaza lo demás, uno por uno.',
      img: 'ficha-control-de-cambios.png',
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
    'La ventana se convierte en el programa entero, a la derecha aparece tu maestro con el primer encargo y abajo se acopla el panel de revisión. Vas a encender el corrector y arreglar lo que subraye, a cazar tú la falta que el corrector no puede ver, a dejar un comentario con una duda, a escribir con tu color puesto y a decidir cuál de los dos cambios del maestro se queda. No vas a andar buscando botones: un aro naranja te marca el que toca desde el primer segundo y escribe su nombre debajo, y el maestro te dice para qué sirve antes de que lo pulses. Si aun así no lo ves, pulsa «Enséñamelo». Y si te equivocas de botón, te dice cuál tocaste y deshace el cambio, para que tu documento no se ensucie.',
};

export function Entrada(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default Entrada;
