'use client';

import { type ReactNode } from 'react';

/**
 * `Tecnia Textos` · el procesador de textos ultra-LITE del bloque Office (doc §34).
 *
 * Esto NO es una hoja con palancas: es la PANTALLA del monitor del Escritorio de
 * Oficina, y por eso se dibuja como se dibuja un procesador de verdad —barra de
 * título, cinta con pestañas y grupos rotulados, regla, página y barra de estado
 * con su zoom— y no como una interfaz de juego.
 *
 * ── POR QUÉ EXISTE ──────────────────────────────────────────────────────────
 * Porque hasta hoy no existía, y ése era el error de concepto de toda la línea
 * de Word. La regla del software ultra-LITE se enunció el 2-ago-2026 con Word
 * como ejemplo literal, y se aplicó a todo menos a Word: N3·U5 y N4·U4 se
 * resolvieron con metáforas físicas —una hoja con palancas, un caballete con un
 * cajón de piezas—, así que la sala de Word prometía un curso de Word sin Word.
 * El síntoma que lo delata está en §26.2: la palanca de lupa que baja el
 * documento al 45 % se justificó diciendo «un procesador de verdad no te aleja
 * de la mesa, te baja el zoom de la página». El comportamiento era correcto y el
 * envase estaba mal. Aquí ese control está donde tiene que estar: en la barra de
 * estado, con su porcentaje y su deslizador.
 *
 * ── EL MARCO ────────────────────────────────────────────────────────────────
 * 640 × 420 px CLAVADOS, el hueco del bisel del monitor. Nada de dentro puede
 * crecer, así que las alturas suman 420: título 26 + pestañas 26 + galería 74 +
 * regla 16 + documento 256 + estado 22. Es más alto que los 310 de Tecnia
 * Bloques porque un documento necesita alto y el mueble es nuevo: cuando un
 * panel no cabe, cede el mueble y nunca el encuadre.
 *
 * ── LA CINTA CRECE CON EL GRADO ─────────────────────────────────────────────
 * Básico enseña dos pestañas, Intermedio cinco, Avanzado siete. No es ahorro: un
 * alumno de ocho años delante de nueve pestañas no ve una herramienta, ve ruido,
 * y ver aparecer una pestaña nueva al subir de grado es la progresión del curso
 * hecha visible. La clase declara qué pestañas existen; el aparato no decide.
 *
 * ── SE ILUMINA EL GRUPO, NO EL BOTÓN ────────────────────────────────────────
 * Cuando la clase pide «centra el párrafo», lo normal es resaltar el GRUPO
 * «Párrafo» y dejar que el alumno encuentre el botón dentro. Resaltar el botón
 * convierte la búsqueda en un clic dictado. Los dos modos existen y la clase
 * elige; la regla escrita en §34.2 es que el segundo sólo entra después de que
 * el primero haya fallado dos veces.
 *
 * ── CONTROLADO DE ARRIBA ABAJO ──────────────────────────────────────────────
 * Aquí no vive ni un `useState`, igual que en Tecnia Bloques. El documento, la
 * pestaña activa, el zoom y lo que se resalta los guarda el laboratorio, que es
 * quien sabe en qué paso va la clase. Así la pantalla no puede contar una cosa
 * distinta de la que el ejercicio está corrigiendo.
 *
 * Y no hay `contentEditable` en ninguna parte: el alumno no teclea el documento,
 * lo transforma con las herramientas de la cinta, que es lo que la unidad
 * enseña. Escribir a mano metería corrector, IME, portapapeles y accesibilidad
 * de editor —un problema entero— sin enseñar nada que no enseñe ya la
 * mecanografía de `n3-la-fila-guia`.
 */

/* ─────────────────────────── el documento ─────────────────────────── */

export type Alineacion = 'izquierda' | 'centro' | 'derecha' | 'justificado';

/** Estilo de párrafo, en el sentido de Word: marca la ESTRUCTURA, no el aspecto. */
export type EstiloParrafo = 'normal' | 'titulo1' | 'titulo2' | 'titular';

