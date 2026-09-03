'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, RUTA_N6_DISENO_MULTIMEDIA, type ConfigEntradaN4 } from '../n4/estudio/EntradaN4Base';
import { LabCreaConIa } from './LabCreaConIa';

/**
 * Entrada de `n6-crea-con-ia` — N6·«Diseño y multimedia», parada 3 de 3
 * (cierra la unidad). Tono de **11–12 años** (N6, 6.º de Primaria, verificado
 * en `curriculo.ts:623`).
 *
 * El video se grabó y se publicó el 2-sep-2026, así que `assetsPendientes` ya
 * es `false`: la entrada enseña primero el cubrepantalla y el reproductor
 * después. OJO si escribes pruebas: con el video puesto, el primer `<button>`
 * del documento ya no es el CTA sino el de la portada, así que no lo busques
 * por posición — búscalo por su texto.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n6-crea-con-ia',
  laboratorio: LabCreaConIa,
  ruta: RUTA_N6_DISENO_MULTIMEDIA,
  parada: 3,
  globo:
    'Para el cartel del año que viene hace falta una ilustración que nadie fotografió. Hoy se la pides a una IA, la revisas antes de usarla, y firmas de dónde salió — que es lo que hace que el trabajo se pueda entregar.',
  arranqueSub:
    'Una IA generadora **no busca: fabrica**. Lo que te da no existía antes y **no vuelve a salir igual**. Por eso hay dos cosas que aprender juntas: pedir bien y **apuntar de dónde salió**.',
  stats: [
    { etiqueta: 'Encargos', valor: '7', acento: '#a78bfa' },
    { etiqueta: 'Piezas de la petición', valor: '4', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Pídelo bien, míralo, y firma de dónde salió',
  fichas: [
    {
      key: 'no-es-buscar',
      tag: 'Lo primero',
      numero: 1,
      titulo: 'Generar no es buscar',
      detalle: 'La imagen **no existía** hace tres segundos. No hay una copia en ningún otro sitio.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'cuatro-piezas',
      tag: 'Cómo se pide',
      numero: 2,
      titulo: 'Cuatro piezas',
      detalle: 'Qué, cómo, para dónde y **qué no**. La última es la más olvidada y la más útil.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'miralo-tu',
      tag: 'Antes de usar',
      numero: 3,
      titulo: 'Míralo tú',
      detalle: 'La IA entrega lo bueno y lo malo con la misma seguridad. **Letras revueltas** es su fallo más típico.',
      acento: { c: '#f97316', deep: '#b45309' },
    },
    {
      key: 'nunca-igual',
      tag: 'El descubrimiento',
      numero: 4,
      titulo: 'Nunca sale igual dos veces',
      detalle: 'Si la vuelves a pedir, salen otras. Por eso **la que usas hay que apuntarla ya**.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
    {
      key: 'citar-tres-cosas',
      tag: 'Lo que se lleva puesto',
      numero: 5,
      titulo: 'Citar es decir tres cosas',
      detalle: 'Con qué, qué pediste y cuándo. **Decirlo no te quita el mérito; esconderlo sí.**',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el generador',
  ctaDetalle:
    'Cuatro piezas, tres tandas de imágenes y una ficha de procedencia. **Sales sabiendo pedir, revisar y firmar.**',
  assetsPendientes: false,
};

export function EntradaCreaConIa(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaCreaConIa;
