/**
 * El modo guía de Tecnia Hojas (§37 aplicado a Excel).
 *
 * ── EL REPARTO, QUE ES LO ÚNICO QUE HAY QUE ENTENDER DE ESTE ARCHIVO ────────
 *
 * **Aquí no hay mecanismo, sólo contenido.** Ni una línea de lógica, ni una
 * condición, ni un recorrido. `ubicar`, `ubicarPestana`, `comoLlegar` y
 * `explicarDesvio` viven en `office/motor/guia.ts` y **reciben las tablas por
 * parámetro** —`queHace` y `desplegables` son argumentos, no constantes
 * capturadas—, así que Excel las usa tal cual pasándoles las tres de abajo.
 *
 * Ése es el reparto que estrenó Word en el §37 y que PowerPoint heredó en el
 * §40 sin tocar el motor: la sala nueva escribe **su contenido** y **se lleva el
 * mecanismo entero gratis**. Excel es la tercera sala y lo copia **sin pagar
 * nada**: cero líneas de lógica nuevas para tener señalador, ficha de
 * herramienta, «Enséñamelo» y el recado del desvío.
 *
 * Y no es ahorro de tecleo, es la lección de §40.6 dicha al revés: si esta sala
 * copiara las cuatro funciones para «adaptarlas a Excel», habría tres guías que
 * el día que cambie una regla —cómo se dice un domicilio, qué lleva el recado
 * del desvío— se separarían en silencio y ninguna prueba lo vería, porque son
 * cadenas de texto. Lo que se copia se separa.
 *
 * ── QUÉ SE ESCRIBE Y QUÉ NO ────────────────────────────────────────────────
 *
 * **El sitio no se escribe: se deriva.** Dónde vive un botón lo sabe la cinta
 * (`activities/office/tecniaHojas.ts`), y `ubicar()` lo lee de ahí. Si mañana
 * Autosuma se muda de grupo, la guía se muda con ella el mismo día y sin que
 * nadie toque una clase. Escribir «esto está en Inicio → Edición» en cada uno de
 * los encargos de las veintitrés clases sería garantizar sitios mintiendo.
 *
 * **Lo que sí se escribe, una vez, es QUÉ HACE cada herramienta**, y de esa
 * única frase salen a la vez el rótulo del aro, la ficha que se lee ANTES de
 * pulsar y la explicación de lo que se pulsó de más al equivocarse. Por eso no
 * se pueden contradecir: no son tres textos, es uno.
 *
 * Cómo se escribe una entrada: **el efecto, no el nombre**, en la lengua del
 * alumno. «Aplica formato de moneda» no enseña nada, porque el botón ya se llama
 * Moneda. Y donde el temario del §45.2 enseñe una trampa, **la frase la lleva
 * dentro**, porque la ficha de guía es el único texto que el alumno lee en el
 * segundo exacto en que le importa. Las tres trampas de esta sala:
 *
 *   1. **El formato no cambia el dato.** `moneda`, `porcentaje`, `millares`,
 *      `decimal-mas` y `decimal-menos` cambian lo que se VE; el número de dentro
 *      sigue siendo el mismo y se sigue pudiendo sumar (bloque 6).
 *   2. **La celda guarda la regla y enseña el resultado.** `fn-suma`,
 *      `mostrar-formulas` y `barra-de-formulas` dicen las dos mitades de la idea
 *      más cara del grado Básico (bloque 13).
 *   3. **El vacío no es cero.** `fn-contar` y `fn-contara` sólo se entienden
 *      puestas una al lado de la otra, y su diferencia es el bloque 15 entero.
 */

import type { PestanaExcel } from '@/components/activities/office/tecniaHojas';
import type { TablaDesplegables } from '@/components/office/motor/guia';

