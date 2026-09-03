# Temario completo · Microsoft Word 2026 (Microsoft 365)

**Para:** CEN · Campaña Educativa Nacional · plataforma Tecnia
**Fecha:** 9 de agosto de 2026 · **versión 3**
**Sustituye a:** los 12 temas de Word de `OFFICE_CURRICULO` en `curriculo.ts`

**154 temas · 17 unidades · 9 proyectos · 2 simulacros de certificación · 3 grados**

> **Registro de revisión.**
> **v1 (112 temas)** — le faltaban 36. El hueco más grave era el principio: la unidad 1 describía la ventana de un documento **que ya estaba abierto**, sin crear, abrir, cerrar ni trabajar con varios documentos —la categoría entera «Using the Application» de ICDL—. Faltaban también hipervínculos (MO-110 1.1), insertar y eliminar filas de tabla, tabulaciones y reiniciar la numeración (MO-110 3.3).
> **v2 (148 temas)** — corregidos los 36, y añadida la comprobación de cobertura subdominio por subdominio.
> **v3 (154 temas)** — seis temas más encontrados en una tercera pasada, entre ellos «Igual que el anterior» y la numeración multinivel enlazada a los estilos de título, que son los dos tropiezos más comunes de cualquiera con un documento largo. Y lo más importante de esta versión: **§2 la espina de proyectos y §3 la rúbrica**, porque un temario no es un curso.

---

## 0. Cómo se arma un temario de Word, y por qué éste está armado así

No hay un temario oficial de Word. Hay **tres maneras distintas** de escribir uno, cada una hecha para un fin diferente, y ninguna sirve sola para una escuela. Se revisaron las tres.

### 0.1 Por competencia certificable — Microsoft Office Specialist

Es el inventario oficial de Microsoft, y son **dos exámenes**:

| Examen | Certificación | Dominios | Peso |
|---|---|---|---|
| **MO-110** | Word Associate (Microsoft 365 Apps) | Manage documents · Insert and format text, paragraphs and sections · Manage tables and lists · Create and manage references · Insert and format graphic elements · Manage document collaboration | 20-25 · 20-25 · 20-25 · 5-10 · 15-20 · 5-10 % |
| **MO-111** | Word Expert (Microsoft 365 Apps) | Manage document options and settings · Use advanced editing and formatting · Create custom document elements · Use advanced Word features | 20-25 · 20-25 · 20-25 · 25-30 % |

**Qué aporta:** es **completo** en lo que evalúa, y es certificable: un alumno de bachillerato puede salir con un papel que sirve en el mercado laboral.

**Qué NO aporta:** dos cosas, y las dos importan. Primero, es un plano de examen y no un orden de enseñanza: supone un adulto con ~150 horas de práctica. Segundo —y esto es lo que hizo fallar la versión 1 de este temario— **el examen da por sabido todo lo elemental**: no evalúa «crear un documento nuevo» ni «abrir» ni «guardar» a secas, porque el candidato ya llega con el archivo abierto en la pantalla. Un temario escolar que copie MOS sin más se salta el primer día de clase.

> **Nota de fuente.** Los nombres de dominio y los pesos porcentuales están verificados en learn.microsoft.com. El **desglose fino de cada objetivo** procede de dos recopilaciones de terceros (Testprep Training y CloudThat), porque los PDF oficiales de Microsoft vienen como imagen y no se pudieron leer. Las dos coinciden entre sí. Antes de dar el temario por definitivo conviene cotejarlo a mano contra los dos PDF oficiales.

### 0.2 Por tarea de la vida real — ICDL / ECDL Documents 6.0

Seis categorías: **Using the Application · Document Creation · Formatting · Objects · Mail Merge · Prepare Outputs**. 15-20 horas de formación.

**Qué aporta:** el **orden** —está organizado como se termina un documento de verdad: abrir → escribir → dar formato → meter objetos → preparar la salida → imprimir—, y sobre todo la categoría **«Using the Application»**, que es exactamente lo que MOS da por sabido.

**Qué NO aporta:** profundidad. Se queda en Word 2016 y no llega ni a estilos serios ni a nada de nube.

### 0.3 Por progresión escolar — *scope and sequence* K-12

Lo que los distritos escolares publican: la mecanografía se enseña en **3.º a 5.º**, con la técnica y la exactitud por delante de la velocidad; en **6.º a 8.º** esas destrezas se trasladan al procesador de textos como aplicación; de ahí en adelante, Word es la herramienta con la que se entregan los trabajos de las demás materias.

**Qué aporta:** el **cuándo**. Es la única de las tres que respeta lo que un niño de ocho años puede hacer.

**Qué NO aporta:** el qué.

### 0.4 Lo que ninguna de las tres tiene: Word en 2026 no es Word 2019

