'use client';

import { useCallback, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { ArcadeSala, AvisoRonda, useBit } from '../../n1/arcade/ArcadeSala';
import { formatTiempo, useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import { EstudioWeb, useEstudioWeb, type EventoPagina, type HerramientaWeb } from '@/components/simuladores/web';
import { PortadaWeb, type DatosPortadaWeb } from '../../n6/web/PortadaWeb';
import '../../n6/web/paginasWeb.css';
import { archivosInicialesUxUi, GUION_UX_UI, PLANTILLAS_UX_UI } from './guionUxUi';

/**
 * `n10-ux-ui` — N10·U «Desarrollo web integral», parada 3 de 3, la que CIERRA
 * la unidad. **N10 = Bachillerato = 15–18 años**, tono profesional (ver
 * `n10-proyecto-web-real` y `n10-publica-tu-sitio`, las dos paradas hermanas).
 *
 * ── Los Actos 1 a 3 arreglan el sitio propio de la agencia; el Acto 4 cambia
 *    de caso a propósito ──────────────────────────────────────────────────
 *
 * Actos 1–3 (encargos 1–6): `EstudioWeb` sobre «Órbita Estudio», la agencia
 * cuyo propio sitio el alumno corrige — jerarquía tipográfica real,
 * contraste real, un flujo con más de un camino (ver `guionUxUi.ts` para los
 * seis predicados y las tres capacidades reales del motor que usan).
 *
 * Acto 4 (encargos 7–9): un panel de decisión, sin `EstudioWeb`, sobre
 * «ElectroNova» — un CASO NUEVO, un cliente distinto de la misma agencia que
 * está a punto de publicarse. Es el mismo giro narrativo que usa
 * `n9-proyecto-integrador` en su Acto 4 y `n9-empleos-tecnologicos` en el
 * suyo: el cierre no reescribe el caso de los actos anteriores, aplica el
 * criterio ya aprendido —más el de las dos paradas hermanas— sobre uno
 * nuevo. El checklist de ElectroNova mezcla a propósito las tres paradas de
 * la unidad completa:
 *
 *   · código real (parada 1, `n10-proyecto-web-real`)       → ítem 1
 *   · publicación (parada 2, `n10-publica-tu-sitio`)         → ítem 4
 *   · UX/UI de hoy (jerarquía, contraste, flujo)              → ítems 2, 3, 5
 *
 * Ninguno de los cinco ítems repite literalmente algo de Órbita Estudio: son
 * hallazgos nuevos, sobre un sitio nuevo, con su propio veredicto declarado
 * junto al dato (`CHECKLIST_ELECTRONOVA`, más abajo) — el mismo canon que
 * `RETROALIMENTACIONES`/`ameritaCambio` de `n9-pruebas-con-usuarios` y
 * `PROBLEMAS`/`urgencia` de esa misma clase, pero sin reutilizar ni su
 * mecánica de "sesión de usuario" ni su contenido: aquí no hay tiempos ni
 * toques equivocados, hay un checklist de tres lentes distintas.
 *
 * ── Por qué esta clase, y no otra, cierra con las TRES paradas juntas ──────
 *
 * `n10-proyecto-web-real` construye con código real; `n10-publica-tu-sitio`
 * decide si un sitio está listo para publicarse. Ninguna de las dos revisa
 * si el resultado es fácil de usar: un `<div>` con pinta de botón compila
 * igual de bien que un `<button>` real, y un sitio bien publicado puede
 * seguir siendo ilegible o dejar a alguien varado. Ésa es exactamente la
 * pregunta que el Acto 4 —y el encargo 9, su reflexión final— deja escrita.
 */

/* ═══════════════════════════════════════════════════════════════════════════
 * 1 · Acto 4 «El cierre» — el checklist de ElectroNova, un caso nuevo
 * ═══════════════════════════════════════════════════════════════════════════ */

type Lente = 'codigo' | 'publicacion' | 'ux';
type Gravedad = 'bloquea' | 'no-bloquea';

interface ItemChecklist {
  id: string;
  descripcion: string;
  lente: Lente;
  gravedad: Gravedad;
  porque: string;
}

const ETIQUETA_LENTE: Record<Lente, string> = {
  codigo: '💻 Código real (parada 1)',
  publicacion: '🚀 Publicación (parada 2)',
  ux: '🎯 UX/UI (hoy)',
};

/** El veredicto de cada ítem va declarado aquí mismo, junto al dato — nunca
 *  en una tabla aparte que se pueda desincronizar del texto que lee el alumno. */
const CHECKLIST_ELECTRONOVA: ItemChecklist[] = [
  {
    id: 'boton-div',
    descripcion: 'El botón «Agregar al carrito» está hecho con un <div> con estilo de botón, no con un <button> real.',
    lente: 'codigo',
    gravedad: 'bloquea',
    porque:
      'Un <div> no es un control real: no se activa con teclado y ningún lector de pantalla lo reconoce como botón. Es el mismo criterio de la parada 1 — la etiqueta correcta no es un detalle, es lo que hace que el control exista de verdad.',
  },
  {
    id: 'precio-contraste',
    descripcion: 'El precio de cada producto se ve en gris clarito sobre fondo blanco, con un contraste real de 2.1:1.',
    lente: 'ux',
    gravedad: 'bloquea',
    porque:
      'Por debajo de 4.5:1 el texto deja de ser legible para buena parte de las personas, y el precio es justo el dato que nadie puede dejar de leer en una tienda.',
  },
  {
    id: 'confirmacion-sin-salida',
    descripcion: 'La página de «Confirmación de compra» no tiene ningún enlace para volver a la tienda.',
    lente: 'ux',
    gravedad: 'bloquea',
    porque: 'Es un callejón sin salida: la persona que acaba de comprar queda atrapada justo después de lograr lo que vino a hacer.',
  },
  {
    id: 'dominio-listo',
    descripcion: 'El dominio de práctica «electronova.tecnia.mx» y los tres pasos de publicación ya están completos.',
    lente: 'publicacion',
    gravedad: 'no-bloquea',
    porque: 'Esto ya está resuelto — es justo el criterio de la parada 2, y aquí no falta nada.',
  },
  {
    id: 'logo-descentrado',
    descripcion: 'El logotipo del pie de página se ve dos píxeles descentrado respecto al texto de al lado.',
    lente: 'ux',
    gravedad: 'no-bloquea',
    porque: 'Es un detalle estético real, pero no le impide a nadie encontrar nada ni completar ninguna tarea.',
  },
];

const OPCIONES_GRAVEDAD: { valor: Gravedad; etiqueta: string }[] = [
  { valor: 'bloquea', etiqueta: '🔴 Bloquea el lanzamiento' },
  { valor: 'no-bloquea', etiqueta: '🟢 No bloquea' },
];

const TOTAL_BLOQUEANTES = CHECKLIST_ELECTRONOVA.filter((i) => i.gravedad === 'bloquea').length;

interface OpcionMcq {
  id: string;
  texto: string;
  correcta: boolean;
  explicacion: string;
}

const OPCIONES_DECISION: OpcionMcq[] = [
  {
    id: 'esperar',
    texto: `Esperar y resolver los ${TOTAL_BLOQUEANTES} bloqueantes antes de publicar: el botón sin ser un control real, el precio ilegible y la página de confirmación sin salida.`,
    correcta: true,
    explicacion:
      'Correcto. Los tres bloquean por SU CUENTA, no porque sean varios: un control que no existe de verdad, un precio que no se alcanza a leer y un callejón sin salida son tres problemas distintos, cada uno suficiente para detener el lanzamiento.',
  },
  {
    id: 'publicar-ya',
    texto: 'Publicar ya: son pocos detalles y se pueden corregir después del lanzamiento.',
    correcta: false,
    explicacion:
      'Ninguno de los tres es un detalle: uno impide operar el control con teclado, otro impide leer el precio, y el tercero deja a la persona varada justo después de comprar. Publicar así es lanzar con el checkout roto.',
  },
  {
    id: 'solo-catalogo',
    texto: 'Publicar sólo el catálogo y dejar el checkout para después.',
    correcta: false,
    explicacion: 'El precio ilegible está en el catálogo, no sólo en el checkout: ese bloqueante viaja con el catálogo aunque el resto se posponga.',
  },
  {
    id: 'solo-boton',
    texto: 'Esperar sólo por el botón; el precio y la página de confirmación no importan tanto.',
    correcta: false,
    explicacion:
      'Minimizar el contraste y el callejón sin salida es exactamente el error que evita un checklist de verdad: los tres pesan igual porque los tres, cada uno solo, impiden completar la compra.',
  },
];

const OPCIONES_REFLEXION_CIERRE: OpcionMcq[] = [
  {
    id: 'a',
    texto:
      'Porque el código correcto, la publicación lista y la experiencia de uso responden preguntas distintas: un sitio puede pasar las dos primeras y aun así fallarle a quien lo usa, como le pasó a ElectroNova con su botón, su precio y su callejón sin salida.',
    correcta: true,
    explicacion:
      'Exacto. La parada 1 revisa si el código está bien escrito; la parada 2 revisa si el sitio está listo para publicarse. Ninguna de las dos pregunta si alguien real puede leer el precio o encontrar la salida — y ElectroNova aprobaba las dos primeras.',
  },
  {
    id: 'b',
    texto: 'Porque siempre hay que revisar tres veces cualquier sitio, sin importar qué tan bien esté hecho.',
    correcta: false,
    explicacion: 'No es un conteo de revisiones: es que cada una responde una pregunta que las otras dos no responden. Revisar "por rutina" no es el criterio.',
  },
  {
    id: 'c',
    texto: 'Porque el checklist de publicación es el único que de verdad importa antes de lanzar un sitio.',
    correcta: false,
    explicacion: 'El de ElectroNova ya estaba completo (ítem "dominio-listo") y aun así el sitio no estaba listo: publicación resuelta no es lo mismo que sitio usable.',
  },
  {
    id: 'd',
    texto: 'Porque un código bien escrito ya garantiza que el sitio sea fácil de usar.',
    correcta: false,
    explicacion:
      'Justo lo contrario: en ElectroNova el ÚNICO error de código real —el <div> en vez de <button>— sí importaba, pero el precio ilegible y el callejón sin salida eran fallas de UX/UI puras, sin ningún error de código detrás.',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
 * 2 · El laboratorio
 * ═══════════════════════════════════════════════════════════════════════════ */

const TOTAL = 9;
const NOMBRES_ACTO = ['Jerarquía visual real', 'Accesibilidad real', 'Un flujo con más de un camino', 'El cierre: ¿publicar ElectroNova?'] as const;

const PORTADA: DatosPortadaWeb = {
  situacion: 'Parada 3 de 3 · el cierre de «Desarrollo web integral»',
  tema: 'Nociones de UX/UI: jerarquía visual, accesibilidad y flujo, medidas en código real',
  objetivo:
    'Vas a corregir tres defectos reales del sitio de Órbita Estudio —jerarquía tipográfica, contraste de color y tamaño de texto— midiendo cada uno en el CSS de verdad, vas a abrir un flujo con más de un camino entre sus páginas, y vas a cerrar la unidad revisando si un sitio nuevo está listo para publicarse combinando código, publicación y UX/UI.',
  vasAHacer: [
    'Corregir la jerarquía tipográfica real del título principal.',
    'Darle un relleno real a una tarjeta que queda apretada contra su borde.',
    'Calcular y corregir el contraste real de un botón poco legible.',
    'Subir un texto legal a un tamaño real legible.',
    'Abrir un segundo camino de navegación desde la página de inicio.',
    'Cerrar un callejón sin salida en la página de confirmación.',
    'Clasificar un checklist real de lanzamiento entre lo que bloquea y lo que no.',
    'Decidir, con ese checklist, si un sitio nuevo está listo para publicarse.',
    'Cerrar la unidad explicando por qué hacen falta las tres revisiones —código, publicación y UX/UI— y no basta con una sola.',
  ],
  encargos: TOTAL,
  minutos: 30,
  insignia: { nombre: 'Diseñador/a de experiencia digital', emoji: '🧭' },
  boton: 'Iniciar la revisión de UX/UI',
  acento: '#4338ca',
};

const LINEAS = {
  inicio:
    'Bienvenido al cierre de Desarrollo web integral. Ya construiste con código real y ya decidiste cómo publicar: hoy revisas si lo que construiste es fácil de usar de verdad.',
  finConstruccion:
    'El sitio de Órbita Estudio ya tiene jerarquía real, contraste real y un flujo con más de un camino. Ahora aplica ese mismo criterio a un caso nuevo: ElectroNova, un cliente de la agencia, está a punto de publicarse.',
  fin: 'Cerraste «Desarrollo web integral»: construiste con código real, decidiste cómo publicar, y hoy revisaste con criterio si el resultado es fácil de usar. Las tres paradas, juntas.',
};

interface PropsLab extends ActivityProps {
  alSalir?: () => void;
}

export function LabUxUi(props: PropsLab) {
  const [intento, setIntento] = useState(0);
  const { onProgress, onScore } = props;

  const repetir = useCallback(() => {
    onProgress(0);
    onScore(100);
    setIntento((n) => n + 1);
  }, [onProgress, onScore]);

  return <Practica key={intento} {...props} alRepetir={repetir} />;
}

type FaseCierre = 'clasificar' | 'decidir' | 'reflexionar';

function Practica({ alRepetir, ...props }: PropsLab & { alRepetir: () => void }) {
  const lab = useLabActividad(props, TOTAL);
  const { linea, hablar } = useBit();

  const [empezado, setEmpezado] = useState(false);
  const [enCierre, setEnCierre] = useState(false);
  const [fase, setFase] = useState<FaseCierre>('clasificar');
  const [aviso, setAviso] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [bloqueado, setBloqueado] = useState(false);

  // Acto 4 · estado local
  const [clasificacion, setClasificacion] = useState<Record<string, Gravedad | undefined>>({});
  const [decisionId, setDecisionId] = useState<string | null>(null);
  const [reflexionId, setReflexionId] = useState<string | null>(null);

  const marcarAcierto = useCallback(
    (texto: string) => {
      lab.avanzar();
      reproducirTono('correct');
      setMensaje({ ok: true, texto });
      hablar(texto);
      setBloqueado(true);
    },
    [lab, hablar],
  );

  const marcarError = useCallback(
    (texto: string) => {
      lab.restar();
      setMensaje({ ok: false, texto });
      hablar(texto);
    },
    [lab, hablar],
  );

  const siguientePanel = useCallback(() => {
    setMensaje(null);
    setBloqueado(false);
    setFase((f) => (f === 'clasificar' ? 'decidir' : f === 'decidir' ? 'reflexionar' : f));
  }, []);

  const terminarLab = useCallback(() => {
    lab.terminar(Math.round((Date.now() - lab.sim.current.inicio) / 1000), () => hablar(LINEAS.fin));
  }, [lab, hablar]);

  // ── Actos 1–3: EstudioWeb, siempre montado (regla de los hooks) ─────────
  const alAvanceWeb = useCallback(
    (avance: number) => {
      const hechosWeb = Math.round(avance * GUION_UX_UI.pasos.length);
      lab.avanzar();
      reproducirTono('correct');
      setAviso('✔ ¡Encargo cumplido!');
      const paso = GUION_UX_UI.pasos[hechosWeb - 1];
      if (paso) hablar(paso.aprendido);
    },
    [lab, hablar],
  );

  const alTerminadoWeb = useCallback(() => {
    setAviso(null);
    hablar(LINEAS.finConstruccion);
    setEnCierre(true);
  }, [hablar]);

  const estudio = useEstudioWeb({
    archivos: archivosInicialesUxUi(),
    guion: GUION_UX_UI,
    onAvance: alAvanceWeb,
    onTerminado: alTerminadoWeb,
  });

  /* El clic en un enlace propio navega de verdad hacia esa página: la misma
   * prueba de que el flujo del encargo 5 y 6 sirve para algo, y el mismo
   * mecanismo de `n9-proyecto-integrador` y `n7-tu-sitio-personal`. */
  const alEventoWeb = (evento: EventoPagina) => {
    if (evento.tipo === 'enlace' && evento.interno && estudio.paginas.includes(evento.destino)) {
      estudio.verPagina(evento.destino);
    }
  };

  const herramientas: HerramientaWeb[] = [
    {
      id: 'restablecer-archivo-ux-ui',
      etiqueta: 'Restablecer este archivo',
      glifo: '↺',
      deshabilitada: estudio.terminado,
      onClick: () => {
        const plantilla = PLANTILLAS_UX_UI[estudio.activo.nombre];
        if (plantilla !== undefined) {
          estudio.escribir(plantilla);
          setAviso(`↺ «${estudio.activo.nombre}» restablecido`);
        }
      },
    },
  ];

  // ── Acto 4: paneles de decisión ──────────────────────────────────────────
  const todosClasificados = CHECKLIST_ELECTRONOVA.every((it) => clasificacion[it.id]);

  const comprobarClasificacion = useCallback(() => {
    if (bloqueado) return;
    const todos = CHECKLIST_ELECTRONOVA.every((it) => clasificacion[it.id] === it.gravedad);
    if (todos) {
      marcarAcierto(
        `Los cinco coinciden: el botón sin etiqueta real, el precio con contraste real de 2.1:1 y la confirmación sin salida BLOQUEAN, cada uno por su cuenta. El dominio ya publicado y el logotipo dos píxeles descentrado NO bloquean — uno porque ya está resuelto, el otro porque es un detalle estético que no le impide nada a nadie.`,
      );
    } else {
      marcarError('Todavía no coinciden los cinco. Para cada ítem: ¿le impide a alguien completar su tarea, o es un detalle que se puede corregir después sin detener el lanzamiento?');
    }
  }, [bloqueado, clasificacion, marcarAcierto, marcarError]);

  const elegirDecision = useCallback(
    (op: OpcionMcq) => {
      if (bloqueado) return;
      setDecisionId(op.id);
      if (op.correcta) marcarAcierto(op.explicacion);
      else marcarError(op.explicacion);
    },
    [bloqueado, marcarAcierto, marcarError],
  );

  const elegirReflexion = useCallback(
    (op: OpcionMcq) => {
      if (bloqueado) return;
      setReflexionId(op.id);
      if (op.correcta) marcarAcierto(op.explicacion);
      else marcarError(op.explicacion);
    },
    [bloqueado, marcarAcierto, marcarError],
  );

  const empezar = useCallback(() => {
    setEmpezado(true);
    reproducirTono('select');
    hablar(LINEAS.inicio);
  }, [hablar]);

  const hechos = lab.terminado ? TOTAL : lab.pasos;

  return (
    <ArcadeSala
      titulo="Nociones de UX/UI"
      pasoEtiqueta="Encargo"
      pasoActual={hechos}
      pasosTotal={TOTAL}
      marcadorEtiqueta="Completados"
      marcadorValor={`${hechos}/${TOTAL}`}
      bit={empezado ? linea : null}
      base={<p className="gabinete-nota">Tecnia · Cierre de Desarrollo web integral (N10)</p>}
      alSalir={props.alSalir}
      final={
        lab.terminado
          ? {
              insigniaNombre: 'Diseñador/a de experiencia digital',
              insigniaEmoji: '🧭',
              titulo: '¡Unidad completa!',
              detalle:
                'Corregiste jerarquía, contraste y tamaño de texto reales en el sitio de Órbita Estudio, abriste un flujo con más de un camino entre sus páginas, y cerraste la unidad revisando el lanzamiento de ElectroNova con las tres paradas juntas: código, publicación y UX/UI.',
              resumen: [
                { etiqueta: 'Encargos', valor: `${TOTAL}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(lab.tiempoFinal) },
                { etiqueta: 'Errores', valor: `${lab.erroresFinal}` },
              ],
              alRepetir,
            }
          : null
      }
    >
      {!enCierre ? (
        <VentanaBase claseMarco="pgw-marco" marca="Tecnia Web N10" subtitulo="orbita-estudio · UX/UI real">
          <EstudioWeb estudio={estudio} proyecto="orbita-estudio" inspector={true} herramientas={herramientas} onEvento={alEventoWeb} />
        </VentanaBase>
      ) : (
        <VentanaBase marca="Tecnia · Revisión de lanzamiento" subtitulo="ElectroNova · código + publicación + UX/UI">
          <div className="p-4 sm:p-6 flex flex-col gap-5">
            <div className="flex gap-2 text-xs font-bold uppercase tracking-wider flex-wrap">
              {NOMBRES_ACTO.map((nombre, i) => {
                const activa = i === 3;
                return (
                  <span
                    key={nombre}
                    className={`px-3 py-1.5 rounded-full ${
                      activa ? 'bg-indigo-500 text-white' : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {activa ? '' : '✓ '}
                    {nombre}
                  </span>
                );
              })}
            </div>

            <div className="max-w-2xl mx-auto w-full flex flex-col gap-4 bg-[#0b1220] border border-indigo-500/30 rounded-2xl p-6">
              {/* Encargo 7 · clasificar el checklist */}
              {fase === 'clasificar' && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    ElectroNova, un cliente nuevo de Órbita Estudio, está por publicarse. Éste es su checklist de lanzamiento, con tres
                    lentes distintas mezcladas a propósito. Para cada ítem, decide: ¿bloquea el lanzamiento, o no?
                  </p>
                  <ul className="flex flex-col gap-2" data-testid="lista-checklist">
                    {CHECKLIST_ELECTRONOVA.map((it) => (
                      <li key={it.id} className="flex flex-col gap-2 bg-slate-800 rounded-xl px-4 py-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">{ETIQUETA_LENTE[it.lente]}</span>
                        <span className="text-sm text-white">{it.descripcion}</span>
                        <div className="flex flex-wrap gap-2">
                          {OPCIONES_GRAVEDAD.map((op) => (
                            <button
                              key={op.valor}
                              type="button"
                              data-testid="checklist-opcion"
                              disabled={bloqueado}
                              onClick={() => setClasificacion((prev) => ({ ...prev, [it.id]: op.valor }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 ${
                                clasificacion[it.id] === op.valor ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-200'
                              }`}
                            >
                              {op.etiqueta}
                            </button>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                  {!bloqueado && (
                    <button
                      type="button"
                      data-testid="comprobar-checklist"
                      disabled={!todosClasificados}
                      onClick={comprobarClasificacion}
                      className="px-5 py-3 rounded-xl bg-indigo-500 text-white font-bold disabled:opacity-50 self-start"
                    >
                      Comprobar
                    </button>
                  )}
                </div>
              )}

              {/* Encargo 8 · decidir publicar o esperar */}
              {fase === 'decidir' && (
                <McqBloque
                  pregunta={`Con ${TOTAL_BLOQUEANTES} bloqueantes reales sin resolver todavía, ¿qué decides?`}
                  opciones={OPCIONES_DECISION}
                  elegidoId={decisionId}
                  bloqueado={bloqueado}
                  onElegir={elegirDecision}
                />
              )}

              {/* Encargo 9 · reflexión de cierre */}
              {fase === 'reflexionar' && (
                <McqBloque
                  pregunta="El código de ElectroNova tenía sólo un error real, y su checklist de publicación ya estaba completo. Aun así, el sitio no estaba listo para lanzarse. ¿Por qué hacen falta las tres revisiones —código, publicación y UX/UI— y no basta con una sola?"
                  opciones={OPCIONES_REFLEXION_CIERRE}
                  elegidoId={reflexionId}
                  bloqueado={bloqueado}
                  onElegir={elegirReflexion}
                />
              )}

              <MensajeYAvance mensaje={mensaje} esUltimo={fase === 'reflexionar'} onSiguiente={siguientePanel} onTerminar={terminarLab} />
            </div>
          </div>
        </VentanaBase>
      )}

      {!empezado && <PortadaWeb portada={PORTADA} onEmpezar={empezar} />}
      {aviso && <AvisoRonda texto={aviso} clave={`${aviso}-${hechos}`} />}
    </ArcadeSala>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * 3 · Widgets locales
 * ═══════════════════════════════════════════════════════════════════════════ */

function MensajeYAvance({
  mensaje,
  esUltimo,
  onSiguiente,
  onTerminar,
}: {
  mensaje: { ok: boolean; texto: string } | null;
  esUltimo: boolean;
  onSiguiente: () => void;
  onTerminar: () => void;
}) {
  if (!mensaje) return null;
  return (
    <div className="flex flex-col gap-2" data-testid="explicacion">
      <p className={`text-sm font-bold ${mensaje.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{mensaje.ok ? '¡Correcto!' : 'Todavía no.'}</p>
      <p className="text-sm text-slate-200 leading-relaxed">{mensaje.texto}</p>
      {mensaje.ok && (
        <button
          type="button"
          data-testid={esUltimo ? 'terminar' : 'siguiente'}
          onClick={esUltimo ? onTerminar : onSiguiente}
          className="mt-1 px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold self-start"
        >
          {esUltimo ? 'Recibir la insignia' : 'Siguiente'}
        </button>
      )}
    </div>
  );
}

function McqBloque({
  pregunta,
  opciones,
  elegidoId,
  bloqueado,
  onElegir,
}: {
  pregunta: string;
  opciones: OpcionMcq[];
  elegidoId: string | null;
  bloqueado: boolean;
  onElegir: (opcion: OpcionMcq) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-lg text-white font-semibold leading-relaxed">{pregunta}</p>
      <div className="flex flex-col gap-2" data-testid="opciones-mcq">
        {opciones.map((op) => (
          <button
            key={op.id}
            type="button"
            data-testid="opcion-mcq"
            disabled={bloqueado}
            onClick={() => onElegir(op)}
            className={`px-4 py-3 rounded-xl text-left text-sm disabled:opacity-50 ${
              elegidoId === op.id
                ? op.correcta
                  ? 'bg-emerald-500/20 border border-emerald-400 text-white'
                  : 'bg-rose-500/20 border border-rose-400 text-white'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {op.texto}
          </button>
        ))}
      </div>
    </div>
  );
}

export default LabUxUi;
