'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4, type PasoRuta } from '../../n4/estudio/EntradaN4Base';
import { getUnidad } from '@/data/curriculo';
import { LabProblemasDeConcurso } from './LabProblemasDeConcurso';

/**
 * Entrada de `n10-problemas-de-concurso` — N10 · «Programación aplicada»,
 * parada 2 de 3. **Bachillerato, 15–18 años** — mismo tono profesional sin
 * diminutivos que `EntradaPythonIntermedio.tsx`.
 *
 * Ruta derivada de `getUnidad('n10-programacion-aplicada')`, nunca a mano:
 * esta parada y la 3 (`n10-analisis-con-codigo`) se construyeron en paralelo,
 * cada una en su propia carpeta, sin un archivo de rutas compartido que las
 * dos sesiones tuvieran que tocar a la vez.
 *
 * `EntradaN4Base` porque es la plantilla que ya usa el resto de N10 sobre
 * este mismo armazón (`n10-python-intermedio`, `n10-consultas-sql`,
 * `n10-ia-copiloto`), no un componente nuevo.
 *
 * REESCRITA EL 12-sep-2026 con la clase nueva sobre **el juez** (§68): seis
 * problemas juzgados por casos —nueve visibles y veinte ocultos—, tres pistas
 * en escalera por problema y un encargo final en el que el alumno escribe el
 * caso de prueba que desenmascara una solución rota. La versión anterior
 * dictaba el código dentro del enunciado.
 *
 * El video se regrabó el 12-sep-2026 con la clase del juez (33 escenas, 5:42,
 * 18 imágenes) y la bandera volvió a `false`. El anterior explicaba los cinco
 * problemas dictados de la versión vieja: enseñaba otra clase
 * (`video-contra-laboratorio`).
 */

const RUTA_N10_PROGRAMACION: PasoRuta[] = (getUnidad('n10-programacion-aplicada')?.actividades ?? []).map((a) => ({
  id: a.id,
  titulo: a.titulo,
}));

const ACTIVIDAD = 'n10-problemas-de-concurso';

const CONFIG: ConfigEntradaN4 = {
  actividadId: ACTIVIDAD,
  laboratorio: LabProblemasDeConcurso,
  ruta: RUTA_N10_PROGRAMACION,
  parada: Math.max(1, RUTA_N10_PROGRAMACION.findIndex((p) => p.id === ACTIVIDAD) + 1),
  globo:
    'TecniMarket abre su torneo interno de programación. Seis problemas y un juez: le mandas tu programa y lo corre con datos que tú no has visto. Que funcione con el ejemplo no significa nada — eso lo descubres en el primer envío.',
  arranqueSub:
    'Hoy nadie te dice qué teclear. Cada problema trae su descripción, un par de ejemplos y un juez que llama a tu función con casos ocultos. Escribes, envías, lees el veredicto y vuelves a intentarlo — y al final escribes tú el caso de prueba que desenmascara una solución con un error.',
  stats: [
    { etiqueta: 'Problemas', valor: '6', acento: '#38bdf8' },
    { etiqueta: 'Casos ocultos', valor: '20', acento: '#10b981' },
    { etiqueta: 'Insignia', valor: '1', acento: '#a78bfa' },
  ],
  letrero: 'Seis problemas, un juez, veinte casos que no vas a ver',
  fichas: [
    {
      key: 'que-es-un-juez',
      tag: 'Concepto 1',
      numero: 1,
      titulo: 'Qué es un juez',
      detalle:
        'No revisa tu texto: corre tu programa. Le pasa unos datos, mira lo que imprime y lo compara con la respuesta exacta. Ni «casi», ni «se entiende la idea»: o contesta lo que debe, o no.',
      acento: { c: '#38bdf8', deep: '#0284c7' },
    },
    {
      key: 'los-casos-ocultos',
      tag: 'Concepto 2',
      numero: 2,
      titulo: 'Los casos que no ves',
      detalle:
        'De cada problema conoces un par de ejemplos; el resto están ocultos. Sabes cómo se llaman —«justo en el corte», «la carrera se canceló»— pero no sus datos. Copiar la respuesta del ejemplo no aprueba nada.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'el-caso-limite',
      tag: 'Concepto 3',
      numero: 3,
      titulo: 'El caso límite',
      detalle:
        'La lista vacía, el cero, el empate, el uno. Casi ningún programa falla en el caso normal: falla en el borde — y el borde suele estar escrito en el enunciado sin que nadie lo lea dos veces.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'escribir-la-prueba',
      tag: 'Concepto 4',
      numero: 4,
      titulo: 'Escribir la prueba, no sólo pasarla',
      detalle:
        'Al final te toca el otro lado: te dan una solución con un error y tienes que encontrar el dato con el que se equivoca. Un caso de prueba que no distingue lo correcto de lo incorrecto no prueba nada.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Entra al torneo',
  ctaDetalle:
    'Seis problemas: contar con una condición, buscar un mínimo, invertir una lista, sumar cifras, decidir si un número es primo y desempatar a un campeón. Cada envío vuelve con un veredicto que dice cuántos casos pasan y por qué falla el que falla.',
  assetsPendientes: false,
};

export function EntradaProblemasDeConcurso(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaProblemasDeConcurso;
