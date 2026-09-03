'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { BurbujaMensaje3D, CajaFuerte3D, MuroNetiqueta3D, RielPiezasClave3D, type MedidorClave } from './piezasN3U3';
import { FichaTomable3D, type EstadoExhibicion } from './museoN3';

/**
 * N3·U3 · Parada 4 «Netiqueta y contraseñas» (documento §18.4).
 *
 * Dos aparatos dedicados en la misma sala: el muro de netiqueta, donde los
 * mensajes cuelgan como burbujas de arcilla con su autor grabado en el canto, y
 * la caja fuerte, con la ranura de piezas en la puerta y el medidor de fuerza
 * empotrado al lado —cuatro barras que suben de rojo a verde—. El medidor
 * explica en vivo por qué la clave todavía no aguanta.
 */

const LINEAS = {
  inicio: 'En línea también hay buenos modales, y hay que cuidar tus claves. ¿Practicamos las dos cosas?',
  amable: '¡Ese sí es un mensaje de buen trato! Bien elegido.',
  inadecuado: 'Uy, ese mensaje lastima o grita. Elige uno más amable.',
  caja: 'Ahora la caja fuerte. Arma una clave larga, con letras, números y símbolos.',
  fuerte: '¡Esa contraseña es fuerte! Larga y con letras, números y símbolos.',
  debil: 'Esa es muy fácil de adivinar. Hazla más larga y mézclala.',
  fin: '¡Guardián completo! Buen trato y clave secreta: así te cuidas en línea.',
};

interface Mensaje {
  id: string;
  autor: string;
  texto: string;
  amable: boolean;
}

/** Cada par enfrenta el mismo gesto dicho bien y dicho mal. */
const PARES: [Mensaje, Mensaje][] = [
  [
    { id: 'p1-a', autor: 'Ana', texto: '¡Hola! ¿Jugamos juntos?', amable: true },
    { id: 'p1-b', autor: 'Anónimo', texto: 'Qué tonto eres, no sabes jugar.', amable: false },
  ],
  [
    { id: 'p2-a', autor: 'Leo', texto: 'PÁSAME LA TAREA AHORA MISMO', amable: false },
    { id: 'p2-b', autor: 'Sofi', texto: '¿Me pasas la tarea, por favor?', amable: true },
  ],
  [
    { id: 'p3-a', autor: 'Dani', texto: 'Te quedó genial tu dibujo.', amable: true },
    { id: 'p3-b', autor: 'Anónimo', texto: 'Jajaja, tu dibujo está horrible.', amable: false },
  ],
];

type ClasePieza = 'letras' | 'numero' | 'simbolo' | 'obvia' | 'nombre';

interface Pieza {
  id: string;
  texto: string;
  clase: ClasePieza;
}

const PIEZAS: Pieza[] = [
  { id: 'gato', texto: 'gato', clase: 'letras' },
  { id: 'luna', texto: 'luna', clase: 'letras' },
  { id: 'azul', texto: 'azul', clase: 'letras' },
  { id: 'n1234', texto: '1234', clase: 'obvia' },
  { id: 'bit', texto: 'Bit', clase: 'nombre' },
  { id: 'n7', texto: '7', clase: 'numero' },
  { id: 'n29', texto: '29', clase: 'numero' },
  { id: 'ast', texto: '*', clase: 'simbolo' },
  { id: 'gato-num', texto: '#', clase: 'simbolo' },
];

const POR_ID = new Map(PIEZAS.map((p) => [p.id, p]));
const LARGO_MINIMO = 8;
const MENSAJES = PARES.length;
const TOTAL_PASOS = MENSAJES + 1;

