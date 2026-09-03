'use client';

import type { ActivityProps } from '@/types/activity-contract';
import type { Ejecucion, GuionCodigo, PanelCodigoProps } from '@/components/simuladores/codigo/ventana';
import { SalaCodigo, type ClaseCodigo } from '../../python/SalaCodigo';

/**
 * N8 · U «Programación en texto II» (`n8-python-2`) · parada 2 — «Funciones»
 * (currículo: `src/data/curriculo.ts` línea 809, `estado: 'planeada'` hasta hoy).
 *
 * **2.º de secundaria, 13–14 años** (`curriculo.ts` línea 795). Viene de
 * `n8-listas-y-diccionarios` (parada 1, en construcción en paralelo por otro
 * proceso mientras se escribe esta clase) y de toda la unidad N7·U2, así que
 * el alumno ya sabe `if`, `for`, `while`, tipos, `input`/`print` y ha
 * sobrevivido a un bucle infinito de verdad. Lo que no sabe es empaquetar
 * código en una pieza con nombre que se pueda llamar más de una vez — eso es
 * esta clase.
 *
 * ── El arco: definir → parámetros → return ≠ print → el atajo que no existe
 *    → dos errores reales ─────────────────────────────────────────────────────
 *
 * `def` sin parámetros → un parámetro → dos parámetros combinados → `return`
 * de verdad (guardar y usar lo que devuelve) → la trampa de `None` (una
 * función que sólo `print`-ea no devuelve nada) → el valor por defecto de
 * Python real, provocado y luego resuelto sin él → romper con el número de
 * argumentos equivocado (`TypeError`) → romper con una variable local leída
 * fuera de su función (`NameError`, alcance) → una pregunta de cierre.
 *
 * Diez encargos, no nueve como `LabBucles`: la clase pide cinco conceptos
 * (`def`, parámetros, `return` vs `print`, valor por defecto, el error
 * deliberado) y dos de ellos —el valor por defecto y el error deliberado—
 * necesitan su propio par provócalo/arréglalo para no mentir sobre lo que el
 * intérprete hace de verdad (ver el apartado siguiente). Sigue estando «del
 * mismo calibre»: cada encargo es un paso nuevo, no relleno.
 *
 * ── EL HALLAZGO QUE OBLIGÓ A CAMBIAR EL ENCARGO 4 DEL ENCARGO ORIGINAL ──────
 *
 * El encargo pedía enseñar `def saluda(nombre="alumno"):` — un parámetro con
 * valor por defecto, sintaxis real de Python. **Este intérprete no lo admite,
 * y no por un hueco sin cubrir: es una decisión escrita a propósito.**
 * `sintaxis.ts` (método `sentDef`, líneas 413–419) lee el `=` después de un
 * parámetro y lanza un `SyntaxError` con el mensaje exacto «aquí los
 * argumentos no pueden traer un valor por defecto» y la pista «pásalos
 * siempre al llamar a la función». Y no es sólo sintaxis: aunque se pudiera
 * escribir, `llamar()` en `maquina.ts` (línea 673) exige
 * `args.length === quien.params.length` de forma estricta — llamar con menos
 * argumentos que parámetros **siempre** es `TypeError`, con o sin valor por
 * defecto declarado. El atajo no existe ni en la sintaxis ni en la semántica.
 *
 * Construir el encargo como si existiera habría dejado a un alumno de 13 años
 * mirando un error real sin que la clase lo esperara — el defecto exacto que
 * el canon de este proyecto prohíbe (intérprete real, nunca simulado). La
 * solución no es fingir que el atajo existe ni inventar una mecánica nueva:
 * es tratar la ausencia del atajo como lo que es, un hecho real de este
 * subconjunto, con el mismo tratamiento que ya reciben `import`, `class` o
 * `lambda` en `PALABRAS_PROHIBIDAS` (`subconjunto.ts`). Encargos 6 y 7 lo
 * provocan de verdad, leen el error de verdad, y lo resuelven pasando el
 * argumento siempre — que es exactamente lo que la pista del propio
 * intérprete recomienda.
 *
 * ── Por qué el panel propio es «el estante de funciones» y no otra cosa ────
 *
 * Lee el código del alumno buscando líneas `def` de nivel superior y, para
 * cada una, mira si su cuerpo contiene un `return`. Es una lectura de texto,
 * no de ejecución —a propósito: una función puede estar definida sin haberse
 * llamado todavía, y aun así merece aparecer—. Lo que enseña es justo el eje
 * de los encargos 4 y 5: una función con `return` te da un valor; una que
 * sólo tiene `print` te enseña algo en pantalla y de todos modos, al mirar
 * lo que devuelve, es `None`.
 */

