/**
 * `n7-diagnostica-y-soluciona` · N7·U1, parada 4 y cierre de unidad.
 * Temario en §31.4, adaptación de la ronda 2 en §53.3. **12–13 años**, leído en
 * `curriculo.ts`.
 *
 * Lo que esta suite vigila:
 *
 *  · Que las **dos maneras de fallar una comprobación** sigan siendo dos y
 *    sigan diciendo cosas distintas: el instrumento que no mide eso, y el
 *    instrumento bueno en el sitio donde el problema no está. Si las dos
 *    dijeran lo mismo, la mitad espacial de la lección se habría perdido.
 *  · Que las lecturas **quepan en la placa**. La pizarra es un lienzo de cuatro
 *    renglones de 26 caracteres pegado como textura: un texto que se pasa no se
 *    ve, y eso es un defecto que sólo aparece en el navegador.
 *  · Y el recorrido completo: cinco chapas y cinco averías, quince pasos, hasta
 *    la pantalla de cierre con la credencial de técnico junior.
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import EntradaDiagnosticaYSoluciona from '@/components/activities/lab3d/EntradaDiagnosticaYSoluciona';
import {
  AVERIAS,
  BANCO_AVERIAS,
  BANCO_PROTOCOLO,
  CASILLAS,
  CHAPAS_PROTOCOLO,
  ESPERADO_PROTOCOLO,
  INSTRUMENTOS,
  juzgarComprobacion,
  juzgarSolucion,
} from '@/components/activities/lab3d/bancos';
import { partirEnLineas, validarBanco } from '@/components/simuladores/laboratorio3d/bancoFisico';
import { CURRICULO } from '@/data/curriculo';
import type { ActivityResult } from '@/types/activity-contract';

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const utils = render(
    <EntradaDiagnosticaYSoluciona config={{}} onProgress={onProgress} onScore={onScore} onComplete={onComplete} />,
  );
  return { ...utils, onProgress, onScore, onComplete };
}

const pulsar = (nombre: string | RegExp) => fireEvent.click(screen.getByRole('button', { name: nombre }));
const bitDice = () => document.querySelector('.bit-globo')?.textContent ?? '';
const marcador = () => document.querySelector('.marcador-led strong')?.textContent ?? '';

const avanzar = async (ms: number) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

function abrirLaboratorio() {
  const api = montar();
  fireEvent.click(screen.getByText('Entra al laboratorio'));
  fireEvent.click(screen.getByTestId('lb3-empezar'));
  return api;
}

/** Coloca las cinco chapas del protocolo en su casilla, en orden. */
async function armarElProtocolo() {
  for (const chapa of CHAPAS_PROTOCOLO) {
    if (chapa.orden === null) continue;
    pulsar(`Tomar ${chapa.texto}`);
    pulsar(`Usar en Casilla ${chapa.orden}`);
  }
  await avanzar(1200);
}

/** Resuelve una avería entera: comprobar con el instrumento y aplicar la solución. */
async function resolver(i: number) {
  const caso = AVERIAS[i];
  const instrumento = INSTRUMENTOS.find((h) => h.id === caso.instrumento);
  const punto = BANCO_AVERIAS.anclajes.find((a) => a.id === caso.punto);
  const pieza = BANCO_AVERIAS.piezas.find((p) => p.id === caso.solucion.pieza);
  const destino = BANCO_AVERIAS.anclajes.find((a) => a.id === caso.solucion.anclaje);
  pulsar(`Tomar ${instrumento!.etiqueta}`);
  pulsar(`Usar en ${punto!.etiqueta}`);
  pulsar(`Tomar ${pieza!.etiqueta}`);
  pulsar(`Usar en ${destino!.etiqueta}`);
  await avanzar(2000);
}

beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
afterEach(() => jest.useRealTimers());

