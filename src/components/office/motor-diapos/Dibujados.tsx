import {
  COL_PX,
  FILA_PX,
  type Casilla,
  type GraficoId,
  type Libre,
  type Serie,
  type SmartArtId,
} from './modelo';

/**
 * Los tres objetos que se DIBUJAN a partir de sus datos (§43.2).
 *
 * ── POR QUÉ SVG Y NO DIVS ───────────────────────────────────────────────────
 *
 * Porque cada uno de estos objetos se ve en **cuatro tamaños distintos a la
 * vez**: el lienzo de trabajo con su zoom, la miniatura de la tira, la lámina
 * del público a pantalla completa y —desde §43.1— la Vista Moderador. Con
 * `divs` y tipografías en píxeles habría que calibrar cuatro veces y las
 * cuatro se irían separando. Con un `viewBox` que sale de la casilla, el
 * navegador escala el dibujo entero, texto incluido, y los cuatro tamaños son
 * el mismo dibujo. Es la misma decisión que las láminas del volcán.
 *
 * ── Y POR QUÉ SE DERIVAN ────────────────────────────────────────────────────
 *
 * Ninguno de los tres tiene una coordenada escrita a mano. Un proceso de cuatro
 * pasos son cuatro cajas y tres flechas **calculadas a partir de la lista**; si
 * mañana son cinco, no hay nada que tocar. Un SmartArt con las cajas puestas a
 * ojo sería un adorno con forma de diagrama, y la clase entera va de que la
 * forma dice algo del dato.
 */

/** El `viewBox` sale de la casilla: el dibujo se compone en píxeles de maqueta. */
const lienzoDe = (c: Casilla) => ({ w: c.cols * COL_PX, h: c.filas * FILA_PX });

export interface PintaProps {
  libre: Libre;
  /** El color de la letra que manda ahora mismo: el del tema o el de la caja. */
  tinta: string;
  /** El color de acento, para las barras y las cajas. */
  acento: string;
}

/* ── el texto que tiene que caber ─────────────────────────────────────────── */

/**
 * Parte una frase en renglones que quepan en `ancho`.
 *
 * A ojo de caracteres y no midiendo: dentro de un SVG no hay a quién
 * preguntarle cuánto mide un texto sin montarlo, y montar para medir es lo que
 * convierte un dibujo en un parpadeo. Con 0,54 em por carácter —la media de la
 * Segoe UI— la cuenta se queda corta antes que larga, que es el error que se
 * puede permitir: sobra aire, no falta.
 */
function enRenglones(texto: string, ancho: number, pt: number, max = 3): string[] {
  const porRenglon = Math.max(6, Math.floor(ancho / (pt * 0.54)));
  const palabras = texto.split(/\s+/).filter(Boolean);
  const salen: string[] = [];
  let linea = '';
  for (const p of palabras) {
    const junto = linea ? `${linea} ${p}` : p;
    if (junto.length <= porRenglon) linea = junto;
    else {
      if (linea) salen.push(linea);
      linea = p;
    }
  }
  if (linea) salen.push(linea);
  if (salen.length <= max) return salen;
  // Lo que no cabe se corta con puntos suspensivos, como haría el programa.
  const cortado = salen.slice(0, max);
  cortado[max - 1] = `${cortado[max - 1].slice(0, Math.max(1, porRenglon - 1))}…`;
  return cortado;
}

/** Un bloque de texto centrado dentro de una caja, en varios renglones. */
function Frase({
  texto,
  x,
  y,
  ancho,
  pt,
  color,
  peso = 600,
}: {
  texto: string;
  x: number;
  y: number;
  ancho: number;
  pt: number;
  color: string;
  peso?: number;
}) {
  const lineas = enRenglones(texto, ancho - 10, pt);
  const alto = lineas.length * pt * 1.18;
  return (
    <text
      x={x}
      y={y - alto / 2 + pt * 0.92}
      fontFamily="Segoe UI, Carlito, Calibri, sans-serif"
      fontSize={pt}
      fontWeight={peso}
      fill={color}
      textAnchor="middle"
    >
      {lineas.map((l, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : pt * 1.18}>
          {l}
        </tspan>
      ))}
    </text>
  );
}

