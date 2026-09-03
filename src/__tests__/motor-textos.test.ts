/**
 * El motor de Tecnia Textos (doc §36): esquema, comandos y consultas.
 *
 * Todo lo de aquí se prueba sin navegador, y eso no es casualidad: el motor se
 * diseñó para que la parte que decide si un ejercicio está bien —leer el
 * documento— no dependa del DOM. Lo que sí necesita navegador (paginación,
 * halo, cinta) se comprueba manejando la clase de verdad, no aquí.
 */

import { AllSelection, EditorState } from 'prosemirror-state';
import { esquema, ALINEACIONES, FUENTES, TAMANOS } from '@/components/office/motor/esquema';
import {
  COMANDOS,
  COMANDOS_DE_VISTA,
  estaActivo,
  estaInerte,
  tamanoVisible,
} from '@/components/office/motor/comandos';
import {
  bloqueQueContiene,
  bloqueQueEmpiezaCon,
  contarPalabras,
  cuantos,
  cumple,
  leerBloques,
  marcaEnTodoElBloque,
} from '@/components/office/motor/consultas';
import { GUION_LA_CINTA } from '@/components/activities/office/word/guionLaCinta';
import { CINTA_BASICO } from '@/components/activities/office/tecniaTextos';

/* ── utilidades ──────────────────────────────────────────────────────────── */

const { doc, parrafo, titulo, lista_vinetas, item, tabla, fila, celda } = esquema.nodes;

const p = (texto: string, attrs?: Record<string, unknown>) =>
  parrafo.create(attrs ?? null, texto ? esquema.text(texto) : null);

const documento = (...bloques: Parameters<typeof doc.create>[2] extends never ? never[] : ReturnType<typeof p>[]) =>
  doc.create(null, bloques);

const estadoCon = (...bloques: ReturnType<typeof p>[]) =>
  EditorState.create({ doc: doc.create(null, bloques), schema: esquema });

/** Lo que deja Ctrl+A: la selección arranca en la raíz y no dentro de un bloque. */
const todoSeleccionado = (estado: EditorState) =>
  estado.apply(estado.tr.setSelection(new AllSelection(estado.doc)));

/* ── el esquema ──────────────────────────────────────────────────────────── */

describe('el esquema del documento', () => {
  it('el nodo de texto se llama «text», que es lo único que ProseMirror exige', () => {
    // No es preferencia: `NodeType.compile` busca ese nombre exacto y sin él el
    // esquema ni siquiera se construye. Se documentó tras romperlo.
    expect(esquema.nodes.text).toBeDefined();
    expect(esquema.spec.nodes.get('texto')).toBeUndefined();
  });

  it('las tablas quedaron traducidas y siguen siendo tablas', () => {
    // prosemirror-tables no localiza sus nodos por nombre sino por `tableRole`;
    // por eso se pueden renombrar, y por eso hay que comprobar que el rol vive.
    expect(esquema.nodes.tabla.spec.tableRole).toBe('table');
    expect(esquema.nodes.fila.spec.tableRole).toBe('row');
    expect(esquema.nodes.celda.spec.tableRole).toBe('cell');
    expect(esquema.nodes.tabla.spec.content).toBe('fila+');
  });

  it('alineación, sangría e interlineado son del PÁRRAFO, no del texto', () => {
    // Es la lección de §33: se aplican al párrafo entero aunque sólo tengas el
    // cursor dentro. Si fueran marcas, media frase podría estar centrada.
    for (const atributo of ['alineacion', 'sangria', 'interlineado']) {
      expect(esquema.nodes.parrafo.spec.attrs?.[atributo]).toBeDefined();
      expect(esquema.marks[atributo]).toBeUndefined();
    }
  });

  it('el estilo es un TIPO de nodo distinto, no un párrafo con formato', () => {
    expect(esquema.nodes.titulo).toBeDefined();
    expect(esquema.nodes.titulo.name).not.toBe(esquema.nodes.parrafo.name);
  });

  it('la familia y el tamaño sí son marcas, porque cambian en media palabra', () => {
    expect(esquema.marks.fuente).toBeDefined();
    expect(esquema.marks.tamano).toBeDefined();
  });

  it('las tipografías ofrecidas son libres y con métricas compatibles', () => {
    // Calibri y Aptos no se pueden distribuir; estas cuatro sí, y además miden
    // igual que su equivalente de Microsoft, así que el documento no se mueve
    // al abrirse en Word de verdad.
    const nombres = FUENTES.map((f) => f.nombre);
    expect(nombres).toContain('Carlito');
    expect(nombres).toContain('Liberation Sans');
    expect(nombres).not.toContain('Calibri');
    for (const f of FUENTES) expect(f.equivale.length).toBeGreaterThan(0);
  });

  it('los tamaños son los del desplegable de Word y van de menor a mayor', () => {
    expect(TAMANOS).toContain(11);
    expect(TAMANOS).toContain(72);
    expect([...TAMANOS]).toEqual([...TAMANOS].sort((a, b) => a - b));
  });

  it('la imagen sale marcada como atómica para que no la parta una hoja', () => {
    const salida = esquema.nodes.imagen.spec.toDOM?.(
      esquema.nodes.imagen.create({ src: 'x.png', alt: 'x' }),
    ) as [string, Record<string, string>];
    expect(salida[1]['data-atomico']).toBe('1');
  });
});