/** El medidor de la puerta: nivel 0-4 y el motivo escrito en la placa. */
function medir(ids: string[]): MedidorClave {
  const piezas = ids.map((id) => POR_ID.get(id)!).filter(Boolean);
  if (piezas.length === 0) return { nivel: 0, mensaje: 'Encaja piezas para armar tu clave.', fuerte: false };
  if (piezas.some((p) => p.clase === 'obvia')) {
    return { nivel: 1, mensaje: '1234 es la clave que todos prueban primero.', fuerte: false };
  }
  if (piezas.some((p) => p.clase === 'nombre')) {
    return { nivel: 1, mensaje: 'Tu nombre es lo primero que adivinarían.', fuerte: false };
  }
  const largo = piezas.reduce((suma, p) => suma + p.texto.length, 0);
  if (largo < LARGO_MINIMO) return { nivel: 1, mensaje: 'Muy corta: júntale más piezas.', fuerte: false };
  const numero = piezas.some((p) => p.clase === 'numero');
  const simbolo = piezas.some((p) => p.clase === 'simbolo');
  if (!numero && !simbolo) return { nivel: 2, mensaje: 'Solo letras: agrégale un número y un símbolo.', fuerte: false };
  if (!simbolo) return { nivel: 3, mensaje: 'Ya lleva número. Todavía le falta un símbolo.', fuerte: false };
  if (!numero) return { nivel: 3, mensaje: 'Ya lleva símbolo. Todavía le falta un número.', fuerte: false };
  return { nivel: 4, mensaje: '¡Larga y mezclada: letras, número y símbolo!', fuerte: true };
}

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabNetiquetaYContrasenas(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<'mensajes' | 'clave'>('mensajes');
  const [idx, setIdx] = useState(0);
  const [estados, setEstados] = useState<Record<string, EstadoExhibicion>>({});
  const [clave, setClave] = useState<string[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, fase, idx, clave });

  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, fase, idx, clave };
  });

  useEffect(() => {
    sim.current.inicio = Date.now();
  }, []);

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

  // El reloj se lee en el propio manejador y llega ya resuelto: leerlo aquí
  // dentro sería una llamada impura en cuerpo de componente.
  const terminar = (tiempoSegundos: number) => {
    reproducirTono('complete');
    hablar(LINEAS.fin);
    const score = puntaje();
    propsRef.current.onProgress(1);
    propsRef.current.onScore(score);
    propsRef.current.onComplete({ score, stars: 3, xp: score, errores: sim.current.errores, tiempoSegundos });
    setTiempoFinal(tiempoSegundos);
    setErroresFinal(sim.current.errores);
    setTerminado(true);
  };

  const elegirMensaje = (mensaje: Mensaje) => {
    if (vivo.current.terminado || sim.current.ocupado || vivo.current.fase !== 'mensajes') return;

    if (!mensaje.amable) {
      reproducirTono('error');
      sim.current.errores += 1;
      propsRef.current.onScore(puntaje());
      setEstados((previos) => ({ ...previos, [mensaje.id]: 'mal' }));
      hablar(LINEAS.inadecuado);
      timers.despues(() => setEstados((previos) => ({ ...previos, [mensaje.id]: 'espera' })), 760);
      return;
    }

    sim.current.ocupado = true;
    reproducirTono('correct');
    setEstados((previos) => ({ ...previos, [mensaje.id]: 'ok' }));
    hablar(LINEAS.amable);

    const hechos = vivo.current.idx + 1;
    propsRef.current.onScore(puntaje());
    propsRef.current.onProgress(hechos / TOTAL_PASOS);

    if (hechos === MENSAJES) {
      timers.despues(() => {
        setFase('clave');
        setEstados({});
        sim.current.ocupado = false;
        hablar(LINEAS.caja);
      }, 1300);
      return;
    }

    timers.despues(() => {
      setIdx(hechos);
      setEstados({});
      sim.current.ocupado = false;
    }, 1200);
  };

  const encajarPieza = (id: string) => {
    if (vivo.current.terminado || sim.current.ocupado || vivo.current.fase !== 'clave') return;
    if (vivo.current.clave.includes(id)) return;
    reproducirTono('select');
    setClave((previas) => [...previas, id]);
  };

  const quitarPieza = (id: string) => {
    if (vivo.current.terminado || sim.current.ocupado) return;
    reproducirTono('select');
    setClave((previas) => previas.filter((p) => p !== id));
  };

  const probar = () => {
    if (vivo.current.terminado || sim.current.ocupado || vivo.current.fase !== 'clave') return;
    const medida = medir(vivo.current.clave);
    if (!medida.fuerte) {
      reproducirTono('error');
      sim.current.errores += 1;
      propsRef.current.onScore(puntaje());
      hablar(LINEAS.debil);
      return;
    }

    sim.current.ocupado = true;
    reproducirTono('save');
    hablar(LINEAS.fuerte);
    propsRef.current.onScore(puntaje());
    propsRef.current.onProgress(1);
    setAviso('¡Caja fuerte cerrada!');
    timers.despues(() => {
      setAviso(null);
      sim.current.ocupado = false;
      terminar(Math.round((Date.now() - sim.current.inicio) / 1000));
    }, 1600);
  };

  const repetir = () => {
    timers.limpiar();
    sim.current.errores = 0;
    sim.current.ocupado = false;
    sim.current.inicio = Date.now();
    setFase('mensajes');
    setIdx(0);
    setEstados({});
    setClave([]);
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const par = PARES[Math.min(idx, MENSAJES - 1)];
  const medida = medir(clave);
  const sueltas = PIEZAS.filter((p) => !clave.includes(p.id));

  const escena =
    fase === 'mensajes' ? (
      <MuroNetiqueta3D
        position={[0, MOSTRADOR_Y - 0.2, -0.6]}
        alto={2.9}
        cartela="Toca el mensaje que trata bien a los demás."
      >
        {par.map((m, i) => (
          <BurbujaMensaje3D
            key={m.id}
            position={[i === 0 ? -1.8 : 1.8, 1.15, 0.3]}
            texto={m.texto}
            autor={m.autor}
            estado={estados[m.id] ?? 'espera'}
            ariaLabel={`Mensaje de ${m.autor}: ${m.texto}`}
            onClick={() => elegirMensaje(m)}
            disabled={terminado}
            reduceMotion={reduceMotion}
          />
        ))}
      </MuroNetiqueta3D>
    ) : (
      <>
        <CajaFuerte3D
          position={[0, MOSTRADOR_Y - 0.4, -0.4]}
          clave={clave.map((id) => ({ id, texto: POR_ID.get(id)!.texto }))}
          medidor={medida}
          onQuitar={quitarPieza}
          onSoltar={encajarPieza}
          onProbar={probar}
          disabled={terminado}
          reduceMotion={reduceMotion}
        />
        <RielPiezasClave3D position={[0, MOSTRADOR_Y - 1.12, 0.6]}>
          <div className="claves3d-riel">
            {sueltas.map((p) => (
              <FichaTomable3D
                key={p.id}
                id={p.id}
                className={`claves3d-pieza claves3d-pieza--${p.clase}`}
                ariaLabel={`Pieza de contraseña: ${p.texto}`}
                disabled={terminado}
                onElegir={() => encajarPieza(p.id)}
              >
                {p.texto}
              </FichaTomable3D>
            ))}
            {sueltas.length === 0 && <span className="claves3d-riel-vacio">Ya usaste todas las piezas.</span>}
          </div>
        </RielPiezasClave3D>
      </>
    );

  const respaldo =
    fase === 'mensajes' ? (
      <div className="escena3d-respaldo-lista">
        <p className="escena3d-respaldo-titulo">Toca el mensaje que trata bien a los demás.</p>
        <div className="escena3d-respaldo-fila">
          {par.map((m) => (
            <button
              key={m.id}
              type="button"
              className="claves3d-respaldo"
              aria-label={`Mensaje de ${m.autor}: ${m.texto}`}
              disabled={terminado}
              onClick={() => elegirMensaje(m)}
            >
              {m.autor}: {m.texto}
            </button>
          ))}
        </div>
      </div>
    ) : (
      <div className="escena3d-respaldo-lista">
        <p className="escena3d-respaldo-titulo">Clave: {clave.map((id) => POR_ID.get(id)!.texto).join('') || '(vacía)'}</p>
        <p className="escena3d-respaldo-titulo">{medida.mensaje}</p>
        <div className="escena3d-respaldo-fila">
          {PIEZAS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`claves3d-respaldo${clave.includes(p.id) ? ' claves3d-respaldo--puesta' : ''}`}
              aria-label={`Pieza de contraseña: ${p.texto}`}
              disabled={terminado}
              onClick={() => (clave.includes(p.id) ? quitarPieza(p.id) : encajarPieza(p.id))}
            >
              {p.texto}
            </button>
          ))}
        </div>
        <div className="escena3d-respaldo-fila">
          <button
            type="button"
            className="claves3d-respaldo"
            aria-label="Probar la contraseña en la caja fuerte"
            disabled={terminado || clave.length === 0}
            onClick={probar}
          >
            🔑 Probar clave
          </button>
        </div>
      </div>
    );

  return (
    <ArcadeSala3D
      titulo="Netiqueta y contraseñas"
      pasoEtiqueta="Paso"
      pasoActual={fase === 'mensajes' ? Math.min(idx + 1, MENSAJES) : TOTAL_PASOS}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta={fase === 'mensajes' ? 'Mensajes' : 'Medidor'}
      marcadorValor={fase === 'mensajes' ? `${terminado ? MENSAJES : idx}/${MENSAJES}` : `${medida.nivel}/4`}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={<p className="gabinete-nota">Sala de la red · el muro del buen trato y la caja fuerte de tus claves</p>}
      final={
        terminado
          ? {
              insigniaNombre: 'Guardián de la red',
              insigniaEmoji: '🔑',
              titulo: '¡Guardián completo!',
              detalle: 'Elegiste los mensajes de buen trato y armaste una contraseña fuerte y secreta.',
              resumen: [
                { etiqueta: 'Mensajes', valor: `${MENSAJES}` },
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

export default LabNetiquetaYContrasenas;
