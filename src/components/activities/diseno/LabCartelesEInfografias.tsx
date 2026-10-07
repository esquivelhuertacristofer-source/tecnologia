'use client';

import { useCallback, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../n1/mision/audio';
import { ArcadeSala, useBit } from '../n1/arcade/ArcadeSala';
import { formatTiempo, useLabActividad } from '../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import {
  accion,
  capaDe,
  cuantosColores,
  estaCentradaH,
  hayJerarquia,
  LIENZOS,
  paginaDe,
  PALETA_BASE,
  ptAbajo,
  ptArriba,
  paresQueSeTapan,
  textosDe,
  useDiseno,
  VentanaDiseno,
  visibles,
  type CapaForma,
  type CapaTexto,
  type Documento,
} from '@/components/simuladores/diseno';
import { PortadaDiseno, type DatosPortadaDiseno } from './PortadaDiseno';
import { TarjetaPaso, useGuionDiseno, type PasoGuionDiseno } from './useGuionDiseno';
import './diseno-sala.css';

/**
 * N6·U «Diseño y multimedia», parada 1 · «Carteles e infografías»
 * (documento §54.1). **N6 = 6.º de Primaria = 11–12 años**, verificado en
 * `curriculo.ts`.
 *
 * Primera clase construida sobre `simuladores/diseno` (armazón cerrado,
 * 4 de 8 actividades servidas de verdad). Enseña los cuatro principios de un
 * cartel legible: un título que se lee primero, jerarquía entre título e
 * información, centrado exacto (cuadriculado, sin épsilon) y una paleta con
 * tope de colores. Nada de imágenes ni licencias todavía — eso es
 * `n8-imagen-con-capas`, la segunda parada de esta serie.
 *
 * §69.14: y la mitad que faltaba, la INFOGRAFÍA. El cartel contesta la
 * encuesta del salón con cuatro barras cuya altura es proporcional a su
 * número, sobre la misma base, con su etiqueta, la respuesta destacada y la
 * fuente. Todo se juzga leyendo el documento: casillas enteras, sin épsilon.
 */

export const PAGINA = 'cartel';

export const DOC_INICIAL: Documento = {
  lienzo: LIENZOS.cartel,
  paleta: PALETA_BASE,
  banco: {},
  paginas: [{ id: PAGINA, nombre: 'Cartel', fondo: null, capas: [] }],
};

/* ── la encuesta (§69.14) ────────────────────────────────────────────────── */

/** «¿Cómo llegas a la escuela?», 6.º B, 30 alumnos. De mayor a menor. */
export const ENCUESTA = [
  { que: 'Caminando', n: 12, nombre: /camin|a pie/ },
  { que: 'Autobús', n: 8, nombre: /autob|camion/ },
  { que: 'Coche', n: 6, nombre: /coche|carro|auto(?!b)/ },
  { que: 'Bici', n: 4, nombre: /bici/ },
] as const;

const sinAcentos = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Las barras: los rectángulos del cartel, de izquierda a derecha. */
export function barrasDe(doc: Documento): CapaForma[] {
  return visibles(doc, PAGINA)
    .filter((c): c is CapaForma => c.tipo === 'forma' && (c.figura === 'rect' || c.figura === 'redondeado'))
    .sort((a, b) => a.caja.col - b.caja.col);
}

const base = (c: { caja: { fila: number; filas: number } }) => c.caja.fila + c.caja.filas;

/**
 * Cuatro barras cuya altura es proporcional a la encuesta, con cualquier
 * escala: ordenadas de mayor a menor, `alto × 12 = mayor × n` en las cuatro.
 */
export function sonProporcionales(doc: Documento): boolean {
  const altos = barrasDe(doc).map((b) => b.caja.filas).sort((a, b) => b - a);
  if (altos.length !== ENCUESTA.length) return false;
  return altos.every((h, i) => h * ENCUESTA[0].n === altos[0] * ENCUESTA[i].n);
}

