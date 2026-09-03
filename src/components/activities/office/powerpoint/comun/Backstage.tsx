'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { BackstageProps } from '@/components/office/VentanaDiapositivas';
import {
  conNotas,
  cuantosComentarios,
  lasOcultas,
  patronImpreso,
  quitarAutor,
  quitarOcultas,
  quitarTodasLasNotas,
  quitarTodosLosComentarios,
  type Mazo,
} from '@/components/office/motor-diapos/mazo';
import { HojaImpresa } from '@/components/office/motor-diapos/HojaImpresa';
import {
  FORMAS_DE_IMPRIMIR,
  formaDeImprimir,
  hojasAhorradas,
  hojasDe,
  lasQueSeImprimen,
} from '@/components/office/motor-diapos/impresion';
import {
  ajustar,
  imprimir,
  leerImpresora,
  suscribirImpresora,
} from './impresora';
import {
  archivoDe,
  comoPeso,
  comoTiempo,
  cuantasAnimaciones,
  cuantosMultimedia,
  EXTENSION,
  exportar,
  fijarAviso,
  leerSalida,
  NOMBRE_FORMATO,
  proteger,
  segundosDelMazo,
  sinExtension,
  suscribir,
  type FormatoSalida,
} from './salida';
import './backstage.css';

/**
 * El **Backstage** de Tecnia Diapositivas — lo que hay detrás de Archivo.
 *
 * Es el sitio de PowerPoint donde uno **sale del documento**: no es una pestaña
 * más de la cinta, es una pantalla entera de color que tapa la ventana, con su
 * columna de secciones a la izquierda. Se copia esa forma porque es la que el
 * alumno va a reconocer el lunes, y porque la propia forma enseña algo — que
 * guardar, exportar y proteger no son «herramientas», son cosas que le pasan
 * **al archivo**.
 *
 * ── UNA PIEZA, DOS CLASES ───────────────────────────────────────────────────
 *
 * §43.1 usa `Exportar → PDF`. §43.7 usa las tres exportaciones y `Información →
 * Proteger`. Es el mismo Backstage con distintas secciones encendidas, y por eso
 * vive en `comun/`: dos backstages distintos según la clase sería exactamente el
 * defecto de los domicilios falsos, pero al revés.
 *
 * ── NO SALE NADA DE AQUÍ, Y SE DICE ─────────────────────────────────────────
 *
 * No se descarga ningún archivo. Lo dice el propio cuadro, abajo y con todas sus
 * letras, igual que lo dice el de imprimir de Word. Lo que sí es cierto son las
 * cifras: páginas, duración y peso salen del mazo (`salida.ts`).
 */

export type SeccionBackstage = 'informacion' | 'imprimir' | 'exportar';

export interface OpcionesBackstage {
  /** Qué secciones enseña esta clase. El orden es el de PowerPoint. */
  secciones: SeccionBackstage[];
  /** Qué formatos ofrece la sección Exportar. */
  formatos: FormatoSalida[];
  /**
   * ¿Enseña el **Inspector de documento** dentro de Información? (§43.6)
   *
   * Se enciende por clase y no está siempre porque hasta §43.6 ninguna lo
   * necesita, y una herramienta puesta antes de que se enseñe es una que el
   * alumno pulsa sin saber qué hace. Su domicilio de verdad es éste —`Archivo →
   * Información`— y por eso no está en la cinta.
   */
  inspector?: boolean;
  /** Si la clase no enseña Proteger, la sección Información no lo pinta. */
  proteger?: boolean;
}

/**
 * Lo que un archivo lleva dentro y no se ve. **Se LEE del mazo**, no se
 * inventa: si la presentación no tiene notas, el inspector no dice que las
 * tenga. Un inspector que enseñe hallazgos de mentira enseña a no creerle.
 */
export interface Hallazgo {
  id: string;
  que: string;
  detalle: string;
  cuantos: number;
  /** Cómo se quita del archivo. */
  quitar: (m: Mazo) => Mazo;
}

