'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { DetectorSitios3D, PalancaSemaforo3D, type SenalSitio } from './piezasN3U3';

/**
 * N3·U3 · Parada 3 «Detector de sitios confiables» (documento §18.3).
 *
 * Aparato dedicado: el detector, un mueble con capota, dos focos de semáforo
 * empotrados arriba y la tarjeta del sitio revelada en su bisel. El veredicto
 * se da bajando una de las dos palancas plantadas frente al mueble —nunca con
 * botones flotantes—, y tocar una señal hace que Bit la explique en voz alta.
 */

const LINEAS = {
  inicio: 'Soy detective de sitios. Vamos a revisar cuáles son confiables y cuáles no. ¿Me ayudas?',
  confiable: '¡Bien visto! Ese sitio da señales de confianza.',
  sospechoso: '¡Buen ojo! Ese es sospechoso: mejor no seguir.',
  fallo: 'Mmm, revisa otra vez. ¿Te apura o te promete regalos increíbles?',
  pista: 'Nunca des tu nombre o tu contraseña para "ganar" algo.',
  fin: '¡Detector completo! Ya distingues los sitios en los que confiar.',
};

/** Una señal explicable: al tocarla, Bit dice por qué suma o resta confianza. */
interface Senal extends SenalSitio {
  explica: string;
}

interface Sitio {
  id: string;
  emoji: string;
  nombre: string;
  url: string;
  confiable: boolean;
  senales: Senal[];
}

const SITIOS: Sitio[] = [
  {
    id: 'museo',
    emoji: '🏛️',
    nombre: 'Museo de los Inventos',
    url: 'museodeinventos.mx',
    confiable: true,
    senales: [
      { id: 'museo-quien', tono: 'buena', texto: 'Dice quién lo hizo: el equipo del museo', explica: 'Cuando un sitio dice quién lo hizo, puedes saber de dónde viene la información.' },
      { id: 'museo-fuente', tono: 'buena', texto: 'Explica de dónde saca lo que cuenta', explica: 'Los sitios confiables cuentan de dónde sacaron los datos.' },
      { id: 'museo-datos', tono: 'buena', texto: 'No te pide ningún dato para leer', explica: 'Para leer algo no hace falta dar tu nombre ni tu correo.' },
    ],
  },
  {
    id: 'premio',
    emoji: '🎁',
    nombre: '¡GANASTE UN PREMIO!',
    url: 'premio-gigante-ya.com',
    confiable: false,
    senales: [
      { id: 'premio-regalo', tono: 'mala', texto: 'Te promete un premio enorme por un clic', explica: 'Nadie regala premios enormes por hacer clic. Eso es un anzuelo.' },
      { id: 'premio-prisa', tono: 'mala', texto: 'Te apura: "solo quedan 30 segundos"', explica: 'Si un sitio te mete prisa, es para que no pienses. Mala señal.' },
      { id: 'premio-anonimo', tono: 'mala', texto: 'En ninguna parte dice quién lo hizo', explica: 'Si nadie firma el sitio, no hay a quién creerle.' },
    ],
  },
  {
    id: 'escuela',
    emoji: '🏫',
    nombre: 'Escuela Primaria Benito Juárez',
    url: 'escuelabenitojuarez.edu.mx',
    confiable: true,
    senales: [
      { id: 'escuela-firma', tono: 'buena', texto: 'Trae el nombre y la dirección de la escuela', explica: 'Un sitio que dice dónde está y cómo contactarlo da confianza.' },
      { id: 'escuela-clara', tono: 'buena', texto: 'La información está clara y ordenada', explica: 'La información ordenada y sin gritos es señal de un sitio serio.' },
      { id: 'escuela-tranquilo', tono: 'buena', texto: 'No salta ninguna ventana ni te apura', explica: 'Un sitio tranquilo te deja leer a tu ritmo.' },
    ],
  },
  {
    id: 'juego',
    emoji: '🎮',
    nombre: 'Juegos Mega Gratis',
    url: 'juegos-mega-gratis.net',
    confiable: false,
    senales: [
      { id: 'juego-clave', tono: 'mala', texto: 'Te pide tu contraseña para "entrar a jugar"', explica: 'Tu contraseña es secreta: ningún juego necesita la de otro sitio.' },
      { id: 'juego-datos', tono: 'mala', texto: 'Pide tu nombre completo y tu dirección', explica: 'Tus datos personales no se regalan a cambio de un juego.' },
      { id: 'juego-anonimo', tono: 'mala', texto: 'No hay forma de saber quién lo hizo', explica: 'Sin nadie que firme, no sabes a dónde van tus datos.' },
    ],
  },
  {
    id: 'ventanas',
    emoji: '🪟',
    nombre: 'Descargas Turbo',
    url: 'descargas-turbo-hoy.net',
    confiable: false,
    senales: [
      { id: 'ventanas-saltan', tono: 'mala', texto: 'Se llena de ventanas que saltan solas', explica: 'Las ventanas que saltan quieren que hagas clic sin querer.' },
      { id: 'ventanas-publi', tono: 'mala', texto: 'Cada botón abre publicidad distinta', explica: 'Si los botones no hacen lo que dicen, el sitio te está engañando.' },
      { id: 'ventanas-virus', tono: 'mala', texto: 'Te avisa que tu computadora "tiene un virus"', explica: 'Una página no puede saber si tu computadora tiene un virus. Es mentira.' },
    ],
  },
];

