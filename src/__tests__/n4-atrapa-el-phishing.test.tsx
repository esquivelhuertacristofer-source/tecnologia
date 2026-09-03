/**
 * N4·U6 parada 2 · «Atrapa el phishing».
 *
 * Estas pruebas montan la actividad de verdad —la entrada registrada, no el
 * laboratorio suelto— y la juegan con el DOM en la mano. Tres de ellas son
 * RECORRIDOS COMPLETOS, que es lo único que caza que una clase se haya quedado
 * imposible de terminar, y dos de esos tres se juegan MAL a propósito: marcando
 * todo como anzuelo y marcando todo como de fiar. Una actividad de decidir se
 * rompe justo ahí, cuando el alumno contesta a lo bruto, y ninguna lectura del
 * código lo enseña.
 *
 * Sin matchers de `jest-dom` —ni `toBeInTheDocument` ni `toHaveTextContent`—:
 * `jest.setup.ts` está en el `exclude` del tsconfig, así que su augmentación de
 * tipos nunca llega a `tsc` y esos matchers compilan mal aunque el test pase.
 * Las 47 suites del proyecto usan matchers pelados por ese mismo motivo.
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { EntradaAtrapaElPhishing } from '@/components/activities/n4/estudio/EntradaAtrapaElPhishing';

/** Los diez correos en el orden de la bandeja, con su veredicto bueno. */
const RECORRIDO: { fila: RegExp; anzuelo: boolean }[] = [
  { fila: /Maestra Lucía/, anzuelo: false },
  { fila: /MONEDAS GRATIS/, anzuelo: true },
  { fila: /Biblioteca Tecnia/, anzuelo: false },
  { fila: /Sorteo Escolar/, anzuelo: true },
  { fila: /Diego/, anzuelo: false },
  { fila: /Premios Escolares/, anzuelo: true },
  { fila: /Dirección de la escuela/, anzuelo: true },
  { fila: /Club de dibujo/, anzuelo: false },
  { fila: /Ayuda de Tecnia/, anzuelo: true },
  { fila: /Mamá/, anzuelo: false },
];

const FIAR = /Es de fiar/;
const BORRAR = /Borrarlo y ya/;
const AVISAR = /Aviso y no toco nada/;

const correr = (ms: number) => act(() => void jest.advanceTimersByTime(ms));

const pulsar = (nombre: RegExp) => fireEvent.click(screen.getByRole('button', { name: nombre }));

/** Monta la entrada, entra al laboratorio y enciende el monitor. */
function abrirBandeja() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const { container } = render(
    <EntradaAtrapaElPhishing
      config={{}}
      onProgress={onProgress}
      onScore={onScore}
      onComplete={onComplete}
    />,
  );
  pulsar(/Abre la bandeja de Sofi/);
  pulsar(/Encender/);
  correr(1500);
  return { container, onProgress, onScore, onComplete };
}

/** Contesta las dos preguntas de cierre bien y a la primera. */
function cerrarBien() {
  pulsar(/Lo que te piden/);
  correr(1600);
  pulsar(/No pulso nada, no contesto y se lo enseño a un adulto/);
  correr(1600);
}

