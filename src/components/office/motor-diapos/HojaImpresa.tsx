'use client';

import { Lamina } from './Lamina';
import type { Mazo, PatronImpreso } from './mazo';
import { paraEscalaDeGrises, type FormaDeImprimir } from './impresion';

/**
 * **Una hoja de papel**, dibujada (§44.4).
 *
 * ── UNA SOLA HOJA PARA LOS TRES SITIOS ──────────────────────────────────────
 *
 * Esto lo usan la vista «Página de notas», las dos vistas de patrón y el previo
 * de Archivo → Imprimir. **Es el mismo componente en los tres**, y no por
 * ahorrar líneas: si el previo dibujara una hoja y la vista de notas otra, el
 * alumno vería una cosa al preparar y otra al imprimir, y eso es exactamente lo
 * que §41 pagó caro con el lienzo y la lámina del público. Aquí nace con la
 * lección aprendida: **la hoja que se toca y la hoja que sale son la misma.**
 *
 * ── POR QUÉ LA LÁMINA Y NO UN CUADRO GRIS ───────────────────────────────────
 *
 * Porque la mitad de la clase es «mira lo que sale»: que una presentación de
 * fondo oscuro impresa en color no se lee sólo se ve **viéndola**. Con cuadros
 * grises de mentira, el encargo de la escala de grises sería una pregunta de
 * examen en vez de una comprobación.
 */

/** Carta vertical. Las medidas de la hoja mandan sobre lo que quepa dentro. */
const CARTA = { alto: 11, ancho: 8.5 };

export interface HojaImpresaProps {
  mazo: Mazo;
  /** Qué diapositivas van en esta hoja. Puede venir incompleta: es la última. */
  indices: number[];
  forma: FormaDeImprimir;
  patron: PatronImpreso;
  /** Qué número de página lleva. Sin él, no se pinta aunque el patrón lo pida. */
  pagina?: number;
  total?: number;
  /** Impresa en escala de grises. */
  grises?: boolean;
  /**
   * Modo MOLDE: en vez de las diapositivas de verdad, los huecos.
   *
   * Es lo que enseña la vista de patrón, y enseñarlo con huecos y no con la
   * presentación es fiel y además es la lección: **el patrón no sabe qué
   * diapositivas van a caer aquí**. Manda sobre los bordes, no sobre el
   * contenido.
   */
  molde?: boolean;
  /** En modo molde, qué hacer al escribir en un rótulo. */
  alEscribir?: (campo: 'encabezado' | 'pie', texto: string) => void;
}

const FECHA_DE_MUESTRA = '12/08/2026';

export function HojaImpresa({
  mazo,
  indices,
  forma,
  patron,
  pagina,
  total,
  grises,
  molde,
  alEscribir,
}: HojaImpresaProps) {
  const apaisada = Boolean(forma.apaisada);
  const columnas = forma.porHoja >= 6 ? 2 : 1;
  /*
   * En grises la lámina se pinta con la presentación REASIGNADA —fondo blanco,
   * tinta oscura—, no con un filtro encima. Ver `paraEscalaDeGrises`: un filtro
   * dejaba el tema «Noche» en negro y hacía que el previo desmintiera al
   * encargo. El filtro CSS se queda igualmente, para lo que lleve color puesto
   * a mano: una forma roja o una foto.
   */
  const enPapel = grises ? paraEscalaDeGrises(mazo) : mazo;

  const rotulo = (campo: 'encabezado' | 'pie') => {
    const texto = patron[campo];
    if (molde) {
      return (
        <input
          className="hoja-rotulo es-molde"
          data-hoja-rotulo={campo}
          value={texto ?? ''}
          placeholder={campo === 'encabezado' ? 'Encabezado' : 'Pie de página'}
          onChange={(e) => alEscribir?.(campo, e.target.value)}
        />
      );
    }
    // Fuera del molde, un rótulo vacío **no ocupa sitio**: una hoja con un hueco
    // reservado para un encabezado que nadie escribió es una hoja mal impresa.
    return texto ? <span className="hoja-rotulo">{texto}</span> : null;
  };

  return (
    <div
      className={`hoja${apaisada ? ' es-apaisada' : ''}${grises ? ' es-grises' : ''}${
        molde ? ' es-molde' : ''
      }`}
      style={{ aspectRatio: apaisada ? `${CARTA.alto} / ${CARTA.ancho}` : `${CARTA.ancho} / ${CARTA.alto}` }}
      data-hoja={pagina ?? 1}
    >
      <div className="hoja-arriba">
        {rotulo('encabezado')}
        {(patron.fecha ?? true) && <span className="hoja-fecha">{FECHA_DE_MUESTRA}</span>}
      </div>

      <div
        className={`hoja-cuerpo${forma.conRayas ? ' es-con-rayas' : ''}${
          forma.conNotas ? ' es-con-notas' : ''
        }`}
        style={{ '--cols': columnas } as React.CSSProperties}
      >
        {indices.map((i) => (
          <div key={i} className="hoja-hueco">
            <div className="hoja-lamina">
              {molde ? (
                <div className="hoja-lamina-molde" aria-hidden="true">
                  <span>Diapositiva</span>
                </div>
              ) : (
                <Lamina mazo={enPapel} diapositiva={enPapel.diapositivas[i]} />
              )}
            </div>
            {/*
              Las rayas del documento de 3, al lado de cada diapositiva. Son la
              razón entera de que ese formato exista, así que se dibujan de
              verdad y no como un adorno del cuadro de opciones.
            */}
            {forma.conRayas && (
              <div className="hoja-rayas" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((r) => (
                  <i key={r} />
                ))}
              </div>
            )}
            {forma.conNotas && (
              <div className="hoja-notas">
                {molde ? (
                  <span className="hoja-notas-molde">Estilo del texto de notas</span>
                ) : mazo.diapositivas[i]?.notas ? (
                  mazo.diapositivas[i].notas!.split('\n').map((linea, k) => <p key={k}>{linea}</p>)
                ) : (
                  <span className="hoja-notas-vacio">Esta diapositiva no lleva notas.</span>
                )}
              </div>
            )}
          </div>
        ))}
        {/*
          Los huecos que faltan en la última hoja **se dejan en blanco**, y por
          eso hay que pintarlos: sin ellos, tres diapositivas en un documento de
          seis se estirarían para llenar la hoja y el previo enseñaría un reparto
          que el papel no va a hacer.
        */}
        {!molde &&
          Array.from({ length: Math.max(0, forma.porHoja - indices.length) }).map((_, k) => (
            <div key={`hueco-${k}`} className="hoja-hueco es-vacio" aria-hidden="true" />
          ))}
      </div>

      <div className="hoja-abajo">
        {rotulo('pie')}
        {(patron.numero ?? true) && pagina !== undefined && (
          <span className="hoja-pagina">
            {pagina}
            {total !== undefined ? ` de ${total}` : ''}
          </span>
        )}
      </div>
    </div>
  );
}

export default HojaImpresa;
