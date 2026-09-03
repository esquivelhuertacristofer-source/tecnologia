'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabEmpleosTecnologicos } from './LabEmpleosTecnologicos';

/**
 * Entrada de `n9-empleos-tecnologicos` — N9 · «Emprendimiento e identidad
 * digital», parada 3 de 3 (CIERRE de la unidad). Nivel 9 = 3.º de
 * Secundaria, 14–15 años.
 *
 * Misma ruta derivada de `getUnidad('n9-emprendimiento-e-identidad')`, nunca
 * a mano — igual que hacen `EntradaMarcaPersonal.tsx` y
 * `EntradaEcommerceYMarketing.tsx`, sus dos hermanas de parada 1 y 2: las
 * tres leen el mismo currículo en vez de compartir un archivo de rutas que
 * las tres sesiones en paralelo tendrían que tocar.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n9-empleos-tecnologicos/video-explicativo.mp4` y la bandera bajó a
 * `assetsPendientes: false`. OJO si escribes pruebas: con el video puesto, el
 * primer `<button>` del documento ya no es el CTA sino el de la portada, así
 * que no lo busques por posición — búscalo por su texto.
 */

const RUTA_N9: PasoRuta[] = (getUnidad('n9-emprendimiento-e-identidad')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const ACTIVIDAD = 'n9-empleos-tecnologicos';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabEmpleosTecnologicos,
  ruta: RUTA_N9,
  parada: Math.max(1, RUTA_N9.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo:
    'Ya armaste el portafolio de Bruno y el plan de tienda de Regina. Ahora te toca a ti: vas a mirar de cerca los empleos tech que existen más allá de "programador", decidir qué habilidades pide cada uno de verdad, entender qué tareas ya hace sola una IA y cuáles no — y cerrar decidiendo, con un caso real, hacia qué camino tiene sentido prepararse.',
  arranqueSub:
    'Vas a clasificar **cinco empleos tech reales** —más allá de "programador"— y relacionar **dos perfiles** con el puesto que de verdad les queda. Vas a separar **habilidades técnicas** de **habilidades transferibles**, con el caso de alguien que no sabe programar y sí trabaja en tecnología. Vas a decidir qué tareas de un empleo ya automatiza una IA y cuáles siguen pidiendo criterio humano. Y vas a cerrar combinando marca personal + habilidades + IA para decidir el camino de un caso nuevo.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#38bdf8' },
    { etiqueta: 'Empleos', valor: '5', acento: '#fb923c' },
    { etiqueta: 'Insignia', valor: '1', acento: '#a78bfa' },
  ],
  letrero: 'Programar es un empleo tech. No es EL empleo tech.',
  fichas: [
    {
      key: 'mas-alla-de-programar',
      tag: 'La idea entera',
      numero: 1,
      titulo: 'Cinco empleos, uno solo con "programar" como tarea central',
      detalle:
        'Diseñar cómo se siente usar algo, encontrar patrones en datos, cazar grietas de seguridad, decidir qué construir primero, explicar un programa a quien no lo entiende — todos son empleos de tecnología, y casi ninguno empieza con «aprende a programar».',
      acento: { c: '#38bdf8', deep: '#0369a1' },
    },
    {
      key: 'tecnica-vs-transferible',
      tag: 'Habilidades',
      numero: 2,
      titulo: 'Una se aprende en un curso. La otra, se practica en cualquier lado.',
      detalle:
        'Saber usar una herramienta específica es una habilidad técnica. Escuchar bien, explicar claro, organizar un equipo — eso también es trabajar en tecnología, aunque no tenga nombre de programa.',
      acento: { c: '#fb923c', deep: '#9a3412' },
    },
    {
      key: 'ia-cambia-la-tarea-no-el-criterio',
      tag: 'La IA en estos empleos',
      numero: 3,
      titulo: 'La IA hace la tarea. El criterio sigue siendo tuyo.',
      detalle:
        'Limpiar una tabla o generar una gráfica ya lo hace una IA en segundos. Decidir qué pregunta vale la pena investigar, y responsabilizarte del resultado, todavía no.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'tu-camino-no-es-un-molde',
      tag: 'El cierre',
      numero: 4,
      titulo: 'No hay un molde único: hay tus fortalezas reales, cruzadas con criterio',
      detalle:
        'El mismo criterio con el que armaste tu portafolio y tu plan de tienda sirve para decidir hacia qué camino tech prepararte — y para elegir uno que la IA no vaya a vaciar por dentro.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Elige tu camino con criterio',
  ctaDetalle:
    'Se abre Tecnia Brújula: clasifica empleos tech reales, relaciona perfiles con el puesto que les queda, separa habilidades técnicas de transferibles, decide qué tareas automatiza la IA y cuáles no, y cierra decidiendo el camino de un caso que integra marca personal, negocio y criterio.',
  assetsPendientes: false,
};

export function EntradaEmpleosTecnologicos(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaEmpleosTecnologicos;
