import { CINTA_AVANZADO, type Pestana } from '@/components/activities/office/tecniaTextos';
import { QUE_HACE } from '@/components/office/motor/guia';

/**
 * La cinta de esta clase: la del grado Avanzado más el grupo «Nuevo».
 *
 * Se declara aquí y no en `tecniaTextos.tsx` porque la galería de plantillas es
 * de esta clase: así las 154 del temario se construyen en paralelo sin que dos
 * se pisen el mismo archivo.
 *
 * Va en «Insertar» y de primero. En el Word de la escuela las plantillas viven
 * en Archivo → Nuevo, y ahí no se pueden poner: la pestaña «Archivo» de Tecnia
 * Textos está declarada como pendiente y contesta que se verá en otra clase. Se
 * pone donde el alumno la va a encontrar leyendo rótulos —que es lo que enseña
 * la primera clase de la sala— y el grupo se llama **«Nuevo»** por lo mismo:
 * es el nombre que ese botón tiene en el Word de verdad, así que el día que lo
 * abra ya sabe qué palabra buscar.
 *
 * ── EL BOTÓN SE LLAMA IGUAL EN LOS TRES SITIOS ──────────────────────────────
 * Antes la etiqueta era «Nuevo desde plantilla» y el `corto` —lo único que se
 * pinta dentro del botón— era «Plantillas». Medido el 10-ago-2026: el señalador
 * y la ficha del modo guía leen la ETIQUETA, así que el panel mandaba pulsar
 * «Nuevo desde plantilla» y en la cinta no había ningún botón con ese nombre.
 * En una clase cuyo encargo entero es «encuentra este botón», eso es el defecto.
 * Ahora la etiqueta es «Plantillas» y no hay `corto`: lo que dice el panel, lo
 * que dice el rótulo del aro y lo que está escrito en el botón son la misma
 * palabra.
 *
 * Los otros tres controles que usa la clase —«Encabezado», «Pie de página» y
 * «Número de página»— ya existían en la cinta del grado Básico, dibujados y
 * apagados: eran de los siete que §36.7 dejó anotados como «se ven inertes a
 * propósito y son el material de las clases siguientes». Ésta es esa clase, y
 * los enciende `controles.ts`.
 */

/**
 * Qué hace «Plantillas», para la ficha de la herramienta (§37.2).
 *
 * `QUE_HACE` vive en el motor y no se puede editar desde aquí —diecinueve
 * clases se construyen a la vez y ese archivo es de todas—, pero el control
 * `plantilla` sólo existe en ESTA clase, así que su explicación tampoco puede
 * estar allí: el motor nombraría una herramienta que él no monta. Se registra
 * al lado de la declaración del botón, que es donde el nombre y la explicación
 * no se pueden ir cada uno por su lado.
 *
 * Sin esto —medido— la ficha del PRIMER encargo salía con el glifo, el nombre y
 * el domicilio, y con el renglón de «para qué sirve» vacío, que es justo la
 * mitad que el cliente pidió. Ver `paraElMotor`: lo suyo es que la ventana
 * acepte las explicaciones de la clase por la misma vía que sus controles.
 */
QUE_HACE.plantilla =
  'Abre los documentos que el programa ya trae armados —con su texto, sus títulos y su pie puestos— para empezar desde uno de ellos en vez de desde una hoja en blanco.';

export const CINTA_PLANTILLAS: Pestana[] = CINTA_AVANZADO.map((p) =>
  p.id !== 'insertar'
    ? p
    : {
        ...p,
        grupos: [
          {
            id: 'plantillas',
            nombre: 'Nuevo',
            controles: [
              {
                id: 'plantilla',
                glifo: '▤',
                etiqueta: 'Plantillas',
                ancho: true,
              },
            ],
          },
          ...p.grupos,
        ],
      },
);
