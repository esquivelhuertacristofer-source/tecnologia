/**
 * Tecnia Hojas · la cinta que emite gestos (§45.7, paso 1).
 *
 * Doce pruebas, y no doce ejemplos: cada una está puesta sobre algo que ya se
 * sabe que se rompe. La que decide el archivo es la penúltima —**todo lo que
 * hace la cinta es grabable**—, porque si un botón toca el libro por su cuenta
 * la pantalla queda bien, el alumno sigue y el defecto no aparece hasta la clase
 * 55, veintidós clases después. Aquí aparece hoy.
 */

import { crearMotor, type Motor } from '@/components/office/motor-hojas/formula/calculo';
import {
  cajaDeTexto,
  ejecutar,
  nuevaGrabadora,
  reproducir,
  revisar,
  type Caja,
  type Gesto,
} from '@/components/office/motor-hojas/comandos';
import {
  CONTROLES,
  estaActivo,
  estaInerte,
  gestosDe,
  rangoDeAutosuma,
  razonInerte,
  textoDeCaja,
  SIN_CONSTRUIR,
  SOLO_VENTANA,
  type ContextoCinta,
  type ControlesDeClase,
} from '@/components/office/motor-hojas/cinta';
import { libroDePrueba } from '@/components/office/motor-hojas/librosDePrueba';
import type { Celda, Libro } from '@/components/office/motor-hojas/modelo';

/* ── utilidades ─────────────────────────────────────────────────────────────*/

const CONTEXTO = { ahora: Date.UTC(2026, 7, 13, 12, 0, 0) };

function libroCon(celdas: Record<string, string | Celda>): Libro {
  return {
    activa: 'h1',
    nombres: {},
    hojas: [
      {
        id: 'h1',
        nombre: 'Hoja1',
        celdas: Object.fromEntries(
          Object.entries(celdas).map(([d, c]) => [d, typeof c === 'string' ? { crudo: c } : c]),
        ),
      },
    ],
  };
}

const caja = (texto: string): Caja => cajaDeTexto(texto) as Caja;

function ctxDe(motor: Motor, rango: string, valor?: string | number): ContextoCinta {
  return { motor, hoja: 'h1', sel: caja(rango), valor };
}

const ctxCon = (celdas: Record<string, string | Celda>, rango: string, valor?: string | number): ContextoCinta =>
  ctxDe(crearMotor(libroCon(celdas), CONTEXTO), rango, valor);

/* ── autosuma: adivinar el rango como lo adivina Excel ──────────────────────*/

describe('cinta de hojas · autosuma', () => {
  it('sube por la columna y se para en el encabezado de texto', () => {
    const c = ctxCon({ A1: 'Importe', A2: '10', A3: '20', A4: '30' }, 'A5');
    expect(textoDeCaja(rangoDeAutosuma(c.motor, 'h1', 0, 4) as Caja)).toBe('A2:A4');
    expect(gestosDe(c, 'autosuma')).toEqual([
      { comando: 'escribir', args: { hoja: 'h1', celda: 'A5', crudo: '=SUMA(A2:A4)' } },
    ]);
  });

  it('mira a la izquierda cuando arriba no hay números', () => {
    const c = ctxCon({ B3: '5', C3: '6', D3: '7' }, 'E3');
    expect(rangoDeAutosuma(c.motor, 'h1', 4, 2)).toEqual({ c0: 1, f0: 2, c1: 3, f1: 2 });
    expect(gestosDe(c, 'autosuma')).toEqual([
      { comando: 'escribir', args: { hoja: 'h1', celda: 'E3', crudo: '=SUMA(B3:D3)' } },
    ]);
  });

  it('no se inventa un rango: sin nada alrededor deja «=SUMA()»', () => {
    const c = ctxCon({ A1: 'sólo texto' }, 'C5');
    expect(rangoDeAutosuma(c.motor, 'h1', 2, 4)).toBeNull();
    expect(gestosDe(c, 'autosuma')).toEqual([
      { comando: 'escribir', args: { hoja: 'h1', celda: 'C5', crudo: '=SUMA()' } },
    ]);
  });

  it('con varias columnas seleccionadas pone una suma debajo de cada una', () => {
    const c = ctxCon({ B2: '1', B3: '2', B4: '3', C2: '4', C3: '5', C4: '6' }, 'B2:C4');
    expect(gestosDe(c, 'autosuma')).toEqual([
      { comando: 'escribir', args: { hoja: 'h1', celda: 'B5', crudo: '=SUMA(B2:B4)' } },
      { comando: 'escribir', args: { hoja: 'h1', celda: 'C5', crudo: '=SUMA(C2:C4)' } },
    ]);
  });
});

