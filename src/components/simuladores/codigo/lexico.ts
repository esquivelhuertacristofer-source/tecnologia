/**
 * Tecnia Código · `lexico.ts` — de texto a fichas, **y la sangría es una ficha**.
 *
 * Aquí es donde este intérprete se gana el sueldo o lo pierde, porque en Python
 * la sangría no es estilo: **es sintaxis**, y es el primer sitio donde un alumno
 * se rompe la cara. Un tokenizador normal se salta los espacios y sigue; éste
 * los cuenta al empezar cada línea y emite `sangra` y `desangra`, que son fichas
 * de pleno derecho — el equivalente exacto de la llave `{` y la `}` de otros
 * lenguajes. El analizador de `sintaxis.ts` abre y cierra bloques con ellas y no
 * vuelve a mirar un espacio en su vida.
 *
 * ── Las cuatro reglas de la sangría, y por qué cada una ─────────────────────
 *
 * **(A) Nunca se mezclan tabuladores y espacios.** Ni dentro de una línea ni
 * entre líneas del mismo programa. CPython acepta unas mezclas y rechaza otras
 * con una regla —comparar la sangría suponiendo tabulador de 1 y de 8 a la vez—
 * que no sabe recitar ni un profesor. Aquí se para en seco y se dice qué pasa.
 * Es **más estricto** que Python, nunca más laxo, así que un programa que corre
 * aquí corre allá. Y es la avería que más rabia da: se ve igual en pantalla.
 *
 * **(B) Las líneas en blanco y las de sólo comentario no cuentan.** No emiten
 * fichas ni tocan la pila de niveles. Un `# ---` pegado al margen en medio de
 * una función no cierra la función, que es lo que pasaría si contaran.
 *
 * **(C) Dentro de `(`, `[` o `{` la sangría no existe.** Es el «unión implícita
 * de líneas» de Python, y sin ello no se puede escribir una lista larga en
 * varias líneas, que es lo que hace toda clase de datos.
 *
 * **(D) Un `desangra` que no cae en ningún nivel abierto es un error propio**,
 * no un «no se esperaba esto». Es el caso de quien borra un espacio de más al
 * cerrar un `if` dentro de un `for`, y su mensaje lo dice con esas palabras.
 *
 * Como en `formula/lexico.ts`: **este archivo no lanza hacia fuera**. Devuelve
 * `{ok:false, error}` con línea y columna, porque escribir mal es la mitad de la
 * clase y un motor que se rompe al leer no puede enseñar a escribir.
 */

import { type ErrorPy, fallo, Tropiezo } from './errores';

export type TipoFicha =
  | 'numero'
  | 'cadena'
  | 'fcadena'
  | 'nombre'
  | 'palabra'
  | 'op'
  | 'nl'
  | 'sangra'
  | 'desangra'
  | 'fin';

/** Un trozo de f-string: o texto tal cual, o un hueco con código dentro. */
export interface ParteF {
  texto: string | null;
  codigo: string | null;
}

export interface Ficha {
  tipo: TipoFicha;
  /** El texto tal cual venía, para poder señalarlo en los mensajes. */
  texto: string;
  linea: number;
  /** 1 en adelante. */
  col: number;
  numero?: number;
  /** `true` si el número se escribió sin punto ni exponente: es un `int`. */
  entero?: boolean;
  cadena?: string;
  partes?: ParteF[];
}

export type Lectura = { ok: true; fichas: Ficha[] } | { ok: false; error: ErrorPy };

/** Los de dos y tres caracteres van primero o `**=` se lee como `**` y `=`. */
const OPERADORES = [
  '**=',
  '//=',
  '**',
  '//',
  '==',
  '!=',
  '<=',
  '>=',
  '+=',
  '-=',
  '*=',
  '/=',
  '%=',
  '(',
  ')',
  '[',
  ']',
  '{',
  '}',
  ',',
  ':',
  '.',
  '+',
  '-',
  '*',
  '/',
  '%',
  '<',
  '>',
  '=',
];

const ES_LETRA = /[A-Za-z_ÁÉÍÓÚÜÑáéíóúüñ]/;
const ES_NOMBRE = /[A-Za-z0-9_ÁÉÍÓÚÜÑáéíóúüñ]/;
const ES_DIGITO = /[0-9]/;

const PAREJA: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
const NOMBRE_DEL_CIERRE: Record<string, string> = { '(': ')', '[': ']', '{': '}' };

export function leerFichas(fuente: string): Lectura {
  try {
    return { ok: true, fichas: tokenizar(fuente) };
  } catch (e) {
    if (e instanceof Tropiezo) return { ok: false, error: e.detalle };
    throw e;
  }
}

/**
 * Lo mismo, pero **devolviendo las fichas que sí se pudieron leer** antes del
 * tropiezo (añadido el 15-ago-2026 para `VentanaCodigo`).
 *
 * El coloreado del editor se pinta en cada tecla, y **un programa a medio
 * escribir casi siempre está mal**: `x = "ho` no tiene comilla de cierre,
 * `print(` no tiene paréntesis de cierre. Con `leerFichas` a secas, en esos
 * fotogramas —que son la mayoría mientras se teclea— no hay ni una ficha y el
 * editor entero se queda gris de golpe. Con ésta, lo escrito hasta el error
 * conserva su color y sólo pierde el color lo que hay del error para abajo.
 *
 * No hay ninguna lógica nueva: es el mismo `tokenizar`, recogiendo en un array
 * que se ve desde fuera. Sigue habiendo **un solo analizador léxico**, que es
 * la razón de que `leerFichas` saliera por la puerta pública.
 */
export function leerFichasTolerante(fuente: string): { fichas: Ficha[]; error: ErrorPy | null } {
  const fichas: Ficha[] = [];
  try {
    tokenizar(fuente, fichas);
    return { fichas, error: null };
  } catch (e) {
    if (e instanceof Tropiezo) return { fichas, error: e.detalle };
    throw e;
  }
}

function tokenizar(fuente: string, recoge: Ficha[] = []): Ficha[] {
  const lineas = fuente.replace(/\r\n?/g, '\n').split('\n');
  const fichas: Ficha[] = recoge;
  const niveles: number[] = [0];
  const abiertos: { texto: string; linea: number; col: number }[] = [];
  let usaTab = false;
  let usaEspacio = false;

  for (let n = 0; n < lineas.length; n += 1) {
    const texto = lineas[n];
    const linea = n + 1;
    let i = 0;

    if (abiertos.length === 0) {
      /* ── regla (A) y (B): medir la sangría de la línea física ──────────── */
      let tabs = 0;
      let espacios = 0;
      while (i < texto.length && (texto[i] === ' ' || texto[i] === '\t')) {
        if (texto[i] === '\t') tabs += 1;
        else espacios += 1;
        i += 1;
      }
      const resto = texto.slice(i);
      if (resto === '' || resto.startsWith('#')) continue;

      if (tabs > 0 && espacios > 0) {
        throw fallo('sangria', 'esta línea empieza mezclando tabuladores y espacios', {
          linea,
          columna: 1,
          pista: 'elige uno de los dos para todo el programa. Lo normal en Python son 4 espacios por nivel',
        });
      }
      if (tabs > 0) usaTab = true;
      if (espacios > 0) usaEspacio = true;
      if (usaTab && usaEspacio) {
        throw fallo('sangria', 'este programa sangra unas líneas con tabulador y otras con espacios', {
          linea,
          columna: 1,
          pista:
            'en la pantalla se ven igual, y por eso cuesta tanto encontrarlo. ' +
            'Borra la sangría de esta línea y vuelve a ponerla con 4 espacios',
        });
      }

      const nivel = tabs + espacios;
      const cima = niveles[niveles.length - 1];
      if (nivel > cima) {
        niveles.push(nivel);
        fichas.push({ tipo: 'sangra', texto: '', linea, col: nivel + 1 });
      } else if (nivel < cima) {
        while (niveles.length > 1 && niveles[niveles.length - 1] > nivel) {
          niveles.pop();
          fichas.push({ tipo: 'desangra', texto: '', linea, col: nivel + 1 });
        }
        if (niveles[niveles.length - 1] !== nivel) {
          /* ── regla (D) ──────────────────────────────────────────────────── */
          throw fallo('sangria', 'la sangría de esta línea no coincide con ningún bloque de arriba', {
            linea,
            columna: nivel + 1,
            pista: `está a ${nivel} espacio${nivel === 1 ? '' : 's'} del margen, y los bloques abiertos van a ${niveles.join(', ')}`,
          });
        }
      }
    }

    /* ── el resto de la línea, ficha a ficha ─────────────────────────────── */
    while (i < texto.length) {
      const c = texto[i];
      const col = i + 1;

      if (c === ' ' || c === '\t') {
        i += 1;
        continue;
      }
      if (c === '#') break;

      /* f-string: la `f` y las comillas van juntas o es un nombre normal. */
      if ((c === 'f' || c === 'F') && (texto[i + 1] === '"' || texto[i + 1] === "'")) {
        const leida = leerCadena(texto, i + 1, linea);
        fichas.push({
          tipo: 'fcadena',
          texto: texto.slice(i, leida.hasta),
          linea,
          col,
          partes: trocearF(leida.valor, linea, col),
        });
        i = leida.hasta;
        continue;
      }

      if (c === '"' || c === "'") {
        const leida = leerCadena(texto, i, linea);
        fichas.push({ tipo: 'cadena', texto: texto.slice(i, leida.hasta), linea, col, cadena: leida.valor });
        i = leida.hasta;
        continue;
      }

      if (ES_DIGITO.test(c) || (c === '.' && ES_DIGITO.test(texto[i + 1] ?? ''))) {
        const desde = i;
        let entero = true;
        while (i < texto.length && (ES_DIGITO.test(texto[i]) || texto[i] === '_')) i += 1;
        if (texto[i] === '.' && texto[i + 1] !== '.') {
          entero = false;
          i += 1;
          while (i < texto.length && (ES_DIGITO.test(texto[i]) || texto[i] === '_')) i += 1;
        }
        if ((texto[i] === 'e' || texto[i] === 'E') && /[0-9+-]/.test(texto[i + 1] ?? '')) {
          entero = false;
          i += 2;
          while (i < texto.length && ES_DIGITO.test(texto[i])) i += 1;
        }
        const crudo = texto.slice(desde, i);
        const numero = Number(crudo.replace(/_/g, ''));
        if (!Number.isFinite(numero)) {
          throw fallo('sintaxis', `«${crudo}» no es un número que se pueda leer`, { linea, columna: desde + 1 });
        }
        if (ES_LETRA.test(texto[i] ?? '')) {
          throw fallo('sintaxis', `un número no puede llevar letras pegadas: «${crudo}${texto[i]}»`, {
            linea,
            columna: desde + 1,
            pista: 'si querías multiplicar, escribe el signo: 3 * n en vez de 3n',
          });
        }
        fichas.push({ tipo: 'numero', texto: crudo, linea, col, numero, entero });
        continue;
      }

      if (ES_LETRA.test(c)) {
        const desde = i;
        while (i < texto.length && ES_NOMBRE.test(texto[i])) i += 1;
        const palabra = texto.slice(desde, i);
        fichas.push({ tipo: 'nombre', texto: palabra, linea, col });
        continue;
      }

      const op = OPERADORES.find((o) => texto.startsWith(o, i));
      if (op) {
        if (op === '(' || op === '[' || op === '{') abiertos.push({ texto: op, linea, col });
        else if (op === ')' || op === ']' || op === '}') {
          const ultimo = abiertos.pop();
          if (!ultimo) {
            throw fallo('sintaxis', `sobra un «${op}»: no hay ningún «${PAREJA[op]}» esperando a cerrarse`, {
              linea,
              columna: col,
            });
          }
          if (ultimo.texto !== PAREJA[op]) {
            throw fallo(
              'sintaxis',
              `se cierra con «${op}» lo que se abrió con «${ultimo.texto}» en la línea ${ultimo.linea}`,
              { linea, columna: col, pista: `ahí tendría que ir un «${NOMBRE_DEL_CIERRE[ultimo.texto]}»` },
            );
          }
        }
        fichas.push({ tipo: 'op', texto: op, linea, col });
        i += op.length;
        continue;
      }

      if (c === '!') {
        throw fallo('sintaxis', 'el «!» solo no significa nada en Python', {
          linea,
          columna: col,
          pista: '«distinto de» se escribe «!=», y «no» se escribe «not»',
        });
      }
      if (c === '&' || c === '|') {
        throw fallo('sintaxis', `en Python «${c}» no es lo que parece`, {
          linea,
          columna: col,
          pista: 'para juntar dos condiciones se escribe «and» y «or», con letras',
        });
      }
      if (c === '\\') {
        throw fallo('sintaxis', 'aquí una instrucción no se puede partir en dos líneas con «\\»', {
          linea,
          columna: col,
          pista: 'si la línea es muy larga, pártela dentro de unos paréntesis o guarda un trozo en una variable',
        });
      }
      throw fallo('sintaxis', `«${c}» no puede ir aquí`, { linea, columna: col });
    }

    if (abiertos.length === 0 && fichas.length > 0 && fichas[fichas.length - 1].tipo !== 'nl') {
      fichas.push({ tipo: 'nl', texto: '', linea, col: texto.length + 1 });
    }
  }

  if (abiertos.length > 0) {
    const a = abiertos[abiertos.length - 1];
    throw fallo('sintaxis', `falta cerrar el «${a.texto}» que abriste en la línea ${a.linea}`, {
      linea: a.linea,
      columna: a.col,
      pista: `cuenta los «${a.texto}» y los «${NOMBRE_DEL_CIERRE[a.texto]}»: tiene que haber los mismos`,
    });
  }

  const ultimaLinea = lineas.length;
  while (niveles.length > 1) {
    niveles.pop();
    fichas.push({ tipo: 'desangra', texto: '', linea: ultimaLinea, col: 1 });
  }
  fichas.push({ tipo: 'fin', texto: '', linea: ultimaLinea, col: 1 });
  return fichas;
}

/** Lee `"..."` o `'...'` desde la comilla. Devuelve el contenido ya sin escapes. */
function leerCadena(texto: string, i: number, linea: number): { valor: string; hasta: number } {
  const comilla = texto[i];
  const desde = i;
  let valor = '';
  i += 1;
  while (i < texto.length) {
    const c = texto[i];
    if (c === '\\') {
      const sig = texto[i + 1];
      if (sig === 'n') valor += '\n';
      else if (sig === 't') valor += '\t';
      else if (sig === '\\') valor += '\\';
      else if (sig === '"') valor += '"';
      else if (sig === "'") valor += "'";
      else if (sig === undefined) {
        throw fallo('sintaxis', 'falta cerrar las comillas de este texto', { linea, columna: desde + 1 });
      } else valor += sig;
      i += 2;
      continue;
    }
    if (c === comilla) return { valor, hasta: i + 1 };
    valor += c;
    i += 1;
  }
  throw fallo('sintaxis', 'falta cerrar las comillas de este texto', {
    linea,
    columna: desde + 1,
    pista: 'el texto empieza aquí y la línea se acaba sin la comilla de cierre',
  });
}

/**
 * Parte el contenido de una f-string en trozos y huecos.
 *
 * Cuenta paréntesis y corchetes dentro del hueco para que `f"{d['a']}"` y
 * `f"{lista[1:3]}"` no se corten a la primera llave o al primer `:`. El `:` a
 * profundidad cero **es** el formato (`{x:.2f}`), que está fuera del subconjunto
 * y se rechaza con su frase, en vez de leerse como una rebanada rarísima.
 */
function trocearF(cuerpo: string, linea: number, col: number): ParteF[] {
  const partes: ParteF[] = [];
  let texto = '';
  let i = 0;
  while (i < cuerpo.length) {
    const c = cuerpo[i];
    if (c === '{' && cuerpo[i + 1] === '{') {
      texto += '{';
      i += 2;
      continue;
    }
    if (c === '}' && cuerpo[i + 1] === '}') {
      texto += '}';
      i += 2;
      continue;
    }
    if (c === '}') {
      throw fallo('sintaxis', 'sobra una «}» dentro del texto con f', { linea, columna: col });
    }
    if (c === '{') {
      if (texto !== '') partes.push({ texto, codigo: null });
      texto = '';
      i += 1;
      let hondo = 0;
      let codigo = '';
      let cerrada = false;
      while (i < cuerpo.length) {
        const d = cuerpo[i];
        if (d === '(' || d === '[' || d === '{') hondo += 1;
        if (d === ')' || d === ']') hondo -= 1;
        if (d === '}') {
          if (hondo === 0) {
            cerrada = true;
            i += 1;
            break;
          }
          hondo -= 1;
        }
        if (d === ':' && hondo === 0) {
          throw fallo('sintaxis', 'aquí no se pueden dar formatos dentro de un texto con f', {
            linea,
            columna: col,
            pista: 'para dejar dos decimales usa round(numero, 2) antes de meterlo en el texto',
          });
        }
        codigo += d;
        i += 1;
      }
      if (!cerrada) {
        throw fallo('sintaxis', 'falta la «}» que cierra el hueco del texto con f', { linea, columna: col });
      }
      if (codigo.trim() === '') {
        throw fallo('sintaxis', 'el hueco del texto con f está vacío', {
          linea,
          columna: col,
          pista: 'dentro de las llaves va el nombre de una variable o una cuenta: f"hola {nombre}"',
        });
      }
      partes.push({ texto: null, codigo });
      continue;
    }
    texto += c;
    i += 1;
  }
  if (texto !== '') partes.push({ texto, codigo: null });
  return partes;
}
