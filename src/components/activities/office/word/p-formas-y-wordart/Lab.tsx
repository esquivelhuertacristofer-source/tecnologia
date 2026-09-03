'use client';

import { useCallback } from 'react';
import VentanaTextos from '@/components/office/VentanaTextos';
import type { ActivityProps } from '@/types/activity-contract';
import { Accesorios } from './Accesorios';
import { CINTA_FORMAS } from './cinta';
import { CONTROLES } from './controles';
import { GUION } from './guion';

/**
 * Laboratorio de `n4-formas-y-wordart` sobre el motor de Tecnia Textos.
 *
 * Es el port de la Mesa de Maquetación (§26.2) al programa de verdad. Allí el
 * alumno arrastraba placas de estilo desde un cajón hasta un caballete y movía
 * palancas en una barra de madera; aquí abre un folleto de escuela, hace clic en
 * un renglón y pulsa WordArt. Lo que enseña es lo mismo, en el mismo orden y con
 * los mismos tropiezos provocados a propósito: el globo de diálogo donde nadie
 * habla, la foto lejos de su texto y el estirón que la deforma.
 *
 * La cinta es la del grado Básico recortada a lo que un niño de diez años usa
 * hoy, más la pestaña Formato de las herramientas de imagen y una pestaña Vista
 * con un solo botón. La entrada de la actividad —su video, sus cuatro fichas y
 * su narración— no se toca: sigue contando POR QUÉ importa el tema, y esto
 * cuenta qué se hace.
 */

/**
 * La misma escala que las demás clases de Word: 100 y baja 6 por tropiezo, con
 * suelo en 55, para que un alumno pueda comparar sus notas entre clases. Un
 * tropiezo es pulsar un botón que no era —elegir el globo de diálogo cuenta,
 * porque elegir es lo que el encargo pide—; cambiar de pestaña no cuenta, porque
 * explorar la cinta es exactamente lo que estas clases quieren que haga.
 */
function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function Lab({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
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
      cinta={CINTA_FORMAS}
      guion={GUION}
      controles={CONTROLES}
      accesorios={<Accesorios />}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={12}
      insignia={{
        nombre: 'Artista del título',
        emoji: '✨',
        titulo: '¡Quedó de revista!',
        detalle:
          'Pusiste un título que se lee de lejos, marcaste con una forma el dato que importa y colocaste la foto junto a su texto, con el texto alrededor, del tamaño justo y sin deformarla. Eso es componer una página, y sirve igual para un folleto, para una portada de trabajo y para un cartel.',
      }}
    />
  );
}

export default Lab;
