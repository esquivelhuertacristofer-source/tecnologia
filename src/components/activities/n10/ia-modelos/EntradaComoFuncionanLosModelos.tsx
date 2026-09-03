'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { RUTA_N10_IA_DATOS } from './rutaIaDatosN10';
import { LabComoFuncionanLosModelos } from './LabComoFuncionanLosModelos';

/**
 * Entrada de `n10-como-funcionan-los-modelos` — N10 · «IA y ciencia de
 * datos», **parada 1 de 3**. Unidad 100% nueva: la ruta se deriva de
 * `curriculo.ts` en `rutaIaDatosN10.ts`, no se copia a mano.
 *
 * N10 = Bachillerato, 15–18 años, tono «Perfil profesional»: sin
 * diminutivos, registro corporativo.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n10-como-funcionan-los-modelos/video-explicativo.mp4` y la bandera bajó a
 * `assetsPendientes: false`. OJO si escribes pruebas: con el video puesto, el
 * primer `<button>` del documento ya no es el CTA sino el de la portada, así
 * que no lo busques por posición — búscalo por su texto.
 */

const ACTIVIDAD = 'n10-como-funcionan-los-modelos';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabComoFuncionanLosModelos,
  ruta: RUTA_N10_IA_DATOS,
  parada: Math.max(1, RUTA_N10_IA_DATOS.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo:
    'La Mesa de Soporte de TecniMarket construyó un clasificador interno que sugiere la prioridad de cada ticket entrante. Hoy no lo vas a usar: vas a auditarlo de punta a punta — separar sus datos, leer las reglas que aprendió, encontrar dónde se queda ciego y medir, con un número, dónde falla por grupo.',
  arranqueSub:
    'Vas a correr el **pipeline completo** de un modelo real: auditar 27 tickets antes de entrenar nada, separar entrenamiento y examen, leer el árbol de decisión que produce el entrenamiento —qué regla es memoria pura y cuál generaliza—, encontrar su punto ciego **antes de probarlo**, y medir contra una semana de campo real una brecha de **1,00**: un grupo entero al 0 % de acierto. Y vas a demostrar, con un segundo modelo, que hay preguntas que un árbol de decisión, con sus ajustes de fábrica, **no puede aprender** — no porque falten datos, sino porque el método mismo tiene un límite.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
    { etiqueta: 'Nivel', valor: 'Profesional', acento: '#a78bfa' },
  ],
  letrero: 'Un modelo no se evalúa por su acierto total, sino por dónde se rompe',
  fichas: [
    {
      key: 'memoria-no-es-aprendizaje',
      tag: 'Límite 1',
      numero: 1,
      titulo: 'Una regla con un solo ejemplo es memoria, no aprendizaje',
      detalle:
        'Un árbol de decisión no distingue una regla que **generalizó** de una que **memorizó** (overfitting): las aplica con la misma seguridad. El apoyo de cada regla —cuántos ejemplos la sostienen— es lo único que lo delata.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'el-punto-ciego',
      tag: 'Límite 2',
      numero: 2,
      titulo: 'Un punto ciego se conoce antes de probar nada',
      detalle:
        'Cuando el entrenamiento nunca vio una combinación, el modelo **no se queda callado**: contesta la opción más repetida del grupo donde se atascó, con la confianza que le den esos ejemplos. El informe del árbol lo dice antes de que nadie lo pruebe.',
      acento: { c: '#f5a524', deep: '#92400e' },
    },
    {
      key: 'la-brecha-por-grupo',
      tag: 'Límite 3',
      numero: 3,
      titulo: 'El acierto total puede esconder un grupo entero al cero',
      detalle:
        'Un 71 % de acierto general suena razonable hasta que se mide **por grupo**: un área puede estar en 0 % mientras las demás dan 100 %. La brecha (bias) no siempre nace de mala intención — a veces la programa el calendario de una campaña.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
    {
      key: 'limite-del-metodo',
      tag: 'Límite 4',
      numero: 4,
      titulo: 'Un árbol pregunta un rasgo a la vez, y eso tiene un costo',
      detalle:
        'Cuando dos rasgos sólo predicen juntos —una interacción (feature interaction)—, un árbol de decisión con sus ajustes de fábrica se rinde en la raíz y contesta siempre lo mismo. No es un problema de datos: es un límite del propio método.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Entra a Tecnia Modelos',
  ctaDetalle:
    'Vas a auditar el banco de tickets, separar entrenamiento y examen, leer las reglas del árbol y su punto ciego, medir la brecha del examen de campo, y entrenar un segundo modelo dos veces —con y sin la opción `insistir`— para ver, con tus propios ojos, el límite exacto del método. Equivocarte resta puntos; las mismas opciones se quedan activas para volver a intentar.',
};

export function EntradaComoFuncionanLosModelos(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaComoFuncionanLosModelos;
