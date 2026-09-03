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
    'TecniMarket organiza cada año un torneo interno de programación para su equipo júnior: problemas breves, contra el reloj, resueltos con Python real. Hoy vas a resolver los cinco de la primera ronda — los mismos que enfrenta cualquier candidato antes de llegar a la final.',
  arranqueSub:
    'Vas a resolver cinco problemas cortos: contar quién avanza de ronda, encontrar el mejor tiempo sin usar ninguna función nativa y confirmarlo con ella, invertir una lista de finalistas a mano, sumar los dígitos de un folio, y escribir tu propia función para decidir qué números de mesa son válidos para la final.',
  stats: [
    { etiqueta: 'Problemas', valor: '5', acento: '#38bdf8' },
    { etiqueta: 'Encargos', valor: '8', acento: '#10b981' },
    { etiqueta: 'Insignia', valor: '1', acento: '#a78bfa' },
  ],
  letrero: 'Cinco problemas, un torneo, un intérprete real',
  fichas: [
    {
      key: 'que-es-un-problema-de-concurso',
      tag: 'Concepto 1',
      numero: 1,
      titulo: 'Qué es un problema de concurso',
      detalle:
        'Un enunciado breve, unos datos de entrada y una respuesta exacta esperada — sin margen de error, sin "más o menos". Se resuelve contra el reloj, y aquí lo comprueba el mismo intérprete que corre tu código.',
      acento: { c: '#38bdf8', deep: '#0284c7' },
    },
    {
      key: 'el-algoritmo-antes-que-el-atajo',
      tag: 'Concepto 2',
      numero: 2,
      titulo: 'El algoritmo antes que el atajo',
      detalle:
        'A veces la función nativa ya existe —como min()—, pero un problema de concurso te pide escribir el algoritmo por dentro: es lo que demuestra que entiendes cómo funciona, no sólo que sabes llamarla.',
      acento: { c: '#a78bfa', deep: '#5b21b6' },
    },
    {
      key: 'clasificar-no-solo-calcular',
      tag: 'Concepto 3',
      numero: 3,
      titulo: 'Clasificar, no sólo calcular',
      detalle:
        'Varios problemas de concurso no piden un solo número: piden separar una lista en dos grupos según una regla, como decidir qué números de mesa son primos y cuáles no.',
      acento: { c: '#fbbf24', deep: '#b45309' },
    },
    {
      key: 'probar-antes-de-confiar',
      tag: 'Concepto 4',
      numero: 4,
      titulo: 'Probar antes de confiar',
      detalle:
        'Antes de aplicar tu función a todos los datos, la pruebas con uno o dos casos de los que ya conoces la respuesta. Si falla ahí, lo sabes de inmediato — no después de clasificar cien datos mal.',
      acento: { c: '#fb7185', deep: '#9f1239' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5',
  ctaTitulo: 'Entra al torneo',
  ctaDetalle:
    'Cinco problemas: contar con una condición, encontrar un mínimo a mano y confirmarlo con la librería, invertir una lista sin atajos, sumar dígitos con aritmética entera, y clasificar una lista completa con tu propia función — probada antes con casos conocidos.',
  assetsPendientes: false,
};

export function EntradaProblemasDeConcurso(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaProblemasDeConcurso;
