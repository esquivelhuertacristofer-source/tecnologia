'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { RUTA_N6_WEB } from './rutaWeb';
import { LabPublicaTuPagina } from './LabPublicaTuPagina';

/**
 * Entrada de `n6-publica-tu-pagina` — N6·«Mi primera página web», parada 3
 * (documento §51.3). Tono de **11–12 años** (N6, 6.º de Primaria).
 *
 * Cadenas propias: aquí no se escribe una página, se revisa la que ya está
 * escrita y se publica. Es la única de las tres que habla de quién va a poder
 * verla.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n6-publica-tu-pagina',
  laboratorio: LabPublicaTuPagina,
  ruta: RUTA_N6_WEB,
  parada: 3,
  globo:
    'Tu página está terminada y hoy le vas a dar una dirección. Antes de eso hay que revisarla, y lo primero que se revisa no es el código: es qué le estarías contando al mundo sin darte cuenta.',
  arranqueSub:
    'Hoy casi no escribes: **buscas lo que está mal**. La página llega con cuatro cosas mal y una de ellas no es un error de código — es un teléfono, una calle y una hora de salida que no deberían estar ahí. Cuando no quede ni un rojo ni un amarillo, se abre el panel de publicar.',
  stats: [
    { etiqueta: 'Revisiones', valor: '5', acento: '#34d399' },
    { etiqueta: 'Pasos al publicar', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#fbbf24' },
  ],
  letrero: 'Lo que se revisa antes de dar la dirección',
  fichas: [
    {
      key: 'quien-la-ve',
      tag: 'Lo primero, y no es técnico',
      numero: 1,
      titulo: 'Una dirección la abre cualquiera',
      detalle:
        'No la ven sólo tus compañeros: **la ve quien tenga la dirección**. Tu teléfono, tu calle y la hora a la que sales de la escuela no van ahí.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'rojo-y-amarillo',
      tag: 'Los dos colores de la lista',
      numero: 2,
      titulo: 'Rojo es «no puedo»; amarillo es «mal hecho»',
      detalle:
        'El rojo es algo que el navegador no puede hacer. El amarillo **funciona igual** y aun así está mal. Antes de publicar no debe quedar ninguno de los dos.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'link-roto',
      tag: 'El fallo número uno del mundo',
      numero: 3,
      titulo: '«Escribí el CSS y no se ve nada»',
      detalle:
        'Casi siempre es lo mismo: el enlace al archivo de estilo tiene el nombre mal escrito. **Una letra de más y la página se ve en blanco y negro.**',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'publicar-es-lo-facil',
      tag: 'Y al final',
      numero: 4,
      titulo: 'Publicar es lo fácil',
      detalle:
        'Son tres botones. **Lo que cuesta es lo de antes**, y por eso el panel de publicar no aparece hasta que la revisión está terminada.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el proyecto',
  ctaDetalle:
    'Lee tu página entera y quita lo que no es para cualquiera. Arregla el error rojo y **mira cómo se llena de color**. Arregla los dos avisos amarillos, ponle nombre a la pestaña, y entonces sí: los tres pasos para publicarla en club-robotica.tecnia.mx.',
  assetsPendientes: false,
};

export function EntradaPublicaTuPagina(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaPublicaTuPagina;
