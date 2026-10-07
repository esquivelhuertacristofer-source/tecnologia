'use client';

import type { ActivityProps } from '@/types/activity-contract';
import type { GuionCodigo, PasoCodigo } from '@/components/simuladores/codigo/ventana';
import { aceptado, crearPanelJuezProgramas, type ProblemaPrograma } from '@/components/simuladores/juez';
import { SalaCodigo, type ClaseCodigo } from './SalaCodigo';
import { CELDAS_RETOS, MANUAL_RETOS, PROBLEMAS_RETOS, R1, R2, R3 } from './problemasRetos';

/**
 * N7 · U «Programación en texto I (Python)» · parada 5 — «Retos guiados».
 * **1.º de secundaria, 12–13 años**, comprobado en `curriculo.ts`.
 *
 * Documento maestro §69.18. Reescrita el 6-oct-2026 sobre el juez de programas.
 *
 * ── Qué era y por qué se reescribió ─────────────────────────────────────────
 *
 * El cierre de la unidad dictaba programas enteros: la instrucción del candado
 * traía sus once líneas con la sangría explicada entre paréntesis, y los datos
 * venían escritos en el código (`precio = 20`, ocho notas fijas). Combinar era
 * copiar.
 *
 * ── Qué es ahora ────────────────────────────────────────────────────────────
 *
 * Tres problemas con juez (`problemasRetos.ts`), cada uno juntando tres
 * herramientas de las paradas anteriores, y una pregunta de cierre sobre el
 * grupo vacío que divide entre cero. Fuera de los problemas, el panel enseña
 * la caja de herramientas de la unidad —qué se aprendió en qué parada—, sin
 * una línea de código.
 */

/* ─────────────────────────────── el archivo ──────────────────────────────── */

const ARCHIVO = 'retos.py';

export const PLANTILLA = [
  '# retos.py · el cierre de la unidad',
  '#',
  '# Cada «# %%» abre una celda. ▶ corre la celda del encargo en que vas y',
  '# «Enviar al juez» corre la de su problema, tecleando los datos por ti.',
  '',
  '# %% Reto 1 · El precio justo',
  '',
  '',
  '# %% Reto 2 · Aprobados y promedio',
  '',
  '',
  '# %% Reto 3 · El candado del casillero',
  '',
].join('\n');

/* ─────────────────────────────── el panel ────────────────────────────────── */

const HERRAMIENTAS: ReadonlyArray<{ parada: string; herramientas: string }> = [
  { parada: 'Variables y tipos', herramientas: 'guardar un dato, saber de qué tipo es y convertirlo' },
  { parada: 'Entrada y salida', herramientas: 'preguntar con input y contestar con print' },
  { parada: 'Condicionales', herramientas: 'decidir con if, elif y else, y juntar condiciones con and y or' },
  { parada: 'Bucles', herramientas: 'repetir con for y while, acumular, y salir con break' },
];

