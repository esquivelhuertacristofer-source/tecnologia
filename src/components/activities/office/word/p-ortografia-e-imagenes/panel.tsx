'use client';

import { Check, ImageIcon, SpellCheck, X } from 'lucide-react';
import { useEffect, useReducer } from 'react';
import type { EstadoClase } from './corrector';
import { LAMINAS } from './imagenes';

/**
 * Los dos diálogos que esta clase pinta dentro del programa (§36, `accesorios`).
 *
 * Son ventanitas de Word, no tarjetas de juego: barra de título gris con su
 * aspa, rótulos pequeños, lista con la selección en azul y los botones de
 * acción abajo a la derecha. El color pleno de la plataforma vive en la entrada
 * y en el panel del maestro; aquí manda la fidelidad, porque el niño tiene que
 * reconocer este cuadro cuando lo vea en el Word de la escuela.
 *
 * Los dos van anclados sobre el documento y **nunca encima del panel del
 * maestro**: el encargo tiene que poder leerse mientras se trabaja en el
 * diálogo. Y ninguno es un globo flotando en el aire: son ventanas con su barra,
 * su aspa y su sombra, que es lo que hace un programa de verdad.
 */

export function Accesorios({ estado }: { estado: EstadoClase }) {
  const [, repintar] = useReducer((n: number) => n + 1, 0);
  useEffect(() => estado.suscribir(repintar), [estado]);

  return (
    <>
      {estado.corrector && <DialogoCorrector estado={estado} />}
      {estado.galeria && <DialogoGaleria estado={estado} />}
    </>
  );
}

/* ─────────────────────────── el corrector ─────────────────────────── */

function DialogoCorrector({ estado }: { estado: EstadoClase }) {
  const lista = estado.faltas();
  const falta = estado.faltaActual();
  const numero = falta ? Math.min(estado.indice, lista.length - 1) + 1 : 0;
  const olvidadas = estado.omitidasMalEscritas();

  return (
    <section className="oi-dialogo" data-grupo="corrector" role="dialog" aria-label="Ortografía">
      <header className="oi-dialogo-barra">
        <SpellCheck size={14} strokeWidth={2.3} aria-hidden="true" />
        <span className="oi-dialogo-titulo">Ortografía: español (México)</span>
        <button
          type="button"
          className="oi-dialogo-x"
          aria-label="Cerrar el corrector"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => estado.cerrarCorrector()}
        >
          <X size={14} strokeWidth={2.6} />
        </button>
      </header>

      {falta ? (
        <div className="oi-dialogo-cuerpo">
          <p className="oi-rotulo">No está en el diccionario:</p>
          <p className="oi-frase">
            {falta.antes}
            <span className="oi-frase-mal">{falta.palabra}</span>
            {falta.despues}
          </p>

          <p className="oi-rotulo">Sugerencias:</p>
          <ul className="oi-sugerencias">
            {falta.entrada.sugerencias.map((s, i) => (
              <li key={s}>
                <button
                  type="button"
                  data-control={`oi-sugerencia-${i}`}
                  className={`oi-sugerencia${estado.elegida === s ? ' es-elegida' : ''}`}
                  aria-pressed={estado.elegida === s}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => estado.marcarSugerencia(s)}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>

          {estado.recado && <p className="oi-recado">{estado.recado}</p>}

          {/*
            El callejón sin salida que salió jugando mal: pulsar «Omitir» sobre
            una palabra que SÍ estaba mal la saca de la lista para siempre. El
            documento se queda con la falta —y el encargo, que lee el documento,
            no se puede cumplir ya— pero el corrector no la vuelve a enseñar. El
            aviso estaba, y el botón para volver atrás también… sólo que en la
            pantalla del final, a cuatro palabras de distancia y sin que nada
            dijera que existía. Aquí la salida está donde se cometió el error.
          */}
          {olvidadas.length > 0 && (
            <p className="oi-rehacer">
              <span>
                Ojo: dejaste sin corregir {olvidadas.map((p) => `«${p}»`).join(', ')} y sí{' '}
                {olvidadas.length === 1 ? 'estaba' : 'estaban'} mal. Así, la nota se entrega con{' '}
                {olvidadas.length === 1 ? 'una falta' : 'faltas'}.
              </span>
              <button
                type="button"
                data-control="oi-volver"
                className="oi-boton es-chico"
                title="Volver a revisar: el corrector se olvida de lo que mandaste omitir"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => estado.volverARevisar()}
              >
                Volver a revisar
              </button>
            </p>
          )}

          <div className="oi-acciones">
            <span className="oi-cuenta">
              Palabra {numero} de {lista.length}
            </span>
            <button
              type="button"
              data-control="oi-omitir"
              className="oi-boton"
              title="Omitir: dejar la palabra como está"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => estado.omitir()}
            >
              Omitir
            </button>
            {/*
              Se ve apagado mientras no hay sugerencia elegida, pero NO lleva
              `aria-disabled` ni está deshabilitado: responde, y lo que dice es
              qué falta para poder usarlo. Anunciar «deshabilitado» un botón que
              contesta es mentirle al lector de pantalla, y un botón mudo deja al
              alumno pulsando sin entender por qué no pasa nada.
            */}
            <button
              type="button"
              data-control="oi-cambiar"
              className={`oi-boton es-primario${estado.elegida ? '' : ' es-esperando'}`}
              title={estado.elegida ? `Cambiar por «${estado.elegida}»` : 'Elige antes una sugerencia de la lista'}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => estado.cambiar()}
            >
              Cambiar
            </button>
          </div>
        </div>
      ) : (
        <div className="oi-dialogo-cuerpo">
          <p className="oi-listo">
            <span className="oi-listo-marca" aria-hidden="true">
              <Check size={16} strokeWidth={3} />
            </span>
            El corrector terminó de revisar. No queda ninguna palabra mal escrita.
          </p>
          {/*
            Si mandó omitir algo que sí estaba mal, hay que decirlo AQUÍ: el
            corrector acaba de anunciar que todo está bien y ése es justo el
            momento en que el alumno se lo cree. Y hay que dejarle volver atrás,
            porque una palabra omitida ya no sale en la lista y sin este botón
            no habría manera de corregirla salvo tecleándola a mano.
          */}
          {olvidadas.length > 0 && (
            <p className="oi-recado">
              Ojo: dejaste sin corregir {olvidadas.map((p) => `«${p}»`).join(', ')} y sí{' '}
              {olvidadas.length === 1 ? 'estaba' : 'estaban'} mal. Pulsa «Volver a revisar» y el corrector{' '}
              {olvidadas.length === 1 ? 'te la enseña' : 'te las enseña'} otra vez.
            </p>
          )}
          {/* El aviso de arriba ya lo dice todo; repetirlo con otras palabras
              sólo hace que se lean menos los dos. */}
          {estado.recado && olvidadas.length === 0 && <p className="oi-recado">{estado.recado}</p>}
          <div className="oi-acciones">
            <span className="oi-cuenta" />
            <button
              type="button"
              data-control="oi-volver"
              className="oi-boton"
              title="Volver a revisar: el corrector se olvida de lo que mandaste omitir"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => estado.volverARevisar()}
            >
              Volver a revisar
            </button>
            <button
              type="button"
              className="oi-boton es-primario"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => estado.cerrarCorrector()}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────── la galería de imágenes ─────────────────────────── */

