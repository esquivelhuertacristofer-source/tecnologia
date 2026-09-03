'use client';

import { formatoConPatron, temaDe, type Mazo } from './mazo';
import { tintaSobre } from './consultas';
import { Dibujado, esDibujado } from './Dibujados';
import { Figura, Modelo3D } from './Figuras';
import { MiniZoom } from './MiniZoom';
import { Reproductor } from './Reproductor';
import {
  FILAS,
  colsDe,
  GLIFO_ACCION,
  LIENZO_ALTO,
  cajaEntera,
  casillaDe,
  recorteDe,
  rolesDe,
  type Animacion,
  type Diapositiva,
  type Libre,
} from './modelo';
import { TAMANO_BASE_DIAPO } from '@/components/activities/office/tecniaDiapositivas';

/**
 * Del castellano del modelo al inglés del CSS.
 *
 * Parece un detalle y era un defecto: los tres botones de alineación guardaban
 * `'izquierda' | 'centro' | 'derecha'` y se entregaban tal cual a `textAlign`,
 * que no entiende ninguna de las tres. El navegador tira la declaración en
 * silencio, así que **centrar un texto no centraba nada** y el único síntoma era
 * un botón que se hundía sin que la diapositiva cambiara. Lo destapó el
 * compilador al sacar esta lámina del archivo donde el estilo iba con un
 * `as React.CSSProperties` encima, que es exactamente lo que hace un `as`: callar
 * al que avisa.
 */
export const CSS_ALINEACION = {
  izquierda: 'left',
  centro: 'center',
  derecha: 'right',
} as const;

/**
 * La diapositiva **como la ve el público**: sólo lectura, sin selección, sin
 * tiradores y medida en porcentajes, así que sirve a cualquier tamaño.
 *
 * ── POR QUÉ EXISTE, Y ES UNA CICATRIZ ───────────────────────────────────────
 *
 * Hasta el 11-ago-2026 esto estaba escrito dos veces: una en el lienzo de la
 * ventana y otra dentro del repaso a pantalla completa. Las dos copias se
 * separaron sin que nadie lo notara —la del repaso dibujaba los marcadores y
 * **no los objetos libres**—, y el sitio donde se pagó fue el peor posible: la
 * clase 2 se pasa entera pidiéndole al alumno que elija la imagen que apoya, y
 * al pulsar «Repasar» —«así lo verá tu grupo»— la imagen no estaba. La única
 * vista que existe para decir la verdad era la que mentía.
 *
 * Ahora el repaso y la pantalla del auditorio son **la misma lámina**. Si un
 * día aparece una tercera superficie que proyecte diapositivas, se cuelga aquí
 * y no puede divergir. El lienzo de la ventana sigue siendo suyo y con motivo:
 * mide en píxeles porque tiene que aceptar arrastres, y esta lámina mide en
 * porcentajes porque tiene que caber en cualquier pantalla.
 *
 * ── EL TAMAÑO DE LA LETRA ───────────────────────────────────────────────────
 *
 * Los puntos se convierten a una fracción del ALTO DE LA PROPIA LÁMINA (`cqh`),
 * no a píxeles ni a `vh`: una diapositiva proyectada en una pared de seis metros
 * tiene la misma proporción de letra que en un portátil, y eso es justo lo que
 * la clase 2 enseña. Medir contra la ventana (`vh`) sólo funcionaría para el
 * repaso, que la ocupa entera; la pantalla del auditorio es un rectángulo
 * pequeño dentro de una escena 3D y con `vh` saldría con la letra gigante.
 */
/**
 * Una foto con su recorte, en las DOS superficies.
 *
 * La foto no se mueve ni se reescala al recortar: lo que cambia es el marco, y
 * la parte que sobra deja de verse. Por eso la imagen se pinta al tamaño que
 * tendría **sin recortar** (`cajaEntera`) y se corre hacia arriba y hacia la
 * izquierda lo que se le haya quitado por esos lados. Es la misma cuenta en el
 * lienzo de trabajo y en la lámina del público, y vive aquí para que no pueda
 * ser dos cuentas distintas.
 *
 * `object-fit` cambia con `proporcion` y no por gusto: una imagen que declara
 * su forma natural se pinta con `fill`, o sea **estirada si el marco no
 * respeta esa forma** — que es justo lo que la clase de §42.2 necesita que se
 * VEA—. Las que no la declaran siguen con `cover`, que es lo que llevaban las
 * trece clases anteriores.
 */
