/**
 * TECNIA ASISTENTE · el armazón de las 16 actividades de IA.
 *
 * Se prueba en tres alturas y en este orden, porque es el orden en el que se
 * rompe: el guion (puro, sin React), la máquina de la conversación (el estado
 * y el tecleo) y la ventana (que no debe filtrar la verdad al DOM).
 *
 * Y se prueba JUGANDO MAL: mensaje vacío, dos envíos seguidos mientras el
 * asistente aún escribe, algo que ningún patrón reconoce, y cien pulsaciones
 * seguidas sobre botones que ya no deberían hacer nada.
 */
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { useState } from 'react';
import {
  casaPalabra,
  evaluarPrompt,
  repartirRevelado,
  resolverGuion,
  validarGuion,
  veracidadDe,
  type FichaPrompt,
  type GuionAsistente,
  type MarcaParte,
  type MensajeIA,
  type RubricaPrompt,
} from '@/components/simuladores/asistente/guionAsistente';
import { useAsistente } from '@/components/simuladores/asistente/useAsistente';
import { VentanaAsistente } from '@/components/simuladores/asistente/VentanaAsistente';

// ───────────────────────────────────────────────────────────────────────────
// El guion de prueba: un asistente que sabe de volcanes, miente sobre los
// pulpos y corta cuando le cuentan un dato personal.
// ───────────────────────────────────────────────────────────────────────────

const TEXTO_VOLCAN = 'Un volcan es una abertura por donde sale magma.';
const PARTE_CIERTA = 'Los pulpos tienen tres corazones. ';
const PARTE_FALSA = 'Y son casi inmortales: viven mas de cien anios.';

const GUION: GuionAsistente = {
  respuestas: [
    { id: 'volcan', texto: TEXTO_VOLCAN },
    {
      id: 'pulpos',
      partes: [
        { id: 'p-corazones', texto: PARTE_CIERTA, veracidad: 'cierto' },
        {
          id: 'p-inmortal',
          texto: PARTE_FALSA,
          veracidad: 'falso',
          nota: 'Un pulpo vive entre uno y cinco anios.',
        },
      ],
    },
    { id: 'corte', tipo: 'aviso', texto: 'Eso es tu direccion: no se le cuenta a un asistente.' },
  ],
  reglas: [
    { tipo: 'ficha', ficha: 'f-volcan', responde: 'volcan' },
    { tipo: 'ficha', ficha: 'f-pulpos', responde: 'pulpos' },
    { tipo: 'palabras', palabras: ['direccion', 'telefono'], responde: 'corte' },
    { tipo: 'palabras', palabras: ['volcan', 'lava'], responde: 'volcan' },
  ],
  porDefecto: { id: 'no-se', texto: 'De eso no estoy seguro.' },
};

const FICHAS: FichaPrompt[] = [
  { id: 'f-volcan', etiqueta: 'Los volcanes', pregunta: 'Explicame como funciona un volcan.' },
  { id: 'f-pulpos', etiqueta: 'Los pulpos', pregunta: 'Cuentame sobre los pulpos.' },
];

const RUBRICA: RubricaPrompt = {
  criterios: [
    { id: 'tema', etiqueta: 'Dice de que', palabras: ['volcan', 'volcanes'] },
    { id: 'quien', etiqueta: 'Dice para quien', palabras: ['para mi abuela', 'para mi hermano'] },
    { id: 'formato', etiqueta: 'Pide un formato', palabras: ['renglones', 'lista', 'puntos'] },
  ],
  cortes: { bueno: 3, mejorable: 2 },
};

/** Un mensaje del asistente escrito a mano, para probar la ventana sola. */
function troceado(marcas: Record<string, MarcaParte> = {}): MensajeIA {
  return {
    tipo: 'asistente-troceado',
    id: 'm1',
    respuesta: 'pulpos',
    veracidad: 'falso',
    revelado: (PARTE_CIERTA + PARTE_FALSA).length,
    partes: [
      {
        id: 'p-corazones',
        texto: PARTE_CIERTA,
        veracidad: 'cierto',
        marca: marcas['p-corazones'] ?? 'oculta',
      },
      {
        id: 'p-inmortal',
        texto: PARTE_FALSA,
        veracidad: 'falso',
        nota: 'inventada',
        marca: marcas['p-inmortal'] ?? 'oculta',
      },
    ],
  };
}

