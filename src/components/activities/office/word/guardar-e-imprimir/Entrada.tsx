'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../../n4/estudio/EntradaN4Base';
import { LabGuardarEImprimir } from './Lab';

/**
 * Entrada de `of-word-guardar-e-imprimir` — «Guardar, imprimir y PDF» (doc §36.4).
 *
 * Usa la plantilla de oro sin tocarla: video, tres datos, letrero, fichas de
 * color pleno, CTA gigante y ruta. Que la base viva en `n4/estudio` es sólo
 * historia —nació allí— y no la ata al Nivel 4: la ruta viaja en la
 * configuración, así que aquí es la del grado Básico de la sala de Word.
 *
 * Las cuatro fichas van en el orden en que la clase las necesita y ninguna dice
 * dónde está un botón. La primera es la de fondo —lo escrito no existe hasta que
 * se guarda—, la segunda separa Guardar de Guardar como, la tercera explica por
 * qué se mandan PDF y se guardan .docx, y la cuarta enseña a contar el papel
 * antes de gastarlo. Un alumno que se quede sólo con la primera ya no vuelve a
 * perder una tarea.
 */

/** Las tres clases exclusivas del grado Básico de la sala de Word. */
const RUTA_WORD_BASICO: PasoRuta[] = [
  { id: 'of-word-la-cinta', titulo: 'La cinta por dentro' },
  { id: 'of-word-parrafos-que-respiran', titulo: 'Párrafos que respiran' },
  { id: 'of-word-guardar-e-imprimir', titulo: 'Guardar, imprimir y PDF' },
];

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-word-guardar-e-imprimir',
  laboratorio: LabGuardarEImprimir,
  ruta: RUTA_WORD_BASICO,
  parada: 3,
  globo: 'Todo lo que escribes está en el aire hasta que lo guardas. Hoy vas a ver el momento exacto en que se salva.',
  arranqueSub:
    'Le pasa a todo el mundo una vez: dos horas de tarea, se va la luz, y no queda nada. No es mala suerte, es que el documento vive en la memoria hasta que tú lo guardas. Hoy vas a terminar el aviso de una salida escolar, lo vas a guardar con un nombre que sirva y en la carpeta que tú elijas, vas a sacar la copia en PDF que es la que se manda por teléfono, y vas a mirar cuántas hojas de papel gastan treinta copias antes de gastarlas.',
  stats: [
    { etiqueta: 'Encargos', valor: '8', acento: '#f5a524' },
    { etiqueta: 'Tipos de archivo', valor: '2', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Dónde vive tu trabajo',
  fichas: [
    {
      key: 'memoria',
      tag: 'Lo de fondo',
      numero: 1,
      titulo: 'Hasta que guardas, no existe',
      detalle:
        'Mientras escribes, tu documento sólo está en la memoria: una pizarra que se borra sola al apagar. Por eso arriba, junto al nombre del archivo, dice «Sin guardar» en cuanto tocas una tecla. Ese letrero es la diferencia entre tener la tarea y no tenerla.',
      img: 'ficha-memoria.webp',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'guardar-como',
      tag: 'Las dos formas',
      numero: 2,
      titulo: 'Guardar pisa; Guardar como crea',
      detalle:
        '«Guardar» escribe encima del archivo que ya existe, sin preguntar nada. «Guardar como» hace un archivo NUEVO y te pregunta tres cosas: cómo se llama, en qué carpeta va y de qué tipo es. El archivo viejo se queda donde estaba: no se mueve ni se borra.',
      img: 'ficha-guardar-como.webp',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'docx-pdf',
      tag: 'Los dos tipos',
      numero: 3,
      titulo: '.docx para ti, PDF para mandar',
      detalle:
        'El .docx es tu documento: se abre en Word y se sigue editando. El PDF es una foto del papel: se ve igual en cualquier teléfono aunque no tenga Word, pero ya no se toca. Por eso se manda el PDF y se guarda el .docx. Nunca al revés.',
      img: 'ficha-docx-pdf.webp',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
    {
      key: 'vista-previa',
      tag: 'Antes de imprimir',
      numero: 4,
      titulo: 'Mira el papel antes de gastarlo',
      detalle:
        'La vista previa te enseña las hojas en chiquito, tal como van a salir. Ahí se ve si el documento son una hoja o tres, y si la última lleva un solo renglón. Multiplica las hojas por las copias y ya sabes cuánto papel se va: 30 copias de dos hojas son 60.',
      img: 'ficha-vista-previa.webp',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  // El video y las láminas dependen de la campaña de videos, congelada en 8 de
  // 60 por decisión de Cristofer. La entrada lo dice en pantalla en vez de
  // cargar seis 404; el laboratorio no depende de ellos.
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Textos',
  ctaDetalle:
    'La ventana se convierte en el programa entero y a la derecha aparece tu maestro con el primer encargo. Vas a escribir en el aviso de la salida al Museo del Agua y a ver aparecer «Sin guardar»; después le pondrás nombre y carpeta, sacarás la copia en PDF y contarás las hojas en la vista previa. Aquí no sale papel de verdad ni se descarga nada: puedes probar sin miedo.',
};

export function EntradaGuardarEImprimir(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

/** Nombre corto, por si alguien la monta sin mirar el archivo. */
export const Entrada = EntradaGuardarEImprimir;

export default EntradaGuardarEImprimir;
