'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { Consigna3D, PanelBastidor3D } from '../../arcade3d/piezas3d';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { TableroRobot } from './TableroRobot';
import { Tablero3D } from './Tablero3D';
import { BloqueSimple, Dir, EMOJI_BLOQUE, EscenarioError, ESCENARIOS_PARADA2, ItemPrograma, NOMBRE_BLOQUE, ejecutarPrograma } from './robotPrograma';

/**
 * «Caza el error» (N2·U4, parada 2) — documento §12.2, en WebGL 3D.
 *
 * Sobre el mismo tablero-cuadrícula del robot (el `Tablero3D` compartido por las
 * tres paradas de la unidad) aparece una tira de programa ya armada con un bloque
 * equivocado. El alumno toca el bloque culpable; en Ronda 2 además elige su
 * reemplazo entre tres opciones y jala la palanca PROBAR para ver al robot llegar
 * a la meta.
 * R1 «¿Cuál bloque está mal?»: solo señalar el bloque culpable.
 * R2 «Corrígelo y prueba»: señalar, reemplazar y probar.
 * Las líneas de Bit son las del documento maestro (§12.2), verbatim.
 *
 * El tablero-robot se monta como geometría 3D dentro del gabinete; la tira de
 * bloques y las opciones de reemplazo viven en un billboard <Html> sobre un
 * bastidor; la palanca PROBAR está en la charola física del gabinete, nunca como
 * overlay flotante.
 */

const LINEAS = {
  inicio: 'Algo salió mal… mi robot no llegó. ¿Me ayudas a cazar el bug?',
  bugEncontrado: '¡Ese es el bug! Justo el bloque que no cuadraba.',
  bloqueOk: 'Mmm, ese bloque está bien. Sigue el camino con cuidado, bloque por bloque.',
  corregido: '¡Corregido! Prueba de nuevo… ¡y esta vez sí llega!',
  pista: 'Sigue al robot con el dedo, bloque por bloque, hasta ver dónde se equivoca.',
  completar: '¡Bugs cazados! Ya sabes revisar con calma y corregir.',
} as const;

const AVISOS: Record<number, string> = {
  3: 'Ronda 2 · Corrígelo y prueba',
};

const TOTAL = ESCENARIOS_PARADA2.length;

function estadoFalloInicial(escenario: EscenarioError): {
  pos: { c: number; r: number };
  dir: Dir;
  estado: 'normal' | 'choque';
} {
  const items: ItemPrograma[] = escenario.mostrado.map((tipo, i) => ({ id: `m${i}`, tipo }));
  const resultado = ejecutarPrograma(escenario.tablero, items);
  const ultimo = resultado.pasos[resultado.pasos.length - 1];
  const pos = ultimo ? { c: ultimo.c, r: ultimo.r } : escenario.tablero.inicio;
  const dir = ultimo ? ultimo.dir : escenario.tablero.dirInicial;
  return { pos, dir, estado: resultado.choque ? 'choque' : 'normal' };
}

