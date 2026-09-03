/**
 * N6 · «¿Cómo se hace una página?» — parada 1 de «Mi primera página web»
 * (documento §51.1). **N6 = 6.º de Primaria = 11–12 años.**
 *
 * Se prueba de dos maneras, y la segunda es la que vale:
 *   1. jugando BIEN, de punta a punta, hasta la pantalla de cierre;
 *   2. jugando MAL a propósito — borrar la plantilla entera, escribir en el
 *      archivo con candado, dejarlo vacío, adelantarse a los encargos,
 *      equivocarse en las de elegir.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ActivityProps, ActivityResult } from '@/types/activity-contract';
import {
  GUION,
  LabComoSeHaceUnaPagina,
  PLANTILLA_CSS,
  PLANTILLA_HTML,
  archivosIniciales,
} from '@/components/activities/n6/web/LabComoSeHaceUnaPagina';
import { EntradaComoSeHaceUnaPagina } from '@/components/activities/n6/web/EntradaComoSeHaceUnaPagina';
import { analizarPagina } from '@/components/simuladores/web/pagina';

/* ── utilería ─────────────────────────────────────────────────────────────── */

function espias() {
  const onComplete = jest.fn<void, [ActivityResult]>();
  const onProgress = jest.fn<void, [number]>();
  const onScore = jest.fn<void, [number]>();
  const props: ActivityProps = { config: {}, onProgress, onScore, onComplete };
  return { props, onComplete, onProgress, onScore };
}

function escribir(texto: string): void {
  fireEvent.change(screen.getByTestId('cod-area'), { target: { value: texto } });
}

/** El texto del editor tal y como está ahora, para partir de él. */
function codigo(): string {
  return (screen.getByTestId('cod-area') as HTMLTextAreaElement).value;
}

function vista() {
  return within(screen.getAllByTestId('wpv-lienzo')[0]);
}

function entrar() {
  fireEvent.click(screen.getByTestId('pgw-empezar'));
}

/** El paso que hay que dar para cumplir cada encargo, jugando BIEN. */
function cumplirEncargo(n: number): void {
  if (n === 1) escribir(PLANTILLA_HTML.replace('<h1>Club de Robótica</h1>', '<h1>Robots del 6.º B</h1>'));
  else if (n === 2) escribir(codigo().replace(/<title>[^<]*<\/title>/, '<title>Robots del 6.º B</title>'));
  else if (n === 3) fireEvent.click(screen.getByText('Porque es una instrucción para el navegador, no texto de la página'));
  else if (n === 4) escribir(codigo().replace('<h1>Robots del 6.º B</h1>', '<h1>Robots del 6.º B'));
  else if (n === 5) escribir(codigo().replace('<h1>Robots del 6.º B', '<h1>Robots del 6.º B</h1>'));
  else if (n === 6) escribir(codigo().replace('</body>', '  <p>Construimos un robot que sigue una línea negra.</p>\n</body>'));
  else if (n === 7) fireEvent.click(screen.getByText('En un archivo de texto que el navegador lee y dibuja'));
}

function siguiente() {
  fireEvent.click(screen.getByText('Siguiente encargo →'));
}

/* ── 1 · el guion, antes de jugarlo ───────────────────────────────────────── */

test('el guion tiene siete encargos, y ninguno se regala con la plantilla puesta', () => {
  expect(GUION.pasos).toHaveLength(7);
  const archivos = archivosIniciales();
  const pagina = analizarPagina({
    html: PLANTILLA_HTML,
    archivo: 'index.html',
    hojas: [{ nombre: 'estilo.css', texto: PLANTILLA_CSS }],
  });
  /*
   * «arreglala» es la única excepción, y es por diseño: pide **volver a cero
   * errores**, que es justo el estado de la plantilla. Sólo llega a abrirse
   * después del encargo 4, que rompe la página a propósito, así que ahí no se
   * regala nada. Con el arreglo de hoy en el armazón —el predicado se pregunta
   * también al abrirse el encargo— esto importa: si el alumno rompe la página,
   * cumple el 4 y luego pulsa «Devolver la plantilla», el 5 se da por hecho
   * solo. Y está bien: la ha dejado sin errores.
   */
  for (const paso of GUION.pasos) {
    if (paso.id === 'arreglala') continue;
    if (paso.logro.tipo === 'pagina') expect([paso.id, paso.logro.comprueba(pagina)]).toEqual([paso.id, false]);
    if (paso.logro.tipo === 'codigo') expect([paso.id, paso.logro.comprueba(archivos)]).toEqual([paso.id, false]);
  }

  /* Y la plantilla no trae ni un problema: el CSS con candado está escrito
   * sólo con lo que declara `subconjunto.ts`, y se comprueba con el propio
   * analizador en vez de a ojo. */
  expect(pagina.problemas.map((p) => `${p.severidad} ${p.clase} ${p.mensaje}`)).toEqual([]);
  expect(pagina.titulo).toBe('Club de Robótica');
});

