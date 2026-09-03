'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { Consigna3D, ObjetoFlotante3D, PedestalBoton3D, type EstadoPieza } from '../../arcade3d/piezas3d';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';

/**
 * «Safari de dispositivos» (N2·U1, parada 1) — La pared de siluetas, en WebGL 3D.
 *
 * R1 «¿Qué dispositivo es?»: la silueta llega como objeto flotante (❓ + pista) y
 * el alumno elige el NOMBRE correcto entre tres pedestales del mostrador. Las
 * teclas muestran una silueta neutra (⬛), nunca el emoji real, para que el reto
 * siga siendo leer la pista. Al acertar se revela el dispositivo y avanza.
 * R2 «Clasifica por tamaño»: cada dispositivo flota de uno en uno y el alumno
 * toca la repisa física correcta (Grande/Mediano/Pequeño). Líneas de Bit y datos
 * verbatim del documento maestro.
 */

const LINEAS = {
  inicio: '¡Bienvenido a mi pared de siluetas! Toma los binoculares y adivina qué dispositivo se esconde.',
  acertada: '¡Ese es! Buen ojo de explorador.',
  fallada: 'Mmm, esa pista no encaja. Vuelve a mirar bien.',
  ronda2: 'Ahora ayúdame a acomodar el taller: ¿grande, mediano o pequeño?',
  repisaMal: 'Casi… mide ese dispositivo otra vez con los ojos.',
  completar: '¡Safari completado! Ya reconoces los dispositivos que te rodean.',
} as const;

type DispositivoId = 'computadora' | 'tablet' | 'celular' | 'televisor' | 'impresora' | 'aspiradora';
type TamanoId = 'grande' | 'mediano' | 'pequeno';

const DISPOSITIVOS: Record<DispositivoId, { nombre: string; emoji: string; tamano: TamanoId }> = {
  computadora: { nombre: 'Computadora', emoji: '💻', tamano: 'mediano' },
  tablet: { nombre: 'Tablet', emoji: '📱', tamano: 'pequeno' },
  celular: { nombre: 'Celular', emoji: '📲', tamano: 'pequeno' },
  televisor: { nombre: 'Televisor', emoji: '📺', tamano: 'grande' },
  impresora: { nombre: 'Impresora', emoji: '🖨️', tamano: 'grande' },
  aspiradora: { nombre: 'Robot aspiradora', emoji: '🤖', tamano: 'mediano' },
};

interface Pista {
  id: DispositivoId;
  pista: string;
  opciones: DispositivoId[];
}

/** R1: seis siluetas de la pared, en el orden en que se revelan. */
const PISTAS: Pista[] = [
  {
    id: 'computadora',
    pista: 'Su sombra tiene una pantalla parada sobre un teclado; te ayuda a escribir, jugar y aprender.',
    opciones: ['computadora', 'televisor', 'tablet'],
  },
  {
    id: 'tablet',
    pista: 'Su silueta es una pantalla plana y delgada que cabe entre tus manos, sin teclado pegado.',
    opciones: ['tablet', 'celular', 'computadora'],
  },
  {
    id: 'celular',
    pista: 'Su sombra es pequeñita, cabe en un bolsillo y sirve para llamar, jugar y tomar fotos.',
    opciones: ['celular', 'tablet', 'aspiradora'],
  },
  {
    id: 'televisor',
    pista: 'Su silueta es una pantalla enorme colgada en la pared que solo te muestra cosas; tú no le hablas de vuelta.',
    opciones: ['televisor', 'computadora', 'impresora'],
  },
  {
    id: 'impresora',
    pista: 'Su sombra tiene una ranura por donde salen hojas de papel con lo que dibujaste en la compu.',
    opciones: ['impresora', 'televisor', 'aspiradora'],
  },
  {
    id: 'aspiradora',
    pista: 'Su silueta es redonda y bajita, y se mueve solita por el piso sin que nadie la empuje.',
    opciones: ['aspiradora', 'celular', 'tablet'],
  },
];

