/**
 * `n9-datos-con-python` · los seis problemas del reporte del grupo.
 *
 * Documento maestro §68.3. Viven fuera del laboratorio por la misma razón que
 * los del concurso, los de SQL y los de búsqueda: **la prueba de Jest los juzga
 * con soluciones de referencia** y esas soluciones no pueden estar en ningún
 * archivo que el navegador descargue. Aquí sólo hay enunciados, llamadas y
 * salidas literales.
 *
 * ── La forma del dato es la que cierra el atajo ─────────────────────────────
 *
 * Los seis reciben una lista de registros `{"nombre": …, "calificacion": …}` en
 * la que la calificación puede ser `None`: «no ha entregado». `sum()`, `max()`
 * y `min()` están permitidos y ninguno resuelve un problema solo: `sum()`
 * revienta con `None`, `max()` no sabe de quién es el número y ninguna función
 * de fábrica decide entre cuántos se divide.
 *
 * ── Cómo se eligieron los casos ─────────────────────────────────────────────
 *
 * Cada ejemplo visible está elegido para que **el error típico lo pase**, y
 * cada oculto para que lo tumbe (la lección del 70 de §68):
 *
 * | Problema | Error típico | Oculto que lo tumba |
 * |---|---|---|
 * | 1 · con calificación | `if` sobre la calificación: el 0 cuenta como «no entregó» | alguien sacó cero |
 * | 2 · promedio | dividir entre todos, también los que no entregaron | alguien no entregó |
 * | 3 · reprobados | `<=` en vez de `<` | justo en el límite |
 * | 4 · el mejor | el índice de `max()` leído en la lista original, desalineada | alguien no entregó |
 * | 4 · el mejor | quedarse con el último de un empate | empate arriba |
 * | 5 · por nivel | la frontera de sobresaliente del lado equivocado | justo en los límites |
 * | 6 · conclusión | «más de la mitad» sobre el total | dos no entregaron |
 *
 * Las salidas de los 31 casos y el comportamiento de los siete señuelos se
 * midieron con **CPython 3.14** el 12-sep-2026 antes de escribirlas, y
 * `juez-datos.test.ts` las vuelve a medir con el intérprete de Tecnia Código.
 * Medir contra CPython sacó un defecto del intérprete: `round(6.35, 1)` daba
 * 6.4. Está corregido en `maquina.ts`.
 *
 * Los nombres de los casos ocultos no llevan cifras a propósito: la prueba del
 * DOM comprueba que un caso oculto no pinte ni un dígito.
 */

import type { Problema } from '@/components/simuladores/juez';

/** Un registro, escrito como lo escribiría el alumno. `c` es el texto de la calificación: `'8.5'`, `'0'` o `'None'`. */
const r = (nombre: string, c: string) => `{"nombre": "${nombre}", "calificacion": ${c}}`;
const lista = (...registros: string[]) => `[${registros.join(', ')}]`;

/** Los ocho registros de la plantilla, con Emilio sin entregar. */
const GRUPO = lista(
  r('Sofía', '8.5'),
  r('Diego', '5.5'),
  r('Valeria', '9.2'),
  r('Emilio', 'None'),
  r('Camila', '6.0'),
  r('Mateo', '4.5'),
  r('Renata', '9.8'),
  r('Iker', '7.0'),
);

/**
 * Los ejemplos visibles llevan tres registros como mucho: medido en Chromium el
 * 12-sep-2026, el grupo de ocho ocupaba doce renglones en la columna del panel y
 * dejaba «Enviar al juez» en y = 1435 de una pantalla de 900. Los grupos
 * grandes van en los ocultos, que nunca se pintan.
 */
const TRES = lista(r('Diego', '5.5'), r('Valeria', '9.2'), r('Mateo', '4.5'));

