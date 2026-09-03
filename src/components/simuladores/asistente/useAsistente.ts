'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  estaCompleto,
  largoDe,
  resolverGuion,
  textoDe,
  veracidadDe,
  type EntradaAlumno,
  type EvaluacionPrompt,
  type FichaPrompt,
  type GuionAsistente,
  type MarcaParte,
  type MensajeIA,
  type RespuestaGuion,
  type ResultadoGuion,
} from './guionAsistente';

/**
 * TECNIA ASISTENTE · LA MÁQUINA DE LA CONVERSACIÓN
 *
 * Aquí vive TODO el estado del chat: el hilo, el tecleo y las marcas. La
 * ventana (`VentanaAsistente`) no tiene ni un `useState`: recibe lo que este
 * gancho devuelve y lo pinta. Ése es el patrón de `VentanaHojas` y
 * `tecniaBloques`, que ya está probado en 23 clases.
 *
 * ── El tecleo contra las pruebas ──────────────────────────────────────────
 *
 * La decisión que ordena este archivo: **el tecleo es una vista, no un dato**.
 * El mensaje guarda su `texto` COMPLETO y un `revelado: number`; lo que se ve
 * es `texto.slice(0, revelado)`. De ahí salen las tres propiedades que hacían
 * falta:
 *
 *   · `velocidad: 0` → el mensaje entra ya completo y **no se programa ni un
 *     solo reloj**. Una prueba puede comprobarlo con `jest.getTimerCount()`.
 *   · `saltarTecleo()` → pone `revelado` al final de golpe. El estado final es
 *     alcanzable sin esperar. Un alumno impaciente y una prueba impaciente
 *     quieren exactamente lo mismo.
 *   · el estado final nunca depende del reloj: `texto` ya está entero desde el
 *     primer fotograma, así que ninguna aserción sobre el CONTENIDO necesita
 *     avanzar temporizadores.
 *
 * Si una prueba de una clase acaba llena de `setTimeout`, no es culpa del
 * tecleo: es que no puso `velocidad: 0`.
 */

export type ResultadoEnvio = 'enviado' | 'ocupado' | 'vacio';
type Fase = 'libre' | 'pensando' | 'tecleando';

export interface OpcionesAsistente {
  guion: GuionAsistente;
  /**
   * Milisegundos entre tic y tic del tecleo. **0 = sin animación**: el mensaje
   * entra completo y no se crea ningún temporizador. Es lo que usan las
   * pruebas y lo que debería usar el modo accesible.
   */
  velocidad?: number;
  /** Caracteres por tic. Subirlo es más barato que bajar `velocidad`. */
  paso?: number;
  /** Pausa de «escribiendo…» antes de la primera letra. Se ignora si `velocidad` es 0. */
  pensando?: number;
  /** Con qué arranca el hilo. Se lee UNA vez, al montar. */
  saludo?: string | RespuestaGuion;
  /** Se dispara al resolver, ANTES de teclear: la actividad ya puede reaccionar. */
  onRespuesta?: (r: ResultadoGuion) => void;
  /** Se dispara cuando la respuesta terminó de escribirse (o se la saltaron). */
  onFinTecleo?: (r: ResultadoGuion) => void;
}

export interface Asistente {
  /** El hilo entero, con las marcas ya puestas. Para pasárselo a la ventana. */
  mensajes: MensajeIA[];
  /** Piensa o teclea: el compositor tiene que estar bloqueado. */
  ocupado: boolean;
  /** Sólo durante la pausa de «escribiendo…». */
  pensando: boolean;
  /** Lo último que resolvió el guion: respuesta, regla y evaluación. */
  ultimo: ResultadoGuion | null;
  /** Atajo de `ultimo?.evaluacion`: lo que necesita el cuaderno de prompts. */
  evaluacion: EvaluacionPrompt | null;
  marcas: Readonly<Record<string, MarcaParte>>;
  enviarFicha: (ficha: string | FichaPrompt) => ResultadoEnvio;
  enviarTexto: (texto: string) => ResultadoEnvio;
  saltarTecleo: () => void;
  marcarParte: (id: string, marca: MarcaParte) => void;
  limpiarMarcas: () => void;
  reiniciar: () => void;
}

const VELOCIDAD_POR_OMISION = 18;
const PASO_POR_OMISION = 3;

/** Un mensaje del asistente a partir de una respuesta del guion. */
function mensajeDeRespuesta(id: string, respuesta: RespuestaGuion, completo: boolean): MensajeIA {
  const veracidad = veracidadDe(respuesta);
  const largo = textoDe(respuesta).length;
  const revelado = completo ? largo : 0;

  if (respuesta.tipo === 'aviso') {
    return { tipo: 'aviso', id, texto: textoDe(respuesta), revelado, respuesta: respuesta.id };
  }
  if (respuesta.partes) {
    return {
      tipo: 'asistente-troceado',
      id,
      partes: respuesta.partes.map((p) => ({ ...p, marca: 'oculta' as MarcaParte })),
      veracidad,
      revelado,
      respuesta: respuesta.id,
      datos: respuesta.datos,
    };
  }
  return {
    tipo: 'asistente',
    id,
    texto: respuesta.texto ?? '',
    veracidad,
    revelado,
    respuesta: respuesta.id,
    datos: respuesta.datos,
  };
}

