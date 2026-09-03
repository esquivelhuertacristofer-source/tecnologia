/**
 * Banco Físico 3D — pruebas del armazón.
 *
 * Veinticuatro de las veinticinco no montan nada. No es una preferencia: jsdom
 * no tiene WebGL, no tiene `PointerEvent` con coordenadas —`fireEvent.pointerDown(el,
 * {clientX})` construye un `Event` pelado y las coordenadas se pierden en
 * silencio, así que la prueba sale verde sin haber comprobado nada— y
 * `getBoundingClientRect` devuelve ceros. Probar el arrastre a través del DOM
 * aquí es probar el vacío.
 *
 * Por eso el armazón está partido para que el navegador fabrique **un solo
 * dato** —el rayo del puntero— y todo lo demás sea aritmética. Estas pruebas
 * escriben ese dato a mano y comprueban las decisiones.
 *
 * Se juega MAL a propósito: soltar en el vacío, meter la pieza en el hueco
 * equivocado, meter dos en el mismo, sacar una ya puesta, girar sin parar,
 * arrastrar y girar a la vez, y seguir tocando con el montaje terminado.
 */

import { render, screen } from '@testing-library/react';
import {
  ESTADO_VACIO,
  anclajeApuntado,
  anclajeMasCercano,
  aplicarSuelta,
  avanceDeArrastre,
  devolver,
  distanciaAlRayo,
  dondeEsta,
  evaluar,
  montajeCompleto,
  partirEnLineas,
  posicionDe,
  puedeTomar,
  puntoSobreRayo,
  quitarPieza,
  resolverSuelta,
  resolverSueltaEn,
  seAplico,
  soltar,
  tomar,
  validarBanco,
  type BancoDef,
  type EstadoBanco,
  type Punto3,
  type Rayo,
} from '@/components/simuladores/laboratorio3d/bancoFisico';
import {
  LIMITES_BANCO,
  limitarOrbita,
  normalizarAngulo,
  orbitaHabilitada,
  pasoDeEnfoque,
} from '@/components/simuladores/laboratorio3d/orbita';
import { BancoFisico3D } from '@/components/simuladores/laboratorio3d/BancoFisico3D';

/** La trasera del equipo de `n5-conecta-perifericos`, con su lata de aire. */
const BANCO: BancoDef = {
  tolerancia: 0.4,
  piezas: [
    { id: 'teclado', tipo: 'usb', origen: [-2, 0, 1.4], etiqueta: 'Teclado' },
    { id: 'raton', tipo: 'usb', origen: [-1, 0, 1.4], etiqueta: 'Ratón' },
    { id: 'monitor', tipo: 'hdmi', origen: [0, 0, 1.4], etiqueta: 'Monitor' },
    { id: 'bocinas', tipo: 'audio', origen: [1, 0, 1.4], etiqueta: 'Bocinas' },
    { id: 'aire', tipo: 'aire', origen: [2, 0, 1.4], etiqueta: 'Aire comprimido', gasta: true },
    { id: 'rejilla', tipo: 'fijo', origen: [0, 1.2, -1], etiqueta: 'Rejilla', tomable: false },
  ],
  anclajes: [
    { id: 'usb1', punto: [-1.2, 0.6, -1], acepta: ['usb'], etiqueta: 'USB 1' },
    { id: 'usb2', punto: [-0.2, 0.6, -1], acepta: ['usb'], etiqueta: 'USB 2' },
    { id: 'hdmi', punto: [0.8, 0.6, -1], acepta: ['hdmi'], etiqueta: 'HDMI' },
    { id: 'audio', punto: [1.8, 0.6, -1], acepta: ['audio'], etiqueta: 'Audio' },
    { id: 'ventilador', punto: [0.8, 1.9, -1], acepta: ['aire'], etiqueta: 'Ventilador' },
  ],
};

/** Un estado con la pieza ya en la mano, que es de donde parte toda suelta. */
const enLaMano = (pieza: string, base: EstadoBanco = ESTADO_VACIO): EstadoBanco =>
  tomar(BANCO, base, pieza);

