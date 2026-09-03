/**
 * N7 · «IA I», parada 1 · `n7-como-aprende-la-ia`.
 *
 * Esta clase no se parece a `n5-la-ia-aprende-con-datos` aunque monte el mismo
 * motor, y lo que hay que medir tampoco: allí se comprueba que la máquina falla
 * con la ficha que el alumno no le enseñó; **aquí se comprueba que los números
 * de la clase son los que la clase dice**, porque toda la pedagogía se sostiene
 * en ellos:
 *
 *  · que el lote de abril tiene **cero tetrapak** y la auditoría lo canta sin
 *    entrenar nada;
 *  · que el árbol pregunta por `material` en la raíz —y por eso el punto ciego
 *    es **uno solo** y se lee del informe **antes de probar**—;
 *  · que examinar con las mismas fichas da 100 %, que el examen apartado
 *    **también** da 100 %, y que la semana real da 70 % con **una brecha de
 *    1,00**: ésa es la idea de la clase y si esos tres números cambian, la clase
 *    miente;
 *  · que el lote grande no mueve la brecha, que el de ocho fichas la anula y que
 *    el de cuarenta mal etiquetadas **empeora** el modelo.
 *
 * Se juega mal a propósito: pulsar la cabecera equivocada, señalar un grupo que
 * sí funciona, contestar la pregunta del reparto sin haber corrido las dos,
 * elegir lote sin probar ninguno, pulsar «Probar» dos veces y pulsar el botón
 * que cierra la clase dos veces seguidas.
 *
 * Y hay dos recorridos completos hasta `onComplete`: el perfecto —100 y tres
 * estrellas— y el del que falla **todos** los encargos una vez, que termina
 * igual y se queda en el piso.
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { EntradaComoAprendeLaIa } from '@/components/activities/ia/EntradaComoAprendeLaIa';
import {
  ESQUEMA,
  LOTES_REFUERZO,
  LOTE_ABRIL,
  LOTE_CAMPO,
  PARTE_DE_PRUEBA,
  PENALIZACION,
  SEMILLA_REPARTO,
  TOPE_MEMORIA,
  TOTAL_PASOS,
  contenedorReal,
} from '@/components/activities/ia/loteAcopio';
import { RUTA_N7_IA_1 } from '@/components/activities/ia/rutasIA';
import {
  brechaDe,
  entrenar,
  evaluar,
  examinar,
  informeDe,
  repartir,
} from '@/components/simuladores/aprendizaje';
import { CURRICULO } from '@/data/curriculo';

// ───────────────────────────────────────────────────────────────────────────
// El motor, sin DOM. Aquí vive la pedagogía de la clase.
// ───────────────────────────────────────────────────────────────────────────

const reparto = repartir(LOTE_ABRIL, {
  prueba: PARTE_DE_PRUEBA,
  semilla: SEMILLA_REPARTO,
  estratificar: true,
});
const modelo = entrenar(ESQUEMA, reparto.entrenamiento);
const informe = informeDe(modelo, { memoria: TOPE_MEMORIA });

describe('el conjunto de datos y lo que sale de él', () => {
  it('el lote de abril declara cuatro materiales y no trae ni un tetrapak', () => {
    const auditoria = examinar(ESQUEMA, LOTE_ABRIL);
    expect(LOTE_ABRIL).toHaveLength(28);
    expect(auditoria.porRasgo.material).toEqual({ pet: 7, aluminio: 12, carton: 9, tetrapak: 0 });
    expect(auditoria.valoresNoVistos).toEqual([{ rasgo: 'material', valor: 'tetrapak' }]);
    // Y el hueco se sabe SIN entrenar: éste es el encargo 3.
    expect(auditoria.porEtiqueta).toEqual({ reciclaje: 17, basura: 11 });
  });

  it('la regla del acopio necesita los dos rasgos: ninguno resuelve solo', () => {
    // Si `estado` bastara, el aluminio sucio iría a basura. Si bastara
    // `material`, el PET sucio iría a reciclaje. Ni una cosa ni la otra.
    expect(contenedorReal('aluminio', 'sucio')).toBe('reciclaje');
    expect(contenedorReal('pet', 'sucio')).toBe('basura');
    expect(contenedorReal('pet', 'limpio')).toBe('reciclaje');
    expect(contenedorReal('tetrapak', 'limpio')).toBe('basura');
  });

  it('la raíz pregunta por el material, y por eso el punto ciego es uno solo', () => {
    expect(modelo.raiz?.tipo).toBe('pregunta');
    if (modelo.raiz?.tipo !== 'pregunta') throw new Error('el modelo se quedó en una hoja');
    expect(modelo.raiz.rasgo).toBe('material');
    expect(modelo.raiz.sinRama).toEqual(['tetrapak']);
    // Lo que contestará al atascarse, y con qué apoyo. El encargo 6 se contesta
    // leyendo esto, sin haber probado nada todavía.
    expect(informe.ciegos).toHaveLength(1);
    expect(informe.ciegos[0]).toMatchObject({
      rasgo: 'material',
      valor: 'tetrapak',
      contestaria: 'reciclaje',
    });
  });

  it('el informe marca exactamente una regla como memoria, y el encargo 5 tiene una sola respuesta', () => {
    expect(informe.reglas).toHaveLength(5);
    expect(informe.memorizadas).toHaveLength(1);
    expect(informe.memorizadas[0].apoyo).toHaveLength(1);
    expect(informe.memorizadas[0].si).toEqual([
      { rasgo: 'material', valor: 'carton' },
      { rasgo: 'estado', valor: 'limpio' },
    ]);
  });

  it('los dos exámenes dan 100 % y los dos mienten: el apartado hereda el hueco', () => {
    const mismas = evaluar(entrenar(ESQUEMA, LOTE_ABRIL), LOTE_ABRIL);
    const apartado = evaluar(modelo, reparto.prueba);
    expect(reparto.entrenamiento).toHaveLength(22);
    expect(reparto.prueba).toHaveLength(6);
    expect(mismas.acierto).toBe(1);
    expect(apartado.acierto).toBe(1);
    // Y no es que el modelo sea bueno: es que ni el montón de estudio ni el
    // apartado tienen un solo tetrapak que preguntarle.
    expect(reparto.prueba.some((e) => e.rasgos.material === 'tetrapak')).toBe(false);
  });

  it('la semana real enseña la brecha: 70 % de total y un grupo entero al cero', () => {
    const campo = evaluar(modelo, LOTE_CAMPO);
    const brecha = brechaDe(campo, 'material');
    expect(LOTE_CAMPO).toHaveLength(20);
    expect(campo.aciertos).toBe(14);
    expect(campo.atascos).toBe(6);
    expect(brecha.diferencia).toBe(1);
    expect(brecha.peor).toMatchObject({ valor: 'tetrapak', aciertos: 0, total: 6 });
    expect(brecha.mejor?.acierto).toBe(1);
  });

  it('más datos no es mejor: el lote grande no mueve nada y el mal etiquetado empeora', () => {
    const medir = (id: string) => {
      const lote = LOTES_REFUERZO.find((l) => l.id === id);
      if (!lote) throw new Error(`no existe el lote ${id}`);
      const m = entrenar(ESQUEMA, [...reparto.entrenamiento, ...lote.fichas]);
      const ex = evaluar(m, LOTE_CAMPO);
      return { n: lote.fichas.length, aciertos: ex.aciertos, brecha: brechaDe(ex, 'material').diferencia };
    };

    // A · cuarenta fichas de lo que ya sobraba: ni un punto de diferencia.
    expect(medir('a')).toEqual({ n: 40, aciertos: 14, brecha: 1 });
    // B · ocho fichas de lo que faltaba: la brecha se cae del todo.
    expect(medir('b')).toEqual({ n: 8, aciertos: 20, brecha: 0 });
    // C · el más grande, con tetrapak dentro, y **empeora** el modelo: sus
    // etiquetas están mal. Ésa es la trampa del encargo 9.
    const c = medir('c');
    expect(c.n).toBe(40);
    expect(c.aciertos).toBeLessThan(14);
  });
});

// ───────────────────────────────────────────────────────────────────────────
// La clase, jugada
// ───────────────────────────────────────────────────────────────────────────

function montar() {
  const onProgress = jest.fn();
  const onScore = jest.fn();
  const onComplete = jest.fn();
  const utils = render(
    <EntradaComoAprendeLaIa
      config={{}}
      onProgress={onProgress}
      onScore={onScore}
      onComplete={onComplete}
    />,
  );
  return { ...utils, onProgress, onScore, onComplete };
}

function abrirLaboratorio() {
  const utils = montar();
  fireEvent.click(screen.getByRole('button', { name: /Abre Tecnia Entrena/ }));
  fireEvent.click(screen.getByTestId('tia-empezar'));
  return utils;
}

const pulsar = (testId: string) => fireEvent.click(screen.getByTestId(testId));

/** El botón de la regla que el informe marca como memoria, buscado por la marca. */
function reglaMemorizada(): HTMLElement {
  const marca = document.querySelector('.cai-regla-apoyo.es-memoria');
  if (!marca) throw new Error('ninguna regla salió marcada como memoria');
  const boton = marca.closest('button');
  if (!boton) throw new Error('la marca de memoria no está dentro de un botón');
  return boton;
}

