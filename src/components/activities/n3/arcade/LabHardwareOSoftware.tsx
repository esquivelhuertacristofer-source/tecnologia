'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { Consigna3D } from '../../arcade3d/piezas3d';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { type EstadoExhibicion } from './museoN3';
import { BandejaMundo3D, MESA_ALTO, MesaDosMundos3D, ObjetoEnMesa3D, REPISA_ALTO, REPISA_Z } from './piezasN3U2';

/**
 * N3·U2 · Parada 1 «¿Hardware o software?» (documento §17.1).
 *
 * Aparato dedicado: la mesa de dos mundos, partida por una ranura luminosa, con
 * una bandeja honda a cada lado rotulada en su propio canto —«Hardware · se
 * toca» y «Software · se ejecuta»—. Los ocho objetos llegan de uno en uno a la
 * peana central; tocarlos hace que Bit repita la pregunta guía en vez de dar la
 * respuesta, y el canto de la bandeja es donde se sueltan.
 */

const LINEAS = {
  inicio: 'En esta mesa hay dos mundos: lo que se toca y lo que solo vive en la pantalla. ¿Los separamos?',
  acierto: '¡Exacto! Eso va en su bandeja correcta.',
  error: 'Mmm… ¿esto se puede tocar o solo se ejecuta en la pantalla? Piénsalo otra vez.',
  hardware: 'El teclado sí se toca: es hardware, el cuerpo de la máquina.',
  software: 'Un juego no se toca: es software, algo que la máquina sabe hacer.',
  completar: '¡Mesa ordenada! Ya distingues el cuerpo de la mente de una computadora.',
};

type MundoId = 'hardware' | 'software';

interface Bandeja {
  id: MundoId;
  etiqueta: string;
  regla: string;
  icono: string;
}

const BANDEJAS: Bandeja[] = [
  { id: 'hardware', etiqueta: 'Hardware', regla: 'se toca', icono: '🖐️' },
  { id: 'software', etiqueta: 'Software', regla: 'se ejecuta', icono: '✨' },
];

interface Objeto {
  id: string;
  nombre: string;
  emoji: string;
  mundo: MundoId;
  /** Pregunta guía que Bit repite si el alumno toca el objeto (§17.1). */
  pregunta: string;
}

/** Los ocho objetos del documento, alternando mundo para que no se adivine. */
const OBJETOS: Objeto[] = [
  {
    id: 'teclado',
    nombre: 'El teclado',
    emoji: '⌨️',
    mundo: 'hardware',
    pregunta: '¿Esto se toca o se ejecuta? Imagina el teclado en tus manos: ¿lo puedes cargar?',
  },
  {
    id: 'juego',
    nombre: 'Un juego',
    emoji: '👾',
    mundo: 'software',
    pregunta: '¿Esto se toca o se ejecuta? El juego aparece en la pantalla… ¿lo puedes agarrar?',
  },
  {
    id: 'pantalla',
    nombre: 'La pantalla',
    emoji: '🖥️',
    mundo: 'hardware',
    pregunta: '¿Esto se toca o se ejecuta? La pantalla pesa y se limpia con un trapito. ¿Qué será?',
  },
  {
    id: 'navegador',
    nombre: 'Un navegador',
    emoji: '🌐',
    mundo: 'software',
    pregunta: '¿Esto se toca o se ejecuta? El navegador se abre para ver páginas. ¿Lo puedes tocar?',
  },
  {
    id: 'bocinas',
    nombre: 'Las bocinas',
    emoji: '🔊',
    mundo: 'hardware',
    pregunta: '¿Esto se toca o se ejecuta? Las bocinas se conectan con un cable de verdad. ¿Y entonces?',
  },
  {
    id: 'editor',
    nombre: 'Un editor de dibujo',
    emoji: '🎨',
    mundo: 'software',
    pregunta: '¿Esto se toca o se ejecuta? El editor de dibujo se abre para pintar. ¿Pesa algo?',
  },
  {
    id: 'cerebro',
    nombre: 'El «cerebro» (procesador)',
    emoji: '🧠',
    mundo: 'hardware',
    pregunta: '¿Esto se toca o se ejecuta? El procesador es una piecita que va adentro de la máquina.',
  },
  {
    id: 'sistema',
    nombre: 'El sistema operativo',
    emoji: '🪟',
    mundo: 'software',
    pregunta: '¿Esto se toca o se ejecuta? El sistema operativo manda a toda la compu, pero no lo puedes tomar.',
  },
];