/* ── SmartArt ─────────────────────────────────────────────────────────────── */

function Proceso({ pasos, w, h, tinta, acento }: { pasos: string[]; w: number; h: number; tinta: string; acento: string }) {
  const n = Math.max(1, pasos.length);
  const flecha = Math.min(26, w * 0.05);
  const ancho = (w - flecha * (n - 1) - 8) / n;
  const alto = Math.min(h - 8, ancho * 0.72);
  const y = h / 2;
  const pt = Math.max(9, Math.min(alto * 0.2, ancho * 0.13));
  return (
    <>
      {pasos.map((p, i) => {
        const x = 4 + i * (ancho + flecha);
        return (
          <g key={i}>
            <rect
              x={x}
              y={y - alto / 2}
              width={ancho}
              height={alto}
              rx={Math.min(10, ancho * 0.08)}
              fill={acento}
              opacity={0.92}
            />
            <Frase texto={p} x={x + ancho / 2} y={y} ancho={ancho} pt={pt} color="#fff" peso={700} />
            {i < n - 1 && (
              /* La flecha se calcula, no se dibuja: nace donde acaba una caja y
                 muere donde empieza la siguiente. */
              <path
                d={`M${x + ancho + 3} ${y} h${flecha - 12} m0 -6 l8 6 l-8 6 z`}
                stroke={tinta}
                strokeWidth={2.5}
                fill={tinta}
                opacity={0.7}
              />
            )}
          </g>
        );
      })}
    </>
  );
}

function Jerarquia({ pasos, w, h, tinta, acento }: { pasos: string[]; w: number; h: number; tinta: string; acento: string }) {
  const [jefe, ...hijos] = pasos.length ? pasos : [''];
  const n = Math.max(1, hijos.length);
  const anchoJefe = Math.min(w * 0.46, 260);
  const altoCaja = Math.min(h * 0.3, 62);
  const hueco = Math.min(14, w * 0.03);
  const anchoHijo = (w - 8 - hueco * (n - 1)) / n;
  const yJefe = altoCaja / 2 + 4;
  const yHijos = h - altoCaja / 2 - 4;
  const pt = Math.max(9, Math.min(altoCaja * 0.26, anchoHijo * 0.14));
  return (
    <>
      <rect
        x={(w - anchoJefe) / 2}
        y={yJefe - altoCaja / 2}
        width={anchoJefe}
        height={altoCaja}
        rx={9}
        fill={acento}
      />
      <Frase texto={jefe} x={w / 2} y={yJefe} ancho={anchoJefe} pt={pt} color="#fff" peso={700} />
      {hijos.map((c, i) => {
        const x = 4 + i * (anchoHijo + hueco);
        const cx = x + anchoHijo / 2;
        return (
          <g key={i}>
            {/* El codo: baja del jefe, cruza y baja al hijo. Tres tramos y los
                tres salen de las posiciones, no de números escritos. */}
            <path
              d={`M${w / 2} ${yJefe + altoCaja / 2} V${(yJefe + yHijos) / 2} H${cx} V${yHijos - altoCaja / 2}`}
              stroke={tinta}
              strokeWidth={2}
              fill="none"
              opacity={0.55}
            />
            <rect
              x={x}
              y={yHijos - altoCaja / 2}
              width={anchoHijo}
              height={altoCaja}
              rx={9}
              fill={acento}
              opacity={0.72}
            />
            <Frase texto={c} x={cx} y={yHijos} ancho={anchoHijo} pt={pt} color="#fff" peso={600} />
          </g>
        );
      })}
    </>
  );
}

