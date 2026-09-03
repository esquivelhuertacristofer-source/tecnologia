'use client';

import { useCallback, useMemo, useState } from 'react';
import type { EditorView } from 'prosemirror-view';
import VentanaTextos from '@/components/office/VentanaTextos';
import type { ControlesDeClase } from '@/components/office/motor/comandos';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_BUSCA } from './cinta';
import { crearGuionBuscaYReemplaza } from './guion';
import { PanelBuscar, type PestanaBuscador } from './PanelBuscar';

/**
 * Laboratorio de `of-word-busca-y-reemplaza`.
 *
 * La ventana ES Word, igual que en la primera clase. Lo único que esta clase
 * añade es la herramienta que el motor no trae, y la añade por donde está
 * previsto: dos controles propios en el grupo Edición de la cinta —`controles`—
 * y un diálogo pintado por la clase —`accesorios`—. Ni `comandos.ts` ni
 * `tecniaTextos.tsx` se tocan, que es lo que permite que las 154 clases del
 * temario se construyan en paralelo sin pisarse.
 *
 * ── EL PUENTE ENTRE LA CINTA Y EL DIÁLOGO ───────────────────────────────────
 * `hacer(view)` recibe la vista del editor, y ése es el único sitio por el que
 * una clase puede alcanzarla: la ventana no la exporta. Se guarda al abrir el
 * cuadro, que es justo cuando hace falta, y el diálogo trabaja con ella. Aquí
 * dentro sólo vive si el cuadro está abierto y en qué pestaña —lo único que la
 * cinta necesita para hundir su botón—; el texto buscado y las casillas se
 * quedan en el diálogo, para que teclear en él no repinte la cinta entera.
 */

/**
 * La nota vale 100 y baja 6 por tropiezo, con suelo en 55; igual que la clase 1.
 *
 * Y el tropiezo aquí es lo que la clase pretende: estropear el documento con un
 * «Reemplazar todos» a ciegas NO baja la nota, porque el encargo 3 manda hacerlo
 * exactamente así. Lo que cuesta es pulsar botones de la cinta que no eran.
 */
function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

interface Dialogo {
  abierto: boolean;
  pestana: PestanaBuscador;
}

export function Lab({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  /**
   * El guion se fabrica UNA vez por laboratorio, no se importa hecho.
   *
   * Dos de sus encargos —romper el documento y devolverlo— se comprueban
   * leyendo la hoja y acordándose de lo que se leyó, porque la clase manda
   * revertirlos (ver `guion.ts`). Esa memoria tiene que morir con la partida: si
   * viviera en el módulo, volver a entrar al laboratorio en la misma pestaña del
   * navegador estrenaría el ejercicio con los dos encargos ya dados por hechos.
   */
  const guion = useMemo(() => crearGuionBuscaYReemplaza(), []);
  const [dialogo, setDialogo] = useState<Dialogo>({ abierto: false, pestana: 'buscar' });
  /**
   * La vista del editor, guardada en ESTADO y no en una referencia.
   *
   * Es un objeto estable que ProseMirror crea una sola vez, así que no hay
   * copias que se desincronicen; y guardándola en estado, el cuadro se monta en
   * el mismo repintado en que se abre. Con una referencia, React no se entera de
   * que ya existe y el primer clic en «Buscar» no pintaba nada.
   */
  const [vista, setVista] = useState<EditorView | null>(null);

  const abrir = useCallback((view: EditorView, pestana: PestanaBuscador) => {
    setVista(view);
    setDialogo({ abierto: true, pestana });
    return true;
  }, []);

  const controles = useMemo<ControlesDeClase>(() => {
    const hundido = (pestana: PestanaBuscador) => () => dialogo.abierto && dialogo.pestana === pestana;
    return {
      buscar: { hacer: (view) => abrir(view, 'buscar'), activo: hundido('buscar') },
      reemplazar: { hacer: (view) => abrir(view, 'reemplazar'), activo: hundido('reemplazar') },
    };
  }, [abrir, dialogo]);

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
      cinta={CINTA_BUSCA}
      guion={guion}
      controles={controles}
      accesorios={
        dialogo.abierto && vista ? (
          <PanelBuscar
            vista={vista}
            pestana={dialogo.pestana}
            onPestana={(pestana) => setDialogo((d) => ({ ...d, pestana }))}
            onCerrar={() => setDialogo((d) => ({ ...d, abierto: false }))}
          />
        ) : null
      }
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={14}
      insignia={{
        nombre: 'Reemplazo con red',
        emoji: '🔎',
        titulo: 'Ya no cambias nada a ciegas',
        detalle:
          'Rompiste el documento a propósito con un «Reemplazar todos» sin mirar, lo devolviste entero con un solo deshacer, y lo hiciste otra vez con las dos casillas puestas: ocho cambios en vez de doce. Eso es lo que te va a salvar el día que el archivo sea la tarea de verdad.',
      }}
    />
  );
}

export default Lab;