/* ── los comandos ────────────────────────────────────────────────────────── */

describe('los comandos de la cinta', () => {
  it('todo control de la cinta básica existe o está declarado inerte', () => {
    // Un botón que se ve y no responde es lo que hace un programa de verdad;
    // un botón que se ve y NADIE sabe qué debería hacer es un descuido.
    const conocidos = new Set([...Object.keys(COMANDOS), ...Object.keys(COMANDOS_DE_VISTA)]);
    const sinComando = CINTA_BASICO.flatMap((pes) => pes.grupos.flatMap((g) => g.controles))
      .map((c) => c.id)
      .filter((id) => !conocidos.has(id));
    // Los que quedan son los que aún no existen; se listan a propósito para que
    // añadir uno nuevo obligue a decidir aquí si ya funciona.
    expect(sinComando.sort()).toEqual(
      ['cuadro', 'encabezado', 'formas', 'imagen', 'numero', 'pegar', 'pie'].sort(),
    );
  });

  it('centrar cambia el atributo del párrafo donde está el cursor', () => {
    const estado = estadoCon(p('Kermés de la escuela'), p('Otro párrafo'));
    let nuevo = estado;
    COMANDOS.centro(estado, (tr) => { nuevo = estado.apply(tr); });
    expect(leerBloques(nuevo.doc)[0].alineacion).toBe('centro');
    expect(leerBloques(nuevo.doc)[1].alineacion).toBe('izquierda');
  });

  it('el botón se hunde cuando el formato YA está puesto donde está el cursor', () => {
    const centrado = estadoCon(p('Kermés', { alineacion: 'centro' }));
    expect(estaActivo(centrado, 'centro')).toBe(true);
    expect(estaActivo(centrado, 'izquierda')).toBe(false);
  });

  it('las cuatro alineaciones se excluyen entre sí', () => {
    for (const a of ALINEACIONES) {
      const estado = estadoCon(p('Texto', { alineacion: a }));
      const hundidas = ALINEACIONES.filter((otra) => estaActivo(estado, otra));
      expect(hundidas).toEqual([a]);
    }
  });

  it('el interlineado rota sencillo → 1.5 → doble → sencillo, como Word', () => {
    let estado = estadoCon(p('Texto'));
    const vistos: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      COMANDOS.interlineado(estado, (tr) => { estado = estado.apply(tr); });
      vistos.push(leerBloques(estado.doc)[0].interlineado);
    }
    expect(vistos).toEqual([1.5, 2, 0, 1.5]);
  });

  it('la sangría sube y baja por pasos y no se pasa de cero', () => {
    let estado = estadoCon(p('Texto'));
    COMANDOS['quitar-sangria'](estado, (tr) => { estado = estado.apply(tr); });
    expect(leerBloques(estado.doc)[0].sangria).toBe(0);
    COMANDOS.sangria(estado, (tr) => { estado = estado.apply(tr); });
    expect(leerBloques(estado.doc)[0].sangria).toBe(1);
  });

  it('poner Título 1 cambia el tipo de nodo, no el tamaño de la letra', () => {
    let estado = estadoCon(p('Un título'));
    COMANDOS.titulo1(estado, (tr) => { estado = estado.apply(tr); });
    const bloque = leerBloques(estado.doc)[0];
    expect(bloque.tipo).toBe('titulo');
    expect(bloque.nivel).toBe(1);
    expect(bloque.marcasParciales).toEqual([]);
  });
});

/* ── las consultas ───────────────────────────────────────────────────────── */

