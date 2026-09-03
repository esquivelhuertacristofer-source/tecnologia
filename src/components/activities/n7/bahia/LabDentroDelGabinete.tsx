'use client';

import { useEffect, useRef, useState } from 'react';
import { ActivityProps } from '@/types/activity-contract';
import { reproducirTono } from '../../n1/mision/audio';
import { useBit } from '../../n1/arcade/ArcadeSala';
import { ArcadeSala3D, AvisoRonda3D, useReduceMotion } from '../../arcade3d/ArcadeSala3D';
import { useTemporizadores } from '../../arcade3d/useTemporizadores';
import { MOSTRADOR_Y } from '../../arcade3d/EscenaArcade3D';
import { Consigna3D } from '../../arcade3d/piezas3d';
import { PiezaTomable3D, type EstadoAnclaje } from './bahiaN7';
import {
  BancadaConsola3D,
  BotonEncendido3D,
  CharolaPiezas3D,
  GabineteAbierto3D,
  LamparaBancada3D,
  type AnclajeId,
  type AnclajeVista,
  type PiezaId,
} from './piezasN7U1';

/**
 * Parada 1 de N7 · «Dentro del gabinete» (documento §31.1).
 *
 * Tres rondas sobre la misma torre abierta: se monta el equipo en el orden real
 * de armado (6 pasos), luego la misma geometría se reusa como tablero de
 * diagnóstico (4 síntomas) y al final se enciende y se lee la ficha técnica que
 * el propio alumno acaba de construir.
 *
 * Política de error: el error nunca borra lo ya logrado. La pieza mal colocada
 * regresa a la charola, el anclaje destella en rojo y sólo baja el puntaje.
 */

/** Orden real de armado. El «por qué» de cada paso es el contenido de la ronda. */
const MONTAJE: { n: number; pieza: PiezaId; anclaje: AnclajeId; nombre: string; pista: string }[] = [
  { n: 1, pieza: 'cpu', anclaje: 'zocalo', nombre: 'Zócalo del CPU', pista: 'aquí va el que calcula' },
  { n: 2, pieza: 'disipador', anclaje: 'zocalo', nombre: 'Sobre el CPU', pista: 'encima del CPU' },
  { n: 3, pieza: 'ram', anclaje: 'ram', nombre: 'Ranuras de RAM', pista: 'a presión, dos módulos' },
  { n: 4, pieza: 'ssd', anclaje: 'm2', nombre: 'Ranura M.2', pista: 'la ranurita corta' },
  { n: 5, pieza: 'gpu', anclaje: 'pcie', nombre: 'Ranura PCIe', pista: 'la ranura larga' },
  { n: 6, pieza: 'fuente', anclaje: 'bahia', nombre: 'Bahía de la fuente', pista: 'al final, sin corriente' },
];

const ORDEN_CHAROLA: PiezaId[] = ['cpu', 'disipador', 'ram', 'ssd', 'gpu', 'fuente'];

const PIEZAS: Record<PiezaId, { emoji: string; nombre: string; corto: string; voz: string }> = {
  cpu: {
    emoji: '🧠',
    nombre: 'CPU',
    corto: 'calcula',
    voz: 'El CPU: hace todas las operaciones. Va primero, en el zócalo.',
  },
  disipador: {
    emoji: '❄️',
    nombre: 'Disipador',
    corto: 'enfría',
    voz: 'El disipador: saca el calor del CPU. Va encima de él.',
  },
  ram: {
    emoji: '📊',
    nombre: 'RAM',
    corto: 'memoria',
    voz: 'La RAM: memoria de trabajo, rápida y volátil.',
  },
  ssd: {
    emoji: '💾',
    nombre: 'SSD',
    corto: 'guarda',
    voz: 'El SSD: aquí se quedan tus archivos aunque apagues.',
  },
  gpu: {
    emoji: '🎮',
    nombre: 'Gráfica',
    corto: 'dibuja',
    voz: 'La tarjeta gráfica: dibuja la imagen, cuadro por cuadro.',
  },
  fuente: {
    emoji: '⚡',
    nombre: 'Fuente',
    corto: 'corriente',
    voz: 'La fuente de poder: convierte y reparte la corriente. Va al final.',
  },
};

