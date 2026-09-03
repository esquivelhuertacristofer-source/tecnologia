/**
 * Tecnia Agenda — el calendario de la plataforma.
 *
 *   tiposAgenda.ts   los datos y las funciones puras (nada de React)
 *   useAgenda.ts     el estado: crear, mover, borrar, invitar y responder
 *   VentanaAgenda.tsx la ventana de mes y de semana, sin un solo `useState`
 *
 * Sale de partir «10 · Tecnia Nube» del canon: un calendario no se parece por
 * dentro a un servicio de archivos compartidos.
 *
 * REGLA DURA: ni este armazón ni sus pruebas llaman a `Date.now()` ni a
 * `new Date()` sin argumentos. El día de hoy entra por parámetro, siempre.
 *
 * Cómo se monta una clase:
 *
 *   const agenda = useAgenda({ hoy: '2026-08-17', citas: SEMILLA });
 *   <VentanaBase marca="Tecnia Agenda" subtitulo="Semana del 17">
 *     <VentanaAgenda
 *       citas={agenda.citas} hoy={agenda.hoy} dia={agenda.dia}
 *       vista={agenda.vista} seleccionId={agenda.seleccionId}
 *       onCita={agenda.seleccionar} onVista={agenda.verVista}
 *       onAvanzar={agenda.avanzar}
 *     />
 *   </VentanaBase>
 */
export {
  borrarCita,
  citasDe,
  crearCita,
  cuentaInvitados,
  diaDeLaSemana,
  diaValido,
  disponerDia,
  duracionEnMinutos,
  horaValida,
  invitar,
  mesDe,
  minutosAHora,
  minutosDe,
  moverCita,
  rejillaDelMes,
  responderInvitacion,
  revisarCita,
  seSolapan,
  semanaDe,
  solapesDe,
  sumarDias,
  type CitaAgenda,
  type ColocacionCita,
  type InvitadoAgenda,
  type MotivoCitaInvalida,
  type MotivoInvitar,
  type MotivoRechazoCita,
  type MotivoResponder,
  type NuevaCita,
  type PersonaAgenda,
  type RespuestaInvitacion,
  type ResultadoAgenda,
  type ResultadoCita,
  type ResultadoInvitar,
  type ResultadoResponder,
} from './tiposAgenda';

export { useAgenda } from './useAgenda';
export type { Agenda, OpcionesAgenda, VistaAgenda } from './useAgenda';

export { VentanaAgenda } from './VentanaAgenda';
export type { VentanaAgendaProps } from './VentanaAgenda';
