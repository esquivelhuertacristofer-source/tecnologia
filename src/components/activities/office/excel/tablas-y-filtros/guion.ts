import { cajaDeTexto } from '@/components/office/motor-hojas/comandos';
import { crearMotor, type Motor } from '@/components/office/motor-hojas/formula/calculo';
import { RELOJ_DE_LA_CLASE, type GuionHojas } from '@/components/office/motor-hojas/guion';
import {
  crudoDe,
  estaVacia,
  filaVisible,
  tablaDe,
  totalDeColumna,
  vale,
} from '@/components/office/motor-hojas/consultas';
import type { Celda, Libro } from '@/components/office/motor-hojas/modelo';

/**
 * `of-excel-tablas-y-filtros` · «Una tabla no es un rango con colores»
 * (bloques 33 · 34 · 35 · 36).
 *
 * La primera clase exclusiva del grado Intermedio que enseña las TABLAS de
 * Excel de verdad —no un rango pintado a mano— y lo hace con el único caso
 * que las hace necesarias: una lista que no cabe en la pantalla. El comité de
 * padres lleva el registro de la cuota de la kermés de los cuarenta alumnos
 * de sexto, repartidos en cuatro grupos, y hoy se convierte en una tabla que
 * sabe dónde acaba, se pinta sola, se filtra sin borrar nada y no se pierde
 * al bajar cuarenta filas.
 *
 * ── LA IDEA QUE HAY QUE DEJAR CLAVADA (bloque 33) ───────────────────────────
 *
 * Un rango pintado a mano no sabe que es una lista: es color puesto en unas
 * celdas. Una tabla sí lo sabe —tiene nombre, un `Tabla.rango` que se
 * actualiza solo (`comandos.ts`, `crecerTablaSiToca`)— y por eso el encargo 3
 * no pide creer la frase: pide escribir la fila 41 justo debajo de la tabla y
 * VER que el estilo la alcanza sola, sin volver a tocar ningún botón.
 *
 * ── EL CONTRASTE QUE HACE ENTENDER EL BLOQUE 34 ─────────────────────────────
 *
 * Filtrar esconde, no borra: las filas siguen en `Hoja.celdas`, sólo dejan de
 * estar en `Hoja.visibles`. La prueba que lo demuestra está puesta al lado de
 * la tabla desde el primer día —una celda con `=SUMA(D4:D50)`, fuera de la
 * tabla— para que el encargo 5 pueda enseñar las DOS cuentas a la vez: la
 * SUMA de siempre no se entera de ningún filtro, y la fila de totales de la
 * tabla —que lee `totalDeColumna`, `consultas.ts`— cuenta SÓLO lo visible.
 *
 * ── EL PELIGRO DE VERDAD (encargos 6 y 7) ───────────────────────────────────
 *
 * `borrar` (`comandos.ts`) recorre la caja marcada de arriba abajo SIN mirar
 * `Hoja.visibles` —ninguna orden masiva de esta sala lo hace, y es lo que hace
 * Excel de verdad sin «Ir a especial → Sólo celdas visibles»—. Así que marcar
 * dos celdas VISIBLES de una tabla filtrada y borrar el contenido de en medio
 * borra también las escondidas. El encargo 6 lo provoca a propósito, con
 * cuidado: sólo tres filas ajenas de por medio, y el encargo 7 —quitar el
 * filtro— es donde el alumno ve el daño con sus propios ojos.
 *
 * ── ORDENAR EN PRIORIDAD (bloque 35) ────────────────────────────────────────
 *
 * `ordenar-varias` lee `orden` como una lista de columnas EN PRIORIDAD
 * (`comandos.ts`, `criteriosDeArgs`): agrupa por la primera y, dentro de cada
 * grupo, ordena por la segunda. El encargo 9 lo prueba al revés a propósito
 * —sólo por Alumno— antes de hacerlo bien, y el 10 lo pregunta con palabras.
 * Y el 8 prueba la reserva que `comandos.ts` deja escrita: ordenar una tabla
 * filtrada está prohibido, porque lo que se ve dejaría de corresponder con la
 * fila de abajo.
 *
 * ── INMOVILIZAR, LO QUE CAMBIA Y LO QUE NO (bloque 36) ──────────────────────
 *
 * `Hoja.inmovilizado` no toca ni una celda —lo dice `modelo.ts`—: cambia lo
 * que se puede LEER al bajar. El encargo 12 baja las cuarenta filas SIN
 * inmovilizar para que la pregunta «¿qué columna es cuál?» tenga una
 * respuesta honesta: no se sabe. El 13 lo arregla clavando la fila 3 —los
 * títulos— y la columna A —el nombre— desde la celda B4.
 */

export const HOJA = 'h1';
export const NOMBRE_TABLA = 'Pagos';

/** A · B · C · D · E, en el orden en que se leen. */
export const COL = { alumno: 0, grupo: 1, cuota: 2, aporto: 3, saldo: 4 } as const;
const LETRA = ['A', 'B', 'C', 'D', 'E'] as const;

const GRUPOS = ['6A', '6B', '5A', '5B'] as const;

interface Inscrito {
  alumno: string;
  grupo: (typeof GRUPOS)[number];
  cuota: number;
  aporto: number;
}

