'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { paradaPPT, rutaPPT } from '../comun/rutas';
import { LabSmartArtYGraficos } from './Lab';

/**
 * Entrada de `of-ppt-smartart-y-graficos` (doc §43.2).
 *
 * Las cuatro fichas son las cuatro preguntas que hay que saber hacerle a un
 * texto, y la cuarta es la que da la clase: a veces la respuesta es «nada».
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-ppt-smartart-y-graficos',
  laboratorio: LabSmartArtYGraficos,
  ruta: rutaPPT('intermedio'),
  parada: paradaPPT('intermedio', 'of-ppt-smartart-y-graficos'),
  globo: 'Cinco diapositivas escritas todas en viñetas. Tres están pidiendo otra cosa.',
  arranqueSub:
    'Hay tres cosas que en viñetas se leen mal y dibujadas se entienden solas. Unos pasos que van en orden parecen cosas sueltas hasta que llevan flechas. Unas cantidades para comparar obligan al público a hacer la resta de cabeza hasta que son barras. Y un horario, donde lo que importa es el dato exacto, pide una tabla y no un gráfico. Hoy vas a coger la presentación del club de reciclaje y traducir tres diapositivas… y a dejar la cuarta exactamente como está, que es la parte difícil.',
  stats: [
    { etiqueta: 'Diapositivas', valor: '5', acento: '#22d3ee' },
    { etiqueta: 'Formas', valor: '3', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'La forma la manda el dato',
  fichas: [
    {
      key: 'proceso',
      tag: 'Pregunta 1',
      numero: 1,
      titulo: '¿Va en orden?',
      detalle:
        'Si son pasos que se hacen uno después de otro, eso es un proceso y se dibuja con flechas. SmartArt no es un adorno: es una lista a la que le pones la forma que tiene su idea.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'comparar',
      tag: 'Pregunta 2',
      numero: 2,
      titulo: '¿Se compara?',
      detalle:
        'Barras para comparar cantidades, líneas para ver cómo cambia algo con el tiempo, y pastel casi nunca: sólo si son partes de un mismo entero y sumadas dan el total.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'exacto',
      tag: 'Pregunta 3',
      numero: 3,
      titulo: '¿Importa el número exacto?',
      detalle:
        'Si lo que hace falta es «cuál es más grande», gráfico. Si lo que hace falta es «cuánto exactamente» o «a qué hora», tabla. Un gráfico de horarios no lo entiende nadie.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'a-veces-nada',
      tag: 'Pregunta 4',
      numero: 4,
      titulo: 'Y si la respuesta es «nada»',
      detalle:
        'Tres frases sueltas que no van en orden, no dependen unas de otras y no traen números son tres viñetas, y están bien así. Convertirlas en diagrama las empeora. Saber cuándo NO usar una herramienta es saber usarla.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Tradúcela',
  ctaDetalle:
    'Se abre «Club de reciclaje.pptx». Estrenas tres botones de Insertar que hasta hoy te decían «todavía no está en esta clase»: SmartArt, Gráfico y Tabla. Fíjate en dos cosas — se apagan cuando la diapositiva no tiene una lista que convertir, porque un diagrama no sale de la nada; y al convertir, las viñetas desaparecen del cuadro y aparecen DENTRO del dibujo. Si eliges mal, no pasa nada: selecciona el objeto y vuelve a pulsar el botón, y le cambia la forma sin perder el texto.',
};

export function EntradaSmartArtYGraficos(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaSmartArtYGraficos;

export default EntradaSmartArtYGraficos;
