'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { ArcadeSala, AvisoRonda, useBit } from '../../n1/arcade/ArcadeSala';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { formatTiempo, useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import './nubeOLocal.css';

/**
 * N5·U1 «El sistema de cómputo», parada 3 · «¿Nube o local?».
 *
 * Nada de nubes de algodón ni cajitas voladoras: lo que en la vida real es
 * software se construye como software. Este laboratorio ES «Tecnia Archivos»,
 * un explorador de dos sitios —Esta computadora y Mi nube— montado en la
 * pantalla PLANA de `ArcadeSala` (n1/arcade/ArcadeSala.tsx), la misma que usa
 * «Tecnia Antivirus» de N4·U6: sin 3D, sin metáfora física.
 *
 * La mecánica, tal como la pidió el encargo (14-ago-2026):
 *
 *   1 · ENCENDER — un solo botón, como abrir cualquier programa.
 *   2 · GUARDAR — nueve archivos y situaciones, uno a la vez. El alumno
 *       decide DÓNDE va cada uno —Esta computadora, Mi nube o los dos— SIN
 *       saber todavía qué va a pasar. Así es también en la vida real: la
 *       decisión se toma antes del problema, no después.
 *   3 · SUCESOS — ya con los nueve guardados, pasan cosas de verdad, una por
 *       archivo: se va el internet, se rompe el disco, pierde la laptop, un
 *       compañero necesita el archivo hoy, quiere abrirlo desde el celular de
 *       su mamá… Cada suceso revela si la decisión sirvió o no, con una
 *       explicación propia para cada uno de los tres sitios posibles —nunca
 *       "inténtalo de nuevo" a secas—, porque **nunca hay una respuesta buena
 *       para todo**: a veces gana lo local, a veces la nube, muchas veces sólo
 *       "los dos", y en el archivo privado, ninguno de los que sube a la nube.
 *
 * El panel de «Mi nube» lleva su propio indicador de conexión, no un HUD
 * flotante: cuando el suceso es justo que se fue el internet (el archivo de
 * la tarea, primero de la lista), el indicador cambia solo a «Sin conexión» y
 * la nube entera se ve inalcanzable —la lección aburrida y real del encargo:
 * sin internet, la nube no existe para ti, así el archivo siga a salvo en el
 * disco de otra persona.
 *
 * El error nunca borra lo logrado: sólo resta en el puntaje (100 − 6, piso
 * 60), igual que el resto del catálogo N4/N5.
 */

type Fase = 'apagado' | 'guardando' | 'sucesos' | 'fin';
type Sitio = 'local' | 'nube' | 'ambos';

interface Resultado {
  texto: string;
  bien: boolean;
}

interface Archivo {
  id: string;
  nombre: string;
  emoji: string;
  /** Lo que el alumno lee antes de decidir dónde guardarlo. */
  contexto: string;
  sucesoTitulo: string;
  sucesoCuerpo: string;
  /** Este suceso apaga el internet en pantalla mientras se muestra. */
  internetCorte?: boolean;
  resultados: Record<Sitio, Resultado>;
}

const SITIO_ETIQUETA: Record<Sitio, string> = {
  local: 'Esta computadora',
  nube: 'Mi nube',
  ambos: 'Los dos',
};

const SITIO_BOTON: Record<Sitio, string> = {
  local: '💻 Sólo en Esta computadora',
  nube: '☁️ Sólo en Mi nube',
  ambos: '🔗 Guardar en los dos',
};

const LINEAS = {
  inicio:
    'Este es Tecnia Archivos. Vas a guardar nueve cosas tuyas, y hay dos sitios: Esta computadora y Mi nube. Ojo: la nube no es aire — es el disco de otra computadora, en un edificio de verdad, que alguien paga. Antes de tocar nada, enciende el equipo.',
  encendido: 'Equipo encendido. Aquí tienes Tecnia Archivos, con tus dos sitios listos.',
  guardando:
    'Uno por uno, decide dónde va cada archivo: esta computadora, la nube, o los dos. Todavía no sabes qué va a pasar — así es también en la vida real.',
  transicion: 'Ya decidiste los nueve. Ahora, uno por uno, vamos a ver qué pasa con cada decisión.',
  fin: 'Explorador completo. Ninguna decisión sirve siempre: a veces gana lo local, a veces la nube, y muchas veces sólo "los dos". Lo único que nunca conviene es subir lo que no debe salir de tu computadora.',
};

