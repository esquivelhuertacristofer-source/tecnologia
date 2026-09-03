'use client';

import { useCallback, useEffect, useState } from 'react';
import VentanaTextos from '@/components/office/VentanaTextos';
import type { ActivityProps } from '@/types/activity-contract';
import { CINTA_FORMULARIOS } from './cinta';
import { CONTROLES } from './controles';
import {
  formulario,
  OPCIONES_EQUIPO,
  type CampoLeido,
  type ModoProteccion,
} from './formulario';
import { GUION } from './guion';
import { ListaDesplegable, PanelRestringir } from './PanelRestringir';
import './estilo.css';

/**
 * Laboratorio de `of-word-formularios` — «Una ficha que se rellena sola».
 *
 * La ventana ES Word, igual que en la clase 1: nada de escena, ni mueble, ni
 * interfaz pegada encima de un 3D. Lo que esta clase añade al motor son tres
 * cosas y viajan por las dos puertas que el motor deja abiertas:
 *
 *  · `cinta`      — la del grado Avanzado más los grupos «Controles» y «Proteger».
 *  · `controles`  — los cuatro botones nuevos, y los de siempre envueltos para
 *                   que se apaguen con la ficha protegida.
 *  · `accesorios` — el panel de Restringir edición y el desplegable de la lista.
 *
 * Este archivo no sabe nada de ProseMirror: sólo enchufa cables y hace de puente
 * entre el aparato —que vive dentro del editor— y los dos paneles, que son React.
 */

/**
 * La nota vale 100 y baja 6 por tropiezo, con suelo en 55, igual que el canon.
 * Un tropiezo es pulsar un botón de la cinta que no era; cambiar de pestaña,
 * abrir el panel y trastear con los huecos de la ficha no cuentan, porque son
 * exactamente lo que la clase pide hacer.
 */
function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

/**
 * Con la ficha cerrada, los DOS desplegables de la letra se apagan también.
 *
 * Los veintiséis botones del motor ya se apagan solos —`controles.ts` los
 * envuelve—, pero el tipo de letra y el tamaño no son botones: la ventana los
 * pinta como `<select>` y no le pregunta a la clase si están inertes. Resultado,
 * medido jugando mal: con la ficha protegida el alumno cambiaba el tamaño a 28,
 * el documento no se movía —lo paraba `filterTransaction`—, y el maestro le
 * apuntaba un TROPIEZO y le soltaba la pista del encargo sin haberla pedido.
 * Seis puntos y la respuesta regalada por tocar un desplegable que se veía tan
 * vivo como siempre. Es §36.8 (D): lo que el programa deja intentar no puede
 * cobrar.
 *
 * Se apagan desde aquí y no desde la ventana porque la ventana es de las 154
 * clases. Se vuelve a hacer con un observador porque la cinta rehace sus hijos
 * cada vez que se cambia de pestaña y el `disabled` se iría con los viejos; se
 * observa sólo `childList`, así que poner el atributo no se dispara a sí mismo.
 */
function useApagarLaLetra(protegido: boolean) {
  useEffect(() => {
    const apagar = () => {
      document.querySelectorAll<HTMLSelectElement>('.txtw-cinta .txtw-select').forEach((sel) => {
        sel.disabled = protegido;
        if (protegido) sel.title = 'Aquí no se puede: el documento está protegido';
        else sel.removeAttribute('title');
      });
    };
    apagar();
    const cinta = document.querySelector('.txtw-cinta');
    if (!cinta) return undefined;
    const observador = new MutationObserver(apagar);
    observador.observe(cinta, { childList: true, subtree: true });
    return () => observador.disconnect();
  }, [protegido]);
}