Hoy, en Microsoft 365, un documento se escribe con **dictado por voz**, se revisa con el **Editor**, se lee con el **Lector inmersivo**, se comprueba con el **Comprobador de accesibilidad**, se trabaja **en la nube con varias personas a la vez**, tiene **historial de versiones**, y desde 2024 se redacta, reescribe y resume con **Copilot**.

MO-110 ya recoge la accesibilidad (dominio 1.4) y la colaboración (dominio 6). **Copilot no está en ningún examen todavía.** Para esta plataforma —cuya promesa son diez niveles *con IA*— dejarlo fuera sería el mismo error que dar Word sin Word.

### 0.5 El método

> **ICDL dice POR DÓNDE SE EMPIEZA.** Abrir el programa y crear el archivo.
> **MOS dice QUÉ.** El inventario completo y auditable de los dos exámenes.
> **El *scope and sequence* escolar dice CUÁNDO.** Qué grado aguanta qué.
> **Los proyectos dicen PARA QUÉ.** Sin ellos son 30 ejercicios sueltos.
> **Y dos hilos atraviesan los tres grados:** accesibilidad e inteligencia artificial.

Cada tema lleva **el código del objetivo MOS** al que corresponde, para que el temario sea auditable y para que el grado Avanzado se pueda presentar como preparación real a la certificación. Los temas sin código son los que la escuela necesita y el examen no pide: lo elemental que MOS da por sabido, el criterio, la ética y el porqué de las cosas.

**Leyenda:** `1.1`–`6.2` = MO-110 (Associate) · `E1.1`–`E4.3` = MO-111 (Expert) · **♿** = hilo de accesibilidad · **🤖** = hilo de IA · **○** = no está en ningún examen; lo pide la escuela.

---

## 1. El temario

| Grado | Niveles | Unidades | Temas | Proyectos |
|---|---|---|---|---|
| Básico | 3 · 4 · 5 | 6 | 73 | 3 |
| Intermedio | 6 · 7 · 8 | 5 | 40 | 3 + simulacro MO-110 |
| Avanzado | 9 · 10 | 6 | 41 | 3 + simulacro MO-111 |

---

## GRADO BÁSICO — «Escribo un documento y lo termino»

**Niveles 3, 4 y 5 · 8 a 11 años · 6 unidades · 73 temas**

Meta del grado: que un niño **cree** un documento desde cero y lo produzca **terminado** —escrito, con formato, con una imagen, guardado, en PDF e impreso— y sepa nombrar lo que está tocando.

### U1 · Abrir Word y hacer un documento — 12 temas

| # | Tema | MOS |
|---|---|---|
| 1 | Qué es un procesador de textos y para qué **no** sirve | ○ |
| 2 | Abrir y cerrar Word; la pantalla de inicio | ○ |
| 3 | **Crear un documento nuevo**: en blanco o desde una plantilla | ○ |
| 4 | Abrir un documento que ya existe; los documentos recientes | ○ |
| 5 | Cerrar un documento y cerrar el programa | ○ |
| 6 | Varios documentos abiertos a la vez y cambiar entre ellos | ○ |
| 7 | La ventana: barra de título, cinta, regla, página y barra de estado | ○ |
| 8 | La cinta de opciones: pestañas, grupos y el rótulo del grupo | ○ |
| 9 | El zoom y los modos de vista | ○ |
| 10 | Mostrar y ocultar marcas de formato: ¶, espacios y saltos | 1.1 |
| 11 | Moverse por el documento: desplazamiento, «Ir a» y panel de navegación | 1.1 |
| 12 | La Ayuda de Word y el buscador de la cinta | ○ |

### U2 · Escribir de verdad — 14 temas

| # | Tema | MOS |
|---|---|---|
| 13 | Postura, fila guía y las dos manos | ○ |
| 14 | Mayúsculas, acentos, ñ y los signos del español (¿ ¡ «») | ○ |
| 15 | Atajos de teclado esenciales | ○ |
| 16 | Seleccionar: palabra, renglón, párrafo, todo | ○ |
| 17 | Deshacer y rehacer: la red de seguridad | ○ |
| 18 | Copiar, cortar y pegar — y las opciones de pegado | 2.1 |
| 19 | Buscar y reemplazar | 2.1 |
| 20 | Símbolos y caracteres especiales | 2.1 |
| 21 | Insertar fecha y hora | ○ |
| 22 | Cambiar mayúsculas y minúsculas | ○ |
| 23 | Autocorrección: qué te corrige sola y cómo apagarla | ○ |
| 24 | El Editor: ortografía y gramática — y por qué a veces se equivoca | 🤖 ○ |
| 25 | Sinónimos | ○ |
| 26 | Contar palabras y caracteres | ○ |

### U3 · Que se vea bien — 13 temas

