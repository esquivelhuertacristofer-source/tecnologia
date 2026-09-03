'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { LabBuenasPracticas } from './LabBuenasPracticas';
import { RUTA_N8_PYTHON_2 } from './rutaN8Python2';

/**
 * Entrada de N8 · U «Programación en texto II» (`n8-python-2`) · parada 4 de 4
 * «Buenas prácticas y depuración» — cierra la unidad.
 *
 * Viene de «Listas y diccionarios», «Funciones» y —en construcción en
 * paralelo— «Juegos, calculadoras y bots», así que las fichas dan por sabido
 * el vocabulario de los tres errores (`IndexError`, `TypeError`, `NameError`)
 * y no lo vuelven a explicar desde cero: lo que enseñan es a **leerlos** en un
 * programa ajeno, no a provocarlos. Registro de secundaria (§30.4): término
 * técnico correcto con su traducción al lado, se explica el porqué y no sólo
 * el qué. Cada cadena está escrita para esta clase.
 *
 * La ficha «ya viene escrito» anticipa la decisión de motor de
 * `LabBuenasPracticas.tsx`: los tres errores están precargados en el archivo
 * desde que se abre, no se provocan escribiéndolos — así el alumno no llega
 * sorprendido de que el laboratorio empiece con un programa roto.
 *
 * El video se grabó y se publicó el 2-sep-2026, a la vez que los de sus tres
 * hermanas de unidad: `public/assets/actividades/n8-buenas-practicas/
 * video-explicativo.mp4` ya existe y `assetsPendientes` bajó a `false`, así
 * que `EntradaN4Base` monta el `<video>` de verdad. OJO si escribes pruebas:
 * con el video puesto, el primer `<button>` del documento ya no es el CTA
 * sino el de la portada, así que no lo busques por posición.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n8-buenas-practicas',
  laboratorio: LabBuenasPracticas,
  ruta: RUTA_N8_PYTHON_2,
  parada: 4,
  globo:
    'Hasta ahora tú provocabas el error para aprender a leerlo. Hoy es al revés: abres un programa que ya viene roto, sin que nadie te diga dónde, y te toca encontrarlo tú.',
  arranqueSub:
    'Abres **depuracion.py** y ya viene escrito: nombres que no dicen nada y tres errores reales esperando a que los encuentres.',
  stats: [
    { etiqueta: 'Encargos', valor: '8', acento: '#22d3ee' },
    { etiqueta: 'Errores reales', valor: '3', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Lo que vas a practicar',
  fichas: [
    {
      key: 'nombres',
      tag: 'Código que se explica solo',
      numero: 1,
      titulo: 'Nombres que sí dicen algo',
      detalle:
        '`x = 15` no dice nada; `edad = 15` se explica solo. Lo mismo con las funciones: `calcular_total(3, 25)` se entiende con sólo leerlo, `f(3, 25)` no.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'ya-escrito',
      tag: 'No lo vas a provocar tú',
      numero: 2,
      titulo: 'El archivo ya viene roto',
      detalle:
        'Tres errores reales —de índice, de argumentos y de alcance— ya están escritos en el programa desde que lo abres. Nadie te dice en qué línea: los encuentras leyendo el mensaje, uno a la vez.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'comentario',
      tag: 'El porqué, no el qué',
      numero: 3,
      titulo: 'Comentarios que valen la pena',
      detalle:
        '`# suma dos números` sobre `total = a + b` no dice nada nuevo: eso ya se lee en el código. Un buen comentario explica una **decisión** que el código, por sí solo, no cuenta.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'cierre',
      tag: 'Cierra la unidad',
      numero: 4,
      titulo: 'Leer antes de arreglar',
      detalle:
        'Los tres errores de hoy se resuelven igual: leer el mensaje completo —qué dice, en qué línea, qué pista da— antes de tocar una sola letra. Ésa es la costumbre que se lleva quien sabe depurar.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el editor de código',
  ctaDetalle:
    'Ocho encargos: renombra una variable y una función para que se expliquen solas, encuentra y corrige un IndexError, un TypeError de argumentos y un NameError de alcance —**los tres ya escritos, sin que nadie te avise dónde**—, cambia un comentario inútil por uno que explique una decisión, y cierra escribiendo tu propia función.',
  assetsPendientes: false,
};

export function EntradaBuenasPracticas(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaBuenasPracticas;
