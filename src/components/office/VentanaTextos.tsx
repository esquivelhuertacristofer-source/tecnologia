'use client';

import { Minus, Plus, Redo2, Save, Undo2, X } from 'lucide-react';
import { closeHistory, redo, undo } from 'prosemirror-history';
import type { Command, EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Pestana, PestanaId } from '@/components/activities/office/tecniaTextos';
import {
  cambiarFuente,
  cambiarTamano,
  ejecutar,
  ES_INTERRUPTOR,
  estaActivo,
  estaInerte,
  existe,
  type ControlesDeClase,
  tamanoVisible,
  valorDeMarca,
} from './motor/comandos';
import { contarPalabras } from './motor/consultas';
import { esquema, FUENTES, TAMANOS } from './motor/esquema';
import {
  explicarDesvio,
  QUE_HACE,
  QUE_HACE_PESTANA,
  ubicar,
  ubicarPestana,
  type Ubicacion,
} from './motor/guia';
import type { GuionClase, PasoClase } from './motor/guion';
import {
  CONTENIDO_ANCHO,
  HUECO,
  MARGEN,
  PAGINA_ALTO,
  PAGINA_ANCHO,
  paginaDelCursor,
  PASO_PAGINA,
} from './motor/paginador';
import { useEditorTextos } from './motor/useEditor';
import { esDesvio, useCajaDelObjetivo, useHuecoEnElBody } from './chrome/ganchos';
import {
  BotonCinta,
  PanelMaestro,
  PortadaPractica,
  type Recado,
} from './chrome/piezas';
import './ventanaTextos.css';

export type { Recado };

/**
 * Cómo se empaqueta cada grupo de la cinta de Word.
 *
 * Word no usa una sola rejilla para todos: el botón grande de Pegar ocupa los dos
 * renglones, las herramientas de la letra van en una fila bajo los desplegables, y
 * las del párrafo en dos filas de cinco —que es lo que deja las cuatro alineaciones
 * juntas abajo—. Se quedó aquí al sacar el chrome: es del programa, no de la suite.
 */
const DISPOSICION: Record<string, { cols?: number; grande?: boolean }> = {
  portapapeles: { grande: true },
  fuente: { cols: 6 },
  parrafo: { cols: 5 },
  tablas: { grande: true },
  ilustraciones: { cols: 1 },
  texto: { cols: 1 },
  'encabezado-pie': { cols: 1 },
  configurar: { cols: 1 },
  tdc: { cols: 1 },
  notas: { grande: true },
  revision: { cols: 1 },
  comentarios: { grande: true },
  seguimiento: { cols: 1 },
  iniciar: { grande: true },
  campos: { cols: 1 },
  finalizar: { grande: true },
  'zoom-grupo': { cols: 1 },
};

/**
 * Tecnia Textos — la ventana entera (doc §36).
 *
 * Esto no es una interfaz dibujada encima de otra cosa: es el programa. El
 * alumno escribe de verdad, sobre hojas Carta de verdad que se paginan solas
 * mientras teclea, con una cinta cuyos botones ejecutan comandos de verdad y se
 * hunden solos cuando el formato ya está puesto donde tiene el cursor.
 *
 * A la derecha, acoplado como un panel de tareas de Word —no flotando encima—,
 * está el maestro: dice qué hacer, señala con un halo el sitio VIVO de la cinta
 * donde mirar, y corrige leyendo el documento.
 */


/**
 * La galería de estilos, tal cual la de Word: cajitas con «Aa» dibujado EN el
 * estilo que aplican. Es el sitio donde mejor se ve la lección de §33 —que
 * Título 1 no es «negrita más grande» sino otro estilo—, y con tres botones
 * anchos normales esa lección no se ve.
 */
const ESTILOS_GALERIA = [
  { id: 'normal', nombre: 'Normal' },
  { id: 'titulo1', nombre: 'Título 1' },
  { id: 'titulo2', nombre: 'Título 2' },
  { id: 'wordart', nombre: 'Título arte' },
];

