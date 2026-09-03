'use client';

/**
 * N5·U1 parada 2 · «Conecta los periféricos» (documento §53.1). **10–11 años.**
 *
 * ─── Las dos cosas que esta clase enseña y que sólo se pueden enseñar aquí ───
 *
 * 1. **La forma manda.** El HDMI no entra en el VGA y eso lo dice el aparato,
 *    no la maestra: `resolverSuelta` devuelve `rebota` con motivo `'forma'` y la
 *    pieza vuelve a la mesa sin que nadie la juzgue.
 * 2. **«Entra» y «está bien» son cosas distintas.** El jack de las bocinas
 *    entra en los tres agujeros de audio —por dentro son idénticos, y por eso
 *    están pintados— y sólo el verde es el suyo. Ahí el aparato dice que sí y la
 *    clase dice que no: el jack se mete, Bit explica de quién es ese agujero, y
 *    sale. Ésa es exactamente la razón de que el armazón no corrija.
 *
 * ─── Cómo se cumple «nada de interfaz encima» ────────────────────────────────
 *
 * No hay ni un panel flotando sobre la escena. El **objetivo** lo dice Bit desde
 * el faldón del mueble y la marquesina lleva el paso; el **aviso de puntería**
 * es el aro del puerto, que se enciende solo y tiene el tamaño exacto de su
 * tolerancia; el **rótulo** de un cable conectado es una placa con tirante que
 * cuelga de su puerto y gira con el equipo; y el **control de encendido** es la
 * palanca del regulador, atornillada a la regleta de la mesa. Si el alumno rodea
 * el equipo, la palanca se le queda detrás — porque es un objeto.
 *
 * ─── Y la página educativa ───────────────────────────────────────────────────
 *
 * Esta clase es el piloto que el cliente pidió: al entrar se reciben **la página
 * y el simulador a la vez**, en dos hojas. Eso vive en `ConectaPerifericos`, al
 * final del archivo; el laboratorio de aquí no sabe nada de ello.
 */

