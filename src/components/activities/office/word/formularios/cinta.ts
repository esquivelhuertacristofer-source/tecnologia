import { CINTA_AVANZADO, type GrupoCinta, type Pestana } from '../../tecniaTextos';

/**
 * La cinta de `of-word-formularios`: la del grado Avanzado más dos grupos.
 *
 * No se toca `tecniaTextos.tsx`. La clase extiende la cinta de su grado, que es
 * la vía que el motor deja abierta para que las 154 clases se construyan en
 * paralelo sin pisarse el mismo archivo.
 *
 * ── DÓNDE VAN, Y POR QUÉ AHÍ ────────────────────────────────────────────────
 * **«Proteger» va en Revisar**, que es exactamente donde vive «Restringir
 * edición» en el Word de verdad. Aquí no hay nada que decidir: se copia.
 *
 * **«Controles» va en Insertar**, y eso sí es una decisión. En Word 2016 y 365
 * los controles de formulario viven en la pestaña **Programador**, que no
 * aparece hasta que se activa a mano en las opciones —un rodeo que se come diez
 * minutos de clase y no enseña nada del tema—. Y añadir una pestaña nueva
 * exigiría tocar `PestanaId` en el motor, que es de todos. Así que los controles
 * van donde el alumno ya aprendió a buscar «lo que se mete nuevo en el
 * documento» (§36.4, encargo 6): la pestaña Insertar. La deuda queda declarada.
 */

const GRUPO_CONTROLES: GrupoCinta = {
  id: 'formulario',
  nombre: 'Controles',
  controles: [
    { id: 'campo-texto', glifo: 'ab|', etiqueta: 'Campo de texto', corto: 'Texto', ancho: true },
    { id: 'campo-lista', glifo: '▾', etiqueta: 'Lista desplegable', corto: 'Lista', ancho: true },
    { id: 'campo-casilla', glifo: '☑', etiqueta: 'Casilla de verificación', corto: 'Casilla', ancho: true },
  ],
};

const GRUPO_PROTEGER: GrupoCinta = {
  id: 'proteger',
  nombre: 'Proteger',
  controles: [
    { id: 'restringir', glifo: '🔒', etiqueta: 'Restringir edición', corto: 'Restringir', ancho: true },
  ],
};

export const CINTA_FORMULARIOS: Pestana[] = CINTA_AVANZADO.map((p) => {
  if (p.id === 'insertar') return { ...p, grupos: [...p.grupos, GRUPO_CONTROLES] };
  if (p.id === 'revisar') return { ...p, grupos: [...p.grupos, GRUPO_PROTEGER] };
  return p;
});
