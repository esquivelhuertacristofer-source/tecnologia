/**
 * El banco del motor de diapositivas (§39–§40).
 *
 * Dos cosas que este archivo tiene que impedir para siempre:
 *
 * 1. **Que un botón señalable se quede sin explicación.** El §37 dice que el aro
 *    apunta al botón exacto con su nombre, su domicilio y su para-qué-sirve. Si
 *    un control entra en la cinta y nadie escribe su entrada en `QUE_HACE_PPT`,
 *    el alumno ve un aro mudo — y eso no lo detecta ningún typecheck, porque son
 *    cadenas de texto. Aquí sí.
 * 2. **Que vuelvan los píxeles.** La prueba del §39 pasó porque el modelo guarda
 *    enteros. El día que alguien meta un decimal «para que quede más suave», las
 *    consultas necesitan tolerancia y toda la corrección deja de significar algo.
 */

import {
  CINTA_PPT_AVANZADO,
  CINTA_PPT_BASICO,
  CINTA_PPT_INTERMEDIO,
  TAMANO_BASE_DIAPO,
} from '@/components/activities/office/tecniaDiapositivas';
import { comoLlegar, ubicar, ubicarPestana, explicarDesvio } from '@/components/office/motor/guia';
import {
  DESPLEGABLES_PPT,
  QUE_HACE_PESTANA_PPT,
  QUE_HACE_PPT,
} from '@/components/office/motor-diapos/guia';
import {
  COLS,
  DISENOS,
  casillaDe,
  FILAS,
  FORMAS,
  LIENZO_ALTO,
  type Forma,
  type DisenoId,
  anchoDe,
  colsDe,
  casillasDelDiseno,
  diapositivaDePrueba,
  diapositivaRota,
  admiteRelleno,
  moverPorPixeles,
  redimensionarPorPixeles,
  rolesDe,
  type Diapositiva,
  type Tirador,
} from '@/components/office/motor-diapos/modelo';
import {
  centradaEnH,
  dentroDelLienzo,
  estimadoDe,
  estimadoNarrando,
  enLaRejilla,
  marcadorLleno,
  oscurecer,
  paresQueSeTapan,
  seTapan,
  tapaAlTitulo,
} from '@/components/office/motor-diapos/consultas';
import { existe } from '@/components/office/motor-diapos/comandos';
import { GUION_AUDIO_E_IMAGENES } from '@/components/activities/office/powerpoint/guionAudioEImagenes';
import { GUION_IMAGENES_Y_TEXTO } from '@/components/activities/office/powerpoint/guionImagenesYTexto';
import { GUION_LA_BUENA_DIAPOSITIVA } from '@/components/activities/office/powerpoint/guionLaBuenaDiapositiva';
import { GUION_PRESENTA_AL_GRUPO } from '@/components/activities/office/powerpoint/guionPresentaAlGrupo';
import { GUION_TRANSICIONES_CON_PROPOSITO } from '@/components/activities/office/powerpoint/guionTransicionesConProposito';
import { GUION_TUS_PRIMERAS_DIAPOSITIVAS } from '@/components/activities/office/powerpoint/guionTusPrimerasDiapositivas';
import { GUION_PRESENTA_Y_COMPARTE } from '@/components/activities/office/powerpoint/presenta-y-comparte/guion';
import { GUION_SMARTART_Y_GRAFICOS } from '@/components/activities/office/powerpoint/smartart-y-graficos/guion';
import { GUION_VIDEO_E_INTERVALOS } from '@/components/activities/office/powerpoint/video-e-intervalos/guion';
import { GUION_PATRON } from '@/components/activities/office/powerpoint/patron/guion';
import { GUION_INTERACTIVA } from '@/components/activities/office/powerpoint/interactiva/guion';
import { GUION_REVISION } from '@/components/activities/office/powerpoint/revision/guion';
import { GUION_EXPORTA_VIDEO } from '@/components/activities/office/powerpoint/exporta-video/guion';
import {
  GUION_ORDENA_EL_MAZO,
  museoJunto,
  ningunTramoVacio,
} from '@/components/activities/office/powerpoint/ordena-el-mazo/guion';
import { GUION_FORMAS_Y_CAJAS } from '@/components/activities/office/powerpoint/formas-y-cajas/guion';
import { GUION_EN_PAPEL } from '@/components/activities/office/powerpoint/en-papel/guion';
import {
  GUION_TRAELA_HECHA,
  ARCHIVO_DE_ORIGEN,
  ESQUEMA_DE_WORD,
  laPortadaConSuCara,
  laDelEquipoConLaTuya,
  salioElInforme,
  hayResumen,
} from '@/components/activities/office/powerpoint/traela-hecha/guion';
import {
  GUION_PARA_QUE_PANTALLA,
  LA_TERCERA,
} from '@/components/activities/office/powerpoint/para-que-pantalla/guion';
import {
  GUION_GRABALA,
  ENSAYO,
  TOTAL_ENSAYADO,
  LA_QUE_SE_REPITE,
} from '@/components/activities/office/powerpoint/grabala/guion';
import {
  apuntarToma,
  cuantasGrabadas,
  reiniciarGrabadora,
  masQueLaPrimera,
  seRegrabo,
} from '@/components/activities/office/powerpoint/comun/grabadora';
import { exportar, reiniciarSalida } from '@/components/activities/office/powerpoint/comun/salida';
import {
  aDiapositivas,
  cuantasSaldran,
} from '@/components/office/motor-diapos/desdeElEsquema';
import {
  ajustar,
  imprimir,
  reiniciarImpresora,
} from '@/components/activities/office/powerpoint/comun/impresora';
import {
  FORMAS_DE_IMPRIMIR,
  cuantasHojas,
  hojasAhorradas,
  hojasDe,
  lasQueSeImprimen,
  paraEscalaDeGrises,
} from '@/components/office/motor-diapos/impresion';
import { verificar } from '@/components/office/motor-diapos/verificar';

/**
 * Los once guiones de PowerPoint construidos, para las pruebas de contrato.
 *
 * Se apunta uno cada vez que se construye una clase, y no es papeleo: los dos
 * del Avanzado —`patron` e `interactiva`— pasaron a verde sin estar en esta
 * lista, o sea que la invariante del aro no los estaba mirando. Un contrato que
 * hay que acordarse de firmar sólo protege lo que se acordó firmar.
 */
const GUIONES_PPT = [
  GUION_TUS_PRIMERAS_DIAPOSITIVAS,
  GUION_IMAGENES_Y_TEXTO,
  GUION_PRESENTA_AL_GRUPO,
  GUION_TRANSICIONES_CON_PROPOSITO,
  GUION_AUDIO_E_IMAGENES,
  GUION_LA_BUENA_DIAPOSITIVA,
  GUION_PRESENTA_Y_COMPARTE,
  GUION_SMARTART_Y_GRAFICOS,
  GUION_VIDEO_E_INTERVALOS,
  GUION_PATRON,
  GUION_INTERACTIVA,
  GUION_REVISION,
  GUION_EXPORTA_VIDEO,
  GUION_ORDENA_EL_MAZO,
  GUION_FORMAS_Y_CAJAS,
  GUION_EN_PAPEL,
  GUION_TRAELA_HECHA,
  GUION_GRABALA,
  GUION_PARA_QUE_PANTALLA,
];
import {
  agregar,
  borrarComentario,
  cambiarDiseno,
  comentar,
  comentariosDe,
  completas,
  cuantosComentarios,
  agregarLibre,
  diapositivaNueva,
  escribirEn,
  escribirLibre,
  formatearEn,
  girar,
  irA,
  laActiva,
  lasOcultas,
  mazoVacio,
  mover,
  ocultar,
  ordenDeDisenos,
  organizar,
  patronImpreso,
  pendientesEnElMazo,
  cambiarForma,
  crearSeccion,
  recolocar,
  cuantasNarradas,
  loQueSeSale,
  pieDe,
  ponerElPie,
  todoCabe,
  conLaActiva,
  grabarEn,
  quitarNarracion,
  plegarSeccion,
  primeraVisible,
  quitar,
  reciennacido,
  secciones,
  tramos,
  traer,
  traerVarias,
  temaDe,
  zoomDeResumen,
  resolverComentario,
  textoEn,
  tocarPatronImpreso,
  TEMAS,
  type Mazo,
  type Sitio,
} from '@/components/office/motor-diapos/mazo';
import { hallazgos } from '@/components/activities/office/powerpoint/comun/Backstage';

const controlesDe = (cinta: typeof CINTA_PPT_AVANZADO) =>
  cinta.flatMap((p) => p.grupos.flatMap((g) => g.controles.map((c) => c.id)));

/** Las que están puestas siempre. Las contextuales aparecen y desaparecen. */
const puestas = (cinta: typeof CINTA_PPT_AVANZADO) => cinta.filter((p) => !p.contextual);

