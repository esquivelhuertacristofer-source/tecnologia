'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  borradorDeReenvio,
  borradorDeRespuesta,
  borradorVacio,
  contarCarpetas,
  marcarLeido,
  mensajesEn,
  moverA,
  type AdjuntoCorreo,
  type BorradorCorreo,
  type CarpetaCorreo,
  type ConteoCarpeta,
  type MensajeCorreo,
  type RemitenteCorreo,
} from './tiposCorreo';

/**
 * TECNIA CORREO · LA MÁQUINA
 *
 * Todo el estado del buzón vive aquí; `VentanaCorreo` no tiene ni un
 * `useState` — mismo reparto que `useMuro`/`VentanaMuro` y `useNube`.
 *
 * ── Qué se rechaza y qué no ─────────────────────────────────────────────────
 *
 * La frontera es dura y vale la pena escribirla: **se rechaza lo que es
 * mecánicamente imposible; no se rechaza lo que es mala idea.**
 *
 *   SE RECHAZA   responder a un mensaje que está en la papelera (`'en-papelera'`)
 *                — no hay conversación viva que continuar.
 *   SE RECHAZA   enviar sin ningún destinatario (`'sin-destinatario'`)
 *                — no hay a dónde mandarlo.
 *   NO SE RECHAZA enviar sin asunto, ni sin cuerpo, ni a la misma persona dos
 *                veces. Todo eso es un juicio, y juzgar es de la clase.
 *
 * Por eso `enviar` no tiene un motivo `'sin-asunto'`: la clase que quiera
 * enseñar eso mira `borrador.asunto` y lo dice con sus palabras.
 *
 * ── Por qué los guardas leen de una `ref` ──────────────────────────────────
 *
 * Igual que `useMuro`: cada acción necesita el estado YA COMITIDO para decidir
 * si es legal (¿existe?, ¿está en la papelera?). Leerlo del cierre del
 * `useCallback` obligaría a regenerar la función en cada cambio o arriesgar un
 * valor viejo; se lee `msgRef.current`, que un efecto sin dependencias
 * mantiene al día.
 *
 * ── Por qué los ids se generan fuera del actualizador ──────────────────────
 *
 * `nuevoId()` muta un contador. Dentro de `setMensajes((prev) => …)` una
 * reejecución del actualizador —algo que React puede hacer— daría ids
 * distintos en cada pasada. El objeto nuevo se arma fuera y el actualizador es
 * una función pura del `prev`.
 */

export type ResultadoCorreo = 'ok' | 'no-existe' | 'en-papelera' | 'ya-en-papelera' | 'ya-esta-ahi';
export type ResultadoEnviar = 'enviado' | 'sin-borrador' | 'sin-destinatario';

export interface OpcionesCorreo {
  /** Con qué arranca el buzón. Se lee UNA vez, al montar. */
  mensajes?: MensajeCorreo[];
  /** El buzón conectado: quién es «yo». */
  yo: RemitenteCorreo;
  /** Por omisión `'recibidos'`. */
  carpetaInicial?: CarpetaCorreo;
}

export interface Correo {
  /** El arreglo completo, con la papelera dentro: la historia nunca se recorta. */
  mensajes: MensajeCorreo[];
  carpeta: CarpetaCorreo;
  /** Los de la carpeta abierta, en el orden en que están. */
  enCarpeta: (carpeta?: CarpetaCorreo) => MensajeCorreo[];
  cuentas: Record<CarpetaCorreo, ConteoCarpeta>;
  seleccionId: string | null;
  /** El mensaje seleccionado, o `null`. */
  abierto: MensajeCorreo | null;
  borrador: BorradorCorreo | null;

  abrirCarpeta: (carpeta: CarpetaCorreo) => void;
  /** Selecciona y marca leído. */
  abrir: (id: string) => ResultadoCorreo;
  cerrar: () => void;
  marcar: (id: string) => ResultadoCorreo;
  mover: (id: string, carpeta: CarpetaCorreo) => ResultadoCorreo;
  /** Manda a la papelera. Nunca destruye. */
  borrar: (id: string) => ResultadoCorreo;

  redactar: (inicial?: Partial<BorradorCorreo>) => void;
  responder: (id: string, opciones?: { aTodos?: boolean }) => ResultadoCorreo;
  reenviar: (id: string) => ResultadoCorreo;
  cambiarBorrador: (parcial: Partial<BorradorCorreo>) => void;
  adjuntar: (adjunto: AdjuntoCorreo) => void;
  quitarAdjunto: (adjuntoId: string) => void;
  descartar: () => void;
  /** Mueve el borrador a Enviados como mensaje de verdad. */
  enviar: (fecha?: string) => ResultadoEnviar;

  reiniciar: (mensajes?: MensajeCorreo[]) => void;
}

