'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import {
  Consigna3D,
  ObjetoFlotante3D,
  PedestalBoton3D,
  RejillaTiles3D,
  type EstadoPieza,
  type EstadoTile,
  type Tile3D,
} from '../../arcade3d/piezas3d';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';

/**
 * «¿Con quién sí hablo en línea?» (N2·U6, parada 2) — La centralita de contactos,
 * ahora en WebGL 3D real.
 *
 * R1 «Conecta con tu gente»: galería 3D de 8 retratos (6 de confianza + 2 que no
 * se conectan solos) montada sobre un bastidor del gabinete. R2 «Alto y aviso»:
 * la situación llega como objeto flotante y el alumno decide entre la clavija de
 * CONECTAR o el domo de AYUDA, dos pedestales físicos del mostrador. Tres fallos
 * seguidos activan una pista. Líneas de Bit verbatim del documento (§14.2).
 */

const LINEAS = {
  inicio: '¡Bienvenido a mi centralita! Aquí conectamos solo con quien sí conocemos.',
  conexionSegura: '¡Conexión segura! Ese contacto sí es tu gente.',
  errorDesconocido: 'Mmm, a esa ventanita no la conoces en persona. Mejor no conectar solo.',
  altoAviso: '¡Bien hecho! Alto… y aviso a mi adulto de confianza.',
  pistaFallos: 'Piensa: ¿lo conoces de verdad, fuera de la pantalla?',
  completar: '¡Centralita dominada! Ya sabes con quién sí hablar en línea.',
} as const;

type PersonaId = 'mama' | 'papa' | 'abuela' | 'amigoSalon' | 'maestra' | 'prima' | 'sinFoto' | 'premioGratis';

/** R1 — «Conecta con tu gente»: 6 confiables + 2 que no se conectan solos. */
const PERSONAS: { id: PersonaId; nombre: string; emoji: string; confiable: boolean; motivo?: string }[] = [
  { id: 'mama', nombre: 'Mamá', emoji: '👩', confiable: true },
  { id: 'papa', nombre: 'Papá', emoji: '👨', confiable: true },
  { id: 'sinFoto', nombre: 'Perfil sin foto', emoji: '❓', confiable: false, motivo: 'Ese perfil no tiene cara ni nombre.' },
  { id: 'abuela', nombre: 'Abuela', emoji: '👵', confiable: true },
  { id: 'amigoSalon', nombre: 'Mi amigo del salón', emoji: '🧒', confiable: true },
  { id: 'premioGratis', nombre: '«Premio gratis»', emoji: '🎁', confiable: false, motivo: 'Un premio gratis casi siempre esconde un truco.' },
  { id: 'maestra', nombre: 'Maestra', emoji: '👩‍🏫', confiable: true },
  { id: 'prima', nombre: 'Prima', emoji: '👧', confiable: true },
];

const CONFIABLES = PERSONAS.filter((p) => p.confiable);

/** R2 — «Alto y aviso»: 4 situaciones, cada una con una sola respuesta correcta. */
const SITUACIONES_R2: { emoji: string; texto: string; correcta: 'conectar' | 'ayuda' }[] = [
  { emoji: '📹', texto: 'Un desconocido te pide hacer videollamada.', correcta: 'ayuda' },
  { emoji: '👤', texto: 'Una cuenta sin nombre te invita a jugar.', correcta: 'ayuda' },
  { emoji: '🧒', texto: 'Un compañero de tu salón te invita a jugar en equipo.', correcta: 'conectar' },
  { emoji: '🎁', texto: 'Una cuenta desconocida te ofrece un regalo a cambio de tus datos.', correcta: 'ayuda' },
];

const TOTAL_CONTACTOS = CONFIABLES.length + SITUACIONES_R2.length;

