'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import type { Base } from '@/components/simuladores/datos';
import {
  useDatos,
  VentanaDatos,
  type EjecucionSQL,
  type GuionDatos,
  type ResultadoSQL,
} from '@/components/simuladores/datos/ventana';
import { ArcadeSala, useBit } from '../../n1/arcade/ArcadeSala';
import { useLabActividad } from '../../lib/useLabActividad';
import { PortadaDatos, type DatosPortadaDatos } from '../../datos/PortadaDatos';
import '../../datos/salaDatos.css';
import VentanaHojas from '@/components/office/VentanaHojas';
import { CINTA_EXCEL_BASICO } from '../../office/tecniaHojas';
import { crearMotor } from '@/components/office/motor-hojas/formula/calculo';
import { crudoDe, estaVacia, rangosEn, usaFuncion, vale } from '@/components/office/motor-hojas/consultas';
import { RELOJ_DE_LA_CLASE, type GuionHojas } from '@/components/office/motor-hojas/guion';
import type { Celda, Libro } from '@/components/office/motor-hojas/modelo';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * N10 · «Bases de datos y SQL», parada 3 de 3 · `n10-conecta-tus-datos`
 * CIERRE de la unidad · Bachillerato · 15–18 años
 * ══════════════════════════════════════════════════════════════════════════
 *
 * El diseño que este archivo implementa (decidido antes de escribir código):
 * **no existe una integración en vivo SQL↔hojas de cálculo, y no hace falta
 * inventar una.** Lo honesto es exactamente lo que hace cualquier analista de
 * datos cuando exporta una consulta a CSV: dos programas reales, ya probados
 * por separado, y la habilidad de traducir un dato de uno a otro a mano.
 *
 * Por eso esta clase monta DOS motores reales, uno después del otro, y
 * ninguno finge hablar con el otro:
 *
 *   FASE 1 · `useDatos`/`VentanaDatos` (`simuladores/datos/`) — el mismo motor
 *   SQL real de `n10-consultas-sql`, con una base de TecniMarket ya modelada
 *   (ventas + productos). Aquí es donde por fin se usan COUNT/SUM/GROUP
 *   BY/HAVING: `subconjunto.ts` los reserva explícitamente para esta fila del
 *   canon («si ninguna clase agrupa, sobran» — ver `n10-consultas-sql`, que a
 *   propósito NO los usa).
 *
 *   FASE 2 · `VentanaHojas` (`office/`), el mismo evaluador de fórmulas real
 *   de N8 y del bloque de Excel. El alumno TRANSCRIBE a mano los tres números
 *   que acaba de leer en SQL y los analiza con SUMA, MAX, PROMEDIO y
 *   CONTAR.SI — un conteo condicional, que es «el WHERE de una hoja».
 *
 * Entre las dos hay una pantalla de traslado, no una barra de progreso que
 * mienta: dice explícitamente que ningún cable conecta los dos programas y
 * que el paso siguiente es leer y escribir a mano.
 *
 * ── Por qué NO se reutiliza `SalaDatos` ────────────────────────────────────
 *
 * `SalaDatos` (`activities/datos/SalaDatos.tsx`) es el chasis de las clases
 * de SQL sueltas: un solo motor, una sola pantalla final con insignia. Aquí
 * hacen falta DOS motores en secuencia y una sola insignia al final de la
 * segunda — así que esta clase escribe su propio chasis, calcado de
 * `SalaDatos` en la fase SQL (mismo `useDatos`/`VentanaDatos`/`VentanaBase`,
 * mismo `PortadaDatos`, misma disciplina de puntaje) y entregando el control
 * entero a `VentanaHojas` —que ya trae su propia portada y su propia pantalla
 * final— en la fase de la hoja.
 *
 * ── El progreso combinado ──────────────────────────────────────────────────
 *
 * `useLabActividad` lleva un único contador de encargos (`TOTAL_PASOS` = los
 * de SQL + los de la hoja) para que la barra de progreso del anfitrión no
 * retroceda al cambiar de fase. `useDatos.onAvance` ya dispara una vez por
 * encargo recién hecho (visto en su propio código, con su propio
 * `avisadosRef`), así que en la fase SQL cada disparo es un `avanzar()`
 * directo. `VentanaHojas.onAvance` en cambio manda una FRACCIÓN acumulada
 * (`hechos/total` de SU PROPIO guion) en un efecto que puede repetirse sin
 * que cambie el número de encargos hechos; por eso ahí se traduce fracción →
 * hechos con una resta contra el último valor visto, y sólo se llama a
 * `avanzar()` por el delta. Ninguna de las dos fases toca `onComplete`
 * directamente: sólo la fase de la hoja, al terminar, calcula el puntaje
 * combinando SUS tropiezos con los que ya llevaba la fase SQL.
 */

