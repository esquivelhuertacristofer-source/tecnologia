'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { EditorView } from 'prosemirror-view';
import VentanaTextos from '@/components/office/VentanaTextos';
import { documentoDesdeHtml } from '@/components/office/motor/useEditor';
import type { ActivityProps } from '@/types/activity-contract';
import { AccesoriosPlantillas } from './Accesorios';
import { CINTA_PLANTILLAS } from './cinta';
import { CONTROLES, fijarAviso, fijarEncargo } from './controles';
import { contarHojas, ESTADO, normaliza, reiniciar, type Zona } from './estado';
import { GUION_PLANTILLAS } from './guion';
import { plantillaPorId } from './plantillas';

/**
 * Laboratorio de `of-word-plantillas` — «Lo que sale en todas las hojas».
 *
 * La ventana ES el programa; el laboratorio sólo le pasa su cinta, su guion, sus
 * cuatro herramientas y lo que pinta dentro. Lo único que tiene enjundia es el
 * puente entre el estado de la clase —encabezado, pie, número, plantilla— y el
 * motor, y son cuatro líneas con una explicación larga:
 *
 * **`refrescar` despacha una transacción VACÍA.** El motor corrige cuando pasa
 * algo en el documento o cuando se pulsa la cinta, y escribir en el encabezado
 * no es ninguna de las dos cosas: el encabezado no vive en el documento de
 * ProseMirror, y ése es justo el tema de la clase. Una transacción sin pasos no
 * cambia el documento, no entra en la pila de deshacer y no dispara la
 * paginación, pero sí pasa por `dispatchTransaction`, que es por donde el motor
 * vuelve a preguntarle al encargo si ya está hecho. Así los encargos del
 * encabezado se corrigen leyendo el ESTADO en el momento en que cambia —y se
 * despaloman solos si el alumno lo borra—, en vez de creerle a un clic.
 *
 * **La vista se guarda cuando llega.** `ControlDeClase.hacer` es lo único del
 * contrato que recibe la `EditorView`, así que la primera pulsación de la cinta
 * —que es el primer encargo de la clase— la deja apuntada para montar la
 * plantilla y para todo lo demás.
 */

/**
 * Igual que en el canon: 100, menos 6 por tropiezo, con suelo en 55. Un tropiezo
 * es pulsar un control que no resuelve el encargo; explorar pestañas no cuenta.
 *
 * Ninguno de los ocho encargos obliga a pulsar un botón que no lo cierre, así
 * que una partida limpia da 100. Eso no es regalar la nota: es no cobrarle al
 * alumno por hacer exactamente lo que se le pidió.
 */
function calificar(tropiezos: number) {
  const score = Math.max(55, 100 - tropiezos * 6);
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { score, stars };
}

