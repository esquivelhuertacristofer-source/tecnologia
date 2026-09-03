'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { paradaM365, rutaM365 } from '../comun/rutas';
import { Lab } from './Lab';

/**
 * Entrada de `of-m365-copiloto` — «Qué hace y qué no hace un copiloto» (§58.3).
 *
 * Plantilla de oro sin tocarla: video, tres datos, letrero, fichas de color
 * pleno, CTA gigante y ruta. La ruta sale de `comun/rutas.ts` (grado
 * Avanzado de la sala M365), compartida con `of-m365-otra-caja`: no se
 * escribe a mano.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/of-m365-copiloto/video-explicativo.mp4` y la bandera bajó a
 * `assetsPendientes: false`. OJO si escribes pruebas: con el video puesto, el
 * primer `<button>` del documento ya no es el CTA sino el de la portada, así
 * que no lo busques por posición — búscalo por su texto.
 *
 * Las cuatro fichas van en el orden en que el laboratorio las necesita: qué
 * es un copiloto, el riesgo de la alucinación, el lema que sostiene la clase
 * entera, y por qué esta simulación contesta con fichas fijas y nunca con un
 * modelo de verdad.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-m365-copiloto',
  laboratorio: Lab,
  ruta: rutaM365('avanzado'),
  parada: paradaM365('avanzado', 'of-m365-copiloto'),
  globo: '¡Hola! Soy Bit. La inteligencia artificial redacta rapidísimo, pero a veces inventa cosas sin pestañear. ¡Vamos a auditar su trabajo!',
  arranqueSub:
    'Vas a abrir Tecnia Documentos con Tecnia Copiloto a un costado. Le vas a pedir un borrador y un resumen para el informe de la Feria de Ciencias, y vas a auditar cada respuesta: una cifra del resumen no coincide con la fuente oficial, y hay que corregirla a mano en el documento. Al final, el copiloto sugiere una conclusión imprudente que tienes que rechazar y sustituir por la tuya. Sólo puedes publicar cuando las dos cosas queden resueltas.',
  stats: [
    { etiqueta: 'Borrador', valor: '1', acento: '#22d3ee' },
    { etiqueta: 'Alucinación', valor: '1', acento: '#fb7185' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Auditoría de IA en Ofimática',
  fichas: [
    {
      key: 'que-es',
      tag: 'Qué es',
      numero: 1,
      titulo: 'Un copiloto, no un piloto automático',
      detalle:
        'Un copiloto de IA integrado en un programa de oficina te ayuda a arrancar: escribe un primer borrador, resume un texto largo o sugiere una fórmula. No piensa como tú: analiza patrones de lenguaje y genera texto según probabilidades.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'riesgo',
      tag: 'El riesgo',
      numero: 2,
      titulo: 'La alucinación',
      detalle:
        'A veces el copiloto inventa una cifra, una fecha o un dato falso… y lo dice con el mismo tono seguro que usa para lo que sí es verdad. Por eso nunca hay que copiar y pegar sin leer.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
    {
      key: 'lema',
      tag: 'El lema',
      numero: 3,
      titulo: 'Propone, tú decides',
      detalle:
        'El copiloto no sustituye tu criterio ni tu firma. Cada respuesta es una sugerencia: tú eres quien verifica, corrige y decide qué se publica.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'como-se-ve',
      tag: 'Cómo se ve aquí',
      numero: 4,
      titulo: 'Un chat con fichas, no una caja mágica',
      detalle:
        'En este laboratorio el copiloto contesta con fichas de opción fija —nunca escribes texto libre— y sus respuestas ya están escritas de antemano. Así practicas el hábito de auditar sin depender de ninguna conexión.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Copiloto',
  ctaDetalle:
    'Vas a pedirle a Tecnia Copiloto un borrador y un resumen para el informe de la Feria de Ciencias. Uno de los tres puntos del resumen trae una cifra que no es la real: tu trabajo es compararla con la fuente oficial, corregirla en el documento, y rechazar una sugerencia final imprudente antes de publicar.',
};

export function Entrada(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default Entrada;