/* ═══════════════════════ TecniMarket: los datos ═══════════════════════════
 *
 * La misma empresa de `n10-python-intermedio» («TecniMarket cerró la semana
 * y necesita su reporte de ventas»): no se inventa una empresa nueva para
 * esta parada. Dos tablas, con la clave foránea de verdad —`producto_id`
 * apunta a `productos.id`, y aquí SIN ningún NULL: esa lección ya la dio
 * `n10-consultas-sql` y no se repite— y una relación 1:N típica de un
 * catálogo de ventas.
 */

const PRODUCTOS: Base['tablas'][number] = {
  nombre: 'productos',
  columnas: [
    { nombre: 'id', tipo: 'entero', clavePrimaria: true, noNulo: true, referencia: null },
    { nombre: 'nombre', tipo: 'texto', clavePrimaria: false, noNulo: true, referencia: null },
    { nombre: 'categoria', tipo: 'texto', clavePrimaria: false, noNulo: true, referencia: null },
    { nombre: 'precio', tipo: 'real', clavePrimaria: false, noNulo: true, referencia: null },
  ],
  filas: [
    [1, 'Teclado mecánico', 'Periféricos', 850],
    [2, 'Mouse inalámbrico', 'Periféricos', 320],
    [3, 'Monitor 24 pulgadas', 'Pantallas', 3200],
    [4, 'Audífonos Bluetooth', 'Audio', 540],
    [5, 'Bocina portátil', 'Audio', 610],
    [6, 'Webcam HD', 'Periféricos', 450],
  ],
};

const VENTAS: Base['tablas'][number] = {
  nombre: 'ventas',
  columnas: [
    { nombre: 'id', tipo: 'entero', clavePrimaria: true, noNulo: true, referencia: null },
    {
      nombre: 'producto_id',
      tipo: 'entero',
      clavePrimaria: false,
      noNulo: true,
      referencia: { tabla: 'productos', columna: 'id' },
    },
    { nombre: 'cantidad', tipo: 'entero', clavePrimaria: false, noNulo: true, referencia: null },
    { nombre: 'fecha', tipo: 'fecha', clavePrimaria: false, noNulo: true, referencia: null },
  ],
  filas: [
    [101, 1, 3, '2026-08-03'],
    [102, 2, 5, '2026-08-03'],
    [103, 3, 1, '2026-08-04'],
    [104, 4, 2, '2026-08-05'],
    [105, 5, 4, '2026-08-05'],
    [106, 1, 2, '2026-08-06'],
    [107, 6, 3, '2026-08-06'],
    [108, 4, 1, '2026-08-07'],
    [109, 2, 2, '2026-08-07'],
    [110, 3, 1, '2026-08-08'],
  ],
};

const BASE_TECNIMARKET: Base = { tablas: [PRODUCTOS, VENTAS] };

/**
 * Los tres totales por categoría, calculados a mano trazando el motor real
 * (`SUM(cantidad * precio) GROUP BY categoria`, ver la cabecera de
 * `motor.ts`): Periféricos = 3·850 + 5·320 + 2·850 + 3·450 + 2·320 = 7840;
 * Pantallas = 1·3200 + 1·3200 = 6400; Audio = 2·540 + 4·610 + 1·540 = 4060.
 * Es la misma cuenta que hace el predicado del encargo 3 y la que el alumno
 * va a transcribir en la fase de la hoja.
 */
const RESULTADOS_A_TRASLADAR: { categoria: string; total: number }[] = [
  { categoria: 'Periféricos', total: 7840 },
  { categoria: 'Pantallas', total: 6400 },
  { categoria: 'Audio', total: 4060 },
];

const TOTAL_POR_CATEGORIA: Record<string, number> = Object.fromEntries(
  RESULTADOS_A_TRASLADAR.map((r) => [r.categoria, r.total]),
);

