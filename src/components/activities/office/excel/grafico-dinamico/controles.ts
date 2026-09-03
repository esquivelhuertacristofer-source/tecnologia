import type { ContextoCinta, ControlHojas, ControlesDeClase } from '@/components/office/motor-hojas/cinta';
import { hojaDe } from '@/components/office/motor-hojas/modelo';
import { dinamicaBajoSel } from '../comun/controlesDinamica';
import { CAMPO_MES, ID_GRAFICA, ID_SEGMENTACION } from './guion';

/**
 * Los seis controles propios de `of-excel-grafico-dinamico` (bloques 51 y 52):
 * `grafico-dinamico`, `segmentacion`, `filtrar-segmentacion`, `linea-tendencia`
 * y `eje-secundario` — ya construidos y probados en
 * `motor-hojas/comandos.ts` desde antes de esta clase— más `eje-secundario-corte`,
 * que es el MISMO comando `eje-secundario` con otro juego de argumentos (el
 * `minY`, en vez del `serie`+`activo`), separado en un control aparte porque el
 * panel necesita dos botones con dos señales distintas para el modo guía: uno
 * que mueve una serie de eje y otro que corta la escala. El comando ya sabía
 * distinguirlos por qué argumento trae —ver la cabecera de `eje-secundario` en
 * `comandos.ts`—; lo que faltaba era el domicilio en la cinta.
 *
 * Viven en la carpeta de la clase y no en `excel/comun/`, a diferencia de
 * `controlesDinamica.ts`: hoy sólo esta clase los necesita. El día que
 * `of-excel-dashboard` (bloque 58) también monte gráficos dinámicos y
 * segmentaciones, éstos se mudan a `comun/` con el mismo razonamiento que ya
 * dejó escrito aquel archivo — no antes, porque promover una pieza para un
 * segundo consumidor que todavía no existe es adivinar su forma.
 *
 * Todos comparten el mismo patrón que `controlesDinamica.ts`: la dinámica y el
 * gráfico de esta clase se encuentran por debajo del cursor con
 * `dinamicaBajoSel` (o, para el gráfico y la segmentación, por su `id` fijo —
 * esta clase inserta como mucho UNO de cada, así que no hace falta preguntarle
 * nada a la selección), y cada `gesto` no inventa ningún dato que el comando
 * no reciba ya: el `id` de la gráfica y de la segmentación son fijos
 * (`ID_GRAFICA`, `ID_SEGMENTACION`) porque esta clase no monta más de una de
 * cada — la misma razón por la que `of-excel-tabla-dinamica` no le pregunta al
 * alumno un identificador para su única dinámica.
 */

const graficaDeLaClase = (c: ContextoCinta) => hojaDe(c.motor.libro, c.hoja)?.graficas?.find((g) => g.id === ID_GRAFICA);

const segmentacionDeLaClase = (c: ContextoCinta) =>
  hojaDe(c.motor.libro, c.hoja)?.segmentaciones?.find((s) => s.id === ID_SEGMENTACION);

/* ── el gráfico dinámico (bloque 51) ─────────────────────────────────────── */

const CONTROL_GRAFICO_DINAMICO: ControlHojas = {
  gesto: (c) => {
    const din = dinamicaBajoSel(c);
    if (!din) return null;
    return {
      comando: 'grafico-dinamico',
      args: { hoja: c.hoja, id: ID_GRAFICA, dinamica: din.id, tipo: 'columnas' },
    };
  },
  inerte: (c) => !dinamicaBajoSel(c) || !!graficaDeLaClase(c),
  porQue: (c) =>
    graficaDeLaClase(c)
      ? 'Ya insertaste el gráfico dinámico: no hace falta otro.'
      : 'Primero hace falta una tabla dinámica de la que sacar el gráfico.',
};

/* ── la segmentación (bloque 51) ─────────────────────────────────────────── */

const CONTROL_SEGMENTACION: ControlHojas = {
  gesto: (c) => {
    const din = dinamicaBajoSel(c);
    if (!din) return null;
    return {
      comando: 'segmentacion',
      args: { hoja: c.hoja, id: ID_SEGMENTACION, dinamica: din.id, campo: CAMPO_MES },
    };
  },
  inerte: (c) => !dinamicaBajoSel(c) || !!segmentacionDeLaClase(c),
  porQue: (c) =>
    segmentacionDeLaClase(c)
      ? 'Ya insertaste la segmentación de Mes: no hace falta otra.'
      : 'Primero hace falta una tabla dinámica de la que segmentar un campo.',
};

