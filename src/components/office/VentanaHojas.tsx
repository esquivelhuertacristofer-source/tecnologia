'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Redo2, Save, Undo2, X } from 'lucide-react';

import { BotonCinta, PanelMaestro, PortadaPractica, type Recado } from './chrome/piezas';
import { esDesvio, useCajaDelObjetivo, useHuecoEnElBody } from './chrome/ganchos';
import { comoLlegar, explicarDesvio, ubicar, ubicarPestana, type Ubicacion } from './motor/guia';
import { DESPLEGABLES_EXCEL, QUE_HACE_EXCEL, QUE_HACE_PESTANA_EXCEL } from './motor-hojas/guia';
import {
  estaActivo,
  estaConstruido,
  estaInerte,
  gestosDe,
  razonInerte,
  textoDeCaja,
  type ContextoCinta,
  type ControlesDeClase,
} from './motor-hojas/cinta';
import { RELOJ_DE_LA_CLASE, type GuionHojas } from './motor-hojas/guion';
import BackstageHojas, { reiniciarImpresora } from './motor-hojas/BackstageHojas';
import type { PestanaExcel, PestanaHojas } from '@/components/activities/office/tecniaHojas';
import { conLibro, crearMotor, type Motor } from './motor-hojas/formula/calculo';
/*
 * `revisar` se importa a propósito, y no contradice lo de «un solo camino»:
 * es una **pregunta**, no una vía de escritura. La ventana necesita saber de
 * antemano si el programa va a rechazar lo escrito para dejar la celda abierta
 * con el texto del alumno dentro. Lo que no puede hacer —y hacía— es aplicar
 * sin preguntar.
 */
import {
  argsDeFormato,
  cajaDeTexto,
  combinacionesDe,
  ejecutarVarios,
  nuevaGrabadora,
  revisar,
  SE_CONFIRMA,
  validacionEnCelda,
  vinculoEnCelda,
  vinculoRoto,
  type Caja,
  type Combinacion,
  type Gesto,
} from './motor-hojas/comandos';
import { comoSeVe } from './motor-hojas/formatos';
import { frasesDelParte, leerCsv, type Separador } from './motor-hojas/datos';
/**
 * `flechasDeAuditoria` (bloque 47, `of-excel-auditoria`) da el grafo de
 * precedentes/dependientes ya traducido a `col`/`puesto` de pantalla —lee la
 * cabecera de `consultas.ts`—; pintarlo con `ANCHO_COL`/`ALTO_FILA` es trabajo
 * de esta ventana, como el tirador, la estela o el ancla de una gráfica.
 */
import { flechasDeAuditoria } from './motor-hojas/consultas';
import Grafica from './motor-hojas/Grafica';
import { decoracionesDeHoja } from './motor-hojas/condicional';
import { combinarDecoraciones, decoracionesDeTablas, TablaVisual } from './motor-hojas/TablaVisual';
/**
 * Lo que enseña una tabla dinámica (bloques 49 y 50), celda a celda. Va por
 * dentro de la rejilla y no en una capa flotante —el porqué entero está en
 * `dinamicaVisual.ts`—: así se puede marcar una celda de la dinámica, e
 * intentar escribir en ella, que es un encargo de la clase.
 */
import { celdasDeDinamicas } from './motor-hojas/dinamicaVisual';
import MinigraficoSVG from './motor-hojas/Minigrafico';
import {
  celdaEn,
  clave,
  dir,
  esError,
  letraDeColumna,
  dirAColFila,
  filaEnPuesto,
  partirClave,
  puestoDeFila,
  type Formato,
  type Hoja,
  type Libro,
  type TipoFormato,
  type Valor,
} from './motor-hojas/modelo';
import './ventanaTextos.css';
import './ventanaHojas.css';

/**
 * Tecnia Hojas · la ventana. El paso 1 del §45.7.
 *
 * La ventana **es** Excel: cinta, cuadro de nombres, barra de fórmulas,
 * cuadrícula, pestañas de hoja y barra de estado. Debajo, el motor del §46, que
 * ya está probado. Lo que este archivo añade es la parte que no se puede
 * probar sin pantalla: dónde se pulsa, qué se ve y cómo se señala.
 *
 * ── LO QUE SE HEREDA Y NO SE VUELVE A ESCRIBIR ──────────────────────────────
 *
 * El chrome entero viene de `chrome/piezas.tsx`, `chrome/ganchos.ts` y las
 * clases `.txtw-*` de `ventanaTextos.css`; el modo guía viene de
 * `motor/guia.ts` y `motor/guion.ts`, que toman sus tablas por parámetro y por
 * eso no hubo que tocarles una línea. `ventanaHojas.css` sólo redefine tres
 * variables de color y añade lo que Excel tiene y las otras dos ventanas no.
 * Si algún día hay que **editar** una regla `.txtw-*` para que Excel se vea
 * bien, es que el chrome estaba copiado y no sacado.
 *
 * ── LA DECISIÓN PROPIA DE ESTA VENTANA ──────────────────────────────────────
 *
 * **Un botón de la cinta no aplica nada: emite un gesto** (`cinta.ts`, y el
 * §45.6 detrás). La ventana los pasa por `ejecutarGestos`, que es el único
 * camino por el que el libro cambia. De ahí salen tres cosas gratis: la
 * grabadora de macros de la clase 55 graba TODO lo que hace la cinta sin una
 * línea más; deshacer es una pila de libros, porque el libro es inmutable; y el
 * desvío del modo guía se corta **antes** de tocar el libro, que es lo que el
 * cliente compró en el §37: *que equivocarse de botón no ensucie el documento*.
 *
 * ── LA REJILLA ──────────────────────────────────────────────────────────────
 *
 * Se pintan sólo las filas que caben en la pantalla. El alto de fila y el ancho
 * de columna son **constantes**, que es «cuadricular, no medir» (§39) aplicado
 * aquí: saber qué celda hay bajo el ratón es una división entera y no una
 * medición del DOM, y por lo tanto no lleva ni una tolerancia.
 */

/* ── la geometría, en constantes ────────────────────────────────────────────*/

export const ANCHO_COL = 88;
export const ALTO_FILA = 22;
export const ANCHO_CAB = 44;
export const ALTO_CAB = 22;

/**
 * Hasta dónde llega la hoja que se puede recorrer.
 *
 * Excel llega a 16 384 × 1 048 576 y el modelo también (`modelo.ts`), pero el
 * espacio de desplazamiento se dibuja de verdad: un millón de filas serían
 * veintitrés millones de píxeles de alto, que es donde los navegadores empiezan
 * a redondear mal. 400 × 40 es más hoja de la que cabe en cualquier clase de
 * bachillerato y deja la barra de desplazamiento con un tamaño creíble. Queda
 * anotado: el día que una clase pida ir a `A100000` con el cuadro de nombres,
 * esto se convierte en desplazamiento fingido, no en un número más grande.
 */
/*
 * Se exportan desde el 17-ago-2026 porque una clase empezó a necesitarlas:
 * `controlesDinamica.ts` crece por celdas ocupadas para proponer el origen de
 * una tabla dinámica —lo que hace Excel al pulsar «Tabla dinámica» estando
 * dentro de una lista— y un bucle así necesita el mismo techo que la ventana, no
 * una copia suya con otro número.
 */
export const FILAS_HOJA = 400;
export const COLS_HOJA = 40;

/**
 * La fila que toca tras moverse `dFila` PUESTOS hacia arriba o abajo —con el
 * teclado, o al confirmar una celda con Enter/Tab—, SALTÁNDOSE las
 * escondidas: filtradas por una tabla u ocultas a mano (paquete TABLAS,
 * bloques 33-36). Es «todo el que se desplace pasa por `puestoDeFila`/
 * `filaEnPuesto`» aplicado a las flechas del teclado.
 *
 * Sin `visibles` —el caso de siempre, y el de todas las clases construidas
 * hasta hoy— es exactamente la suma/resta de toda la vida, clamada a
 * `FILAS_HOJA`: cero cambio de comportamiento para nada de lo que ya existe.
 */
const filaTrasDesplazamiento = (hoja: Hoja | undefined, filaBase: number, dFila: number): number => {
  if (!dFila || !hoja?.visibles) return Math.max(0, Math.min(FILAS_HOJA - 1, filaBase + dFila));
  const tope = Math.min(FILAS_HOJA, hoja.visibles.length) - 1;
  if (tope < 0) return filaBase;
  const puestoBase = puestoDeFila(hoja, filaBase);
  const puesto = Math.max(0, Math.min(tope, (puestoBase < 0 ? 0 : puestoBase) + dFila));
  const fila = filaEnPuesto(hoja, puesto);
  return fila >= 0 ? fila : filaBase;
};

/* ── las puertas de clase ───────────────────────────────────────────────────*/

export interface PanelDeClaseProps {
  libro: Libro;
  motor: Motor;
  hoja: string;
  sel: Caja;
  gesto: (control: string, valor?: string | number) => void;
}

export interface BackstageProps {
  libro: Libro;
  /**
   * **El mismo motor de la pantalla**, no uno hecho aparte.
   *
   * Llegó el 16-ago-2026 con el previo de imprimir, y es una precaución con
   * nombre: en el papel sale el *valor* de la celda, no su fórmula, así que el
   * previo necesita un motor sí o sí. Fabricárselo dentro con `crearMotor(libro)`
   * habría funcionado y habría sido el defecto H del §44.4 otra vez —dos números
   * distintos para la misma cosa a dos clics uno del otro—: un motor nuevo nace
   * con el reloj de fábrica, así que una celda con `=HOY()` diría en el previo un
   * día distinto del que enseña la rejilla. Con el motor de la ventana no hay dos
   * verdades posibles, y de paso el previo no recalcula nada.
   */
  motor: Motor;
  archivo: string;
  cerrar: () => void;
  avisar: (control?: string) => void;
  /**
   * Emitir gestos, exactamente como los emite un botón de la cinta (§45.6).
   *
   * Detrás de Archivo también se cambia el libro —girar la hoja, marcar el área
   * de impresión— y eso no puede entrar por una puerta propia: pasa por
   * `ejecutarGestos`, o sea por `revisar`, por el historial de deshacer y por la
   * grabadora. Un botón del Backstage que tocara el libro por su cuenta grabaría
   * una macro incompleta, y eso no se ve hasta la clase 55.
   *
   * **No hay un `cambiar(libro)` al lado, y es a propósito.** Lo hubo, sin usar
   * y sin probar, mientras nadie montaba este Backstage: se resolvía llamando a
   * `conLibro` por su cuenta, saltándose `revisar`, el corte del desvío del
   * modo guía y la grabadora — la misma puerta trasera que esta cabecera
   * prohíbe dos párrafos más arriba. Mientras el Backstage no se montaba, el
   * agujero era de mentira; en cuanto se monta, deja de serlo. No se puede
   * arreglar convirtiéndolo en un gesto más, porque un gesto es un DATO —
   * `{ comando, args }` con `args` sólo cadenas y números (regla de la
   * cabecera de `comandos.ts`)— y un libro entero no cabe ahí ni tiene por qué
   * caber: sería fabricar un comando que carga un libro completo, la puerta
   * trasera con otro nombre. Ninguna de las cuatro secciones de hoy —
   * Información, Guardar, Imprimir, Exportar a PDF— necesita cambiar el libro
   * por otra vía que no sea `gesto()`, así que la puerta simplemente no existe.
   * El día que una sección SÍ necesite tocar el libro de una forma que ningún
   * comando cubra —un inspector que quite algo, como el de PowerPoint—, lo que
   * hace falta es un comando nuevo en `COMANDOS` con su `revisar()`, no que
   * esta puerta vuelva a abrirse.
   */
  gesto: (gestos: Gesto[], control?: string) => void;
}

export interface VentanaHojasProps {
  cinta: PestanaHojas[];
  guion: GuionHojas;
  /** Un panel acoplado propio de la clase, siempre abierto. */
  panelFijo?: { titulo: string; Cuerpo: React.ComponentType<PanelDeClaseProps> };
  /** Herramientas que aporta ESTA clase y que el motor no trae. */
  controles?: ControlesDeClase;
  /** Lo que la clase quiera pintar dentro de la ventana. */
  accesorios?: React.ReactNode;
  /** Lo que hay detrás de Archivo. Sin él, la pestaña sigue siendo un tope. */
  backstage?: React.ComponentType<BackstageProps>;
  /**
   * Los archivos que el panel de «Importar datos» (bloque 43) ofrece para
   * traer con un clic, en vez de que el alumno tenga que teclear un `.csv`
   * entero — la misma razón por la que ninguna clase teclea un archivo real:
   * esto es un simulador, y «traer el archivo» es elegirlo de una lista corta,
   * no abrir un explorador que no existe. Sin ninguno, el panel sigue
   * funcionando con sólo el cuadro de texto, para quien quiera pegar el suyo.
   */
  archivosParaImportar?: Array<{ nombre: string; texto: string }>;
  onAvance?: (avance: number) => void;
  onTerminado?: (r: { pasos: number; tropiezos: number; segundos: number }) => void;
  onSalir?: () => void;
  insignia?: { nombre: string; emoji: string; titulo: string; detalle: string };
  minutos?: number;
}

/*
 * El reloj de la clase se **importa**, no se escribe aquí (16-ago-2026). Estuvo
 * escrito en esta línea desde el §47 y era medio contrato: el motor de la ventana
 * y el motor que corrige el encargo tienen que dar la misma fecha, y cada uno se
 * traía la suya. El motivo entero está en `motor-hojas/guion.ts`, junto a la
 * constante, que es donde lo va a leer quien escriba la siguiente clase con
 * fechas.
 */
const CONTEXTO_RELOJ = RELOJ_DE_LA_CLASE;

/** Los que se quedan hundidos cuando el formato ya está puesto. */
const ES_INTERRUPTOR = new Set([
  'negrita',
  'cursiva',
  'subrayado',
  'moneda',
  'porcentaje',
  'millares',
  'alinear-izquierda',
  'alinear-centro',
  'alinear-derecha',
  'ajustar-texto',
  'combinar-centrar',
  'mostrar-formulas',
  'ver-cuadricula',
  'ver-encabezados',
  // El rastro de auditoría (bloque 47) también es estado de la VENTANA, no
  // del libro: el botón se queda hundido mientras sus flechas están en
  // pantalla, la misma familia que `ver-cuadricula` dos líneas más arriba.
  'rastrear-precedentes',
  'rastrear-dependientes',
  // `inmovilizar` (bloque 36, `of-excel-tablas-y-filtros`) es un interruptor
  // como `negrita`: el mismo botón quita lo que él mismo puso. Faltaba en
  // esta lista porque nunca tuvo un botón en ninguna cinta hasta esta clase
  // —`controles.ts` ya le da `activo: yaInmovilizado`—, así que `es-activo`
  // pintaba bien pero `aria-pressed` se quedaba en `undefined` siempre.
  'inmovilizar',
]);

/**
 * Lo que se puede señalar y no vive en la cinta: **dónde está** y **cómo se
 * llama**.
 *
 * Las dos mitades van juntas y no en dos tablas porque las dos hacen falta a la
 * vez. Hasta el 14-ago-2026 sólo estaba el selector, y eso dejaba un encargo
 * sobre el cuadro de nombres **con aro y sin ficha**: el aro caía en su sitio,
 * pero `ubicar()` no lo encontraba en la cinta —porque no está—, `sitioGuia`
 * salía `null` y el panel del maestro no pinta la ficha sin sitio. O sea que la
 * frase de `QUE_HACE_EXCEL` que explica para qué sirve el cuadro de nombres
 * estaba escrita, importada… y no se enseñaba nunca. Media guía, que es lo que
 * §37 prohíbe, y en la primera clase de la sala —donde la mitad de lo que se
 * enseña son partes de la ventana y no botones— habría sido la mitad de la
 * clase.
 */
const FUERA_DE_LA_CINTA: Record<string, { donde: string; etiqueta: string; glifo: string }> = {
  /*
   * El cuadrito de relleno, que es una parte de la ventana con todas las de la
   * ley: se ve, se agarra y hace algo. Su CSS llevaba escrito desde el §45.7 y
   * ninguna línea lo pintaba, o sea que el bloque 8 sólo se podía aprender por
   * la puerta que nadie usa —el botón «Rellenar la serie» de la cinta—. Se
   * construyó el 15-ago-2026 con `n5-captura-y-ordena`, que es su dueña.
   */
  tirador: { donde: '.hjw-tirador', etiqueta: 'El cuadrito de relleno', glifo: '▪' },
  /*
   * La gráfica ya hecha. Es una parte de la ventana igual que el tirador —flota,
   * se agarra y se mueve— y sin esta entrada un encargo que dijera «mira tu
   * gráfica» habría salido con aro y sin ficha, que es el defecto que esta tabla
   * existe para no repetir. La frase la pone `QUE_HACE_EXCEL.grafica`.
   */
  grafica: { donde: '.hjw-grafica', etiqueta: 'Tu gráfica', glifo: '▥' },
  /*
   * Los seis campos del panel «Diseño de gráfico» — bloque 18, construido por
   * `n5-mi-primera-grafica`. Es la pestaña contextual que `tecniaHojas.ts`
   * declaraba desde el §45.7 sin que nadie la usara («el día que la clase de
   * gráficas se construya... aquí no hay que tocar nada más»): en vez de una
   * pestaña de cinta —que habría exigido enseñar el mecanismo entero de
   * pestañas contextuales antes de tener una sola clase que lo necesitara—, es
   * un panel que flota junto a la gráfica seleccionada, con la misma disciplina
   * de `onBlur` que ya usaban «Encabezado» y «Pie» en el Backstage.
   */
  'grafica-titulo': { donde: '[data-control="grafica-titulo"]', etiqueta: 'Título del gráfico', glifo: 'Aa' },
  'grafica-datos': { donde: '[data-control="grafica-datos"]', etiqueta: 'Rango de datos', glifo: '▦' },
  'grafica-eje-x': { donde: '[data-control="grafica-eje-x"]', etiqueta: 'Título del eje horizontal', glifo: '↔' },
  'grafica-eje-y': { donde: '[data-control="grafica-eje-y"]', etiqueta: 'Título del eje vertical', glifo: '↕' },
  'grafica-leyenda': { donde: '[data-control="grafica-leyenda"]', etiqueta: 'Leyenda', glifo: '▤' },
  'grafica-rotulos-de-dato': {
    donde: '[data-control="grafica-rotulos-de-dato"]',
    etiqueta: 'Rótulos de dato',
    glifo: '#',
  },
  /*
   * El séptimo campo del panel, y el que faltaba desde que `Grafica.tsx`
   * documentó `minY` como «para la clase 38» sin que ninguna clase hubiera
   * nacido todavía para pedirlo: `cambiarGrafica` ya sabía tocarlo
   * (`CAMPOS_DE_GRAFICA.minY`, en `comandos.ts`, desde el §45.5) y el panel no
   * tenía dónde escribirlo — la misma familia de puerta cerrada que abrió
   * `n5-mi-primera-grafica` con «Rango de datos». La abre `n6-elige-la-grafica`
   * (bloque 38), que es quien por fin necesita cortar un eje a propósito.
   */
  'grafica-min-y': { donde: '[data-control="grafica-min-y"]', etiqueta: 'Eje mínimo (Y)', glifo: '✂' },
  /*
   * Quitar una gráfica de la hoja — `of-excel-dashboard`, bloque 58. El
   * comando (`borrarGrafica`, `comandos.ts`) estaba construido desde el §45.5
   * y **no tenía por dónde entrar**: no vive en ninguna cinta y la tecla Supr
   * sobre la rejilla dispara `borrar-contenido`. Se abrió con el
   * `ControlesDeClase` de la primera clase que necesita QUITAR algo en vez de
   * construirlo, y su botón vive en el panel «Tablero» —el equivalente del
   * panel «Selección» de Excel—, así que `ubicar()` no lo iba a encontrar en
   * ninguna pestaña: mismo criterio que las cuatro de la dinámica, aquí abajo.
   */
  'borrar-grafico': { donde: '[data-control="borrar-grafico"]', etiqueta: 'Quitar una gráfica', glifo: '✕' },
  'cuadro-de-nombres': { donde: '.hjw-nombres', etiqueta: 'Cuadro de nombres', glifo: 'A1' },
  'barra-de-formulas': { donde: '.hjw-formula', etiqueta: 'Barra de fórmulas', glifo: 'fx' },
  'pestanas-de-hoja': { donde: '.hjw-pestanas', etiqueta: 'Pestañas de hoja', glifo: '▤' },
  'nueva-hoja': { donde: '.hjw-hoja-mas', etiqueta: 'Hoja nueva', glifo: '＋' },
  'barra-de-estado': { donde: '.txtw-estado', etiqueta: 'Barra de estado', glifo: '▁' },
  guardar: { donde: '[data-control="guardar"]', etiqueta: 'Guardar', glifo: '💾' },
  deshacer: { donde: '[data-control="deshacer"]', etiqueta: 'Deshacer', glifo: '↺' },
  rehacer: { donde: '[data-control="rehacer"]', etiqueta: 'Rehacer', glifo: '↻' },
  /*
   * El «Formato condicional» y el «Insertar minigráfico» de Excel, en
   * miniatura — los siete botones de `PanelReglas.tsx`, la clase
   * `n7-formato-condicional` (bloques 30 y 31). Los siete comandos ya
   * estaban cableados en `comandos.ts` y en `cinta.ts` desde antes de esa
   * clase; lo único que faltaba era este mismo hueco, con el mismo criterio
   * que ya usan `grafica-titulo` y sus vecinos dos entradas más arriba: un
   * panel que flota junto a la selección y no vive en ninguna pestaña de la
   * cinta, así que `ubicar()` no lo iba a encontrar nunca por su cuenta.
   */
  'regla-barras': { donde: '[data-control="regla-barras"]', etiqueta: 'Barras de datos', glifo: '▥' },
  'regla-escala': { donde: '[data-control="regla-escala"]', etiqueta: 'Escala de color', glifo: '🎨' },
  'regla-iconos': { donde: '[data-control="regla-iconos"]', etiqueta: 'Conjunto de iconos', glifo: '🚦' },
  'regla-destacar': { donde: '[data-control="regla-destacar"]', etiqueta: 'Destacar celdas', glifo: '🖊' },
  'borrar-reglas': { donde: '[data-control="borrar-reglas"]', etiqueta: 'Borrar una regla', glifo: '✕' },
  minigrafico: { donde: '[data-control="minigrafico"]', etiqueta: 'Insertar minigráfico', glifo: '📈' },
  'borrar-minigraficos': { donde: '[data-control="borrar-minigraficos"]', etiqueta: 'Quitar minigráfico', glifo: '✕' },
  /*
   * Las ocho de la tabla (bloques 33-36), del panel «Tablas» de
   * `of-excel-tablas-y-filtros` — el mismo criterio que los siete de
   * `PanelReglas.tsx` dos entradas más arriba: `ubicar()` no las va a
   * encontrar en ninguna pestaña, porque no viven en ninguna. La novena,
   * `inmovilizar`, no está aquí porque sí tiene domicilio de cinta (Vista →
   * Mostrar) desde el primer día de la sala.
   */
  'crear-tabla': { donde: '[data-control="crear-tabla"]', etiqueta: 'Crear tabla', glifo: '⊞' },
  'estilo-tabla': { donde: '[data-control="estilo-tabla"]', etiqueta: 'Estilo de tabla', glifo: '🎨' },
  'fila-totales': { donde: '[data-control="fila-totales"]', etiqueta: 'Fila de totales', glifo: 'Σ' },
  filtrar: { donde: '[data-control="filtrar"]', etiqueta: 'Filtrar', glifo: '▾' },
  'quitar-filtros': { donde: '[data-control="quitar-filtros"]', etiqueta: 'Quitar filtros', glifo: '✕' },
  'ordenar-varias': { donde: '[data-control="ordenar-varias"]', etiqueta: 'Ordenar por varias columnas', glifo: '↕' },
  'ocultar-filas': { donde: '[data-control="ocultar-filas"]', etiqueta: 'Ocultar filas', glifo: '▤' },
  'mostrar-filas': { donde: '[data-control="mostrar-filas"]', etiqueta: 'Mostrar filas', glifo: '▤' },
  /*
   * Las cuatro del panel «Tabla dinámica» (bloques 49 y 50,
   * `of-excel-tabla-dinamica`) — mismo criterio que las ocho de la tabla aquí
   * arriba: el panel de campos no vive en ninguna pestaña de la cinta, así que
   * `ubicar()` no las va a encontrar nunca y sin esta entrada saldrían con aro
   * y sin ficha.
   *
   * `campo-dinamica` es UNA entrada para los cuatro botones de cada campo
   * —Filas, Columnas, Valores, Quitar— porque es un solo control con la zona
   * dentro del gesto, igual que en `comandos.ts`. El aro cae sobre el primero
   * que aparezca en el panel, que es lo que ya hacen `aplicar-escenario` y
   * `borrar-escenario` con su lista.
   */
  'crear-dinamica': { donde: '[data-control="crear-dinamica"]', etiqueta: 'Crear tabla dinámica', glifo: '🔄' },
  'campo-dinamica': { donde: '[data-control="campo-dinamica"]', etiqueta: 'Arrastrar un campo', glifo: '⇄' },
  'agrupar-dinamica': { donde: '[data-control="agrupar-dinamica"]', etiqueta: 'Agrupar un campo dentro de otro', glifo: '⊟' },
  'actualizar-dinamica': { donde: '[data-control="actualizar-dinamica"]', etiqueta: 'Actualizar', glifo: '↻' },
  /*
   * Las cinco del panel «Validación» de `of-excel-validacion» (bloques 32 y
   * 39) — el mismo criterio que las ocho de la tabla, aquí arriba: `ubicar()`
   * no las va a encontrar en ninguna pestaña porque `validar`,
   * `quitar-validacion` y `reemplazar` no viven en ninguna.
   *
   * `buscar` es un caso aparte, y quedó escrito mal una vez, así que se deja
   * dicho para quien lo vuelva a tocar: `tecniaHojas.ts` (Inicio → Edición)
   * SÍ trae un botón de fábrica con `data-control="buscar"` —del paquete
   * VALIDACIÓN entero, bloques 32/39/40/42, `{ gesto: () => null }` en
   * `cinta.ts`, para cuando alguna de las cuatro clases del paquete le dé
   * función—, y un primer intento apuntó aquí el aro al MISMO id, con la
   * idea de que esta tabla «ganara por delante» de la cinta. No gana: los dos
   * botones comparten `data-control`, y `document.querySelector` —de donde
   * sale este `donde` y de donde salían los `getByLabelText('Buscar')` de la
   * prueba— se queda con el PRIMERO que aparece en el documento, que es el de
   * la cinta, no el del panel. El aro caía sobre un botón muerto y
   * `getByLabelText('Buscar')` encontraba dos elementos a la vez. Por eso el
   * botón de este panel usa `data-control="buscar-panel"` —único de verdad—
   * y esta entrada apunta ahí.
   */
  validar: { donde: '[data-control="validar"]', etiqueta: 'Validación de datos', glifo: '🔽' },
  'quitar-validacion': { donde: '[data-control="quitar-validacion"]', etiqueta: 'Quitar validación', glifo: '✕' },
  'buscar-panel': { donde: '[data-control="buscar-panel"]', etiqueta: 'Buscar', glifo: '🔎' },
  'ir-a': { donde: '[data-control="ir-a"]', etiqueta: 'Ir a', glifo: '➜' },
  reemplazar: { donde: '[data-control="reemplazar"]', etiqueta: 'Reemplazar', glifo: '🔁' },
  /*
   * Las dos gráficas que `INSERTAR_BASICO` (`tecniaHojas.ts`) no declara a
   * propósito: el bloque 17 sólo nombra tres tipos, y `barras` y `dispersion`
   * viven en el modelo desde el §45.5 sin botón hasta que el bloque 37
   * —«elegir la gráfica correcta»— las necesita. Entran por el panel
   * «Gráficas» de `n6-elige-la-grafica» (`PanelGraficas.tsx`), el mismo
   * criterio que las ocho de la tabla dos entradas más arriba: `ubicar()` no
   * las va a encontrar en ninguna pestaña, porque tampoco viven en ninguna.
   */
  'grafico-barras': { donde: '[data-control="grafico-barras"]', etiqueta: 'Gráfico de barras', glifo: '▤' },
  'grafico-dispersion': { donde: '[data-control="grafico-dispersion"]', etiqueta: 'Gráfico de dispersión', glifo: '⁘' },
  /*
   * Los cuatro del panel «Y si» de `of-excel-y-si» (bloque 57) — el mismo
   * criterio que las ocho de la tabla, dos entradas más arriba: `ubicar()`
   * no las va a encontrar en ninguna pestaña, porque no viven en ninguna.
   * `guardar-escenario` y `aplicar-escenario` y `borrar-escenario` comparten
   * `data-escenario` con un nombre distinto por cada fila de la lista, pero
   * `document.querySelector` se queda con la primera que haya en el
   * documento — suficiente para señalar el aro mientras la lección enseña un
   * escenario o dos, el mismo límite que ya acepta `estilo-tabla`.
   */
  'buscar-objetivo': { donde: '[data-control="buscar-objetivo"]', etiqueta: 'Buscar objetivo', glifo: '🎯' },
  'guardar-escenario': { donde: '[data-control="guardar-escenario"]', etiqueta: 'Guardar escenario', glifo: '💾' },
  'aplicar-escenario': { donde: '[data-control="aplicar-escenario"]', etiqueta: 'Aplicar escenario', glifo: '▶' },
  'borrar-escenario': { donde: '[data-control="borrar-escenario"]', etiqueta: 'Borrar escenario', glifo: '✕' },
  /*
   * Los cinco del panel «Macros» de `of-excel-macros» (bloques 55 y 56) — el
   * mismo criterio que el panel «Y si», dos entradas más arriba: los cinco
   * comandos ya vivían en `CONTROLES` (`cinta.ts`) desde el §45.6, pero
   * ninguna cinta les da un botón propio, así que `ubicar()` no los va a
   * encontrar en ninguna pestaña.
   */
  'grabar-macro': { donde: '[data-control="grabar-macro"]', etiqueta: 'Grabar macro', glifo: '⏺' },
  'parar-macro': { donde: '[data-control="parar-macro"]', etiqueta: 'Detener grabación', glifo: '⏹' },
  'ejecutar-macro': { donde: '[data-control="ejecutar-macro"]', etiqueta: 'Ejecutar macro', glifo: '▶' },
  'borrar-macro': { donde: '[data-control="borrar-macro"]', etiqueta: 'Borrar macro', glifo: '✕' },
  'asignar-macro': { donde: '[data-control="asignar-macro"]', etiqueta: 'Asignar macro a un botón', glifo: '🔘' },
};

