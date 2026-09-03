'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono, type TonoId } from '../mision/audio';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { useBit } from './ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { Consigna3D } from '../../arcade3d/piezas3d';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { FichaTomable3D, type EstadoExhibicion } from '../../n3/arcade/museoN3';
import { BotonColor3D, CajaTesoro3D, PipsRitmo3D, RepisaTesoros3D, Tren3D, type Color } from './piezasSigueElPatron';

/**
 * «Sigue el patrón» (N1·U3, parada 2) — El tren de los patrones, en WebGL 3D
 * real (documento §4.2, refactor a 3D del 17-ago-2026).
 *
 * Un tren de vagones sobre su riel, con el último vagón vacío. La botonera de
 * tres colores es el MISMO mueble físico en las dos primeras rondas: en R1 se
 * presiona para adivinar, en R2 la máquina la enciende ella sola —es su
 * lámpara— y el alumno repite el ritmo. R1 «¿Qué sigue?»: completar el vagón
 * (AB → AAB → ABC). R2 «El ritmo de Bit»: repetir el patrón de luces y
 * sonidos (2 a 4 toques). R3 «Cada cosa en su caja»: clasificar tesoros en
 * dos cofres, primero por forma y luego por color — se toma el tesoro y se
 * toca (o se arrastra de verdad) el cofre. Líneas de Bit verbatim (§4.2).
 */

const LINEAS = {
  inicio: 'Esta máquina esconde un secreto: ¡todo se repite! ¿Descubres el patrón?',
  primerPatron: '¡Lo descubriste! Rojo, azul, rojo, azul… ¡y sigue igual!',
  rompePatron: 'Mmm, ese no sigue el patrón. Míralo otra vez: ¿qué se repite?',
  ritmoBien: '¡Tienes buen ojo! …¡y buen oído!',
  clasificar: 'Ahora junta lo que se parece: ¡cada tesoro en su caja!',
  tomaTesoro: 'Primero toma un tesoro de la repisa y luego llévalo a su caja.',
  completar: '¡Patrones descubiertos! Ahora puedes adivinar lo que sigue.',
} as const;

const COLORES: Record<Color, { nombre: string; hex: string; hondo: string; tono: TonoId }> = {
  rojo: { nombre: 'Rojo', hex: '#ff6d7c', hondo: '#d63a52', tono: 'close' },
  azul: { nombre: 'Azul', hex: '#32a8ff', hondo: '#1e63c4', tono: 'select' },
  amarillo: { nombre: 'Amarillo', hex: '#ffd25a', hondo: '#d99a00', tono: 'connect' },
};

/** R1: patrones del tren (AB → AAB → ABC), con el vagón vacío al final. */
const PATRONES: { regla: string; vagones: Color[]; respuesta: Color }[] = [
  { regla: 'AB', vagones: ['rojo', 'azul', 'rojo', 'azul', 'rojo'], respuesta: 'azul' },
  { regla: 'AAB', vagones: ['rojo', 'rojo', 'azul', 'rojo', 'rojo'], respuesta: 'azul' },
  { regla: 'ABC', vagones: ['rojo', 'azul', 'amarillo', 'rojo', 'azul'], respuesta: 'amarillo' },
];

/** R2: ritmos de luces y sonidos, suben de 2 a 4 toques. */
const RITMOS: Color[][] = [
  ['rojo', 'azul'],
  ['rojo', 'azul', 'rojo'],
  ['amarillo', 'rojo', 'azul', 'amarillo'],
];

interface Tesoro {
  id: string;
  forma: 'circulo' | 'estrella';
  color: Color;
}

interface Caja {
  id: string;
  titulo: string;
  icono: string;
}

