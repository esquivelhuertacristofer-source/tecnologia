'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { X } from 'lucide-react';
import {
  CONTENIDO_ANCHO,
  MARGEN,
  PAGINA_ALTO,
  PAGINA_ANCHO,
  PASO_PAGINA,
} from '@/components/office/motor/paginador';
import {
  archivosDe,
  avisarAlMaestro,
  cambiarEscritorio,
  CARPETA_INICIAL,
  CARPETAS,
  escribirArchivo,
  guardarDeVerdad,
  leerEscritorio,
  nombreCompleto,
  normaliza,
  rutaCompleta,
  suscribir,
  type ArchivoGuardado,
  type TipoArchivo,
} from './escritorio';
import './estilo.css';

/**
 * Los dos cuadros de diálogo de `of-word-guardar-e-imprimir`.
 *
 * El motor guarda de verdad y no hace falta reescribirlo; lo que no tiene es lo
 * que esta clase enseña: un nombre de archivo que se pueda cambiar, carpetas
 * donde elegir, dos tipos de archivo y un papel que mirar antes de gastarlo. Eso
 * se construye aquí, como accesorios de la ventana, y se pinta con el chrome de
 * Word y de Windows porque es parte del programa (§36.2).
 *
 * ── LA VISTA PREVIA ES EL DOCUMENTO DE VERDAD ───────────────────────────────
 * Las miniaturas no son un dibujo ni una captura: son **el mismo flujo de texto
 * que hay en la hoja**, recortado por hojas con la misma medida con la que el
 * paginador apila las páginas de verdad —`PASO_PAGINA` de separación, `MARGEN`
 * de margen— y encogido con un `scale`. Si el alumno escribe tres renglones más
 * y vuelve a abrir la vista previa, la miniatura los trae. Una vista previa que
 * no coincidiera con el papel enseñaría exactamente lo contrario de lo que la
 * clase quiere enseñar.
 *
 * ── NADA SALE DE AQUÍ ───────────────────────────────────────────────────────
 * No se descarga ningún archivo, no se abre el diálogo de impresión del
 * navegador y no se llama a `window.print()`. Es un simulador y lo dice en voz
 * alta: el recado del final del encargo empieza por ahí.
 */

/* ─────────────────────────── enganche con el escritorio ─────────────────────────── */

function useEscritorio() {
  return useSyncExternalStore(suscribir, leerEscritorio, leerEscritorio);
}

/**
 * Lo que convierte una caja en un cuadro de diálogo: foco dentro, Escape fuera.
 *
 * Es la misma exigencia que la ventana se aplica a sí misma en el diálogo de la
 * insignia. Sin esto, el tabulador se pasea por la cinta de detrás —que está
 * tapada— y con el teclado no hay forma de llegar al botón Guardar.
 */
function useCuadro(caja: React.RefObject<HTMLDivElement | null>, cerrar: () => void, foco: string) {
  useEffect(() => {
    const el = caja.current;
    const id = requestAnimationFrame(() => {
      /*
       * El foco va al campo que hay que llenar, no al primer elemento del árbol
       * —que es la X de cerrar, porque la cabecera va arriba—. Y se selecciona
       * el texto que trae: en Word, abrir «Guardar como» y teclear sustituye el
       * nombre viejo, que es justo lo que el encargo manda hacer con
       * «Documento1».
       */
      const destino = el?.querySelector<HTMLElement>(foco) ?? el?.querySelector<HTMLElement>('button');
      destino?.focus();
      if (destino instanceof HTMLInputElement) destino.select();
    });
    const teclas = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        cerrar();
        return;
      }
      if (e.key !== 'Tab' || !el) return;
      const focos = Array.from(
        el.querySelectorAll<HTMLElement>('input:not([disabled]), select:not([disabled]), button:not([disabled])'),
      );
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
    window.addEventListener('keydown', teclas, true);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('keydown', teclas, true);
    };
  }, [caja, cerrar, foco]);
}

function cerrarCuadro() {
  cambiarEscritorio({ dialogo: null });
}

