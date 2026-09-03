'use client';

import { useCallback, useEffect } from 'react';
import VentanaDiapositivas from '@/components/office/VentanaDiapositivas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_PPT_AVANZADO } from '../../tecniaDiapositivas';
import { crearBackstage } from '../comun/Backstage';
import { reiniciarImpresora } from '../comun/impresora';
import { GUION_EN_PAPEL } from './guion';

/**
 * Laboratorio de `of-ppt-en-papel` (doc §44.4).
 *
 * **Backstage con una sola sección: Imprimir.** Ni Información ni Exportar —
 * exportar es de §43.7 y esta clase trata de papel—, y ésa es la misma decisión
 * que ya tomaron las tres clases anteriores que lo usan: una pieza, cuatro
 * clases, cuatro configuraciones. Un Backstage con todo encendido le pondría
 * delante al alumno tres herramientas que nadie le va a explicar.
 *
 * Sin panel de clase y sin controles propios: todo lo que enseña vive en el
 * aparato de PowerPoint —Archivo → Imprimir, y Vista → Patrones—, que es donde
 * el lunes lo va a buscar.
 */

const BackstageDeLaClase = crearBackstage({
  secciones: ['imprimir'],
  formatos: [],
  proteger: false,
});

function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabEnPapel({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  /*
   * La impresora empieza vacía y con los ajustes de fábrica. Los cuatro
   * encargos de imprimir preguntan «¿ya salió el documento de 6?», así que una
   * bandeja heredada de la partida anterior daría media clase por hecha antes de
   * empezar. Mismo motivo que `reiniciarSalida` en §43.1 y §43.7.
   */
  useEffect(() => {
    reiniciarImpresora();
  }, []);

  const alTerminar = useCallback(
    ({ tropiezos, segundos }: { pasos: number; tropiezos: number; segundos: number }) => {
      const { score, stars } = calificar(tropiezos);
      onScore(score);
      onComplete({ score, stars, xp: 45, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  return (
    <VentanaDiapositivas
      cinta={CINTA_PPT_AVANZADO}
      guion={GUION_EN_PAPEL}
      backstage={BackstageDeLaClase}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={13}
      insignia={{
        nombre: 'Salida en papel',
        emoji: '🖨️',
        titulo: 'Sabes sacarla de la pantalla',
        detalle:
          'Entregaste tres copias al jurado en el formato que se reparte —con rayas para que apunten—, te quedaste tus páginas de notas, y las hojas llevaban el nombre de tu equipo porque tocaste el molde una sola vez. Y lo que se queda contigo son dos cosas que casi nadie sabe: que **las hojas impresas también tienen patrón**, escondido en el mismo menú que el de las diapositivas, y que **lo que se ve y lo que sale no son lo mismo** — una presentación de fondo oscuro no se cambia para imprimirla, se imprime en grises.',
      }}
    />
  );
}

export const Lab = LabEnPapel;

export default LabEnPapel;
