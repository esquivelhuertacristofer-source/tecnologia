import { crearMotor } from '@/components/office/motor-hojas/formula/calculo';
import { vinculoEnCelda, vinculoRoto } from '@/components/office/motor-hojas/comandos';
import { crudoDe, errorDe, guardaUnaRegla, vale } from '@/components/office/motor-hojas/consultas';
import { verificar } from '@/components/office/motor-hojas/verificar';
import { RELOJ_DE_LA_CLASE, type GuionHojas } from '@/components/office/motor-hojas/guion';
import type { Celda, Libro } from '@/components/office/motor-hojas/modelo';

/**
 * `n6-interpreta-la-informacion` · «La hoja no la hiciste tú» (temario §45.2,
 * bloques 42 · 40; reparto del §45.3).
 *
 * La séptima clase de Tecnia Hojas y prestada, igual que `n6-funciones-
 * esenciales` y `n7-datos-reales`: su id es `n6-`, vive en la unidad del
 * nivel 6 y la sala de Excel la enseña desde ahí.
 *
 * ── LA PRIMERA VEZ QUE EL ALUMNO NO ES EL AUTOR ─────────────────────────────
 *
 * Las seis clases anteriores de esta sala parten de un archivo que el propio
 * alumno fue llenando encargo a encargo: sabe qué hay en cada celda porque él
 * lo escribió. Ésta no. «Cuentas del Club de Ajedrez.xlsx» lo armó el
 * tesorero del ciclo pasado, ya se graduó y no dejó ni una nota. Cuatro hojas,
 * fórmulas por todos lados, dos errores escondidos y un índice a medias con
 * un enlace que no lleva a ningún lado. Es la situación real en la que se
 * usan «Mostrar fórmulas» e «Inspeccionar libro»: no para escribir una hoja,
 * para ENTENDER una que ya existe.
 *
 * ── EL PECADO MÁS COMÚN: UN NÚMERO A MANO EN MEDIO DE LAS FÓRMULAS ──────────
 *
 * En «Cuotas», el Total de cada socio es `=Meses*Cuota` — salvo el de Camila,
 * que en algún momento alguien escribió a mano y se le quedó desactualizado.
 * Con «Mostrar fórmulas» apagado los cinco Totales se ven igual de normales:
 * números. Encendida la tapa, cuatro dicen `=B*C` y uno dice `140`, sin el
 * `=` que distingue una regla de un dato — la avería más común del mundo
 * real, y la razón de que este bloque exista.
 *
 * ── DOS ERRORES, DOS HISTORIAS DISTINTAS ────────────────────────────────────
 *
 * En «Torneos» hay un `#¡REF!` **dentro** de una fórmula —`=B5-C5-#¡REF!`—,
 * la misma forma con la que ya escribe un error `ajustarPorFilas` en
 * `comandos.ts` cuando una columna se borra de verdad: alguien quitó una
 * columna y la fórmula se quedó con el hueco a la vista. En «Resumen» hay un
 * `#¡DIV/0!` porque a la fórmula del promedio le falta un dato —los meses
 * transcurridos, una celda que nadie llenó—. Se arreglan distinto porque
 * cuentan historias distintas: uno se repara editando la fórmula rota, el
 * otro se repara escribiendo el dato que faltaba y sin tocar la fórmula ni un
 * carácter. Esto prepara el bloque 48 (§45.2) y por eso el «aprendido» de
 * cada uno lo dice en voz alta.
 *
 * ── EL ÍNDICE, A MEDIAS, CON UN ENLACE MUERTO ───────────────────────────────
 *
 * La hoja «Índice» tiene cuatro renglones con una flecha delante —Cuotas,
 * Torneos, Resumen, Borrador— pero sólo el último tiene ya un hipervínculo, y
 * apunta a una hoja que **no existe en este libro**. `vinculoRoto()`
 * (`comandos.ts`) documenta por qué: el motor todavía no tiene un comando que
 * borre una hoja, así que la manera honesta de enseñar un vínculo roto es
 * dejar el libro en el estado que quedaría DESPUÉS de borrarla, no fingir un
 * borrado con un comando que no existe. El alumno arma los otros tres enlaces
 * —convirtiendo el libro en algo navegable, que es la mitad del bloque 40— y
 * quita el que ya no lleva a ningún lado, porque ese borrador ya no existe.
 *
 * ── LA HOJA ESCONDIDA ────────────────────────────────────────────────────────
 *
 * «Borrador» (h5) existe de verdad en `libro.hojas` con `oculta: true`, y no
 * se ve en la barra de lengüetas: el filtro que la esconde se escribió en
 * `VentanaHojas.tsx` para esta clase (el campo llevaba desde el paquete
 * VALIDACIÓN sin que nadie lo leyera al pintar las pestañas —
 * «SIN_CONSTRUIR por el lado de apagar una hoja», dice su propio comentario
 * en `modelo.ts`). Sólo «Inspeccionar libro» la delata, contándola.
 *
 * ── «INSPECCIONAR LIBRO» VIVE EN EL BACKSTAGE, NO EN LA CINTA ───────────────
 *
 * `inspeccionar()` (`consultas.ts`) sólo LEE el libro —ni un gesto, la misma
 * disciplina que `mostrar-formulas`—, así que no hace falta un botón de cinta
 * ni un panel de texto libre: vive en Archivo → Información, al lado de las
 * fichas que ya enseñaban celdas y fórmulas, que es además el sitio real de
 * Excel para «Comprobar si hay problemas». El botón llama a `avisar()`, que
 * `VentanaHojas.tsx` ya convierte en `evaluar(libro, {control:'inspeccionar'})`
 * — el mismo camino que usan «Guardar» e «Imprimir» desde el bloque 20.
 *
 * ── EL RELOJ, POR LA MISMA RAZÓN DE SIEMPRE ─────────────────────────────────
 *
 * Esta clase no usa `HOY()` ni `AHORA()`, pero `crearMotor` pide un reloj, y
 * el que hay que darle es `RELOJ_DE_LA_CLASE` — no un `Date.UTC` propio —,
 * por lo que ya dejó escrito `n6-funciones-esenciales`: no dar por hecho qué
 * día es hoy.
 */

