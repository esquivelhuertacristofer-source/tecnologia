'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { LabFunciones } from './LabFunciones';
import { RUTA_N8_PYTHON_2 } from './rutaN8Python2';

/**
 * Entrada de N8 · U «Programación en texto II» (`n8-python-2`) · parada 2
 * «Funciones».
 *
 * Viene de «Listas y diccionarios» (parada 1), y ésta a su vez de toda
 * N7·U2, así que las fichas dan por sabido que el alumno ya sabe leer un
 * error real —tipo, valor, límite— y no lo repiten: lo dan por hecho al
 * hablar de los dos errores nuevos de esta clase. Registro de secundaria
 * (§30.4): término técnico correcto con su traducción al lado, se explica el
 * porqué y no sólo el qué. Cada cadena está escrita para esta clase.
 *
 * La ficha «pasa-siempre» explica una limitación real del intérprete
 * (`sintaxis.ts`, `sentDef`): este editor no admite valores por defecto en
 * los parámetros. No es una omisión — está descrita en la propia clase
 * (`LabFunciones.tsx`, encargos 6 y 7) y aquí se anticipa para que no
 * sorprenda a mitad del laboratorio.
 *
 * El video se grabó y se publicó el 2-sep-2026:
 * `public/assets/actividades/n8-funciones-python/video-explicativo.mp4` ya
 * existe y `assetsPendientes` bajó a `false`, así que `EntradaN4Base` monta
 * el `<video>` de verdad. OJO si escribes pruebas: con el video puesto, el
 * primer `<button>` del documento ya no es el CTA sino el de la portada, así
 * que no lo busques por posición — búscalo por su texto.
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n8-funciones-python',
  laboratorio: LabFunciones,
  ruta: RUTA_N8_PYTHON_2,
  parada: 2,
  globo:
    'Hasta ahora escribías el programa entero de arriba abajo, cada vez que lo necesitabas. Hoy aprendes a empaquetarlo en una función, para no volver a escribirlo — sólo llamarla.',
  arranqueSub:
    'Abres **funciones.py** y escribes funciones con parámetros, usas return de verdad, y provocas —a propósito— dos errores reales de función.',
  stats: [
    { etiqueta: 'Encargos', valor: '10', acento: '#22d3ee' },
    { etiqueta: 'Errores reales', valor: '2', acento: '#fbbf24' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Cómo se arma una función',
  fichas: [
    {
      key: 'def',
      tag: 'La pieza reutilizable',
      numero: 1,
      titulo: 'def y parámetros',
      detalle:
        '`def nombre(parametros):` empaqueta código para llamarlo cuando quieras. Los **parámetros** son cajas vacías que se llenan con lo que le pases en cada llamada, así que la misma función puede hacer algo distinto cada vez.',
      acento: { c: '#22d3ee', deep: '#0e7490' },
    },
    {
      key: 'return',
      tag: 'La trampa del primer día',
      numero: 2,
      titulo: 'return no es print',
      detalle:
        '`print` sólo muestra algo en pantalla. `return` le **entrega** un valor a quien llamó a la función, para que lo guarde y lo use después. Una función sin return siempre devuelve `None` —aunque haya impreso algo—, y esa confusión es la más común al empezar.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'pasa-siempre',
      tag: 'Lo que aquí no hay atajo',
      numero: 3,
      titulo: 'Aquí no hay valores por defecto',
      detalle:
        'Python real permite `def saluda(nombre="alumno"):` para no tener que pasar ese dato siempre. **Este editor no lo admite**: cada llamada trae todos los argumentos, siempre. Lo vas a provocar tú mismo y vas a leer el error real que lo explica.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'errores',
      tag: 'Dos errores que hay que saber leer',
      numero: 4,
      titulo: 'TypeError y NameError de funciones',
      detalle:
        'Llamar a una función con el **número de argumentos equivocado** es un `TypeError`. Usar fuera de una función una variable que **nació dentro de ella** es un `NameError`: esa variable es local y muere cuando la función termina.',
      acento: { c: '#34d399', deep: '#0f766e' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Abre el editor de código',
  ctaDetalle:
    'Diez encargos: define funciones con def, pásales uno y dos parámetros, usa return y descubre **la trampa de confundirlo con print**, provoca el valor por defecto que aquí no existe, y rompe tu programa a propósito con un TypeError y un NameError de verdad.',
  assetsPendientes: false,
};

export function EntradaFunciones(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaFunciones;
