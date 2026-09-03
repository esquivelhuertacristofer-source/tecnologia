'use client';

import { Minus, Play, Plus, Redo2, Save, Undo2, X } from 'lucide-react';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DESPLEGABLES_PPT,
  QUE_HACE_PESTANA_PPT,
  QUE_HACE_PPT,
} from './motor-diapos/guia';
import type {
  PestanaDiapos,
  PestanaPPT,
} from '@/components/activities/office/tecniaDiapositivas';
import { TAMANO_BASE_DIAPO, TAMANOS_DIAPO } from '@/components/activities/office/tecniaDiapositivas';
import { FUENTES } from './motor/esquema';
import { explicarDesvio, ubicar, ubicarPestana, type Ubicacion } from './motor/guia';
import {
  ejecutar,
  estaActivo,
  estaInerte,
  razonInerte,
  existe,
  ES_INTERRUPTOR,
  type Contexto,
  type ControlesDeClase,
} from './motor-diapos/comandos';
import {
  animaciones,
  aplicarRecorte,
  borrarComentario,
  comentar,
  comentariosDe,
  crearPersonalizada,
  cuantasDiapositivas,
  cuerpoCedido,
  duracionDe,
  escribirEn,
  escribirLibre,
  escribirNotas,
  patronImpreso,
  reciennacido,
  tocarPatronImpreso,
  type CualPatronImpreso,
  formatoConPatron,
  formatoDe,
  girar,
  irA,
  laActiva,
  mover,
  moverAnimacion,
  nombreDeDiapositiva,
  nombreDelDiseno,
  ORGANIZAR,
  pasoInicial,
  pasosDeAnimacion,
  pendientesEnElMazo,
  plegarSeccion,
  ponerAlt,
  primeraVisible,
  grabarEn,
  cambiarForma,
  pieDe,
  ponerElPie,
  quitarNarracion,
  cuantasNarradas,
  ponerIntervalo,
  crearSeccion,
  quitarAnimacion,
  quitarLibre,
  recolocar,
  resolverComentario,
  siguientePaso,
  TEMAS,
  temaDe,
  traer,
  traerVarias,
  tramos,
  transicionDe,
  type Mazo,
  type Sitio,
} from './motor-diapos/mazo';
import {
  BOTONES_DE_ACCION,
  COL_PX,
  colsDe,
  anchoDe,
  FORMAS,
  casillasDelDiseno,
  DISENOS,
  DURACIONES,
  FILA_PX,
  FILAS,
  GLIFO_ACCION,
  LIENZO_ALTO,
  type Forma,
  NOMBRE_ANIMACION,
  casillaDe,
  moverPorPixeles,
  recorteDe,
  recortarPorPixeles,
  redimensionarPorPixeles,
  rolesDe,
  type Casilla,
  type Diapositiva,
  type Libre,
  type DisenoId,
  type Rol,
  type Tirador,
} from './motor-diapos/modelo';
import { estimadoDe, estimadoNarrando, tintaSobre } from './motor-diapos/consultas';
import { Dibujado, esDibujado } from './motor-diapos/Dibujados';
import { RELOJ, Reproductor } from './motor-diapos/Reproductor';
import { Altavoz, CSS_ALINEACION, FotoRecortada, Lamina } from './motor-diapos/Lamina';
import { Figura, Modelo3D } from './motor-diapos/Figuras';
import { MiniZoom } from './motor-diapos/MiniZoom';
import { aDiapositivas, cuantasSaldran, type RenglonDeEsquema } from './motor-diapos/desdeElEsquema';
import { HojaImpresa } from './motor-diapos/HojaImpresa';
import { formaDeImprimir, lasQueSeImprimen } from './motor-diapos/impresion';
import { detenerSonido, reproducirSonido } from './motor-diapos/sonidos';
import type { GuionDiapos, PasoDiapos } from './motor-diapos/guion';
import { esDesvio, useCajaDelObjetivo, useHuecoEnElBody } from './chrome/ganchos';
import { BotonCinta, ConNegritas, PanelMaestro, PortadaPractica, type Recado } from './chrome/piezas';
import './ventanaTextos.css';
import './ventanaDiapositivas.css';

/**
 * Tecnia Diapositivas — la ventana entera (doc §40).
 *
 * Esto no es una interfaz dibujada encima de una escena: **es el programa**. El
 * alumno crea diapositivas de verdad, elige su diseño de una galería que dibuja
 * el acomodo, escribe dentro de los marcadores, los arrastra por un lienzo 16:9
 * y reordena la presentación arrastrando miniaturas. La cinta tiene pestañas y
 * grupos rotulados, y sus botones se hunden solos cuando el formato ya está
 * puesto donde el alumno está apuntando.
 *
 * A la derecha, acoplado como un panel de tareas —no flotando encima—, está el
 * maestro: dice qué hacer, señala con un aro el sitio VIVO de la cinta o del
 * lienzo donde mirar, y **corrige leyendo la presentación**.
 *
 * ── LO QUE NO SE COPIÓ DE `VentanaTextos.tsx` ───────────────────────────────
 *
 * El botón de la cinta, la ficha de la herramienta, la portada de objetivos, el
 * panel del maestro, el gancho que mide el objetivo del aro y el que cuelga la
 * ventana del `<body>` viven en `chrome/`, y este archivo los USA. Se sacaron
 * de ahí el 11-ago-2026, antes de escribir una sola línea de esta ventana: lo
 * que se copia se separa, y el día que dos guías se separan una de las dos
 * empieza a mentir.
 *
 * Lo que sí es de aquí y de nadie más: la tira de miniaturas, el lienzo con sus
 * ocho tiradores, la galería de diseños, el cajón de notas y el repaso a
 * pantalla completa.
 */

/* ─────────────────────────── piezas de esta ventana ─────────────────────────── */

/** Cómo se empaqueta cada grupo de la cinta de PowerPoint. */
const DISPOSICION: Record<string, { cols?: number; grande?: boolean }> = {
  diapositivas: { grande: true },
  fuente: { cols: 6 },
  parrafo: { cols: 5 },
  imagenes: { grande: true },
  'texto-grupo': { cols: 1 },
  temas: { grande: true },
  dibujo: { cols: 1 },
  ilustraciones: { cols: 1 },
  'tablas-diapo': { grande: true },
  multimedia: { cols: 1 },
  vinculos: { cols: 1 },
  personalizar: { cols: 1 },
  transicion: { cols: 1 },
  intervalos: { cols: 1 },
  animacion: { cols: 1 },
  'anim-avanzada': { cols: 1 },
  iniciar: { grande: true },
  'configurar-presentacion': { cols: 1 },
  'revision-diapo': { grande: true },
  'comentarios-diapo': { grande: true },
  vistas: { cols: 1 },
  patrones: { grande: true },
};