const REPISAS: { id: TamanoId; titulo: string }[] = [
  { id: 'grande', titulo: 'Grande' },
  { id: 'mediano', titulo: 'Mediano' },
  { id: 'pequeno', titulo: 'Pequeño' },
];

/** Metáfora de tamaño en las repisas (cuadros de mayor a menor). */
const EMOJI_TAMANO: Record<TamanoId, string> = { grande: '⬛', mediano: '◼️', pequeno: '▪️' };

/** R2: orden fijo en que los dispositivos flotan para clasificarse. */
const ORDEN_R2: DispositivoId[] = ['computadora', 'tablet', 'celular', 'televisor', 'impresora', 'aspiradora'];

const TOTAL_DISPOSITIVOS = Object.keys(DISPOSITIVOS).length;

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabSafariDeDispositivos(props: ActivityProps & { alSalir?: () => void }) {
  const [ronda, setRonda] = useState<0 | 1>(0);

  // Ronda 1 — pistas de silueta.
  const [idxPista, setIdxPista] = useState(0);
  const [revelado, setRevelado] = useState(false);
  const [mal, setMal] = useState<DispositivoId | null>(null);

  // Ronda 2 — repisas por tamaño (toque, uno a la vez).
  const [colocIdx, setColocIdx] = useState(0);
  const [animo, setAnimo] = useState<{ id: TamanoId; tipo: 'celebra' | 'no' } | null>(null);
  const [saliendoR2, setSaliendoR2] = useState(false);

  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, aviso, ronda, idxPista, colocIdx });

  // Sync de refs FUERA del render (react-hooks/refs): nunca escribir refs en el
  // cuerpo del componente ni leer `.current` en JSX.
  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, aviso, ronda, idxPista, colocIdx };
  });
  useEffect(() => {
    sim.current.inicio = Date.now();
  }, []);

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

  const terminar = (tiempoSegundos: number) => {
    const s = sim.current;
    reproducirTono('complete');
    hablar(LINEAS.completar);
    const score = puntaje();
    propsRef.current.onScore(score);
    propsRef.current.onComplete({ score, stars: 3, xp: score, errores: s.errores, tiempoSegundos });
    setTiempoFinal(tiempoSegundos);
    setErroresFinal(s.errores);
    setTerminado(true);
  };

  const errar = () => {
    const s = sim.current;
    reproducirTono('error');
    s.errores += 1;
    propsRef.current.onScore(puntaje());
  };

  /** Fin de R1 → se abren las tres repisas por tamaño. */
  const cambiarRonda = () => {
    const s = sim.current;
    s.ocupado = true;
    reproducirTono('save');
    hablar(LINEAS.ronda2);
    propsRef.current.onProgress(0.5);
    setAviso('Ronda 2 · Clasifica por tamaño');
    timers.despues(() => {
      if (vivo.current.terminado) return;
      setRonda(1);
      setColocIdx(0);
      setSaliendoR2(false);
      setAnimo(null);
      setAviso(null);
      s.ocupado = false;
    }, 1600);
  };

  const alElegirOpcion = (opcion: DispositivoId) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 0) return;
    const pistaAct = PISTAS[v.idxPista];
    if (opcion === pistaAct.id) {
      s.ocupado = true;
      reproducirTono('correct');
      hablar(LINEAS.acertada, { una: true });
      setRevelado(true);
      timers.despues(() => {
        if (vivo.current.terminado) return;
        s.ocupado = false;
        setRevelado(false);
        if (v.idxPista + 1 < PISTAS.length) {
          setIdxPista(v.idxPista + 1);
        } else {
          cambiarRonda();
        }
      }, 950);
    } else {
      errar();
      hablar(LINEAS.fallada);
      setMal(opcion);
      timers.despues(() => setMal((m) => (m === opcion ? null : m)), 460);
    }
  };

  const alClasificar = (destino: TamanoId) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 1) return;
    const actual = ORDEN_R2[v.colocIdx];
    if (!actual) return;
    if (DISPOSITIVOS[actual].tamano === destino) {
      s.ocupado = true;
      reproducirTono('correct');
      setAnimo({ id: destino, tipo: 'celebra' });
      setSaliendoR2(true);
      const sigIdx = v.colocIdx + 1;
      if (sigIdx === TOTAL_DISPOSITIVOS) {
        propsRef.current.onProgress(1);
        timers.despues(() => {
          if (vivo.current.terminado) return;
          terminar(Math.round((Date.now() - sim.current.inicio) / 1000));
        }, 1400);
      } else {
        timers.despues(() => {
          if (vivo.current.terminado) return;
          setColocIdx(sigIdx);
          setSaliendoR2(false);
          setAnimo((an) => (an?.id === destino && an.tipo === 'celebra' ? null : an));
          s.ocupado = false;
        }, 700);
      }
    } else {
      errar();
      hablar(LINEAS.repisaMal);
      setAnimo({ id: destino, tipo: 'no' });
      timers.despues(() => setAnimo((an) => (an?.id === destino && an.tipo === 'no' ? null : an)), 460);
    }
  };

  const repetir = () => {
    const s = sim.current;
    s.ocupado = false;
    s.errores = 0;
    s.inicio = Date.now();
    setRonda(0);
    setIdxPista(0);
    setRevelado(false);
    setMal(null);
    setColocIdx(0);
    setAnimo(null);
    setSaliendoR2(false);
    setAviso(null);
    setTerminado(false);
    setTiempoFinal(0);
    setErroresFinal(0);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const pistaAct = PISTAS[idxPista];
  const actual = ronda === 1 ? ORDEN_R2[colocIdx] : undefined;

  const marcador =
    ronda === 0
      ? { etiqueta: 'Pistas', valor: `${idxPista + 1}/${PISTAS.length}` }
      : { etiqueta: 'Repisas', valor: `${terminado ? TOTAL_DISPOSITIVOS : colocIdx}/${TOTAL_DISPOSITIVOS}` };

  const consigna =
    ronda === 0
      ? { titulo: '¿Qué dispositivo es?', texto: 'Mira la pista de la silueta y elige el nombre correcto.' }
      : { titulo: 'Clasifica por tamaño', texto: 'Toca la repisa correcta para cada dispositivo: grande, mediano o pequeño.' };

  const bloqueado = terminado || !!aviso;

  const estadoRepisa = (id: TamanoId): EstadoPieza => {
    if (animo?.id === id) return animo.tipo === 'no' ? 'mal' : 'ok';
    return 'activo';
  };

  // ── Escena 3D ──
  const escena =
    ronda === 0 ? (
      <>
        {/* La pista es texto largo: subimos la consigna para que no choque. */}
        <Consigna3D titulo={consigna.titulo} texto={consigna.texto} position={[0, MOSTRADOR_Y + 2.2, -0.2]} />
        <ObjetoFlotante3D
          key={`r1-${idxPista}-${revelado ? 'rev' : 'pista'}`}
          emoji={revelado ? DISPOSITIVOS[pistaAct.id].emoji : '❓'}
          nombre={revelado ? DISPOSITIVOS[pistaAct.id].nombre : pistaAct.pista}
          position={[0, MOSTRADOR_Y + 1.32, 0.1]}
          saliendo={revelado}
          reduceMotion={reduceMotion}
          color="#0B3B2E"
        />
        {!revelado &&
          pistaAct.opciones.map((op, i) => (
            <PedestalBoton3D
              key={op}
              position={[(i - 1) * 1.7, MOSTRADOR_Y, 0.45]}
              estado={mal === op ? 'mal' : 'activo'}
              emoji="⬛"
              etiqueta={DISPOSITIVOS[op].nombre}
              ariaLabel={`Nombre: ${DISPOSITIVOS[op].nombre.toLowerCase()}`}
              onClick={() => alElegirOpcion(op)}
              disabled={bloqueado || revelado}
              reduceMotion={reduceMotion}
              ancho={1.35}
            />
          ))}
      </>
    ) : (
      <>
        <Consigna3D titulo={consigna.titulo} texto={consigna.texto} />
        {actual && (
          <ObjetoFlotante3D
            key={`r2-${colocIdx}`}
            emoji={DISPOSITIVOS[actual].emoji}
            nombre={DISPOSITIVOS[actual].nombre}
            position={[0, MOSTRADOR_Y + 1.45, 0.1]}
            saliendo={saliendoR2}
            reduceMotion={reduceMotion}
          />
        )}
        {REPISAS.map((r, i) => (
          <PedestalBoton3D
            key={r.id}
            position={[(i - 1) * 1.7, MOSTRADOR_Y, 0.45]}
            estado={estadoRepisa(r.id)}
            emoji={EMOJI_TAMANO[r.id]}
            etiqueta={r.titulo}
            ariaLabel={`Repisa ${r.titulo.toLowerCase()}`}
            onClick={() => alClasificar(r.id)}
            disabled={bloqueado || saliendoR2}
            reduceMotion={reduceMotion}
            ancho={1.35}
          />
        ))}
      </>
    );

  // ── Respaldo HTML (sin WebGL): mismos botones y aria-labels ──
  const respaldo =
    ronda === 0 ? (
      <div className="safari-tablero">
        <div className="pasos-consigna">
          <strong>{consigna.titulo}</strong>
          <span>{consigna.texto}</span>
        </div>
        <div className="pista-visor" aria-label="Visor de la pared de siluetas">
          <div className={`pista-visor-icono${revelado ? ' revelado' : ''}`} aria-hidden>
            {revelado ? DISPOSITIVOS[pistaAct.id].emoji : '❓'}
          </div>
          <p className="pista-visor-texto">{revelado ? DISPOSITIVOS[pistaAct.id].nombre : pistaAct.pista}</p>
          {!revelado && (
            <div className="safari-opciones" role="group" aria-label="Opciones de nombre">
              {pistaAct.opciones.map((op) => (
                <button
                  key={op}
                  type="button"
                  className={`safari-opcion${mal === op ? ' mal' : ''}`}
                  onClick={() => alElegirOpcion(op)}
                  disabled={bloqueado || revelado}
                  aria-label={`Nombre: ${DISPOSITIVOS[op].nombre.toLowerCase()}`}
                >
                  {DISPOSITIVOS[op].nombre}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    ) : (
      <div className="safari-tablero">
        <div className="pasos-consigna">
          <strong>{consigna.titulo}</strong>
          <span>{consigna.texto}</span>
        </div>
        <div className="safari-actual" aria-label="Dispositivo por clasificar">
          {actual ? (
            <>
              <span className="safari-actual-emoji" aria-hidden>
                {DISPOSITIVOS[actual].emoji}
              </span>
              <span className="safari-actual-nombre">{DISPOSITIVOS[actual].nombre}</span>
            </>
          ) : (
            <span aria-hidden>·</span>
          )}
        </div>
        <div className="safari-repisas" aria-label="Repisas por tamaño">
          {REPISAS.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`safari-repisa-boton${animo?.id === r.id ? ` ${animo.tipo}` : ''}`}
              onClick={() => alClasificar(r.id)}
              disabled={bloqueado || saliendoR2}
              aria-label={`Repisa ${r.titulo.toLowerCase()}`}
            >
              <span className="safari-repisa-emoji" aria-hidden>
                {EMOJI_TAMANO[r.id]}
              </span>
              <span className="safari-repisa-titulo">{r.titulo}</span>
            </button>
          ))}
        </div>
      </div>
    );

  return (
    <ArcadeSala3D
      titulo="Safari de dispositivos"
      pasoEtiqueta="Ronda"
      pasoActual={ronda + 1}
      pasosTotal={2}
      marcadorEtiqueta={marcador.etiqueta}
      marcadorValor={marcador.valor}
      bit={linea}
      paleta={{ acento: '#34D399', acento2: '#F5A524' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Ojo de explorador',
              insigniaEmoji: '🔭',
              titulo: '¡Safari completado!',
              detalle: 'Reconociste los dispositivos que te rodean y los acomodaste por tamaño en el taller de Bit.',
              resumen: [
                { etiqueta: 'Dispositivos', valor: `${TOTAL_DISPOSITIVOS}` },
                { etiqueta: 'Errores', valor: `${erroresFinal}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
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

export default LabSafariDeDispositivos;