/** Cuántas ventas tiene cada categoría — el encargo 2, antes de sumar dinero. */
const VENTAS_POR_CATEGORIA: Record<string, number> = { Periféricos: 5, Pantallas: 2, Audio: 3 };

/* ═══════════════════════ FASE 1 · la consulta SQL ═════════════════════════ */

const PLANTILLA_SQL = ['-- consulta_ventas.sql · TecniMarket', ''].join('\n');

function ultimoResultado(e: EjecucionSQL): ResultadoSQL | null {
  return e.resultados.at(-1) ?? null;
}

function indiceCol(r: ResultadoSQL, nombre: string): number {
  return r.columnas.findIndex((c) => c.nombre.toLowerCase() === nombre.toLowerCase());
}

const GUION_SQL: GuionDatos = {
  pasos: [
    {
      id: 'une-las-tablas',
      titulo: 'Une ventas con productos',
      instruccion:
        'ventas sólo guarda el id del producto; el nombre de la categoría y el precio viven en productos. Únelas:\nSELECT p.categoria, v.cantidad, p.precio FROM ventas v JOIN productos p ON v.producto_id = p.id;',
      pista: 'SELECT p.categoria, v.cantidad, p.precio FROM ventas v JOIN productos p ON v.producto_id = p.id;',
      senal: { control: 'ejecutar' },
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => {
          if (!e.ok) return false;
          const r = ultimoResultado(e);
          if (!r || r.filas.length !== 10) return false;
          return indiceCol(r, 'categoria') >= 0 && indiceCol(r, 'cantidad') >= 0 && indiceCol(r, 'precio') >= 0;
        },
      },
      aprendido:
        'Cada venta ya trae su categoría y su precio al lado: JOIN puso en la MISMA fila datos que vivían en dos tablas distintas.',
    },
    {
      id: 'categorias-activas',
      titulo: 'Las categorías con más movimiento',
      instruccion:
        'Cuenta cuántas ventas tiene cada categoría, y quédate sólo con las que tienen 3 o más:\nSELECT p.categoria, COUNT(*) AS ventas FROM ventas v JOIN productos p ON v.producto_id = p.id GROUP BY p.categoria HAVING COUNT(*) >= 3;',
      pista:
        'SELECT p.categoria, COUNT(*) AS ventas FROM ventas v JOIN productos p ON v.producto_id = p.id GROUP BY p.categoria HAVING COUNT(*) >= 3;',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => {
          if (!e.ok) return false;
          const r = ultimoResultado(e);
          if (!r || r.filas.length !== 2) return false;
          const ic = indiceCol(r, 'categoria');
          const iv = indiceCol(r, 'ventas');
          if (ic < 0 || iv < 0) return false;
          return r.filas.every((f) => {
            const cat = String(f[ic]);
            return cat !== 'Pantallas' && VENTAS_POR_CATEGORIA[cat] === f[iv];
          });
        },
      },
      aprendido:
        'HAVING filtra GRUPOS, no filas: Pantallas se quedó fuera porque sólo tiene 2 ventas, aunque cada una sea perfectamente válida.',
    },
    {
      id: 'total-por-categoria',
      titulo: 'Lo que de verdad vas a llevar a la hoja',
      instruccion:
        'Ahora la cuenta que importa: cuánto dinero entró por categoría. cantidad × precio, sumado y agrupado:\nSELECT p.categoria, SUM(v.cantidad * p.precio) AS total FROM ventas v JOIN productos p ON v.producto_id = p.id GROUP BY p.categoria;',
      pista:
        'SELECT p.categoria, SUM(v.cantidad * p.precio) AS total FROM ventas v JOIN productos p ON v.producto_id = p.id GROUP BY p.categoria;',
      senal: { control: 'ejecutar' },
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => {
          if (!e.ok) return false;
          const r = ultimoResultado(e);
          if (!r || r.filas.length !== 3) return false;
          const ic = indiceCol(r, 'categoria');
          const it = indiceCol(r, 'total');
          if (ic < 0 || it < 0) return false;
          return r.filas.every((f) => TOTAL_POR_CATEGORIA[String(f[ic])] === f[it]);
        },
      },
      aprendido: 'Tres filas, tres números: eso es exactamente lo que vas a transcribir en la hoja dentro de un momento. Apúntalos.',
    },
    {
      id: 'por-que-el-join-primero',
      titulo: 'Antes de salir de aquí',
      instruccion:
        'v.cantidad y p.precio están en tablas distintas, y el SUM de arriba las multiplicó juntas, fila por fila. ¿Por qué eso sólo funciona DESPUÉS del JOIN, y no antes?',
      pista: 'Antes del JOIN, cada fila de ventas no tiene ningún precio al lado: el precio vive en otra tabla.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Porque JOIN ordena las dos tablas alfabéticamente antes de sumar',
          'Porque JOIN pone en la MISMA fila los datos de las dos tablas, y sólo entonces se pueden multiplicar juntos',
          'Porque SUM exige que las dos tablas tengan el mismo número de columnas',
        ],
        correcta: 1,
      },
      aprendido:
        'Eso es: multiplicar cantidad × precio sólo tiene sentido si los dos números están en la MISMA fila, y eso es exactamente lo que arma un JOIN.',
    },
  ],
  cierre: 'Uniste dos tablas, filtraste grupos con HAVING y sumaste con GROUP BY: los tres números que vas a llevar a la hoja ya están en pantalla.',
};