/* ── los interruptores: el «activo» es quien decide el gesto ────────────────*/

describe('cinta de hojas · interruptores y decimales', () => {
  it('negrita sobre una celda que ya está en negrita la quita', () => {
    const puesta = ctxCon({ B2: { crudo: '25', formato: { tipo: 'general', negrita: true } } }, 'B2');
    expect(estaActivo(puesta, 'negrita')).toBe(true);
    expect(gestosDe(puesta, 'negrita')).toEqual([
      { comando: 'formato', args: { hoja: 'h1', rango: 'B2', negrita: 0 } },
    ]);

    const sinPoner = ctxCon({ B2: '25' }, 'B2');
    expect(estaActivo(sinPoner, 'negrita')).toBe(false);
    expect(gestosDe(sinPoner, 'negrita')).toEqual([
      { comando: 'formato', args: { hoja: 'h1', rango: 'B2', negrita: 1 } },
    ]);
  });

  it('menos decimales baja de 2 a 1 y se apaga en 0, sin bajar a -1', () => {
    const dos = ctxCon({ B2: { crudo: '25', formato: { tipo: 'moneda', decimales: 2 } } }, 'B2');
    expect(gestosDe(dos, 'decimal-menos')).toEqual([
      { comando: 'formato', args: { hoja: 'h1', rango: 'B2', decimales: 1 } },
    ]);

    const cero = ctxCon({ B2: { crudo: '25', formato: { tipo: 'moneda', decimales: 0 } } }, 'B2');
    expect(estaInerte(cero, 'decimal-menos')).toBe(true);
    expect(gestosDe(cero, 'decimal-menos')).toBeNull();
    expect(razonInerte(cero, 'decimal-menos')).toContain('decimales');
  });
});

/* ── lo que está apagado tiene que decir por qué ────────────────────────────*/

describe('cinta de hojas · los botones que todavía no hacen', () => {
  it('cada botón apagado devuelve null y explica por qué, sin repetir la frase', () => {
    const c = ctxCon({ A1: '1' }, 'A1');
    const apagados = Object.keys(CONTROLES).filter((id) => estaInerte(c, id));
    // Los que además no emiten nada NUNCA son los pendientes de temario: los que
    // sí emiten (rellenar, ordenar) están apagados sólo por la selección.
    const pendientes = apagados.filter((id) => CONTROLES[id].gesto(c) === null);
    /*
     * El suelo BAJA según se construye la sala, y ésa es la dirección buena:
     * eran 22 el 13-ago-2026, 19 desde el 14 —cuando la clase del bloque 12 se
     * llevó `insertar-columna` y `borrar-columna` a construidos y
     * `ver-cuadricula` pasó a `SOLO_VENTANA`— y 16 desde el 15, con las deudas
     * del formato de celda pagadas: siete botones salieron de `PENDIENTES`
     * —`subrayado`, `ajustar-texto` y `combinar-centrar` quedaron encendidos, la
     * brocha se fue a `SOLO_VENTANA` y los tres colores y bordes siguen aquí
     * porque **piden un dato**, que no es lo mismo que no estar construidos.
     * Lo que la prueba cuida no es el número: es que ninguno se quede apagado y
     * mudo, y que dos apagados no digan la misma frase.
     */
    expect(pendientes.length).toBeGreaterThanOrEqual(16);

    const motivos = pendientes.map((id) => {
      expect(gestosDe(c, id)).toBeNull();
      const porQue = razonInerte(c, id) ?? '';
      expect(porQue.length).toBeGreaterThan(30);
      return porQue;
    });
    // Un «aún no disponible» repetido veinte veces es ruido, no información.
    expect(new Set(motivos).size).toBe(motivos.length);
  });

  it('rellenar hacia abajo con una sola fila se apaga en vez de no hacer nada', () => {
    const una = ctxCon({ D2: '=B2*C2' }, 'D2');
    expect(estaInerte(una, 'rellenar-abajo')).toBe(true);
    expect(gestosDe(una, 'rellenar-abajo')).toBeNull();
    expect((razonInerte(una, 'rellenar-abajo') ?? '').length).toBeGreaterThan(30);

    const varias = ctxCon({ D2: '=B2*C2' }, 'D2:D6');
    expect(gestosDe(varias, 'rellenar-abajo')).toEqual([
      { comando: 'rellenarAbajo', args: { hoja: 'h1', rango: 'D2:D6' } },
    ]);
  });

  it('copiar no emite gesto y no está apagado: el portapapeles no es del libro', () => {
    const c = ctxCon({ A1: '1' }, 'A1');
    expect(SOLO_VENTANA.has('copiar')).toBe(true);
    expect(estaInerte(c, 'copiar')).toBe(false);
    expect(gestosDe(c, 'copiar')).toBeNull();

    // Pegar sí lleva su origen escrito, y por eso sí se graba.
    const sinNada = ctxCon({ A1: '1' }, 'C1');
    expect(estaInerte(sinNada, 'pegar')).toBe(true);
    const conOrigen = ctxCon({ A1: '1', A2: '2' }, 'C1', 'A1:A2');
    expect(gestosDe(conOrigen, 'pegar')).toEqual([
      { comando: 'pegar', args: { hoja: 'h1', origen: 'A1:A2', destino: 'C1' } },
    ]);
  });
});

