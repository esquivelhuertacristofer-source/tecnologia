'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import {
  CONTENIDO_ALTO,
  CONTENIDO_ANCHO,
  MARGEN,
  PAGINA_ALTO,
  PAGINA_ANCHO,
  PASO_PAGINA,
} from '@/components/office/motor/paginador';
import { ESTADO, type Zona } from './estado';
import { PLANTILLAS } from './plantillas';
import './estilo.css';

/**
 * Lo que esta clase pinta DENTRO del programa (prop `accesorios`).
 *
 * Son dos piezas y las dos están medidas contra el DOM vivo de la ventana, no
 * colocadas a ojo:
 *
 *  1. **La capa de encabezado y pie**, una franja por hoja. Se cuelga con un
 *     portal DENTRO de `.txtw-pila`, que es la pila de hojas de la ventana. No
 *     es un rodeo: la pila ya lleva el `transform: scale()` del zoom y ya vive
 *     en las coordenadas de maquetación que usa el paginador, así que
 *     posicionar una franja en `top: k · PASO_PAGINA + 42` la deja clavada en el
 *     margen superior de la hoja `k` **y a cualquier zoom**, y se desplaza con
 *     el documento sin escuchar un solo evento de scroll. Colocarla por fuera,
 *     midiendo la pantalla, obligaría a rehacer la cuenta en cada rueda del
 *     ratón y en cada cambio de zoom: eso es adivinar con pasos extra.
 *
 *  2. **La galería de plantillas**, que ocupa exactamente el área del documento
 *     —la de la izquierda— y NO la ventana entera. Si la tapara entera, taparía
 *     también el panel del maestro, y el alumno no podría leer el encargo que le
 *     está pidiendo elegir una plantilla. El rectángulo se mide del `.txtw-lienzo`
 *     de verdad con un `ResizeObserver`, no se calcula sumando alturas de CSS.
 *
 * Nada de esto flota como un panel genérico encima de la escena: la franja del
 * encabezado está dentro del papel, en el margen donde Word la dibuja, con su
 * línea punteada y su rótulo; y la galería es la pantalla «Nuevo» de Word puesta
 * donde va el documento.
 */

/* ── geometría de las franjas, en coordenadas de la hoja ──────────────────── */

/** A media pulgada del canto, que es donde Word pone el encabezado. */
const ZONA_ARRIBA = 42;
const ZONA_ALTO = 30;
const ZONA_ABAJO = PAGINA_ALTO - ZONA_ARRIBA - ZONA_ALTO;

/* ── medir la ventana ─────────────────────────────────────────────────────── */

interface Caja {
  l: number;
  t: number;
  w: number;
  h: number;
}

function raizDe(ancla: RefObject<HTMLElement | null>): HTMLElement | null {
  return (ancla.current?.closest('.txtw') as HTMLElement | null) ?? null;
}

/**
 * Busca un trozo de la ventana y no se rinde en el primer intento.
 *
 * El accesorio se pinta dentro de la misma ventana que está buscando, así que
 * al correr el efecto el DOM ya está entero. Aun así se reintenta durante unos
 * cuadros: el defecto de §36.5 bis (H) fue exactamente éste —una medida tomada
 * con el contenedor todavía vacío y ninguna dependencia que la volviera a
 * disparar— y salió gratis de prevenir.
 */
function useTrozo(ancla: RefObject<HTMLElement | null>, selector: string): HTMLElement | null {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    let vivo = true;
    let id = 0;
    let vueltas = 0;
    const busca = () => {
      if (!vivo) return;
      const hallado = raizDe(ancla)?.querySelector<HTMLElement>(selector) ?? null;
      if (hallado) setEl(hallado);
      else if (vueltas++ < 30) id = requestAnimationFrame(busca);
    };
    busca();
    return () => {
      vivo = false;
      cancelAnimationFrame(id);
    };
  }, [ancla, selector]);
  return el;
}

