import { CINTA_INTERMEDIO, type Pestana } from '../../tecniaTextos';

/**
 * La cinta de `n4-documento-de-varias-paginas`.
 *
 * Sale de `CINTA_INTERMEDIO` —el grado que le toca a la clase— y se queda con
 * tres pestañas: **Inicio, Insertar y Disposición**. Referencias, Revisar y las
 * demás no se enseñan hoy y una pestaña de más es una invitación a perderse;
 * las tres que quedan bastan para que se siga viendo que la cinta tiene cajones
 * y que cambiar de cajón cambia todo lo de abajo, que es lo que enseñó la
 * clase 1 y aquí se da por sabido.
 *
 * Lo único que se AÑADE es el grupo **Páginas** con «Salto de página», y va el
 * primero de Insertar porque ahí está en Word. En Disposición se queda «Saltos»
 * tal como viene, y hace lo mismo: en Word los dos caminos existen, y un botón
 * que se llama «Saltos» y no salta sería una trampa.
 *
 * ── POR QUÉ LOS DOS BOTONES COMPARTEN EL ID `salto` (10-ago-2026, §37) ───────
 *
 * Nacieron con dos ids —`salto-pagina` aquí y `salto` en Disposición— y con el
 * modo guía eso pasó de ser un detalle a ser dos defectos, medidos:
 *
 *  · **La ficha se quedaba muda.** `QUE_HACE` está indizado por id de control, y
 *    la del salto está escrita como `salto`. Con `salto-pagina`, el panel
 *    enseñaba el glifo, el nombre y el domicilio del botón y NO decía para qué
 *    sirve, que es justo la mitad que el cliente pidió.
 *  · **Y castigaba el camino bueno.** El desvío se decide comparando el id
 *    pulsado con el señalado: pulsar Disposición → Saltos —que hace exactamente
 *    lo mismo y que en Word es el otro camino de verdad— contaba como error, se
 *    DESHACÍA el salto recién puesto y se le mandaba al otro botón. Enseñarle a
 *    un niño que su respuesta correcta está mal es peor que no enseñarle nada.
 *
 * Una herramienta, un id. Las dos puertas siguen abiertas y las dos son buenas.
 * No se pisan en el DOM porque la cinta sólo pinta la pestaña abierta, y
 * `ubicar()` devuelve la de Insertar —la primera que encuentra— que es donde
 * esta clase la enseña.
 *
 * Ninguno de estos ids se toca en `tecniaTextos.tsx`: la cinta se compone aquí,
 * en la carpeta de la clase, que es la regla del bloque Office.
 */

const PESTANAS = ['inicio', 'insertar', 'disposicion'];

export const CINTA_VARIAS_PAGINAS: Pestana[] = CINTA_INTERMEDIO.filter((p) =>
  PESTANAS.includes(p.id),
).map((pestana) =>
  pestana.id !== 'insertar'
    ? pestana
    : {
        ...pestana,
        grupos: [
          {
            id: 'paginas',
            nombre: 'Páginas',
            controles: [
              {
                id: 'salto',
                glifo: '⤓',
                etiqueta: 'Salto de página',
                corto: 'Salto',
                ancho: true,
              },
            ],
          },
          ...pestana.grupos,
        ],
      },
);
