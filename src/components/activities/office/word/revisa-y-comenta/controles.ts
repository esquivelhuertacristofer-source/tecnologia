import type { ControlesDeClase } from '@/components/office/motor/comandos';
import { cambioEnElCursor, type EstadoRevision } from './revision';

/**
 * Las cinco herramientas que esta clase aporta a la cinta de Tecnia Textos.
 *
 * Se declaran aquí, en la carpeta de la clase, que es la vía que abre
 * `comandos.ts` para que las 154 clases del temario se puedan construir en
 * paralelo sin pisarse el motor. Sus ids son los que la pestaña Revisar ya
 * traía —`ortografia`, `comentario`, `control-cambios`, `aceptar`,
 * `rechazar`—, más el `panel-revisiones` que añade esta cinta.
 *
 * ── NINGUNO ES INERTE, Y ESO ESTÁ MEDIDO ────────────────────────────────────
 * La tentación era apagar «Aceptar» y «Rechazar» mientras el cursor no esté
 * dentro de un cambio: es lo que hace un programa de verdad y es lo que enseña
 * que una herramienta necesita contexto. Pero la ventana, ante un botón inerte,
 * enseña un recado y **no cuenta el intento**; y como la pista del encargo sólo
 * sale después del primer intento fallido, un alumno atascado en el encargo 7
 * podía pulsar Aceptar veinte veces sin llegar nunca a leer la frase que le
 * explica que el botón actúa sobre el cambio donde está el cursor. Un botón que
 * no responde y no enseña la ayuda es peor que uno que responde que no.
 *
 * Así que aquí fallan de verdad: devuelven `false`, la ventana cuenta el
 * tropiezo y saca la pista, y el panel de revisión pone además su propio aviso
 * en el sitio donde el alumno está mirando.
 */
export function controlesDeRevision(estado: EstadoRevision): ControlesDeClase {
  return {
    ortografia: {
      hacer: (vista) => {
        estado.montar(vista);
        estado.ortografia = !estado.ortografia;
        // Encender el corrector abre el panel: subrayar en rojo sin decir cuál
        // es la palabra buena sería señalar el problema y esconder la solución.
        if (estado.ortografia) estado.panelAbierto = true;
        estado.refrescar();
        return true;
      },
      activo: () => estado.ortografia,
    },

    comentario: {
      hacer: (vista) => {
        estado.montar(vista);
        return estado.nuevoComentario(vista);
      },
    },

    'control-cambios': {
      hacer: (vista) => {
        estado.montar(vista);
        estado.seguimiento = !estado.seguimiento;
        estado.panelAbierto = true;
        estado.refrescar();
        return true;
      },
      activo: () => estado.seguimiento,
    },

    'panel-revisiones': {
      hacer: (vista) => {
        estado.montar(vista);
        estado.panelAbierto = !estado.panelAbierto;
        estado.refrescar();
        return true;
      },
      activo: () => estado.panelAbierto,
    },

    aceptar: {
      hacer: (vista) => resolverDesdeLaCinta(estado, vista, true),
    },

    rechazar: {
      hacer: (vista) => resolverDesdeLaCinta(estado, vista, false),
    },
  };
}

function resolverDesdeLaCinta(
  estado: EstadoRevision,
  vista: Parameters<ControlesDeClase[string]['hacer']>[0],
  aceptar: boolean,
): boolean {
  estado.montar(vista);
  const cambio = cambioEnElCursor(vista.state);
  if (!cambio) {
    estado.avisoDeCambios = true;
    estado.panelAbierto = true;
    estado.refrescar();
    return false;
  }
  // Por la misma puerta que los botones del panel: así el recado de «¿No era
  // ésa? Devuélvela» sale también cuando el clic vino de la cinta, que es el
  // caso en el que la ventana no puede deshacerlo sola —los encargos de leer y
  // de escribir no tienen control esperado, así que no hay desvío que atender—.
  estado.resolverYRecordar(cambio, aceptar);
  return true;
}
