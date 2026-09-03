import { torcer } from '@/components/simuladores/aprendizaje';
import type { Ejemplo, Esquema, Receta } from '@/components/simuladores/aprendizaje';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * `n7-como-aprende-la-ia` · el dominio, entero y sin React
 * N7 · U6 «IA I», parada 1 · 1.º de secundaria, 12–13 años
 * (comprobado en `src/data/curriculo.ts`: `n: 7 … edad: '12–13'`)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Aquí vive **todo lo que la clase da por cierto**: el esquema, la regla del
 * centro de acopio, el lote de abril con su acta, la semana de campo y los tres
 * lotes de refuerzo. Ni una función toca el DOM y ni una lee el reloj: el
 * reparto entrenamiento/prueba entra con **semilla constante**, así que los
 * números de la clase son los mismos en cualquier máquina y cualquier día
 * (trampa 3 de jsdom: nada de `Date.now()` ni `Math.random()` en la lógica).
 *
 * ── Por qué este dominio y no las mascotas de N5 ──────────────────────────
 *
 * `n5-la-ia-aprende-con-datos` etiqueta ocho fichas de mascotas y ve fallar a la
 * máquina con **una** de ellas. Aquí el alumno no etiqueta: **audita un conjunto
 * de datos que ya existe**, con su acta de recolección, y el fallo no es de una
 * ficha sino del procedimiento con que se recogieron todas. Por eso el dominio
 * es un lote de basura de verdad y no un animalario: la pregunta «¿dónde,
 * cuándo y quién recogió esto?» tiene que poder contestarse.
 *
 * ── Las dos ausencias, puestas a propósito ────────────────────────────────
 *
 * 1. **Cero tetrapak.** El esquema declara cuatro materiales; el lote trae tres.
 *    `examinar()` lo canta antes de entrenar y `informeDe()` dice, **antes de
 *    probar**, con qué contestará el modelo cuando le llegue uno.
 * 2. **Dos cartones limpios y nada más.** Esa regla se sostendrá en dos
 *    ejemplos: eso es memoria, no aprendizaje, y el informe lo marca.
 *
 * Ninguna de las dos se le dice al alumno: las tiene que encontrar midiendo.
 */

// ───────────────────────────────────────────────────────────────────────────
// 1 · El esquema — lo único que el sensor de la banda mide
// ───────────────────────────────────────────────────────────────────────────

export const MATERIALES = ['pet', 'aluminio', 'carton', 'tetrapak'] as const;
export const ESTADOS = ['limpio', 'sucio'] as const;
export const CONTENEDORES = ['reciclaje', 'basura'] as const;

export type Material = (typeof MATERIALES)[number];
export type Estado = (typeof ESTADOS)[number];
export type Contenedor = (typeof CONTENEDORES)[number];

/**
 * Dos rasgos y nada más, a propósito: la cámara de la banda mide de qué es el
 * envase y si viene limpio o sucio. No mide la marca, ni el peso, ni quién lo
 * tiró. **Lo que el modelo no puede leer, para el modelo no existe**, y ése es
 * el primer encargo de la clase.
 *
 * El orden de `etiquetas` manda: con él se desempatan las mayorías, y con él
 * contesta el modelo cuando se queda sin rama.
 */
export const ESQUEMA: Esquema = {
  rasgos: [
    { id: 'material', etiqueta: 'material', valores: [...MATERIALES] },
    { id: 'estado', etiqueta: 'estado', valores: [...ESTADOS] },
  ],
  etiquetas: [...CONTENEDORES],
};

/** Cómo se lee cada valor en pantalla. La UI no inventa rótulos. */
export const NOMBRE_MATERIAL: Record<Material, string> = {
  pet: 'PET (plástico)',
  aluminio: 'aluminio',
  carton: 'cartón',
  tetrapak: 'tetrapak',
};

export const NOMBRE_CONTENEDOR: Record<Contenedor, string> = {
  reciclaje: 'reciclaje',
  basura: 'basura',
};

// ───────────────────────────────────────────────────────────────────────────
// 2 · La regla de verdad del centro de acopio municipal
// ───────────────────────────────────────────────────────────────────────────

