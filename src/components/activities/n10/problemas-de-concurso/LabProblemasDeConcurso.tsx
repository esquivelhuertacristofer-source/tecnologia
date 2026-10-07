'use client';

import { useMemo, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import type { GuionCodigo, PanelCodigoProps, PasoCodigo } from '@/components/simuladores/codigo/ventana';
import { aceptado, crearPanelJuez, juzgar, salidaDe } from '@/components/simuladores/juez';
import { SalaCodigo, type ClaseCodigo } from '../../python/SalaCodigo';
import { P1, PROBLEMAS } from './problemas';
import './problemasDeConcurso.css';

/**
 * N10 · U «Programación aplicada» (`n10-programacion-aplicada`) · parada 2 de 3
 * — «Problemas tipo concurso» 🏆. **Bachillerato, 15–18 años.**
 * Documento maestro §68. Reescrita el 12-sep-2026.
 *
 * ── Qué era y por qué se reescribió ─────────────────────────────────────────
 *
 * Era el caso de cabecera de los **14 laboratorios que dictan la solución**
 * (auditoría del 12-sep-2026, familia F2). Cinco «problemas» cuyo enunciado
 * decía, palabra por palabra, el código que había que teclear —`avanzan = 0`
 * luego `for p in puntajes:` con sangría `if p >= 70:` con más sangría
 * `avanzan = avanzan + 1`— y un panel que enseñaba la respuesta en cuanto la
 * variable existía. La queja de Cristofer sobre esta clase fue exacta: «se
 * llama concurso y no hay ni un problema».
 *
 * ── Qué es ahora ────────────────────────────────────────────────────────────
 *
 * Un torneo con **juez**: seis problemas, cada uno con su enunciado, su firma,
 * sus casos de ejemplo y **veinte casos ocultos entre todos**. El alumno
 * escribe, envía, y recibe un veredicto que dice cuántos casos pasan y por qué
 * falla el que falla, sin enseñarle nunca los datos de los ocultos. La
 * corrección no mira su texto: **corre su programa**.
 *
 * El séptimo encargo es el que da la vuelta a la clase: el juez deja de
 * juzgarle a él y le toca a él escribir el caso. Se le da una versión ROTA de
 * su primer problema —la del `>` por `>=`, que es el error que él mismo pudo
 * haber cometido— y se le pide un dato con el que las dos contesten distinto.
 * Y la solución correcta contra la que se compara no la trae la clase: **es la
 * suya**, la que el juez ya aceptó en el problema 1. Por eso el encargo exige
 * las dos cosas a la vez (que su `avanzan` siga siendo correcta y que su caso
 * separe a las dos): romper su propia solución para «ganar» no cuela.
 *
 * ── Lo que esta clase NO hace ───────────────────────────────────────────────
 *
 * No enseña algoritmos nuevos: los seis se resuelven con el `for`, el `while`,
 * el `if` y el `def` que el alumno ya trae de N7 y del principio de N10. Lo
 * que enseña es otra cosa, y es la que faltaba en toda la plataforma: **que un
 * programa se juzga por lo que hace con datos que no elegiste tú**.
 */

/* ─────────────────────────────── el archivo ──────────────────────────────── */

const ARCHIVO = 'torneo_tecnimarket.py';

const PLANTILLA = [
  '# torneo_tecnimarket.py · torneo interno de programación de TecniMarket',
  '#',
  '# El enunciado de cada problema está en el panel de la derecha, con sus',
  '# ejemplos. Escribe aquí tu solución y pulsa «Enviar al juez».',
  '#',
  '# El juez llama a tu función con datos que tú no ves. Que funcione con los',
  '# ejemplos no basta.',
  '',
].join('\n');

/* ─────────────────────── el encargo 7: el caso que rompe ──────────────────── */

/**
 * La versión rota que el alumno tiene que desenmascarar. Es el `>` por `>=`:
 * el error más común del problema 1 y el que su caso oculto caza.
 */
export const AVANZAN_ROTA = [
  'def avanzan_rota(puntajes):',
  '    n = 0',
  '    for p in puntajes:',
  '        if p > 70:',
  '            n = n + 1',
  '    return n',
].join('\n');

export interface ResultadoCasoRoto {
  /** ¿Se puede evaluar? (hay `caso`, hay `avanzan`, nada se tropieza) */
  ok: boolean;
  /** Lo que contesta la solución del alumno. */
  buena: string | null;
  /** Lo que contesta la versión rota. */
  rota: string | null;
  /** ¿Su `avanzan` sigue estando bien, según el juez? */
  suyaSigueBien: boolean;
  porque: string;
}

/**
 * ¿El caso que escribió el alumno separa la solución buena de la rota?
 *
 * Se corre su programa **una sola vez** con las dos llamadas pegadas debajo,
 * así que las dos ven exactamente el mismo `caso()`. Si `caso()` devolviera
 * algo distinto en cada llamada —no puede en este subconjunto, no hay azar—,
 * seguiría siendo el mismo dato para las dos.
 */
export function probarCasoRoto(fuente: string): ResultadoCasoRoto {
  const suyaSigueBien = juzgar(P1, fuente).aceptado;
  const r = salidaDe(`${fuente}\n${AVANZAN_ROTA}`, 'print(avanzan(caso()))\nprint(avanzan_rota(caso()))');
  if (!r.ok || r.lineas.length < 2) {
    return {
      ok: false,
      buena: null,
      rota: null,
      suyaSigueBien,
      porque: r.porque || 'todavía no hay una función «caso» que devuelva una lista de puntajes',
    };
  }
  return { ok: true, buena: r.lineas[0], rota: r.lineas[1], suyaSigueBien, porque: '' };
}

export function rompeLaRota(fuente: string): boolean {
  const r = probarCasoRoto(fuente);
  return r.ok && r.suyaSigueBien && r.buena !== r.rota;
}

/**
 * El predicado del encargo corre en cada pintado (ver `registro.ts`), y éste sí
 * ejecuta el intérprete. Se memoriza por texto: teclear no puede costar dos
 * veces la misma respuesta.
 */
const memoria = new Map<string, boolean>();
function rompeLaRotaMemo(fuente: string): boolean {
  const guardado = memoria.get(fuente);
  if (guardado !== undefined) return guardado;
  const r = rompeLaRota(fuente);
  if (memoria.size > 200) memoria.clear();
  memoria.set(fuente, r);
  return r;
}

/* ─────────────────────────────── los paneles ─────────────────────────────── */

function PanelCasoRoto({ texto, aceptados }: PanelCodigoProps & { aceptados: readonly string[] }) {
  const [probado, setProbado] = useState<ResultadoCasoRoto | null>(null);
  /* Sólo aparece con el torneo ganado: antes no tendría contra qué comparar
   * —la referencia es la solución del alumno al problema 1— y encima le
   * adelantaría el error del problema 1 justo mientras lo resuelve.
   *
   * La lista viene del panel del juez y no de `aceptado(id, texto)`, que
   * exige el MISMO texto: en cuanto el alumno escribiera la primera letra de
   * `caso()` el panel desaparecería delante de sus ojos. */
  const listo = useMemo(() => PROBLEMAS.every((p) => aceptados.includes(p.id)), [aceptados]);
  if (!listo) return null;

  return (
    <div className="pdc-roto" data-testid="pdc-roto">
      <h4>Encargo final · El caso que la rompe</h4>
      <p>
        Debajo de tu programa, el juez pega esta versión de tu primer problema. Alguien la escribió con prisa y tiene un
        error. Escribe en tu archivo una función <code>caso()</code> que devuelva una lista de puntajes con la que tu
        solución y ésta <b>no contesten lo mismo</b>.
      </p>
      <pre className="pdc-rota-codigo">{AVANZAN_ROTA}</pre>
      <button type="button" className="pdc-probar" data-testid="pdc-probar" onClick={() => setProbado(probarCasoRoto(texto))}>
        Probar mi caso
      </button>
      {probado && (
        <div
          className="pdc-veredicto-roto"
          data-testid="pdc-veredicto-roto"
          data-separa={probado.ok && probado.suyaSigueBien && probado.buena !== probado.rota ? 'si' : 'no'}
        >
          {!probado.ok && <p className="pdc-porque">{probado.porque}</p>}
          {probado.ok && !probado.suyaSigueBien && (
            <p className="pdc-porque">
              Tu función <code>avanzan</code> ya no pasa el problema 1. Separar las dos rompiendo la tuya no vale: la
              buena de la comparación es la tuya.
            </p>
          )}
          {probado.ok && probado.suyaSigueBien && (
            <p className="pdc-porque">
              Con tu caso, la tuya contesta <b>{probado.buena}</b> y la rota contesta <b>{probado.rota}</b>.
              {probado.buena === probado.rota
                ? ' Las dos dicen lo mismo: con este dato el error no se ve. Piensa qué puntaje distingue «más de 70» de «70 o más».'
                : ' Las dos contestan distinto: tu caso desenmascara el error.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const PanelTorneo = crearPanelJuez({ problemas: PROBLEMAS, pie: PanelCasoRoto });

/* ─────────────────────────────── el guion ────────────────────────────────── */

const APRENDIDO: Readonly<Record<string, string>> = {
  'p1-el-corte': 'Un enunciado se lee con lupa: «llegaron a setenta» incluye al que sacó setenta, y un signo decide.',
  'p2-el-mejor-tiempo': 'El caso vacío no es un adorno del enunciado: es parte del problema, y casi siempre el que falla.',
  'p3-la-premiacion': 'Invertir conserva todo, repetidos incluidos. Un recorrido al revés no es un filtro.',
  'p4-la-suma-de-verificacion': 'Cuándo parar un bucle es una decisión aparte de qué hacer dentro: el 1000 lo demuestra.',
  'p5-las-mesas': 'Probar divisores hasta la raíz no es un truco: es darse cuenta de que un divisor nunca viene solo.',
  'p6-el-campeon': 'El desempate no se improvisa: «mayor» y «mayor o igual» eligen a personas distintas.',
};

const PASOS_DE_PROBLEMA: PasoCodigo[] = PROBLEMAS.map((p) => ({
  id: p.id,
  titulo: p.titulo,
  instruccion: `${p.enunciado} · El enunciado completo, la firma y los ejemplos están en el panel de la derecha. Cuando creas que está lista, pulsa «Enviar al juez».`,
  pista: p.pistas[0],
  senal: { control: 'editor' },
  logro: { tipo: 'ejecucion', comprueba: (_e, fuente) => aceptado(p.id, fuente) },
  aprendido: APRENDIDO[p.id],
}));

const GUION: GuionCodigo = {
  pasos: [
    ...PASOS_DE_PROBLEMA,
    {
      id: 'el-caso-que-rompe',
      titulo: 'Encargo final · El caso que la rompe',
      instruccion:
        'Ahora el que escribe la prueba eres tú. En el panel tienes una versión rota de tu primer problema. Escribe en tu archivo una función  caso()  que devuelva una lista de puntajes con la que tu solución y la rota no contesten lo mismo. Tu «avanzan» tiene que seguir pasando el problema 1.',
      pista:
        'La rota cuenta a los que hicieron MÁS de 70. La tuya cuenta a los que llegaron A 70. ¿Qué puntaje hay entre esas dos frases?',
      senal: { control: 'editor' },
      logro: { tipo: 'ejecucion', comprueba: (_e, fuente) => rompeLaRotaMemo(fuente) },
      aprendido:
        'Un caso de prueba que no distingue lo correcto de lo incorrecto no prueba nada. Por eso un juez guarda casos que tú no elegiste.',
    },
    {
      id: 'por-que-ocultos',
      titulo: 'Para cerrar · Por qué la mitad de los casos no se ven',
      instruccion:
        'Ya resolviste seis problemas y escribiste un caso de prueba. Una última: ¿para qué sirve que el juez guarde casos ocultos?',
      pista:
        'Piensa en lo que podrías haber hecho con el problema 1 si los cuatro casos hubieran estado a la vista, con su respuesta al lado.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Para que no se pueda aprobar escribiendo la respuesta del ejemplo en lugar de resolver el problema.',
          'Para que el ejercicio sea más difícil y dure más tiempo.',
          'Para que el profesor pueda cambiar la calificación después.',
          'Para que el programa corra más rápido al enviarlo.',
        ],
        correcta: 0,
      },
      aprendido:
        'Un juez con casos ocultos evalúa el programa; uno con todos los casos a la vista evalúa la copia. Esa es toda la diferencia.',
    },
  ],
  cierre:
    'Seis problemas resueltos con datos que no elegiste tú, y una prueba escrita por ti que desenmascara un error. Eso es exactamente el trabajo de la primera ronda de cualquier concurso — y el de cualquier equipo que revisa código antes de publicarlo.',
};

/* ─────────────────────────────── la clase ────────────────────────────────── */

const CLASE: ClaseCodigo = {
  actividadId: 'n10-problemas-de-concurso',
  titulo: 'Problemas tipo concurso',
  archivo: ARCHIVO,
  insignia: { nombre: 'Finalista del torneo', emoji: '🥇' },
  minutos: 45,
  portada: {
    situacion: 'Nivel 10 · Programación aplicada · Parada 2 de 3',
    tema: 'Problemas tipo concurso: tu programa contra datos que no elegiste tú',
    objetivo:
      'Hoy no hay enunciados que te digan qué teclear. Hay seis problemas con su descripción, un par de ejemplos y un juez que llama a tu función con datos ocultos. Vas a escribir, enviar, leer el veredicto y volver a intentarlo — y al final vas a escribir tú el caso de prueba que desenmascara una solución con un error.',
    vasAHacer: [
      'Resolver seis problemas breves: contar con una condición, buscar un mínimo, invertir una lista, sumar cifras, decidir si un número es primo y desempatar a un campeón.',
      'Enviar cada solución a un juez que la corre con casos visibles y con casos ocultos, y leer por qué falla el que falla.',
      'Pedir pistas sólo cuando hagan falta: son tres por problema y la tercera cuesta puntos.',
      'Escribir tu propio caso de prueba: uno que distinga tu solución correcta de una versión con un error.',
    ],
  },
  plantilla: PLANTILLA,
  guion: GUION,
  panelFijo: { titulo: 'El juez del torneo', Cuerpo: PanelTorneo },
  /* El panel de variables se queda: es la única forma que tiene de depurar su
   * propia solución antes de enviarla, que es justo lo que la clase le pide. */
  bit: {
    inicio:
      'TecniMarket abre su torneo interno. Seis problemas y un juez: le mandas tu programa y lo corre con datos que tú no has visto. Que funcione con el ejemplo no significa nada — eso lo vas a descubrir en el primer envío.',
    cierre:
      'Seis aceptados. Y lo último que hiciste no fue resolver: fue romper. Escribir el caso que desenmascara un error es la mitad del oficio de programar, y casi nadie la aprende hasta que le toca revisar el código de otro.',
  },
  final: {
    titulo: 'Torneo cerrado',
    detalle:
      'Resolviste los seis problemas contra un juez con casos ocultos y escribiste el caso de prueba que separa una solución correcta de una rota.',
  },
};

export function LabProblemasDeConcurso(props: ActivityProps) {
  return <SalaCodigo clase={CLASE} {...props} />;
}

export { CLASE, GUION, PLANTILLA, PROBLEMAS };
