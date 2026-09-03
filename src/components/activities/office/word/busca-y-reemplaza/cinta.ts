import { CINTA_INTERMEDIO, type Pestana } from '@/components/activities/office/tecniaTextos';

/**
 * La cinta de esta clase: la del grado Intermedio **más el grupo Edición**.
 *
 * En Word, Buscar y Reemplazar no están donde un niño los busca la primera vez.
 * No están en Insertar ni en Revisar: viven en el último grupo de la pestaña
 * Inicio, pegados al borde derecho, y ese sitio es la mitad del primer encargo.
 * Por eso el grupo se añade AQUÍ y no se toca `tecniaTextos.tsx`: la herramienta
 * es de esta clase, y las otras 153 no tienen por qué cargarla.
 *
 * Dos controles y no tres. «Ir a» existe en Word dentro del mismo cuadro de
 * diálogo, como tercera pestaña, y ahí es donde se pone: meterlo también en la
 * cinta enseñaría un mapa que no es el de Word. Además, el grupo con dos
 * controles anchos se reparte en una sola columna —igual que «Configurar
 * página»— y queda como el de verdad.
 */
export const CINTA_BUSCA: Pestana[] = CINTA_INTERMEDIO.map((p) =>
  p.id !== 'inicio'
    ? p
    : {
        ...p,
        grupos: [
          ...p.grupos,
          {
            id: 'edicion',
            nombre: 'Edición',
            controles: [
              { id: 'buscar', glifo: '🔍', etiqueta: 'Buscar', ancho: true },
              { id: 'reemplazar', glifo: '⇄', etiqueta: 'Reemplazar', ancho: true },
            ],
          },
        ],
      },
);