/**
 * A qué contenedor va **de verdad** cada envase, según el centro de acopio del
 * municipio. No se le enseña al alumno hasta el cierre: es el patrón contra el
 * que se mide todo lo demás.
 *
 * El aluminio es la excepción —la planta lava el metal antes de fundirlo— y es
 * justo lo que impide resolver el problema mirando un solo rasgo: quien mire
 * sólo `estado` falla con todas las latas sucias; quien mire sólo `material`
 * falla con el PET y el cartón sucios. Por eso el árbol que aprende de estos
 * datos tiene que preguntar dos veces.
 */
export function contenedorReal(material: Material, estado: Estado): Contenedor {
  if (material === 'aluminio') return 'reciclaje';
  if (material === 'tetrapak') return 'basura';
  return estado === 'limpio' ? 'reciclaje' : 'basura';
}

/** Un ejemplo con la etiqueta que le corresponde de verdad. */
function ficha(id: string, material: Material, estado: Estado): Ejemplo {
  return { id, rasgos: { material, estado }, etiqueta: contenedorReal(material, estado) };
}

/** `cuantos` fichas iguales, numeradas: `PL-1`, `PL-2`… */
function tanda(prefijo: string, material: Material, estado: Estado, cuantos: number): Ejemplo[] {
  return Array.from({ length: cuantos }, (_, i) => ficha(`${prefijo}-${i + 1}`, material, estado));
}

// ───────────────────────────────────────────────────────────────────────────
// 3 · El lote de abril — lo que el Comité de Acopio recogió
// ───────────────────────────────────────────────────────────────────────────

/**
 * 28 fichas · 17 `reciclaje` · 11 `basura` · **0 tetrapak**.
 *
 * Las proporciones no son decorativas, están calculadas para que el árbol salga
 * como tiene que salir (y hay pruebas que lo fijan):
 *
 * - **Diez latas sucias** hacen que `material` gane la raíz por mucho
 *   (ganancia ≈ 0,47 frente a ≈ 0,22 de `estado`), y con esa holgura el reparto
 *   no puede darle la vuelta. Que la raíz pregunte por el material es lo que
 *   deja **a todo el tetrapak** —limpio y sucio— sin rama: un único punto ciego,
 *   legible en el informe antes de probar nada.
 * - **Diecisiete `reciclaje` contra once `basura`** hacen que la mayoría de la
 *   raíz sea `reciclaje`, que es lo que el modelo contestará al atascarse. Como
 *   la verdad del tetrapak es `basura`, el grupo entero se va al 0 %.
 * - **Dos cartones limpios** dejan esa regla sostenida por dos ejemplos.
 */
export const LOTE_ABRIL: readonly Ejemplo[] = [
  ...tanda('PL', 'pet', 'limpio', 3),
  ...tanda('PS', 'pet', 'sucio', 4),
  ...tanda('AL', 'aluminio', 'limpio', 2),
  ...tanda('AS', 'aluminio', 'sucio', 10),
  ...tanda('CL', 'carton', 'limpio', 2),
  ...tanda('CS', 'carton', 'sucio', 7),
];

/** El papel donde está escrita la causa del sesgo. El encargo 8 se contesta leyéndolo. */
export const ACTA_ABRIL: readonly { campo: string; valor: string }[] = [
  { campo: 'Recogido', valor: 'del 6 al 10 de abril · 28 envases' },
  { campo: 'Punto', valor: 'el bote único de la cooperativa escolar' },
  { campo: 'Horario', valor: '10:15 a 10:45 (recreo)' },
  {
    campo: 'Nota del comité',
    valor: 'esa semana la cooperativa no vendió jugos en caja: el proveedor no surtió',
  },
  { campo: 'Etiquetado', valor: 'Ana y Luis, a mano, envase por envase, el viernes por la tarde' },
];

// ───────────────────────────────────────────────────────────────────────────
// 4 · El reparto — entrenamiento y prueba
// ───────────────────────────────────────────────────────────────────────────

/**
 * La parte que se aparta para el examen, y la semilla del barajado.
 *
 * **La semilla es una constante y entra por parámetro** porque `repartir` no
 * tiene azar propio: con la misma semilla sale el mismo reparto en cualquier
 * máquina. Un reparto irrepetible convertiría la clase en una lotería y las
 * pruebas en un sorteo.
 */
export const PARTE_DE_PRUEBA = 0.25;

/**
 * La semilla se eligió **midiendo**, no por gusto: con 1, 5 u 11 el informe
 * marca **una sola** regla como memoria (la del cartón limpio, sostenida por un
 * único ejemplo) y el encargo 5 tiene una respuesta inequívoca; con 7 o 13 son
 * dos las marcadas. Medido el 21-ago-2026 sobre las seis semillas.
 */
export const SEMILLA_REPARTO = 1;

/** Con este apoyo o menos, el informe marca la regla como memoria y no aprendizaje. */
export const TOPE_MEMORIA = 2;

// ───────────────────────────────────────────────────────────────────────────
// 5 · El lote de campo — la semana en que volvieron los jugos
// ───────────────────────────────────────────────────────────────────────────

/**
 * 20 envases de una semana normal, etiquetados por el **centro de acopio
 * municipal** (la verdad, no el comité). Seis son tetrapak: exactamente lo que
 * el lote de abril no llegó a ver nunca.
 */
export const LOTE_CAMPO: readonly Ejemplo[] = [
  ...tanda('FPL', 'pet', 'limpio', 3),
  ...tanda('FPS', 'pet', 'sucio', 2),
  ...tanda('FAL', 'aluminio', 'limpio', 2),
  ...tanda('FAS', 'aluminio', 'sucio', 3),
  ...tanda('FCL', 'carton', 'limpio', 2),
  ...tanda('FCS', 'carton', 'sucio', 2),
  ...tanda('FTL', 'tetrapak', 'limpio', 3),
  ...tanda('FTS', 'tetrapak', 'sucio', 3),
];

// ───────────────────────────────────────────────────────────────────────────
// 6 · Los tres lotes de refuerzo
// ───────────────────────────────────────────────────────────────────────────

/**
 * Quien etiquetó el lote C iba con prisa y mandó a `reciclaje` **todo lo que
 * estaba sucio**. Es el segundo modo de torcer que ofrece el motor —los datos
 * estaban, y estaban mal etiquetados— y es el más parecido a la vida real: no
 * falta nada, sobra mentira.
 */
export const RECETA_A_LAS_PRISAS: readonly Receta[] = [
  { donde: [{ rasgo: 'estado', valor: 'sucio' }], reetiquetar: 'reciclaje' },
];

const LOTE_C_BASE: readonly Ejemplo[] = [
  ...tanda('XPL', 'pet', 'limpio', 5),
  ...tanda('XPS', 'pet', 'sucio', 6),
  ...tanda('XAS', 'aluminio', 'sucio', 5),
  ...tanda('XCL', 'carton', 'limpio', 6),
  ...tanda('XCS', 'carton', 'sucio', 8),
  ...tanda('XTL', 'tetrapak', 'limpio', 5),
  ...tanda('XTS', 'tetrapak', 'sucio', 5),
];

export interface LoteRefuerzo {
  id: 'a' | 'b' | 'c';
  nombre: string;
  /** Lo que dice la etiqueta de la caja. Suena bien; sólo uno lo es. */
  reclamo: string;
  fichas: readonly Ejemplo[];
}

/**
 * Los tres, en el orden en que se ofrecen. **El grande no es el bueno**, y el
 * único que trae tetrapak además de todo lo demás es el peor: ésa es la trampa
 * del encargo 9. `torcer` se aplica aquí, una vez, al construir la constante —
 * no dentro de un componente.
 */
export const LOTES_REFUERZO: readonly LoteRefuerzo[] = [
  {
    id: 'a',
    nombre: 'Lote A · 40 latas',
    reclamo: '40 fichas nuevas. Cinco veces más datos que el lote B.',
    fichas: [...tanda('ZAS', 'aluminio', 'sucio', 30), ...tanda('ZAL', 'aluminio', 'limpio', 10)],
  },
  {
    id: 'b',
    nombre: 'Lote B · 8 tetrapak',
    reclamo: '8 fichas nuevas. Sólo tetrapak, limpio y sucio.',
    fichas: [...tanda('ZTL', 'tetrapak', 'limpio', 4), ...tanda('ZTS', 'tetrapak', 'sucio', 4)],
  },
  {
    id: 'c',
    nombre: 'Lote C · 40 a las prisas',
    reclamo: '40 fichas nuevas de todos los materiales, tetrapak incluido.',
    // Se tuerce aquí, una sola vez y con la receta del motor, no en el
    // componente: el dato entra ya mentido, como en la vida.
    fichas: torcer(LOTE_C_BASE, RECETA_A_LAS_PRISAS),
  },
];

export const LOTE_CORRECTO: LoteRefuerzo['id'] = 'b';

