'use client';

/**
 * N5·U1 parada 4 · «Manos al mantenimiento» (documento §53.2). **10–11 años.**
 * Cierra la unidad del sistema de cómputo.
 *
 * ─── Por qué esta clase es de volumen y no de pantalla ───────────────────────
 *
 * Porque lo que enseña es **una secuencia de manos sobre materia**: fuera la
 * corriente, la estática, los tornillos, la tapa, el aire, la RAM, y todo otra
 * vez al revés. Una lista de casillas que se van marcando enseñaría el orden;
 * no enseñaría que el tornillo se queda en la mano y hay que devolverlo.
 *
 * ─── El orden como contenido ─────────────────────────────────────────────────
 *
 * `REQUISITOS_MANT` es una tabla, no una cadena de `if`, y vive en el módulo
 * puro. Ahí está escrito que abrir exige los tres pasos de seguridad y que
 * cerrar exige las tres tareas de dentro —en cualquier orden entre ellas,
 * porque en el taller da igual por cuál se empiece—. Saltarse un requisito no
 * se ignora: **se explica y resta**. Si el aparato dejara abrir con el cable
 * puesto, la regla no sería una regla.
 *
 * ─── El equipo empieza montado ───────────────────────────────────────────────
 *
 * Al revés que `n7-dentro-del-gabinete`, aquí el estado inicial tiene la RAM en
 * su ranura, los dos tornillos en sus agujeros y la corriente enchufada. La
 * primera destreza es **desmontar en el orden correcto**, y para eso el armazón
 * ya trae el gesto: coger una pieza montada la desmonta.
 */