export interface FormatoTexto {
  negrita?: boolean;
  cursiva?: boolean;
  subrayado?: boolean;
  /** Puntos tipográficos; si falta, el que traiga el estilo. */
  tamano?: number;
  color?: string;
}

export interface BloqueParrafo {
  tipo: 'parrafo';
  id: string;
  texto: string;
  estilo?: EstiloParrafo;
  alineacion?: Alineacion;
  formato?: FormatoTexto;
  /** Viñeta o número al margen, como los aplica el grupo Párrafo. */
  lista?: 'vinetas' | 'numeros';
  /** Interlineado en múltiplos: 1, 1.5, 2. */
  interlineado?: number;
  sangria?: boolean;
}

export interface BloqueTabla {
  tipo: 'tabla';
  id: string;
  /** La primera fila es el encabezado si `encabezado` va en true. */
  filas: string[][];
  encabezado?: boolean;
}

export interface BloqueImagen {
  tipo: 'imagen';
  id: string;
  /** Dibujo vectorial ya resuelto por la clase; el aparato sólo lo enmarca. */
  contenido: ReactNode;
  ancho: number;
  alto: number;
  ajuste?: 'en-linea' | 'alrededor';
  lado?: 'izquierda' | 'derecha';
  /** Deformada a propósito: lo usa la clase que enseña a jalar de la esquina. */
  deformacion?: 'ancho' | 'alto';
}

export interface BloqueSalto {
  tipo: 'salto';
  id: string;
}

export type BloqueDoc = BloqueParrafo | BloqueTabla | BloqueImagen | BloqueSalto;

export interface Documento {
  /** Nombre que sale en la barra de título, sin extensión. */
  nombre: string;
  bloques: BloqueDoc[];
  /** Dos columnas en el cuerpo, como el grupo Disposición. */
  columnas?: 1 | 2;
  encabezado?: string;
  pie?: string;
  numeroDePagina?: boolean;
}

/* ─────────────────────────── la cinta ─────────────────────────── */

export type PestanaId =
  | 'inicio'
  | 'insertar'
  | 'disposicion'
  | 'referencias'
  | 'revisar'
  | 'correspondencia'
  | 'vista';

export interface ControlCinta {
  id: string;
  /** Glifo del botón. Va en texto, no en imagen: escala con el zoom del navegador. */
  glifo: string;
  etiqueta: string;
  /**
   * Nombre corto para el botón, cuando el de verdad no cabe.
   *
   * La galería mide 74 px y eso da para DOS renglones de botones más el rótulo
   * del grupo. Un grupo con tres controles anchos —«Encabezado y pie» es el
   * caso— se iba a tres renglones y el recorte se comía el rótulo, que es
   * justo lo que enseña `of-word-la-cinta`. Se acorta lo que se VE y nunca lo
   * que se LEE: `etiqueta` sigue entera en el `title` y en el `aria-label`, así
   * que al posar el ratón y para un lector de pantalla el control sigue
   * llamándose «Número de página».
   */
  corto?: string;
  /** Botón ancho con su nombre al lado, para los que no se entienden por el glifo. */
  ancho?: boolean;
  /** Apagado: se ve pero no responde. Es lo que hace un programa de verdad. */
  inerte?: boolean;
  /** Hundido: el formato ya está aplicado en la selección. */
  activo?: boolean;
}

export interface GrupoCinta {
  id: string;
  /** El rótulo de debajo. Sin él, `of-word-la-cinta` no se puede dar. */
  nombre: string;
  controles: ControlCinta[];
}

export interface Pestana {
  id: PestanaId;
  nombre: string;
  grupos: GrupoCinta[];
}