/** Rayo que sale de `ojo` y pasa exactamente por `blanco`. */
function apuntarA(ojo: Punto3, blanco: Punto3): Rayo {
  return { origen: ojo, hacia: [blanco[0] - ojo[0], blanco[1] - ojo[1], blanco[2] - ojo[2]] };
}

describe('Banco Físico 3D · encaje por proximidad', () => {
  it('elige el hueco más cercano de los que están en tolerancia, y cada hueco trae la suya', () => {
    // Justo entre usb1 y usb2, un pelo escorado hacia usb2.
    const cerca = anclajeMasCercano(BANCO, [-0.5, 0.6, -1]);
    expect(cerca?.anclaje.id).toBe('usb2');
    expect(cerca?.distancia).toBeCloseTo(0.3, 5);
    // A mitad de camino exacto no alcanza a ninguno: eso es el vacío.
    expect(anclajeMasCercano(BANCO, [-0.7, 0.6, -1])).toBeNull();

    // Un jack de audio es un agujero de tres milímetros y una bahía de fuente
    // es un cajón: la tolerancia del hueco pisa la del banco.
    const angosto: BancoDef = {
      ...BANCO,
      anclajes: [{ id: 'jack', punto: [0, 0, 0], acepta: ['audio'], tolerancia: 0.08, etiqueta: 'Jack' }],
    };
    expect(anclajeMasCercano(angosto, [0.2, 0, 0])).toBeNull();
    expect(anclajeMasCercano(angosto, [0.05, 0, 0])?.anclaje.id).toBe('jack');

    // Un tornillo dentro de una bahía: dos huecos anidados, los dos alcanzables
    // desde el mismo punto. Gana el más cercano, no el primero de la lista ni
    // el más grande. (`validarBanco` lo marca como ambiguo, y lo es; aun así el
    // resultado tiene que ser el mismo siempre y no depender del orden.)
    const anidado: BancoDef = {
      tolerancia: 0.4,
      piezas: [],
      anclajes: [
        { id: 'bahia', punto: [0, 0, 0], acepta: ['fuente'], tolerancia: 0.9, etiqueta: 'Bahía' },
        { id: 'tornillo', punto: [0.5, 0, 0], acepta: ['tornillo'], tolerancia: 0.25, etiqueta: 'Tornillo' },
      ],
    };
    expect(anclajeMasCercano(anidado, [0.45, 0, 0])?.anclaje.id).toBe('tornillo');
    expect(anclajeMasCercano(anidado, [-0.4, 0, 0])?.anclaje.id).toBe('bahia');
  });

  it('el rayo mide perpendicular y profundidad, y descarta lo que queda a la espalda', () => {
    const rayo: Rayo = { origen: [0, 0, 0], hacia: [0, 0, -1] };
    const delante = distanciaAlRayo([0.3, 0, -4], rayo);
    expect(delante.distancia).toBeCloseTo(0.3, 6);
    expect(delante.avance).toBeCloseTo(4, 6);

    const detras = distanciaAlRayo([0, 0, 5], rayo);
    expect(detras.avance).toBeLessThan(0);
    // Un hueco a la espalda del alumno no se puede apuntar por muy alineado
    // que esté con la mira.
    const espalda: BancoDef = {
      ...BANCO,
      anclajes: [{ id: 'atras', punto: [0, 0, 5], acepta: ['usb'], etiqueta: 'Atrás' }],
    };
    expect(anclajeApuntado(espalda, { rayo })).toBeNull();

    // Dos huecos casi alineados con la mira, a tres unidades uno del otro:
    // gana el que está mejor centrado en la puntería, no el más cercano al ojo
    // ni el primero de la lista. Apuntar es apuntar.
    const enFila: BancoDef = {
      tolerancia: 0.4,
      piezas: [],
      anclajes: [
        { id: 'cerca', punto: [0.3, 0, -1], acepta: ['usb'], etiqueta: 'Cerca' },
        { id: 'lejos', punto: [0.1, 0, -3], acepta: ['usb'], etiqueta: 'Lejos' },
      ],
    };
    expect(anclajeApuntado(enFila, { rayo })?.anclaje.id).toBe('lejos');
  });

  it('MEDIDO: con huecos repartidos en profundidad, el rayo acierta y un plano de arrastre no llega a ninguno', () => {
    // La casa de `n9-sensores-iot`: un sensor junto a la puerta de entrada y
    // otro en el techo del fondo del pasillo. Están separados casi cinco
    // unidades EN LA DIRECCIÓN EN QUE MIRA el alumno, que es el caso que rompe
    // la solución obvia.
    const casa: BancoDef = {
      tolerancia: 0.4,
      piezas: [{ id: 'sensor', tipo: 'iot', origen: [0, 0, 3], etiqueta: 'Sensor' }],
      anclajes: [
        { id: 'puerta', punto: [1.4, 0.9, 2.2], acepta: ['iot'], etiqueta: 'Puerta' },
        { id: 'pasillo', punto: [-0.2, 2.4, -2.6], acepta: ['iot'], etiqueta: 'Pasillo' },
      ],
    };
    const ojo: Punto3 = [0, 1.8, 5];
    const centro: Punto3 = [0.6, 1.65, -0.2]; // el promedio de los dos huecos
    const rayo = apuntarA(ojo, casa.anclajes[1].punto); // apunta al del pasillo

    // Con el rayo: acierta, y sólo ése.
    expect(anclajeApuntado(casa, { rayo })?.anclaje.id).toBe('pasillo');

    // Con un plano de arrastre de cara a la cámara que pase por el centro de
    // los huecos —la solución que parece natural—, se calcula aquí mismo dónde
    // cae la pieza y se mide contra los dos huecos.
    const norma = (v: Punto3): Punto3 => {
      const l = Math.hypot(v[0], v[1], v[2]);
      return [v[0] / l, v[1] / l, v[2] / l];
    };
    const n = norma([centro[0] - ojo[0], centro[1] - ojo[1], centro[2] - ojo[2]]);
    const d = norma(rayo.hacia);
    const aPlano: Punto3 = [centro[0] - ojo[0], centro[1] - ojo[1], centro[2] - ojo[2]];
    const t =
      (aPlano[0] * n[0] + aPlano[1] * n[1] + aPlano[2] * n[2]) /
      (d[0] * n[0] + d[1] * n[1] + d[2] * n[2]);
    const caida: Punto3 = [ojo[0] + d[0] * t, ojo[1] + d[1] * t, ojo[2] + d[2] * t];

    expect(anclajeMasCercano(casa, caida)).toBeNull();
    // Y no por poco: se queda a más de dos unidades del hueco al que apuntaba,
    // con una tolerancia de 0,4. Ésta es la medida que decidió que el dato del
    // navegador fuera el rayo y no el punto.
    const lejos = Math.hypot(
      caida[0] - casa.anclajes[1].punto[0],
      caida[1] - casa.anclajes[1].punto[1],
      caida[2] - casa.anclajes[1].punto[2],
    );
    expect(lejos).toBeGreaterThan(2);
  });

  it('la pieza en la mano se dibuja a la profundidad del hueco al que apunta', () => {
    const rayoAlHdmi = apuntarA([0, 1.5, 5], BANCO.anclajes[2].punto);
    const avance = avanceDeArrastre(BANCO, rayoAlHdmi);
    const donde = puntoSobreRayo(rayoAlHdmi, avance);
    expect(donde[0]).toBeCloseTo(0.8, 4);
    expect(donde[1]).toBeCloseTo(0.6, 4);
    expect(donde[2]).toBeCloseTo(-1, 4);

    // Apuntando dentro de la escena pero a ningún hueco, se queda a la
    // profundidad del centro del banco.
    const alVacio = avanceDeArrastre(BANCO, { origen: [0, 1.5, 5], hacia: [0, 0.9, -1] });
    expect(alVacio).toBeGreaterThan(3);
    expect(alVacio).toBeLessThan(9);
    // Y apuntando al revés —el alumno gira la cámara con la pieza tomada y el
    // banco le queda a la espalda— no se va al infinito ni se le mete en el
    // ojo: se queda a un palmo.
    expect(avanceDeArrastre(BANCO, { origen: [0, 1.5, 5], hacia: [0, 0, 1] })).toBe(0.2);
  });
});

