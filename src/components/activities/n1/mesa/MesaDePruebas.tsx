'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../mision/audio';
import { useBit } from '../arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import {
  AVERIAS,
  ENCARGOS,
  LINEAS,
  PARTES,
  PARTES_ORDEN,
  etiquetaParte,
  feedbackAveria,
  feedbackEncargo,
  puntajeMesa,
  type ParteId,
  type SintomaVisible,
} from './datosMesa';
import {
  CableadoMesa3D,
  Gabinete3D,
  Impresora3D,
  Monitor3D,
  ParteEnMesa,
  PlacaEncargos3D,
  Raton3D,
  Regulador3D,
  Teclado3D,
  type EstadoParte,
} from './piezasMesa3D';

/**
 * N1·U1 «Conoce las partes» — FASES 2 y 3 (documento §32.1).
 *
 * La fase 1 (Reconoce) es el laboratorio portado, que se conserva íntegro. Aquí
 * empieza lo que el alumno todavía no sabía hacer:
 *
 *   · Fase 2 · APLICA — seis encargos escritos en la placa empotrada de la mesa.
 *     El alumno ya no busca un nombre, busca QUIÉN HACE ESE TRABAJO.
 *   · Fase 3 · DIAGNOSTICA — cuatro averías. La mesa se rompe de verdad delante
 *     de él (la pantalla se apaga, las teclas se mueren, la hoja sale rayada, se
 *     va la energía entera) y él tiene que nombrar la parte culpable.
 *
 * Reglas del ESTÁNDAR ROBUSTO v2 que este archivo cumple a la letra:
 *   — La mecánica se eligió por el concepto: "cada parte tiene un trabajo" se
 *     enseña con encargos, y "sé cuál falla" se enseña con síntomas visibles, no
 *     con otro quiz de opción múltiple pintado distinto.
 *   — Feedback específico SIEMPRE (ver datosMesa.ts). "Inténtalo de nuevo" no
 *     existe en este archivo.
 *   — Ayuda incorporada: al SEGUNDO fallo del mismo encargo aparece la pista
 *     escrita en la placa y la pieza correcta respira con un latido suave. Nunca
 *     se resuelve sola.
 *
 * PLACA — por qué el feedback del error NO se imprime aquí (medido, no supuesto).
 * El herraje físico de la placa proyecta a 616..757 px: 141 px de alto, y dentro
 * tiene que quedar margen de aluminio visible o deja de parecer empotrada. Con el
 * enunciado + el eco del error el panel medía 155 px (607..762): ya desbordaba por
 * arriba y por abajo. Añadiéndole además la pista escrita del doc §32.1 se iba a
 * 195 px, más allá del borde inferior del lienzo (781). Se probaron seis variantes
 * en el navegador —quitar la base, apretar interlineado y cuerpos, bajar el
 * enunciado a 0.94rem, ensanchar la placa a 27rem— y la mejor seguía en 142 px.
 * Tampoco había salida por geometría: la bisagra de la placa es su borde SUPERIOR,
 * así que agrandar FONDO_PLACA sólo la alarga hacia abajo y el fondo del lienzo
 * limita la ganancia a ~20 px; enderezarla gana como mucho un 4%.
 *
 * Así que la información se repartió por oficio en vez de apretarla:
 *   · la PLACA es el tablero del encargo — fase, enunciado y, tras dos fallos, la
 *     pista escrita. Reacciona al error con color y luz, no con más texto;
 *   · BIT responde al error — dice Y escribe en su cartel la base del error
 *     completada con el mensaje específico, así que nada queda sólo en audio.
 * El doc §32.1 pide por escrito el encargo y el síntoma (eso vive en la placa) y
 * feedback específico por error (eso vive en Bit, en pantalla y hablado).
 */

type Fase = 'aplica' | 'diagnostica';

