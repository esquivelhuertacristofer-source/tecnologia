'use client';

import type { ActivityProps } from '@/types/activity-contract';
import type { GuionCodigo, PasoCodigo } from '@/components/simuladores/codigo/ventana';
import { aceptado, crearPanelJuez } from '@/components/simuladores/juez';
import { SalaCodigo, type ClaseCodigo } from '../python/SalaCodigo';
import { PROBLEMAS_DATOS } from './problemasDatos';

/**
 * N9 · U «Algoritmos y datos» (`n9-algoritmos-y-datos`) · parada 3 de 3 —
 * «Proyectos de datos con Python». Cierra la unidad. **3.º de secundaria,
 * 14–15 años.**
 *
 * Documento maestro §68.3. Reescrita el 12-sep-2026, sobre el juez.
 *
 * ── Qué era y por qué se reescribió ─────────────────────────────────────────
 *
 * Nueve encargos cuya instrucción era el programa entero («escribe
 * `validos = []` · `for alumno in calificaciones:` · …») y cuyos predicados
 * exigían esas líneas con expresiones regulares **y además los textos de cada
 * `print`** con `fuente.includes(...)`: cambiar la etiqueta de un mensaje
 * suspendía. El encargo 2 pedía escribir una suma que revienta, y la pista del
 * reporte final ya decía qué rama del `else` iba a salir.
 *
 * Lo bueno se conserva: el orden limpiar → filtrar → agregar → concluir, el
 * registro con `None` que revienta de verdad, y que `max()` da el número pero
 * no el nombre.
 *
 * ── Qué es ahora ────────────────────────────────────────────────────────────
 *
 * Seis problemas con juez sobre la app de calificaciones del grupo
 * (`problemasDatos.ts`). Los seis reciben registros en los que la calificación
 * puede ser `None`, y **el centro de la clase es que un dato que falta no es un
 * cero**: preguntar `if calificacion:` trata igual al que entregó en blanco y
 * al que no entregó, no revienta y da un número que parece bueno. Hay un cero
 * oculto en cinco de los seis problemas. Diecinueve casos ocultos de treinta y
 * uno, medidos con CPython 3.14.
 *
 * `sum()`, `max()` y `min()` están permitidos. Ninguno resuelve un problema
 * solo, y eso lo decide la forma del dato, no una prohibición.
 *
 * ── La plantilla ────────────────────────────────────────────────────────────
 *
 * Conserva los ocho registros de la clase vieja, **ya sin candado**: son el
 * dato con el que el alumno prueba sus funciones antes de enviarlas. Lo que
 * imprima por su cuenta queda antes de la marca del juez y no tumba ningún
 * caso. Van en una sola línea por la misma razón de antes: `lexico.ts` no
 * suprime el salto de línea dentro de corchetes.
 *
 * ── El panel ────────────────────────────────────────────────────────────────
 *
 * El tablero del juez (§68). «El Reporte en Vivo» se retiró: leía variables
 * llamadas `validos`, `reprobados` y `promedio`, nombres que dictaba el guion.
 */

/* ─────────────────────────────── el archivo ──────────────────────────────── */

const ARCHIVO = 'reporte_calificaciones.py';

const PLANTILLA = [
  '# reporte_calificaciones.py · la app de calificaciones del grupo',
  '#',
  '# Los seis problemas están en el panel de la derecha, cada uno con su función,',
  '# sus ejemplos y sus casos ocultos. Escribe aquí las seis funciones —conviven',
  '# en este mismo archivo— y envía cada una al juez cuando esté lista.',
  '#',
  '# Estos son los registros del grupo. Úsalos para probar tus funciones con print',
  '# antes de enviarlas: el juez no cuenta lo que imprimas por tu cuenta.',
  'calificaciones = [{"nombre": "Sofía", "calificacion": 8.5}, {"nombre": "Diego", "calificacion": 5.5}, {"nombre": "Valeria", "calificacion": 9.2}, {"nombre": "Emilio", "calificacion": None}, {"nombre": "Camila", "calificacion": 6.0}, {"nombre": "Mateo", "calificacion": 4.5}, {"nombre": "Renata", "calificacion": 9.8}, {"nombre": "Iker", "calificacion": 7.0}]',
  '',
].join('\n');

/* ─────────────────────────────── el panel ────────────────────────────────── */

const PanelReporte = crearPanelJuez({ problemas: PROBLEMAS_DATOS });

/* ─────────────────────────────── el guion ────────────────────────────────── */

const APRENDIDO: Readonly<Record<string, string>> = {
  'd1-con-calificacion':
    'None quiere decir «no hay dato» y un cero es un dato. Preguntar si un valor «tiene algo» los confunde; compararlo con None, no.',
  'd2-el-promedio':
    'Lo difícil de un promedio no es la suma sino el «entre cuántos». Y un promedio sin datos no es cero: es que no hay promedio.',
  'd3-van-reprobando':
    'Filtrar es juntar en una lista nueva lo que cumple, en su orden. Y cada límite hay que leerlo: sacar justo la mínima es aprobar.',
  'd4-el-mejor':
    'El número más alto no dice de quién es. Recorrer recordando el valor y el nombre a la vez es lo que no se desalinea, y un «estrictamente mayor» decide los empates.',
  'd5-por-nivel':
    'Agrupar es contar en varias cajas a la vez, y cada dato cae en una sola. Las fronteras se cierran por un lado: el 9 ya es sobresaliente.',
  'd6-la-conclusion':
    'Una conclusión se cuenta sobre los que tienen dato. Y un programa de datos se arma con piezas que ya funcionan: tus funciones del 1 y del 3 hicieron la mitad del trabajo.',
};

