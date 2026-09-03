/**
 * ══════════════════════════════════════════════════════════════════════════
 * TECNIA APRENDIZAJE · el banco de pruebas del clasificador de juguete
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Las cuatro cosas que este archivo tiene que demostrar, y cómo se miden:
 *
 *   1. **Que aprende de verdad** — ocho conjuntos con lo que el modelo DEBE
 *      decidir, comprobado caso por caso (`it.each`, 8 pruebas).
 *   2. **Que falla donde debe** — cuatro sesgos montados a propósito, con el
 *      **fallo concreto** comprobado (qué ejemplo, qué contestó y con cuánta
 *      seguridad), no sólo «la tasa baja».
 *   3. **Que la explicación es cierta** — 106 predicciones sobre los ocho
 *      conjuntos, sondas imposibles incluidas: los ejemplos que el motor dice
 *      que la sostienen se vuelven a buscar en el banco **sin mirar el árbol**
 *      (`ejemplosQueCasan`) y tienen que ser exactamente los mismos, con las
 *      mismas cuentas, la misma mayoría y la misma seguridad.
 *   4. **Que aguanta** — 5 000 ejemplos por debajo de 50 ms, midiendo el
 *      **mínimo** de varias tandas: la media mide también lo ocupada que estaba
 *      la máquina, y jest lanza un obrero por archivo.
 *
 * Y los datos malos van aparte, en su propia tabla: cero ejemplos, uno solo,
 * todos con la misma etiqueta, dos idénticos que se contradicen, un rasgo que
 * nunca cambia, uno que lo decide todo, un rasgo que no existe y el XOR.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

import {
  entrenar,
  informeDe,
  predecir,
  type Modelo,
  type OpcionesEntreno,
} from '@/components/simuladores/aprendizaje/arbol';
import {
  brechaDe,
  evaluar,
  repartir,
  torcer,
  type Examen,
} from '@/components/simuladores/aprendizaje/examen';
import {
  SIN_DATO,
  ejemplosQueCasan,
  examinar,
  revisar,
  type Ejemplo,
  type Esquema,
} from '@/components/simuladores/aprendizaje/modelo';
import {
  senalDePrediccion,
  senalesDe,
} from '@/components/simuladores/aprendizaje/senales';
import { resolverGuion, type GuionAsistente } from '@/components/simuladores/asistente/guionAsistente';

type Fila = Record<string, string>;

const ej = (id: string, rasgos: Fila, etiqueta: string): Ejemplo => ({ id, rasgos, etiqueta });

interface Conjunto {
  nombre: string;
  esquema: Esquema;
  entrenamiento: Ejemplo[];
  opciones?: OpcionesEntreno;
  /** Lo que el modelo DEBE decidir. */
  casos: { rasgos: Fila; etiqueta: string }[];
  extra?: (modelo: Modelo) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1 · Ocho conjuntos que tiene que aprender
// ═══════════════════════════════════════════════════════════════════════════

const GATOS: Conjunto = {
  nombre: 'las orejas mandan y el color no se pregunta',
  esquema: {
    rasgos: [
      { id: 'color', valores: ['naranja', 'blanco', 'negro'] },
      { id: 'orejas', valores: ['puntiagudas', 'caidas'] },
    ],
    etiquetas: ['gato', 'perro'],
  },
  entrenamiento: [
    ej('g1', { color: 'naranja', orejas: 'puntiagudas' }, 'gato'),
    ej('g2', { color: 'blanco', orejas: 'puntiagudas' }, 'gato'),
    ej('g3', { color: 'naranja', orejas: 'puntiagudas' }, 'gato'),
    ej('p1', { color: 'naranja', orejas: 'caidas' }, 'perro'),
    ej('p2', { color: 'blanco', orejas: 'caidas' }, 'perro'),
    ej('p3', { color: 'blanco', orejas: 'caidas' }, 'perro'),
  ],
  casos: [
    // Nunca vio un gato negro y aun así acierta: el color no llegó a preguntarse.
    { rasgos: { color: 'negro', orejas: 'puntiagudas' }, etiqueta: 'gato' },
    { rasgos: { color: 'negro', orejas: 'caidas' }, etiqueta: 'perro' },
  ],
  extra: (m) => {
    const i = informeDe(m);
    expect(i.rasgosUsados).toEqual(['orejas']);
    expect(i.rasgosIgnorados).toEqual(['color']);
    expect(i.profundidad).toBe(1);
    // Eligió `orejas` teniendo `color` declarado ANTES: manda la ganancia.
    expect(m.raiz?.tipo).toBe('pregunta');
  },
};

const FRUTA: Conjunto = {
  nombre: 'hacen falta los dos rasgos, ninguno solo basta',
  esquema: {
    rasgos: [
      { id: 'color', valores: ['rojo', 'amarillo'] },
      { id: 'forma', valores: ['redonda', 'alargada'] },
    ],
    etiquetas: ['manzana', 'chile', 'limon', 'platano'],
  },
  entrenamiento: [
    ej('f1', { color: 'rojo', forma: 'redonda' }, 'manzana'),
    ej('f2', { color: 'rojo', forma: 'redonda' }, 'manzana'),
    ej('f3', { color: 'rojo', forma: 'alargada' }, 'chile'),
    ej('f4', { color: 'rojo', forma: 'alargada' }, 'chile'),
    ej('f5', { color: 'amarillo', forma: 'redonda' }, 'limon'),
    ej('f6', { color: 'amarillo', forma: 'redonda' }, 'limon'),
    ej('f7', { color: 'amarillo', forma: 'alargada' }, 'platano'),
    ej('f8', { color: 'amarillo', forma: 'alargada' }, 'platano'),
  ],
  casos: [
    { rasgos: { color: 'rojo', forma: 'redonda' }, etiqueta: 'manzana' },
    { rasgos: { color: 'rojo', forma: 'alargada' }, etiqueta: 'chile' },
    { rasgos: { color: 'amarillo', forma: 'redonda' }, etiqueta: 'limon' },
    { rasgos: { color: 'amarillo', forma: 'alargada' }, etiqueta: 'platano' },
  ],
  extra: (m) => {
    const i = informeDe(m);
    expect(i.profundidad).toBe(2);
    expect(i.rasgosUsados.sort()).toEqual(['color', 'forma']);
    expect(i.hojas).toBe(4);
  },
};