describe('n7-diagnostica-y-soluciona · las tablas, en aritmética pura', () => {
  it('el nivel y la edad son los del currículo: N7 es secundaria, no primaria', () => {
    const n7 = CURRICULO.find((n) => n.n === 7);
    const unidad = n7?.unidades.find((u) => u.id === 'n7-arquitectura-y-sistemas');
    expect(n7?.edad).toBe('12–13');
    expect(n7?.grado).toBe('1° de Secundaria');
    expect(n7?.etapa).toBe('secundaria');
    expect(unidad?.actividades.find((a) => a.id === 'n7-diagnostica-y-soluciona')?.estado).toBe('disponible');
  });

  it('los dos bancos son válidos, y el protocolo tiene cinco pasos y dos trampas', () => {
    expect(validarBanco(BANCO_PROTOCOLO)).toEqual([]);
    expect(validarBanco(BANCO_AVERIAS)).toEqual([]);
    expect(CHAPAS_PROTOCOLO).toHaveLength(7);
    expect(CHAPAS_PROTOCOLO.filter((c) => c.orden === null).map((c) => c.id)).toEqual(['reinstala', 'cara']);
    expect(Object.keys(ESPERADO_PROTOCOLO)).toHaveLength(CASILLAS.length);
    // Todas las chapas son del mismo tipo: aquí la física no ayuda, y ése es el
    // punto — lo que se evalúa es el criterio, no la forma.
    expect(new Set(BANCO_PROTOCOLO.piezas.map((p) => p.tipo))).toEqual(new Set(['chapa']));
  });

  it('fallar una comprobación tiene DOS formas distintas, y las dos enseñan', () => {
    const caso = AVERIAS[1]; // pantalla negra: lámpara en el puerto de video
    expect(juzgarComprobacion(caso, 'lampara', 'puerto-video')).toBe('ok');
    // El instrumento bueno en el sitio donde el síntoma no puede estar.
    expect(juzgarComprobacion(caso, 'lampara', 'disipador')).toBe('sitio');
    // Y el instrumento que no mide eso, aunque el sitio sea el correcto.
    expect(juzgarComprobacion(caso, 'termometro', 'puerto-video')).toBe('instrumento');
    // El desarmador nunca comprueba nada: es el distractor de la ronda 2.
    expect(juzgarComprobacion(caso, 'desarmador', 'puerto-video')).toBe('desarmador');
    expect(INSTRUMENTOS).toHaveLength(6);
    for (const c of AVERIAS) expect(c.instrumento).not.toBe('desarmador');

    // Y cada avería tiene un instrumento y un punto propios: ninguna se resuelve
    // por eliminación repitiendo lo de la anterior.
    expect(new Set(AVERIAS.map((c) => c.instrumento)).size).toBe(AVERIAS.length);
    expect(new Set(AVERIAS.map((c) => c.punto)).size).toBe(AVERIAS.length);
    expect(juzgarSolucion(AVERIAS[0], 'cable-corriente', 'toma-corriente')).toBe(true);
    expect(juzgarSolucion(AVERIAS[0], 'ram', 'toma-corriente')).toBe(false);
  });

  it('todo lo que va a la pizarra cabe en la placa: 4 renglones de 26', () => {
    // La pizarra es un lienzo pegado como textura, no un `<div>` que crece: lo
    // que se pasa de cuatro renglones no se ve, y eso sólo se nota jugando.
    for (const caso of AVERIAS) {
      for (const texto of [caso.sintoma, caso.lectura]) {
        const lineas = partirEnLineas(texto, 26);
        expect(lineas.length).toBeLessThanOrEqual(4);
        expect(lineas.join(' ')).toBe(texto);
      }
    }
    // Y los títulos, a 22 caracteres.
    expect(`Avería ${AVERIAS.length} de 5`.length).toBeLessThanOrEqual(22);
  });
});

describe('n7-diagnostica-y-soluciona · la entrada y la portada', () => {
  it('la entrada trae el protocolo del temario, no el de otra clase', () => {
    montar();
    expect(screen.getByText('La Mesa de Diagnóstico')).toBeInTheDocument();
    expect(screen.getByText('Observa el síntoma exacto')).toBeInTheDocument();
    expect(screen.getByText('Lo simple primero')).toBeInTheDocument();
    expect(screen.getByText('Una variable a la vez')).toBeInTheDocument();
    expect(screen.getByText('La solución mínima')).toBeInTheDocument();
    expect(screen.getByText('Arma el protocolo y resuelve cinco averías reales, una variable a la vez.')).toBeInTheDocument();
  });

  it('la portada de objetivos aparece antes de tocar la mesa', () => {
    montar();
    fireEvent.click(screen.getByText('Entra al laboratorio'));
    const portada = screen.getByTestId('lb3-portada');
    expect(portada).toHaveTextContent('Diagnostica y soluciona');
    expect(portada).toHaveTextContent('Técnico junior');
    expect(portada).toHaveTextContent('15');
    const antes = bitDice();
    pulsar('Tomar Observa el síntoma exacto');
    expect(bitDice()).toBe(antes);
    expect(marcador()).toBe('0/5');
  });
});