/* ── el libro: cuatro hojas y una quinta que no se ve ────────────────────────*/

export const RELOJ = RELOJ_DE_LA_CLASE;

const HOJA_INDICE = 'h1';
const HOJA_CUOTAS = 'h2';
const HOJA_TORNEOS = 'h3';
const HOJA_RESUMEN = 'h4';
const HOJA_BORRADOR = 'h5';

export const ARCHIVO = 'Cuentas del Club de Ajedrez.xlsx';

/** El destino roto del índice: una hoja que el libro nunca tuvo. */
const DESTINO_QUE_NO_EXISTE = 'h9!A1';

const fuerte = (crudo: string): Celda => ({ crudo, formato: { tipo: 'general', negrita: true } });
const suelta = (crudo: string): Celda => ({ crudo });

/** Los cinco socios de «Cuotas». Camila es la que se quedó con un número a mano. */
export const SOCIOS: Array<{ nombre: string; meses: number; cuota: number }> = [
  { nombre: 'Andrea Paredes', meses: 3, cuota: 50 },
  { nombre: 'Bruno Salcedo', meses: 4, cuota: 50 },
  { nombre: 'Camila Ibarra', meses: 3, cuota: 50 },
  { nombre: 'Diego Reyes', meses: 2, cuota: 50 },
  { nombre: 'Elena Cruz', meses: 4, cuota: 50 },
];

const FILA_PRIMERA_SOCIO = 4;
const FILA_CAMILA = FILA_PRIMERA_SOCIO + 2; // 6
const FILA_TOTAL_CUOTAS = FILA_PRIMERA_SOCIO + SOCIOS.length; // 9

export const CELDA_CAMILA = `D${FILA_CAMILA}`;
export const CELDA_TOTAL_CUOTAS = `D${FILA_TOTAL_CUOTAS}`;

