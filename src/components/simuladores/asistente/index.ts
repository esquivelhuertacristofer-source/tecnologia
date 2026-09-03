/**
 * Tecnia Asistente — el armazón del que cuelgan las 16 actividades de IA.
 *
 *   guionAsistente.ts    los datos y las funciones puras (nada de React)
 *   useAsistente.ts      el estado: hilo, tecleo y marcas
 *   VentanaAsistente.tsx la ventana de chat, sin un solo `useState`
 *
 * Cómo se monta una clase:
 *
 *   const ia = useAsistente({ guion: GUION, velocidad: 18 });
 *   <VentanaAsistente
 *     mensajes={ia.mensajes}
 *     escribiendo={ia.ocupado}
 *     onSaltarTecleo={ia.saltarTecleo}
 *     compositor={{ fichas: FICHAS, onEnviarFicha: (id) => ia.enviarFicha(id) }}
 *     panel={<MiPanelDeLaClase … />}   // ← aquí es donde las 16 se diferencian
 *   />
 */
export {
  casaPalabra,
  casaPalabras,
  estaCompleto,
  evaluarPrompt,
  largoDe,
  normalizar,
  palabrasDe,
  repartirRevelado,
  resolverGuion,
  textoDe,
  validarGuion,
  veracidadDe,
} from './guionAsistente';
export type {
  CriterioPrompt,
  EntradaAlumno,
  EvaluacionPrompt,
  FichaPrompt,
  GuionAsistente,
  MarcaParte,
  MensajeAsistente,
  MensajeAviso,
  MensajeIA,
  MensajeTroceado,
  MensajeUsuario,
  NivelPrompt,
  ParteEnHilo,
  ParteRespuesta,
  RefRespuesta,
  ReglaGuion,
  RespuestaGuion,
  ResultadoGuion,
  RubricaPrompt,
  Veracidad,
} from './guionAsistente';

export { useAsistente } from './useAsistente';
export type { Asistente, OpcionesAsistente, ResultadoEnvio } from './useAsistente';

export { VentanaAsistente } from './VentanaAsistente';
export type {
  AccionAsistente,
  CompositorAsistente,
  VentanaAsistenteProps,
} from './VentanaAsistente';