const NOMBRES: string[] = [
  'Andrea Salinas', 'Bruno Casas', 'Camila Rentería', 'Diego Bautista', 'Elena Vargas',
  'Fabián Nieto', 'Gabriela Ochoa', 'Héctor Solís', 'Irene Campos', 'Joel Medina',
  'Karla Fuentes', 'Luis Aranda', 'Mariana Cordero', 'Nicolás Duarte', 'Olivia Reyes',
  'Pablo Serrano', 'Quetzali Rivas', 'Renata Cabrera', 'Santiago Loera', 'Tania Osorio',
  'Ulises Barrera', 'Valentina Cruz', 'Wendy Palacios', 'Ximena Rosales', 'Yahir Cortés',
  'Zoe Delgado', 'Alan Figueroa', 'Brenda Montes', 'Cristian Peña', 'Daniela Rubio',
  'Emilio Santoyo', 'Fernanda Uribe', 'Gael Vega', 'Ivonne Zamora', 'Jorge Ávila',
  'Karina Beltrán', 'Leonardo Cano', 'Mónica Estrada', 'Nadia Franco', 'Omar Gallardo',
];

/**
 * Los cuarenta, con el grupo y el aporte calculados —no tecleados uno por
 * uno— para que la lista y sus cuentas sean, por construcción, la misma
 * fuente. El grupo cicla `6A·6B·5A·5B` SIN estar ordenado en la hoja a
 * propósito: si ya llegara agrupado, ordenar por grupo no cambiaría nada a
 * la vista y el bloque 35 se quedaría sin demostración.
 */
export const ORIGEN: Inscrito[] = NOMBRES.map((alumno, i) => ({
  alumno,
  grupo: GRUPOS[i % 4],
  cuota: 150,
  aporto: i % 5 === 0 ? 0 : i % 3 === 0 ? 100 : 150,
}));

export const FILA_ENCABEZADO = 3;
export const FILA_PRIMERA = 4;
export const FILA_ULTIMA = FILA_PRIMERA + ORIGEN.length - 1; // 43

/** El rango con el que se crea la tabla, encabezado incluido. */
export const RANGO_TABLA = `A${FILA_ENCABEZADO}:E${FILA_ULTIMA}`;
/** El id que arma `controles.ts`: `t-<hoja>-<rango con guiones>`. */
export const ID_TABLA = `t-${HOJA}-${RANGO_TABLA.replace(':', '-')}`;

/** El alumno 41, el que se escribe a mano en el encargo 3 para ver crecer la tabla. */
export const NUEVO_ALUMNO: Inscrito = { alumno: 'Renato Islas', grupo: '6B', cuota: 150, aporto: 150 };
export const FILA_NUEVA = FILA_ULTIMA + 1; // 44

/** Los cuarenta y uno, cada uno con su fila real. Para sumar y contar sin repetir números a mano. */
const CON_FILA: Array<Inscrito & { fila: number }> = [
  ...ORIGEN.map((a, i) => ({ ...a, fila: FILA_PRIMERA + i })),
  { ...NUEVO_ALUMNO, fila: FILA_NUEVA },
];

const deGrupo = (g: string) => CON_FILA.filter((a) => a.grupo === g);
const sumaAporto = (lista: typeof CON_FILA) => lista.reduce((s, a) => s + a.aporto, 0);

/** La celda de comprobación, FUERA de la tabla: `=SUMA(D4:D50)`, generosa a propósito. */
export const RANGO_SUMA_DE_FUERA = `D${FILA_PRIMERA}:D50`;
export const CELDA_SUMA_DE_FUERA = 'H2';

const fuerte = (crudo: string): Celda => ({ crudo, formato: { tipo: 'general', negrita: true } });
const suelta = (crudo: string): Celda => ({ crudo });

/**
 * «Cuota de la kermés · 6.º grado.xlsx», tal y como llega: cuarenta alumnos
 * en un rango sin tabla —ni un color puesto a mano, para que el contraste del
 * encargo 3 no se confunda con «ya venía bonito»— y la comprobación aparte ya
 * escrita, esperando a que el filtro del encargo 5 la haga interesante.
 */
export function libroDeLaCuota(): Libro {
  const celdas: Record<string, Celda> = {
    A1: fuerte('Cuota de la kermés de fin de cursos · 6.º grado'),
    A2: suelta('El comité de padres lleva el registro en esta lista. Cuarenta alumnos, cuatro grupos.'),
    [`${LETRA[COL.alumno]}${FILA_ENCABEZADO}`]: fuerte('Alumno'),
    [`${LETRA[COL.grupo]}${FILA_ENCABEZADO}`]: fuerte('Grupo'),
    [`${LETRA[COL.cuota]}${FILA_ENCABEZADO}`]: fuerte('Cuota'),
    [`${LETRA[COL.aporto]}${FILA_ENCABEZADO}`]: fuerte('Aportó'),
    [`${LETRA[COL.saldo]}${FILA_ENCABEZADO}`]: fuerte('Saldo'),
    G1: fuerte('Comprobación aparte (no es la tabla)'),
    G2: suelta('Suma con SUMA, filtres o no:'),
    [CELDA_SUMA_DE_FUERA]: suelta(`=SUMA(${RANGO_SUMA_DE_FUERA})`),
  };
  ORIGEN.forEach((a, i) => {
    const f = FILA_PRIMERA + i;
    celdas[`${LETRA[COL.alumno]}${f}`] = suelta(a.alumno);
    celdas[`${LETRA[COL.grupo]}${f}`] = suelta(a.grupo);
    celdas[`${LETRA[COL.cuota]}${f}`] = suelta(String(a.cuota));
    celdas[`${LETRA[COL.aporto]}${f}`] = suelta(String(a.aporto));
    celdas[`${LETRA[COL.saldo]}${f}`] = suelta(`=${LETRA[COL.aporto]}${f}-${LETRA[COL.cuota]}${f}`);
  });
  return { activa: HOJA, nombres: {}, hojas: [{ id: HOJA, nombre: 'Pagos', celdas }] };
}