const ARCHIVOS: Archivo[] = [
  {
    id: 'tarea-manana',
    nombre: 'Tarea de Matemáticas para mañana',
    emoji: '📘',
    contexto: 'La terminas esta noche. Mañana temprano la enseñas en el salón.',
    sucesoTitulo: 'Se fue la luz, y con ella el internet',
    sucesoCuerpo: 'Amaneciste sin luz en la casa. No hay internet, y el camión de la escuela pasa en diez minutos.',
    internetCorte: true,
    resultados: {
      local: {
        bien: true,
        texto: 'Abriste tu tarea sin esperar nada: estaba guardada en esta misma computadora, y eso no necesita internet para nada.',
      },
      nube: {
        bien: false,
        texto:
          'Intentas abrirla y la pantalla se queda pensando. Sin internet, tu nube no existe para ti: el archivo sigue ahí, en el disco de otra computadora, pero hoy no hay forma de llegar a él.',
      },
      ambos: {
        bien: true,
        texto: 'Abriste la copia de Esta computadora sin ningún problema: ésa no necesita internet. La de la nube también está a salvo, aunque hoy no hizo falta.',
      },
    },
  },
  {
    id: 'fotos-viaje',
    nombre: 'Fotos del viaje a la playa (86 fotos)',
    emoji: '🏖️',
    contexto: 'Todo el rollo del viaje con tus primos. Pesan bastante.',
    sucesoTitulo: 'El disco de la computadora se echó a perder',
    sucesoCuerpo: 'Un año después prendes la computadora y no arranca. El técnico lo dice claro: el disco murió, y lo que vivía sólo ahí ya no está en ningún lado.',
    resultados: {
      local: {
        bien: false,
        texto: 'Las 86 fotos vivían nada más en ese disco. Cuando se rompió, se fueron con él: no queda otra copia en ningún lado.',
      },
      nube: {
        bien: true,
        texto: 'El disco se rompió, pero tus fotos nunca vivieron ahí de planta: siguen intactas en la computadora de otra persona, la que guarda tu nube.',
      },
      ambos: {
        bien: true,
        texto: 'Perdiste la copia de esta computadora, pero la de la nube sigue completa. Lo que se guarda en un solo sitio no está guardado — por eso "los dos" no falla.',
      },
    },
  },
  {
    id: 'cartel-equipo',
    nombre: 'Cartel de la feria de Ciencias',
    emoji: '🧪',
    contexto: 'Lo arman entre tres compañeros. Cada quien mete su parte en días distintos.',
    sucesoTitulo: 'Tu compañera necesita el cartel HOY',
    sucesoCuerpo: 'Faltan dos días para la feria. Tu compañera te escribe: necesita meterle su parte ahora mismo, y tú te quedaste en casa, enfermo.',
    resultados: {
      local: {
        bien: false,
        texto: 'El cartel está encerrado en tu computadora, en tu casa. Tu compañera no tiene cómo llegar a él hoy, y el trabajo se atrasa.',
      },
      nube: {
        bien: true,
        texto: 'Le mandas el acceso y tu compañera entra y mete su parte desde su casa, sin que tú muevas un dedo. Para trabajar entre varios, la nube es justo lo que hace falta.',
      },
      ambos: {
        bien: true,
        texto: 'Tu compañera edita la copia de la nube sin esperarte. La de esta computadora sigue ahí también, por si un día se cae el internet del salón.',
      },
    },
  },
  {
    id: 'video-cumple',
    nombre: 'Video de tu cumpleaños (4 GB)',
    emoji: '🎥',
    contexto: 'Dura veinte minutos y pesa muchísimo. Lo quieres conservar para siempre.',
    sucesoTitulo: 'Perdiste la mochila en el camión',
    sucesoCuerpo: 'Bajaste corriendo y la mochila se quedó en el asiento. Con ella, la laptop.',
    resultados: {
      local: {
        bien: false,
        texto: 'El video vivía sólo en esa laptop. Se fue con la mochila, y un cumpleaños no se puede grabar dos veces.',
      },
      nube: {
        bien: true,
        texto: 'Perdiste la laptop, pero no el video: sigue guardado en la computadora de otra persona, la que hospeda tu nube, esperando a que entres desde cualquier otro equipo.',
      },
      ambos: {
        bien: true,
        texto: 'Subir 4 GB tardó un buen rato y ocupó espacio de tu nube, pero cuando perdiste la laptop, esa espera valió la pena: el video sigue completo.',
      },
    },
  },
  {
    id: 'wifi-casa',
    nombre: 'Contraseña del wifi de casa',
    emoji: '📶',
    contexto: 'La apuntaste en una nota para no preguntarle siempre a tu papá.',
    sucesoTitulo: 'Tu prima la pide desde la puerta',
    sucesoCuerpo: 'Tu prima llega de visita con el celular en la mano: "¿Cuál es la clave del wifi?"',
    resultados: {
      local: {
        bien: false,
        texto: 'Tienes que subir a tu cuarto, prender la computadora y buscar la nota, mientras tu prima espera parada en la puerta.',
      },
      nube: {
        bien: true,
        texto: 'Sacas tu celular, abres la nota desde la nube y se la lees en dos segundos, sin moverte de la puerta.',
      },
      ambos: {
        bien: true,
        texto: 'La tienes a la mano en el celular, desde la nube, y también queda en la computadora de casa por si un día el celular se queda sin batería.',
      },
    },
  },
  {
    id: 'diario-privado',
    nombre: 'Tu diario secreto',
    emoji: '🔒',
    contexto: 'Ahí escribes cosas que no le enseñas a nadie, ni a tu mejor amigo.',
    sucesoTitulo: 'Casi lo subes sin pensarlo',
    sucesoCuerpo: 'Ibas a subir todos tus archivos de un jalón para tenerlos "seguros", y el diario iba en la pila.',
    resultados: {
      local: {
        bien: true,
        texto: 'Se quedó nada más en tu computadora, donde sólo tú entras. Lo que subes a la nube lo puede ver quien administra ese servicio — y hay cosas, como un diario, que no se suben.',
      },
      nube: {
        bien: false,
        texto: 'Ahora tu diario vive en la computadora de otra persona, en un edificio de verdad, de una empresa que administra ese servicio y puede llegar a verlo. Un diario no se sube.',
      },
      ambos: {
        bien: false,
        texto: 'Guardarlo "también por si acaso" no lo hace más seguro: ya subiste una copia a la computadora de otra persona, y eso es justo lo que un diario no debe hacer.',
      },
    },
  },
  {
    id: 'cancion-festival',
    nombre: 'Canción para el festival de la escuela',
    emoji: '🎵',
    contexto: 'La grabaste en casa. Tu maestra quiere escucharla antes del ensayo.',
    sucesoTitulo: 'Tu maestra te marca al celular de tu mamá',
    sucesoCuerpo: 'Estás en el centro comercial. Tu maestra te pide, por videollamada, que le mandes la canción ahí mismo, para el ensayo de mañana.',
    resultados: {
      local: {
        bien: false,
        texto: 'La canción está en tu computadora, en tu casa. Desde el celular de tu mamá no hay forma de alcanzarla ahora mismo.',
      },
      nube: {
        bien: true,
        texto: 'Entras a tu nube desde el celular de tu mamá, con tu cuenta, y se la mandas a tu maestra en el momento. Ni falta hizo estar en tu casa.',
      },
      ambos: {
        bien: true,
        texto: 'La mandas desde la nube en el celular de tu mamá sin problema, y la copia de tu computadora sigue ahí para seguir editándola en casa.',
      },
    },
  },
  {
    id: 'capturas-juego',
    nombre: 'Capturas de tu videojuego favorito',
    emoji: '🎮',
    contexto: 'Cincuenta capturas de tus mejores partidas. Un recuerdo, sin ninguna prisa.',
    sucesoTitulo: 'No pasa nada. De verdad, nada.',
    sucesoCuerpo: 'Pasan los meses y esas capturas siguen ahí tal cual, sin que nadie las necesite ni les pase nada.',
    resultados: {
      local: {
        bien: true,
        texto: 'No pasó nada, y estuvo bien: no todo archivo necesita las dos copias. Nadie lo necesitó en otro lado ni corrió ningún riesgo.',
      },
      nube: {
        bien: true,
        texto: 'Tampoco pasó nada, y de haber pasado algo, ahí habrían estado a salvo.',
      },
      ambos: {
        bien: true,
        texto: 'Funcionó igual, aunque para un recuerdo sin prisa no hacía falta duplicarlo. También es una lección: no todo se guarda por partida doble.',
      },
    },
  },
  {
    id: 'presentacion-historia',
    nombre: 'Presentación de Historia para pasado mañana',
    emoji: '📊',
    contexto: 'La haces tú sola, y la expones en dos días.',
    sucesoTitulo: 'Se te quedó la laptop en tu casa',
    sucesoCuerpo: 'Llegas a la escuela y te das cuenta: la laptop se quedó cargando junto a tu cama. Faltan cinco minutos para pasar al frente.',
    resultados: {
      local: {
        bien: false,
        texto: 'La presentación sigue en esa laptop, en tu casa. Aquí, en la escuela, no hay forma de abrirla a tiempo.',
      },
      nube: {
        bien: true,
        texto: 'Entras a la computadora del salón, abres tu nube, y ahí está completa. No importó dónde se quedó la laptop.',
      },
      ambos: {
        bien: true,
        texto: 'Desde la computadora del salón abres la copia de la nube sin ningún problema. La de tu laptop, aunque hoy no sirvió de nada, sigue esperándote en casa.',
      },
    },
  },
];

