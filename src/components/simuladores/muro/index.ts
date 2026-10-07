/**
 * Tecnia Muro — el armazón del que cuelgan las 8 actividades de red social.
 *
 *   tiposMuro.ts   los datos y las funciones puras (nada de React)
 *   useMuro.ts     el estado: publicar, reaccionar, borrar (sin borrar de verdad)
 *   VentanaMuro.tsx la ventana del muro y del perfil, sin un solo `useState`
 *
 * Cómo se monta una clase:
 *
 *   const muro = useMuro({ alumno: SOFI, publicaciones: SEMILLA });
 *   <VentanaMuro
 *     publicaciones={muro.visibles()}
 *     compositor={{ valor, onCambiar: setValor, onPublicar: () => { muro.publicar({ texto: valor }); setValor(''); } }}
 *     onAccion={(accion, id) => { ... }}   // ← aquí cada clase decide qué hacer con cada acción
 *   />
 */
export {
  publicacionesVisibles,
  type AccionMuro,
  type AutorMuro,
  type ComentarioMuro,
  type ConsecuenciaMuro,
  type ContactoMuro,
  type EvidenciaMuro,
  type MensajeMuro,
  type MotivoReporte,
  type CopiaMuro,
  type ImagenMuro,
  type PerfilMuro,
  type PublicacionMuro,
  type Visibilidad,
} from './tiposMuro';

export { useMuro } from './useMuro';
export type { DatosPublicar, Muro, OpcionesMuro, ResultadoAccion, ResultadoCaptura, ResultadoComentar, ResultadoMensaje, ResultadoPublicar } from './useMuro';

export { ETIQUETA_MOTIVO, VentanaMuro } from './VentanaMuro';
export { BandejaMuro } from './BandejaMuro';
export type { BandejaMuroProps } from './BandejaMuro';
export type { ComentarioEnCurso, CompositorMuro, ReporteEnCurso, VentanaMuroProps } from './VentanaMuro';
