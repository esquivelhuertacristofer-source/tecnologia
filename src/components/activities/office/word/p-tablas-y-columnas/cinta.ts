import { CINTA_INTERMEDIO, type Pestana } from '@/components/activities/office/tecniaTextos';

/**
 * La cinta de `of-word-tablas-y-columnas`, recortada a los diez años.
 *
 * Parte de `CINTA_INTERMEDIO` —el grado que le toca a la clase en el currículo—
 * y se queda con **tres pestañas de las cinco**: Inicio, Insertar y Disposición.
 * Referencias y Revisar salen enteras: un índice, una nota al pie y el control
 * de cambios no aparecen en esta clase ni en la siguiente, y una pestaña que no
 * se abre en toda la práctica no enseña que existe, enseña que la cinta es un
 * muro. Es lo mismo que hace Word con su modo simplificado, y es la razón de que
 * el grado Básico tenga dos pestañas y no nueve.
 *
 * Dentro de las tres que quedan también se recorta, y con el mismo criterio: se
 * queda lo que la clase usa y lo que hace falta para que **elegir dónde buscar
 * siga siendo una decisión**. Por eso Inicio conserva Fuente y Párrafo —si sólo
 * quedara Fuente, «pon el encabezado en negrita» no tendría dónde equivocarse—,
 * y por eso Insertar conserva Ilustraciones al lado de Tablas.
 *
 * Lo que se fue:
 *  · **Portapapeles**: Pegar todavía no existe y copiar y pegar es otra clase.
 *  · **Estilos**: la galería es de `of-word-estilos-e-indice`; aquí sólo estorba
 *    al lado del encargo de la negrita, que es formato y no estilo.
 *  · **Texto y Encabezado y pie** en Insertar: WordArt es la clase siguiente de
 *    la unidad y el encabezado es la de documentos de varias páginas.
 *  · **Márgenes y Saltos** en Disposición: la clase no los toca.
 *
 * Y lo que llega nuevo: el grupo **Columnas**, con Una, Dos y Tres. En Word es
 * un desplegable; aquí va desplegado en la cinta, como la galería de Estilos,
 * porque a los diez años un menú que se cierra esconde justo lo que hay que
 * comparar —y porque así los tres botones se ven juntos y sólo uno hundido, que
 * es como se aprende que son tres formas de lo mismo y sólo una puede estar.
 */

const INICIO = CINTA_INTERMEDIO.find((p) => p.id === 'inicio')!;
const INSERTAR = CINTA_INTERMEDIO.find((p) => p.id === 'insertar')!;

const grupoDe = (pestana: Pestana, id: string) => pestana.grupos.find((g) => g.id === id)!;

export const CINTA_TABLAS_Y_COLUMNAS: Pestana[] = [
  {
    id: 'inicio',
    nombre: 'Inicio',
    grupos: [grupoDe(INICIO, 'fuente'), grupoDe(INICIO, 'parrafo')],
  },
  {
    id: 'insertar',
    nombre: 'Insertar',
    grupos: [grupoDe(INSERTAR, 'tablas'), grupoDe(INSERTAR, 'ilustraciones')],
  },
  {
    id: 'disposicion',
    nombre: 'Disposición',
    grupos: [
      {
        /*
         * El rótulo del grupo dice para qué sirve lo que tiene encima: ésa es la
         * lección de `of-word-la-cinta` y aquí se cumple al pie de la letra. En
         * Word el grupo se llama «Configurar página» y guarda además márgenes y
         * saltos; recortado a lo que esta clase usa, el nombre honesto es el que
         * describe los tres botones que quedan.
         */
        id: 'columnas',
        nombre: 'Columnas',
        controles: [
          { id: 'columnas-1', glifo: '▯', etiqueta: 'Una columna', corto: 'Una', ancho: true },
          { id: 'columnas-2', glifo: '▯▯', etiqueta: 'Dos columnas', corto: 'Dos', ancho: true },
          { id: 'columnas-3', glifo: '▯▯▯', etiqueta: 'Tres columnas', corto: 'Tres', ancho: true },
        ],
      },
    ],
  },
];

export default CINTA_TABLAS_Y_COLUMNAS;