export const D1: Problema = {
  id: 'd1-con-calificacion',
  titulo: 'Problema 1 · ¿Cuántos tienen calificación?',
  enunciado:
    'La app de calificaciones del grupo guarda un registro por alumno, con su nombre y su calificación. Quien todavía ' +
    'no entrega no tiene calificación: en su registro dice None. Quien entregó en blanco sí la tiene, y es un cero. ' +
    'Devuelve cuántos alumnos tienen calificación.',
  firma: 'con_calificacion(registros) → un número',
  casos: [
    {
      nombre: 'uno no ha entregado',
      llamada: `print(con_calificacion(${lista(r('Sofía', '8.5'), r('Emilio', 'None'), r('Diego', '5.5'))}))`,
      esperada: ['2'],
    },
    {
      nombre: 'todos entregaron',
      llamada: `print(con_calificacion(${lista(r('Ana', '7'), r('Luis', '9'))}))`,
      esperada: ['2'],
    },
    {
      nombre: 'alguien sacó cero',
      llamada: `print(con_calificacion(${lista(r('Ana', '0'), r('Luis', 'None'), r('Eva', '10'))}))`,
      esperada: ['2'],
      oculto: true,
    },
    {
      nombre: 'nadie ha entregado',
      llamada: `print(con_calificacion(${lista(r('Ana', 'None'), r('Luis', 'None'))}))`,
      esperada: ['0'],
      oculto: true,
    },
    { nombre: 'el grupo está vacío', llamada: 'print(con_calificacion([]))', esperada: ['0'], oculto: true },
  ],
  pistas: [
    'Relee la tercera frase del enunciado. Un cero y un «no hay nada» se parecen mucho, pero sólo uno de los dos es una calificación.',
    'Preguntar si un valor «tiene algo» no es lo mismo que preguntar si es None: para Python, el cero tampoco tiene nada. ¿Qué contesta tu función con un alumno que sacó cero?',
    'Se recorren los registros y se lleva una cuenta que sube sólo cuando la calificación es distinta de None. Compararla con None, y no preguntar si «vale algo», es lo que deja pasar al cero.',
  ],
};

export const D2: Problema = {
  id: 'd2-el-promedio',
  titulo: 'Problema 2 · El promedio del grupo',
  enunciado:
    'La maestra quiere el promedio del grupo, redondeado a un decimal. Sólo cuentan las calificaciones que existen: ' +
    'quien no ha entregado no suma ni cuenta, pero quien sacó cero sí. Si nadie tiene calificación todavía, no hay ' +
    'promedio que dar: devuelve None.',
  firma: 'promedio(registros) → un número con un decimal, o None',
  casos: [
    { nombre: 'tres que entregaron', llamada: `print(promedio(${TRES}))`, esperada: ['6.4'] },
    {
      nombre: 'dos calificaciones enteras',
      llamada: `print(promedio(${lista(r('Ana', '10'), r('Luis', '7'))}))`,
      esperada: ['8.5'],
    },
    { nombre: 'alguien no entregó', llamada: `print(promedio(${GRUPO}))`, esperada: ['7.2'], oculto: true },
    {
      nombre: 'alguien sacó cero',
      llamada: `print(promedio(${lista(r('Ana', '0'), r('Luis', '9'), r('Eva', '9'))}))`,
      esperada: ['6.0'],
      oculto: true,
    },
    {
      nombre: 'nadie ha entregado',
      llamada: `print(promedio(${lista(r('Ana', 'None'))}))`,
      esperada: ['None'],
      oculto: true,
    },
  ],
  pistas: [
    'Un promedio es una suma dividida entre cuántos son. La pregunta difícil no es la suma: es «cuántos son». ¿Cuentan los que no han entregado?',
    'Si sumas sólo a los que tienen calificación pero divides entre el tamaño de toda la lista, los ejemplos pasan y el grupo real no. Y si nadie tiene calificación, dividir entre cuántos son es dividir entre cero.',
    'Se llevan dos cuentas a la vez mientras se recorren los registros: la suma de las calificaciones que existen y cuántas son. Al terminar, si esa segunda cuenta es cero se devuelve None; si no, la división redondeada con round a un decimal.',
  ],
};

