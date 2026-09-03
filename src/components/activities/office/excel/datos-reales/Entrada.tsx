'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabDatosReales } from './Lab';

/**
 * Entrada de `n7-datos-reales` — parada de N7 · «Hoja de cálculo aplicada», y
 * la sexta clase de la sala de Excel.
 *
 * La ruta y el número se derivan de la unidad, igual que en las cinco clases
 * anteriores de esta sala y por lo mismo que ya dejó escrito `n7-funcion-si`:
 * escribirlos a mano es la razón por la que cinco entradas de PowerPoint
 * acabaron mintiendo (§44.6).
 */

const RUTA_N7: PasoRuta[] = (getUnidad('n7-hoja-de-calculo-aplicada')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const ACTIVIDAD = 'n7-datos-reales';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabDatosReales,
  ruta: RUTA_N7,
  parada: Math.max(1, RUTA_N7.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo: 'Hoy los datos no los escribes tú: llegan de fuera, y llegan sucios.',
  arranqueSub:
    'La tesorería empieza a recibir archivos que no escribió nadie del salón: una lista de asistencia exportada de otro programa, una lista de precios de la papelería, unos códigos con ceros a la izquierda. Vas a importar el mismo archivo con el separador equivocado antes de importarlo bien, en la misma celda, y vas a contestarle al aviso de que va a sustituir lo que ya había. Vas a cazar una coma que parte un precio en dos campos, y una columna de códigos que se queda como texto para no perder sus ceros — la vas a sumar y vas a ver un 0 que ningún error avisa. Y vas a traer el pedido real de la papelería, 46 artículos de un tirón, para entregarlo impreso con encabezado, pie y la fila de títulos repetida en cada página.',
  stats: [
    { etiqueta: 'Archivos', valor: '4', acento: '#22d3ee' },
    { etiqueta: 'Encargos', valor: '11', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Importar no es abrir: es traducir',
  fichas: [
    {
      key: 'separador-equivocado',
      tag: 'El separador',
      numero: 1,
      titulo: 'Un archivo es texto, y alguien corta',
      detalle:
        'Un .csv no sabe dónde empieza cada columna: lo dice el separador —coma, punto y coma o tabulador— y si se elige el que no es, el archivo entero cae en una sola columna. No es un error de la hoja: hizo justo lo que le pediste.',
      acento: { c: '#f5a524', deep: '#b45309' },
    },
    {
      key: 'trampa-de-la-coma',
      tag: 'La trampa',
      numero: 2,
      titulo: '«1,250» son dos campos, no un número',
      detalle:
        'En un archivo separado por comas, un precio de mil doscientos cincuenta escrito sin comillas se parte en dos: «1» y «250». Es la razón por la que existe el punto y coma como separador.',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'texto-que-parece-numero',
      tag: 'El chivato',
      numero: 3,
      titulo: 'Lo que entra puede parecer número y no serlo',
      detalle:
        '«007» importado como texto no pierde sus ceros. Se alinea a la izquierda, y una suma sobre esa columna da 0 sin que nada avise — el parte de la importación dice qué columnas revisar antes de que pase.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'titulos-y-pie',
      tag: 'Bloque 41',
      numero: 4,
      titulo: 'Un papel suelto tiene que saber de quién es',
      detalle:
        'Encabezado, pie y la fila de títulos repetida son lo que separa entregar una lista larga legible de entregar una segunda página sin nombre ni columnas. El pedido de 46 artículos siempre sale en dos páginas: la diferencia es si se entienden solas.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el pedido de la papelería',
  ctaDetalle:
    'Se abre «Pedido de la papelería.xlsx» con dos hojas: Pruebas y Pedido. Once encargos. El botón de importar está en Datos → Herramientas de datos → «Desde texto o CSV», y abre un panel con los archivos listos, un cuadro para tu propio texto, el separador y el parte de lo que entró.',
};

export function EntradaDatosReales(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaDatosReales;

export default EntradaDatosReales;
