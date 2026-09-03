'use client';

import { useCallback, useEffect, useMemo } from 'react';
import VentanaTextos from '@/components/office/VentanaTextos';
import type { ControlesDeClase } from '@/components/office/motor/comandos';
import type { ActivityProps } from '@/types/activity-contract';
import { AccesoriosGuardarEImprimir } from './accesorios';
import { CINTA_GUARDAR } from './cinta';
import {
  avisarAlMaestro,
  cambiarEscritorio,
  escribirArchivo,
  fijarVista,
  guardarDeVerdad,
  leerEscritorio,
  reiniciarEscritorio,
  rutaCompleta,
} from './escritorio';
import { GUION_GUARDAR_E_IMPRIMIR } from './guion';

/**
 * Laboratorio de `of-word-guardar-e-imprimir` (doc §36.4).
 *
 * Al entrar, la ventana ES Word: no hay escena, ni mueble, ni mesa. Lo que esta
 * clase añade encima del motor son tres botones y dos cuadros de diálogo, y los
 * añade por la puerta que el motor deja abierta —`controles` y `accesorios`—, sin
 * tocar una línea de `comandos.ts` ni de `VentanaTextos.tsx`. Ésa es la razón de
 * que las 154 clases del temario se puedan construir a la vez.
 *
 * Los tres controles no hacen el trabajo: lo despachan. `gi-guardar` pulsa el
 * disquete que el motor ya tiene —guardar de verdad ya funciona y reescribirlo
 * dejaría el letrero de «Sin guardar» mintiendo—, y los otros dos abren su
 * cuadro. De paso, los tres apuntan la vista del editor en el escritorio: es el
 * único sitio por donde una clase la recibe, y sin ella un cuadro de diálogo no
 * tendría manera de avisarle al maestro de que ya está hecho lo que pedía.
 */

/**
 * Los dos clics que la clase manda dar y la ventana cobra igual.
 *
 * La ventana cuenta un tropiezo por cada botón de la cinta que no resuelva el
 * encargo del momento —«pulsaste un botón que no era»—, y con eso basta en una
 * clase donde los botones hacen cosas. Aquí dos de ellos no hacen nada: abren un
 * cuadro de diálogo, y lo que resuelve el encargo pasa DENTRO del cuadro. El
 * encargo 7 dice «abre otra vez Guardar como» y el 8 dice «abre Imprimir»: son
 * exactamente los dos clics correctos, y sin este descuento costaban doce puntos
 * y dejaban en dos estrellas una partida perfecta. Medido: 4 tropiezos y nota 76
 * en la primera pasada de punta a punta sin un solo error del alumno.
 *
 * Los otros dos clics de cuadro —el del encargo 5 y el del 3— no hacen falta
 * descontarlos porque tienen su propio encargo y la ventana los da por buenos.
 *
 * El arreglo de verdad es del motor y está pedido en el cableado: que la ventana
 * no cobre tropiezo por pulsar **el control al que apunta su propio señalador**,
 * que desde el §37 es el que el encargo manda pulsar. Mientras tanto se
 * descuenta aquí, que es donde se sabe cuántos son.
 *
 * **Si algún día el motor lo arregla, este número baja a 0 el mismo día.** Con
 * las dos cosas a la vez, un alumno con dos tropiezos de verdad sacaría 100.
 * Medido hoy: partida limpia = 2 tropiezos cobrados, nota 100; el marcador de la
 * insignia enseña los 2, porque los pinta la ventana con la cuenta cruda.
 *
 * ── ESE DÍA LLEGÓ · 15-ago-2026 ────────────────────────────────────────────
 *
 * `VentanaTextos.tsx` ya no cobra tropiezo por pulsar un control que la señal
 * del encargo nombra, así que **el descuento baja a 0**, tal como pedía el
 * párrafo de arriba. Lo destapó `n10-portafolio-y-cv`, que tiene dos encargos
 * de «pulsa este mismo botón sobre cuatro sitios distintos» y salía con 2
 * tropiezos en una partida perfecta: el mismo defecto con otra cara.
 *
 * La constante se queda escrita en 0 y no se borra, y el párrafo de arriba
 * tampoco: es el registro de que aquí hubo un parche, de por qué, y de que la
 * cura llegó al sitio donde vivía la causa. Si algún día vuelve a hacer falta
 * un descuento en una clase, lo primero que hay que mirar es si el defecto no
 * está otra vez en la ventana.
 */
const CLICS_DE_CUADRO = 0;

/**
 * La nota vale 100 y baja 6 por tropiezo, con suelo en 55 — la misma escala que
 * la clase 1. Un tropiezo es pulsar un botón que no era o contestar mal una
 * pregunta del panel; abrir un cuadro y cerrarlo sin guardar no cuenta, porque
 * mirar antes de decidir es exactamente lo que esta clase pide.
 */