/* ── pulsar un botón de la segmentación (bloque 51) ────────────────────────
 *
 * El panel manda SIEMPRE la lista completa de meses que deben quedar
 * encendidos, separada por `|` — la misma disciplina de `campo-dinamica` con
 * su filtro—, así que este control no necesita saber qué había antes: sólo
 * relaja el valor que ya trae listo.
 */

const CONTROL_FILTRAR_SEGMENTACION: ControlHojas = {
  gesto: (c) =>
    segmentacionDeLaClase(c)
      ? { comando: 'filtrar-segmentacion', args: { hoja: c.hoja, id: ID_SEGMENTACION, valores: String(c.valor ?? '') } }
      : null,
  inerte: (c) => !segmentacionDeLaClase(c),
  porQue: () => 'Todavía no hay ninguna segmentación que filtrar.',
};

/*
 * «Ver los seis meses» es EL MISMO comando `filtrar-segmentacion` con
 * `valores` vacío, y necesita su PROPIO id de control —no compartir
 * `'filtrar-segmentacion'` con los seis botones de mes— porque el señalador
 * del modo guía apunta al primer elemento que encuentra con ese
 * `data-control` (§37, «el botón exacto»): si los siete botones llevaran el
 * mismo id, el encargo 6 —que pide «Ver los seis meses»— señalaría un botón
 * de mes cualquiera en vez del que de verdad hay que pulsar.
 */
const CONTROL_QUITAR_FILTRO_SEGMENTACION: ControlHojas = {
  gesto: (c) =>
    segmentacionDeLaClase(c)
      ? { comando: 'filtrar-segmentacion', args: { hoja: c.hoja, id: ID_SEGMENTACION, valores: '' } }
      : null,
  inerte: (c) => !segmentacionDeLaClase(c),
  porQue: () => 'Todavía no hay ninguna segmentación que filtrar.',
};

/* ── la línea de tendencia (bloque 52) ─────────────────────────────────────
 *
 * `c.valor` es el índice de la serie, o `''` para quitarla — la misma forma
 * que ya recibe el comando `linea-tendencia`.
 */

const CONTROL_LINEA_TENDENCIA: ControlHojas = {
  gesto: (c) =>
    graficaDeLaClase(c)
      ? { comando: 'linea-tendencia', args: { hoja: c.hoja, id: ID_GRAFICA, serie: c.valor ?? '' } }
      : null,
  inerte: (c) => !graficaDeLaClase(c),
  porQue: () => 'Todavía no hay ningún gráfico donde trazar una tendencia.',
};

/* ── mover una serie al eje secundario (bloque 52) ─────────────────────────
 *
 * `c.valor` viaja como `"<serie>|<activo>"` — la disciplina de
 * `"campo|zona|resumen"` en `controlesDinamica.ts` y del `"3|-1"` de agrupar—:
 * el índice de la serie y si entra (`1`) o sale (`0`) del segundo eje.
 */

const CONTROL_EJE_SECUNDARIO: ControlHojas = {
  gesto: (c) => {
    if (!graficaDeLaClase(c)) return null;
    const [serieTxt, activoTxt] = String(c.valor ?? '').split('|');
    const serie = Number(serieTxt);
    if (!Number.isInteger(serie) || serie < 0) return null;
    return {
      comando: 'eje-secundario',
      args: { hoja: c.hoja, id: ID_GRAFICA, serie, activo: activoTxt === '1' ? 1 : 0 },
    };
  },
  inerte: (c) => !graficaDeLaClase(c),
  porQue: () => 'Todavía no hay ningún gráfico con series que mover de eje.',
};

/* ── cortar (o quitar el corte de) el eje secundario (bloque 52) ─────────── */

const CONTROL_EJE_SECUNDARIO_CORTE: ControlHojas = {
  gesto: (c) =>
    graficaDeLaClase(c)
      ? { comando: 'eje-secundario', args: { hoja: c.hoja, id: ID_GRAFICA, minY: String(c.valor ?? '') } }
      : null,
  inerte: (c) => !graficaDeLaClase(c),
  porQue: () => 'Todavía no hay ningún gráfico con un segundo eje que cortar.',
};

export const CONTROLES_GRAFICO_DINAMICO: ControlesDeClase = {
  'grafico-dinamico': CONTROL_GRAFICO_DINAMICO,
  segmentacion: CONTROL_SEGMENTACION,
  'filtrar-segmentacion': CONTROL_FILTRAR_SEGMENTACION,
  'quitar-filtro-segmentacion': CONTROL_QUITAR_FILTRO_SEGMENTACION,
  'linea-tendencia': CONTROL_LINEA_TENDENCIA,
  'eje-secundario': CONTROL_EJE_SECUNDARIO,
  'eje-secundario-corte': CONTROL_EJE_SECUNDARIO_CORTE,
};

export default CONTROLES_GRAFICO_DINAMICO;
