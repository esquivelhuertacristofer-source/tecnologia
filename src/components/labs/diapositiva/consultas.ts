/**
 * Reexporta el motor de diapositivas, que ya vive en producción.
 *
 * Este archivo era la prueba de concepto del §39; el 10-ago-2026 su contenido
 * subió a `src/components/office/motor-diapos/` y aquí sólo queda el puente,
 * para que `/banco-diapositiva` siga midiendo **el instrumento de verdad** y no
 * una copia que se quede atrás. Es la lección del §36.5, que costó dos intentos
 * fallidos de arreglo: medir con un instrumento distinto del que se usa es medir
 * otra cosa.
 */

export * from '@/components/office/motor-diapos/consultas';
