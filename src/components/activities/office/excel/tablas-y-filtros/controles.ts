import { cajaDeTexto, textoDeCaja, type ArgsDeGesto } from '@/components/office/motor-hojas/comandos';
import type { ContextoCinta, ControlesDeClase } from '@/components/office/motor-hojas/cinta';
import { hojaDe, type Tabla } from '@/components/office/motor-hojas/modelo';

/**
 * `of-excel-tablas-y-filtros` · los nueve botones de la tabla (bloques 33-36).
 *
 * `comandos.ts` ya trae los nueve comandos cableados y probados —
 * `crear-tabla`, `estilo-tabla`, `fila-totales`, `filtrar`, `quitar-filtros`,
 * `ordenar-varias`, `inmovilizar`, `ocultar-filas`, `mostrar-filas`—, y
 * ninguno tenía todavía el botón que los dispara: ocho no existían en ninguna
 * cinta, y `inmovilizar` estaba apagado en `motor-hojas/cinta.ts` con un
 * motivo que apunta exactamente a este bloque. Se resuelve con
 * `ControlesDeClase` —la misma puerta que ya usó `n7-formato-condicional`
 * para sus siete botones de regla— y no tocando `motor-hojas/cinta.ts`: un
 * control que aporta la clase está construido por definición, aunque el
 * motor lo tenga apagado (`cinta.ts`, `estaConstruido`).
 *
 * Ocho de los nueve entran por `PanelTablas.tsx`, que llama a `gesto(control,
 * valor)` exactamente como llamaría un botón de la cinta. `inmovilizar` es el
 * único con domicilio real —Vista → Mostrar, desde el primer día de la
 * sala— y aquí sólo se le da el gesto que le faltaba.
 *
 * ── CÓMO SE SABE «LA TABLA» SIN QUE EL PANEL PREGUNTE CUÁL ─────────────────
 *
 * Como en el Excel de verdad: basta con estar parado en una celda de la
 * tabla. `tablaBajoSel` mira la esquina activa de la selección —`sel.c0`,
 * `sel.f0`— y busca la tabla de la hoja que la contiene. Con una sola tabla
 * por hoja en esta clase no hace falta un desplegable de «¿cuál tabla?», y el
 * día que otra clase tenga dos tablas en la misma hoja, sigue funcionando
 * igual: cada botón obedece a la tabla donde está el cursor.
 *
 * ── `inmovilizar`, DERIVADO DE LA SELECCIÓN Y NO DE UN CUADRO DE TEXTO ─────
 *
 * En Excel «Inmovilizar paneles» no pregunta cuántas filas ni cuántas
 * columnas: clava todo lo que está ARRIBA y a la IZQUIERDA de la celda activa.
 * Es exactamente `sel.f0`/`sel.c0`, así que no hace falta ningún panel para
 * este botón — y el mismo botón, pulsado otra vez con algo ya inmovilizado,
 * lo quita, que es lo que hace el de verdad (pasa de «Inmovilizar paneles» a
 * «Inmovilizar Inmovilizar paneles»).
 */

const idDeTabla = (c: ContextoCinta): string => `t-${c.hoja}-${textoDeCaja(c.sel).replace(':', '-')}`;

/** La tabla de esta hoja que contiene la esquina activa de la selección. */
function tablaBajoSel(c: ContextoCinta): Tabla | null {
  const tablas = hojaDe(c.motor.libro, c.hoja)?.tablas ?? [];
  return (
    tablas.find((t) => {
      const caja = cajaDeTexto(t.rango);
      return !!caja && c.sel.c0 >= caja.c0 && c.sel.c0 <= caja.c1 && c.sel.f0 >= caja.f0 && c.sel.f0 <= caja.f1;
    }) ?? null
  );
}

/**
 * El `valor` de `filtrar`, tal y como lo arma `PanelTablas.tsx`:
 *
 *   `"3|valores|Norte,Sur"` .......... la lista de valores marcados
 *   `"3|cmp|mayor|1000"` ............. una comparación de un solo lado
 *   `"3|cmp|entre|100|500"` .......... una comparación «entre»
 *
 * y de aquí sale exactamente lo que `filtroDeArgs` (`comandos.ts`) sabe leer:
 * `valores` como texto separado por comas, o `op`+`contra` —con `contra`
 * llevando el `100|500` de un «entre» tal cual, porque así es como
 * `pasaFiltro` lo vuelve a partir.
 */
function argsDeFiltro(v: string): ArgsDeGesto | null {
  const [colTxt, modo, ...resto] = v.split('|');
  const columna = Number(colTxt);
  if (!Number.isFinite(columna)) return null;
  if (modo === 'valores') {
    const valores = resto[0] ?? '';
    return valores ? { columna, valores } : null;
  }
  if (modo === 'cmp') {
    const [op, ...args] = resto;
    if (!op) return null;
    if (op === 'entre') {
      const [desde, hasta] = args;
      return desde && hasta ? { columna, op, contra: `${desde}|${hasta}` } : null;
    }
    const contra = args[0];
    return contra ? { columna, op, contra } : null;
  }
  return null;
}

