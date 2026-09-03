'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { dmSans, manrope } from '@/app/fonts';
import { EntradaGuardarEImprimir } from '@/components/activities/office/word/guardar-e-imprimir/Entrada';
import { LabGuardarEImprimir } from '@/components/activities/office/word/guardar-e-imprimir/Lab';
import { leerEscritorio } from '@/components/activities/office/word/guardar-e-imprimir/escritorio';
import { inspeccionar, verificar } from '@/components/office/motor/paginador';
import '@/components/hub/CenHub.css';

/**
 * Banco de pruebas de `of-word-guardar-e-imprimir` — /banco-word/guardar-e-imprimir.
 *
 * Monta el laboratorio solo, sin entrada ni anfitrión, con los eventos del
 * contrato a la vista para poder medirlo desde fuera. No está enlazado desde el
 * hub: es instrumento de trabajo, igual que /banco-word y /banco-paginacion.
 *
 * Expone el verificador de PRODUCCIÓN del paginador, no una copia. Es la lección
 * de §36.5: dos veces en una tarde la copia de la sonda se quedó atrás respecto
 * al motor y cantó defectos que no existían. Medir con un instrumento distinto
 * del que se usa es medir otra cosa.
 *
 * Y expone también el escritorio de la clase —los archivos guardados, las copias
 * y si ya se imprimió—, que es lo que el guion consulta para dar por hechos los
 * encargos 5, 6 y 7. Sin eso, una sonda tendría que adivinar leyendo la pantalla
 * qué cree el maestro que ha pasado.
 */
export default function PaginaBancoGuardarEImprimir() {
  const [avance, setAvance] = useState(0);
  const [nota, setNota] = useState<string>('—');
  /*
   * Con `?entrada=1` se monta la ENTRADA en vez del laboratorio. La clase no
   * está enchufada al registro todavía —eso es cableado y lo hace otro—, así que
   * sin esto la pantalla de entrada no se podría abrir en ninguna parte y sus
   * cuatro fichas y su ruta se entregarían sin haberlas visto una sola vez.
   *
   * Se lee como una fuente externa y no con un efecto que llame a `setState`: en
   * el servidor no hay `location`, y el cuento de las dos instantáneas es
   * exactamente para eso —la del servidor dice «no» y la del navegador la
   * verdad, sin repintar en cascada—.
   */
  const comoEntrada = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).has('entrada'),
    () => false,
  );

  useEffect(() => {
    const flujo = () => document.querySelector<HTMLElement>('.txtw-flujo');
    const w = window as unknown as Record<string, unknown>;
    w.__verificarTextos = () => {
      const f = flujo();
      return f ? verificar(f) : null;
    };
    w.__renglonesTextos = () => {
      const f = flujo();
      return f ? inspeccionar(f) : null;
    };
    w.__escritorio = () => leerEscritorio();
  }, []);

  const Montaje = comoEntrada ? EntradaGuardarEImprimir : LabGuardarEImprimir;

  return (
    <>
      {/*
        Todo `CenHub.css` vive bajo el ámbito `.cen-hub` y las tipografías
        viajan en variables que pone el armazón del hub. Sin esta envoltura la
        entrada se pinta desnuda, y eso no sería un fallo suyo: le faltaría su
        anfitrión. La ventana de Word no se entera de nada, porque se cuelga del
        `<body>` con un portal.
      */}
      <div className={`cen-hub ${dmSans.variable} ${manrope.variable}`}>
        <Montaje
          config={{}}
          onProgress={setAvance}
          onScore={() => {}}
          onComplete={(r) => setNota(`score ${r.score} · ${r.stars}★ · ${r.errores} tropiezos`)}
        />
      </div>
      <div
        data-banco="1"
        data-avance={avance.toFixed(3)}
        data-nota={nota}
        style={{ position: 'fixed', bottom: 0, left: 0, width: 1, height: 1, overflow: 'hidden' }}
      />
    </>
  );
}
