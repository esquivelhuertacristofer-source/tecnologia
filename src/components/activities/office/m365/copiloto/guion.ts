import type { GuionAsistente } from '@/components/simuladores/asistente';

/**
 * `of-m365-copiloto` · «Qué hace y qué no hace un copiloto» (§58.3) — el guion.
 *
 * Módulo puro, sin React: el texto que contesta Tecnia Copiloto, la cifra
 * inventada y la real, las opciones fijas de corrección y de conclusión.
 *
 * ── §29 del canon, aplicado aquí sin excepción ────────────────────────────
 *
 * Las tres respuestas son literales escritas a mano. No hay ni un `fetch` ni
 * un SDK: `resolverGuion` (en el armazón `simuladores/asistente`) sólo puede
 * devolver objetos que YA estaban en este archivo. El compositor de la clase
 * va siempre por fichas — nunca se enciende `compositor.libre` — así que no
 * hay ni un `<input>` de texto libre para el alumno en ningún punto de esta
 * clase.
 *
 * ── La alucinación, con una fuente separada a propósito ───────────────────
 *
 * `CIFRA_FALSA` es lo que el copiloto DIJO (fijo, no cambia nunca: no se
 * puede editar lo que ya está en el hilo del chat). `CIFRA_REAL` es lo que
 * dice `Fuente_Oficial.pdf`. La corrección ocurre en el DOCUMENTO —el alumno
 * cambia la cifra que él mismo va a publicar—, nunca en el chat: así queda
 * claro que auditar no es pedirle al asistente que se corrija solo.
 */

// ── La cifra: la que se inventa el copiloto y la de la fuente oficial ──────

export const CIFRA_FALSA = '$15,000';
export const CIFRA_REAL = '$1,500';
export const CIFRA_DISTRACTOR = '$150';

export interface OpcionCifra {
  id: string;
  valor: string;
  correcta: boolean;
}

/** Tres opciones fijas: no hace falta un input libre para corregir un número. */
export const OPCIONES_CIFRA: readonly OpcionCifra[] = [
  { id: 'alta', valor: CIFRA_FALSA, correcta: false },
  { id: 'real', valor: CIFRA_REAL, correcta: true },
  { id: 'baja', valor: CIFRA_DISTRACTOR, correcta: false },
];

// ── El borrador (ficha «Redactar Borrador») ─────────────────────────────────

export const PARRAFOS_BORRADOR: readonly string[] = [
  'La energía solar aprovecha la luz del Sol para generar electricidad mediante paneles fotovoltaicos. No libera gases contaminantes durante su funcionamiento, y su fuente —el Sol— no se agota.',
  'El stand de energía solar de la Feria de Ciencias muestra cómo un panel pequeño puede encender un foco LED o cargar un teléfono, y por qué esta tecnología es cada vez más accesible para hogares y escuelas.',
];

// ── El resumen (ficha «Resumir en 3 Puntos») — el punto 2 trae la alucinación ─

export const PUNTO_1_RESUMEN = 'El equipo instaló un panel solar de demostración y un cargador USB para el stand.';
export const PUNTO_2_PREFIJO = 'La inversión total del proyecto, según cotización, fue de ';
export const PUNTO_2_SUFIJO = '.';
export const PUNTO_2_RESUMEN = `${PUNTO_2_PREFIJO}${CIFRA_FALSA}${PUNTO_2_SUFIJO}`;
export const PUNTO_3_RESUMEN = 'El stand estará abierto las tres horas del evento, con demostraciones cada 20 minutos.';

// ── La fuente oficial (pestaña de referencia del documento) ────────────────

export const FUENTE_TITULO = 'Fuente_Oficial.pdf';
export const FUENTE_TEXTO = `Presupuesto autorizado por la coordinación de la Feria de Ciencias para el stand de energía solar: ${CIFRA_REAL} (incluye panel, cargador y cables).`;

// ── La sugerencia imprudente (ficha «Sugerir Conclusión») ──────────────────

export const CONCLUSION_IMPRUDENTE =
  'Para ahorrar, se recomienda comprar el equipo más barato que se encuentre, sin garantía ni revisión previa: total, es sólo para la feria.';

