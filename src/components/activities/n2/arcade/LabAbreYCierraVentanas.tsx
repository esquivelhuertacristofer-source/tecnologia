'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { Consigna3D, PanelBastidor3D } from '../../arcade3d/piezas3d';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';

/**
 * «Abre y cierra ventanas» (N2·U3, parada 1) — El escritorio de las ventanas, en 3D.
 *
 * R1 «¿Qué botón pulso?»: Bit pide una acción (agrandar, guardar a un lado,
 * cerrar) y el alumno toca el botón correcto en la barra de título de la
 * ventana de juguete, dibujada en la pantalla 3D. R2 «¿A qué ventana cambio?»:
 * el alumno toca, en la barra de programas física, el icono del programa que
 * Bit pide; la pantalla 3D muestra el programa buscado.
 */

const LINEAS = {
  inicio: '¡Bienvenido a mi escritorio! ¿Qué botón necesito para esto?',
  botonAcertado: '¡Ese es el botón! Justo lo que hacía falta.',
  botonFallado: 'Mmm, ese botón hace otra cosa. Fíjate bien en lo que te pido.',
  ronda2: 'Ahora tengo varios programas abiertos. ¿A cuál cambio?',
  programaAcertado: '¡Esa ventana es! Cambiaste sin cerrar ninguna otra.',
  programaFallado: 'Mmm, ese no es el programa que necesito. Mira bien los iconos de la barra.',
  completar: '¡Escritorio dominado! Ya sabes abrir, cerrar y cambiar entre ventanas.',
} as const;

type Boton = 'minimizar' | 'maximizar' | 'cerrar';

const BOTONES: { id: Boton; simbolo: string; etiqueta: string }[] = [
  { id: 'minimizar', simbolo: '─', etiqueta: 'Minimizar' },
  { id: 'maximizar', simbolo: '▢', etiqueta: 'Maximizar' },
  { id: 'cerrar', simbolo: '✕', etiqueta: 'Cerrar' },
];

interface RetoBoton {
  id: string;
  boton: Boton;
  consigna: string;
}

/** R1: seis retos, en el orden en que Bit los pide (maximizar/minimizar/cerrar x2). */
const R1_RETOS: RetoBoton[] = [
  { id: '1', boton: 'maximizar', consigna: 'Quiero ver el dibujo bien grande, ocupando toda la pantalla.' },
  { id: '2', boton: 'minimizar', consigna: 'Guarda esta ventana a un lado; no la cierres, solo la necesito un momento.' },
  { id: '3', boton: 'cerrar', consigna: 'Ya terminé con este programa. Ciérralo.' },
  { id: '4', boton: 'maximizar', consigna: 'Hazla más grande para leer mejor el texto.' },
  { id: '5', boton: 'minimizar', consigna: 'Quítala de en medio, pero no la cierres todavía.' },
  { id: '6', boton: 'cerrar', consigna: 'Ya no la necesito. Ciérrala.' },
];

interface RetoPrograma {
  id: string;
  nombre: string;
  icono: string;
}

/** R2: cuatro programas de la barra, en el orden en que Bit los pide. */
const R2_RETOS: RetoPrograma[] = [
  { id: 'dibujo', nombre: 'Dibujo', icono: '🎨' },
  { id: 'notas', nombre: 'Notas', icono: '📝' },
  { id: 'calculadora', nombre: 'Calculadora', icono: '🔢' },
  { id: 'musica', nombre: 'Música', icono: '🎵' },
];