/** Cómo se llama cada anclaje cuando ya tiene su pieza dentro (ronda 2 y 3). */
const COMPONENTE: Record<AnclajeId, { nombre: string; funcion: string }> = {
  zocalo: { nombre: 'CPU', funcion: 'hace las operaciones' },
  ram: { nombre: 'RAM', funcion: 'memoria de trabajo' },
  m2: { nombre: 'Almacenamiento', funcion: 'aquí se quedan los archivos' },
  pcie: { nombre: 'Tarjeta gráfica', funcion: 'dibuja la imagen' },
  bahia: { nombre: 'Fuente de poder', funcion: 'reparte la corriente' },
};

/** Los cuatro síntomas. Ninguno tiene dos respuestas válidas. */
const SINTOMAS: { anclaje: AnclajeId; texto: string; razon: string }[] = [
  {
    anclaje: 'pcie',
    texto: 'El juego corre a 12 cuadros por segundo y se ve borroso',
    razon: 'La tarjeta gráfica es la que dibuja: si no alcanza, la imagen se traba.',
  },
  {
    anclaje: 'ram',
    texto: 'Con 15 pestañas abiertas todo se arrastra y el disco no para',
    razon: 'Se llenó la memoria de trabajo y empezó a usar el disco como repuesto.',
  },
  {
    anclaje: 'm2',
    texto: 'No puedo guardar el video: dice que no hay espacio',
    razon: 'Se acabó el espacio de almacenamiento, que es donde viven los archivos.',
  },
  {
    anclaje: 'zocalo',
    texto: 'Exportar el video tarda 40 minutos y el ventilador ruge',
    razon: 'Es cálculo puro y sostenido: eso lo hace el procesador, y por eso se calienta.',
  },
];

/** La ficha técnica que imprime la pantalla de la bancada al arrancar. */
const FICHA: { comp: string; valor: string }[] = [
  { comp: 'CPU', valor: '6 núcleos · 3.7 GHz' },
  { comp: 'RAM', valor: '16 GB' },
  { comp: 'SSD', valor: '512 GB' },
  { comp: 'GPU', valor: 'dedicada 8 GB' },
  { comp: 'Fuente', valor: '550 W' },
];

/** Las once líneas de Bit, tal como quedaron escritas en el documento. */
const LINEAS = {
  inicio: 'Bienvenido a la Bahía de Montaje. Esta torre está abierta y sin corriente: se puede trabajar.',
  acierto: 'Bien. Fíjate que cada pieza entra de una sola forma: si hay que forzarla, está al revés.',
  fallo: 'Ahí no va. Mira la ranura: ¿coinciden la muesca y el tamaño?',
  disipador:
    'El disipador va después del CPU y encima de él. Sin disipador, el procesador se apaga solo en segundos.',
  ram: 'La RAM entra a presión hasta que las palancas cierran solas. Y es volátil: al apagar, se borra.',
  fuente: 'La fuente al final, y con el cable fuera de la pared. Esa es la regla que nunca se rompe.',
  diagnostico:
    'Equipo armado. Ahora la parte de técnico: te doy un síntoma y tú me dices qué componente lo explica.',
  diagOk: 'Correcto, y el razonamiento importa más que la respuesta.',
  diagMal: 'No es ese. Vuelve a leer el síntoma: ¿qué componente es el que hace justo eso?',
  encender: 'Momento de la verdad. Presiona el botón de encendido.',
  fin: 'Arrancó. Esa ficha técnica de la pantalla ya la sabes leer completa: la armaste tú.',
};

