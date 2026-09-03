'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, RUTA_N9_DESARROLLO_DE_APLICACIONES, type ConfigEntradaN4 } from '../n4/estudio/EntradaN4Base';
import { LabConstruyeLowCode } from './LabConstruyeLowCode';

/**
 * Entrada de `n9-construye-low-code` — N9·«Desarrollo de aplicaciones»,
 * parada 2 de 3 (documento §54.3, currículo: «Construcción low-code — App
 * Inventor o similar»). Tono de **14–15 años** (N9, 3.º de Secundaria,
 * verificado en `curriculo.ts`): un registro más técnico que el de
 * secundaria temprana, cercano al de `n7-como-aprende-la-ia` — término
 * técnico con su traducción la primera vez, el porqué antes que el qué, cero
 * diminutivos.
 *
 * `RUTA_N9_DESARROLLO_DE_APLICACIONES` ya vivía en `n4/estudio/EntradaN4Base`
 * desde que se construyó `n9-boceta-tu-app` (con las tres paradas escritas de
 * antemano): se reutiliza tal cual, sin tocar ese archivo compartido.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n9-construye-low-code',
  laboratorio: LabConstruyeLowCode,
  ruta: RUTA_N9_DESARROLLO_DE_APLICACIONES,
  parada: 2,
  globo:
    'Ya bocetaste el flujo con dos pantallas. Ahora la construyes con una herramienta low-code de verdad: tres pantallas, controles con nombre propio, y tú conectas cada camino.',
  arranqueSub:
    'Vas a construir **Mis tareas**, una app de tres pantallas —Inicio, Lista y Detalle—, con **dos salidas** desde Inicio y un botón de vuelta. Al final, Detalle se va a poder alcanzar por **más de un camino**, y el editor va a revisar que ningún botón quede mudo.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#a78bfa' },
    { etiqueta: 'Pantallas', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Lo que separa un boceto de una app construida',
  fichas: [
    {
      key: 'boceto-no-revisa',
      tag: 'La diferencia',
      numero: 1,
      titulo: 'Un boceto en papel no revisa nada',
      detalle:
        'Una herramienta **low-code** (código reducido: arrastras y conectas piezas en vez de escribir cada línea) sí lo hace — revisa que cada botón lleve a algún lado antes de dejarte terminar. Eso es lo que hoy usas.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'control-con-nombre',
      tag: 'La disciplina real',
      numero: 2,
      titulo: 'Cada control se llama por su nombre',
      detalle:
        'En App Inventor —y en cualquier editor low-code— un botón sin nombre con propósito («Button1» no cuenta) es un botón que nadie puede mantener. **Vas a nombrar los tuyos.**',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'mas-de-un-camino',
      tag: 'Cómo navega una app real',
      numero: 3,
      titulo: 'Una pantalla puede tener más de una entrada',
      detalle:
        'Inicio va a tener DOS salidas, y Detalle se va a poder alcanzar de dos formas distintas. **Eso es un mapa, no una fila.**',
      acento: { c: '#f97316', deep: '#b45309' },
    },
    {
      key: 'revision-del-mapa',
      tag: 'Lo que se revisa al final',
      numero: 4,
      titulo: 'El editor revisa el mapa completo',
      detalle:
        'Que las tres pantallas se alcancen y que ningún enlace apunte a la nada — **el mismo tipo de revisión que ya viste en la parada 1**, pero sobre un mapa más grande.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el editor',
  ctaDetalle:
    'Construyes Inicio con dos botones nombrados, Lista con sus tarjetas, y Detalle con un campo y un botón de vuelta. Enlazas los cuatro caminos y dejas que el editor revise que tu app navega de verdad.',
  assetsPendientes: false,
};

export function EntradaConstruyeLowCode(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaConstruyeLowCode;
