'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, ConfigEntradaN4, RUTA_N4U1 } from './EntradaN4Base';
import { LabBuscaYCompara } from './LabBuscaYCompara';

/**
 * Entrada de N4·U1 parada 2 «Busca y compara fuentes» (documento §23.2).
 * Globo, stats, letrero y las cuatro fichas de repaso son verbatim de la tabla
 * gráfica del documento; las tres primeras son las pistas que el alumno va a
 * usar en la mesa y la cuarta es la regla de oro que rige las fases 2 y 3.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n4-busca-y-compara',
  laboratorio: LabBuscaYCompara,
  ruta: RUTA_N4U1,
  parada: 2,
  globo: 'Tres páginas, tres respuestas distintas. ¿A cuál le creemos? Vamos a revisarlas.',
  arranqueSub: 'Trae tu lupa: en la mesa de fuentes vamos a revisar tres resultados señal por señal.',
  stats: [
    { etiqueta: 'Fuentes', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Señales', valor: '9', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'La mesa de fuentes',
  fichas: [
    {
      key: 'quien',
      tag: 'Pista 1',
      numero: 1,
      titulo: '¿Quién lo escribió?',
      detalle: 'Un museo, una escuela, una universidad, alguien con nombre y apellido que responda por lo que dice.',
      img: 'ficha-quien.webp',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'cuando',
      tag: 'Pista 2',
      numero: 2,
      titulo: '¿De cuándo es?',
      detalle: 'Una página con fecha de este año te dice que alguien la sigue cuidando.',
      img: 'ficha-cuando.webp',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'alerta',
      tag: 'Pista 3',
      numero: 3,
      titulo: 'Señales de alerta',
      detalle: 'Sin autor, sin fecha, llena de anuncios o prometiendo algo increíble: desconfía.',
      img: 'ficha-alerta.webp',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'compara',
      tag: 'Regla de oro',
      numero: 4,
      titulo: 'Compara dos',
      detalle: 'Si dos sitios serios que no se conocen dicen lo mismo, seguramente es cierto.',
      img: 'ficha-compara.webp',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Marca las 9 señales de las tres fichas, elige la más confiable y resuelve la contradicción.',
};

export function EntradaBuscaYCompara(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaBuscaYCompara;
