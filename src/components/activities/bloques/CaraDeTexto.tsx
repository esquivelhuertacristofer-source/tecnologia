'use client';

import { useMemo } from 'react';
import { EditorCodigo, colorear } from '@/components/simuladores/codigo/ventana';
import '@/components/simuladores/codigo/ventana/ventanaCodigo.css';
import type { FichaBloque, Programa } from '@/components/simuladores/bloques';
import { traducir } from './traduccionPython';

/**
 * TECNIA BLOQUES · `n6-bloques-vs-codigo` — la cara de texto.
 *
 * Va dentro del hueco `escenario` de `VentanaBloques`: una columna más del
 * cuerpo del editor, no una capa flotante. Monta `EditorCodigo`
 * (`simuladores/codigo/ventana/EditorCodigo.tsx`) en sólo lectura — nunca
 * `VentanaCodigo`, que traería un segundo ▶, un segundo ⏭ y una segunda
 * consola: la doble interfaz que en esta casa está prohibida, y que además
 * destruiría la lección de que el programa es UNO.
 *
 * `EditorCodigo` no trae su propia hoja de estilos puesta — la trae
 * `VentanaCodigo`, que aquí no se usa — así que esta cara importa
 * `ventanaCodigo.css` ella misma, igual que hace `EstudioWeb.tsx` al heredar
 * la misma pieza. Ningún archivo compartido se toca: es un import de su CSS,
 * no una edición.
 *
 * La consola es propia (diez líneas de JSX) y no llega de ningún armazón:
 * `EditorCodigo` no trae consola.
 */

export interface CaraDeTextoProps {
  programa: Programa;
  catalogo: readonly FichaBloque[];
  /** El bloque que el intérprete ilumina ahora mismo. */
  nodoActivo: string | null;
  salida: readonly string[];
  /** El único hueco de vuelta hacia la sala: aquí, sólo para el intento de escribir. */
  accionar: (id: string) => void;
}

export function CaraDeTexto({ programa, catalogo, nodoActivo, salida, accionar }: CaraDeTextoProps) {
  const { texto, lineaDe } = useMemo(() => traducir(programa, catalogo), [programa, catalogo]);
  const lineas = useMemo(() => colorear(texto), [texto]);

  // El riesgo nº 1 del pliego: `nodoActivo` viene del intérprete, que corre
  // sobre una FOTO del árbol tomada al pulsar ▶; `programa` (y por tanto
  // `lineaDe`) es el árbol VIVO. Si el alumno edita mientras corre, el bloque
  // activo puede haber dejado de existir en el árbol vivo. Ante la duda, NO
  // se ilumina nada — nunca un número calculado a ojo ni una línea de otra
  // instrucción.
  const lineaEnCurso = (nodoActivo && lineaDe[nodoActivo]) || 0;

  return (
    <div className="bvc-cara" data-testid="bvc-cara">
      <EditorCodigo
        texto={texto}
        lineas={lineas}
        editable={false}
        onCambiar={() => false}
        onBloqueado={() => accionar('intento-escribir')}
        lineaEnCurso={lineaEnCurso}
        etiqueta="El mismo programa, en Python"
      />
      <div className="bvc-consola" data-testid="bvc-consola">
        <span className="bvc-consola-titulo">Consola</span>
        {salida.length === 0 ? (
          <p className="bvc-consola-vacia">Todavía no corriste el programa.</p>
        ) : (
          <ul className="bvc-consola-lista">
            {salida.map((linea, i) => (
              <li key={i}>{linea}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default CaraDeTexto;
