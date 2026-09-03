/**
 * `of-word-plantillas` · las tres plantillas de la galería.
 *
 * Una plantilla no es un tema de colores: es un **documento de partida ya
 * armado**. Por eso las tres son documentos de escuela mexicana de verdad, con
 * su nombre de escuela, sus fechas y su forma de hablar —una circular no suena
 * como un reporte de ciencias—, y cada una trae ya puestos los estilos, el
 * interlineado y **el pie de página**. El encabezado se deja vacío a propósito:
 * es lo único que cambia en cada documento, y es lo que el alumno va a escribir.
 *
 * Las tres pasan de dos hojas y se quedan cortas en la tercera, y eso está
 * medido y no supuesto: la clase pide escribir a mano en la hoja 2 para
 * comprobar que eso NO sale en la hoja 3, así que sin tres hojas no hay clase; y
 * el último encargo pide hacer nacer una hoja más, que con la tercera casi llena
 * costaría veinte pulsaciones.
 */

export interface Plantilla {
  id: string;
  /** Como se llama en la galería. */
  nombre: string;
  /** Para quién es. Va como chapa en la tarjeta. */
  para: string;
  /** Qué trae, en una frase. */
  resumen: string;
  /** El pie de página que la plantilla trae ya puesto. */
  pie: string;
  /** Color de la miniatura. Es el único adorno de la tarjeta. */
  acento: string;
  html: string;
}

/* ── 1 · Circular de inicio de ciclo ──────────────────────────────────────── */

