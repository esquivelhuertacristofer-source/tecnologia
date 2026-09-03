'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { ArrowLeft } from 'lucide-react';

import type { BackstageProps } from '../VentanaHojas';
import Grafica from './Grafica';
import {
  ALTO_FILA,
  ANCHO_COL,
  NOMBRE_MARGEN,
  PAPEL,
  configDe,
  cuadriculaDePaginas,
  paginar,
  papelDe,
  type ConfigImpresion,
  type Orientacion,
  type Pagina,
  type Papel,
  type Tamano,
  type TipoMargen,
} from './impresion';
import { esFormula } from './formula/lexico';
import { inspeccionar, type ParteDelLibro } from './consultas';
import { hojaDe, letraDeColumna, type Formato, type Hoja } from './modelo';
import './backstageHojas.css';

/**
 * El **Backstage** de Tecnia Hojas — lo que hay detrás de la pestaña Archivo
 * (bloque 20 del §45.2).
 *
 * ── POR QUÉ ESTA PANTALLA ES MEDIA CLASE ────────────────────────────────────
 *
 * Porque el bloque 20 no es «pulsa aquí»: es **mira lo que sale**. Que una lista
 * de doscientos renglones se convierta en catorce hojas con una columna suelta en
 * la última no se entiende leyéndolo — se entiende viéndolo, y viendo el número
 * caer a cinco al girar la hoja y a una al ajustar. Por eso el previo ocupa la
 * mitad derecha, por eso enseña **las páginas de verdad** —repartidas por
 * `paginar()`, con los valores del motor de la ventana— y por eso la cifra
 * «Página 1 de 14» va grande y arriba: es la que hace clic.
 *
 * Un previo de mentira —una miniatura bonita, o una sola hoja de muestra—
 * convertiría esta clase en un cuestionario. Es la lección de §44.4 heredada:
 * **la hoja que se toca y la hoja que sale son la misma.**
 *
 * ── LOS BOTONES EMITEN GESTOS ───────────────────────────────────────────────
 *
 * Girar la hoja, apretar la escala o quitar el área de impresión **cambian el
 * libro**, así que salen por donde sale todo lo demás: `gesto()`, o sea
 * `ejecutarGestos`, o sea `revisar` + deshacer + grabadora (§45.6). Detrás de
 * Archivo no hay una puerta trasera al libro.
 *
 * ── LO QUE NO ES DEL LIBRO NO SE GUARDA EN EL LIBRO ─────────────────────────
 *
 * Las copias que se piden y lo que ya salió por la impresora **no son parte del
 * documento** —cerrar Excel no desimprime nada—, así que viven en el almacén de
 * módulo de aquí abajo, como el `impresora.ts` que estrenó §44.4. Un `copias: 3`
 * guardado dentro de la hoja sería un dato del archivo que no es del archivo.
 */

/* ── la impresora, que vive fuera del libro ─────────────────────────────────*/

export interface Trabajo {
  hoja: string;
  paginas: number;
  copias: number;
  hora: string;
}

let TRABAJOS: Trabajo[] = [];
const OYENTES = new Set<() => void>();

const avisarATodos = () => {
  for (const f of OYENTES) f();
};

export function suscribirImpresora(f: () => void): () => void {
  OYENTES.add(f);
  return () => {
    OYENTES.delete(f);
  };
}

export const leerImpresora = (): Trabajo[] => TRABAJOS;

/** Sólo se acumula. Como una bandeja de verdad: nada de lo impreso se desimprime. */
export function mandarAImprimir(t: Trabajo): void {
  TRABAJOS = [t, ...TRABAJOS].slice(0, 6);
  avisarATodos();
}

/** Para las pruebas y para volver a empezar una clase. */
export function reiniciarImpresora(): void {
  TRABAJOS = [];
  avisarATodos();
}

/* ── lo que enseña esta pantalla ────────────────────────────────────────────*/

export type SeccionHojas = 'informacion' | 'guardar' | 'imprimir' | 'exportar';

export interface OpcionesBackstageHojas {
  /** Qué secciones enseña esta clase. El orden es el de Excel. */
  secciones: SeccionHojas[];
}

const NOMBRE_SECCION: Record<SeccionHojas, string> = {
  informacion: 'Información',
  guardar: 'Guardar',
  imprimir: 'Imprimir',
  exportar: 'Exportar a PDF',
};

/**
 * Las cuatro entradas del desplegable de ajuste de Excel, **con sus palabras**.
 *
 * Una tabla y no cuatro botones sueltos porque las cuatro son la misma decisión
 * —cuánto se aprieta y por qué eje— y porque así se lee de un vistazo que
 * «ajustar todas las columnas» **no toca las filas**: ése es el ajuste que salva
 * la lista de doscientos renglones sin volverla ilegible, y el que la clase
 * quiere que se elija.
 */
const AJUSTES: { id: string; nombre: string; detalle: string; ancho: number; alto: number }[] = [
  {
    id: 'sin',
    nombre: 'Sin ajuste de escala',
    detalle: 'Las hojas salen a su tamaño real. Lo que no cabe, se va a otra página.',
    ancho: 0,
    alto: 0,
  },
  {
    id: 'hoja',
    nombre: 'Ajustar la hoja en una página',
    detalle: 'Todo en una. Con muchos renglones sale tan chiquito que no se lee.',
    ancho: 1,
    alto: 1,
  },
  {
    id: 'columnas',
    nombre: 'Ajustar todas las columnas en una página',
    detalle: 'Se acabaron las columnas sueltas a la derecha. Las filas siguen igual.',
    ancho: 1,
    alto: 0,
  },
  {
    id: 'filas',
    nombre: 'Ajustar todas las filas en una página',
    detalle: 'Una sola página de alto. Sirve para tablas cortas y anchas.',
    ancho: 0,
    alto: 1,
  },
];

const ajusteDe = (c: ConfigImpresion): string => {
  const ancho = c.ajustarA?.ancho ?? 0;
  const alto = c.ajustarA?.alto ?? 0;
  return AJUSTES.find((a) => a.ancho === ancho && a.alto === alto)?.id ?? 'sin';
};

/** Cuánto pesaría el archivo. Es una cuenta, no un número inventado. */
function comoPeso(kb: number): string {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
}

const dosCifras = (n: number): string => String(n).padStart(2, '0');

const laHora = (): string => {
  const d = new Date();
  return `${dosCifras(d.getHours())}:${dosCifras(d.getMinutes())}`;
};

/** Lo que hay dentro de una hoja, contado. Se LEE del libro, no se inventa. */
function cuentasDe(hoja: Hoja | null): { celdas: number; formulas: number; graficas: number } {
  const celdas = Object.values(hoja?.celdas ?? {});
  return {
    celdas: celdas.filter((c) => c.crudo !== '').length,
    formulas: celdas.filter((c) => esFormula(c.crudo)).length,
    graficas: hoja?.graficas?.length ?? 0,
  };
}

/* ── el previo: una hoja de papel de verdad ─────────────────────────────────*/

/**
 * Lo ancha que se pinta una hoja en el previo, y lo ancha que se pinta su
 * miniatura. De aquí sale la escala con la que se mira el papel.
 *
 * Son dos y no uno porque el previo hace dos trabajos a la vez y con un solo
 * tamaño se pierde uno: **una hoja grande** en la que se lee lo que sale —que es
 * la mitad de la clase, «mira lo que sale»— y **la tira de todas**, en la que se
 * ve de un vistazo que son catorce y que la última lleva una columna suelta. Con
 * todo pequeño no se lee nada; con todo grande hay que hacer scroll para saber
 * cuántas son, que es justo el número que la clase persigue.
 */
const ANCHO_PREVIO = 466;
const ANCHO_MINI = 124;

const A_CSS: Record<string, 'left' | 'center' | 'right'> = {
  izquierda: 'left',
  centro: 'center',
  derecha: 'right',
};

/**
 * DEFECTO FUERA DE MI CLASE, corregido aquí (encontrado al correr eslint sobre
 * este archivo para `n5-mi-primera-grafica`): la celda impresa (`.hjb-celda`,
 * más abajo) es una caja de bloque normal, no una caja flexible —no hay regla
 * `display: flex` para `.hjb-celda` en ningún CSS del proyecto—, así que
 * `text-align` (vía `A_CSS`) ya alinea el texto por sí solo. La constante
 * `JUSTIFICA` que vivía aquí era el `justify-content` de un rediseño a caja
 * flexible que nunca se terminó de instalar: no la usaba nadie, y el
 * comentario que la acompañaba describía un comportamiento (números pegados a
 * la izquierda con formato de moneda) que ya no ocurre con el bloque simple.
 * Se quita la constante muerta y se corrige el comentario en vez de dejar la
 * advertencia de eslint o inventar un rediseño a caja flexible que nadie pidió.
 */

/** El formato de una celda, traducido a lo que entiende el navegador. */
function pinta(f: Formato | undefined, escala: number): React.CSSProperties {
  const s: React.CSSProperties = { fontSize: `${Math.max(5, 12.5 * escala)}px` };
  if (!f) return s;
  if (f.negrita) s.fontWeight = 700;
  if (f.cursiva) s.fontStyle = 'italic';
  if (f.subrayado) s.textDecoration = 'underline';
  if (f.colorLetra) s.color = f.colorLetra;
  if (f.colorRelleno) s.background = f.colorRelleno;
  if (f.ajustarTexto) s.whiteSpace = 'normal';
  const linea = `1px solid #333`;
  if (f.bordes?.arriba) s.borderTop = linea;
  if (f.bordes?.abajo) s.borderBottom = linea;
  if (f.bordes?.izquierda) s.borderLeft = linea;
  if (f.bordes?.derecha) s.borderRight = linea;
  return s;
}