/* ── 2 · la portada de objetivos ──────────────────────────────────────────── */

test('al entrar hay portada de objetivos, y el editor no se toca hasta pulsarla', () => {
  const { props } = espias();
  render(<LabComoSeHaceUnaPagina {...props} />);
  const portada = within(screen.getByTestId('pgw-portada'));
  expect(portada.getByText('Una página web por dentro')).toBeInTheDocument();
  expect(portada.getByText(/Sabrás que una página web es un archivo de texto/)).toBeInTheDocument();
  expect(portada.getByText('7')).toBeInTheDocument();
  expect(portada.getByText(/Abre el código/)).toBeInTheDocument();

  entrar();
  expect(screen.queryByTestId('pgw-portada')).toBeNull();
  expect(screen.getByTestId('cod-area')).toHaveValue(PLANTILLA_HTML);
});

/* ── 3 · el recorrido completo, hasta la pantalla de cierre ───────────────── */

test('RECORRIDO COMPLETO: los siete encargos y la insignia al final', () => {
  const { props, onComplete, onProgress } = espias();
  render(<LabComoSeHaceUnaPagina {...props} />);
  entrar();

  expect(screen.getByText('0/7')).toBeInTheDocument();
  for (let n = 1; n <= 7; n += 1) {
    expect(screen.getByTestId('web-encargo').textContent).toContain(`Encargo ${n} de 7`);
    cumplirEncargo(n);
    expect(screen.getByTestId('web-logrado')).toBeInTheDocument();
    /* La marquesina y el marcador cuentan encargos de verdad, uno por uno. */
    expect(screen.getByText(`${n}/7`)).toBeInTheDocument();
    if (n < 7) siguiente();
  }

  /* La pantalla de cierre de `ArcadeSala`, con su insignia y su resumen. */
  expect(screen.getByText('¡Has visto una página por dentro!')).toBeInTheDocument();
  expect(screen.getByText('Insignia · Abre el código')).toBeInTheDocument();
  expect(onComplete).toHaveBeenCalledTimes(1);
  expect(onComplete.mock.calls[0][0]).toMatchObject({ score: 100, stars: 3, errores: 0 });

  /* El avance llega UNA vez por encargo, no dos: es el defecto 2 que se
   * arregló hoy en `useEstudioWeb` (el updater que no era puro). */
  const avances = onProgress.mock.calls.map(([v]) => v).filter((v) => v > 0);
  expect(avances).toEqual([1 / 7, 2 / 7, 3 / 7, 4 / 7, 5 / 7, 6 / 7, 1, 1]);
});

/* ── 4 · el corazón de la clase: romper y leer ────────────────────────────── */

test('el encargo 4 rompe la página de verdad: el aviso dice dónde y el párrafo se traga', () => {
  const { props } = espias();
  render(<LabComoSeHaceUnaPagina {...props} />);
  entrar();
  cumplirEncargo(1);
  siguiente();
  cumplirEncargo(2);
  siguiente();
  cumplirEncargo(3);
  siguiente();

  cumplirEncargo(4);
  const problemas = within(screen.getByTestId('web-problemas'));
  expect(problemas.getByText(/lo último que abriste fue «h1»/)).toBeInTheDocument();
  expect(problemas.getByText(/primero <\/h1> y luego <\/body>/)).toBeInTheDocument();
  /* Y la página NO se queda en blanco: el párrafo sigue viéndose, pero ahora
   * cuelga del título. Es lo que el alumno tiene que ver. */
  const parrafo = vista().getByText(/Nos juntamos los martes/);
  expect(parrafo.closest('h1')).not.toBeNull();

  /* El encargo 5 señala la lista de problemas con el aro del modo guía. */
  siguiente();
  expect(screen.getByTestId('web')).toHaveAttribute('data-senalado', 'problemas');
  /* Y el sitio del problema lleva al archivo y a la línea. */
  fireEvent.click(within(screen.getByTestId('web-problemas')).getAllByTestId('web-problema-sitio')[0]);
  expect(screen.getByTestId('cod-area')).toHaveFocus();

  cumplirEncargo(5);
  expect(screen.getByTestId('web-cuenta').textContent).toContain('0 errores');
  expect(screen.getByTestId('web-logrado')).toBeInTheDocument();
});

