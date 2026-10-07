/**
 * n6-contrasenas-fuertes · LA MÁQUINA DE ADIVINAR, sin React.
 *
 * DISENO-N6-contrasenas-fuertes.md, «La decisión sobre la deuda del medidor:
 * (B), y la pieza NO es un medidor». Un medidor honesto no se puede escribir
 * (cuenta símbolos y pinta `P@ssw0rd!` de verde, que es justo la mentira que
 * la clase viene a desmontar). Esto NO es un medidor: no hay número de 0 a 4,
 * no hay semáforo. Es el ataque, paso por paso, con su motivo y su número de
 * intento — lo único que sí se puede escribir honestamente.
 *
 * Seis funciones puras. Sin React, sin `Date`, sin `Math.random` dentro de la
 * lógica — el azar entra por parámetro en `sacarPalabras`. No vive en un
 * armazón: medido (`grep -n -i "contrase" src/data/curriculo.ts`) que esta
 * clase es el ÚNICO consumidor pendiente de una pieza de contraseñas en toda
 * la plataforma, así que un armazón #17 para un solo consumidor es justo lo
 * que prohíbe el canon. Si aparece un segundo consumidor, entonces sube.
 *
 * Riesgo nº1 de la clase, escrito por el diseñador: que esto se lea como una
 * barrita de colores con más pasos. Por eso `Intento` NO lleva ningún número
 * de fuerza — lleva `paso`, `motivo` e `intento` (el número de intento en el
 * ataque, no una puntuación).
 */

// ─────────────────────────────────────────────────────────────────────────
// 1 · Los datos
// ─────────────────────────────────────────────────────────────────────────

/** Lo visible del perfil público de una cuenta — nunca del alumno (regla de
 *  privacidad del §24, heredada aquí): en esta clase sólo se usan perfiles de
 *  personajes de ficción. */
export interface PerfilPublico {
  nombre: string;
  mascota: string;
  equipo: string;
  juego: string;
  /** Años que aparecen en el perfil (cumpleaños, cuándo empezó a jugar…). */
  anios: number[];
}

export type Bolsa = string[];
export type Diccionario = string[];

/**
 * `piezas` (§69.4): la llave son fichas que la máquina ya conoce —palabras de
 * la bolsa, de la lista, datos del perfil, números— y multiplicadas no llegan a
 * su paciencia. `fuerza` con `cae: true`: era corta y salió a lo bruto.
 */
export type PasoAtaque = 'lista' | 'dato' | 'disfraz' | 'piezas' | 'fuerza';

/**
 * Hasta cuántos intentos aguanta la máquina antes de rendirse. Es un número
 * DE LA CLASE, no de la vida real (una computadora de verdad prueba muchos
 * más), y la página de la máquina lo dice así. Está puesto para que tres
 * palabras de la bolsa caigan (332³ ≈ 37 millones) y cuatro aguanten
 * (332⁴ ≈ 12 100 millones): ésa es la lección.
 */
export const PACIENCIA = 1_000_000_000;

export interface Intento {
  cae: boolean;
  paso: PasoAtaque | null;
  motivo: string;
  /** El número de intento en el que cayó (o en el que se rindió, si no cae). */
  intento: number;
  /** Sólo tiene sentido cuando `paso === 'fuerza'`: cuántas combinaciones
   *  habría que probar. Es la ÚNICA cifra que se permite mostrar — y no es
   *  una puntuación de fuerza, es el tamaño del espacio de búsqueda. */
  combinaciones: number;
}

/** Una cuenta con su llave actual — lo mínimo que necesita `reutilizada`. */
export interface CuentaConLlave {
  id: string;
  llave: string;
}

// ─────────────────────────────────────────────────────────────────────────
// 2 · El disfraz — sólo esto, no un normalizador general
// ─────────────────────────────────────────────────────────────────────────

const MAPA_DISFRAZ: Record<string, string> = { '@': 'a', '0': 'o', '3': 'e', $: 's', '1': 'i' };

/** Minúsculas y `@→a 0→o 3→e $→s 1→i`. Sólo esto: no intenta ser un
 *  normalizador general (no quita signos de puntuación sueltos, no colapsa
 *  espacios). Es deliberadamente la MISMA restricción que el pliego pide. */
export function sinDisfraz(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .split('')
    .map((c) => MAPA_DISFRAZ[c] ?? c)
    .join('');
}

// ─────────────────────────────────────────────────────────────────────────
// 3 · Candidatas de un perfil — determinista y ordenado
// ─────────────────────────────────────────────────────────────────────────

/**
 * El producto de sus datos (mascota, equipo, juego, nombre) con sus años, en
 * ORDEN: por cada dato, primero el dato solo y luego el dato con cada año.
 * Determinista y ordenado a propósito — es lo que hace que «el intento nº 7»
 * sea siempre el 7, para la misma clave y el mismo perfil.
 */
export function candidatasDePerfil(perfil: PerfilPublico): string[] {
  const datos = [perfil.mascota, perfil.equipo, perfil.juego, perfil.nombre].filter(
    (d) => typeof d === 'string' && d.trim() !== '',
  );
  const salida: string[] = [];
  for (const dato of datos) {
    const base = dato.trim().toLowerCase();
    salida.push(base);
    for (const anio of perfil.anios) {
      salida.push(`${base}${anio}`);
    }
  }
  return salida;
}

// ─────────────────────────────────────────────────────────────────────────
// 4 · El tamaño de la fuerza bruta — nunca escrito a mano
// ─────────────────────────────────────────────────────────────────────────

function alfabetoDe(s: string): number {
  let n = 0;
  if (/[a-z]/.test(s)) n += 26;
  if (/[A-Z]/.test(s)) n += 26;
  if (/[0-9]/.test(s)) n += 10;
  if (/[^a-zA-Z0-9]/.test(s)) n += 32; // símbolos y espacios comunes
  return n || 26;
}

/** Combinaciones a lo bruto para una clave genérica, por alfabeto y largo.
 *  Sólo se ejercita cuando `intentarAdivinar` cae en el paso 4 con una clave
 *  que NO viene de la bolsa de palabras — en esta clase eso no ocurre nunca
 *  en pantalla (las fichas de la bolsa usan `combinacionesDeFrase`, más
 *  abajo, que sí es la cifra que se enseña). Se deja pura y calculada, no
 *  escondida, para que ninguna clave quede sin una razón matemática. */
function combinacionesPorLongitud(s: string): number {
  return Math.pow(alfabetoDe(s), s.length);
}

/**
 * Combinaciones de una frase de `palabras` palabras sacadas de una bolsa de
 * `tamBolsa` palabras: `tamBolsa ^ palabras`. PROHIBIDO escribir el número a
 * mano (pliego, §«la pieza, entera») — si la bolsa cambia de tamaño, este
 * número tiene que bajar o subir solo.
 */
export function combinacionesDeFrase(tamBolsa: number, palabras: number): number {
  return Math.pow(tamBolsa, palabras);
}

// ─────────────────────────────────────────────────────────────────────────
// 5 · El ataque — la función central
// ─────────────────────────────────────────────────────────────────────────

/**
 * Corre los pasos 1 (lista), 2 (dato) y 3 (disfraz) EN ESE ORDEN y devuelve
 * el primero que acierta, con el número de intento acumulado desde el
 * principio. Los tres comparan SIN ESPACIOS: armada con fichas, «rocky 2014»
 * es «rocky2014».
 *
 * Si ninguno acierta, quedan los pasos 4 y 5 (§69.4), que son una sola cuenta:
 * la llave se parte en piezas y cada una vale lo que le cuesta a la máquina
 * adivinarla —un dato del perfil, 1 (ya lo sabe); una palabra de la lista, su
 * largo; una de la bolsa, el de la bolsa; un número, 10 por cifra; lo demás,
 * por letras—, siempre después de quitarle el disfraz. Si el producto no llega
 * a {@link PACIENCIA}, cae: por `piezas` si todas eran conocidas, por `fuerza`
 * si alguna se contó por letras. Si llega, `cae: false`, `paso: 'fuerza'`.
 *
 * El paso 3 sólo vuelve a recorrer la lista cuando quitar el disfraz cambió
 * algo — si la clave no llevaba ningún carácter disfrazable, repetir la
 * pasada sería un segundo intento idéntico al del paso 1 (ya falló ahí) y
 * sólo inflaría el número de intento sin enseñar nada nuevo.
 */
export function intentarAdivinar(
  clave: string,
  perfil: PerfilPublico,
  diccionario: Diccionario,
  bolsa: Bolsa = BOLSA_PALABRAS,
): Intento {
  const claveNorm = clave.trim().toLowerCase().replace(/\s+/g, '');
  let intento = 0;

  for (const palabra of diccionario) {
    intento += 1;
    if (palabra.toLowerCase() === claveNorm) {
      return {
        cae: true,
        paso: 'lista',
        motivo: `Está en la lista de las contraseñas más usadas del mundo — la probó en el intento número ${intento}.`,
        intento,
        combinaciones: 0,
      };
    }
  }

  const candidatas = candidatasDePerfil(perfil);
  for (const candidata of candidatas) {
    intento += 1;
    if (candidata === claveNorm) {
      return {
        cae: true,
        paso: 'dato',
        motivo: 'Es un dato de su perfil público, solo o combinado con un año — no hizo falta adivinar nada, estaba a la vista.',
        intento,
        combinaciones: 0,
      };
    }
  }

  const claveSinDisfraz = sinDisfraz(claveNorm);
  if (claveSinDisfraz !== claveNorm) {
    for (const palabra of diccionario) {
      intento += 1;
      if (palabra.toLowerCase() === claveSinDisfraz) {
        return {
          cae: true,
          paso: 'disfraz',
          motivo: 'Debajo del disfraz (@→a, 0→o, 3→e, $→s, 1→i) es una palabra de la lista del paso 1.',
          intento,
          combinaciones: 0,
        };
      }
    }
  }

  const { total, conocidas, conDato, piezas } = contarPiezas(clave, perfil, diccionario, bolsa);
  const cifra = total.toLocaleString('es-MX');
  if (total < PACIENCIA) {
    return conocidas
      ? {
          cae: true,
          paso: 'piezas',
          motivo:
            `Son ${piezas === 1 ? 'una pieza' : `${piezas} piezas`} que la máquina ya conoce${conDato ? ', y una es un dato de su perfil' : ''}: con ${cifra} combinaciones le alcanza, y se rinde hasta los mil millones.`,
          intento: intento + total,
          combinaciones: total,
        }
      : {
          cae: true,
          paso: 'fuerza',
          motivo: `Es corta: a lo bruto son ${cifra} combinaciones, y la máquina prueba hasta mil millones.`,
          intento: intento + total,
          combinaciones: total,
        };
  }

  return {
    cae: false,
    paso: 'fuerza',
    motivo: `No está en la lista, no es un dato de su perfil y no es un disfraz de nada. A lo bruto serían ${cifra} combinaciones: más de las que la máquina tiene paciencia de probar.`,
    intento,
    combinaciones: total,
  };
}

/** Pasos 4 y 5: cuánto le cuesta a la máquina cada pieza de la llave, multiplicado. */
function contarPiezas(clave: string, perfil: PerfilPublico, diccionario: Diccionario, bolsa: Bolsa) {
  const deDani = new Set([...candidatasDePerfil(perfil), ...perfil.anios.map(String)]);
  const lista = new Set(diccionario.map((p) => p.toLowerCase()));
  const deBolsa = new Set(bolsa.map((p) => p.toLowerCase()));
  const trozos = clave.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let total = 1;
  let conocidas = true;
  let conDato = false;
  for (const trozo of trozos) {
    const limpio = sinDisfraz(trozo);
    if (deDani.has(limpio)) conDato = true;
    else if (lista.has(limpio)) total *= lista.size;
    else if (deBolsa.has(limpio)) total *= deBolsa.size;
    else if (/^[0-9]+$/.test(trozo)) total *= Math.pow(10, trozo.length);
    else {
      conocidas = false;
      total *= combinacionesPorLongitud(trozo);
    }
  }
  return { total, conocidas, conDato, piezas: trozos.length };
}

// ─────────────────────────────────────────────────────────────────────────
// 6 · La filtración
// ─────────────────────────────────────────────────────────────────────────

/** Qué otras cuentas caen con esta misma llave. Es la operación de la
 *  filtración: si una página perdió su lista, esto dice qué más se llevó. */
export function reutilizada(clave: string, cuentas: CuentaConLlave[]): string[] {
  return cuentas.filter((c) => c.llave === clave).map((c) => c.id);
}

// ─────────────────────────────────────────────────────────────────────────
// 7 · La bolsa de palabras
// ─────────────────────────────────────────────────────────────────────────

/** Saca `n` palabras de la bolsa, sin repetir. El azar entra por parámetro:
 *  la clase le pasa `Math.random`, la prueba le pasa una secuencia fija. Sin
 *  esto no hay forma de probar nada de lo que saca esta función. */
export function sacarPalabras(bolsa: Bolsa, n: number, aleatorio: () => number): string[] {
  const restantes = [...bolsa];
  const salida: string[] = [];
  const total = Math.min(n, restantes.length);
  for (let i = 0; i < total; i += 1) {
    const idx = Math.floor(aleatorio() * restantes.length);
    const idxSeguro = Math.min(Math.max(idx, 0), restantes.length - 1);
    salida.push(restantes[idxSeguro]);
    restantes.splice(idxSeguro, 1);
  }
  return salida;
}

// ─────────────────────────────────────────────────────────────────────────
// 8 · Los datos reales — el diccionario y la bolsa
// ─────────────────────────────────────────────────────────────────────────

/** Contraseñas reales de las más usadas del mundo, en orden aproximado de
 *  frecuencia real (`123456` primero — es la más usada del planeta). Incluye
 *  `password` (para revelar el disfraz de `P@ssw0rd`) y `futbol2013`, citada
 *  tal cual en el documento pedagógico como ejemplo de la lista. */
export const DICCIONARIO_COMUN: Diccionario = [
  '123456', '123456789', 'qwerty', 'password', '111111', '12345678', 'abc123', '1234567', '12345',
  'iloveyou', '000000', '1q2w3e4r', 'qwertyuiop', '123123', 'monkey', 'dragon', 'football', 'baseball',
  'welcome', 'master', 'shadow', 'superman', 'michael', 'jennifer', 'hunter', 'trustno1', 'letmein',
  'sunshine', 'princess', 'charlie', 'aa123456', 'donald', 'qwerty123', 'futbol2013', 'minecraft',
  'pokemon', 'starwars', 'freedom', 'whatever', 'ninja', 'soccer', 'flower', 'hockey', 'ranger',
  'buster', 'tigger', 'harley', 'robert', 'thomas', 'hannah', 'jordan', 'maggie', 'cookie', 'summer',
  'george', 'hello', 'yellow', 'purple', 'orange', 'liverpool', 'chelsea', 'arsenal', 'batman',
];

/**
 * Palabras corrientes y cortas para armar frases de cuatro palabras al azar.
 * No hay ni una palabra ligada a un dato personal (ni mascotas, ni nombres
 * propios de persona): son objetos, animales y lugares de siempre, para que
 * `intentarAdivinar` nunca pueda confundir una frase con un «dato tuyo».
 * Medido: {@link BOLSA_PALABRAS}.length ≥ 240 (una prueba lo comprueba).
 */
export const BOLSA_PALABRAS: Bolsa = Array.from(
  new Set([
    // Animales
    'perro', 'gato', 'elefante', 'jirafa', 'mono', 'tigre', 'leon', 'oso', 'lobo', 'zorro', 'conejo',
    'tortuga', 'delfin', 'ballena', 'pulpo', 'cangrejo', 'aguila', 'buho', 'loro', 'pinguino', 'koala',
    'panda', 'canguro', 'cebra', 'hipopotamo', 'rinoceronte', 'jaguar', 'puma', 'lince', 'nutria',
    'castor', 'ardilla', 'erizo', 'murcielago', 'camaleon', 'iguana', 'cocodrilo', 'serpiente', 'rana',
    'sapo', 'caballo', 'vaca', 'cerdo', 'oveja', 'cabra', 'pato', 'gallina', 'pavo', 'abeja', 'mariposa',
    // Comida
    'platano', 'manzana', 'naranja', 'uva', 'fresa', 'sandia', 'melon', 'pina', 'mango', 'kiwi', 'pera',
    'durazno', 'cereza', 'limon', 'coco', 'papaya', 'aguacate', 'tomate', 'zanahoria', 'papa', 'cebolla',
    'ajo', 'brocoli', 'lechuga', 'pepino', 'calabaza', 'maiz', 'frijol', 'arroz', 'pan', 'queso', 'leche',
    'huevo', 'miel', 'chocolate', 'galleta', 'pastel', 'helado', 'pizza', 'taco', 'sopa', 'ensalada',
    'jugo', 'agua', 'cafe',
    // Objetos de escuela
    'mochila', 'cuaderno', 'lapiz', 'borrador', 'tijeras', 'regla', 'libro', 'pluma', 'marcador',
    'crayon', 'pegamento', 'carpeta', 'calculadora', 'reloj', 'mapa', 'globo', 'brujula', 'telescopio',
    'microscopio', 'lupa', 'linterna', 'pila', 'cable', 'enchufe', 'cerradura', 'llave', 'candado',
    'sacapuntas', 'engrapadora', 'clip', 'cinta', 'hoja', 'sobre', 'estampilla', 'postal', 'agenda',
    'diario', 'sello', 'tinta', 'pizarron',
    // Ropa
    'sombrero', 'gorra', 'guantes', 'bota', 'zapato', 'calcetin', 'cinturon', 'chaleco', 'abrigo',
    'camisa', 'pantalon', 'vestido', 'falda', 'bufanda', 'sueter', 'chamarra', 'playera', 'short',
    'pijama', 'sandalia', 'tenis', 'mascada', 'corbata', 'boina', 'gorro',
    // Vehículos
    'cohete', 'avion', 'barco', 'tren', 'bicicleta', 'motocicleta', 'camion', 'autobus', 'submarino',
    'helicoptero', 'patineta', 'triciclo', 'carreta', 'velero', 'canoa', 'trineo', 'tractor', 'carrito',
    'camioneta', 'tranvia',
    // Naturaleza
    'montaña', 'rio', 'lago', 'oceano', 'bosque', 'selva', 'desierto', 'volcan', 'cascada', 'cueva',
    'isla', 'playa', 'arena', 'roca', 'piedra', 'arbol', 'flor', 'hoja', 'semilla', 'raiz', 'nube',
    'estrella', 'luna', 'sol', 'planeta', 'cometa', 'arcoiris', 'trueno', 'relampago', 'viento', 'lluvia',
    'nieve', 'hielo', 'niebla', 'rocio',
    // Hogar
    'silla', 'mesa', 'cama', 'sofa', 'lampara', 'espejo', 'ventana', 'puerta', 'escalera', 'alfombra',
    'cortina', 'almohada', 'cobija', 'cesta', 'maceta', 'jarron', 'florero', 'cuadro', 'radio',
    'television', 'telefono', 'computadora', 'tableta', 'camara', 'microfono', 'altavoz', 'teclado',
    'raton', 'impresora', 'bocina',
    // Deportes y música
    'futbol', 'basquetbol', 'beisbol', 'natacion', 'ciclismo', 'patinaje', 'boxeo', 'karate', 'ajedrez',
    'guitarra', 'piano', 'tambor', 'violin', 'trompeta', 'flauta', 'arpa', 'bateria', 'xilofono',
    'pandereta', 'silbato', 'pelota', 'raqueta', 'bate', 'casco', 'patines', 'cuerda', 'red', 'porteria',
    'arco', 'cancha', 'estadio', 'medalla', 'trofeo',
    // Lugares y oficios
    'escuela', 'biblioteca', 'museo', 'parque', 'zoologico', 'acuario', 'circo', 'teatro', 'cine',
    'mercado', 'panaderia', 'farmacia', 'hospital', 'bombero', 'policia', 'doctor', 'maestro', 'piloto',
    'astronauta', 'cientifico', 'pintor', 'musico', 'cocinero', 'jardinero', 'granjero',
    // Juguetes y formas
    'papalote', 'trompo', 'yoyo', 'rompecabezas', 'dado', 'carta', 'domino', 'canica', 'muñeca', 'robot',
    'dinosaurio', 'dragon', 'unicornio', 'sirena', 'pirata', 'caballero', 'princesa', 'mago', 'duende',
    'hada', 'fantasma', 'monstruo', 'circulo', 'cuadrado', 'triangulo', 'rectangulo', 'rombo',
    'pentagono', 'diamante', 'corona',
  ]),
);
