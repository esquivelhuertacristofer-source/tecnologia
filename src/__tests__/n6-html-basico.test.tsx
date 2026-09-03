/**
 * N6 · «HTML básico» — parada 2 de «Mi primera página web» (documento §51.2).
 * **N6 = 6.º de Primaria = 11–12 años.**
 *
 * Jugando BIEN de punta a punta, y jugando MAL: dejar la lista con dos puntos,
 * poner la foto con el nombre equivocado, dejarla sin `alt`, escribir un
 * enlace que dice «aquí», borrar el body entero y desordenar la página.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ActivityProps, ActivityResult } from '@/types/activity-contract';
import { GUION, LabHtmlBasico, PLANTILLA_CSS, PLANTILLA_HTML, archivosIniciales } from '@/components/activities/n6/web/LabHtmlBasico';
import { EntradaHtmlBasico } from '@/components/activities/n6/web/EntradaHtmlBasico';
import { IMAGENES_DE_PRACTICA } from '@/components/activities/n6/web/imagenesDePractica';
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

function vista() {
  return within(screen.getAllByTestId('wpv-lienzo')[0]);
}

function entrar() {
  fireEvent.click(screen.getByTestId('pgw-empezar'));
}

function siguiente() {
  fireEvent.click(screen.getByText('Siguiente encargo →'));
}

/** El body que va teniendo la página tras cumplir el encargo n, jugando BIEN. */
const CUERPO: Record<number, string> = {
  1: '  <h1>Robots del 6.º B</h1>',
  2: '  <h1>Robots del 6.º B</h1>\n  <p>Nos juntamos los martes en el salón de cómputo y armamos robots.</p>',
  3: '  <h1>Robots del 6.º B</h1>\n  <p>Nos juntamos los martes en el salón de cómputo y armamos robots.</p>\n  <ul>\n    <li>El robot que sigue la línea</li>\n    <li>El brazo que recoge tapas</li>\n    <li>El coche por control remoto</li>\n  </ul>',
};
CUERPO[4] = `${CUERPO[3]}\n  <img src="robot.png">`;
CUERPO[5] = `${CUERPO[3]}\n  <img src="robot.png" alt="Nuestro robot siguiendo la línea negra">`;
CUERPO[6] = `${CUERPO[5]}\n  <a href="https://feriadeciencias.mx">La Feria de Ciencias de este año</a>`;
CUERPO[7] = CUERPO[6].replace('  <ul>', '  <h2>Nuestros proyectos</h2>\n  <ul>');

function conCuerpo(cuerpo: string): string {
  return PLANTILLA_HTML.replace(
    '\n  <!-- Escribe aquí abajo. Todo lo que pongas entre <body> y </body> se ve. -->\n',
    `\n${cuerpo}\n`,
  );
}

function cumplirEncargo(n: number): void {
  escribir(conCuerpo(CUERPO[n]));
}

/* ── 1 · el guion y la plantilla, antes de jugarlos ───────────────────────── */

test('siete encargos, ninguno regalado, y la plantilla sólo avisa de que está vacía', () => {
  expect(GUION.pasos).toHaveLength(7);
  const archivos = archivosIniciales();
  const pagina = analizarPagina({
    html: PLANTILLA_HTML,
    archivo: 'index.html',
    hojas: [{ nombre: 'estilo.css', texto: PLANTILLA_CSS }],
    recursos: IMAGENES_DE_PRACTICA,
  });
  for (const paso of GUION.pasos) {
    if (paso.logro.tipo === 'pagina') expect([paso.id, paso.logro.comprueba(pagina)]).toEqual([paso.id, false]);
    if (paso.logro.tipo === 'codigo') expect([paso.id, paso.logro.comprueba(archivos)]).toEqual([paso.id, false]);
  }
  /*
   * El único problema de salida es «esta página todavía no tiene nada dentro»,
   * que es verdad y es el punto de partida de la clase. Ni un
   * «selector-sin-uso»: por eso el CSS con candado de esta parada tiene una
   * sola regla, la de `body` — con reglas para `h1`, `ul` o `img`, la lista
   * estaría llena de ruido desde el primer segundo y el alumno aprendería a no
   * leerla justo en la clase donde tiene que empezar a leerla.
   */
  expect(pagina.problemas.map((p) => p.clase)).toEqual(['pagina-vacia']);
});

