'use client';

import { Lamina } from './Lamina';
import type { Mazo } from './mazo';
import type { Libre } from './modelo';

/**
 * **Un botón del Zoom de resumen**: la miniatura viva de a dónde lleva (§44.5).
 *
 * ── POR QUÉ ES LA DIAPOSITIVA DE VERDAD Y NO UN CUADRO CON SU NOMBRE ────────
 *
 * Porque lo que hace útil a un Zoom es que **se ve a dónde vas antes de
 * pulsar**. Un índice de textos es una lista de vínculos, que es justo lo que
 * el alumno ya sabe hacer desde §43.5 armando el quiosco a mano; lo que esta
 * clase enseña es lo que el botón automático añade encima.
 *
 * ── UNA SOLA SUPERFICIE, OTRA VEZ ───────────────────────────────────────────
 *
 * Lo usan el lienzo y la lámina del público, igual que `HojaImpresa` en §44.4:
 * si el índice se viera de una manera al montarlo y de otra al presentarlo, el
 * alumno estaría preparando algo que no es lo que va a proyectar. Es la lección
 * de §41 y ya no se vuelve a pagar.
 *
 * ── EL CINTURÓN CONTRA LA RECURSIÓN ─────────────────────────────────────────
 *
 * La miniatura pinta la diapositiva destino **sin sus zooms**. Hoy no hace
 * falta —el índice nace el primero y apunta hacia adelante— pero un zoom que
 * apuntara al índice se dibujaría a sí mismo dentro de sí mismo hasta que el
 * navegador se rindiera. Una línea evita una clase entera de accidente.
 */
export function MiniZoom({ mazo, libre, tinta }: { mazo: Mazo; libre: Libre; tinta: string }) {
  const i = typeof libre.destino === 'number' ? libre.destino : -1;
  const destino = mazo.diapositivas[i];

  return (
    <span className="dpw-zoom">
      <span className="dpw-zoom-marco">
        {destino ? (
          <Lamina mazo={mazo} diapositiva={{ ...destino, libres: destino.libres.filter((x) => x.clase !== 'zoom') }} />
        ) : (
          /*
           * El destino puede no existir si alguien borró la diapositiva a la
           * que apuntaba. Se dice, no se disimula con un hueco gris: un índice
           * roto que parece bueno manda al público a ninguna parte en mitad de
           * la presentación, y ahí ya no hay quien lo arregle.
           */
          <span className="dpw-zoom-roto">Ya no está</span>
        )}
      </span>
      {/*
        La tinta viene de fuera —del tema de la diapositiva que lo contiene— y no
        se adivina aquí. Sin ella el rótulo heredaba el color de texto del
        programa, casi negro, y sobre una diapositiva de fondo oscuro no se leía:
        el índice enseñaba tres miniaturas sin nombre.
      */}
      <span className="dpw-zoom-nombre" style={{ color: tinta }}>
        {libre.contenido}
      </span>
    </span>
  );
}

export default MiniZoom;