/** Lo que Camila debería decir, y lo que decía por el número escrito a mano. */
export const TOTAL_CORRECTO_CAMILA = SOCIOS[2].meses * SOCIOS[2].cuota; // 150
const TOTAL_A_MANO_CAMILA = 140;

/** El total recaudado, sumando los cinco — sólo es correcto tras corregir a Camila. */
export const TOTAL_CUOTAS_CORRECTO = SOCIOS.reduce(
  (s, x, i) => s + (i === 2 ? TOTAL_CORRECTO_CAMILA : x.meses * x.cuota),
  0,
); // 800

/** Los tres torneos. El segundo trae el `#¡REF!` de una columna que ya no está. */
const TORNEOS: Array<{ nombre: string; cobrado: number; gastado: number }> = [
  { nombre: 'Interno de otoño', cobrado: 600, gastado: 250 },
  { nombre: 'Regional sub-12', cobrado: 900, gastado: 300 },
  { nombre: 'Amistoso vs. Vespertina', cobrado: 400, gastado: 150 },
];

const FILA_PRIMER_TORNEO = 4;
export const FILA_TORNEO_ROTO = FILA_PRIMER_TORNEO + 1; // 5
export const CELDA_TORNEO_ROTO = `D${FILA_TORNEO_ROTO}`;
export const NETO_TORNEO_ROTO = TORNEOS[1].cobrado - TORNEOS[1].gastado; // 600

/** Los meses transcurridos, el dato que le faltaba a «Resumen». */
export const MESES_TRANSCURRIDOS = 5;
export const CUOTA_PROMEDIO = TOTAL_CUOTAS_CORRECTO / MESES_TRANSCURRIDOS; // 160

/**
 * «Cuentas del Club de Ajedrez.xlsx»: el libro que armó el tesorero anterior,
 * con las dos averías y el enlace muerto ya puestos.
 *
 * Es una función y no una constante por lo que dice `guion.ts` de la sala:
 * «Empezar de cero» tiene que poder volver a fabricarlo entero.
 */
