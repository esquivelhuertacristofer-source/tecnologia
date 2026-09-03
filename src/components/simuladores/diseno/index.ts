/**
 * TECNIA DISEÑO — el armazón del que cuelgan las 8 actividades de diseño.
 *
 *   modelo.ts        la rejilla, las capas y la geometría (nada de React)
 *   comandos.ts      la ACCIÓN COMO DATO: el catálogo y la única función que aplica
 *   historia.ts      deshacer, rehacer y la lista de lo que el alumno hizo
 *   arrastre.ts      dónde cae esto, sin eventos del navegador
 *   consultas.ts     las preguntas que hace una clase, todas con enteros
 *   verificar.ts     el veredicto, con la invariante del historial
 *   useDiseno.ts     el estado: selección, herramienta, gesto
 *   VentanaDiseno.tsx la ventana, sin un solo `useState`
 *
 * Cómo se monta una clase:
 *
 *   const d = useDiseno({ documento: MI_CARTEL, herramientas: ['seleccion','texto','color'] });
 *   <VentanaBase marca="Tecnia Diseño" subtitulo="Cartel de la feria">
 *     <VentanaDiseno
 *       documento={d.documento} pagina={d.pagina} seleccion={d.seleccion}
 *       herramientas={d.herramientas} herramienta={d.herramienta}
 *       gesto={d.gesto} pasos={d.pasos} rechazo={d.rechazo}
 *       onHerramienta={d.elegirHerramienta}
 *       onSeleccionar={(id, mas) => d.seleccionar(id ? [id] : [], mas)}
 *       onGestoInicio={d.iniciarGesto} onGestoMover={d.moverGesto} onGestoSoltar={d.soltarGesto}
 *       onAccion={d.hacer} nuevoId={d.nuevoId}
 *       onDeshacer={d.deshacer} onRehacer={d.rehacer}
 *       puedeDeshacer={d.puedeDeshacer} puedeRehacer={d.puedeRehacer}
 *       panel={<MiPanelDeLaClase … />}   // ← aquí es donde las 8 se diferencian
 *     />
 *   </VentanaBase>
 *
 * Y se corrige leyendo el documento, nunca vigilando botones:
 *
 *   estaCentradaH(d.documento, d.pagina, 'titulo') && cuantosColores(…) < 4
 */

export {
  acotar,
  acotarAlLienzo,
  admiteRelleno,
  altoPx,
  anchoPx,
  cajaEnPixeles,
  cajaEntera,
  capaDe,
  centroX2,
  conCapa,
  conPagina,
  cssDe,
  dentroDelLienzo,
  enLaRejilla,
  esEsquina,
  esPt,
  ESCALA_PT,
  FIGURAS,
  giroHaciaPuntero,
  indiceDe,
  LIENZOS,
  MIN_COLS,
  MIN_FILAS,
  moverPorPixeles,
  normalizarGiro,
  NOMBRE_FIGURA,
  NOMBRE_TIPO,
  OPACIDAD_MAX,
  paginaDe,
  paginaDeLaCapa,
  PALETA_BASE,
  PASO_GIRO,
  ptAbajo,
  ptArriba,
  recorteDe,
  redimensionarPorPixeles,
  seTapan,
  SIN_RECORTE,
  TIRADORES,
} from './modelo';
export type {
  Alineacion,
  Caja,
  Capa,
  CapaForma,
  CapaId,
  CapaImagen,
  CapaTexto,
  ColorId,
  Documento,
  Figura,
  Licencia,
  Lienzo,
  Pagina,
  PaginaId,
  Paleta,
  Recorte,
  Recurso,
  Tinta,
  Tirador,
  TipoCapa,
} from './modelo';

export {
  accion,
  bul,
  capaTocada,
  COMANDOS,
  ejecutar,
  etiquetaDe,
  HERRAMIENTAS,
  lista,
  num,
  reproducir,
  txt,
} from './comandos';
export type { Accion, Args, Comando, Herramienta, HerramientaId, Resultado, ValorArg } from './comandos';

export {
  deshacer,
  documento,
  documentoEn,
  hacer,
  nuevaHistoria,
  pasos,
  puedeDeshacer,
  puedeRehacer,
  rehacer,
  TOPE_HISTORIA,
  vecesQueUso,
} from './historia';
export type { Historia, Paso, ResultadoHistoria } from './historia';

export { empujar, iniciar, mangoDeGiro, MANGO_GIRO_PX, mover, soltar } from './arrastre';
export type { Gesto, InicioGesto, TipoGesto } from './arrastre';

export {
  conCinta,
  conPista,
  corteDe,
  corteEn,
  cortesDe,
  cortesImposibles,
  descuadre,
  duracionDe,
  duracionTotal,
  inicioDe,
  MIN_DUR,
  ordenDeRecursos,
  pistaDe,
  sobranteDe,
} from './cinta';
export type { Corte, Pista, TipoPista } from './cinta';

export {
  alcanzables,
  alineadas,
  bordeDe,
  capasDe,
  coloresUsados,
  cuantasCapas,
  cuantosColores,
  deformadas,
  enlacesRotos,
  estaCentradaH,
  estaCentradaV,
  estaDeformada,
  fueraDelLienzo,
  hayJerarquia,
  huerfanas,
  imagenesDe,
  margenes,
  ordenDeLectura,
  palabrasEn,
  paresQueSeTapan,
  porTamano,
  recursosUsados,
  sinCreditar,
  sueltas,
  tapadaPor,
  tapanLaZona,
  textosDe,
  textosVacios,
  tintasRepetidas,
  visibles,
  zonaDeCapa,
} from './consultas';
export type { Borde } from './consultas';

export { estaSano, historiaCuadra, verificar } from './verificar';
export type { Veredicto } from './verificar';

export { useDiseno } from './useDiseno';
export type { Diseno, OpcionesDiseno } from './useDiseno';

export { VentanaDiseno } from './VentanaDiseno';
export type { InicioDeGesto, VentanaDisenoProps } from './VentanaDiseno';

export { LineaDeTiempo } from './LineaDeTiempo';
export type { LineaDeTiempoProps } from './LineaDeTiempo';
