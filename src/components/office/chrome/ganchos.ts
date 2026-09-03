'use client';

import { useEffect, useState } from 'react';

/**
 * Los dos ganchos que sostienen la ventana de cualquier programa de la suite.
 *
 * Vivían dentro de `VentanaTextos.tsx` y salieron el 11-ago-2026 al construir
 * Tecnia Diapositivas (§40.6). Ninguno de los dos sabe qué hay dentro de la
 * ventana: uno mide una caja por selector y el otro cuelga un hueco del `<body>`.
 */

/** La caja del objetivo, medida contra su contenedor. */
export interface Caja {
  l: number;
  t: number;
  w: number;
  h: number;
  /** Dónde acaba la cinta, si el objetivo está dentro de ella. */
  pie: number | null;
}

/**
 * Mide el objetivo del señalador contra el DOM VIVO.
 *
 * `revision` es una cadena que cambia cuando algo que afecta a la medida cambia
 * —la pestaña, el paso, el zoom—. Sin ella el efecto no se vuelve a disparar y
 * el aro se queda donde estaba: eso ya pasó una vez y **no se vio en ninguna
 * captura**, porque el efecto corrió con el contenedor vacío y sus dependencias
 * dejaron de cambiar (§36.5 bis H).
 *
 * `selectorCinta` es el contenedor cuyo borde inferior sirve de suelo al rótulo:
 * el rótulo colgaba justo debajo del botón y tapaba la fila siguiente —guiaba
 * hacia unas herramientas y a la vez las escondía—. Se vio mirando la captura,
 * no los números.
 */
export function useCajaDelObjetivo(
  contenedor: React.RefObject<HTMLDivElement | null>,
  selector: string | null,
  revision: string,
  selectorCinta = '.txtw-cinta',
): Caja | null {
  const [caja, setCaja] = useState<Caja | null>(null);
  useEffect(() => {
    let vivo = true;
    const medir = () => {
      if (!vivo) return;
      const cont = contenedor.current;
      const obj = selector ? cont?.querySelector(selector) : null;
      if (!cont || !obj) {
        setCaja(null);
        return;
      }
      const a = cont.getBoundingClientRect();
      const b = obj.getBoundingClientRect();
      const cinta = cont.querySelector(selectorCinta);
      const dentro = cinta?.contains(obj) ?? false;
      const pie = dentro && cinta ? cinta.getBoundingClientRect().bottom - a.top : null;
      setCaja({ l: b.left - a.left, t: b.top - a.top, w: b.width, h: b.height, pie });
    };
    // En el cuadro siguiente: si la pestaña acaba de cambiar, el navegador aún
    // no ha recolocado los grupos y la medida saldría del sitio viejo.
    const id = requestAnimationFrame(medir);
    window.addEventListener('resize', medir);
    return () => {
      vivo = false;
      cancelAnimationFrame(id);
      window.removeEventListener('resize', medir);
    };
  }, [contenedor, selector, revision, selectorCinta]);
  return caja;
}

/**
 * Saca la ventana del árbol de la página y la cuelga del `<body>`.
 *
 * No es un lujo. El anfitrión de actividad envuelve el laboratorio en
 * `.act-frame--inmersivo`, que tiene `position: relative` y `z-index: 5`, y eso
 * **crea un contexto de apilamiento**: dentro de él, un `z-index: 80` sigue
 * valiendo 5 frente al resto de la página, así que la barra del hub —que vale
 * 50— se pintaba encima de la barra de título del programa. Subirle el número a
 * la ventana no arregla nada, porque el techo lo pone el antepasado.
 *
 * De paso queda a salvo de algo peor y más difícil de diagnosticar: si un día un
 * antepasado tuviera `transform` o `filter`, el `position: fixed` dejaría de
 * referirse a la pantalla y la ventana se encogería dentro de la tarjeta sin que
 * nada lo anunciara.
 */
export function useHuecoEnElBody(marca = 'data-tecnia-office'): HTMLElement | null {
  const [hueco, setHueco] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.createElement('div');
    el.setAttribute(marca, '1');
    document.body.appendChild(el);
    const desbordeAntes = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const id = requestAnimationFrame(() => setHueco(el));
    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = desbordeAntes;
      el.remove();
    };
  }, [marca]);

  return hueco;
}

/**
 * Cuándo pulsar algo es un desvío y cuándo no (§37.5, agujero P).
 *
 * La primera versión sólo consideraba desvío cuando el encargo NOMBRABA un
 * control, y eso dejaba fuera el 40 % de los encargos: en los que se resuelven
 * abriendo una pestaña, contestando o confirmando, el alumno podía pulsar
 * cualquier botón de la cinta, ensuciar el documento en silencio y llevarse un
 * tropiezo mudo. Medido: `<u>Kermés de la escuela</u>` apareció subrayado sin
 * que nadie dijera nada.
 *
 * · **Pulsando un control** — desvío es cualquier otro.
 * · **Abriendo pestaña, eligiendo o confirmando** — cualquier control es desvío:
 *   ese encargo no se resuelve pulsando la cinta.
 * · **Tecleando, sin señal ninguna** — no hay desvío. Nadie señala nada, así que
 *   no existe «botón equivocado» y el alumno puede formatear a su gusto.
 */
