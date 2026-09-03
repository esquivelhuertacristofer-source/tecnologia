'use client';

import { createContext, useContext, type CSSProperties, type DragEvent, type ReactNode } from 'react';
import {
  admiteCarga,
  admiteCondicion,
  claveSitio,
  fichaDe,
  formaDe,
  mismoSitio,
  ramasDe,
  type BloquePuesto,
  type Carga,
  type FichaBloque,
  type Pila,
  type Programa,
  type RanuraFicha,
  type Sitio,
} from './arbolBloques';
import type { Rechazo } from './useBloques';
import './ventanaBloques.css';

/**
 * TECNIA BLOQUES · LA VENTANA
 *
 * El editor de bloques: columna de categorías, paleta, guion que se arma
 * arrastrando y anida de verdad, y los mandos de ▶ ⏸ ⏭ ⏹ con su velocidad.
 * **Cero `useState`**: todo entra por parámetro. Quien tiene el estado es
 * `useBloques`.
 *
 * ── LO QUE ESTE COMPONENTE NO HACE, Y NO DEBE HACER NUNCA ─────────────────
 *
 * No pinta el escenario. Ocho actividades no mueven el mismo gato: una dibuja,
 * otra lleva un robot por una cuadrícula, otra enciende los leds de una placa.
 * El armazón ejecuta bloques y avisa de cada acción; quien la pinta es la
 * actividad, y por eso `escenario` es un hueco (`ReactNode`) y no una escena.
 *
 * Tampoco trae paleta. **La paleta la decide la actividad**, y eso es lo primero
 * que separa un armazón de un componente de una clase: una clase de secuencias
 * no debe enseñar el bloque de repetir, y si la lista viviera aquí dentro no
 * habría manera de quitarlo. Ni las categorías vienen puestas: en `n9` no se
 * llaman «Movimiento» y «Sensores» sino «Cuando» y «Entonces».
 *
 * Y no pinta ejercicios. No recibe una lista de retos para dibujarlos: eso sería
 * un motor de plantillas, y en este proyecto están rechazados. Recibe UN guion y
 * lo enseña; la interfaz de alrededor la pone la actividad en `panel`.
 *
 * ── LAS DOS VÍAS DE ENCAJE ────────────────────────────────────────────────
 *
 * Arrastrar la pieza, o tocarla y después tocar el hueco. La segunda no es un
 * apaño para tabletas: es el camino que funciona con teclado, y por eso el
 * blanco de cada zona es un `<button>` de verdad y no un `<span>` con `onClick`.
 * Las dos vías terminan en la misma llamada a `onSoltar(sitio, carga)`, y la
 * decisión de si cabe la toma `admiteCarga` —la misma función que pinta la
 * sombra verde—, así que una zona no puede iluminarse y luego escupir la pieza.
 */

export interface CategoriaBloques {
  id: string;
  nombre: string;
  /** El color pleno de la categoría. Sin él, el editor usa el de la casa. */
  color?: string;
}

export interface VelocidadBloques {
  ms: number;
  nombre: string;
}

export interface VentanaBloquesProps {
  catalogo: readonly FichaBloque[];
  categorias: readonly CategoriaBloques[];
  categoria: string;
  onCategoria: (id: string) => void;
  /** La categoría donde está la pieza que hace falta ahora: late para no atorar a nadie. */
  categoriaPedida?: string | null;

  programa: Programa;
  elegida: Carga | null;
  /** El bloque que se ilumina mientras el intérprete lo ejecuta. */
  nodoActivo: string | null;
  corriendo: boolean;
  enPausa?: boolean;
  rechazo?: Rechazo | null;
  /** El aviso del intérprete: tope de pasos, guion vacío. */
  aviso?: string | null;

  /** El título del reto, en la cabecera del guion. */
  reto?: ReactNode;
  marca?: string;
  archivo?: string;
  /** ← AQUÍ divergen las ocho actividades: su mundo, pintado por ellas. */
  escenario?: ReactNode;
  /** Lo que va debajo del editor: enunciado, marcador, lo que la clase quiera. */
  panel?: ReactNode;
  /** El hueco de `VentanaBase`, arriba del todo. */
  encabezado?: ReactNode;
  /** Lo que va encima de las fichas: el botón de «+ Nueva variable» y compañía. */
  sobrePaleta?: ReactNode;