const ultimo = (mock: jest.Mock) => mock.mock.calls[mock.mock.calls.length - 1][0];

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('n4-atrapa-el-phishing', () => {
  it('la entrada presenta las cuatro lupas y su CTA abre Tecnia Correo apagado', () => {
    render(<EntradaAtrapaElPhishing config={{}} onProgress={jest.fn()} onScore={jest.fn()} onComplete={jest.fn()} />);

    expect(screen.getByText('Las cuatro lupas')).not.toBeNull();
    expect(screen.getByText('Quién escribe de verdad')).not.toBeNull();
    expect(screen.getByText('A dónde va el enlace')).not.toBeNull();
    expect(screen.getByText('Con qué prisa')).not.toBeNull();
    expect(screen.getByText('Qué te piden')).not.toBeNull();

    pulsar(/Abre la bandeja de Sofi/);
    // El programa arranca apagado: un monitor negro y un solo botón.
    expect(screen.getByRole('button', { name: /Encender/ })).not.toBeNull();
    expect(screen.queryByRole('button', { name: FIAR })).toBeNull();
  });

  it('las cuatro lupas destapan lo que el correo esconde: dirección, destino, petición y prisa', () => {
    abrirBandeja();
    pulsar(/MONEDAS GRATIS/);

    // Antes de mirar, el alumno sólo ve el nombre que el propio remitente puso.
    expect(screen.queryByText('regalos@monedas-gratis-ya.info')).toBeNull();
    expect(screen.queryByText(/185\.42\.19\.7/)).toBeNull();

    pulsar(/Quién escribe de verdad/);
    expect(screen.getByText('regalos@monedas-gratis-ya.info')).not.toBeNull();

    pulsar(/A dónde va el enlace/);
    expect(screen.getAllByText(/185\.42\.19\.7/).length).toBeGreaterThan(0);

    pulsar(/Qué te piden/);
    expect(screen.getByText('Tu usuario y tu contraseña del juego.')).not.toBeNull();

    pulsar(/Con qué prisa/);
    expect(screen.getByText('Sólo hoy, o las monedas se van.')).not.toBeNull();
  });

  it('lo raro no es lo falso: la maestra escribe con faltas y marcarla como anzuelo cuesta y enseña', () => {
    const { onScore } = abrirBandeja();
    pulsar(/Maestra Lucía/);

    pulsar(AVISAR);
    expect(ultimo(onScore)).toBe(94);
    expect(screen.getByText(/no es mirar, es desconfiar de todo/)).not.toBeNull();
    // Y no la da por resuelta: el veredicto bueno sigue disponible.
    expect((screen.getByRole('button', { name: FIAR }) as HTMLButtonElement).disabled).toBe(false);

    pulsar(FIAR);
    correr(1600);
    expect(screen.getByText(/Escribir mal no es una trampa/)).not.toBeNull();
    expect(ultimo(onScore)).toBe(94);
  });

  it('un correo legítimo que te manda a una página sigue siendo legítimo', () => {
    abrirBandeja();
    pulsar(/Biblioteca Tecnia/);
    pulsar(/A dónde va el enlace/);

    // El enlace dice una cosa y va exactamente a esa cosa: eso es lo que lo salva.
    expect(
      screen.getByText(/va de verdad a https:\/\/portal\.tecnia-escuela\.mx\/biblioteca/),
    ).not.toBeNull();

    pulsar(FIAR);
    correr(1600);
    expect(screen.getByText(/Que te manden a una página no es la señal/)).not.toBeNull();
  });

  it('el phishing bien hecho: al caer destapa las cuatro lupas y enseña qué había que mirar', () => {
    const { container, onScore, onComplete } = abrirBandeja();
    pulsar(/Dirección de la escuela/);

    // Cae: sin faltas, con escudo y sin prisa, «de fiar» es la respuesta natural.
    pulsar(FIAR);
    expect(ultimo(onScore)).toBe(94);
    expect(container.querySelectorAll('.phish-hallazgo')).toHaveLength(4);
    expect(screen.getByText('direccion@tecnia-escuela.com.mx')).not.toBeNull();
    expect(screen.getByText(/Caíste, y con éste cae casi todo el mundo/)).not.toBeNull();

    pulsar(AVISAR);
    correr(1600);
    // La nota se pinta partida en trozos —las direcciones van en <code>— así que
    // se lee entera desde el párrafo, no desde el trozo que casó con el texto.
    const leccion = container.querySelector('.phish-leccion-txt');
    expect(leccion?.textContent).toMatch(/Lo único que lo delata es lo que pide: tu contraseña/);
    expect(leccion?.textContent).toContain('tecnia-escuela.com.mx en vez de tecnia-escuela.mx');
    // Caer no expulsa a nadie: la actividad sigue viva y no se ha completado.
    expect(onComplete).not.toHaveBeenCalled();
    expect((screen.getByRole('button', { name: /Club de dibujo/ }) as HTMLButtonElement).disabled).toBe(
      false,
    );
  });

  it('borrar un anzuelo no basta: el programa pide el aviso y no lo da por resuelto', () => {
    const { container, onScore } = abrirBandeja();
    pulsar(/MONEDAS GRATIS/);

    pulsar(BORRAR);
    expect(ultimo(onScore)).toBe(94);
    expect(screen.getByText(/borrarlo no avisa a nadie/)).not.toBeNull();
    // Sigue sin resolver, y el botón bueno queda encendido dentro de la barra.
    expect(container.querySelector('.phish-boton.es-avisar.es-pedido')).not.toBeNull();
    expect(screen.queryByText(/Marcado como anzuelo/)).toBeNull();

    pulsar(AVISAR);
    correr(1600);
    expect(screen.getByText(/Marcado como anzuelo/)).not.toBeNull();
    // La papelera se queda en cero toda la clase: el reflejo bueno no es borrar.
    expect(screen.getByText('Papelera').parentElement?.textContent).toContain('0');
  });

  it('decidir sin abrir una sola lupa se acierta, se nombra y se cuenta en el mueble', () => {
    abrirBandeja();
    pulsar(/Mamá/);
    pulsar(FIAR);

    expect(screen.getByText(/decidiste sin abrir ni una lupa/)).not.toBeNull();
    expect(screen.getByText('Sin mirar').parentElement?.textContent).toContain('1');
  });

  it('recorrido completo bien jugado: diez correos, dos preguntas y termina con 100', () => {
    const { onProgress, onScore, onComplete } = abrirBandeja();

    for (const paso of RECORRIDO) {
      pulsar(paso.fila);
      pulsar(/Qué te piden/);
      pulsar(paso.anzuelo ? AVISAR : FIAR);
      correr(1600);
    }

    // Con los diez resueltos el programa pasa solo a las dos preguntas de cierre.
    expect(screen.getByText(/¿cuál es la pista que NUNCA falla\?/)).not.toBeNull();
    cerrarBien();

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0]).toMatchObject({ score: 100, stars: 3, errores: 0 });
    expect(ultimo(onProgress)).toBe(1);
    expect(ultimo(onScore)).toBe(100);
    expect(screen.getByText('Insignia · Detector de anzuelos')).not.toBeNull();
    expect(screen.getByRole('button', { name: /Jugar otra vez/ })).not.toBeNull();
  });

  it('jugando MAL: marcar los diez como anzuelo no atasca nada y la clase se termina', () => {
    const { onComplete } = abrirBandeja();

    for (const paso of RECORRIDO) {
      pulsar(paso.fila);
      pulsar(AVISAR);
      if (!paso.anzuelo) pulsar(FIAR); // los cinco legítimos rebotan y se corrigen
      correr(1600);
    }

    cerrarBien();
    expect(onComplete).toHaveBeenCalledTimes(1);
    // Cinco legítimos marcados como anzuelo = cinco errores: 100 − 5 × 6.
    expect(onComplete.mock.calls[0][0]).toMatchObject({ score: 70, errores: 5 });
  });

  it('jugando MAL: marcar los diez como de fiar y fallar el cierre deja el puntaje en el piso, pero termina', () => {
    const { onComplete } = abrirBandeja();

    for (const paso of RECORRIDO) {
      pulsar(paso.fila);
      pulsar(FIAR);
      if (paso.anzuelo) pulsar(AVISAR); // los cinco anzuelos mordidos y corregidos
      correr(1600);
    }

    // Y encima las dos trampas del cierre: borrarlo sin avisar, y fiarse de las faltas.
    pulsar(/Que esté mal escrito/);
    pulsar(/Lo que te piden/);
    correr(1600);
    pulsar(/Lo borro y no le digo a nadie/);
    expect(screen.getByText(/pero no avisa a nadie/)).not.toBeNull();
    pulsar(/No pulso nada, no contesto y se lo enseño a un adulto/);
    correr(1600);

    expect(onComplete).toHaveBeenCalledTimes(1);
    // 7 errores serían 58; el piso es 60 y el error nunca borra lo logrado.
    expect(onComplete.mock.calls[0][0]).toMatchObject({ score: 60, errores: 7 });
  });
});