function Ciclo({ pasos, w, h, tinta, acento }: { pasos: string[]; w: number; h: number; tinta: string; acento: string }) {
  const n = Math.max(1, pasos.length);
  const r = Math.min(w, h) * 0.33;
  const cx = w / 2;
  const cy = h / 2;
  const rc = Math.min(r * 0.62, Math.min(w, h) * 0.2);
  const pt = Math.max(8, rc * 0.28);
  return (
    <>
      <circle cx={cx} cy={cy} r={r} stroke={tinta} strokeWidth={2.5} fill="none" opacity={0.35} />
      {/*
        Las puntas de flecha del aro, una en cada hueco entre dos pasos.
        Sin ellas esto son cuatro círculos alrededor de una rueda y no se lee
        que va en un sentido: un ciclo dice «y vuelve a empezar», y eso lo
        dicen las puntas, no el aro. Van en el punto medio del hueco, donde el
        aro se ve —detrás de los pasos queda tapado—, apuntando en la
        dirección en la que crece el ángulo, que es como se recorre.
      */}
      {n > 1 &&
        pasos.map((_, i) => {
          const am = ((i + 0.5) / n) * Math.PI * 2 - Math.PI / 2;
          const px = cx + Math.cos(am) * r;
          const py = cy + Math.sin(am) * r;
          const tx = -Math.sin(am);
          const ty = Math.cos(am);
          const fa = Math.max(6, rc * 0.32);
          const b1x = px - tx * fa * 0.5 + Math.cos(am) * fa * 0.72;
          const b1y = py - ty * fa * 0.5 + Math.sin(am) * fa * 0.72;
          const b2x = px - tx * fa * 0.5 - Math.cos(am) * fa * 0.72;
          const b2y = py - ty * fa * 0.5 - Math.sin(am) * fa * 0.72;
          return (
            <path
              key={`punta-${i}`}
              d={`M ${px + tx * fa} ${py + ty * fa} L ${b1x} ${b1y} L ${b2x} ${b2y} Z`}
              fill={tinta}
              opacity={0.55}
            />
          );
        })}
      {pasos.map((p, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        return (
          <g key={i}>
            <circle cx={cx + Math.cos(a) * r} cy={cy + Math.sin(a) * r} r={rc} fill={acento} opacity={0.92} />
            <Frase
              texto={p}
              x={cx + Math.cos(a) * r}
              y={cy + Math.sin(a) * r}
              ancho={rc * 1.9}
              pt={pt}
              color="#fff"
              peso={700}
            />
          </g>
        );
      })}
    </>
  );
}

/* ── gráficos ─────────────────────────────────────────────────────────────── */

const CIFRA = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

function Barras({ series, w, h, tinta, acento }: { series: Serie[]; w: number; h: number; tinta: string; acento: string }) {
  const n = Math.max(1, series.length);
  const tope = Math.max(1, ...series.map((s) => s.valor));
  const pt = Math.max(8, Math.min(13, w / (n * 9)));
  const abajo = h - pt * 2.6;
  const arriba = pt * 1.9;
  const hueco = Math.min(18, w * 0.035);
  const ancho = (w - 12 - hueco * (n - 1)) / n;
  return (
    <>
      {/* La raya del suelo. Sin ella las barras flotan y no se comparan. */}
      <path d={`M6 ${abajo} H${w - 6}`} stroke={tinta} strokeWidth={1.5} opacity={0.35} />
      {series.map((s, i) => {
        const alto = ((abajo - arriba) * s.valor) / tope;
        const x = 6 + i * (ancho + hueco);
        return (
          <g key={i}>
            <rect x={x} y={abajo - alto} width={ancho} height={alto} rx={3} fill={acento} />
            <text
              x={x + ancho / 2}
              y={abajo - alto - pt * 0.45}
              fontFamily="Segoe UI, Carlito, sans-serif"
              fontSize={pt}
              fontWeight={800}
              fill={tinta}
              textAnchor="middle"
            >
              {CIFRA(s.valor)}
            </text>
            <text
              x={x + ancho / 2}
              y={abajo + pt * 1.4}
              fontFamily="Segoe UI, Carlito, sans-serif"
              fontSize={pt}
              fill={tinta}
              opacity={0.85}
              textAnchor="middle"
            >
              {s.nombre}
            </text>
          </g>
        );
      })}
    </>
  );
}