export function libroDeLasCuentas(): Libro {
  const indice: Record<string, Celda> = {
    A1: fuerte('Cuentas del Club de Ajedrez · ciclo pasado'),
    A3: suelta('Esto lo armó el tesorero anterior. No dejó ninguna nota, pero sí un índice a medias:'),
    A5: suelta('→ Ver Cuotas'),
    A6: suelta('→ Ver Torneos'),
    A7: suelta('→ Ver Resumen'),
    A8: suelta('→ Ver Borrador'),
  };

  const cuotas: Record<string, Celda> = {
    A3: fuerte('Nombre'),
    B3: fuerte('Meses pagados'),
    C3: fuerte('Cuota mensual'),
    D3: fuerte('Total'),
    [`A${FILA_TOTAL_CUOTAS}`]: fuerte('Total recaudado'),
    [CELDA_TOTAL_CUOTAS]: suelta(`=SUMA(D${FILA_PRIMERA_SOCIO}:D${FILA_PRIMERA_SOCIO + SOCIOS.length - 1})`),
  };
  SOCIOS.forEach((s, i) => {
    const f = FILA_PRIMERA_SOCIO + i;
    cuotas[`A${f}`] = suelta(s.nombre);
    cuotas[`B${f}`] = suelta(String(s.meses));
    cuotas[`C${f}`] = suelta(String(s.cuota));
    // Camila (fila FILA_CAMILA) es la única que NO guarda una regla: el
    // número quedó escrito a mano, y desactualizado — la avería del bloque 42.
    cuotas[`D${f}`] = f === FILA_CAMILA ? suelta(String(TOTAL_A_MANO_CAMILA)) : suelta(`=B${f}*C${f}`);
  });

  const torneos: Record<string, Celda> = {
    A3: fuerte('Torneo'),
    B3: fuerte('Inscripciones cobradas'),
    C3: fuerte('Premios comprados'),
    D3: fuerte('Neto'),
  };
  TORNEOS.forEach((t, i) => {
    const f = FILA_PRIMER_TORNEO + i;
    torneos[`A${f}`] = suelta(t.nombre);
    torneos[`B${f}`] = suelta(String(t.cobrado));
    torneos[`C${f}`] = suelta(String(t.gastado));
    // El torneo roto (fila FILA_TORNEO_ROTO) trae el `#¡REF!` de una columna
    // que alguien borró — la misma forma con la que ya escribe un error
    // `ajustarPorFilas` en `comandos.ts` al borrar de verdad.
    torneos[`D${f}`] = f === FILA_TORNEO_ROTO ? suelta(`=B${f}-C${f}-#¡REF!`) : suelta(`=B${f}-C${f}`);
  });

  const resumen: Record<string, Celda> = {
    A1: fuerte('Resumen del ciclo'),
    A3: suelta('Total recaudado en cuotas'),
    B3: suelta(`=${'Cuotas'}!${CELDA_TOTAL_CUOTAS}`),
    A4: suelta('Meses transcurridos'),
    // B4 se queda vacía a propósito: es el dato que le falta al promedio, no
    // un hueco cualquiera — «falta un dato, no sobra» (bloque 42).
    A5: suelta('Cuota promedio mensual'),
    B5: suelta('=B3/B4'),
  };

  const borrador: Record<string, Celda> = {
    A1: suelta('Notas viejas, ya no sirven — se me olvidó ocultar esto de verdad.'),
  };

  return {
    activa: HOJA_INDICE,
    nombres: {},
    hojas: [
      { id: HOJA_INDICE, nombre: 'Índice', celdas: indice, vinculos: { [`${HOJA_INDICE}!A8`]: { destino: DESTINO_QUE_NO_EXISTE } } },
      { id: HOJA_CUOTAS, nombre: 'Cuotas', color: '#107c41', celdas: cuotas },
      { id: HOJA_TORNEOS, nombre: 'Torneos', color: '#0f6cbd', celdas: torneos },
      { id: HOJA_RESUMEN, nombre: 'Resumen', color: '#7030a0', celdas: resumen },
      { id: HOJA_BORRADOR, nombre: 'Borrador', celdas: borrador, oculta: true },
    ],
  };
}

/* ── lo que el maestro le pregunta al libro ─────────────────────────────────*/

const motorDe = (libro: Libro) => crearMotor(libro, RELOJ);

/** Encargo 2: el Total de Camila deja de ser un número a mano. */
export function elNumeroDeCamilaEstaCorregido(libro: Libro): boolean {
  const motor = motorDe(libro);
  return guardaUnaRegla(libro, HOJA_CUOTAS, CELDA_CAMILA) && vale(motor, HOJA_CUOTAS, CELDA_CAMILA, TOTAL_CORRECTO_CAMILA);
}

/** Encargo 4: el `#¡REF!` de Torneos, arreglado quitando la referencia rota. */
export function elRefEstaArreglado(libro: Libro): boolean {
  if (!elNumeroDeCamilaEstaCorregido(libro)) return false;
  const motor = motorDe(libro);
  return (
    guardaUnaRegla(libro, HOJA_TORNEOS, CELDA_TORNEO_ROTO) &&
    !crudoDe(libro, HOJA_TORNEOS, CELDA_TORNEO_ROTO).includes('REF') &&
    vale(motor, HOJA_TORNEOS, CELDA_TORNEO_ROTO, NETO_TORNEO_ROTO)
  );
}

/**
 * Encargo 5: el `#¡DIV/0!` de Resumen, arreglado escribiendo el dato que
 * faltaba.
 *
 * `guardaUnaRegla(..., 'B5')` no sobra: sin ella, escribir el número
 * `160` directamente en B5 —tapando el error a mano, en vez de rellenar
 * B4— pasaría igual de bueno, exactamente el atajo que este encargo existe
 * para que no funcione. La fórmula tiene que seguir siendo la fórmula.
 */