/* ── lo que el maestro le pregunta al libro ─────────────────────────────── */

const motorDe = (libro: Libro): Motor => crearMotor(libro, RELOJ_DE_LA_CLASE);

/* — encargo 1: convertir el rango en tabla — */

export function laTablaEstaCreada(libro: Libro): boolean {
  const t = tablaDe(libro, HOJA, ID_TABLA);
  return !!t && t.nombre.trim().toLowerCase() === NOMBRE_TABLA.toLowerCase();
}

/* — encargo 2: el estilo verde — */

export const ESTILO_ELEGIDO = 'claro-verde';

export function laTablaTieneEstilo(libro: Libro): boolean {
  if (!laTablaEstaCreada(libro)) return false;
  return tablaDe(libro, HOJA, ID_TABLA)?.estilo === ESTILO_ELEGIDO;
}

/* — encargo 3: la fila 41, y la tabla que crece sola — */

export function laTablaCrecioSola(libro: Libro): boolean {
  if (!laTablaTieneEstilo(libro)) return false;
  const t = tablaDe(libro, HOJA, ID_TABLA);
  const c = t ? cajaDeTexto(t.rango) : null;
  if (!c || c.f1 !== FILA_NUEVA - 1) return false; // -1: `cajaDeTexto` cuenta filas desde 0
  const motor = motorDe(libro);
  return (
    crudoDe(libro, HOJA, `${LETRA[COL.alumno]}${FILA_NUEVA}`) === NUEVO_ALUMNO.alumno &&
    crudoDe(libro, HOJA, `${LETRA[COL.grupo]}${FILA_NUEVA}`) === NUEVO_ALUMNO.grupo &&
    vale(motor, HOJA, `${LETRA[COL.cuota]}${FILA_NUEVA}`, NUEVO_ALUMNO.cuota) &&
    vale(motor, HOJA, `${LETRA[COL.aporto]}${FILA_NUEVA}`, NUEVO_ALUMNO.aporto) &&
    vale(motor, HOJA, `${LETRA[COL.saldo]}${FILA_NUEVA}`, NUEVO_ALUMNO.aporto - NUEVO_ALUMNO.cuota)
  );
}

/* — encargo 4: la fila de totales — */

/**
 * **No encadena con `laTablaCrecioSola`.** Ese predicado comprueba que la
 * fila 44 tenga, POR CONTENIDO, a Renato Islas —el alumno nuevo—, y el
 * encargo 9 (ordenar) mueve las filas: después de ordenar por grupo y
 * alumno, Renato deja de estar en la fila 44 aunque la tabla siga estando
 * perfectamente bien. Encadenar con esa comprobación habría dejado
 * `laFilaDeTotalesEstaPuesta` —y con ella TODO lo que viene después,
 * encargos 5 a 13— imposible de cumplir en cuanto se ordenara de verdad. Se
 * encontró jugando la clase de principio a fin: el mismo defecto que ya
 * aparece tres veces más abajo en este archivo, sólo que aquí escondido un
 * paso más arriba de lo que se había mirado.
 *
 * Encadena con `laTablaTieneEstilo` y repite sólo la parte ESTRUCTURAL de
 * `laTablaCrecioSola` —que la tabla siga llegando hasta la fila 44—, que no
 * mira qué alumno hay en cada fila y por eso no le importa el orden.
 */
export function laFilaDeTotalesEstaPuesta(libro: Libro): boolean {
  if (!laTablaTieneEstilo(libro)) return false;
  const t = tablaDe(libro, HOJA, ID_TABLA);
  const c = t ? cajaDeTexto(t.rango) : null;
  if (!c || c.f1 !== FILA_NUEVA - 1) return false; // -1: `cajaDeTexto` cuenta filas desde 0
  return t?.filaDeTotales?.[COL.alumno] === 'cuenta' && t?.filaDeTotales?.[COL.aporto] === 'suma';
}

/* — encargo 5: filtrar por grupo, y las dos cuentas a la vista — */

export const GRUPO_FILTRADO = '6B';

export function laTablaFiltradaMuestraLasDosCuentas(libro: Libro): boolean {
  if (!laFilaDeTotalesEstaPuesta(libro)) return false;
  const t = tablaDe(libro, HOJA, ID_TABLA);
  if (!t?.filtros?.[COL.grupo]) return false;
  const motor = motorDe(libro);
  // `filaVisible` (`consultas.ts`) cuenta filas desde 0, como `cajaDeTexto`;
  // `a.fila` es el número de fila TAL Y COMO se escribe en una dirección
  // («A5» es la fila 5) — de ahí el `- 1`, la misma conversión que ya hace
  // `laTablaCrecioSola` con `FILA_NUEVA`.
  const visibles6B = CON_FILA.every((a) => filaVisible(libro, HOJA, a.fila - 1) === (a.grupo === GRUPO_FILTRADO));
  return (
    visibles6B &&
    totalDeColumna(motor, HOJA, t, COL.aporto) === sumaAporto(deGrupo(GRUPO_FILTRADO)) &&
    vale(motor, HOJA, CELDA_SUMA_DE_FUERA, sumaAporto(CON_FILA))
  );
}

/* — encargo 6: el peligro — borrar mientras está filtrado alcanza lo escondido — */

/** Dos filas 6B visibles (5 y 9) con tres ajenas escondidas de por medio (6, 7, 8). */
export const FILA_PELIGRO_DESDE = 5;
export const FILA_PELIGRO_HASTA = 9;

