'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../mision/audio';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { ArcadeSala, AvisoRonda, useBit } from './ArcadeSala';

/**
 * Máquina 4 · El circuito de teclas gigantes (documento §3.4). Tres
 * estaciones, una tecla protagonista por estación: Espacio hace saltar a Bit
 * sobre cajas en la cinta, Enter abre puertas cuando el semáforo está en
 * verde, y Borrar limpia las letras intrusas que dejó Glitch. Las réplicas
 * gigantes del gabinete se hunden con la tecla real y también responden al
 * clic. Chocar no castiga: la caja rebota cómicamente y lo intentas de nuevo.
 */

const LINEAS = {
  inicio: '¡Mira estas teclas gigantes! Cada una tiene un superpoder.',
  espacio: '¡Presiona espacio para saltar! Es la tecla más larga del teclado.',
  enter: 'Luz verde… ¡Enter! Enter significa: adelante.',
  borrar: '¡Glitch llenó la palabra de letras que sobran! Bórralas con la tecla de la flechita.',
  palabraLimpia: '¡Palabra limpia! ¿Ves? Equivocarse no es problema si sabes borrar.',
  completar: 'Espacio, Enter y borrar: ¡ya tienes tres superpoderes!',
};

const BIT_CARA = '/assets/actividades/n1-enciende-y-apaga/bit-cara.png';
const GLITCH_IMG = '/assets/actividades/n1-teclas-gigantes/glitch.png';

const SALTOS_META = 5;
const PUERTAS_META = 5;
const BIT_X = 18; // % donde corre Bit sobre la cinta
const ZONA_CHOQUE: [number, number] = [13, 25];
const VEL_OBSTACULO = 26; // % de ancho por segundo
const SALTO_MS = 620;

const PALABRAS: { sucia: string; limpia: string }[] = [
  { sucia: 'GATOO', limpia: 'GATO' },
  { sucia: 'SOLL', limpia: 'SOL' },
  { sucia: 'LUNAA', limpia: 'LUNA' },
];

const TOTAL_ITEMS = SALTOS_META + PUERTAS_META + PALABRAS.length;

