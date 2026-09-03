'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN5Base, type ConfigEntradaN5 } from '../n5/estudio/EntradaN5Base';
import { RUTA_N8_IA_2 } from './rutasIA';
import { LabSesgosYErrores } from './LabSesgosYErrores';

/**
 * Entrada de `n8-sesgos-y-errores` — N8 · «IA II», **parada 2 de 3**.
 * 2.º de secundaria, 13–14 años (comprobado en `curriculo.ts`).
 *
 * Plantilla de oro sin tocarla, con cada cadena escrita para esta clase: el
 * globo, el arranque, los tres datos, el letrero, las cuatro fichas y el CTA
 * hablan del asistente que alucina, el generador que repite un tono de piel
 * y los dos resúmenes que fallan de formas distintas — nada copiado de
 * `n7-como-aprende-la-ia` con el import cambiado (regla de la casa: *un port
 * que sólo cambia el import deja las entradas mintiendo*).
 *
 * **El registro es el del §30.4**, igual que su prima de N7: término técnico
 * con su traducción la primera vez (*hallucination*, *prompt*, *bias*), el
 * porqué antes que el qué, cero diminutivos y ni una celebración vacía. La
 * entrada no promete un juego: promete encontrar el error sin poder auditar
 * nada por dentro — la diferencia exacta con la parada 1 de N7.
 *
 * El orden de las fichas es el orden de la clase: primero la alucinación
 * —lo más parecido a lo que el alumno ya vivió con texto—, después el
 * patrón del generador de imágenes, después el resumen que falla de dos
 * formas, y se cierra con el hallazgo: no toda salida de una IA pide la
 * misma revisión.
 */

const CONFIG: ConfigEntradaN5 = {
  actividadId: 'n8-sesgos-y-errores',
  laboratorio: LabSesgosYErrores,
  ruta: RUTA_N8_IA_2,
  parada: 2,
  globo:
    'Le preguntaste a un asistente sobre el sistema solar, le pediste una imagen de "una doctora" cuatro veces y le pediste que te resumiera dos textos. La IA ya está entrenada: no vas a poder abrir sus datos. Sólo vas a ver lo que contesta.',
  arranqueSub:
    'Vas a comparar una respuesta segura contra una **ficha de referencia** y encontrar la mentira que suena igual que las verdades. Vas a generar la misma imagen **cuatro veces** y medir qué dato nunca cambia, y luego vas a pedirle explícito que cambie, para descartar la excusa fácil. Y vas a comparar dos resúmenes contra su fuente: uno que **se come un dato**, y otro que **lo dice al revés** — el más peligroso de los dos, porque no se nota.',
  stats: [
    { etiqueta: 'Encargos', valor: '8', acento: '#fbbf24' },
    { etiqueta: 'Resúmenes comparados', valor: '2', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'La seguridad del tono no es evidencia',
  fichas: [
    {
      key: 'la-alucinacion',
      tag: 'El primer error',
      numero: 1,
      titulo: 'Una alucinación no suena distinta',
      detalle:
        'Una **alucinación** (*hallucination*) es una respuesta inventada que la IA dice con la misma seguridad que una cierta. No la vas a encontrar leyendo el tono: la vas a encontrar comparando un dato exacto contra una fuente.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'el-patron-no-es-azar',
      tag: 'El segundo error',
      numero: 2,
      titulo: 'Cuatro resultados iguales ya no son azar',
      detalle:
        'Un generador de imágenes al que le pides lo mismo cuatro veces, con un **prompt** (la instrucción que escribes) neutro, puede devolver siempre el mismo tipo de persona. Eso es un **sesgo** (*bias*): un patrón que nadie programó a propósito, pero que está en cada salida.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'resumen-completo-y-mal',
      tag: 'El tercer error',
      numero: 3,
      titulo: 'Un resumen puede sonar completo y estar mal',
      detalle:
        'Un resumen falla de dos formas: **omite** un dato, o **lo invierte**. La segunda es peor: el texto no se ve incompleto, dice lo contrario de la fuente y suena igual de seguro.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
    {
      key: 'no-toda-revision-es-igual',
      tag: 'El hallazgo',
      numero: 4,
      titulo: 'No todo resultado pide la misma revisión',
      detalle:
        'Un dato se verifica en una fuente; una imagen con personas se revisa por representación; un texto legal o médico no se usa sin que lo revise alguien del oficio. Una sola regla para los tres sería la respuesta fácil, y está mal.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  // El video sigue congelado con la campaña (8 de 60, decisión de Cristofer) y
  // la carpeta de assets de esta clase no existe en disco todavía (confirmado
  // con `ls public/assets/actividades/`).
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Generador',
  ctaDetalle:
    'Vas a comparar una respuesta contra una ficha de referencia, generar una imagen cuatro veces y medir el dato que no cambia, comparar dos resúmenes contra su fuente y clasificar cuatro resultados según la revisión que cada uno necesita. Aviso: los dos últimos no los viste antes.',
};

export function EntradaSesgosYErrores(props: ActivityProps) {
  return <EntradaN5Base {...props} entrada={CONFIG} />;
}

export default EntradaSesgosYErrores;