export function FotoRecortada({ l }: { l: Libre }) {
  const r = recorteDe(l);
  const entera = cajaEntera(l);
  return (
    <span className="dpw-recorte">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={l.fuente}
        alt={l.alt ?? l.contenido}
        className="dpw-foto"
        draggable={false}
        style={{
          width: `${(entera.cols / l.casilla.cols) * 100}%`,
          height: `${(entera.filas / l.casilla.filas) * 100}%`,
          left: `${(-r.izquierda / l.casilla.cols) * 100}%`,
          top: `${(-r.arriba / l.casilla.filas) * 100}%`,
          objectFit: l.proporcion ? 'fill' : 'cover',
        }}
      />
    </span>
  );
}

/**
 * El altavoz de un audio insertado.
 *
 * En PowerPoint un audio se ve como un icono de bocina con una barra de
 * reproducción debajo, y aquí igual: si se viera como una caja de texto o como
 * un botón cualquiera, el alumno no reconocería lo mismo el lunes. Suena al
 * pulsar el botón y **no al llegar a la diapositiva**, que es la decisión que
 * la clase le pide tomar (§42.2).
 */
export function Altavoz({
  sonido,
  sonando,
  alTocar,
}: {
  sonido: string;
  sonando: boolean;
  alTocar: () => void;
}) {
  return (
    <span className={`dpw-altavoz${sonando ? ' es-sonando' : ''}`}>
      <span className="dpw-altavoz-icono" aria-hidden="true">
        🔊
      </span>
      <button
        type="button"
        className="dpw-altavoz-boton"
        aria-label={sonando ? 'Parar el sonido' : `Reproducir ${sonido}`}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          alTocar();
        }}
      >
        {sonando ? '❚❚' : '▶'}
      </button>
    </span>
  );
}

/**
 * Qué se ve de una caja con `revelados` pasos de animación ya disparados.
 *
 * Vive aquí y no en el modelo porque **es una pregunta de pintura**: el modelo
 * dice qué animación tiene cada caja y en qué orden, y esto traduce ese orden a
 * «se ve / no se ve / se está moviendo ahora». Sin animación, siempre visible —
 * que es lo que hace que las trece clases anteriores sigan pintándose igual sin
 * tocar una línea.
 */
function comoSeVe(anim: Animacion | undefined, revelados: number) {
  if (!anim) return { visible: true, clase: '' };
  if (anim.tipo === 'aparecer') {
    return {
      visible: revelados >= anim.orden,
      clase: revelados === anim.orden ? ' es-entrando' : '',
    };
  }
  if (anim.tipo === 'salir') {
    return { visible: revelados < anim.orden, clase: '' };
  }
  return { visible: true, clase: revelados === anim.orden ? ' es-enfasis' : '' };
}

export interface LaminaProps {
  mazo: Mazo;
  diapositiva: Diapositiva;
  /**
   * Cuántos pasos de animación se han disparado ya. Sin ella, todos.
   *
   * El valor por omisión es infinito y no cero, y eso es deliberado: una lámina
   * es «la diapositiva terminada» salvo que alguien esté presentándola paso a
   * paso. Con cero por omisión, la miniatura del auditorio y el repaso de las
   * clases que no animan nada saldrían en blanco.
   */
  revelados?: number;
  /** Qué número lleva esta diapositiva en el pie. Sin él, no se pinta. */
  numero?: number | null;
  /** El texto del pie, ya decidido por `pieDe`: aquí no se decide nada (§44.3). */
  pie?: string | null;
  /** Qué audio está sonando ahora mismo, para pintar su altavoz vivo. */
  sonando?: string | null;
  /**
   * Qué hacer al pulsar el ▶ de un altavoz.
   *
   * Lo pone quien monta la lámina y no la lámina misma, porque quien sabe si
   * hay que contar el gesto —y quién apaga el altavoz cuando termina— es la
   * ventana. Sin esta función el altavoz se pinta igual pero no suena, que es
   * lo correcto en una miniatura.
   */
  alSonar?: (id: string, sonido: string) => void;
  /**
   * Qué hacer al pulsar un objeto que tiene vínculo (§43.5).
   *
   * Sólo lo pone quien está **presentando**. En el lienzo de trabajo un vínculo
   * no salta —pulsarlo selecciona la caja, como en el programa de verdad—, y
   * ésa es media lección: el menú no se prueba mirándolo, se prueba
   * presentándolo. Sin esta función la lámina pinta los vínculos igual y no
   * salta ninguno, que es lo correcto en una miniatura.
   */
  alSaltar?: (destino: number | 'atras') => void;
}

