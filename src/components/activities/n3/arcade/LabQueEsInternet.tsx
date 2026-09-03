'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import {
  CableLuz3D,
  MS_POR_TRAMO,
  NavegadorRed3D,
  NodoRed3D,
  PaqueteLuz3D,
  TableroRed3D,
  type NodoMapa,
} from './piezasN3U3';
import type { EstadoExhibicion } from './museoN3';

/**
 * N3·U3 · Parada 1 «¿Qué es internet?» (documento §18.1).
 *
 * Aparato dedicado: el tablero de la red, un mapa iluminado con cinco máquinas
 * que se van uniendo con cables de luz. Cuando la red queda completa, un paquete
 * de información la recorre de verdad y entonces se enciende el navegador, con
 * su barra de direcciones grabada en el propio marco de la ventana.
 */

const LINEAS = {
  inicio: 'Detrás de esta ventana hay millones de computadoras conectadas. ¡Eso es internet! ¿Armamos la red?',
  acierto: '¡Conectado! Ahora esas dos máquinas pueden enviarse información.',
  fallo: 'Mmm, ahí no llega el cable. Busca una máquina de la red para conectar.',
  paquete: '¿Ves cómo viaja la lucecita? Así de rápido va la información.',
  navegador: 'Y esta ventana es el navegador: con él abres páginas de internet.',
  fin: '¡Red completa! Ya sabes qué es internet y cómo te asomas a él.',
};

const NODOS: NodoMapa[] = [
  { id: 'casa', emoji: '🏠', nombre: 'Casa', punto: [-2.3, 2.3, 0.18] },
  { id: 'escuela', emoji: '🏫', nombre: 'Escuela', punto: [0, 2.3, 0.18] },
  { id: 'antena', emoji: '📡', nombre: 'Antena', punto: [2.3, 2.3, 0.18] },
  { id: 'servidor', emoji: '🗄️', nombre: 'Servidor', punto: [-1.2, 1.15, 0.18] },
  { id: 'tablet', emoji: '📱', nombre: 'Tablet', punto: [1.2, 1.15, 0.18] },
];

const POR_ID = new Map(NODOS.map((n) => [n.id, n]));

interface Conexion {
  a: string;
  b: string;
  consigna: string;
}

const CONEXIONES: Conexion[] = [
  { a: 'casa', b: 'servidor', consigna: 'Conecta la casa con el servidor.' },
  { a: 'servidor', b: 'escuela', consigna: 'Ahora une el servidor con la escuela.' },
  { a: 'escuela', b: 'antena', consigna: 'Lleva un cable de la escuela a la antena.' },
  { a: 'antena', b: 'tablet', consigna: 'Y por último conecta la antena con la tablet.' },
];

/** La lucecita recorre las cinco máquinas en el orden en que se cablearon. */
const RUTA_PAQUETE = ['casa', 'servidor', 'escuela', 'antena', 'tablet'];

const CABLES = CONEXIONES.length;
/** Cuatro cables + el viaje del paquete + abrir el navegador. */
const TOTAL_PASOS = CABLES + 2;

const URL_PAGINA = 'www.mundodebit.mx';

type Fase = 'cables' | 'paquete' | 'navegador' | 'fin';

function formatTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabQueEsInternet(props: ActivityProps & { alSalir?: () => void }) {
  const [idx, setIdx] = useState(0);
  const [fase, setFase] = useState<Fase>('cables');
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [estados, setEstados] = useState<Record<string, EstadoExhibicion>>({});
  const [tendidos, setTendidos] = useState<number>(0);
  const [paginaAbierta, setPaginaAbierta] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, idx, fase, seleccion });

  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, idx, fase, seleccion };
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

  const fallar = (id: string) => {
    reproducirTono('error');
    sim.current.errores += 1;
    propsRef.current.onScore(puntaje());
    setEstados({ [id]: 'mal' });
    hablar(LINEAS.fallo);
    timers.despues(() => setEstados({}), 460);
  };

  const tocarNodo = (id: string) => {
    if (vivo.current.terminado || sim.current.ocupado || vivo.current.fase !== 'cables') return;
    const conexion = CONEXIONES[vivo.current.idx];
    const enPar = id === conexion.a || id === conexion.b;
    const elegido = vivo.current.seleccion;

    if (elegido === null) {
      if (!enPar) {
        fallar(id);
        return;
      }
      reproducirTono('select');
      setSeleccion(id);
      setEstados({ [id]: 'listo' });
      return;
    }

    // Segundo toque: soltar el cable sobre la otra punta.
    if (id === elegido) {
      setSeleccion(null);
      setEstados({});
      return;
    }
    if (!enPar) {
      /*
       * CORREGIDO 1-sep-2026 (auditoría). `fallar(id)` reemplaza el mapa de
       * estados entero por `{[id]:'mal'}` y a los 460 ms lo deja vacío: la
       * marca visual del nodo ya elegido desaparece. Pero `seleccion` seguía
       * puesta, y es la que decide el letrero de Bit — así que en pantalla no
       * había nada resaltado mientras el letrero seguía pidiendo «ahora toca la
       * otra máquina». Sus tres clases hermanas de N3 sí limpian la selección
       * en esta misma rama; ésta se quedó sin hacerlo.
       */
      setSeleccion(null);
      fallar(id);
      return;
    }

    sim.current.ocupado = true;
    reproducirTono('correct');
    setSeleccion(null);
    setEstados({ [conexion.a]: 'ok', [conexion.b]: 'ok' });
    hablar(LINEAS.acierto);
    const hechos = vivo.current.idx + 1;
    setTendidos(hechos);
    propsRef.current.onScore(puntaje());
    propsRef.current.onProgress(hechos / TOTAL_PASOS);

    if (hechos === CABLES) {
      setAviso('¡Red completa!');
      timers.despues(() => {
        setAviso(null);
        setEstados({});
        setIdx(hechos);
        setFase('paquete');
        hablar(LINEAS.paquete);
        propsRef.current.onProgress((CABLES + 1) / TOTAL_PASOS);
        // El paquete recorre cuatro tramos; cuando llega, se enciende el navegador.
        timers.despues(() => {
          setFase('navegador');
          hablar(LINEAS.navegador);
          sim.current.ocupado = false;
        }, MS_POR_TRAMO * (RUTA_PAQUETE.length - 1) + 600);
      }, 1200);
      return;
    }

    timers.despues(() => {
      setEstados({});
      setIdx(hechos);
      sim.current.ocupado = false;
    }, 700);
  };

  const abrirPagina = () => {
    if (vivo.current.terminado || vivo.current.fase !== 'navegador') return;
    reproducirTono('save');
    setPaginaAbierta(true);
    setFase('fin');
    setAviso('¡Página abierta!');
    timers.despues(() => {
      setAviso(null);
      terminar(Math.round((Date.now() - sim.current.inicio) / 1000));
    }, 1200);
  };

  const repetir = () => {
    timers.limpiar();
    sim.current.errores = 0;
    sim.current.ocupado = false;
    sim.current.inicio = Date.now();
    setIdx(0);
    setFase('cables');
    setSeleccion(null);
    setEstados({});
    setTendidos(0);
    setPaginaAbierta(false);
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  const conexion = CONEXIONES[Math.min(idx, CABLES - 1)];
  const consigna =
    fase === 'cables'
      ? seleccion
        ? `Ahora toca la otra máquina para soltar el cable.`
        : conexion.consigna
      : fase === 'paquete'
        ? 'La información ya viaja por tus cables.'
        : fase === 'navegador'
          ? 'Toca «Ir» para asomarte a internet con el navegador.'
          : 'Red completa y página abierta.';

  const conNavegador = fase === 'navegador' || fase === 'fin';
  const paso = Math.min(tendidos + (fase === 'cables' ? 1 : fase === 'paquete' ? 1 : 2), TOTAL_PASOS);

  const escena = (
    <>
      {/* Con el navegador encendido, la moldura calla: su ventana la taparía. */}
      <TableroRed3D position={[0, MOSTRADOR_Y, -0.4]} alto={2.6} consigna={conNavegador ? null : consigna}>
        {CONEXIONES.slice(0, tendidos).map((c) => (
          <CableLuz3D
            key={`${c.a}-${c.b}`}
            a={POR_ID.get(c.a)!.punto}
            b={POR_ID.get(c.b)!.punto}
            encendido
            reduceMotion={reduceMotion}
          />
        ))}
        <PaqueteLuz3D
          ruta={RUTA_PAQUETE.map((id) => POR_ID.get(id)!.punto)}
          viajando={fase === 'paquete'}
          reduceMotion={reduceMotion}
        />
        {NODOS.map((n) => (
          <NodoRed3D
            key={n.id}
            position={n.punto}
            emoji={n.emoji}
            nombre={n.nombre}
            estado={estados[n.id] ?? 'espera'}
            ariaLabel={`Máquina: ${n.nombre}`}
            onClick={() => tocarNodo(n.id)}
            rotulo={!conNavegador}
            disabled={terminado || fase !== 'cables'}
            reduceMotion={reduceMotion}
          />
        ))}
      </TableroRed3D>
      {conNavegador && (
        <NavegadorRed3D
          position={[0, MOSTRADOR_Y + 1.4, 0.9]}
          url={URL_PAGINA}
          abierta={paginaAbierta}
          tituloPagina="El mundo de Bit"
          textoPagina="¡Hola! Llegaste a mi página viajando por la red que armaste."
          onIr={abrirPagina}
          disabled={terminado}
          reduceMotion={reduceMotion}
        />
      )}
    </>
  );

  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">{consigna}</p>
      <div className="escena3d-respaldo-fila">
        {NODOS.map((n) => (
          <button
            key={n.id}
            type="button"
            className={`red3d-respaldo red3d-nodo--${estados[n.id] ?? 'espera'}`}
            aria-label={`Máquina: ${n.nombre}`}
            disabled={terminado || fase !== 'cables'}
            onClick={() => tocarNodo(n.id)}
          >
            <span aria-hidden>{n.emoji}</span> {n.nombre}
          </button>
        ))}
      </div>
      {conNavegador && (
        <div className="escena3d-respaldo-fila">
          <button
            type="button"
            className="red3d-respaldo"
            aria-label={`Ir a ${URL_PAGINA} con el navegador`}
            disabled={terminado || paginaAbierta}
            onClick={abrirPagina}
          >
            🌐 Ir a {URL_PAGINA}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="¿Qué es internet?"
      pasoEtiqueta="Paso"
      pasoActual={paso}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Cables"
      marcadorValor={`${tendidos}/${CABLES}`}
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={<p className="gabinete-nota">Sala de la red · el mapa vivo de las máquinas conectadas</p>}
      final={
        terminado
          ? {
              insigniaNombre: 'Tejedor de redes',
              insigniaEmoji: '🕸️',
              titulo: '¡Red completa!',
              detalle: 'Uniste las cinco máquinas, viste viajar la información y abriste una página con el navegador.',
              resumen: [
                { etiqueta: 'Cables', valor: `${CABLES}` },
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

export default LabQueEsInternet;