// ───────────────────────────────────────────────────────────────────────────
// 7 · Los encargos
// ───────────────────────────────────────────────────────────────────────────

export const TOTAL_PASOS = 9;

/** Lo que resta cada error. El valor de la casa. */
export const PENALIZACION = 6;

export interface Opcion {
  id: string;
  texto: string;
}

/** E1 · las cabeceras de la tabla. Dos son rasgos, una es la etiqueta. */
export const COLUMNAS: readonly { id: string; titulo: string; esEtiqueta: boolean }[] = [
  { id: 'material', titulo: 'material', esEtiqueta: false },
  { id: 'estado', titulo: 'estado', esEtiqueta: false },
  { id: 'contenedor', titulo: 'contenedor', esEtiqueta: true },
];

/** E2 · quién escribió la columna de la etiqueta. */
export const AUTORES: readonly Opcion[] = [
  { id: 'camara', texto: 'La cámara de la banda la midió con el sensor.' },
  { id: 'programa', texto: 'El programa la calculó a partir del material y el estado.' },
  { id: 'persona', texto: 'La escribió a mano una persona del comité, envase por envase.' },
];
export const AUTOR_CORRECTO = 'persona';

/** E4 · qué es lo único que puede medir un examen apartado. */
export const LECTURAS_DEL_EXAMEN: readonly Opcion[] = [
  { id: 'mundo', texto: 'Que el modelo funcionará con cualquier basura del mundo.' },
  {
    id: 'parecida',
    texto: 'Que el modelo funciona con basura parecida a la que ya recogimos.',
  },
  { id: 'etiquetado', texto: 'Que Ana y Luis etiquetaron bien las 28 fichas.' },
];
export const LECTURA_CORRECTA = 'parecida';

/** E6 · qué sostiene el informe del árbol, sin haber probado nada todavía. */
export const PRONOSTICOS: readonly Opcion[] = [
  {
    id: 'callara',
    texto: 'Cuando le llegue un tetrapak se quedará sin rama y no contestará nada.',
  },
  {
    id: 'contestara',
    texto:
      'Cuando le llegue un tetrapak se quedará sin rama y contestará «reciclaje», apoyándose en las fichas de la raíz.',
  },
  {
    id: 'aprendera',
    texto: 'Cuando le llegue un tetrapak lo añadirá a su árbol y aprenderá de él.',
  },
];
export const PRONOSTICO_CORRECTO = 'contestara';

/** E8 · las cuatro causas. El acta sostiene una. */
export const CAUSAS: readonly Opcion[] = [
  { id: 'regla', texto: 'Alguien escribió en el programa una regla contra el tetrapak.' },
  { id: 'brillo', texto: 'El modelo prefiere los materiales brillantes.' },
  {
    id: 'proveedor',
    texto: 'Esa semana el proveedor no surtió jugos en caja: no había ni un tetrapak que recoger.',
  },
  { id: 'dificil', texto: 'El tetrapak es más difícil de clasificar que el aluminio.' },
];
export const CAUSA_CORRECTA = 'proveedor';

// ───────────────────────────────────────────────────────────────────────────
// 8 · Los textos largos, fuera del componente
// ───────────────────────────────────────────────────────────────────────────

/**
 * Lo que dice Bit. Registro de secundaria (§30.4): el término técnico con su
 * traducción la primera vez, el porqué antes que el qué, refuerzo **informativo**
 * y cero diminutivos. Ni un «¡muy bien!» suelto en todo el archivo.
 */
