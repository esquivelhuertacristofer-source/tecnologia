'use client';

import type { ActivityProps } from '@/types/activity-contract';
import type { GuionCodigo, PanelCodigoProps, PasoCodigo } from '@/components/simuladores/codigo/ventana';
import { aceptado, crearPanelJuezProgramas, type ProblemaPrograma } from '@/components/simuladores/juez';
import { SalaCodigo, type ClaseCodigo } from './SalaCodigo';
import { B1, B2, B3, B4, CELDAS_BUCLES, MANUAL_BUCLES, PROBLEMAS_BUCLES } from './problemasBucles';

/**
 * N7 · U «Programación en texto I (Python)» · parada 4 — «Bucles».
 * **1.º de secundaria, 12–13 años**, comprobado en `curriculo.ts`.
 *
 * Documento maestro §69.17. Reescrita el 6-oct-2026 sobre el juez de programas,
 * con el patrón de `n7-condicionales-python` (§68.5).
 *
 * ── Qué era y por qué se reescribió ─────────────────────────────────────────
 *
 * Nueve encargos que dictaban la línea («escribe `for i in range(5):`…») y
 * predicados que buscaban ESA línea con expresiones regulares: otro nombre de
 * variable, o la misma idea con `while`, suspendía. Y ningún bucle dependía de
 * un dato: con `range(5)` fijo, cinco `print` aprobaban igual.
 *
 * ── Qué es ahora ────────────────────────────────────────────────────────────
 *
 * Cuatro problemas con juez sobre el entrenamiento para la carrera
 * (`problemasBucles.ts`): el número de vueltas, de días o de salidas lo teclea
 * el juez, así que sólo un bucle de verdad pasa los ocultos. Una exploración
 * que conserva lo mejor de la clase vieja —ver al editor parar un bucle
 * infinito— sin dictar qué línea quitar, y un cierre sobre el `<=` que pasó el
 * ejemplo y «pidió un dato de más» en todos los ocultos.
 *
 * ── El panel ────────────────────────────────────────────────────────────────
 *
 * El tablero del juez con su ficha del manual y, debajo, **el Cuentapasos**:
 * cuántas instrucciones lleva dadas el intérprete. Es el mismo contador que
 * compara `TOPES.PASOS` en `subconjunto.ts`, no una metáfora.
 */

/* ─────────────────────────────── el archivo ──────────────────────────────── */

const ARCHIVO = 'entrenamiento.py';

export const PLANTILLA = [
  '# entrenamiento.py · la carrera de la escuela',
  '#',
  '# Cada «# %%» abre una celda. ▶ corre la celda del encargo en que vas y',
  '# «Enviar al juez» corre la de su problema, tecleando los datos por ti.',
  '',
  '# %% Problema 1 · Las vueltas',
  '',
  '',
  '# %% Problema 2 · Los kilómetros de la semana',
  '',
  '',
  '# %% Experimento · El bucle que no para',
  '',
  '',
  '# %% Problema 3 · La meta',
  '',
  '',
  '# %% Problema 4 · La alcancía',
  '',
].join('\n');

/* ─────────────────────────────── el panel ────────────────────────────────── */

/** «El Cuentapasos» — cuántas instrucciones lleva dadas el intérprete en la última ejecución. */
function PanelCuentapasos({ ejecucion }: PanelCodigoProps) {
  if (ejecucion.pasos === 0) {
    return (
      <p className="pyc-vacio" data-testid="pyc-cuentapasos-vacio">
        El Cuentapasos: pulsa ▶ —o ⏭ Un paso— y aquí vas a ver cuántas instrucciones lleva dadas Python.
      </p>
    );
  }

  const esLimite = ejecucion.fase === 'error' && ejecucion.error?.clase === 'limite';

  return (
    <div data-testid="pyc-cuentapasos">
      <h5 className="pyc-semaforo-titulo">El Cuentapasos · la última vez que pulsaste ▶</h5>
      <ul className="pyc-filas">
        <li>
          <span className="pyc-fila" data-cuentapasos={esLimite ? 'limite' : 'normal'}>
            <span className="pyc-fila-textos">
              <span className="pyc-fila-nombre">{ejecucion.pasos.toLocaleString('es-MX')} pasos</span>
              <span className="pyc-fila-detalle">Cada paso es una instrucción que Python ya ejecutó.</span>
            </span>
          </span>
        </li>
      </ul>
      <p className="pyc-nota">
        {esLimite
          ? 'Aquí se detuvo solo, para proteger tu navegador: la condición que tenía que apagar el bucle nunca se volvió falsa.'
          : 'Si tu bucle termina, este número deja de subir en cuanto el programa acaba.'}
      </p>
    </div>
  );
}

const PanelEntrenamiento = crearPanelJuezProgramas({
  problemas: PROBLEMAS_BUCLES,
  manual: MANUAL_BUCLES,
  fuera: PanelCuentapasos,
  pie: PanelCuentapasos,
});

/* ─────────────────────────────── el guion ────────────────────────────────── */