const SQL_PASOS_TOTAL = GUION_SQL.pasos.length;

const PORTADA_SQL: DatosPortadaDatos = {
  situacion: 'TecniMarket · Parada 3 de 3 · El cierre de la unidad',
  tema: 'Conecta datos con hojas y apps',
  objetivo:
    'Vas a correr una consulta SQL real sobre las ventas de TecniMarket, leer lo que el motor te devuelve, y llevar esos números a mano a una hoja de cálculo real para seguir analizándolos con fórmulas.',
  vasAHacer: [
    'Unir ventas con productos para saber la categoría y el precio de cada una.',
    'Agrupar con HAVING y quedarte sólo con las categorías más activas.',
    'Sumar cuánto entró por categoría con SUM y GROUP BY.',
    'Transcribir esos totales a una hoja de cálculo real y sacarles SUMA, MAX, PROMEDIO y un conteo condicional.',
  ],
};

/* ═══════════════════════ FASE 2 · la hoja de cálculo ══════════════════════ */

const HOJA = 'h1';

const fuerte = (crudo: string): Celda => ({ crudo, formato: { tipo: 'general', negrita: true } });
const suelta = (crudo: string): Celda => ({ crudo });

/**
 * «Resumen de ventas · TecniMarket.xlsx», vacío en la columna de totales a
 * propósito: esos tres números no salen de ninguna fórmula de la hoja, salen
 * de lo que el alumno acaba de leer en `consulta_ventas.sql` y tiene que
 * escribir él mismo. Función y no constante por lo que ya explica
 * `motor-hojas/guion.ts`: «Empezar de cero» tiene que poder reconstruirla.
 */
function libroDeTecniMarket(): Libro {
  return {
    activa: HOJA,
    nombres: {},
    hojas: [
      {
        id: HOJA,
        nombre: 'Resumen',
        celdas: {
          A1: fuerte('Resumen de ventas por categoría · TecniMarket'),
          A3: fuerte('Categoría'),
          B3: fuerte('Total vendido'),
          A4: suelta('Periféricos'),
          A5: suelta('Pantallas'),
          A6: suelta('Audio'),
          A8: suelta('Total general'),
          A9: suelta('Monto de la categoría que más vendió'),
          A10: suelta('Promedio de venta por categoría'),
          A11: suelta('Categorías que superan los 5,000 pesos'),
        },
      },
    ],
  };
}

/* ── lo que el maestro le pregunta a la hoja ─────────────────────────────── */

const motorDe = (libro: Libro) => crearMotor(libro, RELOJ_DE_LA_CLASE);
const rangoDe = (libro: Libro, direccion: string): string => rangosEn(libro, HOJA, direccion).join();

/** Encargo 1: los tres totales que se leyeron en SQL, transcritos a mano. */
function losTresTotalesEstanPuestos(libro: Libro): boolean {
  const motor = motorDe(libro);
  return (
    !estaVacia(libro, HOJA, 'B4') &&
    vale(motor, HOJA, 'B4', 7840) &&
    !estaVacia(libro, HOJA, 'B5') &&
    vale(motor, HOJA, 'B5', 6400) &&
    !estaVacia(libro, HOJA, 'B6') &&
    vale(motor, HOJA, 'B6', 4060)
  );
}