/** Voz contextual del paso de montaje que acaba de acertarse. */
const VOZ_PASO: Partial<Record<PiezaId, string>> = {
  cpu: LINEAS.acierto,
  disipador: LINEAS.disipador,
  ram: LINEAS.ram,
  fuente: LINEAS.fuente,
};

const TOTAL_PASOS = MONTAJE.length + SINTOMAS.length + 1;

type Fase = 'montaje' | 'diagnostico' | 'arranque';

function formatTiempo(segundos: number) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function LabDentroDelGabinete(props: ActivityProps & { alSalir?: () => void }) {
  const [fase, setFase] = useState<Fase>('montaje');
  const [hechas, setHechas] = useState(0);
  const [sintoma, setSintoma] = useState(0);
  const [resueltos, setResueltos] = useState<AnclajeId[]>([]);
  const [razon, setRazon] = useState<string | null>(null);
  const [estados, setEstados] = useState<Partial<Record<AnclajeId, EstadoAnclaje>>>({});
  const [tomada, setTomada] = useState<PiezaId | null>(null);
  const [encendido, setEncendido] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [terminado, setTerminado] = useState(false);
  const [tiempoFinal, setTiempoFinal] = useState(0);
  const [erroresFinal, setErroresFinal] = useState(0);

  const { linea, hablar } = useBit(LINEAS.inicio);
  const reduceMotion = useReduceMotion();
  const timers = useTemporizadores();

  const sim = useRef({ ocupado: false, errores: 0, inicio: 0 });
  const propsRef = useRef(props);
  const vivo = useRef({ terminado, fase, hechas, sintoma, resueltos, tomada });
  useEffect(() => {
    propsRef.current = props;
    vivo.current = { terminado, fase, hechas, sintoma, resueltos, tomada };
  });
  useEffect(() => {
    sim.current.inicio = Date.now();
  }, []);

  const montadas = MONTAJE.slice(0, hechas).map((m) => m.pieza);
  const pasoActual = MONTAJE[hechas];
  const pasoNumero =
    fase === 'montaje' ? hechas + 1 : fase === 'diagnostico' ? MONTAJE.length + sintoma + 1 : TOTAL_PASOS;

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

  const fallar = (id: AnclajeId, voz: string) => {
    reproducirTono('error');
    sim.current.errores += 1;
    propsRef.current.onScore(puntaje());
    setEstados({ [id]: 'mal' });
    setTomada(null);
    hablar(voz);
    timers.despues(() => setEstados({}), 460);
  };

  /** Toma una pieza de la charola: Bit dice qué es y para qué sirve. */
  const tomar = (id: PiezaId) => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'montaje') return;
    reproducirTono('select');
    setTomada(id);
    hablar(PIEZAS[id].voz);
  };

  /** Ronda 1: soltar (o tocar con una pieza tomada) sobre un anclaje. */
  const montar = (anclaje: AnclajeId, arrastrada: string | null) => {
    if (sim.current.ocupado || vivo.current.terminado) return;
    const pieza = (arrastrada as PiezaId | null) ?? vivo.current.tomada;
    const paso = MONTAJE[vivo.current.hechas];
    if (!paso) return;
    if (!pieza) {
      // Tocar un anclaje sin pieza en la mano no es un error: es una pregunta.
      hablar(`${paso.nombre}: ${paso.pista}.`);
      return;
    }
    if (anclaje !== paso.anclaje || pieza !== paso.pieza) {
      fallar(anclaje, LINEAS.fallo);
      return;
    }

    reproducirTono('correct');
    sim.current.ocupado = true;
    const nuevas = vivo.current.hechas + 1;
    setHechas(nuevas);
    setTomada(null);
    setEstados({ [anclaje]: 'ok' });
    propsRef.current.onProgress(nuevas / TOTAL_PASOS);
    hablar(VOZ_PASO[paso.pieza] ?? LINEAS.acierto);
    timers.despues(() => {
      setEstados({});
      sim.current.ocupado = false;
      if (nuevas === MONTAJE.length) {
        setFase('diagnostico');
        setAviso('Ronda 2 · El diagnóstico');
        hablar(LINEAS.diagnostico);
        timers.despues(() => setAviso(null), 1600);
      }
    }, 520);
  };

  /** Ronda 2: tocar el componente montado que explica el síntoma. */
  const diagnosticar = (anclaje: AnclajeId) => {
    if (sim.current.ocupado || vivo.current.terminado) return;
    const caso = SINTOMAS[vivo.current.sintoma];
    if (!caso) return;
    if (anclaje !== caso.anclaje) {
      fallar(anclaje, LINEAS.diagMal);
      return;
    }

    reproducirTono('correct');
    sim.current.ocupado = true;
    const siguiente = vivo.current.sintoma + 1;
    setResueltos((r) => [...r, anclaje]);
    setEstados({ [anclaje]: 'ok' });
    setRazon(caso.razon);
    propsRef.current.onProgress((MONTAJE.length + siguiente) / TOTAL_PASOS);
    hablar(LINEAS.diagOk);
    timers.despues(() => {
      setEstados({});
      setRazon(null);
      sim.current.ocupado = false;
      if (siguiente === SINTOMAS.length) {
        setFase('arranque');
        setAviso('Ronda 3 · El arranque');
        hablar(LINEAS.encender);
        timers.despues(() => setAviso(null), 1600);
      } else {
        setSintoma(siguiente);
      }
    }, 1700);
  };

  const alAnclaje = (anclaje: AnclajeId, arrastrada: string | null) => {
    if (vivo.current.fase === 'montaje') montar(anclaje, arrastrada);
    else if (vivo.current.fase === 'diagnostico') diagnosticar(anclaje);
  };

  /** Ronda 3: el botón físico del frente de la torre. */
  const encender = () => {
    if (sim.current.ocupado || vivo.current.terminado || vivo.current.fase !== 'arranque' || encendido) return;
    reproducirTono('power');
    sim.current.ocupado = true;
    setEncendido(true);
    propsRef.current.onProgress(1);
    // La ficha técnica se queda impresa un momento para que alcance a leerse
    // completa antes de que la pantalla final tape el laboratorio.
    timers.despues(() => {
      terminar(Math.round((Date.now() - sim.current.inicio) / 1000));
    }, 2800);
  };

  const repetir = () => {
    timers.limpiar();
    sim.current = { ocupado: false, errores: 0, inicio: Date.now() };
    setFase('montaje');
    setHechas(0);
    setSintoma(0);
    setResueltos([]);
    setRazon(null);
    setEstados({});
    setTomada(null);
    setEncendido(false);
    setAviso(null);
    setTerminado(false);
    props.onProgress(0);
    props.onScore(100);
    hablar(LINEAS.inicio);
  };

  /** Estado y rótulo de cada anclaje según la ronda en curso. */
  const anclajes: AnclajeVista[] = (Object.keys(COMPONENTE) as AnclajeId[]).map((id) => {
    const pendiente = MONTAJE.find((m) => m.anclaje === id && m.n > hechas);
    const base: EstadoAnclaje =
      fase === 'montaje'
        ? pasoActual?.anclaje === id
          ? 'listo'
          : pendiente
            ? 'espera'
            : 'ok'
        : fase === 'diagnostico'
          ? resueltos.includes(id)
            ? 'ok'
            : 'espera'
          : 'ok';
    const rotulo =
      fase === 'montaje' && pendiente
        ? { numero: pendiente.n as number | null, nombre: pendiente.nombre, pista: pendiente.pista }
        : { numero: null as number | null, nombre: COMPONENTE[id].nombre, pista: COMPONENTE[id].funcion };
    return {
      id,
      numero: rotulo.numero,
      nombre: rotulo.nombre,
      pista: rotulo.pista,
      estado: estados[id] ?? base,
      activo: fase === 'montaje' ? true : fase === 'diagnostico' ? !resueltos.includes(id) : false,
    };
  });

  const consigna =
    fase === 'montaje'
      ? { titulo: 'Ronda 1 · El montaje', texto: 'Arrastra cada pieza al anclaje que sigue en el orden real de armado.' }
      : fase === 'diagnostico'
        ? { titulo: 'Ronda 2 · El diagnóstico', texto: 'Toca el componente montado que explica el síntoma de la pizarra.' }
        : { titulo: 'Ronda 3 · El arranque', texto: 'Presiona el botón de encendido de la torre y lee su ficha técnica.' };

  const escena = (
    <>
      <Consigna3D titulo={consigna.titulo} texto={consigna.texto} position={[0, MOSTRADOR_Y + 2.45, 0.72]} />

      <LamparaBancada3D />

      <GabineteAbierto3D
        anclajes={anclajes}
        montadas={montadas}
        interactivo={!terminado}
        encendido={encendido}
        reduceMotion={reduceMotion}
        onAnclaje={alAnclaje}
      />

      {fase === 'montaje' && (
        <CharolaPiezas3D
          orden={ORDEN_CHAROLA}
          montadas={montadas}
          encendido={encendido}
          reduceMotion={reduceMotion}
        />
      )}

      {fase === 'arranque' && !encendido && <BotonEncendido3D onEncender={encender} />}

      {fase === 'montaje' && (
        <BancadaConsola3D ancho={5.0} encendida={false}>
          {/* El ancho va explícito, igual que en la pizarra y en la ficha: la fila
              de piezas envuelve, y sin ancho el flex se encoge al mínimo y las
              seis piezas se apilan en una columna que tapa la placa. */}
          <div className="bahia3d-charola" style={{ '--charola-ancho': '660px' } as React.CSSProperties}>
            <p className="bahia3d-charola-tit">Charola antiestática · pieza {hechas + 1} de 6</p>
            <div className="bahia3d-piezas">
              {ORDEN_CHAROLA.map((p) => {
                const puesta = montadas.includes(p);
                return (
                  <PiezaTomable3D
                    key={p}
                    id={p}
                    className={`bahia3d-pieza${puesta ? ' es-puesta' : ''}${tomada === p ? ' es-tomada' : ''}`}
                    ariaLabel={`${PIEZAS[p].nombre}: ${PIEZAS[p].corto}${puesta ? '. Ya montada' : ''}`}
                    disabled={puesta || terminado}
                    onElegir={() => tomar(p)}
                  >
                    <span className="bahia3d-pieza-emoji" aria-hidden="true">
                      {PIEZAS[p].emoji}
                    </span>
                    <span className="bahia3d-pieza-txt">{PIEZAS[p].nombre}</span>
                  </PiezaTomable3D>
                );
              })}
            </div>
          </div>
        </BancadaConsola3D>
      )}

      {fase === 'diagnostico' && (
        <BancadaConsola3D ancho={4.6} encendida>
          <div className="bahia3d-pizarra" style={{ '--pizarra-ancho': '560px' } as React.CSSProperties}>
            <p className="bahia3d-pizarra-tit">
              Síntoma {Math.min(sintoma + 1, SINTOMAS.length)} de {SINTOMAS.length}
            </p>
            {razon ? (
              <p className="bahia3d-pizarra-razon">✔ {razon}</p>
            ) : (
              <p className="bahia3d-pizarra-sintoma">«{SINTOMAS[sintoma]?.texto}»</p>
            )}
          </div>
        </BancadaConsola3D>
      )}

      {fase === 'arranque' && encendido && (
        <BancadaConsola3D ancho={4.6} encendida>
          <div className="bahia3d-ficha" style={{ width: 560 }}>
            <p className="bahia3d-ficha-tit">Ficha técnica del equipo que armaste</p>
            <div className="bahia3d-ficha-filas">
              {FICHA.map((f) => (
                <span key={f.comp} className="bahia3d-ficha-fila">
                  <strong>{f.comp}</strong> {f.valor}
                </span>
              ))}
            </div>
          </div>
        </BancadaConsola3D>
      )}
    </>
  );

  const respaldo = (
    <div className="escena3d-respaldo-lista">
      <p className="escena3d-respaldo-titulo">{consigna.texto}</p>
      {fase === 'montaje' && (
        <div className="escena3d-respaldo-fila">
          {ORDEN_CHAROLA.filter((p) => !montadas.includes(p)).map((p) => (
            <button
              key={p}
              type="button"
              className="pieza3d-boton"
              aria-label={`${PIEZAS[p].nombre}: ${PIEZAS[p].corto}`}
              onClick={() => tomar(p)}
            >
              {PIEZAS[p].emoji} {PIEZAS[p].nombre}
            </button>
          ))}
        </div>
      )}
      {fase === 'diagnostico' && <p className="escena3d-respaldo-titulo">«{SINTOMAS[sintoma]?.texto}»</p>}
      {(fase === 'montaje' || fase === 'diagnostico') && (
        <div className="escena3d-respaldo-fila">
          {anclajes.map((a) => (
            <button
              key={a.id}
              type="button"
              className="pieza3d-boton"
              disabled={!a.activo}
              aria-label={
                a.numero ? `Anclaje ${a.numero}: ${a.nombre}. ${a.pista}` : `${a.nombre}: ${a.pista}`
              }
              onClick={() => alAnclaje(a.id, null)}
            >
              {a.numero ? `${a.numero}. ` : ''}
              {a.nombre}
            </button>
          ))}
        </div>
      )}
      {fase === 'arranque' && (
        <div className="escena3d-respaldo-fila">
          <button
            type="button"
            className="pieza3d-boton"
            disabled={encendido}
            aria-label="Botón de encendido de la torre. Presiónalo para arrancar el equipo"
            onClick={encender}
          >
            ⏻ Encender
          </button>
        </div>
      )}
    </div>
  );

  return (
    <ArcadeSala3D
      titulo="Dentro del gabinete"
      pasoEtiqueta="Paso"
      pasoActual={Math.min(pasoNumero, TOTAL_PASOS)}
      pasosTotal={TOTAL_PASOS}
      marcadorEtiqueta={fase === 'montaje' ? 'Piezas' : fase === 'diagnostico' ? 'Diagnósticos' : 'Arranque'}
      marcadorValor={
        fase === 'montaje'
          ? `${hechas}/${MONTAJE.length}`
          : fase === 'diagnostico'
            ? `${resueltos.length}/${SINTOMAS.length}`
            : encendido
              ? '1/1'
              : '0/1'
      }
      bit={linea}
      paleta={{ acento: '#22D3EE', acento2: '#F5A524' }}
      reduceMotion={reduceMotion}
      escena={escena}
      respaldo={respaldo}
      alSalir={props.alSalir}
      base={
        <p className="gabinete-nota">
          La Bahía de Montaje · torre abierta y sin corriente: aquí se arma el equipo pieza por pieza
        </p>
      }
      final={
        terminado
          ? {
              insigniaNombre: 'Técnico de gabinete',
              insigniaEmoji: '🔧',
              titulo: '¡Equipo armado y encendido!',
              detalle:
                'Montaste los 6 componentes en el orden real, explicaste 4 síntomas y arrancaste la torre: CPU 6 núcleos · 3.7 GHz, RAM 16 GB, SSD 512 GB, GPU dedicada 8 GB, Fuente 550 W.',
              resumen: [
                { etiqueta: 'Piezas', valor: `${MONTAJE.length}` },
                { etiqueta: 'Diagnósticos', valor: `${SINTOMAS.length}` },
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