| # | Tema | MOS |
|---|---|---|
| 27 | Fuente, tamaño, color y resaltado | 2.2 |
| 28 | Negrita, cursiva y subrayado — y cuándo **no** usarlos | 2.2 |
| 29 | Efectos de texto y WordArt | 2.2 |
| 30 | Alineación: izquierda, centro, derecha, justificada | 2.2 |
| 31 | Interlineado y espacio entre párrafos | 2.2 |
| 32 | Sangrías y la regla | 2.2 |
| 33 | Tabulaciones y los tabuladores de la regla | ○ |
| 34 | Bordes y sombreado de párrafo | ○ |
| 35 | Letra capital | ○ |
| 36 | Copiar formato con la brocha | 2.2 |
| 37 | Borrar todo el formato | 2.2 |
| 38 | Estilos rápidos: Normal, Título 1, Título 2 | 2.2 |
| 39 | Conjuntos de estilos: cambiar el aspecto de todo el documento de un golpe | 1.2 |

### U4 · Listas y tablas sencillas — 11 temas

| # | Tema | MOS |
|---|---|---|
| 40 | Viñetas y listas numeradas | 3.3 |
| 41 | Cambiar la viñeta y el formato del número | 3.3 |
| 42 | Definir una viñeta o un formato de número propios | 3.3 |
| 43 | Subir y bajar de nivel; listas multinivel (1 · 1.1 · 1.1.1) | 3.3 |
| 44 | Iniciar, reiniciar y continuar la numeración | 3.3 |
| 45 | Crear una tabla indicando filas y columnas | 3.1 |
| 46 | Escribir en la tabla y moverse con Tab | 3.1 |
| 47 | Insertar y eliminar filas y columnas | ○ |
| 48 | Combinar y dividir celdas | 3.2 |
| 49 | Ancho de columna, alto de fila y distribuir uniformemente | 3.2 |
| 50 | Bordes, sombreado y estilos de tabla | 3.2 |

### U5 · Imágenes y dibujos — 10 temas

| # | Tema | MOS |
|---|---|---|
| 51 | Insertar una imagen: del equipo, de archivo o en línea | 5.1 |
| 52 | Cambiar el tamaño sin deformar, y recortar | 5.2 |
| 53 | Ajuste de texto: en línea, cuadrado, estrecho, detrás | 5.4 |
| 54 | Mover, alinear y ordenar objetos | 5.4 |
| 55 | Agrupar y desagrupar | ○ |
| 56 | Formas: dibujar, rellenar y contornear | 5.1 |
| 57 | Iconos | 5.1 |
| 58 | Cuadros de texto y texto dentro de una forma | 5.1 · 5.3 |
| 59 | Un gráfico de datos dentro del documento (barras, pastel) | ○ |
| 60 | **Texto alternativo: la imagen para quien no la ve** | ♿ 5.4 |

### U6 · Terminar el documento — 13 temas

| # | Tema | MOS |
|---|---|---|
| 61 | Márgenes, orientación y tamaño de papel | 1.2 |
| 62 | Encabezado, pie de página y número de página | 1.2 |
| 63 | Portada y salto de página | 1.2 · 2.3 |
| 64 | **Guardar**: dónde, con qué nombre y qué es `.docx` | 1.3 |
| 65 | Guardar en otros formatos: `.doc`, `.txt`, `.rtf`, plantilla | 1.3 |
| 66 | AutoGuardado, guardar en la nube y recuperar lo que no guardaste | ○ |
| 67 | Guardar como PDF, y por qué se manda un PDF y no un Word | 1.3 |
| 68 | Abrir y editar un PDF dentro de Word | ○ |
| 69 | Propiedades del documento: título, autor y etiquetas | 1.3 |
| 70 | Vista previa e imprimir | 1.3 |
| 71 | Opciones de impresión: intervalo, copias, varias páginas por hoja | 1.3 |
| 72 | Compartir un enlace en lugar de mandar el archivo | 1.3 |
| 73 | Word en la web y en el celular: qué cambia y qué no | ○ |

---

## GRADO INTERMEDIO — «Hago un trabajo escolar largo, y en equipo»

**Niveles 6, 7 y 8 · 11 a 14 años · 5 unidades · 40 temas**

Meta del grado: que el alumno produzca un **trabajo largo con estructura** —índice automático, secciones, citas, figuras numeradas— y sepa trabajarlo con otras personas sin pisarse. **Al terminar este grado, MO-110 queda cubierto entero.**

### U7 · Documentos largos y estructurados — 13 temas

| # | Tema | MOS |
|---|---|---|
| 74 | Estilos de verdad: aplicar, modificar, y por qué el formato **es** estructura | 2.2 · E2.3 |
| 75 | Navegar un documento largo por sus títulos | 1.1 |
| 76 | Vista Esquema: reordenar el documento arrastrando títulos | ○ |
| 77 | Hipervínculos y marcadores: enlazar dentro y fuera del documento | 1.1 |
| 78 | Tabla de contenido automática, y actualizarla | 4.2 |
| 79 | Personalizar la tabla de contenido | 4.2 |
| 80 | Notas al pie y notas al final | 4.1 |
| 81 | Citas y bibliografía (APA) | ○ |
| 82 | Saltos de sección: qué son y por qué existen | 2.3 |
| 83 | Encabezados y pies distintos por sección | 1.2 |
| 84 | **«Igual que el anterior»**: vincular y desvincular encabezados entre secciones | 1.2 |
| 85 | Numeración de página: empezar en otro número, portada sin número | 1.2 |
| 86 | Columnas periodísticas y saltos de columna | 2.3 |

