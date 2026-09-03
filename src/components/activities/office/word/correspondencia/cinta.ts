import {
  CINTA_AVANZADO,
  type ControlCinta,
  type Pestana,
} from '@/components/activities/office/tecniaTextos';
import { ensenandoElResultado, type EstadoCombinacion } from './estado';

/**
 * La cinta de esta clase: la del grado Avanzado con la pestaña Correspondencia
 * amueblada.
 *
 * La pestaña ya existía en `CINTA_AVANZADO` con tres botones de adorno —el grado
 * Avanzado se dibujó entero antes de que hubiera clases—. Aquí se sustituye por
 * la de verdad, sin tocar `tecniaTextos.tsx`: la clase declara lo suyo y la
 * ventana pinta lo que le den.
 *
 * ── LOS ROTULOS SON EL MAPA ─────────────────────────────────────────────────
 * Los cuatro grupos se llaman como en Word —«Iniciar combinación», «Escribir
 * campos», «Vista previa de resultados», «Finalizar»— porque el tercer encargo
 * consiste en leerlos y decidir en cuál se busca. Si los rótulos fueran
 * inventados, ese encargo no enseñaría nada que sirva delante de un Word de
 * verdad.
 *
 * ── LA CINTA SE VUELVE A CONSTRUIR EN CADA CAMBIO ───────────────────────────
 * `Vista previa` no es sólo un interruptor: mientras está encendida, su nombre
 * corto dice por qué destinatario va —«3 de 8»—, que es el cuadro del número de
 * registro de Word metido en el propio botón. Por eso la cinta es una función
 * del estado y no una constante: la ventana la recibe por prop y la repinta.
 */

const glifoDe = (n: number) => String(n);

export function construirCinta(e: EstadoCombinacion): Pestana[] {
  const total = e.destinatarios.length;

  // Tres estados y tres rótulos: apagada, encendida por el destinatario tal, y
  // «vuelve a la carta» cuando lo que se ve son las cartas ya combinadas.
  const volver = ensenandoElResultado(e);
  const previa: ControlCinta[] = [
    {
      id: 'cor-vista-previa',
      glifo: '👁',
      // El nombre del botón se queda corto a propósito. Llevaba dentro el nombre
      // completo del destinatario —«…viendo a Ana Sofía Ramírez Nava»— y desde
      // que existe el modo guía (§37) la etiqueta ya no es sólo el globo de
      // ayuda: es el rótulo del señalador, el título de la ficha y lo que dice
      // el recado del desvío. Medido: «El que buscas es «Vista previa de
      // resultados · viendo a Ana Sofía Ramírez Nava»» no lo lee nadie. Por qué
      // destinatario va se dice con su número, que es como lo dice Word.
      etiqueta: e.previsualizando
        ? `Vista previa de resultados · ${glifoDe(e.indice + 1)} de ${total}`
        : volver
          ? 'Volver a la carta con sus campos'
          : 'Vista previa de resultados',
      corto: e.previsualizando
        ? `${glifoDe(e.indice + 1)} de ${total}`
        : volver
          ? 'Ver la carta'
          : 'Vista previa',
      ancho: true,
    },
    { id: 'cor-primero', glifo: '⏮', etiqueta: 'Primer destinatario', corto: 'Primero', ancho: true },
    { id: 'cor-anterior', glifo: '◀', etiqueta: 'Destinatario anterior', corto: 'Anterior', ancho: true },
    { id: 'cor-siguiente', glifo: '▶', etiqueta: 'Destinatario siguiente', corto: 'Siguiente', ancho: true },
  ];

  const correspondencia: Pestana = {
    id: 'correspondencia',
    nombre: 'Correspondencia',
    grupos: [
      {
        // `iniciar` es un id que el motor ya sabe pintar con botón principal:
        // uno grande a la izquierda, como el Pegar de Inicio.
        id: 'iniciar',
        nombre: 'Iniciar combinación',
        controles: [
          {
            id: 'cor-destinatarios',
            glifo: '👥',
            etiqueta: 'Lista de destinatarios',
            corto: 'Lista',
            ancho: true,
          },
        ],
      },
      {
        id: 'cor-campos',
        nombre: 'Escribir campos',
        controles: [
          { id: 'cor-campo-nombre', glifo: '«»', etiqueta: 'Insertar campo Nombre', corto: 'Nombre', ancho: true },
          { id: 'cor-campo-grado', glifo: '«»', etiqueta: 'Insertar campo Grado', corto: 'Grado', ancho: true },
          { id: 'cor-campo-grupo', glifo: '«»', etiqueta: 'Insertar campo Grupo', corto: 'Grupo', ancho: true },
        ],
      },
      { id: 'cor-previa', nombre: 'Vista previa de resultados', controles: previa },
      {
        id: 'finalizar',
        nombre: 'Finalizar',
        controles: [
          {
            id: 'cor-combinar',
            glifo: '⇉',
            etiqueta: 'Finalizar y combinar',
            corto: 'Combinar',
            ancho: true,
          },
        ],
      },
    ],
  };

  return CINTA_AVANZADO.map((p) => (p.id === 'correspondencia' ? correspondencia : p));
}
