/**
 * El intérprete de `Tecnia Bloques` (N4 · U3 · paradas 1 y 2).
 *
 * El documento §25.1 promete cosas muy concretas que el alumno TIENE que ver:
 * que dejar `recoger moneda` fuera de la C hace que el muñeco se agache en el
 * vacío una y otra vez; que elegir «¿tocando la moneda?» en el reto 2 hace que
 * salte por encima de la moneda y se estrelle contra la pared; que con «si… si
 * no…» el muñeco alterna recoger y avanzar hasta llevarse las tres monedas.
 * Esas promesas se comprueban aquí, sobre el modelo puro, y no a ojo sobre la
 * animación: una animación bonita puede estar ejecutando cualquier cosa.
 *
 * La parada 2 (§25.2) añade el marcador, y con él dos errores que el documento
 * promete por escrito: que el `poner a 0` metido dentro del bucle deja el
 * marcador «pegado en 0», y que el `sumar` colocado fuera de la C lo hace «subir
 * sin parar aunque el personaje no toque nada». Los dos tienen que EMERGER de
 * ejecutar el programa mal armado; si hubiera que escribirlos a mano, el alumno
 * no estaría descubriendo nada, estaría leyendo un cartel. Por eso cada reto se
 * prueba tres veces: bien armado, y con cada uno de sus dos errores.
 */
import {
  CASILLA_PARED,
  LIMITE_ORDENES,
  nodosDe,
  simular,
  ubicarAccion,
  type Ajustes,
  type Condicion,
  type NodoOrden,
  type NodoSi,
  type NodoSiNo,
  type Programa,
} from '../components/activities/n4/estudio/programaBloques';

let contador = 0;
const nuevoId = () => `n${(contador += 1)}`;

const orden = (accion: NodoOrden['accion']): NodoOrden => ({ tipo: 'orden', id: nuevoId(), accion });
const pregunta = (p: Condicion['pregunta']): Condicion => ({ id: nuevoId(), pregunta: p });
const si = (condicion: Condicion | null, cuerpo: NodoOrden[]): NodoSi => ({
  tipo: 'si',
  id: nuevoId(),
  condicion,
  cuerpo,
});
const siNo = (condicion: Condicion | null, cuerpo: NodoOrden[], sino: NodoOrden[]): NodoSiNo => ({
  tipo: 'sino',
  id: nuevoId(),
  condicion,
  cuerpo,
  sino,
});

const MUNDO_1 = { casilla: 0, rumbo: 0, monedas: [1, 5], paredArriba: false };
const MUNDO_2 = { casilla: 0, rumbo: 0, monedas: [1], paredArriba: true };
const MUNDO_3 = { casilla: 0, rumbo: 0, monedas: [1, 4, 6], paredArriba: false };

const programa = (...siempre: Programa['siempre']): Programa => ({ siempre });

/** Con zona de arranque: lo que va pegado al sombrero, fuera del `por siempre`. */
const conInicio = (inicio: NodoOrden[], ...siempre: Programa['siempre']): Programa => ({
  inicio,
  siempre,
});

describe('reto 1 · recoger sólo cuando la esté tocando', () => {
  it('con el `recoger` dentro de la C se lleva las dos monedas y nunca se agacha en el vacío', () => {
    const salida = simular(
      programa(orden('avanzar'), si(pregunta('tocando-moneda'), [orden('recoger')])),
      MUNDO_1
    );
    expect(salida.fin).toBe('monedas');
    expect(salida.vacios).toBe(0);
    expect(salida.pasos.filter((p) => p.efecto.tipo === 'recoge')).toHaveLength(2);
  });

  it('con el `recoger` FUERA de la C se agacha en el vacío y la ejecución se corta', () => {
    const salida = simular(programa(orden('avanzar'), orden('recoger')), MUNDO_1);
    expect(salida.fin).toBe('vacio');
    expect(salida.vacios).toBe(2);
    // Alcanzó a recoger la primera moneda: el fallo no es que no recoja nunca,
    // es que recoge donde no hay nada. Esa es justo la frase 3 de Bit.
    expect(salida.pasos.filter((p) => p.efecto.tipo === 'recoge')).toHaveLength(1);
  });

  it('un `si` al que le falta la pregunta no hace ni la rama del sí ni la del no', () => {
    const salida = simular(programa(orden('avanzar'), si(null, [orden('recoger')])), MUNDO_1);
    expect(salida.pasos.some((p) => p.efecto.tipo === 'recoge')).toBe(false);
    expect(salida.vacios).toBe(0);
    expect(salida.fin).toBe('limite');
  });
});

