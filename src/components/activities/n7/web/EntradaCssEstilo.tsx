'use client';

import type { ActivityProps } from '@/types/activity-contract';
import { EntradaN4Base, type ConfigEntradaN4 } from '../../n4/estudio/EntradaN4Base';
import { RUTA_N7_WEB } from './rutaWebN7';
import { LabCssEstilo } from './LabCssEstilo';

/**
 * Entrada de `n7-css-estilo` — N7·«Desarrollo web I», parada 2.
 * Tono de **12–13 años** (N7, 1.º de Secundaria).
 */

const CONFIG: ConfigEntradaN4 = {
  actividadId: 'n7-css-estilo',
  laboratorio: LabCssEstilo,
  ruta: RUTA_N7_WEB,
  parada: 2,
  globo:
    'En la parada anterior armaste la estructura semántica de tu portal con etiquetas HTML5. Esa estructura ya no se toca: hoy trabajas en su hoja de estilos, el archivo aparte que decide cómo se ve todo: colores, tipografías y el espacio de cada caja.',
  arranqueSub:
    'La hoja «estilo.css» llega casi en blanco, con un solo comentario. Vas a escribir siete reglas: el color de fondo y de letra de toda la página, el color de los enlaces del menú, la tipografía de los títulos, la lectura del párrafo, y el relleno, el borde y el margen de una tarjeta.',
  stats: [
    { etiqueta: 'Encargos', valor: '7', acento: '#c084fc' },
    { etiqueta: 'Propiedades', valor: '14', acento: '#f472b6' },
    { etiqueta: 'Insignia', valor: '1', acento: '#34d399' },
  ],
  letrero: 'Colores, tipografías y el modelo de cajas',
  fichas: [
    {
      key: 'colores',
      tag: 'El color',
      numero: 1,
      titulo: 'background-color y color',
      detalle:
        '«background-color» pinta el fondo de una caja; «color» pinta su letra. Dos propiedades distintas que casi siempre van juntas.',
      acento: { c: '#c084fc', deep: '#7e22ce' },
    },
    {
      key: 'tipografia',
      tag: 'La tipografía',
      numero: 2,
      titulo: 'font-family, font-size y font-weight',
      detalle:
        'El tipo de letra, el tamaño y el grosor no vienen en el HTML: los decide el CSS, etiqueta por etiqueta.',
      acento: { c: '#f472b6', deep: '#be185d' },
    },
    {
      key: 'cajas',
      tag: 'El modelo de cajas',
      numero: 3,
      titulo: 'padding, border y margin',
      detalle:
        'Toda caja tiene tres capas: relleno por dentro, borde en el medio y margen por fuera. Las tres se ven en el inspector.',
      acento: { c: '#34d399', deep: '#059669' },
    },
  ],
  gridClass: 'grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5',
  ctaTitulo: 'Escribir la hoja de estilos',
  ctaDetalle:
    'Construirás el CSS del portal de ciencias desde el editor de código con vista previa en tiempo real e inspector de cajas.',
  // El video se grabó y se publicó el 2-sep-2026, así que `assetsPendientes`
  // ya es `false` de verdad: la entrada enseña el cubrepantalla primero y el
  // reproductor después. OJO si escribes pruebas: con el video puesto, el
  // primer `<button>` del documento ya no es el CTA sino el de la portada, así
  // que no lo busques por posición — búscalo por su texto.
  assetsPendientes: false,
};

export function EntradaCssEstilo(props: ActivityProps) {
  return <EntradaN4Base {...props} entrada={CONFIG} />;
}

export default EntradaCssEstilo;
