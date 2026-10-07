/**
 * N6 · «Diseño y multimedia», parada 3 de 3 · `n6-crea-con-ia` (§69.3).
 *
 * La clase ya no tiene tandas fijas: la imagen sale de la petición con el
 * generador de `simuladores/generador`. Como el generador es determinista por
 * semilla, la prueba calcula con `generar` lo mismo que verá el alumno y así
 * sabe, sin mirar el componente, qué imagen cumple y cuál no.
 *
 * Se juega MAL a propósito: generar sin piezas, la petición vaga, olvidar
 * «sin texto», cambiar algo entre las dos generaciones, poner en el cartel una
 * imagen que no cumple, firmar incompleto y firmar con otra petición del
 * historial, y contestar mal la pregunta.
 */

import fs from 'fs';
import path from 'path';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { EntradaCreaConIa } from '@/components/activities/ia/EntradaCreaConIa';
import { ENCARGO, FECHA_TRABAJO, HERRAMIENTA, PREGUNTA, TOTAL_ENCARGOS } from '@/components/activities/ia/LabCreaConIa';
import { RUTA_N6_DISENO_MULTIMEDIA } from '@/components/activities/n4/estudio/EntradaN4Base';
import { cumple, generar, PETICION_VACIA, textoDePeticion, type Peticion, type Tanda } from '@/components/simuladores/generador';
import { CURRICULO } from '@/data/curriculo';

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const utils = render(<EntradaCreaConIa config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />);
  return { ...utils, onProgress, onScore, onComplete };
}

function abrirLaboratorio() {
  const utils = montar();
  fireEvent.click(screen.getByRole('button', { name: /Abre el generador/ }));
  fireEvent.click(screen.getByTestId('psn-empezar'));
  return utils;
}

const bit = () => document.querySelector('.bit-globo')?.textContent ?? '';
const tandasEnPantalla = () => screen.queryAllByTestId('cia-tanda').length;
const logrado = () => screen.queryByTestId('cia-siguiente') !== null;
const ultimoPuntaje = (onScore: jest.Mock) => onScore.mock.calls[onScore.mock.calls.length - 1][0] as number;

function chip(fila: string, valor: string) {
  return document.querySelector(`[data-testid="${fila}"] [data-pieza="${valor}"]`) as HTMLButtonElement;
}
/** Deja la pieza puesta o quitada sin depender de cómo estaba (los chips se alternan). */
function poner(fila: string, valor: string, puesta = true) {
  const b = chip(fila, valor);
  if ((b.getAttribute('aria-pressed') === 'true') !== puesta) fireEvent.click(b);
}
function pedirLoDelComite() {
  poner('cia-fila-tema', 'volcan');
  poner('cia-fila-estilo', 'plastilina');
  poner('cia-fila-formato', 'vertical');
  for (const e of ['texto', 'persona', 'marca']) poner('cia-fila-sin', e);
}
const generarTanda = () => fireEvent.click(screen.getByTestId('cia-generar'));
const siguiente = () => fireEvent.click(screen.getByTestId('cia-siguiente'));

const COMPLETA: Peticion = { tema: 'volcan', estilo: 'plastilina', formato: 'vertical', prohibidos: ['texto', 'persona', 'marca'] };
const SOLO_TEMA: Peticion = { ...PETICION_VACIA, tema: 'volcan' };

/**
 * El recorrido limpio hasta un encargo: 1 = una pieza (gen 1), 2 = la del
 * comité (gen 2), 3 = la misma otra vez (gen 3). Devuelve las tandas tal
 * como las calcula el generador, en el mismo orden.
 */
function hastaElEncargo(n: number): Tanda[] {
  const tandas: Tanda[] = [];
  if (n <= 1) return tandas;
  poner('cia-fila-tema', 'volcan');
  generarTanda();
  tandas.push(generar(SOLO_TEMA, 1));
  siguiente();
  if (n <= 2) return tandas;
  pedirLoDelComite();
  generarTanda();
  tandas.push(generar(COMPLETA, 2));
  siguiente();
  if (n <= 3) return tandas;
  generarTanda();
  tandas.push(generar(COMPLETA, 3));
  siguiente();
  return tandas;
}

/**
 * Las imágenes de las generaciones con la petición del comité. OJO: la de una
 * sola pieza (gen 1) también puede traer una que cumpla —con «volcán» a secas,
 * la gen 1 trae una—, y entonces la firma correcta es ESA petición, no la
 * completa. La prueba elige de aquí para saber qué firma espera.
 */
const delComite = (tandas: Tanda[]) => tandas.slice(1).flatMap((t) => t.imagenes);