describe('reto 2 · saltar sólo cuando toque la pared', () => {
  it('con «¿tocando la pared?» supera la pared y nunca se estrella', () => {
    const salida = simular(
      programa(orden('avanzar'), si(pregunta('tocando-pared'), [orden('saltar')])),
      MUNDO_2
    );
    expect(salida.fin).not.toBe('choque');
    expect(salida.paredSuperada).toBe(true);
    expect(salida.ordenes).toBe(LIMITE_ORDENES);
  });

  it('con «¿tocando la moneda?» salta por encima de la moneda y se estrella', () => {
    const salida = simular(
      programa(orden('avanzar'), si(pregunta('tocando-moneda'), [orden('saltar')])),
      MUNDO_2
    );
    expect(salida.fin).toBe('choque');
    // La moneda sigue en el tablero: saltó por encima de ella sin recogerla.
    expect(salida.pasos.some((p) => p.efecto.tipo === 'recoge')).toBe(false);
    const salto = salida.pasos.find((p) => p.efecto.tipo === 'salta');
    expect(salto?.efecto).toMatchObject({ desde: 1, hacia: 2 });
    const choque = salida.pasos[salida.pasos.length - 1];
    expect(choque.efecto).toEqual({ tipo: 'choca', en: CASILLA_PARED });
  });

  it('sin ninguna condición en el hueco, avanza hasta la pared y choca', () => {
    const salida = simular(programa(orden('avanzar'), si(null, [orden('saltar')])), MUNDO_2);
    expect(salida.fin).toBe('choque');
    expect(salida.paredSuperada).toBe(false);
  });
});

describe('reto 3 · si… si no…', () => {
  it('recoger arriba y avanzar abajo se lleva las tres monedas', () => {
    const salida = simular(
      programa(siNo(pregunta('tocando-moneda'), [orden('recoger')], [orden('avanzar')])),
      MUNDO_3
    );
    expect(salida.fin).toBe('monedas');
    expect(salida.vacios).toBe(0);
    expect(salida.pasos.filter((p) => p.efecto.tipo === 'recoge')).toHaveLength(3);
  });

  it('con las dos ramas cambiadas se agacha en el vacío desde la primera casilla', () => {
    const salida = simular(
      programa(siNo(pregunta('tocando-moneda'), [orden('avanzar')], [orden('recoger')])),
      MUNDO_3
    );
    expect(salida.fin).toBe('vacio');
    expect(salida.pasos[1].efecto).toEqual({ tipo: 'vacio', en: 0 });
  });

  it('el bloque en C se ilumina antes que la acción: primero mira, después hace', () => {
    const salida = simular(
      programa(siNo(pregunta('tocando-moneda'), [orden('recoger')], [orden('avanzar')])),
      MUNDO_3
    );
    expect(salida.pasos[0].efecto).toMatchObject({ tipo: 'mira', respuesta: false });
    expect(salida.pasos[1].efecto).toMatchObject({ tipo: 'avanza', desde: 0, hacia: 1 });
    expect(salida.pasos[2].efecto).toMatchObject({ tipo: 'mira', respuesta: true });
    expect(salida.pasos[3].efecto).toMatchObject({ tipo: 'recoge', en: 1 });
  });
});

describe('redes de seguridad', () => {
  it('un `por siempre` sin ninguna orden no cuelga el navegador', () => {
    const salida = simular(programa(si(pregunta('tocando-pared'), [])), MUNDO_1);
    expect(salida.ordenes).toBe(0);
    expect(salida.pasos.length).toBeLessThan(10);
  });

  it('un programa que nunca acaba se corta en el tope de órdenes', () => {
    const salida = simular(programa(orden('avanzar')), { ...MUNDO_1, monedas: [] });
    expect(salida.fin).toBe('limite');
    expect(salida.ordenes).toBe(LIMITE_ORDENES);
  });

  it('el rumbo se acumula y nunca da marcha atrás al cerrar la vuelta', () => {
    const salida = simular(programa(orden('avanzar')), { ...MUNDO_1, monedas: [] });
    const rumbos = salida.pasos.map((p) => p.rumbo);
    for (let i = 1; i < rumbos.length; i += 1) {
      expect(rumbos[i]).toBeGreaterThanOrEqual(rumbos[i - 1]);
    }
    // Tres vueltas completas: 3 × 2π, con las cuatro esquinas de cada vuelta.
    expect(rumbos[rumbos.length - 1]).toBeCloseTo(3 * 2 * Math.PI, 5);
  });
});

