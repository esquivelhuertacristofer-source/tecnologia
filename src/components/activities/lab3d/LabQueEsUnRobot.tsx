'use client';

/**
 * N6 · U «Robótica y STEAM» · parada 1 — «¿Qué es un robot?»
 * (DISEÑO-N6-que-es-un-robot.md; documento §53.4 y CANON-ARMAZONES.md:519).
 *
 * **6.º de primaria, 11–12 años**, leído en `curriculo.ts`.
 *
 * ─── Qué enseña ESTA clase y qué no ──────────────────────────────────────────
 *
 * Las paradas 2 y 3 (`LabProgramaUnMicrobit`, `LabRetoRobot`) programan un
 * micro:bit por bloques. Ésta no programa nada: es la clase de ENTENDER de
 * qué está hecho un robot antes de escribirle un programa — sensores meten
 * información, la tarjeta decide, los actuadores sacan algo al mundo — y la
 * lección que sólo el volumen puede dar: **un sensor sólo es un sensor si
 * está donde puede sentir.** El mismo sensor de distancia en el frente frena
 * a tiempo; en el techo, mirando al cielo, es la misma pieza y no ve nada.
 *
 * ─── Cómo se cumple «nada de panel de HTML encima» (el riesgo nº 1) ─────────
 *
 * Clasificar siete piezas en tres cubetas es el ejercicio que más pide a
 * gritos una tabla de `<button>`. Aquí no hay ninguna: las tres charolas y la
 * bahía de la pila son `AnclajeDef` de verdad con su `capacidad` y su aro
 * (`AroAnclaje3D`, del armazón); sus rótulos son `LetreroMundo3D` —lienzo 2D
 * pegado a una placa que gira con el mundo, no HUD—; el interruptor y el
 * botón de Probar son `Mando3D` atornillados al mueble; y hasta la PREGUNTA
 * final del encargo 9 se responde con tres `Mando3D` con su placa de texto en
 * el mundo, no con tres `<button>` flotando sobre el lienzo. Fuera del
 * `<Canvas>` sólo hay lo que pone `SalaBanco3D`: marquesina, marcador, Bit,
 * Salir y la pantalla final.
 *
 * ─── El nervio sensor → tarjeta → actuador ───────────────────────────────────
 *
 * No se dibuja como cable: se enseña **en el tiempo**. Durante la prueba de
 * la ronda 3 el `pulso` (qué tipo de pieza brilla ahora) avanza por
 * `setInterval`/`timers.despues` en el gesto de pulsar Probar —nunca desde
 * dentro de un actualizador de `setState`— y `dibujarPieza` lo lee por
 * cierre. Es el mismo patrón que ya usan las tres clases hermanas.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
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
  evaluar,
  piezaDe,
  quitarPieza,
  resolverSuelta,
  resolverSueltaEn,
  tomar,
  type EstadoAnclaje,
  type EstadoBanco,
  type LetreroMundo,
  type MandoDef,
  type Punto3,
  type Rayo,
  type Suelta,
} from '@/components/simuladores/laboratorio3d';
import { SalaBanco3D, AvisoRonda, useReduceMotion3D } from './SalaBanco3D';
import { PortadaLab3D, type DatosPortadaLab3D } from './PortadaLab3D';
import {
  BANCO_CHAROLAS,
  BANCO_ROBOT,
  BANCO_ROBOT_INICIAL,
  CAJA_Z_CHOCA,
  CAJA_Z_LEJOS,
  CAJA_Z_PARA,
  CX_CHAROLAS,
  ESPERADO_CHAROLAS,
  ESPERADO_ROBOT,
  OX_ROBOT,
  PIEZAS_ROBOT,
  PREGUNTA_SENSOR,
  robotSeDetiene,
  type PiezaRobot,
  type Pulso,
} from './bancoRobot';
import {
  Caja3D,
  Charola3D,
  ChasisRobot3D,
  MesaDeTaller3D,
  MotorRueda3D,
  Pila3D,
  SensorOjo3D,
  TarjetaControladora3D,
  Zumbador3D,
  ZocaloPila3D,
} from './piezasRobot3D';
import './queEsUnRobot.css';

const TOTAL_ENCARGOS = 9;

type Fase = 'portada' | 'charolas' | 'cuerpo' | 'prueba';

/** El guion de Bit, tomado del documento (Parte 1 · 3. Sonora), repartido por
 *  el momento exacto en que dispara cada línea. */
