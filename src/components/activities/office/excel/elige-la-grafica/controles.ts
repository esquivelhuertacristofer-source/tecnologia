import type { ContextoCinta, ControlHojas, ControlesDeClase } from '@/components/office/motor-hojas/cinta';
import { esUnaCelda, textoDeCaja } from '@/components/office/motor-hojas/cinta';
import type { TipoGrafica } from '@/components/office/motor-hojas/modelo';

/**
 * `n6-elige-la-grafica` · las dos gráficas que la cinta del grado Intermedio
 * no trae (bloques 37 y 38).
 *
 * `motor-hojas/cinta.ts` lo deja escrito en su propio comentario, junto a
 * `PENDIENTES`: **`barras` y `dispersion` existen en `TipoGrafica` (`modelo.ts`)
 * y no tienen botón**, porque `INSERTAR_BASICO` (`tecniaHojas.ts`) sólo declara
 * los tres gráficos que nombra el bloque 17 —columnas, líneas y circular—. Esta
 * clase es la que por fin necesita las otras dos: el bloque 37 es «elegir la
 * gráfica correcta» entre las CINCO, y sin barras ni dispersión no hay ni
 * pregunta que elegir.
 *
 * Se resuelve exactamente como `of-excel-tablas-y-filtros` resolvió sus nueve
 * botones (`controles.ts` + `panelFijo`) y no tocando `motor-hojas/cinta.ts`:
 * un control que aporta la clase está construido por definición, aunque el
 * motor no lo declare en ninguna cinta compartida (`cinta.ts`,
 * `estaConstruido`). El panel es `PanelGraficas.tsx`.
 *
 * La lógica de los dos botones es LITERALMENTE la de `graficaDe()` en
 * `motor-hojas/cinta.ts` —el mismo `insertarGrafica`, el mismo `id` derivado
 * de la selección y el tipo, el mismo «una celda sola no dibuja nada»—, y se
 * repite aquí en vez de importarse porque `graficaDe` no se exporta: es
 * intencional que `cinta.ts` no abra esa función al exterior (mantiene una
 * sola tabla, `CONTROLES`, como dueña de qué construye un botón de verdad), y
 * dos botones más no justifican romper esa frontera. `esUnaCelda` y
 * `textoDeCaja` sí están exportados —son las ayudas de lectura, no la fábrica
 * de comandos— y se reutilizan tal cual para que el `id` de una gráfica de
 * barras sobre `A4:B9` sea exactamente `g-h1-A4-B9-barras`, la misma fórmula
 * que ya usan columnas, líneas y circular.
 */

const idDeGrafica = (c: ContextoCinta, tipo: TipoGrafica): string =>
  `g-${c.hoja}-${textoDeCaja(c.sel).replace(':', '-')}-${tipo}`;

function graficaDe(tipo: TipoGrafica): ControlHojas {
  return {
    gesto: (c) => ({
      comando: 'insertarGrafica',
      args: { hoja: c.hoja, id: idDeGrafica(c, tipo), tipo, datos: textoDeCaja(c.sel) },
    }),
    inerte: (c) => esUnaCelda(c.sel),
    porQue: () =>
      'Una gráfica dibuja varios números: marca antes la columna de datos —y la de los nombres, si la hay— y vuelve a pulsar.',
  };
}

export const CONTROLES_ELIGE_GRAFICA: ControlesDeClase = {
  'grafico-barras': graficaDe('barras'),
  'grafico-dispersion': graficaDe('dispersion'),
};

export default CONTROLES_ELIGE_GRAFICA;
