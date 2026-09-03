'use client';

import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import type { Base } from '@/components/simuladores/datos';
import {
  useDatos,
  VentanaDatos,
  type AccionDatos,
  type GuionDatos,
  type HerramientaDatos,
  type PanelDatosProps,
  type ResumenDatos,
} from '@/components/simuladores/datos/ventana';
import { ArcadeSala, useBit, type FinalMaquina } from '../n1/arcade/ArcadeSala';
import { formatTiempo, useLabActividad } from '../lib/useLabActividad';
import { PortadaDatos, type DatosPortadaDatos } from './PortadaDatos';
import './salaDatos.css';

/**
 * LA SALA DE LAS CLASES DE TECNIA DATOS — el chasis, no el guion.
 *
 * Copiada de `python/SalaCodigo.tsx` (comentario de cabecera §38, extendido en
 * §50) y no reinventada: marquesina con pips de encargo, marcador, Salir, Bit
 * con voz, portada de objetivos, la ventana del editor de consultas dentro del
 * bisel y la pantalla final con insignia. **No sabe si el alumno acertó** —la
 * corrección entera vive en el `guion` de cada clase (canon, prueba 3)— así
 * que se comparte desde la primera clase sin ser un motor de plantillas.
 *
 * ── Lo que cambia de la versión de Python ──────────────────────────────────
 *
 * 1. `useDatos`/`VentanaDatos` en vez de `useCodigo`/`VentanaCodigo`: sesión
 *    de SQL (`base`, deshacer/rehacer) en vez de máquina de Python.
 * 2. **Romper una consulta tampoco resta puntos aquí**, por la misma razón
 *    que en Python: provocar el error de SQL a propósito es la mitad del
 *    valor del motor (`errores.ts`, cabecera), y penalizarlo enseñaría al
 *    alumno a evitar justo lo que la clase le pide hacer. Lo único que resta
 *    sigue siendo fallar una pregunta de elección.
 * 3. La mesa cambia de `key` en «Jugar otra vez» por el mismo motivo que en
 *    Python: `useDatos` no borra el avance del guion al pulsar ↺ (y hace
 *    bien — deshacer una consulta no puede costarte los encargos que
 *    llevabas), así que reiniciar la clase entera nace un `useDatos` limpio.
 */

export interface ClaseDatos {
  /** Id del currículo. Sólo para depurar. */
  actividadId: string;
  /** El de la marquesina. */
  titulo: string;
  /** «biblioteca.sql». Sale en la barra de la ventana y en la portada. */
  archivo: string;
  insignia: { nombre: string; emoji: string };
  minutos: number;
  portada: DatosPortadaDatos;
  plantilla: string;
  /** Con qué tablas arranca la sesión. Vacía si la clase empieza desde cero. */
  baseInicial?: Base;
  soloLectura?: number[] | 'todo';
  guion: GuionDatos;
  panelFijo?: { titulo: string; Cuerpo: ComponentType<PanelDatosProps> };
  herramientas?: HerramientaDatos[];
  acciones?: AccionDatos[];
  /** Lo que dice Bit al entrar y al cerrar. Lo de en medio son los `aprendido`. */
  bit: { inicio: string; cierre: string };
  final: { titulo: string; detalle: string };
}

/* ─────────────────────────────── la mesa ─────────────────────────────────── */

interface MesaProps {
  clase: ClaseDatos;
  onAvance: (avance: number) => void;
  onTerminado: (r: ResumenDatos) => void;
  onAprendido: (texto: string) => void;
  onFalloDeEleccion: () => void;
}

