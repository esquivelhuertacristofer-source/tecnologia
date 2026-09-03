'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CONTENIDO_ANCHO,
  MARGEN,
  PAGINA_ALTO,
  PAGINA_ANCHO,
  PASO_PAGINA,
  paginar,
  verificar,
  type ResultadoPaginado,
  type Veredicto,
} from './motorPaginacion';
import './paginacion.css';

/**
 * Banco de la prueba de concepto de paginación (9-ago-2026).
 *
 * No es producto. Vive suelto en `/banco-paginacion`, como `/diagnostico-voz`,
 * y existe para contestar con números —no con una opinión— si Tecnia Textos
 * puede tener hojas de verdad mientras el alumno escribe.
 *
 * Arriba hay un tablero que enseña lo único que importa: cuántas hojas salieron,
 * cuánto tardó la última paginación, cuál fue la peor, y **cuántos renglones
 * quedan partidos por el borde de una hoja**. Ese último número tiene que ser
 * cero. Con el hueco gris de por medio, un renglón partido es dificilísimo de
 * ver a ojo y facilísimo de contar con `getClientRects`.
 */

/* ── el documento de prueba ───────────────────────────────────────────────── */

const FRASES = [
  'El agua que llega a la llave de una casa recorrió antes un camino largo y casi siempre invisible para quien la abre.',
  'Empieza en una presa o en un pozo, sigue por tuberías que cruzan la ciudad enterradas bajo las calles, y termina en un tinaco.',
  'Cada tramo de ese camino tiene alguien que lo cuida, y cada fuga que nadie reporta se lleva el trabajo de todos ellos.',
  'Por eso cerrar la llave mientras uno se lava los dientes no es un gesto simbólico: es la única parte del recorrido que está en nuestras manos.',
  'Un río no se cuida igual que un mar, porque el río es la parte pequeña, y es justamente la que bebemos.',
  'La mayor parte del agua del planeta es salada y no sirve para beber sin un tratamiento caro.',
  'De la poca que es dulce, buena parte está congelada en los polos y en los glaciares de las montañas más altas.',
  'Lo que queda disponible en ríos, lagos y mantos subterráneos es una fracción tan pequeña que cuesta creerla.',
];

const TITULOS = [
  'De dónde viene el agua',
  'El camino invisible',
  'Lo que sí está en nuestras manos',
  'Ríos, lagos y mantos',
  'Lo que cuesta una fuga',
  'Medir para cuidar',
];

/** Genera un documento largo con párrafos de distinto tamaño, títulos y una tabla. */
function documentoDePrueba(parrafos: number): string {
  const trozos: string[] = [
    '<h1>El agua del planeta</h1>',
    '<p><em>Reporte de ciencias · sexto grado</em></p>',
  ];
  for (let i = 0; i < parrafos; i += 1) {
    if (i % 9 === 0) {
      trozos.push(`<h2>${TITULOS[(i / 9) % TITULOS.length | 0]}</h2>`);
    }
    // Párrafos de 2 a 9 frases: hace falta variedad para que los cortes caigan
    // en sitios distintos y no siempre en el mismo punto cómodo.
    const cuantas = 2 + ((i * 3) % 8);
    const cuerpo: string[] = [];
    for (let f = 0; f < cuantas; f += 1) cuerpo.push(FRASES[(i + f) % FRASES.length]);
    trozos.push(`<p>${cuerpo.join(' ')}</p>`);
    if (i % 14 === 13) {
      trozos.push(
        '<table><tbody>' +
          '<tr><td><b>Lugar</b></td><td><b>Parte</b></td></tr>' +
          '<tr><td>Mares</td><td>97 de cada 100</td></tr>' +
          '<tr><td>Hielo</td><td>2 de cada 100</td></tr>' +
          '<tr><td>Ríos y lagos</td><td>menos de 1</td></tr>' +
          '</tbody></table>',
      );
    }
  }
  return trozos.join('');
}

/* ── el banco ─────────────────────────────────────────────────────────────── */