describe('Banco Físico 3D · jugar mal a propósito', () => {
  it('encaja lo que entra y lo deja puesto', () => {
    const { estado, suelta } = soltar(BANCO, enLaMano('monitor'), { punto: [0.8, 0.6, -1] });
    expect(suelta.tipo).toBe('encaja');
    expect(dondeEsta(estado, 'monitor')).toBe('hdmi');
    expect(estado.tomada).toBeNull();
  });

  it('soltada en el vacío, la pieza vuelve exactamente a su origen', () => {
    const { estado, suelta } = soltar(BANCO, enLaMano('monitor'), { punto: [4, 4, 4] });
    expect(suelta).toEqual({ tipo: 'vacio', pieza: 'monitor' });
    expect(dondeEsta(estado, 'monitor')).toBeNull();
    expect(posicionDe(BANCO, estado, 'monitor', null)).toEqual([0, 0, 1.4]);
    // Y no se queda flotando donde la dejaron: aunque el puntero siga vivo, una
    // pieza que ya no está en la mano se dibuja en su sitio de descanso.
    expect(posicionDe(BANCO, estado, 'monitor', [4, 4, 4])).toEqual([0, 0, 1.4]);
  });

  it('un HDMI en un puerto USB rebota por la forma y no monta nada', () => {
    const { estado, suelta } = soltar(BANCO, enLaMano('monitor'), { punto: [-1.2, 0.6, -1] });
    expect(suelta).toEqual({ tipo: 'rebota', pieza: 'monitor', anclaje: 'usb1', motivo: 'forma' });
    expect(estado.ocupacion).toEqual({});
    expect(estado.tomada).toBeNull();
  });

  it('dos piezas en el mismo hueco: la segunda rebota por lleno y no desaloja a la primera', () => {
    const uno = soltar(BANCO, enLaMano('teclado'), { punto: [-1.2, 0.6, -1] }).estado;
    const dos = soltar(BANCO, enLaMano('raton', uno), { punto: [-1.2, 0.6, -1] });
    expect(dos.suelta).toEqual({ tipo: 'rebota', pieza: 'raton', anclaje: 'usb1', motivo: 'lleno' });
    expect(dos.estado.ocupacion.usb1).toEqual(['teclado']);
    expect(dondeEsta(dos.estado, 'raton')).toBeNull();
  });

  it('un hueco de capacidad 2 admite dos y rechaza la tercera', () => {
    const ranuras: BancoDef = {
      tolerancia: 0.4,
      piezas: [1, 2, 3].map((n) => ({
        id: `ram${n}`,
        tipo: 'ram',
        origen: [n, 0, 1] as Punto3,
        etiqueta: `RAM ${n}`,
      })),
      anclajes: [{ id: 'ranuras', punto: [0, 0, 0], acepta: ['ram'], capacidad: 2, etiqueta: 'Ranuras' }],
    };
    let e = soltar(ranuras, tomar(ranuras, ESTADO_VACIO, 'ram1'), { punto: [0, 0, 0] }).estado;
    e = soltar(ranuras, tomar(ranuras, e, 'ram2'), { punto: [0, 0, 0] }).estado;
    const tercera = soltar(ranuras, tomar(ranuras, e, 'ram3'), { punto: [0, 0, 0] });
    expect(e.ocupacion.ranuras).toEqual(['ram1', 'ram2']);
    expect(tercera.suelta).toMatchObject({ tipo: 'rebota', motivo: 'lleno' });
  });

  it('una herramienta se aplica, no ocupa sitio, y funciona sobre un hueco ya lleno', () => {
    const conAire = soltar(BANCO, enLaMano('aire'), { punto: [0.8, 1.9, -1] });
    expect(conAire.suelta).toMatchObject({ tipo: 'aplica', anclaje: 'ventilador' });
    expect(conAire.estado.ocupacion).toEqual({});
    expect(seAplico(conAire.estado, 'ventilador', 'aire')).toBe(true);
    expect(dondeEsta(conAire.estado, 'aire')).toBeNull();
    // Soplar dos veces no duplica el registro.
    const otraVez = soltar(BANCO, enLaMano('aire', conAire.estado), { punto: [0.8, 1.9, -1] });
    expect(otraVez.estado.aplicaciones.ventilador).toEqual(['aire']);
  });

  it('un gesto que no hace nada devuelve el mismo objeto de estado, no una copia', () => {
    // Con la mano vacía no hay nada que soltar.
    const suelta = resolverSuelta(BANCO, ESTADO_VACIO, { punto: [0.8, 0.6, -1] });
    expect(suelta).toEqual({ tipo: 'nada' });
    expect(aplicarSuelta(ESTADO_VACIO, suelta)).toBe(ESTADO_VACIO);
    expect(devolver(ESTADO_VACIO)).toBe(ESTADO_VACIO);
    expect(quitarPieza(ESTADO_VACIO, 'teclado')).toBe(ESTADO_VACIO);
  });

  it('coger una pieza ya montada la desmonta: es «reasienta la RAM»', () => {
    const puesto = soltar(BANCO, enLaMano('teclado'), { punto: [-1.2, 0.6, -1] }).estado;
    const enMano = tomar(BANCO, puesto, 'teclado');
    expect(enMano.tomada).toBe('teclado');
    expect(dondeEsta(enMano, 'teclado')).toBeNull();
    expect(enMano.ocupacion.usb1).toBeUndefined();
  });

  it('coger otra con una en la mano devuelve la primera a su origen', () => {
    const primera = enLaMano('teclado');
    const segunda = tomar(BANCO, primera, 'raton');
    expect(segunda.tomada).toBe('raton');
    expect(dondeEsta(segunda, 'teclado')).toBeNull();
    expect(posicionDe(BANCO, segunda, 'teclado', [9, 9, 9])).toEqual([-2, 0, 1.4]);
  });

  it('lo que no es tomable no se coge, y con el banco congelado no se coge nada', () => {
    expect(puedeTomar(BANCO, ESTADO_VACIO, 'rejilla')).toBe(false);
    expect(puedeTomar(BANCO, ESTADO_VACIO, 'inventada')).toBe(false);
    expect(puedeTomar(BANCO, ESTADO_VACIO, 'teclado')).toBe(true);
    expect(puedeTomar(BANCO, ESTADO_VACIO, 'teclado', false)).toBe(false);
    expect(tomar(BANCO, ESTADO_VACIO, 'rejilla')).toBe(ESTADO_VACIO);
  });

  it('con el montaje terminado se puede seguir tocando y nada se mueve', () => {
    const puesto = soltar(BANCO, enLaMano('monitor'), { punto: [0.8, 0.6, -1] }).estado;
    expect(tomar(BANCO, puesto, 'teclado', false)).toBe(puesto);
    const conMano = { ...puesto, tomada: 'teclado' };
    expect(resolverSuelta(BANCO, conMano, { punto: [-1.2, 0.6, -1] }, false)).toEqual({ tipo: 'nada' });
    expect(resolverSueltaEn(BANCO, conMano, 'usb1', false)).toEqual({ tipo: 'nada' });
    expect(puesto.ocupacion.hdmi).toEqual(['monitor']);
  });

  it('un recorrido entero jugando mal deja el banco coherente', () => {
    let e = ESTADO_VACIO;
    e = tomar(BANCO, e, 'teclado');
    e = soltar(BANCO, e, { punto: [9, 9, 9] }).estado; // al vacío
    e = tomar(BANCO, e, 'teclado');
    e = soltar(BANCO, e, { punto: [0.8, 0.6, -1] }).estado; // USB en el HDMI
    e = tomar(BANCO, e, 'teclado');
    e = tomar(BANCO, e, 'raton'); // cambia de pieza a media faena
    e = soltar(BANCO, e, { punto: [-1.2, 0.6, -1] }).estado; // ratón en usb1
    e = tomar(BANCO, e, 'teclado');
    e = soltar(BANCO, e, { punto: [-1.2, 0.6, -1] }).estado; // lleno
    e = soltar(BANCO, e, { punto: [-0.2, 0.6, -1] }).estado; // ya no lleva nada
    e = tomar(BANCO, e, 'teclado');
    e = soltar(BANCO, e, { punto: [-0.2, 0.6, -1] }).estado; // por fin, usb2
    e = quitarPieza(e, 'raton'); // se arrepiente
    e = tomar(BANCO, e, 'raton');
    e = devolver(e);

    expect(e.tomada).toBeNull();
    expect(dondeEsta(e, 'teclado')).toBe('usb2');
    expect(dondeEsta(e, 'raton')).toBeNull();
    expect(e.ocupacion.usb1).toBeUndefined();
    expect(Object.values(e.ocupacion).flat()).toEqual(['teclado']);
  });
});

