import { analizarPagina, type PaginaAnalizada } from '@/components/simuladores/web';
import { GUION_CSS_N7, PLANTILLA_CSS_ESTILO_N7, PLANTILLA_HTML_CSS_N7 } from '../LabCssEstilo';

/**
 * Pruebas del guion de `n7-css-estilo`, al margen del registro.
 *
 * No pasan por `registry.ts` a propósito: el encargo pide no tocar los cinco
 * archivos compartidos, así que esto verifica el guion **de punta a punta**
 * llamando directamente a `analizarPagina` y a los predicados de cada paso,
 * igual que hace el propio armazón en `useEstudioWeb`. Es el recorrido
 * completo que el canon exige (§4: «el motor sólo está probado hasta donde
 * llegan las clases que se han jugado») aplicado sin montar React.
 */

function paginaCon(css: string): PaginaAnalizada {
  return analizarPagina({
    html: PLANTILLA_HTML_CSS_N7,
    archivo: 'index.html',
    hojas: [{ nombre: 'estilo.css', texto: css }],
  });
}

function comprobar(paso: (typeof GUION_CSS_N7.pasos)[number], pagina: PaginaAnalizada): boolean {
  if (paso.logro.tipo !== 'pagina') throw new Error(`se esperaba un logro de tipo "pagina" en "${paso.id}"`);
  return paso.logro.comprueba(pagina);
}

const CSS_COMPLETO = `
  body { background-color: #0b1524; color: #e8f1ff; }
  nav a { color: #38bdf8; text-decoration: none; }
  h1 { font-family: Verdana, sans-serif; font-size: 34px; }
  h2 { font-weight: bold; text-transform: uppercase; }
  article p { text-align: justify; line-height: 1.6; }
  .tarjeta { padding: 20px; border: 2px solid #38bdf8; border-radius: 10px; margin-top: 20px; margin-bottom: 20px; }
`;

describe('n7-css-estilo · GUION_CSS_N7 de punta a punta', () => {
  it('tiene siete encargos, todos de tipo "pagina"', () => {
    expect(GUION_CSS_N7.pasos).toHaveLength(7);
    expect(GUION_CSS_N7.pasos.every((p) => p.logro.tipo === 'pagina')).toBe(true);
  });

  it('la hoja en blanco con la que arranca la clase no regala ningún encargo', () => {
    const pagina = paginaCon(PLANTILLA_CSS_ESTILO_N7);
    for (const paso of GUION_CSS_N7.pasos) {
      expect(comprobar(paso, pagina)).toBe(false);
    }
  });

  it('el HTML con candado no trae ningún error ni aviso de enlace roto', () => {
    const pagina = paginaCon(PLANTILLA_CSS_ESTILO_N7);
    expect(pagina.errores).toBe(0);
  });

  it('una partida perfecta cumple los siete encargos y no deja errores en el subconjunto', () => {
    const pagina = paginaCon(CSS_COMPLETO);
    for (const paso of GUION_CSS_N7.pasos) {
      expect(comprobar(paso, pagina)).toBe(true);
    }
    expect(pagina.errores).toBe(0);
  });

  it('la trampa de la herencia: colorear "body" (encargo 1) no regala el color de "nav a" (encargo 2)', () => {
    const pagina = paginaCon('body { background-color: #0b1524; color: #e8f1ff; }');
    const [encargo1, encargo2] = GUION_CSS_N7.pasos;
    expect(comprobar(encargo1, pagina)).toBe(true);
    expect(comprobar(encargo2, pagina)).toBe(false);
  });

  it('el encargo 2 exige TAMBIÉN quitar el subrayado, no sólo el color', () => {
    const pagina = paginaCon('nav a { color: #38bdf8; }');
    const encargo2 = GUION_CSS_N7.pasos[1];
    expect(comprobar(encargo2, pagina)).toBe(false);
  });

  it('el modelo de cajas: relleno+borde (encargo 6) y margen (encargo 7) son independientes', () => {
    const soloCaja = paginaCon('.tarjeta { padding: 20px; border: 2px solid #38bdf8; }');
    const [encargo6, encargo7] = [GUION_CSS_N7.pasos[5], GUION_CSS_N7.pasos[6]];
    expect(comprobar(encargo6, soloCaja)).toBe(true);
    expect(comprobar(encargo7, soloCaja)).toBe(false);

    const soloMargen = paginaCon('.tarjeta { margin-top: 20px; margin-bottom: 20px; }');
    expect(comprobar(encargo6, soloMargen)).toBe(false);
    expect(comprobar(encargo7, soloMargen)).toBe(true);
  });

  it('colores iguales en "body" no cumplen el encargo 1 (el texto se volvería invisible)', () => {
    const pagina = paginaCon('body { background-color: #0b1524; color: #0b1524; }');
    expect(comprobar(GUION_CSS_N7.pasos[0], pagina)).toBe(false);
  });
});
