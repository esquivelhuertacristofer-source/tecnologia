'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, RUTA_N9_DESARROLLO_DE_APLICACIONES, type ConfigEntradaN4 } from '../n4/estudio/EntradaN4Base';
import { LabBocetaTuApp } from './LabBocetaTuApp';

/**
 * Entrada de `n9-boceta-tu-app` — N9·«Desarrollo de aplicaciones»,
 * parada 1 de 3 (documento §54.3). Tono de **14–15 años** (N9, 3.º de
 * Secundaria, verificado en `curriculo.ts`).
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n9-boceta-tu-app',
  laboratorio: LabBocetaTuApp,
  ruta: RUTA_N9_DESARROLLO_DE_APLICACIONES,
  parada: 1,
  globo:
    'Antes de programar una sola línea, quien construye una app la boceta: qué pantallas hay y a dónde lleva cada botón. Hoy haces exactamente eso, y tu boceto se puede tocar de verdad.',
  arranqueSub:
    'Vas a bocetar **dos pantallas** de una app — Inicio y Detalle — y a enlazar un botón entre ellas. Al final, tocar el botón de verdad te lleva a la otra pantalla.',
  stats: [
    { etiqueta: 'Encargos', valor: '4', acento: '#22d3ee' },
    { etiqueta: 'Pantallas', valor: '2', acento: '#a78bfa' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Lo que hace que un boceto se pueda tocar',
  fichas: [
    {
      key: 'boceto-primero',
      tag: 'Antes de programar',
      numero: 1,
      titulo: 'Un boceto es texto y cajas',
      detalle: 'No hace falta que se vea bonito: **el flujo se piensa antes que el diseño final**. Eso es lo que boceta un boceto.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'varias-pantallas',
      tag: 'La app no es una imagen',
      numero: 2,
      titulo: 'Cada pantalla es su propio documento',
      detalle: 'Inicio y Detalle tienen sus propias capas. **Cambiar de pantalla no borra la otra.**',
      acento: { c: '#f97316', deep: '#b45309' },
    },
    {
      key: 'enlazar',
      tag: 'Lo que lo vuelve prototipo',
      numero: 3,
      titulo: 'Un botón que enlaza, no que decora',
      detalle: 'Enlazas el botón a la pantalla de destino. **A partir de ahí, tocarlo de verdad te lleva ahí.**',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'sin-huerfanas',
      tag: 'Lo que se revisa al final',
      numero: 4,
      titulo: 'Ninguna pantalla se queda sola',
      detalle: 'Una pantalla a la que nadie lleva es un defecto del prototipo — **el editor lo puede comprobar por ti**.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el editor',
  ctaDetalle:
    'Bocetas Inicio con un título y un botón, creas Detalle, le pones contenido y **enlazas el botón** para que el prototipo se pueda tocar de verdad.',
  assetsPendientes: false,
};

export function EntradaBocetaTuApp(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaBocetaTuApp;