/** Cualquier regla que el informe NO marque como memoria: se busca, no se supone. */
function reglaCualquiera(): HTMLElement {
  const botones = Array.from(document.querySelectorAll<HTMLElement>('.cai-regla'));
  const otra = botones.find((b) => !b.querySelector('.es-memoria'));
  if (!otra) throw new Error('todas las reglas salieron marcadas como memoria');
  return otra;
}

/** Un recorrido limpio de los nueve encargos, en orden. */
function jugarBien() {
  pulsar('cai-col-contenedor');
  pulsar('cai-autor-persona');
  pulsar('cai-barra-tetrapak');
  pulsar('cai-correr-mismas');
  pulsar('cai-correr-apartado');
  pulsar('cai-lectura-parecida');
  fireEvent.click(reglaMemorizada());
  pulsar('cai-pronostico-contestara');
  pulsar('cai-grupo-tetrapak');
  pulsar('cai-causa-proveedor');
  pulsar('cai-probar-a');
  pulsar('cai-probar-b');
  pulsar('cai-probar-c');
  pulsar('cai-elegir-b');
}

describe('el recorrido', () => {
  it('la entrada dice lo que dice el currículo, y la ruta no miente', () => {
    const nivel = CURRICULO.find((n) => n.n === 7);
    expect(nivel?.edad).toBe('12–13');
    const unidad = nivel?.unidades.find((u) => u.id === 'n7-ia-1');
    expect(unidad?.eje).toBe('datos-ia');
    expect(RUTA_N7_IA_1.map((p) => p.id)).toEqual(unidad?.actividades.map((a) => a.id));
    expect(RUTA_N7_IA_1.map((p) => p.titulo)).toEqual(unidad?.actividades.map((a) => a.titulo));
  });

  it('la portada de objetivos aparece antes que el laboratorio', () => {
    montar();
    fireEvent.click(screen.getByRole('button', { name: /Abre Tecnia Entrena/ }));
    const portada = screen.getByTestId('tia-portada');
    expect(within(portada).getByText('¿Cómo aprende una IA?')).toBeInTheDocument();
    // El objetivo y los pasos, que es lo que la hace obligatoria.
    expect(within(portada).getByText(/Auditar un conjunto de datos de entrenamiento/)).toBeInTheDocument();
    expect(within(portada).getByText(/Responsable de datos/)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('tia-empezar'));
    expect(screen.queryByTestId('tia-portada')).not.toBeInTheDocument();
  });

  it('una partida perfecta termina con 100, tres estrellas y cero errores', () => {
    const { onComplete, onScore, onProgress } = abrirLaboratorio();
    jugarBien();

    expect(onComplete).toHaveBeenCalledTimes(1);
    const resultado = onComplete.mock.calls[0][0];
    expect(resultado.score).toBe(100);
    expect(resultado.stars).toBe(3);
    expect(resultado.errores).toBe(0);
    // El único parámetro de `terminar()` es el tiempo, y sale del reloj de la
    // sesión: un número inventado ahí publica una mentira al contrato.
    expect(resultado.tiempoSegundos).toBeGreaterThanOrEqual(0);
    expect(resultado.tiempoSegundos).toBeLessThan(600);
    expect(onScore).toHaveBeenLastCalledWith(100);
    expect(onProgress).toHaveBeenLastCalledWith(1);
    expect(screen.getByText(/Responsable de datos/)).toBeInTheDocument();
  });

  it('el botón que cierra la clase sigue en pantalla, y pulsarlo dos veces no la cierra dos veces', () => {
    const { onComplete } = abrirLaboratorio();
    jugarBien();
    expect(onComplete).toHaveBeenCalledTimes(1);

    // Sigue montado: el cierre se pinta ENCIMA, no en lugar de. Sin la guarda
    // de `resueltos`, este clic avanzaría un décimo paso y cerraría otra vez.
    const elegir = screen.getByTestId('cai-elegir-b');
    expect(elegir).toBeInTheDocument();
    fireEvent.click(elegir);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('se puede terminar habiendo fallado los nueve encargos, y el puntaje cae al piso', () => {
    const { onComplete, onScore } = abrirLaboratorio();

    pulsar('cai-col-material');
    expect(onScore).toHaveBeenLastCalledWith(100 - PENALIZACION);
    pulsar('cai-col-contenedor');

    pulsar('cai-autor-camara');
    pulsar('cai-autor-persona');

    pulsar('cai-barra-aluminio');
    pulsar('cai-barra-tetrapak');

    pulsar('cai-correr-mismas');
    pulsar('cai-correr-apartado');
    pulsar('cai-lectura-mundo');
    pulsar('cai-lectura-parecida');

    // Una regla que el informe no marca como memoria.
    fireEvent.click(reglaCualquiera());
    fireEvent.click(reglaMemorizada());

    pulsar('cai-pronostico-callara');
    pulsar('cai-pronostico-contestara');

    pulsar('cai-grupo-aluminio');
    pulsar('cai-grupo-tetrapak');

    pulsar('cai-causa-regla');
    pulsar('cai-causa-proveedor');

    pulsar('cai-probar-a');
    pulsar('cai-probar-b');
    pulsar('cai-probar-c');
    pulsar('cai-elegir-a');
    pulsar('cai-elegir-b');

    expect(onComplete).toHaveBeenCalledTimes(1);
    const resultado = onComplete.mock.calls[0][0];
    expect(resultado.errores).toBe(TOTAL_PASOS);
    // 9 errores × 6 = 54, y el piso de la casa es 60.
    expect(resultado.score).toBe(60);
  });
});

describe('jugar mal a propósito', () => {
  it('la pregunta del reparto no existe hasta que las dos corridas están anotadas', () => {
    abrirLaboratorio();
    pulsar('cai-col-contenedor');
    pulsar('cai-autor-persona');
    pulsar('cai-barra-tetrapak');

    expect(screen.queryByTestId('cai-lecturas')).not.toBeInTheDocument();
    pulsar('cai-correr-mismas');
    expect(screen.queryByTestId('cai-lecturas')).not.toBeInTheDocument();
    pulsar('cai-correr-apartado');
    expect(screen.getByTestId('cai-lecturas')).toBeInTheDocument();
  });

  it('no se puede elegir lote sin haber probado los tres', () => {
    abrirLaboratorio();
    pulsar('cai-col-contenedor');
    pulsar('cai-autor-persona');
    pulsar('cai-barra-tetrapak');
    pulsar('cai-correr-mismas');
    pulsar('cai-correr-apartado');
    pulsar('cai-lectura-parecida');
    fireEvent.click(reglaMemorizada());
    pulsar('cai-pronostico-contestara');
    pulsar('cai-grupo-tetrapak');
    pulsar('cai-causa-proveedor');

    expect(screen.getByTestId('cai-elegir-b')).toBeDisabled();
    pulsar('cai-probar-a');
    pulsar('cai-probar-b');
    expect(screen.getByTestId('cai-elegir-b')).toBeDisabled();
    pulsar('cai-probar-c');
    expect(screen.getByTestId('cai-elegir-b')).toBeEnabled();
  });

  it('la bitácora sólo crece: lo medido en el encargo 4 sigue escrito en el 9', () => {
    abrirLaboratorio();
    pulsar('cai-col-contenedor');
    pulsar('cai-autor-persona');
    pulsar('cai-barra-tetrapak');
    pulsar('cai-correr-mismas');
    pulsar('cai-correr-apartado');
    const bitacora = () => document.querySelector('.cai-bitacora') as HTMLElement;
    expect(document.querySelectorAll('.cai-corrida')).toHaveLength(2);
    // Las dos corridas dan 100 %, y las dos quedan escritas con su cifra: eso
    // es lo que el encargo 4 pregunta y lo que el 9 tiene que seguir viendo.
    expect(within(bitacora()).getByText(/Examinar con las mismas 28 fichas/)).toBeInTheDocument();
    expect(within(bitacora()).getByText(/examinar con 6 apartadas/)).toBeInTheDocument();
    expect(within(bitacora()).getAllByText('100 %')).toHaveLength(2);

    pulsar('cai-lectura-parecida');
    fireEvent.click(reglaMemorizada());
    pulsar('cai-pronostico-contestara');
    pulsar('cai-grupo-tetrapak');
    pulsar('cai-causa-proveedor');

    // Cinco encargos después, las dos corridas siguen ahí con su cifra. Ningún
    // encargo posterior deshace un predicado anterior.
    expect(document.querySelectorAll('.cai-corrida')).toHaveLength(2);
    expect(within(bitacora()).getByText(/Examinar con las mismas 28 fichas/)).toBeInTheDocument();
    pulsar('cai-probar-a');
    pulsar('cai-probar-b');
    pulsar('cai-probar-c');
    expect(document.querySelectorAll('.cai-corrida')).toHaveLength(5);
  });

  it('probar un lote dos veces no lo anota dos veces', () => {
    abrirLaboratorio();
    pulsar('cai-col-contenedor');
    pulsar('cai-autor-persona');
    pulsar('cai-barra-tetrapak');
    pulsar('cai-correr-mismas');
    pulsar('cai-correr-apartado');
    pulsar('cai-lectura-parecida');
    fireEvent.click(reglaMemorizada());
    pulsar('cai-pronostico-contestara');
    pulsar('cai-grupo-tetrapak');
    pulsar('cai-causa-proveedor');

    // Dos corridas del encargo 4 más la del lote A: tres.
    pulsar('cai-probar-a');
    expect(document.querySelectorAll('.cai-corrida')).toHaveLength(3);
    const boton = screen.getByTestId('cai-probar-a');
    expect(boton).toBeDisabled();
    fireEvent.click(boton);
    fireEvent.click(boton);
    expect(document.querySelectorAll('.cai-corrida')).toHaveLength(3);
  });

  it('el cero del recuento se puede pulsar: un hueco que no se ve no se puede señalar', () => {
    abrirLaboratorio();
    pulsar('cai-col-contenedor');
    pulsar('cai-autor-persona');
    const hueco = screen.getByTestId('cai-barra-tetrapak');
    expect(hueco).toBeEnabled();
    expect(hueco.className).toContain('es-hueco');
    expect(hueco).toHaveTextContent('0');
  });

  it('la salida está siempre disponible y devuelve a la entrada', () => {
    abrirLaboratorio();
    expect(screen.queryByRole('button', { name: /Abre Tecnia Entrena/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Salir' }));
    expect(screen.getByRole('button', { name: /Abre Tecnia Entrena/ })).toBeInTheDocument();
  });
});
