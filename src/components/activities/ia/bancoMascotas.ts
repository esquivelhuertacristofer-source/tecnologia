import type { Ejemplo, Esquema } from '@/components/simuladores/aprendizaje';

/**
 * ══════════════════════════════════════════════════════════════════════════
 * `n5-la-ia-aprende-con-datos` · el banco del club de mascotas
 * Los DATOS de la clase, separados de la pantalla y del guion.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Aquí no hay ni una línea de React ni una frase del asistente: sólo el
 * esquema, las ocho fichas que el alumno etiqueta, las cuatro que le va a
 * preguntar después y las ocho candidatas de las dos bandejas de arreglo.
 * Así la prueba de la clase puede medir el banco con el motor —sin montar
 * nada— y comprobar que los dos fallos de la lección siguen siendo los dos
 * fallos de la lección.
 *
 * ── El banco está construido, no recogido ─────────────────────────────────
 *
 * Todo lo de este archivo existe para que pasen exactamente DOS cosas, que
 * son las dos familias de fallo del motor y las dos lecciones de la clase
 * (medido con el motor, no supuesto — ver §52.2 del documento):
 *
 *  1 · **El gato negro.** Hay fichas negras y **todas son perros**. El árbol
 *      aprende `negro ⇒ perro` en una hoja PURA, así que al gato negro le
 *      contesta «perro» con el **100 %** de seguridad. Sale por `huecos`
 *      (`hueco:color=negro/gato`) en la auditoría, ANTES de entrenar.
 *
 *  2 · **El perro gris.** `gris` está declarado en el esquema y no aparece en
 *      ninguna ficha. El árbol no tiene rama por donde meterlo: se atasca y
 *      contesta lo que más hay. `informeDe().ciegos` lo dice **antes de
 *      probar**, con nombre y con la respuesta que va a dar.
 *
 * Y una tercera que sale de regalo y no se buscó: el árbol **ni mira la
 * cola**. `informeDe().rasgosIgnorados` es `['cola']`, y eso se enseña en
 * pantalla, porque «la máquina se agarró de lo primero que le servía» es la
 * mitad de lo que hay que entender aquí.
 *
 * ── Por qué `gris` está declarado y no aparece ────────────────────────────
 *
 * Porque es la diferencia entre los dos fallos, y esa diferencia es la clase:
 * del **negro** la máquina sabe algo (equivocado); del **gris** no sabe nada
 * y **contesta igual**. Si `gris` no estuviera en el esquema, el motor no
 * tendría cómo saber que le falta —un valor que nadie declaró no es un hueco,
 * es un valor que no existe— y `ciegos` vendría vacío.
 */

// ───────────────────────────────────────────────────────────────────────────
// 1 · El esquema
// ───────────────────────────────────────────────────────────────────────────

/**
 * Tres rasgos con nombre y valores con nombre. Nada de números: un árbol sobre
 * números pregunta «¿el tamaño es mayor que 3,47?» y ese 3,47 no se lo puede
 * explicar nadie a alguien de once años (cabecera de `modelo.ts`).
 *
 * El ORDEN manda dos veces, y las dos están medidas:
 *  · en los rasgos, porque desempata qué pregunta gana cuando dos miden igual
 *    —y en esta clase hay un empate exacto entre `orejas` y `cola` dentro de
 *    la rama negra, después de la primera cura—;
 *  · en las etiquetas, porque desempata la mayoría: con el banco inicial hay
 *    4 gatos y 4 perros, así que al perro gris le contesta «gato» **por el
 *    orden de esta línea**, no porque lo sepa.
 */
export const ESQUEMA: Esquema = {
  rasgos: [
    { id: 'color', etiqueta: 'Color', valores: ['naranja', 'blanco', 'negro', 'gris'] },
    { id: 'orejas', etiqueta: 'Orejas', valores: ['puntiagudas', 'caidas'] },
    { id: 'cola', etiqueta: 'Cola', valores: ['esponjada', 'delgada'] },
  ],
  etiquetas: ['gato', 'perro'],
};

export const GATO = 'gato';
export const PERRO = 'perro';

/** Como se lee un valor en pantalla. El motor guarda `caidas` sin tilde. */
export const COMO_SE_LEE: Record<string, string> = {
  naranja: 'naranja',
  blanco: 'blanco',
  negro: 'negro',
  gris: 'gris',
  puntiagudas: 'puntiagudas',
  caidas: 'caídas',
  esponjada: 'esponjada',
  delgada: 'delgada',
  gato: 'gato',
  perro: 'perro',
};