/** Las pestañas de cada grado. La clase toma de aquí lo que necesita. */
export const CINTA_BASICO: Pestana[] = [
  {
    id: 'inicio',
    nombre: 'Inicio',
    grupos: [
      {
        id: 'portapapeles',
        nombre: 'Portapapeles',
        controles: [
          { id: 'pegar', glifo: '📋', etiqueta: 'Pegar', ancho: true },
          { id: 'copiar', glifo: '⧉', etiqueta: 'Copiar' },
          { id: 'cortar', glifo: '✂', etiqueta: 'Cortar' },
        ],
      },
      {
        id: 'fuente',
        nombre: 'Fuente',
        controles: [
          { id: 'negrita', glifo: 'N', etiqueta: 'Negrita' },
          { id: 'cursiva', glifo: 'K', etiqueta: 'Cursiva' },
          { id: 'subrayado', glifo: 'S', etiqueta: 'Subrayado' },
          { id: 'mayor', glifo: 'A▲', etiqueta: 'Agrandar letra' },
          { id: 'menor', glifo: 'A▼', etiqueta: 'Reducir letra' },
          { id: 'color', glifo: 'A', etiqueta: 'Color de letra' },
        ],
      },
      {
        id: 'parrafo',
        nombre: 'Párrafo',
        /**
         * El orden es el de Word y no es capricho: en la ventana completa el
         * grupo se pinta en dos renglones de cinco, así que las cuatro
         * alineaciones caen juntas en el segundo. Verlas juntas es lo que hace
         * evidente que son cuatro formas de lo mismo y que sólo una puede estar
         * puesta a la vez.
         */
        controles: [
          { id: 'vinetas', glifo: '•≡', etiqueta: 'Viñetas' },
          { id: 'numeros', glifo: '1≡', etiqueta: 'Lista numerada' },
          { id: 'quitar-sangria', glifo: '|←', etiqueta: 'Disminuir sangría' },
          { id: 'sangria', glifo: '→|', etiqueta: 'Aumentar sangría' },
          { id: 'interlineado', glifo: '↕≡', etiqueta: 'Interlineado' },
          { id: 'izquierda', glifo: '≡', etiqueta: 'Alinear a la izquierda' },
          { id: 'centro', glifo: '≡', etiqueta: 'Centrar' },
          { id: 'derecha', glifo: '≡', etiqueta: 'Alinear a la derecha' },
          { id: 'justificado', glifo: '≡', etiqueta: 'Justificar' },
        ],
      },
      {
        id: 'estilos',
        nombre: 'Estilos',
        controles: [
          { id: 'normal', glifo: 'Aa', etiqueta: 'Normal', ancho: true },
          { id: 'titulo1', glifo: 'Aa', etiqueta: 'Título 1', ancho: true },
          { id: 'titulo2', glifo: 'Aa', etiqueta: 'Título 2', ancho: true },
        ],
      },
    ],
  },
  {
    id: 'insertar',
    nombre: 'Insertar',
    grupos: [
      {
        id: 'tablas',
        nombre: 'Tablas',
        controles: [{ id: 'tabla', glifo: '▦', etiqueta: 'Tabla', ancho: true }],
      },
      {
        id: 'ilustraciones',
        nombre: 'Ilustraciones',
        controles: [
          { id: 'imagen', glifo: '🖼', etiqueta: 'Imagen', ancho: true },
          { id: 'formas', glifo: '◇', etiqueta: 'Formas', ancho: true },
        ],
      },
      {
        id: 'texto',
        nombre: 'Texto',
        controles: [
          { id: 'wordart', glifo: 'A', etiqueta: 'WordArt', ancho: true },
          { id: 'cuadro', glifo: '▭', etiqueta: 'Cuadro de texto', corto: 'Cuadro', ancho: true },
        ],
      },
      {
        id: 'encabezado-pie',
        nombre: 'Encabezado y pie',
        controles: [
          { id: 'encabezado', glifo: '⎴', etiqueta: 'Encabezado', ancho: true },
          { id: 'pie', glifo: '⎵', etiqueta: 'Pie de página', corto: 'Pie', ancho: true },
          { id: 'numero', glifo: '#', etiqueta: 'Número de página', corto: 'Número', ancho: true },
        ],
      },
    ],
  },
];