/** El número que representa una barra, según su altura y la de la más alta. */
function datoDe(barra: CapaForma, barras: CapaForma[]): number {
  const mayor = Math.max(...barras.map((b) => b.caja.filas));
  return (barra.caja.filas * ENCUESTA[0].n) / mayor;
}

export function mismaBaseYAncho(doc: Documento): boolean {
  const barras = barrasDe(doc);
  if (barras.length !== ENCUESTA.length || !sonProporcionales(doc)) return false;
  const juntas = barras.every((b, i) => i === 0 || barras[i - 1].caja.col + barras[i - 1].caja.cols <= b.caja.col);
  return juntas && barras.every((b) => base(b) === base(barras[0]) && b.caja.cols === barras[0].caja.cols);
}

/** La etiqueta de una barra: un texto justo debajo, en sus columnas, con su número y su nombre. */
function etiquetaDe(doc: Documento, barra: CapaForma, barras: CapaForma[]): CapaTexto | null {
  const n = datoDe(barra, barras);
  const dato = ENCUESTA.find((e) => e.n === n);
  if (!dato) return null;
  return (
    textosDe(doc, PAGINA).find((t) => {
      const debajo = t.caja.fila >= base(barra) && t.caja.fila <= base(barra) + 2;
      const enSusColumnas = t.caja.col < barra.caja.col + barra.caja.cols && barra.caja.col < t.caja.col + t.caja.cols;
      const texto = sinAcentos(t.texto);
      return debajo && enSusColumnas && new RegExp(`(^|\\D)${n}(\\D|$)`).test(texto) && dato.nombre.test(texto);
    }) ?? null
  );
}

export function cadaBarraConSuEtiqueta(doc: Documento): boolean {
  const barras = barrasDe(doc);
  return mismaBaseYAncho(doc) && barras.every((b) => etiquetaDe(doc, b, barras) !== null);
}

export function destacaLaRespuesta(doc: Documento): boolean {
  const barras = [...barrasDe(doc)].sort((a, b) => b.caja.filas - a.caja.filas);
  if (barras.length !== ENCUESTA.length) return false;
  const [mayor, ...resto] = barras;
  return (
    resto.every((b) => b.relleno !== null && b.relleno === resto[0].relleno) &&
    mayor.relleno !== null &&
    mayor.relleno !== resto[0].relleno
  );
}

/** La fuente: el texto de más abajo, más chico que todos los demás, y que diga de dónde salen los datos. */
export function diceLaFuente(doc: Documento): boolean {
  const textos = textosDe(doc, PAGINA);
  if (textos.length < 2) return false;
  const abajo = [...textos].sort((a, b) => b.caja.fila - a.caja.fila)[0];
  const masAbajoQueTodo = visibles(doc, PAGINA).every((c) => c.id === abajo.id || base(c) <= abajo.caja.fila);
  return (
    masAbajoQueTodo &&
    textos.every((t) => t.id === abajo.id || t.pt > abajo.pt) &&
    /encuesta|fuente|datos/.test(sinAcentos(abajo.texto))
  );
}

