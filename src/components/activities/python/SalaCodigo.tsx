'use client';

import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { VentanaBase } from '@/components/simuladores/VentanaBase';
import {
  VentanaCodigo,
  useCodigo,
  type GuionCodigo,
  type PanelCodigoProps,
  type ResumenCodigo,
  type VelocidadId,
} from '@/components/simuladores/codigo/ventana';
import { ArcadeSala, useBit, type FinalMaquina } from '../n1/arcade/ArcadeSala';
import { formatTiempo, useLabActividad } from '../lib/useLabActividad';
import { PortadaCodigo, type DatosPortadaCodigo } from './PortadaCodigo';
import './salaCodigo.css';

/**
 * LA SALA DE LAS CLASES DE PYTHON — el chasis, no el programa.
 *
 * Es a las clases de Tecnia Código lo que `ArcadeSala` es a los 71
 * laboratorios arcade: **el mueble**. Marquesina con el título y los pips de
 * encargo, marcador, Salir, Bit con voz, portada de objetivos, la ventana del
 * programa dentro del bisel y la pantalla final con insignia. Nada más.
 *
 * ── Por qué se comparte desde la primera clase y no es un motor de plantillas
 *
 * La prueba 3 del canon dice que **un armazón que sabe si el alumno acertó es
 * un motor de plantillas**. Éste no lo sabe y no puede saberlo: la corrección
 * entera vive en el `guion` que trae cada clase, y este archivo no lee ni un
 * `logro`. Lo que reparte es el chrome, que es exactamente lo que el canon
 * manda compartir —y lo que ya estaba copiado a mano en 59 laboratorios
 * cuando se extrajo `useLabActividad`—.
 *
 * Lo que cada clase trae y por lo tanto no se puede parecer a la de al lado:
 * su plantilla, sus candados, su guion completo (encargos, pistas, señales y
 * predicados), su panel propio y sus líneas de Bit.
 *
 * ── Las dos decisiones que no son obvias ───────────────────────────────────
 *
 * **1. La mesa es un componente aparte con `key`.** `useCodigo` guarda el
 * avance del guion —qué encargo va, cuáles están hechos— y su ↺ **no lo
 * borra**, y hace bien: pulsar ↺ a media clase para volver a empezar el
 * programa no puede costarte los seis encargos que llevabas. Pero entonces
 * «Jugar otra vez» de la pantalla final no tenía manera de devolver el guion
 * al principio. La manera correcta en React es no tenerla: se cambia la `key`
 * y el gancho nace otra vez, entero y limpio. Sin tocar el armazón.
 *
 * **2. Romper el programa no resta puntos.** Lo único que resta es fallar una
 * pregunta de elección. En una clase de programación un `TypeError` es el
 * temario, no una falta: tres de estas clases piden **explícitamente**
 * romperlo. El contador de tropiezos del armazón se enseña en la pantalla
 * final como un dato («se rompió 4 veces»), sin signo.
 */

export interface ClaseCodigo {
  /** Id del currículo. Sólo para depurar y para el `data-` de la sala. */
  actividadId: string;
  /** El de la marquesina. */
  titulo: string;
  /** «saludo.py». Sale en la barra de la ventana y en la pestaña del editor. */
  archivo: string;
  insignia: { nombre: string; emoji: string };
  minutos: number;
  portada: DatosPortadaCodigo;
  plantilla: string;
  soloLectura?: number[] | 'todo';
  /** Respuestas preparadas para `input()`. Sin ellas, contesta el alumno. */
  entradas?: string[];
  velocidad?: VelocidadId;
  guion: GuionCodigo;
  panelFijo?: { titulo: string; Cuerpo: ComponentType<PanelCodigoProps> };
  /**
   * El panel de variables que trae el armazón. Se apaga en la clase de tipos,
   * donde el panel propio —la Mesa de tipos— **es** ese mismo panel con la
   * chapa del tipo encima: tenerlos los dos deja la misma lista dos veces, una
   * al lado de la otra, y la de arriba enseñando menos.
   */
  variables?: boolean;
  /** Lo que dice Bit al entrar y al cerrar. Lo de en medio son los `aprendido`. */
  bit: { inicio: string; cierre: string };
  final: { titulo: string; detalle: string };
}