function DialogoGaleria({ estado }: { estado: EstadoClase }) {
  const puesta = estado.laminaPuesta();

  return (
    <section className="oi-dialogo es-galeria" data-grupo="galeria" role="dialog" aria-label="Insertar imagen">
      <header className="oi-dialogo-barra">
        <ImageIcon size={14} strokeWidth={2.3} aria-hidden="true" />
        <span className="oi-dialogo-titulo">Insertar imagen</span>
        <button
          type="button"
          className="oi-dialogo-x"
          aria-label="Cerrar la galería"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => estado.cerrarGaleria()}
        >
          <X size={14} strokeWidth={2.6} />
        </button>
      </header>

      <div className="oi-dialogo-cuerpo">
        <p className="oi-rotulo">Imágenes de esta computadora:</p>
        <div className="oi-laminas">
          {LAMINAS.map((l) => (
            <button
              key={l.id}
              type="button"
              data-control={`oi-lamina-${l.id}`}
              className={`oi-lamina${estado.laminaMarcada?.id === l.id ? ' es-elegida' : ''}`}
              aria-pressed={estado.laminaMarcada?.id === l.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => estado.marcarLamina(l)}
            >
              {/* La lámina es un SVG dentro del propio archivo, no un asset que
                  optimizar: `next/image` no aporta nada sobre un `data:` URI y
                  además no puede darlo por bueno sin configurarle un loader. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.src} alt="" />
              <span className="oi-lamina-nombre">{l.nombre}</span>
            </button>
          ))}
        </div>

        {estado.recado && <p className="oi-recado">{estado.recado}</p>}
        {puesta && !estado.recado && (
          <p className="oi-nota">Ya hay una imagen en la nota. La que elijas ahora ocupa su lugar.</p>
        )}

        <div className="oi-acciones">
          <span className="oi-cuenta">La imagen entra donde está el cursor.</span>
          <button
            type="button"
            className="oi-boton"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => estado.cerrarGaleria()}
          >
            Cancelar
          </button>
          <button
            type="button"
            data-control="oi-insertar"
            className={`oi-boton es-primario${estado.laminaMarcada ? '' : ' es-esperando'}`}
            title={estado.laminaMarcada ? `Insertar «${estado.laminaMarcada.nombre}»` : 'Elige antes una de las tres imágenes'}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => estado.insertar()}
          >
            Insertar
          </button>
        </div>
      </div>
    </section>
  );
}
