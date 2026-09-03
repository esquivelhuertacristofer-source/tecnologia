/**
 * Tecnia Navegador — el armazón del que cuelgan las 6 actividades de
 * navegador (CANON-ARMAZONES.md, «9 · Tecnia Navegador»).
 *
 *   tiposNavegador.ts    los datos, la pila de atrás/adelante, y el candado — nada de React
 *   useNavegador.ts      el estado: pestañas, historial, marcadores, descargas, emergentes
 *   VentanaNavegador.tsx la ventana, sin un solo `useState`
 *
 * Cómo se monta una clase:
 *
 *   const nav = useNavegador({ mapa: MAPA_SITIOS, inicio: 'buscador.tecnia.mx' });
 *   const [direccion, setDireccion] = useState(nav.paginaActual.url);
 *   <VentanaNavegador
 *     pestanas={nav.pestanas.map((p) => ({ id: p.id, activa: p.id === nav.activaId, titulo: paginaDe(MAPA_SITIOS, p.url).pestana }))}
 *     pagina={nav.paginaActual}
 *     puedeAtras={nav.puedeAtras}
 *     puedeAdelante={nav.puedeAdelante}
 *     barraDireccion={{ valor: direccion, onCambiar: setDireccion, onIr: () => nav.navegar(direccion) }}
 *     onAtras={() => nav.atras()}
 *     onAdelante={() => nav.adelante()}
 *     onIrAUrl={(url) => { nav.navegar(url); setDireccion(url); }}
 *   />
 */
export {
  crearPestana,
  estadoSeguridad,
  irAdelante,
  irAtras,
  navegarEnPestana,
  paginaDe,
  paginaNoEncontrada,
  protocoloDe,
  recargarPestana,
  urlDeBusqueda,
  type AccionFicha,
  type Certificado,
  type CuerpoPagina,
  type DatoFicha,
  type Descarga,
  type EnlacePagina,
  type EntradaHistorial,
  type EstadoPestana,
  type EstadoSeguridad,
  type MapaSitios,
  type Marcador,
  type PaginaWeb,
  type Protocolo,
  type ResultadoBusqueda,
  type SenalPagina,
  type VentanaEmergente,
} from './tiposNavegador';

export { useNavegador } from './useNavegador';
export type { Navegador, OpcionesNavegador } from './useNavegador';

export { VentanaNavegador } from './VentanaNavegador';
export type { BarraDireccion, PestanaVista, VentanaNavegadorProps } from './VentanaNavegador';
