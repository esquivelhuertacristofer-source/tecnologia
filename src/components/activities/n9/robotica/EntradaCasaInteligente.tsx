'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { RUTA_N9_ROBOTICA } from './rutaRoboticaN9';
import { LabCasaInteligente } from './LabCasaInteligente';

/**
 * Entrada de `n9-casa-inteligente` — N9·«Robótica e internet de las cosas», parada 2.
 * Tono de **14–15 años** (N9, 3.º de Secundaria).
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n9-casa-inteligente',
  laboratorio: LabCasaInteligente,
  ruta: RUTA_N9_ROBOTICA,
  parada: 2,
  globo:
    'Una casa no se vuelve inteligente porque tenga sensores, sino porque alguien decide qué pasa cuando uno de ellos se dispara. Hoy escribes tú esas reglas, para una casa entera.',
  arranqueSub:
    'Vas a ajustar tres sensores —el de luz, el de temperatura y el de presencia— y luego a conectarlos con lo que se enciende y se mueve: las luces, el clima y el portón. Una regla por cada cosa que quieras que pase sola.',
  stats: [
    { etiqueta: 'Encargos', valor: '5', acento: '#38bdf8' },
    { etiqueta: 'Reglas', valor: 'IFTTT', acento: '#a855f7' },
    { etiqueta: 'Insignia', valor: '1', acento: '#facc15' },
  ],
  letrero: 'SmartSpace IoT Studio: Robótica & Domótica',
  fichas: [
    {
      key: 'sensors-calibration',
      tag: 'Los sensores',
      numero: 1,
      titulo: 'Sensores LDR, DHT y PIR',
      detalle:
        'El LDR mide cuánta luz hay, el DHT la temperatura y el PIR si pasa alguien. Antes de usarlos hay que decidir a partir de qué número cuenta como sí.',
      acento: { c: '#38bdf8', deep: '#0284c7' },
    },
    {
      key: 'ifttt-rules',
      tag: 'La regla',
      numero: 2,
      titulo: 'SI esto, ENTONCES aquello',
      detalle:
        'Una regla tiene dos mitades: SI este sensor pasa de aquí, ENTONCES enciende esto otro. Sin la segunda mitad el sensor mide y no hace nada.',
      acento: { c: '#a855f7', deep: '#7e22ce' },
    },
    {
      key: 'actuators-control',
      tag: 'Lo que se mueve',
      numero: 3,
      titulo: 'Relés y servomotores',
      detalle:
        'Los relés encienden y apagan las luces, y los servomotores mueven cosas, como el portón. Son la mitad de la regla que se ve desde fuera.',
      acento: { c: '#34d399', deep: '#059669' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5',
  ctaTitulo: 'Abre SmartSpace IoT Studio',
  ctaDetalle:
    'Cinco encargos sobre el plano de la casa: ajustas los tres sensores, escribes las reglas que los conectan con las luces, el clima y el portón, y compruebas que la casa se mueve sola cuando toca.',
  /*
   * `true` desde el 1-sep-2026: esta clase NO tiene
   * `public/assets/actividades/n9-casa-inteligente/video-explicativo.mp4`. Con la bandera en
   * `false` el `<video>` se pintaba igualmente y pedía un archivo que no
   * existe: el alumno veía un reproductor muerto y un 404 en la red, en vez
   * del aviso honesto de que el video todavía se está grabando. Cuando el
   * video exista, esto vuelve a `false` en el mismo commit que lo publica.
   */
  assetsPendientes: false,
};

export function EntradaCasaInteligente(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaCasaInteligente;
