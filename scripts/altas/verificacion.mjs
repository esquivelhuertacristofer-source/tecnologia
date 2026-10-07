/**
 * Alta masiva — comprobar que lo que se escribió quedó escrito.
 *
 * POR QUÉ EXISTE ESTE ARCHIVO. Dar de alta a un alumno son dos escrituras en
 * dos sitios: la cuenta en `auth.users` y el perfil en `public.profiles`. La
 * segunda la hace un trigger, y un trigger no le puede devolver un error a
 * quien dio de alta: se lo traga. Si además el guion corrige el perfil con un
 * `PATCH`, y la fila no existe, PostgREST responde **204 No Content** — que es
 * exactamente lo mismo que responde cuando sí actualizó. Éxito y fallo son
 * indistinguibles.
 *
 * Eso ya pasó en la plataforma hermana de NEM: 52 cuentas recién creadas y 13
 * anteriores quedaron sin escuela, y sus 8 docentes guardados como alumno sin
 * poder entrar a su panel. Nadie vio un error. La causa de fondo era otra —el
 * admin API de GoTrue aplica el `app_metadata` DESPUÉS del INSERT, así que el
 * trigger `AFTER INSERT` lee metadata vacía—, pero lo que la hizo invisible
 * fue esto: escribir sin releer.
 *
 * LA REGLA QUE SALE DE AHÍ. No basta con que la escritura no dé error. Hay que
 * volver a leer la fila y comparar campo a campo. Estas funciones son puras
 * para poder probarlas sin base de datos; quien lee es el guion.
 */

/** Los campos del perfil que el alta considera suyos y verifica. */
export const CAMPOS_VERIFICADOS = ['role', 'full_name', 'email', 'escuela_id'];

/**
 * Compara lo que se quiso escribir con lo que la base devuelve.
 *
 * Devuelve la lista de diferencias, vacía si todo cuadra. Se compara como
 * texto a propósito: un `uuid` vuelve como cadena y un `null` no es lo mismo
 * que un `undefined`, y aquí lo que importa es si el valor que quedó es el que
 * se pidió, no de qué tipo es.
 */
export function diferencias(esperado, leido, campos = CAMPOS_VERIFICADOS) {
  if (!leido) return [{ campo: '(la fila)', esperado: 'existe', encontrado: 'no existe' }];

  const texto = (v) => (v === null || v === undefined ? '' : String(v));
  const salida = [];

  for (const campo of campos) {
    if (!(campo in esperado)) continue;
    const a = texto(esperado[campo]);
    const b = texto(leido[campo]);
    if (a !== b) salida.push({ campo, esperado: a || '(vacio)', encontrado: b || '(vacio)' });
  }
  return salida;
}

/**
 * ¿Quedó bien dada de alta esta persona?
 *
 * Junta las tres comprobaciones en un veredicto: el perfil existe y cuadra, y
 * está en todos los grupos que le tocaban. `gruposEsperados` y `gruposLeidos`
 * son listas de identificadores de grupo.
 */
export function veredicto({ esperado, perfilLeido, gruposEsperados = [], gruposLeidos = [] }) {
  const problemas = diferencias(esperado, perfilLeido).map(
    (d) => `${d.campo}: se pidio ${d.esperado} y quedo ${d.encontrado}`,
  );

  const faltan = gruposEsperados.filter((g) => !gruposLeidos.includes(g));
  if (faltan.length) problemas.push(`sin vincular a ${faltan.length} grupo(s)`);

  return { ok: problemas.length === 0, problemas };
}

/**
 * El resumen de toda la corrida.
 *
 * `exito` es falso si CUALQUIER persona quedó mal. El guion termina con código
 * distinto de cero en ese caso: un alta a medias que devuelve 0 es la forma de
 * que nadie la mire.
 */
export function resumen(resultados) {
  const malos = resultados.filter((r) => !r.ok);
  return {
    total: resultados.length,
    correctos: resultados.length - malos.length,
    malos,
    exito: malos.length === 0,
  };
}