/* ── 2 · portada y mesa de imágenes ───────────────────────────────────────── */

test('portada de objetivos propia, y las imágenes de la práctica están a la vista con su nombre', () => {
  const { props } = espias();
  render(<LabHtmlBasico {...props} />);
  const portada = within(screen.getByTestId('pgw-portada'));
  expect(portada.getByText('Las cinco etiquetas que lo sostienen todo')).toBeInTheDocument();
  expect(portada.getByText(/Constructor de páginas/)).toBeInTheDocument();
  entrar();

  /* Sin esta mesa, el encargo de la imagen sería adivinar un nombre. */
  const mesa = within(screen.getByTestId('pgw-recursos'));
  expect(mesa.getByText('robot.png')).toBeInTheDocument();
  expect(mesa.getByText('taller.webp')).toBeInTheDocument();
  expect(mesa.getByAltText('El robot que sigue la línea negra')).toBeInTheDocument();
});

/* ── 3 · el recorrido completo ────────────────────────────────────────────── */

test('RECORRIDO COMPLETO: la página se construye entera y se cierra con insignia', () => {
  const { props, onComplete, onProgress } = espias();
  render(<LabHtmlBasico {...props} />);
  entrar();
  expect(screen.getByTestId('wpv-lienzo').textContent).toContain('todavía no tiene nada dentro');

  for (let n = 1; n <= 7; n += 1) {
    expect(screen.getByTestId('web-encargo').textContent).toContain(`Encargo ${n} de 7`);
    cumplirEncargo(n);
    expect(screen.getByTestId('web-logrado')).toBeInTheDocument();
    expect(screen.getByText(`${n}/7`)).toBeInTheDocument();
    if (n < 7) siguiente();
  }

  expect(screen.getByText('¡Tu página está hecha!')).toBeInTheDocument();
  expect(screen.getByText('Insignia · Constructor de páginas')).toBeInTheDocument();
  expect(onComplete).toHaveBeenCalledTimes(1);
  expect(onComplete.mock.calls[0][0]).toMatchObject({ score: 100, stars: 3, errores: 0 });
  expect(onProgress.mock.calls.map(([v]) => v).filter((v) => v > 0)).toEqual([1 / 7, 2 / 7, 3 / 7, 4 / 7, 5 / 7, 6 / 7, 1, 1]);
});

test('la página que queda al final es la que el alumno escribió, y no tiene ni un problema', () => {
  const { props } = espias();
  render(<LabHtmlBasico {...props} />);
  entrar();
  for (let n = 1; n <= 7; n += 1) {
    cumplirEncargo(n);
    if (n < 7) siguiente();
  }
  expect(vista().getByText('Robots del 6.º B').tagName).toBe('H1');
  expect(vista().getByText('Nuestros proyectos').tagName).toBe('H2');
  expect(vista().getAllByRole('listitem')).toHaveLength(3);
  expect(vista().getByAltText('Nuestro robot siguiendo la línea negra').tagName).toBe('IMG');
  expect(vista().getByText('La Feria de Ciencias de este año').tagName).toBe('A');
  expect(screen.getByTestId('web-cuenta').textContent).toBe('0 errores · 0 avisos');
});

/* ── 4 · las dos reglas de oficio ─────────────────────────────────────────── */

