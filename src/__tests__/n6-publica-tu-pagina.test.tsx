/**
 * N6 · «Publica tu página» — parada 3 de «Mi primera página web»
 * (documento §51.3). **N6 = 6.º de Primaria = 11–12 años.**
 *
 * Jugando BIEN hasta la dirección publicada, y jugando MAL: borrar la página
 * entera para «quitar» el teléfono, borrar el <link> en vez de arreglarlo,
 * intentar publicar antes de revisar, y equivocarse en la de elegir.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ActivityProps, ActivityResult } from '@/types/activity-contract';
import {
  GUION,
  LabPublicaTuPagina,
  PLANTILLA_CSS,
  PLANTILLA_HTML,
  PUBLICACION,
  archivosIniciales,
} from '@/components/activities/n6/web/LabPublicaTuPagina';
import { EntradaPublicaTuPagina } from '@/components/activities/n6/web/EntradaPublicaTuPagina';
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

function codigo(): string {
  return (screen.getByTestId('cod-area') as HTMLTextAreaElement).value;
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

/** La línea entera del párrafo con los datos personales, la que hay que quitar. */
const SIN_CONTACTO = /^.*class="contacto".*\n/m;

function cumplirEncargo(n: number): void {
  if (n === 1) fireEvent.click(screen.getByText('Tu teléfono, tu calle y la hora a la que sales de la escuela'));
  else if (n === 2) escribir(codigo().replace(SIN_CONTACTO, ''));
  else if (n === 3) escribir(codigo().replace('href="estilos.css"', 'href="estilo.css"'));
  else if (n === 4)
    escribir(
      codigo()
        .replace('<img src="robot.png">', '<img src="robot.png" alt="Nuestro robot siguiendo la línea negra">')
        .replace('<a>', '<a href="https://feriadeciencias.mx">'),
    );
  else if (n === 5) escribir(codigo().replace('<title></title>', '<title>Robots del 6.º B</title>'));
}

function publicar(): void {
  for (const paso of PUBLICACION.pasos) fireEvent.click(screen.getByText(paso.etiqueta));
}

/* ── 1 · la plantilla llega con sus cuatro cosas mal ──────────────────────── */

test('la plantilla trae un error rojo, dos avisos amarillos y un párrafo que no debería estar', () => {
  expect(GUION.pasos).toHaveLength(5);
  const archivos = archivosIniciales();
  const pagina = analizarPagina({
    html: PLANTILLA_HTML,
    archivo: 'index.html',
    hojas: [{ nombre: 'estilo.css', texto: PLANTILLA_CSS }],
    recursos: IMAGENES_DE_PRACTICA,
  });
  expect(pagina.errores).toBe(1);
  expect(pagina.avisos).toBe(2);
  expect(pagina.problemas.map((p) => `${p.severidad} ${p.mensaje}`)).toEqual([
    'aviso esta imagen no tiene texto alternativo',
    'aviso este enlace no lleva a ninguna parte',
    'error no hay ningún archivo que se llame «estilos.css»',
  ]);
  /* Y sin el estilo aplicado, porque el <link> apunta a un archivo que no está. */
  expect(pagina.hojas).toHaveLength(0);
  expect(pagina.titulo).toBe('');

  for (const paso of GUION.pasos) {
    if (paso.logro.tipo === 'pagina') expect([paso.id, paso.logro.comprueba(pagina)]).toEqual([paso.id, false]);
    if (paso.logro.tipo === 'codigo') expect([paso.id, paso.logro.comprueba(archivos)]).toEqual([paso.id, false]);
  }
});

/* ── 2 · el recorrido completo, hasta la dirección publicada ──────────────── */

test('RECORRIDO COMPLETO: cinco revisiones, tres pasos de publicar y la dirección funcionando', () => {
  const { props, onComplete, onProgress } = espias();
  render(<LabPublicaTuPagina {...props} />);
  const portada = within(screen.getByTestId('pgw-portada'));
  expect(portada.getByText('Revisar, y sólo entonces publicar')).toBeInTheDocument();
  expect(portada.getByText('8')).toBeInTheDocument();
  entrar();

  /* Mientras la revisión no está hecha, el panel de publicar NO existe. */
  expect(screen.queryByTestId('web-publicar')).toBeNull();
  expect(screen.getByTestId('web-url').textContent).toBe('archivo local · index.html');

  for (let n = 1; n <= 5; n += 1) {
    expect(screen.getByTestId('web-encargo').textContent).toContain(`Encargo ${n} de 5`);
    cumplirEncargo(n);
    expect(screen.getByTestId('web-logrado')).toBeInTheDocument();
    /* El marcador cuenta revisiones… hasta la quinta, donde pasa a contar los
     * pasos de publicar: es el cambio de fase de la clase, dicho en el
     * marcador y no en un cartel. */
    if (n < 5) {
      expect(screen.getByText(`${n}/5`)).toBeInTheDocument();
      siguiente();
    } else {
      expect(screen.getByText('0/3')).toBeInTheDocument();
    }
  }

  /* Revisión terminada: ni rojos ni amarillos, y AHORA aparece el panel. */
  expect(screen.getByTestId('web-cuenta').textContent).toBe('0 errores · 0 avisos');
  expect(screen.getByTestId('web-publicar')).toBeInTheDocument();
  expect(screen.queryByTestId('web-direccion')).toBeNull();

  publicar();
  expect(screen.getByTestId('web-direccion').textContent).toContain('https://club-robotica.tecnia.mx');
  expect(screen.getByTestId('web-url').textContent).toBe('https://club-robotica.tecnia.mx/index.html');
  expect(screen.getByText('¡Tu página está publicada!')).toBeInTheDocument();
  expect(screen.getByText('Insignia · Publica con cabeza')).toBeInTheDocument();
  expect(onComplete).toHaveBeenCalledTimes(1);
  expect(onComplete.mock.calls[0][0]).toMatchObject({ score: 100, stars: 3, errores: 0 });
  expect(onProgress.mock.calls.map(([v]) => v).filter((v) => v > 0)).toEqual([1 / 8, 2 / 8, 3 / 8, 4 / 8, 5 / 8, 6 / 8, 7 / 8, 1, 1]);
});