const RECICLAJE: Conjunto = {
  nombre: 'tres etiquetas y un rasgo que no sirve para nada',
  esquema: {
    rasgos: [
      { id: 'material', valores: ['papel', 'plastico', 'vidrio'] },
      { id: 'tamano', valores: ['chico', 'grande'] },
    ],
    etiquetas: ['azul', 'amarillo', 'verde'],
  },
  entrenamiento: [
    ej('r1', { material: 'papel', tamano: 'chico' }, 'azul'),
    ej('r2', { material: 'papel', tamano: 'grande' }, 'azul'),
    ej('r3', { material: 'plastico', tamano: 'chico' }, 'amarillo'),
    ej('r4', { material: 'plastico', tamano: 'grande' }, 'amarillo'),
    ej('r5', { material: 'vidrio', tamano: 'chico' }, 'verde'),
    ej('r6', { material: 'vidrio', tamano: 'grande' }, 'verde'),
  ],
  casos: [
    { rasgos: { material: 'vidrio', tamano: 'chico' }, etiqueta: 'verde' },
    { rasgos: { material: 'papel', tamano: 'grande' }, etiqueta: 'azul' },
  ],
  extra: (m) => {
    const i = informeDe(m);
    expect(i.rasgosIgnorados).toEqual(['tamano']);
    expect(i.hojas).toBe(3);
    expect(i.reglas.every((r) => r.pureza === 1)).toBe(true);
  },
};

const CORREO: Conjunto = {
  nombre: 'dos preguntas encadenadas y una tercera que sobra',
  esquema: {
    rasgos: [
      { id: 'remitente', valores: ['conocido', 'desconocido'] },
      { id: 'enlaces', valores: ['si', 'no'] },
      { id: 'urgencia', valores: ['si', 'no'] },
    ],
    etiquetas: ['limpio', 'spam'],
  },
  entrenamiento: [
    ej('c1', { remitente: 'conocido', enlaces: 'no', urgencia: 'no' }, 'limpio'),
    ej('c2', { remitente: 'conocido', enlaces: 'no', urgencia: 'si' }, 'limpio'),
    ej('c3', { remitente: 'conocido', enlaces: 'si', urgencia: 'no' }, 'limpio'),
    ej('c5', { remitente: 'desconocido', enlaces: 'no', urgencia: 'no' }, 'limpio'),
    ej('c6', { remitente: 'desconocido', enlaces: 'no', urgencia: 'si' }, 'limpio'),
    ej('c8', { remitente: 'desconocido', enlaces: 'si', urgencia: 'si' }, 'spam'),
  ],
  casos: [
    // Las dos combinaciones que se dejaron FUERA del entrenamiento.
    { rasgos: { remitente: 'conocido', enlaces: 'si', urgencia: 'si' }, etiqueta: 'limpio' },
    { rasgos: { remitente: 'desconocido', enlaces: 'si', urgencia: 'no' }, etiqueta: 'spam' },
  ],
  extra: (m) => {
    const i = informeDe(m);
    // `enlaces` gana la raíz por ganancia aunque `remitente` esté declarado antes;
    // abajo, `remitente` y `urgencia` empatan y desempata el orden del esquema.
    expect(i.rasgosUsados).toEqual(['enlaces', 'remitente']);
    expect(i.rasgosIgnorados).toEqual(['urgencia']);
  },
};

const XOR: Conjunto = {
  nombre: 'el XOR, que sólo se aprende si se le obliga a seguir preguntando',
  esquema: {
    rasgos: [
      { id: 'a', valores: ['si', 'no'] },
      { id: 'b', valores: ['si', 'no'] },
    ],
    etiquetas: ['normal', 'raro'],
  },
  opciones: { insistir: true },
  entrenamiento: [
    ej('x1', { a: 'si', b: 'si' }, 'normal'),
    ej('x2', { a: 'si', b: 'si' }, 'normal'),
    ej('x3', { a: 'no', b: 'no' }, 'normal'),
    ej('x4', { a: 'no', b: 'no' }, 'normal'),
    ej('x5', { a: 'si', b: 'no' }, 'raro'),
    ej('x6', { a: 'si', b: 'no' }, 'raro'),
    ej('x7', { a: 'no', b: 'si' }, 'raro'),
    ej('x8', { a: 'no', b: 'si' }, 'raro'),
  ],
  casos: [
    { rasgos: { a: 'si', b: 'si' }, etiqueta: 'normal' },
    { rasgos: { a: 'si', b: 'no' }, etiqueta: 'raro' },
    { rasgos: { a: 'no', b: 'si' }, etiqueta: 'raro' },
    { rasgos: { a: 'no', b: 'no' }, etiqueta: 'normal' },
  ],
  extra: (m) => {
    expect(informeDe(m).profundidad).toBe(2);
    /*
     * Y sin `insistir`, el mismo banco se rinde en la raíz: mirando un rasgo
     * cada vez, ninguno de los dos separa nada. Es el límite del método,
     * medido y con nombre, no tapado.
     */
    const rendido = entrenar(m.esquema, m.ejemplos);
    expect(rendido.raiz?.tipo).toBe('hoja');
    if (rendido.raiz?.tipo === 'hoja') {
      expect(rendido.raiz.motivo).toBe('ninguna-pregunta-separa');
      expect(rendido.raiz.empate).toBe(true);
    }
    expect(evaluar(rendido, m.ejemplos).acierto).toBe(0.5); // lo que se saca a ciegas
  },
};

const DIGITOS: Conjunto = {
  nombre: 'diez ramas de memoria, y un rasgo nuevo que no le estorba',
  esquema: {
    rasgos: [
      { id: 'digito', valores: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] },
      { id: 'color', valores: ['rojo', 'azul', 'verde'] },
    ],
    etiquetas: ['par', 'impar'],
  },
  entrenamiento: Array.from({ length: 10 }, (_, n) =>
    ej(`d${n}`, { digito: String(n), color: 'rojo' }, n % 2 === 0 ? 'par' : 'impar'),
  ),
  casos: [
    // `color` nunca se pregunta, así que un color nuevo no le atasca.
    { rasgos: { digito: '4', color: 'azul' }, etiqueta: 'par' },
    { rasgos: { digito: '7', color: 'verde' }, etiqueta: 'impar' },
  ],
  extra: (m) => {
    const i = informeDe(m);
    expect(i.hojas).toBe(10);
    // Acierta siempre y no ha aprendido nada: cada regla se apoya en UN ejemplo.
    expect(i.memorizadas).toHaveLength(10);
  },
};

const CLIMA: Conjunto = {
  nombre: 'un ejemplo mal etiquetado no tumba la respuesta, pero sí la seguridad',
  esquema: {
    rasgos: [
      { id: 'nubes', valores: ['muchas', 'pocas'] },
      { id: 'viento', valores: ['si', 'no'] },
    ],
    etiquetas: ['llueve', 'seco'],
  },
  entrenamiento: [
    ej('w1', { nubes: 'muchas', viento: 'si' }, 'llueve'),
    ej('w2', { nubes: 'muchas', viento: 'si' }, 'llueve'),
    ej('w3', { nubes: 'muchas', viento: 'si' }, 'llueve'),
    ej('w4', { nubes: 'muchas', viento: 'no' }, 'llueve'),
    ej('w5', { nubes: 'muchas', viento: 'no' }, 'llueve'),
    ej('w6', { nubes: 'muchas', viento: 'no' }, 'seco'),
    ej('w7', { nubes: 'pocas', viento: 'si' }, 'seco'),
    ej('w8', { nubes: 'pocas', viento: 'no' }, 'seco'),
    ej('w9', { nubes: 'pocas', viento: 'no' }, 'seco'),
  ],
  casos: [
    { rasgos: { nubes: 'muchas', viento: 'no' }, etiqueta: 'llueve' },
    { rasgos: { nubes: 'muchas', viento: 'si' }, etiqueta: 'llueve' },
    { rasgos: { nubes: 'pocas', viento: 'no' }, etiqueta: 'seco' },
  ],
  extra: (m) => {
    expect(predecir(m, { nubes: 'muchas', viento: 'no' }).confianza).toBeCloseTo(2 / 3, 12);
    expect(predecir(m, { nubes: 'muchas', viento: 'si' }).confianza).toBe(1);
    expect(examinar(m.esquema, m.ejemplos).contradicciones).toHaveLength(1);
  },
};