  velocidad?: number;
  velocidades?: readonly VelocidadBloques[];
  /**
   * Los mandos ▶ ⏸ ⏭ ⏹ de la cabecera. En `false` desaparecen: es lo que pide
   * una actividad cuya palanca de probar es una pieza de su propio escenario,
   * porque tener las dos sería la doble interfaz que aquí está prohibida.
   */
  mandos?: boolean;

  onElegir: (carga: Carga | null) => void;
  onSoltar: (sitio: Sitio, carga?: Carga) => void;
  onQuitar: (id: string) => void;
  /** Tocar un bloque puesto. La actividad decide qué es: leerlo, acusarlo, nada. */
  onLeer?: (id: string) => void;
  onValor?: (id: string, ranura: string, valor: string | number) => void;
  onCorrer: () => void;
  onPausar?: () => void;
  onContinuar?: () => void;
  onPaso?: () => void;
  onParar: () => void;
  onVelocidad?: (ms: number) => void;
  className?: string;
}

/* ── el contexto del editor ────────────────────────────────────────────────── */

/**
 * Lo que el pintor recursivo necesita en cada piso.
 *
 * Va en contexto y no en props porque el árbol es RECURSIVO y sin fondo: pasar
 * el catálogo y los ocho manejadores a mano obligaría a repetirlos en cada
 * nivel, y el día que uno se olvide en el nivel tres, los bloques anidados
 * dejarían de responder sin que nada chille.
 */
interface Editor {
  catalogo: readonly FichaBloque[];
  programa: Programa;
  elegida: Carga | null;
  nodoActivo: string | null;
  rechazo: Rechazo | null;
  categorias: readonly CategoriaBloques[];
  onSoltar: (sitio: Sitio, carga?: Carga) => void;
  onElegir: (carga: Carga | null) => void;
  onQuitar: (id: string) => void;
  onLeer?: (id: string) => void;
  onValor?: (id: string, ranura: string, valor: string | number) => void;
}

const ContextoEditor = createContext<Editor | null>(null);

function useEditor(): Editor {
  const editor = useContext(ContextoEditor);
  if (!editor) throw new Error('Las piezas de Tecnia Bloques van dentro de <VentanaBloques>.');
  return editor;
}

function colorDe(editor: Editor, categoria: string): string | undefined {
  return editor.categorias.find((c) => c.id === categoria)?.color;
}

/* ── el arrastre, encapsulado ──────────────────────────────────────────────── */

const MIME = 'text/plain';

function textoDeCarga(carga: Carga): string {
  return `${carga.tipo}:${carga.id}`;
}

/**
 * Lee lo que el navegador trae en el arrastre. Devuelve `null` si es cualquier
 * otra cosa —un archivo, un trozo de texto de otra pestaña—, y entonces la zona
 * se comporta como si el alumno hubiera soltado con las manos vacías.
 */
export function cargaDeTexto(texto: string): Carga | null {
  const corte = texto.indexOf(':');
  if (corte < 0) return null;
  const tipo = texto.slice(0, corte);
  const id = texto.slice(corte + 1);
  if (!id) return null;
  if (tipo === 'ficha' || tipo === 'bloque') return { tipo, id };
  return null;
}

/** Zona de soltar. El manejador se arma DENTRO del componente, nunca en el render del padre. */
function ZonaSuelta({
  className,
  sitio,
  children,
}: {
  className: string;
  sitio: Sitio;
  children: ReactNode;
}) {
  const editor = useEditor();
  const encima = (e: DragEvent<HTMLDivElement>) => e.preventDefault();
  const soltar = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const carga = cargaDeTexto(e.dataTransfer.getData(MIME));
    editor.onSoltar(sitio, carga ?? undefined);
  };
  const diana = admiteCarga(editor.programa, editor.catalogo, sitio, editor.elegida);
  const rebote = mismoSitio(editor.rechazo?.sitio, sitio);
  const clases = [className, diana ? 'es-diana' : '', rebote ? 'es-rebote' : '']
    .filter(Boolean)
    .join(' ');
  return (
    <div
      className={clases}
      data-testid="blq-zona"
      data-sitio={claveSitio(sitio)}
      data-diana={diana ? 'si' : undefined}
      data-rebote={rebote ? 'si' : undefined}
      onDragOver={encima}
      onDrop={soltar}
    >
      {children}
    </div>
  );
}