test('la foto sin «alt» se ve perfectamente y aun así avisa: es la otra severidad', () => {
  const { props } = espias();
  render(<LabHtmlBasico {...props} />);
  entrar();
  for (let n = 1; n <= 4; n += 1) {
    cumplirEncargo(n);
    siguiente();
  }
  /* Funciona: la imagen está pintada. Y aun así hay un aviso amarillo. */
  expect(screen.getByTestId('wpv-lienzo').querySelectorAll('img')).toHaveLength(1);
  expect(screen.getByTestId('web-cuenta').textContent).toBe('0 errores · 1 aviso');
  expect(within(screen.getByTestId('web-problemas')).getByText(/no tiene texto alternativo/)).toBeInTheDocument();
  /* Y el encargo señala la lista de problemas, no el editor. */
  expect(screen.getByTestId('web')).toHaveAttribute('data-senalado', 'problemas');

  /* Un «alt» de relleno no cuela: tiene que decir algo. */
  escribir(conCuerpo(`${CUERPO[3]}\n  <img src="robot.png" alt="x">`));
  expect(screen.queryByTestId('web-logrado')).toBeNull();
  cumplirEncargo(5);
  expect(screen.getByTestId('web-logrado')).toBeInTheDocument();
});

test('jugando MAL · un enlace que dice «aquí» no se da por bueno, ni uno sin destino', () => {
  const { props } = espias();
  render(<LabHtmlBasico {...props} />);
  entrar();
  for (let n = 1; n <= 5; n += 1) {
    cumplirEncargo(n);
    siguiente();
  }
  escribir(conCuerpo(`${CUERPO[5]}\n  <a href="https://feriadeciencias.mx">aquí</a>`));
  expect(screen.queryByTestId('web-logrado')).toBeNull();
  escribir(conCuerpo(`${CUERPO[5]}\n  <a href="https://feriadeciencias.mx">Pincha aquí</a>`));
  expect(screen.queryByTestId('web-logrado')).toBeNull();
  escribir(conCuerpo(`${CUERPO[5]}\n  <a>La Feria de Ciencias de este año</a>`));
  expect(screen.queryByTestId('web-logrado')).toBeNull();
  cumplirEncargo(6);
  expect(screen.getByTestId('web-logrado')).toBeInTheDocument();
});

/* ── 5 · JUGANDO MAL ──────────────────────────────────────────────────────── */

test('jugando MAL · la lista con dos puntos, o con un <li> suelto, no cuela', () => {
  const { props } = espias();
  render(<LabHtmlBasico {...props} />);
  entrar();
  cumplirEncargo(1);
  siguiente();
  cumplirEncargo(2);
  siguiente();
  escribir(conCuerpo(`${CUERPO[2]}\n  <ul>\n    <li>Uno</li>\n    <li>Dos</li>\n  </ul>`));
  expect(screen.queryByTestId('web-logrado')).toBeNull();
  /* Tres <li> sueltos, sin <ul> alrededor: tampoco. */
  escribir(conCuerpo(`${CUERPO[2]}\n  <li>Uno</li>\n  <li>Dos</li>\n  <li>Tres</li>`));
  expect(screen.queryByTestId('web-logrado')).toBeNull();
  /* Y una lista con puntos vacíos, menos. */
  escribir(conCuerpo(`${CUERPO[2]}\n  <ul>\n    <li></li>\n    <li></li>\n    <li></li>\n  </ul>`));
  expect(screen.queryByTestId('web-logrado')).toBeNull();
  cumplirEncargo(3);
  expect(screen.getByTestId('web-logrado')).toBeInTheDocument();
});

