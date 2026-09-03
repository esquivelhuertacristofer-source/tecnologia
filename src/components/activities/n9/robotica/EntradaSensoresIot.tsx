'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { RUTA_N9_ROBOTICA } from './rutaRoboticaN9';
import { LabSensoresIot } from './LabSensoresIot';

/**
 * Entrada de `n9-sensores-iot` — N9·«Robótica e internet de las cosas», **parada 1**.
 * Tono de **14–15 años** (N9, 3.º de Secundaria).
 *
 * Antecede a `n9-casa-inteligente` (parada 2, ya construida): esa clase enseña
 * reglas IFTTT (SI sensor X ➔ ENTONCES actuador Y) dando por hecho que el
 * alumno ya sabe qué mide cada sensor y cuándo confiar en su lectura. Esta
 * clase es la que se lo enseña, así que **no toca reglas de automatización
 * ni actuadores** — eso queda intacto para la parada 2, que ya lo cubre con
 * su propio simulador SmartSpace IoT.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n9-sensores-iot/video-explicativo.mp4` y la bandera bajó a
 * `assetsPendientes: false`. OJO si escribes pruebas: con el video puesto, el
 * primer `<button>` del documento ya no es el CTA sino el de la portada, así
 * que no lo busques por posición — búscalo por su texto.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n9-sensores-iot',
  laboratorio: LabSensoresIot,
  ruta: RUTA_N9_ROBOTICA,
  parada: 1,
  globo:
    'Antes de programar ninguna regla, tienes que confiar en lo que dice el sensor. Vas a aprender qué mide cada uno, cuándo un dato es imposible y qué lo hace parte del Internet de las Cosas.',
  arranqueSub:
    'Vas a **identificar** qué mide cada sensor del SmartSpace IoT Studio (LDR, DHT22 y PIR) y por qué no son intercambiables, **detectar** lecturas fuera de su rango físico real —una humedad de 150 % no puede ser cierta—, ver qué cambia cuando un sensor se **conecta a internet**, y **diagnosticar** un caso real sin programar todavía ninguna automatización.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#38bdf8' },
    { etiqueta: 'Sensores', valor: '3', acento: '#a855f7' },
    { etiqueta: 'Insignia', valor: '1', acento: '#facc15' },
  ],
  letrero: 'SmartSpace IoT Studio: Sensores y Lectura de Datos',
  fichas: [
    {
      key: 'que-mide-cada-sensor',
      tag: 'Lo primero',
      numero: 1,
      titulo: 'Un sensor sólo mide una cosa',
      detalle:
        'El **LDR** mide luz. El **DHT22** mide temperatura y humedad. El **PIR** detecta movimiento. Ninguno hace el trabajo de otro: usar el equivocado no es "menos preciso", es que **no funciona**.',
      acento: { c: '#38bdf8', deep: '#0284c7' },
    },
    {
      key: 'rango-fisico-real',
      tag: 'La trampa',
      numero: 2,
      titulo: 'No todo número es un dato real',
      detalle:
        'Una humedad de **150 %** o una temperatura de **300 °C** en un salón no son "datos raros": son **imposibles** para lo que ese sensor puede medir. Detectarlo es parte de leer bien un sensor.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
    {
      key: 'aislado-vs-conectado',
      tag: 'El porqué del nombre',
      numero: 3,
      titulo: 'Medir no es lo mismo que enviar',
      detalle:
        'Un sensor **aislado** mide y el dato se queda ahí. Uno **conectado a internet** —eso es el "IoT" de Internet of Things— envía su lectura a algún lugar donde otra pantalla puede consultarla.',
      acento: { c: '#a855f7', deep: '#7e22ce' },
    },
    {
      key: 'diagnostico-sin-programar',
      tag: 'El cierre',
      numero: 4,
      titulo: 'Un dato raro no siempre es un error',
      detalle:
        'Dado un caso real, vas a decidir si es el **sensor**, la **conexión** o un **dato verdadero** que hay que investigar — sin programar todavía ninguna regla. Eso es la siguiente parada.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Iniciar SmartSpace IoT Studio',
  ctaDetalle:
    'Entra al SmartSpace IoT Studio para leer sensores reales, cazar lecturas imposibles y diagnosticar un caso — antes de que la siguiente parada te enseñe a automatizarlos.',
  assetsPendientes: false,
};

export function EntradaSensoresIot(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaSensoresIot;
