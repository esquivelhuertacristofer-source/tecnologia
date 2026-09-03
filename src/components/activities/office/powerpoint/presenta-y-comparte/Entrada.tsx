'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { paradaPPT, rutaPPT } from '../comun/rutas';
import { LabPresentaYComparte } from './Lab';

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-ppt-presenta-y-comparte',
  laboratorio: LabPresentaYComparte,
  ruta: rutaPPT('basico'),
  parada: paradaPPT('basico', 'of-ppt-presenta-y-comparte'),
  globo: 'El público ve una pantalla. Tú vas a ver otra.',
  arranqueSub:
    'Cuando conectas la computadora a un proyector pasan a existir dos pantallas distintas, y casi nadie lo sabe: por eso se ve tanta gente presentando de espaldas, leyéndole la pared al público. Hoy vas a abrir la Vista Moderador y a ver las dos a la vez — arriba lo que se proyecta, abajo lo tuyo, con tus notas en grande, la diapositiva que viene y un reloj corriendo. Antes le vas a escribir sus notas a una presentación de la feria de ciencias que un compañero dejó lista y sin ellas. Y al final la vas a mandar: no el archivo, sino el PDF.',
  stats: [
    { etiqueta: 'Diapositivas', valor: '5', acento: '#22d3ee' },
    { etiqueta: 'Pantallas', valor: '2', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Dos pantallas, un que habla',
  fichas: [
    {
      key: 'dos-pantallas',
      tag: 'Lo de fondo',
      numero: 1,
      titulo: 'No es una pantalla, son dos',
      detalle:
        'El proyector enseña la diapositiva y nada más. Tu computadora puede enseñarte otra cosa: la de ahora, la que viene, tus notas y el reloj. Se llama Vista Moderador y es la diferencia entre hablarle a la gente y leerle la pared.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'las-notas',
      tag: 'Clave 2',
      numero: 2,
      titulo: 'Para esto eran las notas',
      detalle:
        'Llevas seis clases viendo la caja de abajo que dice «el público no lo ve». Aquí es donde por fin sirve. Y una nota no es copiar la diapositiva: es lo que vas a decir tú, con tus palabras, y que no está escrito arriba.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'el-reloj',
      tag: 'Clave 3',
      numero: 3,
      titulo: 'Y un reloj que corre',
      detalle:
        'En tu pantalla hay un cronómetro desde el segundo uno. No es para agobiarte: es para que sepas si vas rápido o lento sin sacar el teléfono delante de todos.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'pptx-o-pdf',
      tag: 'Clave 4',
      numero: 4,
      titulo: 'Se guarda en uno, se manda en otro',
      detalle:
        'El archivo de PowerPoint es el tuyo, el que vas a seguir tocando. Para mandarla está el PDF: se ve igual en cualquier teléfono, se abre siempre y nadie te la mueve sin querer. Es exactamente la misma regla que aprendiste en Word.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Ponte enfrente',
  ctaDetalle:
    'Se abre «El agua que tomamos.pptx», cinco diapositivas ya terminadas: no tienes que construir nada. Estrenas dos sitios del programa que nunca has pisado — Presentación → Configurar → Vista Moderador, que te lleva al salón con las dos pantallas, y la pestaña naranja «Archivo», la primera de todas, que hasta hoy te decía «eso lo verás en otra clase». Pulsa primero «Desde el principio» como siempre y fíjate bien en las dos pantallas antes de cambiar nada: sin ese antes, el después no se nota.',
};

export function EntradaPresentaYComparte(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaPresentaYComparte;

export default EntradaPresentaYComparte;