describe('Banco Físico 3D · comprobar el estado', () => {
  const lleno = (): EstadoBanco => {
    let e = ESTADO_VACIO;
    e = soltar(BANCO, tomar(BANCO, e, 'teclado'), { punto: [-1.2, 0.6, -1] }).estado;
    e = soltar(BANCO, tomar(BANCO, e, 'raton'), { punto: [-0.2, 0.6, -1] }).estado;
    e = soltar(BANCO, tomar(BANCO, e, 'monitor'), { punto: [0.8, 0.6, -1] }).estado;
    e = soltar(BANCO, tomar(BANCO, e, 'bocinas'), { punto: [1.8, 0.6, -1] }).estado;
    return e;
  };

  it('«¿está todo conectado?» no cuenta ni herramientas ni piezas fijas', () => {
    const e = lleno();
    expect(montajeCompleto(BANCO, e)).toBe(true);
    expect(dondeEsta(e, 'aire')).toBeNull();
    expect(dondeEsta(e, 'rejilla')).toBeNull();
    // Todo puesto pero con la lata de aire todavía en la mano: el trabajo no
    // está terminado. Es el caso que sólo aparece con una herramienta, porque
    // cualquier otra pieza en la mano ya falta de su hueco.
    const conLaLata = tomar(BANCO, e, 'aire');
    expect(conLaLata.tomada).toBe('aire');
    expect(montajeCompleto(BANCO, conLaLata)).toBe(false);
    // Y soltarla donde sea deja el montaje cerrado otra vez.
    expect(montajeCompleto(BANCO, devolver(conLaLata))).toBe(true);
  });

  it('«¿va en el sitio correcto?» lo decide la tabla que trae la clase, no el aparato', () => {
    let e = ESTADO_VACIO;
    e = soltar(BANCO, tomar(BANCO, e, 'teclado'), { punto: [-0.2, 0.6, -1] }).estado; // usb2
    e = soltar(BANCO, tomar(BANCO, e, 'monitor'), { punto: [0.8, 0.6, -1] }).estado; // hdmi

    const clase = evaluar(BANCO, e, { teclado: 'usb1', monitor: 'hdmi', bocinas: 'audio' });
    expect(clase.correctas).toEqual(['monitor']);
    expect(clase.equivocadas).toEqual([{ pieza: 'teclado', esta: 'usb2', deberia: 'usb1' }]);
    expect(clase.faltantes).toEqual(['bocinas']);

    // El mismo estado, con otra tabla, es un acierto: la verdad viaja como
    // parámetro y el armazón no opina.
    const otraClase = evaluar(BANCO, e, { teclado: 'usb2', monitor: 'hdmi' });
    expect(otraClase.equivocadas).toEqual([]);
    expect(otraClase.faltantes).toEqual([]);
  });

  it('nombrar el hueco da el mismo desenlace que apuntarlo: es la puerta del teclado', () => {
    const estado = enLaMano('monitor');
    const apuntando = resolverSuelta(BANCO, estado, { punto: [0.8, 0.6, -1] });
    const nombrando = resolverSueltaEn(BANCO, estado, 'hdmi');
    expect(nombrando).toMatchObject({ tipo: 'encaja', pieza: 'monitor', anclaje: 'hdmi' });
    expect(nombrando.tipo).toBe(apuntando.tipo);
    expect(resolverSueltaEn(BANCO, estado, 'usb1')).toMatchObject({ tipo: 'rebota', motivo: 'forma' });
    expect(resolverSueltaEn(BANCO, estado, 'no-existe')).toEqual({ tipo: 'nada' });
  });

  it('caza los defectos de autor, incluidas las tolerancias solapadas', () => {
    expect(validarBanco(BANCO)).toEqual([]);
    const roto: BancoDef = {
      tolerancia: 0.4,
      piezas: [
        { id: 'a', tipo: 'usb', origen: [0, 0, 0], etiqueta: 'A' },
        { id: 'a', tipo: 'usb', origen: [0, 0, 0], etiqueta: 'A otra vez' },
        { id: 'b', tipo: 'raro', origen: [0, 0, 0], etiqueta: 'B' },
      ],
      anclajes: [
        { id: 'x', punto: [0, 0, 0], acepta: ['usb'], etiqueta: 'X' },
        { id: 'y', punto: [0.5, 0, 0], acepta: [], etiqueta: 'Y' },
        { id: 'y', punto: [9, 9, 9], acepta: ['usb'], capacidad: 0, etiqueta: 'Y otra vez' },
      ],
    };
    const fallos = validarBanco(roto);
    expect(fallos).toContain('pieza duplicada: a');
    expect(fallos).toContain('anclaje duplicado: y');
    expect(fallos).toContain('anclaje sin formas admitidas: y');
    expect(fallos).toContain('anclaje con capacidad menor que 1: y');
    expect(fallos).toContain('pieza que no entra en ningún anclaje: b');
    // 0.5 de separación con 0.4 + 0.4 de tolerancias: el alumno no puede
    // elegir cuál de los dos, y eso no es dificultad, es lotería.
    expect(fallos).toContain('anclajes con tolerancias solapadas: x y y');
  });
});