const TOTAL_APLICA = ENCARGOS.length; // 6
const TOTAL_DIAGNOSTICA = AVERIAS.length; // 4
const TOTAL = TOTAL_APLICA + TOTAL_DIAGNOSTICA; // 10

const ESTADOS_NORMALES: Record<ParteId, EstadoParte> = {
  monitor: 'normal',
  teclado: 'normal',
  raton: 'normal',
  gabinete: 'normal',
  impresora: 'normal',
  regulador: 'normal',
};

const ESTADOS_ROTULO: Record<ParteId, EstadoParte> = {
  monitor: 'rotulo',
  teclado: 'rotulo',
  raton: 'rotulo',
  gabinete: 'rotulo',
  impresora: 'rotulo',
  regulador: 'rotulo',
};

/** Qué pieza deja de funcionar en cada avería (§32.1: el síntoma se VE). */
function vitalidad(sintoma: SintomaVisible | null) {
  const sinEnergia = sintoma === 'sin-energia';
  return {
    monitorVivo: !sinEnergia && sintoma !== 'pantalla-negra',
    tecladoVivo: !sinEnergia && sintoma !== 'teclas-muertas',
    gabineteVivo: !sinEnergia,
    impresoraViva: !sinEnergia,
    reguladorVivo: !sinEnergia,
    hojaRayada: sintoma === 'hoja-rayada',
  };
}

/** Resalta dentro del texto el trozo que decide la respuesta. */
function resaltar(texto: string, resalte: string): ReactNode {
  const i = texto.toLowerCase().indexOf(resalte.toLowerCase());
  if (i < 0) return texto;
  return (
    <>
      {texto.slice(0, i)}
      <em className="mesa3d-placa-clave">{texto.slice(i, i + resalte.length)}</em>
      {texto.slice(i + resalte.length)}
    </>
  );
}

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export interface PropsMesa extends ActivityProps {
  /** Errores que el alumno ya acumuló en la fase 1; entran al puntaje global. */
  erroresPrevios?: number;
  alSalir?: () => void;
}

