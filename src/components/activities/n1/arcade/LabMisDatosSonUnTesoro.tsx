'use client';

import { CSSProperties, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../mision/audio';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { ArcadeSala, AvisoRonda, useBit } from './ArcadeSala';

/**
 * «Mis datos son un tesoro» (N1·U5, parada 3) — El cofre de los tesoros.
 *
 * La pantalla CRT muestra las situaciones; en la base del gabinete viven
 * el cofre físico — abre y cierra con bisagra y glow — junto a la bandeja
 * de compartir, y la cerradura con botonera de símbolos (regla
 * anti-genérico, §6).
 * R1 «¿Tesoro o para compartir?»: 8 fichas se arrastran al cofre o a la
 * bandeja; cada tesoro entra al cofre con destello.
 * R2 «La llave secreta»: repetir la secuencia de 3 símbolos que propone
 * la cerradura y decidir quién puede conocer la llave tocando retratos.
 * R3 «¡Que no te lo saquen!»: 3 situaciones piden un tesoro; el dato se
 * arrastra al cofre y en la última además se presiona el botón de AVISO.
 * Al ganar, el cofre se cierra con glow y Bit nombra al alumno guardián
 * del salón — cierre del nivel.
 * Líneas de Bit verbatim del documento (§6.3).
 */

const LINEAS = {
  inicio: '¡Llegaste al cofre de los tesoros! Aquí guardamos lo que dice quién eres.',
  primerTesoro: '¡Al cofre! Ese dato dice dónde encontrarte… mejor guardado.',
  primerCompartible: '¡Eso sí se comparte! Tus dibujos y tus gustos no dicen dónde vives.',
  llaveForjada: '¡Tu llave secreta está lista! Solo tú y tus papás la conocen.',
  errorSituacion: 'Mmm… eso que te piden es un tesoro. ¡Al cofre, y aviso a mi adulto!',
  completar: '¡El cofre está a salvo! Salón completo… te nombro guardián de mi salón. ¡Lo lograste todo!',
} as const;

type FichaId =
  | 'direccion'
  | 'telefono'
  | 'foto'
  | 'contrasena'
  | 'escuela'
  | 'color'
  | 'dibujo'
  | 'juego';

/** R1: las ocho fichas — cinco tesoros y tres cosas para compartir (§6.3.4). */
const FICHAS: Record<FichaId, { nombre: string; emoji: string; tesoro: boolean }> = {
  direccion: { nombre: 'Dirección', emoji: '🏠', tesoro: true },
  telefono: { nombre: 'Teléfono', emoji: '📱', tesoro: true },
  foto: { nombre: 'Foto', emoji: '📷', tesoro: true },
  contrasena: { nombre: 'Contraseña', emoji: '🔑', tesoro: true },
  escuela: { nombre: 'Mi escuela', emoji: '🏫', tesoro: true },
  color: { nombre: 'Color favorito', emoji: '🎨', tesoro: false },
  dibujo: { nombre: 'Dibujo', emoji: '🖍️', tesoro: false },
  juego: { nombre: 'Juego preferido', emoji: '🎮', tesoro: false },
};

/** Orden revuelto fijo con el que las fichas aparecen en la pantalla. */
const FICHAS_REVUELTAS: FichaId[] = [
  'foto',
  'color',
  'direccion',
  'dibujo',
  'contrasena',
  'juego',
  'telefono',
  'escuela',
];

/** R2: la botonera de símbolos de la cerradura y la secuencia propuesta. */
const SIMBOLOS = ['⭐', '🌙', '🔔', '💎'];
const SECUENCIA = [3, 0, 1];

type RetratoLlaveId = 'mama' | 'papa' | 'desconocido' | 'amigo';

/** R2: quién puede conocer la llave secreta (§6.3.4). */
const RETRATOS_LLAVE: { id: RetratoLlaveId; nombre: string; emoji: string; puede: boolean }[] = [
  { id: 'mama', nombre: 'Mamá', emoji: '👩', puede: true },
  { id: 'papa', nombre: 'Papá', emoji: '👨', puede: true },
  { id: 'desconocido', nombre: 'Desconocido', emoji: '🕵️', puede: false },
  { id: 'amigo', nombre: 'Amigo del juego', emoji: '🎮', puede: false },
];

/** R3: las tres situaciones que intentan sacar un tesoro (§6.3.4). */
const SITUACIONES: { emoji: string; texto: string; dato: FichaId }[] = [
  { emoji: '🎁', texto: 'Un juego ofrece un premio a cambio de tu dirección.', dato: 'direccion' },
  { emoji: '💬', texto: 'Alguien en un chat pide tu foto.', dato: 'foto' },
  { emoji: '🪟', texto: 'Una ventana pide tu contraseña «para ayudarte».', dato: 'contrasena' },
];

interface Arrastre {
  id: FichaId;
  x0: number;
  y0: number;
  x: number;
  y: number;
}

export function LabMisDatosSonUnTesoro(props: ActivityProps & { alSalir?: () => void }) {
  const [ronda, setRonda] = useState(0);
  const [clasificadas, setClasificadas] = useState<Partial<Record<FichaId, 'cofre' | 'bandeja'>>>({});
  const [destelloCofre, setDestelloCofre] = useState(false);
  const [malZona, setMalZona] = useState<'cofre' | 'bandeja' | null>(null);
  const [rebote, setRebote] = useState<FichaId | null>(null);
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const [faseLlave, setFaseLlave] = useState<'muestra' | 'repite' | 'quien'>('muestra');
  const [teclaBrilla, setTeclaBrilla] = useState<number | null>(null);
  const [teclaMal, setTeclaMal] = useState<number | null>(null);
  const [llavePaso, setLlavePaso] = useState(0);
  const [elegidasLlave, setElegidasLlave] = useState<RetratoLlaveId[]>([]);
  const [apagadasLlave, setApagadasLlave] = useState<RetratoLlaveId[]>([]);
  const [retratoMal, setRetratoMal] = useState<RetratoLlaveId | null>(null);
  const [situIdx, setSituIdx] = useState(0);
  const [datoGuardado, setDatoGuardado] = useState(false);
  const [avisoListo, setAvisoListo] = useState(false);
  const [domoHundido, setDomoHundido] = useState(false);
  const [domoMal, setDomoMal] = useState(false);
  const [cofreCerrado, setCofreCerrado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);

  const { linea, hablar } = useBit(LINEAS.inicio);

  const timers = useTemporizadores();
  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);
  propsRef.current = props;
  const vivo = useRef({
    terminado,
    aviso,
    arrastre,
    ronda,
    clasificadas,
    faseLlave,
    llavePaso,
    elegidasLlave,
    apagadasLlave,
    situIdx,
    datoGuardado,
    avisoListo,
  });
  vivo.current = {
    terminado,
    aviso,
    arrastre,
    ronda,
    clasificadas,
    faseLlave,
    llavePaso,
    elegidasLlave,
    apagadasLlave,
    situIdx,
    datoGuardado,
    avisoListo,
  };
  const cofreRef = useRef<HTMLDivElement | null>(null);
  const bandejaRef = useRef<HTMLDivElement | null>(null);

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
    // eslint-disable-next-line react-hooks/purity -- terminar solo corre desde pasos del alumno, nunca durante render
    const tiempoSegundos = Math.round((Date.now() - s.inicio) / 1000);
    propsRef.current.onComplete({ score, stars: 3, xp: score, errores: s.errores, tiempoSegundos });
    setTerminado(true);
  };

  const errar = () => {
    const s = sim.current;
    reproducirTono('error');
    s.errores += 1;
    propsRef.current.onScore(puntaje());
  };

  /** La cerradura propone la secuencia: las teclas brillan una por una. */
  const mostrarSecuencia = () => {
    const s = sim.current;
    s.ocupado = true;
    SECUENCIA.forEach((tecla, i) => {
      timers.despues(() => {
        if (vivo.current.terminado) return;
        reproducirTono('select');
        setTeclaBrilla(tecla);
        timers.despues(() => setTeclaBrilla(null), 450);
      }, 600 + i * 700);
    });
    timers.despues(() => {
      if (vivo.current.terminado) return;
      setFaseLlave('repite');
      s.ocupado = false;
    }, 600 + SECUENCIA.length * 700);
  };

  /** Fin de R1 → llega la cerradura; fin de R2 → vuelven cofre y bandeja. */
  const cambiarRonda = (nueva: 1 | 2) => {
    const s = sim.current;
    s.ocupado = true;
    reproducirTono('save');
    propsRef.current.onProgress(nueva / 3);
    setAviso(nueva === 1 ? 'Ronda 2 · La llave secreta' : 'Ronda 3 · ¡Que no te lo saquen!');
    timers.despues(() => {
      if (vivo.current.terminado) return;
      setRonda(nueva);
      setFaseLlave('muestra');
      setTeclaBrilla(null);
      setTeclaMal(null);
      setLlavePaso(0);
      setSituIdx(0);
      setDatoGuardado(false);
      setAviso(null);
      s.ocupado = false;
      if (nueva === 1) {
        mostrarSecuencia();
      }
    }, 1600);
  };

  const alAgarrar = (e: ReactPointerEvent<HTMLButtonElement>, id: FichaId) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado) return;
    if (v.ronda === 0 && v.clasificadas[id] !== undefined) return;
    if (v.ronda === 2 && v.datoGuardado) return;
    if (v.ronda === 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setArrastre({ id, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY });
  };

  const alMover = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const x = e.clientX;
    const y = e.clientY;
    setArrastre((a) => (a ? { ...a, x, y } : a));
  };

  const zonaEn = (x: number, y: number): 'cofre' | 'bandeja' | null => {
    const dentro = (el: HTMLDivElement | null) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    };
    if (dentro(cofreRef.current)) return 'cofre';
    if (dentro(bandejaRef.current)) return 'bandeja';
    return null;
  };

  const alSoltar = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const a = vivo.current.arrastre;
    if (!a) return;
    setArrastre(null);
    const v = vivo.current;
    const s = sim.current;
    const zona = zonaEn(e.clientX, e.clientY);
    if (!zona) return;
    if (v.ronda === 0) {
      const correcto = FICHAS[a.id].tesoro ? zona === 'cofre' : zona === 'bandeja';
      if (correcto) {
        reproducirTono('correct');
        if (FICHAS[a.id].tesoro) {
          hablar(LINEAS.primerTesoro, { una: true });
          setDestelloCofre(true);
          timers.despues(() => setDestelloCofre(false), 460);
        } else {
          hablar(LINEAS.primerCompartible, { una: true });
        }
        const sig = { ...v.clasificadas, [a.id]: zona };
        setClasificadas(sig);
        if (Object.keys(sig).length === FICHAS_REVUELTAS.length) {
          cambiarRonda(1);
        }
      } else {
        errar();
        setMalZona(zona);
        setRebote(a.id);
        timers.despues(() => {
          setMalZona((m) => (m === zona ? null : m));
          setRebote((r) => (r === a.id ? null : r));
        }, 460);
      }
      return;
    }
    if (v.ronda === 2) {
      if (zona === 'cofre') {
        reproducirTono('correct');
        setDestelloCofre(true);
        timers.despues(() => setDestelloCofre(false), 460);
        setDatoGuardado(true);
        if (v.situIdx < SITUACIONES.length - 1) {
          s.ocupado = true;
          timers.despues(() => {
            if (vivo.current.terminado) return;
            setSituIdx(v.situIdx + 1);
            setDatoGuardado(false);
            s.ocupado = false;
          }, 950);
        } else {
          setAvisoListo(true);
        }
      } else {
        errar();
        hablar(LINEAS.errorSituacion);
        setMalZona('bandeja');
        setRebote(a.id);
        timers.despues(() => {
          setMalZona((m) => (m === 'bandeja' ? null : m));
          setRebote((r) => (r === a.id ? null : r));
        }, 460);
      }
    }
  };

  const alTecla = (idx: number) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 1 || v.faseLlave !== 'repite') return;
    if (idx === SECUENCIA[v.llavePaso]) {
      reproducirTono('correct');
      setTeclaBrilla(idx);
      timers.despues(() => setTeclaBrilla(null), 300);
      const sig = v.llavePaso + 1;
      setLlavePaso(sig);
      if (sig === SECUENCIA.length) {
        s.ocupado = true;
        hablar(LINEAS.llaveForjada);
        timers.despues(() => {
          if (vivo.current.terminado) return;
          setFaseLlave('quien');
          s.ocupado = false;
        }, 2200);
      }
    } else {
      errar();
      setTeclaMal(idx);
      setLlavePaso(0);
      timers.despues(() => {
        setTeclaMal((m) => (m === idx ? null : m));
      }, 460);
    }
  };

  const alRetratoLlave = (id: RetratoLlaveId) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 1 || v.faseLlave !== 'quien') return;
    if (v.elegidasLlave.includes(id)) return;
    const retrato = RETRATOS_LLAVE.find((r) => r.id === id);
    if (!retrato) return;
    if (retrato.puede) {
      reproducirTono('correct');
      const sig = [...v.elegidasLlave, id];
      setElegidasLlave(sig);
      if (sig.length === RETRATOS_LLAVE.filter((r) => r.puede).length) {
        cambiarRonda(2);
      }
    } else {
      errar();
      setRetratoMal(id);
      if (!v.apagadasLlave.includes(id)) setApagadasLlave([...v.apagadasLlave, id]);
      timers.despues(() => {
        setRetratoMal((m) => (m === id ? null : m));
      }, 460);
    }
  };

  const alPresionarAviso = () => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 2 || v.situIdx !== SITUACIONES.length - 1) return;
    if (!v.avisoListo) {
      errar();
      setDomoMal(true);
      timers.despues(() => setDomoMal(false), 460);
      return;
    }
    s.ocupado = true;
    reproducirTono('correct');
    setDomoHundido(true);
    setCofreCerrado(true);
    propsRef.current.onProgress(1);
    timers.despues(() => {
      if (vivo.current.terminado) return;
      terminar();
    }, 1600);
  };

  const repetir = () => {
    const s = sim.current;
    s.ocupado = false;
    s.errores = 0;
    s.inicio = Date.now();
    setRonda(0);
    setClasificadas({});
    setDestelloCofre(false);
    setMalZona(null);
    setRebote(null);
    setArrastre(null);
    setFaseLlave('muestra');
    setTeclaBrilla(null);
    setTeclaMal(null);
    setLlavePaso(0);
    setElegidasLlave([]);
    setApagadasLlave([]);
    setRetratoMal(null);
    setSituIdx(0);
    setDatoGuardado(false);
    setAvisoListo(false);
    setDomoHundido(false);
    setDomoMal(false);
    setCofreCerrado(false);
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const dibujarFicha = (id: FichaId, fija: boolean) => {
    const enArrastre = arrastre?.id === id;
    const estilo: CSSProperties = {};
    if (enArrastre && arrastre) {
      estilo.transform = `translate(${arrastre.x - arrastre.x0}px, ${arrastre.y - arrastre.y0}px) scale(1.08)`;
    }
    return (
      <button
        key={id}
        type="button"
        className={`herr-chip${enArrastre ? ' arrastrando' : ''}${rebote === id ? ' rebote' : ''}${fija ? ' fija' : ''}`}
        style={estilo}
        disabled={fija}
        onPointerDown={(e) => alAgarrar(e, id)}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={() => setArrastre(null)}
        aria-label={`Ficha: ${FICHAS[id].nombre.toLowerCase()}`}
      >
        <span className="herr-emoji" aria-hidden>
          {FICHAS[id].emoji}
        </span>
        <span className="herr-nombre">{FICHAS[id].nombre}</span>
      </button>
    );
  };

  const enCofre = (Object.keys(clasificadas) as FichaId[]).filter((f) => clasificadas[f] === 'cofre').length + (ronda === 2 ? situIdx + (datoGuardado ? 1 : 0) : 0);
  const enBandeja = (Object.keys(clasificadas) as FichaId[]).filter((f) => clasificadas[f] === 'bandeja');
  const situacion = SITUACIONES[Math.min(situIdx, SITUACIONES.length - 1)];

  const dibujarCofreYBandeja = () => (
    <div className="zona-cofre" aria-label="Cofre y bandeja de compartir">
      <div
        className={`cofre-fisico${cofreCerrado ? ' cerrado' : ' abierto'}${destelloCofre ? ' destello' : ''}${malZona === 'cofre' ? ' mal' : ''}`}
        ref={cofreRef}
        aria-label={`Cofre de los tesoros con ${enCofre} tesoros`}
      >
        <span className="cofre-tapa" aria-hidden />
        <span className="cofre-cuerpo" aria-hidden>
          <span className="cofre-conteo">💎 × {enCofre}</span>
        </span>
        <span className="cofre-etiqueta">Cofre</span>
      </div>
      <div
        className={`bandeja-compartir${malZona === 'bandeja' ? ' mal' : ''}`}
        ref={bandejaRef}
        aria-label={`Bandeja de compartir con ${enBandeja.length} fichas`}
      >
        <span className="bandeja-fichas" aria-hidden>
          {enBandeja.length > 0 ? enBandeja.map((f) => (
            <span key={f} className="mini-emoji">
              {FICHAS[f].emoji}
            </span>
          )) : (
            <span className="hueco-momento">· · ·</span>
          )}
        </span>
        <span className="bandeja-etiqueta">Para compartir</span>
      </div>
      {ronda === 2 && situIdx === SITUACIONES.length - 1 && (
        <button
          type="button"
          className={`domo-ayuda${domoHundido ? ' hundido' : avisoListo ? ' late' : ''}${domoMal ? ' mal' : ''}`}
          onClick={alPresionarAviso}
          aria-label="Botón de aviso"
        >
          <span className="domo-texto">AVISO</span>
        </button>
      )}
    </div>
  );

  const marcador =
    ronda === 0
      ? { etiqueta: 'Fichas', valor: `${Object.keys(clasificadas).length}/8` }
      : ronda === 1
        ? faseLlave === 'quien'
          ? { etiqueta: 'Retratos', valor: `${elegidasLlave.length}/2` }
          : { etiqueta: 'Llave', valor: `${llavePaso}/3` }
        : { etiqueta: 'Tesoros', valor: `${Math.min(situIdx + (datoGuardado ? 1 : 0), 3)}/3` };

  const consigna =
    ronda === 0
      ? {
          titulo: '¿Tesoro o para compartir?',
          texto: 'Arrastra cada ficha al cofre si es un tesoro, o a la bandeja si se puede compartir.',
        }
      : ronda === 1
        ? faseLlave === 'quien'
          ? { titulo: '¿Quién puede conocerla?', texto: 'Toca solo a quienes pueden conocer tu llave secreta.' }
          : { titulo: 'La llave secreta', texto: 'Mira la secuencia de la cerradura y repítela en la botonera.' }
        : {
            titulo: '¡Que no te lo saquen!',
            texto: 'Te piden un tesoro: arrástralo al cofre. En la última, presiona también AVISO.',
          };

  return (
    <ArcadeSala
      titulo="Mis datos son un tesoro"
      pasoEtiqueta="Ronda"
      pasoActual={ronda + 1}
      pasosTotal={3}
      marcadorEtiqueta={marcador.etiqueta}
      marcadorValor={marcador.valor}
      bit={linea}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Guardián del tesoro',
              insigniaEmoji: '💎',
              titulo: '¡El cofre está a salvo!',
              detalle:
                'Guardaste cada tesoro, forjaste tu llave secreta y no dejaste que te sacaran ni un dato. Bit te nombra guardián de su salón: completaste el nivel.',
              resumen: [
                { etiqueta: 'Fichas', valor: '8' },
                { etiqueta: 'Situaciones', valor: '3' },
                { etiqueta: 'Puntaje', valor: `${puntaje()}%` },
              ],
              alRepetir: repetir,
            }
          : null
      }
      base={
        ronda === 1 ? (
          faseLlave === 'quien' ? (
            <>
              <span className="gabinete-nota">Retratos de la cerradura</span>
              <div className="repisa-equipo" aria-label="Retratos de la cerradura">
                {RETRATOS_LLAVE.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`chip-equipo${elegidasLlave.includes(r.id) ? ' elegido' : ''}${apagadasLlave.includes(r.id) ? ' apagado' : ''}${retratoMal === r.id ? ' mal' : ''}`}
                    onClick={() => alRetratoLlave(r.id)}
                    disabled={elegidasLlave.includes(r.id)}
                    aria-label={`Retrato: ${r.nombre.toLowerCase()}`}
                  >
                    <span className="equipo-emoji" aria-hidden>
                      {r.emoji}
                    </span>
                    <span className="equipo-nombre">{r.nombre}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <span className="gabinete-nota">Botonera de la cerradura</span>
              <div className="botonera-cerradura" aria-label="Botonera de la cerradura">
                {SIMBOLOS.map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    className={`tecla-simbolo${teclaBrilla === i ? ' brilla' : ''}${teclaMal === i ? ' mal' : ''}`}
                    onClick={() => alTecla(i)}
                    aria-label={`Símbolo ${i + 1}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="cerradura-guia" aria-label={`Llave: ${llavePaso} de 3 símbolos`}>
                {SECUENCIA.map((_, i) => (
                  <span key={i} className={`punto-llave${i < llavePaso ? ' lleno' : ''}`} aria-hidden />
                ))}
              </div>
            </>
          )
        ) : (
          <>
            <span className="gabinete-nota">
              {ronda === 0 ? 'Cofre de los tesoros · bandeja de compartir' : 'El cofre te protege'}
            </span>
            {dibujarCofreYBandeja()}
          </>
        )
      }
    >
      <div className="cofre-tablero">
        <div className="pasos-consigna">
          <strong>{consigna.titulo}</strong>
          <span>{consigna.texto}</span>
        </div>
        {ronda === 0 && (
          <div className="fichas-dia" aria-label="Fichas por clasificar">
            {FICHAS_REVUELTAS.filter((f) => clasificadas[f] === undefined).length > 0 ? (
              FICHAS_REVUELTAS.filter((f) => clasificadas[f] === undefined).map((f) => dibujarFicha(f, false))
            ) : (
              <span className="repisa-vacia" aria-hidden>
                · · ·
              </span>
            )}
          </div>
        )}
        {ronda === 1 && (
          <div className="escena-avisos">
            <div className="escena-dia" aria-label="La llave secreta">
              <span className="escena-emoji" aria-hidden>
                {faseLlave === 'quien' ? '🗝️' : '🔒'}
              </span>
              <span className="escena-texto">
                {faseLlave === 'muestra'
                  ? 'La cerradura propone tu llave: mira cómo brillan los símbolos…'
                  : faseLlave === 'repite'
                    ? 'Ahora repite la secuencia en la botonera de la cerradura.'
                    : '¡Tu llave secreta está lista! ¿Quién puede conocerla?'}
              </span>
            </div>
          </div>
        )}
        {ronda === 2 && (
          <div className="escena-avisos">
            <div
              key={situIdx}
              className={`situacion-rara quieta cambia${datoGuardado ? ' resuelta' : ''}`}
              aria-label={`Situación ${situIdx + 1} de 3`}
            >
              <span className="escena-emoji" aria-hidden>
                {datoGuardado ? (avisoListo && !cofreCerrado ? '🙋' : '🙂') : situacion.emoji}
              </span>
              <span className="escena-texto">
                {datoGuardado
                  ? avisoListo && !cofreCerrado
                    ? '¡Tesoro a salvo! Ahora presiona AVISO para contarle a tu adulto.'
                    : '¡Tesoro a salvo en el cofre!'
                  : situacion.texto}
              </span>
            </div>
            {!datoGuardado && (
              <div className="dato-zona" aria-label="El dato que te piden">
                <span className="dato-etiqueta">Te piden:</span>
                {dibujarFicha(situacion.dato, false)}
              </div>
            )}
          </div>
        )}
      </div>
      {aviso && <AvisoRonda texto={aviso} clave={aviso} />}
    </ArcadeSala>
  );
}
