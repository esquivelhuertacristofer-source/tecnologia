/**
 * TECNIA JUEGOS · el motor, medido antes de escribir la ventana (§67).
 *
 * Lo que aquí se comprueba es lo que el pliego llamó «el riesgo nº 1»: que el
 * jugador de prueba termine «La mina» resuelta dentro del presupuesto, que
 * declare imposible un hueco de ocho casillas, y que las físicas hagan lo que
 * el alumno lee en el panel. Nada de esto monta React.
 */
import {
  CASILLA,
  CATALOGO_JUEGO,
  DIBUJOS,
  LADO_SPRITE,
  PALETA,
  PERFILES,
  alturaDeSaltoDelHeroe,
  alturaMaximaAlcanzada,
  cambiarPropiedad,
  crearEjecutor,
  guionesDe,
  heroeDePartida,
  mantener,
  meterSi,
  meterVarias,
  nivelSinMonedas,
  nivelVacio,
  nuevoActor,
  perfil,
  ponerActor,
  ponerGuiones,
  probarNivel,
  rellenarFila,
  saltarCada,
  simular,
  sondaDeContacto,
  svgDeDibujo,
  versionDe,
  vigente,
  type Nivel,
} from '@/components/simuladores/juego';
import {
  ID_BABOSA,
  ID_HEROE,
  ID_PUERTA,
  IDS_MONEDAS,
  IDS_PINCHOS,
  nivelLaMina,
} from '@/components/activities/n8/videojuegos/nivelLaMina';

/* ───────────────────────── los guiones de la clase ───────────────────────── */

function heroe(n: Nivel) {
  const h = n.actores.find((a) => a.id === ID_HEROE);
  if (!h) throw new Error('sin héroe');
  return h;
}

function conCaminar(n: Nivel): Nivel {
  let g = meterVarias(heroe(n).guiones, ID_HEROE, 'mientras-derecha', ['mover-derecha']);
  g = meterVarias(g, ID_HEROE, 'mientras-izquierda', ['mover-izquierda']);
  return ponerGuiones(n, ID_HEROE, g);
}

function conSaltoInfinito(n: Nivel): Nivel {
  return ponerGuiones(n, ID_HEROE, meterVarias(heroe(n).guiones, ID_HEROE, 'al-pulsar-espacio', ['saltar']));
}

function conSaltoBueno(n: Nivel): Nivel {
  const g = meterSi(heroe(n).guiones, ID_HEROE, 'al-pulsar-espacio', 'en-el-suelo', ['saltar']).programa;
  return ponerGuiones(n, ID_HEROE, g);
}

function conSaltoAjustado(n: Nivel, impulso = 6.5): Nivel {
  return cambiarPropiedad(n, ID_HEROE, 'impulso', impulso);
}

function conMonedas(n: Nivel): Nivel {
  let m = n;
  for (const id of IDS_MONEDAS) {
    const a = m.actores.find((x) => x.id === id);
    if (!a) continue;
    m = ponerGuiones(m, id, meterVarias(a.guiones, id, 'al-tocar-heroe', ['sumar-puntos', 'desaparecer']));
  }
  return m;
}

function conPinchos(n: Nivel): Nivel {
  let m = n;
  for (const id of IDS_PINCHOS) {
    const a = m.actores.find((x) => x.id === id);
    if (!a) continue;
    m = ponerGuiones(m, id, meterVarias(a.guiones, id, 'al-tocar-heroe', ['perder-vida', 'volver-al-inicio']));
  }
  return m;
}

function puerta(n: Nivel) {
  const a = n.actores.find((x) => x.id === ID_PUERTA);
  if (!a) throw new Error('sin puerta');
  return a;
}

function conPuertaSinCondicion(n: Nivel): Nivel {
  return ponerGuiones(n, ID_PUERTA, meterVarias(puerta(n).guiones, ID_PUERTA, 'al-tocar-heroe', ['ganar']));
}

function conPuertaBuena(n: Nivel): Nivel {
  const g = meterSi(puerta(n).guiones, ID_PUERTA, 'al-tocar-heroe', 'todas-las-monedas', ['ganar'], {
    sino: ['decir'],
  }).programa;
  return ponerGuiones(n, ID_PUERTA, g);
}