/** Encargo 2: el total general, con SUMA de verdad sobre el rango de los tres. */
function elTotalGeneralEstaSumado(libro: Libro): boolean {
  if (!losTresTotalesEstanPuestos(libro)) return false;
  const motor = motorDe(libro);
  return usaFuncion(libro, HOJA, 'B8', 'SUMA') && rangoDe(libro, 'B8') === 'B4:B6' && vale(motor, HOJA, 'B8', 18300);
}

/** Encargo 3: el monto más alto de las tres categorías, con MAX. */
function elMaximoEstaPuesto(libro: Libro): boolean {
  if (!elTotalGeneralEstaSumado(libro)) return false;
  const motor = motorDe(libro);
  return usaFuncion(libro, HOJA, 'B9', 'MAX') && rangoDe(libro, 'B9') === 'B4:B6' && vale(motor, HOJA, 'B9', 7840);
}

/** Encargo 4: el promedio de las tres categorías, con PROMEDIO. */
function elPromedioEstaPuesto(libro: Libro): boolean {
  if (!elMaximoEstaPuesto(libro)) return false;
  const motor = motorDe(libro);
  return usaFuncion(libro, HOJA, 'B10', 'PROMEDIO') && rangoDe(libro, 'B10') === 'B4:B6' && vale(motor, HOJA, 'B10', 6100);
}

/**
 * Encargo 5: el conteo condicional. `CONTAR.SI` es el `WHERE` de una hoja de
 * cálculo, condensado en una función — el mismo criterio de una consulta,
 * pero sin escribir SELECT.
 */
function elConteoCondicionalEstaPuesto(libro: Libro): boolean {
  if (!elPromedioEstaPuesto(libro)) return false;
  const motor = motorDe(libro);
  return (
    usaFuncion(libro, HOJA, 'B11', 'CONTAR.SI') &&
    rangoDe(libro, 'B11') === 'B4:B6' &&
    crudoDe(libro, HOJA, 'B11').includes('5000') &&
    vale(motor, HOJA, 'B11', 2)
  );
}

