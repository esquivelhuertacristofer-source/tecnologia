'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../n4/estudio/EntradaN4Base';
import { LabTusPrimerasDiapositivas } from './LabTusPrimerasDiapositivas';

/**
 * Entrada de `n4-tus-primeras-diapositivas` (doc §27.1).
 *
 * Plantilla de oro sin tocarla: video, tres datos, letrero, fichas de color
 * pleno, CTA gigante y ruta. Las cuatro fichas van en el orden en que la clase
 * las necesita y ninguna dice «dónde está el botón»: la primera fija la regla
 * que sostiene todo lo demás —una diapositiva, una idea—, la segunda explica qué
 * es una portada, la tercera enseña que el diseño es un acomodo y no un adorno,
 * y la cuarta pone el orden como parte del mensaje. Un alumno que se quede sólo
 * con la primera ya presenta mejor que la mitad de los adultos.
 */

/** Las tres paradas de N4 · U5, tal como las lista `curriculo.ts`. */
const RUTA_N4_U5: PasoRuta[] = [
  { id: 'n4-tus-primeras-diapositivas', titulo: 'Tus primeras diapositivas' },
  { id: 'n4-imagenes-y-texto', titulo: 'Imágenes y texto que se entienden' },
  { id: 'n4-presenta-al-grupo', titulo: 'Presenta frente al grupo' },
];

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n4-tus-primeras-diapositivas',
  laboratorio: LabTusPrimerasDiapositivas,
  ruta: RUTA_N4_U5,
  parada: 1,
  globo: 'Cuatro pantallas, cuatro ideas, y una historia que se entiende. Vamos a armar tu presentación.',
  arranqueSub:
    'Bit enciende el proyector y la pantalla del fondo se pone azul. «Aquí es donde se cuenta lo que hiciste», dice. Una presentación es un montón de pantallas —las diapositivas— que van pasando mientras alguien habla, y hoy vas a armar la de Sofi sobre el desierto: cuatro diapositivas, cada una con una sola idea, cada una con el acomodo que le va, y todas puestas en un orden que se entienda. Dentro te espera Tecnia Diapositivas, que es el programa entero.',
  stats: [
    { etiqueta: 'Diapositivas', valor: '4', acento: '#f5a524' },
    { etiqueta: 'Diseños', valor: '4', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'El auditorio',
  fichas: [
    {
      key: 'una-idea',
      tag: 'La regla de oro',
      numero: 1,
      titulo: 'Una diapositiva, una idea',
      detalle:
        'Si metes tres cosas en la misma pantalla, el público no sabe a cuál mirar y tú te enredas contando. Una pantalla, una idea, y la siguiente idea a la pantalla siguiente. Es la regla que sostiene todo lo demás.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'portada',
      tag: 'La primera',
      numero: 2,
      titulo: 'La portada dice de qué va',
      detalle:
        'La primera diapositiva lleva el título de TODO el trabajo y el nombre de quien lo hizo. No es un trámite: es lo que el público lee mientras te acomodas, y es lo que le dice de qué le vas a hablar.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'disenos',
      tag: 'Los diseños',
      numero: 3,
      titulo: 'El acomodo ya viene hecho',
      detalle:
        'Cada diapositiva tiene un diseño, que es una plantilla de acomodo. Portada para empezar, título y texto para explicar, solo imagen cuando la foto lo dice todo, y dos contenidos para comparar dos cosas. Elegir bien te ahorra acomodar a mano.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'orden',
      tag: 'El orden',
      numero: 4,
      titulo: 'La tira es tu guion',
      detalle:
        'A un lado tienes la fila de miniaturas: ahí ves toda tu presentación de un vistazo. No es lo mismo empezar por la portada que por la conclusión, y arrastrar una miniatura hasta su sitio es cambiar la historia que cuentas.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
  ],
  // El video depende de la campaña, congelada en 8 de 60 por decisión de
  // Cristofer, y la entrada lo dice en pantalla en vez de cargar un reproductor
  // roto. Las cuatro láminas de las fichas todavía no se han sacado por krea2:
  // por eso ninguna ficha declara `img`. Medido el 11-ago-2026 — declararla sin
  // tener el archivo son cuatro peticiones 400 en la consola y cuatro huecos
  // grises en pantalla, que es peor que no poner lámina.
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Diapositivas',
  ctaDetalle:
    'La ventana se convierte en el programa entero: la tira de diapositivas a la izquierda, el lienzo en el centro, el cajón de notas debajo y tu maestro a la derecha con el primer encargo. Vas a crear la portada de la mano —un aro naranja te marca el botón exacto y te dice para qué sirve antes de que lo pulses—, luego vas a elegir tú el diseño de cada idea sin que nadie te lo señale, y al final vas a ordenar la tira y repasarla como la verá tu grupo. Si te equivocas de botón, te digo cuál tocaste y no te lo aplico, para que tu presentación no se ensucie.',
};

export function EntradaTusPrimerasDiapositivas(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaTusPrimerasDiapositivas;
