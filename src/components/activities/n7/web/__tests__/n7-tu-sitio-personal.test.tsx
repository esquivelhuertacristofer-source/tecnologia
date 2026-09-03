import { analizarPagina, type PaginaAnalizada } from '@/components/simuladores/web';
import {
  GUION_TU_SITIO_N7,
  PLANTILLA_ESTILO_TU_SITIO_N7,
  PLANTILLA_INDEX_TU_SITIO_N7,
  PLANTILLA_PASATIEMPOS_TU_SITIO_N7,
  PLANTILLA_SOBRE_MI_TU_SITIO_N7,
} from '../LabTuSitioPersonal';

/**
 * Pruebas del guion de `n7-tu-sitio-personal`, al margen del registro.
 *
 * Mismo método que `n7-css-estilo.test.tsx`: se llama directamente a
 * `analizarPagina` y a los predicados de cada paso, sin montar React —el
 * recorrido de punta a punta que pide el canon (§4)—. La diferencia con las
 * dos hermanas es que aquí hay **tres páginas HTML** compartiendo una sola
 * hoja de estilos, así que cada paso se analiza sobre la página que declara
 * en `senal.archivo`, con las tres páginas siempre presentes en `paginas`
 * para que el detector de enlaces rotos de `pagina.ts` funcione de verdad.
 */

type Archivo = 'index.html' | 'sobre-mi.html' | 'mis-pasatiempos.html';

const PAGINAS_SITIO = ['index.html', 'sobre-mi.html', 'mis-pasatiempos.html'];

interface Sitio {
  index?: string;
  sobreMi?: string;
  pasatiempos?: string;
  css?: string;
}

function analizar(archivo: Archivo, sitio: Sitio): PaginaAnalizada {
  const porArchivo: Record<Archivo, string> = {
    'index.html': sitio.index ?? PLANTILLA_INDEX_TU_SITIO_N7,
    'sobre-mi.html': sitio.sobreMi ?? PLANTILLA_SOBRE_MI_TU_SITIO_N7,
    'mis-pasatiempos.html': sitio.pasatiempos ?? PLANTILLA_PASATIEMPOS_TU_SITIO_N7,
  };
  return analizarPagina({
    html: porArchivo[archivo],
    archivo,
    hojas: [{ nombre: 'estilo.css', texto: sitio.css ?? PLANTILLA_ESTILO_TU_SITIO_N7 }],
    paginas: PAGINAS_SITIO,
  });
}

function comprobar(paso: (typeof GUION_TU_SITIO_N7.pasos)[number], pagina: PaginaAnalizada): boolean {
  if (paso.logro.tipo !== 'pagina') throw new Error(`se esperaba un logro de tipo "pagina" en "${paso.id}"`);
  return paso.logro.comprueba(pagina);
}

const MENU = `<nav>
  <a href="index.html">Inicio</a>
  <a href="sobre-mi.html">Sobre mí</a>
  <a href="mis-pasatiempos.html">Mis pasatiempos</a>
</nav>`;

const INDEX_COMPLETO = `<!DOCTYPE html>
<html lang="es">
<head>
  <title>Mi sitio personal</title>
  <link rel="stylesheet" href="estilo.css">
</head>
<body>
  <header>
    <h1>El rincón de Sofía</h1>
    ${MENU}
  </header>
  <main>
    <h2>Bienvenido a mi rincón</h2>
    <p>Aquí voy a hablarte de mi pasión por el dibujo digital.</p>
  </main>
</body>
</html>`;

const SOBRE_MI_COMPLETO = `<!DOCTYPE html>
<html lang="es">
<head>
  <title>Sobre mí</title>
  <link rel="stylesheet" href="estilo.css">
</head>
<body>
  <header>
    <h1>El rincón de Sofía</h1>
    ${MENU}
  </header>
  <main>
    <article class="tarjeta">
      <h2>Un poco más de mí</h2>
      <p>Tengo doce años y me encanta armar maquetas los fines de semana.</p>
    </article>
  </main>
</body>
</html>`;

