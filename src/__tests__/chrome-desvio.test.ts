/**
 * `esDesvio` — la guarda del modo guía, probada por fin.
 *
 * Esta función decide, cada vez que el alumno pulsa algo, si se fue por donde no
 * debía. Es lo que el cliente compró en §37: señalar el botón exacto y que el
 * desvío no ensucie el documento.
 *
 * **Y no tenía una sola prueba propia.** Se descubrió el 14-ago-2026 después de
 * que rompiera TRES clases de Excel, cada vez con una cara distinta y cada vez
 * dejándolas **imposibles de terminar**:
 *
 *   · `of-excel-buscarx` ......... la señal apuntaba a una celda de otra hoja, y
 *     bloqueaba la lengüeta que hacía falta para llegar a esa celda.
 *   · `n5-mi-primera-grafica` .... un encargo pedía tres campos y la señal
 *     nombraba uno; el segundo clic contaba como desvío.
 *   · `n7-formato-condicional` ... lo mismo, en cuatro encargos.
 *
 * Los tres se arreglaron en su clase, y por eso volvió a pasar: *un defecto que
 * se repite y se arregla tres veces en tres sitios distintos no está arreglado,
 * está escondido.* La regla de la casa dice que entonces pasa a ser una medida.
 * Este archivo es la medida.
 *
 * Se prueba **jugando mal a propósito**: lo que tiene que avisar y lo que NO
 * tiene que avisar, que es la mitad que se olvidaba.
 */
import { esDesvio } from '@/components/office/chrome/ganchos';

/** Un paso mínimo, del que sólo importan la señal y el logro. */
const paso = (senal?: string, logro: { tipo: string; control?: string } = { tipo: 'documento' }) => ({
  senal: senal ? { control: senal } : undefined,
  logro,
});

describe('esDesvio · un solo control (Word y PowerPoint hacen esto y no cambia)', () => {
  it('el botón señalado NO es desvío; cualquier otro SÍ', () => {
    expect(esDesvio(paso('negrita'), 'negrita').desviado).toBe(false);
    expect(esDesvio(paso('negrita'), 'cursiva')).toEqual({ desviado: true, esperado: 'negrita' });
  });

  it('sin señal, el control del propio logro hace de señal', () => {
    expect(esDesvio(paso(undefined, { tipo: 'control', control: 'guardar' }), 'guardar').desviado).toBe(false);
    expect(esDesvio(paso(undefined, { tipo: 'control', control: 'guardar' }), 'imprimir').desviado).toBe(true);
  });

  it('sin paso no hay desvío posible: la clase ya terminó', () => {
    expect(esDesvio(undefined, 'negrita').desviado).toBe(false);
  });
});

describe('esDesvio · una señal de SITIO dice dónde estar, no qué pulsar', () => {
  it('una señal de hoja no bloquea un botón de la cinta', () => {
    // El defecto de `of-excel-buscarx`: sin esto, la clase no se podía terminar.
    expect(esDesvio(paso('hoja:h4'), 'color-relleno').desviado).toBe(false);
  });

  it('pero irse a OTRA hoja distinta de la pedida sigue avisando', () => {
    expect(esDesvio(paso('hoja:h4'), 'hoja:h9')).toEqual({ desviado: true, esperado: 'hoja:h4' });
    expect(esDesvio(paso('hoja:h4'), 'hoja:h4').desviado).toBe(false);
  });

  it('una señal de CELDA sí bloquea, y tiene que seguir haciéndolo', () => {
    /*
     * Esta prueba existe por una equivocación mía, no por un defecto: el
     * 14-ago-2026 di por hecho que `celda:` era «una señal de sitio» como
     * `hoja:` y que tampoco debía bloquear. Se generalizó y **cuatro clases se
     * pusieron rojas a la vez**, las cuatro probando a propósito que pulsar un
     * botón cuando lo que toca es escribir tiene que avisar.
     *
     * La diferencia está en si la señal se puede *satisfacer*: la lengüeta pasa
     * por esta función, la celda no. Una señal de celda se queda puesta mientras
     * el alumno teclea, y ahí hace justo su trabajo.
     *
     * Queda como prueba para que la próxima vez que alguien tenga esta idea
     * —incluido yo— se entere en un segundo y no después de cuatro suites.
     */
    expect(esDesvio(paso('celda:A6'), 'negrita')).toEqual({ desviado: true, esperado: 'celda:A6' });
  });
});

describe('esDesvio · un encargo puede pedir VARIOS botones', () => {
  const tresCampos = paso('eje-x,eje-y,leyenda');

  it('cualquiera de los tres vale, en cualquier orden', () => {
    expect(esDesvio(tresCampos, 'eje-x').desviado).toBe(false);
    expect(esDesvio(tresCampos, 'leyenda').desviado).toBe(false);
    expect(esDesvio(tresCampos, 'eje-y').desviado).toBe(false);
  });

  it('y uno que no está en la lista sigue avisando — que es el punto', () => {
    /*
     * Lo importante de admitir varios no es admitirlos: es que ya no haga falta
     * QUITAR la señal para que la clase se pueda terminar. Quitarla apagaba
     * también este aviso, y este aviso es lo que el cliente compró.
     */
    expect(esDesvio(tresCampos, 'negrita')).toEqual({ desviado: true, esperado: 'eje-x' });
  });

  it('los espacios alrededor de las comas no cuentan', () => {
    expect(esDesvio(paso('eje-x, eje-y'), 'eje-y').desviado).toBe(false);
  });
});
