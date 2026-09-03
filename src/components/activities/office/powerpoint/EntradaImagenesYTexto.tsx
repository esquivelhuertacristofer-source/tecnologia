'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../n4/estudio/EntradaN4Base';
import { LabImagenesYTexto } from './LabImagenesYTexto';

/**
 * Entrada de `n4-imagenes-y-texto` (doc §27.2).
 *
 * Las cuatro fichas son **las cuatro reglas**, en el orden en que la clase las
 * usa, y ninguna dice dónde está un botón: pocas palabras, letra grande,
 * contraste, e imagen que apoya. Un alumno que se quede sólo con la primera ya
 * presenta mejor que la mitad de los adultos.
 */

const RUTA_N4_U5: PasoRuta[] = [
  { id: 'n4-tus-primeras-diapositivas', titulo: 'Tus primeras diapositivas' },
  { id: 'n4-imagenes-y-texto', titulo: 'Imágenes y texto que se entienden' },
  { id: 'n4-presenta-al-grupo', titulo: 'Presenta frente al grupo' },
];

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n4-imagenes-y-texto',
  laboratorio: LabImagenesYTexto,
  ruta: RUTA_N4_U5,
  parada: 2,
  globo: 'Una diapositiva se ve de lejos y por tres segundos. Vamos a hacer que se entienda.',
  arranqueSub:
    'Bit no te lleva al escenario: te sienta en la última butaca del auditorio. «Así se ve tu diapositiva de verdad», dice. Desde ahí, la presentación del desierto que armaste no aguanta: hay una pantalla con un muro de renglones que ni siquiera cabe en su caja, un título en letra chica y en un color que se pierde contra el fondo, y una diapositiva que promete una foto y no la trae. Vas a arreglar las tres con los controles de verdad del programa, y a comprobarlo alejándote.',
  stats: [
    { etiqueta: 'Reglas', valor: '4', acento: '#f5a524' },
    { etiqueta: 'Diapositivas', valor: '4', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Desde la última butaca',
  fichas: [
    {
      key: 'pocas-palabras',
      tag: 'Regla 1',
      numero: 1,
      titulo: 'Pocas palabras',
      detalle:
        'Lo que explica eres tú, hablando; la pantalla sólo pone la idea en grande. Una frase corta o tres viñetas, nunca párrafos. Si escribes todo lo que vas a decir, terminas leyendo la pantalla de espaldas al público, que es el error más común del mundo.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'letra-grande',
      tag: 'Regla 2',
      numero: 2,
      titulo: 'Letra grande',
      detalle:
        'Una diapositiva se ve de lejos. Si desde la última fila no se lee, es como si no estuviera. En una hoja un texto normal va en 12; en una pantalla proyectada el cuerpo empieza en 18 y un título ronda los 40.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'contraste',
      tag: 'Regla 3',
      numero: 3,
      titulo: 'Contraste',
      detalle:
        'Letra clara sobre fondo oscuro, o letra oscura sobre fondo claro. Amarillo sobre blanco no se ve, aunque en tu pantalla chiquita parezca que sí: el proyector del salón siempre lava los colores.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'imagen-que-apoya',
      tag: 'Regla 4',
      numero: 4,
      titulo: 'La imagen apoya',
      detalle:
        'Una imagen está para ayudar a entender lo que dices, no para adornar. Una foto del zorro cuando hablas del zorro ayuda; unas estrellitas de decoración sólo distraen. Y «me gusta» no es motivo para meter una imagen.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
  ],
  // El video sigue congelado con la campaña (8 de 60). Las cuatro láminas de
  // estas fichas tampoco se han sacado por krea2, y por eso ninguna declara
  // `img`: declararla sin el archivo son cuatro huecos grises y cuatro 400.
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Vuelve a Tecnia Diapositivas',
  ctaDetalle:
    'Se abre tu presentación del desierto tal como quedó, con tres cosas que no aguantan la última butaca. Primero vas a bajar el zoom al 45 % y mirarla como la verá tu grupo: ahí se ve sola cuál falla. Después vas a recortar el muro de texto a tres frases —y a guardar lo demás en el cajón de notas, que es lo que dices tú y el público no ve—, a arreglar el tamaño y el color de un título con los desplegables de verdad, y a elegir entre tres imágenes bonitas cuál es la que de verdad apoya lo que estás contando. Y al final, a repasarla entera.',
};

export function EntradaImagenesYTexto(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaImagenesYTexto;
