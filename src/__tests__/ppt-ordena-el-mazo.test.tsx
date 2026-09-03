/**
 * `of-ppt-ordena-el-mazo` · «Cuando se hace larga» (doc §44.1), jugada entera
 * desde la portada de objetivos hasta la pantalla de cierre.
 *
 * Es la clase de la sala con más superficie para romperse por el sitio que
 * ninguna prueba unitaria pisa: **cuatro de sus ocho encargos son de tipo
 * `documento` y los cuatro miran el MISMO mazo de dieciocho**. Reordenar para
 * juntar las del museo puede sacar la portada de su sitio; crear secciones
 * puede correr los índices que el encargo anterior dejó buenos; y plegar un
 * tramo esconde miniaturas, o sea que el encargo siguiente puede quedarse sin
 * el botón que necesita. Nada de eso lo ve `motor-diapos.test.ts`, que
 * comprueba los predicados contra mazos fabricados a mano.
 *
 * El recorrido va por el `Lab` y no por la ventana: el `Lab` es quien
 * califica, y una partida perfecta que saca 88 sólo se ve desde aquí.
 */

import { LabOrdenaElMazo } from '@/components/activities/office/powerpoint/ordena-el-mazo/Lab';
import {
  avisos,
  celebrar,
  cuenta,
  elegirLa,
  encargo,
  escribirEnCampo,
  hayInsignia,
  irAPestana,
  irADiapositiva,
  jugarDesdeLaPortada,
  llevarMini,
  pulsar,
  pulsarPorAtributo,
  pulsarRotulo,
  salirDelRepaso,
  salirPorLaCruz,
  salirPorLaInsignia,
  seTermino,
} from './ayuda-ppt';

/* ── los ocho encargos, cada uno como lo haría el alumno ────────────────────*/

const abrirElClasificador = () => pulsar('vista-clasificador');

/**
 * La portada llegó en TERCER lugar, así que sube dos puestos.
 *
 * Con `llevarMini` y no arrastrando: el arrastre pregunta por
 * `getBoundingClientRect` y en jsdom todo mide cero. Ctrl+flecha es el otro
 * gesto que la ventana ata para lo mismo (ayuda-ppt).
 */
const laPortadaPrimero = () => llevarMini(2, 0);

/**
 * Las tres del museo, juntas.
 *
 * Después de subir la portada quedan repartidas en los puestos 2 («La sala de
 * los dinosaurios»), 5 («El museo por dentro») y 7 («Lo que más nos gustó»).
 * Bajar la primera hasta el 5 y subir la última al 6 las deja seguidas en
 * 4-5-6, que es lo único que el encargo pide: no exige un sitio concreto.
 */
const juntarLasDelMuseo = () => {
  llevarMini(2, 5);
  llevarMini(7, 6);
};

/** «Lo que costó por alumno» queda en el puesto 3 tras las dos movidas. */
const esconderLosPrecios = () => {
  irADiapositiva(3);
  irAPestana('presentacion');
  pulsar('ocultar');
};

const queLePaso = () => elegirLa(1);

/** Abre el cuadro de sección estando en `donde` y la bautiza. */
function crearSeccion(donde: number, nombre: string) {
  irADiapositiva(donde);
  pulsar('seccion');
  escribirEnCampo('nombre-seccion', nombre);
  pulsarRotulo('Crear sección');
}

const partirlaEnTramos = () => {
  irAPestana('inicio');
  crearSeccion(0, 'El viaje');
  crearSeccion(4, 'El museo');
  crearSeccion(8, 'El cierre');
};

/** El ▾ del primer tramo. En el Clasificador la tira no se pinta, así que
 *  no hay dos etiquetas con el mismo `data-seccion` compitiendo. */
const plegarUna = () => pulsarPorAtributo('data-seccion', '0');

const pasarlaDeCorrido = () => pulsar('vista-lectura');

