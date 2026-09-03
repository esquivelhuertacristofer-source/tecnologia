'use client';

import type { CarpetaSO, ElementoPapelera, EspacioDisco, NodoSO, OrdenExplorador } from './tiposSistema';
import { esCarpeta, extensionDe, tamanoDe } from './tiposSistema';
import './ventanaExplorador.css';

/**
 * TECNIA SISTEMA · LA VENTANA DEL EXPLORADOR
 *
 * Un explorador de archivos: ruta, lista/iconos, ordenar, buscar, y las
 * filas con sus acciones pegadas (nada de botones flotantes genéricos).
 * **Cero `useState`**: todo entra por parámetro, como `VentanaMuro` y
 * `VentanaBloques`. Quien tiene el estado es `useSistema`.
 *
 * No pinta el marco de programa (barra de título, botón de encender): eso
 * es `VentanaBase`. Una clase monta:
 *
 *     <VentanaBase marca="Tecnia Archivos" subtitulo={...}>
 *       <VentanaExplorador {...propsDeSistema} />
 *     </VentanaBase>
 *
 * ── El campo de texto de renombrar es controlado por quien monta ─────────
 *
 * Igual que `compositor`/`comentando` en `VentanaMuro`: esta ventana no
 * guarda el texto que se está escribiendo. `renombrando` lo trae la clase
 * (con su propio `useState` del valor del input) y esta ventana sólo pinta
 * el campo cuando `renombrando.id` coincide con la fila.
 */

const EMOJI_POR_EXTENSION: Record<string, string> = {
  txt: '📄', docx: '📄',
  xlsx: '📊', csv: '📊',
  pptx: '📽️',
  jpg: '🖼️', jpeg: '🖼️', png: '🖼️',
  mp3: '🎵',
  mp4: '🎬',
  pdf: '📕',
  zip: '🗜️',
};

function emojiDe(nodo: NodoSO): string {
  if (esCarpeta(nodo)) return '📁';
  const ext = extensionDe(nodo.nombre);
  return EMOJI_POR_EXTENSION[ext] ?? '📦';
}

export function formatoBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const unidades = ['KB', 'MB', 'GB', 'TB'];
  let valor = bytes;
  let i = -1;
  do {
    valor /= 1024;
    i += 1;
  } while (valor >= 1024 && i < unidades.length - 1);
  return `${valor.toFixed(valor >= 10 ? 0 : 1)} ${unidades[i]}`;
}

export interface RenombrandoEnCurso {
  id: string;
  valor: string;
  onCambiar: (v: string) => void;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export interface VentanaExploradorProps {
  ruta: CarpetaSO[];
  listado: NodoSO[];
  vista: 'lista' | 'iconos';
  orden: OrdenExplorador;
  seleccionId: string | null;
  buscando?: boolean;
  terminoBusqueda?: string;
  espacio?: EspacioDisco;
  /** Cuando se da junto con `vistaPapelera`, la ventana pinta la papelera
   *  en vez del listado de la carpeta actual. */
  papelera?: ElementoPapelera[];
  vistaPapelera?: boolean;
  portapapelesId?: string | null;
  aviso?: string | null;
  renombrando?: RenombrandoEnCurso | null;

  onEntrar?: (id: string) => void;
  onAbrir?: (id: string) => void;
  onSubir?: () => void;
  onIrA?: (id: string) => void;
  onSeleccionar?: (id: string | null) => void;
  onCambiarVista?: (v: 'lista' | 'iconos') => void;
  onOrdenarPor?: (campo: OrdenExplorador['campo']) => void;
  onBuscar?: (texto: string) => void;
  onCrearCarpeta?: () => void;
  onIniciarRenombrar?: (id: string) => void;
  onBorrar?: (id: string) => void;
  onCortar?: (id: string) => void;
  onCopiar?: (id: string) => void;
  onPegar?: () => void;
  onRestaurar?: (id: string) => void;
  onVaciarPapelera?: () => void;
  onAbrirPapelera?: () => void;
  onCerrarPapelera?: () => void;
  className?: string;
}

function Fila({
  nodo,
  vista,
  seleccionado,
  cortando,
  renombrando,
  onEntrar,
  onAbrir,
  onSeleccionar,
  onIniciarRenombrar,
  onBorrar,
  onCortar,
  onCopiar,
}: {
  nodo: NodoSO;
  vista: 'lista' | 'iconos';
  seleccionado: boolean;
  cortando: boolean;
  renombrando?: RenombrandoEnCurso | null;
  onEntrar?: (id: string) => void;
  onAbrir?: (id: string) => void;
  onSeleccionar?: (id: string | null) => void;
  onIniciarRenombrar?: (id: string) => void;
  onBorrar?: (id: string) => void;
  onCortar?: (id: string) => void;
  onCopiar?: (id: string) => void;
}) {
  const abrir = () => (esCarpeta(nodo) ? onEntrar?.(nodo.id) : onAbrir?.(nodo.id));
  const enEdicion = renombrando?.id === nodo.id;

  return (
    <div
      className={`tsx-fila tsx-fila-${vista}${seleccionado ? ' es-seleccionada' : ''}${cortando ? ' es-cortando' : ''}`}
      data-testid="explorador-fila"
      data-nodo={nodo.id}
      data-tipo={nodo.tipo}
      role="button"
      tabIndex={0}
      onClick={() => onSeleccionar?.(nodo.id)}
      onDoubleClick={abrir}
    >
      <span className="tsx-fila-emoji" aria-hidden="true">{emojiDe(nodo)}</span>

      {enEdicion && renombrando ? (
        <form
          className="tsx-renombrar"
          onClick={(e) => e.stopPropagation()}
          onSubmit={(e) => {
            e.preventDefault();
            renombrando.onConfirmar();
          }}
        >
          <input
            type="text"
            className="tsx-renombrar-input"
            data-testid="explorador-renombrar-input"
            value={renombrando.valor}
            autoFocus
            aria-label={`Nuevo nombre para ${nodo.nombre}`}
            onChange={(e) => renombrando.onCambiar(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && renombrando.onCancelar()}
          />
          <button type="submit" className="tsx-renombrar-ok" aria-label="Confirmar nombre">✔</button>
          <button type="button" className="tsx-renombrar-cancelar" aria-label="Cancelar" onClick={renombrando.onCancelar}>✕</button>
        </form>
      ) : (
        <span className="tsx-fila-nombre">{nodo.nombre}</span>
      )}

      {vista === 'lista' && !enEdicion && (
        <>
          <span className="tsx-fila-tamano">{esCarpeta(nodo) ? '—' : formatoBytes(tamanoDe(nodo))}</span>
          <span className="tsx-fila-fecha">{nodo.fecha}</span>
        </>
      )}

      {!enEdicion && (
        <span className="tsx-fila-acciones">
          <button type="button" title="Renombrar" aria-label={`Renombrar ${nodo.nombre}`} onClick={(e) => { e.stopPropagation(); onIniciarRenombrar?.(nodo.id); }}>✏️</button>
          <button type="button" title="Cortar" aria-label={`Cortar ${nodo.nombre}`} onClick={(e) => { e.stopPropagation(); onCortar?.(nodo.id); }}>✂️</button>
          <button type="button" title="Copiar" aria-label={`Copiar ${nodo.nombre}`} onClick={(e) => { e.stopPropagation(); onCopiar?.(nodo.id); }}>📋</button>
          <button type="button" title="Borrar" aria-label={`Borrar ${nodo.nombre}`} onClick={(e) => { e.stopPropagation(); onBorrar?.(nodo.id); }}>🗑️</button>
        </span>
      )}
    </div>
  );
}

export function VentanaExplorador({
  ruta,
  listado,
  vista,
  orden,
  seleccionId,
  buscando = false,
  terminoBusqueda = '',
  espacio,
  papelera = [],
  vistaPapelera = false,
  portapapelesId = null,
  aviso,
  renombrando = null,
  onEntrar,
  onAbrir,
  onSubir,
  onIrA,
  onSeleccionar,
  onCambiarVista,
  onOrdenarPor,
  onBuscar,
  onCrearCarpeta,
  onIniciarRenombrar,
  onBorrar,
  onCortar,
  onCopiar,
  onPegar,
  onRestaurar,
  onVaciarPapelera,
  onAbrirPapelera,
  onCerrarPapelera,
  className,
}: VentanaExploradorProps) {
  return (
    <div className={`tsx${className ? ` ${className}` : ''}`} data-testid="explorador-app">
      <div className="tsx-barra-herramientas">
        <button type="button" className="tsx-boton-subir" aria-label="Subir un nivel" disabled={ruta.length <= 1} onClick={onSubir}>⬆</button>

        <nav className="tsx-ruta" aria-label="Ruta actual" data-testid="explorador-ruta">
          {vistaPapelera ? (
            <span className="tsx-ruta-item es-actual">🗑️ Papelera</span>
          ) : (
            ruta.map((c, i) => (
              <span key={c.id} className="tsx-ruta-tramo">
                {i > 0 && <span className="tsx-ruta-separador" aria-hidden="true">›</span>}
                <button type="button" className={`tsx-ruta-item${i === ruta.length - 1 ? ' es-actual' : ''}`} onClick={() => onIrA?.(c.id)}>
                  {c.nombre}
                </button>
              </span>
            ))
          )}
        </nav>

        <input
          type="search"
          className="tsx-buscar"
          data-testid="explorador-buscar"
          placeholder="Buscar por nombre…"
          aria-label="Buscar archivos y carpetas"
          value={terminoBusqueda}
          onChange={(e) => onBuscar?.(e.target.value)}
        />

        <div className="tsx-vista-toggle" role="group" aria-label="Vista">
          <button type="button" className={vista === 'lista' ? 'es-activo' : ''} aria-label="Vista de lista" onClick={() => onCambiarVista?.('lista')}>📋</button>
          <button type="button" className={vista === 'iconos' ? 'es-activo' : ''} aria-label="Vista de iconos" onClick={() => onCambiarVista?.('iconos')}>🔲</button>
        </div>

        <button type="button" className="tsx-boton-nueva" onClick={onCrearCarpeta}>📁+ Nueva carpeta</button>
        <button type="button" className="tsx-boton-pegar" onClick={onPegar}>📌 Pegar</button>

        <button
          type="button"
          className="tsx-boton-papelera"
          data-testid="explorador-boton-papelera"
          onClick={vistaPapelera ? onCerrarPapelera : onAbrirPapelera}
        >
          🗑️ Papelera{papelera.length > 0 ? ` (${papelera.length})` : ''}
        </button>
      </div>

      {!vistaPapelera && (
        <div className="tsx-orden" role="group" aria-label="Ordenar por">
          {(['nombre', 'tamano', 'fecha'] as const).map((campo) => (
            <button
              key={campo}
              type="button"
              className={orden.campo === campo ? 'es-activo' : ''}
              onClick={() => onOrdenarPor?.(campo)}
            >
              {campo === 'nombre' ? 'Nombre' : campo === 'tamano' ? 'Tamaño' : 'Fecha'}
              {orden.campo === campo && (orden.direccion === 'asc' ? ' ▲' : ' ▼')}
            </button>
          ))}
        </div>
      )}

      {aviso && <p className="tsx-aviso" data-testid="explorador-aviso">{aviso}</p>}
      {buscando && <p className="tsx-buscando-nota">Resultados para «{terminoBusqueda}» en todo el disco.</p>}

      <div className={`tsx-listado tsx-listado-${vista}`} data-testid="explorador-listado">
        {vistaPapelera ? (
          papelera.length === 0 ? (
            <p className="tsx-vacio">La papelera está vacía.</p>
          ) : (
            papelera.map((e) => (
              <div key={e.nodo.id} className="tsx-fila-papelera" data-testid="explorador-fila-papelera" data-nodo={e.nodo.id}>
                <span className="tsx-fila-emoji" aria-hidden="true">{emojiDe(e.nodo)}</span>
                <span className="tsx-fila-nombre">{e.nodo.nombre}</span>
                <span className="tsx-fila-fecha">Borrado: {e.fechaBorrado}</span>
                <button type="button" className="tsx-boton-restaurar" onClick={() => onRestaurar?.(e.nodo.id)}>↩ Restaurar</button>
              </div>
            ))
          )
        ) : listado.length === 0 ? (
          <p className="tsx-vacio">{buscando ? 'Nada coincide con la búsqueda.' : 'Esta carpeta está vacía.'}</p>
        ) : (
          listado.map((nodo) => (
            <Fila
              key={nodo.id}
              nodo={nodo}
              vista={vista}
              seleccionado={seleccionId === nodo.id}
              cortando={portapapelesId === nodo.id}
              renombrando={renombrando}
              onEntrar={onEntrar}
              onAbrir={onAbrir}
              onSeleccionar={onSeleccionar}
              onIniciarRenombrar={onIniciarRenombrar}
              onBorrar={onBorrar}
              onCortar={onCortar}
              onCopiar={onCopiar}
            />
          ))
        )}
      </div>

      {vistaPapelera && papelera.length > 0 && (
        <button type="button" className="tsx-boton-vaciar" onClick={onVaciarPapelera}>Vaciar papelera</button>
      )}

      {espacio && (
        <div className="tsx-espacio" data-testid="explorador-espacio">
          <div className="tsx-espacio-barra">
            <span className="tsx-espacio-relleno" style={{ width: `${Math.round(espacio.porcentaje * 100)}%` }} />
          </div>
          <span className="tsx-espacio-texto">{formatoBytes(espacio.usados)} usados de {formatoBytes(espacio.capacidad)}</span>
        </div>
      )}
    </div>
  );
}

export default VentanaExplorador;
