import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowDown01,
  ArrowDownAZ,
  ArrowDownToLine,
  ArrowDownZA,
  ArrowRight,
  ArrowRightLeft,
  ArrowRightToLine,
  BarChart3,
  Baseline,
  BetweenHorizontalStart,
  BetweenVerticalStart,
  Binary,
  Bold,
  BookOpen,
  ChartColumn,
  ChartLine,
  ChartPie,
  Circle,
  CircleDot,
  Clipboard,
  ClipboardPen,
  ClipboardType,
  Copy,
  Divide,
  DollarSign,
  Droplet,
  Eraser,
  Eye,
  FileText,
  FoldHorizontal,
  FoldVertical,
  Grid2x2,
  Grid3x3,
  Hash,
  Image as IconoImagen,
  Indent,
  Italic,
  Layers,
  LayoutGrid,
  LayoutTemplate,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Maximize2,
  MessageSquarePlus,
  Minus,
  MonitorPlay,
  MoveHorizontal,
  MoveVertical,
  Network,
  Outdent,
  PaintBucket,
  Paintbrush,
  Palette,
  PanelBottom,
  PanelTop,
  Pencil,
  Percent,
  Pin,
  Play,
  Plus,
  Scissors,
  Search,
  Shapes,
  Sigma,
  Sparkles,
  SpellCheck,
  Square,
  SquareFunction,
  StickyNote,
  Table,
  TableCellsMerge,
  TableProperties,
  Tag,
  Timer,
  Trash2,
  TrendingDown,
  TrendingUp,
  Type,
  Underline,
  Video,
  Volume2,
  WrapText,
  ZoomIn,
  type LucideIcon,
} from 'lucide-react';

/**
 * Los iconos de la cinta, para toda la suite (§40.6).
 *
 * Estaba dentro de `VentanaTextos.tsx` y salió de ahí el 11-ago-2026 al construir
 * Tecnia Diapositivas. Es un mapa de id de control a icono y no sabe de Word ni
 * de PowerPoint: los ids que comparten —negrita, cursiva, imagen— comparten icono
 * a propósito, porque **un botón que se llama igual y se dibuja distinto es otro
 * botón para el alumno**. Ésa es la misma lección que obligó a que la ficha de la
 * herramienta dibujara el icono de la cinta y no su glifo de texto (§37.5).
 *
 * El control que no tenga icono se queda con su glifo, y eso es una señal útil:
 * significa que todavía no está construido de verdad.
 */