export function hallazgos(m: Mazo): Hallazgo[] {
  const lista: Hallazgo[] = [
    {
      id: 'comentarios',
      que: 'Comentarios de la revisión',
      detalle: 'Viajan con el archivo. Quien lo abra los lee, aunque no fueran para él.',
      cuantos: cuantosComentarios(m),
      quitar: quitarTodosLosComentarios,
    },
    {
      id: 'notas',
      que: 'Notas del orador',
      detalle: 'Lo que ibas a decir tú. Van dentro del archivo, no en la diapositiva.',
      cuantos: conNotas(m),
      quitar: quitarTodasLasNotas,
    },
    {
      id: 'ocultas',
      que: 'Diapositivas ocultas',
      detalle: 'Están en el archivo y no se presentan. Quien lo reciba las tiene igual.',
      cuantos: lasOcultas(m).length,
      quitar: quitarOcultas,
    },
    {
      id: 'autor',
      que: 'Datos del autor',
      detalle: 'El nombre de quien hizo el archivo, escrito dentro sin que nadie lo escribiera.',
      cuantos: m.autor ? 1 : 0,
      quitar: quitarAutor,
    },
  ];
  // Sólo lo que de verdad hay. Un hallazgo en cero no es un hallazgo.
  return lista.filter((h) => h.cuantos > 0);
}

function useSalida() {
  return useSyncExternalStore(suscribir, leerSalida, leerSalida);
}

function useImpresora() {
  return useSyncExternalStore(suscribirImpresora, leerImpresora, leerImpresora);
}

const NOMBRE_SECCION: Record<SeccionBackstage, string> = {
  informacion: 'Información',
  imprimir: 'Imprimir',
  exportar: 'Exportar',
};

/** Lo que cada formato conserva de la presentación. Es la tabla de §43.7. */
const CONSERVA: Record<FormatoSalida, { animaciones: boolean; sonido: boolean; editable: boolean }> = {
  pdf: { animaciones: false, sonido: false, editable: false },
  video: { animaciones: true, sonido: true, editable: false },
  pptx: { animaciones: true, sonido: true, editable: true },
};

const PARA_QUE: Record<FormatoSalida, string> = {
  pdf: 'Para que lo LEAN. Se ve igual en cualquier aparato y pesa poco.',
  video: 'Para que lo VEAN sin ti. Cada diapositiva dura lo que dijo tu ensayo.',
  pptx: 'Para seguir TRABAJANDO. Sólo a quien vaya a editarlo.',
};