describe('Banco Físico 3D · la cámara', () => {
  it('girar sin parar nunca deja al alumno mirando el vacío bajo el suelo', () => {
    // Generador determinista: una prueba que falla un día sí y otro no no se la
    // cree nadie.
    let semilla = 20260815;
    const azar = () => {
      semilla = (semilla * 1103515245 + 12345) % 2147483648;
      return semilla / 2147483648;
    };
    let o = { polar: Math.PI * 0.3, azimut: 0, dist: 5 };
    for (let i = 0; i < 1000; i++) {
      o = limitarOrbita(
        {
          polar: o.polar + (azar() - 0.5) * 3,
          azimut: o.azimut + (azar() - 0.5) * 6,
          dist: o.dist + (azar() - 0.5) * 8,
        },
        LIMITES_BANCO,
      );
      expect(o.polar).toBeGreaterThanOrEqual(LIMITES_BANCO.polarMin);
      // Por debajo de π/2 SIEMPRE: π/2 es el plano horizontal del objetivo y
      // pasarlo mete la cámara bajo la mesa, viendo el reverso de las caras.
      expect(o.polar).toBeLessThan(Math.PI / 2);
      expect(o.dist).toBeGreaterThanOrEqual(LIMITES_BANCO.distMin);
      expect(o.dist).toBeLessThanOrEqual(LIMITES_BANCO.distMax);
      expect(Math.abs(o.azimut)).toBeLessThanOrEqual(Math.PI);
    }
  });

  it('el azimut da la vuelta entera, que es como se llega a los puertos de detrás', () => {
    // Media vuelta desde el frente: hay que poder plantarse detrás del equipo.
    expect(limitarOrbita({ polar: 1, azimut: Math.PI * 0.99, dist: 5 }).azimut).toBeCloseTo(Math.PI * 0.99, 6);
    // Y al pasarse, envuelve en vez de chocar contra un tope.
    expect(normalizarAngulo(Math.PI * 2.5)).toBeCloseTo(Math.PI * 0.5, 6);
    expect(normalizarAngulo(-Math.PI * 3)).toBeCloseTo(Math.PI, 6);
    expect(normalizarAngulo(0)).toBe(0);
    // Con arco acotado sí hay tope, para las clases que lo quieran.
    const arco = { ...LIMITES_BANCO, azimutMin: -0.5, azimutMax: 0.5 };
    expect(limitarOrbita({ polar: 1, azimut: 3, dist: 5 }, arco).azimut).toBeCloseTo(0.5, 6);
  });

  it('la cámara se para mientras hay una pieza en la mano, y el enfoque llega sin pasarse', () => {
    expect(orbitaHabilitada(null)).toBe(true);
    expect(orbitaHabilitada('teclado')).toBe(false);

    let donde: Punto3 = [0, 0, 0];
    const meta: Punto3 = [1.4, 0.9, -2.2];
    for (let i = 0; i < 1000; i++) donde = pasoDeEnfoque(donde, meta, 0.12);
    expect(donde[0]).toBeCloseTo(meta[0], 6);
    expect(donde[1]).toBeCloseTo(meta[1], 6);
    expect(donde[2]).toBeCloseTo(meta[2], 6);
    // Un factor fuera de rango no dispara la cámara al otro lado del mundo.
    expect(pasoDeEnfoque([0, 0, 0], [10, 0, 0], 4)).toEqual([10, 0, 0]);
    expect(pasoDeEnfoque([0, 0, 0], [10, 0, 0], -1)).toEqual([0, 0, 0]);
  });
});

