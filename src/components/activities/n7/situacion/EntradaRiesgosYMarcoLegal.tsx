'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN7SituacionBase, ConfigEntradaN7Situacion, RUTA_N7_CIUDADANIA_DIGITAL_CRITICA } from './EntradaN7SituacionBase';
import { LabRiesgosYMarcoLegal } from './LabRiesgosYMarcoLegal';

/**
 * Entrada de N7·«Ciudadanía digital crítica», parada 2 de 3 — «Riesgos en
 * línea y marco legal». Nivel 7 = 1.º de Secundaria, 12–13 años (verificado
 * en `src/data/curriculo.ts:697` y `:774`).
 *
 * ES LA ACTIVIDAD MÁS DELICADA DE N7: trata grooming, difusión no consentida
 * de contenido íntimo (Ley Olimpia) y sextorsión. Construida a partir de
 * `DISENO-N7-n7-riesgos-y-marco-legal.md` (pliego ya revisado por el
 * coordinador) — todo el texto de las conversaciones, el radar de señales y
 * las fichas legales de `LabRiesgosYMarcoLegal.tsx` es **copia literal** de
 * ese documento, no redacción nueva.
 *
 * El programa que el alumno abre aquí es «Tecnia Mensajes» — la MISMA app de
 * `n4-si-algo-me-incomoda`, reutilizando `mensajesApp.css` por import — no
 * «Tecnia Muro» como sus dos hermanas de unidad: el contenido de esta clase
 * son conversaciones privadas, no publicaciones (§2.1 del pliego). El
 * armazón #17 NO se extrae en este encargo — `LabSiAlgoMeIncomoda.tsx` no se
 * toca — la máquina de guion se reescribe local dentro de este mismo
 * paquete (pliego §2.3).
 */

const CONFIG: ConfigEntradaN7Situacion = {
  actividadId: 'n7-riesgos-y-marco-legal',
  laboratorio: LabRiesgosYMarcoLegal,
  ruta: RUTA_N7_CIUDADANIA_DIGITAL_CRITICA,
  parada: 2,
  globo:
    'Hoy vamos a hablar de tres cosas que a veces pasan en línea y que no están bien. No vas a ver nada feo: vas a aprender a reconocer el patrón antes de que avance, y a saber exactamente a quién acudir. Y si en algún momento quieres parar, el botón de salir está siempre arriba.',
  arranqueSub:
    'Tres conversaciones, seis señales y una mesa con lo que dice la ley. Nunca estás obligado a seguir: el botón de salir está siempre arriba.',
  stats: [
    { etiqueta: 'Señales que vas a aprender', valor: '6', acento: '#22d3ee' },
    { etiqueta: 'Casos', valor: '3', acento: '#a78bfa' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Reconocer el patrón antes de que avance',
  fichas: [
    {
      key: 'como-se-reconoce',
      tag: 'Cómo reconocer',
      numero: 1,
      titulo: 'Se reconoce por cómo se acercan',
      detalle: 'No por lo que acaban pidiendo. Con **una** señal ya basta para cortar.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'nadie-pide-secreto',
      tag: 'La señal que no se deja pasar',
      numero: 2,
      titulo: 'Nadie te puede pedir secreto',
      detalle: 'Tenga la edad que tenga. Ésa es la señal que nunca se deja pasar.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'guarda-la-prueba',
      tag: 'Antes de bloquear',
      numero: 3,
      titulo: 'Guarda la prueba antes de borrar',
      detalle: 'Una captura. Si borras, se pierde lo único que un adulto podría usar.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'leyes-de-tu-lado',
      tag: 'El marco legal',
      numero: 4,
      titulo: 'Hay leyes que están de tu lado',
      detalle: 'Y oficinas cuyo trabajo es protegerte. No es un favor: es tu derecho.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Mensajes',
  ctaDetalle: 'Tres conversaciones, seis señales y una mesa con lo que dice la ley. Nunca estás obligado a seguir: el botón de salir está siempre arriba.',
  assetsPendientes: false,
};

export function EntradaRiesgosYMarcoLegal(props: ActivityProps) {
  return <EntradaN7SituacionBase {...props} entrada={CONFIG} />;
}

export default EntradaRiesgosYMarcoLegal;