import { useCallback, useMemo, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../n1/mision/audio';
import { useBit } from '../n1/arcade/ArcadeSala';
import { useTemporizadores } from '../arcade3d/useTemporizadores';
import { LaboratorioDosHojas } from '../n1/mision/LaboratorioDosHojas';
import { useLabActividad, formatTiempo } from '../lib/useLabActividad';
import {
  BancoFisico3D,
  ESTADO_VACIO,
  LIMITES_BANCO,
  anclajeDe,
  aplicarSuelta,
  devolver,
  dondeEsta,
  evaluar,
  piezaDe,
  quitarPieza,
  resolverSuelta,
  resolverSueltaEn,
  tomar,
  type EstadoBanco,
  type LetreroMundo,
  type MandoDef,
  type EstadoAnclaje,
  type Punto3,
  type Rayo,
  type Suelta,
} from '@/components/simuladores/laboratorio3d';
import { SalaBanco3D, AvisoRonda, useReduceMotion3D } from './SalaBanco3D';
import { PortadaLab3D, type DatosPortadaLab3D } from './PortadaLab3D';
import { PaginaPerifericos } from './PaginaPerifericos';
import {
  BANCO_PERIFERICOS,
  CABLES,
  ESPERADO_PERIFERICOS,
  VOZ_AUDIO_MAL,
  VOZ_CABLE,
  cableCorrecto,
  seisConectados,
  type CablePerif,
} from './bancos';
import {
  ConectorHDMI3D,
  ConectorIEC3D,
  ConectorJack3D,
  ConectorRJ453D,
  ConectorUSB3D,
  Escritorio3D,
  Regulador3D,
  TorreEquipo3D,
} from './piezasEquipo3D';

const DEF = BANCO_PERIFERICOS;
const TOTAL_PASOS = CABLES.length + 1;

const LINEAS = {
  inicio:
    'Éste es tu equipo, y la parte interesante está atrás. Toma un cable de la mesa y llévalo a su puerto: mira la forma antes de empujar.',
  vacio: 'Se te cayó. No pasa nada: vuelve a tomarlo de la mesa.',
  forma: 'Ahí no entra. Mira la forma del conector y la del hueco: no son pareja.',
  lleno: 'Ese puerto ya está ocupado. Busca el otro.',
  encender: 'Todo conectado. Ahora sube la palanca del regulador y mira encenderse lo que armaste.',
  fin: 'Ahí está tu equipo completo. Ya sabes leer un panel trasero de verdad.',
};

/** Lo que Bit dice al levantar cada conector: qué es y cómo se reconoce. */
const VOZ_TOMA: Readonly<Record<CablePerif, string>> = {
  teclado: 'USB tipo A: el rectángulo con una barra de plástico de un solo lado. Esa barra decide cómo entra.',
  raton: 'Otro USB, idéntico. Los dos puertos de arriba son iguales por dentro: cualquiera de los dos sirve.',
  monitor: 'HDMI: plano y con las dos esquinas de abajo recortadas. No lo confundas con el VGA, que es ancho y azul.',
  bocinas: 'Jack de 3,5 milímetros. Fíjate: hay tres agujeros iguales y están pintados. Uno solo es el de las bocinas.',
  red: 'RJ-45, el de internet: punta transparente, ocho hilitos y una pestaña que hace clic.',
  corriente: 'La corriente, y va al final. Se toma siempre del conector, nunca jalando del cable.',
};

const PORTADA: DatosPortadaLab3D = {
  situacion: 'Acaban de traer un equipo nuevo al salón y está sobre la mesa, con todos sus cables sueltos al lado.',
  tema: 'Conecta los periféricos',
  objetivo:
    'Reconocer por su forma los seis conectores de un equipo de escritorio y saber en qué puerto va cada uno.',
  vasAHacer: [
    'Gira alrededor del equipo con el ratón para ver el panel trasero.',
    'Toma cada cable de la mesa y llévalo a su puerto.',
    'Descubre por qué el jack entra en tres agujeros y sólo uno es el bueno.',
    'Sube la palanca del regulador y enciende el equipo.',
  ],
  pasos: TOTAL_PASOS,
  minutos: 10,
  insignia: { nombre: 'Maestro del panel trasero', emoji: '🔌' },
  boton: 'Empezar a conectar',
  acento: '#22d3ee',
};

type Fase = 'portada' | 'cables' | 'encender';

export function LabConectaPerifericos(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<Fase>('portada');
  const [banco, setBanco] = useState<EstadoBanco>(ESTADO_VACIO);
  const [marcas, setMarcas] = useState<Record<string, EstadoAnclaje>>({});
  const [rotulo, setRotulo] = useState<{ anclaje: string; titulo: string; texto: string } | null>(null);
  const [encendido, setEncendido] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion3D();
  const timers = useTemporizadores();
  const lab = useLabActividad(props, TOTAL_PASOS);

  const conectados = CABLES.filter((c) => dondeEsta(banco, c) === ESPERADO_PERIFERICOS[c]).length;
  const interactivo = fase !== 'portada' && !lab.terminado && !encendido;

  // ── Gestos ────────────────────────────────────────────────────────────────

  const alTomar = useCallback(
    (id: string) => {
      if (!interactivo) return;
      const pieza = piezaDe(DEF, id);
      if (!pieza) return;
      reproducirTono('select');
      setBanco((b) => tomar(DEF, b, id, true));
      setMarcas({});
      hablar(VOZ_TOMA[id as CablePerif] ?? pieza.etiqueta);
    },
    [interactivo, hablar],
  );

  const alDevolver = useCallback(() => {
    setBanco((b) => devolver(b));
  }, []);

  /**
   * El desenlace, entero. Se resuelve **antes** de tocar el estado —para eso el
   * armazón separa `resolverSuelta` de `aplicarSuelta`— y así el caso del jack
   * en el agujero equivocado se puede tratar como lo que es: entra de verdad, y
   * después sale.
   */
  const procesar = useCallback(
    (s: Suelta) => {
      if (s.tipo === 'nada') return;

      if (s.tipo === 'vacio') {
        setBanco((b) => aplicarSuelta(b, s));
        hablar(LINEAS.vacio);
        return;
      }

      if (s.tipo === 'rebota') {
        setBanco((b) => aplicarSuelta(b, s));
        lab.restar();
        setMarcas({ [s.anclaje]: 'mal' });
        hablar(s.motivo === 'forma' ? LINEAS.forma : LINEAS.lleno);
        timers.despues(() => setMarcas({}), 620);
        return;
      }

      if (s.tipo !== 'encaja') return;
      const cable = s.pieza as CablePerif;
      const puesto = aplicarSuelta(banco, s);
      setBanco(puesto);

      if (!cableCorrecto(cable, s.anclaje)) {
        // Entró —físicamente entra— y aun así no es su sitio. Se queda dentro
        // el tiempo justo de que se vea, Bit dice de quién es ese agujero, y
        // sale. Si se rechazara de plano, la lección se perdería.
        lab.restar();
        setMarcas({ [s.anclaje]: 'mal' });
        hablar(VOZ_AUDIO_MAL[s.anclaje] ?? 'Entra, pero ése no es su sitio. Mira el color.');
        timers.despues(() => {
          setBanco((b) => quitarPieza(b, cable));
          setMarcas({});
        }, 1500);
        return;
      }

      reproducirTono('correct');
      setMarcas({ [s.anclaje]: 'ok' });
      const ancla = anclajeDe(DEF, s.anclaje);
      setRotulo({
        anclaje: s.anclaje,
        titulo: ancla?.etiqueta ?? 'Conectado',
        texto: piezaDe(DEF, cable)?.etiqueta ?? '',
      });
      lab.avanzar();
      hablar(VOZ_CABLE[cable]);

      if (seisConectados(puesto)) {
        timers.despues(() => {
          setFase('encender');
          setAviso('Ronda 2 · El encendido');
          hablar(LINEAS.encender);
          timers.despues(() => setAviso(null), 1600);
        }, 900);
      }
    },
    [banco, hablar, lab, timers],
  );

  const alSoltar = useCallback(
    (rayo: Rayo) => procesar(resolverSuelta(DEF, banco, { rayo }, interactivo)),
    [banco, interactivo, procesar],
  );

  /** La puerta del teclado y la del respaldo: el hueco se nombra, no se apunta. */
  const alSoltarEn = useCallback(
    (anclaje: string) => procesar(resolverSueltaEn(DEF, banco, anclaje, interactivo)),
    [banco, interactivo, procesar],
  );

  const alMando = useCallback(() => {
    if (fase !== 'encender' || encendido || lab.terminado) return;
    reproducirTono('power');
    setEncendido(true);
    lab.avanzar();
    timers.despues(() => {
      lab.terminar(Math.round((Date.now() - lab.sim.current.inicio) / 1000), () => hablar(LINEAS.fin));
    }, 2400);
  }, [fase, encendido, lab, timers, hablar]);

  const repetir = useCallback(() => {
    timers.limpiar();
    setFase('cables');
    setBanco(ESTADO_VACIO);
    setMarcas({});
    setRotulo(null);
    setEncendido(false);
    setAviso(null);
    lab.reiniciar(() => hablar(LINEAS.inicio));
  }, [lab, timers, hablar]);

  // ── Escena ────────────────────────────────────────────────────────────────

  const estadoAnclaje = useCallback(
    (id: string): EstadoAnclaje => {
      if (marcas[id]) return marcas[id];
      const dentro = banco.ocupacion[id] ?? [];
      return dentro.length > 0 ? 'ok' : 'espera';
    },
    [marcas, banco],
  );

  const dibujarPieza = useCallback((pieza: { id: string }) => {
    // Todos los conectores se modelan con la cara de contacto hacia +Z y el
    // cable hacia −Z; la media vuelta los deja mirando al panel, que es como
    // se acerca un cable a su puerto.
    const cuerpo =
      pieza.id === 'teclado' || pieza.id === 'raton' ? (
        <ConectorUSB3D />
      ) : pieza.id === 'monitor' ? (
        <ConectorHDMI3D />
      ) : pieza.id === 'bocinas' ? (
        <ConectorJack3D />
      ) : pieza.id === 'red' ? (
        <ConectorRJ453D />
      ) : (
        <ConectorIEC3D />
      );
    return <group rotation={[0, Math.PI, 0]}>{cuerpo}</group>;
  }, []);

  const letreros = useMemo<LetreroMundo[]>(() => {
    if (!rotulo) return [];
    const a = anclajeDe(DEF, rotulo.anclaje);
    if (!a) return [];
    return [
      {
        id: `rotulo-${rotulo.anclaje}`,
        titulo: rotulo.titulo,
        texto: rotulo.texto,
        punto: [1.72, a.punto[1], a.punto[2] + 0.42] as Punto3,
        ancla: a.punto,
        ancho: 1.05,
        color: '#4ADE80',
      },
    ];
  }, [rotulo]);

  const mandos = useMemo<MandoDef[]>(
    () => [
      {
        id: 'regulador',
        forma: 'palanca',
        // Atornillada al costado de la regleta que está en la mesa, no
        // flotando: si el alumno da la vuelta al equipo, se le queda detrás.
        punto: [-1.12, -0.84, 0.86],
        mira: [0, 0, 1],
        etiqueta: 'Palanca del regulador',
        encendido,
        activo: fase === 'encender' && !lab.terminado,
        color: encendido ? '#4ADE80' : '#F5A524',
      },
    ],
    [encendido, fase, lab.terminado],
  );

  const modelo = (
    <>
      <Escritorio3D />
      <TorreEquipo3D encendido={encendido} />
      <Regulador3D encendido={encendido} />
    </>
  );

  // ── La cara sin WebGL: una clase entera, no un mensaje de disculpa ────────

  const sueltos = CABLES.filter((c) => dondeEsta(banco, c) === null && banco.tomada !== c);
  const enMano = banco.tomada;

  const respaldo = (
    <div className="lb3-respaldo">
      <p className="lb3-respaldo-titulo">
        {fase === 'encender'
          ? 'Sube la palanca del regulador para encender el equipo.'
          : 'Toma un cable y llévalo a su puerto del panel trasero.'}
      </p>
      <p className="lb3-respaldo-nota">
        {enMano
          ? `Llevas en la mano: ${piezaDe(DEF, enMano)?.etiqueta ?? enMano}. Elige un puerto.`
          : `Cables conectados: ${conectados} de ${CABLES.length}.`}
      </p>

      {fase !== 'encender' && (
        <div className="lb3-respaldo-grupo">
          <span>Cables en la mesa</span>
          <div className="lb3-respaldo-fila">
            {sueltos.map((c) => (
              <button
                key={c}
                type="button"
                className="lb3-boton"
                aria-label={`Tomar el cable ${piezaDe(DEF, c)?.etiqueta ?? c}`}
                onClick={() => alTomar(c)}
              >
                {piezaDe(DEF, c)?.etiqueta}
              </button>
            ))}
            {sueltos.length === 0 && !enMano && <span className="lb3-respaldo-nota">No queda ningún cable suelto.</span>}
            {/* Soltar sin conectar. En la escena eso es dejar caer el cable al
                vacío; aquí no había manera, y sin ella quien juega con teclado
                se queda con el cable pegado a la mano. */}
            {enMano && (
              <button
                type="button"
                className="lb3-boton"
                aria-label="Dejar en la mesa el cable que llevas en la mano"
                onClick={alDevolver}
              >
                Dejar en la mesa
              </button>
            )}
          </div>
        </div>
      )}

      {fase !== 'encender' && (
        <div className="lb3-respaldo-grupo">
          <span>Puertos del panel trasero</span>
          <div className="lb3-respaldo-fila">
            {DEF.anclajes.map((a) => (
              <button
                key={a.id}
                type="button"
                className="lb3-boton"
                disabled={!enMano}
                aria-label={`Conectar en el puerto ${a.etiqueta}`}
                onClick={() => alSoltarEn(a.id)}
              >
                {a.etiqueta}
              </button>
            ))}
          </div>
        </div>
      )}

      {fase === 'encender' && (
        <div className="lb3-respaldo-grupo">
          <span>El regulador</span>
          <div className="lb3-respaldo-fila">
            <button
              type="button"
              className="lb3-boton"
              disabled={encendido}
              aria-label="Subir la palanca del regulador y encender el equipo"
              onClick={alMando}
            >
              Subir la palanca
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const nota = evaluar(DEF, banco, ESPERADO_PERIFERICOS);

  return (
    <SalaBanco3D
      titulo="Conecta los periféricos"
      pasoEtiqueta="Paso"
      pasoActual={Math.min(fase === 'encender' ? CABLES.length + 1 : conectados + 1, TOTAL_PASOS)}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta={fase === 'encender' ? 'Encendido' : 'Cables'}
      marcadorValor={fase === 'encender' ? (encendido ? '1/1' : '0/1') : `${conectados}/${CABLES.length}`}
      bit={linea}
      alSalir={props.alSalir}
      base={
        <p className="gabinete-nota">
          El equipo nuevo del salón · gira alrededor con el ratón: los puertos están en el panel trasero
        </p>
      }
      banco={
        <BancoFisico3D
          modelo={modelo}
          def={DEF}
          estado={banco}
          dibujarPieza={dibujarPieza}
          estadoAnclaje={estadoAnclaje}
          letreros={letreros}
          mandos={mandos}
          interactivo={interactivo}
          reduceMotion={reduceMotion}
          limites={LIMITES_BANCO}
          paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
          onTomar={alTomar}
          onSoltar={alSoltar}
          onDevolver={alDevolver}
          onMando={alMando}
          respaldo={respaldo}
        />
      }
      final={
        lab.terminado
          ? {
              insigniaNombre: 'Maestro del panel trasero',
              insigniaEmoji: '🔌',
              titulo: '¡Equipo conectado y encendido!',
              detalle:
                'Conectaste los seis cables por su forma —dos USB, HDMI, jack de 3,5 mm, RJ-45 y corriente—, encontraste el agujero verde entre tres idénticos y encendiste el equipo desde el regulador.',
              resumen: [
                { etiqueta: 'Cables', valor: `${nota.correctas.length}/${CABLES.length}` },
                { etiqueta: 'Puertos', valor: `${DEF.anclajes.length}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(lab.tiempoFinal) },
                { etiqueta: 'Errores', valor: `${lab.erroresFinal}` },
              ],
              alRepetir: repetir,
            }
          : null
      }
    >
      {fase === 'portada' && (
        <PortadaLab3D
          portada={PORTADA}
          onEmpezar={() => {
            reproducirTono('select');
            setFase('cables');
          }}
        />
      )}
      {aviso && <AvisoRonda texto={aviso} clave={aviso} />}
    </SalaBanco3D>
  );
}

/**
 * Lo que abre el CTA de la entrada: **la página educativa y el simulador a la
 * vez**, en dos hojas, con el mando de reparto dentro del riel que las separa.
 *
 * Es el encargo literal del cliente del 6-ago-2026 y esta clase es su piloto.
 * El laboratorio no sabe que está en un panel: se le cambia el encuadre desde
 * `lab3d-clases.css`, no las tripas.
 */
export function ConectaPerifericosDosHojas(props: ActivityProps & { alSalir?: () => void }) {
  return <LaboratorioDosHojas pagina={<PaginaPerifericos />} simulador={<LabConectaPerifericos {...props} />} />;
}

export default LabConectaPerifericos;
