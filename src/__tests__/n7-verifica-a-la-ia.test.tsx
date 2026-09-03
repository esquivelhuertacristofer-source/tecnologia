/**
 * N7 · «IA I», parada 3 · `n7-verifica-a-la-ia`.
 *
 * Ver `DISENO-N7-n7-verifica-a-la-ia.md` para el porqué de cada decisión.
 *
 * Primer bloque: la SONDA del navegador que pide el pliego antes de escribir
 * la clase («30 min, y puede cambiar el plan») — se deja aquí, como prueba
 * permanente, en vez de tirarla al cerrar el paso 0.
 *
 * Segundo bloque: la clase completa. Cubre las siete pruebas que el pliego
 * declara no negociables (§«Las pruebas que hay que escribir»):
 *   1. La verdad no está en la pantalla.
 *   2. Los predicados de desbloqueo (cinco casos).
 *   3. `sin-respaldo` vs `contradicha` en la fila 4.
 *   4. El presupuesto del acto 3.
 *   5. El recorrido completo hasta `onComplete`, cero temporizadores.
 *   6. Dos vueltas: `repetir` vacía la Hoja.
 *   7. La prueba de la lección falsa.
 *
 * Y se juega MAL a propósito: veredicto sin prueba, párrafo que no habla de
 * lo que se comprueba, el mismo párrafo adjuntado dos veces, Archivo+boletín
 * antes que la tercera fuente, preguntar otra vez, buscar un disparate, la
 * cita sin abrir la página 40, y gastar las dos consultas en lo que no va en
 * el trabajo.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import type { MapaSitios } from '@/components/simuladores/navegador/tiposNavegador';
import { useNavegador } from '@/components/simuladores/navegador/useNavegador';
import { VentanaNavegador } from '@/components/simuladores/navegador/VentanaNavegador';
import { EntradaVerificaALaIa } from '@/components/activities/ia/EntradaVerificaALaIa';
import { RUTA_N7_IA_1 } from '@/components/activities/ia/rutasIA';
import {
  FILAS_ACTO1,
  FILAS_ACTO3,
  MAPA_SITIOS,
  NOMBRE_INVENTADO,
  URL_INFORME_P40,
  agregarPrueba,
  filasQueConfundenSenalConVerdad,
  hayParIndependiente,
  puedeConfirmar,
  puedeJuzgar,
  type Prueba,
} from '@/components/activities/ia/verificaALaIa';
import { CURRICULO } from '@/data/curriculo';

const CITA_FRAGMENTO = 'todo esto viene en el Informe';

// ─────────────────────────────────────────────────────────────────────────
// 0 · La sonda del navegador (pliego, «Lo primero, antes de escribir la
//     clase»): `VentanaNavegador` + `useNavegador` solos, con un mapa de dos
//     páginas.
// ─────────────────────────────────────────────────────────────────────────

const MAPA_SONDA: MapaSitios = {
  'inicio.sonda.mx': {
    url: 'inicio.sonda.mx',
    pestana: 'Inicio',
    titulo: 'Página de inicio',
    autor: null,
    fecha: null,
    cuerpo: { tipo: 'articulo', parrafos: ['Bienvenido a la sonda.'] },
    // `CuerpoPaginaView` sólo pinta `pagina.titulo` para 'articulo'/'ficha'
    // (medido aquí, no en el pliego): una página 'resultados' nunca enseña
    // su propio título, sólo «Resultados para «consulta»». El enlace lleva
    // a la segunda página igual que un resultado de búsqueda lo haría.
    enlaces: [{ etiqueta: 'La otra página', url: 'otra.sonda.mx' }],
  },
  'otra.sonda.mx': {
    url: 'otra.sonda.mx',
    pestana: 'Otra',
    titulo: 'La otra página',
    autor: 'Alguien',
    fecha: 'Hoy',
    cuerpo: { tipo: 'articulo', parrafos: ['Un párrafo cualquiera.'] },
  },
};

function SondaNavegador() {
  const nav = useNavegador({ mapa: MAPA_SONDA, inicio: 'inicio.sonda.mx' });
  const [direccion, setDireccion] = useState(nav.paginaActual.url);
  return (
    <VentanaNavegador
      pestanas={nav.pestanas.map((p) => ({ id: p.id, activa: p.id === nav.activaId, titulo: p.url }))}
      pagina={nav.paginaActual}
      puedeAtras={nav.puedeAtras}
      puedeAdelante={nav.puedeAdelante}
      barraDireccion={{ valor: direccion, onCambiar: setDireccion, onIr: () => nav.navegar(direccion) }}
      onAtras={() => {
        nav.atras();
        setDireccion('');
      }}
      onIrAUrl={(url) => {
        nav.navegar(url);
        setDireccion(url);
      }}
    />
  );
}

describe('sonda del navegador (pliego, paso 0)', () => {
  it('renderiza, busca lleva a resultados, un clic navega, atrás vuelve, y una URL fuera del mapa no revienta', () => {
    render(<SondaNavegador />);
    expect(screen.getByText('Página de inicio')).toBeInTheDocument();

    fireEvent.click(screen.getByText('La otra página'));
    expect(screen.getByText('Un párrafo cualquiera.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Atrás' }));
    expect(screen.getByText('Página de inicio')).toBeInTheDocument();

    const direccion = screen.getByTestId('nav-direccion');
    fireEvent.change(direccion, { target: { value: 'nada.sonda.mx/no-existe' } });
    fireEvent.submit(direccion.closest('form')!);
    // `paginaNoEncontrada` pone el título «Esta página no existe» en el
    // *dato*, pero `CuerpoPaginaView` para `tipo:'vacio'` sólo pinta
    // `cuerpo.mensaje` (medido aquí): el título nunca llega al DOM.
    expect(screen.getByText(/No encontramos ninguna página/)).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 1 · La clase
// ─────────────────────────────────────────────────────────────────────────

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const utils = render(<EntradaVerificaALaIa config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />);
  return { ...utils, onProgress, onScore, onComplete };
}

function abrirLaboratorio() {
  const utils = montar();
  fireEvent.click(screen.getByRole('button', { name: /Abre los dos programas/ }));
  fireEvent.click(screen.getByTestId('tia-empezar'));
  return utils;
}

function elegirFila(container: HTMLElement, id: string) {
  fireEvent.click(container.querySelector(`[data-fila="${id}"]`)!);
}

function elegirAncla(container: HTMLElement, id: string) {
  fireEvent.click(container.querySelector(`[data-ancla="${id}"]`)!);
}

function buscar(consulta: string) {
  const direccion = screen.getByTestId('nav-direccion');
  fireEvent.change(direccion, { target: { value: consulta } });
  fireEvent.submit(direccion.closest('form')!);
}

function abrirResultado(titulo: string) {
  fireEvent.click(screen.getByText(titulo));
}

function adjuntarParrafo(indice: number) {
  const banda = screen.getByTestId('tva-banda');
  fireEvent.click(within(banda).getAllByTestId('tva-adjuntar')[indice]);
}

function adjuntarVacio() {
  fireEvent.click(screen.getByTestId('tva-adjuntar-vacio'));
}

function darVeredicto(container: HTMLElement, veredicto: string) {
  fireEvent.click(container.querySelector(`[data-veredicto="${veredicto}"]`)!);
}

/** Resuelve la fila `f1` completa: ancla, busca, abre las dos fuentes independientes, confirma. */
function resolverF1(container: HTMLElement) {
  elegirFila(container, 'f1');
  elegirAncla(container, 'f1-1989');
  buscar('primer enlace de internet en méxico 1989');
  abrirResultado('Archivo Tecnia · El primer enlace');
  adjuntarParrafo(0);
  fireEvent.click(screen.getByRole('button', { name: 'Atrás' }));
  abrirResultado('Enciclopedia Tecnia · Internet en México');
  adjuntarParrafo(0);
  darVeredicto(container, 'confirmada');
}

