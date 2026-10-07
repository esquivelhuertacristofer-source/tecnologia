/**
 * Alta masiva — la fabricación de correos.
 *
 * POR QUÉ SE PRUEBA ESTO Y NO EL GUION ENTERO. El guion habla con Supabase y
 * crea cuentas: probarlo de verdad exige una base de mentira o crear usuarios
 * reales, y ninguna de las dos cosas cabe en la suite. Lo que sí cabe —y es
 * donde está el daño— es la parte pura: decidir qué correo le toca a cada
 * niño. Un correo repetido significa dos niños compartiendo cuenta, y como los
 * dos ven exactamente la misma plataforma, no hay síntoma: se descubre semanas
 * después, mirando el progreso, cuando ya no se sabe qué hizo quién.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const correos = require('../../scripts/altas/correos.mjs');

const { asignarCorreos, candidatos, contrasena, partes, trozo } = correos as {
  asignarCorreos: (p: unknown[], d: string, t?: Set<string>) => { correo: string | null; motivo?: string }[];
  candidatos: (p: unknown, n?: number) => string[];
  contrasena: (azar?: () => number) => string;
  partes: (p: { nombre?: string; apellidos?: string }) => Record<string, string>;
  trozo: (s: string) => string;
};

const DOM = 'froebel.tecnia.mx';

describe('trozos de correo', () => {
  it('quita acentos y la eñe sin dejar hueco', () => {
    expect(trozo('José')).toBe('jose');
    expect(trozo('Muñoz')).toBe('munoz');
    expect(trozo('Ibáñez')).toBe('ibanez');
  });

  it('los signos de un apellido desaparecen, no se vuelven puntos', () => {
    // `sanchez.mora` partiria el correo en dos y `d'angelo` no es valido.
    expect(trozo('Sánchez-Mora')).toBe('sanchezmora');
    expect(trozo("D'Angelo")).toBe('dangelo');
  });

  it('no devuelve nada raro con la celda vacia', () => {
    expect(trozo('')).toBe('');
    expect(trozo('   ')).toBe('');
  });
});

describe('partir un nombre', () => {
  it('con las dos columnas, cada cosa en su sitio', () => {
    expect(partes({ nombre: 'Ana Sofía', apellidos: 'Pérez López' })).toMatchObject({
      pila: 'Ana', segundoNombre: 'Sofía', primerApellido: 'Pérez', segundoApellido: 'López',
    });
  });

  it('todo en una sola celda: las dos ultimas palabras son los apellidos', () => {
    // Es como llegan de verdad las listas de las escuelas.
    expect(partes({ nombre: 'Juan Carlos Hernández Ruiz' })).toMatchObject({
      pila: 'Juan', segundoNombre: 'Carlos', primerApellido: 'Hernández', segundoApellido: 'Ruiz',
    });
  });

  it('dos palabras sueltas: nombre y un apellido', () => {
    expect(partes({ nombre: 'Ana Pérez' })).toMatchObject({ pila: 'Ana', primerApellido: 'Pérez' });
  });
});

describe('la escalera de desambiguacion', () => {
  it('el primero se lleva el correo limpio', () => {
    const [a] = asignarCorreos([{ nombre: 'Ana', apellidos: 'Pérez López' }], DOM);
    expect(a.correo).toBe(`ana.perez@${DOM}`);
  });

  it('el segundo Ana Perez usa la inicial del segundo apellido, no un numero', () => {
    const r = asignarCorreos([
      { nombre: 'Ana', apellidos: 'Pérez López' },
      { nombre: 'Ana', apellidos: 'Pérez Ramírez' },
    ], DOM);
    expect(r[1].correo).toBe(`ana.perez.r@${DOM}`);
  });

  it('el numero solo aparece cuando se acabaron los escalones con significado', () => {
    // Dos Ana Perez sin segundo apellido: no hay de donde sacar una inicial.
    const r = asignarCorreos([
      { nombre: 'Ana', apellidos: 'Pérez' },
      { nombre: 'Ana', apellidos: 'Pérez' },
    ], DOM);
    expect(r[0].correo).toBe(`ana.perez@${DOM}`);
    expect(r[1].correo).toBe(`ana.perez2@${DOM}`);
  });

  it('respeta los correos que ya existen en Supabase', () => {
    const tomados = new Set([`ana.perez@${DOM}`]);
    const [a] = asignarCorreos([{ nombre: 'Ana', apellidos: 'Pérez López' }], DOM, tomados);
    expect(a.correo).not.toBe(`ana.perez@${DOM}`);
  });

  it('LO QUE IMPORTA: cuarenta homonimos y ni un correo repetido', () => {
    const gente = Array.from({ length: 40 }, () => ({ nombre: 'Ana', apellidos: 'Pérez' }));
    const r = asignarCorreos(gente, DOM);
    const unicos = new Set(r.map((x) => x.correo));
    expect(r.every((x) => x.correo !== null)).toBe(true);
    expect(unicos.size).toBe(40);
  });

  it('una fila sin nombre no inventa un correo: la marca para que la vea un humano', () => {
    const [a] = asignarCorreos([{ nombre: '', apellidos: '' }], DOM);
    expect(a.correo).toBeNull();
    expect(a.motivo).toBeTruthy();
  });

  it('todos los correos generados son direcciones validas', () => {
    const gente = [
      { nombre: 'José Ñito', apellidos: "D'Angelo Sánchez-Mora" },
      { nombre: 'María Fernanda', apellidos: 'Ibáñez Ünal' },
      { nombre: 'Luis', apellidos: 'Pérez' },
    ];
    for (const p of asignarCorreos(gente, DOM)) {
      expect(p.correo).toMatch(/^[a-z0-9]+(\.[a-z0-9]+)*@[a-z0-9.-]+$/);
    }
  });

  it('nunca genera un correo con punto doble, inicial o final', () => {
    const raros = [
      { nombre: '  Ana  ', apellidos: '  ' },
      { nombre: '...', apellidos: 'Pérez' },
      { nombre: 'Ana', apellidos: '-' },
    ];
    for (const p of asignarCorreos(raros, DOM)) {
      if (!p.correo) continue;
      const local = p.correo.split('@')[0];
      expect(local).not.toMatch(/^\.|\.\.|\.$/);
      expect(local.length).toBeGreaterThan(0);
    }
  });

  it('la lista de candidatos empieza por el correo limpio', () => {
    expect(candidatos({ nombre: 'Ana', apellidos: 'Pérez López' })[0]).toBe('ana.perez');
  });
});

describe('contrasenas', () => {
  it('no lleva ningun caracter de los que se confunden al copiarlos', () => {
    for (let i = 0; i < 200; i += 1) {
      expect(contrasena()).not.toMatch(/[0O1lI5S2Z]/);
    }
  });

  it('empieza en mayuscula y termina en digitos, para que pase cualquier politica', () => {
    expect(contrasena()).toMatch(/^[A-Z][a-z]{5}[0-9]{3}$/);
  });

  it('no son todas iguales', () => {
    const muchas = new Set(Array.from({ length: 200 }, () => contrasena()));
    expect(muchas.size).toBeGreaterThan(190);
  });
});
