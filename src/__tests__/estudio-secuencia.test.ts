/**
 * Estudio de impacto — en qué orden se aplican los cuestionarios.
 *
 * Es lo que decide lo que ve un alumno el día que entra. Equivocarlo no rompe
 * ninguna pantalla: sencillamente se mide otra cosa, o no se mide nada, y no
 * hay forma de darse cuenta hasta que alguien pide los datos.
 */

import { lectorConMemoria, siguienteCuestionario } from '@/lib/estudio/cuestionario/secuencia';
import type { CuestionarioId } from '@/lib/estudio/config';
import type { AvanceCuestionario } from '@/lib/estudio/cuestionario/tipos';

/** Un lector de avances falso: se le dice cuáles están terminados. */
function lector(terminados: CuestionarioId[]) {
  return (id: CuestionarioId): AvanceCuestionario | null =>
    terminados.includes(id)
      ? ({ completado: true, respuestas: [] } as unknown as AvanceCuestionario)
      : null;
}

const nada = lector([]);

describe('sin participación no se aplica NADA', () => {
  it('con la escuela apagada, no toca ningún cuestionario', () => {
    expect(siguienteCuestionario({ participa: false, salidaAbierta: false }, nada)).toBeNull();
  });

  it('ni siquiera con la ventana de salida abierta', () => {
    // Una ventana abierta en una escuela apagada no puede colar un cuestionario.
    expect(siguienteCuestionario({ participa: false, salidaAbierta: true }, nada)).toBeNull();
  });
});

describe('la entrada', () => {
  it('es lo primero que toca en una escuela participante', () => {
    expect(siguienteCuestionario({ participa: true, salidaAbierta: false }, nada)).toBe('entrada');
  });

  it('después de la entrada va su escala de actitud', () => {
    expect(
      siguienteCuestionario({ participa: true, salidaAbierta: false }, lector(['entrada'])),
    ).toBe('actitud_entrada');
  });

  it('con las dos contestadas, no toca nada más', () => {
    expect(
      siguienteCuestionario(
        { participa: true, salidaAbierta: false },
        lector(['entrada', 'actitud_entrada']),
      ),
    ).toBeNull();
  });
});

describe('la salida manda cuando su ventana está abierta', () => {
  it('se aplica antes que la entrada, porque es el dato que caduca', () => {
    // La ventana de salida dura unos días y se cierra para siempre; la entrada,
    // si el alumno no la contestó, se le puede seguir aplicando.
    expect(siguienteCuestionario({ participa: true, salidaAbierta: true }, nada)).toBe('salida');
  });

  it('después de la salida va su escala de actitud', () => {
    expect(
      siguienteCuestionario({ participa: true, salidaAbierta: true }, lector(['salida'])),
    ).toBe('actitud_salida');
  });

  it('terminada la salida, si faltaba la entrada, se le aplica', () => {
    expect(
      siguienteCuestionario(
        { participa: true, salidaAbierta: true },
        lector(['salida', 'actitud_salida']),
      ),
    ).toBe('entrada');
  });

  it('con la ventana cerrada, la salida no se aplica aunque falte', () => {
    expect(
      siguienteCuestionario(
        { participa: true, salidaAbierta: false },
        lector(['entrada', 'actitud_entrada']),
      ),
    ).toBeNull();
  });
});

describe('la actitud se aplica aunque el de conocimiento venga de otra sesión', () => {
  it('un alumno que ya contestó la entrada hace tiempo recibe su escala', () => {
    expect(
      siguienteCuestionario({ participa: true, salidaAbierta: false }, lector(['entrada'])),
    ).toBe('actitud_entrada');
  });
});

describe('todo contestado', () => {
  it('con los cuatro terminados, la puerta no se abre nunca', () => {
    expect(
      siguienteCuestionario(
        { participa: true, salidaAbierta: true },
        lector(['entrada', 'actitud_entrada', 'salida', 'actitud_salida']),
      ),
    ).toBeNull();
  });
});

