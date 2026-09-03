/**
 * Tecnia Correo — el cliente de correo de la plataforma.
 *
 *   tiposCorreo.ts   los datos y las funciones puras (nada de React)
 *   useCorreo.ts     el estado: carpetas, abrir, marcar, borrar, responder,
 *                    reenviar y enviar
 *   VentanaCorreo.tsx la ventana entera, sin un solo `useState`
 *
 * Sale de partir «10 · Tecnia Nube» del canon: correo, tablero y agenda no
 * son el mismo programa. Lo que el canon daba por hecho —que
 * `LabPartesDelCorreo.tsx` ya tenía «el cliente completo»— no era cierto: ver
 * la medición en la cabecera de `tiposCorreo.ts`.
 *
 * Cómo se monta una clase:
 *
 *   const correo = useCorreo({ yo: SOFI, mensajes: SEMILLA });
 *   <VentanaBase marca="Tecnia Correo" subtitulo={SOFI.direccion}>
 *     <VentanaCorreo
 *       carpetaActiva={correo.carpeta} cuentas={correo.cuentas}
 *       mensajes={correo.enCarpeta()} seleccionId={correo.seleccionId}
 *       abierto={correo.abierto} acciones={['responder', 'borrar']}
 *       onCarpeta={correo.abrirCarpeta} onSeleccionar={correo.abrir}
 *       onAccion={(a, id) => { ... }}   // ← aquí cada clase decide
 *     />
 *   </VentanaBase>
 */
export {
  CARPETAS,
  ETIQUETA_CARPETA,
  adjuntoPeligroso,
  alternarMarca,
  anfitrionDe,
  borradorDeReenvio,
  borradorDeRespuesta,
  borradorVacio,
  contarCarpetas,
  dominioDe,
  enlaceEnganoso,
  marcarLeido,
  mensajesEn,
  mismoDominio,
  moverA,
  pesoLegible,
  revisarDireccion,
  tipoDeAdjunto,
  usuarioDe,
  type AdjuntoCorreo,
  type BorradorCorreo,
  type CarpetaCorreo,
  type ConteoCarpeta,
  type EnlaceCorreo,
  type MensajeCorreo,
  type MotivoDireccionRota,
  type OrigenBorrador,
  type RemitenteCorreo,
  type ResultadoDireccion,
  type TipoAdjunto,
} from './tiposCorreo';

export { useCorreo } from './useCorreo';
export type { Correo, OpcionesCorreo, ResultadoCorreo, ResultadoEnviar } from './useCorreo';

export { VentanaCorreo } from './VentanaCorreo';
export type { AccionCorreo, RedaccionCorreo, VentanaCorreoProps } from './VentanaCorreo';