function GaleriaEstilos({
  estado,
  onPulsar,
  disponibles,
}: {
  estado: EditorState | null;
  onPulsar: (id: string) => void;
  disponibles: string[];
}) {
  return (
    <div className="txtw-galeria">
      {ESTILOS_GALERIA.filter((e) => disponibles.includes(e.id)).map((e) => (
        <button
          key={e.id}
          type="button"
          data-control={e.id}
          className={`txtw-estilo${estado && estaActivo(estado, e.id) ? ' es-activo' : ''}`}
          title={e.nombre}
          aria-label={`Estilo ${e.nombre}`}
          aria-pressed={estado ? estaActivo(estado, e.id) : false}
          onMouseDown={(ev) => ev.preventDefault()}
          onClick={() => onPulsar(e.id)}
        >
          <span className={`txtw-estilo-aa es-${e.id}`} aria-hidden="true">
            Aa
          </span>
          <span className="txtw-estilo-nombre">{e.nombre}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Los dos desplegables que hacen que el grupo Fuente sea el de Word.
 *
 * Pasan por `onAplicado` como cualquier botón: elegir 20 pt con el cursor suelto
 * y sin selección es el fracaso que la clase 1 está construida para provocar
 * —y para el que tiene la pista escrita palabra por palabra—, y antes no
 * disparaba absolutamente nada porque el maestro sólo se enteraba de lo que
 * pasaba por la cinta.
 */
function SelectoresDeFuente({
  estado,
  onAplicado,
}: {
  estado: EditorState;
  onAplicado: (id: string, comando: Command) => void;
}) {
  const familia = valorDeMarca(estado, esquema.marks.fuente, 'familia', FUENTES[0].css as string);
  const pt = tamanoVisible(estado);
  return (
    <div className="txtw-fuente-combo">
      <select
        className="txtw-select es-familia"
        data-control="fuente-familia"
        aria-label="Tipo de letra"
        value={familia}
        onChange={(e) => onAplicado('fuente-familia', cambiarFuente(e.target.value))}
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
        value={pt}
        onChange={(e) => onAplicado('fuente-tamano', cambiarTamano(Number(e.target.value)))}
      >
        {TAMANOS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}


/* ─────────────────────────── la ventana ─────────────────────────── */

export interface VentanaTextosProps {
  cinta: Pestana[];
  guion: GuionClase;
  /** Fracción 0–1 de pasos resueltos. */
  onAvance?: (avance: number) => void;
  onTerminado?: (r: { pasos: number; tropiezos: number; segundos: number }) => void;
  /**
   * Herramientas que aporta ESTA clase y que el motor no trae.
   *
   * Es la vía para que una clase añada «Buscar y reemplazar» o «Insertar tabla
   * de contenido» sin tocar `comandos.ts`: cada clase construye lo suyo en su
   * propio archivo y las 154 del temario se pueden construir en paralelo.
   */
  controles?: ControlesDeClase;
  /** Lo que la clase quiera pintar dentro de la ventana: un panel, un diálogo. */
  accesorios?: React.ReactNode;
  onSalir?: () => void;
  /** La insignia de la clase. Sin ella no se cierra el ciclo. */
  insignia?: { nombre: string; emoji: string; titulo: string; detalle: string };
  /** Duración estimada, para el dato de la portada. */
  minutos?: number;
}

const ZOOM_MIN = 50;
const ZOOM_MAX = 200;

export default function VentanaTextos({
  cinta,
  guion,
  onAvance,
  onTerminado,
  onSalir,
  insignia,
  minutos,
  controles,
  accesorios,
}: VentanaTextosProps) {
  const hueco = useHuecoEnElBody();
  const raiz = useRef<HTMLDivElement | null>(null);
  const [pestana, setPestana] = useState<PestanaId>('inicio');
  const [zoom, setZoom] = useState(100);
  /** Mientras el alumno no toque el zoom, la hoja se ajusta sola a la ventana. */
  const [zoomTocado, setZoomTocado] = useState(false);
  const lienzo = useRef<HTMLDivElement | null>(null);
  const [paso, setPaso] = useState(0);
  const [tropiezos, setTropiezos] = useState(0);
  const [fallos, setFallos] = useState(0);
  const [celebrando, setCelebrando] = useState(false);
  const [terminado, setTerminado] = useState(false);
  const [oculto, setOculto] = useState(false);
  // La portada se ve al entrar y se puede volver a abrir desde el panel.
  const [portadaAbierta, setPortadaAbierta] = useState(Boolean(guion.portada));
  const [yaEmpezo, setYaEmpezo] = useState(false);
  const [erro, setErro] = useState(false);
  /**
   * Un recado del programa: «ese botón todavía no está», o el desvío completo
   * de quien pulsó el equivocado (§37.3, pieza 4). Es un objeto y no una cadena
   * porque el desvío tiene tres partes que hacen falta las tres: qué pulsó, qué
   * hace eso, y adónde tiene que ir.
   */
  const [aviso, setAviso] = useState<Recado | null>(null);
  /** «Enséñamelo»: el señalador se agranda unos segundos sin pulsar nada. */
  const [demostrando, setDemostrando] = useState(false);
  /** Se retrocedió porque el alumno deshizo algo que ya tenía hecho. */
  const [rehacer, setRehacer] = useState(false);
  /** Hay cambios que no están guardados. El letrero de arriba lo dice. */
  const [sinGuardar, setSinGuardar] = useState(false);

  const desdeCinta = useRef(false);
  /** El último control que falló, para no cobrar dos veces por insistir. */
  const ultimoFallo = useRef<string | null>(null);
  const relojRef = useRef<number>(0);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pasoActual: PasoClase | undefined = guion.pasos[paso];

  /* ── avanzar ─────────────────────────────────────────────────────────── */

  const acertar = useCallback(() => {
    // Dos caminos pueden dar por bueno el mismo encargo en el mismo cuadro —el
    // cambio del documento y el gesto de la cinta—; sin esto quedaban dos
    // temporizadores vivos y el panel se saltaba un encargo.
    if (temporizador.current) clearTimeout(temporizador.current);
    setCelebrando(true);
    setErro(false);
    setAviso(null);
    temporizador.current = setTimeout(() => {
      setCelebrando(false);
      setFallos(0);
      setPaso((p) => {
        const siguiente = p + 1;
        if (siguiente >= guion.pasos.length) {
          setTerminado(true);
          return p;
        }
        return siguiente;
      });
    }, 1500);
  }, [guion.pasos.length]);

  /**
   * El primer encargo ya palomeado que ha dejado de cumplirse, o −1.
   *
   * El motor promete corregir LEYENDO el documento, y esa promesa tiene una
   * segunda mitad que faltaba: si el alumno deshace lo que ya tenía hecho, deja
   * de estar hecho. Sin esto se podía terminar la clase con la insignia, cero
   * tropiezos y el documento exactamente igual que al abrirlo —bastaban cuatro
   * clics en la flecha de deshacer—, que es la forma más limpia de enseñar que
   * al programa se le puede engañar.
   */
  const primerDeshecho = useCallback(
    (estado: EditorState) => {
      const hasta = celebrando ? paso + 1 : paso;
      for (let i = 0; i < Math.min(hasta, guion.pasos.length); i += 1) {
        const l = guion.pasos[i].logro;
        if (l.tipo === 'documento' && !l.comprueba(estado.doc)) return i;
      }
      return -1;
    },
    [celebrando, guion.pasos, paso],
  );

  const evaluar = useCallback(
    (estado: EditorState, gesto: { control?: string; pestana?: PestanaId }) => {
      if (terminado || portadaAbierta || !pasoActual) return;

      // Se comprueba ANTES de la celebración a propósito: deshacer dentro del
      // segundo y medio del «¡Eso es!» también colaba.
      const deshecho = primerDeshecho(estado);
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
      if (celebrando) return;

      const l = pasoActual.logro;
      let logrado = false;
      if (l.tipo === 'documento') logrado = l.comprueba(estado.doc);
      else if (l.tipo === 'control') logrado = gesto.control === l.control;
      else if (l.tipo === 'pestana') logrado = gesto.pestana === l.pestana;

      if (logrado) {
        setRehacer(false);
        ultimoFallo.current = null;
        acertar();
        return;
      }
      /*
       * Sólo pulsar un control cuenta como intento. Cambiar de pestaña es
       * explorar, y explorar es exactamente lo que esta unidad pide.
       *
       * Insistir con el MISMO control no cobra dos veces. La ayuda sí escala
       * —para eso están los fallos—, pero la nota no: seis flechas seguidas en
       * el cuadro de tamaño son un desplegable manejado con el teclado, no seis
       * errores distintos, y bajaban la nota de 94 a 64.
       *
       * ── DEFECTO DE MOTOR, CORREGIDO AQUÍ EL 15-AGO-2026 ────────────────────
       *
       * **Pulsar exactamente el botón al que apunta el señalador no puede
       * costar un tropiezo.** Costaba uno, y esta ventana era la única de las
       * tres de la suite que lo cobraba: `VentanaHojas` sólo suma tropiezos
       * dentro de `esDesvioYSeAvisa`, o sea únicamente cuando el alumno se va
       * por donde no debía. Dos ventanas del mismo Office llevando la cuenta de
       * los errores con dos criterios distintos es, de por sí, un defecto: la
       * nota de un alumno cambiaba según en qué programa estuviera trabajando.
       *
       * Muerde en todo encargo que se resuelva con **varias pulsaciones del
       * mismo botón sobre sitios distintos** —«ponle Título 2 a los cuatro
       * rótulos», «pon en viñetas estos dos párrafos»—: las tres primeras no
       * cierran el encargo, así que se cobraban como fallos aunque fueran
       * literalmente lo que se pedía. Medido en `n10-portafolio-y-cv`: partida
       * perfecta, 2 tropiezos, nota 88 y dos estrellas.
       *
       * No es nuevo y no es mío: `of-word-guardar-e-imprimir` lo tenía medido
       * desde su construcción («4 tropiezos y nota 76 en la primera pasada de
       * punta a punta sin un solo error del alumno»), lo dejó **pedido por
       * escrito** en la cabecera de su `Lab.tsx` —«el arreglo de verdad es del
       * motor»— y mientras tanto se descontaba 2 puntos a mano en su propia
       * calificación. Un descuento en una clase es un parche; el defecto vivía
       * aquí. Con esto arreglado, aquel descuento baja a 0 el mismo día, que es
       * justo lo que su comentario decía que había que hacer.
       *
       * `fallos` **sí** sigue subiendo, y a propósito: es lo que hace aparecer
       * la pista y bajar el aro al botón exacto. Pulsar el botón correcto y que
       * el encargo no se cierre es un buen momento para que la ventana ayude —
       * lo que no es, es un error que se le cobre al alumno.
       *
       * La señal puede nombrar varios botones separados por comas desde el
       * 15-ago-2026 (`chrome/ganchos.ts`), así que se parte igual que allí: si
       * se comparara la cadena entera, un encargo de dos botones volvería a
       * cobrar por el segundo.
       */
      if (gesto.control) {
        setFallos((f) => f + 1);
        const senalados = (pasoActual.senal?.control ?? '').split(',').map((c) => c.trim());
        const esElQueSeSenala = senalados.includes(gesto.control);
        if (!esElQueSeSenala && ultimoFallo.current !== gesto.control) setTropiezos((t) => t + 1);
        ultimoFallo.current = gesto.control;
      }
    },
    [acertar, celebrando, pasoActual, portadaAbierta, primerDeshecho, terminado],
  );

  /* ── el editor ───────────────────────────────────────────────────────── */

  const alCambiar = useCallback(
    (v: EditorView, cambioElDocumento: boolean) => {
      if (cambioElDocumento) setSinGuardar(true);
      if (desdeCinta.current) return;
      evaluar(v.state, {});
    },
    [evaluar],
  );

  const { anfitrion, vista, pulso, paginado, guardar, empezarDeCero, vieneDeGuardado } = useEditorTextos(
    guion.html,
    alCambiar,
    guion.archivo,
  );

  const pulsar = useCallback(
    (id: string) => {
      if (!vista) return;
      /*
       * Un botón que el programa pinta apagado no puede castigar ni delatar. Sin
       * esto, los siete botones grises cobraban seis puntos por clic y al
       * segundo el halo saltaba al botón exacto: poner el dedo en un botón
       * muerto le resolvía el encargo al alumno sin que hubiera buscado nada, y
       * encima le bajaba la nota por hacerlo.
       */
      if (estaInerte(vista.state, id, controles)) {
        setAviso({
          titulo: existe(id, controles)
            ? 'Ese botón no se puede usar aquí. Fíjate dónde tienes el cursor.'
            : 'Ese botón todavía no está en esta clase. Lo verás más adelante.',
          queHace: QUE_HACE[id],
        });
        return;
      }
      setAviso(null);

      /*
       * El desvío se atiende, no se castiga (§37.3, pieza 4).
       *
       * Antes, pulsar el botón equivocado aplicaba el formato en silencio: la
       * cursiva y el subrayado se quedaban puestos, el documento se ensuciaba y
       * el alumno no sabía ni qué había tocado. Ahora el programa nombra lo que
       * pulsó, dice qué hace —lo lee de la misma tabla con la que lo enseña, así
       * que no puede contradecirse— y DESHACE el cambio accidental.
       *
       * El `closeHistory` de antes no es un adorno: `prosemirror-history` agrupa
       * los cambios cercanos en el tiempo, así que sin él un deshacer podría
       * llevarse por delante lo que el alumno acababa de teclear. Cerrando el
       * grupo primero, el deshacer alcanza exactamente al botón y a nada más.
       *
       * Cuándo es desvío y cuándo no lo decide `esDesvio`, que está debajo.
       */
      /*
       * Un encargo de MIRAR no cobra por tocar lo que él mismo está señalando.
       * Medido: en el encargo «fíjate en el botón hundido», pulsar justo ese
       * botón no era desvío —es el esperado— ni logro, así que `evaluar` cobraba
       * un tropiezo mudo y la clase acababa en 88 con un solo error de verdad.
       */
      if (pasoActual?.logro.tipo === 'confirma' && pasoActual.senal?.control === id) {
        setAviso({ titulo: 'No hace falta pulsarlo: con mirarlo basta.', queHace: QUE_HACE[id] });
        return;
      }

      const { desviado, esperado } = esDesvio(pasoActual, id);
      if (desviado) vista.dispatch(closeHistory(vista.state.tr));

      const antes = vista.state.doc;
      desdeCinta.current = true;
      ejecutar(vista, id, controles);
      desdeCinta.current = false;

      if (desviado) {
        if (vista.state.doc !== antes) undo(vista.state, vista.dispatch);
        const d = explicarDesvio(cinta, id, esperado);
        setAviso({ titulo: d.titulo, queHace: d.queHace, aDonde: d.aDonde });
      }

      evaluar(vista.state, { control: id });
    },
    [cinta, controles, evaluar, pasoActual, vista],
  );

  /**
   * Los desplegables de fuente: pasan por el mismo sitio que un botón.
   *
   * Y por el mismo desvío, que es lo que les faltaba: cambiar el tamaño de la
   * letra en un encargo que pedía otra cosa ensuciaba el documento en silencio,
   * igual que un botón, sólo que aquí nadie lo había mirado por ser un `select`.
   */
  const aplicarDeCombo = useCallback(
    (id: string, comando: Command) => {
      if (!vista) return;
      setAviso(null);

      const { desviado, esperado } = esDesvio(pasoActual, id);
      if (desviado) vista.dispatch(closeHistory(vista.state.tr));

      const antes = vista.state.doc;
      desdeCinta.current = true;
      comando(vista.state, vista.dispatch);
      desdeCinta.current = false;

      if (desviado) {
        if (vista.state.doc !== antes) undo(vista.state, vista.dispatch);
        const d = explicarDesvio(cinta, id, esperado);
        setAviso({ titulo: d.titulo, queHace: d.queHace, aDonde: d.aDonde });
      }

      evaluar(vista.state, { control: id });
    },
    [cinta, evaluar, pasoActual, vista],
  );

  const irAPestana = useCallback(
    (p: PestanaId) => {
      setPestana(p);
      if (vista) evaluar(vista.state, { pestana: p });
    },
    [evaluar, vista],
  );

  /*
   * El diálogo de la insignia es un diálogo de verdad: recibe el foco al salir,
   * lo atrapa mientras está abierto y se cierra con Escape. Sin esto, el
   * tabulador se paseaba por la cinta de detrás —que ya no se puede usar— y con
   * el teclado no había forma de llegar a sus dos botones.
   */
  const finalRef = useRef<HTMLDivElement | null>(null);
  const mostrandoInsignia = terminado && Boolean(insignia) && !oculto;
  useEffect(() => {
    if (!mostrandoInsignia) return undefined;
    const caja = finalRef.current;
    const id = requestAnimationFrame(() => caja?.querySelector<HTMLButtonElement>('.txtw-final-boton')?.focus());
    const teclas = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOculto(true);
        return;
      }
      if (e.key !== 'Tab' || !caja) return;
      const focos = Array.from(caja.querySelectorAll<HTMLElement>('button'));
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

  /*
   * Que la hoja quepa. En un portátil de aula de 1024×768 el lienzo mide 684 px
   * y la hoja 816: salía cortada por los DOS lados a la vez, sin margen
   * izquierdo y con el desplazamiento horizontal sin alcance para llegar al
   * canto. En una clase que se titula «las hojas», el canto del papel es el
   * contenido. En cuanto el alumno usa el mando del zoom, mandan sus manos.
   *
   * `hueco` está en las dependencias porque la ventana vive en un portal que
   * tarda un cuadro en existir: sin él, este efecto corre con el lienzo aún sin
   * montar, mide cero y no vuelve a mirar nunca. Es exactamente lo que le pasó
   * al halo cuando se movió la ventana al portal (§36.5 bis).
   */
  useEffect(() => {
    if (zoomTocado) return undefined;
    const ajustar = () => {
      const ancho = lienzo.current?.clientWidth ?? 0;
      if (ancho <= 0) return;
      const cabe = Math.floor(((ancho - 28) / PAGINA_ANCHO) * 10) * 10;
      setZoom(Math.max(ZOOM_MIN, Math.min(100, cabe)));
    };
    ajustar();
    window.addEventListener('resize', ajustar);
    return () => window.removeEventListener('resize', ajustar);
  }, [hueco, zoomTocado]);

  const cerrarPortada = useCallback(() => {
    setPortadaAbierta(false);
    // El cronómetro arranca aquí: leer los objetivos no es tiempo de práctica.
    if (!yaEmpezo) {
      relojRef.current = Date.now();
      setYaEmpezo(true);
    }
    vista?.focus();
  }, [vista, yaEmpezo]);

  /* ── halo ────────────────────────────────────────────────────────────── */

  /*
   * El señalador apunta al BOTÓN EXACTO desde el primer segundo (§37.1).
   *
   * Hasta el 10 de agosto señalaba el grupo y sólo bajaba al botón tras dos
   * fallos, a propósito: la idea era que el alumno aprendiera a buscar una
   * herramienta por lo que hace. El cliente lo revocó —quiere que se le guíe la
   * mano— y manda. Queda escrito para que nadie lo «arregle» de vuelta creyendo
   * que fue un descuido.
   *
   * Si el control vive en otra pestaña, primero señala la pestaña: no se puede
   * apuntar a un botón que no está en pantalla.
   */
  const selector = useMemo(() => {
    if (terminado || celebrando || portadaAbierta || !pasoActual?.senal) return null;
    const s = pasoActual.senal;
    const suPestana = s.control ? ubicar(cinta, s.control)?.pestanaId : s.pestana;
    if (suPestana && suPestana !== pestana) return `[data-pestana="${suPestana}"]`;
    if (s.pestana && s.pestana !== pestana) return `[data-pestana="${s.pestana}"]`;
    if (s.control) return `[data-control="${s.control}"]`;
    if (s.grupo) return `[data-grupo="${s.grupo}"]`;
    return null;
  }, [celebrando, cinta, pasoActual, pestana, portadaAbierta, terminado]);

  /**
   * Dónde vive la herramienta de este encargo, para la ficha y para el rótulo.
   * `null` en los encargos que no piden pulsar nada —los de decidir—, que por
   * eso mismo no llevan señalador.
   */
  /**
   * Dónde vive lo que este encargo señala, y su explicación.
   *
   * La pestaña vale como diana cuando el encargo se resuelve abriéndola: así
   * esos encargos también tienen ficha, domicilio y «Enséñamelo». Se busca por
   * el campo que la señal usa y no por el id a secas, porque `tabla` es a la vez
   * un botón y una pestaña y adivinarlo saldría mal justo ahí.
   */
  const { sitio, queHace, senalado } = useMemo((): {
    sitio: Ubicacion | null;
    queHace?: string;
    senalado?: string;
  } => {
    const s = pasoActual?.senal;
    if (s?.control) {
      return { sitio: ubicar(cinta, s.control), queHace: QUE_HACE[s.control], senalado: s.control };
    }
    if (s?.pestana && !s.grupo) {
      return { sitio: ubicarPestana(cinta, s.pestana), queHace: QUE_HACE_PESTANA[s.pestana] };
    }
    return { sitio: null };
  }, [cinta, pasoActual]);

  /** El nombre escrito al lado del señalador. Señalar sin nombrar no enseña. */
  const rotulo = useMemo(() => {
    if (!selector) return null;
    if (selector.startsWith('[data-pestana')) {
      const id = selector.slice(15, -2) as PestanaId;
      return cinta.find((p) => p.id === id)?.nombre ?? null;
    }
    return sitio?.etiqueta ?? null;
  }, [cinta, selector, sitio]);

  /** «Enséñamelo»: abre la pestaña que toca y agranda el señalador un momento. */
  const demostrar = useCallback(() => {
    if (sitio && sitio.pestanaId !== pestana) setPestana(sitio.pestanaId);
    setDemostrando(true);
    setTimeout(() => setDemostrando(false), 2600);
  }, [pestana, sitio]);

  const caja = useCajaDelObjetivo(
    raiz,
    selector,
    `${pulso}|${paso}|${fallos >= 2}|${pestana}|${hueco ? 1 : 0}|${portadaAbierta}`,
  );

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

  /* ── datos derivados para pintar ─────────────────────────────────────── */

  const pestanaActual = cinta.find((p) => p.id === pestana) ?? cinta[0];
  const escala = zoom / 100;
  const altoPila = paginado.paginas * PASO_PAGINA - HUECO;
  const palabras = vista ? contarPalabras(vista.state.doc) : 0;

  const ventana = (
    <div className="txtw" ref={raiz} data-pulso={pulso}>
      {/* ─── barra de título ─── */}
      <div className="txtw-titulo">
        <span className="txtw-marca" aria-hidden="true">
          W
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
              setAviso({
                titulo: guardar()
                  ? 'Guardado en este equipo. Si cierras y vuelves, tu documento sigue aquí.'
                  : 'No se pudo guardar en este equipo.',
              });
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
            onClick={() => vista && (undo(vista.state, vista.dispatch), vista.focus())}
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
            onClick={() => vista && (redo(vista.state, vista.dispatch), vista.focus())}
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
        <span className="txtw-programa">Tecnia Textos</span>
        {onSalir && (
          <button type="button" className="txtw-cerrar" onClick={onSalir} aria-label="Salir del laboratorio">
            <X size={17} strokeWidth={2.4} />
          </button>
        )}
      </div>

      {/* ─── pestañas ─── */}
      <div className="txtw-pestanas" role="tablist" aria-label="Cinta de opciones">
        {/*
          Es la pestaña más llamativa de la ventana —azul llena, letra blanca— y
          por eso es la primera que un niño pulsa. Callarse era lo peor que podía
          hacer: ahora contesta, y para el teclado y el lector de pantalla se
          anuncia como lo que es, algo que todavía no está.
        */}
        <button
          type="button"
          className="txtw-pestana es-archivo"
          data-pestana="archivo"
          title="Archivo · lo usarás en la clase de guardar e imprimir"
          aria-disabled="true"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            setAviso({ titulo: '«Archivo» es para guardar e imprimir. Eso lo verás en otra clase.' })
          }
        >
          Archivo
        </button>
        {cinta.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={p.id === pestana}
            data-pestana={p.id}
            className={`txtw-pestana${p.id === pestana ? ' es-activa' : ''}`}
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
                {g.id === 'fuente' && vista && (
                  <SelectoresDeFuente estado={vista.state} onAplicado={aplicarDeCombo} />
                )}
                {g.id === 'estilos' ? (
                  <GaleriaEstilos
                    estado={vista?.state ?? null}
                    onPulsar={pulsar}
                    disponibles={g.controles.map((c) => c.id)}
                  />
                ) : (
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
                        activo={vista ? estaActivo(vista.state, c.id, controles) : false}
                        inerte={vista ? estaInerte(vista.state, c.id, controles) : true}
                        construido={existe(c.id, controles)}
                        esInterruptor={ES_INTERRUPTOR.has(c.id)}
                        onPulsar={pulsar}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="txtw-grupo-nombre">{g.nombre}</div>
            </div>
          );
        })}
      </div>

      {/* ─── documento + panel ─── */}
      <div className="txtw-medio">
        <div className="txtw-lienzo" ref={lienzo}>
          <div className="txtw-regla" style={{ width: PAGINA_ANCHO * escala }} aria-hidden="true">
            <span className="txtw-regla-texto" style={{ left: MARGEN * escala, width: CONTENIDO_ANCHO * escala }} />
          </div>
          <div
            className="txtw-zoom"
            style={{ width: PAGINA_ANCHO * escala, height: altoPila * escala }}
          >
            <div
              className="txtw-pila"
              style={{ width: PAGINA_ANCHO, height: altoPila, transform: `scale(${escala})` }}
            >
              {Array.from({ length: paginado.paginas }, (_, k) => (
                <div
                  key={k}
                  className="txtw-hoja"
                  style={{ top: k * PASO_PAGINA, width: PAGINA_ANCHO, height: PAGINA_ALTO }}
                  aria-hidden="true"
                />
              ))}
              <div className="txtw-anfitrion" ref={anfitrion} style={{ top: MARGEN, left: MARGEN, width: CONTENIDO_ANCHO }} />
            </div>
          </div>
        </div>

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
          sitio={sitio}
          queHace={queHace}
          senalado={senalado}
          onDemostrar={sitio ? demostrar : undefined}
          demostrando={demostrando}
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
        <span>
          Página {vista ? Math.min(paginaDelCursor(vista), paginado.paginas) : 1} de {paginado.paginas}
        </span>
        <span>{palabras} palabras</span>
        <span>Español (México)</span>
        <span className="txtw-estado-hueco" />
        <div className="txtw-zoom-mando">
          <button
            type="button"
            aria-label="Alejar"
            onClick={() => {
              setZoomTocado(true);
              setZoom((z) => Math.max(ZOOM_MIN, z - 10));
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <Minus size={13} strokeWidth={2.6} />
          </button>
          <input
            type="range"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={10}
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
              setZoom((z) => Math.min(ZOOM_MAX, z + 10));
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <Plus size={13} strokeWidth={2.6} />
          </button>
          <span className="txtw-zoom-cifra">{zoom}%</span>
        </div>
      </div>

      {/* Lo que la clase quiera pintar dentro del programa: su panel, su diálogo. */}
      {accesorios}

      {/* ─── el señalador: aro sobre el botón exacto, y su nombre debajo ─── */}
      {caja && (
        <div
          // `es-izq` cuando el rótulo, centrado, se saldría de la ventana: el
          // aro está bien puesto y aun así el nombre salía cortado.
          className={`txtw-halo${demostrando ? ' es-demo' : ''}${caja.l < 90 ? ' es-izq' : ''}`}
          aria-hidden="true"
          style={{ left: caja.l - 5, top: caja.t - 5, width: caja.w + 10, height: caja.h + 10 }}
        >
          {rotulo && (
            <span
              className="txtw-halo-rotulo"
              style={caja.pie !== null ? { top: caja.pie - (caja.t - 5) + 9 } : undefined}
            >
              {rotulo}
            </span>
          )}
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
          guardado={vieneDeGuardado}
          onEmpezarDeCero={() => {
            empezarDeCero();
            setSinGuardar(false);
            setPaso(0);
            setFallos(0);
            setTropiezos(0);
            setRehacer(false);
          }}
        />
      )}

      {/* ─── insignia ─── */}
      {terminado && insignia && !oculto && (
        <div className="txtw-final" role="dialog" aria-modal="true" aria-label="Ejercicio completado" ref={finalRef}>
          <div className="txtw-final-caja">
            <div className="txtw-medalla" aria-hidden="true">
              <span>{insignia.emoji}</span>
            </div>
            <p className="txtw-final-kicker">Insignia conseguida</p>
            <h2>{insignia.nombre}</h2>
            <p className="txtw-final-titulo">{insignia.titulo}</p>
            <p className="txtw-final-detalle">{insignia.detalle}</p>
            <div className="txtw-final-cifras">
              <span>
                <b>{guion.pasos.length}</b> encargos
              </span>
              <span>
                <b>{tropiezos}</b> tropiezos
              </span>
            </div>
            <div className="txtw-final-botones">
              {/* Terminar el ejercicio no puede cerrar el programa: el documento
                  sigue ahí y querer seguir jugando con él es buena señal. */}
              <button type="button" className="txtw-final-boton es-secundario" onClick={() => setOculto(true)}>
                Seguir escribiendo
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

  // El hueco tarda un cuadro en existir; hasta entonces no hay nada que pintar,
  // y montar la ventana en su sitio del árbol y moverla después haría que el
  // editor se creara dos veces.
  return hueco ? createPortal(ventana, hueco) : null;
}