test('jugando MAL · el nombre de la imagen mal escrito: la página lo dice y el encargo espera', () => {
  const { props } = espias();
  render(<LabHtmlBasico {...props} />);
  entrar();
  for (let n = 1; n <= 3; n += 1) {
    cumplirEncargo(n);
    siguiente();
  }
  escribir(conCuerpo(`${CUERPO[3]}\n  <img src="robots.png" alt="mi robot">`));
  expect(within(screen.getByTestId('web-problemas')).getByText(/no hay ninguna imagen que se llame «robots.png»/)).toBeInTheDocument();
  expect(within(screen.getByTestId('web-problemas')).getByText(/se llama «robot.png»/)).toBeInTheDocument();
  expect(screen.queryByTestId('web-logrado')).toBeNull();
  /* Y la vista previa enseña el hueco con su nombre, no un vacío. */
  expect(screen.getByTestId('wpv-lienzo').textContent).toContain('robots.png');
  cumplirEncargo(4);
  expect(screen.getByTestId('web-logrado')).toBeInTheDocument();
});

test('jugando MAL · desordenar la página deja el último encargo sin cumplir', () => {
  const { props } = espias();
  render(<LabHtmlBasico {...props} />);
  entrar();
  for (let n = 1; n <= 6; n += 1) {
    cumplirEncargo(n);
    siguiente();
  }
  /* Con el <h2> DEBAJO de la lista hay h2, pero el orden está mal. */
  escribir(conCuerpo(CUERPO[6].replace('  <a href', '  <h2>Nuestros proyectos</h2>\n  <a href')));
  expect(screen.queryByTestId('web-logrado')).toBeNull();
  cumplirEncargo(7);
  expect(screen.getByTestId('web-logrado')).toBeInTheDocument();
});

test('jugando MAL · el CSS con candado, borrarlo todo, y volver a empezar el body', () => {
  const { props } = espias();
  render(<LabHtmlBasico {...props} />);
  entrar();
  fireEvent.click(screen.getByRole('tab', { name: /estilo\.css/ }));
  escribir('body { color: red; }');
  expect(screen.getByTestId('cod-area')).toHaveValue(PLANTILLA_CSS);
  expect(screen.getByTestId('web-aviso').textContent).toContain('se lee, no se toca');
  expect(screen.getByText(/Empezar el body de nuevo/).closest('button')).toBeDisabled();

  fireEvent.click(screen.getByRole('tab', { name: /index\.html/ }));
  escribir('');
  expect(screen.getByTestId('web-problemas').textContent).toContain('todavía no tiene nada dentro');
  fireEvent.click(screen.getByText(/Empezar el body de nuevo/));
  expect(screen.getByTestId('cod-area')).toHaveValue(PLANTILLA_HTML);
  cumplirEncargo(1);
  expect(screen.getByTestId('web-logrado')).toBeInTheDocument();
});

test('jugando MAL · adelantarse y escribir la página entera en el primer encargo la termina igual', () => {
  const { props, onComplete } = espias();
  render(<LabHtmlBasico {...props} />);
  entrar();
  /* El alumno que ya sabe escribe los siete de golpe. Cada encargo tiene que
   * darse por hecho al abrirse, sin pedirle una tecla de más. */
  cumplirEncargo(7);
  for (let n = 1; n <= 7; n += 1) {
    expect(screen.getByTestId('web-encargo').textContent).toContain(`Encargo ${n} de 7`);
    expect(screen.getByTestId('web-logrado')).toBeInTheDocument();
    if (n < 7) siguiente();
  }
  expect(onComplete).toHaveBeenCalledTimes(1);
  expect(screen.getByText('¡Tu página está hecha!')).toBeInTheDocument();
});

/* ── 6 · la entrada ───────────────────────────────────────────────────────── */

test('la entrada habla de ESTA clase y abre el laboratorio', () => {
  const { props } = espias();
  render(<EntradaHtmlBasico {...props} />);
  expect(screen.getByText('Las cinco que lo sostienen todo')).toBeInTheDocument();
  expect(screen.getByText('Las viñetas no se escriben')).toBeInTheDocument();
  expect(screen.getByText('Un enlace que diga «aquí» no dice nada')).toBeInTheDocument();
  expect(screen.getByText('Abre el proyecto')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Abre el proyecto'));
  expect(screen.getByTestId('pgw-portada')).toBeInTheDocument();
});
