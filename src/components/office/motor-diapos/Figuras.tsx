'use client';

import { Suspense, lazy } from 'react';
import { admiteRelleno, type Libre } from './modelo';
import { oscurecer } from './consultas';
import type { Tema } from './mazo';

/**
 * Las formas dibujadas y el modelo 3D (§44.2).
 *
 * ── POR QUÉ SVG Y NO CAJAS CON `border-radius` ──────────────────────────────
 *
 * Porque una flecha y una línea no son cajas. Con CSS se puede fingir un
 * rectángulo y hasta una elipse, pero la flecha acaba siendo un triángulo
 * pegado a un `div` y la línea, un borde: tres dibujos con tres reglas
 * distintas, y el relleno y el contorno funcionando de tres maneras. En SVG las
 * cuatro son la misma cosa —un trazo con `fill` y `stroke`—, que es exactamente
 * lo que el alumno tiene que entender: **dentro y raya se eligen por separado**.
 *
 * `preserveAspectRatio="none"` a propósito: la forma se estira a su casilla,
 * como en PowerPoint. Una elipse dentro de una caja ancha es un óvalo ancho, y
 * eso es lo que espera quien la arrastró.
 */

/** El grosor de la raya, en unidades del `viewBox`. */
const RAYA = 3;

export function Figura({ l, tema }: { l: Libre; tema: Tema }) {
  const f = l.formato ?? {};
  /*
   * Sin decir nada, una forma nace **con las dos cosas puestas**: el color del
   * tema dentro y ese mismo color más oscuro en la raya, que es como nace en
   * PowerPoint. Antes nacía sin raya, y con eso el encargo «quítale el
   * contorno» no cambiaba un píxel: el alumno hacía el gesto bien y la pantalla
   * le decía que no había hecho nada.
   *
   * `'ninguno'` es distinto de no haber dicho nada: es el alumno diciendo «sin
   * relleno», y por eso se guarda (ver `Formato`).
   */
  const lleva = admiteRelleno(l.figura!);
  const relleno = f.relleno ?? (lleva ? tema.acento : 'ninguno');
  const contorno = f.contorno ?? oscurecer(tema.acento);
  const fill = relleno === 'ninguno' ? 'none' : relleno;
  const stroke = contorno === 'ninguno' ? 'none' : contorno;

  return (
    <span className="dpw-figura">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {l.figura === 'rectangulo' && (
          <rect
            x={RAYA / 2}
            y={RAYA / 2}
            width={100 - RAYA}
            height={100 - RAYA}
            rx="2"
            fill={fill}
            stroke={stroke}
            strokeWidth={RAYA}
          />
        )}
        {l.figura === 'elipse' && (
          <ellipse
            cx="50"
            cy="50"
            rx={50 - RAYA / 2}
            ry={50 - RAYA / 2}
            fill={fill}
            stroke={stroke}
            strokeWidth={RAYA}
          />
        )}
        {/*
          La flecha va de izquierda a derecha y ocupa su caja entera. Es una
          sola figura y no una línea con una punta encima: así al estirarla se
          estira entera, y al ponerle contorno se le pone a todo el borde.

          Sin apaños de relleno: es una flecha de BLOQUE y tiene dentro como
          cualquier otra forma, así que se pinta con el `fill` que le toque —el
          del tema, el que eligió el alumno o ninguno—.
        */}
        {l.figura === 'flecha' && (
          <polygon
            points="0,35 62,35 62,8 100,50 62,92 62,65 0,65"
            fill={fill}
            stroke={stroke}
            strokeWidth={RAYA}
            strokeLinejoin="round"
          />
        )}
        {/*
          Una línea sólo tiene raya, y ésa es su lección: el botón de relleno se
          apaga con ella seleccionada, y no porque la clase lo diga sino porque
          `admiteRelleno` lo deriva de la figura.

          Y obedece a «Sin contorno» aunque eso la deje invisible, que es lo que
          hace PowerPoint. Forzarle un color para que se siguiera viendo era el
          mismo defecto que el relleno de la flecha: un gesto del alumno que el
          programa se traga. La caja sigue estando —se puede volver a pinchar y
          Deshacer sigue ahí—, así que no es un callejón.
        */}
        {l.figura === 'linea' && (
          <line
            x1="0"
            y1="50"
            x2="100"
            y2="50"
            stroke={stroke}
            strokeWidth={RAYA}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      {/*
        El texto de dentro, si lo tiene. En PowerPoint una forma se escribe
        haciendo doble clic encima, y el texto se centra solo — por eso va aquí
        y no como un objeto aparte pegado encima: si fueran dos, moverla dejaría
        la etiqueta atrás.
      */}
      {l.contenido && <span className="dpw-figura-texto">{l.contenido}</span>}
    </span>
  );
}

/*
 * El modelo 3D llega por `lazy` y no por un import normal: `three` pesa más que
 * el resto de la ventana junta, y doce clases de PowerPoint no lo usan. Sin
 * esto, abrir «Tus primeras diapositivas» descargaría el motor 3D para no
 * enseñar ni un cubo.
 */
const Escena3D = lazy(() => import('./Escena3D'));

export function Modelo3D({ l }: { l: Libre }) {
  return (
    <span className="dpw-modelo3d">
      <Suspense fallback={<span className="dpw-modelo3d-cargando">Cargando el modelo…</span>}>
        <Escena3D contenido={l.contenido} giro={l.giro} />
      </Suspense>
    </span>
  );
}