const LINEAS = {
  l1: 'Esto es un robot a medio armar. Hoy no lo vas a programar: hoy vas a entender de qué está hecho.',
  l4: 'Empecemos por las que se enteran. Se llaman sensores, y su trabajo es meter información del mundo hacia adentro.',
  l7: 'Esa pieza no mide nada. Piensa si se entera de algo o si más bien hace algo.',
  l11: 'La tarjeta no se entera de nada por su cuenta. Los sensores le cuentan y ella decide.',
  l13: 'Ahora lo importante. Una pieza no sirve por lo que es, sino por dónde la pones.',
  l14: 'Monta el sensor de distancia donde tú creas que le sirve al robot. Cabe en dos sitios. Elige.',
  l15: 'Cabe, sí. Cabe no quiere decir que sirva. Eso lo vamos a comprobar moviendo al robot.',
  l17: 'Exacto. Debajo del chasis, mirando abajo. Desde arriba no vería la raya nunca.',
  l18: 'El motor va en la rueda. Un actuador sin nada que mover no mueve nada.',
  l19: 'Ya está armado. Pulsa el botón de Probar y no me quites la vista de encima al robot.',
  l20: 'Chocó. No pasa nada malo: eso también es un resultado. Fíjate hacia dónde estaba mirando su sensor.',
  l21: 'Cambia de sitio lo que haga falta y vuelve a probar. Aquí se puede intentar todas las veces que quieras.',
  l22: 'Lo lograste. Se paró antes de chocar y pitó. Mira cómo se encendió la cadena: primero el ojo, luego la tarjeta, luego la rueda.',
  l23: 'Eso que viste encenderse en fila es todo lo que hace un robot. Entra información, se decide algo, sale una acción.',
  l24: 'La puerta de la farmacia hace exactamente eso cuando te acercas. Es un robot aunque no lo parezca.',
  l25: 'En la siguiente parada le vas a escribir tú lo que tiene que decidir. Ya sabes con qué piezas cuenta.',
  vacio: 'Se te cayó. Vuelve a tomarla de donde estaba.',
  rebotaPila: 'Ahí sólo entra la pila: el resto no se enchufa, se clasifica.',
  rebota: 'Ahí no cabe esa pieza. Fíjate en su forma.',
} as const;

/** Lo que Bit dice al levantar cada pieza por primera vez: sale del glosario
 *  de la Parte 1, una frase por pieza. */
const VOZ_TOMA: Readonly<Record<PiezaRobot, string>> = {
  'sensor-distancia': 'Sensor de distancia: mide qué tan lejos está lo que tiene enfrente.',
  'sensor-luz': 'Sensor de luz: sabe si es de día. Los tres sensores meten información del mundo hacia adentro.',
  'sensor-linea': 'Sensor de línea: mira el piso y distingue una raya negra de la loseta blanca.',
  motor: 'Ahora las que hacen algo en el mundo. El motor gira la rueda. Salida.',
  zumbador: 'El zumbador suena. Como el motor, saca algo del robot hacia afuera: salida.',
  tarjeta: 'Y en medio queda la tarjeta. No mide ni suena: decide. Ahí vivirá tu programa en la siguiente parada.',
  pila: 'Queda la pila. No es sensor, no es actuador y no decide. Sólo da energía. Enchúfala en su bahía y sube el interruptor.',
};

const VOZ_ACIERTO_CHAROLA: Readonly<Record<string, string>> = {
  'charola-entra': 'Eso es. Esas piezas meten información. Por eso van en la charola que dice ENTRA.',
  'charola-sale': 'Muy bien. El motor y el zumbador sacan algo del robot hacia afuera.',
  'charola-decide': 'Ahí va: la tarjeta no mide ni suena, decide. Por eso va en la charola que dice DECIDE.',
  'bahia-pila': 'La pila en su bahía. No se clasifica: da energía y ya.',
};

