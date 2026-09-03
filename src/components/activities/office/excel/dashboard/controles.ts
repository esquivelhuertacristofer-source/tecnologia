import type { ContextoCinta, ControlesDeClase } from '@/components/office/motor-hojas/cinta';
import CONTROLES_DINAMICA from '../comun/controlesDinamica';
import { hojaDe } from '@/components/office/motor-hojas/modelo';

/**
 * `of-excel-dashboard` · los dos botones que el tablero necesita y la cinta no
 * trae (bloque 58).
 *
 * ── `borrar-grafico`: la puerta que llevaba cerrada desde el §45.5 ──────────
 *
 * **`borrarGrafica` existe en `comandos.ts`, cableado y probado, desde el §45.5
 * y no tiene por dónde entrar**: no vive en ninguna cinta, `motor-hojas/cinta.ts`
 * no lo declara, y la tecla Supr sobre la rejilla dispara `borrar-contenido`
 * —vacía celdas— aunque haya una gráfica marcada. O sea que en Tecnia Hojas se
 * podía insertar una gráfica y no se podía quitar. Es la misma familia de
 * defecto que ya cazaron `nombrarRango` antes del bloque 22 y `cambiarGrafica`
 * antes de `n5-mi-primera-grafica`: el motor sabía hacerlo y la ventana no sabía
 * pedírselo. **No se había notado porque hasta hoy ninguna clase necesitaba
 * borrar nada**: las veintidós anteriores enseñan a construir. La primera que
 * enseña a DECIDIR es la primera que necesita quitar.
 *
 * Se abre con `ControlesDeClase` y no tocando `motor-hojas/cinta.ts`, por lo
 * mismo que ya razonaron `of-excel-tablas-y-filtros` y `n6-elige-la-grafica`: un
 * control que aporta la clase está construido por definición. El día que otra
 * clase lo necesite, esto se muda a `comun/` y el motor sigue sin enterarse.
 *
 * El `id` de la gráfica viaja en `c.valor` —`ContextoCinta` no sabe cuál está
 * marcada, y no tiene por qué: el estado de selección de un dibujo es de la
 * ventana, no del libro— exactamente como `borrar-reglas` y `borrar-escenario`
 * reciben el suyo desde su lista. Quien lo pone es `PanelTablero.tsx`, que pinta
 * un ✕ por gráfica.
 *
 * ── `inmovilizar`: prestado, palabra por palabra ───────────────────────────
 *
 * Está apagado en `motor-hojas/cinta.ts` (`PENDIENTES`) con un motivo que apunta
 * al bloque 36, y quien lo encendió fue `of-excel-tablas-y-filtros` con su
 * `controles.ts`. Aquí hace falta otra vez —un tablero con el detalle debajo es
 * el caso de manual— y se repite el gesto en vez de importarse de aquella clase
 * porque **una clase no importa de otra clase**: lo que comparten dos clases vive
 * en `comun/`, y mudar allá un control de una clase ya cerrada por una necesidad
 * de la última es tocar código que hoy funciona sin ningún beneficio. Son seis
 * líneas y su regla es la de Excel: clava lo que está arriba y a la izquierda de
 * la celda activa, y el mismo botón lo quita.
 */

/** ¿Ya hay algo inmovilizado en esta hoja? */
const yaInmovilizado = (c: ContextoCinta): boolean => {
  const inm = hojaDe(c.motor.libro, c.hoja)?.inmovilizado;
  return Boolean(inm && (inm.filas || inm.cols));
};

export const CONTROLES_TABLERO: ControlesDeClase = {
  ...CONTROLES_DINAMICA,

  'borrar-grafico': {
    gesto: (c) => {
      const id = String(c.valor ?? '').trim();
      return id ? { comando: 'borrarGrafica', args: { hoja: c.hoja, id } } : null;
    },
    inerte: (c) => !(hojaDe(c.motor.libro, c.hoja)?.graficas ?? []).length,
    porQue: () => 'En esta hoja no queda ninguna gráfica que quitar.',
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
};

export default CONTROLES_TABLERO;