function Lineas({ series, w, h, tinta, acento }: { series: Serie[]; w: number; h: number; tinta: string; acento: string }) {
  const n = Math.max(1, series.length);
  const tope = Math.max(1, ...series.map((s) => s.valor));
  const pt = Math.max(8, Math.min(13, w / (n * 9)));
  const abajo = h - pt * 2.6;
  const arriba = pt * 1.9;
  const paso = n > 1 ? (w - 24) / (n - 1) : 0;
  const punto = (s: Serie, i: number) => ({
    x: 12 + i * paso,
    y: abajo - ((abajo - arriba) * s.valor) / tope,
  });
  const d = series.map((s, i) => `${i ? 'L' : 'M'}${punto(s, i).x} ${punto(s, i).y}`).join(' ');
  return (
    <>
      <path d={`M6 ${abajo} H${w - 6}`} stroke={tinta} strokeWidth={1.5} opacity={0.35} />
      <path d={d} stroke={acento} strokeWidth={3} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {series.map((s, i) => {
        const p = punto(s, i);
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4.5} fill={acento} />
            <text
              x={p.x}
              y={abajo + pt * 1.4}
              fontFamily="Segoe UI, Carlito, sans-serif"
              fontSize={pt}
              fill={tinta}
              opacity={0.85}
              textAnchor="middle"
            >
              {s.nombre}
            </text>
          </g>
        );
      })}
    </>
  );
}

function Pastel({ series, w, h, tinta, acento }: { series: Serie[]; w: number; h: number; tinta: string; acento: string }) {
  const total = series.reduce((s, x) => s + x.valor, 0) || 1;
  const r = Math.min(w * 0.36, h * 0.42);
  const cx = r + 10;
  const cy = h / 2;
  const pt = Math.max(8, Math.min(13, h / 8));
  /*
   * Los ángulos se calculan ANTES de pintar, con una suma acumulada, y no con
   * un contador que se va reasignando dentro del `map`: escribir en una
   * variable mientras se renderiza es exactamente lo que eslint prohíbe y con
   * razón — el mismo `map` corriendo dos veces daría un pastel distinto.
   */
  const cortes = series.reduce<number[]>(
    (acc, s) => [...acc, acc[acc.length - 1] + (s.valor / total) * Math.PI * 2],
    [-Math.PI / 2],
  );
  /*
   * El tono de cada rebanada, repartido por TODO el margen disponible en vez de
   * un escalón fijo por rebanada. Con el escalón fijo (`1 - i * 0.18`) dos
   * rebanadas seguidas se veían casi iguales —medido en la captura: Papel y
   * Plástico indistinguibles— y a partir de la sexta el color se apagaba del
   * todo. Repartido, las dos de los extremos siempre están igual de lejos haya
   * tres rebanadas o diez. La raya fina entre rebanadas termina el trabajo: un
   * borde separa aunque dos tonos vecinos se parezcan.
   */
  const tono = (i: number) => 0.95 - (series.length > 1 ? i / (series.length - 1) : 0) * 0.6;
  return (
    <>
      {series.map((s, i) => {
        const [a0, a1] = [cortes[i], cortes[i + 1]];
        const grande = a1 - a0 > Math.PI ? 1 : 0;
        const d = `M${cx} ${cy} L${cx + Math.cos(a0) * r} ${cy + Math.sin(a0) * r} A${r} ${r} 0 ${grande} 1 ${
          cx + Math.cos(a1) * r
        } ${cy + Math.sin(a1) * r} Z`;
        return (
          <path
            key={i}
            d={d}
            fill={acento}
            opacity={tono(i)}
            stroke={tinta}
            strokeWidth={1.5}
            strokeOpacity={0.3}
          />
        );
      })}
      {series.map((s, i) => (
        <g key={i} transform={`translate(${cx + r + 18}, ${cy - (series.length * pt * 1.7) / 2 + i * pt * 1.7})`}>
          <rect width={pt} height={pt} rx={2} fill={acento} opacity={tono(i)} />
          <text
            x={pt + 6}
            y={pt * 0.86}
            fontFamily="Segoe UI, Carlito, sans-serif"
            fontSize={pt}
            fill={tinta}
            opacity={0.9}
          >
            {s.nombre} · {CIFRA(s.valor)}
          </text>
        </g>
      ))}
    </>
  );
}