function heroeEn(n: Nivel, cx: number, cy: number): Nivel {
  return { ...n, actores: n.actores.map((a) => (a.id === ID_HEROE ? { ...a, cx, cy } : a)) };
}

/** «La mina» con los seis primeros encargos resueltos. */
function laMinaResuelta(): Nivel {
  let n = nivelLaMina();
  n = conCaminar(n);
  n = conSaltoBueno(n);
  n = conSaltoAjustado(n);
  n = conMonedas(n);
  n = conPinchos(n);
  n = conPuertaBuena(n);
  return n;
}

/* ─────────────────────────────── sprites ─────────────────────────────── */

describe('los sprites', () => {
  test('cada dibujo mide exactamente 16×16 y sólo usa letras de la paleta', () => {
    for (const [nombre, filas] of Object.entries(DIBUJOS)) {
      expect(filas.length).toBe(LADO_SPRITE);
      filas.forEach((fila, i) => {
        expect(`${nombre}[${i}]=${fila.length}`).toBe(`${nombre}[${i}]=${LADO_SPRITE}`);
        for (const letra of fila) {
          if (letra !== '.') expect(PALETA[letra]).toBeDefined();
        }
      });
    }
  });

  test('el SVG tiene rectángulos y bordes nítidos', () => {
    const svg = svgDeDibujo(DIBUJOS.heroe);
    expect(svg).toContain('crispEdges');
    expect((svg.match(/<rect /g) ?? []).length).toBeGreaterThan(40);
  });
});

/* ─────────────────────────────── físicas ─────────────────────────────── */

describe('las físicas', () => {
  test('sin guiones, el héroe se queda quieto sobre el suelo', () => {
    const p = simular(nivelLaMina(), mantener(false, true), 60);
    const h = heroeDePartida(p);
    expect(h?.x).toBe(1 * CASILLA);
    expect(h?.y).toBe(10 * CASILLA);
    expect(h?.enSuelo).toBe(true);
  });

  test('E1: con «mover a la derecha» bajo «mientras →», camina; con ←, retrocede', () => {
    const n = conCaminar(nivelLaMina());
    const der = heroeDePartida(simular(n, mantener(false, true), 60));
    expect((der?.x ?? 0) - 1 * CASILLA).toBeGreaterThanOrEqual(40);
    const izq = heroeDePartida(simular(n, mantener(true, false), 60));
    expect(izq?.x ?? 99).toBeLessThan(1 * CASILLA);
    /* Y contra el borde del nivel se para: nadie sale de la pantalla. */
    expect(izq?.x ?? -99).toBeGreaterThanOrEqual(-3);
  });

  test('E2: «saltar» sin condición vuela; con «si ¿en el suelo?» salta una vez', () => {
    const base = conCaminar(nivelLaMina());
    const formula = alturaDeSaltoDelHeroe(base);
    expect(formula).toBeCloseTo(1.81, 1);

    const vuela = alturaMaximaAlcanzada(conSaltoInfinito(base), saltarCada(8), 240);
    expect(vuela).toBeGreaterThan(1.6 * formula);

    const bien = alturaMaximaAlcanzada(conSaltoBueno(base), saltarCada(8), 240);
    expect(bien).toBeGreaterThanOrEqual(formula);
    expect(bien).toBeLessThanOrEqual(1.6 * formula);
    const p = simular(conSaltoBueno(base), saltarCada(8), 240);
    expect(p.saltos).toBeGreaterThan(1);
  });

  test('la altura real de un salto está siempre en o por encima de la fórmula del panel', () => {
    for (const impulso of [4.5, 5.8, 6, 6.5, 8]) {
      const n = conSaltoAjustado(conSaltoBueno(conCaminar(nivelLaMina())), impulso);
      const real = alturaMaximaAlcanzada(n, saltarCada(120), 120);
      expect(real).toBeGreaterThanOrEqual(alturaDeSaltoDelHeroe(n) - 0.01);
      expect(real).toBeLessThan(alturaDeSaltoDelHeroe(n) + 0.5);
    }
  });

  test('E3: con el impulso de fábrica no se sube a la repisa; con 6,5 sí', () => {
    const base = conSaltoBueno(conCaminar(nivelLaMina()));
    /* Se pone al héroe al pie de la repisa y se le hace saltar hacia ella. */
    const alPie = heroeEn(base, 15, 9);
    const teclas = (t: number) => ({ izquierda: false, derecha: true, salto: t === 2 });
    const corto = heroeDePartida(simular(alPie, teclas, 90));
    expect(corto?.y).toBe(9 * CASILLA);
    expect(corto?.x ?? 999).toBeLessThan(17 * CASILLA);

    const largo = heroeDePartida(simular(conSaltoAjustado(alPie), teclas, 90));
    expect(largo?.y).toBe(7 * CASILLA);
    expect(largo?.x ?? 0).toBeGreaterThanOrEqual(17 * CASILLA);
  });

  test('la babosa de fábrica patrulla sin caerse del suelo ni atravesar la repisa', () => {
    const p = simular(nivelLaMina(), mantener(false, false), 900);
    const b = p.actores.find((a) => a.id === ID_BABOSA);
    expect(b?.visible).toBe(true);
    expect(b?.y).toBe(10 * CASILLA);
    expect(b?.x ?? 0).toBeGreaterThanOrEqual(11 * CASILLA);
    expect(b?.x ?? 999).toBeLessThan(16 * CASILLA);
  });
});