const GUION_HOJAS: GuionHojas = {
  archivo: 'Resumen de ventas · TecniMarket.xlsx',
  libro: libroDeTecniMarket,
  portada: {
    situacion: 'Excel · TecniMarket · Lo que recibe tu consulta',
    tema: 'De la consulta a la hoja',
    objetivo:
      'Vas a transcribir a mano los tres totales que acabas de leer en consulta_ventas.sql y a analizarlos con fórmulas reales: SUMA, MAX, PROMEDIO y un conteo condicional.',
    vasAHacer: [
      'Escribir los tres totales por categoría, tal como los leíste en consulta_ventas.sql.',
      'Sumarlos con una fórmula real.',
      'Encontrar el monto más alto y el promedio de los tres.',
      'Contar cuántas categorías superan los 5,000 pesos con CONTAR.SI.',
    ],
    requisitos:
      'Los tres totales que acabas de calcular en consulta_ventas.sql, tal como los viste en la pantalla anterior: uno por categoría.',
    ayuda: 'Toda fórmula empieza por =. Para corregir una celda ya escrita: doble clic, o F2.',
  },
  pasos: [
    {
      id: 'los-tres-totales',
      titulo: 'Transcribe lo que leíste en SQL',
      instruccion:
        'Escribe los tres totales que calculaste en consulta_ventas.sql: Periféricos en B4, Pantallas en B5 y Audio en B6.',
      pista: 'Son los mismos tres números de la pantalla de traslado: 7840, 6400 y 4060, cada uno en su renglón.',
      senal: { control: 'celda:B4' },
      logro: { tipo: 'documento', comprueba: losTresTotalesEstanPuestos },
      aprendido:
        'Ningún cable movió esos números: los leíste en un programa y los volviste a escribir en otro. Esa lectura y esa transcripción SON la conexión — no hay otra.',
    },
    {
      id: 'total-general',
      titulo: 'El total general, con una fórmula',
      instruccion: 'Ponte en B8 y escribe =SUMA(B4:B6).',
      pista: 'B4, B5 y B6 son los tres totales que acabas de transcribir. =SUMA(B4:B6) los suma en un solo número.',
      senal: { control: 'celda:B8' },
      logro: { tipo: 'documento', comprueba: elTotalGeneralEstaSumado },
      aprendido:
        'Salió 18300 — la misma cantidad que sumarías si volvieras a consulta_ventas.sql y contaras las tres filas. Dos programas distintos, el mismo dinero.',
    },
    {
      id: 'el-mas-alto',
      titulo: 'La categoría que más vendió',
      instruccion: 'Ponte en B9 y escribe =MAX(B4:B6).',
      pista: 'MAX se escribe igual que SUMA, con el mismo rango: =MAX(B4:B6).',
      senal: { control: 'celda:B9' },
      logro: { tipo: 'documento', comprueba: elMaximoEstaPuesto },
      aprendido: 'Periféricos, con 7840 — la misma cifra que ya tenías en B4. MAX no inventa nada: sólo señala cuál de los tres ya escritos es el más grande.',
    },
    {
      id: 'el-promedio',
      titulo: 'El promedio de las tres categorías',
      instruccion: 'Ponte en B10 y escribe =PROMEDIO(B4:B6).',
      pista: '=PROMEDIO(B4:B6), el mismo rango otra vez.',
      senal: { control: 'celda:B10' },
      logro: { tipo: 'documento', comprueba: elPromedioEstaPuesto },
      aprendido: '6100: (7840 + 6400 + 4060) entre las tres categorías. Ni una decimal de por medio — con estos números, la división cae exacta.',
    },
    {
      id: 'el-conteo-condicional',
      titulo: 'Cuántas categorías superan los 5,000',
      instruccion: 'Ponte en B11 y escribe =CONTAR.SI(B4:B6,">5000").',
      pista: 'CONTAR.SI necesita dos cosas: el rango (B4:B6) y la condición (">5000"), separados por una coma.',
      senal: { control: 'celda:B11' },
      logro: { tipo: 'documento', comprueba: elConteoCondicionalEstaPuesto },
      aprendido:
        'Salió 2: Periféricos y Pantallas pasan de 5,000; Audio no. CONTAR.SI es el WHERE de una hoja de cálculo, condensado en una sola función.',
    },
    {
      id: 'que-hiciste',
      titulo: 'Antes de cerrar',
      instruccion: 'En una frase: ¿qué acabas de hacer en esta práctica?',
      pista: 'Piensa en los dos programas que abriste, y en qué hiciste TÚ entre uno y otro.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Conectar automáticamente la base de datos con la hoja, para que se actualicen solas',
          'Leer un resultado real de SQL y traducirlo a mano a una hoja de cálculo real, para seguir analizándolo con fórmulas reales',
          'Copiar la base de datos completa dentro de la hoja de cálculo',
        ],
        correcta: 1,
      },
      aprendido:
        'Eso es exactamente lo que hace un analista de datos de verdad cuando exporta una consulta a CSV: dos programas reales, y la habilidad de traducir un dato de uno a otro. Nunca una sincronización mágica.',
    },
  ],
  cierre:
    'Leíste un resultado real de SQL, lo transcribiste a mano y lo analizaste con fórmulas reales de hoja de cálculo: SUMA, MAX, PROMEDIO y un conteo condicional. Con esto cierras Bases de datos y SQL.',
};

const HOJA_PASOS_TOTAL = GUION_HOJAS.pasos.length;
const TOTAL_PASOS = SQL_PASOS_TOTAL + HOJA_PASOS_TOTAL;

/* ═══════════════════════ la pantalla de traslado ═══════════════════════════
 *
 * No es una barra de progreso ni una animación de «sincronizando»: es una
 * frase honesta. Ningún cable conecta un motor SQL con una hoja de cálculo,
 * ni aquí ni en ningún programa de verdad — lo que hay es un resultado en
 * pantalla y alguien que lo lee y lo escribe donde hace falta.
 */