const ANIMALES: Conjunto = {
  nombre: 'tres etiquetas, dos preguntas y las ramas en el orden declarado',
  esquema: {
    rasgos: [
      { id: 'pico', valores: ['si', 'no'] },
      // Declarado 4 ANTES que 2: si las ramas salieran ordenadas solas, JavaScript
      // pondría el 2 primero por parecer un número. El orden lo manda el esquema.
      { id: 'patas', valores: ['4', '2'] },
    ],
    etiquetas: ['ave', 'perro', 'humano'],
  },
  entrenamiento: [
    ej('a1', { pico: 'si', patas: '2' }, 'ave'),
    ej('a2', { pico: 'si', patas: '2' }, 'ave'),
    ej('a3', { pico: 'no', patas: '4' }, 'perro'),
    ej('a4', { pico: 'no', patas: '4' }, 'perro'),
    ej('a5', { pico: 'no', patas: '2' }, 'humano'),
    ej('a6', { pico: 'no', patas: '2' }, 'humano'),
  ],
  casos: [
    { rasgos: { pico: 'no', patas: '4' }, etiqueta: 'perro' },
    { rasgos: { pico: 'si', patas: '2' }, etiqueta: 'ave' },
    { rasgos: { pico: 'no', patas: '2' }, etiqueta: 'humano' },
  ],
  extra: (m) => {
    const raiz = m.raiz;
    expect(raiz?.tipo).toBe('pregunta');
    if (raiz?.tipo !== 'pregunta') return;
    // `pico` y `patas` empatan en ganancia; gana el declarado antes.
    expect(raiz.rasgo).toBe('pico');
    const rama = raiz.ramas.find((r) => r.valor === 'no')?.nodo;
    expect(rama?.tipo).toBe('pregunta');
    if (rama?.tipo !== 'pregunta') return;
    expect(rama.ramas.map((r) => r.valor)).toEqual(['4', '2']);
  },
};

const APRENDE: Conjunto[] = [GATOS, FRUTA, RECICLAJE, CORREO, XOR, DIGITOS, CLIMA, ANIMALES];