/**
 * El pico de cinta que el velo dejaba vivo, y por qué había que taparlo.
 *
 * El velo se detiene a 340 px del borde derecho para no tapar el panel del
 * maestro —lo que hay que hacer dentro del cuadro se lee ahí—, y eso está bien
 * de la cintura para abajo. Arriba no: **la cinta llega hasta el borde de la
 * ventana**, así que esos 340 px últimos de cinta se quedaban despiertos detrás
 * de un cuadro modal.
 *
 * Medido el 10-ago-2026 jugando mal a 1024×768, que es el portátil del aula: el
 * grupo «Archivo» —justo las tres herramientas de esta clase— cae en x 690-800,
 * a la derecha de 1024−340. Con «Guardar como» abierto, un clic en Imprimir
 * respondía y cambiaba el cuadro por otro; `elementFromPoint` sobre el botón
 * devolvía el propio botón y no el velo. A 1440 no se veía porque ahí ese trozo
 * de cinta está vacío: es de los defectos que sólo salen en la pantalla chica.
 *
 * La tapa cubre exactamente ese rectángulo —desde arriba hasta donde empieza el
 * panel, y sólo su ancho—, así que no se solapa con el velo y el lavado no se
 * pinta dos veces. El alto se MIDE contra el panel de verdad en vez de escribir
 * la altura de la cinta a mano, que se quedaría vieja el día que la cinta crezca
 * un renglón.
 */