function resolverF2(container: HTMLElement) {
  elegirFila(container, 'f2');
  elegirAncla(container, 'f2-pais');
  buscar('con qué país se conectó méxico en 1989');
  abrirResultado('Archivo Tecnia · El primer enlace');
  adjuntarParrafo(1);
  darVeredicto(container, 'contradicha');
}

function resolverF3(container: HTMLElement) {
  elegirFila(container, 'f3');
  elegirAncla(container, 'f3-dominio');
  buscar('cuándo se registró el dominio .mx');
  abrirResultado('Archivo Tecnia · El dominio .mx');
  adjuntarParrafo(0);
  fireEvent.click(screen.getByRole('button', { name: 'Atrás' }));
  abrirResultado('Enciclopedia Tecnia · Internet en México');
  adjuntarParrafo(2);
  darVeredicto(container, 'confirmada');
}

function resolverF4(container: HTMLElement) {
  elegirFila(container, 'f4');
  elegirAncla(container, 'f4-nombre');
  buscar(`ingeniera ${NOMBRE_INVENTADO} internet méxico 1989`);
  adjuntarVacio();
  darVeredicto(container, 'sin-respaldo');
}

function abrirYCitarPagina40() {
  buscar('informe sobre la primera década de la red en méxico');
  abrirResultado('Archivo Tecnia · Informe de la primera década');
  fireEvent.click(screen.getByText('Página 40 · El alcance de la conexión'));
}

