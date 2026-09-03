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
 * «Héroes del respeto» (N2·U6, parada 3) — El escenario del buen trato, ahora en
 * WebGL 3D real.
 *
 * La escena a resolver llega como objeto flotante sobre el mostrador y las
 * máscaras del buen trato son pedestales físicos del gabinete. R1 «Elige el buen
 * trato»: 6 escenas piden la máscara con la respuesta respetuosa. R2 «El plan del
 * héroe»: 3 situaciones de mal trato se resuelven en orden — palanca de ALTO,
 * máscara de Calma, máscara de Avisar. Tres fallos seguidos activan una pista.
 * Al terminar, Bit nombra al alumno «Ciudadano Digital». Líneas verbatim (§14.3).
 */

const LINEAS = {
  inicio: '¡Bienvenido a mi escenario! Aquí los héroes eligen el buen trato.',
  acertada: '¡Esa es la respuesta de un héroe! Así se trata bien a alguien.',
  fallada: 'Mmm, esa respuesta lastima. ¿Cómo te gustaría que te trataran a ti?',
  planResuelto: '¡Alto, y aviso a mi adulto de confianza! Así se responde al mal trato.',
  pistaFallos: 'Recuerda: detrás de la pantalla hay alguien de verdad.',
  completar: '¡Escenario completo… taller completo! Te nombro Ciudadano Digital.',
} as const;

type MascaraId = 'animar' | 'calma' | 'avisar';

const MASCARAS: { id: MascaraId; nombre: string; emoji: string }[] = [
  { id: 'animar', nombre: 'Animar', emoji: '🤗' },
  { id: 'calma', nombre: 'Calma', emoji: '🗣️' },
  { id: 'avisar', nombre: 'Avisar', emoji: '📢' },
];

/** R1 — «Elige el buen trato»: 6 escenas, cada una con su máscara correcta. */
const ESCENAS_R1: { emoji: string; texto: string; correcta: MascaraId }[] = [
  { emoji: '😢', texto: 'Un compañero pierde en el juego.', correcta: 'animar' },
  { emoji: '😡', texto: 'Alguien te escribe TODO EN MAYÚSCULAS, muy enojado.', correcta: 'calma' },
  { emoji: '🎨', texto: 'Un compañero comparte un dibujo y espera tu opinión.', correcta: 'animar' },
  { emoji: '🤬', texto: 'Llega un mensaje grosero de otro jugador.', correcta: 'avisar' },
  { emoji: '✍️', texto: 'Un compañero se equivoca al escribir una palabra.', correcta: 'animar' },
  { emoji: '🙋', texto: 'Alguien pide ayuda dentro del juego.', correcta: 'calma' },
];

/** R2 — «El plan del héroe»: 3 situaciones de mal trato; el plan es siempre Alto → Calma → Avisar. */
const SITUACIONES_R2: { emoji: string; texto: string }[] = [
  { emoji: '😠', texto: 'Un jugador te insulta porque perdiste una partida.' },
  { emoji: '😠', texto: 'Alguien repite burlas sobre ti cada vez que entras a jugar.' },
  { emoji: '😠', texto: 'Un desconocido te escribe cosas feas para hacerte sentir mal.' },
];