/** «La caja de herramientas» — lo que trae la unidad, sin una línea de código. */
function PanelCaja() {
  return (
    <div data-testid="pyc-caja">
      <h5 className="pyc-semaforo-titulo">Tu caja de herramientas</h5>
      <ul className="pyc-filas">
        {HERRAMIENTAS.map((h) => (
          <li key={h.parada}>
            <span className="pyc-fila">
              <span className="pyc-fila-textos">
                <span className="pyc-fila-nombre">{h.parada}</span>
                <span className="pyc-fila-detalle">{h.herramientas}</span>
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="pyc-nota">Ningún reto necesita algo que no esté aquí. Lo difícil es elegir cuáles juntar.</p>
    </div>
  );
}

const PanelRetos = crearPanelJuezProgramas({
  problemas: PROBLEMAS_RETOS,
  manual: MANUAL_RETOS,
  fuera: PanelCaja,
});

/* ─────────────────────────────── el guion ────────────────────────────────── */

const APRENDIDO: Readonly<Record<string, string>> = {
  [R1.id]:
    'Primero se calcula, después se decide sobre lo calculado. Cuando dos fronteras se cruzan, la más exigente se pregunta primero: si no, una compra de 500 se queda con el descuento chico.',
  [R2.id]:
    'En una pasada se pueden llevar varias cuentas a la vez, y una de ellas puede crecer sólo a veces. Un caso especial —el grupo vacío— se revisa antes de que la cuenta lo rompa.',
  [R3.id]:
    'Un bucle con dos salidas necesita recordar por cuál salió. Por eso se guarda en una variable, o se pregunta después por lo que quedó en el contador.',
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
    pasoDeProblema(R1),
    pasoDeProblema(R2),
    pasoDeProblema(R3),
    {
      id: 'el-grupo-vacio',
      titulo: 'Para cerrar · El grupo vacío',
      instruccion:
        'Una compañera resolvió Aprobados y promedio sin revisar si el grupo tenía alumnos. El juez le aceptó los dos ejemplos y casi todos los ocultos, pero en «grupo vacío» su programa se detuvo con un error. ¿Por qué?',
      pista: 'Con cero alumnos, ¿cuánto vale la suma y entre cuánto la divide su programa?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Porque con cero alumnos su programa divide la suma entre 0, y dividir entre cero no tiene resultado: Python se detiene con un error.',
          'Porque el juez no sabe teclear un 0.',
          'Porque con cero alumnos el for da una vuelta de más.',
          'Porque el promedio de un grupo vacío es 0.0 y ella imprimió 0.',
        ],
        correcta: 0,
      },
      aprendido:
        'Un programa no sólo se equivoca en las fronteras: también en los casos especiales, como que no haya datos. El enunciado lo decía; los ejemplos no lo probaban; un oculto sí.',
    },
  ],
  cierre:
    'Juntaste lo de toda la unidad sin que nadie te dictara una línea: decidiste sobre un total que calculaste, llevaste dos cuentas en un bucle y escribiste un bucle con dos salidas. Eso es programar.',
};

/* ─────────────────────────────── la clase ────────────────────────────────── */

export const CLASE: ClaseCodigo = {
  actividadId: 'n7-retos-python',
  titulo: 'Retos guiados',
  archivo: ARCHIVO,
  insignia: { nombre: 'Resolviste los tres retos', emoji: '🏅' },
  minutos: 35,
  portada: {
    situacion: 'Nivel 7 · Programación en texto I · Parada 5 de 5',
    tema: 'Retos: juntar todo lo de la unidad',
    objetivo:
      'Tres programas completos que piden la papelería, la maestra y el casillero de la escuela. Ninguno necesita algo nuevo: necesitan que juntes lo de las cuatro paradas. Los escribes tú y un juez los prueba en las fronteras y en los casos especiales.',
    vasAHacer: [
      'Calcular un total y decidir un descuento con dos fronteras que se cruzan.',
      'Llevar dos cuentas en el mismo bucle y no dividir entre cero.',
      'Escribir un bucle que se acaba de dos maneras y saber por cuál salió.',
      'Explicar por qué un programa pasó los ejemplos y se detuvo en un oculto.',
    ],
  },
  plantilla: PLANTILLA,
  celdas: CELDAS_RETOS,
  guion: GUION,
  panelFijo: { titulo: 'El juez de los retos', Cuerpo: PanelRetos },
  bit: {
    inicio:
      'Cierre de la unidad: tres retos y ninguna herramienta nueva. El juez los va a probar donde se equivocan los programas: en las fronteras y cuando no hay datos.',
    cierre: 'Tres programas tuyos, juzgados con datos que no viste. Ya no estás aprendiendo piezas sueltas: estás programando.',
  },
  final: {
    titulo: 'Resolviste los tres retos',
    detalle:
      'El precio con dos descuentos, el grupo con sus aprobados y su promedio, y el candado que se abre o se bloquea: tres programas tuyos que juntan toda la unidad, aceptados por un juez que probó las fronteras y el grupo vacío.',
  },
};

export function LabRetosPython(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaCodigo {...props} clase={CLASE} />;
}

export default LabRetosPython;