const CIRCULAR = `
<h1>Circular de inicio de ciclo</h1>
<p class="es-inter-15">Escuela Primaria Estatal «Ignacio Ramírez», turno matutino, ciclo escolar 2026-2027. Esta circular se entrega a todas las familias durante la primera semana de clases. Conviene guardarla: casi todo lo que se pregunta a lo largo del año está contestado aquí.</p>

<h2>1. Regreso a clases</h2>
<p class="es-inter-15">Las clases empiezan el lunes 24 de agosto. Ese día la entrada es a las 8:00 y la salida a las 12:30, sólo por ser el primero; a partir del martes se aplica el horario normal. Las listas con los grupos y los salones se publican el viernes anterior en la reja principal y también se mandan por el grupo de avisos de cada grado.</p>
<p class="es-inter-15">Les pedimos que los primeros días acompañen a los alumnos hasta la reja y no más adentro. No es un trámite: con trescientos alumnos entrando a la misma hora, el patio se vuelve un embudo y los de primero acaban perdidos entre los grandes.</p>

<h2>2. Horario de entrada y de salida</h2>
<ul>
<li>Entrada: de 7:50 a 8:00. A las 8:05 se cierra la puerta.</li>
<li>Recreo: de 10:30 a 11:00.</li>
<li>Salida de primero y segundo: 12:45.</li>
<li>Salida de tercero a sexto: 13:00.</li>
<li>Los viernes de Consejo Técnico no hay clases. Las fechas van en la última hoja.</li>
</ul>
<p class="es-inter-15">Quien llegue después de las 8:05 entra por la dirección y se le anota el retardo. Tres retardos en el mismo mes cuentan como una falta, y las faltas sí pesan en la evaluación. Si hay un motivo, basta con avisar antes.</p>

<h2>3. Lista de útiles</h2>
<p class="es-inter-15">La lista es la misma para todos los grados salvo donde se indica. No hace falta comprar marcas caras ni cuadernos con dibujos: lo que se pide es lo que de verdad se va a usar en clase, y se puede reusar lo del año pasado si todavía sirve.</p>
<ul>
<li>Dos cuadernos profesionales de cuadro chico, de cien hojas.</li>
<li>Un cuaderno profesional de raya para Español.</li>
<li>Lápiz del número 2, goma blanca y sacapuntas con depósito.</li>
<li>Una caja de colores de madera de doce piezas.</li>
<li>Tijeras de punta roma y un pegamento en barra.</li>
<li>Regla de treinta centímetros.</li>
<li>Un juego de geometría, sólo de cuarto a sexto.</li>
<li>Una calculadora sencilla, sólo de quinto y sexto.</li>
<li>Un paquete de hojas blancas tamaño carta.</li>
<li>Una caja de pañuelos desechables para el salón.</li>
</ul>

<h2>4. Uniforme</h2>
<p class="es-inter-15">El uniforme diario es playera blanca de la escuela, pantalón o falda azul marino y zapato escolar negro. El uniforme deportivo se usa el día que a cada grupo le toca Educación Física, y ese día se puede venir con él puesto desde la casa.</p>
<ul>
<li>Suéter azul marino, sin capucha.</li>
<li>El cabello recogido cuando haya Educación Física o taller de cocina.</li>
<li>Nada de accesorios que se puedan perder: la escuela no responde por ellos.</li>
<li>Todo marcado con el nombre completo, incluido el suéter.</li>
</ul>

<h2>5. Reglamento de convivencia</h2>
<p class="es-inter-15">El reglamento se lee con los alumnos el primer día y lo firmamos entre los tres: alumno, familia y maestro. Éstos son los acuerdos.</p>
<ol>
<li>Nos hablamos por nuestro nombre y sin apodos.</li>
<li>Los pleitos se resuelven hablando y, si hace falta, con un adulto delante.</li>
<li>El material de la escuela se cuida y se devuelve donde estaba.</li>
<li>El celular se queda apagado dentro de la mochila toda la jornada.</li>
<li>Nadie sale del salón sin permiso ni de la escuela sin su familia.</li>
<li>Lo que se ensucia se limpia.</li>
<li>Se llega a tiempo, y si un día no se puede, se avisa.</li>
</ol>

<h2>6. Salud</h2>
<p class="es-inter-15">Si un alumno amanece con fiebre, vómito o diarrea, no debe venir a la escuela hasta que pasen veinticuatro horas sin síntomas. No es exageración: en un salón de treinta y cinco, lo que entra el lunes está en toda la escuela el jueves y acaba parando las clases.</p>
<p class="es-inter-15">La escuela no administra medicamentos. Si un alumno necesita tomar algo en horario de clase, la familia tiene que dejarlo por escrito en la dirección, con la receta y la hora exacta. Cualquier alergia o condición médica se anota en la ficha al principio del ciclo.</p>

<h2>7. La cooperativa y los alimentos</h2>
<p class="es-inter-15">La cooperativa abre sólo en el recreo y vende fruta, agua natural, sándwiches y galletas sin relleno. No se venden refrescos ni frituras, y tampoco se permite que entren de fuera. La cuenta se paga en efectivo y con cambio, porque no hay caja para dar vueltas.</p>
<p class="es-inter-15">El lunes de cada mes hay desayuno escolar para los grupos que estén inscritos. Quien traiga lonche de casa puede comerlo en el patio techado; lo que pedimos es que se lleven su basura, que ese patio lo barren los mismos alumnos por turnos.</p>

<h2>8. Tareas y trabajos</h2>
<p class="es-inter-15">La tarea se deja de lunes a jueves y se calcula para que no pase de cuarenta minutos. Si en su casa está tomando mucho más que eso, avisen al maestro: casi siempre significa que algo no quedó claro en clase y se puede repasar, no que el alumno sea lento.</p>
<p class="es-inter-15">Los trabajos que se entregan en hojas llevan siempre nombre completo, grado y grupo en la parte de arriba. Los que se entregan por computadora se mandan en PDF al correo del maestro, nunca por mensaje.</p>

<h2>9. Cómo comunicarse con la escuela</h2>
<p class="es-inter-15">La dirección atiende de 8:30 a 12:00, de lunes a viernes, sin cita. Para hablar con un maestro hay que pedir la hora en la dirección: los maestros no atienden en la puerta durante la entrada ni en la salida, porque en ese rato están cuidando a treinta y cinco alumnos.</p>
<p class="es-inter-15">Cada grupo tiene su grupo de avisos, y es sólo para avisos de la escuela. Las dudas de un alumno en particular se ven en persona o por correo, nunca en el grupo, porque ahí está la mitad del salón leyendo.</p>
<p class="es-inter-15">Teléfono de la escuela: 722 214 55 09. Correo de la dirección: direccion.ignacioramirez@correo.mx.</p>

<h2>10. Fechas para apuntar desde ahora</h2>
<ul>
<li>24 de agosto: primer día de clases.</li>
<li>4 de septiembre: primera reunión de familias, por grado.</li>
<li>16 de septiembre: suspensión de labores.</li>
<li>2 de octubre: entrega del primer reporte de evaluación.</li>
<li>21 de noviembre: kermés de la escuela.</li>
<li>2 de diciembre: entrega del segundo reporte de evaluación.</li>
<li>12 de diciembre: festival de fin de año, por la tarde.</li>
<li>19 de diciembre: último día antes del descanso de invierno.</li>
<li>7 de enero: regreso a clases.</li>
</ul>
`;

