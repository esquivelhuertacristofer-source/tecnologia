/**
 * Tecnia Código · `errores.ts` — los errores son material de clase.
 *
 * La mitad del valor de este armazón está aquí. Un intérprete que dice
 * `NameError: name 'contdor' is not defined` en la consola de un chico de
 * segundo de secundaria no ha dicho nada: ha dicho «te equivocaste» en inglés.
 *
 * Cada error de este archivo lleva **tres cosas y las tres son obligatorias**:
 *
 *   1. el **qué**, en español y sin jerga — «no existe ninguna variable llamada
 *      «contdor»»;
 *   2. la **línea**, porque un error sin línea manda al alumno a leerse el
 *      programa entero;
 *   3. la **pista**, que es lo que suele causarlo — «¿la escribiste distinto
 *      arriba? Python distingue mayúsculas de minúsculas».
 *
 * El nombre inglés (`NameError`, `ZeroDivisionError`) **también se enseña**, en
 * `familia`, porque el alumno lo va a ver el día que abra Python de verdad y hay
 * que haberlo visto antes. Se enseña de segundo, no de primero.
 *
 * Regla de la casa, copiada del §45.5: **nada de este intérprete lanza a través
 * de la puerta pública**. Por dentro sí se usa `Tropiezo` para salir de la
 * recursión —igual que `Fallo` en `formula/sintaxis.ts`—, pero todas las
 * funciones exportadas del paquete devuelven el error como dato.
 */

export type ClaseError =
  | 'sintaxis'
  | 'sangria'
  | 'nombre'
  | 'tipo'
  | 'valor'
  | 'indice'
  | 'clave'
  | 'atributo'
  | 'division'
  | 'recursion'
  | 'limite'
  /* M4 (§69.21): los que trae tener archivos y módulos. */
  | 'archivo'
  | 'modulo'
  | 'importacion'
  | 'estadistica'
  | 'operacion';

/** El nombre que ese mismo error tiene en Python, para que no suene a chino. */
const FAMILIA: Readonly<Record<ClaseError, string>> = {
  sintaxis: 'SyntaxError',
  sangria: 'IndentationError',
  nombre: 'NameError',
  tipo: 'TypeError',
  valor: 'ValueError',
  indice: 'IndexError',
  clave: 'KeyError',
  atributo: 'AttributeError',
  division: 'ZeroDivisionError',
  recursion: 'RecursionError',
  limite: 'LimiteError',
  archivo: 'FileNotFoundError',
  modulo: 'ModuleNotFoundError',
  importacion: 'ImportError',
  estadistica: 'StatisticsError',
  operacion: 'UnsupportedOperation',
};

export interface ErrorPy {
  clase: ClaseError;
  /** En español, en minúscula y sin punto final: se compone con «Línea 4: ». */
  mensaje: string;
  /** 1 en adelante. `0` sólo si el error no es de ninguna línea en concreto. */
  linea: number;
  /** 1 en adelante, para el dedo debajo. `null` si no se sabe. */
  columna: number | null;
  /** Qué suele causarlo. Obligatoria salvo que de verdad no haya nada que decir. */
  pista: string | null;
  /** `NameError`, `TypeError`… el nombre que verá el día que abra Python. */
  familia: string;
  /**
   * En qué archivo está `linea`, cuando no es el que se ejecutó: un error dentro
   * de `clima.py` importado desde `estacion.py` (§69.21). Sin esto la ventana
   * señalaba la línea 4 del archivo equivocado. Ausente o `null`: el que corrió.
   */
  archivo?: string | null;
}

/** La única excepción del paquete, y no cruza la puerta. */
export class Tropiezo extends Error {
  constructor(readonly detalle: ErrorPy) {
    super(detalle.mensaje);
    this.name = 'Tropiezo';
  }
}

export function fallo(
  clase: ClaseError,
  mensaje: string,
  extra?: { linea?: number; columna?: number | null; pista?: string },
): Tropiezo {
  return new Tropiezo({
    clase,
    mensaje,
    linea: extra?.linea ?? 0,
    columna: extra?.columna ?? null,
    pista: extra?.pista ?? null,
    familia: FAMILIA[clase],
  });
}

/**
 * El error como se lee en la consola del alumno.
 *
 * Con las líneas del programa delante pinta también la línea culpable y el dedo
 * debajo, que es lo que hace que el número de línea deje de ser un número.
 *
 *     Línea 3 · no se puede dividir entre cero
 *         media = total / cantidad
 *                       ^
 *         Pista: «cantidad» vale 0. Comprueba con un «if» que no sea cero.
 *         (en Python de verdad esto se llama ZeroDivisionError)
 */
export function textoDeError(e: ErrorPy, fuente?: string): string {
  const partes: string[] = [];
  const donde = e.archivo ? `${e.archivo} · ` : '';
  partes.push(e.linea > 0 ? `${donde}Línea ${e.linea} · ${e.mensaje}` : `${donde}${e.mensaje}`);

  /* La fuente que llega es la del archivo que corrió: con un error de otro
   * archivo, pintar su línea pintaría otra cosa. */
  if (fuente && e.linea > 0 && !e.archivo) {
    const linea = fuente.replace(/\r\n?/g, '\n').split('\n')[e.linea - 1];
    if (linea !== undefined && linea.trim() !== '') {
      partes.push(`    ${linea.replace(/\t/g, '    ')}`);
      if (e.columna !== null && e.columna > 0) {
        /* Cada tabulador de delante ocupa cuatro al pintarlo, o el dedo señala
         * a otro sitio justo en los programas con tabuladores, que son los que
         * más ayuda necesitan. */
        const desplazamiento = linea.slice(0, e.columna - 1).replace(/\t/g, '    ').length;
        partes.push(`    ${' '.repeat(desplazamiento)}^`);
      }
    }
  }

  if (e.pista) partes.push(`    Pista: ${e.pista}`);
  partes.push(`    (en Python de verdad esto se llama ${e.familia})`);
  return partes.join('\n');
}