export const D3: Problema = {
  id: 'd3-van-reprobando',
  titulo: 'Problema 3 · Quién va reprobando',
  enunciado:
    'La app avisa a quién hay que apoyar. Recibe los registros y la calificación mínima para aprobar, y devuelve la ' +
    'lista de nombres de quienes tienen una calificación menor que esa mínima, en el mismo orden en que aparecen. ' +
    'Sacar exactamente la mínima es aprobar. Quien no ha entregado no aparece: no tiene calificación que comparar.',
  firma: 'reprobados(registros, minima) → una lista de nombres',
  casos: [
    { nombre: 'tres que entregaron', llamada: `print(reprobados(${TRES}, 6))`, esperada: ["['Diego', 'Mateo']"] },
    {
      nombre: 'nadie reprueba',
      llamada: `print(reprobados(${lista(r('Ana', '9'), r('Luis', '8'))}, 7))`,
      esperada: ['[]'],
    },
    {
      nombre: 'justo en el límite',
      llamada: `print(reprobados(${lista(r('Camila', '6.0'), r('Diego', '5.5'))}, 6))`,
      esperada: ["['Diego']"],
      oculto: true,
    },
    { nombre: 'alguien no entregó', llamada: `print(reprobados(${GRUPO}, 6))`, esperada: ["['Diego', 'Mateo']"], oculto: true },
    {
      nombre: 'alguien sacó cero',
      llamada: `print(reprobados(${lista(r('Ana', '0'), r('Luis', '7'))}, 6))`,
      esperada: ["['Ana']"],
      oculto: true,
    },
  ],
  pistas: [
    'Filtrar no es imprimir a los que cumplen: es juntarlos en una lista nueva y devolverla. Y el enunciado dice qué pasa con quien saca exactamente la mínima.',
    'Hay tres alumnos que tu función tiene que tratar con cuidado: el que saca justo la mínima, el que no ha entregado y el que sacó cero. Para Python, comparar None con un número es un error.',
    'Se empieza con una lista vacía y se recorren los registros. Un nombre se agrega sólo si su calificación existe y además es estrictamente menor que la mínima; las dos condiciones van en ese orden, porque la segunda no se puede preguntar sin la primera.',
  ],
};

export const D4: Problema = {
  id: 'd4-el-mejor',
  titulo: 'Problema 4 · El nombre detrás del número',
  enunciado:
    'En la ceremonia se nombra a quien sacó la calificación más alta del grupo. Devuelve su nombre. Si dos o más ' +
    'empatan arriba, se nombra a quien aparece primero en la lista. Si nadie tiene calificación, devuelve el texto nadie.',
  firma: 'mejor(registros) → un nombre',
  casos: [
    {
      nombre: 'tres que entregaron',
      llamada: `print(mejor(${lista(r('Sofía', '8.5'), r('Valeria', '9.2'), r('Iker', '7.0'))}))`,
      esperada: ['Valeria'],
    },
    { nombre: 'uno solo', llamada: `print(mejor(${lista(r('Luis', '7'))}))`, esperada: ['Luis'] },
    {
      nombre: 'empate arriba',
      llamada: `print(mejor(${lista(r('Ana', '9.5'), r('Luis', '9.5'), r('Eva', '8'))}))`,
      esperada: ['Ana'],
      oculto: true,
    },
    { nombre: 'alguien no entregó', llamada: `print(mejor(${GRUPO}))`, esperada: ['Renata'], oculto: true },
    {
      nombre: 'nadie ha entregado',
      llamada: `print(mejor(${lista(r('Ana', 'None'), r('Luis', 'None'))}))`,
      esperada: ['nadie'],
      oculto: true,
    },
    {
      nombre: 'el único sacó cero',
      llamada: `print(mejor(${lista(r('Ana', 'None'), r('Luis', '0'))}))`,
      esperada: ['Luis'],
      oculto: true,
    },
  ],
  pistas: [
    'La función max de Python te da el número más alto, pero no de quién es. Y con la lista de registros completa no puede ni empezar: no sabe comparar un registro con otro.',
    'Si guardas las calificaciones aparte y buscas la posición del máximo, esa posición es la de la lista de calificaciones, no la de los registros: cada alumno que no entregó las desalinea. Piensa también en qué pasa si el más alto es un cero.',
    'Se recorren los registros recordando dos cosas: la calificación más alta vista hasta ahora y el nombre de quien la tiene. Al principio no se ha visto ninguna. Sólo una calificación estrictamente mayor cambia el nombre, y así un empate se queda con el primero.',
  ],
};

