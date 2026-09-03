'use client';

import { Lock, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ModoProteccion } from './formulario';

/**
 * El panel «Restringir edición» y el desplegable de la lista (doc §36, clase
 * `of-word-formularios`).
 *
 * Los dos se pintan aquí y se le pasan a la ventana en `accesorios`, que es la
 * puerta que el motor deja para lo que una clase necesita dibujar dentro del
 * programa. Y los dos imitan a Word y no a la plataforma: caja clara, bordes
 * finos de un píxel, azul #185ABD, tipografía de sistema. El color pleno vive en
 * la entrada y en el panel del maestro; aquí manda la fidelidad (§36.2).
 *
 * El panel va **acoplado** al canto derecho del documento, pegado al panel del
 * maestro, como el panel de tareas de Word. No flota encima de la hoja: eso es
 * justo lo que Cristofer rechazó tres veces.
 *
 * Las tres secciones numeradas son las de Word, en su orden y con sus palabras.
 * La primera se ve y no responde —es la parte del temario que no toca hoy— y lo
 * dice como lo dice el motor: «aún no disponible». Esconderla enseñaría un Word
 * que no existe.
 */

export type EleccionRestriccion = 'revision' | 'comentarios' | 'formularios' | 'lectura';

const OPCIONES: { valor: EleccionRestriccion; nombre: string }[] = [
  { valor: 'revision', nombre: 'Marcas de revisión' },
  { valor: 'comentarios', nombre: 'Comentarios' },
  { valor: 'formularios', nombre: 'Rellenar formularios' },
  { valor: 'lectura', nombre: 'Sin cambios (Sólo lectura)' },
];

export function PanelRestringir({
  abierto,
  modo,
  guiar = false,
  onCerrar,
  onAplicar,
  onSuspender,
}: {
  abierto: boolean;
  modo: ModoProteccion;
  /**
   * Señalar dentro del panel lo siguiente que hay que pulsar (§37).
   *
   * El señalador del motor sólo sabe apuntar a la cinta, y el encargo de aplicar
   * la protección se resuelve entero AQUÍ: era el único de los ocho sin nada
   * remarcado. El aro lo pinta el panel, con el mismo naranja del motor para que
   * el alumno lea «esto es lo mismo de siempre» y no un adorno nuevo.
   *
   * Va por dentro y no flotando encima: se dibuja sobre el propio renglón del
   * panel, que es justo lo contrario del botón flotante genérico.
   */
  guiar?: boolean;
  onCerrar: () => void;
  onAplicar: (modo: 'formularios' | 'lectura') => void;
  onSuspender: () => void;
}) {
  const [permitir, setPermitir] = useState(false);
  const [eleccion, setEleccion] = useState<EleccionRestriccion>('formularios');
  const [recado, setRecado] = useState<string | null>(null);

  if (!abierto) return null;

  const protegido = modo !== 'ninguno';

  /*
   * El aro va de un sitio a otro solo, y sólo hay uno a la vez: primero la
   * casilla que abre la sección, después el botón que aplica. Con la ficha ya
   * protegida no señala nada —el encargo siguiente pide MIRAR «Suspender la
   * protección» y expresamente NO pulsarlo, así que remarcarlo sería invitar a
   * deshacer lo que se acaba de hacer—.
   */
  const guiaCasilla = guiar && !protegido && !permitir;
  const guiaAplicar = guiar && !protegido && permitir;

  const aplicar = () => {
    if (!permitir) {
      setRecado('Primero marca «Permitir sólo este tipo de edición en el documento». Sin eso no hay ninguna regla que aplicar.');
      return;
    }
    if (eleccion === 'revision' || eleccion === 'comentarios') {
      setRecado('Esa restricción todavía no está en esta clase. La verás cuando toque revisar y comentar.');
      return;
    }
    setRecado(null);
    onAplicar(eleccion);
  };

  return (
    <aside className="frmw-panel" aria-label="Restringir edición">
      <header className="frmw-panel-cab">
        <span className="frmw-panel-titulo">Restringir edición</span>
        <button type="button" className="frmw-panel-x" onClick={onCerrar} aria-label="Cerrar el panel">
          <X size={14} strokeWidth={2.6} />
        </button>
      </header>

      <div className="frmw-panel-cuerpo">
        <section className="frmw-seccion">
          <h4>1. Restricciones de formato</h4>
          <label className="frmw-linea es-apagada" title="Aún no disponible">
            <input type="checkbox" disabled />
            <span>Limitar el formato a una selección de estilos</span>
          </label>
          <p className="frmw-nota">Aún no disponible en esta clase.</p>
        </section>

        <section className="frmw-seccion">
          <h4>2. Restricciones de edición</h4>
          <label className={`frmw-linea${guiaCasilla ? ' es-guia' : ''}`}>
            <input
              type="checkbox"
              checked={permitir}
              disabled={protegido}
              onChange={(e) => {
                setPermitir(e.target.checked);
                setRecado(null);
              }}
            />
            <span>Permitir sólo este tipo de edición en el documento:</span>
          </label>
          <select
            className="frmw-select"
            aria-label="Tipo de edición permitida"
            value={eleccion}
            disabled={!permitir || protegido}
            onChange={(e) => {
              setEleccion(e.target.value as EleccionRestriccion);
              setRecado(null);
            }}
          >
            {OPCIONES.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.nombre}
              </option>
            ))}
          </select>
        </section>

        <section className="frmw-seccion">
          <h4>3. Comenzar a aplicar</h4>
          {protegido ? (
            <>
              <p className={`frmw-estado${modo === 'lectura' ? ' es-alerta' : ''}`}>
                <Lock size={13} strokeWidth={2.6} aria-hidden="true" />
                {/*
                  En sólo lectura el recado dice además CÓMO se sale, y no es
                  un adorno: el encargo de aplicar la regla no se cumple, pero
                  tampoco cuenta como intento fallido —nadie pulsó un botón de
                  la cinta—, así que la pista del maestro no llega sola y el
                  alumno se quedaba mirando una ficha muerta sin nada que le
                  dijera qué hacer. Medido el 10-ago-2026 eligiendo la regla
                  equivocada a propósito.
                */}
                {modo === 'formularios'
                  ? 'Este documento está protegido. Sólo se pueden rellenar los huecos grises.'
                  : 'Este documento está en sólo lectura: ni siquiera se pueden rellenar los huecos. Suspende la protección y vuelve a aplicarla con «Rellenar formularios».'}
              </p>
              <button type="button" className="frmw-boton es-secundario" onClick={onSuspender}>
                Suspender la protección
              </button>
              <p className="frmw-nota">
                Fíjate: no te pide contraseña. Cualquiera que tenga el archivo puede quitarla.
              </p>
            </>
          ) : (
            <button type="button" className={`frmw-boton${guiaAplicar ? ' es-guia' : ''}`} onClick={aplicar}>
              Sí, aplicar la protección
            </button>
          )}
          {recado && <p className="frmw-recado">{recado}</p>}
        </section>
      </div>
    </aside>
  );
}

