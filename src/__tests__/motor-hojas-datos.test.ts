/**
 * Tecnia Hojas · el dato sucio: importar (bloque 43), quitar duplicados y
 * relleno rápido (bloque 44). `datos.ts` estaba escrito y probado por nadie
 * —cero imports—; esta es la primera vez que se ejecuta.
 *
 * Se prueba jugando MAL a propósito: un csv con una comilla sin cerrar, quitar
 * duplicados donde no hay ninguno, un ejemplo de relleno rápido que no casa
 * con nada. En los tres casos el motor tiene que RECHAZAR o no hacer nada —
 * nunca inventar.
 */

import { detectarSeparador, leerCsv, pareceNumero, filasQueQuedan, deducirPatron } from '@/components/office/motor-hojas/datos';
import { cajaDeTexto, ejecutar, revisar, type Caja, type Gesto } from '@/components/office/motor-hojas/comandos';
import { crearMotor, type Motor } from '@/components/office/motor-hojas/formula/calculo';
import type { Celda, Libro } from '@/components/office/motor-hojas/modelo';

/* ── utilidades, calcadas de motor-hojas.test.ts ────────────────────────────*/

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

const motorCon = (celdas: Record<string, string | Celda>): Motor => crearMotor(libroCon(celdas), CONTEXTO);
const caja = (texto: string): Caja => cajaDeTexto(texto) as Caja;

/* ── el bloque 43 · leer un .csv ─────────────────────────────────────────────*/

describe('leerCsv y su detección de separador', () => {
  it('sin ambigüedad, detecta la coma', () => {
    expect(detectarSeparador('Nombre,Precio\nCuaderno,25\nLapiz,8.5')).toBe(',');
  });

  it('con un separador de miles sin comillas, gana el punto y coma y no la coma', () => {
    // La trampa del propio archivo: contar comas a secas elegiría la coma, y
    // aquí hay MÁS comas que puntos y coma. Ganar por constancia, no por conteo.
    const texto = 'Producto;Importe\nEscritorio;"1,250"\nSilla;300';
    expect(detectarSeparador(texto)).toBe(';');
  });

  it('importa filas y columnas tal cual, con el separador que detectó', () => {
    const { celdas, parte } = leerCsv('Nombre,Precio\nCuaderno,25\nLapiz,8.5');
    expect(parte.separador).toBe(',');
    expect(parte.filas).toBe(3);
    expect(parte.columnas).toBe(2);
    expect(celdas).toEqual([
      ['Nombre', 'Precio'],
      ['Cuaderno', '25'],
      ['Lapiz', '8.5'],
    ]);
  });

  it('marca la columna que quedó texto pareciendo número, con un ejemplo real', () => {
    const { parte } = leerCsv('Codigo,Nombre\n007,Ana\n008,Beto');
    expect(parte.columnasDeTextoQuePareceNumero).toEqual([0]);
    expect(parte.ejemplos).toEqual(['007']);
  });

  it('cuenta las filas que no traen el mismo número de campos que las demás', () => {
    // Forzado a coma para poder ver la trampa clásica: «1,250» sin comillas
    // parte la fila en dos campos de más.
    const { parte } = leerCsv('Producto,Importe\nEscritorio,1,250\nSilla,300', ',');
    expect(parte.columnas).toBe(3);
    expect(parte.filasDesparejas).toBe(2);
  });

  it('una comilla que nunca se cierra se traga el resto del archivo, y lo dice', () => {
    const { parte } = leerCsv('Nombre,Nota\n"Ana,10', ',');
    expect(parte.comillaSinCerrar).toBe(true);
  });

  it('pareceNumero: 007, (1,250) y $45.00 parecen número y son texto; «Casa 5» no lo parece', () => {
    expect(pareceNumero('007')).toBe(true);
    expect(pareceNumero('(1,250)')).toBe(true);
    expect(pareceNumero('$45.00')).toBe(true);
    expect(pareceNumero('Casa 5')).toBe(false);
    expect(pareceNumero('Ana')).toBe(false);
    expect(pareceNumero('')).toBe(false);
  });
});

/* ── el bloque 44 · quitar duplicados y relleno rápido, en frío ─────────────*/

describe('filasQueQuedan · la decisión del bloque 44', () => {
  it('sin ningún duplicado, no quita nada', () => {
    const libro = libroCon({ A1: 'Nombre', A2: 'Ana', A3: 'Beto', A4: 'Caro' });
    const { cuenta, quedan } = filasQueQuedan(libro, 'h1', caja('A1:A4'), [0], true);
    expect(cuenta.duplicadas).toBe(0);
    expect(quedan).toEqual([1, 2, 3]);
  });

  it('«ANA», «Ana » y «ana» son TRES filas distintas: se compara tal cual está escrito', () => {
    const libro = libroCon({ A1: 'Nombre', A2: 'ANA', A3: 'Ana ', A4: 'ana', A5: 'ANA' });
    const { cuenta, quedan } = filasQueQuedan(libro, 'h1', caja('A1:A5'), [0], true);
    expect(quedan).toEqual([1, 2, 3]); // sólo la SEGUNDA «ANA» (fila 5) es duplicada
    expect(cuenta.duplicadas).toBe(1);
  });
});

