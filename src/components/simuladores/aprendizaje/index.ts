/**
 * ══════════════════════════════════════════════════════════════════════════
 * TECNIA APRENDIZAJE · el clasificador de juguete
 * El motor que enseña CÓMO APRENDE UNA IA. No es interfaz: es motor con banco
 * de pruebas propio, como el evaluador de fórmulas o el intérprete de Python.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * ── Por qué existe ────────────────────────────────────────────────────────
 *
 * De las 16 actividades del armazón del asistente de IA hay **cuatro que un
 * guion no puede servir jamás**, porque en ellas el sentido es el contrario de
 * un guion: la máquina tiene que **fallar en lo que el alumno no le enseñó**.
 * Un guion sabe la respuesta de antemano; aquí la respuesta la decide lo que el
 * alumno etiquetó.
 *
 *   `n5-la-ia-aprende-con-datos` · `n7-como-aprende-la-ia`
 *   `n8-sesgos-y-errores`        · `n10-como-funcionan-los-modelos`
 *
 * ── Los cuatro archivos ───────────────────────────────────────────────────
 *
 *   modelo.ts    los datos y lo que se puede decir de ellos SIN entrenar
 *   arbol.ts     entrenar, predecir y el informe de qué aprendió
 *   examen.ts    repartir, torcer, probar y **medir el sesgo por grupos**
 *   senales.ts   los hechos, con un id de ficha estable para el asistente
 *
 * ── Una clase, de principio a fin ─────────────────────────────────────────
 *
 * ```ts
 * const ESQUEMA: Esquema = {
 *   rasgos: [
 *     { id: 'color',  valores: ['naranja', 'blanco', 'negro'] },
 *     { id: 'orejas', valores: ['puntiagudas', 'caidas'] },
 *   ],
 *   etiquetas: ['gato', 'perro'],
 * };
 *
 * // 1 · el alumno etiqueta; el motor le dice qué tiene y qué le falta
 * const auditoria = examinar(ESQUEMA, banco);   // huecos, valoresNoVistos…
 *
 * // 2 · unos para aprender y otros para el examen — la mitad de la clase
 * const { entrenamiento, prueba } = repartir(banco, { prueba: 0.3, semilla: 7 });
 *
 * // 3 · entrena, y el informe dice YA por dónde se va a romper
 * const modelo  = entrenar(ESQUEMA, entrenamiento);
 * const informe = informeDe(modelo);            // reglas, memorizadas, ciegos
 *
 * // 4 · predice, con seguridad y con los ejemplos que lo sostienen
 * const p = predecir(modelo, { color: 'negro', orejas: 'puntiagudas' });
 * // p.motivo === 'valor-no-visto'  ·  p.atascoEn.valor === 'negro'
 *
 * // 5 · prueba, y el sesgo sale por grupo, no en el total
 * const examen = evaluar(modelo, prueba);
 * brechaDe(examen, 'color').diferencia;         // 1 = un grupo entero al 0 %
 *
 * // 6 · y el asistente lo cuenta
 * senalesDe({ auditoria, informe, examen, brechas: ['color'] })
 *   .forEach((s) => ia.enviarFicha(s.id));
 * ```
 *
 * ── Las cinco reglas de la casa, en este motor ────────────────────────────
 *
 * 1. **Explicable por encima de acertado.** Árbol de preguntas con nombre. La
 *    explicación no es un texto: es el camino recorrido más los ejemplos
 *    concretos que hay al final, y `ejemplosQueCasan` la puede comprobar desde
 *    fuera. Una explicación bonita que no case con el modelo es peor que
 *    ninguna.
 * 2. **Determinista.** Ni `Math.random()` ni `Date.now()` en todo el paquete
 *    (hay una prueba que lo comprueba leyendo los archivos). Los empates los
 *    rompe el orden que declaró el esquema, y la semilla del barajado entra por
 *    parámetro.
 * 3. **Con pocos ejemplos se nota, y se puede decir.** `examinar` da los
 *    ejemplos por etiqueta y las combinaciones que no ha visto nunca;
 *    `informeDe` marca las reglas que son memoria y no aprendizaje.
 * 4. **No corrige.** No hay ni una frase para el alumno en todo el paquete:
 *    cuentas, ids y caminos. El juicio es de la clase.
 * 5. **Sin librerías y sin IA de verdad.** Contar, dividir y elevar al cuadrado.
 */

export {
  SIN_DATO,
  casaCamino,
  ejemplosQueCasan,
  etiquetasEnOrden,
  examinar,
  revisar,
  valorDe,
} from './modelo';
export type {
  Auditoria,
  Condicion,
  Contradiccion,
  Ejemplo,
  Esquema,
  Hueco,
  Marca,
  Rasgo,
} from './modelo';

export { entrenar, informeDe, predecir } from './arbol';
export type {
  Atasco,
  Candidato,
  Ciego,
  Informe,
  Modelo,
  MotivoHoja,
  MotivoPrediccion,
  Nodo,
  NodoHoja,
  NodoPregunta,
  OpcionesEntreno,
  OpcionesInforme,
  PasoPrediccion,
  Prediccion,
  Rama,
  Regla,
} from './arbol';

export { SIN_RESPUESTA, brechaDe, evaluar, repartir, torcer } from './examen';
export type {
  Brecha,
  Examen,
  Fallo,
  Grupo,
  OpcionesReparto,
  Receta,
  Reparto,
} from './examen';

export { senalDePrediccion, senalesDe } from './senales';
export type { ClaseSenal, Senal, Vista } from './senales';
