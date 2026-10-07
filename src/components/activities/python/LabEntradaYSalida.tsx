'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { nombreDeTipo } from '@/components/simuladores/codigo';
import type { Ejecucion, GuionCodigo, PanelCodigoProps, PasoCodigo } from '@/components/simuladores/codigo/ventana';
import { aceptado, crearPanelJuezProgramas, lineasImpresas } from '@/components/simuladores/juez';
import { SalaCodigo, type ClaseCodigo } from './SalaCodigo';
import {
  CELDAS_ENTRADA_Y_SALIDA,
  MANUAL_ENTRADA_Y_SALIDA,
  P1,
  P2,
  P3,
  PROBLEMAS_ENTRADA_Y_SALIDA,
} from './problemasEntradaYSalida';

/**
 * N7 · U2 «Programación en texto I (Python)» · parada 2 — «Entrada y salida».
 * **1.º de secundaria, 12–13 años**, comprobado en `curriculo.ts`.
 *
 * Documento maestro §68.4. Reescrita el 12-sep-2026 sobre el juez de programas.
 *
 * ── Qué era y por qué se reescribió ─────────────────────────────────────────
 *
 * Ocho encargos cuya instrucción era la línea que había que escribir
 * («Escribe abajo `nombre = input("¿Cómo te llamas? ")`») y cuyos predicados
 * leían variables llamadas `nombre`, `edad` y `ciudad`, o textos fijos como
 * `'FICHA · '`. La secuencia era buena y se conserva: el programa **se detiene
 * a esperarte**, sumarle 1 a lo que llegó **revienta**, se convierte, y
 * contestar «trece» enseña que a veces lo que no vale es el dato.
 *
 * ── Qué es ahora ────────────────────────────────────────────────────────────
 *
 * Tres encargos de exploración, **escritos como metas** y comprobados por lo
 * que pasa (el programa esperó, se rompió con un error de tipo, se rompió con
 * uno de valor), y **tres problemas con juez** (`problemasEntradaYSalida.ts`):
 * el juez teclea los datos de cada caso y compara sólo lo que el programa
 * imprime. Nadie le dice al alumno cómo se llaman sus variables.
 *
 * Lo que sustituye al dictado es **el manual**: cada encargo trae una ficha con
 * un programa de otro tema que usa la herramienta necesaria. El alumno la tiene
 * que trasladar a su problema.
 *
 * ── El archivo, en celdas ───────────────────────────────────────────────────
 *
 * Tres programas no caben en un archivo sin estorbarse —al probar el tercero,
 * el primero volvería a preguntar la edad—. La plantilla viene partida en
 * celdas `# %%`, la convención de VS Code y Spyder: ▶ corre la celda del
 * encargo en que va el alumno, y el juez, la de su problema. Ver
 * `simuladores/codigo/celdas.ts`.
 *
 * ── El panel ────────────────────────────────────────────────────────────────
 *
 * En los problemas, el tablero del juez con su ficha plegada. En los encargos
 * de exploración, la ficha abierta y **el buzón de respuestas**, que se queda de
 * la versión anterior porque es lo mejor que tenía: enseña lo que llegó **con
 * sus comillas** y la chapa de su tipo.
 */

/* ─────────────────────────────── el archivo ──────────────────────────────── */

const ARCHIVO = 'entrevista.py';

export const PLANTILLA = [
  '# entrevista.py · programas que preguntan y contestan',
  '#',
  '# El archivo está partido en celdas: cada línea «# %%» abre una.',
  '# ▶ corre la celda del encargo en que vas, y tú contestas en la consola.',
  '# «Enviar al juez» corre la celda de su problema y teclea los datos por ti.',
  '',
  '# %% Calentamiento',
  '',
  '',
  '# %% Problema 1 · El año que viene',
  '',
  '',
  '# %% Problema 2 · En 2030',
  '',
  '',
  '# %% Problema 3 · La cuenta de la tiendita',
  '',
].join('\n');

/* ───────────────────────── lectores del programa ─────────────────────────── */

/** Una línea `algo = input("pregunta")` —o con `int(`/`float(` alrededor— del archivo. */
interface Buzon {
  caja: string;
  pregunta: string;
  linea: number;
}