describe('n7-diagnostica-y-soluciona · jugando mal a propósito', () => {
  it('las dos chapas distractoras se explican una por una, y no ocupan casilla', () => {
    const { onScore } = abrirLaboratorio();

    pulsar('Tomar Reinstala el sistema');
    pulsar('Usar en Casilla 1');
    expect(bitDice()).toContain('último recurso');
    expect(onScore).toHaveBeenLastCalledWith(94);
    expect(marcador()).toBe('0/5');

    pulsar('Tomar Cambia la pieza más cara');
    pulsar('Usar en Casilla 1');
    expect(bitDice()).toContain('tres cosas a la vez');
    expect(onScore).toHaveBeenLastCalledWith(88);
    expect(marcador()).toBe('0/5');

    // Y las dos siguen en la caja: el error no se traga la pieza.
    expect(screen.getByRole('button', { name: 'Tomar Reinstala el sistema' })).toBeInTheDocument();
  });

  it('la chapa correcta en la casilla equivocada tampoco cuela', () => {
    abrirLaboratorio();
    pulsar('Tomar Verifica y anota');
    pulsar('Usar en Casilla 1');
    expect(bitDice()).toContain('antes o después');
    expect(marcador()).toBe('0/5');
    pulsar('Tomar Observa el síntoma exacto');
    pulsar('Usar en Casilla 1');
    expect(marcador()).toBe('1/5');
  });

  it('en las averías: el desarmador, el sitio equivocado y arreglar antes de comprobar', async () => {
    const { onScore } = abrirLaboratorio();
    await armarElProtocolo();
    expect(marcador()).toBe('0/5');

    // El desarmador: quien lo toma primero está desarmando sin saber qué pasa.
    pulsar('Tomar Desarmador');
    pulsar('Usar en Toma de corriente');
    expect(bitDice()).toContain('no mide nada');

    // El instrumento bueno, en el sitio donde el síntoma no puede estar.
    pulsar('Tomar Probador de corriente');
    pulsar('Usar en Disipador');
    expect(bitDice()).toContain('ahí no está el problema');

    // Y el instrumento que no mide eso, aunque el sitio sea el correcto.
    pulsar('Tomar Termómetro infrarrojo');
    pulsar('Usar en Toma de corriente');
    expect(bitDice()).toContain('no mide eso');

    // Arreglar antes de comprobar: cambiar piezas al azar es lo contrario del
    // protocolo que el alumno acaba de armar.
    pulsar('Tomar Cable de corriente');
    pulsar('Usar en Toma de corriente');
    expect(bitDice()).toContain('Primero comprueba');
    expect(onScore).toHaveBeenLastCalledWith(76);
    expect(marcador()).toBe('0/5');
  });
});

describe('n7-diagnostica-y-soluciona · recorrido completo', () => {
  it('cinco chapas y cinco averías, quince pasos, hasta la credencial de técnico junior', async () => {
    const { onComplete, onProgress } = abrirLaboratorio();

    // Ronda 1 · el protocolo.
    for (const chapa of CHAPAS_PROTOCOLO) {
      if (chapa.orden === null) continue;
      pulsar(`Tomar ${chapa.texto}`);
      pulsar(`Usar en Casilla ${chapa.orden}`);
      expect(marcador()).toBe(`${chapa.orden}/5`);
    }
    await avanzar(1200);
    expect(bitDice()).toContain('parte de técnico');
    expect(marcador()).toBe('0/5');

    // Ronda 2 · las cinco averías, cada una con su comprobación y su arreglo.
    for (let i = 0; i < AVERIAS.length; i++) {
      await resolver(i);
      if (i < AVERIAS.length - 1) expect(marcador()).toBe(`${i + 1}/5`);
    }

    const resultado = onComplete.mock.calls[0][0] as ActivityResult;
    expect(resultado.score).toBe(100);
    expect(resultado.errores).toBe(0);
    expect(onProgress).toHaveBeenLastCalledWith(1);
    expect(screen.getByText('Insignia · Técnico junior')).toBeInTheDocument();
    expect(screen.getByText('¡Cinco averías, cinco resueltas!')).toBeInTheDocument();
    // Terminada, no queda mesa que tocar.
    expect(screen.queryByRole('button', { name: /^Tomar / })).toBeNull();
  });
});
