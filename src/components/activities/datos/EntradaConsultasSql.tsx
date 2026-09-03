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
 */

const CONFIG: ConfigEntradaN5 = {
  actividadId: 'n10-consultas-sql',
  laboratorio: LabConsultasSql,
  ruta: RUTA_N10_BASES_DE_DATOS_Y_SQL,
  parada: 2,
  globo: 'La base del club de robótica ya tiene datos de verdad. Hoy no la diseñas: le preguntas cosas.',
  arranqueSub:
    'Abres **consultas.sql** con dos tablas ya pobladas. Vas a filtrar, ordenar, buscar por patrón, cortar el resultado y **unir dos tablas con JOIN** — y a descubrir por qué un compañero sin equipo asignado desaparece del resultado sin que el motor tenga ningún error.',
  stats: [
    { etiqueta: 'Encargos', valor: '9', acento: '#2dd4bf' },
    { etiqueta: 'Errores a propósito', valor: '1', acento: '#f59e0b' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Las piezas de una consulta con filtro y unión',
  fichas: [
    {
      key: 'orderby',
      tag: 'En qué orden',
      numero: 1,
      titulo: 'ORDER BY',
      detalle: 'Ordena el resultado. Sin él, el orden es sólo el de inserción — nunca lo des por hecho.',
      acento: { c: '#2dd4bf', deep: '#0f766e' },
    },
    {
      key: 'like',
      tag: 'Buscar por patrón',
      numero: 2,
      titulo: 'LIKE',
      detalle: '«Empieza por», «contiene», «termina en»: LIKE \'A%\' encuentra los que empiezan por A.',
      acento: { c: '#facc15', deep: '#b45309' },
    },
    {
      key: 'limit',
      tag: 'Cortar el resultado',
      numero: 3,
      titulo: 'LIMIT',
      detalle: 'Corta a las primeras N filas, después de ordenar. Y la pantalla misma corta a 100, aunque haya más.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'join',
      tag: 'La trampa de la clase',
      numero: 4,
      titulo: 'JOIN … ON',
      detalle: 'Une dos tablas por una condición. Sólo trae las filas que CASAN: las que no, se pierden — incluidas las que tienen NULL.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el editor de consultas',
  ctaDetalle:
    'Nueve encargos: filtra, ordena, busca por patrón, corta con LIMIT, lee el pie de una tabla de 150 filas, y une dos tablas hasta entender por qué se pierde una fila.',
};

export function EntradaConsultasSql(props: ActivityProps) {
  return <EntradaN5Base {...props} entrada={CONFIG} />;
}

export default EntradaConsultasSql;