/**
 * El desplegable de una lista del formulario.
 *
 * Se abre pegado al hueco, con las coordenadas que da `coordsAtPos`, y no en
 * mitad de la pantalla: un menú que aparece lejos de lo que se pulsó no se lee
 * como el menú de ese hueco. Cierra al elegir, al pulsar fuera y con Escape.
 */
export function ListaDesplegable({
  x,
  y,
  opciones,
  onElegir,
  onCerrar,
}: {
  x: number;
  y: number;
  opciones: string[];
  onElegir: (opcion: string) => void;
  onCerrar: () => void;
}) {
  const caja = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fuera = (e: MouseEvent) => {
      /*
       * Volver a pulsar el MISMO hueco no cuenta como «pulsó fuera». Sin esto,
       * dos clics rápidos sobre la lista la abrían y la cerraban: el segundo lo
       * atiende el desplegable (que lo lee como un clic fuera y se cierra) y el
       * documento (que lo lee como «ábreme»), y ganaba el que corría el último.
       * Medido jugando mal: doble clic sobre «Elige tu equipo ▾» y nada en
       * pantalla. Ahora el clic sobre un hueco de lista es asunto del documento.
       */
      const diana = e.target as HTMLElement | null;
      if (diana?.closest?.('.frmw-campo.es-lista')) return;
      if (!caja.current?.contains(e.target as Node)) onCerrar();
    };
    const teclas = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    // En el cuadro siguiente: el mismo clic que la abrió la cerraría. Y el foco
    // entra en la primera opción, que es lo que permite elegir sin ratón —la
    // lista se abre con Enter desde el hueco, así que si el foco se quedara en
    // el documento no habría manera de llegar hasta aquí—.
    const id = requestAnimationFrame(() => {
      document.addEventListener('mousedown', fuera);
      caja.current?.querySelector<HTMLButtonElement>('.frmw-lista-opcion')?.focus();
    });
    window.addEventListener('keydown', teclas);
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener('mousedown', fuera);
      window.removeEventListener('keydown', teclas);
    };
  }, [onCerrar]);

  return (
    <div
      ref={caja}
      className="frmw-lista"
      role="menu"
      aria-label="Elige una opción"
      style={{ left: Math.round(x), top: Math.round(y + 2) }}
    >
      {opciones.map((o) => (
        <button
          key={o}
          type="button"
          role="menuitem"
          className="frmw-lista-opcion"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onElegir(o)}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