/* ── §46 · los cuatro botones que llegaron con las deudas de motor ──────────*/

describe('cinta de hojas · §46 · rellenar la serie', () => {
  it('la dirección sale de la forma de la selección, y con una celda se apaga', () => {
    const una = ctxCon({ A1: '1' }, 'A1');
    expect(estaInerte(una, 'rellenar-serie')).toBe(true);
    expect((razonInerte(una, 'rellenar-serie') ?? '').length).toBeGreaterThan(30);

    const abajo = ctxCon({ A1: '1', A2: '2' }, 'A1:A5');
    expect(gestosDe(abajo, 'rellenar-serie')).toEqual([
      { comando: 'rellenarSerie', args: { hoja: 'h1', rango: 'A1:A5', direccion: 'abajo' } },
    ]);

    const derecha = ctxCon({ A1: 'enero', B1: 'febrero' }, 'A1:E1');
    expect(gestosDe(derecha, 'rellenar-serie')).toEqual([
      { comando: 'rellenarSerie', args: { hoja: 'h1', rango: 'A1:E1', direccion: 'derecha' } },
    ]);
  });
});

describe('cinta de hojas · §46 · cortar es mover, y mover sí cambia el libro', () => {
  it('emite pegar SIN traslado y borrar, y el origen se queda vacío', () => {
    const c = ctxCon({ B2: '25', C2: '3', D2: '=B2*C2' }, 'D8', 'D2');
    // Salió de `SOLO_VENTANA` el 14-ago-2026: copiar no cambia el libro y cortar sí.
    expect(SOLO_VENTANA.has('cortar')).toBe(false);

    const gestos = gestosDe(c, 'cortar') as Gesto[];
    expect(gestos).toEqual([
      { comando: 'pegar', args: { hoja: 'h1', origen: 'D2', destino: 'D8', trasladar: 0 } },
      { comando: 'borrar', args: { hoja: 'h1', rango: 'D2' } },
    ]);

    const despues = reproducir(c.motor.libro, gestos);
    // La fórmula se mudó de casa: sigue mirando B2 y C2, no B8 y C8.
    expect(despues.hojas[0].celdas.D8.crudo).toBe('=B2*C2');
    expect(despues.hojas[0].celdas.D2).toBeUndefined();
  });

  it('la primera pulsación no emite y NO se apaga: marcar el corte es de la ventana', () => {
    // Si se apagara, `pulsar` contestaría «todavía no» y el código del
    // portapapeles de la ventana no llegaría a ejecutarse nunca — que es el
    // defecto que ya se pagó con `ver-cuadricula`.
    const primera = ctxCon({ D2: '=B2*C2' }, 'D2');
    expect(estaInerte(primera, 'cortar')).toBe(false);
    expect(gestosDe(primera, 'cortar')).toBeNull();

    // Y mover algo encima de sí mismo se apaga: el borrar de después se llevaría
    // lo recién pegado.
    const encima = ctxCon({ D2: '=B2*C2' }, 'D1:D3', 'D2');
    expect(estaInerte(encima, 'cortar')).toBe(true);
  });
});

