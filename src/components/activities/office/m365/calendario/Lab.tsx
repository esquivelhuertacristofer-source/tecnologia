'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import {
  useAgenda,
  VentanaAgenda,
  solapesDe,
  type CitaAgenda,
  type InvitadoAgenda,
} from '@/components/simuladores/agenda';
import { useBit } from '@/components/activities/n1/arcade/ArcadeSala';
import { useLabActividad } from '@/components/activities/lib/useLabActividad';
import { reproducirTono } from '@/components/activities/n1/mision/audio';
import {
  APERTURA,
  CORREO_PROFESOR,
  DIAS_FORMULARIO,
  FIN_ESPERADO,
  HORAS_DISPONIBLES,
  HOY,
  ID_DEMO_ROBOT,
  ID_JURADO,
  INICIO_ESPERADO,
  INSTRUCCIONES,
  LINEAS,
  MIERCOLES,
  SEMILLA_CITAS,
  TITULO_ESPERADO,
  TOTAL_PASOS,
} from './datos';
import './calendario.css';

/**
 * `of-m365-calendario` · «Calendario y citas» — el laboratorio.
 *
 * Monta el armazón `simuladores/agenda` (nadie lo consumía todavía) dentro de
 * `VentanaBase`. Siete encargos como una máquina de estados simple (`fase`):
 * cada transición de fase ocurre junto con UNA llamada a `labActividad.
 * avanzar()`, así que «Paso N de 7» (`labActividad.pasos`) y la fase en
 * pantalla nunca se desincronizan.
 *
 * SIN ARRASTRE en ningún encargo: el reagendado del encargo 6 es un
 * `<select>` de hora + un botón «Confirmar cambio» — la corrección obligada
 * del coordinador sobre el pliego original (ver `datos.ts`). El armazón
 * `simuladores/agenda/*` no se toca: lo que no encajaba (el campo
 * «recordatorio») se resolvió como estado local decorativo aquí mismo, nunca
 * parcheando `tiposAgenda.ts`.
 */

type Fase =
  | 'inicio'
  | 'form-datos'
  | 'form-invitados'
  | 'notificaciones'
  | 'notif-abierta'
  | 'esperando-seleccion'
  | 'reagendar'
  | 'cierre';