/* ── 2 · Reporte del proyecto de ciencias ─────────────────────────────────── */

const REPORTE = `
<h1>Reporte del proyecto de ciencias</h1>
<p class="es-justificado es-inter-15">Escuela Secundaria Técnica número 12, «Josefa Ortiz de Domínguez». Asignatura de Ciencias, énfasis en Física. Equipo 4 del grupo 2.º B. Integrantes: Renata Aguilar, Diego Palma, Ximena Rojas y Ulises Cortés. Fecha de entrega: 14 de octubre de 2026.</p>

<h2>1. Pregunta que quisimos contestar</h2>
<p class="es-justificado es-inter-15">¿El agua caliente se congela antes que el agua fría? La pregunta salió de una discusión en el salón: dos compañeros aseguraban haberlo visto en su casa y el resto no lo creía. En vez de quedarnos en la discusión, decidimos medirlo, porque una cosa es acordarse de algo y otra es tener el dato apuntado.</p>
<p class="es-justificado es-inter-15">Antes de empezar buscamos el nombre del fenómeno y resulta que ya tiene uno: efecto Mpemba. Eso no nos ahorró el experimento, sólo nos avisó de que la respuesta no iba a ser un sí o un no limpio.</p>

<h2>2. Hipótesis</h2>
<p class="es-justificado es-inter-15">Suponemos que el agua fría se congela primero, porque necesita bajar menos grados para llegar a cero. Si al medir sale lo contrario, la explicación tendrá que estar en algo que no estamos viendo: la evaporación, el aire disuelto en el agua o la escarcha que se forma debajo del recipiente.</p>

<h2>3. Materiales</h2>
<ul>
<li>Seis vasos de vidrio iguales, de 250 mililitros.</li>
<li>Un termómetro de cocina con lectura de menos veinte a ciento veinte grados.</li>
<li>Una balanza de cocina con precisión de un gramo.</li>
<li>Un congelador doméstico, ajustado a menos dieciocho grados.</li>
<li>Agua de la llave, reposada una hora.</li>
<li>Un cronómetro y una libreta para apuntar.</li>
<li>Cinta adhesiva y un marcador para etiquetar cada vaso.</li>
</ul>

<h2>4. Procedimiento</h2>
<ol>
<li>Etiquetamos los vasos del 1 al 6 y los pesamos vacíos, uno por uno.</li>
<li>Servimos 200 gramos de agua en cada vaso, pesando en vez de midiendo con taza.</li>
<li>Calentamos el agua de los vasos 1, 2 y 3 hasta 70 grados y la dejamos reposar dos minutos.</li>
<li>Dejamos el agua de los vasos 4, 5 y 6 a temperatura ambiente, que ese día fue de 22 grados.</li>
<li>Metimos los seis vasos al congelador al mismo tiempo, en la misma repisa y separados tres centímetros.</li>
<li>Cada diez minutos abrimos el congelador un instante y anotamos qué vasos tenían ya una capa de hielo en la superficie.</li>
<li>Dimos por congelado un vaso cuando el hielo aguantaba el peso del termómetro sin hundirse.</li>
</ol>
<p class="es-justificado es-inter-15">Repetimos el procedimiento completo tres días seguidos, siempre a la misma hora de la tarde, para que la temperatura del congelador partiera del mismo punto. Un solo intento no dice nada: la primera vez el vaso 5 se congeló muchísimo antes que los demás y resultó que lo habíamos dejado pegado a la pared del fondo.</p>

<h2>5. Observaciones</h2>
<p class="es-justificado es-inter-15">Los vasos con agua caliente perdieron temperatura mucho más rápido durante la primera media hora, y a partir de los 20 grados los dos grupos bajaron casi igual. En dos de los tres días, un vaso del grupo caliente se congeló antes que el primero del grupo frío; en el tercer día no pasó.</p>
<p class="es-justificado es-inter-15">También notamos que los vasos calientes perdieron peso: al final tenían entre cuatro y siete gramos menos de agua, porque parte se evaporó. Menos agua es menos que congelar, así que eso podría explicar buena parte de la diferencia sin necesidad de nada raro.</p>

<h2>6. Resultados</h2>
<ul>
<li>Día 1: el primer vaso congelado fue el 2, del grupo caliente, a los 118 minutos.</li>
<li>Día 1: el primero del grupo frío fue el 6, a los 131 minutos.</li>
<li>Día 2: el primer vaso congelado fue el 3, del grupo caliente, a los 124 minutos.</li>
<li>Día 2: el primero del grupo frío fue el 4, a los 129 minutos.</li>
<li>Día 3: el primer vaso congelado fue el 5, del grupo frío, a los 121 minutos.</li>
<li>Día 3: el primero del grupo caliente fue el 1, a los 127 minutos.</li>
</ul>

<h2>7. Conclusiones</h2>
<p class="es-justificado es-inter-15">Nuestra hipótesis no se cumplió del todo, y tampoco se cumplió lo contrario. En dos de tres días el agua caliente ganó, pero por una diferencia de minutos que es del mismo tamaño que el error de nuestro método: abríamos el congelador cada diez minutos, así que no podíamos saber el momento exacto en que se formaba el hielo.</p>
<p class="es-justificado es-inter-15">Lo que sí quedó claro es que la evaporación cambia el experimento, porque cambia la cantidad de agua. Si volviéramos a hacerlo, taparíamos los vasos y pesaríamos otra vez al final para descontar lo que se fue. También cambiaríamos el termómetro por uno que se pueda leer sin abrir la puerta.</p>
<p class="es-justificado es-inter-15">La conclusión honesta es que con seis vasos y tres días no alcanza para contestar la pregunta. Lo escribimos así, y no como un sí rotundo, porque el reporte tiene que decir lo que se midió y no lo que nos habría gustado medir.</p>

<h2>8. Qué haríamos distinto</h2>
<ul>
<li>Tapar los vasos para que no se evapore el agua.</li>
<li>Usar un sensor que apunte la temperatura solo, cada minuto.</li>
<li>Repetir diez días en vez de tres.</li>
<li>Anotar también la temperatura del congelador, que no es la misma en cada repisa.</li>
</ul>

<h2>9. Reparto del trabajo en el equipo</h2>
<p class="es-justificado es-inter-15">Lo apuntamos porque el maestro lo pidió y porque sirve para acordarnos de quién sabe hacer qué la próxima vez. Nadie hizo un solo trabajo los tres días: fuimos rotando para que todos midieran, todos apuntaran y todos escribieran una parte del reporte.</p>
<ul>
<li>Renata: control del tiempo, tabla de datos y redacción de las conclusiones.</li>
<li>Diego: pesado del agua, calentado y montaje de los vasos en el congelador.</li>
<li>Ximena: lectura del termómetro, fotos de cada revisión y revisión final del texto.</li>
<li>Ulises: preparación del material, limpieza y búsqueda de las fuentes.</li>
</ul>

<h2>10. Lo que aprendimos del método, aparte del resultado</h2>
<p class="es-justificado es-inter-15">Aprendimos que un experimento se arruina por detalles que no parecen detalles. El día uno pusimos un vaso pegado a la pared del congelador y se congeló casi media hora antes; si no lo hubiéramos notado, habríamos escrito una conclusión falsa con el dato en la mano y todo bien apuntado.</p>
<p class="es-justificado es-inter-15">También aprendimos que repetir no es perder el tiempo. Con un solo día habríamos dicho que sí, que el agua caliente se congela antes, porque eso fue lo que pasó el día uno. Con tres días la respuesta ya no fue tan cómoda, y ésa es la parte interesante.</p>
<p class="es-justificado es-inter-15">Y aprendimos a escribir lo que no salió. Al principio queríamos borrar el día tres del reporte porque no encajaba. El maestro nos dijo que ese día era el más valioso de los tres, y ahora entendemos por qué: es el que impide que nos creamos una conclusión que no aguanta.</p>

<h2>11. Fuentes que consultamos</h2>
<p class="es-justificado es-inter-15">Libro de texto de Ciencias II, bloque de temperatura y calor, páginas 88 a 96. Página de divulgación de la Universidad Nacional Autónoma de México sobre cambios de estado, consultada el 2 de octubre de 2026. Video del canal de física de la Secretaría de Educación Pública sobre el efecto Mpemba.</p>
<p class="es-justificado es-inter-15">La tabla completa con las temperaturas de los tres días, minuto por minuto, va aparte en la libreta de campo del equipo. Aquí sólo se copiaron los tiempos de congelación, porque el reporte pide el resultado y no la libreta entera.</p>
`;