test('el momento vistoso: arreglar el <link> llena la página de color de golpe', () => {
  const { props } = espias();
  render(<LabPublicaTuPagina {...props} />);
  entrar();
  cumplirEncargo(1);
  siguiente();
  cumplirEncargo(2);
  siguiente();

  /* Antes: el estilo no se aplica, y el aviso trae escrito el arreglo. */
  expect(vista().getByText('Robots del 6.º B').style.getPropertyValue('color')).toBe('');
  const problemas = within(screen.getByTestId('web-problemas'));
  expect(problemas.getByText(/no hay ningún archivo que se llame «estilos.css»/)).toBeInTheDocument();
  expect(problemas.getByText(/se llama «estilo.css»/)).toBeInTheDocument();

  cumplirEncargo(3);
  /* jsdom normaliza la almohadilla a rgb() al escribirla en el atributo. */
  expect(vista().getByText('Robots del 6.º B').style.getPropertyValue('color')).toBe('rgb(185, 28, 28)');
  expect(screen.getByTestId('web-cuenta').textContent).toContain('0 errores');
});

/* ── 3 · JUGANDO MAL ──────────────────────────────────────────────────────── */

test('jugando MAL · borrar la página entera también quita el teléfono, y NO vale', () => {
  const { props } = espias();
  render(<LabPublicaTuPagina {...props} />);
  entrar();
  cumplirEncargo(1);
  siguiente();

  escribir('');
  expect(screen.queryByTestId('web-logrado')).toBeNull();
  escribir('<h1>Robots</h1>');
  expect(screen.queryByTestId('web-logrado')).toBeNull();
  /* Ni quitando sólo la lista y la foto «de paso». */
  escribir(PLANTILLA_HTML.replace(SIN_CONTACTO, '').replace('  <img src="robot.png">\n', ''));
  expect(screen.queryByTestId('web-logrado')).toBeNull();

  fireEvent.click(screen.getByText(/Devolver la plantilla/));
  cumplirEncargo(2);
  expect(screen.getByTestId('web-logrado')).toBeInTheDocument();
});

test('jugando MAL · quitar el teléfono a medias tampoco cuela', () => {
  const { props } = espias();
  render(<LabPublicaTuPagina {...props} />);
  entrar();
  cumplirEncargo(1);
  siguiente();

  /* Quita el teléfono y deja la calle. */
  escribir(codigo().replace('Llámame al 55 12 34 56 78. ', ''));
  expect(screen.queryByTestId('web-logrado')).toBeNull();
  /* Quita la calle y deja la hora de salida. */
  escribir(codigo().replace('Vivo en Insurgentes 214 y salgo', 'Salgo'));
  expect(screen.queryByTestId('web-logrado')).toBeNull();
  cumplirEncargo(2);
  expect(screen.getByTestId('web-logrado')).toBeInTheDocument();
});

test('jugando MAL · borrar el <link> en vez de arreglarlo no da por hecho el encargo', () => {
  const { props } = espias();
  render(<LabPublicaTuPagina {...props} />);
  entrar();
  cumplirEncargo(1);
  siguiente();
  cumplirEncargo(2);
  siguiente();

  /* Sin <link> ya no hay error rojo… pero la página sigue sin su estilo, así
   * que el encargo exige además que la hoja esté puesta de verdad. */
  escribir(codigo().replace('  <link rel="stylesheet" href="estilos.css">\n', ''));
  expect(screen.getByTestId('web-cuenta').textContent).toContain('0 errores');
  expect(screen.queryByTestId('web-logrado')).toBeNull();
  escribir(codigo().replace('  <title></title>', '  <title></title>\n  <link rel="stylesheet" href="estilo.css">'));
  expect(screen.getByTestId('web-logrado')).toBeInTheDocument();
});

