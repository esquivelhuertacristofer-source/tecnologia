'use client';

import { useEffect, useState } from 'react';
import { Lab } from '@/components/activities/office/word/formularios/Lab';
import {
  campoDeLaCelda,
  formulario,
  leerCampos,
} from '@/components/activities/office/word/formularios/formulario';
import { inspeccionar, verificar } from '@/components/office/motor/paginador';

/**
 * Banco de pruebas de `of-word-formularios` — /banco-word/formularios.
 *
 * Monta el laboratorio solo, sin entrada ni anfitrión, y cuelga de la ventana el
 * verificador **de producción**: la sonda mide con el mismo instrumento que usa
 * el motor y no con una copia suya, que es lo que dos veces dio falsos positivos
 * en §36.5. Además expone la lectura de campos y el modo de protección, que es
 * lo único de esta clase que no se ve en el DOM.
 *
 * No está enlazado desde el hub: es instrumento de trabajo.
 */
export default function PaginaBancoFormularios() {
  const [avance, setAvance] = useState(0);
  const [nota, setNota] = useState<string>('—');

  useEffect(() => {
    const flujo = () => document.querySelector<HTMLElement>('.txtw-flujo');
    const doc = () => {
      const v = formulario.vista;
      return v ? v.state.doc : null;
    };
    const w = window as unknown as Record<string, unknown>;

    w.__verificarTextos = () => {
      const f = flujo();
      return f ? verificar(f) : null;
    };
    w.__renglonesTextos = () => {
      const f = flujo();
      return f ? inspeccionar(f) : null;
    };
    // Lo propio de esta clase: qué campos ve el documento y cómo está protegido.
    w.__campos = () => {
      const d = doc();
      return d ? leerCampos(d) : null;
    };
    w.__ficha = () => {
      const d = doc();
      if (!d) return null;
      return [0, 1, 2, 3].map((fila) => campoDeLaCelda(d, fila, 1));
    };
    w.__modo = () => formulario.modo;
  }, []);

  return (
    <>
      <Lab
        config={{}}
        onProgress={setAvance}
        onScore={() => {}}
        onComplete={(r) => setNota(`score ${r.score} · ${r.stars}★ · ${r.errores} tropiezos`)}
      />
      <div
        data-banco="1"
        data-avance={avance.toFixed(3)}
        data-nota={nota}
        style={{ position: 'fixed', bottom: 0, left: 0, width: 1, height: 1, overflow: 'hidden' }}
      />
    </>
  );
}