function mirar(id: string) {
  fireEvent.click(document.querySelector(`[data-testid="cia-mirar"][data-imagen="${id}"]`)!);
}
function alCartel(id: string) {
  mirar(id);
  fireEvent.click(screen.getByTestId('cia-al-cartel'));
}
function firmar(campo: 'herramienta' | 'peticion' | 'fecha', valor: string) {
  const b = Array.from(document.querySelectorAll<HTMLButtonElement>(`[data-testid="cia-firma-${campo}"] [data-valor]`)).find(
    (x) => x.dataset.valor === valor,
  );
  if (!b) throw new Error(`no hay opción «${valor}» en ${campo}`);
  fireEvent.click(b);
}
function contestarBien() {
  const i = PREGUNTA.opciones.findIndex((o) => o.correcta);
  fireEvent.click(document.querySelector(`[data-testid="cia-pregunta"] [data-opcion="${i}"]`)!);
}

describe('n6-crea-con-ia', () => {
  it('vive donde dice el currículo: N6, 11–12 años, y cierra su unidad como parada 3 de 3', () => {
    const n6 = CURRICULO.find((n) => n.n === 6)!;
    expect(n6.edad).toBe('11–12');
    const unidad = n6.unidades.find((u) => u.id === 'n6-diseno-y-multimedia')!;
    expect(unidad.actividades[2].id).toBe('n6-crea-con-ia');
    expect(unidad.actividades[2].estado).toBe('disponible');
    expect(RUTA_N6_DISENO_MULTIMEDIA[2].id).toBe('n6-crea-con-ia');
    expect(TOTAL_ENCARGOS).toBe(6);
  });

  it('la fecha de la firma no es la de hoy: un defecto «lee el reloj» no pasaría inadvertido', () => {
    expect(FECHA_TRABAJO).not.toBe(new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }));
  });

  it('barrido de la casa: sin fetch, sin /api/, sin proveedores de IA reales, sin Math.random', () => {
    const archivos = [
      'src/components/activities/ia/LabCreaConIa.tsx',
      'src/components/activities/ia/EntradaCreaConIa.tsx',
      'src/components/activities/ia/estudioImagina.css',
      'src/components/simuladores/generador/imagen.ts',
      'src/components/simuladores/generador/LienzoImagen.tsx',
    ];
    for (const archivo of archivos) {
      expect(fs.readFileSync(path.join(process.cwd(), archivo), 'utf8')).not.toMatch(/fetch\(|\/api\/|anthropic|openai|Math\.random/i);
    }
  });

  it('la entrada es suya y el laboratorio abre con la portada de objetivos, no con el estudio', () => {
    montar();
    expect(screen.getByText('Generar no es buscar')).toBeInTheDocument();
    expect(screen.getByText('Citar es decir tres cosas')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Abre el generador/ }));
    const portada = screen.getByTestId('psn-portada');
    expect(within(portada).getByText('Crea con IA: pídelo bien, míralo, y di de dónde salió')).toBeInTheDocument();
    expect(screen.queryByTestId('cia-estudio')).toBeNull();
  });

  it('el mensaje de la Profe Ávila está a la vista desde el primer encargo', () => {
    abrirLaboratorio();
    const brief = screen.getByTestId('cia-brief').textContent ?? '';
    expect(brief).toMatch(/vertical/);
    expect(brief).toMatch(/plastilina/);
    expect(brief).toMatch(/sin texto/);
    expect(brief).toMatch(/nada de\s+marcas/);
  });

  it('encargo 1, jugar mal: sin piezas no genera; con dos genera pero no cierra; con una cierra', () => {
    abrirLaboratorio();
    generarTanda();
    expect(tandasEnPantalla()).toBe(0);
    expect(bit()).toMatch(/cero piezas/);

    poner('cia-fila-tema', 'volcan');
    poner('cia-fila-estilo', 'noche');
    generarTanda();
    expect(tandasEnPantalla()).toBe(1);
    expect(logrado()).toBe(false);
    expect(bit()).toMatch(/2 piezas/);

    poner('cia-fila-estilo', 'noche', false);
    expect(screen.getByTestId('cia-peticion-texto').textContent).toBe('Un volcán de bicarbonato');
    generarTanda();
    expect(tandasEnPantalla()).toBe(2);
    expect(logrado()).toBe(true);
  });

  it('lo que sale es lo que dice el generador para esa petición, y ninguna tarjeta trae escrito su defecto', () => {
    abrirLaboratorio();
    poner('cia-fila-tema', 'volcan');
    generarTanda();
    const esperada = generar(SOLO_TEMA, 1);
    const enPantalla = screen.getAllByTestId('cia-mirar').map((b) => b.getAttribute('data-imagen'));
    expect(enPantalla).toEqual(esperada.imagenes.map((im) => im.id));
    for (const b of screen.getAllByTestId('cia-mirar')) {
      expect(b.textContent).not.toMatch(/cumple|defecto|descart|falta|persona|marca de|letras/i);
    }
  });

  it('encargo 2, jugar mal: olvidar «sin texto» genera, pero el encargo no cierra y Bit dice cuántas faltan', () => {
    abrirLaboratorio();
    hastaElEncargo(2);
    pedirLoDelComite();
    poner('cia-fila-sin', 'texto', false);
    generarTanda();
    expect(logrado()).toBe(false);
    expect(bit()).toMatch(/le falta una/);
    // Bit no dicta cuál: la clase no dice «sin texto».
    expect(bit()).not.toMatch(/texto/);

    poner('cia-fila-estilo', 'acuarela');
    generarTanda();
    expect(bit()).toMatch(/le faltan 2/);

    pedirLoDelComite();
    generarTanda();
    expect(logrado()).toBe(true);
  });

  it('encargo 3, jugar mal: cambiar algo entre las dos no vale; repetir sin tocar nada cierra y las tandas no coinciden', () => {
    abrirLaboratorio();
    hastaElEncargo(3);
    // Cambia una pieza y la regresa: la petición nueva es igual a la anterior,
    // pero primero se genera una distinta.
    poner('cia-fila-estilo', 'noche');
    generarTanda();
    expect(logrado()).toBe(false);
    pedirLoDelComite();
    generarTanda();
    expect(logrado()).toBe(false);
    expect(bit()).toMatch(/Cambiaste algo/);
    generarTanda();
    expect(logrado()).toBe(true);

    const comparadas = document.querySelectorAll('.cia-tanda.es-comparada');
    expect(comparadas).toHaveLength(2);
    expect(screen.getByTestId('cia-comparar-nota').textContent).toMatch(/se repiten\s*0/);
  });

  it('encargo 4, jugar mal: el comité rechaza una imagen que no cumple, dice qué le falta, y cuesta', () => {
    const { onScore } = abrirLaboratorio();
    const tandas = hastaElEncargo(4);
    const todas = tandas.flatMap((t) => t.imagenes);
    const mala = todas.find((im) => !cumple(im, ENCARGO))!;
    const buena = todas.find((im) => cumple(im, ENCARGO))!;
    expect(mala).toBeDefined();
    expect(buena).toBeDefined();

    alCartel(mala.id);
    expect(logrado()).toBe(false);
    expect(ultimoPuntaje(onScore)).toBe(94);
    const motivos = Array.from(screen.getByTestId('cia-rechazo').querySelectorAll('li')).map((li) => li.textContent);
    expect(motivos.length).toBeGreaterThan(0);

    alCartel(buena.id);
    expect(logrado()).toBe(true);
    expect(screen.queryByTestId('cia-rechazo')).toBeNull();
  });

  it('una petición completa siempre deja una imagen que pasa el comité (lo que la clase promete al alumno)', () => {
    for (let n = 1; n <= 200; n++) expect(generar(COMPLETA, n).imagenes.some((im) => cumple(im, ENCARGO))).toBe(true);
  });

  it('encargo 5, jugar mal: firmar incompleto no cuesta; firmar con otra petición del historial sí', () => {
    const { onScore } = abrirLaboratorio();
    const tandas = hastaElEncargo(4);
    const buena = delComite(tandas).find((im) => cumple(im, ENCARGO))!;
    alCartel(buena.id);
    siguiente();

    // Las peticiones a elegir son las del historial, no una lista inventada.
    const ofrecidas = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="cia-firma-peticion"] [data-valor]')).map((b) => b.dataset.valor);
    expect(new Set(ofrecidas)).toEqual(new Set([textoDePeticion(SOLO_TEMA), textoDePeticion(COMPLETA)]));

    firmar('herramienta', HERRAMIENTA);
    fireEvent.click(screen.getByTestId('cia-firmar'));
    expect(ultimoPuntaje(onScore)).toBe(100);
    expect(bit()).toMatch(/la petición, la fecha/);

    firmar('peticion', textoDePeticion(SOLO_TEMA));
    firmar('fecha', FECHA_TRABAJO);
    fireEvent.click(screen.getByTestId('cia-firmar'));
    expect(logrado()).toBe(false);
    expect(ultimoPuntaje(onScore)).toBe(94);
    expect(bit()).toMatch(/la petición no coincide/);

    firmar('peticion', textoDePeticion(COMPLETA));
    fireEvent.click(screen.getByTestId('cia-firmar'));
    expect(logrado()).toBe(true);
    expect(screen.getByTestId('cia-cartel-firma').textContent).toContain(textoDePeticion(COMPLETA));
  });

  it('se firma la petición que DE VERDAD generó la imagen: si la buena salió de la vaga, se firma la vaga', () => {
    const { onScore } = abrirLaboratorio();
    hastaElEncargo(4);
    // En el encargo 4 se puede seguir generando: con «volcán» a secas hasta
    // que salga, por suerte, una que el comité aprobaría.
    for (const [fila, valor] of [['cia-fila-estilo', 'plastilina'], ['cia-fila-formato', 'vertical'], ['cia-fila-sin', 'texto'], ['cia-fila-sin', 'persona'], ['cia-fila-sin', 'marca']]) {
      poner(fila, valor, false);
    }
    let deLaVaga: ReturnType<typeof generar>['imagenes'][number] | undefined;
    for (let n = 4; n <= 60 && !deLaVaga; n++) {
      generarTanda();
      deLaVaga = generar(SOLO_TEMA, n).imagenes.find((im) => cumple(im, ENCARGO));
    }
    expect(deLaVaga).toBeDefined();
    alCartel(deLaVaga!.id);
    siguiente();
    firmar('herramienta', HERRAMIENTA);
    firmar('fecha', FECHA_TRABAJO);
    firmar('peticion', textoDePeticion(COMPLETA));
    fireEvent.click(screen.getByTestId('cia-firmar'));
    expect(logrado()).toBe(false);
    expect(ultimoPuntaje(onScore)).toBe(94);
    firmar('peticion', textoDePeticion(SOLO_TEMA));
    fireEvent.click(screen.getByTestId('cia-firmar'));
    expect(logrado()).toBe(true);
  });

  it('el camino de salida funciona a media práctica', () => {
    abrirLaboratorio();
    poner('cia-fila-tema', 'volcan');
    generarTanda();
    fireEvent.click(screen.getByRole('button', { name: 'Salir' }));
    expect(screen.getByRole('button', { name: /Abre el generador/ })).toBeInTheDocument();
  });

  it('recorrido completo: contestar mal no cuesta, se termina con 100 y la salida funciona desde el cierre', () => {
    const { onComplete, onProgress, onScore } = abrirLaboratorio();
    const tandas = hastaElEncargo(4);
    alCartel(delComite(tandas).find((im) => cumple(im, ENCARGO))!.id);
    siguiente();
    firmar('herramienta', HERRAMIENTA);
    firmar('peticion', textoDePeticion(COMPLETA));
    firmar('fecha', FECHA_TRABAJO);
    fireEvent.click(screen.getByTestId('cia-firmar'));
    siguiente();

    const mala = PREGUNTA.opciones.findIndex((o) => !o.correcta);
    fireEvent.click(document.querySelector(`[data-testid="cia-pregunta"] [data-opcion="${mala}"]`)!);
    expect(onComplete).not.toHaveBeenCalled();
    expect(bit()).toContain(PREGUNTA.opciones[mala].porque);
    contestarBien();

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0].score).toBe(100);
    expect(Math.max(...onProgress.mock.calls.map((c: [number]) => c[0]))).toBe(1);
    expect(Math.min(...onScore.mock.calls.map((c: [number]) => c[0]))).toBe(100);
    expect(screen.getByText('¡Tu cartel está firmado!')).toBeInTheDocument();
    expect(screen.getByText('Rechazadas por el comité')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Volver a la entrada' }));
    expect(screen.getByRole('button', { name: /Abre el generador/ })).toBeInTheDocument();
  });

  it('con un rechazo y una firma mala el puntaje cierra en 88, y repetir lo deja limpio', () => {
    const { onComplete, onScore } = abrirLaboratorio();
    const tandas = hastaElEncargo(4);
    const todas = tandas.flatMap((t) => t.imagenes);
    alCartel(todas.find((im) => !cumple(im, ENCARGO))!.id);
    alCartel(delComite(tandas).find((im) => cumple(im, ENCARGO))!.id);
    siguiente();
    firmar('herramienta', 'Lo dibujé yo');
    firmar('peticion', textoDePeticion(COMPLETA));
    firmar('fecha', FECHA_TRABAJO);
    fireEvent.click(screen.getByTestId('cia-firmar'));
    firmar('herramienta', HERRAMIENTA);
    fireEvent.click(screen.getByTestId('cia-firmar'));
    siguiente();
    contestarBien();
    expect(onComplete.mock.calls[0][0].score).toBe(88);

    fireEvent.click(screen.getByRole('button', { name: /Repetir|Jugar otra vez|Otra vez/ }));
    expect(ultimoPuntaje(onScore)).toBe(100);
    expect(tandasEnPantalla()).toBe(0);
    expect(screen.getByTestId('cia-encargo-numero').textContent).toMatch(/Encargo 1 de 6/);
  });
});