test('jugando MAL · arreglar un solo aviso amarillo deja el encargo esperando', () => {
  const { props } = espias();
  render(<LabPublicaTuPagina {...props} />);
  entrar();
  for (let n = 1; n <= 3; n += 1) {
    cumplirEncargo(n);
    siguiente();
  }
  expect(screen.getByTestId('web-cuenta').textContent).toBe('0 errores · 2 avisos');
  escribir(codigo().replace('<img src="robot.png">', '<img src="robot.png" alt="Nuestro robot">'));
  expect(screen.getByTestId('web-cuenta').textContent).toBe('0 errores · 1 aviso');
  expect(screen.queryByTestId('web-logrado')).toBeNull();
  cumplirEncargo(4);
  expect(screen.getByTestId('web-logrado')).toBeInTheDocument();
});

test('jugando MAL · fallar la de elegir resta, y la clase se termina igual', () => {
  const { props, onComplete, onScore } = espias();
  render(<LabPublicaTuPagina {...props} />);
  entrar();
  fireEvent.click(screen.getByText('El nombre del club y sus tres proyectos'));
  expect(onScore).toHaveBeenLastCalledWith(94);
  fireEvent.click(screen.getByText('El nombre del club y sus tres proyectos'));
  expect(onScore).toHaveBeenLastCalledWith(94);
  expect(screen.getByTestId('web-pista')).toBeInTheDocument();

  for (let n = 1; n <= 5; n += 1) {
    cumplirEncargo(n);
    if (n < 5) siguiente();
  }
  publicar();
  expect(onComplete.mock.calls[0][0]).toMatchObject({ score: 94, errores: 1 });
});

test('jugando MAL · el CSS con candado no se toca ni con la herramienta de rescate', () => {
  const { props } = espias();
  render(<LabPublicaTuPagina {...props} />);
  entrar();
  fireEvent.click(screen.getByRole('tab', { name: /estilo\.css/ }));
  escribir('body { color: red; }');
  expect(screen.getByTestId('cod-area')).toHaveValue(PLANTILLA_CSS);
  expect(screen.getByTestId('web-aviso').textContent).toContain('se lee, no se toca');
  expect(screen.getByText(/Devolver la plantilla/).closest('button')).toBeDisabled();
});

test('jugando MAL · adelantarse y dejar la página revisada de un tirón la termina igual', () => {
  const { props, onComplete } = espias();
  render(<LabPublicaTuPagina {...props} />);
  entrar();
  cumplirEncargo(1);
  siguiente();
  /* Los cuatro arreglos en un solo tecleo: cada encargo se da por hecho al
   * abrirse, sin pedir una tecla de más. */
  escribir(
    PLANTILLA_HTML.replace(SIN_CONTACTO, '')
      .replace('href="estilos.css"', 'href="estilo.css"')
      .replace('<img src="robot.png">', '<img src="robot.png" alt="Nuestro robot siguiendo la línea">')
      .replace('<a>', '<a href="https://feriadeciencias.mx">')
      .replace('<title></title>', '<title>Robots del 6.º B</title>'),
  );
  for (let n = 2; n <= 5; n += 1) {
    expect(screen.getByTestId('web-encargo').textContent).toContain(`Encargo ${n} de 5`);
    expect(screen.getByTestId('web-logrado')).toBeInTheDocument();
    if (n < 5) siguiente();
  }
  publicar();
  expect(onComplete).toHaveBeenCalledTimes(1);
});

test('jugando MAL · «Jugar otra vez» devuelve la página con sus cuatro fallos', () => {
  const { props, onComplete } = espias();
  render(<LabPublicaTuPagina {...props} />);
  entrar();
  for (let n = 1; n <= 5; n += 1) {
    cumplirEncargo(n);
    if (n < 5) siguiente();
  }
  publicar();
  fireEvent.click(screen.getByText('Jugar otra vez'));

  expect(screen.getByTestId('pgw-portada')).toBeInTheDocument();
  entrar();
  expect(screen.getByTestId('cod-area')).toHaveValue(PLANTILLA_HTML);
  expect(screen.getByTestId('web-url').textContent).toBe('archivo local · index.html');
  expect(screen.queryByTestId('web-publicar')).toBeNull();
  for (let n = 1; n <= 5; n += 1) {
    cumplirEncargo(n);
    if (n < 5) siguiente();
  }
  publicar();
  expect(onComplete).toHaveBeenCalledTimes(2);
});

/* ── 4 · la entrada ───────────────────────────────────────────────────────── */

test('la entrada habla de ESTA clase y abre el laboratorio', () => {
  const { props } = espias();
  render(<EntradaPublicaTuPagina {...props} />);
  expect(screen.getByText('Lo que se revisa antes de dar la dirección')).toBeInTheDocument();
  expect(screen.getByText('Una dirección la abre cualquiera')).toBeInTheDocument();
  expect(screen.getByText('Publicar es lo fácil')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Abre el proyecto'));
  expect(screen.getByTestId('pgw-portada')).toBeInTheDocument();
});