describe('deducirPatron · el relleno rápido de un solo ejemplo', () => {
  it('el caso que se enseña: «GARCÍA LÓPEZ, ANA» → «Ana García López»', () => {
    const patron = deducirPatron('GARCÍA LÓPEZ, ANA', 'Ana García López');
    expect(patron).not.toBeNull();
    expect(patron?.aplicar('PÉREZ GÓMEZ, LUIS')).toBe('Luis Pérez Gómez');
  });

  it('un ejemplo que no casa con nada no se adivina: se dice que no', () => {
    expect(deducirPatron('García López, Ana', '1234567890')).toBeNull();
  });

  it('no deduce quitar acentos: «GARCÍA» no lleva a «garcia»', () => {
    expect(deducirPatron('GARCÍA', 'garcia')).toBeNull();
  });
});

/* ── los tres comandos, ya con el libro delante ─────────────────────────────*/

describe('comando importar-csv', () => {
  it('escribe la tabla a partir de la celda ancla, fila por fila y columna por columna', () => {
    const motor = motorCon({});
    const texto = 'Producto,Precio\nCuaderno,25\nLapiz,8.5';
    const gesto: Gesto = { comando: 'importar-csv', args: { hoja: 'h1', celda: 'B2', texto } };
    expect(revisar(motor.libro, gesto)).toBeNull();
    expect(ejecutar(motor, gesto)).toBeNull();
    const h = motor.libro.hojas[0];
    expect(h.celdas.B2.crudo).toBe('Producto');
    expect(h.celdas.C2.crudo).toBe('Precio');
    expect(h.celdas.B3.crudo).toBe('Cuaderno');
    expect(h.celdas.C4.crudo).toBe('8.5');
  });

  it('un csv con una comilla sin cerrar se rechaza, y el libro no cambia', () => {
    const motor = motorCon({});
    const gesto: Gesto = {
      comando: 'importar-csv',
      args: { hoja: 'h1', celda: 'A1', texto: 'Nombre,Nota\n"Ana,10' },
    };
    expect(revisar(motor.libro, gesto)).toMatch(/comilla que nunca se cierra/);
    const antes = motor.libro;
    expect(ejecutar(motor, gesto)).not.toBeNull();
    expect(motor.libro).toBe(antes);
  });
});

describe('comando quitar-duplicados', () => {
  it('avisa cuántas se van a quitar, y sólo compacta la tabla al confirmar', () => {
    const motor = motorCon({ A1: 'Nombre', A2: 'Ana', A3: 'Beto', A4: 'Ana', A5: 'Caro' });
    const gesto: Gesto = { comando: 'quitar-duplicados', args: { hoja: 'h1', rango: 'A1:A5' } };
    expect(revisar(motor.libro, gesto)).toMatch(/se van a quitar 1 fila duplicada/);

    const antes = motor.libro;
    expect(ejecutar(motor, gesto)).not.toBeNull(); // sin confirmar, se rechaza
    expect(motor.libro).toBe(antes);

    ejecutar(motor, { ...gesto, args: { ...gesto.args, confirmado: 1 } });
    const h = motor.libro.hojas[0];
    expect(h.celdas.A1.crudo).toBe('Nombre');
    expect(h.celdas.A2.crudo).toBe('Ana');
    expect(h.celdas.A3.crudo).toBe('Beto');
    expect(h.celdas.A4.crudo).toBe('Caro'); // compactada: la «Ana» repetida se fue
    expect(h.celdas.A5).toBeUndefined();
  });

  it('donde no hay ningún duplicado, no avisa y no ensucia el libro', () => {
    const motor = motorCon({ A1: 'Nombre', A2: 'Ana', A3: 'Beto', A4: 'Caro' });
    const gesto: Gesto = { comando: 'quitar-duplicados', args: { hoja: 'h1', rango: 'A1:A4' } };
    expect(revisar(motor.libro, gesto)).toBeNull();
    const antes = motor.libro;
    ejecutar(motor, gesto);
    expect(motor.libro).toBe(antes); // nada que compactar: el mismo objeto
  });
});

describe('comando relleno-rapido', () => {
  it('aplica el patrón del ejemplo a toda la columna de destino', () => {
    const motor = motorCon({
      B1: 'GARCÍA LÓPEZ, ANA',
      C1: 'Ana García López',
      B2: 'PÉREZ GÓMEZ, LUIS',
      B3: 'RUIZ TORRES, SOL',
    });
    const gesto: Gesto = { comando: 'relleno-rapido', args: { hoja: 'h1', origen: 'B1:B3', destino: 'C1:C3' } };
    expect(revisar(motor.libro, gesto)).toBeNull();
    expect(ejecutar(motor, gesto)).toBeNull();
    const h = motor.libro.hojas[0];
    expect(h.celdas.C2.crudo).toBe('Luis Pérez Gómez');
    expect(h.celdas.C3.crudo).toBe('Sol Ruiz Torres');
  });

  it('un ejemplo que no casa con nada se rechaza, y el libro no cambia', () => {
    const motor = motorCon({ B1: 'GARCÍA LÓPEZ, ANA', C1: '1234567890', B2: 'PÉREZ GÓMEZ, LUIS' });
    const gesto: Gesto = { comando: 'relleno-rapido', args: { hoja: 'h1', origen: 'B1:B2', destino: 'C1:C2' } };
    expect(revisar(motor.libro, gesto)).toMatch(/no se pudo adivinar un patrón/);
    const antes = motor.libro;
    expect(ejecutar(motor, gesto)).not.toBeNull();
    expect(motor.libro).toBe(antes);
  });
});
