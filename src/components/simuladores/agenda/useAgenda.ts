'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  borrarCita,
  citasDe,
  crearCita,
  disponerDia,
  invitar,
  moverCita,
  responderInvitacion,
  semanaDe,
  solapesDe,
  sumarDias,
  type CitaAgenda,
  type ColocacionCita,
  type NuevaCita,
  type PersonaAgenda,
  type RespuestaInvitacion,
  type ResultadoAgenda,
  type ResultadoInvitar,
  type ResultadoResponder,
} from './tiposAgenda';

/**
 * TECNIA AGENDA · LA MÁQUINA
 *
 * Estado del calendario; `VentanaAgenda` no tiene ni un `useState`.
 *
 * ── `hoy` es obligatorio y entra por parámetro ─────────────────────────────
 *
 * `OpcionesAgenda.hoy` no tiene valor por omisión A PROPÓSITO. Si lo tuviera,
 * el valor por omisión sería el reloj, y con eso vuelven las pruebas que
 * fallan mañana sin que nadie sepa por qué. Quien monte una clase escribe el
 * día que quiere que sea; una prueba escribe el suyo.
 *
 * Aquí no se llama a `Date.now()` ni a `new Date()` sin argumentos, igual que
 * en `tiposAgenda.ts`.
 *
 * ── Qué se rechaza ─────────────────────────────────────────────────────────
 *
 * Lo imposible: una cita que acaba antes de empezar, una que no dura nada, un
 * día que no existe en el calendario, invitar dos veces a la misma persona.
 * Lo desaconsejable —dos citas a la misma hora, una cita sin invitados— NO se
 * rechaza: se crea, se ve solapada, y quien juzga es la clase.
 */

export type VistaAgenda = 'mes' | 'semana';

export interface OpcionesAgenda {
  citas?: CitaAgenda[];
  /** ISO `AAAA-MM-DD`. Obligatorio: ver la cabecera. */
  hoy: string;
  /** Qué día se está mirando. Por omisión, `hoy`. */
  diaInicial?: string;
  vistaInicial?: VistaAgenda;
}

export interface Agenda {
  citas: CitaAgenda[];
  hoy: string;
  /** El día en el que está puesto el calendario. */
  dia: string;
  vista: VistaAgenda;
  seleccionId: string | null;
  seleccionada: CitaAgenda | null;
  /** Los siete días de la semana de `dia`, de lunes a domingo. */
  semana: string[];
  /** Las de un día, ordenadas por hora. */
  delDia: (dia?: string) => CitaAgenda[];
  /** Las de un día ya repartidas en carriles, para pintar los solapes. */
  disposicion: (dia?: string) => ColocacionCita[];
  /** Con qué choca una cita. Vacío si con ninguna. */
  choquesDe: (citaId: string) => CitaAgenda[];

  irA: (dia: string) => void;
  /** Adelanta o atrasa: una semana en vista semana, siete días por salto. */
  avanzar: (saltos: number) => void;
  verVista: (vista: VistaAgenda) => void;
  seleccionar: (citaId: string | null) => void;

  crear: (nueva: NuevaCita) => ResultadoAgenda;
  mover: (citaId: string, destino: { dia?: string; inicio?: string; fin?: string }) => ResultadoAgenda;
  borrar: (citaId: string) => void;
  invitarA: (citaId: string, persona: PersonaAgenda) => ResultadoInvitar | { ok: false; motivo: 'no-existe' };
  responder: (
    citaId: string,
    personaId: string,
    respuesta: RespuestaInvitacion,
  ) => ResultadoResponder | { ok: false; motivo: 'no-existe' };
  reiniciar: (citas?: CitaAgenda[]) => void;
}

export function useAgenda(opciones: OpcionesAgenda): Agenda {
  const inicialRef = useRef(opciones.citas ?? []);

  const [citas, setCitas] = useState<CitaAgenda[]>(() => opciones.citas ?? []);
  const [dia, setDia] = useState<string>(opciones.diaInicial ?? opciones.hoy);
  const [vista, setVista] = useState<VistaAgenda>(opciones.vistaInicial ?? 'semana');
  const [seleccionId, setSeleccionId] = useState<string | null>(null);

  const citasRef = useRef(citas);
  useEffect(() => {
    citasRef.current = citas;
  });

  const semana = useMemo(() => semanaDe(dia), [dia]);

  const delDia = useCallback((cual?: string) => citasDe(citas, cual ?? dia), [citas, dia]);
  const disposicion = useCallback((cual?: string) => disponerDia(citas, cual ?? dia), [citas, dia]);

  const choquesDe = useCallback(
    (citaId: string) => {
      const cita = citas.find((c) => c.id === citaId);
      if (!cita) return [];
      return solapesDe(cita, citas);
    },
    [citas],
  );

  const irA = useCallback((cual: string) => setDia(cual), []);

  const avanzar = useCallback((saltos: number) => {
    setDia((actual) => sumarDias(actual, saltos * 7));
  }, []);

  const crear = useCallback((nueva: NuevaCita): ResultadoAgenda => {
    const resultado = crearCita(citasRef.current, nueva);
    if (resultado.ok) setCitas(resultado.citas);
    return resultado;
  }, []);

  const mover = useCallback(
    (citaId: string, destino: { dia?: string; inicio?: string; fin?: string }): ResultadoAgenda => {
      const resultado = moverCita(citasRef.current, citaId, destino);
      if (resultado.ok) setCitas(resultado.citas);
      return resultado;
    },
    [],
  );

  const borrar = useCallback((citaId: string) => {
    setCitas((prev) => borrarCita(prev, citaId));
    setSeleccionId((sel) => (sel === citaId ? null : sel));
  }, []);

  const invitarA = useCallback((citaId: string, persona: PersonaAgenda) => {
    const cita = citasRef.current.find((c) => c.id === citaId);
    if (!cita) return { ok: false as const, motivo: 'no-existe' as const };
    const resultado = invitar(cita, persona);
    if (resultado.ok) {
      setCitas((prev) => prev.map((c) => (c.id === citaId ? resultado.cita : c)));
    }
    return resultado;
  }, []);

  const responder = useCallback((citaId: string, personaId: string, respuesta: RespuestaInvitacion) => {
    const cita = citasRef.current.find((c) => c.id === citaId);
    if (!cita) return { ok: false as const, motivo: 'no-existe' as const };
    const resultado = responderInvitacion(cita, personaId, respuesta);
    if (resultado.ok && resultado.cita !== cita) {
      setCitas((prev) => prev.map((c) => (c.id === citaId ? resultado.cita : c)));
    }
    return resultado;
  }, []);

  const reiniciar = useCallback((nuevas?: CitaAgenda[]) => {
    setCitas(nuevas ?? inicialRef.current);
    setSeleccionId(null);
  }, []);

  const seleccionada = seleccionId === null ? null : (citas.find((c) => c.id === seleccionId) ?? null);

  return {
    citas,
    hoy: opciones.hoy,
    dia,
    vista,
    seleccionId,
    seleccionada,
    semana,
    delDia,
    disposicion,
    choquesDe,
    irA,
    avanzar,
    verVista: setVista,
    seleccionar: setSeleccionId,
    crear,
    mover,
    borrar,
    invitarA,
    responder,
    reiniciar,
  };
}
