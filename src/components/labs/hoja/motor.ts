/**
 * Puente al motor de hojas, que nace ya en su sitio de producción.
 *
 * En el §35 y en el §39 la prueba de concepto se escribió dentro de `labs/` y
 * hubo que subirla después, con el riesgo de que el banco acabara midiendo una
 * copia vieja (la lección de §36.5, que costó dos intentos fallidos de arreglo).
 * Aquí se hace al revés desde el primer día: el motor vive en
 * `src/components/office/motor-hojas/`, que es donde lo pone la anatomía del
 * §45.5, y `labs/hoja/` no tiene más que el banco y este puente.
 *
 * Así, `/banco-hojas` mide **el instrumento de verdad**, y el día que se
 * construya `VentanaHojas` no hay nada que mudar.
 */

export * from '@/components/office/motor-hojas/modelo';
export * from '@/components/office/motor-hojas/consultas';
export * from '@/components/office/motor-hojas/verificar';
export * from '@/components/office/motor-hojas/librosDePrueba';