/* ── §25.2 · el marcador ───────────────────────────────────────────────────── */

const MUNDO_TRES = { casilla: 0, rumbo: 0, monedas: [1, 3, 5], paredArriba: false };
/** Los cinco del reto 3: «El escenario tiene exactamente 5 monedas» (§25.2). */
const MUNDO_CINCO = { casilla: 0, rumbo: 0, monedas: [1, 3, 4, 5, 6], paredArriba: false };

/**
 * En el reto 1 todavía no existe la pieza `sumar`: contar sigue siendo cosa del
 * juego, y el alumno sólo pone el marcador a cero. Arranca en 3 —«lo de la vez
 * pasada», textual del documento— porque si arrancara en 0 el olvido de
 * inicializar no se notaría y el reto no tendría nada que enseñar.
 */
const RETO_1: Ajustes = {
  puntosIniciales: 3,
  sumaAlRecoger: true,
  metaPuntos: 5,
  finAlQuedarseSinMonedas: true,
};

/**
 * En el reto 2 el juego deja de contar solo: poner el `sumar` donde toca ES el
 * reto. Y en cuanto contar depende de un bloque, recoger la última moneda ya no
 * puede terminar la partida —lo primero que se midió aquí fue justo eso: la
 * corrida se cortaba al levantar la tercera moneda y el `sumar` que va pegado
 * detrás no llegaba a ejecutarse, así que el programa BIEN armado acababa
 * marcando dos de tres—. Un marcador que miente en la solución correcta deja el
 * reto sin nada que enseñar.
 */
const RETO_2: Ajustes = {
  ...RETO_1,
  puntosIniciales: 0,
  sumaAlRecoger: false,
  finAlQuedarseSinMonedas: false,
};

/**
 * El reto 3 necesita ese mismo trato por la misma razón, sólo que más grave: con
 * cinco monedas y meta cinco, cortar al recoger la quinta mataría la corrida un
 * bloque ANTES del `mostrar` y el ¡GANASTE! no se encendería nunca. Lo único que
 * cambia de un reto al otro es el escenario —tres monedas contra cinco—, no los
 * ajustes.
 */
const RETO_3: Ajustes = RETO_2;

describe('§25.2 reto 1 · crear el marcador y ponerlo en cero', () => {
  it('con el `poner a 0` en el arranque el marcador se enciende en cero y cuenta bien', () => {
    const salida = simular(
      conInicio([orden('poner-cero')], orden('avanzar'), si(pregunta('tocando-moneda'), [orden('recoger')])),
      MUNDO_TRES,
      RETO_1
    );
    // Lo PRIMERO que se ve, antes de que el muñeco dé un paso: el marcador a 0.
    expect(salida.pasos[0].efecto).toEqual({ tipo: 'pone', valor: 0 });
    expect(salida.fin).toBe('monedas');
    expect(salida.puntos).toBe(3);
  });

  it('con el `poner a 0` DENTRO del bucle el marcador se queda pegado en cero', () => {
    const salida = simular(
      programa(orden('poner-cero'), orden('avanzar'), si(pregunta('tocando-moneda'), [orden('recoger')])),
      MUNDO_TRES,
      RETO_1
    );
    // Recoge las tres monedas igual —el muñeco hace su trabajo—, pero cada vuelta
    // borra la cuenta antes de empezar, así que el marcador nunca pasa de uno.
    expect(salida.pasos.filter((p) => p.efecto.tipo === 'recoge')).toHaveLength(3);
    expect(salida.puntos).toBe(1);
    // Se mira el dígito que el tablero llegó a enseñar DESPUÉS del primer cero, no
    // `puntosMaximos`: ese arranca valiendo lo que traía el marcador de la partida
    // anterior y aquí taparía el síntoma con un 3 que ya nadie está mirando.
    const desdeElCero = salida.pasos.slice(salida.pasos.findIndex((p) => p.efecto.tipo === 'pone'));
    expect(Math.max(...desdeElCero.map((p) => p.puntos))).toBe(1);
  });

  it('sin ningún `poner a 0` el marcador arranca torcido y miente al terminar', () => {
    const salida = simular(
      programa(orden('avanzar'), si(pregunta('tocando-moneda'), [orden('recoger')])),
      MUNDO_TRES,
      RETO_1
    );
    expect(salida.pasos.some((p) => p.efecto.tipo === 'pone')).toBe(false);
    // Tres monedas recogidas, seis puntos en el marcador: los tres de la partida
    // anterior siguen ahí. Eso es «arranca con lo de la vez pasada», visible.
    expect(salida.pasos.filter((p) => p.efecto.tipo === 'recoge')).toHaveLength(3);
    expect(salida.puntos).toBe(6);
  });
});

