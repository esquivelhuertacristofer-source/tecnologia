'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import {
  MonitorEscritorio3D,
  type EstadoZona,
  type IconoEscritorio,
  type ZonaEscritorio,
} from './piezasN3U2';

/**
 * N3·U2 · Parada 2 «Explora el escritorio» (documento §17.2).
 *
 * Aparato dedicado: un monitor 3D encendido sobre su pie, con el escritorio
 * simulado dentro del cristal y la consigna grabada en el bisel de abajo —nada
 * de carteles flotantes—. Las cuatro partes (íconos, ventana, barra de tareas y
 * la ✕ de cerrar) son zonas reales del escritorio simulado.
 */

const LINEAS = {
  inicio: '¡Encendí mi compu! Esta pantalla es el escritorio. ¿Reconocemos sus partes?',
  acierto: '¡Ahí está! Diste justo con esa parte.',
  fallo: 'Casi… esa no es. Fíjate bien dónde te pido.',
  iconos: 'Los íconos son esos dibujitos: con doble clic abren algo.',
  barra: 'La barra de tareas es esa franja de abajo, con la hora y lo abierto.',
  completar: '¡Ya conoces tu escritorio! No te perderás en la pantalla.',
};

const ICONOS: IconoEscritorio[] = [
  { emoji: '🗂️', nombre: 'Mis archivos' },
  { emoji: '🎨', nombre: 'Dibujo' },
  { emoji: '🌐', nombre: 'Internet' },
  { emoji: '🗑️', nombre: 'Papelera' },
];

const TITULO_VENTANA = 'Mis fotos';

interface Ronda {
  zona: ZonaEscritorio;
  consigna: string;
  /** Se dice una vez, después del acierto, para explicar la parte. */
  revelacion?: string;
}

const RONDAS: Ronda[] = [
  { zona: 'iconos', consigna: 'Toca los íconos del escritorio.', revelacion: LINEAS.iconos },
  { zona: 'ventana', consigna: 'Ahora toca la ventana que está abierta.' },
  { zona: 'barra', consigna: 'Toca la barra de tareas, la franja de abajo.', revelacion: LINEAS.barra },
  { zona: 'cerrar', consigna: 'Cierra la ventana con la ✕ de su esquina.' },
];

const TOTAL = RONDAS.length;

const ZONAS_NORMALES: Record<ZonaEscritorio, EstadoZona> = {
  iconos: 'normal',
  ventana: 'normal',
  barra: 'normal',
  cerrar: 'normal',
};