export function elDiv0EstaArreglado(libro: Libro): boolean {
  if (!elRefEstaArreglado(libro)) return false;
  const motor = motorDe(libro);
  return (
    /*
     * CORREGIDO 1-sep-2026 (auditoría). Decía
     * `crudoDe(libro, HOJA_RESUMEN, 'B4') === String(MESES_TRANSCURRIDOS)`:
     * exigía que el TEXTO tecleado fuera exactamente «5». El motor acepta
     * `5.0`, `5.00` y `5 ` como el mismo número —`valorDeTextoCrudo` recorta y
     * parsea—, así que un alumno que escribiera cualquiera de esas formas veía
     * la hoja dar el resultado correcto y el encargo NO cerrarse, sin ninguna
     * pista de por qué. Se pregunta por el valor, que es lo que importa; el
     * `!guardaUnaRegla` de la línea siguiente ya es quien impide el atajo de
     * taparlo con una fórmula, que es lo que este encargo existe para enseñar.
     * Es el mismo par `!guardaUnaRegla(...) && vale(...)` que usa
     * `limpieza-de-datos/guion.ts` y la propia función de aquí arriba.
     */
    vale(motor, HOJA_RESUMEN, 'B4', MESES_TRANSCURRIDOS) &&
    !guardaUnaRegla(libro, HOJA_RESUMEN, 'B4') &&
    guardaUnaRegla(libro, HOJA_RESUMEN, 'B5') &&
    errorDe(motor, HOJA_RESUMEN, 'B5') === null &&
    vale(motor, HOJA_RESUMEN, 'B5', CUOTA_PROMEDIO)
  );
}

/** Un hipervínculo de verdad: la hoja correcta, y sin que se vea roto. */
function apuntaBien(libro: Libro, celda: string, destinoHoja: string): boolean {
  const v = vinculoEnCelda(libro, HOJA_INDICE, celda);
  return v !== null && v.destino === `${destinoHoja}!A1` && !vinculoRoto(libro, v);
}

/** Encargo 6: «Ver Cuotas» ya lleva a alguna parte. */
export function elEnlaceACuotasEstaPuesto(libro: Libro): boolean {
  if (!elDiv0EstaArreglado(libro)) return false;
  return apuntaBien(libro, 'A5', HOJA_CUOTAS);
}

/** Encargo 7: «Ver Torneos». */
export function elEnlaceATorneosEstaPuesto(libro: Libro): boolean {
  if (!elEnlaceACuotasEstaPuesto(libro)) return false;
  return apuntaBien(libro, 'A6', HOJA_TORNEOS);
}

/** Encargo 8: «Ver Resumen». Con esto el índice ya navega las tres hojas de verdad. */
export function elEnlaceAResumenEstaPuesto(libro: Libro): boolean {
  if (!elEnlaceATorneosEstaPuesto(libro)) return false;
  return apuntaBien(libro, 'A7', HOJA_RESUMEN);
}

/** Encargo 9: el enlace a «Borrador», que ya no lleva a ningún lado, se quita. */
export function elEnlaceRotoEstaQuitado(libro: Libro): boolean {
  if (!elEnlaceAResumenEstaPuesto(libro)) return false;
  return vinculoEnCelda(libro, HOJA_INDICE, 'A8') === null;
}

/** Lo que enseña «Inspeccionar libro» al abrir el archivo, antes de arreglar nada. */
export function parteInicialDelLibro(libro: Libro) {
  const motor = motorDe(libro);
  return verificar(motor).errores; // 2: el REF de Torneos y el DIV/0 de Resumen
}

/* ── el guion ───────────────────────────────────────────────────────────────*/

