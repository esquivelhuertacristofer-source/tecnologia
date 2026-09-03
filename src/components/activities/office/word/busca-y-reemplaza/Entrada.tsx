'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../../n4/estudio/EntradaN4Base';
import { Lab } from './Lab';

/**
 * Entrada de `of-word-busca-y-reemplaza` — «Busca y reemplaza».
 *
 * Plantilla de oro sin tocarla: video, tres datos, letrero, fichas de color
 * pleno, CTA gigante y ruta. La ruta es la del grado Intermedio de la sala de
 * Word, y ésta es su tercera parada.
 *
 * Las cuatro fichas van en el orden en que la clase las necesita, y ninguna
 * enseña «dónde está el botón». La primera dice que buscar es leer por ti; la
 * segunda —que es el corazón— dice que la herramienta no entiende palabras sino
 * tiras de letras; la tercera separa las dos casillas, que es lo que decide si
 * el documento sobrevive; y la cuarta enseña que un reemplazo masivo se desanda
 * en un clic. Un alumno que se quede sólo con la segunda ya sabe por qué esta
 * herramienta da miedo.
 */

/** Las tres clases exclusivas del grado Intermedio de la sala de Word. */
const RUTA_WORD_INTERMEDIO: PasoRuta[] = [
  { id: 'of-word-estilos-e-indice', titulo: 'Estilos y tabla de contenido' },
  { id: 'of-word-revisa-y-comenta', titulo: 'Revisa y comenta' },
  { id: 'of-word-busca-y-reemplaza', titulo: 'Busca y reemplaza' },
];

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-word-busca-y-reemplaza',
  laboratorio: Lab,
  ruta: RUTA_WORD_INTERMEDIO,
  parada: 3,
  globo: 'Hoy vas a romper un documento a propósito. Y a arreglarlo en un clic.',
  arranqueSub:
    'Tienes el guion de la obra del festival, dos hojas, y la maestra acaba de decir que el personaje ya no se llama Sol sino Luna. Sale ocho veces: cambiarlo a mano es una lata y además se te va a olvidar alguno. Word lo hace de un jalón… y si lo pulsas sin mirar, se lleva por delante palabras que nadie te pidió tocar. En el laboratorio te esperan ocho encargos para verlo pasar y para aprender a que no vuelva a pasar.',
  stats: [
    { etiqueta: 'Encargos', valor: '8', acento: '#f5a524' },
    { etiqueta: 'Hojas', valor: '2', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Cambiar una palabra en todas partes',
  fichas: [
    {
      key: 'buscar',
      tag: 'Buscar',
      numero: 1,
      titulo: 'Que lea él, no tú',
      detalle:
        'Escribes una palabra y Word te marca de amarillo TODAS las veces que aparece, en las veinte hojas que haga falta, y te dice cuántas son. Es la diferencia entre revisar un trabajo en diez segundos y revisarlo renglón por renglón.',
      img: 'ficha-buscar.webp',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'tiras-de-letras',
      tag: 'El truco sucio',
      numero: 2,
      titulo: 'No busca palabras: busca letras',
      detalle:
        'Si escribes «sol», Word marca el nombre Sol, el sol del cielo y también el trozo que está escondido dentro de «solamente». Para él son la misma tira de tres letras. Ahí empiezan todos los desastres de esta herramienta.',
      img: 'ficha-tiras.webp',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'casillas',
      tag: 'Las dos casillas',
      numero: 3,
      titulo: 'Lo que separa arreglar de romper',
      detalle:
        'Están escondidas detrás de un botón que dice «Más >>» y casi nadie lo pulsa. «Sólo palabras completas» le manda mirar lo que hay antes y después: si toca otra letra, no cuenta. «Coincidir mayúsculas y minúsculas» hace que Sol y sol dejen de ser lo mismo. Dos clics que deciden si el documento sobrevive.',
      img: 'ficha-casillas.webp',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'deshacer',
      tag: 'La red',
      numero: 4,
      titulo: 'Doce cambios, un solo deshacer',
      detalle:
        'Reemplazar todos parece de no retorno, y no lo es: los cambios se hacen de una vez, así que una sola flecha de deshacer los devuelve todos. Lo que hay que aprender es a mirar la hoja justo después, no dos horas más tarde.',
      img: 'ficha-deshacer.webp',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
  ],
  // El video y las láminas dependen de la campaña de videos, congelada en 8 de
  // 60 por decisión de Cristofer. La entrada lo dice en pantalla en vez de
  // cargar seis 404; el laboratorio no depende de ellos.
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el guion de la obra',
  ctaDetalle:
    'La ventana se convierte en Word y a la derecha aparece tu maestro con el primer encargo. Vas a encontrar el buscador donde de verdad está, vas a reemplazar sin mirar y vas a ver cómo «solamente» se convierte en «lunaamente», lo vas a deshacer entero de un clic y lo vas a repetir con las casillas puestas. Al final, un truco para saltar a la página 2 sin arrastrar la barra.',
};

export function Entrada(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default Entrada;