/* ─────────────────────────────── contactos ───────────────────────────── */

describe('los contactos (sondas)', () => {
  test('E4: la moneda sin guion no suma; con «sumar puntos» + «desaparecer» suma una vez y se va', () => {
    const sin = sondaDeContacto(nivelLaMina(), IDS_MONEDAS[0]);
    expect(sin?.tocado).toBe(true);
    expect(sin?.partida.puntos).toBe(0);
    expect(sin?.partida.actores.find((a) => a.id === IDS_MONEDAS[0])?.visible).toBe(true);

    const con = sondaDeContacto(conMonedas(nivelLaMina()), IDS_MONEDAS[0]);
    expect(con?.tocado).toBe(true);
    expect(con?.partida.puntos).toBe(1);
    expect(con?.partida.monedasRecogidas).toBe(1);
    expect(con?.partida.actores.find((a) => a.id === IDS_MONEDAS[0])?.visible).toBe(false);
  });

  test('E5: el pincho quita UNA vida y devuelve al inicio; la invulnerabilidad evita la triple muerte', () => {
    const s = sondaDeContacto(conPinchos(nivelLaMina()), IDS_PINCHOS[0]);
    expect(s?.tocado).toBe(true);
    expect(s?.vidasPerdidas).toBe(1);
    expect(s?.volvioAlInicio).toBe(true);
    /* Sin «volver al inicio»: se queda encima, pero no pierde las tres vidas de golpe. */
    const soloHerir = ponerGuiones(
      nivelLaMina(),
      IDS_PINCHOS[0],
      meterVarias(guionesDe('pincho', IDS_PINCHOS[0]), IDS_PINCHOS[0], 'al-tocar-heroe', ['perder-vida']),
    );
    const p = simular(heroeEn(soloHerir, 15, 9), mantener(false, false), 30);
    expect(p.vidas).toBe(2);
    expect(p.perdio).toBe(false);
  });

  test('E6: la puerta sin condición gana sin monedas; con el «si» pide las monedas y avisa', () => {
    const tramposa = sondaDeContacto(conPuertaSinCondicion(nivelLaMina()), ID_PUERTA);
    expect(tramposa?.partida.gano).toBe(true);

    const buena = conPuertaBuena(nivelLaMina());
    const faltan = sondaDeContacto(buena, ID_PUERTA);
    expect(faltan?.tocado).toBe(true);
    expect(faltan?.partida.gano).toBe(false);
    expect(faltan?.dijoAlgo).toBe(true);
    const todas = sondaDeContacto(nivelSinMonedas(buena), ID_PUERTA);
    expect(todas?.partida.gano).toBe(true);
  });

  test('la babosa hiere y el contacto se dispara al ENTRAR, no cada tic', () => {
    const s = sondaDeContacto(nivelLaMina(), ID_BABOSA, 120);
    expect(s?.tocado).toBe(true);
    expect(s?.vidasPerdidas).toBe(1);
  });
});