export const QUE_HACE_EXCEL: Record<string, string> = {
  /* ── Inicio · Portapapeles — bloque 11 ── */
  pegar:
    'Suelta donde estés lo último que copiaste. Si lo que copiaste era una fórmula, lo que llega no es el resultado: es la regla, ya corregida para su nuevo sitio.',
  copiar:
    'Se queda con una copia de lo seleccionado sin quitarlo de su lugar. Se lleva las tres cosas de la celda: el dato, su formato y su fórmula.',
  cortar:
    'Se lleva lo seleccionado para soltarlo en otro lado: desaparece de aquí hasta que lo pegues. Ojo a la diferencia con copiar: lo que se MUEVE no se corrige, y una fórmula cortada sigue mirando exactamente las mismas celdas de antes.',
  'pegar-valores':
    'Trae el resultado y deja la fórmula atrás. La celda pasa de guardar una regla a guardar un número: si mañana cambian los datos de arriba, esto ya no se entera. Se usa cuando quieres congelar un total.',
  'pegar-formato':
    'Trae sólo la pinta de lo que copiaste —la letra, el color, el tipo de número— y no toca lo que hay escrito en la celda.',
  'copiar-formato':
    'La brocha va en dos tiempos: párate en la celda que ya tiene la pinta que quieres, púlsala, y luego marca dónde soltarla. Copia sólo la PINTA —la letra, el color, los bordes, el tipo de número— y no toca ni una palabra de lo que hay escrito.',

  /* ── Inicio · Fuente — bloque 9 ── */
  negrita: 'Engrosa la letra de la celda para que un encabezado o un total destaque entre cien números iguales.',
  cursiva: 'Inclina la letra. En una hoja se usa poco: para una nota o una aclaración al lado del dato.',
  subrayado:
    'Le pone una raya debajo al contenido. Ojo: en una hoja esa raya se confunde con el borde de la celda, y no son la misma cosa.',
  'color-letra':
    'Cambia el color del texto de la celda. Que un número esté en rojo no lo vuelve negativo: para la hoja sigue valiendo exactamente lo mismo.',
  'color-relleno':
    'Pinta el fondo de la celda entera. Sirve para que la fila de encabezados se distinga de los datos de un vistazo.',
  bordes:
    'Dibuja las rayas de la celda. La cuadrícula gris de la pantalla no se imprime; estos bordes sí — es la diferencia entre ver una tabla y tenerla.',

  /* ── Inicio · Alineación — bloques 9 y 10 ── */
  'alinear-izquierda':
    'Pega el contenido al lado izquierdo de la celda. Ojo: al alinear un número a la izquierda pierdes la pista que te decía si la hoja lo tomó como número o como texto.',
  'alinear-centro': 'Deja el contenido en el centro de la celda. Es lo normal en un encabezado de columna.',
  'alinear-derecha':
    'Pega el contenido al lado derecho de la celda, que es donde los números se acomodan solos cuando la hoja los reconoce.',
  /*
   * Las dos frases del bloque 10, y las dos dicen algo que sólo se puede decir
   * aquí. La de ajustar el texto **no promete el alto de Excel**: en esta ventana
   * el alto de fila es constante (§47.3), así que los renglones se aprietan para
   * caber en el que hay. Se dice en voz alta y con la diferencia puesta, porque
   * la ficha de guía es el único texto que el alumno lee en el segundo exacto en
   * que le importa, y prometerle una fila que crece sería mandarlo a mirar algo
   * que no va a pasar.
   */
  'ajustar-texto':
    'Parte el texto en varios renglones DENTRO de la celda, en vez de dejarlo salirse encima de la de al lado. Aquí los renglones se aprietan para caber en el alto que hay; en el Excel de tu casa, además, la fila se estira sola hacia abajo.',
  'combinar-centrar':
    'Junta varias celdas en una sola y centra el título. Ojo a lo que cuesta: se queda SÓLO con lo que hay en la primera y tira lo demás —te lo avisa antes—, y sobre celdas combinadas no se ordena ni se filtra bien. Cómodo para un encabezado y estorbo para todo lo demás. Se pulsa otra vez para separarlas, pero lo que se tiró ya no vuelve.',

  /* ── Inicio · Número — bloque 6, la idea más cara del grado ── */
  'formato-numero':
    'Elige CÓMO se enseña el contenido: número, texto, fecha, moneda o porcentaje. Es lo que separa una hoja de cálculo de una tabla de Word: aquí la celda tiene tipo.',
  moneda: 'Pone el signo de pesos y dos decimales. No cambia el número: 1500 sigue siendo 1500 y se puede sumar.',
  porcentaje:
    'Enseña el número como porcentaje. Cuidado con la trampa: 0.15 se ve como 15 %, porque un porcentaje es una parte de uno; si escribes 15 y le pones este formato, verás 1500 %.',
  millares:
    'Le pone separador de miles y dos decimales: 1234567 se lee 1,234,567.00. Las comas son de la pantalla; dentro sigue siendo un número limpio que se puede sumar.',
  'decimal-mas':
    'Enseña un decimal más. El número guardado no cambia ni un pelo: sólo estabas viendo menos de lo que hay.',
  'decimal-menos':
    'Enseña un decimal menos, redondeando LO QUE SE VE. El valor de dentro sigue completo, y por eso a veces una columna no cuadra con el total: la hoja suma lo que guarda, no lo que lees.',

  /* ── Inicio · Celdas — bloques 7 y 12 ── */
  'insertar-fila':
    'Mete una fila nueva y empuja hacia abajo todo lo que había. Las fórmulas que miraban esas celdas se mueven con ellas: no se rompen.',
  'insertar-columna':
    'Mete una columna nueva y empuja las demás hacia la derecha. Todo lo que estaba a la derecha cambia de letra, y las fórmulas se enteran solas.',
  'borrar-fila':
    'Quita la fila entera y sube las de abajo a tapar el hueco. No es lo mismo que borrar su contenido: aquí la fila deja de existir.',
  'borrar-columna':
    'Quita la columna entera y recorre las de la derecha. Si alguna fórmula miraba a esa columna, se queda sin a quién mirar y contesta #¡REF!.',
  'ancho-columna':
    'Cambia lo ancha que es la columna. Cuando una celda enseña ##### no hay ningún error: es un número que no cabe, y sólo pide más ancho.',
  'alto-fila':
    'Cambia lo alta que es la fila. Se usa cuando un texto ajustado necesita varios renglones, o para dar aire entre dos bloques de datos.',
  'mover-hoja':
    'Cambia de lugar la hoja entre las lengüetas de abajo. Sólo cambia el orden en que las ves: las fórmulas llaman a las hojas por su NOMBRE, así que una que dijera =Gastos!D8 sigue valiendo lo mismo aunque Gastos se vaya al final.',
  'color-hoja':
    'Pinta la lengüeta de esta hoja. En un libro de doce hojas es lo que te deja encontrar la del mes de un vistazo; el color no cambia ni un dato de dentro.',

  /* ── Inicio · Edición — bloques 8, 14 y 19 ── */
  autosuma:
    'Escribe una fórmula de SUMA adivinando qué números querías sumar. Revisa siempre el rango que eligió: acierta casi siempre, y casi siempre no es siempre.',
  'rellenar-abajo':
    'Copia hacia abajo lo que tiene la primera celda. Si era una fórmula, cada copia se corrige sola para mirar SU fila: eso es lo que te ahorra escribir cien veces lo mismo.',
  'rellenar-derecha':
    'Copia hacia la derecha lo de la primera celda, corrigiendo las referencias columna por columna.',
  'rellenar-serie':
    'No copia: CONTINÚA. Escribe 1 y 2, márcalos junto con las celdas vacías y salen 3, 4, 5. Funciona igual con enero, con lunes y con «Equipo 1». Y si escribes uno solo, se copia: con un dato la hoja no puede adivinar si ibas de uno en uno o de cinco en cinco.',
  'borrar-contenido':
    'Vacía las celdas y les deja el formato puesto. La celda sigue ahí, sólo que vacía — y vacía no es cero: es que ahí no hay nada.',
  'ordenar-az':
    'Ordena de la A a la Z, o de menor a mayor, mirando la primera columna que seleccionaste. Selecciona la tabla ENTERA antes de pulsar: con una sola columna, los nombres se quedan sin sus calificaciones.',
  'ordenar-za':
    'Ordena al revés: de la Z a la A, o de mayor a menor. Es el botón de «quién va primero» cuando lo que ordenas son cantidades.',
  /*
   * Reescrita el 16-ago-2026 con `of-excel-validacion`: la frase anterior
   * decía justo lo contrario de lo que hace `coincidencias()`
   * (`consultas.ts`). Por omisión, Buscar mira lo que la celda ENSEÑA —así
   * que sí encuentra un `=A1*10` que da 1000 si buscas «1000»—, y la mitad
   * que hay que aprender es la otra: con «Buscar en fórmulas» encendido mira
   * el TEXTO de la regla, y ahí «1000» no aparece escrito en ningún lado de
   * `=A1*10`, aunque sea justo lo que esa fórmula enseña.
   */
  buscar:
    'Recorre la hoja por ti y te lleva a la celda que tenga lo que escribas. Por omisión mira lo que la celda ENSEÑA —el resultado, aunque venga de una fórmula—; con «Buscar en fórmulas» mira el TEXTO de la regla, y ahí un resultado que no esté escrito tal cual no aparece.',
  /*
   * Mismo texto que `buscar`, para el botón de VERDAD: el de la cinta
   * (arriba) todavía no hace nada —`{ gesto: () => null }`, `cinta.ts`—; el
   * que sí busca vive en el panel «Validación», con `data-control`
   * distinto para no compartir domicilio con un botón inerte (la nota larga
   * de `FUERA_DE_LA_CINTA`, `VentanaHojas.tsx`).
   */
  'buscar-panel':
    'Recorre la hoja por ti y te lleva a la celda que tenga lo que escribas. Por omisión mira lo que la celda ENSEÑA —el resultado, aunque venga de una fórmula—; con «Buscar en fórmulas» mira el TEXTO de la regla, y ahí un resultado que no esté escrito tal cual no aparece.',
  /* ── Datos · Herramientas de datos — bloque 32, `of-excel-validacion` ── */
  validar:
    'Le pone una regla a lo que se puede escribir en el rango marcado: una lista de opciones, un número o una fecha entre dos límites, o un texto de cierto largo. Dos modos, y no son lo mismo: Detener no deja escribir nada que no cumpla; Advertencia avisa y deja seguir si insistes. Ojo: sólo vigila lo que se escriba DE AHORA EN ADELANTE — lo que ya estaba en el rango antes de poner la regla se queda tal cual, sin que nadie lo revise.',
  'quitar-validacion':
    'Le quita la regla al rango marcado. Lo que ya se había escrito —cumpliera o no— no se toca: esto sólo apaga la vigilancia de aquí en adelante.',
  /* ── Datos · Herramientas de datos — bloque 39, `of-excel-validacion` ── */
  'ir-a':
    'Salta directo a una celda, un rango o un nombre que hayas puesto antes —como los que aprendiste a bautizar en la clase de referencias—, sin desplazarte a ojo. Con un nombre que no existe, no te lleva a ningún lado y te lo dice.',
  reemplazar:
    'Busca un texto en el rango marcado y lo cambia por otro, en todas las celdas donde aparezca de un golpe. Antes de tocar nada te dice cuántas celdas va a cambiar —y cuántas de ésas son fórmulas—: reemplazar dentro de una fórmula puede partir una referencia sin que nada más avise, así que lee el aviso antes de confirmar.',

  /* ── Datos · Herramientas de datos — bloque 43, grado Intermedio, y 44 y 45,
     grado Avanzado ── */
  'importar-csv':
    'Trae un archivo .csv o .txt de fuera y lo reparte en celdas, fila por fila y columna por columna. Abre un panel: pega el texto, elige el separador —o deja que lo detecte solo— y mira el parte antes de aceptar: te dice cuántas filas y columnas entraron, y qué columnas se quedaron como texto aunque parezcan número.',
  'quitar-duplicados':
    'Compara TODAS las columnas de lo que marcaste, tal cual están escritas —sin recortar espacios ni igualar mayúsculas— y borra las filas que se repiten letra por letra, dejando la primera. Avisa cuántas se van antes de irse: no hay un botón que las traiga de vuelta, sólo Deshacer.',
  'relleno-rapido':
    'Mira el primer resultado que ya escribiste a mano junto a tus datos y adivina el patrón para completar el resto. Escribe TEXTO, no una fórmula: si el dato de origen cambia después, esto no se entera. Y si el patrón no queda claro, prefiere dejar una celda vacía a inventar algo a la mitad de la columna sin avisar.',

  /* ─────────────────────────────────────────────────────────────────────────
   * Tablas — bloques 33, 34, 35 y 36
   *
   * Las nueve viven en el panel «Tablas» de esta clase y no en la cinta —
   * `FUERA_DE_LA_CINTA`, en `VentanaHojas.tsx`, es donde `ubicar()` las va a
   * encontrar—, con la única excepción de `inmovilizar`, que sí tiene su
   * botón en Vista → Mostrar desde el primer día de la sala.
   * ──────────────────────────────────────────────────────────────────────── */
  'crear-tabla':
    'Convierte el rango marcado en una TABLA de verdad: le pone nombre, aprende dónde acaba, y crece sola en cuanto escribes justo debajo de su última fila. Un rango pintado a mano no se entera de nada nuevo; una tabla, sí.',
  'estilo-tabla':
    'Le cambia los colores a la tabla entera —cabecera y bandas— sin tocar ni un dato. Es la misma tabla, así que el estilo alcanza sola cualquier fila que crezca después.',
  'fila-totales':
    'Pone, debajo de la tabla, un resumen por columna: suma, promedio, cuenta, máximo o mínimo. Y aquí está la trampa que hay que aprender: si filtras la tabla, este resumen cuenta SÓLO lo que se ve — al revés que una fórmula normal como SUMA, que sigue sumando las filas escondidas aunque no las veas.',
  filtrar:
    'Esconde de la tabla las filas que no cumplen lo que pediste. Ojo: esconder no es borrar. Las filas siguen ahí, con sus datos intactos; sólo dejan de verse, y una fórmula que las sume desde fuera de la tabla las sigue contando todas.',
  'quitar-filtros':
    'Vuelve a enseñar todas las filas de la tabla. No repone ningún dato porque filtrar nunca borró ninguno: sólo estaban escondidas.',
  'ordenar-varias':
    'Ordena la tabla por varias columnas A LA VEZ, en el orden que tú decidas: primero agrupa por la primera columna, y DENTRO de cada grupo, ordena por la segunda. Cambiar el orden de las columnas cambia el resultado — no es lo mismo agrupar por equipo y ordenar por nombre que al revés.',
  'ocultar-filas':
    'Esconde a mano las filas que marcaste, sin que exista ningún filtro detrás. Se ven igual de escondidas que las de un filtro —y a una fila de totales o a SUBTOTALES le da igual el motivo—, pero aquí nadie decidió una condición: decidiste tú, fila por fila.',
  'mostrar-filas':
    'Vuelve a enseñar las filas escondidas dentro de lo que marcaste. Si escondiste la 6 y la 7, y quieres recuperarlas, marca de la 5 a la 8 —las que sí ves, una arriba y otra abajo del hueco— y pulsa aquí.',

  /* ── Inicio · Número — bloque 45, el segundo formato del grado Avanzado ── */
  'formato-personalizado':
    'Deja escribir tu propio patrón de número, con hasta tres partes separadas por «;»: positivos, negativos y cero. Sigue sin cambiar el dato —igual que Moneda o Porcentaje—: sólo cambia cómo se enseña. El ejemplo que hay que saberse es «#,##0;[Rojo](#,##0)»: los negativos, en rojo y entre paréntesis.',

  /* ── Inicio · Estilos — bloque 46 ── */
  'regla-formula':
    'Pinta según lo que conteste una fórmula tuya, que tiene que dar VERDADERO o FALSO —un número no sirve—. Se ancla en la primera celda del rango que marcaste y se desplaza sola por las demás, así que una referencia sin «$» se mueve de columna en cada celda y una con «$» se queda fija: es lo que decide si la regla pinta la fila entera o pinta en diagonal.',

  /* ─────────────────────────────────────────────────────────────────────────
   * Insertar · Gráficos — bloques 17, 18, 37 y 38
   *
   * Las tres frases llevan dentro **la lección del bloque 37**, que es la que de
   * verdad se enseña aquí: *la gráfica se elige por lo que se quiere decir, no
   * por la que se ve bonita*. Por eso cada una empieza diciendo **para qué
   * sirve** —comparar, seguir el tiempo, repartir un total— y no cómo se ve, y
   * por eso las tres nombran a las otras dos: la única forma de aprender a
   * elegir es tener las tres frases una al lado de la otra en el segundo exacto
   * en que el alumno está a punto de pulsar.
   *
   * Es la regla de la cabecera —«el efecto, no el nombre»— aplicada a un caso
   * donde el nombre no engaña pero tampoco enseña: «Gráfico de columnas» ya
   * está escrito en el botón.
   * ──────────────────────────────────────────────────────────────────────── */
  'grafico-columnas':
    'Dibuja tus números en barras verticales, y sirve para COMPARAR cosas distintas entre sí: quién vendió más, qué mes fue el bueno. Elige por lo que quieres decir, no por la que se ve bonita: si lo tuyo es cómo cambia algo con el tiempo, la de líneas lo dice mejor; si son partes de un total, el pastel.',
  'grafico-lineas':
    'Une los datos con una línea, y es la gráfica del TIEMPO: no compara cosas distintas, enseña cómo sube o baja una misma cosa mes tras mes. Si tus datos no llevan orden —cinco productos, cuatro salones—, unirlos con una línea dibuja un camino que no existe: ésa es de columnas.',
  'grafico-circular':
    'Reparte un TOTAL en rebanadas, y sólo vale si se cumplen dos cosas: que las partes sumen un todo y que sean pocas. Con veinte rebanadas nadie entiende nada, y si tus números no suman un total —los goles de cinco equipos no son partes de nada— el pastel miente aunque los datos estén bien.',

  /* ── Fórmulas · Biblioteca — bloques 13, 14 y 15 ── */
  'insertar-funcion':
    'Abre el buscador de funciones, con su explicación y una casilla por dato. Sirve el día que necesites una de las cientos que no están aquí al lado.',
  'fn-suma':
    'Suma los números de un rango. La celda enseña el total y guarda la regla: cambia un dato de arriba y el total se corrige solo, sin que vuelvas a tocarlo.',
  'fn-promedio':
    'Saca el promedio de un rango. Ojo: las celdas vacías se quedan fuera de la cuenta, así que una vacía y un cero dan promedios distintos.',
  'fn-max': 'Devuelve el número más grande del rango. Te dice cuánto, no de quién: eso hay que ir a verlo.',
  'fn-min':
    'Devuelve el número más chico del rango. Con MAX de vecino se ve de un golpe entre qué y qué se mueven tus datos.',
  'fn-contar':
    'Cuenta cuántas celdas del rango tienen NÚMERO. Un cero cuenta, porque un cero es un número; una celda vacía no cuenta, y una con texto tampoco.',
  'fn-contara':
    'Cuenta las celdas que tienen ALGO dentro, sea número o texto. Ponla junto a CONTAR: la diferencia entre las dos son las respuestas que no eran números, y las vacías siguen sin contar en ninguna.',

  /* ── Fórmulas · Auditoría — bloques 13 y 42 ── */
  'mostrar-formulas':
    'Levanta la tapa: cada celda deja de enseñar su resultado y enseña la regla que guarda. Es la única forma de revisar una hoja que hizo otro sin ir picando celda por celda.',

  /* ── Insertar · Vínculos — bloque 40 ── */
  hipervinculo:
    'Ponte en la celda y di a qué hoja saltar: convierte un libro de varias hojas en algo navegable, con un índice que lleva a cada una. Si la hoja de destino no existe, la hoja no te deja crearlo — no se rompe después, se niega antes.',
  'quitar-hipervinculo':
    'Le quita el salto a la celda donde estés parado, sin tocar el texto que hay escrito. Sirve para un enlace que ya no lleva a ningún lado.',

  /* ── Vista — bloques 2 y 36 ── */
  'ver-cuadricula':
    'Enciende y apaga las rayas grises de la hoja. Al apagarlas se ve que nunca fueron parte de tu tabla: eran una ayuda de la pantalla.',
  'ver-encabezados':
    'Enciende y apaga las letras de arriba y los números de la izquierda. Sin ellos la hoja parece papel en blanco, y además te quedas sin poder decir dónde está una celda.',
  inmovilizar:
    'Clava la fila de títulos —o la primera columna— para que no se vaya al bajar. En una lista de doscientas filas es lo que te evita contar columnas con el dedo.',
  zoom: 'Acerca y aleja la hoja. No cambia ni un dato: cambia cuántas celdas te caben en la pantalla.',

  /* ─────────────────────────────────────────────────────────────────────────
   * FUERA DE LA CINTA · las partes de la ventana — bloques 1, 2, 3 y 16
   *
   * No son botones y no viven en ninguna pestaña, pero son **la mitad de la
   * primera clase**: el bloque 2 del §45.2 se llama literalmente «la ventana:
   * cinta, cuadro de nombres, barra de fórmulas, cuadrícula, pestañas de hoja,
   * barra de estado». Un encargo que diga «mira lo que dice la barra de
   * fórmulas» tiene que poder señalarla y explicarla igual que a un botón, y sin
   * estas entradas se quedaría con aro y sin ficha —media guía—.
   *
   * `ubicar()` no las va a encontrar en la cinta y devolverá `null`, que es el
   * dato correcto: no tienen domicilio de cinta. La ventana las señala por su
   * marcador y toma de aquí el texto de la ficha.
   * ──────────────────────────────────────────────────────────────────────── */
  'cuadro-de-nombres':
    'La casilla de arriba a la izquierda que te dice en qué celda estás parado. También funciona al revés: escribe B240 ahí dentro y te lleva de un salto. Y hace una tercera cosa: si lo que escribes no es una dirección sino una palabra —IVA, Precios—, le pone ese nombre a lo que tengas marcado, y desde ese momento puedes escribirlo dentro de una fórmula.',
  'barra-de-formulas':
    'La franja de arriba, que enseña lo que la celda GUARDA de verdad. Si abajo lees $12,500.00 y aquí arriba dice =B2*C2, ya entendiste qué es una hoja de cálculo.',
  'pestanas-de-hoja':
    'Las lengüetas de abajo: cada una es una hoja entera dentro del mismo archivo. Un libro puede tener muchas, y una fórmula de una puede mirar los datos de otra.',
  'nueva-hoja':
    'Agrega otra hoja al libro. Sirve para separar por meses o por temas sin tener que abrir un archivo nuevo cada vez.',
  'cabecera-columna':
    'La letra de arriba de cada columna. Se pulsa para seleccionar la columna entera, y es la primera mitad del nombre de toda celda que esté debajo.',
  'cabecera-fila':
    'El número de la izquierda de cada fila. Se pulsa para seleccionar la fila entera, y es la otra mitad del nombre: columna más fila, y ya sabes cuál es.',
  'celda-activa':
    'La celda del marco grueso: es donde va a caer lo que escribas. Aunque tengas cincuenta seleccionadas, activa sólo hay una.',
  /*
   * El cuadradito verde. Es una PARTE de la ventana y no un botón, igual que el
   * cuadro de nombres, y por eso vive aquí abajo: en Excel el autorrelleno se
   * hace arrastrándolo, no pulsando «Rellenar la serie» en la cinta —ese botón
   * existe y casi nadie lo ha visto—. Enseñar el bloque 8 sólo por la cinta
   * sería enseñar una puerta que el alumno no va a volver a usar nunca.
   */
  tirador:
    'El cuadradito verde de la esquina de abajo a la derecha de lo que tengas marcado. Se agarra con el ratón y se arrastra: lo que hay dentro se continúa —1 y 2 dan 3, 4, 5— o se copia, si con lo que hay no se puede adivinar una cuenta. Arrastrándolo con Ctrl apretado se copia siempre, sin continuar nada.',
  'barra-de-estado':
    'La franja de hasta abajo. Selecciona varios números y ahí aparecen solos la suma, el promedio y la cuenta, sin escribir una sola fórmula.',
  /*
   * La gráfica ya hecha. Es una PARTE de la ventana igual que el tirador —flota
   * sobre la hoja, se agarra y se mueve— y su frase es la mitad del bloque 18:
   * las partes de una gráfica se nombran aquí para que el encargo «ponle título»
   * pueda señalar el dibujo y explicarlo con el mismo aro que un botón.
   *
   * La segunda mitad de la frase es la que paga el bloque 17 entero: **una
   * gráfica no es una foto**. Es la misma idea que «la celda guarda la regla»,
   * dicha sobre un dibujo, y es lo que el alumno comprueba cambiando un número y
   * viendo moverse la barra sin haber tocado la gráfica.
   */
  grafica:
    'Tus números, dibujados. No es una foto: la gráfica no se guarda ni un dato, los va a buscar a las celdas cada vez, así que cambia un número allá arriba y la barra se mueve sola. Se agarra con el ratón y se cambia de sitio, y tiene cuatro partes que se pueden poner y quitar: el título, los dos ejes, la leyenda —quién es cada color— y los rótulos de dato, que son los números escritos encima.',

  /*
   * Los seis campos del panel «Diseño de gráfico» que sale al marcar una
   * gráfica — bloque 18. Van aquí y no arriba, junto a los botones que sí
   * viven en la cinta, porque ninguno tiene domicilio de cinta: `ubicar()` no
   * los va a encontrar y por eso están en `FUERA_DE_LA_CINTA`, con el mismo
   * criterio que el cuadro de nombres o el tirador.
   */
  'grafica-titulo':
    'Le pone nombre a la gráfica entera, arriba del dibujo. Sin él, quien la mire tiene que adivinar de qué trata — una gráfica sin título no se entiende sola.',
  'grafica-datos':
    'El rango del que come la gráfica, el mismo que marcaste al hacerla. Cambiarlo aquí es la manera de arreglar una selección que salió mal —por ejemplo, con el total metido dentro— sin borrar la gráfica y volver a empezar.',
  'grafica-eje-x':
    'El nombre de lo que hay en el eje de abajo —qué son las categorías que se comparan—, para que no haga falta adivinarlo mirando los rótulos.',
  'grafica-eje-y':
    'El nombre de lo que mide el eje de un lado, casi siempre la unidad: pesos, litros, alumnos.',
  'grafica-leyenda':
    'Enciende y apaga el cuadro que dice qué color es cada serie. Con una sola serie no hace falta: la leyenda sirve para distinguir entre varias.',
  'grafica-rotulos-de-dato':
    'Escribe el número exacto encima de cada barra o cada punto. Sin ellos, quien mire la gráfica sólo puede decir «más o menos 3.000»; con ellos, lee 3.150.',

  /* ── Quitar una gráfica — bloque 58, `of-excel-dashboard` ── */
  'borrar-grafico':
    'Saca esa gráfica de la hoja. No toca ni un dato: una gráfica no guarda números, así que borrarla no borra nada de lo que dibujaba — las celdas de las que comía siguen exactamente donde estaban. Es lo que hay que pulsar cuando un dibujo está bien hecho y aun así sobra, porque no contesta ninguna pregunta que alguien se haya hecho.',

  /*
   * Los tres de la barra de arriba del todo. Estaban en la tabla de sitios de la
   * ventana desde el §47 —o sea que un encargo sobre ellos sacaba su aro— y **no
   * tenían frase aquí**, así que salían con aro y sin ficha: exactamente el
   * defecto 2 del §47.6, con otros tres inquilinos. Se vio al pedir un deshacer
   * como encargo (bloque 5), que es la primera clase que lo hace.
   */
  guardar:
    'Guarda el libro con los cambios que llevas. Lo que no está guardado vive sólo en la pantalla, y una pantalla se apaga.',
  deshacer:
    'Da un paso atrás: devuelve el libro a como estaba antes de lo último que hiciste. Se puede pulsar muchas veces seguidas e ir retrocediendo, y por eso en una hoja de cálculo se puede probar sin miedo — equivocarse aquí cuesta un clic.',
  rehacer:
    'Va hacia adelante otra vez y devuelve lo que acabas de deshacer. Es el compañero del de al lado: uno retrocede y el otro vuelve a avanzar.',

  /* ─────────────────────────────────────────────────────────────────────────
   * FUERA DE LA CINTA · el panel de formato condicional — bloques 30 y 31
   *
   * Los siete botones de `PanelReglas.tsx` (`n7-formato-condicional`). No
   * viven en ninguna pestaña de la cinta —el grado Básico declara a
   * propósito que no trae formato condicional (`tecniaHojas.ts`)—, así que
   * van aquí abajo con el mismo criterio que el panel «Diseño de gráfico»:
   * `ubicar()` no los encuentra, y sin esta entrada un encargo sobre ellos
   * saldría con aro y sin ficha.
   * ──────────────────────────────────────────────────────────────────────── */
  'regla-barras':
    'Pinta una barra dentro de cada celda, tan larga como grande es su número. Sirve para COMPARAR magnitudes de un vistazo: cuál es mucho, cuál es poco.',
  'regla-escala':
    'Pinta TODAS las celdas del rango, de la más clara a la más oscura según su valor. Es el mapa completo, de lo más bajo a lo más alto — no sólo las que cumplen una condición, como hace Destacar.',
  'regla-iconos':
    'Reparte cada celda en tres cajones —flecha arriba, de lado o abajo— según en qué tercio de los datos cae. Clasifica, no mide: dos celdas con la misma flecha pueden valer cosas muy distintas.',
  'regla-destacar':
    'Pinta sólo las celdas que cumplen una condición que tú escribes: mayor que, menor que, entre dos números, que contenga un texto, o que esté repetida. Ninguna regla de aquí cambia el dato: sólo decide cómo se pinta, y se aplica sola cada vez que algo cambia.',
  'borrar-reglas':
    'Quita una regla de la lista, sin tocar las demás que vivan en el mismo rango. Las celdas no pierden ningún dato: sólo dejan de pintarse con esa regla en particular.',
  minigrafico:
    'Dibuja un resumen de varias celdas DENTRO de una sola: una línea, unas columnas o gana-pierde. Tapa el número de esa celda mientras esté puesto, pero los datos de los que come —en otras celdas— no se tocan.',
  'borrar-minigraficos':
    'Quita el minigráfico de la celda donde estás parado. El número que hubiera debajo, si lo había, no vuelve solo: el minigráfico no borró ningún dato, así que tampoco tiene ninguno que devolver.',

  /* ── Datos · Herramientas de datos — bloque 53, grado Avanzado ── */
  consolidar:
    'Junta varias hojas iguales en una sola, sumando —o promediando, contando, o quedándose con el máximo o el mínimo— posición a posición. Escribe una FÓRMULA, no el número del momento: si luego cambia un dato en alguna de las hojas de origen, el resultado se corrige solo. Las hojas de origen tienen que medir exactamente lo mismo; si no, te lo dice antes de tocar nada.',

  /* ── Revisar · Proteger — bloque 54, grado Avanzado ── */
  'desbloquear-rango':
    'Marca las celdas que sí se van a poder tocar cuando la hoja esté protegida. Se pulsa ANTES de proteger: todas las celdas nacen bloqueadas, y proteger la hoja cierra las que no hayas desbloqueado a tiempo.',
  'proteger-hoja':
    'Cierra con llave todas las celdas de esta hoja que no hayas desbloqueado antes. Sin contraseña, a propósito: esto protege de un despiste —borrar sin querer la fórmula de un compañero—, no de alguien con intención de saltárselo.',
  'desproteger-hoja':
    'Quita el candado de la hoja: vuelve a dejar escribir en todas sus celdas, incluidas las que estaban bloqueadas.',
  'proteger-libro':
    'Cierra la ESTRUCTURA del libro: nadie va a poder crear, borrar, mover ni renombrar una hoja. No toca ni una celda —eso es «Proteger hoja», la de al lado— así que se sigue pudiendo escribir donde ya se podía.',
  'desproteger-libro':
    'Quita el candado de la estructura: vuelve a dejar crear, borrar, mover y renombrar hojas.',

  /* ── Datos · Análisis Y si — bloque 57, grado Avanzado ── */
  'buscar-objetivo':
    'Dices el resultado que quieres en una celda con fórmula, y él encuentra qué número poner en OTRA celda para llegarle. Es la hoja usada al revés: prueba, mide y corrige, no despeja. Sólo mueve una celda con un número escrito a mano, y sólo si esa celda de verdad influye en la que quieres cambiar.',
  'guardar-escenario':
    'Guarda una foto con nombre de las celdas que marcaste, tal como están ahora. Sirve para comparar varias versiones de la misma pregunta sin perder ninguna. Guardar con un nombre que ya existe no crea uno nuevo: reemplaza al que ya estaba, y avisa antes de hacerlo.',
  'aplicar-escenario':
    'Escribe de un golpe todos los números que guardó un escenario, sin que tengas que teclear nada. Ojo: si alguna de esas celdas tiene AHORA una fórmula propia, aplicar el escenario la sustituye por un número — se pierde la regla, y avisa antes de hacerlo.',
  'borrar-escenario':
    'Quita un escenario de la lista. No toca ni una celda de la hoja: sólo olvida la foto que había guardado con ese nombre.',

  /* ── El panel «Tabla dinámica» — bloques 49 y 50, grado Avanzado ── */
  'crear-dinamica':
    'Marca la lista entera —con su fila de encabezados— y dile dónde pintar el resumen. Nace VACÍA, como en Excel: un marco y el panel de campos al lado. Los campos se arrastran después, uno a uno, y cada vez que mueves uno la dinámica contesta otra pregunta.',
  'campo-dinamica':
    'Manda un campo a Filas, a Columnas o a Valores — o lo saca de la dinámica. Filas y columnas son excluyentes: llevar a columnas un campo que estaba en filas lo MUEVE, no lo duplica. En Valores eliges además cómo se resume: suma, cuenta, promedio, máximo o mínimo, y cada uno cuenta una historia distinta con los mismos datos.',
  'agrupar-dinamica':
    'Mete un campo DENTRO de otro: categoría y, colgando de ella, sus productos, con el subtotal de cada categoría. El orden de los campos de un eje es el anidamiento, así que agruparlos al revés —producto y dentro categoría— es la misma tabla contestando otra pregunta.',
  'actualizar-dinamica':
    'Vuelve a leer los datos de origen y repinta el resumen. Hace falta pulsarlo porque una dinámica no mira la hoja: mira la copia que se llevó la última vez que se actualizó. Por eso, si cambias un dato del origen, el resumen sigue enseñando el número de antes hasta que pulses aquí — y ese número viejo no estaba mal: estaba bien cuando se calculó.',

  /* ── El panel «Macros» — bloques 55 y 56, grado Avanzado ── */
  'grabar-macro':
    'Enciende la grabadora bajo el nombre que le pongas: desde ese momento, TODO lo que hagas —un botón bueno, uno por error, y el que uses para corregirlo— se apunta en una lista, en el orden en que pasó. No es magia: es un cuaderno.',
  'parar-macro':
    'Apaga la grabadora y guarda la lista completa bajo el nombre que le pusiste al empezar. Si no grabaste ninguna acción, no hay nada que guardar: la macro se quedaría vacía, y por eso se rechaza.',
  'ejecutar-macro':
    'Vuelve a aplicar, una por una y en el mismo orden, exactamente las acciones que quedaron grabadas — ni una más, ni una menos. Repite lo que HICISTE, no lo que hoy querrías: si tu tabla creció, la macro sigue yendo a las mismas celdas de siempre.',
  'borrar-macro':
    'Quita la macro de la lista para siempre. Si algún botón la tenía asignada, se queda apuntando a un nombre que ya no existe — y eso se nota en cuanto alguien lo pulse, no antes.',
  'asignar-macro':
    'Le pone a un botón el nombre de la macro que dispara al pulsarlo. El botón no guarda una copia: lee la lista de macros en el momento de pulsarse, así que si esa macro cambia o se borra, el botón se entera solo.',
};

