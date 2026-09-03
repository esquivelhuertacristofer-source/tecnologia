'use client';

import { useCallback, useMemo, useState } from 'react';
import VentanaTextos from '@/components/office/VentanaTextos';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_REVISA } from './cinta';
import { controlesDeRevision } from './controles';
import { COMENTARIO_DEL_PROFE, guionPara } from './guion';
import { PanelRevision } from './panel';
import { EstadoRevision } from './revision';

/**
 * Laboratorio de `of-word-revisa-y-comenta` — «Revisa y comenta».
 *
 * Mismo molde que las clases anteriores: al entrar, la ventana ES Word. Lo que
 * esta clase añade son tres herramientas que el motor no trae —el corrector de
 * ortografía, los comentarios y el control de cambios— y las añade por la vía
 * que `comandos.ts` dejó abierta: un objeto `ControlesDeClase` declarado en esta
 * carpeta y un accesorio propio. Ni un archivo del motor cambia, y por eso esta
 * clase se puede construir a la vez que las otras ocho de la sala.
 *
 * El estado de la revisión vive en un objeto de esta clase y no en `useState`
 * porque lo tienen que leer tres sitios que no comparten árbol de React: los
 * botones de la cinta —que el motor consulta con el estado del editor, fuera de
 * React—, el panel de revisión y las decoraciones de ProseMirror. Se crea una
 * sola vez, con el comentario que el maestro ya había dejado en la nota.
 */

/**
 * La nota vale 100 y baja 6 por tropiezo, con suelo en 55: la misma escala que
 * las clases del grado Básico, porque una insignia tiene que significar lo mismo
 * en toda la sala.
 *
 * Un tropiezo es pulsar un botón que no era o fallar la pregunta del panel.
 * Cambiar de pestaña no cuenta —explorar es lo que se pide— e insistir con el
 * mismo control tampoco: eso lo lleva la ventana.
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
  // El estado de la revisión nace una sola vez y vive fuera de React —lo leen
  // los controles de la cinta y las decoraciones de ProseMirror, que no están en
  // el árbol—. Se guarda con el inicializador perezoso de `useState` y no con un
  // `useRef` rellenado en el render: leer o escribir una ref durante el render es
  // justo lo que React prohíbe, porque un render puede repetirse o descartarse.
  const [estado] = useState(() => new EstadoRevision([{ ...COMENTARIO_DEL_PROFE }]));

  const controles = useMemo(() => controlesDeRevision(estado), [estado]);
  const accesorios = useMemo(() => <PanelRevision estado={estado} />, [estado]);
  // El guion nace atado a este estado: el encargo 5 pregunta si el control de
  // cambios quedó ENCENDIDO, no si se pulsó su botón. Ver `guionPara`.
  const guion = useMemo(() => guionPara(estado), [estado]);

  const alTerminar = useCallback(
    ({ tropiezos, segundos }: { pasos: number; tropiezos: number; segundos: number }) => {
      const { score, stars } = calificar(tropiezos);
      onScore(score);
      onComplete({ score, stars, xp: 40, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  return (
    <VentanaTextos
      cinta={CINTA_REVISA}
      guion={guion}
      controles={controles}
      accesorios={accesorios}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={18}
      insignia={{
        nombre: 'Revisa y comenta',
        emoji: '💬',
        titulo: 'Ya sabes trabajar sobre el texto de otro',
        detalle:
          'Corregiste lo que el corrector veía, encontraste tú lo que el corrector no podía ver, preguntaste con un comentario en vez de cambiarle el texto a alguien, dejaste tu nombre pegado a lo que escribiste y decidiste qué propuestas del maestro se quedaban. Eso es exactamente lo que se hace en un trabajo de equipo, en la escuela y fuera de ella.',
      }}
    />
  );
}

export default Lab;