const TOTAL = SITIOS.length;

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabDetectorDeSitiosConfiables(props: ActivityProps & { alSalir?: () => void }) {
  const [idx, setIdx] = useState(0);
  const [foco, setFoco] = useState<'ninguno' | 'verde' | 'rojo'>('ninguno');
  const [bajada, setBajada] = useState<'ninguna' | 'verde' | 'rojo'>('ninguna');
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

  const terminar = () => {
    reproducirTono('complete');
    hablar(LINEAS.fin);
    const tiempoSegundos = Math.round((Date.now() - sim.current.inicio) / 1000);
    const score = puntaje();
    propsRef.current.onProgress(1);
    propsRef.current.onScore(score);
    propsRef.current.onComplete({ score, stars: 3, xp: score, errores: sim.current.errores, tiempoSegundos });
    setTiempoFinal(tiempoSegundos);
    setErroresFinal(sim.current.errores);
    setTerminado(true);
  };

  const tocarSenal = (senalId: string) => {
    if (vivo.current.terminado || sim.current.ocupado) return;
    const sitio = SITIOS[vivo.current.idx];
    const senal = sitio.senales.find((s) => s.id === senalId);
    if (!senal) return;
    reproducirTono('select');
    // La señal enciende su foco del semáforo: la pista se ve en el aparato.
    setFoco(senal.tono === 'buena' ? 'verde' : 'rojo');
    hablar(senal.explica);
    timers.despues(() => setFoco('ninguno'), 1800);
  };

  const responder = (comoConfiable: boolean) => {
    if (vivo.current.terminado || sim.current.ocupado) return;
    const sitio = SITIOS[vivo.current.idx];
    const palanca = comoConfiable ? 'verde' : 'rojo';
    setBajada(palanca);

    if (comoConfiable !== sitio.confiable) {
      reproducirTono('error');
      sim.current.errores += 1;
      sim.current.fallosRonda += 1;
      propsRef.current.onScore(puntaje());
      setFoco(comoConfiable ? 'verde' : 'rojo');
      hablar(sim.current.fallosRonda >= 2 ? LINEAS.pista : LINEAS.fallo);
      timers.despues(() => {
        setBajada('ninguna');
        setFoco('ninguno');
      }, 900);
      return;
    }

    sim.current.ocupado = true;
    sim.current.fallosRonda = 0;
    reproducirTono('correct');
    setFoco(sitio.confiable ? 'verde' : 'rojo');
    hablar(sitio.confiable ? LINEAS.confiable : LINEAS.sospechoso);

    const hechos = vivo.current.idx + 1;
    propsRef.current.onScore(puntaje());
    propsRef.current.onProgress(hechos / TOTAL);

    if (hechos === TOTAL) {
      reproducirTono('save');
      setAviso('¡Detector completo!');
      timers.despues(() => {
        setAviso(null);
        sim.current.ocupado = false;
        terminar();
      }, 1600);
      return;
    }

    timers.despues(() => {
      setIdx(hechos);
      setBajada('ninguna');
      setFoco('ninguno');
      sim.current.ocupado = false;
    }, 1500);
  };

  const repetir = () => {
    timers.limpiar();
    sim.current.errores = 0;
    sim.current.fallosRonda = 0;
    sim.current.ocupado = false;
    sim.current.inicio = Date.now();
    setIdx(0);
    setFoco('ninguno');
    setBajada('ninguna');
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const sitio = SITIOS[Math.min(idx, TOTAL - 1)];

  const escena = (
    <>
      <DetectorSitios3D
        position={[0, MOSTRADOR_Y + 1.45, -0.4]}
        nombre={sitio.nombre}
        url={sitio.url}
        emoji={sitio.emoji}
        senales={sitio.senales}
        foco={foco}
        onSenal={tocarSenal}
        disabled={terminado}
        reduceMotion={reduceMotion}
      />
      <PalancaSemaforo3D
        position={[-1.85, MOSTRADOR_Y - 1.05, 1.0]}
        etiqueta="Confiable"
        detalle="Sí me fío de este sitio"
        tono="verde"
        bajada={bajada === 'verde'}
        ariaLabel={`Marcar ${sitio.nombre} como sitio confiable`}
        onClick={() => responder(true)}
        disabled={terminado}
        reduceMotion={reduceMotion}
      />
      <PalancaSemaforo3D
        position={[1.85, MOSTRADOR_Y - 1.05, 1.0]}
        etiqueta="Sospechoso"
        detalle="Mejor no seguir aquí"
        tono="rojo"
        bajada={bajada === 'rojo'}
        ariaLabel={`Marcar ${sitio.nombre} como sitio sospechoso`}
        onClick={() => responder(false)}
        disabled={terminado}
        reduceMotion={reduceMotion}
      />
    </>
  );

  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">
        {sitio.emoji} {sitio.nombre} · {sitio.url}
      </p>
      <div className="escena3d-respaldo-fila">
        {sitio.senales.map((s) => (
          <button
            key={s.id}
            type="button"
            className="detector3d-respaldo"
            aria-label={`Señal: ${s.texto}`}
            disabled={terminado}
            onClick={() => tocarSenal(s.id)}
          >
            {s.texto}
          </button>
        ))}
      </div>
      <div className="escena3d-respaldo-fila">
        <button
          type="button"
          className="detector3d-respaldo"
          aria-label={`Marcar ${sitio.nombre} como sitio confiable`}
          disabled={terminado}
          onClick={() => responder(true)}
        >
          🟢 Confiable
        </button>
        <button
          type="button"
          className="detector3d-respaldo"
          aria-label={`Marcar ${sitio.nombre} como sitio sospechoso`}
          disabled={terminado}
          onClick={() => responder(false)}
        >
          🔴 Sospechoso
        </button>
      </div>
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="Detector de sitios confiables"
      pasoEtiqueta="Sitio"
      pasoActual={Math.min(idx + 1, TOTAL)}
      pasosTotal={TOTAL}
      marcadorEtiqueta="Revisados"
      marcadorValor={`${terminado ? TOTAL : idx}/${TOTAL}`}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={<p className="gabinete-nota">Sala de la red · el detector que lee las señales de cada sitio</p>}
      final={
        terminado
          ? {
              insigniaNombre: 'Detective de la red',
              insigniaEmoji: '🕵️',
              titulo: '¡Detector completo!',
              detalle: 'Revisaste los cinco sitios y separaste los confiables de los sospechosos.',
              resumen: [
                { etiqueta: 'Sitios', valor: `${TOTAL}` },
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

export default LabDetectorDeSitiosConfiables;