const TIRADORES: Tirador[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

/**
 * Las herramientas del programa que NO viven en la cinta.
 *
 * `ubicar()` deriva el domicilio recorriendo la cinta, y eso deja fuera a dos
 * que un encargo sí puede pedir: el zoom y «Repasar», que están en la barra de
 * abajo. Sin esta tabla, el aro les apunta bien pero se quedan sin ficha y sin
 * «Enséñamelo» — media guía, que es el agujero que en Word tuvieron los
 * desplegables de tipografía hasta el §37.5. Su domicilio se escribe aquí
 * porque es verdad: su sitio es la barra de estado, no un grupo de la cinta.
 */
const FUERA_DE_LA_CINTA: Record<string, { grupo: string; etiqueta: string; glifo: string }> = {
  zoom: { grupo: 'Barra de abajo', etiqueta: 'Zoom', glifo: '%' },
  repasar: { grupo: 'Barra de abajo', etiqueta: 'Repasar', glifo: '▶' },
};

/**
 * Los que ponen la presentación en marcha, vengan de donde vengan.
 *
 * `Presentación → Desde el principio` y el «Repasar» de la barra de abajo son
 * **el mismo botón de PowerPoint** puesto en dos sitios, y los dos hacen lo
 * mismo: arrancar en la primera. Qué hay al otro lado —el repaso a pantalla
 * completa o el auditorio— lo decide esta ventana y no el comando, porque el
 * comando no cambia el documento y no tiene por qué saberlo.
 */
const ARRANCAN_LA_PRESENTACION = new Set([
  'repasar',
  'desde-principio',
  'vista-moderador',
  // `ensayar` también arranca la presentación, y en PowerPoint es literalmente
  // la misma pantalla con un cronómetro encima (§43.3). Lo que lo distingue no
  // es cómo se ve sino que al salir **deja los tiempos puestos**.
  'ensayar',
  // Y `grabar` es el ensayo otra vez, con el punto rojo y una diferencia que se
  // ve al salir: deja los tiempos **y la voz** (§44.6).
  'grabar',
]);

/**
 * Con qué nombre firma el alumno sus comentarios (§43.6).
 *
 * «Tú» y no un nombre inventado. En PowerPoint firma la cuenta con la que
 * entraste, y aquí no hay cuenta: poner «Alumno» o «Usuario 1» sería fingir un
 * dato que no tenemos, y poner un nombre propio sería fingir que es el suyo. Lo
 * que sí es verdad es que ese comentario lo escribió él, y eso es lo que dice.
 */
const AUTOR_ALUMNO = 'Tú';

/**
 * Los controles que abren un panel de tareas en vez de cambiar el documento.
 *
 * Misma familia que `ARRANCAN_LA_PRESENTACION`: su efecto es sobre la VENTANA,
 * no sobre el mazo, así que su comando devuelve `null` y quien actúa es esto.
 * Están en la tabla de comandos igualmente —si no, la cinta los pintaría «aún
 * no disponible»— y por eso pasan por el desvío como cualquier otro botón.
 */
const ABREN_PANEL: Record<string, 'animacion' | 'alt' | 'comentarios' | 'reutilizar'> = {
  'panel-animacion': 'animacion',
  'texto-alt': 'alt',
  comentario: 'comentarios',
  reutilizar: 'reutilizar',
};

/**
 * La miniatura de un diseño, dibujada.
 *
 * El §27.1 lo pide con estas palabras: «cada opción muestra su **acomodo
 * dibujado** además del nombre». Y tiene razón pedagógica: un niño de nueve años
 * no sabe qué es «dos contenidos» leyéndolo, lo sabe viendo dos columnas. El
 * dibujo se DERIVA de `DISENOS`, no se escribe: el día que un diseño cambie sus
 * casillas, su icono cambia solo. Es la misma regla de §37 —lo que se deriva no
 * se escribe— aplicada a un dibujo.
 */
function AcomodoDibujado({ diseno, forma }: { diseno: DisenoId; forma?: Forma }) {
  // El dibujo de la galería también cambia de forma (§44.3): en 4:3 los dos
  // cuerpos de «Dos contenidos» dejan aire en medio, y el icono lo enseña.
  const casillas = casillasDelDiseno(diseno, forma);
  const cols = colsDe(forma);
  return (
    <span className="dpw-acomodo" aria-hidden="true">
      {(Object.keys(casillas) as Rol[]).map((rol) => {
        const c = casillas[rol];
        if (!c) return null;
        return (
          <i
            key={rol}
            className={`dpw-acomodo-caja es-${rol}`}
            style={{
              left: `${(c.col / cols) * 100}%`,
              top: `${(c.fila / FILAS) * 100}%`,
              width: `${(c.cols / cols) * 100}%`,
              height: `${(c.filas / FILAS) * 100}%`,
            }}
          />
        );
      })}
    </span>
  );
}

/** La miniatura de una diapositiva de verdad, para la tira. */
function Miniatura({
  d,
  fondo,
  color,
  forma,
}: {
  d: Diapositiva;
  fondo: string;
  color: string;
  forma?: Forma;
}) {
  const cols = colsDe(forma);
  return (
    <span className="dpw-mini-lienzo" style={{ background: fondo }} aria-hidden="true">
      {rolesDe(d.diseno).map((rol) => {
        const c = casillaDe(d, rol, forma);
        const m = d.marcadores.find((x) => x.rol === rol);
        if (!c) return null;
        return (
          <i
            key={rol}
            className={`dpw-mini-caja${m?.contenido ? ' es-lleno' : ''}`}
            style={{
              left: `${(c.col / cols) * 100}%`,
              top: `${(c.fila / FILAS) * 100}%`,
              width: `${(c.cols / cols) * 100}%`,
              height: `${(c.filas / FILAS) * 100}%`,
              background: m?.contenido ? color : undefined,
              borderColor: color,
            }}
          />
        );
      })}
      {d.libres.map((l) => {
        const c = l.casilla;
        return (
          <i
            key={l.id}
            className="dpw-mini-caja es-libre"
            style={{
              left: `${(c.col / cols) * 100}%`,
              top: `${(c.fila / FILAS) * 100}%`,
              width: `${(c.cols / cols) * 100}%`,
              height: `${(c.filas / FILAS) * 100}%`,
              background: color,
              borderColor: color,
            }}
          />
        );
      })}
    </span>
  );
}

/* ─────────────────────────── la ventana ─────────────────────────── */

/**
 * Un item de una galería que pone la clase.
 *
 * El motor trae las galerías que son suyas —diseños, temas, colores, fondos—
 * porque forman parte del programa. Las que son CONTENIDO las pone la clase:
 * las tres imágenes candidatas del §27.2 no son de PowerPoint, son del desierto.
 * `valor` viaja tal cual al comando, así que la clase decide su formato.
 */
export interface ItemGaleria {
  valor: string;
  nombre: string;
  detalle?: string;
  /** Lo que se dibuja en la muestra. Una imagen, o nada. */
  fuente?: string;
}

/**
 * Lo que recibe un escenario: el sitio donde la presentación se PRESENTA.
 *
 * Sin escenario, «Desde el principio» abre el repaso de siempre —fondo negro y
 * la lámina—, que es lo que hace PowerPoint en un portátil. Con escenario, ese
 * mismo botón te pone donde la presentación va a ocurrir de verdad: el
 * auditorio de §27.3, con el público en las butacas.
 *
 * **No hay un sexto tipo de logro para esto.** El escenario emite gestos con
 * `gesto(control)` exactamente como si el alumno hubiera pulsado un botón de la
 * cinta, y el guion los espera con `logro: { tipo: 'control' }`, que existe
 * desde el §36 justo «para lo que no deja rastro en el documento». Un ensayo
 * con buen ritmo y una decisión de la función no dejan rastro en el mazo, y no
 * deben dejarlo: la presentación es la misma antes y después.
 */
export interface EscenarioProps {
  mazo: Mazo;
  diapositiva: Diapositiva;
  indice: number;
  total: number;
  irA: (i: number) => void;
  salir: () => void;
  /** Un gesto del alumno, igual que pulsar un control de la cinta. */
  gesto: (control: string) => void;
  /** Id del encargo vigente, para que el escenario sepa qué acto toca. */
  pasoId: string | null;
  /** Ya no queda ningún encargo. El escenario decide cómo baja el telón. */
  terminado: boolean;
  /**
   * Con qué botón se abrió la presentación.
   *
   * Entró el 11-ago-2026 con `of-ppt-presenta-y-comparte` (§43.1) y es lo
   * mínimo que hacía falta para que esa clase se pueda dar: `Desde el
   * principio` y `Vista Moderador` abren **lo mismo** para el público y **cosas
   * distintas** para quien presenta, y ésa es literalmente la lección. Sin
   * saber cuál se pulsó, el escenario tendría que adivinarlo por el id del
   * encargo, que es lo mismo que vigilar el botón en vez de leer el estado.
   */
  abiertaCon: string | null;
}

/**
 * Lo que hay detrás de la pestaña **Archivo** —el «Backstage» de Microsoft—.
 *
 * Sin esto, la pestaña sigue siendo el tope que contesta «eso lo verás en otra
 * clase», que es lo que ha sido desde §36. Esa deuda la dejó escrita
 * `of-word-guardar-e-imprimir`, que tuvo que declarar Guardar como e Imprimir
 * en un grupo de la pestaña Inicio llamado «Archivo» **porque el motor no la
 * dejaba abrir**, y lo dejó dicho: «habilitarla es un cambio en el motor y está
 * pedido en el cableado». Aquí se paga.
 *
 * Es la quinta puerta del motor de diapositivas, después de `controles`,
 * `galerias`, `panelFijo` y `accesorios`, y se abre por la misma razón que las
 * otras cuatro: **hay un sitio del programa de verdad que ninguna de ellas
 * alcanza**. Exportar no es un botón de la cinta y ponerlo ahí sería enseñar un
 * domicilio falso (§36.12).
 */
export interface BackstageProps {
  mazo: Mazo;
  /** El nombre del archivo, tal como sale en la barra de título. */
  archivo: string;
  cerrar: () => void;
  /**
   * «Vuelve a corregir». Un cuadro de Backstage no cambia el mazo —exportar no
   * toca la presentación— así que sin esto el maestro no se enteraría nunca de
   * que el encargo ya está hecho.
   */
  /**
   * «Vuelve a corregir», y opcionalmente **con nombre**.
   *
   * Sin argumento vuelve a leer el documento, que es lo que §43.1 necesita: lo
   * que cambia al exportar está en el almacén de salida, no en el mazo. Con
   * argumento emite un gesto igual que un botón de la cinta, y eso es lo que
   * §43.6 necesita: **inspeccionar no cambia el documento** —sólo enseña lo que
   * ya llevaba dentro— así que ningún predicado podría verlo.
   */
  avisar: (control?: string) => void;
  /**
   * Cambiar la presentación desde el Backstage (§43.6).
   *
   * Entró con el Inspector de documento, y hasta entonces sobraba: exportar y
   * proteger **no tocan el mazo**, así que el Backstage sólo necesitaba leerlo.
   * El inspector sí lo toca —quitar una diapositiva oculta es quitarla— y su
   * domicilio de verdad es `Archivo → Información`. Meterlo en la cinta para
   * poder cambiar el mazo habría sido enseñar un domicilio falso (§36.12);
   * abrir esta puerta cuesta una línea y no miente.
   *
   * Pasa por el mismo `cambiar` que todo lo demás, así que deshacer, guardar y
   * la corrección del encargo funcionan sin enterarse de por dónde vino.
   */
  cambiar: (m: Mazo) => void;
}

/**
 * Un panel de tareas que aporta la CLASE, no el programa.
 *
 * Nació con la ficha de revisión de §42.3, que es un instrumento de enseñanza
 * y no una herramienta de PowerPoint. Por eso **no tiene botón en la cinta**:
 * meterlo ahí habría sido inventarle un domicilio a algo que en el programa de
 * verdad no existe, que es exactamente el defecto que costó ocho entradas
 * mintiendo en Word (§36.12). Está abierto todo el rato, como el cajón de
 * notas, porque el encargo de la clase es mirarlo.
 */
export interface PanelDeClaseProps {
  mazo: Mazo;
  diapositiva: Diapositiva | null;
  indice: number;
  irA: (i: number) => void;
  /**
   * Un gesto del alumno, igual que pulsar un control de la cinta (§44.3).
   *
   * Lo mismo que el escenario tiene desde §42.1, y por el mismo motivo: hay
   * clases cuyo instrumento **no es un botón de PowerPoint**. El proyector del
   * salón de §44.3 es un aparato del aula, no una herramienta del programa, y
   * meterlo en la cinta habría sido inventar un domicilio (§36.12). Vive en el
   * panel de la clase, con su interruptor, y avisa por aquí.
   *
   * No ensancha la puerta: `panelFijo` ya recibía `irA`, que también cambia el
   * documento. Lo que faltaba era poder decir «me han pulsado».
   */
  gesto: (control: string) => void;
}

export interface VentanaDiapositivasProps {
  cinta: PestanaDiapos[];
  guion: GuionDiapos;
  /** Un panel acoplado propio de la clase, siempre abierto. */
  panelFijo?: { titulo: string; Cuerpo: React.ComponentType<PanelDeClaseProps> };
  /** Dónde se proyecta la presentación. Sin él, el repaso a pantalla completa. */
  escenario?: React.ComponentType<EscenarioProps>;
  /**
   * En qué encargos manda el escenario. Sin esto, manda en todos.
   *
   * Nació jugando mal: con el escenario puesto siempre, pulsar «Repasar» en
   * mitad de la clase 3 abría el ensayo cronometrado aunque el encargo pidiera
   * otra cosa, con su botón de «Terminar el ensayo» y todo. En los encargos
   * que no son suyos vuelve el repaso normal del programa, que es lo que hace
   * PowerPoint cuando sólo quieres mirar.
   */
  escenarioCuando?: (pasoId: string | null) => boolean;
  /** Fracción 0–1 de encargos resueltos. */
  onAvance?: (avance: number) => void;
  onTerminado?: (r: { pasos: number; tropiezos: number; segundos: number }) => void;
  /** Herramientas que aporta ESTA clase y que el motor no trae. */
  controles?: ControlesDeClase;
  /** Galerías de contenido, por id de control. Ver `ItemGaleria`. */
  galerias?: Record<string, ItemGaleria[]>;
  /** Lo que la clase quiera pintar dentro de la ventana: un panel, un diálogo. */
  accesorios?: React.ReactNode;
  /**
   * **El otro archivo**, el que tiene las diapositivas ya hechas (§44.5).
   *
   * El panel de reutilizar lo pinta el motor y no la clase, porque reutilizar
   * es de PowerPoint (MOS 2.1.1) y no un invento de esta lección; lo que sí es
   * de la clase es **de qué archivo se trae**, igual que las galerías de
   * imágenes o de sonidos. Sin esto el botón está construido y el panel dice
   * que no hay ningún archivo abierto, que es la verdad.
   */
  archivoDeOrigen?: { nombre: string; mazo: Mazo };
  /**
   * **El documento de Word que se convierte en diapositivas** (§44.5, MOS 2.1.2).
   *
   * Una lista de renglones con su nivel, que es exactamente lo que un esquema
   * es. No se declara como HTML ni como texto con guiones: de esta lista se
   * derivan **las dos cosas** —la hoja que se enseña en el diálogo y las
   * diapositivas que salen al aceptar— y así el previo no puede prometer un
   * reparto distinto del que hace. Es la misma regla que `HojaImpresa` en §44.4.
   */
  esquemaDeWord?: { nombre: string; renglones: RenglonDeEsquema[] };
  /**
   * Aviso de que una diapositiva quedó grabada (§44.6).
   *
   * El motor guarda en el mazo lo que el archivo guarda —voz y tiempo— y avisa
   * aquí de lo que el archivo NO guarda: **cuántas veces se repitió cada una**.
   * Eso vive en la clase, en su grabadora, porque un `.pptx` no sabe cuántas
   * tomas hiciste, igual que una cámara guarda la foto buena y no las doce
   * movidas. Meterlo en el modelo sería inventarle al archivo un dato que el
   * lunes no existe.
   */
  onGrabada?: (indice: number, segundos: number) => void;
  /** Lo que hay detrás de Archivo. Sin él, la pestaña sigue siendo un tope. */
  backstage?: React.ComponentType<BackstageProps>;
  onSalir?: () => void;
  insignia?: { nombre: string; emoji: string; titulo: string; detalle: string };
  minutos?: number;
}

const ZOOM_MIN = 25;
const ZOOM_MAX = 150;

export default function VentanaDiapositivas({
  cinta,
  guion,
  panelFijo,
  escenario: Escenario,
  escenarioCuando,
  onAvance,
  onTerminado,
  onSalir,
  insignia,
  minutos,
  controles,
  galerias,
  accesorios,
  archivoDeOrigen,
  esquemaDeWord,
  onGrabada,
  backstage: Backstage,
}: VentanaDiapositivasProps) {
  const hueco = useHuecoEnElBody('data-tecnia-diapos');
  const raiz = useRef<HTMLDivElement | null>(null);
  const lienzoCaja = useRef<HTMLDivElement | null>(null);
  const lienzo = useRef<HTMLDivElement | null>(null);

  const [mazo, setMazo] = useState<Mazo>(guion.mazo);
  const [pestana, setPestana] = useState<PestanaPPT>('inicio');
  const [sitio, setSitio] = useState<Sitio | null>(null);
  /**
   * Las cajas seleccionadas ADEMÁS de `sitio`, con Shift.
   *
   * `sitio` sigue siendo la principal —la que enseña sus tiradores y la que
   * leen los comandos de formato— y esto es la compañía. Se guarda aparte y no
   * como una lista única para que las cinco clases anteriores, y los veinte
   * comandos que sólo saben de una caja, no se enteren del cambio (§42.3).
   */
  const [extra, setExtra] = useState<Sitio[]>([]);
  const [editando, setEditando] = useState<Rol | null>(null);
  /**
   * El cuadro de texto que se está escribiendo (§44.2).
   *
   * Va aparte de `editando` y no dentro porque son dos cosas distintas de
   * verdad: `editando` guarda un ROL —una casilla del diseño— y esto guarda el
   * id de un objeto suelto. Meterlas en la misma variable obligaría a repasar
   * los veinte sitios que hoy comparan `editando === rol`, y esa clase de
   * refactor a mitad de una clase es cómo se rompen las seis anteriores.
   * Se apagan siempre juntas: `dejarDeEscribir()`.
   */
  const [escribiendo, setEscribiendo] = useState<string | null>(null);
  /** El giro mientras se arrastra el tirador. Al soltar entra en el mazo. */
  const [giroVivo, setGiroVivo] = useState<{ id: string; x: number; y: number } | null>(null);
  /** Salir de escribir, venga de un marcador o de un cuadro de texto. */
  const dejarDeEscribir = useCallback(() => {
    setEditando(null);
    setEscribiendo(null);
  }, []);
  const [zoom, setZoom] = useState(100);
  const [zoomTocado, setZoomTocado] = useState(false);
  const [galeria, setGaleria] = useState<string | null>(null);
  /**
   * A qué distancia del borde izquierdo se abre la galería.
   *
   * Se MIDE contra el botón que la abrió en vez de escribirse: un desplegable
   * que sale siempre en el mismo sitio deja de parecer que sale de su botón, y
   * en cuanto un grupo cambie de orden estaría mintiendo. Es la misma regla que
   * el domicilio de la guía —lo que se deriva no se escribe—.
   */
  const [galeriaX, setGaleriaX] = useState(10);
  const [repasando, setRepasando] = useState(false);
  /** Con qué botón se abrió la presentación. Lo lee el escenario (§43.1). */
  const [abiertaCon, setAbiertaCon] = useState<string | null>(null);
  /** La pestaña Archivo abierta, si la clase trajo un Backstage. */
  const [enArchivo, setEnArchivo] = useState(false);
  /**
   * El cuadro de «Presentación personalizada» (§43.5), abierto o cerrado.
   *
   * Es un CUADRO y no un desplegable porque en el programa es un cuadro: hay
   * que escribir un nombre y elegir varias, y un menú que se cierra al primer
   * clic no deja hacer ni lo uno ni lo otro. Vive en el motor y no en la clase
   * —al revés que el mapa del quiosco— porque es parte de PowerPoint: cualquier
   * presentación puede tener listas con nombre.
   */
  const [enPersonalizada, setEnPersonalizada] = useState(false);
  const [nombrePers, setNombrePers] = useState('');
  const [elegidasPers, setElegidasPers] = useState<number[]>([]);
  /**
   * En qué VISTA se está mirando el archivo (§44.1).
   *
   * Vive en la ventana y **no en el mazo**, y ésa es la lección de la clase
   * dicha en el sitio donde se guarda el dato: una vista es una manera de
   * mirar, no una propiedad del documento. Si viviera en el mazo, cambiar de
   * vista sería «modificar la presentación» —el logro de tipo `documento` lo
   * daría por hecho, el vigilante de deshechos se enteraría— y el alumno
   * aprendería lo contrario de lo que se le está enseñando.
   *
   * `lectura` no es un tercer aparato: es el repaso que ya existía desde §41,
   * al que esta clase le pone su nombre de PowerPoint y su botón. Por eso se
   * salta las ocultas sin una línea nueva — `primeraVisible` ya lo hacía.
   */
  const [vista, setVista] = useState<'normal' | 'clasificador' | 'notas'>('normal');
  /**
   * En qué patrón de PAPEL se está, si en alguno (§44.4).
   *
   * Aparte de `enPatron` y no dentro, porque son cosas distintas: el patrón de
   * diapositivas **es una diapositiva** —se edita con el mismo lienzo, los
   * mismos marcadores y los mismos comandos— y un patrón de hoja impresa no lo
   * es. Meterlos en la misma variable habría obligado a que `mazoVivo` fingiera
   * una diapositiva que no existe, y eso es lo que convierte un modelo en un
   * montón de casos especiales.
   */
  const [hojaPatron, setHojaPatron] = useState<CualPatronImpreso | null>(null);
  /** El cuadro de «Sección»: el nombre que se está escribiendo, o `null`. */
  const [nombreSeccion, setNombreSeccion] = useState<string | null>(null);
  /**
   * Cuántos pasos de animación se han disparado en la diapositiva que se está
   * proyectando. Es lo que convierte el modo presentación en lo que es de
   * verdad: avanzar no es siempre «siguiente diapositiva» (§42.1).
   */
  const [revelados, setRevelados] = useState(0);
  /**
   * DOS rastros del recorrido de la función, y son dos porque contestan dos
   * preguntas distintas (§43.5).
   *
   * `vistas` — todas las diapositivas que han pasado por pantalla, en orden, se
   * llegara a ellas andando o saltando. Es lo que necesita el botón `Atrás`:
   * «la que estabas» es la anterior de verdad, no la anterior de la lista.
   *
   * `saltos` — sólo aquéllas a las que se llegó **pulsando un vínculo**, con la
   * de partida al principio. Es lo que necesita el gesto de recorrido, y tiene
   * que ser sólo ésas: contando también los pasos con la flecha, avanzar,
   * retroceder y volver a avanzar dibujaría el mismo dibujo que un menú bien
   * usado, y el encargo se cerraría sin haber tocado el menú ni una vez.
   *
   * Los dos viven en `ref` y no en estado porque **no se pintan**: apuntarlos
   * en el estado repintaría la lámina entera en cada gesto sin que nada
   * cambiara en pantalla. Y se declaran aquí arriba, con el resto del modo
   * presentación, porque quien los escribe está repartido por media ventana —
   * la lección de las medidas del ensayo, que costó un `react-hooks` (§43.3).
   */
  const vistas = useRef<number[]>([]);
  const saltos = useRef<number[]>([]);
  const [panel, setPanel] = useState<'animacion' | 'alt' | 'comentarios' | 'reutilizar' | null>(
    null,
  );
  /**
   * «Conservar el formato de origen», la casilla del panel de reutilizar.
   *
   * Llega **apagada**, como en PowerPoint, y ahí está media lección: lo que
   * pasa por omisión es que la diapositiva traída toma la cara de tu archivo, y
   * quien no mira la casilla nunca se entera de que había una decisión.
   */
  const [conSuCara, setConSuCara] = useState(false);
  /** El diálogo de «Diapositivas del esquema», abierto o no (§44.5). */
  const [verElEsquema, setVerElEsquema] = useState(false);
  /**
   * La advertencia de «Quitar la narración», abierta o no (§44.6).
   *
   * Es estado de la VENTANA y no del mazo porque preguntar no cambia el
   * archivo: mientras el cuadro está abierto, las voces siguen ahí.
   */
  const [quitandoVoz, setQuitandoVoz] = useState(false);
  /** El cuadro de «¿desde dónde grabo?», abierto o no (§44.6). */
  const [grabarDesde, setGrabarDesde] = useState(false);
  /** El cuadro de «Tamaño de diapositiva», y qué forma hay elegida en él (§44.3). */
  const [eligiendoForma, setEligiendoForma] = useState<Forma | null>(null);
  /** El cuadro de «Encabezado y pie»: lo que se está escribiendo en él (§44.3). */
  const [enElPie, setEnElPie] = useState<{
    numero: boolean;
    pie: string;
    sinPieEnPortada: boolean;
  } | null>(null);
  /** Lo que se está escribiendo en el panel de comentarios (§43.6). */
  const [borrador, setBorrador] = useState('');
  /**
   * El modo recorte, que cambia lo que hacen los ocho tiradores.
   *
   * Es un modo y no un comando porque en el programa es un modo: se pulsa
   * Recortar, se arrastra, y se sale pulsando otra vez o haciendo clic fuera.
   * Se apaga solo al cambiar de selección — quedarse recortando una imagen que
   * ya no está seleccionada es la clase de estado fantasma que deja al alumno
   * arrastrando sin entender por qué la caja no se mueve.
   */
  const [recortando, setRecortando] = useState(false);
  /** El altavoz que está sonando, para pintarlo vivo. */
  const [sonando, setSonando] = useState<string | null>(null);
  const [sinGuardar, setSinGuardar] = useState(false);

  const [paso, setPaso] = useState(0);
  const [tropiezos, setTropiezos] = useState(0);
  const [fallos, setFallos] = useState(0);
  const [celebrando, setCelebrando] = useState(false);
  /** ¿El alumno tocó el documento mientras se celebraba el encargo anterior? */
  const traidoDeLaCelebracion = useRef(false);
  const pasoAhora = useRef(0);
  const mazoAhora = useRef<Mazo | null>(null);
  const acertarAhora = useRef<(() => void) | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [oculto, setOculto] = useState(false);
  const [portadaAbierta, setPortadaAbierta] = useState(Boolean(guion.portada));
  const [yaEmpezo, setYaEmpezo] = useState(false);
  const [erro, setErro] = useState(false);
  const [aviso, setAviso] = useState<Recado | null>(null);
  const [demostrando, setDemostrando] = useState(false);
  const [rehacer, setRehacer] = useState(false);
  /** Cambia a cada gesto: es lo que hace que el aro se vuelva a medir. */
  const [pulso, setPulso] = useState(0);

  /**
   * Deshacer y rehacer, que aquí son dos pilas de mazos.
   *
   * En Word esto lo hace `prosemirror-history` porque un documento se edita con
   * transacciones. Aquí el modelo es un objeto plano que se sustituye entero, así
   * que la historia es literalmente la lista de los que hubo antes — y eso hace
   * que deshacer un desvío sea exacto, sin agrupamientos que se lleven por
   * delante lo que el alumno acababa de escribir (el `closeHistory` de §37.3).
   */
  const antes = useRef<Mazo[]>([]);
  const despues = useRef<Mazo[]>([]);

  const ultimoFallo = useRef<string | null>(null);
  const relojRef = useRef<number>(0);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pasoActual: PasoDiapos | undefined = guion.pasos[paso];

  /**
   * Si en el encargo vigente manda el escenario o el repaso de siempre.
   *
   * Se resuelve aquí arriba y no junto al resto de los mandos del escenario
   * porque el efecto del teclado lo necesita: declararlo después lo dejaba en
   * zona muerta y la ventana entera reventaba al montar.
   */
  const escenarioAqui = Boolean(Escenario) && (escenarioCuando?.(pasoActual?.id ?? null) ?? true);

  /**
   * Y con cuál se ABRIÓ la presentación que está en marcha ahora mismo.
   *
   * Los dos hacen falta, y la diferencia costó un defecto de los que sólo se
   * ven jugando (§43.1). Mientras `enEscena` se recalculaba en cada encargo, al
   * completar el último encargo del escenario —estando dentro de él— el paso
   * avanzaba, la condición pasaba a falsa y **la escena se sustituía por el
   * repaso negro del programa a media función**, con otro decorado y otros
   * mandos. El alumno estaba presentando en un salón y de repente estaba en
   * otro sitio, sin haber tocado nada.
   *
   * Una función que empieza en el salón termina en el salón. Se decide al
   * abrir y no se vuelve a preguntar hasta que se cierra.
   */
  const [escenaAbierta, setEscenaAbierta] = useState(false);
  const enEscena = repasando ? escenaAbierta : escenarioAqui;

  /*
   * El cuaderno del cronómetro (§43.3), aquí arriba por la misma razón que
   * `escenarioAqui`: quien lo pone en blanco es `pulsar`, doscientas líneas
   * antes de donde se usa, y declararlo abajo lo dejaba en zona muerta.
   */
  const [medidas, setMedidas] = useState<Record<number, number>>({});
  const [reloj, setReloj] = useState(0);
  const entroEn = useRef(0);

  /**
   * La vista Patrón (§43.4), y el truco que la hace caber sin motor nuevo.
   *
   * `Mazo.patron` es una `Diapositiva`, así que estando dentro **la ventana
   * trabaja sobre un mazo que sólo tiene esa diapositiva**: la cinta, la
   * selección, los comandos de formato y el lienzo no se enteran de nada y
   * hacen lo que llevan doce clases haciendo. Al guardar, `cambiar` devuelve el
   * resultado a `patron` en vez de a `diapositivas`.
   *
   * Ésa es la razón de que el patrón sea una diapositiva de verdad y no una
   * tabla de estilos: una tabla habría necesitado su propia interfaz para
   * editarse, o sea un segundo editor de diapositivas dentro del primero.
   */
  const [enPatron, setEnPatron] = useState(false);
  const enElPatron = enPatron && Boolean(mazo.patron);
  // Memorizado, y no por rendimiento: sin esto el objeto es nuevo en cada
  // render y el `useMemo` del contexto de la cinta se recalcularía siempre.
  const mazoVivo: Mazo = useMemo(
    () => (enElPatron ? { ...mazo, diapositivas: [mazo.patron as Diapositiva], activa: 0 } : mazo),
    [enElPatron, mazo],
  );
  const activa = laActiva(mazoVivo);
  /**
   * El de la diapositiva que se está pintando, que **no tiene por qué ser el
   * del archivo**: una traída de otro sitio puede haberse quedado con su cara
   * (§44.5). Todo lo que dibuja el lienzo pregunta por aquí.
   *
   * Memorizado, y no por velocidad: suelta, la llamada hacía que el compilador
   * de React diera por mutable a `activa` a partir de esta línea y renunciara a
   * optimizar el componente entero —nueve errores de `preserve-manual-memoization`
   * a la vez—. Medido probando las tres formas, no deducido.
   */
  const tema = useMemo(() => temaDe(mazoVivo.tema, activa?.tema), [mazoVivo.tema, activa?.tema]);
  /**
   * Lo ancho que es el lienzo de ESTA presentación (§44.3). 960 en 16:9 y 720 en
   * 4:3; el alto no cambia nunca, que es lo que hace PowerPoint.
   */
  const anchoVivo = anchoDe(mazoVivo.forma);

  /**
   * Qué puesto ocupa la diapositiva de turno **en el papel**, y cuántas hojas
   * habrá. `puesto` es −1 cuando está oculta, porque una oculta no ocupa puesto:
   * no sale.
   */
  const enPapel = useMemo(() => {
    const salen = lasQueSeImprimen(mazoVivo);
    return { puesto: salen.indexOf(mazoVivo.activa), cuantas: salen.length };
  }, [mazoVivo]);

  /**
   * ¿Son la misma caja? Dos formas de `Sitio` y una sola pregunta.
   *
   * Aquí arriba, y no junto al arrastre donde se usa: `seleccion` lo necesita y
   * `ctx` necesita a `seleccion` doscientas líneas antes. Es el mismo tropiezo
   * que costó el §41.6 con `enEscena` —una variable declarada después de quien
   * la lee revienta la ventana entera al montar—, y esta vez lo cazaron el
   * compilador y eslint a la vez porque los dos saben leer una zona muerta.
   */
  const mismoSitio = useCallback(
    (a: Sitio | null, b: Sitio | null): boolean =>
      a != null &&
      b != null &&
      ((a.tipo === 'marcador' && b.tipo === 'marcador' && a.rol === b.rol) ||
        (a.tipo === 'libre' && b.tipo === 'libre' && a.id === b.id)),
    [],
  );

  /** Todo lo seleccionado, con la principal la primera. */
  const seleccion: Sitio[] = useMemo(() => (sitio ? [sitio, ...extra] : []), [extra, sitio]);

  /* ── avanzar ─────────────────────────────────────────────────────────── */

  const acertar = useCallback(() => {
    if (temporizador.current) clearTimeout(temporizador.current);
    setCelebrando(true);
    setErro(false);
    setAviso(null);
    temporizador.current = setTimeout(() => {
      setCelebrando(false);
      setFallos(0);
      const siguiente = pasoAhora.current + 1;
      if (siguiente >= guion.pasos.length) {
        setTerminado(true);
        return;
      }
      setPaso(siguiente);

      /*
       * Y lo que el alumno hizo MIENTRAS se celebraba, que hasta ahora se
       * tiraba. La celebración dura segundo y medio y quien ya sabe lo que
       * quiere hacer no espera: si en ese hueco cumple el encargo siguiente
       * —de los que se contestan leyendo la presentación— el trabajo quedaba
       * hecho en la pantalla y el maestro seguía pidiéndolo, sin ningún gesto
       * pendiente que volviera a disparar la comprobación. Salió jugando §44.5.
       *
       * Sólo los logros de tipo `documento`: un gesto no se puede dar por hecho
       * hacia atrás. Y sólo si hubo algo que mirar, porque si no esto sería un
       * verificador permanente que cerraría solo cualquier encargo que naciera
       * cumplido — y eso es un defecto que hay que ver, no uno que haya que
       * tapar.
       */
      if (!traidoDeLaCelebracion.current) return;
      traidoDeLaCelebracion.current = false;
      const l = guion.pasos[siguiente].logro;
      const m = mazoAhora.current;
      if (m && l.tipo === 'documento' && l.comprueba(m)) acertarAhora.current?.();
    }, 1500);
  }, [guion.pasos]);

  /*
   * Los tres espejos que necesita el temporizador de arriba: cuando salta, un
   * segundo y medio después, las variables de su closure ya son de otro render.
   */
  useEffect(() => {
    pasoAhora.current = paso;
    mazoAhora.current = mazo;
    acertarAhora.current = acertar;
  });

  /**
   * El primer encargo ya palomeado que ha dejado de cumplirse, o −1.
   *
   * Es la segunda mitad de «se corrige leyendo el documento»: si el alumno
   * deshace lo que ya tenía hecho, deja de estar hecho. Sin esto se termina la
   * clase con la insignia y la presentación vacía, que es la forma más limpia de
   * enseñar que al programa se le puede engañar (§36.8).
   */
  const primerDeshecho = useCallback(
    (m: Mazo) => {
      const hasta = celebrando ? paso + 1 : paso;
      for (let i = 0; i < Math.min(hasta, guion.pasos.length); i += 1) {
        const l = guion.pasos[i].logro;
        if (l.tipo === 'documento' && !l.comprueba(m)) return i;
      }
      return -1;
    },
    [celebrando, guion.pasos, paso],
  );

  const evaluar = useCallback(
    (m: Mazo, gesto: { control?: string; pestana?: PestanaPPT }) => {
      if (terminado || portadaAbierta || !pasoActual) return;

      const deshecho = primerDeshecho(m);
      if (deshecho >= 0) {
        if (temporizador.current) clearTimeout(temporizador.current);
        setCelebrando(false);
        setFallos(0);
        setErro(false);
        setAviso(null);
        setRehacer(true);
        setPaso(deshecho);
        return;
      }
      /*
       * Durante la celebración no se evalúa —el encargo de turno ya está
       * cumplido y el siguiente todavía no ha empezado— pero **lo que el alumno
       * haga aquí no se tira**: se apunta para mirarlo en cuanto el paso avance.
       *
       * Salió jugando §44.5 y es de las que muerden en silencio. La celebración
       * dura segundo y medio; un alumno que ya sabe lo que quiere hacer no
       * espera. Si en ese hueco convierte el esquema de Word —el encargo
       * siguiente, de tipo `documento`—, el trabajo queda hecho en la pantalla y
       * el maestro sigue pidiéndolo, porque nada volvía a comprobar el mazo. Y
       * como el encargo ya no pide ningún gesto más, el alumno se queda mirando
       * cuatro diapositivas nuevas mientras le dicen que las traiga.
       */
      if (celebrando) {
        traidoDeLaCelebracion.current = true;
        return;
      }

      const l = pasoActual.logro;
      let logrado = false;
      if (l.tipo === 'documento') logrado = l.comprueba(m);
      else if (l.tipo === 'control') logrado = gesto.control === l.control;
      else if (l.tipo === 'pestana') logrado = gesto.pestana === l.pestana;

      if (logrado) {
        setRehacer(false);
        ultimoFallo.current = null;
        acertar();
        return;
      }
      /*
       * Explorar pestañas no cuenta como intento, y pulsar un control sólo
       * cuenta cuando el encargo DECÍA cuál pulsar.
       *
       * Esa segunda mitad se pagó jugando bien, no jugando mal: los encargos de
       * varias acciones —crea la diapositiva, elige el acomodo y escribe el
       * título— no llevan aro a propósito (§27.1), y en ellos cada paso legítimo
       * llegaba aquí sin cumplir todavía el logro y se cobraba como error. Una
       * partida hecha del todo bien acababa con OCHO tropiezos y la peor nota
       * posible. Medido el 11-ago-2026 con la sonda de jugar mal, que esa vez
       * destapó un defecto de jugar bien.
       *
       * Si nadie señala un botón, no existe «botón equivocado».
       *
       * La ayuda no depende de eso y sigue subiendo siempre: `fallos` es lo que
       * hace aparecer la pista, y en un encargo de tres pasos aparece pronto, que
       * es justo cuando sirve.
       *
       * Insistir con el MISMO control no cobra dos veces: seis flechas seguidas
       * en un desplegable son un desplegable manejado con el teclado, no seis
       * errores distintos (§36.9).
       *
       * ── LAS DOS MITADES QUE FALTABAN, PUESTAS EL 15-AGO-2026 ───────────────
       *
       * Salieron jugando `of-ppt-interactiva` de punta a punta: **partida
       * impecable, SEIS tropiezos, nota 64 y una estrella**. Ni un botón
       * equivocado; los seis eran gestos legítimos que todavía no habían
       * terminado el encargo.
       *
       * 1. **Pulsar exactamente el botón al que apunta el aro no puede costar un
       *    tropiezo.** Aquí decía lo contrario —«usar ese mismo con el valor que
       *    no era»— y eso muerde en todo encargo que se resuelva con varias
       *    pulsaciones del MISMO botón: los tres vínculos del menú, los tres
       *    botones de regreso, abrir el cuadro de la personalizada. El primero
       *    no cierra el encargo y se cobraba, aunque fuera literalmente lo que
       *    se pedía. **No es un defecto nuevo ni es de esta ventana**:
       *    `VentanaTextos` lo tenía igual, lo midió hoy mismo el recorrido de la
       *    sala de Word (`n10-portafolio-y-cv`: partida perfecta, 88 y dos
       *    estrellas) y lo curó allí con esta misma línea. Nadie lo trajo aquí.
       *    Dos ventanas del mismo Office contando los errores con dos criterios
       *    distintos son de por sí un defecto: la nota del alumno cambiaba según
       *    en qué programa estuviera trabajando. `VentanaHojas` ya lo hacía bien
       *    —sólo suma tropiezos dentro de `esDesvioYSeAvisa`—, así que esto
       *    iguala las tres.
       *
       * 2. **Un gesto que no es un botón del programa no puede ser un botón
       *    equivocado.** Es propio de esta ventana y no lo tienen las otras dos:
       *    aquí hay encargos que se cumplen con gestos que no existen en ninguna
       *    cinta —saltar por un vínculo presentando, llegar al final de la
       *    función, volver al menú y entrar a otra sección—. El motor ya sabía
       *    distinguirlos: es la misma pregunta (`existe`) con la que decide que
       *    arrancar la presentación no puede ser un desvío cuando el encargo
       *    espera algo que no vive en la cinta. Sin esto, el alumno que salta
       *    por el primer vínculo de una secuencia de tres paga por haber hecho
       *    justo lo que el quiosco pide.
       *
       * La señal puede nombrar varios botones separados por comas
       * (`chrome/ganchos.ts`), así que se parte igual que allí: comparando la
       * cadena entera, un encargo de dos botones volvería a cobrar por el
       * segundo.
       */
      if (gesto.control) {
        setFallos((f) => f + 1);
        const guiado = Boolean(
          pasoActual.senal?.control ?? (pasoActual.logro.tipo === 'control' ? pasoActual.logro.control : null),
        );
        const senalados = (pasoActual.senal?.control ?? '').split(',').map((c) => c.trim());
        const esElQueSeSenala = senalados.includes(gesto.control);
        const esUnBotonDelPrograma = existe(gesto.control, controles);
        if (
          guiado &&
          esUnBotonDelPrograma &&
          !esElQueSeSenala &&
          ultimoFallo.current !== gesto.control
        ) {
          setTropiezos((t) => t + 1);
        }
        ultimoFallo.current = gesto.control;
      }
    },
    [acertar, celebrando, controles, pasoActual, portadaAbierta, primerDeshecho, terminado],
  );

  /**
   * Al avanzar de encargo, mirar si el nuevo **ya está cumplido** por lo que el
   * alumno hizo mientras se celebraba el anterior.
   *
   * Sólo para los logros de tipo `documento`, que son los que se contestan
   * leyendo la presentación. Los de `control` y `pestana` piden un gesto y un
   * gesto no se puede dar por hecho hacia atrás.
   *
   * Y sólo si hubo algo que mirar: sin la marca, esto se convertiría en un
   * verificador permanente que cerraría solo cualquier encargo que naciera
   * cumplido — y un encargo que nace cumplido es un defecto que hay que ver, no
   * uno que haya que tapar.
   */
  /**
   * Cambia la presentación y avisa al maestro. Todo pasa por aquí.
   *
   * `apunta` es lo que hizo el cambio: el id del control, o nada si fue el
   * teclado o el ratón sobre el lienzo. Guardar el mazo anterior en la pila del
   * deshacer también es de aquí, para que no haya un solo camino que cambie el
   * modelo sin dejar rastro.
   */
  const cambiar = useCallback(
    (nuevo: Mazo, apunta?: { control?: string; pestana?: PestanaPPT }) => {
      /*
       * Estando en la vista Patrón lo que llega es el mazo de UNA diapositiva
       * —la del molde—, así que se devuelve a su sitio en vez de sustituir la
       * presentación entera. Si no, formatear el patrón se habría llevado por
       * delante las doce diapositivas (§43.4).
       */
      const real = enElPatron ? { ...mazo, patron: nuevo.diapositivas[0] } : nuevo;
      /*
       * La pila de deshacer se empuja AQUÍ FUERA, no dentro del actualizador de
       * `setMazo`. Dentro, **React en modo estricto —el que Next trae de
       * fábrica— invoca el actualizador dos veces**, así que cada cambio se
       * apilaba por duplicado y **deshacer una sola acción costaba dos Ctrl+Z**.
       *
       * Lo encontró el barrido del 15-ago-2026, que buscaba esta misma forma en
       * los dieciséis armazones nuevos: un `ref` escrito dentro de un
       * actualizador. Era el único caso que quedaba en todo `src`.
       *
       * Leer `mazo` del cierre en vez de `viejo` es lo que ya hacen `deshacer` y
       * `rehacerGesto` justo debajo, y `mazo` está en las dependencias de este
       * `useCallback`, así que no se queda atrás.
       *
       * Ojo al comportamiento: cuando el mazo no cambia, antes se llamaba a
       * `setMazo` y el actualizador devolvía `viejo` —o sea, nada—; ahora
       * sencillamente no se llama. Lo demás (marcar sin guardar, el pulso y la
       * evaluación) sigue corriendo igual que antes, también en ese caso.
       */
      if (real !== mazo) {
        antes.current = [...antes.current.slice(-49), mazo];
        despues.current = [];
        setMazo(real);
      }
      setSinGuardar(true);
      setPulso((p) => p + 1);
      evaluar(real, apunta ?? {});
    },
    [enElPatron, evaluar, mazo],
  );

  const deshacer = useCallback(() => {
    const previo = antes.current.pop();
    if (!previo) return;
    despues.current = [...despues.current, mazo];
    setMazo(previo);
    setPulso((p) => p + 1);
    evaluar(previo, {});
  }, [evaluar, mazo]);

  const rehacerGesto = useCallback(() => {
    const siguiente = despues.current.pop();
    if (!siguiente) return;
    antes.current = [...antes.current, mazo];
    setMazo(siguiente);
    setPulso((p) => p + 1);
    evaluar(siguiente, {});
  }, [evaluar, mazo]);

  /* ── la cinta ────────────────────────────────────────────────────────── */

  const ctx: Contexto = useMemo(
    () => ({ mazo: mazoVivo, sitio, sitios: seleccion }),
    [mazoVivo, seleccion, sitio],
  );

  /** Los que abren una galería en vez de hacer algo de un golpe. */
  const ABREN_GALERIA: Record<string, string> = useMemo(
    () => ({
      'diseno-diapo': 'diseno',
      tema: 'tema',
      color: 'color',
      fondo: 'fondo',
      duracion: 'duracion',
      organizar: 'organizar',
      vinculo: 'vinculo',
      formas: 'formas',
      relleno: 'relleno',
      contorno: 'contorno',
      ...Object.fromEntries(Object.keys(galerias ?? {}).map((id) => [id, id])),
    }),
    [galerias],
  );

  /**
   * Abrir el modo presentación, y **desde dónde** (§44.6).
   *
   * Sale de `pulsar` porque desde §44.6 hay dos maneras de entrar: pulsando el
   * botón, que es lo de siempre, y contestando el cuadro de «¿desde dónde
   * grabo?». Dejarlo dentro de `pulsar` habría obligado a copiar sus quince
   * líneas en el cuadro, y dos arranques distintos son dos arranques que un día
   * dejan de arrancar igual.
   *
   * `desde` es una PETICIÓN, no una orden: si esa diapositiva está oculta se
   * empieza en la primera que sí se presenta a partir de ella. Empezar en una
   * que el público no debe ver nunca sería el defecto de §43.6 al revés.
   */
  const arrancarPresentacion = useCallback(
    (id: string, desde: number, conEvaluacion: boolean) => {
      const donde = Math.min(
        primeraVisible(mazo, desde, 1),
        Math.max(0, mazo.diapositivas.length - 1),
      );
      setMazo((m) => irA(m, donde));
      setRevelados(mazo.diapositivas[donde] ? pasoInicial(mazo.diapositivas[donde]) : 0);
      // Un ensayo empieza con el cuaderno en blanco. Arrastrar las medidas del
      // ensayo anterior es lo que haría que recortar una diapositiva no se
      // notara nunca en el reloj.
      setMedidas({});
      setReloj(0);
      // El recorrido también empieza en blanco. Arrastrar el de la función
      // anterior daría por recorrido un quiosco que en ésta nadie tocó.
      vistas.current = [donde];
      saltos.current = [donde];
      entroEn.current = Date.now();
      setAbiertaCon(id);
      setEscenaAbierta(escenarioAqui);
      setRepasando(true);
      // Volver a entrar para cumplir un encargo que ocurre DENTRO no es un
      // intento fallido: si se evaluara, jugar bien costaría un tropiezo.
      if (conEvaluacion) evaluar(mazo, { control: id });
    },
    [escenarioAqui, evaluar, mazo],
  );

  const pulsar = useCallback(
    (id: string, valor?: string | number) => {
      /*
       * Un botón que el programa pinta apagado no puede castigar ni delatar. Sin
       * esto, poner el dedo en un botón muerto le resuelve el encargo al alumno
       * sin que haya buscado nada, y encima le baja la nota por hacerlo (§36.8).
       */
      if (estaInerte(ctx, id, controles)) {
        // Si quien lo apagó tiene un motivo, lo dice él. El mensaje de siempre
        // —«fíjate en qué tienes seleccionado»— sólo vale cuando lo apagó la
        // selección, y en cualquier otro caso manda al alumno a mirar donde no
        // está el problema (§44.1).
        const razon = razonInerte(ctx, id, controles);
        setAviso({
          titulo:
            razon ??
            (existe(id, controles)
              ? 'Ese botón no se puede usar ahora. Fíjate en qué tienes seleccionado.'
              : 'Ese botón todavía no está en esta clase. Lo verás más adelante.'),
          queHace: QUE_HACE_PPT[id],
        });
        return;
      }
      setAviso(null);

      // Un encargo de MIRAR no cobra por tocar lo que él mismo está señalando.
      if (pasoActual?.logro.tipo === 'confirma' && pasoActual.senal?.control === id) {
        setAviso({ titulo: 'No hace falta pulsarlo: con mirarlo basta.', queHace: QUE_HACE_PPT[id] });
        return;
      }

      // Los desplegables se abren primero y actúan después, con su valor.
      const abre = ABREN_GALERIA[id];
      if (abre && valor === undefined) {
        const cont = raiz.current?.getBoundingClientRect();
        const boton = raiz.current?.querySelector(`[data-control="${id}"]`)?.getBoundingClientRect();
        if (cont && boton) setGaleriaX(Math.max(8, boton.left - cont.left));
        setGaleria((g) => (g === abre ? null : abre));
        return;
      }
      setGaleria(null);

      /*
       * El desvío se atiende, no se castiga (§37.3, pieza 4): el programa nombra
       * lo que pulsó, dice qué hace —lo lee de la misma tabla con la que lo
       * enseña, así que no puede contradecirse— y DESHACE el cambio accidental.
       */
      const { desviado, esperado } = esDesvio(pasoActual, id);
      const nuevo = ejecutar({ ...ctx, valor }, id, controles);

      /*
       * Arrancar la presentación NO puede ser un desvío cuando el encargo
       * vigente espera un gesto que no vive en la cinta.
       *
       * Salió razonando cómo se juega mal la clase 4: el último encargo se
       * cumple revelando las cuatro partes del volcán —un gesto que sólo existe
       * dentro del modo presentación—, y si el alumno se sale con Escape, cada
       * intento de volver a entrar se contestaba con «ese botón no era» y no
       * abría nada. Quedaba encerrado fuera de su propio encargo, sin más salida
       * que reiniciar. La clase 3 tenía exactamente el mismo agujero con el
       * ritmo del ensayo, y llevaba ahí desde que se construyó.
       *
       * La condición se DERIVA y no se escribe: si el control esperado no está
       * en la tabla de comandos, no es un botón del programa, así que sólo puede
       * venir del sitio donde la presentación ocurre.
       */
      const encerrado =
        ARRANCAN_LA_PRESENTACION.has(id) && Boolean(esperado) && !existe(esperado!, controles);

      if (desviado && !encerrado) {
        const d = explicarDesvio(cinta, id, esperado, QUE_HACE_PPT, DESPLEGABLES_PPT);
        setAviso({ titulo: d.titulo, queHace: d.queHace, aDonde: d.aDonde });
        // No se aplica: en un mazo «deshacer» es no haberlo hecho, y así el
        // alumno nunca ve su presentación cambiar por un botón equivocado.
        setPulso((p) => p + 1);
        evaluar(mazo, { control: id });
        return;
      }

      /*
       * Arrancar la presentación, después del desvío y no antes: si el encargo
       * pedía otra cosa, lo que toca es que el programa lo nombre y lo explique,
       * no lanzarle al alumno la pantalla completa encima del encargo que estaba
       * leyendo. Empieza SIEMPRE en la primera —un ensayo que arranca por la
       * tercera no es un ensayo—.
       */
      if (ARRANCAN_LA_PRESENTACION.has(id)) {
        /*
         * Grabar PREGUNTA desde dónde, y es lo que hace PowerPoint: su botón de
         * grabar abre «Desde el principio» o «Desde la diapositiva actual». No
         * es un adorno del simulador — es la única manera de repetir una sola
         * diapositiva sin volver a contarlas todas, que es la mitad de §44.6.
         *
         * Los otros tres arrancan derechos: un ensayo que empieza por la
         * tercera no es un ensayo, y una función tampoco.
         */
        if (id === 'grabar' && mazo.diapositivas.length > 0) {
          setGrabarDesde(true);
          if (!encerrado) evaluar(mazo, { control: id });
          return;
        }
        // «Desde el principio» es desde la primera QUE SE PRESENTA: si la
        // primera está oculta, empezar en ella sería empezar en una que el
        // público no debe ver nunca (§43.6).
        arrancarPresentacion(id, 0, !encerrado);
        return;
      }

      // Un panel de tareas se abre y se cierra con el mismo botón, igual que en
      // el programa: pulsarlo dos veces no deja dos paneles ni ninguno a medias.
      const abrePanel = ABREN_PANEL[id];
      if (abrePanel) {
        setPanel((p) => (p === abrePanel ? null : abrePanel));
        evaluar(mazo, { control: id });
        return;
      }

      /*
       * «Tamaño de diapositiva» (§44.3). Abre el cuadro con la forma que hay
       * ahora ya marcada —no en blanco—, porque la primera pregunta del alumno
       * delante de ese cuadro es «¿y cómo está ahora?».
       */
      /*
       * «Encabezado y pie» (§44.3). Abre con lo que la presentación tiene ahora,
       * no en blanco: es un cuadro de ajustes, no un formulario, y llegar y ver
       * vacío lo que ya está puesto invita a volver a escribirlo.
       */
      if (id === 'pie') {
        setEnElPie({
          numero: Boolean(mazo.numeroDiapositiva),
          pie: mazo.pie ?? '',
          sinPieEnPortada: Boolean(mazo.sinPieEnPortada),
        });
        evaluar(mazo, { control: id });
        return;
      }

      if (id === 'tamano-diapo') {
        setEligiendoForma(mazo.forma ?? '16-9');
        evaluar(mazo, { control: id });
        return;
      }

      /*
       * «Quitar la narración» (§44.6): pregunta primero, siempre.
       *
       * Va aquí y no en la tabla de comandos por lo mismo que el cuadro de
       * sección — abre una pantalla del programa y todavía no cambia nada—,
       * pero por un motivo más serio que los otros: es el único botón de esta
       * cinta que **borra trabajo del alumno**. Sin la pregunta delante, un
       * clic curioso se lleva diez minutos de haberle hablado a la pantalla, y
       * el programa no tiene manera de devolvérselos.
       */
      if (id === 'quitar-narracion') {
        setQuitandoVoz(true);
        evaluar(mazo, { control: id });
        return;
      }

      // El esquema de Word se MIRA antes de convertir, y por eso es un diálogo y
      // no un comando: lo que se enseña es que el documento ya trae las
      // diapositivas dentro, y eso hay que verlo antes de aceptar.
      if (id === 'esquema-word') {
        setVerElEsquema(true);
        evaluar(mazo, { control: id });
        return;
      }

      // Recortar es un modo, no un cambio: no pasa por `cambiar` porque todavía
      // no ha cambiado nada. Lo que cambia es lo que hacen los tiradores.
      if (id === 'recortar') {
        setRecortando((r) => !r);
        evaluar(mazo, { control: id });
        return;
      }

      /*
       * Entrar y salir de la vista Patrón (§43.4). Es la ventana la que cambia
       * de cara, no el mazo, así que va aquí y no en la tabla de comandos —la
       * misma familia que el repaso y los paneles—. Al entrar se suelta la
       * selección: lo que estuviera elegido es una caja de OTRA diapositiva, y
       * dejarla apuntada hacía que el primer botón de formato escribiera en un
       * sitio que ya no se ve.
       */
      /*
       * El cuadro de la presentación personalizada (§43.5). Misma familia: abre
       * una pantalla del programa y todavía no cambia nada. Lo que cambia el
       * mazo es aceptarlo, y eso pasa por `cambiar` como cualquier otro gesto.
       */
      if (id === 'personalizada') {
        setEnPersonalizada(true);
        setNombrePers('');
        setElegidasPers([]);
        evaluar(mazo, { control: id });
        return;
      }

      /*
       * El cuadro de «Sección» (§44.1). Misma familia que el de arriba: abre
       * una pantalla del programa y no cambia nada hasta que se acepta. El
       * nombre arranca vacío y no con «Sección sin título» a propósito — el
       * valor de una sección es su nombre, y un nombre puesto por omisión es lo
       * que hace que veinte diapositivas queden partidas en tramos que no
       * dicen nada.
       */
      if (id === 'seccion') {
        setNombreSeccion('');
        evaluar(mazo, { control: id });
        return;
      }

      /*
       * La vista de LECTURA (§44.1). Es el repaso que existe desde §41 con su
       * nombre de PowerPoint: pasa la presentación **dentro de la ventana**, sin
       * ocupar la pantalla y sin abrir el escenario de la clase — por eso no
       * está en `ARRANCAN_LA_PRESENTACION`, que es para las que sí salen fuera.
       *
       * Empieza en la primera QUE SE PRESENTA, igual que «Desde el principio»,
       * y ahí es donde esta clase cobra lo suyo: la diapositiva que el alumno
       * acaba de ocultar no aparece, y no hubo que escribir una línea para eso.
       */
      if (id === 'vista-lectura') {
        const primera = Math.min(
          primeraVisible(mazo, 0, 1),
          Math.max(0, mazo.diapositivas.length - 1),
        );
        setVista('normal');
        setMazo((m) => irA(m, primera));
        setRevelados(mazo.diapositivas[primera] ? pasoInicial(mazo.diapositivas[primera]) : 0);
        setRepasando(true);
        evaluar(mazo, { control: id });
        return;
      }

      /*
       * Las vistas y los tres patrones, todos por la misma puerta (§44.4).
       *
       * Ninguno cambia el documento y todos cambian **de qué se está mirando**,
       * así que salir de uno es entrar en otro: pulsar «Normal» sale del patrón
       * de documentos igual que sale del de diapositivas, sin que haya que
       * escribir esa combinación en ningún sitio.
       */
      const VISTAS: Record<string, { patron: boolean; hoja: CualPatronImpreso | null; vista: typeof vista }> = {
        patron: { patron: true, hoja: null, vista: 'normal' },
        'patron-documentos': { patron: false, hoja: 'documentos', vista: 'normal' },
        'patron-notas': { patron: false, hoja: 'notas', vista: 'normal' },
        'vista-normal': { patron: false, hoja: null, vista: 'normal' },
        'vista-clasificador': { patron: false, hoja: null, vista: 'clasificador' },
        'vista-notas': { patron: false, hoja: null, vista: 'notas' },
      };
      const aDonde = VISTAS[id];
      if (aDonde) {
        setEnPatron(aDonde.patron);
        setHojaPatron(aDonde.hoja);
        setVista(aDonde.vista);
        setSitio(null);
        setExtra([]);
        dejarDeEscribir();
        evaluar(mazo, { control: id });
        return;
      }

      // Lo que se acaba de insertar queda seleccionado, como en cualquier
      // programa: enseña sus tiradores y la contextual sale sola.
      const nacido = reciennacido(mazo, nuevo);
      if (nacido) {
        setSitio({ tipo: 'libre', id: nacido });
        setExtra([]);
      }
      cambiar(nuevo, { control: id });
    },
    [
      ABREN_GALERIA,
      arrancarPresentacion,
      cambiar,
      cinta,
      controles,
      ctx,
      dejarDeEscribir,
      evaluar,
      mazo,
      pasoActual,
    ],
  );

  const irAPestana = useCallback(
    (p: PestanaPPT) => {
      setPestana(p);
      setGaleria(null);
      evaluar(mazo, { pestana: p });
    },
    [evaluar, mazo],
  );

  /* ── el lienzo: arrastrar y redimensionar ────────────────────────────── */

  interface Gesto {
    sitio: Sitio;
    tirador: Tirador | null;
    x0: number;
    y0: number;
    dx: number;
    dy: number;
  }
  const [gesto, setGesto] = useState<Gesto | null>(null);

  /*
   * La escala se DEDUCE del DOM, no se lee del estado (§39, copiado a su vez de
   * `paginador.ts:180-184`). `zoom/100` es lo que pedimos; lo que el navegador
   * aplicó de verdad es otra cosa en cuanto un antepasado tenga un `transform`,
   * y el puntero llega en píxeles de pantalla. Leer el estado aquí es el defecto
   * clásico, y el que hizo que la tanda del zoom cantara dos discrepancias sobre
   * un modelo que estaba bien.
   */
  const escalaViva = useCallback(() => {
    const el = lienzo.current;
    if (!el) return zoom / 100;
    const caja = el.getBoundingClientRect();
    return el.offsetWidth ? caja.width / el.offsetWidth : zoom / 100;
  }, [zoom]);

  const casillaDeSitio = useCallback(
    (d: Diapositiva | null, s: Sitio): Casilla | null =>
      !d
        ? null
        : s.tipo === 'marcador'
          ? casillaDe(d, s.rol, mazoVivo.forma)
          : (d.libres.find((l) => l.id === s.id)?.casilla ?? null),
    // La forma sí entra en las dependencias, aunque esta función vivía con la
    // lista vacía a propósito: un marcador ocupa una casilla distinta en 4:3, y
    // una función congelada devolvería la de 16:9 en cuanto el alumno cambie de
    // pantalla —y con ella arrastraría desde donde la caja ya no está—. Cambia
    // de identidad una vez por clase, que es cuando se cambia el tamaño.
    [mazoVivo.forma],
  );

  const alBajar = useCallback(
    (e: React.PointerEvent, s: Sitio, tirador: Tirador | null) => {
      if (repasando) return;
      e.stopPropagation();

      /*
       * Shift + clic añade y quita de la selección, como en el programa. No
       * empieza un arrastre: quien está eligiendo tres cajas para alinearlas no
       * quiere moverlas de sitio a la vez, y un arrastre accidental de dos
       * píxeles le desharía lo que acaba de alinear.
       */
      if (e.shiftKey && !tirador) {
        setExtra((antes) =>
          mismoSitio(s, sitio)
            ? antes
            : antes.some((x) => mismoSitio(x, s))
              ? antes.filter((x) => !mismoSitio(x, s))
              : [...antes, s],
        );
        if (!sitio) setSitio(s);
        dejarDeEscribir();
        return;
      }
      // Capturar es un lujo —hace que el arrastre siga funcionando aunque el
      // puntero se salga de la caja— pero NO puede ser un requisito: si falla,
      // seleccionar la caja tiene que ocurrir igual. Sin este `try`, un puntero
      // raro deja al alumno sin poder seleccionar nada y, con ello, con medio
      // grupo Fuente apagado para siempre.
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* seguimos sin captura */
      }
      /*
       * El modo recorte se apaga al cambiar de objeto, y SÓLO al cambiar: si se
       * apagara con cualquier `setSitio`, agarrar un tirador de recorte —que
       * vuelve a seleccionar la misma caja— saldría del modo antes de arrastrar
       * y recortar sería imposible.
       */
      const mismo = mismoSitio(s, sitio);
      if (!mismo) {
        setRecortando(false);
        // Un clic sin Shift deshace la selección múltiple, como en cualquier
        // programa. Volver a pinchar la misma caja no la deshace: si no, agarrar
        // un tirador de la principal soltaría a sus compañeras.
        if (!extra.some((x) => mismoSitio(x, s))) setExtra([]);
      }
      setSitio(s);
      dejarDeEscribir();
      setGesto({ sitio: s, tirador, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0 });
    },
    [dejarDeEscribir, extra, mismoSitio, repasando, sitio],
  );

  const alMover = useCallback(
    (e: React.PointerEvent) => {
      if (!gesto) return;
      const k = escalaViva();
      setGesto({ ...gesto, dx: (e.clientX - gesto.x0) / k, dy: (e.clientY - gesto.y0) / k });
    },
    [escalaViva, gesto],
  );

  /** El objeto suelto que hay seleccionado, si es que lo hay. */
  const libreSel = useMemo(
    () => (sitio?.tipo === 'libre' ? (activa?.libres.find((l) => l.id === sitio.id) ?? null) : null),
    [activa, sitio],
  );

  /** A dónde lleva ya lo seleccionado, para hundir esa opción en la galería. */
  const destinoPuesto = libreSel?.destino;

  const alSoltar = useCallback(() => {
    if (!gesto) return;
    const actual = casillaDeSitio(activa, gesto.sitio);
    // Un clic sin arrastre no es un gesto: no toca el modelo ni ensucia la pila
    // del deshacer. Sin esto, seleccionar una caja contaba como cambio.
    if (actual && (Math.abs(gesto.dx) > 2 || Math.abs(gesto.dy) > 2)) {
      /*
       * Tres gestos distintos sobre los mismos ocho tiradores, y el que manda
       * es el modo: recortando se recorta, si no se redimensiona, y sin tirador
       * se mueve. Aquí entra un continuo y sale un entero, que es la hipótesis
       * del §39 y sigue en pie con el recorte encima.
       */
      const enRecorte =
        recortando && gesto.tirador && gesto.sitio.tipo === 'libre' && libreSel?.clase === 'imagen';
      if (enRecorte && libreSel) {
        const r = recortarPorPixeles(actual, recorteDe(libreSel), gesto.tirador!, gesto.dx, gesto.dy);
        cambiar(aplicarRecorte(mazoVivo, libreSel.id, r.casilla, r.recorte));
      } else {
        const nueva = gesto.tirador
          ? redimensionarPorPixeles(actual, gesto.tirador, gesto.dx, gesto.dy, libreSel?.proporcion)
          : moverPorPixeles(actual, gesto.dx, gesto.dy);
        cambiar(recolocar(mazoVivo, gesto.sitio, nueva));
      }
    }
    setGesto(null);
  }, [activa, cambiar, casillaDeSitio, gesto, libreSel, mazoVivo, recortando]);

  /** El teclado tiene que poder hacer lo mismo que el ratón. */
  const alTeclearLienzo = useCallback(
    (e: React.KeyboardEvent) => {
      // `escribiendo` cuenta igual que `editando`: sin esto, Suprimir dentro de
      // un cuadro de texto no borraría una letra — borraría el cuadro entero.
      if (!sitio || editando || escribiendo) return;
      /*
       * Suprimir borra lo que el alumno metió, como en cualquier programa.
       * Sólo los objetos sueltos: un marcador es del diseño y se vacía, no se
       * quita — borrarlo dejaría una diapositiva con un hueco que ningún botón
       * sabe devolver.
       */
      if ((e.key === 'Delete' || e.key === 'Backspace') && sitio.tipo === 'libre') {
        e.preventDefault();
        cambiar(quitarLibre(mazoVivo, sitio.id));
        setSitio(null);
        setRecortando(false);
        return;
      }
      const paso: Record<string, [number, number]> = {
        ArrowLeft: [-COL_PX, 0],
        ArrowRight: [COL_PX, 0],
        ArrowUp: [0, -FILA_PX],
        ArrowDown: [0, FILA_PX],
      };
      const d = paso[e.key];
      if (!d) return;
      e.preventDefault();
      const actual = casillaDeSitio(activa, sitio);
      if (!actual) return;
      cambiar(
        recolocar(
          mazoVivo,
          sitio,
          e.shiftKey
            ? redimensionarPorPixeles(actual, 'se', d[0], d[1])
            : moverPorPixeles(actual, d[0], d[1]),
        ),
      );
    },
    [activa, cambiar, casillaDeSitio, editando, escribiendo, mazoVivo, sitio],
  );

  /* ── la tira de miniaturas: reordenar arrastrando ────────────────────── */

  const [arrastrada, setArrastrada] = useState<number | null>(null);
  const [encima, setEncima] = useState<number | null>(null);
  const tira = useRef<HTMLDivElement | null>(null);
  /** El Clasificador, que reordena con el mismo arrastre que la tira (§44.1). */
  const rejilla = useRef<HTMLDivElement | null>(null);

  /*
   * Con eventos de puntero y NO con el arrastre nativo de HTML.
   *
   * `draggable` + `dragstart`/`drop` parece lo obvio y es la trampa: no dispara
   * con puntero táctil en tabletas, arrastra un fantasma del navegador que no se
   * puede vestir, y —lo que lo destapó— es invisible para una sonda que mueve el
   * ratón de verdad, así que la mecánica central de la fase 3 no se podía medir.
   * Los eventos de puntero son los mismos que ya mueven las cajas del lienzo:
   * un mecanismo menos que mantener y uno que sí se puede jugar mal a propósito.
   */
  /**
   * Sobre qué diapositiva se está soltando, en la tira **o en el Clasificador**.
   *
   * Pide las dos coordenadas desde §44.1 porque la rejilla tiene filas: en una
   * columna basta con saber si el puntero ya pasó el borde de abajo, pero en
   * una rejilla eso pondría todas las de una fila en el mismo sitio. La regla
   * es la misma leída en dos pasos — primero la fila, y dentro de la fila, la
   * columna—, y por eso sirve para las dos vistas sin partirse en dos funciones.
   *
   * Y devuelve el `data-diapo` en vez de la posición del bucle: con las
   * etiquetas de sección de por medio, dar por hecho que el tercer elemento
   * dibujado es la tercera diapositiva es la clase de suposición que aguanta
   * hasta que alguien pliega un tramo.
   */
  const indiceBajoElPuntero = useCallback(
    (x: number, y: number): number | null => {
      const cont = vista === 'clasificador' ? rejilla.current : tira.current;
      if (!cont) return null;
      const minis = Array.from(cont.querySelectorAll<HTMLElement>('[data-diapo]'));
      for (const el of minis) {
        const r = el.getBoundingClientRect();
        if (y < r.bottom && (y < r.top || x < r.right)) return Number(el.dataset.diapo);
      }
      const ultima = minis[minis.length - 1];
      return ultima ? Number(ultima.dataset.diapo) : null;
    },
    [vista],
  );

  const alBajarEnLaTira = useCallback((e: React.PointerEvent, i: number) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* seguimos sin captura */
    }
    setArrastrada(i);
    setEncima(i);
  }, []);

  const alMoverEnLaTira = useCallback(
    (e: React.PointerEvent) => {
      if (arrastrada === null) return;
      setEncima(indiceBajoElPuntero(e.clientX, e.clientY));
    },
    [arrastrada, indiceBajoElPuntero],
  );

  /**
   * Girar el modelo 3D arrastrando su tirador (§44.2).
   *
   * Se escribe aquí y no en la escena porque **el giro es del documento**: lo
   * guarda la diapositiva y sobrevive a cerrar la presentación. Se captura el
   * puntero para que salirse de la caja no corte el gesto a la mitad, que es lo
   * que hacía que a veces el modelo se quedara a medio girar sin que el alumno
   * entendiera por qué.
   *
   * ── EL DEFECTO QUE ESTO CORRIGE (§44.2, cazado 15-ago-2026) ─────────────────
   *
   * Los tres gestos van por `addEventListener`, sueltos del lienzo — y sólo el
   * `pointerdown` cortaba la propagación. `pointermove` y `pointerup`, no: un
   * evento nativo sigue subiendo por el DOM aunque nazca en un `addEventListener`
   * de más adentro, y React lo recoge igual en la raíz. Así que cada arrastre del
   * tirador **también** llegaba a `onPointerMove`/`onPointerUp` del `.dpw-lienzo`
   * — los mismos que mueven cualquier caja — y ahí encontraba un `gesto` que
   * llevaba armado desde el último clic de selección (`alBajar` lo pone en
   * cualquier clic, arrastre o no, y sólo `alSoltar` lo apaga; un clic de
   * selección sin arrastre nunca pasa por `alSoltar` del lienzo). Con dos
   * `cambiar()` disparados por el MISMO gesto —éste, que gira, y el fantasma del
   * lienzo, que interpretaba el mismo desplazamiento de puntero como «mover la
   * caja»— el segundo ganaba: `recolocar()` parte de `mazoVivo`, una foto de
   * ANTES de girar, así que el mazo que quedaba puesto era ese, con el giro
   * borrado. El encargo se daba por bueno un instante —el primer `cambiar()` sí
   * vio el giro— y el alumno avanzaba; pero el giro real había vuelto a 0, y en
   * cuanto el guion volvía a mirar los encargos ya hechos (`primerDeshecho`, al
   * pulsar el siguiente botón de verdad) lo encontraba deshecho y devolvía al
   * alumno aquí. Por eso `of-ppt-formas-y-cajas` se atascaba en «El que tiene
   * lados» encadenada detrás de los seis encargos anteriores —cualquiera de
   * ellos deja un `gesto` de selección armado— y por eso sola, sin nada antes,
   * no se veía: sin un clic de selección previo no había nada que el lienzo
   * confundiera con un arrastre.
   *
   * La corrección es aislar el gesto de girar del todo, que es lo que el
   * comentario de arriba ya prometía y no cumplía entero: cortar la propagación
   * también en `mover` y en `soltar`, no sólo al empezar.
   */
  const empezarGiro = useCallback(
    (e: React.PointerEvent, l: Libre) => {
      e.preventDefault();
      e.stopPropagation();
      const el = e.currentTarget as HTMLElement;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* seguimos sin captura */
      }
      const x0 = e.clientX;
      const y0 = e.clientY;
      const de = { x: l.giro?.x ?? 0, y: l.giro?.y ?? 0 };
      const base = mazoVivo;
      let ultimo = de;
      /*
       * Mientras se arrastra, el giro vive en `giroVivo` y **no en el mazo**, y
       * al soltar entra por `cambiar` de una vez. Es la misma regla que el
       * arrastre de una caja, y no es manía de simetría: escribiendo en el mazo
       * a cada píxel el maestro no se enteraba de nada —el modelo acababa
       * girado 70° y el encargo seguía abierto— y encima Deshacer volvía al
       * penúltimo píxel del arrastre en vez de a antes de girar. Medido jugando
       * el 12-ago-2026: con el teclado el encargo se cerraba y con el ratón no.
       *
       * Medio grado por píxel: girar media vuelta cuesta un arrastre de pantalla
       * entera, que es lo que hace que se pueda parar donde uno quiere.
       */
      const mover = (ev: PointerEvent) => {
        ev.stopPropagation();
        ultimo = { x: de.x - (ev.clientY - y0) * 0.5, y: de.y + (ev.clientX - x0) * 0.5 };
        setGiroVivo({ id: l.id, ...ultimo });
      };
      const soltar = (ev: PointerEvent) => {
        ev.stopPropagation();
        el.removeEventListener('pointermove', mover);
        el.removeEventListener('pointerup', soltar);
        el.removeEventListener('pointercancel', soltar);
        setGiroVivo(null);
        if (ultimo.x !== de.x || ultimo.y !== de.y) cambiar(girar(base, l.id, ultimo));
      };
      el.addEventListener('pointermove', mover);
      el.addEventListener('pointerup', soltar);
      el.addEventListener('pointercancel', soltar);
    },
    [cambiar, mazoVivo],
  );

  const alSoltarEnLaTira = useCallback(() => {
    if (arrastrada === null) return;
    const hasta = encima;
    setArrastrada(null);
    setEncima(null);
    if (hasta === null || hasta === arrastrada) return;
    cambiar(mover(mazo, arrastrada, hasta));
  }, [arrastrada, cambiar, encima, mazo]);

  /**
   * Una miniatura de la tira, con todo lo que sabe hacer: seleccionar,
   * arrastrar para reordenar, Ctrl+flecha, el globo de comentarios y el aviso
   * de oculta.
   *
   * Se sacó a una función el 12-ago-2026 (§44.1) porque la tira dejó de ser una
   * lista plana: ahora se recorre por tramos y las miniaturas se pintan dentro
   * de cada sección. Copiarla en dos sitios habría dejado un segundo sitio
   * donde arreglar los defectos — que es exactamente lo que pasó con el salto
   * de las ocultas en §43.6 y por lo que salió `primeraVisible`.
   */
  const pintarMini = (d: Diapositiva, i: number) => (
    <div
      key={i}
      role="option"
      aria-selected={i === mazoVivo.activa}
      tabIndex={0}
      data-diapo={i}
      className={`dpw-mini${i === mazoVivo.activa ? ' es-activa' : ''}${
        encima === i && arrastrada !== null && arrastrada !== i ? ' es-destino' : ''
      }${arrastrada === i ? ' es-viajando' : ''}${d.oculta ? ' es-oculta' : ''}`}
      // En la vista Patrón la tira enseña una sola cosa y no se reordena: un
      // patrón no tiene «el de antes» ni «el de después».
      onPointerDown={(e) => !enElPatron && alBajarEnLaTira(e, i)}
      // Cinturón y tirantes con el `user-select: none` del CSS: si algún día
      // alguien pinta texto seleccionable dentro de una miniatura, el arrastre
      // nativo del navegador no puede volver a comerse al nuestro sin que nadie
      // se entere.
      onDragStart={(e) => e.preventDefault()}
      onClick={() => {
        setMazo((m) => irA(m, i));
        setSitio(null);
        setExtra([]);
        dejarDeEscribir();
        setRecortando(false);
        setPulso((p) => p + 1);
      }}
      onKeyDown={(e) => {
        // Ctrl + flecha mueve la diapositiva, que es el atajo del programa de
        // verdad. Sin él, reordenar sólo se puede con el ratón y la fase 3
        // queda cerrada para quien usa el teclado.
        if (!enElPatron && e.ctrlKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
          e.preventDefault();
          cambiar(mover(mazo, i, i + (e.key === 'ArrowUp' ? -1 : 1)));
          return;
        }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setMazo((m) => irA(m, i));
        }
      }}
    >
      <span className="dpw-mini-num">{enElPatron ? '✳' : i + 1}</span>
      {/*
        En la tira, cajas grises; en el Clasificador, **la diapositiva de
        verdad**. No es un capricho de acabado: la tira se recorre pulsando una
        por una y las cajas bastan para ubicarse, pero el Clasificador existe
        para LEER dieciocho de un vistazo y dieciocho cajas grises son
        dieciocho rectángulos idénticos. Salió jugando: la clase pedía «fíjate
        en cuál sobra» delante de una rejilla donde no se podía fijar nadie.

        La lámina es la misma que pinta el lienzo y la que proyecta el
        auditorio, escalada por su contenedor. Un dibujo aparte para el
        Clasificador sería un tercer sitio donde arreglar cada defecto.
      */}
      {vista === 'clasificador' && !enElPatron ? (
        <span className="dpw-clas-lamina">
          <Lamina mazo={mazoVivo} diapositiva={d} numero={pieDe(mazo, i).numero} pie={pieDe(mazo, i).texto} />
        </span>
      ) : (
        // La cara de ESTA, no la del archivo: en la tira es donde se ve de un
        // vistazo cuál vino de fuera con su color puesto (§44.5).
        <Miniatura
          d={d}
          fondo={d.fondo ?? temaDe(mazoVivo.tema, d.tema).fondo}
          color={temaDe(mazoVivo.tema, d.tema).texto}
          forma={mazoVivo.forma}
        />
      )}
      {/*
        El globo de comentarios en la miniatura, como en el programa: es lo que
        hace que una revisión se pueda LEER de un vistazo sin ir diapositiva por
        diapositiva abriendo el panel. Amarillo cuando queda algo pendiente,
        apagado cuando todo está resuelto (§43.6).
      */}
      {comentariosDe(d).length > 0 && (
        <i
          className={`dpw-mini-globo${
            comentariosDe(d).every((c) => c.resuelto) ? ' es-resuelto' : ''
          }`}
          data-mini-globo={i}
          title={`${comentariosDe(d).length} comentario${comentariosDe(d).length === 1 ? '' : 's'}`}
        >
          💬{comentariosDe(d).length}
        </i>
      )}
      {/*
        El altavoz de la diapositiva grabada (§44.6). En la esquina y en la
        tira, como en PowerPoint, porque la pregunta que se hace grabando es
        «¿cuáles llevan voz ya?» y ésa se contesta mirando la tira entera, no
        entrando a cada una.
      */}
      {d.narrada && (
        <i className="dpw-mini-voz" data-mini-voz={i} title="Lleva narración grabada">
          🔊
        </i>
      )}
      <span className="dpw-mini-nombre">
        {enElPatron ? 'El patrón' : d.oculta ? 'Oculta · no se presenta' : nombreDelDiseno(d.diseno)}
      </span>
      {/*
        El tiempo debajo de la miniatura, y **sólo en el Clasificador**: es
        donde PowerPoint lo enseña y es para lo que sirve esa vista — leer de un
        vistazo cuánto dura cada una sin abrir ninguna. En la tira no cabe y no
        hace falta; ahí se trabaja de una en una.

        Entró con §44.6 y no antes porque hasta §44.6 no había nada que
        comparar: es lo que permite ver que la grabación pisó los intervalos del
        ensayo sin que nadie tenga que decírselo al alumno.
      */}
      {vista === 'clasificador' && !enElPatron && typeof d.intervalo === 'number' && (
        <span className="dpw-clas-tiempo" data-mini-tiempo={i}>
          {d.narrada && <i aria-hidden="true">🔊</i>}
          {RELOJ(d.intervalo)}
        </span>
      )}
    </div>
  );

  /* ── que el lienzo quepa ─────────────────────────────────────────────── */

  /*
   * Igual que la hoja de Tecnia Textos: mientras el alumno no toque el zoom, el
   * lienzo se ajusta solo al hueco que hay. `hueco` está en las dependencias
   * porque la ventana vive en un portal que tarda un cuadro en existir; sin él
   * este efecto corre con el contenedor sin montar, mide cero y no vuelve a
   * mirar nunca — que es exactamente lo que le pasó al aro en §36.5 bis.
   */
  useEffect(() => {
    if (zoomTocado) return undefined;
    const ajustar = () => {
      const el = lienzoCaja.current;
      if (!el) return;
      const cabe = Math.floor(
        Math.min((el.clientWidth - 48) / anchoVivo, (el.clientHeight - 48) / LIENZO_ALTO) * 20,
      ) * 5;
      if (cabe > 0) setZoom(Math.max(ZOOM_MIN, Math.min(100, cabe)));
    };
    ajustar();
    window.addEventListener('resize', ajustar);
    return () => window.removeEventListener('resize', ajustar);
    // `panel` está en las dependencias porque abrir el panel de animación
    // ESTRECHA la columna del lienzo sin que la ventana cambie de tamaño: sin
    // él, la diapositiva se quedaba al zoom de antes y salía recortada por la
    // derecha justo cuando el alumno mira los números de las animaciones.
    // Y `anchoVivo`, desde §44.3: pasar a 4:3 estrecha el lienzo 240 píxeles sin
    // que la ventana cambie de tamaño, así que sin él la diapositiva se quedaba
    // al zoom de antes y sobraba hueco a los lados justo en el momento en que
    // la clase pide mirar la forma nueva.
  }, [anchoVivo, hueco, panel, zoomTocado]);

  const cerrarPortada = useCallback(() => {
    setPortadaAbierta(false);
    if (!yaEmpezo) {
      relojRef.current = Date.now();
      setYaEmpezo(true);
    }
  }, [yaEmpezo]);

  /* ── el aro ──────────────────────────────────────────────────────────── */

  /**
   * A qué apunta el aro, en el DOM vivo.
   *
   * La novedad frente a Word es que aquí una señal puede apuntar **al lienzo**:
   * `senal.control` que empiece por `marcador:` señala un marcador de posición,
   * y `tira` señala la tira de miniaturas. Lo pidió el §27.1 —«el aro señala el
   * botón exacto de la cinta y también un marcador vacío del lienzo»— y no costó
   * tocar `useCajaDelObjetivo`: es un selector como cualquier otro. Eso se midió
   * en la prueba del §39 antes de comprometer el plan.
   */
  const selector = useMemo(() => {
    if (terminado || celebrando || portadaAbierta || repasando || !pasoActual?.senal) return null;
    const s = pasoActual.senal;
    if (s.control?.startsWith('marcador:')) return `[data-marcador="${s.control.slice(9)}"]`;
    // Un objeto suelto del lienzo también puede recibir el aro. Lo pidió §42.2:
    // «arréglala desde una esquina» no tiene botón que señalar, tiene FOTO.
    if (s.control?.startsWith('libre:')) return `[data-libre="${s.control.slice(6)}"]`;
    if (s.control === 'tira') return '.dpw-tira';
    if (s.control === 'notas') return '.dpw-notas';
    if (s.control && FUERA_DE_LA_CINTA[s.control]) return `[data-control="${s.control}"]`;
    const suPestana = s.control ? ubicar(cinta, s.control, DESPLEGABLES_PPT)?.pestanaId : s.pestana;
    if (suPestana && suPestana !== pestana) return `[data-pestana="${suPestana}"]`;
    if (s.pestana && s.pestana !== pestana) return `[data-pestana="${s.pestana}"]`;
    if (s.control) return `[data-control="${s.control}"]`;
    if (s.grupo) return `[data-grupo="${s.grupo}"]`;
    return null;
  }, [celebrando, cinta, pasoActual, pestana, portadaAbierta, repasando, terminado]);

  /** Dónde vive lo que este encargo señala, y su explicación. */
  const { sitioGuia, queHace, senalado } = useMemo((): {
    sitioGuia: Ubicacion<string> | null;
    queHace?: string;
    senalado?: string;
  } => {
    const s = pasoActual?.senal;
    if (s?.control?.startsWith('marcador:')) {
      const rol = s.control.slice(9) as Rol;
      return {
        sitioGuia: {
          pestanaId: 'inicio',
          pestana: 'el lienzo',
          grupo: 'Diapositiva',
          etiqueta: rol === 'titulo' ? 'Título' : rol === 'subtitulo' ? 'Subtítulo' : 'Cuadro de texto',
          glifo: '▭',
        },
        queHace: 'Un marcador de posición: la caja que el diseño dejó lista para que escribas dentro.',
      };
    }
    if (s?.control?.startsWith('libre:')) {
      return {
        sitioGuia: {
          pestanaId: pestana,
          pestana: 'el lienzo',
          grupo: 'Diapositiva',
          etiqueta: 'Este objeto',
          glifo: '▣',
        },
        queHace:
          'Un objeto que alguien metió en la diapositiva. Se selecciona con un clic y se cambia con sus ocho tiradores.',
      };
    }
    const suelto = s?.control ? FUERA_DE_LA_CINTA[s.control] : undefined;
    if (s?.control && suelto) {
      return {
        sitioGuia: { pestanaId: pestana, pestana: 'Abajo del todo', ...suelto },
        queHace: QUE_HACE_PPT[s.control],
        senalado: s.control,
      };
    }
    if (s?.control && !DESPLEGABLES_PPT[s.control] && !ubicar(cinta, s.control, DESPLEGABLES_PPT)) {
      return { sitioGuia: null };
    }
    if (s?.control) {
      return {
        sitioGuia: ubicar(cinta, s.control, DESPLEGABLES_PPT),
        queHace: QUE_HACE_PPT[s.control],
        senalado: s.control,
      };
    }
    if (s?.pestana && !s.grupo) {
      return { sitioGuia: ubicarPestana(cinta, s.pestana), queHace: QUE_HACE_PESTANA_PPT[s.pestana] };
    }
    return { sitioGuia: null };
  }, [cinta, pasoActual, pestana]);

  /** El nombre escrito al lado del aro. Señalar sin nombrar no enseña. */
  const rotulo = useMemo(() => {
    if (!selector) return null;
    if (selector.startsWith('[data-pestana')) {
      const id = selector.slice(15, -2) as PestanaPPT;
      return cinta.find((p) => p.id === id)?.nombre ?? null;
    }
    if (selector === '.dpw-tira') return 'Tira de diapositivas';
    if (selector === '.dpw-notas') return 'Notas';
    return sitioGuia?.etiqueta ?? null;
  }, [cinta, selector, sitioGuia]);

  const demostrar = useCallback(() => {
    if (sitioGuia && sitioGuia.pestanaId !== pestana && sitioGuia.pestana !== 'el lienzo') {
      setPestana(sitioGuia.pestanaId as PestanaPPT);
    }
    setDemostrando(true);
    setTimeout(() => setDemostrando(false), 2600);
  }, [pestana, sitioGuia]);

  const caja = useCajaDelObjetivo(
    raiz,
    selector,
    `${pulso}|${paso}|${fallos >= 2}|${pestana}|${hueco ? 1 : 0}|${portadaAbierta}|${zoom}|${mazo.activa}`,
    '.txtw-cinta',
  );

  /* ── un desplegable abierto se cierra al tocar otra cosa ─────────────── */

  /*
   * Como en el programa, y no es cosmética: se destapó jugando MAL la clase 6.
   * El encargo pide elegir tres tarjetas con Shift y organizarlas. Un alumno
   * abre `Organizar` con UNA sola elegida, ve «Distribuir» apagado, y entonces
   * descubre que el menú le está tapando justo las otras dos tarjetas que
   * necesita sumar a la selección. No había manera de salir salvo dar con el
   * mismo botón otra vez: encerrado dentro de su propio encargo, que es
   * exactamente el defecto que ya se pagó en §42.1 con la presentación.
   *
   * En captura, para adelantarse al `pointerdown` del lienzo. No cancela nada:
   * sólo cierra, así que el clic sigue su camino y elige la tarjeta.
   */
  useEffect(() => {
    if (!galeria) return undefined;
    const fuera = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest('.dpw-galeria') || t?.closest('[data-control]')) return;
      setGaleria(null);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setGaleria(null);
    };
    document.addEventListener('pointerdown', fuera, true);
    window.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('pointerdown', fuera, true);
      window.removeEventListener('keydown', tecla);
    };
  }, [galeria]);

  /* ── avisos al anfitrión ─────────────────────────────────────────────── */

  useEffect(() => {
    relojRef.current = Date.now();
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  const hechos = terminado ? guion.pasos.length : paso;
  useEffect(() => {
    onAvance?.(guion.pasos.length ? hechos / guion.pasos.length : 0);
  }, [hechos, guion.pasos.length, onAvance]);

  const yaAvisado = useRef(false);
  useEffect(() => {
    if (!terminado || yaAvisado.current) return;
    yaAvisado.current = true;
    onTerminado?.({
      pasos: guion.pasos.length,
      tropiezos,
      segundos: Math.round((Date.now() - relojRef.current) / 1000),
    });
  }, [guion.pasos.length, onTerminado, terminado, tropiezos]);

  /* ── el diálogo de la insignia, con el foco atrapado ─────────────────── */

  const finalRef = useRef<HTMLDivElement | null>(null);
  /*
   * La insignia espera a que se cierre el repaso, y eso costó verlo jugando.
   *
   * El último encargo de la clase 1 se cumple pulsando «Repasar», así que la
   * clase termina **con la pantalla completa abierta**: la insignia se pintaba
   * detrás, donde no la ve nadie, y su atajo de Escape se montaba a la vez que
   * el del repaso. La misma tecla con la que el alumno sale de repasar le
   * descartaba su premio sin haberlo visto. Medido el 11-ago-2026: al terminar
   * la partida no había ningún `.txtw-final` en la página.
   */
  const mostrandoInsignia = terminado && Boolean(insignia) && !oculto && !repasando;
  useEffect(() => {
    if (!mostrandoInsignia) return undefined;
    const c = finalRef.current;
    const id = requestAnimationFrame(() => c?.querySelector<HTMLButtonElement>('.txtw-final-boton')?.focus());
    const teclas = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOculto(true);
        return;
      }
      if (e.key !== 'Tab' || !c) return;
      const focos = Array.from(c.querySelectorAll<HTMLElement>('button'));
      if (focos.length === 0) return;
      const primero = focos[0];
      const ultimo = focos[focos.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };
    window.addEventListener('keydown', teclas);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('keydown', teclas);
    };
  }, [mostrandoInsignia]);

  /* ── el repaso a pantalla completa ───────────────────────────────────── */

  /**
   * Avanzar en el modo presentación, que **no es siempre «otra diapositiva»**.
   *
   * Es la mecánica del programa de verdad y la que hace posible la clase de las
   * animaciones (§42.1): mientras queden pasos por revelar en la diapositiva
   * que se está viendo, el clic los revela; cuando no queda ninguno, pasa a la
   * siguiente. Y al llegar a una diapositiva nueva no se empieza siempre en
   * cero: las animaciones «con la anterior» de arriba del todo ya están puestas.
   *
   * Emite dos gestos que un encargo puede esperar, y ninguno de los dos deja
   * rastro en el mazo —presentar no cambia la presentación—:
   *   · `revelo-todo`      al terminar de revelar una diapositiva animada;
   *   · `repaso-al-final`  al llegar al final del mazo.
   */
  /* ── el ensayo cronometrado (§43.3) ──────────────────────────────────── */

  /**
   * Ensayar es presentar con un cronómetro, y **al salir deja los tiempos
   * puestos**: eso es lo único que lo distingue de «Desde el principio», y es
   * la mitad de la herramienta.
   *
   * Las medidas se van juntando aquí y **no se escriben en el mazo hasta el
   * final**, a propósito. Escribir diapositiva a diapositiva dejaría medio
   * mazo cronometrado cuando alguien sale a mitad con Escape, y medio ensayo
   * no es un tiempo: es un número que parece un dato. Salir a mitad no anota
   * nada y hay que volver a empezar, que es lo que hace un ensayo de verdad.
   *
   * El suelo de `estimadoDe` está aquí y no en el guion porque no es contenido:
   * una diapositiva no dura menos de lo que se tarda en decirla, y eso vale
   * para cualquier clase que ensaye (§43.3.0).
   */
  const ensayando = repasando && abiertaCon === 'ensayar';
  /**
   * Grabar es ensayar **dejando también la voz**, así que se hereda entero el
   * cronómetro del ensayo en vez de escribir un segundo reloj. Escribir dos
   * relojes es tener dos relojes que un día marcan distinto.
   */
  const grabando = repasando && abiertaCon === 'grabar';
  const cronometrando = ensayando || grabando;

  useEffect(() => {
    if (!cronometrando) return undefined;
    const t = setInterval(() => setReloj(Math.round((Date.now() - entroEn.current) / 1000)), 250);
    return () => clearInterval(t);
  }, [cronometrando]);

  /**
   * Cierra la cuenta de la diapositiva que se deja y arranca la siguiente.
   *
   * ── ENSAYAR Y GRABAR SE GUARDAN DISTINTO, Y ES A PROPÓSITO ────────────────
   *
   * El ensayo junta las medidas en el cuaderno y **no escribe nada hasta el
   * final**: medio mazo cronometrado no es un tiempo, es un número que parece
   * un dato (§43.3). Grabando es al revés: **cada diapositiva se guarda al
   * pasar de ella**, porque eso es lo que hace PowerPoint y porque es lo que
   * hace posible repetir una sola —grabas la tres, sales, y la tres se quedó
   * grabada—. Si grabar guardara sólo al final, «repite la tres» obligaría a
   * pasar otra vez por las seis.
   */
  const anotar = useCallback(
    (i: number) => {
      const d = mazo.diapositivas[i];
      const real = Math.round((Date.now() - entroEn.current) / 1000);
      entroEn.current = Date.now();
      setReloj(0);
      if (!d) return;
      const segundos = Math.max(real, grabando ? estimadoNarrando(d) : estimadoDe(d));
      if (grabando) {
        /*
         * El aviso a la clase va ANTES de `cambiar`, y el orden es el defecto
         * §44.6 A. `cambiar` es lo que hace corregir al maestro, y el encargo
         * «grábalas las seis» se cuenta en la grabadora de la clase, que la
         * escribe este aviso: al revés, el maestro corregía con la toma de la
         * última diapositiva todavía sin apuntar y contestaba «llevas cinco»
         * con las seis grabadas. Se veía jugando y sólo al final: el encargo
         * se quedaba abierto y se cerraba solo al gesto siguiente, o sea el
         * alumno acertaba y no pasaba nada.
         */
        onGrabada?.(i, segundos);
        cambiar(grabarEn(mazo, i, segundos), { control: 'grabar' });
        return;
      }
      setMedidas((v) => ({ ...v, [i]: segundos }));
    },
    [cambiar, grabando, mazo, onGrabada],
  );

  /** Termina el ensayo —o la grabación—: apunta lo que falte y baja el telón. */
  const cerrarEnsayo = useCallback(
    (ultima: number) => {
      const d = mazo.diapositivas[ultima];
      const real = Math.round((Date.now() - entroEn.current) / 1000);
      setRepasando(false);
      if (!d) return;
      const segundos = Math.max(real, grabando ? estimadoNarrando(d) : estimadoDe(d));
      if (grabando) {
        // La última que se estaba grabando, que si no se perdería justo la que
        // el alumno acababa de contar. Y el aviso primero, por lo de arriba:
        // ésta es justo la diapositiva con la que se cierra el encargo.
        onGrabada?.(ultima, segundos);
        cambiar(grabarEn(mazo, ultima, segundos), { control: 'grabar' });
        return;
      }
      const todas = { ...medidas, [ultima]: segundos };
      cambiar(Object.entries(todas).reduce((m, [i, s]) => ponerIntervalo(m, Number(i), s), mazo));
    },
    [cambiar, grabando, mazo, medidas, onGrabada],
  );

  const avanzarRepaso = useCallback(() => {
    const d = mazo.diapositivas[mazo.activa];
    if (!d) return;
    const total = pasosDeAnimacion(d);
    if (revelados < total) {
      const n = siguientePaso(d, revelados);
      setRevelados(n);
      if (n >= total) evaluar(mazo, { control: 'revelo-todo' });
      return;
    }
    /*
     * Se salta lo oculto, y eso es lo que «oculta» SIGNIFICA (§43.6). Sin este
     * salto, marcar una diapositiva como oculta no cambiaría nada en pantalla y
     * el hallazgo del inspector —«llevas una que no se presenta»— sería una
     * etiqueta sin consecuencia. Con él, el alumno la ve pasar de largo.
     */
    const siguiente = primeraVisible(mazo, mazo.activa + 1, 1);
    if (siguiente >= mazo.diapositivas.length) {
      // Al final del ensayo el telón lo baja el propio ensayo, y lo hace
      // apuntando: es la única salida por la que los tiempos se quedan.
      if (cronometrando) cerrarEnsayo(mazo.activa);
      evaluar(mazo, { control: 'repaso-al-final' });
      return;
    }
    if (cronometrando) anotar(mazo.activa);
    vistas.current = [...vistas.current, siguiente];
    setMazo((m) => irA(m, siguiente));
    setRevelados(pasoInicial(mazo.diapositivas[siguiente]));
  }, [anotar, cerrarEnsayo, cronometrando, evaluar, mazo, revelados]);

  /* ── los saltos, que es presentar sin línea recta (§43.5) ────────────── */

  /**
   * ¿Volvió sobre sus pasos y luego siguió por otro sitio?
   *
   * Traducido a lo que el alumno hace: entró a una sección, volvió al menú y
   * entró a otra. Se dice sin nombrar menús ni secciones —que son cosas de la
   * clase, no del motor— y por eso vale para cualquier presentación que se
   * navegue: **hay un sitio ya visitado al que se vuelve, y después de él uno
   * nuevo**.
   */
  const volvioYSiguio = (r: number[]): boolean =>
    r.some(
      (x, k) =>
        k > 0 && r.slice(0, k).includes(x) && r.slice(k + 1).some((y) => !r.slice(0, k + 1).includes(y)),
    );

  const saltar = useCallback(
    (destino: number | 'atras') => {
      const antes = vistas.current;
      const i =
        destino === 'atras'
          ? (antes[antes.length - 2] ?? 0)
          : Math.max(0, Math.min(destino, mazo.diapositivas.length - 1));
      // Un ensayo con saltos sigue siendo un ensayo: la diapositiva que se deja
      // se cierra igual que si se hubiera avanzado. Sin esto, saltar le regalaba
      // su tiempo a la siguiente y la hoja de intervalos mentía.
      if (cronometrando) anotar(mazo.activa);
      vistas.current = [...antes, i];
      saltos.current = [...saltos.current, i];
      setMazo((m) => irA(m, i));
      setRevelados(pasoInicial(mazo.diapositivas[i]));
      evaluar(mazo, { control: 'salto-en-presentacion' });
      if (volvioYSiguio(saltos.current)) evaluar(mazo, { control: 'volvio-y-siguio' });
    },
    [anotar, cronometrando, evaluar, mazo],
  );

  /** Retroceder deja la diapositiva anterior ENTERA, que es lo que se espera. */
  const retrocederRepaso = useCallback(() => {
    if (revelados > 0) {
      setRevelados((r) => r - 1);
      return;
    }
    const previa = primeraVisible(mazo, mazo.activa - 1, -1);
    if (previa < 0) return;
    vistas.current = [...vistas.current, previa];
    setMazo((m) => irA(m, previa));
    setRevelados(pasosDeAnimacion(mazo.diapositivas[previa]));
  }, [mazo, revelados]);

  /*
   * Cuando hay escenario, el teclado es SUYO. Dos manejadores sobre las mismas
   * flechas serían dos presentaciones avanzando a distinta velocidad, y sobre
   * todo: en el auditorio salir con Escape a media función es abandonar al
   * público, y eso lo decide el escenario, no la ventana.
   */
  useEffect(() => {
    if (!repasando || enEscena) return undefined;
    const teclas = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRepasando(false);
      else if (e.key === 'ArrowRight' || e.key === ' ') avanzarRepaso();
      else if (e.key === 'ArrowLeft') retrocederRepaso();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', teclas);
    return () => window.removeEventListener('keydown', teclas);
  }, [avanzarRepaso, enEscena, repasando, retrocederRepaso]);

  /* ── los mandos que se le prestan al escenario ───────────────────────── */

  /*
   * Con `useCallback` y no en línea, y no es aseo: un escenario 3D usa estos
   * mandos dentro de sus efectos, y una función nueva en cada render volvería
   * a disparar el telón —la cámara, la voz de entrada, los relojes— cada vez
   * que la ventana repinta por cualquier motivo.
   */
  const irEnEscena = useCallback((i: number) => setMazo((m) => irA(m, i)), []);
  const salirDeEscena = useCallback(() => setRepasando(false), []);
  const gestoEnEscena = useCallback((control: string) => evaluar(mazo, { control }), [evaluar, mazo]);

  /* ── el sonido ───────────────────────────────────────────────────────── */

  /**
   * Tocar un altavoz: suena, se pinta vivo y se apaga solo al terminar.
   *
   * El reloj se guarda en una `ref` y se limpia al desmontar porque un sonido
   * que sigue vivo cuando el alumno ya salió del laboratorio es exactamente lo
   * que nadie sabe de dónde viene. Y volver a pulsar mientras suena lo PARA:
   * dos sonidos encimados no enseñan nada, y en `sonidos.ts` sólo puede haber
   * uno vivo.
   */
  const relojSonido = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tocarSonido = useCallback(
    (id: string, sonido: string) => {
      if (relojSonido.current) clearTimeout(relojSonido.current);
      if (sonando === id) {
        detenerSonido();
        setSonando(null);
        return;
      }
      const ms = reproducirSonido(sonido);
      if (!ms) {
        setAviso({ titulo: 'Este equipo no puede reproducir sonido. El resto de la clase funciona igual.' });
        return;
      }
      setSonando(id);
      relojSonido.current = setTimeout(() => setSonando(null), ms);
      // Escuchar es un gesto, y un encargo puede pedirlo: «pruébalo» no se
      // puede comprobar leyendo el mazo, porque oír no cambia la presentación.
      evaluar(mazo, { control: 'sonar' });
    },
    [evaluar, mazo, sonando],
  );

  useEffect(
    () => () => {
      if (relojSonido.current) clearTimeout(relojSonido.current);
      detenerSonido();
    },
    [],
  );

  /* ── el texto que no cabe en su caja ─────────────────────────────────── */

  /**
   * Qué cajas rebosan, preguntándole al navegador y no a una fórmula.
   *
   * Es la quinta cifra de `verificar()` del §39, la única que necesita pantalla,
   * y aquí se usa para lo que sirve de verdad: **que el alumno lo VEA**. La
   * lección de «pocas palabras» (§27.2) no se enseña diciéndosela, se enseña
   * dejando que el texto se salga de su caja delante de él.
   *
   * Sin épsilon: o el motor de maquetación dice que no cabe, o cabe.
   */
  const [rebosados, setRebosados] = useState<string[]>([]);
  useEffect(() => {
    const medir = () => {
      const el = lienzo.current;
      const fuera: string[] = [];
      for (const caja of Array.from(el?.querySelectorAll<HTMLElement>('[data-texto]') ?? [])) {
        if (caja.scrollHeight > caja.clientHeight || caja.scrollWidth > caja.clientWidth) {
          fuera.push(caja.getAttribute('data-texto') ?? '');
        }
      }
      setRebosados((antes) => (antes.join('|') === fuera.join('|') ? antes : fuera));
    };
    const id = requestAnimationFrame(medir);
    return () => cancelAnimationFrame(id);
  }, [mazo, zoom, editando, hueco]);

  /* ── pintado ─────────────────────────────────────────────────────────── */

  /**
   * La cinta que se ve ahora mismo.
   *
   * Las pestañas contextuales sólo existen mientras hay algo seleccionado, como
   * en PowerPoint. `cinta` sigue siendo la lista completa y es la que usan la
   * guía y el desvío: un botón que hoy no se ve **sigue teniendo domicilio**, y
   * la ficha que dice dónde vive tiene que poder contestar aunque la pestaña no
   * esté puesta.
   */
  const cintaViva = useMemo(() => {
    const libre =
      sitio?.tipo === 'libre'
        ? mazo.diapositivas[mazo.activa]?.libres.find((l) => l.id === sitio.id)
        : undefined;
    return cinta.filter(
      (p) =>
        !p.contextual ||
        // Un video NO saca «Formato de imagen»: tiene la suya. Con las dos
        // puestas a la vez —se vio en la captura— el alumno tenía delante una
        // pestaña llamada «Formato de imagen» sin ninguna imagen en la
        // diapositiva, ofreciéndole recortar un video.
        // Y una FORMA saca la suya y no la de imagen (§44.2), por lo mismo: una
        // forma no se recorta, se rellena. Sin esta línea, seleccionar el
        // rectángulo del cartel ofrecía «Recortar» y «Texto alternativo» bajo un
        // rótulo que decía «Formato de imagen» sin haber ninguna imagen.
        // El MODELO 3D no saca ninguna, y eso también es una decisión: en la
        // cinta no hay ni una herramienta de 3D —girar se hace en el lienzo, con
        // su tirador— así que la única contextual que podía salirle era una que
        // mintiera. Antes salía «Formato de imagen» con la gota seleccionada y
        // le ofrecía recortarla. Mejor ninguna pestaña que una que miente.
        (p.contextual === 'libre' &&
          Boolean(libre) &&
          libre?.clase !== 'video' &&
          libre?.clase !== 'forma' &&
          libre?.clase !== 'modelo3d') ||
        (p.contextual === 'video' && libre?.clase === 'video') ||
        (p.contextual === 'forma' && libre?.clase === 'forma'),
    );
  }, [cinta, mazo, sitio]);
  // Al desaparecer la contextual hay que volver a alguna: quedarse apuntando a
  // una pestaña que ya no existe dejaba la cinta en blanco.
  const pestanaActual = cintaViva.find((p) => p.id === pestana) ?? cintaViva[0] ?? cinta[0];
  /** Lo que lleva la diapositiva que se está ensayando, con su suelo puesto. */
  const enCurso = cronometrando && activa
    ? Math.max(reloj, grabando ? estimadoNarrando(activa) : estimadoDe(activa))
    : 0;
  const escala = zoom / 100;
  /** El fondo que se ve: el de la diapositiva si lo tiene, si no el del tema. */
  const fondoVivo = activa?.fondo ?? tema.fondo;

  /**
   * Lo que enseña el desplegable de tamaño.
   *
   * Sin nada seleccionado enseña el tamaño del cuerpo, no un hueco: un
   * desplegable en blanco parece roto. Con algo seleccionado enseña lo que ese
   * marcador tiene de verdad, que puede ser el suyo por rol y no uno puesto a
   * mano — que es justamente lo que la clase 2 va a pedir que se cambie.
   */
  const tamanoDelSitio =
    sitio && activa
      ? (formatoDe(activa, sitio).pt ??
        (sitio.tipo === 'marcador' ? (TAMANO_BASE_DIAPO[sitio.rol] ?? 24) : 24))
      : 24;

  /** Dónde caerá la caja al soltar. Se dibuja mientras se arrastra. */
  const destino = useMemo(() => {
    if (!gesto || !activa) return null;
    const c = casillaDeSitio(activa, gesto.sitio);
    if (!c) return null;
    if (!gesto.tirador) return moverPorPixeles(c, gesto.dx, gesto.dy);
    if (recortando && libreSel?.clase === 'imagen') {
      return recortarPorPixeles(c, recorteDe(libreSel), gesto.tirador, gesto.dx, gesto.dy).casilla;
    }
    return redimensionarPorPixeles(c, gesto.tirador, gesto.dx, gesto.dy, libreSel?.proporcion);
  }, [activa, casillaDeSitio, gesto, libreSel, recortando]);

  /** La principal: la que enseña los ocho tiradores y la que se arrastra. */
  const esteSitio = (s: Sitio) => mismoSitio(s, sitio);
  /** Cualquiera de las seleccionadas, principal o acompañante. */
  const estaElegida = (s: Sitio) => seleccion.some((x) => mismoSitio(x, s));

  const posicion = (c: Casilla, movida: boolean) => ({
    left: c.col * COL_PX + (movida && gesto && !gesto.tirador ? gesto.dx : 0),
    top: c.fila * FILA_PX + (movida && gesto && !gesto.tirador ? gesto.dy : 0),
    width: c.cols * COL_PX,
    height: c.filas * FILA_PX,
  });

  /**
   * El estilo de un texto: lo que el alumno puso, o lo que manda el tema.
   *
   * Sin `as React.CSSProperties`, y eso importa: con el `as` puesto, `textAlign`
   * recibía `'izquierda'` —el valor del modelo, en castellano— y el navegador
   * tiraba la declaración sin decir nada, así que **centrar un párrafo no
   * centraba nada** y el único síntoma era un botón hundido. El `as` calla al
   * compilador, que era el único que lo estaba viendo.
   */
  const estiloDe = (rol: Rol, d: Diapositiva): React.CSSProperties => {
    // Con el patrón por debajo (§43.4): lo suyo manda, y lo que no puso lo pone
    // el patrón. Dentro de la vista Patrón `mazoVivo.patron` sigue siendo él
    // mismo, así que el molde se ve exactamente como se va a heredar.
    const f = formatoConPatron(mazoVivo, d, rol);
    return {
      fontSize: f.pt ?? TAMANO_BASE_DIAPO[rol] ?? 24,
      color: f.color ?? (rol === 'titulo' ? tema.titulo : tema.texto),
      fontWeight: f.negrita ? 800 : rol === 'titulo' ? 700 : 500,
      fontStyle: f.cursiva ? 'italic' : undefined,
      textDecoration: f.subrayado ? 'underline' : undefined,
      textAlign: f.alineacion
        ? CSS_ALINEACION[f.alineacion]
        : rol === 'titulo' || rol === 'subtitulo'
          ? 'center'
          : 'left',
    };
  };

  const ventana = (
    <div className="txtw dpw" ref={raiz} data-pulso={pulso}>
      {/* ─── barra de título ─── */}
      <div className="txtw-titulo dpw-titulo">
        <span className="txtw-marca dpw-marca" aria-hidden="true">
          P
        </span>
        <div className="txtw-rapido">
          <button
            type="button"
            className="txtw-rapido-boton"
            title={sinGuardar ? 'Guardar los cambios' : 'Guardar'}
            aria-label="Guardar"
            data-control="guardar"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setAviso({ titulo: 'Guardado en este equipo. Si cierras y vuelves, tu presentación sigue aquí.' });
              setSinGuardar(false);
            }}
          >
            <Save size={15} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            className="txtw-rapido-boton"
            title="Deshacer"
            aria-label="Deshacer"
            data-control="deshacer"
            onMouseDown={(e) => e.preventDefault()}
            onClick={deshacer}
          >
            <Undo2 size={15} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            className="txtw-rapido-boton"
            title="Rehacer"
            aria-label="Rehacer"
            data-control="rehacer"
            onMouseDown={(e) => e.preventDefault()}
            onClick={rehacerGesto}
          >
            <Redo2 size={15} strokeWidth={2.2} />
          </button>
        </div>
        <span className="txtw-archivo">
          {guion.archivo}{' '}
          <span className={`txtw-guardado${sinGuardar ? ' es-pendiente' : ''}`}>
            · {sinGuardar ? 'Sin guardar' : 'Guardado'}
          </span>
        </span>
        <span className="txtw-programa">Tecnia Diapositivas</span>
        {onSalir && (
          <button type="button" className="txtw-cerrar" onClick={onSalir} aria-label="Salir del laboratorio">
            <X size={17} strokeWidth={2.4} />
          </button>
        )}
      </div>

      {/* ─── pestañas ─── */}
      <div className="txtw-pestanas dpw-pestanas" role="tablist" aria-label="Cinta de opciones">
        <button
          type="button"
          className={`txtw-pestana es-archivo${enArchivo ? ' es-activa' : ''}`}
          data-pestana="archivo"
          title={
            Backstage
              ? 'Archivo · guardar, exportar y proteger'
              : 'Archivo · lo usarás en la clase de guardar y exportar'
          }
          aria-disabled={Backstage ? undefined : 'true'}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            Backstage
              ? setEnArchivo((x) => !x)
              : setAviso({ titulo: '«Archivo» es para guardar y exportar. Eso lo verás en otra clase.' })
          }
        >
          Archivo
        </button>
        {cintaViva.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={p.id === pestanaActual.id}
            data-pestana={p.id}
            className={`txtw-pestana${p.id === pestanaActual.id ? ' es-activa' : ''}${
              p.contextual ? ' dpw-pestana-contextual' : ''
            }`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => irAPestana(p.id)}
          >
            {p.nombre}
          </button>
        ))}
      </div>

      {/* ─── la cinta ─── */}
      <div className="txtw-cinta" role="tabpanel" aria-label={`Herramientas de ${pestanaActual.nombre}`}>
        {pestanaActual.grupos.map((g) => {
          const disp = DISPOSICION[g.id] ?? { cols: Math.ceil(g.controles.length / 2) };
          return (
            <div className="txtw-grupo" key={g.id} data-grupo={g.id}>
              <div className="txtw-grupo-controles">
                {g.id === 'fuente' && (
                  /*
                   * Los dos desplegables que hacen que el grupo Fuente sea el
                   * del programa. Pasan por `pulsar` como cualquier botón, y por
                   * eso por el mismo desvío: en Word tardaron en hacerlo y
                   * cambiar el tamaño de la letra en un encargo que pedía otra
                   * cosa ensuciaba el documento en silencio, sólo por ser un
                   * `<select>` y no un botón (§37.5).
                   */
                  <div className="txtw-fuente-combo">
                    <select
                      className="txtw-select es-familia"
                      data-control="fuente-familia"
                      aria-label="Tipo de letra"
                      disabled={estaInerte(ctx, 'fuente-familia', controles)}
                      value={(sitio && activa ? formatoDe(activa, sitio).fuente : '') || FUENTES[0].css}
                      onChange={(e) => pulsar('fuente-familia', e.target.value)}
                    >
                      {FUENTES.map((f) => (
                        <option key={f.nombre} value={f.css}>
                          {f.nombre} ({f.equivale})
                        </option>
                      ))}
                    </select>
                    <select
                      className="txtw-select es-tamano"
                      data-control="fuente-tamano"
                      aria-label="Tamaño de letra"
                      disabled={estaInerte(ctx, 'fuente-tamano', controles)}
                      value={tamanoDelSitio}
                      onChange={(e) => pulsar('fuente-tamano', Number(e.target.value))}
                    >
                      {TAMANOS_DIAPO.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div
                  className="txtw-botones"
                  data-flujo={disp.grande ? 'columna' : 'fila'}
                  style={{ '--cols': disp.cols ?? 1 } as React.CSSProperties}
                >
                  {g.controles.map((c, i) => (
                    <BotonCinta
                      key={c.id}
                      id={c.id}
                      glifo={c.glifo}
                      etiqueta={c.etiqueta}
                      corto={c.corto}
                      ancho={c.ancho}
                      grande={disp.grande && i === 0}
                      activo={estaActivo(ctx, c.id, controles)}
                      inerte={estaInerte(ctx, c.id, controles)}
                      construido={existe(c.id, controles)}
                      esInterruptor={ES_INTERRUPTOR.has(c.id)}
                      onPulsar={pulsar}
                    />
                  ))}
                </div>
              </div>
              <div className="txtw-grupo-nombre">{g.nombre}</div>
            </div>
          );
        })}

      </div>

      {/* ─── tira · lienzo · panel ─── */}
      <div
        className={`txtw-medio dpw-medio${panel || panelFijo ? ' es-con-panel' : ''}${
          panel && panelFijo ? ' es-con-dos-paneles' : ''
        }${vista === 'clasificador' || hojaPatron ? ' es-clasificando' : ''}`}
      >
        {/*
          ─── las galerías ───
          Cuelgan de `.dpw-medio` y NO de la cinta, aunque visualmente salgan de
          ella. Estuvieron dentro y no se veían: `.txtw-cinta` lleva
          `overflow-x: auto` para poder desplazarse cuando no caben los grupos, y
          en CSS basta con que un eje no sea `visible` para que el otro recorte
          también. La galería existía en el DOM, con sus cuatro acomodos
          dibujados, y el alumno no veía nada. Se destapó mirando la captura, no
          leyendo el código: la sonda la encontraba perfectamente.
        */}
        {galeria === 'diseno' && (
          <div className="dpw-galeria" style={{ left: galeriaX }} role="menu" aria-label="Diseño de diapositiva">
            {Object.values(DISENOS).map((x) => (
              <button
                key={x.id}
                type="button"
                role="menuitem"
                className={`dpw-galeria-item${activa?.diseno === x.id ? ' es-puesto' : ''}`}
                data-diseno={x.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pulsar('diseno-diapo', x.id)}
              >
                <AcomodoDibujado diseno={x.id} forma={mazoVivo.forma} />
                <b>{x.nombre}</b>
                <small>{x.cuandoSeUsa}</small>
              </button>
            ))}
          </div>
        )}
        {galeria === 'tema' && (
          <div className="dpw-galeria es-temas" style={{ left: galeriaX }} role="menu" aria-label="Temas">
            {Object.values(TEMAS).map((t) => (
              <button
                key={t.id}
                type="button"
                role="menuitem"
                className={`dpw-galeria-item${mazo.tema === t.id ? ' es-puesto' : ''}`}
                data-tema={t.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pulsar('tema', t.id)}
              >
                <span className="dpw-muestra" style={{ background: t.fondo }} aria-hidden="true">
                  <i style={{ background: t.titulo }} />
                  <i style={{ background: t.texto }} />
                </span>
                <b>{t.nombre}</b>
                <small>{t.cuandoSeUsa}</small>
              </button>
            ))}
          </div>
        )}
        {galeria === 'color' && (
          <div className="dpw-galeria es-colores" style={{ left: galeriaX }} role="menu" aria-label="Color de letra">
            {['#111827', '#FFFFFF', '#B91C1C', '#B45309', '#0369A1', '#15803D', '#EAB308'].map((hex) => (
              <button
                key={hex}
                type="button"
                role="menuitem"
                className="dpw-color"
                data-color={hex}
                style={{ background: hex }}
                aria-label={`Color ${hex}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pulsar('color', hex)}
              />
            ))}
          </div>
        )}
        {/*
          Relleno y contorno (§44.2). Son la MISMA galería con dos destinos, y
          las dos llevan «Sin relleno» / «Sin contorno» delante de los colores.
          Ese botón no es un extra: es la mitad de la lección del encargo 4 —una
          forma sin relleno deja ver lo que hay detrás—, y sin él «quitarle el
          relleno» sería un gesto que el programa no ofrece.
        */}
        {(galeria === 'relleno' || galeria === 'contorno') && (
          <div
            className="dpw-galeria es-colores"
            style={{ left: galeriaX }}
            role="menu"
            aria-label={galeria === 'relleno' ? 'Relleno de forma' : 'Contorno de forma'}
          >
            <button
              type="button"
              role="menuitem"
              className="dpw-color es-ninguno"
              data-color="ninguno"
              aria-label={galeria === 'relleno' ? 'Sin relleno' : 'Sin contorno'}
              title={galeria === 'relleno' ? 'Sin relleno' : 'Sin contorno'}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pulsar(galeria, 'ninguno')}
            />
            {['#2563EB', '#B91C1C', '#15803D', '#EAB308', '#111827', '#FFFFFF'].map((hex) => (
              <button
                key={hex}
                type="button"
                role="menuitem"
                className="dpw-color"
                data-color={hex}
                style={{ background: hex }}
                aria-label={`Color ${hex}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pulsar(galeria, hex)}
              />
            ))}
          </div>
        )}
        {galeria === 'fondo' && (
          <div className="dpw-galeria es-colores" style={{ left: galeriaX }} role="menu" aria-label="Formato del fondo">
            {['#FDFDFB', '#F3E4C7', '#12203A', '#13342A', '#3B1D2E', '#1F2937'].map((hex) => (
              <button
                key={hex}
                type="button"
                role="menuitem"
                className="dpw-color es-fondo"
                data-fondo={hex}
                style={{ background: hex }}
                aria-label={`Fondo ${hex}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pulsar('fondo', hex)}
              />
            ))}
          </div>
        )}
        {galeria === 'organizar' && (
          <div className="dpw-galeria es-organizar" style={{ left: galeriaX }} role="menu" aria-label="Organizar">
            {/*
              Doce opciones, como el desplegable del programa. Las que piden más
              cajas de las que hay se pintan APAGADAS en vez de esconderse: así
              el alumno ve que «Distribuir» existe y que le faltan objetos, en
              vez de creer que el programa no lo tiene (§36.8).
            */}
            {ORGANIZAR.map((o) => {
              const faltan = seleccion.length < o.desde;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="menuitem"
                  className={`dpw-galeria-item es-lista${faltan ? ' es-apagado' : ''}`}
                  data-organizar={o.id}
                  disabled={faltan}
                  title={faltan ? `Necesitas ${o.desde} objetos seleccionados` : undefined}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pulsar('organizar', o.id)}
                >
                  <b>{o.nombre}</b>
                  <small>{o.detalle}</small>
                </button>
              );
            })}
          </div>
        )}
        {galeria === 'duracion' && (
          <div className="dpw-galeria es-temas" style={{ left: galeriaX }} role="menu" aria-label="Duración del efecto">
            {DURACIONES.map((seg) => (
              <button
                key={seg}
                type="button"
                role="menuitem"
                className={`dpw-galeria-item${activa && duracionDe(activa) === seg ? ' es-puesto' : ''}`}
                data-duracion={seg}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pulsar('duracion', seg)}
              >
                <b>{seg} s</b>
                <small>
                  {seg <= 0.5
                    ? 'Rápido. Casi no se nota, que es lo que se quiere.'
                    : seg === 1
                      ? 'Un segundo. Se nota y todavía no cansa.'
                      : 'Dos segundos. El público espera en vez de escucharte.'}
                </small>
              </button>
            ))}
          </div>
        )}
        {/*
          La galería de DESTINOS (§43.5). La pone la ventana y no la clase por
          la regla de siempre: la lista de diapositivas por su título se deriva
          del mazo, así que escribirla a mano en un `galerias` sería copiar lo
          que ya está y quedarse desfasada a la primera diapositiva nueva.

          Por TÍTULO y no por número, que es la decisión de la clase: «va a la
          4» no dice a dónde vas, y elegir a ciegas es lo que hace que un menú
          salga mal a la primera. La activa se pinta apagada — un vínculo a la
          diapositiva en la que estás no lleva a ningún sitio.
        */}
        {galeria === 'vinculo' && (
          <div className="dpw-galeria es-destinos" style={{ left: galeriaX }} role="menu" aria-label="Vínculo">
            <p className="dpw-galeria-titulo">Llevar a…</p>
            {mazoVivo.diapositivas.map((_, i) => (
              <button
                key={i}
                type="button"
                role="menuitem"
                className={`dpw-galeria-item es-lista${destinoPuesto === i ? ' es-puesto' : ''}${
                  i === mazoVivo.activa ? ' es-apagado' : ''
                }`}
                data-destino={i}
                disabled={i === mazoVivo.activa}
                title={i === mazoVivo.activa ? 'Es la diapositiva en la que estás' : undefined}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pulsar('vinculo', String(i))}
              >
                <b>
                  {i + 1}. {nombreDeDiapositiva(mazoVivo, i)}
                </b>
              </button>
            ))}
            <button
              type="button"
              role="menuitem"
              className={`dpw-galeria-item es-lista${destinoPuesto === 'atras' ? ' es-puesto' : ''}`}
              data-destino="atras"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pulsar('vinculo', 'atras')}
            >
              <b>◁ A la que estabas</b>
              <small>No es un sitio fijo: depende de por dónde llegó el público.</small>
            </button>
            <button
              type="button"
              role="menuitem"
              className="dpw-galeria-item es-lista es-quitar"
              data-destino="ninguno"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pulsar('vinculo', 'ninguno')}
            >
              <b>Quitar el vínculo</b>
            </button>
          </div>
        )}
        {/*
          «Formas» es UNA lista con dos secciones, como en PowerPoint: las
          figuras arriba y los botones de acción en la última fila.

          Antes eran dos `<div class="dpw-galeria">` distintos —éste y el
          genérico de las galerías de clase— abiertos a la vez y colocados en el
          mismo `left`: se pintaban uno encima del otro y el de las figuras se
          comía el letrero «Botones de acción» y el primer botón. Dos menús para
          un botón, que es exactamente la doble interfaz que el §41 costó caro.
          Se vio mirando la captura; el DOM tenía los siete botones y la sonda
          los encontraba todos.
        */}
        {galeria === 'formas' && (
          <div className="dpw-galeria es-acciones" style={{ left: galeriaX }} role="menu" aria-label="Formas">
            {galerias?.formas && (
              <>
                <p className="dpw-galeria-titulo">Formas</p>
                <div className="dpw-galeria-figuras">
                  {galerias.formas.map((x) => (
                    <button
                      key={x.valor}
                      type="button"
                      role="menuitem"
                      className="dpw-galeria-item"
                      data-item={x.valor.split('|')[0]}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pulsar('formas', x.valor)}
                    >
                      <b>{x.nombre}</b>
                      {x.detalle && <small>{x.detalle}</small>}
                    </button>
                  ))}
                </div>
              </>
            )}
            <p className="dpw-galeria-titulo">Botones de acción</p>
            {BOTONES_DE_ACCION.map((b) => (
              <button
                key={b.id}
                type="button"
                role="menuitem"
                className="dpw-galeria-item es-lista"
                data-accion={b.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pulsar('formas', b.id)}
              >
                <b>
                  <i className="dpw-accion-glifo" aria-hidden="true">
                    {b.glifo}
                  </i>{' '}
                  {b.nombre}
                </b>
                <small>{b.detalle}</small>
              </button>
            ))}
          </div>
        )}
        {/*
          Las galerías de CONTENIDO, que pone la clase. Se pintan igual que las
          del programa a propósito: para el alumno no hay dos clases de
          desplegable, hay desplegables.

          `formas` queda fuera: ahí la clase pone las figuras y el programa pone
          los botones de acción, y las dos mitades van en el MISMO menú, que se
          pinta arriba. Sin esta exclusión el desplegable salía dos veces.
        */}
        {galeria && galeria !== 'formas' && galerias?.[galeria] && (
          <div className="dpw-galeria" style={{ left: galeriaX }} role="menu" aria-label={galeria}>
            {galerias[galeria].map((x) => (
              <button
                key={x.valor}
                type="button"
                role="menuitem"
                className="dpw-galeria-item"
                data-item={x.valor.split('|')[0]}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pulsar(galeria, x.valor)}
              >
                {x.fuente && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={x.fuente} alt="" className="dpw-galeria-foto" draggable={false} />
                )}
                <b>{x.nombre}</b>
                {x.detalle && <small>{x.detalle}</small>}
              </button>
            ))}
          </div>
        )}
        {/*
          En el Clasificador la tira no se esconde: **no se pinta**. Con
          `hidden` seguía en el DOM, y eso dejaba dos elementos con el mismo
          `data-diapo` —uno invisible y otro no—, o sea dos respuestas posibles
          a «¿dónde está la diapositiva 3?». Lo pagó la primera sonda que fue a
          agarrarla y agarró la escondida. Un elemento que no se ve pero se
          puede encontrar es peor que uno que no está.
        */}
        {vista !== 'clasificador' && !hojaPatron && (
        <div
          className="dpw-tira"
          role="listbox"
          aria-label="Tira de diapositivas"
          ref={tira}
          onPointerMove={alMoverEnLaTira}
          onPointerUp={alSoltarEnLaTira}
          onPointerCancel={alSoltarEnLaTira}
        >
          {/*
            Las etiquetas de sección (§44.1). La tira se recorre por TRAMOS y no
            por diapositivas, y los tramos se derivan: `tramos()` lee dónde
            empieza cada sección y reparte el resto. En la vista Patrón no hay
            tramos que valgan —hay una sola diapositiva y las secciones son del
            mazo de verdad—, así que ahí se recorre la lista pelada.
          */}
          {(enElPatron
            ? [{ seccion: null, indices: [0] }]
            : tramos(mazoVivo)
          ).map((t, k) => (
            <Fragment key={t.seccion ? `s${t.seccion.desde}` : `suelto-${k}`}>
              {t.seccion && (
                <button
                  type="button"
                  className={`dpw-seccion${t.seccion.plegada ? ' es-plegada' : ''}`}
                  data-seccion={t.seccion.desde}
                  aria-expanded={!t.seccion.plegada}
                  onClick={() =>
                    cambiar(plegarSeccion(mazo, t.seccion!.desde, !t.seccion!.plegada), {
                      control: 'seccion-plegar',
                    })
                  }
                >
                  <span aria-hidden="true">{t.seccion.plegada ? '▸' : '▾'}</span>
                  <b>{t.seccion.nombre}</b>
                  <small>{t.indices.length}</small>
                </button>
              )}
              {!t.seccion?.plegada &&
                t.indices.map((i) => pintarMini(mazoVivo.diapositivas[i], i))}
            </Fragment>
          ))}
          {mazo.diapositivas.length === 0 && (
            <p className="dpw-tira-vacia">Todavía no hay ninguna diapositiva.</p>
          )}
        </div>
        )}

        {/*
          ─── el Clasificador de diapositivas (§44.1) ───

          Ocupa el sitio del lienzo, como en PowerPoint, y no es una ventana
          aparte: es **la misma tira puesta en rejilla**. Se pinta con
          `pintarMini`, o sea con las mismas miniaturas, los mismos arrastres y
          el mismo aviso de oculta — lo único que cambia es cómo se acomodan.

          Que reordenar funcione aquí sin una línea de arrastre nueva es
          consecuencia de eso: `alSoltarEnLaTira` no sabe si estaba en columna o
          en rejilla, sólo sabe de índices. Lo que sí hubo que dar es el
          `indiceBajoElPuntero` en dos dimensiones, y está en su gancho.
        */}
        {vista === 'clasificador' && !enElPatron && (
          <div
            className="dpw-clasificador"
            role="listbox"
            aria-label="Clasificador de diapositivas"
            ref={rejilla}
            onPointerMove={alMoverEnLaTira}
            onPointerUp={alSoltarEnLaTira}
            onPointerCancel={alSoltarEnLaTira}
          >
            {tramos(mazoVivo).map((t, k) => (
              <Fragment key={t.seccion ? `cs${t.seccion.desde}` : `csuelto-${k}`}>
                {t.seccion && (
                  <button
                    type="button"
                    className={`dpw-clas-seccion${t.seccion.plegada ? ' es-plegada' : ''}`}
                    data-seccion={t.seccion.desde}
                    aria-expanded={!t.seccion.plegada}
                    onClick={() =>
                      cambiar(plegarSeccion(mazo, t.seccion!.desde, !t.seccion!.plegada), {
                        control: 'seccion-plegar',
                      })
                    }
                  >
                    <span aria-hidden="true">{t.seccion.plegada ? '▸' : '▾'}</span>
                    <b>{t.seccion.nombre}</b>
                    <small>
                      {t.indices.length} diapositiva{t.indices.length === 1 ? '' : 's'}
                    </small>
                  </button>
                )}
                {!t.seccion?.plegada && (
                  <div className="dpw-clas-rejilla">
                    {t.indices.map((i) => pintarMini(mazoVivo.diapositivas[i], i))}
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        )}

        {/*
          ─── las dos vistas de patrón de PAPEL (§44.4) ───

          Ocupan el sitio del lienzo, sin tira: en PowerPoint el patrón de
          documentos tampoco la tiene, y con razón — el molde no es de ninguna
          diapositiva en concreto, así que una tira al lado invitaría a creer que
          se está tocando la que está marcada.

          Se dibuja con `HojaImpresa` en modo molde: los mismos cuatro rótulos y
          los mismos márgenes que el previo de imprimir, con huecos rayados donde
          irán las diapositivas. Que sea el mismo componente es lo que hace que
          escribir aquí se vea allí sin que nadie los sincronice.
        */}
        {hojaPatron && (
          <div className="dpw-patron-hoja">
            <div className="dpw-patron-cab">
              <b>
                {hojaPatron === 'documentos' ? 'Patrón de documentos' : 'Patrón de notas'}
              </b>
              <span>
                {hojaPatron === 'documentos'
                  ? 'El molde de las hojas que repartes. Lo que escribas aquí sale en TODAS.'
                  : 'El molde de las hojas que te quedas tú, con la diapositiva arriba y tus notas debajo.'}
              </span>
              <button
                type="button"
                className="dpw-patron-cerrar"
                data-control="cerrar-patron-hoja"
                onClick={() => pulsar('vista-normal')}
              >
                Cerrar vista de patrón
              </button>
            </div>
            <div className="dpw-patron-lienzo">
              <HojaImpresa
                mazo={mazoVivo}
                indices={hojaPatron === 'notas' ? [0] : [0, 1, 2]}
                forma={formaDeImprimir(hojaPatron === 'notas' ? 'notas' : 'doc-3')}
                patron={patronImpreso(mazo, hojaPatron)}
                pagina={1}
                molde
                alEscribir={(campo, texto) =>
                  cambiar(tocarPatronImpreso(mazo, hojaPatron, { [campo]: texto || null }), {
                    control: hojaPatron === 'notas' ? 'patron-notas' : 'patron-documentos',
                  })
                }
              />
            </div>
          </div>
        )}

        {/*
          ─── la vista «Página de notas» (§44.4) ───

          El botón llevaba en la cinta desde que se escribió el grado Avanzado,
          con icono y con ficha, y sin comando: pulsarlo contestaba «todavía no
          está en esta clase». Aquí estrena lo que su ficha prometía —«cada
          diapositiva con sus notas debajo, tal como se imprimirían»— y se
          dibuja con la MISMA hoja que el previo, para que ese «tal como» sea
          verdad y no una manera de hablar.
        */}
        {vista === 'notas' && !hojaPatron && activa && (
          <div className="dpw-pagina-notas">
            {/*
              El número de página se cuenta sobre LAS QUE SE IMPRIMEN, no sobre
              las que hay.

              Salió mirando la hoja: decía «1 de 9» con una diapositiva oculta
              en el mazo, mientras el previo de Archivo → Imprimir decía ocho
              hojas. Dos números distintos para la misma cosa, en la misma
              clase, a dos clics de distancia. Y la oculta no lleva número
              porque no va a salir de la impresora: en su sitio se dice por qué,
              que es la lección de §44.1 cobrada donde de verdad muerde.
            */}
            {enPapel.puesto < 0 && (
              <p className="dpw-notas-oculta">
                Esta diapositiva está oculta: <b>no se imprime</b>. Sus notas son sólo para ti.
              </p>
            )}
            <HojaImpresa
              mazo={mazoVivo}
              indices={[mazoVivo.activa]}
              forma={formaDeImprimir('notas')}
              patron={patronImpreso(mazo, 'notas')}
              pagina={enPapel.puesto < 0 ? undefined : enPapel.puesto + 1}
              total={enPapel.cuantas}
            />
          </div>
        )}

        <div className="dpw-centro" hidden={vista !== 'normal' || Boolean(hojaPatron)}>
          <div className="dpw-lienzo-caja" ref={lienzoCaja}>
            {activa ? (
              <div
                ref={lienzo}
                className="dpw-lienzo"
                tabIndex={0}
                role="application"
                aria-label={`Diapositiva ${mazo.activa + 1} de ${cuantasDiapositivas(mazo)}`}
                style={{
                  width: anchoVivo,
                  height: LIENZO_ALTO,
                  transform: `scale(${escala})`,
                  background: fondoVivo,
                }}
                onPointerMove={alMover}
                onPointerUp={alSoltar}
                onPointerCancel={alSoltar}
                onKeyDown={alTeclearLienzo}
                onPointerDown={() => {
                  setSitio(null);
                  setExtra([]);
                  dejarDeEscribir();
                  setRecortando(false);
                }}
              >
                {destino && (
                  <div
                    className="dpw-destino"
                    aria-hidden="true"
                    style={{
                      left: destino.col * COL_PX,
                      top: destino.fila * FILA_PX,
                      width: destino.cols * COL_PX,
                      height: destino.filas * FILA_PX,
                    }}
                  />
                )}

                {rolesDe(activa.diseno).map((rol) => {
                  const c = casillaDe(activa, rol, mazoVivo.forma);
                  if (!c) return null;
                  const m = activa.marcadores.find((x) => x.rol === rol);
                  const s: Sitio = { tipo: 'marcador', rol };
                  const puesto = esteSitio(s);
                  const f = formatoDe(activa, s);
                  // Un cuerpo que le cedió su texto a un diagrama no está vacío
                  // por descuido: está vacío porque su contenido se mudó ahí al
                  // lado. Ni borde de «falta esto» ni pista de «escribe aquí».
                  const cedido = rol === 'cuerpo' && cuerpoCedido(activa);
                  return (
                    <div
                      key={rol}
                      className={`dpw-caja es-marcador${puesto ? ' es-sel' : ''}${
                        m?.contenido || cedido ? '' : ' es-vacio'
                      }${rebosados.includes(rol) ? ' es-rebosa' : ''}`}
                      data-marcador={rol}
                      data-caja={rol}
                      style={posicion(c, puesto)}
                      onPointerDown={(e) => alBajar(e, s, null)}
                      onDoubleClick={() => {
                        setSitio(s);
                        setEditando(rol);
                      }}
                    >
                      {editando === rol ? (
                        <textarea
                          className="dpw-escritura"
                          autoFocus
                          data-texto={rol}
                          style={estiloDe(rol, activa)}
                          value={m?.contenido ?? ''}
                          onPointerDown={(e) => e.stopPropagation()}
                          onChange={(e) => cambiar(escribirEn(mazoVivo, rol, e.target.value))}
                          onBlur={() => setEditando(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setEditando(null);
                            e.stopPropagation();
                          }}
                        />
                      ) : m?.contenido ? (
                        <div className="dpw-texto" data-texto={rol} style={estiloDe(rol, activa)}>
                          {f.vinetas || f.numeros ? (
                            <ul className={f.numeros ? 'es-numeros' : 'es-vinetas'}>
                              {m.contenido.split('\n').map((linea, k) => (
                                <li key={k}>{linea}</li>
                              ))}
                            </ul>
                          ) : (
                            m.contenido.split('\n').map((linea, k) => <p key={k}>{linea}</p>)
                          )}
                        </div>
                      ) : cedido ? null : (
                        <span className="dpw-vacio-pista">
                          {rol === 'imagen' ? 'Aquí va una imagen' : 'Doble clic para escribir'}
                        </span>
                      )}
                      {/*
                        El número de la animación, como lo pinta PowerPoint al
                        lado del objeto animado. Está en el lienzo y no sólo en
                        el panel a propósito: el encargo de la clase 4 pide un
                        ORDEN, y un orden que sólo se ve abriendo un panel es un
                        orden que el alumno no va a mirar.
                      */}
                      {activa.marcadores.find((x) => x.rol === rol)?.animacion && (
                        <i className="dpw-anim-num" aria-hidden="true">
                          {activa.marcadores.find((x) => x.rol === rol)?.animacion?.orden}
                        </i>
                      )}
                      {puesto &&
                        !editando &&
                        TIRADORES.map((t) => (
                          <i
                            key={t}
                            className={`dpw-tirador es-${t}`}
                            data-tirador={t}
                            onPointerDown={(e) => alBajar(e, s, t)}
                          />
                        ))}
                    </div>
                  );
                })}

                {activa.libres.map((l) => {
                  const s: Sitio = { tipo: 'libre', id: l.id };
                  const puesto = esteSitio(s);
                  const acompana = !puesto && estaElegida(s);
                  const recortandoEsta = puesto && recortando && l.clase === 'imagen';
                  return (
                    <div
                      key={l.id}
                      /*
                       * `es-vinculo` también en el lienzo de trabajo (§43.5): sin
                       * la marca, un menú terminado y un menú con los tres
                       * botones muertos se ven exactamente igual, y la única
                       * forma de distinguirlos sería presentar. Aquí NO salta —
                       * pulsarlo selecciona la caja, como en el programa—, y ésa
                       * es media lección de la clase.
                       */
                      className={`dpw-caja es-${l.clase}${puesto ? ' es-sel' : ''}${
                        acompana ? ' es-acompana' : ''
                      }${recortandoEsta ? ' es-recortando' : ''}${
                        l.destino !== undefined ? ' es-vinculo' : ''
                      }`}
                      data-libre={l.id}
                      data-caja={l.id}
                      data-destino={l.destino}
                      style={{ ...posicion(l.casilla, puesto), zIndex: 10 + l.z }}
                      onPointerDown={(e) => alBajar(e, s, null)}
                      /*
                        Doble clic para escribir dentro, igual que un marcador
                        (§44.2). Sólo el cuadro de texto: doble clic sobre una
                        forma o sobre una foto no hace nada, como en el programa.
                      */
                      onDoubleClick={
                        l.clase === 'texto'
                          ? () => {
                              setSitio(s);
                              setEscribiendo(l.id);
                            }
                          : undefined
                      }
                    >
                      {escribiendo === l.id ? (
                        <textarea
                          className="dpw-escritura"
                          autoFocus
                          data-texto={l.id}
                          style={{
                            fontSize: l.formato?.pt ?? 24,
                            color: l.formato?.color ?? tema.texto,
                            fontWeight: l.formato?.negrita ? 800 : 500,
                          }}
                          value={l.contenido}
                          onPointerDown={(e) => e.stopPropagation()}
                          onFocus={(e) => e.currentTarget.select()}
                          onChange={(e) => cambiar(escribirLibre(mazoVivo, l.id, e.target.value))}
                          onBlur={() => setEscribiendo(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setEscribiendo(null);
                            e.stopPropagation();
                          }}
                        />
                      ) : l.clase === 'audio' ? (
                        <Altavoz
                          sonido={l.sonido ?? ''}
                          sonando={sonando === l.id}
                          alTocar={() => tocarSonido(l.id, l.sonido ?? '')}
                        />
                      ) : l.clase === 'video' ? (
                        <Reproductor libre={l} />
                      ) : l.clase === 'forma' ? (
                        l.figura ? (
                          // El mismo dibujo que la lámina, sin una línea propia:
                          // una forma que se viera de una manera trabajando y de
                          // otra al presentar sería justo lo que §41 pagó caro.
                          <Figura l={l} tema={tema} />
                        ) : (
                          // La misma marca que la lámina, con su formato: el
                          // botón del lienzo y el que ve el público son el mismo.
                          <p
                            className="dpw-accion"
                            style={{
                              fontSize: l.formato?.pt ?? 24,
                              color: l.formato?.color ?? tema.texto,
                            }}
                          >
                            {l.accion && <b aria-hidden="true">{GLIFO_ACCION[l.accion]}</b>}
                            <span>{l.contenido}</span>
                          </p>
                        )
                      ) : l.clase === 'modelo3d' ? (
                        <Modelo3D l={giroVivo?.id === l.id ? { ...l, giro: giroVivo } : l} />
                      ) : l.clase === 'zoom' ? (
                        /* El mismo componente que la lámina, por lo mismo que el
                           SmartArt de aquí abajo: montar el índice y proyectarlo
                           no pueden verse distinto. */
                        <MiniZoom mazo={mazoVivo} libre={l} tinta={l.formato?.color ?? tema.texto} />
                      ) : esDibujado(l) ? (
                        /* El mismo componente que la lámina, y por eso el
                           SmartArt del lienzo y el del público no se pueden
                           separar nunca: son el mismo dibujo a otro tamaño. */
                        <Dibujado libre={l} tinta={l.formato?.color ?? tema.texto} acento={tema.titulo} />
                      ) : l.fuente ? (
                        <FotoRecortada l={l} />
                      ) : (
                        /*
                         * Con su formato, igual que la lámina. Antes sólo
                         * llevaba el texto: los tres botones de fuente y los
                         * tres de alineación se hundían sobre una caja libre y
                         * no pasaba nada. Se corrigieron los dos sitios a la
                         * vez, que es la única forma de que no vuelvan a
                         * separarse.
                         */
                        <span
                          className="dpw-texto"
                          data-texto={l.id}
                          style={{
                            fontSize: l.formato?.pt ?? 24,
                            color: l.formato?.color ?? tema.texto,
                            fontWeight: l.formato?.negrita ? 800 : 500,
                            fontStyle: l.formato?.cursiva ? 'italic' : undefined,
                            textDecoration: l.formato?.subrayado ? 'underline' : undefined,
                            textAlign: l.formato?.alineacion
                              ? CSS_ALINEACION[l.formato.alineacion]
                              : undefined,
                          }}
                        >
                          {l.contenido}
                        </span>
                      )}
                      {l.animacion && (
                        <i className="dpw-anim-num" aria-hidden="true">
                          {l.animacion.orden}
                        </i>
                      )}
                      {l.grupo && (
                        <i className="dpw-grupo-marca" aria-hidden="true" title="Agrupado">
                          ⛓
                        </i>
                      )}
                      {puesto &&
                        !escribiendo &&
                        TIRADORES.map((t) => (
                          <i
                            key={t}
                            className={`dpw-tirador es-${t}${recortandoEsta ? ' es-recorte' : ''}`}
                            data-tirador={t}
                            onPointerDown={(e) => alBajar(e, s, t)}
                          />
                        ))}
                      {/*
                        El tirador de GIRO del modelo 3D (§44.2). Va con la
                        selección y no dentro de la escena, igual que los ocho de
                        tamaño: girar es una herramienta de edición, no una
                        parte del objeto. Y es lo que deja que la escena 3D no
                        pinte ni un control encima —la regla de
                        `feedback-falso-3d-en-laboratorios` leída al pie de la
                        letra: una escena con una interfaz escrita encima no es
                        3D.
                      */}
                      {puesto && l.clase === 'modelo3d' && (
                        <i
                          className="dpw-tirador-giro"
                          data-tirador="giro"
                          role="slider"
                          tabIndex={0}
                          aria-label="Girar el modelo"
                          aria-valuenow={Math.round(
                            (giroVivo?.id === l.id ? giroVivo.y : l.giro?.y) ?? 0,
                          )}
                          title="Arrastra para girarlo"
                          onPointerDown={(e) => empezarGiro(e, l)}
                          onKeyDown={(e) => {
                            const paso =
                              e.key === 'ArrowLeft' ? -15 : e.key === 'ArrowRight' ? 15 : 0;
                            if (!paso) return;
                            e.preventDefault();
                            cambiar(girar(mazo, l.id, { x: l.giro?.x ?? 0, y: (l.giro?.y ?? 0) + paso }));
                          }}
                        >
                          ⟳
                        </i>
                      )}
                    </div>
                  );
                })}

                {/*
                  El pie, igual que en la lámina del público y **con la misma
                  regla**: quien decide si sale es `pieDe`, no este `if`. Antes
                  aquí había un `mazo.numeroDiapositiva &&` escrito a mano, y con
                  la casilla de «no en la portada» de §44.3 eso habría dejado la
                  portada con número en el lienzo y sin él al presentar.
                */}
                {pieDe(mazo, mazo.activa).numero !== null && (
                  <span className="dpw-pie-numero" style={{ color: tintaSobre(fondoVivo, tema.texto) }}>
                    {pieDe(mazo, mazo.activa).numero}
                  </span>
                )}
                {pieDe(mazo, mazo.activa).texto && (
                  <span className="dpw-pie-texto" style={{ color: tintaSobre(fondoVivo, tema.texto) }}>
                    {pieDe(mazo, mazo.activa).texto}
                  </span>
                )}

                {/*
                  El altavoz de la narración, abajo a la derecha (§44.6).

                  Está donde PowerPoint lo pone y se comporta como allí: **se ve
                  mientras trabajas y no sale al presentar**, porque es la marca
                  de que esa diapositiva lleva voz, no un adorno de la
                  diapositiva. Por eso vive aquí, en el lienzo de edición, y no
                  dentro de `Lamina` —que es la que ve el público y la que se
                  imprime—. Meterlo ahí habría puesto un altavoz en el papel.
                */}
                {activa.narrada && (
                  <span
                    className="dpw-voz-diapo"
                    data-voz-diapo
                    title={`Esta diapositiva lleva tu voz grabada · ${activa.intervalo ?? 0} s`}
                  >
                    🔊
                  </span>
                )}
              </div>
            ) : (
              /*
               * Sin ninguna diapositiva. No es un estado inventado para que el
               * primer encargo tenga sentido: PowerPoint enseña exactamente esto
               * —un área gris con una sola frase— cuando se borran todas.
               */
              <div className="dpw-sin-diapos">
                <p>Tu presentación todavía no tiene ninguna diapositiva.</p>
                <p className="dpw-sin-diapos-pista">
                  Créala desde <b>Inicio → Diapositivas → Nueva diapositiva</b>.
                </p>
              </div>
            )}
          </div>

          {/*
            ─── el cajón de notas ───
            En la vista Patrón no está, y tampoco en PowerPoint: un patrón no se
            presenta, así que no tiene nada que decirle a nadie. Dejarlo puesto
            habría sido peor que un hueco — escribir ahí habría ido a parar a las
            notas de la diapositiva que quedó atrás.
          */}
          {!enElPatron && (
            <div className="dpw-notas">
              <label className="dpw-notas-rotulo" htmlFor="dpw-notas-campo">
                Notas del presentador — esto lo lees tú; el público no lo ve
              </label>
              <textarea
                id="dpw-notas-campo"
                className="dpw-notas-campo"
                placeholder="Lo que vas a decir con tus palabras…"
                value={activa?.notas ?? ''}
                disabled={!activa}
                onChange={(e) => cambiar(escribirNotas(mazo, e.target.value))}
              />
            </div>
          )}
          {enElPatron && (
            <div className="dpw-patron-aviso" role="status">
              <b>✳ Estás en el patrón.</b> Lo que cambies aquí lo heredan todas las
              diapositivas. Para volver: <b>Vista → Vistas → Normal</b>.
            </div>
          )}
        </div>

        {/*
          ─── el panel de animación ───
          Es una pieza del PROGRAMA, no de una clase: sale de la cinta que ya
          tiene el Intermedio entero, y por eso vive aquí y no en `accesorios`.
          Lista lo que se mueve **en su orden**, que es lo único que un panel de
          animación tiene que hacer bien; las flechas cambian ese orden y el
          número del lienzo cambia con ellas, porque los dos leen el modelo.
        */}
        {panel === 'animacion' && activa && (
          <div className="dpw-panel-anim" role="region" aria-label="Panel de animación">
            <div className="dpw-panel-anim-cabeza">
              Panel de animación
              <button type="button" onClick={() => setPanel(null)} aria-label="Cerrar el panel">
                ✕
              </button>
            </div>
            {animaciones(activa).length === 0 ? (
              <p className="dpw-panel-anim-vacio">
                Todavía no se mueve nada en esta diapositiva. Selecciona algo y elige una animación en la
                pestaña <b>Animaciones</b>.
              </p>
            ) : (
              <ul className="dpw-panel-anim-lista">
                {animaciones(activa).map((x, i, todas) => {
                  const suyo =
                    sitio != null &&
                    ((x.sitio.tipo === 'marcador' &&
                      sitio.tipo === 'marcador' &&
                      x.sitio.rol === sitio.rol) ||
                      (x.sitio.tipo === 'libre' && sitio.tipo === 'libre' && x.sitio.id === sitio.id));
                  return (
                    <li
                      key={`${x.sitio.tipo}-${x.sitio.tipo === 'marcador' ? x.sitio.rol : x.sitio.id}`}
                      className={`dpw-panel-anim-fila${suyo ? ' es-sel' : ''}`}
                      data-anim={x.anim.orden}
                    >
                      <span className="dpw-panel-anim-orden">{x.anim.orden}</span>
                      <span className="dpw-panel-anim-que">
                        <b>{x.nombre}</b>
                        <small>
                          {NOMBRE_ANIMACION[x.anim.tipo]} ·{' '}
                          {x.anim.disparo === 'clic' ? 'al clic' : 'con la anterior'}
                        </small>
                      </span>
                      <span className="dpw-panel-anim-mandos">
                        <button
                          type="button"
                          title="Subir"
                          aria-label={`Subir ${x.nombre}`}
                          disabled={i === 0}
                          onClick={() => cambiar(moverAnimacion(mazo, x.sitio, -1))}
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          title="Bajar"
                          aria-label={`Bajar ${x.nombre}`}
                          disabled={i === todas.length - 1}
                          onClick={() => cambiar(moverAnimacion(mazo, x.sitio, 1))}
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          title="Quitar la animación"
                          aria-label={`Quitar la animación de ${x.nombre}`}
                          onClick={() => cambiar(quitarAnimacion(mazo, x.sitio))}
                        >
                          ✕
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* ─── el panel que aporta la clase, si lo hay ─── */}
        {panelFijo && (
          <div className="dpw-panel-anim es-fijo" role="region" aria-label={panelFijo.titulo}>
            <div className="dpw-panel-anim-cabeza">{panelFijo.titulo}</div>
            <panelFijo.Cuerpo
              mazo={mazo}
              diapositiva={activa}
              indice={mazo.activa}
              irA={irEnEscena}
              gesto={(control) => evaluar(mazo, { control })}
            />
          </div>
        )}

        {/*
          ─── el panel del texto alternativo ───
          Mismo mueble que el de animación y por el mismo motivo: en PowerPoint
          el texto alternativo se escribe en un panel de tareas, no en un
          diálogo que tapa la diapositiva de la que estás hablando.
        */}
        {panel === 'alt' && (
          <div className="dpw-panel-anim" role="region" aria-label="Texto alternativo">
            <div className="dpw-panel-anim-cabeza">
              Texto alternativo
              <button type="button" onClick={() => setPanel(null)} aria-label="Cerrar el panel">
                ✕
              </button>
            </div>
            {libreSel?.clase === 'imagen' ? (
              <div className="dpw-panel-alt">
                <label htmlFor="dpw-alt-campo">
                  Escribe qué se ve en la imagen, para quien no la puede ver.
                </label>
                <textarea
                  id="dpw-alt-campo"
                  className="dpw-panel-alt-campo"
                  placeholder="Un volcán con la punta nevada y una nube de humo saliendo del cráter…"
                  value={libreSel.alt ?? ''}
                  onChange={(e) => cambiar(ponerAlt(mazo, libreSel.id, e.target.value))}
                />
                <p className="dpw-panel-alt-pista">
                  No repitas el título: eso ya está escrito. Di lo que se VE.
                </p>
              </div>
            ) : (
              <p className="dpw-panel-anim-vacio">
                Selecciona una imagen de la diapositiva para escribir su descripción.
              </p>
            )}
          </div>
        )}

        {/*
          ─── el panel de reutilizar diapositivas (§44.5) ───

          Mismo mueble que los otros tres. Enseña **las diapositivas del otro
          archivo sin abrir el otro archivo**, que es la idea entera: se ven en
          miniatura, se pulsa una y se viene. Con la lámina de verdad y no con
          un cuadro con su nombre, porque lo que se decide mirando es «¿cuál de
          éstas quiero?» y eso no se decide leyendo títulos.

          La casilla va ARRIBA y no abajo, como en PowerPoint: decide cómo entra
          lo que traigas después, así que leerla al final es leerla tarde.
        */}
        {panel === 'reutilizar' && (
          <div className="dpw-panel-anim" role="region" aria-label="Reutilizar diapositivas">
            <div className="dpw-panel-anim-cabeza">
              Reutilizar diapositivas
              <button type="button" onClick={() => setPanel(null)} aria-label="Cerrar el panel">
                ✕
              </button>
            </div>
            {archivoDeOrigen ? (
              <div className="dpw-reutilizar">
                <p className="dpw-reutilizar-archivo">
                  <b>{archivoDeOrigen.nombre}</b>
                  <span>{archivoDeOrigen.mazo.diapositivas.length} diapositivas</span>
                </p>
                <label className="dpw-reutilizar-casilla">
                  <input
                    type="checkbox"
                    data-reutilizar-origen
                    checked={conSuCara}
                    onChange={(e) => setConSuCara(e.target.checked)}
                  />
                  <span>
                    Conservar el formato de origen
                    <i>
                      Con esto puesto, la que traigas se queda con los colores de{' '}
                      {archivoDeOrigen.nombre}. Sin esto, toma los de esta presentación.
                    </i>
                  </span>
                </label>
                <ul className="dpw-reutilizar-lista">
                  {archivoDeOrigen.mazo.diapositivas.map((d, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        className="dpw-reutilizar-item"
                        data-reutilizar={i}
                        title={`Traer «${nombreDeDiapositiva(archivoDeOrigen.mazo, i)}»`}
                        onClick={() =>
                          cambiar(traer(mazo, d, archivoDeOrigen.mazo.tema, conSuCara), {
                            control: 'reutilizar',
                          })
                        }
                      >
                        <span className="dpw-reutilizar-lamina">
                          <Lamina mazo={archivoDeOrigen.mazo} diapositiva={d} />
                        </span>
                        <span className="dpw-reutilizar-nombre">
                          {nombreDeDiapositiva(archivoDeOrigen.mazo, i)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="dpw-panel-anim-vacio">No hay ningún otro archivo abierto.</p>
            )}
          </div>
        )}

        {/*
          ─── el panel de comentarios (§43.6) ───

          Mismo mueble que los otros dos, y es el de PowerPoint: los comentarios
          se leen y se escriben en un panel de tareas al lado, no en un globo
          flotando encima de la diapositiva de la que hablan.

          Enseña **los de esta diapositiva**, que es como funciona el programa, y
          arriba el número de PENDIENTES DEL ARCHIVO ENTERO — porque la pregunta
          de una revisión no es «¿cuántas notas hay aquí?» sino «¿cuántas
          quedan?».
        */}
        {panel === 'comentarios' && activa && (
          <div className="dpw-panel-anim" role="region" aria-label="Comentarios">
            <div className="dpw-panel-anim-cabeza">
              Comentarios
              <button type="button" onClick={() => setPanel(null)} aria-label="Cerrar el panel">
                ✕
              </button>
            </div>
            <p className="dpw-com-cuenta" data-com-pendientes>
              {pendientesEnElMazo(mazo) === 0
                ? 'No queda ninguno pendiente en toda la presentación.'
                : `${pendientesEnElMazo(mazo)} sin resolver en toda la presentación`}
            </p>
            <ul className="dpw-com-lista">
              {comentariosDe(activa).map((c) => (
                <li key={c.id} className={`dpw-com${c.resuelto ? ' es-resuelto' : ''}`} data-com={c.id}>
                  <p className="dpw-com-quien">
                    <b>{c.autor}</b>
                    <small>{c.fecha}</small>
                    {c.resuelto && <i className="dpw-com-sello">resuelto</i>}
                  </p>
                  <p className="dpw-com-texto">{c.texto}</p>
                  <p className="dpw-com-mandos">
                    <button
                      type="button"
                      data-com-resolver={c.id}
                      disabled={c.resuelto}
                      onClick={() => cambiar(resolverComentario(mazo, c.id))}
                    >
                      Resolver
                    </button>
                    {/*
                      Borrar, **sólo lo tuyo**. No es una restricción inventada:
                      en un archivo que se revisa entre varios, la nota de otro
                      no se borra —se resuelve—, y quien la escribió tiene que
                      poder ver que se atendió.

                      Y evita un callejón que salió razonando cómo se juega mal
                      §43.6: el encargo pide resolver el comentario de Diego, y
                      un alumno que lo borrara en vez de resolverlo se quedaba
                      sin encargo posible y sin más salida que reiniciar. Es la
                      misma forma del defecto que costó §42.1 y §43.2.
                    */}
                    <button
                      type="button"
                      data-com-borrar={c.id}
                      disabled={c.autor !== AUTOR_ALUMNO}
                      title={
                        c.autor !== AUTOR_ALUMNO
                          ? 'Este comentario no es tuyo. Para decir que ya se atendió, usa Resolver.'
                          : undefined
                      }
                      onClick={() => cambiar(borrarComentario(mazo, c.id))}
                    >
                      Borrar
                    </button>
                  </p>
                </li>
              ))}
              {comentariosDe(activa).length === 0 && (
                <li className="dpw-panel-anim-vacio">Esta diapositiva no tiene ningún comentario.</li>
              )}
            </ul>
            <div className="dpw-com-nuevo">
              <label htmlFor="dpw-com-campo">Escribe un comentario nuevo</label>
              <textarea
                id="dpw-com-campo"
                data-com-campo
                placeholder="Di QUÉ pasa y POR QUÉ. «Está mal» no ayuda a nadie."
                value={borrador}
                onChange={(e) => setBorrador(e.target.value)}
              />
              <button
                type="button"
                data-com-nuevo
                disabled={!borrador.trim()}
                onClick={() => {
                  /*
                   * La fecha se escribe AQUÍ y no en el modelo: un modelo con
                   * reloj dentro devuelve algo distinto cada vez que se lee y
                   * ninguna prueba puede decir qué esperaba (§43.6).
                   */
                  const ahora = new Date();
                  cambiar(
                    comentar(mazo, mazo.activa, {
                      id: `com-${mazo.activa}-${comentariosDe(activa).length}-${ahora.getTime()}`,
                      autor: AUTOR_ALUMNO,
                      texto: borrador.trim(),
                      fecha: `${ahora.getDate()}/${ahora.getMonth() + 1}`,
                    }),
                  );
                  setBorrador('');
                }}
              >
                Comentar
              </button>
            </div>
          </div>
        )}

        <PanelMaestro
          onVerObjetivos={guion.portada ? () => setPortadaAbierta(true) : undefined}
          guion={guion}
          paso={paso}
          fallos={fallos}
          celebrando={celebrando}
          terminado={terminado}
          erro={erro}
          aviso={aviso}
          rehacer={rehacer}
          sitio={sitioGuia}
          queHace={queHace}
          senalado={senalado}
          onDemostrar={sitioGuia ? demostrar : undefined}
          demostrando={demostrando}
          cierrePorOmision="Terminaste la práctica."
          textoError="Esa no. Lee otra vez la pista y vuelve a intentarlo."
          onElegir={(i) => {
            const l = pasoActual?.logro;
            if (!l || l.tipo !== 'eleccion') return;
            if (i === l.correcta) acertar();
            else {
              setErro(true);
              setFallos((f) => f + 1);
              setTropiezos((t) => t + 1);
            }
          }}
          onConfirmar={acertar}
        />
      </div>

      {/* ─── barra de estado ─── */}
      <div className="txtw-estado">
        {/* En el patrón no hay «1 de 12»: hay UNA, y decir doce sería contar
            diapositivas que en ese momento no están delante (§43.4). */}
        <span>
          {enElPatron
            ? 'Patrón de diapositivas'
            : `Diapositiva ${cuantasDiapositivas(mazo) ? mazo.activa + 1 : 0} de ${cuantasDiapositivas(mazo)}`}
        </span>
        <span>{activa ? nombreDelDiseno(activa.diseno) : 'Sin diapositivas'}</span>
        {/*
          El de la diapositiva que se está viendo, y **dice cuándo no es el del
          archivo**: una traída de otro sitio que conservó su cara se delata
          aquí sin que nadie tenga que explicarlo (§44.5).
        */}
        <span>
          Tema: {tema.nombre}
          {activa?.tema && activa.tema !== mazo.tema ? ' · de origen' : ''}
        </span>
        <span className="txtw-estado-hueco" />
        {/*
          La barra de vistas (§44.1). Está en la barra de estado y no en un
          grupo de la cinta porque es donde está en PowerPoint — y de paso
          resuelve un problema de grado sin mentir: la pestaña Vista es del
          Avanzado, pero estos tres botones los tiene a mano hasta un niño de
          tercero, porque abajo a la derecha están para todo el mundo.

          Sólo sale si la clase trajo más de una diapositiva: un Clasificador de
          una sola es una rejilla con un cuadro, y enseñaría que la vista no
          sirve para nada.
        */}
        {!enElPatron && mazoVivo.diapositivas.length > 1 && (
          <div className="dpw-vistas" role="group" aria-label="Vistas de presentación">
            {(
              [
                ['vista-normal', '▣', 'Normal'],
                ['vista-clasificador', '⊞', 'Clasificador de diapositivas'],
                ['vista-lectura', '▭', 'Vista de lectura'],
              ] as const
            ).map(([id, glifo, nombre]) => (
              <button
                key={id}
                type="button"
                data-control={id}
                className={
                  (id === 'vista-clasificador' && vista === 'clasificador') ||
                  (id === 'vista-normal' && vista === 'normal')
                    ? 'es-activa'
                    : undefined
                }
                aria-label={nombre}
                aria-pressed={
                  id === 'vista-lectura'
                    ? undefined
                    : (id === 'vista-clasificador') === (vista === 'clasificador')
                }
                title={nombre}
                onClick={() => pulsar(id)}
              >
                <span aria-hidden="true">{glifo}</span>
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          className="dpw-repasar"
          data-control="repasar"
          disabled={cuantasDiapositivas(mazo) === 0}
          onClick={() => {
            setMazo((m) => irA(m, 0));
            setRevelados(pasoInicial(mazo.diapositivas[0]));
            setRepasando(true);
            // Repasar no vive en la cinta, pero es una herramienta del programa
            // y un encargo puede pedirlo. Si no pasara por aquí, el maestro no
            // se enteraría —el mismo agujero que tenían los `<select>`—.
            evaluar(mazo, { control: 'repasar' });
          }}
        >
          <Play size={13} strokeWidth={2.8} aria-hidden="true" /> Repasar
        </button>
        {/* El deslizador del zoom es el mando de «la última butaca» (§27.2), así
            que el aro tiene que poder apuntarle: sin `data-control` no existe
            para la guía, y bajar a mirar de lejos es un encargo de verdad. */}
        <div className="txtw-zoom-mando" data-control="zoom">
          <button
            type="button"
            aria-label="Alejar"
            onClick={() => {
              setZoomTocado(true);
              setZoom((z) => Math.max(ZOOM_MIN, z - 5));
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <Minus size={13} strokeWidth={2.6} />
          </button>
          <input
            type="range"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={5}
            value={zoom}
            aria-label="Zoom"
            onChange={(e) => {
              setZoomTocado(true);
              setZoom(Number(e.target.value));
            }}
          />
          <button
            type="button"
            aria-label="Acercar"
            onClick={() => {
              setZoomTocado(true);
              setZoom((z) => Math.min(ZOOM_MAX, z + 5));
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <Plus size={13} strokeWidth={2.6} />
          </button>
          <span className="txtw-zoom-cifra">{zoom}%</span>
        </div>
      </div>

      {accesorios}

      {/*
        ─── el Backstage ───
        Tapa la ventana entera, como en el programa: Archivo no es una pestaña
        más de la cinta, es salir del documento. Va DESPUÉS de `accesorios` y
        ANTES del aro para que la guía siga pudiendo señalar dentro de él.
      */}
      {Backstage && enArchivo && (
        <Backstage
          mazo={mazo}
          archivo={guion.archivo}
          cerrar={() => setEnArchivo(false)}
          avisar={(control) => evaluar(mazo, control ? { control } : {})}
          cambiar={cambiar}
        />
      )}

      {/*
        ─── el aro, y su nombre debajo ───
        Con el Backstage abierto no se pinta: el señalador apunta a la pestaña
        Archivo, y esa pestaña está debajo del propio Backstage. Se vio en la
        captura —un aro amarillo flotando sobre la columna naranja, encima de
        nada—. Un señalador que apunta a algo tapado no guía, despista.
      */}
      {caja && !enArchivo && (
        <div
          // `es-izq` cuando el rótulo, centrado, se saldría de la ventana: el
          // aro está bien puesto y aun así el nombre salía cortado.
          className={`txtw-halo${demostrando ? ' es-demo' : ''}${caja.l < 90 ? ' es-izq' : ''}`}
          aria-hidden="true"
          style={{ left: caja.l - 5, top: caja.t - 5, width: caja.w + 10, height: caja.h + 10 }}
        >
          {/*
            El nombre cuelga DEBAJO del botón, que es justo donde se abre su
            galería: con la galería abierta, el rótulo «SmartArt» se pintaba
            encima del nombre de la primera forma y la dejaba sin título. El aro
            se queda —sigue marcando el botón—; el nombre sobra, porque a esas
            alturas el alumno ya lo encontró.
          */}
          {rotulo && !galeria && (
            <span
              className="txtw-halo-rotulo"
              style={caja.pie !== null ? { top: caja.pie - (caja.t - 5) + 9 } : undefined}
            >
              {rotulo}
            </span>
          )}
        </div>
      )}

      {/* ─── donde la presentación se presenta ─── */}
      {repasando && activa && enEscena && Escenario && (
        <Escenario
          mazo={mazo}
          diapositiva={activa}
          indice={mazo.activa}
          total={cuantasDiapositivas(mazo)}
          irA={irEnEscena}
          salir={salirDeEscena}
          gesto={gestoEnEscena}
          pasoId={pasoActual?.id ?? null}
          terminado={terminado}
          abiertaCon={abiertaCon}
        />
      )}

      {/* ─── el repaso a pantalla completa ─── */}
      {repasando && activa && !enEscena && (
        <div className="dpw-repaso" role="dialog" aria-modal="true" aria-label="Repaso de la presentación">
          <div className="dpw-repaso-lienzo">
            {/*
              La `key` es la diapositiva, y no es aseo de React: sin ella el
              nodo se reutiliza al pasar de una a otra, la animación de entrada
              no se reinicia y la transición se ve UNA sola vez en toda la
              presentación —o sea, no se ve—. Con ella, cada diapositiva entra
              con su efecto, que es lo que la clase 4 pide juzgar.
            */}
            <div
              key={mazo.activa}
              className={`dpw-repaso-tela es-${transicionDe(activa)}`}
              style={{ animationDuration: `${duracionDe(activa)}s` }}
            >
              <Lamina
                mazo={mazo}
                diapositiva={activa}
                revelados={revelados}
                numero={pieDe(mazo, mazo.activa).numero}
                pie={pieDe(mazo, mazo.activa).texto}
                sonando={sonando}
                alSonar={tocarSonido}
                alSaltar={saltar}
              />
            </div>
          </div>
          <div className="dpw-repaso-barra">
            <button type="button" onClick={retrocederRepaso} aria-label="Anterior">
              ◀
            </button>
            <span>
              {mazo.activa + 1} / {cuantasDiapositivas(mazo)}
            </span>
            <button type="button" onClick={avanzarRepaso} aria-label="Siguiente">
              ▶
            </button>
            {pasosDeAnimacion(activa) > 0 && (
              <span className="dpw-repaso-pasos">
                {Math.min(revelados, pasosDeAnimacion(activa))} de {pasosDeAnimacion(activa)} en pantalla
              </span>
            )}
            {/*
              El cronómetro del ensayo. Enseña **lo que se va a contar**, no los
              segundos que llevas mirando: si pasas más rápido de lo que la
              diapositiva tarda en decirse, cuenta lo que tarda en decirse
              (§43.3.0). Enseñar el crudo y luego apuntar otra cosa en la hoja
              sería el motor mintiendo dos veces en la misma pantalla.
            */}
            {ensayando && (
              <span className="dpw-ensayo-reloj" data-ensayo-reloj>
                <b>{RELOJ(Object.values(medidas).reduce((a, b) => a + b, 0) + enCurso)}</b>
                <small>esta diapositiva {RELOJ(enCurso)}</small>
              </span>
            )}
            {/*
              Grabando: el punto rojo y el tiempo de ESTA diapositiva, no el
              total. Al ensayar importa el total —¿me paso de los diez minutos?—
              y al grabar importa la de delante, porque lo que se está guardando
              es ella sola y porque el que habla necesita saber cuánto lleva
              hablando. Dos relojes distintos porque son dos preguntas distintas.
            */}
            {grabando && (
              <span className="dpw-grabando" data-grabando>
                <i aria-hidden="true" />
                <b>REC {RELOJ(enCurso)}</b>
                <small>
                  diapositiva {mazo.activa + 1} de {mazo.diapositivas.length}
                </small>
              </span>
            )}
            {/*
              «Repetir ésta»: te trabaste, y no hay que volver a contarlas todas.

              Lo que hace es cerrar la cuenta de esta diapositiva y volver a
              ponerla a cero **sin pasar a la siguiente**, o sea `anotar` sobre
              la de delante. Guardar lo que llevabas antes de repetir puede
              parecer raro —PowerPoint tira la toma— y es a propósito: así una
              repetición es una toma más de esa diapositiva y la clase puede
              preguntar «¿repetiste sólo la tres?». La última siempre manda,
              que es lo que el alumno espera.
            */}
            {grabando && (
              <button type="button" className="dpw-repetir" data-repetir-esta onClick={() => anotar(mazo.activa)}>
                ⟲ Repetir ésta
              </button>
            )}
            <button
              type="button"
              className="es-salir"
              data-terminar-grabacion={grabando ? '' : undefined}
              onClick={() => (grabando ? cerrarEnsayo(mazo.activa) : setRepasando(false))}
            >
              {grabando ? 'Terminar la grabación' : ensayando ? 'Cancelar el ensayo' : 'Salir del repaso'}
            </button>
          </div>
        </div>
      )}

      {/* ─── el cuadro de la presentación personalizada (§43.5) ─── */}
      {/*
        El cuadro de «Sección» (§44.1). Es el hermano pequeño del de abajo: una
        sola pregunta, el nombre. Y dice **dónde va a empezar**, porque ésa es
        la parte que un alumno no adivina: una sección arranca en la diapositiva
        donde estabas, no en la que tú creías.
      */}
      {nombreSeccion !== null && (
        <div
          className="dpw-cuadro"
          role="dialog"
          aria-modal="true"
          aria-label="Nueva sección"
          data-cuadro="seccion"
        >
          <div className="dpw-cuadro-caja es-estrecho">
            <h3>Nueva sección</h3>
            <p className="dpw-cuadro-pie">
              Empieza en la diapositiva <b>{mazo.activa + 1}</b>, «{nombreDeDiapositiva(mazo, mazo.activa)}
              », y llega hasta la siguiente sección.
            </p>
            <label className="dpw-cuadro-campo">
              <span>Nombre de la sección</span>
              <input
                type="text"
                autoFocus
                value={nombreSeccion}
                data-campo="nombre-seccion"
                placeholder="Lo que medimos"
                onChange={(e) => setNombreSeccion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' || !nombreSeccion.trim()) return;
                  e.preventDefault();
                  const nuevo = crearSeccion(mazo, nombreSeccion, mazo.activa);
                  setNombreSeccion(null);
                  if (nuevo) cambiar(nuevo, { control: 'seccion' });
                }}
              />
            </label>
            <div className="dpw-cuadro-botones">
              <button type="button" className="es-secundario" onClick={() => setNombreSeccion(null)}>
                Cancelar
              </button>
              <button
                type="button"
                data-cuadro-aceptar
                disabled={!nombreSeccion.trim()}
                onClick={() => {
                  const nuevo = crearSeccion(mazo, nombreSeccion, mazo.activa);
                  setNombreSeccion(null);
                  if (nuevo) cambiar(nuevo, { control: 'seccion' });
                }}
              >
                Crear sección
              </button>
            </div>
          </div>
        </div>
      )}

      {/*
        ─── «Encabezado y pie» (§44.3) ───

        Tres ajustes en un cuadro, que es como están en PowerPoint y por qué
        están juntos: los tres contestan a la misma pregunta —¿qué sale abajo en
        todas?—. La casilla de la portada va **sangrada y debajo**, porque es
        una excepción a las dos de arriba y no un cuarto ajuste suelto.
      */}
      {enElPie !== null && (
        <div
          className="dpw-cuadro"
          role="dialog"
          aria-modal="true"
          aria-label="Encabezado y pie de página"
          data-cuadro="pie"
        >
          <div className="dpw-cuadro-caja es-estrecho">
            <h3>Encabezado y pie de página</h3>
            <p className="dpw-cuadro-pie">
              Lo que pongas aquí sale en <b>todas</b> las diapositivas. Se escribe una vez.
            </p>
            <label className="dpw-cuadro-fila">
              <input
                type="checkbox"
                data-campo="pie-numero"
                checked={enElPie.numero}
                onChange={(e) => setEnElPie({ ...enElPie, numero: e.target.checked })}
              />
              <span>
                Número de diapositiva
                <small>Para que alguien del público pueda preguntarte por una.</small>
              </span>
            </label>
            <label className="dpw-cuadro-campo">
              <span>Pie de página</span>
              <input
                type="text"
                autoFocus
                value={enElPie.pie}
                data-campo="pie-texto"
                placeholder="Escuela Secundaria 12"
                onChange={(e) => setEnElPie({ ...enElPie, pie: e.target.value })}
              />
            </label>
            <label className="dpw-cuadro-fila es-sangrada">
              <input
                type="checkbox"
                data-campo="pie-sin-portada"
                checked={enElPie.sinPieEnPortada}
                onChange={(e) => setEnElPie({ ...enElPie, sinPieEnPortada: e.target.checked })}
              />
              <span>
                No mostrar en la diapositiva de título
                <small>La portada va limpia. Es lo que se hace casi siempre.</small>
              </span>
            </label>
            <div className="dpw-cuadro-botones">
              <button type="button" className="es-secundario" onClick={() => setEnElPie(null)}>
                Cancelar
              </button>
              <button
                type="button"
                data-cuadro-aceptar
                onClick={() => {
                  const v = enElPie;
                  setEnElPie(null);
                  cambiar(ponerElPie(mazo, v), { control: 'pie' });
                }}
              >
                Aplicar a todas
              </button>
            </div>
          </div>
        </div>
      )}

      {/*
        ─── «Tamaño de diapositiva» (§44.3) ───

        Las dos formas **dibujadas a escala**, no descritas. «16:9» y «4:3» son
        dos parejas de números para quien ya sabe lo que significan; un alumno
        de sexto necesita ver que una es más ancha que la otra, y eso se enseña
        en un centímetro de pantalla.

        Y el aviso va **debajo y siempre**, no sólo al elegir la otra: lo que
        dice —que lo que colocaste se puede quedar fuera— es la lección de la
        clase, y una lección que sólo aparece cuando ya te equivocaste llega
        tarde.
      */}
      {eligiendoForma !== null && (
        <div
          className="dpw-cuadro"
          role="dialog"
          aria-modal="true"
          aria-label="Tamaño de diapositiva"
          data-cuadro="tamano"
        >
          <div className="dpw-cuadro-caja es-estrecho">
            <h3>Tamaño de diapositiva</h3>
            <div className="dpw-formas">
              {(Object.keys(FORMAS) as Forma[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`dpw-forma${eligiendoForma === f ? ' es-elegida' : ''}`}
                  data-forma={f}
                  aria-pressed={eligiendoForma === f}
                  onClick={() => setEligiendoForma(f)}
                >
                  <i
                    aria-hidden="true"
                    style={{ width: FORMAS[f].ancho / 8, height: LIENZO_ALTO / 8 }}
                  />
                  <b>{FORMAS[f].nombre}</b>
                  <small>{FORMAS[f].dondeSeVe}</small>
                  {(mazo.forma ?? '16-9') === f && <em>La que tiene ahora</em>}
                </button>
              ))}
            </div>
            <p className="dpw-cuadro-pie">
              Se cambia <b>de una vez para todas las diapositivas</b>. Los títulos y los cuadros de
              texto del acomodo se recolocan solos; lo que hayas puesto tú —fotos, formas, cajas
              movidas— <b>se queda donde está</b> y puede quedarse fuera de la pantalla.
            </p>
            <div className="dpw-cuadro-botones">
              <button type="button" className="es-secundario" onClick={() => setEligiendoForma(null)}>
                Cancelar
              </button>
              <button
                type="button"
                data-cuadro-aceptar
                disabled={eligiendoForma === (mazo.forma ?? '16-9')}
                onClick={() => {
                  const f = eligiendoForma;
                  setEligiendoForma(null);
                  if (f) cambiar(cambiarForma(mazo, f), { control: 'tamano-diapo' });
                }}
              >
                Cambiar el tamaño
              </button>
            </div>
          </div>
        </div>
      )}

      {/*
        ─── «¿Desde dónde grabo?» (§44.6) ───

        Dos botones y ninguno por omisión. El de la derecha dice el número de
        la diapositiva en la que estás, porque «la actual» no es un sitio: el
        alumno tiene que poder comprobar que va a repetir la que quería antes
        de que el punto rojo se encienda.
      */}
      {grabarDesde && (
        <div
          className="dpw-cuadro"
          role="dialog"
          aria-modal="true"
          aria-label="Grabar la presentación"
          data-cuadro="grabar-desde"
        >
          <div className="dpw-cuadro-caja es-estrecho">
            <h3>Grabar la presentación</h3>
            <p className="dpw-cuadro-pie">
              Se abre a pantalla completa con el punto rojo. Cuenta lo que tardas en cada
              diapositiva y se queda con tu voz. Cuando termines, pulsa «Terminar la grabación».
            </p>
            <div className="dpw-cuadro-botones">
              <button type="button" className="es-secundario" onClick={() => setGrabarDesde(false)}>
                Cancelar
              </button>
              <button
                type="button"
                data-grabar-desde="esta"
                onClick={() => {
                  setGrabarDesde(false);
                  arrancarPresentacion('grabar', mazo.activa, false);
                }}
              >
                Desde ésta (la {mazo.activa + 1})
              </button>
              <button
                type="button"
                data-cuadro-aceptar
                data-grabar-desde="principio"
                onClick={() => {
                  setGrabarDesde(false);
                  arrancarPresentacion('grabar', 0, false);
                }}
              >
                Desde el principio
              </button>
            </div>
          </div>
        </div>
      )}

      {/*
        ─── la advertencia de «Quitar la narración» (§44.6) ───

        El cuadro que hace de freno. Dice TRES cosas y las tres hacen falta:
        cuántas voces se van —un número, no «la narración», porque el alumno
        sabe cuánto le costó cada una—, que **los tiempos se quedan**, que es
        justo lo que nadie espera y lo que hace que este botón sea útil en vez
        de un botón de arrepentirse, y que esto no se deshace.

        El botón que borra viene en rojo y NO es el que está enfocado. La
        pregunta de un cuadro así no se contesta con la tecla Intro sin leer.
      */}
      {quitandoVoz && (
        <div
          className="dpw-cuadro"
          role="dialog"
          aria-modal="true"
          aria-label="Quitar la narración"
          data-cuadro="quitar-narracion"
        >
          <div className="dpw-cuadro-caja es-estrecho">
            <h3>¿Quitar la narración?</h3>
            <p className="dpw-cuadro-pie">
              Se borrará tu voz de <b>{cuantasNarradas(mazo)}</b>{' '}
              {cuantasNarradas(mazo) === 1 ? 'diapositiva' : 'diapositivas'}. Los tiempos que
              grabaste <b>se quedan</b>: la presentación seguirá pasando sola, pero en silencio.
            </p>
            <p className="dpw-cuadro-pie">Esto no se puede deshacer.</p>
            <div className="dpw-cuadro-botones">
              <button
                type="button"
                className="es-secundario"
                autoFocus
                onClick={() => setQuitandoVoz(false)}
              >
                Conservar la voz
              </button>
              <button
                type="button"
                className="es-peligro"
                data-cuadro-aceptar
                onClick={() => {
                  setQuitandoVoz(false);
                  cambiar(quitarNarracion(mazo), { control: 'quitar-narracion' });
                }}
              >
                Quitar la narración
              </button>
            </div>
          </div>
        </div>
      )}

      {/*
        ─── «Diapositivas del esquema» (§44.5) ───

        Enseña el documento de Word **con sus títulos marcados** y, al lado, lo
        que va a salir. Las dos mitades se derivan de la misma lista, así que el
        previo no puede prometer un reparto distinto del que hace.

        Y enseña también los párrafos normales, en gris y sin marca: son los que
        NO se convierten, y verlos ahí es la mitad de la lección — un documento
        se convierte solo si está escrito con estilos, no si está escrito con
        negrita grande.
      */}
      {verElEsquema && esquemaDeWord && (
        <div
          className="dpw-cuadro"
          role="dialog"
          aria-modal="true"
          aria-label="Diapositivas del esquema"
          data-cuadro="esquema"
        >
          <div className="dpw-cuadro-caja es-ancho">
            <h3>Diapositivas del esquema</h3>
            <p className="dpw-cuadro-pie">
              De <b>{esquemaDeWord.nombre}</b>. Cada <b>Título 1</b> es una diapositiva y cada{' '}
              <b>Título 2</b>, una viñeta suya.
            </p>
            <div className="dpw-esquema">
              <div className="dpw-esquema-hoja" data-esquema-hoja>
                {esquemaDeWord.renglones.map((r, i) => (
                  <p
                    key={i}
                    className={r.nivel ? `dpw-esq-t${r.nivel}` : 'dpw-esq-normal'}
                    data-esquema-nivel={r.nivel ?? 0}
                  >
                    {r.nivel && <b aria-hidden="true">T{r.nivel}</b>}
                    <span>{r.texto}</span>
                  </p>
                ))}
              </div>
              <div className="dpw-esquema-saldran">
                <p className="dpw-esquema-cuenta" data-esquema-cuenta>
                  Saldrán <b>{cuantasSaldran(esquemaDeWord.renglones)}</b> diapositivas
                </p>
                <ul>
                  {aDiapositivas(esquemaDeWord.renglones).map((d, i) => (
                    <li key={i} className="dpw-esquema-previo" data-esquema-previo={i}>
                      <span className="dpw-esquema-lamina">
                        <Lamina mazo={{ ...mazo, diapositivas: [d], activa: 0 }} diapositiva={d} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="dpw-cuadro-botones">
              <button
                type="button"
                className="es-secundario"
                onClick={() => setVerElEsquema(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                data-cuadro-aceptar
                onClick={() => {
                  const nuevas = aDiapositivas(esquemaDeWord.renglones);
                  setVerElEsquema(false);
                  if (!nuevas.length) return;
                  // Por `traerVarias` y no con un `splice` aquí: escrito a mano
                  // se olvidaba de correr los cortes de sección y el índice del
                  // encargo siguiente apuntaba a otra diapositiva.
                  cambiar(traerVarias(mazo, nuevas), { control: 'esquema-word' });
                }}
              >
                Insertar
              </button>
            </div>
          </div>
        </div>
      )}

      {enPersonalizada && (
        <div
          className="dpw-cuadro"
          role="dialog"
          aria-modal="true"
          aria-label="Presentación personalizada"
          data-cuadro="personalizada"
        >
          <div className="dpw-cuadro-caja">
            <h3>Presentación personalizada</h3>
            <p className="dpw-cuadro-pie">
              Una lista con nombre. La misma presentación sirve para tres públicos sin hacer tres archivos.
            </p>
            <label className="dpw-cuadro-campo">
              <span>Nombre de la presentación</span>
              <input
                type="text"
                value={nombrePers}
                data-campo="nombre-personalizada"
                placeholder="Para el jurado"
                onChange={(e) => setNombrePers(e.target.value)}
              />
            </label>
            <p className="dpw-cuadro-etiqueta">Diapositivas que entran, en el orden en que las elijas</p>
            <ul className="dpw-cuadro-lista">
              {mazo.diapositivas.map((_, i) => {
                const puesto = elegidasPers.indexOf(i);
                return (
                  <li key={i}>
                    <button
                      type="button"
                      className={`dpw-cuadro-fila${puesto >= 0 ? ' es-puesta' : ''}`}
                      data-elegir={i}
                      aria-pressed={puesto >= 0}
                      onClick={() =>
                        setElegidasPers((v) => (v.includes(i) ? v.filter((x) => x !== i) : [...v, i]))
                      }
                    >
                      {/*
                        El número que se ve es el ORDEN EN LA LISTA, no el de la
                        diapositiva: es lo que hace visible que una personalizada
                        puede cambiar el orden, que es media herramienta. El de
                        la diapositiva va detrás, entre paréntesis.
                      */}
                      <i className="dpw-cuadro-orden" aria-hidden="true">
                        {puesto >= 0 ? puesto + 1 : ''}
                      </i>
                      <b>{nombreDeDiapositiva(mazo, i)}</b>
                      <small>diapositiva {i + 1}</small>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="dpw-cuadro-botones">
              <button type="button" className="es-secundario" onClick={() => setEnPersonalizada(false)}>
                Cancelar
              </button>
              <button
                type="button"
                data-cuadro-aceptar
                disabled={!nombrePers.trim() || elegidasPers.length === 0}
                onClick={() => {
                  const nuevo = crearPersonalizada(mazo, nombrePers, elegidasPers);
                  setEnPersonalizada(false);
                  if (nuevo) cambiar(nuevo, { control: 'personalizada' });
                }}
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── portada de la práctica ─── */}
      {guion.portada && portadaAbierta && (
        <PortadaPractica
          portada={guion.portada}
          archivo={guion.archivo}
          encargos={guion.pasos.length}
          minutos={minutos}
          insignia={insignia}
          onEmpezar={cerrarPortada}
          esRepaso={yaEmpezo}
          guardado={false}
          onEmpezarDeCero={() => {
            setMazo(guion.mazo());
            antes.current = [];
            despues.current = [];
            setSinGuardar(false);
            setPaso(0);
            setFallos(0);
            setTropiezos(0);
            setRehacer(false);
          }}
          abrir="Abrir la presentación"
          volver="Volver a la presentación"
        />
      )}

      {/* ─── insignia ─── */}
      {mostrandoInsignia && insignia && (
        <div className="txtw-final" role="dialog" aria-modal="true" aria-label="Ejercicio completado" ref={finalRef}>
          <div className="txtw-final-caja">
            <div className="txtw-medalla" aria-hidden="true">
              <span>{insignia.emoji}</span>
            </div>
            <p className="txtw-final-kicker">Insignia conseguida</p>
            <h2>{insignia.nombre}</h2>
            <p className="txtw-final-titulo">{insignia.titulo}</p>
            {/* Con sus negritas: las dieciséis insignias las escriben y hasta hoy
                se veían con los asteriscos puestos, en la pantalla que remata la
                clase — la que el alumno mira más rato de todas. */}
            <p className="txtw-final-detalle">
              <ConNegritas texto={insignia.detalle} />
            </p>
            <div className="txtw-final-cifras">
              <span>
                <b>{guion.pasos.length}</b> encargos
              </span>
              <span>
                <b>{tropiezos}</b> tropiezos
              </span>
            </div>
            <div className="txtw-final-botones">
              <button type="button" className="txtw-final-boton es-secundario" onClick={() => setOculto(true)}>
                Seguir con la presentación
              </button>
              {onSalir && (
                <button type="button" className="txtw-final-boton" onClick={onSalir}>
                  Salir del laboratorio
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // El hueco tarda un cuadro en existir; hasta entonces no hay nada que pintar.
  return hueco ? createPortal(ventana, hueco) : null;
}