export function crearBackstage(op: OpcionesBackstage) {
  function Backstage({ mazo, archivo, cerrar, avisar, cambiar }: BackstageProps) {
    const salida = useSalida();
    const impresora = useImpresora();
    const [seccion, setSeccion] = useState<SeccionBackstage>(op.secciones[0]);
    /** El formato que se está exportando ahora mismo, con su barra. */
    const [saliendo, setSaliendo] = useState<FormatoSalida | null>(null);
    /**
     * ¿Ya se pulsó «Inspeccionar»? (§43.6)
     *
     * El inspector de PowerPoint **no enseña nada hasta que lo mandas**: hay un
     * botón y luego una lista. Se copia esa forma porque enseña algo — que
     * inspeccionar es un acto, no una pantalla que estaba ahí— y porque sin él
     * el alumno no distingue «lo que el archivo lleva» de «lo que el programa
     * me está enseñando siempre».
     */
    const [inspeccionado, setInspeccionado] = useState(false);
    /** El hallazgo que está preguntando si de verdad se quita. */
    const [porQuitar, setPorQuitar] = useState<string | null>(null);
    const encontrados = hallazgos(mazo);

    // El aviso al maestro se deja apuntado en el almacén: quien exporta puede
    // estar tres componentes más abajo y no tiene por qué recibirlo por props.
    useEffect(() => fijarAviso(avisar), [avisar]);

    // Escape cierra, como en el programa. Sin esto, un alumno que entra a
    // Archivo por curiosidad se queda dentro sin flecha que reconozca.
    useEffect(() => {
      const t = (e: KeyboardEvent) => {
        if (e.key === 'Escape') cerrar();
      };
      window.addEventListener('keydown', t);
      return () => window.removeEventListener('keydown', t);
    }, [cerrar]);

    /*
     * Exportar TARDA, y a propósito. Un archivo que aparece en el mismo cuadro
     * en que se pulsa enseña que exportar es gratis, y el video de §43.7 no lo
     * es. Segundo y medio con barra: lo justo para que se vea que hay trabajo
     * detrás sin que nadie se aburra.
     */
    const sacar = (formato: FormatoSalida) => {
      if (saliendo) return;
      setSaliendo(formato);
      window.setTimeout(() => {
        exportar(mazo, archivo, formato);
        setSaliendo(null);
      }, 1500);
    };

    return (
      <div className="bks" role="dialog" aria-modal="true" aria-label="Archivo">
        <div className="bks-lado">
          <button type="button" className="bks-volver" data-bks="volver" onClick={cerrar}>
            <ArrowLeft size={17} strokeWidth={2.6} />
            <span>Volver</span>
          </button>
          {op.secciones.map((s) => (
            <button
              key={s}
              type="button"
              className={`bks-seccion${s === seccion ? ' es-aqui' : ''}`}
              data-bks-seccion={s}
              onClick={() => setSeccion(s)}
            >
              {NOMBRE_SECCION[s]}
            </button>
          ))}
        </div>

        <div className="bks-cuerpo">
          {seccion === 'exportar' && (
            <>
              <h2 className="bks-titulo">Exportar</h2>
              <p className="bks-sub">
                Una copia de <b>{sinExtension(archivo)}</b> en otro formato. El original se queda
                como está.
              </p>
              <div className="bks-formatos">
                {op.formatos.map((f) => {
                  const ya = archivoDe(f);
                  const c = CONSERVA[f];
                  return (
                    <div key={f} className="bks-formato">
                      <div className="bks-formato-que">
                        <b>{NOMBRE_FORMATO[f]}</b>
                        <small>{PARA_QUE[f]}</small>
                        <ul className="bks-conserva">
                          <li className={c.animaciones ? 'es-si' : 'es-no'}>
                            {c.animaciones ? 'Conserva' : 'Pierde'} las animaciones
                            {cuantasAnimaciones(mazo) > 0 ? ` (${cuantasAnimaciones(mazo)})` : ''}
                          </li>
                          <li className={c.sonido ? 'es-si' : 'es-no'}>
                            {c.sonido ? 'Conserva' : 'Pierde'} el sonido y el video
                            {cuantosMultimedia(mazo) > 0 ? ` (${cuantosMultimedia(mazo)})` : ''}
                          </li>
                          <li className={c.editable ? 'es-si' : 'es-no'}>
                            {c.editable ? 'Se puede seguir editando' : 'Ya no se edita'}
                          </li>
                        </ul>
                        {f === 'video' && (
                          <p className="bks-dato">
                            Duraría <b>{comoTiempo(segundosDelMazo(mazo))}</b> —
                            {mazo.diapositivas.some((d) => d.intervalo)
                              ? ' los intervalos de tu ensayo.'
                              : ' cinco segundos por diapositiva, porque todavía no la has ensayado.'}
                          </p>
                        )}
                      </div>
                      <div className="bks-formato-hacer">
                        <button
                          type="button"
                          className="bks-boton"
                          data-bks-exportar={f}
                          disabled={saliendo !== null}
                          onClick={() => sacar(f)}
                        >
                          {saliendo === f ? 'Creando…' : `Crear ${EXTENSION[f].toUpperCase()}`}
                        </button>
                        {saliendo === f && <div className="bks-barra" aria-hidden="true" />}
                        {ya && !saliendo && (
                          <p className="bks-listo" data-bks-listo={f}>
                            ✓ {ya.nombre}.{EXTENSION[f]} · {comoPeso(ya.kb)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/*
            ─── Imprimir (§44.4) ───

            La forma es la de PowerPoint y **eso es media clase**: las opciones a
            la izquierda, el previo grande a la derecha, y el previo mandando.
            Esta clase no es «pulsa aquí», es «mira lo que sale»: la escala de
            grises no se entiende leyéndola, se entiende viendo la presentación
            de fondo oscuro volverse legible.

            El previo se dibuja con `HojaImpresa` —el mismo componente que la
            vista de patrón y que la página de notas— sobre el mazo de verdad. Un
            previo de mentira habría hecho de esta clase un cuestionario.
          */}
          {seccion === 'imprimir' && (
            <>
              <h2 className="bks-titulo">Imprimir</h2>
              <div className="bks-imprimir">
                <div className="bks-print-opciones">
                  <label className="bks-print-campo">
                    <span>Copias</span>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      data-bks-copias
                      value={impresora.ajustes.copias}
                      onChange={(e) =>
                        ajustar({ copias: Math.max(1, Math.min(30, Number(e.target.value) || 1)) })
                      }
                    />
                  </label>

                  <fieldset className="bks-print-grupo">
                    <legend>Qué imprimir</legend>
                    {FORMAS_DE_IMPRIMIR.map((f) => (
                      <label
                        key={f.id}
                        className={`bks-print-opcion${
                          impresora.ajustes.que === f.id ? ' es-puesta' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="que-imprimir"
                          data-bks-que={f.id}
                          checked={impresora.ajustes.que === f.id}
                          onChange={() => ajustar({ que: f.id })}
                        />
                        <span>
                          <b>{f.nombre}</b>
                          <i>{f.paraQuien}</i>
                          <small>{f.detalle}</small>
                        </span>
                      </label>
                    ))}
                  </fieldset>

                  <fieldset className="bks-print-grupo">
                    <legend>Color</legend>
                    {(
                      [
                        ['color', 'Color', 'Como se ve en la pantalla.'],
                        ['grises', 'Escala de grises', 'Sin color. Gasta mucha menos tinta.'],
                      ] as const
                    ).map(([id, nombre, detalle]) => (
                      <label
                        key={id}
                        className={`bks-print-opcion${
                          impresora.ajustes.color === id ? ' es-puesta' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="color-impresion"
                          data-bks-color={id}
                          checked={impresora.ajustes.color === id}
                          onChange={() => ajustar({ color: id })}
                        />
                        <span>
                          <b>{nombre}</b>
                          <small>{detalle}</small>
                        </span>
                      </label>
                    ))}
                  </fieldset>

                  <button
                    type="button"
                    className="bks-boton es-imprimir"
                    data-bks-imprimir
                    onClick={() => imprimir(mazo)}
                  >
                    Imprimir
                  </button>
                </div>

                <div className="bks-print-previo">
                  {(() => {
                    const forma = formaDeImprimir(impresora.ajustes.que);
                    const hojas = hojasDe(mazo, impresora.ajustes.que);
                    const ahorro = hojasAhorradas(mazo, impresora.ajustes.que);
                    const escondidas = mazo.diapositivas.length - lasQueSeImprimen(mazo).length;
                    return (
                      <>
                        <p className="bks-print-cuenta" data-bks-cuenta>
                          <b>
                            {hojas.length} hoja{hojas.length === 1 ? '' : 's'}
                          </b>
                          {impresora.ajustes.copias > 1
                            ? ` × ${impresora.ajustes.copias} copias = ${hojas.length * impresora.ajustes.copias}`
                            : ''}
                          {ahorro > 0 ? ` · ${ahorro} menos que una por hoja` : ''}
                          {/*
                            Lo que muerde de verdad en la vida real, y por eso se
                            dice aquí y no en una ficha: PowerPoint trae apagada
                            la casilla de imprimir las ocultas, así que las hojas
                            del jurado salen sin ellas. Es la lección de §44.1
                            cobrada por segunda vez.
                          */}
                          {escondidas > 0 ? (
                            <em data-bks-escondidas>
                              {' '}
                              · {escondidas} oculta{escondidas === 1 ? '' : 's'} no se imprime
                              {escondidas === 1 ? '' : 'n'}
                            </em>
                          ) : null}
                        </p>
                        <div className="bks-print-hojas">
                          {hojas.map((indices, k) => (
                            <HojaImpresa
                              key={k}
                              mazo={mazo}
                              indices={indices}
                              forma={forma}
                              patron={patronImpreso(
                                mazo,
                                forma.conNotas ? 'notas' : 'documentos',
                              )}
                              pagina={k + 1}
                              total={hojas.length}
                              grises={impresora.ajustes.color === 'grises'}
                            />
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {impresora.trabajos.length > 0 && (
                <div className="bks-bandeja">
                  <h3>Lo que ya salió por la impresora</h3>
                  <ul>
                    {impresora.trabajos.map((t, k) => (
                      <li key={k} data-bks-trabajo={t.que}>
                        <b>{formaDeImprimir(t.que).nombre}</b>
                        <span>
                          {t.hojas} hoja{t.hojas === 1 ? '' : 's'}
                          {t.copias > 1 ? ` × ${t.copias}` : ''}
                        </span>
                        <span>{t.color === 'grises' ? 'Escala de grises' : 'Color'}</span>
                        <span>{t.hora}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="bks-simulador">
                    Esto es un simulador: <b>no sale ninguna hoja de verdad</b>. Las cuentas sí son
                    las de tu presentación.
                  </p>
                </div>
              )}
            </>
          )}

          {seccion === 'informacion' && (
            <>
              <h2 className="bks-titulo">Información</h2>
              <p className="bks-sub">
                <b>{archivo}</b> · {mazo.diapositivas.length} diapositivas
              </p>
              {/*
                ─── el Inspector de documento (§43.6) ───
                Va ANTES de Proteger porque es lo que se hace antes de mandar
                algo fuera, y porque en PowerPoint también está arriba, en
                «Comprobar si hay problemas».
              */}
              {op.inspector && (
                <div className="bks-inspector">
                  <h3>Inspector de documento</h3>
                  <p className="bks-inspector-que">
                    Busca lo que el archivo lleva dentro y no se ve. Antes de mandar algo fuera se pasa el
                    inspector, igual que antes de salir de casa se mira si llevas las llaves.
                  </p>
                  {!inspeccionado ? (
                    <button
                      type="button"
                      className="bks-boton"
                      data-bks-inspeccionar
                      onClick={() => {
                        setInspeccionado(true);
                        // Con nombre: inspeccionar NO cambia el mazo —sólo
                        // enseña lo que ya llevaba dentro—, así que ningún
                        // predicado de documento podría verlo. Es un gesto.
                        avisar('inspector');
                      }}
                    >
                      Inspeccionar
                    </button>
                  ) : encontrados.length === 0 ? (
                    <p className="bks-inspector-limpio" data-bks-limpio>
                      ✓ No queda nada dentro que no debiera. El archivo está listo para mandarse.
                    </p>
                  ) : (
                    <ul className="bks-hallazgos">
                      {encontrados.map((h) => (
                        <li key={h.id} data-bks-hallazgo={h.id}>
                          <span className="bks-hallazgo-que">
                            <b>
                              {h.que} <i>({h.cuantos})</i>
                            </b>
                            <small>{h.detalle}</small>
                          </span>
                          {/*
                            Quitar PREGUNTA antes, y no es un adorno de
                            seguridad: el inspector de PowerPoint avisa con
                            todas sus letras de que lo que quita no se
                            recupera, y aquí hace falta el doble — quitar los
                            comentarios borra también los que acaba de escribir
                            el alumno, o sea le deshace media clase. Sin la
                            pregunta era una trampa silenciosa: un clic y cinco
                            encargos deshechos. Salió jugando mal.
                          */}
                          {porQuitar === h.id ? (
                            <span className="bks-confirmar">
                              <b>Se quita del archivo y no se recupera.</b>
                              <span>
                                <button
                                  type="button"
                                  className="bks-boton es-quitar"
                                  data-bks-confirmar={h.id}
                                  onClick={() => {
                                    setPorQuitar(null);
                                    cambiar(h.quitar(mazo));
                                  }}
                                >
                                  Sí, quitar
                                </button>
                                <button
                                  type="button"
                                  className="bks-boton es-secundario"
                                  data-bks-cancelar={h.id}
                                  onClick={() => setPorQuitar(null)}
                                >
                                  Cancelar
                                </button>
                              </span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="bks-boton es-quitar"
                              data-bks-quitar={h.id}
                              onClick={() => setPorQuitar(h.id)}
                            >
                              Quitar
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {inspeccionado && encontrados.length > 0 && (
                    <p className="bks-inspector-aviso">
                      <b>No es un botón de limpiar todo.</b> Es una lista para decidir: si vas a presentarla tú,
                      tus notas del orador te hacen falta.
                    </p>
                  )}
                </div>
              )}

              {op.proteger !== false && (
              <div className="bks-proteger">
                <h3>Proteger la presentación</h3>
                <label className="bks-casilla">
                  <input
                    type="checkbox"
                    data-bks-proteger="solo-lectura"
                    checked={salida.soloLectura}
                    onChange={(e) => proteger({ soloLectura: e.target.checked })}
                  />
                  <span>
                    <b>Ábrase como sólo lectura</b>
                    <small>Se abre y se lee. Para cambiarla hay que pedir permiso.</small>
                  </span>
                </label>
                <label className="bks-casilla">
                  <input
                    type="checkbox"
                    data-bks-proteger="contrasena"
                    checked={salida.conContrasena}
                    onChange={(e) => proteger({ conContrasena: e.target.checked })}
                  />
                  <span>
                    <b>Cifrar con contraseña</b>
                    <small>Sin la contraseña, no se abre.</small>
                  </span>
                </label>
                {/* El aviso va ANTES de poner la contraseña y no después. */}
                <p className="bks-aviso">
                  <b>Ojo:</b> una contraseña que se te olvida <b>no la recupera nadie</b>. Ni el
                  programa, ni Microsoft, ni tu maestro. No hay botón de «la olvidé».
                </p>
              </div>
              )}
            </>
          )}

          {/*
            La bandeja de salida sólo tiene sentido donde se exporta. En §43.6 no
            se exporta nada —se revisa y se limpia—, así que un cuadro vacío
            diciendo «todavía no has sacado ninguna copia» sería una herramienta
            de otra clase asomando en ésta.
          */}
          {op.secciones.includes('exportar') && (
          <div className="bks-bandeja">
            <h3>Bandeja de salida</h3>
            {salida.archivos.length === 0 ? (
              <p className="bks-vacio">Todavía no has sacado ninguna copia.</p>
            ) : (
              <ul>
                {salida.archivos.map((a) => (
                  <li key={a.formato} data-bks-archivo={a.formato}>
                    <b>
                      {a.nombre}.{EXTENSION[a.formato]}
                    </b>
                    <span>{comoPeso(a.kb)}</span>
                    <span>
                      {a.paginas ? `${a.paginas} páginas` : ''}
                      {a.segundos ? comoTiempo(a.segundos) : ''}
                    </span>
                    <span>{a.hora}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="bks-simulador">
              Esto es un simulador: <b>no se descarga ningún archivo</b>. Los tamaños y las páginas
              sí son los de tu presentación de verdad.
            </p>
          </div>
          )}
        </div>
      </div>
    );
  }
  return Backstage;
}