describe('leer el documento para corregir', () => {
  const conMarcas = doc.create(null, [
    parrafo.create(null, [
      esquema.text('Mitad '), // sin negrita
      esquema.text('negra', [esquema.marks.negrita.create()]),
    ]),
    titulo.create({ nivel: 1 }, esquema.text('Un encabezado')),
    lista_vinetas.create(null, [
      item.create(null, p('Uno')),
      item.create(null, p('Dos')),
    ]),
    tabla.create(null, [fila.create(null, [celda.create(null, p('a')), celda.create(null, p('b'))])]),
  ]);

  it('distingue una marca que cubre TODO el bloque de una que sólo cubre un trozo', () => {
    // La diferencia importa: «pon el título en negrita» no está hecho si sólo
    // se ennegreció una palabra.
    const bloque = leerBloques(conMarcas)[0];
    expect(bloque.marcasParciales).toContain('negrita');
    expect(bloque.marcasCompletas).not.toContain('negrita');
  });

  it('cuenta por tipo, y los títulos por nivel', () => {
    expect(cuantos(conMarcas, 'titulo1')).toBe(1);
    expect(cuantos(conMarcas, 'titulo2')).toBe(0);
    expect(cuantos(conMarcas, 'tabla')).toBe(1);
    expect(cuantos(conMarcas, 'lista_vinetas')).toBe(1);
  });

  it('encuentra un bloque por cómo empieza o por lo que contiene', () => {
    expect(bloqueQueEmpiezaCon(conMarcas, 'mitad')?.tipo).toBe('parrafo');
    expect(bloqueQueContiene(conMarcas, 'encabezado')?.nivel).toBe(1);
    expect(bloqueQueEmpiezaCon(conMarcas, 'no existe')).toBeNull();
  });

  it('`cumple` exige todas las condiciones a la vez sobre UN mismo bloque', () => {
    expect(cumple(conMarcas, { contiene: 'encabezado', tipo: 'titulo', nivel: 1 })).toBe(true);
    // El texto está en el párrafo y el nivel en el título: ningún bloque cumple ambas.
    expect(cumple(conMarcas, { contiene: 'mitad', tipo: 'titulo' })).toBe(false);
  });

  it('la marca con valor se comprueba sobre el bloque ENTERO', () => {
    const grande = doc.create(null, [
      parrafo.create(null, [esquema.text('Kermés', [esquema.marks.tamano.create({ pt: 20 })])]),
    ]);
    const aMedias = doc.create(null, [
      parrafo.create(null, [
        esquema.text('Ker', [esquema.marks.tamano.create({ pt: 20 })]),
        esquema.text('més'),
      ]),
    ]);
    const chico = doc.create(null, [
      parrafo.create(null, [esquema.text('Kermés', [esquema.marks.tamano.create({ pt: 12 })])]),
    ]);
    const veinte = (d: typeof grande) =>
      marcaEnTodoElBloque(d, 'Kermés', 'tamano', (a) => Number(a.pt) >= 20);
    expect(veinte(grande)).toBe(true);
    expect(veinte(aMedias)).toBe(false);
    expect(veinte(chico)).toBe(false);
  });

  it('cuenta palabras como la barra de estado', () => {
    expect(contarPalabras(documento(p('Uno dos tres')))).toBe(3);
    expect(contarPalabras(documento(p('   ')))).toBe(0);
  });
});

/* ── el guion de la primera clase ────────────────────────────────────────── */