describe('cinta de hojas · §46 · el pegado especial y las dos de la hoja', () => {
  it('pegar valores y pegar formato emiten su modo, y sin portapapeles se apagan', () => {
    const c = ctxCon({ A1: '10', A2: '20', B1: '=SUMA(A1:A2)' }, 'D1', 'B1');
    expect(gestosDe(c, 'pegar-valores')).toEqual([
      // `ahora` viaja en el gesto para que congelar un `=HOY()` se pueda reproducir.
      { comando: 'pegar', args: { hoja: 'h1', origen: 'B1', destino: 'D1', modo: 'valores', ahora: CONTEXTO.ahora } },
    ]);
    expect(gestosDe(c, 'pegar-formato')).toEqual([
      { comando: 'pegar', args: { hoja: 'h1', origen: 'B1', destino: 'D1', modo: 'formato' } },
    ]);

    const vacio = ctxCon({ A1: '1' }, 'D1');
    expect(estaInerte(vacio, 'pegar-valores')).toBe(true);
    expect(gestosDe(vacio, 'pegar-formato')).toBeNull();
  });

  it('mover hoja y color de hoja piden su dato antes de hacer nada', () => {
    const sinDato = ctxCon({ A1: '1' }, 'A1');
    expect(estaInerte(sinDato, 'mover-hoja')).toBe(true);
    expect(estaInerte(sinDato, 'color-hoja')).toBe(true);

    expect(gestosDe(ctxCon({ A1: '1' }, 'A1', 1), 'mover-hoja')).toEqual([
      { comando: 'moverHoja', args: { hoja: 'h1', posicion: 1 } },
    ]);
    expect(gestosDe(ctxCon({ A1: '1' }, 'A1', '#107c41'), 'color-hoja')).toEqual([
      { comando: 'colorHoja', args: { hoja: 'h1', color: '#107c41' } },
    ]);
    // «verde» no es un color para el libro: el botón se queda apagado en vez de
    // dejar entrar un dato sucio por la puerta de la interfaz.
    expect(estaInerte(ctxCon({ A1: '1' }, 'A1', 'verde'), 'color-hoja')).toBe(true);
  });
});

/* ── §47 · las deudas del formato de celda (bloques 6, 9 y 10) ──────────────*/

