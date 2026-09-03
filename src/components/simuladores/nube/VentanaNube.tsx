'use client';

import type { ArchivoNube, EleccionConflicto, EstadoConexion, EstadoSync, EspacioNube, PermisoNube, PersonaNube } from './tiposNube';
import { formatoBytes } from '../sistema';
import './ventanaNube.css';

/**
 * TECNIA NUBE · LA VENTANA
 *
 * Lista de archivos con su estado de sincronización, y el panel de detalle
 * del seleccionado: coautoría en vivo, compartir con personas, enlace
 * público, conflicto y el historial de versiones. **Cero `useState`**: todo
 * entra por parámetro, como `VentanaMuro` y `VentanaExplorador`. Quien tiene
 * el estado es `useNube`.
 *
 * No pinta el marco de programa (barra de título, botón de encender): eso
 * es `VentanaBase`. Una clase monta:
 *
 *     <VentanaBase marca="Tecnia Nube" subtitulo={...}>
 *       <VentanaNube {...propsDeNube} />
 *     </VentanaBase>
 *
 * `formatoBytes` se reutiliza tal cual de `simuladores/sistema/VentanaExplorador`
 * — es la misma unidad de disco, no hace falta una segunda función.
 */

const ETIQUETA_ESTADO: Record<EstadoSync, { icono: string; etiqueta: string }> = {
  subido: { icono: '✔️', etiqueta: 'Sincronizado' },
  subiendo: { icono: '⟳', etiqueta: 'Subiendo…' },
  'solo-local': { icono: '💻', etiqueta: 'Sólo en este equipo' },
  'solo-nube': { icono: '☁️', etiqueta: 'Sólo en la nube' },
  conflicto: { icono: '⚠️', etiqueta: 'En conflicto' },
};

const ETIQUETA_PERMISO: Record<PermisoNube, string> = {
  ver: 'Puede ver',
  comentar: 'Puede comentar',
  editar: 'Puede editar',
};

const PERMISOS: PermisoNube[] = ['ver', 'comentar', 'editar'];

export interface FormularioCompartir {
  /** Con quién se puede compartir todavía — normalmente quien ya tiene
   *  acceso no aparece aquí. */
  candidatos: PersonaNube[];
  personaId: string;
  onCambiarPersona: (id: string) => void;
  permiso: PermisoNube;
  onCambiarPermiso: (permiso: PermisoNube) => void;
  onCompartir: () => void;
}

export interface FormularioEnlace {
  permiso: PermisoNube;
  onCambiarPermiso: (permiso: PermisoNube) => void;
  onGenerar: () => void;
  onRevocar: () => void;
}

export interface VentanaNubeProps {
  archivos: ArchivoNube[];
  seleccionId: string | null;
  onSeleccionar?: (nodoId: string | null) => void;

  conexion: EstadoConexion;
  colaPendiente?: string[];
  espacio?: EspacioNube;
  aviso?: string | null;

  compartirForm?: FormularioCompartir | null;
  onCambiarPermisoAcceso?: (nodoId: string, personaId: string, permiso: PermisoNube) => void;
  onQuitarAcceso?: (nodoId: string, personaId: string) => void;

  enlaceForm?: FormularioEnlace | null;

  onEntrarAEditar?: (nodoId: string) => void;
  onSalirDeEditar?: (nodoId: string) => void;
  onGuardarCambios?: (nodoId: string) => void;
  onResolverConflicto?: (nodoId: string, eleccion: EleccionConflicto) => void;
  onRestaurarVersion?: (nodoId: string, versionId: string) => void;

  onSubir?: (nodoId: string) => void;

  className?: string;
}

