'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { FichaTomable3D, ZonaSoltar3D } from './museoN3';
import { GatoEscenario3D, PercheroDisfraces3D, TeatroEscenario3D, type PoseGato } from './piezasN3U4';

/**
 * N3·U4 · Parada 1 «Conoce Scratch» (documento §19).
 *
 * Tres etapas encadenadas dentro del mismo teatro: primero se toca cada parte
 * para que Bit la nombre, luego Bit pregunta y hay que señalarla, y al final se
 * cuelga un disfraz al gato para ver que cambiar de disfraz cambia la pose.
 *
 * Regla anti-genérico: cada parte se toca en su PROPIA cara del mueble —el canto
 * del escenario, el atril de piso junto al gato, la barra del perchero— así que
 * no existe ninguna botonera suelta.
 */

const LINEAS = {
  inicio: '¡Bienvenido a mi estudio! Aquí programamos con bloques. Primero, conoce el teatro.',
  escenario: '¡Ese es el escenario! Aquí actúa nuestro personaje.',
  gato: '¡El gato! Es el objeto que recibe nuestras órdenes.',
  disfraces: 'Y estos son sus disfraces: cambia uno y verás otra pose.',
  cambio: '¡Buen cambio de disfraz! Si los cambias rápido, parece que se mueve.',
  fin: '¡Ya conoces mi estudio! Ahora sí, a darle órdenes con bloques.',
  preguntas: 'Ahora te toca a ti: yo pregunto y tú tocas la parte correcta.',
  vestir: '¡Último paso! Toma un disfraz del perchero y ponlo en el gato.',
  fallo: 'Esa no es. Piensa en lo que hace cada parte y vuelve a tocar.',
  pista: 'Te doy una pista: la parte que buscas es la que acabo de describir.',
};

type Parte = 'escenario' | 'gato' | 'disfraces';

const NOMBRE: Record<Parte, string> = {
  escenario: 'El escenario',
  gato: 'El personaje',
  disfraces: 'Los disfraces',
};

const PRESENTACION: Record<Parte, string> = {
  escenario: LINEAS.escenario,
  gato: LINEAS.gato,
  disfraces: LINEAS.disfraces,
};

const PREGUNTAS: { pide: string; parte: Parte }[] = [
  { pide: '¿Dónde actúa el personaje?', parte: 'escenario' },
  { pide: '¿Quién recibe las órdenes?', parte: 'gato' },
  { pide: '¿Qué le cambia la pose al gato?', parte: 'disfraces' },
];

interface Disfraz {
  id: string;
  nombre: string;
  emoji: string;
  color: string;
  pose: PoseGato;
}

const DISFRACES: Disfraz[] = [
  { id: 'naranja', nombre: 'Naranja', emoji: '🟠', color: '#F5A524', pose: 'reposo' },
  { id: 'cian', nombre: 'Cian', emoji: '🔵', color: '#22D3EE', pose: 'abiertas' },
  { id: 'verde', nombre: 'Verde', emoji: '🟢', color: '#4ADE80', pose: 'salto' },
];