export function Lab({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [modo, setModo] = useState<ModoProteccion>('ninguno');
  const [lista, setLista] = useState<{ campo: CampoLeido; x: number; y: number } | null>(null);
  /**
   * Si el panel puede señalar dentro de sí mismo lo siguiente que hay que
   * pulsar (§37): sólo cuando la ficha ya tiene sus huecos, que es cuando el
   * encargo de protegerla es de verdad el que toca. Se decide al ABRIRLO y no
   * en cada pintada porque el panel no conoce el guion: lo único que sabe el
   * aparato es qué hay escrito en el documento.
   */
  const [guiarPanel, setGuiarPanel] = useState(false);

  useApagarLaLetra(modo !== 'ninguno');

  /*
   * El aparato es único de módulo —el guion es una constante y necesita poder
   * preguntarle «¿estás protegido?» desde `comprueba`—, así que la vida del
   * laboratorio la marca este efecto: al entrar, ficha sin proteger y sin vista;
   * al salir, lo mismo. Sin esto, volver a entrar heredaría la protección de la
   * partida anterior y el alumno empezaría con la ficha ya cerrada.
   */
  useEffect(() => {
    // No hace falta poner el estado de React en su sitio: cada entrada al
    // laboratorio monta un componente nuevo y sus tres estados nacen ya en
    // «cerrado, sin proteger, sin desplegable». Lo único que sobrevive entre
    // partidas es el aparato, y es lo que se reinicia aquí.
    formulario.reiniciar();

    formulario.alAbrirPanel = () => {
      setPanelAbierto(true);
      setGuiarPanel(formulario.huecosPuestos());
    };
    formulario.alPedirLista = (info) => setLista(info);
    formulario.alCambiarModo = () => setModo(formulario.modo);

    return () => {
      formulario.alAbrirPanel = null;
      formulario.alPedirLista = null;
      formulario.alCambiarModo = null;
      formulario.reiniciar();
    };
  }, []);

  const alTerminar = useCallback(
    ({ tropiezos, segundos }: { pasos: number; tropiezos: number; segundos: number }) => {
      const { score, stars } = calificar(tropiezos);
      onScore(score);
      onComplete({ score, stars, xp: 55, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  const elegirDeLaLista = useCallback((opcion: string) => {
    const info = lista;
    const vista = formulario.vista;
    setLista(null);
    if (!info || !vista) return;
    // Se relee el campo por posición: entre que se abrió el desplegable y se
    // eligió, el documento pudo moverse (una repaginación, otra edición) y las
    // posiciones guardadas apuntarían al sitio de antes.
    formulario.escribirEnCampo(vista, info.campo, `${opcion} ▾`);
  }, [lista]);

  return (
    <VentanaTextos
      cinta={CINTA_FORMULARIOS}
      guion={GUION}
      controles={CONTROLES}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={18}
      accesorios={
        <>
          {/*
            La marca de «ficha cerrada». No se ve: existe para que el CSS de esta
            clase pueda apagar lo que la ventana pinta por su cuenta —la galería
            de Estilos, que dibuja sus propias cajitas y no consulta a nadie— sin
            tocar `ventanaTextos.css`, que es de las 154 clases. Con `:has` la
            regla sólo vive mientras esta clase esté en pantalla y protegida.
          */}
          {modo !== 'ninguno' && <span className="frmw-cerrado" hidden aria-hidden="true" />}
          <PanelRestringir
            abierto={panelAbierto}
            modo={modo}
            guiar={guiarPanel}
            onCerrar={() => setPanelAbierto(false)}
            onAplicar={(m) => formulario.proteger(m)}
            onSuspender={() => formulario.proteger('ninguno')}
          />
          {lista && (
            <ListaDesplegable
              x={lista.x}
              y={lista.y}
              opciones={OPCIONES_EQUIPO}
              onElegir={elegirDeLaLista}
              onCerrar={() => {
                setLista(null);
                // El foco entró en el desplegable; si se cierra sin elegir hay
                // que devolverlo al documento o el teclado se queda en el aire.
                formulario.vista?.focus();
              }}
            />
          )}
        </>
      }
      insignia={{
        nombre: 'Ficha blindada',
        emoji: '🔒',
        titulo: 'Tu documento ya sabe defenderse',
        detalle:
          'Le pusiste huecos a la ficha —texto, lista y casilla—, restringiste la edición a «Rellenar formularios» y la contestaste entera sin poder tocar ni una coma de lo demás. Eso es lo que hace que una ficha vuelva de treinta casas igual de entera que salió. Y sabes lo otro: quitar la protección no pide contraseña, así que sirve contra accidentes, no contra curiosos.',
      }}
    />
  );
}

export default Lab;
