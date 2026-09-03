'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabTablasDinamicas } from './Lab';

/**
 * Entrada de `n8-tablas-dinamicas` — segunda parada de N8 · «Datos y análisis»
 * (§49.3.5).
 *
 * **La ruta se deriva de su propia unidad y no se escribe a mano**, igual que
 * en `n8-limpieza-de-datos`: el id es `n8-`, la clase vive en la unidad del
 * nivel 8, y tanto la lista de paradas como el número gigante del CTA salen de
 * `getUnidad('n8-datos-y-analisis')`. No de `comun/rutas.ts`, que es para las
 * clases EXCLUSIVAS de la sala de Office (`of-`), y ésta no lo es.
 *
 * **Cada cadena de esta entrada está escrita para ESTA clase.** Es la
 * advertencia que dejó escrita el bloque de Office y que ya mordió una vez: un
 * port que sólo cambia el import deja la entrada mintiendo. Aquí no hay ni una
 * frase heredada de `of-excel-tabla-dinamica`, que es la clase con la que se
 * podría confundir: aquélla arrastra campos en una tabla dinámica de verdad
 * (grado Avanzado); ésta construye el mismo resumen a mano, con fórmulas.
 */

const RUTA_N8: PasoRuta[] = (getUnidad('n8-datos-y-analisis')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const ACTIVIDAD = 'n8-tablas-dinamicas';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabTablasDinamicas,
  ruta: RUTA_N8,
  parada: Math.max(1, RUTA_N8.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo: 'Antes de que un botón lo haga solo, hazlo tú una vez a mano.',
  arranqueSub:
    'La kermés de fin de bimestre de 1°D anotó cada venta del día en una bitácora, sin ningún orden: veintidós renglones, cinco categorías mezcladas —bebidas, botanas, dulces, manualidades y boletos de rifa—. El comité quiere un reporte por categoría, y eso es exactamente lo que arma sola una tabla dinámica: agrupar y resumir. Hoy no hay ningún botón para eso. Vas a construir el resumen tú, con tres fórmulas que agrupan y suman con una condición, vas a copiarlas hacia abajo para que se adapten solas a cada categoría, y vas a descubrir por qué un resumen hecho a mano necesita revisarse antes de entregarlo.',
  stats: [
    { etiqueta: 'Ventas', valor: '22', acento: '#22d3ee' },
    { etiqueta: 'Categorías', valor: '5', acento: '#f5a524' },
    { etiqueta: 'Encargos', valor: '8', acento: '#34d399' },
  ],
  letrero: 'Lo mismo que hace un botón de Excel, hecho campo por campo',
  fichas: [
    {
      key: 'agrupar',
      tag: 'La idea',
      numero: 1,
      titulo: 'Agrupar y resumir, a mano',
      detalle:
        'Una tabla dinámica hace dos cosas: agrupa por una categoría y resume cada grupo. SUMAR.SI, CONTAR.SI y PROMEDIO.SI son esas dos cosas escritas como fórmula: una condición que agrupa, una cuenta que resume. Construir la versión manual primero es entender qué es lo que un botón te va a ahorrar el día que exista.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'copiar',
      tag: 'El mecanismo',
      numero: 2,
      titulo: 'Una fórmula, copiada, que se adapta sola',
      detalle:
        'Escribes la fórmula de Bebidas una sola vez, con los signos $ en el lugar correcto, y la copias hacia las otras cuatro categorías. La etiqueta cambia sola en cada fila; el rango de datos no se mueve ni un renglón. Es la misma regla de referencias absolutas y relativas de siempre, aplicada al caso donde más se nota para qué sirve.',
      acento: { c: '#f5a524', deep: '#b45309' },
    },
    {
      key: 'cuadrar',
      tag: 'El hallazgo',
      numero: 3,
      titulo: 'Las partes tienen que sumar el total',
      detalle:
        'Cinco fórmulas bien escritas, cada una sumando exactamente lo que se le pidió, y aun así el dinero no cuadra: faltan 35 pesos y nada en pantalla lo dice. La única manera de cazarlo es construir una fila de Total general y comprobar que coincide con el total del día — la misma disciplina que un analista aplica a cualquier resumen antes de firmarlo.',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'comparar',
      tag: 'La lectura',
      numero: 4,
      titulo: 'Más ventas no es más dinero',
      detalle:
        'Bebidas tuvo más transacciones que cualquier otra categoría. Manualidades dejó más dinero con la mitad de las ventas, porque sus piezas cuestan más. Con la tabla completa delante —dinero, ventas y promedio, uno al lado del otro— la respuesta a «¿quién vendió más?» deja de tener una sola cara.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre la bitácora de la kermés',
  ctaDetalle:
    'Se abre «Kermés de fin de bimestre · puesto de 1°D.xlsx», con las veintidós ventas del día ya cargadas. Ocho encargos. Todas las fórmulas se escriben a mano junto a la categoría que las nombra; el único botón de la cinta que hace falta, además de escribir, es Copiar y Pegar, en Inicio → Portapapeles. El panel de la derecha te enseña tu tabla dinámica a mano, tal como va quedando.',
};

export function EntradaTablasDinamicas(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaTablasDinamicas;

export default EntradaTablasDinamicas;
