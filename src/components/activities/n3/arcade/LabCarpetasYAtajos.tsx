'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { Consigna3D } from '../../arcade3d/piezas3d';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { FichaTomable3D, type EstadoExhibicion } from './museoN3';
import { ArchiveroCajon3D, CanastaArchivos3D, TecladoAtajo3D, type TeclaAtajo } from './piezasN3U2';

/**
 * N3·U2 · Parada 3 «Carpetas y atajos» (documento §17.3).
 *
 * Aparato dedicado: el archivero de tres cajones rotulados en su propio frente,
 * la canasta de archivos sueltos al borde de la mesa y —cuando llega el truco—
 * un teclado empotrado con las teclas del atajo. Canasta y teclado nunca están
 * a la vez: cada fase usa su mueble.
 */

const LINEAS = {
  inicio: '¡Qué desorden de archivos! ¿Los guardamos en su carpeta para encontrarlos rápido?',
  acierto: '¡Perfecto! Ese archivo va justo en esa carpeta.',
  error: 'Mmm, ¿de qué es ese archivo? Fíjate en qué carpeta encaja mejor.',
  anidadas: 'Una carpeta puede tener otras adentro, como cajones dentro de cajones.',
  atajo: '¡Ahora el truco! Ctrl + C copia y Ctrl + V pega. ¡Rapidísimo!',
  completar: '¡Archivero ordenado y atajo dominado! Ya eres más rápido que nadie.',
  tomaArchivo: 'Primero toma un archivo de la canasta y luego llévalo a su cajón.',
  ctrlAbajo: 'Ctrl abajo… sin soltarla, toca la letra.',
  sinCtrl: 'Solita no hace nada: primero mantén Ctrl y luego toca la letra.',
  copiado: '¡Copiada! Ahora pégala en el cajón de Escuela con Ctrl + V.',
};

type CarpetaId = 'fotos' | 'escuela' | 'juegos';

interface Carpeta {
  id: CarpetaId;
  etiqueta: string;
  icono: string;
}

const CARPETAS: Carpeta[] = [
  { id: 'fotos', etiqueta: 'Fotos', icono: '📷' },
  { id: 'escuela', etiqueta: 'Escuela', icono: '📚' },
  { id: 'juegos', etiqueta: 'Juegos', icono: '🎮' },
];

interface Archivo {
  id: string;
  nombre: string;
  emoji: string;
  carpeta: CarpetaId;
}

const ARCHIVOS: Archivo[] = [
  { id: 'mascota', nombre: 'Foto de una mascota', emoji: '🐶', carpeta: 'fotos' },
  { id: 'tarea', nombre: 'Tarea de matemáticas', emoji: '➗', carpeta: 'escuela' },
  { id: 'laberinto', nombre: 'Juego de laberinto', emoji: '🌀', carpeta: 'juegos' },
  { id: 'paseo', nombre: 'Foto de un paseo', emoji: '🏞️', carpeta: 'fotos' },
  { id: 'ciencias', nombre: 'Dibujo de ciencias', emoji: '🔬', carpeta: 'escuela' },
  { id: 'memoria', nombre: 'Juego de memoria', emoji: '🃏', carpeta: 'juegos' },
];

/** El archivo que se copia con el atajo: sirve en dos carpetas a la vez. */
const COPIABLE: Archivo = {
  id: 'experimento',
  nombre: 'Foto del experimento',
  emoji: '📸',
  carpeta: 'fotos',
};

const META: Record<CarpetaId, number> = { fotos: 2, escuela: 2, juegos: 2 };
/** 6 archivos guardados + copiar + pegar. */
const TOTAL_PASOS = ARCHIVOS.length + 2;