/**
 * Lo que se señala DENTRO de la hoja, que no es un botón sino un sitio.
 *
 * `celda:B5`, `rango:B4:D9`, `columna:C`, `fila:7`. La explicación no se
 * escribe aquí: se toma de `QUE_HACE_EXCEL`, que ya trae `celda-activa`,
 * `cabecera-columna` y `cabecera-fila` escritas para esto.
 */
const SITIOS_DE_LA_HOJA: Record<string, { rotulo: (dato: string) => string; explica: string; glifo: string }> = {
  celda: { rotulo: (d) => `La celda ${d}`, explica: 'celda-activa', glifo: '▭' },
  rango: { rotulo: (d) => `El rango ${d}`, explica: 'celda-activa', glifo: '▦' },
  columna: { rotulo: (d) => `La columna ${d}`, explica: 'cabecera-columna', glifo: '▥' },
  fila: { rotulo: (d) => `La fila ${d}`, explica: 'cabecera-fila', glifo: '▤' },
  hoja: { rotulo: (d) => `La hoja ${d}`, explica: 'pestanas-de-hoja', glifo: '▤' },
  // Mover una gráfica se apunta como `grafica:<id>`, igual que arrastrar una
  // lengüeta se apunta como `hoja:<id>`.
  grafica: { rotulo: () => 'Tu gráfica', explica: 'grafica', glifo: '▥' },
};

/**
 * Lo que hay que hacer **antes** de lo que el encargo pide, y que por lo tanto
 * no es un desvío.
 *
 * Salió construyendo el bloque 11 y es de las que hay que dejar escritas: un
 * encargo que pide **Pegar** no puede castigar el **Copiar**, porque sin copiar
 * no hay nada que pegar. Con la guarda a secas, el alumno que hacía exactamente
 * lo que se le pedía se llevaba un tropiezo por el primer tiempo del gesto y la
 * ficha le explicaba dónde estaba Pegar — que era donde ya estaba mirando.
 *
 * No es un agujero en la guarda del §37: ninguno de estos dos toca el libro.
 * `copiar` no cambia nada (por eso vive en `SOLO_VENTANA`) y `cortar` en su
 * primera pulsación tampoco: sólo marca. Lo que ensucia el libro es el segundo
 * tiempo, y ése sí pasa por la guarda entera.
 */
const PRIMER_TIEMPO: Record<string, ReadonlySet<string>> = {
  pegar: new Set(['copiar', 'cortar']),
  'pegar-valores': new Set(['copiar', 'cortar']),
  'pegar-formato': new Set(['copiar', 'cortar']),
};

/**
 * Los colores de lengüeta, que son los de Excel y no una paleta inventada.
 *
 * Siete y no un selector de color entero: lo que enseña el bloque 16 es **para
 * qué** sirve pintar una lengüeta —encontrar la hoja de un vistazo en un libro
 * de doce—, y para eso hacen falta colores que se distingan entre sí, no
 * dieciséis millones que se parezcan.
 */
const PALETA_DE_HOJA: Array<{ hex: string; nombre: string }> = [
  { hex: '#c00000', nombre: 'Rojo' },
  { hex: '#ed7d31', nombre: 'Naranja' },
  { hex: '#ffc000', nombre: 'Amarillo' },
  { hex: '#107c41', nombre: 'Verde' },
  { hex: '#0f6cbd', nombre: 'Azul' },
  { hex: '#7030a0', nombre: 'Morado' },
  { hex: '#595959', nombre: 'Gris' },
];

/**
 * Los botones que **piden un dato antes de poder hacer nada**, y que por eso se
 * atienden ANTES de mirar si están inertes.
 *
 * Es el defecto 6 del §47.6 con otra cara y conviene decirlo aquí: `color-hoja`
 * se declara inerte mientras no le llegue un color (`cinta.ts`), y `pulsar`
 * comprueba lo inerte antes que nada — o sea que el botón contestaba «elige un
 * color de la paleta» y **la paleta no se abría nunca**, porque quien la abre es
 * este mismo botón. Un callejón sin salida perfectamente razonado por las dos
 * mitades por separado.
 *
 * Con esto, la primera pulsación abre la paleta y la segunda —la del color— es
 * una pulsación normal del mismo botón, con su `valor` puesto: mismo camino,
 * mismo gesto, misma grabadora.
 */
const PIDEN_UN_DATO: ReadonlySet<string> = new Set([
  'color-hoja',
  // Los tres del bloque 9 que llegaron el 15-ago-2026, y que son el MISMO caso:
  // `cinta.ts` los declara inertes hasta que les llega el color o la cara del
  // borde, y quien se los da es el panel que abre este mismo botón.
  'color-letra',
  'color-relleno',
  'bordes',
  /*
   * El desplegable de formato de número, que llegó el 16-ago-2026 con
   * `n6-funciones-esenciales` (bloque 29) y es el caso más caro de los cinco,
   * porque **no estaba apagado: estaba muerto**.
   *
   * `cinta.ts` le tiene su gesto escrito desde el primer día —lee `c.valor`, lo
   * comprueba contra los seis tipos del modelo y emite `formato`—; `guia.ts` lo
   * declara en `DESPLEGABLES_EXCEL` para que el aro caiga sobre el desplegable y
   * no sobre un botón cualquiera del grupo, y le tiene su frase escrita en
   * `QUE_HACE_EXCEL`. Tres archivos preparados para un panel **que la ventana no
   * pintaba**, así que la única puerta del bloque 6 —el TIPO de la celda, «la
   * idea más cara del grado» según la cabecera de la cinta— era un botón que se
   * dejaba pulsar, no estaba inerte, no decía nada y no hacía nada.
   *
   * Es exactamente el defecto 6 del §47.6 y el de `ver-cuadricula`, con una
   * diferencia que conviene no perder: aquéllos se cazaron porque el botón
   * **contestaba** algo equivocado. Éste no contestaba nada, y un botón mudo no
   * se distingue de uno que funciona hasta que alguien mira el libro después de
   * pulsarlo. Lo destapó la primera clase que necesita quitarle el formato de
   * fecha a una celda para ver el número que hay debajo.
   */
  'formato-numero',
  /*
   * Los dos del bloque 45 y 46 que llegaron el 16-ago-2026 con
   * `of-excel-datos-limpios`, y son el mismo caso otra vez: `cinta.ts` les
   * tenía el gesto escrito desde el 15-ago-2026 —lee `c.valor` como el patrón
   * o la fórmula y emite `formato-personalizado`/`regla-formula`—, pero
   * ningún panel lo pintaba todavía. A diferencia de los cinco de arriba, lo
   * que piden no es UNA casilla de una lista: es un texto libre que el
   * alumno escribe («#,##0;[Rojo](#,##0)», «=$C4>1000»), así que el panel que
   * abren no es una paleta ni una rejilla: es un cuadro de texto con un botón
   * «Aplicar» (ver `PanelDesplegable`, más abajo).
   */
  'formato-personalizado',
  'regla-formula',
  /*
   * `consolidar` (bloque 53, `of-excel-consolida-y-protege`, 16-ago-2026): el
   * mismo caso otra vez, y con el mismo motivo que los dos de arriba —lo que
   * pide no es una casilla de una lista, es texto libre que el alumno
   * escribe—, sólo que aquí son DOS datos en un cuadro («qué hojas» y «con
   * qué operación»), separados por «|» con la misma disciplina que
   * `buscarObjetivo` unas líneas más abajo.
   */
  'consolidar',
  /*
   * `hipervinculo` (bloque 40, `n6-interpreta-la-informacion`, 16-ago-2026):
   * el mismo caso una vez más — lo que pide no es una casilla de una lista,
   * es texto libre («h2!A1» o «h2!A1|Ver el detalle»). `quitar-hipervinculo`
   * no entra aquí: actúa de un solo clic con la celda ya seleccionada, sin
   * pedir ningún dato — es un botón normal, como `desbloquear-rango`.
   */
  'hipervinculo',
  /*
   * «Importar datos» (bloque 43, `n7-datos-reales`, 16-ago-2026): en
   * `cinta.ts` el control `importarCsv` está inerte mientras `c.valor` esté
   * vacío, y `ctxPara(id)` —lo que pinta la cinta— nunca le manda uno: se lo
   * da el panel que abre este mismo botón. Sin esta línea el botón nacía
   * apagado para siempre, el mismo callejón sin salida del resto de la lista.
   * No entra por el resto del mecanismo de `PIDEN_UN_DATO` —`pulsar` lo
   * intercepta antes, con su propio caso— así que esta entrada es sólo para
   * que el botón se pinte encendido.
   */
  'importar-csv',
]);

/**
 * Los seis tipos del desplegable, con lo que hacen dicho en un ejemplo.
 *
 * Va tipado `Record<TipoFormato, …>` y no como una lista suelta por lo mismo que
 * `QUE_HACE_PESTANA_EXCEL`: el día que el modelo gane un tipo —el formato
 * personalizado del bloque 45, por ejemplo— el compilador pide su rótulo aquí en
 * vez de dejarlo fuera del desplegable sin que nadie se entere. El orden es el
 * de escritura, y empieza por General porque es el que **quita** el disfraz: en
 * Excel es el primero de la lista y es el que enseña que debajo de una fecha
 * siempre hubo un número.
 *
 * El ejemplo es el MISMO número en los seis —el 46269 del 4 de septiembre de
 * 2026— y eso es la mitad del bloque 6 dicha sin una palabra: seis maneras de
 * enseñar el mismo dato. Se escribe a mano y no se calcula con `mostrar()` a
 * propósito: es un rótulo de la cinta, no una vista de la celda, y hacerlo
 * depender del motor obligaría a inventar un valor de mentira para pintar un
 * menú.
 *
 * **General y Texto enseñan lo mismo, y no es una errata.** Con un número entero
 * `mostrar()` da la misma cadena para los dos (`formatos.ts`), porque aquí el
 * formato no cambia el dato: lo que Texto cambia en Excel —que la celda deje de
 * ser un número— es cosa de lo que se escribe, no de cómo se enseña, y es la
 * clase de datos limpios (bloque 44). Poner dos ejemplos distintos para que el
 * menú «quedara bonito» sería enseñar una diferencia que este programa no tiene.
 */
/*
 * `Exclude<TipoFormato, 'personalizado'>`, y no los seis de siempre sueltos:
 * el patrón personalizado (bloque 45) no es una fila más de este desplegable
 * —no hay un «ejemplo» fijo que enseñar cuando el patrón lo escribe el
 * alumno— y el comando que lo aplica (`formato-personalizado`) vive aparte,
 * con su propio cuadro de texto. Excluirlo aquí es lo que deja este `Record`
 * exhaustivo sin inventarle un séptimo ejemplo a un tipo que no encaja en la
 * pregunta que hace este menú.
 */
const TIPOS_DE_NUMERO: Record<Exclude<TipoFormato, 'personalizado'>, { nombre: string; ejemplo: string }> = {
  general: { nombre: 'General', ejemplo: '46269' },
  numero: { nombre: 'Número', ejemplo: '46,269.00' },
  moneda: { nombre: 'Moneda', ejemplo: '$46,269.00' },
  fecha: { nombre: 'Fecha', ejemplo: '04/09/2026' },
  porcentaje: { nombre: 'Porcentaje', ejemplo: '4626900%' },
  texto: { nombre: 'Texto', ejemplo: '46269' },
};

/**
 * Los colores de una celda: los siete de la lengüeta **más el negro y el
 * blanco**, que en una hoja hacen falta y en una lengüeta no.
 *
 * Se derivan de `PALETA_DE_HOJA` en vez de escribirse otra vez: son la misma
 * paleta de Excel, y dos listas de colores «iguales» copiadas se separan el día
 * que alguien afine un verde. El negro va primero porque es el color de letra
 * que el alumno va a querer para volver atrás sin pulsar «Automático».
 */
const PALETA_DE_CELDA: Array<{ hex: string; nombre: string }> = [
  { hex: '#000000', nombre: 'Negro' },
  ...PALETA_DE_HOJA,
  { hex: '#ffffff', nombre: 'Blanco' },
];

/**
 * Las siete caras del desplegable de bordes, con el rótulo que el alumno lee.
 *
 * El glifo dibuja lo que hace, que a este tamaño es lo único que se entiende sin
 * leer. Los valores son los que `ladosDeBorde` sabe repartir (`comandos.ts`): la
 * ventana no inventa ninguno.
 */
const CARAS_DE_BORDE: Array<{ valor: string; glifo: string; nombre: string }> = [
  { valor: 'todos', glifo: '⊞', nombre: 'Todos los bordes' },
  { valor: 'contorno', glifo: '▢', nombre: 'Contorno de lo marcado' },
  { valor: 'ninguno', glifo: '⬚', nombre: 'Sin bordes' },
  { valor: 'arriba', glifo: '⎴', nombre: 'Borde de arriba' },
  { valor: 'abajo', glifo: '⎵', nombre: 'Borde de abajo' },
  { valor: 'izquierda', glifo: '▏', nombre: 'Borde de la izquierda' },
  { valor: 'derecha', glifo: '▕', nombre: 'Borde de la derecha' },
];

/** La tinta de un borde puesto a mano. Más oscura que la cuadrícula, a propósito. */
const TINTA_DE_BORDE = '#3a3a3a';

/** Los tres que sueltan lo que hay en el portapapeles. */
const ES_PEGAR: ReadonlySet<string> = new Set(['pegar', 'pegar-valores', 'pegar-formato']);

/** `celda:B5` → `['celda', 'B5']`. Lo que no lleva dos puntos no es un sitio. */
function partirSenal(control: string): [string, string] | null {
  const i = control.indexOf(':');
  return i > 0 ? [control.slice(0, i), control.slice(i + 1)] : null;
}

/**
 * El primero de una señal con LISTA. Un control suelto vuelve tal cual.
 *
 * **Defecto cazado el 17-ago-2026 construyendo `of-excel-tabla-dinamica`, y que
 * no es de esa clase**: desde que `esDesvio` (`chrome/ganchos.ts`) admite
 * `senal.control` con varios controles separados por comas —«un encargo puede
 * pedir varios botones»—, un encargo así se quedaba **con aro y sin ficha**.
 * Aquí abajo se buscaba `[data-control="buscar-objetivo,guardar-escenario"]`,
 * que no existe en ningún DOM, así que el aro no caía en ninguna parte y
 * `ubicar()` tampoco encontraba el domicilio: sin sitio, el panel del maestro no
 * pinta la ficha, o sea que la frase de `QUE_HACE_EXCEL` no se enseñaba nunca.
 * Es media guía, que es lo que §37 prohíbe.
 *
 * La causa es de las que no se ven mirando ninguno de los dos archivos: quien
 * abrió la lista lo hizo para arreglar el *corte del desvío* —que sí la parte
 * por comas— y esta otra mitad, la de señalar, se quedó comparando la cadena
 * entera. Ya afectaba a `of-excel-y-si` (encargo 6, «buscar objetivo y guardar
 * escenario») desde el 16-ago-2026.
 *
 * Se señala **el primero**: es el que hay que pulsar antes, y el aro se queda
 * ahí hasta que el encargo entero se cumple. Un aro por botón sería otra cosa
 * —el motor sólo tiene uno— y no la que hace falta para no dejar a nadie sin
 * ficha.
 */
const primeroDeLaSenal = (control: string): string =>
  control.includes(',') ? (control.split(',')[0]?.trim() ?? control) : control;

const cajaDeUna = (col: number, fila: number): Caja => ({ c0: col, f0: fila, c1: col, f1: fila });

const normalizar = (c: Caja): Caja => ({
  c0: Math.min(c.c0, c.c1),
  f0: Math.min(c.f0, c.f1),
  c1: Math.max(c.c0, c.c1),
  f1: Math.max(c.f0, c.f1),
});

/**
 * Cómo se llama, para el corrector, lo que el alumno acaba de seleccionar.
 *
 * Existe porque **seleccionar no llegaba al maestro** y esta sala no se puede
 * enseñar así. En Word y en PowerPoint todo encargo acaba en un botón o en un
 * cambio del documento; en una hoja de cálculo la mitad de la primera clase es
 * *ponerse en el sitio correcto* —«ve a C7», «marca de B4 a D9», «selecciona la
 * columna entera»— y eso no cambia el libro ni pulsa nada, así que ningún
 * `evaluar` se disparaba y ningún encargo de ésos podía darse por cumplido.
 * Con esto, la selección es un gesto con nombre y el guion puede pedirla.
 */
function nombreDeSeleccion(c: Caja): string {
  const n = normalizar(c);
  const a = dir(n.c0, n.f0);
  const b = dir(n.c1, n.f1);
  return a === b ? `celda:${a}` : `rango:${a}:${b}`;
}

