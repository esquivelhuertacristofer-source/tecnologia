'use client';

import type { EditorView } from 'prosemirror-view';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ControlesDeClase } from '@/components/office/motor/comandos';
import VentanaTextos from '@/components/office/VentanaTextos';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_CUENTO } from './cinta';
import { CajonDeDibujos, ponerDibujo } from './controles';
import { DIBUJOS, dibujoDelDocumento, type Dibujo } from './dibujos';
import { GUION } from './guion';
import './estilo.css';

/**
 * Laboratorio de `n2-cuento-ilustrado` sobre Tecnia Textos.
 *
 * Ésta es la versión de «Mi cuento ilustrado» que se juega en un procesador de
 * textos de verdad, en lugar de arrastrar fichas de palabra a una tira y
 * rellenar zonas de color con frascos dentro de una escena 3D. La pedagogía es
 * la misma —la del documento §13.3— y está detallada, encargo por encargo, en la
 * cabecera de `guion.ts`. Lo que cambia es que ahora un cuento se escribe donde
 * se escriben los cuentos.
 *
 * Al entrar, la ventana ES Word. No hay mesa, ni gabinete, ni prensa: el papel
 * es papel Carta y se pagina solo mientras el alumno teclea el final.
 *
 * ── LA HERRAMIENTA QUE APORTA LA CLASE ──────────────────────────────────────
 * El motor no traía forma de meter una imagen. Se construye aquí, con la vía que
 * el propio motor abrió: un `ControlesDeClase` con el botón «Imagen», y el cajón
 * de dibujos como accesorio dentro de la ventana. Ni `comandos.ts` ni la cinta
 * del grado se tocan, que es lo que permite que las clases se construyan a la
 * vez sin pisarse.
 *
 * La vista del editor se guarda cuando el botón la entrega —`hacer` la recibe—:
 * es la única forma limpia de que el diálogo, que vive fuera de la ventana,
 * pueda escribir en el documento sin sacarla por una variable global.
 */

/**
 * La nota vale 100 y baja 6 por tropiezo, con suelo en 55, igual que la primera
 * clase de la sala. Un tropiezo es pulsar un botón que no era; cambiar de
 * pestaña y abrir el cajón para mirar no cuentan, porque mirar es lo que esta
 * clase pide.
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
  const [cajonAbierto, setCajonAbierto] = useState(false);
  const [hayDibujo, setHayDibujo] = useState(false);
  const vistaRef = useRef<EditorView | null>(null);

  /**
   * Las cinco ilustraciones pesan cerca de un mega cada una, y el cajón no se
   * abre hasta el cuarto encargo: si se piden en ese momento, el alumno ve cinco
   * cuadros grises justo cuando le toca decidir cuál cuenta lo mismo que su
   * cuento. Se piden al entrar, que es cuando sobra tiempo, y para cuando hace
   * falta ya están en el navegador.
   */
  useEffect(() => {
    const cargas = DIBUJOS.map((d) => {
      const img = new Image();
      img.src = d.src;
      return img;
    });
    return () => {
      for (const img of cargas) img.src = '';
    };
  }, []);

  /**
   * El botón «Imagen» de la pestaña Insertar.
   *
   * Abre el cajón y se queda hundido mientras está abierto, como los botones de
   * Word que despliegan una galería. `inerte` se queda sin declarar a propósito:
   * meter un dibujo se puede hacer siempre, esté el cursor donde esté.
   */
  const controles = useMemo<ControlesDeClase>(
    () => ({
      imagen: {
        hacer: (vista) => {
          vistaRef.current = vista;
          setHayDibujo(Boolean(dibujoDelDocumento(vista.state.doc)));
          setCajonAbierto(true);
          return true;
        },
        activo: () => cajonAbierto,
      },
    }),
    [cajonAbierto],
  );

  const poner = useCallback((dibujo: Dibujo) => {
    const vista = vistaRef.current;
    if (vista) ponerDibujo(vista, dibujo);
    setCajonAbierto(false);
  }, []);

  const cerrar = useCallback(() => {
    setCajonAbierto(false);
    vistaRef.current?.focus();
  }, []);

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
      cinta={CINTA_CUENTO}
      guion={GUION}
      controles={controles}
      accesorios={
        cajonAbierto ? <CajonDeDibujos hayDibujo={hayDibujo} onPoner={poner} onCerrar={cerrar} /> : null
      }
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={10}
      insignia={{
        nombre: 'Autor ilustrado',
        emoji: '📖',
        titulo: 'Tu cuento se cuenta con los dos juntos',
        detalle:
          'Le pusiste título a tu cuento y lo pintaste para que se vea de lejos, decidiste tú dónde iba el dibujo, elegiste entre cinco el único que cuenta lo mismo que el texto, y le escribiste el final con su mayúscula y su punto. Eso ya no es una tarea: es un cuento ilustrado, escrito por ti.',
      }}
    />
  );
}

export default Lab;
