'use client';

import { CSSProperties, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../mision/audio';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { ArcadeSala, AvisoRonda, useBit } from './ArcadeSala';

/**
 * «Pinta con la compu» (N1·U4, parada 2) — La cabina de pintar.
 *
 * Un caballete-arcade: el lienzo vive en el bisel CRT y las herramientas son
 * parte del mueble — la paleta de frascos de color (se hunden y brillan al
 * elegirse), la repisa con pincel, sellos y bote de relleno, y el botón
 * físico de deshacer. R1 «Tus primeros trazos»: cubrir la guía luminosa
 * (una ola, un sol) pintando por arrastre. R2 «Formas que estampan»:
 * completar la escena estampando por clic sol, casa y estrellas. R3 «El
 * relleno mágico»: rellenar de un clic las zonas blancas de un dibujo de
 * Bit; al terminar, la obra se enmarca sola. Líneas de Bit verbatim del
 * documento (§5.2). Deshacer nunca castiga.
 */

const LINEAS = {
  inicio: '¡Bienvenido a mi cabina de pintar! Aquí el mouse es tu pincel.',
  trazo: '¡Tu primer trazo digital! El lienzo ya es tuyo.',
  relleno: '¡Splash! Un clic… ¡y el color llena todo el espacio!',
  deshacer: '¿Ves? Deshacer lo borra sin dejar mancha. ¡Aquí probar no cuesta nada!',
  ronda: 'Trazos, formas y color… ¡eso ya es una obra de arte!',
  completar: '¡Obra terminada! Un artista digital acaba de nacer… ¡y eres tú!',
} as const;

type Color = 'rojo' | 'azul' | 'amarillo' | 'verde';

const COLORES: Record<Color, { nombre: string; hex: string; hondo: string }> = {
  rojo: { nombre: 'Rojo', hex: '#ff6d7c', hondo: '#d63a52' },
  azul: { nombre: 'Azul', hex: '#32a8ff', hondo: '#1e63c4' },
  amarillo: { nombre: 'Amarillo', hex: '#ffd25a', hondo: '#d99a00' },
  verde: { nombre: 'Verde', hex: '#58e29c', hondo: '#1e8a5a' },
};

const FRASCOS: Color[] = ['rojo', 'azul', 'amarillo', 'verde'];

interface PuntoGuia {
  id: string;
  x: number;
  y: number;
}

/** R1: guías luminosas que el pincel cubre por arrastre — una ola y un sol. */
const GUIAS: { nombre: string; puntos: PuntoGuia[] }[] = [
  {
    nombre: 'la ola',
    puntos: [
      { id: 'o1', x: 8, y: 62 },
      { id: 'o2', x: 16, y: 50 },
      { id: 'o3', x: 23, y: 42 },
      { id: 'o4', x: 31, y: 46 },
      { id: 'o5', x: 38, y: 58 },
      { id: 'o6', x: 46, y: 66 },
      { id: 'o7', x: 54, y: 62 },
      { id: 'o8', x: 62, y: 50 },
      { id: 'o9', x: 69, y: 42 },
      { id: 'o10', x: 77, y: 46 },
      { id: 'o11', x: 84, y: 58 },
      { id: 'o12', x: 92, y: 64 },
    ],
  },
  {
    nombre: 'el sol',
    puntos: [
      { id: 's1', x: 76, y: 52 },
      { id: 's2', x: 73, y: 67 },
      { id: 's3', x: 63, y: 78 },
      { id: 's4', x: 50, y: 82 },
      { id: 's5', x: 37, y: 78 },
      { id: 's6', x: 27, y: 67 },
      { id: 's7', x: 24, y: 52 },
      { id: 's8', x: 27, y: 37 },
      { id: 's9', x: 37, y: 26 },
      { id: 's10', x: 50, y: 22 },
      { id: 's11', x: 63, y: 26 },
      { id: 's12', x: 73, y: 37 },
    ],
  },
];

type Forma = 'circulo' | 'cuadrado' | 'estrella';

const SELLOS: { forma: Forma; nombre: string; glifo: string }[] = [
  { forma: 'circulo', nombre: 'círculo', glifo: '●' },
  { forma: 'cuadrado', nombre: 'cuadrado', glifo: '■' },
  { forma: 'estrella', nombre: 'estrella', glifo: '★' },
];

interface Hueco {
  id: string;
  forma: Forma;
  x: number;
  y: number;
  talla: number;
  color: Color;
}

/** R2: la escena (cielo y jardín) con sus huecos luminosos para estampar. */
const HUECOS: Hueco[] = [
  { id: 'sol', forma: 'circulo', x: 18, y: 28, talla: 72, color: 'amarillo' },
  { id: 'estrella-1', forma: 'estrella', x: 46, y: 18, talla: 48, color: 'azul' },
  { id: 'estrella-2', forma: 'estrella', x: 66, y: 32, talla: 48, color: 'azul' },
  { id: 'estrella-3', forma: 'estrella', x: 85, y: 15, talla: 48, color: 'azul' },
  { id: 'casa', forma: 'cuadrado', x: 58, y: 70, talla: 76, color: 'rojo' },
];

/** R3: zonas cerradas en blanco del dibujo de Bit. */
const ZONAS: { id: string; nombre: string }[] = [
  { id: 'antena', nombre: 'la antena' },
  { id: 'cabeza', nombre: 'la cabeza' },
  { id: 'cuerpo', nombre: 'el cuerpo' },
  { id: 'panza', nombre: 'la panza' },
];

type Accion = { tipo: 'trazo'; ids: string[] } | { tipo: 'sello'; id: string } | { tipo: 'zona'; id: string };

export function LabPintaConLaCompu(props: ActivityProps & { alSalir?: () => void }) {
  const [ronda, setRonda] = useState(0);
  const [frasco, setFrasco] = useState<Color | null>(null);
  const [guiaIdx, setGuiaIdx] = useState(0);
  const [pintados, setPintados] = useState<Record<string, Color>>({});
  const [sello, setSello] = useState<Forma | null>(null);
  const [estampados, setEstampados] = useState<Record<string, boolean>>({});
  const [rellenos, setRellenos] = useState<Record<string, Color>>({});
  const [enmarcada, setEnmarcada] = useState(false);
  const [sacudido, setSacudido] = useState<string | null>(null);
  const [pideHerr, setPideHerr] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);

  const { linea, hablar } = useBit(LINEAS.inicio);

  const timers = useTemporizadores();
  const sim = useRef({
    ocupado: false,
    errores: 0,
    inicio: 0,
    pincelando: false,
    trazo: [] as string[],
    pila: [] as Accion[],
    pintados: {} as Record<string, Color>,
    huboTrazo: false,
    huboRelleno: false,
  });
  const propsRef = useRef(props);
  propsRef.current = props;
  const vivo = useRef({ terminado, aviso, ronda, frasco, guiaIdx, sello, estampados, rellenos });
  vivo.current = { terminado, aviso, ronda, frasco, guiaIdx, sello, estampados, rellenos };
  const puntoRefs = useRef<Record<string, HTMLSpanElement | null>>({});

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

  /** Sacude la repisa cuando falta elegir frasco o sello. */
  const pedirHerramienta = () => {
    reproducirTono('close');
    setPideHerr(true);
    timers.despues(() => setPideHerr(false), 460);
  };

  /** Paso de R1 → R2 y de R2 → R3, con aviso de ronda y línea de Bit. */
  const cambiarRonda = (nueva: 1 | 2) => {
    const s = sim.current;
    s.ocupado = true;
    reproducirTono('save');
    propsRef.current.onProgress(nueva / 3);
    hablar(LINEAS.ronda);
    setAviso(nueva === 1 ? 'Ronda 2 · Formas que estampan' : 'Ronda 3 · El relleno mágico');
    timers.despues(() => {
      if (vivo.current.terminado) return;
      setRonda(nueva);
      setAviso(null);
      s.pila = [];
      s.ocupado = false;
    }, 1600);
  };

  /** R1: el pincel pinta la guía luminosa allí donde pasa. */
  const pintarEn = (px: number, py: number) => {
    const s = sim.current;
    const v = vivo.current;
    const color = v.frasco;
    if (!color) return;
    const puntos = GUIAS[v.guiaIdx].puntos;
    let pintoAlgo = false;
    puntos.forEach((p) => {
      if (s.pintados[p.id]) return;
      const el = puntoRefs.current[p.id];
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      if (Math.hypot(px - cx, py - cy) > 36) return;
      s.pintados[p.id] = color;
      s.trazo.push(p.id);
      pintoAlgo = true;
    });
    if (!pintoAlgo) return;
    reproducirTono('select');
    setPintados({ ...s.pintados });
    if (!s.huboTrazo) {
      s.huboTrazo = true;
      hablar(LINEAS.trazo, { una: true });
    }
    if (Object.keys(s.pintados).length === puntos.length) {
      s.pincelando = false;
      if (s.trazo.length > 0) {
        s.pila.push({ tipo: 'trazo', ids: [...s.trazo] });
        s.trazo = [];
      }
      s.ocupado = true;
      timers.despues(() => reproducirTono('correct'), 200);
      if (v.guiaIdx === 0) {
        setAviso('¡Ola lista! Ahora pinta el sol');
        timers.despues(() => {
          if (vivo.current.terminado) return;
          s.pintados = {};
          s.pila = [];
          setPintados({});
          setGuiaIdx(1);
          setAviso(null);
          s.ocupado = false;
        }, 1600);
      } else {
        timers.despues(() => {
          if (vivo.current.terminado) return;
          cambiarRonda(1);
        }, 700);
      }
    }
  };

  const alBajarPincel = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 0) return;
    if (!v.frasco) {
      pedirHerramienta();
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    s.pincelando = true;
    s.trazo = [];
    pintarEn(e.clientX, e.clientY);
  };

  const alMoverPincel = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!sim.current.pincelando) return;
    pintarEn(e.clientX, e.clientY);
  };

  const alSubirPincel = () => {
    const s = sim.current;
    if (!s.pincelando) return;
    s.pincelando = false;
    if (s.trazo.length > 0) {
      s.pila.push({ tipo: 'trazo', ids: [...s.trazo] });
      s.trazo = [];
    }
  };

  /** R2: estampar el hueco luminoso con el sello elegido en la repisa. */
  const estampar = (hueco: Hueco) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 1) return;
    if (v.estampados[hueco.id]) return;
    if (!v.sello) {
      pedirHerramienta();
      return;
    }
    if (v.sello === hueco.forma) {
      reproducirTono('correct');
      const sig = { ...v.estampados, [hueco.id]: true };
      setEstampados(sig);
      s.pila.push({ tipo: 'sello', id: hueco.id });
      if (Object.keys(sig).length === HUECOS.length) {
        s.ocupado = true;
        timers.despues(() => {
          if (vivo.current.terminado) return;
          cambiarRonda(2);
        }, 900);
      }
    } else {
      errar();
      setSacudido(hueco.id);
      timers.despues(() => setSacudido((x) => (x === hueco.id ? null : x)), 460);
    }
  };

  /** R3: el bote de relleno pinta la zona cerrada de un solo clic. */
  const rellenar = (zonaId: string) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 2) return;
    if (v.rellenos[zonaId]) return;
    if (!v.frasco) {
      pedirHerramienta();
      return;
    }
    reproducirTono('connect');
    const sig = { ...v.rellenos, [zonaId]: v.frasco };
    setRellenos(sig);
    s.pila.push({ tipo: 'zona', id: zonaId });
    if (!s.huboRelleno) {
      s.huboRelleno = true;
      hablar(LINEAS.relleno, { una: true });
    }
    if (Object.keys(sig).length === ZONAS.length) {
      s.ocupado = true;
      timers.despues(() => {
        if (vivo.current.terminado) return;
        reproducirTono('save');
        setEnmarcada(true);
        propsRef.current.onProgress(1);
        timers.despues(() => {
          if (vivo.current.terminado) return;
          terminar();
        }, 1100);
      }, 500);
    }
  };

  /** El botón físico de deshacer: quita el último paso, nunca castiga. */
  const deshacer = () => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado) return;
    const accion = s.pila.pop();
    if (!accion) {
      reproducirTono('close');
      return;
    }
    reproducirTono('select');
    if (accion.tipo === 'trazo') {
      accion.ids.forEach((id) => {
        delete s.pintados[id];
      });
      setPintados({ ...s.pintados });
    } else if (accion.tipo === 'sello') {
      setEstampados((prev) => {
        const sig = { ...prev };
        delete sig[accion.id];
        return sig;
      });
    } else {
      setRellenos((prev) => {
        const sig = { ...prev };
        delete sig[accion.id];
        return sig;
      });
    }
    hablar(LINEAS.deshacer, { una: true });
  };

  const elegirFrasco = (color: Color) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado) return;
    reproducirTono('select');
    setFrasco(color);
  };

  const elegirSello = (forma: Forma) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado) return;
    reproducirTono('select');
    setSello(forma);
  };

  const repetir = () => {
    const s = sim.current;
    s.ocupado = false;
    s.errores = 0;
    s.inicio = Date.now();
    s.pincelando = false;
    s.trazo = [];
    s.pila = [];
    s.pintados = {};
    s.huboTrazo = false;
    s.huboRelleno = false;
    puntoRefs.current = {};
    setRonda(0);
    setFrasco(null);
    setGuiaIdx(0);
    setPintados({});
    setSello(null);
    setEstampados({});
    setRellenos({});
    setEnmarcada(false);
    setSacudido(null);
    setPideHerr(false);
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const guia = GUIAS[guiaIdx];
  const marcador =
    ronda === 0
      ? { etiqueta: 'Guía', valor: `${Object.keys(pintados).length}/${guia.puntos.length}` }
      : ronda === 1
        ? { etiqueta: 'Sellos', valor: `${Object.keys(estampados).length}/${HUECOS.length}` }
        : { etiqueta: 'Zonas', valor: `${Object.keys(rellenos).length}/${ZONAS.length}` };

  const consigna =
    ronda === 0
      ? {
          titulo: 'Tus primeros trazos',
          texto:
            guiaIdx === 0
              ? 'Elige un frasco de color y pinta la ola: pasa el pincel por la guía luminosa.'
              : 'Ahora el sol: elige tu color y cubre la guía luminosa con el pincel.',
        }
      : ronda === 1
        ? { titulo: 'Formas que estampan', texto: 'Elige un sello en la repisa y estampa cada hueco luminoso de la escena.' }
        : { titulo: 'El relleno mágico', texto: 'Elige un frasco y haz clic en cada zona blanca del dibujo de Bit.' };

  return (
    <ArcadeSala
      titulo="Pinta con la compu"
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
              insigniaNombre: 'Artista digital',
              insigniaEmoji: '🎨',
              titulo: '¡Obra terminada!',
              detalle:
                'Trazos, sellos y relleno: tu primera obra digital quedó enmarcada y Bit la llevará a su bóveda.',
              resumen: [
                { etiqueta: 'Guías', valor: '2' },
                { etiqueta: 'Zonas', valor: '4' },
                { etiqueta: 'Puntaje', valor: `${puntaje()}%` },
              ],
              alRepetir: repetir,
            }
          : null
      }
      base={
        <>
          <span className="gabinete-nota">Repisa del pintor</span>
          <span className="herr-activa" aria-hidden>
            {ronda === 0 ? '🖌️ Pincel' : ronda === 1 ? '🖐️ Sellos' : '🪣 Bote de relleno'}
          </span>
          {ronda === 1 ? (
            <div className={`sellos-grupo${pideHerr ? ' pide' : ''}`} aria-label="Sellos de la repisa">
              {SELLOS.map((s) => (
                <button
                  key={s.forma}
                  type="button"
                  className={`sello-herr${sello === s.forma ? ' elegido' : ''}`}
                  onClick={() => elegirSello(s.forma)}
                  aria-label={`Sello de ${s.nombre}`}
                >
                  <span aria-hidden>{s.glifo}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className={`frascos-grupo${pideHerr ? ' pide' : ''}`} aria-label="Frascos de color">
              {FRASCOS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`frasco${frasco === color ? ' elegido' : ''}`}
                  style={{ '--bc': COLORES[color].hex, '--bc-hondo': COLORES[color].hondo } as CSSProperties}
                  onClick={() => elegirFrasco(color)}
                  aria-label={`Frasco ${COLORES[color].nombre.toLowerCase()}`}
                />
              ))}
            </div>
          )}
          <button type="button" className="boton-deshacer" onClick={deshacer} aria-label="Deshacer el último paso">
            <span className="deshacer-glifo" aria-hidden>
              ↺
            </span>
            Deshacer
          </button>
        </>
      }
    >
      <div className="pinta-tablero">
        <div className="pasos-consigna">
          <strong>{consigna.titulo}</strong>
          <span>{consigna.texto}</span>
        </div>
        {ronda === 0 && (
          <div
            key={guiaIdx}
            className="lienzo-pinta"
            onPointerDown={alBajarPincel}
            onPointerMove={alMoverPincel}
            onPointerUp={alSubirPincel}
            onPointerCancel={alSubirPincel}
            aria-label={`Lienzo: pinta ${guia.nombre} sobre la guía luminosa`}
          >
            {guia.puntos.map((p) => {
              const color = pintados[p.id];
              const estilo: CSSProperties = { left: `${p.x}%`, top: `${p.y}%` };
              if (color) {
                (estilo as Record<string, string>)['--bc'] = COLORES[color].hex;
                (estilo as Record<string, string>)['--bc-hondo'] = COLORES[color].hondo;
              }
              return (
                <span
                  key={p.id}
                  ref={(el) => {
                    puntoRefs.current[p.id] = el;
                  }}
                  className={`guia-punto${color ? ' pintado' : ''}`}
                  style={estilo}
                  aria-hidden
                />
              );
            })}
          </div>
        )}
        {ronda === 1 && (
          <div className="lienzo-pinta escena-estampas" aria-label="Escena de cielo y jardín para estampar">
            {HUECOS.map((h) => (
              <button
                key={h.id}
                type="button"
                className={`hueco hueco-${h.forma}${estampados[h.id] ? ' estampado' : ''}${sacudido === h.id ? ' sacude' : ''}`}
                style={
                  {
                    left: `${h.x}%`,
                    top: `${h.y}%`,
                    width: h.talla,
                    height: h.talla,
                    '--bc': COLORES[h.color].hex,
                    '--bc-hondo': COLORES[h.color].hondo,
                  } as CSSProperties
                }
                onClick={() => estampar(h)}
                aria-label={`Hueco de ${SELLOS.find((s) => s.forma === h.forma)?.nombre}`}
              >
                {h.forma === 'estrella' ? '★' : ''}
              </button>
            ))}
          </div>
        )}
        {ronda === 2 && (
          <div className={`lienzo-pinta lienzo-obra${enmarcada ? ' enmarcada' : ''}`} aria-label="Dibujo de Bit para rellenar">
            <div className="obra-zonas">
              <button
                type="button"
                className={`zona zona-antena${rellenos.antena ? ' rellena' : ''}`}
                style={
                  rellenos.antena
                    ? ({ '--bc': COLORES[rellenos.antena].hex, '--bc-hondo': COLORES[rellenos.antena].hondo } as CSSProperties)
                    : undefined
                }
                onClick={() => rellenar('antena')}
                aria-label="Zona: la antena"
              />
              <span className="zona-mastil" aria-hidden />
              <button
                type="button"
                className={`zona zona-cabeza${rellenos.cabeza ? ' rellena' : ''}`}
                style={
                  rellenos.cabeza
                    ? ({ '--bc': COLORES[rellenos.cabeza].hex, '--bc-hondo': COLORES[rellenos.cabeza].hondo } as CSSProperties)
                    : undefined
                }
                onClick={() => rellenar('cabeza')}
                aria-label="Zona: la cabeza"
              >
                <span className="zona-visor" aria-hidden>
                  <span className="zona-ojo" />
                  <span className="zona-ojo" />
                </span>
              </button>
              <button
                type="button"
                className={`zona zona-cuerpo${rellenos.cuerpo ? ' rellena' : ''}`}
                style={
                  rellenos.cuerpo
                    ? ({ '--bc': COLORES[rellenos.cuerpo].hex, '--bc-hondo': COLORES[rellenos.cuerpo].hondo } as CSSProperties)
                    : undefined
                }
                onClick={() => rellenar('cuerpo')}
                aria-label="Zona: el cuerpo"
              />
              <button
                type="button"
                className={`zona zona-panza${rellenos.panza ? ' rellena' : ''}`}
                style={
                  rellenos.panza
                    ? ({ '--bc': COLORES[rellenos.panza].hex, '--bc-hondo': COLORES[rellenos.panza].hondo } as CSSProperties)
                    : undefined
                }
                onClick={() => rellenar('panza')}
                aria-label="Zona: la panza"
              />
            </div>
          </div>
        )}
      </div>
      {aviso && <AvisoRonda texto={aviso} clave={aviso} />}
    </ArcadeSala>
  );
}