export const GUION: PasoGuionDiseno[] = [
  {
    id: 'titulo',
    titulo: 'La pregunta, de título',
    instruccion:
      'El 6.º B hizo una encuesta y tu cartel va al periódico mural: tiene que contestar «¿Cómo llegamos a la escuela?». Escribe esa pregunta de título (o una tuya que diga lo mismo). El texto se pone con la herramienta Texto.',
    pista: 'Elige la herramienta Texto, pon un cuadro en el lienzo y cambia lo que dice en el campo de texto de arriba.',
    comprueba: (d) => textosDe(d.documento, PAGINA).some((t) => t.texto.trim().length >= 3),
    aprendido: 'Una infografía contesta una pregunta. Si el título es la pregunta, quien mira sabe qué buscar.',
  },
  {
    id: 'grande-centrado',
    titulo: 'Lo primero que se ve',
    instruccion:
      'Haz que el título sea lo primero que ve el ojo: grande —de 44 pt o más— y centrado de verdad. «A+» agranda la letra y «Alinear» centra.',
    pista: 'El centro se cuenta en casillas exactas: o está centrado, o no lo está — nada de «casi».',
    comprueba: (d) =>
      textosDe(d.documento, PAGINA).some((t) => t.pt >= 44 && estaCentradaH(d.documento, PAGINA, t.id)),
    aprendido: 'Un título grande y centrado es lo primero que ve el ojo. Por eso va arriba.',
  },
  {
    id: 'barras',
    titulo: 'Un número, una barra',
    instruccion:
      'Los datos: caminando 12, autobús 8, coche 6, bici 4. Dibuja una barra por cada uno con la herramienta Formas (un rectángulo), con la altura PROPORCIONAL a su número: si 12 alumnos son 6 casillas de alto, ¿cuántas son 8, 6 y 4? Con la barra seleccionada, el panel dice cuánto mide.',
    pista: '12 alumnos en 6 casillas son dos alumnos por casilla. ¿Cuántas casillas hacen falta para 8 alumnos?',
    comprueba: (d) => sonProporcionales(d.documento),
    aprendido: 'En una gráfica de barras, la altura ES el número. Si 8 es dos tercios de 12, su barra también.',
  },
  {
    id: 'misma-base',
    titulo: 'Todas desde el mismo suelo',
    instruccion:
      'Pon las cuatro barras de pie sobre la misma línea, una al lado de otra, del mismo ancho y sin taparse. Si una empieza más arriba o es más gorda, el ojo cree que es más.',
    pista: 'Fíjate en la última fila de cada barra: tiene que ser la misma en las cuatro. «Alto +» y «Alto −» cambian la altura sin mover la base.',
    comprueba: (d) => mismaBaseYAncho(d.documento),
    aprendido: 'El ojo compara alturas desde el suelo. Si el suelo cambia, la gráfica miente aunque los números estén bien.',
  },
  {
    id: 'etiquetas',
    titulo: 'Cada barra dice qué es',
    instruccion:
      'Debajo de cada barra, una etiqueta con qué es y cuántos son. Que cada una quede justo bajo SU barra.',
    pista: 'Un cuadro de texto por barra, en sus mismas columnas y pegado por debajo. El número tiene que ser el de esa barra.',
    comprueba: (d) => cadaBarraConSuEtiqueta(d.documento),
    aprendido: 'Una barra sin etiqueta es una forma bonita. Con su nombre y su número, es un dato.',
  },
  {
    id: 'destaca',
    titulo: 'La respuesta, de otro color',
    instruccion:
      'La respuesta a la pregunta del título es la barra más alta. Hazla destacar: de un color distinto, y las otras tres de un mismo color entre ellas.',
    pista: 'Si cada barra es de un color, todas gritan a la vez y ninguna destaca. Tres iguales y una distinta.',
    comprueba: (d) => destacaLaRespuesta(d.documento),
    aprendido: 'El color guía al ojo hacia la respuesta. Usado en todas partes, no guía a ningún sitio.',
  },
  {
    id: 'fuente',
    titulo: '¿De dónde salen los datos?',
    instruccion:
      'Toda infografía dice de dónde salen sus números. Escríbelo abajo del todo, en letra más chica que todo lo demás: salieron de la encuesta del 6.º B.',
    pista: 'Un texto más, debajo de las etiquetas. «A−» lo hace más chico.',
    comprueba: (d) => diceLaFuente(d.documento),
    aprendido: 'Sin fuente, un número es una opinión. Con fuente, cualquiera puede comprobarlo.',
  },
  {
    id: 'fondo-paleta',
    titulo: 'Dale color, sin pasarte',
    instruccion:
      'Pinta el fondo del cartel y revísalo entero: cuatro colores como máximo en total, nada tapando nada, y el título por encima y más grande que todo lo demás.',
    pista: 'Haz clic fuera de las cajas para pintar el fondo. Cuenta como color lo que se VE, no el bote: dos tintas que pintan igual son un solo color.',
    comprueba: (d) => {
      const pag = paginaDe(d.documento, PAGINA);
      return (
        !!pag?.fondo &&
        cuantosColores(d.documento, PAGINA) <= 4 &&
        hayJerarquia(d.documento, PAGINA) &&
        paresQueSeTapan(d.documento, PAGINA).length === 0
      );
    },
    aprendido: 'Un cartel con pocos colores se lee más rápido que uno con muchos. Menos, pero a propósito.',
  },
];