export function useCorreo(opciones: OpcionesCorreo): Correo {
  const inicialRef = useRef(opciones.mensajes ?? []);
  const yoRef = useRef(opciones.yo);
  useEffect(() => {
    yoRef.current = opciones.yo;
  });

  const [mensajes, setMensajes] = useState<MensajeCorreo[]>(() => opciones.mensajes ?? []);
  const [carpeta, setCarpeta] = useState<CarpetaCorreo>(opciones.carpetaInicial ?? 'recibidos');
  const [seleccionId, setSeleccionId] = useState<string | null>(null);
  const [borrador, setBorrador] = useState<BorradorCorreo | null>(null);

  const msgRef = useRef(mensajes);
  const borradorRef = useRef(borrador);
  useEffect(() => {
    msgRef.current = mensajes;
    borradorRef.current = borrador;
  });

  const contador = useRef(0);
  const nuevoId = useCallback((prefijo: string) => {
    contador.current += 1;
    return `${prefijo}${contador.current}`;
  }, []);

  const enCarpeta = useCallback(
    (cual?: CarpetaCorreo) => mensajesEn(mensajes, cual ?? carpeta),
    [mensajes, carpeta],
  );

  const abrirCarpeta = useCallback((cual: CarpetaCorreo) => {
    setCarpeta(cual);
    setSeleccionId(null);
  }, []);

  const abrir = useCallback((id: string): ResultadoCorreo => {
    const actual = msgRef.current.find((m) => m.id === id);
    if (!actual) return 'no-existe';
    setSeleccionId(id);
    setMensajes((prev) => prev.map((m) => (m.id === id ? marcarLeido(m) : m)));
    return 'ok';
  }, []);

  const cerrar = useCallback(() => setSeleccionId(null), []);

  const marcar = useCallback((id: string): ResultadoCorreo => {
    const actual = msgRef.current.find((m) => m.id === id);
    if (!actual) return 'no-existe';
    setMensajes((prev) => prev.map((m) => (m.id === id ? { ...m, marcado: !m.marcado } : m)));
    return 'ok';
  }, []);

  const mover = useCallback((id: string, destino: CarpetaCorreo): ResultadoCorreo => {
    const actual = msgRef.current.find((m) => m.id === id);
    if (!actual) return 'no-existe';
    if (actual.carpeta === destino) return 'ya-esta-ahi';
    setMensajes((prev) => prev.map((m) => (m.id === id ? moverA(m, destino) : m)));
    return 'ok';
  }, []);

  /** Decisión 3: borrar no borra. Mueve a la papelera, y desde la papelera no
   *  destruye — no hay manera de perder un mensaje en este armazón. */
  const borrar = useCallback((id: string): ResultadoCorreo => {
    const actual = msgRef.current.find((m) => m.id === id);
    if (!actual) return 'no-existe';
    if (actual.carpeta === 'papelera') return 'ya-en-papelera';
    setMensajes((prev) => prev.map((m) => (m.id === id ? moverA(m, 'papelera') : m)));
    setSeleccionId((sel) => (sel === id ? null : sel));
    return 'ok';
  }, []);

  const redactar = useCallback((inicial?: Partial<BorradorCorreo>) => {
    setBorrador({ ...borradorVacio(), ...inicial });
  }, []);

  const responder = useCallback((id: string, opts?: { aTodos?: boolean }): ResultadoCorreo => {
    const actual = msgRef.current.find((m) => m.id === id);
    if (!actual) return 'no-existe';
    if (actual.carpeta === 'papelera') return 'en-papelera';
    setBorrador(borradorDeRespuesta(actual, yoRef.current, opts));
    return 'ok';
  }, []);

  const reenviar = useCallback((id: string): ResultadoCorreo => {
    const actual = msgRef.current.find((m) => m.id === id);
    if (!actual) return 'no-existe';
    if (actual.carpeta === 'papelera') return 'en-papelera';
    setBorrador(borradorDeReenvio(actual));
    return 'ok';
  }, []);

  const cambiarBorrador = useCallback((parcial: Partial<BorradorCorreo>) => {
    setBorrador((prev) => (prev ? { ...prev, ...parcial } : prev));
  }, []);

  const adjuntar = useCallback((adjunto: AdjuntoCorreo) => {
    setBorrador((prev) => {
      if (!prev) return prev;
      if (prev.adjuntos.some((a) => a.id === adjunto.id)) return prev; // no-op: identidad
      return { ...prev, adjuntos: [...prev.adjuntos, adjunto] };
    });
  }, []);

  const quitarAdjunto = useCallback((adjuntoId: string) => {
    setBorrador((prev) => {
      if (!prev || !prev.adjuntos.some((a) => a.id === adjuntoId)) return prev; // no-op: identidad
      return { ...prev, adjuntos: prev.adjuntos.filter((a) => a.id !== adjuntoId) };
    });
  }, []);

  const descartar = useCallback(() => setBorrador(null), []);

  const enviar = useCallback(
    (fecha = 'Ahora'): ResultadoEnviar => {
      const actual = borradorRef.current;
      if (!actual) return 'sin-borrador';
      if (actual.para.length === 0) return 'sin-destinatario';
      const salida: MensajeCorreo = {
        id: nuevoId('e'),
        de: yoRef.current,
        para: actual.para,
        cc: actual.cc,
        asunto: actual.asunto,
        cuerpo: actual.cuerpo,
        fecha,
        adjuntos: actual.adjuntos,
        enlaces: [],
        carpeta: 'enviados',
        leido: true,
        marcado: false,
        responde: actual.responde,
      };
      setMensajes((prev) => [...prev, salida]);
      setBorrador(null);
      return 'enviado';
    },
    [nuevoId],
  );

  const reiniciar = useCallback((nuevos?: MensajeCorreo[]) => {
    contador.current = 0;
    setMensajes(nuevos ?? inicialRef.current);
    setSeleccionId(null);
    setBorrador(null);
  }, []);

  const abierto = seleccionId === null ? null : (mensajes.find((m) => m.id === seleccionId) ?? null);

  return {
    mensajes,
    carpeta,
    enCarpeta,
    cuentas: contarCarpetas(mensajes),
    seleccionId,
    abierto,
    borrador,
    abrirCarpeta,
    abrir,
    cerrar,
    marcar,
    mover,
    borrar,
    redactar,
    responder,
    reenviar,
    cambiarBorrador,
    adjuntar,
    quitarAdjunto,
    descartar,
    enviar,
    reiniciar,
  };
}
