'use client';

/**
 * Estudio de impacto — panel de administración (§8 y §12).
 *
 * ES LA PANTALLA DEL PRIMER DÍA. Sin pasar por aquí, ninguna escuela participa
 * y ningún alumno contesta nada: la bandera está apagada por omisión, y el
 * cuestionario de entrada sólo se puede aplicar una vez, el día que el alumno
 * entra. Por eso el interruptor está arriba del todo y el estado se enseña con
 * palabras, no con un icono pequeño.
 *
 * Lo que hay aquí:
 *   · el interruptor de participación por escuela;
 *   · la ventana de fechas del cuestionario de salida;
 *   · la ficha de plantel (§8): conectividad, dispositivos, modalidad, zona;
 *   · el pulso: cuántos datos lleva recogidos el estudio y cuántos errores.
 *
 * Requiere rol `admin` en la base. Quien no lo tenga verá los errores de
 * permiso que devuelva Supabase, que es la frontera de verdad: esta pantalla
 * no duplica la comprobación para que no puedan desincronizarse.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  cambiarParticipacion,
  crearEscuela,
  fijarVentanaSalida,
  guardarContexto,
  listarEscuelas,
  pulsoDelEstudio,
  type ContextoEscuela,
  type EscuelaConContexto,
  type Pulso,
} from '@/lib/estudio/administracion';
import { cuantasPendientes } from '@/lib/estudio/cola';
import { VERSION_AVISO, VERSION_CUESTIONARIOS } from '@/lib/estudio/config';
import './estudio.css';

const CAMPOS: { campo: keyof ContextoEscuela; etiqueta: string; opciones: string[] }[] = [
  { campo: 'conectividad', etiqueta: 'Conectividad', opciones: ['buena', 'intermitente', 'sin_internet'] },
  { campo: 'dispositivos', etiqueta: 'Dispositivos', opciones: ['uno_por_alumno', 'compartidos', 'solo_docente'] },
  { campo: 'modalidad', etiqueta: 'Modalidad', opciones: ['presencial', 'mixta', 'a_distancia'] },
  { campo: 'zona', etiqueta: 'Zona', opciones: ['urbana', 'rural'] },
];

const BONITO: Record<string, string> = {
  buena: 'Buena',
  intermitente: 'Intermitente',
  sin_internet: 'Sin internet',
  uno_por_alumno: 'Uno por alumno',
  compartidos: 'Compartidos',
  solo_docente: 'Sólo del docente',
  presencial: 'Presencial',
  mixta: 'Mixta',
  a_distancia: 'A distancia',
  urbana: 'Urbana',
  rural: 'Rural',
};

export default function PanelEstudio() {
  const [escuelas, setEscuelas] = useState<EscuelaConContexto[]>([]);
  const [pulso, setPulso] = useState<Pulso | null>(null);
  const [enCola, setEnCola] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [nuevaId, setNuevaId] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setEscuelas(await listarEscuelas());
      setPulso(await pulsoDelEstudio());
      setEnCola(await cuantasPendientes());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo leer el estudio.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void recargar(); }, [recargar]);

  const conError = useCallback(async (tarea: () => Promise<void>) => {
    setError(null);
    try {
      await tarea();
      await recargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
    }
  }, [recargar]);

  const participantes = escuelas.filter((e) => e.participa).length;

  return (
    <div className="pe">
      <header className="pe-cabecera">
        <p className="pe-kicker">Estudio de impacto</p>
        <h1 className="pe-titulo">Escuelas y medición</h1>
        <p className="pe-sub">
          Aviso de privacidad <code>{VERSION_AVISO}</code> · reactivos{' '}
          <code>{VERSION_CUESTIONARIOS}</code>
        </p>
      </header>

      {error && <p className="pe-error" role="alert">⚠ {error}</p>}

      {/*
        * EL AVISO QUE IMPORTA. Sin escuelas participantes no se está midiendo
        * nada, y eso desde fuera se ve exactamente igual que si todo fuera
        * bien: la plataforma funciona, los alumnos juegan y no queda ni un
        * dato. Se dice con todas las letras.
        */}
      {!cargando && participantes === 0 && (
        <p className="pe-alarma" role="status">
          Ninguna escuela participa todavía: <strong>no se está midiendo a nadie.</strong>{' '}
          El cuestionario de entrada sólo se puede aplicar una vez, el día que el alumno entra
          por primera vez. Enciende abajo la escuela antes de que lleguen los alumnos.
        </p>
      )}

      {pulso && (
        <section className="pe-pulso" aria-label="Datos recogidos">
          <Dato n={pulso.aplicadosEmpezados} etiqueta="cuestionarios empezados" />
          <Dato n={pulso.aplicadosCompletados} etiqueta="terminados" />
          <Dato n={pulso.respuestas} etiqueta="respuestas" />
          <Dato n={pulso.eventos} etiqueta="eventos" />
          <Dato n={pulso.errores} etiqueta="errores" alarma={pulso.errores > 0} />
          <Dato n={enCola ?? 0} etiqueta="sin enviar en este equipo" alarma={(enCola ?? 0) > 50} />
        </section>
      )}

      <section className="pe-alta">
        <h2 className="pe-h2">Añadir una escuela</h2>
        <div className="pe-alta-campos">
          <input
            className="pe-input"
            placeholder="clave corta, p. ej. sec-14-toluca"
            value={nuevaId}
            onChange={(ev) => setNuevaId(ev.target.value)}
          />
          <input
            className="pe-input"
            placeholder="Nombre completo del plantel"
            value={nuevoNombre}
            onChange={(ev) => setNuevoNombre(ev.target.value)}
          />
          <button
            type="button"
            className="pe-boton"
            disabled={!nuevaId.trim() || !nuevoNombre.trim()}
            onClick={() => conError(async () => {
              await crearEscuela(nuevaId.trim(), nuevoNombre.trim());
              setNuevaId('');
              setNuevoNombre('');
            })}
          >
            Añadir
          </button>
        </div>
      </section>

      {cargando ? (
        <p className="pe-sub">Cargando…</p>
      ) : (
        escuelas.map((e) => (
          <FichaEscuela key={e.id} escuela={e} conError={conError} />
        ))
      )}

      {!cargando && escuelas.length === 0 && (
        <p className="pe-sub">Todavía no hay escuelas registradas.</p>
      )}
    </div>
  );
}

function Dato({ n, etiqueta, alarma }: { n: number; etiqueta: string; alarma?: boolean }) {
  return (
    <div className={`pe-dato${alarma ? ' pe-dato-alarma' : ''}`}>
      <span className="pe-dato-n">{n.toLocaleString('es-MX')}</span>
      <span className="pe-dato-etiqueta">{etiqueta}</span>
    </div>
  );
}

function FichaEscuela({
  escuela,
  conError,
}: {
  escuela: EscuelaConContexto;
  conError: (t: () => Promise<void>) => Promise<void>;
}) {
  const [desde, setDesde] = useState(escuela.salida_desde ?? '');
  const [hasta, setHasta] = useState(escuela.salida_hasta ?? '');
  const [ctx, setCtx] = useState<ContextoEscuela>(
    escuela.contexto ?? {
      escuela_id: escuela.id,
      conectividad: null,
      dispositivos: null,
      modalidad: null,
      zona: null,
      notas: null,
    },
  );

  return (
    <section className={`pe-escuela${escuela.participa ? ' pe-escuela-activa' : ''}`}>
      <div className="pe-escuela-cabecera">
        <div>
          <h2 className="pe-h2">{escuela.nombre}</h2>
          <code className="pe-id">{escuela.id}</code>
        </div>
        <button
          type="button"
          className={`pe-interruptor${escuela.participa ? ' pe-interruptor-on' : ''}`}
          aria-pressed={escuela.participa}
          onClick={() => conError(() => cambiarParticipacion(escuela.id, !escuela.participa))}
        >
          {escuela.participa ? 'Participa en el estudio' : 'No participa'}
        </button>
      </div>

      <div className="pe-bloque">
        <h3 className="pe-h3">Ventana del cuestionario de salida</h3>
        <p className="pe-ayuda">
          Fuera de estas fechas, el cuestionario de salida no se le muestra a nadie.
          Vaciar las dos lo cierra.
        </p>
        <div className="pe-fechas">
          <label className="pe-campo">
            <span>Desde</span>
            <input className="pe-input" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </label>
          <label className="pe-campo">
            <span>Hasta</span>
            <input className="pe-input" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </label>
          <button
            type="button"
            className="pe-boton"
            onClick={() => conError(() => fijarVentanaSalida(escuela.id, desde || null, hasta || null))}
          >
            Guardar fechas
          </button>
        </div>
      </div>

      <div className="pe-bloque">
        <h3 className="pe-h3">Ficha del plantel</h3>
        <p className="pe-ayuda">
          Se captura una vez. Explica el resultado: una escuela sin internet y con un equipo
          para todo el grupo no se puede comparar con una de uno por alumno.
        </p>

        {CAMPOS.map(({ campo, etiqueta, opciones }) => (
          <fieldset className="pe-opciones" key={campo}>
            <legend>{etiqueta}</legend>
            {opciones.map((o) => (
              <button
                key={o}
                type="button"
                className={`pe-pastilla${ctx[campo] === o ? ' pe-pastilla-on' : ''}`}
                aria-pressed={ctx[campo] === o}
                onClick={() => setCtx({ ...ctx, [campo]: ctx[campo] === o ? null : o })}
              >
                {BONITO[o] ?? o}
              </button>
            ))}
          </fieldset>
        ))}

        <label className="pe-campo">
          <span>Notas</span>
          <textarea
            className="pe-input pe-textarea"
            rows={3}
            value={ctx.notas ?? ''}
            onChange={(e) => setCtx({ ...ctx, notas: e.target.value })}
          />
        </label>

        <button type="button" className="pe-boton" onClick={() => conError(() => guardarContexto(ctx))}>
          Guardar ficha
        </button>
      </div>
    </section>
  );
}
