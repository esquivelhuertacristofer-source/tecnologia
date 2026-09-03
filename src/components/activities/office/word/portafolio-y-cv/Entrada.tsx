'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabPortafolioYCv } from './Lab';

/**
 * Entrada de `n10-portafolio-y-cv` — segunda parada de N10 · «Proyecto capstone
 * y portafolio» (§49.5).
 *
 * La ruta sale de `getUnidad('n10-capstone-y-portafolio')`: el id es `n10-`, la
 * clase vive en la unidad del nivel 10 y el número gigante del CTA se deriva de
 * su sitio en esa lista, como en toda clase que no es exclusiva de la sala de
 * Office.
 *
 * **Cada cadena está escrita para esta clase.** Ni una frase de
 * `of-word-estilos-e-indice`, que es la otra clase de Word donde se pulsa
 * Título 1 y Título 2: allí el estilo sirve para que la máquina escriba el
 * índice, y aquí para que un lector con prisa encuentre dónde mirar (§49.5).
 */

const RUTA_N10: PasoRuta[] = (getUnidad('n10-capstone-y-portafolio')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const ACTIVIDAD = 'n10-portafolio-y-cv';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabPortafolioYCv,
  ruta: RUTA_N10,
  parada: Math.max(1, RUTA_N10.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo: 'Siete segundos. Eso es todo lo que te van a dar.',
  arranqueSub:
    'Sofía terminó el bachillerato técnico y escribió su currículum como le salió: todo en Normal, el correo que se hizo a los trece años, un objetivo profesional de once renglones que habla de sinergia y de crecer día con día, los dos logros que valen la pena enterrados dentro de párrafos, y una sección de pasatiempos. No hay ni un dato falso en ese documento; lo que está mal es el orden, el peso y lo que sobra. Vas a arreglarlo sin cambiar un solo dato, y todo lo que decidas se juzga contra un cronómetro: quien recibe un currículum le dedica siete segundos antes de decidir si sigue leyendo.',
  stats: [
    { etiqueta: 'Segundos', valor: '7', acento: '#22d3ee' },
    { etiqueta: 'Datos falsos', valor: '0', acento: '#f5a524' },
    { etiqueta: 'Encargos', valor: '8', acento: '#34d399' },
  ],
  letrero: 'Todo es verdad, y aun así no funciona',
  fichas: [
    {
      key: 'esqueleto',
      tag: 'Estilos',
      numero: 1,
      titulo: 'Una negrita no es un título',
      detalle:
        'Los cuatro rótulos de este currículum están en negrita, y para el programa siguen siendo párrafos normales. Un estilo dice QUÉ es un renglón, y de ahí sale cómo se ve; una negrita sólo dice cómo se ve. En siete segundos la diferencia es que la mirada encuentra dónde saltar.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'comprobable',
      tag: 'Las viñetas',
      numero: 2,
      titulo: 'Lo que se puede comprobar vale',
      detalle:
        '«Responsable», «proactiva», «con ganas de aprender»: no se pueden comprobar y las escribe todo el mundo. «Documenté 40 errores» y «armé el buscador del catálogo» sí, y están enterradas dentro de un párrafo. Sacarlas a viñetas es el cambio que más devuelve de toda la clase.',
      acento: { c: '#f5a524', deep: '#b45309' },
    },
    {
      key: 'correo',
      tag: 'Una línea',
      numero: 3,
      titulo: 'Todo cuenta algo, quieras o no',
      detalle:
        'El correo que Sofía se hizo a los trece años no dice que sea peor técnica: dice que no revisó el documento antes de mandarlo. Nada de lo que hay en un currículum es sólo información — todo cuenta además algo sobre quien lo escribió.',
      acento: { c: '#f472b6', deep: '#9d174d' },
    },
    {
      key: 'borrar',
      tag: 'Lo más difícil',
      numero: 4,
      titulo: 'Quitar algo que está bien escrito',
      detalle:
        'La sección de pasatiempos es verdad y está bien redactada, y hay que borrarla entera. En siete segundos todo lo que se lee le quita sitio a otra cosa. Quitar es la decisión de diseño más difícil que hay, y la misma en un cartel, en una diapositiva y en un tablero de datos.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el currículum de Sofía',
  ctaDetalle:
    'Se abre «Currículum · Sofía Aranda.docx». Ocho encargos, y el primero es mirarlo siete segundos sin tocar nada. Los estilos y las viñetas están en Inicio; para cambiar un texto se selecciona y se escribe encima; para borrar una sección se seleccionan sus dos renglones y se borran.',
};

export function EntradaPortafolioYCv(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export const Entrada = EntradaPortafolioYCv;

export default EntradaPortafolioYCv;