describe('of-word-la-cinta · el guion', () => {
  const pasos = GUION_LA_CINTA.pasos;

  it('tiene siete encargos con id único', () => {
    expect(pasos).toHaveLength(7);
    expect(new Set(pasos.map((x) => x.id)).size).toBe(7);
  });

  it('cada encargo dice qué hacer, qué se aprende y cómo ayudar si falla', () => {
    for (const paso of pasos) {
      expect(paso.instruccion.length).toBeGreaterThan(30);
      expect(paso.pista.length).toBeGreaterThan(20);
      expect(paso.aprendido.length).toBeGreaterThan(20);
      expect(paso.titulo.length).toBeGreaterThan(0);
    }
  });

  it('el encargo de elegir grupo NO lleva halo', () => {
    // Es la pregunta bisagra de la clase; señalar el grupo la contestaría.
    const eleccion = pasos.find((x) => x.logro.tipo === 'eleccion');
    expect(eleccion).toBeDefined();
    expect(eleccion!.senal).toBeUndefined();
  });

  it('la respuesta correcta de la elección es el grupo Fuente', () => {
    const l = pasos.find((x) => x.logro.tipo === 'eleccion')!.logro;
    if (l.tipo !== 'eleccion') throw new Error('tipo inesperado');
    expect(l.opciones[l.correcta]).toBe('Fuente');
    expect(l.opciones).toHaveLength(4);
  });

  it('los encargos que cambian el documento se corrigen leyéndolo', () => {
    const deDocumento = pasos.filter((x) => x.logro.tipo === 'documento');
    expect(deDocumento.length).toBeGreaterThanOrEqual(3);
  });

  it('la corrección de «centra el título» acepta el documento centrado y rechaza el otro', () => {
    const paso = pasos.find((x) => x.id === 'centrar-titulo')!;
    if (paso.logro.tipo !== 'documento') throw new Error('tipo inesperado');
    const centrado = documento(p('Kermés de la escuela', { alineacion: 'centro' }));
    const suelto = documento(p('Kermés de la escuela'));
    expect(paso.logro.comprueba(centrado)).toBe(true);
    expect(paso.logro.comprueba(suelto)).toBe(false);
  });

  it('cada señal apunta a un grupo o control que existe en la cinta básica', () => {
    const grupos = new Set(CINTA_BASICO.flatMap((pes) => pes.grupos.map((g) => g.id)));
    const controles = new Set(
      CINTA_BASICO.flatMap((pes) => pes.grupos.flatMap((g) => g.controles.map((c) => c.id))),
    );
    // Los desplegables de tipografía no viven en `CINTA_BASICO` porque no son
    // botones; se nombran aquí para que la lista siga siendo exhaustiva.
    const extra = new Set(['fuente-familia', 'fuente-tamano']);
    const pestanas = new Set(CINTA_BASICO.map((pes) => pes.id));
    for (const paso of pasos) {
      if (!paso.senal) continue;
      if (paso.senal.pestana) expect(pestanas.has(paso.senal.pestana)).toBe(true);
      if (paso.senal.grupo) expect(grupos.has(paso.senal.grupo)).toBe(true);
      if (paso.senal.control) {
        expect(controles.has(paso.senal.control) || extra.has(paso.senal.control)).toBe(true);
      }
    }
  });

  it('tiene portada de práctica, y dice tema, objetivo, arco, requisitos y ayuda', () => {
    // Sin esto el alumno entra a un Word con un documento ajeno y sin saber de
    // qué va la clase. Es lo que pidió Cristofer al usarlo por primera vez.
    const p = GUION_LA_CINTA.portada;
    expect(p).toBeDefined();
    expect(p!.situacion).toMatch(/Word/i);
    expect(p!.tema.length).toBeGreaterThan(15);
    expect(p!.objetivo.length).toBeGreaterThan(60);
    expect(p!.vasAHacer.length).toBeGreaterThanOrEqual(3);
    expect(p!.vasAHacer.length).toBeLessThanOrEqual(5);
    expect(p!.requisitos.length).toBeGreaterThan(0);
    expect(p!.ayuda.length).toBeGreaterThan(30);
  });

  it('el objetivo se enuncia como resultado del alumno, no como temario', () => {
    // «vas a saber encontrar», no «vamos a ver la cinta»: es la diferencia entre
    // una meta que el alumno puede comprobar y un índice.
    const objetivo = GUION_LA_CINTA.portada!.objetivo.toLowerCase();
    expect(objetivo).toMatch(/\bsepas\b|\bsabrás\b|\bpodrás\b|\bseas capaz\b/);
  });

  it('la ayuda anunciada coincide con la que el motor da de verdad', () => {
    /*
     * Esta prueba exigía lo CONTRARIO hasta el §37: que la portada avisara de
     * que el aro señala el grupo y sólo baja al botón tras dos fallos. El
     * cliente revocó esa escalada —quiere que se guíe la mano desde el primer
     * segundo— y la prueba se giró con ella. Se conserva porque su trabajo no
     * era defender aquel diseño sino algo que no caduca: **que la portada no
     * prometa una ayuda distinta de la que el motor da**. Falló en cuanto
     * cambió el motor, que es exactamente para lo que estaba.
     */
    const ayuda = GUION_LA_CINTA.portada!.ayuda.toLowerCase();
    expect(ayuda).toMatch(/botón exacto|el botón que/);
    expect(ayuda).toContain('enséñamelo');
    // Y no puede quedar ni un rastro de la escalada vieja.
    expect(ayuda).not.toMatch(/dos veces|segundo fallo/);
  });

  it('ningún encargo de acción se queda señalando sólo el grupo', () => {
    // Una señal con `grupo` y sin `control` no saca rótulo, ni ficha, ni
    // «Enséñamelo»: es media guía, y desde §37 no vale.
    const solts = GUION_LA_CINTA.pasos.filter((p) => p.senal?.grupo && !p.senal?.control);
    expect(solts.map((p) => p.id)).toEqual([]);
  });

  it('el documento de partida trae lo que los encargos van a pedir', () => {
    expect(GUION_LA_CINTA.html).toContain('Kermés de la escuela');
    expect(GUION_LA_CINTA.html).toContain('<ul>');
    // La tabla NO viene hecha: insertarla es el encargo 6.
    expect(GUION_LA_CINTA.html).not.toContain('<table');
    expect(GUION_LA_CINTA.archivo).toMatch(/\.docx$/);
  });
});