function Mesa({ clase, onAvance, onTerminado, onAprendido, onFalloDeEleccion }: MesaProps) {
  const dat = useDatos({
    plantilla: clase.plantilla,
    baseInicial: clase.baseInicial,
    soloLectura: clase.soloLectura,
    guion: clase.guion,
    onAvance,
    onTerminado,
  });

  /* Bit dice lo aprendido en cuanto un encargo se cierra, una sola vez: el
   * pestillo es lo que lo hace idempotente frente a los re-render. */
  const dichoRef = useRef<string | null>(null);
  useEffect(() => {
    const enc = dat.encargo;
    if (!enc || !enc.hecho || dichoRef.current === enc.paso.id) return;
    dichoRef.current = enc.paso.id;
    onAprendido(enc.paso.aprendido);
  }, [dat.encargo, onAprendido]);

  /* Una opción mal elegida es lo ÚNICO que resta puntos en estas clases (ver
   * cabecera). Se apunta una vez por combinación encargo+opción. */
  const falladasRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const enc = dat.encargo;
    if (!enc || enc.hecho || enc.eleccion === null) return;
    const marca = `${enc.paso.id}:${enc.eleccion}`;
    if (falladasRef.current.has(marca)) return;
    falladasRef.current.add(marca);
    onFalloDeEleccion();
  }, [dat.encargo, onFalloDeEleccion]);

  return (
    <VentanaBase marca="Tecnia Datos" subtitulo="SQL" claseMarco="sql-marco">
      <VentanaDatos
        datos={dat}
        archivo={clase.archivo}
        panelFijo={clase.panelFijo}
        herramientas={clase.herramientas}
        acciones={clase.acciones}
      />
    </VentanaBase>
  );
}

/* ─────────────────────────────── la sala ─────────────────────────────────── */

export function SalaDatos({
  clase,
  alSalir,
  ...props
}: ActivityProps & { clase: ClaseDatos; alSalir?: () => void }) {
  const total = clase.guion.pasos.length;
  const { pasos, terminado, tiempoFinal, puntaje, restar, avanzar, terminar, reiniciar } =
    useLabActividad(props, total);
  const { linea: bitLinea, hablar } = useBit();

  const [fase, setFase] = useState<'portada' | 'practica'>('portada');
  /* Sube en cada «Jugar otra vez»: es la `key` de la mesa (ver cabecera). */
  const [intento, setIntento] = useState(0);
  const [resumen, setResumen] = useState<ResumenDatos | null>(null);
  const [puntos, setPuntos] = useState(100);

  const empezar = useCallback(() => {
    setFase('practica');
    hablar(clase.bit.inicio);
  }, [hablar, clase.bit.inicio]);

  const alTerminado = useCallback(
    (r: ResumenDatos) => {
      setResumen(r);
      setPuntos(terminar(r.segundos, () => hablar(clase.bit.cierre)));
    },
    [terminar, hablar, clase.bit.cierre],
  );

  const alFallar = useCallback(() => {
    restar();
    setPuntos(puntaje());
  }, [restar, puntaje]);

  const repetir = useCallback(() => {
    reiniciar(() => {
      setResumen(null);
      setPuntos(100);
      setIntento((i) => i + 1);
      setFase('portada');
    });
  }, [reiniciar]);

  const tropiezos = resumen?.tropiezos ?? 0;
  const final: FinalMaquina | null = terminado
    ? {
        insigniaNombre: clase.insignia.nombre,
        insigniaEmoji: clase.insignia.emoji,
        titulo: clase.final.titulo,
        detalle: clase.final.detalle,
        resumen: [
          { etiqueta: 'Encargos', valor: `${total}` },
          { etiqueta: 'Tiempo', valor: formatTiempo(tiempoFinal) },
          /* Sin signo negativo: aquí una consulta que revienta es el oficio,
           * no una falta (ver cabecera). */
          { etiqueta: 'Se equivocó de consulta', valor: `${tropiezos} ${tropiezos === 1 ? 'vez' : 'veces'}` },
          { etiqueta: 'Puntos', valor: `${puntos}` },
        ],
        alRepetir: repetir,
      }
    : null;

  return (
    <ArcadeSala
      titulo={clase.titulo}
      pasoEtiqueta="Encargo"
      pasoActual={Math.min(pasos + 1, total)}
      pasosTotal={total}
      marcadorEtiqueta="Puntos"
      marcadorValor={String(puntos)}
      bit={fase === 'practica' ? bitLinea : null}
      final={final}
      alSalir={alSalir}
    >
      {fase === 'portada' ? (
        <PortadaDatos
          portada={clase.portada}
          archivo={clase.archivo}
          encargos={total}
          minutos={clase.minutos}
          insignia={clase.insignia}
          onEmpezar={empezar}
        />
      ) : (
        <Mesa
          key={intento}
          clase={clase}
          onAvance={avanzar}
          onTerminado={alTerminado}
          onAprendido={hablar}
          onFalloDeEleccion={alFallar}
        />
      )}
    </ArcadeSala>
  );
}

export default SalaDatos;