type Fase = 'clasificar' | 'atajo';
type PasoAtajo = 'copiar' | 'pegar' | 'listo';

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabCarpetasYAtajos(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<Fase>('clasificar');
  const [pendientes, setPendientes] = useState<Archivo[]>(ARCHIVOS);
  const [guardados, setGuardados] = useState<Record<CarpetaId, Archivo[]>>({ fotos: [], escuela: [], juegos: [] });
  const [elegido, setElegido] = useState<string | null>(null);
  const [cajonMal, setCajonMal] = useState<CarpetaId | null>(null);
  const [paso, setPaso] = useState<PasoAtajo>('copiar');
  const [ctrl, setCtrl] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0, ctrl: false });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, fase, paso, elegido });

  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, fase, paso, elegido };
  });

  useEffect(() => {
    sim.current.inicio = Date.now();
  }, []);

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

  const fallar = useCallback(
    (texto: string) => {
      reproducirTono('error');
      sim.current.errores += 1;
      propsRef.current.onScore(puntaje());
      hablar(texto);
    },
    [hablar],
  );

  const terminar = (tiempoSegundos: number) => {
    reproducirTono('complete');
    hablar(LINEAS.completar);
    const s = sim.current;
    const score = puntaje();
    propsRef.current.onProgress(1);
    propsRef.current.onScore(score);
    propsRef.current.onComplete({ score, stars: 3, xp: score, errores: s.errores, tiempoSegundos });
    setTiempoFinal(tiempoSegundos);
    setErroresFinal(s.errores);
    setTerminado(true);
  };

  const tomarArchivo = (id: string) => {
    if (vivo.current.terminado || sim.current.ocupado || vivo.current.fase !== 'clasificar') return;
    reproducirTono('select');
    setElegido(id);
    const a = ARCHIVOS.find((x) => x.id === id);
    if (a) hablar(`Tomaste «${a.nombre}». ¿En qué cajón lo guardamos?`);
  };

  const guardarEn = (destino: CarpetaId, idExplicito?: string) => {
    if (vivo.current.terminado || sim.current.ocupado || vivo.current.fase !== 'clasificar') return;
    const id = idExplicito ?? vivo.current.elegido;
    if (!id) {
      hablar(LINEAS.tomaArchivo);
      return;
    }
    const archivo = ARCHIVOS.find((x) => x.id === id);
    if (!archivo) return;

    if (archivo.carpeta !== destino) {
      setCajonMal(destino);
      fallar(LINEAS.error);
      timers.despues(() => setCajonMal(null), 460);
      return;
    }

    reproducirTono('correct');
    setPendientes((prev) => prev.filter((a) => a.id !== id));
    setGuardados((prev) => ({ ...prev, [destino]: [...prev[destino], archivo] }));
    setElegido(null);
    propsRef.current.onScore(puntaje());

    const hechos = ARCHIVOS.length - pendientes.length + 1;
    propsRef.current.onProgress(hechos / TOTAL_PASOS);

    if (hechos === ARCHIVOS.length) {
      sim.current.ocupado = true;
      reproducirTono('save');
      setAviso('¡Archivos en su carpeta!');
      hablar(LINEAS.anidadas);
      timers.despues(() => {
        setAviso(null);
        // Llega el archivo que servirá para el truco: ya vive en Fotos.
        setGuardados((prev) => ({ ...prev, fotos: [...prev.fotos, COPIABLE] }));
        setFase('atajo');
        setPaso('copiar');
        hablar(LINEAS.atajo);
        sim.current.ocupado = false;
      }, 1600);
      return;
    }

    hablar(LINEAS.acierto);
  };

  const presionarTecla = useCallback(
    (id: string, ctrlFisico = false) => {
      if (vivo.current.terminado || sim.current.ocupado || vivo.current.fase !== 'atajo') return;
      const pasoActual = vivo.current.paso;
      if (pasoActual === 'listo') return;

      if (id === 'ctrl') {
        reproducirTono('select');
        sim.current.ctrl = true;
        setCtrl(true);
        hablar(LINEAS.ctrlAbajo);
        return;
      }

      const conCtrl = ctrlFisico || sim.current.ctrl;
      if (!conCtrl) {
        fallar(LINEAS.sinCtrl);
        return;
      }
      if (ctrlFisico) {
        sim.current.ctrl = true;
        setCtrl(true);
      }

      const esperada = pasoActual === 'copiar' ? 'c' : 'v';
      if (id !== esperada) {
        fallar(pasoActual === 'copiar' ? 'Con Ctrl se copia usando la C. Inténtalo otra vez.' : 'Con Ctrl se pega usando la V. Inténtalo otra vez.');
        return;
      }

      reproducirTono('correct');
      sim.current.ctrl = false;
      setCtrl(false);

      if (pasoActual === 'copiar') {
        setPaso('pegar');
        hablar(LINEAS.copiado);
        propsRef.current.onProgress((ARCHIVOS.length + 1) / TOTAL_PASOS);
        return;
      }

      sim.current.ocupado = true;
      setPaso('listo');
      setGuardados((prev) => ({ ...prev, escuela: [...prev.escuela, COPIABLE] }));
      reproducirTono('save');
      setAviso('¡Copiada y pegada!');
      const tiempoSegundos = Math.round((Date.now() - sim.current.inicio) / 1000);
      timers.despues(() => {
        setAviso(null);
        sim.current.ocupado = false;
        terminar(tiempoSegundos);
      }, 1500);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hablar/fallar son estables y terminar solo usa refs
    [fallar, hablar],
  );

  // El atajo también se puede hacer con el teclado físico: es el mismo gesto
  // que aprenderá fuera de la plataforma.
  useEffect(() => {
    if (fase !== 'atajo' || terminado) return;
    const alTeclear = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'control') {
        presionarTecla('ctrl');
        return;
      }
      if ((k === 'c' || k === 'v') && e.ctrlKey) {
        e.preventDefault();
        presionarTecla(k, true);
      }
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [fase, terminado, presionarTecla]);

  const repetir = () => {
    timers.limpiar();
    sim.current.errores = 0;
    sim.current.ocupado = false;
    sim.current.ctrl = false;
    sim.current.inicio = Date.now();
    setFase('clasificar');
    setPendientes(ARCHIVOS);
    setGuardados({ fotos: [], escuela: [], juegos: [] });
    setElegido(null);
    setCajonMal(null);
    setPaso('copiar');
    setCtrl(false);
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const guardadosTotales = ARCHIVOS.length - pendientes.length;
  const pasosHechos =
    guardadosTotales + (fase === 'atajo' ? (paso === 'copiar' ? 0 : paso === 'pegar' ? 1 : 2) : 0);

  const estadoCajon = (id: CarpetaId): EstadoExhibicion => {
    if (cajonMal === id) return 'mal';
    if (fase === 'atajo') {
      if (paso === 'copiar' && id === 'fotos') return 'listo';
      if (paso === 'pegar' && id === 'escuela') return 'listo';
      return guardados[id].length >= META[id] ? 'ok' : 'espera';
    }
    if (guardados[id].length === META[id]) return 'ok';
    return elegido ? 'listo' : 'espera';
  };

  // La copia del atajo entra en un cajón que ya cumplió su meta, así que el
  // rótulo debe crecer con ella: si no, el cajón queda anunciando «3 de 2».
  const metaCajon = (id: CarpetaId) => Math.max(META[id], guardados[id].length);

  const etiquetaCajon = (c: Carpeta) =>
    `Cajón ${c.etiqueta}: ${guardados[c.id].length} de ${metaCajon(c.id)} archivos`;

  const teclas: TeclaAtajo[] = [
    { id: 'ctrl', etiqueta: 'Ctrl', encendida: !ctrl && paso !== 'listo', sostenida: ctrl },
    { id: 'c', etiqueta: 'C', encendida: ctrl && paso === 'copiar', sostenida: false },
    { id: 'v', etiqueta: 'V', encendida: ctrl && paso === 'pegar', sostenida: false },
  ];

  const pistaTeclado =
    paso === 'copiar'
      ? 'Copia la foto del experimento: mantén Ctrl y toca C.'
      : paso === 'pegar'
        ? 'Pégala en el cajón de Escuela: mantén Ctrl y toca V.'
        : '¡Atajo dominado!';

  const consigna =
    fase === 'clasificar'
      ? 'Toma cada archivo y guárdalo en el cajón de su carpeta.'
      : 'Copia la foto del experimento y pégala también en Escuela.';

  const escena = (
    <>
      {/* Colgada de la pared del fondo, sobre los archiveros: a esta z la cartela
          se proyecta ~92 px por unidad de mundo, así que 3.0 la sacaba por el
          borde superior del lienzo y le cortaba la primera línea. */}
      <Consigna3D titulo="Carpetas y atajos" texto={consigna} position={[0, MOSTRADOR_Y + 2.3, -1.9]} />
      {CARPETAS.map((c, i) => (
        <ArchiveroCajon3D
          key={c.id}
          position={[(i - 1) * 2.0, MOSTRADOR_Y, -1.2]}
          etiqueta={c.etiqueta}
          icono={c.icono}
          contenido={guardados[c.id].map((a) => ({ emoji: a.emoji, nombre: a.nombre }))}
          meta={metaCajon(c.id)}
          estado={estadoCajon(c.id)}
          ariaLabel={etiquetaCajon(c)}
          onClick={() => guardarEn(c.id)}
          onSoltar={(id) => guardarEn(c.id, id)}
          disabled={terminado || fase === 'atajo'}
          reduceMotion={reduceMotion}
        />
      ))}

      {fase === 'clasificar' && (
        <CanastaArchivos3D position={[0, MOSTRADOR_Y + 0.1, 1.7]}>
          <div className="archivero3d-canasta">
            {pendientes.map((a) => (
              <FichaTomable3D
                key={a.id}
                id={a.id}
                className={`archivero3d-archivo${elegido === a.id ? ' archivero3d-archivo--elegido' : ''}`}
                ariaLabel={`Archivo: ${a.nombre}`}
                disabled={terminado}
                onElegir={() => tomarArchivo(a.id)}
              >
                <span className="archivero3d-archivo-emoji" aria-hidden>
                  {a.emoji}
                </span>
                <span className="archivero3d-archivo-nombre">{a.nombre}</span>
              </FichaTomable3D>
            ))}
          </div>
        </CanastaArchivos3D>
      )}

      {fase === 'atajo' && !terminado && (
        <TecladoAtajo3D
          position={[0, MOSTRADOR_Y + 0.1, 1.7]}
          teclas={teclas}
          pista={pistaTeclado}
          onTecla={(id) => presionarTecla(id)}
          disabled={terminado}
        />
      )}
    </>
  );

  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">{consigna}</p>
      {fase === 'clasificar' && (
        <div className="archivero3d-canasta">
          {pendientes.map((a) => (
            <FichaTomable3D
              key={a.id}
              id={a.id}
              className={`archivero3d-archivo${elegido === a.id ? ' archivero3d-archivo--elegido' : ''}`}
              ariaLabel={`Archivo: ${a.nombre}`}
              disabled={terminado}
              onElegir={() => tomarArchivo(a.id)}
            >
              <span className="archivero3d-archivo-emoji" aria-hidden>
                {a.emoji}
              </span>
              <span className="archivero3d-archivo-nombre">{a.nombre}</span>
            </FichaTomable3D>
          ))}
        </div>
      )}
      <div className="escena3d-respaldo-fila">
        {CARPETAS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`archivero3d-cajon archivero3d-cajon--${estadoCajon(c.id)}`}
            aria-label={etiquetaCajon(c)}
            disabled={terminado || fase === 'atajo'}
            onClick={() => guardarEn(c.id)}
          >
            <span className="archivero3d-cajon-titulo">
              <span className="archivero3d-cajon-icono" aria-hidden>
                {c.icono}
              </span>
              {c.etiqueta}
            </span>
            <span className="archivero3d-cajon-conteo">
              {guardados[c.id].length} de {metaCajon(c.id)}
            </span>
          </button>
        ))}
      </div>
      {fase === 'atajo' && !terminado && (
        <div className="atajo3d-teclado">
          <div className="atajo3d-teclas">
            {teclas.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`atajo3d-tecla${t.encendida ? ' atajo3d-tecla--encendida' : ''}${
                  t.sostenida ? ' atajo3d-tecla--sostenida' : ''
                }`}
                aria-label={`Tecla ${t.etiqueta}`}
                aria-pressed={t.sostenida}
                onClick={() => presionarTecla(t.id)}
              >
                {t.etiqueta}
              </button>
            ))}
          </div>
          <p className="atajo3d-pista">{pistaTeclado}</p>
        </div>
      )}
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="Carpetas y atajos"
      pasoEtiqueta="Paso"
      pasoActual={Math.min(pasosHechos + (terminado ? 0 : 1), TOTAL_PASOS)}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Archivos"
      marcadorValor={`${guardadosTotales}/${ARCHIVOS.length}`}
      bit={linea}
      paleta={{ acento: '#F5A524', acento2: '#22D3EE' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={<p className="gabinete-nota">Sala de las piezas · cada archivo en su cajón y un truco para ir más rápido</p>}
      final={
        terminado
          ? {
              insigniaNombre: 'Maestro del orden',
              insigniaEmoji: '🗂️',
              titulo: '¡Archivero ordenado!',
              detalle: 'Guardaste seis archivos en sus carpetas y usaste el atajo Ctrl + C y Ctrl + V.',
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
      {aviso && <AvisoRonda3D texto={aviso} clave={aviso} />}
    </ArcadeSala3D>
  );
}

export default LabCarpetasYAtajos;
