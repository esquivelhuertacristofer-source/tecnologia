'use client';

import { useCallback, useEffect } from 'react';
import VentanaTextos from '@/components/office/VentanaTextos';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_VARIAS_PAGINAS } from './cinta';
import { CONTROLES_VARIAS_PAGINAS } from './controles';
import { AccesoriosVariasPaginas } from './encabezado';
import { reiniciarEstado } from './estado';
import { GUION_VARIAS_PAGINAS } from './guion';
import './estilo.css';

/**
 * Laboratorio de `n4-documento-de-varias-paginas` (doc §26.3).
 *
 * Es la tercera parada de la unidad 4 del nivel 4 y cierra el bloque del
 * procesador de textos, así que hereda el aparato entero de §36: al entrar, la
 * ventana ES Word. La clase aporta tres cosas suyas y ninguna toca el motor —la
 * cinta compuesta con su grupo Páginas, los cuatro controles nuevos y las
 * franjas de encabezado y pie, que se pintan sobre el papel por la ranura
 * `accesorios`—.
 *
 * El salto, el encabezado y el número no son adornos: son las tres formas de la
 * misma idea. En un documento largo se le da la regla al programa y el programa
 * la mantiene. Por eso las tres se enseñan por contraste con la manera manual,
 * y por eso el encargo 2 manda hacerlo mal a propósito.
 */

/**
 * La nota vale 100 y baja 6 por tropiezo, con suelo en 55 — el mismo baremo que
 * el resto de la sala. Un tropiezo es pulsar un botón que no era o fallar una
 * de las dos preguntas; dar enters en el encargo 2 no cuenta, porque es lo que
 * el encargo pide.
 */
function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function Lab({ onProgress, onScore, onComplete, alSalir }: ActivityProps & { alSalir?: () => void }) {
  /*
   * El encabezado, el pie y el número viven en un estado de módulo —no están en
   * el documento de ProseMirror, igual que en Word no están en el cuerpo—, así
   * que hay que dejarlos limpios al entrar y al salir. Sin esto, volver a
   * abrir el laboratorio te encontraría el encabezado de la partida anterior ya
   * escrito, y el encargo 4 se daría por hecho sin hacer nada.
   */
  useEffect(() => {
    reiniciarEstado();
    return () => reiniciarEstado();
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
    <VentanaTextos
      cinta={CINTA_VARIAS_PAGINAS}
      guion={GUION_VARIAS_PAGINAS}
      controles={CONTROLES_VARIAS_PAGINAS}
      accesorios={<AccesoriosVariasPaginas />}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={9}
      insignia={{
        nombre: 'Editor de varias páginas',
        emoji: '📄',
        titulo: 'Ya no acomodas a mano lo que la computadora acomoda sola',
        detalle:
          'Pusiste un salto de página de verdad en vez de un montón de enters, escribiste el encabezado una sola vez y lo viste aparecer en las tres hojas, y numeraste el documento sin teclear un solo número. Eso es lo que separa un trabajo que aguanta cualquier cambio de uno que se desacomoda entero por una línea.',
      }}
    />
  );
}

export default Lab;