/* ── 5 · JUGANDO MAL ──────────────────────────────────────────────────────── */

test('jugando MAL · el archivo con candado no se toca, y lo dice', () => {
  const { props } = espias();
  render(<LabComoSeHaceUnaPagina {...props} />);
  entrar();
  fireEvent.click(screen.getByRole('tab', { name: /estilo\.css/ }));
  expect(screen.getByTestId('cod-area')).toHaveAttribute('readonly');
  escribir('body { color: red; }');
  expect(screen.getByTestId('cod-area')).toHaveValue(PLANTILLA_CSS);
  expect(screen.getByTestId('web-aviso').textContent).toContain('se lee, no se toca');
  /* Y la herramienta de rescate no puede pisar el CSS por accidente. */
  expect(screen.getByText(/Devolver la plantilla/).closest('button')).toBeDisabled();
});

test('jugando MAL · borrarlo todo no deja la clase sin suelo: la plantilla vuelve', () => {
  const { props } = espias();
  render(<LabComoSeHaceUnaPagina {...props} />);
  entrar();
  escribir('');
  expect(screen.getByTestId('wpv-lienzo').textContent).toContain('todavía no tiene nada dentro');
  expect(screen.getByTestId('web-problemas').textContent).toContain('todavía no tiene nada dentro');

  fireEvent.click(screen.getByText(/Devolver la plantilla/));
  expect(screen.getByTestId('cod-area')).toHaveValue(PLANTILLA_HTML);
  expect(vista().getByText('Club de Robótica').tagName).toBe('H1');
  /* Y se puede seguir jugando desde ahí. */
  cumplirEncargo(1);
  expect(screen.getByTestId('web-logrado')).toBeInTheDocument();
});

test('jugando MAL · escribir basura no rompe nada y el encargo sigue esperando', () => {
  const { props } = espias();
  render(<LabComoSeHaceUnaPagina {...props} />);
  entrar();
  escribir('<<<>>> <p class= id=" <b><i>hola</b></i> </div &nada; <seccion>x</seccion>');
  expect(screen.getByTestId('web')).toBeInTheDocument();
  expect(screen.getByTestId('web-cuenta').textContent).toMatch(/error/);
  /* Sin <h1> no hay encargo 1 cumplido, por mucho que haya texto en la página. */
  expect(screen.queryByTestId('web-logrado')).toBeNull();
  expect(screen.getByTestId('web-encargo').textContent).toContain('Encargo 1 de 7');
});

test('jugando MAL · dejar el título vacío o poner el mismo de antes no cuela', () => {
  const { props } = espias();
  render(<LabComoSeHaceUnaPagina {...props} />);
  entrar();
  escribir(PLANTILLA_HTML.replace('<h1>Club de Robótica</h1>', '<h1></h1>'));
  expect(screen.queryByTestId('web-logrado')).toBeNull();
  escribir(PLANTILLA_HTML.replace('<h1>Club de Robótica</h1>', '<h1>ab</h1>'));
  expect(screen.queryByTestId('web-logrado')).toBeNull();
  escribir(PLANTILLA_HTML);
  expect(screen.queryByTestId('web-logrado')).toBeNull();
  cumplirEncargo(1);
  expect(screen.getByTestId('web-logrado')).toBeInTheDocument();

  /* Y el encargo 2 no se contenta con dejar el <title> que ya traía. */
  siguiente();
  escribir(codigo().replace('<title>Club de Robótica</title>', '<title></title>'));
  expect(screen.queryByTestId('web-logrado')).toBeNull();
  cumplirEncargo(2);
  expect(screen.getByTestId('web-logrado')).toBeInTheDocument();

  /* Y en el encargo 5, quitar el <h1> entero también deja cero errores… pero
   * no es arreglar la página, así que el predicado exige que siga estando. */
  siguiente();
  cumplirEncargo(3);
  siguiente();
  cumplirEncargo(4);
  siguiente();
  escribir(codigo().replace('<h1>Robots del 6.º B', ''));
  expect(screen.getByTestId('web-cuenta').textContent).toContain('0 errores');
  expect(screen.queryByTestId('web-logrado')).toBeNull();
});