export const CINTA_INTERMEDIO: Pestana[] = [
  ...CINTA_BASICO,
  {
    id: 'disposicion',
    nombre: 'Disposición',
    grupos: [
      {
        id: 'configurar',
        nombre: 'Configurar página',
        controles: [
          { id: 'margenes', glifo: '⧉', etiqueta: 'Márgenes', ancho: true },
          { id: 'columnas', glifo: '▥', etiqueta: 'Columnas', ancho: true },
          { id: 'salto', glifo: '⤓', etiqueta: 'Saltos', ancho: true },
        ],
      },
    ],
  },
  {
    id: 'referencias',
    nombre: 'Referencias',
    grupos: [
      {
        id: 'tdc',
        nombre: 'Tabla de contenido',
        controles: [
          { id: 'tdc', glifo: '☰', etiqueta: 'Tabla de contenido', corto: 'Contenido', ancho: true },
          { id: 'actualizar-tdc', glifo: '↻', etiqueta: 'Actualizar tabla', corto: 'Actualizar', ancho: true },
        ],
      },
      {
        id: 'notas',
        nombre: 'Notas al pie',
        controles: [{ id: 'nota', glifo: 'ᴬ¹', etiqueta: 'Insertar nota', corto: 'Nota', ancho: true }],
      },
    ],
  },
  {
    id: 'revisar',
    nombre: 'Revisar',
    grupos: [
      {
        id: 'revision',
        nombre: 'Revisión',
        controles: [
          { id: 'ortografia', glifo: '✓ᴬ', etiqueta: 'Ortografía', ancho: true },
          { id: 'sinonimos', glifo: '≈', etiqueta: 'Sinónimos', ancho: true },
        ],
      },
      {
        id: 'comentarios',
        nombre: 'Comentarios',
        controles: [
          { id: 'comentario', glifo: '💬', etiqueta: 'Nuevo comentario', corto: 'Comentario', ancho: true },
        ],
      },
      {
        id: 'seguimiento',
        nombre: 'Seguimiento',
        controles: [
          { id: 'control-cambios', glifo: '✎', etiqueta: 'Control de cambios', corto: 'Cambios', ancho: true },
          { id: 'aceptar', glifo: '✔', etiqueta: 'Aceptar' },
          { id: 'rechazar', glifo: '✘', etiqueta: 'Rechazar' },
        ],
      },
    ],
  },
];

export const CINTA_AVANZADO: Pestana[] = [
  ...CINTA_INTERMEDIO,
  {
    id: 'correspondencia',
    nombre: 'Correspondencia',
    grupos: [
      {
        id: 'iniciar',
        nombre: 'Iniciar combinación',
        controles: [
          { id: 'destinatarios', glifo: '👥', etiqueta: 'Destinatarios', corto: 'Lista', ancho: true },
        ],
      },
      {
        id: 'campos',
        nombre: 'Escribir campos',
        controles: [
          { id: 'campo', glifo: '«»', etiqueta: 'Insertar campo', corto: 'Campo', ancho: true },
          { id: 'vista-previa', glifo: '👁', etiqueta: 'Vista previa', corto: 'Vista', ancho: true },
        ],
      },
      {
        id: 'finalizar',
        nombre: 'Finalizar',
        controles: [{ id: 'combinar', glifo: '⇉', etiqueta: 'Combinar', ancho: true }],
      },
    ],
  },
  {
    id: 'vista',
    nombre: 'Vista',
    grupos: [
      {
        id: 'zoom-grupo',
        nombre: 'Zoom',
        controles: [
          { id: 'una-pagina', glifo: '▯', etiqueta: 'Una página', corto: '1 página', ancho: true },
          { id: 'ancho', glifo: '↔', etiqueta: 'Ancho de página', corto: 'Ancho', ancho: true },
        ],
      },
    ],
  },
];

/* ─────────────────────────── el aparato ─────────────────────────── */

/** Niveles del deslizador de la barra de estado. El 45 es la prueba de «de lejos». */
export const ZOOMS = [45, 75, 100, 140] as const;
export type Zoom = (typeof ZOOMS)[number];