export function LabCazaElError(props: ActivityProps & { alSalir?: () => void }) {
  const inicial = ESCENARIOS_PARADA2[0];
  const estadoInicial = estadoFalloInicial(inicial);
  const [nivelIdx, setNivelIdx] = useState(0);
  const [programa, setPrograma] = useState<BloqueSimple[]>(inicial.mostrado);
  const [culpaSenalada, setCulpaSenalada] = useState(false);
  const [corregido, setCorregido] = useState(false);
  const [pos, setPos] = useState(estadoInicial.pos);
  const [dir, setDir] = useState<Dir>(estadoInicial.dir);
  const [estado, setEstado] = useState<'normal' | 'choque' | 'exito'>(estadoInicial.estado);
  const [sacudida, setSacudida] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, fallosSeguidos: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, aviso, nivelIdx, culpaSenalada, corregido, programa });

  // Sync de refs de estado FUERA del render (react-hooks/refs).
  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, aviso, nivelIdx, culpaSenalada, corregido, programa };
  });
  useEffect(() => {
    sim.current.inicio = Date.now();
  }, []);

  const nivel = ESCENARIOS_PARADA2[nivelIdx];
  const ronda = nivelIdx < 4 ? 0 : 1;

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

  /** Cierra la tira actual y prepara la siguiente (o termina la máquina). */
  const avanzarNivel = (tiempoSegundos: number) => {
    const s = sim.current;
    const listo = vivo.current.nivelIdx;
    s.fallosSeguidos = 0;
    if (listo === TOTAL - 1) {
      propsRef.current.onProgress(1);
      terminar(tiempoSegundos);
      return;
    }
    s.ocupado = true;
    const siguienteIdx = listo + 1;
    const avanzar = () => {
      if (vivo.current.terminado) return;
      const nivelSig = ESCENARIOS_PARADA2[siguienteIdx];
      const est = estadoFalloInicial(nivelSig);
      setPrograma(nivelSig.mostrado);
      setCulpaSenalada(false);
      setCorregido(false);
      setPos(est.pos);
      setDir(est.dir);
      setEstado(est.estado);
      setNivelIdx(siguienteIdx);
      setAviso(null);
      s.ocupado = false;
      propsRef.current.onProgress(siguienteIdx / TOTAL);
    };
    if (AVISOS[listo]) {
      reproducirTono('save');
      setAviso(AVISOS[listo]);
      timers.despues(avanzar, 1600);
    } else {
      timers.despues(avanzar, 500);
    }
  };

  /** Toca un bloque de la tira: ¿es el bug? */
  const tocarBloque = (idx: number) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.culpaSenalada) return;
    if (idx === nivel.culpaIdx) {
      reproducirTono('correct');
      hablar(LINEAS.bugEncontrado, { una: true });
      s.fallosSeguidos = 0;
      setCulpaSenalada(true);
      if (!nivel.opciones) {
        s.ocupado = true;
        timers.despues(() => avanzarNivel(Math.round((Date.now() - s.inicio) / 1000)), 1100);
      }
    } else {
      const tocaPista = fallo();
      setSacudida(`m${idx}`);
      timers.despues(() => setSacudida(null), 420);
      hablar(tocaPista ? LINEAS.pista : LINEAS.bloqueOk);
    }
  };

  /** Ronda 2: elige el bloque correcto para reemplazar al culpable. */
  const tocarOpcion = (tipo: BloqueSimple) => {
    const v = vivo.current;
    if (v.terminado || v.aviso || sim.current.ocupado) return;
    if (!v.culpaSenalada || v.corregido) return;
    if (tipo === nivel.correccion) {
      reproducirTono('select');
      setPrograma((p) => p.map((b, i) => (i === nivel.culpaIdx ? tipo : b)));
      setCorregido(true);
      setEstado('normal');
      setPos(nivel.tablero.inicio);
      setDir(nivel.tablero.dirInicial);
    } else {
      const tocaPista = fallo();
      hablar(tocaPista ? LINEAS.pista : LINEAS.bloqueOk);
    }
  };

  /** Palanca PROBAR (solo Ronda 2, tras corregir): corre la tira ya arreglada. */
  const probar = () => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || !v.corregido) return;
    s.ocupado = true;
    reproducirTono('open');
    const items: ItemPrograma[] = v.programa.map((tipo, i) => ({ id: `f${i}`, tipo }));
    const resultado = ejecutarPrograma(nivel.tablero, items);
    const pasos = resultado.pasos;
    setPos(nivel.tablero.inicio);
    setDir(nivel.tablero.dirInicial);
    setEstado('normal');
    for (let i = 0; i < pasos.length; i += 1) {
      timers.despues(() => {
        if (vivo.current.terminado) return;
        reproducirTono('select');
        setPos({ c: pasos[i].c, r: pasos[i].r });
        setDir(pasos[i].dir);
      }, 400 + i * 550);
    }
    timers.despues(() => {
      if (vivo.current.terminado) return;
      if (resultado.exito) {
        setEstado('exito');
        reproducirTono('correct');
        hablar(LINEAS.corregido, { una: true });
        timers.despues(() => avanzarNivel(Math.round((Date.now() - s.inicio) / 1000)), 900);
      } else {
        setEstado('choque');
        const tocaPista = fallo();
        hablar(tocaPista ? LINEAS.pista : LINEAS.bloqueOk);
        timers.despues(() => {
          if (vivo.current.terminado) return;
          setEstado('normal');
          setPos(nivel.tablero.inicio);
          setDir(nivel.tablero.dirInicial);
          s.ocupado = false;
        }, 900);
      }
    }, 400 + pasos.length * 550 + 250);
  };

  const repetir = () => {
    const s = sim.current;
    s.ocupado = false;
    s.errores = 0;
    s.fallosSeguidos = 0;
    s.inicio = Date.now();
    const nivel0 = ESCENARIOS_PARADA2[0];
    const est = estadoFalloInicial(nivel0);
    setNivelIdx(0);
    setPrograma(nivel0.mostrado);
    setCulpaSenalada(false);
    setCorregido(false);
    setPos(est.pos);
    setDir(est.dir);
    setEstado(est.estado);
    setSacudida(null);
    setAviso(null);
    setTerminado(false);
    setErroresFinal(0);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const instruccion = !culpaSenalada
    ? 'Toca, en la tira, el bloque que crees que es el bug.'
    : ronda === 0
      ? '¡Bien visto! Sigamos con la siguiente tira.'
      : corregido
        ? 'Jala la palanca PROBAR y mira si el robot llega a la meta.'
        : 'Elige el bloque correcto para reemplazarlo.';

  const bloqueado = terminado || !!aviso;

  const tira = programa.map((tipo, i) => {
    const senalado = culpaSenalada && i === nivel.culpaIdx;
    const clases = ['tarjeta-paso'];
    if (senalado) clases.push(corregido ? 'hecha' : 'culpable');
    if (sacudida === `m${i}`) clases.push('sacudida');
    return (
      <button
        key={`${nivelIdx}-${i}`}
        type="button"
        className={clases.join(' ')}
        onClick={() => tocarBloque(i)}
        aria-label={`Bloque ${i + 1}: ${NOMBRE_BLOQUE[tipo]}`}
      >
        <span className="tarjeta-emoji" aria-hidden>
          {EMOJI_BLOQUE[tipo]}
        </span>
        <span className="tarjeta-texto">{NOMBRE_BLOQUE[tipo]}</span>
      </button>
    );
  });

  /** Riel de bloques: opciones de reemplazo (R2) + la tira del programa. */
  const renderRiel = () => (
    <>
      {ronda === 1 && culpaSenalada && !corregido && nivel.opciones && (
        <div className="pasos-bandeja" aria-label="Opciones para reemplazar el bloque">
          {nivel.opciones.map((tipo, i) => (
            <button
              key={`op-${nivelIdx}-${i}-${tipo}`}
              type="button"
              className="tarjeta-paso"
              onClick={() => tocarOpcion(tipo)}
              aria-label={`Reemplazar por: ${NOMBRE_BLOQUE[tipo]}`}
            >
              <span className="tarjeta-emoji" aria-hidden>
                {EMOJI_BLOQUE[tipo]}
              </span>
              <span className="tarjeta-texto">{NOMBRE_BLOQUE[tipo]}</span>
            </button>
          ))}
        </div>
      )}
      <div className="pasos-banda" aria-label="Tira de programa">
        {tira}
      </div>
    </>
  );

  const mostrarBandeja = ronda === 1 && culpaSenalada && !corregido && !!nivel.opciones;

  // ── Escena 3D: tablero-robot + tira/opciones montadas sobre un bastidor ──
  const escena = (
    <>
      <Consigna3D titulo={`Tira ${nivelIdx + 1}`} texto={instruccion} position={[0, MOSTRADOR_Y + 2.45, -0.3]} />
      <Tablero3D
        tablero={nivel.tablero}
        pos={pos}
        dir={dir}
        estado={estado}
        reduceMotion={reduceMotion}
        position={[0, MOSTRADOR_Y + 1.35, -0.05]}
      />
      <PanelBastidor3D position={[0, MOSTRADOR_Y + 0.05, 0.95]} ancho={3.4} alto={mostrarBandeja ? 1.6 : 1.1}>
        <div className="tablero3d-riel">{renderRiel()}</div>
      </PanelBastidor3D>
    </>
  );

  // ── Respaldo HTML (sin WebGL): mismo tablero plano y mismos botones/aria-labels ──
  const respaldo = (
    <div className="robot-tablero-raiz">
      <div className="pasos-consigna">
        <strong>Tira {nivelIdx + 1}</strong>
        <span>{instruccion}</span>
      </div>
      <div className="pasos-escena">
        <TableroRobot tablero={nivel.tablero} pos={pos} dir={dir} estado={estado} />
      </div>
      {renderRiel()}
    </div>
  );

  // ── Charola física del gabinete: la lupa de Bit + palanca PROBAR (solo R2). ──
  const base = terminado ? undefined : (
    <>
      <span className="gabinete-nota">La lupa de Bit</span>
      {ronda === 1 && (
        <button
          type="button"
          className={`palanca-probar${corregido ? '' : ' apagada'}`}
          onClick={probar}
          aria-label="Probar el camino corregido"
        >
          <span className="palanca-tirador" aria-hidden />
          PROBAR
        </button>
      )}
    </>
  );

  return (
    <ArcadeSala3D
      titulo="Caza el error"
      pasoEtiqueta="Ronda"
      pasoActual={ronda + 1}
      pasosTotal={2}
      marcadorEtiqueta="Bugs"
      marcadorValor={terminado ? `${TOTAL}/${TOTAL}` : `${nivelIdx}/${TOTAL}`}
      bit={linea}
      paleta={{ acento: '#F97316', acento2: '#FB7185' }}
      activa={!bloqueado}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      base={base}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Cazador de bugs',
              insigniaEmoji: '🐞',
              titulo: '¡Bugs cazados!',
              detalle: 'Encontraste ocho bloques equivocados y corregiste el camino del robot cada vez.',
              resumen: [
                { etiqueta: 'Bugs', valor: `${TOTAL}` },
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

export default LabCazaElError;
