'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN5Base, type ConfigEntradaN5 } from '../n5/estudio/EntradaN5Base';
import { RUTA_N7_IA_1 } from './rutasIA';
import { LabComoAprendeLaIa } from './LabComoAprendeLaIa';

/**
 * Entrada de `n7-como-aprende-la-ia` — N7 · «IA I», **parada 1 de 3**.
 * 1.º de secundaria, 12–13 años (comprobado en `curriculo.ts`).
 *
 * Plantilla de oro sin tocarla, y **con cada cadena escrita para esta clase**:
 * el globo, el arranque, los tres datos, el letrero, las cuatro fichas y el CTA
 * hablan del lote de abril, del acta de recolección y de la brecha. Comparte la
 * base y la ruta con las paradas 2 y 3, y nada más: *un port que sólo cambia el
 * import deja las entradas mintiendo.*
 *
 * **El registro es el del §30.4**, no el de las clases de primaria de esta misma
 * carpeta: término técnico con su traducción la primera vez (*label*, *feature*,
 * *bias*), el porqué antes que el qué, cero diminutivos y ni una celebración
 * vacía. La entrada no promete un juego: promete una auditoría.
 *
 * El orden de las fichas es el de la clase y es un argumento, no una lista: se
 * abre por lo que es un dato de entrenamiento, sigue por quién escribe la
 * etiqueta —que es de donde sale todo lo demás—, después el examen que se
 * examina a sí mismo, y se cierra con el hallazgo: el sesgo estaba en el acta de
 * recolección, no en el código.
 */

const CONFIG: ConfigEntradaN5 = {
  actividadId: 'n7-como-aprende-la-ia',
  laboratorio: LabComoAprendeLaIa,
  ruta: RUTA_N7_IA_1,
  parada: 1,
  globo:
    'El colegio va a instalar una banda que separa la basura sola. Nadie va a escribir sus reglas: se entrena con lo que el Comité de Acopio recogió en abril. Y tú respondes por esos datos.',
  arranqueSub:
    'Vas a auditar **28 fichas** antes de entrenar nada, repartirlas en estudio y examen, y leer el modelo que salga: qué aprendió, qué memorizó y **por dónde se va a romper**, sabido antes de probarlo. Después lo sueltas contra una semana real. El examen te habrá dado **100 %** y en la calle acertará **70 %**, con un grupo entero al cero. Nadie programó ese sesgo: está escrito en el acta de recolección, y vas a encontrarlo.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#22d3ee' },
    { etiqueta: 'Fichas', valor: '28', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'El modelo no puede saber más que sus datos',
  fichas: [
    {
      key: 'que-es-un-dato',
      tag: 'Lo primero',
      numero: 1,
      titulo: 'Un ejemplo son dos cosas, y ya',
      detalle:
        'Un **ejemplo de entrenamiento** es un puñado de **rasgos** (*features*) —lo único que el sensor mide— más una **etiqueta** (*label*), que es la respuesta que el modelo tendrá que dar solo. Nada más. Lo que no esté en esas columnas, para el modelo **no existe**.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'la-escribio-alguien',
      tag: 'De dónde viene',
      numero: 2,
      titulo: 'La etiqueta no se mide: la escribe una persona',
      detalle:
        'Ningún sensor sabe a qué contenedor va un envase; eso es una **decisión**. Ana y Luis la escribieron a mano, envase por envase, un viernes por la tarde. Si se equivocaron, el modelo **aprende el error**: si está en la tabla, para él es la verdad.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'el-examen-heredado',
      tag: 'La trampa',
      numero: 3,
      titulo: 'Un examen no puede preguntar lo que no tiene',
      detalle:
        'Apartar fichas para examinar es lo correcto, y **no basta**: esas fichas salen del mismo montón, así que **heredan sus huecos**. Un 100 % ahí no dice que el modelo funcione. Dice que funciona en el mundo del que salieron tus datos.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
    {
      key: 'el-sesgo-sin-autor',
      tag: 'El hallazgo',
      numero: 4,
      titulo: 'El sesgo no lo programó nadie',
      detalle:
        'Un **sesgo** (*bias*) en los datos es una diferencia sistemática entre lo que recogiste y el mundo donde vas a soltar el modelo. No hace falta mala intención: basta recoger en **un solo punto, media hora al día, una sola semana** en la que el proveedor falló.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  // El video sigue congelado con la campaña (8 de 60, decisión de Cristofer) y
  // las láminas de las fichas todavía no existen: la entrada lo dice en pantalla
  // en vez de cargar un reproductor roto.
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Entrena',
  ctaDetalle:
    'Vas a auditar el lote de abril, repartirlo, entrenar, leer lo que aprendió y lo que memorizó, probarlo contra la semana real, medir la brecha entre grupos y elegir cuál de tres lotes de datos nuevos arregla el modelo. Aviso: el más grande no es el bueno.',
};

export function EntradaComoAprendeLaIa(props: ActivityProps) {
  return <EntradaN5Base {...props} entrada={CONFIG} />;
}

export default EntradaComoAprendeLaIa;
