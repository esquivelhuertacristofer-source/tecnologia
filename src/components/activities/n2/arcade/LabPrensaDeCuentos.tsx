'use client';

import { CSSProperties, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { Consigna3D, PanelBastidor3D } from '../../arcade3d/piezas3d';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { COLORES, PAGINAS_PARADA3_R1, PORTADA_PARADA3_R2, type ColorId, type ZonaDibujo } from './oracionesPrograma';

/**
 * «La prensa de cuentos» (N2·U5, parada 3) — documento §13.3, en WebGL 3D.
 *
 * El mismo mecanismo de arrastre-a-tira de la parada 1 escribe cada oración;
 * un mini-lienzo con zonas genéricas (heredero del relleno mágico de N1)
 * ilustra esa misma oración con los frascos de color del ropero. R1
 * «Escribe y dibuja tus páginas»: por cada página, primero la tira y la
 * palanca IMPRIMIR, después el dibujo. R2 «Arma tu portada»: el título (con
 * una palabra de más) y su propio dibujo cierran el cuento. Las líneas de
 * Bit son las del documento maestro (§13.3), verbatim.
 *
 * La tira de palabras y el mini-lienzo se montan como billboards <Html> sobre
 * bastidores 3D dentro del gabinete; la palanca IMPRIMIR (subfase escribe) y los
 * frascos de color (subfase dibuja) viven en la charola física del gabinete
 * (`base`), no como overlays flotantes. El arrastre usa refs escritos en los
 * handlers (no en el render) para que el hit-testing por getBoundingClientRect
 * quede sincronizado hasta en un tap.
 */

const LINEAS = {
  inicio: 'Mis páginas están vacías… ¡ayúdame a llenarlas de palabras y dibujos!',
  oracionCompleta: '¡Qué buena oración! Ahora dale vida con tu dibujo.',
  paginaCompleta: 'Tu dibujo y tu oración cuentan la misma idea… ¡así se hace un cuento!',
  inicioPortada: 'Falta la portada: el título que invita a todos a leer tu cuento.',
  pista: 'Un cuento se hojea de principio a fin: revisa que cada página tenga su oración y su dibujo.',
  completar: '¡Cuento ilustrado terminado! Escrito y dibujado por ti.',
} as const;

const TOTAL_PASOS = PAGINAS_PARADA3_R1.length * 2 + 2;

interface TarjetaPalabra {
  id: string;
  texto: string;
}

interface Arrastre {
  id: string;
  x0: number;
  y0: number;
  x: number;
  y: number;
}

function barajar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function paletaDe(palabras: string[], distractores: string[] = []): TarjetaPalabra[] {
  return barajar([...palabras, ...distractores].map((texto, i) => ({ id: `w${i}-${texto}`, texto })));
}

function capitalizarPrimera(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** La prensa estampa mayúscula inicial y punto final al cerrar una oración. */
function estampar(palabras: string[]): string {
  const [primera, ...resto] = palabras;
  return [capitalizarPrimera(primera), ...resto].join(' ') + '.';
}

/** El título de la portada lleva mayúscula, pero sin punto final. */
function estamparTitulo(palabras: string[]): string {
  const [primera, ...resto] = palabras;
  return [capitalizarPrimera(primera), ...resto].join(' ');
}

export function LabPrensaDeCuentos(props: ActivityProps & { alSalir?: () => void }) {
  const [ronda, setRonda] = useState<0 | 1>(0);
  const [paginaIdx, setPaginaIdx] = useState(0);
  const [subfase, setSubfase] = useState<'escribe' | 'dibuja'>('escribe');

  const [ranuras, setRanuras] = useState<(string | null)[]>(Array(PAGINAS_PARADA3_R1[0].palabras.length).fill(null));
  const [paleta, setPaleta] = useState<TarjetaPalabra[]>(paletaDe(PAGINAS_PARADA3_R1[0].palabras));
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const [choque, setChoque] = useState(false);

  const [frasco, setFrasco] = useState<ColorId | null>(null);
  const [rellenos, setRellenos] = useState<Record<string, ColorId>>({});
  const [sacudidoZona, setSacudidoZona] = useState<string | null>(null);
  const [pideHerr, setPideHerr] = useState(false);

  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, fallosSeguidos: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, aviso, ronda, paginaIdx, subfase, frasco, rellenos });
  // Refs escritos SÍNCRONAMENTE en los handlers de puntero: el arrastre y la tira
  // deben estar frescos entre pointerdown y pointerup del mismo gesto (un useEffect
  // llegaría una vuelta tarde y rompería el tap). Escribir refs en handlers —no en
  // el render— es válido para react-hooks/refs.
  const arrastreRef = useRef<Arrastre | null>(null);
  const ranurasRef = useRef<(string | null)[]>(Array(PAGINAS_PARADA3_R1[0].palabras.length).fill(null));
  const ranuraRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Sync de refs de estado FUERA del render (react-hooks/refs).
  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, aviso, ronda, paginaIdx, subfase, frasco, rellenos };
  });
  useEffect(() => {
    sim.current.inicio = Date.now();
    propsRef.current.onProgress(0);
    propsRef.current.onScore(100);
  }, []);

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));
  const puntajeFinal = Math.max(60, Math.min(100, 100 - erroresFinal * 6));

  const terminar = (tiempoSegundos: number) => {
    const s = sim.current;
    reproducirTono('complete');
    hablar(LINEAS.completar);
    const score = puntaje();
    propsRef.current.onScore(score);
    propsRef.current.onComplete({ score, stars: 3, xp: score, errores: s.errores, tiempoSegundos });
    setErroresFinal(s.errores);
    setTerminado(true);
  };

  const fallo = () => {
    const s = sim.current;
    reproducirTono('error');
    s.errores += 1;
    s.fallosSeguidos += 1;
    propsRef.current.onScore(puntaje());
    return s.fallosSeguidos > 0 && s.fallosSeguidos % 3 === 0;
  };

  const pedirHerramienta = () => {
    reproducirTono('close');
    setPideHerr(true);
    timers.despues(() => setPideHerr(false), 460);
  };

  /** Cierra la tira con el estampado de la prensa y abre el mini-lienzo de esa misma página o portada. */
  const avanzarADibujo = () => {
    const s = sim.current;
    const v = vivo.current;
    s.ocupado = true;
    reproducirTono('save');
    const objetivo = v.ronda === 0 ? PAGINAS_PARADA3_R1[v.paginaIdx].palabras : PORTADA_PARADA3_R2.tituloPalabras;
    setAviso(v.ronda === 0 ? estampar(objetivo) : estamparTitulo(objetivo));
    timers.despues(() => {
      if (vivo.current.terminado) return;
      setSubfase('dibuja');
      setFrasco(null);
      setAviso(null);
      const pasosHechos = v.ronda === 0 ? v.paginaIdx * 2 + 1 : PAGINAS_PARADA3_R1.length * 2 + 1;
      propsRef.current.onProgress(pasosHechos / TOTAL_PASOS);
      s.ocupado = false;
    }, 1400);
  };

  /** Cierra el dibujo de la página o portada actual y avanza a la siguiente, o termina el cuento. */
  const avanzarPagina = () => {
    const s = sim.current;
    const v = vivo.current;
    s.fallosSeguidos = 0;
    if (v.ronda === 0) {
      reproducirTono('save');
      hablar(LINEAS.paginaCompleta, { una: true });
      setAviso(`Página ${v.paginaIdx + 1} de ${PAGINAS_PARADA3_R1.length} lista`);
      timers.despues(() => {
        if (vivo.current.terminado) return;
        if (v.paginaIdx + 1 < PAGINAS_PARADA3_R1.length) {
          const siguienteIdx = v.paginaIdx + 1;
          ranuraRefs.current = [];
          const vacias = Array(PAGINAS_PARADA3_R1[siguienteIdx].palabras.length).fill(null);
          ranurasRef.current = vacias;
          setPaginaIdx(siguienteIdx);
          setSubfase('escribe');
          setRanuras(vacias);
          setPaleta(paletaDe(PAGINAS_PARADA3_R1[siguienteIdx].palabras));
          setRellenos({});
          setFrasco(null);
          setAviso(null);
          propsRef.current.onProgress((siguienteIdx * 2) / TOTAL_PASOS);
          s.ocupado = false;
        } else {
          setAviso('Ronda 2 · Arma tu portada');
          propsRef.current.onProgress((PAGINAS_PARADA3_R1.length * 2) / TOTAL_PASOS);
          timers.despues(() => {
            if (vivo.current.terminado) return;
            hablar(LINEAS.inicioPortada);
            ranuraRefs.current = [];
            const vacias = Array(PORTADA_PARADA3_R2.tituloPalabras.length).fill(null);
            ranurasRef.current = vacias;
            setRonda(1);
            setSubfase('escribe');
            setRanuras(vacias);
            setPaleta(paletaDe(PORTADA_PARADA3_R2.tituloPalabras, PORTADA_PARADA3_R2.distractores));
            setRellenos({});
            setFrasco(null);
            setAviso(null);
            s.ocupado = false;
          }, 1600);
        }
      }, 1400);
    } else {
      reproducirTono('save');
      propsRef.current.onProgress(1);
      timers.despues(() => {
        if (vivo.current.terminado) return;
        terminar(Math.round((Date.now() - s.inicio) / 1000));
      }, 1100);
    }
  };

  const alAgarrar = (e: ReactPointerEvent<HTMLButtonElement>, id: string) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.subfase !== 'escribe') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const a: Arrastre = { id, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY };
    arrastreRef.current = a;
    setArrastre(a);
  };

  const alMover = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const a = arrastreRef.current;
    if (!a) return;
    const n: Arrastre = { ...a, x: e.clientX, y: e.clientY };
    arrastreRef.current = n;
    setArrastre(n);
  };

  const alSoltar = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const a = arrastreRef.current;
    if (!a) return;
    arrastreRef.current = null;
    setArrastre(null);
    const dist = Math.hypot(e.clientX - a.x0, e.clientY - a.y0);
    const idxRanura = ranuraRefs.current.findIndex((el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    });
    const actuales = ranurasRef.current;
    const sig = [...actuales];
    const enRanura = sig.indexOf(a.id);
    const esToque = dist < 8;
    if (idxRanura >= 0 && !(esToque && enRanura === idxRanura)) {
      if (enRanura >= 0) sig[enRanura] = sig[idxRanura];
      sig[idxRanura] = a.id;
      reproducirTono('select');
    } else if (enRanura >= 0) {
      sig[enRanura] = null;
      reproducirTono('close');
    } else if (esToque) {
      const libre = sig.indexOf(null);
      if (libre < 0) return;
      sig[libre] = a.id;
      reproducirTono('select');
    } else {
      return;
    }
    ranurasRef.current = sig;
    setRanuras(sig);
  };

  /** Palanca IMPRIMIR: valida el orden de la tira completa contra la oración o el título. */
  const imprimir = () => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.subfase !== 'escribe') return;
    const ranurasAhora = ranurasRef.current;
    if (ranurasAhora.some((r) => !r)) return;
    s.ocupado = true;
    reproducirTono('open');
    const objetivo = v.ronda === 0 ? PAGINAS_PARADA3_R1[v.paginaIdx].palabras : PORTADA_PARADA3_R2.tituloPalabras;
    const orden = ranurasAhora as string[];
    const textos = orden.map((id) => paleta.find((p) => p.id === id)?.texto ?? '');
    if (textos.join(' ') === objetivo.join(' ')) {
      reproducirTono('correct');
      s.fallosSeguidos = 0;
      if (v.ronda === 0) hablar(LINEAS.oracionCompleta, { una: true });
      avanzarADibujo();
    } else {
      const tocaPista = fallo();
      if (tocaPista) hablar(LINEAS.pista);
      setChoque(true);
      timers.despues(() => {
        setChoque(false);
        if (vivo.current.terminado) return;
        s.ocupado = false;
      }, 900);
    }
  };

  const elegirFrasco = (color: ColorId) => {
    const v = vivo.current;
    if (v.terminado || v.aviso || sim.current.ocupado || v.subfase !== 'dibuja') return;
    reproducirTono('select');
    setFrasco(color);
  };

  /** El frasco elegido rellena la zona solo si su color coincide con lo que pide la escena. */
  const rellenarZona = (zona: ZonaDibujo) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.subfase !== 'dibuja') return;
    if (v.rellenos[zona.id]) return;
    if (!v.frasco) {
      pedirHerramienta();
      return;
    }
    if (v.frasco === zona.color) {
      reproducirTono('connect');
      const sig = { ...v.rellenos, [zona.id]: v.frasco };
      setRellenos(sig);
      const escena = v.ronda === 0 ? PAGINAS_PARADA3_R1[v.paginaIdx].escena : PORTADA_PARADA3_R2.escena;
      if (Object.keys(sig).length === escena.zonas.length) {
        s.ocupado = true;
        timers.despues(() => {
          if (vivo.current.terminado) return;
          avanzarPagina();
        }, 700);
      }
    } else {
      const tocaPista = fallo();
      if (tocaPista) hablar(LINEAS.pista);
      setSacudidoZona(zona.id);
      timers.despues(() => setSacudidoZona((x) => (x === zona.id ? null : x)), 460);
    }
  };

  const repetir = () => {
    const s = sim.current;
    s.ocupado = false;
    s.errores = 0;
    s.fallosSeguidos = 0;
    s.inicio = Date.now();
    ranuraRefs.current = [];
    const vacias = Array(PAGINAS_PARADA3_R1[0].palabras.length).fill(null);
    ranurasRef.current = vacias;
    arrastreRef.current = null;
    setRonda(0);
    setPaginaIdx(0);
    setSubfase('escribe');
    setRanuras(vacias);
    setPaleta(paletaDe(PAGINAS_PARADA3_R1[0].palabras));
    setArrastre(null);
    setChoque(false);
    setFrasco(null);
    setRellenos({});
    setSacudidoZona(null);
    setPideHerr(false);
    setAviso(null);
    setTerminado(false);
    setErroresFinal(0);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const tarjetaArrastrable = (t: TarjetaPalabra) => {
    const enArrastre = arrastre?.id === t.id;
    const estilo: CSSProperties | undefined =
      enArrastre && arrastre
        ? { transform: `translate(${arrastre.x - arrastre.x0}px, ${arrastre.y - arrastre.y0}px) scale(1.06)` }
        : undefined;
    return (
      <button
        key={t.id}
        type="button"
        className={`tarjeta-paso arrastrable${enArrastre ? ' arrastrando' : ''}${choque && ranuras.includes(t.id) ? ' sacudida' : ''}`}
        style={estilo}
        onPointerDown={(e) => alAgarrar(e, t.id)}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={() => {
          arrastreRef.current = null;
          setArrastre(null);
        }}
        aria-label={`Palabra: ${t.texto}`}
      >
        <span className="tarjeta-texto">{t.texto}</span>
      </button>
    );
  };

  const tira = ranuras.map((id, i) => {
    const t = id ? paleta.find((x) => x.id === id) : null;
    return (
      <div
        key={`${ronda}-${paginaIdx}-${i}`}
        className={`ranura${t ? ' ocupada' : ''}`}
        ref={(el) => {
          ranuraRefs.current[i] = el;
        }}
      >
        <span className="ranura-num" aria-hidden>
          {i + 1}
        </span>
        {t && tarjetaArrastrable(t)}
      </div>
    );
  });

  const listaBandeja = paleta.filter((t) => !ranuras.includes(t.id));

  const enPortada = ronda === 1;
  const paginaActual = PAGINAS_PARADA3_R1[paginaIdx];
  const escenaActual = enPortada ? PORTADA_PARADA3_R2.escena : paginaActual.escena;

  const marcador =
    subfase === 'escribe'
      ? { etiqueta: 'Palabras', valor: `${ranuras.filter(Boolean).length}/${ranuras.length}` }
      : { etiqueta: 'Zonas', valor: `${Object.keys(rellenos).length}/${escenaActual.zonas.length}` };

  const consigna = enPortada
    ? subfase === 'escribe'
      ? {
          titulo: 'La portada',
          texto: 'Arrastra las palabras del título a la tira, en orden, y jala la palanca IMPRIMIR. Cuidado: sobra una palabra.',
        }
      : { titulo: 'La portada', texto: 'Elige un frasco de color y toca cada zona para ilustrar la portada.' }
    : subfase === 'escribe'
      ? { titulo: `Página ${paginaIdx + 1}`, texto: 'Arrastra las palabras a la tira en el orden correcto y jala la palanca IMPRIMIR.' }
      : {
          titulo: `Página ${paginaIdx + 1}`,
          texto: `Elige un frasco de color y toca cada zona para dibujar: "${estampar(paginaActual.palabras)}"`,
        };

  const pasosTotal = PAGINAS_PARADA3_R1.length + 1;
  const pasoActual = enPortada ? PAGINAS_PARADA3_R1.length + 1 : paginaIdx + 1;
  const bloqueado = terminado || !!aviso;

  /** Mini-lienzo de dibujo con zonas genéricas de relleno por color (compartido por escena y respaldo). */
  const renderLienzo = () => (
    <div
      className="mini-lienzo"
      style={{ background: escenaActual.fondo }}
      aria-label={enPortada ? 'Dibujo de la portada' : `Dibujo de la página ${paginaIdx + 1}`}
    >
      {escenaActual.zonas.map((zona) => {
        const color = rellenos[zona.id];
        const estilo = {
          left: `${zona.left}%`,
          top: `${zona.top}%`,
          width: `${zona.width}%`,
          height: `${zona.height}%`,
          ...(color ? { '--bc': COLORES[color].hex, '--bc-hondo': COLORES[color].hondo } : {}),
        } as CSSProperties;
        return (
          <button
            key={zona.id}
            type="button"
            className={`zona-generica forma-${zona.forma}${color ? ' rellena' : ''}${sacudidoZona === zona.id ? ' sacude' : ''}`}
            style={estilo}
            onClick={() => rellenarZona(zona)}
            aria-label={`Zona: ${zona.id}`}
          />
        );
      })}
    </div>
  );

  // ── Escena 3D: tira de palabras o mini-lienzo, montados como billboard sobre un bastidor del gabinete ──
  const escena =
    subfase === 'escribe' ? (
      <>
        <Consigna3D titulo={consigna.titulo} texto={consigna.texto} position={[0, MOSTRADOR_Y + 2.45, -0.3]} />
        <PanelBastidor3D position={[0, MOSTRADOR_Y + 0.95, 0.8]} ancho={3.2} alto={1.9}>
          <div className="prensa3d-orden">
            <div className="pasos-bandeja" aria-label="Palabras disponibles">
              {listaBandeja.map((t) => tarjetaArrastrable(t))}
            </div>
            <div className="pasos-banda" aria-label="Tira del texto">
              {tira}
            </div>
          </div>
        </PanelBastidor3D>
      </>
    ) : (
      <>
        <Consigna3D titulo={consigna.titulo} texto={consigna.texto} position={[0, MOSTRADOR_Y + 2.45, -0.3]} />
        <PanelBastidor3D position={[0, MOSTRADOR_Y + 0.9, 0.8]} ancho={2.9} alto={2.5}>
          <div className="prensa3d-lienzo">{renderLienzo()}</div>
        </PanelBastidor3D>
      </>
    );

  // ── Respaldo HTML (sin WebGL): misma mecánica y mismos aria-labels ──
  const respaldo = (
    <div className="prensa-tablero">
      <div className="pasos-consigna">
        <strong>{consigna.titulo}</strong>
        <span>{consigna.texto}</span>
      </div>
      {subfase === 'escribe' ? (
        <>
          <div className="pasos-bandeja" aria-label="Palabras disponibles">
            {listaBandeja.map((t) => tarjetaArrastrable(t))}
          </div>
          <div className="pasos-banda" aria-label="Tira del texto">
            {tira}
          </div>
        </>
      ) : (
        renderLienzo()
      )}
    </div>
  );

  // ── Charola física del gabinete: palanca IMPRIMIR (escribe) o frascos de color (dibuja). Se oculta al terminar. ──
  const base = terminado ? undefined : subfase === 'escribe' ? (
    <>
      <span className="gabinete-nota">La palanca de la prensa</span>
      <button
        type="button"
        className={`palanca-probar${ranuras.every(Boolean) ? '' : ' apagada'}`}
        onClick={imprimir}
        aria-label={enPortada ? 'Imprimir el título' : 'Imprimir la oración'}
      >
        <span className="palanca-tirador" aria-hidden />
        IMPRIMIR
      </button>
    </>
  ) : (
    <>
      <span className="gabinete-nota">Frascos de color</span>
      <div className={`frascos-grupo${pideHerr ? ' pide' : ''}`} aria-label="Frascos de color">
        {(Object.keys(COLORES) as ColorId[]).map((c) => (
          <button
            key={c}
            type="button"
            className={`frasco${frasco === c ? ' elegido' : ''}`}
            style={{ '--bc': COLORES[c].hex, '--bc-hondo': COLORES[c].hondo } as CSSProperties}
            onClick={() => elegirFrasco(c)}
            aria-label={`Frasco ${COLORES[c].nombre.toLowerCase()}`}
          />
        ))}
      </div>
    </>
  );

  return (
    <ArcadeSala3D
      titulo="La prensa de cuentos"
      pasoEtiqueta={enPortada ? 'Portada' : 'Página'}
      pasoActual={pasoActual}
      pasosTotal={pasosTotal}
      marcadorEtiqueta={marcador.etiqueta}
      marcadorValor={marcador.valor}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      activa={!bloqueado}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      base={base}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Autor ilustrado',
              insigniaEmoji: '📖',
              titulo: '¡Cuento ilustrado terminado!',
              detalle: 'Escribiste y dibujaste tu primer cuento, de la primera página hasta la portada.',
              resumen: [
                { etiqueta: 'Páginas', valor: `${PAGINAS_PARADA3_R1.length + 1}` },
                { etiqueta: 'Puntaje', valor: `${puntajeFinal}%` },
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

export default LabPrensaDeCuentos;
