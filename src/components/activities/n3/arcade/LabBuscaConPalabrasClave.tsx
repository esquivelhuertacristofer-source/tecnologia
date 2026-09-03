'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { ConsolaBusqueda3D, RielPalabras3D } from './piezasN3U3';
import { FichaTomable3D, type EstadoExhibicion } from './museoN3';

/**
 * N3·U3 · Parada 2 «Busca con palabras clave» (documento §18.2).
 *
 * Aparato dedicado: la consola de búsqueda, con la pregunta grabada arriba, la
 * ranura donde encajan las palabras y la lupa empotrada en su costado. Las
 * fichas cuelgan de un riel al frente del mueble: las de relleno tiemblan al
 * acercarles el dedo, que es la pista física del documento.
 */

const LINEAS = {
  inicio: 'Internet es enorme. Para encontrar algo hay que elegir las palabras justas. ¿Buscamos juntos?',
  correcta: '¡Esas palabras clave son perfectas! Directo a lo que buscabas.',
  vaga: 'Con esas palabras aparece de todo. Elige las más importantes.',
  sobra: 'No necesitas una pregunta larga: bastan las palabras clave.',
  reintento: 'Si no encuentras, cambia las palabras e intenta de nuevo.',
  fin: '¡Búsquedas dominadas! Ya sabes encontrar lo que quieras.',
};

/** Una ficha del riel. Solo las `clave` deben terminar en la ranura. */
interface Palabra {
  id: string;
  texto: string;
  tipo: 'clave' | 'relleno';
}

interface Ronda {
  pregunta: string;
  palabras: Palabra[];
  resultado: string;
  ruido: string;
}

const RONDAS: Ronda[] = [
  {
    pregunta: 'qué comen los pandas',
    palabras: [
      { id: 'r1-porfavor', texto: 'por favor', tipo: 'relleno' },
      { id: 'r1-comen', texto: 'comen', tipo: 'clave' },
      { id: 'r1-megustaria', texto: 'me gustaría', tipo: 'relleno' },
      { id: 'r1-pandas', texto: 'pandas', tipo: 'clave' },
      { id: 'r1-ositos', texto: 'ositos', tipo: 'relleno' },
    ],
    resultado: 'Los pandas comen casi solo bambú, hasta doce horas al día.',
    ruido: 'Aparecieron millones de resultados de todo tipo… y nada de pandas.',
  },
  {
    pregunta: 'tamaño de la ballena azul',
    palabras: [
      { id: 'r2-ballena', texto: 'ballena', tipo: 'clave' },
      { id: 'r2-animalgrande', texto: 'animal grande', tipo: 'relleno' },
      { id: 'r2-azul', texto: 'azul', tipo: 'clave' },
      { id: 'r2-tamano', texto: 'tamaño', tipo: 'clave' },
      { id: 'r2-muymuy', texto: 'muy muy', tipo: 'relleno' },
    ],
    resultado: 'La ballena azul mide hasta treinta metros: es el animal más grande del planeta.',
    ruido: 'Salieron fotos de animales cualquiera, ninguna de la ballena azul.',
  },
  {
    pregunta: 'cómo se hace un volcán de juguete',
    palabras: [
      { id: 'r3-cosas', texto: 'cosas', tipo: 'relleno' },
      { id: 'r3-volcan', texto: 'volcán', tipo: 'clave' },
      { id: 'r3-hacer', texto: 'hacer', tipo: 'clave' },
      { id: 'r3-porfa', texto: 'porfa', tipo: 'relleno' },
      { id: 'r3-juguete', texto: 'juguete', tipo: 'clave' },
    ],
    resultado: 'Con bicarbonato, vinagre y pintura roja sale un volcán de juguete que hace erupción.',
    ruido: 'Aparecieron volcanes de verdad, mapas y noticias: nada para armar en casa.',
  },
];

