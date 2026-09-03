'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { paradaExcel, rutaExcel } from '../comun/rutas';
import { LabConsolidaYProtege } from './Lab';

/**
 * Entrada de `of-excel-consolida-y-protege` (bloques 53 · 54).
 *
 * La tercera clase exclusiva del grado Avanzado de Tecnia Hojas: la ruta y la
 * parada salen de `rutaExcel('avanzado')` y `paradaExcel('avanzado', ...)`,
 * **derivadas** de `EJERCICIOS_OFFICE` y no escritas a mano, por la misma
 * razón que ya dejaron escrita `of-excel-datos-limpios` y `comun/rutas.ts`.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-excel-consolida-y-protege',
  laboratorio: LabConsolidaYProtege,
  ruta: rutaExcel('avanzado'),
  parada: paradaExcel('avanzado', 'of-excel-consolida-y-protege'),
  globo: 'Consolidar junta hojas; proteger dice quién puede tocar qué.',
  arranqueSub:
    'La kermés de la escuela terminó y hay que cerrar cuentas: Grupo A, Grupo B y Grupo C reportaron lo que recaudaron cada uno en su propia hoja, idéntica a las otras dos. Hoy vas a juntarlas en una sola hoja Total con una fórmula que se recalcula sola —lo vas a comprobar cambiando un dato y viendo moverse el total sin tocarlo—, y vas a provocar a propósito el aviso que salta cuando dos hojas no miden lo mismo. Después vas a dejar la hoja de un grupo lista para que las familias la sigan llenando: la vas a proteger al revés la primera vez —sin desbloquear nada— para descubrir en carne propia por qué ese orden importa, y vas a cerrar también la estructura del libro entero para que a nadie se le ocurra borrar o renombrar una de las tres hojas de grupo. Sin contraseña, y vas a entender por qué: esto protege de un despiste, no de alguien con malas intenciones.',
  stats: [
    { etiqueta: 'Hojas', valor: '4', acento: '#22d3ee' },
    { etiqueta: 'Encargos', valor: '12', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Todo nace bloqueado, hasta lo tuyo',
  fichas: [
    {
      key: 'consolidar-suma-viva',
      tag: 'Consolidar',
      numero: 1,
      titulo: 'Une varias hojas sin copiar un número',
      detalle:
        'Escribe una fórmula SUMA que mira las tres hojas de origen a la vez. Cambia un dato en cualquiera de ellas y el total se corrige solo — la misma idea de «la celda guarda la regla», ahora entre hojas distintas.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'la-misma-forma',
      tag: 'Antes de juntar',
      numero: 2,
      titulo: 'Hay que medir igual',
      detalle:
        'Tres hojas con una fila de más o de menos no se pueden consolidar. Excel te lo dice antes de escribir nada, comparando el ancho y el alto de cada origen — no adivina, lo mide.',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'sin-contrasena',
      tag: 'Proteger',
      numero: 3,
      titulo: 'No es cifrar',
      detalle:
        'Una hoja protegida evita un despiste —borrar sin querer la fórmula de un compañero—, no a alguien con intención de saltársela. No hay contraseña, y es a propósito: una que se guardara en claro enseñaría una mentira sobre seguridad.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'el-orden-importa',
      tag: 'La trampa clásica',
      numero: 4,
      titulo: 'Desbloquea antes, nunca después',
      detalle:
        'Todas las celdas nacen bloqueadas. Proteger la hoja cierra las que no hayas desbloqueado a tiempo — hasta las tuyas. Casi todo el mundo lo hace al revés la primera vez, y hoy tú también.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Junta las tres hojas y cierra con llave',
  ctaDetalle:
    'Se abre «Kermés de la escuela · Recaudación.xlsx» con cuatro hojas: Grupo A, Grupo B, Grupo C y Total. Doce encargos. Consolidar vive en Datos → Herramientas de datos y abre un cuadro de texto; los cinco botones de proteger viven en la pestaña Revisar, nueva desde hoy, y no piden nada: actúan sobre la hoja donde estés o sobre lo que tengas marcado. Si un botón se niega, el aviso dice exactamente qué hacer.',
};

export function EntradaConsolidaYProtege(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaConsolidaYProtege;

export default EntradaConsolidaYProtege;
