import type { Diapositiva } from './modelo';

/**
 * **De un esquema de Word a diapositivas** (§44.5, MOS 2.1.2).
 *
 * ── POR QUÉ ESTO ES UN MÓDULO APARTE Y PURO ─────────────────────────────────
 *
 * Porque el reparto tiene respuesta exacta —cuatro títulos grandes son cuatro
 * diapositivas, y los pequeños de debajo son sus viñetas— y las respuestas
 * exactas se prueban. Dentro del diálogo, lo único comprobable sería que el
 * diálogo no revienta.
 *
 * Y porque el diálogo enseña el documento **y** el reparto: si el previo
 * dibujara una cosa y la conversión hiciera otra, el alumno estaría decidiendo
 * sobre algo que no va a pasar. Las dos salen de aquí.
 *
 * ── LO QUE ESTA CONVERSIÓN ENSEÑA DE VERDAD ─────────────────────────────────
 *
 * Que **los estilos de título no eran para que se viera bonito**. En Word se
 * enseñaron como etiquetas —«no es negrita grande: es una etiqueta»— y aquí se
 * cobra la letra: un documento escrito con estilos se convierte solo, y uno
 * escrito a base de negrita y tamaño 20 no se convierte en nada, porque no hay
 * nada que leer. Por eso el renglón sin nivel existe en el tipo: es el párrafo
 * normal, y **no sale en ninguna diapositiva**.
 */

export interface RenglonDeEsquema {
  /**
   * `1` es título de diapositiva, `2` es viñeta. Sin nivel, texto normal del
   * documento: se enseña en el diálogo y **no se convierte**, que es justo lo
   * que hay que ver.
   */
  nivel?: 1 | 2;
  texto: string;
}

/**
 * Las diapositivas que saldrían de este esquema.
 *
 * Un nivel 2 que aparece **antes del primer título** no tiene diapositiva donde
 * caer y se descarta. No se le inventa una: en Word eso es texto suelto de
 * portada, y fabricarle una diapositiva sin título sería adivinar por el
 * alumno.
 */
export function aDiapositivas(renglones: RenglonDeEsquema[]): Diapositiva[] {
  const salida: Diapositiva[] = [];

  for (const r of renglones) {
    const texto = r.texto.trim();
    if (!texto || !r.nivel) continue;

    if (r.nivel === 1) {
      salida.push({
        diseno: 'titulo-texto',
        marcadores: [
          { rol: 'titulo', contenido: texto, casilla: null },
          { rol: 'cuerpo', contenido: null, casilla: null },
        ],
        libres: [],
      });
      continue;
    }

    const ultima = salida.at(-1);
    if (!ultima) continue;
    const cuerpo = ultima.marcadores.find((m) => m.rol === 'cuerpo');
    if (!cuerpo) continue;
    cuerpo.contenido = cuerpo.contenido ? `${cuerpo.contenido}\n${texto}` : texto;
  }

  return salida;
}

/** Cuántas saldrían. Es el número que el diálogo enseña antes de aceptar. */
export const cuantasSaldran = (renglones: RenglonDeEsquema[]): number =>
  renglones.filter((r) => r.nivel === 1 && r.texto.trim()).length;