### U8 · Tablas y datos — 7 temas

| # | Tema | MOS |
|---|---|---|
| 87 | Convertir texto en tabla, y tabla en texto | 3.1 |
| 88 | Ordenar los datos de una tabla | 3.2 |
| 89 | Fila de encabezado que se repite en cada página | 3.2 |
| 90 | Márgenes y espaciado de celda; alineación del contenido | 3.2 |
| 91 | Propiedades de tabla y ajuste del texto alrededor de la tabla | 3.2 |
| 92 | Dividir una tabla y ajustar su tamaño | 3.2 |
| 93 | Diseñar una tabla que se lea: cuándo la línea sobra | ○ |

### U9 · Ilustrar con criterio — 7 temas

| # | Tema | MOS |
|---|---|---|
| 94 | SmartArt: diagramas que explican algo | 5.1 · 5.3 |
| 95 | Quitar el fondo de una imagen; efectos y estilos de imagen | 5.2 |
| 96 | Efectos artísticos y formato de elementos gráficos | 5.2 |
| 97 | Captura de pantalla y recorte de pantalla | 5.1 |
| 98 | Modelos 3D | 5.1 · 5.2 |
| 99 | Ecuaciones y símbolos matemáticos | ○ |
| 100 | Fondo de página: marca de agua, color y borde | 1.2 |

### U10 · Trabajo en equipo — 8 temas

| # | Tema | MOS |
|---|---|---|
| 101 | Comentarios: añadir, responder, resolver y eliminar | 6.1 |
| 102 | Menciones (@) y asignar una tarea dentro de un comentario | ○ |
| 103 | Control de cambios: activarlo y leer lo que cambió | 6.2 |
| 104 | Aceptar y rechazar cambios; bloquear el control de cambios | 6.2 |
| 105 | Coautoría en tiempo real en la nube | ○ |
| 106 | Historial de versiones y volver a una anterior | E1.1 |
| 107 | Comparar y combinar dos documentos | E1.1 |
| 108 | Compartir con permisos y enviar por correo desde Word | ○ |

### U11 · Un documento que cualquiera pueda leer — 5 temas ♿

| # | Tema | MOS |
|---|---|---|
| 109 | El Comprobador de accesibilidad: errores, advertencias y sugerencias | ♿ 1.4 |
| 110 | Títulos reales en vez de «negrita grande»: cómo lo lee un lector de pantalla | ♿ 1.4 |
| 111 | Texto alternativo, contraste y tamaño mínimo de letra | ♿ 1.4 |
| 112 | Inspeccionar el documento: datos ocultos e información personal | 1.4 |
| 113 | Lector inmersivo, leer en voz alta y dictado por voz | ♿ 🤖 ○ |

---

## GRADO AVANZADO — «Produzco documentos profesionales»

**Niveles 9 y 10 · bachillerato · 6 unidades · 41 temas**

Meta del grado: documentos de **nivel profesional** —plantillas propias, índices, formularios, correspondencia masiva— y **MO-111 cubierto entero**. Aquí el registro sube: se le habla a alguien de 17 años, no a un niño.

### U12 · El documento como sistema — 9 temas

| # | Tema | MOS |
|---|---|---|
| 114 | Plantillas: usar una, modificarla y crear la propia | E1.1 |
| 115 | Cambiar la fuente predeterminada de la plantilla Normal | E1.1 |
| 116 | Crear estilos de párrafo propios | E2.3 |
| 117 | Crear estilos de carácter propios | E2.3 |
| 118 | **Numeración multinivel enlazada a los estilos de título** (1 · 1.1 · 1.1.1 automáticos) | E2.3 |
| 119 | Copiar estilos a otro documento o a una plantilla | E2.3 |
| 120 | Conjuntos de colores, de fuentes y temas propios | E3.2 |
| 121 | Bloques de creación y elementos rápidos (QuickParts) | E3.1 |
| 122 | Vincular contenido externo dentro del documento | E1.1 |

### U13 · Edición avanzada — 7 temas

| # | Tema | MOS |
|---|---|---|
| 123 | Buscar y reemplazar con comodines y caracteres especiales | E2.1 |
| 124 | Buscar y reemplazar formato y estilos | E2.1 |
| 125 | Opciones de pegado y pegado especial | E2.1 |
| 126 | Partición de palabras (guiones) y números de línea | E2.2 |
| 127 | Paginación del párrafo: viudas, huérfanas, «conservar con el siguiente» | E2.2 |
| 128 | Idiomas de edición y de presentación | E1.3 |
| 129 | Funciones específicas del idioma; traducir | E1.3 |

