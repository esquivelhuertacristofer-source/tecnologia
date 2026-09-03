'use client';

import type { ActivityProps } from '@/types/activity-contract';
import type { Ejecucion, GuionCodigo, PanelCodigoProps } from '@/components/simuladores/codigo/ventana';
import { repr } from '@/components/simuladores/codigo/valores';
import { SalaCodigo, type ClaseCodigo } from '../../python/SalaCodigo';

/**
 * N8 · U «Programación en texto II» (n8-python-2) · parada 1 de 4 — «Listas y
 * diccionarios» (documento pedagógico: pendiente de escribirse aparte; esta
 * clase se construyó directamente sobre el temario de `curriculo.ts`).
 *
 * **2.º de secundaria, 13–14 años**, comprobado en `curriculo.ts` (línea 795:
 * `n: 8, etapa: 'secundaria', grado: '2° de Secundaria', edad: '13–14'`). Es
 * la continuación directa de N7 · U2 «Programación en texto I», cuya última
 * parada construida es `n7-bucles-python`: da por sabido `for`/`while`,
 * `if`/`elif`/`else` y que un error se lee, no se tapa — y no repite nada de
 * eso desde cero.
 *
 * ── El arco: una lista, un error de verdad, un diccionario ─────────────────
 *
 * Cinco encargos con una lista (`mochila`): crearla, indexar con positivos y
 * con negativos, `append()`, una rebanada y un `for` que la recorre entera.
 * Luego el clímax, en la misma posición que el bucle infinito de
 * `n7-bucles-python` (encargos 6–7): un `IndexError` **provocado a
 * propósito** pidiendo `mochila[10]` a una lista de cuatro elementos, leído
 * con calma y corregido con `len(mochila) - 1`. Cierra con tres encargos de
 * diccionario (`alumno`): crearlo y leer por clave, recorrerlo con
 * `.items()` y comprobar una clave con `in` — el último, a propósito, deja
 * escrito en el `aprendido` el nombre `KeyError` sin provocarlo de verdad:
 * ya se vivió un error real con `IndexError`, y `in` existe precisamente
 * para no tener que provocar el segundo.
 *
 * ── Por qué la referencia (`b = a` apunta, no copia) NO es un encargo aquí
 *
 * `valores.ts` señala esa decisión de modelo como «contenido de
 * `n8-listas-y-diccionarios`, no un defecto» (su comentario (3)). Es cierto,
 * y por eso vive en esta clase — pero como una ficha de la entrada
 * (`EntradaListasYDiccionarios.tsx`), no como un encargo de código: se
 * entiende leyéndola, no hace falta ejecutarla para que quede clara, y
 * meterla como encargo once se salía del rango de 8–10 que pide el canon sin
 * apretar el resto. La ficha además ata cabos con el encargo 4 de esta
 * clase: una rebanada sí copia (`Array.prototype.slice` de por medio, en
 * `rebanar` de `valores.ts`), así que `mochila[1:3]` y `mochila[:]` son la
 * forma correcta de copiar de verdad — comprobado leyendo `sintaxis.ts`
 * (`sufijos()`, línea 647 y 652: los dos extremos de una rebanada se pueden
 * omitir) antes de escribirlo en la ficha, no adivinado.
 *
 * ── Por qué el `for` con dos variables (`for clave, valor in alumno.items()`)
 *    no necesitaba una nota aparte
 *
 * `compilar.ts` (caso `'para'`, línea 282) ya compila un `for` con más de una
 * variable emitiendo `OP.DESEMPAQUETA`, y `metodoDeDicc` (`maquina.ts`, caso
 * `'items'`) devuelve una lista de tuplas de verdad — la desviación (2) de
 * `subconjunto.ts`. El encargo 9 sólo usa lo que el intérprete ya sabía
 * hacer desde antes de que existiera esta clase.
 */

/* ─────────────────────────────── el archivo ──────────────────────────────── */

const ARCHIVO = 'mochila.py';

const PLANTILLA = [
  '# mochila.py · muchos datos, una sola caja',
  'print("Vamos a guardar varias cosas juntas, sin usar una variable por cada una.")',
  '',
  '# ↓ de aquí para abajo escribes tú',
  '',
].join('\n');

const CANDADOS = [1, 2, 3, 4];

/* ───────────────────────── lectores del programa ─────────────────────────── */

/**
 * ¿Aparecen estos textos en `salida`, en este mismo orden? Copiado tal cual
 * de `LabBucles.tsx`: cada búsqueda empieza donde terminó la anterior, así
 * que no basta con que los cuatro elementos de la mochila existan en algún
 * lado de la salida — tienen que salir en el orden en que el `for` los visita.
 */
