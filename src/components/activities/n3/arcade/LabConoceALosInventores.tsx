'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { Consigna3D } from '../../arcade3d/piezas3d';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { FichaTomable3D, type EstadoExhibicion } from './museoN3';
import { AtrilAportes3D, RetratoMarco3D } from './piezasN3U1';

/**
 * N3·U1 · Parada 3 «Conoce a los inventores» (documento §16.3).
 *
 * Exhibición dedicada: cuatro retratos colgados en la pared de la galería, cada
 * uno con su marco iluminado y su cartela; abajo, un atril con las tarjetas de
 * aporte desordenadas. Emparejar aporte ↔ persona ilumina el marco y fija la
 * tarjeta bajo el cuadro.
 */

const LINEAS = {
  inicio: '¡Bienvenido a mi galería! Aquí conocerás a quienes imaginaron las computadoras.',
  acierto: '¡Ese es su aporte! Buen emparejamiento.',
  error: 'Mmm, esa persona hizo otra cosa. Lee de nuevo su aporte.',
  ada: 'Ada escribió las primeras instrucciones: ¡la primera programadora!',
  grace: 'Grace hizo que las máquinas entendieran palabras, no solo números.',
  completar: '¡Galería completa! Ya conoces a las personas detrás de las computadoras.',
};

interface Inventor {
  id: string;
  nombre: string;
  emoji: string;
  /** El aporte correcto, tal como lo enuncia el documento §16.3. */
  aporte: string;
  /** Lo que Bit lee si el alumno toca el retrato. */
  pista: string;
}

const INVENTORES: Inventor[] = [
  {
    id: 'babbage',
    nombre: 'Babbage',
    emoji: '👨‍🔧',
    aporte: 'diseñó una gran máquina de calcular con engranes',
    pista: 'Él es Charles Babbage. Pista: soñó una gran máquina llena de engranes que hacía cuentas.',
  },
  {
    id: 'lovelace',
    nombre: 'Ada Lovelace',
    emoji: '👩‍💻',
    aporte: 'escribió las primeras instrucciones (primera programadora)',
    pista: 'Ella es Ada Lovelace. Pista: escribió las primeras instrucciones para que una máquina trabajara paso a paso.',
  },
  {
    id: 'turing',
    nombre: 'Alan Turing',
    emoji: '👨‍🔬',
    aporte: 'imaginó una máquina para resolver muchos problemas',
    pista: 'Él es Alan Turing. Pista: imaginó una sola máquina capaz de resolver muchísimos problemas distintos.',
  },
  {
    id: 'hopper',
    nombre: 'Grace Hopper',
    emoji: '👩‍✈️',
    aporte: 'hizo que las compus entendieran palabras',
    pista: 'Ella es Grace Hopper. Pista: quiso que las máquinas entendieran palabras, no solo números.',
  },
];

/** Iconos del atril, uno por tarjeta de aporte. */
const ICONO_TARJETA: Record<string, string> = {
  babbage: '⚙️',
  lovelace: '📜',
  turing: '🧠',
  hopper: '💬',
};

/** Orden de las tarjetas en el atril: desordenado respecto a los retratos. */
const ATRIL = ['turing', 'babbage', 'hopper', 'lovelace'];