const ASIGNA_INPUT =
  /^\s*([A-Za-z_][A-Za-z_0-9]*)\s*=\s*(?:(?:int|float|str)\s*\(\s*)?input\s*\(\s*(?:"([^"]*)"|'([^']*)')?\s*\)\s*\)?\s*$/;

function buzones(fuente: string): Buzon[] {
  const salida: Buzon[] = [];
  fuente.split('\n').forEach((linea, i) => {
    const m = ASIGNA_INPUT.exec(linea);
    if (!m) return;
    salida.push({ caja: m[1], pregunta: (m[2] ?? m[3] ?? '').trim(), linea: i + 1 });
  });
  return salida;
}

/** Los textos no vacíos que hay guardados ahora mismo. */
function textosGuardados(e: Ejecucion): string[] {
  return e.variables.flatMap((v) => (v.valor.t === 'cad' && v.valor.v.trim() !== '' ? [v.valor.v.trim()] : []));
}

/**
 * ¿El programa **contestó** con algo de lo que le dijeron? Se mira lo que
 * imprimió `print`, nunca los ecos de `input`: la línea «¿Cómo te llamas? Sofi»
 * contiene «Sofi» y no es un saludo.
 */
function contestoConLoQueLlego(e: Ejecucion): boolean {
  if (e.fase !== 'terminada' || e.ecos.length === 0) return false;
  const impresas = lineasImpresas(e.salida, e.ecos);
  return textosGuardados(e).some((t) => impresas.some((l) => l.includes(t)));
}

/* ─────────────────────────────── el panel ────────────────────────────────── */

/**
 * «El buzón de respuestas» — qué pregunta el programa y qué llegó.
 *
 * Por cada línea con `input` enseña la pregunta, **lo que llegó con sus
 * comillas** y la chapa de su tipo. Las comillas no son un detalle de formato:
 * son el argumento entero de la clase.
 */
function PanelBuzon({ ejecucion, texto, senalarLinea }: PanelCodigoProps) {
  const cajas = buzones(texto);

  if (cajas.length === 0) {
    return (
      <p className="pyc-vacio">
        Todavía no le has pedido nada a nadie. En cuanto escribas una línea con <b>input</b>, aparecerá aquí con lo
        que te contesten.
      </p>
    );
  }

  return (
    <>
      <ul className="pyc-filas" data-testid="pyc-buzon">
        {cajas.map((b) => {
          const v = ejecucion.variables.find((x) => x.nombre === b.caja);
          return (
            <li key={`${b.caja}-${b.linea}`}>
              <button
                type="button"
                className={`pyc-fila${v ? ' es-hecha' : ''}`}
                data-buzon={b.caja}
                onClick={() => senalarLinea(b.linea)}
              >
                <span className="pyc-fila-textos">
                  <span className="pyc-fila-nombre">{v ? v.texto : '— sin contestar —'}</span>
                  <span className="pyc-fila-detalle">
                    {b.caja} ← {b.pregunta === '' ? 'sin pregunta escrita' : b.pregunta}
                  </span>
                </span>
                {v && (
                  <span className="pyc-tipo" data-tipo={nombreDeTipo(v.valor)}>
                    {nombreDeTipo(v.valor)}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="pyc-nota">
        Mira las comillas: todo lo que entra por <b>input</b> llega como <b>str</b>, aunque escribas un número.
      </p>
    </>
  );
}

const PanelEntrevista = crearPanelJuezProgramas({
  problemas: PROBLEMAS_ENTRADA_Y_SALIDA,
  manual: MANUAL_ENTRADA_Y_SALIDA,
  fuera: PanelBuzon,
});

/* ─────────────────────────────── el guion ────────────────────────────────── */

const APRENDIDO: Readonly<Record<string, string>> = {
  [P1.id]:
    'int() convierte lo que llegó en un número con el que ya se puede sumar. Y el juez lee letra por letra: un espacio antes del punto ya es otra respuesta.',
  [P2.id]:
    'Un programa puede preguntar varias cosas y juntar un texto con una cuenta en la misma frase. El orden de las preguntas es parte de lo que le prometes a quien lo usa.',
  [P3.id]:
    'float() es para números con punto e int() para enteros: cada dato se convierte con la herramienta que le toca. Y sin convertir, multiplicar un texto no da error: lo repite.',
};

function pasoDeProblema(p: typeof P1): PasoCodigo {
  return {
    id: p.id,
    titulo: p.titulo,
    instruccion: `${p.enunciado} Escríbelo en la celda «${p.celda}» (▶ corre sólo esa celda) y, cuando creas que está listo, pulsa «Enviar al juez».`,
    pista: p.pistas[0],
    senal: { control: 'editor' },
    logro: { tipo: 'ejecucion', comprueba: (_e, fuente) => aceptado(p.id, fuente) },
    aprendido: APRENDIDO[p.id],
  };
}

const GUION: GuionCodigo = {
  pasos: [
    {
      id: 'que-te-pregunte',
      titulo: 'Que te pregunte',
      instruccion:
        'En la celda «Calentamiento», escribe un programa que te pregunte cómo te llamas y después te salude usando tu nombre. Ejecuta con ▶ y contesta en la consola. Si no sabes cómo se pregunta, mira la ficha del manual, a la derecha.',
      pista:
        'La ficha del manual pregunta otra cosa, pero la forma es la misma. Al ejecutar aparece un cuadro con ⌨ abajo de la consola: escribe ahí tu nombre y pulsa Enter.',
      senal: { control: 'consola' },
      logro: { tipo: 'ejecucion', comprueba: contestoConLoQueLlego },
      aprendido:
        'input detiene el programa y espera. Lo que contestan se guarda en la variable de la izquierda, y tu programa lo puede usar después.',
    },
    {
      id: 'lo-que-llega-es-texto',
      titulo: 'Lo que llega es texto',
      instruccion:
        'En la celda «Problema 1», haz que el programa pregunte la edad y, sin convertir nada, intenta imprimir cuántos años se cumplen el año que viene sumándole 1 a lo que llegó. Ejecuta, contesta con un número y deja que se rompa: el encargo es leer el error.',
      pista:
        'Escribe la suma como la pensarías: lo que llegó más 1. Contesta con cifras, por ejemplo 13, y después mira el buzón: ¿lo que llegó tiene comillas?',
      senal: { control: 'consola' },
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) =>
          e.fase === 'error' &&
          e.error?.clase === 'tipo' &&
          e.ecos.length > 0 &&
          e.variables.some((v) => v.valor.t === 'cad' && /^\s*-?\d+\s*$/.test(v.valor.v)),
      },
      aprendido:
        'Escribiste un número y llegó un texto: input SIEMPRE devuelve str, aunque teclees cifras. Y un texto no se puede sumar con un número.',
    },
    pasoDeProblema(P1),
    {
      id: 'el-dato-que-no-vale',
      titulo: 'El dato que no vale',
      instruccion:
        'Ejecuta tu Problema 1 otra vez y, cuando pregunte la edad, contesta con letras: «trece». Lee el error. Esta vez tu programa está bien escrito: lo que no vale es el dato.',
      pista: 'No cambies ni una línea. Sólo contesta trece en el cuadro de la consola y pulsa Enter.',
      senal: { control: 'consola' },
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => e.fase === 'error' && e.error?.clase === 'valor' && e.ecos.length > 0,
      },
      aprendido:
        'Un programa que pide un número tiene que contar con que le den otra cosa: int() no sabe leer «trece». Comprobar lo que llega antes de usarlo se aprende con las condicionales.',
    },
    pasoDeProblema(P2),
    pasoDeProblema(P3),
    {
      id: 'para-cerrar',
      titulo: 'Para cerrar · Pagas 12.512.512.5 pesos',
      instruccion:
        'Un compañero envió «La cuenta de la tiendita» y el juez le enseñó esto: tecleó 12.5 y 3, y su programa imprimió «Pagas 12.512.512.5 pesos.». ¿Qué le pasó?',
      pista: 'Piensa en qué tipo tenía el precio cuando llegó, y en qué hace un * cuando de un lado hay un texto.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Python se equivocó al multiplicar un número con decimales.',
          'El precio llegó como texto y nunca lo convirtió: multiplicar un texto por 3 lo repite tres veces.',
          'El juez tecleó el precio tres veces.',
          'Le faltó convertir las piezas; el precio estaba bien.',
        ],
        correcta: 1,
      },
      aprendido:
        'Un texto multiplicado por un número no da error: se repite. Por eso es un tropiezo tan traicionero, y por eso lo que llega por input se convierte antes de hacer cuentas.',
    },
  ],
  cierre:
    'Tus programas ya preguntan, convierten y contestan, y un juez los probó con datos que no elegiste tú: edades de cien años, nombres con espacio y precios sin centavos.',
};

/* ─────────────────────────────── la clase ────────────────────────────────── */

export const CLASE: ClaseCodigo = {
  actividadId: 'n7-entrada-y-salida',
  titulo: 'Entrada y salida',
  archivo: ARCHIVO,
  insignia: { nombre: 'Pregunta y responde', emoji: '💬' },
  minutos: 35,
  portada: {
    situacion: 'Nivel 7 · Programación en texto I · Parada 2 de 5',
    tema: 'El programa pregunta y contesta',
    objetivo:
      'Vas a escribir programas que preguntan con input y contestan con print, y un juez los va a probar tecleando datos que no has visto. Hoy no hay líneas que copiar: hay problemas, un manual con ejemplos de otros temas y tu consola.',
    vasAHacer: [
      'Hacer que tu programa se detenga a preguntarte, y contestarle tú en la consola.',
      'Descubrir, rompiéndolo, que lo que entra por input siempre es texto.',
      'Resolver tres problemas con juez: convertir con int() y float() y armar la frase exacta que se pide.',
      'Contestar mal a propósito y explicar por qué un texto multiplicado se repite.',
    ],
  },
  plantilla: PLANTILLA,
  celdas: CELDAS_ENTRADA_Y_SALIDA,
  guion: GUION,
  panelFijo: { titulo: 'El juez de la entrevista', Cuerpo: PanelEntrevista },
  bit: {
    inicio:
      'Hoy tus programas preguntan. Cuando pulsas ▶, contestas tú en la consola. Cuando lo envías, el juez teclea por ti y sólo lee lo que tu programa contesta.',
    cierre: 'Preguntar, convertir y contestar, probado con datos que no escogiste. Con eso ya se escriben programas útiles.',
  },
  final: {
    titulo: 'Pregunta y responde',
    detalle:
      'Tres programas que preguntan y contestan, aceptados por un juez que tecleó datos que no conocías. Y sabes lo que casi nadie sabe el primer día: lo que entra por input es texto, siempre, y convertirlo es decisión tuya.',
  },
};

export function LabEntradaYSalida(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaCodigo {...props} clase={CLASE} />;
}

export default LabEntradaYSalida;