const TOTAL = OBJETOS.length;
const META_BANDEJA = TOTAL / 2;

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabHardwareOSoftware(props: ActivityProps & { alSalir?: () => void }) {
  const [idx, setIdx] = useState(0);
  const [separados, setSeparados] = useState<Record<MundoId, string[]>>({ hardware: [], software: [] });
  const [bandejaMal, setBandejaMal] = useState<MundoId | null>(null);
  const [saliendo, setSaliendo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0, dichoHardware: false, dichoSoftware: false });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, idx });

  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, idx };
  });

  useEffect(() => {
    sim.current.inicio = Date.now();
  }, []);

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

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

  const mirarObjeto = () => {
    if (vivo.current.terminado || sim.current.ocupado) return;
    reproducirTono('select');
    hablar(OBJETOS[vivo.current.idx].pregunta);
  };

  const separar = (destino: MundoId, idExplicito?: string) => {
    if (vivo.current.terminado || sim.current.ocupado) return;
    const objeto = OBJETOS[vivo.current.idx];
    if (idExplicito && idExplicito !== objeto.id) return;

    if (objeto.mundo !== destino) {
      reproducirTono('error');
      sim.current.errores += 1;
      propsRef.current.onScore(puntaje());
      setBandejaMal(destino);
      hablar(LINEAS.error);
      timers.despues(() => setBandejaMal(null), 460);
      return;
    }

    sim.current.ocupado = true;
    reproducirTono('correct');
    setSaliendo(true);
    setSeparados((prev) => ({ ...prev, [destino]: [...prev[destino], objeto.id] }));
    propsRef.current.onScore(puntaje());

    const hechos = vivo.current.idx + 1;
    propsRef.current.onProgress(hechos / TOTAL);

    // La regla de cada mundo se explica una sola vez; después basta el acierto.
    if (destino === 'hardware' && !sim.current.dichoHardware) {
      sim.current.dichoHardware = true;
      hablar(LINEAS.hardware);
    } else if (destino === 'software' && !sim.current.dichoSoftware) {
      sim.current.dichoSoftware = true;
      hablar(LINEAS.software);
    } else {
      hablar(LINEAS.acierto);
    }

    if (hechos === TOTAL) {
      reproducirTono('save');
      setAviso('¡Mesa ordenada!');
      // eslint-disable-next-line react-hooks/purity -- cronómetro de la partida, dentro del manejador del clic, nunca durante render
      const tiempoSegundos = Math.round((Date.now() - sim.current.inicio) / 1000);
      timers.despues(() => {
        setAviso(null);
        sim.current.ocupado = false;
        terminar(tiempoSegundos);
      }, 1500);
      return;
    }

    timers.despues(() => {
      setIdx(hechos);
      setSaliendo(false);
      sim.current.ocupado = false;
    }, 520);
  };

  const repetir = () => {
    timers.limpiar();
    sim.current.errores = 0;
    sim.current.ocupado = false;
    sim.current.inicio = Date.now();
    sim.current.dichoHardware = false;
    sim.current.dichoSoftware = false;
    setIdx(0);
    setSeparados({ hardware: [], software: [] });
    setBandejaMal(null);
    setSaliendo(false);
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const objeto = OBJETOS[Math.min(idx, TOTAL - 1)];
  const hechos = separados.hardware.length + separados.software.length;

  const estadoBandeja = (id: MundoId): EstadoExhibicion => {
    if (bandejaMal === id) return 'mal';
    if (separados[id].length === META_BANDEJA) return 'ok';
    if (!terminado && !saliendo) return 'listo';
    return 'espera';
  };

  const contenidoBandeja = (id: MundoId) =>
    separados[id].map((oid) => {
      const o = OBJETOS.find((x) => x.id === oid) as Objeto;
      return { emoji: o.emoji, nombre: o.nombre };
    });

  const etiquetaBandeja = (b: Bandeja) =>
    `Bandeja de ${b.etiqueta}, ${b.regla}: ${separados[b.id].length} de ${META_BANDEJA} objetos`;

  const escena = (
    <>
      <Consigna3D
        titulo="La mesa de las piezas"
        texto="Deja cada cosa en su bandeja: lo que se toca o lo que se ejecuta."
        position={[0, MOSTRADOR_Y + 2.6, -1.4]}
      />
      <MesaDosMundos3D position={[0, MOSTRADOR_Y, -0.75]} />
      {BANDEJAS.map((b, i) => (
        <BandejaMundo3D
          key={b.id}
          // Sobre la repisa alta y retranqueadas: sus rótulos quedan por encima
          // del objeto que espera al frente, sin que un panel tape al otro.
          position={[i === 0 ? -1.35 : 1.35, MOSTRADOR_Y + MESA_ALTO + REPISA_ALTO, -0.75 + REPISA_Z]}
          etiqueta={b.etiqueta}
          regla={b.regla}
          icono={b.icono}
          contenido={contenidoBandeja(b.id)}
          estado={estadoBandeja(b.id)}
          ariaLabel={etiquetaBandeja(b)}
          onClick={() => separar(b.id)}
          onSoltar={(id) => separar(b.id, id)}
          disabled={terminado || saliendo}
          reduceMotion={reduceMotion}
        />
      ))}
      {!terminado && (
        <ObjetoEnMesa3D
          key={objeto.id}
          position={[0, MOSTRADOR_Y + 0.45, 1.75]}
          id={objeto.id}
          emoji={objeto.emoji}
          nombre={objeto.nombre}
          ariaLabel={`Objeto: ${objeto.nombre}. Tócalo si necesitas la pregunta de Bit`}
          onElegir={mirarObjeto}
          saliendo={saliendo}
          reduceMotion={reduceMotion}
        />
      )}
    </>
  );

  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">Deja cada cosa en su bandeja: lo que se toca o lo que se ejecuta.</p>
      {!terminado && (
        <button
          type="button"
          className="mundos3d-objeto"
          aria-label={`Objeto: ${objeto.nombre}. Tócalo si necesitas la pregunta de Bit`}
          onClick={mirarObjeto}
        >
          <span className="mundos3d-objeto-emoji" aria-hidden>
            {objeto.emoji}
          </span>
          <span className="mundos3d-objeto-nombre">{objeto.nombre}</span>
        </button>
      )}
      <div className="escena3d-respaldo-fila">
        {BANDEJAS.map((b) => (
          <button
            key={b.id}
            type="button"
            className={`mundos3d-canto mundos3d-canto--${estadoBandeja(b.id)}`}
            aria-label={etiquetaBandeja(b)}
            disabled={terminado || saliendo}
            onClick={() => separar(b.id)}
          >
            <span className="mundos3d-canto-icono" aria-hidden>
              {b.icono}
            </span>
            <span className="mundos3d-canto-texto">
              <strong>{b.etiqueta}</strong>
              <em>{b.regla}</em>
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="¿Hardware o software?"
      pasoEtiqueta="Objeto"
      pasoActual={Math.min(hechos + (terminado ? 0 : 1), TOTAL)}
      pasosTotal={TOTAL}
      marcadorEtiqueta="Objetos"
      marcadorValor={`${hechos}/${TOTAL}`}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={<p className="gabinete-nota">Sala de las piezas · el cuerpo que se toca y la mente que se ejecuta</p>}
      final={
        terminado
          ? {
              insigniaNombre: 'Separador de mundos',
              insigniaEmoji: '🧩',
              titulo: '¡Mesa ordenada!',
              detalle: 'Separaste ocho cosas entre lo que se toca y lo que se ejecuta: hardware y software.',
              resumen: [
                { etiqueta: 'Objetos', valor: `${TOTAL}` },
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

export default LabHardwareOSoftware;
