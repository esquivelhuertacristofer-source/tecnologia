'use client';

/**
 * Tanda 0 · Pieza 1 — `VentanaBase` (CANON-ARMAZONES.md, «Pieza 0»).
 *
 * El marco de ventana de un programa simulado que NO es Office: barra de
 * título con la marca del programa, pantalla de arranque con su botón de
 * encender, y el hueco donde cada laboratorio mete lo suyo.
 *
 * Salió de diffear `LabVirusYAntivirus.tsx` (prefijo `av-`) contra
 * `LabNubeOLocal.tsx` (prefijo `ex-`): eran la misma ventana escrita dos
 * veces, carácter por carácter en `.marco`, `.barra`, `.barra-marca`,
 * `.barra-sub`, `.barra-botones`, `.barra-punto`, `.espera`,
 * `.espera-marca`, `.encender` y `.espera-pie` — sólo cambiaba el prefijo
 * del CSS. Esa parte es la que se extrae aquí. El «cuerpo» —la lista con
 * panel de detalle de un programa, los dos sitios con tarjeta del otro— NO
 * se parecía entre los dos laboratorios medidos, así que se queda como
 * `children`: cada programa sigue dueño de su propio diseño interior.
 *
 * Reglas duras del encargo:
 *  - Recibe TODO por parámetro, como `VentanaHojas`.
 *  - No es un motor de plantillas: no sabe qué es un acierto, no pinta
 *    preguntas, no corrige nada. Sólo es el chrome.
 *  - No incluye el modo guía ni la portada de objetivos de Office
 *    (`office/motor/guia.ts`, `PortadaPractica`): esos dos existen y ya
 *    toman sus tablas por parámetro, pero nada de lo medido para construir
 *    esta pieza los necesitaba, y forzarlos aquí sin un tercer caso real que
 *    los use habría sido exactamente la abstracción prematura que el
 *    encargo pide evitar.
 *
 * Las tres ventanas de Office (`VentanaTextos`, `VentanaHojas`,
 * `VentanaDiapositivas`) NO adoptan este marco hoy: son 35 clases cerradas
 * y `VentanaTextos` ya trae su propia barra de estado con paginación y
 * zoom, bastante más que lo que este componente ofrece. Se decidió no
 * arriesgarlas por elegancia (ver la respuesta final de la tanda 0).
 */

import type { ReactNode } from 'react';
import './ventana-base.css';

export interface VentanaBaseArranque {
  /** Texto bajo el botón de encender, p. ej. "El equipo de Sofi · listo para revisar". */
  pie: string;
  /** Por defecto "⏻ Encender". */
  etiquetaBoton?: string;
  onEncender: () => void;
}

export interface VentanaBaseProps {
  /** Nombre del programa en la barra de título, p. ej. "Tecnia Antivirus". */
  marca: string;
  /** Texto secundario junto a la marca, p. ej. "10 programas instalados". */
  subtitulo?: string;
  /**
   * Si se da, la ventana muestra la pantalla de arranque mientras
   * `encendida` sea `false`. Si se omite, no hay pantalla de arranque y
   * `children` se pinta siempre: no todo programa simulado necesita un
   * botón de encender.
   */
  arranque?: VentanaBaseArranque;
  /** Mientras `arranque` esté dado, decide cuál de las dos pantallas se ve. Por defecto `true`. */
  encendida?: boolean;
  /** El contenido propio de cada programa. */
  children: ReactNode;
  /**
   * Hueco al pie de la ventana. Ningún consumidor de hoy lo llena — ni
   * `LabVirusYAntivirus` ni `LabNubeOLocal` tienen barra de estado — se deja
   * listo para el que la necesite, en vez de inventarle contenido.
   */
  barraEstado?: ReactNode;
  /**
   * Clase adicional en el marco. Sirve para que una clase que ya tenía su
   * propio selector CSS (p. ej. `.av-marco`, que las pruebas existentes
   * consultan por selector) lo conserve sin duplicar la hoja de estilos.
   */
  claseMarco?: string;
}

export function VentanaBase({
  marca,
  subtitulo,
  arranque,
  encendida = true,
  children,
  barraEstado,
  claseMarco,
}: VentanaBaseProps) {
  const mostrarArranque = Boolean(arranque) && !encendida;

  return (
    <div className={`vtb-marco${claseMarco ? ` ${claseMarco}` : ''}`}>
      <div className="vtb-barra">
        <span className="vtb-barra-marca">{marca}</span>
        {subtitulo && <span className="vtb-barra-sub">{subtitulo}</span>}
        <span className="vtb-barra-botones" aria-hidden="true">
          <span className="vtb-barra-punto" />
          <span className="vtb-barra-punto" />
          <span className="vtb-barra-punto" />
        </span>
      </div>

      {mostrarArranque && arranque ? (
        <div className="vtb-espera">
          <p className="vtb-espera-marca">{marca}</p>
          <button type="button" className="vtb-encender" onClick={arranque.onEncender}>
            {arranque.etiquetaBoton ?? '⏻ Encender'}
          </button>
          <p className="vtb-espera-pie">{arranque.pie}</p>
        </div>
      ) : (
        <div className="vtb-cuerpo">{children}</div>
      )}

      {barraEstado && <div className="vtb-estado">{barraEstado}</div>}
    </div>
  );
}

export default VentanaBase;