export interface TecniaTextosProps {
  documento: Documento;
  /** Pestañas visibles. Se pasa `CINTA_BASICO`, `_INTERMEDIO` o `_AVANZADO`. */
  cinta: Pestana[];
  pestanaActiva: PestanaId;
  zoom: Zoom;
  /** Id del grupo que parpadea pidiendo que lo busquen. */
  resaltarGrupo?: string;
  /** Id del control que parpadea. Sólo tras dos fallos: ver §34.2 (C). */
  resaltarControl?: string;
  /** Bloque del documento con el foco, para que se vea sobre qué se actúa. */
  bloqueActivo?: string;
  /** Cuenta de páginas que muestra la barra de estado. */
  paginas?: number;
  onPestana: (id: PestanaId) => void;
  onControl: (grupo: string, control: string) => void;
  onZoom: (z: Zoom) => void;
  onBloque?: (id: string) => void;
  /** Aviso del programa, en su franja bajo la cinta. No es un globo flotante. */
  aviso?: { tono: 'guia' | 'error' | 'bien'; texto: string };
}

const ANCHO_PAGINA = 380;

function claseAlineacion(a?: Alineacion) {
  return a ? ` es-${a}` : '';
}

/** Un párrafo del documento con todo su formato resuelto. */
function Parrafo({ b }: { b: BloqueParrafo }) {
  const estilo = b.estilo ?? 'normal';
  const clases = [
    'textos3d-p',
    `es-${estilo}`,
    b.lista ? `es-${b.lista}` : '',
    b.sangria ? 'es-sangria' : '',
    b.formato?.negrita ? 'es-negrita' : '',
    b.formato?.cursiva ? 'es-cursiva' : '',
    b.formato?.subrayado ? 'es-subrayado' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <p
      className={clases + claseAlineacion(b.alineacion)}
      style={{
        lineHeight: b.interlineado ?? undefined,
        fontSize: b.formato?.tamano ? `${b.formato.tamano}px` : undefined,
        color: b.formato?.color,
      }}
    >
      {b.texto}
    </p>
  );
}