export const LINEAS = {
  inicio:
    'Comité de Acopio. La banda separadora no se programa: se entrena con lo que recogimos en abril. Tú respondes por esos datos.',
  e1_bien:
    'Correcto. «contenedor» es la etiqueta (label): la respuesta que el modelo tiene que aprender a dar. Las otras dos columnas son los rasgos (features), lo único que el sensor mide. Un ejemplo de entrenamiento es exactamente eso, rasgos más etiqueta, y nada más.',
  e1_mal:
    'Ésa es un rasgo: algo que el sensor mide por su cuenta. La etiqueta es la respuesta, la columna que el modelo tendrá que rellenar solo cuando ya nadie se la dé.',
  e2_bien:
    'Correcto. Un conjunto de datos de entrenamiento no se recoge: se etiqueta. Ana y Luis miraron 28 envases y escribieron uno por uno a qué contenedor iba. Si se equivocaron, el modelo aprende el error, y no tiene forma de saber que era un error: si está en la tabla, para él es la verdad.',
  e2_mal:
    'No. Ningún sensor sabe a qué contenedor va un envase: eso es una decisión, no una medición. Lee otra vez el acta y fíjate en la última línea.',
  e3_bien:
    'Correcto: cero tetrapak. El esquema declara cuatro materiales y el lote trae tres. Y fíjate en lo que NO va a pasar: el modelo no va a avisar. Va a entrenar igual y a contestar igual de rápido cuando le llegue uno.',
  e3_mal:
    'De ése sí hay ejemplos. Busca el grupo cuyo recuento es cero: el que el esquema declara y el lote nunca vio.',
  e4_mismas:
    'Cien por ciento. Y no significa nada: le preguntaste exactamente lo que le enseñaste. Es un examen con las respuestas sobre la mesa.',
  e4_apartado:
    'Ahora sí es un examen: seis fichas que el modelo no vio al entrenar. Apuntado queda. Dentro de tres encargos vas a volver a este número.',
  e4_bien:
    'Correcto, y es la frase más incómoda de la clase. El examen apartado sale de los mismos datos, así que hereda sus huecos. Un 100 % ahí no dice que el modelo funcione: dice que funciona en el mundo del que salieron tus datos.',
  e4_mal:
    'No. Un examen sólo puede preguntar por lo que hay en él, y lo que hay en él salió del mismo montón que el entrenamiento.',
  e5_bien:
    'Correcto: un solo ejemplo la sostiene. Un ejemplo no es una regla, es un recuerdo. Y el modelo la aplicará con la misma seguridad que la de las nueve latas: no distingue una regla que aprendió de una que memorizó. Generalizar es acertar en algo que no viste; memorizar es repetir lo que sí viste.',
  e5_mal:
    'Ésa se sostiene en más ejemplos. Mira el número que va al lado de cada regla: es cuántas fichas del montón de estudio la respaldan.',
  e6_bien:
    'Correcto, y sin haber probado nada. Esto se lee del árbol: la raíz pregunta por el material y no tiene rama para tetrapak. Lo que hará entonces no es callarse, es contestar lo que más abunda. Un modelo que no sabe no lo dice.',
  e6_mal:
    'No. Un árbol no aprende mientras trabaja, y tampoco se queda callado: cuando se queda sin rama contesta la etiqueta mayoritaria del punto donde se atascó. Vuelve a leer el informe.',
  e7_bien:
    'Correcto. Y ahora mira los dos números juntos: el acierto total y la brecha. Eso no es un modelo bueno con un defecto, es un modelo que no funciona para un grupo entero y que aprueba porque los otros tres grupos lo tapan. El total solo no enseña nada; el desglose es la clase.',
  e7_mal:
    'En ese grupo el modelo acierta. Busca la fila del boletín donde el acierto es cero: no falló algunas veces, falló todas.',
  e8_bien:
    'Correcto, y fíjate en lo que significa: nadie programó el sesgo. Lo programó el calendario del proveedor. Un sesgo (bias) en los datos es una diferencia sistemática entre lo que recogiste y el mundo donde vas a soltar el modelo. No hace falta mala intención: basta con recoger en un solo punto, a una sola hora, durante una sola semana.',
  e8_mal:
    'Eso no lo sostiene el acta, y en el programa no hay ni una regla escrita a mano: todas salieron de los datos. Vuelve al acta y busca por qué no había tetrapak que recoger.',
  e9_a: 'El conjunto crece un 143 % y la brecha no se mueve ni un punto. Ya sabía de latas.',
  e9_b: 'Ocho fichas. La brecha se cae y el acierto de campo sube al máximo.',
  e9_c: 'Cuarenta fichas, tetrapak incluido, y el modelo empeora. Guarda ese número.',
  e9_bien:
    'Correcto. El lote A tenía cinco veces más fichas que el B y no movió la brecha. El C era el más grande, traía tetrapak y aun así empeoró el modelo, porque sus etiquetas estaban mal. No es la cantidad de datos: es qué falta, y si lo que llega es verdad.',
  e9_mal:
    'Ese lote lo probaste y el número quedó en la bitácora. Míralo otra vez: no busques el más grande, busca el que baja la brecha sin romper lo que ya funcionaba.',
  cierre:
    'Queda anotado. Un modelo no puede saber más de lo que hay en sus datos, y su examen tampoco.',
} as const;