/** La clase de mentira: el armazón montado como lo montaria una actividad. */
function Clase({ velocidad = 0 }: { velocidad?: number }) {
  const ia = useAsistente({ guion: GUION, velocidad, saludo: 'Hola, en que te ayudo?' });
  const [texto, setTexto] = useState('');
  return (
    <VentanaAsistente
      mensajes={ia.mensajes}
      escribiendo={ia.ocupado}
      onSaltarTecleo={ia.saltarTecleo}
      onTocarParte={(id) => ia.marcarParte(id, 'senalada')}
      compositor={{
        fichas: FICHAS,
        onEnviarFicha: (id) => {
          const f = FICHAS.find((x) => x.id === id);
          ia.enviarFicha(f ?? id);
        },
        libre: {
          valor: texto,
          onCambiar: setTexto,
          onEnviar: () => {
            ia.enviarTexto(texto);
            setTexto('');
          },
        },
        deshabilitado: ia.ocupado,
      }}
    />
  );
}

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

// ═══════════════════════════════════════════════════════════════════════════
// 1 · El guion — puro, sin React y sin relojes
// ═══════════════════════════════════════════════════════════════════════════

describe('el guion', () => {
  it('elige la respuesta por la ficha que se pulso', () => {
    const r = resolverGuion(GUION, { ficha: 'f-pulpos' });
    expect(r.respuesta.id).toBe('pulpos');
    expect(r.porDefecto).toBe(false);
  });

  it('reconoce por palabras clave sin tropezar con tildes ni con subcadenas', () => {
    expect(resolverGuion(GUION, { texto: '¿Cómo hace erupción un VOLCÁN?' }).respuesta.id).toBe('volcan');
    // Una palabra suelta casa por token: «sol» no es «solamente».
    expect(casaPalabra('Solamente quiero eso', 'sol')).toBe(false);
    expect(casaPalabra('Hoy salió el sol.', 'sol')).toBe(true);
    // Una clave de varias palabras sí casa como subcadena: el orden la hace específica.
    expect(casaPalabra('Explícame el sistema solar', 'sistema solar')).toBe(true);
  });

  it('con `todas` exige todas las palabras, no una cualquiera', () => {
    const g: GuionAsistente = {
      respuestas: [{ id: 'si', texto: 'ok' }],
      reglas: [{ tipo: 'palabras', palabras: ['tarea', 'mañana'], todas: true, responde: 'si' }],
      porDefecto: { id: 'no', texto: 'nada' },
    };
    expect(resolverGuion(g, { texto: 'es para la tarea' }).respuesta.id).toBe('no');
    expect(resolverGuion(g, { texto: 'la tarea es para manana' }).respuesta.id).toBe('si');
  });

  it('gana la primera regla que casa, no la mas especifica', () => {
    // «direccion» va antes que «volcan» en las reglas, y el texto trae las dos.
    const r = resolverGuion(GUION, { texto: 'mi direccion esta junto al volcan' });
    expect(r.respuesta.id).toBe('corte');
  });

  it('cuando nada casa contesta por defecto y lo dice', () => {
    const r = resolverGuion(GUION, { texto: 'oye que tal tu dia' });
    expect(r.respuesta.id).toBe('no-se');
    expect(r.porDefecto).toBe(true);
    expect(r.regla).toBeNull();
  });

  it('una regla que apunta a una respuesta que no existe no deja el hilo mudo', () => {
    const g: GuionAsistente = {
      respuestas: [],
      reglas: [{ tipo: 'siempre', responde: 'fantasma' }],
      porDefecto: { id: 'def', texto: 'algo digo' },
    };
    const r = resolverGuion(g, { texto: 'hola' });
    expect(r.respuesta.id).toBe('def');
    expect(r.porDefecto).toBe(true);
    expect(r.regla).not.toBeNull(); // la culpable tiene nombre
    expect(validarGuion(g).join(' | ')).toContain('«fantasma», que no existe');
  });

  it('`validarGuion` caza las averias que se ven sin jugar', () => {
    const roto: GuionAsistente = {
      respuestas: [
        { id: 'a', texto: 'hola', partes: [{ id: 'x', texto: 'hola' }] },
        { id: 'a', texto: 'otra' },
        { id: 'b', partes: [{ id: 'x', texto: 'y' }] },
      ],
      reglas: [
        { tipo: 'palabras', palabras: ['   '], responde: 'a' },
        { tipo: 'calidad', nivel: 'bueno', responde: 'a' },
        { tipo: 'siempre', responde: 'a' },
        { tipo: 'ficha', ficha: 'f', responde: 'a' },
      ],
      porDefecto: { id: 'def', texto: 'x' },
    };
    const quejas = validarGuion(roto).join(' | ');
    expect(quejas).toContain('dos respuestas con el id «a»');
    expect(quejas).toContain('trae texto y partes a la vez');
    expect(quejas).toContain('la parte «x» está repetida');
    expect(quejas).toContain('ni una palabra que buscar');
    expect(quejas).toContain('no trae rúbrica');
    expect(quejas).toContain('no se alcanza nunca');

    // Y el guion sano no se queja... salvo por una ficha sin regla que la conteste.
    expect(validarGuion(GUION, ['f-volcan', 'f-pulpos'])).toEqual([]);
    expect(validarGuion(GUION, ['f-volcan', 'f-pulpos', 'f-huerfana']).join(' ')).toContain(
      '«f-huerfana» no tiene ninguna regla',
    );
  });

  it('evalua el prompt del alumno criterio a criterio', () => {
    expect(evaluarPrompt('hablame de volcanes', RUBRICA)).toMatchObject({
      puntos: 1,
      nivel: 'pobre',
      cumplidos: ['tema'],
    });
    expect(evaluarPrompt('explicame los volcanes para mi abuela', RUBRICA).nivel).toBe('mejorable');
    const bueno = evaluarPrompt('explicame los volcanes para mi abuela en cinco renglones', RUBRICA);
    expect(bueno.nivel).toBe('bueno');
    expect(bueno.faltantes).toEqual([]);
  });

  it('el mismo encargo escrito mejor recibe otra respuesta', () => {
    const g: GuionAsistente = {
      respuestas: [
        { id: 'vaga', texto: 'Los volcanes son montanas que explotan.' },
        { id: 'buena', texto: 'Para tu abuela, en cinco renglones: un volcan es...' },
      ],
      reglas: [
        { tipo: 'calidad', nivel: 'bueno', responde: 'buena' },
        { tipo: 'calidad', nivel: 'pobre', responde: 'vaga' },
      ],
      porDefecto: { id: 'media', texto: 'Puedo mejorarlo si me dices para quien es.' },
      rubrica: RUBRICA,
    };
    expect(resolverGuion(g, { texto: 'hablame de volcanes' }).respuesta.id).toBe('vaga');
    expect(resolverGuion(g, { texto: 'explicame los volcanes para mi abuela' }).respuesta.id).toBe('media');
    expect(
      resolverGuion(g, { texto: 'explicame los volcanes para mi abuela en cinco renglones' }).respuesta.id,
    ).toBe('buena');
    // La evaluacion viaja con la respuesta: el cuaderno de prompts la necesita.
    expect(resolverGuion(g, { texto: 'hablame de volcanes' }).evaluacion?.faltantes).toEqual([
      'quien',
      'formato',
    ]);
  });

  it('la verdad de una respuesta troceada se deduce de sus partes', () => {
    const pulpos = GUION.respuestas!.find((r) => r.id === 'pulpos')!;
    expect(veracidadDe(pulpos)).toBe('falso'); // basta UNA parte falsa
    expect(veracidadDe({ id: 'x', texto: 'hola' })).toBe('neutro');
    expect(veracidadDe({ id: 'x', veracidad: 'cierto', partes: pulpos.partes })).toBe('cierto');
    // Y el tecleo se reparte entre las partes por el texto concatenado.
    expect(repartirRevelado(pulpos.partes!, 0)).toEqual(['', '']);
    expect(repartirRevelado(pulpos.partes!, 3)).toEqual(['Los', '']);
    expect(repartirRevelado(pulpos.partes!, PARTE_CIERTA.length + 2)).toEqual([PARTE_CIERTA, 'Y ']);
    expect(repartirRevelado(pulpos.partes!, 9999)).toEqual([PARTE_CIERTA, PARTE_FALSA]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2 · La maquina de la conversacion
// ═══════════════════════════════════════════════════════════════════════════

describe('la maquina de la conversacion', () => {
  it('con velocidad 0 el mensaje entra completo y NO se programa ni un reloj', () => {
    const { result } = renderHook(() => useAsistente({ guion: GUION, velocidad: 0 }));
    expect(jest.getTimerCount()).toBe(0);

    act(() => {
      result.current.enviarFicha('f-volcan');
    });

    const ultimo = result.current.mensajes[1];
    expect(ultimo.tipo).toBe('asistente');
    expect(ultimo).toMatchObject({ revelado: TEXTO_VOLCAN.length });
    expect(result.current.ocupado).toBe(false);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('con velocidad se escribe sola, letra a letra, hasta el final', () => {
    const { result } = renderHook(() => useAsistente({ guion: GUION, velocidad: 10, paso: 1 }));
    act(() => {
      result.current.enviarFicha('f-volcan');
    });
    expect(result.current.ocupado).toBe(true);
    expect(result.current.mensajes[1]).toMatchObject({ revelado: 0 });

    act(() => {
      jest.advanceTimersByTime(30);
    });
    expect(result.current.mensajes[1]).toMatchObject({ revelado: 3 });

    act(() => {
      jest.advanceTimersByTime(10 * TEXTO_VOLCAN.length);
    });
    expect(result.current.mensajes[1]).toMatchObject({ revelado: TEXTO_VOLCAN.length });
    expect(result.current.ocupado).toBe(false);
    expect(jest.getTimerCount()).toBe(0); // el intervalo se recogio

    /* Y otra seguida, esta vez troceada: el tecleo corre por el texto de las
       dos partes, y la segunda respuesta no se queda muda por venir detras. */
    const largoPulpos = PARTE_CIERTA.length + PARTE_FALSA.length;
    act(() => {
      result.current.enviarFicha('f-pulpos');
    });
    expect(result.current.mensajes[3]).toMatchObject({ revelado: 0 });
    act(() => {
      jest.advanceTimersByTime(10 * largoPulpos + 20);
    });
    expect(result.current.mensajes[3]).toMatchObject({ revelado: largoPulpos });
    expect(result.current.ocupado).toBe(false);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('saltar el tecleo deja el estado final sin esperar relojes', () => {
    const fin = jest.fn();
    const { result } = renderHook(() =>
      useAsistente({ guion: GUION, velocidad: 40, paso: 1, onFinTecleo: fin }),
    );
    act(() => {
      result.current.enviarFicha('f-volcan');
    });
    act(() => {
      result.current.saltarTecleo();
    });

    expect(result.current.mensajes[1]).toMatchObject({ revelado: TEXTO_VOLCAN.length });
    expect(result.current.ocupado).toBe(false);
    expect(fin).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('cien saltos sin nada que saltar no rompen nada', () => {
    const { result } = renderHook(() => useAsistente({ guion: GUION, velocidad: 0 }));
    act(() => {
      result.current.enviarFicha('f-volcan');
    });
    const antes = result.current.mensajes;
    act(() => {
      for (let i = 0; i < 100; i++) result.current.saltarTecleo();
    });
    expect(result.current.mensajes).toBe(antes); // ni un repintado
    expect(result.current.ocupado).toBe(false);
  });

  it('mandar otro mensaje mientras el asistente escribe no cuela', () => {
    const { result } = renderHook(() => useAsistente({ guion: GUION, velocidad: 40, paso: 1 }));
    let segundo = '';
    let tercero = '';
    act(() => {
      result.current.enviarFicha('f-volcan');
      segundo = result.current.enviarFicha('f-pulpos'); // en el MISMO tic
    });
    act(() => {
      tercero = result.current.enviarTexto('y de la lava?'); // ya repintado
    });

    expect(segundo).toBe('ocupado');
    expect(tercero).toBe('ocupado');
    expect(result.current.mensajes).toHaveLength(2); // el suyo y el del asistente
  });

  it('un mensaje vacio no se manda', () => {
    const { result } = renderHook(() => useAsistente({ guion: GUION, velocidad: 0 }));
    let a = '';
    let b = '';
    act(() => {
      a = result.current.enviarTexto('');
      b = result.current.enviarTexto('   \n  ');
    });
    expect(a).toBe('vacio');
    expect(b).toBe('vacio');
    expect(result.current.mensajes).toHaveLength(0);
  });

  it('lo que ningun patron reconoce recibe la respuesta por defecto, no silencio', () => {
    const { result } = renderHook(() => useAsistente({ guion: GUION, velocidad: 0 }));
    act(() => {
      result.current.enviarTexto('asdfgh qwerty 12345');
    });
    act(() => {
      result.current.enviarFicha('f-que-no-existe');
    });
    expect(result.current.mensajes).toHaveLength(4);
    expect(result.current.mensajes[1]).toMatchObject({ respuesta: 'no-se' });
    expect(result.current.mensajes[3]).toMatchObject({ respuesta: 'no-se' });
  });

  it('marcar un trozo cambia lo que se ensena y no toca la verdad', () => {
    const { result } = renderHook(() => useAsistente({ guion: GUION, velocidad: 0 }));
    act(() => {
      result.current.enviarFicha('f-pulpos');
    });
    act(() => {
      result.current.marcarParte('p-inmortal', 'error');
    });

    const m = result.current.mensajes[1];
    expect(m.tipo).toBe('asistente-troceado');
    if (m.tipo !== 'asistente-troceado') throw new Error('no troceado');
    expect(m.partes[1]).toMatchObject({ marca: 'error', veracidad: 'falso' });
    expect(m.partes[0]).toMatchObject({ marca: 'oculta', veracidad: 'cierto' });
  });

  it('reiniciar devuelve el hilo al saludo y borra las marcas', () => {
    const { result } = renderHook(() =>
      useAsistente({ guion: GUION, velocidad: 0, saludo: 'Hola, en que te ayudo?' }),
    );
    act(() => {
      result.current.enviarFicha('f-pulpos');
    });
    act(() => {
      result.current.marcarParte('p-inmortal', 'error');
    });
    act(() => {
      result.current.reiniciar();
    });

    expect(result.current.mensajes).toHaveLength(1);
    expect(result.current.mensajes[0]).toMatchObject({ texto: 'Hola, en que te ayudo?' });
    expect(result.current.marcas).toEqual({});
    expect(result.current.ultimo).toBeNull();
  });

  it('la pausa de «escribiendo…» retrasa la primera letra y bloquea el compositor', () => {
    const { result } = renderHook(() =>
      useAsistente({ guion: GUION, velocidad: 10, paso: 1, pensando: 500 }),
    );
    act(() => {
      result.current.enviarFicha('f-volcan');
    });
    expect(result.current.pensando).toBe(true);
    expect(result.current.ocupado).toBe(true);

    act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(result.current.mensajes[1]).toMatchObject({ revelado: 0 });

    act(() => {
      jest.advanceTimersByTime(120);
    });
    expect(result.current.pensando).toBe(false); // se acabo de pensar
    expect(result.current.ocupado).toBe(true);

    act(() => {
      jest.advanceTimersByTime(50); // y ahora si, las letras
    });
    expect((result.current.mensajes[1] as { revelado: number }).revelado).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3 · La ventana
// ═══════════════════════════════════════════════════════════════════════════

describe('la ventana', () => {
  it('pinta el hilo y el panel de la clase, y no inventa ningun ejercicio', () => {
    const mensajes: MensajeIA[] = [
      { tipo: 'usuario', id: 'u1', texto: 'Cuentame de los pulpos' },
      { tipo: 'asistente', id: 'a1', texto: 'Claro.', veracidad: 'neutro', revelado: 6, respuesta: 'r' },
      { tipo: 'aviso', id: 'v1', texto: 'Eso no se cuenta.', revelado: 17, respuesta: 'corte' },
    ];
    const { container } = render(
      <VentanaAsistente mensajes={mensajes} panel={<p>Banco de entrenamiento</p>} />,
    );

    expect(screen.getAllByTestId('asis-msg')).toHaveLength(3);
    expect(screen.getByText('Cuentame de los pulpos')).toBeInTheDocument();
    expect(screen.getByText('Eso no se cuenta.')).toBeInTheDocument();
    expect(screen.getByTestId('asis-panel')).toHaveTextContent('Banco de entrenamiento');
    // Sin compositor, sin acciones y sin `onTocarParte` la ventana no ofrece
    // NI UN control: no es un motor de plantillas, no pinta ejercicios.
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });

  it('la verdad de un trozo no llega al DOM', () => {
    const { container } = render(<VentanaAsistente mensajes={[troceado()]} />);
    const cierta = container.querySelector('[data-parte="p-corazones"]')!;
    const falsa = container.querySelector('[data-parte="p-inmortal"]')!;

    expect(cierta.className).toBe(falsa.className);
    expect(cierta.getAttribute('data-marca')).toBe(falsa.getAttribute('data-marca'));
    expect(container.querySelector('[data-veracidad]')).toBeNull();
    expect(container.innerHTML).not.toContain('veracidad');
    expect(container.innerHTML).not.toContain('inventada'); // la nota tampoco
  });

  it('senalar un trozo avisa a la clase y se ve senalado', () => {
    const tocar = jest.fn();
    const { container, rerender } = render(
      <VentanaAsistente mensajes={[troceado()]} onTocarParte={tocar} />,
    );
    fireEvent.click(container.querySelector('[data-parte="p-inmortal"]')!);
    expect(tocar).toHaveBeenCalledWith('p-inmortal');

    rerender(
      <VentanaAsistente
        mensajes={[troceado({ 'p-inmortal': 'senalada' })]}
        onTocarParte={tocar}
        parteActiva="p-inmortal"
      />,
    );
    const falsa = container.querySelector('[data-parte="p-inmortal"]')!;
    expect(falsa).toHaveAttribute('data-marca', 'senalada');
    expect(falsa).toHaveAttribute('aria-pressed', 'true');
  });

  it('una ficha gastada no se puede volver a pulsar, ni cien veces', () => {
    const enviar = jest.fn();
    const { container } = render(
      <VentanaAsistente
        mensajes={[]}
        vacio="Elige como preguntar."
        compositor={{
          titulo: 'Elige como preguntar',
          fichas: [FICHAS[0], { ...FICHAS[1], usada: true }],
          onEnviarFicha: enviar,
        }}
      />,
    );
    fireEvent.click(container.querySelector('[data-ficha="f-volcan"]')!);
    expect(enviar).toHaveBeenCalledWith('f-volcan');

    const gastada = container.querySelector('[data-ficha="f-pulpos"]')!;
    expect(gastada).toBeDisabled();
    for (let i = 0; i < 100; i++) fireEvent.click(gastada);
    expect(enviar).toHaveBeenCalledTimes(1);
  });

  it('de punta a punta: ficha, respuesta troceada, y el alumno senala el trozo falso', () => {
    const { container } = render(<Clase />);
    expect(screen.getByText('Hola, en que te ayudo?')).toBeInTheDocument();

    // El cuadro de escribir empieza vacio: no se puede enviar nada.
    expect(screen.getByTestId('asis-enviar')).toBeDisabled();

    fireEvent.click(container.querySelector('[data-ficha="f-pulpos"]')!);
    expect(screen.getByText('Cuentame sobre los pulpos.')).toBeInTheDocument();
    expect(container.querySelector('[data-parte="p-inmortal"]')).toHaveTextContent('casi inmortales');
    // Con velocidad 0 nada quedo a medio escribir ni hay relojes colgando.
    expect(container.querySelector('[data-tecleando]')).toBeNull();
    expect(jest.getTimerCount()).toBe(0);

    fireEvent.click(container.querySelector('[data-parte="p-inmortal"]')!);
    expect(container.querySelector('[data-parte="p-inmortal"]')).toHaveAttribute('data-marca', 'senalada');
    expect(container.querySelector('[data-parte="p-corazones"]')).toHaveAttribute('data-marca', 'oculta');

    // Y escribiendo libre: el guion corta cuando le cuentan un dato personal.
    fireEvent.change(screen.getByTestId('asis-libre'), {
      target: { value: 'mi direccion es avenida siempre viva 123' },
    });
    fireEvent.click(screen.getByTestId('asis-enviar'));
    expect(screen.getByText(/no se le cuenta a un asistente/)).toBeInTheDocument();
  });
});