/*
 * EL ALUMNO ENCERRADO EN EL CUESTIONARIO.
 *
 * Todo lo de arriba supone que el almacén se acuerda de lo contestado. En un
 * equipo con `localStorage` bloqueado no se acuerda de nada, y entonces el
 * alumno que termina pulsa «Continuar», la puerta pregunta qué toca, el lector
 * responde «nada contestado» y le devuelve EL MISMO cuestionario. Como el
 * valor no cambia, React ni siquiera vuelve a pintar: el botón deja de hacer
 * nada. La medición acaba bloqueando al alumno, que es lo único que el encargo
 * prohíbe sin matices.
 *
 * Estas pruebas están escritas desde ese equipo roto: `nada` es un almacén que
 * SIEMPRE dice que no hay nada guardado.
 */
describe('con el almacenamiento roto, el alumno igual sale', () => {
  const puerta = { participa: true, salidaAbierta: false };

  it('sin memoria, el mismo cuestionario vuelve una y otra vez', () => {
    // La avería, escrita tal cual: esto es lo que pasaba antes del arreglo.
    expect(siguienteCuestionario(puerta, nada)).toBe('entrada');
    expect(siguienteCuestionario(puerta, nada)).toBe('entrada');
  });

  it('lo terminado en esta sesión cuenta aunque no se haya podido guardar', () => {
    const hechos = new Set<CuestionarioId>(['entrada']);
    expect(siguienteCuestionario(puerta, lectorConMemoria(nada, hechos))).toBe('actitud_entrada');
  });

  it('al terminar los dos, la puerta se cierra y el alumno entra a la plataforma', () => {
    const hechos = new Set<CuestionarioId>(['entrada', 'actitud_entrada']);
    expect(siguienteCuestionario(puerta, lectorConMemoria(nada, hechos))).toBeNull();
  });

  it('la sesión entera, paso a paso, sin que el almacén guarde ni una vez', () => {
    const hechos = new Set<CuestionarioId>();
    const visto: (CuestionarioId | null)[] = [];

    // El bucle del alumno: mira qué toca, lo contesta, vuelve a mirar. Si el
    // arreglo no estuviera, esto no terminaría nunca — de ahí el tope.
    for (let vuelta = 0; vuelta < 10; vuelta += 1) {
      const toca = siguienteCuestionario(puerta, lectorConMemoria(nada, hechos));
      visto.push(toca);
      if (!toca) break;
      hechos.add(toca);
    }

    expect(visto).toEqual(['entrada', 'actitud_entrada', null]);
  });

  it('un cuestionario que ni siquiera se pudo empezar no atrapa al alumno', () => {
    // `Cuestionario` llama a `onTerminar` también cuando `iniciar()` falla, y
    // la puerta lo apunta igual: si no, ese fallo sería otra jaula.
    const hechos = new Set<CuestionarioId>(['entrada']);
    expect(siguienteCuestionario(puerta, lectorConMemoria(nada, hechos))).not.toBe('entrada');
  });

  it('la memoria no se inventa nada: lo que no se terminó, sigue tocando', () => {
    const hechos = new Set<CuestionarioId>(['actitud_entrada']);
    expect(siguienteCuestionario(puerta, lectorConMemoria(nada, hechos))).toBe('entrada');
  });

  it('con la escuela apagada, la memoria tampoco abre ninguna puerta', () => {
    const hechos = new Set<CuestionarioId>(['entrada']);
    expect(
      siguienteCuestionario({ participa: false, salidaAbierta: false }, lectorConMemoria(nada, hechos)),
    ).toBeNull();
  });

  it('con la ventana de salida abierta, el mismo bucle recorre los cuatro', () => {
    const abierta = { participa: true, salidaAbierta: true };
    const hechos = new Set<CuestionarioId>();
    const visto: (CuestionarioId | null)[] = [];

    for (let vuelta = 0; vuelta < 10; vuelta += 1) {
      const toca = siguienteCuestionario(abierta, lectorConMemoria(nada, hechos));
      visto.push(toca);
      if (!toca) break;
      hechos.add(toca);
    }

    expect(visto).toEqual(['salida', 'actitud_salida', 'entrada', 'actitud_entrada', null]);
  });
});