export function LabPlantillas({
  onProgress,
  onScore,
  onComplete,
  alSalir,
}: ActivityProps & { alSalir?: () => void }) {
  const [pulso, setPulso] = useState(0);
  const vista = useRef<EditorView | null>(null);
  /**
   * En qué encargo va la clase. Lo dice el motor por `onAvance` y sirve para una
   * cosa sola: que las cuatro herramientas sepan si la pulsación que les llega
   * es la que el panel está pidiendo o un desvío (ver `controles.ts`).
   */
  const encargo = useRef(0);

  useEffect(() => {
    fijarEncargo(() => GUION_PLANTILLAS.pasos[encargo.current]?.senal?.control);
    return () => fijarEncargo(() => undefined);
  }, []);

  // El estado de la clase es un singleton de módulo (ver `estado.ts`), así que
  // se limpia al entrar y al salir: si no, la segunda visita abriría con el
  // encabezado de la primera y los encargos nacerían hechos.
  useEffect(() => {
    reiniciar();
    return reiniciar;
  }, []);

  /*
   * El segundo intento, y por qué hace falta.
   *
   * El motor se calla mientras celebra: `evaluar` sale por la puerta de atrás
   * durante el segundo y medio del «¡Eso es!». En la mayoría de las clases eso
   * no se nota porque lo siguiente que hace el alumno es teclear, y cada tecla
   * vuelve a preguntar. Aquí sí se notaba, y se cazó midiendo: el encargo 1
   * abre la galería —y las tarjetas quedan delante de los ojos—, así que un
   * alumno rápido elige plantilla ANTES de que termine la celebración. La
   * plantilla se montaba, la galería se cerraba… y el encargo 2 seguía pidiendo
   * elegir una, sin nada que volviera a comprobarlo.
   *
   * Se resuelve volviendo a preguntar una sola vez, pasada la celebración. No
   * es un sondeo: es un recordatorio por cada cambio de estado, se cancela si
   * llega otro, y como la transacción es vacía no toca el documento.
   */
  const reintento = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refrescar = useCallback((v?: EditorView | null) => {
    const actual = v ?? vista.current;
    // `isConnected` no es paranoia: el aviso llega también desde temporizadores,
    // y despachar sobre una vista ya destruida —salir del laboratorio a media
    // clase— revienta dentro de ProseMirror sin decir de dónde vino.
    if (actual?.dom.isConnected) {
      vista.current = actual;
      actual.dispatch(actual.state.tr);
    }
    setPulso((p) => p + 1);
    if (reintento.current) clearTimeout(reintento.current);
    reintento.current = setTimeout(() => {
      reintento.current = null;
      const otra = vista.current;
      if (otra?.dom.isConnected) otra.dispatch(otra.state.tr);
    }, 1700);
  }, []);

  useEffect(
    () => () => {
      if (reintento.current) clearTimeout(reintento.current);
    },
    [],
  );

  // Los controles de la cinta avisan por aquí. Se registra en un efecto y no se
  // pasa por parámetro: así los controles son una constante y no se rehacen en
  // cada tecla del encabezado.
  useEffect(() => {
    fijarAviso(refrescar);
    return () => fijarAviso(() => {});
  }, [refrescar]);

  const montarPlantilla = useCallback(
    (id: string) => {
      const p = plantillaPorId(id);
      const v = vista.current;
      if (!p || !v) return;
      const doc = documentoDesdeHtml(p.html);
      /*
       * Montar la plantilla NO entra en la pila de deshacer, y no es un detalle.
       *
       * Medido el 10-ago-2026 jugando mal: seis clics en la flecha de deshacer,
       * ya con la plantilla puesta, devolvían el borrador de la maestra —una
       * sola hoja— mientras el panel seguía dando por hechos los dos primeros
       * encargos, porque se corrigen leyendo `ESTADO` y ahí la plantilla seguía
       * elegida. A partir de ahí la clase era imposible de terminar: el encargo
       * 7 pide escribir en la HOJA 2 y el 8 pide superar las hojas que tenía la
       * plantilla, y sólo quedaba una.
       *
       * La regla no es un parche: en Word, elegir una plantilla ABRE OTRO
       * DOCUMENTO, y Ctrl+Z no te devuelve el que tenías antes. Deshacer es para
       * lo que el alumno escribe, no para el documento del que partió.
       */
      v.dispatch(
        v.state.tr.replaceWith(0, v.state.doc.content.size, doc.content).setMeta('addToHistory', false),
      );
      ESTADO.plantilla = p.id;
      // La plantilla trae el pie puesto y el encabezado vacío: el pie es lo que
      // no cambia de un documento a otro —la escuela, el ciclo— y el encabezado
      // es lo que sí, así que es lo que el alumno va a escribir.
      ESTADO.pie = p.pie;
      ESTADO.galeria = false;
      ESTADO.zona = 'ninguno';
      ESTADO.hojasBase = 999;
      // Se vuelve a la hoja 1: acaba de cambiar el documento entero y dejarlo
      // donde estaba el desplazamiento de antes es aterrizar en mitad de nada.
      document.querySelector('.txtw-lienzo')?.scrollTo({ top: 0 });
      /*
       * Las hojas se cuentan DESPUÉS, no ahora. El paginador corre en el cuadro
       * siguiente al cambio del documento, así que en este instante la pila
       * todavía tiene las hojas del borrador y el último encargo —«haz nacer
       * una hoja más»— nacería cumplido o imposible según el azar.
       */
      window.setTimeout(() => {
        if (!vista.current?.dom.isConnected) return;
        ESTADO.hojasBase = contarHojas();
        refrescar();
      }, 350);
      refrescar(v);
      v.focus();
    },
    [refrescar],
  );

  const alTexto = useCallback(
    (zona: Zona, texto: string) => {
      if (zona === 'encabezado') ESTADO.encabezado = texto;
      else if (zona === 'pie') ESTADO.pie = texto;
      refrescar();
    },
    [refrescar],
  );

  const alAbrirZona = useCallback(
    (zona: Zona) => {
      ESTADO.zona = zona;
      ESTADO.galeria = false;
      refrescar();
    },
    [refrescar],
  );

  const alCerrarZona = useCallback(() => {
    if (ESTADO.zona === 'ninguno') return;
    ESTADO.zona = 'ninguno';
    refrescar();
    /*
     * El cursor vuelve al documento en el cuadro siguiente y no ahora mismo.
     * Cerrar por Escape o por el botón dejaba el foco en el `<body>`, así que
     * el alumno seguía tecleando contra la nada; y hacerlo en el acto pisaría
     * el clic que ProseMirror está a punto de atender cuando se cierra pulsando
     * en el cuerpo, que es la otra forma de salir.
     */
    requestAnimationFrame(() => vista.current?.focus());
  }, [refrescar]);

  /*
   * Quitar el número. Vive en la franja del pie y no en la cinta porque el
   * botón «Número de página» dejó de ser un interruptor: se cazó jugando mal
   * que un alumno que lo había curioseado antes se lo quitaba a sí mismo justo
   * cuando el encargo le mandaba ponerlo (ver `controles.ts`).
   */
  const alQuitarNumero = useCallback(() => {
    ESTADO.numeroDePagina = false;
    refrescar();
  }, [refrescar]);

  const alCerrarGaleria = useCallback(() => {
    ESTADO.galeria = false;
    refrescar();
  }, [refrescar]);

  /*
   * Que nazca una hoja NO es una transacción del documento.
   *
   * El último encargo se corrige contando las hojas dibujadas, y esas hojas las
   * pinta el paginador en el cuadro SIGUIENTE al cambio del documento —y con
   * transacciones marcadas como maquetación, que el motor no le enseña a nadie
   * a propósito—. Resultado medido: el alumno pulsaba Enter, la cuarta hoja
   * nacía delante de sus ojos con su encabezado y su número puestos, y el
   * maestro seguía pidiéndosela; sólo se enteraba a la tecla siguiente. Aquí se
   * escucha a la pila de hojas y se vuelve a corregir en cuanto cambia la
   * cuenta, que es el instante en que el encargo se cumple.
   */
  const alCambiarLasHojas = useCallback(() => {
    refrescar();
  }, [refrescar]);

  /*
   * El avance del motor sirve además para una cosa: congelar el ancla.
   *
   * Cuando el motor da por hecho el encargo 7 —siete de ocho—, se apunta el
   * nombre con el que se cumplió. Desde ese momento el alumno puede volver al
   * encabezado y corregirlo sin que la clase retroceda acusándole de deshacer
   * (ver `ESTADO.anclaAMano`). Se apunta una sola vez: si más tarde el encargo
   * se despaloma de verdad —porque borró el renglón— y lo vuelve a hacer con
   * otro nombre, el logro admite también el encabezado de ahora.
   */
  const alAvanzar = useCallback(
    (avance: number) => {
      const hechos = Math.round(avance * GUION_PLANTILLAS.pasos.length);
      // Los encargos hechos son también el índice del que toca ahora, que es lo
      // que las herramientas necesitan para distinguir una pulsación pedida de
      // un desvío.
      encargo.current = hechos;
      if (hechos >= 7 && ESTADO.anclaAMano === null) {
        const nombre = normaliza(ESTADO.encabezado);
        if (nombre.length >= 6) ESTADO.anclaAMano = nombre;
      }
      onProgress(avance);
    },
    [onProgress],
  );

  const alTerminar = useCallback(
    ({ tropiezos, segundos }: { pasos: number; tropiezos: number; segundos: number }) => {
      const { score, stars } = calificar(tropiezos);
      onScore(score);
      onComplete({ score, stars, xp: 55, errores: tropiezos, tiempoSegundos: segundos });
    },
    [onComplete, onScore],
  );

  return (
    <VentanaTextos
      cinta={CINTA_PLANTILLAS}
      guion={GUION_PLANTILLAS}
      controles={CONTROLES}
      accesorios={
        <AccesoriosPlantillas
          pulso={pulso}
          onElegirPlantilla={montarPlantilla}
          onTexto={alTexto}
          onAbrirZona={alAbrirZona}
          onCerrarZona={alCerrarZona}
          onQuitarNumero={alQuitarNumero}
          onCerrarGaleria={alCerrarGaleria}
          onHojas={alCambiarLasHojas}
        />
      }
      onAvance={alAvanzar}
      onTerminado={alTerminar}
      onSalir={alSalir}
      minutos={16}
      insignia={{
        nombre: 'Sale en todas las hojas',
        emoji: '📑',
        titulo: 'Ya no copias nada hoja por hoja',
        detalle:
          'Partiste de una plantilla en vez de armar el documento desde cero, escribiste el encabezado una sola vez y salió en las tres hojas, dejaste que el programa contara las páginas, y comprobaste con tus manos que lo escrito a mano en la hoja 2 no llega a la hoja 3. Eso mismo se llama igual y funciona igual en cualquier procesador de textos.',
      }}
    />
  );
}

export default LabPlantillas;