export function Lamina({
  mazo,
  diapositiva,
  revelados = Number.POSITIVE_INFINITY,
  numero = null,
  pie = null,
  sonando = null,
  alSonar,
  alSaltar,
}: LaminaProps) {
  // El de ESTA diapositiva: si vino de otro archivo con su cara puesta, manda la
  // suya (§44.5). La lámina es lo que ve el público, así que aquí no vale
  // preguntarle al archivo.
  const tema = temaDe(mazo.tema, diapositiva.tema);
  /*
   * Las columnas de ESTA presentación (§44.3). La lámina reparte en porcentajes
   * sobre un contenedor cuya proporción ya es la de la forma, así que dividir
   * por 12 en una presentación de nueve columnas encogería todo a tres cuartos y
   * dejaría una franja muerta a la derecha. `FILAS` no aparece porque no cambia:
   * las dos formas tienen nueve.
   */
  const cols = colsDe(mazo.forma);
  const fondo = diapositiva.fondo ?? tema.fondo;

  return (
    <div className="dpw-lamina" style={{ background: fondo }}>
      {rolesDe(diapositiva.diseno).map((rol) => {
        const c = casillaDe(diapositiva, rol, mazo.forma);
        const m = diapositiva.marcadores.find((x) => x.rol === rol);
        if (!c || !m?.contenido) return null;
        const v = comoSeVe(m.animacion, revelados);
        if (!v.visible) return null;
        // Con el patrón por debajo (§43.4): el público ve lo heredado igual
        // que el lienzo, que es lo que hace que la tira no mienta.
        const f = formatoConPatron(mazo, diapositiva, rol);
        const pt = f.pt ?? TAMANO_BASE_DIAPO[rol] ?? 24;
        return (
          <div
            key={rol}
            className={`dpw-lamina-caja${v.clase}`}
            style={{
              left: `${(c.col / cols) * 100}%`,
              top: `${(c.fila / FILAS) * 100}%`,
              width: `${(c.cols / cols) * 100}%`,
              height: `${(c.filas / FILAS) * 100}%`,
              color: f.color ?? (rol === 'titulo' ? tema.titulo : tema.texto),
              fontWeight: f.negrita ? 800 : rol === 'titulo' ? 700 : 500,
              fontStyle: f.cursiva ? 'italic' : undefined,
              textDecoration: f.subrayado ? 'underline' : undefined,
              textAlign: f.alineacion
                ? CSS_ALINEACION[f.alineacion]
                : rol === 'titulo' || rol === 'subtitulo'
                  ? 'center'
                  : 'left',
              fontSize: `${(pt / LIENZO_ALTO) * 100}cqh`,
            }}
          >
            {/*
              Las viñetas se pintan con la MISMA marca que el lienzo —un `<ul>`
              con su `list-style`— y no con un `::before` propio. El repaso
              viejo no las pintaba en absoluto: la clase 2 pide «ponles
              viñetas» y al mirar la presentación como la ve el público no
              había ni una. Dos maneras de dibujar lo mismo son dos maneras de
              que una empiece a mentir.
            */}
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
        );
      })}
      {/*
        Los objetos que el alumno metió por su cuenta, de abajo a arriba. El
        orden importa: `z` es el que decidió él al insertarlos y moverlos.
      */}
      {[...diapositiva.libres]
        .sort((a, b) => a.z - b.z)
        .map((l) => ({ l, v: comoSeVe(l.animacion, revelados) }))
        .filter(({ v }) => v.visible)
        .map(({ l, v }) => (
          <div
            key={l.id}
            /*
             * Un objeto con vínculo se marca en el DOM aunque nadie esté
             * presentando: `es-vinculo` es lo que le pone el dedito en el
             * lienzo de trabajo —«esto lleva a algún sitio»— y `es-saltable` lo
             * que lo hace pulsable, que sólo pasa presentando.
             */
            className={`dpw-lamina-caja${v.clase}${l.destino !== undefined ? ' es-vinculo' : ''}${
              l.destino !== undefined && alSaltar ? ' es-saltable' : ''
            }${l.accion ? ' es-accion' : ''}`}
            data-destino={l.destino}
            role={l.destino !== undefined && alSaltar ? 'button' : undefined}
            tabIndex={l.destino !== undefined && alSaltar ? 0 : undefined}
            onClick={
              l.destino !== undefined && alSaltar
                ? (e) => {
                    // Sin esto el clic sigue subiendo a la tela del repaso, que
                    // avanza a la siguiente: el alumno pulsaría «Volcanes» y
                    // acabaría en la diapositiva de después, o sea en otra. Un
                    // menú que además avanza no es un menú.
                    e.stopPropagation();
                    alSaltar(l.destino!);
                  }
                : undefined
            }
            onKeyDown={
              l.destino !== undefined && alSaltar
                ? (e) => {
                    if (e.key !== 'Enter' && e.key !== ' ') return;
                    e.preventDefault();
                    e.stopPropagation();
                    alSaltar(l.destino!);
                  }
                : undefined
            }
            style={{
              left: `${(l.casilla.col / cols) * 100}%`,
              top: `${(l.casilla.fila / FILAS) * 100}%`,
              width: `${(l.casilla.cols / cols) * 100}%`,
              height: `${(l.casilla.filas / FILAS) * 100}%`,
              color: l.formato?.color ?? tema.texto,
              fontSize: `${((l.formato?.pt ?? 24) / LIENZO_ALTO) * 100}cqh`,
              /*
               * El formato entero, no sólo el color y el tamaño.
               *
               * Hasta el 11-ago-2026 una caja de texto que el alumno metía por
               * su cuenta ignoraba negrita, cursiva, subrayado y alineación en
               * las DOS superficies: los tres botones se hundían y el texto no
               * cambiaba. Es el mismo defecto que `CSS_ALINEACION` destapó en
               * los marcadores, escondido un piso más abajo — y salió al
               * necesitar cuatro rótulos alineados a la derecha para que
               * tocaran el dibujo que nombran.
               */
              fontWeight: l.formato?.negrita ? 800 : 500,
              fontStyle: l.formato?.cursiva ? 'italic' : undefined,
              textDecoration: l.formato?.subrayado ? 'underline' : undefined,
              textAlign: l.formato?.alineacion ? CSS_ALINEACION[l.formato.alineacion] : undefined,
              zIndex: 10 + l.z,
            }}
          >
            {l.clase === 'audio' ? (
              <Altavoz
                sonido={l.sonido ?? ''}
                sonando={sonando === l.id}
                alTocar={() => alSonar?.(l.id, l.sonido ?? '')}
              />
            ) : l.clase === 'video' ? (
              <Reproductor libre={l} />
            ) : l.clase === 'forma' ? (
              /*
               * Una forma se ve como una forma: relleno y contorno. Y un botón
               * de acción es **la misma marca con su glifo delante**, porque en
               * PowerPoint un botón de acción es literalmente una forma con
               * destino. Dos dibujos distintos habrían sido dos cosas que
               * pueden separarse; ésta no puede.
               *
               * Sin esto los tres botones del menú de §43.5 se veían como texto
               * suelto flotando sobre el fondo, y «botón» era una palabra del
               * enunciado que no se correspondía con nada en pantalla.
               */
              l.figura ? (
                <Figura l={l} tema={tema} />
              ) : (
                <p className="dpw-accion">
                  {l.accion && <b aria-hidden="true">{GLIFO_ACCION[l.accion]}</b>}
                  <span>{l.contenido}</span>
                </p>
              )
            ) : l.clase === 'modelo3d' ? (
              <Modelo3D l={l} />
            ) : l.clase === 'zoom' ? (
              <MiniZoom mazo={mazo} libre={l} tinta={l.formato?.color ?? tema.texto} />
            ) : esDibujado(l) ? (
              <Dibujado libre={l} tinta={l.formato?.color ?? tema.texto} acento={tema.titulo} />
            ) : l.fuente ? (
              <FotoRecortada l={l} />
            ) : (
              <p>{l.contenido}</p>
            )}
          </div>
        ))}
      {/* El pie con el número, abajo a la derecha, como en el programa. */}
      {numero !== null && (
        <span className="dpw-pie-numero" style={{ color: tintaSobre(fondo, tema.texto) }}>
          {numero}
        </span>
      )}
      {/* Y el texto del pie, abajo a la IZQUIERDA, que es donde lo pone
          PowerPoint. En la esquina contraria al número a propósito: si
          compartieran esquina, un pie largo empujaría al número fuera de la
          diapositiva justo en la clase que enseña a poner los dos (§44.3). */}
      {pie && (
        <span className="dpw-pie-texto" style={{ color: tintaSobre(fondo, tema.texto) }}>
          {pie}
        </span>
      )}
    </div>
  );
}

export default Lamina;