const ETIQUETA_ZONA: Record<ZonaEscritorio, string> = {
  iconos: 'Los íconos del escritorio',
  ventana: 'La ventana abierta',
  barra: 'La barra de tareas',
  cerrar: 'Cerrar la ventana',
};

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabExploraElEscritorio(props: ActivityProps & { alSalir?: () => void }) {
  const [idx, setIdx] = useState(0);
  const [estados, setEstados] = useState<Record<ZonaEscritorio, EstadoZona>>(ZONAS_NORMALES);
  const [ventanaAbierta, setVentanaAbierta] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, fallosRonda: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, idx });

  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, idx };
  });

  useEffect(() => {
    sim.current.inicio = Date.now();
  }, []);

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

  const terminar = (tiempoSegundos: number) => {
    reproducirTono('complete');
    hablar(LINEAS.completar);
    const s = sim.current;
    const score = puntaje();
    propsRef.current.onProgress(1);
    propsRef.current.onScore(score);
    propsRef.current.onComplete({ score, stars: 3, xp: score, errores: s.errores, tiempoSegundos });
    setTiempoFinal(tiempoSegundos);
    setErroresFinal(s.errores);
    setTerminado(true);
  };

  const tocarZona = (zona: ZonaEscritorio) => {
    if (vivo.current.terminado || sim.current.ocupado) return;
    const ronda = RONDAS[vivo.current.idx];

    if (zona !== ronda.zona) {
      reproducirTono('error');
      sim.current.errores += 1;
      sim.current.fallosRonda += 1;
      propsRef.current.onScore(puntaje());
      setEstados({ ...ZONAS_NORMALES, [zona]: 'mal' });
      hablar(LINEAS.fallo);

      // Ayuda del documento: tras dos fallos en la misma consigna, la parte
      // correcta parpadea una vez para guiar sin dar la respuesta hablada.
      const conPista = sim.current.fallosRonda >= 2;
      timers.despues(() => {
        if (conPista) {
          setEstados({ ...ZONAS_NORMALES, [ronda.zona]: 'pista' });
          timers.despues(() => setEstados(ZONAS_NORMALES), 1000);
        } else {
          setEstados(ZONAS_NORMALES);
        }
      }, 460);
      return;
    }

    sim.current.ocupado = true;
    sim.current.fallosRonda = 0;
    reproducirTono('correct');
    setEstados({ ...ZONAS_NORMALES, [zona]: 'ok' });
    hablar(ronda.revelacion ?? LINEAS.acierto);
    if (zona === 'cerrar') setVentanaAbierta(false);

    const hechas = vivo.current.idx + 1;
    propsRef.current.onScore(puntaje());
    propsRef.current.onProgress(hechas / TOTAL);

    if (hechas === TOTAL) {
      reproducirTono('save');
      setAviso('¡Escritorio explorado!');
      const tiempoSegundos = Math.round((Date.now() - sim.current.inicio) / 1000);
      timers.despues(() => {
        setAviso(null);
        setEstados(ZONAS_NORMALES);
        sim.current.ocupado = false;
        terminar(tiempoSegundos);
      }, 1500);
      return;
    }

    timers.despues(() => {
      setEstados(ZONAS_NORMALES);
      setIdx(hechas);
      sim.current.ocupado = false;
    }, 700);
  };

  const repetir = () => {
    timers.limpiar();
    sim.current.errores = 0;
    sim.current.fallosRonda = 0;
    sim.current.ocupado = false;
    sim.current.inicio = Date.now();
    setIdx(0);
    setEstados(ZONAS_NORMALES);
    setVentanaAbierta(true);
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const ronda = RONDAS[Math.min(idx, TOTAL - 1)];
  const consigna = terminado ? 'Escritorio explorado. ¡Ya reconoces sus cuatro partes!' : ronda.consigna;

  // Sin consigna flotante: el monitor lleva la instrucción grabada en su propio
  // bisel, así que un panel suelto sobre la escena sería a la vez un duplicado y
  // un cartel genérico colgado del aire. Además el monitor necesita toda la
  // franja visible del lienzo para que sus cuatro zonas queden alcanzables.
  const escena = (
    <MonitorEscritorio3D
      position={[0, MOSTRADOR_Y, -0.4]}
      consigna={consigna}
      iconos={ICONOS}
      tituloVentana={TITULO_VENTANA}
      ventanaAbierta={ventanaAbierta}
      estados={estados}
      onZona={tocarZona}
      disabled={terminado}
      reduceMotion={reduceMotion}
    />
  );

  const zonasRespaldo: ZonaEscritorio[] = ['iconos', 'ventana', 'barra', 'cerrar'];

  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">{consigna}</p>
      <div className="escena3d-respaldo-fila">
        {zonasRespaldo.map((z) => (
          <button
            key={z}
            type="button"
            className={`escritorio3d-respaldo escritorio3d-zona--${estados[z]}`}
            aria-label={ETIQUETA_ZONA[z]}
            disabled={terminado || (z !== 'iconos' && z !== 'barra' && !ventanaAbierta)}
            onClick={() => tocarZona(z)}
          >
            {ETIQUETA_ZONA[z]}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="Explora el escritorio"
      pasoEtiqueta="Parte"
      pasoActual={Math.min(idx + 1, TOTAL)}
      pasosTotal={TOTAL}
      marcadorEtiqueta="Partes"
      marcadorValor={`${terminado ? TOTAL : idx}/${TOTAL}`}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={<p className="gabinete-nota">Sala de las piezas · el escritorio es la mesa de trabajo de la máquina</p>}
      final={
        terminado
          ? {
              insigniaNombre: 'Explorador del escritorio',
              insigniaEmoji: '🖥️',
              titulo: '¡Escritorio explorado!',
              detalle: 'Reconociste los íconos, la ventana, la barra de tareas y el botón de cerrar.',
              resumen: [
                { etiqueta: 'Partes', valor: `${TOTAL}` },
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

export default LabExploraElEscritorio;