export function comoSeLee(valor: string): string {
  return COMO_SE_LEE[valor] ?? valor;
}

// ───────────────────────────────────────────────────────────────────────────
// 2 · Las fichas que el alumno etiqueta
// ───────────────────────────────────────────────────────────────────────────

/** Una ficha del banco tal como se ve en la mesa: rasgos, nombre y dibujo. */
export interface FichaMascota {
  id: string;
  nombre: string;
  emoji: string;
  color: string;
  orejas: string;
  cola: string;
  /** Lo que de verdad es. **La mesa no lo enseña**: lo pone el alumno. */
  verdad: string;
}

/**
 * Ocho fichas. El emoji dice qué animal es —etiquetar tiene que ser fácil: la
 * clase no es «¿sabes distinguir un gato de un perro?», es «la máquina sólo
 * sabe lo que le enseñaste»—. Lo que NO es fácil es darse cuenta de qué falta
 * en el montón, y eso es justo lo que se descubre al final.
 */
export const FICHAS: FichaMascota[] = [
  { id: 'f1', nombre: 'Michi', emoji: '🐱', color: 'naranja', orejas: 'puntiagudas', cola: 'esponjada', verdad: GATO },
  { id: 'f2', nombre: 'Pelusa', emoji: '🐱', color: 'naranja', orejas: 'caidas', cola: 'delgada', verdad: GATO },
  { id: 'f3', nombre: 'Nube', emoji: '🐱', color: 'blanco', orejas: 'puntiagudas', cola: 'esponjada', verdad: GATO },
  { id: 'f4', nombre: 'Copo', emoji: '🐱', color: 'blanco', orejas: 'puntiagudas', cola: 'delgada', verdad: GATO },
  { id: 'f5', nombre: 'Rocky', emoji: '🐶', color: 'negro', orejas: 'caidas', cola: 'esponjada', verdad: PERRO },
  { id: 'f6', nombre: 'Nala', emoji: '🐶', color: 'negro', orejas: 'caidas', cola: 'delgada', verdad: PERRO },
  { id: 'f7', nombre: 'Zeus', emoji: '🐶', color: 'negro', orejas: 'puntiagudas', cola: 'delgada', verdad: PERRO },
  { id: 'f8', nombre: 'Canela', emoji: '🐶', color: 'blanco', orejas: 'caidas', cola: 'delgada', verdad: PERRO },
];