export const ICONOS: Record<string, LucideIcon> = {
  /* ── comunes ── */
  negrita: Bold,
  cursiva: Italic,
  subrayado: Underline,
  color: Baseline,
  vinetas: List,
  numeros: ListOrdered,
  izquierda: AlignLeft,
  centro: AlignCenter,
  derecha: AlignRight,
  justificado: AlignJustify,
  imagen: IconoImagen,
  formas: Shapes,
  cuadro: Square,
  tabla: Table,
  ortografia: SpellCheck,
  comentario: MessageSquarePlus,

  /* ── Tecnia Textos ── */
  pegar: Clipboard,
  copiar: Copy,
  cortar: Scissors,
  interlineado: Type,
  sangria: Indent,
  'quitar-sangria': Outdent,
  wordart: Type,
  encabezado: PanelTop,
  pie: PanelBottom,
  numero: Hash,
  margenes: FileText,
  tdc: List,
  nota: FileText,
  'control-cambios': Pencil,
  buscar: Search,

  /* ── Tecnia Diapositivas ── */
  nueva: Plus,
  'diseno-diapo': LayoutTemplate,
  duplicar: Copy,
  quitar: Trash2,
  organizar: Layers,
  smartart: Network,
  'gráfico': BarChart3,
  video: Video,
  audio: Volume2,
  vinculo: Link2,
  tema: Palette,
  fondo: Droplet,
  'tamano-diapo': Maximize2,
  'transicion-ninguna': Circle,
  'transicion-desvanecer': CircleDot,
  'transicion-empujar': ArrowRight,
  duracion: Timer,
  'aplicar-todo': Layers,
  'anim-aparecer': Sparkles,
  'anim-enfasis': CircleDot,
  'anim-salir': Sparkles,
  'panel-animacion': List,
  'desde-principio': Play,
  personalizada: LayoutGrid,
  ensayar: Timer,
  grabar: CircleDot,
  'vista-moderador': MonitorPlay,
  'vista-normal': LayoutTemplate,
  'vista-clasificador': LayoutGrid,
  'vista-notas': StickyNote,
  'vista-lectura': BookOpen,
  patron: Layers,

  /* ── Tecnia Hojas ─────────────────────────────────────────── */
  /*
   * Los ids que Excel comparte con las otras dos salas —`pegar`, `copiar`,
   * `cortar`, `negrita`, `cursiva`, `subrayado`, `buscar`— NO se repiten aquí:
   * ya están arriba y por eso mismo se dibujan igual en las tres ventanas, que
   * es la regla de la cabecera. Los que sí bajan son los que sólo existen en una
   * hoja de cálculo.
   *
   * Dos parejas comparten icono a propósito y no por descuido:
   *
   *   · `autosuma` y `fn-suma` llevan los dos la sigma. Son **la misma función
   *     por dos puertas** —el botón de Inicio y el de la Biblioteca de
   *     Fórmulas—, y dibujarlas distinto le diría al alumno que son dos cosas.
   *   · `ordenar-az` y `ordenar-za` sólo aparecen una vez en este mapa aunque
   *     salgan en dos pestañas de la cinta (`Inicio → Edición` y
   *     `Datos → Ordenar y filtrar`). Eso es justo lo que se quiere: en Excel de
   *     verdad son el mismo botón visto desde dos sitios.
   *
   * Y `formato-numero` se queda con el gato (`Hash`) y `millares` con los dígitos
   * agrupados (`Binary`) porque el grupo Número enseña el bloque 6 —el TIPO de la
   * celda— y ahí seis botones tienen que verse seis, no tres parecidos.
   */
  /*
   * El pegado especial (14-ago-2026). Los dos llevan un portapapeles con algo
   * encima —el `123` de los valores y la pluma del formato— porque son maneras
   * de PEGAR y tienen que verse de la familia del botón Pegar, no dos botones
   * sueltos. Y `pegar-formato` no lleva la brocha: la brocha es `copiar-formato`,
   * que es otra herramienta, y dos ids con el mismo dibujo serían el mismo botón
   * para el alumno.
   */
  'pegar-valores': ClipboardType,
  'pegar-formato': ClipboardPen,
  'copiar-formato': Paintbrush,
  'color-letra': Baseline,
  'color-relleno': PaintBucket,
  bordes: Grid2x2,
  'alinear-izquierda': AlignLeft,
  'alinear-centro': AlignCenter,
  'alinear-derecha': AlignRight,
  'ajustar-texto': WrapText,
  'combinar-centrar': TableCellsMerge,
  'formato-numero': Hash,
  moneda: DollarSign,
  porcentaje: Percent,
  millares: Binary,
  'decimal-mas': Plus,
  'decimal-menos': Minus,
  'insertar-fila': BetweenVerticalStart,
  'insertar-columna': BetweenHorizontalStart,
  'borrar-fila': FoldVertical,
  'borrar-columna': FoldHorizontal,
  'ancho-columna': MoveHorizontal,
  'alto-fila': MoveVertical,
  // Las dos de la hoja entera: mover la lengüeta de sitio y pintarla. La
  // etiqueta (`Tag`) y no una paleta, porque en Excel esto se llama «Color de
  // etiqueta» y lo que se pinta es la lengüeta, no la hoja.
  'mover-hoja': ArrowRightLeft,
  'color-hoja': Tag,
  autosuma: Sigma,
  'rellenar-abajo': ArrowDownToLine,
  'rellenar-derecha': ArrowRightToLine,
  // La serie es el mismo grupo que los dos de arriba y lleva flecha por eso; la
  // suya es la de «va contando» (`ArrowDown01`), que es justo lo que la separa
  // de rellenar hacia abajo, que copia.
  'rellenar-serie': ArrowDown01,
  'borrar-contenido': Eraser,
  'ordenar-az': ArrowDownAZ,
  'ordenar-za': ArrowDownZA,
  'grafico-columnas': ChartColumn,
  'grafico-lineas': ChartLine,
  'grafico-circular': ChartPie,
  'insertar-funcion': SquareFunction,
  'fn-suma': Sigma,
  'fn-promedio': Divide,
  'fn-max': TrendingUp,
  'fn-min': TrendingDown,
  'fn-contar': Hash,
  'fn-contara': ListChecks,
  'mostrar-formulas': Eye,
  'ver-cuadricula': Grid3x3,
  'ver-encabezados': TableProperties,
  inmovilizar: Pin,
  zoom: ZoomIn,
};