const PORTADA: DatosPortadaLab3D = {
  situacion: 'Nivel 6 · Robótica y STEAM · Parada 1 de 3',
  tema: '¿Qué es un robot?',
  objetivo:
    'Vas a salir de aquí sabiendo que un robot son tres oficios: piezas que se enteran, una tarjeta que decide y piezas que actúan. Y sabiendo algo que casi nadie te dice: que una pieza sólo sirve si está donde alcanza.',
  vasAHacer: [
    'Clasificar siete piezas por su oficio: lo que entra, lo que decide y lo que sale.',
    'Montarlas en el cuerpo del robot, cada una donde de verdad le sirva.',
    'Probar el robot contra un obstáculo y ver encenderse la cadena completa.',
    'Descubrir por qué el mismo sensor en otro sitio deja de servir.',
  ],
  pasos: TOTAL_ENCARGOS,
  minutos: 22,
  insignia: { nombre: 'Ojo de robot', emoji: '🤖' },
  boton: 'Empezar a armar',
  acento: '#22d3ee',
};

interface Progreso {
  e1: boolean;
  e2: boolean;
  e3: boolean;
  e4: boolean;
  e5: boolean;
  e6: boolean;
  e7: boolean;
  e8: boolean;
  e9: boolean;
}

const PROGRESO_VACIO: Progreso = {
  e1: false,
  e2: false,
  e3: false,
  e4: false,
  e5: false,
  e6: false,
  e7: false,
  e8: false,
  e9: false,
};

const TRES_SENSORES = ['sensor-distancia', 'sensor-luz', 'sensor-linea'] as const;
const ANCLAJES_SENSOR = ['frente', 'techo', 'panza'];

