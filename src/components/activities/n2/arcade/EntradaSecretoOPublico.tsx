'use client';

import { ActivityProps } from '@/types/activity-contract';
import { EntradaN2Unidad6Base, ConfigEntradaN2Unidad6 } from './EntradaN2Unidad6Base';
import { LabSecretoOPublico } from './LabSecretoOPublico';

const CONFIG: ConfigEntradaN2Unidad6 = {
  actividadId: 'n2-secreto-o-publico',
  laboratorio: LabSecretoOPublico,
  parada: 1,
  globo: 'Tus datos son un tesoro. ¿Aprendemos cuáles son secretos y cuáles puedes compartir?',
  arranqueSub: 'Descubre qué datos se guardan con candado y cuáles sí puedes compartir.',
  stats: [
    { etiqueta: 'Rondas', valor: '2', acento: '#7c6cff' },
    { etiqueta: 'Datos', valor: '12', acento: '#34d399' },
    { etiqueta: 'Insignia', valor: '1', acento: '#fbbf24' },
  ],
  letrero: 'El clasificador de secretos',
  fichas: [
    {
      key: 'datos-secretos',
      tag: 'Secreto',
      titulo: 'Los datos que dicen dónde encontrarte',
      detalle: 'Tu dirección, tu teléfono, tu escuela, tu foto y tu contraseña se guardan con candado.',
      img: 'ficha-datos-secretos.png',
      acento: { c: '#7c6cff', deep: '#4c3fcf' },
    },
    {
      key: 'datos-publicos',
      tag: 'Público',
      titulo: 'Los datos que sí puedes compartir',
      detalle: 'Tu color favorito, tu juego favorito o un dibujo tuyo sí puedes compartirlos sin miedo.',
      img: 'ficha-datos-publicos.png',
      acento: { c: '#34d399', deep: '#047857' },
    },
    {
      key: 'antes-de-responder',
      tag: 'Antes de responder',
      titulo: 'Piensa antes de escribir',
      detalle: 'Si alguien te pregunta un secreto por chat, la respuesta sigue siendo la misma: candado.',
      img: 'ficha-antes-de-responder.png',
      acento: { c: '#38bdf8', deep: '#0e7490' },
    },
    {
      key: 'pista-candado',
      tag: 'Pista',
      titulo: '¿Esto dice dónde encontrarme?',
      detalle: 'Esa pregunta te ayuda a decidir rápido si un dato es secreto o público.',
      img: 'ficha-pista-candado.png',
      acento: { c: '#ffd25a', deep: '#d99a00' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaDetalle: 'Clasifica los datos en la banda y decide, ante cada pregunta, si los guardas o los compartes.',
};

export function EntradaSecretoOPublico(props: ActivityProps) {
  return <EntradaN2Unidad6Base {...props} entrada={CONFIG} />;
}

export default EntradaSecretoOPublico;