/**
 * El panel que abre un botón de la cinta: las dos paletas de color y la rejilla
 * de bordes.
 *
 * Uno solo para los tres y no tres componentes: lo que cambia entre ellos son
 * las casillas de dentro, y lo que hace falta que sea idéntico —dónde sale, cómo
 * se cierra, que cada casilla vuelva a llamar al MISMO `pulsar` con su valor— es
 * todo lo demás. Con tres copias, la tercera se quedaría sin la mejora que
 * alguien le haga a la primera.
 *
 * Y ninguna casilla aplica nada por su cuenta: llaman a `pulsar(id, valor)`, o
 * sea que pasan por lo inerte, por la guarda del desvío, por el corrector y por
 * la grabadora, igual que si el botón hubiera venido con el dato puesto.
 */
function PanelDesplegable({
  id,
  actual,
  onElegir,
}: {
  id: string;
  /** El tipo que ya tiene la celda activa, para hundir su renglón. */
  actual: TipoFormato;
  onElegir: (id: string, valor: string) => void;
}) {
  /*
   * El cuadro de texto de `formato-personalizado` (bloque 45) y de
   * `regla-formula` (bloque 46): a diferencia de las tres paletas y del
   * desplegable de arriba, lo que estos dos piden no está en ninguna lista
   * cerrada —un patrón de número o una fórmula los escribe el alumno—, así
   * que el panel es un `<input>` sin controlar y un botón «Aplicar». Sin
   * controlar a propósito: guardar el texto en un `useState` obligaría a
   * limpiarlo a mano cada vez que el panel se cierra sin aplicar nada, y el
   * `ref` ya empieza vacío solo con cada montaje nuevo del panel.
   */
  const campoTexto = useRef<HTMLInputElement>(null);
  /*
   * La lista de tipos, que es un menú de renglones y no una rejilla de
   * cuadraditos: lo que distingue «Moneda» de «Porcentaje» es el ejemplo escrito
   * al lado, y eso no cabe en un botón de 30 píxeles. Es el mismo panel, la
   * misma puerta (`onElegir` → `pulsar`) y el mismo cierre que las dos paletas.
   */
  if (id === 'formato-numero') {
    return (
      <div className="hjw-desplegable es-lista" role="group" aria-label="Formato de número">
        <span className="hjw-desplegable-titulo">Formato de número</span>
        {(Object.keys(TIPOS_DE_NUMERO) as Exclude<TipoFormato, 'personalizado'>[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`hjw-tipo${t === actual ? ' es-puesto' : ''}`}
            aria-pressed={t === actual}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onElegir(id, t)}
          >
            <span className="hjw-tipo-nombre">{TIPOS_DE_NUMERO[t].nombre}</span>
            <span className="hjw-tipo-ejemplo">{TIPOS_DE_NUMERO[t].ejemplo}</span>
          </button>
        ))}
      </div>
    );
  }
  if (id === 'bordes') {
    return (
      <div className="hjw-desplegable" role="group" aria-label="Bordes de la celda">
        <span className="hjw-desplegable-titulo">Bordes</span>
        {CARAS_DE_BORDE.map((b) => (
          <button
            key={b.valor}
            type="button"
            className="hjw-borde"
            title={b.nombre}
            aria-label={b.nombre}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onElegir(id, b.valor)}
          >
            {b.glifo}
          </button>
        ))}
      </div>
    );
  }
  if (id === 'formato-personalizado' || id === 'regla-formula' || id === 'consolidar' || id === 'hipervinculo') {
    const titulo =
      id === 'regla-formula'
        ? 'Regla con fórmula'
        : id === 'consolidar'
          ? 'Consolidar'
          : id === 'hipervinculo'
            ? 'Hipervínculo'
            : 'Formato personalizado';
    const marcador =
      id === 'regla-formula'
        ? '=$C4>1000'
        : id === 'consolidar'
          ? 'Grupo A!B4:B6,Grupo B!B4:B6,Grupo C!B4:B6|suma'
          : id === 'hipervinculo'
            ? 'h2!A1'
            : '#,##0;[Rojo](#,##0)';
    const aplicar = () => {
      const escrito = campoTexto.current?.value.trim();
      if (escrito) onElegir(id, escrito);
    };
    return (
      <div className="hjw-desplegable es-texto" role="group" aria-label={titulo}>
        <span className="hjw-desplegable-titulo">{titulo}</span>
        <input
          ref={campoTexto}
          type="text"
          className="hjw-campo-texto"
          aria-label={titulo}
          placeholder={marcador}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') aplicar();
          }}
        />
        <button
          type="button"
          className="hjw-aplicar"
          onMouseDown={(e) => e.preventDefault()}
          onClick={aplicar}
        >
          Aplicar
        </button>
      </div>
    );
  }
  const deLetra = id === 'color-letra';
  return (
    <div className="hjw-desplegable" role="group" aria-label={deLetra ? 'Color de letra' : 'Color de relleno'}>
      <span className="hjw-desplegable-titulo">{deLetra ? 'Color de letra' : 'Color de relleno'}</span>
      <button
        type="button"
        className="hjw-color es-ninguno"
        title={deLetra ? 'Automático' : 'Sin relleno'}
        aria-label={deLetra ? 'Automático' : 'Sin relleno'}
        onMouseDown={(e) => e.preventDefault()}
        // La cadena vacía es «quítalo», y el motor la entiende como tal
        // (`formatoNuevo`). Sin esta casilla el botón sabría pintar y no
        // despintar, y el alumno se quedaría con deshacer como única salida.
        onClick={() => onElegir(id, '')}
      />
      {PALETA_DE_CELDA.map((c) => (
        <button
          key={c.hex}
          type="button"
          className="hjw-color"
          data-color={c.hex}
          title={c.nombre}
          aria-label={c.nombre}
          style={{ background: c.hex }}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onElegir(id, c.hex)}
        />
      ))}
    </div>
  );
}