/** Un mensaje con otro `revelado`. Los del alumno no tienen: vuelven tal cual. */
function conRevelado(m: MensajeIA, revelado: number): MensajeIA {
  switch (m.tipo) {
    case 'usuario':
      return m;
    case 'asistente':
      return { ...m, revelado };
    case 'asistente-troceado':
      return { ...m, revelado };
    case 'aviso':
      return { ...m, revelado };
  }
}

function cambiarUltimo(hilo: MensajeIA[], revelado: (m: MensajeIA) => number): MensajeIA[] {
  const ultimo = hilo[hilo.length - 1];
  if (!ultimo || estaCompleto(ultimo)) return hilo;
  const copia = hilo.slice();
  copia[copia.length - 1] = conRevelado(ultimo, revelado(ultimo));
  return copia;
}

function completarUltimo(hilo: MensajeIA[]): MensajeIA[] {
  return cambiarUltimo(hilo, largoDe);
}

/** Con qué arranca el hilo. Vacío si la clase no puso saludo. */
function hiloDeSaludo(saludo: string | RespuestaGuion | undefined): MensajeIA[] {
  if (!saludo) return [];
  const respuesta: RespuestaGuion = typeof saludo === 'string' ? { id: 'saludo', texto: saludo } : saludo;
  return [mensajeDeRespuesta('m0', respuesta, true)];
}

