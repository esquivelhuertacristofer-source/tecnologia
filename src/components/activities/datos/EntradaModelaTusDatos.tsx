'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN5Base, type ConfigEntradaN5 } from '../n5/estudio/EntradaN5Base';
import { RUTA_N10_BASES_DE_DATOS_Y_SQL } from './rutasDatos';
import { LabModelaTusDatos } from './LabModelaTusDatos';

/**
 * Entrada de N10 · «Bases de datos y SQL», parada 1 de 3 · `n10-modela-tus-datos`.
 * **Bachillerato, 15–18 años** (comprobado en `curriculo.ts`). Registro de
 * bachillerato: se trata al alumno como casi-adulto, sin metáforas infantiles
 * ni celebración de acierto — el refuerzo es informativo, igual que en N7 y
 * N9. El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n10-modela-tus-datos/video-explicativo.mp4` y la
 * bandera bajó a `assetsPendientes: false`. OJO si escribes pruebas: con el
 * video puesto, el primer `<button>` del documento ya no es el CTA sino el de
 * la portada, así que no lo busques por posición — búscalo por su texto.
 */

const CONFIG: ConfigEntradaN5 = {
  actividadId: 'n10-modela-tus-datos',
  laboratorio: LabModelaTusDatos,
  ruta: RUTA_N10_BASES_DE_DATOS_Y_SQL,
  parada: 1,
  globo: 'El club de robótica necesita su propia base de datos. Hoy no la consultas: la diseñas tú, desde cero.',
  arranqueSub:
    'Abres **proyecto.sql** vacío. Vas a escribir `CREATE TABLE` con tipos, `PRIMARY KEY` y `REFERENCES` para relacionar dos tablas, poblarlas con `INSERT`, y comprobar algo que no todos los cursos enseñan: **una clave foránea que de verdad impide que una fila apunte a algo que no existe.**',
  stats: [
    { etiqueta: 'Encargos', valor: '8', acento: '#2dd4bf' },
    { etiqueta: 'Errores a propósito', valor: '3', acento: '#f59e0b' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Lo que hace que dos tablas estén relacionadas',
  fichas: [
    {
      key: 'create',
      tag: 'Diseñar la tabla',
      numero: 1,
      titulo: 'CREATE TABLE',
      detalle: 'Declara las columnas y su tipo: INTEGER, TEXT, REAL, DATE, BOOLEAN. El orden en que creas tus tablas importa.',
      acento: { c: '#2dd4bf', deep: '#0f766e' },
    },
    {
      key: 'pk',
      tag: 'Lo que distingue una fila',
      numero: 2,
      titulo: 'PRIMARY KEY',
      detalle: 'La columna que no se puede repetir: es lo que hace que una fila sea ESA fila y no otra.',
      acento: { c: '#facc15', deep: '#b45309' },
    },
    {
      key: 'notnull',
      tag: 'Lo que no puede faltar',
      numero: 3,
      titulo: 'NOT NULL',
      detalle: 'Una columna así declarada no puede quedar vacía, nunca. Inténtalo y el motor te va a parar.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'references',
      tag: 'La relación que se cumple',
      numero: 4,
      titulo: 'REFERENCES',
      detalle:
        'Apunta de una tabla a otra, y aquí SE CUMPLE de verdad: si intentas apuntar a algo que no existe, el motor no te deja.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el editor de diseño',
  ctaDetalle:
    'Ocho encargos: crea dos tablas relacionadas, puébalas con INSERT, y topa de frente con NOT NULL y con una clave foránea que de verdad impide algo.',
  assetsPendientes: false,
};

export function EntradaModelaTusDatos(props: ActivityProps) {
  return <EntradaN5Base {...props} entrada={CONFIG} />;
}

export default EntradaModelaTusDatos;
