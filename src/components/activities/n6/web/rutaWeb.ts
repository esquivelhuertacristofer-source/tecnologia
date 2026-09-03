import type { PasoRuta } from '../../n4/estudio/EntradaN4Base';

/**
 * N6 · Unidad «Mi primera página web» — las tres paradas, en el orden del
 * currículo (`src/data/curriculo.ts`, unidad `n6-mi-primera-pagina-web`).
 *
 * Vive aquí y no junto a las `RUTA_N4U*` / `RUTA_N5U1` de `EntradaN4Base.tsx`
 * a propósito: ese archivo lo comparten media docena de entradas de otros
 * niveles y hoy hay más de un agente escribiendo sin control de versiones. La
 * plantilla de oro toma la ruta **por parámetro** (`ConfigEntradaN4.ruta`), así
 * que una constante en la carpeta de la unidad hace exactamente lo mismo sin
 * tocar un archivo compartido.
 *
 * Nivel y edad, verificados en el currículo antes de escribir una línea:
 * **N6 · 6.º de Primaria · 11–12 años**, eje `programacion`.
 */
export const RUTA_N6_WEB: PasoRuta[] = [
  { id: 'n6-como-se-hace-una-pagina', titulo: '¿Cómo se hace una página?' },
  { id: 'n6-html-basico', titulo: 'HTML básico' },
  { id: 'n6-publica-tu-pagina', titulo: 'Publica tu página' },
];
