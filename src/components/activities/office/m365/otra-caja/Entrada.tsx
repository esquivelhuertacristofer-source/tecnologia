'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../../n4/estudio/EntradaN4Base';
import { rutaM365, paradaM365 } from '../comun/rutas';
import { LabOtraCaja as Lab } from './Lab';

/**
 * Entrada de `of-m365-otra-caja` — «El mismo trabajo en otra caja» (doc
 * §58.2, grado Avanzado de la sala de M365).
 *
 * Plantilla de oro sin tocarla: video, tres datos, letrero, fichas de color
 * pleno, CTA gigante y ruta. La ruta y la parada NO se escriben a mano: salen
 * de `rutaM365('avanzado')` / `paradaM365('avanzado', actividadId)`
 * (`office/m365/comun/rutas.ts`), derivadas de `EJERCICIOS_OFFICE` — el mismo
 * patrón que ya usan Word y PowerPoint, para que ninguna clase hermana quede
 * diciendo una parada que dejó de ser verdad.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/of-m365-otra-caja/video-explicativo.mp4` y la bandera bajó a
 * `assetsPendientes: false`. OJO si escribes pruebas: con el video puesto, el
 * primer `<button>` del documento ya no es el CTA sino el de la portada, así
 * que no lo busques por posición — búscalo por su texto.
 *
 * Las cuatro fichas van en el orden en que el laboratorio pide las tareas:
 * primero la idea general (el oficio es transferible), y después las tres
 * tareas en el orden de las pestañas —Documentos, Hojas, Presentaciones—,
 * para que quien llega ya sepa qué se le va a pedir en cada una antes de
 * tocar nada.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-m365-otra-caja',
  laboratorio: Lab,
  ruta: rutaM365('avanzado'),
  parada: paradaM365('avanzado', 'of-m365-otra-caja'),
  globo:
    '¡Hola! Soy Bit. Los programas cambian, pero tu talento es el mismo. ¡Vamos a demostrar que puedes dominar cualquier caja!',
  arranqueSub:
    'Llegas a colaborar con un equipo que no usa la suite de siempre, sino "Tecnia Nube Suite": otra caja, con los mismos botones en otro sitio. Vas a dar formato a un título en Documentos, calcular un promedio de verdad en Hojas y cambiar el tema de una diapositiva en Presentaciones. Tres tareas, tres programas que nunca abriste, y el mismo oficio que ya sabes hacer.',
  stats: [
    { etiqueta: 'Módulos', valor: '3', acento: '#22d3ee' },
    { etiqueta: 'Programas nuevos', valor: '3', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Adaptabilidad Multiplataforma',
  fichas: [
    {
      key: 'oficio',
      tag: 'La idea central',
      numero: 1,
      titulo: 'El oficio, no el botón',
      detalle:
        'Word, Excel y PowerPoint te enseñaron a hacer negrita, a calcular un promedio y a cambiar un diseño. Eso que aprendiste no es la posición de un botón: es el oficio. En cualquier programa parecido, el botón cambia de sitio y el concepto se queda igual.',
      img: 'ficha-oficio.webp',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'documentos',
      tag: 'Documentos',
      numero: 2,
      titulo: 'El mismo formato, otro menú',
      detalle:
        'Aquí no hay cinta de opciones: hay un menú Formato con dos controles. Seleccionas el título con un clic y le aplicas negrita y tamaño 18. El resultado se ve exactamente igual que en Word, aunque el menú para llegar sea distinto.',
      img: 'ficha-documentos.webp',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'hojas',
      tag: 'Hojas',
      numero: 3,
      titulo: 'La misma fórmula, otro icono',
      detalle:
        'La celda E5 necesita el promedio de B5:D5. El icono no dice "fx" como en Excel: es la letra griega Sigma. Ábrelo, elige PROMEDIO y confirma el rango — el número que aparece se calcula de verdad, no está escrito de antemano.',
      img: 'ficha-hojas.webp',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'presentaciones',
      tag: 'Presentaciones',
      numero: 4,
      titulo: 'El mismo tema, otro panel',
      detalle:
        'Un botón "Cambiar Tema" abre un panel con varios estilos de color. Eliges uno y el fondo y el acento de la diapositiva cambian de verdad delante de ti — la misma idea que un diseño de PowerPoint, con el selector en otro lugar.',
      img: 'ficha-presentaciones.webp',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
  ],
  // El video ya está publicado (2-sep-2026) en
  // /assets/actividades/of-m365-otra-caja/, así que la entrada lo reproduce.
  // El laboratorio nunca dependió de él.
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Nube Suite',
  ctaDetalle:
    'La ventana se abre directamente en el módulo Documentos, con tus tres pestañas arriba —Documentos, Hojas, Presentaciones— y tu maestro Bit hablando junto a la ventana. No hay nada que arrastrar: cada paso es un clic. Si tocas el botón que no era, Bit te dice cuál era el correcto en vez de dejarte adivinar. Cuando las tres pestañas tengan su marca de verificación, pulsa "Entregar Proyecto Multiplataforma" para cerrar la clase.',
};

export function Entrada(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default Entrada;
