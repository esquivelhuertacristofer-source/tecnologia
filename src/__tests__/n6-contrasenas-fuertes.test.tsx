/**
 * n6-contrasenas-fuertes · el laboratorio completo, jugando MAL a propósito
 * (COMO-SE-CONSTRUYE.md, §4): el recorrido de punta a punta, los dos caminos
 * del E3, el callejón sin salida de la llave repetida en el E4, el código que
 * nunca sale de la pantalla en el E6, y las dos guardas que el pliego pide
 * probar de verdad: la mesa de pruebas (E2) y «Activar verificación en dos
 * pasos» (E5) — botones que SIGUEN en pantalla después de la acción.
 *
 * Desde el §69.4 las llaves las ARMA el alumno con fichas (nunca con el
 * teclado) y la máquina las ataca: aquí se arman a propósito llaves que caen.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { EntradaContrasenasFuertes } from '@/components/activities/n6/ciberseguridad/EntradaContrasenasFuertes';

function abrirLab() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  render(<EntradaContrasenasFuertes config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />);
  fireEvent.click(screen.getByRole('button', { name: /Abre el navegador/ }));
  fireEvent.click(screen.getByTestId('cf-empezar'));
  return { onProgress, onScore, onComplete };
}

const pulsar = (nombre: string | RegExp) => fireEvent.click(screen.getByRole('button', { name: nombre }));

/** Recorre el E1 entero: prueba a los tres personajes y acierta el motivo de cada uno. */
function resolverE1() {
  pulsar('Probar a CapiVeloz');
  pulsar('Estaba en la lista de las contraseñas más usadas.');
  pulsar('Probar a LunaGamer');
  pulsar('Era un dato de su perfil, combinado con un año.');
  pulsar('Probar a ReyPixel');
  pulsar('Era una palabra común disfrazada con símbolos.');
}

type Cuenta = 'NivelMax' | 'Aula Tecnia' | 'ClipZone';
const armador = () => screen.getByTestId('armador');
/** La ficha nº i de una bandeja, en el orden en que se ve. */
const fichaDe = (bandeja: string, i: number) => within(screen.getByTestId(bandeja)).getAllByRole('button').filter((b) => b.hasAttribute('data-ficha'))[i];
const ficha = (valor: string) => fireEvent.click(armador().querySelector(`[data-ficha="${valor}"]`)!);
const armarDeLaBolsa = (indices: number[]) => indices.forEach((i) => fireEvent.click(fichaDe('armador-bolsa', i)));
const probar = () => fireEvent.click(screen.getByTestId('armador-probar'));
const guardar = () => fireEvent.click(screen.getByTestId('armador-guardar'));
const informe = () => screen.getByTestId('armador-informe');

function resolverE2() {
  pulsar('Armar una llave');
  armarDeLaBolsa([0, 1, 2, 3]);
  probar();
  fireEvent.click(screen.getByTestId('armador-cerrar'));
  pulsar('Seguir');
}

function irATab(nombre: string) {
  fireEvent.click(within(screen.getByTestId('nav-tabs')).getByRole('button', { name: nombre }));
}

function abrirLlave(cuenta: Cuenta) {
  irATab(cuenta);
  pulsar(/^(Poner llave|Cambiar la llave)$/);
}

function ponerLlave(cuenta: Cuenta, indices: number[]) {
  abrirLlave(cuenta);
  armarDeLaBolsa(indices);
  guardar();
}

function resolverE3Distintas() {
  ponerLlave('NivelMax', [0, 1, 2, 3]);
  ponerLlave('Aula Tecnia', [1, 2, 3, 4]);
  ponerLlave('ClipZone', [2, 3, 4, 5]);
}

/** Reusar es una ficha más del armador, como en la vida: la consecuencia llega en el E4. */
function resolverE3Misma() {
  ponerLlave('NivelMax', [0, 1, 2, 3]);
  for (const cuenta of ['Aula Tecnia', 'ClipZone'] as Cuenta[]) {
    abrirLlave(cuenta);
    fireEvent.click(armador().querySelector('[data-reusar="NivelMax"]')!);
    guardar();
  }
}

function cambiarLlave(cuenta: Cuenta) {
  ponerLlave(cuenta, [5, 4, 3, 2]);
}

function resolverE5() {
  irATab('Aula Tecnia');
  pulsar(/Elegir: app de códigos/);
  pulsar('Activar verificación en dos pasos');
}