const APRENDIDO: Readonly<Record<string, string>> = {
  [B1.id]:
    'for repite un número de veces que puede venir de un dato. range empieza donde le dices y se detiene ANTES de su segundo número: por eso para llegar a la última vuelta hay que pasarse uno.',
  [B2.id]:
    'Acumular es tener una caja que nace una sola vez, antes del bucle, y crece en cada vuelta. Un input dentro del bucle pregunta una vez por vuelta, tantas como diga el primer dato.',
  [B3.id]:
    'while repite mientras su condición sea cierta, sin saber de antemano cuántas vueltas. Contar las vueltas es otra caja que crece de uno en uno.',
  [B4.id]:
    'Cuando el final lo marca una señal, se sale del bucle en el momento en que llega, ANTES de tratarla como un dato más. break no rompe el programa: sale del bucle y sigue con lo de abajo.',
};

function pasoDeProblema(p: ProblemaPrograma): PasoCodigo {
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
    pasoDeProblema(B1),
    pasoDeProblema(B2),
    {
      id: 'el-bucle-que-no-para',
      titulo: 'Experimento · El bucle que no para',
      instruccion:
        'Antes de la meta, un experimento. En la celda «Experimento», escribe un while que nunca se detenga solo y ejecútalo. Mira el Cuentapasos mientras esperas; si no quieres esperar, pon la velocidad en ⚡ antes de pulsar ▶.',
      pista: 'Un while se detiene cuando su condición se vuelve falsa. ¿Qué pasa si nada de lo que hay adentro la cambia?',
      senal: { control: 'velocidad' },
      logro: { tipo: 'ejecucion', comprueba: (e) => e.fase === 'error' && e.error?.clase === 'limite' },
      aprendido:
        'Un bucle infinito no es un programa roto: es una condición que nunca cambia. El editor cuenta los pasos y lo para solo para proteger tu navegador; Python de verdad no siempre trae ese salvavidas.',
    },
    pasoDeProblema(B3),
    pasoDeProblema(B4),
    {
      id: 'el-que-pide-de-mas',
      titulo: 'Para cerrar · El que pidió un dato de más',
      instruccion:
        'Un compañero escribió La meta repitiendo mientras la suma fuera menor o igual que la meta. El juez le aceptó el ejemplo de la meta de 10 y en los tres ocultos le dijo que su programa pidió un dato más de los que traía el caso. ¿Por qué?',
      pista: 'Recorre su bucle con la meta de 5 y una salida de 5. Cuando la suma ya es 5, ¿su condición es cierta o falsa?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Porque cuando la suma llega justo a la meta, «menor o igual» todavía es cierta: su bucle da otra vuelta y pregunta otra salida que el caso no trae.',
          'Porque el juez no acepta el signo menor o igual dentro de un while.',
          'Porque en el ejemplo de la meta de 10 el juez le teclea más datos que en los ocultos.',
          'Porque su contador de salidas empezó en 1 en vez de 0.',
        ],
        correcta: 0,
      },
      aprendido:
        'La frontera de un while es igual de delicada que la de un if: con «menor o igual» se da una vuelta de más justo cuando se llega exacto. El ejemplo se pasaba de la meta, por eso no lo notó; los ocultos caían justo en ella.',
    },
  ],
  cierre:
    'Tus bucles repiten lo que dice el dato, no lo que tú escribiste: vueltas, días, salidas y monedas que tecleó otro. Y viste parar un bucle infinito sin que nadie te dijera qué quitar.',
};

/* ─────────────────────────────── la clase ────────────────────────────────── */

export const CLASE: ClaseCodigo = {
  actividadId: 'n7-bucles-python',
  titulo: 'Bucles',
  archivo: ARCHIVO,
  insignia: { nombre: 'Sobreviviste al bucle infinito', emoji: '🌀' },
  minutos: 35,
  portada: {
    situacion: 'Nivel 7 · Programación en texto I · Parada 4 de 5',
    tema: 'Bucles: repetir lo que dice el dato',
    objetivo:
      'El equipo entrena para la carrera de la escuela y necesita programas que repitan: anunciar vueltas, sumar kilómetros, saber cuándo se llegó a la meta y contar la alcancía. Los vas a escribir tú, sin líneas dictadas, y un juez los va a probar con cuántas vueltas, días y monedas se le ocurran.',
    vasAHacer: [
      'Repetir un número de veces que viene de un dato, con for y range.',
      'Sumar en una caja que crece en cada vuelta, preguntando una vez por vuelta.',
      'Repetir mientras falte algo, con while, y provocar un bucle que no para solo.',
      'Salir de un bucle en cuanto llega una señal, y explicar un while que pidió un dato de más.',
    ],
  },
  plantilla: PLANTILLA,
  celdas: CELDAS_BUCLES,
  guion: GUION,
  panelFijo: { titulo: 'El juez del entrenamiento', Cuerpo: PanelEntrenamiento },
  bit: {
    inicio:
      'Hoy tus programas repiten. Pero cuántas veces no lo decides tú: lo teclea el juez, y va a probar con cero vueltas, con una y con doce.',
    cierre: 'Tus bucles repiten lo que dice el dato y se detienen justo donde deben. Eso es lo difícil de un bucle, no escribir el for.',
  },
  final: {
    titulo: 'Sobreviviste al bucle infinito',
    detalle:
      'Cuatro programas que repiten lo que dice el dato —vueltas, kilómetros, salidas hasta la meta y monedas hasta la señal—, aceptados por un juez que probó con cero, con uno y con muchos. Y provocaste un bucle infinito sin que nadie te dictara cómo.',
  },
};

export function LabBucles(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaCodigo {...props} clase={CLASE} />;
}

export default LabBucles;
