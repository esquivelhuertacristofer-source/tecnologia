'use client';

import type { PanelDeClaseProps } from '@/components/office/VentanaDiapositivas';
import {
  duracionDeDiapositiva,
  segundosDeLectura,
  segundosDeVideo,
} from '@/components/office/motor-diapos/consultas';
import { RELOJ } from '@/components/office/motor-diapos/Reproductor';
import { OBJETIVO_SEGUNDOS, totalDelMazo } from './guion';
import './hojaDeIntervalos.css';

/**
 * La hoja de intervalos de `of-ppt-video-e-intervalos` (doc §43.3).
 *
 * Es el instrumento de esta clase, igual que la ficha de revisión lo fue de
 * §42.3, y entra por `panelFijo` por el mismo motivo: **PowerPoint enseña esta
 * lista al terminar de ensayar** y aquí hace falta abierta todo el rato, porque
 * la mitad de la clase es ver cómo el total se mueve solo cuando tocas algo.
 *
 * ── LO QUE LA HACE HONRADA ──────────────────────────────────────────────────
 *
 * Que **dice de dónde sale cada número**. Un panel que sólo pusiera «4 · 73 s»
 * sería un oráculo, y de un oráculo no se aprende nada: el alumno vería bajar
 * el total sin saber por qué. Aquí cada renglón dice si ese tiempo es lo que se
 * midió, lo que tarda en leerse o lo que dura el video, y por eso «quítale
 * palabras» deja de ser un consejo y pasa a ser algo que se puede comprobar.
 *
 * Y que **admite no saber**. Una diapositiva que se tocó después de ensayar
 * pone «sin medir» y enseña su estimado en gris. No se inventa un número: dice
 * que hay que volver a ensayar, que es exactamente lo que hay que hacer.
 */

const DE_DONDE = (
  medido: boolean,
  video: number,
  lectura: number,
): { texto: string; clase: string } => {
  if (video > 0 && video >= lectura) return { texto: 'lo que dura el video', clase: 'es-video' };
  if (medido) return { texto: 'medido en el ensayo', clase: 'es-medido' };
  return { texto: 'lo que tarda en leerse', clase: 'es-lectura' };
};

export function HojaDeIntervalos({ mazo, indice, irA }: PanelDeClaseProps) {
  const total = totalDelMazo(mazo);
  const pasado = total > OBJETIVO_SEGUNDOS;
  const sinMedir = mazo.diapositivas.filter((d) => typeof d.intervalo !== 'number').length;
  /* La barra se mide contra la más larga, no contra el objetivo: lo que hay que
     ver de un golpe es CUÁL se lleva el tiempo. */
  const tope = Math.max(...mazo.diapositivas.map(duracionDeDiapositiva), 1);

  return (
    <div className="hdi">
      <ol className="hdi-lista" aria-label="Lo que dura cada diapositiva">
        {mazo.diapositivas.map((d, i) => {
          const dura = duracionDeDiapositiva(d);
          const medido = typeof d.intervalo === 'number';
          const video = segundosDeVideo(d);
          const origen = DE_DONDE(medido, video, segundosDeLectura(d));
          return (
            <li key={i}>
              <button
                type="button"
                className={`hdi-fila${i === indice ? ' es-aqui' : ''}${medido ? '' : ' es-crudo'}`}
                data-intervalo={i}
                onClick={() => irA(i)}
              >
                <span className="hdi-num">{i + 1}</span>
                <span className="hdi-que">
                  <b>{d.marcadores.find((x) => x.rol === 'titulo')?.contenido ?? 'Sin título'}</b>
                  <small className={origen.clase}>
                    {medido || video > 0 ? origen.texto : `sin medir · ${origen.texto}`}
                  </small>
                  <i className="hdi-barra" aria-hidden="true">
                    <em style={{ width: `${Math.round((dura / tope) * 100)}%` }} />
                  </i>
                </span>
                <span className="hdi-seg" data-seg={i}>
                  {RELOJ(dura)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className={`hdi-total${pasado ? ' es-pasado' : ''}`} data-total>
        <span className="hdi-total-cifra">{RELOJ(total)}</span>
        <span className="hdi-total-de">de {RELOJ(OBJETIVO_SEGUNDOS)} que te dan</span>
        <span className="hdi-total-veredicto">
          {pasado ? `Te pasas por ${RELOJ(total - OBJETIVO_SEGUNDOS)}` : `Te sobran ${RELOJ(OBJETIVO_SEGUNDOS - total)}`}
        </span>
      </div>

      {/*
        La regla del reloj, escrita donde se usa. Sin ella el alumno que pulsa
        seis veces en cuatro segundos vería 1:55 y pensaría que el programa se
        equivoca. Con ella entiende por qué su presentación no baja de ahí — y
        entiende, que es lo que la clase quiere, que la única manera de bajarla
        es quitarle palabras.
      */}
      <p className="hdi-regla">
        El ensayo cuenta <b>lo que tardas tú</b>, y nunca menos de lo que tarda esa diapositiva en{' '}
        <b>leerse en voz alta</b>. Un video cuenta entero aunque te calles.
      </p>

      {sinMedir > 0 && (
        <p className="hdi-aviso" data-sin-medir={sinMedir}>
          {sinMedir === mazo.diapositivas.length
            ? 'Todavía no la has ensayado: estos tiempos son un cálculo, no una medida.'
            : `${sinMedir} ${sinMedir === 1 ? 'diapositiva cambió' : 'diapositivas cambiaron'} después del ensayo. Hay que volver a ensayar.`}
        </p>
      )}
    </div>
  );
}

export default HojaDeIntervalos;
