'use client';

import { useState } from 'react';
import type { PanelDeClaseProps } from '@/components/office/VentanaDiapositivas';
import { TEMAS, type Mazo } from '@/components/office/motor-diapos/mazo';
import { alineadas, contraste, CONTRASTE_MINIMO } from '@/components/office/motor-diapos/consultas';
import type { Diapositiva } from '@/components/office/motor-diapos/modelo';
import { TAMANO_BASE_DIAPO } from '../tecniaDiapositivas';
import './fichaDeRevision.css';

/**
 * La ficha de revisión de `n5-la-buena-diapositiva` (doc §42.3).
 *
 * ── POR QUÉ NO ES UN BOTÓN DE LA CINTA ──────────────────────────────────────
 *
 * Porque **PowerPoint no tiene esto**. Es un instrumento de la clase, no una
 * herramienta del programa, y darle un domicilio en la cinta habría enseñado
 * un botón que el lunes no existe. Entra por `panelFijo` y vive abierto todo
 * el rato, como el cajón de notas.
 *
 * ── LO QUE LA HACE UNA LECCIÓN Y NO UNA LISTA ───────────────────────────────
 *
 * **No se marca sola del todo.** Cinco de las siete reglas se leen del mazo y
 * salen en verde o en ámbar sin que nadie las toque; las otras dos —«una sola
 * idea» y «la imagen apoya»— tienen una casilla que el alumno marca a mano. Que
 * la lista se quede a medias es la clase: hay cosas que ningún programa puede
 * juzgar por ti, y confundir «pasa la revisión automática» con «está bien» es
 * exactamente el error que esta parada existe para evitar.
 *
 * Las marcas manuales viven en el propio panel y no en el mazo, y es a
 * propósito: son lo que el alumno OPINA, no parte del documento. Una
 * presentación entregada no lleva dentro las casillas que alguien palomeó.
 */

/** Las cinco que el programa sí puede leer, y las dos que no. */
interface Regla {
  id: string;
  nombre: string;
  detalle: string;
  /** `null` = la juzga el alumno. */
  mide: ((m: Mazo, d: Diapositiva) => boolean) | null;
}

/** Los renglones de los cuerpos de una diapositiva. */
const renglones = (d: Diapositiva): number =>
  d.marcadores
    .filter((x) => x.rol === 'cuerpo' || x.rol === 'cuerpo-2')
    .reduce((n, x) => n + (x.contenido ? x.contenido.split('\n').filter(Boolean).length : 0), 0);

/** El tamaño más chico que hay escrito en la diapositiva. */
const letraMasChica = (d: Diapositiva): number => {
  const deMarcadores = d.marcadores
    .filter((x) => x.contenido)
    .map((x) => x.formato?.pt ?? TAMANO_BASE_DIAPO[x.rol] ?? 24);
  const deLibres = d.libres.filter((l) => l.clase === 'texto').map((l) => l.formato?.pt ?? 24);
  const todos = [...deMarcadores, ...deLibres];
  return todos.length ? Math.min(...todos) : 99;
};

export const REGLAS: Regla[] = [
  {
    id: 'una-idea',
    nombre: 'Una sola idea',
    detalle: 'Si tiene dos, son dos diapositivas.',
    mide: null,
  },
  {
    id: 'pocas-palabras',
    nombre: 'Pocas palabras',
    detalle: 'Cuatro renglones como mucho. Un párrafo no se lee de lejos.',
    mide: (_m, d) => renglones(d) <= 4,
  },
  {
    id: 'letra-grande',
    nombre: 'Letra grande',
    detalle: 'Nada por debajo de 18 puntos: no se ve desde el fondo.',
    mide: (_m, d) => letraMasChica(d) >= 18,
  },
  {
    id: 'contraste',
    nombre: 'Se lee',
    detalle: 'El color de la letra tiene que despegarse del fondo.',
    mide: (m, d) => {
      const tema = TEMAS[m.tema];
      const fondo = d.fondo ?? tema.fondo;
      const titulo = d.marcadores.find((x) => x.rol === 'titulo');
      if (!titulo?.contenido) return true;
      return contraste(titulo.formato?.color ?? tema.titulo, fondo) >= CONTRASTE_MINIMO;
    },
  },
  {
    id: 'imagen-apoya',
    nombre: 'La imagen apoya',
    detalle: '¿Ayuda a entender, o sólo adorna?',
    mide: null,
  },
  {
    id: 'alineado',
    nombre: 'Todo alineado',
    detalle: 'Las cajas sueltas, a la misma raya. A ojo nunca sale.',
    mide: (_m, d) => {
      const cajas = d.libres.map((l) => l.casilla);
      if (cajas.length < 2) return true;
      return (
        alineadas(cajas, 'izq') ||
        alineadas(cajas, 'arriba') ||
        alineadas(cajas, 'der') ||
        alineadas(cajas, 'abajo')
      );
    },
  },
  {
    id: 'numerada',
    nombre: 'Numerada',
    detalle: 'Sin número, nadie te puede preguntar por una.',
    mide: (m) => m.numeroDiapositiva === true,
  },
];