test('jugando MAL · fallar en las de elegir resta, y repetir el mismo fallo no resta dos veces', () => {
  const { props, onComplete, onScore } = espias();
  render(<LabComoSeHaceUnaPagina {...props} />);
  entrar();
  cumplirEncargo(1);
  siguiente();
  cumplirEncargo(2);
  siguiente();

  fireEvent.click(screen.getByText('Porque el navegador borra las palabras raras'));
  expect(onScore).toHaveBeenLastCalledWith(94);
  fireEvent.click(screen.getByText('Porque el navegador borra las palabras raras'));
  expect(onScore).toHaveBeenLastCalledWith(94);
  fireEvent.click(screen.getByText('Porque está escrita en inglés'));
  expect(onScore).toHaveBeenLastCalledWith(88);
  /* La pista sale sola tras el fallo, y se puede seguir: equivocarse no cierra nada. */
  expect(screen.getByTestId('web-pista')).toBeInTheDocument();
  cumplirEncargo(3);
  expect(screen.getByTestId('web-logrado')).toBeInTheDocument();

  siguiente();
  cumplirEncargo(4);
  siguiente();
  cumplirEncargo(5);
  siguiente();
  cumplirEncargo(6);
  siguiente();
  cumplirEncargo(7);
  expect(onComplete.mock.calls[0][0]).toMatchObject({ score: 88, errores: 2 });
});

test('jugando MAL · adelantarse y escribir de una vez lo de dos encargos no atasca la clase', () => {
  const { props, onComplete } = espias();
  render(<LabComoSeHaceUnaPagina {...props} />);
  entrar();

  /* El alumno listo cambia el <h1> Y el <title> en el mismo tecleo. El
   * encargo 2 tiene que darse por hecho al abrirse, sin obligarle a teclear
   * un carácter de más — era el defecto 1 del armazón, arreglado hoy. */
  escribir(
    PLANTILLA_HTML.replace('<h1>Club de Robótica</h1>', '<h1>Robots del 6.º B</h1>').replace(
      '<title>Club de Robótica</title>',
      '<title>Robots del 6.º B</title>',
    ),
  );
  expect(screen.getByTestId('web-logrado')).toBeInTheDocument();
  siguiente();
  expect(screen.getByTestId('web-encargo').textContent).toContain('Encargo 2 de 7');
  expect(screen.getByTestId('web-logrado')).toBeInTheDocument();

  siguiente();
  cumplirEncargo(3);
  siguiente();
  cumplirEncargo(4);
  siguiente();
  cumplirEncargo(5);
  siguiente();
  cumplirEncargo(6);
  siguiente();
  cumplirEncargo(7);
  expect(onComplete).toHaveBeenCalledTimes(1);
});

test('jugando MAL · «Jugar otra vez» deja la clase como al principio, y se vuelve a terminar', () => {
  const { props, onComplete } = espias();
  render(<LabComoSeHaceUnaPagina {...props} />);
  entrar();
  for (let n = 1; n <= 7; n += 1) {
    cumplirEncargo(n);
    if (n < 7) siguiente();
  }
  fireEvent.click(screen.getByText('Jugar otra vez'));

  /* Vuelve la portada de objetivos, y el proyecto está intacto. */
  expect(screen.getByTestId('pgw-portada')).toBeInTheDocument();
  entrar();
  expect(screen.getByTestId('cod-area')).toHaveValue(PLANTILLA_HTML);
  expect(screen.getByTestId('web-encargo').textContent).toContain('Encargo 1 de 7');
  for (let n = 1; n <= 7; n += 1) {
    cumplirEncargo(n);
    if (n < 7) siguiente();
  }
  expect(onComplete).toHaveBeenCalledTimes(2);
});

/* ── 6 · la entrada ───────────────────────────────────────────────────────── */

test('la entrada habla de ESTA clase, no de la que se copió', () => {
  const { props } = espias();
  render(<EntradaComoSeHaceUnaPagina {...props} />);
  expect(screen.getByText('Lo que hay detrás de una página')).toBeInTheDocument();
  expect(screen.getByText('Una página web es un archivo de texto')).toBeInTheDocument();
  expect(screen.getByText('Abre el editor')).toBeInTheDocument();
  /* La ruta de la unidad, con sus tres paradas y ésta marcada. */
  expect(screen.getByText('¿Cómo se hace una página?')).toBeInTheDocument();
  expect(screen.getByText('HTML básico')).toBeInTheDocument();
  expect(screen.getByText('Publica tu página')).toBeInTheDocument();
  /* Y el CTA abre el laboratorio de verdad. */
  fireEvent.click(screen.getByText('Abre el editor'));
  expect(screen.getByTestId('pgw-portada')).toBeInTheDocument();
});
