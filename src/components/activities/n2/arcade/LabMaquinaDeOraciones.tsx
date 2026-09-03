'use client';

import { CSSProperties, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { Consigna3D, PanelBastidor3D } from '../../arcade3d/piezas3d';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { TecladoMapa, type EstadoTecla } from './TecladoMapa';
import { ORACIONES_PARADA1_R1, RETOS_PARADA1_R2 } from './oracionesPrograma';

/**
 * «La máquina de oraciones» (N2·U5, parada 1) — documento §13.1, en WebGL 3D.
 *
 * El mismo mecanismo de arrastre-a-tira de N2·U4 se reutiliza para ordenar
 * palabras; el mapa de teclado de N2·U2 se reutiliza para teclear letra a
 * letra. R1 «Ordena las palabras»: arrastra (o toca) las tarjetas a la tira en
 * el orden correcto y jala la palanca ESCRIBIR; la máquina estampa la oración
 * con mayúscula y punto. R2 «Escríbela tú»: teclea la oración letra a letra en
 * el mapa y luego coloca tú mismo la mayúscula inicial y el punto final. Las
 * líneas de Bit son las del documento maestro (§13.1), verbatim.
 *
 * La mecánica se monta como billboards <Html> sobre bastidores 3D dentro del
 * gabinete; la palanca ESCRIBIR (R1) y los botones Mayúscula/Punto (R2) viven
 * en la charola física del gabinete (`base`), no como overlays flotantes. El
 * arrastre usa refs escritos en los handlers (no en el render) para que el
 * hit-testing por getBoundingClientRect quede sincronizado hasta en un tap.
 */

const LINEAS = {
  inicio: '¡Bienvenido a mi máquina de oraciones! Aquí tus ideas se vuelven palabras.',
  palabraCorrecta: '¡Esa palabra va justo ahí! La oración empieza a tener sentido.',
  ordenIncorrecto: 'Mmm, en ese orden la oración no dice nada. Prueba acomodarla distinto.',
  oracionCompleta: '¡Mayúscula al inicio, punto al final! Esa oración ya está completa.',
  pista: 'Lee tu oración en voz alta: ¿tiene sentido de principio a fin?',
  completar: '¡Oraciones completas! Ya sabes escribir con la máquina.',
} as const;

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

function paletaDe(oracionIdx: number): TarjetaPalabra[] {
  return barajar(
    ORACIONES_PARADA1_R1[oracionIdx].palabras.map((texto, i) => ({ id: `w${oracionIdx}-${i}-${texto}`, texto }))
  );
}

/** La máquina estampa mayúscula inicial y punto final al cerrar una oración. */
function estampar(palabras: string[]): string {
  const [primera, ...resto] = palabras;
  return [primera.charAt(0).toUpperCase() + primera.slice(1), ...resto].join(' ') + '.';
}

export function LabMaquinaDeOraciones(props: ActivityProps & { alSalir?: () => void }) {
  const [ronda, setRonda] = useState<0 | 1>(0);
  const [idx, setIdx] = useState(0);
  const [ranuras, setRanuras] = useState<(string | null)[]>(Array(ORACIONES_PARADA1_R1[0].palabras.length).fill(null));
  const [paleta, setPaleta] = useState<TarjetaPalabra[]>(paletaDe(0));
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const [choque, setChoque] = useState(false);

  const [letraIdx, setLetraIdx] = useState(0);
  const [estados, setEstados] = useState<Record<string, EstadoTecla>>({});
  const [mayusPuesta, setMayusPuesta] = useState(false);

  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, fallosSeguidos: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, aviso, ronda, idx, letraIdx, mayusPuesta });
  // Refs escritos SÍNCRONAMENTE en los handlers de puntero: el arrastre y la tira
  // deben estar frescos entre pointerdown y pointerup del mismo gesto (un useEffect
  // llegaría una vuelta tarde y rompería el tap). Escribir refs en handlers —no en
  // el render— es válido para react-hooks/refs.
  const arrastreRef = useRef<Arrastre | null>(null);
  const ranurasRef = useRef<(string | null)[]>(Array(ORACIONES_PARADA1_R1[0].palabras.length).fill(null));
  const ranuraRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Sync de refs de estado FUERA del render (react-hooks/refs).
  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, aviso, ronda, idx, letraIdx, mayusPuesta };
  });
  useEffect(() => {
    sim.current.inicio = Date.now();
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

  /** Cierra la oración actual con el estampado de la máquina y prepara la siguiente, o cambia a la Ronda 2. */
  const avanzarOracion = () => {
    const s = sim.current;
    const listo = vivo.current.idx;
    s.fallosSeguidos = 0;
    s.ocupado = true;
    reproducirTono('save');
    setAviso(estampar(ORACIONES_PARADA1_R1[listo].palabras));
    timers.despues(() => {
      if (vivo.current.terminado) return;
      if (listo === ORACIONES_PARADA1_R1.length - 1) {
        setAviso('Ronda 2 · Escríbela tú');
        propsRef.current.onProgress(0.5);
        timers.despues(() => {
          if (vivo.current.terminado) return;
          setRonda(1);
          setIdx(0);
          setAviso(null);
          s.ocupado = false;
        }, 1600);
      } else {
        ranuraRefs.current = [];
        const siguienteIdx = listo + 1;
        const siguiente = ORACIONES_PARADA1_R1[siguienteIdx];
        setIdx(siguienteIdx);
        const vacias = Array(siguiente.palabras.length).fill(null);
        ranurasRef.current = vacias;
        setRanuras(vacias);
        setPaleta(paletaDe(siguienteIdx));
        setAviso(null);
        propsRef.current.onProgress(siguienteIdx / (ORACIONES_PARADA1_R1.length * 2));
        s.ocupado = false;
      }
    }, 1400);
  };

  const alAgarrar = (e: ReactPointerEvent<HTMLButtonElement>, id: string) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado) return;
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
    let colocoNuevo = false;
    if (idxRanura >= 0 && !(esToque && enRanura === idxRanura)) {
      if (enRanura >= 0) sig[enRanura] = sig[idxRanura];
      else colocoNuevo = true;
      sig[idxRanura] = a.id;
      reproducirTono('select');
    } else if (enRanura >= 0) {
      sig[enRanura] = null;
      reproducirTono('close');
    } else if (esToque) {
      const libre = sig.indexOf(null);
      if (libre < 0) return;
      sig[libre] = a.id;
      colocoNuevo = true;
      reproducirTono('select');
    } else {
      return;
    }
    ranurasRef.current = sig;
    setRanuras(sig);
    if (colocoNuevo) hablar(LINEAS.palabraCorrecta, { una: true });
  };

  /** Palanca ESCRIBIR: valida el orden de la tira completa contra la oración. */
  const escribir = () => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado) return;
    const ranurasAhora = ranurasRef.current;
    if (ranurasAhora.some((r) => !r)) return;
    s.ocupado = true;
    reproducirTono('open');
    const oracion = ORACIONES_PARADA1_R1[v.idx];
    const orden = ranurasAhora as string[];
    const textos = orden.map((id) => paleta.find((p) => p.id === id)?.texto ?? '');
    if (textos.join(' ') === oracion.palabras.join(' ')) {
      reproducirTono('correct');
      hablar(LINEAS.oracionCompleta, { una: true });
      avanzarOracion();
    } else {
      const tocaPista = fallo();
      hablar(tocaPista ? LINEAS.pista : LINEAS.ordenIncorrecto);
      setChoque(true);
      timers.despues(() => {
        setChoque(false);
        if (vivo.current.terminado) return;
        s.ocupado = false;
      }, 900);
    }
  };

  const marcarTecla = (id: string, estado: EstadoTecla, duracion: number) => {
    setEstados((e) => ({ ...e, [id]: estado }));
    timers.despues(() => {
      setEstados((e) => {
        if (e[id] !== estado) return e;
        const siguiente = { ...e };
        delete siguiente[id];
        return siguiente;
      });
    }, duracion);
  };

  const alTocarLetra = (id: string) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 1) return;
    const reto = RETOS_PARADA1_R2[v.idx];
    const letraObjetivo = reto.texto[v.letraIdx] === ' ' ? 'espacio' : reto.texto[v.letraIdx];
    if (id === letraObjetivo) {
      s.ocupado = true;
      reproducirTono('correct');
      marcarTecla(id, 'correcta', 650);
      timers.despues(() => {
        if (vivo.current.terminado) return;
        s.ocupado = false;
        setLetraIdx(v.letraIdx + 1);
      }, 650);
    } else {
      const tocaPista = fallo();
      hablar(tocaPista ? LINEAS.pista : LINEAS.ordenIncorrecto);
      marcarTecla(id, 'incorrecta', 460);
    }
  };

  const ponerMayuscula = () => {
    const s = sim.current;
    const v = vivo.current;
    const reto = RETOS_PARADA1_R2[v.idx];
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 1 || v.mayusPuesta || v.letraIdx < reto.texto.length) return;
    reproducirTono('select');
    setMayusPuesta(true);
  };

  /** Cierra el reto actual con el estampado de la máquina y prepara el siguiente, o termina la máquina. */
  const avanzarReto = () => {
    const v = vivo.current;
    const listo = v.idx;
    reproducirTono('correct');
    hablar(LINEAS.oracionCompleta, { una: true });
    setAviso(estampar(RETOS_PARADA1_R2[listo].texto.split(' ')));
    timers.despues(() => {
      if (vivo.current.terminado) return;
      if (listo + 1 < RETOS_PARADA1_R2.length) {
        setIdx(listo + 1);
        setLetraIdx(0);
        setMayusPuesta(false);
        setAviso(null);
        sim.current.ocupado = false;
      } else {
        setAviso(null);
        terminar(Math.round((Date.now() - sim.current.inicio) / 1000));
      }
    }, 1400);
  };

  const ponerPunto = () => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 1 || !v.mayusPuesta) return;
    s.ocupado = true;
    avanzarReto();
  };

  const repetir = () => {
    const s = sim.current;
    s.ocupado = false;
    s.errores = 0;
    s.fallosSeguidos = 0;
    s.inicio = Date.now();
    ranuraRefs.current = [];
    const vacias = Array(ORACIONES_PARADA1_R1[0].palabras.length).fill(null);
    ranurasRef.current = vacias;
    arrastreRef.current = null;
    setRonda(0);
    setIdx(0);
    setRanuras(vacias);
    setPaleta(paletaDe(0));
    setArrastre(null);
    setChoque(false);
    setLetraIdx(0);
    setEstados({});
    setMayusPuesta(false);
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
        key={`${idx}-${i}`}
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

  const enR1 = ronda === 0;
  const retoActual = RETOS_PARADA1_R2[idx];
  const escrito = retoActual.texto.slice(0, letraIdx);
  const escritoCompleto = letraIdx >= retoActual.texto.length;
  const mostrado = mayusPuesta ? escrito.charAt(0).toUpperCase() + escrito.slice(1) : escrito;

  const marcador = enR1
    ? { etiqueta: 'Oraciones', valor: `${idx + 1}/${ORACIONES_PARADA1_R1.length}` }
    : { etiqueta: 'Retos', valor: `${idx + 1}/${RETOS_PARADA1_R2.length}` };

  const consigna = enR1
    ? { titulo: `Oración ${idx + 1}`, texto: 'Arrastra las palabras a la tira en el orden correcto y jala la palanca ESCRIBIR.' }
    : {
        titulo: retoActual.texto.toUpperCase(),
        texto: escritoCompleto
          ? 'Coloca la mayúscula al inicio y el punto al final.'
          : `Teclea ${
              retoActual.texto[letraIdx] === ' ' ? 'un espacio' : `la letra "${retoActual.texto[letraIdx].toUpperCase()}"`
            } en el mapa (letra ${letraIdx + 1} de ${retoActual.texto.length}).`,
      };

  const bloqueado = terminado || !!aviso;

  // ── Escena 3D ──
  const escena = enR1 ? (
    <>
      <Consigna3D titulo={consigna.titulo} texto={consigna.texto} position={[0, MOSTRADOR_Y + 2.45, -0.3]} />
      <PanelBastidor3D position={[0, MOSTRADOR_Y + 0.95, 0.8]} ancho={3.2} alto={2.1}>
        <div className="maquina3d-orden">
          <div className="pasos-bandeja" aria-label="Palabras disponibles">
            {listaBandeja.map((t) => tarjetaArrastrable(t))}
          </div>
          <div className="pasos-banda" aria-label="Tira de la oración">
            {tira}
          </div>
        </div>
      </PanelBastidor3D>
    </>
  ) : (
    <>
      <Consigna3D titulo={consigna.titulo} texto={consigna.texto} position={[0, MOSTRADOR_Y + 2.45, -0.3]} />
      <PanelBastidor3D position={[0, MOSTRADOR_Y + 0.95, 0.8]} ancho={3.55} alto={2.15}>
        <div className="maquina3d-escribe">
          <div className="maquina-tira-papel">
            <span className="maquina-tira-texto">
              {mostrado}
              {!escritoCompleto && <span className="maquina-tira-cursor" aria-hidden />}
            </span>
          </div>
          <TecladoMapa
            objetivo={null}
            estados={estados}
            deshabilitada={escritoCompleto}
            onTecla={escritoCompleto ? undefined : alTocarLetra}
          />
        </div>
      </PanelBastidor3D>
    </>
  );

  // ── Respaldo HTML (sin WebGL): mismos botones y aria-labels ──
  const respaldo = (
    <div className="maquina-tablero">
      <div className="pasos-consigna">
        <strong>{consigna.titulo}</strong>
        <span>{consigna.texto}</span>
      </div>
      {enR1 ? (
        <>
          <div className="pasos-bandeja" aria-label="Palabras disponibles">
            {listaBandeja.map((t) => tarjetaArrastrable(t))}
          </div>
          <div className="pasos-banda" aria-label="Tira de la oración">
            {tira}
          </div>
        </>
      ) : (
        <>
          <div className="maquina-tira-papel">
            <span className="maquina-tira-texto">
              {mostrado}
              {!escritoCompleto && <span className="maquina-tira-cursor" aria-hidden />}
            </span>
          </div>
          <TecladoMapa
            objetivo={null}
            estados={estados}
            deshabilitada={escritoCompleto}
            onTecla={escritoCompleto ? undefined : alTocarLetra}
          />
        </>
      )}
    </div>
  );

  // ── Charola física del gabinete (palanca / últimos toques). Se oculta al terminar. ──
  const base = terminado ? undefined : enR1 ? (
    <>
      <span className="gabinete-nota">La palanca de la máquina</span>
      <button
        type="button"
        className={`palanca-probar${ranuras.every(Boolean) ? '' : ' apagada'}`}
        onClick={escribir}
        aria-label="Escribir la oración"
      >
        <span className="palanca-tirador" aria-hidden />
        ESCRIBIR
      </button>
    </>
  ) : (
    <>
      <span className="gabinete-nota">Últimos toques</span>
      <div className="safari-opciones" role="group" aria-label="Mayúscula y punto">
        <button
          type="button"
          className={`safari-opcion${mayusPuesta ? ' hecha' : ''}`}
          onClick={ponerMayuscula}
          disabled={!escritoCompleto || mayusPuesta}
        >
          Mayúscula
        </button>
        <button type="button" className="safari-opcion" onClick={ponerPunto} disabled={!mayusPuesta}>
          Punto
        </button>
      </div>
    </>
  );

  return (
    <ArcadeSala3D
      titulo="La máquina de oraciones"
      pasoEtiqueta="Ronda"
      pasoActual={ronda + 1}
      pasosTotal={2}
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
              insigniaNombre: 'Constructor de oraciones',
              insigniaEmoji: '🖋️',
              titulo: '¡Oraciones completas!',
              detalle: 'Ordenaste palabras y escribiste oraciones completas, con mayúscula y punto.',
              resumen: [
                { etiqueta: 'Oraciones', valor: `${ORACIONES_PARADA1_R1.length + RETOS_PARADA1_R2.length}` },
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

export default LabMaquinaDeOraciones;