/** El rectángulo del área del documento, relativo a la ventana. */
function useCajaDe(ancla: RefObject<HTMLElement | null>, lienzo: HTMLElement | null): Caja | null {
  const [caja, setCaja] = useState<Caja | null>(null);
  useEffect(() => {
    const raiz = raizDe(ancla);
    if (!raiz || !lienzo) return undefined;
    const medir = () => {
      const a = raiz.getBoundingClientRect();
      const b = lienzo.getBoundingClientRect();
      setCaja({ l: b.left - a.left, t: b.top - a.top, w: b.width, h: b.height });
    };
    const id = requestAnimationFrame(medir);
    const ro = new ResizeObserver(medir);
    ro.observe(lienzo);
    ro.observe(raiz);
    window.addEventListener('resize', medir);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
      window.removeEventListener('resize', medir);
    };
  }, [ancla, lienzo]);
  return caja;
}

/**
 * Cuántas hojas hay dibujadas.
 *
 * Se leen del DOM y no se recalculan: el paginador es quien decide dónde acaba
 * una hoja, y una segunda cuenta paralela acabaría discrepando de la primera
 * —que es el defecto de §36.5, medir con un instrumento distinto del que se
 * usa—. El observador mira sólo los hijos de la pila, así que se entera cuando
 * el paginador añade o quita una hoja y no antes.
 */
function useHojas(pila: HTMLElement | null): number {
  const [hojas, setHojas] = useState(1);
  useEffect(() => {
    if (!pila) return undefined;
    const recuenta = () => setHojas(pila.querySelectorAll('.txtw-hoja').length || 1);
    recuenta();
    const mo = new MutationObserver(recuenta);
    mo.observe(pila, { childList: true });
    return () => mo.disconnect();
  }, [pila]);
  return hojas;
}

/* ── la capa de encabezado y pie ──────────────────────────────────────────── */

function Franja({
  zona,
  hoja,
  editando,
  texto,
  folio,
  onTexto,
  onAbrir,
  onCerrar,
  onQuitarNumero,
  refEntrada,
}: {
  zona: Zona;
  hoja: number;
  editando: boolean;
  texto: string;
  folio: number | null;
  onTexto: (t: string) => void;
  onAbrir: () => void;
  onCerrar: () => void;
  /** Sólo en el pie y sólo si hay número puesto. En Word es «Quitar números». */
  onQuitarNumero?: () => void;
  refEntrada?: RefObject<HTMLInputElement | null>;
}) {
  const arriba = zona === 'encabezado';
  const rotulo = arriba ? 'Encabezado' : 'Pie de página';
  return (
    <div
      className={`plt-zona${arriba ? ' es-arriba' : ' es-abajo'}${editando ? ' es-edita' : ''}`}
      style={{ top: arriba ? ZONA_ARRIBA : ZONA_ABAJO, left: MARGEN, width: CONTENIDO_ANCHO, height: ZONA_ALTO }}
      onDoubleClick={onAbrir}
      title={editando ? undefined : `Doble clic para editar el ${rotulo.toLowerCase()}`}
    >
      {editando && (
        <span className="plt-rotulo" aria-hidden="true">
          {rotulo}
        </span>
      )}
      {editando ? (
        <input
          ref={hoja === 0 ? refEntrada : undefined}
          className="plt-entrada"
          value={texto}
          aria-label={`${rotulo}, se repite en todas las hojas`}
          placeholder={
            arriba ? 'Escribe aquí lo que quieres que salga arriba de todas las hojas' : 'Texto del pie de página'
          }
          onChange={(e) => onTexto(e.target.value)}
        />
      ) : (
        <span className="plt-texto">{texto}</span>
      )}
      {!arriba && folio !== null && <span className="plt-folio">{folio}</span>}
      {editando && hoja === 0 && (
        <span className="plt-acciones">
          {onQuitarNumero && folio !== null && (
            <button
              type="button"
              className="plt-chip"
              data-plt-accion="quitar-numero"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onQuitarNumero}
            >
              Quitar el número
            </button>
          )}
          <button
            type="button"
            className="plt-chip es-cerrar"
            data-plt-accion="cerrar"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onCerrar}
          >
            Cerrar {rotulo.toLowerCase()}
          </button>
        </span>
      )}
    </div>
  );
}

/* ── la galería ───────────────────────────────────────────────────────────── */