const PASATIEMPOS_COMPLETO = `<!DOCTYPE html>
<html lang="es">
<head>
  <title>Mis pasatiempos</title>
  <link rel="stylesheet" href="estilo.css">
</head>
<body>
  <header>
    <h1>El rincón de Sofía</h1>
    ${MENU}
  </header>
  <main>
    <div class="tarjetas">
      <article class="tarjeta">
        <h3>Dibujo</h3>
        <p>Dibujo personajes de mis series favoritas.</p>
      </article>
      <article class="tarjeta">
        <h3>Fútbol</h3>
        <p>Juego los sábados con mi equipo del barrio.</p>
      </article>
      <article class="tarjeta">
        <h3>Videojuegos</h3>
        <p>Me gustan los juegos de construir mundos.</p>
      </article>
    </div>
  </main>
</body>
</html>`;

const CSS_COMPLETO = `
  body { background-color: #0b1524; color: #e8f1ff; }
  nav { display: flex; gap: 16px; }
  nav a { color: #38bdf8; text-decoration: none; }
  .tarjetas { display: flex; gap: 16px; flex-wrap: wrap; }
  .tarjeta { padding: 16px; border: 2px solid #38bdf8; border-radius: 10px; }
`;

const SITIO_COMPLETO: Sitio = { index: INDEX_COMPLETO, sobreMi: SOBRE_MI_COMPLETO, pasatiempos: PASATIEMPOS_COMPLETO, css: CSS_COMPLETO };