function ordenados(e: Ejecucion, ...textos: string[]): boolean {
  let desde = 0;
  for (const t of textos) {
    const i = e.salida.indexOf(t, desde);
    if (i === -1) return false;
    desde = i + 1;
  }
  return true;
}

/* ─────────────────────────────── el guion ────────────────────────────────── */

const GUION: GuionCodigo = {
  pasos: [
    {
      id: 'crea-tu-mochila',
      titulo: 'Tu primera lista',
      instruccion:
        "Debajo, crea una lista con tres cosas:  mochila = ['cuaderno', 'lápiz', 'regla']  ·  imprime la primera con  print(mochila[0])  ·  y cuántas hay en total con  print(len(mochila))",
      pista:
        'Las posiciones de una lista empiezan en 0, no en 1: mochila[0] es «cuaderno», el primero que escribiste. len(mochila) las cuenta sin que tú las cuentes a mano.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /mochila\s*=\s*\[\s*'cuaderno'\s*,\s*'lápiz'\s*,\s*'regla'\s*\]/.test(fuente) &&
          /mochila\[\s*0\s*\]/.test(fuente) &&
          /len\(\s*mochila\s*\)/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('cuaderno') &&
          e.salida.includes('3'),
      },
      aprendido:
        'Una lista guarda varios datos en una sola caja, en el orden en que los escribiste. mochila[0] no es «la primera posición porque empieza en 1»: en Python la cuenta arranca en 0, así que mochila[0] es el primer elemento.',
    },
    {
      id: 'desde-el-final',
      titulo: 'Contar desde el final',
      instruccion: 'Debajo, imprime el último elemento sin saber cuántos hay:  print(mochila[-1])',
      pista:
        'mochila[-1] no es un error ni «menos uno»: en Python el índice negativo cuenta desde el final. -1 es el último, -2 sería el penúltimo.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /mochila\[\s*-1\s*\]/.test(fuente) && e.fase === 'terminada' && e.error === null && e.salida.includes('regla'),
      },
      aprendido:
        'mochila[-1] cuenta desde el final: -1 es el último elemento, sin necesidad de saber cuántos hay en total. Es la forma que usa cualquier programa que no conoce de antemano el tamaño de la lista.',
    },
    {
      id: 'agrega-algo',
      titulo: 'Agrega algo a la mochila',
      instruccion:
        "Debajo, agrega un elemento nuevo con  mochila.append('sacapuntas')  ·  y luego imprime la lista completa con  print(mochila)  para ver que sí se agregó.",
      pista:
        'append() no crea una lista nueva: agrega el elemento AL FINAL de la misma mochila. Por eso no se escribe mochila = mochila.append(...) — eso borraría tu lista.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /mochila\.append\(\s*'sacapuntas'\s*\)/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.some((l) => l.includes('sacapuntas') && l.includes('cuaderno')),
      },
      aprendido:
        'append() agrega un elemento al final de la MISMA lista, sin crear una lista nueva ni borrar lo que ya había. Es la forma de ir guardando datos uno por uno mientras el programa corre.',
    },
    {
      id: 'solo-una-parte',
      titulo: 'Sólo un pedazo de la lista',
      instruccion:
        'Debajo, guarda sólo una parte de la mochila con  utiles = mochila[1:3]  ·  e imprímela con  print(utiles)',
      pista:
        'mochila[1:3] es una rebanada (slice): empieza en la posición 1 y se detiene ANTES de la 3, así que trae las posiciones 1 y 2 — dos elementos, no tres.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /utiles\s*=\s*mochila\[\s*1\s*:\s*3\s*\]/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.some((l) => l.includes('lápiz') && l.includes('regla') && !l.includes('cuaderno') && !l.includes('sacapuntas')),
      },
      aprendido:
        'mochila[1:3] es una REBANADA: trae las posiciones 1 y 2, y se detiene antes de llegar a la 3 — el mismo comportamiento que range(1, 6) con los bucles. Rebanar no cambia mochila: utiles es una lista nueva y aparte.',
    },
    {
      id: 'recorrela-toda',
      titulo: 'Recórrela toda',
      instruccion:
        'Debajo, recorre la mochila completa e imprime cada cosa, una por línea:  for cosa in mochila:  y con sangría,  print(cosa)',
      pista:
        'for cosa in mochila: no necesita saber cuántos elementos hay ni sus posiciones: en cada vuelta, cosa vale un elemento distinto, en el mismo orden en que están guardados.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /for\s+cosa\s+in\s+mochila\s*:/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          ordenados(e, 'cuaderno', 'lápiz', 'regla', 'sacapuntas'),
      },
      aprendido:
        'for cosa in mochila: recorre la lista completa sin usar índices ni len(): en cada vuelta cosa toma el valor de un elemento distinto. Es la forma más común de leer una lista entera, sin importar cuántos elementos tenga.',
    },
    {
      id: 'provocalo-fuera-de-la-mochila',
      titulo: 'Provócalo: la posición que no existe',
      instruccion:
        'Debajo, escribe  print(mochila[10])  y ejecuta. La mochila sólo tiene 4 cosas: lee con calma el error que aparece — el editor te dice exactamente cuántas posiciones hay.',
      pista:
        'No es un error del editor: es tu programa pidiendo una posición que no existe. Lee el mensaje completo: dice cuántos elementos tiene la lista y entre qué números van las posiciones válidas.',
      logro: { tipo: 'ejecucion', comprueba: (e) => e.fase === 'error' && e.error?.clase === 'indice' },
      aprendido:
        'mochila[10] provocó un IndexError: pediste una posición que la lista no tiene. En Python de verdad se llama exactamente así, y es de los errores más comunes al trabajar con listas — no significa que tu programa esté mal escrito, significa que esa posición no existe todavía.',
    },
    {
      id: 'arreglalo',
      titulo: 'Arréglalo',
      instruccion:
        'Cambia esa línea por  print(mochila[len(mochila) - 1])  — así siempre pides una posición válida, sin importar cuántas cosas tenga la mochila. Ejecuta.',
      pista:
        'len(mochila) - 1 es SIEMPRE la última posición válida: si hay 4 elementos, las posiciones van de 0 a 3, y len(mochila) - 1 da exactamente 3.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /mochila\[\s*len\(\s*mochila\s*\)\s*-\s*1\s*\]/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('sacapuntas'),
      },
      aprendido:
        'len(mochila) - 1 da siempre la última posición que sí existe, cambie o no el tamaño de la lista. Ya conocías otra forma de pedir el último elemento (mochila[-1], del encargo 2) — las dos funcionan, y ahora sabes por qué mochila[10] no.',
    },
    {
      id: 'la-ficha-del-alumno',
      titulo: 'La ficha del alumno',
      instruccion:
        "Debajo, crea un diccionario con dos datos:  alumno = {'nombre': 'Ana', 'grado': 8}  ·  y pide uno de ellos por su clave:  print(alumno['nombre'])",
      pista:
        "Un diccionario no tiene posiciones 0, 1, 2: tiene CLAVES. alumno['nombre'] no pide «la posición nombre», pide el valor guardado bajo la clave 'nombre'.",
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /alumno\s*=\s*\{\s*'nombre'\s*:\s*'Ana'\s*,\s*'grado'\s*:\s*8\s*\}/.test(fuente) &&
          /alumno\[\s*'nombre'\s*\]/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Ana'),
      },
      aprendido:
        "Un diccionario (dict) guarda datos en pares clave: valor, no en posiciones numeradas. alumno['nombre'] busca por la CLAVE 'nombre' — así el dato se pide por lo que significa, no por dónde quedó guardado.",
    },
    {
      id: 'recorrela-con-items',
      titulo: 'Todos los datos, uno por uno',
      instruccion:
        'Debajo, recorre el diccionario completo con  for clave, valor in alumno.items():  y con sangría,  print(clave, valor)',
      pista:
        '.items() da cada par del diccionario ya separado en clave y valor, listo para dos variables a la vez — igual que a, b = b, a llena dos cajas en una sola línea.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /for\s+clave\s*,\s*valor\s+in\s+alumno\.items\(\s*\)\s*:/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('nombre Ana') &&
          e.salida.includes('grado 8'),
      },
      aprendido:
        '.items() recorre el diccionario entero entregando cada par ya separado: clave se llena con «nombre» y luego con «grado», y valor con lo que le corresponde a cada una. Es la forma de leer un diccionario completo sin escribir alumno[\'nombre\'] y alumno[\'grado\'] a mano.',
    },
    {
      id: 'esta-la-clave',
      titulo: '¿Existe esa clave?',
      instruccion:
        "Última pregunta con código: comprueba si el diccionario tiene guardado un teléfono, sin arriesgarte a un error.  if 'telefono' in alumno:  ·  print('Sí tiene teléfono guardado.')  ·  else:  ·  print('No hay teléfono guardado.')",
      pista:
        "in en un diccionario pregunta por CLAVES, no por valores: 'telefono' in alumno es False porque esa clave nunca se guardó — y preguntar así nunca truena, a diferencia de pedir alumno['telefono'] directo.",
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /if\s+'telefono'\s+in\s+alumno\s*:/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('No hay teléfono guardado.') &&
          !e.salida.includes('Sí tiene teléfono guardado.'),
      },
      aprendido:
        "in comprueba si una CLAVE existe en el diccionario, antes de arriesgarte a pedirla. alumno['telefono'] a secas hubiera provocado un KeyError —el mismo apellido que IndexError, pero para diccionarios—: preguntar primero con in evita provocarlo, sin tapar nada.",
    },
  ],
  cierre:
    'Ya sabes guardar muchos datos en una lista y en un diccionario, indexar con positivos y con negativos, agregar con append(), recortar con una rebanada, recorrer las dos estructuras, y sobreviviste —y corregiste— un IndexError de verdad.',
};