export function LabQueEsUnRobot(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<Fase>('portada');
  const [banco, setBanco] = useState<EstadoBanco>(ESTADO_VACIO);
  const [marcas, setMarcas] = useState<Record<string, EstadoAnclaje>>({});
  const [interruptorOn, setInterruptorOn] = useState(false);
  const [pulso, setPulso] = useState<Pulso>(null);
  const [cajaZ, setCajaZ] = useState(CAJA_Z_LEJOS);
  const [choque, setChoque] = useState(false);
  const [choques, setChoques] = useState(0);
  const [corriendoPrueba, setCorriendoPrueba] = useState(false);
  const [preguntaAbierta, setPreguntaAbierta] = useState(false);
  const [respuestaMarcada, setRespuestaMarcada] = useState<number | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const { linea, hablar } = useBit(LINEAS.l1);
  const reduceMotion = useReduceMotion3D();
  const timers = useTemporizadores();
  const lab = useLabActividad(props, TOTAL_ENCARGOS);

  const progresoRef = useRef<Progreso>({ ...PROGRESO_VACIO });
  const pruebaEnCursoRef = useRef(false);
  const transicion1Ref = useRef(false);
  const transicion2Ref = useRef(false);

  const DEF = useMemo(() => (fase === 'cuerpo' || fase === 'prueba' ? BANCO_ROBOT : BANCO_CHAROLAS), [fase]);
  const interactivo = fase !== 'portada' && !lab.terminado && !corriendoPrueba;

  const marcar = useCallback(
    (clave: keyof Progreso) => {
      if (progresoRef.current[clave]) return;
      progresoRef.current = { ...progresoRef.current, [clave]: true };
      lab.avanzar();
    },
    [lab],
  );

  /**
   * El encargo 3 se cierra con DOS gestos distintos —soltar la pila y subir
   * el interruptor— y cualquiera de los dos puede ser el último en llegar.
   * Por eso esta comprobación no puede vivir sólo dentro de `procesar` (el
   * camino de soltar una pieza): también hay que repetirla justo después de
   * accionar el interruptor, o una partida que suelta la pila primero y sube
   * el interruptor al final se queda para siempre en la ronda 1.
   */
  const intentarPasarARonda2 = useCallback(() => {
    if (
      progresoRef.current.e1 &&
      progresoRef.current.e2 &&
      progresoRef.current.e3 &&
      !transicion1Ref.current
    ) {
      transicion1Ref.current = true;
      timers.despues(() => {
        setFase('cuerpo');
        setBanco(BANCO_ROBOT_INICIAL);
        setMarcas({});
        setAviso('Ronda 2 · El cuerpo');
        // L13 y L14 en una sola línea: encadenar una segunda a los 3200 ms es
        // frágil bajo temporizadores falsos (puede sonar tarde y taparle la
        // frase a un gesto posterior) y no aporta nada que perder aquí.
        hablar(`${LINEAS.l13} ${LINEAS.l14}`);
        timers.despues(() => setAviso(null), 1600);
      }, 900);
    }
  }, [hablar, timers]);

  // ── Gestos: tomar y soltar ──────────────────────────────────────────────

  const alTomar = useCallback(
    (id: string) => {
      if (!interactivo) return;
      const pieza = piezaDe(DEF, id);
      if (!pieza) return;
      reproducirTono('select');
      setBanco((b) => tomar(DEF, b, id, true));
      setMarcas({});
      hablar(VOZ_TOMA[id as PiezaRobot] ?? pieza.etiqueta);
    },
    [interactivo, DEF, hablar],
  );

  const alDevolver = useCallback(() => {
    setBanco((b) => devolver(b));
  }, []);

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
        setMarcas({ [s.anclaje]: 'mal' });
        hablar(s.anclaje === 'bahia-pila' ? LINEAS.rebotaPila : LINEAS.rebota);
        timers.despues(() => setMarcas({}), 620);
        return;
      }

      if (s.tipo !== 'encaja') return;

      const puesto = aplicarSuelta(banco, s);
      setBanco(puesto);
      const pieza = s.pieza as PiezaRobot;
      const destino = s.anclaje;

      if (fase === 'charolas') {
        const correcto = ESPERADO_CHAROLAS[pieza] === destino;
        if (correcto) {
          reproducirTono('correct');
          setMarcas({ [destino]: 'ok' });
          hablar(VOZ_ACIERTO_CHAROLA[destino] ?? 'Eso es.');
        } else {
          lab.restar();
          setMarcas({ [destino]: 'mal' });
          hablar(pieza === 'tarjeta' ? LINEAS.l11 : LINEAS.l7);
          timers.despues(() => {
            setBanco((b) => quitarPieza(b, pieza));
            setMarcas({});
          }, 1500);
        }

        const sensoresListos = TRES_SENSORES.every((p) => dondeEsta(puesto, p) === 'charola-entra');
        if (sensoresListos) marcar('e1');

        const salidaYDecideListos =
          dondeEsta(puesto, 'motor') === 'charola-sale' &&
          dondeEsta(puesto, 'zumbador') === 'charola-sale' &&
          dondeEsta(puesto, 'tarjeta') === 'charola-decide';
        if (salidaYDecideListos) marcar('e2');

        const pilaLista = dondeEsta(puesto, 'pila') === 'bahia-pila';
        if (pilaLista && interruptorOn) marcar('e3');

        intentarPasarARonda2();
        return;
      }

      // fase 'cuerpo' o 'prueba': el cuerpo del robot. Sigue interactivo en la
      // ronda 3 a propósito — «desmontar en la ronda 3 lo que se montó en la 2
      // y volver a probar» tiene que poderse.
      reproducirTono('correct');
      setMarcas({ [destino]: 'ok' });
      timers.despues(() => setMarcas({}), 500);

      if (pieza === 'sensor-distancia') {
        hablar(destino === 'frente' ? 'Ahí. Vamos a comprobar si de verdad ve lo que tienes enfrente.' : LINEAS.l15);
      } else if (pieza === 'sensor-linea') {
        hablar(destino === 'panza' ? LINEAS.l17 : 'Cabe. Pero piensa hacia dónde tiene que apuntar para ver el piso.');
      } else if (pieza === 'sensor-luz') {
        hablar('Montado. Cada sensor mira hacia un lado distinto.');
      } else if (pieza === 'motor') {
        hablar(LINEAS.l18);
      } else if (pieza === 'zumbador') {
        hablar('El zumbador, en la torre, listo para sonar.');
      } else if (pieza === 'tarjeta') {
        hablar('La tarjeta, en el pecho: desde ahí lee a los sensores y manda a los actuadores.');
      } else {
        hablar('La pila, otra vez en su bahía.');
      }

      if (fase === 'cuerpo') {
        if (dondeEsta(puesto, 'sensor-distancia') === 'frente' || dondeEsta(puesto, 'sensor-distancia') === 'techo') {
          marcar('e4');
        }
        if (
          ANCLAJES_SENSOR.includes(dondeEsta(puesto, 'sensor-luz') ?? '') &&
          ANCLAJES_SENSOR.includes(dondeEsta(puesto, 'sensor-linea') ?? '')
        ) {
          marcar('e5');
        }
        if (
          dondeEsta(puesto, 'motor') === 'rueda' &&
          dondeEsta(puesto, 'zumbador') === 'torre' &&
          dondeEsta(puesto, 'tarjeta') === 'pecho'
        ) {
          marcar('e6');
        }

        if (
          progresoRef.current.e4 &&
          progresoRef.current.e5 &&
          progresoRef.current.e6 &&
          !transicion2Ref.current
        ) {
          transicion2Ref.current = true;
          timers.despues(() => {
            setFase('prueba');
            setAviso('Ronda 3 · La prueba');
            hablar(LINEAS.l19);
            timers.despues(() => setAviso(null), 1600);
          }, 900);
        }
      }
    },
    [banco, fase, hablar, intentarPasarARonda2, interruptorOn, lab, marcar, timers],
  );

  const alSoltar = useCallback(
    (rayo: Rayo) => procesar(resolverSuelta(DEF, banco, { rayo }, interactivo)),
    [DEF, banco, interactivo, procesar],
  );

  /** La puerta del teclado y la del respaldo: el hueco se nombra, no se apunta. */
  const alSoltarEn = useCallback(
    (anclaje: string) => procesar(resolverSueltaEn(DEF, banco, anclaje, interactivo)),
    [DEF, banco, interactivo, procesar],
  );

  // ── La prueba de la ronda 3 ──────────────────────────────────────────────

  const alProbar = useCallback(() => {
    if (fase !== 'prueba' || lab.terminado || pruebaEnCursoRef.current) return;
    pruebaEnCursoRef.current = true;
    setCorriendoPrueba(true);
    reproducirTono('select');
    setCajaZ(CAJA_Z_LEJOS);
    setPulso(null);
    setChoque(false);

    const evalua = evaluar(BANCO_ROBOT, banco, ESPERADO_ROBOT);
    const detiene = robotSeDetiene(banco);

    timers.despues(() => setPulso('sensor'), 450);
    timers.despues(() => setPulso('tarjeta'), 900);
    timers.despues(() => {
      setPulso(detiene ? 'actuador' : null);
      setCajaZ(detiene ? CAJA_Z_PARA : CAJA_Z_CHOCA);
      if (!detiene) {
        setChoque(true);
        setChoques((c) => c + 1);
      }
    }, 1350);
    timers.despues(() => {
      pruebaEnCursoRef.current = false;
      setCorriendoPrueba(false);
      setPulso(null);
      setChoque(false);
      marcar('e7');

      const faltantesTxt = evalua.faltantes.length
        ? ` Todavía te faltan piezas por montar: ${evalua.faltantes
            .map((id) => piezaDe(BANCO_ROBOT, id)?.etiqueta ?? id)
            .join(', ')}.`
        : '';

      if (!detiene) {
        hablar(`${LINEAS.l20} ${LINEAS.l21}${faltantesTxt}`);
        return;
      }

      if (evalua.completo) {
        marcar('e8');
        hablar(LINEAS.l22);
        timers.despues(() => {
          setPreguntaAbierta(true);
          hablar(PREGUNTA_SENSOR.texto);
        }, 2600);
      } else {
        hablar(`Se detuvo a tiempo. Pero todavía no todo está en su sitio: revisa los otros sensores.${faltantesTxt}`);
      }
    }, 2200);
  }, [banco, fase, hablar, lab.terminado, marcar, timers]);

  // ── Los mandos: interruptor, Probar y la pregunta ────────────────────────

  const alMando = useCallback(
    (id: string) => {
      if (id === 'probar') {
        alProbar();
        return;
      }
      if (!interactivo) return;
      if (id === 'interruptor') {
        reproducirTono('power');
        const nuevo = !interruptorOn;
        setInterruptorOn(nuevo);
        if (fase === 'charolas' && nuevo && dondeEsta(banco, 'pila') === 'bahia-pila') {
          marcar('e3');
          intentarPasarARonda2();
        }
        return;
      }
      if (id.startsWith('resp-')) {
        if (!preguntaAbierta) return;
        const idx = Number(id.slice(5));
        if (idx === PREGUNTA_SENSOR.correcta) {
          reproducirTono('correct');
          marcar('e9');
          setRespuestaMarcada(idx);
          setPreguntaAbierta(false);
          hablar(`${LINEAS.l23} ${LINEAS.l24}`);
          timers.despues(() => {
            lab.terminar(Math.round((Date.now() - lab.sim.current.inicio) / 1000), () => hablar(LINEAS.l25));
          }, 2400);
        } else {
          reproducirTono('error');
          lab.restar();
          setRespuestaMarcada(idx);
          hablar('Ésa no es. Piensa: no es la forma ni el color. Es de qué lado va la información.');
          timers.despues(() => setRespuestaMarcada(null), 900);
        }
      }
    },
    [alProbar, banco, fase, hablar, intentarPasarARonda2, interactivo, interruptorOn, lab, marcar, preguntaAbierta, timers],
  );

  const repetir = useCallback(() => {
    timers.limpiar();
    pruebaEnCursoRef.current = false;
    transicion1Ref.current = false;
    transicion2Ref.current = false;
    progresoRef.current = { ...PROGRESO_VACIO };
    setFase('charolas');
    setBanco(ESTADO_VACIO);
    setMarcas({});
    setInterruptorOn(false);
    setPulso(null);
    setCajaZ(CAJA_Z_LEJOS);
    setChoque(false);
    setChoques(0);
    setCorriendoPrueba(false);
    setPreguntaAbierta(false);
    setRespuestaMarcada(null);
    setAviso(null);
    lab.reiniciar(() => hablar(LINEAS.l1));
  }, [hablar, lab, timers]);

  // ── La escena ─────────────────────────────────────────────────────────────

  const estadoAnclaje = useCallback(
    (id: string): EstadoAnclaje => {
      if (marcas[id]) return marcas[id];
      const dentro = banco.ocupacion[id] ?? [];
      return dentro.length > 0 ? 'ok' : 'espera';
    },
    [marcas, banco],
  );

  const dibujarPieza = useCallback(
    (pieza: { id: string; tipo: string }, vista: { anclada: boolean }) => {
      const brillo = pulso && pieza.tipo === pulso && vista.anclada ? 1 : 0;
      switch (pieza.id) {
        case 'sensor-distancia':
          return <SensorOjo3D variante="distancia" brillo={brillo} reduceMotion={reduceMotion} />;
        case 'sensor-luz':
          return <SensorOjo3D variante="luz" brillo={brillo} reduceMotion={reduceMotion} />;
        case 'sensor-linea':
          return <SensorOjo3D variante="linea" brillo={brillo} reduceMotion={reduceMotion} />;
        case 'motor':
          return <MotorRueda3D brillo={brillo} reduceMotion={reduceMotion} />;
        case 'zumbador':
          return <Zumbador3D brillo={brillo} reduceMotion={reduceMotion} />;
        case 'tarjeta':
          return <TarjetaControladora3D brillo={brillo} reduceMotion={reduceMotion} />;
        default:
          return <Pila3D />;
      }
    },
    [pulso, reduceMotion],
  );

  const letreros = useMemo<LetreroMundo[]>(() => {
    if (fase === 'charolas') {
      return BANCO_CHAROLAS.anclajes.map((a) => ({
        id: `letrero-${a.id}`,
        titulo: a.etiqueta,
        punto: [a.punto[0], a.punto[1] + 0.5, a.punto[2] - 0.35] as Punto3,
        ancla: a.punto,
        color: a.id === 'charola-entra' ? '#22D3EE' : a.id === 'charola-decide' ? '#A78BFA' : a.id === 'charola-sale' ? '#FBBF24' : '#4ADE80',
      }));
    }
    if (preguntaAbierta) {
      return PREGUNTA_SENSOR.opciones.map((texto, i) => ({
        id: `opcion-${i}`,
        titulo: `Opción ${String.fromCharCode(65 + i)}`,
        texto,
        punto: [OX_ROBOT + (i - 1) * 0.55, -0.15, 2.1] as Punto3,
        ancla: [OX_ROBOT + (i - 1) * 0.55, -0.55, 2.1] as Punto3,
        color: '#A78BFA',
        ancho: 0.9,
      }));
    }
    return [];
  }, [fase, preguntaAbierta]);

  const mandos = useMemo<MandoDef[]>(() => {
    const lista: MandoDef[] = [];
    if (fase !== 'portada') {
      lista.push({
        id: 'interruptor',
        forma: 'palanca',
        punto: [CX_CHAROLAS + 0.35, -0.62, 1.72],
        mira: [0, 0, 1],
        etiqueta: 'Interruptor de la pila',
        encendido: interruptorOn,
        activo: interactivo,
        color: interruptorOn ? '#4ADE80' : '#F5A524',
      });
    }
    if (fase === 'prueba') {
      lista.push({
        id: 'probar',
        forma: 'boton',
        punto: [OX_ROBOT, -0.58, 1.5],
        mira: [0, 0, 1],
        etiqueta: 'Probar',
        activo: !lab.terminado && !corriendoPrueba,
        color: '#22D3EE',
      });
    }
    if (preguntaAbierta) {
      PREGUNTA_SENSOR.opciones.forEach((texto, i) => {
        lista.push({
          id: `resp-${i}`,
          forma: 'boton',
          punto: [OX_ROBOT + (i - 1) * 0.55, -0.55, 2.1],
          mira: [0, 0, 1],
          etiqueta: texto,
          encendido: respuestaMarcada === i,
          activo: interactivo,
          color: respuestaMarcada === i ? (i === PREGUNTA_SENSOR.correcta ? '#4ADE80' : '#EF4444') : '#A78BFA',
        });
      });
    }
    return lista;
  }, [corriendoPrueba, fase, interactivo, interruptorOn, lab.terminado, preguntaAbierta, respuestaMarcada]);

  const enfoque = useMemo<Punto3 | null>(() => {
    if (fase === 'charolas') return [CX_CHAROLAS, 0, 1.0];
    if (fase === 'cuerpo' || fase === 'prueba') return [OX_ROBOT, 0, 0.3];
    return null;
  }, [fase]);

  const modelo = (
    <>
      <MesaDeTaller3D />
      <Charola3D punto={BANCO_CHAROLAS.anclajes[0].punto} color="#22D3EE" />
      <Charola3D punto={BANCO_CHAROLAS.anclajes[1].punto} color="#A78BFA" />
      <Charola3D punto={BANCO_CHAROLAS.anclajes[2].punto} color="#FBBF24" />
      <ZocaloPila3D punto={BANCO_CHAROLAS.anclajes[3].punto} />
      <ChasisRobot3D />
      <Caja3D zMeta={cajaZ} reduceMotion={reduceMotion} choque={choque} />
    </>
  );

  // ── La cara sin WebGL: una clase entera, no un mensaje de disculpa ────────

  const enMano = banco.tomada;
  const puestas = DEF.piezas.filter((p) => dondeEsta(banco, p.id) !== null);
  const sueltas = DEF.piezas.filter((p) => dondeEsta(banco, p.id) === null && banco.tomada !== p.id);

  const respaldo = (
    <div className="lb3-respaldo">
      <p className="lb3-respaldo-titulo">
        {fase === 'charolas'
          ? 'Clasifica las siete piezas: cada una a la charola de su oficio.'
          : fase === 'cuerpo'
            ? 'Monta cada pieza en el cuerpo del robot, donde de verdad le sirva.'
            : 'Pulsa Probar y mira si el robot se detiene a tiempo.'}
      </p>
      <p className="lb3-respaldo-nota">
        {enMano
          ? `Llevas en la mano: ${piezaDe(DEF, enMano)?.etiqueta ?? enMano}. Elige un sitio.`
          : `Piezas montadas: ${puestas.length} de ${PIEZAS_ROBOT.length}.`}
      </p>

      <div className="lb3-respaldo-grupo">
        <span>Piezas</span>
        <div className="lb3-respaldo-fila">
          {puestas.map((p) => (
            <button
              key={p.id}
              type="button"
              className="lb3-boton"
              aria-label={`Sacar la pieza ${p.etiqueta}`}
              onClick={() => alTomar(p.id)}
            >
              Sacar {p.etiqueta}
            </button>
          ))}
          {sueltas.map((p) => (
            <button
              key={p.id}
              type="button"
              className="lb3-boton"
              aria-label={`Tomar la pieza ${p.etiqueta}`}
              onClick={() => alTomar(p.id)}
            >
              Tomar {p.etiqueta}
            </button>
          ))}
          {enMano && (
            <button type="button" className="lb3-boton" aria-label="Dejar la pieza donde estaba" onClick={alDevolver}>
              Dejar la pieza
            </button>
          )}
        </div>
      </div>

      <div className="lb3-respaldo-grupo">
        <span>{fase === 'charolas' ? 'Charolas y bahía' : 'El cuerpo del robot'}</span>
        <div className="lb3-respaldo-fila">
          {DEF.anclajes.map((a) => (
            <button
              key={a.id}
              type="button"
              className="lb3-boton"
              disabled={!enMano}
              aria-label={`Poner en ${a.etiqueta}`}
              onClick={() => alSoltarEn(a.id)}
            >
              {a.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div className="lb3-respaldo-grupo">
        <span>El interruptor</span>
        <div className="lb3-respaldo-fila">
          <button
            type="button"
            className="lb3-boton"
            aria-pressed={interruptorOn}
            aria-label={interruptorOn ? 'Bajar el interruptor' : 'Subir el interruptor'}
            onClick={() => alMando('interruptor')}
          >
            {interruptorOn ? 'Interruptor arriba' : 'Subir el interruptor'}
          </button>
        </div>
      </div>

      {fase === 'prueba' && (
        <div className="lb3-respaldo-grupo">
          <span>La prueba</span>
          <div className="lb3-respaldo-fila">
            <button
              type="button"
              className="lb3-boton"
              disabled={corriendoPrueba || lab.terminado}
              aria-label="Pulsar Probar"
              onClick={() => alMando('probar')}
            >
              Probar
            </button>
          </div>
          {choques > 0 && (
            <p className="lb3-respaldo-nota qer-choques">
              Chocó {choques} {choques === 1 ? 'vez' : 'veces'}.
            </p>
          )}
        </div>
      )}

      {preguntaAbierta && (
        <div className="lb3-respaldo-grupo">
          <span className="qer-pregunta">{PREGUNTA_SENSOR.texto}</span>
          <div className="lb3-respaldo-fila">
            {PREGUNTA_SENSOR.opciones.map((texto, i) => (
              <button
                key={texto}
                type="button"
                className="lb3-boton"
                aria-label={`Responder: ${texto}`}
                onClick={() => alMando(`resp-${i}`)}
              >
                {texto}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <SalaBanco3D
      titulo="¿Qué es un robot?"
      pasoEtiqueta="Encargo"
      pasoActual={Math.min(lab.pasos + 1, TOTAL_ENCARGOS)}
      pasosTotal={TOTAL_ENCARGOS}
      marcadorEtiqueta="Encargos"
      marcadorValor={`${lab.pasos}/${TOTAL_ENCARGOS}`}
      bit={linea}
      alSalir={props.alSalir}
      base={
        <p className="gabinete-nota">
          La mesa de clasificar y el carrito · gira alrededor con el ratón para ver los dos
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
          enfoque={enfoque}
          interactivo={interactivo}
          reduceMotion={reduceMotion}
          limites={LIMITES_BANCO}
          paleta={{ acento: '#22D3EE', acento2: '#FBBF24' }}
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
              insigniaNombre: 'Ojo de robot',
              insigniaEmoji: '🤖',
              titulo: '¡Tu robot ve lo que tiene enfrente!',
              detalle:
                'Clasificaste siete piezas, las montaste donde sirven, y lo probaste hasta que se paró a tiempo. Eso es un robot completo: entrada, decisión y salida.',
              resumen: [
                { etiqueta: 'Encargos', valor: `${TOTAL_ENCARGOS}/${TOTAL_ENCARGOS}` },
                { etiqueta: 'Tiempo', valor: formatTiempo(lab.tiempoFinal) },
                { etiqueta: 'Chocó', valor: `${choques} ${choques === 1 ? 'vez' : 'veces'}` },
                { etiqueta: 'Puntos', valor: `${lab.puntaje()}` },
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
            setFase('charolas');
            hablar(LINEAS.l4);
          }}
        />
      )}
      {aviso && <AvisoRonda texto={aviso} clave={aviso} />}
    </SalaBanco3D>
  );
}

export default LabQueEsUnRobot;