/**
 * **No encadena con `laTablaFiltradaMuestraLasDosCuentas`.** Aquél exige que
 * la fila de totales sume exactamente lo de los 6B visibles —D5 y D9
 * incluidas—, y borrar D5:D9 es JUSTO lo que este encargo pide: si siguiera
 * exigiendo esa suma, el encargo se volvería imposible de cumplir en cuanto
 * se cumpliera. Encadena con `laFilaDeTotalesEstaPuesta`, que sólo mira la
 * CONFIGURACIÓN de la fila de totales —qué columnas resumen qué—, no los
 * números: eso sigue siendo verdad pase lo que pase con los datos. Es la
 * misma reserva que ya dejó escrita `of-excel-datos-limpios` en
 * `laBaseSigueFirme` para su encargo 5.
 */
export function elPeligroDelFiltroQuedoClaro(libro: Libro): boolean {
  if (!laFilaDeTotalesEstaPuesta(libro)) return false;
  const t = tablaDe(libro, HOJA, ID_TABLA);
  if (!t?.filtros?.[COL.grupo]) return false; // sigue filtrada: así se vio el peligro
  for (let f = FILA_PELIGRO_DESDE; f <= FILA_PELIGRO_HASTA; f += 1) {
    if (!estaVacia(libro, HOJA, `${LETRA[COL.aporto]}${f}`)) return false;
  }
  return true;
}

/* — encargo 7: quitar filtros — revela el daño — */

/**
 * **Tampoco encadena con `elPeligroDelFiltroQuedoClaro`**, por la misma
 * razón que ya quedó escrita ahí arriba: ese predicado exige `t.filtros`
 * puesto —«sigue filtrada: así se vio el peligro»—, y quitar el filtro es
 * EXACTAMENTE lo que pide este encargo. Encadenar con él habría dejado el
 * encargo 7 imposible de cumplir en el mismo instante en que se cumple —se
 * encontró jugando la clase de principio a fin, antes de darla por cerrada—.
 * Se repiten aquí, sueltas, las dos comprobaciones que sí siguen valiendo:
 * la fila de totales configurada (encadena con eso) y el daño —D5:D9 siguen
 * vacías— visto DESPUÉS de quitar el filtro.
 */
export function seQuitaronLosFiltrosYSeVeElDano(libro: Libro): boolean {
  if (!laFilaDeTotalesEstaPuesta(libro)) return false;
  for (let f = FILA_PELIGRO_DESDE; f <= FILA_PELIGRO_HASTA; f += 1) {
    if (!estaVacia(libro, HOJA, `${LETRA[COL.aporto]}${f}`)) return false;
  }
  const t = tablaDe(libro, HOJA, ID_TABLA);
  return !t?.filtros || Object.keys(t.filtros).length === 0;
}

/*
 * — encargo 8: ordenar una tabla filtrada — rechazo —
 *
 * `ordenar-varias` con `revisar` que falla no llega a `aplicar`: el rechazo
 * no deja NINGUNA huella en el libro, así que no hay predicado de documento
 * posible aquí abajo.
 *
 * **No es `{ tipo: 'control' }`.** Ésa fue la primera idea —«lo que no deja
 * rastro» (`motor/guion.ts`)— y es la que usa `Auditorio.tsx`, pero ahí
 * `gesto(control)` llama a `evaluar` directo. Aquí el botón pasa por
 * `ejecutarGestos` (`VentanaHojas.tsx`), y esa función SÓLO llama a
 * `evaluar` cuando `r.ok` es verdadero: con `revisar` rechazando, `r.ok` es
 * falso y la función devuelve sin evaluar nada — el clic real, con su aviso
 * real en pantalla, no tiene manera de contarle al guion que pasó. Con
 * `{ tipo: 'control' }` el encargo se queda parado para siempre: se
 * descubrió construyendo esta misma clase, jugándola de principio a fin
 * antes de darla por cerrada. El logro de este encargo es una `eleccion`,
 * más abajo en `pasos` — el alumno hace el intento de verdad (y ve el aviso
 * de verdad) y luego cuenta qué pasó, el mismo molde que ya usan los
 * encargos 10 y 12.
 */

/* — encargo 9: ordenar por varias columnas, mal y luego bien — */

function filasEnOrdenActual(libro: Libro): string[] {
  const fuera: string[] = [];
  for (let f = FILA_PRIMERA; f <= FILA_NUEVA; f += 1) {
    fuera.push(crudoDe(libro, HOJA, `${LETRA[COL.alumno]}${f}`));
  }
  return fuera;
}

/**
 * La MISMA comparación que usa el motor (`comparar`, `modelo.ts`): minúsculas
 * y `<`/`>` de JavaScript, no `localeCompare`. Con nombres acentuados —Ávila,
 * Cortés, Peña— las dos formas de comparar no siempre coinciden, y lo que
 * tiene que coincidir aquí es con lo que el motor de VERDAD va a producir,
 * no con lo que un alumno esperaría del alfabeto de la escuela.
 */
const comoLaHoja = (a: string, b: string): number => {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x === y ? 0 : x < y ? -1 : 1;
};

const ordenEsperadoSoloAlumno = CON_FILA.map((a) => a.alumno)
  .slice()
  .sort(comoLaHoja);

const ordenEsperadoGrupoYAlumno = CON_FILA.slice()
  .sort((a, b) => comoLaHoja(a.grupo, b.grupo) || comoLaHoja(a.alumno, b.alumno))
  .map((a) => a.alumno);