/** ¿Ya hay algo inmovilizado en esta hoja? */
const yaInmovilizado = (c: ContextoCinta): boolean => {
  const inm = hojaDe(c.motor.libro, c.hoja)?.inmovilizado;
  return Boolean(inm && (inm.filas || inm.cols));
};

export const CONTROLES_TABLAS: ControlesDeClase = {
  'crear-tabla': {
    gesto: (c) => {
      const nombre = String(c.valor ?? '').trim();
      return nombre ? { comando: 'crear-tabla', args: { hoja: c.hoja, id: idDeTabla(c), nombre, rango: textoDeCaja(c.sel) } } : null;
    },
    inerte: (c) => !String(c.valor ?? '').trim(),
    porQue: () => 'Escribe primero el nombre de la tabla, en el panel «Tablas», y vuelve a pulsar Crear.',
  },
  'estilo-tabla': {
    gesto: (c) => {
      const t = tablaBajoSel(c);
      const estilo = String(c.valor ?? '');
      return t && estilo ? { comando: 'estilo-tabla', args: { hoja: c.hoja, id: t.id, estilo } } : null;
    },
    inerte: (c) => !tablaBajoSel(c),
    porQue: () => 'Ponte primero en una celda de la tabla.',
  },
  'fila-totales': {
    gesto: (c) => {
      const t = tablaBajoSel(c);
      const [colTxt, resumen] = String(c.valor ?? '').split(':');
      const columna = Number(colTxt);
      return t && Number.isFinite(columna) && resumen
        ? { comando: 'fila-totales', args: { hoja: c.hoja, id: t.id, columna, resumen } }
        : null;
    },
    inerte: (c) => !tablaBajoSel(c),
    porQue: () => 'Ponte primero en una celda de la tabla.',
  },
  filtrar: {
    gesto: (c) => {
      const t = tablaBajoSel(c);
      if (!t) return null;
      const args = argsDeFiltro(String(c.valor ?? ''));
      return args ? { comando: 'filtrar', args: { hoja: c.hoja, id: t.id, ...args } } : null;
    },
    inerte: (c) => !tablaBajoSel(c),
    porQue: () => 'Ponte primero en una celda de la tabla, elige la columna y di qué filtrar.',
  },
  'quitar-filtros': {
    gesto: (c) => {
      const t = tablaBajoSel(c);
      return t ? { comando: 'quitar-filtros', args: { hoja: c.hoja, id: t.id } } : null;
    },
    inerte: (c) => {
      const t = tablaBajoSel(c);
      return !t?.filtros || !Object.keys(t.filtros).length;
    },
    porQue: () => 'Ponte en una celda de la tabla que tenga algún filtro puesto.',
  },
  'ordenar-varias': {
    gesto: (c) => {
      const t = tablaBajoSel(c);
      const orden = String(c.valor ?? '').trim();
      return t && orden ? { comando: 'ordenar-varias', args: { hoja: c.hoja, id: t.id, orden } } : null;
    },
    inerte: (c) => !tablaBajoSel(c),
    porQue: () => 'Ponte primero en una celda de la tabla, y di por qué columnas ordenar, en orden de prioridad.',
  },
  inmovilizar: {
    gesto: (c) => {
      const quitar = yaInmovilizado(c);
      return { comando: 'inmovilizar', args: { hoja: c.hoja, filas: quitar ? 0 : c.sel.f0, cols: quitar ? 0 : c.sel.c0 } };
    },
    activo: yaInmovilizado,
    inerte: (c) => !yaInmovilizado(c) && c.sel.f0 === 0 && c.sel.c0 === 0,
    porQue: () =>
      'Ponte en la celda de debajo de lo que quieras inmovilizar: A1 no fija nada, porque no hay ninguna fila arriba ni ninguna columna a la izquierda.',
  },
  /*
   * Ocultar y mostrar filas (bloque 36) no necesitan ni `tablaBajoSel` ni un
   * `valor`: son el clic derecho de siempre sobre la cabecera de fila, y
   * `sel.f0`/`sel.f1` YA es el rango de filas marcado —seleccionar por la
   * cabecera de fila marca la fila entera (`VentanaHojas.tsx`)—. Ninguno de
   * los dos exige estar dentro de una tabla: se puede ocultar cualquier fila
   * de la hoja, como en Excel.
   */
  'ocultar-filas': {
    gesto: (c) => ({ comando: 'ocultar-filas', args: { hoja: c.hoja, desde: c.sel.f0, hasta: c.sel.f1 } }),
  },
  'mostrar-filas': {
    gesto: (c) => ({ comando: 'mostrar-filas', args: { hoja: c.hoja, desde: c.sel.f0, hasta: c.sel.f1 } }),
  },
};

export default CONTROLES_TABLAS;
