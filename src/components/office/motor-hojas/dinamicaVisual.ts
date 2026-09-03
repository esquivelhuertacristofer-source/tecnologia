/**
 * Tecnia Hojas · `dinamicaVisual.ts` — lo que se VE de una tabla dinámica
 * (bloques 49 y 50).
 *
 * `dinamica.ts` construye el rectángulo —`celdas`, `roles`, `filas` con su
 * `profundidad`— y **no pinta ni un `<div>`**, exactamente como `comandos.ts`
 * guarda una `Tabla` y es `TablaVisual.tsx` quien la dibuja. Éste es el otro
 * lado: traduce esa `Construida` a «qué texto y qué pinta lleva cada celda de
 * la hoja», y `VentanaHojas.tsx` lo consulta celda a celda mientras pinta la
 * rejilla.
 *
 * ── POR QUÉ UN MAPA POR CELDA Y NO UNA CAPA FLOTANTE ────────────────────────
 *
 * Una dinámica es un rectángulo entero, así que lo barato habría sido colgar
 * un `div` encima de la rejilla, como el marco de una tabla o una gráfica. Se
 * descartó por tres cosas que **el alumno tiene que poder hacer**:
 *
 *   1. **Pinchar dentro.** La clase 49 pide a propósito que intente escribir
 *      en una celda de la dinámica para que la guarda de sólo lectura le
 *      conteste (`avisoDeSoloLectura`, en `comandos.ts`). Con una capa por
 *      encima, el clic no llega a la celda y ese encargo no se puede ni
 *      intentar.
 *   2. **Verse marcada.** El recuadro de la selección lo pinta la propia celda
 *      (`.hjw-celda.es-activa`); una capa opaca por encima lo taparía.
 *   3. **Desplazarse y esconderse como todo lo demás.** Filas virtualizadas,
 *      filas ocultas, cambio de hoja: todo eso ya lo resuelve la rejilla. Una
 *      capa flotante tendría que volver a resolverlo, y mal.
 *
 * Así que la dinámica se pinta **por dentro de las celdas que ocupa**, que es
 * también lo que hace Excel: ahí no hay ninguna ventana flotante, hay hoja.
 *
 * ── LA SANGRÍA ES TRABAJO DE AQUÍ, Y ESTÁ DICHO ALLÁ ────────────────────────
 *
 * `dinamica.ts` deja escrito que **no mete espacios en las etiquetas a
 * propósito**: un dato con espacios delante deja de poder compararse, y quien
 * pinta sabe cuántos píxeles vale un nivel mejor que quien resume. Lo que el
 * motor sí da es `EtiquetaDeEje.profundidad` —1 el primer campo del eje, 2 el
 * anidado dentro de él, 0 el total general— y de ahí sale `sangria`, que es lo
 * único que hace legible una dinámica de dos campos anidados: sin ella,
 * «Uniformes» y «Sudadera» se leen como dos categorías hermanas.
 */

import { aTexto, clave, textoDeNumero, type Clave } from './modelo';
import type { Motor } from './formula/calculo';
import { dinamicaPintada, todasLasDinamicas, type RolDeCelda } from './dinamica';

/** Qué enseña una celda que cae dentro de una dinámica. */
export interface CeldaDeDinamica {
  /** De qué dinámica es, para que quien la pinte pueda nombrarla. */
  id: string;
  /** Ya en texto: un hueco es `''` —vacío, no cero— igual que en el motor. */
  texto: string;
  rol: RolDeCelda;
  /** Cuántos niveles hay que sangrar la etiqueta. `0` el primer nivel. */
  sangria: number;
  /** Un número: se alinea a la derecha, como cualquier número de la hoja. */
  derecha: boolean;
}

const SIN_DINAMICAS: ReadonlyMap<Clave, CeldaDeDinamica> = new Map();

/**
 * Lo que las dinámicas de esta hoja están enseñando **ahora mismo**.
 *
 * Se lee de `dinamicaPintada`, o sea de la CACHÉ, y no de `construirDinamica`.
 * No es un ahorro: es la mitad de la clase 49. Teclear en el origen no vacía
 * esa caché, así que la hoja sigue enseñando el resumen de la última vez que
 * se actualizó —igual que Excel— hasta que alguien pulse Actualizar. Pintar
 * con `construirDinamica` habría hecho que la dinámica se repintara sola al
 * teclear, que es otro programa.
 *
 * Vacío y barato en cuanto el libro no tiene ninguna dinámica, que es el caso
 * de todos los demás libros del repositorio (misma disciplina que
 * `decoracionesDeTablas`).
 */
export function celdasDeDinamicas(motor: Motor, hojaId: string): ReadonlyMap<Clave, CeldaDeDinamica> {
  const todas = todasLasDinamicas(motor.libro);
  if (!todas.length) return SIN_DINAMICAS;
  const fuera = new Map<Clave, CeldaDeDinamica>();
  for (const { din } of todas) {
    const c = dinamicaPintada(motor, din);
    /*
     * `c.hoja` y no la hoja donde vive la especificación: una dinámica se pinta
     * donde apunta su ancla, y las dos coinciden en todas las clases de hoy
     * —pero el tipo permite que no, y una dinámica pintada en la hoja de al
     * lado no puede aparecer en ésta sólo porque su ficha se guardó aquí.
     */
    if (!c || c.hoja !== hojaId) continue;
    for (let df = 0; df < c.alto; df += 1) {
      const etiqueta = df >= c.cabeceras ? c.filas[df - c.cabeceras] : undefined;
      for (let dc = 0; dc < c.ancho; dc += 1) {
        const v = c.celdas[df * c.ancho + dc];
        const numero = typeof v === 'number';
        fuera.set(clave(hojaId, c.region.c0 + dc, c.region.f0 + df), {
          id: c.id,
          texto: v === null ? '' : numero ? textoDeNumero(v) : aTexto(v),
          rol: c.roles[df * c.ancho + dc],
          // Sólo la primera columna lleva etiquetas de fila, así que es la única
          // que se sangra. El total general (`profundidad: 0`) vuelve al margen.
          sangria: dc === 0 && etiqueta ? Math.max(0, etiqueta.profundidad - 1) : 0,
          derecha: numero,
        });
      }
    }
  }
  return fuera;
}