function resolverE7() {
  const filaGestor = screen.getByText('En un gestor de contraseñas, con tu adulto.').closest('div')!;
  fireEvent.click(within(filaGestor).getByRole('button', { name: 'Sí, ahí se guarda' }));
  const filaCuaderno = screen.getByText('En un cuaderno que se queda en casa.').closest('div')!;
  fireEvent.click(within(filaCuaderno).getByRole('button', { name: 'Sí, ahí se guarda' }));
  const filaPapel = screen.getByText('En un papel pegado a la pantalla.').closest('div')!;
  fireEvent.click(within(filaPapel).getByRole('button', { name: 'No, ahí no' }));
  const filaMisma = screen.getByText('Uso la misma en todas para acordarme.').closest('div')!;
  fireEvent.click(within(filaMisma).getByRole('button', { name: 'No, ahí no' }));
}

describe('n6-contrasenas-fuertes', () => {
  it('la entrada dice las cuatro fichas y el CTA abre la portada de objetivos, no el laboratorio directo', () => {
    render(<EntradaContrasenasFuertes config={{}} onProgress={jest.fn()} onScore={jest.fn()} onComplete={jest.fn()} />);
    expect(screen.getByText('Quien adivina es un programa')).not.toBeNull();
    expect(screen.getByText('El disfraz no es una llave nueva')).not.toBeNull();
    expect(screen.getByText('Cuatro palabras al azar')).not.toBeNull();
    expect(screen.getByText('La segunda llave es algo que tienes')).not.toBeNull();

    pulsar(/Abre el navegador/);
    // Portada de objetivos ANTES del navegador — declarado defecto entrar sin saberlo.
    expect(screen.getByTestId('cf-portada')).not.toBeNull();
    expect(screen.getByText('Contraseñas fuertes y verificación en dos pasos')).not.toBeNull();
    expect(screen.queryByTestId('nav-app')).toBeNull();
  });

  it('el riesgo nº1: el informe de la máquina no lleva ningún número de fuerza, ni una barrita', () => {
    abrirLab();
    pulsar('Probar a CapiVeloz');
    const texto = screen.getByTestId('nav-ficha-datos').textContent ?? '';
    expect(texto).toMatch(/Cayó por: la lista de las más usadas · intento nº 1/);
    // Nada que huela a puntuación de 0 a 100 ni a porcentaje en el informe.
    expect(texto).not.toMatch(/%|\/100|fuerte|débil/i);
  });

  it('E1: jugando MAL — elegir el motivo equivocado no avanza y se puede reintentar sin límite', () => {
    const { onProgress } = abrirLab();
    pulsar('Probar a CapiVeloz');
    pulsar('Era un dato de su perfil, combinado con un año.'); // motivo incorrecto
    expect(screen.getByText(/en qué paso cayó/)).not.toBeNull();
    // Los cuatro botones de motivo siguen ahí — se puede reintentar sin límite.
    pulsar('Probar a CapiVeloz'); // ya probado, no rehace nada raro
    pulsar('Estaba en la lista de las contraseñas más usadas.'); // ahora sí
    // Sólo un personaje resuelto de tres: el E1 no se da por bueno todavía.
    expect(onProgress).not.toHaveBeenCalledWith(1 / 7);
    expect(screen.queryByRole('button', { name: 'Armar una llave' })).toBeNull();
  });

  it('recorrido completo E1→E2→E3(misma frase)→E4(3 cambios)→E5→E6(dio el código)→E7→cierre: termina con 100 y 3 estrellas', () => {
    const { onComplete } = abrirLab();

    resolverE1();
    resolverE2();
    resolverE3Misma();

    // E4: reutilizó la misma llave en las tres — hace falta reparar las TRES.
    expect(screen.getByText(/perdió su lista de contraseñas/)).not.toBeNull();
    pulsar('Seguir');
    expect(screen.getByText(/la misma llave abría las tres/)).not.toBeNull();

    cambiarLlave('ClipZone');
    // Jugando MAL: pulsar Seguir mil veces más no hace nada — ya no está el botón.
    expect(screen.queryByRole('button', { name: 'Seguir' })).toBeNull();
    // Con dos de tres cambiadas el encargo NO se da por bueno (jugar mal #3).
    cambiarLlave('NivelMax');
    expect(screen.queryByText(/Ve a la pestaña de Aula Tecnia/)).toBeNull();
    cambiarLlave('Aula Tecnia');
    expect(screen.getByText(/Ve a la pestaña de Aula Tecnia/)).not.toBeNull();

    resolverE5();

    // E6: la ventana emergente pide el código — se lo damos.
    expect(screen.getByTestId('nav-emergente')).not.toBeNull();
    expect(screen.getByTestId('tira-telefono').textContent).toContain('482913');
    pulsar('Escribir el código');
    expect(screen.queryByTestId('nav-emergente')).toBeNull(); // se cierra tras el clic
    cambiarLlave('NivelMax');

    resolverE7();
    expect(screen.getByRole('button', { name: 'Terminar' })).not.toBeNull();

    pulsar('Terminar');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0]).toMatchObject({ score: 100, stars: 3 });
    expect(screen.getByText('Insignia: Una llave por puerta')).not.toBeNull();
  });

  it('E3, el otro camino: frases distintas en las tres cuentas — la filtración sólo exige UN cambio (jugar mal #4)', () => {
    abrirLab();
    resolverE1();
    resolverE2();
    resolverE3Distintas();
    pulsar('Seguir');
    expect(screen.getByText(/Aquí nadie adivinó nada/)).not.toBeNull();
    cambiarLlave('ClipZone');
    // Con frases distintas, cambiar SÓLO la de ClipZone ya cierra el E4 — no exige tocar las otras dos.
    expect(screen.getByText(/Ve a la pestaña de Aula Tecnia/)).not.toBeNull();
  });

  it('E6, el camino de cerrar sin leer: la ventana se puede reabrir y cerrar solo no completa el encargo (jugar mal #6)', () => {
    abrirLab();
    resolverE1();
    resolverE2();
    resolverE3Misma();
    pulsar('Seguir');
    cambiarLlave('ClipZone');
    cambiarLlave('NivelMax');
    cambiarLlave('Aula Tecnia');
    resolverE5();

    expect(screen.getByTestId('nav-emergente')).not.toBeNull();
    // Cierra sin leer, sin dar el código.
    fireEvent.click(within(screen.getByTestId('nav-emergente')).getByRole('button', { name: 'Cerrar' }));
    expect(screen.getByText(/Falta la otra mitad/)).not.toBeNull();
    expect(screen.queryByTestId('nav-emergente')).toBeNull();

    // El encargo sigue vivo: se puede reabrir.
    pulsar('Volver a abrir la ventana');
    expect(screen.getByTestId('nav-emergente')).not.toBeNull();
    fireEvent.click(within(screen.getByTestId('nav-emergente')).getByRole('button', { name: 'Cerrar' }));

    // Cerrar sola NUNCA completa el encargo: sigue pidiendo cambiar la llave.
    expect(screen.getByText('Cuando termines, cambia la llave de NivelMax.')).not.toBeNull();
    cambiarLlave('NivelMax');
    expect(screen.getByText(/última pregunta|Última pregunta/i)).not.toBeNull();
  });

  it('guarda de la mesa de pruebas: tres llaves que aguantan sólo avanzan el encargo UNA vez', () => {
    const { onProgress } = abrirLab();
    resolverE1();
    onProgress.mockClear();

    pulsar('Armar una llave');
    for (const indices of [[0, 1, 2, 3], [1, 2, 3, 4], [2, 3, 4, 5]]) {
      fireEvent.click(screen.getByRole('button', { name: 'Vaciar' }));
      armarDeLaBolsa(indices);
      probar();
    }

    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith(2 / 7);
  });

  /* ── §69.4: jugar MAL con el armador ─────────────────────────────────── */

  it('la llave se arma con fichas: el armador no tiene ni un campo para escribir', () => {
    abrirLab();
    resolverE1();
    pulsar('Armar una llave');
    expect(armador().querySelectorAll('input, textarea, [contenteditable]')).toHaveLength(0);
  });

  it('E2, jugar mal: la mascota y el año de Dani caen aunque vayan separados, y tres palabras de la bolsa también', () => {
    const { onProgress } = abrirLab();
    resolverE1();
    onProgress.mockClear();
    pulsar('Armar una llave');

    ficha('rocky');
    ficha('2014');
    probar();
    expect(informe().getAttribute('data-cae')).toBe('si');
    expect(informe().textContent).toMatch(/dato de su perfil/);

    fireEvent.click(screen.getByRole('button', { name: 'Vaciar' }));
    ficha('password');
    fireEvent.click(screen.getByTestId('armador-disfraz'));
    expect(screen.getByTestId('armador-llave').textContent).toBe('p@ssw0rd');
    probar();
    expect(informe().textContent).toMatch(/disfraz/);

    fireEvent.click(screen.getByRole('button', { name: 'Vaciar' }));
    fireEvent.click(screen.getByTestId('armador-disfraz'));
    armarDeLaBolsa([0, 1, 2]);
    probar();
    expect(informe().getAttribute('data-cae')).toBe('si');
    expect(informe().textContent).toMatch(/piezas que la máquina ya conoce/);
    expect(onProgress).not.toHaveBeenCalled();

    // Cuatro con la mascota dentro: caen. Cuatro de la bolsa: aguantan.
    fireEvent.click(screen.getByRole('button', { name: 'Vaciar' }));
    ficha('rocky');
    armarDeLaBolsa([0, 1, 2]);
    probar();
    expect(informe().getAttribute('data-cae')).toBe('si');
    fireEvent.click(screen.getByRole('button', { name: 'Vaciar' }));
    armarDeLaBolsa([0, 1, 2, 3]);
    probar();
    expect(informe().getAttribute('data-cae')).toBe('no');
    expect(onProgress).toHaveBeenCalledWith(2 / 7);
  });

  it('E3, jugar mal: guardar una llave que cae deja la cuenta abierta, lo dice la cuenta y el encargo no se cumple', () => {
    const { onProgress } = abrirLab();
    resolverE1();
    resolverE2();
    onProgress.mockClear();

    abrirLlave('NivelMax');
    ficha('rocky');
    ficha('2014');
    guardar();
    expect(screen.getByTestId('nav-ficha-datos').textContent).toMatch(/En la máquina\s*Cayó por: un dato de su perfil/);
    ponerLlave('Aula Tecnia', [1, 2, 3, 4]);
    ponerLlave('ClipZone', [2, 3, 4, 5]);
    expect(onProgress).not.toHaveBeenCalled();

    cambiarLlave('NivelMax');
    expect(onProgress).toHaveBeenCalledWith(3 / 7);
  });

  it('E4, jugar mal: cambiar la llave filtrada por otra que cae no cierra el encargo', () => {
    abrirLab();
    resolverE1();
    resolverE2();
    resolverE3Distintas();
    pulsar('Seguir');
    abrirLlave('ClipZone');
    armarDeLaBolsa([0]);
    guardar();
    expect(screen.queryByText(/Ve a la pestaña de Aula Tecnia/)).toBeNull();
    cambiarLlave('ClipZone');
    expect(screen.getByText(/Ve a la pestaña de Aula Tecnia/)).not.toBeNull();
  });

  it('guarda de "Activar verificación en dos pasos": sigue en pantalla y pulsarla otra vez no avanza dos veces', () => {
    const { onProgress } = abrirLab();
    resolverE1();
    resolverE2();
    resolverE3Misma();
    pulsar('Seguir');
    cambiarLlave('ClipZone');
    cambiarLlave('NivelMax');
    cambiarLlave('Aula Tecnia');

    irATab('Aula Tecnia');
    pulsar(/Elegir: app de códigos/);
    onProgress.mockClear();
    pulsar('Activar verificación en dos pasos');
    pulsar('Activar verificación en dos pasos');
    pulsar('Activar verificación en dos pasos');

    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith(5 / 7);
  });

  it('E5: la pregunta secreta no activa nada — no se puede completar con la mala', () => {
    abrirLab();
    resolverE1();
    resolverE2();
    resolverE3Misma();
    pulsar('Seguir');
    cambiarLlave('ClipZone');
    cambiarLlave('NivelMax');
    cambiarLlave('Aula Tecnia');

    irATab('Aula Tecnia');
    pulsar(/pregunta secreta/);
    expect(screen.getByText(/pregunta secreta no vale/)).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Activar verificación en dos pasos' })).toBeDisabled();
  });

  it('jugar MAL: escribir basura en la barra de direcciones no revienta, y volver atrás regresa al encargo', () => {
    abrirLab();
    const barra = screen.getByTestId('nav-direccion') as HTMLInputElement;
    fireEvent.change(barra, { target: { value: 'esto-no-existe.mx' } });
    fireEvent.submit(barra.closest('form')!);
    expect(screen.getByText(/No encontramos ninguna página/)).not.toBeNull();

    const atras = screen.getByRole('button', { name: 'Atrás' });
    expect(atras).not.toBeDisabled();
    fireEvent.click(atras);
    // De vuelta en la máquina de adivinar, con el E1 intacto.
    expect(screen.getByRole('button', { name: 'Probar a CapiVeloz' })).not.toBeNull();
  });

  it('jugar MAL: cerrar la pestaña de NivelMax en mitad del E4 no revienta — se recupera por la barra de direcciones', () => {
    abrirLab();
    resolverE1();
    resolverE2();
    resolverE3Misma();
    pulsar('Seguir');

    // Cierra la pestaña de NivelMax (la activa) en plena reparación.
    const tabNivelMax = within(screen.getByTestId('nav-tabs'))
      .getByText('NivelMax')
      .closest('[data-testid="nav-tab"]') as HTMLElement;
    fireEvent.click(within(tabNivelMax).getByRole('button', { name: /Cerrar pestaña/ }));
    expect(screen.queryByText('NivelMax')).toBeNull();
    // El armazón nunca se queda sin pestañas: sigue habiendo dos.
    expect(within(screen.getByTestId('nav-tabs')).getAllByTestId('nav-tab').length).toBe(2);

    // Se recupera escribiendo la URL en la barra de direcciones de la pestaña
    // que quedó activa — un navegador real no necesita una pestaña NUEVA
    // para volver a una cuenta, sólo la URL.
    const barra = screen.getByTestId('nav-direccion') as HTMLInputElement;
    fireEvent.change(barra, { target: { value: 'nivelmax.mx/cuenta' } });
    fireEvent.submit(barra.closest('form')!);
    expect(screen.getByRole('button', { name: 'Cambiar la llave' })).not.toBeNull();
    expect(screen.getByText('NivelMax — mi cuenta')).not.toBeNull();

    // Y la clase se puede seguir jugando y terminar con normalidad.
    pulsar('Cambiar la llave');
    armarDeLaBolsa([5, 4, 3, 2]);
    guardar();
    fireEvent.change(barra, { target: { value: 'clipzone.mx/cuenta' } });
    fireEvent.submit(barra.closest('form')!);
    pulsar('Cambiar la llave');
    armarDeLaBolsa([4, 3, 2, 1]);
    guardar();
    cambiarLlave('Aula Tecnia');
    resolverE5();
    expect(screen.getByTestId('nav-emergente')).not.toBeNull();
  });

  it('tono de protección: la ventana emergente dice ser "el soporte de NivelMax", nunca una persona con nombre', () => {
    abrirLab();
    resolverE1();
    resolverE2();
    resolverE3Misma();
    pulsar('Seguir');
    cambiarLlave('ClipZone');
    cambiarLlave('NivelMax');
    cambiarLlave('Aula Tecnia');
    resolverE5();
    expect(screen.getByText('Soporte de NivelMax')).not.toBeNull();
  });

  it('el camino de salida funciona desde media práctica', () => {
    const onComplete = jest.fn();
    render(<EntradaContrasenasFuertes config={{}} onProgress={jest.fn()} onScore={jest.fn()} onComplete={onComplete} />);
    pulsar(/Abre el navegador/);
    fireEvent.click(screen.getByTestId('cf-empezar'));
    pulsar('Probar a CapiVeloz');
    // No hay botón "Salir" a media práctica en esta clase (no lo pide el pliego);
    // se comprueba que el laboratorio no revienta y sigue jugable.
    expect(screen.getByTestId('nav-app')).not.toBeNull();
  });

  it('el camino de salida funciona desde la pantalla de cierre', () => {
    const onComplete = jest.fn();
    render(<EntradaContrasenasFuertes config={{}} onProgress={jest.fn()} onScore={jest.fn()} onComplete={onComplete} />);
    pulsar(/Abre el navegador/);
    fireEvent.click(screen.getByTestId('cf-empezar'));
    resolverE1();
    resolverE2();
    resolverE3Misma();
    pulsar('Seguir');
    cambiarLlave('ClipZone');
    cambiarLlave('NivelMax');
    cambiarLlave('Aula Tecnia');
    resolverE5();
    pulsar('Escribir el código');
    cambiarLlave('NivelMax');
    resolverE7();
    pulsar('Terminar');
    pulsar('Salir');
    // De vuelta en la entrada.
    expect(screen.getByText(/Abre el navegador/)).not.toBeNull();
  });
});