const TOTAL_PASOS = GUION.length;

const PORTADA: DatosPortadaDiseno = {
  situacion: 'Parada 1 de 3 · Diseño y multimedia',
  tema: 'Carteles e infografías: que se lea de un vistazo',
  objetivo:
    'Sabrás convertir los números de una encuesta en una infografía que contesta su pregunta de un vistazo: barras del tamaño de su número, cada una con su etiqueta, la respuesta destacada, la fuente, y un cartel con jerarquía y pocos colores.',
  vasAHacer: [
    'Poner la pregunta de título, grande y centrada.',
    'Dibujar una barra por dato, con la altura proporcional a su número.',
    'Ponerlas sobre el mismo suelo, con su etiqueta, y destacar la respuesta.',
    'Decir de dónde salen los datos y pintar el cartel sin pasarte de 4 colores.',
  ],
  encargos: TOTAL_PASOS,
  minutos: 25,
  insignia: { nombre: 'Diseñador de carteles', emoji: '🪧' },
  boton: 'Abrir el editor',
  acento: '#f97316',
};

const LINEAS = {
  inicio:
    'Tu lienzo está vacío. El 6.º B preguntó cómo llega cada uno a la escuela, y hoy conviertes esos números en un cartel que lo conteste de lejos.',
  fin: 'Tu infografía contesta su pregunta de un vistazo: la altura de cada barra es su número, todas desde el mismo suelo, la respuesta destaca y se sabe de dónde salen los datos.',
};

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabCartelesEInfografias(props: PropsLab) {
  const [intento, setIntento] = useState(0);
  const { onProgress, onScore } = props;

  const repetir = useCallback(() => {
    onProgress(0);
    onScore(100);
    setIntento((n) => n + 1);
  }, [onProgress, onScore]);

  return <Practica key={intento} {...props} alRepetir={repetir} />;
}