function Tabla({ b }: { b: BloqueTabla }) {
  return (
    <table className="textos3d-tabla">
      <tbody>
        {b.filas.map((fila, i) => (
          <tr key={i} className={b.encabezado && i === 0 ? 'es-encabezado' : undefined}>
            {fila.map((celda, j) => <td key={j}>{celda}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Imagen({ b }: { b: BloqueImagen }) {
  const clases = [
    'textos3d-img',
    b.ajuste === 'alrededor' ? `es-alrededor es-${b.lado ?? 'izquierda'}` : 'es-en-linea',
    b.deformacion ? `es-deformada-${b.deformacion}` : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <span className={clases} style={{ width: b.ancho, height: b.alto }}>
      {b.contenido}
    </span>
  );
}

export function TecniaTextos({
  documento,
  cinta,
  pestanaActiva,
  zoom,
  resaltarGrupo,
  resaltarControl,
  bloqueActivo,
  paginas = 1,
  onPestana,
  onControl,
  onZoom,
  onBloque,
  aviso,
}: TecniaTextosProps) {
  const pestana = cinta.find(p => p.id === pestanaActiva) ?? cinta[0];
  const palabras = documento.bloques.reduce(
    (n, b) => n + (b.tipo === 'parrafo' ? b.texto.trim().split(/\s+/).filter(Boolean).length : 0),
    0,
  );

  return (
    <div className="textos3d" role="application" aria-label="Tecnia Textos, procesador de textos">
      {/* ── barra de título ── */}
      <div className="textos3d-titulo">
        <span className="textos3d-semaforo" aria-hidden="true"><i /><i /><i /></span>
        <span className="textos3d-nombre">{documento.nombre} · Tecnia Textos</span>
        <span className="textos3d-rapido" aria-hidden="true">
          <i>💾</i><i>↶</i><i>↷</i>
        </span>
      </div>

      {/* ── cinta: fila de pestañas ── */}
      <div className="textos3d-pestanas" role="tablist" aria-label="Cinta de opciones">
        {cinta.map(p => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={p.id === pestana.id}
            className={`textos3d-pestana${p.id === pestana.id ? ' es-activa' : ''}`}
            onClick={() => onPestana(p.id)}
          >
            {p.nombre}
          </button>
        ))}
      </div>

      {/* ── cinta: galería de grupos ── */}
      <div className="textos3d-galeria" role="tabpanel" aria-label={`Pestaña ${pestana.nombre}`}>
        {pestana.grupos.map(g => (
          <div
            key={g.id}
            className={`textos3d-grupo es-${g.id}${resaltarGrupo === g.id ? ' es-buscalo' : ''}`}
          >
            <div className="textos3d-grupo-controles">
              {g.controles.map(c => (
                <button
                  key={c.id}
                  type="button"
                  title={c.etiqueta}
                  aria-label={c.etiqueta}
                  aria-pressed={c.activo ?? undefined}
                  disabled={c.inerte}
                  className={[
                    'textos3d-boton',
                    `es-${c.id}`,
                    c.ancho ? 'es-ancho' : '',
                    c.activo ? 'es-hundido' : '',
                    resaltarControl === c.id ? 'es-buscalo' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => onControl(g.id, c.id)}
                >
                  <span className="textos3d-glifo" aria-hidden="true">{c.glifo}</span>
                  {c.ancho && <span className="textos3d-boton-txt">{c.corto ?? c.etiqueta}</span>}
                </button>
              ))}
            </div>
            {/* El rótulo del grupo: sin él, `of-word-la-cinta` no se puede dar. */}
            <span className="textos3d-grupo-nombre">{g.nombre}</span>
          </div>
        ))}
      </div>

      {/* ── regla ── */}
      <div className="textos3d-regla" aria-hidden="true">
        <span className="textos3d-regla-papel" style={{ width: ANCHO_PAGINA * (zoom / 100) }}>
          {Array.from({ length: 16 }, (_, i) => <i key={i} />)}
        </span>
      </div>

      {/* ── área de documento ── */}
      <div className="textos3d-lienzo">
        {aviso && (
          <p className={`textos3d-aviso es-${aviso.tono}`} role="status">{aviso.texto}</p>
        )}
        <div
          className={`textos3d-pagina${documento.columnas === 2 ? ' es-dos-columnas' : ''}`}
          style={{ width: ANCHO_PAGINA, transform: `scale(${zoom / 100})` }}
        >
          {documento.encabezado && (
            <div className="textos3d-encabezado">{documento.encabezado}</div>
          )}
          <div className="textos3d-cuerpo">
            {documento.bloques.map(b => {
              if (b.tipo === 'salto') {
                return <div key={b.id} className="textos3d-salto" aria-label="Salto de página" />;
              }
              const foco = bloqueActivo === b.id;
              return (
                <div
                  key={b.id}
                  className={`textos3d-bloque${foco ? ' es-foco' : ''}`}
                  onClick={onBloque ? () => onBloque(b.id) : undefined}
                >
                  {b.tipo === 'parrafo' && <Parrafo b={b} />}
                  {b.tipo === 'tabla' && <Tabla b={b} />}
                  {b.tipo === 'imagen' && <Imagen b={b} />}
                </div>
              );
            })}
          </div>
          {(documento.pie || documento.numeroDePagina) && (
            <div className="textos3d-pie">
              <span>{documento.pie}</span>
              {documento.numeroDePagina && <span className="textos3d-folio">1</span>}
            </div>
          )}
        </div>
      </div>

      {/* ── barra de estado: aquí vive el zoom, que es donde vive en Word ── */}
      <div className="textos3d-estado">
        <span>Página 1 de {paginas}</span>
        <span>{palabras} palabras</span>
        <span className="textos3d-zoom">
          {ZOOMS.map(z => (
            <button
              key={z}
              type="button"
              className={`textos3d-zoom-paso${z === zoom ? ' es-activo' : ''}`}
              aria-label={`Zoom al ${z} por ciento`}
              aria-pressed={z === zoom}
              onClick={() => onZoom(z)}
            >
              <i />
            </button>
          ))}
          <b>{zoom}%</b>
        </span>
      </div>
    </div>
  );
}
