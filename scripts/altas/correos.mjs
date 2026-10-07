/**
 * Alta masiva — cómo se fabrica un correo a partir de un nombre.
 *
 * Vive aparte del guion que habla con Supabase para poder probarlo. Es la
 * pieza que más barato sale equivocar y más caro sale descubrir tarde: un
 * correo mal asignado es un niño que entra a la cuenta de otro, y como los dos
 * ven la plataforma igual, nadie se entera hasta que alguien mira el progreso.
 *
 * LA REGLA. `nombre.apellido@dominio`. Cuando ese correo ya está tomado se
 * sube un escalón de desambiguación, y sólo se recurre al número cuando se
 * acabaron los escalones con significado:
 *
 *   1. ana.perez
 *   2. ana.perez.l          (inicial del segundo apellido)
 *   3. ana.g.perez.l        (inicial del segundo nombre, si lo hay)
 *   4. ana.perez2, ana.perez3, ...
 *
 * POR QUÉ NO EMPEZAR POR EL NÚMERO. Porque `ana.perez2` no le dice nada a la
 * maestra que reparte las contraseñas en el salón, y `ana.perez.l` sí: es Ana
 * Pérez López. El número es el último recurso, no el primero.
 *
 * LO QUE NO HACE. No pregunta a la base si el correo existe: eso lo hace quien
 * llama, pasándole el conjunto `tomados`. Así esta pieza es pura y se puede
 * probar sin red.
 */

/** Quita acentos y diéresis; la eñe se vuelve `n`. */
export function sinAcentos(texto) {
  return String(texto ?? '')
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'N')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Un trozo de correo: minúsculas, sin acentos, sin nada que no sea a-z 0-9.
 * Los guiones y apóstrofes de apellidos como `D'Angelo` o `Sánchez-Mora`
 * desaparecen en vez de convertirse en puntos, que partirían el correo.
 */
export function trozo(texto) {
  return sinAcentos(texto)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 24);
}

/**
 * Parte un nombre completo en las piezas que usa la escalera.
 *
 * `apellidos` puede venir junto («Pérez López») o el llamador puede mandar
 * sólo `nombre` con todo dentro. Se acepta lo segundo porque las listas que
 * mandan las escuelas casi nunca vienen en dos columnas limpias.
 */
export function partes({ nombre = '', apellidos = '' }) {
  const nombres = String(nombre).trim().split(/\s+/).filter(Boolean);
  let apes = String(apellidos).trim().split(/\s+/).filter(Boolean);

  // Sin columna de apellidos, se parte el nombre completo: las dos últimas
  // palabras son los apellidos, que es la forma habitual en México.
  if (apes.length === 0 && nombres.length >= 3) {
    apes = nombres.splice(-2, 2);
  } else if (apes.length === 0 && nombres.length === 2) {
    apes = nombres.splice(-1, 1);
  }

  return {
    pila: nombres[0] ?? '',
    segundoNombre: nombres[1] ?? '',
    primerApellido: apes[0] ?? '',
    segundoApellido: apes[1] ?? '',
  };
}

/**
 * Los candidatos, en orden de preferencia. Devuelve una lista perezosa corta:
 * los cuatro escalones con significado y después los numerados.
 */
export function candidatos(persona, cuantos = 40) {
  const p = partes(persona);
  const pila = trozo(p.pila);
  const ape1 = trozo(p.primerApellido);
  const ape2 = trozo(p.segundoApellido);
  const nom2 = trozo(p.segundoNombre);

  // Sin nombre ni apellido no hay correo que valga; que lo resuelva el humano.
  if (!pila && !ape1) return [];

  /*
   * El punto solo va ENTRE dos trozos que existan. Una celda con basura
   * -«...» en la columna del nombre, que sale de copiar y pegar de Word-
   * dejaba `pila` vacia y producia `.perez@...`, que no es una direccion
   * valida y Supabase rechaza. Lo cazo una prueba, no un alta real.
   */
  const une = (...trozos) => trozos.filter(Boolean).join('.');

  const base = une(pila, ape1);
  const lista = [base];

  if (ape2) lista.push(une(base, ape2[0]));
  if (nom2) lista.push(une(pila, nom2[0], ape1, ape2 ? ape2[0] : ''));
  if (ape2) lista.push(une(pila, ape1, ape2));

  for (let n = 2; lista.length < cuantos; n += 1) lista.push(`${base}${n}`);
  return lista;
}

/**
 * Asigna correos a una lista de personas.
 *
 * `tomados` entra con los correos que YA existen en Supabase, y sale con los
 * nuevos añadidos: así dos ejecuciones seguidas no le dan el mismo correo a
 * dos niños distintos. Es lo que hace que el guion se pueda repetir sin miedo.
 */
export function asignarCorreos(personas, dominio, tomados = new Set()) {
  const usados = new Set([...tomados].map((c) => String(c).toLowerCase()));
  const salida = [];

  for (const persona of personas) {
    const opciones = candidatos(persona);
    if (opciones.length === 0) {
      salida.push({ ...persona, correo: null, motivo: 'sin nombre utilizable' });
      continue;
    }

    let elegido = null;
    for (const local of opciones) {
      const correo = `${local}@${dominio}`.toLowerCase();
      if (!usados.has(correo)) { elegido = correo; break; }
    }

    if (!elegido) {
      salida.push({ ...persona, correo: null, motivo: 'se agotaron los candidatos' });
      continue;
    }

    usados.add(elegido);
    salida.push({ ...persona, correo: elegido });
  }

  return salida;
}

/*
 * CONTRASEÑAS. Alfabeto sin los caracteres que un niño de seis años confunde
 * al copiarlos de un papel: 0/O, 1/l/I, 5/S, 2/Z -fuera las dos formas de cada
 * pareja, la letra y el dígito-. Lo que se gana en entropía
 * usándolos se pierde entero en el primer día de clase, con veinte manos
 * levantadas porque no entran.
 */
const ALFABETO = 'abcdefghjkmnpqrtuvwxy';
const DIGITOS = '346789';

export function contrasena(azar = Math.random) {
  const saca = (fuente, n) =>
    Array.from({ length: n }, () => fuente[Math.floor(azar() * fuente.length)]).join('');
  const cuerpo = saca(ALFABETO, 6);
  return cuerpo[0].toUpperCase() + cuerpo.slice(1) + saca(DIGITOS, 3);
}
