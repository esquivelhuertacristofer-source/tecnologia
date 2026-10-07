'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN5Base, type ConfigEntradaN5 } from '../n5/estudio/EntradaN5Base';
import { RUTA_N10_BASES_DE_DATOS_Y_SQL } from './rutasDatos';
import { LabConsultasSql } from './LabConsultasSql';

/**
 * Entrada de N10 · «Bases de datos y SQL», parada 2 de 3 · `n10-consultas-sql`.
 * **Bachillerato, 15–18 años** (comprobado en `curriculo.ts`). Mismo registro
 * que `n10-modela-tus-datos`: casi-adulto, sin celebración de acierto.
 *
 * El video **sí existe** desde el 18-ago-2026 —`video-explicativo.mp4`, 32
 * escenas— y aun así esta entrada siguió enseñando el aviso de «se está
 * grabando» hasta el 1-sep-2026, porque quien lo publicó no quitó de aquí el
 * `assetsPendientes`. La bandera y el archivo son dos hechos distintos y sólo
 * el archivo es el verdadero: si vuelves a tocar esto, comprueba el disco
 * (`public/assets/actividades/<id>/video-explicativo.mp4`) antes que el flag.
 *
 * Y desde el 2-sep-2026 esta entrada ES la que el registro monta. Estuvo
 * huérfana: `registry.ts` cargaba una segunda implementación de la misma
 * clase que vive en `n10/datos/`, escrita después y de otro tema. Si vuelves
 * a tocar el `load` de `n10-consultas-sql`, lee primero la nota que hay ahí.
 *
 * ── Reescrita el 12-sep-2026 (§68) ─────────────────────────────────────────
 *
 * El laboratorio dejó de dictar las nueve consultas y pasó al juez: siete
 * problemas, contrato de columnas, y catorce casos ocultos que corren sobre
 * otros dos clubes. Esta entrada se actualizó con él porque **una entrada que
 * describe la clase anterior miente sin que ninguna prueba se entere** — es la
 * avería que este mismo archivo tuvo un mes con el aviso de «se está
 * grabando». Siguen siendo nueve encargos (siete problemas + las dos paradas
 * del tope de filas), así que ese número no cambió.
 */

const CONFIG: ConfigEntradaN5 = {
  actividadId: 'n10-consultas-sql',
  laboratorio: LabConsultasSql,
  ruta: RUTA_N10_BASES_DE_DATOS_Y_SQL,
  parada: 2,
  globo: 'La base del club de robótica ya tiene datos de verdad. Hoy no la diseñas: hay siete problemas y un juez.',
  arranqueSub:
    'Abres **consultas.sql** con el club ya poblado. Cada problema dice **qué tabla hay que devolver** —con qué columnas y en qué orden— y te enseña un ejemplo. Tú escribes la consulta. El juez la corre contra tu base **y contra dos clubes que no has visto**: otra gente, otros equipos y otros números de equipo. Que funcione con el ejemplo no basta.',
  stats: [
    { etiqueta: 'Problemas', valor: '7', acento: '#2dd4bf' },
    { etiqueta: 'Casos ocultos', valor: '14', acento: '#f59e0b' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Lo que tendrás que decidir tú en cada problema',
  fichas: [
    {
      key: 'juez',
      tag: 'Quién corrige',
      numero: 1,
      titulo: 'El juez',
      detalle:
        'Corre tu consulta contra tres bases distintas y te dice cuántos casos pasan, cuál falla y qué devolvió tu consulta en lugar de lo esperado. Los datos de los ocultos no los ves: sólo cómo se llaman.',
      acento: { c: '#2dd4bf', deep: '#0f766e' },
    },
    {
      key: 'orden',
      tag: 'En qué orden',
      numero: 2,
      titulo: 'ORDER BY y DESC',
      detalle:
        'Las filas de una tabla no tienen orden propio. Si la respuesta necesita un orden, hay que pedirlo — y en dos problemas el orden ES la respuesta.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'patron',
      tag: 'Buscar y cortar',
      numero: 3,
      titulo: 'LIKE y LIMIT',
      detalle:
        'Buscar «algo que se parece a» no es buscar «algo igual a». Y cortar a las tres primeras filas sólo significa algo si antes dijiste cuáles son las primeras, empates incluidos.',
      acento: { c: '#facc15', deep: '#b45309' },
    },
    {
      key: 'join',
      tag: 'Las dos trampas',
      numero: 4,
      titulo: 'JOIN … ON y NULL',
      detalle:
        'Un JOIN sólo trae las filas que casan, y NULL no casa con nada: hay un integrante que desaparece, y un problema entero dedicado a encontrarlo. La otra trampa es el último: el número de un equipo cambia de un año a otro, su nombre no.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el editor de consultas',
  ctaDetalle:
    'Siete problemas con juez y catorce casos ocultos, más las dos paradas del final: una tabla de 150 filas que la pantalla sólo dibuja hasta la 100, y por qué eso no le quita ni una fila al resultado.',
};

export function EntradaConsultasSql(props: ActivityProps) {
  return <EntradaN5Base {...props} entrada={CONFIG} />;
}

export default EntradaConsultasSql;
