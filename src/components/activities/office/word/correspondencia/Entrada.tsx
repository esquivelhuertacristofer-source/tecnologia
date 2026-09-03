'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../../n4/estudio/EntradaN4Base';
import { Lab } from './Lab';

/**
 * Entrada de `of-word-correspondencia` — «Un molde y una lista».
 *
 * Plantilla de oro sin tocarla: video, tres datos, letrero, fichas de color
 * pleno, CTA gigante y ruta. Que la base viva en `n4/estudio` es sólo historia
 * —nació allí—: la ruta viaja en la configuración, así que aquí es la del grado
 * Avanzado de la sala de Word y la parada es la 1.
 *
 * Las cuatro fichas van en el orden en que la clase las necesita y ninguna dice
 * dónde está el botón. La primera nombra el problema —ochenta cartas a mano—, la
 * segunda explica qué es un campo y por qué no es un nombre, la tercera es el
 * corazón —la lista manda: cada renglón es una carta— y la cuarta dice en voz
 * alta lo que la clase enseña por debajo: separar el molde de los datos es
 * programar. Un alumno que se quede sólo con la tercera ya entendió por qué esto
 * sirve para ochocientas cartas igual que para ocho.
 */

/** Las cuatro clases exclusivas del grado Avanzado de la sala de Word. */
const RUTA_WORD_AVANZADO: PasoRuta[] = [
  { id: 'of-word-correspondencia', titulo: 'Combinar correspondencia' },
  { id: 'of-word-plantillas', titulo: 'Tu propia plantilla' },
  { id: 'of-word-formularios', titulo: 'Formularios y protección' },
  { id: 'of-word-coautoria', titulo: 'Dos personas, un archivo' },
];

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'of-word-correspondencia',
  laboratorio: Lab,
  ruta: RUTA_WORD_AVANZADO,
  parada: 1,
  globo: 'Hoy vas a escribir una sola carta y a mandar nueve, cada una con el nombre de quien la recibe.',
  arranqueSub:
    'En la dirección de la escuela hay que mandar la invitación de fin de cursos a todo un grupo, y cada carta tiene que llevar el nombre del alumno, su grado y su grupo. Copiar la carta y corregirla a mano ocho veces es el camino seguro a que a alguien le llegue el nombre de otro. Word tiene otra forma: escribes UNA carta con huecos y le enseñas una lista de datos. En el laboratorio te esperan la invitación a medio hacer, ocho alumnos en una lista y diez encargos.',
  stats: [
    { etiqueta: 'Encargos', valor: '10', acento: '#f5a524' },
    { etiqueta: 'Destinatarios', valor: '8', acento: '#22d3ee' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Un molde, una lista, muchas cartas',
  fichas: [
    {
      key: 'a-mano',
      tag: 'El problema',
      numero: 1,
      titulo: 'Ochenta cartas a mano',
      detalle:
        'Copiar la carta y cambiarle el nombre parece rápido con dos. Con ochenta, no: se te olvida uno, a dos les pones el mismo nombre, y si al final cambia la hora del evento tienes que corregir ochenta veces. Todo eso pasa porque el nombre está escrito DENTRO de la carta.',
      img: 'ficha-a-mano.png',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'campo',
      tag: 'El molde',
      numero: 2,
      titulo: 'Un hueco con etiqueta',
      detalle:
        'Un campo combinado se escribe «Nombre», con esas comillas de pico, y no es el nombre de nadie: es una instrucción que dice «aquí va lo que ponga la columna Nombre». La carta deja de hablar de una persona y pasa a ser un molde que sirve para cualquiera.',
      img: 'ficha-campo.png',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'lista',
      tag: 'Los datos',
      numero: 3,
      titulo: 'La lista es la que manda',
      detalle:
        'Los datos viven aparte, en una tabla: una columna por campo y un renglón por persona. Cada renglón se convierte en una carta. Si añades a alguien, sale una carta más; si corriges un apellido, se corrige en la suya. No tocas la carta ni una vez.',
      img: 'ficha-lista.png',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
    {
      key: 'programar',
      tag: 'La idea grande',
      numero: 4,
      titulo: 'Esto ya es programar',
      detalle:
        'Separar el molde de los datos es lo que hace un programa cuando saca mil boletas, mil recibos o mil diplomas: una plantilla, una tabla y una vuelta por cada renglón. Está en el temario de Word porque es el sitio donde se ve por primera vez sin escribir ni una línea de código.',
      img: 'ficha-programar.png',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
  ],
  // El video y las láminas dependen de la campaña de videos, congelada en 8 de
  // 60 por decisión de Cristofer. La entrada lo dice en pantalla en vez de
  // cargar seis 404; el laboratorio no depende de ellos.
  assetsPendientes: false,
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre Tecnia Textos',
  ctaDetalle:
    'La ventana se convierte en el programa entero y a la derecha aparece tu maestro con el primer encargo. Vas a abrir la lista de los ocho alumnos, a meter huecos en la carta en vez de nombres, a encender la vista previa para verla llenarse sola, y a combinar para que Word te deje las ocho cartas hechas. Al final se inscribe un alumno más y vas a ver de dónde sale la novena. No vas a andar buscando botones: el señalador te marca el que toca desde el primer segundo y el maestro te dice para qué sirve antes de que lo pulses.',
};

export function Entrada(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default Entrada;