/** 1 encender + 9 decisiones de guardado + 9 sucesos revelados. */
const TOTAL_PASOS = 1 + ARCHIVOS.length * 2;

export function LabNubeOLocal(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<Fase>('apagado');
  const [idxG, setIdxG] = useState(0);
  const [idxS, setIdxS] = useState(0);
  const [sitios, setSitios] = useState<Record<string, Sitio>>({});
  const [revelado, setRevelado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const timers = useTemporizadores();

  // Arnés de sesión (Tanda 0 · Pieza 2): progreso, errores, puntaje y
  // `onComplete` viven en `useLabActividad`, compartido hoy con
  // `LabVirusYAntivirus` y `LabAtrapaElPhishing`. `fase`/`idxG`/`idxS`/
  // `revelado` siguen aquí porque son la mecánica propia de ESTA clase.
  const { pasos, terminado, tiempoFinal, erroresFinal, sim, ocupar, liberar, restar, avanzar, terminar, reiniciar } =
    useLabActividad(props, TOTAL_PASOS);

  const vivo = useRef({ terminado, fase, idxG, idxS, revelado });
  useEffect(() => {
    vivo.current = { terminado, fase, idxG, idxS, revelado };
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
      setFase('guardando');
      hablar(LINEAS.guardando);
    }, 1100);
  };

  /* ── fase 1 · guardar los nueve archivos, uno a la vez ─────────────────── */

  const decidirGuardar = (sitio: Sitio) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'guardando') return;
    const archivo = ARCHIVOS[vivo.current.idxG];
    if (!archivo) return;

    ocupar();
    reproducirTono('select');
    setSitios((previos) => ({ ...previos, [archivo.id]: sitio }));
    setAviso(`Guardado en ${SITIO_ETIQUETA[sitio]}`);
    avanzar();

    const ultimo = vivo.current.idxG + 1 >= ARCHIVOS.length;
    timers.despues(
      () => {
        liberar();
        setAviso(null);
        if (ultimo) {
          setFase('sucesos');
          hablar(LINEAS.transicion);
        } else {
          setIdxG(vivo.current.idxG + 1);
        }
      },
      900,
    );
  };

  /* ── fase 2 · los sucesos, uno por archivo ─────────────────────────────── */

  const revelarSuceso = () => {
    if (vivo.current.terminado || vivo.current.fase !== 'sucesos' || vivo.current.revelado) return;
    const archivo = ARCHIVOS[vivo.current.idxS];
    if (!archivo) return;
    const sitio = sitios[archivo.id];
    if (!sitio) return;
    const resultado = archivo.resultados[sitio];

    if (resultado.bien) {
      reproducirTono('correct');
    } else {
      restar();
    }
    hablar(resultado.texto);
    setAviso(resultado.bien ? '✔ Salió bien' : '✘ Salió mal');
    setRevelado(true);
    avanzar();
  };

  const siguienteSuceso = () => {
    if (vivo.current.terminado || vivo.current.fase !== 'sucesos' || !vivo.current.revelado) return;
    setAviso(null);
    const ultimo = vivo.current.idxS + 1 >= ARCHIVOS.length;
    if (ultimo) {
      cerrar(Math.round((Date.now() - sim.current.inicio) / 1000));
    } else {
      setIdxS(vivo.current.idxS + 1);
      setRevelado(false);
    }
  };

  const repetir = () => {
    timers.limpiar();
    setFase('apagado');
    setIdxG(0);
    setIdxS(0);
    setSitios({});
    setRevelado(false);
    setAviso(null);
    reiniciar(() => hablar(LINEAS.inicio));
  };

  /* ── lo que ve la pantalla ──────────────────────────────────────────────── */

  const archivoGuardando = fase === 'guardando' ? (ARCHIVOS[idxG] ?? null) : null;
  const archivoSuceso = fase === 'sucesos' ? (ARCHIVOS[idxS] ?? null) : null;
  const resultadoActual = archivoSuceso && revelado ? archivoSuceso.resultados[sitios[archivoSuceso.id]] : null;
  const sinInternet = fase === 'sucesos' && Boolean(archivoSuceso?.internetCorte);

  const marcador =
    fase === 'apagado'
      ? { etiqueta: 'Motor', valor: 'Apagado' }
      : fase === 'guardando'
        ? { etiqueta: 'Guardados', valor: `${idxG}/${ARCHIVOS.length}` }
        : { etiqueta: 'Resueltos', valor: `${terminado ? ARCHIVOS.length : idxS}/${ARCHIVOS.length}` };

  const chipsDe = (sitio: 'local' | 'nube') =>
    ARCHIVOS.filter((a) => {
      const s = sitios[a.id];
      return s === sitio || s === 'ambos';
    });

  const chipsLocal = chipsDe('local');
  const chipsNube = chipsDe('nube');

  const cuerpo = (
    <VentanaBase
      claseMarco="ex-marco"
      marca="Tecnia Archivos"
      subtitulo={`${ARCHIVOS.length} archivos por guardar`}
      arranque={{ pie: 'El equipo de Sofi · listo para decidir', onEncender: encender }}
      encendida={fase !== 'apagado'}
    >
        <div className="ex-cuerpo">
          <div className="ex-sitios">
            <div className="ex-sitio">
              <div className="ex-sitio-header">
                <span className="ex-sitio-icono" aria-hidden="true">🖥️</span>
                <span className="ex-sitio-nombre">Esta computadora</span>
              </div>
              <div className="ex-sitio-chips">
                {chipsLocal.length === 0 && <p className="ex-sitio-vacio">Todavía no hay nada aquí.</p>}
                {chipsLocal.map((a) => (
                  <span key={a.id} className="ex-chip">
                    <span aria-hidden="true">{a.emoji}</span> {a.nombre}
                  </span>
                ))}
              </div>
            </div>

            <div className="ex-sitio">
              <div className="ex-sitio-header">
                <span className="ex-sitio-icono" aria-hidden="true">☁️</span>
                <span className="ex-sitio-nombre">Mi nube</span>
                <span className={`ex-internet${sinInternet ? ' es-corte' : ''}`}>
                  {sinInternet ? '🚫 Sin conexión' : '🛜 Conectado'}
                </span>
              </div>
              <div className={`ex-sitio-chips${sinInternet ? ' es-inalcanzable' : ''}`}>
                {chipsNube.length === 0 && <p className="ex-sitio-vacio">Todavía no hay nada aquí.</p>}
                {chipsNube.map((a) => (
                  <span key={a.id} className="ex-chip">
                    <span aria-hidden="true">{a.emoji}</span> {a.nombre}
                  </span>
                ))}
                {sinInternet && (
                  <div className="ex-sitio-overlay">Sin conexión: no hay forma de llegar a estos archivos ahora.</div>
                )}
              </div>
            </div>
          </div>

          <div className="ex-tarjeta">
            {archivoGuardando && (
              <>
                <div className="ex-tarjeta-cabecera">
                  <span className="ex-tarjeta-emoji" aria-hidden="true">{archivoGuardando.emoji}</span>
                  <span className="ex-tarjeta-nombre">{archivoGuardando.nombre}</span>
                </div>
                <p className="ex-tarjeta-contexto">{archivoGuardando.contexto}</p>
                <p className="ex-tarjeta-pregunta">¿Dónde lo guardas?</p>
                <div className="ex-acciones">
                  <button type="button" className="ex-accion ex-accion-local" onClick={() => decidirGuardar('local')}>
                    {SITIO_BOTON.local}
                  </button>
                  <button type="button" className="ex-accion ex-accion-nube" onClick={() => decidirGuardar('nube')}>
                    {SITIO_BOTON.nube}
                  </button>
                  <button type="button" className="ex-accion ex-accion-ambos" onClick={() => decidirGuardar('ambos')}>
                    {SITIO_BOTON.ambos}
                  </button>
                </div>
              </>
            )}

            {archivoSuceso && (
              <>
                <div className="ex-tarjeta-cabecera">
                  <span className="ex-tarjeta-emoji" aria-hidden="true">{archivoSuceso.emoji}</span>
                  <span className="ex-tarjeta-nombre">{archivoSuceso.nombre}</span>
                  <span className="ex-tarjeta-sitio">Guardaste: {SITIO_ETIQUETA[sitios[archivoSuceso.id]]}</span>
                </div>
                <p className="ex-suceso-titulo">{archivoSuceso.sucesoTitulo}</p>
                <p className="ex-suceso-cuerpo">{archivoSuceso.sucesoCuerpo}</p>

                {resultadoActual && (
                  <div className={`ex-resultado ${resultadoActual.bien ? 'es-bien' : 'es-mal'}`}>
                    <span className="ex-resultado-badge">{resultadoActual.bien ? '✔ Salió bien' : '✘ Salió mal'}</span>
                    <p className="ex-resultado-texto">{resultadoActual.texto}</p>
                  </div>
                )}

                <div className="ex-acciones">
                  {!revelado ? (
                    <button type="button" className="ex-accion ex-accion-revelar" onClick={revelarSuceso}>
                      🔍 Ver qué pasó
                    </button>
                  ) : (
                    <button type="button" className="ex-accion ex-accion-siguiente" onClick={siguienteSuceso}>
                      {idxS + 1 >= ARCHIVOS.length ? '🏁 Ver el resumen' : 'Siguiente ▶'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
    </VentanaBase>
  );

  return (
    <ArcadeSala
      titulo="¿Nube o local?"
      pasoEtiqueta="Paso"
      pasoActual={terminado ? TOTAL_PASOS : pasos}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta={marcador.etiqueta}
      marcadorValor={marcador.valor}
      bit={linea}
      base={<p className="gabinete-nota">Tecnia Archivos · decides antes de saber qué va a pasar</p>}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Dueño de tus archivos',
              insigniaEmoji: '🗂️',
              titulo: '¡Explorador completo!',
              detalle:
                'Guardaste nueve cosas tuyas y viviste lo que pasa después: la nube que sigue viva cuando el disco se rompe, lo local que sigue vivo cuando se va el internet, y el archivo privado que nunca debió subir. Ninguna decisión sirve siempre.',
              resumen: [
                { etiqueta: 'Archivos', valor: `${ARCHIVOS.length}` },
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

export default LabNubeOLocal;