/* ── la tabla ─────────────────────────────────────────────────────────────── */

function Tabla({ filas, w, h, tinta, acento }: { filas: string[][]; w: number; h: number; tinta: string; acento: string }) {
  const nf = Math.max(1, filas.length);
  const nc = Math.max(1, filas[0]?.length ?? 1);
  const alto = h / nf;
  const ancho = w / nc;
  const pt = Math.max(8, Math.min(alto * 0.36, ancho * 0.11));
  return (
    <>
      {filas.map((fila, f) =>
        fila.map((celda, c) => (
          <g key={`${f}-${c}`}>
            <rect
              x={c * ancho}
              y={f * alto}
              width={ancho}
              height={alto}
              fill={f === 0 ? acento : 'transparent'}
              opacity={f === 0 ? 0.92 : f % 2 ? 0.06 : 0}
              stroke={tinta}
              strokeWidth={0.8}
              strokeOpacity={0.28}
            />
            <Frase
              texto={celda}
              x={c * ancho + ancho / 2}
              y={f * alto + alto / 2}
              ancho={ancho}
              pt={pt}
              color={f === 0 ? '#fff' : tinta}
              peso={f === 0 ? 700 : 500}
            />
          </g>
        )),
      )}
    </>
  );
}

/* ── la puerta de entrada ─────────────────────────────────────────────────── */

/** ¿Esta caja se pinta con un dibujado? Lo pregunta el lienzo y la lámina. */
export const esDibujado = (l: Libre): boolean =>
  l.clase === 'smartart' || l.clase === 'grafico' || l.clase === 'tabla';

export function Dibujado({ libre, tinta, acento }: PintaProps) {
  const { w, h } = lienzoDe(libre.casilla);
  const dentro =
    libre.clase === 'smartart' ? (
      (() => {
        const pasos = libre.pasos ?? [];
        const v = (libre.variante ?? 'proceso') as SmartArtId;
        if (v === 'jerarquia') return <Jerarquia pasos={pasos} w={w} h={h} tinta={tinta} acento={acento} />;
        if (v === 'ciclo') return <Ciclo pasos={pasos} w={w} h={h} tinta={tinta} acento={acento} />;
        return <Proceso pasos={pasos} w={w} h={h} tinta={tinta} acento={acento} />;
      })()
    ) : libre.clase === 'grafico' ? (
      (() => {
        const series = libre.series ?? [];
        const v = (libre.variante ?? 'barras') as GraficoId;
        if (v === 'lineas') return <Lineas series={series} w={w} h={h} tinta={tinta} acento={acento} />;
        if (v === 'pastel') return <Pastel series={series} w={w} h={h} tinta={tinta} acento={acento} />;
        return <Barras series={series} w={w} h={h} tinta={tinta} acento={acento} />;
      })()
    ) : (
      <Tabla filas={libre.filas ?? [[]]} w={w} h={h} tinta={tinta} acento={acento} />
    );

  return (
    <svg
      className="dpw-dibujado"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      width="100%"
      height="100%"
      role="img"
      aria-label={libre.alt ?? libre.contenido}
    >
      {dentro}
    </svg>
  );
}