/** La miniatura: una hoja de mentira con su encabezado, su cuerpo y su pie. */
function Miniatura({ acento }: { acento: string }) {
  return (
    <span className="plt-mini" style={{ '--acento': acento } as CSSProperties} aria-hidden="true">
      <span className="plt-mini-enc" />
      <span className="plt-mini-titulo" />
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className="plt-mini-linea" style={{ width: `${[100, 96, 88, 100, 72, 100, 94, 84, 60][i]}%` }} />
      ))}
      <span className="plt-mini-pie" />
    </span>
  );
}

/* ── el accesorio entero ──────────────────────────────────────────────────── */

export interface AccesoriosProps {
  /** Sube en cada cambio del estado de la clase; obliga a repintar la capa. */
  pulso: number;
  onElegirPlantilla: (id: string) => void;
  onTexto: (zona: Zona, texto: string) => void;
  onAbrirZona: (zona: Zona) => void;
  onCerrarZona: () => void;
  onQuitarNumero: () => void;
  onCerrarGaleria: () => void;
  /**
   * Avisa de que la pila de hojas cambió de tamaño.
   *
   * El último encargo se corrige contando hojas, y las hojas no las trae una
   * transacción del documento sino el paginador, un cuadro después. Sin este
   * aviso el encargo se cumplía «a la tecla siguiente» (ver `Lab.tsx`).
   */
  onHojas?: (hojas: number) => void;
}