const TOTAL_PASOS = 7;

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabConoceScratch(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<'explora' | 'identifica' | 'disfraz'>('explora');
  const [tocadas, setTocadas] = useState<Parte[]>([]);
  const [pregunta, setPregunta] = useState(0);
  /** Preguntas ya acertadas. Va aparte de `pregunta` porque la última acertada
   *  no avanza el índice —ya no hay siguiente— y el marcador debe llegar a 3/3. */
  const [aciertos, setAciertos] = useState(0);
  const [resalta, setResalta] = useState<Parte | null>(null);
  const [falla, setFalla] = useState<Parte | null>(null);
  const [disfraz, setDisfraz] = useState<Disfraz>(DISFRACES[0]);
  const [vestido, setVestido] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, fallosRonda: 0, inicio: 0 });
  const propsRef = useRef(props);

  useEffect(() => {
    propsRef.current = props;
  });
  useEffect(() => {
    sim.current.inicio = Date.now();
  }, []);

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

  const avance = (hechos: number) => {
    propsRef.current.onProgress(hechos / TOTAL_PASOS);
    propsRef.current.onScore(puntaje());
  };

  const terminar = (tiempoSegundos: number) => {
    reproducirTono('complete');
    hablar(LINEAS.fin);
    const score = puntaje();
    propsRef.current.onProgress(1);
    propsRef.current.onScore(score);
    propsRef.current.onComplete({
      score,
      stars: 3,
      xp: score,
      errores: sim.current.errores,
      tiempoSegundos,
    });
    setTiempoFinal(tiempoSegundos);
    setErroresFinal(sim.current.errores);
    setTerminado(true);
  };

  /** Tocar una parte: en «explora» la presenta, en «identifica» la responde. */
  const tocar = (parte: Parte) => {
    if (sim.current.ocupado || terminado) return;

    if (fase === 'explora') {
      if (tocadas.includes(parte)) {
        reproducirTono('select');
        hablar(PRESENTACION[parte]);
        return;
      }
      reproducirTono('correct');
      setResalta(parte);
      timers.despues(() => setResalta(null), 900);
      const nuevas = [...tocadas, parte];
      setTocadas(nuevas);
      hablar(PRESENTACION[parte]);
      avance(nuevas.length);
      if (nuevas.length === 3) {
        sim.current.ocupado = true;
        setAviso('Etapa 2: ahora Bit pregunta');
        timers.despues(() => {
          setFase('identifica');
          setAviso(null);
          hablar(LINEAS.preguntas);
          sim.current.ocupado = false;
        }, 1700);
      }
      return;
    }

    if (fase === 'identifica') {
      const esperada = PREGUNTAS[pregunta].parte;
      if (parte !== esperada) {
        reproducirTono('error');
        sim.current.errores += 1;
        sim.current.fallosRonda += 1;
        setFalla(parte);
        timers.despues(() => setFalla(null), 500);
        hablar(sim.current.fallosRonda >= 2 ? LINEAS.pista : LINEAS.fallo);
        return;
      }
      sim.current.ocupado = true;
      sim.current.fallosRonda = 0;
      reproducirTono('correct');
      setResalta(parte);
      timers.despues(() => setResalta(null), 900);
      const hechas = pregunta + 1;
      setAciertos(hechas);
      avance(3 + hechas);
      if (hechas === PREGUNTAS.length) {
        setAviso('Etapa 3: vístelo con un disfraz');
        timers.despues(() => {
          setFase('disfraz');
          setAviso(null);
          hablar(LINEAS.vestir);
          sim.current.ocupado = false;
        }, 1700);
      } else {
        timers.despues(() => {
          setPregunta(hechas);
          hablar(PREGUNTAS[hechas].pide);
          sim.current.ocupado = false;
        }, 1000);
      }
      return;
    }

    // En la etapa del disfraz, tocar el perchero solo recuerda qué hay que hacer.
    reproducirTono('select');
    hablar(LINEAS.vestir);
  };

  /** Colgar un disfraz al gato: cierra la parada. */
  const vestir = (id: string) => {
    if (sim.current.ocupado || terminado || fase !== 'disfraz') return;
    const elegido = DISFRACES.find((d) => d.id === id);
    if (!elegido) return;
    sim.current.ocupado = true;
    reproducirTono('connect');
    setDisfraz(elegido);
    setVestido(true);
    hablar(LINEAS.cambio);
    avance(7);
    reproducirTono('save');
    setAviso(`Disfraz puesto: ${elegido.nombre}`);
    timers.despues(() => terminar(Math.round((Date.now() - sim.current.inicio) / 1000)), 1900);
  };

  const repetir = () => {
    timers.limpiar();
    sim.current = { ocupado: false, errores: 0, fallosRonda: 0, inicio: Date.now() };
    setFase('explora');
    setTocadas([]);
    setPregunta(0);
    setAciertos(0);
    setResalta(null);
    setFalla(null);
    setDisfraz(DISFRACES[0]);
    setVestido(false);
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const consigna =
    fase === 'explora'
      ? `Toca las tres partes del estudio (${tocadas.length}/3)`
      : fase === 'identifica'
        ? PREGUNTAS[pregunta].pide
        : vestido
          ? '¡El gato cambió de pose!'
          : 'Toma un disfraz del perchero y ponlo en el gato';

  const claseParte = (p: Parte) =>
    [
      'estudio3d-parte',
      tocadas.includes(p) ? 'estudio3d-parte--visto' : '',
      resalta === p ? 'estudio3d-parte--ok' : '',
      falla === p ? 'estudio3d-parte--mal' : '',
    ]
      .filter(Boolean)
      .join(' ');

  const botonParte = (p: Parte, etiqueta: string, extra = '') => (
    <button
      type="button"
      className={`${claseParte(p)} ${extra}`.trim()}
      aria-label={`Tocar ${NOMBRE[p].toLowerCase()}`}
      disabled={terminado}
      onClick={() => tocar(p)}
    >
      <span className="estudio3d-parte-nombre">{NOMBRE[p]}</span>
      <span className="estudio3d-parte-pie">{etiqueta}</span>
    </button>
  );

  const escena = (
    <>
      <TeatroEscenario3D
        position={[-1.55, MOSTRADOR_Y, 0]}
        ancho={3.4}
        reduceMotion={reduceMotion}
        cartela={
          <p className="estudio3d-cartela">
            <span className="estudio3d-cartela-tag">Estudio de bloques</span>
            {consigna}
          </p>
        }
        letrero={
          fase === 'disfraz' && !vestido ? (
            <ZonaSoltar3D className="estudio3d-atril estudio3d-atril--suelta" onSoltar={vestir}>
              <span className="estudio3d-atril-nombre">Suelta aquí el disfraz</span>
              <span className="estudio3d-atril-pie">o toca una percha</span>
            </ZonaSoltar3D>
          ) : (
            botonParte('gato', 'el objeto que obedece', 'estudio3d-parte--atril')
          )
        }
        canto={botonParte('escenario', 'donde ocurre la función')}
      >
        <GatoEscenario3D
          // Actúa en la mitad derecha de las tablas: el atril de piso ocupa la
          // izquierda y así ninguna cara del mueble le pasa por delante.
          destino={{ x: 0.45, z: 0.24, rumbo: -0.4 }}
          pose={disfraz.pose}
          color={disfraz.color}
          celebrando={vestido}
          reduceMotion={reduceMotion}
        />
      </TeatroEscenario3D>

      <PercheroDisfraces3D position={[2.6, MOSTRADOR_Y, 0.4]} ganchos={DISFRACES.length}>
        {fase === 'disfraz' && !vestido ? (
          <div className="estudio3d-perchero">
            <span className="estudio3d-perchero-titulo">Disfraces</span>
            <div className="estudio3d-perchas">
              {DISFRACES.map((d) => (
                <FichaTomable3D
                  key={d.id}
                  id={d.id}
                  className="estudio3d-percha"
                  ariaLabel={`Disfraz: ${d.nombre}`}
                  disabled={terminado}
                  onElegir={() => vestir(d.id)}
                >
                  <span className="estudio3d-percha-emoji">{d.emoji}</span>
                  <span className="estudio3d-percha-nombre">{d.nombre}</span>
                </FichaTomable3D>
              ))}
            </div>
          </div>
        ) : (
          <div className="estudio3d-perchero">
            <span className="estudio3d-perchero-titulo">Perchero</span>
            {botonParte('disfraces', 'las poses del gato')}
          </div>
        )}
      </PercheroDisfraces3D>
    </>
  );

  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">{consigna}</p>
      <div className="escena3d-respaldo-fila">
        <button type="button" aria-label="Tocar el escenario" onClick={() => tocar('escenario')} disabled={terminado}>
          El escenario
        </button>
        <button type="button" aria-label="Tocar el personaje" onClick={() => tocar('gato')} disabled={terminado}>
          El personaje
        </button>
        <button type="button" aria-label="Tocar los disfraces" onClick={() => tocar('disfraces')} disabled={terminado}>
          Los disfraces
        </button>
      </div>
      {fase === 'disfraz' && !vestido && (
        <div className="escena3d-respaldo-fila">
          {DISFRACES.map((d) => (
            <button key={d.id} type="button" aria-label={`Disfraz: ${d.nombre}`} onClick={() => vestir(d.id)}>
              {d.emoji} {d.nombre}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const etapa = fase === 'explora' ? 1 : fase === 'identifica' ? 2 : 3;
  const marcador =
    fase === 'explora'
      ? { etiqueta: 'Partes', valor: `${tocadas.length}/3` }
      : fase === 'identifica'
        ? { etiqueta: 'Aciertos', valor: `${aciertos}/3` }
        : { etiqueta: 'Disfraz', valor: `${vestido ? 1 : 0}/1` };

  return (
    <ArcadeSala3D
      titulo="Conoce Scratch"
      pasoEtiqueta="Etapa"
      pasoActual={etapa}
      pasosTotal={3}
      marcadorEtiqueta={marcador.etiqueta}
      marcadorValor={marcador.valor}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={<p className="gabinete-nota">Estudio de bloques · el teatro donde actúa el gato que programas</p>}
      final={
        terminado
          ? {
              insigniaNombre: 'Explorador del estudio',
              insigniaEmoji: '🎭',
              titulo: '¡Ya conoces el estudio!',
              detalle:
                'Reconociste el escenario, el personaje y sus disfraces, y cambiaste una pose. Eso es todo lo que necesitas para empezar a programar con bloques.',
              resumen: [
                { etiqueta: 'Partes', valor: '3' },
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

export default LabConoceScratch;
