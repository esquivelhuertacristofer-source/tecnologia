'use client';

import type { ControlesDeClase } from '@/components/office/motor/comandos';
import { taller } from './taller';

/**
 * `of-word-coautoria` · las herramientas que trae esta clase.
 *
 * Se declaran aquí y no en `comandos.ts` porque el motor es de las 154 clases
 * del temario y esto es de una sola. Cada control abre o cierra su panel y
 * **ninguno hace el trabajo por el alumno**: «Guardar versión» abre el panel de
 * versiones con el cursor en el nombre, pero la versión no existe hasta que el
 * alumno la nombra y la guarda, que es lo que el encargo comprueba.
 *
 * Los cuatro se pintan hundidos cuando su panel está abierto, como cualquier
 * interruptor de la cinta: un botón hundido dice el estado de lo que hay, no
 * sólo lo que hace.
 *
 * `conectar` es lo que le da al panel de la clase la vista de ProseMirror. No
 * hay otro camino: el panel se pinta como accesorio de la ventana y no recibe
 * nada del editor. Y basta, porque ningún panel se puede abrir sin pulsar antes
 * uno de estos botones.
 */
export const CONTROLES: ControlesDeClase = {
  'panel-revisiones': {
    hacer: (vista) => {
      taller.conectar(vista);
      taller.alternarRevisiones();
      return true;
    },
    activo: () => taller.leer().panelRevisiones,
  },

  historial: {
    hacer: (vista) => {
      taller.conectar(vista);
      taller.alternarVersiones();
      return true;
    },
    activo: () => taller.leer().panelVersiones,
  },

  // Sin `activo`: no es un interruptor sino una acción, y un botón hundido
  // promete que la siguiente pulsación lo suelta. Salía hundido junto a
  // «Historial» —los dos abren el mismo panel— y eso decía una mentira.
  'guardar-version': {
    hacer: (vista) => {
      taller.conectar(vista);
      taller.abrirVersionesParaGuardar();
      return true;
    },
  },

  comparar: {
    hacer: (vista) => {
      taller.conectar(vista);
      taller.abrirComparar();
      return true;
    },
    activo: () => taller.leer().dialogoComparar,
  },

  comentario: {
    hacer: (vista) => {
      taller.conectar(vista);
      taller.escribirComentario(true);
      return true;
    },
    activo: () => taller.leer().escribiendoComentario,
  },
};