/**
 * Qué guarda cada pestaña, que también es una herramienta y también se explica.
 *
 * Va tipada con `PestanaExcel` y no con `string`: son seis, están cerradas en la
 * cinta, y así el día que la sala gane la pestaña contextual de gráfico el
 * compilador pide su frase en vez de dejar un cajón sin explicar.
 */
export const QUE_HACE_PESTANA_EXCEL: Record<PestanaExcel, string> = {
  archivo: 'Lo que se hace con el libro entero: guardarlo, abrirlo e imprimir sólo lo que importa.',
  inicio: 'El cajón de lo que más se usa: cómo se ve la celda, cómo se enseña el número y cómo se meten o se quitan filas.',
  insertar: 'Lo que se agrega a la hoja y no se teclea. Aquí viven las gráficas, que son tus números dibujados.',
  formulas: 'Las funciones ya hechas, y el botón que levanta la tapa para ver las reglas en vez de los resultados.',
  datos: 'Lo que se le hace a una lista entera de golpe: ordenarla —y más adelante filtrarla— sin tocar dato por dato.',
  revisar: 'Blindar lo que no se debe tocar por despiste: proteger una hoja, un rango que sí se puede editar, o la estructura del libro entero.',
  vista: 'Cómo miras tú la hoja. No cambia el libro: cambia lo que ves de él.',
};