export const GUION_INTERPRETA_LA_INFORMACION: GuionHojas = {
  archivo: ARCHIVO,
  libro: libroDeLasCuentas,

  portada: {
    situacion: 'Excel · Grado intermedio · La séptima de la sala',
    tema: 'Revisar el libro, ver las fórmulas y navegar con hipervínculos',
    objetivo:
      'Vas a entender una hoja que hizo otra persona: activar «Mostrar fórmulas» para ver de un vistazo dónde hay reglas y dónde hay un número escrito a mano, «Inspeccionar libro» para preguntarle al archivo lo que a ojo no se ve, y arreglar dos errores que cuentan dos historias distintas. Y vas a terminar el índice con hipervínculos, quitando el que ya no lleva a ningún lado.',
    vasAHacer: [
      'Encender «Mostrar fórmulas» y cazar el número que se quedó a mano',
      'Inspeccionar el libro entero: fórmulas, errores y una hoja escondida',
      'Leer un #¡REF! y un #¡DIV/0! como pistas, y arreglar cada uno a su manera',
      'Convertir el índice en algo navegable, y quitar un enlace que no lleva a ningún lado',
    ],
    requisitos:
      'Las clases pasadas del grado Intermedio: escribir una fórmula a mano y leer un mensaje de error sin asustarte.',
    ayuda:
      '«Mostrar fórmulas» está en Fórmulas → Auditoría de fórmulas. «Inspeccionar libro» está en Archivo → Información. El hipervínculo se crea con la celda seleccionada, escribiendo a qué hoja saltar: «h2!A1».',
  },

  pasos: [
    {
      id: 'ver-formulas-en-cuotas',
      titulo: 'Enciende la tapa',
      instruccion:
        'Ve a la hoja **Cuotas** y activa **Mostrar fórmulas**, en Fórmulas → Auditoría de fórmulas. Mira la columna Total de arriba abajo.',
      pista:
        'Con la tapa levantada, cada celda enseña la REGLA que guarda en vez del resultado. Cuatro Totales van a empezar con «=»; uno no.',
      senal: { control: 'hoja:h2' },
      logro: { tipo: 'control', control: 'mostrar-formulas' },
      aprendido:
        'Cuatro de los cinco Totales dicen `=B*C`: son reglas, y si cambiara el número de meses o la cuota, se recalcularían solas. Uno —el de Camila— dice sólo `140`, sin el `=` que distingue una regla de un dato. Ésa es la avería más común del mundo real: en medio de una columna de fórmulas, un número escrito a mano no avisa de nada, se ve exactamente igual que las demás celdas hasta que levantas la tapa.',
    },
    {
      id: 'corrige-el-numero-a-mano',
      titulo: 'Corrige el número de Camila',
      instruccion: `Con las fórmulas todavía a la vista, ponte en **${CELDA_CAMILA}** y escribe **=B${FILA_CAMILA}*C${FILA_CAMILA}**, igual que sus vecinas.`,
      pista: 'Es la misma fórmula que ya tienen las otras cuatro filas: meses por cuota, con el «=» delante.',
      senal: { control: `celda:${CELDA_CAMILA}` },
      logro: { tipo: 'documento', comprueba: elNumeroDeCamilaEstaCorregido },
      aprendido: `Salió **${TOTAL_CORRECTO_CAMILA}**, diez pesos más que el 140 que había — el Total recaudado de abajo se movió solo, de 790 a ${TOTAL_CUOTAS_CORRECTO}, sin que tocaras esa celda. Ahí está el costo real de un número a mano en medio de una columna de fórmulas: no se ve mal, sólo está mal, y arrastra a todo lo que suma sobre él.`,
    },
    {
      id: 'apaga-mostrar-formulas',
      titulo: 'Baja la tapa otra vez',
      instruccion:
        'Ya localizaste el problema. Vuelve a pulsar **Mostrar fórmulas** para apagarla y ver los resultados de nuevo.',
      pista: 'Es el mismo botón de hace dos encargos: se enciende y se apaga con el mismo clic.',
      senal: { control: 'mostrar-formulas' },
      logro: { tipo: 'control', control: 'mostrar-formulas' },
      aprendido:
        '«Mostrar fórmulas» es un interruptor, no un modo especial: se enciende para diagnosticar y se apaga para trabajar, tantas veces como haga falta. Apagada, la hoja vuelve a enseñar números — los mismos de siempre, sólo que ahora sabes cuáles son reglas.',
    },
    {
      id: 'inspecciona-el-libro',
      titulo: 'Pregúntale al libro lo que a ojo no se ve',
      instruccion:
        'Entra a **Archivo → Información** y pulsa **«Inspeccionar libro»**. Lee el parte con cuidado antes de seguir.',
      pista: 'El botón está debajo de las fichas de celdas y fórmulas, en la misma sección Información.',
      senal: { pestana: 'archivo' },
      logro: { tipo: 'control', control: 'inspeccionar' },
      aprendido:
        'El parte dice **2 errores** en todo el libro y **1 hoja escondida** — ninguna de las dos cosas se ve mirando la pantalla. Los dos errores están en hojas distintas: uno en Torneos, otro en Resumen, y los vas a arreglar uno por uno. La hoja escondida se llama Borrador; el tesorero anterior se le olvidó ocultarla de verdad, y por eso el enlace del índice que apunta a otra parte todavía no cuadra con ella — no son la misma cosa, y en un par de encargos vas a ver la diferencia.',
    },
    {
      id: 'arregla-el-ref',
      titulo: 'Un #¡REF! cuenta que alguien borró algo',
      instruccion: `Ve a la hoja **Torneos**. En **${CELDA_TORNEO_ROTO}** hay un \`#¡REF!\` metido dentro de la fórmula. Bórralo dejando sólo la cuenta de verdad: **=B${FILA_TORNEO_ROTO}-C${FILA_TORNEO_ROTO}**.`,
      pista:
        'El `#¡REF!` no es el error completo, es un PEDAZO de la fórmula: alguien borró una columna que esta cuenta usaba, y lo borrado se quedó ahí, visible, como un hueco. Quítalo y deja sólo lo cobrado menos lo gastado.',
      senal: { control: 'hoja:h3' },
      logro: { tipo: 'documento', comprueba: elRefEstaArreglado },
      aprendido: `Salió **${NETO_TORNEO_ROTO}**. Un \`#¡REF!\` cuenta siempre la misma historia: alguien borró una fila, una columna o una hoja entera que una fórmula necesitaba, y lo borrado se queda a la vista dentro de la regla, en vez de desaparecer en silencio. No se repara escribiendo un número: se repara editando la fórmula, porque el error estaba en la REGLA, no en el dato.`,
    },
    {
      id: 'arregla-el-div0',
      titulo: 'Un #¡DIV/0! cuenta que falta un dato',
      instruccion: `Ve a la hoja **Resumen**. La Cuota promedio mensual da \`#¡DIV/0!\` porque a **B4** —Meses transcurridos— nunca le escribieron nada. Van **${MESES_TRANSCURRIDOS}** meses de este ciclo: escríbelo ahí, sin tocar la fórmula de abajo.`,
      pista:
        'El problema no está en =B3/B4: esa fórmula está bien escrita. Está en que B4 se quedó vacía, y una hoja vacía en una división vale 0. Escribe el número en B4, no cambies B5.',
      senal: { control: 'hoja:h4' },
      logro: { tipo: 'documento', comprueba: elDiv0EstaArreglado },
      aprendido: `Con el dato puesto, la Cuota promedio mensual salió sola: **${CUOTA_PROMEDIO}**. Compáralo con el \`#¡REF!\` de hace un momento: ahí sobraba un pedazo roto dentro de la fórmula; aquí faltaba un dato afuera de ella. Uno se arregla editando la regla; el otro, rellenando el hueco. Confundir los dos es tapar un error sin haber entendido qué lo causó.`,
    },
    {
      id: 'enlaza-cuotas',
      titulo: 'El primer salto del índice',
      instruccion:
        'Vuelve a la hoja **Índice** y ponte en **A5**, «→ Ver Cuotas». Abre **Hipervínculo** —en Insertar → Vínculos— y escribe a propósito **h9!A1**: mira que la hoja te lo rechaza. Ahora escribe el destino de verdad: **h2!A1**.',
      pista:
        'El cuadro pide «hoja!celda». h9 no existe en este libro, así que la hoja se niega a crear el vínculo — no lo crea roto, no te deja crearlo. h2 es Cuotas.',
      senal: { control: 'hoja:h1' },
      logro: { tipo: 'documento', comprueba: elEnlaceACuotasEstaPuesto },
      aprendido:
        'Con h9!A1 la hoja no dejó pasar nada: un hipervínculo a una hoja que no existe se rechaza al crearlo, no se rompe después. Con h2!A1, A5 se pintó como un vínculo de verdad. Un índice con enlaces que saltan de hoja en hoja es la diferencia entre un archivo y un documento — y esto era exactamente lo que le faltaba terminar al tesorero anterior.',
    },
    {
      id: 'enlaza-torneos',
      titulo: 'El segundo salto',
      instruccion: 'Ponte en **A6**, «→ Ver Torneos», y crea el hipervínculo: **h3!A1**.',
      pista: 'Mismo botón, misma celda seleccionada primero. h3 es Torneos.',
      senal: { control: 'hipervinculo' },
      logro: { tipo: 'documento', comprueba: elEnlaceATorneosEstaPuesto },
      aprendido: 'Dos de tres. Cada enlace es del mismo tamaño de trabajo que el anterior — sólo cambia el destino.',
    },
    {
      id: 'enlaza-resumen',
      titulo: 'El tercer salto',
      instruccion: 'Ponte en **A7**, «→ Ver Resumen», y crea el hipervínculo: **h4!A1**.',
      pista: 'h4 es Resumen, la última hoja que sí existe.',
      senal: { control: 'hipervinculo' },
      logro: { tipo: 'documento', comprueba: elEnlaceAResumenEstaPuesto },
      aprendido:
        'Con los tres puestos, el índice ya navega de verdad las tres hojas del libro. Sólo queda el cuarto renglón, el que el tesorero anterior dejó a medias.',
    },
    {
      id: 'quita-el-enlace-roto',
      titulo: 'El enlace que no lleva a ningún lado',
      instruccion:
        'Ponte en **A8**, «→ Ver Borrador» —se ve distinto de los otros tres, es el que está roto—. Con la celda seleccionada, pulsa **Quitar hipervínculo**.',
      pista:
        'No hace falta escribir nada: Quitar hipervínculo actúa directo sobre la celda seleccionada, sin pedir ningún dato.',
      senal: { control: 'quitar-hipervinculo' },
      logro: { tipo: 'documento', comprueba: elEnlaceRotoEstaQuitado },
      aprendido:
        'A8 dejó de verse como un vínculo: seguía diciendo «→ Ver Borrador», pero ya no prometía saltar a ningún lado. El destino de ese enlace nunca fue la hoja Borrador que encontraste escondida con «Inspeccionar libro» —ésa sigue en el libro, sólo oculta—: era otra hoja que el tesorero anterior sí llegó a borrar de verdad. Un vínculo roto no falla en silencio: se ve distinto, y ahora sabes las dos cosas que puede significar «una hoja que no está a la vista» — escondida, que sigue ahí, o borrada, que ya no está en ningún lado.',
    },
  ],

  cierre:
    'Entendiste una hoja que no escribiste tú. Encendiste «Mostrar fórmulas» y cazaste un número a mano en medio de una columna de reglas —la avería más común del mundo real—, y la apagaste otra vez cuando ya no la necesitabas. Le preguntaste al libro con «Inspeccionar libro» lo que a ojo no se ve: 2 errores y 1 hoja escondida. Leíste un #¡REF! como la historia de algo que alguien borró, y lo arreglaste editando la fórmula; leíste un #¡DIV/0! como la historia de un dato que faltaba, y lo arreglaste rellenando el hueco sin tocar la regla. Y terminaste el índice que el tesorero anterior dejó a medias: tres hipervínculos que convierten el libro en algo navegable, y uno menos que ya no llevaba a ningún lado.',
};

export default GUION_INTERPRETA_LA_INFORMACION;
