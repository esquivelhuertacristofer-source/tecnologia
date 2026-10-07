'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN5Base, type ConfigEntradaN5 } from '../n5/estudio/EntradaN5Base';
import { RUTA_N9_ALGORITMOS_Y_DATOS } from './rutasDatos';
import { LabDatosConPython } from './LabDatosConPython';

/**
 * Entrada de N9 · «Algoritmos y datos», parada 3 de 3 · `n9-datos-con-python`.
 * **3.º de secundaria, 14–15 años** (comprobado en `curriculo.ts`).
 *
 * Plantilla de oro sin tocarla, igual que su hermana de la parada 2
 * (`EntradaBasesDeDatosIniciales.tsx`), con cada cadena escrita para esta
 * clase: no SQL, no ordenamiento — Python real sobre una lista de
 * diccionarios, con un dato que falta de verdad.
 *
 * ── Reescrita el 12-sep-2026 (§68.3) ──────────────────────────────────────────
 *
 * El laboratorio dejó de dictar sus nueve encargos y pasó al juez: seis
 * problemas con diecinueve casos ocultos. La entrada se reescribió con él,
 * porque una entrada que describe la clase anterior miente sin que ninguna
 * prueba se entere.
 *
 * El video se grabó y se publicó el 2-sep-2026: ya existe
 * `public/assets/actividades/n9-datos-con-python/video-explicativo.mp4` y la bandera bajó a
 * `assetsPendientes: false`. OJO si escribes pruebas: con el video puesto, el
 * primer `<button>` del documento ya no es el CTA sino el de la portada, así
 * que no lo busques por posición — búscalo por su texto.
 */

const CONFIG: ConfigEntradaN5 = {
  actividadId: 'n9-datos-con-python',
  laboratorio: LabDatosConPython,
  ruta: RUTA_N9_ALGORITMOS_Y_DATOS,
  parada: 3,
  globo:
    'La app de calificaciones del grupo necesita su reporte. Pero Emilio no ha entregado, y otro alumno entregó en blanco. Hoy escribes tú las funciones, y un juez las prueba con grupos que no has visto.',
  arranqueSub:
    'Abres **reporte_calificaciones.py**. Seis problemas, cada uno con su enunciado, sus ejemplos y **casos ocultos**. Nadie te dice qué teclear: escribes la función, la envías y lees por qué falla la que falla. Y en casi todos hay una trampa: **un dato que falta no es un cero**.',
  stats: [
    { etiqueta: 'Problemas', valor: '6', acento: '#2dd4bf' },
    { etiqueta: 'Casos ocultos', valor: '19', acento: '#f59e0b' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Limpiar, filtrar, agregar y concluir',
  fichas: [
    {
      key: 'lista-de-registros',
      tag: 'La forma del dato',
      numero: 1,
      titulo: 'Una lista de registros',
      detalle:
        'Cada alumno es un diccionario con su nombre y su calificación, y el grupo es una lista de esos diccionarios. Tus seis funciones reciben esa lista y devuelven una sola respuesta: un número, un nombre, una lista o una palabra.',
      acento: { c: '#2dd4bf', deep: '#0f766e' },
    },
    {
      key: 'none-no-es-cero',
      tag: 'El centro de la clase',
      numero: 2,
      titulo: 'None no es un cero',
      detalle:
        'Quien no ha entregado no tiene calificación: None. Quien entregó en blanco sacó cero, y eso sí es un dato. Si tu código los confunde no revienta: da un número que parece bueno y está mal.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
    {
      key: 'entre-cuantos',
      tag: 'Agregar',
      numero: 3,
      titulo: 'Entre cuántos, y de quién',
      detalle:
        'Un promedio depende de entre cuántos divides, y un «más de la mitad» de sobre quiénes lo cuentas. max() te da el número más alto, pero no de quién es: eso lo tiene que recordar tu función.',
      acento: { c: '#facc15', deep: '#b45309' },
    },
    {
      key: 'el-juez',
      tag: 'Quién corrige',
      numero: 4,
      titulo: 'Un juez con grupos que no ves',
      detalle:
        'Corre tus funciones con grupos que no elegiste: con ceros, con empates, con alguien justo en el límite y con nadie que haya entregado. Te dice qué caso falló, pero no sus datos.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el editor de código',
  ctaDetalle:
    'Seis problemas con juez y diecinueve casos ocultos: contar, promediar, filtrar, encontrar al mejor, agrupar por niveles y concluir, y una pregunta de cierre sobre lo que cambia un cero.',
  assetsPendientes: false,
};

export function EntradaDatosConPython(props: ActivityProps) {
  return <EntradaN5Base {...props} entrada={CONFIG} />;
}

export default EntradaDatosConPython;