import { useCallback, useMemo, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../n1/mision/audio';
import { useBit } from '../n1/arcade/ArcadeSala';
import { useTemporizadores } from '../arcade3d/useTemporizadores';
import { useLabActividad, formatTiempo } from '../lib/useLabActividad';
import {
  BancoFisico3D,
  LIMITES_BANCO,
  anclajeDe,
  aplicarSuelta,
  devolver,
  dondeEsta,
  piezaDe,
  puedeTomar,
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
  BANCO_MANTENIMIENTO,
  BANCO_MANT_INICIAL,
  ESPERADO_MANT,
  PASOS_MANT,
  esInterior,
  interiorHecho,
  pasoPermitido,
  type PasoMant,
} from './bancos';
import {
  ConectorIEC3D,
  Escritorio3D,
  LataAire3D,
  ModuloRAM3D,
  Regulador3D,
  TorreAbierta3D,
  Tornillo3D,
} from './piezasEquipo3D';

const DEF = BANCO_MANTENIMIENTO;
const TOTAL_PASOS = PASOS_MANT.length;

const LINEAS = {
  inicio:
    'Este equipo se apaga solo cuando lo exigen, y no está roto: está sucio. Vamos a abrirlo como se abre de verdad. Lo primero, siempre: fuera la corriente.',
  corrienteFuera:
    'Bien. Apagar no basta: mientras el cable esté puesto, dentro sigue habiendo corriente. Ahora descarga la estática tocando el chasis.',
  estatica:
    'Listo. Esa electricidad no la sientes y aun así basta para dañar un chip. Ahora los dos tornillos de mariposa: se aflojan con los dedos.',
  tornillosFuera: 'Los dos fuera y a la charola, que si ruedan no aparecen. Ahora tira del pestillo y abre la tapa.',
  abierto:
    'Ahí está el problema: mira el polvo del ventilador y del disipador. Toma la lata de aire y sopla los dos, en golpes cortos.',
  soplado: 'Ese polvo era justo lo que le tapaba el aire. Sigue.',
  ram: 'La RAM entra a presión hasta que las palancas cierran solas. Reasentarla arregla la mitad de los equipos que no arrancan.',
  interiorListo: 'Dentro está todo. Cierra la tapa con el pestillo.',
  cerrado: 'Ahora devuelve los dos tornillos. Un equipo cerrado a medias vibra y se vuelve a llenar de polvo.',
  tornillosPuestos: 'Los dos puestos. Y ahora sí: la corriente, al final.',
  fin: 'Mantenimiento terminado. Este equipo ya no se va a apagar solo, y lo arreglaste tú sin cambiarle una sola pieza.',

  // Guardas de seguridad: son errores de verdad, con su explicación.
  antesCorriente: 'Alto. Con el cable de corriente puesto no se toca nada del equipo. Desconéctalo primero.',
  antesEstatica: 'Espera: descarga la estática tocando el chasis antes de tocar nada más.',
  antesTornillos: 'La tapa no sale con los tornillos puestos. Quita los dos primero.',
  cerrada: 'Con la tapa cerrada no llegas ahí dentro. Ábrela primero.',
  faltaDentro: 'Todavía no. Dentro falta algo: el ventilador, el disipador y la RAM.',
  faltaCerrar: 'Los tornillos van con la tapa puesta. Ciérrala primero.',
  faltaTornillos: 'La corriente al final, y con los dos tornillos puestos. Todavía falta uno.',
  huecoMalo: 'Ahí no va. Mira dónde estaba antes de sacarlo.',
  vacio: 'Se te cayó a la mesa. No pasa nada: vuelve a tomarlo.',
};

const PORTADA: DatosPortadaLab3D = {
  situacion:
    'El equipo del salón se apaga solo a los diez minutos de trabajar. No está roto: lleva dos años sin abrirse.',
  tema: 'Manos al mantenimiento',
  objetivo: 'Darle mantenimiento preventivo a un equipo respetando el orden de seguridad, de principio a fin.',
  vasAHacer: [
    'Desconecta la corriente y descarga la estática de tu cuerpo.',
    'Quita los dos tornillos de mariposa y abre la tapa.',
    'Sopla el polvo del ventilador y del disipador con aire comprimido.',
    'Reasienta la RAM, cierra, devuelve los tornillos y reconecta.',
  ],
  pasos: TOTAL_PASOS,
  minutos: 10,
  insignia: { nombre: 'Manos de mantenimiento', emoji: '🧰' },
  boton: 'Empezar el mantenimiento',
  acento: '#F5A524',
};

/** Dónde cuelga el letrero de guía en cada paso: del objeto que toca. */
const ANCLA_PASO: Readonly<Record<PasoMant, string>> = {
  'corriente-fuera': 'toma-corriente',
  estatica: 'toma-corriente',
  'tornillos-fuera': 'tornillo-a',
  abrir: 'tornillo-a',
  ventilador: 'ventilador',
  disipador: 'disipador',
  ram: 'ranura-ram',
  cerrar: 'ranura-ram',
  'tornillos-puestos': 'tornillo-a',
  'corriente-puesta': 'toma-corriente',
};

const TITULO_PASO: Readonly<Record<PasoMant, string>> = {
  'corriente-fuera': 'Paso 1',
  estatica: 'Paso 2',
  'tornillos-fuera': 'Paso 3',
  abrir: 'Paso 4',
  ventilador: 'Paso 5',
  disipador: 'Paso 6',
  ram: 'Paso 7',
  cerrar: 'Paso 8',
  'tornillos-puestos': 'Paso 9',
  'corriente-puesta': 'Paso 10',
};

const TEXTO_PASO: Readonly<Record<PasoMant, string>> = {
  'corriente-fuera': 'Saca el cable de corriente del regulador',
  estatica: 'Toca el chasis para descargar la estatica',
  'tornillos-fuera': 'Afloja los dos tornillos de mariposa',
  abrir: 'Tira del pestillo y abre la tapa',
  ventilador: 'Sopla el polvo del ventilador',
  disipador: 'Sopla el polvo del disipador',
  ram: 'Saca la RAM y vuelve a meterla a presion',
  cerrar: 'Cierra la tapa con el pestillo',
  'tornillos-puestos': 'Devuelve los dos tornillos a sus agujeros',
  'corriente-puesta': 'Reconecta la corriente en el regulador',
};

export function LabManosAlMantenimiento(props: ActivityProps & { alSalir?: () => void }) {
  const [enPortada, setEnPortada] = useState(true);
  const [banco, setBanco] = useState<EstadoBanco>(BANCO_MANT_INICIAL);
  const [hechos, setHechos] = useState<PasoMant[]>([]);
  const [abierta, setAbierta] = useState(false);
  const [marcas, setMarcas] = useState<Record<string, EstadoAnclaje>>({});
  const [aviso, setAviso] = useState<string | null>(null);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion3D();
  const timers = useTemporizadores();
  const lab = useLabActividad(props, TOTAL_PASOS);

  const interactivo = !enPortada && !lab.terminado;
  const dentro = interiorHecho(banco);

  /** El primer paso que todavía no está hecho. Es lo que Bit y el letrero dicen. */
  const pasoActual: PasoMant = PASOS_MANT.find((p) => !hechos.includes(p)) ?? 'corriente-puesta';

  const fallar = useCallback(
    (voz: string, anclaje?: string) => {
      lab.restar();
      if (anclaje) {
        setMarcas({ [anclaje]: 'mal' });
        timers.despues(() => setMarcas({}), 620);
      }
      hablar(voz);
    },
    [lab, hablar, timers],
  );

  /** Anota un paso, avanza el arnés y suelta la línea que le toque. */
  const lograr = useCallback(
    (paso: PasoMant, voz: string) => {
      if (hechos.includes(paso)) return;
      reproducirTono('correct');
      const nuevos = [...hechos, paso];
      setHechos((h) => (h.includes(paso) ? h : [...h, paso]));
      lab.avanzar();
      hablar(voz);
      if (paso === 'corriente-puesta') {
        timers.despues(() => {
          lab.terminar(Math.round((Date.now() - lab.sim.current.inicio) / 1000), () => hablar(LINEAS.fin));
        }, 900);
      } else if (
        nuevos.includes('ventilador') &&
        nuevos.includes('disipador') &&
        nuevos.includes('ram') &&
        !nuevos.includes('cerrar')
      ) {
        timers.despues(() => {
          setAviso('Todo limpio · ahora se cierra');
          hablar(LINEAS.interiorListo);
          timers.despues(() => setAviso(null), 1500);
        }, 700);
      }
    },
    [hechos, lab, hablar, timers],
  );

  /**
   * «Los dos tornillos fuera» es un paso, no dos, y no se cumple al cogerlos
   * sino **al dejarlos en la charola**: uno puede sacar el primero, cambiar de
   * idea y volver a atornillarlo. Por eso se comprueba sobre el estado nuevo
   * después de cada gesto, y no dentro de `alTomar`.
   */
  const revisarTornillos = useCallback(
    (b: EstadoBanco) => {
      if (hechos.includes('tornillos-fuera') || !hechos.includes('estatica')) return;
      const fuera = (p: string) => dondeEsta(b, p) === null && b.tomada !== p;
      if (fuera('tornillo1') && fuera('tornillo2')) lograr('tornillos-fuera', LINEAS.tornillosFuera);
    },
    [hechos, lograr],
  );

  // ── Coger una pieza ───────────────────────────────────────────────────────

  const alTomar = useCallback(
    (id: string) => {
      if (!interactivo) return;
      if (!puedeTomar(DEF, banco, id, true)) return;

      // Guardas de seguridad. No son adorno: son la clase.
      if (id !== 'corriente' && !hechos.includes('corriente-fuera')) {
        fallar(LINEAS.antesCorriente);
        return;
      }
      if (id !== 'corriente' && !hechos.includes('estatica')) {
        fallar(LINEAS.antesEstatica);
        return;
      }
      if ((id === 'ram' || id === 'aire') && !abierta) {
        hablar(LINEAS.cerrada);
        return;
      }
      if (id === 'corriente' && hechos.includes('corriente-fuera') && !hechos.includes('tornillos-puestos')) {
        hablar(LINEAS.faltaTornillos);
        return;
      }

      reproducirTono('select');
      const siguiente = tomar(DEF, banco, id, true);
      setBanco(siguiente);
      setMarcas({});

      // Sacar el cable de corriente ES el primer paso, y se cumple en cuanto
      // deja de estar enchufado: lo que venga después con él en la mano ya es
      // otra cosa.
      if (id === 'corriente' && !hechos.includes('corriente-fuera')) {
        lograr('corriente-fuera', LINEAS.corrienteFuera);
        return;
      }
      if (id === 'ram') hablar(LINEAS.ram);
      revisarTornillos(siguiente);
    },
    [interactivo, banco, hechos, abierta, fallar, hablar, lograr, revisarTornillos],
  );

  const alDevolver = useCallback(() => {
    const vuelto = devolver(banco);
    setBanco(vuelto);
    revisarTornillos(vuelto);
  }, [banco, revisarTornillos]);

  // ── Soltar ────────────────────────────────────────────────────────────────

  const procesar = useCallback(
    (s: Suelta) => {
      if (s.tipo === 'nada') return;

      if (s.tipo === 'vacio') {
        const caido = aplicarSuelta(banco, s);
        setBanco(caido);
        hablar(LINEAS.vacio);
        revisarTornillos(caido);
        return;
      }

      if (s.tipo === 'rebota') {
        const rebotado = aplicarSuelta(banco, s);
        setBanco(rebotado);
        fallar(LINEAS.huecoMalo, s.anclaje);
        revisarTornillos(rebotado);
        return;
      }

      // Lo de dentro sólo existe con la tapa abierta. Se comprueba ANTES de
      // aplicar: por eso el armazón separa resolver de aplicar.
      if (esInterior(s.anclaje) && !abierta) {
        setBanco(devolver(banco));
        hablar(LINEAS.cerrada);
        return;
      }

      if (s.tipo === 'aplica') {
        const paso: PasoMant = s.anclaje === 'ventilador' ? 'ventilador' : 'disipador';
        const puesto = aplicarSuelta(banco, s);
        setBanco(puesto);
        if (hechos.includes(paso)) {
          hablar('Ése ya está limpio. Sopla el otro.');
          return;
        }
        setMarcas({ [s.anclaje]: 'ok' });
        timers.despues(() => setMarcas({}), 800);
        lograr(paso, 'Ese polvo era justo lo que le tapaba el aire. Sigue con lo que falte de dentro.');
        return;
      }

      // 'encaja'
      const destino = ESPERADO_MANT[s.pieza];
      if (destino !== s.anclaje) {
        setBanco(devolver(banco));
        fallar(LINEAS.huecoMalo, s.anclaje);
        return;
      }

      // Poner los tornillos con la tapa abierta no es un fallo del aparato: es
      // un fallo de método, y por eso lo denuncia la clase.
      const esTornillo = s.pieza === 'tornillo1' || s.pieza === 'tornillo2';
      if (esTornillo && !hechos.includes('cerrar')) {
        setBanco(devolver(banco));
        fallar(LINEAS.faltaCerrar, s.anclaje);
        return;
      }

      const puesto = aplicarSuelta(banco, s);
      setBanco(puesto);
      setMarcas({ [s.anclaje]: 'ok' });
      timers.despues(() => setMarcas({}), 800);

      if (s.pieza === 'ram') {
        lograr('ram', 'Dentro hasta el fondo, y las dos palancas cerradas. Así se reasienta.');
        return;
      }
      if (esTornillo) {
        const dosPuestos =
          dondeEsta(puesto, 'tornillo1') === 'tornillo-a' && dondeEsta(puesto, 'tornillo2') === 'tornillo-b';
        if (dosPuestos) lograr('tornillos-puestos', LINEAS.tornillosPuestos);
        else hablar('Uno puesto. Falta el otro.');
        return;
      }
      if (s.pieza === 'corriente') {
        lograr('corriente-puesta', LINEAS.fin);
      }
    },
    [banco, hechos, abierta, hablar, fallar, lograr, timers, revisarTornillos],
  );

  const alSoltar = useCallback(
    (rayo: Rayo) => procesar(resolverSuelta(DEF, banco, { rayo }, interactivo)),
    [banco, interactivo, procesar],
  );

  const alSoltarEn = useCallback(
    (anclaje: string) => procesar(resolverSueltaEn(DEF, banco, anclaje, interactivo)),
    [banco, interactivo, procesar],
  );

  // ── Los mandos del equipo ─────────────────────────────────────────────────

  const alMando = useCallback(
    (id: string) => {
      if (!interactivo) return;

      if (id === 'tierra') {
        if (hechos.includes('estatica')) {
          hablar('Ya la descargaste. Sigue con los tornillos.');
          return;
        }
        if (!pasoPermitido('estatica', hechos)) {
          fallar(LINEAS.antesCorriente);
          return;
        }
        reproducirTono('power');
        lograr('estatica', LINEAS.estatica);
        return;
      }

      // id === 'pestillo'
      if (!abierta) {
        if (!pasoPermitido('abrir', hechos)) {
          fallar(hechos.includes('corriente-fuera') ? LINEAS.antesTornillos : LINEAS.antesCorriente);
          return;
        }
        reproducirTono('open');
        setAbierta(true);
        lograr('abrir', LINEAS.abierto);
        return;
      }

      if (!pasoPermitido('cerrar', hechos)) {
        fallar(LINEAS.faltaDentro);
        return;
      }
      reproducirTono('close');
      setAbierta(false);
      lograr('cerrar', LINEAS.cerrado);
    },
    [interactivo, abierta, hechos, fallar, hablar, lograr],
  );

  const repetir = useCallback(() => {
    timers.limpiar();
    setBanco(BANCO_MANT_INICIAL);
    setHechos([]);
    setAbierta(false);
    setMarcas({});
    setAviso(null);
    lab.reiniciar(() => hablar(LINEAS.inicio));
  }, [lab, timers, hablar]);

  // ── Escena ────────────────────────────────────────────────────────────────

  const estadoAnclaje = useCallback(
    (id: string): EstadoAnclaje => {
      if (marcas[id]) return marcas[id];
      if (id === 'ventilador') return dentro.ventilador ? 'ok' : 'espera';
      if (id === 'disipador') return dentro.disipador ? 'ok' : 'espera';
      return (banco.ocupacion[id] ?? []).length > 0 ? 'ok' : 'espera';
    },
    [marcas, banco, dentro],
  );

  const dibujarPieza = useCallback((pieza: { id: string }) => {
    if (pieza.id === 'corriente') return <group rotation={[0, Math.PI, 0]}><ConectorIEC3D /></group>;
    if (pieza.id === 'ram') return <ModuloRAM3D />;
    if (pieza.id === 'aire') return <LataAire3D />;
    return <Tornillo3D />;
  }, []);

  const letreros = useMemo<LetreroMundo[]>(() => {
    if (lab.terminado) return [];
    const a = anclajeDe(DEF, ANCLA_PASO[pasoActual]);
    if (!a) return [];
    return [
      {
        id: `guia-${pasoActual}`,
        titulo: TITULO_PASO[pasoActual],
        texto: TEXTO_PASO[pasoActual],
        punto: [1.95, 1.15, 0.45] as Punto3,
        ancla: a.punto,
        ancho: 1.3,
        color: '#F5A524',
      },
    ];
  }, [pasoActual, lab.terminado]);

  const mandos = useMemo<MandoDef[]>(
    () => [
      {
        id: 'tierra',
        forma: 'boton',
        punto: [-0.55, -0.85, 0.68],
        mira: [0, 0, 1],
        etiqueta: 'Botón de tierra del chasis',
        encendido: hechos.includes('estatica'),
        activo: interactivo,
        color: '#4ADE80',
      },
      {
        id: 'pestillo',
        forma: 'tirador',
        // El pestillo va en el marco del chasis, no en la tapa: si fuera en la
        // tapa, al abrirse se quedaría flotando donde la tapa ya no está.
        punto: [0.66, 0.3, 0.6],
        mira: [0, 0, 1],
        etiqueta: 'Pestillo de la tapa',
        encendido: abierta,
        activo: interactivo,
        color: '#F5A524',
      },
    ],
    [hechos, abierta, interactivo],
  );

  const modelo = (
    <>
      <Escritorio3D />
      <TorreAbierta3D
        abierta={abierta}
        polvoVentilador={dentro.ventilador ? 0 : 1}
        polvoDisipador={dentro.disipador ? 0 : 1}
        reduceMotion={reduceMotion}
      />
      <Regulador3D encendido={dondeEsta(banco, 'corriente') === 'toma-corriente'} />
    </>
  );

  // ── La cara sin WebGL ─────────────────────────────────────────────────────

  const enMano = banco.tomada;
  const sueltas = DEF.piezas.filter((p) => dondeEsta(banco, p.id) === null && banco.tomada !== p.id);

  const respaldo = (
    <div className="lb3-respaldo">
      <p className="lb3-respaldo-titulo">
        {TITULO_PASO[pasoActual]} · {TEXTO_PASO[pasoActual]}
      </p>
      <p className="lb3-respaldo-nota">
        {enMano
          ? `Llevas en la mano: ${piezaDe(DEF, enMano)?.etiqueta ?? enMano}.`
          : `La tapa está ${abierta ? 'abierta' : 'cerrada'}. Pasos hechos: ${hechos.length} de ${TOTAL_PASOS}.`}
      </p>

      <div className="lb3-respaldo-grupo">
        <span>Mandos del equipo</span>
        <div className="lb3-respaldo-fila">
          <button
            type="button"
            className="lb3-boton"
            aria-pressed={hechos.includes('estatica')}
            aria-label="Tocar el chasis para descargar la estática"
            onClick={() => alMando('tierra')}
          >
            Descargar la estática
          </button>
          <button
            type="button"
            className="lb3-boton"
            aria-pressed={abierta}
            aria-label={abierta ? 'Cerrar la tapa con el pestillo' : 'Abrir la tapa con el pestillo'}
            onClick={() => alMando('pestillo')}
          >
            {abierta ? 'Cerrar la tapa' : 'Abrir la tapa'}
          </button>
        </div>
      </div>

      <div className="lb3-respaldo-grupo">
        <span>Piezas y herramientas</span>
        <div className="lb3-respaldo-fila">
          {DEF.piezas
            .filter((p) => dondeEsta(banco, p.id) !== null)
            .map((p) => (
              <button
                key={p.id}
                type="button"
                className="lb3-boton"
                aria-label={`Sacar ${p.etiqueta} de su sitio`}
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
              aria-label={`Tomar ${p.etiqueta} de la mesa`}
              onClick={() => alTomar(p.id)}
            >
              Tomar {p.etiqueta}
            </button>
          ))}
          {/* Sin esto, quien juega con teclado se queda con la pieza pegada a
              la mano y la clase es imposible de terminar: en la escena hay el
              vacío donde soltarla, y aquí no había nada. Salió jugando el
              recorrido completo por esta cara. */}
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
        <span>Dónde soltarlo</span>
        <div className="lb3-respaldo-fila">
          {DEF.anclajes.map((a) => (
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

  return (
    <SalaBanco3D
      titulo="Manos al mantenimiento"
      pasoEtiqueta="Paso"
      pasoActual={Math.min(hechos.length + 1, TOTAL_PASOS)}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta="Mantenimiento"
      marcadorValor={`${hechos.length}/${TOTAL_PASOS}`}
      bit={linea}
      alSalir={props.alSalir}
      base={
        <p className="gabinete-nota">
          El equipo del salón · dos años sin abrirse: se apaga solo porque el polvo le tapó el aire
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
          paleta={{ acento: '#F5A524', acento2: '#22D3EE' }}
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
              insigniaNombre: 'Manos de mantenimiento',
              insigniaEmoji: '🧰',
              titulo: '¡Mantenimiento terminado!',
              detalle:
                'Desconectaste la corriente, descargaste la estática, abriste sin forzar, soplaste el ventilador y el disipador, reasentaste la RAM y cerraste sin dejar un solo tornillo fuera. El equipo ya no se apaga solo.',
              resumen: [
                { etiqueta: 'Pasos', valor: `${TOTAL_PASOS}` },
                { etiqueta: 'Tornillos', valor: '2/2' },
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

export default LabManosAlMantenimiento;