export default function BancoPaginacion() {
  const flujo = useRef<HTMLDivElement>(null);
  const [paginas, setPaginas] = useState(1);
  const [ultimo, setUltimo] = useState<ResultadoPaginado | null>(null);
  const [peorMs, setPeorMs] = useState(0);
  const [tecleos, setTecleos] = useState(0);
  const [veredicto, setVeredicto] = useState<Veredicto | null>(null);
  const pendiente = useRef(0);

  const repaginar = useCallback(() => {
    const el = flujo.current;
    if (!el) return;
    const r = paginar(el);
    setUltimo(r);
    setPaginas(r.paginas);
    setPeorMs((p) => Math.max(p, r.ms));
    setVeredicto(null);
  }, []);

  const cargar = useCallback(
    (parrafos: number) => {
      const el = flujo.current;
      if (!el) return;
      el.innerHTML = documentoDePrueba(parrafos);
      setPeorMs(0);
      setTecleos(0);
      repaginar();
    },
    [repaginar],
  );

  // La carga inicial va en el cuadro siguiente y no en el cuerpo del efecto: hay
  // que dejar que el navegador termine la maquetación del `innerHTML` antes de
  // medir, o la primera paginación mide un documento que todavía no existe.
  useEffect(() => {
    const id = requestAnimationFrame(() => cargar(80));
    return () => cancelAnimationFrame(id);
  }, [cargar]);

  // Repaginar en el cuadro siguiente y no en el evento: si se pagina dentro del
  // `input`, el navegador todavía no terminó de aplicar el cambio y las medidas
  // salen del estado anterior.
  const alEscribir = useCallback(() => {
    setTecleos((t) => t + 1);
    if (pendiente.current) cancelAnimationFrame(pendiente.current);
    pendiente.current = requestAnimationFrame(() => {
      pendiente.current = 0;
      repaginar();
    });
  }, [repaginar]);

  const comprobar = useCallback(() => {
    const el = flujo.current;
    if (!el) return;
    setVeredicto(verificar(el));
  }, []);

  const cruces = veredicto?.violaciones.filter((v) => v.tipo === 'cruza').length ?? null;
  const sueltos = veredicto ? veredicto.violaciones.length - (cruces ?? 0) : null;

  return (
    <div className="pag-banco">
      <header className="pag-hud">
        <h1>Prueba de concepto · paginación en vivo</h1>

        <div className="pag-cifras">
          <span className="pag-cifra">
            <b data-cifra="paginas">{paginas}</b>hojas
          </span>
          <span className="pag-cifra">
            <b data-cifra="ms">{ultimo ? ultimo.ms.toFixed(1) : '—'}</b>ms la última
          </span>
          <span className="pag-cifra">
            <b data-cifra="peor">{peorMs ? peorMs.toFixed(1) : '—'}</b>ms la peor
          </span>
          <span className="pag-cifra">
            <b data-cifra="cortes">{ultimo?.cortes ?? '—'}</b>cortes
          </span>
          <span className="pag-cifra">
            <b data-cifra="medidas">{ultimo?.medidas ?? '—'}</b>medidas
          </span>
          <span className="pag-cifra">
            <b data-cifra="tecleos">{tecleos}</b>teclas
          </span>
          <span className={`pag-cifra${cruces === 0 ? ' es-bien' : cruces ? ' es-mal' : ''}`}>
            <b data-cifra="cruces">{cruces ?? '—'}</b>renglones partidos
          </span>
          <span className={`pag-cifra${sueltos === 0 ? ' es-bien' : sueltos ? ' es-mal' : ''}`}>
            <b data-cifra="sueltos">{sueltos ?? '—'}</b>viudas y huérfanas
          </span>
        </div>

        <div className="pag-mandos">
          <button type="button" onClick={comprobar} className="es-fuerte">
            Comprobar
          </button>
          <button type="button" onClick={() => cargar(80)}>
            Documento largo
          </button>
          <button type="button" onClick={() => cargar(18)}>
            Documento corto
          </button>
          <button type="button" onClick={repaginar}>
            Repaginar
          </button>
        </div>

        {veredicto && veredicto.violaciones.length > 0 && (
          <ul className="pag-fallos">
            {veredicto.violaciones.slice(0, 12).map((v, i) => (
              <li key={i}>
                <b>{v.tipo}</b> · hoja {v.pagina} · {v.detalle}
              </li>
            ))}
            {veredicto.violaciones.length > 12 && <li>…y {veredicto.violaciones.length - 12} más</li>}
          </ul>
        )}
      </header>

      <div className="pag-lienzo">
        <div
          className="pag-pila"
          style={{ width: PAGINA_ANCHO, height: paginas * PASO_PAGINA - (PASO_PAGINA - PAGINA_ALTO) }}
        >
          {/* Las hojas: dibujo puro, sin una sola letra dentro. El encabezado y
              el número viven aquí, así que se repiten solos en cada hoja y el
              alumno no los puede borrar por accidente. */}
          {Array.from({ length: paginas }, (_, k) => (
            <div
              key={k}
              className="pag-hoja"
              aria-hidden="true"
              style={{ top: k * PASO_PAGINA, width: PAGINA_ANCHO, height: PAGINA_ALTO }}
            >
              <span className="pag-encabezado" style={{ left: MARGEN, right: MARGEN }}>
                Ciencias · sexto grado
              </span>
              <span className="pag-pie" style={{ left: MARGEN, right: MARGEN }}>
                <i>Escuela Primaria Benito Juárez</i>
                <b>{k + 1}</b>
              </span>
            </div>
          ))}

          {/* El texto: UN solo flujo continuo, encima de las hojas. Nunca se
              reparte ni cambia de padre; sólo lo empujan los espaciadores. */}
          <div
            ref={flujo}
            className="pag-flujo"
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            role="textbox"
            aria-multiline="true"
            aria-label="Documento"
            style={{ left: MARGEN, top: MARGEN, width: CONTENIDO_ANCHO }}
            onInput={alEscribir}
          />
        </div>
      </div>
    </div>
  );
}