const PASOS: Array<() => void> = [
  abrirElClasificador,
  laPortadaPrimero,
  juntarLasDelMuseo,
  esconderLosPrecios,
  queLePaso,
  partirlaEnTramos,
  plegarUna,
  pasarlaDeCorrido,
];

async function hastaEl(n: number) {
  for (let i = 0; i < n; i += 1) {
    PASOS[i]();
    await celebrar();
  }
}

/* ── el recorrido completo ──────────────────────────────────────────────────*/

describe('of-ppt-ordena-el-mazo de punta a punta', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('la clase entera se termina y saca nota perfecta', async () => {
    const partida = await jugarDesdeLaPortada(LabOrdenaElMazo);

    await hastaEl(8);

    expect(seTermino()).toBe(true);
    expect(cuenta()).toBe('8 de 8');
    expect(partida.nota()).toMatchObject({ score: 100, stars: 3, errores: 0 });
    partida.desmontar();
  });

  it('al terminar sale la insignia y el botón de salir llama al anfitrión', async () => {
    const alSalir = jest.fn();
    const partida = await jugarDesdeLaPortada(LabOrdenaElMazo, { alSalir });

    await hastaEl(8);

    /*
     * El último encargo es la vista de Lectura, así que la clase termina
     * **desde dentro del repaso**: taparle al alumno con una medalla la
     * presentación que está pasando sería el programa interrumpiéndose a sí
     * mismo. La insignia sale al cerrar la lectura, que es lo que el alumno
     * hace de todas formas. Mismo criterio que §27.1.
     */
    expect(hayInsignia()).toBe(false);
    salirDelRepaso();
    expect(hayInsignia()).toBe(true);
    salirPorLaInsignia();
    expect(alSalir).toHaveBeenCalledTimes(1);
    partida.desmontar();
  });
});

/* ── jugando mal ────────────────────────────────────────────────────────────*/

describe('of-ppt-ordena-el-mazo, jugando mal a propósito', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
  afterEach(() => jest.useRealTimers());

  it('borrar la de los precios está apagado y con motivo, y salir a media clase no revienta', async () => {
    const alSalir = jest.fn();
    const partida = await jugarDesdeLaPortada(LabOrdenaElMazo, { alSalir });
    await hastaEl(3);
    expect(encargo()).toBe('Ésta hoy no toca');

    // JUGAR MAL · el encargo dice «no la borres, escóndela», así que lo primero
    // que hay que probar es borrarla. Si Quitar se la llevara, el predicado
    // buscaría por título una diapositiva que ya no existe y la clase se
    // quedaría sin salida — el callejón de §42.1, §43.2 y §43.6.
    irADiapositiva(3);
    irAPestana('inicio');
    pulsar('quitar');
    await celebrar();
    expect(avisos()).toContain('junta de padres');
    expect(encargo()).toBe('Ésta hoy no toca');

    // Y esconder OTRA no cierra el encargo: el predicado pregunta por ésa.
    irADiapositiva(2);
    irAPestana('presentacion');
    pulsar('ocultar');
    await celebrar();
    expect(encargo()).toBe('Ésta hoy no toca');

    // Se deshace el estropicio y se hace lo que pedía.
    pulsar('ocultar');
    esconderLosPrecios();
    await celebrar();
    expect(encargo()).toBe('Entonces, ¿qué le pasó?');

    // Y ahora el otro camino que ninguna prueba unitaria pisa: irse por la ✕ con
    // el cuadro de «Nueva sección» abierto y a medio escribir. Hay que volver a
    // Inicio, que el encargo anterior dejó la cinta en Presentación.
    queLePaso();
    await celebrar();
    irAPestana('inicio');
    pulsar('seccion');
    escribirEnCampo('nombre-seccion', 'A medias');
    salirPorLaCruz();
    expect(alSalir).toHaveBeenCalledTimes(1);
    partida.desmontar();
  });
});
