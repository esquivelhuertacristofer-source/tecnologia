'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { Consigna3D } from '../../arcade3d/piezas3d';
import { FichaTomable3D, type EstadoPuesto } from './estudioN4';
import { ConsolaEnlace3D, LetreroURL3D, MaquetaRed3D, PaqueteDatos3D, type EscalaN4 } from './piezasN4U1';

/**
 * N4·U1 parada 1 · «El viaje de un mensaje» (documento §23.1).
 *
 * Ronda 1 — el viaje (5 escalas): el paquete de datos sale de la charola y el
 * alumno lo lleva, en orden, por dispositivo → router → internet → servidor →
 * la respuesta que vuelve a su pantalla. El error nunca borra lo logrado: el
 * paquete regresa a la charola y solo resta en el puntaje.
 * Ronda 2 — la dirección (3 piezas): arma `https://tecnia.mx` en el letrero.
 */

const ESCALAS: EscalaN4[] = [
  { id: 'dispositivo', n: 1, emoji: '💻', nombre: 'Tu dispositivo', pista: 'aquí empieza', tipo: 'dispositivo' },
  { id: 'router', n: 2, emoji: '📶', nombre: 'El router de tu casa', pista: 'la puerta de salida', tipo: 'router' },
  { id: 'internet', n: 3, emoji: '🌐', nombre: 'Internet (la red)', pista: 'la red gigante', tipo: 'red' },
  { id: 'servidor', n: 4, emoji: '🗄️', nombre: 'El servidor', pista: 'aquí está guardado', tipo: 'servidor' },
  { id: 'vuelta', n: 5, emoji: '🖥️', nombre: 'La respuesta vuelve a tu pantalla', pista: 'y regresa a ti', tipo: 'vuelta' },
];

const PIEZAS_URL = [
  { id: 'https', texto: 'https://', significa: 'así se pide de forma segura' },
  { id: 'nombre', texto: 'tecnia', significa: 'el nombre del sitio' },
  { id: 'mx', texto: '.mx', significa: 'la terminación' },
];

const LINEAS = {
  inicio: '¡Bienvenido a mi Central de Enlace! ¿Seguimos a este mensaje en su viaje?',
  acierto: '¡Esa es la siguiente escala! El mensaje va bien.',
  fallo: 'Mmm, todavía no le toca ahí. ¿Por dónde tiene que pasar antes?',
  router: 'El router es la puerta de salida de tu casa hacia internet.',
  servidor: 'El servidor está encendido todo el tiempo: él guarda lo que pediste.',
  direccion: 'Ahora la dirección: primero https, luego el nombre del sitio, luego la terminación.',
  fin: '¡Viaje completo! Y en la vida real todo esto pasa en menos de un segundo.',
};

const TOTAL_PASOS = ESCALAS.length + PIEZAS_URL.length;