/**
 * Paso intermedio, sólo para quien quiera comprobarlo aparte: ordenó SÓLO
 * por alumno, y con eso los grupos quedan revueltos. **No la usa ningún
 * `comprueba` de `pasos`** — el encargo pide las dos cosas dentro de la
 * MISMA instrucción («primero mal, ahora bien»), así que lo único que se
 * califica es el resultado final.
 */
/** ¿La tabla no tiene ningún filtro puesto ahora mismo? */
function sinFiltros(libro: Libro): boolean {
  const t = tablaDe(libro, HOJA, ID_TABLA);
  return !t?.filtros || Object.keys(t.filtros).length === 0;
}

/**
 * **No encadena con `seQuitaronLosFiltrosYSeVeElDano`.** Ese predicado exige
 * además que D5:D9 SIGAN vacías —el daño del encargo 6, comprobado por
 * POSICIÓN—, y ordenar es EXACTAMENTE lo que mueve esas filas a otra parte:
 * el daño se va con ellas, a otras celdas. Encadenar con él habría dejado el
 * encargo 9 imposible de cumplir en cuanto se ordenara de verdad — se
 * encontró jugando la clase de principio a fin, la misma familia de defecto
 * que ya aparece tres veces más arriba en este archivo. Encadena con
 * `laFilaDeTotalesEstaPuesta` —estable, no mira posiciones— y repite sólo la
 * parte de «sin filtros» que sigue haciendo falta.
 */
export function seOrdenoSoloPorAlumno(libro: Libro): boolean {
  if (!laFilaDeTotalesEstaPuesta(libro) || !sinFiltros(libro)) return false;
  return JSON.stringify(filasEnOrdenActual(libro)) === JSON.stringify(ordenEsperadoSoloAlumno);
}

/**
 * Misma reserva que `seOrdenoSoloPorAlumno`, arriba, y tampoco encadena CON
 * él: ese paso intermedio exige el orden alfabético de sólo-alumno, y este
 * encargo pide ordenar otra vez —por grupo y alumno— justo encima.
 */
export function seOrdenoPorGrupoYAlumno(libro: Libro): boolean {
  if (!laFilaDeTotalesEstaPuesta(libro) || !sinFiltros(libro)) return false;
  return JSON.stringify(filasEnOrdenActual(libro)) === JSON.stringify(ordenEsperadoGrupoYAlumno);
}

/* — encargo 10: por qué el orden de las columnas importa (elección) — */

/* — encargo 11: ocultar y mostrar filas a mano — */

/** Los diez de 5A, escondidos a mano —sin ningún filtro— tras ordenar. */
function filasDelGrupoOrdenado(g: string): number[] {
  const orden = CON_FILA.slice().sort((a, b) => a.grupo.localeCompare(b.grupo) || a.alumno.localeCompare(b.alumno));
  return orden.reduce<number[]>((fuera, a, i) => {
    if (a.grupo === g) fuera.push(FILA_PRIMERA + i);
    return fuera;
  }, []);
}
export const GRUPO_ESCONDIDO_A_MANO = '5A';

/**
 * Paso intermedio, sólo para quien quiera comprobarlo aparte: las diez de
 * 5A quedaron escondidas. **No la usa ningún `comprueba` de `pasos`** — el
 * mismo motivo que ya dejaron escrito `seOrdenoSoloPorAlumno` aquí arriba y
 * `laBaseSigueFirme` en `datos-limpios`: el encargo pide esconder y volver a
 * mostrar dentro de la misma instrucción, así que encadenar de «están
 * escondidas» dejaría «se volvieron a mostrar» imposible de cumplir en
 * cuanto se cumple.
 */
export function seEscondioUnGrupoAMano(libro: Libro): boolean {
  if (!seOrdenoPorGrupoYAlumno(libro)) return false;
  const filas = filasDelGrupoOrdenado(GRUPO_ESCONDIDO_A_MANO);
  if (!filas.length) return false;
  // El mismo `- 1` que ya lleva `laTablaFiltradaMuestraLasDosCuentas`: `filas`
  // son números de dirección («A5» es la 5), y `filaVisible` cuenta desde 0.
  return filas.every((f) => !filaVisible(libro, HOJA, f - 1));
}

/**
 * Encadena con `seOrdenoPorGrupoYAlumno`, no con `seEscondioUnGrupoAMano` —
 * la misma reserva de siempre. Pero «todas visibles» sola no basta: es el
 * estado de fábrica, antes de que el alumno toque nada, así que por sí solo
 * este `comprueba` daría el encargo por hecho sin que pasara nada.
 *
 * La diferencia la hace `Hoja.visibles`: `quitar-filtros` SÍ vuelve a
 * `undefined` cuando no queda ningún filtro (`recalcularVisibles`,
 * `comandos.ts`), pero `mostrar-filas` a propósito NO lo hace —lo dice su
 * propia reserva, ahí mismo—: deja un array explícito con todo dentro. Por
 * eso `hoja.visibles` sin definir SÍ significa «nadie ha tocado nada a
 * mano», y comprobarlo aquí es la única manera de exigir que el
 * esconder-y-mostrar haya pasado de verdad, sin depender de una POSICIÓN
 * que un futuro encargo pudiera deshacer (la reserva de siempre).
 */
export function seVolvieronAMostrarLasFilas(libro: Libro): boolean {
  if (!seOrdenoPorGrupoYAlumno(libro)) return false;
  const hoja = libro.hojas.find((h) => h.id === HOJA);
  if (!hoja?.visibles) return false;
  const filas = filasDelGrupoOrdenado(GRUPO_ESCONDIDO_A_MANO);
  return filas.length > 0 && filas.every((f) => filaVisible(libro, HOJA, f - 1));
}

/* — encargo 12: bajar sin inmovilizar (elección) — */