/* ─────────────────────────────── el archivo ──────────────────────────────── */

const ARCHIVO = 'funciones.py';

const PLANTILLA = [
  '# funciones.py · piezas de código que puedes reutilizar',
  'print("Vamos a construir herramientas propias con funciones.")',
  '',
  '# ↓ de aquí para abajo escribes tú',
  '',
].join('\n');

const CANDADOS = [1, 2, 3, 4];

/* ───────────────────────── lectores del programa ─────────────────────────── */

/** El valor entero de una variable, o `null` si no existe o no es `int`. */
function valorEntero(e: Ejecucion, nombre: string): number | null {
  const v = e.variables.find((x) => x.nombre === nombre);
  return v && v.valor.t === 'ent' ? v.valor.v : null;
}

/** `true` si la variable existe y su valor es `None` — la trampa del encargo 5. */
function esNone(e: Ejecucion, nombre: string): boolean {
  const v = e.variables.find((x) => x.nombre === nombre);
  return v !== undefined && v.valor.t === 'nada';
}

/* ─────────────────────────────── el guion ────────────────────────────────── */

const GUION: GuionCodigo = {
  pasos: [
    {
      id: 'tu-primera-funcion',
      titulo: 'Tu primera función',
      instruccion:
        'Debajo, escribe dos líneas:  def saluda():  y, con sangría,  print("¡Hola, Tecnia!")  Luego, sin sangría, llama a la función escribiendo  saluda()  Ejecuta.',
      pista:
        'La sangría de la línea de adentro es obligatoria: cuatro espacios o Tab. Definir la función no hace nada por sí sola — hace falta llamarla, con saluda(), para que corra.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /def\s+saluda\s*\(\s*\)\s*:/.test(fuente) &&
          /^[ \t]*saluda\s*\(\s*\)\s*$/m.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('¡Hola, Tecnia!'),
      },
      aprendido:
        'def nombre(): abre una función nueva. Lo que va con sangría debajo es su cuerpo: se ejecuta cada vez que la llamas, ni una vez más.',
    },
    {
      id: 'un-parametro',
      titulo: 'Un parámetro: personaliza el saludo',
      instruccion:
        'Debajo, escribe:  def saluda_a(nombre):  y con sangría  print("Hola,", nombre)  Llama a la función con tu nombre entre comillas, por ejemplo  saluda_a("Valentina")  Ejecuta.',
      pista:
        'nombre es un parámetro: una caja vacía que se llena con lo que le pases entre paréntesis al llamar. Sin las comillas, Python buscaría una variable que no existe.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /def\s+saluda_a\s*\(\s*nombre\s*\)\s*:/.test(fuente) &&
          /saluda_a\s*\(\s*["'][^"']+["']\s*\)/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.some((l) => /^Hola, .+/.test(l)),
      },
      aprendido:
        'Un parámetro deja que la misma función haga algo distinto cada vez, según lo que le pasas. saluda_a("Ana") y saluda_a("Luis") corren el mismo código con datos diferentes.',
    },
    {
      id: 'dos-parametros',
      titulo: 'Dos parámetros: úsalos juntos',
      instruccion:
        'Debajo, escribe:  def area_rectangulo(base, altura):  y con sangría  print("El área es", base * altura)  Llama a la función con  area_rectangulo(4, 5)  y ejecuta.',
      pista:
        'Los dos parámetros van separados por comas, en la definición y también al llamar. base y altura llegan en el mismo orden en que los escribiste.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /def\s+area_rectangulo\s*\(\s*base\s*,\s*altura\s*\)\s*:/.test(fuente) &&
          /base\s*\*\s*altura/.test(fuente) &&
          /area_rectangulo\s*\(\s*4\s*,\s*5\s*\)/.test(fuente) &&
          e.salida.includes('El área es 20'),
      },
      aprendido:
        'Una función puede recibir varios parámetros y combinarlos dentro de su cuerpo. El orden importa: el primer valor que pasas llena el primer parámetro.',
    },
    {
      id: 'return-de-verdad',
      titulo: 'return: que te devuelva algo',
      instruccion:
        'Debajo, escribe:  def doble(numero):  y con sangría  return numero * 2  (sin print). Luego, sin sangría, escribe  resultado = doble(5)  y  print(resultado)  Ejecuta.',
      pista:
        'return no imprime nada: le entrega el valor a quien llamó a la función. Por eso hace falta guardarlo en resultado y ser tú quien lo imprima después, con print.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /def\s+doble\s*\(\s*numero\s*\)\s*:/.test(fuente) &&
          /return\s+numero\s*\*\s*2/.test(fuente) &&
          /resultado\s*=\s*doble\s*\(\s*5\s*\)/.test(fuente) &&
          e.salida.includes('10') &&
          valorEntero(e, 'resultado') === 10,
      },
      aprendido:
        'return saca un valor de la función y lo pone en manos de quien la llamó. resultado = doble(5) guarda ese valor: sin el return, no habría nada que guardar.',
    },
    {
      id: 'la-trampa-del-none',
      titulo: '¿Qué guardó de verdad? La trampa de print()',
      instruccion:
        'Debajo, escribe:  def cuadrado(numero):  y con sangría  print(numero * numero)  — sin return. Luego, sin sangría,  resultado = cuadrado(4)  y  print(resultado)  Ejecuta y mira bien qué imprime la última línea.',
      pista:
        'cuadrado() muestra el resultado en pantalla con print, pero no lo devuelve con return. Lo que «guarda» resultado entonces es None: la forma en que Python dice «aquí no hay nada».',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /def\s+cuadrado\s*\(\s*numero\s*\)\s*:/.test(fuente) &&
          /resultado\s*=\s*cuadrado\s*\(\s*4\s*\)/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('16') &&
          e.salida.includes('None') &&
          esNone(e, 'resultado'),
      },
      aprendido:
        'Una función sin return siempre devuelve None, aunque haya impreso algo en pantalla con print. Imprimir y devolver son dos cosas distintas — y ésta es la confusión más común al empezar con funciones.',
    },
    {
      id: 'provocalo-valor-por-defecto',
      titulo: 'Provócalo: el valor «por defecto» que aquí no existe',
      instruccion:
        'En Python de verdad se puede escribir un valor que se usa si no le pasas nada a la función. Escribe tal cual, debajo:  def saluda_defecto(nombre="alumno"):  y con sangría  print("Hola,", nombre)  Ejecuta y lee el error con calma.',
      pista:
        'Este editor no admite el signo = dentro de los paréntesis de una función. No es un error de sangría ni de comillas: es que aquí ese atajo no existe. Lee lo que dice el error.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /def\s+saluda_defecto\s*\(\s*nombre\s*=/.test(fuente) && e.fase === 'error' && e.error?.clase === 'sintaxis',
      },
      aprendido:
        'Este subconjunto de Python no tiene valores por defecto: cada llamada tiene que traer todos los argumentos, siempre, sin atajos. El error que acabas de leer te lo dice tal cual.',
    },
    {
      id: 'arreglalo-pasalo-siempre',
      titulo: 'Arréglalo: pásalo siempre',
      instruccion:
        'Quita el ="alumno" de los paréntesis: deja  def saluda_defecto(nombre):  Y llama a la función dos veces, sin sangría:  saluda_defecto("Cris")  y  saluda_defecto("alumno")  Ejecuta.',
      pista:
        'Sin el atajo del valor por defecto, tú decides qué mandar en cada llamada — incluida la palabra "alumno" si es la que quieres usar de todos modos.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /def\s+saluda_defecto\s*\(\s*nombre\s*\)\s*:/.test(fuente) &&
          !/saluda_defecto\s*\(\s*nombre\s*=/.test(fuente) &&
          e.fase === 'terminada' &&
          e.error === null &&
          e.salida.includes('Hola, Cris') &&
          e.salida.includes('Hola, alumno'),
      },
      aprendido:
        'Sin valores por defecto, cada llamada es explícita: se ve exactamente qué le estás pasando a la función con sólo leer esa línea. Es más texto, pero nunca hay duda de qué valor se usó.',
    },
    {
      id: 'rompelo-numero-de-argumentos',
      titulo: 'Rómpelo: el número equivocado de argumentos',
      instruccion:
        'Llama a la función area_rectangulo del encargo 3 dándole un solo número:  area_rectangulo(4)  Ejecuta y lee el error con calma.',
      pista:
        'area_rectangulo pide exactamente dos parámetros: base y altura. Python cuenta cuántos definiste y cuántos le diste al llamar — si no coinciden, no adivina el que falta: se detiene.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) => /area_rectangulo\s*\(\s*4\s*\)/.test(fuente) && e.fase === 'error' && e.error?.clase === 'tipo',
      },
      aprendido:
        'area_rectangulo() necesita dos argumentos siempre. Darle uno solo no usa «el que falta por defecto» —eso no existe aquí, como acabas de ver— es un TypeError real, con el nombre de la función y cuántos le diste.',
    },
    {
      id: 'el-alcance',
      titulo: 'El alcance: lo que nace dentro, se queda dentro',
      instruccion:
        'Debajo, escribe:  def calcula_iva(precio):  con sangría  iva = precio * 0.16  y luego  return iva  Llama a la función sin guardar el resultado:  calcula_iva(100)  En la siguiente línea, sin sangría, escribe  print(iva)  y ejecuta.',
      pista:
        'iva nació DENTRO de calcula_iva: es una variable local, y sólo existe mientras esa función está corriendo. Fuera de ella, Python no la conoce — ni siquiera después de haberla llamado.',
      logro: {
        tipo: 'ejecucion',
        comprueba: (e, fuente) =>
          /def\s+calcula_iva\s*\(\s*precio\s*\)\s*:/.test(fuente) &&
          /iva\s*=\s*precio\s*\*\s*0\.16/.test(fuente) &&
          /calcula_iva\s*\(\s*100\s*\)/.test(fuente) &&
          /^[ \t]*print\s*\(\s*iva\s*\)\s*$/m.test(fuente) &&
          e.fase === 'error' &&
          e.error?.clase === 'nombre',
      },
      aprendido:
        'Una variable creada dentro de una función es local a ella: nace y muere ahí. Para sacar un dato de una función se usa return —el encargo 4— y se guarda en una variable de fuera; nunca «se filtra» sola, como acabas de comprobar.',
    },
    {
      id: 'lo-que-ya-sabes',
      titulo: 'Lo que ya sabes de las funciones',
      instruccion:
        'Última pregunta, sin escribir nada: si una variable se crea DENTRO de una función y nunca sale con return, ¿qué pasa si intentas usarla fuera, después de llamar a la función?',
      pista: 'Piensa en calcula_iva: ¿qué pasó al intentar imprimir iva fuera de la función?',
      logro: {
        tipo: 'eleccion',
        opciones: [
          'Se puede usar normal: las variables de una función quedan disponibles para todo el programa',
          'Da un NameError: esa variable nunca existió fuera de la función',
          'Vale None automáticamente en el resto del programa',
        ],
        correcta: 1,
      },
      aprendido:
        'Da NameError. Una variable local muere cuando termina la función: para sacar algo de ahí, la única puerta es return.',
    },
  ],
  cierre:
    'Ya escribes funciones con def, les pasas parámetros, usas return para traerte un dato de vuelta —y no confundirlo con print—, y sabes leer un TypeError de argumentos y un NameError de alcance como lo que son: parte del oficio, no un programa roto.',
};