const TOTAL = INVENTORES.length;

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabConoceALosInventores(props: ActivityProps & { alSalir?: () => void }) {
  const [emparejados, setEmparejados] = useState<string[]>([]);
  const [elegida, setElegida] = useState<string | null>(null);
  const [marcoMal, setMarcoMal] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, emparejados, elegida });

  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, emparejados, elegida };
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

  /** Tocar una tarjeta del atril la toma en la mano. */
  const tomarTarjeta = (id: string) => {
    if (vivo.current.terminado || sim.current.ocupado) return;
    if (vivo.current.emparejados.includes(id)) return;
    reproducirTono('select');
    setElegida(id);
  };

  /** Tocar un retrato: si hay tarjeta en la mano empareja; si no, Bit da la pista. */
  const tocarRetrato = (inventor: Inventor, idExplicito?: string) => {
    if (vivo.current.terminado || sim.current.ocupado) return;
    if (vivo.current.emparejados.includes(inventor.id)) return;

    const tarjeta = idExplicito ?? vivo.current.elegida;
    if (!tarjeta) {
      reproducirTono('select');
      hablar(inventor.pista);
      return;
    }
    if (vivo.current.emparejados.includes(tarjeta)) return;

    if (tarjeta !== inventor.id) {
      reproducirTono('error');
      sim.current.errores += 1;
      propsRef.current.onScore(puntaje());
      setMarcoMal(inventor.id);
      setElegida(null);
      hablar(LINEAS.error);
      timers.despues(() => setMarcoMal(null), 460);
      return;
    }

    reproducirTono('correct');
    const listos = [...vivo.current.emparejados, inventor.id];
    setEmparejados(listos);
    setElegida(null);
    propsRef.current.onScore(puntaje());
    propsRef.current.onProgress(listos.length / TOTAL);

    if (inventor.id === 'lovelace') hablar(LINEAS.ada);
    else if (inventor.id === 'hopper') hablar(LINEAS.grace);
    else hablar(LINEAS.acierto);

    if (listos.length === TOTAL) {
      sim.current.ocupado = true;
      reproducirTono('save');
      setAviso('¡Galería completa!');
      // eslint-disable-next-line react-hooks/purity -- cronómetro de la partida, dentro del manejador del clic, nunca durante render
      const tiempoSegundos = Math.round((Date.now() - sim.current.inicio) / 1000);
      timers.despues(() => {
        setAviso(null);
        sim.current.ocupado = false;
        terminar(tiempoSegundos);
      }, 1500);
    }
  };

  const repetir = () => {
    sim.current.errores = 0;
    sim.current.ocupado = false;
    sim.current.inicio = Date.now();
    setEmparejados([]);
    setElegida(null);
    setMarcoMal(null);
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const estadoMarco = (inventor: Inventor): EstadoExhibicion => {
    if (marcoMal === inventor.id) return 'mal';
    if (emparejados.includes(inventor.id)) return 'ok';
    if (elegida) return 'listo';
    return 'espera';
  };

  const etiquetaMarco = (inventor: Inventor) =>
    emparejados.includes(inventor.id)
      ? `${inventor.nombre}: ${inventor.aporte}`
      : `Retrato de ${inventor.nombre}. Sin aporte todavía`;

  const tarjetas = ATRIL.map((id) => INVENTORES.find((i) => i.id === id) as Inventor);

  const escena = (
    <>
      <Consigna3D
        titulo="La galería de los inventores"
        texto="Lleva cada tarjeta de aporte al retrato de quien lo hizo."
        position={[0, MOSTRADOR_Y + 2.62, -1.9]}
      />
      {INVENTORES.map((inv, i) => (
        <RetratoMarco3D
          key={inv.id}
          position={[-2.25 + i * 1.5, MOSTRADOR_Y + 1.4, -1.75]}
          nombre={inv.nombre}
          emoji={inv.emoji}
          aporte={emparejados.includes(inv.id) ? inv.aporte : null}
          estado={estadoMarco(inv)}
          ariaLabel={etiquetaMarco(inv)}
          onClick={() => tocarRetrato(inv)}
          onSoltar={(id) => tocarRetrato(inv, id)}
          disabled={terminado || emparejados.includes(inv.id)}
          reduceMotion={reduceMotion}
        />
      ))}
      <AtrilAportes3D position={[0, MOSTRADOR_Y, 1.35]}>
        <div className="galeria3d-atril">
          {tarjetas.map((inv) => (
            <FichaTomable3D
              key={inv.id}
              id={inv.id}
              className={`galeria3d-tarjeta${elegida === inv.id ? ' galeria3d-tarjeta--elegida' : ''}${
                emparejados.includes(inv.id) ? ' galeria3d-tarjeta--usada' : ''
              }`}
              ariaLabel={`Aporte: ${inv.aporte}`}
              disabled={terminado || emparejados.includes(inv.id)}
              onElegir={() => tomarTarjeta(inv.id)}
            >
              <span className="galeria3d-tarjeta-icono" aria-hidden>
                {ICONO_TARJETA[inv.id]}
              </span>
              <span className="galeria3d-tarjeta-texto">{inv.aporte}</span>
            </FichaTomable3D>
          ))}
        </div>
      </AtrilAportes3D>
    </>
  );

  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">Lleva cada tarjeta de aporte al retrato de quien lo hizo.</p>
      <div className="escena3d-respaldo-fila">
        {INVENTORES.map((inv) => (
          <button
            key={inv.id}
            type="button"
            className={`galeria3d-cartela galeria3d-cartela--${estadoMarco(inv)}`}
            aria-label={etiquetaMarco(inv)}
            disabled={terminado || emparejados.includes(inv.id)}
            onClick={() => tocarRetrato(inv)}
          >
            <span className="galeria3d-cartela-nombre">{inv.nombre}</span>
            <span className="galeria3d-cartela-aporte">
              {emparejados.includes(inv.id) ? inv.aporte : 'Sin aporte todavía'}
            </span>
          </button>
        ))}
      </div>
      <div className="escena3d-respaldo-fila">
        {tarjetas.map((inv) => (
          <button
            key={inv.id}
            type="button"
            className={`galeria3d-tarjeta${elegida === inv.id ? ' galeria3d-tarjeta--elegida' : ''}${
              emparejados.includes(inv.id) ? ' galeria3d-tarjeta--usada' : ''
            }`}
            aria-label={`Aporte: ${inv.aporte}`}
            disabled={terminado || emparejados.includes(inv.id)}
            onClick={() => tomarTarjeta(inv.id)}
          >
            <span className="galeria3d-tarjeta-icono" aria-hidden>
              {ICONO_TARJETA[inv.id]}
            </span>
            <span className="galeria3d-tarjeta-texto">{inv.aporte}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="Conoce a los inventores"
      pasoEtiqueta="Aporte"
      pasoActual={Math.min(emparejados.length + (terminado ? 0 : 1), TOTAL)}
      pasosTotal={TOTAL}
      marcadorEtiqueta="Aportes"
      marcadorValor={`${emparejados.length}/${TOTAL}`}
      bit={linea}
      paleta={{ acento: '#F5A524', acento2: '#22D3EE' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={<p className="gabinete-nota">Galería de los inventores · toca un retrato para escuchar su pista</p>}
      final={
        terminado
          ? {
              insigniaNombre: 'Conocedor de inventores',
              insigniaEmoji: '👩‍🔬',
              titulo: '¡Galería completa!',
              detalle:
                'Emparejaste a Babbage, Ada Lovelace, Alan Turing y Grace Hopper con su aporte: las computadoras las imaginaron personas.',
              resumen: [
                { etiqueta: 'Retratos', valor: `${TOTAL}` },
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

export default LabConoceALosInventores;
