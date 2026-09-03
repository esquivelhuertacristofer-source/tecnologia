'use client';

/**
 * N7·U1 parada 4 · «Diagnostica y soluciona» (temario en §31.4, adaptación en
 * §53.3). **12–13 años.** Cierra la unidad «Arquitectura y sistemas».
 *
 * ─── Lo que se hereda del temario y lo que cambia ────────────────────────────
 *
 * §31.4 estaba escrito antes que el armazón, y describía la ronda 2 como
 * «elegir una comprobación de la caja y luego una solución». Dos listas son dos
 * menús, y un menú dentro de una escena 3D es exactamente la interfaz pegada
 * encima por la que se declaró inutilizable otro laboratorio de esta casa.
 *
 * Aquí la comprobación **es un instrumento aplicado en un punto del equipo**:
 * se toma de la caja, se lleva y se aplica. Y por eso fallar tiene dos formas
 * distintas y las dos enseñan —`juzgarComprobacion` las separa—:
 *
 *   - el **instrumento equivocado** en el sitio correcto («eso no mide eso»);
 *   - el **instrumento correcto en el sitio equivocado** («ahí no está el
 *     problema: vuelve a leer el síntoma»).
 *
 * La ronda 1 se queda como estaba: el carril de cinco casillas, las siete
 * chapas grabadas y las dos distractoras que Bit explica.
 *
 * ─── La pizarra no es un panel ───────────────────────────────────────────────
 *
 * El síntoma vive en una placa colgada de un poste, dibujada en lienzo y pegada
 * como textura. Si el alumno rodea la mesa la ve de canto y luego del revés,
 * como cualquier cartel de un taller. Un HUD nunca se pone de canto.
 */