/** El rótulo de una zona: el blanco de la vía sin arrastre, y por eso un botón. */
function PistaZona({ className, sitio, texto }: { className: string; sitio: Sitio; texto: string }) {
  const editor = useEditor();
  const tocar = () => editor.onSoltar(sitio);
  return (
    <button type="button" className={className} onClick={tocar}>
      {texto}
    </button>
  );
}

/* ── las piezas ────────────────────────────────────────────────────────────── */

/** La etiqueta, con el nombre que puso el alumno pintado como óvalo. */
function Etiqueta({ texto, ovalo }: { texto: string; ovalo?: string }) {
  const corte = ovalo ? texto.indexOf(ovalo) : -1;
  if (!ovalo || corte < 0) return <>{texto}</>;
  return (
    <>
      {texto.slice(0, corte)}
      <span className="blq-ovalo">{ovalo}</span>
      {texto.slice(corte + ovalo.length)}
    </>
  );
}

/** El hueco de dato de un bloque puesto: el `10` de «repetir 10 veces». */
function Ranura({ bloque, ranura }: { bloque: BloquePuesto; ranura: RanuraFicha }) {
  const editor = useEditor();
  const valor = bloque.args?.[ranura.id] ?? ranura.valor;
  const cambiar = (crudo: string) => {
    editor.onValor?.(bloque.id, ranura.id, ranura.tipo === 'numero' ? Number(crudo) : crudo);
  };

  if (ranura.opciones?.length) {
    return (
      <select
        className="blq-ranura es-lista"
        aria-label={ranura.id}
        value={String(valor)}
        onChange={(e) => cambiar(e.target.value)}
      >
        {ranura.opciones.map((o) => (
          <option key={String(o)} value={String(o)}>
            {o}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      className="blq-ranura"
      aria-label={ranura.id}
      type={ranura.tipo === 'numero' ? 'number' : 'text'}
      value={String(valor)}
      onChange={(e) => cambiar(e.target.value)}
    />
  );
}

/** El hueco hexagonal: vacío, o con su pregunta encajada. */
function Hueco({ bloque }: { bloque: BloquePuesto }) {
  const sitio: Sitio = { donde: 'hueco', bloque: bloque.id };
  return (
    <ZonaSuelta className="blq-hueco" sitio={sitio}>
      {bloque.condicion ? (
        <Bloque bloque={bloque.condicion} />
      ) : (
        <PistaZona className="blq-hueco-pista" sitio={sitio} texto="la pregunta" />
      )}
    </ZonaSuelta>
  );
}

/**
 * Una lista de bloques con sus zonas de encaje.
 *
 * Hay una zona ANTES de cada bloque y otra al final, así que se puede meter una
 * pieza en medio de una pila y no sólo al final. El editor viejo sólo tenía la
 * de abajo, y arreglar un guion largo obligaba a deshacerlo entero.
 */
function ListaBloques({
  bloques,
  sitioDe,
  pistaVacia,
  pistaCola,
}: {
  bloques: BloquePuesto[];
  sitioDe: (indice: number) => Sitio;
  pistaVacia: string;
  pistaCola: string;
}) {
  return (
    <>
      {bloques.map((b, i) => (
        <div key={b.id} className="blq-renglon">
          <ZonaSuelta className="blq-entre" sitio={sitioDe(i)}>
            <span className="blq-linea" />
          </ZonaSuelta>
          <Bloque bloque={b} />
        </div>
      ))}
      <ZonaSuelta className="blq-cola" sitio={sitioDe(bloques.length)}>
        <PistaZona
          className="blq-pista"
          sitio={sitioDe(bloques.length)}
          texto={bloques.length === 0 ? pistaVacia : pistaCola}
        />
      </ZonaSuelta>
    </>
  );
}

/** Un bloque ya puesto, con sus bocas y su hueco. Se dibuja a sí mismo, sin fondo. */
function Bloque({ bloque }: { bloque: BloquePuesto }) {
  const editor = useEditor();
  const ficha = fichaDe(editor.catalogo, bloque.ficha);
  if (!ficha) return null;

  const forma = formaDe(ficha);
  const activo = editor.nodoActivo === bloque.id;
  const tomar = (e: DragEvent<HTMLDivElement>) => {
    if (bloque.fijo) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    e.dataTransfer.setData(MIME, textoDeCarga({ tipo: 'bloque', id: bloque.id }));
    e.dataTransfer.effectAllowed = 'move';
    editor.onElegir({ tipo: 'bloque', id: bloque.id });
  };
  const tocar = () => editor.onLeer?.(bloque.id);
  const quitar = () => editor.onQuitar(bloque.id);

  const clases = ['blq-bloque', `es-${forma}`, activo ? 'es-corriendo' : '', bloque.fijo ? 'es-fijo' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={clases}
      data-testid="blq-bloque"
      data-bloque={bloque.id}
      data-ficha={bloque.ficha}
      data-activo={activo ? 'si' : undefined}
      style={{ '--blq-color': colorDe(editor, ficha.categoria) } as CSSProperties}
      draggable={!bloque.fijo}
      onDragStart={tomar}
    >
      <div className="blq-cabeza">
        <button type="button" className="blq-texto" onClick={tocar}>
          <Etiqueta texto={ficha.etiqueta} ovalo={ficha.ovalo} />
        </button>
        {ficha.ranuras?.map((r) => (
          <Ranura key={r.id} bloque={bloque} ranura={r} />
        ))}
        {admiteCondicion(ficha) && <Hueco bloque={bloque} />}
        {!bloque.fijo && (
          <button
            type="button"
            className="blq-quitar"
            onClick={quitar}
            aria-label={`Quitar ${ficha.etiqueta}`}
          >
            ✕
          </button>
        )}
      </div>

      {ramasDe(ficha).map((rama) => (
        <div key={rama} className="blq-boca" data-rama={rama}>
          {rama !== 'cuerpo' && <span className="blq-medio">si no</span>}
          <ListaBloques
            bloques={bloque.ramas?.[rama] ?? []}
            sitioDe={(indice) => ({ donde: 'rama', bloque: bloque.id, rama, indice })}
            pistaVacia="suelta aquí la acción"
            pistaCola="y aquí la siguiente"
          />
        </div>
      ))}
      {ramasDe(ficha).length > 0 && <div className="blq-pie" />}
    </div>
  );
}

/** Una ficha de la paleta. Se arrastra o se toca: las dos llevan al mismo sitio. */
function Ficha({ ficha }: { ficha: FichaBloque }) {
  const editor = useEditor();
  const carga: Carga = { tipo: 'ficha', id: ficha.id };
  const elegida = editor.elegida?.tipo === 'ficha' && editor.elegida.id === ficha.id;
  const tomar = (e: DragEvent<HTMLButtonElement>) => {
    e.dataTransfer.setData(MIME, textoDeCarga(carga));
    e.dataTransfer.effectAllowed = 'copy';
    editor.onElegir(carga);
  };
  const tocar = () => editor.onElegir(elegida ? null : carga);
  const clases = ['blq-ficha', `es-${formaDe(ficha)}`, elegida ? 'es-elegida' : '']
    .filter(Boolean)
    .join(' ');
  return (
    <button
      type="button"
      className={clases}
      data-testid="blq-ficha"
      data-ficha={ficha.id}
      data-elegida={elegida ? 'si' : undefined}
      style={{ '--blq-color': colorDe(editor, ficha.categoria) } as CSSProperties}
      draggable
      onDragStart={tomar}
      onClick={tocar}
    >
      <Etiqueta texto={ficha.etiqueta} ovalo={ficha.ovalo} />
    </button>
  );
}

/** Un guion entero: su sombrero y lo que cuelga. */
function Guion({ pila }: { pila: Pila }) {
  return (
    <div className="blq-guion" data-testid="blq-guion" data-pila={pila.id}>
      {pila.sombrero && <Bloque bloque={pila.sombrero} />}
      <ListaBloques
        bloques={pila.bloques}
        sitioDe={(indice) => ({ donde: 'pila', pila: pila.id, indice })}
        pistaVacia="suelta aquí el primer bloque"
        pistaCola="y aquí el siguiente"
      />
    </div>
  );
}

/* ── la ventana ────────────────────────────────────────────────────────────── */

const VELOCIDADES: readonly VelocidadBloques[] = [
  { ms: 600, nombre: 'Despacio' },
  { ms: 250, nombre: 'Normal' },
  { ms: 60, nombre: 'Rápido' },
];

export function VentanaBloques({
  catalogo,
  categorias,
  categoria,
  onCategoria,
  categoriaPedida = null,
  programa,
  elegida,
  nodoActivo,
  corriendo,
  enPausa = false,
  rechazo = null,
  aviso = null,
  reto,
  marca = 'Tecnia Bloques',
  archivo,
  escenario,
  panel,
  encabezado,
  sobrePaleta,
  velocidad,
  velocidades = VELOCIDADES,
  mandos = true,
  onElegir,
  onSoltar,
  onQuitar,
  onLeer,
  onValor,
  onCorrer,
  onPausar,
  onContinuar,
  onPaso,
  onParar,
  onVelocidad,
  className,
}: VentanaBloquesProps) {
  const editor: Editor = {
    catalogo,
    programa,
    elegida,
    nodoActivo,
    rechazo,
    categorias,
    onSoltar,
    onElegir,
    onQuitar,
    onLeer,
    onValor,
  };
  const visibles = catalogo.filter((f) => f.categoria === categoria);
  const mensaje = aviso ?? rechazo?.aviso ?? null;

  return (
    <ContextoEditor.Provider value={editor}>
      <div className={['blq', className].filter(Boolean).join(' ')} data-testid="blq">
        {encabezado}

        <div className="blq-barra">
          <span className="blq-semaforo">
            <i className="es-rojo" />
            <i className="es-ambar" />
            <i className="es-verde" />
          </span>
          <span className="blq-marca">{marca}</span>
          {archivo && <span className="blq-archivo">{`proyecto: ${archivo}`}</span>}
        </div>

        <div className="blq-cuerpo">
          <div className="blq-categorias">
            {categorias.map((c) => {
              const elegir = () => onCategoria(c.id);
              const clases = [
                'blq-categoria',
                categoria === c.id ? 'es-activa' : '',
                categoriaPedida === c.id && categoria !== c.id ? 'es-pide' : '',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <button
                  key={c.id}
                  type="button"
                  className={clases}
                  style={{ '--blq-color': c.color } as CSSProperties}
                  onClick={elegir}
                >
                  <span className="blq-punto" />
                  {c.nombre}
                </button>
              );
            })}
          </div>

          <div className="blq-paleta" data-testid="blq-paleta">
            {sobrePaleta}
            {visibles.length === 0 ? (
              <p className="blq-paleta-vacia">Aquí no hay piezas para este reto.</p>
            ) : (
              visibles.map((f) => <Ficha key={f.id} ficha={f} />)
            )}
          </div>

          <div className="blq-taller">
            <div className="blq-cabecera">
              {mandos && (
                <>
                  <button
                    type="button"
                    className="blq-mando es-correr"
                    onClick={onCorrer}
                    disabled={corriendo && !enPausa}
                    aria-label="Correr el programa"
                  >
                    ▶
                  </button>
                  {onPausar && onContinuar && (
                    <button
                      type="button"
                      className="blq-mando es-pausa"
                      onClick={enPausa ? onContinuar : onPausar}
                      disabled={!corriendo}
                      aria-label={enPausa ? 'Seguir' : 'Pausar'}
                    >
                      {enPausa ? '⏵' : '⏸'}
                    </button>
                  )}
                  {onPaso && (
                    <button
                      type="button"
                      className="blq-mando es-paso"
                      onClick={onPaso}
                      aria-label="Un bloque"
                    >
                      ⏭
                    </button>
                  )}
                  <button
                    type="button"
                    className="blq-mando es-parar"
                    onClick={onParar}
                    disabled={!corriendo}
                    aria-label="Parar el programa"
                  >
                    ⏹
                  </button>
                </>
              )}
              {onVelocidad && (
                <select
                  className="blq-velocidad"
                  aria-label="Velocidad"
                  value={String(velocidad ?? '')}
                  onChange={(e) => onVelocidad(Number(e.target.value))}
                >
                  {velocidades.map((v) => (
                    <option key={v.ms} value={v.ms}>
                      {v.nombre}
                    </option>
                  ))}
                </select>
              )}
              {reto && <span className="blq-reto">{reto}</span>}
              {corriendo && (
                <span className="blq-estado" data-testid="blq-estado">
                  {enPausa ? 'EN PAUSA' : 'CORRIENDO'}
                </span>
              )}
            </div>

            {mensaje && (
              <p className="blq-aviso" role="status" data-testid="blq-aviso">
                {mensaje}
              </p>
            )}

            <div className="blq-lienzo">
              {programa.pilas.map((p) => (
                <Guion key={p.id} pila={p} />
              ))}
            </div>
          </div>

          {escenario && (
            <div className="blq-escenario" data-testid="blq-escenario">
              {escenario}
            </div>
          )}
        </div>

        {panel}
      </div>
    </ContextoEditor.Provider>
  );
}
