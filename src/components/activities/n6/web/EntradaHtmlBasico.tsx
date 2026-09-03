'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { RUTA_N6_WEB } from './rutaWeb';
import { LabHtmlBasico } from './LabHtmlBasico';

/**
 * Entrada de `n6-html-basico` — N6·«Mi primera página web», parada 2
 * (documento §51.2). Tono de **11–12 años** (N6, 6.º de Primaria).
 *
 * Cadenas propias, revisadas una a una: esta entrada habla de llenar un body
 * vacío con cinco etiquetas, no de abrir una página ya hecha (eso es la
 * parada 1) ni de publicarla (la 3).
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n6-html-basico',
  laboratorio: LabHtmlBasico,
  ruta: RUTA_N6_WEB,
  parada: 2,
  globo:
    'Ya sabes que una página es texto. Hoy escribes tú el texto: cinco etiquetas y ya está hecha. Título, párrafo, lista, imagen y enlace — con eso está montada casi cualquier página que abras.',
  arranqueSub:
    'Tu página llega **vacía por dentro** y la llenas etiqueta por etiqueta. Vas a poner una lista sin escribir ni una viñeta, una foto contando lo que se ve en ella, y un enlace que dice a dónde lleva.',
  stats: [
    { etiqueta: 'Encargos', valor: '7', acento: '#fbbf24' },
    { etiqueta: 'Etiquetas', valor: '5', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Las cinco que lo sostienen todo',
  fichas: [
    {
      key: 'titulos-y-parrafos',
      tag: 'Lo que se lee',
      numero: 1,
      titulo: 'Títulos y párrafos',
      detalle:
        '«h1» es el título grande y sólo va uno; «h2» son los subtítulos; «p» es un párrafo. **El navegador les da su tamaño y su espacio él solo.**',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'listas',
      tag: 'Lo que se enumera',
      numero: 2,
      titulo: 'Las viñetas no se escriben',
      detalle:
        'Una lista es un «ul» con varios «li» dentro. **Los puntitos aparecen solos**: tú dices que es una lista, y el navegador la dibuja como lista.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'imagen-con-alt',
      tag: 'La regla que casi nadie cumple',
      numero: 3,
      titulo: 'Toda imagen se cuenta con palabras',
      detalle:
        'El «alt» es lo que lee en voz alta un lector de pantalla. **La foto funciona igual sin él** — y por eso hay que acordarse: no todo lo que funciona está bien hecho.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'enlaces',
      tag: 'La otra regla',
      numero: 4,
      titulo: 'Un enlace que diga «aquí» no dice nada',
      detalle:
        'El texto del enlace es el cartel de la puerta: **tiene que decir a dónde lleva**. «La Feria de Ciencias», no «pincha aquí».',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el proyecto',
  ctaDetalle:
    'Tu página llega con la cabecera puesta y el cuerpo vacío. **Escribes tú las cinco etiquetas**, una por encargo, y la ves crecer a la derecha mientras tecleas. Al final la dejas ordenada de arriba abajo.',
  assetsPendientes: false,
};

export function EntradaHtmlBasico(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaHtmlBasico;
