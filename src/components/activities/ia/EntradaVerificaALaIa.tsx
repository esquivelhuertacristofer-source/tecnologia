'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN5Base, type ConfigEntradaN5 } from '../n5/estudio/EntradaN5Base';
import { RUTA_N7_IA_1 } from './rutasIA';
import { LabVerificaALaIa } from './LabVerificaALaIa';

/**
 * Entrada de `n7-verifica-a-la-ia` — N7 · «IA I», parada 3 de 3.
 * **1.º de secundaria, 12–13 años** (comprobado en `curriculo.ts:697`).
 *
 * Se reutiliza `EntradaN5Base`, igual que su hermana `n7-buenos-prompts`:
 * la base no lee el nivel de ningún dato, recibe la ruta y la parada por
 * parámetro. Cada cadena de aquí es de ESTA clase — la ficha de Historia y
 * Tecnología, los tres veredictos, la trampa de la señal — nada copiado sin
 * revisar (regla de la casa: «un port que sólo cambia el import deja las
 * entradas mintiendo»).
 */

const CONFIG: ConfigEntradaN5 = {
  actividadId: 'n7-verifica-a-la-ia',
  laboratorio: LabVerificaALaIa,
  ruta: RUTA_N7_IA_1,
  parada: 3,
  globo:
    'El asistente te contestó cuatro frases sobre cómo llegó Internet a México. Una está mal, otra no la sostiene nadie, y no vas a poder saber cuáles leyéndolas.',
  arranqueSub:
    'Ésta es la clase en la que **abres dos programas a la vez**: el asistente que contesta y el buscador donde se comprueba. No hay botón de “¿es verdad?”: hay que ir a buscarlo. Y ojo con lo que te vas a llevar de aquí: **la frase que parece más sospechosa de las cuatro es la única que es cierta del todo.**',
  stats: [
    { etiqueta: 'Encargos', valor: '8', acento: '#22d3ee' },
    { etiqueta: 'Veredictos', valor: '3', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Las tres maneras en que acaba una comprobación',
  fichas: [
    {
      key: 'confirmada',
      tag: 'Veredicto 1',
      numero: 1,
      titulo: 'Confirmada',
      detalle:
        'Otra fuente lo dice, y no copió a la primera. Ojo con eso último: dos páginas con el mismo párrafo palabra por palabra no son dos fuentes, son una.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'contradicha',
      tag: 'Veredicto 2',
      numero: 2,
      titulo: 'Contradicha',
      detalle: 'Una fuente seria dice otra cosa. Aquí no hay duda: se corrige y se sigue.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
    {
      key: 'sin-respaldo',
      tag: 'Veredicto 3',
      numero: 3,
      titulo: 'Sin respaldo',
      detalle:
        'Buscas y no aparece nada. No es lo mismo que “es mentira”, y por eso tiene su propio botón: nadie lo desmiente, pero nadie lo sostiene. En tu trabajo eso se escribe distinto.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'senal',
      tag: 'Y la trampa',
      numero: 4,
      titulo: 'La señal no sentencia',
      detalle:
        'Una fecha exactísima, un nombre raro, una cifra redonda: son pistas de dónde mirar, no de qué es falso. Hoy vas a ver una frase con señal que es cierta y una frase aburridísima que es falsa.',
      acento: { c: '#64748b', deep: '#334155' },
    },
  ],
  // Corregido por el coordinador (21-ago-2026): la carpeta de assets no
  // existe en disco todavía (video de la campaña, pausada en 8 de 60 por
  // decisión de Cristofer). `false` aquí habría cargado un <video> real
  // apuntando a un .mp4 y un .png inexistentes — el mismo defecto ya
  // corregido en cuatro clases de §62. `true` muestra el aviso «en
  // grabación» en su lugar.
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre los dos programas',
  ctaDetalle:
    'Ocho encargos: cuatro comprobaciones completas, una cita que existe y no dice lo que dijeron, y dos consultas para tres frases que van en tu trabajo. Buscar no cuesta nada y nunca resta: busca todo lo que quieras.',
};

export function EntradaVerificaALaIa(props: ActivityProps) {
  return <EntradaN5Base {...props} entrada={CONFIG} />;
}

export default EntradaVerificaALaIa;