/* ── lo que encontró la auditoría (§36.8) ────────────────────────────────── */

describe('un botón que ya está puesto no es un botón que no existe', () => {
  // El defecto: `estaInerte` preguntaba «¿el comando devolvió false?», y un
  // comando de atributo devuelve false cuando el atributo YA vale eso. Así,
  // centrar un párrafo apagaba el botón Centrar y su ayuda pasaba a decir «aún
  // no disponible» — la misma frase que Pegar, que de verdad no existe. Justo
  // después de usarlo bien. El encargo 7 de la clase vive de lo contrario.
  it('centrar un párrafo ya centrado deja el botón vivo y hundido', () => {
    const centrado = estadoCon(p('Kermés', { alineacion: 'centro' }));
    expect(estaActivo(centrado, 'centro')).toBe(true);
    expect(estaInerte(centrado, 'centro')).toBe(false);
  });

  it('«alinear a la izquierda» no nace inerte, que es la alineación de partida', () => {
    expect(estaInerte(estadoCon(p('Texto')), 'izquierda')).toBe(false);
  });

  it('la sangría en cero y el tamaño en el tope siguen vivos, como en Word', () => {
    const suelo = estadoCon(p('Texto', { sangria: 0 }));
    expect(estaInerte(suelo, 'quitar-sangria')).toBe(false);
    const techo = estadoCon(parrafo.create(null, esquema.text('Texto', [esquema.marks.tamano.create({ pt: 72 })])));
    expect(estaInerte(techo, 'mayor')).toBe(false);
  });

  it('lo que de verdad no se puede hacer aquí sí queda inerte', () => {
    // La lección se conserva: fuera de una tabla, combinar celdas no tiene
    // sentido y el botón tiene que decirlo.
    const fuera = estadoCon(p('Texto'));
    expect(estaInerte(fuera, 'combinar')).toBe(true);
    expect(estaInerte(fuera, 'quitar-fila')).toBe(true);
    expect(estaInerte(fuera, 'pegar')).toBe(true);
  });
});

describe('los interruptores se apagan por donde se encendieron', () => {
  it('viñetas puestas, viñetas quitadas', () => {
    let estado = estadoCon(p('Puestos confirmados'));
    COMANDOS.vinetas(estado, (tr) => { estado = estado.apply(tr); });
    expect(cuantos(estado.doc, 'lista_vinetas')).toBe(1);
    COMANDOS.vinetas(estado, (tr) => { estado = estado.apply(tr); });
    expect(cuantos(estado.doc, 'lista_vinetas')).toBe(0);
    expect(leerBloques(estado.doc)[0].tipo).toBe('parrafo');
  });

  it('el otro botón de lista cambia el tipo, no se queda mudo', () => {
    let estado = estadoCon(p('Puestos confirmados'));
    COMANDOS.vinetas(estado, (tr) => { estado = estado.apply(tr); });
    COMANDOS.numeros(estado, (tr) => { estado = estado.apply(tr); });
    expect(cuantos(estado.doc, 'lista_numeros')).toBe(1);
    expect(cuantos(estado.doc, 'lista_vinetas')).toBe(0);
  });

  it('WordArt se quita desde el mismo botón que lo puso', () => {
    let estado = estadoCon(p('Kermés de la escuela'));
    COMANDOS.wordart(estado, (tr) => { estado = estado.apply(tr); });
    expect(leerBloques(estado.doc)[0].tipo).toBe('titular');
    expect(estaActivo(estado, 'wordart')).toBe(true);
    COMANDOS.wordart(estado, (tr) => { estado = estado.apply(tr); });
    expect(leerBloques(estado.doc)[0].tipo).toBe('parrafo');
  });

  it('el color de letra se anuncia hundido cuando el texto ya está pintado', () => {
    const pintado = estadoCon(
      parrafo.create(null, esquema.text('Kermés', [esquema.marks.color.create({ color: '#c2410c' })])),
    );
    expect(estaActivo(pintado, 'color')).toBe(true);
    expect(estaActivo(estadoCon(p('Kermés')), 'color')).toBe(false);
  });
});