/* — encargo 13: inmovilizar de verdad — */

export function laFilaDeTitulosEstaInmovilizada(libro: Libro): boolean {
  if (!seVolvieronAMostrarLasFilas(libro)) return false;
  const inm = libro.hojas.find((h) => h.id === HOJA)?.inmovilizado;
  return Boolean(inm && inm.filas === FILA_PRIMERA - 1 && inm.cols === 1);
}

/* ── el guion ──────────────────────────────────────────────────────────── */

export const GUION_TABLAS_Y_FILTROS: GuionHojas = {
  archivo: 'Cuota de la kermés · 6.º grado.xlsx',
  libro: libroDeLaCuota,

  portada: {
    situacion: 'Excel · Grado intermedio · La clase de las tablas',
    tema: 'Convertir un rango en tabla, filtrar sin borrar e inmovilizar la fila de títulos',
    objetivo:
      'Vas a dejar de manejar una lista larga a fuerza de pintar celdas de colores: la vas a convertir en una TABLA de Excel de verdad, que sabe dónde acaba, crece sola, se filtra sin borrar nada y no se pierde cuando bajas cuarenta filas.',
    vasAHacer: [
      'Convertir la lista de los cuarenta alumnos en una tabla, y verla crecer sola cuando escribas justo debajo',
      'Ponerle un estilo y una fila de totales que cuenta SÓLO lo que ves',
      'Filtrar por grupo y comprobar, con una cuenta al lado, que filtrar no borra',
      'Descubrir el peligro de verdad: con la lista filtrada, borrar de más alcanza lo que no ves',
      'Ordenar por varias columnas en el orden que decidas, y clavar la fila de títulos con Inmovilizar',
    ],
    requisitos:
      'Las clases de Excel anteriores: escribir fórmulas, ordenar por una columna y usar el formato condicional de los normales. Hoy la lista ya no son seis filas: son cuarenta, y eso es justo lo que hace falta para que una tabla se note.',
    ayuda:
      'Los nueve botones de hoy están en el panel «Tablas», a la derecha, salvo Inmovilizar, que sigue en Vista → Mostrar. Cada sección del panel abre con una pista de qué marcar antes de pulsar.',
  },

  pasos: [
    {
      id: 'crear-tabla',
      titulo: 'Un rango no sabe que es una lista',
      instruccion:
        'Primero, rómpela a propósito: ponte en una sola celda cualquiera —por ejemplo B10— y pulsa **Crear tabla**, en el panel. Mira lo que contesta. Ahora bien: marca **de A3 a E43** —el encabezado y los cuarenta alumnos—, escribe el nombre **Pagos** y vuelve a pulsar Crear tabla.',
      pista:
        'A3 es «Alumno» y E43 es el Saldo del último alumno. Una tabla necesita al menos una fila de encabezados y una de datos debajo: por eso una sola celda no basta.',
      senal: { control: 'crear-tabla' },
      logro: { tipo: 'documento', comprueba: laTablaEstaCreada },
      aprendido:
        'Con una celda sola, Excel se quejó: «una tabla necesita al menos una fila de encabezados y una fila de datos debajo». Con el rango completo, la lista cambió de aspecto —bandas de color, encabezados marcados— y ahora tiene NOMBRE: Pagos. Eso no es un rango pintado a mano: es una tabla que sabe dónde empieza y dónde acaba.',
    },
    {
      id: 'estilo-tabla',
      titulo: 'Cambia el color sin tocar un dato',
      instruccion: 'Ponte en cualquier celda de la tabla y elige el estilo **verde** en el panel.',
      pista: 'Cualquier celda dentro de A3:E43 sirve: la tabla entera cambia de color, no sólo la que tocaste.',
      senal: { control: 'estilo-tabla' },
      logro: { tipo: 'documento', comprueba: laTablaTieneEstilo },
      aprendido:
        'La tabla entera cambió de color de un golpe, sin que tocaras un solo dato: ni un nombre, ni un número se movió. Es pintura, como el color de relleno de una celda, sólo que aplicada a la tabla entera de una vez.',
    },
    {
      id: 'crece-sola',
      titulo: 'Escribe justo debajo, y mira',
      instruccion:
        'En la fila 44 —justo debajo del último alumno— escribe: **A44: Renato Islas · B44: 6B · C44: 150 · D44: 150 · E44: =D44-C44**.',
      pista: 'La fila 44 es la que sigue a la 43, la última de la tabla. No hace falta pulsar ningún botón para que entre: basta con escribir ahí.',
      // Sin `senal`, a propósito: este encargo escribe en CINCO celdas
      // seguidas y ninguna señal puede nombrarlas todas — la misma razón que
      // documentó `of-excel-buscarx` para su encargo de Relleno rápido.
      logro: { tipo: 'documento', comprueba: laTablaCrecioSola },
      aprendido:
        'Fíjate en el color de la fila 44: **ya tiene la banda verde**, sin que tú se la pusieras. La tabla se dio cuenta sola de que creciste y se extendió a A3:E44. Un rango pintado a mano no se entera de nada de esto: seguiría siendo azul hasta la fila 43, y la 44 se quedaría en blanco para siempre.',
    },
    {
      id: 'fila-de-totales',
      titulo: 'Un resumen que se actualiza solo',
      instruccion:
        'Activa la fila de totales: en el panel, pon **Cuenta** en la columna Alumno y **Suma** en la columna Aportó, y pulsa Aplicar en cada una.',
      pista: 'Elige primero la columna, luego el resumen, y por último Aplicar. Son dos aplicaciones: una para Alumno y otra para Aportó.',
      senal: { control: 'fila-totales' },
      logro: { tipo: 'documento', comprueba: laFilaDeTotalesEstaPuesta },
      aprendido:
        'Debajo de la tabla apareció una fila nueva: **41** en Alumno y la suma de lo aportado en Aportó. No la escribiste tú con una fórmula: se lee sola, y dentro de un momento vas a ver que también sabe cuándo hay que contar menos.',
    },
    {
      id: 'filtrar-y-comparar',
      titulo: 'Filtrar no borra: las dos cuentas, una al lado de otra',
      instruccion:
        'Filtra la tabla por **Grupo = 6B** —marca sólo ese valor en el panel—. Mira la fila de totales de la tabla y compara con la celda **H2**, la que dice «Suma con SUMA».',
      pista: 'En el panel «Filtrar», elige la columna Grupo, deja el modo «Marcar valores» y marca sólo 6B.',
      senal: { control: 'filtrar' },
      logro: { tipo: 'documento', comprueba: laTablaFiltradaMuestraLasDosCuentas },
      aprendido:
        'Ahí está el bloque entero, en dos números que no coinciden: la fila de totales de la tabla bajó —ahora sólo suma los 6B que ves—, y **H2 sigue exactamente igual que antes de filtrar**. `=SUMA(D4:D50)` no sabe de filtros: sigue sumando las cuarenta y una filas, se vean o no. La fila de totales de la tabla sí sabe: cuenta sólo lo visible, como SUBTOTALES.',
    },
    {
      id: 'el-peligro',
      titulo: 'Cuidado con lo que no ves',
      instruccion:
        'Con el filtro de 6B todavía puesto, marca **D5** y arrastra —shift y clic— hasta **D9**: los dos son 6B, los que ves. Pulsa **Borrar contenido**, en Inicio → Edición.',
      pista: 'D5 y D9 se ven los dos porque son 6B. Entre ellos, sin que los veas, hay tres filas de otros grupos que también van a quedar dentro de lo marcado.',
      senal: { control: 'borrar-contenido' },
      logro: { tipo: 'documento', comprueba: elPeligroDelFiltroQuedoClaro },
      aprendido:
        'Creíste marcar dos celdas. Cuando quites el filtro lo vas a comprobar: marcaste cinco. Borrar no mira si una fila se ve o no —recorre TODO lo que quedó dentro de la caja que dibujaste—, así que las filas 6, 7 y 8, que estaban escondidas por el filtro, también se quedaron sin su Aportó. Nadie te avisó, y no salió ningún error.',
    },
    {
      id: 'quitar-filtros',
      titulo: 'Quita el filtro y mira el daño',
      instruccion: 'Pulsa **Quitar filtros**, en el panel, y mira las filas 6, 7 y 8.',
      pista: 'Con la tabla sin filtrar se vuelven a ver las cuarenta y una filas, incluidas las tres que acabas de vaciar sin querer.',
      senal: { control: 'quitar-filtros' },
      logro: { tipo: 'documento', comprueba: seQuitaronLosFiltrosYSeVeElDano },
      aprendido:
        'Ahí están: filas 6, 7 y 8, con la columna Aportó vacía —y el Saldo, en negativo, como si no hubieran pagado nada—. Quitar filtros no repuso nada, porque quitar un filtro nunca repone un dato: sólo vuelve a enseñar lo que había. Lo que se perdió, se perdió en el encargo anterior, no en éste.',
    },
    {
      id: 'ordenar-filtrada-rechazo',
      titulo: 'Rómpela otra vez: ordenar con un filtro puesto',
      instruccion:
        'Filtra de nuevo por **Grupo = 6B** y, con el filtro todavía puesto, intenta **Ordenar por varias columnas** —cualquier columna sirve—. Lee el aviso. Después quita el filtro.',
      pista: 'El panel de Ordenar sigue ahí, pero esta vez Excel se va a negar antes de mover una sola fila.',
      senal: { control: 'filtrar,ordenar-varias,quitar-filtros' },
      // `eleccion`, no `{ tipo: 'control' }`: el rechazo de verdad no deja
      // rastro en el libro NI llega a `evaluar` (`ejecutarGestos` corta antes,
      // ver la nota encima de `pasos`), así que lo único que se puede
      // calificar es lo que el alumno responde después de verlo con sus
      // propios ojos.
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Se rechazó: pidió quitar los filtros antes de ordenar',
          'Ordenó nada más las filas que se veían, y dejó las escondidas donde estaban',
          'Ordenó la tabla entera igual que siempre, sin importarle el filtro',
        ],
        correcta: 0,
      },
      aprendido:
        '«Quita los filtros antes de ordenar», te dijo, y no movió ni una fila. Tiene sentido: si ordenara sólo lo que ves, la fila 3 de la pantalla dejaría de corresponder con lo que hay debajo del todo, y una tabla filtrada quedaría mintiendo sobre su propio orden. Por eso hay que quitar el filtro primero.',
    },
    {
      id: 'ordenar-varias-mal-y-bien',
      titulo: 'Ordenar por varias, y el orden de las columnas importa',
      instruccion:
        'Primero, mal a propósito: ordena **sólo por Alumno**. Mira cómo quedaron los grupos. Ahora bien: ordena por **Grupo primero y Alumno segundo**.',
      pista: 'En el panel, el 1.º nivel es el que agrupa; el 2.º ordena DENTRO de cada grupo. Deja el 2.º vacío para el primer intento.',
      senal: { control: 'ordenar-varias' },
      logro: { tipo: 'documento', comprueba: seOrdenoPorGrupoYAlumno },
      aprendido:
        'Sólo por Alumno, los cuatro grupos quedaron revueltos: Andrea (6A) junto a Alan (6A) por casualidad de la letra, no por grupo. Con Grupo primero y Alumno segundo, los cuarenta y uno quedaron en cuatro bloques —5A, 5B, 6A, 6B— y DENTRO de cada bloque, alfabético. No es lo mismo un orden que el otro: el primer nivel manda.',
    },
    {
      id: 'por-que-el-orden-importa',
      titulo: 'Antes de seguir: ¿por qué ese orden y no el otro?',
      instruccion: '¿Qué habría pasado si hubieras puesto Alumno como 1.º nivel y Grupo como 2.º?',
      pista: 'El 1.º nivel es el que decide los bloques grandes; el 2.º sólo ordena dentro de cada uno.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Lo mismo: da igual en qué orden se pongan las columnas',
          'Los alumnos quedarían en orden alfabético de la A a la Z, y el grupo ya no agruparía nada',
          'Excel lo habría rechazado, porque Alumno no se puede poner primero',
        ],
        correcta: 1,
      },
      aprendido:
        'Alumno primero habría ordenado la lista entera de la A a la Z, sin importar el grupo —Alan (6A) antes que Andrea (6A) por la letra, pero después vendría Bruno (6B) y no un alumno de 6A—. El grupo dejaría de agrupar nada. El primer nivel es el que manda: agrupa, y el segundo sólo decide el orden DENTRO de cada grupo.',
    },
    {
      id: 'ocultar-y-mostrar',
      titulo: 'Esconder a mano, sin ningún filtro',
      instruccion:
        'Marca **de A4 a E13** —el bloque de 5A, el primer grupo tras ordenar— y pulsa **Ocultar filas**, en el panel. Para recuperarlas, marca **de A3 a E14** —la fila de títulos y la primera de 5B, las dos que SÍ ves a los lados del hueco— y pulsa **Mostrar filas**.',
      pista:
        'Una vez escondidas, las filas 4 a 13 ya no están en pantalla: no se pueden volver a marcar directamente. Por eso para mostrarlas se marca desde la fila visible de ARRIBA del hueco hasta la visible de ABAJO.',
      senal: { control: 'ocultar-filas,mostrar-filas' },
      logro: { tipo: 'documento', comprueba: seVolvieronAMostrarLasFilas },
      aprendido:
        'Las diez filas de 5A desaparecieron igual que con un filtro —y a la fila de totales le da exactamente igual el motivo: sigue contando sólo lo visible—, sólo que aquí no hubo ninguna condición: las escondiste tú, una por una. Es la otra manera de esconder filas, y es la que hay que recordar antes de marcar un rango entero para borrar algo: puede haber filas escondidas ahí dentro por cualquiera de las dos razones.',
    },
    {
      id: 'bajar-sin-inmovilizar',
      titulo: 'Baja las cuarenta y una filas',
      instruccion: 'Ponte en A4 y baja hasta el final de la lista, fila por fila. Cuando ya no veas la fila 3, ¿sabes qué dice cada columna?',
      pista: 'Baja con la flecha del teclado o arrastrando la barra de desplazamiento, sin usar el cuadro de nombres.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Sí, me acuerdo perfecto de qué dice cada columna',
          'No: en cuanto la fila 3 se va de la pantalla, hay que adivinar o subir a comprobar',
          'No importa, los datos ya están ordenados por grupo',
        ],
        correcta: 1,
      },
      aprendido:
        'Exacto: en una lista de cuarenta y una filas, la de los títulos se va de la pantalla enseguida, y a partir de ahí cada columna es un número sin nombre. No es que la hoja esté mal hecha: es que nada le dijo a la ventana que esa fila tenía que quedarse quieta.',
    },
    {
      id: 'inmovilizar',
      titulo: 'Clava lo que no se debe mover',
      instruccion:
        'Ponte en **B4** —justo debajo de los títulos y a la derecha de la columna Alumno— y pulsa **Inmovilizar paneles**, en Vista → Mostrar. Vuelve a bajar hasta el final.',
      pista: 'Lo que fija es lo de ARRIBA y a la IZQUIERDA de donde estés parado: en B4 eso es la fila 3 y la columna A.',
      senal: { control: 'inmovilizar' },
      logro: { tipo: 'documento', comprueba: laFilaDeTitulosEstaInmovilizada },
      aprendido:
        'Ahora la fila 3 —Alumno, Grupo, Cuota, Aportó, Saldo— y la columna A —el nombre— se quedan quietas por más que bajes o te muevas a la derecha. `Hoja.inmovilizado` no cambió ni una celda: sólo cambió lo que la ventana deja quieto al desplazarse. En una lista de cuarenta filas —o de cuatrocientas— es la diferencia entre saber qué columna es cuál y estar adivinando.',
    },
  ],

  cierre:
    'Convertiste una lista de cuarenta alumnos en una tabla de verdad: le diste nombre, la viste crecer sola con la fila 41 y cambiar de color entera con un solo botón. Le pusiste una fila de totales que cuenta sólo lo que se ve, y filtraste por grupo comprobando —con una SUMA de siempre al lado— que filtrar esconde y no borra. Y aprendiste el peligro real: con la lista filtrada, borrar de más alcanza lo que no ves, sin ningún aviso. Ordenaste por varias columnas en el orden de prioridad que decidiste, viste a Excel negarse a ordenar una tabla filtrada, escondiste filas a mano sin ningún filtro detrás, e inmovilizaste la fila de títulos para no perderte nunca más entre cuarenta filas.',
};

export default GUION_TABLAS_Y_FILTROS;
