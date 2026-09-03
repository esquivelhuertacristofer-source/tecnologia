import type { ComponentType } from 'react';
import type { AppOfficeId, GradoDominio } from '@/data/curriculo';
import type { ActivityProps } from '@/types/activity-contract';

/**
 * Registro de los ejercicios EXCLUSIVOS del bloque Office (doc §33.2 y §36).
 *
 * Vive aparte de `REGISTRO_ACTIVIDADES` por la misma razón por la que
 * `EJERCICIOS_OFFICE` vive aparte de `CURRICULO`: estas clases no pertenecen a
 * ningún nivel. Meterlas en el registro general obligaría a inventarles un
 * `nivel`, una `unidadId` y un `eje` que no tienen, y la prueba de integridad
 * —que comprueba que cada entrada cuadre con su unidad— fallaría con razón.
 *
 * Las 34 clases PRESTADAS no están aquí: siguen viviendo en su nivel, con su id
 * y su progreso, y la sala las muestra desde allí.
 */

export type ComponenteOffice = ComponentType<ActivityProps<unknown, unknown>>;

export interface MetaOffice {
  /** Id con prefijo `of-`, igual al declarado en `EJERCICIOS_OFFICE`. */
  id: string;
  app: AppOfficeId;
  grado: GradoDominio;
  titulo: string;
  duracionMin: number;
  descripcion: string;
}

export interface OfficeRegistrada {
  meta: MetaOffice;
}

/* Los `import()` viven en `cargadoresOffice.ts`; el porqué está en
 * `../registry.ts`, junto a `ActividadRegistrada`. */

