/**
 * Alta masiva — comprobar releyendo, no confiar en que no hubo error.
 *
 * ESTAS PRUEBAS ESTÁN ESCRITAS DESDE UNA AVERÍA QUE YA OCURRIÓ, no desde una
 * hipótesis. En la plataforma hermana de NEM, el admin API de GoTrue insertó
 * los usuarios y aplicó el `app_metadata` **después**, así que el trigger
 * `AFTER INSERT` leyó metadata vacía: 52 cuentas recién creadas y 13 anteriores
 * quedaron sin escuela, y los 8 docentes guardados como alumno, sin poder
 * entrar a su panel.
 *
 * Ninguna de esas escrituras devolvió un error. Ese es el punto: el alta no
 * puede darse por buena porque la llamada respondiera 200. Cada caso de aquí
 * es una de las formas concretas en que aquello se vio.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const v = require('../../scripts/altas/verificacion.mjs');

type Dif = { campo: string; esperado: string; encontrado: string };
const { diferencias, veredicto, resumen } = v as {
  diferencias: (e: Record<string, unknown>, l: Record<string, unknown> | null | undefined) => Dif[];
  veredicto: (x: {
    esperado: Record<string, unknown>;
    perfilLeido: Record<string, unknown> | null;
    gruposEsperados?: string[];
    gruposLeidos?: string[];
  }) => { ok: boolean; problemas: string[] };
  resumen: (r: { ok: boolean }[]) => { total: number; correctos: number; malos: unknown[]; exito: boolean };
};

const ESCUELA = '11111111-1111-4111-8111-111111111111';
const pedido = {
  id: 'aaaa',
  role: 'teacher',
  full_name: 'Marisol Aguilar Trejo',
  email: 'marisol.aguilar@froebel.tecnia.mx',
  escuela_id: ESCUELA,
};

describe('la averia de NEM, caso por caso', () => {
  it('EL DOCENTE GUARDADO COMO ALUMNO se detecta', () => {
    // Es literalmente lo que le paso a sus ocho docentes.
    const leido = { ...pedido, role: 'student' };
    const d = diferencias(pedido, leido);
    expect(d).toHaveLength(1);
    expect(d[0]).toMatchObject({ campo: 'role', esperado: 'teacher', encontrado: 'student' });
  });

  it('EL PERFIL SIN ESCUELA se detecta, aunque todo lo demas cuadre', () => {
    const leido = { ...pedido, escuela_id: null };
    const d = diferencias(pedido, leido);
    expect(d.map((x) => x.campo)).toEqual(['escuela_id']);
    expect(d[0].encontrado).toBe('(vacio)');
  });

  it('LA FILA QUE NO EXISTE no pasa por buena', () => {
    // Un PATCH sobre una fila inexistente responde 204, igual que uno que si
    // actualizo. Sin esta comprobacion, ese caso se cuenta como exito.
    expect(diferencias(pedido, null)[0]).toMatchObject({ campo: '(la fila)' });
    expect(diferencias(pedido, undefined)).toHaveLength(1);
  });

  it('cuando todo quedo bien, no inventa problemas', () => {
    expect(diferencias(pedido, { ...pedido })).toEqual([]);
  });

  it('un uuid leido como texto no cuenta como diferencia', () => {
    // La base devuelve los uuid como cadena; comparar por tipo daria falsos.
    expect(diferencias({ escuela_id: ESCUELA }, { escuela_id: String(ESCUELA) })).toEqual([]);
  });

  it('null y undefined y cadena vacia son la misma ausencia', () => {
    expect(diferencias({ email: null }, { email: undefined })).toEqual([]);
    expect(diferencias({ email: '' }, { email: null })).toEqual([]);
  });

  it('un campo que el alta no reclama no se compara', () => {
    // `created_at` lo pone la base; no es asunto del alta.
    expect(diferencias({ role: 'teacher' }, { role: 'teacher', created_at: 'lo que sea' })).toEqual([]);
  });
});

describe('el veredicto por persona', () => {
  it('perfil bien y grupos bien: aprobado', () => {
    const r = veredicto({
      esperado: pedido, perfilLeido: { ...pedido },
      gruposEsperados: ['g1', 'g2'], gruposLeidos: ['g1', 'g2'],
    });
    expect(r.ok).toBe(true);
    expect(r.problemas).toEqual([]);
  });

  it('EL ALUMNO QUE NO QUEDO EN SU GRUPO no aprueba, aunque el perfil este perfecto', () => {
    // Este es el caso que mas cuesta ver a ojo: la cuenta existe, entra, y
    // simplemente no aparece en la lista de su maestra.
    const r = veredicto({
      esperado: pedido, perfilLeido: { ...pedido },
      gruposEsperados: ['g1', 'g2'], gruposLeidos: ['g1'],
    });
    expect(r.ok).toBe(false);
    expect(r.problemas.join(' ')).toContain('1 grupo');
  });

  it('el problema se explica con lo que se pidio y lo que quedo', () => {
    const r = veredicto({ esperado: pedido, perfilLeido: { ...pedido, role: 'student' }, gruposEsperados: [] });
    expect(r.problemas[0]).toContain('teacher');
    expect(r.problemas[0]).toContain('student');
  });

  it('un docente no necesita grupos en alumnos_grupos para aprobar', () => {
    const r = veredicto({ esperado: pedido, perfilLeido: { ...pedido } });
    expect(r.ok).toBe(true);
  });
});

describe('el resumen de la corrida', () => {
  it('LO QUE IMPORTA: una sola persona mal tumba la corrida entera', () => {
    // Un alta a medias que devuelve codigo 0 es la forma de que nadie la mire.
    const r = resumen([{ ok: true }, { ok: true }, { ok: false }]);
    expect(r.exito).toBe(false);
    expect(r.correctos).toBe(2);
    expect(r.total).toBe(3);
    expect(r.malos).toHaveLength(1);
  });

  it('con todo bien, exito', () => {
    expect(resumen([{ ok: true }, { ok: true }]).exito).toBe(true);
  });

  it('una corrida vacia no se declara fallida', () => {
    expect(resumen([]).exito).toBe(true);
  });
});