### U14 · Referencias de publicación — 5 temas

| # | Tema | MOS |
|---|---|---|
| 130 | Marcar entradas de índice | E3.3 |
| 131 | Crear y actualizar un índice alfabético | E3.3 |
| 132 | Títulos de figura y de tabla: insertar y configurar propiedades | E3.4 |
| 133 | Tabla de ilustraciones | E3.4 |
| 134 | Referencias cruzadas | ○ |

### U15 · Automatizar — 8 temas

| # | Tema | MOS |
|---|---|---|
| 135 | Correspondencia: origen de datos y lista de destinatarios | E4.3 |
| 136 | Insertar campos combinados | E4.3 |
| 137 | Vista previa de la combinación | E4.3 |
| 138 | Generar cartas, etiquetas y sobres | E4.3 |
| 139 | Campos personalizados y sus propiedades | E4.1 |
| 140 | Controles de contenido: formularios que se llenan | E4.1 |
| 141 | Grabar, nombrar y editar macros sencillas | E4.2 |
| 142 | Copiar macros a otro documento; barra de acceso rápido y pestañas ocultas | E4.2 · E1.1 |

### U16 · Proteger y publicar — 4 temas

| # | Tema | MOS |
|---|---|---|
| 143 | Restringir la edición | E1.2 |
| 144 | Proteger con contraseña; marcar como final | E1.2 |
| 145 | Habilitar macros de forma segura en un documento | E1.1 |
| 146 | Compatibilidad con versiones anteriores; PDF etiquetado y accesible | ♿ 1.4 |

### U17 · Copilot y escritura con IA — 8 temas 🤖

> Esta unidad no está en ningún examen MOS. Está porque en 2026 así se escribe. Es también la única unidad que enseña algo que **no** es Word: cómo responsabilizarse de un texto que no escribiste tú solo.
>
> **Advertencia de construcción:** fingir respuestas de una IA es enseñar una IA falsa. O el simulador se conecta a un modelo de verdad, o esta unidad se replantea como criterio y ética con casos grabados —sin simular la conversación—. Es una decisión pendiente, no un detalle de implementación.

| # | Tema | MOS |
|---|---|---|
| 147 | Qué es Copilot en Word y qué **no** es | 🤖 ○ |
| 148 | Redactar un borrador desde una indicación o un guion | 🤖 ○ |
| 149 | Reescribir: tono, extensión y claridad | 🤖 ○ |
| 150 | Resumir un documento y preguntarle al documento | 🤖 ○ |
| 151 | Fundamentar en archivos de referencia | 🤖 ○ |
| 152 | Convertir un párrafo denso en una tabla | 🤖 ○ |
| 153 | Verificar y citar: el alumno firma, no la IA | 🤖 ○ |
| 154 | Honestidad académica: cuándo hay que declarar que usaste IA | 🤖 ○ |

---

## 2. La espina de proyectos

**Por qué existe esta sección.** Nadie aprende Word haciendo treinta ejercicios sueltos. Se aprende **haciendo cosas**: un documento que alguien más va a leer, que hay que terminar, y donde los temas se combinan solos porque el producto los exige. Sin esta espina, el temario es una lista de contenidos correcta que no produce a nadie que sepa usar Word.

**Regla:** un proyecto **no** enseña temas nuevos. Cierra un bloque y obliga a usar junto lo que se enseñó suelto. Se entrega, se ve, y se califica con la rúbrica de §3.

### Grado Básico

| Proyecto | Cuándo | Qué se entrega | Temas que obliga a combinar |
|---|---|---|---|
| **P1 · Mi ficha** | tras U1–U3 | Una hoja sobre sí mismo: título con WordArt, tres párrafos con fuente e interlineado elegidos, guardada con su nombre en su carpeta | 3, 13–20, 27–32, 64 |
| **P2 · El cartel del salón** | tras U4–U5 | Un cartel con una lista, una tabla sencilla y una imagen con ajuste de texto — y su texto alternativo | 40–50, 51–60 |
| **P3 · Mi cuento ilustrado** | tras U6 · **cierre de grado** | Cuento de 4 páginas: portada, encabezado con su nombre, número de página, dos imágenes, guardado en `.docx`, exportado a PDF e impreso | 61–73 + todo lo anterior |

### Grado Intermedio