describe('§25.2 reto 2 · sumar donde toca', () => {
  const DENTRO = conInicio(
    [orden('poner-cero')],
    orden('avanzar'),
    si(pregunta('tocando-moneda'), [orden('recoger'), orden('sumar')])
  );

  it('con el `sumar` dentro de la C hay exactamente una suma por moneda', () => {
    const salida = simular(DENTRO, MUNDO_TRES, RETO_2);
    expect(salida.puntos).toBe(3);
    const tipos = salida.pasos.map((p) => p.efecto.tipo);
    // Y cada suma va pegada detrás de su recogida, nunca suelta.
    tipos.forEach((t, i) => {
      if (t === 'suma') expect(tipos[i - 1]).toBe('recoge');
    });
  });

  it('con el `sumar` FUERA de la C el marcador sube sin que el muñeco toque nada', () => {
    const salida = simular(
      conInicio(
        [orden('poner-cero')],
        orden('avanzar'),
        orden('sumar'),
        si(pregunta('tocando-moneda'), [orden('recoger')])
      ),
      MUNDO_TRES,
      RETO_2
    );
    const recogidas = salida.pasos.filter((p) => p.efecto.tipo === 'recoge').length;
    const sumas = salida.pasos.filter((p) => p.efecto.tipo === 'suma');
    expect(recogidas).toBe(3);
    // El espejo exacto de la prueba de arriba: allí TODA suma iba pegada detrás de
    // una recogida; aquí NINGUNA. Suma por dar un paso, no por levantar algo, y
    // eso es lo que se ve como un marcador que se dispara solo.
    const trasRecoger = sumas.filter(
      (p) => salida.pasos[salida.pasos.indexOf(p) - 1]?.efecto.tipo === 'recoge'
    );
    expect(trasRecoger).toHaveLength(0);
    expect(sumas.length).toBeGreaterThan(recogidas);
    expect(salida.puntos).toBeGreaterThan(recogidas);
  });

  it('el laboratorio distingue las dos por la FORMA, no sólo por el resultado', () => {
    // Sin esto, un `sumar` fuera de la C que casualmente diera 3 pasaría por
    // bueno. La pieza tiene que estar donde tiene que estar.
    const [dentro] = ubicarAccion(DENTRO, 'sumar');
    expect(dentro).toMatchObject({ zona: 'dentro-de-c', condicion: 'tocando-moneda' });

    const fuera = ubicarAccion(programa(orden('sumar')), 'sumar');
    expect(fuera).toHaveLength(1);
    expect(fuera[0]).toMatchObject({ zona: 'siempre', condicion: null });

    const arranque = ubicarAccion(conInicio([orden('poner-cero')]), 'poner-cero');
    expect(arranque[0]).toMatchObject({ zona: 'inicio', condicion: null });
  });
});

