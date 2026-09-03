'use client';

import { X } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { CAMPOS, marcaDeCampo } from './datos';
import { refrescarVistaPrevia } from './controles';
import {
  anadirDestinatario,
  cambiar,
  editarDestinatario,
  useCombinacion,
  volverAcorregir,
} from './estado';
import './estilo.css';

/**
 * El diálogo «Destinatarios de combinar correspondencia».
 *
 * Es el mismo cuadro de Word y por eso se pinta como un cuadro de diálogo de
 * Windows y no como una tarjeta de videojuego: caja clara, bordes finos, azul
 * #185ABD y tipografía de sistema. El color pleno de la plataforma vive en la
 * entrada y en el panel del maestro; dentro del programa mandaría otra cosa.
 *
 * ── POR QUÉ LOS ENCABEZADOS LLEVAN LAS COMILLAS DE PICO ─────────────────────
 * La columna no se llama «Nombre» sino «Nombre», con las mismas comillas que
 * tendrá el campo dentro de la carta. Es el único sitio donde el alumno puede
 * ver a la vez las dos mitades de la idea —la columna de la lista y el hueco del
 * documento— y verlas escritas igual es lo que las une.
 *
 * ── EL RENGLÓN DE ABAJO ES LA LECCIÓN ───────────────────────────────────────
 * «9 destinatarios · saldrán 9 cartas» cambia en cuanto se añade a alguien, y
 * antes de haber combinado nada. Es la frase que hace visible que el número de
 * cartas lo decide la lista.
 *
 * El velo no llega hasta el borde derecho: deja a la vista el panel del maestro,
 * que es donde está el encargo que se está haciendo. Un diálogo que tapa la
 * instrucción obliga a cerrarlo para saber qué había que hacer.
 */
export function DialogoDestinatarios() {
  const e = useCombinacion();
  const cuerpo = useRef<HTMLDivElement | null>(null);
  const cuantos = e.destinatarios.length;

  const cerrar = useCallback(() => {
    cambiar({ dialogo: false });
    // Si la vista previa está encendida, la pantalla estaría enseñando el dato
    // viejo de quien se acaba de corregir.
    refrescarVistaPrevia();
    // Y el panel del maestro tiene que volver a mirar: hay un encargo —añadir al
    // alumno nuevo— que se cumple aquí dentro, donde el motor no ve nada.
    volverAcorregir();
  }, []);

  // Al añadir a alguien, el cursor entra en su nombre: es lo siguiente que hay
  // que hacer y sin esto hay que ir a buscar la celda con el ratón.
  useEffect(() => {
    if (!e.dialogo) return;
    const ultimo = cuerpo.current?.querySelector<HTMLInputElement>('.corw-fila:last-child .corw-celda-nombre');
    if (ultimo && ultimo.value === '') ultimo.focus();
  }, [cuantos, e.dialogo]);

  useEffect(() => {
    if (!e.dialogo) return undefined;
    const teclas = (ev: KeyboardEvent) => {
      if (ev.key !== 'Escape') return;
      ev.preventDefault();
      cerrar();
    };
    window.addEventListener('keydown', teclas);
    return () => window.removeEventListener('keydown', teclas);
  }, [cerrar, e.dialogo]);

  if (!e.dialogo) return null;

  return (
    <div
      className="corw-velo"
      role="dialog"
      aria-modal="true"
      aria-label="Destinatarios de combinar correspondencia"
    >
      <div className="corw-caja">
        <header className="corw-cab">
          <h2>Destinatarios de combinar correspondencia</h2>
          <button type="button" className="corw-cerrar" onClick={cerrar} aria-label="Cerrar">
            <X size={15} strokeWidth={2.6} />
          </button>
        </header>

        <p className="corw-intro">
          Ésta es la lista de datos. La carta es una sola: cada renglón de aquí abajo se convierte en una
          carta con sus propios datos. Puedes corregir lo que quieras.
        </p>

        <div className="corw-tabla" ref={cuerpo}>
          <div className="corw-fila es-cabecera">
            <span className="corw-num">#</span>
            {CAMPOS.map((campo) => (
              <span key={campo} className={`corw-col es-${campo.toLowerCase()}`}>
                {marcaDeCampo(campo)}
              </span>
            ))}
          </div>

          {e.destinatarios.map((d, i) => (
            <div
              key={d.id}
              className={`corw-fila${e.previsualizando && i === e.indice ? ' es-actual' : ''}`}
            >
              <span className="corw-num">{i + 1}</span>
              <input
                className="corw-celda corw-celda-nombre"
                value={d.nombre}
                aria-label={`Nombre del destinatario ${i + 1}`}
                onChange={(ev) => editarDestinatario(i, 'Nombre', ev.target.value)}
              />
              <input
                className="corw-celda es-corta"
                value={d.grado}
                aria-label={`Grado del destinatario ${i + 1}`}
                onChange={(ev) => editarDestinatario(i, 'Grado', ev.target.value)}
              />
              <input
                className="corw-celda es-corta"
                value={d.grupo}
                aria-label={`Grupo del destinatario ${i + 1}`}
                onChange={(ev) => editarDestinatario(i, 'Grupo', ev.target.value)}
              />
            </div>
          ))}
        </div>

        <footer className="corw-pie">
          <p className="corw-cuenta">
            <b>{cuantos}</b> destinatarios · saldrán <b>{cuantos}</b> cartas
          </p>
          <div className="corw-botones">
            <button type="button" className="corw-boton" onClick={anadirDestinatario}>
              Nuevo destinatario
            </button>
            <button type="button" className="corw-boton es-principal" onClick={cerrar}>
              Aceptar
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default DialogoDestinatarios;