export function useAsistente(opciones: OpcionesAsistente): Asistente {
  const velocidad = Math.max(0, opciones.velocidad ?? VELOCIDAD_POR_OMISION);
  const paso = Math.max(1, opciones.paso ?? PASO_POR_OMISION);
  const pensandoMs = velocidad === 0 ? 0 : Math.max(0, opciones.pensando ?? 0);

  const contador = useRef(0);
  const nuevoId = useCallback(() => {
    contador.current += 1;
    return `m${contador.current}`;
  }, []);

  /*
   * El saludo se lee UNA vez, al montar. Es dato de arranque, no una prop
   * viva: si la clase cambia el objeto en cada render, el hilo no se rebobina
   * solo. Lleva id fijo `m0` para que el contador no tenga que correr durante
   * el render (leer una referencia ahí es justo lo que prohíbe React).
   */
  const saludoRef = useRef(opciones.saludo);
  const [hilo, setHilo] = useState<MensajeIA[]>(() => hiloDeSaludo(opciones.saludo));
  const [marcas, setMarcas] = useState<Record<string, MarcaParte>>({});
  const [fase, setFase] = useState<Fase>('libre');

  /*
   * El «estoy ocupado» se guarda DOS veces a propósito, y las dos miran lo
   * mismo desde sitios distintos:
   *
   *  · para PINTAR se deriva del hilo (`ocupado`, más abajo): en cuanto el
   *    último mensaje está completo, el compositor se desbloquea solo. Nadie
   *    tiene que acordarse de apagarlo, así que no hay forma de dejarlo
   *    encendido y con el chat colgado.
   *  · para DECIDIR se guarda en una referencia: dos envíos en el mismo tic
   *    leerían el mismo estado «libre» y el segundo se colaría mientras el
   *    primero aún no ha repintado — que es exactamente el «mandar dos
   *    seguidos» con el que hay que jugar mal.
   */
  const ocupadoRef = useRef(false);

  const guionRef = useRef(opciones.guion);
  const onRespuestaRef = useRef(opciones.onRespuesta);
  const onFinRef = useRef(opciones.onFinTecleo);
  useEffect(() => {
    guionRef.current = opciones.guion;
    saludoRef.current = opciones.saludo;
    onRespuestaRef.current = opciones.onRespuesta;
    onFinRef.current = opciones.onFinTecleo;
  });

  const [ultimo, setUltimo] = useState<ResultadoGuion | null>(null);
  /** La respuesta que aún le debe un «ya terminé» a la clase. */
  const pendienteRef = useRef<ResultadoGuion | null>(null);

  // ── Enviar ───────────────────────────────────────────────────────────────

  const mandar = useCallback(
    (entrada: EntradaAlumno, burbuja: string): ResultadoEnvio => {
      if (ocupadoRef.current) return 'ocupado';
      const limpio = burbuja.trim();
      if (limpio === '') return 'vacio';

      const resultado = resolverGuion(guionRef.current, entrada);
      const instantaneo = velocidad === 0;
      const delAlumno: MensajeIA = { tipo: 'usuario', id: nuevoId(), texto: limpio };
      const delAsistente = mensajeDeRespuesta(nuevoId(), resultado.respuesta, instantaneo);

      setUltimo(resultado);
      setHilo((prev) => [...prev, delAlumno, delAsistente]);

      if (estaCompleto(delAsistente)) {
        onRespuestaRef.current?.(resultado);
        onFinRef.current?.(resultado);
      } else {
        ocupadoRef.current = true;
        pendienteRef.current = resultado;
        setFase(pensandoMs > 0 ? 'pensando' : 'tecleando');
        onRespuestaRef.current?.(resultado);
      }
      return 'enviado';
    },
    [velocidad, pensandoMs, nuevoId],
  );

  const enviarTexto = useCallback(
    (texto: string) => mandar({ texto }, texto),
    [mandar],
  );

  const enviarFicha = useCallback(
    (ficha: string | FichaPrompt) => {
      if (typeof ficha === 'string') return mandar({ ficha }, ficha);
      return mandar({ ficha: ficha.id, texto: ficha.pregunta }, ficha.pregunta ?? ficha.etiqueta);
    },
    [mandar],
  );

  // ── El tecleo ────────────────────────────────────────────────────────────

  const ultimoMensaje = hilo[hilo.length - 1];
  const hiloCompleto = !ultimoMensaje || estaCompleto(ultimoMensaje);
  /*
   * DERIVADO, no guardado: el asistente está ocupado si arrancó una respuesta
   * (`fase`) y aún le falta texto por escribir. En cuanto el hilo se completa
   * —lo termine el reloj o lo salte el alumno— esto es `false` sin que nadie
   * tenga que apagarlo, y el compositor se desbloquea solo.
   */
  const ocupado = fase !== 'libre' && !hiloCompleto;

  /* La pausa de «escribiendo…». */
  useEffect(() => {
    if (fase !== 'pensando' || hiloCompleto) return;
    const t = setTimeout(() => setFase('tecleando'), pensandoMs);
    return () => clearTimeout(t);
  }, [fase, hiloCompleto, pensandoMs]);

  /* Las letras. Con `velocidad` 0 este efecto no llega a crear nada. */
  useEffect(() => {
    if (fase !== 'tecleando' || velocidad === 0 || hiloCompleto) return;
    const t = setInterval(() => {
      setHilo((prev) =>
        cambiarUltimo(prev, (m) =>
          Math.min(largoDe(m), (m.tipo === 'usuario' ? 0 : m.revelado) + paso),
        ),
      );
    }, velocidad);
    return () => clearInterval(t);
  }, [fase, velocidad, paso, hiloCompleto]);

  /*
   * El aviso de «ya terminé» se da MIRANDO EL HILO, no dentro del tic. Así
   * vale igual para el tecleo que se acaba solo, para `saltarTecleo()` y para
   * saltarse la pausa de «pensando»: los tres dejan el hilo completo, y la
   * respuesta pendiente se avisa UNA vez y se olvida.
   */
  useEffect(() => {
    if (!hiloCompleto) return;
    const pendiente = pendienteRef.current;
    if (!pendiente) return;
    pendienteRef.current = null;
    ocupadoRef.current = false;
    onFinRef.current?.(pendiente);
  }, [hiloCompleto]);

  const saltarTecleo = useCallback(() => {
    // Sin nada a medio escribir, `completarUltimo` devuelve el mismo array y
    // React ni repinta: cien pulsaciones seguidas no cuestan nada.
    setHilo(completarUltimo);
  }, []);

  // ── Las marcas ───────────────────────────────────────────────────────────

  const marcarParte = useCallback((id: string, marca: MarcaParte) => {
    setMarcas((prev) => (prev[id] === marca ? prev : { ...prev, [id]: marca }));
  }, []);

  const limpiarMarcas = useCallback(() => {
    setMarcas((prev) => (Object.keys(prev).length === 0 ? prev : {}));
  }, []);

  const reiniciar = useCallback(() => {
    ocupadoRef.current = false;
    pendienteRef.current = null;
    setFase('libre');
    setUltimo(null);
    setMarcas({});
    setHilo(hiloDeSaludo(saludoRef.current));
  }, []);

  /*
   * Las marcas se cosen aquí y no en el estado del hilo: así marcar un trozo
   * no reescribe el mensaje, y la verdad (`veracidad`) y lo que se enseña
   * (`marca`) siguen viviendo en sitios distintos.
   */
  const mensajes = useMemo<MensajeIA[]>(() => {
    if (Object.keys(marcas).length === 0) return hilo;
    return hilo.map((m) => {
      if (m.tipo !== 'asistente-troceado') return m;
      if (!m.partes.some((p) => marcas[p.id] && marcas[p.id] !== p.marca)) return m;
      return { ...m, partes: m.partes.map((p) => ({ ...p, marca: marcas[p.id] ?? p.marca })) };
    });
  }, [hilo, marcas]);

  return {
    mensajes,
    ocupado,
    pensando: fase === 'pensando' && !hiloCompleto,
    ultimo,
    evaluacion: ultimo?.evaluacion ?? null,
    marcas,
    enviarFicha,
    enviarTexto,
    saltarTecleo,
    marcarParte,
    limpiarMarcas,
    reiniciar,
  };
}
