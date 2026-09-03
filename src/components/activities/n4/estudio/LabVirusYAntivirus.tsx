'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { ArcadeSala, AvisoRonda, useBit } from '../../n1/arcade/ArcadeSala';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { formatTiempo, useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import './virusYAntivirus.css';

/**
 * N4·U6 parada 1 · «Virus y antivirus».
 *
 * NO es matar bichos: un juego de disparar a virus enseña que un virus se ve
 * venir, que es justo lo contrario de la verdad. Esto es una mesa de triaje
 * dentro de «Tecnia Antivirus», una ventana de software de verdad —lista de
 * programas, panel de detalle con tres pestañas, botón de analizar— sin
 * ninguna metáfora física y sin 3D: el gabinete WebGL que usan N2 en adelante
 * es exactamente el «3D forzado con la interfaz escrita encima» que esta
 * unidad prohíbe, así que el laboratorio se monta en la pantalla PLANA de
 * `ArcadeSala` (n1/arcade/ArcadeSala.tsx), la misma que usaban las cinco
 * primeras máquinas de N1 antes de esa migración.
 *
 *   0 · ENCENDER — el equipo arranca apagado. Un solo botón, como abrir
 *       cualquier programa.
 *   1 · ANALIZAR — el antivirus compara los 10 programas contra su lista de
 *       firmas conocidas. Marca UNO como amenaza (correcto: sí lo conocía) y
 *       marca OTRO como limpio ESTANDO MAL (lo conocía de una versión vieja;
 *       la actualización le agregó algo que el antivirus nunca vio). Los
 *       demás quedan "sin firma": ni buenos ni malos, sólo desconocidos. Así
 *       se vive la lección del documento: el antivirus reconoce lo que ya
 *       conoce, y por eso no basta.
 *   2 · TRIAJE — 10 programas, uno a la vez. De cada uno se leen sus tres
 *       pestañas —qué dice que hace, qué permisos pide, qué hace de
 *       verdad— y se decide: Dejarlo, Revisarlo con un adulto o Quitarlo.
 *       Sólo una de las tres es la correcta por programa; las otras dos
 *       reciben una pista específica (nunca "inténtalo de nuevo" a secas).
 *
 * La trampa central es `fondos-galaxia`: el antivirus la marca "limpio" y su
 * comportamiento real (subir fotos de la galería de madrugada) no tiene nada
 * que ver con lo que promete (fondos de pantalla animados). Si el alumno se
 * fía sólo de la chapa verde y la deja, la pista se lo dice sin rodeos.
 *
 * Balance deliberado (documento): de los 10, 4 se dejan (uno de ellos,
 * `calculadora`, no pide ni un permiso — el programa aburrido y legítimo que
 * evita que "todo resulte malo"), 2 se revisan con un adulto (piden de más
 * pero no hay prueba de daño) y 4 se quitan (entre ellos la trampa y la
 * amenaza que el antivirus sí atrapa).
 *
 * El error nunca borra lo logrado: sólo resta en el puntaje (100 − 6, piso
 * 60), igual que el resto de N4.
 */

type Fase = 'apagado' | 'espera' | 'triaje' | 'fin';
type Accion = 'dejar' | 'revisar' | 'quitar';
type Pestana = 'declara' | 'permisos' | 'real';

interface Programa {
  id: string;
  nombre: string;
  emoji: string;
  /** Lo que el propio programa dice que hace, tal cual lo leería el alumno. */
  declara: string;
  /** Los permisos que pide, uno por renglón. */
  permisos: string[];
  /** Lo que hace de verdad, la prueba que desenmascara (o confirma) al programa. */
  real: string;
  /** `null` = el antivirus no lo tiene en su lista de firmas: "sin firma conocida". */
  veredictoAntivirus: 'limpio' | 'amenaza' | null;
  correcto: Accion;
  /** Lo que dice Bit cuando el alumno acierta: por qué esa es la decisión correcta. */
  porQueBien: string;
}

const LINEAS = {
  inicio: 'Este es Tecnia Antivirus. Tienes diez programas instalados. Antes de tocar nada, enciende el equipo.',
  encendido: 'Equipo encendido. Ahora pulsa Analizar: vamos a ver qué reconoce el antivirus y qué no.',
  analizando: 'Comparando cada programa con la lista de firmas conocidas…',
  analisisListo:
    'Listo. Pero ojo: "limpio" sólo significa que ya lo conocía. Lo que marca "sin firma" no es bueno ni malo: es que nunca lo ha visto. Ahora revisa uno por uno, con calma.',
  fin: 'Mesa de triaje completa. La etiqueta del antivirus no es la última palabra: la tuya sí.',
};

