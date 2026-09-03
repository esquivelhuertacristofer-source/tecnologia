/**
 * TECNIA MURO · los datos, sin React.
 *
 * El armazón del que cuelgan 8 actividades (CANON-ARMAZONES.md, «5 · Tecnia
 * Muro»). Simula UNA red social inventada —no Instagram, no TikTok, ningún
 * logotipo real—: publicaciones, autores, «me gusta», comentarios, compartir.
 * No es un motor de plantillas: no sabe qué es un acierto ni pinta preguntas;
 * eso lo pone la actividad alrededor (`VentanaMuro` sólo pinta lo que le dan).
 *
 * ── Las cuatro decisiones de datos ──────────────────────────────────────────
 *
 * 1. `visibilidad` es un campo de la publicación, no un adorno de la UI.
 *    `público / amigos / sólo-yo` viaja en cada `PublicacionMuro` y
 *    `publicacionesVisibles` lo filtra — es lo que necesitan
 *    `n6-privacidad-en-juegos` y `n7-privacidad-en-redes`.
 *
 * 2. `acciones: AccionMuro[]` por publicación, no una lista fija del
 *    armazón: «cuáles están disponibles lo decide la actividad» (el
 *    encargo, casi textual). Una publicación sin `acciones` no ofrece
 *    NINGÚN botón — el armazón no inventa una barra completa por defecto.
 *
 * 3. **Borrar no borra.** `borrada?: boolean` marca la publicación; el dato
 *    JAMÁS se quita del arreglo. `copiasSobrevivientes` es la prueba de que
 *    algo escapó al borrado (una captura, un reenvío), y vive en la propia
 *    publicación para que sobreviva con ella. Ver `useMuro.borrar` y
 *    `useMuro.inyectarConsecuencia`.
 *
 * 4. **Consecuencias diferidas.** `ConsecuenciaMuro` es el evento que el
 *    GUION de la actividad inyecta más tarde —un comentario de un
 *    desconocido, un reenvío, una copia que sobrevive— sin pasar por los
 *    guardas del alumno (`comentar` rechaza comentar en algo borrado;
 *    `inyectarConsecuencia` no, porque representa a alguien más actuando
 *    sobre lo que ya pasó). Ninguna de las dos usa `setTimeout`: el "más
 *    tarde" lo decide la actividad con su propio guion, como
 *    `LabLoQuePublicoPermanece` decide sus actos con clics en «Continuar»,
 *    no con relojes.
 */

/** Quién puede ver una publicación. Dato de primera clase. */
export type Visibilidad = 'publico' | 'amigos' | 'solo-yo';

export interface AutorMuro {
  id: string;
  nombre: string;
  usuario?: string;
  /** Emoji o inicial; si falta, la ventana usa la primera letra del nombre. */
  avatar?: string;
  verificado?: boolean;
  /** Marca al propio alumno cuando publica o comenta desde el compositor. */
  esAlumno?: boolean;
}

export interface ImagenMuro {
  emoji: string;
  descripcion: string;
}

export interface ComentarioMuro {
  id: string;
  autor: AutorMuro;
  texto: string;
  fecha: string;
}

/** Las cinco acciones que el armazón sabe ofrecer. Cuáles se muestran en
 *  cada publicación lo decide la actividad vía `PublicacionMuro.acciones`. */
export type AccionMuro = 'me-gusta' | 'comentar' | 'compartir' | 'reportar' | 'borrar';

/** Un rastro de que la publicación sobrevivió a su propio borrado. */
export interface CopiaMuro {
  id: string;
  /** Frase lista para mostrar, p. ej. "Diego le tomó captura hace 2 días". */
  texto: string;
}

export interface PublicacionMuro {
  id: string;
  autor: AutorMuro;
  texto: string;
  imagen?: ImagenMuro;
  /** Etiqueta ya formateada, p. ej. "hace 10 segundos" — el armazón no calcula tiempo. */
  fecha: string;
  visibilidad: Visibilidad;
  meGusta: number;
  /** Si el alumno ya le dio «me gusta» (para pintar el corazón lleno). */
  meGustaDelAlumno?: boolean;
  comentarios: ComentarioMuro[];
  compartidos: number;
  acciones: AccionMuro[];
  reportada?: boolean;
  /** «Borrar no borra»: nunca se quita del arreglo, sólo se marca. */
  borrada?: boolean;
  copiasSobrevivientes: CopiaMuro[];
  /** Lo que esta publicación revela sin querer — insumo para `perfilDe`. */
  pistas?: string[];
}

/**
 * Un evento que el guion de la actividad inyecta DESPUÉS: la consecuencia
 * diferida de algo publicado antes. No es una acción del alumno — por eso no
 * usa los mismos verbos (`comentar`, `compartir`) ni sus guardas.
 */
export type ConsecuenciaMuro =
  | {
      tipo: 'comentario';
      publicacionId: string;
      comentario: { id?: string; autor: AutorMuro; texto: string; fecha: string };
    }
  | { tipo: 'compartido'; publicacionId: string; cantidad?: number }
  | { tipo: 'copia'; publicacionId: string; copia: { id?: string; texto: string } };

export interface PerfilMuro {
  autor: AutorMuro;
  bio?: string;
  /** Las publicaciones de este autor que el visor puede ver (ya filtradas). */
  publicaciones: PublicacionMuro[];
  /** Todas las `pistas` de esas publicaciones, juntas. */
  pistas: string[];
}

/**
 * Filtra el muro tal como lo vería alguien: por omisión esconde lo borrado
 * y no filtra por visibilidad (si la actividad quiere sólo lo público de
 * otra persona, pasa `visibilidad: ['publico']`).
 */
export function publicacionesVisibles(
  publicaciones: PublicacionMuro[],
  opciones?: { incluirBorradas?: boolean; visibilidad?: Visibilidad[] },
): PublicacionMuro[] {
  const incluirBorradas = opciones?.incluirBorradas ?? false;
  const permitidas = opciones?.visibilidad;
  return publicaciones.filter((p) => {
    if (p.borrada && !incluirBorradas) return false;
    if (permitidas && !permitidas.includes(p.visibilidad)) return false;
    return true;
  });
}