export function LabM365Calendario(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const labActividad = useLabActividad(props, TOTAL_PASOS, {});
  const { hablar } = useBit(APERTURA);

  const agenda = useAgenda({ hoy: HOY, citas: SEMILLA_CITAS, diaInicial: HOY, vistaInicial: 'semana' });

  const [fase, setFase] = useState<Fase>('inicio');
  const [aviso, setAviso] = useState<string | null>(null);

  // Encargo 2 — el formulario de datos.
  const [titulo, setTitulo] = useState('');
  const [dia, setDia] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');

  // Encargo 3 — invitados.
  const [correoDraft, setCorreoDraft] = useState('');
  const [invitadosDraft, setInvitadosDraft] = useState<string[]>([]);

  // Encargo 6 — reagendar.
  const [nuevaHora, setNuevaHora] = useState(INICIO_ESPERADO);

  // Encargo 7 — decorativo, no toca el armazón (ver datos.ts).
  const [recordatorio, setRecordatorio] = useState(false);
  const [confirmada, setConfirmada] = useState(false);
  const cierreRef = useRef(false);

  const pasoActual = Math.min(labActividad.pasos + 1, TOTAL_PASOS);

  useEffect(() => {
    if (confirmada && !cierreRef.current) {
      cierreRef.current = true;
      const segundos = Math.round((Date.now() - labActividad.sim.current.inicio) / 1000);
      labActividad.terminar(segundos, () => hablar(LINEAS.cierre));
    }
  }, [confirmada, labActividad, hablar]);

  const abrirFormulario = useCallback(() => {
    reproducirTono('select');
    hablar(LINEAS.trasAbrirFormulario);
    setAviso(null);
    labActividad.avanzar();
    setFase('form-datos');
  }, [hablar, labActividad]);

  const confirmarDatos = useCallback(() => {
    if (titulo.trim() !== TITULO_ESPERADO) {
      setAviso('El título tiene que decir exactamente «Demostración Robot».');
      labActividad.restar();
      return;
    }
    if (dia !== MIERCOLES) {
      setAviso('Esa cita es el Miércoles: elige el día correcto.');
      labActividad.restar();
      return;
    }
    if (horaInicio !== INICIO_ESPERADO || horaFin !== FIN_ESPERADO) {
      setAviso('La hora es de 10:00 a 10:30. Revisa los dos selectores.');
      labActividad.restar();
      return;
    }
    reproducirTono('correct');
    setAviso(null);
    labActividad.avanzar();
    setFase('form-invitados');
  }, [titulo, dia, horaInicio, horaFin, labActividad]);

  const agregarInvitado = useCallback(() => {
    const correo = correoDraft.trim().toLowerCase();
    if (!correo.includes('@')) {
      setAviso('Escribe un correo válido antes de agregarlo.');
      return;
    }
    setInvitadosDraft((prev) => (prev.includes(correo) ? prev : [...prev, correo]));
    setCorreoDraft('');
  }, [correoDraft]);

  const guardarCita = useCallback(() => {
    if (!invitadosDraft.includes(CORREO_PROFESOR)) {
      setAviso(`Falta invitar a ${CORREO_PROFESOR}.`);
      labActividad.restar();
      return;
    }
    const invitados: InvitadoAgenda[] = invitadosDraft.map((correo) => ({
      persona: { id: correo, nombre: correo === CORREO_PROFESOR ? 'Profesor de Tecnología' : correo },
      respuesta: 'pendiente',
    }));
    const resultado = agenda.crear({
      id: ID_DEMO_ROBOT,
      titulo: TITULO_ESPERADO,
      dia: MIERCOLES,
      inicio: INICIO_ESPERADO,
      fin: FIN_ESPERADO,
      invitados,
      color: '#4f46e5',
    });
    if (!resultado.ok) {
      setAviso(resultado.aviso);
      labActividad.restar();
      return;
    }
    reproducirTono('correct');
    hablar(LINEAS.trasGuardar);
    setAviso(null);
    labActividad.avanzar();
    setFase('notificaciones');
  }, [invitadosDraft, agenda, hablar, labActividad]);

  const abrirNotificacion = useCallback(() => {
    reproducirTono('select');
    setFase('notif-abierta');
  }, []);

  const rechazarInvitacion = useCallback(() => {
    setAviso('Tenemos que aceptar esta invitación para seguir organizando la Feria.');
    labActividad.restar();
  }, [labActividad]);

  const aceptarInvitacion = useCallback(() => {
    const resultado = agenda.crear({
      id: ID_JURADO,
      titulo: 'Reunión Jurado',
      dia: MIERCOLES,
      inicio: INICIO_ESPERADO,
      fin: FIN_ESPERADO,
      lugar: 'Sala de jurados',
      color: '#0ea5e9',
    });
    if (!resultado.ok) {
      setAviso(resultado.aviso);
      labActividad.restar();
      return;
    }
    reproducirTono('correct');
    hablar(LINEAS.trasAceptar);
    setAviso(null);
    labActividad.avanzar();
    setFase('esperando-seleccion');
  }, [agenda, hablar, labActividad]);

  const alClickCita = useCallback(
    (id: string) => {
      if (fase !== 'esperando-seleccion') {
        agenda.seleccionar(id);
        return;
      }
      if (id !== ID_DEMO_ROBOT) {
        setAviso('Esa cita la agendó la Coordinación — edita la tuya: «Demostración Robot».');
        labActividad.restar();
        return;
      }
      agenda.seleccionar(id);
      const citaActual = agenda.citas.find((c) => c.id === ID_DEMO_ROBOT);
      setNuevaHora(citaActual?.inicio ?? INICIO_ESPERADO);
      setAviso(null);
      labActividad.avanzar();
      setFase('reagendar');
    },
    [fase, agenda, labActividad],
  );

  const confirmarReagendar = useCallback(() => {
    const resultado = agenda.mover(ID_DEMO_ROBOT, { inicio: nuevaHora });
    if (!resultado.ok) {
      setAviso(resultado.aviso);
      labActividad.restar();
      return;
    }
    const chocaAun = solapesDe(resultado.cita, resultado.citas).length > 0;
    if (chocaAun) {
      setAviso('Sigue chocando con Reunión Jurado. Prueba otra hora.');
      labActividad.restar();
      return;
    }
    reproducirTono('correct');
    hablar(LINEAS.trasReagendar);
    setAviso(null);
    labActividad.avanzar();
    setFase('cierre');
  }, [agenda, nuevaHora, hablar, labActividad]);

  const confirmarAgenda = useCallback(() => {
    if (!recordatorio) {
      setAviso('Activa el recordatorio antes de confirmar.');
      labActividad.restar();
      return;
    }
    setAviso(null);
    labActividad.avanzar();
    setConfirmada(true);
  }, [recordatorio, labActividad]);

  if (labActividad.terminado) {
    return (
      <VentanaBase marca="Tecnia Calendario" subtitulo="Calendario y citas">
        <div className="calx-final">
          <span className="calx-final-insignia" aria-hidden="true">
            📅
          </span>
          <p className="calx-final-nombre">Insignia: Guardián de la Agenda</p>
          <h2 className="calx-final-titulo">Organizaste la agenda de la Feria Científica</h2>
          <p className="calx-final-detalle">
            Agendaste la demostración del robot, invitaste al profesor, aceptaste la reunión del jurado y
            resolviste el choque de horario antes de que abriera el evento.
          </p>
          <dl className="calx-final-resumen">
            <div>
              <dt>Citas agendadas</dt>
              <dd>{agenda.citas.length}</dd>
            </div>
            <div>
              <dt>Choques resueltos</dt>
              <dd>1</dd>
            </div>
            <div>
              <dt>Encargos</dt>
              <dd>{TOTAL_PASOS}/{TOTAL_PASOS}</dd>
            </div>
          </dl>
          {alSalir && (
            <button type="button" className="calx-final-boton" onClick={alSalir}>
              Salir del laboratorio
            </button>
          )}
        </div>
      </VentanaBase>
    );
  }

  const citaSeleccionada: CitaAgenda | null = agenda.seleccionada;

  return (
    <VentanaBase marca="Tecnia Calendario" subtitulo="Calendario y citas">
      <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid rgba(94,196,255,0.14)' }}>
        <span className="text-xs font-extrabold uppercase tracking-wide" style={{ color: '#9fe8ff', letterSpacing: '0.04em' }}>
          Paso {pasoActual} de {TOTAL_PASOS}
        </span>
        {alSalir && (
          <button type="button" className="calx-salir" onClick={alSalir}>
            Salir
          </button>
        )}
      </div>

      <VentanaAgenda
        citas={agenda.citas}
        hoy={agenda.hoy}
        dia={agenda.dia}
        vista={agenda.vista}
        seleccionId={agenda.seleccionId}
        onCita={alClickCita}
        onVista={agenda.verVista}
        onAvanzar={agenda.avanzar}
        aviso={fase === 'esperando-seleccion' || fase === 'reagendar' ? '⚠ Choque el Miércoles 10:00–10:30' : undefined}
        encabezado={
          <div className="calx-toolbar">
            <button type="button" className="calx-btn-nueva" data-testid="calx-nueva-cita" onClick={abrirFormulario}>
              + Nueva Cita
            </button>
            <span className="calx-toolbar-titulo">Tecnia Calendario</span>
            {fase === 'notificaciones' && (
              <span className="calx-toolbar-badge" data-testid="calx-badge-notificacion">
                📬 1 nueva
              </span>
            )}
          </div>
        }
        panel={
          <div className="calx-panel">
            <div className="calx-encargo">
              <span className="calx-encargo-kicker">Encargo {pasoActual} de {TOTAL_PASOS}</span>
              <p className="calx-encargo-texto">{INSTRUCCIONES[pasoActual]}</p>
            </div>

            {aviso && (
              <p className="calx-aviso" data-testid="calx-aviso">
                {aviso}
              </p>
            )}

            {fase === 'form-datos' && (
              <>
                <div className="calx-campo">
                  <label htmlFor="calx-titulo">Título</label>
                  <input
                    id="calx-titulo"
                    data-testid="calx-input-titulo"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Título de la cita"
                  />
                </div>
                <div className="calx-campo">
                  <label htmlFor="calx-dia">Día</label>
                  <select id="calx-dia" data-testid="calx-select-dia" value={dia} onChange={(e) => setDia(e.target.value)}>
                    <option value="">Elige un día</option>
                    {DIAS_FORMULARIO.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.etiqueta}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="calx-fila-2">
                  <div className="calx-campo">
                    <label htmlFor="calx-hora-inicio">Inicio</label>
                    <select
                      id="calx-hora-inicio"
                      data-testid="calx-select-inicio"
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                    >
                      <option value="">--:--</option>
                      {HORAS_DISPONIBLES.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="calx-campo">
                    <label htmlFor="calx-hora-fin">Fin</label>
                    <select
                      id="calx-hora-fin"
                      data-testid="calx-select-fin"
                      value={horaFin}
                      onChange={(e) => setHoraFin(e.target.value)}
                    >
                      <option value="">--:--</option>
                      {HORAS_DISPONIBLES.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button type="button" className="calx-btn" data-testid="calx-siguiente-invitados" onClick={confirmarDatos}>
                  Siguiente: Invitados →
                </button>
              </>
            )}

            {fase === 'form-invitados' && (
              <>
                <div className="calx-campo">
                  <label htmlFor="calx-invitado">Invitados</label>
                  <input
                    id="calx-invitado"
                    data-testid="calx-input-invitado"
                    value={correoDraft}
                    onChange={(e) => setCorreoDraft(e.target.value)}
                    placeholder="correo@escuela.edu"
                  />
                </div>
                <button type="button" className="calx-btn es-secundario" data-testid="calx-agregar-invitado" onClick={agregarInvitado}>
                  + Agregar
                </button>
                {invitadosDraft.length > 0 && (
                  <div className="calx-chips">
                    {invitadosDraft.map((correo) => (
                      <span key={correo} className="calx-chip">
                        {correo}
                      </span>
                    ))}
                  </div>
                )}
                <button type="button" className="calx-btn" data-testid="calx-guardar-cita" onClick={guardarCita}>
                  Guardar cita
                </button>
              </>
            )}

            {fase === 'notificaciones' && (
              <div className="calx-notif">
                <div className="calx-notif-cabecera">
                  <span className="calx-notif-icono" aria-hidden="true">
                    📬
                  </span>
                  <span className="calx-notif-titulo">Reunión Jurado</span>
                  <span className="calx-notif-nueva">1 nueva</span>
                </div>
                <button type="button" className="calx-btn" data-testid="calx-notif-abrir" onClick={abrirNotificacion}>
                  Abrir
                </button>
              </div>
            )}

            {fase === 'notif-abierta' && (
              <div className="calx-notif">
                <div className="calx-notif-cabecera">
                  <span className="calx-notif-icono" aria-hidden="true">
                    📬
                  </span>
                  <span className="calx-notif-titulo">Reunión Jurado</span>
                </div>
                <p className="calx-notif-detalle">
                  Miércoles 10:00–10:30 · De: Coordinación
                  <br />
                  Sala de jurados
                </p>
                <div className="calx-notif-acciones">
                  <button type="button" className="calx-btn" data-testid="calx-notif-aceptar" onClick={aceptarInvitacion}>
                    Aceptar
                  </button>
                  <button type="button" className="calx-btn es-secundario" data-testid="calx-notif-rechazar" onClick={rechazarInvitacion}>
                    Rechazar
                  </button>
                </div>
              </div>
            )}

            {fase === 'esperando-seleccion' && (
              <p className="calx-notif-detalle">
                Mira la parrilla del Miércoles: hay dos citas cruzadas. Pulsa el bloque «Demostración Robot» para
                editarlo.
              </p>
            )}

            {fase === 'reagendar' && citaSeleccionada && (
              <div className="calx-detalle">
                <p className="calx-detalle-titulo">{citaSeleccionada.titulo}</p>
                <p className="calx-detalle-hora">
                  {citaSeleccionada.inicio}–{citaSeleccionada.fin}
                </p>
                <p className="calx-detalle-choque">⚠ Choca con Reunión Jurado (10:00–10:30)</p>
                <div className="calx-campo">
                  <label htmlFor="calx-reagendar">Nueva hora de inicio</label>
                  <select
                    id="calx-reagendar"
                    data-testid="calx-select-reagendar"
                    value={nuevaHora}
                    onChange={(e) => setNuevaHora(e.target.value)}
                  >
                    {HORAS_DISPONIBLES.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="button" className="calx-btn" data-testid="calx-confirmar-reagendar" onClick={confirmarReagendar}>
                  Confirmar cambio
                </button>
              </div>
            )}

            {fase === 'cierre' && (
              <>
                <label className="calx-checkbox" htmlFor="calx-recordatorio">
                  <input
                    id="calx-recordatorio"
                    type="checkbox"
                    data-testid="calx-recordatorio"
                    checked={recordatorio}
                    onChange={(e) => setRecordatorio(e.target.checked)}
                  />
                  <span>Recordatorio 15 min antes</span>
                </label>
                <button type="button" className="calx-btn" data-testid="calx-confirmar-agenda" onClick={confirmarAgenda}>
                  Confirmar Agenda
                </button>
              </>
            )}
          </div>
        }
      />
    </VentanaBase>
  );
}

export default LabM365Calendario;