function calificar(tropiezos: number) {
  const propios = Math.max(0, tropiezos - CLICS_DE_CUADRO);
  const score = Math.max(55, 100 - propios * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabGuardarEImprimir({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  // Volver a entrar no puede heredar los archivos de la vez pasada: el primer
  // encargo depende de que la carpeta «Mis documentos» esté vacía.
  useEffect(() => {
    reiniciarEscritorio();
  }, []);

  /*
   * El disquete de la barra de título también guarda, y el escritorio tiene que
   * enterarse.
   *
   * Medido el 10-ago-2026 jugando mal: en el encargo «Guárdalo ya» se pulsó el
   * disquete de arriba en vez del botón de la cinta. El programa contestó
   * «Guardado en este equipo», el letrero cambió a «Guardado»… **y el maestro
   * siguió pidiendo que guardara**. Peor todavía: dos encargos después, el
   * cuadro de Guardar como enseñaba «Mis documentos» vacía, con el letrero
   * diciendo que estaba guardado. El programa se contradecía a sí mismo delante
   * del niño, que es lo último que puede hacer una clase sobre guardar.
   *
   * El disquete lo pinta la ventana y no se puede tocar, así que se le escucha
   * el clic: cuando ocurre, el escritorio de la clase apunta el archivo igual
   * que si se hubiera pulsado el botón de la cinta. El oyente va sobre
   * `document` y en fase de captura porque la ventana vive en un portal que
   * tarda un cuadro en existir; buscar el botón en el montaje llegaría antes que
   * el botón.
   *
   * `escribirArchivo` no duplica —guardar dos veces el mismo nombre en la misma
   * carpeta pisa el archivo, como Windows—, así que el camino normal, donde
   * `gi-guardar` pulsa este mismo disquete, sigue apuntando una sola vez.
   *
   * Queda un resto medido y aceptado: si el disquete es lo PRIMERO que se pulsa
   * en toda la clase, el encargo se palomea con el gesto siguiente y no en el
   * acto. `avisarAlMaestro()` necesita la vista del editor, y una clase sólo la
   * recibe cuando se pulsa uno de SUS controles (`hacer(vista)`); antes de eso no
   * hay por dónde pedirle al maestro que vuelva a corregir. El archivo ya está
   * apuntado, el recado ya salió y cualquier tecla o clic lo cierra, así que no
   * encierra a nadie. El arreglo de raíz es del motor y está en el cableado.
   */
  useEffect(() => {
    const alGuardar = (e: Event) => {
      const donde = e.target as HTMLElement | null;
      if (!donde?.closest?.('.txtw-rapido [data-control="guardar"]')) return;
      const actual = leerEscritorio().actual;
      escribirArchivo(actual);
      cambiarEscritorio({ recado: `Guardado en ${rutaCompleta(actual)}.` });
      avisarAlMaestro();
    };
    document.addEventListener('click', alGuardar, true);
    return () => document.removeEventListener('click', alGuardar, true);
  }, []);

  const controles = useMemo<ControlesDeClase>(
    () => ({
      'gi-guardar': {
        hacer: (vista) => {
          fijarVista(vista);
          if (!guardarDeVerdad()) return false;
          const actual = leerEscritorio().actual;
          escribirArchivo(actual);
          cambiarEscritorio({ recado: `Guardado en ${rutaCompleta(actual)}.` });
          return true;
        },
      },
      'gi-guardar-como': {
        hacer: (vista) => {
          fijarVista(vista);
          cambiarEscritorio({ dialogo: 'guardar-como' });
          return true;
        },
      },
      'gi-imprimir': {
        hacer: (vista) => {
          fijarVista(vista);
          cambiarEscritorio({ dialogo: 'imprimir' });
          return true;
        },
      },
    }),
    [],
  );

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
      cinta={CINTA_GUARDAR}
      guion={GUION_GUARDAR_E_IMPRIMIR}
      controles={controles}
      accesorios={<AccesoriosGuardarEImprimir />}
      onAvance={onProgress}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={14}
      insignia={{
        nombre: 'Guardar e imprimir',
        emoji: '💾',
        titulo: 'Ya no vas a perder tu trabajo',
        detalle:
          'Viste con tus ojos que lo escrito no existe hasta que se guarda, le pusiste al archivo un nombre que sirve y lo metiste en la carpeta que tú elegiste, sacaste la copia en PDF que es la que se manda, y contaste las hojas antes de gastarlas. Eso vale igual en Word, en el celular y en cualquier programa donde escribas algo.',
      }}
    />
  );
}

/** Nombre corto, el que usa el banco de pruebas de esta carpeta. */
export const Lab = LabGuardarEImprimir;

export default LabGuardarEImprimir;
