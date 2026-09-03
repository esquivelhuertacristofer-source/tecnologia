'use client';

import { useCallback, useEffect, useMemo } from 'react';
import VentanaDiapositivas from '@/components/office/VentanaDiapositivas';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_PPT_BASICO } from '../../tecniaDiapositivas';
import { crearBackstage } from '../comun/Backstage';
import { reiniciarSalida } from '../comun/salida';
import { DosPantallas } from './DosPantallas';
import { GUION_PRESENTA_Y_COMPARTE } from './guion';

/**
 * Laboratorio de `of-ppt-presenta-y-comparte` (doc §43.1).
 *
 * Dos cosas le añade esta clase al motor, y las dos por puertas que ya existían
 * o que ella misma acaba de abrir:
 *
 * - **El escenario de las dos pantallas** (`escenario`), que es donde vive la
 *   lección. Ni el proyector ni el portátil son de PowerPoint: son del salón.
 * - **El Backstage** (`backstage`), la quinta puerta, abierta hoy y pagando una
 *   deuda que `of-word-guardar-e-imprimir` dejó escrita en su propia cinta: la
 *   pestaña Archivo era un tope y por eso Word tuvo que declarar «Guardar como»
 *   en un grupo de Inicio. Aquí Exportar vive donde vive de verdad.
 */

/*
 * Fuera del componente, como el auditorio de §41 y por lo mismo: definidos
 * dentro serían un tipo de componente nuevo en cada render, y React
 * desmontaría el escenario —con su reloj— entre cuadro y cuadro.
 */
const BackstageDeLaClase = crearBackstage({ secciones: ['exportar'], formatos: ['pdf'] });

/**
 * El escenario manda en los cuatro encargos de la función y en ninguno más.
 *
 * En los otros cuatro, «Desde el principio» abre el repaso normal del programa.
 * Es la misma cautela que salvó a §41: con el escenario puesto siempre, un
 * alumno que pulsa Presentación mientras escribe su nota caería en el salón a
 * oscuras sin que nadie se lo haya pedido.
 */
const ENCARGOS_DE_LA_FUNCION = new Set([
  'como-lo-ves-hoy',
  'abre-el-moderador',
  'que-ve-el-publico',
  'pasa-las-cinco',
]);

const esDeLaFuncion = (pasoId: string | null) => ENCARGOS_DE_LA_FUNCION.has(pasoId ?? '');

/** Misma escala que las doce clases anteriores de la suite. */
function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabPresentaYComparte({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  // Volver a entrar no hereda la bandeja de la vez pasada: el encargo del PDF
  // depende de que esté vacía, y una bandeja con el PDF de ayer lo da por hecho
  // antes de empezar. Es el mismo reinicio que hace el escritorio de Word.
  useEffect(() => {
    reiniciarSalida();
  }, []);

  const alTerminar = useCallback(
    ({ tropiezos, segundos }: { pasos: number; tropiezos: number; segundos: number }) => {
      const { score, stars } = calificar(tropiezos);
      onScore(score);
      onComplete({ score, stars, xp: 40, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  const insignia = useMemo(
    () => ({
      nombre: 'Dos pantallas',
      emoji: '🎤',
      titulo: 'Ya puedes presentar mirando a la gente',
      detalle:
        'Descubriste que al proyectar hay dos pantallas y que la tuya trae lo que el público no ve: tus notas, la diapositiva que viene y el reloj. Escribiste una nota como se dice y no como está escrita, pasaste las cinco sabiendo siempre qué venía, y sacaste el PDF, que es la copia que se manda porque se ve igual en cualquier aparato. La presentación se guarda en pptx y se comparte en PDF: es la misma regla que aprendiste en Word.',
    }),
    [],
  );

  return (
    <VentanaDiapositivas
      cinta={CINTA_PPT_BASICO}
      guion={GUION_PRESENTA_Y_COMPARTE}
      escenario={DosPantallas}
      escenarioCuando={esDeLaFuncion}
      backstage={BackstageDeLaClase}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={14}
      insignia={insignia}
    />
  );
}

export const Lab = LabPresentaYComparte;

export default LabPresentaYComparte;