describe('la cinta de PowerPoint', () => {
  it('crece por grado como la de Word: menos pestañas para los más chicos', () => {
    // 4 · 6 · 8. Word acaba en 7 y aquí en 8, y no hay que «cuadrarlo»: manda el
    // programa, no la simetría. PowerPoint tiene una pestaña que un procesador de
    // textos no puede tener —Presentación— porque un documento no se presenta.
    //
    // El Básico eran 2 hasta el 11-ago-2026, pasaron a 3 al construir la clase 1
    // —el §27.1 cierra su primera fase eligiendo el TEMA, y los temas viven en
    // Diseño— y a 4 al construir la clase 3, que no se puede dar sin el botón
    // que empieza la presentación. El Intermedio subió con él por la regla de la
    // prueba siguiente. Cada vez se movió la cinta, nunca el temario.
    //
    // Se cuentan las pestañas PUESTAS. «Formato de imagen» es contextual —
    // aparece al seleccionar un objeto y se va al soltarlo (§42.2)— y no le
    // suma ruido al alumno que está mirando la cinta: no está hasta que él
    // mismo la invoca seleccionando algo. Contarla habría obligado a elegir
    // entre romper la progresión o mentir sobre dónde vive Recortar.
    expect(puestas(CINTA_PPT_BASICO).length).toBe(4);
    expect(puestas(CINTA_PPT_INTERMEDIO).length).toBe(6);
    expect(puestas(CINTA_PPT_AVANZADO).length).toBe(8);
  });

  it('una pestaña contextual no aparece en el grado que todavía no la usa', () => {
    // El Básico no tiene «Formato de imagen»: recortar y el texto alternativo
    // son de Intermedio, y una pestaña que aparece sola con dos botones
    // apagados es peor que no tenerla.
    expect(CINTA_PPT_BASICO.some((p) => p.contextual)).toBe(false);
    expect(CINTA_PPT_INTERMEDIO.some((p) => p.contextual === 'libre')).toBe(true);
    expect(CINTA_PPT_AVANZADO.some((p) => p.contextual === 'libre')).toBe(true);
  });

  it('cada grado contiene al anterior: un botón no cambia de sitio al subir de grado', () => {
    for (const id of controlesDe(CINTA_PPT_BASICO)) {
      expect(controlesDe(CINTA_PPT_INTERMEDIO)).toContain(id);
    }
    for (const id of controlesDe(CINTA_PPT_INTERMEDIO)) {
      expect(controlesDe(CINTA_PPT_AVANZADO)).toContain(id);
    }
  });

  it('ningún control aparece dos veces: dos sitios para lo mismo es un domicilio que miente', () => {
    const ids = controlesDe(CINTA_PPT_AVANZADO);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('el primer grupo de Inicio es Diapositivas, porque es por donde se empieza', () => {
    expect(CINTA_PPT_BASICO[0].grupos[0].id).toBe('diapositivas');
  });
});

describe('el modo guía tiene qué decir de todo lo que señala', () => {
  it('cada control de la cinta tiene su explicación escrita', () => {
    const sinExplicar = controlesDe(CINTA_PPT_AVANZADO).filter((id) => !QUE_HACE_PPT[id]);
    expect(sinExplicar).toEqual([]);
  });

  it('cada pestaña tiene la suya', () => {
    const sinExplicar = CINTA_PPT_AVANZADO.map((p) => p.id).filter((id) => !QUE_HACE_PESTANA_PPT[id]);
    expect(sinExplicar).toEqual([]);
  });

  it('los desplegables que la cinta no lista también se explican', () => {
    for (const id of Object.keys(DESPLEGABLES_PPT)) expect(QUE_HACE_PPT[id]).toBeTruthy();
  });

  it('ninguna explicación es un nombre repetido: tiene que decir qué GANA el alumno', () => {
    for (const [id, texto] of Object.entries(QUE_HACE_PPT)) {
      expect(texto.length).toBeGreaterThan(35);
      expect(texto.trim().endsWith('.')).toBe(true);
      expect(texto.toLowerCase()).not.toBe(id.toLowerCase());
    }
  });

  /*
   * El hueco que costó §43.3 (43.3.6 A).
   *
   * Había prueba de que todo botón tiene QUÉ DECIR y ninguna de que un botón
   * SEÑALADO haga algo, así que «Ensayar intervalos» estuvo un día en la cinta
   * pintado en gris y con el rótulo «aún no disponible» mientras el encargo 2
   * de §43.3 le ponía el aro encima. Las 767 pruebas, en verde.
   *
   * La invariante NO es «todo botón de la cinta está construido»: la cinta
   * enseña el programa entero a propósito, y un botón sin comando dice «aún no
   * disponible» y no castiga (§36). La invariante es más fina y es la que
   * importa: **el modo guía no puede apuntar a un botón que no hace nada.** Un
   * aro sobre un botón apagado es la única forma de que la clase se rompa del
   * todo, porque no hay manera de cumplir el encargo.
   */
  it('ningún encargo señala un botón sin comando: un aro sobre algo apagado no tiene salida', () => {
    /*
     * Sólo las señales de CINTA, o sea las que traen pestaña, grupo y control:
     * ésas son literalmente «ve a esta pestaña, a este grupo, y pulsa esto», y
     * si el botón no está construido el encargo no tiene salida. Un `control`
     * suelto puede ser un gesto del escenario (`ensayo-en-verde`,
     * `repaso-al-final`) o un sitio de la ventana (`notas`, `zoom`, `tira`), y
     * ésos no viven en la tabla de comandos ni tienen por qué.
     */
    const rotos = GUIONES_PPT.flatMap((g) =>
      g.pasos
        .filter((p) => p.senal?.pestana && p.senal?.grupo && p.senal?.control)
        .map((p) => p.senal!.control!),
    ).filter((id) => !existe(id));
    expect([...new Set(rotos)]).toEqual([]);
  });

  /*
   * La medida que faltaba, y que se paga a la TERCERA (44.4.6 · A).
   *
   * La prueba de arriba vigila que el modo guía no apunte a un botón muerto, y
   * eso deja fuera al botón que nadie señala: si la cinta lo pinta encendido, el
   * alumno lo va a pulsar igual, y le contesta «ese botón todavía no está en
   * esta clase» sobre un botón que el programa dibuja como cualquier otro.
   * Pasó tres veces —Ensayar en §43.3, las dos vistas en §44.1 y
   * `vista-notas`, que llevaba desde que se escribió el grado Avanzado— porque
   * **un botón se construye en dos archivos y ninguno de los dos comprueba al
   * otro**.
   *
   * La invariante sigue sin ser «todo botón está construido»: la cinta enseña
   * el programa entero a propósito y un botón sin comando dice «aún no
   * disponible» y no castiga (§36). Es más fina y es la que faltaba: **un botón
   * sin comando tiene que estar ahí a sabiendas.** La lista de abajo hay que
   * escribirla a mano, con el motivo, y eso es todo el mecanismo: obliga a
   * decidir en vez de a olvidar.
   */
  it('ningún botón de la cinta se queda sin comando por descuido', () => {
    /*
     * Los que están en la cinta y todavía no se enseñan, cada uno con la clase
     * que los va a estrenar. Al construirla, se borra su línea de aquí — y si
     * alguien la olvida, la prueba no avisa: por eso el motivo va escrito, para
     * que la línea se lea al pasar.
     */
    const TODAVIA_NO_SE_ENSENAN = new Set<string>([
      /*
       * Sin clase asignada todavía. Está en Revisar del grado Avanzado desde que
       * se escribió esa cinta y no lo estrena ninguna de las quince clases: la
       * ortografía de una presentación se corrige mirando, no con un botón, y
       * hasta que no haya un encargo que lo justifique no vale la pena. Queda
       * apuntado aquí, que es donde se ve.
       */
      'ortografia',
    ]);
    const huerfanos = controlesDe(CINTA_PPT_AVANZADO).filter(
      (id) => !existe(id) && !TODAVIA_NO_SE_ENSENAN.has(id),
    );
    expect([...new Set(huerfanos)]).toEqual([]);
  });
});

describe('el mecanismo del §37 sirve para PowerPoint sin copiarlo', () => {
  it('ubicar() encuentra cualquier control de la cinta y da su domicilio', () => {
    for (const id of controlesDe(CINTA_PPT_AVANZADO)) {
      const u = ubicar(CINTA_PPT_AVANZADO, id, DESPLEGABLES_PPT);
      expect(u).not.toBeNull();
      expect(comoLlegar(u!)).toContain('→');
    }
  });

  it('encuentra los desplegables inyectados, que no están en la cinta', () => {
    const u = ubicar(CINTA_PPT_AVANZADO, 'fuente-tamano', DESPLEGABLES_PPT);
    expect(u?.grupo).toBe('Fuente');
    expect(u?.pestanaId).toBe('inicio');
  });

  it('una pestaña no vive dentro de sí misma', () => {
    const u = ubicarPestana(CINTA_PPT_AVANZADO, 'animaciones');
    expect(comoLlegar(u!)).toBe('Pestaña Animaciones, arriba del todo');
  });

  it('el desvío nombra lo pulsado y explica con la tabla de PowerPoint, no la de Word', () => {
    const d = explicarDesvio(CINTA_PPT_AVANZADO, 'tema', 'nueva', QUE_HACE_PPT, DESPLEGABLES_PPT);
    expect(d.titulo).toContain('Temas');
    expect(d.queHace).toContain('TODA la presentación');
    expect(d.aDonde).toContain('Nueva diapositiva');
  });

  it('un control que no está en la cinta de esa clase devuelve null, y eso es un dato', () => {
    expect(ubicar(CINTA_PPT_BASICO, 'patron', DESPLEGABLES_PPT)).toBeNull();
  });
});

describe('la rejilla no admite píxeles (§39)', () => {
  const TIRADORES: Tirador[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

  it('mil gestos con desplazamientos decimales dejan siempre casillas enteras', () => {
    let c = { col: 4, fila: 3, cols: 3, filas: 2 };
    let semilla = 7;
    const azar = () => {
      semilla = (semilla * 1103515245 + 12345) % 2147483648;
      return semilla / 2147483648;
    };
    for (let i = 0; i < 1000; i += 1) {
      const dx = azar() * 900 - 450 + 0.37;
      const dy = azar() * 600 - 300 + 0.61;
      c = i % 3 === 2 ? redimensionarPorPixeles(c, TIRADORES[i % 8], dx, dy) : moverPorPixeles(c, dx, dy);
      expect(enLaRejilla(c)).toBe(true);
      expect(dentroDelLienzo(c)).toBe(true);
    }
  });

  it('«¿está centrado?» es una igualdad de enteros, no una tolerancia', () => {
    expect(centradaEnH({ col: 1, fila: 0, cols: 10, filas: 1 })).toBe(true);
    expect(centradaEnH({ col: 2, fila: 0, cols: 10, filas: 1 })).toBe(false);
    expect(2 * 1 + 10).toBe(COLS);
  });

  it('dos cajas que se tocan por el borde NO se tapan, y eso es exacto', () => {
    const a = { col: 0, fila: 0, cols: 6, filas: 2 };
    expect(seTapan(a, { col: 6, fila: 0, cols: 6, filas: 2 })).toBe(false);
    expect(seTapan(a, { col: 5, fila: 0, cols: 6, filas: 2 })).toBe(true);
  });

  it('una caja nunca se puede encoger hasta desaparecer', () => {
    let c = { col: 5, fila: 4, cols: 4, filas: 3 };
    for (let i = 0; i < 40; i += 1) c = redimensionarPorPixeles(c, 'se', -400, -400);
    expect(c.cols).toBeGreaterThanOrEqual(1);
    expect(c.filas).toBeGreaterThanOrEqual(1);
  });

  it('la rejilla es la que dice el §39 y cambiarla rompe los diseños', () => {
    expect([COLS, FILAS]).toEqual([12, 9]);
    // Y la otra forma, que comparte las nueve filas: lo único que cambia es el
    // ancho, que es lo que hace PowerPoint y lo que hace enseñable §44.3.
    expect([colsDe('4-3'), anchoDe('4-3')]).toEqual([9, 720]);
    expect(anchoDe('4-3') / LIENZO_ALTO).toBeCloseTo(4 / 3, 10);
  });
});

describe('el verificador dice la verdad en las dos direcciones', () => {
  it('la diapositiva de prueba nace limpia', () => {
    const v = verificar(diapositivaDePrueba());
    expect([v.fuera, v.tapados, v.vacios, v.sueltos]).toEqual([0, 0, 0, 0]);
  });

  it('la rota a mano canta exactamente sus tres defectos, ni uno más', () => {
    const v = verificar(diapositivaRota());
    expect([v.fuera, v.tapados, v.vacios, v.sueltos]).toEqual([1, 1, 1, 0]);
  });

  it('«¿la imagen tapa el título?» se contesta sin mirar un solo píxel', () => {
    const d = diapositivaDePrueba();
    expect(tapaAlTitulo(d, 'foto')).toBe(false);
    const encima = {
      ...d,
      libres: d.libres.map((l) => (l.id === 'foto' ? { ...l, casilla: { col: 2, fila: 1, cols: 3, filas: 1 } } : l)),
    };
    expect(tapaAlTitulo(encima, 'foto')).toBe(true);
    expect(paresQueSeTapan(encima).length).toBe(1);
  });
});

describe('el mazo', () => {
  it('una diapositiva nueva trae los marcadores que su diseño pide, y vacíos', () => {
    const m = agregar(mazoVacio(), 'portada');
    const d = laActiva(m)!;
    expect(d.marcadores.map((x) => x.rol).sort()).toEqual(rolesDe('portada').sort());
    expect(d.marcadores.every((x) => x.contenido === null)).toBe(true);
    expect(marcadorLleno(d, 'titulo')).toBe(false);
  });

  it('cambiar de diseño conserva el contenido y lo recoloca solo', () => {
    let m = agregar(mazoVacio(), 'portada');
    m = escribirEn(m, 'titulo', 'El desierto');
    m = escribirEn(m, 'subtitulo', 'Sofi · 4º B');
    m = cambiarDiseno(m, 'titulo-texto');
    expect(textoEn(m, 0, 'titulo')).toBe('El desierto');
    // El subtítulo no existe en «título y texto»: se va, y eso es correcto.
    expect(textoEn(m, 0, 'subtitulo')).toBeNull();
    // Y el título suelta su anulación: vuelve a la casilla del diseño nuevo.
    expect(laActiva(m)!.marcadores.find((x) => x.rol === 'titulo')?.casilla).toBeNull();
  });

  it('reordenar no muta el arreglo del estado', () => {
    let m = agregar(agregar(agregar(mazoVacio(), 'portada'), 'titulo-texto'), 'solo-imagen');
    const antes = m.diapositivas;
    m = mover(m, 2, 0);
    expect(ordenDeDisenos(m)).toEqual(['solo-imagen', 'portada', 'titulo-texto']);
    expect(antes.map((d) => d.diseno)).toEqual(['portada', 'titulo-texto', 'solo-imagen']);
  });

  it('no se puede quedar sin ninguna diapositiva', () => {
    let m = agregar(mazoVacio(), 'portada');
    m = quitar(m);
    expect(m.diapositivas.length).toBe(1);
  });

  it('cuenta como completa sólo la que tiene todos sus marcadores llenos', () => {
    let m = agregar(mazoVacio(), 'portada');
    expect(completas(m)).toBe(0);
    m = escribirEn(m, 'titulo', 'El desierto');
    expect(completas(m)).toBe(0);
    m = escribirEn(m, 'subtitulo', 'Sofi · 4º B');
    expect(completas(m)).toBe(1);
  });

  it('hay temas claros y oscuros, o la lección del contraste no se puede dar', () => {
    const claros = Object.values(TEMAS).filter((t) => t.fondo > '#8');
    expect(claros.length).toBeGreaterThanOrEqual(2);
    expect(Object.values(TEMAS).length - claros.length).toBeGreaterThanOrEqual(2);
  });

  it('los tamaños de letra son los de una diapositiva, no los de una hoja', () => {
    expect(TAMANO_BASE_DIAPO.titulo).toBeGreaterThanOrEqual(32);
    expect(TAMANO_BASE_DIAPO.cuerpo).toBeGreaterThanOrEqual(18);
  });

  /*
   * Las ocultas (§43.6). Esto es lo único de «oculta» que se puede comprobar
   * sin abrir un navegador, y por eso el salto se sacó de la ventana a una
   * función: dentro de un `useCallback` no hay manera de preguntarle nada.
   *
   * Y hace falta preguntárselo: si el salto no funciona, marcar una diapositiva
   * como oculta no cambia nada en pantalla y el hallazgo del inspector —«llevas
   * una que no se presenta»— sería una etiqueta sin consecuencia.
   */
  it('presentar se salta las ocultas, en los dos sentidos y desde el principio', () => {
    let m = agregar(agregar(agregar(agregar(mazoVacio(), 'portada'), 'titulo-texto'), 'titulo-texto'), 'titulo-texto');
    m = {
      ...m,
      diapositivas: m.diapositivas.map((d, i) => (i === 1 || i === 2 ? { ...d, oculta: true } : d)),
    };
    // Hacia adelante desde la 0: se saltan la 1 y la 2 de una vez.
    expect(primeraVisible(m, 1, 1)).toBe(3);
    // Hacia atrás desde la 3: se vuelve a la 0, no a la 2.
    expect(primeraVisible(m, 2, -1)).toBe(0);
    // Una visible se devuelve tal cual: la pregunta es «desde aquí», no «la de después».
    expect(primeraVisible(m, 0, 1)).toBe(0);
    // Sin ninguna visible por delante, un índice fuera del mazo — y no un bucle.
    const todasOcultas = { ...m, diapositivas: m.diapositivas.map((d) => ({ ...d, oculta: true })) };
    expect(primeraVisible(todasOcultas, 0, 1)).toBe(4);
    expect(primeraVisible(todasOcultas, 3, -1)).toBe(-1);
  });

  it('resolver un comentario no lo borra, y borrarlo no lo resuelve', () => {
    let m = agregar(mazoVacio(), 'titulo-texto');
    m = comentar(m, 0, { id: 'c1', autor: 'Diego', texto: 'está mal', fecha: '3/2' });
    m = comentar(m, 0, { id: 'c2', autor: 'Tú', texto: 'no se lee porque el gris no contrasta', fecha: '3/2' });
    expect(pendientesEnElMazo(m)).toBe(2);

    m = resolverComentario(m, 'c1');
    // Sigue ahí, con su sello: resolver deja constancia de que se atendió.
    expect(comentariosDe(laActiva(m)!).length).toBe(2);
    expect(pendientesEnElMazo(m)).toBe(1);

    m = borrarComentario(m, 'c1');
    expect(comentariosDe(laActiva(m)!).length).toBe(1);
    expect(pendientesEnElMazo(m)).toBe(1);
  });

  it('el inspector no inventa: sólo encuentra lo que el archivo lleva de verdad', () => {
    const limpio = agregar(mazoVacio(), 'titulo-texto');
    expect(hallazgos(limpio)).toEqual([]);

    let m: Mazo = { ...limpio, autor: 'Ana Ruiz' };
    m = comentar(m, 0, { id: 'c1', autor: 'Diego', texto: 'está mal', fecha: '3/2' });
    m = { ...m, diapositivas: [{ ...m.diapositivas[0], notas: 'Contar lo de la fuga' }] };
    m = agregar(m, 'titulo-texto');
    m = { ...m, diapositivas: m.diapositivas.map((d, i) => (i === 1 ? { ...d, oculta: true } : d)) };

    expect(hallazgos(m).map((h) => h.id).sort()).toEqual(['autor', 'comentarios', 'notas', 'ocultas']);
    // Y cada «quitar» quita lo suyo y nada más.
    const sinOcultas = hallazgos(m).find((h) => h.id === 'ocultas')!.quitar(m);
    expect(lasOcultas(sinOcultas)).toEqual([]);
    expect(cuantosComentarios(sinOcultas)).toBe(1);
    expect(sinOcultas.autor).toBe('Ana Ruiz');
  });

  /* ── las secciones y ocultar (§44.1) ────────────────────────────────────── */

  it('una sección guarda dónde EMPIEZA, y dónde acaba se deriva', () => {
    let m = mazoVacio();
    for (let i = 0; i < 6; i += 1) m = agregar(m, 'titulo-texto');

    // Sin secciones, un solo tramo con todo. No un tramo vacío ni ninguno.
    expect(tramos(m).length).toBe(1);
    expect(tramos(m)[0].indices).toEqual([0, 1, 2, 3, 4, 5]);

    m = crearSeccion(m, 'El museo', 2)!;
    m = crearSeccion(m, 'El cierre', 4)!;
    expect(secciones(m).map((s) => s.nombre)).toEqual(['El museo', 'El cierre']);

    // Tres tramos: las dos sueltas de delante, y las dos secciones. Las de
    // delante NO se pierden, que es lo que pasaría si el reparto empezara en la
    // primera sección.
    const t = tramos(m);
    expect(t.map((x) => x.seccion?.nombre ?? null)).toEqual([null, 'El museo', 'El cierre']);
    expect(t.map((x) => x.indices)).toEqual([[0, 1], [2, 3], [4, 5]]);
    expect(ningunTramoVacio(m)).toBe(true);

    // Y el reparto se DERIVA: al llegar una diapositiva nueva al final, el
    // último tramo la recoge sin que nadie toque las secciones.
    m = agregar(m, 'titulo-texto');
    expect(tramos(m).at(-1)!.indices).toEqual([4, 5, 6]);
  });

  /* ── traer de otro archivo y el índice automático (§44.5) ───────────────── */

  it('una diapositiva traída se queda con su cara sólo si se pide', () => {
    let m = mazoVacio();
    m = agregar(m, 'titulo-texto');
    expect(m.tema).toBe('blanco');

    const ajena: Diapositiva = {
      diseno: 'portada',
      marcadores: [{ rol: 'titulo', contenido: 'La escuela', casilla: null }],
      libres: [],
    };

    // Conservando el origen: se ve con los colores de su casa…
    const conCara = traer(m, ajena, 'arena', true);
    expect(conCara.diapositivas[1].tema).toBe('arena');
    expect(temaDe(conCara.tema, conCara.diapositivas[1].tema).id).toBe('arena');
    // …y las de al lado siguen con la del archivo. Ésa es la lección entera.
    expect(temaDe(conCara.tema, conCara.diapositivas[0].tema).id).toBe('blanco');

    // Sin conservarlo, toma la de la casa.
    const sinCara = traer(m, ajena, 'arena', false);
    expect(sinCara.diapositivas[1].tema).toBeUndefined();
    expect(temaDe(sinCara.tema, sinCara.diapositivas[1].tema).id).toBe('blanco');

    /*
     * Y el caso que se escribe mal solo: una ajena que YA venía con su tema
     * puesto. Un spread se lo copiaría tal cual y la casilla apagada no haría
     * nada — la mitad del encargo 4 dejaría de poder cumplirse.
     */
    const yaTraida: Diapositiva = { ...ajena, tema: 'bosque' };
    expect(traer(m, yaTraida, 'arena', false).diapositivas[1].tema).toBeUndefined();
  });

  it('lo que entra o sale corre los cortes de sección que tiene detrás', () => {
    let m = mazoVacio();
    for (let i = 0; i < 6; i += 1) m = agregar(m, 'titulo-texto');
    m = crearSeccion(m, 'El museo', 2)!;
    m = crearSeccion(m, 'El cierre', 4)!;

    // Traer una detrás de la primera empuja los dos cortes.
    const ajena: Diapositiva = { diseno: 'portada', marcadores: [], libres: [] };
    const traida = traer({ ...m, activa: 0 }, ajena, 'arena', false);
    expect(secciones(traida).map((s) => s.desde)).toEqual([3, 5]);
    // Y las secciones siguen nombrando a las mismas diapositivas de siempre.
    expect(tramos(traida).map((t) => t.seccion?.nombre ?? null)).toEqual([
      null,
      'El museo',
      'El cierre',
    ]);

    // Quitar una de delante los devuelve a su sitio.
    expect(secciones(quitar({ ...traida, activa: 0 })).map((s) => s.desde)).toEqual([2, 4]);

    // Lo que entra DETRÁS del corte no lo mueve: cae dentro de esa sección.
    expect(secciones(traer({ ...m, activa: 4 }, ajena, 'arena', false)).map((s) => s.desde)).toEqual(
      [2, 4],
    );
  });

  it('el Zoom de resumen se deriva de las secciones, y sin secciones no hay resumen', () => {
    let m = mazoVacio();
    for (let i = 0; i < 6; i += 1) m = agregar(m, 'titulo-texto');

    // Sin secciones no hay nada que resumir, y decirlo es más honesto que armar
    // un índice de una entrada que no lleva a ninguna parte.
    expect(zoomDeResumen(m)).toBeNull();

    m = crearSeccion(m, 'El problema', 0)!;
    m = crearSeccion(m, 'Lo que hicimos', 2)!;
    m = crearSeccion(m, 'El final', 4)!;

    const z = zoomDeResumen(m)!;
    expect(z.diapositivas.length).toBe(7); // el índice, delante
    expect(z.activa).toBe(0);

    const botones = z.diapositivas[0].libres;
    expect(botones.map((b) => b.clase)).toEqual(['zoom', 'zoom', 'zoom']);
    expect(botones.map((b) => b.contenido)).toEqual([
      'El problema',
      'Lo que hicimos',
      'El final',
    ]);

    /*
     * Cada botón lleva a la PRIMERA de su sección, contando ya con que el
     * índice se metió delante. Si los cortes no se corrieran, el resumen
     * apuntaría una diapositiva antes de donde debe y la sección quedaría
     * empezando por el propio índice.
     */
    expect(botones.map((b) => b.destino)).toEqual([1, 3, 5]);
    expect(secciones(z).map((s) => s.desde)).toEqual([1, 3, 5]);
    expect(tramos(z).map((t) => t.seccion?.nombre ?? null)).toEqual([
      null,
      'El problema',
      'Lo que hicimos',
      'El final',
    ]);
  });

  it('no se abren dos secciones en el mismo sitio ni una sin nombre', () => {
    let m = mazoVacio();
    for (let i = 0; i < 3; i += 1) m = agregar(m, 'titulo-texto');
    m = crearSeccion(m, 'El viaje', 0)!;

    expect(crearSeccion(m, 'Otra', 0)).toBeNull();
    expect(crearSeccion(m, '   ', 1)).toBeNull();
    expect(crearSeccion(m, 'Fuera', 9)).toBeNull();
    // El nombre se guarda sin los espacios de los lados: «El museo » y
    // «El museo» son la misma sección escrita con prisa.
    expect(crearSeccion(m, '  El museo  ', 1)!.secciones!.at(-1)!.nombre).toBe('El museo');
  });

  it('plegar una sección no cambia lo que se presenta', () => {
    let m = mazoVacio();
    for (let i = 0; i < 4; i += 1) m = agregar(m, 'titulo-texto');
    m = crearSeccion(m, 'El cierre', 2)!;
    const plegado = plegarSeccion(m, 2, true);

    expect(secciones(plegado)[0].plegada).toBe(true);
    // Lo único que cambió es esa marca: ni una diapositiva de más ni de menos,
    // y ninguna oculta. Plegar es de mirar, no de presentar.
    expect(plegado.diapositivas).toEqual(m.diapositivas);
    expect(lasOcultas(plegado)).toEqual([]);
    // Y plegar una que no existe no inventa ninguna.
    expect(plegarSeccion(m, 3, true).secciones!.length).toBe(1);
  });

  it('ocultar deja la diapositiva dentro del archivo', () => {
    let m = mazoVacio();
    for (let i = 0; i < 3; i += 1) m = agregar(m, 'titulo-texto');
    const antes = m.diapositivas.length;

    m = ocultar(m, 1, true);
    // Sigue estando: ocultar NO es quitar, que es la lección entera del encargo.
    expect(m.diapositivas.length).toBe(antes);
    expect(lasOcultas(m)).toEqual([1]);
    // Y el repaso se la salta sin que nadie escriba nada.
    expect(primeraVisible(m, 1, 1)).toBe(2);

    // Es un interruptor: vuelve con el mismo gesto.
    expect(lasOcultas(ocultar(m, 1, false))).toEqual([]);
    // Pedir lo que ya está no fabrica un mazo nuevo.
    expect(ocultar(m, 1, true)).toBe(m);
    expect(ocultar(m, 9, true)).toBe(m);
  });

  it('«las tres del museo juntas» no exige un sitio, exige que estén seguidas', () => {
    // El predicado del encargo 3, probado sobre el mazo de verdad de la clase.
    const inicial = GUION_ORDENA_EL_MAZO.mazo();
    expect(museoJunto(inicial)).toBe(false);

    // Juntarlas en CUALQUIER sitio vale, y se juntan con el `mover` de verdad,
    // el mismo que usa el arrastre. Se llevan las tres al final una tras otra:
    // el destino es siempre la última posición, así que no hay que pelearse con
    // el corrimiento de índices que provoca sacar la que viaja.
    const donde = (m: Mazo, titulo: string) =>
      m.diapositivas.findIndex(
        (d) => d.marcadores.find((x) => x.rol === 'titulo')?.contenido === titulo,
      );
    const alFinal = (m: Mazo, titulo: string) =>
      mover(m, donde(m, titulo), m.diapositivas.length - 1);

    let m = alFinal(inicial, 'El museo por dentro');
    expect(museoJunto(m)).toBe(false);
    m = alFinal(m, 'La sala de los dinosaurios');
    expect(museoJunto(m)).toBe(false); // dos juntas todavía no son tres
    m = alFinal(m, 'Lo que más nos gustó del museo');
    expect(museoJunto(m)).toBe(true);
    // Y ninguna se perdió por el camino.
    expect(m.diapositivas.length).toBe(inicial.diapositivas.length);
  });

  /* ── formas, cuadros de texto y modelos 3D (§44.2) ──────────────────────── */

  it('un cuadro de texto se puede escribir, y eso no toca a los marcadores', () => {
    /*
     * La comprobación que faltaba el día que se construyó la clase: el motor
     * sabía INSERTAR un cuadro de texto y no sabía escribir dentro. El encargo
     * decía «doble clic y escribe» y no había forma de hacerlo. Se destapó
     * jugando, no leyendo.
     */
    let m = agregar(mazoVacio(), 'titulo-texto');
    m = escribirEn(m, 'titulo', 'El agua que usamos');
    m = agregarLibre(m, {
      id: 'texto-1',
      clase: 'texto',
      contenido: 'Escribe aquí',
      casilla: { col: 1, fila: 1, cols: 4, filas: 1 },
    });

    m = escribirLibre(m, 'texto-1', 'El ciclo del agua');
    expect(laActiva(m)!.libres.find((l) => l.id === 'texto-1')?.contenido).toBe('El ciclo del agua');
    // Y el marcador sigue siendo suyo: escribir en un objeto suelto no es
    // escribir en el diseño.
    expect(textoEn(m, 0, 'titulo')).toBe('El agua que usamos');
    // Un id que no está no inventa una caja nueva.
    expect(laActiva(escribirLibre(m, 'no-existe', 'x'))!.libres.length).toBe(1);
  });

  it('«En blanco» no pide ni un marcador, y por eso el cuadro de texto tiene sentido', () => {
    expect(rolesDe('en-blanco')).toEqual([]);
    expect(diapositivaNueva('en-blanco').marcadores).toEqual([]);
    /*
     * Lo que este acomodo evita: con `solo-imagen` la diapositiva «vacía» del
     * cartel traía un marcador de título —una caja de puntitos que dice «doble
     * clic para escribir»— mientras el encargo afirmaba que no había ninguna
     * caja. Los demás acomodos sí piden marcadores; que éste no lo haga es su
     * razón de existir.
     */
    expect(rolesDe('solo-imagen').length).toBeGreaterThan(0);
  });

  it('sólo la línea se queda sin dentro; la flecha de bloque sí se rellena', () => {
    expect(admiteRelleno('linea')).toBe(false);
    expect(admiteRelleno('flecha')).toBe(true);
    expect(admiteRelleno('rectangulo')).toBe(true);
    expect(admiteRelleno('elipse')).toBe(true);
  });

  it('quitarle el relleno a una forma NO es no habérselo puesto', () => {
    let m = agregar(mazoVacio(), 'en-blanco');
    m = agregarLibre(m, {
      id: 'forma-1',
      clase: 'forma',
      figura: 'elipse',
      contenido: '',
      casilla: { col: 4, fila: 3, cols: 4, filas: 3 },
    });
    const sitio: Sitio = { tipo: 'libre', id: 'forma-1' };

    // De fábrica no hay nada dicho: lo que se ve lo decide el tema.
    expect(laActiva(m)!.libres[0].formato?.relleno).toBeUndefined();

    // «Sin relleno» se GUARDA. Si se guardara como «nada dicho», el alumno
    // pulsaría el cuadrito de la diagonal roja y le volvería el color del tema:
    // su gesto no habría hecho nada.
    m = formatearEn(m, sitio, { relleno: 'ninguno' });
    expect(laActiva(m)!.libres[0].formato?.relleno).toBe('ninguno');

    // Y relleno y contorno son independientes: poner uno no borra el otro.
    m = formatearEn(m, sitio, { contorno: '#B91C1C' });
    expect(laActiva(m)!.libres[0].formato?.relleno).toBe('ninguno');
    expect(laActiva(m)!.libres[0].formato?.contorno).toBe('#B91C1C');
  });

  it('el contorno de fábrica se distingue del relleno de fábrica', () => {
    /*
     * El número no importa; lo que importa es que sean DISTINTOS y que el de la
     * raya sea el más oscuro. Naciendo iguales, «quítale el contorno» no cambia
     * un píxel y el encargo pide un gesto que no se ve.
     */
    const brillo = (hex: string) =>
      [1, 3, 5].reduce((s, i) => s + parseInt(hex.slice(i, i + 2), 16), 0);
    expect(oscurecer(TEMAS.blanco.acento)).not.toBe(TEMAS.blanco.acento);
    // En los cuatro temas, no sólo en el claro.
    for (const t of Object.values(TEMAS)) {
      expect(brillo(oscurecer(t.acento))).toBeLessThan(brillo(t.acento));
    }
  });

  it('un grupo se ordena como una pieza, igual que se mueve como una pieza', () => {
    let m = agregar(mazoVacio(), 'en-blanco');
    for (const id of ['a', 'b', 'c']) {
      m = agregarLibre(m, {
        id,
        clase: 'forma',
        figura: 'rectangulo',
        contenido: '',
        casilla: { col: 1, fila: 1, cols: 2, filas: 2 },
      });
    }
    const s = (id: string): Sitio => ({ tipo: 'libre', id });
    m = organizar(m, [s('a'), s('b'), s('c')], 'agrupar')!;
    const grupo = laActiva(m)!.libres[0].grupo;
    expect(grupo).toBeDefined();

    /*
     * Enviar al fondo UNA del grupo manda las tres. Sin esto, el alumno acababa
     * de leer «ahora son una sola pieza», mandaba al fondo la que veía y se le
     * quedaban dos tapando el título — un grupo que a veces es una pieza y a
     * veces tres.
     */
    const alFondo = organizar(m, [s('b')], 'al-fondo')!;
    const zetas = alFondo.diapositivas[0].libres.map((l) => l.z);
    expect(new Set(zetas).size).toBe(1);

    // Y desagrupar por una las desagrupa a todas: es un grupo, no tres marcas.
    const sueltas = organizar(m, [s('c')], 'desagrupar')!;
    expect(sueltas.diapositivas[0].libres.every((l) => !l.grupo)).toBe(true);
  });

  it('lo que se acaba de insertar se sabe cuál es, sin listas escritas a mano', () => {
    const antes = agregar(mazoVacio(), 'en-blanco');
    const despues = agregarLibre(antes, {
      id: 'modelo-gota',
      clase: 'modelo3d',
      contenido: 'gota',
      casilla: { col: 8, fila: 3, cols: 3, filas: 4 },
      giro: { x: 0, y: 0 },
    });
    expect(reciennacido(antes, despues)).toBe('modelo-gota');
    // Sin cambios, nada nació.
    expect(reciennacido(antes, antes)).toBeNull();
    // Cambiar de diapositiva no es insertar un objeto, aunque la nueva traiga
    // otros: sin esta guarda, duplicar una lámina «insertaba» cosas.
    expect(reciennacido(despues, irA(agregar(despues, 'portada'), 1))).toBeNull();
  });

  it('el giro del modelo se guarda con la presentación y no se desboca', () => {
    let m = agregar(mazoVacio(), 'en-blanco');
    m = agregarLibre(m, {
      id: 'modelo-gota',
      clase: 'modelo3d',
      contenido: 'gota',
      casilla: { col: 8, fila: 3, cols: 3, filas: 4 },
      giro: { x: 0, y: 0 },
    });
    m = girar(m, 'modelo-gota', { x: 200, y: 140 });
    const g = laActiva(m)!.libres[0].giro!;
    expect(g.y).toBe(140);
    // Volcarlo del todo deja de enseñar la pieza y empieza a enseñar su suelo.
    expect(g.x).toBeLessThanOrEqual(80);
  });

  it('ningún encargo de «Lo que dibujas tú» deshace uno anterior', () => {
    /*
     * La regla de §43.3 B escrita como prueba, porque escrita sólo en el
     * documento no avisó: el motor vuelve a comprobar los logros `documento` ya
     * palomeados, así que **un predicado que un encargo posterior deshace está
     * mal escrito**.
     *
     * Aquí el caso concreto: `tituloDelante` mira TODAS las formas, y el encargo
     * de agrupar hace nacer dos formas nuevas —que nacen encima—. Con el orden
     * contrario, cerrar «se te tapó el título» y dibujar después las otras dos
     * devolvía al alumno al encargo anterior sin que hubiera hecho nada mal.
     * Se destapó jugando; esto es para que la próxima vez lo diga Jest.
     */
    const orden = GUION_FORMAS_Y_CAJAS.pasos.map((p) => p.id);
    expect(orden.indexOf('las-tres-juntas')).toBeLessThan(orden.indexOf('se-fue-detras'));
  });

  /* ── el papel: paginar e imprimir (§44.4) ───────────────────────────────── */

  it('paginar es una cuenta exacta, y la última hoja va incompleta si toca', () => {
    const m = GUION_EN_PAPEL.mazo();
    expect(m.diapositivas.length).toBe(9);

    // De seis en seis: ocho que se imprimen → una hoja llena y otra con dos.
    const seis = hojasDe(m, 'doc-6');
    expect(seis.length).toBe(2);
    expect(seis[0].length).toBe(6);
    expect(seis[1].length).toBe(2);

    // Y de tres en tres, tres hojas justas.
    expect(cuantasHojas(m, 'doc-3')).toBe(3);
    // Una por hoja son ocho, no nueve: la oculta tampoco gasta hoja.
    expect(cuantasHojas(m, 'diapositivas')).toBe(8);
  });

  it('las diapositivas ocultas no se imprimen — la casilla que viene apagada', () => {
    const m = GUION_EN_PAPEL.mazo();
    /*
     * La 7 llega oculta en el mazo de la clase, y eso no es un adorno: es la
     * lección de §44.1 cobrada donde muerde —llevas las copias al jurado y falta
     * la diapositiva de lo que cuesta—. Si algún día alguien la desoculta «para
     * que salgan las cuentas redondas», esta prueba lo dice.
     */
    expect(lasOcultas(m)).toEqual([6]);
    expect(lasQueSeImprimen(m)).not.toContain(6);
    expect(lasQueSeImprimen(m).length).toBe(8);
    expect(hojasDe(m, 'doc-6').flat()).not.toContain(6);
  });

  it('el número de página se cuenta sobre las que se imprimen, y la oculta no lleva', () => {
    /*
     * Salió jugando: la vista «Página de notas» ponía «1 de 9» —el largo del
     * mazo— mientras el previo de Archivo → Imprimir decía ocho hojas. Dos
     * números distintos para la misma cosa, a dos clics uno del otro, y el
     * alumno con la clase entera hablándole de cuántas hojas salen.
     *
     * El puesto en el papel se DERIVA de las que se imprimen; la oculta no
     * tiene puesto porque no sale.
     */
    const m = GUION_EN_PAPEL.mazo();
    const salen = lasQueSeImprimen(m);
    const puesto = (i: number) => salen.indexOf(i);

    expect(puesto(0)).toBe(0); // la primera es la hoja 1…
    expect(salen.length).toBe(8); // …de ocho, no de nueve
    expect(puesto(6)).toBe(-1); // la oculta no ocupa hoja
    expect(puesto(7)).toBe(6); // y la de después SUBE un puesto
    expect(puesto(8)).toBe(7); // la última es la hoja 8 de 8
  });

  /* ── traer lo hecho: el esquema de Word y el índice (§44.5) ─────────────── */

  it('un esquema de Word se convierte por sus TÍTULOS, y lo demás no se convierte', () => {
    const salen = aDiapositivas(ESQUEMA_DE_WORD.renglones);

    // Cuatro Título 1 en el documento, cuatro diapositivas. Ni una más: los dos
    // párrafos normales del informe no se convierten en nada, y ésa es la mitad
    // de la lección —un documento escrito con negrita grande no se convierte—.
    expect(salen.length).toBe(4);
    expect(cuantasSaldran(ESQUEMA_DE_WORD.renglones)).toBe(4);
    expect(salen.map((d) => d.marcadores.find((m) => m.rol === 'titulo')!.contenido)).toEqual([
      'Qué medimos',
      'Cómo lo medimos',
      'Qué encontramos',
      'Qué proponemos',
    ]);

    // Y los Título 2 caen como viñetas de la suya, en su orden.
    expect(salen[0].marcadores.find((m) => m.rol === 'cuerpo')!.contenido).toBe(
      'El agua que gasta cada bancal\nCuántos días tarda en brotar',
    );

    // El párrafo normal que hay entre medias no se cuela en ninguna.
    const todo = salen.map((d) => d.marcadores.map((m) => m.contenido ?? '').join(' ')).join(' ');
    expect(todo).not.toContain('anexo');
  });

  it('un renglón de viñeta sin título delante no se inventa una diapositiva', () => {
    // Es el caso que rompe una conversión escrita a la ligera: en Word, un
    // subtítulo suelto antes del primer título es texto de portada. Fabricarle
    // una diapositiva sin título sería adivinar por el alumno.
    expect(aDiapositivas([{ nivel: 2, texto: 'Suelto' }])).toEqual([]);
    expect(aDiapositivas([{ texto: 'Normal' }, { nivel: 2, texto: 'Suelto' }])).toEqual([]);
  });

  it('equivocarse una vez no cierra el encargo para siempre', () => {
    /*
     * Salió jugando mal: traer la portada SIN marcar la casilla —que es el error
     * natural, porque la casilla está arriba y la diapositiva abajo— y volver a
     * traerla marcándola deja DOS portadas. El predicado miraba la primera, o
     * sea la mala, y contestaba que no para siempre: encargo imposible de
     * cerrar por haber hecho justo lo que la pista corrige.
     */
    const m0 = GUION_TRAELA_HECHA.mazo();
    const portada = ARCHIVO_DE_ORIGEN.mazo.diapositivas[0];

    const mal = traer(m0, portada, ARCHIVO_DE_ORIGEN.mazo.tema, false);
    expect(laPortadaConSuCara(mal)).toBe(false);

    const yLuegoBien = traer(mal, portada, ARCHIVO_DE_ORIGEN.mazo.tema, true);
    expect(laPortadaConSuCara(yLuegoBien)).toBe(true);

    // Y al revés, que es el mismo agujero por el otro lado.
    const alReves = traer(traer(m0, portada, 'arena', true), portada, 'arena', false);
    expect(laPortadaConSuCara(alReves)).toBe(true);
  });

  it('ningún encargo de «No la hagas dos veces» deshace a otro', () => {
    /*
     * La regla de §43.3 B, jugada en vez de razonada: se hace la clase entera y
     * después de cada paso se vuelven a mirar TODOS los anteriores. La primera
     * versión de §44.5 tenía el encargo 2 pidiendo sólo «trae la portada», y el
     * 3 preguntaba por qué se veía distinta — que era una pregunta sobre algo
     * que podía no haber pasado. Se arregló pidiendo las dos mitades juntas.
     */
    const m0 = GUION_TRAELA_HECHA.mazo();
    const hechos: ((m: Mazo) => boolean)[] = [];
    const jugadas: ((m: Mazo) => Mazo)[] = [
      // 2 · la portada, conservando el origen.
      (m) => traer(m, ARCHIVO_DE_ORIGEN.mazo.diapositivas[0], ARCHIVO_DE_ORIGEN.mazo.tema, true),
      // 4 · la del equipo, sin conservarlo.
      (m) => traer(m, ARCHIVO_DE_ORIGEN.mazo.diapositivas[1], ARCHIVO_DE_ORIGEN.mazo.tema, false),
      // 6 · el informe de Word, detrás de la activa.
      (m) => traerVarias(m, aDiapositivas(ESQUEMA_DE_WORD.renglones)),
      // 8 · el índice.
      (m) => zoomDeResumen(m)!,
    ];
    const predicados = [laPortadaConSuCara, laDelEquipoConLaTuya, salioElInforme, hayResumen];

    let m = m0;
    // Ninguno está cumplido antes de empezar: un encargo que nace hecho no es
    // un encargo.
    for (const p of predicados) expect(p(m)).toBe(false);

    jugadas.forEach((jugar, i) => {
      m = jugar(m);
      hechos.push(predicados[i]);
      // El de turno se cumple…
      expect(predicados[i](m)).toBe(true);
      // …y ninguno de los anteriores se cayó por el camino.
      for (const antes of hechos) expect(antes(m)).toBe(true);
    });

    // Y el índice apunta a las secciones de verdad, que siguen siendo tres
    // aunque hayan entrado seis diapositivas nuevas por en medio.
    expect(secciones(m).length).toBe(3);
    expect(m.diapositivas[0].libres.filter((l) => l.clase === 'zoom').length).toBe(3);
  });

  it('el ahorro de hojas es un dato del mazo, no una promesa del cuadro', () => {
    const m = GUION_EN_PAPEL.mazo();
    expect(hojasAhorradas(m, 'diapositivas')).toBe(0);
    expect(hojasAhorradas(m, 'doc-6')).toBe(6); // 8 hojas → 2
    expect(hojasAhorradas(m, 'doc-3')).toBe(5); // 8 hojas → 3
  });

  it('sólo el documento de 3 lleva rayas, y sólo las páginas de notas llevan notas', () => {
    // Las rayas son la razón de existir del de 3 —es el que se reparte cuando
    // quieres que te escriban— así que si algún día las llevan todos, ese
    // formato deja de tener sentido propio.
    const conRayas = FORMAS_DE_IMPRIMIR.filter((f) => f.conRayas).map((f) => f.id);
    expect(conRayas).toEqual(['doc-3']);
    const conNotas = FORMAS_DE_IMPRIMIR.filter((f) => f.conNotas).map((f) => f.id);
    expect(conNotas).toEqual(['notas']);
  });

  it('la escala de grises reasigna los fondos, y NO toca la presentación', () => {
    const m = GUION_EN_PAPEL.mazo();
    expect(m.tema).toBe('noche'); // fondo oscuro, que es lo que hace la lección

    const enPapel = paraEscalaDeGrises(m);
    /*
     * Un `filter: grayscale` sobre azul marino da casi negro, y el previo
     * enseñaba nueve manchones debajo de un encargo que dice «en grises se lee
     * mejor». PowerPoint tampoco desatura: reasigna. Se destapó mirando la
     * captura, con las pruebas en verde.
     */
    expect(enPapel.tema).toBe('blanco');
    expect(enPapel.diapositivas.every((d) => d.fondo === undefined)).toBe(true);

    // Y la otra mitad de la lección: la de la pantalla se queda como estaba.
    expect(m.tema).toBe('noche');
    expect(paraEscalaDeGrises(m)).not.toBe(m);
  });

  it('un patrón de hoja se fusiona: poner el pie no borra el encabezado', () => {
    let m = GUION_EN_PAPEL.mazo();
    // Sin tocar nada, un objeto vacío y no un reventón.
    expect(patronImpreso(m, 'documentos')).toEqual({});

    m = tocarPatronImpreso(m, 'documentos', { encabezado: 'Equipo Las Nutrias' });
    m = tocarPatronImpreso(m, 'documentos', { pie: 'Concurso de ciencias' });
    expect(patronImpreso(m, 'documentos').encabezado).toBe('Equipo Las Nutrias');
    expect(patronImpreso(m, 'documentos').pie).toBe('Concurso de ciencias');

    // Y los dos patrones son independientes: el de notas no se enteró.
    expect(patronImpreso(m, 'notas')).toEqual({});
  });

  it('ningún encargo de «Lo que se imprime» deshace uno anterior', () => {
    /*
     * La misma regla de §43.3 B, probada esta vez **jugando** y no leyendo el
     * orden de la lista: aquí se puede, porque lo impreso vive en un almacén que
     * la prueba puede manipular.
     *
     * Es el defecto que esta clase estuvo a punto de tener: los ajustes del
     * cuadro son un estado momentáneo, y con predicados que miraran el
     * desplegable, pedir el documento de 3 habría deshecho el de 6. Se cierran
     * imprimiendo, y una hoja que salió de la impresora no se des-imprime.
     */
    reiniciarImpresora();
    const m = GUION_EN_PAPEL.mazo();
    const hechos = () =>
      GUION_EN_PAPEL.pasos
        .filter((p) => p.logro.tipo === 'documento')
        .map((p) => (p.logro as { comprueba: (x: Mazo) => boolean }).comprueba(m));

    // Al empezar, ninguno de los de documento está hecho.
    expect(hechos().some(Boolean)).toBe(false);

    let conElMolde = m;
    const pasos: (() => void)[] = [
      () => {
        ajustar({ que: 'doc-6' });
        imprimir(m);
      },
      () => {
        ajustar({ que: 'doc-3' });
        imprimir(m);
      },
      () => {
        conElMolde = tocarPatronImpreso(m, 'documentos', { encabezado: 'Equipo Las Nutrias' });
      },
      () => {
        ajustar({ que: 'notas' });
        imprimir(m);
      },
      () => {
        ajustar({ que: 'doc-3', color: 'grises', copias: 3 });
        imprimir(m);
      },
    ];

    /*
     * Lo que se comprueba: **el número de encargos cumplidos nunca baja.** No
     * cuáles, sino que ninguno se caiga por el camino, que es exactamente la
     * forma del defecto.
     */
    let antes = 0;
    for (const paso of pasos) {
      paso();
      const cuantos = GUION_EN_PAPEL.pasos.filter(
        (p) =>
          p.logro.tipo === 'documento' &&
          (p.logro as { comprueba: (x: Mazo) => boolean }).comprueba(conElMolde),
      ).length;
      expect(cuantos).toBeGreaterThanOrEqual(antes);
      antes = cuantos;
    }
    // Y al final, los cinco de documento están hechos.
    expect(antes).toBe(5);
    reiniciarImpresora();
  });
});

describe('grabar la presentación, la voz que se queda dentro (§44.6)', () => {
  beforeEach(() => {
    reiniciarGrabadora();
    reiniciarSalida();
  });

  it('contar tarda más que pasar, y por eso la grabación pisa el ensayo', () => {
    /*
     * El suelo de la grabación por encima del suelo del ensayo NO es un ajuste
     * de dificultad: es la lección entera. Sin esto, un alumno que pulsa igual
     * de rápido grabando que ensayando saca los mismos seis números y el
     * encargo «mira los tiempos» no tiene nada que mirar.
     */
    for (const d of GUION_GRABALA.mazo().diapositivas) {
      expect(estimadoNarrando(d)).toBeGreaterThan(estimadoDe(d));
    }
  });

  it('los intervalos con los que llega son los de un ensayo de verdad, no un número escrito', () => {
    // Se derivan de `estimadoDe`, o sea del suelo que el propio programa habría
    // puesto ensayando. Un intervalo por debajo de ese suelo sería un ensayo
    // que este programa no puede producir: un dato imposible con cara de dato.
    const m = GUION_GRABALA.mazo();
    m.diapositivas.forEach((d, i) => {
      expect(d.intervalo).toBe(ENSAYO[i]);
      expect(d.intervalo).toBe(estimadoDe(d));
      expect(d.narrada).toBeUndefined();
    });
    expect(TOTAL_ENSAYADO).toBe(ENSAYO.reduce((a, b) => a + b, 0));
  });

  it('grabar deja las DOS cosas, y quitar la narración se lleva sólo una', () => {
    const m0 = GUION_GRABALA.mazo();
    const m1 = grabarEn(m0, 2, 40);
    expect(m1.diapositivas[2].intervalo).toBe(40);
    expect(m1.diapositivas[2].narrada).toBe(true);
    // Y no toca a las otras: grabar una es grabar una.
    expect(m1.diapositivas[3].narrada).toBeUndefined();

    const mudo = quitarNarracion(m1);
    expect(cuantasNarradas(mudo)).toBe(0);
    // El tiempo se queda, que es lo que promete el cuadro de la advertencia. Si
    // esto se cayera, la presentación dejaría de pasar sola y el aviso que el
    // alumno acaba de leer sería mentira.
    expect(mudo.diapositivas[2].intervalo).toBe(40);
  });

  it('tocar una diapositiva grabada le quita la voz: la narración era de lo que había', () => {
    const m = grabarEn(GUION_GRABALA.mazo(), 0, 30);
    const tocada = conLaActiva(m, (d) => ({ ...d, notas: 'otra cosa' }));
    expect(tocada.diapositivas[0].narrada).toBeUndefined();
    expect(tocada.diapositivas[0].intervalo).toBeUndefined();
  });

  it('las tomas cuentan lo que el archivo no guarda, y sobreviven a quitar la voz', () => {
    [0, 1, 2, 3, 4, 5].forEach(apuntarToma);
    apuntarToma(LA_QUE_SE_REPITE);
    expect(cuantasGrabadas()).toBe(6);
    expect(seRegrabo(LA_QUE_SE_REPITE)).toBe(true);
    expect(masQueLaPrimera(LA_QUE_SE_REPITE)).toBe(true);

    // Seguir hasta el final desde la tres es jugar BIEN, y tiene que seguir
    // valiendo: es lo que hace PowerPoint y lo que hace cualquiera.
    [3, 4, 5].forEach(apuntarToma);
    expect(masQueLaPrimera(LA_QUE_SE_REPITE)).toBe(true);

    // Volver a empezar desde el principio, en cambio, no cuenta: cada partida
    // desde cero, que es como llega el alumno que se equivoca.
    reiniciarGrabadora();
    [0, 1, 2, 3, 4, 5].forEach(apuntarToma);
    [0, 1, 2, 3, 4, 5].forEach(apuntarToma);
    expect(masQueLaPrimera(LA_QUE_SE_REPITE)).toBe(false);

    // Y se puede arreglar volviendo a la tres, que es lo importante: ningún
    // error deja un encargo cerrado para el resto de la partida (§44.5 A).
    apuntarToma(LA_QUE_SE_REPITE);
    expect(masQueLaPrimera(LA_QUE_SE_REPITE)).toBe(true);
  });

  it('ningún encargo de «Que hable sola» deshace a otro', () => {
    /*
     * La misma prueba jugada que §44.5, y aquí hacía falta más que nunca: el
     * último encargo QUITA LA VOZ de las seis, o sea deshace a ojos vista lo
     * que hizo el segundo. Que no lo mande de vuelta depende de que «grábalas
     * las seis» se mire contra la grabadora —lo que pasó— y no contra el mazo
     * —lo que hay ahora—. Si alguien cambia ese predicado, esta prueba se cae
     * antes de que se caiga un alumno.
     */
    const documento = GUION_GRABALA.pasos
      .map((p, i) => ({ i, logro: p.logro }))
      .filter((x) => x.logro.tipo === 'documento');
    expect(documento.map((x) => x.i)).toEqual([1, 2, 5, 7]);
    const predicados = documento.map(
      (x) => (x.logro as { comprueba: (m: Mazo) => boolean }).comprueba,
    );

    let m = GUION_GRABALA.mazo();
    for (const p of predicados) expect(p(m)).toBe(false);

    const jugadas: (() => void)[] = [
      // 2 · grabarlas las seis, contándolas.
      () => {
        m.diapositivas.forEach((_, i) => {
          m = grabarEn(m, i, estimadoNarrando(m.diapositivas[i]));
          apuntarToma(i);
        });
      },
      // 3 · repetir sólo la tres.
      () => {
        m = grabarEn(m, LA_QUE_SE_REPITE, estimadoNarrando(m.diapositivas[LA_QUE_SE_REPITE]) + 3);
        apuntarToma(LA_QUE_SE_REPITE);
      },
      // 6 · sacar el video, que dura la suma de los intervalos de la voz.
      () => {
        exportar(m, GUION_GRABALA.archivo, 'video');
      },
      // 8 · callarla.
      () => {
        m = quitarNarracion(m);
      },
    ];

    const hechos: ((m: Mazo) => boolean)[] = [];
    jugadas.forEach((jugar, i) => {
      jugar();
      hechos.push(predicados[i]);
      expect(predicados[i](m)).toBe(true);
      for (const antes of hechos) expect(antes(m)).toBe(true);
    });

    // Y el video que salió antes de callarla sigue valiendo: un archivo
    // exportado ya no depende del original, que es la frase con la que cierra
    // el último encargo.
    expect(m.diapositivas.every((d) => !d.narrada)).toBe(true);
    reiniciarGrabadora();
    reiniciarSalida();
  });
});

describe('la pantalla para la que está hecha (§44.3)', () => {
  const DISENOS_ID = Object.keys(DISENOS) as DisenoId[];

  it('los dos juegos de acomodo piden los mismos marcadores', () => {
    /*
     * Lo que impide que las casillas de 16:9 y las de 4:3 se separen. Si un
     * acomodo ganara un marcador en una y no en la otra, cambiar de pantalla
     * haría **aparecer y desaparecer cajas**, que no es lo que hace PowerPoint
     * y que dejaría al alumno con un título que se esfuma.
     */
    for (const id of DISENOS_ID) {
      expect(Object.keys(DISENOS[id].en43).sort()).toEqual(Object.keys(DISENOS[id].casillas).sort());
    }
  });

  it('en las dos formas, cada acomodo cabe y no se pisa a sí mismo', () => {
    for (const forma of ['16-9', '4-3'] as Forma[]) {
      for (const id of DISENOS_ID) {
        const cs = Object.values(casillasDelDiseno(id, forma));
        for (const c of cs) {
          expect(dentroDelLienzo(c, forma)).toBe(true);
          expect(enLaRejilla(c)).toBe(true);
        }
        for (let i = 0; i < cs.length; i++) {
          for (let j = i + 1; j < cs.length; j++) expect(seTapan(cs[i], cs[j])).toBe(false);
        }
      }
    }
  });

  it('lo que está centrado en una lo está en la otra', () => {
    // Un título que se descentra al cambiar de pantalla es el defecto que nadie
    // mira porque sale «casi» bien.
    for (const id of DISENOS_ID) {
      const a = DISENOS[id].casillas.titulo;
      const b = DISENOS[id].en43.titulo;
      if (!a || !b) continue;
      expect(centradaEnH(a, '16-9')).toBe(true);
      expect(centradaEnH(b, '4-3')).toBe(true);
    }
  });

  it('cambiar de forma recoloca los marcadores y NO toca lo que puso el alumno', () => {
    /*
     * La asimetría es la clase entera: el molde se ajusta solo —es de PowerPoint
     * y se llama «Maximizar»— y la foto que colocaste tú se queda donde estaba
     * y deja de caber. Si algún día `cambiarForma` empezara a recolocarlo todo,
     * la clase seguiría pasándose y no enseñaría nada.
     */
    const antes = GUION_PARA_QUE_PANTALLA.mazo();
    const foto = antes.diapositivas[LA_TERCERA].libres[0];
    expect(dentroDelLienzo(foto.casilla, antes.forma)).toBe(true);

    const despues = cambiarForma(antes, '4-3');
    expect(despues.diapositivas[LA_TERCERA].libres[0].casilla).toEqual(foto.casilla);
    expect(dentroDelLienzo(foto.casilla, '4-3')).toBe(false);
    // El título, en cambio, ya vale para la pantalla nueva sin haberlo tocado.
    expect(casillaDe(despues.diapositivas[0], 'titulo', despues.forma)).toEqual(
      DISENOS.portada.en43.titulo,
    );
  });

  it('lo que se sale lo dice el mazo, no el ojo', () => {
    const m = cambiarForma(GUION_PARA_QUE_PANTALLA.mazo(), '4-3');
    expect(loQueSeSale(m, LA_TERCERA)).toEqual(['foto-robot']);
    expect(todoCabe(m)).toBe(false);
    // Y moverla a la izquierda lo arregla, que es el encargo 5.
    const dentro = recolocar({ ...m, activa: LA_TERCERA }, { tipo: 'libre', id: 'foto-robot' }, {
      col: 5,
      fila: 3,
      cols: 4,
      filas: 4,
    });
    expect(loQueSeSale(dentro, LA_TERCERA)).toEqual([]);
    expect(todoCabe(dentro)).toBe(true);
  });

  it('el pie sale en todas y la casilla lo quita sólo de la portada', () => {
    const m0 = GUION_PARA_QUE_PANTALLA.mazo();
    expect(pieDe(m0, 0)).toEqual({ numero: null, texto: null });

    const conPie = ponerElPie(m0, {
      numero: true,
      pie: 'Escuela Secundaria 12',
      sinPieEnPortada: false,
    });
    // En TODAS, incluida la portada: es lo que el alumno ve antes de encontrar
    // la casilla, y es lo que hace falta para que la casilla signifique algo.
    for (let i = 0; i < conPie.diapositivas.length; i++) {
      expect(pieDe(conPie, i)).toEqual({ numero: i + 1, texto: 'Escuela Secundaria 12' });
    }

    const limpia = ponerElPie(conPie, {
      numero: true,
      pie: 'Escuela Secundaria 12',
      sinPieEnPortada: true,
    });
    // La casilla apaga las DOS cosas, y sólo en la de acomodo de portada.
    expect(pieDe(limpia, 0)).toEqual({ numero: null, texto: null });
    expect(pieDe(limpia, 1)).toEqual({ numero: 2, texto: 'Escuela Secundaria 12' });
  });

  it('ningún encargo de «El proyector del salón» deshace a otro', () => {
    const documento = GUION_PARA_QUE_PANTALLA.pasos
      .map((paso, i) => ({ i, logro: paso.logro }))
      .filter((x) => x.logro.tipo === 'documento');
    expect(documento.map((x) => x.i)).toEqual([2, 4, 5, 6]);
    const predicados = documento.map(
      (x) => (x.logro as { comprueba: (m: Mazo) => boolean }).comprueba,
    );

    let m = GUION_PARA_QUE_PANTALLA.mazo();
    for (const p of predicados) expect(p(m)).toBe(false);

    const jugadas: ((x: Mazo) => Mazo)[] = [
      // 3 · a 4:3.
      (x) => cambiarForma(x, '4-3'),
      // 5 · meter la foto dentro.
      (x) =>
        recolocar({ ...x, activa: LA_TERCERA }, { tipo: 'libre', id: 'foto-robot' }, {
          col: 5,
          fila: 3,
          cols: 4,
          filas: 4,
        }),
      // 6 · el pie de la escuela.
      (x) => ponerElPie(x, { numero: true, pie: 'Escuela Secundaria 12', sinPieEnPortada: false }),
      // 7 · y fuera de la portada.
      (x) => ponerElPie(x, { numero: true, pie: 'Escuela Secundaria 12', sinPieEnPortada: true }),
    ];

    const hechos: ((x: Mazo) => boolean)[] = [];
    jugadas.forEach((jugar, i) => {
      m = jugar(m);
      hechos.push(predicados[i]);
      expect(predicados[i](m)).toBe(true);
      for (const antes of hechos) expect(antes(m)).toBe(true);
    });
  });

  it('las dieciocho clases anteriores siguen siendo 16:9 sin decirlo', () => {
    // Sin `forma`, la de siempre. Es lo que permite que este cambio entre sin
    // tocar un solo guion de los que ya estaban.
    for (const g of GUIONES_PPT) {
      if (g === GUION_PARA_QUE_PANTALLA) continue;
      expect(g.mazo().forma).toBeUndefined();
      expect(colsDe(g.mazo().forma)).toBe(COLS);
      expect(anchoDe(g.mazo().forma)).toBe(FORMAS['16-9'].ancho);
    }
  });
});
