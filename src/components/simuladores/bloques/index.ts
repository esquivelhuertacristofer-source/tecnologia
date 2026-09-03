/**
 * TECNIA BLOQUES — el armazón del que cuelgan las 8 actividades de bloques.
 *
 *   arbolBloques.ts      el modelo y las reglas de encaje (puro, sin React)
 *   interpreteBloques.ts el intérprete paso a paso (puro, sin relojes)
 *   retoBloques.ts       el juez del reto, que lo pone la actividad
 *   useBloques.ts        el estado: guion, pieza en la mano, corrida y reloj
 *   VentanaBloques.tsx   el editor, sin un solo `useState`
 *
 * Cómo se monta una clase:
 *
 *   const bl = useBloques({ catalogo: MIS_FICHAS, inicial: MI_GUION, velocidad: 250,
 *                           preguntar: (p) => mundo.contesta(p),
 *                           onEvento: (e) => e.tipo === 'accion' && mundo.hacer(e.accion) });
 *   <VentanaBloques
 *     catalogo={MIS_FICHAS} categorias={MIS_CATEGORIAS} …
 *     escenario={<MiCuadricula mundo={mundo} />}   // ← aquí divergen las ocho
 *     panel={<MiEnunciado … />}
 *   />
 *
 * ── DE DÓNDE SALE, Y QUÉ SE LE AÑADIÓ ─────────────────────────────────────
 *
 * De `n4/estudio/tecniaBloques.tsx` (1 375 líneas) y `programaBloques.ts`, que
 * ya servían a cuatro clases de N4·U3. Medido antes de tocar nada, lo que YA
 * tenían y no había que reinventar:
 *
 *   · componente 100 % controlado, cero `useState`, todo por parámetro;
 *   · paleta por parámetro (`fichas`), con categorías, formas y colores;
 *   · las dos vías de encaje —arrastrar, y tocar pieza + tocar hueco—;
 *   · la regla de encaje en UN sitio, la misma que pinta y la que acepta;
 *   · `activo`: un bloque iluminado mientras se ejecuta;
 *   · intérprete puro y aparte, con pruebas, y tope contra el bucle infinito;
 *   · la forma como lección: hexágono en agujero hexagonal, con `clip-path`.
 *
 * Y lo que le faltaba para ser armazón, que es lo que añade este paquete:
 *
 *   1. ANIDAMIENTO DE VERDAD. `NodoSi.cuerpo` era `NodoOrden[]`: dentro de un
 *      `si` no cabía otro `si`. Aquí el árbol es recursivo y sin fondo.
 *   2. BUCLES. No existía `repetir`, ni `mientras`, ni `repetir hasta`; el único
 *      bucle era un `por siempre` que venía puesto de fábrica y no se podía ni
 *      quitar ni mover. Cinco de las ocho actividades los piden.
 *   3. VOCABULARIO ABIERTO. `Accion` y `Pregunta` eran uniones cerradas de 13 y
 *      8 literales del tablero de N4: añadir un verbo obligaba a tocar el motor.
 *      Ahora son `string` y el armazón no los interpreta, sólo los emite.
 *   4. EJECUCIÓN PASO A PASO. `simular()` calculaba la película entera antes de
 *      mover a nadie; pausar, seguir y leer el teclado a mitad eran imposibles.
 *      `siguiente()` avanza un bloque y devuelve el control.
 *   5. EL ESCENARIO, FUERA. El editor se dibujaba dentro del bisel de un monitor
 *      3D —588 x 310 px clavados, y 72 de sus 224 reglas de CSS colgaban de un
 *      ancestro `.arcade-n1`—. Aquí el escenario es un hueco y la ventana no
 *      sabe si hay 3D detrás.
 *   6. LA EDICIÓN DEL ÁRBOL, ADENTRO. `ponerCondicion`, `ponerOrden`,
 *      `quitarCondicion`, `quitarNodo` y `lecturaDe` estaban copiadas en tres
 *      laboratorios (`LabSiPasaEsto` 222-293, `LabVariablesYPuntajes` 341-418,
 *      `LabCreaTuVideojuego` 250-329) y ya habían divergido: las de
 *      `LabSiPasaEsto` devuelven `{ siempre }` y pierden la zona de arranque, y
 *      sólo no se nota porque esa clase no la usa.
 *   7. VARIAS PILAS CON SOMBRERO, y llamadas entre ellas. Con una sola lista no
 *      se puede armar un bloque propio ni un flujo por disparador.
 *   8. EL JUEZ DEL RETO, por parámetro (`retoBloques.ts`).
 *
 * ── LO QUE ESTE PAQUETE NO HACE (y a quién le falta) ──────────────────────
 *
 *   · No corre dos guiones a la vez. `llamar` es una llamada SÍNCRONA, como el
 *     «enviar mensaje y esperar» de Scratch, y `correr(pila)` arranca el guion
 *     que diga el disparador —que es lo que necesitan `n6-programa-un-microbit`
 *     y `n9-automatiza-tareas`—, pero de uno en uno. Un juego con dos personajes
 *     moviéndose a la vez (`n5-juego-con-niveles`, `n8-disena-tu-videojuego`)
 *     pediría varias corridas simultáneas, y eso hoy no está.
 *   · No trae editor de texto al lado. `n6-bloques-vs-codigo` necesita montar
 *     este armazón junto a Tecnia Código; el enganche está puesto —cada ficha
 *     lleva su `texto`— pero el traductor de árbol a programa lo escribe esa
 *     clase, que es la única que sabe a qué lenguaje traduce.
 *   · No trae diseñador de pantalla. `n9-construye-low-code` lo monta como
 *     `escenario`.
 *   · Las cuatro clases de N4·U3 siguen con el editor viejo: migrarlas es tocar
 *     cuatro `Lab*.tsx` mientras otro agente está migrando laboratorios a
 *     `VentanaBase`, y sin git el último que escribe borra al otro.
 */

