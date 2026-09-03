/**
 * Banco Físico 3D — la puerta del armazón.
 *
 * Cinco capacidades y ni una más, sacadas de las siete filas del canon que se
 * lo asignan y no de la idea de lo que debería tener un motor 3D:
 *
 * 1. **Una escena con las piezas que la actividad define** — `BancoFisico3D`
 *    con `modelo` y `dibujarPieza`; el armazón coloca, la clase dibuja.
 * 2. **Coger, mover y encajar, con la señal de que encajó** — `tomar`,
 *    `resolverSuelta`, `aplicarSuelta`. La usan cuatro de las siete.
 * 3. **Cámara que da la vuelta al objeto, con límites** — `LIMITES_BANCO`,
 *    `limitarOrbita`. Vuelta entera para llegar detrás; techo por debajo del
 *    horizonte para no acabar bajo el suelo.
 * 4. **Señalar y examinar, con el letrero anclado en el mundo** —
 *    `LetreroMundo3D`: placa con tirante que gira con la pieza de la que
 *    cuelga, no un cartel de frente a la pantalla.
 * 5. **Comprobar el estado** — `montajeCompleto` («¿está todo conectado?») y
 *    `evaluar` («¿está en el sitio correcto?», con la tabla de verdad como
 *    parámetro, porque el armazón no corrige).
 *
 * Lo que **no** trae, y es a propósito: ningún `useBanco3D` que guarde estado.
 * Las transiciones ya son funciones de `EstadoBanco → EstadoBanco`, así que la
 * actividad hace `setBanco(b => tomar(def, b, id))` y se acabó. Un hook encima
 * sólo añadiría un dueño más para el mismo dato.
 */

export {
  ESTADO_VACIO,
  TOLERANCIA,
  aplicarSuelta,
  anclajeApuntado,
  anclajeDe,
  anclajeMasCercano,
  avanceDeArrastre,
  centroAnclajes,
  dentroDe,
  devolver,
  distancia,
  distanciaAlRayo,
  dondeEsta,
  evaluar,
  montajeCompleto,
  normalizarRayo,
  partirEnLineas,
  piezaDe,
  piezasPorMontar,
  posicionDe,
  puedeTomar,
  puntoSobreRayo,
  quitarPieza,
  resolverSuelta,
  resolverSueltaEn,
  seAplico,
  soltar,
  soltarEn,
  tomar,
  validarBanco,
  type AnclajeDef,
  type BancoDef,
  type Evaluacion,
  type EstadoBanco,
  type Mira,
  type PiezaDef,
  type Punto3,
  type Rayo,
  type Suelta,
} from './bancoFisico';

export {
  LIMITES_BANCO,
  LIMITES_EXAMEN,
  limitarOrbita,
  normalizarAngulo,
  orbitaAPunto,
  orbitaHabilitada,
  orbitaValida,
  pasoDeEnfoque,
  puntoMedio,
  type LimitesOrbita,
  type Orbita,
} from './orbita';

export { BancoFisico3D, type BancoFisico3DProps, type PaletaBanco } from './BancoFisico3D';

export {
  AroAnclaje3D,
  COLOR_ANCLAJE,
  CaptorDeArrastre,
  LetreroMundo3D,
  Mando3D,
  PiezaBanco3D,
  type EstadoAnclaje,
  type LetreroMundo,
  type MandoDef,
  type VistaPieza,
} from './piezasBanco3D';