export function esDesvio(
  paso: { senal?: { control?: string }; logro: { tipo: string; control?: string } } | undefined,
  id: string,
): { desviado: boolean; esperado?: string } {
  if (!paso) return { desviado: false };
  const esperado = paso.senal?.control ?? (paso.logro.tipo === 'control' ? paso.logro.control : undefined);
  if (esperado) {
    /*
     * DEFECTO FUERA DE ESTA FUNCIÓN, corregido aquí (encontrado construyendo
     * `n7-datos-reales`, encargo «el pedido real»): una señal de hoja
     * (`hoja:h2`) dice DÓNDE hay que estar, no la ÚLTIMA pulsación del
     * encargo. Hasta hoy todo encargo con `hoja:hN` se resolvía tecleando o
     * marcando una celda después de cambiar —ninguno de los dos pasa por
     * `pulsar()`—, así que nunca se había notado que un encargo «cambia de
     * hoja y LUEGO pulsa un botón de la cinta» reprobaba ese segundo clic:
     * la señal seguía apuntando a la pestaña de hoja y cualquier botón
     * contaba como desvío, aunque fuera exactamente el que tocaba. Cambiar a
     * OTRA hoja distinta de la pedida sigue avisando —por eso la condición
     * mira si el clic también es una hoja—; lo que deja de avisar es pulsar
     * un control de la cinta después de ya haber cambiado.
     */
    /*
     * `hoja:` sí, `celda:` NO — y la diferencia costó una hipótesis equivocada
     * el 14-ago-2026, así que queda escrita para que nadie la repita.
     *
     * Parecía que las dos eran «señales de sitio» y que ninguna debía bloquear
     * un botón. Se generalizó, y **cuatro clases se pusieron rojas a la vez**:
     * `referencias`, `funcion-si`, `buscarx` y la suite de la ventana. Todas
     * probaban lo mismo a propósito —pulsar `negrita` cuando lo que toca es
     * escribir una fórmula **tiene que avisar**— y todas tenían razón.
     *
     * La diferencia es cuál de las dos se puede *satisfacer*. Pulsar una
     * lengüeta de hoja SÍ pasa por esta función, así que una señal `hoja:h4` se
     * cumple y lo que venga después es el paso siguiente, no un desvío. Marcar
     * una celda NO pasa por aquí, así que `celda:C7` nunca se cumple pulsando:
     * se queda puesta mientras el alumno teclea, y ahí hace justo lo que se le
     * pide —«ahora escribe, no toquetees la cinta»—.
     *
     * O sea que el defecto que parecía de esta función era de autoría: **un
     * encargo que necesita marcar una celda Y pulsar un botón apunta su señal
     * al BOTÓN**, como ya hacen `validacion` y `consolida-y-protege`.
     */
    if (esperado.startsWith('hoja:') && !id.startsWith('hoja:')) return { desviado: false };
    /*
     * UN ENCARGO PUEDE PEDIR VARIOS BOTONES, y hasta hoy no se podía decir.
     *
     * `senal.control` nombraba UNO, así que un encargo que pide tocar tres
     * campos —«ponle nombre a los dos ejes y quita la leyenda»— reprobaba el
     * segundo y el tercero y **la clase se volvía imposible de terminar**. Pasó
     * tres veces con tres caras distintas: `of-excel-buscarx`,
     * `n5-mi-primera-grafica` y `n7-formato-condicional`. Los tres agentes lo
     * esquivaron igual —quitando la señal— y los tres se citaron entre sí como
     * precedente. Eso es una costumbre, no una medida, y una costumbre no avisa
     * al cuarto.
     *
     * Se admite una lista separada por comas. Un control suelto no lleva coma,
     * así que **para Word y PowerPoint no cambia absolutamente nada**: la misma
     * comparación de antes. Y quitar la señal deja de ser el único recurso, que
     * era lo malo — quitarla apaga también el aviso cuando el alumno SÍ se va
     * por donde no debe, y ese aviso es lo que el cliente compró en §37.
     */
    if (esperado.includes(',')) {
      const cualquiera = esperado.split(',').map((c) => c.trim());
      return cualquiera.includes(id) ? { desviado: false } : { desviado: true, esperado: cualquiera[0] };
    }
    return { desviado: id !== esperado, esperado };
  }
  if (paso.logro.tipo === 'pestana' || paso.logro.tipo === 'eleccion' || paso.logro.tipo === 'confirma') {
    return { desviado: true };
  }
  return { desviado: false };
}
