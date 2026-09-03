'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { RUTA_N10_IA_DATOS } from '../ia-modelos/rutaIaDatosN10';
import { LabFlujosConIa } from './LabFlujosConIa';

/**
 * Entrada de `n10-flujos-con-ia` — N10 · «IA y ciencia de datos», **parada 2
 * de 3**. La ruta se importa de sólo lectura desde `rutaIaDatosN10.ts`
 * (creada por la parada 1): esta unidad ya tiene un archivo de ruta
 * compartido, a diferencia de otras unidades de N10 que derivan su propia
 * copia con `getUnidad()`. La parada 3 (`n10-etica-y-regulacion`) importa el
 * mismo archivo.
 *
 * N10 = Bachillerato, 15–18 años, tono «Perfil profesional»: sin
 * diminutivos, registro corporativo.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n10-flujos-con-ia/video-explicativo.mp4` y la bandera bajó a
 * `assetsPendientes: false`. OJO si escribes pruebas: con el video puesto, el
 * primer `<button>` del documento ya no es el CTA sino el de la portada, así
 * que no lo busques por posición — búscalo por su texto.
 */

const ACTIVIDAD = 'n10-flujos-con-ia';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabFlujosConIa,
  ruta: RUTA_N10_IA_DATOS,
  parada: Math.max(1, RUTA_N10_IA_DATOS.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo:
    'La Mesa de Soporte de TecniMarket quiere usar un asistente de IA generativa para armar su reporte semanal a gerencia. Hoy no vas a auditar ningún modelo: vas a diseñar el flujo — qué paso puede seguir la IA sola, cuál necesita que una persona confirme antes de continuar, y cuál no se delega nunca.',
  arranqueSub:
    'Vas a clasificar los **seis pasos reales** del flujo con una sola regla —nunca con una tabla de respuestas memorizadas— y a comprobar que esa regla sirve incluso para un paso que no habías visto. Vas a encadenar dos peticiones reales a Tecnia Asistente —un resumen interno, un borrador de correo— y en las dos vas a cazar un dato inventado **distinto** antes de que llegue a gerencia. Y vas a medir qué se pierde de verdad cuando se automatiza un paso sin dejarle su punto de control.',
  stats: [
    { etiqueta: 'Encargos', valor: '8', acento: '#818cf8' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
    { etiqueta: 'Nivel', valor: 'Profesional', acento: '#a78bfa' },
  ],
  letrero: 'Un flujo no se automatiza entero o nada: se decide eslabón por eslabón',
  fichas: [
    {
      key: 'sin-punto-de-control',
      tag: 'Decisión 1',
      numero: 1,
      titulo: 'Un paso puede seguir solo hasta el siguiente',
      detalle:
        'Cuando un resultado es interno, se puede deshacer y hay con qué comprobarlo después, la IA no necesita que nadie la detenga a medio camino — eso no significa que nunca se verifique.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'revision-humana',
      tag: 'Decisión 2',
      numero: 2,
      titulo: 'Un paso detiene el flujo hasta que alguien confirma',
      detalle:
        'Basta con que uno solo de tres datos falle —irreversible, no verificable o le llega a alguien fuera del equipo— para que el flujo tenga que esperar a una persona (revisión humana, o *human in the loop*).',
      acento: { c: '#f5a524', deep: '#92400e' },
    },
    {
      key: 'no-se-delega',
      tag: 'Decisión 3',
      numero: 3,
      titulo: 'Algunas decisiones le pertenecen a una persona',
      detalle:
        'Responder sobre el caso concreto de un cliente, o prometer algo que compromete a la empresa, no se le pide nunca a un asistente de IA — sin importar qué tan bien redacte.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
    {
      key: 'riesgo-de-cadena',
      tag: 'Decisión 4',
      numero: 4,
      titulo: 'Revisar un eslabón una vez no vacuna al siguiente',
      detalle:
        'El resumen interno y el borrador del correo trajeron cada uno su propio dato inventado, distinto entre sí. Automatizar de más no ahorra tiempo si quita el punto exacto donde antes se atajaba el error.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Entra a Tecnia Asistente',
  ctaDetalle:
    'Ocho encargos: clasifica los seis pasos del flujo del reporte semanal, escribe la petición del resumen interno y cázale su dato inventado, pide el borrador del correo y cázale otro distinto, mide el riesgo real de saltarte ese punto de control, aplica la misma regla a un paso nuevo, y cierra con la síntesis. Equivocarte resta puntos; las mismas opciones se quedan activas para volver a intentar.',
};

export function EntradaFlujosConIa(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaFlujosConIa;