function FilaArchivo({
  archivo,
  seleccionado,
  pendiente,
  onSeleccionar,
}: {
  archivo: ArchivoNube;
  seleccionado: boolean;
  pendiente: boolean;
  onSeleccionar?: (nodoId: string) => void;
}) {
  const estado = ETIQUETA_ESTADO[archivo.estado];
  return (
    <button
      type="button"
      className={`tnb-fila${seleccionado ? ' es-seleccionada' : ''}`}
      data-testid="nube-fila"
      data-nodo={archivo.nodo.id}
      data-estado={archivo.estado}
      onClick={() => onSeleccionar?.(archivo.nodo.id)}
    >
      <span className="tnb-fila-nombre">{archivo.nodo.nombre}</span>
      <span className={`tnb-fila-estado es-${archivo.estado}`} data-testid="nube-fila-estado">
        <span aria-hidden="true">{estado.icono}</span> {estado.etiqueta}
      </span>
      {pendiente && <span className="tnb-fila-pendiente">en cola</span>}
    </button>
  );
}

export function VentanaNube({
  archivos,
  seleccionId,
  onSeleccionar,
  conexion,
  colaPendiente = [],
  espacio,
  aviso,
  compartirForm,
  onCambiarPermisoAcceso,
  onQuitarAcceso,
  enlaceForm,
  onEntrarAEditar,
  onSalirDeEditar,
  onGuardarCambios,
  onResolverConflicto,
  onRestaurarVersion,
  onSubir,
  className,
}: VentanaNubeProps) {
  const seleccionado = archivos.find((a) => a.nodo.id === seleccionId) ?? null;

  return (
    <div className={`tnb${className ? ` ${className}` : ''}`} data-testid="nube-app">
      <div className="tnb-barra">
        <span className={`tnb-conexion es-${conexion}`} data-testid="nube-conexion">
          {conexion === 'en-linea' ? '🛜 Conectado' : '🚫 Sin conexión'}
        </span>
        {colaPendiente.length > 0 && (
          <span className="tnb-cola" data-testid="nube-cola">
            ⏳ {colaPendiente.length} en espera de subir
          </span>
        )}
        {espacio && (
          <div className="tnb-espacio" data-testid="nube-espacio">
            <div className="tnb-espacio-barra">
              <span className="tnb-espacio-relleno" style={{ width: `${Math.round(espacio.porcentaje * 100)}%` }} />
            </div>
            <span className="tnb-espacio-texto">
              {formatoBytes(espacio.usados)} usados de {formatoBytes(espacio.capacidad)}
            </span>
          </div>
        )}
      </div>

      {aviso && (
        <p className="tnb-aviso" data-testid="nube-aviso">
          {aviso}
        </p>
      )}

      <div className="tnb-cuerpo">
        <div className="tnb-lista" data-testid="nube-lista">
          {archivos.length === 0 ? (
            <p className="tnb-vacio">No hay archivos todavía.</p>
          ) : (
            archivos.map((a) => (
              <FilaArchivo
                key={a.nodo.id}
                archivo={a}
                seleccionado={a.nodo.id === seleccionId}
                pendiente={colaPendiente.includes(a.nodo.id)}
                onSeleccionar={onSeleccionar}
              />
            ))
          )}
        </div>

        <div className="tnb-detalle" data-testid="nube-detalle">
          {!seleccionado ? (
            <p className="tnb-vacio">Elige un archivo para ver quién lo comparte y su historial.</p>
          ) : (
            <>
              <header className="tnb-detalle-cabecera">
                <h3 className="tnb-detalle-nombre">{seleccionado.nodo.nombre}</h3>
                <span className="tnb-detalle-dueno">De: {seleccionado.propietario.nombre}</span>
                {onSubir && seleccionado.estado !== 'subido' && seleccionado.estado !== 'subiendo' && (
                  <button type="button" className="tnb-boton-subir" onClick={() => onSubir(seleccionado.nodo.id)}>
                    ⬆ Subir
                  </button>
                )}
              </header>

              <section className="tnb-seccion" data-testid="nube-coautoria">
                <h4>Editando ahora</h4>
                {seleccionado.editandoAhora.length === 0 ? (
                  <p className="tnb-vacio-mini">Nadie lo tiene abierto.</p>
                ) : (
                  <ul className="tnb-editores">
                    {seleccionado.editandoAhora.map((p) => (
                      <li key={p.id}>
                        {p.avatar ?? p.nombre.charAt(0)} {p.nombre}
                        {onSalirDeEditar && (
                          <button type="button" onClick={() => onSalirDeEditar(seleccionado.nodo.id)} aria-label={`${p.nombre} deja de editar`}>
                            ✕
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="tnb-acciones-mini">
                  {onEntrarAEditar && (
                    <button type="button" onClick={() => onEntrarAEditar(seleccionado.nodo.id)}>
                      ✏️ Entrar a editar
                    </button>
                  )}
                  {onGuardarCambios && (
                    <button type="button" onClick={() => onGuardarCambios(seleccionado.nodo.id)} data-testid="nube-guardar">
                      💾 Guardar cambios
                    </button>
                  )}
                </div>
              </section>

              {seleccionado.conflicto && (
                <section className="tnb-seccion tnb-conflicto" data-testid="nube-conflicto">
                  <h4>⚠️ Dos versiones distintas — decide cuál se queda</h4>
                  <div className="tnb-conflicto-columnas">
                    <div className="tnb-conflicto-col">
                      <p className="tnb-conflicto-autor">{seleccionado.conflicto.local.autor.nombre}</p>
                      <p className="tnb-conflicto-fecha">{seleccionado.conflicto.local.fecha}</p>
                      {seleccionado.conflicto.local.resumen && <p>{seleccionado.conflicto.local.resumen}</p>}
                      {onResolverConflicto && (
                        <button type="button" onClick={() => onResolverConflicto(seleccionado.nodo.id, 'local')}>
                          Usar esta
                        </button>
                      )}
                    </div>
                    <div className="tnb-conflicto-col">
                      <p className="tnb-conflicto-autor">{seleccionado.conflicto.remota.autor.nombre}</p>
                      <p className="tnb-conflicto-fecha">{seleccionado.conflicto.remota.fecha}</p>
                      {seleccionado.conflicto.remota.resumen && <p>{seleccionado.conflicto.remota.resumen}</p>}
                      {onResolverConflicto && (
                        <button type="button" onClick={() => onResolverConflicto(seleccionado.nodo.id, 'remota')}>
                          Usar esta
                        </button>
                      )}
                    </div>
                  </div>
                  {onResolverConflicto && (
                    <button type="button" className="tnb-conflicto-ambas" onClick={() => onResolverConflicto(seleccionado.nodo.id, 'conservar-ambas')}>
                      Conservar las dos, como copias separadas
                    </button>
                  )}
                </section>
              )}

              <section className="tnb-seccion" data-testid="nube-compartir">
                <h4>Compartir con personas</h4>
                {seleccionado.compartidoCon.length === 0 ? (
                  <p className="tnb-vacio-mini">Nadie más tiene acceso todavía.</p>
                ) : (
                  <ul className="tnb-accesos">
                    {seleccionado.compartidoCon.map((acc) => (
                      <li key={acc.persona.id} data-testid="nube-acceso" data-persona={acc.persona.id}>
                        <span>{acc.persona.nombre}</span>
                        {onCambiarPermisoAcceso ? (
                          <select
                            aria-label={`Permiso de ${acc.persona.nombre}`}
                            value={acc.permiso}
                            onChange={(e) => onCambiarPermisoAcceso(seleccionado.nodo.id, acc.persona.id, e.target.value as PermisoNube)}
                          >
                            {PERMISOS.map((p) => (
                              <option key={p} value={p}>
                                {ETIQUETA_PERMISO[p]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>{ETIQUETA_PERMISO[acc.permiso]}</span>
                        )}
                        {onQuitarAcceso && (
                          <button type="button" aria-label={`Quitar acceso a ${acc.persona.nombre}`} onClick={() => onQuitarAcceso(seleccionado.nodo.id, acc.persona.id)}>
                            Quitar
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {compartirForm && (
                  <form
                    className="tnb-form-compartir"
                    data-testid="nube-form-compartir"
                    onSubmit={(e) => {
                      e.preventDefault();
                      compartirForm.onCompartir();
                    }}
                  >
                    <select
                      aria-label="Con quién compartir"
                      value={compartirForm.personaId}
                      onChange={(e) => compartirForm.onCambiarPersona(e.target.value)}
                    >
                      <option value="">Elige a alguien…</option>
                      {compartirForm.candidatos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Con qué permiso"
                      value={compartirForm.permiso}
                      onChange={(e) => compartirForm.onCambiarPermiso(e.target.value as PermisoNube)}
                    >
                      {PERMISOS.map((p) => (
                        <option key={p} value={p}>
                          {ETIQUETA_PERMISO[p]}
                        </option>
                      ))}
                    </select>
                    <button type="submit" disabled={!compartirForm.personaId}>
                      Compartir
                    </button>
                  </form>
                )}
              </section>

              {(enlaceForm || seleccionado.enlace) && (
                <section className="tnb-seccion" data-testid="nube-enlace">
                  <h4>Enlace público</h4>
                  <p className="tnb-enlace-estado">
                    {seleccionado.enlace?.activo ? `🔗 Activo · ${ETIQUETA_PERMISO[seleccionado.enlace.permiso]}` : '🔒 No hay enlace activo'}
                  </p>
                  {enlaceForm && (
                    <div className="tnb-enlace-acciones">
                      <select
                        aria-label="Permiso del enlace"
                        value={enlaceForm.permiso}
                        onChange={(e) => enlaceForm.onCambiarPermiso(e.target.value as PermisoNube)}
                      >
                        {PERMISOS.map((p) => (
                          <option key={p} value={p}>
                            {ETIQUETA_PERMISO[p]}
                          </option>
                        ))}
                      </select>
                      <button type="button" onClick={enlaceForm.onGenerar} data-testid="nube-enlace-generar">
                        Generar enlace
                      </button>
                      <button type="button" onClick={enlaceForm.onRevocar} data-testid="nube-enlace-revocar" disabled={!seleccionado.enlace?.activo}>
                        Revocar
                      </button>
                    </div>
                  )}
                  {seleccionado.enlace && seleccionado.enlace.abiertoPor.length > 0 && (
                    <div className="tnb-enlace-vistos" data-testid="nube-enlace-vistos">
                      <p>Ya lo abrieron:</p>
                      <ul>
                        {seleccionado.enlace.abiertoPor.map((p) => (
                          <li key={p.id}>{p.nombre}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              )}

              <section className="tnb-seccion" data-testid="nube-historial">
                <h4>Historial de versiones</h4>
                {seleccionado.historial.length === 0 ? (
                  <p className="tnb-vacio-mini">Todavía no hay ninguna versión guardada.</p>
                ) : (
                  <ul className="tnb-historial">
                    {seleccionado.historial
                      .slice()
                      .reverse()
                      .map((v) => {
                        const esActual = v.id === seleccionado.versionActualId;
                        return (
                          <li key={v.id} className={esActual ? 'es-actual' : ''} data-testid="nube-version" data-version={v.id}>
                            <span className="tnb-version-autor">{v.autor.nombre}</span>
                            <span className="tnb-version-fecha">{v.fecha}</span>
                            {v.resumen && <span className="tnb-version-resumen">{v.resumen}</span>}
                            {esActual ? (
                              <span className="tnb-version-actual">Versión actual</span>
                            ) : (
                              onRestaurarVersion && (
                                <button type="button" onClick={() => onRestaurarVersion(seleccionado.nodo.id, v.id)}>
                                  ↩ Restaurar
                                </button>
                              )
                            )}
                          </li>
                        );
                      })}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VentanaNube;