describe('n7-verifica-a-la-ia', () => {
  it('vive donde dice el currículo: N7, 1.º de secundaria, parada 3 de 3', () => {
    const n7 = CURRICULO.find((n) => n.n === 7)!;
    expect(n7.grado).toBe('1° de Secundaria');
    expect(n7.edad).toBe('12–13');
    const unidad = n7.unidades.find((u) => u.id === 'n7-ia-1')!;
    expect(unidad.actividades[2].id).toBe('n7-verifica-a-la-ia');
    expect(RUTA_N7_IA_1.map((p) => p.id)).toEqual(unidad.actividades.map((a) => a.id));
    expect(RUTA_N7_IA_1.map((p) => p.titulo)).toEqual(unidad.actividades.map((a) => a.titulo));
  });

  it('abre con la portada de objetivos y las tres cartas de veredicto', () => {
    montar();
    expect(screen.getByText('Sin respaldo')).toBeInTheDocument();
    expect(screen.getByText('La señal no sentencia')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Abre los dos programas/ }));
    const portada = screen.getByTestId('tia-portada');
    expect(within(portada).getByText('Verifica lo que dice la IA')).toBeInTheDocument();
  });

  // ── Prueba nº 1 (no negociable): la verdad no está en la pantalla ───────
  it('nº1 · la verdad no está en la pantalla: sin resolver, las cuatro afirmaciones son indistinguibles', () => {
    const { container } = abrirLaboratorio();
    const partes = Array.from(container.querySelectorAll('[data-parte]')) as HTMLElement[];
    expect(partes).toHaveLength(4);
    const clases = new Set(partes.map((p) => p.className));
    expect(clases.size).toBe(1); // exactamente el mismo conjunto de clases CSS
    for (const p of partes) expect(p.getAttribute('data-marca')).toBe('oculta');

    expect(container.innerHTML).not.toMatch(/\bcierto\b/);
    expect(container.innerHTML).not.toMatch(/\bfalso\b/);
    expect(container.innerHTML).not.toMatch(/data-correcto/);
    // NOTA: `NOMBRE_INVENTADO` SÍ aparece en pantalla — es el propio texto
    // de la afirmación de f4 («…dirigido por la ingeniera Renata
    // Solórzano»), lo que el alumno tiene que leer para saber qué buscar.
    // Lo que no puede estar en pantalla es el VEREDICTO (cierto/falso/
    // data-correcto), ya cubierto arriba — no el nombre del enunciado.
  });

  // ── Prueba nº 2: los predicados de desbloqueo, puros, sin montar nada ───
  it('nº2 · los cinco predicados de desbloqueo', () => {
    const p = (fuenteId: string, hablaDe: string[]): Prueba => ({ url: `x/${fuenteId}`, fuenteId, autor: null, fecha: null, texto: 't', hablaDe });

    expect(puedeJuzgar([], 'a')).toBe(false); // sin prueba → apagado
    expect(puedeJuzgar([p('archivo', ['otra-ancla'])], 'a')).toBe(false); // no habla del ancla → apagado
    expect(puedeJuzgar([p('archivo', ['a'])], 'a')).toBe(true); // una prueba relevante → contradicha/sin-respaldo sí
    expect(puedeConfirmar([p('archivo', ['a'])], 'a')).toBe(false); // …pero confirmada no
    expect(puedeConfirmar([p('archivo', ['a']), p('boletin', ['a'])], 'a')).toBe(false); // boletin copia a archivo
    expect(puedeConfirmar([p('archivo', ['a']), p('enciclopedia', ['a'])], 'a')).toBe(true); // independientes → sí
  });

  it('jugar mal: veredicto sin adjuntar nada está apagado, con el motivo escrito debajo', () => {
    const { container } = abrirLaboratorio();
    elegirFila(container, 'f1');
    expect(container.querySelector('[data-veredicto="confirmada"]')).toBeDisabled();
    expect(container.querySelector('[data-veredicto="contradicha"]')).toBeDisabled();
    expect(container.querySelector('[data-veredicto="sin-respaldo"]')).toBeDisabled();
    expect(screen.getByText(/Adjunta al menos una prueba/)).toBeInTheDocument();
  });

  it('jugar mal: un párrafo que no habla de lo que se comprueba no desbloquea nada, y no resta', () => {
    const { container, onScore } = abrirLaboratorio();
    elegirFila(container, 'f1');
    elegirAncla(container, 'f1-1989');
    buscar('primer enlace de internet en méxico 1989');
    abrirResultado('Archivo Tecnia · El primer enlace');
    adjuntarParrafo(1); // el párrafo del país, no del año/Monterrey
    expect(container.querySelector('[data-veredicto="confirmada"]')).toBeDisabled();
    expect(container.querySelector('[data-veredicto="sin-respaldo"]')).toBeDisabled();
    expect(screen.getByText(/no habla de lo que estás comprobando/)).toBeInTheDocument();
    // `EntradaN5Base` ya llamó `onScore(100)` al montar la portada — lo que
    // hay que probar es que ESTE gesto no restó, no que nunca se llamó.
    expect(onScore).not.toHaveBeenCalledWith(94);
  });

  it('jugar mal: adjuntar el mismo párrafo dos veces cuenta como una sola prueba', () => {
    const { container } = abrirLaboratorio();
    elegirFila(container, 'f1');
    elegirAncla(container, 'f1-1989');
    buscar('primer enlace de internet en méxico 1989');
    abrirResultado('Archivo Tecnia · El primer enlace');
    adjuntarParrafo(0);
    adjuntarParrafo(0);
    expect(screen.getByTestId('tva-contador').textContent).toMatch(/^1 adjuntada/);
  });

  it('jugar mal: Archivo + boletín (que copia) no confirman; se ve la comparación cara a cara; la tercera fuente sí', () => {
    const { container } = abrirLaboratorio();
    elegirFila(container, 'f3');
    elegirAncla(container, 'f3-dominio');
    buscar('cuándo se registró el dominio .mx');
    abrirResultado('Archivo Tecnia · El dominio .mx');
    adjuntarParrafo(0);
    fireEvent.click(screen.getByRole('button', { name: 'Atrás' }));
    abrirResultado('Boletín de la Secundaria 30 · Internet en los 90');
    adjuntarParrafo(0);
    expect(container.querySelector('[data-veredicto="confirmada"]')).toBeDisabled();
    expect(screen.getByTestId('tva-copia')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Atrás' }));
    abrirResultado('Enciclopedia Tecnia · Internet en México');
    adjuntarParrafo(2);
    expect(container.querySelector('[data-veredicto="confirmada"]')).toBeEnabled();
  });

  // ── Prueba nº 3: sin-respaldo vs contradicha en la fila 4 ────────────────
  it('nº3 · fila 4: `contradicha` resta y no cierra; `sin-respaldo` cierra el encargo', () => {
    const { container, onScore } = abrirLaboratorio();
    elegirFila(container, 'f4');
    elegirAncla(container, 'f4-nombre');
    buscar(`ingeniera ${NOMBRE_INVENTADO} internet méxico 1989`);
    adjuntarVacio();

    darVeredicto(container, 'contradicha');
    expect(onScore).toHaveBeenLastCalledWith(94);
    expect(screen.queryByTestId('tva-resuelta')).toBeNull();

    darVeredicto(container, 'sin-respaldo');
    expect(screen.getByTestId('tva-resuelta')).toBeInTheDocument();
  });

  it('jugar mal: preguntarle otra vez resta y repite exactamente lo mismo, sin avanzar ningún paso', () => {
    const { onScore } = abrirLaboratorio();
    const antes = screen.getByTestId('asis-hilo').textContent;
    fireEvent.click(screen.getByText('Pregúntale otra vez'));
    expect(onScore).toHaveBeenLastCalledWith(94);
    const despues = screen.getByTestId('asis-hilo').textContent;
    expect(despues).toContain(antes);
    // El texto se repitió una segunda vez, palabra por palabra.
    expect(despues!.split(NOMBRE_INVENTADO)).toHaveLength(3);
  });

  it('jugar mal: buscar cualquier disparate no rompe nada, no resta, y no cuenta como prueba de otra fila', () => {
    const { container, onScore } = abrirLaboratorio();
    elegirFila(container, 'f1');
    elegirAncla(container, 'f1-1989');
    buscar('esto es un disparate que nadie escribió');
    // Igual que en la sonda: el 'vacio' de `paginaNoEncontrada` sólo pinta
    // `cuerpo.mensaje`, nunca `pagina.titulo` — medido, no en el pliego.
    // Y aparece DOS veces a la vez: en `nav-pagina` y en la banda de
    // adjuntar (su propia variante «vacío» también enseña el mensaje).
    expect(screen.getAllByText(/No encontramos ninguna página/).length).toBeGreaterThan(0);
    expect(onScore).not.toHaveBeenCalledWith(94); // ninguna resta: buscar nunca cuesta

    // `pruebaDeVacio` no distingue «buscó con cuidado y no encontró nada
    // sobre 1989» de «escribió un garabato y cayó en una página vacía» — por
    // diseño (ver el comentario de la función en `verificaALaIa.ts`), el
    // `hablaDe` sale del ancla que la fila TENÍA activa, no de la consulta.
    // Así que esto SÍ habilita `sin-respaldo` para f1 — pero f1.correcto es
    // 'confirmada': elegirlo sigue siendo la respuesta incorrecta, resta, y
    // no sella la fila. La seguridad está en la corrección, no en el botón.
    adjuntarVacio();
    expect(container.querySelector('[data-veredicto="sin-respaldo"]')).toBeEnabled();
    darVeredicto(container, 'sin-respaldo');
    expect(onScore).toHaveBeenLastCalledWith(94);
    expect(screen.queryByTestId('tva-resuelta')).toBeNull();
  });

  it('jugar mal: la cita del acto 2 no se puede elegir sin haber abierto la página 40', () => {
    const { container } = abrirLaboratorio();
    resolverF1(container);
    resolverF2(container);
    resolverF3(container);
    resolverF4(container);

    // Aparece dos veces a la vez: en el globo de Bit y en la Hoja — ninguna
    // de las dos es un botón, así que no estorba a `getAllByRole('button')`.
    expect(screen.getAllByText(new RegExp(CITA_FRAGMENTO)).length).toBeGreaterThan(0);
    // Con `within(tva-hoja)`: el regex /informe/i también matchea la pestaña
    // del navegador cuando abre «Informe · Portada» (medido, no en el
    // pliego) — hay que quedarse sólo con los botones de opción de la Hoja.
    const hoja = screen.getByTestId('tva-hoja');
    const opciones = within(hoja).getAllByRole('button', { name: /informe/i });
    for (const o of opciones) expect(o).toBeDisabled();

    buscar('informe sobre la primera década de la red en méxico');
    abrirResultado('Archivo Tecnia · Informe de la primera década');
    // Buscado, pero NO abierto por la página 40 todavía.
    for (const o of within(hoja).getAllByRole('button', { name: /informe/i })) expect(o).toBeDisabled();

    fireEvent.click(screen.getByText('Página 40 · El alcance de la conexión'));
    expect(within(hoja).getByRole('button', { name: 'El informe existe, pero no dice eso.' })).toBeEnabled();
  });

  it('nº4 · el presupuesto del acto 3: gastar en q4/q5 resta; en q1/q2/q3 no; a 0 se apagan los 📎', () => {
    const { container, onScore } = abrirLaboratorio();
    resolverF1(container);
    resolverF2(container);
    resolverF3(container);
    resolverF4(container);
    abrirYCitarPagina40();
    fireEvent.click(screen.getByRole('button', { name: 'El informe existe, pero no dice eso.' }));
    fireEvent.click(screen.getByText('Pídele el cierre del trabajo'));

    expect(screen.getByTestId('tva-consultas').textContent).toMatch(/2/);

    // Gasto correcto: q1 va en el trabajo.
    elegirFila(container, 'q1');
    elegirAncla(container, 'q1-nodos');
    buscar('nsfnet treinta mil computadoras méxico 1989');
    abrirResultado('Archivo Tecnia · Informe de la primera década');
    fireEvent.click(screen.getByText('Página 40 · El alcance de la conexión'));
    const antesDeGastar = onScore.mock.calls.length;
    adjuntarParrafo(0);
    expect(screen.getByTestId('tva-consultas').textContent).toMatch(/1/);
    expect(onScore.mock.calls.length).toBe(antesDeGastar); // no restó: q1 sí va en el trabajo

    // Gasto incorrecto: q4 no va en el trabajo.
    elegirFila(container, 'q4');
    elegirAncla(container, 'q4-martes');
    buscar('primer correo electrónico méxico qué día se envió');
    adjuntarVacio();
    expect(onScore).toHaveBeenLastCalledWith(94);
    expect(screen.getByTestId('tva-consultas').textContent).toMatch(/0/);

    // Sin consultas: los 📎 del acto 3 se apagan, incluso en una fila nueva.
    // La página que quedó abierta es la «vacía» de q4 (sin resultado): la
    // banda pinta `tva-adjuntar-vacio`, no `tva-adjuntar` (medido: cada
    // variante de `BandaAdjuntar` tiene su propio testid).
    elegirFila(container, 'q2');
    elegirAncla(container, 'q2-primero');
    expect(screen.getByTestId('tva-adjuntar-vacio')).toBeDisabled();
    expect(screen.getByTestId('tva-cerrar-ficha')).toBeInTheDocument();
  });

  // ── Prueba nº 7: la lección falsa ─────────────────────────────────────
  it('nº7 · la guarda de la lección falsa: «señal = falsa» saca 2 de 4, no 4 de 4', () => {
    expect(filasQueConfundenSenalConVerdad(FILAS_ACTO1)).toBe(2);
  });

  it('las cuatro casillas de la calibración están ocupadas (pliego §A)', () => {
    const [f1, f2, f3, f4] = FILAS_ACTO1;
    expect(f1.senales.length).toBeGreaterThan(0);
    expect(f1.correcto).toBe('confirmada'); // con señal, y CIERTA
    expect(f2.senales.length).toBe(0);
    expect(f2.correcto).toBe('contradicha'); // sin señal, y FALSA
    expect(f3.senales.length).toBe(0);
    expect(f3.correcto).toBe('confirmada'); // sin señal, y cierta
    expect(f4.senales.length).toBeGreaterThan(0);
    expect(f4.correcto).toBe('sin-respaldo'); // con señal, y no se sostiene
  });

  // ── Prueba nº 5: el recorrido completo ───────────────────────────────
  it('nº5 · recorrido completo hasta onComplete: partida perfecta, 100 y tres estrellas', () => {
    const { container, onComplete, onProgress, onScore } = abrirLaboratorio();

    resolverF1(container);
    resolverF2(container);
    resolverF3(container);
    resolverF4(container);
    abrirYCitarPagina40();
    fireEvent.click(screen.getByRole('button', { name: 'El informe existe, pero no dice eso.' }));

    fireEvent.click(screen.getByText('Pídele el cierre del trabajo'));
    elegirFila(container, 'q1');
    buscar('nsfnet treinta mil computadoras méxico 1989');
    abrirResultado('Enciclopedia Tecnia · Internet en México');
    adjuntarParrafo(3);
    elegirFila(container, 'q2');
    buscar('primer país de américa latina en registrar su dominio de internet');
    abrirResultado('Enciclopedia Tecnia · Dominios de país en América Latina');
    adjuntarParrafo(0);

    expect(screen.getByTestId('tva-consultas').textContent).toMatch(/0/);
    fireEvent.click(screen.getByTestId('tva-cerrar-ficha'));
    fireEvent.click(screen.getByRole('button', { name: /Las quito, o las escribo diciendo de dónde salieron/ }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const resultado = onComplete.mock.calls[0][0];
    expect(resultado.score).toBe(100);
    expect(resultado.stars).toBe(3);
    expect(resultado.errores).toBe(0);
    expect(Math.max(...onProgress.mock.calls.map((c) => c[0]))).toBe(1);
    expect(Math.min(...onScore.mock.calls.map((c) => c[0]))).toBe(100);
    expect(screen.getByText('¡La ficha quedó a salvo!')).toBeInTheDocument();
  });

  it('cero temporizadores: `useAsistente` con velocidad 0 no programa ni un reloj', () => {
    const { container } = abrirLaboratorio();
    jest.useFakeTimers();
    elegirFila(container, 'f1');
    elegirAncla(container, 'f1-1989');
    expect(jest.getTimerCount()).toBe(0);
    jest.useRealTimers();
  });

  // ── Prueba nº 6: dos vueltas ──────────────────────────────────────────
  it('nº6 · dos vueltas: repetir tras terminar deja la Hoja entera en blanco, no sólo el arnés', () => {
    const { container, onComplete } = abrirLaboratorio();
    resolverF1(container);
    resolverF2(container);
    resolverF3(container);
    resolverF4(container);
    abrirYCitarPagina40();
    fireEvent.click(screen.getByRole('button', { name: 'El informe existe, pero no dice eso.' }));
    fireEvent.click(screen.getByText('Pídele el cierre del trabajo'));
    elegirFila(container, 'q1');
    buscar('nsfnet treinta mil computadoras méxico 1989');
    abrirResultado('Enciclopedia Tecnia · Internet en México');
    adjuntarParrafo(3);
    elegirFila(container, 'q2');
    buscar('primer país de américa latina en registrar su dominio de internet');
    abrirResultado('Enciclopedia Tecnia · Dominios de país en América Latina');
    adjuntarParrafo(0);
    fireEvent.click(screen.getByTestId('tva-cerrar-ficha'));
    fireEvent.click(screen.getByRole('button', { name: /Las quito, o las escribo diciendo de dónde salieron/ }));
    expect(onComplete).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Jugar otra vez'));
    elegirFila(container, 'f1');
    expect(screen.getByTestId('tva-contador').textContent).toMatch(/^0 adjuntada/);
    expect(container.querySelector('[data-fila="f1"]')).not.toHaveClass('es-resuelta');
    // Acto 3 ya no está montado: `repetir()` vuelve a 'acto1', no a 'acto3'.
    expect(screen.queryByTestId('tva-consultas')).toBeNull();
  });

  // ── Datos: independencia de fuentes, pura ────────────────────────────
  it('la independencia de fuentes es simétrica y respeta la copia', () => {
    const a: Prueba = { url: 'a', fuenteId: 'archivo', autor: null, fecha: null, texto: 't1', hablaDe: ['x'] };
    const b: Prueba = { url: 'b', fuenteId: 'boletin', autor: null, fecha: null, texto: 't1', hablaDe: ['x'] };
    const c: Prueba = { url: 'c', fuenteId: 'enciclopedia', autor: null, fecha: null, texto: 't2', hablaDe: ['x'] };
    expect(hayParIndependiente([a, b])).toBe(false); // boletín copia a archivo
    expect(hayParIndependiente([a, c])).toBe(true);
    expect(hayParIndependiente([b, c])).toBe(true);
  });

  it('agregarPrueba devuelve el MISMO arreglo por identidad cuando el párrafo ya estaba', () => {
    const p: Prueba = { url: 'a', fuenteId: 'archivo', autor: null, fecha: null, texto: 't1', hablaDe: ['x'] };
    const uno: readonly Prueba[] = [p];
    const dos = agregarPrueba(uno, { ...p });
    expect(dos).toBe(uno);
  });

  it('el mapa de sitios cubre las cinco filas del acto 3 con sus anclas', () => {
    for (const f of FILAS_ACTO3) {
      expect(f.anclas.length).toBeGreaterThan(0);
    }
    expect(MAPA_SITIOS[URL_INFORME_P40]).toBeDefined();
  });
});
