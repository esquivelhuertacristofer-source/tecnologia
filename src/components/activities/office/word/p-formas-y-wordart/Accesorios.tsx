'use client';

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { PAGINA_ALTO, PAGINA_ANCHO } from '@/components/office/motor/paginador';
import {
  cerrarPrevia,
  hojaDeLaPrevia,
  previaAbierta,
  reiniciarPrevia,
  suscribirPrevia,
} from './controles';
import { PIEZAS, uri } from './piezas';
import './estilo.css';

/**
 * Lo que esta clase pinta dentro de la ventana: las miniaturas de la cinta y la
 * vista de una página.
 *
 * ── LAS MINIATURAS ──────────────────────────────────────────────────────────
 * Los ocho botones de las galerías enseñan el mismo SVG que insertan. El dibujo
 * vive en `piezas.ts` y no puede escribirse en la hoja de estilos —una hoja de
 * estilos no importa un módulo—, así que se emite aquí una etiqueta `<style>`
 * con las ocho reglas de `background-image`. De paso esa etiqueta es la MARCA
 * de la clase: todo `estilo.css` cuelga de `.txtw:has(.fw-marca)`, así que
 * mientras este laboratorio no esté montado sus reglas no le pueden mover una
 * caja a ninguna otra clase de Word.
 *
 * Una etiqueta `<style>` no se maqueta —el navegador le da `display: none`—, así
 * que no le abre un sexto renglón a la rejilla de cinco de `.txtw`. Lo mismo
 * vale para la sobrepantalla: va en posición absoluta, fuera del flujo.
 *
 * ── LA VISTA DE UNA PÁGINA ──────────────────────────────────────────────────
 * Es la heredera directa de la palanca de lupa del laboratorio viejo, y hereda
 * su razón: «un procesador de textos no te aleja de la mesa, te baja el zoom de
 * la página». Al cuarenta y cinco por ciento un título que no se lee se pierde
 * de verdad, y ésa es la corrección que la clase no dice con palabras: la ve el
 * alumno.
 *
 * Es una FOTO del documento, no un segundo editor: se copia el HTML de la hoja
 * al abrirla y ahí se queda. Word hace lo mismo con su vista previa de
 * impresión, y así no hay dos sitios donde escribir lo mismo.
 */

/** El zoom de la vista. Es el 45 % que el laboratorio viejo dejó medido. */
const ESCALA = 0.45;

export function Accesorios() {
  const abierta = useSyncExternalStore(suscribirPrevia, previaAbierta, () => false);
  const hoja = useSyncExternalStore(suscribirPrevia, hojaDeLaPrevia, () => '');

  // El estado de la vista vive en el módulo para que un control de la cinta
  // pueda abrirla; eso sobrevive al remontaje del laboratorio, así que se
  // limpia al entrar y al salir.
  useEffect(() => {
    reiniciarPrevia();
    return reiniciarPrevia;
  }, []);

  useEffect(() => {
    if (!abierta) return undefined;
    const teclas = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      cerrarPrevia();
    };
    window.addEventListener('keydown', teclas);
    return () => window.removeEventListener('keydown', teclas);
  }, [abierta]);

  const css = useMemo(
    () =>
      PIEZAS.map(
        (p) =>
          `.txtw .txtw-boton[data-control="${p.id}"] .txtw-glifo{background-image:url("${uri(p)}")}`,
      ).join('\n'),
    [],
  );

  return (
    <>
      <style className="fw-marca">{css}</style>

      {abierta && (
        <div className="fw-previa" role="dialog" aria-modal="true" aria-label="Vista de una página">
          <div className="fw-previa-barra">
            <span className="fw-previa-titulo">Una página · 45 %</span>
            <span className="fw-previa-nota">
              Así de grande la va a ver quien la lea. ¿Se entiende de un vistazo qué es y de qué habla?
            </span>
            <button type="button" className="fw-previa-cerrar" onClick={cerrarPrevia}>
              Cerrar
            </button>
          </div>

          <div className="fw-previa-lienzo">
            <div
              className="fw-previa-marco"
              style={{ width: PAGINA_ANCHO * ESCALA, height: PAGINA_ALTO * ESCALA }}
            >
              <div
                className="fw-previa-hoja"
                style={{ width: PAGINA_ANCHO, height: PAGINA_ALTO, transform: `scale(${ESCALA})` }}
              >
                <div
                  className="txtw-flujo fw-previa-flujo"
                  data-previa="1"
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: hoja }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Accesorios;