const TOTAL_ESCENAS = ESCENAS_R1.length + SITUACIONES_R2.length;

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabHeroesDelRespeto(props: ActivityProps & { alSalir?: () => void }) {
  const [ronda, setRonda] = useState<0 | 1>(0);
  const [idx, setIdx] = useState(0);
  const [mascaraElegida, setMascaraElegida] = useState<MascaraId | null>(null);
  const [mascaraMal, setMascaraMal] = useState<MascaraId | null>(null);
  const [palancaMal, setPalancaMal] = useState(false);
  const [situIdx, setSituIdx] = useState(0);
  const [pasoIdx, setPasoIdx] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, racha: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, aviso, ronda, idx, situIdx, pasoIdx });

  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, aviso, ronda, idx, situIdx, pasoIdx };
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
    s.racha += 1;
    propsRef.current.onScore(puntaje());
    hablar(s.racha > 0 && s.racha % 3 === 0 ? LINEAS.pistaFallos : LINEAS.fallada);
  };

  /** Fin de R1 → llega el plan del héroe. */
  const cambiarRonda = () => {
    const s = sim.current;
    s.ocupado = true;
    reproducirTono('save');
    propsRef.current.onProgress(0.5);
    setAviso('Ronda 2 · El plan del héroe');
    timers.despues(() => {
      if (vivo.current.terminado) return;
      setRonda(1);
      setSituIdx(0);
      setPasoIdx(0);
      setAviso(null);
      s.ocupado = false;
    }, 1600);
  };

  const alPresionarMascara = (id: MascaraId) => {
    const v = vivo.current;
    if (v.terminado || v.aviso || sim.current.ocupado) return;

    if (v.ronda === 0) {
      const escena = ESCENAS_R1[v.idx];
      if (escena.correcta !== id) {
        errar();
        setMascaraMal(id);
        timers.despues(() => setMascaraMal((m) => (m === id ? null : m)), 460);
        return;
      }
      sim.current.ocupado = true;
      sim.current.racha = 0;
      reproducirTono('correct');
      hablar(LINEAS.acertada, { una: true });
      setMascaraElegida(id);
      const esUltimo = v.idx + 1 >= ESCENAS_R1.length;
      timers.despues(() => {
        if (vivo.current.terminado) return;
        setMascaraElegida(null);
        if (esUltimo) {
          cambiarRonda();
        } else {
          setIdx(v.idx + 1);
          sim.current.ocupado = false;
        }
      }, 700);
      return;
    }

    const necesita: MascaraId | null = v.pasoIdx === 1 ? 'calma' : v.pasoIdx === 2 ? 'avisar' : null;
    if (necesita !== id) {
      errar();
      setMascaraMal(id);
      timers.despues(() => setMascaraMal((m) => (m === id ? null : m)), 460);
      return;
    }

    sim.current.racha = 0;
    if (necesita === 'avisar') {
      sim.current.ocupado = true;
      reproducirTono('correct');
      hablar(LINEAS.planResuelto, { una: true });
      setPasoIdx(3);
      const esUltimaSituacion = v.situIdx + 1 >= SITUACIONES_R2.length;
      if (esUltimaSituacion) propsRef.current.onProgress(1);
      timers.despues(() => {
        if (vivo.current.terminado) return;
        if (esUltimaSituacion) {
          terminar(Math.round((Date.now() - sim.current.inicio) / 1000));
        } else {
          setSituIdx(v.situIdx + 1);
          setPasoIdx(0);
          sim.current.ocupado = false;
        }
      }, 900);
    } else {
      reproducirTono('correct');
      hablar(LINEAS.acertada, { una: true });
      setPasoIdx(2);
    }
  };

  const alPresionarPalanca = () => {
    const v = vivo.current;
    if (v.terminado || v.aviso || sim.current.ocupado || v.ronda !== 1) return;
    if (v.pasoIdx !== 0) {
      errar();
      setPalancaMal(true);
      timers.despues(() => setPalancaMal(false), 460);
      return;
    }
    sim.current.racha = 0;
    reproducirTono('correct');
    hablar(LINEAS.acertada, { una: true });
    setPasoIdx(1);
  };

  const repetir = () => {
    const s = sim.current;
    s.ocupado = false;
    s.errores = 0;
    s.racha = 0;
    s.inicio = Date.now();
    setRonda(0);
    setIdx(0);
    setMascaraElegida(null);
    setMascaraMal(null);
    setPalancaMal(false);
    setSituIdx(0);
    setPasoIdx(0);
    setAviso(null);
    setTerminado(false);
    setTiempoFinal(0);
    setErroresFinal(0);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const marcador =
    ronda === 0
      ? { etiqueta: 'Escenas', valor: `${idx}/${ESCENAS_R1.length}` }
      : { etiqueta: 'Escenas', valor: `${terminado ? SITUACIONES_R2.length : situIdx}/${SITUACIONES_R2.length}` };
  const consigna =
    ronda === 0
      ? { titulo: 'Elige el buen trato', texto: 'Mira la escena y elige la máscara con la respuesta respetuosa.' }
      : { titulo: 'El plan del héroe', texto: 'Sigue el plan en orden: primero ALTO, luego la máscara de Calma y al final Avisar.' };
  const escenaActual = ronda === 0 ? ESCENAS_R1[idx] : SITUACIONES_R2[situIdx];

  const bloqueado = terminado || !!aviso;

  // Estados 3D de las máscaras.
  const estadoMascaraR1 = (id: MascaraId): EstadoPieza =>
    mascaraMal === id ? 'mal' : mascaraElegida === id ? 'ok' : 'activo';
  const estadoPalanca: EstadoPieza = palancaMal ? 'mal' : pasoIdx >= 1 ? 'ok' : 'activo';
  const estadoMascaraR2 = (id: 'calma' | 'avisar'): EstadoPieza => {
    if (mascaraMal === id) return 'mal';
    const lista = id === 'calma' ? pasoIdx >= 2 : pasoIdx >= 3;
    const disponible = id === 'calma' ? pasoIdx >= 1 : pasoIdx >= 2;
    if (lista) return 'ok';
    return disponible ? 'activo' : 'inerte';
  };

  // ── Escena 3D ──
  const escena =
    ronda === 0 ? (
      <>
        <Consigna3D titulo={consigna.titulo} texto={consigna.texto} />
        <ObjetoFlotante3D
          key={`r1-${idx}`}
          emoji={escenaActual.emoji}
          nombre={escenaActual.texto}
          saliendo={mascaraElegida !== null}
          reduceMotion={reduceMotion}
        />
        {MASCARAS.map((m, i) => (
          <PedestalBoton3D
            key={m.id}
            position={[(i - 1) * 1.6, MOSTRADOR_Y, 0.45]}
            estado={estadoMascaraR1(m.id)}
            emoji={m.emoji}
            etiqueta={m.nombre}
            ariaLabel={`Máscara: ${m.nombre.toLowerCase()}`}
            onClick={() => alPresionarMascara(m.id)}
            disabled={bloqueado}
            reduceMotion={reduceMotion}
          />
        ))}
      </>
    ) : (
      <>
        <Consigna3D titulo={consigna.titulo} texto={consigna.texto} />
        <ObjetoFlotante3D
          key={`r2-${situIdx}`}
          emoji={escenaActual.emoji}
          nombre={escenaActual.texto}
          saliendo={pasoIdx >= 3}
          reduceMotion={reduceMotion}
        />
        <PedestalBoton3D
          position={[-1.6, MOSTRADOR_Y, 0.45]}
          estado={estadoPalanca}
          emoji="🛑"
          etiqueta="Alto"
          ariaLabel="Palanca de alto"
          onClick={alPresionarPalanca}
          disabled={bloqueado}
          reduceMotion={reduceMotion}
        />
        <PedestalBoton3D
          position={[0, MOSTRADOR_Y, 0.45]}
          estado={estadoMascaraR2('calma')}
          emoji="🗣️"
          etiqueta="Calma"
          ariaLabel="Máscara: calma"
          onClick={() => alPresionarMascara('calma')}
          disabled={bloqueado}
          reduceMotion={reduceMotion}
        />
        <PedestalBoton3D
          position={[1.6, MOSTRADOR_Y, 0.45]}
          estado={estadoMascaraR2('avisar')}
          emoji="📢"
          etiqueta="Avisar"
          ariaLabel="Máscara: avisar"
          onClick={() => alPresionarMascara('avisar')}
          disabled={bloqueado}
          reduceMotion={reduceMotion}
        />
      </>
    );

  // ── Respaldo HTML (sin WebGL): mismos botones y aria-labels ──
  const respaldo =
    ronda === 0 ? (
      <div className="avisos-tablero">
        <div className="pasos-consigna">
          <strong>{consigna.titulo}</strong>
          <span>{consigna.texto}</span>
        </div>
        <div className="escena-avisos">
          <div key={`r1-${idx}`} className="telon-escena">
            <span className="telon-escena-emoji" aria-hidden>
              {escenaActual.emoji}
            </span>
            <span className="telon-escena-texto">{escenaActual.texto}</span>
          </div>
        </div>
        <div className="mascaras-fila" aria-label="Máscaras del buen trato">
          {MASCARAS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`mascara-boton${mascaraElegida === m.id ? ' elegida' : ''}${mascaraMal === m.id ? ' mal' : ''}`}
              onClick={() => alPresionarMascara(m.id)}
              aria-label={`Máscara: ${m.nombre.toLowerCase()}`}
            >
              <span className="mascara-boton-emoji" aria-hidden>
                {m.emoji}
              </span>
              <span className="mascara-boton-nombre">{m.nombre}</span>
            </button>
          ))}
        </div>
      </div>
    ) : (
      <div className="avisos-tablero">
        <div className="pasos-consigna">
          <strong>{consigna.titulo}</strong>
          <span>{consigna.texto}</span>
        </div>
        <div className="escena-avisos">
          <div key={`r2-${situIdx}`} className="telon-escena">
            <span className="telon-escena-emoji" aria-hidden>
              {escenaActual.emoji}
            </span>
            <span className="telon-escena-texto">{escenaActual.texto}</span>
          </div>
        </div>
        <div className="mascaras-fila" aria-label="Panel del plan del héroe">
          <button
            type="button"
            className={`telon-palanca${pasoIdx >= 1 ? ' presionada' : ''}${palancaMal ? ' mal' : ''}`}
            onClick={alPresionarPalanca}
            aria-label="Palanca de alto"
          >
            <span className="centralita-clavija-icono" aria-hidden>
              🛑
            </span>
            <span className="centralita-clavija-etiqueta">Alto</span>
          </button>
          {MASCARAS.filter((m) => m.id !== 'animar').map((m) => {
            const lista = m.id === 'calma' ? pasoIdx >= 2 : pasoIdx >= 3;
            const disponible = m.id === 'calma' ? pasoIdx >= 1 : pasoIdx >= 2;
            return (
              <button
                key={m.id}
                type="button"
                className={`mascara-boton${lista ? ' elegida' : ''}${mascaraMal === m.id ? ' mal' : ''}${disponible ? '' : ' apagada'}`}
                onClick={() => alPresionarMascara(m.id)}
                aria-label={`Máscara: ${m.nombre.toLowerCase()}`}
              >
                <span className="mascara-boton-emoji" aria-hidden>
                  {m.emoji}
                </span>
                <span className="mascara-boton-nombre">{m.nombre}</span>
              </button>
            );
          })}
        </div>
      </div>
    );

  return (
    <ArcadeSala3D
      titulo="Héroes del respeto"
      pasoEtiqueta="Ronda"
      pasoActual={ronda + 1}
      pasosTotal={2}
      marcadorEtiqueta={marcador.etiqueta}
      marcadorValor={marcador.valor}
      bit={linea}
      paleta={{ acento: '#F472B6', acento2: '#F5A524' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Héroe del Respeto',
              insigniaEmoji: '🦸',
              titulo: '¡Escenario completo, taller completo!',
              detalle:
                'Elegiste el buen trato en cada escena y respondiste al mal trato con el plan del héroe: alto, calma y aviso. El taller de Bit queda completo. ¡Te nombro Ciudadano Digital!',
              resumen: [
                { etiqueta: 'Escenas', valor: `${TOTAL_ESCENAS}` },
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

export default LabHeroesDelRespeto;