const PROGRAMAS: Programa[] = [
  {
    id: 'calculadora',
    nombre: 'Calculadora Escolar',
    emoji: '🧮',
    declara: 'Resuelve operaciones y fracciones para tu tarea.',
    permisos: ['Ninguno'],
    real: 'Sólo calcula lo que tecleas. No pide nada y no manda nada a ningún lado.',
    veredictoAntivirus: 'limpio',
    correcto: 'dejar',
    porQueBien: 'Cero permisos, cero sorpresas. Cuando un programa no pide nada, no hay nada que sospechar.',
  },
  {
    id: 'linterna',
    nombre: 'Linterna Brillante',
    emoji: '🔦',
    declara: 'Enciende el flash de tu cámara para que veas en la oscuridad.',
    permisos: ['Cámara y flash', 'Tus contactos', 'Tu ubicación exacta', 'Micrófono'],
    real: 'Cada noche, a las 2:14 a.m., copia tu lista de contactos completa y la manda a un servidor que no conoces.',
    veredictoAntivirus: null,
    correcto: 'quitar',
    porQueBien: 'Una linterna no necesita tus contactos para encender la luz. Esa distancia entre lo que pide y lo que hace es la señal.',
  },
  {
    id: 'editor-fotos',
    nombre: 'Editor de Fotos Sofi',
    emoji: '🖼️',
    declara: 'Recorta tus fotos y les pone filtros de color.',
    permisos: ['Tus fotos y videos (sólo las que tú abres)'],
    real: 'Edita nada más las fotos que tú eliges abrir. No se conecta a nada más.',
    veredictoAntivirus: 'limpio',
    correcto: 'dejar',
    porQueBien: 'Lo que pide es exactamente lo que necesita para hacer lo que promete. Nada que investigar.',
  },
  {
    id: 'descarga-turbo',
    nombre: 'Descarga Turbo Gratis',
    emoji: '⬇️',
    declara: 'Descarga tus videos favoritos más rápido que cualquier otra app.',
    permisos: ['Todos tus archivos', 'Instalar otros programas', 'Tus contraseñas guardadas'],
    real: 'Instala tres programas más sin preguntarte y busca contraseñas guardadas en el navegador.',
    veredictoAntivirus: 'amenaza',
    correcto: 'quitar',
    porQueBien: 'Éste sí está en la lista negra del antivirus: ya se conoce y ya se sabe que hace daño.',
  },
  {
    id: 'fondos-galaxia',
    nombre: 'Fondos Galaxia',
    emoji: '🌌',
    declara: 'Pone fondos de pantalla animados del espacio en tu escritorio.',
    permisos: ['Tus fotos y videos', 'Internet en segundo plano'],
    real: 'Cada madrugada se conecta a internet y sube fotos de tu galería a un servidor externo, aunque tú no lo estés usando.',
    // LA TRAMPA: el antivirus lo marca "limpio" y está mal. Lo conoce de una
    // versión vieja que sí era inofensiva; una actualización le agregó esto y
    // el antivirus todavía no se enteró.
    veredictoAntivirus: 'limpio',
    correcto: 'quitar',
    porQueBien:
      'El antivirus lo reconoce de una versión vieja que sí era inofensiva; una actualización le agregó esto y el antivirus todavía no se enteró. Sólo conoce lo que ya conocía — tú acabas de cazar lo que él no vio.',
  },
  {
    id: 'juego-memoria',
    nombre: 'Juego de Memoria',
    emoji: '🎴',
    declara: 'Un juego de memoria con cartas para practicar tu concentración.',
    permisos: ['Tus mensajes de texto', 'Tu memoria USB'],
    real: 'No hay señal de que ya se haya conectado a nada, pero pidió permiso para leer tus mensajes y copiarse a cualquier memoria USB que conectes.',
    veredictoAntivirus: null,
    correcto: 'revisar',
    porQueBien:
      'No hay prueba de que ya haya hecho algo malo, pero pide cosas que un juego de cartas no necesita. Exactamente la duda que se lleva a un adulto, no que se decide solo.',
  },
  {
    id: 'traductor',
    nombre: 'Traductor Rápido',
    emoji: '🔤',
    declara: 'Traduce el texto que escribes a otro idioma.',
    permisos: ['El texto que escribes dentro de la app'],
    real: 'Traduce lo que escribes y nada más. Ni siquiera pide internet para las frases comunes.',
    veredictoAntivirus: 'limpio',
    correcto: 'dejar',
    porQueBien: 'Aburrido, sin sorpresas, y lo que pide es justo lo que usa. Así se ve un programa sano.',
  },
  {
    id: 'carreras-turbo',
    nombre: 'Carreras Turbo 3D',
    emoji: '🏎️',
    declara: 'Un juego de carreras con motores que rugen de verdad.',
    permisos: ['Micrófono', 'Tu ubicación exacta'],
    real: 'Enciende el micrófono en segundo plano incluso cuando ya cerraste el juego.',
    veredictoAntivirus: null,
    correcto: 'quitar',
    porQueBien:
      'Un juego de carreras no necesita oírte ni saber dónde estás para que ruja un motor. Y encenderse solo, cerrado, es la peor señal de todas.',
  },
  {
    id: 'chat-amigos',
    nombre: 'Chat con mis Amigos',
    emoji: '💬',
    declara: 'Manda mensajes y fotos a tus amigos.',
    permisos: ['Leer los mensajes de otras apps de chat'],
    real: 'No hay prueba de que ya haya leído nada, pero el permiso que pide alcanza otras conversaciones, no sólo las suyas.',
    veredictoAntivirus: null,
    correcto: 'revisar',
    porQueBien:
      'Un chat necesita mandar SUS mensajes, no leer los de las demás apps. Pinta raro, pero todavía no hay prueba: se enseña a un adulto y se decide con él.',
  },
  {
    id: 'reloj-clima',
    nombre: 'Reloj y Clima',
    emoji: '⏰',
    declara: 'Muestra la hora y el pronóstico del clima de tu ciudad.',
    permisos: ['Tu ubicación aproximada (para el clima)'],
    real: 'Usa la ubicación sólo para buscar el clima de tu zona, una vez cada hora.',
    veredictoAntivirus: 'limpio',
    correcto: 'dejar',
    porQueBien: 'Pide ubicación, pero aproximada y sólo para lo que promete: el clima. Lo que pide coincide con lo que hace.',
  },
];

