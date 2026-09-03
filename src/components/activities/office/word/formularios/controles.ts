import {
  ejecutar,
  estaActivo,
  estaInerte,
  type ControlesDeClase,
} from '@/components/office/motor/comandos';
import { CASILLA_VACIA, formulario, LISTA_MUESTRA, TEXTO_MUESTRA } from './formulario';

/**
 * Los controles que aporta `of-word-formularios`.
 *
 * Dos familias distintas y conviene no confundirlas:
 *
 * **(1) Los cuatro botones nuevos** —tres controles de formulario y Restringir
 * edición—. Se declaran aquí, en la carpeta de la clase, tal como manda el
 * motor: nadie edita `comandos.ts` para añadir una herramienta de una clase.
 *
 * **(2) Los botones de siempre, envueltos.** Con la ficha protegida, en Word el
 * medio cinta se apaga: no se puede poner negrita ni centrar nada, porque el
 * documento está cerrado. Sin esto, aquí los botones seguirían pareciendo vivos,
 * el alumno los pulsaría, `filterTransaction` se comería la transacción en
 * silencio —y encima el maestro le apuntaría un tropiezo por hacer algo que el
 * programa le dejaba intentar—. Envolverlos es lo que convierte el silencio en
 * la frase que toca: «aquí no se puede».
 *
 * El envoltorio **delega** en el motor para las tres respuestas —hacer, hundido
 * e inerte— llamando a `ejecutar`/`estaActivo`/`estaInerte` SIN pasar `propios`,
 * que es la rama del motor de siempre. Así no se copia ni una línea de lógica de
 * comandos: lo único que esta clase añade es el «y además, si está protegido, no».
 */

/** Los que de verdad hacen algo en el grado Avanzado. Lo demás ya nace inerte. */
const DEL_MOTOR = [
  'copiar', 'cortar',
  'negrita', 'cursiva', 'subrayado', 'color', 'mayor', 'menor',
  'vinetas', 'numeros', 'quitar-sangria', 'sangria', 'interlineado',
  'izquierda', 'centro', 'derecha', 'justificado',
  'normal', 'titulo1', 'titulo2', 'wordart',
  'tabla',
  'fila-abajo', 'columna-derecha', 'quitar-fila', 'quitar-columna', 'combinar', 'dividir',
];

const envueltos: ControlesDeClase = Object.fromEntries(
  DEL_MOTOR.map((id) => [
    id,
    {
      hacer: (vista) => ejecutar(vista, id),
      activo: (estado) => estaActivo(estado, id),
      inerte: (estado) => formulario.modo !== 'ninguno' || estaInerte(estado, id),
    },
  ]),
);

export const CONTROLES: ControlesDeClase = {
  ...envueltos,

  'campo-texto': {
    hacer: (vista) => {
      formulario.instalar(vista);
      return formulario.insertar(vista, TEXTO_MUESTRA);
    },
    inerte: () => formulario.modo !== 'ninguno',
  },

  'campo-lista': {
    hacer: (vista) => {
      formulario.instalar(vista);
      return formulario.insertar(vista, LISTA_MUESTRA);
    },
    inerte: () => formulario.modo !== 'ninguno',
  },

  'campo-casilla': {
    hacer: (vista) => {
      formulario.instalar(vista);
      return formulario.insertar(vista, CASILLA_VACIA);
    },
    inerte: () => formulario.modo !== 'ninguno',
  },

  /**
   * Trae el panel de Restringir edición. Nunca se apaga: es la única salida de
   * una protección puesta mal —«Sin cambios (sólo lectura)» deja la ficha
   * muerta— y apagarlo dejaría al alumno encerrado sin manera de volver.
   *
   * **Abre; no alterna.** El porqué, medido, está en `Aparato.abrirPanel`: el
   * encargo 4 invita a ir a Revisar y pulsar lo que se encuentre, y con un
   * interruptor el alumno cerraba en el encargo 5 el panel que el 6 necesita. Se
   * cierra con la X del panel, que es lo que dicen las pistas.
   */
  restringir: {
    hacer: (vista) => {
      formulario.instalar(vista);
      formulario.abrirPanel();
      return true;
    },
    activo: () => formulario.modo !== 'ninguno',
    inerte: () => false,
  },
};