function PantallaTraslado({ onContinuar }: { onContinuar: () => void }) {
  return (
    <div className="sql-portada" role="dialog" aria-modal="true" aria-label="Lleva tus resultados a la hoja de cálculo" data-testid="traslado-portada">
      <div className="sql-portada-caja">
        <p className="sql-portada-situacion">consulta_ventas.sql → Resumen de ventas · TecniMarket.xlsx</p>
        <h2 className="sql-portada-tema">Ahora el puente lo haces tú</h2>

        <div className="sql-portada-objetivo">
          <p>
            Este motor SQL y la hoja de cálculo que viene a continuación son dos programas reales, y no hablan entre sí
            — ni aquí ni en ningún programa de verdad: no existe ningún cable que conecte una base de datos
            directamente con Excel. Lo que existe es esto: alguien LEE el resultado y lo escribe donde hace falta.
            Justo lo que vas a hacer tú.
          </p>
        </div>

        <div className="sql-portada-lista">
          <span className="sql-portada-etiqueta">Lo que tu consulta calculó</span>
          <ol>
            {RESULTADOS_A_TRASLADAR.map((r) => (
              <li key={r.categoria}>
                {r.categoria}: <b>${r.total.toLocaleString('es-MX')}</b>
              </li>
            ))}
          </ol>
        </div>

        <button type="button" className="sql-portada-boton" data-testid="traslado-continuar" onClick={onContinuar}>
          <span className="sql-portada-boton-glifo" aria-hidden="true">
            📊
          </span>
          Llevar estos números a la hoja de cálculo
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════ la mesa de la fase SQL ════════════════════════════ */

interface MesaSqlProps {
  onAvanceGlobal: () => void;
  onAprendido: (texto: string) => void;
  onFalloEleccion: () => void;
  onSqlTerminado: () => void;
}

function MesaSql({ onAvanceGlobal, onAprendido, onFalloEleccion, onSqlTerminado }: MesaSqlProps) {
  const dat = useDatos({
    plantilla: PLANTILLA_SQL,
    baseInicial: BASE_TECNIMARKET,
    soloLectura: [1],
    guion: GUION_SQL,
    onAvance: onAvanceGlobal,
    onTerminado: onSqlTerminado,
  });

  /* Bit dice lo aprendido en cuanto un encargo se cierra, una sola vez — el
   * mismo trato que `SalaDatos.Mesa`. */
  const dichoRef = useRef<string | null>(null);
  useEffect(() => {
    const enc = dat.encargo;
    if (!enc || !enc.hecho || dichoRef.current === enc.paso.id) return;
    dichoRef.current = enc.paso.id;
    onAprendido(enc.paso.aprendido);
  }, [dat.encargo, onAprendido]);

  /* Una opción mal elegida es lo único que resta puntos en la fase SQL — se
   * apunta una vez por combinación encargo+opción, igual que `SalaDatos`. */
  const falladasRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const enc = dat.encargo;
    if (!enc || enc.hecho || enc.eleccion === null) return;
    const marca = `${enc.paso.id}:${enc.eleccion}`;
    if (falladasRef.current.has(marca)) return;
    falladasRef.current.add(marca);
    onFalloEleccion();
  }, [dat.encargo, onFalloEleccion]);

  return (
    <VentanaBase marca="Tecnia Datos" subtitulo="SQL" claseMarco="sql-marco">
      <VentanaDatos datos={dat} archivo="consulta_ventas.sql" />
    </VentanaBase>
  );
}

/* ═══════════════════════ el laboratorio completo ═══════════════════════════ */

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabConectaTusDatos(props: PropsLab) {
  const labActividad = useLabActividad(props, TOTAL_PASOS);
  const { propsRef, sim, avanzar } = labActividad;
  const { linea, hablar } = useBit();

  const [fase, setFase] = useState<'portada' | 'sql' | 'traslado' | 'hojas'>('portada');
  const [puntos, setPuntos] = useState(100);

  const empezar = useCallback(() => {
    setFase('sql');
    hablar(
      'Abres consulta_ventas.sql: la misma base de TecniMarket que modelaste y consultaste en las dos paradas anteriores. Hoy la vas a sacar de aquí.',
    );
  }, [hablar]);

  const onFalloEleccion = useCallback(() => {
    labActividad.restar();
    setPuntos(labActividad.puntaje());
  }, [labActividad]);

  const onSqlTerminado = useCallback(() => {
    setFase('traslado');
  }, []);

  const onContinuarAHoja = useCallback(() => {
    setFase('hojas');
  }, []);

  /*
   * `VentanaHojas.onAvance` manda una FRACCIÓN acumulada de SU PROPIO guion
   * (`hechos / total`) dentro de un efecto que puede repetirse sin que el
   * número de encargos hechos cambie (ver la cabecera del archivo). Aquí se
   * traduce esa fracción a un conteo de hechos y sólo se llama a `avanzar()`
   * por el delta contra el último valor visto — así el contador global nunca
   * se mueve de más ni de menos, pase lo que pase con los repintados.
   */
  const hechosHojaRef = useRef(0);
  const onAvanceHoja = useCallback(
    (avanceFraccion: number) => {
      const hechos = Math.round(avanceFraccion * HOJA_PASOS_TOTAL);
      const delta = hechos - hechosHojaRef.current;
      if (delta <= 0) return;
      hechosHojaRef.current = hechos;
      for (let i = 0; i < delta; i += 1) avanzar();
    },
    [avanzar],
  );

  /*
   * Sin `useCallback` a propósito: lee `sim.current.errores` a través de un
   * ref que llega de otro hook (`useLabActividad`), y el compilador de React
   * de este proyecto infiere ahí una dependencia más fina
   * (`sim.current.errores`) de la que un array de dependencias puede
   * expresar — `react-hooks/preserve-manual-memoization` lo rechaza
   * cualquiera que sea el array que se escriba. Sin memoización manual, el
   * compilador memoiza solo y sin ese conflicto; y esta función sólo se crea
   * una vez por render de una pantalla que se pinta una única vez en toda la
   * actividad, así que no hay coste que evitar.
   */
  const onTerminadoHoja = (r: { pasos: number; tropiezos: number; segundos: number }) => {
    const erroresTotales = sim.current.errores + r.tropiezos;
    const score = Math.max(60, Math.min(100, 100 - erroresTotales * 6));
    const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;
    propsRef.current.onProgress(1);
    propsRef.current.onScore(score);
    propsRef.current.onComplete({
      score,
      stars,
      xp: score,
      errores: erroresTotales,
      tiempoSegundos: r.segundos,
    });
  };

  if (fase === 'hojas') {
    return (
      <VentanaHojas
        cinta={CINTA_EXCEL_BASICO}
        guion={GUION_HOJAS}
        onAvance={onAvanceHoja}
        onTerminado={onTerminadoHoja}
        onSalir={props.alSalir}
        minutos={14}
        insignia={{
          nombre: 'Analista de datos conectados',
          emoji: '🔗',
          titulo: 'Conectaste dos programas reales',
          detalle:
            'No existía ningún cable entre el motor SQL y la hoja de cálculo, y no hacía falta uno: leíste un resultado real —tres categorías, tres totales— y lo transcribiste tú mismo, a mano, a una hoja real. Ahí sacaste SUMA para el total general, MAX para encontrar la categoría que más vendió, PROMEDIO para repartir entre las tres, y CONTAR.SI para contar cuántas superan los 5,000 pesos sin escribir una sola línea de SQL. Es la misma ruta que sigue cualquier analista de datos cuando exporta una consulta a CSV: dos programas reales, y la habilidad de traducir un dato de uno a otro. Con esto cierras Bases de datos y SQL — modelaste la base, la consultaste, y hoy la conectaste con el resto del trabajo.',
        }}
      />
    );
  }

  const pasoActual = Math.min(labActividad.pasos + 1, TOTAL_PASOS);

  return (
    <ArcadeSala
      titulo="Conecta datos con hojas y apps"
      pasoEtiqueta="Encargo"
      pasoActual={pasoActual}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Puntos"
      marcadorValor={String(puntos)}
      bit={fase !== 'portada' ? linea : null}
      final={null}
      alSalir={props.alSalir}
    >
      {fase === 'portada' && (
        <PortadaDatos
          portada={PORTADA_SQL}
          archivo="consulta_ventas.sql"
          encargos={TOTAL_PASOS}
          minutos={16}
          insignia={{ nombre: 'Analista de datos conectados', emoji: '🔗' }}
          onEmpezar={empezar}
        />
      )}
      {fase === 'sql' && (
        <MesaSql
          onAvanceGlobal={avanzar}
          onAprendido={hablar}
          onFalloEleccion={onFalloEleccion}
          onSqlTerminado={onSqlTerminado}
        />
      )}
      {fase === 'traslado' && <PantallaTraslado onContinuar={onContinuarAHoja} />}
    </ArcadeSala>
  );
}

export default LabConectaTusDatos;