/* ───────────────────────── el panel de esta clase ────────────────────────── */

interface FuncionEnFuente {
  nombre: string;
  params: string[];
  devuelve: boolean;
  linea: number;
}

const DEF_LINEA = /^def\s+([A-Za-z_][A-Za-z_0-9]*)\s*\(([^)]*)\)\s*:\s*$/;

/**
 * Lee el texto buscando `def` de nivel superior y, para cada una, si su
 * cuerpo trae un `return`. Es una lectura de texto y no de ejecución a
 * propósito: una función merece aparecer en el estante en cuanto está
 * definida, se haya llamado o no todavía.
 */
function funcionesDefinidas(fuente: string): FuncionEnFuente[] {
  const lineas = fuente.split('\n');
  const salida: FuncionEnFuente[] = [];
  for (let i = 0; i < lineas.length; i += 1) {
    const m = DEF_LINEA.exec(lineas[i]);
    if (!m) continue;
    const params = m[2].trim() === '' ? [] : m[2].split(',').map((p) => p.trim());
    let devuelve = false;
    for (let j = i + 1; j < lineas.length; j += 1) {
      const linea = lineas[j];
      if (linea.trim() === '') continue;
      if (!/^[ \t]/.test(linea)) break;
      if (/^\s*return\b/.test(linea)) devuelve = true;
    }
    salida.push({ nombre: m[1], params, devuelve, linea: i + 1 });
  }
  return salida;
}

function PanelFunciones({ texto, senalarLinea }: PanelCodigoProps) {
  const funciones = funcionesDefinidas(texto);

  if (funciones.length === 0) {
    return (
      <p className="pyc-vacio">
        Todavía no has definido ninguna función. En cuanto escribas una línea con <b>def</b>, va a aparecer aquí.
      </p>
    );
  }

  return (
    <>
      <ul className="pyc-filas" data-testid="pyc-funciones">
        {funciones.map((f) => (
          <li key={`${f.nombre}-${f.linea}`}>
            <button type="button" className="pyc-fila" onClick={() => senalarLinea(f.linea)}>
              <span className="pyc-fila-textos">
                <span className="pyc-fila-nombre">
                  {f.nombre}({f.params.join(', ')})
                </span>
                <span className="pyc-fila-detalle">
                  {f.devuelve ? 'Tiene return: te entrega un valor' : 'Sólo imprime: no te devuelve nada (None)'}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="pyc-nota">
        Una función con <b>return</b> te da un valor que puedes guardar. Una que sólo tiene <b>print</b> muestra algo
        en pantalla, pero lo que «devuelve» es <b>None</b>.
      </p>
    </>
  );
}

/* ─────────────────────────────── la clase ────────────────────────────────── */

const CLASE: ClaseCodigo = {
  actividadId: 'n8-funciones-python',
  titulo: 'Funciones',
  archivo: ARCHIVO,
  insignia: { nombre: 'Tu caja de herramientas', emoji: '🧰' },
  minutos: 30,
  portada: {
    situacion: 'Nivel 8 · Programación en texto II · Parada 2 de 4',
    tema: 'Funciones: escribe tu propia herramienta',
    objetivo:
      'Vas a escribir funciones con def, pasarles parámetros, y a distinguir return de print — la diferencia entre una función que te ENTREGA un dato y una que sólo lo enseña en pantalla. También vas a ver, de verdad, los dos errores que más se equivocan al programar con funciones.',
    vasAHacer: [
      'Definir una función con def y llamarla las veces que quieras.',
      'Pasarle parámetros para que haga algo distinto cada vez.',
      'Usar return para que te devuelva un dato, y descubrir la trampa de confundirlo con print.',
      'Provocar a propósito un TypeError y un NameError de funciones, y entender los dos.',
    ],
  },
  plantilla: PLANTILLA,
  soloLectura: CANDADOS,
  guion: GUION,
  panelFijo: { titulo: 'El estante de funciones', Cuerpo: PanelFunciones },
  bit: {
    inicio:
      'Hasta ahora escribías el programa entero de arriba abajo, cada vez. Hoy aprendes a empaquetar un pedazo de código en una función, para no volver a escribirlo — sólo llamarla.',
    cierre:
      'Escribiste funciones con parámetros, usaste return para traerte un dato de vuelta, y sobreviviste a dos errores reales de función. Eso es tener piezas propias que puedes usar en cualquier programa.',
  },
  final: {
    titulo: 'Tu caja de herramientas',
    detalle:
      'Escribiste funciones con def, les pasaste parámetros para que hicieran algo distinto cada vez, usaste return para traerte un valor de vuelta sin confundirlo con print, y sobreviviste —a propósito— a un TypeError de argumentos y a un NameError de alcance. Eso es tener piezas de código propias, listas para usarse en cualquier programa que escribas después.',
  },
};

export function LabFunciones(props: ActivityProps & { alSalir?: () => void }) {
  return <SalaCodigo {...props} clase={CLASE} />;
}

export default LabFunciones;