const TOTAL = RONDAS.length;

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabBuscaConPalabrasClave(props: ActivityProps & { alSalir?: () => void }) {
  const [idx, setIdx] = useState(0);
  const [elegidas, setElegidas] = useState<string[]>([]);
  const [estado, setEstado] = useState<EstadoExhibicion>('espera');
  const [resultado, setResultado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, fallosRonda: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, idx, elegidas });

  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, idx, elegidas };
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

  const encajar = (id: string) => {
    if (vivo.current.terminado || sim.current.ocupado) return;
    if (vivo.current.elegidas.includes(id)) return;
    reproducirTono('select');
    setResultado(null);
    setEstado('listo');
    setElegidas((previas) => [...previas, id]);
  };

  const quitar = (id: string) => {
    if (vivo.current.terminado || sim.current.ocupado) return;
    reproducirTono('select');
    setResultado(null);
    setElegidas((previas) => {
      const quedan = previas.filter((p) => p !== id);
      setEstado(quedan.length ? 'listo' : 'espera');
      return quedan;
    });
  };

  const buscar = () => {
    if (vivo.current.terminado || sim.current.ocupado) return;
    const ronda = RONDAS[vivo.current.idx];
    const puestas = vivo.current.elegidas;
    if (puestas.length === 0) return;

    const claves = ronda.palabras.filter((p) => p.tipo === 'clave').map((p) => p.id);
    const sobra = puestas.some((id) => !claves.includes(id));
    const falta = claves.some((id) => !puestas.includes(id));

    if (sobra || falta) {
      reproducirTono('error');
      sim.current.errores += 1;
      sim.current.fallosRonda += 1;
      propsRef.current.onScore(puntaje());
      setEstado('mal');
      setResultado(ronda.ruido);
      // Tras el segundo tropiezo de la misma búsqueda, Bit recuerda que se
      // puede cambiar las palabras y volver a intentar (ayuda del documento).
      hablar(sim.current.fallosRonda >= 2 ? LINEAS.reintento : sobra ? LINEAS.sobra : LINEAS.vaga);
      timers.despues(() => setEstado(puestas.length ? 'listo' : 'espera'), 900);
      return;
    }

    sim.current.ocupado = true;
    sim.current.fallosRonda = 0;
    reproducirTono('correct');
    setEstado('ok');
    setResultado(ronda.resultado);
    hablar(LINEAS.correcta);

    const hechas = vivo.current.idx + 1;
    propsRef.current.onScore(puntaje());
    propsRef.current.onProgress(hechas / TOTAL);

    if (hechas === TOTAL) {
      reproducirTono('save');
      setAviso('¡Búsquedas dominadas!');
      timers.despues(() => {
        setAviso(null);
        sim.current.ocupado = false;
        terminar();
      }, 1600);
      return;
    }

    timers.despues(() => {
      setIdx(hechas);
      setElegidas([]);
      setResultado(null);
      setEstado('espera');
      sim.current.ocupado = false;
    }, 1800);
  };

  const repetir = () => {
    timers.limpiar();
    sim.current.errores = 0;
    sim.current.fallosRonda = 0;
    sim.current.ocupado = false;
    sim.current.inicio = Date.now();
    setIdx(0);
    setElegidas([]);
    setResultado(null);
    setEstado('espera');
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const ronda = RONDAS[Math.min(idx, TOTAL - 1)];
  const puestas = ronda.palabras.filter((p) => elegidas.includes(p.id));
  const sueltas = ronda.palabras.filter((p) => !elegidas.includes(p.id));

  const escena = (
    <>
      <ConsolaBusqueda3D
        position={[0, MOSTRADOR_Y + 1.75, -0.3]}
        pregunta={ronda.pregunta}
        elegidas={puestas.map((p) => ({ id: p.id, texto: p.texto }))}
        resultado={resultado}
        estado={estado}
        onQuitar={quitar}
        onSoltar={encajar}
        onBuscar={buscar}
        disabled={terminado}
        reduceMotion={reduceMotion}
      />
      <RielPalabras3D position={[0, MOSTRADOR_Y - 0.42, 0.6]}>
        <div className="busqueda3d-riel">
          {sueltas.map((p) => (
            <FichaTomable3D
              key={p.id}
              id={p.id}
              className={`busqueda3d-palabra busqueda3d-palabra--${p.tipo}`}
              ariaLabel={`Palabra: ${p.texto}`}
              disabled={terminado}
              onElegir={() => encajar(p.id)}
            >
              {p.texto}
            </FichaTomable3D>
          ))}
          {sueltas.length === 0 && <span className="busqueda3d-riel-vacio">Riel vacío: ya usaste todas las fichas.</span>}
        </div>
      </RielPalabras3D>
    </>
  );

  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">Quieres saber: {ronda.pregunta}</p>
      <div className="escena3d-respaldo-fila">
        {ronda.palabras.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`busqueda3d-respaldo${elegidas.includes(p.id) ? ' busqueda3d-respaldo--puesta' : ''}`}
            aria-label={`Palabra: ${p.texto}`}
            disabled={terminado}
            onClick={() => (elegidas.includes(p.id) ? quitar(p.id) : encajar(p.id))}
          >
            {p.texto}
          </button>
        ))}
      </div>
      <div className="escena3d-respaldo-fila">
        <button
          type="button"
          className="busqueda3d-respaldo"
          aria-label="Buscar con las palabras de la ranura"
          disabled={terminado || elegidas.length === 0}
          onClick={buscar}
        >
          🔎 Buscar
        </button>
      </div>
      {resultado && <p className="escena3d-respaldo-titulo">{resultado}</p>}
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="Busca con palabras clave"
      pasoEtiqueta="Búsqueda"
      pasoActual={Math.min(idx + 1, TOTAL)}
      pasosTotal={TOTAL}
      marcadorEtiqueta="Búsquedas"
      marcadorValor={`${terminado ? TOTAL : idx}/${TOTAL}`}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={<p className="gabinete-nota">Sala de la red · la consola que encuentra lo que le pidas bien</p>}
      final={
        terminado
          ? {
              insigniaNombre: 'Cazador de respuestas',
              insigniaEmoji: '🔎',
              titulo: '¡Búsquedas dominadas!',
              detalle: 'Elegiste solo las palabras clave y la consola encontró justo lo que buscabas.',
              resumen: [
                { etiqueta: 'Búsquedas', valor: `${TOTAL}` },
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

export default LabBuscaConPalabrasClave;