describe('cinta de hojas · §47 · los seis que estaban apagados', () => {
  it('ninguno de los seis sigue en la lista de los sin construir', () => {
    /*
     * La prueba más barata de todo el archivo y la que dice si el encargo se
     * hizo: seis botones que se veían, se dejaban señalar y contestaban «todavía
     * no». Si uno se quedara en `SIN_CONSTRUIR`, la ventana lo seguiría vistiendo
     * de «aún no disponible» aunque su comando existiera — y eso no lo cazaría
     * ninguna de las pruebas de abajo, porque todas hablan de gestos.
     */
    for (const id of ['subrayado', 'color-letra', 'color-relleno', 'bordes', 'ajustar-texto', 'combinar-centrar']) {
      expect(SIN_CONSTRUIR.has(id)).toBe(false);
    }
    // La brocha no está construida en el motor **a propósito**: lo que hace la
    // primera pulsación es estado de la ventana, igual que copiar.
    expect(SIN_CONSTRUIR.has('copiar-formato')).toBe(false);
    expect(SOLO_VENTANA.has('copiar-formato')).toBe(true);
    expect(gestosDe(ctxCon({ A1: '1' }, 'A1'), 'copiar-formato')).toBeNull();
    expect(estaInerte(ctxCon({ A1: '1' }, 'A1'), 'copiar-formato')).toBe(false);
  });

  it('el subrayado y el ajuste de texto son interruptores de verdad', () => {
    const limpia = ctxCon({ A1: 'Nombre del producto' }, 'A1');
    expect(gestosDe(limpia, 'subrayado')).toEqual([
      { comando: 'formato', args: { hoja: 'h1', rango: 'A1', subrayado: 1 } },
    ]);
    expect(gestosDe(limpia, 'ajustar-texto')).toEqual([
      { comando: 'formato', args: { hoja: 'h1', rango: 'A1', ajustarTexto: 1 } },
    ]);

    // Puestos, el gesto que sale es el que los QUITA: si `activo` mintiera, el
    // botón dejaría de poder apagar el formato.
    const puesta = ctxCon(
      { A1: { crudo: 'Nombre', formato: { tipo: 'general', subrayado: true, ajustarTexto: true } } },
      'A1',
    );
    expect(estaActivo(puesta, 'subrayado')).toBe(true);
    expect(estaActivo(puesta, 'ajustar-texto')).toBe(true);
    expect(gestosDe(puesta, 'subrayado')).toEqual([
      { comando: 'formato', args: { hoja: 'h1', rango: 'A1', subrayado: 0 } },
    ]);
  });

  it('los colores y los bordes piden su dato, y el vacío es «quítalo»', () => {
    const sinDato = ctxCon({ A1: '1' }, 'A1');
    for (const id of ['color-letra', 'color-relleno', 'bordes']) {
      expect(estaInerte(sinDato, id)).toBe(true);
      expect((razonInerte(sinDato, id) ?? '').length).toBeGreaterThan(30);
    }

    expect(gestosDe(ctxCon({ A1: '1' }, 'A1:D1', '#c00000'), 'color-letra')).toEqual([
      { comando: 'formato', args: { hoja: 'h1', rango: 'A1:D1', colorLetra: '#c00000' } },
    ]);
    expect(gestosDe(ctxCon({ A1: '1' }, 'A1', '#ffc000'), 'color-relleno')).toEqual([
      { comando: 'formato', args: { hoja: 'h1', rango: 'A1', colorRelleno: '#ffc000' } },
    ]);
    expect(gestosDe(ctxCon({ A1: '1' }, 'A1:C3', 'contorno'), 'bordes')).toEqual([
      { comando: 'formato', args: { hoja: 'h1', rango: 'A1:C3', bordes: 'contorno' } },
    ]);

    // La cadena vacía SÍ es un dato: es «Automático» y «Sin relleno». Sin ella
    // el botón sabría pintar y no despintar.
    expect(estaInerte(ctxCon({ A1: '1' }, 'A1', ''), 'color-relleno')).toBe(false);
    expect(gestosDe(ctxCon({ A1: '1' }, 'A1', ''), 'color-relleno')).toEqual([
      { comando: 'formato', args: { hoja: 'h1', rango: 'A1', colorRelleno: '' } },
    ]);
    // «rojo» no lo es: un dato sucio no entra por la puerta de la interfaz.
    expect(estaInerte(ctxCon({ A1: '1' }, 'A1', 'rojo'), 'color-letra')).toBe(true);
    expect(estaInerte(ctxCon({ A1: '1' }, 'A1', 'gordos'), 'bordes')).toBe(true);
  });

  it('combinar es un interruptor: el mismo botón junta y separa', () => {
    const suelto = ctxCon({ A1: 'Gastos de agosto' }, 'A1');
    // Una celda sola no se combina con nada, y el botón lo dice en vez de dejarse
    // pulsar para no hacer nada.
    expect(estaInerte(suelto, 'combinar-centrar')).toBe(true);

    const marcadas = ctxCon({ A1: 'Gastos de agosto' }, 'A1:C1');
    expect(estaActivo(marcadas, 'combinar-centrar')).toBe(false);
    expect(gestosDe(marcadas, 'combinar-centrar')).toEqual([
      { comando: 'combinarCeldas', args: { hoja: 'h1', rango: 'A1:C1', centrar: 1 } },
    ]);

    // Ya combinada, y con el cursor dentro: el botón está hundido y lo que emite
    // es separar. La segunda mitad de la idea vive en el mismo botón, como en
    // Excel — un «Separar» aparte obligaría a aprender dos sitios.
    const motor = crearMotor(libroCon({ A1: 'Gastos de agosto' }), CONTEXTO);
    ejecutar(motor, { comando: 'combinarCeldas', args: { hoja: 'h1', rango: 'A1:C1' } });
    const dentro = ctxDe(motor, 'B1');
    expect(estaActivo(dentro, 'combinar-centrar')).toBe(true);
    expect(estaInerte(dentro, 'combinar-centrar')).toBe(false);
    expect(gestosDe(dentro, 'combinar-centrar')).toEqual([
      { comando: 'separarCeldas', args: { hoja: 'h1', rango: 'B1' } },
    ]);
  });

  it('la segunda pulsación lleva el permiso dentro, y por eso el motor la acepta', () => {
    // Es el cuadro de diálogo de Excel repartido entre las dos capas: la cinta
    // sabe fabricar el gesto con el «Aceptar» puesto y el motor decide si hacía
    // falta. Lo que la ventana pone es sólo el `valor`.
    const c = ctxCon({ A1: 'Gastos', B1: 'de', C1: 'agosto' }, 'A1:C1');
    const sinPermiso = gestosDe(c, 'combinar-centrar') as Gesto[];
    expect(revisar(c.motor.libro, sinPermiso[0])).toMatch(/superior izquierda/);

    const conPermiso = gestosDe(ctxCon({ A1: 'Gastos', B1: 'de', C1: 'agosto' }, 'A1:C1', 'confirmado'), 'combinar-centrar') as Gesto[];
    expect(conPermiso[0].args?.confirmado).toBe(1);
    expect(revisar(c.motor.libro, conPermiso[0])).toBeNull();
  });
});

