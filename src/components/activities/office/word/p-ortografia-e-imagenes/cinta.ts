import type { Pestana } from '@/components/activities/office/tecniaTextos';
import { CINTA_BASICO } from '@/components/activities/office/tecniaTextos';

/**
 * La cinta de `n3-ortografia-e-imagenes`, recortada a los ocho o nueve años.
 *
 * Se parte de `CINTA_BASICO` y se deja fuera todo lo que esta clase no usa.
 * Menos botones no es un programa más pobre: es lo que hace Word de verdad
 * cuando enciendes el modo simplificado, y es la regla de §34 —«un alumno de
 * ocho años delante de nueve pestañas no ve una herramienta, ve ruido»—.
 *
 * Qué se quitó y por qué:
 *
 * · **Portapapeles entero.** Pegar no está construido y Copiar y Cortar no
 *   aparecen en ningún encargo. Un botón muerto en la esquina de arriba a la
 *   izquierda es lo primero que toca un niño, y la ventana sólo puede contestar
 *   «todavía no está» (§36.8 D).
 * · **Estilos.** Título 1 y Título 2 son la clase siguiente. El escrito ya trae
 *   su título puesto.
 * · **Viñetas, números, sangrías e interlineado** del grupo Párrafo. Esta clase
 *   no hace listas. Quedan las CUATRO alineaciones, y quedan las cuatro juntas
 *   a propósito: verlas en fila es lo que hace evidente que son cuatro formas de
 *   lo mismo y que sólo una puede estar puesta a la vez.
 * · **Formas, WordArt, cuadro de texto, encabezado, pie y número de página** de
 *   Insertar. De toda la pestaña queda `Imagen`, que es lo que la clase mete en
 *   el documento. Y queda EN INSERTAR, que es donde vive en Word: lo que se mete
 *   nuevo en un documento no está en Inicio, y descubrirlo es media lección.
 * · **Color de letra.** Sin encargo que lo pida, es una invitación a pintar el
 *   escrito de naranja en mitad de una clase de revisión.
 *
 * Y se añade la pestaña **Revisar** con un solo grupo y un solo botón, el
 * corrector de ortografía, que es la herramienta de la que va la clase. La trae
 * el grado Intermedio, pero un niño de tercero de primaria revisa la ortografía
 * de lo que escribe: el orden del temario no puede quitarle la herramienta que
 * la parada le pide usar.
 */
const INICIO = CINTA_BASICO.find((p) => p.id === 'inicio');
const FUENTE_BASE = INICIO?.grupos.find((g) => g.id === 'fuente');
const PARRAFO_BASE = INICIO?.grupos.find((g) => g.id === 'parrafo');

const dejar = (ids: string[], grupo: typeof FUENTE_BASE) =>
  ids.map((id) => grupo?.controles.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => Boolean(c));

export const CINTA_ORTOGRAFIA: Pestana[] = [
  {
    id: 'inicio',
    nombre: 'Inicio',
    grupos: [
      {
        id: 'fuente',
        nombre: 'Fuente',
        controles: dejar(['negrita', 'cursiva', 'subrayado', 'mayor', 'menor'], FUENTE_BASE),
      },
      {
        id: 'parrafo',
        nombre: 'Párrafo',
        controles: dejar(['izquierda', 'centro', 'derecha', 'justificado'], PARRAFO_BASE),
      },
    ],
  },
  {
    id: 'insertar',
    nombre: 'Insertar',
    grupos: [
      {
        id: 'ilustraciones',
        nombre: 'Ilustraciones',
        controles: [{ id: 'imagen', glifo: '🖼', etiqueta: 'Imagen', ancho: true }],
      },
    ],
  },
  {
    id: 'revisar',
    nombre: 'Revisar',
    grupos: [
      {
        id: 'revision',
        nombre: 'Revisión',
        controles: [{ id: 'ortografia', glifo: '✓ᴬ', etiqueta: 'Ortografía', ancho: true }],
      },
    ],
  },
];
