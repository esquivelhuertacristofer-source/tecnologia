'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../n4/estudio/EntradaN4Base';
import { LabAudioEImagenes } from './LabAudioEImagenes';

/**
 * Entrada de `n5-audio-e-imagenes` (doc §42.2).
 *
 * Las cuatro fichas son las cuatro reglas de la clase, y la primera es la que
 * la hace distinta de cualquier clase de informática: **el sonido casi siempre
 * sobra**. Enseñar a insertar audio sin enseñar cuándo no hacerlo es enseñar a
 * hacer presentaciones peores.
 */

const RUTA_N5_U2: PasoRuta[] = [
  { id: 'n5-transiciones-con-proposito', titulo: 'Transiciones con propósito' },
  { id: 'n5-audio-e-imagenes', titulo: 'Audio e imágenes' },
  { id: 'n5-la-buena-diapositiva', titulo: 'Las reglas de la buena diapositiva' },
];

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n5-audio-e-imagenes',
  laboratorio: LabAudioEImagenes,
  ruta: RUTA_N5_U2,
  parada: 2,
  globo: '¿Un volcán suena? Sí. Y hoy vas a hacer que tu diapositiva suene… una sola vez.',
  arranqueSub:
    'Vuelves a abrir la presentación de Diego, la que dejaste arreglada la clase pasada. Hoy le metes sonido: el retumbe del volcán, en la diapositiva que habla de las erupciones, porque ahí el sonido ES el tema. Y cuando Bit te ofrezca música de fondo para todas, vas a tener que decidir. Después le toca a la foto del Popocatépetl, que entró estirada a lo ancho: la arreglas desde una esquina, la recortas para quitarle un estacionamiento que no viene al caso, y le escribes una descripción para quien no puede verla.',
  stats: [
    { etiqueta: 'Diapositivas', valor: '6', acento: '#22d3ee' },
    { etiqueta: 'Reglas', valor: '3', acento: '#f5a524' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Que suene lo que cuenta',
  fichas: [
    {
      key: 'el-sonido-es-el-tema',
      tag: 'Clave 1',
      numero: 1,
      titulo: 'Cuando el sonido es el tema',
      detalle:
        'Casi siempre el audio sobra: la música de fondo tapa tu voz y el efecto al cambiar distrae. Hay un caso en que es oro, y es cuando el sonido ES la cosa de la que hablas. Si cuentas el retumbe de un volcán, oírlo enseña.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'no-la-estires',
      tag: 'Clave 2',
      numero: 2,
      titulo: 'No la estires',
      detalle:
        'Estirar una foto para que llene el hueco deja a la gente gorda y a los volcanes chatos. Se ajusta desde una esquina, que respeta su forma. Desde un lado la aplastas, y se nota desde el fondo del salón.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
    {
      key: 'recortar-es-elegir',
      tag: 'Clave 3',
      numero: 3,
      titulo: 'Recortar es elegir',
      detalle:
        'Una foto trae mucho que no viene al caso. Recortar no la encoge: le quita los bordes que sobran y deja sólo lo que estás contando. Decidir qué sobra es decidir de qué hablas.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'que-se-lea-sin-verla',
      tag: 'Clave 4',
      numero: 4,
      titulo: 'Que se pueda leer sin verla',
      detalle:
        'El texto alternativo es una frase que describe la imagen para quien no la ve, porque usa un lector de pantalla o porque no cargó. No se ve nunca, se escribe una vez, y sin ella tu presentación deja fuera a alguien.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Ponle sonido',
  ctaDetalle:
    'Se abre «Volcanes de Diego.pptx» donde lo dejaste. Estrenas Insertar → Multimedia → Audio y aparece un altavoz que suena de verdad al pulsarlo. Después seleccionas la foto del Popocatépetl y verás salir una pestaña que no estaba: «Formato de imagen». Sale sola cuando seleccionas algo y se va cuando lo sueltas; dentro están Recortar y Texto alternativo. Prueba a tirar de un lado de la foto antes de arreglarla desde la esquina: es la única forma de ver lo que hace.',
};

export function EntradaAudioEImagenes(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaAudioEImagenes;