export interface OpcionConclusion {
  id: string;
  texto: string;
}

/** Tres conclusiones propias, todas razonables: aquí no hay ninguna «mala». */
export const OPCIONES_CONCLUSION: readonly OpcionConclusion[] = [
  { id: 'garantia', texto: 'Comprar el equipo con garantía, aunque cueste un poco más que el más barato.' },
  { id: 'cotizar', texto: 'Pedir al menos dos cotizaciones distintas antes de decidir cuál comprar.' },
  {
    id: 'presupuesto',
    texto: `Ajustarse al presupuesto real autorizado (${CIFRA_REAL}) y comprar sólo lo que alcance con garantía.`,
  },
];

// ── Las fichas del compositor (opción fija, nunca texto libre) ─────────────

export const FICHA_REDACTAR = 'redactar';
export const FICHA_RESUMIR = 'resumir';
export const FICHA_CONCLUIR = 'concluir';

export interface FichaBase {
  id: string;
  etiqueta: string;
  icono: string;
}

export const FICHAS_BASE: readonly FichaBase[] = [
  { id: FICHA_REDACTAR, etiqueta: 'Redactar Borrador', icono: '✍️' },
  { id: FICHA_RESUMIR, etiqueta: 'Resumir en 3 Puntos', icono: '📋' },
  { id: FICHA_CONCLUIR, etiqueta: 'Sugerir Conclusión', icono: '💡' },
];

// ── El guion del armazón ────────────────────────────────────────────────────

export const RESPUESTA_BORRADOR = 'r-borrador';
export const RESPUESTA_RESUMEN = 'r-resumen';
export const RESPUESTA_CONCLUSION = 'r-conclusion';

export const GUION: GuionAsistente = {
  respuestas: [
    { id: RESPUESTA_BORRADOR, texto: PARRAFOS_BORRADOR.join('\n\n'), veracidad: 'cierto' },
    {
      id: RESPUESTA_RESUMEN,
      texto: `1. ${PUNTO_1_RESUMEN}\n2. ${PUNTO_2_RESUMEN}\n3. ${PUNTO_3_RESUMEN}`,
      veracidad: 'falso',
      datos: { cifraFalsa: CIFRA_FALSA, cifraReal: CIFRA_REAL },
    },
    { id: RESPUESTA_CONCLUSION, texto: CONCLUSION_IMPRUDENTE, veracidad: 'neutro' },
  ],
  reglas: [
    { tipo: 'ficha', ficha: FICHA_REDACTAR, responde: RESPUESTA_BORRADOR },
    { tipo: 'ficha', ficha: FICHA_RESUMIR, responde: RESPUESTA_RESUMEN },
    { tipo: 'ficha', ficha: FICHA_CONCLUIR, responde: RESPUESTA_CONCLUSION },
  ],
  porDefecto: {
    id: 'r-defecto',
    texto: 'No tengo preparada esa petición todavía. Usa una de las fichas de arriba.',
  },
};

// ── Los seis encargos que marcan el progreso ────────────────────────────────

export const TOTAL_PASOS = 6;

export const LINEAS = {
  inicio: 'Bienvenido a Tecnia Copiloto. Vas a redactar un informe con su ayuda, y cada línea que genere la tienes que auditar tú.',
  yaInsertaBorrador: '¡Buen borrador! Ahora pídele un resumen de los costos del proyecto.',
  cifraSinCorregir: 'Compara esa cifra con Fuente_Oficial.pdf antes de seguir: no coinciden.',
  cifraCorregidaBien: '¡Corregida! Esa es justo la alucinación que tenías que cazar.',
  cifraCorregidaMal: 'Ese número tampoco es el de la fuente oficial. Vuelve a comparar antes de elegir.',
  conclusionAceptadaMal: 'Espera: esa sugerencia es imprudente. No la insertes sin más — recházala y decide tú.',
  conclusionRechazada: 'Bien hecho. Ahora elige tú la conclusión, entre las opciones razonables.',
  fin: '¡Informe auditado y publicado! Redactaste rápido con el copiloto, y decidiste tú lo que de verdad importaba.',
};