export function MesaDePruebas(props: PropsMesa) {
  const { erroresPrevios = 0 } = props;

  const [fase, setFase] = useState<Fase>('aplica');
  const [idx, setIdx] = useState(0);
  const [estados, setEstados] = useState<Record<ParteId, EstadoParte>>(ESTADOS_NORMALES);
  const [eco, setEco] = useState<{ tono: 'ok' | 'mal'; texto: string } | null>(null);
  const [pista, setPista] = useState(false);
  const [cierre, setCierre] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [resueltas, setResueltas] = useState(0);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.entrarAplica);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, fallosRonda: 0, inicio: 0, resueltas: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, fase, idx, cierre });

  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, fase, idx, cierre };
  });

  useEffect(() => {
    sim.current.inicio = Date.now();
  }, []);

  const puntaje = () => puntajeMesa(erroresPrevios + sim.current.errores);

  const terminar = (tiempoSegundos: number) => {
    const score = puntaje();
    propsRef.current.onProgress(1);
    propsRef.current.onScore(score);
    propsRef.current.onComplete({
      score,
      stars: 3,
      xp: score,
      errores: erroresPrevios + sim.current.errores,
      tiempoSegundos,
    });
    setTiempoFinal(tiempoSegundos);
    setErroresFinal(erroresPrevios + sim.current.errores);
    setTerminado(true);
  };

  /**
   * Cierre del documento: «el escritorio se enciende de golpe, las seis partes
   * se etiquetan a la vez con su trabajo y se entrega la insignia».
   */
  const encenderTodo = (tiempoSegundos: number) => {
    setCierre(true);
    setEstados(ESTADOS_ROTULO);
    setEco(null);
    setPista(false);
    reproducirTono('power');
    setAviso('¡La mesa completa!');
    hablar(LINEAS.cierre);
    timers.despues(() => {
      reproducirTono('complete');
      setAviso(null);
      terminar(tiempoSegundos);
    }, 2600);
  };

  const elegir = (id: ParteId) => {
    const v = vivo.current;
    if (v.terminado || v.cierre || sim.current.ocupado) return;

    const enAplica = v.fase === 'aplica';
    const ronda = enAplica ? ENCARGOS[v.idx] : AVERIAS[v.idx];

    // ── Error ────────────────────────────────────────────────────────────────
    if (id !== ronda.correcta) {
      reproducirTono('error');
      sim.current.errores += 1;
      sim.current.fallosRonda += 1;
      propsRef.current.onScore(puntaje());

      // Doc §32.1: la base del error «se completa con el mensaje específico».
      // Las dos mitades van juntas en la boca de Bit, que es quien responde al
      // error; la placa sólo cambia de color y, tras el segundo fallo, escribe
      // la pista. (Antes la base la imprimía la placa: ver nota "PLACA".)
      const especifico = enAplica
        ? feedbackEncargo(ENCARGOS[v.idx], id)
        : feedbackAveria(AVERIAS[v.idx], id);
      const texto = `${LINEAS.baseDelError} ${especifico}`;
      setEstados({ ...ESTADOS_NORMALES, [id]: 'mal' });
      setEco({ tono: 'mal', texto });
      hablar(texto);

      const conPista = sim.current.fallosRonda >= 2;
      timers.despues(() => {
        if (conPista) {
          // La pista señala, no resuelve: la pieza correcta respira y la placa
          // dice qué buscar, pero el alumno sigue teniendo que tocarla.
          setPista(true);
          setEstados({ ...ESTADOS_NORMALES, [ronda.correcta]: 'pista' });
        } else {
          setEstados(ESTADOS_NORMALES);
        }
      }, 520);
      return;
    }

    // ── Acierto ──────────────────────────────────────────────────────────────
    sim.current.ocupado = true;
    sim.current.fallosRonda = 0;
    sim.current.resueltas += 1;
    reproducirTono('correct');
    setEstados({ ...ESTADOS_NORMALES, [id]: 'ok' });
    setPista(false);

    const felicitacion = enAplica ? LINEAS.aciertoAplica : LINEAS.aciertoDiagnostica;
    setEco({ tono: 'ok', texto: felicitacion });
    hablar(felicitacion);

    const hechas = sim.current.resueltas;
    setResueltas(hechas);
    propsRef.current.onScore(puntaje());
    propsRef.current.onProgress(hechas / TOTAL);

    // Última avería → cierre con la mesa entera encendida.
    if (!enAplica && v.idx + 1 === TOTAL_DIAGNOSTICA) {
      timers.despues(() => {
        sim.current.ocupado = false;
        encenderTodo(Math.round((Date.now() - sim.current.inicio) / 1000));
      }, 1200);
      return;
    }

    // Último encargo → salto a la fase 3.
    if (enAplica && v.idx + 1 === TOTAL_APLICA) {
      reproducirTono('save');
      setAviso('Fase 3 · Ahora eres el técnico');
      timers.despues(() => {
        setAviso(null);
        setEstados(ESTADOS_NORMALES);
        setEco(null);
        setFase('diagnostica');
        setIdx(0);
        sim.current.ocupado = false;
        hablar(LINEAS.entrarDiagnostica);
      }, 1800);
      return;
    }

    timers.despues(() => {
      setEstados(ESTADOS_NORMALES);
      setEco(null);
      setIdx(v.idx + 1);
      sim.current.ocupado = false;
    }, 1200);
  };

  const repetir = () => {
    timers.limpiar();
    sim.current = { ocupado: false, errores: 0, fallosRonda: 0, inicio: Date.now(), resueltas: 0 };
    setFase('aplica');
    setIdx(0);
    setEstados(ESTADOS_NORMALES);
    setEco(null);
    setPista(false);
    setCierre(false);
    setAviso(null);
    setResueltas(0);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.entrarAplica);
  };

  // ── Estado visible de la mesa ──────────────────────────────────────────────
  const enAplica = fase === 'aplica';
  const rondaAplica = ENCARGOS[Math.min(idx, TOTAL_APLICA - 1)];
  const rondaAveria = AVERIAS[Math.min(idx, TOTAL_DIAGNOSTICA - 1)];
  const ronda = enAplica ? rondaAplica : rondaAveria;

  const sintoma: SintomaVisible | null = !enAplica && !cierre && !terminado ? rondaAveria.sintoma : null;
  const { monitorVivo, tecladoVivo, gabineteVivo, impresoraViva, reguladorVivo, hojaRayada } = vitalidad(sintoma);

  /**
   * La pista manda sobre el eco: cuando la ayuda ya se encendió, la placa se
   * queda en ámbar de "modo ayuda". El rojo del error dura sólo los 520 ms que
   * van del clic equivocado al latido de la pieza correcta.
   */
  const tonoPlaca = pista ? 'pista' : (eco?.tono ?? 'normal');
  const bloqueado = terminado || cierre;

  /**
   * Rótulo de una línea, sólo para el respaldo plano sin WebGL: ahí el doc §32.1
   * («Accesibilidad… los mismos botones y aria-label por parte») pide la cadena
   * completa. En la escena 3D la chapa se parte en dos renglones (`chip` +
   * `oficio`), porque una sola línea «Nombre · trabajo» obligaba a chapas de
   * 20rem que se pisaban entre ellas en el cierre.
   */
  const rotulo = (id: ParteId) => (cierre || terminado ? `${PARTES[id].nombre} · ${PARTES[id].trabajo}` : PARTES[id].nombre);

  const panelPlaca = (
    <div className={`mesa3d-placa mesa3d-placa--${tonoPlaca}`}>
      {cierre || terminado ? (
        /* La placa NO repite aquí LINEAS.cierre: esa frase es de Bit (doc §32.1,
           «Ya conoces las partes…» está listada como su cierre hablado). Si la
           placa la imprimiera, el alumno leería lo mismo dos veces en pantalla.
           La placa hace lo que le toca como tablero del encargo: declarar que la
           mesa quedó completa y acusar la insignia. */
        <>
          <p className="mesa3d-placa-fase">Mesa completa</p>
          <p className="mesa3d-placa-texto">Las seis partes, etiquetadas con su trabajo.</p>
          <p className="mesa3d-placa-insignia">
            <span aria-hidden="true">🔍</span> Insignia entregada · Explorador tecnológico
          </p>
        </>
      ) : (
        <>
          <p className="mesa3d-placa-fase">
            {enAplica ? `Encargo ${idx + 1} de ${TOTAL_APLICA}` : `Avería ${idx + 1} de ${TOTAL_DIAGNOSTICA}`}
          </p>
          <p className="mesa3d-placa-texto">{resaltar(ronda.texto, ronda.resalte)}</p>
          {/* Reparto medido de la respuesta al error (ver nota "PLACA" abajo):
              el feedback específico lo dice y lo escribe Bit en su cartel; aquí
              sólo entra la pista escrita que exige el doc §32.1. Antes iba
              `pista && !eco`, y como el eco nunca se limpiaba en el error, la
              pista escrita no llegaba a pintarse nunca. */}
          {pista && (
            <p className="mesa3d-placa-pista">
              Pista: busca la parte que <strong>{ronda.necesita}</strong>.
            </p>
          )}
        </>
      )}
    </div>
  );

  const parte = (id: ParteId, hijo: ReactNode) => (
    <ParteEnMesa
      key={id}
      parte={id}
      estado={estados[id]}
      reduceMotion={reduceMotion}
      disabled={bloqueado}
      onSelect={() => elegir(id)}
      chip={PARTES[id].nombre}
      /* Doc §32.1: en el cierre «las seis partes se etiquetan a la vez con su
         trabajo». Va en su propio renglón, no pegado al nombre. */
      oficio={cierre || terminado ? PARTES[id].trabajo : undefined}
      ariaLabel={etiquetaParte(id)}
      emoji={PARTES[id].emoji}
    >
      {hijo}
    </ParteEnMesa>
  );

  const escena = (
    <>
      <CableadoMesa3D />
      {parte('monitor', <Monitor3D viva={monitorVivo} reduceMotion={reduceMotion} />)}
      {parte('teclado', <Teclado3D vivo={tecladoVivo} reduceMotion={reduceMotion} />)}
      {parte('raton', <Raton3D reduceMotion={reduceMotion} />)}
      {parte('gabinete', <Gabinete3D vivo={gabineteVivo} reduceMotion={reduceMotion} />)}
      {parte('impresora', <Impresora3D viva={impresoraViva} rayada={hojaRayada} />)}
      {parte('regulador', <Regulador3D vivo={reguladorVivo} reduceMotion={reduceMotion} />)}
      <PlacaEncargos3D tono={tonoPlaca} reduceMotion={reduceMotion}>
        {panelPlaca}
      </PlacaEncargos3D>
    </>
  );

  // Respaldo sin WebGL: mismas cadenas, mismos aria-label, misma mecánica.
  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">
        {enAplica ? `Encargo ${idx + 1} de ${TOTAL_APLICA}` : `Avería ${idx + 1} de ${TOTAL_DIAGNOSTICA}`}
      </p>
      <p className="mesa3d-respaldo-texto">{ronda.texto}</p>
      {eco && <p className={`mesa3d-respaldo-eco mesa3d-respaldo-eco--${eco.tono}`}>{eco.texto}</p>}
      {/* Aquí sí caben las dos: el respaldo plano es una columna que crece, no
          una placa metida en un herraje de 141 px. */}
      {pista && <p className="mesa3d-respaldo-pista">Pista: busca la parte que {ronda.necesita}.</p>}
      <div className="escena3d-respaldo-fila">
        {PARTES_ORDEN.map((id) => (
          <button
            key={id}
            type="button"
            // Modificador siempre presente, igual que en la chapa 3D: el
            // realce del cursor sólo repinta el botón en estado `normal`.
            className={`mesa3d-respaldo-parte mesa3d-respaldo-parte--${estados[id]}`}
            aria-label={etiquetaParte(id)}
            disabled={bloqueado}
            onClick={() => elegir(id)}
          >
            <span aria-hidden="true">{PARTES[id].emoji}</span>
            {rotulo(id)}
          </button>
        ))}
      </div>
    </div>
  );

  const hechas = terminado ? TOTAL : resueltas;

  return (
    <ArcadeSala3D
      titulo="Conoce las partes · La mesa de pruebas"
      pasoEtiqueta={enAplica ? 'Encargo' : 'Avería'}
      pasoActual={Math.min(idx + 1, enAplica ? TOTAL_APLICA : TOTAL_DIAGNOSTICA)}
      pasosTotal={enAplica ? TOTAL_APLICA : TOTAL_DIAGNOSTICA}
      marcadorEtiqueta="Resueltos"
      marcadorValor={`${hechas}/${TOTAL}`}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={
        <p className="gabinete-nota">
          {enAplica
            ? 'Fase 2 · Aplica — cada parte tiene un trabajo distinto'
            : 'Fase 3 · Diagnostica — mira la mesa: el síntoma está a la vista'}
        </p>
      }
      final={
        terminado
          ? {
              insigniaNombre: 'Explorador tecnológico',
              insigniaEmoji: '🔍',
              titulo: '¡Mesa dominada!',
              detalle:
                'Reconociste las 6 partes, resolviste 6 encargos y encontraste la parte culpable en 4 fallas.',
              resumen: [
                { etiqueta: 'Encargos', valor: `${TOTAL_APLICA}` },
                { etiqueta: 'Averías', valor: `${TOTAL_DIAGNOSTICA}` },
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

export default MesaDePruebas;
