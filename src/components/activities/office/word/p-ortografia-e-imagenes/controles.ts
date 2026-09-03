import type { ControlesDeClase } from '@/components/office/motor/comandos';
import type { EstadoClase } from './corrector';

/**
 * Las dos herramientas que esta clase le presta a la cinta de Tecnia Textos.
 *
 * Se declaran aquí, en la carpeta de la clase, que es la vía que abre
 * `comandos.ts` para que las clases del temario se construyan en paralelo sin
 * pisarse el motor. Sus ids son los que la cinta ya conocía —`ortografia` de la
 * pestaña Revisar e `imagen` de Insertar—, así que heredan sus iconos y sus
 * nombres sin tocar nada.
 *
 * ── NINGUNO ES INERTE ───────────────────────────────────────────────────────
 * Los dos abren su diálogo siempre, aunque no haya nada que corregir. Un botón
 * que no responde no cuenta el intento en la ventana y la pista del encargo sólo
 * sale después del primer intento fallido: un alumno atascado podría pulsarlo
 * veinte veces sin llegar a leer nunca la ayuda. Si no hay faltas, el corrector
 * lo dice con todas sus letras, que es además lo que hace Word.
 *
 * ── LOS DOS SE PINTAN HUNDIDOS MIENTRAS SU DIÁLOGO ESTÁ ABIERTO ─────────────
 * Es la mitad de la lección de la cinta: un botón hundido te está diciendo el
 * estado de lo que hay debajo. Aquí el estado es «esta ventana está abierta», y
 * volver a pulsarlo la cierra, que es lo que promete un botón hundido.
 */
export function controlesDeLaClase(estado: EstadoClase): ControlesDeClase {
  return {
    ortografia: {
      hacer: (vista) => {
        estado.montar(vista);
        if (estado.corrector) estado.cerrarCorrector();
        else estado.abrirCorrector();
        return true;
      },
      activo: () => estado.corrector,
    },

    imagen: {
      hacer: (vista) => {
        estado.montar(vista);
        if (estado.galeria) estado.cerrarGaleria();
        else estado.abrirGaleria();
        return true;
      },
      activo: () => estado.galeria,
    },
  };
}