describe('§25.2 reto 3 · la variable como condición', () => {
  const CUENTA = si(pregunta('tocando-moneda'), [orden('recoger'), orden('sumar')]);
  const GANA = si(pregunta('puntos-igual-meta'), [orden('mostrar')]);

  it('recoge las cinco monedas y el letrero se enciende justo al llegar a cinco', () => {
    const salida = simular(
      conInicio([orden('poner-cero')], orden('avanzar'), CUENTA, GANA),
      MUNDO_CINCO,
      RETO_3
    );
    expect(salida.fin).toBe('gana');
    expect(salida.puntos).toBe(5);
    expect(salida.pasos.filter((p) => p.efecto.tipo === 'recoge')).toHaveLength(5);
    // El ¡GANASTE! es lo último que pasa, y llega marcando cinco.
    expect(salida.pasos[salida.pasos.length - 1].efecto).toEqual({ tipo: 'gana', valor: 5 });
  });

  it('con el `mostrar` fuera de la C el letrero se enciende en la primera vuelta con un punto', () => {
    const salida = simular(
      conInicio([orden('poner-cero')], orden('avanzar'), CUENTA, orden('mostrar')),
      MUNDO_CINCO,
      RETO_3
    );
    // El intérprete es fiel a los bloques: enciende el letrero porque se lo
    // mandaron. Juzgar que eso NO es ganar es cosa del laboratorio, que compara
    // el valor con la meta —y aquí le sale 1 contra 5—.
    expect(salida.fin).toBe('gana');
    expect(salida.puntos).toBe(1);
  });

  it('sin el `poner a 0` gana con dos monedas y tres todavía en el tablero', () => {
    const salida = simular(programa(orden('avanzar'), CUENTA, GANA), MUNDO_CINCO, {
      ...RETO_3,
      puntosIniciales: 3,
    });
    expect(salida.fin).toBe('gana');
    expect(salida.puntos).toBe(5);
    expect(salida.pasos.filter((p) => p.efecto.tipo === 'recoge')).toHaveLength(2);
    expect(salida.pasos[salida.pasos.length - 1].monedas).toHaveLength(3);
  });
});

describe('§25.2 redes de seguridad', () => {
  it('el arranque corre una sola vez y antes de la primera vuelta', () => {
    const salida = simular(
      conInicio([orden('poner-cero'), orden('sumar')], orden('avanzar')),
      { ...MUNDO_TRES, monedas: [] },
      RETO_2
    );
    expect(salida.pasos.slice(0, 2).map((p) => p.efecto.tipo)).toEqual(['pone', 'suma']);
    expect(salida.pasos.filter((p) => p.efecto.tipo === 'pone')).toHaveLength(1);
  });

  it('sumar y poner en cero no gastan cupo de órdenes: no mueven a nadie', () => {
    const conVariable = simular(
      conInicio([orden('poner-cero')], orden('avanzar'), orden('sumar')),
      { ...MUNDO_TRES, monedas: [] },
      RETO_2
    );
    const sinVariable = simular(programa(orden('avanzar')), { ...MUNDO_TRES, monedas: [] }, RETO_2);
    // Las dos corridas dan las mismas vueltas al tablero; la del marcador sólo
    // añade dígitos. Si el cupo lo gastara `sumar`, el muñeco andaría la mitad.
    expect(conVariable.ordenes).toBe(sinVariable.ordenes);
    expect(conVariable.ordenes).toBe(LIMITE_ORDENES);
    // Una suma por vuelta menos una: la vuelta que agota el cupo se corta justo
    // después del `avanzar`, y su `sumar` ya no llega a ejecutarse.
    expect(conVariable.puntos).toBe(LIMITE_ORDENES - 1);
  });

  it('un bucle que sólo toca el marcador termina en vez de girar para siempre', () => {
    const salida = simular(programa(orden('sumar')), MUNDO_TRES, RETO_2);
    expect(salida.ordenes).toBe(0);
    expect(salida.fin).toBe('limite');
    expect(salida.pasos.length).toBeLessThan(100);
  });

  it('`nodosDe` ve también las piezas del arranque, para poder iluminarlas', () => {
    const cero = orden('poner-cero');
    const nodos = nodosDe(conInicio([cero], orden('avanzar'), si(pregunta('tocando-moneda'), [orden('recoger')])));
    expect(nodos).toContain(cero);
  });

  it('la parada 1 sigue siendo la de siempre: sin ajustes, nada cambió', () => {
    const p = programa(orden('avanzar'), si(pregunta('tocando-moneda'), [orden('recoger')]));
    expect(simular(p, MUNDO_1)).toEqual(simular(p, MUNDO_1, undefined));
  });
});
