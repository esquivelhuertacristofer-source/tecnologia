'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { recortarCelda } from '@/components/simuladores/codigo';
import type { ArchivoProyecto, GuionCodigo, PanelCodigoProps, PasoCodigo } from '@/components/simuladores/codigo/ventana';
import { aceptado, crearPanelJuezProgramas, type ProblemaPrograma } from '@/components/simuladores/juez';
import { SalaCodigo, type ClaseCodigo } from '../../python/SalaCodigo';
import {
  ARCHIVO,
  CELDAS_INTERMEDIO,
  CSV,
  MANUAL_INTERMEDIO,
  MODULO,
  P1,
  P2,
  P3,
  PROBLEMAS_INTERMEDIO,
  SEMANA,
} from './problemasIntermedio';

/**
 * N10 · U «Programación aplicada» (`n10-programacion-aplicada`) · parada 1 de 3
 * — «Python intermedio». El currículo declara el tema: **archivos, módulos,
 * librerías**. Bachillerato, 15–18 años.
 *
 * Documento maestro §69.21. Reescrita el 6-oct-2026 **junto con la pieza de
 * motor que le faltaba** (M4): hasta ese día el intérprete no tenía `import`,
 * `with` ni `open`, y esta cabecera lo explicaba con todo detalle para
 * justificar que «archivos» y «módulos» fueran dos preguntas de opción
 * múltiple. Ahora son lo que se practica.
 *
 * ── La clase: la estación meteorológica de la escuela ───────────────────────
 *
 * Un proyecto de tres archivos, cada uno en su pestaña: `estacion.py` (el del
 * alumno, con sus celdas), `clima.py` (un módulo que el club de ciencias dejó a
 * medias, con su bloque de prueba bajo `if __name__ == "__main__":` ya escrito)
 * y `lecturas.csv`. Siete encargos: la librería (`statistics`), tres problemas
 * con juez —leer el CSV, escribir el módulo, escribir un archivo—, el archivo
 * que no existe, correr el módulo solo y la pregunta de por qué su prueba no
 * salió al importarlo.
 *
 * ── El panel ────────────────────────────────────────────────────────────────
 *
 * El tablero y, fuera de los problemas y al pie de ellos, **El disco de la
 * estación**: cada archivo del proyecto con lo que es —qué funciones define un
 * módulo, cuántos días trae el CSV— y lo que el programa escribió en la última
 * ejecución. Lee los archivos tal como están, nunca lo que deberían tener.
 */

/* ─────────────────────────────── el proyecto ─────────────────────────────── */

export const PLANTILLA = [
  '# estacion.py · la estación meteorológica de la escuela',
  '#',
  '# Cada «# %%» abre una celda. ▶ corre la celda del encargo en que vas.',
  '# Los datos están en la pestaña lecturas.csv, y el módulo en clima.py.',
  '',
  '# %% La librería',
  '',
  '',
  '# %% Problema 1 · La semana en números',
  '',
  '',
  '# %% Problema 2 · Clasifica la semana',
  '',
  '',
  '# %% Problema 3 · El reporte',
  '',
].join('\n');

export const CLIMA = [
  '# clima.py · el módulo de la estación',
  '# Lo empezó el club de ciencias. Le falta la función clasifica.',
  '',
  'UMBRAL_FRIO = 15',
  'UMBRAL_CALOR = 25',
  '',
  '# ↓ aquí va la función clasifica',
  '',
  '',
  'if __name__ == "__main__":',
  '    print("Probando clima.py:", clasifica(20.0))',
  '',
].join('\n');

export const PROYECTO: ArchivoProyecto[] = [
  { nombre: MODULO, texto: CLIMA },
  { nombre: CSV, texto: SEMANA },
];

/* ─────────────────────────────── el panel ────────────────────────────────── */

function funcionesDe(texto: string): string[] {
  return [...texto.matchAll(/^def\s+(\w+)/gm)].map((m) => m[1]);
}