/**
 * Los controles que se pintan como **desplegable** y no como botón suelto.
 *
 * Mismo agujero que en Word y en PowerPoint, sólo que aquí son cinco en vez de
 * dos: la ventana los dibuja con su flecha y su panel —una paleta de colores,
 * una rejilla de bordes, la lista de tipos de número, la regleta del zoom—, así
 * que el aro no puede caer sobre un botón cualquiera del grupo.
 *
 * `ubicar()` mira **esta tabla primero** y luego busca su GRUPO en la cinta de
 * la clase, con lo cual el domicilio se sigue derivando: si un día el color de
 * relleno se muda del grupo Fuente a otro, la guía se muda con él. Lo que aquí
 * se fija es el rótulo y el glifo del desplegable, y los dos están escritos
 * **igual que en `tecniaHojas.ts`** a propósito: un control que se llama de una
 * forma en la cinta y de otra en la ficha es otro control para el alumno.
 */
export const DESPLEGABLES_EXCEL: TablaDesplegables = {
  'formato-numero': { grupo: 'Número', etiqueta: 'Formato de número', glifo: '#' },
  bordes: { grupo: 'Fuente', etiqueta: 'Bordes', glifo: '⊞' },
  'color-letra': { grupo: 'Fuente', etiqueta: 'Color de letra', glifo: 'A' },
  'color-relleno': { grupo: 'Fuente', etiqueta: 'Color de relleno', glifo: '🪣' },
  zoom: { grupo: 'Zoom', etiqueta: 'Zoom', glifo: '🔍' },
  /*
   * Los dos del grado Avanzado (`of-excel-datos-limpios`), con el mismo
   * rótulo y el mismo glifo que su botón en `tecniaHojas.ts` — un control que
   * se llamara distinto en la cinta y en la ficha de guía sería otro control
   * para el alumno (ver la cabecera de esta tabla).
   */
  'formato-personalizado': { grupo: 'Número', etiqueta: 'Formato personalizado', glifo: '#·' },
  'regla-formula': { grupo: 'Estilos', etiqueta: 'Regla con fórmula', glifo: 'ƒ=' },
  /*
   * `consolidar` (`of-excel-consolida-y-protege`, bloque 53), con el mismo
   * rótulo y el mismo glifo que su botón en `tecniaHojas.ts` — un control que
   * se llamara distinto en la cinta y en la ficha de guía sería otro control
   * para el alumno (ver la cabecera de esta tabla).
   */
  consolidar: { grupo: 'Herramientas de datos', etiqueta: 'Consolidar', glifo: '⨁' },
  /*
   * `hipervinculo` (`n6-interpreta-la-informacion`, bloque 40, 16-ago-2026):
   * el mismo caso que `consolidar` — pide texto libre («h2!A1»), así que abre
   * el mismo cuadro con un botón «Aplicar» y no una paleta. `quitar-hipervinculo`
   * no entra aquí: es un botón que actúa de un solo clic, sin pedir nada, y
   * `ubicar()` ya lo encuentra directo en la cinta (la nota de la cabecera).
   */
  hipervinculo: { grupo: 'Vínculos', etiqueta: 'Hipervínculo', glifo: '🔗' },
};
