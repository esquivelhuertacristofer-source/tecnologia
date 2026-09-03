'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { paradaExcel, rutaExcel } from '../comun/rutas';
import { LabDashboard } from './Lab';

/**
 * Entrada de `of-excel-dashboard` (bloque 58) — la última parada de la sala.
 *
 * La ruta y la parada salen de `rutaExcel('avanzado')` y `paradaExcel(...)`,
 * **derivadas** de `EJERCICIOS_OFFICE` y no escritas a mano: es exactamente por
 * esto por lo que `comun/rutas.ts` existe —cinco de las seis entradas de
 * PowerPoint acabaron mintiendo por copiar la lista—, y la última clase de una
 * sala es la que más se beneficia: la suya sería la copia más larga de todas.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-excel-dashboard',
  laboratorio: LabDashboard,
  ruta: rutaExcel('avanzado'),
  parada: paradaExcel('avanzado', 'of-excel-dashboard'),
  globo: 'Cinco minutos, una pantalla y una directora que no va a preguntar. Lo que no esté ahí, no existe.',
  arranqueSub:
    'Mañana hay junta y le tienes que enseñar a la directora, en una sola pantalla, cómo le fue a la cooperativa este semestre. No va a desplazarse, no va a abrir otra hoja y no va a preguntar. Hoy no se estrena ninguna herramienta: se elige entre las veintidós que ya sabes, y la mitad del trabajo es decidir qué NO poner — vas a tener que borrar cosas que funcionan perfectamente. Y vas a encontrarte con la peor mentira de todo el curso, escondida detrás de un cero que se ve muy bien portado.',
  stats: [
    { etiqueta: 'Encargos', valor: '13', acento: '#f5a524' },
    { etiqueta: 'Preguntas', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Herramientas nuevas', valor: '0', acento: '#34d399' },
  ],
  letrero: 'Una pantalla. Tres preguntas. Todo lo demás, fuera.',
  fichas: [
    {
      key: 'la-pregunta-primero',
      tag: 'Por dónde se empieza',
      numero: 1,
      titulo: 'Primero la pregunta, después los datos',
      detalle:
        'Un tablero no se llena con lo que tienes: se llena con lo que contesta algo que alguien de verdad se pregunta. Decide las tres preguntas y ya tienes una regla que decide sola.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'borrar-lo-que-funciona',
      tag: 'Lo más difícil',
      numero: 2,
      titulo: 'Vas a borrar cosas que funcionan',
      detalle:
        'Un pastel bien hecho que no contesta nada y tres minigráficos que dibujan el mismo dato tres veces. No están rotos: sobran. Un tablero no crece añadiendo, crece quitando.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
    {
      key: 'comparado-con-que',
      tag: 'Un número solo',
      numero: 3,
      titulo: '«19 749 pesos» no es bueno ni malo',
      detalle:
        'No lo es hasta que se sabe con qué se compara: faltaron 4 251 para la meta y se subió un 15 % contra el semestre pasado. Las dos son verdad, y con cuál se compara lo eliges tú.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'la-peor-mentira',
      tag: 'El cierre honesto',
      numero: 4,
      titulo: 'Un tablero es un argumento, no un espejo',
      detalle:
        'Elegir qué enseñar ya es opinar, y eso no tiene remedio. Lo que sí lo tiene es engañar: un tablero limpio construido sobre un error tapado es la peor mentira del curso, porque parece profesional.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Ármale la pantalla a la directora',
  ctaDetalle:
    'Se abre «Cooperativa escolar · Cierre del semestre.xlsx» con el tablero que dejó armado el tesorero anterior y las trescientas ventas pegadas debajo. Trece encargos, cuatro de ellos de pura cabeza. A la derecha, el panel «Tablero»: lo que hay puesto encima de la hoja con su ✕, y debajo el panel de la tabla dinámica. Todo lo demás está donde siempre.',
};

export function EntradaDashboard(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaDashboard;

export default EntradaDashboard;