const ACCION_ETIQUETA: Record<Accion, string> = {
  dejar: 'Dejarlo',
  revisar: 'Revisar con un adulto',
  quitar: 'Quitarlo',
};

/** 1 encender + 1 analizar + 10 decisiones de triaje. */
const TOTAL_PASOS = 1 + 1 + PROGRAMAS.length;

/** La pista cuando la elección no es la correcta. Nunca "inténtalo de nuevo"
 *  a secas: siempre señala hacia la pestaña que resuelve la duda. El caso de
 *  `fondos-galaxia` confiando en la chapa verde tiene su propia línea. */
function pistaError(prog: Programa, eleccion: Accion): string {
  if (prog.id === 'fondos-galaxia' && eleccion === 'dejar') {
    return 'El antivirus lo marca "limpio", pero eso sólo significa que lo conocía de una versión vieja. Mira otra vez "Qué hace de verdad": eso el antivirus no lo sabía. Y ahora tú sí.';
  }
  if (eleccion === 'dejar') {
    return prog.correcto === 'revisar'
      ? 'Antes de dejarlo tranquilo, mira lo que pide contra lo que dice. No hay prueba de que ya haya hecho daño, pero tampoco cuadra: eso se enseña a un adulto.'
      : `Vuelve a leer "Qué hace de verdad": ${prog.real}`;
  }
  if (eleccion === 'quitar') {
    return prog.correcto === 'revisar'
      ? 'Todavía no hay prueba de que haya hecho algo malo, sólo pide de más. Eso no se borra solo: se enseña a un adulto y se decide con él.'
      : 'Lo que pide es justo lo que necesita para hacer lo que promete. Quitar todo lo que se analiza no es el reflejo correcto: así tampoco se aprende a distinguir.';
  }
  // eleccion === 'revisar'
  return prog.correcto === 'dejar'
    ? 'No hace falta molestar a un adulto por este: lo que pide coincide exactamente con lo que hace.'
    : `Aquí ya tienes la prueba en "Qué hace de verdad": ${prog.real}`;
}

function badgeDe(p: Programa): { texto: string; clase: string } {
  if (p.veredictoAntivirus === 'limpio') return { texto: '✔ Conocido: limpio', clase: 'es-limpio' };
  if (p.veredictoAntivirus === 'amenaza') return { texto: '☣ Amenaza conocida', clase: 'es-amenaza' };
  return { texto: 'Sin firma conocida', clase: 'es-desconocido' };
}

export function LabVirusYAntivirus(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<Fase>('apagado');
  const [idx, setIdx] = useState(0);
  const [analizado, setAnalizado] = useState(false);
  const [escaneando, setEscaneando] = useState(false);
  const [tab, setTab] = useState<Pestana>('declara');
  const [resueltos, setResueltos] = useState<Record<string, Accion>>({});
  const [aviso, setAviso] = useState<string | null>(null);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const timers = useTemporizadores();

  // Arnés de sesión (Tanda 0 · Pieza 2): progreso, errores, puntaje y
  // `onComplete` viven en `useLabActividad`, compartido hoy con
  // `LabNubeOLocal` y `LabAtrapaElPhishing`. `fase`/`idx`/`analizado` siguen
  // aquí porque son la mecánica propia de ESTA clase, no del arnés.
  const { pasos, terminado, tiempoFinal, erroresFinal, sim, ocupar, liberar, restar, avanzar, terminar, reiniciar } =
    useLabActividad(props, TOTAL_PASOS);

  // El mismo espejo `vivo` de siempre, para que los timers no cierren sobre
  // estado viejo. `pasos` ya no hace falta adentro: lo único que lo leía era
  // el `avanzar()` que ahora vive en el arnés.
  const vivo = useRef({ terminado, fase, idx, analizado });
  useEffect(() => {
    vivo.current = { terminado, fase, idx, analizado };
  });

  const cerrar = (tiempoSegundos: number) => {
    terminar(tiempoSegundos, () => hablar(LINEAS.fin));
    setFase('fin');
  };

  /* ── fase 0 · encender el equipo ───────────────────────────────────────── */

  const encender = () => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'apagado') return;
    ocupar();
    reproducirTono('power');
    setAviso('Equipo encendido');
    hablar(LINEAS.encendido);
    avanzar();
    timers.despues(() => {
      liberar();
      setAviso(null);
      setFase('espera');
    }, 1100);
  };

  /* ── fase 1 · analizar con el antivirus ────────────────────────────────── */

  const analizar = () => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'espera' || vivo.current.analizado) return;
    ocupar();
    reproducirTono('select');
    setEscaneando(true);
    hablar(LINEAS.analizando);
    timers.despues(() => {
      setEscaneando(false);
      setAnalizado(true);
      setAviso('Análisis completo');
      hablar(LINEAS.analisisListo);
      avanzar();
      timers.despues(() => {
        liberar();
        setAviso(null);
        setFase('triaje');
      }, 1500);
    }, 1200);
  };

  /* ── fase 2 · el triaje, un programa a la vez ──────────────────────────── */

  const decidir = (accion: Accion) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'triaje') return;
    const prog = PROGRAMAS[vivo.current.idx];
    if (!prog) return;

    if (accion !== prog.correcto) {
      restar();
      hablar(pistaError(prog, accion));
      setAviso('No es eso · vuelve a mirar las pestañas');
      return;
    }

    ocupar();
    reproducirTono('correct');
    setResueltos((previos) => ({ ...previos, [prog.id]: accion }));
    hablar(prog.porQueBien);
    setAviso(`${ACCION_ETIQUETA[accion]} · correcto`);
    avanzar();

    const ultimo = vivo.current.idx + 1 >= PROGRAMAS.length;
    timers.despues(
      () => {
        liberar();
        setAviso(null);
        if (ultimo) {
          cerrar(Math.round((Date.now() - sim.current.inicio) / 1000));
        } else {
          setIdx(vivo.current.idx + 1);
          setTab('declara');
        }
      },
      ultimo ? 2600 : 2200,
    );
  };

  const repetir = () => {
    timers.limpiar();
    setFase('apagado');
    setIdx(0);
    setAnalizado(false);
    setEscaneando(false);
    setTab('declara');
    setResueltos({});
    setAviso(null);
    reiniciar(() => hablar(LINEAS.inicio));
  };

  /* ── lo que ve la pantalla ──────────────────────────────────────────────── */

  const progActual = fase === 'triaje' ? (PROGRAMAS[idx] ?? null) : null;

  const marcador =
    fase === 'apagado'
      ? { etiqueta: 'Motor', valor: 'Apagado' }
      : fase === 'espera'
        ? { etiqueta: 'Antivirus', valor: analizado ? 'Analizado' : escaneando ? 'Analizando…' : 'Sin analizar' }
        : { etiqueta: 'Revisados', valor: `${terminado ? PROGRAMAS.length : idx}/${PROGRAMAS.length}` };

  const cuerpo = (
    <VentanaBase
      claseMarco="av-marco"
      marca="Tecnia Antivirus"
      subtitulo={`${PROGRAMAS.length} programas instalados`}
      arranque={{ pie: 'El equipo de Sofi · listo para revisar', onEncender: encender }}
      encendida={fase !== 'apagado'}
    >
        <div className="av-cuerpo">
          <div className="av-lista">
            <div className="av-lista-header">
              <p className="av-lista-titulo">Programas instalados</p>
              {fase === 'espera' && !analizado && (
                <button type="button" className="av-analizar" onClick={analizar} disabled={escaneando}>
                  {escaneando ? 'Analizando…' : '🔍 Analizar con el antivirus'}
                </button>
              )}
            </div>
            <div className="av-lista-filas">
              {PROGRAMAS.map((p, i) => {
                const badge = analizado ? badgeDe(p) : null;
                const resuelto = resueltos[p.id];
                const activo = fase === 'triaje' && i === idx;
                return (
                  <div key={p.id} className={`av-fila${activo ? ' es-activa' : ''}${resuelto ? ' es-resuelta' : ''}`}>
                    <span className="av-fila-emoji" aria-hidden="true">
                      {p.emoji}
                    </span>
                    <span className="av-fila-nombre">{p.nombre}</span>
                    {badge && <span className={`av-badge ${badge.clase}`}>{badge.texto}</span>}
                    {resuelto && <span className="av-fila-veredicto">✔ {ACCION_ETIQUETA[resuelto]}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="av-panel">
            {!progActual ? (
              <div className="av-panel-vacio">
                <p>
                  {fase === 'espera'
                    ? 'Analiza el equipo con el antivirus antes de revisar cada programa.'
                    : 'Mesa de triaje terminada.'}
                </p>
              </div>
            ) : (
              <>
                <div className="av-panel-header">
                  <span className="av-panel-emoji" aria-hidden="true">
                    {progActual.emoji}
                  </span>
                  <span className="av-panel-nombre">{progActual.nombre}</span>
                  {analizado && (
                    <span className={`av-badge ${badgeDe(progActual).clase}`}>{badgeDe(progActual).texto}</span>
                  )}
                </div>

                <div className="av-tabs">
                  <button type="button" className={`av-tab${tab === 'declara' ? ' es-activa' : ''}`} onClick={() => setTab('declara')}>
                    Qué dice que hace
                  </button>
                  <button type="button" className={`av-tab${tab === 'permisos' ? ' es-activa' : ''}`} onClick={() => setTab('permisos')}>
                    Permisos que pide
                  </button>
                  <button type="button" className={`av-tab${tab === 'real' ? ' es-activa' : ''}`} onClick={() => setTab('real')}>
                    Qué hace de verdad
                  </button>
                </div>

                <div className="av-tab-contenido">
                  {tab === 'declara' && <p className="av-declara">«{progActual.declara}»</p>}
                  {tab === 'permisos' && (
                    <ul className="av-permisos">
                      {progActual.permisos.map((permiso) => (
                        <li key={permiso}>{permiso}</li>
                      ))}
                    </ul>
                  )}
                  {tab === 'real' && <p className="av-real">{progActual.real}</p>}
                </div>

                <div className="av-acciones">
                  <button type="button" className="av-accion av-accion-dejar" onClick={() => decidir('dejar')}>
                    ✅ Dejarlo
                  </button>
                  <button type="button" className="av-accion av-accion-revisar" onClick={() => decidir('revisar')}>
                    🧑‍🏫 Revisar con un adulto
                  </button>
                  <button type="button" className="av-accion av-accion-quitar" onClick={() => decidir('quitar')}>
                    🗑️ Quitarlo
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
    </VentanaBase>
  );

  return (
    <ArcadeSala
      titulo="Virus y antivirus"
      pasoEtiqueta="Paso"
      pasoActual={terminado ? TOTAL_PASOS : pasos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta={marcador.etiqueta}
      marcadorValor={marcador.valor}
      bit={linea}
      base={<p className="gabinete-nota">La mesa de triaje · qué dice, qué pide y qué hace de verdad</p>}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Guardián del equipo',
              insigniaEmoji: '🛡️',
              titulo: '¡Mesa de triaje completa!',
              detalle:
                'Revisaste diez programas por sus tres caras, cazaste el que el antivirus daba por limpio sin estarlo, y decidiste cada uno por lo que hace de verdad, no por su etiqueta.',
              resumen: [
                { etiqueta: 'Programas', valor: `${PROGRAMAS.length}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
                { etiqueta: 'Errores', valor: `${erroresFinal}` },
              ],
              alRepetir: repetir,
            }
          : null
      }
    >
      {cuerpo}
      {aviso && <AvisoRonda texto={aviso} clave={aviso} />}
    </ArcadeSala>
  );
}

export default LabVirusYAntivirus;