export {
  admiteCarga,
  admiteCondicion,
  bloquesDe,
  buscarBloque,
  cabeEn,
  claveSitio,
  contarBloques,
  esDescendiente,
  fichaDe,
  formaDe,
  mismoSitio,
  moverBloque,
  nuevoBloque,
  pila,
  pilaDe,
  ponerArg,
  programaDe,
  puedeMoverse,
  quitar,
  ramasDe,
  recorrer,
  soltarFicha,
  verboDe,
} from './arbolBloques';
export type {
  Args,
  BloquePuesto,
  Carga,
  Encaje,
  FichaBloque,
  FormaBloque,
  MotivoRechazo,
  Pila,
  Programa,
  RanuraFicha,
  ResultadoEdicion,
  Semantica,
  Sitio,
} from './arbolBloques';

export {
  TOPE_LLAMADAS,
  TOPE_PASOS,
  arrancar,
  bloqueActivo,
  cortar,
  ejecutarTodo,
  siguiente,
} from './interpreteBloques';
export type {
  EstadoEjecucion,
  EventoBloques,
  FinEjecucion,
  InformeCorrida,
  OpcionesEjecucion,
  PasoBloques,
  Preguntar,
} from './interpreteBloques';

export {
  alguno,
  comoMuchoBloques,
  retoDe,
  secuenciaContiene,
  secuenciaExacta,
  tamanoDe,
  terminoLimpio,
  todos,
  usaFicha,
} from './retoBloques';
export type { Criterio, Reto, Veredicto } from './retoBloques';

export { useBloques } from './useBloques';
export type { Bloques, OpcionesBloques, Rechazo, ResultadoCorrer } from './useBloques';

export { VentanaBloques, cargaDeTexto } from './VentanaBloques';
export type {
  CategoriaBloques,
  VelocidadBloques,
  VentanaBloquesProps,
} from './VentanaBloques';