| Proyecto | Cuándo | Qué se entrega | Temas que obliga a combinar |
|---|---|---|---|
| **P4 · El reporte de ciencias** | tras U7–U8 | 6+ páginas: jerarquía con estilos, tabla de contenido que se actualiza sola, notas al pie, una tabla de datos ordenada con encabezado repetido, citas en APA | 74–93 |
| **P5 · El periódico escolar** | tras U9 | Dos columnas, un SmartArt, una foto con el fondo quitado, marca de agua y secciones con encabezados distintos | 82–86, 94–100 |
| **P6 · Revisado entre tres** | tras U10–U11 | Un documento trabajado por tres alumnos: comentarios respondidos y resueltos, control de cambios aceptado, versión anterior recuperable. **Criterio duro: el Comprobador de accesibilidad no marca ni un error.** | 101–113 |
| **Simulacro MO-110** | cierre de grado | Prueba cronometrada con el formato del examen real: 40-60 reactivos, 60 minutos, aprobatorio 700/1000 | todo Básico + Intermedio |

### Grado Avanzado

| Proyecto | Cuándo | Qué se entrega | Temas que obliga a combinar |
|---|---|---|---|
| **P7 · La plantilla institucional** | tras U12–U13 | Una plantilla `.dotx` de la escuela: estilos de párrafo y carácter propios, tema propio, numeración enlazada a los títulos, membrete como bloque de creación | 114–129 |
| **P8 · El manual** | tras U14 | 15+ páginas con índice alfabético, títulos de figura, tabla de ilustraciones y referencias cruzadas — todo generado, nada escrito a mano | 130–134 |
| **P9 · La campaña** | tras U15–U17 · **cierre del curso** | Correspondencia masiva desde una lista real, un formulario con controles de contenido, una macro que aplica el formato, el documento protegido, y un texto redactado con apoyo de IA que el alumno **verifica, cita y firma** | 135–154 |
| **Simulacro MO-111** | cierre de grado | Prueba cronometrada con el formato del examen Expert, 50 minutos | todo Avanzado |

### Lo que la espina hace posible decir

- Al terminar **Intermedio**, el alumno tiene cubierto **MO-110 completo** y ha producido tres documentos reales.
- Al terminar **Avanzado**, tiene cubierto **MO-111 completo** y una plantilla, un manual y una campaña que puede enseñar.

---

## 3. Rúbrica

Cinco criterios, los mismos en los tres grados; lo que sube es la exigencia. Tres niveles: **En proceso · Lo logra · Lo domina**. La tabla describe *lo domina*.

| Criterio | Básico | Intermedio | Avanzado |
|---|---|---|---|
| **Termina** | Entrega el documento guardado con su nombre y exportado a PDF | Entrega 6+ páginas con una tabla de contenido que se actualiza sola | Entrega desde su propia plantilla, protegida y lista para publicar |
| **Estructura** | Usa Título 1 y Título 2 en vez de agrandar la letra | Toda la jerarquía sale de estilos; la TDC y las figuras se generan solas | Crea sus propios estilos y los numera enlazados a los títulos |
| **Se lee** | Toda imagen lleva texto alternativo | El Comprobador de accesibilidad no marca ni un error | Exporta un PDF etiquetado y accesible |
| **Sin ayuda** | Encuentra la herramienta sabiendo en qué grupo de la cinta vive | Resuelve con buscar y reemplazar y el panel de navegación | Automatiza lo repetitivo con una macro o con correspondencia |
| **Honestidad** | Dice de dónde sacó la imagen | Cita cada fuente y cada dato en APA | Declara qué escribió con IA, lo verifica y lo firma |

### La advertencia de las horas

Microsoft calcula **~150 horas** de instrucción y práctica para presentar MO-110, y otras tantas para MO-111. Treinta clases de quince minutos son **siete horas y media**: un factor de veinte.

Lo que esto significa, dicho sin adornos: **con el curso completo el alumno va a reconocer Word, saber cómo se llama cada cosa y dónde vive — pero no va a quedar fluido.** La fluidez sale de los nueve proyectos y, sobre todo, de que Word sea la herramienta con la que entrega los trabajos de las demás materias. El curso abre la puerta; las horas las pone la escuela.

Y el simulador tiene techo: **Tecnia Textos** enseña conceptos, vocabulario y la geografía de la cinta —que es exactamente lo que hoy no existe—, pero no da la memoria muscular del Word de verdad. Conviene que la escuela pueda cerrar cada proyecto en Word real, aunque sea Word en la web, que es gratis.

---

## 4. Comprobación de cobertura

### 4.1 Contra MO-110 · Word Associate — 6 de 6 dominios, 18 de 18 subdominios

| Subdominio MO-110 | Temas que lo cubren |
|---|---|
| 1.1 Navigate within documents | 10, 11, 19, 75, 76, 77 |
| 1.2 Format documents | 39, 61, 62, 63, 83, 84, 85, 100 |
| 1.3 Save and share documents | 64, 65, 67, 69, 70, 71, 72 |
| 1.4 Inspect documents for issues | 109, 110, 111, 112, 146 |
| 2.1 Insert text | 18, 19, 20 |
| 2.2 Format text and paragraphs | 27–38, 74 |
| 2.3 Create and configure document sections | 63, 82, 86 |
| 3.1 Create tables | 45, 46, 87 |
| 3.2 Modify tables | 48, 49, 50, 88, 89, 90, 91, 92 |
| 3.3 Create and modify lists | 40, 41, 42, 43, 44 |
| 4.1 Footnotes and endnotes | 80 |
| 4.2 Tables of contents | 78, 79 |
| 5.1 Insert illustrations and text boxes | 51, 56, 57, 58, 94, 97, 98 |
| 5.2 Format illustrations and text boxes | 52, 95, 96, 98 |
| 5.3 Add text to graphic elements | 58, 94 |
| 5.4 Modify graphic elements | 53, 54, 60 |
| 6.1 Add and manage comments | 101, 102 |
| 6.2 Manage change tracking | 103, 104 |