export function AccesoriosPlantillas({
  pulso,
  onElegirPlantilla,
  onTexto,
  onAbrirZona,
  onCerrarZona,
  onQuitarNumero,
  onCerrarGaleria,
  onHojas,
}: AccesoriosProps) {
  const ancla = useRef<HTMLDivElement | null>(null);
  const entrada = useRef<HTMLInputElement | null>(null);
  const lienzo = useTrozo(ancla, '.txtw-lienzo');
  const pila = useTrozo(ancla, '.txtw-pila');
  const caja = useCajaDe(ancla, lienzo);
  const hojas = useHojas(pila);
  const zona = ESTADO.zona;
  const editando = zona !== 'ninguno';

  /*
   * En cuanto nace —o muere— una hoja, el laboratorio vuelve a corregir. La
   * cuenta sale del DOM que pinta el motor, así que no hay dos mediciones que
   * puedan discrepar: el aviso llega justo cuando la hoja ya está dibujada.
   */
  useEffect(() => {
    onHojas?.(hojas);
  }, [hojas, onHojas]);

  /*
   * Al abrir una zona, el cursor entra en ella y la hoja 1 sube a la vista. Sin
   * lo segundo, el alumno que estaba mirando la hoja 3 pulsa «Encabezado» y no
   * ve pasar nada: la franja se abre a dos mil píxeles de donde tiene los ojos.
   */
  useEffect(() => {
    if (!editando) return undefined;
    const id = requestAnimationFrame(() => {
      const el = entrada.current;
      if (!el) return;
      el.focus();
      // El cursor al final y NADA seleccionado: en Word entrar al pie no
      // selecciona lo que ya había, y seleccionarlo haría que la primera tecla
      // borrase el pie que trajo la plantilla.
      el.setSelectionRange(el.value.length, el.value.length);
      el.closest('.plt-zona')?.scrollIntoView({ block: 'center' });
    });
    return () => cancelAnimationFrame(id);
  }, [editando, zona]);

  /*
   * Se sale del encabezado como en Word: pulsando en el cuerpo del documento o
   * con Escape. El clic en la propia franja no cuenta, claro, ni el de la cinta
   * —desde ahí se salta del encabezado al pie sin cerrar nada—.
   */
  useEffect(() => {
    if (!editando) return undefined;
    const raton = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t || t.closest('.plt-zona')) return;
      if (t.closest('.txtw-lienzo')) onCerrarZona();
    };
    const teclas = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrarZona();
    };
    window.addEventListener('mousedown', raton, true);
    window.addEventListener('keydown', teclas);
    return () => {
      window.removeEventListener('mousedown', raton, true);
      window.removeEventListener('keydown', teclas);
    };
  }, [editando, onCerrarZona]);

  /*
   * La galería recibe el foco al abrirse y lo suelta al cerrarse. Sin esto, el
   * alumno que llega con el teclado abre una pantalla que ocupa todo el área del
   * documento y sigue tabulando por la cinta de detrás, que ya no se ve.
   */
  const tarjetas = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!ESTADO.galeria) return undefined;
    const id = requestAnimationFrame(() =>
      tarjetas.current?.querySelector<HTMLButtonElement>('.plt-tarjeta')?.focus(),
    );
    return () => cancelAnimationFrame(id);
    // `pulso` es lo que anuncia que `ESTADO.galeria` acaba de cambiar.
  }, [pulso]);

  const texto = useCallback((t: string) => onTexto(zona, t), [onTexto, zona]);

  const capa = (
    <div className="plt-capa" data-plt-hojas={hojas}>
      {Array.from({ length: hojas }, (_, k) => (
        <div
          key={k}
          className="plt-hoja"
          style={{ top: k * PASO_PAGINA, width: PAGINA_ANCHO, height: PAGINA_ALTO }}
        >
          {editando && (
            <span
              className="plt-velo"
              style={{ top: MARGEN, left: MARGEN, width: CONTENIDO_ANCHO, height: CONTENIDO_ALTO }}
              aria-hidden="true"
            />
          )}
          <Franja
            zona="encabezado"
            hoja={k}
            editando={zona === 'encabezado'}
            texto={ESTADO.encabezado}
            folio={null}
            onTexto={texto}
            onAbrir={() => onAbrirZona('encabezado')}
            onCerrar={onCerrarZona}
            refEntrada={entrada}
          />
          <Franja
            zona="pie"
            hoja={k}
            editando={zona === 'pie'}
            texto={ESTADO.pie}
            folio={ESTADO.numeroDePagina ? k + 1 : null}
            onTexto={texto}
            onAbrir={() => onAbrirZona('pie')}
            onCerrar={onCerrarZona}
            onQuitarNumero={onQuitarNumero}
            refEntrada={entrada}
          />
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* El ancla sirve para dos cosas: encontrar la ventana desde dentro sin
          preguntarle al documento entero, y llevar el pulso de la clase, que es
          lo que obliga a repintar la capa cuando cambia algo que no vive en el
          documento —el encabezado, el pie, el número—. */}
      <div ref={ancla} className="plt-ancla" data-plt-pulso={pulso} aria-hidden="true" />
      {pila && createPortal(capa, pila)}

      {ESTADO.galeria && caja && (
        <div
          className="plt-galeria"
          style={{ left: caja.l, top: caja.t, width: caja.w, height: caja.h }}
          role="dialog"
          aria-label="Plantillas del programa"
        >
          <div className="plt-galeria-caja">
            <header className="plt-galeria-cab">
              <span className="plt-galeria-kicker">Nuevo</span>
              <h2>Elige con qué empezar</h2>
              <p>
                Una plantilla es un documento ya armado: trae el texto, los títulos, el interlineado y hasta el pie
                de página puestos. Tú sólo cambias lo que es de tu escuela.
              </p>
              {ESTADO.plantilla !== null && (
                <button
                  type="button"
                  className="plt-galeria-x"
                  onClick={onCerrarGaleria}
                  aria-label="Cerrar la galería y volver al documento"
                >
                  <X size={16} strokeWidth={2.6} />
                </button>
              )}
            </header>
            <div className="plt-tarjetas" ref={tarjetas}>
              {PLANTILLAS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`plt-tarjeta${ESTADO.plantilla === p.id ? ' es-puesta' : ''}`}
                  data-plantilla={p.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onElegirPlantilla(p.id)}
                >
                  <Miniatura acento={p.acento} />
                  <span className="plt-tarjeta-nombre">{p.nombre}</span>
                  <span className="plt-tarjeta-para">{p.para}</span>
                  <span className="plt-tarjeta-resumen">{p.resumen}</span>
                  <span className="plt-tarjeta-pie">
                    Trae el pie: <b>{p.pie}</b>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AccesoriosPlantillas;