/** R3: dos tandas de tesoros — primero por forma, luego por color. */
const TANDAS: { criterio: 'forma' | 'color'; cajas: [Caja, Caja]; tesoros: Tesoro[] }[] = [
  {
    criterio: 'forma',
    cajas: [
      { id: 'circulo', titulo: 'Círculos', icono: '●' },
      { id: 'estrella', titulo: 'Estrellas', icono: '★' },
    ],
    tesoros: [
      { id: 'f1', forma: 'circulo', color: 'rojo' },
      { id: 'f2', forma: 'estrella', color: 'azul' },
      { id: 'f3', forma: 'circulo', color: 'azul' },
      { id: 'f4', forma: 'estrella', color: 'rojo' },
      { id: 'f5', forma: 'circulo', color: 'amarillo' },
      { id: 'f6', forma: 'estrella', color: 'amarillo' },
    ],
  },
  {
    criterio: 'color',
    cajas: [
      { id: 'rojo', titulo: 'Rojos', icono: '●' },
      { id: 'azul', titulo: 'Azules', icono: '●' },
    ],
    tesoros: [
      { id: 'c1', forma: 'circulo', color: 'rojo' },
      { id: 'c2', forma: 'estrella', color: 'azul' },
      { id: 'c3', forma: 'estrella', color: 'rojo' },
      { id: 'c4', forma: 'circulo', color: 'azul' },
      { id: 'c5', forma: 'estrella', color: 'azul' },
      { id: 'c6', forma: 'circulo', color: 'rojo' },
    ],
  },
];

