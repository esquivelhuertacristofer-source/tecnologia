import { CINTA_INTERMEDIO, type Pestana } from '../../tecniaTextos';

/**
 * La cinta de `of-word-revisa-y-comenta`.
 *
 * Es la del grado Intermedio con la pestaña **Revisar** rehecha en su casa, sin
 * tocar `tecniaTextos.tsx`: allí los tres botones de Seguimiento —control de
 * cambios, aceptar y rechazar— viven en un solo grupo, y en la ventana completa
 * eso los apila en tres renglones. La cinta entera crece a la altura del grupo
 * más alto, así que al pasar de Inicio a Revisar el documento daba un salto
 * hacia abajo.
 *
 * La solución no es apretar los botones: es la que usa el Word de verdad, donde
 * la pestaña Revisar tiene **Seguimiento** y **Cambios** como grupos separados.
 * Cada grupo queda en dos renglones, la cinta no cambia de altura al cambiar de
 * pestaña, y de paso el rótulo dice mejor lo que hay debajo —«Cambios» son los
 * dos botones que resuelven un cambio; «Seguimiento» es el interruptor que hace
 * que se marquen—. Esa distinción es la mitad del encargo 7.
 *
 * «Sinónimos» se queda sin construir, y a la vista. Es la misma decisión de la
 * clase 1 con «Pegar»: un botón que existe en Word y todavía no en esta clase se
 * ve, se puede pulsar y contesta «aún no disponible». Esconderlo enseñaría un
 * Word que no existe.
 */
export const CINTA_REVISA: Pestana[] = CINTA_INTERMEDIO.map((p) =>
  p.id !== 'revisar'
    ? p
    : {
        ...p,
        grupos: [
          {
            id: 'revision',
            nombre: 'Revisión',
            controles: [
              { id: 'ortografia', glifo: '✓ᴬ', etiqueta: 'Ortografía', ancho: true },
              { id: 'sinonimos', glifo: '≈', etiqueta: 'Sinónimos', ancho: true },
            ],
          },
          {
            id: 'comentarios',
            nombre: 'Comentarios',
            controles: [
              { id: 'comentario', glifo: '💬', etiqueta: 'Nuevo comentario', corto: 'Comentario', ancho: true },
            ],
          },
          {
            id: 'seguimiento',
            nombre: 'Seguimiento',
            controles: [
              { id: 'control-cambios', glifo: '✎', etiqueta: 'Control de cambios', corto: 'Control de cambios', ancho: true },
              { id: 'panel-revisiones', glifo: '▤', etiqueta: 'Panel de revisión', corto: 'Panel de revisión', ancho: true },
            ],
          },
          {
            /*
             * Id propio y no `seguimiento`: la ventana elige la disposición de
             * un grupo por su id, y a los que no conoce les da la mitad de sus
             * controles por renglón. Con dos botones eso son dos renglones, que
             * es la altura de los demás grupos.
             */
            id: 'rc-cambios',
            nombre: 'Cambios',
            controles: [
              { id: 'aceptar', glifo: '✔', etiqueta: 'Aceptar el cambio', corto: 'Aceptar', ancho: true },
              { id: 'rechazar', glifo: '✘', etiqueta: 'Rechazar el cambio', corto: 'Rechazar', ancho: true },
            ],
          },
        ],
      },
);