interface HojaDePapelProps {
  pagina: Pagina;
  total: number;
  papel: Papel;
  config: ConfigImpresion;
  motor: BackstageProps['motor'];
  hojaId: string;
  /** Con cuántos píxeles de ancho se mira. Lo demás sale de la proporción. */
  ancho: number;
  /** Una de la tira de abajo. Cambia el domicilio, no lo que se dibuja. */
  mini?: boolean;
}

/**
 * **Una hoja de papel**, dibujada a tamaño real y encogida por CSS.
 *
 * El truco importa: dentro se dibuja con las medidas de verdad —816 × 1056
 * píxeles una Carta— y lo único que hace el previo es mirarla de lejos con un
 * `transform: scale`. Así el reparto que se ve es exactamente el que calculó
 * `paginar()`, sin una sola medida a mano y sin dos aritméticas que puedan
 * discrepar. Es «cuadricular, no medir» (§39) aplicado al papel.
 */
function HojaDePapel({ pagina, total, papel, config, motor, hojaId, ancho, mini }: HojaDePapelProps) {
  const z = ancho / papel.ancho;
  const escala = pagina.escala;
  const primera = pagina.filas[0] ?? pagina.filasTitulo[0] ?? 0;
  const altoTitulos = pagina.filasTitulo.length * ALTO_FILA * escala;
  const xDe = (col: number) => (col - (pagina.cols[0] ?? 0)) * ANCHO_COL * escala;
  const yDe = (fila: number, titulo: boolean) =>
    titulo
      ? pagina.filasTitulo.indexOf(fila) * ALTO_FILA * escala
      : altoTitulos + (fila - primera) * ALTO_FILA * escala;

  return (
    <div className="hjb-papel" style={{ width: papel.ancho * z, height: papel.alto * z }}>
      <div
        className="hjb-papel-real"
        style={{ width: papel.ancho, height: papel.alto, transform: `scale(${z})` }}
        data-hjb-pagina={mini ? undefined : pagina.numero}
        data-hjb-mini={mini ? pagina.numero : undefined}
      >
        {config.encabezado ? <div className="hjb-encabezado">{config.encabezado}</div> : null}

        {/*
          Las letras de columna y los números de fila, cuando se piden.

          **Reserva escrita a propósito:** en Excel esos encabezados se comen una
          fila y una columna del área útil, o sea que ponerlos puede cambiar el
          reparto. Aquí se pintan en el margen y el reparto no se entera. La
          diferencia es de una fila y una columna, no cambia ninguna de las cifras
          que la clase enseña, y meterlos en `paginar()` obligaría a que el
          reparto dependiera de un adorno. El día que una clase cuente páginas con
          los encabezados puestos, se mete allí y en ningún otro sitio.
        */}
        {config.verEncabezados && (
          <>
            <div className="hjb-cabeceras-cols" style={{ left: papel.util.izquierda, top: papel.util.arriba - 13 }}>
              {pagina.cols.map((c) => (
                <span key={c} style={{ left: xDe(c), width: ANCHO_COL * escala }}>
                  {letraDeColumna(c)}
                </span>
              ))}
            </div>
            <div className="hjb-cabeceras-filas" style={{ left: papel.util.izquierda - 22, top: papel.util.arriba }}>
              {[...pagina.filasTitulo, ...pagina.filas].map((f, i) => (
                <span key={f} style={{ top: i * ALTO_FILA * escala, height: ALTO_FILA * escala }}>
                  {f + 1}
                </span>
              ))}
            </div>
          </>
        )}

        <div
          className={`hjb-util${config.verCuadricula ? ' es-con-cuadricula' : ''}`}
          style={{
            left: papel.util.izquierda,
            top: papel.util.arriba,
            width: papel.util.ancho,
            height: papel.util.alto,
            backgroundSize: `${ANCHO_COL * escala}px ${ALTO_FILA * escala}px`,
          }}
        >
          {/* La franja de los títulos repetidos, para que se vea que se repiten. */}
          {pagina.filasTitulo.length > 0 && (
            <div className="hjb-franja-titulo" style={{ height: altoTitulos }} aria-hidden="true" />
          )}

          {pagina.celdas.map((c) => (
            <div
              key={`${c.col}-${c.fila}`}
              className="hjb-celda"
              style={{
                left: xDe(c.col),
                top: yDe(c.fila, c.titulo === true),
                width: ANCHO_COL * escala,
                height: ALTO_FILA * escala,
                textAlign: A_CSS[c.alineacion] ?? 'left',
                ...pinta(c.formato, escala),
              }}
            >
              {c.texto}
            </div>
          ))}

          {/*
            Las gráficas salen por la impresora como todo lo demás, y si una cae a
            caballo entre dos páginas **sale partida** — que es lo que hace Excel y
            es medio encargo: se ve, se entiende y se arregla marcando el área.
          */}
          {pagina.graficas.map((g) => (
            <div
              key={g.id}
              className="hjb-grafica"
              style={{
                left: xDe(g.ancla.col),
                top: yDe(g.ancla.fila, false),
                width: g.ancla.cols * ANCHO_COL * escala,
                height: g.ancla.filas * ALTO_FILA * escala,
              }}
            >
              <div
                style={{
                  width: g.ancla.cols * ANCHO_COL,
                  height: g.ancla.filas * ALTO_FILA,
                  transform: `scale(${escala})`,
                  transformOrigin: 'top left',
                }}
              >
                <Grafica grafica={g} motor={motor} hoja={hojaId} />
              </div>
            </div>
          ))}
        </div>

        <div className="hjb-pie">
          <span>{config.pie ?? ''}</span>
          {/*
            El número va SIEMPRE y a la derecha, con su total al lado. Es el
            defecto C del §44.4 arreglado antes de que aparezca: sin pie escrito,
            un número que comparte renglón se pega al margen izquierdo, y en una
            hoja el número de página va a la derecha. Y lleva el total pegado
            porque «3» no dice nada y «3 de 14» lo dice todo.
          */}
          <span className="hjb-numero">
            Página {pagina.numero} de {total}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── el Backstage ───────────────────────────────────────────────────────────*/

export function crearBackstageHojas(op: OpcionesBackstageHojas) {
  function BackstageHojas({ libro, motor, archivo, cerrar, avisar, gesto }: BackstageProps) {
    const [seccion, setSeccion] = useState<SeccionHojas>(op.secciones[0]);
    const [copias, setCopias] = useState(1);
    const [pedida, setCual] = useState(0);
    const [guardado, setGuardado] = useState<string | null>(null);
    const [pdf, setPdf] = useState<{ kb: number; paginas: number } | null>(null);
    const [saliendo, setSaliendo] = useState(false);
    /**
     * El parte de «Inspeccionar libro» (bloque 42), con la hoja para la que
     * se pidió: `null` hasta el primer clic, como `guardado` y `pdf` aquí
     * arriba — un parte que se ve sin haberlo pedido sería un instrumento
     * que miente sobre cuándo se usó.
     */
    const [parte, setParte] = useState<{ hoja: string; datos: ParteDelLibro } | null>(null);
    const trabajos = useSyncExternalStore(suscribirImpresora, leerImpresora, leerImpresora);

    const hojaId = libro.activa;
    const hoja = hojaDe(libro, hojaId);
    /*
     * DEFECTO FUERA DE MI CLASE, corregido aquí (lo encendió eslint al añadir
     * el campo «Área de impresión» para `n5-mi-primera-grafica`): `configDe`
     * fabrica un objeto nuevo en cada render, así que usarlo tal cual como
     * dependencia del `useMemo` de abajo nunca memoiza nada de verdad —cambia
     * de referencia siempre, aunque la hoja sea la misma— y el compilador de
     * React lo señala como memoización que no puede preservar. Se memoiza
     * `config` sobre `hoja` (que sí es la misma referencia mientras el libro no
     * cambie: viene de un modelo inmutable) en vez de dejar la advertencia.
     */
    const config = useMemo(() => configDe(hoja), [hoja]);
    const papel = papelDe(config);

    /*
     * El reparto se rehace cuando cambia el libro o la configuración, y sólo
     * entonces. Es puro y barato —no toca el DOM— pero recorre todas las celdas
     * del área, y el previo se pinta en cada tecla que se escribe en el cuadro
     * del encabezado.
     */
    const paginas = useMemo(() => paginar(libro, motor, hojaId, config), [libro, motor, hojaId, config]);
    const rejilla = cuadriculaDePaginas(paginas);
    const cuentas = cuentasDe(hoja);

    /*
     * Cuál se mira grande. Se recorta **al pintar** y no en un efecto que
     * corrija el estado: ajustar a una página pasa de catorce páginas a una, y
     * con el índice guardado en la doce el previo se quedaría enseñando nada —
     * exactamente en el clic donde la clase quiere que se vea el cambio.
     */
    const cual = Math.min(pedida, Math.max(0, paginas.length - 1));
    const activa = paginas[cual];

    // Escape cierra, como en el programa. Sin esto, quien entra a Archivo por
    // curiosidad se queda dentro sin una flecha que reconozca.
    useEffect(() => {
      const t = (e: KeyboardEvent) => {
        if (e.key === 'Escape') cerrar();
      };
      window.addEventListener('keydown', t);
      return () => window.removeEventListener('keydown', t);
    }, [cerrar]);

    /*
     * El parte es de UNA hoja («Lo de la derecha es de X», la nota que ya
     * vive más abajo), así que si cambió de hoja desde el último clic se
     * deja de enseñar **al pintar** — el mismo truco que ya usa `cual` aquí
     * arriba, y no un efecto que corrija el estado: seguir enseñando el
     * parte de la hoja de antes sería el mismo defecto que enseñar el
     * previo de otra hoja.
     */
    const parteVisible = parte && parte.hoja === hojaId ? parte.datos : null;

    const inspeccionarLibro = () => {
      setParte({ hoja: hojaId, datos: inspeccionar(motor, hojaId) });
      avisar('inspeccionar');
    };

    const configurar = (campo: string, valor: string | number) =>
      gesto([{ comando: 'configurarPagina', args: { hoja: hojaId, campo, valor } }], 'configurar-pagina');

    const elegirAjuste = (id: string) => {
      const a = AJUSTES.find((x) => x.id === id);
      if (!a) return;
      gesto(
        [
          { comando: 'configurarPagina', args: { hoja: hojaId, campo: 'ajustarAncho', valor: a.ancho } },
          { comando: 'configurarPagina', args: { hoja: hojaId, campo: 'ajustarAlto', valor: a.alto } },
        ],
        'ajustar-a-una-pagina',
      );
    };

    const imprimir = () => {
      if (!paginas.length) return;
      mandarAImprimir({ hoja: hoja?.nombre ?? hojaId, paginas: paginas.length, copias, hora: laHora() });
      avisar('imprimir');
    };

    /*
     * Exportar TARDA, y a propósito: un archivo que aparece en el mismo instante
     * en que se pulsa enseña que exportar es gratis. Segundo y medio con barra.
     */
    const aPdf = () => {
      if (saliendo || !paginas.length) return;
      setSaliendo(true);
      window.setTimeout(() => {
        // El peso es una cuenta sobre lo que hay: páginas y celdas escritas. No
        // es exacto —ningún simulador lo sería— pero **se mueve con el archivo**,
        // que es lo que hace que el número signifique algo.
        setPdf({ kb: Math.round(24 + paginas.length * 11 + cuentas.celdas * 0.09), paginas: paginas.length });
        setSaliendo(false);
        avisar('exportar-pdf');
      }, 1500);
    };

    return (
      <div className="hjb" role="dialog" aria-modal="true" aria-label="Archivo">
        <div className="hjb-lado">
          <button type="button" className="hjb-volver" data-hjb="volver" onClick={cerrar}>
            <ArrowLeft size={17} strokeWidth={2.6} />
            <span>Volver</span>
          </button>
          {op.secciones.map((s) => (
            <button
              key={s}
              type="button"
              className={`hjb-seccion${s === seccion ? ' es-aqui' : ''}`}
              data-hjb-seccion={s}
              onClick={() => setSeccion(s)}
            >
              {NOMBRE_SECCION[s]}
            </button>
          ))}
        </div>

        <div className="hjb-cuerpo">
          {seccion === 'informacion' && (
            <>
              <h2 className="hjb-titulo">Información</h2>
              <p className="hjb-sub">
                <b>{archivo}</b> · {libro.hojas.length} hoja{libro.hojas.length === 1 ? '' : 's'}
              </p>
              <div className="hjb-fichas">
                <div className="hjb-ficha">
                  <b>{cuentas.celdas}</b>
                  <span>celdas escritas</span>
                </div>
                <div className="hjb-ficha">
                  <b>{cuentas.formulas}</b>
                  <span>fórmulas</span>
                </div>
                <div className="hjb-ficha">
                  <b>{cuentas.graficas}</b>
                  <span>gráficas</span>
                </div>
                <div className="hjb-ficha es-papel">
                  <b>{paginas.length}</b>
                  <span>páginas en papel</span>
                </div>
              </div>
              <p className="hjb-nota">
                Lo de la derecha es de <b>{hoja?.nombre ?? hojaId}</b>, la hoja en la que estás. Cada hoja del libro
                se configura y se imprime por su cuenta: una puede ir apaisada y la de al lado vertical.
              </p>

              {/*
                «Inspeccionar libro» (bloque 42): entender una hoja que hizo
                otra persona empieza por preguntas que a ojo no se ven —
                cuántas fórmulas, cuántos errores, cuántas hojas escondidas—.
                Es sólo lectura (`inspeccionar()`, en `consultas.ts`, no toca
                el libro), así que vive aquí y no en un gesto: el mismo lugar
                de Excel de verdad para «Comprobar si hay problemas».
              */}
              <div className="hjb-inspeccionar">
                <button
                  type="button"
                  className="hjb-boton es-secundario"
                  data-hjb-inspeccionar
                  onClick={inspeccionarLibro}
                >
                  Inspeccionar libro
                </button>
                {parteVisible && (
                  <ul className="hjb-lista" data-hjb-parte>
                    <li>
                      <b>{parteVisible.formulas}</b> fórmula{parteVisible.formulas === 1 ? '' : 's'} en{' '}
                      {hoja?.nombre ?? hojaId}.
                    </li>
                    <li>
                      <b>{parteVisible.errores}</b> error{parteVisible.errores === 1 ? '' : 'es'} en todo el libro,
                      contando las {libro.hojas.length} hojas.
                    </li>
                    <li>
                      <b>{parteVisible.hojasEscondidas}</b> hoja{parteVisible.hojasEscondidas === 1 ? '' : 's'}{' '}
                      escondida{parteVisible.hojasEscondidas === 1 ? '' : 's'}.
                    </li>
                  </ul>
                )}
              </div>
            </>
          )}

          {seccion === 'guardar' && (
            <>
              <h2 className="hjb-titulo">Guardar</h2>
              <p className="hjb-sub">
                <b>{archivo}</b>
              </p>
              <div className="hjb-guardar">
                <button type="button" className="hjb-boton es-grande" data-hjb-guardar onClick={() => { setGuardado(laHora()); avisar('guardar'); }}>
                  Guardar
                </button>
                {guardado && (
                  <p className="hjb-listo" data-hjb-guardado>
                    ✓ Guardado a las {guardado}
                  </p>
                )}
              </div>
              <ul className="hjb-lista">
                <li>
                  <b>Guardar</b> deja el archivo como está ahora. Se guarda <b>todo</b>: los datos, las fórmulas —la
                  regla, no el resultado—, los formatos y las gráficas.
                </li>
                <li>
                  <b>Guardar no es exportar.</b> Un `.xlsx` se sigue editando; un PDF, no. Por eso están en dos sitios
                  distintos de esta misma pantalla.
                </li>
                <li>
                  Guardar <b>no imprime</b>, e imprimir <b>no guarda</b>. Son dos cosas y se hacen las dos.
                </li>
              </ul>
              <p className="hjb-simulador">
                Esto es un simulador: <b>no se escribe ningún archivo</b> en tu computadora. Lo que sí es de verdad es
                tu libro, que se queda como lo dejes.
              </p>
            </>
          )}

          {seccion === 'imprimir' && (
            <>
              <h2 className="hjb-titulo">Imprimir</h2>
              <div className="hjb-imprimir">
                <div className="hjb-opciones">
                  <label className="hjb-campo">
                    <span>Copias</span>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      data-hjb-copias
                      value={copias}
                      onChange={(e) => setCopias(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                    />
                  </label>

                  <button
                    type="button"
                    className="hjb-boton es-imprimir"
                    data-hjb-imprimir
                    disabled={!paginas.length}
                    onClick={imprimir}
                  >
                    Imprimir
                  </button>

                  <div className="hjb-grupo">
                    <h3>Qué se imprime</h3>
                    <label className="hjb-campo">
                      <span>Área de impresión</span>
                      <input
                        type="text"
                        placeholder="Toda la hoja  ·  A1:D20"
                        data-hjb-area-campo
                        key={config.areaImpresion ?? ''}
                        defaultValue={config.areaImpresion ?? ''}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v === (config.areaImpresion ?? '')) return;
                          if (!v) {
                            if (config.areaImpresion) {
                              gesto([{ comando: 'quitarAreaDeImpresion', args: { hoja: hojaId } }], 'quitar-area');
                            }
                            return;
                          }
                          gesto([{ comando: 'areaDeImpresion', args: { hoja: hojaId, rango: v } }], 'area-impresion');
                        }}
                      />
                    </label>
                    <p className="hjb-pista">
                      Se escribe «de aquí hasta allá»: <b>A1:D20</b>. Lo de fuera del área <b>no se imprime</b>, aunque
                      haya media hoja llena al lado — es la diferencia entre entregar sólo lo que importa y entregar
                      catorce hojas con las columnas partidas.
                    </p>
                    <p className="hjb-area" data-hjb-area={config.areaImpresion ?? ''}>
                      {config.areaImpresion ? (
                        <>
                          Sólo <b>{config.areaImpresion}</b> de la hoja {hoja?.nombre ?? hojaId}.
                        </>
                      ) : (
                        <>
                          Todo lo que hay escrito en <b>{hoja?.nombre ?? hojaId}</b>.
                        </>
                      )}
                    </p>
                    {config.areaImpresion && (
                      <button
                        type="button"
                        className="hjb-boton es-secundario"
                        data-hjb-quitar-area
                        onClick={() =>
                          gesto([{ comando: 'quitarAreaDeImpresion', args: { hoja: hojaId } }], 'quitar-area')
                        }
                      >
                        Omitir el área de impresión
                      </button>
                    )}
                  </div>

                  <fieldset className="hjb-grupo">
                    <legend>Orientación</legend>
                    {(
                      [
                        ['vertical', 'Vertical', 'Caben más filas. Para listas largas.'],
                        ['horizontal', 'Horizontal', 'Caben más columnas. Para tablas anchas.'],
                      ] as [Orientacion, string, string][]
                    ).map(([id, nombre, detalle]) => (
                      <label key={id} className={`hjb-opcion${config.orientacion === id ? ' es-puesta' : ''}`}>
                        <input
                          type="radio"
                          name="orientacion"
                          data-hjb-orientacion={id}
                          checked={config.orientacion === id}
                          onChange={() => configurar('orientacion', id)}
                        />
                        <span>
                          <b>{nombre}</b>
                          <small>{detalle}</small>
                        </span>
                      </label>
                    ))}
                  </fieldset>

                  <label className="hjb-campo">
                    <span>Tamaño de papel</span>
                    <select
                      data-hjb-tamano
                      value={config.tamano}
                      onChange={(e) => configurar('tamano', e.target.value)}
                    >
                      {(Object.keys(PAPEL) as Tamano[]).map((t) => (
                        <option key={t} value={t}>
                          {PAPEL[t].nombre} · {PAPEL[t].ancho} × {PAPEL[t].alto} pulgadas
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="hjb-campo">
                    <span>Márgenes</span>
                    <select
                      data-hjb-margenes
                      value={config.margenes}
                      onChange={(e) => configurar('margenes', e.target.value)}
                    >
                      {(Object.keys(NOMBRE_MARGEN) as TipoMargen[]).map((m) => (
                        <option key={m} value={m}>
                          {NOMBRE_MARGEN[m]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <fieldset className="hjb-grupo">
                    <legend>Ajuste</legend>
                    {AJUSTES.map((a) => (
                      <label key={a.id} className={`hjb-opcion${ajusteDe(config) === a.id ? ' es-puesta' : ''}`}>
                        <input
                          type="radio"
                          name="ajuste"
                          data-hjb-ajuste={a.id}
                          checked={ajusteDe(config) === a.id}
                          onChange={() => elegirAjuste(a.id)}
                        />
                        <span>
                          <b>{a.nombre}</b>
                          <small>{a.detalle}</small>
                        </span>
                      </label>
                    ))}
                  </fieldset>

                  <div className="hjb-grupo">
                    <h3>Configurar página</h3>
                    <label className="hjb-campo">
                      <span>Filas que se repiten arriba</span>
                      <input
                        type="text"
                        placeholder="1  ·  1:2"
                        data-hjb-titulos
                        key={config.titulosArriba ?? ''}
                        defaultValue={config.titulosArriba ?? ''}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v !== (config.titulosArriba ?? '')) configurar('titulosArriba', v);
                        }}
                      />
                    </label>
                    <p className="hjb-pista">
                      Escribe <b>1</b> y la fila de encabezados saldrá arriba de <b>todas</b> las páginas. Sin eso, de
                      la página 2 en adelante nadie sabe qué columna es cuál.
                    </p>
                    <label className="hjb-casilla">
                      <input
                        type="checkbox"
                        data-hjb-cuadricula
                        checked={config.verCuadricula === true}
                        onChange={(e) => configurar('verCuadricula', e.target.checked ? 1 : 0)}
                      />
                      <span>
                        <b>Imprimir la cuadrícula</b>
                        <small>La que ves en la pantalla NO sale en el papel si no la enciendes aquí.</small>
                      </span>
                    </label>
                    <label className="hjb-casilla">
                      <input
                        type="checkbox"
                        data-hjb-encabezados
                        checked={config.verEncabezados === true}
                        onChange={(e) => configurar('verEncabezados', e.target.checked ? 1 : 0)}
                      />
                      <span>
                        <b>Imprimir las letras y los números</b>
                        <small>La A, la B, el 1, el 2. Sirve para revisar fórmulas en papel.</small>
                      </span>
                    </label>
                    <label className="hjb-campo">
                      <span>Encabezado</span>
                      <input
                        type="text"
                        data-hjb-encabezado
                        key={`enc-${config.encabezado ?? ''}`}
                        defaultValue={config.encabezado ?? ''}
                        onBlur={(e) => {
                          if (e.target.value !== (config.encabezado ?? '')) configurar('encabezado', e.target.value);
                        }}
                      />
                    </label>
                    <label className="hjb-campo">
                      <span>Pie de página</span>
                      <input
                        type="text"
                        data-hjb-pie
                        key={`pie-${config.pie ?? ''}`}
                        defaultValue={config.pie ?? ''}
                        onBlur={(e) => {
                          if (e.target.value !== (config.pie ?? '')) configurar('pie', e.target.value);
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="hjb-previo">
                  {paginas.length === 0 ? (
                    <p className="hjb-vacio" data-hjb-vacio>
                      Esta hoja está vacía: no hay nada que imprimir. Escribe algo y vuelve.
                    </p>
                  ) : (
                    <>
                      <p className="hjb-cuenta" data-hjb-cuenta>
                        <b>
                          {paginas.length} página{paginas.length === 1 ? '' : 's'}
                        </b>
                        {copias > 1 ? ` × ${copias} copias = ${paginas.length * copias} hojas` : ''}
                        <em>
                          {' '}
                          · {rejilla.ancho} de ancho × {rejilla.alto} de alto
                        </em>
                        {/*
                          El aviso que da sentido a todo el bloque, y sale solo:
                          una columna suelta a la derecha es lo que le pasa a
                          cualquiera la primera vez, y es lo que arregla el ajuste
                          de un clic que tiene justo al lado.
                        */}
                        {rejilla.ancho > 1 && (
                          <b className="hjb-alerta" data-hjb-alerta>
                            Tus columnas no caben de ancho: se van a {rejilla.ancho} páginas.
                          </b>
                        )}
                      </p>
                      <div className="hjb-hojas">
                        <HojaDePapel
                          pagina={activa}
                          total={paginas.length}
                          papel={papel}
                          config={config}
                          motor={motor}
                          hojaId={hojaId}
                          ancho={ANCHO_PREVIO}
                        />
                      </div>
                      {/*
                        La tira de todas, que es la otra mitad del previo: aquí se
                        ve de un vistazo que son catorce y que la última lleva una
                        columna suelta. Se puede pulsar para mirarla grande, como
                        en Excel.
                      */}
                      {paginas.length > 1 && (
                        <div className="hjb-tira">
                          {paginas.map((p, i) => (
                            <button
                              key={p.numero}
                              type="button"
                              className={`hjb-mini${i === cual ? ' es-aqui' : ''}`}
                              data-hjb-ir={p.numero}
                              aria-label={`Página ${p.numero} de ${paginas.length}`}
                              onClick={() => setCual(i)}
                            >
                              <HojaDePapel
                                pagina={p}
                                total={paginas.length}
                                papel={papel}
                                config={config}
                                motor={motor}
                                hojaId={hojaId}
                                ancho={ANCHO_MINI}
                                mini
                              />
                              <span>{p.numero}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {trabajos.length > 0 && (
                <div className="hjb-bandeja">
                  <h3>Lo que ya salió por la impresora</h3>
                  <ul>
                    {trabajos.map((t, k) => (
                      <li key={k} data-hjb-trabajo={t.hoja}>
                        <b>{t.hoja}</b>
                        <span>
                          {t.paginas} página{t.paginas === 1 ? '' : 's'}
                          {t.copias > 1 ? ` × ${t.copias} copias` : ''}
                        </span>
                        <span>{t.hora}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="hjb-simulador">
                    Esto es un simulador: <b>no sale ninguna hoja de verdad</b>. Las cuentas sí son las de tu libro.
                  </p>
                </div>
              )}
            </>
          )}

          {seccion === 'exportar' && (
            <>
              <h2 className="hjb-titulo">Exportar a PDF</h2>
              <p className="hjb-sub">
                Una copia de <b>{archivo}</b> que se ve igual en cualquier aparato. El original se queda como está.
              </p>
              <ul className="hjb-lista">
                <li>
                  Un PDF es <b>papel que no se imprime</b>: sale con las mismas páginas que el previo de Imprimir, y
                  con el mismo reparto. Si ahí salen {paginas.length}, aquí salen {paginas.length}.
                </li>
                <li>
                  <b>Ya no se edita</b>, y las fórmulas dejan de ser fórmulas: llega el resultado, no la regla. Para
                  quien vaya a seguir trabajando, se manda el `.xlsx`.
                </li>
              </ul>
              <div className="hjb-guardar">
                <button
                  type="button"
                  className="hjb-boton es-grande"
                  data-hjb-pdf
                  disabled={saliendo || !paginas.length}
                  onClick={aPdf}
                >
                  {saliendo ? 'Creando…' : 'Crear PDF'}
                </button>
                {saliendo && <div className="hjb-barra" aria-hidden="true" />}
                {pdf && !saliendo && (
                  <p className="hjb-listo" data-hjb-listo>
                    ✓ {archivo.replace(/\.[^.]+$/, '')}.pdf · {comoPeso(pdf.kb)} · {pdf.paginas} página
                    {pdf.paginas === 1 ? '' : 's'}
                  </p>
                )}
              </div>
              <p className="hjb-simulador">
                Esto es un simulador: <b>no se descarga ningún archivo</b>. Las páginas y el peso sí salen de tu libro.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }
  return BackstageHojas;
}

/** El Backstage completo, que es el que pide el bloque 20. */
export const BackstageHojas = crearBackstageHojas({
  secciones: ['informacion', 'guardar', 'imprimir', 'exportar'],
});

export default BackstageHojas;