describe('1 · aprende de verdad', () => {
  it.each(APRENDE)('$nombre', (conjunto: Conjunto) => {
    const modelo = entrenar(conjunto.esquema, conjunto.entrenamiento, conjunto.opciones);
    for (const caso of conjunto.casos) {
      const p = predecir(modelo, caso.rasgos);
      expect({ ...caso.rasgos, dijo: p.etiqueta }).toEqual({ ...caso.rasgos, dijo: caso.etiqueta });
      expect(p.apoyo.length).toBeGreaterThan(0);
    }
    conjunto.extra?.(modelo);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2 · Cuatro sesgos montados a propósito
// ═══════════════════════════════════════════════════════════════════════════

const ESQUEMA_MASCOTA: Esquema = {
  rasgos: [
    { id: 'color', valores: ['naranja', 'blanco', 'negro', 'marron'] },
    { id: 'orejas', valores: ['puntiagudas', 'caidas'] },
  ],
  etiquetas: ['gato', 'perro'],
};

describe('2 · falla donde debe, y por el motivo que se puede explicar', () => {
  it('el grupo que falta ENTERO: se atasca, y el informe lo había dicho antes de probar', () => {
    const banco = [
      ej('g1', { color: 'naranja', orejas: 'puntiagudas' }, 'gato'),
      ej('g2', { color: 'naranja', orejas: 'caidas' }, 'gato'),
      ej('g3', { color: 'naranja', orejas: 'puntiagudas' }, 'gato'),
      ej('p1', { color: 'blanco', orejas: 'caidas' }, 'perro'),
      ej('p2', { color: 'blanco', orejas: 'puntiagudas' }, 'perro'),
      ej('p3', { color: 'blanco', orejas: 'caidas' }, 'perro'),
      ej('p4', { color: 'blanco', orejas: 'caidas' }, 'perro'),
    ];

    // Antes de entrenar, el banco ya lo canta.
    const auditoria = examinar(ESQUEMA_MASCOTA, banco);
    expect(auditoria.valoresNoVistos).toContainEqual({ rasgo: 'color', valor: 'negro' });

    const modelo = entrenar(ESQUEMA_MASCOTA, banco);
    const ciego = informeDe(modelo).ciegos.find((c) => c.valor === 'negro');
    expect(ciego).toBeDefined();
    expect(ciego?.rasgo).toBe('color');
    expect(ciego?.contestaria).toBe('perro'); // la mayoría de la raíz: 4 perros, 3 gatos

    // Y al probarlo pasa exactamente eso, con las orejas que sea: es sistemático.
    for (const orejas of ['puntiagudas', 'caidas']) {
      const p = predecir(modelo, { color: 'negro', orejas });
      expect(p.motivo).toBe('valor-no-visto');
      expect(p.etiqueta).toBe(ciego?.contestaria);
      expect(p.atascoEn).toEqual({
        rasgo: 'color',
        valor: 'negro',
        valoresVistos: ['naranja', 'blanco'],
      });
    }
  });

  it('el grupo que sólo vio con la otra etiqueta: falla con la seguridad al máximo', () => {
    const banco = [
      ej('g1', { color: 'naranja', orejas: 'puntiagudas' }, 'gato'),
      ej('g2', { color: 'naranja', orejas: 'caidas' }, 'gato'),
      ej('g3', { color: 'naranja', orejas: 'puntiagudas' }, 'gato'),
      ej('g4', { color: 'blanco', orejas: 'puntiagudas' }, 'gato'),
      ej('g5', { color: 'blanco', orejas: 'caidas' }, 'gato'),
      ej('p1', { color: 'negro', orejas: 'caidas' }, 'perro'),
      ej('p2', { color: 'negro', orejas: 'puntiagudas' }, 'perro'),
      ej('p3', { color: 'negro', orejas: 'caidas' }, 'perro'),
    ];

    // El hueco está a la vista antes de entrenar: hay negros y hay gatos, y
    // ningún gato negro.
    expect(examinar(ESQUEMA_MASCOTA, banco).huecos).toContainEqual({
      rasgo: 'color',
      valor: 'negro',
      etiqueta: 'gato',
    });

    const modelo = entrenar(ESQUEMA_MASCOTA, banco);
    const prueba = [
      ej('t1', { color: 'naranja', orejas: 'puntiagudas' }, 'gato'),
      ej('t2', { color: 'naranja', orejas: 'caidas' }, 'gato'),
      ej('t3', { color: 'blanco', orejas: 'caidas' }, 'gato'),
      ej('t4', { color: 'negro', orejas: 'puntiagudas' }, 'gato'),
      ej('t5', { color: 'negro', orejas: 'caidas' }, 'gato'),
      ej('t6', { color: 'negro', orejas: 'puntiagudas' }, 'gato'),
      ej('t7', { color: 'negro', orejas: 'caidas' }, 'perro'),
    ];
    const examen = evaluar(modelo, prueba);

    // El fallo CONCRETO: los tres gatos negros, y con confianza 1.
    expect(examen.fallos.map((f) => f.ejemplo)).toEqual(['t4', 't5', 't6']);
    for (const f of examen.fallos) {
      expect(f.dijo).toBe('perro');
      expect(f.motivo).toBe('hoja'); // no se atascó: contestó convencidísimo
    }
    for (const p of [examen.predicciones[3], examen.predicciones[4], examen.predicciones[5]]) {
      expect(p.confianza).toBe(1);
    }

    // Y medido por grupos: el total tapa lo que la brecha enseña.
    expect(examen.acierto).toBeCloseTo(4 / 7, 12);
    const brecha = brechaDe(examen, 'color');
    expect(brecha.peor?.valor).toBe('negro');
    expect(brecha.peor?.acierto).toBeCloseTo(1 / 4, 12);
    expect(brecha.mejor?.acierto).toBe(1);
    expect(brecha.diferencia).toBeCloseTo(3 / 4, 12);
  });

  it('el grupo poco representado: uno solo no basta, y la mayoría se lo come', () => {
    const equilibrado = [
      ...Array.from({ length: 5 }, (_, i) => ej(`gn${i}`, { color: 'negro', orejas: 'puntiagudas' }, 'gato')),
      ...Array.from({ length: 5 }, (_, i) => ej(`gr${i}`, { color: 'naranja', orejas: 'puntiagudas' }, 'gato')),
      ...Array.from({ length: 5 }, (_, i) => ej(`pn${i}`, { color: 'negro', orejas: 'caidas' }, 'perro')),
      ...Array.from({ length: 5 }, (_, i) => ej(`pm${i}`, { color: 'marron', orejas: 'caidas' }, 'perro')),
    ];
    // Torcido a propósito: de los cinco gatos negros se queda UNO.
    const torcido = torcer(equilibrado, [
      { donde: [{ rasgo: 'color', valor: 'negro' }], etiqueta: 'gato', dejar: 1 },
    ]);
    expect(torcido.filter((e) => e.rasgos.color === 'negro' && e.etiqueta === 'gato')).toHaveLength(1);

    // Aquí NO hay hueco: el gato negro existe. Y aun así va a fallar.
    const auditoria = examinar(ESQUEMA_MASCOTA, torcido);
    expect(auditoria.huecos).not.toContainEqual({ rasgo: 'color', valor: 'negro', etiqueta: 'gato' });
    expect(auditoria.cruce.color.negro.gato).toBe(1);
    expect(auditoria.cruce.color.negro.perro).toBe(5);

    // Se le quitan las orejas para que el árbol tenga que decidir por el color.
    const modelo = entrenar(ESQUEMA_MASCOTA, torcido, { rasgos: ['color'] });
    const p = predecir(modelo, { color: 'negro', orejas: 'puntiagudas' });
    expect(p.etiqueta).toBe('perro');
    expect(p.conteo).toEqual({ gato: 1, perro: 5 });
    expect(p.confianza).toBeCloseTo(5 / 6, 12);
    expect(p.apoyo).toHaveLength(6);

    const examen = evaluar(
      modelo,
      Array.from({ length: 4 }, (_, i) => ej(`t${i}`, { color: 'negro', orejas: 'puntiagudas' }, 'gato')),
    );
    expect(examen.aciertos).toBe(0);
    expect(examen.fallos).toHaveLength(4);
    expect(examen.fallos.every((f) => f.dijo === 'perro' && f.motivo === 'hoja')).toBe(true);
  });

  it('la etiqueta torcida: un grupo entero marcado mal, y el modelo lo repite', () => {
    const esquema: Esquema = {
      rasgos: [
        { id: 'grupo', valores: ['a', 'b'] },
        { id: 'estudio', valores: ['mucho', 'poco'] },
      ],
      etiquetas: ['pasa', 'no-pasa'],
    };
    // La verdad: pasa quien estudió mucho, sea del grupo que sea.
    const justo: Ejemplo[] = [];
    for (const grupo of ['a', 'b']) {
      for (const estudio of ['mucho', 'poco']) {
        for (let i = 0; i < 3; i += 1) {
          justo.push(
            ej(`${grupo}-${estudio}-${i}`, { grupo, estudio }, estudio === 'mucho' ? 'pasa' : 'no-pasa'),
          );
        }
      }
    }
    // El banco torcido: a todo el grupo B lo marcaron «no-pasa».
    const torcido = torcer(justo, [{ donde: [{ rasgo: 'grupo', valor: 'b' }], reetiquetar: 'no-pasa' }]);
    expect(torcido.filter((e) => e.rasgos.grupo === 'b' && e.etiqueta === 'pasa')).toHaveLength(0);
    expect(torcido).toHaveLength(justo.length); // reetiquetar no tira ejemplos

    const modelo = entrenar(esquema, torcido);
    // El fallo concreto: alguien del grupo B que estudió mucho.
    const p = predecir(modelo, { grupo: 'b', estudio: 'mucho' });
    expect(p.etiqueta).toBe('no-pasa');
    expect(p.confianza).toBe(1); // convencido, y equivocado
    expect(p.condiciones).toEqual([{ rasgo: 'grupo', valor: 'b' }]);
    expect(p.apoyo).toHaveLength(6);

    // Contra la realidad (las etiquetas justas), el sesgo sale por grupos.
    const examen = evaluar(modelo, justo);
    const brecha = brechaDe(examen, 'grupo');
    expect(brecha.mejor?.valor).toBe('a');
    expect(brecha.mejor?.acierto).toBe(1);
    expect(brecha.peor?.valor).toBe('b');
    expect(brecha.peor?.acierto).toBeCloseTo(0.5, 12);
    expect(examen.fallos.map((f) => f.ejemplo)).toEqual(['b-mucho-0', 'b-mucho-1', 'b-mucho-2']);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3 · La explicación tiene que ser cierta
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Comprueba, SIN mirar el árbol, que lo que la predicción dice que la sostiene
 * es de verdad lo que la sostiene: los ejemplos, las cuentas, la mayoría y la
 * seguridad. Y si dijo que se atascó, que ese valor de verdad no estaba.
 */
function comprobarExplicacion(modelo: Modelo, rasgos: Fila): void {
  const p = predecir(modelo, rasgos);
  if (p.motivo === 'sin-modelo') {
    expect(p.apoyo).toEqual([]);
    expect(p.etiqueta).toBeNull();
    return;
  }

  const casan = ejemplosQueCasan(modelo.ejemplos, p.condiciones);
  expect(casan.map((e) => e.id)).toEqual(p.apoyo);
  expect(p.total).toBe(casan.length);

  const cuentas: Record<string, number> = {};
  for (const e of casan) cuentas[e.etiqueta] = (cuentas[e.etiqueta] ?? 0) + 1;
  expect(p.conteo).toEqual(cuentas);

  let mejor = '';
  let masAlto = -1;
  for (const etiqueta of modelo.etiquetas) {
    const c = cuentas[etiqueta] ?? -1;
    if (c > masAlto) {
      mejor = etiqueta;
      masAlto = c;
    }
  }
  expect(p.etiqueta).toBe(mejor);
  expect(p.confianza).toBeCloseTo((cuentas[mejor] ?? 0) / casan.length, 12);

  if (p.atascoEn) {
    const conEseValor = ejemplosQueCasan(modelo.ejemplos, [
      ...p.condiciones,
      { rasgo: p.atascoEn.rasgo, valor: p.atascoEn.valor },
    ]);
    expect(conEseValor).toEqual([]);
  }
  // El camino y las condiciones no se contradicen.
  expect(p.camino.filter((s) => s.hubo).map((s) => ({ rasgo: s.rasgo, valor: s.valor }))).toEqual(
    p.condiciones,
  );
}

describe('3 · la explicación casa con los ejemplos que la sostienen', () => {
  it('para cada predicción de los ocho conjuntos, sondas incluidas', () => {
    let comprobadas = 0;
    for (const conjunto of APRENDE) {
      const modelo = entrenar(conjunto.esquema, conjunto.entrenamiento, conjunto.opciones);
      const sondas: Fila[] = [
        ...conjunto.entrenamiento.map((e) => e.rasgos as Fila),
        ...conjunto.casos.map((c) => c.rasgos),
        // Sondas imposibles: un valor inventado y un rasgo que falta.
        ...conjunto.esquema.rasgos.map((r) => ({ [r.id]: 'valor-que-nadie-ha-visto' })),
        {},
      ];
      for (const sonda of sondas) {
        comprobarExplicacion(modelo, sonda);
        comprobadas += 1;
      }
    }
    expect(comprobadas).toBeGreaterThan(80);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4 · Datos malos
// ═══════════════════════════════════════════════════════════════════════════

const ESQUEMA_MALO: Esquema = {
  rasgos: [
    { id: 'forma', valores: ['circulo', 'cuadrado'] },
    { id: 'color', valores: ['rojo', 'azul'] },
  ],
  etiquetas: ['si', 'no'],
};

describe('4 · datos malos: nada lanza y todo se puede contar', () => {
  it('cero ejemplos: el modelo existe, no sabe nada, y lo dice', () => {
    const modelo = entrenar(ESQUEMA_MALO, []);
    expect(modelo.raiz).toBeNull();
    const p = predecir(modelo, { forma: 'circulo', color: 'rojo' });
    expect(p.etiqueta).toBeNull();
    expect(p.motivo).toBe('sin-modelo');
    expect(p.confianza).toBe(0);

    const auditoria = examinar(ESQUEMA_MALO, []);
    expect(auditoria.total).toBe(0);
    expect(auditoria.etiquetasVacias).toEqual(['si', 'no']);
    expect(auditoria.constantes).toEqual([]);

    const examen = evaluar(modelo, [ej('t1', { forma: 'circulo', color: 'rojo' }, 'si')]);
    expect(examen.aciertos).toBe(0);
    expect(examen.matriz).toEqual({ si: { '(sin respuesta)': 1 } });
    expect(senalesDe({ informe: informeDe(modelo) }).map((s) => s.id)).toContain('sin-modelo');
  });

  it('un solo ejemplo: contesta siempre lo mismo, y eso es memoria', () => {
    const modelo = entrenar(ESQUEMA_MALO, [ej('u1', { forma: 'circulo', color: 'rojo' }, 'si')]);
    expect(modelo.raiz?.tipo).toBe('hoja');
    const p = predecir(modelo, { forma: 'cuadrado', color: 'azul' });
    expect(p.etiqueta).toBe('si');
    expect(p.confianza).toBe(1); // seguridad máxima con un ejemplo: eso es el aviso
    const i = informeDe(modelo);
    expect(i.memorizadas).toHaveLength(1);
    expect(i.pocos.map((x) => x.etiqueta)).toEqual(['si', 'no']);
  });

  it('todos con la misma etiqueta: no hay nada que preguntar', () => {
    const banco = [
      ej('m1', { forma: 'circulo', color: 'rojo' }, 'si'),
      ej('m2', { forma: 'cuadrado', color: 'azul' }, 'si'),
      ej('m3', { forma: 'circulo', color: 'azul' }, 'si'),
    ];
    const modelo = entrenar(ESQUEMA_MALO, banco);
    expect(modelo.raiz?.tipo).toBe('hoja');
    if (modelo.raiz?.tipo === 'hoja') expect(modelo.raiz.motivo).toBe('pura');
    // Ni siquiera se atasca con un valor nuevo: nunca llega a preguntar.
    const p = predecir(modelo, { forma: 'triangulo', color: 'verde' });
    expect(p.motivo).toBe('hoja');
    expect(p.etiqueta).toBe('si');
    expect(examinar(ESQUEMA_MALO, banco).etiquetasVacias).toEqual(['no']);
  });

  it('dos idénticos con etiquetas contrarias: empate declarado, no moneda al aire', () => {
    const banco = [
      ej('k1', { forma: 'circulo', color: 'rojo' }, 'si'),
      ej('k2', { forma: 'circulo', color: 'rojo' }, 'no'),
    ];
    const modelo = entrenar(ESQUEMA_MALO, banco);
    expect(modelo.raiz?.tipo).toBe('hoja');
    if (modelo.raiz?.tipo === 'hoja') {
      expect(modelo.raiz.motivo).toBe('ninguna-pregunta-separa');
      expect(modelo.raiz.empate).toBe(true);
    }
    const p = predecir(modelo, { forma: 'circulo', color: 'rojo' });
    expect(p.motivo).toBe('empate');
    expect(p.etiqueta).toBe('si'); // el desempate es el orden del esquema
    expect(p.confianza).toBe(0.5);

    const auditoria = examinar(ESQUEMA_MALO, banco);
    expect(auditoria.contradicciones).toHaveLength(1);
    expect(auditoria.contradicciones[0].ejemplos).toEqual(['k1', 'k2']);
    expect(auditoria.duplicados).toBe(1);
    // Y al revés da lo mismo: el orden de los ejemplos no decide.
    const alReves = entrenar(ESQUEMA_MALO, [banco[1], banco[0]]);
    expect(predecir(alReves, { forma: 'circulo', color: 'rojo' }).etiqueta).toBe('si');
  });

  it('un rasgo que nunca cambia: no se usa, y se dice que no cambia', () => {
    const banco = [
      ej('c1', { forma: 'circulo', color: 'rojo' }, 'si'),
      ej('c2', { forma: 'circulo', color: 'azul' }, 'no'),
      ej('c3', { forma: 'circulo', color: 'rojo' }, 'si'),
      ej('c4', { forma: 'circulo', color: 'azul' }, 'no'),
    ];
    const modelo = entrenar(ESQUEMA_MALO, banco);
    const i = informeDe(modelo);
    expect(i.rasgosUsados).toEqual(['color']);
    expect(i.rasgosIgnorados).toEqual(['forma']);
    expect(examinar(ESQUEMA_MALO, banco).constantes).toEqual(['forma']);
  });

  it('un rasgo que lo decide todo: una sola pregunta y se acabó', () => {
    const banco = [
      ej('d1', { forma: 'circulo', color: 'rojo' }, 'si'),
      ej('d2', { forma: 'cuadrado', color: 'rojo' }, 'no'),
      ej('d3', { forma: 'circulo', color: 'azul' }, 'si'),
      ej('d4', { forma: 'cuadrado', color: 'azul' }, 'no'),
    ];
    const modelo = entrenar(ESQUEMA_MALO, banco);
    const i = informeDe(modelo);
    expect(i.profundidad).toBe(1);
    expect(i.rasgosUsados).toEqual(['forma']);
    expect(examinar(ESQUEMA_MALO, banco).decisivos).toEqual(['forma']);
  });

  it('un rasgo que no existe y otro que falta: quejas, y la predicción sigue en pie', () => {
    const banco = [
      ej('q1', { forma: 'circulo', color: 'rojo', peso: 'mucho' }, 'si'),
      ej('q2', { color: 'azul' }, 'no'),
      ej('q1', { forma: 'cuadrado', color: 'verde' }, 'quiza'),
    ];
    const quejas = revisar(ESQUEMA_MALO, banco);
    expect(quejas).toContain('El ejemplo «q1» trae el rasgo «peso», que el esquema no declara.');
    expect(quejas).toContain('Al ejemplo «q2» le falta el rasgo «forma».');
    expect(quejas).toContain('Hay dos ejemplos con el id «q1».');
    expect(quejas).toContain('El ejemplo «q1» lleva la etiqueta «quiza», que el esquema no declara.');
    expect(quejas.some((q) => q.includes('«color = verde»'))).toBe(true);

    // El rasgo intruso no cambia nada: el motor sólo mira los declarados.
    const modelo = entrenar(ESQUEMA_MALO, banco);
    expect(predecir(modelo, { forma: 'circulo', color: 'rojo', peso: 'poco' }).etiqueta).toBe('si');
    // Y al ejemplo al que le falta la forma se le trata como un valor más.
    expect(predecir(modelo, { color: 'azul' }).camino[0].valor).toBe(SIN_DATO);
  });

});

// ═══════════════════════════════════════════════════════════════════════════
// 5 · Las piezas, una a una
// ═══════════════════════════════════════════════════════════════════════════

describe('5 · las piezas', () => {
  it('examinar: cuenta, cruza y enseña el hueco antes de entrenar', () => {
    const banco = [
      ej('e1', { color: 'naranja', orejas: 'puntiagudas' }, 'gato'),
      ej('e2', { color: 'naranja', orejas: 'puntiagudas' }, 'gato'),
      ej('e3', { color: 'negro', orejas: 'caidas' }, 'perro'),
    ];
    const a = examinar(ESQUEMA_MASCOTA, banco);
    expect(a.total).toBe(3);
    expect(a.porEtiqueta).toEqual({ gato: 2, perro: 1 });
    expect(a.porRasgo.color).toEqual({ naranja: 2, blanco: 0, negro: 1, marron: 0 });
    expect(a.cruce.color.naranja).toEqual({ gato: 2, perro: 0 });
    expect(a.valoresNoVistos).toEqual([
      { rasgo: 'color', valor: 'blanco' },
      { rasgo: 'color', valor: 'marron' },
    ]);
    expect(a.huecos).toEqual([
      { rasgo: 'color', valor: 'naranja', etiqueta: 'perro' },
      { rasgo: 'color', valor: 'negro', etiqueta: 'gato' },
      { rasgo: 'orejas', valor: 'puntiagudas', etiqueta: 'perro' },
      { rasgo: 'orejas', valor: 'caidas', etiqueta: 'gato' },
    ]);
    expect(a.decisivos).toEqual(['color', 'orejas']);
    expect(a.duplicados).toBe(1); // e1 y e2 son el mismo ejemplo dos veces
    expect(a.contradicciones).toEqual([]);
    expect(a.quejas).toEqual([]);
  });

  it('informeDe: las reglas, lo que memoriza y por dónde se rompe', () => {
    const modelo = entrenar(ANIMALES.esquema, ANIMALES.entrenamiento);
    const i = informeDe(modelo);
    expect(i.hojas).toBe(3);
    expect(i.profundidad).toBe(2);
    expect(i.reglas.map((r) => r.entonces)).toEqual(['ave', 'perro', 'humano']);
    expect(i.reglas[1].si).toEqual([
      { rasgo: 'pico', valor: 'no' },
      { rasgo: 'patas', valor: '4' },
    ]);
    expect(i.memorizadas).toEqual([]); // cada regla se apoya en dos ejemplos
    expect(i.ciegos).toEqual([]); // el esquema no declara ningún valor que falte

    // Ahora con un valor declarado que el banco no vio: aparece el ciego.
    const conHueco: Esquema = {
      ...ANIMALES.esquema,
      rasgos: [{ id: 'pico', valores: ['si', 'no', 'trompa'] }, ANIMALES.esquema.rasgos[1]],
    };
    const j = informeDe(entrenar(conHueco, ANIMALES.entrenamiento));
    expect(j.ciegos).toHaveLength(1);
    expect(j.ciegos[0]).toMatchObject({ rasgo: 'pico', valor: 'trompa', si: [] });
    // Lo que contestaría al caer ahí es lo que de verdad contesta.
    expect(predecir(entrenar(conHueco, ANIMALES.entrenamiento), { pico: 'trompa', patas: '4' }).etiqueta).toBe(
      j.ciegos[0].contestaria,
    );
  });

  it('evaluar: cuáles falló, con qué motivo, y la matriz', () => {
    const modelo = entrenar(GATOS.esquema, GATOS.entrenamiento);
    const prueba = [
      ej('t1', { color: 'naranja', orejas: 'puntiagudas' }, 'gato'),
      ej('t2', { color: 'blanco', orejas: 'caidas' }, 'gato'), // el modelo dirá perro
      ej('t3', { color: 'negro', orejas: 'caidas' }, 'perro'),
    ];
    const examen = evaluar(modelo, prueba);
    expect(examen.total).toBe(3);
    expect(examen.aciertos).toBe(2);
    expect(examen.acierto).toBeCloseTo(2 / 3, 12);
    expect(examen.fallos).toEqual([
      { ejemplo: 't2', esperada: 'gato', dijo: 'perro', motivo: 'hoja', atasco: null },
    ]);
    expect(examen.matriz).toEqual({ gato: { gato: 1, perro: 1 }, perro: { perro: 1 } });
    expect(examen.porEtiqueta).toEqual([
      { valor: 'gato', total: 2, aciertos: 1, acierto: 0.5 },
      { valor: 'perro', total: 1, aciertos: 1, acierto: 1 },
    ]);
    expect(examen.atascos).toBe(0); // el color no se pregunta: no hay atasco posible
    expect(examen.predicciones).toHaveLength(3);
  });

  it('brechaDe: los grupos salen en el orden del esquema y el peor tiene nombre', () => {
    const modelo = entrenar(GATOS.esquema, GATOS.entrenamiento);
    const examen = evaluar(modelo, [
      ej('t1', { color: 'negro', orejas: 'caidas' }, 'gato'),
      ej('t2', { color: 'naranja', orejas: 'puntiagudas' }, 'gato'),
      ej('t3', { color: 'blanco', orejas: 'puntiagudas' }, 'gato'),
    ]);
    const b = brechaDe(examen, 'color');
    expect(b.grupos.map((g) => g.valor)).toEqual(['naranja', 'blanco', 'negro']);
    expect(b.peor?.valor).toBe('negro');
    expect(b.peor?.acierto).toBe(0);
    expect(b.diferencia).toBe(1);
    // Un rasgo que no existe no revienta: da una brecha vacía.
    expect(brechaDe(examen, 'inventado')).toEqual({
      rasgo: 'inventado',
      grupos: [],
      mejor: null,
      peor: null,
      diferencia: 0,
    });
  });

  it('repartir: con la misma semilla, el mismo reparto; sin solapes y sin perder nadie', () => {
    const banco = Array.from({ length: 20 }, (_, i) =>
      ej(`r${i}`, { color: i % 2 === 0 ? 'naranja' : 'negro', orejas: 'caidas' }, i < 15 ? 'gato' : 'perro'),
    );
    const a = repartir(banco, { prueba: 0.3, semilla: 7 });
    const b = repartir(banco, { prueba: 0.3, semilla: 7 });
    const c = repartir(banco, { prueba: 0.3, semilla: 8 });

    expect(a.prueba.map((e) => e.id)).toEqual(b.prueba.map((e) => e.id));
    expect(a.prueba).toHaveLength(6);
    expect(a.entrenamiento).toHaveLength(14);
    expect(new Set([...a.prueba, ...a.entrenamiento].map((e) => e.id)).size).toBe(20);
    expect(a.prueba.map((e) => e.id)).not.toEqual(c.prueba.map((e) => e.id));
    /*
     * La semilla 0 tiene que barajar DE VERDAD. Xorshift arrancado en 0 se
     * queda en 0 para siempre, y entonces el barajado no deja el array quieto
     * —eso se vería— sino que lo **rota**, que se parece bastante a estar
     * barajado y no lo está: la mitad de arriba se queda casi entera arriba.
     * Por eso lo que se mide es la mezcla, no la desigualdad: de los diez que
     * van al examen, unos cuantos tienen que venir de la segunda mitad.
     */
    const conCero = repartir(banco, { prueba: 0.5, semilla: 0 }).prueba.map((e) => e.id);
    expect(conCero).not.toEqual(banco.slice(0, 10).map((e) => e.id));
    expect(conCero.filter((id) => Number(id.slice(1)) >= 10).length).toBeGreaterThanOrEqual(3);
    // Estratificar mantiene la proporción de cada etiqueta.
    const est = repartir(banco, { prueba: 0.4, semilla: 3, estratificar: true });
    expect(est.prueba.filter((e) => e.etiqueta === 'gato')).toHaveLength(6);
    expect(est.prueba.filter((e) => e.etiqueta === 'perro')).toHaveLength(2);
  });

  it('torcer: quitar del todo, dejar unos pocos y reetiquetar, sin tocar el original', () => {
    const banco = [
      ej('a', { color: 'negro', orejas: 'caidas' }, 'gato'),
      ej('b', { color: 'negro', orejas: 'caidas' }, 'gato'),
      ej('c', { color: 'negro', orejas: 'caidas' }, 'perro'),
      ej('d', { color: 'naranja', orejas: 'caidas' }, 'gato'),
    ];
    expect(torcer(banco, [{ donde: [{ rasgo: 'color', valor: 'negro' }] }]).map((e) => e.id)).toEqual(['d']);
    expect(
      torcer(banco, [{ donde: [{ rasgo: 'color', valor: 'negro' }], etiqueta: 'gato', dejar: 1 }]).map(
        (e) => e.id,
      ),
    ).toEqual(['a', 'c', 'd']);
    expect(
      torcer(banco, [{ donde: [{ rasgo: 'color', valor: 'negro' }], reetiquetar: 'perro' }]).map(
        (e) => e.etiqueta,
      ),
    ).toEqual(['perro', 'perro', 'perro', 'gato']);
    expect(banco.map((e) => e.etiqueta)).toEqual(['gato', 'gato', 'perro', 'gato']);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6 · Cómo encaja con el asistente, y las dos promesas del motor
// ═══════════════════════════════════════════════════════════════════════════

describe('6 · el encaje y las promesas', () => {
  it('las señales son ids de ficha estables que el guion del asistente contesta', () => {
    const banco = [
      ej('g1', { color: 'naranja', orejas: 'puntiagudas' }, 'gato'),
      ej('g2', { color: 'naranja', orejas: 'caidas' }, 'gato'),
      ej('p1', { color: 'blanco', orejas: 'caidas' }, 'perro'),
      ej('p2', { color: 'blanco', orejas: 'puntiagudas' }, 'perro'),
    ];
    const modelo = entrenar(ESQUEMA_MASCOTA, banco, { rasgos: ['color'] });
    const senales = senalesDe({
      auditoria: examinar(ESQUEMA_MASCOTA, banco),
      informe: informeDe(modelo),
    });
    const ids = senales.map((s) => s.id);
    expect(ids).toContain('valor-no-visto:color=negro');
    expect(ids).toContain('hueco:color=naranja/perro');
    expect(ids).toContain('ciego:n0/color=negro');
    // Estables: el mismo banco da exactamente las mismas señales.
    expect(senalesDe({ auditoria: examinar(ESQUEMA_MASCOTA, banco), informe: informeDe(modelo) })).toEqual(
      senales,
    );

    // La señal de una predicción concreta es la que el panel manda al chat.
    const p = predecir(modelo, { color: 'negro', orejas: 'caidas' });
    const senal = senalDePrediccion(p);
    expect(senal?.id).toBe('valor-no-visto:color=negro');

    // Y el armazón hermano la contesta: el motor decide, el asistente lo cuenta.
    const guion: GuionAsistente = {
      respuestas: [{ id: 'sin-negros', texto: 'No me enseñaste ni un animal negro.' }],
      reglas: [{ tipo: 'ficha', ficha: 'valor-no-visto:color=negro', responde: 'sin-negros' }],
      porDefecto: { id: 'nada', texto: 'No sé.' },
    };
    const resuelto = resolverGuion(guion, { ficha: senal?.id });
    expect(resuelto.porDefecto).toBe(false);
    expect(resuelto.respuesta.id).toBe('sin-negros');
  });

  it('determinista: dos entrenamientos iguales, y ni azar ni reloj en el paquete', () => {
    const uno = entrenar(CORREO.esquema, CORREO.entrenamiento);
    const dos = entrenar(CORREO.esquema, CORREO.entrenamiento);
    expect(uno.raiz).toEqual(dos.raiz);
    expect(informeDe(uno)).toEqual(informeDe(dos));

    /*
     * Los comentarios se quitan antes de mirar: los cuatro archivos NOMBRAN la
     * prohibición para explicarla, y un grep a pelo se tropieza con su propia
     * regla escrita en prosa. Lo que no puede haber es la llamada.
     */
    const sinComentarios = (fuente: string) =>
      fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    const carpeta = join(__dirname, '..', 'components', 'simuladores', 'aprendizaje');
    for (const archivo of ['modelo.ts', 'arbol.ts', 'examen.ts', 'senales.ts', 'index.ts']) {
      const codigo = sinComentarios(readFileSync(join(carpeta, archivo), 'utf8'));
      expect(codigo).not.toContain('Math.random');
      expect(codigo).not.toContain('Date.now');
      expect(codigo).not.toContain('new Date');
      expect(codigo).not.toContain('performance.now');
    }
  });

  it('aguanta: 5 000 ejemplos entrenados por debajo de 50 ms (el mínimo, no la media)', () => {
    const esquema: Esquema = {
      rasgos: Array.from({ length: 6 }, (_, j) => ({
        id: `r${j}`,
        valores: ['0', '1', '2', '3'],
      })),
      etiquetas: ['uno', 'dos', 'tres'],
    };

    /*
     * Datos deterministas sin azar de biblioteca. Xorshift de 32 bits con
     * aritmética entera exacta: un congruencial escrito con `*` se sale de los
     * 2^53 que aguanta un `number` a la segunda multiplicación, pierde los bits
     * de abajo y degenera en un puñado de valores. La primera versión de esta
     * prueba lo hizo, y el «banco de 5 000» resultó tener tres combinaciones
     * distintas: entrenaba en 3 ms porque no había nada que aprender.
     */
    let s = 12345;
    const siguiente = () => {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      return s >>> 0;
    };
    const banco: Ejemplo[] = Array.from({ length: 5000 }, (_, i) => {
      const rasgos: Fila = {};
      for (let j = 0; j < 6; j += 1) rasgos[`r${j}`] = String(siguiente() % 4);
      const etiqueta =
        rasgos.r0 === '0' ? 'uno'
        : rasgos.r1 === '3' ? 'dos'
        : rasgos.r2 === '1' ? 'tres'
        : rasgos.r3 === '2' ? 'uno'
        : rasgos.r4 === '0' ? 'dos'
        : 'tres';
      return ej(`p${i}`, rasgos, etiqueta);
    });

    let mejor = Number.POSITIVE_INFINITY;
    let ultimo: Modelo | null = null;
    for (let tanda = 0; tanda < 7; tanda += 1) {
      const t0 = performance.now();
      ultimo = entrenar(esquema, banco);
      const ms = performance.now() - t0;
      if (ms < mejor) mejor = ms;
    }
    // Que de verdad haya construido un árbol, no una hoja suelta.
    const informe = informeDe(ultimo as Modelo);
    expect(informe.hojas).toBeGreaterThan(50);
    expect(informe.profundidad).toBeGreaterThanOrEqual(4);
    expect(mejor).toBeLessThan(50); // medido: 5,4 ms con 237 hojas y profundidad 5
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7 · Un examen de verdad, de punta a punta
// ═══════════════════════════════════════════════════════════════════════════

describe('7 · de punta a punta', () => {
  it('etiquetar, repartir, entrenar, probar y ver el sesgo, en ese orden', () => {
    // Un banco donde el color y las orejas dicen lo mismo… salvo en los negros,
    // de los que sólo hay perros.
    const banco: Ejemplo[] = [];
    for (let i = 0; i < 12; i += 1) {
      banco.push(ej(`gn${i}`, { color: 'naranja', orejas: 'puntiagudas' }, 'gato'));
      banco.push(ej(`pb${i}`, { color: 'blanco', orejas: 'caidas' }, 'perro'));
    }
    for (let i = 0; i < 6; i += 1) {
      banco.push(ej(`pn${i}`, { color: 'negro', orejas: 'caidas' }, 'perro'));
    }

    const { entrenamiento, prueba } = repartir(banco, { prueba: 0.25, semilla: 11, estratificar: true });
    expect(entrenamiento.length + prueba.length).toBe(banco.length);

    const modelo = entrenar(ESQUEMA_MASCOTA, entrenamiento);
    const examen: Examen = evaluar(modelo, prueba);
    // Con ejemplos que no vio, y sin gatos negros en ningún sitio, acierta todo.
    expect(examen.acierto).toBe(1);

    // Hasta que llega un gato negro, que nunca estuvo en el banco.
    const gatosNegros = Array.from({ length: 5 }, (_, i) =>
      ej(`x${i}`, { color: 'negro', orejas: 'puntiagudas' }, 'gato'),
    );
    const segundo = evaluar(modelo, [...prueba, ...gatosNegros]);
    expect(segundo.fallos.map((f) => f.ejemplo)).toEqual(gatosNegros.map((e) => e.id));
    expect(segundo.fallos.every((f) => f.dijo === 'perro')).toBe(true);

    const brecha = brechaDe(segundo, 'color');
    expect(brecha.peor?.valor).toBe('negro');
    expect(brecha.diferencia).toBeGreaterThan(0.5);

    // El hueco estaba escrito en el banco desde el principio.
    expect(examinar(ESQUEMA_MASCOTA, entrenamiento).huecos).toContainEqual({
      rasgo: 'color',
      valor: 'negro',
      etiqueta: 'gato',
    });
  });
});