### 4.2 Contra MO-111 · Word Expert — 4 de 4 dominios, 12 de 12 subdominios

| Subdominio MO-111 | Temas que lo cubren |
|---|---|
| E1.1 Manage documents and templates | 106, 107, 114, 115, 122, 142, 145 |
| E1.2 Prepare documents for collaboration | 143, 144 |
| E1.3 Use and configure language options | 128, 129 |
| E2.1 Find, replace, and paste content | 123, 124, 125 |
| E2.2 Configure paragraph layout options | 126, 127 |
| E2.3 Create and manage styles | 74, 116, 117, 118, 119 |
| E3.1 Create and modify building blocks | 121 |
| E3.2 Create custom design elements | 120 |
| E3.3 Create and manage indexes | 130, 131 |
| E3.4 Create and manage tables of figures | 132, 133 |
| E4.1 Manage forms, fields, and controls | 139, 140 |
| E4.2 Create and modify macros | 141, 142 |
| E4.3 Perform mail merges | 135, 136, 137, 138 |

### 4.3 Contra ICDL Documents 6.0 — 6 de 6 categorías

| Categoría ICDL | Temas |
|---|---|
| Using the Application | 2, 3, 4, 5, 6, 12, 15, 64, 65, 66, 73 |
| Document Creation | 9, 10, 11, 13–26 |
| Formatting | 27–44, 74 |
| Objects | 45–60, 87–100 |
| Mail Merge | 135–138 |
| Prepare Outputs | 61–72, 143–146 |

---

## 5. Lo que el temario anterior no cubría

El temario vigente en `curriculo.ts` tiene **12 temas** de Word. Éstos son los huecos, por gravedad:

### Huecos graves — están en el examen y no estaban en el temario

| Hueco | Objetivo |
|---|---|
| **Accesibilidad completa** — un dominio entero de MO-110, y obligación legal en documentos públicos en México | 1.4 |
| **Gestión del archivo**: crear, abrir, cerrar, varios documentos, formatos alternativos | ICDL · 1.3 |
| **Hipervínculos y marcadores** | 1.1 |
| **Notas al pie y al final** | 4.1 |
| **SmartArt, iconos, modelos 3D, captura de pantalla** | 5.1 |
| **Ajuste de texto y posición de objetos** — donde se rompen todos los trabajos escolares | 5.4 |
| **Quitar fondo, efectos artísticos, estilos de imagen** | 5.2 |
| **Insertar y eliminar filas y columnas; reiniciar la numeración; listas multinivel** | 3.2 · 3.3 |
| **Tabulaciones**, bordes de párrafo, conjuntos de estilos | 1.2 |
| **«Igual que el anterior»** y la numeración de página por sección | 1.2 |
| **Índice alfabético** | E3.3 |
| **Títulos de figura y tabla de ilustraciones** | E3.4 |
| **Crear y copiar estilos propios; numeración enlazada a los títulos** | E2.3 |
| **Comodines en buscar y reemplazar** — la herramienta más potente de Word, invisible | E2.1 |
| **Comparar y combinar documentos · historial de versiones** | E1.1 |
| **Bloques de creación, temas y conjuntos propios** | E3.1 · E3.2 |
| **Opciones de idioma** — relevante en un país bilingüe con lenguas originarias | E1.3 |
| **Paginación del párrafo e hifenación** — lo que separa un documento amateur de uno profesional | E2.2 |

### Huecos de época — no están en el examen y sí en la vida

| Hueco | Por qué |
|---|---|
| **Copilot** (8 temas) | Es como se escribe hoy, y es la promesa central de la plataforma |
| **Dictado, Lector inmersivo, leer en voz alta** | Puerta de entrada de un alumno con dislexia o discapacidad visual |
| **Coautoría en tiempo real, menciones @, historial** | El trabajo en equipo escolar ya ocurre así |
| **Word en la web y en el celular** | En México muchísimo alumno sólo tiene teléfono |
| **Compartir enlace en vez de archivo** | Cambia lo que un alumno entiende por «entregar» |
| **Abrir y editar un PDF en Word** | Es la operación que más se pide y casi nadie sabe que existe |
| **Citas y bibliografía** | Lo pide toda la secundaria y el bachillerato |
| **AutoGuardado y recuperación** | Es el miedo número uno de cualquiera que usa Word |