import { useCallback, useMemo, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../n1/mision/audio';
import { useBit } from '../n1/arcade/ArcadeSala';
import { useTemporizadores } from '../arcade3d/useTemporizadores';
import { useLabActividad, formatTiempo } from '../lib/useLabActividad';
import {
  BancoFisico3D,
  ESTADO_VACIO,
  LIMITES_BANCO,
  aplicarSuelta,
  devolver,
  dondeEsta,
  piezaDe,
  resolverSuelta,
  resolverSueltaEn,
  tomar,
  type BancoDef,
  type EstadoAnclaje,
  type EstadoBanco,
  type LetreroMundo,
  type Punto3,
  type Rayo,
  type Suelta,
} from '@/components/simuladores/laboratorio3d';
import { SalaBanco3D, AvisoRonda, useReduceMotion3D } from './SalaBanco3D';
import { PortadaLab3D, type DatosPortadaLab3D } from './PortadaLab3D';
import {
  AVERIAS,
  BANCO_AVERIAS,
  BANCO_AVERIAS_INICIAL,
  BANCO_PROTOCOLO,
  CASILLAS,
  CHAPAS_PROTOCOLO,
  INSTRUMENTOS,
  VOZ_DISTRACTORA,
  juzgarComprobacion,
  juzgarSolucion,
} from './bancos';
import {
  CajaHerramientas3D,
  CarrilProtocolo3D,
  ChapaProtocolo3D,
  ConectorHDMI3D,
  ConectorIEC3D,
  ConectorRJ453D,
  EquipoDiagnostico3D,
  Escritorio3D,
  Instrumento3D,
  LataAire3D,
  ModuloRAM3D,
  PosteDePizarra3D,
} from './piezasEquipo3D';

const TOTAL_PASOS = CASILLAS.length + AVERIAS.length * 2;
const POSTE: Punto3 = [0, 0.3, -1.1];
const PIZARRA: Punto3 = [0, 1.05, -1.1];

const LINEAS = {
  inicio:
    'Esta máquina no arranca y no sabemos por qué. Antes de tocarla, arma el protocolo: cinco chapas en el carril, en orden.',
  protoOk: 'Correcto. De lo simple a lo complejo, y una sola cosa a la vez.',
  protoMal: 'Ésa no va ahí. Vuelve a leerla: ¿ese paso se hace antes o después del que ya pusiste?',
  averias:
    'Protocolo armado. Ahora la parte de técnico: leo un síntoma, tú eliges con qué comprobarlo y dónde. Una variable a la vez.',
  comprobarOk: 'Eso es. El instrumento correcto en el sitio correcto, y ya sabemos qué pasa.',
  malInstrumento: 'Ese instrumento no mide eso. ¿Qué tendrías que medir para que el síntoma tenga sentido?',
  malSitio: 'El instrumento es el bueno, pero ahí no está el problema. Vuelve a leer el síntoma.',
  desarmador:
    'Un desarmador no mide nada: con él ya estás desarmando antes de saber qué pasa. Es lo último, no lo primero.',
  resolverMal: 'Todavía no. Aplica la solución mínima que explique el síntoma, sin desarmar de más.',
  vacio: 'Se te cayó a la mesa. Vuelve a tomarlo.',
  fin: 'Cinco averías, cinco resueltas, y ninguna a base de cambiar piezas al azar. Ya eres técnico junior.',
};

const PORTADA: DatosPortadaLab3D = {
  situacion:
    'En la mesa de diagnóstico hay un equipo que no arranca, una pizarra de síntomas y una caja con seis instrumentos.',
  tema: 'Diagnostica y soluciona',
  objetivo:
    'Aplicar un protocolo de diagnóstico —de lo simple a lo complejo, una variable a la vez— sobre cinco averías reales.',
  vasAHacer: [
    'Arma el protocolo de cinco pasos en el carril de la mesa.',
    'Descarta las dos chapas que parecen soluciones y son el último recurso.',
    'Lee cada síntoma y elige con qué comprobarlo y en qué punto.',
    'Aplica la solución mínima que explique el síntoma.',
  ],
  pasos: TOTAL_PASOS,
  minutos: 12,
  insignia: { nombre: 'Técnico junior', emoji: '🩺' },
  boton: 'Entrar a la mesa de diagnóstico',
  acento: '#22d3ee',
};

type Ronda = 'protocolo' | 'averias';

export function LabDiagnosticaYSoluciona(props: ActivityProps & { alSalir?: () => void }) {
  const [enPortada, setEnPortada] = useState(true);
  const [ronda, setRonda] = useState<Ronda>('protocolo');
  const [banco, setBanco] = useState<EstadoBanco>(ESTADO_VACIO);
  const [averia, setAveria] = useState(0);
  const [subfase, setSubfase] = useState<'comprobar' | 'resolver'>('comprobar');
  const [resueltas, setResueltas] = useState<string[]>([]);
  const [lectura, setLectura] = useState<string | null>(null);
  const [marcas, setMarcas] = useState<Record<string, EstadoAnclaje>>({});
  const [aviso, setAviso] = useState<string | null>(null);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion3D();
  const timers = useTemporizadores();
  const lab = useLabActividad(props, TOTAL_PASOS);

  const def: BancoDef = ronda === 'protocolo' ? BANCO_PROTOCOLO : BANCO_AVERIAS;
  const interactivo = !enPortada && !lab.terminado;
  const caso = AVERIAS[Math.min(averia, AVERIAS.length - 1)];

  const puestas = CHAPAS_PROTOCOLO.filter(
    (c) => c.orden !== null && dondeEsta(banco, c.id) === CASILLAS[c.orden - 1],
  ).length;

  const fallar = useCallback(
    (voz: string, anclaje?: string) => {
      lab.restar();
      if (anclaje) {
        setMarcas({ [anclaje]: 'mal' });
        timers.despues(() => setMarcas({}), 700);
      }
      hablar(voz);
    },
    [lab, hablar, timers],
  );

  const alTomar = useCallback(
    (id: string) => {
      if (!interactivo) return;
      const p = piezaDe(def, id);
      if (!p) return;
      reproducirTono('select');
      setBanco((b) => tomar(def, b, id, true));
      setMarcas({});
      const instrumento = INSTRUMENTOS.find((h) => h.id === id);
      if (instrumento) hablar(`${instrumento.etiqueta}: mide ${instrumento.mide}.`);
    },
    [interactivo, def, hablar],
  );

  const alDevolver = useCallback(() => setBanco((b) => devolver(b)), []);

  // ── Ronda 1 · el protocolo ────────────────────────────────────────────────

  const protocolo = useCallback(
    (s: Suelta) => {
      if (s.tipo !== 'encaja') return;
      const chapa = CHAPAS_PROTOCOLO.find((c) => c.id === s.pieza);
      if (!chapa) return;

      if (chapa.orden === null) {
        setBanco(devolver(banco));
        fallar(VOZ_DISTRACTORA[chapa.id] ?? LINEAS.protoMal, s.anclaje);
        return;
      }
      if (CASILLAS[chapa.orden - 1] !== s.anclaje) {
        setBanco(devolver(banco));
        fallar(LINEAS.protoMal, s.anclaje);
        return;
      }

      reproducirTono('correct');
      const puesto = aplicarSuelta(banco, s);
      setBanco(puesto);
      setMarcas({ [s.anclaje]: 'ok' });
      timers.despues(() => setMarcas({}), 700);
      lab.avanzar();
      hablar(LINEAS.protoOk);

      const completo = CHAPAS_PROTOCOLO.filter(
        (c) => c.orden !== null && dondeEsta(puesto, c.id) === CASILLAS[c.orden - 1],
      ).length;
      if (completo === CASILLAS.length) {
        timers.despues(() => {
          setRonda('averias');
          setBanco(BANCO_AVERIAS_INICIAL);
          setAviso('Ronda 2 · Cinco averías');
          hablar(LINEAS.averias);
          timers.despues(() => setAviso(null), 1700);
        }, 1000);
      }
    },
    [banco, fallar, hablar, lab, timers],
  );

  // ── Ronda 2 · las cinco averías ───────────────────────────────────────────

  const averias = useCallback(
    (s: Suelta) => {
      if (s.tipo !== 'encaja' && s.tipo !== 'aplica') return;

      if (subfase === 'comprobar') {
        // Sólo los instrumentos comprueban; una pieza de repuesto aquí es
        // querer arreglar antes de saber qué pasa, y se dice con esas palabras.
        const esInstrumento = INSTRUMENTOS.some((h) => h.id === s.pieza);
        if (!esInstrumento) {
          setBanco(devolver(banco));
          fallar('Todavía no sabes qué falla. Primero comprueba, con un instrumento y en un punto.', s.anclaje);
          return;
        }
        const juicio = juzgarComprobacion(caso, s.pieza, s.anclaje);
        setBanco(aplicarSuelta(banco, s));
        if (juicio !== 'ok') {
          fallar(
            juicio === 'desarmador'
              ? LINEAS.desarmador
              : juicio === 'instrumento'
                ? LINEAS.malInstrumento
                : LINEAS.malSitio,
            s.anclaje,
          );
          return;
        }
        reproducirTono('correct');
        setMarcas({ [s.anclaje]: 'ok' });
        setLectura(caso.lectura);
        lab.avanzar();
        hablar(LINEAS.comprobarOk);
        setSubfase('resolver');
        return;
      }

      // subfase 'resolver'
      if (!juzgarSolucion(caso, s.pieza, s.anclaje)) {
        setBanco(devolver(banco));
        fallar(LINEAS.resolverMal, s.anclaje);
        return;
      }

      reproducirTono('connect');
      const puesto = aplicarSuelta(banco, s);
      setBanco(puesto);
      setMarcas({ [s.anclaje]: 'ok' });
      lab.avanzar();
      const cerradas = [...resueltas, caso.id];
      setResueltas(cerradas);
      setLectura(null);
      hablar(`${caso.arreglo}. Caso cerrado, y con el mínimo desarme: eso es criterio técnico.`);

      timers.despues(() => {
        setMarcas({});
        if (cerradas.length === AVERIAS.length) {
          lab.terminar(Math.round((Date.now() - lab.sim.current.inicio) / 1000), () => hablar(LINEAS.fin));
        } else {
          setAveria((n) => n + 1);
          setSubfase('comprobar');
        }
      }, 1700);
    },
    [banco, caso, subfase, resueltas, fallar, hablar, lab, timers],
  );

  const procesar = useCallback(
    (s: Suelta) => {
      if (s.tipo === 'nada') return;
      if (s.tipo === 'vacio') {
        setBanco(aplicarSuelta(banco, s));
        hablar(LINEAS.vacio);
        return;
      }
      if (s.tipo === 'rebota') {
        setBanco(aplicarSuelta(banco, s));
        fallar(
          s.motivo === 'forma'
            ? 'Eso no entra ahí: mira la forma del conector y la del puerto.'
            : 'Ese sitio ya está ocupado.',
          s.anclaje,
        );
        return;
      }
      if (ronda === 'protocolo') protocolo(s);
      else averias(s);
    },
    [banco, ronda, protocolo, averias, hablar, fallar],
  );

  const alSoltar = useCallback(
    (rayo: Rayo) => procesar(resolverSuelta(def, banco, { rayo }, interactivo)),
    [def, banco, interactivo, procesar],
  );

  const alSoltarEn = useCallback(
    (anclaje: string) => procesar(resolverSueltaEn(def, banco, anclaje, interactivo)),
    [def, banco, interactivo, procesar],
  );

  const repetir = useCallback(() => {
    timers.limpiar();
    setRonda('protocolo');
    setBanco(ESTADO_VACIO);
    setAveria(0);
    setSubfase('comprobar');
    setResueltas([]);
    setLectura(null);
    setMarcas({});
    setAviso(null);
    lab.reiniciar(() => hablar(LINEAS.inicio));
  }, [lab, timers, hablar]);

  // ── Escena ────────────────────────────────────────────────────────────────

  const estadoAnclaje = useCallback(
    (id: string): EstadoAnclaje => {
      if (marcas[id]) return marcas[id];
      return (banco.ocupacion[id] ?? []).length > 0 ? 'ok' : 'espera';
    },
    [marcas, banco],
  );

  const dibujarPieza = useCallback((pieza: { id: string }) => {
    const chapa = CHAPAS_PROTOCOLO.find((c) => c.id === pieza.id);
    if (chapa) return <ChapaProtocolo3D texto={chapa.texto} distractora={chapa.orden === null} />;
    if (INSTRUMENTOS.some((h) => h.id === pieza.id)) return <Instrumento3D id={pieza.id} />;
    if (pieza.id === 'cable-corriente') return <group rotation={[0, Math.PI, 0]}><ConectorIEC3D /></group>;
    if (pieza.id === 'cable-video') return <group rotation={[0, Math.PI, 0]}><ConectorHDMI3D /></group>;
    if (pieza.id === 'cable-red') return <group rotation={[0, Math.PI, 0]}><ConectorRJ453D /></group>;
    if (pieza.id === 'ram') return <ModuloRAM3D />;
    return <LataAire3D />;
  }, []);

  /** La pizarra del taller: una placa colgada de su poste, no un panel. */
  const letreros = useMemo<LetreroMundo[]>(() => {
    const titulo = ronda === 'protocolo' ? 'El protocolo' : `Avería ${Math.min(averia + 1, AVERIAS.length)} de 5`;
    const texto =
      ronda === 'protocolo'
        ? 'Cinco chapas en el carril, de lo simple a lo complejo'
        : (lectura ?? caso.sintoma);
    return [
      { id: 'pizarra', titulo, texto, punto: PIZARRA, ancla: POSTE, ancho: 2.4, color: lectura ? '#4ADE80' : '#22D3EE' },
    ];
  }, [ronda, averia, lectura, caso]);

  const modelo =
    ronda === 'protocolo' ? (
      <>
        <Escritorio3D />
        <CarrilProtocolo3D />
        <CajaHerramientas3D x={0} z={1.35} />
        <PosteDePizarra3D punto={POSTE} />
      </>
    ) : (
      <>
        <Escritorio3D />
        <EquipoDiagnostico3D resueltas={resueltas} />
        <CajaHerramientas3D x={0} z={1.3} />
        <CajaHerramientas3D x={0} z={1.78} />
        <PosteDePizarra3D punto={POSTE} />
      </>
    );

  // ── La cara sin WebGL ─────────────────────────────────────────────────────

  const enMano = banco.tomada;
  const disponibles = def.piezas.filter((p) => dondeEsta(banco, p.id) === null && banco.tomada !== p.id);

  const respaldo = (
    <div className="lb3-respaldo">
      <p className="lb3-respaldo-titulo">
        {ronda === 'protocolo'
          ? 'Coloca las cinco chapas del protocolo en su casilla, en orden.'
          : `Avería ${averia + 1} de ${AVERIAS.length}: «${caso.sintoma}»`}
      </p>
      <p className="lb3-respaldo-nota">
        {ronda === 'protocolo'
          ? `Chapas en su sitio: ${puestas} de ${CASILLAS.length}.`
          : lectura
            ? `${lectura} — ahora aplica la solución.`
            : 'Elige un instrumento y el punto donde aplicarlo.'}
      </p>
      {enMano && <p className="lb3-respaldo-nota">Llevas en la mano: {piezaDe(def, enMano)?.etiqueta}.</p>}

      <div className="lb3-respaldo-grupo">
        <span>{ronda === 'protocolo' ? 'Chapas de la caja' : 'Instrumentos y repuestos'}</span>
        <div className="lb3-respaldo-fila">
          {disponibles.map((p) => (
            <button
              key={p.id}
              type="button"
              className="lb3-boton"
              aria-label={`Tomar ${p.etiqueta}`}
              onClick={() => alTomar(p.id)}
            >
              {p.etiqueta}
            </button>
          ))}
          {/* En la escena se suelta al vacío; por esta cara no había manera de
              dejar nada, y quien juega con teclado se quedaba con la chapa
              pegada a la mano. */}
          {enMano && (
            <button
              type="button"
              className="lb3-boton"
              aria-label="Dejar en la mesa lo que llevas en la mano"
              onClick={alDevolver}
            >
              Dejar en la mesa
            </button>
          )}
        </div>
      </div>

      <div className="lb3-respaldo-grupo">
        <span>{ronda === 'protocolo' ? 'Casillas del carril' : 'Puntos del equipo'}</span>
        <div className="lb3-respaldo-fila">
          {def.anclajes.map((a) => (
            <button
              key={a.id}
              type="button"
              className="lb3-boton"
              disabled={!enMano}
              aria-label={`Usar en ${a.etiqueta}`}
              onClick={() => alSoltarEn(a.id)}
            >
              {a.etiqueta}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const pasoActual =
    ronda === 'protocolo' ? puestas + 1 : CASILLAS.length + averia * 2 + (subfase === 'comprobar' ? 1 : 2);

  return (
    <SalaBanco3D
      titulo="Diagnostica y soluciona"
      pasoEtiqueta="Paso"
      pasoActual={Math.min(pasoActual, TOTAL_PASOS)}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta={ronda === 'protocolo' ? 'Protocolo' : 'Averías'}
      marcadorValor={
        ronda === 'protocolo' ? `${puestas}/${CASILLAS.length}` : `${resueltas.length}/${AVERIAS.length}`
      }
      bit={linea}
      alSalir={props.alSalir}
      base={
        <p className="gabinete-nota">
          La Mesa de Diagnóstico · de lo simple a lo complejo, y una sola variable a la vez
        </p>
      }
      banco={
        <BancoFisico3D
          modelo={modelo}
          def={def}
          estado={banco}
          dibujarPieza={dibujarPieza}
          estadoAnclaje={estadoAnclaje}
          letreros={letreros}
          interactivo={interactivo}
          reduceMotion={reduceMotion}
          limites={LIMITES_BANCO}
          paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
          onTomar={alTomar}
          onSoltar={alSoltar}
          onDevolver={alDevolver}
          respaldo={respaldo}
        />
      }
      final={
        lab.terminado
          ? {
              insigniaNombre: 'Técnico junior',
              insigniaEmoji: '🩺',
              titulo: '¡Cinco averías, cinco resueltas!',
              detalle:
                'Armaste el protocolo de cinco pasos, descartaste las dos chapas que son el último recurso y resolviste las cinco averías comprobando antes de tocar, una variable a la vez y con el mínimo desarme.',
              resumen: [
                { etiqueta: 'Protocolo', valor: `${CASILLAS.length}/${CASILLAS.length}` },
                { etiqueta: 'Averías', valor: `${resueltas.length}/${AVERIAS.length}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(lab.tiempoFinal) },
                { etiqueta: 'Errores', valor: `${lab.erroresFinal}` },
              ],
              alRepetir: repetir,
            }
          : null
      }
    >
      {enPortada && (
        <PortadaLab3D
          portada={PORTADA}
          onEmpezar={() => {
            reproducirTono('select');
            setEnPortada(false);
          }}
        />
      )}
      {aviso && <AvisoRonda texto={aviso} clave={aviso} />}
    </SalaBanco3D>
  );
}

export default LabDiagnosticaYSoluciona;
