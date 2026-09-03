'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabVisualizacionEfectiva } from './Lab';

/**
 * Entrada de `n8-visualizacion-efectiva` — tercera parada de N8 · «Datos y
 * análisis» (§49), entre «Tablas dinámicas iniciales» y «Concluye con datos».
 *
 * La ruta sale de `getUnidad('n8-datos-y-analisis')`, igual que sus tres
 * hermanas de la unidad: el id es `n8-`, la clase vive ahí y el número del CTA
 * se deriva de su sitio en esa lista, nunca se escribe a mano.
 *
 * Todas las cadenas están escritas para ESTA clase. Con la que más se podría
 * confundir es `n6-elige-la-grafica` —el mismo bloque 37/38—, y ni una frase
 * de aquí viene de ahí: aquélla resume una feria en ocho tablas ya listas y
 * ésta empieza con un marcador de partidos que hay que resumir con fórmulas
 * antes de poder graficar nada (§49, cabecera del guion).
 */

const RUTA_N8: PasoRuta[] = (getUnidad('n8-datos-y-analisis')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const ACTIVIDAD = 'n8-visualizacion-efectiva';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabVisualizacionEfectiva,
  ruta: RUTA_N8,
  parada: Math.max(1, RUTA_N8.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo: 'Antes de creerte una gráfica, mira dónde empieza el eje.',
  arranqueSub:
    'El torneo intramuros ya terminó: cuatro equipos, cinco partidos, una asistencia que creció semana con semana y un presupuesto que sí cuadra. Vas a resumir el marcador con fórmulas antes de dibujar nada, y vas a construir tres gráficas —una para comparar equipos, una para seguir una tendencia real, una para repartir un presupuesto que de verdad suma su total—. También vas a encontrar dos tablas que NO deberían convertirse en pastel, cada una por una razón distinta, y una gráfica que alguien más dejó ya manipulada, con el eje cortado, antes de que abrieras el archivo: un empate casi perfecto disfrazado de goliza, sin inventar un solo número.',
  stats: [
    { etiqueta: 'Gráficas que sí', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Pasteles que no', valor: '2', acento: '#f5a524' },
    { etiqueta: 'Encargos', valor: '9', acento: '#34d399' },
  ],
  letrero: 'El eje cortado no avisa. Tú tienes que mirarlo.',
  fichas: [
    {
      key: 'resumir-antes',
      tag: 'Antes del botón',
      numero: 1,
      titulo: 'Visualizar empieza en la fórmula',
      detalle:
        'El marcador trae cinco partidos por equipo, no un total. Antes de poder elegir qué gráfica construir hace falta resumir con SUMA: veinte números sueltos convertidos en cuatro que sí se pueden comparar de un vistazo.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'una-pregunta-por-tipo',
      tag: 'El tipo correcto',
      numero: 2,
      titulo: 'Cada gráfica contesta una pregunta',
      detalle:
        'Columnas: ¿cuál es más grande? Líneas: ¿cómo cambió con el tiempo? Pastel: ¿qué parte de un total? Construir la gráfica que no toca no rompe ningún número: sólo deja de contestar la pregunta.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'dos-pasteles-que-no',
      tag: 'El pastel',
      numero: 3,
      titulo: 'Dos maneras distintas de que un pastel mienta',
      detalle:
        'Doce jugadores con seis colores de paleta: demasiadas rebanadas, aunque las faltas sí sumen un total real. Espectadores, partidos y árbitros: ningún pastel debería repartirlos, porque no son parte de la misma cosa.',
      acento: { c: '#f5a524', deep: '#b45309' },
    },
    {
      key: 'la-encontrada',
      tag: 'La gráfica ajena',
      numero: 4,
      titulo: 'No la fabricas: la encuentras',
      detalle:
        'El libro ya trae una gráfica con el eje cortado, hecha por alguien más. El trabajo no es construir el engaño: es notar que algo no cuadra con la tabla de al lado y devolverle el eje a cero.',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre los resultados del torneo',
  ctaDetalle:
    'Se abre «Torneo intramuros · resultados.xlsx», con el marcador, la asistencia, el presupuesto, la lista de faltas y una gráfica ya manipulada esperando. Nueve encargos. Columnas, líneas y circular están en Insertar → Gráficos; título y ejes se escriben en «Diseño de gráfico», a la derecha, en cuanto marcas tu gráfica. La guía «Qué gráfica usar» se va marcando sola conforme aciertas.',
};

export function EntradaVisualizacionEfectiva(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaVisualizacionEfectiva;

export default EntradaVisualizacionEfectiva;