function Practica({ alSalir, alRepetir, ...props }: PropsLab & { alRepetir: () => void }) {
  const [empezado, setEmpezado] = useState(false);
  const { pasos, terminado, tiempoFinal, avanzar, terminar } = useLabActividad(props, TOTAL_PASOS);
  const { linea, hablar } = useBit();

  const d = useDiseno({ documento: DOC_INICIAL, herramientas: ['seleccion', 'texto', 'forma', 'alinear', 'color'] });

  const guion = useGuionDiseno(d, GUION, {
    onAvance: (paso) => {
      avanzar();
      reproducirTono('correct');
      hablar(paso.aprendido);
    },
    onTerminado: () => terminar(0, () => hablar(LINEAS.fin)),
  });

  const empezar = useCallback(() => {
    setEmpezado(true);
    reproducirTono('select');
    hablar(LINEAS.inicio);
  }, [hablar]);

  const unica = d.seleccion.length === 1 ? capaDe(d.documento, d.pagina, d.seleccion[0]) : null;

  const panel = (
    <>
      <TarjetaPaso paso={guion.actual} numero={Math.min(guion.indice + 1, TOTAL_PASOS)} total={TOTAL_PASOS} />
      {unica?.tipo === 'texto' && (
        <div className="dsg-panel-extra">
          <button
            type="button"
            className="dis-btn"
            data-accion="letra-mas"
            onClick={() => d.hacer(accion('tamano', { pagina: d.pagina, capa: unica.id, pt: ptArriba(unica.pt) }))}
          >
            A+ ({unica.pt}pt)
          </button>
          <button
            type="button"
            className="dis-btn"
            data-accion="letra-menos"
            onClick={() => d.hacer(accion('tamano', { pagina: d.pagina, capa: unica.id, pt: ptAbajo(unica.pt) }))}
          >
            A-
          </button>
        </div>
      )}
      {unica?.tipo === 'forma' && (
        <div className="dsg-panel-extra" data-testid="dsg-medidas">
          <span className="dsg-medida">
            {unica.caja.filas} de alto × {unica.caja.cols} de ancho
          </span>
          <button
            type="button"
            className="dis-btn"
            data-accion="alto-mas"
            disabled={unica.caja.fila === 0}
            onClick={() =>
              d.hacer(
                accion('redimensionar', {
                  pagina: d.pagina,
                  capa: unica.id,
                  col: unica.caja.col,
                  fila: unica.caja.fila - 1,
                  cols: unica.caja.cols,
                  filas: unica.caja.filas + 1,
                }),
              )
            }
          >
            Alto +
          </button>
          <button
            type="button"
            className="dis-btn"
            data-accion="alto-menos"
            disabled={unica.caja.filas <= 1}
            onClick={() =>
              d.hacer(
                accion('redimensionar', {
                  pagina: d.pagina,
                  capa: unica.id,
                  col: unica.caja.col,
                  fila: unica.caja.fila + 1,
                  cols: unica.caja.cols,
                  filas: unica.caja.filas - 1,
                }),
              )
            }
          >
            Alto −
          </button>
        </div>
      )}
    </>
  );

  const hechos = terminado ? TOTAL_PASOS : pasos;

  return (
    <ArcadeSala
      titulo="Carteles e infografías"
      pasoEtiqueta="Encargo"
      pasoActual={hechos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Hechos"
      marcadorValor={`${hechos}/${TOTAL_PASOS}`}
      bit={empezado ? linea : null}
      base={<p className="gabinete-nota">Tecnia Diseño · cartel vertical · cuadriculado, sin épsilon</p>}
      alSalir={alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Diseñador de carteles',
              insigniaEmoji: '🪧',
              titulo: '¡Tu cartel está listo!',
              detalle:
                'Una infografía de verdad: la pregunta de título, una barra del tamaño de cada número sobre el mismo suelo, sus etiquetas, la respuesta destacada y la fuente. Y un cartel con jerarquía y cuatro colores como mucho.',
              resumen: [
                { etiqueta: 'Encargos', valor: `${TOTAL_PASOS}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
                { etiqueta: 'Pasos dados', valor: `${d.pasos.length}` },
              ],
              alRepetir,
            }
          : null
      }
    >
      <VentanaBase marca="Tecnia Diseño" subtitulo="encuesta-6B · 12×16 casillas">
        <VentanaDiseno
          documento={d.documento}
          pagina={d.pagina}
          seleccion={d.seleccion}
          herramientas={d.herramientas}
          herramienta={d.herramienta}
          onHerramienta={d.elegirHerramienta}
          gesto={d.gesto}
          pasos={d.pasos}
          rechazo={d.rechazo}
          onSeleccionar={(id, mas) => d.seleccionar(id ? [id] : [], mas)}
          onGestoInicio={d.iniciarGesto}
          onGestoMover={d.moverGesto}
          onGestoSoltar={d.soltarGesto}
          onAccion={d.hacer}
          nuevoId={d.nuevoId}
          onDeshacer={d.deshacer}
          onRehacer={d.rehacer}
          puedeDeshacer={d.puedeDeshacer}
          puedeRehacer={d.puedeRehacer}
          panel={panel}
        />
      </VentanaBase>
      {!empezado && <PortadaDiseno portada={PORTADA} onEmpezar={empezar} />}
    </ArcadeSala>
  );
}

export default LabCartelesEInfografias;