describe('Banco Físico 3D · el letrero y la cara sin WebGL', () => {
  it('el texto de una placa se reparte en renglones sin partir palabras', () => {
    expect(partirEnLineas('El sensor de la puerta avisa si alguien entra', 16)).toEqual([
      'El sensor de la',
      'puerta avisa si',
      'alguien entra',
    ]);
    expect(partirEnLineas('   ', 10)).toEqual([]);
    // Una palabra más larga que el renglón se queda sola antes que partirse.
    expect(partirEnLineas('Radiofrecuencia ya', 8)).toEqual(['Radiofrecuencia', 'ya']);

    // Y el listón de verdad: ningún renglón se pasa del ancho, para ningún
    // ancho. Un renglón que se pasa se sale de la placa y el letrero queda
    // cortado a la mitad, que es un defecto que sólo se ve en el navegador.
    const largo =
      'Este actuador mueve el brazo del robot cuando el sensor de proximidad detecta un obstaculo cerca';
    for (const ancho of [10, 14, 20, 26, 33]) {
      const lineas = partirEnLineas(largo, ancho);
      expect(lineas.join(' ')).toBe(largo);
      for (const l of lineas) expect(l.length).toBeLessThanOrEqual(ancho);
    }
  });

  it('sin WebGL monta el respaldo, no monta lienzo y no ejecuta el dibujo de las piezas', () => {
    const dibujar = jest.fn(() => null);
    const { container } = render(
      <BancoFisico3D
        modelo={null}
        def={BANCO}
        estado={ESTADO_VACIO}
        dibujarPieza={dibujar}
        reduceMotion
        onTomar={jest.fn()}
        onSoltar={jest.fn()}
        onDevolver={jest.fn()}
        respaldo={
          <button type="button" aria-label="Conectar el teclado en el puerto USB 1">
            Teclado → USB 1
          </button>
        }
      />,
    );
    // jsdom no tiene WebGL: es la única cara que la suite llega a tocar, y por
    // eso el canon la declara obligatoria.
    expect(screen.getByRole('button', { name: /Conectar el teclado/ })).toBeInTheDocument();
    expect(container.querySelector('canvas')).toBeNull();
    expect(dibujar).not.toHaveBeenCalled();
    // Y los atajos de teclado tampoco existen sin WebGL: ahí manda el respaldo.
    expect(container.querySelector('.lab3d-atajos')).toBeNull();
  });
});
