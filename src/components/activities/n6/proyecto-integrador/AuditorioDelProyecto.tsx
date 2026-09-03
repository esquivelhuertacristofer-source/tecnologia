'use client';

import type { EscenarioProps } from '@/components/office/VentanaDiapositivas';
import { Auditorio, type DecisionEnEscena, type OpcionDecision } from '@/components/office/auditorio/Auditorio';
import { AFIRMACIONES_SOSTENIDAS, afirmacionDe, fuentesEnElMazo } from './pruebas';

/**
 * `n6-proyecto-integrador` · Acto 3 (Presentar) · el público con sus tres preguntas.
 *
 * Envuelve `Auditorio` (§27.3) — no lo modifica, es «la sala de PowerPoint ya
 * cerrada» — y sólo aporta la `decision` que toca según `pasoId`. Siempre en
 * `acto="funcion"`: no hay ensayo en esta clase, los tres encargos SON la
 * función.
 *
 * **Dos de las tres decisiones leen el mazo, no un guion fijo** — es lo que
 * demuestra que el acto 3 integra y no repite un cuestionario:
 *
 * - La pregunta 7 lee `fuentesEnElMazo(mazo)`: la opción-trampa del anuncio
 *   sólo APARECE si el alumno de verdad lo pegó en el E6 («si además pegó el
 *   anuncio… reaparece en el E7», DISEÑO). Sin ella, tres alumnos que
 *   resolvieron el E6 sin el anuncio no tendrían ninguna trampa que
 *   contestar — y eso sería el predicado fijo que el riesgo nº1 advierte.
 * - La pregunta 9 lee `afirmacionDe(mazo)`: la propuesta correcta depende de
 *   lo que el alumno escribió en el E4, no está fija en ningún sitio.
 */

const DICE_SENALA = 'Enséñales la diapositiva donde está. Un proyecto se defiende señalando, no repitiendo.';

/**
 * Exportada aparte de `AuditorioDelProyecto`: es una función pura y se puede
 * probar contra un `Mazo` fabricado a mano, sin montar el `<Canvas>` de
 * `Auditorio` — que en jsdom no llega a pintar nada (`HTMLCanvasElement.
 * getContext` vuelve `null` en `jest.setup.ts`, a propósito y para todo el
 * proyecto). Es la misma idea que `motor-diapos.test.ts` ya aplica al resto
 * de los guiones de PowerPoint.
 */
export function decisionParaElPaso(pasoId: string | null, mazo: EscenarioProps['mazo']): DecisionEnEscena | null {
  if (pasoId === 'de-donde-sacaste-ese-numero') {
    const f = fuentesEnElMazo(mazo);
    const opciones: OpcionDecision[] = [];
    if (f.medicion) opciones.push({ texto: 'La medición que hizo nuestro grupo', bien: true, dice: DICE_SENALA });
    if (f.articuloFirmado) opciones.push({ texto: 'El artículo firmado y fechado', bien: true, dice: DICE_SENALA });
    // La trampa sólo aparece si de verdad la pegó en el E6 — el público
    // pregunta por lo que VE en la diapositiva, no por un guion fijo.
    if (f.anuncio) {
      opciones.push({
        texto: 'El anuncio de la marca de botes',
        dice: 'Ese es el anuncio que dejaste. No sostiene nada, y ellos lo vieron.',
      });
    }
    return { diapositiva: 4, pregunta: 'De dónde sacaste ese número', gesto: 'defender-fuente', opciones };
  }

  if (pasoId === 'y-en-las-otras-escuelas') {
    return {
      diapositiva: 4,
      pregunta: 'Y en las otras escuelas, ¿pasa igual?',
      gesto: 'eso-no-lo-medimos',
      opciones: [
        {
          texto: 'Sí, seguro que sí',
          dice: 'Tú mediste un salón, una semana. Piensa bien hasta dónde llega eso.',
        },
        {
          texto: 'Sí, porque lo decía la página que leí',
          dice: 'Esa página hablaba del país entero, no de tu salón.',
        },
        {
          texto: 'Eso no lo medimos: contamos un salón, una semana',
          bien: true,
          dice: 'Decir hasta dónde llega tu dato no es no saber. Es saber exactamente lo que sabes.',
        },
      ],
    };
  }

  if (pasoId === 'que-proponen') {
    const actual = afirmacionDe(mazo);
    const opciones: OpcionDecision[] = AFIRMACIONES_SOSTENIDAS.map((a) => ({
      texto: a.propuesta ?? a.texto,
      bien: actual !== null && a.id === actual.id,
      dice:
        actual !== null && a.id === actual.id
          ? 'Eso sale de tu propia gráfica. Eso es un proyecto.'
          : 'Esa propuesta es buenísima, pero tu gráfica no habla de eso.',
    }));
    return { diapositiva: 4, pregunta: 'Qué proponen', gesto: 'propuesta-correcta', opciones };
  }

  return null;
}

export function AuditorioDelProyecto(props: EscenarioProps) {
  return (
    <Auditorio
      {...props}
      acto="funcion"
      decision={decisionParaElPaso(props.pasoId, props.mazo)}
      entrada="Listo. Sube al escenario, que el público ya está sentado."
    />
  );
}

export default AuditorioDelProyecto;