type Fase = 'viaje' | 'direccion';

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabElViajeDeUnMensaje(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<Fase>('viaje');
  const [hechas, setHechas] = useState(0);
  const [ranuras, setRanuras] = useState<(string | null)[]>([null, null, null]);
  const [estados, setEstados] = useState<Record<string, EstadoPuesto>>({});
  const [tomado, setTomado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, fase, hechas, ranuras });
  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, fase, hechas, ranuras };
  });
  useEffect(() => {
    sim.current.inicio = Date.now();
  }, []);

  const puntaje = () => Math.max(60, Math.min(100, 100 - sim.current.errores * 6));

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

  const fallar = (id: string) => {
    reproducirTono('error');
    sim.current.errores += 1;
    propsRef.current.onScore(puntaje());
    setEstados({ [id]: 'mal' });
    setTomado(null);
    hablar(LINEAS.fallo);
    timers.despues(() => setEstados({}), 460);
  };

  /* ── ronda 1: llevar el paquete por las escalas ─────────────────────── */

  const soltarEnEscala = (id: string) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'viaje') return;
    const siguiente = ESCALAS[vivo.current.hechas];
    if (id !== siguiente.id) {
      fallar(id);
      return;
    }
    reproducirTono('correct');
    sim.current.ocupado = true;
    const nuevas = vivo.current.hechas + 1;
    setHechas(nuevas);
    setTomado(null);
    setEstados({ [id]: 'ok' });
    propsRef.current.onProgress(nuevas / TOTAL_PASOS);
    if (siguiente.id === 'router') hablar(LINEAS.router);
    else if (siguiente.id === 'servidor') hablar(LINEAS.servidor);
    else if (nuevas < ESCALAS.length) hablar(LINEAS.acierto);

    timers.despues(() => {
      setEstados({});
      sim.current.ocupado = false;
      if (nuevas === ESCALAS.length) {
        setFase('direccion');
        setAviso('Ronda 2 · La dirección');
        hablar(LINEAS.direccion);
        timers.despues(() => setAviso(null), 1600);
      }
    }, 520);
  };

  /* ── ronda 2: armar https://tecnia.mx ───────────────────────────────── */

  const soltarEnRanura = (id: string) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'direccion') return;
    const llenas = vivo.current.ranuras.filter(Boolean).length;
    if (llenas >= PIEZAS_URL.length) return;
    if (id !== PIEZAS_URL[llenas].id) {
      fallar(id);
      return;
    }
    reproducirTono('correct');
    sim.current.ocupado = true;
    const nuevas = vivo.current.ranuras.slice();
    nuevas[llenas] = id;
    setRanuras(nuevas);
    setTomado(null);
    const puestas = llenas + 1;
    propsRef.current.onProgress((ESCALAS.length + puestas) / TOTAL_PASOS);
    if (puestas < PIEZAS_URL.length) hablar(LINEAS.acierto);

    timers.despues(() => {
      sim.current.ocupado = false;
      if (puestas === PIEZAS_URL.length) {
        terminar(Math.round((Date.now() - sim.current.inicio) / 1000));
      }
    }, 520);
  };

  const tomar = (id: string) => {
    if (vivo.current.terminado) return;
    reproducirTono('select');
    setTomado(id);
  };

  const repetir = () => {
    timers.limpiar();
    sim.current = { ocupado: false, errores: 0, inicio: Date.now() };
    setFase('viaje');
    setHechas(0);
    setRanuras([null, null, null]);
    setEstados({});
    setTomado(null);
    setAviso(null);
    setTerminado(false);
    setTiempoFinal(0);
    setErroresFinal(0);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  /* ── vistas ─────────────────────────────────────────────────────────── */

  const llenas = ranuras.filter(Boolean).length;
  const paso = fase === 'viaje' ? hechas : ESCALAS.length + llenas;
  const enViaje = fase === 'viaje';
  const consigna = enViaje
    ? 'Lleva el paquete a la escala que sigue en su viaje.'
    : 'Arma la dirección del sitio: pieza por pieza, en orden.';

  const charola = enViaje ? (
    <div className="enlace3d-charola" style={{ '--enlace-ancho': '300px' } as React.CSSProperties}>
      <span className="enlace3d-charola-tit">Charola · paquete de datos</span>
      <FichaTomable3D
        id="paquete"
        className={`enlace3d-paquete${tomado === 'paquete' ? ' es-tomado' : ''}`}
        ariaLabel="Paquete de datos: tómalo y llévalo a la siguiente escala"
        onElegir={() => tomar('paquete')}
      >
        <span className="enlace3d-paquete-emoji">📦</span>
        <span className="enlace3d-paquete-txt">Mi mensaje</span>
      </FichaTomable3D>
    </div>
  ) : (
    <div className="enlace3d-charola" style={{ '--enlace-ancho': '300px' } as React.CSSProperties}>
      <span className="enlace3d-charola-tit">Charola · piezas de la dirección</span>
      <div className="enlace3d-piezas">
        {PIEZAS_URL.map((p) => {
          const puesta = ranuras.includes(p.id);
          return (
            <FichaTomable3D
              key={p.id}
              id={p.id}
              className={`enlace3d-pieza${tomado === p.id ? ' es-tomado' : ''}${puesta ? ' es-puesta' : ''}`}
              ariaLabel={`Pieza ${p.texto}: ${p.significa}`}
              disabled={puesta}
              onElegir={() => tomar(p.id)}
            >
              {p.texto}
            </FichaTomable3D>
          );
        })}
      </div>
    </div>
  );

  const escena = (
    <>
      {/* En ronda 2 la consigna se corre a la izquierda: el letrero de la
          dirección ocupa el lado del servidor y ningún panel puede pisarse. */}
      <Consigna3D
        titulo={enViaje ? 'Ronda 1 · El viaje' : 'Ronda 2 · La dirección'}
        texto={consigna}
        position={[enViaje ? 0 : -1.55, MOSTRADOR_Y + 2.15, -0.6]}
      />

      <MaquetaRed3D
        escalas={ESCALAS}
        hechas={hechas}
        estados={estados}
        onSoltar={soltarEnEscala}
        interactivo={enViaje}
        reduceMotion={reduceMotion}
      />

      {enViaje && <PaqueteDatos3D position={[0, MOSTRADOR_Y + 0.88, 0.95]} viajando={tomado === 'paquete'} reduceMotion={reduceMotion} />}

      {!enViaje && (
        <LetreroURL3D position={[1.5, MOSTRADOR_Y + 1.96, -0.2]} ancho={2.4}>
          <div className="enlace3d-letrero" style={{ '--enlace-ancho': '300px' } as React.CSSProperties}>
            <span className="enlace3d-letrero-tit">Dirección del sitio</span>
            <div className="enlace3d-ranuras">
              {ranuras.map((r, i) => {
                const activa = i === llenas;
                const pieza = PIEZAS_URL.find((p) => p.id === r);
                return (
                  <button
                    key={i}
                    type="button"
                    className={`enlace3d-ranura${r ? ' es-llena' : ''}${activa ? ' es-activa' : ''}`}
                    aria-label={r ? `Ranura ${i + 1}: ${pieza?.texto}` : `Ranura ${i + 1} vacía`}
                    disabled={!activa}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const id = e.dataTransfer.getData('text/plain');
                      if (id) soltarEnRanura(id);
                    }}
                    onClick={() => tomado && soltarEnRanura(tomado)}
                  >
                    {r ? pieza?.texto : '·····'}
                  </button>
                );
              })}
            </div>
          </div>
        </LetreroURL3D>
      )}

      <ConsolaEnlace3D position={[0, MOSTRADOR_Y + 0.02, 1.05]} ancho={2.5}>
        {charola}
      </ConsolaEnlace3D>
    </>
  );

  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">{consigna}</p>
      <div className="escena3d-respaldo-fila">
        {enViaje
          ? ESCALAS.map((e) => (
              <button
                key={e.id}
                type="button"
                className="pieza3d-boton"
                aria-label={`Escala ${e.n}: ${e.nombre}. ${e.pista}`}
                onClick={() => soltarEnEscala(e.id)}
              >
                {e.emoji} {e.nombre}
              </button>
            ))
          : PIEZAS_URL.map((p) => (
              <button
                key={p.id}
                type="button"
                className="pieza3d-boton"
                aria-label={`Pieza ${p.texto}: ${p.significa}`}
                disabled={ranuras.includes(p.id)}
                onClick={() => soltarEnRanura(p.id)}
              >
                {p.texto}
              </button>
            ))}
      </div>
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="El viaje de un mensaje"
      pasoEtiqueta="Paso"
      pasoActual={paso}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta={enViaje ? 'Escalas' : 'Dirección'}
      marcadorValor={enViaje ? `${hechas}/${ESCALAS.length}` : `${llenas}/${PIEZAS_URL.length}`}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={<p className="gabinete-nota">La Central de Enlace · aquí se ve el camino que hace tu mensaje</p>}
      final={
        terminado
          ? {
              insigniaNombre: 'Mensajero de la red',
              insigniaEmoji: '📡',
              titulo: '¡Viaje completo!',
              detalle:
                'Seguiste el mensaje por sus cinco escalas y armaste la dirección https://tecnia.mx. En la vida real todo eso pasa en menos de un segundo.',
              resumen: [
                { etiqueta: 'Escalas', valor: `${ESCALAS.length}` },
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

export default LabElViajeDeUnMensaje;