const formatTiempo = (segundos: number) => {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

export function LabAbreYCierraVentanas(props: ActivityProps & { alSalir?: () => void }) {
  const [ronda, setRonda] = useState<0 | 1>(0);
  const [idx, setIdx] = useState(0);
  const [estadoBotones, setEstadoBotones] = useState<Record<string, 'correcta' | 'mal'>>({});
  const [malPrograma, setMalPrograma] = useState<string | null>(null);

  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [erroresFinal, setErroresFinal] = useState(0);
  const [tiempoFinal, setTiempoFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, aviso, ronda, idx });

  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, aviso, ronda, idx };
  });
  useEffect(() => {
    sim.current.inicio = Date.now();
    propsRef.current.onProgress(0);
    propsRef.current.onScore(100);
  }, []);

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

  const terminar = (tiempoSegundos: number) => {
    const s = sim.current;
    reproducirTono('complete');
    hablar(LINEAS.completar);
    const score = puntaje();
    propsRef.current.onScore(score);
    propsRef.current.onComplete({ score, stars: 3, xp: score, errores: s.errores, tiempoSegundos });
    setErroresFinal(s.errores);
    setTiempoFinal(tiempoSegundos);
    setTerminado(true);
  };

  const errar = () => {
    const s = sim.current;
    reproducirTono('error');
    s.errores += 1;
    propsRef.current.onScore(puntaje());
  };

  const cambiarRonda = () => {
    const s = sim.current;
    s.ocupado = true;
    reproducirTono('save');
    hablar(LINEAS.ronda2);
    propsRef.current.onProgress(0.5);
    setAviso('Ronda 2 · ¿A qué ventana cambio?');
    timers.despues(() => {
      if (vivo.current.terminado) return;
      setRonda(1);
      setIdx(0);
      setAviso(null);
      s.ocupado = false;
    }, 1600);
  };

  const marcarBoton = (id: string, estado: 'correcta' | 'mal', duracion: number) => {
    setEstadoBotones((e) => ({ ...e, [id]: estado }));
    timers.despues(() => {
      setEstadoBotones((e) => {
        if (e[id] !== estado) return e;
        const siguiente = { ...e };
        delete siguiente[id];
        return siguiente;
      });
    }, duracion);
  };

  const responderBoton = (boton: Boton) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 0) return;
    const reto = R1_RETOS[v.idx];
    if (boton === reto.boton) {
      s.ocupado = true;
      reproducirTono('correct');
      hablar(LINEAS.botonAcertado, { una: true });
      marcarBoton(boton, 'correcta', 650);
      timers.despues(() => {
        if (vivo.current.terminado) return;
        s.ocupado = false;
        if (v.idx + 1 < R1_RETOS.length) {
          setIdx(v.idx + 1);
        } else {
          cambiarRonda();
        }
      }, 650);
    } else {
      errar();
      hablar(LINEAS.botonFallado);
      marcarBoton(boton, 'mal', 460);
    }
  };

  const responderPrograma = (id: string) => {
    const s = sim.current;
    const v = vivo.current;
    if (v.terminado || v.aviso || s.ocupado || v.ronda !== 1) return;
    const reto = R2_RETOS[v.idx];
    if (id === reto.id) {
      s.ocupado = true;
      reproducirTono('correct');
      hablar(LINEAS.programaAcertado, { una: true });
      timers.despues(() => {
        if (vivo.current.terminado) return;
        s.ocupado = false;
        if (v.idx + 1 < R2_RETOS.length) {
          setIdx(v.idx + 1);
        } else {
          terminar(Math.round((Date.now() - s.inicio) / 1000));
        }
      }, 650);
    } else {
      errar();
      hablar(LINEAS.programaFallado);
      setMalPrograma(id);
      timers.despues(() => setMalPrograma((m) => (m === id ? null : m)), 460);
    }
  };

  const repetir = () => {
    const s = sim.current;
    s.ocupado = false;
    s.errores = 0;
    s.inicio = Date.now();
    setRonda(0);
    setIdx(0);
    setEstadoBotones({});
    setMalPrograma(null);
    setAviso(null);
    setTerminado(false);
    setErroresFinal(0);
    setTiempoFinal(0);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const enR1 = ronda === 0;
  const retoR1 = R1_RETOS[idx];
  const retoR2 = R2_RETOS[idx];

  const marcador = enR1
    ? { etiqueta: 'Botones', valor: `${idx + 1}/${R1_RETOS.length}` }
    : { etiqueta: 'Programas', valor: `${idx + 1}/${R2_RETOS.length}` };

  const consigna = enR1
    ? { titulo: '¿Qué botón pulso?', texto: retoR1.consigna }
    : { titulo: retoR2.nombre, texto: `Cambia a la ventana de ${retoR2.nombre} en la barra de programas.` };

  const bloqueado = terminado || !!aviso;

  /** La ventana de juguete con su barra de título (R1). Botones diegéticos en la pantalla 3D. */
  const renderVentana = () => (
    <div className="ventana-mock">
      <div className="ventana-mock-barra">
        <span className="ventana-mock-icono" aria-hidden="true">
          🖼️
        </span>
        <span className="ventana-mock-titulo">Mi dibujo</span>
        <div className="ventana-mock-botones" role="group" aria-label="Botones de la ventana">
          {BOTONES.map((b) => (
            <button
              key={b.id}
              type="button"
              className={`ventana-mock-boton ventana-mock-boton--${b.id}${
                estadoBotones[b.id] ? ` ${estadoBotones[b.id]}` : ''
              }`}
              onClick={() => responderBoton(b.id)}
              aria-label={b.etiqueta}
            >
              {b.simbolo}
            </button>
          ))}
        </div>
      </div>
      <div className="ventana-mock-cuerpo" aria-hidden="true">
        🖍️
      </div>
    </div>
  );

  /** El programa que Bit pide (R2), mostrado grande en la pantalla 3D. */
  const renderProgramaObjetivo = () => (
    <div className="ventanas3d-objetivo" aria-live="polite">
      <span className="ventanas3d-objetivo-icono" aria-hidden>
        {retoR2.icono}
      </span>
      <span className="ventanas3d-objetivo-cambia">Cambia a</span>
      <span className="ventanas3d-objetivo-nombre">{retoR2.nombre}</span>
    </div>
  );

  // ── Escena 3D: la ventana de juguete (R1) o el programa buscado (R2), sobre un bastidor ──
  const escena = (
    <>
      <Consigna3D titulo={consigna.titulo} texto={consigna.texto} position={[0, MOSTRADOR_Y + 2.5, -0.3]} />
      <PanelBastidor3D position={[0, MOSTRADOR_Y + 1.05, 0.8]} ancho={enR1 ? 3.0 : 2.6} alto={enR1 ? 1.9 : 1.7}>
        <div className="ventanas3d-pantalla">{enR1 ? renderVentana() : renderProgramaObjetivo()}</div>
      </PanelBastidor3D>
    </>
  );

  // ── Respaldo HTML (sin WebGL): misma consigna y misma vista ──
  const respaldo = (
    <div className="safari-tablero">
      <div className="pasos-consigna">
        <strong>{consigna.titulo}</strong>
        <span>{consigna.texto}</span>
      </div>
      {enR1 ? renderVentana() : renderProgramaObjetivo()}
    </div>
  );

  // ── Charola física del gabinete: la barra de programas (solo R2). En R1 los botones están en la ventana. ──
  const base =
    terminado || enR1 ? undefined : (
      <>
        <span className="gabinete-nota">Barra de programas</span>
        <div className="taskbar" role="group" aria-label="Elige el programa">
          {R2_RETOS.map((programa) => (
            <button
              key={programa.id}
              type="button"
              className={`taskbar-icono${malPrograma === programa.id ? ' mal' : ''}`}
              onClick={() => responderPrograma(programa.id)}
              aria-label={`Programa: ${programa.nombre}`}
            >
              <span className="taskbar-icono-emoji" aria-hidden="true">
                {programa.icono}
              </span>
              <span className="taskbar-icono-nombre">{programa.nombre}</span>
            </button>
          ))}
        </div>
      </>
    );

  return (
    <ArcadeSala3D
      titulo="Abre y cierra ventanas"
      pasoEtiqueta="Ronda"
      pasoActual={ronda + 1}
      pasosTotal={2}
      marcadorEtiqueta={marcador.etiqueta}
      marcadorValor={marcador.valor}
      bit={linea}
      paleta={{ acento: '#38BDF8', acento2: '#A855F7' }}
      activa={!bloqueado}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      base={base}
      alSalir={props.alSalir}
      final={
        terminado
          ? {
              insigniaNombre: 'Maestro de ventanas',
              insigniaEmoji: '🪟',
              titulo: '¡Escritorio dominado!',
              detalle:
                'Aprendiste a minimizar, maximizar y cerrar ventanas, y a cambiar entre varios programas abiertos.',
              resumen: [
                { etiqueta: 'Botones', valor: `${R1_RETOS.length + R2_RETOS.length}` },
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

export default LabAbreYCierraVentanas;