export const REGISTRO_OFFICE: Record<string, OfficeRegistrada> = {
  'of-word-la-cinta': {
    meta: {
      id: 'of-word-la-cinta',
      app: 'word',
      grado: 'basico',
      titulo: 'La cinta por dentro',
      duracionMin: 12,
      descripcion:
        'Entra a Tecnia Textos y aprende a buscar una herramienta por lo que hace: pestañas, grupos y el rótulo que te dice dónde mirar. Siete encargos sobre un cartel de verdad.',
    },
  },
  'of-word-parrafos-que-respiran': {
    meta: {
      id: 'of-word-parrafos-que-respiran',
      app: 'word',
      grado: 'basico',
      titulo: 'Párrafos que respiran',
      duracionMin: 14,
      descripcion:
        'Un aviso de escuela escrito todo junto, de los que nadie lee. Lo dejas legible sin cambiarle ni una palabra: párrafos, interlineado, bordes parejos y sangría.',
    },
  },
  'of-word-guardar-e-imprimir': {
    meta: {
      id: 'of-word-guardar-e-imprimir',
      app: 'word',
      grado: 'basico',
      titulo: 'Guardar, imprimir y PDF',
      duracionMin: 14,
      descripcion:
        'Escribe una línea en un aviso de la escuela y mira aparecer solo el letrero «Sin guardar»: ahí empieza todo. Ponle nombre y carpeta con Guardar como, saca la copia en PDF que es la que se manda, y cuenta las hojas en la vista previa antes de gastarlas.',
    },
  },
  'of-word-estilos-e-indice': {
    meta: {
      id: 'of-word-estilos-e-indice',
      app: 'word',
      grado: 'intermedio',
      titulo: 'Estilos y tabla de contenido',
      duracionMin: 16,
      descripcion:
        'Un título no es negrita más grande: es una etiqueta que le pones al renglón, y por eso la máquina puede escribirte el índice sola. Ocho encargos sobre el reporte de la huerta de una escuela, con panel de navegación y tabla de contenido de verdad.',
    },
  },
  'of-word-revisa-y-comenta': {
    meta: {
      id: 'of-word-revisa-y-comenta',
      app: 'word',
      grado: 'intermedio',
      titulo: 'Revisa y comenta',
      duracionMin: 18,
      descripcion:
        'Trabaja sobre el texto de otra persona sin pisarlo: corrector de ortografía, comentarios al margen y control de cambios con aceptar y rechazar. Ocho encargos sobre una nota de periódico escolar.',
    },
  },
  'of-word-busca-y-reemplaza': {
    meta: {
      id: 'of-word-busca-y-reemplaza',
      app: 'word',
      grado: 'intermedio',
      titulo: 'Busca y reemplaza',
      duracionMin: 14,
      descripcion:
        'Cambia el nombre de un personaje en las dos hojas del guion de la obra del festival, y descubre por qué «Reemplazar todos» sin mirar convierte «solamente» en «lunaamente». Siete encargos: romperlo, deshacerlo de un clic y volver a hacerlo bien.',
    },
  },
  'of-word-correspondencia': {
    meta: {
      id: 'of-word-correspondencia',
      app: 'word',
      grado: 'avanzado',
      titulo: 'Combinar correspondencia',
      duracionMin: 16,
      descripcion:
        'Escribe UNA invitación de fin de cursos con huecos —campos— y deja que la lista de ocho alumnos haga las ocho cartas. Al final se inscribe alguien más y sale la novena sin que toques la carta.',
    },
  },
  'of-word-plantillas': {
    meta: {
      id: 'of-word-plantillas',
      app: 'word',
      grado: 'avanzado',
      titulo: 'Lo que sale en todas las hojas',
      duracionMin: 16,
      descripcion:
        'Encabezado, pie de página y numeración automática: lo que se escribe una vez y aparece en todas las hojas, incluidas las que aún no existen. Se parte de una de tres plantillas de escuela mexicana y se comprueba, escribiendo a mano en la hoja 2, que eso no llega a la hoja 3.',
    },
  },
  'of-word-formularios': {
    meta: {
      id: 'of-word-formularios',
      app: 'word',
      grado: 'avanzado',
      titulo: 'Formularios y protección',
      duracionMin: 18,
      descripcion:
        'Abre tres huecos rellenables —campo de texto, lista desplegable y casilla de verificación— en la ficha de inscripción al taller de robótica, y después cierra todo lo demás con «Restringir edición». Ocho encargos sobre una ficha de escuela de verdad.',
    },
  },
  'of-word-coautoria': {
    meta: {
      id: 'of-word-coautoria',
      app: 'word',
      grado: 'avanzado',
      titulo: 'Escribir entre tres',
      duracionMin: 16,
      descripcion:
        'Tres personas escriben el mismo archivo a la vez: se ve quién escribe qué, se propone sin borrar lo de nadie, y se resuelve el choque de dos que tocan el mismo renglón. La clase que cierra la sala de Word.',
    },
  },

  /* ── PowerPoint · las siete exclusivas (§43) ─────────────────────────────── */
  'of-ppt-presenta-y-comparte': {
    meta: {
      id: 'of-ppt-presenta-y-comparte',
      app: 'powerpoint',
      grado: 'basico',
      titulo: 'Modo presentador y PDF',
      duracionMin: 14,
      descripcion:
        'Al conectar un proyector hay dos pantallas y no una: el público ve la diapositiva, y tú ves además la que viene, tus notas y un reloj. Le escribes sus notas a una presentación de la feria de ciencias, la das entera en Vista Moderador viendo las dos pantallas a la vez, y la mandas en PDF, que es la copia que se ve igual en cualquier aparato.',
    },
  },
  'of-ppt-ordena-el-mazo': {
    meta: {
      id: 'of-ppt-ordena-el-mazo',
      app: 'powerpoint',
      grado: 'basico',
      titulo: 'Cuando se hace larga',
      duracionMin: 12,
      descripcion:
        'La presentación del viaje de fin de curso llegó con dieciocho diapositivas que llenaron cinco personas, y desde la tira no se arregla porque no ves ni la mitad. Aprendes las tres vistas del programa, ordenas en el Clasificador, escondes sin borrar la que hoy no toca —sigue dentro del archivo, con el número tachado— y partes el mazo en tramos con nombre que se pliegan.',
    },
  },
  'of-ppt-smartart-y-graficos': {
    meta: {
      id: 'of-ppt-smartart-y-graficos',
      app: 'powerpoint',
      grado: 'intermedio',
      titulo: 'SmartArt, tablas y gráficos',
      duracionMin: 15,
      descripcion:
        'Hay tres cosas que en viñetas se leen mal y dibujadas se entienden solas: un proceso pide flechas, unas cantidades piden barras y un horario pide una tabla. Traduces tres diapositivas del club de reciclaje… y dejas la cuarta exactamente como está, que es la parte difícil.',
    },
  },
  'of-ppt-video-e-intervalos': {
    meta: {
      id: 'of-ppt-video-e-intervalos',
      app: 'powerpoint',
      grado: 'intermedio',
      titulo: 'Video, intervalos y ensayo',
      duracionMin: 13,
      descripcion:
        'Nadie sabe cuánto dura su presentación hasta que la ensaya con reloj, y la diapositiva que se te alarga casi nunca es la que crees. Cronometras la del robot recolector, descubres que no cabe en los noventa segundos del concurso, ves lo que cuesta meter un video, y la recortas hasta que quepa. El único encargo de la sala que lo cierra una medida y no un botón.',
    },
  },
  'of-ppt-formas-y-cajas': {
    meta: {
      id: 'of-ppt-formas-y-cajas',
      app: 'powerpoint',
      grado: 'intermedio',
      titulo: 'Lo que dibujas tú',
      duracionMin: 14,
      descripcion:
        'El laboratorio de ciencias pide un cartel del ciclo del agua y la diapositiva llega en blanco. Pones texto donde el diseño no trae ninguna caja, dibujas formas eligiendo por separado el color de dentro y el de la raya, rescatas el título de debajo de una forma, agrupas lo que va junto, y metes una gota en 3D que se gira — y que sólo vale la pena porque tiene lados.',
    },
  },
  'of-ppt-patron': {
    meta: {
      id: 'of-ppt-patron',
      app: 'powerpoint',
      grado: 'avanzado',
      titulo: 'El patrón de diapositivas',
      duracionMin: 15,
      descripcion:
        'Doce títulos que no se leen con el proyector. Los arreglas tocando uno solo: detrás de toda presentación hay una diapositiva que no se ve y de la que todas heredan. Y descubres por qué una de las doce no obedece. La misma idea que los estilos de Word y que una clase de CSS en una página web.',
    },
  },
  'of-ppt-interactiva': {
    meta: {
      id: 'of-ppt-interactiva',
      app: 'powerpoint',
      grado: 'avanzado',
      titulo: 'Presentación que se navega',
      duracionMin: 14,
      descripcion:
        'La primera presentación que no va en línea recta: un quiosco de feria de ciencias donde manda quien lo mira. Descubres que un vínculo puede llevar a otra diapositiva de la misma presentación, caes en el error número uno de todos los menús —dejar entrar a alguien a un sitio del que no puede salir— y aprendes la regla que vale igual para una página web: si se pueden ir, tienen que poder volver.',
    },
  },
  'of-ppt-revision': {
    meta: {
      id: 'of-ppt-revision',
      app: 'powerpoint',
      grado: 'avanzado',
      titulo: 'Comentarios e inspector',
      duracionMin: 13,
      descripcion:
        'Te llega la presentación del otro equipo con tres defectos claros, y lo peor que puedes hacer es arreglárselos: mañana lo vuelve a hacer igual. Aprendes a comentar diciendo qué y por qué, a ver por qué «está mal» no le sirve a nadie, y a mirar lo que un archivo lleva dentro sin que se vea — incluida una diapositiva oculta y el nombre de quien lo hizo.',
    },
  },
  'of-ppt-exporta-video': {
    meta: {
      id: 'of-ppt-exporta-video',
      app: 'powerpoint',
      grado: 'avanzado',
      titulo: 'Proteger y exportar a video',
      duracionMin: 13,
      descripcion:
        'La última de la sala, y la que contesta la pregunta con la que el bloque empezó: y esto, ¿cómo se lo mando a alguien que no está? Tres formatos y tres para qués —leerla, verla sin ti, seguir trabajándola—, lo que cada uno se deja por el camino, un video que dura exactamente lo que duró tu ensayo, y la verdad incómoda sobre las contraseñas: si se te olvida, no la recupera nadie.',
    },
  },
  'of-ppt-en-papel': {
    meta: {
      id: 'of-ppt-en-papel',
      app: 'powerpoint',
      grado: 'avanzado',
      titulo: 'Lo que se imprime',
      duracionMin: 13,
      descripcion:
        'El jurado del concurso pide tres copias en papel, y en una hoja caben seis diapositivas. El documento que se reparte —con rayas para que apunten— y las páginas de notas que te quedas tú; el molde de esas hojas, escondido en el mismo menú que el patrón de diapositivas y que casi nadie abre; y por qué una presentación de fondo oscuro se imprime en grises sin tocarle una coma. Lo que se ve y lo que sale no son lo mismo.',
    },
  },
  'of-ppt-traela-hecha': {
    meta: {
      id: 'of-ppt-traela-hecha',
      app: 'powerpoint',
      grado: 'avanzado',
      titulo: 'No la hagas dos veces',
      duracionMin: 13,
      descripcion:
        'La portada de la escuela y la del equipo ya existen: las hiciste el trimestre pasado y están en otro archivo. Y el informe entero está escrito en Word, con sus títulos puestos. Traer diapositivas sin abrir el archivo de donde salen, decidir si vienen con su cara o con la tuya —la casilla que casi nadie mira—, convertir un documento de Word en diapositivas y dejar que el índice se haga solo con tus secciones.',
    },
  },
  'of-ppt-grabala': {
    meta: {
      id: 'of-ppt-grabala',
      app: 'powerpoint',
      grado: 'avanzado',
      titulo: 'Que hable sola',
      duracionMin: 12,
      descripcion:
        'La junta de padres es el martes y ese martes tú tienes examen. Grabar la presentación es pasarla una vez hablando: se queda con lo que dijiste y con cuánto tardaste, y a partir de ahí se cuenta sola. Repetir sólo la diapositiva que te salió mal sin volver a empezar, descubrir por qué la grabación pisa los tiempos del ensayo —hablar tarda más que pasar— y quitarle la voz si al final vas tú, que si no el archivo habla por encima de ti.',
    },
  },
  'of-ppt-para-que-pantalla': {
    meta: {
      id: 'of-ppt-para-que-pantalla',
      app: 'powerpoint',
      grado: 'intermedio',
      titulo: 'El proyector del salón',
      duracionMin: 11,
      descripcion:
        'El concurso es en el salón de actos, con el proyector de siempre: viejo y cuadrado. Asomarse a esa pantalla antes del día del concurso y ver que la presentación sale estirada, cambiarla a la forma que toca —de una vez para todas— y descubrir por las malas por qué eso se hace al principio y no al final. Y el nombre de la escuela abajo en todas, escrito una sola vez, con la portada limpia.',
    },
  },

  /* ── Excel · las exclusivas (§45) ─────────────────────────────────────────
   *
   * Las cinco primeras clases de Tecnia Hojas son PRESTADAS (`n5-` y `n7-`) y
   * viven en `REGISTRO_ACTIVIDADES`, no aquí. Las que siguen son las que no
   * pertenecen a ningún nivel: su ruta sale de `comun/rutas.ts`, derivada de
   * `EJERCICIOS_OFFICE`.
   */
  'of-excel-formato-de-celda': {
    meta: {
      id: 'of-excel-formato-de-celda',
      app: 'excel',
      grado: 'basico',
      titulo: 'Número, moneda y fecha',
      duracionMin: 16,
      descripcion:
        'La hoja de los gastos está bien calculada y se lee fatal. Le pones formato de moneda a los precios y compruebas, con una cuenta al lado, que el número no cambió; después tecleas tú un signo de pesos a mano y ves a tres cuentas dejar de contar esa celda. Descubres que un porcentaje es un número entre 0 y 1 disfrazado, vistes la tabla con fondo, letra y bordes de los que sí se imprimen, y aprendes el precio de combinar celdas antes de pagarlo en una hoja de verdad. La clase que cierra el grado Básico.',
    },
  },
  'of-excel-buscarx': {
    meta: {
      id: 'of-excel-buscarx',
      app: 'excel',
      grado: 'intermedio',
      titulo: 'Traer un dato de otra tabla',
      duracionMin: 20,
      descripcion:
        'Copias un precio a mano y lo ves quedarse viejo en cuanto la papelería sube el suyo. Escribes BUSCARX con sus tres huecos —qué busco, dónde, qué me traigo—, provocas sus dos errores más comunes a propósito, y cazas con LARGO un espacio invisible que hace fallar un dato que estaba ahí delante. Después partes una lista de nombres pegados con IZQUIERDA, DERECHA y EXTRAE, y la vuelves a juntar con CONCAT y UNIRCADENAS para descubrir la diferencia.',
    },
  },
  'of-excel-tablas-y-filtros': {
    meta: {
      id: 'of-excel-tablas-y-filtros',
      app: 'excel',
      grado: 'intermedio',
      titulo: 'Tabla, filtros y paneles fijos',
      duracionMin: 24,
      descripcion:
        'El comité de padres lleva la cuota de la kermés de cuarenta alumnos, y ya no cabe en la pantalla. La conviertes en una tabla de Excel de verdad —nombre, sabe dónde acaba, crece sola cuando escribes debajo— y le pones un estilo y una fila de totales que cuenta sólo lo que ves. Filtras por grupo y compruebas, con una SUMA de siempre puesta al lado, que filtrar esconde y no borra; y descubres por las malas que borrar de más sobre una lista filtrada sí alcanza lo que no ves. Ordenas por varias columnas en el orden de prioridad correcto después de probar el desorden que deja el equivocado, ves a Excel negarse a ordenar una tabla filtrada, y clavas la fila de títulos con Inmovilizar para no perderte entre cuarenta filas.',
    },
  },
  'of-excel-datos-limpios': {
    meta: {
      id: 'of-excel-datos-limpios',
      app: 'excel',
      grado: 'avanzado',
      titulo: 'Antes de calcular, limpia',
      duracionMin: 20,
      descripcion:
        'Una lista de inscripciones que llegó de tres mesas distintas y sin revisar: un alumno anotado dos veces letra por letra igual, y la misma alumna capturada de tres maneras que a la hoja le parecen tres personas. Quitas el duplicado de verdad y descubres, con CONTAR.SI, que quedan tres Ana Torres sin juntar. Limpias una columna de nombres con Relleno rápido y lo ves fallar a la mitad sin avisar, le das al saldo un formato de número que tú mismo escribes —negativos en rojo y entre paréntesis— y pintas la fila entera del que debe dinero con una regla de fórmula, rompiéndola primero sin el $ para ver la trampa clásica. La primera clase del grado Avanzado.',
    },
  },
  'of-excel-auditoria': {
    meta: {
      id: 'of-excel-auditoria',
      app: 'excel',
      grado: 'avanzado',
      titulo: 'Por qué esta celda dice eso',
      duracionMin: 20,
      descripcion:
        'La cooperativa escolar heredó su corte de caja del tesorero del año pasado, y la Ganancia neta enseña #¡REF! en vez de un número. Rastreas precedentes para remontar el río de fórmula en fórmula hasta encontrar que el error de verdad no nace ahí, sino en una referencia rota tres celdas río arriba. Lees #¡DIV/0! y #¿NOMBRE? como las pistas que son, rastreas dependientes para saber a quién le afecta un dato antes de tocarlo, y tapas un error a lo bruto con SI.ERROR para sentir el daño —una hoja preciosa y mentirosa— antes de aprender a mirar primero, reparar la causa cuando se puede, y explicar con un texto cuando lo único honesto es decir que falta un dato.',
    },
  },
  'of-excel-consolida-y-protege': {
    meta: {
      id: 'of-excel-consolida-y-protege',
      app: 'excel',
      grado: 'avanzado',
      titulo: 'Juntar hojas y cerrar con llave',
      duracionMin: 20,
      descripcion:
        'La kermés de la escuela: Grupo A, Grupo B y Grupo C reportan lo recaudado cada uno en su propia hoja, idéntica a las otras dos. Las juntas en una sola hoja Total con fórmulas que se recalculan solas —lo compruebas cambiando un dato de un grupo y viendo moverse el total sin tocarlo—, y provocas a propósito el aviso de «no tienen la misma forma» antes de consolidar bien. Después preparas la hoja de un grupo para que la sigan llenando las familias: descubres, jugando mal, que proteger una hoja bloquea TODO —hasta la celda que querías dejar viva— y que hay que desbloquear ANTES de proteger, no después. Cierras protegiendo también la estructura del libro, para que a nadie se le vaya a ocurrir borrar o renombrar una de las tres hojas de grupo. Sin contraseña, y se dice por qué: esto protege de un despiste, no de alguien con malas intenciones.',
    },
  },
  'of-excel-y-si': {
    meta: {
      id: 'of-excel-y-si',
      app: 'excel',
      grado: 'avanzado',
      titulo: '¿Y si fuera de otra manera?',
      duracionMin: 22,
      descripcion:
        'El comité ya apartó el camión para la salida a Teotihuacán y faltan 3.000 pesos: la aportación de siempre no alcanza. En vez de tantear a mano, le pides a la hoja el resultado que hace falta y dejas que ella encuentre el dato con Buscar objetivo — la primera vez en toda la sala que la hoja se usa al revés. Provocas sus tres formas de fallar —una celda objetivo que no es fórmula, una celda que se mueve y en realidad es una fórmula, y el error número uno, mover una celda que no influye en el objetivo— y compruebas que hay preguntas sin respuesta. Después guardas varias versiones de la misma pregunta con nombre para comparar sin perder ninguna, y descubres el peligro de aplicar un escenario sobre una celda que tiene su propia fórmula.',
    },
  },
  'of-excel-tabla-dinamica': {
    meta: {
      id: 'of-excel-tabla-dinamica',
      app: 'excel',
      grado: 'avanzado',
      titulo: 'Tu primera tabla dinámica',
      duracionMin: 24,
      descripcion:
        'La cooperativa escolar apuntó las trescientas ventas del semestre —fecha, mes, categoría, producto, cantidad, precio e importe— y la maestra pregunta en qué se vendió más. La respuesta no está escrita en ninguna parte: está repartida en trescientas filas que nadie puede sumar de cabeza. La resumes en cinco renglones sin escribir una sola fórmula, que es la primera vez en todo el temario, y descubres que con SUMAR.SI harías lo mismo pero tendrías que saber de antemano qué categorías existen. Mueves el mismo campo de filas a columnas y compruebas que eso no cambia el dibujo: cambia la pregunta. Resumes el mismo cruce con suma, con cuenta y con promedio, y ves que la categoría que más dinero deja no es la que más veces se vende sin que ninguno de los tres números mienta. Anidas producto dentro de categoría con sus subtotales. Y aprendes lo que casi nadie sabe: que la dinámica no se entera sola de que corregiste un dato —hay que pulsar Actualizar—, que su región es de sólo lectura porque ahí no hay nada escrito, y que un hueco del cruce es vacío y no cero.',
    },
  },
  'of-excel-grafico-dinamico': {
    meta: {
      id: 'of-excel-grafico-dinamico',
      app: 'excel',
      grado: 'avanzado',
      titulo: 'Gráfico dinámico y segmentación',
      duracionMin: 24,
      descripcion:
        'La tabla dinámica de la cooperativa ya está hecha —Categoría en filas, Importe sumado— y nadie va a colgar una tabla de números en el mural. La conviertes en un gráfico que come de la dinámica y no de un rango, y compruebas que sólo se mueve cuando actualizas la dinámica, nunca antes. Pones una segmentación —un mando de botones que filtra la dinámica y el gráfico a la vez, y que se ve, a diferencia de un filtro de tabla escondido en un menú—. Trazas la misma línea de tendencia con seis meses y con cuatro, y descubres que el motor traza la recta igual de convencido con los dos: decidir si son suficientes es trabajo tuyo. Y usas un segundo eje para resolver un problema real —pesos y piezas en la misma gráfica, donde una serie aplasta a la otra— antes de construir, a propósito, la mentira clásica de cortarlo hasta que dos curvas sin relación parezcan ir de la mano, y deshacerla.',
    },
  },
  'of-excel-validacion': {
    meta: {
      id: 'of-excel-validacion',
      app: 'excel',
      grado: 'intermedio',
      titulo: 'Que no se pueda escribir cualquier cosa',
      duracionMin: 22,
      descripcion:
        'El comité de la kermés reparte una hoja para que otras diez familias anoten qué van a traer, a mano y sin que nadie las vigile. Sufres primero lo que pasa cuando esa columna se captura libre —una cuenta que debería dar cuatro y da dos—, y diseñas la hoja para que no vuelva a pasar: una lista que Detiene cualquier categoría que no exista, y descubres que la regla no revisa lo que ya estaba escrito antes de ponerla. Pones un rango de piezas que sólo Advierte y deja pasar si insistes, hasta que deja de hacer falta. Reemplazas un texto leyendo el aviso antes de confirmar, para no romper sin querer una fórmula que lo usaba, y buscas mirando el valor y la fórmula —no es lo mismo— y vas directo a un rango por su nombre. La última clase del grado Intermedio.',
    },
  },
  'of-excel-macros': {
    meta: {
      id: 'of-excel-macros',
      app: 'excel',
      grado: 'avanzado',
      titulo: 'Graba tu primera macro',
      duracionMin: 22,
      descripcion:
        'El comité de materiales reparte una hoja nueva cada semana, y hay que dejarla presentable: negrita, color, moneda y un Total. Grabas los ocho pasos una vez, los lees en español —con tu error y tu corrección adentro—, y descubres jugándolo tú mismo qué pasa cuando ejecutas la macro después de que la hoja cambió de forma: se come el importe de un concepto nuevo, porque una macro repite lo que hiciste, no lo que querías. Asignas la macro a un botón y cierras entendiendo qué es de verdad un .xlsm y qué significa habilitar macros.',
    },
  },
  'of-excel-dashboard': {
    meta: {
      id: 'of-excel-dashboard',
      app: 'excel',
      grado: 'avanzado',
      titulo: 'Un tablero de una sola pantalla',
      duracionMin: 26,
      descripcion:
        'Mañana hay junta y le tienes que enseñar a la directora, en una sola pantalla, cómo le fue a la cooperativa este semestre: no va a desplazarse, no va a abrir otra hoja y no va a preguntar. No se estrena ninguna herramienta —se elige entre las veintidós anteriores— y la mitad del trabajo es decidir qué NO poner: empiezas por las tres preguntas y no por los datos, y borras un pastel bien hecho y tres minigráficos bien hechos porque no contestan ninguna. Después destapas la peor mentira del curso, un #¡DIV/0! escondido detrás de un SI.ERROR que convierte «+15 %» en un cero de aspecto profesional, y rematas el tablero: resumen con dinámica, una sola gráfica, color que avisa solo, la banda clavada arriba, la hoja con llave y una hoja de papel. La última clase de la sala de Excel.',
    },
  },

  /* ── Microsoft 365 · equivalencias con otras suites (§58) ─────────────────
   *
   * A diferencia de Word/Excel/PowerPoint, M365 no tiene un motor propio
   * (`VentanaTextos`/`VentanaHojas`/`VentanaDiapositivas`): sus clases son
   * simuladores autocontenidos y pequeños, cada uno con su propia ventana.
   */
  'of-m365-otra-caja': {
    meta: {
      id: 'of-m365-otra-caja',
      app: 'm365',
      grado: 'avanzado',
      titulo: 'El mismo trabajo en otra caja',
      duracionMin: 15,
      descripcion:
        'Llegas a un equipo que no usa la suite de siempre, sino "Tecnia Nube Suite". Das formato a un título, calculas un promedio real con una función distinta y cambias el tema de una diapositiva: el oficio no cambia aunque los botones sí.',
    },
  },
  'of-m365-calendario': {
    meta: {
      id: 'of-m365-calendario',
      app: 'm365',
      grado: 'intermedio',
      titulo: 'Calendario y citas',
      duracionMin: 15,
      descripcion:
        'Organiza la agenda semanal de la Feria Científica en Tecnia Calendario: crea la cita de la demostración, invita al profesor, acepta la invitación del jurado y resuelve el choque de horario eligiendo una nueva hora de un selector — nunca arrastrando.',
    },
  },
  'of-m365-copiloto': {
    meta: {
      id: 'of-m365-copiloto',
      app: 'm365',
      grado: 'avanzado',
      titulo: 'Qué hace y qué no hace un copiloto',
      duracionMin: 15,
      descripcion:
        'El equipo del periódico escolar tiene que publicar un informe en cinco minutos. Le pides a Tecnia Copiloto un borrador y un resumen, y auditas cada respuesta: una cifra del resumen no coincide con la fuente oficial, y hay que corregirla a mano. Al final, rechazas una sugerencia imprudente y publicas con tu propio criterio.',
    },
  },
};

export function getOfficeRegistrada(id: string): OfficeRegistrada | undefined {
  return REGISTRO_OFFICE[id];
}

export function idsOfficeRegistrados(): string[] {
  return Object.keys(REGISTRO_OFFICE);
}