/** «El disco de la estación»: qué hay en cada archivo del proyecto ahora mismo. */
function PanelDisco({ ejecucion, proyecto }: PanelCodigoProps) {
  const archivos = proyecto ?? {};
  const modulo = archivos[MODULO] ?? '';
  const csv = archivos[CSV] ?? '';
  const dias = csv.split('\n').filter((l) => l.trim() !== '').length - 1;
  const funciones = funcionesDe(modulo);
  const corrio = ejecucion.estadoMaquina === null && !ejecucion.error ? null : (ejecucion.corrio ?? ARCHIVO);
  const e = ejecucion.error;

  return (
    <div data-testid="pyc-disco">
      <h5 className="pyc-semaforo-titulo">El disco de la estación</h5>
      <ul className="pyc-filas">
        <li>
          <span className="pyc-fila" data-archivo={ARCHIVO}>
            <span className="pyc-fila-textos">
              <span className="pyc-fila-nombre">🐍 {ARCHIVO}</span>
              <span className="pyc-fila-detalle">tu programa: el que corre ▶ con su pestaña abierta</span>
            </span>
          </span>
        </li>
        <li>
          <span className="pyc-fila" data-archivo={MODULO} data-funciones={funciones.join(',')}>
            <span className="pyc-fila-textos">
              <span className="pyc-fila-nombre">🐍 {MODULO}</span>
              <span className="pyc-fila-detalle">
                módulo ·{' '}
                {funciones.length === 0 ? 'todavía no define ninguna función' : `define: ${funciones.join(', ')}`}
              </span>
            </span>
          </span>
        </li>
        <li>
          <span className="pyc-fila" data-archivo={CSV}>
            <span className="pyc-fila-textos">
              <span className="pyc-fila-nombre">📄 {CSV}</span>
              <span className="pyc-fila-detalle">
                {dias > 0 ? `${dias} día${dias === 1 ? '' : 's'} y un renglón de encabezado` : 'sin días'}
              </span>
            </span>
          </span>
        </li>
        {ejecucion.escritos.map((g) => {
          const renglones = g.texto === '' ? 0 : g.texto.replace(/\n$/, '').split('\n').length;
          return (
            <li key={g.nombre}>
              <span className="pyc-fila" data-archivo={g.nombre} data-escrito="si">
                <span className="pyc-fila-textos">
                  <span className="pyc-fila-nombre">📝 {g.nombre}</span>
                  <span className="pyc-fila-detalle">
                    lo escribió tu programa · {renglones} {renglones === 1 ? 'renglón' : 'renglones'}
                    {g.texto !== '' && !g.texto.endsWith('\n') ? ' · el último sin salto' : ''}
                  </span>
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      {corrio && (
        <p className="pyc-nota" data-testid="pyc-corrio">
          Corrió {corrio}
          {e && (e.clase === 'archivo' || e.clase === 'modulo' || e.clase === 'importacion')
            ? ` y se detuvo buscando algo que no está: ${e.mensaje}.`
            : '.'}
        </p>
      )}
    </div>
  );
}

const PanelIntermedio = crearPanelJuezProgramas({
  problemas: PROBLEMAS_INTERMEDIO,
  manual: MANUAL_INTERMEDIO,
  fuera: PanelDisco,
  pie: PanelDisco,
});

/* ─────────────────────────────── el guion ────────────────────────────────── */

const APRENDIDO: Readonly<Record<string, string>> = {
  [P1.id]:
    'Leer un archivo es recorrerlo renglón por renglón, y cada renglón es un texto con su salto al final. Lo que sea número hay que convertirlo antes de comparar o sumar: «9.5» como texto le gana a «31.0».',
  [P2.id]:
    'Un módulo es un archivo .py que otro importa. La regla vive en un sitio y se usa en otro, y por eso el juez pudo probar tu clasifica sin tu estacion.py: así se prueban los programas de verdad.',
  [P3.id]:
    'Escribir es abrir con "w" una vez y mandar cada renglón con write, con su salto. Lo que tu programa deja en un archivo sigue ahí cuando el programa termina: es la diferencia con print.',
};

function pasoDeProblema(p: ProblemaPrograma, donde: string): PasoCodigo {
  return {
    id: p.id,
    titulo: p.titulo,
    instruccion: `${p.enunciado} ${donde} Cuando creas que está listo, pulsa «Enviar al juez».`,
    pista: p.pistas[0],
    senal: { control: 'editor' },
    logro: { tipo: 'ejecucion', comprueba: (_e, fuente) => aceptado(p.id, fuente) },
    aprendido: APRENDIDO[p.id],
  };
}

/** La celda «La librería» importa `statistics` y usa las dos. Con cualquier forma de importarla. */
export function usaLaLibreria(fuente: string): boolean {
  const c = recortarCelda(fuente, 'La librería') ?? '';
  const importa = /^\s*(import\s+statistics\b|from\s+statistics\s+import\b)/m.test(c);
  return importa && /\bmedian\s*\(/.test(c) && /\bmean\s*\(/.test(c);
}

const GUION: GuionCodigo = {
  pasos: [
    {
      id: 'la-libreria',
      titulo: 'La librería ya lo tenía resuelto',
      instruccion:
        'En la celda «La librería», importa la librería statistics y pídele la mediana y el promedio de cinco números que tú elijas. Antes de ejecutar, adivina: ¿van a salir iguales? ¿Con decimales?',
      pista: 'Un módulo de fábrica se trae con import, y lo que trae se le pide con un punto. Mira la ficha del manual.',
      senal: { control: 'editor' },
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) => e.corrio === null && e.fase === 'terminada' && e.salida.length >= 2 && usaLaLibreria(fuente),
      },
      aprendido:
        'statistics trae hechas las cuentas que en N9 escribías con un bucle. Y copia a Python hasta en el tipo: si el promedio de enteros es exacto, devuelve un entero.',
    },
    pasoDeProblema(P1, 'Escríbelo en la celda «Problema 1» (▶ corre sólo esa celda).'),
    {
      id: 'el-archivo-que-no-existe',
      titulo: 'El archivo que no existe',
      instruccion:
        'En la misma celda, pídele a open un archivo que no esté en las pestañas del proyecto y ejecuta. Lee el error entero: ¿qué te dice que sí hay?',
      pista: 'Las pestañas de arriba son todo el disco de esta clase. Cualquier otro nombre sirve.',
      senal: { control: 'consola' },
      logro: { tipo: 'ejecucion', comprueba: (e) => e.fase === 'error' && e.error?.clase === 'archivo' },
      aprendido:
        'FileNotFoundError: el nombre tiene que ser exacto, con su extensión. El error no es un fallo raro: te dice qué archivos hay, que es justo lo que necesitas para arreglarlo.',
    },
    pasoDeProblema(
      P2,
      'La función va en la pestaña clima.py, y lo que la usa en la celda «Problema 2» de estacion.py.',
    ),
    {
      id: 'corre-el-modulo',
      titulo: 'Corre el módulo solo',
      instruccion:
        'Abre la pestaña clima.py y pulsa ▶: ahora el que corre es el módulo, no tu estacion.py. Mira qué sale en la consola y compáralo con lo que salió cuando estacion.py lo importó.',
      pista: 'Con la pestaña de un .py abierta, ▶ corre ese archivo. La línea que tienes que ver está al final de clima.py.',
      senal: { control: 'consola' },
      logro: {
        tipo: 'ejecucion',
        comprueba: (e) => e.corrio === MODULO && e.fase === 'terminada' && e.salida.some((l) => l.startsWith('Probando clima.py:')),
      },
      aprendido:
        'El mismo archivo se porta distinto según quién lo corre: solo, enseña su prueba; importado, no. Lo decide la línea del final de clima.py.',
    },
    pasoDeProblema(P3, 'Escríbelo en la celda «Problema 3»; reporte.txt aparece como pestaña nueva cuando tu programa lo escribe.'),
    {
      id: 'por-que-no-salio',
      titulo: 'Para cerrar · La prueba que no salió',
      instruccion:
        'Cuando estacion.py importó clima, la línea «Probando clima.py: …» no salió en la consola. Cuando corriste clima.py solo, sí. ¿Por qué?',
      pista: 'Mira la condición del if del final de clima.py. ¿Qué vale __name__ en cada caso?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Porque al importarlo, __name__ vale "clima" y no "__main__": el bloque de prueba sólo corre cuando clima.py es el archivo que se ejecuta.',
          'Porque import sólo lee las funciones de un archivo y se salta todo lo demás.',
          'Porque los print de un módulo nunca salen en la consola.',
          'Porque Python ya había corrido clima.py antes y se acordaba de lo que había salido.',
        ],
        correcta: 0,
      },
      aprendido:
        'import sí corre el archivo entero —por eso se crean UMBRAL_FRIO y clasifica—; lo que no corre es lo que está bajo if __name__ == "__main__". Así un módulo trae su propia prueba sin estorbar a quien lo usa.',
    },
  ],
  cierre:
    'Leíste un archivo de datos, escribiste un módulo que otro programa usa y que el juez probó por su cuenta, y dejaste un reporte escrito en el disco. Archivos, módulos y librerías: lo de cualquier proyecto de verdad.',
};

/* ─────────────────────────────── la clase ────────────────────────────────── */

export const CLASE: ClaseCodigo = {
  actividadId: 'n10-python-intermedio',
  titulo: 'Python intermedio',
  archivo: ARCHIVO,
  insignia: { nombre: 'Arquitecto de módulos', emoji: '🗂️' },
  minutos: 45,
  portada: {
    situacion: 'Nivel 10 · Programación aplicada · Parada 1 de 3',
    tema: 'Archivos, módulos y librerías: un proyecto de tres archivos',
    objetivo:
      'La estación meteorológica de la escuela guarda sus lecturas en un archivo, y el club de ciencias dejó a medias un módulo para clasificarlas. Vas a leer el archivo, terminar el módulo, usarlo desde tu programa y escribir un reporte, y un juez lo va a probar con semanas que no ves y con tu módulo por separado.',
    vasAHacer: [
      'Usar una librería de fábrica para lo que ya está resuelto.',
      'Leer un CSV renglón por renglón y escribir un archivo nuevo.',
      'Escribir una función en un módulo y usarla desde otro archivo.',
      'Entender por qué un módulo trae su prueba sin estorbar a quien lo importa.',
    ],
  },
  plantilla: PLANTILLA,
  proyecto: PROYECTO,
  celdas: CELDAS_INTERMEDIO,
  guion: GUION,
  panelFijo: { titulo: 'El juez de la estación', Cuerpo: PanelIntermedio },
  bit: {
    inicio:
      'Hoy tu programa no es un archivo: son tres, cada uno en su pestaña. Y el juez no va a usar tu semana ni tu estacion.py: va a probar tu módulo por su cuenta.',
    cierre:
      'Un proyecto de verdad es así: datos en un archivo, reglas en un módulo y un programa que los junta. Y cada parte se puede probar sola.',
  },
  final: {
    titulo: 'Arquitecto de módulos',
    detalle:
      'Tres programas sobre un proyecto de tres archivos —la semana en números, tu módulo clima y el reporte escrito—, aceptados por un juez que cambió el CSV en cada caso y probó tu clasifica justo en las fronteras. Y sabes por qué su prueba no salió al importarlo.',
  },
};

export function LabPythonIntermedio(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaCodigo {...props} clase={CLASE} />;
}

export default LabPythonIntermedio;