export function LabTeclasGigantes(props: ActivityProps & { alSalir?: () => void }) {
  const [estacion, setEstacion] = useState(1);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [teclaHundida, setTeclaHundida] = useState<'espacio' | 'enter' | 'borrar' | null>(null);
  const { linea, hablar } = useBit(LINEAS.inicio);

  // Estación 1 · cinta de salto
  const [obstX, setObstX] = useState(106);
  const [obstRebotado, setObstRebotado] = useState(false);
  const [salta, setSalta] = useState(false);
  const [tropieza, setTropieza] = useState(false);
  const [saltos, setSaltos] = useState(0);

  // Estación 2 · puertas con semáforo
  const [puerta, setPuerta] = useState(0);
  const [luzVerde, setLuzVerde] = useState(false);
  const [puertaAbierta, setPuertaAbierta] = useState(false);
  const [puertaVibra, setPuertaVibra] = useState(false);
  const [puertas, setPuertas] = useState(0);

  // Estación 3 · palabras de Glitch
  const [palabraIdx, setPalabraIdx] = useState(0);
  const [letras, setLetras] = useState<string[]>(() => PALABRAS[0].sucia.split(''));
  const [borrando, setBorrando] = useState(false);
  const [tableroVibra, setTableroVibra] = useState(false);
  const [palabras, setPalabras] = useState(0);

  const timers = useTemporizadores();
  const sim = useRef({
    obstX: 106,
    obstEnRebote: false,
    falloEnItem: false,
    saltaHasta: 0,
    estacion: 1,
    pausado: false,
    puertaLista: false,
    puertaAbierta: false,
    ocupado: false, // transición puerta/palabra en curso
    saltos: 0,
    puertas: 0,
    palabras: 0,
    primeras: 0,
    errores: 0,
    inicio: Date.now(),
  });
  sim.current.estacion = estacion;
  sim.current.pausado = terminado || aviso !== null;

  const propsRef = useRef(props);
  propsRef.current = props;

  const puntaje = () =>
    Math.max(60, Math.min(100, Math.round((sim.current.primeras / TOTAL_ITEMS) * 100)));

  const terminar = () => {
    const s = sim.current;
    reproducirTono('complete');
    hablar(LINEAS.completar);
    const score = puntaje();
    propsRef.current.onScore(score);
    propsRef.current.onComplete({
      score,
      stars: 3,
      xp: score,
      errores: s.errores,
      tiempoSegundos: Math.round((Date.now() - s.inicio) / 1000),
    });
    setTerminado(true);
  };

  const completarEstacion = (lista: number) => {
    reproducirTono('save');
    propsRef.current.onProgress(lista / 3);
    if (lista === 3) {
      terminar();
      return;
    }
    const siguiente = lista + 1;
    setAviso(`Estación ${siguiente}`);
    if (siguiente === 3) {
      timers.despues(() => hablar(LINEAS.borrar, { una: true }), 700);
    }
    timers.despues(() => {
      sim.current.falloEnItem = false;
      sim.current.ocupado = false;
      setEstacion(siguiente);
      setAviso(null);
    }, 1500);
  };

  /* ── Estación 1: bucle de la cinta ─────────────────────────────── */
  useEffect(() => {
    let cuadro = 0;
    let anterior = performance.now();
    const paso = (ahora: number) => {
      const dt = Math.min(0.05, (ahora - anterior) / 1000);
      anterior = ahora;
      const s = sim.current;
      if (s.estacion === 1 && !s.pausado && !s.obstEnRebote) {
        s.obstX -= VEL_OBSTACULO * dt;
        const enAire = Date.now() < s.saltaHasta;
        if (s.obstX <= ZONA_CHOQUE[1] && s.obstX >= ZONA_CHOQUE[0] && !enAire) {
          // Choque cómico: la caja rebota y vuelve a intentarse.
          s.obstEnRebote = true;
          s.falloEnItem = true;
          s.errores += 1;
          reproducirTono('error');
          setObstRebotado(true);
          setTropieza(true);
          timers.despues(() => {
            setObstRebotado(false);
            setTropieza(false);
            s.obstX = 106;
            s.obstEnRebote = false;
            setObstX(106);
          }, 620);
        } else if (s.obstX < ZONA_CHOQUE[0] - 3) {
          // Caja superada: salto logrado.
          reproducirTono('correct');
          if (!s.falloEnItem) s.primeras += 1;
          s.falloEnItem = false;
          s.obstX = 106;
          propsRef.current.onScore(puntaje());
          s.saltos += 1;
          setSaltos(s.saltos);
          if (s.saltos >= SALTOS_META) {
            s.obstEnRebote = true; // congela la cinta durante la transición
            timers.despues(() => completarEstacion(1), 500);
          }
        }
        setObstX(s.obstX);
      }
      cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = timers.despues(() => hablar(LINEAS.espacio, { una: true }), 3600);
    return () => timers.cancelar(t);
  }, [hablar, timers]);

  /* ── Estación 2: semáforo de cada puerta ───────────────────────── */
  useEffect(() => {
    if (estacion !== 2 || terminado) return;
    sim.current.puertaLista = false;
    sim.current.puertaAbierta = false;
    setLuzVerde(false);
    setPuertaAbierta(false);
    const espera = 1500 + Math.random() * 1500;
    const t = timers.despues(() => {
      sim.current.puertaLista = true;
      setLuzVerde(true);
      hablar(LINEAS.enter, { una: true });
    }, espera);
    return () => timers.cancelar(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estacion, puerta, terminado]);

  /* ── Acciones por tecla ────────────────────────────────────────── */
  const accionEspacio = () => {
    const s = sim.current;
    if (s.estacion !== 1 || s.pausado) return;
    if (Date.now() < s.saltaHasta) return;
    s.saltaHasta = Date.now() + SALTO_MS;
    setSalta(true);
    timers.despues(() => setSalta(false), SALTO_MS);
  };

  const accionEnter = () => {
    const s = sim.current;
    if (s.pausado || s.ocupado) return;
    if (s.estacion === 2) {
      if (s.puertaAbierta) return;
      if (!s.puertaLista) {
        // Enter con luz roja: la puerta vibra y no abre.
        s.falloEnItem = true;
        s.errores += 1;
        reproducirTono('error');
        setPuertaVibra(true);
        timers.despues(() => setPuertaVibra(false), 320);
        return;
      }
      reproducirTono('open');
      s.puertaAbierta = true;
      if (!s.falloEnItem) s.primeras += 1;
      s.falloEnItem = false;
      setPuertaAbierta(true);
      propsRef.current.onScore(puntaje());
      s.ocupado = true;
      timers.despues(() => {
        s.ocupado = false;
        s.puertas += 1;
        setPuertas(s.puertas);
        if (s.puertas >= PUERTAS_META) {
          completarEstacion(2);
        } else {
          setPuerta(s.puertas);
        }
      }, 900);
      return;
    }
    if (s.estacion === 3) {
      confirmarPalabra();
    }
  };

  const confirmarPalabra = () => {
    const s = sim.current;
    if (s.pausado || s.ocupado || borrandoRef.current) return;
    const limpia = PALABRAS[palabraIdxRef.current].limpia;
    if (letrasRef.current.join('') !== limpia) {
      // Enter antes de tiempo: todavía sobran letras.
      s.falloEnItem = true;
      s.errores += 1;
      reproducirTono('error');
      setTableroVibra(true);
      timers.despues(() => setTableroVibra(false), 320);
      return;
    }
    reproducirTono('save');
    if (!s.falloEnItem) s.primeras += 1;
    s.falloEnItem = false;
    hablar(LINEAS.palabraLimpia, { una: true });
    propsRef.current.onScore(puntaje());
    s.ocupado = true;
    timers.despues(() => {
      s.ocupado = false;
      s.palabras += 1;
      setPalabras(s.palabras);
      if (s.palabras >= PALABRAS.length) {
        completarEstacion(3);
      } else {
        setPalabraIdx(s.palabras);
        setLetras(PALABRAS[s.palabras].sucia.split(''));
      }
    }, 1100);
  };

  const accionBorrar = () => {
    const s = sim.current;
    if (s.estacion !== 3 || s.pausado || s.ocupado || borrandoRef.current) return;
    const limpia = PALABRAS[palabraIdxRef.current].limpia;
    if (letrasRef.current.length <= limpia.length) {
      // Ya no hay intrusas: borrar de más también avisa.
      s.errores += 1;
      reproducirTono('error');
      setTableroVibra(true);
      timers.despues(() => setTableroVibra(false), 320);
      return;
    }
    reproducirTono('minimize');
    setBorrando(true);
    timers.despues(() => {
      setLetras((prev) => prev.slice(0, -1));
      setBorrando(false);
    }, 300);
  };

  /* Refs espejo para los handlers de teclado (registrados una sola vez). */
  const letrasRef = useRef(letras);
  letrasRef.current = letras;
  const palabraIdxRef = useRef(palabraIdx);
  palabraIdxRef.current = palabraIdx;
  const borrandoRef = useRef(borrando);
  borrandoRef.current = borrando;
  const accionesRef = useRef({ accionEspacio, accionEnter, accionBorrar });
  accionesRef.current = { accionEspacio, accionEnter, accionBorrar };

  useEffect(() => {
    const alBajar = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setTeclaHundida('espacio');
        if (!e.repeat) accionesRef.current.accionEspacio();
      } else if (e.key === 'Enter') {
        setTeclaHundida('enter');
        if (!e.repeat) accionesRef.current.accionEnter();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setTeclaHundida('borrar');
        if (!e.repeat) accionesRef.current.accionBorrar();
      }
    };
    const alSoltar = () => setTeclaHundida(null);
    window.addEventListener('keydown', alBajar);
    window.addEventListener('keyup', alSoltar);
    return () => {
      window.removeEventListener('keydown', alBajar);
      window.removeEventListener('keyup', alSoltar);
    };
  }, []);

  const repetir = () => {
    const s = sim.current;
    s.obstX = 106;
    s.obstEnRebote = false;
    s.falloEnItem = false;
    s.saltaHasta = 0;
    s.puertaLista = false;
    s.puertaAbierta = false;
    s.ocupado = false;
    s.saltos = 0;
    s.puertas = 0;
    s.palabras = 0;
    s.primeras = 0;
    s.errores = 0;
    s.inicio = Date.now();
    setObstX(106);
    setObstRebotado(false);
    setSalta(false);
    setTropieza(false);
    setSaltos(0);
    setPuerta(0);
    setLuzVerde(false);
    setPuertaAbierta(false);
    setPuertaVibra(false);
    setPuertas(0);
    setPalabraIdx(0);
    setLetras(PALABRAS[0].sucia.split(''));
    setBorrando(false);
    setTableroVibra(false);
    setPalabras(0);
    setAviso(null);
    setTerminado(false);
    setEstacion(1);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const marcador =
    estacion === 1
      ? { etiqueta: 'Saltos', valor: `${saltos}/${SALTOS_META}` }
      : estacion === 2
        ? { etiqueta: 'Puertas', valor: `${puertas}/${PUERTAS_META}` }
        : { etiqueta: 'Palabras', valor: `${palabras}/${PALABRAS.length}` };

  const limpiaActual = PALABRAS[palabraIdx].limpia;

  return (
    <ArcadeSala
      titulo="Teclas gigantes"
      pasoEtiqueta="Estación"
      pasoActual={estacion}
      pasosTotal={3}
      marcadorEtiqueta={marcador.etiqueta}
      marcadorValor={marcador.valor}
      bit={linea}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Tres superpoderes',
              insigniaEmoji: '⌨️',
              titulo: '¡Superpoderes desbloqueados!',
              detalle: 'Espacio salta, Enter dice adelante y borrar arregla cualquier error.',
              resumen: [
                { etiqueta: 'Al primer intento', valor: `${sim.current.primeras}/${TOTAL_ITEMS}` },
                { etiqueta: 'Puntaje', valor: `${puntaje()}%` },
              ],
              alRepetir: repetir,
            }
          : null
      }
      base={
        <>
          <button
            type="button"
            className={[
              'tecla-replica',
              'tecla-replica--espacio',
              estacion === 1 ? 'activa' : '',
              teclaHundida === 'espacio' ? 'hundida' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={accionEspacio}
          >
            ESPACIO
          </button>
          <button
            type="button"
            className={[
              'tecla-replica',
              estacion === 2 ? 'activa' : '',
              teclaHundida === 'enter' ? 'hundida' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={accionEnter}
          >
            ENTER ⏎
          </button>
          <button
            type="button"
            className={[
              'tecla-replica',
              estacion === 3 ? 'activa' : '',
              teclaHundida === 'borrar' ? 'hundida' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={accionBorrar}
          >
            ⌫ BORRAR
          </button>
        </>
      }
    >
      {estacion === 1 && (
        <>
          <div className="cinta-piso" aria-hidden />
          <div
            className={`corredor${salta ? ' salta' : ''}${tropieza ? ' tropieza' : ''}`}
            style={{ left: `${BIT_X}%` }}
            aria-hidden
          >
            <Image src={BIT_CARA} alt="" fill sizes="74px" className="object-cover" />
          </div>
          <div
            className={`obstaculo${obstRebotado ? ' rebotado' : ''}`}
            style={{ left: `${obstX}%` }}
            aria-hidden
          >
            📦
          </div>
        </>
      )}

      {estacion === 2 && (
        <>
          <div className="semaforo" aria-label={luzVerde ? 'Luz verde' : 'Luz roja'}>
            <span className={`semaforo-luz${!luzVerde ? ' roja' : ''}`} />
            <span className={`semaforo-luz${luzVerde ? ' verde' : ''}`} />
          </div>
          <div
            className={`puerta-marco${puertaAbierta ? ' abierta' : ''}${puertaVibra ? ' vibra' : ''}`}
            aria-hidden
          >
            <div className="puerta-hoja">{puerta + 1}</div>
          </div>
        </>
      )}

      {estacion === 3 && (
        <>
          <div className="glitch-bicho" aria-hidden>
            <Image src={GLITCH_IMG} alt="" fill sizes="84px" className="object-contain" />
          </div>
          <div
            className={`palabra-tablero${tableroVibra ? ' vibra' : ''}`}
            style={{ position: 'absolute', left: 0, right: 0, top: '42%' }}
            aria-label={`Palabra ${letras.join('')}`}
          >
            {letras.map((letra, i) => {
              const intrusa = i >= limpiaActual.length;
              const ultimaBorrando = borrando && i === letras.length - 1;
              return (
                <span
                  key={`${palabraIdx}-${i}`}
                  className={[
                    'letra-ficha',
                    intrusa ? 'letra-ficha--intrusa' : '',
                    ultimaBorrando ? 'borrada' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {letra}
                </span>
              );
            })}
          </div>
        </>
      )}

      {aviso && <AvisoRonda texto={aviso} clave={aviso} />}
    </ArcadeSala>
  );
}