describe('el cuadro de tamaño dice la verdad', () => {
  // Decía 11 dentro de un Título 1 —que se pinta a 16 pt— y dentro de un
  // WordArt, que va a 32. Es el único cuadro que los encargos 3 y 4 mandan
  // mirar: si miente, la clase no se puede seguir.
  it('en un párrafo normal, 11', () => {
    expect(tamanoVisible(estadoCon(p('Texto')))).toBe(11);
  });

  it('en un Título 1, 16; en un Título 2, 13; en un WordArt, 32', () => {
    expect(tamanoVisible(estadoCon(titulo.create({ nivel: 1 }, esquema.text('T'))))).toBe(16);
    expect(tamanoVisible(estadoCon(titulo.create({ nivel: 2 }, esquema.text('T'))))).toBe(13);
    expect(tamanoVisible(estadoCon(esquema.nodes.titular.create(null, esquema.text('T'))))).toBe(32);
  });

  it('una marca de tamaño manda sobre el tamaño del estilo', () => {
    const conMarca = titulo.create({ nivel: 1 }, esquema.text('T', [esquema.marks.tamano.create({ pt: 24 })]));
    expect(tamanoVisible(estadoCon(conMarca))).toBe(24);
  });
});

describe('con todo el documento seleccionado', () => {
  // Con Ctrl+A la selección arranca en la raíz, así que `bloqueActual` devolvía
  // el nodo `doc`, que no tiene interlineado: el botón se apagaba y no hacía
  // nada. Es la forma más natural de dar formato a un documento entero.
  it('el interlineado se aplica a todos los párrafos', () => {
    let estado = todoSeleccionado(estadoCon(p('Uno'), p('Dos'), p('Tres')));
    expect(estaInerte(estado, 'interlineado')).toBe(false);
    COMANDOS.interlineado(estado, (tr) => { estado = estado.apply(tr); });
    expect(leerBloques(estado.doc).map((b) => b.interlineado)).toEqual([1.5, 1.5, 1.5]);
  });

  it('centrar centra los tres párrafos', () => {
    let estado = todoSeleccionado(estadoCon(p('Uno'), p('Dos'), p('Tres')));
    COMANDOS.centro(estado, (tr) => { estado = estado.apply(tr); });
    expect(leerBloques(estado.doc).map((b) => b.alineacion)).toEqual(['centro', 'centro', 'centro']);
  });
});

describe('el encargo no se puede quedar sin salida', () => {
  // Un niño teclea con el título seleccionado —el estado que el encargo 4 le
  // manda alcanzar— y borra «Kermés de la escuela». Si la corrección busca ese
  // texto literal, el encargo deja de poderse cumplir para siempre.
  const enc4 = GUION_LA_CINTA.pasos.find((x) => x.id === 'agrandar-titulo');
  const enc5 = GUION_LA_CINTA.pasos.find((x) => x.id === 'centrar-titulo');

  it('el encargo 4 se cumple aunque el título ya no diga lo que decía', () => {
    const renombrado = doc.create(null, [
      parrafo.create(null, esquema.text('H', [esquema.marks.tamano.create({ pt: 28 })])),
      p('Sábado 12 de octubre'),
    ]);
    expect(enc4?.logro.tipo).toBe('documento');
    if (enc4?.logro.tipo === 'documento') expect(enc4.logro.comprueba(renombrado)).toBe(true);
  });

  it('el encargo 5 se cumple aunque el título ya no diga lo que decía', () => {
    const renombrado = doc.create(null, [p('H', { alineacion: 'centro' }), p('Sábado 12 de octubre')]);
    if (enc5?.logro.tipo === 'documento') expect(enc5.logro.comprueba(renombrado)).toBe(true);
  });

  it('y sigue rechazando el documento sin hacer', () => {
    const intacto = doc.create(null, [p('Kermés de la escuela'), p('Sábado 12 de octubre')]);
    if (enc4?.logro.tipo === 'documento') expect(enc4.logro.comprueba(intacto)).toBe(false);
    if (enc5?.logro.tipo === 'documento') expect(enc5.logro.comprueba(intacto)).toBe(false);
  });
});