/**
 * Cuántas reglas automáticas falla una diapositiva. Es el semáforo de la lista
 * de arriba, y lo que le dice al alumno por dónde empezar a mirar.
 */
export function fallosAutomaticos(m: Mazo, d: Diapositiva): number {
  return REGLAS.filter((r) => r.mide && !r.mide(m, d)).length;
}

export function FichaDeRevision({ mazo, diapositiva, indice, irA }: PanelDeClaseProps) {
  /** Lo que el alumno ha palomeado a mano, por diapositiva y regla. */
  const [marcas, setMarcas] = useState<Record<string, boolean>>({});
  const llave = (i: number, regla: string) => `${i}:${regla}`;

  return (
    <div className="fdr">
      <ol className="fdr-mazo" aria-label="Las diapositivas y lo que les falta">
        {mazo.diapositivas.map((d, i) => {
          const fallos = fallosAutomaticos(mazo, d);
          return (
            <li key={i}>
              <button
                type="button"
                className={`fdr-diapo${i === indice ? ' es-aqui' : ''}${fallos ? ' es-falla' : ''}`}
                data-diapo-ficha={i}
                onClick={() => irA(i)}
              >
                <span className="fdr-num">{i + 1}</span>
                <span className="fdr-titulo">
                  {d.marcadores.find((x) => x.rol === 'titulo')?.contenido ?? 'Sin título'}
                </span>
                <span className="fdr-fallos">{fallos ? `${fallos} ✕` : '✓'}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="fdr-reglas">
        <p className="fdr-cabecera">
          Diapositiva <b>{indice + 1}</b> · las siete reglas
        </p>
        {/*
          La frase que ES la clase va ARRIBA y no al final. Estuvo al pie de la
          lista y no se veía sin desplazar el panel: la lección entera —que hay
          cosas que ningún programa puede juzgar— quedaba debajo del corte.
        */}
        <p className="fdr-nota">
          Cinco se marcan solas. Las dos con casilla las palomeas tú:{' '}
          <b>ningún programa puede juzgarlas por ti</b>.
        </p>
        {diapositiva ? (
          <ul>
            {REGLAS.map((r) => {
              const auto = r.mide ? r.mide(mazo, diapositiva) : null;
              const marcada = marcas[llave(indice, r.id)] === true;
              return (
                <li key={r.id} className={`fdr-regla${auto === false ? ' es-mal' : ''}`} data-regla={r.id}>
                  {r.mide ? (
                    <span className={`fdr-marca${auto ? ' es-bien' : ' es-mal'}`} aria-hidden="true">
                      {auto ? '✓' : '✕'}
                    </span>
                  ) : (
                    <input
                      type="checkbox"
                      className="fdr-casilla"
                      checked={marcada}
                      aria-label={`${r.nombre}: lo he comprobado yo`}
                      onChange={(e) =>
                        setMarcas((x) => ({ ...x, [llave(indice, r.id)]: e.target.checked }))
                      }
                    />
                  )}
                  <span className="fdr-que">
                    <b>{r.nombre}</b>
                    <small>{r.detalle}</small>
                  </span>
                  {!r.mide && <span className="fdr-tuyo">la juzgas tú</span>}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="fdr-vacio">No hay ninguna diapositiva que revisar.</p>
        )}
      </div>
    </div>
  );
}

export default FichaDeRevision;
