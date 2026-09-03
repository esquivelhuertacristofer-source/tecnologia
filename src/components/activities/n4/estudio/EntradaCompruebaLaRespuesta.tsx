'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, RUTA_N4U7 } from './EntradaN4Base';
import { LabCompruebaLaRespuesta } from './LabCompruebaLaRespuesta';

/**
 * Entrada de `n4-comprueba-la-respuesta` — N4 · U «Aprendo con la IA», parada 2
 * de 3 («Comparar la respuesta con otras fuentes»).
 *
 * Plantilla de oro sin tocarla: video, tres datos, letrero, fichas de color
 * pleno, CTA gigante y ruta. Usa `RUTA_N4U7`, la misma constante compartida que
 * ya usan las paradas 1 y 3 («Pregunta a la IA» y «¿Real o generado?»), y llama
 * al asistente **Tecnia Asistente** por el mismo motivo: es el nombre que la
 * parada 1 ya le puso al programa, y las tres paradas comparten ventana.
 *
 * Las cuatro fichas van en el orden en que el laboratorio las necesita: la
 * primera fija la idea central (una respuesta es un montón de afirmaciones,
 * no un bloque entero), la segunda dice CÓMO se comprueba de verdad, la
 * tercera enseña la trampa de las fuentes copiadas y la cuarta, la fuente que
 * se inventa. Un alumno que se quede sólo con la primera ya deja de tragarse
 * una respuesta entera.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n4-comprueba-la-respuesta',
  laboratorio: LabCompruebaLaRespuesta,
  ruta: RUTA_N4U7,
  parada: 2,
  globo: 'Sofi le preguntó algo a Tecnia Asistente para su tarea. Antes de copiarlo, vamos a comprobarlo juntos.',
  arranqueSub:
    'Abriste Tecnia Asistente, y al lado tienes Tecnia Buscador con varias páginas abiertas. El asistente ya contestó sobre los pulpos: cinco frases, todas dichas muy seguras. Una es falsa, y está escondida entre las buenas. Tu trabajo es comprobar cada frase por su cuenta, buscando en otro lado.',
  stats: [
    { etiqueta: 'Afirmaciones', valor: '5', acento: '#22d3ee' },
    { etiqueta: 'Fuentes', valor: '3', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Cómo se comprueba de verdad',
  fichas: [
    {
      key: 'trozos',
      tag: 'La idea central',
      numero: 1,
      titulo: 'No es todo o nada',
      detalle:
        'Una respuesta no es cierta o falsa entera: son varias frases, y cada una se revisa por su cuenta. Casi siempre hay cuatro buenas y una mala, escondida entre las buenas.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'otro-sitio',
      tag: 'Cómo se comprueba',
      numero: 2,
      titulo: 'En otro sitio, no con él',
      detalle:
        'Comprobar es buscar el dato en otra página, no volver a preguntarle al asistente. Si le preguntas otra vez, te dice lo mismo, esté bien o mal.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'copiadas',
      tag: 'La trampa',
      numero: 3,
      titulo: 'Copiada no es otra fuente',
      detalle:
        'Si dos páginas dicen la frase exacta, no son dos opiniones: una copió a la otra. Fíjate quién la escribió y de cuándo es.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
    {
      key: 'inventada',
      tag: 'Lo más difícil',
      numero: 4,
      titulo: 'Una fuente que suena perfecta',
      detalle:
        'El asistente puede inventarse un libro o una página que no existe de verdad. Pregunta de dónde lo sacó y búscalo: si no aparece en ningún lado, se lo inventó.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  // El video depende de la campaña, congelada en 8 de 60 por decisión de
  // Cristofer; la entrada lo dice en pantalla en vez de cargar un reproductor
  // roto. Las láminas de las fichas tampoco existen todavía.
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Asistente',
  ctaDetalle:
    'Vas a leer las cinco frases del asistente sobre los pulpos, comprobarlas una por una en Tecnia Buscador, cazar la que es falsa, y descubrir que el libro que recomendó no existe.',
};

export function EntradaCompruebaLaRespuesta(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaCompruebaLaRespuesta;
