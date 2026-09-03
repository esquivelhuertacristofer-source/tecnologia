/**
 * n6-contrasenas-fuertes · la máquina de adivinar, probada como unidad ANTES
 * de tener UI (pliego, §«la pieza, entera»). Seis funciones puras: nada de
 * DOM, nada de React, nada de `Date`.
 *
 * El riesgo nº1 de la clase es que esto se lea como una barrita con más
 * pasos — por eso también se comprueba aquí que `Intento` no esconde ningún
 * número de fuerza fuera de `combinaciones`, que sólo tiene sentido en el
 * paso 4 y sólo se enseña como tamaño de un espacio de búsqueda, no como
 * puntuación.
 */
import {
  BOLSA_PALABRAS,
  DICCIONARIO_COMUN,
  candidatasDePerfil,
  combinacionesDeFrase,
  intentarAdivinar,
  reutilizada,
  sacarPalabras,
  sinDisfraz,
  type PerfilPublico,
} from '@/components/activities/n6/ciberseguridad/adivinador';

const PERFIL_LUNA: PerfilPublico = {
  nombre: 'Karla',
  mascota: 'Luna',
  equipo: 'Aguilas',
  juego: 'MegaCarrera',
  anios: [2014],
};

const PERFIL_VACIO: PerfilPublico = { nombre: '', mascota: '', equipo: '', juego: '', anios: [] };

describe('sinDisfraz', () => {
  it('pasa a minúsculas y quita sólo las cinco sustituciones — nada más', () => {
    expect(sinDisfraz('P@ssw0rd')).toBe('password');
    expect(sinDisfraz('l3tm31n')).toBe('letmein');
    expect(sinDisfraz('s3cret!')).toBe('secret!'); // el símbolo suelto NO se quita: "sólo esto"
    expect(sinDisfraz('  Hola  ')).toBe('hola');
  });

  it('no toca una clave que no lleva ningún carácter disfrazable', () => {
    expect(sinDisfraz('perrogato')).toBe('perrogato');
  });
});

describe('candidatasDePerfil', () => {
  it('es el producto de cada dato con sus años, en orden — el dato solo primero', () => {
    const c = candidatasDePerfil(PERFIL_LUNA);
    expect(c[0]).toBe('luna');
    expect(c[1]).toBe('luna2014');
    expect(c).toContain('aguilas2014');
    expect(c).toContain('megacarrera2014');
    expect(c).toContain('karla2014');
  });

  it('es determinista: la misma llamada da siempre el mismo orden', () => {
    expect(candidatasDePerfil(PERFIL_LUNA)).toEqual(candidatasDePerfil(PERFIL_LUNA));
  });

  it('un perfil vacío no genera candidatas', () => {
    expect(candidatasDePerfil(PERFIL_VACIO)).toEqual([]);
  });
});

describe('intentarAdivinar — el ataque en orden: lista, dato, disfraz, fuerza', () => {
  it('paso 1 · lista: "123456" cae en el intento número uno', () => {
    const r = intentarAdivinar('123456', PERFIL_VACIO, DICCIONARIO_COMUN);
    expect(r).toMatchObject({ cae: true, paso: 'lista', intento: 1 });
  });

  it('paso 2 · dato: "luna2014" no está en la lista pero sí en el perfil', () => {
    expect(DICCIONARIO_COMUN.includes('luna2014')).toBe(false);
    const r = intentarAdivinar('luna2014', PERFIL_LUNA, DICCIONARIO_COMUN);
    expect(r.cae).toBe(true);
    expect(r.paso).toBe('dato');
    expect(r.intento).toBeGreaterThan(DICCIONARIO_COMUN.length); // ya pasó por todo el paso 1
  });

  it('paso 3 · disfraz: "P@ssw0rd" no es un dato del perfil, pero sin disfraz es "password"', () => {
    const r = intentarAdivinar('P@ssw0rd', PERFIL_LUNA, DICCIONARIO_COMUN);
    expect(r.cae).toBe(true);
    expect(r.paso).toBe('disfraz');
    // Cayó DESPUÉS de agotar lista + candidatas del perfil (segunda pasada por la lista).
    expect(r.intento).toBeGreaterThan(DICCIONARIO_COMUN.length + candidatasDePerfil(PERFIL_LUNA).length);
  });

  it('paso 4 · fuerza: una frase de cuatro palabras al azar no cae en ningún paso', () => {
    const frase = 'cohete platano bufanda calendario';
    const r = intentarAdivinar(frase, PERFIL_LUNA, DICCIONARIO_COMUN);
    expect(r.cae).toBe(false);
    expect(r.paso).toBe('fuerza');
    expect(r.combinaciones).toBeGreaterThan(0);
  });

  it('es pura: cien llamadas sobre la misma clave dan EXACTAMENTE el mismo informe, y el intento no se acumula entre llamadas — jugar MAL', () => {
    const primero = intentarAdivinar('luna2014', PERFIL_LUNA, DICCIONARIO_COMUN);
    for (let i = 0; i < 100; i += 1) {
      expect(intentarAdivinar('luna2014', PERFIL_LUNA, DICCIONARIO_COMUN)).toEqual(primero);
    }
  });

  it('el riesgo nº1: Intento nunca lleva un número de fuerza fuera de "combinaciones", y ésta es 0 salvo en el paso 4', () => {
    const casos = [
      intentarAdivinar('123456', PERFIL_VACIO, DICCIONARIO_COMUN),
      intentarAdivinar('luna2014', PERFIL_LUNA, DICCIONARIO_COMUN),
      intentarAdivinar('P@ssw0rd', PERFIL_LUNA, DICCIONARIO_COMUN),
    ];
    for (const c of casos) {
      expect(Object.keys(c).sort()).toEqual(['cae', 'combinaciones', 'intento', 'motivo', 'paso'].sort());
      expect(c.combinaciones).toBe(0);
    }
  });
});

describe('combinacionesDeFrase', () => {
  it('es tamBolsa ^ palabras, nunca escrito a mano: si la bolsa cambia, el número cambia solo', () => {
    expect(combinacionesDeFrase(300, 4)).toBe(8_100_000_000);
    expect(combinacionesDeFrase(40, 4)).toBe(Math.pow(40, 4));
  });

  it('con la bolsa real del archivo da un número por encima de dos mil millones', () => {
    expect(combinacionesDeFrase(BOLSA_PALABRAS.length, 4)).toBeGreaterThan(2_000_000_000);
  });
});

describe('reutilizada', () => {
  it('devuelve qué otras cuentas caen con la misma llave', () => {
    const cuentas = [
      { id: 'juego', llave: 'cohete platano bufanda martes' },
      { id: 'escuela', llave: 'cohete platano bufanda martes' },
      { id: 'videos', llave: 'otra frase distinta aqui' },
    ];
    expect(reutilizada('cohete platano bufanda martes', cuentas).sort()).toEqual(['escuela', 'juego']);
  });

  it('si nadie repite la llave, no reporta ninguna cuenta', () => {
    const cuentas = [
      { id: 'juego', llave: 'una frase unica aqui' },
      { id: 'escuela', llave: 'otra frase distinta ya' },
    ];
    expect(reutilizada('la-llave-filtrada', cuentas)).toEqual([]);
  });
});

describe('sacarPalabras — el azar entra por parámetro', () => {
  it('con una secuencia fija da siempre las mismas palabras, en el mismo orden', () => {
    const secuencia = [0, 0, 0, 0];
    let i = 0;
    const aleatorio = () => secuencia[i++];
    const salida = sacarPalabras(BOLSA_PALABRAS, 4, aleatorio);
    expect(salida).toEqual([BOLSA_PALABRAS[0], BOLSA_PALABRAS[1], BOLSA_PALABRAS[2], BOLSA_PALABRAS[3]]);
  });

  it('nunca repite una palabra en la misma tirada — jugando MAL cuarenta tiradas seguidas', () => {
    for (let t = 0; t < 40; t += 1) {
      const salida = sacarPalabras(BOLSA_PALABRAS, 4, Math.random);
      expect(salida.length).toBe(4);
      expect(new Set(salida).size).toBe(4);
    }
  });

  it('pedir más palabras de las que hay en la bolsa no revienta: se detiene en el tamaño de la bolsa', () => {
    const salida = sacarPalabras(['uno', 'dos'], 5, Math.random);
    expect(salida.length).toBe(2);
  });
});

describe('la bolsa y el diccionario del archivo son reales, no de mentira', () => {
  it('la bolsa tiene al menos 240 palabras — si no, el número de combinaciones que se enseña es falso', () => {
    expect(BOLSA_PALABRAS.length).toBeGreaterThanOrEqual(240);
  });

  it('ninguna palabra de la bolsa tiene espacios (si no, una frase de la bolsa podría colarse en el diccionario o en un dato de perfil)', () => {
    for (const p of BOLSA_PALABRAS) expect(p.includes(' ')).toBe(false);
  });

  it('el diccionario no tiene espacios: una frase de varias palabras nunca puede caer en el paso 1', () => {
    for (const p of DICCIONARIO_COMUN) expect(p.includes(' ')).toBe(false);
  });

  it('"123456" es la primera del diccionario — la más usada del planeta', () => {
    expect(DICCIONARIO_COMUN[0]).toBe('123456');
  });

  it('"password" está en el diccionario — hace falta para que P@ssw0rd caiga en el paso 3', () => {
    expect(DICCIONARIO_COMUN).toContain('password');
  });
});