/* ── 3 · Programa de la kermés ────────────────────────────────────────────── */

const KERMES = `
<h1>Programa de la kermés</h1>
<p class="es-inter-15">Escuela Primaria «Sor Juana Inés de la Cruz». Sábado 21 de noviembre de 2026, de 10 de la mañana a 4 de la tarde, en el patio y en la cancha. Organiza la Asociación de Familias con los seis grupos de tercero a sexto.</p>
<p class="es-inter-15">Todo lo que se junte este año es para cambiar las ventanas del salón de usos múltiples, que llevan dos inviernos rotas. La cuenta se publica el lunes siguiente en la entrada, peso por peso, como el año pasado.</p>

<h2>Programa por horas</h2>
<ul>
<li>10:00 — Apertura y bienvenida de la directora.</li>
<li>10:20 — Bailable de segundo y tercero.</li>
<li>11:00 — Abren todos los puestos de comida.</li>
<li>11:30 — Torneo de lotería, primera ronda.</li>
<li>12:30 — Concurso de disfraces reciclados.</li>
<li>13:30 — Rifa de la canasta, primera vuelta.</li>
<li>14:30 — Torneo de lotería, final.</li>
<li>15:30 — Rifa de la bicicleta.</li>
<li>16:00 — Cierre y limpieza entre todos.</li>
</ul>

<h2>Puestos de comida</h2>
<p class="es-inter-15">Cada grupo se hace cargo de un puesto y lo atiende por turnos de una hora, siempre con dos adultos presentes. Los precios los acordamos en la reunión del 30 de octubre y son los mismos en todos los puestos, para que no haya competencia entre grupos.</p>
<ul>
<li>Tacos de canasta, 15 pesos los tres. Puesto de 6.º A.</li>
<li>Pozole en vaso, 35 pesos. Puesto de 6.º B.</li>
<li>Quesadillas, 20 pesos. Puesto de 5.º A.</li>
<li>Aguas frescas de tres sabores, 10 pesos el vaso. Puesto de 5.º B.</li>
<li>Gelatinas y flan, 12 pesos. Puesto de 4.º A.</li>
<li>Café de olla y pan, 20 pesos. Puesto de 4.º B.</li>
<li>Elotes y esquites, 25 pesos. Puesto de 3.º A.</li>
<li>Palomitas y algodón de azúcar, 15 pesos. Puesto de 3.º B.</li>
</ul>

<h2>Juegos</h2>
<p class="es-inter-15">Los juegos se pagan con fichas, no con dinero suelto. Las fichas se compran en la mesa de la entrada, cuestan cinco pesos cada una y sirven en cualquier juego. Así los niños no andan cargando cambio y los puestos no se atoran dando vueltas.</p>
<ul>
<li>Pesca de patitos, una ficha.</li>
<li>Tiro al blanco con dardos, dos fichas.</li>
<li>Carrera de costales, una ficha.</li>
<li>Atinarle al payaso, dos fichas.</li>
<li>Lotería, tres fichas por cartón.</li>
<li>Rompe el cántaro, dos fichas.</li>
</ul>

<h2>Reglas para quien atiende un puesto</h2>
<ol>
<li>El puesto abre a la hora que dice el programa, ni antes ni después.</li>
<li>Siempre hay dos adultos en el puesto. Ningún alumno se queda solo cobrando.</li>
<li>El dinero se junta en la caja del puesto y se entrega en la mesa de tesorería cada dos horas.</li>
<li>Nadie regala ni cobra de más, aunque sea de su familia.</li>
<li>Lo que sobre de comida se reparte al final entre quienes atendieron.</li>
<li>Cada puesto recoge y limpia su espacio antes de irse.</li>
</ol>

<h2>Qué se necesita de las familias</h2>
<p class="es-inter-15">La kermés se arma con lo que cada familia pueda poner, y no todo es dinero. Hace falta gente que preste mesas y sillas, que ayude a montar desde las ocho de la mañana, que atienda una hora en un puesto y que se quede a recoger al final, que es cuando siempre falta la mitad.</p>
<ul>
<li>Mesas plegables y sillas, con el nombre marcado por debajo.</li>
<li>Dos toldos grandes para la zona de comida.</li>
<li>Hieleras y bolsas de hielo.</li>
<li>Extensiones eléctricas de al menos diez metros.</li>
<li>Premios chicos para los juegos: dulces, cuadernos, pelotas.</li>
<li>Manos para desmontar a partir de las cuatro.</li>
</ul>

<h2>Seguridad</h2>
<p class="es-inter-15">La puerta grande se queda cerrada toda la kermés y sólo se entra por la reja chica, donde hay dos personas anotando. Los niños de primero y segundo no pueden andar solos por el patio: tienen que estar con un adulto de su familia, aunque conozcan la escuela de memoria.</p>
<p class="es-inter-15">La mesa de primeros auxilios está junto a la dirección, con el botiquín y una madre de familia que es enfermera. Si un niño se pierde, se lleva a esa mesa y se anuncia por el micrófono; nadie sale de la escuela con un niño que no sea suyo.</p>

<h2>Rifas y premios</h2>
<p class="es-inter-15">Hay dos rifas y los boletos se venden desde el 10 de noviembre en la mesa de la entrada, a veinte pesos cada uno. Los premios los donaron familias y negocios del barrio, y el nombre de quien donó cada cosa va apuntado en la lista que se pega junto a la mesa, para que se sepa.</p>
<ul>
<li>Bicicleta rodada 24, donada por la refaccionaria de la esquina.</li>
<li>Canasta con despensa para un mes.</li>
<li>Vale de mil pesos en la papelería de la avenida.</li>
<li>Pastel de tres leches para veinte personas.</li>
<li>Dos boletos para el balneario de San Pedro.</li>
<li>Mochila escolar completa con útiles.</li>
</ul>
<p class="es-inter-15">Las dos rifas se hacen con micrófono y delante de todos, sacando los boletos de una tómbola. Si el número que sale no está presente, se vuelve a sacar en el momento: no se guarda ningún premio para después, porque el año pasado eso trajo problemas.</p>

<h2>Quién organiza qué</h2>
<ul>
<li>Coordinación general: comité de la Asociación de Familias.</li>
<li>Tesorería y control de fichas: dos madres de familia por turno, en la mesa de la entrada.</li>
<li>Montaje y desmontaje: familias de quinto y sexto.</li>
<li>Sonido y micrófono: el maestro de música y dos alumnos de sexto.</li>
<li>Primeros auxilios: mesa junto a la dirección.</li>
<li>Limpieza durante el día: turnos de media hora, apuntados en la lista de la entrada.</li>
</ul>

<h2>La cuenta del año pasado</h2>
<p class="es-inter-15">Lo ponemos aquí porque es lo que más se pregunta y porque es lo justo. El año pasado entraron cuarenta y ocho mil pesos entre puestos, juegos y rifas. Se gastaron catorce mil en ingredientes, toldos y premios, así que quedaron limpios treinta y cuatro mil.</p>
<p class="es-inter-15">Con eso se compraron los ventiladores de los salones de arriba y se pagó la mitad del proyector. Todo está anotado con sus notas de compra en la carpeta de la Asociación, y cualquier familia puede pedir verla en la dirección sin dar explicaciones.</p>

<h2>Después de la kermés</h2>
<p class="es-inter-15">El lunes 23 se publica la cuenta completa en la entrada y se manda por el grupo de avisos: cuánto entró por puesto, cuánto se gastó en comprar los ingredientes y cuánto quedó limpio. La cotización de las ventanas ya está pedida a dos talleres y también se publica.</p>
<p class="es-inter-15">Gracias por adelantado a quienes van a estar aquí desde las ocho de la mañana. Una kermés se ve fácil desde afuera y son dos meses de juntas, tres reuniones con la dirección y una lista de compras que nadie quiere hacer dos veces.</p>
`;

