'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN5Base, type ConfigEntradaN5 } from '../n5/estudio/EntradaN5Base';
import { RUTA_N8_IA_2 } from './rutasIA';
import { LabGeneraConIa } from './LabGeneraConIa';

/**
 * Entrada de `n8-genera-con-ia` — N8 · «IA II», **parada 1 de 3**.
 * 2.º de secundaria, 13–14 años (comprobado en `curriculo.ts`).
 *
 * Misma base y mismo patrón que `EntradaComoAprendeLaIa` (N7): `EntradaN5Base`,
 * no `EntradaN4Base` — así viven las entradas de esta carpeta compartida de
 * IA (confirmado con `grep -n "EntradaN5Base" EntradaComoAprendeLaIa.tsx`).
 * Cada cadena está escrita para esta clase: nada de reciclar el globo, las
 * fichas o el CTA de `n6-crea-con-ia` (Diseño y multimedia, 6.º de primaria,
 * otro registro) ni de `n7-como-aprende-la-ia` (otra unidad).
 *
 * **El registro es el del §30.4**, el mismo que exige `EntradaComoAprendeLaIa`:
 * término técnico con su traducción la primera vez (*prompt*, *alucinación*,
 * *voz clonada*), el porqué antes que el qué, cero diminutivos y ni una
 * celebración vacía. La entrada no promete un juego: promete una redacción
 * con criterio editorial.
 */

const CONFIG: ConfigEntradaN5 = {
  actividadId: 'n8-genera-con-ia',
  laboratorio: LabGeneraConIa,
  ruta: RUTA_N8_IA_2,
  parada: 1,
  globo:
    'El comité de la Semana de la Ciencia te encargó tres piezas para el mismo evento: un artículo, una imagen y un anuncio. Las tres se generan — y las tres se pueden pedir mal.',
  arranqueSub:
    'Un generador no busca: fabrica. Vas a pedir el mismo encargo dos veces —vago y con precisión— en **texto, imagen y audio**, y vas a ver la misma distancia las tres veces. Después vas a descubrir que «sin ningún error» **no es lo mismo** que «seguro de publicar», y que hay una petición —clonar una voz real— que el generador se niega a cumplir.',
  stats: [
    { etiqueta: 'Encargos', valor: '10', acento: '#fbbf24' },
    { etiqueta: 'Formatos generados', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Pedir poco sale flojo. Pedir bien no siempre sale seguro',
  fichas: [
    {
      key: 'vago-vs-preciso',
      tag: 'Lo primero',
      numero: 1,
      titulo: 'La misma petición, dos veces',
      detalle:
        'Pedido con lo mínimo, un generador entrega algo genérico o **falso dicho con seguridad** — eso se llama alucinación (*hallucination*). Pedido con precisión, mejora. Lo vas a ver en texto, en imagen y en audio.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'sin-error-no-es-seguro',
      tag: 'El giro',
      numero: 2,
      titulo: 'Sin ningún error no es lo mismo que seguro',
      detalle:
        'De tres imágenes sin defecto de dibujo, una hay que rechazarla igual: es tan realista que **se puede confundir con una persona real** que no existe. El criterio ya no es la calidad — es el riesgo.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'la-peticion-que-se-niega',
      tag: 'El límite',
      numero: 3,
      titulo: 'Hay una petición que no se cumple',
      detalle:
        'Clonar la voz de una persona real e identificable sin su permiso —una voz clonada (*voice cloning*)— no está disponible, aunque la tecnología exista. El generador se niega, y está bien que se niegue.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
    {
      key: 'publicar-es-otra-decision',
      tag: 'El cierre',
      numero: 4,
      titulo: 'Publicar es una decisión aparte',
      detalle:
        'Un texto con una cifra citada no está verificado: **está listo para verificar**. Generar termina en un borrador; revisarlo antes de publicarlo lo haces tú, no el generador.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Multimedia',
  ctaDetalle:
    'Diez encargos: dos peticiones por formato, una elección con riesgo real, una petición que el generador rechaza, y un veredicto final sobre qué se publica y qué se revisa antes.',
  // El video de esta clase sigue pausado (campaña de videos, 8 de 60, decisión
  // de Cristofer) y las láminas de las fichas todavía no existen.
  assetsPendientes: false,
};

export function EntradaGeneraConIa(props: ActivityProps) {
  return <EntradaN5Base {...props} entrada={CONFIG} />;
}

export default EntradaGeneraConIa;
