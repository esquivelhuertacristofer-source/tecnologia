import { CINTA_AVANZADO, type Pestana } from '@/components/activities/office/tecniaTextos';

/**
 * `of-word-coautoria` · la cinta del grado Avanzado con lo de esta clase.
 *
 * Se extiende la del grado en vez de escribir una nueva: el alumno de la clase 4
 * tiene que ver las mismas siete pestañas que en las tres anteriores, o la cinta
 * dejaría de ser un sitio conocido justo el día que más herramientas nuevas
 * aparecen.
 *
 * Lo nuevo entra donde entra en Word:
 *
 *  · **«Panel de revisiones» al grupo Comentarios**, junto a «Nuevo comentario»,
 *    que es donde vive en Word el botón que enseña lo que los demás escribieron.
 *  · **Un grupo «Versiones»** con el historial y el botón de guardar un hito.
 *    Word lo esconde en Archivo y OneDrive; aquí sale a la cinta a propósito,
 *    porque una clase que va de versiones no puede tenerlas escondidas en un
 *    menú que en esta ventana no existe.
 *  · **Un grupo «Comparar»**, que en Word está exactamente ahí: en Revisar.
 *
 * Los dos grupos nuevos van al final de Revisar, después de Seguimiento, para
 * que el encargo 3 —«¿en qué grupo buscas para comparar dos versiones?»— se
 * pueda contestar leyendo los rótulos y no por costumbre.
 */
export const CINTA_COAUTORIA: Pestana[] = CINTA_AVANZADO.map((p) => {
  if (p.id !== 'revisar') return p;
  const grupos = p.grupos.map((g) =>
    g.id !== 'comentarios'
      ? g
      : {
          ...g,
          controles: [
            ...g.controles,
            {
              id: 'panel-revisiones',
              glifo: '☰',
              etiqueta: 'Panel de revisiones',
              corto: 'Panel',
              ancho: true,
            },
          ],
        },
  );
  return {
    ...p,
    grupos: [
      ...grupos,
      {
        id: 'versiones',
        nombre: 'Versiones',
        /*
         * Los glifos son de TEXTO y no emoji. El motor resuelve cada control a
         * su icono de trazo y deja el glifo sólo para los que no tiene, que son
         * estos tres; con «🕘» y «🔖» la cinta salía con un reloj gris y un
         * marcador ROJO en medio de una fila de iconos monocromos, y eso se ve
         * desde la otra punta del aula como lo que es: dos pegatinas encima de
         * Word. Vistos en el navegador y comparados con la fila de al lado.
         */
        controles: [
          { id: 'historial', glifo: '↺', etiqueta: 'Historial de versiones', corto: 'Historial', ancho: true },
          { id: 'guardar-version', glifo: '⚑', etiqueta: 'Guardar una versión', corto: 'Guardar', ancho: true },
        ],
      },
      {
        id: 'comparar',
        nombre: 'Comparar',
        controles: [
          { id: 'comparar', glifo: '⇄', etiqueta: 'Comparar documentos', corto: 'Comparar', ancho: true },
        ],
      },
    ],
  };
});
