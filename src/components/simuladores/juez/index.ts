/**
 * El juez · la puerta del paquete.
 *
 * Lo que una clase de bachillerato importa para convertir un ejercicio dictado
 * en un problema de concurso:
 *
 * ```ts
 * const PROBLEMAS: Problema[] = [ { id, titulo, enunciado, firma, casos, pistas } ];
 * const PanelDelJuez = crearPanelJuez({ problemas: PROBLEMAS });
 *
 * const GUION: GuionCodigo = { pasos: PROBLEMAS.map((p) => ({
 *   id: p.id, titulo: p.titulo, instruccion: p.enunciado, pista: p.pistas[0],
 *   logro: { tipo: 'ejecucion', comprueba: (_e, fuente) => aceptado(p.id, fuente) },
 *   aprendido: '…',
 * })) };
 * ```
 *
 * Y lo que **no** hay aquí, por la misma razón que en `datos/index.ts`: ninguna
 * función que sepa resolver un problema. El juez compara la salida del alumno
 * con literales escritos por quien redactó el problema. Una solución de
 * referencia dentro del paquete sería una solución que se sirve al navegador.
 */

export {
  MARCA,
  explicarDiferencia,
  iguales,
  normalizar,
  redactar,
  revisarProblema,
  veredictoDe,
  type Caso,
  type ClaseCaso,
  type Problema,
  type ResultadoCaso,
  type Veredicto,
} from './modelo';
export { PASOS_DEL_JUEZ, juzgar, juzgarCaso, salidaDe } from './juezPython';
export {
  juzgarCasoPrograma,
  juzgarPrograma,
  lineasImpresas,
  revisarProblemaPrograma,
  type CasoPrograma,
  type FichaManual,
  type ProblemaPrograma,
} from './juezProgramas';
export {
  juzgarCasoSql,
  juzgarSql,
  revisarProblemaSql,
  type CasoSql,
  type Celda,
  type ProblemaSql,
} from './juezSql';
export { aceptado, anotar, limpiarRegistro, ultimoVeredicto } from './registro';
export { crearPanelJuez, type OpcionesPanelJuez } from './ventana/PanelJuez';
export { crearPanelJuezSql, type OpcionesPanelJuezSql } from './ventana/PanelJuezSql';
export { FichaDelManual, crearPanelJuezProgramas, type OpcionesPanelJuezProgramas } from './ventana/PanelJuezProgramas';
export { crearTablero, type OpcionesTablero, type ProblemaDeTablero, type PropsDeTablero } from './ventana/TableroJuez';