/* ───────────────────────── el panel de esta clase ────────────────────────── */

/**
 * «La Mochila» — cada casilla de la lista, con su número de posición.
 *
 * No sustituye al panel de variables del armazón: ahí ya se ve el texto
 * completo de `mochila` de un vistazo. Lo que este panel añade es lo que el
 * clímax de la clase necesita para leerse solo — **qué número de posición
 * tiene cada casilla**, para que al llegar el encargo 6 el alumno pueda mirar
 * aquí y ver con los ojos que la posición 10 sencillamente no existe.
 */
function PanelMochila({ ejecucion }: PanelCodigoProps) {
  const mochila = ejecucion.variables.find((v) => v.nombre === 'mochila' && v.valor.t === 'lista');

  if (!mochila || mochila.valor.t !== 'lista') {
    return (
      <p className="pyc-vacio">
        En cuanto crees la variable mochila, aquí vas a ver cada casilla con su número de posición.
      </p>
    );
  }

  const casillas = mochila.valor.v;
  const fueraDeRango = ejecucion.fase === 'error' && ejecucion.error?.clase === 'indice';

  return (
    <div data-testid="pyc-mochila">
      <ul className="pyc-filas">
        {casillas.map((valor, i) => (
          <li key={i}>
            <span className="pyc-fila">
              <span className="pyc-fila-textos">
                <span className="pyc-fila-nombre">mochila[{i}]</span>
                <span className="pyc-fila-detalle">{repr(valor)}</span>
              </span>
            </span>
          </li>
        ))}
      </ul>
      {fueraDeRango ? (
        <p className="pyc-nota">
          Ese índice no tiene casilla: las posiciones que sí existen van de 0 a {casillas.length - 1}.
        </p>
      ) : (
        <p className="pyc-nota">
          Las posiciones van de 0 a {casillas.length - 1}. La -1 es la última, contando desde el final.
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────── la clase ────────────────────────────────── */

const CLASE: ClaseCodigo = {
  actividadId: 'n8-listas-y-diccionarios',
  titulo: 'Listas y diccionarios',
  archivo: ARCHIVO,
  insignia: { nombre: 'Ordenaste tu mochila', emoji: '🎒' },
  minutos: 30,
  portada: {
    situacion: 'Nivel 8 · Programación en texto II · Parada 1 de 4',
    tema: 'Listas y diccionarios: muchos datos, una sola caja',
    objetivo:
      'Vas a guardar varios datos juntos en una sola caja: una lista para organizar tu mochila y un diccionario para los datos de un alumno. Vas a indexar, agregar, recortar y recorrer las dos estructuras — y vas a provocar un IndexError de verdad para aprender a leerlo.',
    vasAHacer: [
      'Crear una lista y leerla por posición, incluyendo posiciones negativas.',
      'Agregar un elemento con append() y recortar un pedazo con una rebanada.',
      'Recorrer una lista entera con for, sin usar índices.',
      'Crear un diccionario, leerlo por clave, recorrerlo con .items() y provocar —y corregir— un IndexError de verdad.',
    ],
  },
  plantilla: PLANTILLA,
  soloLectura: CANDADOS,
  guion: GUION,
  panelFijo: { titulo: 'La Mochila', Cuerpo: PanelMochila },
  bit: {
    inicio:
      'Hasta ahora cada dato vivía en su propia variable. Hoy vas a guardar varios juntos, en una sola caja: una lista para las cosas de tu mochila, y un diccionario para los datos de un alumno.',
    cierre:
      'Ya sabes guardar muchos datos en una sola caja, de dos formas distintas: una lista ordenada por posición y un diccionario ordenado por clave. Y sobreviviste a un IndexError de verdad — leyéndolo, no adivinando qué pasó.',
  },
  final: {
    titulo: 'Ordenaste tu mochila',
    detalle:
      'Guardaste varios datos en una lista y los indexaste con positivos y con negativos, agregaste con append() y recortaste con una rebanada, recorriste una lista entera con for, y armaste un diccionario con sus propias claves. Y en medio de todo eso, un IndexError de verdad — provocado a propósito, leído con calma y corregido.',
  },
};

export function LabListasYDiccionarios(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaCodigo {...props} clase={CLASE} />;
}

export default LabListasYDiccionarios;