export function LabSigueElPatron(props: ActivityProps & { alSalir?: () => void }) {
  const [ronda, setRonda] = useState(0);
  const [patronIdx, setPatronIdx] = useState(0);
  const [patronesListos, setPatronesListos] = useState(0);
  const [vagonLleno, setVagonLleno] = useState<Color | null>(null);
  const [trenAnimo, setTrenAnimo] = useState<'celebra' | 'duda' | null>(null);
  const [ritmoIdx, setRitmoIdx] = useState(0);
  const [ritmosListos, setRitmosListos] = useState(0);
  const [progresoRitmo, setProgresoRitmo] = useState(0);
  const [botonEncendido, setBotonEncendido] = useState<Color | null>(null);
  const [hundido, setHundido] = useState<Color | null>(null);
  const [tandaIdx, setTandaIdx] = useState(0);
  const [colocados, setColocados] = useState<Set<string>>(new Set());
  const [elegido, setElegido] = useState<string | null>(null);
  const [cajaMal, setCajaMal] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);
  propsRef.current = props;
  const vivo = useRef({ terminado, aviso, ronda, patronIdx, ritmoIdx, progresoRitmo, tandaIdx, colocados, elegido });
  vivo.current = { terminado, aviso, ronda, patronIdx, ritmoIdx, progresoRitmo, tandaIdx, colocados, elegido };

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

  /** La máquina toca el ritmo: enciende la botonera en orden, como sus lámparas. */
  const tocarRitmo = (idx: number) => {
    const s = sim.current;
    if (vivo.current.terminado) return;
    s.ocupado = true;
    setProgresoRitmo(0);
    const ritmo = RITMOS[idx];
    ritmo.forEach((color, i) => {
      timers.despues(() => {
        if (vivo.current.terminado) return;
        reproducirTono(COLORES[color].tono);
        setBotonEncendido(color);
        timers.despues(() => setBotonEncendido((b) => (b === color ? null : b)), 330);
      }, 500 + i * 550);
    });
    timers.despues(() => {
      s.ocupado = false;
    }, 500 + ritmo.length * 550);
  };

  /** Paso de R1 → R2 y de R2 → R3, con aviso de ronda y tono de guardado. */
  const cambiarRonda = (nueva: 1 | 2) => {
    const s = sim.current;
    s.ocupado = true;
    reproducirTono('save');
    propsRef.current.onProgress(nueva / 3);
    setAviso(nueva === 1 ? 'Ronda 2 · El ritmo de Bit' : 'Ronda 3 · Cada cosa en su caja');
    timers.despues(() => {
      if (vivo.current.terminado) return;
      setRonda(nueva);
      setAviso(null);
      s.ocupado = false;
      if (nueva === 1) {
        timers.despues(() => tocarRitmo(0), 500);
      } else {
        hablar(LINEAS.clasificar);
      }
    }, 1600);
  };

  /** Botonera del gabinete: responde según la ronda activa. */
  const presionar = (color: Color) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda === 2) return;
    setHundido(color);
    timers.despues(() => setHundido((h) => (h === color ? null : h)), 180);
    reproducirTono(COLORES[color].tono);

    if (v.ronda === 0) {
      const patron = PATRONES[v.patronIdx];
      if (color === patron.respuesta) {
        s.ocupado = true;
        setVagonLleno(color);
        setTrenAnimo('celebra');
        setPatronesListos(v.patronIdx + 1);
        timers.despues(() => reproducirTono('correct'), 220);
        hablar(LINEAS.primerPatron, { una: true });
        timers.despues(() => {
          if (vivo.current.terminado) return;
          if (v.patronIdx === PATRONES.length - 1) {
            cambiarRonda(1);
            return;
          }
          setPatronIdx(v.patronIdx + 1);
          setVagonLleno(null);
          setTrenAnimo(null);
          s.ocupado = false;
        }, 1400);
      } else {
        errar();
        setTrenAnimo('duda');
        hablar(LINEAS.rompePatron);
        timers.despues(() => setTrenAnimo((t) => (t === 'duda' ? null : t)), 520);
      }
      return;
    }

    const ritmo = RITMOS[v.ritmoIdx];
    if (color === ritmo[v.progresoRitmo]) {
      const avance = v.progresoRitmo + 1;
      setProgresoRitmo(avance);
      if (avance === ritmo.length) {
        s.ocupado = true;
        setRitmosListos(v.ritmoIdx + 1);
        timers.despues(() => reproducirTono('correct'), 240);
        hablar(LINEAS.ritmoBien, { una: true });
        timers.despues(() => {
          if (vivo.current.terminado) return;
          if (v.ritmoIdx === RITMOS.length - 1) {
            cambiarRonda(2);
            return;
          }
          setRitmoIdx(v.ritmoIdx + 1);
          s.ocupado = false;
          tocarRitmo(v.ritmoIdx + 1);
        }, 1100);
      }
    } else {
      errar();
      setProgresoRitmo(0);
      s.ocupado = true;
      timers.despues(() => {
        if (vivo.current.terminado) return;
        s.ocupado = false;
        tocarRitmo(v.ritmoIdx);
      }, 800);
    }
  };

  /** R3: toma un tesoro de la repisa (toque o inicio de arrastre nativo). */
  const tomarTesoro = (id: string) => {
    const v = vivo.current;
    if (v.terminado || v.aviso || sim.current.ocupado || v.ronda !== 2) return;
    reproducirTono('select');
    setElegido(id);
  };

  /** R3: suelta el tesoro elegido (o arrastrado) sobre una caja. */
  const soltarEnCaja = (destino: string, idExplicito?: string) => {
    const v = vivo.current;
    if (v.terminado || v.aviso || sim.current.ocupado || v.ronda !== 2) return;
    const id = idExplicito ?? v.elegido;
    if (!id) {
      hablar(LINEAS.tomaTesoro);
      return;
    }
    const tanda = TANDAS[v.tandaIdx];
    const tesoro = tanda.tesoros.find((t) => t.id === id);
    if (!tesoro) return;

    if (tesoro[tanda.criterio] !== destino) {
      errar();
      setCajaMal(destino);
      timers.despues(() => setCajaMal(null), 420);
      return;
    }

    reproducirTono('correct');
    const sigColocados = new Set(v.colocados);
    sigColocados.add(tesoro.id);
    setColocados(sigColocados);
    setElegido(null);
    propsRef.current.onScore(puntaje());

    if (sigColocados.size === tanda.tesoros.length) {
      const s = sim.current;
      s.ocupado = true;
      reproducirTono('save');
      if (v.tandaIdx === 0) {
        setAviso('¡Cajas listas! Ahora por color');
        timers.despues(() => {
          if (vivo.current.terminado) return;
          setTandaIdx(1);
          setColocados(new Set());
          setAviso(null);
          s.ocupado = false;
        }, 1600);
      } else {
        propsRef.current.onProgress(1);
        timers.despues(() => {
          if (vivo.current.terminado) return;
          terminar();
        }, 500);
      }
    }
  };

  const repetir = () => {
    timers.limpiar();
    const s = sim.current;
    s.ocupado = false;
    s.errores = 0;
    s.inicio = Date.now();
    setRonda(0);
    setPatronIdx(0);
    setPatronesListos(0);
    setVagonLleno(null);
    setTrenAnimo(null);
    setRitmoIdx(0);
    setRitmosListos(0);
    setProgresoRitmo(0);
    setBotonEncendido(null);
    setHundido(null);
    setTandaIdx(0);
    setColocados(new Set());
    setElegido(null);
    setCajaMal(null);
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const patron = PATRONES[patronIdx];
  const ritmo = RITMOS[ritmoIdx];
  const tanda = TANDAS[tandaIdx];
  const tesorosListos = tandaIdx * TANDAS[0].tesoros.length + colocados.size;
  const marcador =
    ronda === 0
      ? { etiqueta: 'Patrones', valor: `${patronesListos}/3` }
      : ronda === 1
        ? { etiqueta: 'Ritmos', valor: `${ritmosListos}/3` }
        : { etiqueta: 'Tesoros', valor: `${tesorosListos}/12` };

  const consigna =
    ronda === 0
      ? { titulo: 'El tren de los patrones', texto: '¿Qué sigue? Mira el tren y elige el color en la botonera.' }
      : ronda === 1
        ? { titulo: 'El ritmo de Bit', texto: 'Escucha el ritmo de la máquina… y repítelo en la botonera.' }
        : tandaIdx === 0
          ? { titulo: 'Cada cosa en su caja', texto: 'Junta lo que se parece: círculos con círculos, estrellas con estrellas.' }
          : { titulo: 'Cada cosa en su caja', texto: 'Ahora por color: rojos con rojos, azules con azules.' };

  const estadoCaja = (id: string): EstadoExhibicion => {
    if (cajaMal === id) return 'mal';
    const cuenta = tanda.tesoros.filter((t) => colocados.has(t.id) && t[tanda.criterio] === id).length;
    if (cuenta === 3) return 'ok';
    return elegido ? 'listo' : 'espera';
  };

  const bloqueado = terminado || !!aviso;

  const pendientes = tanda.tesoros.filter((t) => !colocados.has(t.id));

  const dibujarTesoroBoton = (t: Tesoro, claseExtra: string) => (
    <FichaTomable3D
      key={t.id}
      id={t.id}
      className={`${claseExtra}${elegido === t.id ? ' patron3d-tesoro--elegido' : ''}`}
      ariaLabel={`Tesoro: ${t.forma === 'circulo' ? 'círculo' : 'estrella'} ${COLORES[t.color].nombre.toLowerCase()}`}
      disabled={terminado}
      onElegir={() => tomarTesoro(t.id)}
    >
      <span
        className={`patron3d-tesoro-forma ${t.forma}`}
        style={{ '--bc': COLORES[t.color].hex, '--bc-hondo': COLORES[t.color].hondo } as CSSProperties}
        aria-hidden
      >
        {t.forma === 'estrella' ? '★' : ''}
      </span>
    </FichaTomable3D>
  );

  const botonera3D = (encendidoActivo: boolean) =>
    (Object.keys(COLORES) as Color[]).map((color, i) => (
      <BotonColor3D
        key={color}
        position={[(i - 1) * 1.05, MOSTRADOR_Y, 0.85]}
        color={COLORES[color].hex}
        hondo={COLORES[color].hondo}
        etiqueta={COLORES[color].nombre}
        encendido={encendidoActivo && botonEncendido === color}
        hundido={hundido === color}
        ariaLabel={`Botón ${COLORES[color].nombre.toLowerCase()}`}
        onClick={() => presionar(color)}
        disabled={bloqueado}
        reduceMotion={reduceMotion}
      />
    ));

  const escena = (
    <>
      <Consigna3D titulo={consigna.titulo} texto={consigna.texto} position={[0, MOSTRADOR_Y + 2.5, -0.3]} />

      {ronda === 0 && (
        <>
          <Tren3D
            vagones={patron.vagones}
            vagonLleno={vagonLleno}
            colorHex={COLORES}
            animo={trenAnimo}
            reduceMotion={reduceMotion}
            position={[0, MOSTRADOR_Y + 1.45, -0.3]}
          />
          {botonera3D(false)}
        </>
      )}

      {ronda === 1 && (
        <>
          <PipsRitmo3D
            total={ritmo.length}
            progreso={progresoRitmo}
            posicion={[0, MOSTRADOR_Y + 1.4, -0.3]}
            nota={`Ritmo ${ritmoIdx + 1} de 3 · ${ritmo.length} toques`}
          />
          {botonera3D(true)}
        </>
      )}

      {ronda === 2 && (
        <>
          {tanda.cajas.map((caja, i) => (
            <CajaTesoro3D
              key={caja.id}
              position={[(i === 0 ? -1.1 : 1.1), MOSTRADOR_Y, -0.7]}
              titulo={caja.titulo}
              icono={caja.icono}
              cuenta={tanda.tesoros.filter((t) => colocados.has(t.id) && t[tanda.criterio] === caja.id).length}
              meta={3}
              estado={estadoCaja(caja.id)}
              ariaLabel={`Caja ${caja.titulo}: ${tanda.tesoros.filter((t) => colocados.has(t.id) && t[tanda.criterio] === caja.id).length} de 3 tesoros`}
              onClick={() => soltarEnCaja(caja.id)}
              onSoltar={(id) => soltarEnCaja(caja.id, id)}
              disabled={terminado}
              reduceMotion={reduceMotion}
            />
          ))}
          <RepisaTesoros3D position={[0, MOSTRADOR_Y + 0.1, 1.7]}>
            <div className="patron3d-repisa">
              {pendientes.map((t) => dibujarTesoroBoton(t, 'patron3d-tesoro'))}
              {pendientes.length === 0 && (
                <span className="patron3d-repisa-vacia" aria-hidden>
                  ✨
                </span>
              )}
            </div>
          </RepisaTesoros3D>
        </>
      )}
    </>
  );

  const respaldo = (
    <div className="patron-tablero">
      <div className="pasos-consigna">
        <strong>{consigna.titulo}</strong>
        <span>{consigna.texto}</span>
      </div>
      {ronda === 0 && (
        <div className="tren-zona" key={patronIdx}>
          <div className={`tren${trenAnimo === 'celebra' ? ' celebra' : ''}${trenAnimo === 'duda' ? ' duda' : ''}`}>
            <span className="locomotora" aria-hidden>
              🚂
            </span>
            {patron.vagones.map((color, i) => (
              <span
                key={i}
                className="vagon"
                style={{ '--bc': COLORES[color].hex, '--bc-hondo': COLORES[color].hondo } as CSSProperties}
                aria-label={`Vagón ${COLORES[color].nombre.toLowerCase()}`}
              />
            ))}
            {vagonLleno ? (
              <span
                className="vagon recien"
                style={{ '--bc': COLORES[vagonLleno].hex, '--bc-hondo': COLORES[vagonLleno].hondo } as CSSProperties}
                aria-label={`Vagón ${COLORES[vagonLleno].nombre.toLowerCase()}`}
              />
            ) : (
              <span className="vagon vacio" aria-label="Vagón vacío">
                ?
              </span>
            )}
          </div>
          <p className="tren-via" aria-hidden />
        </div>
      )}
      {ronda === 1 && (
        <div className="ritmo-zona">
          <div className="ritmo-luces" aria-hidden>
            {(Object.keys(COLORES) as Color[]).map((color) => (
              <span
                key={color}
                className={`ritmo-luz${botonEncendido === color ? ' encendida' : ''}`}
                style={{ '--bc': COLORES[color].hex } as CSSProperties}
              />
            ))}
          </div>
          <div className="ritmo-pips" aria-label={`Ritmo de ${ritmo.length} toques`}>
            {ritmo.map((_, i) => (
              <span key={i} className={`pip-ritmo${i < progresoRitmo ? ' lleno' : ''}`} aria-hidden />
            ))}
          </div>
          <p className="ritmo-nota">Ritmo {ritmoIdx + 1} de 3 · {ritmo.length} toques</p>
        </div>
      )}
      {ronda === 2 && (
        <div className="tesoro-banda" aria-label="Tesoros revueltos">
          {pendientes.map((t) => dibujarTesoroBoton(t, 'tesoro'))}
          {pendientes.length === 0 && (
            <span className="tesoro-vacio" aria-hidden>
              ✨
            </span>
          )}
        </div>
      )}
      <div className="escena3d-respaldo-fila">
        {ronda === 2
          ? tanda.cajas.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`archivero3d-cajon archivero3d-cajon--${estadoCaja(c.id)}`}
                aria-label={`Caja ${c.titulo}`}
                disabled={terminado}
                onClick={() => soltarEnCaja(c.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData('text/plain');
                  if (id) soltarEnCaja(c.id, id);
                }}
              >
                <span className="archivero3d-cajon-titulo">
                  <span className="archivero3d-cajon-icono" aria-hidden>
                    {c.icono}
                  </span>
                  {c.titulo}
                </span>
                <span className="archivero3d-cajon-conteo">
                  {tanda.tesoros.filter((t) => colocados.has(t.id) && t[tanda.criterio] === c.id).length} de 3
                </span>
              </button>
            ))
          : (Object.keys(COLORES) as Color[]).map((color) => (
              <button
                key={color}
                type="button"
                className={`boton-color${hundido === color ? ' hundido' : ''}${botonEncendido === color ? ' encendido' : ''}`}
                style={{ '--bc': COLORES[color].hex, '--bc-hondo': COLORES[color].hondo } as CSSProperties}
                onClick={() => presionar(color)}
                aria-label={`Botón ${COLORES[color].nombre.toLowerCase()}`}
                disabled={bloqueado}
              />
            ))}
      </div>
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="Sigue el patrón"
      pasoEtiqueta="Ronda"
      pasoActual={ronda + 1}
      pasosTotal={3}
      marcadorEtiqueta={marcador.etiqueta}
      marcadorValor={marcador.valor}
      bit={linea}
      paleta={{ acento: '#56B8FF', acento2: '#FFD25A' }}
      activa={!bloqueado}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={
        <>
          <span className="gabinete-nota">{ronda === 2 ? 'Cofres del mueble' : 'Botonera'}</span>
          {ronda === 1 && (
            <button
              type="button"
              className="tecla-replica repite-ritmo"
              onClick={() => {
                const s = sim.current;
                const v = vivo.current;
                if (v.terminado || v.aviso || s.ocupado) return;
                tocarRitmo(v.ritmoIdx);
              }}
              aria-label="Oír el ritmo otra vez"
            >
              🔁 Oír otra vez
            </button>
          )}
        </>
      }
      final={
        terminado
          ? {
              insigniaNombre: 'Detective de patrones',
              insigniaEmoji: '🔁',
              titulo: '¡Patrones descubiertos!',
              detalle: 'Encontraste el secreto que se repite: en el tren, en el ritmo y en las cajas de tesoros.',
              resumen: [
                { etiqueta: 'Patrones', valor: '6' },
                { etiqueta: 'Tesoros', valor: '12' },
                { etiqueta: 'Puntaje', valor: `${puntaje()}%` },
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

export default LabSigueElPatron;