/* ── ordenar: mueve datos y aun así se graba ────────────────────────────────*/

describe('cinta de hojas · ordenar', () => {
  it('ordena cuatro filas por su primera columna y todo lo que emite es «escribir»', () => {
    const c = ctxCon({ A1: 'Zapato', B1: '3', A2: 'Manzana', B2: '1', A3: 'Pera', B3: '2', A4: 'Casa', B4: '4' }, 'A1:B4');
    const gestos = gestosDe(c, 'ordenar-az') as Gesto[];
    expect(gestos.every((g) => g.comando === 'escribir')).toBe(true);

    const despues = reproducir(c.motor.libro, gestos);
    const col = (letra: string) => [1, 2, 3, 4].map((f) => despues.hojas[0].celdas[`${letra}${f}`]?.crudo ?? '');
    expect(col('A')).toEqual(['Casa', 'Manzana', 'Pera', 'Zapato']);
    expect(col('B')).toEqual(['4', '1', '2', '3']);
  });
});

/* ── la prueba que importa ──────────────────────────────────────────────────*/

describe('cinta de hojas · todo lo que hace la cinta es grabable', () => {
  /** Un botón, dónde estaba el cursor y qué traía el desplegable. */
  const CASOS: Array<[string, string, (string | number)?]> = [
    ['negrita', 'A1:D1'],
    ['cursiva', 'A8'],
    ['subrayado', 'A8'],
    ['alinear-centro', 'A1:D1'],
    ['ajustar-texto', 'A13'],
    // Los tres del bloque 9 llevan su dato, como el desplegable de formato de
    // número: sin él la cinta los declara inertes y `gestosDe` no emite nada.
    ['color-letra', 'D8', '#c00000'],
    ['color-relleno', 'A1:D1', '#ffc000'],
    ['bordes', 'A1:D6', 'contorno'],
    /*
     * Combinar con `confirmado`, porque `A1:C1` trae los tres encabezados
     * escritos y el motor no acepta tirar contenido sin que alguien conteste.
     * Que esté aquí es lo que prueba que **el gesto se graba con su permiso
     * dentro**: al reproducir la macro no vuelve a preguntar, y por eso las dos
     * vías dan el mismo libro.
     */
    ['combinar-centrar', 'A1:C1', 'confirmado'],
    ['alinear-derecha', 'B2:B6'],
    ['moneda', 'D2:D6'],
    ['porcentaje', 'B2'],
    ['millares', 'D8'],
    ['decimal-mas', 'D14'],
    ['decimal-menos', 'D14'],
    ['formato-numero', 'A2:A6', 'texto'],
    ['insertar-fila', 'A3'],
    ['borrar-fila', 'A3:A4'],
    ['insertar-columna', 'C1'],
    ['borrar-columna', 'B1:C1'],
    ['rellenar-abajo', 'D2:D6'],
    ['rellenar-derecha', 'B2:D2'],
    ['rellenar-serie', 'C2:C9'],
    ['borrar-contenido', 'D10:D12'],
    ['pegar', 'F2', 'D2:D6'],
    ['pegar-valores', 'F2', 'D2:D6'],
    ['pegar-formato', 'F2', 'D14'],
    ['cortar', 'F2', 'D2:D6'],
    ['mover-hoja', 'A1', 1],
    ['color-hoja', 'A1', '#107c41'],
    ['autosuma', 'D7'],
    ['fn-promedio', 'B7'],
    ['fn-contara', 'A7'],
    ['ordenar-az', 'A2:D6'],
    ['ordenar-za', 'A2:D6'],
  ];

  /**
   * El libro en una cadena, con las celdas ordenadas por dirección.
   *
   * Se compara así y no con `toEqual` para que el fallo **diga qué botón** fue:
   * veintiún botones en una sola prueba y un `toEqual` a secas dejaría un diff
   * de dos libros sin nombre encima. Y ordenado, para que dos libros iguales
   * escritos en distinto orden no salgan distintos por el orden de las claves.
   */
  function huella(l: Libro): string {
    /*
     * `JSON.stringify` y no `String`, desde el 15-ago-2026: `bordes` es un objeto
     * con las cuatro caras dentro, y `String({arriba:true})` es «[object
     * Object]» — o sea que dos bordes distintos habrían salido idénticos y el
     * botón habría aprobado esta prueba **por no haberse mirado**. Es el mismo
     * defecto de instrumento que el color de la lengüeta de aquí abajo.
     */
    const celda = (c: Celda) =>
      `${c.crudo}|${Object.entries(c.formato ?? {})
        .sort()
        .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
        .join('+')}`;
    // El color de la lengüeta entra en la huella desde el 14-ago-2026: sin él,
    // `color-hoja` habría pasado esta prueba sin que se comparara nada suyo —dos
    // libros idénticos en todo lo que la huella mira—, que es aprobar por no
    // haber preguntado.
    // Y las combinadas entran por lo mismo, desde el 15-ago-2026: sin ellas,
    // `combinar-centrar` habría comparado dos libros iguales en todo lo que la
    // huella mira y habría aprobado sin que se comparara nada suyo.
    const hojas = l.hojas.map(
      (h) =>
        `${h.id}(${h.nombre})${h.color ?? ''}[${(h.combinadas ?? []).join(',')}]{${Object.keys(h.celdas)
          .sort()
          .map((d) => `${d}:${celda(h.celdas[d])}`)
          .join(',')}}`,
    );
    return `${hojas.join(' ')} activa=${l.activa} nombres=${JSON.stringify(l.nombres)}`;
  }

  it('pulsar el botón y reproducir sus gestos dan el mismo libro, en todos', () => {
    const parte: string[] = [];
    for (const [id, rango, valor] of CASOS) {
      const motor = crearMotor(libroDePrueba(), CONTEXTO);
      const gestos = gestosDe(ctxDe(motor, rango, valor), id) ?? [];
      const grabadora = { ...nuevaGrabadora(), grabando: true };
      // Si un gesto sale mal escrito, `ejecutar` lo rechaza y NO lo graba: sin
      // recoger el aviso, la comparación de abajo aprobaría un botón que no hizo
      // nada porque las dos vías no habrían hecho nada las dos.
      const avisos = gestos.map((g: Gesto) => ejecutar(motor, g, grabadora)).filter((a) => a !== null);
      const mismo = huella(motor.libro) === huella(reproducir(libroDePrueba(), grabadora.gestos));
      parte.push(
        `${id}: ${gestos.length ? `${gestos.length} gesto(s)` : 'SIN GESTO'} · ${
          avisos.length ? avisos.join('; ') : 'aceptados'
        } · ${mismo ? 'mismo libro' : 'LIBRO DISTINTO'}`,
      );
    }
    expect(parte).toHaveLength(CASOS.length);
    // El renglón empieza por el id del botón, así que un fallo lo enseña con
    // nombre y no como un diff de dos libros anónimos.
    for (const linea of parte) {
      expect(linea).toContain('· aceptados · mismo libro');
      expect(linea).not.toContain('SIN GESTO');
    }
  });
});

/* ── la puerta por la que se construyen las 23 clases ───────────────────────*/

describe('cinta de hojas · los controles de una clase', () => {
  it('una clase puede encender un botón que el motor tiene apagado', () => {
    const c = ctxCon({ A1: '1' }, 'A1');
    expect(estaInerte(c, 'grafico-columnas')).toBe(true);

    const deLaClase: ControlesDeClase = {
      'grafico-columnas': {
        gesto: (x) => ({ comando: 'escribir', args: { hoja: x.hoja, celda: 'Z1', crudo: 'gráfica' } }),
      },
    };
    expect(estaInerte(c, 'grafico-columnas', deLaClase)).toBe(false);
    expect(gestosDe(c, 'grafico-columnas', deLaClase)).toEqual([
      { comando: 'escribir', args: { hoja: 'h1', celda: 'Z1', crudo: 'gráfica' } },
    ]);
  });
});
