'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { RUTA_N10_DATOS } from './rutaDatosN10';
import { LabConsultasSql } from './LabConsultasSql';

/**
 * Entrada de `n10-consultas-sql` — N10·«Bases de datos y modelado», parada 2.
 *
 * ESTE ARCHIVO YA NO SE MONTA (2-sep-2026). El registro carga
 * `datos/EntradaConsultasSql.tsx`, que es la implementación que coincide
 * con el video publicado de esta clase (club de robótica, ORDER BY, LIKE,
 * LIMIT, JOIN con NULL) y con la `descripcion` de la tarjeta. La de aquí va
 * de otra cosa —una tienda, «DataGrip SQL Studio»— y su laboratorio daba la
 * clase por terminada buscando palabras dentro del texto tecleado, sin mirar
 * si la consulta devolvía algo. El porqué completo está escrito en
 * `registry.ts`, junto al `load` de esta clase.
 *
 * No se borra porque este proyecto todavía no tiene git y lo borrado no
 * vuelve. Si alguien lo retoma: no lo reapunte sin leer antes esa nota.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n10-consultas-sql',
  laboratorio: LabConsultasSql,
  ruta: RUTA_N10_DATOS,
  parada: 2,
  globo:
    '¡Bienvenido al entorno de estudio DataGrip SQL Pro! Aprenderás la sintaxis profesional del lenguaje SQL para manipular registros relacionales, aplicar filtros condicionales y unir tablas empresariales.',
  arranqueSub:
    'Explorarás el esquema ERD, ejecutarás sentencias SELECT, filtrarás registros con clausulas WHERE y realizarás agrupaciones analíticas avanzadas con SUM() y GROUP BY.',
  stats: [
    { etiqueta: 'Encargos', valor: '5', acento: '#38bdf8' },
    { etiqueta: 'Engine SQL', valor: 'DataGrip', acento: '#10b981' },
    { etiqueta: 'Insignia', valor: '1', acento: '#a855f7' },
  ],
  letrero: 'DataGrip SQL Studio Pro: Bases de Datos Relacionales',
  fichas: [
    {
      key: 'select-queries',
      tag: 'Consultas SQL',
      numero: 1,
      titulo: 'Sentencias SELECT & WHERE',
      detalle:
        'Extrae información estructurada de tablas relacionales y aplica filtros condicionales especificos.',
      acento: { c: '#38bdf8', deep: '#0284c7' },
    },
    {
      key: 'inner-joins',
      tag: 'Unión de Tablas',
      numero: 2,
      titulo: 'Relaciones INNER JOIN',
      detalle:
        'Vinca tablas de clientes y pedidos mediante claves primarias (PK) y foráneas (FK).',
      acento: { c: '#a855f7', deep: '#7e22ce' },
    },
    {
      key: 'aggregation-grouping',
      tag: 'Analítica SQL',
      numero: 3,
      titulo: 'SUM() & GROUP BY',
      detalle:
        'Calcula totales financieros agrupando resultados en tiempo real con comandos SQL.',
      acento: { c: '#10b981', deep: '#059669' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5',
  ctaTitulo: 'Iniciar DataGrip SQL Studio',
  ctaDetalle:
    'Ingresa al entorno de simulación DataGrip con intérprete SQL en tiempo real, visor Data Grid y diagramas ERD.',
  assetsPendientes: false,
};

export function EntradaConsultasSql(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaConsultasSql;
