/**
 * Tecnia Hojas · `verificar.ts` — el instrumento que convierte «se ve bien» en
 * cifras.
 *
 * Mismo molde que `Veredicto` en `office/motor/paginador.ts` y en
 * `office/motor-diapos/verificar.ts`: **enteros y un detalle de texto**, y es el
 * instrumento DE PRODUCCIÓN, no una copia. El banco lo cuelga de
 * `window.__verificarHojas` por la lección de §36.5: una sonda que trae su
 * propia medición se queda atrás y acaba midiendo otra cosa que el motor.
 *
 * Las cinco cifras se eligieron por lo que de verdad puede salir mal en una
 * hoja de cálculo, no por simetría con las otras salas:
 *
 * 1. `ilegibles`  — celdas con `=` delante que el analizador no sabe leer.
 * 2. `desfasadas` — celdas donde la caché del motor y el recálculo desde cero
 *                   no dicen lo mismo. **Si esto no es 0, todo lo demás es
 *                   mentira**, exactamente igual que `sueltos` en el §39.
 * 3. `pendientes` — celdas marcadas como sucias que se quedaron sin recalcular.
 *                   Es el fallo propio del recálculo incremental: no equivocarse
 *                   al calcular, sino no llegar a calcular.
 * 4. `circulares` — celdas dentro de un ciclo. No son un defecto del programa
 *                   —el alumno las provoca— pero tienen que estar contadas y
 *                   nombradas, que es lo que pide el criterio del §45.5.
 * 5. `errores`    — celdas que enseñan un código de error. **Que no sea 0 no
 *                   significa que esté mal**: en Excel un error es contenido, no
 *                   una avería (§45.4), y la clase 47 se da encima de ellos.
 *                   Quien juzga es el banco; el verificador cuenta.
 *
 * La segunda es la única cara: monta un motor NUEVO y recalcula el libro
 * entero. Tiene que ser nuevo, o estaría comparando la caché consigo misma.
 */

import { esError, textoDeNumero, type Clave, type Valor } from './modelo';
import { esFormula } from './formula/lexico';
import { parsear } from './formula/sintaxis';
import { todasLasClaves, valoresDesdeCero, type Motor } from './formula/calculo';

export interface Veredicto {
  ilegibles: number;
  desfasadas: number;
  pendientes: number;
  circulares: number;
  errores: number;
  detalle: string[];
}

/**
 * ¿Estos dos valores son el mismo?
 *
 * Con la regla de `consultas.ts`: dos números son iguales si la hoja los enseña
 * iguales. Sin tolerancias — comparar `1e-17` de diferencia con un `<` sería
 * inventarse una precisión que el programa no tiene.
 */
function iguales(a: Valor, b: Valor): boolean {
  if (typeof a === 'number' && typeof b === 'number') return textoDeNumero(a) === textoDeNumero(b);
  if (esError(a) && esError(b)) return a.error === b.error;
  return a === b;
}

function comoTexto(v: Valor): string {
  if (v === null) return '(vacía)';
  if (esError(v)) return v.error;
  if (typeof v === 'boolean') return v ? 'VERDADERO' : 'FALSO';
  if (typeof v === 'number') return textoDeNumero(v);
  return `«${v}»`;
}

/** Vuelve a mirar y dice la verdad. */
export function verificar(motor: Motor): Veredicto {
  const detalle: string[] = [];

  /* (1) fórmulas que no se pueden leer */
  let ilegibles = 0;
  for (const k of todasLasClaves(motor.libro)) {
    const i = k.lastIndexOf('!');
    const hoja = motor.libro.hojas.find((h) => h.id === k.slice(0, i));
    const crudo = hoja?.celdas[k.slice(i + 1)]?.crudo ?? '';
    if (!esFormula(crudo)) continue;
    const a = parsear(crudo);
    if (!a.ok) {
      ilegibles += 1;
      detalle.push(`ilegible: ${k} → ${a.mensaje}`);
    }
  }

  /* (2) la caché contra un recálculo desde cero — la cifra que decide */
  const oro = valoresDesdeCero(motor.libro, motor.contexto);
  let desfasadas = 0;
  const vistas = new Set<Clave>();
  for (const [k, v] of motor.valores) {
    vistas.add(k);
    const esperado = oro.get(k) ?? null;
    if (!iguales(v, esperado)) {
      desfasadas += 1;
      detalle.push(`desfasada: ${k} enseña ${comoTexto(v)} y debería ser ${comoTexto(esperado)}`);
    }
  }
  for (const [k, v] of oro) {
    if (vistas.has(k)) continue;
    desfasadas += 1;
    detalle.push(`desfasada: ${k} no tiene valor y debería ser ${comoTexto(v)}`);
  }

  /* (3) lo que se quedó sin recalcular */
  const pendientes = motor.sucias.size;
  for (const k of motor.sucias) detalle.push(`pendiente: ${k} sigue sucia`);

  /* (4) las que se muerden la cola */
  for (const k of motor.circulares) detalle.push(`circular: ${k}`);

  /* (5) los errores que la hoja enseña, que son contenido y no avería */
  let errores = 0;
  for (const [k, v] of motor.valores) {
    if (!esError(v)) continue;
    errores += 1;
    detalle.push(`error: ${k} enseña ${v.error}`);
  }

  return { ilegibles, desfasadas, pendientes, circulares: motor.circulares.length, errores, detalle };
}

/** Las cuatro cifras que SÍ son un defecto del programa. La quinta es contenido. */
export function estaSano(v: Veredicto): boolean {
  return v.ilegibles === 0 && v.desfasadas === 0 && v.pendientes === 0 && v.circulares === 0;
}
