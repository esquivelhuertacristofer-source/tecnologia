/**
 * Estudio de impacto — telemetría de aprendizaje (§5).
 *
 * EL FORMATO ES EL ESTÁNDAR DE ANÁLISIS Y NO SE NEGOCIA. `resultado` es
 * -1/0/1, el `evento_id` lo genera el cliente y hay dos marcas de tiempo. Las
 * siete plataformas del estudio tienen que guardar lo mismo de la misma
 * manera; en cuanto una se inventa una columna «mejor», deja de poder
 * compararse con las otras, que es justo para lo que existe el formato.
 *
 * LO QUE ESTA PLATAFORMA PUEDE MEDIR HOY, SIN TOCAR LAS 238 ACTIVIDADES:
 * `inicio`, `fin` y `abandono` de cada clase, con su duración. Se capturan en
 * el host —dos archivos— y valen para las 235 clases desde el primer día.
 *
 * LO QUE NO: el detalle POR ÍTEM. Una actividad de Tecnia no es un formulario
 * de reactivos, es un simulador; sólo ella sabe qué es un «ítem» dentro de sí
 * misma y si el alumno acertó. Por eso el contrato gana `onItem`, opcional, y
 * `registrarItem` lo recibe. **Hoy no lo llama ninguna actividad**, así que el
 * flujo por ítem está vacío: la tubería existe y probada, los emisores no.
 * Está en `PENDIENTES_ESTUDIO.md` con esas palabras, porque una tabla vacía
 * que parece llena es peor que una tabla que no existe.
 */

import { VERSION_APP } from './config';
import { encolar } from './cola';
import { registrarError } from './errores';
import type { IdentidadEstudio } from './identidad';

export const TABLA_EVENTOS = 'eventos_aprendizaje';

export type TipoEvento = 'inicio' | 'respuesta' | 'abandono' | 'fin' | 'dificultad_percibida';

/** -1 sin respuesta · 0 incorrecto · 1 correcto. El estándar, tal cual. */
export type Resultado = -1 | 0 | 1;

export interface EventoAprendizaje {
  actividadId: string;
  itemId?: string | null;
  tipo: TipoEvento;
  resultado?: Resultado | null;
  tiempoMs?: number | null;
  intentos?: number | null;
}

/**
 * Encola un evento. No espera, no lanza y no devuelve nada que obligue a
 * quien llama a comprobar si funcionó: la telemetría no puede cambiar el
 * comportamiento de una actividad.
 */
export function registrarEvento(identidad: IdentidadEstudio, e: EventoAprendizaje): void {
  try {
    void encolar(TABLA_EVENTOS, {
      alumno: identidad.estudioId,
      ancla: identidad.ancla,
      actividad_id: e.actividadId,
      item_id: e.itemId ?? null,
      tipo: e.tipo,
      resultado: e.resultado ?? null,
      // Un tiempo negativo es un reloj que cambió de hora, no una respuesta
      // instantánea: se acota igual que en el cuestionario.
      tiempo_ms: e.tiempoMs == null ? null : Math.max(0, Math.round(e.tiempoMs)),
      intentos: e.intentos ?? null,
      ts_cliente: new Date().toISOString(),
      version_app: VERSION_APP,
    }).catch((x) => registrarError('telemetria.encolar', x));
  } catch (x) {
    registrarError('telemetria.registrar', x);
  }
}

/**
 * El evento por ítem que una actividad reporta a través de `onItem`.
 * Azúcar sobre `registrarEvento` para que la actividad no tenga que conocer
 * el nombre de los tipos.
 */
export function registrarItem(
  identidad: IdentidadEstudio,
  actividadId: string,
  item: { itemId: string; acierto: boolean | null; tiempoMs?: number; intentos?: number },
): void {
  registrarEvento(identidad, {
    actividadId,
    itemId: item.itemId,
    tipo: 'respuesta',
    resultado: item.acierto === null ? -1 : item.acierto ? 1 : 0,
    tiempoMs: item.tiempoMs ?? null,
    intentos: item.intentos ?? null,
  });
}

/** Auto-reporte de dificultad al cerrar la actividad (§9). */
export type DificultadPercibida = 'facil' | 'normal' | 'dificil';

const COMO_RESULTADO: Record<DificultadPercibida, Resultado> = {
  facil: 1,
  normal: 0,
  dificil: -1,
};

/**
 * Guarda el «Fácil · Normal · Difícil».
 *
 * Se reutiliza `resultado` en vez de añadir una columna, porque el formato es
 * común a las siete plataformas y añadir columnas lo rompe. La equivalencia va
 * documentada en `README_export.md`: para `tipo = 'dificultad_percibida'`,
 * 1 = fácil, 0 = normal, -1 = difícil. `item_id` guarda además la etiqueta en
 * texto, para que nadie tenga que recordar la tabla de equivalencias al leer
 * un volcado.
 */
export function registrarDificultad(
  identidad: IdentidadEstudio,
  actividadId: string,
  dificultad: DificultadPercibida,
): void {
  registrarEvento(identidad, {
    actividadId,
    itemId: dificultad,
    tipo: 'dificultad_percibida',
    resultado: COMO_RESULTADO[dificultad],
  });
}