### Un tema que se retira, y no se repone

**«Documento maestro y subdocumentos».** No está en MO-110 ni en MO-111, y en la práctica lo sustituyen los estilos más la tabla de contenido.

### Lo que se deja fuera a propósito

| Fuera | Por qué |
|---|---|
| Programación VBA más allá de grabar una macro | Es un curso de programación, no de Word; el proyecto ya enseña a programar en N4 |
| Enlazar controles de contenido a XML | Nicho corporativo |
| Tabla de autoridades | Nicho jurídico |
| Publicar en un blog desde Word | Función muerta |
| Fórmulas dentro de una tabla de Word | Eso se enseña en Excel, y mejor |
| Sobres y etiquetas antes de bachillerato | No hay contexto de uso en primaria |

---

## 6. Qué implica para la sala de Word

**El tamaño real del encargo:**

| Pieza | Cuántas |
|---|---|
| Clases temáticas (3-6 temas cada una, ESTÁNDAR ROBUSTO v2) | ~30 |
| Proyectos | 9 |
| Simulacros de certificación | 2 |
| **Total** | **~41 piezas** |
| De ésas, construidas hoy | **8** |

**El reparto por grado cambia mucho** respecto de las 19 clases que la sala tiene contadas hoy:

| Grado | Contadas hoy | Con este temario |
|---|---|---|
| Básico | 10 | ~14 clases + 3 proyectos |
| Intermedio | 5 | ~8 clases + 3 proyectos + simulacro |
| Avanzado | 4 | ~9 clases + 3 proyectos + simulacro |

Y una realidad de plan que conviene tener escrita: **41 piezas es sólo Word.** Excel y PowerPoint vienen detrás con temarios de tamaño parecido. Eso no es una sala; es el trabajo de varios meses.

**Tres decisiones pendientes antes de llevar esto a `curriculo.ts`:**

1. **Copilot (U17)** — o el simulador se conecta a un modelo real, o la unidad se replantea sin simular la conversación. Fingir una IA es enseñar una IA falsa.
2. **Los proyectos** — ¿son actividades de la plataforma, o son tarea que el maestro califica en Word real? Cambia el alcance de construcción por completo.
3. **El desglose fino de MOS** — cotejar a mano contra los dos PDF oficiales de Microsoft antes de dar el temario por definitivo (ver la nota de fuente en §0.1).

---

## 7. Fuentes

- Microsoft Learn — [Exam MO-110: Microsoft Word (Microsoft 365 Apps)](https://learn.microsoft.com/en-us/credentials/certifications/exams/mo-110/) · [Skills measured PDF](https://arch-center.azureedge.net/Learning/Credentials/MO-110_OD_MOS365_Word.pdf)
- Microsoft Learn — [Microsoft Office Specialist: Word Expert (Microsoft 365 Apps) · MO-111](https://learn.microsoft.com/en-us/credentials/certifications/exams/mo-111/) · [Skills measured PDF](https://arch-center.azureedge.net/Learning/Credentials/MO-111_OD_MOS365_WordExpert.pdf)
- Desglose completo de objetivos MO-110 — [Testprep Training](https://testpreptraining.com/tutorial/exam-mo-110-microsoft-word-microsoft-365-apps/)
- Desglose completo de objetivos MO-111 — [CloudThat](https://www.cloudthat.com/training/microsoft-office/mo-111-microsoft-word-expert-microsoft-365-apps)
- Sílabo MO-110 y estructura del examen (40-60 reactivos · 60 min · 700/1000) — [EDUSUM](https://www.edusum.com/microsoft/microsoft-word-microsoft-365-apps-mos-word-associate-exam-syllabus)
- ICDL Workforce — [Documents Syllabus 6.0](https://icdl.org/wp-content/uploads/2024/01/ICDL-Documents-Syllabus-6.0-1.pdf) · [categorías y conjuntos de destrezas](https://icdlarabia.org/module-documents)
- Progresión escolar K-12 — [Typing.com · Keyboarding Curriculum](https://www.typing.com/curriculum/keyboarding) · [Education Week · How and When Students Learn to Type](https://www.edweek.org/technology/how-and-when-students-learn-to-type-in-charts/2024/11)
- Copilot en Word — [Microsoft · AI in Word](https://www.microsoft.com/en-us/microsoft-365/word/word-ai) · [Welcome to Copilot in Word](https://support.microsoft.com/en-us/word/welcome-to-copilot-in-word)
- Accesibilidad — [Microsoft · Improve accessibility with the Accessibility Checker](https://support.microsoft.com/en-us/office/improve-accessibility-with-the-accessibility-checker-a16f6de0-2f39-4a2b-8bd8-5ad801426c7f) · [Accessibility guide for Microsoft 365 Apps](https://learn.microsoft.com/en-us/microsoft-365-apps/deploy/accessibility-guide)