const PASOS_DE_PROBLEMA: PasoCodigo[] = PROBLEMAS_DATOS.map((p) => ({
  id: p.id,
  titulo: p.titulo,
  instruccion: `${p.enunciado} · La función que va a llamar el juez y sus ejemplos están en el panel de la derecha. Cuando creas que está lista, pulsa «Enviar al juez».`,
  pista: p.pistas[0],
  senal: { control: 'editor' },
  logro: { tipo: 'ejecucion', comprueba: (_e, fuente) => aceptado(p.id, fuente) },
  aprendido: APRENDIDO[p.id],
}));

const GUION: GuionCodigo = {
  pasos: [
    ...PASOS_DE_PROBLEMA,
    {
      id: 'lo-que-dice-el-cero',
      titulo: 'Para cerrar · Lo que dice un cero',
      instruccion:
        'Tu función «promedio» contesta 7.2 con los registros de la plantilla, donde Emilio no ha entregado. Si Emilio hubiera entregado en blanco y sacado cero, contestaría 6.3. ¿Qué te dice esa diferencia?',
      pista:
        'Los otros siete alumnos y sus calificaciones son exactamente los mismos en las dos cuentas. Lo único que cambia es qué significa el registro de Emilio.',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Que la función está mal: con los mismos alumnos, el promedio tendría que salir igual.',
          'Que un dato que falta no es un cero: si la app contara como cero a quien no ha entregado, le bajaría casi un punto al grupo por un trabajo que nadie ha calificado.',
          'Que conviene quitar los ceros antes de promediar, porque bajan el promedio del grupo.',
          'Que round() da resultados distintos según cuántos alumnos haya en la lista.',
        ],
        correcta: 1,
      },
      aprendido:
        'Ése es el trabajo con datos de verdad: antes de calcular, decidir qué significa cada hueco. Un número que parece bueno y está calculado sobre un dato mal entendido es peor que un error, porque nadie lo revisa.',
    },
  ],
  cierre:
    'Seis funciones que usaría una app de calificaciones de verdad, juzgadas con grupos que no elegiste tú: con ceros, con empates, con alumnos que no entregaron y con nadie. Limpiar, filtrar, agregar y concluir, y en cada paso, decidir qué significa el dato que falta.',
};

/* ─────────────────────────────── la clase ────────────────────────────────── */

const CLASE: ClaseCodigo = {
  actividadId: 'n9-datos-con-python',
  titulo: 'Proyectos de datos con Python',
  archivo: ARCHIVO,
  insignia: { nombre: 'El Analista de Datos', emoji: '📊' },
  minutos: 45,
  portada: {
    situacion: 'Nivel 9 · Algoritmos y datos · Parada 3 de 3',
    tema: 'Proyectos de datos con Python: un dato que falta no es un cero',
    objetivo:
      'La app de calificaciones del grupo necesita un reporte: cuántos tienen calificación, el promedio, quién va reprobando, quién sacó la más alta, cuántos hay en cada nivel y una conclusión. En los registros hay alumnos que no han entregado, y alguno que entregó en blanco. Hoy no hay instrucciones que copiar: hay seis problemas con casos ocultos, y tus funciones se prueban con grupos que no has visto.',
    vasAHacer: [
      'Distinguir en tu código a quien no ha entregado de quien sacó cero, y contar a los que tienen calificación.',
      'Calcular un promedio decidiendo entre cuántos se divide, y qué contestar cuando no hay datos.',
      'Filtrar a quién hay que apoyar y encontrar el nombre detrás de la calificación más alta, con empates.',
      'Agrupar al grupo en niveles y cerrar con una conclusión que reutiliza tus propias funciones.',
    ],
  },
  plantilla: PLANTILLA,
  guion: GUION,
  panelFijo: { titulo: 'El juez del reporte', Cuerpo: PanelReporte },
  bit: {
    inicio:
      'La app de calificaciones espera seis funciones. El juez las llama con grupos que no has visto, y en casi todos hay una trampa: alguien que no entregó, o alguien que sacó cero. No son lo mismo.',
    cierre:
      'Cerraste Algoritmos y datos: buscar y ordenar midiendo el trabajo, preguntarle a una base de datos con SQL, y ahora limpiar y resumir datos con tu propio código, sabiendo qué significa cada hueco.',
  },
  final: {
    titulo: 'El Analista de Datos',
    detalle:
      'Escribiste las seis funciones de un reporte de calificaciones contra un juez con diecinueve casos ocultos: contaste, promediaste, filtraste, encontraste al mejor, agrupaste por niveles y concluiste, sin confundir nunca un cero con un dato que falta.',
  },
};

export function LabDatosConPython(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaCodigo {...props} clase={CLASE} />;
}

export { CLASE, GUION, PLANTILLA };

export default LabDatosConPython;