export default function VentanaHojas({
  cinta,
  guion,
  panelFijo,
  controles,
  accesorios,
  /*
   * A diferencia de Word y PowerPoint —donde cada clase trae su propio recorte
   * del Backstage, `crearBackstage({ secciones: [...] })`— Excel sólo tiene UN
   * Backstage escrito, el completo del bloque 20 (`BackstageHojas`), y no hay
   * ninguna clase que necesite hoy un recorte suyo. Por eso se vuelve el valor
   * de fábrica del aparato entero, igual que Guardar o Deshacer: cualquier
   * clase lo hereda sin tener que importarlo ni pasarlo, y sigue siendo un
   * `prop` normal por si el día que haga falta un recorte una clase quiere
   * pasar el suyo.
   */
  backstage: Backstage = BackstageHojas,
  archivosParaImportar = [],
  onAvance,
  onTerminado,
  onSalir,
  insignia,
  minutos,
}: VentanaHojasProps) {
  const raiz = useRef<HTMLDivElement>(null);
  const rejilla = useRef<HTMLDivElement>(null);
  const hueco = useHuecoEnElBody();

  /*
   * El motor es una caché mutable sobre un libro inmutable (§46). Va en el
   * estado dentro de un envoltorio, y repintar es crear un envoltorio nuevo con
   * el MISMO motor. Leer `ref.current` al pintar es la manera de que la
   * pantalla se quede con lo de antes sin que se note.
   */
  const [caja, setCaja] = useState(() => ({ motor: crearMotor(guion.libro(), CONTEXTO_RELOJ) }));
  const motor = caja.motor;
  const repintar = useCallback(() => setCaja((c) => ({ motor: c.motor })), []);

  const [sel, setSel] = useState<Caja>(() => cajaDeUna(0, 0));
  const [editando, setEditando] = useState<string | null>(null);
  /**
   * Si lo que se está escribiendo se escribe **arriba, en la barra de fórmulas**.
   *
   * Salió al pintar la ventana por primera vez y es de las que se ven al primer
   * teclazo: `editando` es uno solo para los dos sitios donde se escribe —la
   * celda y la barra—, y el editor de dentro de la celda nace con `autoFocus`.
   * O sea que al escribir la primera letra en la barra, la celda abría su propio
   * editor y **se llevaba el foco**: la letra se quedaba puesta, el cursor se
   * iba a otro sitio y la barra de fórmulas quedaba inservible para escribir.
   */
  const [enLaBarra, setEnLaBarra] = useState(false);
  const [pestanaId, setPestanaId] = useState<PestanaExcel>(cinta[1]?.id ?? 'inicio');
  const [enArchivo, setEnArchivo] = useState(false);
  const [desplazado, setDesplazado] = useState({ top: 0, left: 0 });
  const [aviso, setAviso] = useState<Recado | null>(null);
  const [sinGuardar, setSinGuardar] = useState(false);
  const [cuadricula, setCuadricula] = useState(true);
  /**
   * `mostrar-formulas` (bloque 42): igual que `cuadricula`, no cambia el
   * libro, cambia cómo lo ves — así que es la misma familia de estado y vive
   * al lado. Ver todas las reglas de golpe en vez de todos los resultados es
   * cómo se entiende una hoja ajena, y por eso es de las cosas más útiles del
   * temario (§45.2).
   */
  const [mostrarFormulas, setMostrarFormulas] = useState(false);
  /**
   * El rastro de auditoría vivo (bloque 47): qué celda se rastreó, en qué
   * hoja y en qué sentido. `null` cuando no hay ninguno. Como `cuadricula` y
   * `mostrarFormulas`, es estado de la VENTANA y no del libro —rastrear no
   * cambia ni una celda (`SOLO_VENTANA`, `cinta.ts`)—, así que no puede
   * viajar como gesto ni guardarse en una macro.
   */
  const [rastro, setRastro] = useState<{
    direccion: 'precedentes' | 'dependientes';
    hoja: string;
    col: number;
    fila: number;
  } | null>(null);
  /** Id único para la punta de flecha del SVG del rastro: dos ventanas en la
   *  misma página no pueden compartir el mismo `id` de `<marker>`. */
  const idPuntaFlecha = `hjw-punta-flecha-${useId()}`;
  /**
   * La flecha desplegable de una validación de lista (bloque 32) abierta, con
   * dónde cae en la pantalla — `null` si ninguna lo está. Se guarda la
   * posición y no sólo la dirección porque el desplegable se pinta con un
   * `createPortal` en `document.body` (la celda tiene `overflow: hidden` y lo
   * recortaría si viviera dentro), así que necesita una coordenada de verdad
   * y no puede apoyarse en el `position: relative` de un padre que ya no es
   * el suyo.
   */
  const [listaAbierta, setListaAbierta] = useState<{
    d: string;
    x: number;
    y: number;
    ancho: number;
    opciones: string[];
  } | null>(null);

  /**
   * El portapapeles, que **no está en el libro** y por eso vive aquí.
   *
   * Guarda un domicilio y no un contenido —`"D2:D6"`—, que es lo que permite que
   * el gesto `pegar` se pueda reproducir en una macro (nota (2) de `cinta.ts`).
   * Y guarda una segunda cosa, `corte`, porque pegar lo copiado y pegar lo
   * cortado no son la misma operación: lo primero estampa, lo segundo **muda**.
   *
   * Estaba escrito a medias desde el §47.9: el motor tenía `pegar` con su origen
   * dentro del gesto y la ventana no guardaba nada, así que Pegar nacía inerte y
   * el bloque 11 no se podía enseñar.
   */
  const [portapapeles, setPortapapeles] = useState<{
    hoja: string;
    origen: string;
    corte: boolean;
  } | null>(null);
  /**
   * La gráfica marcada y la que se está mudando de sitio.
   *
   * Las dos son estado de la VENTANA y no del libro, igual que el portapapeles y
   * por la misma razón: qué gráfica está señalada no es un dato del archivo —se
   * pierde al cerrar y a nadie le importa—, y **dónde va cayendo mientras se
   * arrastra** tampoco, porque hasta que no se suelta no ha pasado nada. Lo que
   * sí es del libro es dónde acabó, y eso viaja como gesto `moverGrafica` al
   * soltar, por el camino de siempre. Un arrastre que escribiera en el libro a
   * cada movimiento del ratón llenaría la pila de deshacer de cuarenta pasos y
   * la macro de cuarenta gestos para un solo movimiento.
   */
  const [graficaSel, setGraficaSel] = useState<string | null>(null);
  const [arrastreGrafica, setArrastreGrafica] = useState<{
    id: string;
    /** La celda donde se agarró, para que el dibujo no salte bajo el ratón. */
    agarre: { col: number; fila: number };
    /** Dónde estaba su esquina al agarrarla. */
    desde: { col: number; fila: number };
    col: number;
    fila: number;
  } | null>(null);
  /**
   * **Qué botón** tiene su panel abierto, y no si el de la lengüeta lo tiene.
   *
   * Era un booleano cuando el único desplegable era el color de la lengüeta. Al
   * llegar los tres del bloque 9 —color de letra, relleno y bordes— la salida
   * fácil era un booleano por botón, y con cuatro banderas sueltas nada impide
   * que dos paneles se abran a la vez ni que uno se quede abierto cuando se pulsa
   * otro. Con el id dentro, «abrir» es sustituir y cerrar el anterior sale gratis.
   */
  const [paleta, setPaleta] = useState<string | null>(null);
  /**
   * El panel «Importar datos» (bloque 43). No es una `paleta` más porque no
   * cabe en un `valor` de un solo campo —lleva un texto largo y un
   * separador— así que la ventana lo dispara ella misma con `ejecutarGestos`
   * en vez de pasar por `cinta.ts` (ver el botón `importar-csv` en el render
   * de la cinta, más abajo). No hace falta un tercer estado para «pidiendo
   * confirmar»: `revisar()` se pregunta en cada tecla —barato, es un archivo
   * de clase— y en cuanto contesta que ahí ya hay algo, el propio botón
   * cambia de «Importar» a «Sí, sustituir e importar»; confirmar es CÓMO se
   * arma el gesto de ese clic (con `confirmado: 1` puesto), no un paso más.
   */
  const [importando, setImportando] = useState(false);
  const [importarTexto, setImportarTexto] = useState('');
  const [importarSeparador, setImportarSeparador] = useState<'' | Separador>('');
  useEffect(() => {
    if (!importando) {
      setImportarTexto('');
      setImportarSeparador('');
    }
  }, [importando]);
  /**
   * La brocha cargada · bloque 9. **El formato entero, no el domicilio.**
   *
   * `null` es «la brocha está guardada» y `{ formato: null }` es «cargada con una
   * celda que no tenía nada puesto» — que no es lo mismo y hay que distinguirlo,
   * porque soltar una brocha vacía **limpia** el formato del destino, igual que
   * en Excel. Se guarda la pinta y no de dónde se sacó por lo mismo que el gesto
   * la lleva dentro (`argsDeFormato`): entre cargarla y soltarla el alumno puede
   * repintar la celda de origen, y lo que tiene que caer es lo que se cargó.
   */
  const [brocha, setBrocha] = useState<{ formato: Formato | null } | null>(null);
  /**
   * El botón que ya avisó y espera que se vuelva a pulsar. Es el «Aceptar» del
   * cuadro de diálogo de Excel (ver `SE_CONFIRMA` en `comandos.ts`).
   */
  const [porConfirmar, setPorConfirmar] = useState<string | null>(null);
  /** La lengüeta que se está renombrando, con lo que lleva escrito. */
  const [renombrando, setRenombrando] = useState<{ hoja: string; texto: string } | null>(null);
  /** La lengüeta que se está arrastrando para cambiarla de sitio. */
  const arrastrandoHoja = useRef<string | null>(null);

  /* ── el guion ──────────────────────────────────────────────────────────── */

  /*
   * Sin portada se entra directo, y por eso el estado nace mirando el guion. Con
   * `false` a secas, una clase sin portada no arrancaba nunca: `empezado` no
   * tenía quien lo pusiera a `true` —lo pone el botón de la portada— y con él
   * apagado el aro no se dibuja y `onTerminado` no se llama. Es decir, la clase
   * se jugaba entera, sin guía, y no puntuaba.
   */
  const [empezado, setEmpezado] = useState(!guion.portada);
  const [paso, setPaso] = useState(0);
  const [fallos, setFallos] = useState(0);
  const [tropiezos, setTropiezos] = useState(0);
  const [celebrando, setCelebrando] = useState(false);
  const [erro, setErro] = useState(false);
  const [demostrando, setDemostrando] = useState(false);
  const arranque = useRef(Date.now());
  const cobrados = useRef(new Set<string>());
  /** Si ya entró alguna vez: la portada dice «Volver» y no «Abrir». */
  const yaEntro = useRef(false);
  /**
   * La celebración, en un `ref` **además** de en el estado.
   *
   * Porque `evaluar` viaja dentro de `ejecutarGestos`, que está memoizado con
   * otras dependencias: leer `celebrando` del cierre daría el valor del render
   * en que se creó. Y lo que hay en juego no es cosmético — sin esta guarda, un
   * segundo `evaluar` durante los 900 ms de la celebración vuelve a encontrar el
   * encargo cumplido (lo está: acaba de hacerse) y programa **otro** avance, con
   * lo que el alumno se salta el encargo siguiente sin tocarlo. Con la selección
   * llamando a `evaluar` desde el 14-ago-2026, basta con hacer clic en otra
   * celda mientras se celebra.
   */
  const celebrandoRef = useRef(false);

  const pasoActual = guion.pasos[paso];
  const terminado = paso >= guion.pasos.length;

  /* ── deshacer y rehacer: una pila de libros ────────────────────────────── */

  const pila = useRef<Libro[]>([]);
  const rehacerPila = useRef<Libro[]>([]);

  const grabadora = useRef(nuevaGrabadora());

  /* ── el contexto que ve la cinta ───────────────────────────────────────── */

  /**
   * La selección **como rectángulo**, que no es lo mismo que `sel`.
   *
   * `sel` guarda dos cosas a la vez: dónde está el ancla —`(c0, f0)`, la celda
   * activa, la del marco grueso— y hasta dónde llega lo marcado. Y el ancla no
   * tiene por qué ser la esquina de arriba a la izquierda: marcando de D9 hacia
   * D4, `f0` es 8 y `f1` es 3.
   *
   * Eso dejaba **la ventana muda hacia arriba**, y salió jugando mal: todo lo que
   * recorre `f0..f1` con un `for` —la cuenta de la barra de estado, el sombreado
   * de lo marcado, las cabeceras encendidas y, por la cinta, ordenar— no daba ni
   * una vuelta si la selección venía al revés. El alumno marcaba seis importes de
   * abajo hacia arriba, no veía la suma, y no había nada que le dijera por qué.
   *
   * Se arregla aquí y no normalizando `sel`, porque normalizarlo perdería el
   * ancla —y con ella la celda activa, que es donde cae lo que se teclea—.
   * **Anotado**: `formatoAncla` (en `cinta.ts`) mira la esquina de la caja que le
   * llega, así que con una selección al revés lee la de arriba a la izquierda en
   * vez de la activa. Excel mira la activa. Es media hundida de un botón en un
   * caso raro, y cuesta un campo más en `ContextoCinta` el día que moleste.
   */
  const rango = useMemo(() => normalizar(sel), [sel]);

  /*
   * Defecto cazado el 14-ago-2026 construyendo `of-excel-consolida-y-protege`,
   * fuera de esa clase: `motor` (arriba) es la MISMA referencia entre repintados
   * a propósito —es la caché mutable del §46—, así que un `useMemo` con `motor`
   * en las dependencias nunca se volvía a calcular por sí solo. `ctx.hoja` sólo
   * se refrescaba de rebote, cuando `rango` cambiaba a la vez —que es lo que
   * pasa siempre que lo siguiente es marcar una celda—. Cambiar de hoja con la
   * lengüeta y pulsar DIRECTO un botón de la cinta —sin tocar antes una
   * celda—, como hace «Proteger hoja» en el bloque 54, dejaba `ctx.hoja`
   * apuntando a la hoja de ANTES del cambio: el botón protegía la hoja
   * equivocada y el encargo nunca se daba por bueno. Se arregla añadiendo el
   * valor —no el objeto— que de verdad importa a la lista de dependencias: la
   * regla `exhaustive-deps` no puede saber que `motor` no cambia de
   * referencia, así que ve `motor.libro.activa` como redundante cuando es
   * justo lo único que sí hace falta volver a mirar.
   */
  const ctx: ContextoCinta = useMemo(
    () => ({ motor, hoja: motor.libro.activa, sel: rango }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [motor, motor.libro.activa, rango],
  );

  /**
   * El contexto con **lo que esta ventana sabe y la cinta no**: el portapapeles.
   *
   * Hace falta en dos sitios y por eso es una función y no un valor: al pulsar el
   * botón y al **pintarlo**. Sin lo segundo, Pegar seguiría dibujándose apagado
   * después de copiar —la cinta lo declara inerte mientras no le llegue un
   * origen— y el alumno tendría delante un botón gris que sí funciona. Un botón
   * que miente sobre su propio estado es peor que uno apagado.
   */
  const ctxPara = useCallback(
    (id: string, valor?: string | number): ContextoCinta => {
      // Lo copiado en otra hoja no cuenta como copiado aquí: ver `pulsar`.
      const guardado = portapapeles?.hoja === ctx.hoja ? portapapeles : null;
      return {
        ...ctx,
        // A `cortar` no se le pasa nunca el origen, y por eso nunca se apaga: en
        // esta ventana Cortar **sólo marca** (ver `pulsar`).
        valor: valor ?? (ES_PEGAR.has(id) ? guardado?.origen : undefined),
        corte: guardado?.corte,
      };
    },
    [ctx, portapapeles],
  );

  const hojaId = motor.libro.activa;
  const direccionActiva = dir(sel.c0, sel.f0);
  const crudoActivo = motor.libro.hojas.find((h) => h.id === hojaId)?.celdas[direccionActiva]?.crudo ?? '';

  /* ── el ÚNICO camino por el que el libro cambia ────────────────────────── */

  /**
   * Devuelve si el libro cambió. `false` también cuando el programa **rechazó**
   * el gesto, que es lo que permite que la celda se quede en edición con lo que
   * el alumno escribió en vez de tragárselo.
   */
  const ejecutarGestos = useCallback(
    (gestos: Gesto[], apunta: { control?: string; pestana?: string }): boolean => {
      /*
       * Aquí NO se aplica nada: se le pide al motor que lo haga.
       *
       * La primera versión de esta función copiaba el cuerpo de `ejecutar()`
       * para poder mandar varios gestos con un solo recálculo, y al copiarlo se
       * dejó fuera `revisar()` — defecto 4 del §47.6, y una fórmula rota entraba
       * al libro—. El primer arreglo fue devolverle la guarda a la copia, que
       * era curar el síntoma: seguía habiendo dos caminos, y el siguiente que
       * copiara este bucle volvería a perder lo que se le olvidara.
       *
       * Ahora el motor sabe hacer varios (`ejecutarVarios`) y aquí sólo queda
       * lo que es de la ventana: el historial, el aviso en pantalla y el
       * corrector. **Un solo camino al libro, otra vez.**
       */
      const antes = motor.libro;
      const r = ejecutarVarios(motor, gestos, grabadora.current);

      if (!r.ok) {
        setAviso({
          titulo: 'Así no se puede guardar todavía.',
          queHace: r.aviso ? r.aviso.charAt(0).toUpperCase() + r.aviso.slice(1) : undefined,
        });
        repintar();
        return false;
      }

      if (r.cambio) {
        pila.current.push(antes);
        rehacerPila.current = [];
        setSinGuardar(true);
      }
      repintar();
      evaluar(motor.libro, apunta);
      return r.cambio;
    },
    // `evaluar` se declara abajo y no cambia de identidad entre renders porque
    // vive en un `useCallback` con las mismas dependencias que éste.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [motor, repintar, paso, guion],
  );

  /** Palomear el encargo de turno y pasar al siguiente. */
  const acertar = useCallback(() => {
    if (celebrandoRef.current) return;
    celebrandoRef.current = true;
    setCelebrando(true);
    setFallos(0);
    setErro(false);
    setAviso(null);
    window.setTimeout(() => {
      celebrandoRef.current = false;
      setCelebrando(false);
      setPaso((n) => n + 1);
    }, 900);
  }, []);

  /** ¿Este gesto cumple el encargo que estaba pedido? */
  const evaluar = useCallback(
    (libro: Libro, apunta: { control?: string; pestana?: string; celda?: string; hoja?: string }) => {
      if (celebrandoRef.current) return;
      const p = guion.pasos[paso];
      if (!p) return;
      const l = p.logro;
      const cumple =
        l.tipo === 'control'
          ? apunta.control === l.control &&
            (l.celda === undefined || apunta.celda === l.celda) &&
            (l.hoja === undefined || apunta.hoja === l.hoja)
          : l.tipo === 'pestana'
            ? apunta.pestana === l.pestana
            : l.tipo === 'documento'
              ? l.comprueba(libro)
              : false;
      if (cumple) acertar();
    },
    [acertar, guion, paso],
  );

  /**
   * Contestar una pregunta del panel.
   *
   * Estaba sin construir: la ventana le pasaba al panel un `onElegir` vacío, así
   * que un encargo de tipo `eleccion` pintaba sus botones, no hacía nada al
   * pulsarlos y dejaba la clase parada para siempre. Como `evaluar` tampoco
   * mira ese tipo, no había ninguna otra puerta por la que avanzar.
   */
  const elegir = useCallback(
    (i: number) => {
      const p = guion.pasos[paso];
      if (!p || p.logro.tipo !== 'eleccion') return;
      if (i === p.logro.correcta) {
        acertar();
        return;
      }
      setFallos((n) => n + 1);
      setErro(true);
      const marca = `${p.id}#${i}`;
      if (!cobrados.current.has(marca)) {
        cobrados.current.add(marca);
        setTropiezos((n) => n + 1);
      }
    },
    [acertar, guion, paso],
  );

  /**
   * Mover la selección **y contarlo**.
   *
   * Todo lo que cambia de sitio el cursor pasa por aquí —el clic en una celda,
   * las flechas, las cabeceras de columna y de fila, el salto del cuadro de
   * nombres— para que el maestro se entere. `comoSeHizo` sólo se pasa cuando el
   * gesto tiene nombre propio: pulsar la cabecera de la columna C selecciona el
   * rango `C1:C400`, y un encargo que pide «selecciona la columna entera» quiere
   * saber que fue por ahí y no que alguien arrastró cuatrocientas celdas.
   */
  const seleccionar = useCallback(
    (nueva: Caja, comoSeHizo?: string) => {
      setSel(nueva);
      /*
       * Marcar una celda deselecciona la gráfica, como en Excel de verdad.
       *
       * Era un defecto de nacimiento del §45.7 y estuvo invisible mientras
       * `graficaSel` sólo pintaba una clase CSS: nada leía el valor viejo, así
       * que nadie notó que pulsar una celda con una gráfica marcada la dejaba
       * marcada para siempre. Se ve en cuanto algo SÍ depende de ese estado
       * —el panel «Diseño de gráfico» de `n5-mi-primera-grafica»—: sin esta
       * línea, el panel se quedaba pegado en pantalla después de irse a
       * escribir en cualquier celda.
       */
      setGraficaSel(null);
      setAviso(null);
      evaluar(motor.libro, { control: comoSeHizo ?? nombreDeSeleccion(nueva) });
    },
    [evaluar, motor.libro],
  );

  /* ── pulsar un botón de la cinta ───────────────────────────────────────── */

  /**
   * ¿Esto es un desvío? Si lo es, se avisa y **no se toca el libro**.
   *
   * Es literalmente lo que el cliente compró en el §37: equivocarse de botón
   * tiene que enseñar dónde estaba el bueno, no dejar la hoja con un cambio que
   * nadie pidió y que el alumno no sabe deshacer.
   *
   * Vive fuera de `pulsar` porque **no todo lo que se pulsa es cinta**: las
   * lengüetas de hoja y el `+` de hoja nueva cambian el libro por su cuenta, y
   * mientras estuvieron fuera de esta guarda había una puerta abierta por la que
   * el alumno podía añadir una hoja en mitad de cualquier encargo y quedarse con
   * un libro que el maestro no le pidió. Que la guarda no cubriera dos botones
   * de los treinta no se ve nunca mirando el código de la guarda.
   */
  const esDesvioYSeAvisa = useCallback(
    (id: string): boolean => {
      const { desviado, esperado } = esDesvio(pasoActual, id);
      if (!desviado || !esperado) return false;
      // El primer tiempo de un gesto de dos no es equivocarse (ver `PRIMER_TIEMPO`).
      if (PRIMER_TIEMPO[esperado]?.has(id)) return false;
      // La tabla ENTERA, no la frase del botón pulsado: `explicarDesvio` busca
      // dentro por su cuenta y además necesita mirar el esperado.
      setAviso(explicarDesvio(cinta, id, esperado, QUE_HACE_EXCEL, DESPLEGABLES_EXCEL));
      setFallos((n) => n + 1);
      setErro(true);
      if (!cobrados.current.has(id)) {
        cobrados.current.add(id);
        setTropiezos((n) => n + 1);
      }
      return true;
    },
    [cinta, pasoActual],
  );

  const pulsar = useCallback(
    (id: string, valor?: string | number) => {
      setAviso(null);
      // La segunda pulsación de un botón que ya preguntó lleva el «Aceptar»
      // dentro, y viaja por la misma puerta que un color o un tipo de número:
      // así el gesto que sale es el mismo de siempre y la macro lo guarda entero.
      const ctxAhora = ctxPara(id, valor ?? (porConfirmar === id ? 'confirmado' : undefined));

      /*
       * «Importar datos» (bloque 43) no cabe en el molde de `PIDEN_UN_DATO`:
       * ésos abren una paleta y la segunda pulsación del MISMO botón trae el
       * dato en `valor` — aquí el «dato» es un texto largo más un separador, y
       * el segundo clic que sustituye lo que ya había no puede perder ese
       * texto por el camino sólo porque `pulsar` lo reemplaza por la palabra
       * «confirmado» (ver esa reserva, dos líneas arriba). Por eso este botón
       * vive aparte: sólo abre y cierra su panel (`importando`), y todo lo
       * demás —pegar, elegir separador, importar, confirmar una
       * sustitución— lo dispara el panel con `ejecutarGestos` directamente,
       * sin volver a pasar por `pulsar`.
       */
      if (id === 'importar-csv') {
        if (esDesvioYSeAvisa(id)) return;
        setImportando((x) => !x);
        return;
      }

      /*
       * Los que piden un dato se atienden ANTES de mirar si están inertes, y ése
       * es el orden que importa: al revés, el botón contesta «elige un color» y
       * la paleta que lo elige no se abre nunca (ver `PIDEN_UN_DATO`).
       */
      if (PIDEN_UN_DATO.has(id) && valor === undefined) {
        if (esDesvioYSeAvisa(id)) return;
        setPaleta((x) => (x === id ? null : id));
        return;
      }

      /*
       * Copiar de una hoja y pegar en otra: hoy no se puede, y **se dice**.
       *
       * `estampar` lee y escribe en la misma hoja (`comandos.ts`), así que el
       * gesto `pegar` no sabe traer nada de fuera. Sin este aviso el botón haría
       * lo peor que puede hacer un botón: algo parecido a lo que se le pidió
       * —copiarse las celdas de ESTA hoja que están en ese mismo domicilio— sin
       * que nada anunciara el cambiazo. Cuesta un comando nuevo con hoja de
       * origen y hoja de destino, y ninguna clase del grado Básico lo pide.
       */
      if (ES_PEGAR.has(id) && portapapeles && portapapeles.hoja !== ctx.hoja) {
        const suya = motor.libro.hojas.find((h) => h.id === portapapeles.hoja)?.nombre ?? 'otra';
        setAviso({
          titulo: `Lo que tienes copiado está en la hoja «${suya}».`,
          queHace:
            'Copiar en una hoja y pegar en otra todavía no se puede aquí. Vuelve a esa hoja, cópialo otra vez y pégalo dentro de ella.',
        });
        return;
      }

      if (estaInerte(ctxAhora, id, controles)) {
        const porQue = razonInerte(ctxAhora, id, controles);
        setAviso({ titulo: porQue ?? 'Eso todavía no se puede usar aquí.' });
        return;
      }

      if (esDesvioYSeAvisa(id)) return;
      setPaleta(null);

      /*
       * La brocha, primer tiempo. Es del portapapeles y va aquí al lado por lo
       * mismo: **cargarse una pinta no cambia ni una celda**, así que no puede
       * ser un gesto (§45.6 al revés). Lo que sí es un gesto es soltarla, y eso
       * lo hace `soltarBrocha` con el formato entero dentro.
       *
       * Va DESPUÉS de la guarda del desvío a propósito (defecto 5 del §47.6): la
       * brocha es un botón como los demás y pulsarla en mitad de un encargo que
       * pedía otra cosa tiene que avisar, no cargarse en silencio y quedarse
       * esperando a ensuciar la hoja en el siguiente clic.
       */
      if (id === 'copiar-formato') {
        setBrocha({ formato: celdaEn(motor.libro, ctx.hoja, rango.c0, rango.f0)?.formato ?? null });
        evaluar(motor.libro, { control: id });
        return;
      }

      // Los tres interruptores de vista viven en la ventana, no en el libro:
      // no cambian ni un dato, así que no pueden ser un gesto (§45.6 al revés,
      // y por eso se dice aquí: lo que no cambia el libro no se graba).
      if (id === 'ver-cuadricula') {
        setCuadricula((x) => !x);
        evaluar(motor.libro, { control: id });
        return;
      }

      // Lo mismo que `ver-cuadricula`, con otro botón: `mostrar-formulas`
      // tampoco cambia el libro. `SOLO_VENTANA` lo declara así en `cinta.ts`.
      if (id === 'mostrar-formulas') {
        setMostrarFormulas((x) => !x);
        evaluar(motor.libro, { control: id });
        return;
      }

      /*
       * Rastrear precedentes/dependientes (bloque 47): tampoco cambian el
       * libro —`SOLO_VENTANA` en `cinta.ts` ya lo declara así—, así que la
       * misma familia que `ver-cuadricula`. La celda de origen es la primera
       * de la selección (`rango.c0`/`rango.f0`), la misma que usa la brocha
       * dos bloques más arriba para leer el formato de donde está el cursor.
       * Volver a pulsar el MISMO botón sobre la MISMA celda apaga el rastro,
       * como cualquier interruptor; sobre otra celda, lo mueve ahí.
       */
      if (id === 'rastrear-precedentes' || id === 'rastrear-dependientes') {
        const direccion = id === 'rastrear-precedentes' ? 'precedentes' : 'dependientes';
        setRastro((r) =>
          r && r.direccion === direccion && r.hoja === ctx.hoja && r.col === rango.c0 && r.fila === rango.f0
            ? null
            : { direccion, hoja: ctx.hoja, col: rango.c0, fila: rango.f0 },
        );
        /*
         * Se manda TAMBIÉN la celda seleccionada (1-sep-2026, auditoría). El
         * rastro ya se dibujaba sobre `rango.c0`/`rango.f0`, pero al encargo
         * sólo le llegaba el nombre del botón, así que pulsarlo desde una celda
         * vacía cumplía igual que pulsarlo sobre la fórmula que hay que
         * remontar. Los encargos que no dependen de dónde estás no declaran
         * `celda` y se comportan exactamente igual que antes.
         */
        evaluar(motor.libro, { control: id, celda: dir(rango.c0, rango.f0), hoja: ctx.hoja });
        return;
      }

      /*
       * El portapapeles, que tampoco es un gesto: guardarse un domicilio no
       * cambia ni una celda. **Los dos marcan y ninguno mueve**, que es lo que
       * hace Excel: se corta, y hasta que no se pega no se ha movido nada.
       *
       * `cinta.ts` deja una segunda puerta —Cortar con un origen ya guardado
       * emite la mudanza— y esta ventana **no la usa**, a propósito: si la
       * segunda pulsación mudara, el alumno que se arrepiente del corte y marca
       * otra cosa movería datos sin haberlo pedido. El gesto que muda es el
       * mismo (`moverDatos`) y lo emite Pegar, que es por donde se muda de
       * verdad.
       */
      if (id === 'copiar' || id === 'cortar') {
        setPortapapeles({ hoja: ctx.hoja, origen: textoDeCaja(rango), corte: id === 'cortar' });
        evaluar(motor.libro, { control: id });
        return;
      }

      const gestos = gestosDe(ctxAhora, id, controles);
      if (!gestos || gestos.length === 0) {
        // Un botón que existe, no está inerte y hoy no hace nada: se dice.
        evaluar(motor.libro, { control: id });
        return;
      }

      /*
       * El cuadro de diálogo de Excel, en dos pulsaciones.
       *
       * Casi todo lo que `revisar` contesta es un portazo —una fórmula que no se
       * entiende no entra al libro—, pero combinar celdas **pregunta**: avisa de
       * que se va a perder lo que hay en las demás y deja decidir. Vestir esa
       * pregunta de error diría «así no se puede», que es mentira: sí se puede, y
       * es justo lo que el botón hace.
       *
       * Se distingue por `SE_CONFIRMA`, que es un dato del motor, y no leyendo el
       * texto del aviso: el texto es una cadena y cambia el día que alguien la
       * mejore. La segunda pulsación pasa por aquí con `porConfirmar` puesto, la
       * cinta le añade `confirmado: 1` al gesto y el motor lo deja pasar.
       */
      const pregunta = gestos.some((g) => SE_CONFIRMA.has(g.comando))
        ? gestos.map((g) => revisar(motor.libro, g)).find(Boolean)
        : undefined;
      if (pregunta && porConfirmar !== id) {
        setPorConfirmar(id);
        setAviso({
          titulo: `${pregunta.charAt(0).toUpperCase()}${pregunta.slice(1)}.`,
          queHace: 'Si no querías perderlo, deshaz con Ctrl+Z después o cópialo antes a otro sitio.',
        });
        return;
      }
      setPorConfirmar(null);

      const cambio = ejecutarGestos(gestos, { control: id });
      // Lo cortado se suelta UNA sola vez: en cuanto se muda, el portapapeles se
      // vacía. Sin esto, un segundo Pegar traería lo que ya no está en el origen
      // —o sea, celdas vacías— encima de datos buenos.
      if (cambio && portapapeles?.corte && id === 'pegar') setPortapapeles(null);
    },
    [
      controles,
      ctx,
      ctxPara,
      ejecutarGestos,
      esDesvioYSeAvisa,
      evaluar,
      motor.libro,
      porConfirmar,
      portapapeles,
      rango,
    ],
  );

  /**
   * Soltar la brocha sobre lo que se acaba de marcar. El segundo tiempo.
   *
   * Tres cosas que hay que leer juntas, y son las mismas tres del cuadrito de
   * relleno porque son el mismo tipo de herramienta —una que se usa arrastrando
   * y no pulsando—:
   *
   * **(1) Emite un gesto y pasa por `ejecutarGestos`**, así que queda grabada en
   * la macro y se deshace con Ctrl+Z como cualquier botón.
   *
   * **(2) Pasa por la MISMA guarda del desvío** (defecto 5 del §47.6): soltar la
   * brocha en mitad de un encargo que pedía otra cosa avisa y **no toca el
   * libro**. Por eso se descarga la brocha antes de la guarda: se equivoque o
   * no, el segundo tiempo se consumió, que es lo que hace Excel.
   *
   * **(3) Lleva el formato ENTERO, no sólo lo que está puesto** (`argsDeFormato`).
   * La brocha de Excel sustituye la pinta del destino; una que sólo supiera
   * añadir dejaría en negrita la celda que se pintó con una brocha sin negrita.
   */
  const soltarBrocha = useCallback(
    (destino: Caja): void => {
      if (!brocha) return;
      setBrocha(null);
      if (esDesvioYSeAvisa('copiar-formato')) return;
      ejecutarGestos(
        [
          {
            comando: 'formato',
            args: { hoja: ctx.hoja, rango: textoDeCaja(destino), ...argsDeFormato(brocha.formato) },
          },
        ],
        { control: 'copiar-formato' },
      );
    },
    [brocha, ctx.hoja, ejecutarGestos, esDesvioYSeAvisa],
  );

  const irAPestana = useCallback(
    (id: PestanaExcel) => {
      setPestanaId(id);
      setAviso(null);
      evaluar(motor.libro, { pestana: id });
    },
    [evaluar, motor.libro],
  );

  /*
   * Deshacer y rehacer **también se evalúan**. Parece de sentido común y no lo
   * era: un encargo que se corrige leyendo el libro —«déjalo como estaba»,
   * «quítale la fila que sobraba»— se puede cumplir deshaciendo, y sin esta
   * línea el libro quedaba correcto y el maestro seguía pidiéndolo.
   */
  const deshacer = useCallback(() => {
    const previo = pila.current.pop();
    if (!previo) return;
    rehacerPila.current.push(motor.libro);
    conLibro(motor, previo, 'todo');
    setEditando(null);
    setEnLaBarra(false);
    repintar();
    evaluar(previo, { control: 'deshacer' });
  }, [evaluar, motor, repintar]);

  const rehacer = useCallback(() => {
    const siguiente = rehacerPila.current.pop();
    if (!siguiente) return;
    pila.current.push(motor.libro);
    conLibro(motor, siguiente, 'todo');
    setEditando(null);
    setEnLaBarra(false);
    repintar();
    evaluar(siguiente, { control: 'rehacer' });
  }, [evaluar, motor, repintar]);

  /* ── escribir en una celda ─────────────────────────────────────────────── */

  const confirmarCelda = useCallback(
    (texto: string, dFila: number, dCol: number) => {
      /*
       * `escribir` entró a `SE_CONFIRMA` con el paquete VALIDACIÓN (bloques 32
       * y 39, `of-excel-validacion`), pero sólo A VECES pregunta: cuando la
       * celda tiene puesta una regla «Advertencia» (`bloquea: false`) y lo
       * escrito la viola (`comandos.ts`, el `revisar` de `escribir`). La
       * primera vez `revisar` avisa y no deja pasar; con la MISMA celda y el
       * MISMO texto una segunda vez, se manda con `confirmado: 1` y
       * `escribir` lo deja pasar — la coreografía de dos pulsaciones que
       * `pulsar`, aquí arriba, ya usa para los botones de la cinta
       * (`combinarCeldas` y el resto de `SE_CONFIRMA`).
       *
       * Sin este escape una regla «Advertencia» avisaba para siempre y se
       * comportaba exactamente como «Detener»: nadie la había escrito
       * tecleando dentro de una celda hasta esta clase —`pulsar` sí tenía la
       * coreografía, pero teclear en una celda no pasa por `pulsar`, pasa por
       * aquí—. Es inofensivo para todo lo que `revisar` rechaza por otro
       * motivo —una fórmula que no se entiende, una validación «Detener»—:
       * ésas ignoran `confirmado` en `escribir` y siguen rechazando pase lo
       * que pase, así que repetir el mismo texto dos veces no las cuela.
       */
      const marca = `${direccionActiva}:${texto}`;
      const confirmando = porConfirmar === marca;
      const gesto: Gesto = {
        comando: 'escribir',
        args: { hoja: hojaId, celda: direccionActiva, crudo: texto, ...(confirmando ? { confirmado: 1 } : {}) },
      };
      // Si el programa lo rechaza, la celda **se queda en edición con lo
      // escrito**: cerrarla tirando el texto es la manera más rápida de que un
      // alumno pierda un renglón entero y no sepa qué hizo mal.
      if (revisar(motor.libro, gesto)) {
        setPorConfirmar(marca);
        ejecutarGestos([gesto], {});
        return;
      }
      setPorConfirmar(null);
      setEditando(null);
      setEnLaBarra(false);
      ejecutarGestos([gesto], {});
      if (dFila || dCol) {
        const hoja = motor.libro.hojas.find((h) => h.id === hojaId);
        seleccionar(
          cajaDeUna(
            Math.max(0, Math.min(COLS_HOJA - 1, sel.c0 + dCol)),
            filaTrasDesplazamiento(hoja, sel.f0, dFila),
          ),
        );
      }
    },
    [direccionActiva, ejecutarGestos, hojaId, motor.libro, porConfirmar, sel.c0, sel.f0, seleccionar],
  );

  const mover = useCallback(
    (dCol: number, dFila: number, estirando: boolean) => {
      const col = Math.max(0, Math.min(COLS_HOJA - 1, (estirando ? sel.c1 : sel.c0) + dCol));
      const hoja = motor.libro.hojas.find((h) => h.id === hojaId);
      const fila = filaTrasDesplazamiento(hoja, estirando ? sel.f1 : sel.f0, dFila);
      seleccionar(estirando ? { ...sel, c1: col, f1: fila } : cajaDeUna(col, fila));
    },
    [sel, seleccionar, motor.libro, hojaId],
  );

  /**
   * `Ctrl`+flecha: el salto al borde del bloque de datos, como en Excel.
   *
   * Es la mitad del bloque 4 del temario y no se puede enseñar con palabras: en
   * una lista de nueve renglones no se nota, y el día que el alumno tenga
   * ochocientos es lo único que le salva la muñeca. Las tres reglas son las de
   * Excel: de un dato con vecino, hasta el último dato seguido; de un dato con
   * hueco al lado, hasta el siguiente dato; y de un hueco, hasta el siguiente
   * dato. Si no hay ninguno, hasta el borde de la hoja.
   */
  const saltoDeBloque = useCallback(
    (dCol: number, dFila: number): { col: number; fila: number } => {
      const hoja = motor.libro.hojas.find((h) => h.id === hojaId);
      const ocupada = (c: number, f: number) => Boolean(hoja?.celdas[dir(c, f)]?.crudo);
      const dentro = (c: number, f: number) => c >= 0 && c < COLS_HOJA && f >= 0 && f < FILAS_HOJA;
      let col = sel.c0;
      let fila = sel.f0;
      if (!dentro(col + dCol, fila + dFila)) return { col, fila };
      const seguido = ocupada(col, fila) && ocupada(col + dCol, fila + dFila);
      while (dentro(col + dCol, fila + dFila)) {
        col += dCol;
        fila += dFila;
        if (seguido) {
          if (!ocupada(col + dCol, fila + dFila)) break;
        } else if (ocupada(col, fila)) break;
      }
      return { col, fila };
    },
    [hojaId, motor.libro.hojas, sel.c0, sel.f0],
  );

  /* ── el cuadrito de relleno · el bloque 8 por su puerta de verdad ───────── */

  /**
   * Hasta dónde se ha arrastrado el tirador. `null` = nadie lo tiene agarrado.
   *
   * `desde` es lo que había marcado al agarrarlo y no se toca en todo el
   * arrastre: la semilla del relleno es lo que el alumno ya había escrito, y si
   * se recalculara a cada movimiento del ratón la semilla iría creciendo con la
   * estela y la serie saldría de otra cosa.
   */
  const [arrastre, setArrastre] = useState<{ desde: Caja; hasta: Caja } | null>(null);

  /**
   * Qué celda hay debajo del ratón. **Una división entera**, no una búsqueda.
   *
   * Es «cuadricular, no medir» (§39) cobrado: el alto de fila y el ancho de
   * columna son constantes, así que de la posición del ratón a la celda se llega
   * con dos divisiones y sin recorrer el DOM ni pedirle su caja a nadie. Lo único
   * que se mide es dónde empieza la rejilla, que es un solo rectángulo.
   *
   * **La división entera da el PUESTO en pantalla, no la fila.** Con una tabla
   * filtrada (paquete TABLAS, bloques 33-36) la fila 7 puede pintarse en el
   * tercer renglón visible; `filaEnPuesto` es la traducción de vuelta —un
   * acceso a un array, no una búsqueda—, y es la que hace que un clic
   * seleccione la celda que se VE y no la que estaría ahí sin filtrar. Sin
   * `visibles` (el caso de siempre) es la identidad de toda la vida.
   */
  const celdaBajoElRaton = useCallback(
    (e: MouseEvent): { col: number; fila: number } => {
      const caja = rejilla.current;
      const r = caja?.getBoundingClientRect();
      const x = e.clientX - (r?.left ?? 0) + (caja?.scrollLeft ?? 0) - ANCHO_CAB;
      const y = e.clientY - (r?.top ?? 0) + (caja?.scrollTop ?? 0) - ALTO_CAB;
      const hoja = motor.libro.hojas.find((h) => h.id === hojaId);
      const puesto = Math.max(0, Math.min(FILAS_HOJA - 1, Math.floor(y / ALTO_FILA)));
      const fila = hoja ? filaEnPuesto(hoja, puesto) : puesto;
      return {
        col: Math.max(0, Math.min(COLS_HOJA - 1, Math.floor(x / ANCHO_COL))),
        // -1 = ya no queda ninguna fila visible en ese puesto (fin de la lista
        // filtrada): se queda en el último puesto pedido en vez de romper la
        // selección con una fila negativa.
        fila: fila >= 0 ? fila : puesto,
      };
    },
    [hojaId, motor.libro],
  );

  /**
   * La estela: la caja de partida estirada hasta donde está el ratón.
   *
   * **Sólo por un lado a la vez**, como en Excel: gana el eje por el que se ha
   * arrastrado más. Un relleno en diagonal no significa nada —¿qué serie sería?—
   * y dejarlo estirar en dos direcciones haría que un temblor de la mano
   * cambiara lo que se está a punto de escribir.
   */
  const estirar = useCallback((base: Caja, col: number, fila: number): Caja => {
    const dCol = Math.max(0, col - base.c1);
    const dFila = Math.max(0, fila - base.f1);
    if (dCol === 0 && dFila === 0) return base;
    return dFila >= dCol ? { ...base, f1: base.f1 + dFila } : { ...base, c1: base.c1 + dCol };
  }, []);

  /**
   * Soltar el tirador.
   *
   * Tres cosas que hay que leer juntas:
   *
   * **(1) Emite el gesto de la cinta, no uno propio.** El botón «Rellenar la
   * serie» y este cuadrito son la misma herramienta por dos puertas —como los dos
   * de orden, que viven en Inicio y en Datos—, así que el gesto se le pide a
   * `cinta.ts` con la selección ya estirada. De ahí sale gratis lo del §45.6:
   * **un arrastre queda grabado en una macro sin una línea más**, porque pasa por
   * `ejecutarGestos` igual que un botón.
   *
   * **(2) Pasa por la MISMA guarda del desvío.** Es el defecto 5 del §47.6 —el
   * `+` de hoja nueva y las lengüetas se saltaban la guarda porque cambiaban el
   * libro por su cuenta— y no se repite: arrastrar en mitad de un encargo que
   * pedía otra cosa avisa y **no toca el libro**.
   *
   * **(3) `Ctrl` copia en vez de continuar.** Sin Ctrl sale `rellenarSerie`, que
   * es lo que el alumno espera: con `101` y `102` marcados salen `103, 104,
   * 105…`, y con una sola semilla se copia —no se adivina— porque ésa es la regla
   * de Excel que `serieDesde` respeta. Con Ctrl sale `rellenarAbajo` (o
   * `rellenarDerecha`), que copia y punto. En Excel de verdad Ctrl **invierte**
   * las dos: fuerza la cuenta cuando la semilla es un número suelto y fuerza la
   * copia cuando habría serie. Aquí sólo se construye la segunda mitad, y es a
   * propósito: la primera obligaría a que la ventana le dijera a `serieDesde`
   * «cuenta igual», o sea a deshacer desde la interfaz una regla que el motor
   * tomó a conciencia. La mitad que falta queda anotada aquí, que es donde se
   * buscará. **Y una reserva más chica**: con dos filas de semilla, `rellenarAbajo`
   * copia sólo la primera —lo dice su propio comando—, mientras que Excel repite
   * el bloque entero en mosaico.
   */
  const soltarTirador = useCallback(
    (desde: Caja, hasta: Caja, conCtrl: boolean) => {
      const abajo = hasta.f1 > desde.f1;
      // Se soltó sin haber salido de lo marcado: no ha pasado nada.
      if (!abajo && hasta.c1 <= desde.c1) return;
      setAviso(null);
      if (esDesvioYSeAvisa('tirador')) return;

      const id = conCtrl ? (abajo ? 'rellenar-abajo' : 'rellenar-derecha') : 'rellenar-serie';
      // La dirección viaja: el que arrastró sabe hacia dónde, y la forma de la
      // caja no siempre lo dice (ver la nota de `rellenar-serie` en `cinta.ts`).
      const ctxTirador: ContextoCinta = { ...ctx, sel: hasta, valor: abajo ? 'abajo' : 'derecha' };
      if (estaInerte(ctxTirador, id, controles)) {
        setAviso({ titulo: razonInerte(ctxTirador, id, controles) ?? 'Aquí no hay nada que rellenar.' });
        return;
      }
      setSel(hasta);
      const gestos = gestosDe(ctxTirador, id, controles);
      if (gestos) ejecutarGestos(gestos, { control: 'tirador' });
      else evaluar(motor.libro, { control: 'tirador' });
    },
    [controles, ctx, ejecutarGestos, esDesvioYSeAvisa, evaluar, motor.libro],
  );

  /*
   * El ratón se sigue en la VENTANA y no en la rejilla: quien arrastra hasta la
   * fila 40 se sale de la cuadrícula por abajo antes de soltar, y con los
   * oyentes puestos en la rejilla el arrastre se quedaría colgado —sin soltar y
   * sin cancelar— con la estela pintada para siempre.
   */
  useEffect(() => {
    if (!arrastre) return undefined;
    const enMovimiento = (e: MouseEvent) => {
      const p = celdaBajoElRaton(e);
      setArrastre((a) => (a ? { ...a, hasta: estirar(a.desde, p.col, p.fila) } : a));
    };
    const alSoltar = (e: MouseEvent) => {
      const p = celdaBajoElRaton(e);
      setArrastre(null);
      // `ctrlKey` se lee AL SOLTAR, como Excel: se puede empezar a arrastrar y
      // decidir a mitad de camino que lo que se quería era copiar.
      soltarTirador(arrastre.desde, estirar(arrastre.desde, p.col, p.fila), e.ctrlKey || e.metaKey);
    };
    window.addEventListener('mousemove', enMovimiento);
    window.addEventListener('mouseup', alSoltar);
    return () => {
      window.removeEventListener('mousemove', enMovimiento);
      window.removeEventListener('mouseup', alSoltar);
    };
  }, [arrastre, celdaBajoElRaton, estirar, soltarTirador]);

  /*
   * ── Mudar una gráfica de sitio ─────────────────────────────────────────
   *
   * El mismo patrón que el tirador —el ratón se sigue en la VENTANA, no en la
   * rejilla— y por el mismo motivo: quien arrastra una gráfica se sale de la
   * cuadrícula antes de soltar más veces de las que se cree.
   *
   * Lo que se mueve es la **esquina**, contada en celdas y no en píxeles (§39):
   * de la posición del ratón a la celda se llega con una división entera, y de
   * ahí sale un `moverGrafica` con `col` y `fila`. Sin agarre —sin restar dónde
   * se pinchó dentro del dibujo— la gráfica daría un salto al empezar a
   * arrastrarla, que es el defecto clásico de todo lo que se arrastra.
   *
   * Y pasa por la **misma guarda del desvío** que la cinta y que las lengüetas:
   * mover una gráfica cambia el libro, así que en mitad de un encargo que pide
   * otra cosa tiene que avisar y no tocar nada (§37).
   */
  useEffect(() => {
    if (!arrastreGrafica) return undefined;
    const suEsquina = (e: MouseEvent): { col: number; fila: number } => {
      const p = celdaBajoElRaton(e);
      return {
        col: Math.max(0, arrastreGrafica.desde.col + (p.col - arrastreGrafica.agarre.col)),
        fila: Math.max(0, arrastreGrafica.desde.fila + (p.fila - arrastreGrafica.agarre.fila)),
      };
    };
    const enMovimiento = (e: MouseEvent) => {
      const donde = suEsquina(e);
      setArrastreGrafica((a) => (a ? { ...a, ...donde } : a));
    };
    const alSoltar = (e: MouseEvent) => {
      const donde = suEsquina(e);
      const { id, desde } = arrastreGrafica;
      setArrastreGrafica(null);
      // Un clic para seleccionarla es un arrastre de cero celdas: no cambia el
      // libro, no se graba y no cuenta como desvío.
      if (donde.col === desde.col && donde.fila === desde.fila) return;
      setAviso(null);
      if (esDesvioYSeAvisa(`grafica:${id}`)) return;
      ejecutarGestos([{ comando: 'moverGrafica', args: { hoja: hojaId, id, ...donde } }], {
        control: `grafica:${id}`,
      });
    };
    window.addEventListener('mousemove', enMovimiento);
    window.addEventListener('mouseup', alSoltar);
    return () => {
      window.removeEventListener('mousemove', enMovimiento);
      window.removeEventListener('mouseup', alSoltar);
    };
  }, [arrastreGrafica, celdaBajoElRaton, ejecutarGestos, esDesvioYSeAvisa, hojaId]);

  /*
   * ── El panel «Diseño de gráfico» · bloque 18 ────────────────────────────
   *
   * `cambiarGrafica` estaba construido y probado desde el §45.5 —título, ejes,
   * leyenda, rótulos de dato y hasta el rango de datos— y, como `nombrarRango`
   * antes que él, **no tenía por dónde entrar**: ni un botón, ni un cuadro.
   * Aquí se abre la única puerta que le faltaba.
   *
   * Que el rango de datos (`campo: 'datos'`) se pueda tocar desde aquí es lo
   * que permite que «arreglar una selección mala» sea EDITAR la gráfica —y no
   * borrarla y volver a hacerla—: la misma barra que salía gigante encoge en
   * cuanto el rango deja fuera el total, sin que la gráfica deje de ser la
   * misma gráfica. Es el bloque 17 —una gráfica es una vista de un rango— con
   * otra cara.
   *
   * **Sin la guarda del desvío**, y a propósito: es un panel de CAMPOS y no un
   * botón con una sola respuesta correcta, así que viaja con la misma regla
   * que ya tenían «Encabezado» y «Pie» en el Backstage —`gesto()`, sin pasar
   * por `esDesvioYSeAvisa`—. La guarda sólo puede nombrar UN control esperado
   * por paso, y el encargo del bloque 18 que pide los dos ejes y la leyenda
   * toca TRES campos en el mismo paso: con la guarda puesta, el primero que
   * tocara el alumno habría dejado a los otros dos marcados como «botón
   * equivocado» y sin aplicarse. Se encontró escribiendo el guion de la
   * primera clase que usa este panel, antes de que llegara a suspender a
   * nadie.
   */
  const cambiarCampoDeGrafica = useCallback(
    (id: string, campo: string, valor: string | number, control: string) => {
      setAviso(null);
      ejecutarGestos([{ comando: 'cambiarGrafica', args: { hoja: hojaId, id, campo, valor } }], { control });
    },
    [ejecutarGestos, hojaId],
  );

  /*
   * ── El panel «Importar datos» · bloque 43 ───────────────────────────────
   *
   * `importar-csv` estaba construido y probado desde el §45.5 —`leerCsv`
   * detecta el separador, arma el parte, y el comando escribe la tabla— y no
   * tenía por dónde entrar: ni un botón, ni un cuadro. Es la misma familia de
   * defecto que `nombrarRango` antes del bloque 22 y que `cambiarGrafica`
   * antes de `n5-mi-primera-grafica`.
   *
   * `celdaAnclaImportar`/`parteImportar`/`gestoImportar`/`avisoChoqueImportar`
   * se recalculan en cada tecla y no con un `useMemo`: es un archivo de
   * clase, no una hoja de mil filas, y `leerCsv` recorre el texto una vez por
   * candidato de separador. Medirlo sería medir el ruido, la misma frase que
   * ya se escribió en `datos.ts` para lo mismo.
   *
   * `avisoChoqueImportar` es literalmente lo que contestaría `revisar()` si
   * el gesto se mandara ahora mismo SIN `confirmado` — así que el panel no
   * inventa su propia versión de la regla del bloque 43: le pregunta al
   * mismo sitio que va a decidir de verdad cuando se pulse el botón.
   */
  const celdaAnclaImportar = rango.c0 === rango.c1 && rango.f0 === rango.f1 ? dir(rango.c0, rango.f0) : null;
  const parteImportar = importarTexto.trim() ? leerCsv(importarTexto, importarSeparador || undefined).parte : null;
  // En un `useMemo` y no suelto como los dos de arriba: éste es el único de
  // los tres que otro Hook (`importarDatos`, dos líneas abajo) lleva en su
  // lista de dependencias, y un objeto literal nuevo en cada tecla le habría
  // fabricado una función nueva en cada tecla también — el dato en sí sigue
  // recalculándose sin medirse, que es lo que dice el comentario de arriba.
  const gestoImportar: Gesto | null = useMemo(
    () =>
      celdaAnclaImportar && importarTexto.trim() && !parteImportar?.comillaSinCerrar
        ? {
            comando: 'importar-csv',
            args: {
              hoja: hojaId,
              celda: celdaAnclaImportar,
              texto: importarTexto,
              ...(importarSeparador ? { separador: importarSeparador } : {}),
            },
          }
        : null,
    [celdaAnclaImportar, hojaId, importarSeparador, importarTexto, parteImportar?.comillaSinCerrar],
  );
  const avisoChoqueImportar = gestoImportar ? revisar(motor.libro, gestoImportar) : null;

  /**
   * El clic de «Importar» o de «Sí, sustituir e importar». Sin la guarda del
   * desvío, por lo mismo que ya razonó el panel «Diseño de gráfico»: abrir el
   * panel ya pasó por `esDesvioYSeAvisa` (en `pulsar`, al pulsar el botón de
   * la cinta), y lo de aquí dentro son los campos de UN mismo control.
   */
  const importarDatos = useCallback(
    (confirmar: boolean) => {
      if (!gestoImportar) return;
      const g: Gesto = confirmar
        ? { ...gestoImportar, args: { ...gestoImportar.args, confirmado: 1 } }
        : gestoImportar;
      const cambio = ejecutarGestos([g], { control: 'importar-csv' });
      if (cambio) setImportando(false);
    },
    [ejecutarGestos, gestoImportar],
  );

  /* ── renombrar una hoja · bloque 16 ─────────────────────────────────────── */

  /**
   * Confirmar el nombre nuevo de una lengüeta.
   *
   * No hay botón de cinta para esto y no lo hay en Excel tampoco: se renombra
   * **con doble clic en la lengüeta**, que es el gesto que el alumno va a usar el
   * resto de su vida. La ventana emite el gesto `renombrarHoja` y el motor decide
   * si lo acepta —desde el 15-ago-2026 rechaza el nombre vacío y el repetido—.
   */
  const confirmarNombre = useCallback(() => {
    const r = renombrando;
    if (!r) return;
    setRenombrando(null);
    const nombre = r.texto.trim();
    const antes = motor.libro.hojas.find((h) => h.id === r.hoja)?.nombre ?? '';
    if (!nombre || nombre === antes) return;
    ejecutarGestos([{ comando: 'renombrarHoja', args: { hoja: r.hoja, nombre } }], {
      control: `hoja:${r.hoja}`,
    });
  }, [ejecutarGestos, motor.libro.hojas, renombrando]);

  const alTeclado = useCallback(
    (e: React.KeyboardEvent) => {
      if (editando !== null) return;
      /*
       * Los atajos del portapapeles y del deshacer, que en una hoja de cálculo se
       * usan mil veces más que sus botones. Van por `pulsar`, o sea que heredan
       * TODO: lo inerte, la guarda del desvío, la evaluación del encargo y la
       * grabadora. Un Ctrl+V que tocara el libro por su cuenta sería una puerta
       * más por la que ensuciar un documento en mitad de un encargo (defecto 5
       * del §47.6), y aquí no hay ninguna.
       */
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.length === 1) {
        const k = e.key.toLowerCase();
        if (k === 'c' || k === 'x' || k === 'v') {
          e.preventDefault();
          pulsar(k === 'c' ? 'copiar' : k === 'x' ? 'cortar' : 'pegar');
          return;
        }
        if (k === 'z') {
          e.preventDefault();
          deshacer();
          return;
        }
        if (k === 'y') {
          e.preventDefault();
          rehacer();
          return;
        }
      }
      const paso1 = (dCol: number, dFila: number) => {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          const { col, fila } = saltoDeBloque(dCol, dFila);
          /*
           * **Ctrl+Shift estira SÓLO en la dirección que se pulsó.**
           *
           * Defecto cazado el 17-ago-2026 preparando `of-excel-tabla-dinamica`,
           * y no es de esa clase: aquí decía `{ ...sel, c1: col, f1: fila }`, o
           * sea que los dos extremos se reescribían aunque el salto fuera de
           * uno solo. La consecuencia es la manera en que TODO EL MUNDO marca
           * una lista larga en Excel —Ctrl+Shift+↓ y después Ctrl+Shift+→—:
           * `saltoDeBloque(1, 0)` devuelve la fila de partida, con lo que el
           * segundo atajo aplastaba las trescientas filas recién marcadas y
           * dejaba una sola. No lo cazó nadie porque ninguna clase construida
           * hasta hoy marca un rango con el teclado.
           */
          seleccionar(
            e.shiftKey ? { ...sel, c1: dCol ? col : sel.c1, f1: dFila ? fila : sel.f1 } : cajaDeUna(col, fila),
          );
          return;
        }
        mover(dCol, dFila, e.shiftKey);
      };
      switch (e.key) {
        case 'ArrowUp':
          return paso1(0, -1);
        case 'ArrowDown':
        case 'Enter':
          return paso1(0, 1);
        case 'ArrowLeft':
          return paso1(-1, 0);
        case 'ArrowRight':
        case 'Tab':
          return paso1(1, 0);
        case 'F2':
          e.preventDefault();
          setEnLaBarra(false);
          return setEditando(crudoActivo);
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          return pulsar('borrar-contenido');
        case 'Escape':
          return setAviso(null);
        default:
          break;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setEnLaBarra(false);
        setEditando(e.key);
      }
    },
    [crudoActivo, deshacer, editando, mover, pulsar, rehacer, saltoDeBloque, sel, seleccionar],
  );

  /* ── el modo guía: dónde está el aro ───────────────────────────────────── */

  const pestanaActual = cinta.find((p) => p.id === pestanaId) ?? cinta[1] ?? cinta[0];

  const selector = useMemo(() => {
    const senal = pasoActual?.senal;
    if (!senal || celebrando || !empezado) return null;
    if (senal.control) {
      // El primero de la lista cuando el encargo pide varios botones: ver
      // `primeroDeLaSenal`, arriba, y el defecto que arregla.
      const control = primeroDeLaSenal(senal.control);
      const fuera = FUERA_DE_LA_CINTA[control];
      if (fuera) return fuera.donde;
      const partido = partirSenal(control);
      if (partido) {
        const [que, dato] = partido;
        // Un rango se señala por su primera celda: un aro alrededor de las
        // veinte de `B4:D9` taparía justo lo que hay que mirar.
        if (que === 'celda') return `[data-celda="${dato}"]`;
        if (que === 'rango') return `[data-celda="${dato.split(':')[0]}"]`;
        if (que === 'columna') return `[data-columna="${dato}"]`;
        if (que === 'fila') return `[data-fila="${dato}"]`;
        if (que === 'hoja') return `[data-hoja="${dato}"]`;
      }
      // Si el botón vive en otra pestaña, primero se señala la pestaña: un aro
      // sobre un botón que no está en pantalla no guía, despista (§43).
      const donde = ubicar(cinta, control, DESPLEGABLES_EXCEL);
      if (donde && donde.pestanaId !== pestanaId) return `[data-pestana="${donde.pestanaId}"]`;
      return `[data-control="${control}"]`;
    }
    if (senal.pestana) return `[data-pestana="${senal.pestana}"]`;
    if (senal.grupo) return `[data-grupo="${senal.grupo}"]`;
    return null;
  }, [cinta, celebrando, empezado, pasoActual, pestanaId]);

  /*
   * La `revisión` es la lista de cosas que, al cambiar, mueven de sitio lo que
   * el aro señala. Si falta una, el aro se queda donde estaba y apunta a nada.
   * Las de Excel no son las de PowerPoint: aquí mueven la celda activa, la hoja
   * y el desplazamiento de la rejilla.
   */
  /*
   * `textoDeCaja(rango)` y no `direccionActiva`: hay objetivos que cuelgan del
   * FINAL de lo marcado y no de su ancla —el cuadrito de relleno vive en la
   * esquina de abajo a la derecha—, así que estirando la selección con Shift el
   * aro se quedaba en el sitio de antes. La celda activa no había cambiado y la
   * revisión tampoco.
   */
  const revision = `${paso}|${fallos >= 2}|${pestanaId}|${hueco ? 1 : 0}|${empezado}|${hojaId}|${textoDeCaja(rango)}|${desplazado.top}|${desplazado.left}`;
  const cajaHalo = useCajaDelObjetivo(raiz, selector, revision, '.txtw-cinta');

  /**
   * El domicilio de lo que se señala, **venga de donde venga**.
   *
   * Tres orígenes y no uno: la cinta (`ubicar`), las partes de la ventana y los
   * sitios de la hoja. Los dos últimos no estaban, y sin ellos el panel se
   * quedaba sin ficha en todo encargo que no fuera un botón — que en esta clase
   * son la mitad.
   */
  const guiado: { sitio: Ubicacion<string>; queHace?: string } | null = useMemo(() => {
    const senalado = pasoActual?.senal?.control;
    if (!senalado) {
      const p = pasoActual?.senal?.pestana;
      if (!p) return null;
      const sitio = ubicarPestana(cinta, p);
      return sitio ? { sitio, queHace: QUE_HACE_PESTANA_EXCEL[p] } : null;
    }
    // La ficha es la del primero cuando el encargo pide varios botones, igual
    // que el aro (`primeroDeLaSenal`): sin esto no había ficha ninguna.
    const c = primeroDeLaSenal(senalado);

    const fuera = FUERA_DE_LA_CINTA[c];
    if (fuera) {
      return {
        sitio: {
          pestanaId: 'inicio',
          pestana: 'Tecnia Hojas',
          grupo: 'La ventana',
          etiqueta: fuera.etiqueta,
          glifo: fuera.glifo,
        },
        queHace: QUE_HACE_EXCEL[c],
      };
    }

    const partido = partirSenal(c);
    const sitioHoja = partido ? SITIOS_DE_LA_HOJA[partido[0]] : undefined;
    if (partido && sitioHoja) {
      /*
       * Una hoja se señala por su `id` —`hoja:h3`, que es lo que hay en el DOM—
       * pero se le dice al alumno por su NOMBRE. El rótulo decía «La hoja h3», y
       * `h3` es un identificador que no aparece por ninguna parte de su pantalla:
       * el aro señalaba una lengüeta que dice «Pagos» y el letrero de al lado la
       * llamaba de otra manera. Se vio en la clase que renombra hojas, donde el
       * nombre cambia a mitad de encargo.
       */
      const dato =
        partido[0] === 'hoja'
          ? (motor.libro.hojas.find((h) => h.id === partido[1])?.nombre ?? partido[1])
          : partido[1];
      return {
        sitio: {
          pestanaId: 'inicio',
          pestana: 'Tecnia Hojas',
          grupo: 'La hoja',
          etiqueta: sitioHoja.rotulo(dato),
          glifo: sitioHoja.glifo,
        },
        queHace: QUE_HACE_EXCEL[sitioHoja.explica],
      };
    }

    const sitio = ubicar(cinta, c, DESPLEGABLES_EXCEL);
    return sitio ? { sitio, queHace: QUE_HACE_EXCEL[c] } : null;
  }, [cinta, motor.libro.hojas, pasoActual]);

  const sitioGuia = guiado?.sitio ?? null;
  const rotulo = sitioGuia?.etiqueta ?? null;

  /* ── avance y final ────────────────────────────────────────────────────── */

  useEffect(() => {
    onAvance?.(guion.pasos.length ? Math.min(paso, guion.pasos.length) / guion.pasos.length : 0);
  }, [guion.pasos.length, onAvance, paso]);

  /** Un repaso al montar, con la rejilla ya medida. Ver la nota de `alto`. */
  useEffect(() => {
    repintar();
  }, [repintar, hueco]);

  useEffect(() => {
    if (!terminado || !empezado) return;
    onTerminado?.({
      pasos: guion.pasos.length,
      tropiezos,
      segundos: Math.round((Date.now() - arranque.current) / 1000),
    });
  }, [empezado, guion.pasos.length, onTerminado, terminado, tropiezos]);

  /**
   * Cambiar de hoja apaga el rastro de auditoría (bloque 47): las flechas se
   * calculan sobre la hoja donde se pulsó el botón, y arrastrarlas a una
   * hoja distinta enseñaría una flecha que nadie pidió ahí.
   */
  useEffect(() => {
    setRastro(null);
  }, [hojaId]);

  /* ── la rejilla: qué filas se pintan ───────────────────────────────────── */

  /*
   * Cuántas filas caben. Dos cuidados y los dos se pagaron:
   *
   * · El `??` de antes sólo tapaba `null`, y en el primer render el `ref` está
   *   vacío pero en el segundo `clientHeight` puede ser **0** —el elemento aún
   *   no tiene caja—, con lo que salían seis filas y la hoja parecía tener seis.
   * · Y aunque midiera bien, la medida se toma AL PINTAR: si nadie vuelve a
   *   pintar, la ventana se queda con la cuenta del primer render. De ahí el
   *   repaso de abajo, que corre una sola vez al montar y ya con la caja hecha.
   */
  const alto = Math.max(rejilla.current?.clientHeight ?? 0, 520);
  /*
   * La hoja que se está viendo, leída UNA vez. `filasHoja` es la cuenta de
   * filas que de verdad se pueden recorrer HOY —`visibles.length` con algún
   * filtro puesto (paquete TABLAS, bloques 33-36), `FILAS_HOJA` sin ninguno—,
   * y es la que manda en la ventana de virtualización y en el alto total del
   * espacio de scroll: una tabla filtrada hace la hoja más CORTA, no deja
   * huecos en blanco donde había filas escondidas.
   */
  const hojaActual = motor.libro.hojas.find((h) => h.id === hojaId);
  const filasHoja = Math.min(FILAS_HOJA, hojaActual?.visibles?.length ?? FILAS_HOJA);
  /*
   * `primerPuesto`/`cuantosPuestos`: la ventana de virtualización vive en
   * PUESTOS de pantalla, no en filas — el scroll siempre avanza de
   * `ALTO_FILA` en `ALTO_FILA` sin que le importe qué fila real le toca a
   * cada renglón. `filaEnPuesto`, más abajo, es la única que traduce.
   */
  const primerPuesto = Math.max(0, Math.floor(desplazado.top / ALTO_FILA) - 2);
  const cuantosPuestos = Math.min(filasHoja - primerPuesto, Math.ceil(alto / ALTO_FILA) + 6);
  /**
   * El puesto en pantalla de una fila, para todo lo que cuelga del espacio
   * de la hoja por una multiplicación —el tirador, la estela, la marca de
   * copiado, el ancla de una gráfica— y que hasta hoy multiplicaba la fila
   * tal cual. Si la fila no tiene puesto (no debería pasar: `sel`/`rango` ya
   * sólo aterrizan en filas visibles, ver `filaTrasDesplazamiento` y
   * `celdaBajoElRaton`) se queda en la fila misma, para no dibujar nada en
   * una posición negativa.
   */
  const puestoDeF = (f: number): number => {
    if (!hojaActual) return f;
    const p = puestoDeFila(hojaActual, f);
    return p >= 0 ? p : f;
  };
  const celdas = hojaActual?.celdas ?? {};
  /* Las gráficas de la hoja que se está viendo. Viven en el libro (`modelo.ts`),
     así que se leen igual que las celdas y no hay un segundo sitio donde estén. */
  const graficas = hojaActual?.graficas ?? [];
  /** La que tiene el panel «Diseño de gráfico» delante, si hay alguna marcada. */
  const graficaSeleccionada = graficaSel ? (graficas.find((g) => g.id === graficaSel) ?? null) : null;
  /**
   * El formato condicional (bloques 30 y 46), ya resuelto celda por celda —
   * `decoracionesDeHoja` es quien decide quién gana cuando dos reglas se
   * pisan, y quien cachea por la identidad del libro para no repetir 500
   * evaluaciones en cada repintado (`condicional.ts`). Y los minigráficos
   * (bloque 31), leídos igual que las gráficas: viven en el libro.
   */
  /*
   * El formato condicional se mezcla con el de las tablas (bloques 33-36) —
   * `combinarDecoraciones`, en `TablaVisual.tsx`— ANTES de llegar al pintado:
   * así el resto del repintado no cambia ni una línea, exactamente como
   * cuando se sumó el minigráfico a la gráfica sin tocar el bucle de celdas.
   */
  const decoraciones = combinarDecoraciones(decoracionesDeTablas(motor.libro, hojaId), decoracionesDeHoja(motor, hojaId));
  const minigraficos = hojaActual?.minigraficos ?? [];
  const tablas = hojaActual?.tablas ?? [];
  /*
   * Las celdas que pinta una tabla dinámica (bloques 49 y 50). Se lee en cada
   * repintado, como `decoraciones`, y sale vacío y barato cuando el libro no
   * tiene ninguna. **De la caché**, no construida de cero: por eso la dinámica
   * no se entera de que el origen cambió hasta que se pulsa Actualizar, que es
   * media clase 49 (`dinamicaVisual.ts` y `dinamica.ts` lo razonan entero).
   */
  const pintadoDinamico = celdasDeDinamicas(motor, hojaId);
  /**
   * Las flechas del rastro vivo (bloque 47), sólo mientras se está VIENDO la
   * hoja donde se pulsó el botón: `rastro.hoja !== hojaId` no debería pasar
   * —el `useEffect` de arriba apaga el rastro al cambiar de hoja— pero la
   * comprobación se deja puesta por si un día una flecha llega a pedirse
   * sobre una hoja que no es la activa.
   */
  const flechasActivas = useMemo(() => {
    if (!rastro || rastro.hoja !== hojaId) return [];
    return flechasDeAuditoria(motor, rastro.hoja, dir(rastro.col, rastro.fila), rastro.direccion);
  }, [motor, rastro, hojaId]);

  /*
   * El salto del cuadro de nombres se cuenta como `salto:C9` y no como una
   * selección cualquiera: es la mitad del encargo —«el cuadro de nombres
   * también funciona al revés»— y llegar a C9 a base de clics no es lo mismo
   * que llegar de un salto.
   */
  const irACelda = useCallback(
    (texto: string) => {
      const limpio = texto.trim().toUpperCase();
      const p = dirAColFila(limpio);
      if (!p || p.col >= COLS_HOJA || p.fila >= FILAS_HOJA) return false;
      seleccionar(cajaDeUna(p.col, p.fila), `salto:${dir(p.col, p.fila)}`);
      const hoja = motor.libro.hojas.find((h) => h.id === hojaId);
      // Si la fila de destino está escondida, se desplaza hasta su puesto en
      // pantalla y no hasta el número que tendría sin filtrar.
      const puesto = hoja ? puestoDeFila(hoja, p.fila) : p.fila;
      if (puesto >= 0) rejilla.current?.scrollTo({ top: Math.max(0, puesto * ALTO_FILA - 60), behavior: 'smooth' });
      return true;
    },
    [hojaId, motor.libro.hojas, seleccionar],
  );

  /**
   * **Bautizar lo que está marcado** · el bloque 22, por la puerta de Excel.
   *
   * El comando `nombrarRango` estaba construido y probado desde el §46 y **no
   * tenía por dónde entrar**: ni un botón, ni un cuadro, ni una tecla. O sea que
   * un rango con nombre sólo se podía fabricar escribiéndolo a mano en el libro
   * de partida de una clase, y el bloque 22 —que es la mitad de `n7-referencias`—
   * no se podía enseñar. Es la misma familia de defecto que Pegar antes del
   * §47.9: el motor sabía hacerlo y la ventana no sabía pedírselo.
   *
   * Se pone aquí y no en un botón nuevo de la cinta porque **es donde está en
   * Excel**: se marca el rango, se escribe el nombre en el cuadro de nombres y se
   * pulsa Entrar. Un botón inventado enseñaría un domicilio que el lunes, en el
   * programa de verdad, no existe (§36.12).
   *
   * Pasa por `ejecutarGestos`, así que hereda las cuatro cosas de siempre: la
   * guarda del desvío (bautizar en mitad de otro encargo avisa y **no toca el
   * libro**), el aviso del programa cuando el nombre no vale —«E1 es una
   * dirección de celda»—, deshacer, y la grabadora de macros.
   *
   * Devuelve si **lo atendió**, no si el libro cambió: cuando el programa
   * rechaza el nombre, la explicación ya está en pantalla y quien llama no tiene
   * que poner otra encima.
   */
  const bautizar = useCallback(
    (texto: string): boolean => {
      const nombre = texto.trim();
      if (!nombre) return false;
      if (esDesvioYSeAvisa('cuadro-de-nombres')) return true;
      ejecutarGestos(
        [{ comando: 'nombrarRango', args: { hoja: hojaId, rango: textoDeCaja(rango), nombre } }],
        { control: 'cuadro-de-nombres' },
      );
      return true;
    },
    [ejecutarGestos, esDesvioYSeAvisa, hojaId, rango],
  );

  /**
   * Lo que el cuadro de nombres **enseña**: el domicilio, o el nombre si lo
   * marcado es un rango bautizado.
   *
   * Es lo que hace Excel y aquí es media clase: sin esto, ponerle nombre a una
   * celda no se ve por ninguna parte —el libro cambia y la pantalla dice lo
   * mismo que antes—, y un alumno no puede aprender de un gesto que no deja
   * rastro. Con esto, marcar E2 y leer **IVA** donde antes decía E2 es la prueba
   * de que el nombre existe.
   */
  const nombreDeLoMarcado = useMemo(() => {
    const hoja = motor.libro.hojas.find((h) => h.id === hojaId);
    if (!hoja) return null;
    const domicilio = `${hoja.nombre}!${textoDeCaja(rango)}`;
    return Object.keys(motor.libro.nombres).find((n) => motor.libro.nombres[n] === domicilio) ?? null;
  }, [hojaId, motor.libro, rango]);

  /* ── la cuenta rápida de la barra de estado ────────────────────────────── */

  const cuenta = useMemo(() => {
    let n = 0;
    let suma = 0;
    // Sobre `rango` y no sobre `sel`: marcando de abajo hacia arriba este bucle
    // no daba ni una vuelta y la barra de estado se quedaba muda (ver `rango`).
    for (let f = rango.f0; f <= rango.f1; f += 1) {
      for (let c = rango.c0; c <= rango.c1; c += 1) {
        const v = motor.valores.get(clave(hojaId, c, f));
        if (typeof v === 'number') {
          n += 1;
          suma += v;
        }
      }
    }
    return { n, suma };
  }, [hojaId, motor, rango]);

  /**
   * El mensaje de entrada de la validación de la celda activa (bloque 32),
   * si tiene una puesta. Es el equivalente de la ventanita amarilla que
   * Excel enseña pegada a la celda al entrar en ella; esta ventana no tiene
   * ese globo flotante, así que el mismo aviso sale en la barra de estado —
   * el sitio que ya explica lo que está pasando en la selección.
   */
  const mensajeDeValidacion = useMemo(() => {
    const hoja = motor.libro.hojas.find((h) => h.id === hojaId);
    return hoja ? (validacionEnCelda(hoja, dir(sel.c0, sel.f0))?.mensaje ?? null) : null;
  }, [hojaId, motor.libro, sel]);

  /** La caja de lo copiado, si lo copiado está en la hoja que se está viendo. */
  const marcaCopiada = useMemo(
    () => (portapapeles && portapapeles.hoja === hojaId ? cajaDeTexto(portapapeles.origen) : null),
    [hojaId, portapapeles],
  );

  /**
   * Las celdas combinadas de esta hoja, **indexadas por celda** y no por
   * combinación.
   *
   * La rejilla pregunta una vez por celda pintada —doscientas por repintado— y
   * la lista de la hoja tiene tres entradas: buscar en la lista sería recorrerla
   * doscientas veces por nada. Se le da la vuelta una sola vez, aquí, y cada
   * celda contesta con una consulta al mapa. Es la misma idea que el índice
   * inverso del motor de fórmulas: se paga una vez lo que se pregunta muchas.
   */
  const combinadas = useMemo(() => {
    const mapa = new Map<string, Combinacion>();
    for (const m of combinacionesDe(motor.libro, hojaId)) {
      for (let f = m.caja.f0; f <= m.caja.f1; f += 1) {
        for (let c = m.caja.c0; c <= m.caja.c1; c += 1) mapa.set(dir(c, f), m);
      }
    }
    return mapa;
  }, [hojaId, motor.libro]);

  /**
   * Lo que hay que marcar al pulsar una celda: **una combinada se selecciona
   * entera**, como en Excel.
   *
   * Sin esto, pulsar la celda tapada de una combinada dejaría el cursor en una
   * celda que no se ve —la que está debajo del título— y todo lo que mira el
   * ancla de la selección (la negrita hundida, la brocha, la barra de fórmulas)
   * contestaría por una celda que el alumno no tiene delante.
   */
  const cajaAlPulsar = useCallback(
    (col: number, fila: number): Caja => {
      const m = combinadas.get(dir(col, fila));
      return m ? { ...m.caja } : cajaDeUna(col, fila);
    },
    [combinadas],
  );

  /* ── pintar ────────────────────────────────────────────────────────────── */

  const guionVisible = {
    pasos: guion.pasos.map((p) => ({
      id: p.id,
      titulo: p.titulo,
      instruccion: p.instruccion,
      pista: p.pista,
      aprendido: p.aprendido,
      logro: p.logro as { tipo: string; opciones?: string[]; boton?: string },
    })),
    cierre: guion.cierre,
  };

  const ventana = (
    <div className="txtw hjw" ref={raiz}>
      {/* ─── barra de título ─── */}
      <div className="txtw-titulo">
        <span className="txtw-marca" aria-hidden="true">
          X
        </span>
        <div className="txtw-rapido">
          <button
            type="button"
            className="txtw-rapido-boton"
            title="Guardar"
            aria-label="Guardar"
            data-control="guardar"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setAviso({ titulo: 'Guardado en este equipo. Si cierras y vuelves, tu libro sigue aquí.' });
              setSinGuardar(false);
            }}
          >
            <Save size={15} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            className="txtw-rapido-boton"
            title="Deshacer"
            aria-label="Deshacer"
            data-control="deshacer"
            onMouseDown={(e) => e.preventDefault()}
            onClick={deshacer}
          >
            <Undo2 size={15} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            className="txtw-rapido-boton"
            title="Rehacer"
            aria-label="Rehacer"
            data-control="rehacer"
            onMouseDown={(e) => e.preventDefault()}
            onClick={rehacer}
          >
            <Redo2 size={15} strokeWidth={2.2} />
          </button>
        </div>
        <span className="txtw-archivo">
          {guion.archivo}{' '}
          <span className={`txtw-guardado${sinGuardar ? ' es-pendiente' : ''}`}>
            · {sinGuardar ? 'Sin guardar' : 'Guardado'}
          </span>
        </span>
        <span className="txtw-programa">Tecnia Hojas</span>
        {onSalir && (
          <button type="button" className="txtw-cerrar" onClick={onSalir} aria-label="Salir del laboratorio">
            <X size={17} strokeWidth={2.4} />
          </button>
        )}
      </div>

      {/* ─── pestañas ─── */}
      <div className="txtw-pestanas" role="tablist" aria-label="Cinta de opciones">
        <button
          type="button"
          className={`txtw-pestana es-archivo${enArchivo ? ' es-activa' : ''}`}
          data-pestana="archivo"
          title={Backstage ? 'Archivo · guardar y exportar' : 'Archivo · lo usarás en otra clase'}
          aria-disabled={Backstage ? undefined : 'true'}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            Backstage
              ? setEnArchivo((x) => !x)
              : setAviso({ titulo: '«Archivo» es para guardar y exportar. Eso lo verás en otra clase.' })
          }
        >
          Archivo
        </button>
        {cinta
          .filter((p) => p.id !== 'archivo')
          .map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={p.id === pestanaActual.id}
              data-pestana={p.id}
              className={`txtw-pestana${p.id === pestanaActual.id ? ' es-activa' : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => irAPestana(p.id)}
            >
              {p.nombre}
            </button>
          ))}
      </div>

      {/* ─── la cinta ─── */}
      <div className="txtw-cinta" role="tabpanel" aria-label={`Herramientas de ${pestanaActual.nombre}`}>
        {pestanaActual.grupos.map((g) => (
          <div className="txtw-grupo" key={g.id} data-grupo={g.id}>
            <div className="txtw-grupo-controles">
              <div
                className="txtw-botones"
                data-flujo="fila"
                style={{ '--cols': Math.ceil(g.controles.length / 2) } as React.CSSProperties}
              >
                {g.controles.map((c) => {
                  /*
                   * `ctxPara` y no `ctx`: Pegar sabe si hay algo copiado sólo
                   * cuando se le pasa el portapapeles de la ventana, y sin él se
                   * dibujaba apagado después de copiar.
                   *
                   * Y los que piden un dato **no se pintan apagados**, aunque la
                   * cinta los declare inertes hasta tenerlo: el que abre la
                   * paleta es este mismo botón, así que vestirlo de «aún no
                   * disponible» sería mandar al alumno a buscar en otro sitio la
                   * puerta que tiene delante.
                   */
                  const apagado = !PIDEN_UN_DATO.has(c.id) && estaInerte(ctxPara(c.id), c.id, controles);
                  /*
                   * Y los TRES estados, no dos. La ventana le pasaba a
                   * `BotonCinta` lo inerte por las dos puertas —`inerte` y
                   * `construido`—, así que «aquí no se puede» y «aún no
                   * disponible» se vestían igual: Pegar sin nada copiado se
                   * pintaba como un botón sin construir, y al copiar volvía a la
                   * vida. O sea que la ventana le enseñaba al alumno que copiar
                   * algo **arregla** el botón de pegar. Es el defecto del §36.8,
                   * heredado de la clase 1 y visible en cuanto una clase usa el
                   * portapapeles.
                   */
                  const hecho = estaConstruido(c.id, controles);
                  return (
                    <BotonCinta
                      key={c.id}
                      id={c.id}
                      glifo={c.glifo}
                      etiqueta={c.etiqueta}
                      corto={c.corto}
                      ancho={c.ancho}
                      activo={
                        // La cuadrícula no vive en el libro sino aquí, así que
                        // `estaActivo` no puede saberlo. Va hundido cuando las
                        // líneas SE VEN, que es como está la casilla de Excel:
                        // encendida de fábrica. Sin esta línea el botón apaga las
                        // líneas y se queda igual que antes, o sea que no enseña
                        // que él es quien las apagó.
                        c.id === 'ver-cuadricula'
                          ? cuadricula
                          : // Mismo defecto que tenía `ver-cuadricula` antes del
                            // 14-ago-2026, encontrado al lado mientras se cableaba
                            // el rastro de auditoría: `mostrar-formulas` está en
                            // `ES_INTERRUPTOR` pero su `ControlHojas` (`cinta.ts`)
                            // es `{ gesto: () => null }` sin `activo`, así que
                            // `estaActivo` devolvía `false` SIEMPRE — el botón
                            // encendía la vista y nunca se pintaba hundido, la
                            // misma mentira de «no fui yo quien lo prendió».
                            c.id === 'mostrar-formulas'
                            ? mostrarFormulas
                            : // El rastro de auditoría (bloque 47) es la misma
                              // familia: el botón se queda hundido mientras SU
                              // flecha está en pantalla, no la del otro sentido.
                              c.id === 'rastrear-precedentes'
                              ? rastro?.direccion === 'precedentes'
                              : c.id === 'rastrear-dependientes'
                                ? rastro?.direccion === 'dependientes'
                                : estaActivo(ctx, c.id, controles)
                      }
                      inerte={apagado}
                      construido={hecho}
                      esInterruptor={ES_INTERRUPTOR.has(c.id)}
                      onPulsar={pulsar}
                    />
                  );
                })}
              </div>
            </div>
            {/* El panel del desplegable, colgado del GRUPO donde vive su botón.
                En Excel una paleta sale pegada al botón que la abrió; aquí eso
                se consigue anclándola al grupo, sin medir el DOM y sin un panel
                flotante que aparezca en mitad de la ventana. */}
            {paleta && paleta !== 'color-hoja' && g.controles.some((c) => c.id === paleta) && (
              <PanelDesplegable
                // Con clave: al saltar de un desplegable de texto a otro —o a
                // uno de lista/paleta— dentro del MISMO grupo (p. ej. «Número»
                // tiene el desplegable de tipos y, desde hoy, el cuadro de
                // «Formato personalizado»), React reutilizaría el `<input>`
                // sin controlar si no cambia de instancia, y el texto de un
                // panel podría colarse en el otro.
                key={paleta}
                id={paleta}
                // El tipo del ANCLA, que es lo que mira toda la cinta
                // (`formatoAncla`, en `cinta.ts`): con media selección en fecha,
                // Excel hunde el renglón de la celda del cursor y no el de las
                // cincuenta marcadas.
                actual={celdaEn(motor.libro, ctx.hoja, rango.c0, rango.f0)?.formato?.tipo ?? 'general'}
                onElegir={pulsar}
              />
            )}
            {/*
              El panel «Importar datos» (bloque 43), colgado del mismo grupo
              que su botón, por lo mismo que el de arriba. No usa `paleta` ni
              `PanelDesplegable`: es `importando`, y sus botones marcan el
              libro llamando a `ejecutarGestos` directamente (ver
              `importarDatos`, más arriba) en vez de pasar por `pulsar`,
              porque lo que lleva no cabe en un `valor` de un solo campo.
            */}
            {importando && g.controles.some((c) => c.id === 'importar-csv') && (
              <div className="hjw-panel-importar" role="group" aria-label="Importar datos">
                <h3 className="hjw-panel-importar-titulo">Importar datos de texto</h3>

                {archivosParaImportar.length > 0 && (
                  <div className="hjw-panel-importar-archivos">
                    {archivosParaImportar.map((a) => (
                      <button
                        key={a.nombre}
                        type="button"
                        className="hjw-boton-panel es-secundario"
                        data-hjw-importar-archivo={a.nombre}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setImportarTexto(a.texto)}
                      >
                        {a.nombre}
                      </button>
                    ))}
                  </div>
                )}

                <label className="hjw-panel-importar-campo">
                  <span>Texto del archivo</span>
                  <textarea
                    data-hjw-importar-texto
                    rows={5}
                    value={importarTexto}
                    onChange={(e) => setImportarTexto(e.target.value)}
                    placeholder={'Nombre,Precio\nCuaderno,25'}
                  />
                </label>

                <label className="hjw-panel-importar-campo">
                  <span>Separador</span>
                  <select
                    data-hjw-importar-separador
                    value={importarSeparador}
                    onChange={(e) => setImportarSeparador(e.target.value as '' | Separador)}
                  >
                    <option value="">Detectar automáticamente</option>
                    <option value=",">Coma (,)</option>
                    <option value=";">Punto y coma (;)</option>
                    <option value={'\t'}>Tabulador</option>
                  </select>
                </label>

                {!celdaAnclaImportar && (
                  <p className="hjw-panel-importar-nota">Ponte primero en una sola celda: ahí va a empezar la tabla.</p>
                )}

                {parteImportar && (
                  <ul className="hjw-panel-importar-parte" data-hjw-importar-parte>
                    {frasesDelParte(parteImportar, rango.c0).map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                )}

                {parteImportar?.comillaSinCerrar ? (
                  <p className="hjw-panel-importar-error" data-hjw-importar-error>
                    Revisa el texto antes de importar: hay una comilla que nunca se cierra.
                  </p>
                ) : avisoChoqueImportar ? (
                  <>
                    <p className="hjw-panel-importar-aviso" data-hjw-importar-aviso>
                      {avisoChoqueImportar.charAt(0).toUpperCase() + avisoChoqueImportar.slice(1)}.
                    </p>
                    <button
                      type="button"
                      className="hjw-boton-panel es-aviso"
                      data-hjw-importar-confirmar
                      onClick={() => importarDatos(true)}
                    >
                      Sí, sustituir e importar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="hjw-boton-panel"
                    data-hjw-importar-confirmar
                    disabled={!gestoImportar}
                    onClick={() => importarDatos(false)}
                  >
                    Importar
                  </button>
                )}
              </div>
            )}
            <div className="txtw-grupo-nombre">{g.nombre}</div>
          </div>
        ))}
      </div>

      {/* ─── el cuadro de nombres y la barra de fórmulas ─── */}
      <div className="hjw-barra">
        <div className="hjw-nombres" data-control="cuadro-de-nombres">
          <input
            aria-label="Cuadro de nombres"
            defaultValue={nombreDeLoMarcado ?? direccionActiva}
            key={nombreDeLoMarcado ?? direccionActiva}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              const escrito = (e.target as HTMLInputElement).value;
              /*
               * **Primero se intenta ir.** El cuadro de nombres es antes que nada
               * el salto de la clase 1, y `C7` tiene que seguir llevando a C7 y no
               * bautizar nada. Lo que no es una dirección es un nombre, que es
               * exactamente el orden que sigue Excel.
               */
              if (irACelda(escrito)) return;
              if (dirAColFila(escrito.trim().toUpperCase())) {
                setAviso({
                  titulo: 'Esa celda existe en Excel, pero queda fuera de lo que esta hoja deja recorrer.',
                  queHace: 'Prueba con una más cerca, como C7.',
                });
                return;
              }
              if (!bautizar(escrito)) {
                setAviso({
                  titulo: 'Escribe una celda —C7— para ir hasta ella, o un nombre —IVA— para bautizar lo que tengas marcado.',
                });
              }
            }}
          />
        </div>
        <div className="hjw-fx" aria-hidden="true">
          fx
        </div>
        <input
          className="hjw-formula"
          data-control="barra-de-formulas"
          aria-label="Barra de fórmulas"
          value={editando ?? crudoActivo}
          onChange={(e) => {
            setEnLaBarra(true);
            setEditando(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirmarCelda(editando ?? crudoActivo, 1, 0);
            if (e.key === 'Escape') {
              setEditando(null);
              setEnLaBarra(false);
            }
          }}
          placeholder="Escribe un dato, o una fórmula que empiece por ="
        />
      </div>

      {/* ─── la hoja y el panel ─── */}
      <div className={`txtw-medio${panelFijo ? ' es-con-panel' : ''}`}>
        <div className="hjw-hoja">
          <div
            // `es-brocha` cambia el puntero de toda la hoja mientras la brocha
            // lleva algo dentro: es la única señal de que el programa está
            // esperando dónde soltarla, y sin ella la herramienta de dos tiempos
            // parece un botón que no hizo nada.
            className={`hjw-rejilla${cuadricula ? '' : ' sin-cuadricula'}${brocha ? ' es-brocha' : ''}`}
            ref={rejilla}
            tabIndex={0}
            role="grid"
            aria-label="Hoja de cálculo"
            onKeyDown={alTeclado}
            onScroll={(e) =>
              setDesplazado({ top: e.currentTarget.scrollTop, left: e.currentTarget.scrollLeft })
            }
          >
            <div
              className="hjw-espacio"
              style={{ width: ANCHO_CAB + COLS_HOJA * ANCHO_COL, height: ALTO_CAB + filasHoja * ALTO_FILA }}
            >
              <div className="hjw-cab-cols" style={{ height: ALTO_CAB }}>
                <div className="hjw-esquina" style={{ width: ANCHO_CAB, height: ALTO_CAB }} />
                {Array.from({ length: COLS_HOJA }, (_, c) => (
                  <div
                    key={c}
                    className={`hjw-cab${c >= rango.c0 && c <= rango.c1 ? ' es-activa' : ''}`}
                    style={{ width: ANCHO_COL, height: ALTO_CAB }}
                    data-columna={letraDeColumna(c)}
                    onClick={() =>
                      seleccionar(
                        { c0: c, f0: 0, c1: c, f1: FILAS_HOJA - 1 },
                        `columna:${letraDeColumna(c)}`,
                      )
                    }
                  >
                    {letraDeColumna(c)}
                  </div>
                ))}
              </div>

              {Array.from({ length: cuantosPuestos }, (_, i) => {
                const puesto = primerPuesto + i;
                // La traducción de puesto a fila real: un acceso a un array
                // con una tabla filtrada, o la identidad sin ninguna. `-1` es
                // «ya no queda ninguna fila visible en este puesto» —el final
                // de una hoja filtrada, que puede acabar antes de llegar a
                // `filasHoja` si el último tramo se ocultó a mano.
                const f = hojaActual ? filaEnPuesto(hojaActual, puesto) : puesto;
                if (f < 0) return null;
                return (
                  <div
                    key={f}
                    className="hjw-fila"
                    style={{ top: ALTO_CAB + puesto * ALTO_FILA, height: ALTO_FILA }}
                  >
                    <div
                      className={`hjw-cab-fila${f >= rango.f0 && f <= rango.f1 ? ' es-activa' : ''}`}
                      style={{ width: ANCHO_CAB, height: ALTO_FILA }}
                      data-fila={f + 1}
                      onClick={() => seleccionar({ c0: 0, f0: f, c1: COLS_HOJA - 1, f1: f }, `fila:${f + 1}`)}
                    >
                      {f + 1}
                    </div>
                    {Array.from({ length: COLS_HOJA }, (_, c) => {
                      const d = dir(c, f);
                      const celda = celdas[d];
                      const valor: Valor = motor.valores.get(clave(hojaId, c, f)) ?? null;
                      const visto = comoSeVe(valor, celda?.formato);
                      /*
                       * El formato condicional (bloques 30 y 46) y el
                       * minigráfico (31) de esta celda, si los hay. Los dos
                       * se leen del libro y nunca lo tocan — `decoraciones`
                       * ya viene resuelta de `decoracionesDeHoja` (una sola
                       * vez por repintado, cacheada mientras el libro no
                       * cambie: `condicional.ts`).
                       */
                      const dec = decoraciones.get(clave(hojaId, c, f));
                      /*
                       * ¿Esta celda cae dentro de lo que pinta una tabla
                       * dinámica? Entonces manda ella: la celda del libro está
                       * vacía —una dinámica no escribe nada, `modelo.ts`— y lo
                       * que se ve es el cruce. Se pinta por DENTRO de la celda
                       * a propósito (ver `dinamicaVisual.ts`).
                       */
                      const din = pintadoDinamico.get(clave(hojaId, c, f));
                      const minigrafico = minigraficos.find((m) => m.celda === clave(hojaId, c, f));
                      /*
                       * La validación de datos (bloque 32) y el hipervínculo
                       * (bloque 40) de esta celda, si los hay. Los dos se leen
                       * del libro sin tocarlo, igual que `dec` y `minigrafico`
                       * aquí arriba.
                       */
                      const validacion = hojaActual ? validacionEnCelda(hojaActual, d) : null;
                      const vinculo = vinculoEnCelda(motor.libro, hojaId, d);
                      const enlaceRoto = vinculo ? vinculoRoto(motor.libro, vinculo) : false;
                      const activa = c === sel.c0 && f === sel.f0;
                      const dentro = c >= rango.c0 && c <= rango.c1 && f >= rango.f0 && f <= rango.f1;
                      /*
                       * ── Cómo se dibuja una combinada · bloque 10 ───────────
                       *
                       * Sin `colspan`: esto es una fila de `flex` con anchos
                       * constantes y una celda estirada empujaría a las de su
                       * derecha, con lo que la columna D dejaría de estar donde
                       * dice `ANCHO_COL` y la división entera del ratón (§39)
                       * empezaría a mentir. Así que la combinación se dibuja por
                       * TIRAS —una por fila que ocupa—: la celda de la izquierda
                       * de cada tira mide lo que miden todas juntas y las tapadas
                       * de esa tira miden **cero**. La suma no cambia.
                       *
                       * Y las rayas de dentro se apagan cara por cara, que es lo
                       * que hace que tres celdas se lean como una sola.
                       */
                      const comb = combinadas.get(d);
                      const tapada = comb !== undefined && c !== comb.caja.c0;
                      // Cero de ancho para las tapadas, y la de la izquierda mide
                      // por todas: así la fila suma exactamente lo mismo que
                      // antes de combinar y la columna D sigue estando donde dice
                      // la multiplicación.
                      const ancho = comb ? (tapada ? 0 : (comb.caja.c1 - comb.caja.c0 + 1) * ANCHO_COL) : ANCHO_COL;
                      const clases = [
                        'hjw-celda',
                        activa ? 'es-activa' : dentro ? 'es-dentro' : '',
                        esError(valor) ? 'es-error' : '',
                        motor.circulares.includes(clave(hojaId, c, f)) ? 'es-circular' : '',
                        tapada ? 'es-tapada' : '',
                        celda?.formato?.ajustarTexto ? 'es-ajustado' : '',
                        // El vínculo se ve roto si el destino ya no existe: no
                        // falla en silencio (bloque 40).
                        vinculo ? (enlaceRoto ? 'es-vinculo-roto' : 'es-vinculo') : '',
                        // Una celda de tabla dinámica, con su papel: los
                        // subtotales y el total general tienen que verse
                        // distintos de los datos o la dinámica no se lee.
                        din ? `hjw-din es-din-${din.rol}` : '',
                      ]
                        .filter(Boolean)
                        .join(' ');

                      /*
                       * El formato pintado. Los bordes van por color y no por
                       * grosor: las cuatro caras ya existen en el CSS y dos están
                       * transparentes, así que ponerlas es cambiarles el color y
                       * la rejilla no se mueve ni un píxel.
                       *
                       * `undefined` en cada campo significa «lo que diga el CSS»,
                       * que es lo que deja funcionando el gris de la cuadrícula y
                       * el botón que la apaga.
                       */
                      const b = celda?.formato?.bordes;
                      /*
                       * El formato condicional se MEZCLA encima del propio de
                       * la celda, sólo para pintar — nunca se guarda—: gana el
                       * campo de `dec.formato` si lo trae, y si no, el de
                       * `celda.formato` sigue mandando. Es la misma regla que
                       * `condicional.ts` ya explica en su cabecera, sólo que
                       * aplicada aquí campo a campo en vez de objeto entero,
                       * porque el `tipo`/los decimales de la celda —lo que
                       * `comoSeVe` ya usó arriba— no los toca ninguna regla:
                       * el formato condicional pinta, no reformatea el número.
                       */
                      const df = dec?.formato;
                      // Una barra de datos se pinta como un degradado con
                      // cortes duros: nada de DOM nuevo, nada de posicionar
                      // nada — es un `background` más, como el color de
                      // relleno de siempre. `barra` es un `const` aparte (y no
                      // `dec?.barra` repetido) para que TypeScript no pierda
                      // el estrechamiento de tipo dentro de la función.
                      const barra = dec?.barra;
                      const barraFondo = barra
                        ? (() => {
                            const ini = barra.desdePct * 100;
                            const fin = ini + barra.anchoPct * 100;
                            return `linear-gradient(to right, transparent ${ini}%, ${barra.color}99 ${ini}%, ${barra.color}99 ${fin}%, transparent ${fin}%)`;
                          })()
                        : undefined;
                      const estilo: React.CSSProperties = {
                        width: ancho,
                        height: ALTO_FILA,
                        justifyContent:
                          visto.alineacion === 'derecha'
                            ? 'flex-end'
                            : visto.alineacion === 'centro'
                              ? 'center'
                              : 'flex-start',
                        textAlign: visto.alineacion === 'derecha' ? 'right' : visto.alineacion === 'centro' ? 'center' : 'left',
                        fontWeight: (df?.negrita ?? celda?.formato?.negrita) ? 700 : undefined,
                        fontStyle: (df?.cursiva ?? celda?.formato?.cursiva) ? 'italic' : undefined,
                        textDecoration: (df?.subrayado ?? celda?.formato?.subrayado) ? 'underline' : undefined,
                        // Prioridad de color de letra: la regla condicional
                        // manda; si no hay, el `[Rojo]` del patrón del bloque
                        // 45 (`visto.colorPatron`); si no, el color a mano.
                        color: df?.colorLetra ?? visto.colorPatron ?? celda?.formato?.colorLetra,
                        background: barraFondo ?? df?.colorRelleno ?? celda?.formato?.colorRelleno,
                        borderTopColor: b?.arriba ? TINTA_DE_BORDE : undefined,
                        borderBottomColor: b?.abajo ? TINTA_DE_BORDE : undefined,
                        borderLeftColor: b?.izquierda ? TINTA_DE_BORDE : undefined,
                        borderRightColor: b?.derecha ? TINTA_DE_BORDE : undefined,
                      };
                      if (din) {
                        /*
                         * La dinámica manda sobre el formato de la celda de
                         * debajo, y no le quita nada a nadie: esas celdas no
                         * están en `Hoja.celdas`, así que no hay formato propio
                         * al que ganarle. Los números se alinean a la derecha
                         * como cualquier número de la hoja, y la sangría —lo
                         * único que hace legible un campo anidado dentro de
                         * otro— se calcula de `profundidad` en
                         * `dinamicaVisual.ts`, no con espacios en la etiqueta.
                         */
                        estilo.justifyContent = din.derecha ? 'flex-end' : 'flex-start';
                        estilo.textAlign = din.derecha ? 'right' : 'left';
                        if (din.sangria) estilo.paddingLeft = 4 + din.sangria * 14;
                      }
                      if (comb) {
                        // Las caras de dentro de la combinación, apagadas. Van al
                        // final porque ganan a cualquier borde puesto a mano: una
                        // raya en medio de un título combinado lo partiría en dos.
                        if (f < comb.caja.f1) estilo.borderBottomColor = 'transparent';
                        if (f > comb.caja.f0) estilo.borderTopColor = 'transparent';
                        if (tapada) estilo.borderRightColor = 'transparent';
                      }

                      // `!enLaBarra`: si lo que se está escribiendo se escribe
                      // arriba, la celda NO abre su editor — que nace con
                      // `autoFocus` y se llevaría el cursor de la barra.
                      if (activa && editando !== null && !enLaBarra) {
                        return (
                          // `data-celda` también mientras se escribe: sin él, la
                          // celda desaparece del DOM buscable justo cuando el
                          // alumno está dentro de ella, y el aro que la señalaba
                          // se cae al primer teclazo.
                          // El editor se abre con el ancho de la celda combinada:
                          // escribir en un título de tres celdas y verlo cortado
                          // en la primera sería enseñar que combinar no sirvió.
                          <div key={d} className={clases} data-celda={d} style={{ width: ancho, height: ALTO_FILA }}>
                            <input
                              autoFocus
                              className="hjw-editor"
                              value={editando}
                              onChange={(e) => setEditando(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  confirmarCelda(editando, 1, 0);
                                }
                                if (e.key === 'Tab') {
                                  e.preventDefault();
                                  confirmarCelda(editando, 0, 1);
                                }
                                if (e.key === 'Escape') setEditando(null);
                              }}
                            />
                          </div>
                        );
                      }

                      return (
                        <div
                          key={d}
                          className={clases}
                          data-celda={d}
                          style={estilo}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            rejilla.current?.focus();
                            setEditando(null);
                            setEnLaBarra(false);
                            // Cualquier clic en la rejilla cierra la lista
                            // desplegable de una validación que hubiera
                            // quedado abierta en otra celda (bloque 32).
                            if (listaAbierta) setListaAbierta(null);
                            const nueva = e.shiftKey ? { ...sel, c1: c, f1: f } : cajaAlPulsar(c, f);
                            // La brocha se suelta ANTES de contar la selección:
                            // el gesto es «píntame esto», y lo que se marcó es su
                            // destino, no un paseo del cursor.
                            soltarBrocha(nueva);
                            seleccionar(nueva);
                          }}
                          onDoubleClick={() => {
                            setEnLaBarra(false);
                            setEditando(celda?.crudo ?? '');
                          }}
                          role="gridcell"
                          tabIndex={-1}
                        >
                          {/* Una celda tapada no enseña nada: su contenido se tiró
                              al combinar y lo que se ve es el de la que manda. */}
                          {tapada ? (
                            ''
                          ) : din ? (
                            /*
                             * Lo que enseña la dinámica, con su papel escrito
                             * al lado para quien la mire desde fuera —una
                             * prueba, o la clase que insertará un gráfico
                             * dinámico encima de ella—. Gana a «Mostrar
                             * fórmulas»: el crudo de esta celda está vacío, y
                             * enseñar un hueco donde hay un total sería
                             * mentir.
                             */
                            <span className="hjw-din-texto" data-dinamica={d} data-din-rol={din.rol}>
                              {din.texto}
                            </span>
                          ) : minigrafico ? (
                            /*
                             * El minigráfico TAPA el valor de su celda —la
                             * decisión está escrita en `Minigrafico.tsx`—: el
                             * dato sigue intacto en `celda.crudo`, sólo la
                             * pantalla dibuja el resumen en vez del número.
                             */
                            <span
                              className="hjw-minigrafico"
                              data-minigrafico={d}
                              style={{ display: 'block', width: '100%', height: '100%' }}
                            >
                              <MinigraficoSVG minigrafico={minigrafico} motor={motor} hoja={hojaId} />
                            </span>
                          ) : (
                            <>
                              {dec?.icono && (
                                <span className="hjw-icono-cf" data-icono={d} style={{ color: dec.icono.color }}>
                                  {dec.icono.simbolo}
                                </span>
                              )}
                              {/*
                               * «Mostrar fórmulas» (bloque 42) enseña la
                               * REGLA en vez del resultado: el crudo tal
                               * cual, en toda celda, no sólo en las que
                               * tienen `=` delante — es lo que hace Excel
                               * con Ctrl+`.
                               *
                               * Sin ese modo, un hipervínculo con texto
                               * propio (`vinculo.texto`) se enseña a él en
                               * vez del contenido de la celda — es lo que
                               * hace Excel al insertar un hipervínculo con
                               * un rótulo distinto del texto ya escrito.
                               */}
                              {mostrarFormulas ? (celda?.crudo ?? '') : (vinculo?.texto ?? visto.texto)}
                            </>
                          )}
                          {/*
                           * La flecha de una validación de LISTA (bloque
                           * 32) y su desplegable. Sólo `'lista'` la trae —
                           * Excel tampoco la pone en una validación de
                           * número, fecha o longitud, porque no hay una
                           * lista cerrada de opciones que enseñar—.
                           */}
                          {!tapada && validacion?.clase === 'lista' && (
                            <span
                              className="hjw-flecha-validacion"
                              data-flecha-validacion={d}
                              title="Elige un valor de la lista"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                // La celda es el padre directo de la flecha:
                                // su rectángulo real en pantalla es lo que
                                // necesita el portal para colgar la lista
                                // justo debajo, aunque la celda misma recorte
                                // su contenido con `overflow: hidden`.
                                const r = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
                                setListaAbierta((x) =>
                                  x?.d === d
                                    ? null
                                    : {
                                        d,
                                        x: r.left,
                                        y: r.bottom,
                                        ancho: Math.max(r.width, 120),
                                        opciones: validacion?.lista ?? [],
                                      },
                                );
                              }}
                            >
                              ▾
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* ─── el cuadrito de relleno ───
                  Va colgado del espacio de la hoja y no dentro de la celda, y no
                  es un detalle: la celda tiene `overflow: hidden` —lo necesita,
                  para cortar el texto que no cabe— así que un cuadrito que
                  sobresale medio píxel de su esquina se vería recortado por la
                  mitad. Aquí su sitio es una multiplicación, igual que el de las
                  filas. */}
              {editando === null && !terminado && (
                <div
                  className="hjw-tirador"
                  data-control="tirador"
                  title="Arrastra para rellenar"
                  aria-label="Cuadrito de relleno"
                  role="button"
                  tabIndex={-1}
                  style={{
                    left: ANCHO_CAB + (rango.c1 + 1) * ANCHO_COL - 4,
                    top: ALTO_CAB + (puestoDeF(rango.f1) + 1) * ALTO_FILA - 4,
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setArrastre({ desde: rango, hasta: rango });
                  }}
                />
              )}

              {/* La estela: hasta dónde va a llegar el relleno si sueltas aquí. */}
              {arrastre && (
                <div
                  className="hjw-estela"
                  aria-hidden="true"
                  style={{
                    left: ANCHO_CAB + arrastre.hasta.c0 * ANCHO_COL,
                    top: ALTO_CAB + puestoDeF(arrastre.hasta.f0) * ALTO_FILA,
                    width: (arrastre.hasta.c1 - arrastre.hasta.c0 + 1) * ANCHO_COL,
                    height: (puestoDeF(arrastre.hasta.f1) - puestoDeF(arrastre.hasta.f0) + 1) * ALTO_FILA,
                  }}
                />
              )}

              {/* Lo que está copiado o cortado, con su marca de rayas. En Excel
                  son las hormigas que marchan, y son la única señal de que el
                  portapapeles tiene algo dentro: sin ellas, cortar no se ve. */}
              {marcaCopiada && (
                <div
                  className={`hjw-marca${portapapeles?.corte ? ' es-corte' : ''}`}
                  aria-hidden="true"
                  style={{
                    left: ANCHO_CAB + marcaCopiada.c0 * ANCHO_COL,
                    top: ALTO_CAB + puestoDeF(marcaCopiada.f0) * ALTO_FILA,
                    width: (marcaCopiada.c1 - marcaCopiada.c0 + 1) * ANCHO_COL,
                    height: (puestoDeF(marcaCopiada.f1) - puestoDeF(marcaCopiada.f0) + 1) * ALTO_FILA,
                  }}
                />
              )}

              {/* ─── las gráficas · bloques 17 y 18 ───
                  Cuelgan del espacio de la hoja y no de la ventana, y eso no es
                  un detalle de dónde poner un `div`: aquí dentro se desplazan
                  con la hoja, que es lo que hace que una gráfica anclada a `D2`
                  siga estando en `D2` después de bajar veinte filas. Colgadas de
                  la ventana se quedarían quietas mientras los datos se van.

                  Su sitio es la misma multiplicación que la de las filas y la
                  del tirador: celdas por ancho de celda (§39, «cuadricular, no
                  medir»). Ni una medida del DOM. */}
              {graficas.map((g) => {
                const enVuelo = arrastreGrafica?.id === g.id ? arrastreGrafica : null;
                const col = enVuelo ? enVuelo.col : g.ancla.col;
                const fila = enVuelo ? enVuelo.fila : g.ancla.fila;
                return (
                  <div
                    key={g.id}
                    className={`hjw-grafica${graficaSel === g.id ? ' es-activa' : ''}${enVuelo ? ' es-en-vuelo' : ''}`}
                    data-grafica={g.id}
                    data-control="grafica"
                    title={g.titulo ? `${g.titulo} · arrástrala para moverla` : 'Arrástrala para moverla'}
                    style={{
                      left: ANCHO_CAB + col * ANCHO_COL,
                      top: ALTO_CAB + puestoDeF(fila) * ALTO_FILA,
                      width: g.ancla.cols * ANCHO_COL,
                      height: g.ancla.filas * ALTO_FILA,
                    }}
                    onMouseDown={(e) => {
                      // `stopPropagation` para que agarrar la gráfica no cuente
                      // además como pinchar la celda que hay debajo: la gráfica
                      // tapa la rejilla, y lo que está debajo no se pulsa.
                      e.preventDefault();
                      e.stopPropagation();
                      setEditando(null);
                      setEnLaBarra(false);
                      setGraficaSel(g.id);
                      setArrastreGrafica({
                        id: g.id,
                        agarre: celdaBajoElRaton(e.nativeEvent),
                        desde: { col: g.ancla.col, fila: g.ancla.fila },
                        col: g.ancla.col,
                        fila: g.ancla.fila,
                      });
                    }}
                  >
                    <Grafica grafica={g} motor={motor} hoja={hojaId} />
                  </div>
                );
              })}

              {/* ─── las tablas · bloques 33-36 ───
                  El marco y la fila de totales, no el color de las celdas: eso
                  ya está mezclado dentro de `decoraciones`, arriba. Cuelgan del
                  espacio de la hoja con la misma multiplicación que el tirador
                  y las gráficas (`TablaVisual.tsx` explica por qué el marco no
                  se rompe con una tabla filtrada). */}
              {hojaActual &&
                tablas.map((t) => (
                  <TablaVisual
                    key={t.id}
                    tabla={t}
                    hoja={hojaActual}
                    motor={motor}
                    anchoCol={ANCHO_COL}
                    altoFila={ALTO_FILA}
                    anchoCab={ANCHO_CAB}
                    altoCab={ALTO_CAB}
                  />
                ))}

              {/* ─── las flechas de auditoría · bloque 47 ───
                  `flechasDeAuditoria` (consultas.ts) ya da `col`/`puesto` en
                  pantalla; aquí sólo se multiplica por `ANCHO_COL`/`ALTO_FILA`
                  como el tirador o el ancla de una gráfica (§39, «cuadricular,
                  no medir»). `col === null` es una flecha que no se puede
                  trazar aquí —el precedente o dependiente vive en OTRA
                  hoja—, y se pinta como un rótulo en vez de una línea:
                  `consultas.ts` deja dicho que ésa es decisión de quien
                  dibuja, no del motor. */}
              {flechasActivas.length > 0 && (
                <svg
                  className="hjw-flechas-auditoria"
                  data-flechas-auditoria={rastro?.direccion}
                  aria-hidden="true"
                  style={{
                    width: ANCHO_CAB + COLS_HOJA * ANCHO_COL,
                    height: ALTO_CAB + filasHoja * ALTO_FILA,
                  }}
                >
                  <defs>
                    <marker
                      id={idPuntaFlecha}
                      markerWidth="8"
                      markerHeight="8"
                      refX="6"
                      refY="3"
                      orient="auto"
                      markerUnits="userSpaceOnUse"
                    >
                      <path d="M0,0 L6,3 L0,6 Z" className="hjw-flecha-auditoria-punta" />
                    </marker>
                  </defs>
                  {rastro &&
                    (() => {
                      const ox = ANCHO_CAB + rastro.col * ANCHO_COL + ANCHO_COL / 2;
                      const oy = ALTO_CAB + puestoDeF(rastro.fila) * ALTO_FILA + ALTO_FILA / 2;
                      return (
                        <>
                          {flechasActivas
                            .filter((f) => f.col !== null && f.puesto !== null)
                            .map((f) => {
                              const tx = ANCHO_CAB + (f.col as number) * ANCHO_COL + ANCHO_COL / 2;
                              const ty = ALTO_CAB + (f.puesto as number) * ALTO_FILA + ALTO_FILA / 2;
                              // Precedentes: la flecha entra AL origen (de
                              // dónde viene el dato). Dependientes: la flecha
                              // SALE del origen (a quién alimenta).
                              const [x1, y1, x2, y2] =
                                rastro.direccion === 'precedentes' ? [tx, ty, ox, oy] : [ox, oy, tx, ty];
                              return (
                                <line
                                  key={f.celda}
                                  data-flecha-celda={f.celda}
                                  className="hjw-flecha-auditoria-linea"
                                  x1={x1}
                                  y1={y1}
                                  x2={x2}
                                  y2={y2}
                                  markerEnd={`url(#${idPuntaFlecha})`}
                                />
                              );
                            })}
                          <circle cx={ox} cy={oy} r={4} className="hjw-flecha-auditoria-origen" />
                        </>
                      );
                    })()}
                </svg>
              )}

              {/* Las flechas de auditoría que no se pueden trazar aquí:
                  viven en otra hoja, así que en vez de una línea se pinta un
                  rótulo con el nombre de esa hoja, junto a la celda de
                  origen. */}
              {rastro &&
                (() => {
                  const otras = flechasActivas.filter((f) => f.col === null);
                  if (!otras.length) return null;
                  return (
                    <div
                      className="hjw-chips-otra-hoja"
                      style={{
                        left: ANCHO_CAB + (rastro.col + 1) * ANCHO_COL + 4,
                        top: ALTO_CAB + puestoDeF(rastro.fila) * ALTO_FILA,
                      }}
                    >
                      {otras.map((f) => {
                        const p = partirClave(f.celda);
                        const nombreHoja = p ? (motor.libro.hojas.find((h) => h.id === p.hoja)?.nombre ?? p.hoja) : '?';
                        return (
                          <span key={f.celda} className="hjw-chip-otra-hoja" data-flecha-otra-hoja={f.celda}>
                            {rastro.direccion === 'precedentes' ? '↙' : '↗'} {nombreHoja}
                          </span>
                        );
                      })}
                    </div>
                  );
                })()}
            </div>
          </div>

          {/* ─── la paleta de la lengüeta ───
              Sale junto a las lengüetas y no colgando del botón de la cinta,
              porque es donde se va a ver el color: el alumno elige mirando la
              cosa que va a pintar. */}
          {paleta === 'color-hoja' && (
            <div className="hjw-paleta" role="group" aria-label="Color de la lengüeta">
              {PALETA_DE_HOJA.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  className="hjw-color"
                  data-color={c.hex}
                  title={c.nombre}
                  aria-label={c.nombre}
                  style={{ background: c.hex }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pulsar('color-hoja', c.hex)}
                />
              ))}
            </div>
          )}

          {/* ─── el panel «Diseño de gráfico» · bloque 18 ───
              Docked al borde de la hoja, como el «Formato de gráfico» de Excel
              de verdad, y no pegado a la gráfica: si siguiera al dibujo por la
              rejilla habría que recalcular su sitio en cada arrastre, y aquí
              «cuadricular, no medir» (§39) ya está pagado por `.hjw-hoja`, que
              es `position: relative` desde el primer día de esta sala. */}
          {graficaSeleccionada && !terminado && (
            <div className="hjw-panel-grafica" role="group" aria-label="Diseño de gráfico">
              <h3 className="hjw-panel-grafica-titulo">Diseño de gráfico</h3>
              <label className="hjw-panel-grafica-campo">
                <span>Título</span>
                <input
                  type="text"
                  data-control="grafica-titulo"
                  placeholder="Sin título"
                  key={`titulo-${graficaSeleccionada.id}-${graficaSeleccionada.titulo ?? ''}`}
                  defaultValue={graficaSeleccionada.titulo ?? ''}
                  onBlur={(e) => {
                    const v = e.target.value;
                    if (v !== (graficaSeleccionada.titulo ?? '')) {
                      cambiarCampoDeGrafica(graficaSeleccionada.id, 'titulo', v, 'grafica-titulo');
                    }
                  }}
                />
              </label>
              <label className="hjw-panel-grafica-campo">
                <span>Rango de datos</span>
                <input
                  type="text"
                  data-control="grafica-datos"
                  key={`datos-${graficaSeleccionada.id}-${graficaSeleccionada.datos}`}
                  defaultValue={graficaSeleccionada.datos}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== graficaSeleccionada.datos) {
                      cambiarCampoDeGrafica(graficaSeleccionada.id, 'datos', v, 'grafica-datos');
                    }
                  }}
                />
              </label>
              <label className="hjw-panel-grafica-campo">
                <span>Título del eje horizontal</span>
                <input
                  type="text"
                  data-control="grafica-eje-x"
                  placeholder="Sin título de eje"
                  key={`ejeX-${graficaSeleccionada.id}-${graficaSeleccionada.ejeX ?? ''}`}
                  defaultValue={graficaSeleccionada.ejeX ?? ''}
                  onBlur={(e) => {
                    const v = e.target.value;
                    if (v !== (graficaSeleccionada.ejeX ?? '')) {
                      cambiarCampoDeGrafica(graficaSeleccionada.id, 'ejeX', v, 'grafica-eje-x');
                    }
                  }}
                />
              </label>
              <label className="hjw-panel-grafica-campo">
                <span>Título del eje vertical</span>
                <input
                  type="text"
                  data-control="grafica-eje-y"
                  placeholder="Sin título de eje"
                  key={`ejeY-${graficaSeleccionada.id}-${graficaSeleccionada.ejeY ?? ''}`}
                  defaultValue={graficaSeleccionada.ejeY ?? ''}
                  onBlur={(e) => {
                    const v = e.target.value;
                    if (v !== (graficaSeleccionada.ejeY ?? '')) {
                      cambiarCampoDeGrafica(graficaSeleccionada.id, 'ejeY', v, 'grafica-eje-y');
                    }
                  }}
                />
              </label>
              <label className="hjw-panel-grafica-casilla">
                <input
                  type="checkbox"
                  data-control="grafica-leyenda"
                  checked={graficaSeleccionada.leyenda !== false}
                  onChange={(e) =>
                    cambiarCampoDeGrafica(graficaSeleccionada.id, 'leyenda', e.target.checked ? 1 : 0, 'grafica-leyenda')
                  }
                />
                <span>Leyenda</span>
              </label>
              <label className="hjw-panel-grafica-casilla">
                <input
                  type="checkbox"
                  data-control="grafica-rotulos-de-dato"
                  checked={graficaSeleccionada.rotulosDeDato === true}
                  onChange={(e) =>
                    cambiarCampoDeGrafica(
                      graficaSeleccionada.id,
                      'rotulosDeDato',
                      e.target.checked ? 1 : 0,
                      'grafica-rotulos-de-dato',
                    )
                  }
                />
                <span>Rótulos de dato</span>
              </label>
              {/*
                 El séptimo campo, para el bloque 38 («gráficas que mienten»):
                 `cambiarGrafica` sabe tocar `minY` desde el §45.5
                 (`CAMPOS_DE_GRAFICA.minY`), y hasta que lo pidió
                 `n6-elige-la-grafica` no había ni un cuadro que se lo pasara.
                 Vacío QUITA el corte —no lo pone en cero—, la misma regla
                 «vacío quita» que ya usa `grafica-datos`, así que se manda tal
                 cual el texto y es `CAMPOS_DE_GRAFICA.minY` quien decide qué
                 hacer con la cadena vacía. */}
              <label className="hjw-panel-grafica-campo">
                <span>Eje mínimo (Y)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  data-control="grafica-min-y"
                  placeholder="Automático (cero)"
                  key={`minY-${graficaSeleccionada.id}-${graficaSeleccionada.minY ?? ''}`}
                  defaultValue={graficaSeleccionada.minY ?? ''}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v !== String(graficaSeleccionada.minY ?? '')) {
                      cambiarCampoDeGrafica(graficaSeleccionada.id, 'minY', v, 'grafica-min-y');
                    }
                  }}
                />
              </label>
            </div>
          )}

          {/* ─── las pestañas de hoja ─── */}
          <div className="hjw-pestanas" data-control="pestanas-de-hoja">
            {/*
             * `oculta` (bloque 42, `modelo.ts`) existía desde el paquete
             * VALIDACIÓN «sin un botón que lo encienda todavía» y **sin que
             * esta lista lo leyera tampoco** — su propio comentario lo dice:
             * «SIN_CONSTRUIR por el lado de apagar una hoja». `n6-interpreta-
             * la-informacion` (16-ago-2026) es la primera clase que de verdad
             * necesita una hoja escondida para que «inspeccionar» tenga algo
             * que contar, y sin este filtro la lengüeta se pintaba igual que
             * cualquier otra: una hoja «escondida» que se ve no esconde nada.
             */}
            {motor.libro.hojas.filter((h) => h.oculta !== true).map((h) =>
              renombrando?.hoja === h.id ? (
                <span key={h.id} className="hjw-hoja-tab es-activa" data-hoja={h.id}>
                  <input
                    autoFocus
                    className="hjw-hoja-nombre"
                    aria-label="Nombre de la hoja"
                    value={renombrando.texto}
                    onChange={(e) => setRenombrando({ hoja: h.id, texto: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmarNombre();
                      if (e.key === 'Escape') setRenombrando(null);
                    }}
                    onBlur={confirmarNombre}
                  />
                </span>
              ) : (
                <button
                  key={h.id}
                  type="button"
                  data-hoja={h.id}
                  className={`hjw-hoja-tab${h.id === hojaId ? ' es-activa' : ''}`}
                  // El color de la lengüeta va en línea a propósito: gana a la
                  // regla de `.es-activa`, que es lo que se quiere —una hoja
                  // pintada se reconoce esté activa o no—.
                  style={h.color ? { borderBottomColor: h.color } : undefined}
                  title={`${h.nombre} · doble clic para cambiarle el nombre`}
                  onMouseDown={() => {
                    arrastrandoHoja.current = h.id;
                  }}
                  /*
                   * Arrastrar una lengüeta encima de otra la muda de sitio, que
                   * es como se mueve una hoja en Excel y lo que dice el propio
                   * botón «Mover hoja» de la cinta cuando está apagado. Se
                   * resuelve por **qué lengüeta hay debajo del ratón al soltar**
                   * y no por geometría: aquí no hay nada que medir ni
                   * tolerancias que afinar.
                   */
                  onMouseUp={() => {
                    const suelta = arrastrandoHoja.current;
                    arrastrandoHoja.current = null;
                    if (!suelta || suelta === h.id) return;
                    setAviso(null);
                    if (esDesvioYSeAvisa(`hoja:${suelta}`)) return;
                    const posicion = motor.libro.hojas.findIndex((x) => x.id === h.id);
                    ejecutarGestos([{ comando: 'moverHoja', args: { hoja: suelta, posicion } }], {
                      control: `hoja:${suelta}`,
                    });
                  }}
                  onDoubleClick={() => {
                    setAviso(null);
                    if (esDesvioYSeAvisa(`hoja:${h.id}`)) return;
                    setRenombrando({ hoja: h.id, texto: h.nombre });
                  }}
                  onClick={() => {
                    setAviso(null);
                    if (esDesvioYSeAvisa(`hoja:${h.id}`)) return;
                    ejecutarGestos([{ comando: 'activarHoja', args: { hoja: h.id } }], {
                      control: `hoja:${h.id}`,
                    });
                  }}
                >
                  {h.nombre}
                </button>
              ),
            )}
            <button
              type="button"
              className="hjw-hoja-mas"
              aria-label="Hoja nueva"
              title="Hoja nueva"
              onClick={() => {
                setAviso(null);
                if (esDesvioYSeAvisa('nueva-hoja')) return;
                // El id va en el gesto y no se inventa aquí: una macro que
                // fabrica identificadores al vuelo no se puede reproducir dos
                // veces con el mismo resultado (§45.6).
                const n = motor.libro.hojas.length + 1;
                ejecutarGestos(
                  [{ comando: 'nuevaHoja', args: { id: `h${n}`, nombre: `Hoja${n}` } }],
                  { control: 'nueva-hoja' },
                );
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* `hjw-panel-clase` y NO `txtw-panel-derecha`, que existe en el chrome
            y es otra cosa: el racimo de la CABECERA del panel, con su
            `display:flex; align-items:center`. Puesto en un `<aside>` le daba la
            vuelta al panel entero —contenido en fila y centrado— y además
            faltaba la columna en la rejilla, así que se salía por debajo. */}
        {panelFijo && (
          <aside className="txtw-panel hjw-panel-clase">
            <div className="txtw-panel-cab">
              <span className="txtw-panel-titulo">{panelFijo.titulo}</span>
            </div>
            <div className="txtw-panel-cuerpo">
              <panelFijo.Cuerpo
                libro={motor.libro}
                motor={motor}
                hoja={hojaId}
                sel={sel}
                gesto={(control, valor) => pulsar(control, valor)}
              />
            </div>
          </aside>
        )}

        <PanelMaestro
          onVerObjetivos={guion.portada ? () => setEmpezado(false) : undefined}
          guion={guionVisible}
          paso={paso}
          fallos={fallos}
          celebrando={celebrando}
          terminado={terminado}
          erro={erro}
          aviso={aviso}
          rehacer={false}
          sitio={sitioGuia}
          queHace={guiado?.queHace}
          // El primero de la lista: es al que apunta el aro y del que habla la
          // ficha, y «Enséñamelo» lo busca por su `data-control` en el DOM.
          senalado={pasoActual?.senal?.control ? primeroDeLaSenal(pasoActual.senal.control) : undefined}
          onDemostrar={() => setDemostrando((x) => !x)}
          demostrando={demostrando}
          onElegir={elegir}
          onConfirmar={() => setPaso((n) => n + 1)}
          cierrePorOmision={guion.cierre}
        />
      </div>

      {/*
       * El desplegable de una validación de LISTA (bloque 32), colgado de
       * `document.body` con un portal y no dentro de la celda: la celda
       * recorta su contenido con `overflow: hidden` —lo necesita para el
       * texto que no cabe— y un desplegable que viviera ahí dentro se vería
       * cortado por la misma raya que corta un texto largo. `x`/`y` son la
       * esquina de la celda en la PANTALLA (`getBoundingClientRect`, tomada
       * al abrir la flecha), así que la lista siempre cae justo debajo de
       * donde se pulsó, tanto si la hoja está desplazada como si no.
       */}
      {listaAbierta &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="hjw-lista-validacion"
            data-lista-validacion={listaAbierta.d}
            style={{ left: listaAbierta.x, top: listaAbierta.y, minWidth: listaAbierta.ancho }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {listaAbierta.opciones.map((opcion) => (
              <button
                key={opcion}
                type="button"
                className="hjw-lista-validacion-opcion"
                onClick={() => {
                  const { d } = listaAbierta;
                  setListaAbierta(null);
                  ejecutarGestos([{ comando: 'escribir', args: { hoja: hojaId, celda: d, crudo: opcion } }], {
                    control: 'validar',
                  });
                }}
              >
                {opcion}
              </button>
            ))}
          </div>,
          document.body,
        )}

      {/* ─── la barra de estado ─── */}
      <div className="txtw-estado">
        <span>{terminado ? 'Terminado' : `Encargo ${Math.min(paso + 1, guion.pasos.length)} de ${guion.pasos.length}`}</span>
        <span className="txtw-estado-hueco" />
        {motor.circulares.length > 0 && (
          <span className="hjw-circular">⟳ Referencias circulares: {motor.circulares.join(', ')}</span>
        )}
        {mensajeDeValidacion && <span className="hjw-mensaje-validacion">ℹ {mensajeDeValidacion}</span>}
        {cuenta.n > 0 && (
          <span className="hjw-cuenta">
            <span>
              Recuento: <b>{cuenta.n}</b>
            </span>
            <span>
              Suma: <b>{cuenta.suma}</b>
            </span>
          </span>
        )}
        <span className="txtw-zoom">
          <span className="txtw-zoom-cifra">100 %</span>
        </span>
      </div>

      {accesorios}

      {Backstage && enArchivo && (
        <Backstage
          libro={motor.libro}
          motor={motor}
          archivo={guion.archivo}
          cerrar={() => setEnArchivo(false)}
          gesto={(gestos, control) => ejecutarGestos(gestos, control ? { control } : {})}
          avisar={(control) => evaluar(motor.libro, control ? { control } : {})}
        />
      )}

      {cajaHalo && !enArchivo && (
        <div
          className={`txtw-halo${demostrando ? ' es-demo' : ''}${cajaHalo.l < 90 ? ' es-izq' : ''}`}
          aria-hidden="true"
          style={{
            left: cajaHalo.l - 5,
            top: cajaHalo.t - 5,
            width: cajaHalo.w + 10,
            height: cajaHalo.h + 10,
          }}
        >
          {rotulo && (
            <span
              className="txtw-halo-rotulo"
              style={cajaHalo.pie !== null ? { top: cajaHalo.pie - (cajaHalo.t - 5) + 9 } : undefined}
            >
              {rotulo}
            </span>
          )}
        </div>
      )}

      {/* La portada de objetivos: entrar a un laboratorio sin saber el tema ni
          el objetivo es un defecto, no una economía. */}
      {!empezado && guion.portada && (
        <PortadaPractica
          portada={guion.portada}
          archivo={guion.archivo}
          encargos={guion.pasos.length}
          minutos={minutos}
          insignia={insignia}
          onEmpezar={() => {
            // El reloj sólo arranca la primera vez: la portada se puede volver
            // a abrir a mitad de práctica —es lo que hace el botón ⓘ del
            // panel— y reiniciarlo ahí regalaría el tiempo de la partida.
            if (!yaEntro.current) arranque.current = Date.now();
            yaEntro.current = true;
            setEmpezado(true);
          }}
          esRepaso={yaEntro.current}
          guardado={false}
          onEmpezarDeCero={() => {
            setCaja({ motor: crearMotor(guion.libro(), CONTEXTO_RELOJ) });
            setEmpezado(true);
            setPaso(0);
            arranque.current = Date.now();
            /*
             * LA BANDEJA DE LA IMPRESORA TAMBIÉN SE VACÍA (1-sep-2026, auditoría).
             *
             * `TRABAJOS` vive fuera del libro, a nivel de módulo, y sólo se
             * acumula. `of-excel-dashboard` cierra su último encargo con
             * `seEntregoEnUnaPagina()`, que pregunta si en esa bandeja hay un
             * trabajo de la hoja «Tablero» a una página. Su `Lab.tsx` la vacía,
             * pero sólo en el `useEffect` de montaje — y «Empezar de cero» no
             * remonta nada: cambia el estado de esta misma ventana. Resultado
             * medido: quien terminaba la clase y volvía a empezarla encontraba el
             * encargo final —el cierre del temario entero de Excel— ya cumplido,
             * con el rastro de la partida anterior. Empezar de cero es empezar de
             * cero también aquí.
             */
            reiniciarImpresora();
          }}
          abrir="Abrir el libro"
          volver="Volver al libro"
        />
      )}
    </div>
  );

  return hueco ? createPortal(ventana, hueco) : null;
}

export { comoLlegar, QUE_HACE_PESTANA_EXCEL };