type Opcion = 'conectar' | 'ayuda';

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabConQuienHablo(props: ActivityProps & { alSalir?: () => void }) {
  const [ronda, setRonda] = useState<0 | 1>(0);
  const [conectados, setConectados] = useState<PersonaId[]>([]);
  const [retratoMal, setRetratoMal] = useState<PersonaId | null>(null);
  const [apagados, setApagados] = useState<PersonaId[]>([]);
  const [nota, setNota] = useState<string | null>(null);
  const [situIdx, setSituIdx] = useState(0);
  const [resuelta, setResuelta] = useState(false);
  const [presionado, setPresionado] = useState<Opcion | null>(null);
  const [botonMal, setBotonMal] = useState<Opcion | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, racha: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, aviso, ronda, conectados, situIdx });

  // Sync de refs FUERA del render (react-hooks/refs): nunca escribir refs en el
  // cuerpo del componente ni leer `.current` en JSX.
  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, aviso, ronda, conectados, situIdx };
  });
  useEffect(() => {
    sim.current.inicio = Date.now();
  }, []);

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

  const terminar = () => {
    const s = sim.current;
    reproducirTono('complete');
    hablar(LINEAS.completar);
    const score = puntaje();
    propsRef.current.onScore(score);
    const tiempoSegundos = Math.round((Date.now() - s.inicio) / 1000);
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
    hablar(s.racha > 0 && s.racha % 3 === 0 ? LINEAS.pistaFallos : LINEAS.errorDesconocido);
  };

  /** Fin de R1 → llega la centralita con la clavija y el domo de AYUDA. */
  const cambiarRonda = () => {
    const s = sim.current;
    s.ocupado = true;
    reproducirTono('save');
    propsRef.current.onProgress(0.5);
    setAviso('Ronda 2 · ¡Alto y aviso!');
    timers.despues(() => {
      if (vivo.current.terminado) return;
      setRonda(1);
      setSituIdx(0);
      setResuelta(false);
      setAviso(null);
      s.ocupado = false;
    }, 1600);
  };

  const alTocarRetrato = (id: PersonaId) => {
    const v = vivo.current;
    if (v.terminado || v.aviso || sim.current.ocupado || v.ronda !== 0 || v.conectados.includes(id)) return;
    const persona = PERSONAS.find((p) => p.id === id);
    if (!persona) return;
    if (persona.confiable) {
      sim.current.racha = 0;
      reproducirTono('correct');
      hablar(LINEAS.conexionSegura, { una: true });
      const sig = [...v.conectados, id];
      setConectados(sig);
      setNota(null);
      if (sig.length === CONFIABLES.length) cambiarRonda();
    } else {
      errar();
      setRetratoMal(id);
      setNota(persona.motivo ?? null);
      if (!apagados.includes(id)) setApagados([...apagados, id]);
      timers.despues(() => setRetratoMal((m) => (m === id ? null : m)), 460);
    }
  };

  const responder = (opcion: Opcion) => {
    const v = vivo.current;
    if (v.terminado || v.aviso || sim.current.ocupado || v.ronda !== 1 || resuelta) return;
    const situ = SITUACIONES_R2[v.situIdx];
    if (situ.correcta !== opcion) {
      errar();
      setBotonMal(opcion);
      timers.despues(() => setBotonMal((m) => (m === opcion ? null : m)), 460);
      return;
    }
    sim.current.ocupado = true;
    sim.current.racha = 0;
    reproducirTono('correct');
    hablar(opcion === 'conectar' ? LINEAS.conexionSegura : LINEAS.altoAviso, { una: true });
    setPresionado(opcion);
    setResuelta(true);
    const esUltimo = v.situIdx + 1 >= SITUACIONES_R2.length;
    if (esUltimo) propsRef.current.onProgress(1);
    timers.despues(() => {
      if (vivo.current.terminado) return;
      if (esUltimo) {
        terminar();
      } else {
        setSituIdx(v.situIdx + 1);
        setResuelta(false);
        setPresionado(null);
        sim.current.ocupado = false;
      }
    }, 900);
  };

  const repetir = () => {
    const s = sim.current;
    s.ocupado = false;
    s.errores = 0;
    s.racha = 0;
    s.inicio = Date.now();
    setRonda(0);
    setConectados([]);
    setRetratoMal(null);
    setApagados([]);
    setNota(null);
    setSituIdx(0);
    setResuelta(false);
    setPresionado(null);
    setBotonMal(null);
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
      ? { etiqueta: 'Contactos', valor: `${conectados.length}/${CONFIABLES.length}` }
      : { etiqueta: 'Contactos', valor: `${terminado ? SITUACIONES_R2.length : situIdx}/${SITUACIONES_R2.length}` };
  const consigna =
    ronda === 0
      ? { titulo: 'Conecta con tu gente', texto: 'Toca los retratos de las personas que sí conoces en persona.' }
      : { titulo: '¡Alto y aviso!', texto: 'Lee la situación: ¿conectas con la clavija o presionas AYUDA?' };

  // No leemos `sim.current.ocupado` en render (react-hooks/refs): durante una
  // transición siempre hay `aviso` (R1) o `resuelta` (R2) activos, que ya
  // bloquean la UI. `ocupado` sigue guardando los handlers.
  const bloqueado = terminado || !!aviso;

  const tileEstado = (p: PersonaId): EstadoTile => {
    if (retratoMal === p) return 'mal';
    if (conectados.includes(p)) return 'elegido';
    if (apagados.includes(p)) return 'apagado';
    return 'normal';
  };
  const tiles: Tile3D[] = PERSONAS.map((p) => ({
    id: p.id,
    emoji: p.emoji,
    nombre: p.nombre,
    estado: tileEstado(p.id),
    ariaLabel: `Retrato: ${p.nombre.toLowerCase()}`,
    disabled: conectados.includes(p.id) || bloqueado,
  }));

  const estadoClavija: EstadoPieza = presionado === 'conectar' ? 'ok' : botonMal === 'conectar' ? 'mal' : 'normal';
  const estadoAyuda: EstadoPieza = presionado === 'ayuda' ? 'ok' : botonMal === 'ayuda' ? 'mal' : 'activo';

  // ── Escena 3D ──
  const escena =
    ronda === 0 ? (
      <>
        <Consigna3D titulo={consigna.titulo} texto={consigna.texto} />
        <RejillaTiles3D tiles={tiles} columnas={4} onTile={(id) => alTocarRetrato(id as PersonaId)} />
      </>
    ) : (
      <>
        <Consigna3D titulo={consigna.titulo} texto={consigna.texto} />
        <ObjetoFlotante3D
          key={situIdx}
          emoji={SITUACIONES_R2[situIdx].emoji}
          nombre={SITUACIONES_R2[situIdx].texto}
          saliendo={resuelta}
          reduceMotion={reduceMotion}
        />
        <PedestalBoton3D
          position={[-1.35, MOSTRADOR_Y, 0.45]}
          estado={estadoClavija}
          emoji="🔌"
          etiqueta="Conectar"
          ariaLabel="Conectar clavija"
          onClick={() => responder('conectar')}
          disabled={bloqueado || resuelta}
          reduceMotion={reduceMotion}
        />
        <PedestalBoton3D
          position={[1.35, MOSTRADOR_Y, 0.45]}
          estado={estadoAyuda}
          emoji="🆘"
          etiqueta="Ayuda"
          ariaLabel="Botón de ayuda"
          onClick={() => responder('ayuda')}
          disabled={bloqueado || resuelta}
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
        <div className="galeria-retratos" aria-label="Galería de retratos">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`retrato${conectados.includes(p.id) ? ' elegido' : ''}${apagados.includes(p.id) ? ' apagado' : ''}${retratoMal === p.id ? ' mal' : ''}`}
              onClick={() => alTocarRetrato(p.id)}
              disabled={conectados.includes(p.id)}
              aria-label={`Retrato: ${p.nombre.toLowerCase()}`}
            >
              <span className="retrato-emoji" aria-hidden>
                {p.emoji}
              </span>
              <span className="retrato-nombre">{p.nombre}</span>
            </button>
          ))}
        </div>
        <span className="galeria-nota">{nota ?? ''}</span>
      </div>
    ) : (
      <div className="avisos-tablero">
        <div className="pasos-consigna">
          <strong>{consigna.titulo}</strong>
          <span>{consigna.texto}</span>
        </div>
        <div key={situIdx} className="situacion-rara cambia" aria-label={`Situación ${situIdx + 1} de ${SITUACIONES_R2.length}`}>
          <span className="escena-emoji" aria-hidden>
            {SITUACIONES_R2[situIdx].emoji}
          </span>
          <span className="escena-texto">{SITUACIONES_R2[situIdx].texto}</span>
        </div>
        <div className="centralita-panel" aria-label="Panel de la centralita">
          <button
            type="button"
            className={`centralita-clavija${presionado === 'conectar' ? ' presionada' : ''}${botonMal === 'conectar' ? ' mal' : ''}`}
            onClick={() => responder('conectar')}
            aria-label="Conectar clavija"
          >
            <span className="centralita-clavija-icono" aria-hidden>
              🔌
            </span>
            <span className="centralita-clavija-etiqueta">Conectar</span>
          </button>
          <button
            type="button"
            className={`domo-ayuda${presionado === 'ayuda' ? ' hundido' : ' late'}${botonMal === 'ayuda' ? ' mal' : ''}`}
            onClick={() => responder('ayuda')}
            aria-label="Botón de ayuda"
          >
            <span className="domo-texto">AYUDA</span>
          </button>
        </div>
      </div>
    );

  return (
    <ArcadeSala3D
      titulo="¿Con quién sí hablo en línea?"
      pasoEtiqueta="Ronda"
      pasoActual={ronda + 1}
      pasosTotal={2}
      marcadorEtiqueta={marcador.etiqueta}
      marcadorValor={marcador.valor}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Operador de Confianza',
              insigniaEmoji: '🎧',
              titulo: '¡Centralita dominada!',
              detalle: 'Ya sabes con quién sí hablar en línea y qué hacer cuando aparece un desconocido: alto, y aviso a tu adulto de confianza.',
              resumen: [
                { etiqueta: 'Contactos', valor: `${TOTAL_CONTACTOS}` },
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

export default LabConQuienHablo;