/** Una ficha del banco, con la etiqueta que le puso el alumno. */
export function comoEjemplo(ficha: FichaMascota, etiqueta: string): Ejemplo {
  return {
    id: ficha.id,
    rasgos: { color: ficha.color, orejas: ficha.orejas, cola: ficha.cola },
    etiqueta,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// 3 · Las cuatro preguntas del examen
// ───────────────────────────────────────────────────────────────────────────

export interface Prueba {
  id: string;
  nombre: string;
  emoji: string;
  color: string;
  orejas: string;
  cola: string;
  /** Lo que de verdad es. El motor no lo ve hasta que se compara. */
  verdad: string;
  /** Lo que esta ficha viene a enseñar, en la propia mesa. */
  porQue: string;
}

/**
 * Cuatro fichas que la máquina **no vio nunca**. En este orden a propósito:
 * dos aciertos primero, para que el fallo del tercero no parezca que la
 * máquina está rota, sino que le falta algo concreto.
 */
export const PRUEBAS: Prueba[] = [
  {
    id: 't1',
    nombre: 'Tigre',
    emoji: '🐱',
    color: 'naranja',
    orejas: 'puntiagudas',
    cola: 'delgada',
    verdad: GATO,
    porQue: 'Un gato naranja. De naranjas vio dos, y los dos eran gatos.',
  },
  {
    id: 't2',
    nombre: 'Duque',
    emoji: '🐶',
    color: 'blanco',
    orejas: 'caidas',
    cola: 'esponjada',
    verdad: PERRO,
    porQue: 'Un perro blanco. De blancos con orejas caídas vio uno solo.',
  },
  {
    id: 't3',
    nombre: 'Sombra',
    emoji: '🐱',
    color: 'negro',
    orejas: 'puntiagudas',
    cola: 'esponjada',
    verdad: GATO,
    porQue: 'Un gato negro. Y tú no le enseñaste ni un gato negro.',
  },
  {
    id: 't4',
    nombre: 'Niebla',
    emoji: '🐶',
    color: 'gris',
    orejas: 'caidas',
    cola: 'delgada',
    verdad: PERRO,
    porQue: 'Un perro gris. Y de gris no vio absolutamente nada.',
  },
];

export function pruebaComoEjemplo(p: Prueba): Ejemplo {
  return { id: p.id, rasgos: { color: p.color, orejas: p.orejas, cola: p.cola }, etiqueta: p.verdad };
}

export const EJEMPLOS_DE_PRUEBA: Ejemplo[] = PRUEBAS.map(pruebaComoEjemplo);

// ───────────────────────────────────────────────────────────────────────────
// 4 · Las bandejas de arreglo
// ───────────────────────────────────────────────────────────────────────────

export interface Candidata {
  id: string;
  etiquetaBoton: string;
  emoji: string;
  color: string;
  orejas: string;
  cola: string;
  esEtiqueta: string;
  /**
   * Qué hace esta ficha con la prueba que se está arreglando. **Medido con el
   * motor**, no supuesto: hay una prueba que entrena con cada una de las ocho
   * y comprueba que este campo dice la verdad.
   */
  cura: boolean;
  /** El id de la respuesta del guion que se lee al ponerla en la mesa. */
  respuesta: string;
}

/** Ronda A: arreglar el gato negro (`t3`). */
export const CANDIDATAS_A: Candidata[] = [
  {
    id: 'a1',
    etiquetaBoton: 'Otro gato naranja',
    emoji: '🐱',
    color: 'naranja',
    orejas: 'puntiagudas',
    cola: 'delgada',
    esEtiqueta: GATO,
    cura: false,
    respuesta: 'a-otro-naranja',
  },
  {
    id: 'a2',
    etiquetaBoton: 'Un gato negro',
    emoji: '🐱',
    color: 'negro',
    orejas: 'puntiagudas',
    cola: 'esponjada',
    esEtiqueta: GATO,
    cura: true,
    respuesta: 'a-cura',
  },
  {
    id: 'a3',
    etiquetaBoton: 'Otro perro negro',
    emoji: '🐶',
    color: 'negro',
    orejas: 'caidas',
    cola: 'esponjada',
    esEtiqueta: PERRO,
    cura: false,
    respuesta: 'a-otro-perro-negro',
  },
  {
    id: 'a4',
    etiquetaBoton: 'Un perro gris',
    emoji: '🐶',
    color: 'gris',
    orejas: 'caidas',
    cola: 'delgada',
    esEtiqueta: PERRO,
    cura: false,
    respuesta: 'a-perro-gris',
  },
];

/** Ronda B: arreglar el perro gris (`t4`). */
export const CANDIDATAS_B: Candidata[] = [
  {
    id: 'b1',
    etiquetaBoton: 'Otro perro negro',
    emoji: '🐶',
    color: 'negro',
    orejas: 'caidas',
    cola: 'esponjada',
    esEtiqueta: PERRO,
    cura: false,
    respuesta: 'b-otro-perro-negro',
  },
  {
    id: 'b2',
    etiquetaBoton: 'Un perro gris',
    emoji: '🐶',
    color: 'gris',
    orejas: 'caidas',
    cola: 'delgada',
    esEtiqueta: PERRO,
    cura: true,
    respuesta: 'b-cura',
  },
  {
    id: 'b3',
    etiquetaBoton: 'Un gato gris',
    emoji: '🐱',
    color: 'gris',
    orejas: 'puntiagudas',
    cola: 'esponjada',
    esEtiqueta: GATO,
    cura: false,
    respuesta: 'b-gato-gris',
  },
  {
    id: 'b4',
    etiquetaBoton: 'Otro gato naranja',
    emoji: '🐱',
    color: 'naranja',
    orejas: 'puntiagudas',
    cola: 'delgada',
    esEtiqueta: GATO,
    cura: false,
    respuesta: 'b-otro-naranja',
  },
];

export function candidataComoEjemplo(c: Candidata): Ejemplo {
  return { id: c.id, rasgos: { color: c.color, orejas: c.orejas, cola: c.cola }, etiqueta: c.esEtiqueta };
}

/** Las dos rondas de arreglo, en orden: primero el gato negro, luego el gris. */
export const RONDAS: { pruebaId: string; candidatas: Candidata[]; titulo: string }[] = [
  { pruebaId: 't3', candidatas: CANDIDATAS_A, titulo: 'Arregla el gato negro' },
  { pruebaId: 't4', candidatas: CANDIDATAS_B, titulo: 'Arregla el perro gris' },
];