/* ────────────────────────── la caché de guiones ─────────────────────────── */

describe('la ejecución con caché', () => {
  test('un guion con preguntas se interpreta una vez por camino de respuestas', () => {
    const ej = crearEjecutor(CATALOGO_JUEGO);
    const g = meterSi(guionesDe('heroe', 'h'), 'h', 'al-pulsar-espacio', 'en-el-suelo', ['saltar']).programa;
    const pila = 'h:al-pulsar-espacio';
    expect(ej.correr(g, pila, () => true).map((o) => o.verbo)).toEqual(['saltar']);
    expect(ej.correr(g, pila, () => false)).toEqual([]);
    for (let i = 0; i < 100; i += 1) ej.correr(g, pila, () => i % 2 === 0);
    expect(ej.llamadas()).toBe(2);
  });
});

/* ───────────────────────── el jugador de prueba ─────────────────────────── */

describe('el jugador de prueba', () => {
  const resuelta = laMinaResuelta();

  test.each(PERFILES.map((p) => [p.id] as const))('%s termina «La mina» resuelta dentro del presupuesto', (id) => {
    const t0 = Date.now();
    const r = probarNivel(resuelta, perfil(id));
    const ms = Date.now() - t0;
    // eslint-disable-next-line no-console
    console.log(`[bot ${id}] terminable=${r.terminable} nodos=${r.nodos} tics=${r.ticsRuta} ms=${ms} muertes=${r.muertes.length}`);
    expect(r.terminable).toBe(true);
    expect(r.nodos).toBeLessThan(perfil(id).presupuesto);
    expect(r.salto).toBe(true);
    expect(r.puntos).toBe(4);
    expect(r.ticsRuta).toBeGreaterThan(3 * 60);
    expect(ms).toBeLessThan(4000);
  });

  test('con la puerta tramposa, el experto termina sin todas las monedas', () => {
    const n = conPuertaSinCondicion(conSaltoAjustado(conSaltoBueno(conCaminar(nivelLaMina()))));
    const r = probarNivel(n, perfil('experto'));
    expect(r.terminable).toBe(true);
    expect(r.puntos).toBeLessThan(4);
  });

  test('sin guion en la puerta no hay manera de ganar: se agota y lo dice', () => {
    const n = conMonedas(conSaltoAjustado(conSaltoBueno(conCaminar(nivelLaMina()))));
    const r = probarNivel(n, perfil('novato'));
    expect(r.terminable).toBe(false);
  });

  test('un hueco de ocho casillas es imposible, y la calavera queda en el hueco', () => {
    let n = nivelVacio('Hueco', 3);
    n = rellenarFila(n, 11, 1, 0, 5);
    n = rellenarFila(n, 11, 1, 14, 21);
    n = ponerActor(n, nuevoActor('heroe', 1, 10, ID_HEROE, guionesDe('heroe', ID_HEROE)));
    n = ponerActor(n, nuevoActor('puerta', 20, 10, ID_PUERTA, guionesDe('puerta', ID_PUERTA)));
    n = conPuertaSinCondicion(conSaltoAjustado(conSaltoBueno(conCaminar(n))));
    const t0 = Date.now();
    const r = probarNivel(n, perfil('experto'));
    const ms = Date.now() - t0;
    // eslint-disable-next-line no-console
    console.log(`[bot hueco-8] terminable=${r.terminable} nodos=${r.nodos} ms=${ms} muertes=${r.muertes.length}`);
    expect(r.terminable).toBe(false);
    expect(r.muertes.length).toBeGreaterThan(0);
    expect(r.muertes.some((m) => m.x > 5 * CASILLA && m.x < 14 * CASILLA)).toBe(true);
    expect(ms).toBeLessThan(6000);
  });

  test('el resultado caduca cuando el nivel cambia', () => {
    const r = probarNivel(resuelta, perfil('experto'));
    expect(vigente(r, resuelta)).toBe(true);
    const otro = cambiarPropiedad(resuelta, ID_HEROE, 'velocidad', 2);
    expect(vigente(r, otro)).toBe(false);
    expect(versionDe(otro)).not.toBe(versionDe(resuelta));
  });
});