export const PLANTILLAS: Plantilla[] = [
  {
    id: 'circular',
    nombre: 'Circular para las familias',
    para: 'Dirección de la escuela',
    resumen: 'Los avisos de inicio de ciclo: horario, útiles, uniforme, reglamento y fechas.',
    pie: 'Escuela Primaria Estatal «Ignacio Ramírez» · Ciclo escolar 2026-2027',
    acento: '#185abd',
    html: CIRCULAR,
  },
  {
    id: 'reporte',
    nombre: 'Reporte de ciencias',
    para: 'Trabajo de equipo',
    resumen: 'Pregunta, hipótesis, materiales, procedimiento, resultados y conclusiones.',
    pie: 'Secundaria Técnica 12 · Ciencias II · Equipo 4 · 2.º B',
    acento: '#0f7b3f',
    html: REPORTE,
  },
  {
    id: 'kermes',
    nombre: 'Programa de la kermés',
    para: 'Asociación de familias',
    resumen: 'Horario por actividades, puestos con precios, juegos, reglas y seguridad.',
    pie: 'Escuela Primaria «Sor Juana Inés de la Cruz» · Kermés 2026',
    acento: '#c2410c',
    html: KERMES,
  },
];

export function plantillaPorId(id: string | null): Plantilla | undefined {
  return PLANTILLAS.find((p) => p.id === id);
}