function TapaDeLaCinta() {
  const [alto, setAlto] = useState(0);
  useEffect(() => {
    const medir = () => {
      const ventana = document.querySelector('.txtw');
      const panel = document.querySelector('.txtw-panel');
      if (!ventana || !panel) return;
      setAlto(Math.max(0, panel.getBoundingClientRect().top - ventana.getBoundingClientRect().top));
    };
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, []);
  return <div className="gi-tapa" style={{ height: alto }} aria-hidden="true" />;
}

/* ─────────────────────────── guardar como ─────────────────────────── */

/** Los caracteres que Windows no deja poner en un nombre de archivo. */
const PROHIBIDOS = ['\\', '/', ':', '*', '?', '"', '<', '>', '|'];

const ETIQUETA_TIPO: Record<TipoArchivo, string> = {
  docx: 'Documento de Word',
  pdf: 'Documento PDF',
};

function Sello({ tipo }: { tipo: TipoArchivo }) {
  return (
    <span className={`gi-sello es-${tipo}`} aria-hidden="true">
      {tipo === 'docx' ? 'W' : 'PDF'}
    </span>
  );
}

function GuardarComo() {
  const escritorio = useEscritorio();
  const caja = useRef<HTMLDivElement | null>(null);
  useCuadro(caja, cerrarCuadro, '#gi-nombre');

  // Se estrena con lo que ya tiene el documento, como Word: la segunda vez que
  // se abre, el nombre y la carpeta de la vez pasada están puestos y lo único
  // que hay que tocar es el tipo. El encargo del PDF depende de eso.
  const [nombre, setNombre] = useState(escritorio.actual.nombre);
  const [carpeta, setCarpeta] = useState(escritorio.actual.carpeta);
  const [tipo, setTipo] = useState<TipoArchivo>('docx');
  const [aviso, setAviso] = useState<string | null>(null);

  const limpio = nombre.trim().replace(/\.(docx|pdf)$/i, '').trim();
  const dentro = archivosDe(carpeta);

  const guardar = () => {
    if (!limpio) {
      setAviso('Escribe un nombre para el archivo.');
      return;
    }
    const malos = PROHIBIDOS.filter((c) => limpio.includes(c));
    if (malos.length > 0) {
      setAviso(`Un nombre de archivo no puede llevar ${malos.join(' ')}. Quítalos y vuelve a intentar.`);
      return;
    }
    const archivo: ArchivoGuardado = { nombre: limpio, carpeta, tipo };
    escribirArchivo(archivo);

    /*
     * Guardar como .docx cambia el archivo con el que se trabaja y guarda de
     * verdad; exportar a PDF **no**. Es la diferencia que hace Word y es la que
     * el encargo 6 enseña: el PDF es una copia para mandar, no tu documento.
     */
    if (tipo === 'docx') {
      cambiarEscritorio({ actual: archivo });
      guardarDeVerdad();
    }

    /*
     * El error del tema, dicho en el momento en que se comete.
     *
     * Cambiar el nombre y dejar la carpeta que venía puesta es EL error de esta
     * clase —el archivo acaba donde la computadora quiso y luego no aparece—, y
     * hasta hoy pasaba en absoluto silencio: el cuadro se cerraba, el recado
     * decía «guardado» y el encargo se quedaba sin palomear sin que nadie
     * explicara por qué. Medido el 10-ago-2026 jugando mal: «5 de 8 · Ahora
     * rellénalo · pista: no». La pista del maestro sólo aparece cuando se pulsa
     * un botón de la cinta, y guardar dentro de un cuadro no lo es.
     *
     * El aviso no nombra ninguna carpeta del encargo —no sabe cuál pide el
     * guion, ni debe—: dice lo que es verdad siempre, que el archivo se quedó
     * donde lo puso la computadora y no donde lo puso el alumno.
     */
    const seQuedoDondeLaComputadora = carpeta === CARPETA_INICIAL;
    const cambioElNombre = normaliza(limpio) !== normaliza(escritorio.actual.nombre);
    const ojoConLaCarpeta =
      seQuedoDondeLaComputadora && cambioElNombre
        ? ` Ojo: sigue en «${CARPETA_INICIAL}», que es la carpeta que eligió la computadora, no tú.`
        : '';

    cambiarEscritorio({
      dialogo: null,
      recado:
        tipo === 'docx'
          ? `Guardado en ${rutaCompleta(archivo)}. Desde ahora, tu documento se llama así.${ojoConLaCarpeta}`
          : `Se creó una copia en ${rutaCompleta(archivo)}. Ésa es la que se manda; tu documento de Word sigue siendo ${nombreCompleto(escritorio.actual)}.`,
    });
    avisarAlMaestro();
  };

  return (
    <div className="gi-velo" role="presentation">
      <div
        className="gi-caja es-guardar"
        role="dialog"
        aria-modal="true"
        aria-label="Guardar como"
        ref={caja}
      >
        <div className="gi-cab">
          <span className="gi-cab-titulo">Guardar como</span>
          <button type="button" className="gi-cab-x" onClick={cerrarCuadro} aria-label="Cerrar">
            <X size={15} strokeWidth={2.4} />
          </button>
        </div>

        <div className="gi-ruta">
          <span aria-hidden="true">🖥</span> Este equipo <span aria-hidden="true">›</span> <b>{carpeta}</b>
        </div>

        <div className="gi-explorador">
          <div className="gi-carpetas">
            <p className="gi-carpetas-tit">Carpetas</p>
            {CARPETAS.map((c) => (
              <button
                key={c}
                type="button"
                className={`gi-carpeta${c === carpeta ? ' es-activa' : ''}`}
                aria-pressed={c === carpeta}
                onClick={() => {
                  setCarpeta(c);
                  setAviso(null);
                }}
              >
                <span aria-hidden="true">📁</span>
                <span>{c}</span>
                <span className="gi-carpeta-cuenta">{archivosDe(c).length}</span>
              </button>
            ))}
          </div>

          <div className="gi-lista">
            <div className="gi-lista-cab">
              <span>Nombre</span>
              <span>Tipo</span>
            </div>
            {dentro.length === 0 ? (
              <div className="gi-vacia">
                <span aria-hidden="true" style={{ fontSize: 26 }}>
                  📂
                </span>
                <b>Esta carpeta está vacía.</b>
                <span>Todavía no has guardado nada aquí.</span>
              </div>
            ) : (
              dentro.map((a) => {
                const esElAbierto =
                  a.tipo === escritorio.actual.tipo &&
                  a.carpeta === escritorio.actual.carpeta &&
                  normaliza(a.nombre) === normaliza(escritorio.actual.nombre);
                return (
                  <div key={`${a.carpeta}/${nombreCompleto(a)}`} className={`gi-fila${esElAbierto ? ' es-actual' : ''}`}>
                    <span className="gi-fila-nombre">
                      <Sello tipo={a.tipo} />
                      <span>{nombreCompleto(a)}</span>
                      {esElAbierto && <span className="gi-fila-marca">abierto ahora</span>}
                    </span>
                    <span className="gi-fila-tipo">{ETIQUETA_TIPO[a.tipo]}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="gi-campos">
          <label htmlFor="gi-nombre">Nombre de archivo:</label>
          <input
            id="gi-nombre"
            className="gi-entrada"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              setAviso(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                guardar();
              }
            }}
          />
          <label htmlFor="gi-tipo">Tipo:</label>
          <select
            id="gi-tipo"
            className="gi-select"
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value as TipoArchivo);
              setAviso(null);
            }}
          >
            <option value="docx">Documento de Word (*.docx)</option>
            <option value="pdf">PDF (*.pdf)</option>
          </select>
          <p className="gi-resultado">
            Se va a guardar como <b>{carpeta} \ {limpio || '…'}.{tipo}</b>
          </p>
          {aviso && <p className="gi-aviso">{aviso}</p>}
        </div>

        <div className="gi-pie">
          <button type="button" className="gi-boton" onClick={cerrarCuadro}>
            Cancelar
          </button>
          <button type="button" className="gi-boton es-principal" onClick={guardar}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── vista previa e imprimir ─────────────────────────── */

/**
 * Cuánto se encoge la hoja para que quepan DOS en el cuadro.
 *
 * No es un número fijo porque la pantalla no lo es. En un portátil de aula de
 * 1024 px el cuadro entero mide 640 y a la vista previa le quedan 345: con la
 * escala grande, la segunda hoja se salía y había que arrastrar para verla — y
 * el encargo consiste precisamente en contar las hojas. Es el mismo defecto que
 * §36.8 le encontró a la hoja del documento, un piso más arriba.
 */
function escalaDeLaMiniatura(): number {
  const ancho = typeof window === 'undefined' ? 1440 : window.innerWidth;
  if (ancho >= 1360) return 0.32;
  if (ancho >= 1150) return 0.26;
  return 0.19;
}

/**
 * El retrato del documento, tomado en el momento de abrir el cuadro.
 *
 * Se copia el HTML del flujo vivo —espaciadores de paginación incluidos, que son
 * los que hacen que el texto caiga donde va a caer— y se cuentan las hojas de
 * verdad que hay apiladas en el lienzo. Se toma una sola vez, al abrir: una
 * vista previa que se moviera mientras la miras no sería una vista previa.
 */
function useRetrato() {
  return useMemo(() => {
    const flujo = document.querySelector<HTMLElement>('.txtw-flujo');
    const hojas = document.querySelectorAll('.txtw-hoja').length || 1;
    return { html: flujo?.innerHTML ?? '', hojas };
  }, []);
}

function Imprimir() {
  const escritorio = useEscritorio();
  const caja = useRef<HTMLDivElement | null>(null);
  useCuadro(caja, cerrarCuadro, '#gi-copias');
  const retrato = useRetrato();
  const escala = useMemo(() => escalaDeLaMiniatura(), []);

  const total = retrato.hojas * escritorio.copias;

  const imprimir = () => {
    const una = escritorio.copias === 1;
    const copias = una ? 'Se mandó una copia' : `Se mandaron ${escritorio.copias} copias`;
    const papel = total === 1 ? 'una hoja de papel' : `${total} hojas de papel`;
    cambiarEscritorio({
      impreso: true,
      dialogo: null,
      recado: `${copias} a la impresora de la dirección: ${papel}. Aquí no sale papel de verdad, esto es un simulador.`,
    });
    avisarAlMaestro();
  };

  return (
    <div className="gi-velo" role="presentation">
      <div className="gi-caja es-imprimir" role="dialog" aria-modal="true" aria-label="Imprimir" ref={caja}>
        <div className="gi-cab">
          <span className="gi-cab-titulo">Imprimir</span>
          <button type="button" className="gi-cab-x" onClick={cerrarCuadro} aria-label="Cerrar">
            <X size={15} strokeWidth={2.4} />
          </button>
        </div>

        <div className="gi-imprimir">
          <div className="gi-ajustes">
            <div className="gi-lanzar">
              <button type="button" className="gi-lanzar-boton" onClick={imprimir}>
                <span className="gi-lanzar-icono" aria-hidden="true">
                  🖨
                </span>
                Imprimir
              </button>
              <div className="gi-copias">
                <label htmlFor="gi-copias">Copias</label>
                <input
                  id="gi-copias"
                  type="number"
                  min={1}
                  max={999}
                  value={escritorio.copias}
                  onChange={(e) =>
                    cambiarEscritorio({
                      copias: Math.max(1, Math.min(999, Math.floor(Number(e.target.value)) || 1)),
                    })
                  }
                />
              </div>
            </div>

            <div>
              <p className="gi-bloque-tit">Impresora</p>
              <div className="gi-impresora">
                <span className="gi-impresora-icono" aria-hidden="true">
                  🖨
                </span>
                <span className="gi-impresora-datos">
                  <b className="gi-impresora-nombre">Impresora de la dirección</b>
                  <span className="gi-impresora-estado">Lista</span>
                </span>
              </div>
            </div>

            <div>
              <p className="gi-bloque-tit">Configuración</p>
              <p className="gi-ajuste">
                <span>Qué se imprime</span>
                <b>Todas las páginas</b>
              </p>
              <p className="gi-ajuste">
                <span>Orientación</span>
                <b>Vertical</b>
              </p>
              <p className="gi-ajuste">
                <span>Tamaño del papel</span>
                <b>Carta · 21.6 × 27.9 cm</b>
              </p>
              <p className="gi-ajuste">
                <span>Márgenes</span>
                <b>Normales · 2.5 cm</b>
              </p>
              <p className="gi-ajuste">
                <span>Por cada hoja</span>
                <b>1 página</b>
              </p>
            </div>

            <p className="gi-cuenta">
              Tu documento ocupa <b>{retrato.hojas}</b> {retrato.hojas === 1 ? 'hoja' : 'hojas'}. Con{' '}
              <b>{escritorio.copias}</b> {escritorio.copias === 1 ? 'copia' : 'copias'} vas a gastar{' '}
              <b>{total}</b> {total === 1 ? 'hoja de papel' : 'hojas de papel'}.
            </p>
          </div>

          <div className="gi-previa">
            <div className="gi-previa-cab">
              <span>Vista previa · así va a salir en el papel</span>
              <span>
                {retrato.hojas} {retrato.hojas === 1 ? 'hoja' : 'hojas'}
              </span>
            </div>
            <div className="gi-hojas">
              {Array.from({ length: retrato.hojas }, (_, k) => (
                <div className="gi-hoja" key={k}>
                  <div
                    className="gi-mini"
                    style={{ width: PAGINA_ANCHO * escala, height: PAGINA_ALTO * escala }}
                    aria-hidden="true"
                  >
                    <div
                      className="gi-mini-lupa"
                      style={{ width: PAGINA_ANCHO, height: PAGINA_ALTO, transform: `scale(${escala})` }}
                    >
                      <div
                        className="txtw-flujo gi-mini-flujo"
                        style={{ top: MARGEN - k * PASO_PAGINA, left: MARGEN, width: CONTENIDO_ANCHO }}
                        dangerouslySetInnerHTML={{ __html: retrato.html }}
                      />
                    </div>
                  </div>
                  <span className="gi-hoja-pie">
                    Hoja {k + 1} de {retrato.hojas}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── el recado ─────────────────────────── */

function Recado({ texto }: { texto: string }) {
  useEffect(() => {
    const id = setTimeout(() => cambiarEscritorio({ recado: null }), 6000);
    return () => clearTimeout(id);
  }, [texto]);

  return (
    <div className="gi-recado" role="status" aria-live="polite">
      <div className="gi-recado-caja">
        <span aria-hidden="true">✅</span>
        <span>{texto}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────── lo que se le pasa a la ventana ─────────────────────────── */

export function AccesoriosGuardarEImprimir() {
  const escritorio = useEscritorio();
  return (
    <>
      {escritorio.dialogo && <TapaDeLaCinta />}
      {escritorio.dialogo === 'guardar-como' && <GuardarComo />}
      {escritorio.dialogo === 'imprimir' && <Imprimir />}
      {escritorio.recado && <Recado texto={escritorio.recado} />}
    </>
  );
}