describe('n7-tu-sitio-personal · GUION_TU_SITIO_N7 de punta a punta', () => {
  it('tiene nueve encargos, todos de tipo "pagina", cada uno con su página señalada', () => {
    expect(GUION_TU_SITIO_N7.pasos).toHaveLength(9);
    expect(GUION_TU_SITIO_N7.pasos.every((p) => p.logro.tipo === 'pagina')).toBe(true);
    expect(GUION_TU_SITIO_N7.pasos.every((p) => p.senal?.archivo !== undefined)).toBe(true);
  });

  it('las tres plantillas en blanco (con la hoja de estilos también en blanco) no regalan ningún encargo', () => {
    for (const paso of GUION_TU_SITIO_N7.pasos) {
      const archivo = paso.senal!.archivo as string;
      const pagina = archivo === 'estilo.css' ? analizar('index.html', {}) : analizar(archivo as Archivo, {});
      expect(comprobar(paso, pagina)).toBe(false);
    }
  });

  it('una partida perfecta cumple los nueve encargos y ninguna de las tres páginas queda con errores', () => {
    /* Los tres encargos de CSS (7, 8 y 9) no declaran página en `senal`
     * —viven en `estilo.css`, que no tiene vista propia—, así que aquí se
     * comprueban sobre la página real donde existe lo que preguntan: el
     * menú y "body" están en las tres, pero ".tarjetas" sólo vive en
     * "mis-pasatiempos.html". */
    const PAGINA_DE_CSS: Record<string, Archivo> = {
      'estilo-colores': 'index.html',
      'estilo-menu-flex': 'index.html',
      'estilo-tarjetas-flex': 'mis-pasatiempos.html',
    };
    for (const paso of GUION_TU_SITIO_N7.pasos) {
      const archivo = (paso.senal!.archivo === 'estilo.css' ? PAGINA_DE_CSS[paso.id] : paso.senal!.archivo) as Archivo;
      const pagina = analizar(archivo, SITIO_COMPLETO);
      expect(comprobar(paso, pagina)).toBe(true);
    }
    for (const archivo of PAGINAS_SITIO as Archivo[]) {
      expect(analizar(archivo, SITIO_COMPLETO).errores).toBe(0);
    }
  });

  it('el CSS no le regala ni le quita nada a los seis encargos de HTML: pasan igual con la hoja de estilos en blanco', () => {
    const soloHtml: Sitio = { index: INDEX_COMPLETO, sobreMi: SOBRE_MI_COMPLETO, pasatiempos: PASATIEMPOS_COMPLETO };
    const [e1, e2, e3, e4, e5, e6, e7, e8, e9] = GUION_TU_SITIO_N7.pasos;
    expect(comprobar(e1, analizar('index.html', soloHtml))).toBe(true);
    expect(comprobar(e2, analizar('index.html', soloHtml))).toBe(true);
    expect(comprobar(e3, analizar('sobre-mi.html', soloHtml))).toBe(true);
    expect(comprobar(e4, analizar('sobre-mi.html', soloHtml))).toBe(true);
    expect(comprobar(e5, analizar('mis-pasatiempos.html', soloHtml))).toBe(true);
    expect(comprobar(e6, analizar('mis-pasatiempos.html', soloHtml))).toBe(true);
    // Y los tres de CSS siguen sin cumplirse: nada se adelantó por accidente.
    expect(comprobar(e7, analizar('index.html', soloHtml))).toBe(false);
    expect(comprobar(e8, analizar('index.html', soloHtml))).toBe(false);
    expect(comprobar(e9, analizar('index.html', soloHtml))).toBe(false);
  });

  it('jugar mal: un menú con sólo dos enlaces (falta la tercera página) no cumple el encargo 1', () => {
    const indexCojo = INDEX_COMPLETO.replace('<a href="mis-pasatiempos.html">Mis pasatiempos</a>', '');
    const pagina = analizar('index.html', { index: indexCojo });
    expect(comprobar(GUION_TU_SITIO_N7.pasos[0], pagina)).toBe(false);
  });

  it('jugar mal: una tarjeta de "Sobre mí" con el párrafo demasiado corto no cumple el encargo 4', () => {
    const cojo = SOBRE_MI_COMPLETO.replace('Tengo doce años y me encanta armar maquetas los fines de semana.', 'Hola.');
    const pagina = analizar('sobre-mi.html', { sobreMi: cojo });
    expect(comprobar(GUION_TU_SITIO_N7.pasos[3], pagina)).toBe(false);
  });

  it('jugar mal: sólo dos tarjetas de pasatiempos (en vez de tres) no cumple el encargo 6', () => {
    const cojo = PASATIEMPOS_COMPLETO.replace(
      `<article class="tarjeta">
        <h3>Videojuegos</h3>
        <p>Me gustan los juegos de construir mundos.</p>
      </article>`,
      '',
    );
    const pagina = analizar('mis-pasatiempos.html', { pasatiempos: cojo });
    expect(comprobar(GUION_TU_SITIO_N7.pasos[5], pagina)).toBe(false);
  });

  it('jugar mal: fondo y letra del mismo color no cumplen el encargo 7 (el texto se volvería invisible)', () => {
    const pagina = analizar('index.html', { index: INDEX_COMPLETO, css: 'body { background-color: #0b1524; color: #0b1524; }' });
    expect(comprobar(GUION_TU_SITIO_N7.pasos[6], pagina)).toBe(false);
  });

  it('jugar mal: un "nav" sin "display: flex" no cumple el encargo 8 aunque tenga los colores', () => {
    const pagina = analizar('index.html', { index: INDEX_COMPLETO, css: 'nav a { color: #38bdf8; text-decoration: none; }' });
    expect(comprobar(GUION_TU_SITIO_N7.pasos[7], pagina)).toBe(false);
  });

  it('un enlace mal escrito a una página que no existe se avisa (broken link), no se calla', () => {
    const roto = INDEX_COMPLETO.replace('href="sobre-mi.html"', 'href="sobre_mi.html"');
    const pagina = analizar('index.html', { index: roto });
    expect(pagina.problemas.some((p) => p.clase === 'pagina-que-no-existe')).toBe(true);
  });
});
