'use client';

import type { PanelDeClaseProps } from '@/components/office/VentanaDiapositivas';
import { contraste, CONTRASTE_MINIMO, estaAnulado } from '@/components/office/motor-diapos/consultas';
import { formatoConPatron, TEMAS } from '@/components/office/motor-diapos/mazo';
import { colorDelPatron } from './guion';
import './quienHereda.css';

/**
 * El panel de herencia de `of-ppt-patron` (doc §43.4).
 *
 * Es el instrumento de esta clase y hace **una sola cosa**: decir, de las doce,
 * cuál obedece al patrón y cuál no. Sin él, «una de las doce no cambió» es un
 * juego de buscar las diferencias en miniaturas de dos centímetros; con él es
 * un dato que se lee.
 *
 * ── LO QUE NO HACE, Y ES DELIBERADO ─────────────────────────────────────────
 *
 * No arregla nada. No trae un botón de «restablecer todas». El botón está en la
 * cinta, que es donde vive en el programa de verdad, y hay que ir a buscarlo:
 * un panel que resuelve el encargo con un clic propio enseña a usar el panel,
 * no a usar PowerPoint (§43.2 lo dejó escrito con las galerías).
 */

export function QuienHereda({ mazo, indice, irA }: PanelDeClaseProps) {
  const fondo = TEMAS[mazo.tema].fondo;
  const delPatron = colorDelPatron(mazo);
  const patronSeLee = Boolean(delPatron) && contraste(delPatron!, fondo) >= CONTRASTE_MINIMO;
  const anuladas = mazo.diapositivas.filter(
    (d) => estaAnulado(d, 'titulo') || estaAnulado(d, 'cuerpo'),
  ).length;

  return (
    <div className="qhe">
      {/* Lo que manda el patrón, arriba del todo: es la causa de todo lo demás. */}
      <div className={`qhe-patron${patronSeLee ? '' : ' es-mal'}`} data-patron>
        <span className="qhe-muestra" style={{ background: fondo, color: delPatron ?? '#888' }}>
          Título
        </span>
        <span className="qhe-patron-que">
          <b>Lo que dice el patrón</b>
          <small>
            {delPatron ?? 'sin color propio'} ·{' '}
            {patronSeLee ? 'se lee sobre este fondo' : 'NO se lee sobre este fondo'}
          </small>
        </span>
      </div>

      <ol className="qhe-lista" aria-label="Quién hereda del patrón">
        {mazo.diapositivas.map((d, i) => {
          const anulada = estaAnulado(d, 'titulo') || estaAnulado(d, 'cuerpo');
          const color = formatoConPatron(mazo, d, 'titulo').color ?? TEMAS[mazo.tema].titulo;
          return (
            <li key={i}>
              <button
                type="button"
                className={`qhe-fila${i === indice ? ' es-aqui' : ''}${anulada ? ' es-anulada' : ''}`}
                data-hereda={i}
                onClick={() => irA(i)}
              >
                <span className="qhe-num">{i + 1}</span>
                <span className="qhe-punto" style={{ background: color }} aria-hidden="true" />
                <span className="qhe-que">
                  <b>{d.marcadores.find((x) => x.rol === 'titulo')?.contenido ?? 'Sin título'}</b>
                  <small>{anulada ? 'a mano — no hereda' : 'hereda del patrón'}</small>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <p className={`qhe-cuenta${anuladas ? ' es-mal' : ''}`} data-anuladas={anuladas}>
        {anuladas === 0
          ? `Las ${mazo.diapositivas.length} heredan. Cambia el patrón y cambian las ${mazo.diapositivas.length}.`
          : `${anuladas} de ${mazo.diapositivas.length} ${anuladas === 1 ? 'está tocada' : 'están tocadas'} a mano y ${anuladas === 1 ? 'no obedece' : 'no obedecen'} al patrón.`}
      </p>

      <p className="qhe-regla">
        Lo que alguien puso <b>a mano</b> deja de heredar. Se llama <b>anulación</b> y no es un
        defecto: es decirle al programa «ésta la mando yo». <b>Restablecer</b> la devuelve al patrón.
      </p>
    </div>
  );
}

export default QuienHereda;