export const D5: Problema = {
  id: 'd5-por-nivel',
  titulo: 'Problema 5 · Cuántos en cada nivel',
  enunciado:
    'El reporte de la dirección agrupa al grupo en tres niveles: reprueba quien tiene menos de 6, aprueba quien tiene ' +
    'de 6 a menos de 9, y sobresale quien tiene 9 o más. Devuelve una lista con tres números, en ese orden: cuántos ' +
    'reprueban, cuántos aprueban y cuántos sobresalen. Quien no ha entregado no está en ningún nivel.',
  firma: 'por_nivel(registros) → [reprueban, aprueban, sobresalen]',
  casos: [
    {
      nombre: 'tres que entregaron',
      llamada: `print(por_nivel(${lista(r('Diego', '5.5'), r('Valeria', '9.2'), r('Iker', '7.0'))}))`,
      esperada: ['[1, 1, 1]'],
    },
    { nombre: 'el grupo está vacío', llamada: 'print(por_nivel([]))', esperada: ['[0, 0, 0]'] },
    {
      nombre: 'justo en los límites',
      llamada: `print(por_nivel(${lista(r('Camila', '6.0'), r('Leo', '9.0'), r('Iván', '5.9'))}))`,
      esperada: ['[1, 1, 1]'],
      oculto: true,
    },
    { nombre: 'alguien no entregó', llamada: `print(por_nivel(${GRUPO}))`, esperada: ['[2, 3, 2]'], oculto: true },
    {
      nombre: 'alguien sacó cero',
      llamada: `print(por_nivel(${lista(r('Ana', '0'), r('Luis', '10'))}))`,
      esperada: ['[1, 0, 1]'],
      oculto: true,
    },
  ],
  pistas: [
    'Cada nivel dice exactamente dónde empieza y dónde acaba. Lee con cuidado a qué nivel pertenece un 6 y a cuál un 9.',
    'Son tres cuentas que se llevan a la vez, y cada calificación suma en una sola de ellas. Si una calificación pudiera sumar en dos, o en ninguna, tus tres números no darían el total de los que entregaron.',
    'Se recorren los registros saltando a quien no tiene calificación. Para los demás, una sola decisión de tres ramas: primero si es menor que 6, si no, si es menor que 9, y si no, el último nivel. Al final se devuelven las tres cuentas en una lista.',
  ],
};

export const D6: Problema = {
  id: 'd6-la-conclusion',
  titulo: 'Problema 6 · La conclusión',
  enunciado:
    'El reporte termina con una sola palabra para la maestra. Si más de la mitad de los alumnos que tienen ' +
    'calificación va reprobando, devuelve reforzar. Si no, devuelve va bien. La mitad justa no es más de la mitad. ' +
    'Y si nadie tiene calificación todavía, devuelve sin datos.',
  firma: 'conclusion(registros, minima) → reforzar, va bien o sin datos',
  casos: [
    {
      nombre: 'la mayoría reprueba',
      llamada: `print(conclusion(${lista(r('Ana', '5'), r('Luis', '4'), r('Eva', '9'))}, 6))`,
      esperada: ['reforzar'],
    },
    {
      nombre: 'todos aprueban',
      llamada: `print(conclusion(${lista(r('Ana', '8'), r('Luis', '9'))}, 6))`,
      esperada: ['va bien'],
    },
    {
      nombre: 'justo la mitad',
      llamada: `print(conclusion(${lista(r('Ana', '5'), r('Luis', '9'))}, 6))`,
      esperada: ['va bien'],
      oculto: true,
    },
    {
      nombre: 'dos no entregaron',
      llamada: `print(conclusion(${lista(r('Ana', '5'), r('Luis', '4'), r('Eva', '9'), r('Iker', 'None'), r('Leo', 'None'))}, 6))`,
      esperada: ['reforzar'],
      oculto: true,
    },
    {
      nombre: 'nadie ha entregado',
      llamada: `print(conclusion(${lista(r('Ana', 'None'))}, 6))`,
      esperada: ['sin datos'],
      oculto: true,
    },
  ],
  pistas: [
    '«Más de la mitad» ¿de quiénes? El enunciado lo dice: de los que tienen calificación, no de toda la lista.',
    'Con dos alumnos que no han entregado, la mitad de la lista y la mitad de los que tienen calificación son números distintos. Y con uno que reprueba de dos, ¿es más de la mitad?',
    'No hace falta volver a escribir nada: tus funciones de los problemas 1 y 3 ya cuentan a los que tienen calificación y a los que reprueban, y conviven en este mismo archivo. Se comparan esas dos cuentas, estrictamente, y antes se atiende el caso en que la primera es cero.',
  ],
};

export const PROBLEMAS_DATOS: readonly Problema[] = [D1, D2, D3, D4, D5, D6];