/* ─────────────────────────────── la mesa ─────────────────────────────────── */

interface MesaProps {
  clase: ClaseCodigo;
  onAvance: () => void;
  onTerminado: (r: ResumenCodigo) => void;
  onAprendido: (texto: string) => void;
  onFalloDeEleccion: () => void;
}

function Mesa({ clase, onAvance, onTerminado, onAprendido, onFalloDeEleccion }: MesaProps) {
  const cod = useCodigo({
    plantilla: clase.plantilla,
    soloLectura: clase.soloLectura,
    entradas: clase.entradas,
    velocidad: clase.velocidad,
    guion: clase.guion,
    onAvance,
    onTerminado,
  });

  /* Bit dice lo aprendido en cuanto un encargo se cierra. Una sola vez por
   * encargo: el efecto corre en cada pintado —`encargo` es un objeto nuevo
   * cada vez— y el pestillo es lo que lo hace idempotente. */
  const dichoRef = useRef<string | null>(null);
  useEffect(() => {
    const enc = cod.encargo;
    if (!enc || !enc.hecho || dichoRef.current === enc.paso.id) return;
    dichoRef.current = enc.paso.id;
    onAprendido(enc.paso.aprendido);
  }, [cod.encargo, onAprendido]);

  /* Una opción mal elegida es lo ÚNICO que resta puntos en estas clases. Se
   * apunta una vez por combinación encargo+opción: volver a pulsar la misma
   * opción equivocada no cobra dos veces. */
  const falladasRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const enc = cod.encargo;
    if (!enc || enc.hecho || enc.eleccion === null) return;
    const marca = `${enc.paso.id}:${enc.eleccion}`;
    if (falladasRef.current.has(marca)) return;
    falladasRef.current.add(marca);
    onFalloDeEleccion();
  }, [cod.encargo, onFalloDeEleccion]);

  return (
    <VentanaBase marca="Tecnia Código" subtitulo="Python 3" claseMarco="pyc-marco">
      <VentanaCodigo
        codigo={cod}
        archivo={clase.archivo}
        panelFijo={clase.panelFijo}
        variables={clase.variables ?? true}
      />
    </VentanaBase>
  );
}

/* ─────────────────────────────── la sala ─────────────────────────────────── */

export function SalaCodigo({
  clase,
  alSalir,
  ...props
}: ActivityProps & { clase: ClaseCodigo; alSalir?: () => void }) {
  const total = clase.guion.pasos.length;
  const { pasos, terminado, tiempoFinal, puntaje, restar, avanzar, terminar, reiniciar } =
    useLabActividad(props, total);
  const { linea: bitLinea, hablar } = useBit();

  const [fase, setFase] = useState<'portada' | 'practica'>('portada');
  /* Sube en cada «Jugar otra vez»: es la `key` de la mesa, y con ella el guion
   * vuelve al primer encargo sin que el armazón necesite un «reiniciar todo». */
  const [intento, setIntento] = useState(0);
  const [resumen, setResumen] = useState<ResumenCodigo | null>(null);
  const [puntos, setPuntos] = useState(100);

  const empezar = useCallback(() => {
    setFase('practica');
    hablar(clase.bit.inicio);
  }, [hablar, clase.bit.inicio]);

  const alTerminado = useCallback(
    (r: ResumenCodigo) => {
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
          /* Sin signo negativo y con todas las letras: aquí romper el programa
           * es el oficio, no una falta. */
          { etiqueta: 'Se rompió', valor: `${tropiezos} ${tropiezos === 1 ? 'vez' : 'veces'}` },
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
        <PortadaCodigo
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

export default SalaCodigo;
