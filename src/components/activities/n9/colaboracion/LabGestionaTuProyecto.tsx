'use client';

import { useEffect, useRef, useState } from 'react';
import type { ActivityProps } from '@/types/activity-contract';
import { useLabActividad } from '../../lib/useLabActividad';
import { VentanaBase } from '../../../simuladores/VentanaBase';
import {
  useTablero,
  VentanaTablero,
  type ColumnaTablero,
  type PersonaTablero,
  type TarjetaTablero,
} from '../../../simuladores/tablero';

/**
 * N9 · «Nube y colaboración profesional» — «Gestiona tu proyecto» (doc §56.2).
 *
 * Primera clase sobre `simuladores/tablero/`. El tema del currículo es
 * «gestión de proyectos (tableros, tareas, versiones)»; el armazón cubre
 * tableros y tareas de verdad y no modela versiones de archivo —eso es
 * `of-word-coautoria`—, así que esta clase no lo finge.
 *
 * Cuatro encargos, cada uno una capacidad distinta del armazón:
 * responsables, fechas, mover con flechas (nunca arrastre) y archivar una
 * columna —con su rechazo real cuando todavía tiene tarjetas dentro—. El
 * avance se detecta con un efecto que mira `tablero.*` y un `useRef` de
 * banderas, nunca un aviso disparado dentro de un actualizador de
 * `setState` (COMO-SE-CONSTRUYE.md, «El defecto del aviso duplicado»).
 */

const HOY = '2026-08-20';

const IKER: PersonaTablero = { id: 'iker', nombre: 'Iker', avatar: '🧢' };
const MELISSA: PersonaTablero = { id: 'melissa', nombre: 'Melissa', avatar: '🎬' };
const DIEGO: PersonaTablero = { id: 'diego', nombre: 'Diego', avatar: '📝' };

const COLUMNAS: ColumnaTablero[] = [
  { id: 'col-porhacer', titulo: 'Por hacer' },
  { id: 'col-proceso', titulo: 'En proceso' },
  { id: 'col-terminado', titulo: 'Terminado' },
];

const TARJETAS: TarjetaTablero[] = [
  {
    id: 'c-terminada',
    columnaId: 'col-terminado',
    titulo: 'Bocetar las pantallas de inicio',
    responsable: IKER,
    fecha: '2026-08-15',
    etiquetas: [],
  },
  {
    id: 'c-video',
    columnaId: 'col-porhacer',
    titulo: 'Grabar el video de demostración',
    fecha: '2026-08-23',
    etiquetas: [],
  },
  {
    id: 'c-orto',
    columnaId: 'col-porhacer',
    titulo: 'Revisar la ortografía de las pantallas',
    fecha: '2026-08-21',
    etiquetas: [],
  },
  {
    id: 'c-probar',
    columnaId: 'col-porhacer',
    titulo: 'Probar la app con un compañero de otro salón',
    responsable: IKER,
    etiquetas: [],
  },
  {
    id: 'c-icono',
    columnaId: 'col-porhacer',
    titulo: 'Diseñar el ícono de la app',
    responsable: IKER,
    fecha: '2026-08-24',
    etiquetas: [],
  },
  {
    id: 'c-boton',
    columnaId: 'col-proceso',
    titulo: 'Programar el botón de pedir turno',
    responsable: MELISSA,
    fecha: '2026-08-18',
    etiquetas: [],
  },
  {
    id: 'c-bd',
    columnaId: 'col-proceso',
    titulo: 'Conectar la base de datos de turnos',
    responsable: DIEGO,
    fecha: '2026-08-19',
    etiquetas: [],
  },
];

const ASIGNAR_SUGERIDO: Record<string, PersonaTablero> = {
  'c-video': MELISSA,
  'c-orto': DIEGO,
};

const TOTAL_PASOS = 4;

export function LabGestionaTuProyecto(props: ActivityProps & { alSalir?: () => void }) {
  const { alSalir } = props;
  const labActividad = useLabActividad(props, TOTAL_PASOS, {});
  const tablero = useTablero({ columnas: COLUMNAS, tarjetas: TARJETAS });

  const [avisoColumna, setAvisoColumna] = useState<string | null>(null);

  const avisadosRef = useRef({ responsable: false, fecha: false, mover: false, columna: false });

  useEffect(() => {
    if (!avisadosRef.current.responsable && tablero.sinResponsable.length === 0) {
      avisadosRef.current.responsable = true;
      labActividad.avanzar();
    }
  }, [tablero.sinResponsable.length, labActividad]);

  useEffect(() => {
    if (!avisadosRef.current.fecha && tablero.sinFecha.length === 0) {
      avisadosRef.current.fecha = true;
      labActividad.avanzar();
    }
  }, [tablero.sinFecha.length, labActividad]);

  useEffect(() => {
    const enProceso = tablero.tarjetas.filter((t) => t.columnaId === 'col-proceso').length;
    if (!avisadosRef.current.mover && enProceso === 0) {
      avisadosRef.current.mover = true;
      labActividad.avanzar();
    }
  }, [tablero.tarjetas, labActividad]);

  useEffect(() => {
    const existe = tablero.columnas.some((c) => c.id === 'col-porhacer');
    if (!avisadosRef.current.columna && !existe) {
      avisadosRef.current.columna = true;
      labActividad.avanzar();
    }
  }, [tablero.columnas, labActividad]);

  const archivarPorHacer = (conDestino: boolean) => {
    const resultado = tablero.quitarColumna('col-porhacer', conDestino ? { destino: 'col-proceso' } : undefined);
    setAvisoColumna(resultado.aviso);
  };

  const terminar = () => labActividad.terminar(labActividad.pasos * 20);

  const columnaPorHacerExiste = tablero.columnas.some((c) => c.id === 'col-porhacer');

  if (labActividad.terminado) {
    return (
      <VentanaBase marca="Tecnia Tablero" subtitulo="Gestiona tu proyecto">
        <div className="p-6 sm:p-10 text-center">
          <p className="text-5xl mb-4" aria-hidden="true">
            📋
          </p>
          <h2 className="text-2xl font-extrabold text-white mb-2">Insignia: Nada se queda huérfano</h2>
          <p className="text-slate-300 max-w-xl mx-auto">
            Cada tarea tiene dueño y fecha, lo que ya se acabó está en Terminado, y cerraste el tablero sin perder ni
            una tarjeta en el camino.
          </p>
          {alSalir && (
            <button
              type="button"
              onClick={alSalir}
              className="mt-6 px-6 py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold"
            >
              Salir
            </button>
          )}
        </div>
      </VentanaBase>
    );
  }

  return (
    <VentanaBase marca="Tecnia Tablero" subtitulo="Proyecto: turnos de papelería">
      <div className="p-4 sm:p-6">
        <VentanaTablero
          datos={tablero.datos}
          hoy={HOY}
          onMover={tablero.mover}
          aviso={avisoColumna}
          panel={
            <div className="flex flex-col gap-4 text-sm text-slate-200" data-testid="panel-proyecto">
              <div>
                <p className="font-bold text-white mb-1">Sin responsable</p>
                {tablero.sinResponsable.length === 0 ? (
                  <p className="text-emerald-400">Todas tienen dueño.</p>
                ) : (
                  tablero.sinResponsable.map((t) => (
                    <div key={t.id} className="mb-2">
                      <p>{t.titulo}</p>
                      <button
                        type="button"
                        data-testid={`asignar-${t.id}`}
                        onClick={() => tablero.editar(t.id, { responsable: ASIGNAR_SUGERIDO[t.id] })}
                        className="px-3 py-1 rounded-lg bg-cyan-500 text-slate-950 font-semibold text-xs"
                      >
                        Asignar a {ASIGNAR_SUGERIDO[t.id]?.nombre}
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div>
                <p className="font-bold text-white mb-1">Sin fecha</p>
                {tablero.sinFecha.length === 0 ? (
                  <p className="text-emerald-400">Todas tienen fecha.</p>
                ) : (
                  tablero.sinFecha.map((t) => (
                    <div key={t.id} className="mb-2">
                      <p>{t.titulo}</p>
                      <button
                        type="button"
                        data-testid={`fecha-${t.id}`}
                        onClick={() => tablero.editar(t.id, { fecha: '2026-08-25' })}
                        className="px-3 py-1 rounded-lg bg-cyan-500 text-slate-950 font-semibold text-xs"
                      >
                        Poner fecha: 25 de agosto
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div>
                <p className="font-bold text-white mb-1">Mover a Terminado</p>
                <p className="text-slate-400">Usa las flechas ◀▶ al pie de cada tarjeta.</p>
              </div>

              {columnaPorHacerExiste && (
                <div>
                  <p className="font-bold text-white mb-1">Cerrar el proyecto</p>
                  <button
                    type="button"
                    data-testid="archivar-por-hacer"
                    onClick={() => archivarPorHacer(false)}
                    className="px-3 py-2 rounded-lg bg-rose-500 text-white font-semibold text-xs mb-2"
                  >
                    Archivar «Por hacer»
                  </button>
                  {avisoColumna && (
                    <>
                      <p className="text-amber-300 mb-2">{avisoColumna}</p>
                      <button
                        type="button"
                        data-testid="archivar-con-destino"
                        onClick={() => archivarPorHacer(true)}
                        className="px-3 py-2 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-xs"
                      >
                        Mudar tarjetas y archivar
                      </button>
                    </>
                  )}
                </div>
              )}

              {labActividad.pasos === TOTAL_PASOS && (
                <button
                  type="button"
                  data-testid="cerrar-sesion"
                  onClick={terminar}
                  className="mt-2 px-4 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold"
                >
                  Cerrar sesión
                </button>
              )}
            </div>
          }
        />
      </div>
    </VentanaBase>
  );
}

export default LabGestionaTuProyecto;
